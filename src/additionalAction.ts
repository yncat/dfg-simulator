/*
Additional action related classes
*/

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

export function isValidTransfer7(
  additionalAction: AdditionalAction
): additionalAction is Transfer7 {
  return additionalAction.additionalActionType === "transfer7";
}

export class Discard10 extends AdditionalActionBase {
  constructor(playerIdentifier: string) {
    super("discard10", playerIdentifier);
  }
}

export function isValidDiscard10(
  additionalAction: AdditionalAction
): additionalAction is Discard10 {
  return additionalAction.additionalActionType === "discard10";
}
