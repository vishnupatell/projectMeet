import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Recording {
  id: string;
  meetingId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  meeting?: { id: string; title: string; code: string };
  recordedBy?: { id: string; displayName: string; avatarUrl: string | null };
}

interface RecordingState {
  recordings: Recording[];
  isRecording: boolean;
  isUploading: boolean;
  error: string | null;
}

const initialState: RecordingState = {
  recordings: [],
  isRecording: false,
  isUploading: false,
  error: null,
};

const recordingSlice = createSlice({
  name: 'recording',
  initialState,
  reducers: {
    startRecordingRequest(state) {
      state.isRecording = true;
      state.error = null;
    },
    stopRecordingRequest(state) {
      state.isRecording = false;
    },
    uploadRecordingRequest(
      state,
      _action: PayloadAction<{ blob: Blob; meetingId: string; startedAt: string }>,
    ) {
      state.isUploading = true;
      state.error = null;
    },
    uploadRecordingSuccess(state, action: PayloadAction<Recording>) {
      state.isUploading = false;
      state.recordings.unshift(action.payload);
    },
    fetchRecordingsRequest(state) {
      state.error = null;
    },
    fetchRecordingsSuccess(state, action: PayloadAction<Recording[]>) {
      state.recordings = action.payload;
    },
    deleteRecordingRequest(state, _action: PayloadAction<string>) {
      state.error = null;
    },
    deleteRecordingSuccess(state, action: PayloadAction<string>) {
      state.recordings = state.recordings.filter((r) => r.id !== action.payload);
    },
    recordingFailure(state, action: PayloadAction<string>) {
      state.isUploading = false;
      state.error = action.payload;
    },
  },
});

export const {
  startRecordingRequest,
  stopRecordingRequest,
  uploadRecordingRequest,
  uploadRecordingSuccess,
  fetchRecordingsRequest,
  fetchRecordingsSuccess,
  deleteRecordingRequest,
  deleteRecordingSuccess,
  recordingFailure,
} = recordingSlice.actions;

export default recordingSlice.reducer;
