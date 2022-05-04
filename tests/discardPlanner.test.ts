import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Hand from "../src/hand";

function createDiscardStackFixture(
  ...cards: Card.Card[]
): Discard.DiscardStack {
  const dp = Discard.CreateDiscardPairForTest(...cards);
  const ds = Discard.createDiscardStack();
  ds.push(dp);
  return ds;
}

describe("DiscardPlanner", () => {
  it("can be instantiated", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    expect(p).toBeTruthy();
  });
});

describe("checkSelectability", () => {
  it("returns NOT_SELECTABLE when index is out of range", () => {
    const h = Hand.createHand();
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    expect(p.checkSelectability(-1)).toBe(
      Discard.SelectabilityCheckResult.NOT_SELECTABLE
    );
    expect(p.checkSelectability(1)).toBe(
      Discard.SelectabilityCheckResult.NOT_SELECTABLE
    );
  });

  describe("checking a single card", () => {
    it("returns SELECTABLE when the last discard is null", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.SPADES, 3));
      const ds = Discard.createDiscardStack();
      const p = new Discard.DiscardPlanner(h, ds, false);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.SELECTABLE
      );
    });

    it("returns SELECTABLE when checking a 3 of spades and the last discard is a joker", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.SPADES, 3));
      const d = createDiscardStackFixture(Card.createCard(Card.CardMark.JOKER));
      const p = new Discard.DiscardPlanner(h, d, false);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.SELECTABLE
      );
    });

    it("returns NOT_SELECTABLE when the last discard is a 3 of spades which negated a joker", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.SPADES, 5));
      h.give(Card.createCard(Card.CardMark.JOKER));
      const ds = Discard.createDiscardStack();
      ds.push(
        Discard.CreateDiscardPairForTest(Card.createCard(Card.CardMark.JOKER))
      );
      ds.push(
        Discard.CreateDiscardPairForTest(
          Card.createCard(Card.CardMark.SPADES, 3)
        )
      );
      const p = new Discard.DiscardPlanner(h, ds, false);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.NOT_SELECTABLE
      );
      expect(p.checkSelectability(1)).toBe(
        Discard.SelectabilityCheckResult.NOT_SELECTABLE
      );
    });

    it("returns SELECTABLE when checking a single joker and the last discard is an weaker card", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.JOKER));
      const ds = createDiscardStackFixture(
        Card.createCard(Card.CardMark.CLUBS, 2)
      );
      const p = new Discard.DiscardPlanner(h, ds, false);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.SELECTABLE
      );
    });

    it("returns NOT_SELECTABLE when checking a single joker and the last discard is also a joker", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.JOKER));
      const ds = createDiscardStackFixture(
        Card.createCard(Card.CardMark.CLUBS, 2)
      );
      const p = new Discard.DiscardPlanner(h, ds, false);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.SELECTABLE
      );
    });

    it("returns NOT_SELECTABLE when checking a single card and the last discard is stronger", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.SPADES, 3));
      const ds = createDiscardStackFixture(
        Card.createCard(Card.CardMark.SPADES, 2)
      );
      const p = new Discard.DiscardPlanner(h, ds, false);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.NOT_SELECTABLE
      );
    });

    it("returns NOT_SELECTABLE when checking a single card and the last discard is a single joker", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.JOKER));
      const ds = createDiscardStackFixture(
        Card.createCard(Card.CardMark.JOKER)
      );
      const p = new Discard.DiscardPlanner(h, ds, false);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.NOT_SELECTABLE
      );
    });

    describe("when the last discard pair is more than 2 pairs", () => {
      it("returns SELECTABLE when the last discard is two-card pair and you have a required pair of stronger cards", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 6),
          Card.createCard(Card.CardMark.SPADES, 6)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 4)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair and you have a stronger card and joker", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 6),
          Card.createCard(Card.CardMark.JOKER)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 4)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is two-card pair and you only have weaker pair", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 6),
          Card.createCard(Card.CardMark.SPADES, 6)
        );
        const d = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 8),
          Card.createCard(Card.CardMark.SPADES, 8)
        );
        const p = new Discard.DiscardPlanner(h, d, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is two-card pair and you have one of the checking stronger cards only", () => {
        const h = Hand.createHand();
        h.give(Card.createCard(Card.CardMark.SPADES, 6));
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 4)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair and you have two jokers 01", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.JOKER),
          Card.createCard(Card.CardMark.JOKER)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 4)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair and you have two jokers 02", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.JOKER),
          Card.createCard(Card.CardMark.JOKER)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 2),
          Card.createCard(Card.CardMark.SPADES, 2)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is null and tried a kaidan combination", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const ds = Discard.createDiscardStack();
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(2)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is a kaidan and you have stronger kaidan cards", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5),
          Card.createCard(Card.CardMark.SPADES, 6)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(2)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is a kaidan and you have stronger kaidan cards including a joker", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5),
          Card.createCard(Card.CardMark.JOKER)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(2)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is a kaidan and you have stronger kaidan cards including a joker in the middle of the kaidan", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.JOKER),
          Card.createCard(Card.CardMark.SPADES, 6)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(2)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });
    });

    describe("checking the second card", () => {
      it("returns SELECTABLE when the last discard is null and selecting the same numbered cards from the previously selected one", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.HEARTS, 5),
          Card.createCard(Card.CardMark.DIAMONDS, 5)
        );
        const ds = createDiscardStackFixture();
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair and selecting the same numberd cards from the previously selected one", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.HEARTS, 5),
          Card.createCard(Card.CardMark.DIAMONDS, 5)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.CLUBS, 4)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair, selecting a joker and trying to select stronger numbered card", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.DIAMONDS, 5),
          Card.createCard(Card.CardMark.JOKER)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.CLUBS, 4)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(2);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is three-card kaidan, selecting a joker and trying to select stronger numbered card", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5),
          Card.createCard(Card.CardMark.JOKER)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(2);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is three-card kaidan, selecting a joker and trying to select stronger but not sequenced numbered card", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.DIAMONDS, 5),
          Card.createCard(Card.CardMark.HEARTS, 10),
          Card.createCard(Card.CardMark.JOKER)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.CLUBS, 4),
          Card.createCard(Card.CardMark.HEARTS, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(3);
        expect(p.checkSelectability(2)).toBe(
          Discard.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is three-card kaidan, selecting a numbered card and trying to select sequenced numbered cards", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5),
          Card.createCard(Card.CardMark.SPADES, 6)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(2)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is three-card kaidan, selecting a numbered card and trying to select stronger but not sequenced numbered cards", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.DIAMONDS, 5),
          Card.createCard(Card.CardMark.HEARTS, 6),
          Card.createCard(Card.CardMark.CLUBS, 8)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.CLUBS, 4),
          Card.createCard(Card.CardMark.HEARTS, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(3)).toBe(
          Discard.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is three-card kaidan, selecting a numbered card and joker, and trying to select not sequenced numbered card which can be sequenced by using the joker", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.JOKER),
          Card.createCard(Card.CardMark.SPADES, 6)
        );
        const ds = createDiscardStackFixture(
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        p.select(1);
        expect(p.checkSelectability(2)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is null, selecting a numbered card and trying to select not fully-sequenced card", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.SPADES, 4),
          Card.createCard(Card.CardMark.SPADES, 5)
        );
        const ds = Discard.createDiscardStack();
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("special case: found during testing 1", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.HEARTS, 3),
          Card.createCard(Card.CardMark.DIAMONDS, 3),
          Card.createCard(Card.CardMark.SPADES, 3),
          Card.createCard(Card.CardMark.CLUBS, 4),
          Card.createCard(Card.CardMark.CLUBS, 5),
          Card.createCard(Card.CardMark.DIAMONDS, 5),
          Card.createCard(Card.CardMark.HEARTS, 5),
          Card.createCard(Card.CardMark.CLUBS, 6),
          Card.createCard(Card.CardMark.SPADES, 7),
          Card.createCard(Card.CardMark.CLUBS, 8),
          Card.createCard(Card.CardMark.SPADES, 8),
          Card.createCard(Card.CardMark.HEARTS, 9),
          Card.createCard(Card.CardMark.SPADES, 9),
          Card.createCard(Card.CardMark.DIAMONDS, 9),
          Card.createCard(Card.CardMark.CLUBS, 9),
          Card.createCard(Card.CardMark.DIAMONDS, 10),
          Card.createCard(Card.CardMark.HEARTS, 10),
          Card.createCard(Card.CardMark.HEARTS, 11),
          Card.createCard(Card.CardMark.DIAMONDS, 11),
          Card.createCard(Card.CardMark.CLUBS, 11),
          Card.createCard(Card.CardMark.CLUBS, 12),
          Card.createCard(Card.CardMark.SPADES, 12),
          Card.createCard(Card.CardMark.DIAMONDS, 13),
          Card.createCard(Card.CardMark.CLUBS, 13),
          Card.createCard(Card.CardMark.SPADES, 1),
          Card.createCard(Card.CardMark.CLUBS, 2),
          Card.createCard(Card.CardMark.JOKER, 0)
        );
        const ds = createDiscardStackFixture();
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(3)).toBe(
          Discard.SelectabilityCheckResult.NOT_SELECTABLE
        );
        p.deselect(0);
        p.select(2);
        expect(p.checkSelectability(0)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("special case: checking a numbered card after joker when last discard pair is null", () => {
        const h = Hand.createHand();
        h.give(
          Card.createCard(Card.CardMark.JOKER, 0),
          Card.createCard(Card.CardMark.DIAMONDS, 6)
        );
        const ds = createDiscardStackFixture();
        const p = new Discard.DiscardPlanner(h, ds, false);
        p.select(0);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.SELECTABLE
        );
        p.select(1);
        expect(p.checkSelectability(1)).toBe(
          Discard.SelectabilityCheckResult.ALREADY_SELECTED
        );
      });
    });
  });

  describe("when strength is inverted", () => {
    // just testing that strength invert is correctly passed. Main logic tests are all above.
    it("returns SELECTABLE when checking a single card and the last discard is weaker", () => {
      const h = Hand.createHand();
      h.give(Card.createCard(Card.CardMark.SPADES, 3));
      const ds = createDiscardStackFixture(
        Card.createCard(Card.CardMark.SPADES, 2)
      );
      const p = new Discard.DiscardPlanner(h, ds, true);
      expect(p.checkSelectability(0)).toBe(
        Discard.SelectabilityCheckResult.SELECTABLE
      );
    });
  });
});

