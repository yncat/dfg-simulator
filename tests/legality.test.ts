import * as Discard from "../src/discard";
import * as Card from "../src/card";
import * as Legality from "../src/legality";

describe("isForbiddenAgari", () => {
  it("returns true when joker is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.JOKER)
    );
    expect(Legality.isForbiddenAgari(dp, false)).toBeTruthy();
  });

  it("returns true when strength is not inverted and 2 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.CLUBS, 2)
    );
    expect(Legality.isForbiddenAgari(dp, false)).toBeTruthy();
  });

  it("returns false when strength is inverted and 2 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.CLUBS, 2)
    );
    expect(Legality.isForbiddenAgari(dp, true)).toBeFalsy();
  });

  it("returns true when strength is inverted and 3 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.DIAMONDS, 3)
    );
    expect(Legality.isForbiddenAgari(dp, true)).toBeTruthy();
  });

  it("returns false when strength is not inverted and 3 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.DIAMONDS, 3)
    );
    expect(Legality.isForbiddenAgari(dp, false)).toBeFalsy();
  });

  it("returns true when 8 is included", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.DIAMONDS, 8)
    );
    expect(Legality.isForbiddenAgari(dp, false)).toBeTruthy();
  });

  it("returns true when the pair consists of 3 of spades only", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 3)
    );
    expect(Legality.isForbiddenAgari(dp, false)).toBeTruthy();
  });

  it("returns false when the pair is a kaidan that includes 3 of spades", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 3),
      new Card.Card(Card.CardMark.SPADES, 4),
      new Card.Card(Card.CardMark.SPADES, 5)
    );
    expect(Legality.isForbiddenAgari(dp, false)).toBeFalsy();
  });
});
