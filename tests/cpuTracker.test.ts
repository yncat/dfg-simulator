import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";
import * as CpuTracker from "../src/cpuTracker";
import { c } from "./cpuHelper";

const { CLUBS, HEARTS, SPADES, JOKER } = Card.CardMark;

function pair(...cards: Card.Card[]) {
  return CardSelection.CreateCardSelectionPairForTest(...cards);
}

describe("CardTracker", () => {
  it("tracks hand counts of other players", () => {
    const t = new CpuTracker.CardTracker();
    t.onCardsProvided("a", 5);
    t.onCardsProvided("b", 5);
    t.onCardsProvided("c", 5);
    t.onDiscard("b", pair(c(CLUBS, 3)), 4);
    t.onTransfer("c", "a", pair(c(CLUBS, 7)));
    t.onExile("b", pair(c(CLUBS, 10)));
    expect(t.getHandCount("a")).toBe(6);
    expect(t.getHandCount("b")).toBe(3);
    expect(t.getHandCount("c")).toBe(4);
    expect(t.enumerateOpponentHandCounts("a").sort()).toStrictEqual([3, 4]);
  });

  it("excludes players who finished or were kicked", () => {
    const t = new CpuTracker.CardTracker();
    t.onCardsProvided("a", 1);
    t.onCardsProvided("b", 1);
    t.onCardsProvided("c", 1);
    t.onDiscard("b", pair(c(CLUBS, 3)), 0);
    t.onPlayerKicked("c");
    expect(t.enumerateOpponentHandCounts("a")).toStrictEqual([]);
  });

  it("calculates unseen cards based on the memory level", () => {
    const t = new CpuTracker.CardTracker();
    t.onDiscard("b", pair(c(CLUBS, 5)), 4);
    t.onDiscard("b", pair(c(SPADES, 2)), 3);
    t.onDiscard("b", pair(c(HEARTS, 9), c(HEARTS, 9).flagAsWildcard()), 1);
    const myHand = [c(CLUBS, 3)];

    const none = t.calcUnseenCards(myHand, "none");
    expect(none.count(CLUBS, 3)).toBe(0);
    expect(none.count(CLUBS, 5)).toBe(1);
    expect(none.count(SPADES, 2)).toBe(1);
    expect(none.countJokers()).toBe(2);

    const strong = t.calcUnseenCards(myHand, "strong");
    expect(strong.count(CLUBS, 5)).toBe(1);
    expect(strong.count(SPADES, 2)).toBe(0);
    expect(strong.countJokers()).toBe(1);

    const full = t.calcUnseenCards(myHand, "full");
    expect(full.count(CLUBS, 5)).toBe(0);
    expect(full.count(HEARTS, 9)).toBe(0);
    expect(full.countJokers()).toBe(1);
  });

  it("uses the deck count given by the game", () => {
    const t = new CpuTracker.CardTracker();
    t.onInitialInfoProvided(8, 2);
    expect(t.getDeckCount()).toBe(2);
    expect(t.calcUnseenCards([c(JOKER)], "full").countJokers()).toBe(3);
  });
});
