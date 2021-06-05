import * as Deck from "../src/deck";

describe("Deck", () => {
  it("Can be instantiated with 54 unshuffled cards", () => {
    const d = new Deck.Deck();
    expect(d.cards.length).toBe(54);
  });
});

describe("shuffle", () => {
  it("Can shuffle cards", () => {
    const d = new Deck.Deck();
    d.shuffle();
    const before = Array.from(d.cards);
    expect(d.cards.length).toBe(54);
    expect(d.cards).not.toBe(before);
  });
});

describe("draw", () => {
  it("Can draw a card from the deck top", () => {
    const d = new Deck.Deck();
    d.shuffle();
    const want = d.cards[d.cards.length - 1];
    const drew = d.draw();
    expect(drew).toStrictEqual(want);
    expect(d.cards.length).toBe(53);
  });

  it("returns null when no cards are left", () => {
    const d = new Deck.Deck();
    d.cards = [];
    const drew = d.draw();
    expect(drew).toBeNull();
  });
});
