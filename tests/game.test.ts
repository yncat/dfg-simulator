import { mock } from "jest-mock-extended";
import * as AdditionalAction from "../src/additionalAction";
import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";
import * as Discard from "../src/discard";
import * as Game from "../src/game";
import * as Hand from "../src/hand";
import * as Player from "../src/player";
import * as Rank from "../src/rank";
import * as Event from "../src/event";
import * as Rule from "../src/rule";

/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint @typescript-eslint/no-empty-function: 0 */

function createGameInitParams(params: Partial<Game.GameInitParams>) {
  return {
    players: params.players === undefined ? [] : params.players,
    activePlayerIndex:
      params.activePlayerIndex === undefined ? 0 : params.activePlayerIndex,
    activePlayerActionCount:
      params.activePlayerActionCount === undefined
        ? 0
        : params.activePlayerActionCount,
    discardStack:
      params.discardStack === undefined
        ? Discard.createDiscardStack()
        : params.discardStack,
    lastDiscarderIdentifier:
      params.lastDiscarderIdentifier === undefined
        ? ""
        : params.lastDiscarderIdentifier,
    strengthInverted:
      params.strengthInverted === undefined ? false : params.strengthInverted,
    reversed: params.reversed === undefined ? false : params.reversed,
    agariPlayerIdentifiers:
      params.agariPlayerIdentifiers === undefined
        ? []
        : params.agariPlayerIdentifiers,
    penalizedPlayerIdentifiers:
      params.penalizedPlayerIdentifiers === undefined
        ? []
        : params.penalizedPlayerIdentifiers,
    eventReceiver:
      params.eventReceiver === undefined
        ? createMockEventReceiver()
        : params.eventReceiver,
    ruleConfig:
      params.ruleConfig === undefined
        ? Rule.createDefaultRuleConfig()
        : params.ruleConfig,
    removedCardsMap:
      params.removedCardsMap === undefined
        ? new Map<Card.CardMark, Map<Card.CardNumber, number>>()
        : params.removedCardsMap,
  };
}

function createGameFixture() {
  const p1 = Player.createPlayer("a");
  const p2 = Player.createPlayer("b");
  const p3 = Player.createPlayer("c");
  const params = createGameInitParams({
    players: [p1, p2, p3],
  });
  return Game.createGameForTest(params);
}

function createMockEventReceiver() {
  return mock<Event.EventReceiver>();
}

describe("createGame", () => {
  it("returns a new game instance and properly initializes related objects", () => {
    const er = createMockEventReceiver();
    const g = Game.createGame(
      ["a", "b", "c"],
      er,
      Rule.createDefaultRuleConfig()
    );
    expect(g).not.toBeNull();
    expect(er.onInitialInfoProvided).toHaveBeenCalled();
    expect(er.onInitialInfoProvided.mock.calls[0][0]).toBe(3); // player count
    expect(er.onInitialInfoProvided.mock.calls[0][1]).toBe(1); // deck count
    expect(er.onCardsProvided).toHaveBeenCalled();
    // cannot check player identifier since the order is randomized.
    expect(er.onCardsProvided.mock.calls[0][1]).toBe(18);
    expect(er.onCardsProvided.mock.calls[1][1]).toBe(18);
    expect(er.onCardsProvided.mock.calls[2][1]).toBe(18);
  });

  it("throws an error when player identifiers are not unique", () => {
    expect(() => {
      Game.createGame(
        ["a", "b", "b"],
        createMockEventReceiver(),
        Rule.createDefaultRuleConfig()
      );
    }).toThrow("one of the players' identifiers is duplicating");
  });
});

