import { mock } from "jest-mock-extended";
import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Game from "../src/game";
import * as Hand from "../src/hand";
import * as Player from "../src/player";
import * as Rank from "../src/rank";
import * as Event from "../src/event";
import * as Rule from "../src/rule";

/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint @typescript-eslint/no-empty-function: 0 */

function createGameFixture() {
  const p1 = Player.createPlayer("a");
  const p2 = Player.createPlayer("b");
  const p3 = Player.createPlayer("c");
  const params: Game.GameInitParams = {
    players: [p1, p2, p3],
    activePlayerIndex: 0,
    activePlayerActionCount: 0,
    discardStack: Discard.createDiscardStack(),
    lastDiscarderIdentifier: "",
    strengthInverted: false,
    agariPlayerIdentifiers: [],
    penalizedPlayerIdentifiers: [],
    eventReceiver: createMockEventReceiver(),
    ruleConfig: Rule.createDefaultRuleConfig(),
  };
  return new Game.GameImple(params);
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(() => {
      g.finishActivePlayerControl(ctrl);
    }).toThrow("the given activePlayerControl is no longer valid");
  });

  it("rejects action when player's hand is empty", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    expect(() => {
      g.finishActivePlayerControl(ctrl);
    }).toThrow("this player's hand is empty; cannot perform any action");
  });

  it("updates related states and emits event when discarding", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: r,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(r.onDiscard).toHaveBeenCalled();
    expect(p1.hand.cards).toStrictEqual([c2]);
    const ndp = Discard.CreateDiscardPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("emits nagare event when everyone passed and the turn reaches the last discarder", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const r = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: r,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    let ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const r = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: r,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    g["inJBack"] = true;
    let ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const r = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: r,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
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
    const ndp = Discard.CreateDiscardPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("emits forbidden agari event when player's agari pair is forbidden one", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.CardMark.JOKER);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const r = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: r,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
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
    const ndp = Discard.CreateDiscardPairForTest(c1);
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIHINMIN);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([]);
    expect(g["penalizedPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("determines rank, and emits agari / end event when player gets agari and only 1 player remains", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: r,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
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

  it("updates related states and emits events when passing", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const r = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: r,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(r.onPass).toHaveBeenCalled();
    expect(g["lastDiscarderIdentifier"]).toBe("");
    expect(p1.hand.cards).toStrictEqual([c1, c2]);
    const ndp = Discard.createNullDiscardPair();
    expect(g["discardStack"].last()).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("goes back to the first player if all players finished action", () => {
    const c1 = new Card.Card(Card.CardMark.HEARTS, 2);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("skips rank determined player", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 7);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(2);
  });

  it("skips rank determined player even if next turn starts", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 6);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    p1.rank.force(Rank.RankType.DAIFUGO);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("triggers Yagiri", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 8);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: r,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateDiscardPairs();
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 8);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: r,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateDiscardPairs();
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 8);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: r,
    };
    const g = new Game.GameImple(params);
    g["inJBack"] = true;
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateDiscardPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
    expect(g["activePlayerActionCount"]).toBe(1);
    expect(er.onYagiri).toHaveBeenCalled();
    expect(er.onNagare).toHaveBeenCalled();
    expect(er.onStrengthInversion).toHaveBeenCalled();
  });

  it("triggers JBack", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 11);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.jBack = true;
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: r,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateDiscardPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeTruthy();
    expect(er.onJBack).toHaveBeenCalled();
    expect(er.onStrengthInversion).toHaveBeenCalled();
    expect(er.onStrengthInversion.mock.calls[0][0]).toBeTruthy();
  });

  it("do not triggers JBack when disabled by ruleConfig", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 11);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: r,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dp = ctrl.enumerateDiscardPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeFalsy();
    expect(er.onJBack).not.toHaveBeenCalled();
    expect(er.onStrengthInversion).not.toHaveBeenCalled();
  });

  it("triggers Kakumei", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c1, c1, c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    r.kakumei = true;
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: r,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateDiscardPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeTruthy();
    expect(er.onKakumei).toHaveBeenCalled();
    expect(er.onStrengthInversion).toHaveBeenCalled();
    expect(er.onStrengthInversion.mock.calls[0][0]).toBeTruthy();
  });

  it("do not trigger Kakumei when disabled by ruleConfig", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const p1 = Player.createPlayer("a");
    p1.hand.give(c1, c1, c1, c1);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1);
    const p3 = Player.createPlayer("c");
    p3.hand.give(c1);
    const er = createMockEventReceiver();
    const r = Rule.createDefaultRuleConfig();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: r,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    ctrl.selectCard(1);
    ctrl.selectCard(2);
    ctrl.selectCard(3);
    const dp = ctrl.enumerateDiscardPairs();
    ctrl.discard(dp[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["strengthInverted"]).toBeFalsy();
    expect(er.onKakumei).not.toHaveBeenCalled();
    expect(er.onStrengthInversion).not.toHaveBeenCalled();
  });
});

