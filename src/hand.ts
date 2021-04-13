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

  private sort() {}
}
