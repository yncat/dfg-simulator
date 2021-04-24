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
    if (this.cards.length <= 1) {
      return false;
    }
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

// card selectable result
export const SelectableCheckResult = {
  SELECTABLE: 0,
  ALREADY_SELECTED: 1,
  NOT_SELECTABLE: 2,
} as const;
export type SelectableCheckResult = typeof SelectableCheckResult[keyof typeof SelectableCheckResult];

// card select result
export const SelectResult = {
  SUCCESS: 0,
  ALREADY_SELECTED: 1,
  NOT_SELECTABLE: 2,
} as const;
export type SelectResult = typeof SelectResult[keyof typeof SelectResult];

// card deselect result
export const DeselectResult = {
  SUCCESS: 0,
  ALREADY_DESELECTED: 1,
  NOT_DESELECTABLE: 2,
} as const;
export type DeselectResult = typeof DeselectResult[keyof typeof DeselectResult];

export class discardPlanner {
  private hand: Hand;
  private lastDiscardPair: DiscardPair;
  private strengthInverted: boolean;
  private selected: boolean[];

  constructor(
    hand: Hand,
    lastDiscardPair: DiscardPair,
    strengthInverted: boolean
  ) {
    this.hand = hand;
    this.lastDiscardPair = lastDiscardPair;
    this.strengthInverted = strengthInverted;
    this.selected = [];
    for (let i = 0; i < hand.count(); i++) {
      this.selected.push(false);
    }
  }

  public isSelectable(index: number): SelectableCheckResult {
    // out of range?
    if (index < 0 || index >= this.hand.count()) {
      return SelectableCheckResult.NOT_SELECTABLE;
    }

    // already selected?
    if (this.selected[index]) {
      return SelectableCheckResult.ALREADY_SELECTED;
    }

    const cnt = this.countSelectedCards();
    let ret: SelectableCheckResult = SelectableCheckResult.SELECTABLE;
    if (cnt == 0) {
      ret = this.checkSingle(index);
    } else {
      // todo: checkMultiple
    }

    return ret;
  }

  public countSelectedCards() {
    return this.selected.filter((val) => {
      return val;
    }).length;
  }

  public select(index: number): SelectResult {
    if (index < 0 || index >= this.hand.count()) {
      return SelectResult.NOT_SELECTABLE;
    }
    if (this.selected[index]) {
      return SelectResult.ALREADY_SELECTED;
    }

    this.selected[index] = true;
    return SelectResult.SUCCESS;
  }

  public deselect(index: number): DeselectResult {
    if (index < 0 || index >= this.hand.count()) {
      return DeselectResult.NOT_DESELECTABLE;
    }
    if (!this.selected[index]) {
      return DeselectResult.ALREADY_DESELECTED;
    }

    this.selected[index] = false;
    return DeselectResult.SUCCESS;
  }

