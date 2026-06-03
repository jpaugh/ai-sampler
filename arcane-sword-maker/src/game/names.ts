import { applyWeights, baseWeightMap, type Probability, type WeightMap } from "./weights"
import type { Weapon } from "./weapons"

export type NamePart =
    | LeafNamePart
    | "Root"
    | "General"
    | "Prefix"
    | "Suffix"

export type LeafNamePart =
    | "Class"
    | "Of"
    | "Maker"
    | "MaterialOrAttribute"
    | "ActionOrAttribute"
    | "SuffixDescriptor"

export const isLeafNamePart: (value: unknown) => value is LeafNamePart =
    (value: unknown): value is LeafNamePart => {
        return typeof value === "string" && [
            "Class",
            "Of",
            "Maker",
            "MaterialOrAttribute",
            "ActionOrAttribute",
            "SuffixDescriptor",
        ].includes(value);
    }

export type NonLeafPart = Exclude<NamePart, LeafNamePart>

export type ChainEntry = {
    name: NamePart,
    next: NameOption[],
}

export type WeightedNameOption = NameOption & {
    w: number,
}

export type NameOption = {
    n: NamePart,
    p: Probability,
}

export type Chain = Record<NamePart, ChainEntry>

export const defaultChainSource: Chain = {
    Root: {
        name: "Root",
        next: [
            { n: "General", p: "high" },
            { n: "Maker", p: "low" },
        ],
    },

    General: {
        name: "General",
        next: [
            { n: "Class", p: "high" },
            { n: "Prefix", p: "low" },
        ],
    },

    Prefix: {
        name: "Prefix",
        next: [
            { n: "MaterialOrAttribute", p: "high" },
        ],
    },

    Suffix: {
        name: "Suffix",
        next: [
            { n: "ActionOrAttribute", p: "high" },
            { n: "SuffixDescriptor", p: "low" },
        ],
    },

    Class: {
        name: "Class",
        next: [
            { n: "Root", p: "high" },
            { n: "Of", p: "low" },
        ],
    },

    Of: {
        name: "Of",
        next: [
            { n: "Suffix", p: "high" },
        ],
    },

    Maker: {
        name: "Maker",
        next: [
            { n: "Class", p: "high" },
            { n: "General", p: "low" },
        ],
    },

    MaterialOrAttribute: {
        name: "MaterialOrAttribute",
        next: [
            { n: "Class", p: "high" },
        ],
    },

    ActionOrAttribute: {
        name: "ActionOrAttribute",
        next: [
            { n: "Root", p: "high", },
        ],
    },

    SuffixDescriptor: {
        name: "SuffixDescriptor",
        next: [
            { n: "ActionOrAttribute", p: "high" },
        ],
    },
};

export const applyChain: (a: {
    chain: LeafNamePart[],
    alternatives: Record<LeafNamePart, string[]>,
}) => string[] = ({ chain, alternatives }) => {
    return chain.map(part => {
        const alts = alternatives[part]
        if (!alts || alts.length === 0) return 'undefined'

        const choice = Math.floor(Math.random() * alts.length)
        return alts[choice]
    })
}

/**
 * Calculates the weighted probabilities for a given set of name alternatives.
 */
export const calcWeights: (a: {
    dest: NameOption[],
    weights: WeightMap,
}) => WeightedNameOption[] = ({ dest, weights }) => {
    type LowKeys = keyof typeof weights

    const lowWeightsSum = (["medium", "low", "verylow"] as LowKeys[])
        .reduce((s, k) => s + (weights[k] ?? 0), 0);

    const highWeight = Math.max(0, 1 - lowWeightsSum);

    const counts: Record<Probability, number> = {
        high: 0,
        medium: 0,
        low: 0,
        verylow: 0,
    };

    for (const nameOpt of dest) {
        counts[nameOpt.p]++;
    }

    const perLabelWeight: Record<Probability, number> = {
        high: highWeight,
        medium: weights["medium"] ?? 0,
        low: weights["low"] ?? 0,
        verylow: weights["verylow"] ?? 0,
    };

    const result: WeightedNameOption[] = dest.map((nameOpt) => {
        const label = nameOpt.p;
        const count = counts[label];
        const w = count <= 0 ? 0 : perLabelWeight[label] / count;
        return { ...nameOpt, w };
    });

    return result;
};

