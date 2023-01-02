import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";
import * as Discard from "../src/discard";
import * as Helper from "./helper";

function createDiscardStackFixture(
  ...cards: Card.Card[]
): Discard.DiscardStack {
  const csp = CardSelection.CreateCardSelectionPairForTest(...cards);
  const ds = Discard.createDiscardStack();
  ds.push(csp);
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
      const c = Card.createCard(Card.CardMark.HEARTS, 7);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const csps = e.enumerate(c, c, c);
      expect(csps.length).toBe(1);
      const csp = csps[0];
      expect(csp["cards"]).toStrictEqual([c, c, c]);
    });
  });

  describe("with jokers only", () => {
    it("returns DiscardPair of the given jokers", () => {
      const c = Card.createCard(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const csps = e.enumerate(c, c, c);
      expect(csps.length).toBe(1);
      const csp = csps[0];
      expect(csp["cards"]).toStrictEqual([c, c, c]);
    });
  });

  describe("with same numbered pair with jokers", () => {
    it("returns DiscardPair of the given cards, wildcarding jokers correctly", () => {
      const c1 = Card.createCard(Card.CardMark.HEARTS, 7);
      const c1w = Card.createCard(Card.CardMark.WILD, 7);
      const c2 = Card.createCard(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const csps = e.enumerate(c1, c1, c2);
      expect(csps.length).toBe(1);
      const csp = csps[0];
      expect(Helper.assertCardsEqual(csp["cards"], [c1, c1, c1w])).toBeTruthy();
    });
  });

  describe("with one numbered card and two jokers", () => {
    it("returns DiscardPair instances for possible wildcard patterns", () => {
      const h5w = Card.createCard(Card.CardMark.WILD, 5);
      const h6w = Card.createCard(Card.CardMark.WILD, 6);
      const h7 = Card.createCard(Card.CardMark.HEARTS, 7);
      const h7w = Card.createCard(Card.CardMark.WILD, 7);
      const h8w = Card.createCard(Card.CardMark.WILD, 8);
      const h9w = Card.createCard(Card.CardMark.WILD, 9);
      const joker = Card.createCard(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const csps = e.enumerate(h7, joker, joker);
      expect(csps.length).toBe(4);
      expect(
        Helper.assertCardsEqual(csps[0]["cards"], [h5w, h6w, h7])
      ).toBeTruthy();
      expect(
        Helper.assertCardsEqual(csps[1]["cards"], [h6w, h7, h8w])
      ).toBeTruthy();
      expect(
        Helper.assertCardsEqual(csps[2]["cards"], [h7, h8w, h9w])
      ).toBeTruthy();
      expect(
        Helper.assertCardsEqual(csps[3]["cards"], [h7, h7w, h7w])
      ).toBeTruthy();
    });

    it("uses jokers for connecting kaidan", () => {
      const h7 = Card.createCard(Card.CardMark.HEARTS, 7);
      const d8w = Card.createCard(Card.CardMark.WILD, 8);
      const h9 = Card.createCard(Card.CardMark.HEARTS, 9);
      const joker = Card.createCard(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const csps = e.enumerate(h7, h9, joker);
      expect(csps.length).toBe(1);
      expect(
        Helper.assertCardsEqual(csps[0]["cards"], [h7, d8w, h9])
      ).toBeTruthy();
    });

    it("uses jokers for connecting kaidan and enumerate all patterns for remaining jokers", () => {
      const h6w = Card.createCard(Card.CardMark.WILD, 6);
      const h7 = Card.createCard(Card.CardMark.HEARTS, 7);
      const d8w = Card.createCard(Card.CardMark.WILD, 8);
      const h9 = Card.createCard(Card.CardMark.HEARTS, 9);
      const h10w = Card.createCard(Card.CardMark.WILD, 10);
      const joker = Card.createCard(Card.CardMark.JOKER);
      const ds = Discard.createDiscardStack();
      const e = new Discard.DiscardPairEnumerator(ds, false);
      const csps = e.enumerate(h7, h9, joker, joker);
      expect(csps.length).toBe(2);
      expect(
        Helper.assertCardsEqual(csps[0]["cards"], [h6w, h7, d8w, h9])
      ).toBeTruthy();
      expect(
        Helper.assertCardsEqual(csps[1]["cards"], [h7, d8w, h9, h10w])
      ).toBeTruthy();
    });
  });
});

describe("countJokers", () => {
  it("can count jokers", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      Card.createCard(Card.CardMark.SPADES, 7),
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.JOKER),
    ];
    expect(e["countJokers"]()).toBe(2);
  });
});

describe("filterJokers", () => {
  it("can filter jokers", () => {
    const c = Card.createCard(Card.CardMark.SPADES, 7);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      c,
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.JOKER),
    ];
    expect(e["filterJokers"]()).toStrictEqual([c]);
  });
});

describe("hasCardWithNumber", () => {
  it("returns true when the specified card is in list", () => {
    const c = Card.createCard(Card.CardMark.SPADES, 7);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c];
    expect(e["hasCardWithNumber"](7)).toBeTruthy();
  });

  it("returns false when the specified card is not in list", () => {
    const c = Card.createCard(Card.CardMark.SPADES, 7);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c];
    expect(e["hasCardWithNumber"](9)).toBeFalsy();
  });
});