describe("isSelected", () => {
  it("returns true when the card at specified index is selected", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    p.select(0);
    expect(p.isSelected(0)).toBeTruthy();
  });

  it("returns false when the card at specified index is not selected", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.isSelected(0)).toBeFalsy();
  });

  it("returns false when index is out of range", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.isSelected(-1)).toBeFalsy();
    expect(p.isSelected(91724683)).toBeFalsy();
  });
});

describe("select", () => {
  it("returns SUCCESS when successfully selected a card", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.select(0)).toBe(Discard.CardSelectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when the card is already selected", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.select(0)).toBe(Discard.CardSelectResult.SUCCESS);
    expect(p.select(0)).toBe(Discard.CardSelectResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when the index is out of range", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.select(-1)).toBe(Discard.CardSelectResult.NOT_SELECTABLE);
    expect(p.select(1)).toBe(Discard.CardSelectResult.NOT_SELECTABLE);
  });
});

describe("deselect", () => {
  it("returns SUCCESS when successfully deselected a card", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.select(0)).toBe(Discard.CardSelectResult.SUCCESS);
    expect(p.deselect(0)).toBe(Discard.CardDeselectResult.SUCCESS);
  });

  it("returns ALREADY_DESELECTED when the card is not selected", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.deselect(0)).toBe(Discard.CardDeselectResult.ALREADY_DESELECTED);
  });

  it("returns NOT_DESELECTABLE when the index is out of range", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.deselect(-1)).toBe(Discard.CardDeselectResult.NOT_DESELECTABLE);
    expect(p.deselect(1)).toBe(Discard.CardDeselectResult.NOT_DESELECTABLE);
  });
});

