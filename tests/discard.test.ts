import * as Discard from "../src/discard";
import { Hand } from "../src/hand";

describe("DiscardPlanner", () => {
  it("can be instantiated", () => {
    const h = new Hand();
    const p = new Discard.discardPlanner(h);
    expect(p).toBeTruthy();
  });
});
