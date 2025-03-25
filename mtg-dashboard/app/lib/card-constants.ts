// app/lib/card-constants.ts

export const CARD_FORMATS = [
    'Standard',
    'Pioneer',
    'Modern',
    'Legacy',
    'Vintage',
    'Commander'
] as const;

export const CARD_RARITIES = [
    'Common',
    'Uncommon',
    'Rare',
    'Mythic'
] as const;

export const CARD_FINISHES = [
    'nonfoil',
    'foil',
    'etched'
] as const;
  

export type CardFormat = typeof CARD_FORMATS[number];
export type CardRarity = typeof CARD_RARITIES[number];
export type CardFinish = typeof CARD_FINISHES[number];
