import React from "react";
import type { Weapon } from "../game/weapons";
import NameList from "./NameList";

const sampleWeapon: Weapon = {
  class: "axe",
  material: "tin",
  quality: "shoddy",
};

const TestNames: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full h-full flex flex-row gap-6">
        <NameList
          weapon={sampleWeapon}
          className="flex-1 flex items-center justify-center p-4"
        />
      </div>
    </div>
  );
};

export default TestNames;