describe("Game.finishActivePlayerControl", () => {
  it("rejects invalid controllers", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(() => {
      g.finishActivePlayerControl(ctrl);
    }).toThrow("the given activePlayerControl is no longer valid");
  });

  it("rejects action when player's hand is empty", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
      discardStack: Discard.createDiscardStack(),
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    expect(() => {
      g.finishActivePlayerControl(ctrl);
    }).toThrow("this player's hand is empty; cannot perform any action");
  });

  it("updates related states and emits event when discarding", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(p1.hand.cards).toStrictEqual([c2]);
    const ndp = CardSelection.CreateCardSelectionPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("emits nagare event when everyone passed and the turn reaches the last discarder", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    let ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(r.onPass).toHaveBeenCalled();
    expect(r.onNagare).toHaveBeenCalled();
    expect(r.onStrengthInversion).not.toHaveBeenCalled();
  });

  it("reset JBack by nagare with everyone's pass", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    g["inJBack"] = true;
    let ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(r.onPass).toHaveBeenCalled();
    expect(r.onNagare).toHaveBeenCalled();
    expect(r.onStrengthInversion).toHaveBeenCalled();
  });

  it("emits agari event when player hand gets empty", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(r.onAgari).toHaveBeenCalled();
    expect(r.onPlayerRankChanged).toHaveBeenCalled();
    expect(r.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(r.onPlayerRankChanged.mock.calls[0][1]).toBe(
      Rank.RankType.UNDETERMINED
    );
    expect(r.onPlayerRankChanged.mock.calls[0][2]).toBe(Rank.RankType.DAIFUGO);
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(p1.hand.cards).toStrictEqual([]);
    const ndp = CardSelection.CreateCardSelectionPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("can process agari when the last discard is 5 skip", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const r = createMockEventReceiver();
    const rc = Rule.createDefaultRuleConfig();
    rc.skip = Rule.SkipConfig.SINGLE;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: r,
      ruleConfig: rc,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(r.onAgari).toHaveBeenCalled();
    expect(r.onPlayerRankChanged).toHaveBeenCalled();
    expect(r.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(r.onPlayerRankChanged.mock.calls[0][1]).toBe(
      Rank.RankType.UNDETERMINED
    );
    expect(r.onPlayerRankChanged.mock.calls[0][2]).toBe(Rank.RankType.DAIFUGO);
    expect(r.onSkip).toHaveBeenCalledWith("b");
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(p1.hand.cards).toStrictEqual([]);
    const ndp = CardSelection.CreateCardSelectionPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(2);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("can process agari when the last discard is 9 reverse", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const r = createMockEventReceiver();
    const rc = Rule.createDefaultRuleConfig();
    rc.reverse = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: r,
      ruleConfig: rc,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(r.onAgari).toHaveBeenCalled();
    expect(r.onPlayerRankChanged).toHaveBeenCalled();
    expect(r.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(r.onPlayerRankChanged.mock.calls[0][1]).toBe(
      Rank.RankType.UNDETERMINED
    );
    expect(r.onPlayerRankChanged.mock.calls[0][2]).toBe(Rank.RankType.DAIFUGO);
    expect(r.onReverse).toHaveBeenCalled();
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(p1.hand.cards).toStrictEqual([]);
    const ndp = CardSelection.CreateCardSelectionPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(2);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("emits forbidden agari event when player's agari pair is forbidden one", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.JOKER);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(r.onForbiddenAgari).toHaveBeenCalled();
    expect(r.onPlayerRankChanged).toHaveBeenCalled();
    expect(r.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(r.onPlayerRankChanged.mock.calls[0][1]).toBe(
      Rank.RankType.UNDETERMINED
    );
    expect(r.onPlayerRankChanged.mock.calls[0][2]).toBe(
      Rank.RankType.DAIHINMIN
    );
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(p1.hand.cards).toStrictEqual([]);
    const ndp = CardSelection.CreateCardSelectionPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIHINMIN);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([]);
    expect(g["penalizedPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("determines rank, and emits agari / end event when player gets agari and only 1 player remains", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(r.onAgari).toHaveBeenCalled();
    expect(r.onGameEnd).toHaveBeenCalled();
    expect(r.onPlayerRankChanged).toHaveBeenCalled();
    expect(r.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(r.onPlayerRankChanged.mock.calls[0][2]).toBe(Rank.RankType.DAIFUGO);
    expect(r.onPlayerRankChanged.mock.calls[1][0]).toBe("b");
    expect(r.onPlayerRankChanged.mock.calls[1][2]).toBe(
      Rank.RankType.DAIHINMIN
    );
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(p2.rank.getRankType()).toBe(Rank.RankType.DAIHINMIN);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([
      p1.identifier,
      p2.identifier,
    ]);
  });

  it("properly determine ranks when there's a forbidden agari player", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.JOKER, 0);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(r.onForbiddenAgari).toHaveBeenCalled();
    expect(r.onGameEnd).toHaveBeenCalled();
    expect(r.onPlayerRankChanged).toHaveBeenCalled();
    expect(r.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(r.onPlayerRankChanged.mock.calls[0][2]).toBe(
      Rank.RankType.DAIHINMIN
    );
    expect(r.onPlayerRankChanged.mock.calls[1][0]).toBe("b");
    expect(r.onPlayerRankChanged.mock.calls[1][2]).toBe(Rank.RankType.DAIFUGO);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIHINMIN);
    expect(p2.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([p2.identifier]);
    expect(g["penalizedPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("updates related states and emits events when passing", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(r.onPass).toHaveBeenCalled();
    expect(g["lastDiscarderIdentifier"]).toBe("");
    expect(p1.hand.cards).toStrictEqual([c1, c2]);
    const ndp = CardSelection.createNullCardSelectionPair();
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("passing returns remaining hand count", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2],
      eventReceiver: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(r.onPass).toHaveBeenCalledWith("a", 2);
  });

  it("goes back to the first player if all players finished action", () => {
    const c1 = Card.createCard(Card.CardMark.HEARTS, 2);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const params = createGameInitParams({
      players: [p1, p2, p3],
      activePlayerIndex: 2,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("skips rank determined player", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 7);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const params = createGameInitParams({
      players: [p1, p2, p3],
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(2);
  });

  it("skips rank determined player even if next turn starts", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    p1.rank.force(Rank.RankType.DAIFUGO);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const params = createGameInitParams({
      players: [p1, p2, p3],
      activePlayerIndex: 2,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("triggers Yagiri", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    // Needs another card to avoid forbidden agari.
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(1);
    expect(er.onYagiri).toHaveBeenCalled();
    expect(er.onStrengthInversion).not.toHaveBeenCalled();
    expect(er.onNagare).toHaveBeenCalled();
    const ctrl2 = g.startActivePlayerControl();
    expect(ctrl2.playerIdentifier).toBe("a");
  });

  it("triggers Yagiri for a kaidan including 8", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 10);
    // Needs another card for avoding forbidden agari
    const c4 = Card.createCard(Card.CardMark.DIAMONDS, 10);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3, c4);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(1);
    expect(er.onYagiri).toHaveBeenCalled();
    expect(er.onStrengthInversion).not.toHaveBeenCalled();
    expect(er.onNagare).toHaveBeenCalled();
    const ctrl2 = g.startActivePlayerControl();
    expect(ctrl2.playerIdentifier).toBe("a");
  });

  it("do not trigger Yagiri when disabled by ruleConfig", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(g["activePlayerActionCount"]).toBe(0);
    expect(er.onYagiri).not.toHaveBeenCalled();
    expect(er.onNagare).not.toHaveBeenCalled();
    const ctrl2 = g.startActivePlayerControl();
    expect(ctrl2.playerIdentifier).toBe("b");
  });

  it("do not trigger Yagiri when it will consume all cards in the hand (8s)", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(g["activePlayerActionCount"]).toBe(0);
    expect(er.onYagiri).not.toHaveBeenCalled();
    expect(er.onNagare).not.toHaveBeenCalled();
    const ctrl2 = g.startActivePlayerControl();
    expect(ctrl2.playerIdentifier).toBe("b");
  });

  it("do not trigger Yagiri when it will consume all cards in the hand (kaidan)", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c4 = Card.createCard(Card.CardMark.DIAMONDS, 10);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3, c4);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(g["activePlayerActionCount"]).toBe(0);
    expect(er.onYagiri).not.toHaveBeenCalled();
    expect(er.onNagare).not.toHaveBeenCalled();
    const ctrl2 = g.startActivePlayerControl();
    expect(ctrl2.playerIdentifier).toBe("b");
  });

  it("reset JBack by nagare with yagiri", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    // Needs another card for avoiding forbidden agari.
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    g["inJBack"] = true;
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(1);
    expect(er.onYagiri).toHaveBeenCalled();
    expect(er.onNagare).toHaveBeenCalled();
    expect(er.onStrengthInversion).toHaveBeenCalled();
  });

  it("triggers JBack", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 11);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.jBack = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeTruthy();
    expect(er.onJBack).toHaveBeenCalled();
    expect(er.onStrengthInversion).toHaveBeenCalled();
    expect(er.onStrengthInversion.mock.calls[0][0]).toBeTruthy();
  });

  it("triggers JBack for a kaidan including 11", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 11);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 12);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 13);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.jBack = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeTruthy();
    expect(er.onJBack).toHaveBeenCalled();
    expect(er.onStrengthInversion).toHaveBeenCalled();
    expect(er.onStrengthInversion.mock.calls[0][0]).toBeTruthy();
  });

  it("do not trigger JBack when yagiri is triggered", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 10);
    const c4 = Card.createCard(Card.CardMark.DIAMONDS, 11);
    // Needs another card for avoiding forbidden agari.
    const c5 = Card.createCard(Card.CardMark.DIAMONDS, 12);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3, c4, c5);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.jBack = true;
    r.yagiri = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(er.onYagiri).toHaveBeenCalled();
    expect(er.onJBack).not.toHaveBeenCalled();
    expect(er.onStrengthInversion).not.toHaveBeenCalled();
  });

  it("do not trigger JBack when disabled by ruleConfig", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 11);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeFalsy();
    expect(er.onJBack).not.toHaveBeenCalled();
    expect(er.onStrengthInversion).not.toHaveBeenCalled();
  });

  it("triggers Kakumei", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c1, c1, c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.kakumei = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeTruthy();
    expect(er.onKakumei).toHaveBeenCalled();
    expect(er.onStrengthInversion).toHaveBeenCalled();
    expect(er.onStrengthInversion.mock.calls[0][0]).toBeTruthy();
  });

  it("do not trigger Kakumei when disabled by ruleConfig", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c1, c1, c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeFalsy();
    expect(er.onKakumei).not.toHaveBeenCalled();
    expect(er.onStrengthInversion).not.toHaveBeenCalled();
  });

  it("triggers jBack and kakumei at the same time", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 10);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 11);
    const c4 = Card.createCard(Card.CardMark.DIAMONDS, 12);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3, c4);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.jBack = true;
    r.kakumei = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(er.onJBack).toHaveBeenCalled();
    expect(er.onKakumei).toHaveBeenCalled();
    expect(g["strengthInverted"]).toBeFalsy();
  });

  it("triggers nagare and let the discarder play one more time, after negating joker with 3 of spades", () => {
    const s3 = Card.createCard(Card.CardMark.SPADES, 3);
    const s4 = Card.createCard(Card.CardMark.SPADES, 4);
    // Needs another card for testing that the discarder gets another turn.
    const p1 = Player.createPlayer("a");
    p1.hand.give(s3, s4);
    const p2 = Player.createPlayer("b");
    p2.hand.give(s3);
    const p3 = Player.createPlayer("c");
    p3.hand.give(s3);
    const er = createMockEventReceiver();
    const ds = Discard.createDiscardStack();
    ds.push(
      CardSelection.CreateCardSelectionPairForTest(
        Card.createCard(Card.CardMark.JOKER, 0)
      )
    );
    const params = createGameInitParams({
      players: [p1, p2, p3],
      discardStack: ds,
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(er.onNagare).toHaveBeenCalled();
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(1);
  });

  it("triggers nagare and let the discarder play one more time, when playing the strongest kaidan (not inverted)", () => {
    const s12 = Card.createCard(Card.CardMark.SPADES, 12);
    const s13 = Card.createCard(Card.CardMark.SPADES, 13);
    const s1 = Card.createCard(Card.CardMark.SPADES, 1);
    const s2 = Card.createCard(Card.CardMark.SPADES, 2);
    // Needs another card for testing that the discarder gets another turn.
    const s3 = Card.createCard(Card.CardMark.SPADES, 3);
    const p1 = Player.createPlayer("a");
    p1.hand.give(s12, s13, s1, s2, s3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(s3);
    const p3 = Player.createPlayer("c");
    p3.hand.give(s3);
    const er = createMockEventReceiver();
    const ds = Discard.createDiscardStack();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      discardStack: ds,
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(er.onNagare).toHaveBeenCalled();
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(1);
  });

  it("triggers nagare and let the discarder play one more time, when playing the strongest kaidan (inverted)", () => {
    const s3 = Card.createCard(Card.CardMark.SPADES, 3);
    const s4 = Card.createCard(Card.CardMark.SPADES, 4);
    const s5 = Card.createCard(Card.CardMark.SPADES, 5);
    const s6 = Card.createCard(Card.CardMark.SPADES, 6);
    // Needs another card for testing that the discarder gets another turn.
    const s7 = Card.createCard(Card.CardMark.SPADES, 7);
    const p1 = Player.createPlayer("a");
    p1.hand.give(s3, s4, s5, s6, s7);
    const p2 = Player.createPlayer("b");
    p2.hand.give(s3);
    const p3 = Player.createPlayer("c");
    p3.hand.give(s3);
    const er = createMockEventReceiver();
    const ds = Discard.createDiscardStack();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      discardStack: ds,
      strengthInverted: true,
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(er.onNagare).toHaveBeenCalled();
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(1);
  });

  it("triggers nagare and pass the turn to the next player, after negating joker with 3 of spades and the discarder consumes all of his hand", () => {
    const s3 = Card.createCard(Card.CardMark.SPADES, 3);
    const p1 = Player.createPlayer("a");
    p1.hand.give(s3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(s3);
    const p3 = Player.createPlayer("c");
    p3.hand.give(s3);
    const er = createMockEventReceiver();
    const ds = Discard.createDiscardStack();
    ds.push(
      CardSelection.CreateCardSelectionPairForTest(
        Card.createCard(Card.CardMark.JOKER, 0)
      )
    );
    const params = createGameInitParams({
      players: [p1, p2, p3],
      discardStack: ds,
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(er.onNagare).toHaveBeenCalled();
    expect(g["activePlayerIndex"]).toBe(1);
    expect(g["activePlayerActionCount"]).toBe(0);
  });

  it("process turns in reversed order when reversed switch is on", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const params = createGameInitParams({
      players: [p1, p2, p3],
      activePlayerIndex: 1,
      reversed: true,
    });
    const g = Game.createGameForTest(params);
    let ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    ctrl = g.startActivePlayerControl();
    expect(ctrl.playerIdentifier).toBe("a");
  });

  it("can process reversed order when activePlayerIndex reaches boundary", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const params = createGameInitParams({
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      reversed: true,
    });
    const g = Game.createGameForTest(params);
    let ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    ctrl = g.startActivePlayerControl();
    expect(ctrl.playerIdentifier).toBe("c");
  });

  it("triggers 9 reverse", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.reverse = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(2);
    expect(g["activePlayerActionCount"]).toBe(0);
    expect(er.onReverse).toHaveBeenCalled();
  });

  it("does not trigger 9 reverse when disabled by rule config", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.reverse = false;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(er.onReverse).not.toHaveBeenCalled();
  });

  it("triggers 5 skip single", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.skip = Rule.SkipConfig.SINGLE;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(2);
    expect(g["activePlayerActionCount"]).toBe(0);
    expect(er.onSkip).toHaveBeenCalledWith("b");
  });

  it("triggers 5 skip multiple", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.skip = Rule.SkipConfig.MULTI;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(0);
    expect(er.onSkip).toHaveBeenCalledTimes(2);
    expect(er.onSkip.mock.calls[0][0]).toBe("b");
    expect(er.onSkip.mock.calls[1][0]).toBe("c");
  });

  it("triggers Transfer7", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.transfer7 = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    const aac = g.finishActivePlayerControl(ctrl);
    expect(aac.length).toBe(1);
    const action = aac[0];
    expect(action.isFinished()).toBeFalsy();
    expect(action.getType()).toBe("transfer7");
    const t7action = action.unwrap<AdditionalAction.Transfer7>(
      AdditionalAction.Transfer7
    );
    expect(t7action.enumerateCards()).toStrictEqual([c2, c3]);
    t7action.selectCard(0);
    g.finishAdditionalActionControl(action);
    expect(er.onTransfer).lastCalledWith(
      "a",
      "b",
      CardSelection.CreateCardSelectionPairForTest(c2)
    );
    expect(p1.hand.cards).toStrictEqual([c3]);
    expect(p2.hand.cards).toStrictEqual([c1, c2]);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("triggers Transfer7 for a kaidan including 7", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c4 = Card.createCard(Card.CardMark.DIAMONDS, 10);
    const c5 = Card.createCard(Card.CardMark.DIAMONDS, 11);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3, c4, c5);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.transfer7 = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    const aac = g.finishActivePlayerControl(ctrl);
    expect(aac.length).toBe(1);
    const action = aac[0];
    expect(action.isFinished()).toBeFalsy();
    expect(action.getType()).toBe("transfer7");
    const t7action = action.unwrap<AdditionalAction.Transfer7>(
      AdditionalAction.Transfer7
    );
    expect(t7action.enumerateCards()).toStrictEqual([c4, c5]);
    t7action.selectCard(0);
    g.finishAdditionalActionControl(action);
    expect(er.onTransfer).lastCalledWith(
      "a",
      "b",
      CardSelection.CreateCardSelectionPairForTest(c4)
    );
    expect(p1.hand.cards).toStrictEqual([c5]);
    expect(p2.hand.cards).toStrictEqual([c1, c4]);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("triggers Transfer7 and agari event when the player's hand gets empty", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.transfer7 = true;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    const aac = g.finishActivePlayerControl(ctrl);
    expect(aac.length).toBe(1);
    const action = aac[0];
    expect(action.isFinished()).toBeFalsy();
    expect(action.getType()).toBe("transfer7");
    const t7action = action.unwrap<AdditionalAction.Transfer7>(
      AdditionalAction.Transfer7
    );
    expect(t7action.enumerateCards()).toStrictEqual([c2]);
    t7action.selectCard(0);
    g.finishAdditionalActionControl(action);
    expect(er.onTransfer).lastCalledWith(
      "a",
      "b",
      CardSelection.CreateCardSelectionPairForTest(c2)
    );
    expect(er.onAgari).lastCalledWith("a");
    expect(p1.hand.cards).toStrictEqual([]);
    expect(p2.hand.cards).toStrictEqual([c1, c2]);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("do not trigger Transfer7 when disabled by rule config", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.transfer7 = false;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    const aac = g.finishActivePlayerControl(ctrl);
    expect(aac.length).toBe(0);
  });

  it("does not trigger 5 skip when disabled by rule config", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c2, c3);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.skip = Rule.SkipConfig.OFF;
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
      ruleConfig: r,
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    const dp = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(er.onSkip).not.toHaveBeenCalled();
  });
});

