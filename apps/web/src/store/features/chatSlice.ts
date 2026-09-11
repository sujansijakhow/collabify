import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage } from "@collabify/shared";

interface ChatState {
  messagesByCampaign: Record<string, ChatMessage[]>;
  onlineUserIds: string[];
}

const initialState: ChatState = { messagesByCampaign: {}, onlineUserIds: [] };

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    hydrateMessages(state, action: PayloadAction<{ campaignId: string; messages: ChatMessage[] }>) {
      state.messagesByCampaign[action.payload.campaignId] = action.payload.messages;
    },
    // Called from the socket "chat:message" listener as new messages arrive live.
    messageReceived(state, action: PayloadAction<ChatMessage>) {
      const list = state.messagesByCampaign[action.payload.campaignId] ?? [];
      state.messagesByCampaign[action.payload.campaignId] = [...list, action.payload];
    },
    presenceUpdated(state, action: PayloadAction<{ userId: string; online: boolean }>) {
      const { userId, online } = action.payload;
      state.onlineUserIds = online
        ? Array.from(new Set([...state.onlineUserIds, userId]))
        : state.onlineUserIds.filter((id) => id !== userId);
    },
  },
});

export const { hydrateMessages, messageReceived, presenceUpdated } = chatSlice.actions;
export default chatSlice.reducer;
