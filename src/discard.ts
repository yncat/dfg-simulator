/*
Discard plan builder / checker
*/
import * as Card from "./card";
import { Hand } from "./hand";
import * as CalcFunctions from "./calcFunctions";

// Use interface to prevent DiscardPair from being instantiated directly from outside
export interface DiscardPair {
  cards: Card.Card[];
  count: () => number;
  calcCardNumber: (strengthInverted: boolean) => number;
  calcStrength: () => number;
  isNull: () => boolean;
  isKaidan: () => boolean;
}

class DiscardPairImple implements DiscardPair {
  cards: Card.Card[];
  constructor(cards: Card.Card[]) {
    this.cards = cards;
  }

  public count(): number {
    return this.cards.length;
  }

  public calcCardNumber(strengthInverted: boolean): number {
    const cs = Array.from(this.cards);
    cs.sort((a, b) => {
      if (a.cardNumber == b.cardNumber) {
        return 0;
      }
      const stronger = CalcFunctions.findStrongerCardNumber(
        a.cardNumber,
        b.cardNumber,
        strengthInverted
      );
      return stronger == a.cardNumber ? 1 : -1;
    });
    return cs[0].cardNumber;
  }

  public calcStrength(): number {
    return this.strengthsFromWeakest()[0];
  }

  public isNull(): boolean {
    return this.cards.length == 0;
  }

  public isKaidan(): boolean {
    const strs = this.strengthsFromWeakest();
    let ok = true;
    for (let i = 0; i < strs.length - 1; i++) {
      if (strs[i + 1] != strs[i] + 1) {
        ok = false;
        break;
      }
    }

    return ok;
  }

  private strengthsFromWeakest() {
    const strs: number[] = this.cards.map((cd: Card.Card) => {
      return CalcFunctions.convertCardNumberIntoStrength(cd.cardNumber);
    });
    // sort: ascending
    strs.sort((a: number, b: number) => {
      return a - b;
    });
    return strs;
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
    const checkingCard = this.hand.cards[index];
    if (this.lastDiscardPair.isNull()) {
      return CheckResult.SUCCESS;
    }

    // If selecting a joker and the last discard pair consists of one card only, it can be checked unless the last discard pair is also a joker.
    if (checkingCard.isJoker() && this.lastDiscardPair.count() == 1) {
      return this.lastDiscardPair.cards[0].isJoker()
        ? CheckResult.NOT_CHECKABLE
        : CheckResult.SUCCESS;
    }

    // Single joker can be overriden by a 3 of spades
    if (
      this.lastDiscardPair.cards[0].isJoker() &&
      checkingCard.mark == Card.Mark.SPADES &&
      checkingCard.cardNumber == 3
    ) {
      return CheckResult.SUCCESS;
    }

    // check strength
    const strongEnough = CalcFunctions.isStrongEnough(
      this.lastDiscardPair.calcStrength(),
      CalcFunctions.convertCardNumberIntoStrength(checkingCard.cardNumber),
      this.strengthInverted
    );
    if (!CalcFunctions.isStrongEnough) {
      return CheckResult.NOT_CHECKABLE;
    }

    // Cannot be checked when the last discard consists of more than 2 pairs and the possible conbinations are not present in the hand.
    if (this.lastDiscardPair.isKaidan()) {
      // when in kaidan, all cards required for kaidan completion must be in the hand.
      // TODO
      return CheckResult.NOT_CHECKABLE;
    } else {
      if (checkingCard.isJoker()) {
        // count jokers, but we are trying to check one of them, so exclude that one
        const jokers = this.hand.countJokers() - 1;
        // When using joker, other cards can be any card if it's stronger than the last discard
        const cn = this.lastDiscardPair.calcCardNumber(this.strengthInverted);
        const nums = CalcFunctions.enumerateStrongerCardNumbers(
          cn,
          this.strengthInverted
        );
        let found = false;
        for (let i = 0; i < nums.length; i++) {
          if (
            this.hand.countCardsWithSpecifiedNumber(nums[i]) + jokers >=
            this.lastDiscardPair.count()
          ) {
            found = true;
            break;
          } // if
        } // for
        if (!found) {
          return CheckResult.NOT_CHECKABLE;
        }
      } else {
        // since we are selecting a numbered card, the subsequent cards must be the same number.
        const jokers = this.hand.countJokers();
        if (
          jokers +
            this.hand.countCardsWithSpecifiedNumber(checkingCard.cardNumber) <
          this.lastDiscardPair.count()
        ) {
          return CheckResult.NOT_CHECKABLE;
        } // if
      } // joker or number
    } // not a kaidan

    return CheckResult.SUCCESS;
  }
}
