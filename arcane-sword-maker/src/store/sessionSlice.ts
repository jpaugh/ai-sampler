import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SessionState = {
  hasSeenStartMenu: boolean;
};

const initialState: SessionState = {
  hasSeenStartMenu: false,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setHasSeenStartMenu: (state, action: PayloadAction<boolean>) => {
      state.hasSeenStartMenu = action.payload;
    },
    clearHasSeenStartMenu: (state) => {
      state.hasSeenStartMenu = false;
    },
  },
});

export const { setHasSeenStartMenu, clearHasSeenStartMenu } = sessionSlice.actions;
export default sessionSlice.reducer;
