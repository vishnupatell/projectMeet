import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/services/api';
import {
  uploadRecordingRequest,
  uploadRecordingSuccess,
  fetchRecordingsRequest,
  fetchRecordingsSuccess,
  deleteRecordingRequest,
  deleteRecordingSuccess,
  recordingFailure,
} from '../slices/recordingSlice';

function* handleUploadRecording(
  action: PayloadAction<{ blob: Blob; meetingId: string; startedAt: string }>,
): Generator<any, void, any> {
  try {
    const { blob, meetingId, startedAt } = action.payload;
    const response = yield call([apiClient, apiClient.uploadRecording], blob, meetingId, startedAt);
    yield put(uploadRecordingSuccess(response.data));
  } catch (error: any) {
    yield put(recordingFailure(error?.error?.message || 'Failed to upload recording'));
  }
}

function* handleFetchRecordings(): Generator<any, void, any> {
  try {
    const response = yield call([apiClient, apiClient.getMyRecordings]);
    yield put(fetchRecordingsSuccess(response.data));
  } catch (error: any) {
    yield put(recordingFailure(error?.error?.message || 'Failed to fetch recordings'));
  }
}

function* handleDeleteRecording(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    yield call([apiClient, apiClient.deleteRecording], action.payload);
    yield put(deleteRecordingSuccess(action.payload));
  } catch (error: any) {
    yield put(recordingFailure(error?.error?.message || 'Failed to delete recording'));
  }
}

export default function* recordingSaga() {
  yield takeLatest(uploadRecordingRequest.type, handleUploadRecording);
  yield takeLatest(fetchRecordingsRequest.type, handleFetchRecordings);
  yield takeLatest(deleteRecordingRequest.type, handleDeleteRecording);
}