describe("gameImple.isEnded", () => {
  it("returns false when the game is not ended yet", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const params = createGameInitParams({
      players: [p1, p2, p3],
    });
    const g = Game.createGameForTest(params);
    expect(g.isEnded()).toBeFalsy();
  });

  it("returns true when game has ended", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
    });
    const g = Game.createGameForTest(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateCardSelectionPairs();
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g.isEnded()).toBeTruthy();
  });

  it("returns true when the game is ended by the last player got kicked", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const params = createGameInitParams({
      players: [p1, p2, p3],
      lastDiscarderIdentifier: "",
      agariPlayerIdentifiers: ["b", "a"],
    });
    const g = Game.createGameForTest(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g.isEnded()).toBeTruthy();
  });
});

describe("gameImple.outputResult", () => {
  it("creates result object from the current game state", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
      agariPlayerIdentifiers: [p1.identifier, p2.identifier],
    });
    const g = Game.createGameForTest(params);
    p1.rank.force(Rank.RankType.DAIFUGO);
    p2.rank.force(Rank.RankType.DAIHINMIN);
    const r = g.outputResult();
    expect(r.getRankByIdentifier(p1.identifier)).toBe(Rank.RankType.DAIFUGO);
    expect(r.getRankByIdentifier(p2.identifier)).toBe(Rank.RankType.DAIHINMIN);
  });
});

