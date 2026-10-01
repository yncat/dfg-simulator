import * as Card from "../src/card";
import * as CardSelection from "../src/cardSelection";
import * as CpuPlanner from "../src/cpuPlanner";
import * as Rule from "../src/rule";
import { c, createContext } from "./cpuHelper";

const { CLUBS, DIAMONDS, HEARTS, SPADES, JOKER, WILD } = Card.CardMark;

function describeGroups(plan: CpuPlanner.HandPlan): string[] {
  return plan.groups
    .map((g) => {
      return (
        g.kind +
        ":" +
        g.cards
          .map((v) => {
            return v.isJoker() ? "JK" : `${v.cardNumber}`;
          })
          .join("-")
      );
    })
    .sort();
}

describe("CardCounter", () => {
  it("counts a full deck", () => {
    const cc = CpuPlanner.CardCounter.createFullDeck(2);
    expect(cc.count(SPADES, 3)).toBe(2);
    expect(cc.countNumber(3)).toBe(8);
    expect(cc.countJokers()).toBe(4);
  });

  it("treats wildcards as jokers", () => {
    const cc = CpuPlanner.CardCounter.createFullDeck(1);
    cc.remove(c(SPADES, 5).flagAsWildcard());
    expect(cc.countJokers()).toBe(1);
    expect(cc.count(SPADES, 5)).toBe(1);
  });

  it("does not go below zero", () => {
    const cc = new CpuPlanner.CardCounter();
    cc.remove(c(SPADES, 5));
    cc.remove(c(JOKER));
    expect(cc.count(SPADES, 5)).toBe(0);
    expect(cc.countJokers()).toBe(0);
  });
});

describe("planHand", () => {
  it("returns an empty plan for an empty hand", () => {
    const plan = CpuPlanner.planHand([], createContext());
    expect(plan.groups).toStrictEqual([]);
    expect(plan.cost).toBe(0);
  });

  it("groups cards of the same number", () => {
    const hand = [c(CLUBS, 3), c(DIAMONDS, 3), c(SPADES, 9)];
    const plan = CpuPlanner.planHand(hand, createContext({ myHand: hand }));
    expect(describeGroups(plan)).toStrictEqual(["set:3-3", "single:9"]);
  });

  it("finds kaidan", () => {
    const hand = [c(HEARTS, 4), c(HEARTS, 5), c(HEARTS, 6), c(CLUBS, 13)];
    const plan = CpuPlanner.planHand(hand, createContext({ myHand: hand }));
    expect(describeGroups(plan)).toStrictEqual(["kaidan:4-5-6", "single:13"]);
  });

  it("prefers fewer plays when a card can be either in a set or in a kaidan", () => {
    // 5s as a set leaves 4 and 6 alone (3 plays). 4-5-6 kaidan leaves a single 5 (2 plays).
    const hand = [c(HEARTS, 4), c(HEARTS, 5), c(HEARTS, 6), c(CLUBS, 5)];
    const plan = CpuPlanner.planHand(hand, createContext({ myHand: hand }));
    expect(describeGroups(plan)).toStrictEqual(["kaidan:4-5-6", "single:5"]);
  });

  it("uses a joker to fill a kaidan", () => {
    const hand = [c(HEARTS, 4), c(HEARTS, 6), c(JOKER), c(CLUBS, 10)];
    const plan = CpuPlanner.planHand(hand, createContext({ myHand: hand }));
    expect(plan.groups.length).toBe(2);
    expect(describeGroups(plan)).toContain("single:10");
  });

  it("adds a penalty when the hand can only finish with a forbidden agari", () => {
    const ctx = createContext();
    const two = CpuPlanner.planHand([c(SPADES, 2)], ctx);
    const three = CpuPlanner.planHand([c(SPADES, 3)], ctx);
    expect(two.cost).toBeGreaterThan(three.cost + 1);
  });

  it("does not add the penalty when another group can be played last", () => {
    const hand = [c(SPADES, 2), c(SPADES, 4)];
    const ctx = createContext({ myHand: hand });
    const plan = CpuPlanner.planHand(hand, ctx);
    const four = CpuPlanner.planHand([c(SPADES, 4)], ctx);
    // The 2 is a plain group here (jokers are unseen), so it just adds one play.
    expect(plan.cost).toBeCloseTo(four.cost + 1);
  });
});

