import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Game from "../src/game";
import * as Hand from "../src/hand";
import * as Player from "../src/player";

describe("createGame", () => {
  it("returns a new game instance and properly initializes related objects", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const g = Game.createGame([p1, p2, p3]);
    expect(g).not.toBeNull();
    expect(p1.hand.count()).not.toBe(0);
    expect(p2.hand.count()).not.toBe(0);
    expect(p3.hand.count()).not.toBe(0);
    expect(g.startInfo.deckCount).toBe(1);
    expect(g.startInfo.playerCount).toBe(3);
    expect(g.startInfo.handCounts).toStrictEqual([18, 18, 18]);
  });

  it("throws an error when player identifiers are not unique", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("b");
    expect(() => {
      Game.createGame([p1, p2, p3]);
    }).toThrow("one of the players' identifiers is duplicating");
  });
});

describe("Game.getActivePlayerControl", () => {
  it("returns an ActivePlayerControl instance with required properties", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const g = Game.createGame([p1, p2, p3]);
    const ctrl = g.getActivePlayerControl();
    expect(ctrl).not.toBeNull();
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
    const ctrl = Game.createActivePlayerControlForTest("abc", h, dp);
    expect(ctrl.enumerateHand()).toStrictEqual([c1, c2]);
  });
});
