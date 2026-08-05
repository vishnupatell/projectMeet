// ============================================
// Shared Types
// ============================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface Meeting {
  id: string;
  code: string;
  title: string;
  description: string | null;
  ownerId: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  maxParticipants: number;
  isRecording: boolean;
  password?: string | null;
  waitingRoomEnabled?: boolean;
  e2eeEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  participants: MeetingParticipant[];
  chat: Chat | null;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  role: 'HOST' | 'CO_HOST' | 'PARTICIPANT';
  joinedAt: string;
  leftAt: string | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface Chat {
  id: string;
  meetingId: string | null;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  createdAt: string;
  members: ChatMember[];
  messages?: Message[];
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'FILE';
  createdAt: string;
  sender: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface Poll {
  id: string;
  meetingId: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  isAnonymous: boolean;
  createdAt: string;
  closedAt: string | null;
  votes?: PollVote[];
  results?: PollOptionResult[];
}

export interface PollOption {
  id: string;
  text: string;
}

export interface PollOptionResult extends PollOption {
  votes: number;
  voters: Pick<User, 'id' | 'displayName'>[];
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  optionId: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface BreakoutRoom {
  id: string;
  meetingId: string;
  name: string;
  isActive: boolean;
  duration: number | null;
  participants: { id: string; userId: string }[];
}

export interface SharedFile {
  id: string;
  meetingId: string;
  uploaderId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploader: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string | null;
  assignee: Pick<User, 'id' | 'displayName' | 'avatarUrl'> | null;
}

export interface MeetingAnalytics {
  id: string;
  meetingId: string;
  totalDuration: number;
  peakParticipants: number;
  totalParticipants: number;
  speakingData: Record<string, number>;
  joinLeaveLog: { userId: string; action: string; timestamp: string }[];
}

export interface Caption {
  userId: string;
  text: string;
  language: string;
  isFinal: boolean;
  timestamp: string;
}

export interface WhiteboardStroke {
  userId: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface IceServer {
  urls: string;
  username?: string;
  credential?: string;
}

export interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  displayName: string;
  avatarUrl: string | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
}
