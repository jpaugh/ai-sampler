import React from "react";
import { createPortal } from "react-dom";
import { applyChain, defaultChainSource, generateChain } from "../game/names";
import getRandomMakerName from "../game/makerNames";
import type { Weapon } from "../game/weapons";
import { weaponValue } from "../game/weapons";
import { applyWeights, baseWeightMap } from "../game/weights";
import { unlocks, type UnlockMeta } from "../game/progression";
import {
  addFreeInboxWeapon,
  donateOutboxItems,
  enchantWorkAreaItem,
  moveInboxItemToWorkArea as moveInboxItemToWorkAreaAction,
  moveWorkAreaItemToOutbox as moveWorkAreaItemToOutboxAction,
  sellOutboxItems,
  toggleAutosell,
  toggleAutobuy,
} from "../store/gameSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import { useSound } from "../hooks/useSound";
import Gold from "./Gold";
import WeaponTooltip from "./WeaponTooltip";
const INVENTORY_SIZE = 6;
const getWeaponLabel = (weapon: Weapon): string => {
  if (weapon.name && weapon.name.trim().length > 0) return weapon.name;
  return `unnamed ${weapon.material} ${weapon.class}`;
};

const toTitleCase = (value: string): string =>
  value
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const formatUnlockLabel = (value: string): string =>
  value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

type DragSource = "inbox" | "workarea" | undefined;
type TooltipPlacement = "above" | "below";
const CONFETTI_COLORS = ["#f97316", "#22c55e", "#0ea5e9", "#eab308", "#ec4899", "#8b5cf6"];
const CONFETTI_PARTICLE_COUNT = 20;
const OUTBOX_CAPACITY = 6;

type ProgressionModal = {
  recordName: string;
  recordLength: number;
  unlock: UnlockMeta;
};

type EnchantProps = {
  onNavigateToBuy?: () => void;
};

const isLastRowItem = (index: number, totalItems: number, columns: number): boolean => {
  if (totalItems <= 0) return false;
  const lastRowItemCount = totalItems % columns || columns;
  const firstIndexOfLastRow = totalItems - lastRowItemCount;
  return index >= firstIndexOfLastRow;
};

import { publicAssetUrl } from "../utils/audioTheme";

const getWeaponIconSrc = (weaponClass: string) => {
  const normalized = weaponClass.replace(/\s+/g, '-').toLowerCase();
  return publicAssetUrl(`assets/${normalized}.svg`);
};

