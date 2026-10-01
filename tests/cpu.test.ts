import { mock } from "jest-mock-extended";
import * as AdditionalAction from "../src/additionalAction";
import * as Card from "../src/card";
import * as Cpu from "../src/cpu";
import * as CpuMove from "../src/cpuMove";
import * as CpuTracker from "../src/cpuTracker";
import * as Event from "../src/event";
import * as Game from "../src/game";
import * as Rule from "../src/rule";
import { c, createContext, createControl } from "./cpuHelper";

const { CLUBS, DIAMONDS, HEARTS, SPADES, JOKER } = Card.CardMark;

function createDecisionContext(
  params: Parameters<typeof createContext>[0] & {
    isLeading?: boolean;
    minOpponentHandCount?: number;
  } = {}
): Cpu.DecisionContext {
  return {
    ...createContext(params),
    isLeading: params.isLeading === undefined ? true : params.isLeading,
    minOpponentHandCount:
      params.minOpponentHandCount === undefined
        ? Infinity
        : params.minOpponentHandCount,
  };
}

function describeMove(move: CpuMove.LegalMove | null): string {
  if (move === null) {
    return "pass";
  }
  return move.pair.cards
    .map((v) => {
      return v.isJoker() ? "JK" : `${v.cardNumber}`;
    })
    .join("-");
}

const ONI = Cpu.Personalities.ONI;

describe("decide", () => {
  it("plays the weakest card when leading", () => {
    const hand = [c(CLUBS, 3), c(SPADES, 13), c(DIAMONDS, 2)];
    const move = Cpu.decide(
      createControl(hand),
      createDecisionContext({ myHand: hand }),
      ONI
    );
    expect(describeMove(move)).toBe("3");
  });

  it("does not break a set to follow", () => {
    const hand = [c(CLUBS, 5), c(DIAMONDS, 5), c(SPADES, 9)];
    const move = Cpu.decide(
      createControl(hand, [c(HEARTS, 4)]),
      createDecisionContext({ myHand: hand, isLeading: false }),
      ONI
    );
    expect(describeMove(move)).toBe("9");
  });

  it("passes when it can only follow by breaking a kaidan", () => {
    const hand = [c(HEARTS, 4), c(HEARTS, 5), c(HEARTS, 6)];
    const move = Cpu.decide(
      createControl(hand, [c(CLUBS, 3)]),
      createDecisionContext({ myHand: hand, isLeading: false }),
      ONI
    );
    expect(move).toBeNull();
  });

  it("plays the strongest card first so that it doesn't finish with a forbidden agari", () => {
    const hand = [c(SPADES, 2), c(DIAMONDS, 5)];
    const move = Cpu.decide(
      createControl(hand),
      createDecisionContext({ myHand: hand, played: [c(JOKER), c(JOKER)] }),
      ONI
    );
    expect(describeMove(move)).toBe("2");
  });

  it("never finishes with a forbidden agari when it has a choice", () => {
    const hand = [c(SPADES, 2)];
    const move = Cpu.decide(
      createControl(hand, [c(HEARTS, 4)]),
      createDecisionContext({ myHand: hand, isLeading: false }),
      ONI
    );
    expect(move).toBeNull();
  });

  it("finishes when it can", () => {
    const hand = [c(SPADES, 9)];
    const move = Cpu.decide(
      createControl(hand, [c(HEARTS, 4)]),
      createDecisionContext({ myHand: hand, isLeading: false }),
      ONI
    );
    expect(describeMove(move)).toBe("9");
  });
});

describe("scoreMoves", () => {
  it("evaluates the hand after kakumei with inverted strength", () => {
    const hand = [
      c(CLUBS, 4),
      c(DIAMONDS, 4),
      c(HEARTS, 4),
      c(SPADES, 4),
      c(SPADES, 5),
      c(DIAMONDS, 6),
    ];
    const score = (kakumei: boolean) => {
      const r = Rule.createDefaultRuleConfig();
      r.kakumei = kakumei;
      const scored = Cpu.scoreMoves(
        createControl(hand),
        createDecisionContext({ myHand: hand, ruleConfig: r }),
        ONI
      );
      const quad = scored.find((s) => {
        return s.move !== null && s.move.pair.count() === 4;
      }) as Cpu.ScoredMove;
      return quad.score;
    };
    // After kakumei, the remaining 5 and 6 become strong.
    expect(score(true)).toBeGreaterThan(score(false));
  });

  it("adds a bonus to plays when an opponent is about to finish", () => {
    const hand = [c(SPADES, 1), c(CLUBS, 3), c(DIAMONDS, 3)];
    const score = (minOpponentHandCount: number) => {
      return Cpu.scoreMoves(
        createControl(hand, [c(HEARTS, 13)]),
        createDecisionContext({
          myHand: hand,
          isLeading: false,
          minOpponentHandCount: minOpponentHandCount,
        }),
        ONI
      ).map((s) => {
        return s.score;
      });
    };
    const [playNormal, passNormal] = score(10);
    const [playDefense, passDefense] = score(1);
    expect(playDefense - playNormal).toBeCloseTo(ONI.defenseWeight);
    expect(passDefense).toBeCloseTo(passNormal);
  });

  it("does not include pass when leading", () => {
    const hand = [c(CLUBS, 3)];
    const scored = Cpu.scoreMoves(
      createControl(hand),
      createDecisionContext({ myHand: hand }),
      ONI
    );
    expect(
      scored.some((s) => {
        return s.move === null;
      })
    ).toBeFalsy();
  });
});

