import { API_URL } from '../config';
import type { ApiResponse } from '@/types';

class ApiClient {
  private baseUrl: string;
  private static readonly DATETIME_LOCAL_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof globalThis.window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // If 401, try to refresh token
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${this.getToken()}`,
          };
          const retry = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });
          return retry.json();
        }
      }
      throw data;
    }

    return data;
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return false;
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async register(email: string, password: string, displayName: string) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(refreshToken: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Meetings
  async createMeeting(
    title: string,
    description?: string,
    scheduledAt?: string,
    inviteeEmails?: string[],
  ) {
    const normalizedScheduledAt = this.normalizeScheduledAt(scheduledAt);

    return this.request<any>('/meetings', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        scheduledAt: normalizedScheduledAt,
        inviteeEmails:
          inviteeEmails && inviteeEmails.length > 0 ? inviteeEmails : undefined,
      }),
    });
  }

  private normalizeScheduledAt(scheduledAt?: string): string | undefined {
    if (!scheduledAt) return undefined;

    const trimmedValue = scheduledAt.trim();
    if (!trimmedValue) return undefined;

    const normalizedValue = ApiClient.DATETIME_LOCAL_REGEX.test(trimmedValue)
      ? `${trimmedValue}:00`
      : trimmedValue;
    const parsedDate = new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) return scheduledAt;
    return parsedDate.toISOString();
  }

  async getMeetings() {
    return this.request<any>('/meetings');
  }

  async getMeetingByCode(code: string) {
    return this.request<any>(`/meetings/code/${code}`);
  }

  async joinMeeting(code: string) {
    return this.request<any>('/meetings/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async leaveMeeting(meetingId: string) {
    return this.request<any>(`/meetings/${meetingId}/leave`, {
      method: 'POST',
    });
  }

  async endMeeting(meetingId: string) {
    return this.request<any>(`/meetings/${meetingId}/end`, {
      method: 'POST',
    });
  }

  async getIceServers() {
    return this.request<any>('/meetings/ice-servers');
  }

  // Chat
  async getChats() {
    return this.request<any>('/chats');
  }

  async getMessages(chatId: string, cursor?: string) {
    const params = cursor ? `?cursor=${cursor}` : '';
    return this.request<any>(`/chats/${chatId}/messages${params}`);
  }

  async sendMessage(chatId: string, content: string) {
    return this.request<any>('/chats/messages', {
      method: 'POST',
      body: JSON.stringify({ chatId, content }),
    });
  }

  // Recordings
  async uploadRecording(blob: Blob, meetingId: string, startedAt: string) {
    const token = this.getToken();
    const formData = new FormData();
    const ext = blob.type.includes('webm') ? '.webm' : '.mp4';
    formData.append('recording', blob, `recording${ext}`);
    formData.append('meetingId', meetingId);
    formData.append('startedAt', startedAt);

    const response = await fetch(`${this.baseUrl}/recordings/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }

  async getMyRecordings() {
    return this.request<any>('/recordings/my');
  }

  async getMeetingRecordings(meetingId: string) {
    return this.request<any>(`/recordings/meeting/${meetingId}`);
  }

  async deleteRecording(recordingId: string) {
    return this.request<any>(`/recordings/${recordingId}`, { method: 'DELETE' });
  }

  getRecordingDownloadUrl(recordingId: string): string {
    const token = this.getToken();
    const query = token ? `?token=${token}` : '';
    return `${this.baseUrl}/recordings/${recordingId}/download${query}`;
  }

  // Transcripts
  async getTranscriptByRecording(recordingId: string) {
    return this.request<any>(`/transcripts/recording/${recordingId}`);
  }

  async generateTranscript(recordingId: string) {
    return this.request<any>(`/transcripts/recording/${recordingId}/generate`, {
      method: 'POST',
    });
  }

  async getMeetingTranscripts(meetingId: string) {
    return this.request<any>(`/transcripts/meeting/${meetingId}`);
  }
}

export const apiClient = new ApiClient(API_URL);