describe("CountSelectedCards", () => {
  it("can count selected cards", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(Card.createCard(Card.CardMark.SPADES, 3));
    expect(p.countSelectedCards()).toBe(0);
    expect(p.select(0)).toBe(Discard.CardSelectResult.SUCCESS);
    expect(p.countSelectedCards()).toBe(1);
  });
});

describe("CountSelectedJokers", () => {
  it("can count selected jokers", () => {
    const h = Hand.createHand();
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    h.give(
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.JOKER)
    );
    p.select(0);
    p.select(1);
    expect(p["countSelectedJokers"]()).toBe(2);
  });
});

describe("isKaidanPossibleFromSpecifiedCardNumber", () => {
  describe("returns true when kaidan is possible from the specified card number (clubs)", () => {
    const c6 = Card.createCard(Card.CardMark.CLUBS, 6);
    const c7 = Card.createCard(Card.CardMark.CLUBS, 7);
    const c8 = Card.createCard(Card.CardMark.CLUBS, 8);
    const c9 = Card.createCard(Card.CardMark.CLUBS, 9);
    const h1 = Hand.createHand();
    h1.give(c6, c7, c8, c9);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isKaidanPossibleFromSpecifiedCardNumber"](6, 4)).toBeTruthy();
  });

  describe("returns true when kaidan is possible from the specified card number (diamonds)", () => {
    const dm6 = Card.createCard(Card.CardMark.DIAMONDS, 6);
    const dm7 = Card.createCard(Card.CardMark.DIAMONDS, 7);
    const dm8 = Card.createCard(Card.CardMark.DIAMONDS, 8);
    const dm9 = Card.createCard(Card.CardMark.DIAMONDS, 9);
    const h1 = Hand.createHand();
    h1.give(dm6, dm7, dm8, dm9);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isKaidanPossibleFromSpecifiedCardNumber"](6, 4)).toBeTruthy();
  });

  describe("returns true when kaidan is possible from the specified card number (hearts)", () => {
    const ht6 = Card.createCard(Card.CardMark.HEARTS, 6);
    const ht7 = Card.createCard(Card.CardMark.HEARTS, 7);
    const ht8 = Card.createCard(Card.CardMark.HEARTS, 8);
    const ht9 = Card.createCard(Card.CardMark.HEARTS, 9);
    const h1 = Hand.createHand();
    h1.give(ht6, ht7, ht8, ht9);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isKaidanPossibleFromSpecifiedCardNumber"](6, 4)).toBeTruthy();
  });

  describe("returns true when kaidan is possible from the specified card number (spades)", () => {
    const s6 = Card.createCard(Card.CardMark.SPADES, 6);
    const s7 = Card.createCard(Card.CardMark.SPADES, 7);
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const h1 = Hand.createHand();
    h1.give(s6, s7, s8, s9);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isKaidanPossibleFromSpecifiedCardNumber"](6, 4)).toBeTruthy();
  });

  describe("returns false when kaidan is possible but less than the specified card count", () => {
    const s6 = Card.createCard(Card.CardMark.SPADES, 6);
    const s7 = Card.createCard(Card.CardMark.SPADES, 7);
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const h1 = Hand.createHand();
    h1.give(s6, s7, s8, s9);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isKaidanPossibleFromSpecifiedCardNumber"](6, 5)).toBeFalsy();
  });

  describe("returns true when kaidan is possible by substituting a joker", () => {
    const s6 = Card.createCard(Card.CardMark.SPADES, 6);
    const s7 = Card.createCard(Card.CardMark.SPADES, 7);
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const h1 = Hand.createHand();
    h1.give(s6, s7, s8, s9, joker);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isKaidanPossibleFromSpecifiedCardNumber"](6, 5)).toBeTruthy();
  });
});

