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

  describe("checking a single card", () => {
    it("returns SUCCESS when the last discard is null", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest();
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.SUCCESS);
    });

    it("returns SUCCESS when checking a 3 of spades and the last discard is a joker", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.JOKER)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.SUCCESS);
    });

    it("returns SUCCESS when checking a single joker and the last discard is an weaker card", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.CLUBS, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.SUCCESS);
    });

    it("returns NOT_CHECKABLE when checking a single joker and the last discard is also a joker", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.CLUBS, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.SUCCESS);
    });

    it("returns NOT_CHECKABLE when checking a single card and the last discard is stronger", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.SPADES, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.NOT_CHECKABLE);
    });

    it("returns NOT_CHECKABLE when checking a single card and the last discard is a single joker", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.JOKER)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.NOT_CHECKABLE);
    });

    describe("when the last discard pair is more than 2 pairs", ()=>{
      it("returns SUCCESS when the last discard is two-card pair and you have a required pair of stronger cards", ()=>{
        const h = new Hand();
        h.giveCards(
          new Card.Card(Card.Mark.SPADES,6),
          new Card.Card(Card.Mark.SPADES,6)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES,4)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.checkIfPossible(0)).toBe(Discard.CheckResult.SUCCESS);
      });
    });
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
