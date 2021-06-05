/*
Game manager
*/
import * as Player from "./player";
import * as Hand from "./hand";
import * as Discard from "./discard";
import * as Card from "./card";
import * as Rank from "./rank";
import * as Event from "./event";

export type StartInfo = {
  playerCount: number; // Number of players joined in the game
  // Arrays above are assumed to be all sorted by actual play order.
  playerIdentifiers: string[]; // player identifiers
  handCounts: number[]; // Number of cards given
};

export const GameEvent = {
  NAGARE: 0,
  AGARI: 1,
  YAGIRI: 2,
  KAKUMEI: 3,
  STR_NORMAL: 5,
  DISCARD: 6,
  PASS: 7,
  GAME_END: 8,
  PLAYER_KICKED: 9,
} as const;
export type GameEvent = typeof GameEvent[keyof typeof GameEvent];

export type PlayerRankChangeResult = {
  identifier: string;
  before: Rank.RankType;
  after: Rank.RankType;
};

export type KickPlayerResult = {
  gameEvents: GameEvent[];
  playerRankChanges: PlayerRankChangeResult[];
};

export class GameError extends Error {}

export interface Game {
  readonly startInfo: StartInfo;
  startActivePlayerControl: () => ActivePlayerControl;
  finishActivePlayerControl: (
    activePlayerControl: ActivePlayerControl
  ) => GameEvent[];
  kickPlayerByIdentifier(identifier: string): KickPlayerResult;
}

export type GameInitParams = {
  players: Player.Player[];
  activePlayerIndex: number;
  activePlayerActionCount: number;
  lastDiscardPair: Discard.DiscardPair;
  lastDiscarderIdentifier: string;
  strengthInverted: boolean;
  agariPlayerIdentifiers: string[];
  eventConfig: Event.EventConfig;
};

export class GameImple implements Game {
  private players: Player.Player[];
  private turnCount: number;
  private activePlayerIndex: number;
  private activePlayerActionCount: number;
  private lastDiscardPair: Discard.DiscardPair;
  private lastDiscarderIdentifier: string;
  strengthInverted: boolean;
  private agariPlayerIdentifiers: string[];
  private gameEnded: boolean; // cach the game finish state for internal use
  private eventConfig: Event.EventConfig;
  public readonly startInfo: StartInfo;

  constructor(params: GameInitParams) {
    // The constructor trusts all parameters and doesn't perform any checks. This allows simulating in-progress games or a certain predefined situations. Callers must make sure that the parameters are valid or are what they want to simulate.
    this.players = params.players;
    this.turnCount = 1;
    this.activePlayerIndex = params.activePlayerIndex;
    this.activePlayerActionCount = params.activePlayerActionCount;
    this.lastDiscardPair = params.lastDiscardPair;
    this.lastDiscarderIdentifier = params.lastDiscarderIdentifier;
    this.strengthInverted = params.strengthInverted;
    this.agariPlayerIdentifiers = params.agariPlayerIdentifiers;
    this.eventConfig = params.eventConfig;
    this.gameEnded = false;
    this.startInfo = this.makeStartInfo();
  }

  public startActivePlayerControl(): ActivePlayerControl {
    const dp = new Discard.DiscardPlanner(
      this.players[this.activePlayerIndex].hand,
      this.lastDiscardPair,
      this.strengthInverted
    );
    const dpe = new Discard.DiscardPairEnumerator(
      this.lastDiscardPair,
      this.strengthInverted
    );
    return new ActivePlayerControlImple(
      this.calcControlIdentifier(),
      this.players[this.activePlayerIndex].identifier,
      this.players[this.activePlayerIndex].hand,
      dp,
      dpe
    );
  }

