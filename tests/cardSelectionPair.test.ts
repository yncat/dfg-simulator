import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";

describe("createNullCardSelectionPair", () => {
  it("returns null cardSelectionPair", () => {
    expect(CardSelection.createNullCardSelectionPair().isNull()).toBeTruthy();
  });
});

describe("count", () => {
  it("can count cards", () => {
    const c1 = Card.createCard(Card.CardMark.CLUBS, 1);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 2);
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c2);
    expect(csp.count()).toBe(2);
  });
});

describe("calcCardNumber", () => {
  it("returns card number when same numbered pair", () => {
    const c1 = Card.createCard(Card.CardMark.CLUBS, 1);
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c1);
    expect(csp.calcCardNumber(false)).toBe(1);
  });

  it("returns weakest card number when kaidan", () => {
    const c1 = Card.createCard(Card.CardMark.CLUBS, 1);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 2);
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c2);
    expect(csp.calcCardNumber(false)).toBe(1);
    expect(csp.calcCardNumber(true)).toBe(2);
  });
});

describe("calcStrength", () => {
  it("returns card strength when same numbered pair", () => {
    const c1 = Card.createCard(Card.CardMark.CLUBS, 1);
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c1);
    expect(csp.calcStrength()).toBe(14);
  });

  it("returns weakest strength value when kaidan", () => {
    const c1 = Card.createCard(Card.CardMark.CLUBS, 1);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 2);
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c2);
    expect(csp.calcStrength()).toBe(14);
  });
});

describe("isSequencial", () => {
  it("returns false when there's only one card", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.CLUBS, 5)
    );
    expect(csp.isSequencial()).toBeFalsy();
  });

  it("returns true when cards are sequenced", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.HEARTS, 5),
      Card.createCard(Card.CardMark.HEARTS, 6),
      Card.createCard(Card.CardMark.HEARTS, 7)
    );
    expect(csp.isSequencial()).toBeTruthy();
  });

  it("returns false when cards are not sequenced", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.HEARTS, 5),
      Card.createCard(Card.CardMark.HEARTS, 6),
      Card.createCard(Card.CardMark.HEARTS, 8)
    );
    expect(csp.isSequencial()).toBeFalsy();
  });
});

describe("isSameCard", () => {
  it("returns false when the card count is different", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 6)
    );
    const csp2 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 5)
    );
    expect(csp1.isSameCard(csp2)).toBeFalsy();
  });

  it("returns false when the card count is same but has different card", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 6)
    );
    const csp2 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 7)
    );
    expect(csp1.isSameCard(csp2)).toBeFalsy();
  });

  it("returns true when the card count is same and all cards are same", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 6)
    );
    const csp2 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 6)
    );
    expect(csp1.isSameCard(csp2)).toBeTruthy();
  });
});

describe("isOnlyJoker", () => {
  it("returns true when all cards are joker", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.JOKER)
    );
    expect(csp.isOnlyJoker()).toBeTruthy();
  });

  it("returns false when the pair contains non-joker", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.SPADES, 3)
    );
    expect(csp.isOnlyJoker()).toBeFalsy();
  });
});

describe("countWithCondition", () => {
  it("counts all cards when all conditions are null", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 7)
    );
    expect(csp.countWithCondition(null, null)).toBe(2);
  });

  it("counts matched card (card mark)", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 7),
      Card.createCard(Card.CardMark.SPADES, 7)
    );
    expect(csp.countWithCondition(Card.CardMark.DIAMONDS, null)).toBe(2);
  });

  it("counts matched card (card number)", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 7),
      Card.createCard(Card.CardMark.SPADES, 7)
    );
    expect(csp.countWithCondition(null, 7)).toBe(2);
  });

  it("counts matched card (card mark and number)", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 7),
      Card.createCard(Card.CardMark.SPADES, 7)
    );
    expect(csp.countWithCondition(Card.CardMark.DIAMONDS, 7)).toBe(1);
  });
});

describe("isValid", () => {
  it("null discard pair is invalid", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest();
    expect(csp1.isValid()).toBeFalsy();
  });

  it("discard pair with a single card is valid", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 2 cards is valid, when card numbers are same", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 6)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 2 cards is valid, when considered joker and card numbers are same", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.JOKER, 0)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 2 cards is invalid, when card numbers are different", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 5)
    );
    expect(csp1.isValid()).toBeFalsy();
  });

  it("discard pair with 3 cards is valid, when card numbers are same", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.HEARTS, 6)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 3 cards is valid, when considered jokers and card numbers are same", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.JOKER, 0),
      Card.createCard(Card.CardMark.HEARTS, 6)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 3 cards is invalid, when card numbers are different", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.HEARTS, 5)
    );
    expect(csp1.isValid()).toBeFalsy();
  });

  it("kaidan with 3 cards is valid", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 7),
      Card.createCard(Card.CardMark.DIAMONDS, 8)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 4 cards is valid, when card numbers are same", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.HEARTS, 6),
      Card.createCard(Card.CardMark.HEARTS, 6)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 4 cards is valid, when cards are kaidan", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 7),
      Card.createCard(Card.CardMark.DIAMONDS, 8),
      Card.createCard(Card.CardMark.DIAMONDS, 9)
    );
    expect(csp1.isValid()).toBeTruthy();
  });

  it("discard pair with 4 cards is valid, when kaidan marks do not match", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.SPADES, 7),
      Card.createCard(Card.CardMark.DIAMONDS, 8),
      Card.createCard(Card.CardMark.DIAMONDS, 9)
    );
    expect(csp1.isValid()).toBeFalsy();
  });

  it("discard pair with 4 cards is valid, when kaidan numbers do not match", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 1),
      Card.createCard(Card.CardMark.DIAMONDS, 8),
      Card.createCard(Card.CardMark.DIAMONDS, 9)
    );
    expect(csp1.isValid()).toBeFalsy();
  });

  it("discard pair with 4 cards is valid, when kaidan can be created with a joker", () => {
    const csp1 = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 6),
      Card.createCard(Card.CardMark.DIAMONDS, 9),
      Card.createCard(Card.CardMark.DIAMONDS, 8),
      Card.createCard(Card.CardMark.JOKER, 0)
    );
    expect(csp1.isValid()).toBeTruthy();
  });
});
