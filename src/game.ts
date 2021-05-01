/*
Game manager
*/
import * as Player from "./player";

export class Game {
  players: Player.Player[];
  constructor() {
    this.players = [];
  }
}
