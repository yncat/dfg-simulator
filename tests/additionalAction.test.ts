import * as AdditionalAction from "../src/additionalAction";
import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";

function createSingleCardSelector() {
  const c1 = Card.createCard(Card.CardMark.CLUBS, 1);
  const c2 = Card.createCard(Card.CardMark.CLUBS, 2);
  const c3 = Card.createCard(Card.CardMark.CLUBS, 3);
  return new AdditionalAction.SingleCardSelector(c1, c2, c3);
}

describe("AdditionalAction", () => {
  describe("SingleCardSelector", () => {
    it("all cards are unchecked on instantiation", () => {
      const scs = createSingleCardSelector();
      expect(scs.isSelected(0)).toBeFalsy();
      expect(scs.isSelected(1)).toBeFalsy();
      expect(scs.isSelected(2)).toBeFalsy();
    });

    describe("isSelected", () => {
      it("returns false for boundaries", () => {
        const scs = createSingleCardSelector();
        expect(scs.isSelected(-1)).toBeFalsy();
        expect(scs.isSelected(3)).toBeFalsy();
      });

      it("returns true for selected card", () => {
        const scs = createSingleCardSelector();
        scs["selected"][0] = true;
        expect(scs.isSelected(0)).toBeTruthy();
      });

      it("returns false for unselected card", () => {
        const scs = createSingleCardSelector();
        expect(scs.isSelected(0)).toBeFalsy();
      });
    });

    describe("checkSelectability", () => {
      it("returns NOT_SELECTABLE for boundairies", () => {
        const scs = createSingleCardSelector();
        expect(scs.checkSelectability(-1)).toBe(
          CardSelection.SelectabilityCheckResult.NOT_SELECTABLE
        );
        expect(scs.checkSelectability(3)).toBe(
          CardSelection.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("returns SELECTABLE for any card when nothing is selected", () => {
        const scs = createSingleCardSelector();
        expect(scs.checkSelectability(0)).toBe(
          CardSelection.SelectabilityCheckResult.SELECTABLE
        );
        expect(scs.checkSelectability(1)).toBe(
          CardSelection.SelectabilityCheckResult.SELECTABLE
        );
        expect(scs.checkSelectability(2)).toBe(
          CardSelection.SelectabilityCheckResult.SELECTABLE
        );
      });

      it("returns NOT_SELECTABLE when another card is selected", () => {
        const scs = createSingleCardSelector();
        scs["selected"][0] = true;
        expect(scs.checkSelectability(1)).toBe(
          CardSelection.SelectabilityCheckResult.NOT_SELECTABLE
        );
        expect(scs.checkSelectability(2)).toBe(
          CardSelection.SelectabilityCheckResult.NOT_SELECTABLE
        );
      });

      it("returns ALREADY_SELECTED when the card is selected", () => {
        const scs = createSingleCardSelector();
        scs["selected"][0] = true;
        expect(scs.checkSelectability(0)).toBe(
          CardSelection.SelectabilityCheckResult.ALREADY_SELECTED
        );
      });
    });

    describe("enumerateCards", () => {
      it("can enumerate all cards in this selector", () => {
        const c1 = Card.createCard(Card.CardMark.CLUBS, 1);
        const c2 = Card.createCard(Card.CardMark.CLUBS, 2);
        const c3 = Card.createCard(Card.CardMark.CLUBS, 3);
        const scs = new AdditionalAction.SingleCardSelector(c1, c2, c3);
        const got = scs.enumerateCards();
        expect(got).toStrictEqual([c1, c2, c3]);
      });
    });

    describe("select", () => {
      it("returns NOT_SELECTABLE for boundaries", () => {
        const scs = createSingleCardSelector();
        expect(scs.select(-1)).toBe(
          CardSelection.CardSelectResult.NOT_SELECTABLE
        );
        expect(scs.select(3)).toBe(
          CardSelection.CardSelectResult.NOT_SELECTABLE
        );
      });

      it("returns ALREADY_SELECTED for already selected card", () => {
        const scs = createSingleCardSelector();
        scs["selected"][0] = true;
        expect(scs.select(0)).toBe(
          CardSelection.CardSelectResult.ALREADY_SELECTED
        );
      });

      it("returns NOT_SELECTABLE when another card is already selected", () => {
        const scs = createSingleCardSelector();
        scs["selected"][0] = true;
        expect(scs.select(1)).toBe(
          CardSelection.CardSelectResult.NOT_SELECTABLE
        );
      });

      it("returns SUCCESS for valid call and sets selected=true", () => {
        const scs = createSingleCardSelector();
        expect(scs.select(0)).toBe(CardSelection.CardSelectResult.SUCCESS);
        expect(scs["selected"][0]).toBeTruthy();
      });
    });

    describe("deselect", () => {
      it("returns NOT_DESELECTABLE for boundaries", () => {
        const scs = createSingleCardSelector();
        expect(scs.deselect(-1)).toBe(
          CardSelection.CardDeselectResult.NOT_DESELECTABLE
        );
        expect(scs.deselect(3)).toBe(
          CardSelection.CardDeselectResult.NOT_DESELECTABLE
        );
      });

      it("returns ALREADY_DESELECTED for already deselected card", () => {
        const scs = createSingleCardSelector();
        expect(scs.deselect(0)).toBe(
          CardSelection.CardDeselectResult.ALREADY_DESELECTED
        );
      });

      it("returns SUCCESS for valid call and sets selected=false", () => {
        const scs = createSingleCardSelector();
        scs["selected"][0] = true;
        expect(scs.deselect(0)).toBe(CardSelection.CardDeselectResult.SUCCESS);
        expect(scs["selected"][0]).toBeFalsy();
      });
    });

    describe("createCardSelectionPair", () => {
      it("returns card selection pair based on selected card", () => {
        const scs = createSingleCardSelector();
        scs["selected"][0] = true;
        const csp = scs.createCardSelectionPair();
        const c = csp.cards[0];
        expect(c.mark).toBe(Card.CardMark.CLUBS);
        expect(c.cardNumber).toBe(1);
      });
    });
  });
});
