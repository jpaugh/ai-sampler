
export const makerNames = [
    "Kennard's",
    "Knox'",
    "Landan's",
    "Leigh's",
    "Shelton's",
    "Stanford's",
    "Darrene's",
    "Audrey's",
    "Haywood's",
    "Halsey's",
]

export default function getRandomMakerName(): string {
    return makerNames[Math.floor(Math.random() * makerNames.length)]
}