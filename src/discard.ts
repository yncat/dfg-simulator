/*
Discard plan builder / checker
*/
import * as Card from "./card";
import { Hand } from "./hand";
import * as CalcFunctions from "./calcFunctions";

// Use interface to prevent DiscardPair from being instantiated directly from outside
export interface DiscardPair {
  cards: Card.Card[];
  calcStrength: () => number;
  isNull: () => boolean;
}

class DiscardPairImple implements DiscardPair {
  cards: Card.Card[];
  constructor(cards: Card.Card[]) {
    this.cards = cards;
  }

  public calcStrength(): number {
    // If this pair is a kaidan, we must return the weakest one
    const strs: number[] = this.cards.map((cd: Card.Card) => {
      return CalcFunctions.convertCardNumberIntoStrength(cd.cardNumber);
    });
    // sort: ascending
    strs.sort((a: number, b: number) => {
      return a - b;
    });
    return strs[0];
  }

  public isNull(): boolean {
    return this.cards.length == 0;
  }
}

// DO NOT USE EXCEPT TESTING PURPOSES.
export function CreateDiscardPairForTest(...cards: Card.Card[]): DiscardPair {
  return new DiscardPairImple(cards);
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

    const cnt = this.countCheckedCards();
    let ret: CheckResult = CheckResult.SUCCESS;
    if (cnt == 0) {
      ret = this.checkSingle(index);
    } else {
      // todo: checkMultiple
    }

    if (ret != CheckResult.SUCCESS) {
      return ret;
    }

    this.checked[index] = true;
    return CheckResult.SUCCESS;
  }

  public countCheckedCards() {
    return this.checked.filter((val) => {
      return val;
    }).length;
  }

  private checkSingle(index: number): CheckResult {
    if (this.lastDiscardPair.isNull()) {
      return CheckResult.SUCCESS;
    }

    const strongEnough = CalcFunctions.isStrongEnough(
      this.lastDiscardPair.calcStrength(),
      this.hand.cards[index].cardNumber,
      this.strengthInverted
    );
    return strongEnough ? CheckResult.SUCCESS : CheckResult.NOT_CHECKABLE;
  }
}
