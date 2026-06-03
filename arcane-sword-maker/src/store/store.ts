import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import gameReducer, { createDefaultInboxWeapons, createDefaultProgression, type GameState } from "./gameSlice";
import settingsReducer, { type SettingsState } from "./settingsSlice";
import sessionReducer, { type SessionState } from "./sessionSlice";
import { unlocks } from "../game/progression";
import { weaponClasses } from "../game/weapons";
import { materials, qualities } from "../game/weights";
const STORAGE_KEY = "arcane-sword-maker";
const SESSION_STORAGE_KEY = "arcane-sword-maker-session";
type PersistedSettings = SettingsState;
type StorageData = {
  game?: unknown;
  settings?: unknown;
};
type SessionStorageData = {
  hasSeenStartMenu?: boolean;
};

const getStorage = (): StorageData => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as StorageData;
    }
    return {};
  } catch {
    return {};
  }
};

const getSessionStorage = (): SessionStorageData => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as SessionStorageData;
    }
    return {};
  } catch {
    return {};
  }
};

const setStorage = (data: StorageData): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseProgressionState = (value: unknown): GameState["progression"] => {
  const defaults = createDefaultProgression();
  if (!isObject(value)) return defaults;

  const validUnlocks = new Set<string>(unlocks.map((entry) => entry.unlock));
  const validClasses = new Set<string>(weaponClasses);
  const validMaterials = new Set<string>(materials);
  const validQualities = new Set<string>(qualities);

  const longestNameRecords = Array.isArray(value.longestNameRecords)
    ? value.longestNameRecords.filter((record): record is GameState["progression"]["longestNameRecords"][number] => {
        if (!isObject(record)) return false;
        return (
          typeof record.achievedAt === "string" &&
          typeof record.name === "string" &&
          typeof record.length === "number" &&
          typeof record.weaponsEnchanted === "number"
        );
      })
    : defaults.longestNameRecords;

  const statsRaw = isObject(value.stats) ? value.stats : {};
  const unlockedUnlocks = Array.isArray(value.unlockedUnlocks)
    ? value.unlockedUnlocks.filter(
        (unlock): unlock is GameState["progression"]["unlockedUnlocks"][number] =>
          typeof unlock === "string" && validUnlocks.has(unlock)
      )
    : defaults.unlockedUnlocks;

  const unlockedWeaponClasses = Array.isArray(value.unlockedWeaponClasses)
    ? value.unlockedWeaponClasses.filter(
        (weaponClass): weaponClass is GameState["progression"]["unlockedWeaponClasses"][number] =>
          typeof weaponClass === "string" && validClasses.has(weaponClass)
      )
    : defaults.unlockedWeaponClasses;

  const unlockedMaterials = Array.isArray(value.unlockedMaterials)
    ? value.unlockedMaterials.filter(
        (material): material is GameState["progression"]["unlockedMaterials"][number] =>
          typeof material === "string" && validMaterials.has(material)
      )
    : defaults.unlockedMaterials;

  const unlockedQualities = Array.isArray(value.unlockedQualities)
    ? value.unlockedQualities.filter(
        (quality): quality is GameState["progression"]["unlockedQualities"][number] =>
          typeof quality === "string" && validQualities.has(quality)
      )
    : defaults.unlockedQualities;

  const unlockedNameForms = Array.isArray(value.unlockedNameForms)
    ? value.unlockedNameForms.filter(
        (nameForm): nameForm is GameState["progression"]["unlockedNameForms"][number] =>
          typeof nameForm === "string" && nameForm.length > 0
      )
    : defaults.unlockedNameForms;

  return {
    longestNameRecords,
    unlockedUnlocks,
    unlockedWeaponClasses,
    unlockedMaterials,
    unlockedQualities,
    unlockedNameForms,
    stats: {
      totalEnchanted:
        typeof statsRaw.totalEnchanted === "number" && Number.isFinite(statsRaw.totalEnchanted)
          ? statsRaw.totalEnchanted
          : defaults.stats.totalEnchanted,
      totalSoldValue:
        typeof statsRaw.totalSoldValue === "number" && Number.isFinite(statsRaw.totalSoldValue)
          ? statsRaw.totalSoldValue
          : defaults.stats.totalSoldValue,
      byClass: isObject(statsRaw.byClass) ? (statsRaw.byClass as GameState["progression"]["stats"]["byClass"]) : {},
      byMaterial: isObject(statsRaw.byMaterial)
        ? (statsRaw.byMaterial as GameState["progression"]["stats"]["byMaterial"])
        : {},
      byQuality: isObject(statsRaw.byQuality)
        ? (statsRaw.byQuality as GameState["progression"]["stats"]["byQuality"])
        : {},
    },
  };
};

