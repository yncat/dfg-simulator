import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Hand from "../src/hand";

describe("enumerate", () => {
  it("returns blank array when nothing is selected", () => {
    const d = Discard.CreateDiscardPairForTest();
    expect(
      new Discard.DiscardPairEnumerator(d, false).enumerate()
    ).toStrictEqual([]);
  });

  describe("with same numbered pair", () => {
    it("returns DiscardPair of the given cards", () => {
      const c = new Card.Card(Card.Mark.HEARTS, 7);
      const d = Discard.CreateDiscardPairForTest();
      const e = new Discard.DiscardPairEnumerator(d, false, c, c, c);
      const dps = e.enumerate();
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c, c, c]);
    });
  });

  describe("with jokers only", () => {
    it("returns DiscardPair of the given jokers", () => {
      const c = new Card.Card(Card.Mark.JOKER);
      const d = Discard.CreateDiscardPairForTest();
      const e = new Discard.DiscardPairEnumerator(d, false, c, c, c);
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
      const d = Discard.CreateDiscardPairForTest();
      const e = new Discard.DiscardPairEnumerator(d, false, c1, c1, c2);
      const dps = e.enumerate();
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c1, c1, c1]);
    });
  });
});

describe("countJokers", () => {
  it("can count jokers", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(
      d,
      false,
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
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(
      d,
      false,
      c,
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER)
    );
    expect(e["filterJokers"]()).toStrictEqual([c]);
  });
});

describe("hasSameNumberedCards", () => {
  it("returns true when there is at least one pair of same numbered cards", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(
      d,
      false,
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 6)
    );
    expect(e["hasSameNumberedCards"]()).toBeTruthy();
  });

  it("returns false when there is no same numbered cards", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(
      d,
      false,
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 2)
    );
    expect(e["hasSameNumberedCards"]()).toBeFalsy();
  });
});

describe("calcKaidanRange", () => {
  it("returns the weakest and strongest card numbers in the kaidan", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(
      d,
      false,
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 7),
      new Card.Card(Card.Mark.HEARTS, 8)
    );
    const want = {
      weakestCardNumber: 6,
      strongestCardNumber: 8,
    };
    expect(e["calcKaidanRange"]()).toStrictEqual(want);
  });
});

describe("WildcardCombination", () => {
  describe("yieldNextCombination", () => {
    it("returns next available combination", () => {
      const c = Discard.createWildcardCombinationForTest([5, 6], [8, 9], false);
      let nc = c.yieldNextCombination();
      expect(nc).not.toBeNull();
      nc = nc!; // bypass null check
      expect(nc.weakerCardNumbers).toStrictEqual([6]);
      expect(nc.strongerCardNumbers).toStrictEqual([8, 9, 10]);
    });

    it("returns next available combination when strength is inverted", () => {
      const c = Discard.createWildcardCombinationForTest([9, 8], [6, 5], true);
      let nc = c.yieldNextCombination();
      expect(nc).not.toBeNull();
      nc = nc!; // bypass null check
      expect(nc.weakerCardNumbers).toStrictEqual([8]);
      expect(nc.strongerCardNumbers).toStrictEqual([6, 5, 4]);
    });

    it("returns null when no more combination could be yielded", () => {
      const c = Discard.createWildcardCombinationForTest(
        [10, 11],
        [1, 2],
        false
      );
      let nc = c.yieldNextCombination();
      expect(nc).toBeNull();
    });
  });
});
