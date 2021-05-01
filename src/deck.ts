/*
Daifugo card deck
*/
import * as Card from "./card";

export class Deck {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
    // Clubs 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.CLUBS, i));
    }
    // Diamonds 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.DIAMONDS, i));
    }
    // Hearts 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.HEARTS, i));
    }
    // Spades 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(new Card.Card(Card.Mark.SPADES, i));
    }
    // Jokers
    this.cards.push(new Card.Card(Card.Mark.JOKER));
    this.cards.push(new Card.Card(Card.Mark.JOKER));
  }

  public shuffle(): void {
    const out = Array.from(this.cards);
    for (let i = out.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[r];
      out[r] = tmp;
    }
    this.cards = out;
  }

  public draw(): Card.Card | null {
    const c = this.cards.pop();
    return c instanceof Card.Card ? c : null;
  }
}
