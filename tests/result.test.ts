import * as Result from "../src/result";
import * as Player from "../src/player";
import * as Rank from "../src/Rank";

describe("getIdentifiersByRank", () => {
  it("can get all player identifiers who has the specified rank", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    const p3 = Player.createPlayer("c");
    p1.rank.force(Rank.RankType.DAIFUGO);
    p2.rank.force(Rank.RankType.HEIMIN);
    p3.rank.force(Rank.RankType.HEIMIN);
    const r = Result.createResult([p1, p2, p3]);
    expect(r.getIdentifiersByRank(Rank.RankType.DAIFUGO)).toStrictEqual([
      p1.identifier,
    ]);
    expect(r.getIdentifiersByRank(Rank.RankType.HEIMIN)).toStrictEqual([
      p2.identifier,
      p3.identifier,
    ]);
    expect(r.getIdentifiersByRank(Rank.RankType.DAIHINMIN)).toStrictEqual([]);
  });
});

describe("getRankTypeByIdentifier", () => {
  it("can get the specified player's rank", () => {
    const p1 = Player.createPlayer("a");
    const p2 = Player.createPlayer("b");
    p1.rank.force(Rank.RankType.DAIFUGO);
    p2.rank.force(Rank.RankType.HEIMIN);
    const r = Result.createResult([p1, p2]);
    expect(r.getRankByIdentifier(p1.identifier)).toBe(Rank.RankType.DAIFUGO);
    expect(r.getRankByIdentifier(p2.identifier)).toBe(Rank.RankType.HEIMIN);
  });
});
