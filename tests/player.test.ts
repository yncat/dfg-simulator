import { Hand } from "../src/hand";
import * as Player from "../src/player";
import { Rank } from "../src/rank";

describe("player", () => {
  it("can be instantiated", () => {
    const p = new Player.Player(new Hand(), new Rank());
    expect(p).toBeTruthy();
  });
});
