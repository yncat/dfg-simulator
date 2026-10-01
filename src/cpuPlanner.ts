/*
Hand evaluation for CPU players
*/
import * as Card from "./card";
import * as Calculation from "./calculation";
import * as CardSelection from "./cardSelection";
import type { RuleConfig } from "./rule";

const NUMBERED_MARKS = [
  Card.CardMark.CLUBS,
  Card.CardMark.DIAMONDS,
  Card.CardMark.HEARTS,
  Card.CardMark.SPADES,
];
// Strengths of numbered cards (3 to 2). See Calculation.convertCardNumberIntoStrength.
const WEAKEST_STRENGTH = 3;
const STRONGEST_STRENGTH = 15;
const JOKER_STRENGTH = 16;

// Counts cards by mark and number. Used for tracking which cards may still be in other players' hands.
export class CardCounter {
  private readonly counts: number[][];
  private jokers: number;
  constructor() {
    this.counts = NUMBERED_MARKS.map(() => {
      return new Array<number>(14).fill(0);
    });
    this.jokers = 0;
  }

  public static createFullDeck(deckCount: number): CardCounter {
    const c = new CardCounter();
    for (let i = 0; i < NUMBERED_MARKS.length; i++) {
      for (let n = 1; n <= 13; n++) {
        c.counts[i][n] = deckCount;
      }
    }
    // A deck has 2 jokers. See deck.ts.
    c.jokers = deckCount * 2;
    return c;
  }

  public add(card: Card.Card): void {
    if (isJokerOrWild(card)) {
      this.jokers++;
      return;
    }
    this.counts[card.mark][card.cardNumber]++;
  }

  public remove(card: Card.Card): void {
    // Wildcards are jokers played as other cards.
    if (isJokerOrWild(card)) {
      this.jokers = Math.max(0, this.jokers - 1);
      return;
    }
    const n = this.counts[card.mark][card.cardNumber];
    this.counts[card.mark][card.cardNumber] = Math.max(0, n - 1);
  }

  public count(mark: Card.CardMark, cardNumber: number): number {
    if (mark === Card.CardMark.JOKER || mark === Card.CardMark.WILD) {
      return this.jokers;
    }
    return this.counts[mark][cardNumber];
  }

  public countNumber(cardNumber: number): number {
    return this.counts.reduce((acc, v) => {
      return acc + v[cardNumber];
    }, 0);
  }

  public countJokers(): number {
    return this.jokers;
  }
}

export type EvaluationContext = {
  strengthInverted: boolean;
  ruleConfig: RuleConfig;
  // Cards which may be in other players' hands.
  unseen: CardCounter;
  // The largest hand among other players who are still playing. Infinity when unknown.
  maxOpponentHandCount: number;
};

export type EvaluationWeights = {
  // How valuable a group which nobody can beat is.
  controlWeight: number;
  // How bad it is to keep weak groups.
  weaknessWeight: number;
  // Added when every group in the plan is a forbidden agari (the player can't finish with them).
  forbiddenFinishPenalty: number;
};

export const DEFAULT_EVALUATION_WEIGHTS: EvaluationWeights = {
  controlWeight: 1.0,
  weaknessWeight: 0.3,
  forbiddenFinishPenalty: 3,
};

export type CardGroup = {
  readonly kind: "single" | "set" | "kaidan";
  readonly cards: Card.Card[];
  // The strength compared with other groups. For kaidan, this is the strength of the weakest card.
  readonly strength: number;
  // kaidan only
  readonly mark: Card.CardMark | null;
  readonly jokerOnly: boolean;
};

export type HandPlan = {
  readonly groups: CardGroup[];
  // Lower is better. Roughly "the number of plays needed to finish", reduced by the groups nobody can beat.
  readonly cost: number;
  readonly controlCount: number;
};

