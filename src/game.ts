/*
Game manager
*/
import * as Player from "./player";

export class GameInitializationError extends Error {}

export interface Game {}

export function createGame(players: Player.Player[]): Game {
  if (!identifiersValid(players)) {
    throw new GameInitializationError(
      "one of the players' identifiers is duplicating"
    );
  }

  const g = new GameImple(players);
  return g;
}

function identifiersValid(players: Player.Player[]) {
  let found = false;
  for (let i = 0; i < players.length-1; i++) {
    for (let j = i+1; j < players.length; j++) {
      if (players[i].identifier == players[j].identifier) {
        found = true;
        break;
      }
    }
  }
  return !found;
}

class GameImple implements Game {
  private players: Player.Player[];
  constructor(players: Player.Player[]) {
    this.players = players;
  }
}
