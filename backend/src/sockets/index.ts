import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getRedisClient, createRedisSubscriber } from '../config/redis';
import { logger } from '../utils/logger';
import { meetingService } from '../services/meeting.service';
import { chatService } from '../services/chat.service';
import { AuthPayload } from '../middlewares/auth.middleware';
import { isCorsOriginAllowed } from '../utils/cors.util';

interface SocketData {
  user: AuthPayload;
  meetingId?: string;
}

// Track room participants in memory (backed by Redis for multi-instance)
const roomParticipants = new Map<string, Set<string>>();

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

    socket.on('meeting:join', async (data: { meetingCode: string }) => {
      try {
        const meeting = await meetingService.getMeetingByCode(data.meetingCode);
        const meetingRoom = `meeting:${meeting.id}`;
        socket.data.meetingId = meeting.id;

        // Track participant
        if (!roomParticipants.has(meetingRoom)) {
          roomParticipants.set(meetingRoom, new Set());
        }
        roomParticipants.get(meetingRoom)!.add(userId);

        socket.join(meetingRoom);

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

        logger.info({ userId, meetingId: meeting.id }, 'User joined meeting room');
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
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

  try {
    await meetingService.leaveMeeting(meetingId, userId);
  } catch (error) {
    logger.error({ error, userId, meetingId }, 'Error leaving meeting');
  }
}
