import * as Discard from "../src/discard";

describe("createNullDiscardPair", () => {
  it("returns null discardPair", () => {
    expect(Discard.createNullDiscardPair().isNull()).toBeTruthy();
  });
});
