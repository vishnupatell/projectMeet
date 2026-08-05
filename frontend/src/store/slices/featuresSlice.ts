import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Poll, Reaction, Caption, BreakoutRoom, SharedFile, ActionItem, WhiteboardStroke } from '@/types';

interface FeaturesState {
  // Polls
  polls: Poll[];
  activePoll: Poll | null;

  // Reactions
  reactions: Reaction[];

  // Raise hand
  raisedHands: string[]; // userIds

  // Waiting room
  waitingRoom: { userId: string; displayName: string }[];
  isInWaitingRoom: boolean;

  // Breakout rooms
  breakoutRooms: BreakoutRoom[];
  currentBreakoutRoom: string | null;

  // Whiteboard
  whiteboardStrokes: WhiteboardStroke[];
  isWhiteboardOpen: boolean;

  // File sharing
  sharedFiles: SharedFile[];

  // Action items
  actionItems: ActionItem[];

  // Live captions
  captions: Caption[];
  captionsEnabled: boolean;
  captionLanguage: string;

  // Meeting timer
  meetingStartTime: string | null;

  // Theme
  theme: 'light' | 'dark';

  // Loading
  isLoading: boolean;
}

const initialState: FeaturesState = {
  polls: [],
  activePoll: null,
  reactions: [],
  raisedHands: [],
  waitingRoom: [],
  isInWaitingRoom: false,
  breakoutRooms: [],
  currentBreakoutRoom: null,
  whiteboardStrokes: [],
  isWhiteboardOpen: false,
  sharedFiles: [],
  actionItems: [],
  captions: [],
  captionsEnabled: false,
  captionLanguage: 'en',
  meetingStartTime: null,
  theme: 'light',
  isLoading: false,
};