describe("isSpecial3OfSpades", () => {
  it("returns true when the last discard is 3 of spades and the second to last discard pair is a joker", () => {
    const ds1 = Discard.createDiscardStack();
    ds1.push(
      Discard.CreateDiscardPairForTest(Card.createCard(Card.CardMark.JOKER))
    );
    ds1.push(
      Discard.CreateDiscardPairForTest(Card.createCard(Card.CardMark.SPADES, 3))
    );
    const h1 = Hand.createHand();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isSpecial3OfSpades"]).toBeTruthy();
  });
});

describe("countSequencialCardsFrom", () => {
  it("can count sequencial cards with same mark", () => {
    const h1 = Hand.createHand();
    h1.give(Card.createCard(Card.CardMark.SPADES, 8));
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    const h2 = Hand.createHand();
    h2.give(Card.createCard(Card.CardMark.SPADES, 4));
    const ds2 = Discard.createDiscardStack();
    const p2 = new Discard.DiscardPlanner(h2, ds2, false);
    const h3 = Hand.createHand();
    h3.give(
      Card.createCard(Card.CardMark.SPADES, 4),
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 6)
    );
    const ds3 = Discard.createDiscardStack();
    const p3 = new Discard.DiscardPlanner(h3, ds3, false);
    expect(p1["countSequencialCardsFrom"](Card.CardMark.SPADES, 4)).toBe(0);
    expect(p2["countSequencialCardsFrom"](Card.CardMark.SPADES, 4)).toBe(1);
    expect(p3["countSequencialCardsFrom"](Card.CardMark.SPADES, 4)).toBe(3);
  });

  it("do not count when marks are different from the start", () => {
    const h1 = Hand.createHand();
    h1.give(
      Card.createCard(Card.CardMark.SPADES, 4),
      Card.createCard(Card.CardMark.HEARTS, 5),
      Card.createCard(Card.CardMark.SPADES, 6)
    );
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["countSequencialCardsFrom"](Card.CardMark.SPADES, 4)).toBe(1);
  });

  it("can count sequencial cards when the strength is inverted", () => {
    const h1 = Hand.createHand();
    h1.give(Card.createCard(Card.CardMark.SPADES, 8));
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, true);
    const h2 = Hand.createHand();
    h2.give(
      Card.createCard(Card.CardMark.SPADES, 4),
      Card.createCard(Card.CardMark.SPADES, 3),
      Card.createCard(Card.CardMark.SPADES, 2)
    );
    const ds2 = Discard.createDiscardStack();
    const p2 = new Discard.DiscardPlanner(h2, ds2, true);
    const h3 = Hand.createHand();
    h3.give(
      Card.createCard(Card.CardMark.SPADES, 6),
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 4)
    );
    const ds3 = Discard.createDiscardStack();
    const p3 = new Discard.DiscardPlanner(h3, ds3, true);
    expect(p1["countSequencialCardsFrom"](Card.CardMark.SPADES, 4)).toBe(0);
    expect(p2["countSequencialCardsFrom"](Card.CardMark.SPADES, 4)).toBe(2);
    expect(p3["countSequencialCardsFrom"](Card.CardMark.SPADES, 6)).toBe(3);
  });

  it("can count sequencial cards by substituting jokers", () => {
    const h1 = Hand.createHand();
    h1.give(
      Card.createCard(Card.CardMark.SPADES, 8),
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.JOKER),
      Card.createCard(Card.CardMark.SPADES, 11)
    );
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["countSequencialCardsFrom"](Card.CardMark.SPADES, 4)).toBe(2); // 2 jokers substituted
    expect(p1["countSequencialCardsFrom"](Card.CardMark.SPADES, 8)).toBe(4); // 8, joker, joker, 11
  });
});

