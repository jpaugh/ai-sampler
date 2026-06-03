import React from "react";
import Gold from "./Gold";
import WeaponTooltip from "./WeaponTooltip";
import type { Weapon } from "../game/weapons";
import { weaponValue } from "../game/weapons";
import {
  addFreeInboxWeapon,
  buyWeaponFromShop,
  initializeShop,
  refreshShopInventory,
} from "../store/gameSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import { useSound } from "../hooks/useSound";


const toTitleCase = (value: string): string =>
  value
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const INVENTORY_SIZE = 6;

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

import { publicAssetUrl } from "../utils/audioTheme";

const getWeaponIconSrc = (weaponClass: string) => {
  const normalized = weaponClass.replace(/\s+/g, '-').toLowerCase();
  return publicAssetUrl(`assets/${normalized}.svg`);
};

const Buy: React.FC = () => {
  const dispatch = useAppDispatch();
  const inboxItems = useAppSelector((state) => state.game.inboxItems);
  const shopInventory = useAppSelector((state) => state.game.blacksmithInventory);
  const shopRefreshesAt = useAppSelector((state) => state.game.blacksmithRefreshesAt);
  const totalGold = useAppSelector((state) => state.game.progression.stats.totalSoldValue);
  const [timeUntilRefresh, setTimeUntilRefresh] = React.useState<number>(0);
  const [hoverTooltip, setHoverTooltip] = React.useState<{
    weapon: Weapon;
    x: number;
    y: number;
    placement?: "above" | "below";
  } | undefined>(undefined);

  const moveSound = useSound('move-weapon');

  React.useEffect(() => {
    dispatch(initializeShop());
  }, [dispatch]);

  React.useEffect(() => {
    if (!shopRefreshesAt) return;

    const updateTimer = () => {
      const remaining = shopRefreshesAt - Date.now();
      if (remaining <= 0) {
        dispatch(refreshShopInventory());
      } else {
        setTimeUntilRefresh(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [shopRefreshesAt, dispatch]);

  const handleAddFreeWeapon = () => {
    dispatch(addFreeInboxWeapon());
  };

  const handleBuyWeapon = (index: number) => {
    const weapon = shopInventory[index];
    if (!weapon) return;

    const cost = weaponValue({ weapon });
    if (totalGold < cost) return;
    if (inboxItems.length >= INVENTORY_SIZE) return;

    dispatch(buyWeaponFromShop(index));
    moveSound.play();
  };

  const handleWeaponMouseEnter = (event: React.MouseEvent<HTMLDivElement>, weapon: Weapon) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverTooltip({
      weapon,
      x: rect.left + rect.width / 2,
      y: rect.top - 6,
      placement: "above",
    });
  };

  const handleWeaponMouseLeave = () => {
    setHoverTooltip(undefined);
  };

  return (
    <div className="w-full h-full box-border overflow-hidden bg-slate-100 p-4 flex flex-col relative">
      {/* Shop Container with background extending to bottom */}
      <div className="flex-1 min-h-0 rounded-t-lg rounded-b-lg border-x border-t border-slate-300 bg-white flex flex-col overflow-hidden">
        {/* Shop Inventory */}
        <section className="flex-1 min-h-0 p-4 pb-2 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-slate-800">Blacksmith's Shop</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Beg practice weapons from your local blacksmith."
                onClick={handleAddFreeWeapon}
                disabled={inboxItems.length >= INVENTORY_SIZE}
                data-testid="free-button-shop"
              >
                Free
              </button>
              <div className="text-xs font-semibold text-slate-600">
                Shop refreshes in: {formatTime(timeUntilRefresh)}
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="grid grid-cols-6 gap-2 pt-3 place-items-center">
              {shopInventory
                .map((weapon: Weapon, index: number) => ({ weapon, index, cost: weaponValue({ weapon }) }))
                .sort((a: { cost: number }, b: { cost: number }) => a.cost - b.cost)
                .map(({ weapon, index, cost }: { weapon: Weapon; index: number; cost: number }) => {
                  const canAfford = totalGold >= cost;
                  const canBuy = canAfford && inboxItems.length < INVENTORY_SIZE;
                  return (
                    <div
                      key={`shop-weapon-${index}`}
                      data-testid="shop-weapon"
                      className={`relative border border-slate-300 rounded-lg p-2 flex flex-col items-center justify-between h-24 w-12 ${
                        canBuy
                          ? "cursor-pointer hover:bg-slate-50 hover:border-slate-400"
                          : canAfford
                          ? "opacity-50 cursor-not-allowed"
                          : "opacity-30 cursor-not-allowed"
                      }`}
                      onClick={() => canBuy && handleBuyWeapon(index)}
                      onMouseEnter={(event) => handleWeaponMouseEnter(event, weapon)}
                      onMouseLeave={handleWeaponMouseLeave}
                    >
                      <img
                        src={getWeaponIconSrc(weapon.class)}
                        alt={`${toTitleCase(weapon.class)} weapon illustration`}
                        aria-label={`${toTitleCase(weapon.class)} weapon`}
                        className="h-16 w-10 object-contain"
                      />
                      <div className="mt-0.5 mb-2 text-xs text-center">
                        <Gold value={cost} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      </div>

      {/* User Inventory Overlay */}
        <div className="absolute left-0 right-0 bottom-0 bg-slate-200 rounded-t-lg border-x border-t border-slate-300 pt-2 px-4 flex flex-col overflow-hidden z-20 mx-8">
        <h2 className="text-xs font-semibold text-slate-700 mb-1">Inventory</h2>
        <div className="flex gap-1.5 pb-2">
          {Array.from({ length: INVENTORY_SIZE }).map((_, index) => {
            const weapon = inboxItems[index];
            return (
              <div
                key={`inventory-slot-${index}`}
                className={`flex-1 border border-slate-200 rounded p-0.5 ${
                  weapon ? "bg-white" : "bg-slate-50"
                }`}
              >
                {weapon && (
                  <img
                    src={getWeaponIconSrc(weapon.class)}
                    alt={`${toTitleCase(weapon.class)} weapon illustration`}
                    aria-label={`${toTitleCase(weapon.class)} weapon`}
                    className="h-8 w-full object-contain"
                    onMouseEnter={(event) => handleWeaponMouseEnter(event, weapon)}
                    onMouseLeave={handleWeaponMouseLeave}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoverTooltip && (
        <WeaponTooltip
          weapon={hoverTooltip.weapon}
          x={hoverTooltip.x}
          y={hoverTooltip.y}
          placement={hoverTooltip.placement}
        />
      )}
    </div>
  );
};

export default Buy;
