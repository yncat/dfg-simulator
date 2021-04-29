/*
Player's hand
*/
import * as Card from "./card";

export class Hand {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
  }

  public giveCards(...cards: Card.Card[]): void {
    this.cards = this.cards.concat(cards);
    this.sort();
  }

  public giveCardsWithoutSorting(...cards: Card.Card[]): void {
    // specifically for tests
    this.cards = this.cards.concat(cards);
  }

  public count(): number {
    return this.cards.length;
  }

  public countCardsWithSpecifiedNumber(cardNumber: number): number {
    return this.cards.filter((val) => {
      return val.cardNumber == cardNumber;
    }).length;
  }

  public countJokers(): number {
    return this.cards.filter((val) => {
      return val.isJoker();
    }).length;
  }

  private sort() {
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
