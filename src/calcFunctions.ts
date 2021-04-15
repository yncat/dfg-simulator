/*
Various calculation functions
*/

export function isStrongEnough(
  lastCardNumber: number,
  newCardNumber: number,
  inverted: boolean
): boolean {
  lastCardNumber = transform(lastCardNumber);
  newCardNumber = transform(newCardNumber);
  if (inverted) {
    return newCardNumber < lastCardNumber;
  }
  return newCardNumber > lastCardNumber;
}

export function isStrengthInverted(jBack: boolean, kakumei: boolean) {
  return jBack !== kakumei;
}

function transform(n: number) {
  // transform 1 and 2 to 14 to 15 for ease of calculation
  return n == 1 ? 14 : n == 2 ? 15 : n;
}