  public finishActivePlayerControl(
    activePlayerControl: ActivePlayerControl
  ): GameEvent[] {
    if (activePlayerControl.controlIdentifier != this.calcControlIdentifier()) {
      throw new GameError("the given activePlayerControl is no longer valid");
    }
    if (activePlayerControl.enumerateHand().length == 0) {
      throw new GameError(
        "this player's hand is empty; cannot perform any action"
      );
    }

    const events: GameEvent[] = [];
    this.processDiscardOrPass(activePlayerControl, events);
    this.processPlayerHandUpdate(activePlayerControl);
    this.processAgariCheck(activePlayerControl, events);
    this.processGameEndCheck(events);
    this.processTurnAdvancement(events);
    return events;
  }

  public kickPlayerByIdentifier(identifier: string): KickPlayerResult {
    const p = this.findPlayerOrNull(identifier);
    if (p === null) {
      throw new GameError("player to kick is not found");
    }

    const events: GameEvent[] = [];
    events.push(GameEvent.PLAYER_KICKED);
    const wasActive = p === this.players[this.activePlayerIndex];
    // if the kicked player is currently active, internally go back to the previously active player.
    if (wasActive) {
      this.processTurnReverseWhenKicked();
    }
    this.deletePlayer(identifier);
    const playerRankChanges = this.recalcAlreadyRankedPlayers();
    this.processGameEndCheck(events);
    if (wasActive) {
      this.processTurnAdvancement(events);
    }
    return { gameEvents: events, playerRankChanges: playerRankChanges };
  }

