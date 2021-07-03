/*
Daifugo cards
*/
import * as CalcFunctions from "./calcFunctions";

// Marks
export const CardMark = {
  CLUBS: 0,
  DIAMONDS: 1,
  HEARTS: 2,
  SPADES: 3,
  JOKER: 4,
} as const;
export type CardMark = typeof CardMark[keyof typeof CardMark];

// type 0 = Joker
export type CardNumber = number;

class InvalidCardError extends Error {}

export class Card {
  private wildcard: boolean; // When true, it means that the card was originally a joker and is now used as a wildcard.
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
    this.wildcard = false;
  }

  public isSameFrom(anotherCard: Card): boolean {
    return (
      this.mark == anotherCard.mark &&
      this.cardNumber == anotherCard.cardNumber &&
      this.isWildcard() == anotherCard.isWildcard()
    );
  }

  public flagAsWildcard() {
    this.wildcard = true;
  }

  public isWildcard(): boolean {
    return this.wildcard;
  }

  public isJoker(): boolean {
    return this.mark == CardMark.JOKER;
  }

  public calcStrength(): number {
    return CalcFunctions.convertCardNumberIntoStrength(this.cardNumber);
  }

  public copy(): Card {
    const c = new Card(this.mark, this.cardNumber);
    if (this.wildcard) {
      c.flagAsWildcard();
    }
    return c;
  }
}
