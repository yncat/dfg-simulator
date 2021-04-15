import { CardPair } from "../src/cardPair";

describe("CardPair", () => {
  it("can be instantiated", () => {
    const p1 = new CardPair(1, 1);
    const p2 = new CardPair(1, 4);
    const p3 = new CardPair(13, 1);
    const p4 = new CardPair(13, 4);
    expect(p1).toBeTruthy();
    expect(p2).toBeTruthy();
    expect(p3).toBeTruthy();
    expect(p4).toBeTruthy();
  });

  it("cannot be instantiated when card number is out of range", () => {
    expect(() => {
      return new CardPair(-1, 2);
    }).toThrow("card number range must be 0(joker) to 13");
    expect(() => {
      return new CardPair(14, 2);
    }).toThrow("card number range must be 0(joker) to 13");
  });

  it("cannot be instantiated when card count is out of range", () => {
    expect(() => {
      return new CardPair(3, 0);
    }).toThrow("card count range must be 1 to 4");
    expect(() => {
      return new CardPair(3, 5);
    }).toThrow("card count range must be 1 to 4");
  });
});
