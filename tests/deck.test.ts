import * as Deck from "../src/deck";

describe("Deck", () => {
  it("Can be instantiated with 54 unshuffled cards", () => {
    const d = new Deck.Deck();
    expect(d.cards.length).toBe(54);
  });
  it("Can be shuffled", () => {
    const d = new Deck.Deck();
    d.shuffle();
    const before = Array.from(d.cards);
    expect(d.cards.length).toBe(54);
    expect(d.cards).not.toBe(before);
  });
});
