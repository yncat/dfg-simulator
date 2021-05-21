import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Game from "../src/game";
import * as Hand from "../src/hand";
import * as Player from "../src/player";
import * as Rank from "../src/rank";

/* eslint @typescript-eslint/no-unused-vars: 0 */

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
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    ctrl.discard(dps[0]);
    const events = g.finishActivePlayerControl(ctrl);
    expect(() => {
      const events = g.finishActivePlayerControl(ctrl);
    }).toThrow("the given activePlayerControl is no longer valid");
  });

  it("updates related states and emits event when discarding", () => {
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
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    const events = g.finishActivePlayerControl(ctrl);
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(events).toStrictEqual([Game.GameEvent.DISCARD]);
    expect(p1.hand.cards).toStrictEqual([c2]);
    const ndp = Discard.CreateDiscardPairForTest(c1);
    expect(g["lastDiscardPair"]).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("emits agari event when player hand gets empty", () => {
    const p1 = Player.createPlayer("a");
    const c1 = new Card.Card(Card.Mark.DIAMONDS, 4);
    p1.hand.give(c1);
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.selectCard(0);
    const dps = ctrl.enumerateDiscardPairs();
    expect(dps[0].cards).toStrictEqual([c1]);
    ctrl.discard(dps[0]);
    const events = g.finishActivePlayerControl(ctrl);
    expect(g["lastDiscarderIdentifier"]).toBe(p1.identifier);
    expect(events).toStrictEqual([
      Game.GameEvent.DISCARD,
      Game.GameEvent.AGARI,
    ]);
    expect(p1.hand.cards).toStrictEqual([]);
    const ndp = Discard.CreateDiscardPairForTest(c1);
    expect(g["lastDiscardPair"]).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
    expect(p1.rank.getRankType()).toBe(Rank.RankType.DAIFUGO);
  });

  it("updates related states and emits events when passing", () => {
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
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    const events = g.finishActivePlayerControl(ctrl);
    expect(g["lastDiscarderIdentifier"]).toBe("");
    expect(events).toStrictEqual([Game.GameEvent.PASS]);
    expect(p1.hand.cards).toStrictEqual([c1, c2]);
    const ndp = Discard.createNullDiscardPair();
    expect(g["lastDiscardPair"]).toStrictEqual(ndp);
    expect(g["activePlayerIndex"]).toBe(1);
  });

  it("goes back to the first player if all players finished action", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const params: Game.GameInitParams = {
      players: [p1, p2],
      activePlayerIndex: 1,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    const events = g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(0);
  });

  it("skips rank determined player", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    p2.rank.force(Rank.RankType.DAIFUGO);
    const p3 = Player.createPlayer("c");
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 0,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    const events = g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(2);
  });

  it("skips rank determined player even if next turn starts", () => {
    const p1 = Player.createPlayer("a");
    p1.rank.force(Rank.RankType.DAIFUGO);
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const params: Game.GameInitParams = {
      players: [p1, p2, p3],
      activePlayerIndex: 2,
      activePlayerActionCount: 0,
      lastDiscardPair: Discard.createNullDiscardPair(),
      lastDiscarderIdentifier: "",
      strengthInverted: false,
      agariPlayerIdentifiers: [],
    };
    const g = new Game.GameImple(params);
    const ctrl = g.startActivePlayerControl();
    ctrl.pass();
    const events = g.finishActivePlayerControl(ctrl);
    expect(g["activePlayerIndex"]).toBe(1);
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