describe("gameImple.enumeratePlayerIdentifiers", () => {
  it("can enumerate all players identifiers", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const params = createGameInitParams({
      players: [p1, p2, p3],
    });
    const g = Game.createGameForTest(params);
    const ret = g.enumeratePlayerIdentifiers();
    expect(ret).toStrictEqual(["a", "b", "c"]);
  });

  it("does not include kicked player", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    p2.markAsKicked();
    const params = createGameInitParams({
      players: [p1, p2, p3],
    });
    const g = Game.createGameForTest(params);
    const ret = g.enumeratePlayerIdentifiers();
    expect(ret).toStrictEqual(["a", "c"]);
  });
});

describe("game.findPlayerByIdentifier", () => {
  it("returns player with the specified identifier", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
    });
    const g = Game.createGameForTest(params);
    expect(g.findPlayerByIdentifier("a")).toBe(p1);
  });

  it("throws an error when not found", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
    });
    const g = Game.createGameForTest(params);
    expect(() => {
      g.findPlayerByIdentifier("c");
    }).toThrow("player c is not found");
  });
});

describe("Game.kickPlayerByIdentifier", () => {
  it("throws an error when nonexistent player identifier is passed", () => {
    const p1 = Player.createPlayer("a");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
    });
    const g = Game.createGameForTest(params);
    expect(() => {
      g.kickPlayerByIdentifier("abcabc");
    }).toThrow("player to kick is not found");
  });

  it("saves cards of kicked player's hand to removedCardsMap", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
    });
    const g = Game.createGameForTest(params);
    g.kickPlayerByIdentifier("a");
    const mp = g["removedCardsMap"];
    const outer = mp.get(Card.CardMark.DIAMONDS) as Map<
      Card.CardNumber,
      number
    >;
    expect(outer).not.toBeUndefined();
    const inner4s = outer.get(4) as number;
    const inner5s = outer.get(5) as number;
    expect(inner4s).toBe(1);
    expect(inner5s).toBe(2);
  });

  it("when kicking a player who is not ranked yet and is not active in this turn", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    g.kickPlayerByIdentifier("b");
    expect(er.onPlayerKicked).toHaveBeenCalled();
    expect(g["players"]).toStrictEqual([p1, p2, p3]);
    expect(g["activePlayerIndex"]).toBe(0);
    expect(p2.isKicked()).toBeTruthy();
  });

  it("when kicking a player who is not ranked yet and is active in this turn", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    g.kickPlayerByIdentifier("a");
    expect(er.onPlayerKicked).toHaveBeenCalled();
    expect(g["players"]).toStrictEqual([p1, p2, p3]);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(p1.isKicked()).toBeTruthy();
  });

  it("when kicking a player who is not ranked yet and is active in this turn 01", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const params = createGameInitParams({
      players: [p1, p2, p3],
      activePlayerIndex: 1,
    });
    const g = Game.createGameForTest(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g["players"]).toStrictEqual([p1, p2, p3]);
    expect(g["activePlayerIndex"]).toBe(2);
  });

  it("when kicking a player who is not ranked yet and is active in this turn 02", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const params = createGameInitParams({
      players: [p1, p2, p3],
      activePlayerIndex: 2,
    });
    const g = Game.createGameForTest(params);
    const ret = g.kickPlayerByIdentifier("c");
    expect(g["players"]).toStrictEqual([p1, p2, p3]);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("recalculates already ranked players", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    // We need one more players because there's only one unranked player(c) after b's deletion and the game automatically ends.
    const p4 = Player.createPlayer("d");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p4.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3, p4],
      agariPlayerIdentifiers: ["b", "a"],
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g["agariPlayerIdentifiers"]).toStrictEqual(["a"]);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(er.onPlayerRankChanged).toHaveBeenCalled();
    expect(er.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(er.onPlayerRankChanged.mock.calls[0][1]).toBe(Rank.RankType.FUGO);
    expect(er.onPlayerRankChanged.mock.calls[0][2]).toBe(Rank.RankType.DAIFUGO);
  });

  it("recalculates already ranked players and ends the game if required", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const er = createMockEventReceiver();
    const onGameEnd = jest.spyOn(er, "onGameEnd").mockImplementation(() => {});
    const params = createGameInitParams({
      players: [p1, p2, p3],
      agariPlayerIdentifiers: ["b", "a"],
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g["agariPlayerIdentifiers"]).toStrictEqual(["a", "c"]);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(p3.rank.getRankType()).toBe(Rank.RankType.DAIHINMIN);
    expect(er.onGameEnd).toHaveBeenCalled();
    expect(er.onPlayerRankChanged).toHaveBeenCalled();
    expect(er.onPlayerRankChanged.mock.calls[0][0]).toBe("a");
    expect(er.onPlayerRankChanged.mock.calls[0][1]).toBe(Rank.RankType.FUGO);
    expect(er.onPlayerRankChanged.mock.calls[0][2]).toBe(Rank.RankType.DAIFUGO);
    expect(er.onPlayerRankChanged.mock.calls[1][0]).toBe("c");
    expect(er.onPlayerRankChanged.mock.calls[1][1]).toBe(
      Rank.RankType.UNDETERMINED
    );
    expect(er.onPlayerRankChanged.mock.calls[1][2]).toBe(
      Rank.RankType.DAIHINMIN
    );
  });

  it("triggers nagare callback if required", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const er = createMockEventReceiver();
    const params = createGameInitParams({
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      lastDiscarderIdentifier: "a",
      eventReceiver: er,
    });
    const g = Game.createGameForTest(params);
    const ret = g.kickPlayerByIdentifier("c");
    expect(er.onNagare).toHaveBeenCalled();
  });
});

