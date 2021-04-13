/*
Daifugo card deck
*/
import * as Card from "./card";

export class Deck {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
    // Clubs 1 to 13
    for (let i: number = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.CLUBS, i as Card.CardNumber));
    }
    // Diamonds 1 to 13
    for (let i: number = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.DIAMONDS, i as Card.CardNumber));
    }
    // Hearts 1 to 13
    for (let i: number = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.HEARTS, i as Card.CardNumber));
    }
    // Spades 1 to 13
    for (let i: number = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.SPADES, i as Card.CardNumber));
    }
    // Jokers
    this.cards.push(new Card.Card(Card.Mark.JOKER));
    this.cards.push(new Card.Card(Card.Mark.JOKER));
  }

  public shuffle() {
    const out = Array.from(this.cards);
    for (let i = out.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[r];
      out[r] = tmp;
    }
    this.cards = out;
  }
}
