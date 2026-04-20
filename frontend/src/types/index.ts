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
