import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Weapon } from "../game/weapons";
import { weaponValue, weaponClasses } from "../game/weapons";
import type { Material, Quality } from "../game/weights";
import { materials, qualities } from "../game/weights";
import type { WeaponClass } from "../game/weapons";
import { unlocks, type Unlock } from "../game/progression";
import type { LeafNamePart } from "../game/names";

const INVENTORY_SIZE = 6;
const SHOP_INVENTORY_SIZE = 6;
const SHOP_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type WeaponLoadout = Pick<Weapon, "class" | "quality" | "material">;

const createDefaultWeapon = (loadout?: Partial<WeaponLoadout>): Weapon => ({
  class: loadout?.class ?? "axe",
  quality: loadout?.quality ?? "shoddy",
  material: loadout?.material ?? "tin",
});

const STARTING_WEAPON_CLASS_NAME_LENGTH = createDefaultWeapon().class.length;

export const createDefaultInboxWeapons = (): Weapon[] =>
  [];

type LongestNameRecord = {
  achievedAt: string;
  name: string;
  length: number;
  weaponsEnchanted: number;
};

type WeaponStats = {
  totalEnchanted: number;
  totalSoldValue: number;
  byClass: Partial<Record<WeaponClass, number>>;
  byMaterial: Partial<Record<Material, number>>;
  byQuality: Partial<Record<Quality, number>>;
};

export type ProgressionState = {
  longestNameRecords: LongestNameRecord[];
  unlockedUnlocks: Unlock[];
  unlockedWeaponClasses: WeaponClass[];
  unlockedMaterials: Material[];
  unlockedQualities: Quality[];
  unlockedNameForms: string[];
  stats: WeaponStats;
};

export const createDefaultProgression = (): ProgressionState => ({
  longestNameRecords: [],
  unlockedUnlocks: [],
  unlockedWeaponClasses: [],
  unlockedMaterials: [],
  unlockedQualities: [],
  unlockedNameForms: [],
  stats: {
    totalEnchanted: 0,
    totalSoldValue: 0,
    byClass: {},
    byMaterial: {},
    byQuality: {},
  },
});

const incrementCounter = <TKey extends string>(
  map: Partial<Record<TKey, number>>,
  key: TKey
) => {
  map[key] = (map[key] ?? 0) + 1;
};

const pushUnique = <TValue extends string>(values: TValue[], value: TValue) => {
  if (values.includes(value)) return;
  values.push(value);
};

const registerInboxTouch = (progression: ProgressionState, weapon: Weapon) => {
  pushUnique(progression.unlockedWeaponClasses, weapon.class);
  pushUnique(progression.unlockedMaterials, weapon.material);
  pushUnique(progression.unlockedQualities, weapon.quality);
};

const generateRandomShopInventory = (): Weapon[] => {
  const inventory: Weapon[] = [];
  for (let i = 0; i < SHOP_INVENTORY_SIZE; i++) {
    const randomClass = weaponClasses[Math.floor(Math.random() * weaponClasses.length)];
    const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
    const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
    
    inventory.push({
      class: randomClass,
      material: randomMaterial,
      quality: randomQuality,
    });
  }
  return inventory;
};

export type GameState = {
  inboxItems: Weapon[];
  outboxItems: Weapon[];
  workAreaItem: Weapon | undefined;
  progression: ProgressionState;
  introFinished: boolean;
  blacksmithInventory: Weapon[];
  blacksmithRefreshesAt: number | undefined;
  isAutosellEnabled: boolean;
  isAutobuyEnabled: boolean;
  hasGame: boolean;
};

