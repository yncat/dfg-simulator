import * as Card from "../src/card";
import * as Discard from "../src/discard";
import * as Hand from "../src/hand";

describe("DiscardPlanner", () => {
  it("can be instantiated", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    expect(p).toBeTruthy();
  });
});

describe("isSelectable", () => {
  it("returns NOT_SELECTABLE when index is out of range", () => {
    const h = new Hand.Hand();
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
      const h = new Hand.Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest();
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns SELECTABLE when checking a 3 of spades and the last discard is a joker", () => {
      const h = new Hand.Hand();
      h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.JOKER)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns SELECTABLE when checking a single joker and the last discard is an weaker card", () => {
      const h = new Hand.Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.CLUBS, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns NOT_SELECTABLE when checking a single joker and the last discard is also a joker", () => {
      const h = new Hand.Hand();
      h.giveCards(new Card.Card(Card.Mark.JOKER));
      const d = Discard.CreateDiscardPairForTest(
        new Card.Card(Card.Mark.CLUBS, 2)
      );
      const p = new Discard.discardPlanner(h, d, false);
      expect(p.isSelectable(0)).toBe(Discard.SelectableCheckResult.SELECTABLE);
    });

    it("returns NOT_SELECTABLE when checking a single card and the last discard is stronger", () => {
      const h = new Hand.Hand();
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
      const h = new Hand.Hand();
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
        const h = new Hand.Hand();
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
        const h = new Hand.Hand();
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
        const h = new Hand.Hand();
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
        const h = new Hand.Hand();
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
        const h = new Hand.Hand();
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
        const h = new Hand.Hand();
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
        const h = new Hand.Hand();
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
        expect(p.isSelectable(1)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        expect(p.isSelectable(2)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is a kaidan and you have stronger kaidan cards including a joker", () => {
        const h = new Hand.Hand();
        h.giveCards(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.SPADES, 5),
          new Card.Card(Card.Mark.JOKER)
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
        expect(p.isSelectable(1)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        expect(p.isSelectable(2)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is a kaidan and you have stronger kaidan cards including a joker in the middle of the kaidan", () => {
        const h = new Hand.Hand();
        h.giveCards(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.JOKER),
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
        expect(p.isSelectable(1)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        expect(p.isSelectable(2)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });
    });

    describe("checking the second card", () => {
      it("returns SELECTABLE when the last discard is two-card pair and selecting the same numberd cards from the previously selected one", () => {
        const h = new Hand.Hand();
        h.giveCards(
          new Card.Card(Card.Mark.HEARTS, 5),
          new Card.Card(Card.Mark.DIAMONDS, 5)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.CLUBS, 4)
        );
        const p = new Discard.discardPlanner(h, d, false);
        p.select(0);
        expect(p.isSelectable(1)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is two-card pair, selecting a joker and trying to select stronger numbered card", () => {
        const h = new Hand.Hand();
        h.giveCardsWithoutSorting(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.DIAMONDS, 5),
          new Card.Card(Card.Mark.JOKER)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.CLUBS, 4)
        );
        const p = new Discard.discardPlanner(h, d, false);
        p.select(2);
        expect(p.isSelectable(1)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.NOT_SELECTABLE
        );
      });

      it("returns SELECTABLE when the last discard is three-card kaidan, selecting a joker and trying to select stronger numbered card", () => {
        const h = new Hand.Hand();
        h.giveCardsWithoutSorting(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.DIAMONDS, 5),
          new Card.Card(Card.Mark.JOKER)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 3),
          new Card.Card(Card.Mark.CLUBS, 4),
          new Card.Card(Card.Mark.HEARTS, 5)
        );
        const p = new Discard.discardPlanner(h, d, false);
        p.select(2);
        expect(p.isSelectable(0)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
        expect(p.isSelectable(1)).toBe(
          Discard.SelectableCheckResult.SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when the last discard is three-card kaidan, selecting a joker and trying to select stronger but not sequenced numbered card", () => {
        const h = new Hand.Hand();
        h.giveCardsWithoutSorting(
          new Card.Card(Card.Mark.SPADES, 4),
          new Card.Card(Card.Mark.DIAMONDS, 5),
          new Card.Card(Card.Mark.HEARTS, 10),
          new Card.Card(Card.Mark.JOKER)
        );
        const d = Discard.CreateDiscardPairForTest(
          new Card.Card(Card.Mark.SPADES, 3),
          new Card.Card(Card.Mark.CLUBS, 4),
          new Card.Card(Card.Mark.HEARTS, 5)
        );
        const p = new Discard.discardPlanner(h, d, false);
        p.select(3);
        expect(p.isSelectable(2)).toBe(
          Discard.SelectableCheckResult.NOT_SELECTABLE
        );
      });
    });
  });
});

