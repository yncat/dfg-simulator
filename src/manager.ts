/*
Game manager
*/
import * as Player from "./player";

type GameVariables = {
  jBack: boolean;
  kakumei: boolean;
};

export class Manager {
  players: Player.Player[];
  gameVariables: GameVariables;
  constructor() {
    this.players = [];
    this.gameVariables = {
      jBack: false,
      kakumei: false,
    };
  }
}
