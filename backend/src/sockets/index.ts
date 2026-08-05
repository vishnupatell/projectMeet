import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getRedisClient, createRedisSubscriber } from '../config/redis';
import { logger } from '../utils/logger';
import { meetingService } from '../services/meeting.service';
import { chatService } from '../services/chat.service';
import { analyticsService } from '../services/analytics.service';
import { webhookService } from '../services/webhook.service';
import { AuthPayload } from '../middlewares/auth.middleware';
import { isCorsOriginAllowed } from '../utils/cors.util';

interface SocketData {
  user: AuthPayload;
  meetingId?: string;
}

// Track room participants in memory (backed by Redis for multi-instance)
const roomParticipants = new Map<string, Set<string>>();
// Waiting room: meetingId -> Set of { userId, socketId, displayName }
const waitingRoom = new Map<string, Map<string, { socketId: string; displayName: string }>>();
// Reactions cooldown
const reactionCooldowns = new Map<string, number>();

export function initializeSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isCorsOriginAllowed(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Redis adapter for horizontal scaling
  // When running multiple backend instances behind a load balancer,
  // this ensures Socket.IO events are shared across all instances.
  const pubClient = getRedisClient();
  const subClient = createRedisSubscriber();
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      (socket as Socket & { data: SocketData }).data = { user: decoded };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket & { data: SocketData }) => {
    const userId = socket.data.user.userId;
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    // Join user's personal room for DM notifications
    socket.join(`user:${userId}`);

    // ============================================
    // MEETING / WEBRTC SIGNALING
    // ============================================

    socket.on('meeting:join', async (data: { meetingCode: string; password?: string }) => {
      try {
        const meeting = await meetingService.getMeetingByCode(data.meetingCode);
        const meetingRoom = `meeting:${meeting.id}`;

        // Password check
        if ((meeting as any).password && (meeting as any).password !== data.password) {
          socket.emit('meeting:password-required', { meetingId: meeting.id });
          return;
        }

        // Waiting room check
        if ((meeting as any).waitingRoomEnabled && meeting.ownerId !== userId) {
          // Add to waiting room
          if (!waitingRoom.has(meeting.id)) {
            waitingRoom.set(meeting.id, new Map());
          }
          waitingRoom.get(meeting.id)!.set(userId, {
            socketId: socket.id,
            displayName: socket.data.user.userId, // Will be resolved by client
          });

          socket.emit('meeting:waiting-room', { meetingId: meeting.id });

          // Notify host
          io.to(meetingRoom).emit('meeting:waiting-room-update', {
            waiting: Array.from(waitingRoom.get(meeting.id)!.entries()).map(([uid, data]) => ({
              userId: uid,
              ...data,
            })),
          });
          return;
        }

        socket.data.meetingId = meeting.id;

        // Track participant
        if (!roomParticipants.has(meetingRoom)) {
          roomParticipants.set(meetingRoom, new Set());
        }
        roomParticipants.get(meetingRoom)!.add(userId);

        socket.join(meetingRoom);

        // Analytics
        analyticsService.recordJoin(meeting.id, userId).catch(() => {});

        // Notify others in the room
        socket.to(meetingRoom).emit('meeting:user-joined', {
          userId,
          socketId: socket.id,
        });

        // Send existing participants to the new joiner
        const participants = Array.from(roomParticipants.get(meetingRoom) || [])
          .filter((id) => id !== userId);

        socket.emit('meeting:existing-participants', {
          participants,
          meetingId: meeting.id,
        });

        // Webhook
        webhookService.triggerEvent('participant.joined', {
          meetingId: meeting.id,
          meetingCode: meeting.code,
          userId,
        }).catch(() => {});

        logger.info({ userId, meetingId: meeting.id }, 'User joined meeting room');
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Waiting room: admit participant
    socket.on('meeting:admit-participant', (data: { meetingId: string; targetUserId: string }) => {
      const waitingUsers = waitingRoom.get(data.meetingId);
      if (!waitingUsers) return;

      const waitingUser = waitingUsers.get(data.targetUserId);
      if (!waitingUser) return;

      waitingUsers.delete(data.targetUserId);

      // Notify the waiting user they can join
      io.to(waitingUser.socketId).emit('meeting:admitted', { meetingId: data.meetingId });
    });

    // Waiting room: admit all
    socket.on('meeting:admit-all', (data: { meetingId: string }) => {
      const waitingUsers = waitingRoom.get(data.meetingId);
      if (!waitingUsers) return;

      for (const [uid, userData] of waitingUsers) {
        io.to(userData.socketId).emit('meeting:admitted', { meetingId: data.meetingId });
      }
      waitingUsers.clear();
    });

    // Waiting room: deny participant
    socket.on('meeting:deny-participant', (data: { meetingId: string; targetUserId: string }) => {
      const waitingUsers = waitingRoom.get(data.meetingId);
      if (!waitingUsers) return;

      const waitingUser = waitingUsers.get(data.targetUserId);
      if (!waitingUser) return;

      waitingUsers.delete(data.targetUserId);
      io.to(waitingUser.socketId).emit('meeting:denied', { meetingId: data.meetingId });
    });

    socket.on('meeting:leave', async () => {
      await handleMeetingLeave(socket, io);
    });

    // WebRTC Signaling: Offer
    socket.on('webrtc:offer', (data: { targetUserId: string; offer: any }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      io.to(meetingRoom).emit('webrtc:offer', {
        offer: data.offer,
        fromUserId: userId,
        fromSocketId: socket.id,
        targetUserId: data.targetUserId,
      });
    });

    // WebRTC Signaling: Answer
    socket.on('webrtc:answer', (data: { targetUserId: string; answer: any }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      io.to(meetingRoom).emit('webrtc:answer', {
        answer: data.answer,
        fromUserId: userId,
        fromSocketId: socket.id,
        targetUserId: data.targetUserId,
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('webrtc:ice-candidate', (data: { targetUserId: string; candidate: any }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      io.to(meetingRoom).emit('webrtc:ice-candidate', {
        candidate: data.candidate,
        fromUserId: userId,
        fromSocketId: socket.id,
        targetUserId: data.targetUserId,
      });
    });

    // Media state changes
    socket.on('meeting:toggle-audio', (data: { isAudioOn: boolean }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:user-toggle-audio', {
        userId,
        isAudioOn: data.isAudioOn,
      });
    });

    socket.on('meeting:toggle-video', (data: { isVideoOn: boolean }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:user-toggle-video', {
        userId,
        isVideoOn: data.isVideoOn,
      });
    });

    // Screen sharing
    socket.on('meeting:screen-share-start', () => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:screen-share-started', { userId });
    });

    socket.on('meeting:screen-share-stop', () => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:screen-share-stopped', { userId });
    });

    // Recording
    socket.on('meeting:recording-start', () => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:recording-started', { userId });
    });

    socket.on('meeting:recording-stop', () => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:recording-stopped', { userId });
    });

    // ============================================
    // REACTIONS & RAISE HAND
    // ============================================

    socket.on('meeting:reaction', (data: { emoji: string }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      // Rate limit reactions (1 per second per user)
      const cooldownKey = `${userId}:reaction`;
      const now = Date.now();
      if (reactionCooldowns.has(cooldownKey) && now - reactionCooldowns.get(cooldownKey)! < 1000) {
        return;
      }
      reactionCooldowns.set(cooldownKey, now);

      io.to(meetingRoom).emit('meeting:reaction', {
        userId,
        emoji: data.emoji,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('meeting:raise-hand', (data: { raised: boolean }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      io.to(meetingRoom).emit('meeting:hand-raised', {
        userId,
        raised: data.raised,
      });
    });

    // ============================================
    // POLLS (realtime updates)
    // ============================================

    socket.on('poll:created', (data: { poll: any }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('poll:new', data.poll);
    });

    socket.on('poll:voted', (data: { pollId: string; results: any }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      io.to(meetingRoom).emit('poll:updated', {
        pollId: data.pollId,
        results: data.results,
      });
    });

    socket.on('poll:closed', (data: { pollId: string; results: any }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      io.to(meetingRoom).emit('poll:ended', {
        pollId: data.pollId,
        results: data.results,
      });
    });

    // ============================================
    // WHITEBOARD (collaborative drawing)
    // ============================================

    socket.on('whiteboard:draw', (data: { points: any[]; color: string; width: number; tool: string }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('whiteboard:draw', {
        userId,
        ...data,
      });
    });

    socket.on('whiteboard:clear', () => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('whiteboard:cleared', { userId });
    });

    socket.on('whiteboard:undo', () => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('whiteboard:undo', { userId });
    });

    // ============================================
    // BREAKOUT ROOMS (realtime signaling)
    // ============================================

    socket.on('breakout:join', (data: { roomId: string }) => {
      const breakoutRoom = `breakout:${data.roomId}`;
      socket.join(breakoutRoom);
      socket.to(breakoutRoom).emit('breakout:user-joined', { userId });
    });

    socket.on('breakout:leave', (data: { roomId: string }) => {
      const breakoutRoom = `breakout:${data.roomId}`;
      socket.leave(breakoutRoom);
      socket.to(breakoutRoom).emit('breakout:user-left', { userId });
    });

    socket.on('breakout:broadcast', (data: { meetingId: string; message: string }) => {
      // Host broadcasts a message to all breakout rooms
      const meetingRoom = `meeting:${data.meetingId}`;
      io.to(meetingRoom).emit('breakout:host-broadcast', {
        message: data.message,
        from: userId,
      });
    });

    socket.on('breakout:close-all', (data: { meetingId: string }) => {
      const meetingRoom = `meeting:${data.meetingId}`;
      io.to(meetingRoom).emit('breakout:rooms-closed', { closedBy: userId });
    });

    // ============================================
    // LIVE CAPTIONS & TRANSLATION
    // ============================================

    socket.on('meeting:caption', (data: { text: string; language: string; isFinal: boolean }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:caption', {
        userId,
        text: data.text,
        language: data.language,
        isFinal: data.isFinal,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('meeting:request-translation', (data: { targetLanguage: string }) => {
      // This signals the AI service to start translating captions
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:translation-requested', {
        userId,
        targetLanguage: data.targetLanguage,
      });
    });

    // ============================================
    // SPEAKING INDICATOR (for analytics)
    // ============================================

    socket.on('meeting:speaking-start', () => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:user-speaking', { userId, speaking: true });
    });

    socket.on('meeting:speaking-stop', (data: { duration: number }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:user-speaking', { userId, speaking: false });
      // Update analytics
      if (socket.data.meetingId && data.duration > 0) {
        analyticsService.updateSpeakingTime(socket.data.meetingId, userId, Math.round(data.duration)).catch(() => {});
      }
    });

    // ============================================
    // FILE SHARING NOTIFICATION
    // ============================================

    socket.on('meeting:file-shared', (data: { file: any }) => {
      const meetingRoom = `meeting:${socket.data.meetingId}`;
      socket.to(meetingRoom).emit('meeting:file-shared', {
        userId,
        file: data.file,
      });
    });

    // ============================================
    // CHAT
    // ============================================

    socket.on('chat:join', (data: { chatId: string }) => {
      socket.join(`chat:${data.chatId}`);
    });

    socket.on('chat:message', async (data: { chatId: string; content: string }) => {
      try {
        const message = await chatService.sendMessage(
          { chatId: data.chatId, content: data.content },
          userId,
        );

        io.to(`chat:${data.chatId}`).emit('chat:new-message', message);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('chat:typing', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('chat:user-typing', {
        userId,
        chatId: data.chatId,
      });
    });

    socket.on('chat:stop-typing', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('chat:user-stop-typing', {
        userId,
        chatId: data.chatId,
      });
    });

    // ============================================
    // DISCONNECT
    // ============================================

    socket.on('disconnect', async (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Socket disconnected');
      await handleMeetingLeave(socket, io);
    });
  });

  logger.info('Socket.IO server initialized with Redis adapter');
  return io;
}

async function handleMeetingLeave(socket: Socket & { data: SocketData }, io: Server) {
  const userId = socket.data.user?.userId;
  const meetingId = socket.data.meetingId;

  if (!meetingId || !userId) return;

  const meetingRoom = `meeting:${meetingId}`;

  // Remove from tracking
  roomParticipants.get(meetingRoom)?.delete(userId);
  if (roomParticipants.get(meetingRoom)?.size === 0) {
    roomParticipants.delete(meetingRoom);
  }

  socket.leave(meetingRoom);
  socket.data.meetingId = undefined;

  // Notify others
  io.to(meetingRoom).emit('meeting:user-left', {
    userId,
    socketId: socket.id,
  });

  // Analytics
  analyticsService.recordLeave(meetingId, userId).catch(() => {});

  // Webhook
  webhookService.triggerEvent('participant.left', {
    meetingId,
    userId,
  }).catch(() => {});

  try {
    await meetingService.leaveMeeting(meetingId, userId);
  } catch (error) {
    logger.error({ error, userId, meetingId }, 'Error leaving meeting');
  }
}