describe("gameImple.isEnded", () => {
  it("returns false when the game is not ended yet", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    expect(g.isEnded()).toBeFalsy();
  });

  it("returns true when game has ended", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g.isEnded()).toBeTruthy();
  });

  it("returns true when the game is ended by the last player got kicked", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: ["b", "a"],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g.isEnded()).toBeTruthy();
  });
});

describe("gameImple.enumeratePlayerRanks", () => {
  it("can enumerate all players current ranks", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    p1.rank.force(Rank.RankType.DAIFUGO);
    p2.rank.force(Rank.RankType.HEIMIN);
    p3.rank.force(Rank.RankType.DAIHINMIN);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ret = g.enumeratePlayerRanks();
    expect(ret[0]).toStrictEqual({
      identifier: "a",
      rank: Rank.RankType.DAIFUGO,
    });
    expect(ret[1]).toStrictEqual({
      identifier: "b",
      rank: Rank.RankType.HEIMIN,
    });
    expect(ret[2]).toStrictEqual({
      identifier: "c",
      rank: Rank.RankType.DAIHINMIN,
    });
  });
});

describe("Game.kickPlayerByIdentifier", () => {
  it("throws an error when nonexistent player identifier is passed", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    expect(() => {
      g.kickPlayerByIdentifier("abcabc");
    }).toThrow("player to kick is not found");
  });

  it("when kicking a player who is not ranked yet and is not active in this turn", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const er = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    g.kickPlayerByIdentifier("b");
    expect(er.onPlayerKicked).toHaveBeenCalled();
    expect(g["players"]).toStrictEqual([p1, p3]);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("when kicking a player who is not ranked yet and is active in this turn", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const er = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    g.kickPlayerByIdentifier("a");
    expect(er.onPlayerKicked).toHaveBeenCalled();
    expect(g["players"]).toStrictEqual([p2, p3]);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("when kicking a player who is not ranked yet and is not active in this turn 01", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 1,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g["players"]).toStrictEqual([p1, p3]);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("when kicking a player who is not ranked yet and is not active in this turn 02", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: createMockEventReceiver(),
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ret = g.kickPlayerByIdentifier("c");
    expect(g["players"]).toStrictEqual([p1, p2]);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("recalculates already ranked players", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    // We need one more players because there's only one unranked player(c) after b's deletion and the game automatically ends.
    const p4 = Player.createPlayer("d");
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p4.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const er = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3, p4],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: ["b", "a"],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const er = createMockEventReceiver();
    const onGameEnd = jest.spyOn(er, "onGameEnd").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: ["b", "a"],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const er = createMockEventReceiver();
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      activePlayerActionCount: 0,
      discardStack: Discard.createDiscardStack(),
      lastDiscarderIdentifier: "a",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      penalizedPlayerIdentifiers: [],
      eventReceiver: er,
      ruleConfig: Rule.createDefaultRuleConfig(),
    };
    const g = new Game.GameImple(params);
    const ret = g.kickPlayerByIdentifier("c");
    expect(er.onNagare).toHaveBeenCalled();
  });
});

describe("ActivePlayerControlImple.enumerateHand", () => {
  it("can enumerate cards in hand", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    const c2 = new Card.Card(Card.CardMark.HEARTS, 6);
    const h = new Hand.Hand();
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

describe("ActivePlayerControlImple.checkCardSelectability", () => {
  it("returns SELECTABLE when DiscardPlanner returned SELECTABLE", () => {
    const h = new Hand.Hand();
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
        return Discard.SelectabilityCheckResult.SELECTABLE;
      });
    const ret = ctrl.checkCardSelectability(0);
    expect(checkSelectability).toHaveBeenCalled();
    expect(ret).toBe(Discard.SelectabilityCheckResult.SELECTABLE);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_SELECTED", () => {
    const h = new Hand.Hand();
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
        return Discard.SelectabilityCheckResult.ALREADY_SELECTED;
      });
    const ret = ctrl.checkCardSelectability(0);
    expect(checkSelectability).toHaveBeenCalled();
    expect(ret).toBe(Discard.SelectabilityCheckResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when DiscardPlanner returned NOT_SELECTABLE", () => {
    const h = new Hand.Hand();
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
        return Discard.SelectabilityCheckResult.NOT_SELECTABLE;
      });
    const ret = ctrl.checkCardSelectability(0);
    expect(checkSelectability).toHaveBeenCalled();
    expect(ret).toBe(Discard.SelectabilityCheckResult.NOT_SELECTABLE);
  });
});

