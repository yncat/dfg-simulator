/*
CPU players
*/
import * as Card from "./card";
import * as CpuMove from "./cpuMove";
import * as CpuPlanner from "./cpuPlanner";
import * as CpuTracker from "./cpuTracker";
import type { ActivePlayerControl, Game } from "./game";

export type Personality = {
  memory: CpuTracker.MemoryLevel;
  // Randomness of decisions. 0 always picks the best move.
  temperature: number;
  // How valuable a group which nobody can beat is. Higher values make the CPU keep strong cards.
  controlWeight: number;
  // How bad it is to keep weak groups.
  weaknessWeight: number;
  // Bonus for a play which surely takes the lead.
  leadWeight: number;
  // Penalty for passing. Higher values make the CPU play whenever it can.
  passPenalty: number;
  // Bonus for playing kakumei.
  kakumeiBias: number;
  // Bonus for playing (instead of passing) when another player is about to finish.
  defenseWeight: number;
  forbiddenFinishPenalty: number;
};

const BASE_PERSONALITY: Personality = {
  memory: "none",
  temperature: 0.3,
  // Keep controlWeight - leadWeight below 1. Otherwise passing always looks better than spending a strong card, and the CPU never uses them.
  controlWeight: 1.0,
  weaknessWeight: 0.3,
  leadWeight: 1.0,
  passPenalty: 0,
  kakumeiBias: 0,
  defenseWeight: 0.5,
  forbiddenFinishPenalty: 3,
};

export const Personalities: Record<
  "NORMAL" | "ONI" | "SEKKACHI" | "KECHI" | "HARAN",
  Personality
> = {
  // Plays reasonably but doesn't remember played cards.
  NORMAL: BASE_PERSONALITY,
  // Remembers every card and always picks the best move.
  ONI: {
    ...BASE_PERSONALITY,
    memory: "full",
    temperature: 0,
    defenseWeight: 1.5,
  },
  // Impatient. Uses strong cards early to take the lead and rarely passes.
  SEKKACHI: {
    ...BASE_PERSONALITY,
    controlWeight: 0.6,
    leadWeight: 1.2,
    passPenalty: 0.8,
  },
  // Stingy. Keeps strong cards until the very end.
  KECHI: {
    ...BASE_PERSONALITY,
    memory: "strong",
    controlWeight: 1.6,
    leadWeight: 0.4,
  },
  // Loves chaos. Plays kakumei whenever possible.
  HARAN: {
    ...BASE_PERSONALITY,
    temperature: 0.6,
    kakumeiBias: 3,
  },
};

export type DecisionContext = CpuPlanner.EvaluationContext & {
  // True when the table is empty and the player can play anything.
  isLeading: boolean;
  // The smallest hand among other players who are still playing. Infinity when unknown.
  minOpponentHandCount: number;
};

export function createDecisionContext(
  game: Game,
  playerIdentifier: string,
  tracker: CpuTracker.CardTracker,
  memory: CpuTracker.MemoryLevel
): DecisionContext {
  const hand = game.findPlayerByIdentifier(playerIdentifier).hand.cards;
  const counts = tracker.enumerateOpponentHandCounts(playerIdentifier);
  return {
    strengthInverted: game.outputStrengthInverted(),
    ruleConfig: game.outputRuleConfig(),
    unseen: tracker.calcUnseenCards(hand, memory),
    maxOpponentHandCount: counts.length === 0 ? Infinity : Math.max(...counts),
    minOpponentHandCount: counts.length === 0 ? Infinity : Math.min(...counts),
    isLeading: game.outputDiscardStack().length === 0,
  };
}

export type ScoredMove = {
  // null means pass.
  move: CpuMove.LegalMove | null;
  score: number;
};

// Scores every legal move (and pass when following). Higher is better.
export function scoreMoves(
  control: ActivePlayerControl,
  ctx: DecisionContext,
  personality: Personality
): ScoredMove[] {
  const hand = control.enumerateHand();
  const weights = toWeights(personality);
  const ret: ScoredMove[] = CpuMove.enumerateLegalMoves(control).map((m) => {
    return { move: m, score: scoreMove(hand, m, ctx, personality, weights) };
  });
  if (!ctx.isLeading || ret.length === 0) {
    const current = CpuPlanner.planHand(hand, ctx, weights);
    ret.push({ move: null, score: -current.cost - personality.passPenalty });
  }
  return ret;
}

