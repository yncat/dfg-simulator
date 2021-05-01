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

export interface Game {
  readonly startInfo: StartInfo;
}

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
  public readonly startInfo: StartInfo;
  constructor(players: Player.Player[]) {
    this.players = players;
    this.startInfo = this.prepair();
  }

  private prepair(): StartInfo {
    this.shufflePlayers();
    const decks = this.prepairDecks();
    const deckCount = decks.length;
    this.distributeCards(decks);
    return {
      playerCount: this.players.length,
      deckCount: deckCount,
      playerIdentifiers: this.enumeratePlayerIdentifiers(),
      handCounts: this.enumerateHandCounts(),
    };
  }

  private shufflePlayers() {
    const out = Array.from(this.players);
    for (let i = out.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[r];
      out[r] = tmp;
    }
    this.players = out;
  }

  private prepairDecks() {
    const deckCount = CalcFunctions.calcRequiredDeckCount(this.players.length);
    const decks: Deck.Deck[] = [];
    for (let i = 0; i < deckCount; i++) {
      const d = new Deck.Deck();
      d.shuffle();
      decks.push(d);
    }
    return decks;
  }

  private distributeCards(decks: Deck.Deck[]) {
    while (decks.length > 0) {
      for (let i = 0; i < this.players.length; i++) {
        let c = decks[0].draw();
        if (c === null) {
          decks.shift();
          if (decks.length == 0) {
            break;
          }
          c = decks[0].draw();
          if (c === null) {
            throw new GameInitializationError(
              "deck is unexpectedly empty, maybe corrupted?"
            );
          }
        }
        this.players[i].hand.give(c);
      }
    }
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].hand.sort();
    }
  }

  private enumeratePlayerIdentifiers() {
    return this.players.map((v) => {
      return v.identifier;
    });
  }

  private enumerateHandCounts() {
    return this.players.map((v) => {
      return v.hand.count();
    });
  }
}