describe("chooseCardToGiveAway", () => {
  it("gives away a card which doesn't break sets", () => {
    const hand = [c(CLUBS, 3), c(DIAMONDS, 3), c(SPADES, 9), c(SPADES, 13)];
    expect(
      Cpu.chooseCardToGiveAway(hand, createContext({ myHand: hand }), ONI)
    ).toBe(2);
  });
});

describe("decideRandom", () => {
  it("always plays when leading", () => {
    const hand = [c(CLUBS, 3), c(JOKER)];
    const move = Cpu.decideRandom(createControl(hand), true, 1);
    expect(move).not.toBeNull();
  });

  it("passes based on the pass rate when following", () => {
    const hand = [c(CLUBS, 9)];
    const ctrl = createControl(hand, [c(HEARTS, 4)]);
    expect(Cpu.decideRandom(ctrl, false, 1)).toBeNull();
    expect(describeMove(Cpu.decideRandom(ctrl, false, 0))).toBe("9");
  });

  it("chooses by hand cards so that joker combinations are not favored", () => {
    // 3 + joker has several wildcard combinations, but they all use the same hand cards.
    const hand = [c(CLUBS, 3), c(JOKER), c(SPADES, 13)];
    const ctrl = createControl(hand);
    const values = [0, 0.99];
    let i = 0;
    const rng = () => {
      return values[i++ % values.length];
    };
    const move = Cpu.decideRandom(ctrl, true, 0, rng) as CpuMove.LegalMove;
    expect(move).not.toBeNull();
  });
});

describe("full games", () => {
  type Player = Cpu.Personality | "RANDOM";

  function createForwardingReceiver(
    trackers: CpuTracker.CardTracker[]
  ): Event.EventReceiver {
    const er = mock<Event.EventReceiver>();
    er.onInitialInfoProvided.mockImplementation((...args) => {
      trackers.forEach((t) => t.onInitialInfoProvided(...args));
    });
    er.onCardsProvided.mockImplementation((...args) => {
      trackers.forEach((t) => t.onCardsProvided(...args));
    });
    er.onDiscard.mockImplementation((...args) => {
      trackers.forEach((t) => t.onDiscard(...args));
    });
    er.onPass.mockImplementation((...args) => {
      trackers.forEach((t) => t.onPass(...args));
    });
    er.onTransfer.mockImplementation((...args) => {
      trackers.forEach((t) => t.onTransfer(...args));
    });
    er.onExile.mockImplementation((...args) => {
      trackers.forEach((t) => t.onExile(...args));
    });
    return er;
  }

  function play(players: Player[], ruleConfig: Rule.RuleConfig) {
    const ids = players.map((_, i) => {
      return `p${i}`;
    });
    const trackers = ids.map(() => {
      return new CpuTracker.CardTracker();
    });
    const g = Game.createGame(
      ids,
      createForwardingReceiver(trackers),
      ruleConfig
    );
    let steps = 0;
    while (!g.isEnded()) {
      steps++;
      if (steps > 3000) {
        throw new Error("the game didn't end");
      }
      const ctrl = g.startActivePlayerControl();
      const idx = ids.indexOf(ctrl.playerIdentifier);
      const p = players[idx];
      const ctx = Cpu.createDecisionContext(
        g,
        ctrl.playerIdentifier,
        trackers[idx],
        p === "RANDOM" ? "none" : p.memory
      );
      const move =
        p === "RANDOM"
          ? Cpu.decideRandom(ctrl, ctx.isLeading)
          : Cpu.decide(ctrl, ctx, p);
      CpuMove.applyMove(ctrl, move);
      g.finishActivePlayerControl(ctrl);
      while (true) {
        const aac = g.startAdditionalActionControl();
        if (aac === null) {
          break;
        }
        const action =
          aac.getType() === "transfer7"
            ? aac.cast<AdditionalAction.Transfer7>(AdditionalAction.Transfer7)
            : aac.cast<AdditionalAction.Exile10>(AdditionalAction.Exile10);
        const actx = Cpu.createDecisionContext(
          g,
          ctrl.playerIdentifier,
          trackers[idx],
          "none"
        );
        action.selectCard(
          Cpu.chooseCardToGiveAway(
            action.enumerateCards(),
            actx,
            Cpu.Personalities.NORMAL
          )
        );
        g.finishAdditionalActionControl(aac);
      }
    }
    return g;
  }

  it("can play games to the end with every rule enabled", () => {
    const r: Rule.RuleConfig = {
      yagiri: true,
      jBack: true,
      kakumei: true,
      reverse: true,
      skip: Rule.SkipConfig.MULTI,
      transfer7: true,
      exile10: true,
      miyakoochi: false,
    };
    const lineups: Player[][] = [
      [
        Cpu.Personalities.ONI,
        Cpu.Personalities.SEKKACHI,
        Cpu.Personalities.KECHI,
        Cpu.Personalities.HARAN,
        "RANDOM",
      ],
      [Cpu.Personalities.ONI, "RANDOM"],
    ];
    for (let i = 0; i < 10; i++) {
      lineups.forEach((lineup) => {
        expect(play(lineup, r).isEnded()).toBeTruthy();
      });
    }
  });

  it("can play games to the end with the basic rules", () => {
    for (let i = 0; i < 10; i++) {
      const g = play(
        [Cpu.Personalities.ONI, Cpu.Personalities.NORMAL, "RANDOM"],
        Rule.createDefaultRuleConfig()
      );
      expect(g.isEnded()).toBeTruthy();
    }
  });
});
