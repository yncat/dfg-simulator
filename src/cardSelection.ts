/*
type / object definitions of card selection related stuff.
*/
import * as Card from "./card";
import * as Calculation from "./calculation";

export interface CardSelectionPair {
  cards: Card.Card[];
  count: () => number;
  countWithCondition: (
    mark: Card.CardMark | null,
    cardNumber: number | null
  ) => number;
  calcCardNumber: (strengthInverted: boolean) => number;
  calcStrength: () => number;
  isNull: () => boolean;
  isSequencial: () => boolean;
  isKaidan: () => boolean;
  isSameCard: (discardPair: CardSelectionPair) => boolean;
  isOnlyJoker: () => boolean;
  isValid: () => boolean;
}

export class CardSelectionPairImple implements CardSelectionPair {
  cards: Card.Card[];
  constructor(cards: Card.Card[]) {
    this.cards = cards;
  }

  public count(): number {
    return this.cards.length;
  }

  public countWithCondition(
    mark: Card.CardMark | null,
    cardNumber: number | null
  ): number {
    return this.cards.filter((v) => {
      if (mark !== null && v.mark !== mark) {
        return false;
      }
      if (cardNumber !== null && v.cardNumber !== cardNumber) {
        return false;
      }
      return true;
    }).length;
  }

  public calcCardNumber(strengthInverted: boolean): number {
    const cs = Array.from(this.cards);
    cs.sort((a, b) => {
      if (a.cardNumber == b.cardNumber) {
        return 0;
      }
      const stronger = Calculation.findStrongerCardNumber(
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

  public isSequencial(): boolean {
    // This is not the "kaidan" in a daifugo rule. This function just checks card numbers sequenciality. This function does not consider jokers.
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

  public isKaidan(): boolean {
    if (this.count() < 3) {
      return false;
    }
    let jokerCount = this.countWithCondition(Card.CardMark.JOKER, null);
    const withoutJokers = this.cards
      .filter((c) => {
        return !c.isJoker();
      })
      .sort((a, b) => {
        // Ascending
        return a.calcStrength() - b.calcStrength();
      });
    let ok = true;
    for (let i = 1; i < withoutJokers.length; i++) {
      if (
        withoutJokers[i].calcStrength() !==
          withoutJokers[i - 1].calcStrength() + 1 ||
        !withoutJokers[i].isSameMark(withoutJokers[i - 1])
      ) {
        if (jokerCount === 0) {
          ok = false;
          break;
        }
        jokerCount--;
      }
    }
    return ok;
  }

  public isSameCard(discardPair: CardSelectionPair): boolean {
    if (this.count() != discardPair.count()) {
      return false;
    }
    let ok = true;
    for (let i = 0; i < this.count(); i++) {
      if (!this.cards[i].isSameCard(discardPair.cards[i])) {
        ok = false;
        break;
      }
    }
    return ok;
  }

  public isOnlyJoker(): boolean {
    return (
      this.cards.filter((val) => {
        return !val.isJoker();
      }).length == 0
    );
  }

  public isValid(): boolean {
    // "invalid" means that the combination is never allowed in Daifugo rules.
    switch (this.count()) {
      case 0:
        return false;
      case 1:
        return true;
      case 2:
        return this.consistsOfSameCardNumber();
      case 3:
      case 4:
        return this.consistsOfSameCardNumber() || this.isKaidan();
      default:
        return false;
    }
  }

  private consistsOfSameCardNumber(): boolean {
    // Returns true when the combination can be considered as "same card numbers pair".
    // This function considers jokers.
    if (this.isOnlyJoker()) {
      return true;
    }
    const jokerCount = this.countWithCondition(Card.CardMark.JOKER, null);
    // Find first non-joker card
    let firstNumberedCard = this.cards[0];
    for (let i = 0; i < this.cards.length; i++) {
      if (!this.cards[i].isJoker()) {
        firstNumberedCard = this.cards[i];
        break;
      }
    }
    const num = firstNumberedCard.cardNumber;
    let sameNumberCount = 0;
    this.cards.forEach((v) => {
      if (v.cardNumber === num) {
        sameNumberCount++;
      }
    });
    return this.count() === sameNumberCount + jokerCount;
  }

  private strengthsFromWeakest() {
    const strs: number[] = this.cards.map((cd: Card.Card) => {
      return Calculation.convertCardNumberIntoStrength(cd.cardNumber);
    });
    // sort: ascending
    strs.sort((a: number, b: number) => {
      return a - b;
    });
    return strs;
  }
}

export function createNullCardSelectionPair(): CardSelectionPair {
  return new CardSelectionPairImple([]);
}

// DO NOT USE EXCEPT TESTING PURPOSES.
export function CreateCardSelectionPairForTest(
  ...cards: Card.Card[]
): CardSelectionPair {
  return new CardSelectionPairImple(cards);
}

// card selectable result
export const SelectabilityCheckResult = {
  SELECTABLE: 0,
  ALREADY_SELECTED: 1,
  NOT_SELECTABLE: 2,
} as const;
export type SelectabilityCheckResult = typeof SelectabilityCheckResult[keyof typeof SelectabilityCheckResult];

// card select result
export const CardSelectResult = {
  SUCCESS: 0,
  ALREADY_SELECTED: 1,
  NOT_SELECTABLE: 2,
} as const;
export type CardSelectResult = typeof CardSelectResult[keyof typeof CardSelectResult];

// card deselect result
export const CardDeselectResult = {
  SUCCESS: 0,
  ALREADY_DESELECTED: 1,
  NOT_DESELECTABLE: 2,
} as const;
export type CardDeselectResult = typeof CardDeselectResult[keyof typeof CardDeselectResult];
