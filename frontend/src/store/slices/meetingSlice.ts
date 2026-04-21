import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Meeting } from '@/types';

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  newlyCreatedMeeting: Meeting | null;
  isLoading: boolean;
  error: string | null;
  isInMeeting: boolean;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  participants: { userId: string; displayName: string; avatarUrl: string | null; isAudioOn: boolean; isVideoOn: boolean }[];
}

const initialState: MeetingState = {
  meetings: [],
  currentMeeting: null,
  newlyCreatedMeeting: null,
  isLoading: false,
  error: null,
  isInMeeting: false,
  isAudioOn: true,
  isVideoOn: true,
  isScreenSharing: false,
  participants: [],
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    // Triggers
    fetchMeetingsRequest(state) {
      state.isLoading = true;
    },
    createMeetingRequest(
      state,
      _action: PayloadAction<{
        title: string;
        description?: string;
        scheduledAt?: string;
        inviteeEmails?: string[];
      }>,
    ) {
      state.isLoading = true;
      state.error = null;
    },
    joinMeetingRequest(state, _action: PayloadAction<{ code: string }>) {
      state.isLoading = true;
      state.error = null;
    },
    leaveMeetingRequest(state) {
      state.isLoading = true;
    },
    endMeetingRequest(state, _action: PayloadAction<string>) {
      state.isLoading = true;
    },

    // Success
    fetchMeetingsSuccess(state, action: PayloadAction<Meeting[]>) {
      state.meetings = action.payload;
      state.isLoading = false;
    },
    createMeetingSuccess(state, action: PayloadAction<Meeting>) {
      state.meetings.unshift(action.payload);
      state.newlyCreatedMeeting = action.payload;
      state.currentMeeting = action.payload;
      state.isLoading = false;
    },
    clearNewlyCreatedMeeting(state) {
      state.newlyCreatedMeeting = null;
    },
    joinMeetingSuccess(state, action: PayloadAction<Meeting>) {
      state.currentMeeting = action.payload;
      state.isInMeeting = true;
      state.isLoading = false;
    },
    leaveMeetingSuccess(state) {
      state.currentMeeting = null;
      state.isInMeeting = false;
      state.participants = [];
      state.isScreenSharing = false;
      state.isLoading = false;
    },
    endMeetingSuccess(state) {
      state.currentMeeting = null;
      state.isInMeeting = false;
      state.participants = [];
      state.isLoading = false;
    },

    // Failure
    deleteMeetingRequest(state, _action: PayloadAction<string>) {
      state.isLoading = true;
    },
    deleteMeetingSuccess(state, action: PayloadAction<string>) {
      state.meetings = state.meetings.filter((m) => m.id !== action.payload);
      state.isLoading = false;
    },
    meetingFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Real-time participant updates
    participantJoined(state, action: PayloadAction<{ userId: string; displayName: string; avatarUrl: string | null }>) {
      const exists = state.participants.find((p) => p.userId === action.payload.userId);
      if (!exists) {
        state.participants.push({ ...action.payload, isAudioOn: true, isVideoOn: true });
      }
    },
    participantLeft(state, action: PayloadAction<{ userId: string }>) {
      state.participants = state.participants.filter((p) => p.userId !== action.payload.userId);
    },
    participantToggleAudio(state, action: PayloadAction<{ userId: string; isAudioOn: boolean }>) {
      const p = state.participants.find((p) => p.userId === action.payload.userId);
      if (p) p.isAudioOn = action.payload.isAudioOn;
    },
    participantToggleVideo(state, action: PayloadAction<{ userId: string; isVideoOn: boolean }>) {
      const p = state.participants.find((p) => p.userId === action.payload.userId);
      if (p) p.isVideoOn = action.payload.isVideoOn;
    },

    // Local media controls
    setAudioOn(state, action: PayloadAction<boolean>) {
      state.isAudioOn = action.payload;
    },
    setVideoOn(state, action: PayloadAction<boolean>) {
      state.isVideoOn = action.payload;
    },
    setScreenSharing(state, action: PayloadAction<boolean>) {
      state.isScreenSharing = action.payload;
    },

    clearMeetingError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchMeetingsRequest,
  createMeetingRequest,
  joinMeetingRequest,
  leaveMeetingRequest,
  endMeetingRequest,
  fetchMeetingsSuccess,
  createMeetingSuccess,
  joinMeetingSuccess,
  leaveMeetingSuccess,
  endMeetingSuccess,
  deleteMeetingRequest,
  deleteMeetingSuccess,
  clearNewlyCreatedMeeting,
  meetingFailure,
  participantJoined,
  participantLeft,
  participantToggleAudio,
  participantToggleVideo,
  setAudioOn,
  setVideoOn,
  setScreenSharing,
  clearMeetingError,
} = meetingSlice.actions;

export default meetingSlice.reducer;
