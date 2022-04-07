/*
Player's hand
*/
import * as Card from "./card";

export interface Hand {
  readonly cards: Card.Card[];
  give: (...cards: Card.Card[]) => void;
  take: (...cards: Card.Card[]) => void;
  count: () => number;
  countCardsWithSpecifiedNumber: (cardNumber: number) => number;
  countCardsWithSpecifiedMarkAndNumber: (
    cardMark: Card.CardMark,
    cardNumber: number
  ) => number;
  countJokers: () => number;
  sort: () => void;
}

class HandImple implements Hand {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
  }

  public give(...cards: Card.Card[]): void {
    this.cards = this.cards.concat(cards);
  }

  public take(...cards: Card.Card[]): void {
    // If one or more of the cards don't exist in the hand, they're just ignored.
    // when card mark is WILD, it means a wildcarded joker.
    for (let i = 0; i < cards.length; i++) {
      for (let j = 0; j < this.cards.length; j++) {
        if (cards[i].isSameCard(this.cards[j])) {
          this.cards.splice(j, 1);
          break;
        }
      }
    }
  }

  public count(): number {
    return this.cards.length;
  }

  public countCardsWithSpecifiedNumber(cardNumber: number): number {
    return this.cards.filter((val) => {
      return val.cardNumber == cardNumber;
    }).length;
  }

  public countCardsWithSpecifiedMarkAndNumber(
    cardMark: Card.CardMark,
    cardNumber: number
  ): number {
    return this.cards.filter((val) => {
      return val.mark == cardMark && val.cardNumber == cardNumber;
    }).length;
  }

  public countJokers(): number {
    return this.cards.filter((val) => {
      return val.isJoker();
    }).length;
  }

  public sort(): void {
    this.cards.sort((a, b) => {
      if (a.cardNumber == b.cardNumber) {
        return 0;
      }
      if (a.isJoker()) {
        return 1;
      }
      if (b.isJoker()) {
        return -1;
      }
      return a.calcStrength() < b.calcStrength() ? -1 : 1;
    });
  }
}

export function createHand(): Hand {
  return new HandImple();
}
