/*
Game manager
*/
import * as Player from "./player";
import * as Deck from "./deck";
import * as CalcFunctions from "./calcFunctions";
import * as Hand from "./hand";
import * as Discard from "./discard";
import * as Card from "./card";

export type StartInfo = {
  playerCount: number; // Number of players joined in the game
  deckCount: number; // How many decks are being used?
  // Arrays above are all sorted by actual play order.
  playerIdentifiers: string[]; // player identifiers
  handCounts: number[]; // Number of cards given
};

export class GameInitializationError extends Error {}

export interface Game {
  readonly startInfo: StartInfo;
  startActivePlayerControl: () => ActivePlayerControl;
}

export function createGame(players: Player.Player[]): Game {
  if (!identifiersValid(players)) {
    throw new GameInitializationError(
      "one of the players' identifiers is duplicating"
    );
  }

  const g = new GameImple(players);
  return g;
}

function identifiersValid(players: Player.Player[]) {
  let found = false;
  for (let i = 0; i < players.length - 1; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (players[i].identifier == players[j].identifier) {
        found = true;
        break;
      }
    }
  }
  return !found;
}

class GameImple implements Game {
  private players: Player.Player[];
  private turn: number;
  private lastDiscardPair: Discard.DiscardPair;
  strengthInverted: boolean;
  public readonly startInfo: StartInfo;
  constructor(players: Player.Player[]) {
    this.players = players;
    this.turn = 0;
    this.lastDiscardPair = Discard.createNullDiscardPair();
    this.strengthInverted = false;
    this.startInfo = this.prepair();
  }

  public startActivePlayerControl(): ActivePlayerControl {
    const dp = new Discard.DiscardPlanner(
      this.players[this.turn].hand,
      this.lastDiscardPair,
      this.strengthInverted
    );
    const dpe = new Discard.DiscardPairEnumerator(
      this.lastDiscardPair,
      this.strengthInverted
    );
    return new ActivePlayerControlImple(
      this.players[this.turn].identifier,
      this.players[this.turn].hand,
      dp,
      dpe
    );
  }

  private prepair(): StartInfo {
    this.shufflePlayers();
    const decks = this.prepairDecks();
    const deckCount = decks.length;
    this.distributeCards(decks);
    return {
      playerCount: this.players.length,
      deckCount: deckCount,
      playerIdentifiers: this.enumeratePlayerIdentifiers(),
      handCounts: this.enumerateHandCounts(),
    };
  }

  private shufflePlayers() {
    const out = Array.from(this.players);
    for (let i = out.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[r];
      out[r] = tmp;
    }
    this.players = out;
  }

  private prepairDecks() {
    const deckCount = CalcFunctions.calcRequiredDeckCount(this.players.length);
    const decks: Deck.Deck[] = [];
    for (let i = 0; i < deckCount; i++) {
      const d = new Deck.Deck();
      d.shuffle();
      decks.push(d);
    }
    return decks;
  }

  private distributeCards(decks: Deck.Deck[]) {
    while (decks.length > 0) {
      for (let i = 0; i < this.players.length; i++) {
        let c = decks[0].draw();
        if (c === null) {
          decks.shift();
          if (decks.length == 0) {
            break;
          }
          c = decks[0].draw();
          if (c === null) {
            throw new GameInitializationError(
              "deck is unexpectedly empty, maybe corrupted?"
            );
          }
        }
        this.players[i].hand.give(c);
      }
    }
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].hand.sort();
    }
  }

  private enumeratePlayerIdentifiers() {
    return this.players.map((v) => {
      return v.identifier;
    });
  }

  private enumerateHandCounts() {
    return this.players.map((v) => {
      return v.hand.count();
    });
  }
}

export const DiscardResult = {
  SUCCESS: 0,
  NOT_FOUND: 1,
} as const;
export type DiscardResult = typeof DiscardResult[keyof typeof DiscardResult];

export interface ActivePlayerControl {
  readonly playerIdentifier: string;
  enumerateHand: () => Card.Card[];
  checkCardSelectability: (index: number) => SelectabilityCheckResult;
  isCardSelected: (index: number) => boolean;
  selectCard: (index: number) => CardSelectResult;
  deselectCard: (index: number) => CardDeselectResult;
  enumerateDiscardPairs: () => DiscardPair[];
  pass: () => void;
  hasPassed: () => boolean;
  discard: (discardPair: DiscardPair) => DiscardResult;
  getDiscard: () => DiscardPair;
}

