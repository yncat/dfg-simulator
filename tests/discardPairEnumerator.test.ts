import * as Card from "../src/card";
import * as Discard from "../src/discard";

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
      const e = new Discard.DiscardPairEnumerator(d, false);
      const dps = e.enumerate(c, c, c);
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c, c, c]);
    });
  });

  describe("with jokers only", () => {
    it("returns DiscardPair of the given jokers", () => {
      const c = new Card.Card(Card.Mark.JOKER);
      const d = Discard.CreateDiscardPairForTest();
      const e = new Discard.DiscardPairEnumerator(d, false);
      const dps = e.enumerate(c, c, c);
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
      const e = new Discard.DiscardPairEnumerator(d, false);
      const dps = e.enumerate(c1, c1, c2);
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c1, c1, c1]);
    });
  });

  describe("with one numbered card and two jokers", () => {
    it("returns DiscardPair instances for possible wildcard patterns", () => {
      const h5 = new Card.Card(Card.Mark.HEARTS, 5);
      const h6 = new Card.Card(Card.Mark.HEARTS, 6);
      const h7 = new Card.Card(Card.Mark.HEARTS, 7);
      const h8 = new Card.Card(Card.Mark.HEARTS, 8);
      const h9 = new Card.Card(Card.Mark.HEARTS, 9);
      const joker = new Card.Card(Card.Mark.JOKER);
      const d = Discard.CreateDiscardPairForTest();
      const e = new Discard.DiscardPairEnumerator(d, false);
      const dps = e.enumerate(h7, joker, joker);
      expect(dps.length).toBe(4);
      expect(dps[0]["cards"]).toStrictEqual([h5, h6, h7]);
      expect(dps[1]["cards"]).toStrictEqual([h6, h7, h8]);
      expect(dps[2]["cards"]).toStrictEqual([h7, h8, h9]);
      expect(dps[3]["cards"]).toStrictEqual([h7, h7, h7]);
    });
  });
});

describe("countJokers", () => {
  it("can count jokers", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(d, false);
    e["selectedCards"] = [
      new Card.Card(Card.Mark.SPADES, 7),
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER),
    ];
    expect(e["countJokers"]()).toBe(2);
  });
});

describe("filterJokers", () => {
  it("can filter jokers", () => {
    const c = new Card.Card(Card.Mark.SPADES, 7);
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(d, false);
    e["selectedCards"] = [
      c,
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER),
    ];
    expect(e["filterJokers"]()).toStrictEqual([c]);
  });
});

describe("hasSameNumberedCards", () => {
  it("returns true when there is at least one pair of same numbered cards", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(d, false);
    e["selectedCards"] = [
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 6),
    ];
    expect(e["hasSameNumberedCards"]()).toBeTruthy();
  });

  it("returns false when there is no same numbered cards", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(d, false);
    e["selectedCards"] = [
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 2),
    ];
    expect(e["hasSameNumberedCards"]()).toBeFalsy();
  });
});

describe("calcKaidanRange", () => {
  it("returns the weakest and strongest card numbers in the kaidan", () => {
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(d, false);
    e["selectedCards"] = [
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.DIAMONDS, 7),
      new Card.Card(Card.Mark.HEARTS, 8),
    ];
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
      const c = Discard.createWildcardCombinationForTest(
        [5, 6],
        [8, 9],
        false,
        8
      );
      let nc = c.yieldNextCombination();
      expect(nc).not.toBeNull();
      nc = nc!; // bypass null check
      expect(nc.weakerCardNumbers).toStrictEqual([6]);
      expect(nc.strongerCardNumbers).toStrictEqual([8, 9, 10]);
    });

    it("returns next available combination when strongerCardNumbers is empty", () => {
      const c = Discard.createWildcardCombinationForTest([5, 6], [], false, 8);
      let nc = c.yieldNextCombination();
      expect(nc).not.toBeNull();
      nc = nc!; // bypass null check
      expect(nc.weakerCardNumbers).toStrictEqual([6]);
      expect(nc.strongerCardNumbers).toStrictEqual([8]);
    });

    it("returns next available combination when strength is inverted", () => {
      const c = Discard.createWildcardCombinationForTest(
        [9, 8],
        [6, 5],
        true,
        4
      );
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
        false,
        2
      );
      const nc = c.yieldNextCombination();
      expect(nc).toBeNull();
    });
  });
});

describe("prune", () => {
  it("returns all pairs if the last discard pair is empty", () => {
    const h5 = new Card.Card(Card.Mark.HEARTS, 5);
    const h6 = new Card.Card(Card.Mark.HEARTS, 6);
    const d = Discard.CreateDiscardPairForTest();
    const e = new Discard.DiscardPairEnumerator(d, false);
    const ds: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
      Discard.CreateDiscardPairForTest(h6, h6),
    ];
    expect(e["prune"](ds, d)).toStrictEqual(ds);
  });

  it("can prune pairs which do not satisfy cards count", () => {
    const h4 = new Card.Card(Card.Mark.HEARTS, 4);
    const h5 = new Card.Card(Card.Mark.HEARTS, 5);
    const h6 = new Card.Card(Card.Mark.HEARTS, 6);
    const d = Discard.CreateDiscardPairForTest(h4, h4);
    const e = new Discard.DiscardPairEnumerator(d, false);
    const ds: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
      Discard.CreateDiscardPairForTest(h6),
    ];
    const dsw: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
    ];
    expect(e["prune"](ds, d)).toStrictEqual(dsw);
  });

  it("can prune pairs which do not match standard or kaidan condition", () => {
    const h4 = new Card.Card(Card.Mark.HEARTS, 4);
    const h5 = new Card.Card(Card.Mark.HEARTS, 5);
    const h6 = new Card.Card(Card.Mark.HEARTS, 6);
    const d = Discard.CreateDiscardPairForTest(h4, h4);
    const e = new Discard.DiscardPairEnumerator(d, false);
    const ds: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
      Discard.CreateDiscardPairForTest(h5, h6),
    ];
    const dsw: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
    ];
    expect(e["prune"](ds, d)).toStrictEqual(dsw);
  });

  it("can prune pairs which is not stronger", () => {
    const h5 = new Card.Card(Card.Mark.HEARTS, 5);
    const h6 = new Card.Card(Card.Mark.HEARTS, 6);
    const d = Discard.CreateDiscardPairForTest(h5, h5);
    const e = new Discard.DiscardPairEnumerator(d, false);
    const ds: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h6, h6),
      Discard.CreateDiscardPairForTest(h5, h5),
    ];
    const dsw: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h6, h6),
    ];
    expect(e["prune"](ds, d)).toStrictEqual(dsw);
  });
});
