import * as Card from "../src/card";
import * as Discard from "../src/discard";

function createDiscardStackFixture(
  ...cards: Card.Card[]
): Discard.DiscardStack {
  const dp = Discard.CreateDiscardPairForTest(...cards);
  const ds = Discard.createDiscardStack();
  ds.push(dp);
  return ds;
}

describe("enumerate", () => {
  it("returns blank array when nothing is selected", () => {
    const ds = Discard.createDiscardStack();
    expect(
      new Discard.DiscardPairEnumerator(ds, false).enumerate()
    ).toStrictEqual([]);
  });

  describe("with same numbered pair", () => {
    it("returns DiscardPair of the given cards", () => {
      const c = new Card.Card(Card.CardMark.HEARTS, 7);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const dps = e.enumerate(c, c, c);
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c, c, c]);
    });
  });

  describe("with jokers only", () => {
    it("returns DiscardPair of the given jokers", () => {
      const c = new Card.Card(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const dps = e.enumerate(c, c, c);
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c, c, c]);
    });
  });

  describe("with same numbered pair with jokers", () => {
    it("returns DiscardPair of the given cards, wildcarding jokers correctly", () => {
      const c1 = new Card.Card(Card.CardMark.HEARTS, 7);
      const c1w = new Card.Card(Card.CardMark.WILD, 7);
      const c2 = new Card.Card(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const dps = e.enumerate(c1, c1, c2);
      expect(dps.length).toBe(1);
      const dp = dps[0];
      expect(dp["cards"]).toStrictEqual([c1, c1, c1w]);
    });
  });

  describe("with one numbered card and two jokers", () => {
    it("returns DiscardPair instances for possible wildcard patterns", () => {
      const h5w = new Card.Card(Card.CardMark.WILD, 5);
      const h6w = new Card.Card(Card.CardMark.WILD, 6);
      const h7 = new Card.Card(Card.CardMark.HEARTS, 7);
      const h7w = new Card.Card(Card.CardMark.WILD, 7);
      const h8w = new Card.Card(Card.CardMark.WILD, 8);
      const h9w = new Card.Card(Card.CardMark.WILD, 9);
      const joker = new Card.Card(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const dps = e.enumerate(h7, joker, joker);
      expect(dps.length).toBe(4);
      expect(dps[0]["cards"]).toStrictEqual([h5w, h6w, h7]);
      expect(dps[1]["cards"]).toStrictEqual([h6w, h7, h8w]);
      expect(dps[2]["cards"]).toStrictEqual([h7, h8w, h9w]);
      expect(dps[3]["cards"]).toStrictEqual([h7, h7w, h7w]);
    });

    it("uses jokers for connecting kaidan", () => {
      const h7 = new Card.Card(Card.CardMark.HEARTS, 7);
      const d8w = new Card.Card(Card.CardMark.WILD, 8);
      const h9 = new Card.Card(Card.CardMark.HEARTS, 9);
      const joker = new Card.Card(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const dps = e.enumerate(h7, h9, joker);
      expect(dps.length).toBe(1);
      expect(dps[0]["cards"]).toStrictEqual([h7, d8w, h9]);
    });

    it("uses jokers for connecting kaidan and enumerate all patterns for remaining jokers", () => {
      const h6w = new Card.Card(Card.CardMark.WILD, 6);
      const h7 = new Card.Card(Card.CardMark.HEARTS, 7);
      const d8w = new Card.Card(Card.CardMark.WILD, 8);
      const h9 = new Card.Card(Card.CardMark.HEARTS, 9);
      const h10w = new Card.Card(Card.CardMark.WILD, 10);
      const joker = new Card.Card(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const dps = e.enumerate(h7, h9, joker, joker);
      expect(dps.length).toBe(2);
      expect(dps[0]["cards"]).toStrictEqual([h6w, h7, d8w, h9]);
      expect(dps[1]["cards"]).toStrictEqual([h7, d8w, h9, h10w]);
    });
  });
});

describe("countJokers", () => {
  it("can count jokers", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      new Card.Card(Card.CardMark.SPADES, 7),
      new Card.Card(Card.CardMark.JOKER),
      new Card.Card(Card.CardMark.JOKER),
    ];
    expect(e["countJokers"]()).toBe(2);
  });
});

describe("filterJokers", () => {
  it("can filter jokers", () => {
    const c = new Card.Card(Card.CardMark.SPADES, 7);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      c,
      new Card.Card(Card.CardMark.JOKER),
      new Card.Card(Card.CardMark.JOKER),
    ];
    expect(e["filterJokers"]()).toStrictEqual([c]);
  });
});

describe("hasCardWithNumber", () => {
  it("returns true when the specified card is in list", () => {
    const c = new Card.Card(Card.CardMark.SPADES, 7);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c];
    expect(e["hasCardWithNumber"](7)).toBeTruthy();
  });

  it("returns false when the specified card is not in list", () => {
    const c = new Card.Card(Card.CardMark.SPADES, 7);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c];
    expect(e["hasCardWithNumber"](9)).toBeFalsy();
  });
});

