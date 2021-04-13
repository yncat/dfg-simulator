/*
Daifugo cards
*/

// Marks
export const Mark = {
  JOKER: 0,
  CLUBS: 1,
  DIAMONDS: 2,
  HEARTS: 3,
  SPADES: 4,
} as const;
export type Mark = typeof Mark[keyof typeof Mark];

// type 0 = Joker
export type CardNumber =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13;

export class Card {
  constructor(public mark: Mark, public cardNumber: CardNumber = 0) {}
}
