import * as Player from "../src/player";

describe("kicked status", () => {
  it('has "not kicked" status by default', () => {
    expect(Player.createPlayer("a").isKicked()).toBeFalsy();
  });

  it('is changed to "kicked" status after markAsKicked is called', () => {
    const p = Player.createPlayer("a");
    p.markAsKicked();
    expect(p.isKicked()).toBeTruthy();
  });
});
