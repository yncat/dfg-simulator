/*
Tracks public game information for CPU players
*/
import * as Card from "./card";
import * as CardSelection from "./cardSelection";
import { CardCounter } from "./cpuPlanner";

// How much the CPU remembers the cards played so far.
// none: remembers nothing. strong: remembers only aces, 2s and jokers. full: remembers everything.
export type MemoryLevel = "none" | "strong" | "full";

// Receives the same callbacks as EventReceiver. Forward the game events to this object.
export class CardTracker {
  private deckCount: number;
  private readonly playedCards: Card.Card[];
  private readonly handCounts: Map<string, number>;
  constructor() {
    this.deckCount = 1;
    this.playedCards = [];
    this.handCounts = new Map<string, number>();
  }

  public onInitialInfoProvided(playerCount: number, deckCount: number): void {
    this.deckCount = deckCount;
  }

  public onCardsProvided(identifier: string, providedCount: number): void {
    this.handCounts.set(identifier, providedCount);
  }

  public onDiscard(
    identifier: string,
    discardPair: CardSelection.CardSelectionPair,
    remainingHandCount: number
  ): void {
    this.playedCards.push(...discardPair.cards);
    this.handCounts.set(identifier, remainingHandCount);
  }

  public onPass(identifier: string, remainingHandCount: number): void {
    this.handCounts.set(identifier, remainingHandCount);
  }

  public onTransfer(
    identifier: string,
    targetIdentifier: string,
    transferred: CardSelection.CardSelectionPair
  ): void {
    // The card is still in the game, so only hand counts change.
    this.addHandCount(identifier, -transferred.count());
    this.addHandCount(targetIdentifier, transferred.count());
  }

  public onExile(
    identifier: string,
    exiled: CardSelection.CardSelectionPair
  ): void {
    this.playedCards.push(...exiled.cards);
    this.addHandCount(identifier, -exiled.count());
  }

  public onPlayerKicked(identifier: string): void {
    // The kicked player's cards are removed from the game, but nobody knows what they were.
    this.handCounts.delete(identifier);
  }

  public getDeckCount(): number {
    return this.deckCount;
  }

  public getHandCount(identifier: string): number | null {
    const c = this.handCounts.get(identifier);
    return c === undefined ? null : c;
  }

  // Hand counts of the other players who still have cards.
  public enumerateOpponentHandCounts(myIdentifier: string): number[] {
    const ret: number[] = [];
    this.handCounts.forEach((count, identifier) => {
      if (identifier !== myIdentifier && count > 0) {
        ret.push(count);
      }
    });
    return ret;
  }

  // Cards which may be in other players' hands, from the viewpoint of a player who has the given hand.
  public calcUnseenCards(
    myHand: Card.Card[],
    memory: MemoryLevel
  ): CardCounter {
    const unseen = CardCounter.createFullDeck(this.deckCount);
    myHand.forEach((c) => {
      unseen.remove(c);
    });
    this.playedCards
      .filter((c) => {
        return isRemembered(c, memory);
      })
      .forEach((c) => {
        unseen.remove(c);
      });
    return unseen;
  }

  private addHandCount(identifier: string, diff: number) {
    const c = this.handCounts.get(identifier);
    if (c !== undefined) {
      this.handCounts.set(identifier, c + diff);
    }
  }
}

function isRemembered(card: Card.Card, memory: MemoryLevel): boolean {
  switch (memory) {
    case "none":
      return false;
    case "full":
      return true;
    case "strong":
      return (
        card.isJoker() ||
        card.mark === Card.CardMark.WILD ||
        card.cardNumber === 1 ||
        card.cardNumber === 2
      );
  }
}