const loadPersistedGameState = (): GameState | undefined => {
  if (typeof window === "undefined") return undefined;

  try {
    const storage = getStorage();
    const gameState = storage.game;
    if (!isObject(gameState)) return undefined;

    const inboxItems = Array.isArray(gameState.inboxItems) ? gameState.inboxItems : createDefaultInboxWeapons();
    const outboxItems = Array.isArray(gameState.outboxItems) ? gameState.outboxItems : [];
    const workAreaItem = gameState.workAreaItem as GameState["workAreaItem"];
    const introFinished = gameState.introFinished === true;
    const progression = parseProgressionState(gameState.progression);

    for (const inboxItem of inboxItems) {
      if (typeof inboxItem !== "object" || inboxItem === null) continue;
      const weaponClass = (inboxItem as { class?: unknown }).class;
      const material = (inboxItem as { material?: unknown }).material;
      const quality = (inboxItem as { quality?: unknown }).quality;

      if (typeof weaponClass === "string" && weaponClasses.includes(weaponClass as (typeof weaponClasses)[number])) {
        if (!progression.unlockedWeaponClasses.includes(weaponClass as GameState["progression"]["unlockedWeaponClasses"][number])) {
          progression.unlockedWeaponClasses.push(weaponClass as GameState["progression"]["unlockedWeaponClasses"][number]);
        }
      }

      if (typeof material === "string" && materials.includes(material as (typeof materials)[number])) {
        if (!progression.unlockedMaterials.includes(material as GameState["progression"]["unlockedMaterials"][number])) {
          progression.unlockedMaterials.push(material as GameState["progression"]["unlockedMaterials"][number]);
        }
      }

      if (typeof quality === "string" && qualities.includes(quality as (typeof qualities)[number])) {
        if (!progression.unlockedQualities.includes(quality as GameState["progression"]["unlockedQualities"][number])) {
          progression.unlockedQualities.push(quality as GameState["progression"]["unlockedQualities"][number]);
        }
      }
    }

    return {
      inboxItems,
      outboxItems,
      workAreaItem,
      introFinished,
      progression,
      blacksmithInventory: [],
      blacksmithRefreshesAt: undefined,
      isAutosellEnabled: false,
      isAutobuyEnabled: false,
      hasGame: true,
    };
  } catch {
    return undefined;
  }
};

const loadPersistedSettings = (): PersistedSettings => {
  if (typeof window === "undefined") {
    return {
      isSfxMuted: false,
      isAmbienceMuted: false,
      isAmbienceAutoMuted: false,
      introEverSeen: false,
    };
  }
  return {
    isSfxMuted: false,
    isAmbienceMuted: false,
    isAmbienceAutoMuted: false,
    introEverSeen: false,
  };
};

const preloadedGameState = loadPersistedGameState();
const preloadedSettings = loadPersistedSettings();
const preloadedSession: SessionState = {
  hasSeenStartMenu: getSessionStorage().hasSeenStartMenu === true,
};

export const store = configureStore({
  reducer: {
    game: gameReducer,
    settings: settingsReducer,
    session: sessionReducer,
  },
  preloadedState: {
    game: preloadedGameState ?? {
      inboxItems: createDefaultInboxWeapons(),
      outboxItems: [],
      workAreaItem: undefined,
      progression: createDefaultProgression(),
      introFinished: false,
      blacksmithInventory: [],
      blacksmithRefreshesAt: undefined,
      isAutosellEnabled: false,
      isAutobuyEnabled: false,
      hasGame: false,
    },
    settings: preloadedSettings,
    session: preloadedSession,
  },
});

let lastSavedGame = "";
let lastSavedSettings = "";

store.subscribe(() => {
  if (typeof window === "undefined") return;

  const state = store.getState();
  const storage = getStorage();

  const serializedGame = JSON.stringify(state.game);

  if (serializedGame !== lastSavedGame) {
    lastSavedGame = serializedGame;
    storage.game = state.game;
  }

  const settingsToSave = {
    isSfxMuted: state.settings.isSfxMuted,
    isAmbienceMuted: state.settings.isAmbienceMuted,
    introEverSeen: state.settings.introEverSeen,
  };
  const serializedSettings = JSON.stringify(settingsToSave);

  if (serializedSettings !== lastSavedSettings) {
    lastSavedSettings = serializedSettings;
    storage.settings = settingsToSave;
  }

  setStorage(storage);

  if (typeof window !== "undefined") {
    const sessionData = {
      hasSeenStartMenu: state.session.hasSeenStartMenu,
    };
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
