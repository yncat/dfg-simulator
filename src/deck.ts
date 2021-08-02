/*
Daifugo card deck
*/
import * as Card from "./card";

export interface Deck {
  cards: Card.Card[];
  shuffle: () => void;
  count: () => number;
  draw: () => Card.Card | null;
}

class DeckImple implements Deck {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
    // Clubs 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(Card.createCard(Card.CardMark.CLUBS, i));
    }
    // Diamonds 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(Card.createCard(Card.CardMark.DIAMONDS, i));
    }
    // Hearts 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(Card.createCard(Card.CardMark.HEARTS, i));
    }
    // Spades 1 to 13
    for (let i = 1; i < 14; i++) {
      this.cards.push(Card.createCard(Card.CardMark.SPADES, i));
    }
    // Jokers
    this.cards.push(Card.createCard(Card.CardMark.JOKER));
    this.cards.push(Card.createCard(Card.CardMark.JOKER));
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

  public count(): number {
    return this.cards.length;
  }

  public draw(): Card.Card | null {
    const c = this.cards.pop();
    return c ? c : null;
  }
}

export function createDeck(): Deck {
  return new DeckImple();
}
