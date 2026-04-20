import type { RootState } from '../index';

export const selectMeetings = (state: RootState) => state.meeting.meetings;
export const selectCurrentMeeting = (state: RootState) => state.meeting.currentMeeting;
export const selectNewlyCreatedMeeting = (state: RootState) => state.meeting.newlyCreatedMeeting;
export const selectIsInMeeting = (state: RootState) => state.meeting.isInMeeting;
export const selectMeetingLoading = (state: RootState) => state.meeting.isLoading;
export const selectMeetingError = (state: RootState) => state.meeting.error;
export const selectParticipants = (state: RootState) => state.meeting.participants;
export const selectIsAudioOn = (state: RootState) => state.meeting.isAudioOn;
export const selectIsVideoOn = (state: RootState) => state.meeting.isVideoOn;
export const selectIsScreenSharing = (state: RootState) => state.meeting.isScreenSharing;
