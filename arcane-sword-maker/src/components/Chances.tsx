import React from "react";
import NameList from "./NameList";
import MaterialSelect from "./MaterialSelect";
import QualitySelect from "./QualitySelect";
import WeaponClassSelect from "./WeaponClassSelect";
import type { Weapon, WeaponClass } from "../game/weapons";
import type { Material, Quality } from "../game/weights";
import { useAppSelector } from "../store/store";

const DEFAULT_CLASS: WeaponClass = "axe";
const DEFAULT_MATERIAL: Material = "tin";
const DEFAULT_QUALITY: Quality = "shoddy";

const pickAvailable = <TValue extends string>(
  current: TValue,
  unlocked: readonly TValue[],
  fallback: TValue
): TValue => {
  if (unlocked.length === 0) return fallback;
  if (unlocked.includes(current)) return current;
  return unlocked[0] ?? fallback;
};

const Chances: React.FC = () => {
  const unlockedWeaponClasses = useAppSelector(
    (state) => state.game.progression.unlockedWeaponClasses
  );
  const unlockedMaterials = useAppSelector((state) => state.game.progression.unlockedMaterials);
  const unlockedQualities = useAppSelector((state) => state.game.progression.unlockedQualities);

  const [weaponClass, setWeaponClass] = React.useState<WeaponClass>(DEFAULT_CLASS);
  const [material, setMaterial] = React.useState<Material>(DEFAULT_MATERIAL);
  const [quality, setQuality] = React.useState<Quality>(DEFAULT_QUALITY);

  React.useEffect(() => {
    setWeaponClass((current) => pickAvailable(current, unlockedWeaponClasses, DEFAULT_CLASS));
  }, [unlockedWeaponClasses]);

  React.useEffect(() => {
    setMaterial((current) => pickAvailable(current, unlockedMaterials, DEFAULT_MATERIAL));
  }, [unlockedMaterials]);

  React.useEffect(() => {
    setQuality((current) => pickAvailable(current, unlockedQualities, DEFAULT_QUALITY));
  }, [unlockedQualities]);

  const selectedWeapon = React.useMemo<Weapon>(
    () => ({
      class: weaponClass,
      material,
      quality,
    }),
    [material, quality, weaponClass]
  );

  return (
    <div className="h-full w-full overflow-hidden bg-slate-100 p-4">
      <div className="grid h-full min-h-0 grid-cols-[220px_1fr] gap-3">
        <section className="rounded-lg border border-slate-300 bg-slate-50 p-3">
          <h2 className="text-sm font-semibold text-slate-800">Weapon</h2>
          <div className="mt-3 space-y-2">
            <WeaponClassSelect
              id="chances-weapon-class"
              value={weaponClass}
              options={unlockedWeaponClasses}
              onChange={setWeaponClass}
            />
            <MaterialSelect
              id="chances-weapon-material"
              value={material}
              options={unlockedMaterials}
              onChange={setMaterial}
            />
            <QualitySelect
              id="chances-weapon-quality"
              value={quality}
              options={unlockedQualities}
              onChange={setQuality}
            />
          </div>
        </section>
        <section className="min-h-0 overflow-y-auto rounded-lg border border-slate-300 bg-slate-50">
          <NameList weapon={selectedWeapon} className="items-start justify-start" />
        </section>
      </div>
    </div>
  );
};

export default Chances;
