import { RootState } from '../index';

export const selectRecordings = (state: RootState) => state.recording.recordings;
export const selectIsRecording = (state: RootState) => state.recording.isRecording;
export const selectIsUploadingRecording = (state: RootState) => state.recording.isUploading;
export const selectRecordingError = (state: RootState) => state.recording.error;
