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

describe("isSelectable", () => {
  it("returns NOT_SELECTABLE when index is out of range", () => {
    const h = new Hand();
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    expect(p.isSelectable(-1)).toBe(
      Discard.SelectableCheckResult.NOT_SELECTABLE
    );
    expect(p.isSelectable(1)).toBe(
      Discard.SelectableCheckResult.NOT_SELECTABLE
    );
  });

  describe("checking a single card", () => {
    it("returns SELECTABLE when the last discard is null", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest();
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns SELECTABLE when checking a 3 of spades and the last discard is a joker", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.JOKER)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns SELECTABLE when checking a single joker and the last discard is an weaker card", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.CLUBS, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns NOT_SELECTABLE when checking a single joker and the last discard is also a joker", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.CLUBS, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns NOT_SELECTABLE when checking a single card and the last discard is stronger", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.SPADES, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(
        Discard.SelectableCheckResult.NOT_SELECTABLE
      );
    });

    it("returns NOT_SELECTABLE when checking a single card and the last discard is a single joker", () => {
      const h = new Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.JOKER)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(
        Discard.SelectableCheckResult.NOT_SELECTABLE
      );
    });

    describe("when the last discard pair is more than 2 pairs", () => {
      it("returns SELECTABLE when the last discard is two-card pair and you have a required pair of stronger cards", () => {
        const h = new Hand();
        h.giveCards(
          new Card.Card(Card.Mark.SPADES, 6),
          new Card.Card(Card.Mark.SPADES, 6)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.SPADES, 4)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair and you have a stronger card and joker", () => {
        const h = new Hand();
        h.giveCards(
          new Card.Card(Card.Mark.SPADES, 6),
          new Card.Card(Card.Mark.JOKER)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.SPADES, 4)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is two-card pair and you only have weaker pair", () => {
        const h = new Hand();
        h.giveCards(
          new Card.Card(Card.Mark.SPADES, 6),
          new Card.Card(Card.Mark.SPADES, 6)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 8),
          new Card.Card(Card.Mark.SPADES, 8)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.NOT_SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is two-card pair and you have one of the checking stronger cards only", () => {
        const h = new Hand();
        h.giveCards(new Card.Card(Card.Mark.SPADES, 6));
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.SPADES, 4)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.NOT_SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair and you have two jokers 01", () => {
        const h = new Hand();
        h.giveCards(
          new Card.Card(Card.Mark.JOKER),
          new Card.Card(Card.Mark.JOKER)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.SPADES, 4)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair and you have two jokers 02", () => {
        const h = new Hand();
        h.giveCards(
          new Card.Card(Card.Mark.JOKER),
          new Card.Card(Card.Mark.JOKER)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 2),
          new Card.Card(Card.Mark.SPADES, 2)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is a kaidan and you have stronger kaidan cards", () => {
        const h = new Hand();
        h.giveCards(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.SPADES, 5),
          new Card.Card(Card.Mark.SPADES, 6)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 3),
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.SPADES, 5)
        );
        const p = new Discard.discardPlanner(h, d, false);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        /*
        expect(p.isSelectable(1)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        expect(p.isSelectable(2)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        */
      });
    });
  });
});

/*
describe("CountCheckedCards", () => {
  it("can count checked cards", () => {
    const h = new Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.countSelectedCards()).toBe(0);
    expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    expect(p.countCheckedCards()).toBe(1);
  });
});
*/
