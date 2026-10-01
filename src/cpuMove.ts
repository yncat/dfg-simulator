/*
Legal move enumeration for CPU players
*/
import * as Card from "./card";
import * as CardSelection from "./cardSelection";
import type { ActivePlayerControl } from "./game";

export type LegalMove = {
  // Indices of the cards in the hand (ActivePlayerControl.enumerateHand()) used by this move, in the order they must be selected.
  readonly indices: number[];
  readonly pair: CardSelection.CardSelectionPair;
};

// Enumerates every playable combination by driving the given ActivePlayerControl, so that the result always follows the same legality checks as human players.
// The control's selection is restored to empty before returning.
export function enumerateLegalMoves(control: ActivePlayerControl): LegalMove[] {
  const handCount = control.countHand();
  clearSelection(control);
  const moves: LegalMove[] = [];
  const visited = new Set<string>();
  const foundPairs = new Set<string>();
  const selected: number[] = [];

  const visit = () => {
    const key = selected
      .slice()
      .sort((a, b) => a - b)
      .join(",");
    if (visited.has(key)) {
      return;
    }
    visited.add(key);
    if (selected.length > 0) {
      control.enumerateCardSelectionPairs().forEach((pair) => {
        const pk = pairKey(pair);
        if (foundPairs.has(pk)) {
          return;
        }
        foundPairs.add(pk);
        moves.push({
          indices: selected.slice(),
          pair: pair,
        });
      });
    }
    // The library doesn't allow combinations of more than 4 cards, so the search is bounded.
    if (selected.length >= 4) {
      return;
    }
    for (let i = 0; i < handCount; i++) {
      if (
        control.checkCardSelectability(i) !==
        CardSelection.SelectabilityCheckResult.SELECTABLE
      ) {
        continue;
      }
      control.selectCard(i);
      selected.push(i);
      visit();
      selected.pop();
      control.deselectCard(i);
    }
  };

  visit();
  return moves;
}

// Performs the given move on the control. null means pass.
export function applyMove(
  control: ActivePlayerControl,
  move: LegalMove | null
): void {
  clearSelection(control);
  if (move === null) {
    control.pass();
    return;
  }
  move.indices.forEach((i) => {
    control.selectCard(i);
  });
  control.discard(move.pair);
}

function clearSelection(control: ActivePlayerControl) {
  for (let i = 0; i < control.countHand(); i++) {
    if (control.isCardSelected(i)) {
      control.deselectCard(i);
    }
  }
}

function pairKey(pair: CardSelection.CardSelectionPair): string {
  // Two jokers are indistinguishable, so the key ignores card IDs.
  return pair.cards
    .map((c) => {
      return c.mark === Card.CardMark.WILD
        ? `W${c.cardNumber}`
        : `${c.mark}:${c.cardNumber}`;
    })
    .join(",");
}