export function isControlGroup(
  group: CardGroup,
  ctx: EvaluationContext
): boolean {
  // Nobody has enough cards to follow.
  if (group.cards.length > ctx.maxOpponentHandCount) {
    return true;
  }
  // Yagiri always gives the lead back.
  if (
    ctx.ruleConfig.yagiri &&
    group.cards.some((c) => {
      return c.cardNumber === 8;
    })
  ) {
    return true;
  }
  const unseenJokers = ctx.unseen.countJokers();
  const n = group.cards.length;
  switch (group.kind) {
    case "single":
      if (group.jokerOnly) {
        return ctx.unseen.count(Card.CardMark.SPADES, 3) === 0;
      }
      if (unseenJokers > 0) {
        return false;
      }
      return !enumerateStrongerStrengths(group.strength, ctx).some((s) => {
        return ctx.unseen.countNumber(toCardNumber(s)) > 0;
      });
    case "set":
      if (group.jokerOnly) {
        return true;
      }
      if (unseenJokers >= n) {
        return false;
      }
      return !enumerateStrongerStrengths(group.strength, ctx).some((s) => {
        const c = ctx.unseen.countNumber(toCardNumber(s));
        return c > 0 && c + unseenJokers >= n;
      });
    case "kaidan":
      return !NUMBERED_MARKS.some((mark) => {
        return enumerateStrongerStrengths(group.strength, ctx).some((s) => {
          if (s + n - 1 > STRONGEST_STRENGTH) {
            return false;
          }
          let missing = 0;
          for (let t = s; t < s + n; t++) {
            if (ctx.unseen.count(mark, toCardNumber(t)) === 0) {
              missing++;
            }
          }
          return missing < n && missing <= unseenJokers;
        });
      });
  }
}

export function isForbiddenFinish(
  group: CardGroup,
  ctx: EvaluationContext
): boolean {
  // Mirrors legality.isForbiddenAgari. The 3 of spades against a joker is not considered here since it depends on the table.
  if (group.cards.some(isJokerOrWild)) {
    return true;
  }
  const strongest = Calculation.calcStrongestCardNumber(ctx.strengthInverted);
  if (
    group.cards.some((c) => {
      return c.cardNumber === strongest;
    })
  ) {
    return true;
  }
  return (
    ctx.ruleConfig.yagiri &&
    group.cards.every((c) => {
      return c.cardNumber === 8;
    })
  );
}

// Converts a discard pair (which may include wildcards) into a CardGroup.
export function createGroupFromPair(
  pair: CardSelection.CardSelectionPair
): CardGroup {
  const numbered = pair.cards.filter((c) => {
    return !c.isJoker();
  });
  if (numbered.length === 0) {
    return {
      kind: pair.count() === 1 ? "single" : "set",
      cards: pair.cards,
      strength: JOKER_STRENGTH,
      mark: null,
      jokerOnly: true,
    };
  }
  const sameNumber = numbered.every((c) => {
    return c.cardNumber === numbered[0].cardNumber;
  });
  if (!sameNumber) {
    const realCard = numbered.find((c) => {
      return c.mark !== Card.CardMark.WILD;
    });
    return {
      kind: "kaidan",
      cards: pair.cards,
      strength: Math.min(
        ...numbered.map((c) => {
          return c.calcStrength();
        })
      ),
      mark: realCard === undefined ? null : realCard.mark,
      jokerOnly: false,
    };
  }
  return {
    kind: pair.count() === 1 ? "single" : "set",
    cards: pair.cards,
    strength: numbered[0].calcStrength(),
    mark: null,
    jokerOnly: false,
  };
}

type PlanNode = {
  cost: number;
  group: CardGroup | null;
  next: PlanNode | null;
};

type SolveResult = {
  // Best plan which has at least one group the player can finish with.
  finishable: PlanNode | null;
  // Best plan whose groups are all forbidden agari.
  forbiddenOnly: PlanNode | null;
};

