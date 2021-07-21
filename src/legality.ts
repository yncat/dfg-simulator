import { CardMark } from "./card";
import { DiscardPair } from "./discard";

export function isForbiddenAgari(
  discardPair: DiscardPair,
  strengthInverted: boolean
): boolean {
  // joker is included.
  if (discardPair.countWithCondition(CardMark.JOKER, null) > 0) {
    return true;
  }

  // When strength is not inverted, 2 is included.
  if (!strengthInverted && discardPair.countWithCondition(null, 2)) {
    return true;
  }

  // When strength is inverted, 3 was included.
  if (strengthInverted && discardPair.countWithCondition(null, 3)) {
    return true;
  }

  // A pair of 8.
  if (discardPair.count() == discardPair.countWithCondition(null, 8)) {
    return true;
  }

  // 3 of spades.
  if (
    discardPair.count() == discardPair.countWithCondition(CardMark.SPADES, 3)
  ) {
    return true;
  }

  // OK
  return false;
}
