import { DiscardStack } from "./discard";
import { CardMark } from "./card";

export function isForbiddenAgari(
  discardStack: DiscardStack,
  strengthInverted: boolean
): boolean {
  const discardPair = discardStack.last();
  const previousDiscardPair = discardStack.secondToLast();
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

  // 3 of spades, when the last discard pair includes jokers.
  const c1 =
    discardPair.count() == discardPair.countWithCondition(CardMark.SPADES, 3);
  const c2 = !previousDiscardPair.isNull;
  const c3 = previousDiscardPair.countWithCondition(CardMark.JOKER, null) > 0;
  if (
    discardPair.count() == discardPair.countWithCondition(CardMark.SPADES, 3) &&
    previousDiscardPair.countWithCondition(CardMark.JOKER, null) > 0
  ) {
    return true;
  }

  // OK
  return false;
}
