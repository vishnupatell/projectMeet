import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Triggers
    loginRequest(state, _action: PayloadAction<{ email: string; password: string }>) {
      state.isLoading = true;
      state.error = null;
    },
    registerRequest(state, _action: PayloadAction<{ email: string; password: string; displayName: string }>) {
      state.isLoading = true;
      state.error = null;
    },
    logoutRequest(state) {
      state.isLoading = true;
    },
    loadProfileRequest(state) {
      state.isLoading = true;
    },
    restoreSession(state) {
      state.isLoading = true;
    },

    // Success
    loginSuccess(state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    registerSuccess(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isLoading = false;
      state.error = null;
    },
    profileLoaded(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    // Failure
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Logout
    logoutSuccess() {
      return { ...initialState };
    },

    clearError(state) {
      state.error = null;
    },
  },
});

export const {
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
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