// Finds the best way to split the given cards into playable groups.
export function planHand(
  cards: Card.Card[],
  ctx: EvaluationContext,
  weights: EvaluationWeights = DEFAULT_EVALUATION_WEIGHTS
): HandPlan {
  if (cards.length === 0) {
    return { groups: [], cost: 0, controlCount: 0 };
  }
  const jokers = cards.filter((c) => {
    return c.isJoker();
  });
  const numbered = cards
    .filter((c) => {
      return !c.isJoker();
    })
    .sort((a, b) => {
      return a.calcStrength() - b.calcStrength();
    });
  if (numbered.length > 30) {
    throw new Error("too many cards to plan");
  }

  const groupCost = (g: CardGroup) => {
    if (isControlGroup(g, ctx)) {
      return 1 - weights.controlWeight;
    }
    return 1 + weights.weaknessWeight * calcWeakness(g, ctx);
  };

  const memo = new Map<string, SolveResult>();
  const solve = (mask: number, jokersLeft: number): SolveResult => {
    const key = `${mask}|${jokersLeft}`;
    const cached = memo.get(key);
    if (cached !== undefined) {
      return cached;
    }
    let result: SolveResult = { finishable: null, forbiddenOnly: null };
    if (mask === 0) {
      result = solveJokersOnly(jokers.slice(0, jokersLeft), groupCost);
    } else {
      let first = 0;
      while ((mask & (1 << first)) === 0) {
        first++;
      }
      enumerateGroupsWith(first, mask, jokersLeft, numbered, jokers).forEach(
        (cand) => {
          const rest = solve(mask & ~cand.mask, jokersLeft - cand.jokers);
          const c = groupCost(cand.group);
          if (isForbiddenFinish(cand.group, ctx)) {
            result.finishable = better(
              result.finishable,
              link(cand.group, c, rest.finishable)
            );
            result.forbiddenOnly = better(
              result.forbiddenOnly,
              link(cand.group, c, rest.forbiddenOnly)
            );
          } else {
            result.finishable = better(
              result.finishable,
              link(cand.group, c, better(rest.finishable, rest.forbiddenOnly))
            );
          }
        }
      );
    }
    memo.set(key, result);
    return result;
  };

  const all = (1 << numbered.length) - 1;
  const r = solve(all, jokers.length);
  let node = r.finishable;
  let cost = node === null ? Infinity : node.cost;
  if (
    r.forbiddenOnly !== null &&
    r.forbiddenOnly.cost + weights.forbiddenFinishPenalty < cost
  ) {
    node = r.forbiddenOnly;
    cost = r.forbiddenOnly.cost + weights.forbiddenFinishPenalty;
  }
  const groups: CardGroup[] = [];
  while (node !== null && node.group !== null) {
    groups.push(node.group);
    node = node.next;
  }
  return {
    groups: groups,
    cost: cost,
    controlCount: groups.filter((g) => {
      return isControlGroup(g, ctx);
    }).length,
  };
}

const EMPTY_NODE: PlanNode = { cost: 0, group: null, next: null };

function link(
  group: CardGroup,
  cost: number,
  next: PlanNode | null
): PlanNode | null {
  if (next === null) {
    return null;
  }
  return { cost: cost + next.cost, group: group, next: next };
}

function better(a: PlanNode | null, b: PlanNode | null): PlanNode | null {
  if (a === null) {
    return b;
  }
  if (b === null) {
    return a;
  }
  return b.cost < a.cost ? b : a;
}

function solveJokersOnly(
  jokers: Card.Card[],
  groupCost: (g: CardGroup) => number
): SolveResult {
  // Jokers left alone can be played as singles or as one set. Either way they can't be the last play.
  if (jokers.length === 0) {
    return { finishable: null, forbiddenOnly: EMPTY_NODE };
  }
  let singles: PlanNode | null = EMPTY_NODE;
  jokers.forEach((j) => {
    singles = link(
      createJokerGroup([j]),
      groupCost(createJokerGroup([j])),
      singles
    );
  });
  let best: PlanNode | null = singles;
  if (jokers.length <= 4) {
    const set = createJokerGroup(jokers);
    best = better(best, link(set, groupCost(set), EMPTY_NODE));
  }
  return { finishable: null, forbiddenOnly: best };
}

function createJokerGroup(jokers: Card.Card[]): CardGroup {
  return {
    kind: jokers.length === 1 ? "single" : "set",
    cards: jokers,
    strength: JOKER_STRENGTH,
    mark: null,
    jokerOnly: true,
  };
}

type GroupCandidate = {
  group: CardGroup;
  mask: number;
  jokers: number;
};

