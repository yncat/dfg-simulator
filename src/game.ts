/*
Game manager
*/
import * as AdditionalAction from "./additionalAction";
import * as CardSelection from "./cardSelection";
import * as Player from "./player";
import * as Hand from "./hand";
import * as Card from "./card";
import * as Rank from "./rank";
import * as Event from "./event";
import * as Rule from "./rule";
import * as Deck from "./deck";
import * as Discard from "./discard";
import * as Calculation from "./calculation";
import * as Legality from "./legality";
import * as Result from "./result";

export type PlayerRank = {
  identifier: string;
  rank: Rank.RankType;
};

export class GameError extends Error {}
export class GameCreationError extends Error {}

export interface Game {
  startActivePlayerControl: () => ActivePlayerControl;
  finishActivePlayerControl: (
    activePlayerControl: ActivePlayerControl
  ) => AdditionalActionControl[];
  finishAdditionalActionControl: (
    additionalActionControl: AdditionalActionControl
  ) => void;
  enumeratePlayerIdentifiers: () => string[];
  isEnded: () => boolean;
  findPlayerByIdentifier: (identifier: string) => Player.Player;
  kickPlayerByIdentifier(identifier: string): void;
  outputResult: () => Result.Result;
  outputDiscardStack: () => Array<CardSelection.CardSelectionPair>;
  outputRemovedCards: () => RemovedCardEntry[];
  outputRuleConfig: () => Rule.RuleConfig;
}

type RemovedCardsMap = Map<Card.CardMark, Map<Card.CardNumber, number>>;

export type GameInitParams = {
  players: Player.Player[];
  activePlayerIndex: number;
  activePlayerActionCount: number;
  discardStack: Discard.DiscardStack;
  lastDiscarderIdentifier: string;
  strengthInverted: boolean;
  reversed: boolean;
  agariPlayerIdentifiers: string[];
  penalizedPlayerIdentifiers: string[];
  eventReceiver: Event.EventReceiver;
  ruleConfig: Rule.RuleConfig;
  removedCardsMap: RemovedCardsMap;
};

export function createGameCustom(gameInitParams: GameInitParams): Game {
  return new GameImple(gameInitParams);
}

export function createGameForTest(gameInitParams: GameInitParams): GameImple {
  return new GameImple(gameInitParams);
}

