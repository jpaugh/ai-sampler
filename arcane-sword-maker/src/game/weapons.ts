import { materialWeightMultiplier, qualityWeightMultiplier, type WeaponAttributes } from "./weights"

export const weaponClasses = [
    "axe",
    "sword",
    "mace",
    "spear",
    "bow",
    "dagger",
    "staff",
    "crossbow",
    "flail",
    "halberd",
    "scythe",
    "whip",
    "hammer",
    "club",
    "fist weapon",
    "polearm",
    "wand",
    "gun",
    "cannon",
    "lance",
    "sling",
    "chakram",
    "boomerang",
    "shuriken",
    "throwing axe",
    "throwing knife",
    "net",
    "ball and chain",
] as const

export type WeaponClass = typeof weaponClasses[number]

export type Weapon = WeaponAttributes & {
    name?: string,
    class: WeaponClass,
}

export const weaponValue: (p: {
    weapon: Weapon,
}) => number = ({ weapon }) => {
    const { name, quality, material, class: wclass } = weapon
    const nameLength = name?.length ?? (wclass.length / 2)

    return nameLength * qualityWeightMultiplier[quality] * materialWeightMultiplier[material]
}