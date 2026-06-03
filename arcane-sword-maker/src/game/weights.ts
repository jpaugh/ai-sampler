
export type Probability = "high" | "medium" | "low" | "verylow"

export type WeightMap = Record<Exclude<Probability, "high">, number>
export const baseWeightMap: WeightMap = {
    medium: .2,
    low: 0.09,
    verylow: 0.01,
}

export type WeaponAttributes = {
    quality: Quality,
    material: Material,
}

export const applyWeights: (p: {
    weightMap: WeightMap,
    weaponAttributes: WeaponAttributes,
}) => WeightMap = ({ weightMap, weaponAttributes }) => {
    const qualityMult = qualityWeightMultiplier[weaponAttributes.quality]
    const materialMult = materialWeightMultiplier[weaponAttributes.material]

    const result = { ...weightMap }

    for (const key in result) {
        const k = key as Exclude<Probability, "high">
        result[k] *= qualityMult * materialMult
    }

    return result
}

export const qualities = [
    "shoddy",
    "poor",
    "low",
    "medium",
    "high",
    "exquisite",
    "masterwork",
    "legendary",
    "mythic",
    "divine",
    "enchanted",
    "runed",
    "ancient",
] as const

export type Quality = typeof qualities[number]

export const qualityWeightMultiplier: Record<Quality, number> = {
    "shoddy": 0.5,
    "poor": 0.75,
    "low": 0.9,
    "medium": 1.0,
    "high": 1.2,
    "exquisite": 1.5,
    "enchanted": 1.6,
    "runed": 1.7,
    "masterwork": 1.8,
    "legendary": 2.5,
    "mythic": 3.0,
    "ancient": 3.5,
    "divine": 4.0,
}

export const materials = [
    "tin",
    "wood",
    "bronze",
    "iron",
    "steel",
    "gold",
    "platinum",
    "mithril",
    "adamantine",
    "orichalcum",
    "voidsteel",
    "demonsteel",
    "celestial bronze",
    "dragonbone",
    "obsidian",
    "crystal",
    "shadowglass",
    "bloodiron",
] as const

export type Material = typeof materials[number]

export const materialWeightMultiplier: Record<Material, number> = {
    tin: 0.8,
    wood: 0.7,
    bronze: 0.95,
    iron: 1.0,
    steel: 1.1,
    gold: 1.4,
    platinum: 1.6,
    mithril: 2.0,
    adamantine: 2.5,
    orichalcum: 2.2,
    voidsteel: 2.8,
    demonsteel: 2.7,
    "celestial bronze": 1.8,
    dragonbone: 2.0,
    obsidian: 1.6,
    crystal: 1.9,
    shadowglass: 2.3,
    bloodiron: 2.1,
}