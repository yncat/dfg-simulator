import { hasJSDocParameterTags } from "typescript";
import * as Card from "../src/card";
import * as Hand from "../src/hand";

describe("Hand", () => {
  it("Can be instantiated", () => {
    const h = new Hand.Hand();
    expect(h.cards.length).toBe(0);
  });

  it("Can give a single card", () => {
    const h = new Hand.Hand();
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(h.cards.length).toBe(1);
  });

  describe("when giving multiple cards", () => {
    it("same marks and different numbers", () => {
      const c1 = new Card.Card(Card.Mark.SPADES, 3);
      const c2 = new Card.Card(Card.Mark.SPADES, 4);
      const h = new Hand.Hand();
      h.giveCards(c1, c2);
      expect(h.cards.length).toBe(2);
      expect(h.cards).toStrictEqual([c1, c2]);
    });

    it("different marks", () => {
      const c1 = new Card.Card(Card.Mark.SPADES, 3);
      const c2 = new Card.Card(Card.Mark.CLUBS, 4);
      const h = new Hand.Hand();
      h.giveCards(c1, c2);
      expect(h.cards.length).toBe(2);
      expect(h.cards).toStrictEqual([c2, c1]); // CLUBS first
    });

    it("with jokers", () => {
      const c1 = new Card.Card(Card.Mark.JOKER);
      const c2 = new Card.Card(Card.Mark.SPADES, 5);
      const h = new Hand.Hand();
      h.giveCards(c1, c2);
      expect(h.cards.length).toBe(2);
      expect(h.cards).toStrictEqual([c2, c1]); // JOKER first
    });
  });

  it("with many cards", () => {
    const c1 = new Card.Card(Card.Mark.JOKER);
    const c2 = new Card.Card(Card.Mark.SPADES, 5);
    const c3 = new Card.Card(Card.Mark.SPADES, 4);
    const c4 = new Card.Card(Card.Mark.HEARTS, 9);
    const c5 = new Card.Card(Card.Mark.CLUBS, 1);
    const h = new Hand.Hand();
    h.giveCards(c1, c2, c3, c4, c5);
    expect(h.cards.length).toBe(5);
    expect(h.cards).toStrictEqual([c5, c4, c3, c2, c1]);
  });
});
