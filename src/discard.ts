/*
Discard plan builder / checker
*/
import * as Card from "./card";
import { Hand } from "./hand";
import * as Calculation from "./calculation";

export interface DiscardPair {
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
  isSameCard: (discardPair: DiscardPair) => boolean;
  isOnlyJoker: () => boolean;
  isValid: () => boolean;
}

class DiscardPairImple implements DiscardPair {
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

  public isSameCard(discardPair: DiscardPair): boolean {
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

export function createNullDiscardPair(): DiscardPair {
  return new DiscardPairImple([]);
}

// DO NOT USE EXCEPT TESTING PURPOSES.
export function CreateDiscardPairForTest(...cards: Card.Card[]): DiscardPair {
  return new DiscardPairImple(cards);
}

// It should be discardPile, but DiscardPile is close to DiscardPair in string distance...
export interface DiscardStack {
  readonly discardPairs: DiscardPair[];
  push: (discardPair: DiscardPair) => void;
  last: () => DiscardPair;
  secondToLast: () => DiscardPair;
  clear: () => void;
}

export class DiscardStackImple implements DiscardStack {
  readonly discardPairs: DiscardPair[];
  constructor() {
    this.discardPairs = [];
    this.clear();
  }
  public push(discardPair: DiscardPair): void {
    this.discardPairs.push(discardPair);
  }
  public last(): DiscardPair {
    return this.discardPairs.length === 0
      ? createNullDiscardPair()
      : this.discardPairs[this.discardPairs.length - 1];
  }
  public secondToLast(): DiscardPair {
    return this.discardPairs.length >= 2
      ? this.discardPairs[this.discardPairs.length - 2]
      : createNullDiscardPair();
  }
  public clear(): void {
    this.discardPairs.splice(0);
  }
}

export function createDiscardStack(): DiscardStack {
  return new DiscardStackImple();
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

type SearchDirection = "stronger" | "weaker";

export class DiscardPlanner {
  private hand: Hand;
  private discardStack: DiscardStack;
  private strengthInverted: boolean;
  private selected: boolean[];

  constructor(
    hand: Hand,
    discardStack: DiscardStack,
    strengthInverted: boolean
  ) {
    this.hand = hand;
    this.discardStack = discardStack;
    this.strengthInverted = strengthInverted;
    this.selected = [];
    for (let i = 0; i < hand.count(); i++) {
      this.selected.push(false);
    }
  }

  public isSelected(index: number): boolean {
    if (index < 0 || index >= this.selected.length) {
      return false;
    }
    return this.selected[index];
  }

  public checkSelectability(index: number): SelectabilityCheckResult {
    // out of range?
    if (index < 0 || index >= this.hand.count()) {
      return SelectabilityCheckResult.NOT_SELECTABLE;
    }

    // already selected?
    if (this.selected[index]) {
      return SelectabilityCheckResult.ALREADY_SELECTED;
    }

    // A few common special cases
    // After negating a joker with 3 of spades, no cards can be played further.
    if (this.isSpecial3OfSpades()) {
      return SelectabilityCheckResult.NOT_SELECTABLE;
    }

    const cnt = this.countSelectedCards();
    let ret: SelectabilityCheckResult = SelectabilityCheckResult.SELECTABLE;
    if (cnt == 0) {
      ret = this.checkSingle(index);
    } else {
      ret = this.checkMultiple(index);
    }

    return ret;
  }

  public countSelectedCards(): number {
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

  public select(index: number): CardSelectResult {
    if (index < 0 || index >= this.hand.count()) {
      return CardSelectResult.NOT_SELECTABLE;
    }
    if (this.selected[index]) {
      return CardSelectResult.ALREADY_SELECTED;
    }

    this.selected[index] = true;
    return CardSelectResult.SUCCESS;
  }

  public deselect(index: number): CardDeselectResult {
    if (index < 0 || index >= this.hand.count()) {
      return CardDeselectResult.NOT_DESELECTABLE;
    }
    if (!this.selected[index]) {
      return CardDeselectResult.ALREADY_DESELECTED;
    }

    this.selected[index] = false;
    return CardDeselectResult.SUCCESS;
  }

  public enumerateSelectedCards(): Card.Card[] {
    return this.hand.cards.filter((v, i) => {
      return this.selected[i];
    });
  }

  private isSpecial3OfSpades() {
    // Returns if the last discard is a 3 of spades which was used to negate a joker.
    const ldp = this.discardStack.last();
    const sldp = this.discardStack.secondToLast();
    return (
      ldp.count() == 1 &&
      ldp.cards[0].isSameCard(Card.createCard(Card.CardMark.SPADES, 3)) &&
      sldp.count() == 1 &&
      sldp.cards[0].isJoker()
    );
  }

  private checkSingle(index: number): SelectabilityCheckResult {
    const selectingCard = this.hand.cards[index];
    const ldp = this.discardStack.last();
    if (ldp.isNull()) {
      return SelectabilityCheckResult.SELECTABLE;
    }

    // If selecting a joker and the last discard pair consists of one card only, it can be selected unless the last discard pair is also a joker.
    if (selectingCard.isJoker() && ldp.count() == 1) {
      return ldp.cards[0].isJoker()
        ? SelectabilityCheckResult.NOT_SELECTABLE
        : SelectabilityCheckResult.SELECTABLE;
    }

    // Single joker can be overriden by a 3 of spades
    if (
      this.discardStack.last().cards[0].isJoker() &&
      selectingCard.mark == Card.CardMark.SPADES &&
      selectingCard.cardNumber == 3
    ) {
      return SelectabilityCheckResult.SELECTABLE;
    }

    // check strength
    const strongEnough = Calculation.isStrongEnough(
      ldp.calcStrength(),
      Calculation.convertCardNumberIntoStrength(selectingCard.cardNumber),
      this.strengthInverted
    );
    if (!strongEnough) {
      return SelectabilityCheckResult.NOT_SELECTABLE;
    }

    // we have to disallow selecting this card when the last discard consists of more than 2 pairs and the possible conbinations are not present in the hand.
    // So we start complex checking.
    const jokers = this.hand.countJokers();
    const lastDiscardPairCardNumber = ldp.calcCardNumber(this.strengthInverted);
    const lastDiscardPairCount = ldp.count();
    // if we are selecting joker and we have enough jokers for wildcarding everything, that's OK.
    if (selectingCard.isJoker() && jokers >= lastDiscardPairCount) {
      return SelectabilityCheckResult.SELECTABLE;
    }

    if (ldp.isSequencial()) {
      if (selectingCard.isJoker()) {
        // If selecting a joker, all kaidan combinations might be possible if it's stronger than the last discard pair
        const nums = Calculation.enumerateStrongerCardNumbers(
          lastDiscardPairCardNumber,
          this.strengthInverted
        );
        let found = false;
        for (let i = 0; i < nums.length; i++) {
          if (
            this.isKaidanPossibleFromSpecifiedCardNumber(
              nums[i],
              lastDiscardPairCount
            )
          ) {
            found = true;
            break;
          } // if
        } // for
        if (!found) {
          return SelectabilityCheckResult.NOT_SELECTABLE;
        } // if
      } else {
        // we're selecting a numbered card. So we must have sequencial cards which include the selecting card.
        // search for starting point of the sequence
        let s = this.findKaidanStartingPoint(selectingCard);
        // Clip the value to the last discard + 1 strength
        const clip = Calculation.calcStrongerCardNumber(
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
        if (
          this.countSequencialCardsFrom(selectingCard.mark, s, "stronger") >=
          lastDiscardPairCount
        ) {
          found = true;
        }

        return found
          ? SelectabilityCheckResult.SELECTABLE
          : SelectabilityCheckResult.NOT_SELECTABLE;
      }
    } else {
      // The last discard pair is not a kaidan.
      if (selectingCard.isJoker()) {
        // When using joker, other cards can be any card if it's stronger than the last discard
        const cn = ldp.calcCardNumber(this.strengthInverted);
        const nums = Calculation.enumerateStrongerCardNumbers(
          cn,
          this.strengthInverted
        );
        let found = false;
        for (let i = 0; i < nums.length; i++) {
          if (
            this.hand.countCardsWithSpecifiedNumber(nums[i]) + jokers >=
            ldp.count()
          ) {
            found = true;
            break;
          } // if
        } // for
        if (!found) {
          return SelectabilityCheckResult.NOT_SELECTABLE;
        }
      } else {
        // since we are selecting a numbered card, the subsequent cards must be the same number.
        const jokers = this.hand.countJokers();
        if (
          jokers +
            this.hand.countCardsWithSpecifiedNumber(selectingCard.cardNumber) <
          ldp.count()
        ) {
          return SelectabilityCheckResult.NOT_SELECTABLE;
        } // if
      } // joker or number
    } // not a kaidan

    return SelectabilityCheckResult.SELECTABLE;
  }

  private isKaidanPossibleFromSpecifiedCardNumber(
    cardNumber: number,
    lastDiscardPairCount: number
  ) {
    // checks if kaidan of [lastDiscardPairCount] cards is possible from the specified card number.
    // This function checks for all marks.
    const marks = [
      Card.CardMark.CLUBS,
      Card.CardMark.DIAMONDS,
      Card.CardMark.HEARTS,
      Card.CardMark.SPADES,
    ];
    for (let i = 0; i < marks.length; i++) {
      if (
        this.countSequencialCardsFrom(marks[i], cardNumber, "stronger") >=
        lastDiscardPairCount
      ) {
        return true;
      }
    }
    return false;
  }

  private checkMultiple(index: number) {
    const lastDiscardCount = this.discardStack.last().count();
    const selectingCard = this.hand.cards[index];
    const selectedCount = this.countSelectedCards();
    // Number of cards must not exceed the last discard pair
    if (lastDiscardCount == selectedCount) {
      return SelectabilityCheckResult.NOT_SELECTABLE;
    }

    // Jokers can wildcard everything.
    if (selectingCard.isJoker()) {
      return SelectabilityCheckResult.SELECTABLE;
    }

    const ldp = this.discardStack.last();
    if (
      ldp.isNull() &&
      this.consistsOfSameNumberedCards() &&
      this.isSameNumberFromPreviouslySelected(selectingCard.cardNumber)
    ) {
      return SelectabilityCheckResult.SELECTABLE;
    }
    if (ldp.isSequencial() || ldp.isNull()) {
      if (this.onlyJokersSelected()) {
        // We have to search for possible caidan combinations in this case.
        let cn = Calculation.calcWeakestCardNumber(this.strengthInverted);
        let found = false;
        while (true) {
          const stronger = Calculation.calcStrongerCardNumber(
            cn,
            this.strengthInverted
          );
          if (stronger === null) {
            break;
          }
          const kaidanPossible =
            [
              Card.CardMark.DIAMONDS,
              Card.CardMark.CLUBS,
              Card.CardMark.HEARTS,
              Card.CardMark.SPADES,
            ].filter((v) => {
              return this.isConnectedByKaidan(
                Card.createCard(v, stronger),
                selectingCard
              );
            }).length > 0;
          if (
            kaidanPossible &&
            this.countSequencialCardsFrom(
              selectingCard.mark,
              stronger,
              "stronger"
            ) >= lastDiscardCount
          ) {
            found = true;
            break;
          }
          cn = stronger;
        }
        return found
          ? SelectabilityCheckResult.SELECTABLE
          : SelectabilityCheckResult.NOT_SELECTABLE;
      } else {
        // we have at least 1 numbered card in the previous selection
        const wc = this.findWeakestSelectedCard();
        const dir: SearchDirection =
          Calculation.findStrongerCardNumber(
            wc.cardNumber,
            selectingCard.cardNumber,
            this.strengthInverted
          ) === selectingCard.cardNumber
            ? "stronger"
            : "weaker";
        // OK if the selecting card is connected by kaidan with the previous selection.
        // Needs to be the same colour from the already selected cards.
        // no worries about jokers because isConnectedByKaidan automatically substitutes jokers.
        // More than 3 sequencial cards must be present for a valid kaidan.
        // Longer kaidan should be rejected. E.G. When the last discard pair is 6 7 8 and 7 is selected, 10 should be rejected because 7 8 9 10 == distance of 4, which cannot be played.
        let distanceOK = true;
        if (
          !ldp.isNull() &&
          Math.abs(
            Calculation.convertCardNumberIntoStrength(wc.cardNumber) -
              Calculation.convertCardNumberIntoStrength(
                selectingCard.cardNumber
              )
          ) >= ldp.count()
        ) {
          distanceOK = false;
        }
        return this.isConnectedByKaidan(wc, selectingCard) &&
          this.countSequencialCardsFrom(wc.mark, wc.cardNumber, dir) >= 3 &&
          distanceOK
          ? SelectabilityCheckResult.SELECTABLE
          : SelectabilityCheckResult.NOT_SELECTABLE;
      }
    } else {
      // when the last discard pair is not a kaidan, the selecting card must be of the same number from the previously selected cards.
      // But previously selected cards might be jokers only.
      const jokers = this.hand.countJokers();
      if (this.onlyJokersSelected()) {
        const ok =
          Calculation.isStrongEnough(
            ldp.calcStrength(),
            Calculation.convertCardNumberIntoStrength(selectingCard.cardNumber),
            this.strengthInverted
          ) &&
          jokers +
            this.hand.countCardsWithSpecifiedNumber(selectingCard.cardNumber) >=
            ldp.count();
        return ok
          ? SelectabilityCheckResult.SELECTABLE
          : SelectabilityCheckResult.NOT_SELECTABLE;
      }
      // numbered cards are previously selected, so simply check if the currently selecting one's card number matches.
      return this.isSameNumberFromPreviouslySelected(selectingCard.cardNumber)
        ? SelectabilityCheckResult.SELECTABLE
        : SelectabilityCheckResult.NOT_SELECTABLE;
    }
    return SelectabilityCheckResult.NOT_SELECTABLE;
  }

  private consistsOfSameNumberedCards() {
    // Returns true when the current selection consists of same numbered cards.
    // This method considers jokers.
    if (this.onlyJokersSelected()) {
      return true;
    }
    const withoutJokers = this.enumerateSelectedCards().filter((v) => {
      return !v.isJoker();
    });

    const num = withoutJokers[0].cardNumber;
    let sameNumberCount = 0;
    withoutJokers.forEach((v) => {
      if (v.cardNumber === num) {
        sameNumberCount++;
      }
    });
    return (
      this.countSelectedCards() === sameNumberCount + this.countSelectedJokers()
    );
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

  private countSequencialCardsFrom(
    cardMark: Card.CardMark,
    cardNumber: number,
    searchDirection: SearchDirection
  ) {
    // if this hand has 3 4 5 and the cardNumber parameter is 3, it will return 3 since we have 3 sequencial cards (3,4,5).
    // when the strength is inverted, 7 6 5 and card parameter 7 will return 3.
    // This function is used for checking kaidan combinations, so returns false when card marks are different.
    // This function considers jokers in the hand. When one of the required cards is not found, it tries to substitute a joker instead.
    // SearchDirection determines direction to search. When set to stronger, it searches for 5 6 7. When set to weaker, searches 5 4 3.
    let ret = 0;
    let cn = cardNumber;
    let jokers = this.hand.countJokers();
    while (true) {
      if (this.hand.countCardsWithSpecifiedMarkAndNumber(cardMark, cn) == 0) {
        if (jokers == 0) {
          break;
        }
        jokers--; // substituted a joker
      }
      ret++;
      let cntemp: number | null;
      if (searchDirection === "stronger") {
        cntemp = Calculation.calcStrongerCardNumber(cn, this.strengthInverted);
      } else {
        cntemp = Calculation.calcWeakerCardNumber(cn, this.strengthInverted);
      }
      if (cntemp === null) {
        break;
      }
      cn = cntemp;
    }
    return ret;
  }

  private findKaidanStartingPoint(card: Card.Card) {
    // Find the starting point of kaidan which can include the given card.
    // This function considers jokers. If one of the required card is missing, it tries to substitute a joker instead.
    let jokers = this.hand.countJokers();
    let start = card.cardNumber;
    let cn: number | null = start;
    while (true) {
      if (this.hand.countCardsWithSpecifiedMarkAndNumber(card.mark, cn) == 0) {
        if (jokers == 0) {
          break;
        }
        jokers--; // Joker substituted.
      }
      start = cn;
      cn = Calculation.calcWeakerCardNumber(start, this.strengthInverted);
      if (cn === null) {
        break;
      }
    }
    return start;
  }

  private isConnectedByKaidan(startCard: Card.Card, targetCard: Card.Card) {
    // starting from startCard, calculates stronger or weaker card number one by one. If it reaches to targetCardNumber, returns true indicating that the target is connected from the start by kaidan.
    // If the scanned card's mark is different from startCard.mark, cancels searching and returns false.
    // If start and target aren't connected by kaidan, returns false.
    // This function considers jokers. If one of the required card is missing, it tries to substitute a joker instead.
    // Start and target must be same mark. We're trying to select the target card.
    if (!startCard.isSameMark(targetCard)) {
      return false;
    }
    const targetIsStronger =
      Calculation.findStrongerCardNumber(
        targetCard.cardNumber,
        startCard.cardNumber,
        this.strengthInverted
      ) === targetCard.cardNumber;
    let jokers = this.hand.countJokers();
    let start = startCard.cardNumber;
    let cn: number | null = start;
    let connected = false;
    while (true) {
      if (
        this.hand.countCardsWithSpecifiedMarkAndNumber(startCard.mark, cn) == 0
      ) {
        if (jokers == 0) {
          break;
        }
        jokers--; // Joker substituted.
      }
      if (cn == targetCard.cardNumber) {
        connected = true;
        break;
      }
      start = cn;
      if (targetIsStronger) {
        cn = Calculation.calcStrongerCardNumber(start, this.strengthInverted);
      } else {
        cn = Calculation.calcWeakerCardNumber(start, this.strengthInverted);
      }
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
        : Calculation.isStrongEnough(
            Calculation.convertCardNumberIntoStrength(a.cardNumber),
            Calculation.convertCardNumberIntoStrength(b.cardNumber),
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

export class DiscardPairEnumerator {
  private selectedCards: Card.Card[];
  private readonly discardStack: DiscardStack;
  private readonly strengthInverted: boolean;
  constructor(discardStack: DiscardStack, strengthInverted: boolean) {
    this.discardStack = discardStack;
    this.strengthInverted = strengthInverted;
    this.selectedCards = [];
  }

  public enumerate(...selectedCards: Card.Card[]): DiscardPair[] {
    this.selectedCards = selectedCards;
    // Obviously blank if no cards are selected
    if (this.selectedCards.length == 0) {
      return [];
    }

    // If the selection doesn't include any jokers, simply return everything as a pair, assuming that the combination is valid (should be checked at DiscardPlanner).
    const jokers = this.countJokers();
    if (jokers == 0) {
      return this.prune(
        [new DiscardPairImple(this.selectedCards)],
        this.discardStack
      );
    }

    // When the selection only consists of jokers, they cannot be used as wildcards, so simply return as a bunch of jokers.
    if (jokers == this.selectedCards.length) {
      return this.prune(
        [new DiscardPairImple(this.selectedCards)],
        this.discardStack
      );
    }

    return this.prune(this.findJokerCombinations(), this.discardStack);
  }

  private findJokerCombinations() {
    // if there is at least one duplicate numbered card, jokers can only be used as that number.
    if (this.hasSameNumberedCards()) {
      const cds = this.filterJokers();
      // Just for symplicity, use the first element as joker's wildcard target.
      const wc = cds[0];
      for (let i = 0; i < this.countJokers(); i++) {
        cds.push(wc.copy().flagAsWildcard());
      }
      return [new DiscardPairImple(cds)];
    }
    // There may be multiple solutions, so we need to check and enumerate each of them.
    const range = this.calcKaidanRange();
    let jokers = this.countJokers();
    // First, we use jokers to fill the missing parts of the kaidan, if any.
    if (range.weakestCardNumber != range.strongestCardNumber) {
      jokers = this.fillMissingKaidanCards(
        jokers,
        range.weakestCardNumber,
        range.strongestCardNumber
      );
      if (jokers == 0) {
        // all jokers have been used
        // fillMissingKaidanCards already changed this.selectedCards and replaced jokers to wildcards.
        return [new DiscardPairImple(this.selectedCards)];
      }
    }
    // Since the combination is a kaidan, jokers cannot be used as wildcards of same number.
    // First, we place all jokers to the weaker direction.
    // If there's no place left, use stronger direction instead.
    let weakerOffset = range.weakestCardNumber;
    let strongerOffset = range.strongestCardNumber;
    const weakerLst: number[] = [];
    const strongerLst: number[] = [];
    for (let i = 0; i < jokers; i++) {
      const w = Calculation.calcWeakerCardNumber(
        weakerOffset,
        this.strengthInverted
      );
      if (w === null) {
        const s = Calculation.calcStrongerCardNumber(
          strongerOffset,
          this.strengthInverted
        );
        if (s === null) {
          throw new Error(
            "unexpected overflow at findJokerCombinations. maybe too many jokers?"
          );
        }
        strongerLst.push(s);
        strongerOffset = s;
        break;
      }
      weakerLst.push(w);
      weakerOffset = w;
    }
    weakerLst.reverse(); // weakest element should be first
    const ofs = Calculation.calcStrongerCardNumber(
      strongerOffset,
      this.strengthInverted
    );
    strongerOffset = ofs === null ? strongerOffset : ofs;
    let com = new WildcardCombination(
      weakerLst,
      strongerLst,
      this.strengthInverted,
      strongerOffset
    );
    // start creating list of wildcard combinations.
    const coms: WildcardCombination[] = [];
    while (true) {
      coms.push(com);
      const nextcom = com.yieldNextCombination();
      if (nextcom === null) {
        break;
      }
      com = nextcom;
    }

    // convert to DiscardPair.
    // For wildcards, use one of the marks in the current selection.
    const cds = this.filterJokers();
    const mark = cds[0].mark;
    const dps: DiscardPair[] = [];
    for (let i = 0; i < coms.length; i++) {
      const wcds = coms[i].weakerCardNumbers.map((v) => {
        const c = Card.createCard(mark, v);
        c.flagAsWildcard();
        return c;
      });
      const scds = coms[i].strongerCardNumbers.map((v) => {
        const c = Card.createCard(mark, v);
        c.flagAsWildcard();
        return c;
      });
      dps.push(new DiscardPairImple(wcds.concat(cds).concat(scds)));
    }

    // If the selection has 1 numbered card, jokers are also usable as that number, so we add the combination here.
    if (cds.length == 1) {
      const cps: Card.Card[] = [];
      for (let i = 0; i < jokers; i++) {
        const c = cds[0].copy();
        c.flagAsWildcard();
        cps.push(c);
      }
      dps.push(new DiscardPairImple(cds.concat(cps)));
    }

    return dps;
  }

  private fillMissingKaidanCards(
    jokers: number,
    weakestCardNumber: Card.CardNumber,
    strongestCardNumber: Card.CardNumber
  ) {
    // Dynamically replace the missing kaidan cards with existing jokers.
    let njokers = jokers;
    let ofs = weakestCardNumber;
    while (true) {
      const next = Calculation.calcStrongerCardNumber(
        ofs,
        this.strengthInverted
      );
      if (next === null) {
        throw new Error(
          "tried to search for stronger number even if weakest -> strongest are defined"
        );
      }
      ofs = next;
      if (ofs == strongestCardNumber) {
        break;
      }
      if (!this.hasCardWithNumber(ofs)) {
        if (njokers == 0) {
          this.sort();
          return 0;
        }
        njokers--;
        this.removeJoker();
        const wc = Card.createCard(Card.CardMark.DIAMONDS, ofs);
        wc.flagAsWildcard();
        this.selectedCards.push(wc);
      }
    }
    this.sort();
    return njokers;
  }

  private removeJoker() {
    for (let i = 0; i < this.selectedCards.length; i++) {
      if (this.selectedCards[i].isJoker()) {
        this.selectedCards.splice(i, 1);
        break;
      }
    }
  }

  public sort(): void {
    // copied from card.sort
    this.selectedCards.sort((a, b) => {
      if (a.cardNumber == b.cardNumber) {
        return 0;
      }
      if (a.isJoker()) {
        return 1;
      }
      if (b.isJoker()) {
        return -1;
      }
      return a.calcStrength() < b.calcStrength() ? -1 : 1;
    });
  }

  private prune(pairs: DiscardPair[], discardStack: DiscardStack) {
    // Prunes discard pairs that are not playable after the given last pair.
    // Filter invalid ones first
    pairs = pairs.filter((p) => {
      return p.isValid();
    });
    return discardStack.last().isNull()
      ? pairs
      : pairs.filter((v) => {
          return this.IsPlayable(v, discardStack);
        });
  }

  private IsPlayable(pair: DiscardPair, discardStack: DiscardStack) {
    const lastPair = discardStack.last();
    if (pair.count() != lastPair.count()) {
      return false;
    }
    // 3 of spades after a single joker is allowed.
    if (
      lastPair.count() == 1 &&
      lastPair.cards[0].isJoker() &&
      pair.cards[0].mark == Card.CardMark.SPADES &&
      pair.cards[0].cardNumber == 3
    ) {
      return true;
    }
    if (pair.isSequencial() != lastPair.isSequencial()) {
      return false;
    }
    if (pair.isOnlyJoker()) {
      return true;
    }
    if (
      !Calculation.isStrongEnough(
        lastPair.calcStrength(),
        pair.calcStrength(),
        this.strengthInverted
      )
    ) {
      return false;
    }
    return true;
  }

  private isSpecial3OfSpades(discardStack: DiscardStack) {
    // Returns if the last discard is a 3 of spades which was used to negate a joker.
    const ldp = discardStack.last();
    const sldp = discardStack.secondToLast();
    return (
      ldp.count() == 1 &&
      ldp.cards[0].isSameCard(Card.createCard(Card.CardMark.SPADES, 3)) &&
      sldp.count() == 1 &&
      sldp.cards[0].isJoker()
    );
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

  private hasCardWithNumber(cardNumber: Card.CardNumber) {
    return (
      this.selectedCards.filter((val) => {
        return val.cardNumber == cardNumber;
      }).length > 0
    );
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
    // get the weakest and strongest card number in a kaidan.
    // This function does not consider jokers.
    // even if the numbers between the weakest and strongest are not actually connected, it still returns them, assuming that the missing parts can be wildcarded with jokers.
    const cds = this.selectedCards.filter((v) => {
      return !v.isJoker();
    });
    cds.sort((a, b) => {
      return a.cardNumber == b.cardNumber
        ? 0
        : Calculation.isStrongEnough(
            Calculation.convertCardNumberIntoStrength(a.cardNumber),
            Calculation.convertCardNumberIntoStrength(b.cardNumber),
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

class WildcardCombination {
  weakerCardNumbers: number[];
  strongerCardNumbers: number[];
  strengthInverted: boolean;
  strongerStartingPoint: number;
  constructor(
    weakerCardNumbers: number[],
    strongerCardNumbers: number[],
    strengthInverted: boolean,
    strongerStartingPoint: number
  ) {
    // strongerStartingPoint determines the starting of stronger wildcard when strongerCardNumbers is empty.
    this.weakerCardNumbers = weakerCardNumbers;
    this.strongerCardNumbers = strongerCardNumbers;
    this.strengthInverted = strengthInverted;
    this.strongerStartingPoint = strongerStartingPoint;
  }
  public yieldNextCombination(): WildcardCombination | null {
    // Move one element of weaker to stronger and returns the new combination.
    // When no more combination can be yielded, returns null.
    if (this.weakerCardNumbers.length == 0) {
      return null; // no weaker cards
    }
    const s =
      this.strongerCardNumbers.length == 0
        ? this.strongerStartingPoint
        : Calculation.calcStrongerCardNumber(
            this.strongerCardNumbers[this.strongerCardNumbers.length - 1],
            this.strengthInverted
          );
    if (s === null) {
      return null; // no more space
    }
    const weakercp = [...this.weakerCardNumbers];
    const strongercp = [...this.strongerCardNumbers];
    weakercp.shift();
    strongercp.push(s);
    return new WildcardCombination(
      weakercp,
      strongercp,
      this.strengthInverted,
      this.strongerStartingPoint
    );
  }
}

// DO NOT USE EXCEPT TESTING PURPOSES.
export function createWildcardCombinationForTest(
  weakerCardNumbers: number[],
  strongerCardNumbers: number[],
  strengthInverted: boolean,
  strongerStartingPoint: number
): WildcardCombination {
  return new WildcardCombination(
    weakerCardNumbers,
    strongerCardNumbers,
    strengthInverted,
    strongerStartingPoint
  );
}