describe("gameImple.outputDiscardStack", () => {
  it("creates a list of discard pairs and does not change when the original data is updated", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const ds = Discard.createDiscardStack();
    const d4 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const d5 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const dp1 = CardSelection.CreateCardSelectionPairForTest(d4, d4);
    const dp2 = CardSelection.CreateCardSelectionPairForTest(d5, d5);
    const dp3 = CardSelection.CreateCardSelectionPairForTest(joker, joker);
    ds.push(dp1);
    ds.push(dp2);
    const params = createGameInitParams({
      players: [p1, p2],
      discardStack: ds,
      agariPlayerIdentifiers: [p1.identifier, p2.identifier],
    });
    const g = Game.createGameForTest(params);
    const rds1 = g.outputDiscardStack();
    expect(rds1[0].cards).toStrictEqual([d4, d4]);
    expect(rds1[1].cards).toStrictEqual([d5, d5]);
  });
});

describe("gameImple.outputRemovedCards", () => {
  it("creates a list of removed card entries for reading", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const inner = new Map<Card.CardNumber, number>();
    inner.set(4, 1);
    inner.set(5, 2);
    const outer = new Map<Card.CardMark, Map<Card.CardNumber, number>>();
    outer.set(Card.CardMark.DIAMONDS, inner);
    const params = createGameInitParams({
      players: [p1, p2],
      removedCardsMap: outer,
    });
    const g = Game.createGameForTest(params);
    const es = g.outputRemovedCards();
    expect(es).toContainEqual(
      new Game.RemovedCardEntry(Card.CardMark.DIAMONDS, 4, 1)
    );
    expect(es).toContainEqual(
      new Game.RemovedCardEntry(Card.CardMark.DIAMONDS, 5, 2)
    );
  });
});

