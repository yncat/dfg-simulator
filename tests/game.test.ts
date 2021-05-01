import * as Game from "../src/game";
import * as Player from "../src/player";

describe("createGame", () => {
  it("returns a new game instance when everything is valid", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    const g = Game.createGame([p1, p2, p3]);
    expect(g).not.toBeNull();
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
