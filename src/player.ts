/*
Daifugo player
*/

import { Rank } from "./rank";
import { Hand } from "./hand";

export function generateUniqueIdentifiers(count: number): string[] {
  const ret: string[] = [];
  for (let i = 0; i < count; i++) {
    let id = "";
    while (id === "" || ret.includes(id)) {
      id = randomHex(16);
    }
    ret.push(id);
  }
  return ret;
}

function randomHex(size: number) {
  const s: string[] = [];
  for (let i = 0; i < size; i++) {
    s.push(Math.floor(Math.random() * 16).toString(16));
  }
  return s.join("");
}

export class Player {
  public readonly hand: Hand;
  public readonly rank: Rank;
  public readonly identifier: string;
  constructor(identifier: string) {
    this.identifier = identifier;
    this.hand = new Hand();
    this.rank = new Rank();
  }
}
