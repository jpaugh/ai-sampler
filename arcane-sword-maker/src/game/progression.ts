export type Unlock =
    | "donate"
    | "sell"
    | "buy"
    | "auto-sell"
    | "auto-buy"

export type UnlockMeta = {
    unlock: Unlock;
    playerTitle: string;
    description: string;
}

export const unlocks: UnlockMeta[] = [
    {
        unlock: "donate",
        playerTitle: "Apprentice",
        description: "Donate your crappy weapons for the blacksmith apprentice to smelt and reforge for practice",
    },
    {
        unlock: "sell",
        playerTitle: "Journeyman",
        description: "Finally! You have paying customers.",
    },
    {
        unlock: "buy",
        playerTitle: "Master",
        description: "As a respected master, you may now buy weapons from the blacksmith at market rate",
    },
    {
        unlock: "auto-sell",
        playerTitle: "Accomplished Master",
        description: "You've gained the recognition of a local merchant, who offers to sell your weapons for you -- for a small fee, of course."
    },
    {
        unlock: "auto-buy",
        playerTitle: "Renowned Master",
        description: "You've attracted apprentices of your own, who can now run errands for you!"
    },
]