describe("findKaidanStartingPoint", () => {
  it("can find the starting point", () => {
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const s10 = Card.createCard(Card.CardMark.SPADES, 10);
    const s11 = Card.createCard(Card.CardMark.SPADES, 11);
    const h1 = Hand.createHand();
    h1.give(s8, s9, s10, s11);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["findKaidanStartingPoint"](s8)).toBe(8);
    expect(p1["findKaidanStartingPoint"](s9)).toBe(8);
    expect(p1["findKaidanStartingPoint"](s10)).toBe(8);
    expect(p1["findKaidanStartingPoint"](s11)).toBe(8);
  });

  it("can find the starting point when jokers are included", () => {
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const s10 = Card.createCard(Card.CardMark.SPADES, 10);
    const s11 = Card.createCard(Card.CardMark.SPADES, 11);
    const h1 = Hand.createHand();
    h1.give(s8, joker, s10, s11);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["findKaidanStartingPoint"](s8)).toBe(7); // Joker is wildcarded as 7
    expect(p1["findKaidanStartingPoint"](s9)).toBe(8);
    expect(p1["findKaidanStartingPoint"](s10)).toBe(8);
    expect(p1["findKaidanStartingPoint"](s11)).toBe(8);
  });
});

describe("enumerateSelectedCards", () => {
  it("can enumerate selected cards", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 8);
    const c2 = Card.createCard(Card.CardMark.SPADES, 9);
    const c3 = Card.createCard(Card.CardMark.SPADES, 10);
    const c4 = Card.createCard(Card.CardMark.SPADES, 11);
    const h1 = Hand.createHand();
    h1.give(c1, c2, c3, c4);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    p1.select(0);
    p1.select(1);
    const want = [c1, c2];
    expect(p1["enumerateSelectedCards"]()).toStrictEqual(want);
  });
});