const initialState: GameState = {
  inboxItems: createDefaultInboxWeapons(),
  outboxItems: [],
  workAreaItem: undefined,
  blacksmithInventory: [],
  blacksmithRefreshesAt: undefined,
  progression: createDefaultProgression(),
  introFinished: false,
  isAutosellEnabled: false,
  isAutobuyEnabled: false,
  hasGame: false,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    grantUnlock: (state, action: PayloadAction<Unlock>) => {
      if (!state.progression.unlockedUnlocks.includes(action.payload)) {
        state.progression.unlockedUnlocks.push(action.payload);
      }
    },
        toggleAutosell: (state) => {
          state.isAutosellEnabled = !state.isAutosellEnabled;
        },
        setAutosellEnabled: (state, action: PayloadAction<boolean>) => {
          state.isAutosellEnabled = action.payload;
        },
        toggleAutobuy: (state) => {
          state.isAutobuyEnabled = !state.isAutobuyEnabled;
        },
        setAutobuyEnabled: (state, action: PayloadAction<boolean>) => {
          state.isAutobuyEnabled = action.payload;
        },
    resetGame: () => {
      return {
        inboxItems: createDefaultInboxWeapons(),
        outboxItems: [],
        workAreaItem: undefined,
        progression: createDefaultProgression(),
        introFinished: false,
        blacksmithInventory: [],
        blacksmithRefreshesAt: Date.now() + SHOP_REFRESH_INTERVAL_MS,
        isAutosellEnabled: false,
        isAutobuyEnabled: false,
        hasGame: true,
      };
    },
    markIntroFinished: (state) => {
      state.introFinished = true;
    },
    moveInboxItemToWorkArea: (state, action: PayloadAction<number>) => {
      if (state.workAreaItem) return;

      const selected = state.inboxItems[action.payload];
      if (!selected) return;

      state.workAreaItem = selected;
      state.inboxItems = state.inboxItems.filter((_, index) => index !== action.payload);
    },
    addFreeInboxWeapon: (state, action: PayloadAction<Partial<WeaponLoadout> | undefined>) => {
      if (state.inboxItems.length >= INVENTORY_SIZE) return;

      const missingCount = INVENTORY_SIZE - state.inboxItems.length;
      for (let index = 0; index < missingCount; index += 1) {
        const weapon = createDefaultWeapon(action.payload);
        state.inboxItems.push(weapon);
        registerInboxTouch(state.progression, weapon);
      }
    },
    moveWorkAreaItemToOutbox: (state) => {
      if (!state.workAreaItem) return;
      if (state.outboxItems.length >= INVENTORY_SIZE) return;

      state.outboxItems = [...state.outboxItems, state.workAreaItem];
      state.workAreaItem = undefined;
    },
    donateOutboxItems: (state) => {
      if (state.outboxItems.length === 0) return;
      
      const weaponValues = state.outboxItems.map(weapon => ({
        weapon,
        value: weaponValue({ weapon })
      }));
      
      const minValue = Math.min(...weaponValues.map(wv => wv.value));
      
      state.outboxItems = state.outboxItems.filter(weapon => {
        const value = weaponValue({ weapon });
        return value !== minValue;
      });
    },
    sellOutboxItems: (state) => {
      if (state.outboxItems.length === 0) return;

      const totalSaleValue = state.outboxItems.reduce(
        (total, weapon) => total + weaponValue({ weapon }),
        0
      );

      state.progression.stats.totalSoldValue += totalSaleValue;
      state.outboxItems = [];
    },
    setWorkAreaItem: (state, action: PayloadAction<Weapon | undefined>) => {
      state.workAreaItem = action.payload;
    },
    enchantWorkAreaItem: (
      state,
      action: PayloadAction<{ name: string; enchantedAt: string; nameForm: LeafNamePart[] }>
    ) => {
      if (!state.workAreaItem) return;

      state.workAreaItem = {
        ...state.workAreaItem,
        name: action.payload.name,
      };

      state.progression.stats.totalEnchanted += 1;
      const nameFormKey = action.payload.nameForm.join("|");
      if (nameFormKey.length > 0) {
        pushUnique(state.progression.unlockedNameForms, nameFormKey);
      }

      incrementCounter(state.progression.stats.byClass, state.workAreaItem.class);
      incrementCounter(state.progression.stats.byMaterial, state.workAreaItem.material);
      incrementCounter(state.progression.stats.byQuality, state.workAreaItem.quality);

      const currentBestLength = state.progression.longestNameRecords[0]?.length ?? 0;
      const nameLength = action.payload.name.length;

      if (nameLength > currentBestLength) {
        const isFirstNameRecord = state.progression.longestNameRecords.length === 0;
        state.progression.longestNameRecords.unshift({
          achievedAt: action.payload.enchantedAt,
          name: action.payload.name,
          length: nameLength,
          weaponsEnchanted: state.progression.stats.totalEnchanted,
        });

        const unlocksToGrant = isFirstNameRecord && nameLength > STARTING_WEAPON_CLASS_NAME_LENGTH ? 2 : 1;
        for (let index = 0; index < unlocksToGrant; index += 1) {
          const nextUnlock = unlocks[state.progression.unlockedUnlocks.length];
          if (!nextUnlock) break;
          state.progression.unlockedUnlocks.push(nextUnlock.unlock);
        }
      }
    },
    initializeShop: (state) => {
      if (state.blacksmithInventory.length === 0) {
        state.blacksmithInventory = generateRandomShopInventory();
        state.blacksmithRefreshesAt = Date.now() + SHOP_REFRESH_INTERVAL_MS;
      }
    },
    refreshShopInventory: (state) => {
      state.blacksmithInventory = generateRandomShopInventory();
      state.blacksmithRefreshesAt = Date.now() + SHOP_REFRESH_INTERVAL_MS;
    },
    buyWeaponFromShop: (state, action: PayloadAction<number>) => {
      const weapon = state.blacksmithInventory[action.payload];
      if (!weapon) return;
      
      const cost = weaponValue({ weapon });
      if (state.progression.stats.totalSoldValue < cost) return;
      if (state.inboxItems.length >= INVENTORY_SIZE) return;
      
      state.progression.stats.totalSoldValue -= cost;
      state.inboxItems.push({ ...weapon });
      registerInboxTouch(state.progression, weapon);
      state.blacksmithInventory = state.blacksmithInventory.filter((_, index) => index !== action.payload);
    },
  },
});

export const {
  resetGame,
  markIntroFinished,
  moveInboxItemToWorkArea,
  addFreeInboxWeapon,
  moveWorkAreaItemToOutbox,
  donateOutboxItems,
  sellOutboxItems,
  setWorkAreaItem,
  enchantWorkAreaItem,
  initializeShop,
  refreshShopInventory,
  buyWeaponFromShop,
  toggleAutosell,
  setAutosellEnabled,
  toggleAutobuy,
  setAutobuyEnabled,
} = gameSlice.actions;

export default gameSlice.reducer;