describe("gameImple.outputRuleConfig", () => {
  it("returns a copy of rule configuration", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
    });
    const g = Game.createGameForTest(params);
    const rc = g.outputRuleConfig();
    expect(rc).toStrictEqual(Rule.createDefaultRuleConfig());
  });

  it("does not allow changing rule configuration from the returned instance", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params = createGameInitParams({
      players: [p1, p2],
    });
    const g = Game.createGameForTest(params);
    const rc1 = g.outputRuleConfig();
    rc1.reverse = true;
    const d = Rule.createDefaultRuleConfig();
    const rc2 = g.outputRuleConfig();
    expect(rc2).toStrictEqual(d);
    expect(rc2).not.toStrictEqual(rc1);
  });
});

describe("ActivePlayerControlImple.enumerateHand", () => {
  it("can enumerate cards in hand", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c2 = Card.createCard(Card.CardMark.HEARTS, 6);
    const h = Hand.createHand();
    h.give(c1, c2);
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    expect(ctrl.enumerateHand()).toStrictEqual([c1, c2]);
  });
});

describe("ActivePlayerControlImple.countHand", () => {
  it("can count cards in hand", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c2 = Card.createCard(Card.CardMark.HEARTS, 6);
    const h = Hand.createHand();
    h.give(c1, c2);
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    expect(ctrl.countHand()).toBe(2);
  });
});

