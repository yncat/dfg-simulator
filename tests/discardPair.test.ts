import * as Discard from "../src/discard";
import * as Card from "../src/card";

describe("createNullDiscardPair", () => {
  it("returns null discardPair", () => {
    expect(Discard.createNullDiscardPair().isNull()).toBeTruthy();
  });
});

describe("count", () => {
  it("can count cards", () => {
    const c1 = new Card.Card(Card.CardMark.CLUBS, 1);
    const c2 = new Card.Card(Card.CardMark.CLUBS, 2);
    const dp = Discard.CreateDiscardPairForTest(c1, c2);
    expect(dp.count()).toBe(2);
  });
});

describe("calcCardNumber", () => {
  it("returns card number when same numbered pair", () => {
    const c1 = new Card.Card(Card.CardMark.CLUBS, 1);
    const dp = Discard.CreateDiscardPairForTest(c1, c1);
    expect(dp.calcCardNumber(false)).toBe(1);
  });

  it("returns weakest card number when kaidan", () => {
    const c1 = new Card.Card(Card.CardMark.CLUBS, 1);
    const c2 = new Card.Card(Card.CardMark.CLUBS, 2);
    const dp = Discard.CreateDiscardPairForTest(c1, c2);
    expect(dp.calcCardNumber(false)).toBe(1);
    expect(dp.calcCardNumber(true)).toBe(2);
  });
});

describe("calcStrength", () => {
  it("returns card strength when same numbered pair", () => {
    const c1 = new Card.Card(Card.CardMark.CLUBS, 1);
    const dp = Discard.CreateDiscardPairForTest(c1, c1);
    expect(dp.calcStrength()).toBe(14);
  });

  it("returns weakest strength value when kaidan", () => {
    const c1 = new Card.Card(Card.CardMark.CLUBS, 1);
    const c2 = new Card.Card(Card.CardMark.CLUBS, 2);
    const dp = Discard.CreateDiscardPairForTest(c1, c2);
    expect(dp.calcStrength()).toBe(14);
  });
});