export const generateChain: (a: {
    source: Chain,
    weights: WeightMap
}) => LeafNamePart[] = ({ source, weights }) => {
    const result: LeafNamePart[] = [];
    let current: NamePart = "Root";
    const MAX_STEPS = 100;
    let steps = 0;

    while (steps < MAX_STEPS) {
        steps++;

        const entry = source[current];
        if (!entry || !entry.next || entry.next.length === 0) break;

        if (isLeafNamePart(current)) result.push(current);

        const weighted = calcWeights({ dest: entry.next, weights });

        const totalWeight = weighted.reduce((s, it) => s + (it.w ?? 0), 0);
        if (totalWeight <= 0) break;

        let r = Math.random() * totalWeight;
        let chosen: NamePart | null = null;
        for (const w of weighted) {
            r -= (w.w ?? 0);
            if (r <= 0) {
                chosen = w.n;
                break;
            }
        }

        if (!chosen) chosen = weighted[weighted.length - 1].n;
        if (chosen === "Root") break;
        current = chosen;
    }

    return result;
};

export const generateAllNameForms = ({
    source,
    maxSteps = 100
}: {
    source: Chain,
    maxSteps?: number,
}) => {
    const allNames: LeafNamePart[][] = [];

    const visit = (current: NamePart, chainSoFar: LeafNamePart[], steps: number) => {
        const isAtEnd = current == "Root" && chainSoFar.length > 0
        if (steps >= maxSteps || isAtEnd) {
            allNames.push(chainSoFar.slice());
            return;
        }

        const entry = source[current];
        if (!entry || !entry.next || entry.next.length === 0) {
            allNames.push(chainSoFar.slice());
            return;
        }

        const newChain = isLeafNamePart(current) ? chainSoFar.concat(current as LeafNamePart) : chainSoFar;

        for (const opt of entry.next) {
            const nextName: NamePart = opt.n;
            visit(nextName, newChain, steps + 1);
        }
    };

    visit("Root", [], 0);

    const seen = new Set<string>();
    const uniqueChains: LeafNamePart[][] = [];
    for (const c of allNames) {
        const key = c.join("|");
        if (!seen.has(key)) {
            seen.add(key);
            uniqueChains.push(c);
        }
    }

    return uniqueChains;
};

export type WeightedNameForm = [number, LeafNamePart[]]

export const generateAllWeightedNameForms = ({
    source,
    weapon,
    maxSteps = 100,
}: {
    source: Chain,
    weapon: Weapon,
    maxSteps?: number,
}): WeightedNameForm[] => {
    const weights = applyWeights({
        weightMap: baseWeightMap,
        weaponAttributes: weapon,
    });

    const byChain = new Map<string, WeightedNameForm>();

    const addResult = (chain: LeafNamePart[], probability: number) => {
        const key = chain.join("|");
        const existing = byChain.get(key);

        if (!existing) {
            byChain.set(key, [probability, chain.slice()]);
            return;
        }

        existing[0] += probability;
    };

    const visit = (
        current: NamePart,
        chainSoFar: LeafNamePart[],
        steps: number,
        probabilitySoFar: number,
    ) => {
        const isAtEnd = current === "Root" && chainSoFar.length > 0;
        if (steps >= maxSteps || isAtEnd) {
            addResult(chainSoFar, probabilitySoFar);
            return;
        }

        const entry = source[current];
        if (!entry || !entry.next || entry.next.length === 0) {
            addResult(chainSoFar, probabilitySoFar);
            return;
        }

        const newChain = isLeafNamePart(current) ? chainSoFar.concat(current) : chainSoFar;
        const weighted = calcWeights({ dest: entry.next, weights });
        const totalWeight = weighted.reduce((s, option) => s + option.w, 0);

        if (totalWeight <= 0) {
            addResult(newChain, probabilitySoFar);
            return;
        }

        for (const option of weighted) {
            if (option.w <= 0) continue;

            const nextProbability = probabilitySoFar * (option.w / totalWeight);
            visit(option.n, newChain, steps + 1, nextProbability);
        }
    };

    visit("Root", [], 0, 1);

    return Array.from(byChain.values());
};