describe("ActivePlayerControlImple.checkCardSelectability", () => {
  it("returns SELECTABLE when DiscardPlanner returned SELECTABLE", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const checkSelectability = jest
      .spyOn(dp, "checkSelectability")
      .mockImplementation((index) => {
        return CardSelection.SelectabilityCheckResult.SELECTABLE;
      });
    const ret = ctrl.checkCardSelectability(0);
    expect(checkSelectability).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.SelectabilityCheckResult.SELECTABLE);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_SELECTED", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const checkSelectability = jest
      .spyOn(dp, "checkSelectability")
      .mockImplementation((index) => {
        return CardSelection.SelectabilityCheckResult.ALREADY_SELECTED;
      });
    const ret = ctrl.checkCardSelectability(0);
    expect(checkSelectability).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.SelectabilityCheckResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when DiscardPlanner returned NOT_SELECTABLE", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const checkSelectability = jest
      .spyOn(dp, "checkSelectability")
      .mockImplementation((index) => {
        return CardSelection.SelectabilityCheckResult.NOT_SELECTABLE;
      });
    const ret = ctrl.checkCardSelectability(0);
    expect(checkSelectability).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.SelectabilityCheckResult.NOT_SELECTABLE);
  });
});

describe("ActivePlayerControl.isCardSelected", () => {
  it("returns what DiscardPlanner.isSelected returned", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const isSelected = jest
      .spyOn(dp, "isSelected")
      .mockImplementation((index) => {
        return true;
      });
    const ret = ctrl.isCardSelected(0);
    expect(isSelected).toHaveBeenCalled();
    expect(ret).toBeTruthy();
  });
});

describe("ActivePlayerControlImple.selectCard", () => {
  it("returns SUCCESS when DiscardPlanner returned SUCCESS", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const select = jest.spyOn(dp, "select").mockImplementation((index) => {
      return CardSelection.CardSelectResult.SUCCESS;
    });
    const ret = ctrl.selectCard(0);
    expect(select).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.CardSelectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_SELECTED", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const select = jest.spyOn(dp, "select").mockImplementation((index) => {
      return CardSelection.CardSelectResult.ALREADY_SELECTED;
    });
    const ret = ctrl.selectCard(0);
    expect(select).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.CardSelectResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when DiscardPlanner returned NOT_SELECTABLE", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const select = jest.spyOn(dp, "select").mockImplementation((index) => {
      return CardSelection.CardSelectResult.NOT_SELECTABLE;
    });
    const ret = ctrl.selectCard(0);
    expect(select).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.CardSelectResult.NOT_SELECTABLE);
  });
});

