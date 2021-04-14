import * as Card from "../src/card";

describe("Card", () => {
  it("Can be instantiated", () => {
    const c1 = new Card.Card(Card.Mark.SPADES, 3);
    expect(c1.mark).toBe(Card.Mark.SPADES);
    expect(c1.cardNumber).toBe(3);
    const c2 = new Card.Card(Card.Mark.JOKER);
    expect(c2.mark).toBe(Card.Mark.JOKER);
    expect(c2.cardNumber).toBe(0);
    const c3 = new Card.Card(Card.Mark.CLUBS, 13);
    expect(c3.mark).toBe(Card.Mark.CLUBS);
    expect(c3.cardNumber).toBe(13);
  });

  it("Cannot be instantiated when card spec is invalid", () => {
    expect(() => {
      return new Card.Card(Card.Mark.SPADES, -1);
    }).toThrow("card number range must be 0(joker) to 13");
    expect(() => {
      return new Card.Card(Card.Mark.SPADES, 14);
    }).toThrow("card number range must be 0(joker) to 13");
    expect(() => {
      return new Card.Card(Card.Mark.JOKER, 1);
    }).toThrow("card number must be 0 when it is a joker");
    expect(() => {
      return new Card.Card(Card.Mark.SPADES, 0);
    }).toThrow("card number must not be 0 when it is not a joker");
  });

  it("Can identify same cards", () => {
    const c1 = new Card.Card(Card.Mark.SPADES, 3);
    const c2 = new Card.Card(Card.Mark.SPADES, 3);
    const c3 = new Card.Card(Card.Mark.DIAMONDS, 3);
    expect(c1.isSameFrom(c2)).toBeTruthy();
    expect(c1.isSameFrom(c3)).toBeFalsy();
  });

  it("Can identify joker", () => {
    const c1 = new Card.Card(Card.Mark.JOKER);
    const c2 = new Card.Card(Card.Mark.SPADES, 3);
    expect(c1.isJoker()).toBeTruthy();
    expect(c2.isJoker()).toBeFalsy();
  });
});
