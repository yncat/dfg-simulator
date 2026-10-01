import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";
import * as Discard from "../src/discard";
import * as Game from "../src/game";
import * as Hand from "../src/hand";
import * as CpuPlanner from "../src/cpuPlanner";
import * as Rule from "../src/rule";

export function c(mark: Card.CardMark, cardNumber = 0): Card.Card {
  return Card.createCard(mark, cardNumber);
}

export function createControl(
  cards: Card.Card[],
  lastPair: Card.Card[] = [],
  strengthInverted = false
): Game.ActivePlayerControl {
  const h = Hand.createHand();
  h.give(...cards);
  h.sort();
  const ds = Discard.createDiscardStack();
  if (lastPair.length > 0) {
    ds.push(CardSelection.CreateCardSelectionPairForTest(...lastPair));
  }
  return Game.createActivePlayerControlForTest(
    "ctrl",
    "a",
    h,
    new Discard.DiscardPlanner(h, ds, strengthInverted),
    new Discard.DiscardPairEnumerator(ds, strengthInverted)
  );
}

// Unseen cards = a full deck minus the given cards.
export function createContext(
  params: {
    myHand?: Card.Card[];
    played?: Card.Card[];
    strengthInverted?: boolean;
    ruleConfig?: Rule.RuleConfig;
    maxOpponentHandCount?: number;
  } = {}
): CpuPlanner.EvaluationContext {
  const unseen = CpuPlanner.CardCounter.createFullDeck(1);
  (params.myHand || []).concat(params.played || []).forEach((v) => {
    unseen.remove(v);
  });
  return {
    strengthInverted: params.strengthInverted || false,
    ruleConfig: params.ruleConfig || Rule.createDefaultRuleConfig(),
    unseen: unseen,
    maxOpponentHandCount:
      params.maxOpponentHandCount === undefined
        ? Infinity
        : params.maxOpponentHandCount,
  };
}
