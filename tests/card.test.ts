import { isExportDeclaration } from "typescript";
import * as Card from "../src/card";

describe("Card", () => {
  it("Can be instantiated", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 3);
    expect(c1.mark).toBe(Card.CardMark.SPADES);
    expect(c1.cardNumber).toBe(3);
    const c2 = new Card.Card(Card.CardMark.JOKER);
    expect(c2.mark).toBe(Card.CardMark.JOKER);
    expect(c2.cardNumber).toBe(0);
    const c3 = new Card.Card(Card.CardMark.CLUBS, 13);
    expect(c3.mark).toBe(Card.CardMark.CLUBS);
    expect(c3.cardNumber).toBe(13);
  });

  it("Cannot be instantiated when card spec is invalid", () => {
    expect(() => {
      return new Card.Card(Card.CardMark.SPADES, -1);
    }).toThrow("card number range must be 0(joker) to 13");
    expect(() => {
      return new Card.Card(Card.CardMark.SPADES, 14);
    }).toThrow("card number range must be 0(joker) to 13");
    expect(() => {
      return new Card.Card(Card.CardMark.JOKER, 1);
    }).toThrow("card number must be 0 when it is a joker");
    expect(() => {
      return new Card.Card(Card.CardMark.SPADES, 0);
    }).toThrow("card number must not be 0 when it is not a joker");
  });

  it("Can identify same cards", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 3);
    const c2 = new Card.Card(Card.CardMark.SPADES, 3);
    const c3 = new Card.Card(Card.CardMark.DIAMONDS, 3);
    expect(c1.isSameFrom(c2)).toBeTruthy();
    expect(c1.isSameFrom(c3)).toBeFalsy();
  });

  it("Can identify joker", () => {
    const c1 = new Card.Card(Card.CardMark.JOKER);
    const c2 = new Card.Card(Card.CardMark.SPADES, 3);
    expect(c1.isJoker()).toBeTruthy();
    expect(c2.isJoker()).toBeFalsy();
  });

  it("Can get a copy", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 3);
    c1.flagAsWildcard();
    const c2 = c1.copy();
    expect(c1.mark).toBe(c2.mark);
    expect(c1.cardNumber).toBe(c2.cardNumber);
    expect(c1.isWildcard()).toBe(c2.isWildcard());
  });

  it("Can flag as a wildcard and check its wildcard status", () => {
    const c1 = new Card.Card(Card.CardMark.SPADES, 3);
    expect(c1.isWildcard()).toBeFalsy();
    c1.flagAsWildcard();
    expect(c1.isWildcard()).toBeTruthy();
  });
});
