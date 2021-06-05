import { Game, GameImple } from "./game";
import { Player } from "./player";
import { Deck } from "./deck";
import { calcRequiredDeckCount } from "./calcFunctions";
import { createNullDiscardPair } from "./discard";
import * as Event from "./event";

export class GameCreationError extends Error {}

export function createEventConfig(): Event.EventConfig {
  return Event.createDefaultEventConfig();
}

export function createGame(
  players: Player[],
  eventConfig: Event.EventConfig
): Game {
  if (!identifiersValid(players)) {
    throw new GameCreationError(
      "one of the players' identifiers is duplicating"
    );
  }

  const shuffledPlayers = shufflePlayers(players);
  const decks = prepareDecks(players.length);
  distributeCards(shuffledPlayers, decks);

  const params = {
    players: shuffledPlayers,
    activePlayerIndex: 0,
    activePlayerActionCount: 0,
    lastDiscardPair: createNullDiscardPair(),
    lastDiscarderIdentifier: "",
    strengthInverted: false,
    agariPlayerIdentifiers: [],
    eventDispatcher: Event.createEventDispatcher(eventConfig),
  };

  const g = new GameImple(params);
  return g;
}

function identifiersValid(players: Player[]) {
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

function shufflePlayers(players: Player[]): Player[] {
  const out = Array.from(players);
  for (let i = out.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[r];
    out[r] = tmp;
  }
  return out;
}

function prepareDecks(playerCount: number): Deck[] {
  const deckCount = calcRequiredDeckCount(playerCount);
  const decks: Deck[] = [];
  for (let i = 0; i < deckCount; i++) {
    const d = new Deck();
    d.shuffle();
    decks.push(d);
  }
  return decks;
}

function distributeCards(players: Player[], decks: Deck[]) {
  while (decks.length > 0) {
    for (let i = 0; i < players.length; i++) {
      let c = decks[0].draw();
      if (c === null) {
        decks.shift();
        if (decks.length == 0) {
          break;
        }
        c = decks[0].draw();
        if (c === null) {
          throw new GameCreationError(
            "deck is unexpectedly empty, maybe corrupted?"
          );
        }
      }
      players[i].hand.give(c);
    }
  }
  for (let i = 0; i < players.length; i++) {
    players[i].hand.sort();
  }
}