function enumerateGroupsWith(
  index: number,
  mask: number,
  jokersLeft: number,
  numbered: Card.Card[],
  jokers: Card.Card[]
): GroupCandidate[] {
  const card = numbered[index];
  const ret: GroupCandidate[] = [];
  const takeJokers = (n: number) => {
    return jokers.slice(
      jokers.length - jokersLeft,
      jokers.length - jokersLeft + n
    );
  };

  // single
  ret.push({
    group: {
      kind: "single",
      cards: [card],
      strength: card.calcStrength(),
      mark: null,
      jokerOnly: false,
    },
    mask: 1 << index,
    jokers: 0,
  });

  // sets of the same number, optionally with jokers
  const same: number[] = [];
  for (let i = 0; i < numbered.length; i++) {
    if (
      i !== index &&
      (mask & (1 << i)) !== 0 &&
      numbered[i].cardNumber === card.cardNumber
    ) {
      same.push(i);
    }
  }
  for (let sub = 0; sub < 1 << same.length; sub++) {
    let m = 1 << index;
    const cs = [card];
    same.forEach((v, i) => {
      if ((sub & (1 << i)) !== 0) {
        m |= 1 << v;
        cs.push(numbered[v]);
      }
    });
    for (let j = 0; j <= jokersLeft; j++) {
      const size = cs.length + j;
      if (size < 2 || size > 4) {
        continue;
      }
      ret.push({
        group: {
          kind: "set",
          cards: cs.concat(takeJokers(j)),
          strength: card.calcStrength(),
          mark: null,
          jokerOnly: false,
        },
        mask: m,
        jokers: j,
      });
    }
  }

  // kaidan of the same mark, using jokers to fill the gaps
  const s = card.calcStrength();
  for (let len = 3; len <= 4; len++) {
    for (let start = s - len + 1; start <= s; start++) {
      if (start < WEAKEST_STRENGTH || start + len - 1 > STRONGEST_STRENGTH) {
        continue;
      }
      let m = 1 << index;
      const cs = [card];
      let needed = 0;
      for (let t = start; t < start + len; t++) {
        if (t === s) {
          continue;
        }
        let found = -1;
        for (let i = 0; i < numbered.length; i++) {
          if (
            (mask & (1 << i)) !== 0 &&
            (m & (1 << i)) === 0 &&
            numbered[i].mark === card.mark &&
            numbered[i].calcStrength() === t
          ) {
            found = i;
            break;
          }
        }
        if (found === -1) {
          needed++;
        } else {
          m |= 1 << found;
          cs.push(numbered[found]);
        }
      }
      if (needed > jokersLeft || needed >= len - 1) {
        // Groups made of one card and jokers are covered by sets.
        continue;
      }
      ret.push({
        group: {
          kind: "kaidan",
          cards: cs.concat(takeJokers(needed)),
          strength: start,
          mark: card.mark,
          jokerOnly: false,
        },
        mask: m,
        jokers: needed,
      });
    }
  }
  return ret;
}

function calcWeakness(group: CardGroup, ctx: EvaluationContext): number {
  // 1 for the weakest cards, 0 for the strongest.
  if (group.jokerOnly) {
    return 0;
  }
  const range = STRONGEST_STRENGTH - WEAKEST_STRENGTH;
  return ctx.strengthInverted
    ? (group.strength - WEAKEST_STRENGTH) / range
    : (STRONGEST_STRENGTH - group.strength) / range;
}

function enumerateStrongerStrengths(
  strength: number,
  ctx: EvaluationContext
): number[] {
  const ret: number[] = [];
  for (let s = WEAKEST_STRENGTH; s <= STRONGEST_STRENGTH; s++) {
    if (Calculation.isStrongEnough(strength, s, ctx.strengthInverted)) {
      ret.push(s);
    }
  }
  return ret;
}

function toCardNumber(strength: number): number {
  return Calculation.convertStrengthIntoCardNumber(strength);
}

function isJokerOrWild(card: Card.Card): boolean {
  return card.isJoker() || card.mark === Card.CardMark.WILD;
}
