/*
Daifugo player ranks
*/

// ranks
export const RankType = {
  UNDETERMINED: 0,
  DAIHINMIN: 1,
  HINMIN: 2,
  HEIMIN: 3,
  FUGO: 4,
  DAIFUGO: 5,
} as const;
export type RankType = typeof RankType[keyof typeof RankType];

type RankDeterminationResult = {
  before: RankType;
  after: RankType;
  changed: boolean;
};

class RankCalculationError extends Error {}

export class Rank {
  private rankType: RankType;
  constructor() {
    this.rankType = RankType.UNDETERMINED;
  }

  public getRankType() {
    return this.rankType;
  }

  public determine(
    NumberOfPlayers: number,
    position: number
  ): RankDeterminationResult {
    const before = this.rankType;
    this.rankType = this.calcRankType(NumberOfPlayers, position);
    return {
      before: before,
      after: this.rankType,
      changed: before != this.rankType,
    };
  }

  private calcRankType(numberOfPlayers: number, position: number) {
    if (numberOfPlayers <= 0) {
      throw new RankCalculationError("number of players must be >0");
    }
    if (position <= 0) {
      throw new RankCalculationError("position must be >0");
    }

    switch (numberOfPlayers) {
      case 1:
        return RankType.DAIFUGO;
      case 2:
        return position == 1 ? RankType.DAIFUGO : RankType.DAIHINMIN;
      case 3:
        return position == 1
          ? RankType.DAIFUGO
          : position == 2
          ? RankType.HEIMIN
          : RankType.DAIHINMIN;
      default:
        if (position == 1) {
          return RankType.DAIFUGO;
        }
        if (position == 2) {
          return RankType.FUGO;
        }
        if (position == numberOfPlayers - 1) {
          return RankType.HINMIN;
        }
        if (position == numberOfPlayers) {
          return RankType.DAIHINMIN;
        }
      // end case
    }
    return RankType.HEIMIN;
  }
}
