import { getJSDocReadonlyTag } from "typescript";
import * as Rank from "../src/rank";

describe("Rank", () => {
  it("Can be instantiated with undetermined rank type", () => {
    const r = new Rank.Rank();
    expect(r.getRankType()).toBe(Rank.RankType.UNDETERMINED);
  });
});

describe("rank determination", () => {
  test("when number of player is 1", () => {
    const r1 = new Rank.Rank();
    r1.determine(1, 1);
    expect(r1.getRankType()).toBe(Rank.RankType.DAIFUGO);
  });

  test("when number of player is 2", () => {
    const r1 = new Rank.Rank();
    const r2 = new Rank.Rank();
    r1.determine(2, 1);
    r2.determine(2, 2);
    expect(r1.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(r2.getRankType()).toBe(Rank.RankType.DAIHINMIN);
  });

  test("when number of player is 3", () => {
    const r1 = new Rank.Rank();
    const r2 = new Rank.Rank();
    const r3 = new Rank.Rank();
    r1.determine(3, 1);
    r2.determine(3, 2);
    r3.determine(3, 3);
    expect(r1.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(r2.getRankType()).toBe(Rank.RankType.HEIMIN);
    expect(r3.getRankType()).toBe(Rank.RankType.DAIHINMIN);
  });

  test("when number of player is 4", () => {
    const r1 = new Rank.Rank();
    const r2 = new Rank.Rank();
    const r3 = new Rank.Rank();
    const r4 = new Rank.Rank();
    r1.determine(4, 1);
    r2.determine(4, 2);
    r3.determine(4, 3);
    r4.determine(4, 4);
    expect(r1.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(r2.getRankType()).toBe(Rank.RankType.FUGO);
    expect(r3.getRankType()).toBe(Rank.RankType.HINMIN);
    expect(r4.getRankType()).toBe(Rank.RankType.DAIHINMIN);
  });

  test("when number of player is 5", () => {
    const r1 = new Rank.Rank();
    const r2 = new Rank.Rank();
    const r3 = new Rank.Rank();
    const r4 = new Rank.Rank();
    const r5 = new Rank.Rank();
    r1.determine(5, 1);
    r2.determine(5, 2);
    r3.determine(5, 3);
    r4.determine(5, 4);
    r5.determine(5, 5);
    expect(r1.getRankType()).toBe(Rank.RankType.DAIFUGO);
    expect(r2.getRankType()).toBe(Rank.RankType.FUGO);
    expect(r3.getRankType()).toBe(Rank.RankType.HEIMIN);
    expect(r4.getRankType()).toBe(Rank.RankType.HINMIN);
    expect(r5.getRankType()).toBe(Rank.RankType.DAIHINMIN);
  });
});