// DO NOT USE EXCEPT TESTING PURPOSES.
export function createActivePlayerControlForTest(
  playerIdentifier: string,
  hand: Hand.Hand,
  discardPlanner: Discard.DiscardPlanner,
  discardPairEnumerator: Discard.DiscardPairEnumerator
): ActivePlayerControl {
  return new ActivePlayerControlImple(
    playerIdentifier,
    hand,
    discardPlanner,
    discardPairEnumerator
  );
}

// Copying from discard module. Redefine here because I think that they're in a different domain model. Although it sounds tedious, we will convert values.
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

export interface DiscardPair {
  cards: Card.Card[];
  count: () => number;
  calcCardNumber: (strengthInverted: boolean) => number;
  calcStrength: () => number;
  isNull: () => boolean;
  isKaidan: () => boolean;
  isSameFrom: (discardPair: DiscardPair) => boolean;
}

export class ActivePlayerControlError extends Error {}

class ActivePlayerControlImple implements ActivePlayerControl {
  public readonly playerIdentifier: string;
  private readonly hand: Hand.Hand;
  private readonly discardPlanner: Discard.DiscardPlanner;
  private readonly discardPairEnumerator: Discard.DiscardPairEnumerator;
  private passed: boolean;
  private discardPair: DiscardPair | null;
  constructor(
    playerIdentifier: string,
    hand: Hand.Hand,
    discardPlanner: Discard.DiscardPlanner,
    discardPairEnumerator: Discard.DiscardPairEnumerator
  ) {
    this.playerIdentifier = playerIdentifier;
    this.hand = hand;
    this.discardPlanner = discardPlanner;
    this.discardPairEnumerator = discardPairEnumerator;
    this.passed = false;
    this.discardPair = null;
  }

  public enumerateHand(): Card.Card[] {
    return this.hand.cards;
  }

  public checkCardSelectability(index: number): SelectabilityCheckResult {
    return this.convertSelectabilityCheckResult(
      this.discardPlanner.checkSelectability(index)
    );
  }

  public isCardSelected(index: number): boolean {
    return this.discardPlanner.isSelected(index);
  }

  public selectCard(index: number): CardSelectResult {
    return this.convertCardSelectResult(this.discardPlanner.select(index));
  }

  public deselectCard(index: number): CardDeselectResult {
    return this.convertCardDeselectResult(this.discardPlanner.deselect(index));
  }

  public enumerateDiscardPairs(): DiscardPair[] {
    return this.discardPairEnumerator.enumerate(
      ...this.discardPlanner.enumerateSelectedCards()
    );
  }

  public pass(): void {
    this.passed = true;
    this.discardPair = null;
  }

  public hasPassed(): boolean {
    return this.passed;
  }

  public discard(dp: DiscardPair): DiscardResult {
    const matched = this.enumerateDiscardPairs().filter((v) => {
      return v.isSameFrom(dp);
    });
    if (matched.length == 0) {
      return DiscardResult.NOT_FOUND;
    }

    this.discardPair = dp;
    this.passed = false;
    return DiscardResult.SUCCESS;
  }

  public getDiscard(): DiscardPair {
    if (this.discardPair === null) {
      throw new ActivePlayerControlError("cannot get discard when passed");
    }
    return this.discardPair;
  }

  private convertSelectabilityCheckResult(
    ret: Discard.SelectabilityCheckResult
  ): SelectabilityCheckResult {
    return ret == Discard.SelectabilityCheckResult.SELECTABLE
      ? SelectabilityCheckResult.SELECTABLE
      : ret == Discard.SelectabilityCheckResult.ALREADY_SELECTED
      ? SelectabilityCheckResult.ALREADY_SELECTED
      : SelectabilityCheckResult.NOT_SELECTABLE;
  }

  private convertCardSelectResult(ret: Discard.CardSelectResult) {
    return ret == Discard.CardSelectResult.SUCCESS
      ? CardSelectResult.SUCCESS
      : ret == Discard.CardSelectResult.ALREADY_SELECTED
      ? CardSelectResult.ALREADY_SELECTED
      : CardSelectResult.NOT_SELECTABLE;
  }

  private convertCardDeselectResult(ret: Discard.CardSelectResult) {
    return ret == Discard.CardDeselectResult.SUCCESS
      ? CardDeselectResult.SUCCESS
      : ret == Discard.CardDeselectResult.ALREADY_DESELECTED
      ? CardDeselectResult.ALREADY_DESELECTED
      : CardDeselectResult.NOT_DESELECTABLE;
  }
}
