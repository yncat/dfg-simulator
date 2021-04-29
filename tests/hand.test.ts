import * as Card from "../src/card";
import * as Hand from "../src/hand";

describe("Hand", () => {
  it("Can be instantiated", () => {
    const h = new Hand.Hand();
    expect(h).toBeTruthy();
  });
});

describe("giveCard", () => {
  it("Can give a single card", () => {
    const h = new Hand.Hand();
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
  });

  describe("when giving multiple cards", () => {
    it("same marks and different numbers", () => {
      const c1 = new Card.Card(Card.Mark.SPADES, 3);
      const c2 = new Card.Card(Card.Mark.SPADES, 4);
      const h = new Hand.Hand();
      h.giveCards(c1, c2);
      expect(h.cards).toStrictEqual([c1, c2]);
    });

    it("different marks", () => {
      const c1 = new Card.Card(Card.Mark.SPADES, 5);
      const c2 = new Card.Card(Card.Mark.CLUBS, 4);
      const h = new Hand.Hand();
      h.giveCards(c1, c2);
      expect(h.cards).toStrictEqual([c2, c1]);
    });

    it("considers card strength", () => {
      const c1 = new Card.Card(Card.Mark.SPADES, 3);
      const c2 = new Card.Card(Card.Mark.CLUBS, 2);
      const h = new Hand.Hand();
      h.giveCards(c1, c2);
      expect(h.cards).toStrictEqual([c1, c2]);
    });

    it("with jokers", () => {
      const c1 = new Card.Card(Card.Mark.JOKER);
      const c2 = new Card.Card(Card.Mark.SPADES, 5);
      const h = new Hand.Hand();
      h.giveCards(c1, c2);
      expect(h.cards).toStrictEqual([c2, c1]);
    });

    it("with many cards", () => {
      const c1 = new Card.Card(Card.Mark.JOKER);
      const c2 = new Card.Card(Card.Mark.SPADES, 13);
      const c3 = new Card.Card(Card.Mark.SPADES, 12);
      const c4 = new Card.Card(Card.Mark.HEARTS, 11);
      const c5 = new Card.Card(Card.Mark.CLUBS, 10);
      const h = new Hand.Hand();
      h.giveCards(c1, c2, c3, c4, c5);
      expect(h.cards).toStrictEqual([c5, c4, c3, c2, c1]);
    });
  });
});

describe("count", () => {
  it("Can be counted", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(h1.count()).toBe(1);
    const h2 = new Hand.Hand();
    h2.giveCards(
      new Card.Card(Card.Mark.SPADES, 3),
      new Card.Card(Card.Mark.DIAMONDS, 4)
    );
    expect(h2.count()).toBe(2);
  });
});

describe("countCardWithSpecifiedNumber", () => {
  it("can count cards which have specified card number", () => {
    const h1 = new Hand.Hand();
    const h2 = new Hand.Hand();
    h2.giveCards(
      new Card.Card(Card.Mark.SPADES, 4),
      new Card.Card(Card.Mark.DIAMONDS, 4),
      new Card.Card(Card.Mark.HEARTS, 6)
    );
    expect(h1.countCardsWithSpecifiedNumber(4)).toBe(0);
    expect(h2.countCardsWithSpecifiedNumber(4)).toBe(2);
  });
});

describe("countJokers", () => {
  it("can count jokers", () => {
    const h1 = new Hand.Hand();
    const h2 = new Hand.Hand();
    h2.giveCards(
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.DIAMONDS, 4)
    );
    expect(h1.countJokers()).toBe(0);
    expect(h2.countJokers()).toBe(2);
  });
});
