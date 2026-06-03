import React from "react";
import { qualities, type Quality } from "../game/weights";

const formatLabel = (value: string): string =>
  value
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

type QualitySelectProps = {
  id: string;
  value: Quality;
  options: Quality[];
  onChange: (value: Quality) => void;
};

const QualitySelect: React.FC<QualitySelectProps> = ({ id, value, options, onChange }) => {
  const optionSet = React.useMemo(() => new Set(options), [options]);
  const visibleOptions = React.useMemo(
    () => qualities.filter((option) => optionSet.has(option)),
    [optionSet]
  );

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
      <span>Quality</span>
      <select
        id={id}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        value={value}
        onChange={(event) => onChange(event.target.value as Quality)}
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

export default QualitySelect;
