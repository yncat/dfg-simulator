/*
Additional action related classes
*/

import * as Card from "./card";
import * as CardSelection from "./cardSelection";
// Add a new value on the lines below respectively, if you want to add a new additional action.
export type SupportedAdditionalActions = Transfer7 | Discard10;
export type SupportedAdditionalActionTypes = "transfer7" | "discard10";

export interface AdditionalAction {
  readonly additionalActionType: SupportedAdditionalActionTypes;
  readonly playerIdentifier: string;
}

class AdditionalActionBase implements AdditionalAction {
  readonly additionalActionType: SupportedAdditionalActionTypes;
  readonly playerIdentifier: string;
  constructor(
    additionalActionType: SupportedAdditionalActionTypes,
    playerIdentifier: string
  ) {
    this.additionalActionType = additionalActionType;
    this.playerIdentifier = playerIdentifier;
  }
}

export class Transfer7 extends AdditionalActionBase {
  singleCardSelector: SingleCardSelector;
  constructor(playerIdentifier: string, cards: Card.Card[]) {
    super("transfer7", playerIdentifier);
    this.singleCardSelector = new SingleCardSelector(...cards);
  }
}

export class Discard10 extends AdditionalActionBase {
  singleCardSelector: SingleCardSelector;
  constructor(playerIdentifier: string, cards: Card.Card[]) {
    super("discard10", playerIdentifier);
    this.singleCardSelector = new SingleCardSelector(...cards);
  }
}

export class SingleCardSelector {
  private cards: Card.Card[];
  private selected: boolean[];
  constructor(...cards: Card.Card[]) {
    this.cards = cards;
    this.selected = this.cards.map(() => {
      return false;
    });
  }

  public isSelected(index: number): boolean {
    if (index < 0 || index >= this.selected.length) {
      return false;
    }
    return this.selected[index];
  }

  public checkSelectability(
    index: number
  ): CardSelection.SelectabilityCheckResult {
    if (index < 0 || index >= this.selected.length) {
      return CardSelection.SelectabilityCheckResult.NOT_SELECTABLE;
    }
    if (this.selected[index]) {
      return CardSelection.SelectabilityCheckResult.ALREADY_SELECTED;
    }
    const numSelected = this.selected.filter((v) => {
      return v;
    }).length;
    if (numSelected !== 0) {
      return CardSelection.SelectabilityCheckResult.NOT_SELECTABLE;
    }
    return CardSelection.SelectabilityCheckResult.SELECTABLE;
  }

  public enumerateCards(): Card.Card[] {
    // copy array, but do not copy cards themselves
    return this.cards.map((v) => {
      return v;
    });
  }

  private enumerateSelectedCards(): Card.Card[] {
    return this.cards.filter((v, i) => {
      return this.selected[i];
    });
  }

  public createCardSelectionPair(): CardSelection.CardSelectionPair {
    return new CardSelection.CardSelectionPairImple(
      this.enumerateSelectedCards()
    );
  }

  public select(index: number): CardSelection.CardSelectResult {
    if (index < 0 || index >= this.cards.length) {
      return CardSelection.CardSelectResult.NOT_SELECTABLE;
    }
    if (this.selected[index]) {
      return CardSelection.CardSelectResult.ALREADY_SELECTED;
    }
    if (
      this.checkSelectability(index) !==
      CardSelection.SelectabilityCheckResult.SELECTABLE
    ) {
      return CardSelection.CardSelectResult.NOT_SELECTABLE;
    }

    this.selected[index] = true;
    return CardSelection.CardSelectResult.SUCCESS;
  }

  public deselect(index: number): CardSelection.CardDeselectResult {
    if (index < 0 || index >= this.cards.length) {
      return CardSelection.CardDeselectResult.NOT_DESELECTABLE;
    }
    if (!this.selected[index]) {
      return CardSelection.CardDeselectResult.ALREADY_DESELECTED;
    }

    this.selected[index] = false;
    return CardSelection.CardDeselectResult.SUCCESS;
  }
}
