import * as Player from "../src/player";
import * as Index from "../src/index";
import * as Event from "../src/event";
import * as Rule from "../src/rule";

describe("createGame", () => {
  it("returns a new game instance and properly initializes related objects", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const g = Index.createGame(
      [p1, p2, p3],
      Event.createDefaultEventConfig(),
      Rule.createDefaultRuleConfig()
    );
    expect(g).not.toBeNull();
    expect(p1.hand.count()).not.toBe(0);
    expect(p2.hand.count()).not.toBe(0);
    expect(p3.hand.count()).not.toBe(0);
    expect(g.startInfo.playerCount).toBe(3);
    expect(g.startInfo.handCounts).toStrictEqual([18, 18, 18]);
  });

  it("throws an error when player identifiers are not unique", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("b");
    expect(() => {
      Index.createGame(
        [p1, p2, p3],
        Event.createDefaultEventConfig(),
        Rule.createDefaultRuleConfig()
      );
    }).toThrow("one of the players' identifiers is duplicating");
  });
});
