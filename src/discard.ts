/*
Discard plan builder / checker
*/
import * as Card from "./card";
import { Hand } from "./hand";
import * as CalcFunctions from "./calcFunctions";
import { sortAndDeduplicateDiagnostics } from "typescript";

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
      ret = this.checkMultiple(index);
    }

    return ret;
  }

  public countSelectedCards() {
    return this.selected.filter((val) => {
      return val;
    }).length;
  }

  public createDiscardPair(): DiscardPair {
    return new DiscardPairImple(this.enumerateSelectedCards());
  }

  private countSelectedJokers() {
    return this.enumerateSelectedCards().filter((v) => {
      return v.isJoker();
    }).length;
  }

  private onlyJokersSelected() {
    const cards = this.enumerateSelectedCards();
    if (cards.length == 0) {
      return false;
    }
    const cards2 = cards.filter((v) => {
      return v.isJoker();
    });
    return cards.length == cards2.length;
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

  private enumerateSelectedCards() {
    return this.hand.cards.filter((v, i) => {
      return this.selected[i];
    });
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
        let s = this.findKaidanStartingPoint(selectingCard.cardNumber);
        // Clip the value to the last discard + 1 strength
        const clip = CalcFunctions.calcStrongerCardNumber(
          lastDiscardPairCardNumber,
          this.strengthInverted
        );
        if (clip === null) {
          throw Error("unexpected clip value.");
        }
        if (s <= lastDiscardPairCardNumber) {
          s = clip;
        }
        let found = false;
        if (this.countSequencialCardsFrom(s) >= lastDiscardPairCount) {
          found = true;
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

  private checkMultiple(index: number) {
    const lastDiscardCount = this.lastDiscardPair.count();
    const selectingCard = this.hand.cards[index];
    const selectedCount = this.countSelectedCards();
    // Number of cards must not exceed the last discard pair
    if (lastDiscardCount == selectedCount) {
      return SelectableCheckResult.NOT_SELECTABLE;
    }

    // Jokers can wildcard everything.
    if (selectingCard.isJoker()) {
      return SelectableCheckResult.SELECTABLE;
    }

    if (this.lastDiscardPair.isKaidan()) {
      if (this.onlyJokersSelected()) {
        // We have to search for possible caidan combinations in this case.
        let cn = this.lastDiscardPair.calcCardNumber(this.strengthInverted);
        let found = false;
        while (true) {
          const stronger = CalcFunctions.calcStrongerCardNumber(
            cn,
            this.strengthInverted
          );
          if (stronger === null) {
            break;
          }
          if (
            this.countSequencialCardsFrom(stronger) >= lastDiscardCount &&
            this.isConnectedByKaidan(stronger, selectingCard.cardNumber)
          ) {
            found = true;
            break;
          }
          cn = stronger;
        }
        return found
          ? SelectableCheckResult.SELECTABLE
          : SelectableCheckResult.NOT_SELECTABLE;
      } else {
        // we have at least 1 numbered card in the previous selection
        const wc = this.findWeakestSelectedCard();
        // OK if the selecting card is connected by kaidan with the previous selection.
        // no worries about jokers because isConnectedByKaidan automatically substitutes jokers.
        return this.isConnectedByKaidan(wc.cardNumber, selectingCard.cardNumber)
          ? SelectableCheckResult.SELECTABLE
          : SelectableCheckResult.NOT_SELECTABLE;
      }
    } else {
      // when the last discard pair is not a kaidan, the selecting card must be of the same number from the previously selected cards.
      // But previously selected cards might be jokers only.
      const jokers = this.hand.countJokers();
      if (this.onlyJokersSelected()) {
        const ok =
          CalcFunctions.isStrongEnough(
            this.lastDiscardPair.calcStrength(),
            CalcFunctions.convertCardNumberIntoStrength(
              selectingCard.cardNumber
            ),
            this.strengthInverted
          ) &&
          jokers +
            this.hand.countCardsWithSpecifiedNumber(selectingCard.cardNumber) >=
            this.lastDiscardPair.count();
        return ok
          ? SelectableCheckResult.SELECTABLE
          : SelectableCheckResult.NOT_SELECTABLE;
      }
      // numbered cards are previously selected, so simply check if the currently selecting one's card number matches.
      return this.isSameNumberFromPreviouslySelected(selectingCard.cardNumber)
        ? SelectableCheckResult.SELECTABLE
        : SelectableCheckResult.NOT_SELECTABLE;
    }
    return SelectableCheckResult.NOT_SELECTABLE;
  }

  private isSameNumberFromPreviouslySelected(cardNumber: number) {
    // This is a private method and should be called only when selecting cards consist of cards with same card number.
    const cards = this.enumerateSelectedCards().filter((v) => {
      return !v.isJoker();
    });
    if (cards.length == 0) {
      return false;
    }
    return cards[0].cardNumber == cardNumber;
  }

  private countSequencialCardsFrom(cardNumber: number) {
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

  private findKaidanStartingPoint(cardNumber: number) {
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

  private isConnectedByKaidan(
    startCardNumber: number,
    targetCardNumber: number
  ) {
    // starting from startCard number, calculates stronger card number one by one. If it reaches to targetCardNumber, returns true indicating that the target is connected from the start by kaidan.
    // If start and target aren't connected by kaidan, returns false.
    // This function considers jokers. If one of the required card is missing, it tries to substitute a joker instead.
    let jokers = this.hand.countJokers();
    let start = startCardNumber;
    let cn: number | null = start;
    let connected = false;
    while (true) {
      if (this.hand.countCardsWithSpecifiedNumber(cn) == 0) {
        if (jokers == 0) {
          break;
        }
        jokers--; // Joker substituted.
      }
      if (cn == targetCardNumber) {
        connected = true;
        break;
      }
      start = cn;
      cn = CalcFunctions.calcStrongerCardNumber(start, this.strengthInverted);
      if (cn === null) {
        break;
      }
    }
    return connected;
  }

  private findWeakestSelectedCard(): Card.Card {
    // Excluding jokers, returns the weakest card from the current selection.
    // throws an error when the selection is empty or jokers only because it's an unexpected usage.
    const cards = this.enumerateSelectedCards().filter((v) => {
      return !v.isJoker();
    });
    cards.sort((a, b) => {
      return a.cardNumber == b.cardNumber
        ? 0
        : CalcFunctions.isStrongEnough(
            CalcFunctions.convertCardNumberIntoStrength(a.cardNumber),
            CalcFunctions.convertCardNumberIntoStrength(b.cardNumber),
            this.strengthInverted
          )
        ? -1
        : 1;
    });
    if (cards.length == 0) {
      throw new Error(
        "tried to find the weakest selected card, but nothing could be found"
      );
    }
    return cards[0];
  }
}

type KaidanRange = {
  weakestCardNumber: number;
  strongestCardNumber: number;
};

export class DiscardPairEnumerator {
  private selectedCards: Card.Card[];
  private lastDiscardPair: DiscardPair;
  private strengthInverted: boolean;
  constructor(
    lastDiscardPair: DiscardPair,
    strengthInverted: boolean,
    ...selectedCards: Card.Card[]
  ) {
    this.lastDiscardPair = lastDiscardPair;
    this.strengthInverted = strengthInverted;
    this.selectedCards = selectedCards;
  }

  public enumerate(): DiscardPair[] {
    // Obviously blank if no cards are selected
    if (this.selectedCards.length == 0) {
      return [];
    }

    // If the selection doesn't include any jokers, simply return everything as a pair, assuming that the combination is valid (should be checked at DiscardPlanner).
    const jokers = this.countJokers();
    if (jokers == 0) {
      return [new DiscardPairImple(this.selectedCards)];
    }

    // When the selection only consists of jokers, they cannot be used as wildcards, so simply return as a bunch of jokers.
    if(jokers==this.selectedCards.length){
      return [new DiscardPairImple(this.selectedCards)];
    }

    return this.findJokerCombinations();
  }

  private findJokerCombinations() {
    // if there is at least one duplicate numbered card, jokers can only be used as that number.
    if (this.hasSameNumberedCards()) {
      const cds = this.filterJokers();
      // Just for symplicity, use the first element as joker's wildcard target.
      const wc = cds[0];
      for (let i = 0; i < this.countJokers(); i++) {
        cds.push(wc.copy());
      }
      return [new DiscardPairImple(cds)];
    }
    // There may be multiple solutions, so we need to check and enumerate each of them.
    const range = this.calcKaidanRange();
    const jokers = this.countJokers();
    // TODO

    return [];
  }

  private countJokers() {
    return this.selectedCards.filter((val) => {
      return val.isJoker();
    }).length;
  }

  private filterJokers() {
    return this.selectedCards.filter((v) => {
      return !v.isJoker();
    });
  }

  private hasSameNumberedCards() {
    const cds = this.selectedCards.filter((v) => {
      return !v.isJoker();
    });
    const n = cds[0].cardNumber;
    return (
      cds.filter((v) => {
        return v.cardNumber == n;
      }).length > 1
    );
  }

  private calcKaidanRange() {
    // get the weakest an strongest card number in a kaidan.
    // This function does not consider jokers.
    const cds = this.selectedCards.filter((v) => {
      return !v.isJoker();
    });
    cds.sort((a, b) => {
      return a.cardNumber == b.cardNumber
        ? 0
        : CalcFunctions.isStrongEnough(
            CalcFunctions.convertCardNumberIntoStrength(a.cardNumber),
            CalcFunctions.convertCardNumberIntoStrength(b.cardNumber),
            this.strengthInverted
          )
        ? -1
        : 1;
    });
    return {
      weakestCardNumber: cds[0].cardNumber,
      strongestCardNumber: cds[cds.length - 1].cardNumber,
    };
  }
}