describe("isSameNumberFromPreviouslySelected", () => {
  it("can detect whether selecting card has same card number from the previously selected cards", () => {
    const h1 = Hand.createHand();
    h1.give(Card.createCard(Card.CardMark.SPADES, 8));
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    p1.select(0);
    expect(p1["isSameNumberFromPreviouslySelected"](8)).toBeTruthy();
    expect(p1["isSameNumberFromPreviouslySelected"](9)).toBeFalsy();
  });

  it("can exclude jokers", () => {
    const h1 = Hand.createHand();
    h1.give(
      Card.createCard(Card.CardMark.SPADES, 8),
      Card.createCard(Card.CardMark.JOKER)
    );
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    p1.select(0);
    p1.select(1);
    expect(p1["isSameNumberFromPreviouslySelected"](8)).toBeTruthy();
    expect(p1["isSameNumberFromPreviouslySelected"](9)).toBeFalsy();
  });
});

describe("onlyJokersSelected", () => {
  it("can detect whether the selection only consists of jokers", () => {
    const h1 = Hand.createHand();
    h1.give(
      Card.createCard(Card.CardMark.SPADES, 8),
      Card.createCard(Card.CardMark.JOKER)
    );
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    p1.select(0);
    expect(p1["onlyJokersSelected"]()).toBeFalsy();
    p1.select(1);
    expect(p1["onlyJokersSelected"]()).toBeFalsy();
    p1.deselect(0);
    expect(p1["onlyJokersSelected"]()).toBeTruthy();
  });

  it("returns false when the selection is empty", () => {
    const h1 = Hand.createHand();
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["onlyJokersSelected"]()).toBeFalsy();
  });
});

