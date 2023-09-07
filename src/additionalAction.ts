/*
Additional action related classes
*/

import * as Card from "./card";
import * as CardSelection from "./cardSelection";
// Add a new value on the lines below respectively, if you want to add a new additional action.
export type SupportedAdditionalActions = Transfer7 | Exile10;
export type SupportedAdditionalActionTypes = "transfer7" | "exile10";

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

  public enumerateCards(): Card.Card[] {
    return this.singleCardSelector.enumerateCards();
  }

  public checkCardSelectability(
    index: number
  ): CardSelection.SelectabilityCheckResult {
    return this.singleCardSelector.checkSelectability(index);
  }

  public isCardSelected(index: number): boolean {
    return this.singleCardSelector.isSelected(index);
  }

  public selectCard(index: number): CardSelection.CardSelectResult {
    return this.singleCardSelector.select(index);
  }

  public deselectCard(index: number): CardSelection.CardDeselectResult {
    return this.singleCardSelector.deselect(index);
  }

  public createCardSelectionPair(): CardSelection.CardSelectionPair | null {
    return this.singleCardSelector.createCardSelectionPair();
  }
}

export class Exile10 extends AdditionalActionBase {
  singleCardSelector: SingleCardSelector;
  constructor(playerIdentifier: string, cards: Card.Card[]) {
    super("exile10", playerIdentifier);
    this.singleCardSelector = new SingleCardSelector(...cards);
  }

  public enumerateCards(): Card.Card[] {
    return this.singleCardSelector.enumerateCards();
  }

  public checkCardSelectability(
    index: number
  ): CardSelection.SelectabilityCheckResult {
    return this.singleCardSelector.checkSelectability(index);
  }

  public isCardSelected(index: number): boolean {
    return this.singleCardSelector.isSelected(index);
  }

  public selectCard(index: number): CardSelection.CardSelectResult {
    return this.singleCardSelector.select(index);
  }

  public deselectCard(index: number): CardSelection.CardDeselectResult {
    return this.singleCardSelector.deselect(index);
  }

  public createCardSelectionPair(): CardSelection.CardSelectionPair | null {
    return this.singleCardSelector.createCardSelectionPair();
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

  public createCardSelectionPair(): CardSelection.CardSelectionPair | null {
    const selectedCards = this.enumerateSelectedCards();
    if (selectedCards.length === 0) {
      return null;
    }
    return new CardSelection.CardSelectionPair(selectedCards);
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
