import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Game from "../src/game";
import * as Hand from "../src/hand";
import * as Player from "../src/player";
import * as Rank from "../src/rank";
import * as Event from "../src/event";

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
    lastDiscardPair: Discard.createNullDiscardPair(),
    lastDiscarderIdentifier: "",
    strengthInverted: false,
    agariPlayerIdentifiers: [],
    eventDispatcher: Event.createEventDispatcher(
      Event.createDefaultEventConfig()
    ),
  };
  return new Game.GameImple(params);
}

describe("Game.finishActivePlayerControl", () => {
  it("rejects invalid controllers", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
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
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    expect(() => {
      g.finishActivePlayerControl(ctrl);
    }).toThrow("this player's hand is empty; cannot perform any action");
  });

  it("updates related states and emits event when discarding", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onDiscard = jest.spyOn(d, "onDiscard").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: d,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(onDiscard).toHaveBeenCalled();
    expect(p1.hand.cards).toStrictEqual([c2]);
    const ndp = Discard.CreateDiscardPairForTest(c1);
    expect(g["lastDiscardPair"]).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("emits nagare event when everyone passed and the turn reaches the last discarder", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    p2.hand.give(c1, c2); // need to have some cards. The game detects agari when the hand is empty even when the player passes.
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onPass = jest.spyOn(d, "onPass").mockImplementation(() => {});
    const onNagare = jest.spyOn(d, "onNagare").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: d,
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
    expect(onPass).toHaveBeenCalled();
    expect(onNagare).toHaveBeenCalled();
  });

  it("emits agari event when player hand gets empty", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("b");
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onDiscard = jest.spyOn(d, "onDiscard").mockImplementation(() => {});
    const onAgari = jest.spyOn(d, "onAgari").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: d,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(onDiscard).toHaveBeenCalled();
    expect(onAgari).toHaveBeenCalled();
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(p1.hand.cards).toStrictEqual([]);
    const ndp = Discard.CreateDiscardPairForTest(c1);
    expect(g["lastDiscardPair"]).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([p1.identifier]);
  });

  it("determines rank, and emits agari / end event when player gets agari and only 1 player remains", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onDiscard = jest.spyOn(d, "onDiscard").mockImplementation(() => {});
    const onAgari = jest.spyOn(d, "onAgari").mockImplementation(() => {});
    const onGameEnd = jest.spyOn(d, "onGameEnd").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: d,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    ctrl.discard(dps[0]);
    g.finishActivePlayerControl(ctrl);
    expect(onDiscard).toHaveBeenCalled();
    expect(onAgari).toHaveBeenCalled();
    expect(onGameEnd).toHaveBeenCalled();
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(p2.rank.getRankType()).toBe(Rank.RankType.DAIHINMIN);
    expect(g["agariPlayerIdentifiers"]).toStrictEqual([
      p1.identifier,
      p2.identifier,
    ]);
  });

  it("updates related states and emits events when passing", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onPass = jest.spyOn(d, "onPass").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: d,
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(onPass).toHaveBeenCalled();
    expect(g["lastDiscarderIdentifier"]).toBe("");
    expect(p1.hand.cards).toStrictEqual([c1, c2]);
    const ndp = Discard.createNullDiscardPair();
    expect(g["lastDiscardPair"]).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("goes back to the first player if all players finished action", () => {
    const c1 = new Card.Card(Card.Mark.HEARTS, 2);
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
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("skips rank determined player", () => {
    const c1 = new Card.Card(Card.Mark.SPADES, 7);
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
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(2);
  });

  it("skips rank determined player even if next turn starts", () => {
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 6);
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
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
  });
});

