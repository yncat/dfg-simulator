/*
Player's hand
*/
import * as Card from "./card";
import * as CalcFunctions from "./calcFunctions";

export class Hand {
  cards: Card.Card[];

  constructor() {
    this.cards = [];
  }

  public giveCards(...cards: Card.Card[]) {
    this.cards = this.cards.concat(cards);
    this.sort();
  }

  public count(): number {
    return this.cards.length;
  }

  public countCardsWithSpecifiedNumber(cardNumber: number) {
    return this.cards.filter((val) => {
      return val.cardNumber == cardNumber;
    }).length;
  }

  public countJokers() {
    return this.cards.filter((val) => {
      return val.isJoker();
    }).length;
  }

  public countSequencialCardsFrom(
    cardNumber: number,
    strengthInverted: boolean
  ) {
    // TODO: move this to discard planner
    // if this hand has 3 4 5 and the cardNumber parameter is 3, it will return 3 since we have 3 sequencial cards (3,4,5).
    // when the strength is inverted, 7 6 5 and card parameter 7 will return 3.
    let ret = 0;
    let str = CalcFunctions.convertCardNumberIntoStrength(cardNumber);
    while (true) {
      if (str == 2 || str == 16) {
        break;
      }
      if (
        this.countCardsWithSpecifiedNumber(
          CalcFunctions.convertStrengthIntoCardNumber(str)
        ) == 0
      ) {
        break;
      }
      ret++;
      str = strengthInverted ? str - 1 : str + 1;
    }
    return ret;
  }

  private sort() {
    this.cards.sort((a, b) => {
      if (a.cardNumber == b.cardNumber) {
        return 0;
      }
      if (a.isJoker()) {
        return 1;
      }
      if (b.isJoker()) {
        return -1;
      }
      return a.calcStrength() < b.calcStrength() ? -1 : 1;
    });
  }
}