describe("fillMissingKaidanCards", () => {
  it("use one joker", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 7);
    const wc1 = Card.createCard(Card.CardMark.WILD, 8);
    const c2 = Card.createCard(Card.CardMark.SPADES, 9);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c1, c2, joker];
    const jokers = e["fillMissingKaidanCards"](1, 7, 9);
    expect(jokers).toBe(0);
    expect(
      Helper.assertCardsEqual(e["selectedCards"], [c1, wc1, c2])
    ).toBeTruthy();
  });

  it("use two jokers", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 7);
    const wc1 = Card.createCard(Card.CardMark.WILD, 8);
    const wc2 = Card.createCard(Card.CardMark.WILD, 9);
    const c2 = Card.createCard(Card.CardMark.SPADES, 10);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c1, c2, joker, joker];
    const jokers = e["fillMissingKaidanCards"](2, 7, 10);
    expect(jokers).toBe(0);
    expect(
      Helper.assertCardsEqual(e["selectedCards"], [c1, wc1, wc2, c2])
    ).toBeTruthy();
  });

  it("use two jokers and another joker remains", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 7);
    const wc1 = Card.createCard(Card.CardMark.WILD, 8);
    const wc2 = Card.createCard(Card.CardMark.WILD, 9);
    const c2 = Card.createCard(Card.CardMark.SPADES, 10);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [c1, c2, joker, joker, joker];
    const jokers = e["fillMissingKaidanCards"](3, 7, 10);
    expect(jokers).toBe(1);
    expect(
      Helper.assertCardsEqual(e["selectedCards"], [c1, wc1, wc2, c2, joker])
    ).toBeTruthy();
  });
});

describe("hasSameNumberedCards", () => {
  it("returns true when there is at least one pair of same numbered cards", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      Card.createCard(Card.CardMark.SPADES, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 6),
    ];
    expect(e["hasSameNumberedCards"]()).toBeTruthy();
  });

  it("returns false when there is no same numbered cards", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      Card.createCard(Card.CardMark.SPADES, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 2),
    ];
    expect(e["hasSameNumberedCards"]()).toBeFalsy();
  });
});

describe("calcKaidanRange", () => {
  it("returns the weakest and strongest card numbers in the kaidan", () => {
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    e["selectedCards"] = [
      Card.createCard(Card.CardMark.SPADES, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 7),
      Card.createCard(Card.CardMark.HEARTS, 8),
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
    const h5 = Card.createCard(Card.CardMark.HEARTS, 5);
    const h6 = Card.createCard(Card.CardMark.HEARTS, 6);
    const ds = Discard.createDiscardStack();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const csps: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
      CardSelection.CreateCardSelectionPairForTest(h6, h6),
    ];
    expect(e["prune"](csps, ds)).toStrictEqual(csps);
  });

  it("can prune pairs which do not satisfy cards count", () => {
    const h4 = Card.createCard(Card.CardMark.HEARTS, 4);
    const h5 = Card.createCard(Card.CardMark.HEARTS, 5);
    const h6 = Card.createCard(Card.CardMark.HEARTS, 6);
    const ds = createDiscardStackFixture(h4, h4);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const csps: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
      CardSelection.CreateCardSelectionPairForTest(h6),
    ];
    const dsw: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
    ];
    expect(e["prune"](csps, ds)).toStrictEqual(dsw);
  });

  it("can prune pairs which are not allowed in daifugo rules", () => {
    const h5 = Card.createCard(Card.CardMark.HEARTS, 5);
    const h6 = Card.createCard(Card.CardMark.HEARTS, 6);
    const ds = createDiscardStackFixture();
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const csps: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
      CardSelection.CreateCardSelectionPairForTest(h5, h6),
    ];
    const dsw: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
    ];
    expect(e["prune"](csps, ds)).toStrictEqual(dsw);
  });

  it("can prune pairs which do not match standard or kaidan condition", () => {
    const h4 = Card.createCard(Card.CardMark.HEARTS, 4);
    const h5 = Card.createCard(Card.CardMark.HEARTS, 5);
    const h6 = Card.createCard(Card.CardMark.HEARTS, 6);
    const ds = createDiscardStackFixture(h4, h4);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const csps: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
      CardSelection.CreateCardSelectionPairForTest(h5, h6),
    ];
    const dsw: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
    ];
    expect(e["prune"](csps, ds)).toStrictEqual(dsw);
  });

  it("can prune pairs which is not stronger", () => {
    const h5 = Card.createCard(Card.CardMark.HEARTS, 5);
    const h6 = Card.createCard(Card.CardMark.HEARTS, 6);
    const ds = createDiscardStackFixture(h5, h5);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const csps: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h6, h6),
      CardSelection.CreateCardSelectionPairForTest(h5, h5),
    ];
    const dsw: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(h6, h6),
    ];
    expect(e["prune"](csps, ds)).toStrictEqual(dsw);
  });

  it("does not prune a single 3 of spades after a joker", () => {
    const s3 = Card.createCard(Card.CardMark.SPADES, 3);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const ds = createDiscardStackFixture(joker);
    const e = new Discard.DiscardPairEnumerator(ds, false);
    const csps: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(s3),
    ];
    const dsw: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(s3),
    ];
    expect(e["prune"](csps, ds)).toStrictEqual(dsw);
  });

  it("does not prune a single joker after a 3 of spades when strength is inverted", () => {
    const s3 = Card.createCard(Card.CardMark.SPADES, 3);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const ds = createDiscardStackFixture(s3);
    const e = new Discard.DiscardPairEnumerator(ds, true);
    const csps: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(joker),
    ];
    const dsw: CardSelection.CardSelectionPair[] = [
      CardSelection.CreateCardSelectionPairForTest(joker),
    ];
    expect(e["prune"](csps, ds)).toStrictEqual(dsw);
  });
});
