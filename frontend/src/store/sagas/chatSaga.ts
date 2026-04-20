import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/services/api';
import {
  fetchChatsRequest,
  fetchMessagesRequest,
  sendMessageRequest,
  fetchChatsSuccess,
  fetchMessagesSuccess,
  chatFailure,
} from '../slices/chatSlice';

function* handleFetchChats(): Generator<any, void, any> {
  try {
    const response = yield call([apiClient, apiClient.getChats]);
    yield put(fetchChatsSuccess(response.data));
  } catch (error: any) {
    yield put(chatFailure(error?.error?.message || 'Failed to fetch chats'));
  }
}

function* handleFetchMessages(
  action: PayloadAction<{ chatId: string; cursor?: string }>,
): Generator<any, void, any> {
  try {
    const response = yield call(
      [apiClient, apiClient.getMessages],
      action.payload.chatId,
      action.payload.cursor,
    );
    yield put(fetchMessagesSuccess({
      chatId: action.payload.chatId,
      messages: response.data,
    }));
  } catch (error: any) {
    yield put(chatFailure(error?.error?.message || 'Failed to fetch messages'));
  }
}

function* handleSendMessage(
  action: PayloadAction<{ chatId: string; content: string }>,
): Generator<any, void, any> {
  try {
    yield call(
      [apiClient, apiClient.sendMessage],
      action.payload.chatId,
      action.payload.content,
    );
    // Message will arrive via socket
  } catch (error: any) {
    yield put(chatFailure(error?.error?.message || 'Failed to send message'));
  }
}

export default function* chatSaga() {
  yield takeLatest(fetchChatsRequest.type, handleFetchChats);
  yield takeLatest(fetchMessagesRequest.type, handleFetchMessages);
  yield takeLatest(sendMessageRequest.type, handleSendMessage);
}