const Enchant: React.FC<EnchantProps> = ({ onNavigateToBuy }) => {
  const dispatch = useAppDispatch();
  const inboxItems = useAppSelector((state) => state.game.inboxItems);
  const outboxItems = useAppSelector((state) => state.game.outboxItems);
  const workAreaItem = useAppSelector((state) => state.game.workAreaItem);
  const unlockedUnlocks = useAppSelector((state) => state.game.progression.unlockedUnlocks);
  const hasAutoBuyUnlocked = unlockedUnlocks.includes("auto-buy");
  const isAutobuyEnabled = useAppSelector((state) => state.game.isAutobuyEnabled);
  const shopInventory = useAppSelector((state) => state.game.blacksmithInventory);
  const totalGold = useAppSelector((state) => state.game.progression.stats.totalSoldValue);
    const hasAutoSellUnlocked = unlockedUnlocks.includes("auto-sell");
    const isAutosellEnabled = useAppSelector((state) => state.game.isAutosellEnabled);
    React.useEffect(() => {
      if (!isAutosellEnabled) return;
      if (outboxItems.length < OUTBOX_CAPACITY) return;
      dispatch(sellOutboxItems(undefined));
    }, [isAutosellEnabled, outboxItems.length, dispatch]);
  React.useEffect(() => {
    if (!hasAutoBuyUnlocked || !isAutobuyEnabled) return;
    if (inboxItems.length > 0) return;
    if (!shopInventory || shopInventory.length === 0) return;
    let gold = totalGold;
    let slots = INVENTORY_SIZE;
    const sorted = shopInventory
      .map((weapon, index) => ({ weapon, index, cost: weaponValue({ weapon }) }))
      .sort((a, b) => a.cost - b.cost);
    sorted.forEach(({ index, cost }) => {
      if (gold >= cost && slots > 0) {
        dispatch({ type: 'game/buyWeaponFromShop', payload: index });
        gold -= cost;
        slots--;
      }
    });
  }, [hasAutoBuyUnlocked, isAutobuyEnabled, inboxItems.length, shopInventory, totalGold, dispatch]);
  const latestRecord = useAppSelector((state) => state.game.progression.longestNameRecords[0]);
  const unlockedCount = unlockedUnlocks.length;
  const currentBestLength = latestRecord?.length ?? 0;
  const hasDonateUnlocked = unlockedUnlocks.includes("donate");
  const hasSellUnlocked = unlockedUnlocks.includes("sell");
  const hasBuyUnlocked = unlockedUnlocks.includes("buy");
  const donateUnlockDescription = unlocks.find((entry) => entry.unlock === "donate")?.description;
  const sellUnlockDescription = unlocks.find((entry) => entry.unlock === "sell")?.description;
  const [inboxEnteringUntil, setInboxEnteringUntil] = React.useState<number | undefined>(undefined);
  const [draggedIndex, setDraggedIndex] = React.useState<number | undefined>(undefined);
  const [dragSource, setDragSource] = React.useState<DragSource>(undefined);
  const [hoverTooltip, setHoverTooltip] = React.useState<{
    weapon: Weapon;
    x: number;
    y: number;
    placement: TooltipPlacement;
  } | undefined>(undefined);
  const [isEnchanting, setIsEnchanting] = React.useState(false);
  const [progressionModalQueue, setProgressionModalQueue] = React.useState<ProgressionModal[]>([]);
  const [isConfettiActive, setIsConfettiActive] = React.useState(false);
  const [confettiBurstKey, setConfettiBurstKey] = React.useState(0);
  const inboxEnterTimerRef = React.useRef<number | undefined>(undefined);
  const enchantApplyTimerRef = React.useRef<number | undefined>(undefined);
  const confettiTimerRef = React.useRef<number | undefined>(undefined);
  const prevInboxLengthRef = React.useRef(inboxItems.length);
  const prevBestLengthRef = React.useRef(currentBestLength);
  const prevUnlockCountRef = React.useRef(unlockedCount);

  const moveSound = useSound('move-weapon');
  const progressionSound = useSound('progression');
  const enchantSound = useSound('enchant');

  const INBOX_ENTER_STAGGER_MS = 90;
  const INBOX_ENTER_DURATION_MS = 220;
  const ENCHANT_APPLY_DELAY_MS = 1500;
  const CONFETTI_DURATION_MS = 1000;
  const isWorkAreaItemEnchanted = Boolean(workAreaItem?.name?.trim());
  const shouldEnter = prevInboxLengthRef.current === 1 && inboxItems.length === 6;
  const isInboxEntering = shouldEnter || (inboxEnteringUntil !== undefined && Date.now() < inboxEnteringUntil);

  React.useEffect(() => {
    return () => {
      if (inboxEnterTimerRef.current !== undefined) {
        window.clearTimeout(inboxEnterTimerRef.current);
      }
      if (enchantApplyTimerRef.current !== undefined) {
        window.clearTimeout(enchantApplyTimerRef.current);
      }
      if (confettiTimerRef.current !== undefined) {
        window.clearTimeout(confettiTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (currentBestLength > prevBestLengthRef.current) {
      progressionSound.play();

      setConfettiBurstKey((value) => value + 1);
      setIsConfettiActive(true);
      if (confettiTimerRef.current !== undefined) {
        window.clearTimeout(confettiTimerRef.current);
      }

      if (unlockedCount > prevUnlockCountRef.current) {
        const newlyUnlocked = unlocks.slice(prevUnlockCountRef.current, unlockedCount);
        if (newlyUnlocked.length > 0) {
          const nextModals = newlyUnlocked.map((unlock) => ({
            recordName: latestRecord?.name ?? "Unknown",
            recordLength: currentBestLength,
            unlock,
          }));
          setProgressionModalQueue((previous) => [...previous, ...nextModals]);
        }
      }

      confettiTimerRef.current = window.setTimeout(() => {
        setIsConfettiActive(false);
        confettiTimerRef.current = undefined;
      }, CONFETTI_DURATION_MS);
    }

    prevBestLengthRef.current = currentBestLength;
    prevUnlockCountRef.current = unlockedCount;
  }, [
    currentBestLength,
    latestRecord,
    progressionSound,
    unlockedCount,
    CONFETTI_DURATION_MS,
  ]);

  React.useEffect(() => {
    const prevLength = prevInboxLengthRef.current;
    const currentLength = inboxItems.length;
    if (prevLength === 1 && currentLength === 6) {
      if (inboxEnterTimerRef.current !== undefined) {
        window.clearTimeout(inboxEnterTimerRef.current);
      }

      const totalEnterDurationMs = 6 * INBOX_ENTER_STAGGER_MS + INBOX_ENTER_DURATION_MS;
      setInboxEnteringUntil(Date.now() + totalEnterDurationMs);
      
      inboxEnterTimerRef.current = window.setTimeout(() => {
        setInboxEnteringUntil(undefined);
        inboxEnterTimerRef.current = undefined;
      }, totalEnterDurationMs);
    }

    prevInboxLengthRef.current = currentLength;
  }, [inboxItems.length, INBOX_ENTER_STAGGER_MS, INBOX_ENTER_DURATION_MS]);

  const handleDragStart = (index: number, source: DragSource) => {
    setDraggedIndex(index);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const moveInboxItemToWorkArea = (index: number): boolean => {
    if (workAreaItem) return false;

    const selected = inboxItems[index];
    if (!selected) return false;

    dispatch(moveInboxItemToWorkAreaAction(index));
    return true;
  };

  const moveWorkAreaItemToOutbox = () => {
    if (!workAreaItem) return;
    if (outboxItems.length >= OUTBOX_CAPACITY) return;

    dispatch(moveWorkAreaItemToOutboxAction(undefined));
  };

  const handleDropWorkArea = () => {
    if (draggedIndex !== undefined && dragSource === "inbox") {
      const moved = moveInboxItemToWorkArea(draggedIndex);
      if (moved) {
        moveSound.play();
      }
      setDraggedIndex(undefined);
      setDragSource(undefined);
    }
  };

  const handleDropOutbox = () => {
    if (draggedIndex !== undefined && dragSource === "workarea" && workAreaItem) {
      if (outboxItems.length >= OUTBOX_CAPACITY) {
        setDraggedIndex(undefined);
        setDragSource(undefined);
        return;
      }

      moveWorkAreaItemToOutbox();
      moveSound.play();
      setDraggedIndex(undefined);
      setDragSource(undefined);
    }
  };

  const handleInboxWeaponClick = (index: number) => {
    setHoverTooltip(undefined);
    const moved = moveInboxItemToWorkArea(index);
    if (moved) {
      moveSound.play();
    }
  };

  const handleWorkAreaWeaponClick = () => {
    if (workAreaItem?.name === undefined) return;
    if (outboxItems.length >= OUTBOX_CAPACITY) return;

    moveWorkAreaItemToOutbox();
    moveSound.play();
  };

  const handleWeaponMouseEnter = (
    event: React.MouseEvent<HTMLDivElement>,
    weapon: Weapon,
    placement: TooltipPlacement
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverTooltip({
      weapon,
      x: rect.left + rect.width / 2,
      y: placement === "above" ? rect.top - 6 : rect.bottom + 6,
      placement,
    });
  };

  const handleWeaponMouseLeave = () => {
    setHoverTooltip(undefined);
  };
  const handleEnchant = () => {
    if (!workAreaItem || isEnchanting) return;

    const weightMap = applyWeights({
      weightMap: baseWeightMap,
      weaponAttributes: {
        quality: workAreaItem.quality,
        material: workAreaItem.material,
      },
    });

    const chain = generateChain({
      source: defaultChainSource,
      weights: weightMap,
    });

    const generatedName = applyChain({
      chain,
      alternatives: {
        ActionOrAttribute: ["Slashing", "Cleaving", "Sundering", "Rending"],
        Class: [toTitleCase(workAreaItem.class)],
        Maker: [getRandomMakerName()],
        MaterialOrAttribute: [toTitleCase(workAreaItem.material), toTitleCase(workAreaItem.quality)],
        Of: ["of"],
        SuffixDescriptor: ["Might", "Fury", "Doom", "Kings"],
      },
    }).join(" ");

    setIsEnchanting(true);
    enchantSound.play();

    if (enchantApplyTimerRef.current !== undefined) {
      window.clearTimeout(enchantApplyTimerRef.current);
    }

    enchantApplyTimerRef.current = window.setTimeout(() => {
      dispatch(
        enchantWorkAreaItem({
          name: generatedName,
          enchantedAt: new Date().toISOString(),
          nameForm: chain,
        })
      );
      setIsEnchanting(false);
      enchantApplyTimerRef.current = undefined;
    }, ENCHANT_APPLY_DELAY_MS);
  };

  const handleShipIt = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isWorkAreaItemEnchanted || isEnchanting) return;
    if (outboxItems.length >= OUTBOX_CAPACITY) return;

    moveWorkAreaItemToOutbox();
    moveSound.play();
  };

  const activeProgressionModal = progressionModalQueue[0];
  const dismissProgressionModal = () => {
    setProgressionModalQueue((previous) => previous.slice(1));
  };

  const progressionModalOverlay =
    activeProgressionModal && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" role="presentation">
            <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]" aria-hidden="true" />
            <div
              className="relative w-[min(92vw,30rem)] overflow-hidden rounded-xl border border-gray-300 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-900 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Progression unlocked"
            >
              <div className="border-b border-neutral-700 bg-neutral-700 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">New Name Record</div>
                <div className="mt-1 text-base font-semibold leading-snug text-gray-400">
                  {activeProgressionModal.recordName}
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  {activeProgressionModal.recordLength} characters
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                  Progression Unlocked
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {formatUnlockLabel(activeProgressionModal.unlock.unlock)} - {activeProgressionModal.unlock.playerTitle}
                </div>
                <p className="mt-2 text-sm leading-snug text-gray-600">{activeProgressionModal.unlock.description}</p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-100"
                    onClick={dismissProgressionModal}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : undefined;

  const handleAddFreeWeapon = () => {
    dispatch(addFreeInboxWeapon(undefined));
  };

  const handleDonateOutbox = () => {
    if (!hasDonateUnlocked || outboxItems.length === 0) return;
    dispatch(donateOutboxItems(undefined));
  };

  const handleSellOutbox = () => {
    if (!hasSellUnlocked || outboxItems.length === 0) return;
    dispatch(sellOutboxItems(undefined));
  };

  return (
    <div className="w-full h-full box-border overflow-hidden bg-slate-100 p-4">
      <div className="w-full h-full min-h-0 grid grid-cols-[4fr_7fr_4fr] gap-4">
        <section className="rounded-lg border border-slate-300 bg-white p-4 flex flex-col min-h-0 overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-800">Inbox</h2>
          <div className="mt-1 flex gap-2 items-center">
            {hasAutoBuyUnlocked ? (
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAutobuyEnabled}
                  onChange={() => dispatch(toggleAutobuy(undefined))}
                  className="accent-slate-600"
                  data-testid="autobuy-checkbox"
                />
                Autobuy
              </label>
            ) : null}
            {/* Show Free button only if Buy and AutoBuy are both not unlocked */}
            {!hasBuyUnlocked && !hasAutoBuyUnlocked && (
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Beg practice weapons from your local blacksmith."
                onClick={handleAddFreeWeapon}
                disabled={inboxItems.length >= OUTBOX_CAPACITY}
                data-testid="free-button-enchant"
              >
                Free
              </button>
            )}
            {/* Show Buy button if unlocked and not auto-buy */}
            {hasBuyUnlocked && !hasAutoBuyUnlocked && (
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                title="Visit the blacksmith's shop to buy weapons."
                onClick={onNavigateToBuy}
              >
                Buy
              </button>
            )}
          </div>

          <div className="mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-wrap content-start">
              {inboxItems.length === 0 ? (
                <div className="w-full text-sm text-slate-500">Empty</div>
              ) : (
                inboxItems.map((weapon, index) => (
                  <div
                    key={`tin-axe-${index}`}
                    className="w-1/3 px-1 pb-1.5"
                    draggable
                    onDragStart={() => handleDragStart(index, "inbox")}
                    onClick={() => handleInboxWeaponClick(index)}
                    data-testid="inbox-weapon"
                  >
                    <div
                      className="relative group cursor-grab active:cursor-grabbing"
                      onMouseEnter={(event) =>
                        handleWeaponMouseEnter(
                          event,
                          weapon,
                          isLastRowItem(index, inboxItems.length, 3) ? "above" : "below"
                        )
                      }
                      onMouseLeave={handleWeaponMouseLeave}
                    >
                      <img
                        src={getWeaponIconSrc(weapon.class)}
                        alt={`${toTitleCase(weapon.class)} weapon illustration`}
                        aria-label={`${toTitleCase(weapon.class)} weapon`}
                        className={`h-14 w-full object-contain ${isInboxEntering ? 'inbox-item-enter' : ''}`}
                        style={isInboxEntering ? { animationDelay: `${index * INBOX_ENTER_STAGGER_MS}ms` } : undefined}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section
          className="rounded-lg border border-slate-300 bg-white p-4 flex flex-col items-center justify-center min-h-0 overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDropWorkArea}
          data-testid="work-area"
        >
          {workAreaItem === undefined ? (
            <h2 className="text-lg font-semibold text-slate-800">Work Area</h2>
          ) : (
            <div
              className="w-full h-full min-h-0 flex flex-col items-center justify-center p-4"
              onClick={handleWorkAreaWeaponClick}
            >
              <div className="h-1/5 w-full flex items-center justify-center">
                <div className="h-full w-full flex items-center justify-center px-2 text-slate-700 text-center leading-none whitespace-nowrap overflow-hidden text-ellipsis text-2xl">
                  {getWeaponLabel(workAreaItem)}
                </div>
              </div>
              <img
                src={getWeaponIconSrc(workAreaItem.class)}
                alt={`${toTitleCase(workAreaItem.class)} weapon illustration`}
                aria-label={`${toTitleCase(workAreaItem.class)} weapon`}
                className={`w-full h-3/5 max-w-md max-h-md py-2 cursor-grab active:cursor-grabbing object-contain ${isEnchanting ? 'enchanting' : ''}`}
                draggable={workAreaItem?.name !== undefined}
                onDragStart={() => handleDragStart(0, "workarea")}
              />
              <div className="h-1/5 w-full flex flex-col items-center justify-center gap-1">
                <Gold value={weaponValue({ weapon: workAreaItem })} />
                {isWorkAreaItemEnchanted ? (
                  <button
                    type="button"
                    className="rounded-md bg-gray-400 px-4 py-2 text-sm font-medium text-slate-900 shadow hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleShipIt}
                    disabled={isEnchanting || outboxItems.length >= OUTBOX_CAPACITY}
                  >
                    Ship it
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleEnchant}
                    disabled={isEnchanting}
                    data-testid="enchant-button"
                  >
                    Enchant
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <section
          className="rounded-lg border border-slate-300 bg-white p-4 flex flex-col min-h-0 overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDropOutbox}
        >
          <h2 className="text-lg font-semibold text-slate-800">Outbox</h2>
          <div className="flex items-center gap-2 mt-1">
            {hasSellUnlocked && (
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={sellUnlockDescription}
                onClick={handleSellOutbox}
                disabled={outboxItems.length === 0}
              >
                Sell
              </button>
            )}
            {hasAutoSellUnlocked && (
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAutosellEnabled}
                  onChange={() => dispatch(toggleAutosell(undefined))}
                  className="accent-amber-600"
                  data-testid="autosell-checkbox"
                />
                Autosell
              </label>
            )}
            {hasDonateUnlocked && !hasSellUnlocked && (
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={donateUnlockDescription}
                onClick={handleDonateOutbox}
                disabled={outboxItems.length === 0}
              >
                Donate
              </button>
            )}
          </div>
          <div className="mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-wrap content-start">
              {outboxItems.length === 0 ? (
                <div className="w-full text-sm text-slate-500">Empty</div>
              ) : (
                outboxItems.map((weapon, index) => (
                  <div key={`outbox-${index}`} className="w-1/3 px-1 pb-1.5" data-testid="outbox-weapon">
                    <div
                      className="relative group"
                      onMouseEnter={(event) =>
                        handleWeaponMouseEnter(
                          event,
                          weapon,
                          isLastRowItem(index, outboxItems.length, 3) ? "above" : "below"
                        )
                      }
                      onMouseLeave={handleWeaponMouseLeave}
                    >
                      <img
                        src={getWeaponIconSrc(weapon.class)}
                        alt={`${toTitleCase(weapon.class)} weapon illustration`}
                        aria-label={`${toTitleCase(weapon.class)} weapon`}
                        className="h-14 w-full object-contain"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
      {hoverTooltip && (
        <WeaponTooltip
          weapon={hoverTooltip.weapon}
          x={hoverTooltip.x}
          y={hoverTooltip.y}
          placement={hoverTooltip.placement}
        />
      )}
      {isConfettiActive ? (
        <div key={confettiBurstKey} className="confetti-burst" aria-hidden="true">
          {Array.from({ length: CONFETTI_PARTICLE_COUNT }, (_, index) => {
            const angle = (index / CONFETTI_PARTICLE_COUNT) * 360;
            const distance = 72 + (index % 5) * 24;
            const drop = 48 + (index % 4) * 18;
            const spin = (index % 2 === 0 ? 1 : -1) * (160 + index * 10);

            return (
              <span
                key={`confetti-${confettiBurstKey}-${index}`}
                className="confetti-piece"
                style={{
                  "--confetti-angle": `${angle}deg`,
                  "--confetti-distance": `${distance}px`,
                  "--confetti-drop": `${drop}px`,
                  "--confetti-spin": `${spin}deg`,
                  "--confetti-color": CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      ) : undefined}
      {progressionModalOverlay}
    </div>
  );
};

export default Enchant;