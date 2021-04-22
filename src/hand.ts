/*
Player's hand
*/
import * as Card from "./card";
import * as CalcFunctions from "./calcFunctions";

export class Hand {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
  }

  public giveCards(...cards: Card.Card[]) {
    this.cards = this.cards.concat(cards);
    this.sort();
  }

  public count(): number {
    return this.cards.length;
  }

  public countCardsWithSpecifiedNumber(cardNumber: number) {
    return this.cards.filter((val) => {
      return val.cardNumber == cardNumber;
    }).length;
  }

  public countJokers() {
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
