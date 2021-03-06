import * as Card from "../src/card";

describe("Card", () => {
  it("Can be instantiated", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 3);
    expect(c1.mark).toBe(Card.CardMark.SPADES);
    expect(c1.cardNumber).toBe(3);
    const c2 = Card.createCard(Card.CardMark.JOKER);
    expect(c2.mark).toBe(Card.CardMark.JOKER);
    expect(c2.cardNumber).toBe(0);
    const c3 = Card.createCard(Card.CardMark.CLUBS, 13);
    expect(c3.mark).toBe(Card.CardMark.CLUBS);
    expect(c3.cardNumber).toBe(13);
  });

  it("automatically generates ID", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 3);
    expect(c1.ID.length).not.toBe(0);
  });

  it("Cannot be instantiated when card spec is invalid", () => {
    expect(() => {
      return Card.createCard(Card.CardMark.SPADES, -1);
    }).toThrow("card number range must be 0(joker) to 13");
    expect(() => {
      return Card.createCard(Card.CardMark.SPADES, 14);
    }).toThrow("card number range must be 0(joker) to 13");
    expect(() => {
      return Card.createCard(Card.CardMark.JOKER, 1);
    }).toThrow("card number must be 0 when it is a joker");
    expect(() => {
      return Card.createCard(Card.CardMark.SPADES, 0);
    }).toThrow("card number must not be 0 when it is not a joker");
  });

  it("Can identify same cards", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 3);
    const c2 = Card.createCard(Card.CardMark.SPADES, 3);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 3);
    expect(c1.isSameCard(c2)).toBeTruthy();
    expect(c1.isSameCard(c3)).toBeFalsy();
  });

  it("Can identify wildcarded card as same from a joker", () => {
    const c1 = Card.createCard(Card.CardMark.JOKER);
    const c2 = Card.createCard(Card.CardMark.WILD, 3);
    expect(c1.isSameCard(c2)).toBeTruthy();
  });

  it("diamonds and diamonds are same mark", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    expect(c1.isSameMark(c2)).toBeTruthy();
  });

  it("diamonds and hearts are same mark", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c2 = Card.createCard(Card.CardMark.HEARTS, 5);
    expect(c1.isSameMark(c2)).toBeFalsy();
  });

  it("wildcarded cards can be considered as any card mark", () => {
    const c1 = Card.createCard(Card.CardMark.WILD, 5);
    const c2 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    expect(c1.isSameMark(c2)).toBeTruthy();
  });

  it("Can identify joker", () => {
    const c1 = Card.createCard(Card.CardMark.JOKER);
    const c2 = Card.createCard(Card.CardMark.SPADES, 3);
    expect(c1.isJoker()).toBeTruthy();
    expect(c2.isJoker()).toBeFalsy();
  });

  it("Can get a copy", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 3);
    c1.flagAsWildcard();
    const c2 = c1.copy();
    expect(c1.mark).toBe(c2.mark);
    expect(c1.cardNumber).toBe(c2.cardNumber);
  });

  it("Can flag as a wildcard and check its wildcard status", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 3);
    const c1r = c1.flagAsWildcard();
    expect(c1.mark).toBe(Card.CardMark.WILD);
    expect(c1).toBe(c1r);
  });
});
