/*
Game manager
*/
import * as Player from "./player";
import * as Deck from "./deck";
import * as CalcFunctions from "./calcFunctions";

export type StartInfo = {
  playerCount: number; // Number of players joined in the game
  deckCount: number; // How many decks are being used?
  // Arrays above are all sorted by actual play order.
  playerIdentifiers: string[]; // player identifiers
  handCounts: number[]; // Number of cards given
};

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
  for (let i = 0; i < players.length - 1; i++) {
    for (let j = i + 1; j < players.length; j++) {
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
  private startInfo: StartInfo;
  constructor(players: Player.Player[]) {
    this.players = players;
    this.startInfo = this.prepair();
  }

  private prepair(): StartInfo {
    const deckCount = CalcFunctions.calcRequiredDeckCount(this.players.length);
    const decks: Deck.Deck[] = [];
    for (let i = 0; i < deckCount; i++) {
      const d = new Deck.Deck();
      d.shuffle();
      decks.push(d);
    }
    return {
      playerCount: this.players.length,
      deckCount: deckCount,
      playerIdentifiers: [],
      handCounts: [],
    };
  }
}
