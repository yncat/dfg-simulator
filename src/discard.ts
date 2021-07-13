/*
Discard plan builder / checker
*/
import * as Card from "./card";
import { Hand } from "./hand";
import * as CalcFunctions from "./calcFunctions";

export interface DiscardPair {
  cards: Card.Card[];
  count: () => number;
  calcCardNumber: (strengthInverted: boolean) => number;
  calcStrength: () => number;
  isNull: () => boolean;
  isKaidan: () => boolean;
  isSameFrom: (discardPair: DiscardPair) => boolean;
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

  public isSameFrom(discardPair: DiscardPair): boolean {
    if (this.count() != discardPair.count()) {
      return false;
    }
    let ok = true;
    for (let i = 0; i < this.count(); i++) {
      if (!this.cards[i].isSameFrom(discardPair.cards[i])) {
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

export function createNullDiscardPair(): DiscardPair {
  return new DiscardPairImple([]);
}

// DO NOT USE EXCEPT TESTING PURPOSES.
export function CreateDiscardPairForTest(...cards: Card.Card[]): DiscardPair {
  return new DiscardPairImple(cards);
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

export class DiscardPlanner {
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

  private checkSingle(index: number): SelectabilityCheckResult {
    const selectingCard = this.hand.cards[index];
    if (this.lastDiscardPair.isNull()) {
      return SelectabilityCheckResult.SELECTABLE;
    }

    // If selecting a joker and the last discard pair consists of one card only, it can be selected unless the last discard pair is also a joker.
    if (selectingCard.isJoker() && this.lastDiscardPair.count() == 1) {
      return this.lastDiscardPair.cards[0].isJoker()
        ? SelectabilityCheckResult.NOT_SELECTABLE
        : SelectabilityCheckResult.SELECTABLE;
    }

    // Single joker can be overriden by a 3 of spades
    if (
      this.lastDiscardPair.cards[0].isJoker() &&
      selectingCard.mark == Card.CardMark.SPADES &&
      selectingCard.cardNumber == 3
    ) {
      return SelectabilityCheckResult.SELECTABLE;
    }

    // check strength
    const strongEnough = CalcFunctions.isStrongEnough(
      this.lastDiscardPair.calcStrength(),
      CalcFunctions.convertCardNumberIntoStrength(selectingCard.cardNumber),
      this.strengthInverted
    );
    if (!strongEnough) {
      return SelectabilityCheckResult.NOT_SELECTABLE;
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
      return SelectabilityCheckResult.SELECTABLE;
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
          return SelectabilityCheckResult.NOT_SELECTABLE;
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
          ? SelectabilityCheckResult.SELECTABLE
          : SelectabilityCheckResult.NOT_SELECTABLE;
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
          return SelectabilityCheckResult.NOT_SELECTABLE;
        }
      } else {
        // since we are selecting a numbered card, the subsequent cards must be the same number.
        const jokers = this.hand.countJokers();
        if (
          jokers +
            this.hand.countCardsWithSpecifiedNumber(selectingCard.cardNumber) <
          this.lastDiscardPair.count()
        ) {
          return SelectabilityCheckResult.NOT_SELECTABLE;
        } // if
      } // joker or number
    } // not a kaidan

    return SelectabilityCheckResult.SELECTABLE;
  }

  private checkMultiple(index: number) {
    const lastDiscardCount = this.lastDiscardPair.count();
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

    if (this.lastDiscardPair.isKaidan() || this.lastDiscardPair.isNull()) {
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
          ? SelectabilityCheckResult.SELECTABLE
          : SelectabilityCheckResult.NOT_SELECTABLE;
      } else {
        // we have at least 1 numbered card in the previous selection
        const wc = this.findWeakestSelectedCard();
        // OK if the selecting card is connected by kaidan with the previous selection.
        // no worries about jokers because isConnectedByKaidan automatically substitutes jokers.
        return this.isConnectedByKaidan(wc.cardNumber, selectingCard.cardNumber)
          ? SelectabilityCheckResult.SELECTABLE
          : SelectabilityCheckResult.NOT_SELECTABLE;
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

export class DiscardPairEnumerator {
  private selectedCards: Card.Card[];
  private readonly lastDiscardPair: DiscardPair;
  private readonly strengthInverted: boolean;
  constructor(lastDiscardPair: DiscardPair, strengthInverted: boolean) {
    this.lastDiscardPair = lastDiscardPair;
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
        this.lastDiscardPair
      );
    }

    // When the selection only consists of jokers, they cannot be used as wildcards, so simply return as a bunch of jokers.
    if (jokers == this.selectedCards.length) {
      return this.prune(
        [new DiscardPairImple(this.selectedCards)],
        this.lastDiscardPair
      );
    }

    return this.prune(this.findJokerCombinations(), this.lastDiscardPair);
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
      const w = CalcFunctions.calcWeakerCardNumber(
        weakerOffset,
        this.strengthInverted
      );
      if (w === null) {
        const s = CalcFunctions.calcStrongerCardNumber(
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
    const ofs = CalcFunctions.calcStrongerCardNumber(
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
        const c = new Card.Card(mark, v);
        c.flagAsWildcard();
        return c;
      });
      const scds = coms[i].strongerCardNumbers.map((v) => {
        const c = new Card.Card(mark, v);
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
      const next = CalcFunctions.calcStrongerCardNumber(
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
        const wc = new Card.Card(Card.CardMark.DIAMONDS, ofs);
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

  private prune(pairs: DiscardPair[], lastPair: DiscardPair) {
    // Prunes discard pairs that are not playable after the given last pair.
    return lastPair.isNull()
      ? pairs
      : pairs.filter((v) => {
          return this.IsPlayable(v, lastPair);
        });
  }

  private IsPlayable(pair: DiscardPair, lastPair: DiscardPair) {
    if (pair.count() != lastPair.count()) {
      return false;
    }
    if (pair.isKaidan() != lastPair.isKaidan()) {
      return false;
    }
    if (
      !CalcFunctions.isStrongEnough(
        lastPair.calcStrength(),
        pair.calcStrength(),
        this.strengthInverted
      )
    ) {
      return false;
    }
    return true;
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
        : CalcFunctions.calcStrongerCardNumber(
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
