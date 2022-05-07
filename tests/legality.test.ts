import * as Discard from "../src/discard";
import * as Card from "../src/card";
import * as Legality from "../src/legality";

describe("isForbiddenAgari", () => {
  it("returns true when joker is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.JOKER)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, false)).toBeTruthy();
  });

  it("returns true when strength is not inverted and 2 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.CLUBS, 2)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, false)).toBeTruthy();
  });

  it("returns false when strength is inverted and 2 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.CLUBS, 2)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, true)).toBeFalsy();
  });

  it("returns true when strength is inverted and 3 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, true)).toBeTruthy();
  });

  it("returns false when strength is not inverted and 3 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, false)).toBeFalsy();
  });

  it("returns true when 8 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 8)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, false)).toBeTruthy();
  });

  it("returns true when the pair consists of 3 of spades and the last discard pair includes jokers", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.SPADES, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(
      Discard.CreateDiscardPairForTest(Card.createCard(Card.CardMark.JOKER, 0))
    );
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, false)).toBeTruthy();
  });

  it("returns false when the pair consists of 3 of spades and the last discard pair does not include jokers", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.SPADES, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, false)).toBeFalsy();
  });

  it("returns false when the pair is a kaidan that includes 3 of spades", () => {
    const dp = Discard.CreateDiscardPairForTest(
      Card.createCard(Card.CardMark.SPADES, 3),
      Card.createCard(Card.CardMark.SPADES, 4),
      Card.createCard(Card.CardMark.SPADES, 5)
    );
    const ds = Discard.createDiscardStack();
    ds.push(dp);
    expect(Legality.isForbiddenAgari(ds, false)).toBeFalsy();
  });
});
