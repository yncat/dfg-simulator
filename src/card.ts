/*
Daifugo cards
*/
import * as Calculation from "./calculation";
import * as Identifier from "./identifier";

// Marks
export const CardMark = {
  CLUBS: 0,
  DIAMONDS: 1,
  HEARTS: 2,
  SPADES: 3,
  JOKER: 4,
  WILD: 5,
} as const;
export type CardMark = typeof CardMark[keyof typeof CardMark];

// Joker has cardNumber == 0
export type CardNumber = number;

export interface Card {
  readonly mark: CardMark;
  readonly cardNumber: number;
  // id can be used for identifying the card as a unique instance. For example, unique ID is needed when rendering card info in a list using the React framework. When using React, it should be specified in the key prop.
  readonly ID: string;
  isSameCard: (anotherCard: Card) => boolean;
  isSameMark: (anotherCard: Card) => boolean;
  isJoker: () => boolean;
  calcStrength: () => number;
  copy: () => Card;
  flagAsWildcard: () => Card;
}

class InvalidCardError extends Error {}

export class CardImple implements Card {
  public readonly ID: string;
  constructor(public mark: CardMark, public cardNumber: CardNumber = 0) {
    if (cardNumber < 0 || cardNumber > 13) {
      throw new InvalidCardError("card number range must be 0(joker) to 13");
    }
    if (mark == CardMark.JOKER && cardNumber != 0) {
      throw new InvalidCardError("card number must be 0 when it is a joker");
    }
    if (mark != CardMark.JOKER && cardNumber == 0) {
      throw new InvalidCardError(
        "card number must not be 0 when it is not a joker"
      );
    }
    this.ID = genID(mark, cardNumber);
  }

  public isSameCard(anotherCard: Card): boolean {
    // wildcards are treeted as joker, too.
    if (this.isJoker() && anotherCard.mark == CardMark.WILD) {
      return true;
    }
    if (anotherCard.isJoker() && this.mark == CardMark.WILD) {
      return true;
    }
    return (
      this.mark == anotherCard.mark && this.cardNumber == anotherCard.cardNumber
    );
  }

  public isSameMark(anotherCard: Card): boolean {
    if (this.mark === CardMark.WILD || anotherCard.mark === CardMark.WILD) {
      return true;
    }
    return this.mark === anotherCard.mark;
  }

  public isJoker(): boolean {
    return this.mark == CardMark.JOKER;
  }

  public calcStrength(): number {
    return Calculation.convertCardNumberIntoStrength(this.cardNumber);
  }

  public copy(): Card {
    return createCard(this.mark, this.cardNumber);
  }

  public flagAsWildcard(): Card {
    this.mark = CardMark.WILD;
    return this;
  }
}

export function createCard(mark: CardMark, cardNumber = 0): Card {
  return new CardImple(mark, cardNumber);
}

function genID(mark: CardMark, cardNumber: CardNumber): string {
  return `${mark}${cardNumber}${Identifier.randomHex(16)}`;
}
