import type { RootState } from '../index';

export const selectChats = (state: RootState) => state.chat.chats;
export const selectActiveChat = (state: RootState) => state.chat.activeChat;
export const selectMessages = (chatId: string) => (state: RootState) => state.chat.messages[chatId] || [];
export const selectIsChatOpen = (state: RootState) => state.chat.isChatOpen;
export const selectChatLoading = (state: RootState) => state.chat.isLoading;
export const selectTypingUsers = (chatId: string) => (state: RootState) => state.chat.typingUsers[chatId] || [];
export const selectUnreadCount = (chatId: string) => (state: RootState) => state.chat.unreadCount[chatId] || 0;
