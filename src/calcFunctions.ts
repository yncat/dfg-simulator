/*
Various calculation functions
*/

export function isStrongEnough(
  lastStrength: number,
  newStrength: number,
  inverted: boolean
): boolean {
  if (inverted) {
    return newStrength < lastStrength;
  }
  return newStrength > lastStrength;
}

export function isStrengthInverted(jBack: boolean, kakumei: boolean) {
  return jBack !== kakumei;
}

export function convertCardNumberIntoStrength(n: number): number {
  // transform 1 and 2 to 14 to 15 for ease of calculation
  return n == 1 ? 14 : n == 2 ? 15 : n;
}
