import React from "react";
import { weaponClasses, type WeaponClass } from "../game/weapons";

const formatLabel = (value: string): string =>
  value
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

type WeaponClassSelectProps = {
  id: string;
  value: WeaponClass;
  options: WeaponClass[];
  onChange: (value: WeaponClass) => void;
};

const WeaponClassSelect: React.FC<WeaponClassSelectProps> = ({ id, value, options, onChange }) => {
  const optionSet = React.useMemo(() => new Set(options), [options]);
  const visibleOptions = React.useMemo(
    () => weaponClasses.filter((option) => optionSet.has(option)),
    [optionSet]
  );

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
      <span>Class</span>
      <select
        id={id}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        value={value}
        onChange={(event) => onChange(event.target.value as WeaponClass)}
        disabled={visibleOptions.length === 0}
      >
        {visibleOptions.length === 0 ? <option value="">None unlocked yet</option> : undefined}
        {visibleOptions.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default WeaponClassSelect;
