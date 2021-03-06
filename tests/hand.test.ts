import * as Card from "../src/card";
import * as Hand from "../src/hand";

describe("Hand", () => {
  it("Can be instantiated", () => {
    const h = Hand.createHand();
    expect(h).toBeTruthy();
  });
});

describe("giveCard", () => {
  it("Can give a single card", () => {
    const h = Hand.createHand();
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(h.count()).toBe(1);
  });

  it("Can give multiple cards", () => {
    const h = Hand.createHand();
    h.give(
      Card.createCard(Card.CardMark.SPADES, 3),
      Card.createCard(Card.CardMark.DIAMONDS, 4)
    );
    expect(h.count()).toBe(2);
  });
});

describe("sort", () => {
  it("same marks and different numbers", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 3);
    const c2 = Card.createCard(Card.CardMark.SPADES, 4);
    const h = Hand.createHand();
    h.give(c1, c2);
    h.sort();
    expect(h.cards).toStrictEqual([c1, c2]);
  });

  it("different marks", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 5);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 4);
    const h = Hand.createHand();
    h.give(c1, c2);
    h.sort();
    expect(h.cards).toStrictEqual([c2, c1]);
  });

  it("considers card strength", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 3);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 2);
    const h = Hand.createHand();
    h.give(c1, c2);
    h.sort();
    expect(h.cards).toStrictEqual([c1, c2]);
  });

  it("with jokers", () => {
    const c1 = Card.createCard(Card.CardMark.JOKER);
    const c2 = Card.createCard(Card.CardMark.SPADES, 5);
    const h = Hand.createHand();
    h.give(c1, c2);
    h.sort();
    expect(h.cards).toStrictEqual([c2, c1]);
  });

  it("with many cards", () => {
    const c1 = Card.createCard(Card.CardMark.JOKER);
    const c2 = Card.createCard(Card.CardMark.SPADES, 13);
    const c3 = Card.createCard(Card.CardMark.SPADES, 12);
    const c4 = Card.createCard(Card.CardMark.HEARTS, 11);
    const c5 = Card.createCard(Card.CardMark.CLUBS, 10);
    const h = Hand.createHand();
    h.give(c1, c2, c3, c4, c5);
    h.sort();
    expect(h.cards).toStrictEqual([c5, c4, c3, c2, c1]);
  });
});

describe("count", () => {
  it("Can be counted", () => {
    const h1 = Hand.createHand();
    h1.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(h1.count()).toBe(1);
    const h2 = Hand.createHand();
    h2.give(
      Card.createCard(Card.CardMark.SPADES, 3),
      Card.createCard(Card.CardMark.DIAMONDS, 4)
    );
    expect(h2.count()).toBe(2);
  });
});

describe("countCardWithSpecifiedNumber", () => {
  it("can count cards which have specified card number", () => {
    const h1 = Hand.createHand();
    const h2 = Hand.createHand();
    h2.give(
      Card.createCard(Card.CardMark.SPADES, 4),
      Card.createCard(Card.CardMark.DIAMONDS, 4),
      Card.createCard(Card.CardMark.HEARTS, 6)
    );
    expect(h1.countCardsWithSpecifiedNumber(4)).toBe(0);
    expect(h2.countCardsWithSpecifiedNumber(4)).toBe(2);
  });
});

describe("countCardWithSpecifiedMarkAndNumber", () => {
  it("can count cards which have specified mark and card number", () => {
    const h1 = Hand.createHand();
    const h2 = Hand.createHand();
    h2.give(
      Card.createCard(Card.CardMark.SPADES, 4),
      Card.createCard(Card.CardMark.DIAMONDS, 4)
    );
    expect(
      h1.countCardsWithSpecifiedMarkAndNumber(Card.CardMark.SPADES, 4)
    ).toBe(0);
    expect(
      h2.countCardsWithSpecifiedMarkAndNumber(Card.CardMark.SPADES, 4)
    ).toBe(1);
  });
});

describe("countJokers", () => {
  it("can count jokers", () => {
    const h1 = Hand.createHand();
    const h2 = Hand.createHand();
    h2.give(
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.DIAMONDS, 4)
    );
    expect(h1.countJokers()).toBe(0);
    expect(h2.countJokers()).toBe(2);
  });
});

describe("take", () => {
  it("can take cards from the hand", () => {
    const h = Hand.createHand();
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    // nonexistent card should be ignored
    const c4 = Card.createCard(Card.CardMark.DIAMONDS, 10);
    // It should remove cards properly even if the specified card is another instance of the same card.
    const c22 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    h.give(c1, c2, c3);
    h.take(c1, c22, c4);
    expect(h.cards.length).toBe(1);
    expect(h.cards).toStrictEqual([c3]);
  });

  it("can take a joker when wildcard is found", () => {
    const h = Hand.createHand();
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const c4 = Card.createCard(Card.CardMark.JOKER);
    const c4w = Card.createCard(Card.CardMark.WILD, 10);
    h.give(c1, c2, c3, c4);
    h.take(c1, c2, c3, c4w);
    expect(h.cards.length).toBe(0);
  });
});
