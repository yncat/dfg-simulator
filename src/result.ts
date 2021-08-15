import type { Player } from "./player";
import type { RankType } from "./rank";

export interface Result {
  getIdentifiersByRank: (rankType: RankType) => string[];
  getRankByIdentifier: (identifier: string) => RankType;
}

class ResultError extends Error {}

class ResultImple implements Result {
  private readonly rankMap: Map<string, RankType>;
  constructor(players: Player[]) {
    this.rankMap = new Map<string, RankType>();
    players.forEach((v) => {
      this.rankMap.set(v.identifier, v.rank.getRankType());
    });
  }

  public getIdentifiersByRank(rankType: RankType): string[] {
    const ret: string[] = [];
    this.rankMap.forEach((v, k) => {
      if (v === rankType) {
        ret.push(k);
      }
    });
    return ret;
  }

  public getRankByIdentifier(identifier: string): RankType {
    const ret = this.rankMap.get(identifier);
    if (!ret) {
      throw new ResultError("identifier is not found");
    }
    return ret;
  }
}

export function createResult(players: Player[]): Result {
  return new ResultImple(players);
}