const featuresSlice = createSlice({
  name: 'features',
  initialState,
  reducers: {
    // ============ POLLS ============
    addPoll(state, action: PayloadAction<Poll>) {
      state.polls.push(action.payload);
      if (action.payload.isActive) {
        state.activePoll = action.payload;
      }
    },
    updatePollResults(state, action: PayloadAction<{ pollId: string; results: any }>) {
      const poll = state.polls.find((p) => p.id === action.payload.pollId);
      if (poll) {
        poll.results = action.payload.results;
      }
      if (state.activePoll?.id === action.payload.pollId) {
        state.activePoll.results = action.payload.results;
      }
    },
    closePoll(state, action: PayloadAction<string>) {
      const poll = state.polls.find((p) => p.id === action.payload);
      if (poll) poll.isActive = false;
      if (state.activePoll?.id === action.payload) {
        state.activePoll = null;
      }
    },
    setPolls(state, action: PayloadAction<Poll[]>) {
      state.polls = action.payload;
    },

    // ============ REACTIONS ============
    addReaction(state, action: PayloadAction<Reaction>) {
      state.reactions.push(action.payload);
      // Keep only last 20 reactions
      if (state.reactions.length > 20) {
        state.reactions = state.reactions.slice(-20);
      }
    },
    clearReactions(state) {
      state.reactions = [];
    },

    // ============ RAISE HAND ============
    toggleHandRaised(state, action: PayloadAction<{ userId: string; raised: boolean }>) {
      if (action.payload.raised) {
        if (!state.raisedHands.includes(action.payload.userId)) {
          state.raisedHands.push(action.payload.userId);
        }
      } else {
        state.raisedHands = state.raisedHands.filter((id) => id !== action.payload.userId);
      }
    },
    clearRaisedHands(state) {
      state.raisedHands = [];
    },

    // ============ WAITING ROOM ============
    setWaitingRoom(state, action: PayloadAction<{ userId: string; displayName: string }[]>) {
      state.waitingRoom = action.payload;
    },
    setIsInWaitingRoom(state, action: PayloadAction<boolean>) {
      state.isInWaitingRoom = action.payload;
    },
    removeFromWaitingRoom(state, action: PayloadAction<string>) {
      state.waitingRoom = state.waitingRoom.filter((w) => w.userId !== action.payload);
    },

    // ============ BREAKOUT ROOMS ============
    setBreakoutRooms(state, action: PayloadAction<BreakoutRoom[]>) {
      state.breakoutRooms = action.payload;
    },
    setCurrentBreakoutRoom(state, action: PayloadAction<string | null>) {
      state.currentBreakoutRoom = action.payload;
    },
    clearBreakoutRooms(state) {
      state.breakoutRooms = [];
      state.currentBreakoutRoom = null;
    },

    // ============ WHITEBOARD ============
    addWhiteboardStroke(state, action: PayloadAction<WhiteboardStroke>) {
      state.whiteboardStrokes.push(action.payload);
    },
    clearWhiteboard(state) {
      state.whiteboardStrokes = [];
    },
    undoWhiteboardStroke(state, action: PayloadAction<string>) {
      // Remove last stroke from user
      const idx = [...state.whiteboardStrokes].reverse().findIndex((s) => s.userId === action.payload);
      if (idx >= 0) {
        state.whiteboardStrokes.splice(state.whiteboardStrokes.length - 1 - idx, 1);
      }
    },
    toggleWhiteboard(state) {
      state.isWhiteboardOpen = !state.isWhiteboardOpen;
    },

    // ============ FILE SHARING ============
    setSharedFiles(state, action: PayloadAction<SharedFile[]>) {
      state.sharedFiles = action.payload;
    },
    addSharedFile(state, action: PayloadAction<SharedFile>) {
      state.sharedFiles.unshift(action.payload);
    },
    removeSharedFile(state, action: PayloadAction<string>) {
      state.sharedFiles = state.sharedFiles.filter((f) => f.id !== action.payload);
    },

    // ============ ACTION ITEMS ============
    setActionItems(state, action: PayloadAction<ActionItem[]>) {
      state.actionItems = action.payload;
    },
    addActionItem(state, action: PayloadAction<ActionItem>) {
      state.actionItems.push(action.payload);
    },
    updateActionItem(state, action: PayloadAction<ActionItem>) {
      const idx = state.actionItems.findIndex((i) => i.id === action.payload.id);
      if (idx >= 0) state.actionItems[idx] = action.payload;
    },
    removeActionItem(state, action: PayloadAction<string>) {
      state.actionItems = state.actionItems.filter((i) => i.id !== action.payload);
    },

    // ============ LIVE CAPTIONS ============
    addCaption(state, action: PayloadAction<Caption>) {
      state.captions.push(action.payload);
      // Keep only last 50 captions
      if (state.captions.length > 50) {
        state.captions = state.captions.slice(-50);
      }
    },
    toggleCaptions(state) {
      state.captionsEnabled = !state.captionsEnabled;
    },
    setCaptionLanguage(state, action: PayloadAction<string>) {
      state.captionLanguage = action.payload;
    },
    clearCaptions(state) {
      state.captions = [];
    },

    // ============ MEETING TIMER ============
    setMeetingStartTime(state, action: PayloadAction<string | null>) {
      state.meetingStartTime = action.payload;
    },

    // ============ THEME ============
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },

    // ============ RESET ============
    resetFeatures() {
      return initialState;
    },
  },
});

export const {
  addPoll, updatePollResults, closePoll, setPolls,
  addReaction, clearReactions,
  toggleHandRaised, clearRaisedHands,
  setWaitingRoom, setIsInWaitingRoom, removeFromWaitingRoom,
  setBreakoutRooms, setCurrentBreakoutRoom, clearBreakoutRooms,
  addWhiteboardStroke, clearWhiteboard, undoWhiteboardStroke, toggleWhiteboard,
  setSharedFiles, addSharedFile, removeSharedFile,
  setActionItems, addActionItem, updateActionItem, removeActionItem,
  addCaption, toggleCaptions, setCaptionLanguage, clearCaptions,
  setMeetingStartTime,
  setTheme, toggleTheme,
  resetFeatures,
} = featuresSlice.actions;

export default featuresSlice.reducer;
