import { call, put, takeLatest, select } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/services/api';
import {
  fetchMeetingsRequest,
  createMeetingRequest,
  joinMeetingRequest,
  leaveMeetingRequest,
  endMeetingRequest,
  deleteMeetingRequest,
  fetchMeetingsSuccess,
  createMeetingSuccess,
  joinMeetingSuccess,
  leaveMeetingSuccess,
  endMeetingSuccess,
  deleteMeetingSuccess,
  meetingFailure,
} from '../slices/meetingSlice';
import { selectCurrentMeeting } from '../selectors/meetingSelectors';

function* handleFetchMeetings(): Generator<any, void, any> {
  try {
    const response = yield call([apiClient, apiClient.getMeetings]);
    yield put(fetchMeetingsSuccess(response.data));
  } catch (error: any) {
    yield put(meetingFailure(error?.error?.message || 'Failed to fetch meetings'));
  }
}

function* handleCreateMeeting(
  action: PayloadAction<{ title: string; description?: string; scheduledAt?: string }>,
): Generator<any, void, any> {
  try {
    const { title, description, scheduledAt } = action.payload;
    const response = yield call(
      [apiClient, apiClient.createMeeting],
      title,
      description,
      scheduledAt,
    );
    yield put(createMeetingSuccess(response.data));
  } catch (error: any) {
    yield put(meetingFailure(error?.error?.message || 'Failed to create meeting'));
  }
}

function* handleJoinMeeting(
  action: PayloadAction<{ code: string }>,
): Generator<any, void, any> {
  try {
    const response = yield call(
      [apiClient, apiClient.joinMeeting],
      action.payload.code,
    );
    yield put(joinMeetingSuccess(response.data));
  } catch (error: any) {
    yield put(meetingFailure(error?.error?.message || 'Failed to join meeting'));
  }
}

function* handleLeaveMeeting(): Generator<any, void, any> {
  try {
    const currentMeeting: any = yield select(selectCurrentMeeting);
    if (currentMeeting?.id) {
      yield call([apiClient, apiClient.leaveMeeting], currentMeeting.id);
    }
    yield put(leaveMeetingSuccess());
  } catch (error: any) {
    yield put(leaveMeetingSuccess()); // still leave UI even if API fails
  }
}

function* handleEndMeeting(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    if (action.payload) {
      yield call([apiClient, apiClient.endMeeting], action.payload);
    } else {
      const currentMeeting: any = yield select(selectCurrentMeeting);
      if (currentMeeting?.id) {
        yield call([apiClient, apiClient.endMeeting], currentMeeting.id);
      }
    }
    yield put(endMeetingSuccess());
  } catch (error: any) {
    yield put(endMeetingSuccess()); // still end in UI
  }
}

function* handleDeleteMeeting(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    yield put(deleteMeetingSuccess(action.payload));
  } catch (error: any) {
    yield put(meetingFailure(error?.error?.message || 'Failed to delete meeting'));
  }
}

export default function* meetingSaga() {
  yield takeLatest(fetchMeetingsRequest.type, handleFetchMeetings);
  yield takeLatest(createMeetingRequest.type, handleCreateMeeting);
  yield takeLatest(joinMeetingRequest.type, handleJoinMeeting);
  yield takeLatest(leaveMeetingRequest.type, handleLeaveMeeting);
  yield takeLatest(endMeetingRequest.type, handleEndMeeting);
  yield takeLatest(deleteMeetingRequest.type, handleDeleteMeeting);
}