// Decides the move. null means pass.
export function decide(
  control: ActivePlayerControl,
  ctx: DecisionContext,
  personality: Personality,
  rng: () => number = Math.random
): CpuMove.LegalMove | null {
  const scored = scoreMoves(control, ctx, personality);
  return pick(scored, personality.temperature, rng).move;
}

// Chooses which card to give away by 7 transfer or 10 exile. Returns an index of the given cards.
export function chooseCardToGiveAway(
  cards: Card.Card[],
  ctx: CpuPlanner.EvaluationContext,
  personality: Personality
): number {
  const weights = toWeights(personality);
  let best = 0;
  let bestCost = Infinity;
  cards.forEach((_, i) => {
    const rest = cards.filter((__, j) => {
      return j !== i;
    });
    const cost = CpuPlanner.planHand(rest, ctx, weights).cost;
    if (cost < bestCost) {
      best = i;
      bestCost = cost;
    }
  });
  return best;
}

// The easiest CPU: plays a random legal move.
// Moves are grouped by the hand cards they use, so that jokers (which can form many combinations) are not chosen too often.
export function decideRandom(
  control: ActivePlayerControl,
  isLeading: boolean,
  passRate = 0.2,
  rng: () => number = Math.random
): CpuMove.LegalMove | null {
  const moves = CpuMove.enumerateLegalMoves(control);
  if (moves.length === 0 || (!isLeading && rng() < passRate)) {
    return null;
  }
  const byCards = new Map<string, CpuMove.LegalMove[]>();
  moves.forEach((m) => {
    const key = control
      .enumerateHand()
      .filter((_, i) => {
        return m.indices.includes(i);
      })
      .map((c) => {
        return c.isJoker() ? "J" : `${c.mark}:${c.cardNumber}`;
      })
      .sort()
      .join(",");
    const lst = byCards.get(key);
    if (lst === undefined) {
      byCards.set(key, [m]);
    } else {
      lst.push(m);
    }
  });
  const groups = Array.from(byCards.values());
  const g = groups[Math.floor(rng() * groups.length)];
  return g[Math.floor(rng() * g.length)];
}

function scoreMove(
  hand: Card.Card[],
  move: CpuMove.LegalMove,
  ctx: DecisionContext,
  personality: Personality,
  weights: CpuPlanner.EvaluationWeights
): number {
  const group = CpuPlanner.createGroupFromPair(move.pair);
  const rest = hand.filter((_, i) => {
    return !move.indices.includes(i);
  });
  if (rest.length === 0) {
    return CpuPlanner.isForbiddenFinish(group, ctx) ? -1000 : 1000;
  }
  const kakumei = ctx.ruleConfig.kakumei && move.pair.count() >= 4;
  const after = CpuPlanner.planHand(
    rest,
    {
      ...ctx,
      strengthInverted: kakumei ? !ctx.strengthInverted : ctx.strengthInverted,
    },
    weights
  );
  let score = -after.cost;
  if (CpuPlanner.isControlGroup(group, ctx)) {
    score += personality.leadWeight;
  }
  if (kakumei) {
    score += personality.kakumeiBias;
  }
  if (ctx.minOpponentHandCount <= 2) {
    score += personality.defenseWeight;
  }
  return score;
}

function pick(
  scored: ScoredMove[],
  temperature: number,
  rng: () => number
): ScoredMove {
  let best = scored[0];
  scored.forEach((s) => {
    if (s.score > best.score) {
      best = s;
    }
  });
  if (temperature <= 0) {
    return best;
  }
  // softmax
  const ws = scored.map((s) => {
    return Math.exp((s.score - best.score) / temperature);
  });
  const total = ws.reduce((a, b) => {
    return a + b;
  }, 0);
  let r = rng() * total;
  for (let i = 0; i < scored.length; i++) {
    r -= ws[i];
    if (r <= 0) {
      return scored[i];
    }
  }
  return scored[scored.length - 1];
}

function toWeights(personality: Personality): CpuPlanner.EvaluationWeights {
  return {
    controlWeight: personality.controlWeight,
    weaknessWeight: personality.weaknessWeight,
    forbiddenFinishPenalty: personality.forbiddenFinishPenalty,
  };
}
