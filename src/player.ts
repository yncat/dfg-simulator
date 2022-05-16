/*
Daifugo player
*/

import { Rank } from "./rank";
import { Hand, createHand } from "./hand";

export interface Player {
  readonly hand: Hand;
  readonly rank: Rank;
  readonly identifier: string;
  isKicked: () => boolean;
  markAsKicked: () => void;
}

export function createPlayer(identifier: string): Player {
  return new PlayerImple(identifier);
}

export class PlayerImple implements Player {
  public readonly hand: Hand;
  public readonly rank: Rank;
  public readonly identifier: string;
  private kicked: boolean;
  constructor(identifier: string) {
    this.identifier = identifier;
    this.hand = createHand();
    this.rank = new Rank();
    this.kicked = false;
  }

  public isKicked(): boolean {
    return this.kicked;
  }

  public markAsKicked(): void {
    this.kicked = true;
  }
}
