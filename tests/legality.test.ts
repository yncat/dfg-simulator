import * as Discard from "../src/discard";
import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";
import * as Legality from "../src/legality";
import * as Rule from "../src/rule";
import { getConfigFileParsingDiagnostics } from "typescript";

function withYagiriEnabled(): Rule.RuleConfig {
  const cfg = Rule.createDefaultRuleConfig();
  cfg.yagiri = true;
  return cfg;
}

function withYagiriDisabled(): Rule.RuleConfig {
  const cfg = Rule.createDefaultRuleConfig();
  cfg.yagiri = false;
  return cfg;
}

describe("isForbiddenAgari", () => {
  it("returns true when joker is included", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.JOKER)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeTruthy();
  });

  it("returns true when strength is not inverted and 2 is included", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.CLUBS, 2)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeTruthy();
  });

  it("returns false when strength is inverted and 2 is included", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.CLUBS, 2)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, true, withYagiriEnabled())).toBeFalsy();
  });

  it("returns true when strength is inverted and 3 is included", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, true, withYagiriEnabled())).toBeTruthy();
  });

  it("returns false when strength is not inverted and 3 is included", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeFalsy();
  });

  it("returns true when 8 is included and yagiri is enabled", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 8)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeTruthy();
  });

  it("returns false when 8 is included and yagiri is disabled", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.DIAMONDS, 8)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriDisabled())).toBeFalsy();
  });

  it("returns true when the pair consists of 3 of spades and the last discard pair includes jokers", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(
      CardSelection.CreateCardSelectionPairForTest(
        Card.createCard(Card.CardMark.JOKER, 0)
      )
    );
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeTruthy();
  });

  it("returns false when the pair consists of 3 of spades and the last discard pair does not include jokers", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 3)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeFalsy();
  });

  it("returns false when the pair is a kaidan that includes 3 of spades", () => {
    const csp = CardSelection.CreateCardSelectionPairForTest(
      Card.createCard(Card.CardMark.SPADES, 3),
      Card.createCard(Card.CardMark.SPADES, 4),
      Card.createCard(Card.CardMark.SPADES, 5)
    );
    const ds = Discard.createDiscardStack();
    ds.push(csp);
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeFalsy();
  });

  it("returns false when the pair is a null discard pair", () => {
    const ds = Discard.createDiscardStack();
    expect(Legality.isForbiddenAgari(ds, false, withYagiriEnabled())).toBeFalsy();
  });
});
