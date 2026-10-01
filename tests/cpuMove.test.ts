import * as Card from "../src/card";
import * as CpuMove from "../src/cpuMove";
import { c, createControl } from "./cpuHelper";

const { CLUBS, DIAMONDS, HEARTS, SPADES, JOKER } = Card.CardMark;

function describeMoves(moves: CpuMove.LegalMove[]): string[] {
  return moves
    .map((m) => {
      return m.pair.cards
        .map((v) => {
          return v.isJoker() ? "JK" : `${v.cardNumber}`;
        })
        .join("-");
    })
    .sort();
}

describe("enumerateLegalMoves", () => {
  it("enumerates singles, sets and kaidan when leading", () => {
    const ctrl = createControl([
      c(CLUBS, 3),
      c(DIAMONDS, 3),
      c(HEARTS, 4),
      c(HEARTS, 5),
      c(HEARTS, 6),
    ]);
    const moves = CpuMove.enumerateLegalMoves(ctrl);
    expect(describeMoves(moves)).toStrictEqual(
      ["3", "3", "3-3", "4", "4-5-6", "5", "6"].sort()
    );
  });

  it("only enumerates moves which beat the last discard", () => {
    const ctrl = createControl(
      [c(CLUBS, 3), c(DIAMONDS, 3), c(CLUBS, 9), c(DIAMONDS, 9), c(SPADES, 13)],
      [c(SPADES, 5), c(HEARTS, 5)]
    );
    const moves = CpuMove.enumerateLegalMoves(ctrl);
    expect(describeMoves(moves)).toStrictEqual(["9-9"]);
  });

  it("does not enumerate duplicated combinations made by two jokers", () => {
    const ctrl = createControl([c(CLUBS, 3), c(JOKER), c(JOKER)]);
    const moves = CpuMove.enumerateLegalMoves(ctrl);
    const singleJokers = moves.filter((m) => {
      return m.pair.count() === 1 && m.pair.cards[0].isJoker();
    });
    expect(singleJokers.length).toBe(1);
  });

  it("leaves the control with no cards selected", () => {
    const ctrl = createControl([c(CLUBS, 3), c(DIAMONDS, 3), c(JOKER)]);
    CpuMove.enumerateLegalMoves(ctrl);
    expect(ctrl.countSelectedCards()).toBe(0);
  });

  it("returns nothing when nothing can be played", () => {
    const ctrl = createControl([c(CLUBS, 3)], [c(SPADES, 2)]);
    expect(CpuMove.enumerateLegalMoves(ctrl)).toStrictEqual([]);
  });
});

describe("applyMove", () => {
  it("discards the pair of the given move", () => {
    const ctrl = createControl([c(CLUBS, 3), c(DIAMONDS, 3), c(JOKER)]);
    const moves = CpuMove.enumerateLegalMoves(ctrl);
    const m = moves.find((v) => {
      return v.pair.count() === 3;
    }) as CpuMove.LegalMove;
    CpuMove.applyMove(ctrl, m);
    expect(ctrl.hasPassed()).toBeFalsy();
    expect(ctrl.getDiscard()).toBe(m.pair);
  });

  it("passes when the move is null", () => {
    const ctrl = createControl([c(CLUBS, 3)], [c(SPADES, 2)]);
    CpuMove.applyMove(ctrl, null);
    expect(ctrl.hasPassed()).toBeTruthy();
  });
});
