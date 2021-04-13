import * as Card from "../src/card";

describe("Card", () => {
  it("Can be instantiated", () => {
    const c = new Card.Card(Card.Mark.SPADES, 3);
    expect(c.mark).toBe(Card.Mark.SPADES);
    expect(c.cardNumber).toBe(3);
  });
});
