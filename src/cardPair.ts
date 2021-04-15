/*
card pairs
*/

class cardPairGenerationError extends Error {}
export class CardPair {
  constructor(public cardNumber: number, cardCount: number) {
    if (cardNumber < 0 || cardNumber > 13) {
      throw new cardPairGenerationError(
        "card number range must be 0(joker) to 13"
      );
    }
    if (cardCount < 1 || cardCount > 4) {
      throw new cardPairGenerationError("card count range must be 1 to 4");
    }
  }
}