export function createGame(
  playerIdentifiers: string[],
  eventReceiver: Event.EventReceiver,
  ruleConfig: Rule.RuleConfig
): Game {
  const players = playerIdentifiers.map((v) => {
    return Player.createPlayer(v);
  });
  if (!identifiersValid(players)) {
    throw new GameCreationError(
      "one of the players' identifiers is duplicating"
    );
  }

  const shuffledPlayers = shufflePlayers(players);
  const decks = prepareDecks(players.length);
  distributeCards(shuffledPlayers, decks);

  const removedCardsMap = new Map<
    Card.CardMark,
    Map<Card.CardNumber, number>
  >();

  const params = {
    players: shuffledPlayers,
    activePlayerIndex: 0,
    activePlayerActionCount: 0,
    discardStack: Discard.createDiscardStack(),
    lastDiscarderIdentifier: "",
    strengthInverted: false,
    reversed: false,
    agariPlayerIdentifiers: [],
    penalizedPlayerIdentifiers: [],
    eventReceiver: eventReceiver,
    ruleConfig: ruleConfig,
    removedCardsMap: removedCardsMap,
  };

  const g = new GameImple(params);
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

function shufflePlayers(players: Player.Player[]): Player.Player[] {
  const out = Array.from(players);
  for (let i = out.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[r];
    out[r] = tmp;
  }
  return out;
}

function prepareDecks(playerCount: number): Deck.Deck[] {
  const deckCount = Calculation.calcRequiredDeckCount(playerCount);
  const decks: Deck.Deck[] = [];
  for (let i = 0; i < deckCount; i++) {
    const d = Deck.createDeck();
    d.shuffle();
    decks.push(d);
  }
  return decks;
}

function distributeCards(players: Player.Player[], decks: Deck.Deck[]) {
  while (decks.length > 0) {
    for (let i = 0; i < players.length; i++) {
      let c = decks[0].draw();
      if (c === null) {
        decks.shift();
        if (decks.length == 0) {
          break;
        }
        c = decks[0].draw();
        if (c === null) {
          throw new GameCreationError(
            "deck is unexpectedly empty, maybe corrupted?"
          );
        }
      }
      players[i].hand.give(c);
    }
  }
  for (let i = 0; i < players.length; i++) {
    players[i].hand.sort();
  }
}

class GameImple implements Game {
  private players: Player.Player[];
  private turnCount: number;
  private activePlayerIndex: number;
  private activePlayerActionCount: number;
  private discardStack: Discard.DiscardStack;
  private lastDiscarderIdentifier: string;
  private readonly removedCardsMap: RemovedCardsMap;
  private strengthInverted: boolean;
  private reversed: boolean;
  private agariPlayerIdentifiers: string[];
  private penalizedPlayerIdentifiers: string[];
  private gameEnded: boolean; // cach the game finish state for internal use
  private eventReceiver: Event.EventReceiver;
  private ruleConfig: Rule.RuleConfig;
  private inJBack: boolean;
  private lastAdditionalActions: AdditionalActionControl[];
  constructor(params: GameInitParams) {
    // The constructor trusts all parameters and doesn't perform any checks. This allows simulating in-progress games or a certain predefined situations. Callers must make sure that the parameters are valid or are what they want to simulate.
    this.players = params.players;
    this.turnCount = 1;
    this.activePlayerIndex = params.activePlayerIndex;
    this.activePlayerActionCount = params.activePlayerActionCount;
    this.discardStack = params.discardStack;
    this.lastDiscarderIdentifier = params.lastDiscarderIdentifier;
    this.strengthInverted = params.strengthInverted;
    this.reversed = params.reversed;
    this.agariPlayerIdentifiers = params.agariPlayerIdentifiers;
    this.penalizedPlayerIdentifiers = params.penalizedPlayerIdentifiers;
    this.eventReceiver = params.eventReceiver;
    this.ruleConfig = params.ruleConfig;
    this.removedCardsMap = params.removedCardsMap;
    this.gameEnded = false;
    this.inJBack = false;
    this.lastAdditionalActions = [];
    this.makeStartInfo();
  }

  public startActivePlayerControl(): ActivePlayerControl {
    const dp = new Discard.DiscardPlanner(
      this.players[this.activePlayerIndex].hand,
      this.discardStack,
      this.strengthInverted
    );
    const dpe = new Discard.DiscardPairEnumerator(
      this.discardStack,
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
  ): AdditionalActionControl[] {
    if (activePlayerControl.controlIdentifier != this.calcControlIdentifier()) {
      throw new GameError("the given activePlayerControl is no longer valid");
    }
    if (activePlayerControl.enumerateHand().length == 0) {
      throw new GameError(
        "this player's hand is empty; cannot perform any action"
      );
    }

    this.processDiscardOrPass(activePlayerControl);

    this.processPlayerHandUpdate(activePlayerControl);
    this.processAgariCheck(activePlayerControl);

    const prevActionCount = this.activePlayerActionCount;

    const yagiriTriggered = this.processYagiri(activePlayerControl);
    if (!yagiriTriggered) {
      this.processJBack(activePlayerControl);
    }
    this.processKakumei(activePlayerControl);
    this.processReverse(activePlayerControl);
    this.processSkip(activePlayerControl);
    // additional actions
    let aacs: AdditionalActionControl[] = [];
    aacs = aacs.concat(this.processTransfer7(activePlayerControl));
    aacs = aacs.concat(this.processExile10(activePlayerControl));

    this.processInevitableNagare(activePlayerControl);
    this.processGameEndCheck();
    // When we need another turn for this player, we should have incremented activePlayerActionCount.
    // Also, when additional actions exist, we should not increment activePlayerActionCount.
    if (this.activePlayerActionCount === prevActionCount && aacs.length === 0) {
      this.processTurnAdvancement();
    }

    return aacs;
  }

  public finishAdditionalActionControl(
    additionalActionControl: AdditionalActionControl
  ): void {
    switch (additionalActionControl.getType()) {
      case "transfer7":
        this.processTransfer7action(additionalActionControl);
        break;
      case "exile10":
        this.processExile10action(additionalActionControl);
        break;
      default:
        throw new GameError("not implemented");
    }
    additionalActionControl.finish();

    // process turn advancement when all additional actions are finished.
    const unfinished = this.lastAdditionalActions.filter(
      (aac) => !aac.isFinished()
    );
    if (unfinished.length == 0) {
      this.processTurnAdvancement();
    }
  }

  private processTransfer7action(
    additionalActionControl: AdditionalActionControl
  ): void {
    const action = additionalActionControl.unwrap<AdditionalAction.Transfer7>(
      AdditionalAction.Transfer7
    );
    const csp = action.createCardSelectionPair();
    const card = csp.cards[0];
    const player = this.players[this.activePlayerIndex];
    const nextPlayer = this.players[this.getNextPlayerIndex()];
    player.hand.take(card);
    nextPlayer.hand.give(card);
    this.eventReceiver.onTransfer(
      player.identifier,
      nextPlayer.identifier,
      csp
    );
    if (player.hand.count() === 0) {
      this.processLegalAgari(player.identifier);
    }
  }

  private processExile10action(
    additionalActionControl: AdditionalActionControl
  ): void {
    const action = additionalActionControl.unwrap<AdditionalAction.Exile10>(
      AdditionalAction.Exile10
    );
    const csp = action.createCardSelectionPair();
    const card = csp.cards[0];
    const player = this.players[this.activePlayerIndex];
    player.hand.take(card);
    this.updateRemovedCards([card]);
    this.eventReceiver.onExile(player.identifier, csp);
    if (player.hand.count() === 0) {
      this.processLegalAgari(player.identifier);
    }
  }

  private getNextPlayerIndex(): number {
    let idx = this.activePlayerIndex;
    while (true) {
      // Must use this.players.length since we have to check for kicked players in some cases.
      idx = this.reversed ? idx - 1 : idx + 1;
      if (idx == this.players.length) {
        idx = 0;
      }
      if (idx === -1) {
        idx = this.players.length - 1;
      }
      if (this.players[idx].isKicked()) {
        continue;
      }
      if (
        this.players[this.activePlayerIndex].rank.getRankType() ==
        Rank.RankType.UNDETERMINED
      ) {
        break;
      }
    }
    return idx;
  }

  public enumeratePlayerIdentifiers(): string[] {
    const notKickedPlayers = this.enumerateNotKickedPlayers();
    return notKickedPlayers.map((v) => {
      return v.identifier;
    });
  }

  public isEnded(): boolean {
    return this.gameEnded;
  }

  public outputResult(): Result.Result {
    return Result.createResult(this.enumerateNotKickedPlayers());
  }

  public findPlayerByIdentifier(identifier: string): Player.Player {
    const p = this.findPlayerOrNull(identifier);
    if (p === null) {
      throw new GameError("player " + identifier + " is not found");
    }
    return p;
  }

  public kickPlayerByIdentifier(identifier: string): void {
    const p = this.findPlayerOrNull(identifier);
    if (p === null) {
      throw new GameError("player to kick is not found");
    }

    this.eventReceiver.onPlayerKicked(p.identifier);
    this.updateRemovedCards(p.hand.cards);
    const wasActive = p === this.players[this.activePlayerIndex];
    p.markAsKicked();
    this.agariPlayerIdentifiers = this.agariPlayerIdentifiers.filter((v) => {
      return v != identifier;
    });

    this.recalcAlreadyRankedPlayers();
    this.processGameEndCheck();
    if (wasActive) {
      this.processTurnAdvancement();
    }
  }

  public outputDiscardStack(): Array<CardSelection.CardSelectionPair> {
    // Copy from the current discard stack. Does not need to copy CardSelectionPair because they're all immutable.
    return this.discardStack.cardSelectionPairs.map((v) => {
      return v;
    });
  }

  public outputRemovedCards(): RemovedCardEntry[] {
    const ret: RemovedCardEntry[] = [];
    this.removedCardsMap.forEach((inner, mark) => {
      inner.forEach((count, cn) => {
        ret.push(new RemovedCardEntry(mark, cn, count));
      });
    });
    return ret;
  }

  public outputRuleConfig(): Rule.RuleConfig {
    return { ...this.ruleConfig };
  }

  private enumerateNotKickedPlayers() {
    return this.players.filter((v) => {
      return !v.isKicked();
    });
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

  private recalcAlreadyRankedPlayers() {
    const count = this.countNotKickedPlayers();
    for (let i = 0; i < this.agariPlayerIdentifiers.length; i++) {
      const p = this.findPlayer(this.agariPlayerIdentifiers[i]);
      const ret = p.rank.determine(count, i + 1);
      if (ret.changed) {
        this.eventReceiver.onPlayerRankChanged(
          p.identifier,
          ret.before,
          ret.after
        );
      }
    }
  }

  private countNotKickedPlayers(): number {
    return this.players.filter((v) => {
      return !v.isKicked();
    }).length;
  }

  private makeStartInfo() {
    const count = this.countNotKickedPlayers();
    this.eventReceiver.onInitialInfoProvided(
      count,
      Calculation.calcRequiredDeckCount(count)
    );
    for (let i = 0; i < count; i++) {
      this.eventReceiver.onCardsProvided(
        this.players[i].identifier,
        this.players[i].hand.count()
      );
    }
  }

  private enumerateHandCounts() {
    return this.players.map((v) => {
      return v.hand.count();
    });
  }

  private processDiscardOrPass(activePlayerControl: ActivePlayerControl) {
    if (activePlayerControl.hasPassed()) {
      this.eventReceiver.onPass(
        activePlayerControl.playerIdentifier,
        activePlayerControl.countHand()
      );
      return;
    }
    // We won't check the validity of the given discard pair here. It should be done in discardPlanner and CardSelectionPairEnumerator.
    const dp = activePlayerControl.getDiscard();
    this.discardStack.push(dp);
    this.lastDiscarderIdentifier = this.players[
      this.activePlayerIndex
    ].identifier;
    // We haven't taken the discard from hand.
    this.eventReceiver.onDiscard(
      this.lastDiscarderIdentifier,
      this.discardStack.last(),
      activePlayerControl.countHand() - dp.count()
    );
  }

  private processPlayerHandUpdate(activePlayerControl: ActivePlayerControl) {
    if (activePlayerControl.hasPassed()) {
      return;
    }
    this.findPlayerByIdentifier(activePlayerControl.playerIdentifier).hand.take(
      ...activePlayerControl.getDiscard().cards
    );
  }

  private processJBack(activePlayerControl: ActivePlayerControl) {
    if (!this.ruleConfig.jBack) {
      return;
    }
    if (activePlayerControl.hasPassed()) {
      return;
    }

    const dp = activePlayerControl.getDiscard();
    if (dp.countWithCondition(null, 11) > 0) {
      this.invertStrength();
      this.eventReceiver.onJBack(activePlayerControl.playerIdentifier);
      this.inJBack = true;
      this.eventReceiver.onStrengthInversion(this.strengthInverted);
    }
  }

  private processKakumei(activePlayerControl: ActivePlayerControl) {
    if (!this.ruleConfig.kakumei) {
      return;
    }
    if (activePlayerControl.hasPassed()) {
      return;
    }

    const dp = activePlayerControl.getDiscard();
    if (dp.count() >= 4) {
      this.invertStrength();
      this.eventReceiver.onKakumei(activePlayerControl.playerIdentifier);
      this.eventReceiver.onStrengthInversion(this.strengthInverted);
    }
  }

  private invertStrength() {
    this.strengthInverted = !this.strengthInverted;
  }

  private processYagiri(activePlayerControl: ActivePlayerControl) {
    if (!this.ruleConfig.yagiri) {
      return false;
    }
    if (activePlayerControl.hasPassed()) {
      return false;
    }
    const dp = activePlayerControl.getDiscard();
    const count = dp.countWithCondition(null, 8);
    // If this is going to be a forbidden agari, do not trigger yagiri. Otherwise, the discarder will get another turn after the play, despite the next turn won't come and the game freezes.
    if (count > 0 && activePlayerControl.countHand() > 0) {
      this.eventReceiver.onYagiri(activePlayerControl.playerIdentifier);
      this.processNagare();
      this.activePlayerActionCount++;
      return true;
    }
    return false;
  }

  private processNagare() {
    this.eventReceiver.onNagare();
    this.processJBackReset();
    this.discardStack.clear();
  }

  private processInevitableNagare(activePlayerControl: ActivePlayerControl) {
    if (activePlayerControl.hasPassed()) {
      return;
    }
    // Under the following circumstances, nagare is inevitable. Having everyone pass manually for this is just going to be waste of time, so automatically trigger nagare.
    // 3 of spades which negated joker.
    // kaidan including the strongest card number.
    const ldp = this.discardStack.last();
    const sldp = this.discardStack.secondToLast();
    const hasNull = ldp.isNull() || sldp.isNull();
    let required = false;
    if (
      !hasNull &&
      sldp.isOnlyJoker() &&
      ldp.countWithCondition(Card.CardMark.SPADES, 3) === ldp.count()
    ) {
      required = true;
    }
    if (
      ldp.isKaidan() &&
      ldp.countWithCondition(
        null,
        Calculation.calcStrongestCardNumber(this.strengthInverted)
      ) > 0
    ) {
      required = true;
    }

    if (required) {
      this.processNagare();
      if (activePlayerControl.countHand() > 0) {
        this.activePlayerActionCount++;
      }
    }

    return;
  }

  private processJBackReset() {
    if (this.inJBack) {
      this.inJBack = false;
      this.invertStrength();
      this.eventReceiver.onStrengthInversion(this.strengthInverted);
    }
  }

  private processReverse(activePlayerControl: ActivePlayerControl) {
    if (!this.ruleConfig.reverse) {
      return;
    }
    if (activePlayerControl.hasPassed()) {
      return;
    }
    const dp = activePlayerControl.getDiscard();
    const count = dp.countWithCondition(null, 9);
    if (count > 0) {
      this.reversed = !this.reversed;
      this.eventReceiver.onReverse();
    }
  }

  private processSkip(activePlayerControl: ActivePlayerControl) {
    if (this.ruleConfig.skip === Rule.SkipConfig.OFF) {
      return false;
    }
    if (activePlayerControl.hasPassed()) {
      return false;
    }
    const dp = activePlayerControl.getDiscard();
    const count = dp.countWithCondition(null, 5);
    if (count === 0) {
      return false;
    }
    const numSkip = this.ruleConfig.skip === Rule.SkipConfig.SINGLE ? 1 : count;
    for (let i = 0; i < numSkip; i++) {
      this.processTurnAdvancement();
      this.eventReceiver.onSkip(
        this.players[this.activePlayerIndex].identifier
      );
    }
    return true;
  }

  private processTransfer7(
    activePlayerControl: ActivePlayerControl
  ): AdditionalActionControl[] {
    if (!this.ruleConfig.transfer7) {
      return [];
    }
    if (activePlayerControl.hasPassed()) {
      return [];
    }
    const dp = activePlayerControl.getDiscard();
    const count = dp.countWithCondition(null, 7);
    if (count === 0) {
      return [];
    }

    if (activePlayerControl.countHand() === 0) {
      // no card to transfer
      return [];
    }

    const action = new AdditionalAction.Transfer7(
      activePlayerControl.playerIdentifier,
      activePlayerControl.enumerateHand()
    );
    const aac = new AdditionalActionControl("transfer7", action);
    return [aac];
  }

  private processExile10(
    activePlayerControl: ActivePlayerControl
  ): AdditionalActionControl[] {
    if (!this.ruleConfig.exile10) {
      return [];
    }
    if (activePlayerControl.hasPassed()) {
      return [];
    }
    const dp = activePlayerControl.getDiscard();
    const count = dp.countWithCondition(null, 10);
    if (count === 0) {
      return [];
    }

    if (activePlayerControl.countHand() === 0) {
      // no card to exile
      return [];
    }

    const action = new AdditionalAction.Exile10(
      activePlayerControl.playerIdentifier,
      activePlayerControl.enumerateHand()
    );
    const aac = new AdditionalActionControl("exile10", action);
    return [aac];
  }

  private processTurnAdvancement() {
    // Do nothing when the game is already ended. Without this, the runtime causes heap out of memory by infinitely pushing nagare events.
    if (this.gameEnded) {
      return;
    }

    while (true) {
      // Must use this.players.length since we have to check for kicked players in some cases.
      this.activePlayerIndex = this.reversed
        ? this.activePlayerIndex - 1
        : this.activePlayerIndex + 1;
      if (this.activePlayerIndex == this.players.length) {
        this.activePlayerIndex = 0;
        this.turnCount++;
      }
      if (this.activePlayerIndex === -1) {
        this.activePlayerIndex = this.players.length - 1;
        this.turnCount++;
      }
      if (
        this.players[this.activePlayerIndex].identifier ===
        this.lastDiscarderIdentifier
      ) {
        this.processNagare();
      }
      if (this.players[this.activePlayerIndex].isKicked()) {
        continue;
      }
      if (
        this.players[this.activePlayerIndex].rank.getRankType() ==
        Rank.RankType.UNDETERMINED
      ) {
        break;
      }
    }
  }

  private processAgariCheck(activePlayerControl: ActivePlayerControl) {
    if (activePlayerControl.countHand() == 0) {
      if (Legality.isForbiddenAgari(this.discardStack, this.strengthInverted)) {
        this.processForbiddenAgari(activePlayerControl);
        return;
      }
      this.processLegalAgari(activePlayerControl.playerIdentifier);
    }
  }

  private processLegalAgari(identifier: string) {
    // Originally it took activePlayerControl, but it now takes identifier. This is because this function is shared with processTransfer7Action, which no longer has activePlayerControl.
    this.eventReceiver.onAgari(identifier);
    this.agariPlayerIdentifiers.push(identifier);
    const count = this.countNotKickedPlayers();
    const pos = this.agariPlayerIdentifiers.length;
    const p = this.findPlayerByIdentifier(identifier);
    const ret = p.rank.determine(count, pos);
    this.eventReceiver.onPlayerRankChanged(identifier, ret.before, ret.after);
  }

  private processForbiddenAgari(activePlayerControl: ActivePlayerControl) {
    this.eventReceiver.onForbiddenAgari(activePlayerControl.playerIdentifier);
    const count = this.countNotKickedPlayers();
    const pos = count - this.penalizedPlayerIdentifiers.length;
    const p = this.findPlayerByIdentifier(activePlayerControl.playerIdentifier);
    const ret = p.rank.determine(count, pos);
    this.penalizedPlayerIdentifiers.push(activePlayerControl.playerIdentifier);
    this.eventReceiver.onPlayerRankChanged(
      activePlayerControl.playerIdentifier,
      ret.before,
      ret.after
    );
  }

  private processGameEndCheck() {
    const rm = this.players.filter((v) => {
      return (
        !v.isKicked() && v.rank.getRankType() == Rank.RankType.UNDETERMINED
      );
    });
    if (rm.length == 1) {
      const p = rm[0];
      const count = this.countNotKickedPlayers();
      const ret = p.rank.determine(
        count,
        count - this.penalizedPlayerIdentifiers.length
      );
      this.agariPlayerIdentifiers.push(p.identifier);
      this.eventReceiver.onPlayerRankChanged(
        p.identifier,
        ret.before,
        ret.after
      );
      this.eventReceiver.onGameEnd(this.outputResult());
      // Cache the game ended state. this.processTurnAdvancement checks this value and skips the entire processing to avoid infinite loop and the subsequent heap out of memory.
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

  private updateRemovedCards(cards: Card.Card[]) {
    cards.forEach((v) => {
      let e1 = this.removedCardsMap.get(v.mark);
      if (e1 === undefined) {
        const m = new Map<Card.CardNumber, number>();
        this.removedCardsMap.set(v.mark, m);
        e1 = m;
      }

      let e2 = e1.get(v.cardNumber);
      if (e2 === undefined) {
        e1.set(v.cardNumber, 0);
        e2 = 0;
      }
      e2++;

      e1.set(v.cardNumber, e2);
    });
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
  countHand: () => number;
  checkCardSelectability: (
    index: number
  ) => CardSelection.SelectabilityCheckResult;
  isCardSelected: (index: number) => boolean;
  selectCard: (index: number) => CardSelection.CardSelectResult;
  deselectCard: (index: number) => CardSelection.CardDeselectResult;
  countSelectedCards: () => number;
  enumerateCardSelectionPairs: () => CardSelection.CardSelectionPair[];
  pass: () => void;
  hasPassed: () => boolean;
  discard: (
    cardSelectionPair: CardSelection.CardSelectionPair
  ) => DiscardResult;
  getDiscard: () => CardSelection.CardSelectionPair;
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

export class ActivePlayerControlError extends Error {}

class ActivePlayerControlImple implements ActivePlayerControl {
  public readonly playerIdentifier: string;
  public readonly controlIdentifier: string;
  private readonly hand: Hand.Hand;
  private readonly discardPlanner: Discard.DiscardPlanner;
  private readonly discardPairEnumerator: Discard.DiscardPairEnumerator;
  private passed: boolean;
  private cardSelectionPair: CardSelection.CardSelectionPair | null;
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
    this.cardSelectionPair = null;
  }

  public enumerateHand(): Card.Card[] {
    return this.hand.cards;
  }

  public countHand(): number {
    return this.hand.cards.length;
  }

  public checkCardSelectability(
    index: number
  ): CardSelection.SelectabilityCheckResult {
    return this.discardPlanner.checkSelectability(index);
  }

  public isCardSelected(index: number): boolean {
    return this.discardPlanner.isSelected(index);
  }

  public selectCard(index: number): CardSelection.CardSelectResult {
    return this.discardPlanner.select(index);
  }

  public deselectCard(index: number): CardSelection.CardDeselectResult {
    return this.discardPlanner.deselect(index);
  }

  public countSelectedCards(): number {
    return this.discardPlanner.countSelectedCards();
  }

  public enumerateCardSelectionPairs(): CardSelection.CardSelectionPair[] {
    return this.discardPairEnumerator.enumerate(
      ...this.discardPlanner.enumerateSelectedCards()
    );
  }

  public pass(): void {
    this.passed = true;
    this.cardSelectionPair = null;
  }

  public hasPassed(): boolean {
    return this.passed;
  }

  public discard(dp: CardSelection.CardSelectionPair): DiscardResult {
    const matched = this.enumerateCardSelectionPairs().filter((v) => {
      return v.isSameCard(dp);
    });
    if (matched.length == 0) {
      return DiscardResult.NOT_FOUND;
    }

    this.cardSelectionPair = dp;
    this.passed = false;
    return DiscardResult.SUCCESS;
  }

  public getDiscard(): CardSelection.CardSelectionPair {
    if (this.cardSelectionPair === null) {
      if (this.hasPassed()) {
        throw new ActivePlayerControlError("cannot get discard when passed");
      } else {
        throw new ActivePlayerControlError(
          "tried to get discard, but it was empty"
        );
      }
    }
    return this.cardSelectionPair;
  }
}

export class RemovedCardEntry {
  readonly mark: Card.CardMark;
  readonly cardNumber: Card.CardNumber;
  readonly count: number;
  constructor(mark: Card.CardMark, cardNumber: Card.CardNumber, count: number) {
    this.mark = mark;
    this.cardNumber = cardNumber;
    this.count = count;
  }
}

export class AdditionalActionControl {
  private finished: boolean;
  private type: AdditionalAction.SupportedAdditionalActionTypes;
  private additionalAction: AdditionalAction.AdditionalAction;
  constructor(
    type: AdditionalAction.SupportedAdditionalActionTypes,
    additionalAction: AdditionalAction.AdditionalAction
  ) {
    this.finished = false;
    this.type = type;
    this.additionalAction = additionalAction;
  }

  public isFinished(): boolean {
    return this.finished;
  }

  public getType(): AdditionalAction.SupportedAdditionalActionTypes {
    return this.type;
  }

  public finish(): void {
    if (this.finished) {
      throw new GameError("additional action is already finished");
    }
    this.finished = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unwrap<T extends AdditionalAction.SupportedAdditionalActions>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeArg: new (...args: any) => T
  ): T {
    if (this.additionalAction instanceof typeArg != true) {
      throw new GameError(
        "tried to unwrap additional action with an incorrect type argument"
      );
    }
    return this.additionalAction as T;
  }
}
