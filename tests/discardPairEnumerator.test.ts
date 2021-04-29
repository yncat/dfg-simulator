import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Hand from "../src/hand";

describe("enumerate", () => {
  describe("with same numbered pair", () => {
    it("returns DiscardPair of the given cards", () => {
      const c = new Card.Card(Card.Mark.HEARTS, 7);
      const e = new Discard.DiscardPairEnumerator(c, c, c);
      const dps = e.enumerate();
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c, c, c]);
    });
  });

  describe("with same numbered pair with jokers", () => {
    it("returns DiscardPair of the given cards, wildcarding jokers correctly", () => {
      const c1 = new Card.Card(Card.Mark.HEARTS, 7);
      const c2 = new Card.Card(Card.Mark.JOKER);
      const e = new Discard.DiscardPairEnumerator(c1, c1, c2);
      const dps = e.enumerate();
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c1, c1, c1]);
    });
  });
});

describe("countJokers", () => {
  it("can count jokers", () => {
    const e = new Discard.DiscardPairEnumerator(
      new Card.Card(Card.Mark.SPADES, 7),
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER)
    );
    expect(e["countJokers"]()).toBe(2);
  });
});

describe("filterJokers", () => {
  it("can filter jokers", () => {
    const c = new Card.Card(Card.Mark.SPADES, 7);
    const e = new Discard.DiscardPairEnumerator(
      c,
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER)
    );
    expect(e["filterJokers"]()).toStrictEqual([c]);
  });
});

describe("hasSameNumberedCards", () => {
  it("returns true when there is at least one pair of same numbered cards", () => {
    const e = new Discard.DiscardPairEnumerator(
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 6)
    );
    expect(e["hasSameNumberedCards"]()).toBeTruthy();
  });

  it("returns false when there is no same numbered cards", () => {
    const e = new Discard.DiscardPairEnumerator(
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 2)
    );
    expect(e["hasSameNumberedCards"]()).toBeFalsy();
  });
});
