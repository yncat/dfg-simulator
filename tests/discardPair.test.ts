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

describe("isKaidan", () => {
  it("returns false when there's only one card", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.CLUBS, 5)
    );
    expect(dp.isKaidan()).toBeFalsy();
  });

  it("returns true when cards are sequenced", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.HEARTS, 5),
      new Card.Card(Card.CardMark.HEARTS, 6),
      new Card.Card(Card.CardMark.HEARTS, 7)
    );
    expect(dp.isKaidan()).toBeTruthy();
  });

  it("returns true when cards are sequenced", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.HEARTS, 5),
      new Card.Card(Card.CardMark.HEARTS, 6),
      new Card.Card(Card.CardMark.HEARTS, 8)
    );
    expect(dp.isKaidan()).toBeFalsy();
  });
});

describe("isSameFrom", () => {
  it("returns false when the card count is different", () => {
    const dp1 = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 5),
      new Card.Card(Card.CardMark.SPADES, 6)
    );
    const dp2 = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 5)
    );
    expect(dp1.isSameFrom(dp2)).toBeFalsy();
  });

  it("returns false when the card count is same but has different card", () => {
    const dp1 = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 5),
      new Card.Card(Card.CardMark.SPADES, 6)
    );
    const dp2 = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 5),
      new Card.Card(Card.CardMark.SPADES, 7)
    );
    expect(dp1.isSameFrom(dp2)).toBeFalsy();
  });

  it("returns true when the card count is same and all cards are same", () => {
    const dp1 = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 5),
      new Card.Card(Card.CardMark.SPADES, 6)
    );
    const dp2 = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.SPADES, 5),
      new Card.Card(Card.CardMark.SPADES, 6)
    );
    expect(dp1.isSameFrom(dp2)).toBeTruthy();
  });
});

describe("isOnlyJoker", () => {
  it("returns true when all cards are joker", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.JOKER),
      new Card.Card(Card.CardMark.JOKER)
    );
    expect(dp.isOnlyJoker()).toBeTruthy();
  });

  it("returns false when the pair contains non-joker", () => {
    const dp = Discard.CreateDiscardPairForTest(
      new Card.Card(Card.CardMark.JOKER),
      new Card.Card(Card.CardMark.SPADES, 3)
    );
    expect(dp.isOnlyJoker()).toBeFalsy();
  });
});
