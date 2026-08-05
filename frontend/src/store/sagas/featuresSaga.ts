import { takeLatest, put, call } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { API_URL } from '@/lib/config';
import {
  setPolls,
  setSharedFiles,
  setActionItems,
  setBreakoutRooms,
  addPoll,
  addSharedFile,
  addActionItem,
  updateActionItem as updateActionItemAction,
  removeActionItem,
} from '../slices/featuresSlice';

// Helper to get auth token
function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken') || '';
}

function* fetchMeetingPolls(action: PayloadAction<string>) {
  try {
    const response: Response = yield call(fetch, `${API_URL}/polls/meeting/${action.payload}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data: { success: boolean; data: any[] } = yield call([response, 'json']);
    if (data.success) {
      yield put(setPolls(data.data));
    }
  } catch (error) {
    console.error('Failed to fetch polls:', error);
  }
}

function* createPoll(action: PayloadAction<{ meetingId: string; question: string; options: string[]; isAnonymous?: boolean }>) {
  try {
    const response: Response = yield call(fetch, `${API_URL}/polls/meeting/${action.payload.meetingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        question: action.payload.question,
        options: action.payload.options,
        isAnonymous: action.payload.isAnonymous,
      }),
    });
    const data: { success: boolean; data: any } = yield call([response, 'json']);
    if (data.success) {
      yield put(addPoll(data.data));
    }
  } catch (error) {
    console.error('Failed to create poll:', error);
  }
}

function* fetchMeetingFiles(action: PayloadAction<string>) {
  try {
    const response: Response = yield call(fetch, `${API_URL}/files/meeting/${action.payload}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data: { success: boolean; data: any[] } = yield call([response, 'json']);
    if (data.success) {
      yield put(setSharedFiles(data.data));
    }
  } catch (error) {
    console.error('Failed to fetch files:', error);
  }
}

function* fetchActionItems(action: PayloadAction<string>) {
  try {
    const response: Response = yield call(fetch, `${API_URL}/action-items/meeting/${action.payload}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data: { success: boolean; data: any[] } = yield call([response, 'json']);
    if (data.success) {
      yield put(setActionItems(data.data));
    }
  } catch (error) {
    console.error('Failed to fetch action items:', error);
  }
}

function* createActionItem(action: PayloadAction<{ meetingId: string; title: string; assigneeId?: string }>) {
  try {
    const response: Response = yield call(fetch, `${API_URL}/action-items/meeting/${action.payload.meetingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ title: action.payload.title, assigneeId: action.payload.assigneeId }),
    });
    const data: { success: boolean; data: any } = yield call([response, 'json']);
    if (data.success) {
      yield put(addActionItem(data.data));
    }
  } catch (error) {
    console.error('Failed to create action item:', error);
  }
}

function* fetchBreakoutRooms(action: PayloadAction<string>) {
  try {
    const response: Response = yield call(fetch, `${API_URL}/breakout-rooms/meeting/${action.payload}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data: { success: boolean; data: any[] } = yield call([response, 'json']);
    if (data.success) {
      yield put(setBreakoutRooms(data.data));
    }
  } catch (error) {
    console.error('Failed to fetch breakout rooms:', error);
  }
}

// Action types for saga triggers
const FETCH_POLLS = 'features/fetchPollsRequest';
const CREATE_POLL = 'features/createPollRequest';
const FETCH_FILES = 'features/fetchFilesRequest';
const FETCH_ACTION_ITEMS = 'features/fetchActionItemsRequest';
const CREATE_ACTION_ITEM = 'features/createActionItemRequest';
const FETCH_BREAKOUT_ROOMS = 'features/fetchBreakoutRoomsRequest';

export default function* featuresSaga() {
  yield takeLatest(FETCH_POLLS, fetchMeetingPolls);
  yield takeLatest(CREATE_POLL, createPoll);
  yield takeLatest(FETCH_FILES, fetchMeetingFiles);
  yield takeLatest(FETCH_ACTION_ITEMS, fetchActionItems);
  yield takeLatest(CREATE_ACTION_ITEM, createActionItem);
  yield takeLatest(FETCH_BREAKOUT_ROOMS, fetchBreakoutRooms);
}

// Action creators for saga triggers
export const fetchPollsRequest = (meetingId: string) => ({ type: FETCH_POLLS, payload: meetingId });
export const createPollRequest = (data: { meetingId: string; question: string; options: string[]; isAnonymous?: boolean }) => ({ type: CREATE_POLL, payload: data });
export const fetchFilesRequest = (meetingId: string) => ({ type: FETCH_FILES, payload: meetingId });
export const fetchActionItemsRequest = (meetingId: string) => ({ type: FETCH_ACTION_ITEMS, payload: meetingId });
export const createActionItemRequest = (data: { meetingId: string; title: string; assigneeId?: string }) => ({ type: CREATE_ACTION_ITEM, payload: data });
export const fetchBreakoutRoomsRequest = (meetingId: string) => ({ type: FETCH_BREAKOUT_ROOMS, payload: meetingId });