  private checkSingle(index: number): SelectableCheckResult {
    const selectingCard = this.hand.cards[index];
    if (this.lastDiscardPair.isNull()) {
      return SelectableCheckResult.SELECTABLE;
    }

    // If selecting a joker and the last discard pair consists of one card only, it can be selected unless the last discard pair is also a joker.
    if (selectingCard.isJoker() && this.lastDiscardPair.count() == 1) {
      return this.lastDiscardPair.cards[0].isJoker()
        ? SelectableCheckResult.NOT_SELECTABLE
        : SelectableCheckResult.SELECTABLE;
    }

    // Single joker can be overriden by a 3 of spades
    if (
      this.lastDiscardPair.cards[0].isJoker() &&
      selectingCard.mark == Card.Mark.SPADES &&
      selectingCard.cardNumber == 3
    ) {
      return SelectableCheckResult.SELECTABLE;
    }

    // check strength
    const strongEnough = CalcFunctions.isStrongEnough(
      this.lastDiscardPair.calcStrength(),
      CalcFunctions.convertCardNumberIntoStrength(selectingCard.cardNumber),
      this.strengthInverted
    );
    if (!strongEnough) {
      return SelectableCheckResult.NOT_SELECTABLE;
    }

    // we have to disallow selecting this card when the last discard consists of more than 2 pairs and the possible conbinations are not present in the hand.
    // So we start complex checking.
    const jokers = this.hand.countJokers();
    const lastDiscardPairCardNumber = this.lastDiscardPair.calcCardNumber(
      this.strengthInverted
    );
    const lastDiscardPairCount = this.lastDiscardPair.count();
    // if we are selecting joker and we have enough jokers for wildcarding everything, that's OK.
    if (selectingCard.isJoker() && jokers >= lastDiscardPairCount) {
      return SelectableCheckResult.SELECTABLE;
    }

    if (this.lastDiscardPair.isKaidan()) {
      if (selectingCard.isJoker()) {
        // If selecting a joker, all kaidan combinations might be possible if it's stronger than the last discard pair
        const nums = CalcFunctions.enumerateStrongerCardNumbers(
          lastDiscardPairCardNumber,
          this.strengthInverted
        );
        let found = false;
        for (let i = 0; i < nums.length; i++) {
          if (this.countSequencialCardsFrom(nums[i]) >= lastDiscardPairCount) {
            found = true;
            break;
          } // if
        } // for
        if (!found) {
          return SelectableCheckResult.NOT_SELECTABLE;
        } // if
      } else {
        // we're selecting a numbered card. So we must have sequencial cards which include the selecting card.
        // search for starting point of the sequence
        let start = selectingCard.cardNumber;
        while (true) {
          const tmp = CalcFunctions.calcWeakerCardNumber(
            start,
            this.strengthInverted
          );
          if (tmp === null) {
            break;
          }
          if (this.hand.countCardsWithSpecifiedNumber(tmp) == 0) {
            break;
          }
          start = tmp;
        }
        // if we have jokers, we can make go further down
        // we still want to store the starting point without jokers, so calculate it using a different variable.
        let jokerStart = start;
        for (let i = 0; i < jokers; i++) {
          const tmp = CalcFunctions.calcWeakerCardNumber(
            jokerStart,
            this.strengthInverted
          );
          if (tmp === null) {
            break;
          }
          jokerStart = tmp;
        }
        // Clip the value to the last discard + 1 strength
        const clip = CalcFunctions.calcStrongerCardNumber(
          lastDiscardPairCardNumber,
          this.strengthInverted
        );
        if (clip === null) {
          throw Error("unexpected clip value.");
        }

        if (start <= lastDiscardPairCardNumber) {
          start = clip;
        }
        if (jokerStart <= lastDiscardPairCardNumber) {
          jokerStart = clip;
        }

        // Check for pairs between jokerStart and start
        let found = false;
        const nums = CalcFunctions.enumerateNumbersBetween(start, jokerStart);
        for (let i = 0; i < nums.length; i++) {
          if (this.countSequencialCardsFrom(nums[i]) >= lastDiscardPairCount) {
            found = true;
            break;
          }
        }

        return found
          ? SelectableCheckResult.SELECTABLE
          : SelectableCheckResult.NOT_SELECTABLE;
      }
    } else {
      // kaidan?
      if (selectingCard.isJoker()) {
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
          return SelectableCheckResult.NOT_SELECTABLE;
        }
      } else {
        // since we are selecting a numbered card, the subsequent cards must be the same number.
        const jokers = this.hand.countJokers();
        if (
          jokers +
            this.hand.countCardsWithSpecifiedNumber(selectingCard.cardNumber) <
          this.lastDiscardPair.count()
        ) {
          return SelectableCheckResult.NOT_SELECTABLE;
        } // if
      } // joker or number
    } // not a kaidan

    return SelectableCheckResult.SELECTABLE;
  }

  public countSequencialCardsFrom(cardNumber: number) {
    // if this hand has 3 4 5 and the cardNumber parameter is 3, it will return 3 since we have 3 sequencial cards (3,4,5).
    // when the strength is inverted, 7 6 5 and card parameter 7 will return 3.
    // This function considers jokers in the hand. When one of the required cards is not found, it tries to substitute a joker instead.
    let ret = 0;
    let str = CalcFunctions.convertCardNumberIntoStrength(cardNumber);
    let jokers = this.hand.countJokers();
    while (true) {
      if (str == 2 || str == 16) {
        break;
      }
      if (
        this.hand.countCardsWithSpecifiedNumber(
          CalcFunctions.convertStrengthIntoCardNumber(str)
        ) == 0
      ) {
        if (jokers == 0) {
          break;
        }
        jokers--; // substituted a joker
      }
      ret++;
      str = this.strengthInverted ? str - 1 : str + 1;
    }
    return ret;
  }

  public findKaidanStartingPoint(cardNumber: number) {
    // Find the starting point of kaidan which can include the given card number.
    // This function considers jokers. If one of the required card is missing, it tries to substitute a joker instead.
    let jokers = this.hand.countJokers();
    let start = cardNumber;
    let cn: number | null = start;
    while (true) {
      if (this.hand.countCardsWithSpecifiedNumber(cn) == 0) {
        if (jokers == 0) {
          break;
        }
        jokers--; // Joker substituted.
      }
      start = cn;
      cn = CalcFunctions.calcWeakerCardNumber(start, this.strengthInverted);
      if (cn === null) {
        break;
      }
    }
    return start;
  }
}