describe("select", () => {
  it("returns SUCCESS when successfully selected a card", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.select(0)).toBe(Discard.SelectResult.SUCCESS);
  });

  it("returns ALREADY_SELECTED when the card is already selected", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.select(0)).toBe(Discard.SelectResult.SUCCESS);
    expect(p.select(0)).toBe(Discard.SelectResult.ALREADY_SELECTED);
  });

  it("returns NOT_SELECTABLE when the index is out of range", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.select(-1)).toBe(Discard.SelectResult.NOT_SELECTABLE);
    expect(p.select(1)).toBe(Discard.SelectResult.NOT_SELECTABLE);
  });
});

describe("deselect", () => {
  it("returns SUCCESS when successfully deselected a card", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.select(0)).toBe(Discard.SelectResult.SUCCESS);
    expect(p.deselect(0)).toBe(Discard.DeselectResult.SUCCESS);
  });

  it("returns ALREADY_DESELECTED when the card is not selected", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.deselect(0)).toBe(Discard.DeselectResult.ALREADY_DESELECTED);
  });

  it("returns NOT_DESELECTABLE when the index is out of range", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.deselect(-1)).toBe(Discard.DeselectResult.NOT_DESELECTABLE);
    expect(p.deselect(1)).toBe(Discard.DeselectResult.NOT_DESELECTABLE);
  });
});

describe("CountSelectedCards", () => {
  it("can count selected cards", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(new Card.Card(Card.Mark.SPADES, 3));
    expect(p.countSelectedCards()).toBe(0);
    expect(p.select(0)).toBe(Discard.SelectResult.SUCCESS);
    expect(p.countSelectedCards()).toBe(1);
  });
});

describe("CountSelectedJokers", () => {
  it("can count selected jokers", () => {
    const h = new Hand.Hand();
    const d = Discard.CreateDiscardPairForTest();
    const p = new Discard.discardPlanner(h, d, false);
    h.giveCards(
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER)
    );
    p.select(0);
    p.select(1);
    expect(p["countSelectedJokers"]()).toBe(2);
  });
});

describe("countSequencialCardsFrom", () => {
  it("can count sequencial cards", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(new Card.Card(Card.Mark.SPADES, 8));
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    const h2 = new Hand.Hand();
    h2.giveCards(new Card.Card(Card.Mark.SPADES, 4));
    const d2 = Discard.CreateDiscardPairForTest();
    const p2 = new Discard.discardPlanner(h2, d2, false);
    const h3 = new Hand.Hand();
    h3.giveCards(
      new Card.Card(Card.Mark.SPADES, 4),
      new Card.Card(Card.Mark.SPADES, 5),
      new Card.Card(Card.Mark.SPADES, 6)
    );
    const d3 = Discard.CreateDiscardPairForTest();
    const p3 = new Discard.discardPlanner(h3, d3, false);
    expect(p1["countSequencialCardsFrom"](4)).toBe(0);
    expect(p2["countSequencialCardsFrom"](4)).toBe(1);
    expect(p3["countSequencialCardsFrom"](4)).toBe(3);
  });

  it("can count sequencial cards when the strength is inverted", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(new Card.Card(Card.Mark.SPADES, 8));
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, true);
    const h2 = new Hand.Hand();
    h2.giveCards(
      new Card.Card(Card.Mark.SPADES, 4),
      new Card.Card(Card.Mark.SPADES, 3),
      new Card.Card(Card.Mark.SPADES, 2)
    );
    const d2 = Discard.CreateDiscardPairForTest();
    const p2 = new Discard.discardPlanner(h2, d2, true);
    const h3 = new Hand.Hand();
    h3.giveCards(
      new Card.Card(Card.Mark.SPADES, 6),
      new Card.Card(Card.Mark.SPADES, 5),
      new Card.Card(Card.Mark.SPADES, 4)
    );
    const d3 = Discard.CreateDiscardPairForTest();
    const p3 = new Discard.discardPlanner(h3, d3, true);
    expect(p1["countSequencialCardsFrom"](4)).toBe(0);
    expect(p2["countSequencialCardsFrom"](4)).toBe(2);
    expect(p3["countSequencialCardsFrom"](6)).toBe(3);
  });

  it("can count sequencial cards by substituting jokers", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.SPADES, 11)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    expect(p1["countSequencialCardsFrom"](4)).toBe(2); // 2 jokers substituted
    expect(p1["countSequencialCardsFrom"](8)).toBe(4); // 8, joker, joker, 11
  });
});

describe("findKaidanStartingPoint", () => {
  it("can find the starting point", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.SPADES, 9),
      new Card.Card(Card.Mark.SPADES, 10),
      new Card.Card(Card.Mark.SPADES, 11)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    expect(p1["findKaidanStartingPoint"](8)).toBe(8);
    expect(p1["findKaidanStartingPoint"](9)).toBe(8);
    expect(p1["findKaidanStartingPoint"](10)).toBe(8);
    expect(p1["findKaidanStartingPoint"](11)).toBe(8);
  });

  it("can find the starting point when jokers are included", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.JOKER),
      new Card.Card(Card.Mark.SPADES, 10),
      new Card.Card(Card.Mark.SPADES, 11)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    expect(p1["findKaidanStartingPoint"](8)).toBe(7); // Joker is wildcarded as 7
    expect(p1["findKaidanStartingPoint"](9)).toBe(8);
    expect(p1["findKaidanStartingPoint"](10)).toBe(8);
    expect(p1["findKaidanStartingPoint"](11)).toBe(8);
  });
});

