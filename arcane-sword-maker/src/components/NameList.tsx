import React from "react";
import {
  generateAllWeightedNameForms,
  defaultChainSource,
  applyChain,
} from "../game/names";
import getRandomMakerName from "../game/makerNames";
import type { Weapon } from "../game/weapons";
import { useAppSelector } from "../store/store";

type NameList2Props = {
  weapon: Weapon;
  maxSteps?: number;
  className?: string;
};

const NameList: React.FC<NameList2Props> = ({ weapon, maxSteps = 100, className }) => {
  const unlockedNameForms = useAppSelector((state) => state.game.progression.unlockedNameForms);
  const unlockedFormSet = React.useMemo(() => new Set(unlockedNameForms), [unlockedNameForms]);
  const makerName = getRandomMakerName();
  const weightedChains = React.useMemo(() => {
    return generateAllWeightedNameForms({ source: defaultChainSource, weapon, maxSteps }).map(
      ([chance, nform]) => ({
        chance,
        key: nform.join("|"),
        chain: applyChain({
          chain: nform,
          alternatives: {
            ActionOrAttribute: ["Slashing"],
            Class: ["Axe"],
            Maker: [makerName],
            MaterialOrAttribute: ["Quality"],
            Of: ["of"],
            SuffixDescriptor: ["Arrogant"],
          },
        }),
      })
    );
  }, [maxSteps, weapon, makerName]);

  const visibleChains = React.useMemo(
    () => weightedChains.filter(({ key }) => unlockedFormSet.has(key)),
    [unlockedFormSet, weightedChains]
  );

  const undiscoveredChance = React.useMemo(
    () => weightedChains.reduce((total, { chance, key }) => (unlockedFormSet.has(key) ? total : total + chance), 0),
    [unlockedFormSet, weightedChains]
  );

  const rows = React.useMemo(() => {
    const knownRows = visibleChains.map(({ chance, chain }) => ({
      chance,
      label: chain.join(" · ") || "·",
    }));

    if (undiscoveredChance > 0) {
      knownRows.push({
        chance: undiscoveredChance,
        label: "Undiscovered",
      });
    }

    return knownRows;
  }, [undiscoveredChance, visibleChains]);

  const maxPercentWidth = React.useMemo(() => {
    return rows.reduce((maxWidth, { chance }) => {
      const label = `(${(chance * 100).toFixed(2)}%)`;
      return Math.max(maxWidth, label.length);
    }, 0);
  }, [rows]);

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <ul>
        {rows.map(({ label, chance }, i) => (
          <li key={i}>
            <span className="font-mono whitespace-pre">
              {`(${(chance * 100).toFixed(2)}%)`.padStart(maxPercentWidth, " ")}
            </span>{" "}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NameList;
