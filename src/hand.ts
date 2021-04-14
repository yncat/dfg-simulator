/*
Player's hand
*/
import * as Card from "./card";

export class Hand {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
  }

  public giveCards(...cards: Card.Card[]) {
    this.cards = this.cards.concat(cards);
    this.sort();
  }

  private sort() {
    // Sorting rules: CLUBS -> DIAMONDS -> HEARTS -> SPADES -> JOKERS
    this.cards.sort((a, b) => {
      if (a.isSameFrom(b)) {
        return 0;
      }
      if (a.isJoker()) {
        return 1;
      }
      if (a.mark == b.mark) {
        return a.cardNumber < b.cardNumber ? -1 : 1;
      }
      return a.mark < b.mark ? -1 : 1;
    });
  }
}
