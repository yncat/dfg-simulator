import * as Card from "../src/card";

export function assertCardsEqual(a: Card.Card[], b: Card.Card[]): boolean {
  // Ignore ID and compare cards
  if (a.length !== b.length) {
    return false;
  }

  let eq = true;
  for (let i = 0; i < a.length; i++) {
    if (a[i].mark !== b[i].mark || a[i].cardNumber !== b[i].cardNumber) {
      eq = false;
      break;
    }
  }
  return eq;
}