describe("Game.kickPlayerByIdentifier", () => {
  it("throws an error when nonexistent player identifier is passed", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
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
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onPlayerKicked = jest
      .spyOn(d, "onPlayerKicked")
      .mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: d,
    };
    const g = new Game.GameImple(params);
    g.kickPlayerByIdentifier("b");
    expect(onPlayerKicked).toHaveBeenCalled();
    expect(g["players"]).toStrictEqual([p1, p3]);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("when kicking a player who is not ranked yet and is not active in this turn 01", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 1,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
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
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
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
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p4.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const params: Game.GameInitParams = {
      players: [p1, p2, p3, p4],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: ["b", "a"],
      eventDispatcher: Event.createEventDispatcher(
        Event.createDefaultEventConfig()
      ),
    };
    const g = new Game.GameImple(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g["agariPlayerIdentifiers"]).toStrictEqual(["a"]);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
  });

  it("recalculates already ranked players and ends the game if required", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    p1.rank.force(Rank.RankType.FUGO);
    p2.rank.force(Rank.RankType.DAIFUGO);
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onGameEnd = jest.spyOn(d, "onGameEnd").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: ["b", "a"],
      eventDispatcher: d,
    };
    const g = new Game.GameImple(params);
    const ret = g.kickPlayerByIdentifier("b");
    expect(g["agariPlayerIdentifiers"]).toStrictEqual(["a", "c"]);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(p3.rank.getRankType()).toBe(Rank.RankType.DAIHINMIN);
    expect(onGameEnd).toHaveBeenCalled();
  });

  it("triggers nagare callback if required", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 5);
    p1.hand.give(c1, c2);
    p2.hand.give(c1, c2);
    p3.hand.give(c1, c2);
    const d = Event.createEventDispatcher(Event.createDefaultEventConfig());
    const onNagare = jest.spyOn(d, "onNagare").mockImplementation(() => {});
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "a",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
      eventDispatcher: d,
    };
    const g = new Game.GameImple(params);
    const ret = g.kickPlayerByIdentifier("c");
    expect(onNagare).toHaveBeenCalled();
  });
});

describe("ActivePlayerControlImple.enumerateHand", () => {
  it("can enumerate cards in hand", () => {
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 5);
    const c2 = new Card.Card(Card.Mark.HEARTS, 6);
    const h = new Hand.Hand();
    h.give(c1, c2);
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.SelectabilityCheckResult.SELECTABLE);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_SELECTED", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.SelectabilityCheckResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when DiscardPlanner returned NOT_SELECTABLE", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.SelectabilityCheckResult.NOT_SELECTABLE);
  });
});

describe("ActivePlayerControl.isCardSelected", () => {
  it("returns what DiscardPlanner.isSelected returned", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.CardSelectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_SELECTED", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.CardSelectResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when DiscardPlanner returned NOT_SELECTABLE", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.CardSelectResult.NOT_SELECTABLE);
  });
});

describe("ActivePlayerControlImple.deselectCard", () => {
  it("returns SUCCESS when DiscardPlanner returned SUCCESS", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.CardDeselectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when DiscardPlanner returned ALREADY_DESELECTED", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.CardDeselectResult.ALREADY_DESELECTED);
  });

  it("returns NOT_DESELECTABLE when DiscardPlanner returned NOT_DESELECTABLE", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    expect(ret).toBe(Game.CardDeselectResult.NOT_DESELECTABLE);
  });
});

describe("ActivePlayerControlImple.enumerateDiscardPairs", () => {
  it("returns what DiscardPairEnumerator returned", () => {
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
    const ctrl = Game.createActivePlayerControlForTest(
      "t1p0a0",
      "abc",
      h,
      dp,
      dpe
    );
    const c = new Card.Card(Card.Mark.SPADES, 3);
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
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 6);
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 6);
    const c2 = new Card.Card(Card.Mark.DIAMONDS, 7);
    const h = new Hand.Hand();
    const ldp = Discard.CreateDiscardPairForTest();
    const dp = new Discard.DiscardPlanner(h, ldp, false);
    const dpe = new Discard.DiscardPairEnumerator(ldp, false);
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
