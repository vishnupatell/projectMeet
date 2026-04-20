import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Chat, Message } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>; // chatId -> messages
  isLoading: boolean;
  error: string | null;
  isChatOpen: boolean;
  typingUsers: Record<string, string[]>; // chatId -> userIds
  unreadCount: Record<string, number>;
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  messages: {},
  isLoading: false,
  error: null,
  isChatOpen: false,
  typingUsers: {},
  unreadCount: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Triggers
    fetchChatsRequest(state) {
      state.isLoading = true;
    },
    fetchMessagesRequest(state, _action: PayloadAction<{ chatId: string; cursor?: string }>) {
      state.isLoading = true;
    },
    sendMessageRequest(state, _action: PayloadAction<{ chatId: string; content: string }>) {
      // No loading - should feel instant
      void state;
    },

    // Success
    fetchChatsSuccess(state, action: PayloadAction<Chat[]>) {
      state.chats = action.payload;
      state.isLoading = false;
    },
    fetchMessagesSuccess(state, action: PayloadAction<{ chatId: string; messages: Message[] }>) {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
      state.isLoading = false;
    },

    // Real-time
    newMessage(state, action: PayloadAction<Message>) {
      const msg = action.payload;
      if (!state.messages[msg.chatId]) {
        state.messages[msg.chatId] = [];
      }
      // Prepend (messages stored newest first)
      state.messages[msg.chatId].unshift(msg);

      // Update unread
      if (state.activeChat?.id !== msg.chatId) {
        state.unreadCount[msg.chatId] = (state.unreadCount[msg.chatId] || 0) + 1;
      }
    },

    setActiveChat(state, action: PayloadAction<Chat | null>) {
      state.activeChat = action.payload;
      if (action.payload) {
        state.unreadCount[action.payload.id] = 0;
      }
    },
    toggleChat(state) {
      state.isChatOpen = !state.isChatOpen;
    },
    setChatOpen(state, action: PayloadAction<boolean>) {
      state.isChatOpen = action.payload;
    },

    userTyping(state, action: PayloadAction<{ chatId: string; userId: string }>) {
      const { chatId, userId } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      if (!state.typingUsers[chatId].includes(userId)) {
        state.typingUsers[chatId].push(userId);
      }
    },
    userStopTyping(state, action: PayloadAction<{ chatId: string; userId: string }>) {
      const { chatId, userId } = action.payload;
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter((id) => id !== userId);
      }
    },

    // Failure
    chatFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    clearChatError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchChatsRequest,
  fetchMessagesRequest,
  sendMessageRequest,
  fetchChatsSuccess,
  fetchMessagesSuccess,
  newMessage,
  setActiveChat,
  toggleChat,
  setChatOpen,
  userTyping,
  userStopTyping,
  chatFailure,
  clearChatError,
} = chatSlice.actions;

export default chatSlice.reducer;
