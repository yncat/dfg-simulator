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
  });
});
