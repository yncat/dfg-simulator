/*
Daifugo player
*/

import { Rank } from "./rank";
import { Hand } from "./hand";

export class Player {
  constructor(public hand: Hand, public rank: Rank) {}
}
