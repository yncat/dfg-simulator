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
  constructor(playerIdentifier: string) {
    super("transfer7", playerIdentifier);
  }
}

export class Discard10 extends AdditionalActionBase {
  constructor(playerIdentifier: string) {
    super("discard10", playerIdentifier);
  }
}

class SingleCardSelector {
  private cards: Card.Card[];
  private selected: boolean[];
  constructor(cards: Card.Card[]) {
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
}
