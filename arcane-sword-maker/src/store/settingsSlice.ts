import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SettingsState = {
  isSfxMuted: boolean;
  isAmbienceMuted: boolean;
  isAmbienceAutoMuted: boolean;
  introEverSeen: boolean;
};

const initialState: SettingsState = {
  isSfxMuted: true,
  isAmbienceMuted: true,
  isAmbienceAutoMuted: false,
  introEverSeen: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleSfxMute: (state) => {
      state.isSfxMuted = !state.isSfxMuted;
    },
    toggleAmbienceMute: (state) => {
      state.isAmbienceMuted = !state.isAmbienceMuted;
    },
    setSfxMuted: (state, action: PayloadAction<boolean>) => {
      state.isSfxMuted = action.payload;
    },
    setAmbienceMuted: (state, action: PayloadAction<boolean>) => {
      state.isAmbienceMuted = action.payload;
    },
    setAmbienceAutoMuted: (state, action: PayloadAction<boolean>) => {
      state.isAmbienceAutoMuted = action.payload;
    },
    setIntroEverSeen: (state, action: PayloadAction<boolean>) => {
      state.introEverSeen = action.payload;
    },
  },
});

export const {
  toggleSfxMute,
  toggleAmbienceMute,
  setSfxMuted,
  setAmbienceMuted,
  setAmbienceAutoMuted,
  setIntroEverSeen,
} = settingsSlice.actions;

export default settingsSlice.reducer;