describe("ActivePlayerControlImple.deselectCard", () => {
  it("returns SUCCESS when DiscardPlanner returned SUCCESS", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const deselect = jest.spyOn(dp, "deselect").mockImplementation((index) => {
      return CardSelection.CardDeselectResult.SUCCESS;
    });
    const ret = ctrl.deselectCard(0);
    expect(deselect).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.CardDeselectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_DESELECTED", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const deselect = jest.spyOn(dp, "deselect").mockImplementation((index) => {
      return CardSelection.CardDeselectResult.ALREADY_DESELECTED;
    });
    const ret = ctrl.deselectCard(0);
    expect(deselect).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.CardDeselectResult.ALREADY_DESELECTED);
  });

  it("returns NOT_DESELECTABLE when DiscardPlanner returned NOT_DESELECTABLE", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const deselect = jest.spyOn(dp, "deselect").mockImplementation((index) => {
      return CardSelection.CardDeselectResult.NOT_DESELECTABLE;
    });
    const ret = ctrl.deselectCard(0);
    expect(deselect).toHaveBeenCalled();
    expect(ret).toBe(CardSelection.CardDeselectResult.NOT_DESELECTABLE);
  });
});

describe("ActivePlayerControlImple.countSelectedCards", () => {
  it("returns what discardPlanner returned", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const countSelectedCards = jest
      .spyOn(dp, "countSelectedCards")
      .mockImplementation(() => {
        return 1;
      });
    const ret = ctrl.countSelectedCards();
    expect(countSelectedCards).toHaveBeenCalled();
    expect(ret).toBe(1);
  });
});

describe("ActivePlayerControlImple.enumerateCardSelectionPairs", () => {
  it("returns what DiscardPairEnumerator returned", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const c = Card.createCard(Card.CardMark.SPADES, 3);
    const want = [CardSelection.CreateCardSelectionPairForTest(c, c)];
    const enumerate = jest.spyOn(dpe, "enumerate").mockImplementation(() => {
      return want;
    });
    const ret = ctrl.enumerateCardSelectionPairs();
    expect(enumerate).toHaveBeenCalled();
    expect(ret).toStrictEqual(want);
  });
});

describe("ActivePlayerControlImple.pass and ActivePlayerControl.hasPassed", () => {
  it("can set passed flag", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    expect(ctrl.hasPassed()).toBeFalsy();
    ctrl.pass();
    expect(ctrl.hasPassed()).toBeTruthy();
  });
});

describe("ActivePlayerControl.discard and ActivePlayerControl.getDiscard", () => {
  it("can set discard pair", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const enumerate = jest
      .spyOn(dpe, "enumerate")
      .mockImplementation((...args: Card.Card[]) => {
        return [CardSelection.CreateCardSelectionPairForTest(c1, c1)];
      });
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const dsc = CardSelection.CreateCardSelectionPairForTest(c1, c1);
    const ret = ctrl.discard(dsc);
    expect(ret).toBe(Game.DiscardResult.SUCCESS);
    expect(ctrl.getDiscard()).toStrictEqual(dsc);
  });

  it("cannot set discard when the specified discard pair does not exist on available ones", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const enumerate = jest
      .spyOn(dpe, "enumerate")
      .mockImplementation((...args: Card.Card[]) => {
        return [CardSelection.CreateCardSelectionPairForTest(c1, c1)];
      });
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const dsc = CardSelection.CreateCardSelectionPairForTest(c2, c2);
    const ret = ctrl.discard(dsc);
    expect(ret).toBe(Game.DiscardResult.NOT_FOUND);
  });
});

describe("removedCardEntry", () => {
  it("can be generated as readonly value object", () => {
    const e = new Game.RemovedCardEntry(Card.CardMark.CLUBS, 9, 3);
    expect(e.mark).toBe(Card.CardMark.CLUBS);
    expect(e.cardNumber).toBe(9);
    expect(e.count).toBe(3);
  });
});

describe("AdditionalActionControl", () => {
  describe("isFinished", () => {
    it("Returns false when action is not finished", () => {
      const a = new Game.AdditionalActionControl(
        "transfer7",
        new AdditionalAction.Transfer7("a", [])
      );
      expect(a.isFinished()).toBeFalsy();
    });

    it("Returns true when action is finished", () => {
      const a = new Game.AdditionalActionControl(
        "transfer7",
        new AdditionalAction.Transfer7("a", [])
      );
      a["finished"] = true;
      expect(a.isFinished()).toBeTruthy();
    });
  });

  describe("getType", () => {
    it("returns additional action type", () => {
      const a = new Game.AdditionalActionControl(
        "transfer7",
        new AdditionalAction.Transfer7("a", [])
      );
      expect(a.getType()).toBe("transfer7");
    });

    describe("unwrap", () => {
      it("returns unwrapped additional action type", () => {
        const obj = new AdditionalAction.Transfer7("a", []);
        const a = new Game.AdditionalActionControl("transfer7", obj);
        const unwrapped = a.unwrap<AdditionalAction.Transfer7>(
          AdditionalAction.Transfer7
        );
        expect(unwrapped).toBe<AdditionalAction.Transfer7>(obj);
      });

      it("throws an error when tried to unwrap with an invalid type", () => {
        const obj = new AdditionalAction.Transfer7("test", []);
        const a = new Game.AdditionalActionControl("transfer7", obj);
        expect(() => {
          a.unwrap<AdditionalAction.Exile10>(AdditionalAction.Exile10);
        }).toThrow(
          "tried to unwrap additional action with an incorrect type argument"
        );
      });
    });
  });
});
