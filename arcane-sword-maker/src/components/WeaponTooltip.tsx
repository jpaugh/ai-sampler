import React from 'react';
import Gold from './Gold';
import { weaponValue } from '../game/weapons';
import type { Weapon } from '../game/weapons';

interface WeaponTooltipProps {
  weapon: Weapon;
  value?: number;
  x?: number;
  y?: number;
  placement?: "above" | "below";
}

function getDisplayName(weapon: Weapon) {
  if (weapon.name && weapon.name.trim()) return weapon.name;
  return `unnamed ${weapon.material} ${weapon.class}`;
}

const WeaponTooltip: React.FC<WeaponTooltipProps> = ({ weapon, value, x, y, placement }) => {
  const displayValue = value !== undefined ? value : weaponValue({ weapon });
  return (
    <div
      className={`pointer-events-none fixed z-50 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-sm text-white${placement === "above" ? " -translate-y-full" : ""}`}
      style={x !== undefined && y !== undefined ? { left: x, top: y } : undefined}
    >
      <div className="weapon-tooltip__name">
        {getDisplayName(weapon)}
      </div>
      <div className="weapon-tooltip__gold">
        <Gold value={displayValue} />
      </div>
      <div className="weapon-tooltip__details">
        <div>Class: {weapon.class}</div>
        <div>Material: {weapon.material}</div>
        <div>Quality: {weapon.quality}</div>
      </div>
    </div>
  );
};

export default WeaponTooltip;
