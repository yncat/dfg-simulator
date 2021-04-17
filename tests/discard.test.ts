import * as Card from "../src/card";
import * as Discard from "../src/discard";
import { Hand } from "../src/hand";

describe("DiscardPlanner", () => {
  it("can be instantiated", () => {
    const h = new Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    expect(p).toBeTruthy();
  });
});

describe("CheckIfPossible", () => {
  it("returns NOT_CHECKABLE when index is out of range", () => {
    const h = new Hand();
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    expect(p.checkIfPossible(-1)).toBe(Discard.CheckResult.NOT_CHECKABLE);
    expect(p.checkIfPossible(1)).toBe(Discard.CheckResult.NOT_CHECKABLE);
  });

  it("returns ALREADY_CHECKED when the item is already checked", () => {
    const h = new Hand();
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.SUCCESS);
    expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.ALREADY_CHECKED);
  });
});

describe("CountCheckedCards", () => {
  it("can count checked cards", () => {
    const h = new Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.countCheckedCards()).toBe(0);
    expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.SUCCESS);
    expect(p.countCheckedCards()).toBe(1);
  });
});