describe("ActivePlayerControl.isCardSelected", () => {
  it("returns what DiscardPlanner.isSelected returned", () => {
    const h = new Hand.Hand();
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
    const h = new Hand.Hand();
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
      return Discard.CardSelectResult.SUCCESS;
    });
    const ret = ctrl.selectCard(0);
    expect(select).toHaveBeenCalled();
    expect(ret).toBe(Discard.CardSelectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_SELECTED", () => {
    const h = new Hand.Hand();
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
      return Discard.CardSelectResult.ALREADY_SELECTED;
    });
    const ret = ctrl.selectCard(0);
    expect(select).toHaveBeenCalled();
    expect(ret).toBe(Discard.CardSelectResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when DiscardPlanner returned NOT_SELECTABLE", () => {
    const h = new Hand.Hand();
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
      return Discard.CardSelectResult.NOT_SELECTABLE;
    });
    const ret = ctrl.selectCard(0);
    expect(select).toHaveBeenCalled();
    expect(ret).toBe(Discard.CardSelectResult.NOT_SELECTABLE);
  });
});

describe("ActivePlayerControlImple.deselectCard", () => {
  it("returns SUCCESS when DiscardPlanner returned SUCCESS", () => {
    const h = new Hand.Hand();
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
      return Discard.CardDeselectResult.SUCCESS;
    });
    const ret = ctrl.deselectCard(0);
    expect(deselect).toHaveBeenCalled();
    expect(ret).toBe(Discard.CardDeselectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_DESELECTED", () => {
    const h = new Hand.Hand();
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
      return Discard.CardDeselectResult.ALREADY_DESELECTED;
    });
    const ret = ctrl.deselectCard(0);
    expect(deselect).toHaveBeenCalled();
    expect(ret).toBe(Discard.CardDeselectResult.ALREADY_DESELECTED);
  });

  it("returns NOT_DESELECTABLE when DiscardPlanner returned NOT_DESELECTABLE", () => {
    const h = new Hand.Hand();
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
      return Discard.CardDeselectResult.NOT_DESELECTABLE;
    });
    const ret = ctrl.deselectCard(0);
    expect(deselect).toHaveBeenCalled();
    expect(ret).toBe(Discard.CardDeselectResult.NOT_DESELECTABLE);
  });
});

describe("ActivePlayerControlImple.countSelectedCards", () => {
  it("returns what discardPlanner returned", () => {
    const h = new Hand.Hand();
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

describe("ActivePlayerControlImple.enumerateDiscardPairs", () => {
  it("returns what DiscardPairEnumerator returned", () => {
    const h = new Hand.Hand();
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
    const c = new Card.Card(Card.CardMark.SPADES, 3);
    const want = [Discard.CreateDiscardPairForTest(c, c)];
    const enumerate = jest.spyOn(dpe, "enumerate").mockImplementation(() => {
      return want;
    });
    const ret = ctrl.enumerateDiscardPairs();
    expect(enumerate).toHaveBeenCalled();
    expect(ret).toStrictEqual(want);
  });
});

describe("ActivePlayerControlImple.pass and ActivePlayerControl.hasPassed", () => {
  it("can set passed flag", () => {
    const h = new Hand.Hand();
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
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 6);
    const h = new Hand.Hand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const enumerate = jest
      .spyOn(dpe, "enumerate")
      .mockImplementation((...args: Card.Card[]) => {
        return [Discard.CreateDiscardPairForTest(c1, c1)];
      });
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const dsc = Discard.CreateDiscardPairForTest(c1, c1);
    const ret = ctrl.discard(dsc);
    expect(ret).toBe(Game.DiscardResult.SUCCESS);
    expect(ctrl.getDiscard()).toStrictEqual(dsc);
  });

  it("cannot set discard when the specified discard pair does not exist on available ones", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 6);
    const c2 = new Card.Card(Card.CardMark.DIAMONDS, 7);
    const h = new Hand.Hand();
    const ds = Discard.createDiscardStack();
    const dp = new Discard.DiscardPlanner(h, ds, false);
    const dpe = new Discard.DiscardPairEnumerator(ds, false);
    const enumerate = jest
      .spyOn(dpe, "enumerate")
      .mockImplementation((...args: Card.Card[]) => {
        return [Discard.CreateDiscardPairForTest(c1, c1)];
      });
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const dsc = Discard.CreateDiscardPairForTest(c2, c2);
    const ret = ctrl.discard(dsc);
    expect(ret).toBe(Game.DiscardResult.NOT_FOUND);
  });
});