describe("fillMissingKaidanCards", () => {
  it("use one joker", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 7);
    const wc1 = new Card.Card(Card.CardMark.WILD, 8);
    const c2 = new Card.Card(Card.CardMark.SPADES, 9);
    const joker = new Card.Card(Card.CardMark.JOKER);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c1, c2, joker];
    const jokers = e["fillMissingKaidanCards"](1, 7, 9);
    expect(jokers).toBe(0);
    expect(e["selectedCards"]).toStrictEqual([c1, wc1, c2]);
  });

  it("use two jokers", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 7);
    const wc1 = new Card.Card(Card.CardMark.WILD, 8);
    const wc2 = new Card.Card(Card.CardMark.WILD, 9);
    const c2 = new Card.Card(Card.CardMark.SPADES, 10);
    const joker = new Card.Card(Card.CardMark.JOKER);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c1, c2, joker, joker];
    const jokers = e["fillMissingKaidanCards"](2, 7, 10);
    expect(jokers).toBe(0);
    expect(e["selectedCards"]).toStrictEqual([c1, wc1, wc2, c2]);
  });

  it("use two jokers and another joker remains", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 7);
    const wc1 = new Card.Card(Card.CardMark.WILD, 8);
    const wc2 = new Card.Card(Card.CardMark.WILD, 9);
    const c2 = new Card.Card(Card.CardMark.SPADES, 10);
    const joker = new Card.Card(Card.CardMark.JOKER);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c1, c2, joker, joker, joker];
    const jokers = e["fillMissingKaidanCards"](3, 7, 10);
    expect(jokers).toBe(1);
    expect(e["selectedCards"]).toStrictEqual([c1, wc1, wc2, c2, joker]);
  });
});

describe("hasSameNumberedCards", () => {
  it("returns true when there is at least one pair of same numbered cards", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      new Card.Card(Card.CardMark.SPADES, 6),
      new Card.Card(Card.CardMark.DIAMONDS, 6),
    ];
    expect(e["hasSameNumberedCards"]()).toBeTruthy();
  });

  it("returns false when there is no same numbered cards", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      new Card.Card(Card.CardMark.SPADES, 6),
      new Card.Card(Card.CardMark.DIAMONDS, 2),
    ];
    expect(e["hasSameNumberedCards"]()).toBeFalsy();
  });
});

describe("calcKaidanRange", () => {
  it("returns the weakest and strongest card numbers in the kaidan", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      new Card.Card(Card.CardMark.SPADES, 6),
      new Card.Card(Card.CardMark.DIAMONDS, 7),
      new Card.Card(Card.CardMark.HEARTS, 8),
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
    const h5 = new Card.Card(Card.CardMark.HEARTS, 5);
    const h6 = new Card.Card(Card.CardMark.HEARTS, 6);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const dps: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
      Discard.CreateDiscardPairForTest(h6, h6),
    ];
    expect(e["prune"](dps, ds)).toStrictEqual(dps);
  });

  it("can prune pairs which do not satisfy cards count", () => {
    const h4 = new Card.Card(Card.CardMark.HEARTS, 4);
    const h5 = new Card.Card(Card.CardMark.HEARTS, 5);
    const h6 = new Card.Card(Card.CardMark.HEARTS, 6);
    const ds = createDiscardStackFixture(h4, h4);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const dps: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
      Discard.CreateDiscardPairForTest(h6),
    ];
    const dsw: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
    ];
    expect(e["prune"](dps, ds)).toStrictEqual(dsw);
  });

  it("can prune pairs which do not match standard or kaidan condition", () => {
    const h4 = new Card.Card(Card.CardMark.HEARTS, 4);
    const h5 = new Card.Card(Card.CardMark.HEARTS, 5);
    const h6 = new Card.Card(Card.CardMark.HEARTS, 6);
    const ds = createDiscardStackFixture(h4, h4);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const dps: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
      Discard.CreateDiscardPairForTest(h5, h6),
    ];
    const dsw: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h5, h5),
    ];
    expect(e["prune"](dps, ds)).toStrictEqual(dsw);
  });

  it("can prune pairs which is not stronger", () => {
    const h5 = new Card.Card(Card.CardMark.HEARTS, 5);
    const h6 = new Card.Card(Card.CardMark.HEARTS, 6);
    const ds = createDiscardStackFixture(h5, h5);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const dps: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h6, h6),
      Discard.CreateDiscardPairForTest(h5, h5),
    ];
    const dsw: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(h6, h6),
    ];
    expect(e["prune"](dps, ds)).toStrictEqual(dsw);
  });

  it("does not prune a single 3 of spades after a joker", () => {
    const s3 = new Card.Card(Card.CardMark.SPADES, 3);
    const joker = new Card.Card(Card.CardMark.JOKER);
    const ds = createDiscardStackFixture(joker);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const dps: Discard.DiscardPair[] = [Discard.CreateDiscardPairForTest(s3)];
    const dsw: Discard.DiscardPair[] = [Discard.CreateDiscardPairForTest(s3)];
    expect(e["prune"](dps, ds)).toStrictEqual(dsw);
  });

  it("does not prune a single joker after a 3 of spades when strength is inverted", () => {
    const s3 = new Card.Card(Card.CardMark.SPADES, 3);
    const joker = new Card.Card(Card.CardMark.JOKER);
    const ds = createDiscardStackFixture(s3);
    const e = new Discard.DiscardPairEnumerator(ds, true);
    const dps: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(joker),
    ];
    const dsw: Discard.DiscardPair[] = [
      Discard.CreateDiscardPairForTest(joker),
    ];
    expect(e["prune"](dps, ds)).toStrictEqual(dsw);
  });
});
