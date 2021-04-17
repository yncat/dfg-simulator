/*
Discard plan builder / checker
*/
import * as Card from "./card";
import { Hand } from "./hand";

// Use interface to prevent DiscardPair from being instantiated directly from outside
export interface DiscardPair {
  cards: Card.Card[];
}

class DiscardPairImple implements DiscardPair {
  cards: Card.Card[];
  constructor(cards: Card.Card[]) {
    this.cards = cards;
  }
}

export class discardPlanner {
  private hand: Hand;
  private checked: boolean[];
  constructor(hand: Hand) {
    this.hand = hand;
    this.checked = [];
    for (let i = 0; i < hand.count(); i++) {
      this.checked.push(false);
    }
  }
}
