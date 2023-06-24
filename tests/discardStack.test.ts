import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";
import * as Discard from "../src/discard";

describe("DiscardStack", () => {
  it("can be instantiated with an empty list", () => {
    const ds = Discard.createDiscardStack();
    expect(ds["cardSelectionPairs"]).toStrictEqual([]);
  });

  it("can push a new discard pair", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 4);
    const ds = Discard.createDiscardStack();
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c2);
    ds.push(csp);
    expect(ds["cardSelectionPairs"].length).toBe(1);
    expect(ds["cardSelectionPairs"][0]).toStrictEqual(csp);
  });

  it("can retrieve the last pushed discard pair", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 4);
    const ds = Discard.createDiscardStack();
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c2);
    ds.push(csp);
    expect(ds.last()).toStrictEqual(csp);
  });

  it("can retrieve the second to last pushed discard pair", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 4);
    const c3 = Card.createCard(Card.CardMark.DIAMONDS, 5);
    const c4 = Card.createCard(Card.CardMark.CLUBS, 5);
    const ds = Discard.createDiscardStack();
    const csp1 = CardSelection.CreateCardSelectionPairForTest(c1, c2);
    const csp2 = CardSelection.CreateCardSelectionPairForTest(c3, c4);
    ds.push(csp1);
    ds.push(csp2);
    expect(ds.secondToLast()).toStrictEqual(csp1);
  });

  it("returns nullDiscardPair when tried to retrieve the second to last discardPair with only one pair stacked", () => {
    const ds = Discard.createDiscardStack();
    const ncsp = CardSelection.createNullCardSelectionPair();
    expect(ds.secondToLast()).toStrictEqual(ncsp);
  });

  it("can clear the stacked discard pairs", () => {
    const c1 = Card.createCard(Card.CardMark.DIAMONDS, 4);
    const c2 = Card.createCard(Card.CardMark.CLUBS, 4);
    const csp = CardSelection.CreateCardSelectionPairForTest(c1, c2);
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(ds["cardSelectionPairs"].length).toBe(1);
    ds.clear();
    expect(ds["cardSelectionPairs"].length).toBe(0);
  });
});