describe("isControlGroup", () => {
  const single = (card: Card.Card) => {
    return CpuPlanner.createGroupFromPair(
      CardSelection.CreateCardSelectionPairForTest(card)
    );
  };

  it("does not treat a 2 as control while jokers are unseen", () => {
    const two = c(SPADES, 2);
    expect(
      CpuPlanner.isControlGroup(single(two), createContext({ myHand: [two] }))
    ).toBeFalsy();
  });

  it("treats the strongest single as control once jokers are gone", () => {
    const two = c(SPADES, 2);
    const ctx = createContext({ myHand: [two], played: [c(JOKER), c(JOKER)] });
    expect(CpuPlanner.isControlGroup(single(two), ctx)).toBeTruthy();
    expect(CpuPlanner.isControlGroup(single(c(SPADES, 1)), ctx)).toBeFalsy();
  });

  it("does not treat a single joker as control while the 3 of spades is unseen", () => {
    const jk = c(JOKER);
    expect(
      CpuPlanner.isControlGroup(single(jk), createContext({ myHand: [jk] }))
    ).toBeFalsy();
    expect(
      CpuPlanner.isControlGroup(
        single(jk),
        createContext({ myHand: [jk], played: [c(SPADES, 3)] })
      )
    ).toBeTruthy();
  });

  it("considers strength inversion", () => {
    const three = c(SPADES, 3);
    const ctx = createContext({
      myHand: [three],
      played: [c(JOKER), c(JOKER)],
      strengthInverted: true,
    });
    expect(CpuPlanner.isControlGroup(single(three), ctx)).toBeTruthy();
  });

  it("treats a group as control when nobody has enough cards", () => {
    const pair = CpuPlanner.createGroupFromPair(
      CardSelection.CreateCardSelectionPairForTest(c(CLUBS, 4), c(HEARTS, 4))
    );
    expect(
      CpuPlanner.isControlGroup(
        pair,
        createContext({ maxOpponentHandCount: 1 })
      )
    ).toBeTruthy();
    expect(
      CpuPlanner.isControlGroup(
        pair,
        createContext({ maxOpponentHandCount: 2 })
      )
    ).toBeFalsy();
  });

  it("treats 8 as control when yagiri is enabled", () => {
    const r = Rule.createDefaultRuleConfig();
    r.yagiri = true;
    expect(
      CpuPlanner.isControlGroup(
        single(c(CLUBS, 8)),
        createContext({ ruleConfig: r })
      )
    ).toBeTruthy();
  });

  it("checks whether a stronger kaidan can be made from unseen cards", () => {
    const kaidan = CpuPlanner.createGroupFromPair(
      CardSelection.CreateCardSelectionPairForTest(
        c(HEARTS, 12),
        c(HEARTS, 13),
        c(HEARTS, 1)
      )
    );
    // K-A-2 of any mark can beat Q-K-A.
    expect(CpuPlanner.isControlGroup(kaidan, createContext())).toBeFalsy();
    const played = [c(JOKER), c(JOKER)].concat(
      [CLUBS, DIAMONDS, SPADES].map((m) => {
        return c(m, 2);
      })
    );
    expect(
      CpuPlanner.isControlGroup(
        kaidan,
        createContext({ played: played.concat([c(HEARTS, 2)]) })
      )
    ).toBeTruthy();
  });
});

describe("createGroupFromPair", () => {
  it("creates a kaidan group from a pair including a wildcard", () => {
    const g = CpuPlanner.createGroupFromPair(
      CardSelection.CreateCardSelectionPairForTest(
        c(HEARTS, 4),
        c(HEARTS, 5).flagAsWildcard(),
        c(HEARTS, 6)
      )
    );
    expect(g.kind).toBe("kaidan");
    expect(g.strength).toBe(4);
    expect(g.mark).toBe(HEARTS);
  });

  it("creates a joker-only group", () => {
    const g = CpuPlanner.createGroupFromPair(
      CardSelection.CreateCardSelectionPairForTest(c(JOKER), c(JOKER))
    );
    expect(g.kind).toBe("set");
    expect(g.jokerOnly).toBeTruthy();
  });

  it("treats a group including a wildcard as a forbidden finish", () => {
    const g = CpuPlanner.createGroupFromPair(
      CardSelection.CreateCardSelectionPairForTest(c(HEARTS, 4), c(WILD, 4))
    );
    expect(CpuPlanner.isForbiddenFinish(g, createContext())).toBeTruthy();
  });
});