describe("enumerateSelectedCards", () => {
  it("can enumerate selected cards", () => {
    const c1 = new Card.Card(Card.Mark.SPADES, 8);
    const c2 = new Card.Card(Card.Mark.SPADES, 9);
    const c3 = new Card.Card(Card.Mark.SPADES, 10);
    const c4 = new Card.Card(Card.Mark.SPADES, 11);
    const h1 = new Hand.Hand();
    h1.giveCards(c1, c2, c3, c4);
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    p1.select(0);
    p1.select(1);
    const want = [c1, c2];
    expect(p1["enumerateSelectedCards"]()).toStrictEqual(want);
  });
});

describe("isSameNumberFromPreviouslySelected", () => {
  it("can detect whether selecting card has same card number from the previously selected cards", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(new Card.Card(Card.Mark.SPADES, 8));
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    p1.select(0);
    expect(p1["isSameNumberFromPreviouslySelected"](8)).toBeTruthy();
    expect(p1["isSameNumberFromPreviouslySelected"](9)).toBeFalsy();
  });

  it("can exclude jokers", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.JOKER)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    p1.select(0);
    p1.select(1);
    expect(p1["isSameNumberFromPreviouslySelected"](8)).toBeTruthy();
    expect(p1["isSameNumberFromPreviouslySelected"](9)).toBeFalsy();
  });
});

describe("onlyJokersSelected", () => {
  it("can detect whether the selection only consists of jokers", () => {
    const h1 = new Hand.Hand();
    h1.giveCards(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.JOKER)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    p1.select(0);
    expect(p1["onlyJokersSelected"]()).toBeFalsy();
    p1.select(1);
    expect(p1["onlyJokersSelected"]()).toBeFalsy();
    p1.deselect(0);
    expect(p1["onlyJokersSelected"]()).toBeTruthy();
  });

  it("returns false when the selection is empty", () => {
    const h1 = new Hand.Hand();
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    expect(p1["onlyJokersSelected"]()).toBeFalsy();
  });
});

describe("isConnectedByKaidan", () => {
  it("returns true when the specified two cards are connected by kaidan", () => {
    const h1 = new Hand.Hand();
    h1.giveCardsWithoutSorting(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.SPADES, 9),
      new Card.Card(Card.Mark.SPADES, 10),
      new Card.Card(Card.Mark.SPADES, 11)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    expect(p1["isConnectedByKaidan"](8, 11)).toBe(true);
  });

  it("returns false when start and target are not directly connected by kaidan", () => {
    const h1 = new Hand.Hand();
    h1.giveCardsWithoutSorting(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.SPADES, 9),
      new Card.Card(Card.Mark.SPADES, 10),
      new Card.Card(Card.Mark.SPADES, 11)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    expect(p1["isConnectedByKaidan"](7, 11)).toBe(false);
  });

  it("can substitute jokers", () => {
    const h1 = new Hand.Hand();
    h1.giveCardsWithoutSorting(
      new Card.Card(Card.Mark.SPADES, 8),
      new Card.Card(Card.Mark.SPADES, 9),
      new Card.Card(Card.Mark.SPADES, 10),
      new Card.Card(Card.Mark.SPADES, 11),
      new Card.Card(Card.Mark.JOKER)
    );
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    expect(p1["isConnectedByKaidan"](7, 11)).toBe(true);
  });
});

describe("findWeakestSelectedCard", () => {
  it("returns the weakest card in the current selection", () => {
    const c1 = new Card.Card(Card.Mark.SPADES, 8);
    const c2 = new Card.Card(Card.Mark.SPADES, 9);
    const c3 = new Card.Card(Card.Mark.SPADES, 10);
    const c4 = new Card.Card(Card.Mark.SPADES, 10);
    const h1 = new Hand.Hand();
    h1.giveCardsWithoutSorting(c1, c2, c3, c4);
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    p1.select(1);
    p1.select(2);
    expect(p1["findWeakestSelectedCard"]()).toBe(c2);
  });

  it("can exclude jokers", () => {
    const c1 = new Card.Card(Card.Mark.SPADES, 8);
    const c2 = new Card.Card(Card.Mark.SPADES, 9);
    const c3 = new Card.Card(Card.Mark.SPADES, 10);
    const c4 = new Card.Card(Card.Mark.SPADES, 10);
    const c5 = new Card.Card(Card.Mark.JOKER);
    const h1 = new Hand.Hand();
    h1.giveCardsWithoutSorting(c1, c2, c3, c4, c5);
    const d1 = Discard.CreateDiscardPairForTest();
    const p1 = new Discard.discardPlanner(h1, d1, false);
    p1.select(1);
    p1.select(2);
    p1.select(4);
    expect(p1["findWeakestSelectedCard"]()).toBe(c2);
  });
});
