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

// card check result
export const CheckResult = {
  SUCCESS: 0,
  ALREADY_CHECKED: 1,
  NOT_CHECKABLE: 2,
} as const;
export type CheckResult = typeof CheckResult[keyof typeof CheckResult];

// card uncheck result
export const UncheckResult = {
  SUCCESS: 0,
  ALREADY_UNCHECKED: 1,
} as const;
export type UncheckResult = typeof UncheckResult[keyof typeof UncheckResult];

export class discardPlanner {
  private hand: Hand;
  private lastDiscardPair: DiscardPair;
  private strengthInverted: boolean;
  private checked: boolean[];

  constructor(
    hand: Hand,
    lastDiscardPair: DiscardPair,
    strengthInverted: boolean
  ) {
    this.hand = hand;
    this.lastDiscardPair = lastDiscardPair;
    this.strengthInverted = strengthInverted;
    this.checked = [];
    for (let i = 0; i < hand.count(); i++) {
      this.checked.push(false);
    }
  }

  public checkIfPossible(index: number): CheckResult {
    // out of range?
    if (index < 0 || index >= this.hand.count()) {
      return CheckResult.NOT_CHECKABLE;
    }

    // already checked?
    if (this.checked[index]) {
      return CheckResult.ALREADY_CHECKED;
    }

    this.checked[index] = true;
    return CheckResult.SUCCESS;
  }
}
