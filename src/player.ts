/*
Daifugo player
*/

import { Rank } from "./rank";
import { Hand, createHand } from "./hand";

export interface Player {
  readonly hand: Hand;
  readonly rank: Rank;
  readonly identifier: string;
}

export function createPlayer(identifier: string): Player {
  return new PlayerImple(identifier);
}

export class PlayerImple implements Player {
  public readonly hand: Hand;
  public readonly rank: Rank;
  public readonly identifier: string;
  constructor(identifier: string) {
    this.identifier = identifier;
    this.hand = createHand();
    this.rank = new Rank();
  }
}
