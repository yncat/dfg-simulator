import * as Card from "../src/card";
import * as Discard from "../src/discard";

describe("DiscardStack", () => {
  it("can be instantiated with null discard pair", () => {
    const ds = Discard.createDiscardStack();
    const ndp = Discard.createNullDiscardPair();
    expect(ds["discardPairs"]).toStrictEqual([ndp]);
  });

  it("can push a new discard pair", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.CLUBS, 4);
    const ds = Discard.createDiscardStack();
    const dp = Discard.CreateDiscardPairForTest(c1, c2);
    ds.push(dp);
    expect(ds["discardPairs"].length).toBe(2);
    expect(ds["discardPairs"][1]).toStrictEqual(dp);
  });

  it("can retrieve the last pushed discard pair", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.CLUBS, 4);
    const ds = Discard.createDiscardStack();
    const dp = Discard.CreateDiscardPairForTest(c1, c2);
    ds.push(dp);
    expect(ds.last()).toStrictEqual(dp);
  });

  it("can retrieve the second to last pushed discard pair", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.CLUBS, 4);
    const c3 = new Card.Card(Card.CardMark.DIAMONDS, 5);
    const c4 = new Card.Card(Card.CardMark.CLUBS, 5);
    const ds = Discard.createDiscardStack();
    const dp1 = Discard.CreateDiscardPairForTest(c1, c2);
    const dp2 = Discard.CreateDiscardPairForTest(c3, c4);
    ds.push(dp1);
    ds.push(dp2);
    expect(ds.secondToLast()).toStrictEqual(dp1);
  });

  it("returns nullDiscardPair when tried to retrieve the second to last discardPair with only one pair stacked", () => {
    const ds = Discard.createDiscardStack();
    const ndp = Discard.createNullDiscardPair();
    expect(ds.secondToLast()).toStrictEqual(ndp);
  });

  it("can clear the stacked discard pairs", () => {
    const c1 = new Card.Card(Card.CardMark.DIAMONDS, 4);
    const c2 = new Card.Card(Card.CardMark.CLUBS, 4);
    const dp = Discard.CreateDiscardPairForTest(c1, c2);
    const ds = Discard.createDiscardStack();
    const ndp = Discard.createNullDiscardPair();
    ds.push(dp);
    expect(ds["discardPairs"].length).toBe(2);
    ds.clear();
    expect(ds["discardPairs"].length).toBe(1);
    expect(ds["discardPairs"][0]).toStrictEqual(ndp);
  });
});
