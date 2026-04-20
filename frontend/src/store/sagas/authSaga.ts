import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/services/api';
import { socketService } from '@/lib/services/socket';
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  loadProfileRequest,
  restoreSession,
  loginSuccess,
  registerSuccess,
  profileLoaded,
  authFailure,
  logoutSuccess,
} from '../slices/authSlice';

function* handleLogin(action: PayloadAction<{ email: string; password: string }>): Generator<any, void, any> {
  try {
    const response = yield call(
      [apiClient, apiClient.login],
      action.payload.email,
      action.payload.password,
    );

    const { accessToken, refreshToken, user } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Connect socket
    socketService.connect(accessToken);

    yield put(loginSuccess({ user, accessToken, refreshToken }));
  } catch (error: any) {
    const message = error?.error?.message || 'Login failed';
    yield put(authFailure(message));
  }
}

function* handleRegister(action: PayloadAction<{ email: string; password: string; displayName: string }>): Generator<any, void, any> {
  try {
    const response = yield call(
      [apiClient, apiClient.register],
      action.payload.email,
      action.payload.password,
      action.payload.displayName,
    );

    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    yield put(registerSuccess({ accessToken, refreshToken }));
    // Load profile after register
    yield put(loadProfileRequest());
  } catch (error: any) {
    const message = error?.error?.message || 'Registration failed';
    yield put(authFailure(message));
  }
}

function* handleLoadProfile(): Generator<any, void, any> {
  try {
    const response = yield call([apiClient, apiClient.getProfile]);
    const token = localStorage.getItem('accessToken');
    if (token) {
      socketService.connect(token);
    }
    yield put(profileLoaded(response.data));
  } catch (error: any) {
    const message = error?.error?.message || 'Failed to load profile';
    yield put(authFailure(message));
  }
}

function* handleLogout(): Generator<any, void, any> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      yield call([apiClient, apiClient.logout], refreshToken);
    }
  } catch {
    // Ignore logout API errors
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    socketService.disconnect();
    yield put(logoutSuccess());
  }
}

function* handleRestoreSession(): Generator<any, void, any> {
  const token = localStorage.getItem('accessToken');
  if (token) {
    yield put(loadProfileRequest());
  } else {
    yield put(logoutSuccess());
  }
}

export default function* authSaga() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(registerRequest.type, handleRegister);
  yield takeLatest(logoutRequest.type, handleLogout);
  yield takeLatest(loadProfileRequest.type, handleLoadProfile);
  yield takeLatest(restoreSession.type, handleRestoreSession);
}