describe("isConnectedByKaidan", () => {
  it("returns true when the specified two cards are connected by kaidan", () => {
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const s10 = Card.createCard(Card.CardMark.SPADES, 10);
    const s11 = Card.createCard(Card.CardMark.SPADES, 11);
    const h1 = Hand.createHand();
    h1.give(s8, s9, s10, s11);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isConnectedByKaidan"](s8, s11)).toBe(true);
  });

  it("returns false when the specified two cards are connected but marks are different", () => {
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const h9 = Card.createCard(Card.CardMark.HEARTS, 9);
    const s10 = Card.createCard(Card.CardMark.SPADES, 10);
    const s11 = Card.createCard(Card.CardMark.SPADES, 11);
    const h1 = Hand.createHand();
    h1.give(s8, h9, s10, s11);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isConnectedByKaidan"](s8, s11)).toBe(false);
    expect(p1["isConnectedByKaidan"](h9, s11)).toBe(false);
  });

  it("returns false when start and target are not directly connected by kaidan", () => {
    const s7 = Card.createCard(Card.CardMark.SPADES, 7);
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const s10 = Card.createCard(Card.CardMark.SPADES, 10);
    const s11 = Card.createCard(Card.CardMark.SPADES, 11);
    const h1 = Hand.createHand();
    h1.give(s8, s9, s10, s11);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isConnectedByKaidan"](s7, s11)).toBe(false);
  });

  it("can substitute jokers", () => {
    const s7 = Card.createCard(Card.CardMark.SPADES, 7);
    const s8 = Card.createCard(Card.CardMark.SPADES, 8);
    const s9 = Card.createCard(Card.CardMark.SPADES, 9);
    const s10 = Card.createCard(Card.CardMark.SPADES, 10);
    const s11 = Card.createCard(Card.CardMark.SPADES, 11);
    const joker = Card.createCard(Card.CardMark.JOKER);
    const h1 = Hand.createHand();
    h1.give(s8, s9, s10, s11, joker);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(p1["isConnectedByKaidan"](s7, s11)).toBe(true);
  });
});

describe("findWeakestSelectedCard", () => {
  it("returns the weakest card in the current selection", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 8);
    const c2 = Card.createCard(Card.CardMark.SPADES, 9);
    const c3 = Card.createCard(Card.CardMark.SPADES, 10);
    const c4 = Card.createCard(Card.CardMark.SPADES, 10);
    const h1 = Hand.createHand();
    h1.give(c1, c2, c3, c4);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    p1.select(1);
    p1.select(2);
    expect(p1["findWeakestSelectedCard"]()).toBe(c2);
  });

  it("can exclude jokers", () => {
    const c1 = Card.createCard(Card.CardMark.SPADES, 8);
    const c2 = Card.createCard(Card.CardMark.SPADES, 9);
    const c3 = Card.createCard(Card.CardMark.SPADES, 10);
    const c4 = Card.createCard(Card.CardMark.SPADES, 10);
    const c5 = Card.createCard(Card.CardMark.JOKER);
    const h1 = Hand.createHand();
    h1.give(c1, c2, c3, c4, c5);
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    p1.select(1);
    p1.select(2);
    p1.select(4);
    expect(p1["findWeakestSelectedCard"]()).toBe(c2);
  });

  it("throws an error when nothing could be retrieved", () => {
    const h1 = Hand.createHand();
    const ds1 = Discard.createDiscardStack();
    const p1 = new Discard.DiscardPlanner(h1, ds1, false);
    expect(() => {
      p1["findWeakestSelectedCard"]();
    }).toThrow(
      "tried to find the weakest selected card, but nothing could be found"
    );
  });
});

describe("createDiscardPair", () => {
  it("returns new discard pair", () => {
    const h = Hand.createHand();
    h.give(
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 5),
      Card.createCard(Card.CardMark.SPADES, 5)
    );
    const ds = Discard.createDiscardStack();
    const p = new Discard.DiscardPlanner(h, ds, false);
    p.select(0);
    p.select(1);
    expect(p.countSelectedCards()).toBe(2);
  });
});