  private findPlayerOrNull(identifier: string): Player.Player | null {
    let found: Player.Player | null = null;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].identifier == identifier) {
        found = this.players[i];
        break;
      }
    }

    return found;
  }

  private findPlayer(identifier: string): Player.Player {
    // this throws an error when player is not found.
    // To get null when player is not found, use findPlayerOrNull.
    let found: Player.Player | null = null;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].identifier == identifier) {
        found = this.players[i];
        break;
      }
    }

    if (found === null) {
      throw new GameError("player data consistency is unexpectedly broken");
    }

    return found;
  }

  private deletePlayer(identifier: string) {
    this.agariPlayerIdentifiers = this.agariPlayerIdentifiers.filter((v) => {
      return v != identifier;
    });
    this.players = this.players.filter((v) => {
      return v.identifier != identifier;
    });
  }

  private recalcAlreadyRankedPlayers(): PlayerRankChangeResult[] {
    const changes: PlayerRankChangeResult[] = [];
    for (let i = 0; i < this.agariPlayerIdentifiers.length; i++) {
      const p = this.findPlayer(this.agariPlayerIdentifiers[i]);
      // Assumes there is the kicked player's instance remaining in this.players, so subtract -1.
      const ret = p.rank.determine(this.players.length - 1, i + 1);
      if (ret.changed) {
        changes.push({
          identifier: p.identifier,
          before: ret.before,
          after: ret.after,
        });
      }
    }
    return changes;
  }

  private makeStartInfo(): StartInfo {
    return {
      playerCount: this.players.length,
      playerIdentifiers: this.enumeratePlayerIdentifiers(),
      handCounts: this.enumerateHandCounts(),
    };
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

  private processDiscardOrPass(
    activePlayerControl: ActivePlayerControl,
    events: GameEvent[]
  ) {
    if (activePlayerControl.hasPassed()) {
      events.push(GameEvent.PASS);
      return;
    }
    // We won't check the validity of the given discard pair here. It should be done in discardPlanner and DiscardPairEnumerator.
    this.lastDiscardPair = activePlayerControl.getDiscard();
    this.lastDiscarderIdentifier = this.players[
      this.activePlayerIndex
    ].identifier;
    events.push(GameEvent.DISCARD);
  }

  private processPlayerHandUpdate(activePlayerControl: ActivePlayerControl) {
    if (activePlayerControl.hasPassed()) {
      return;
    }
    this.players[this.activePlayerIndex].hand.take(
      ...activePlayerControl.getDiscard().cards
    );
  }

  private processTurnAdvancement(events: GameEvent[]) {
    // Do nothing when the game is already ended. Without this, the runtime causes heap out of memory by infinitely pushing nagare events.
    if (this.gameEnded) {
      return;
    }

    while (true) {
      this.activePlayerIndex++;
      if (this.activePlayerIndex == this.players.length) {
        this.activePlayerIndex = 0;
        this.turnCount++;
      }
      if (
        this.players[this.activePlayerIndex].identifier ==
        this.lastDiscarderIdentifier
      ) {
        events.push(GameEvent.NAGARE);
      }
      if (
        this.players[this.activePlayerIndex].rank.getRankType() ==
        Rank.RankType.UNDETERMINED
      ) {
        break;
      }
    }
  }

  private processTurnReverseWhenKicked() {
    // internally used to reverce turn for the last active player when the active player is kicked out of the game.
    if (this.gameEnded) {
      return;
    }

    while (true) {
      this.activePlayerIndex--;
      if (this.activePlayerIndex == -1) {
        this.activePlayerIndex = this.players.length - 1;
        // do not touch turn count here because this is not the game's real logic. We are doing this for switching to the correct player after deleting the kicked player.
      }
      if (
        this.players[this.activePlayerIndex].rank.getRankType() ==
        Rank.RankType.UNDETERMINED
      ) {
        break;
      }
    }
  }

  private processAgariCheck(
    activePlayerControl: ActivePlayerControl,
    events: GameEvent[]
  ) {
    if (this.players[this.activePlayerIndex].hand.count() == 0) {
      events.push(GameEvent.AGARI);
      this.agariPlayerIdentifiers.push(
        this.players[this.activePlayerIndex].identifier
      );
      const pos = this.agariPlayerIdentifiers.length;
      this.players[this.activePlayerIndex].rank.determine(
        this.players.length,
        pos
      );
    }
  }

  private processGameEndCheck(events: GameEvent[]) {
    const rm = this.players.filter((v) => {
      return v.rank.getRankType() == Rank.RankType.UNDETERMINED;
    });
    if (rm.length == 1) {
      const p = rm[0];
      p.rank.determine(this.players.length, this.players.length);
      this.agariPlayerIdentifiers.push(p.identifier);
      events.push(GameEvent.GAME_END);
      // Cach the game ended state. this.processTurnAdvancement checks this value and skips the entire processing to avoid infinite loop and the subsequent heap out of memory.
      this.gameEnded = true;
    }
  }

  private calcControlIdentifier() {
    // control identifier is used to check whether an ActivePlayerControl object is valid at the current context when it is passed to finishActivePlayerControl.
    return (
      "t" +
      this.turnCount.toString() +
      "p" +
      this.activePlayerIndex.toString() +
      "a" +
      this.activePlayerActionCount.toString()
    );
  }
}

export const DiscardResult = {
  SUCCESS: 0,
  NOT_FOUND: 1,
} as const;
export type DiscardResult = typeof DiscardResult[keyof typeof DiscardResult];

export interface ActivePlayerControl {
  readonly controlIdentifier: string;
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
  controlIdentifier: string,
  playerIdentifier: string,
  hand: Hand.Hand,
  discardPlanner: Discard.DiscardPlanner,
  discardPairEnumerator: Discard.DiscardPairEnumerator
): ActivePlayerControl {
  return new ActivePlayerControlImple(
    controlIdentifier,
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
  public readonly controlIdentifier: string;
  private readonly hand: Hand.Hand;
  private readonly discardPlanner: Discard.DiscardPlanner;
  private readonly discardPairEnumerator: Discard.DiscardPairEnumerator;
  private passed: boolean;
  private discardPair: DiscardPair | null;
  constructor(
    controlIdentifier: string,
    playerIdentifier: string,
    hand: Hand.Hand,
    discardPlanner: Discard.DiscardPlanner,
    discardPairEnumerator: Discard.DiscardPairEnumerator
  ) {
    this.controlIdentifier = controlIdentifier;
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
