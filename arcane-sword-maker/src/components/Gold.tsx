import React from "react";
import { useAppSelector } from "../store/store";

interface GoldProps {
  value: number;
  className?: string;
}

/**
 * Formats and displays a gold value with optional decimals and styling.
 * Example: <Gold value={123.45} /> => "123.45G"
 */
const Gold: React.FC<GoldProps> = ({ value, className = "" }) => {
  const unlockedUnlocks = useAppSelector(state => state.game.progression.unlockedUnlocks);
  const hasSellUnlock = unlockedUnlocks.includes("sell");
  if (!hasSellUnlock) return null;
  const formatted = Number.isInteger(value)
    ? `${value}G`
    : `${value.toFixed(2)}G`;
  return <span className={`text-amber-700 font-semibold ${className}`.trim()}>{formatted}</span>;
};

export default Gold;
