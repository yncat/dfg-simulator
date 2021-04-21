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

export function findStrongerCardNumber(
  a: number,
  b: number,
  inverted: boolean
): number {
  return isStrongEnough(
    convertCardNumberIntoStrength(a),
    convertCardNumberIntoStrength(b),
    inverted
  )
    ? b
    : a;
}

export function enumerateStrongerCardNumbers(
  cardNumber: number,
  inverted: boolean
) {
  const st = convertCardNumberIntoStrength(cardNumber);
  const ret: number[] = [];
  let i = st;
  while (true) {
    i = inverted ? i - 1 : i + 1;
    if (i == 2 || i == 16) {
      break;
    }
    ret.push(i);
  }
  return ret.map((val) => {
    return convertStrengthIntoCardNumber(val);
  });
}

export function isStrengthInverted(jBack: boolean, kakumei: boolean) {
  return jBack !== kakumei;
}

export function convertCardNumberIntoStrength(n: number): number {
  // transform 1 and 2 to 14 to 15 for ease of calculation
  // joker(card number 0) is converted to 16 since it's strongest by default.
  return n == 0 ? 16 : n == 1 ? 14 : n == 2 ? 15 : n;
}

export function convertStrengthIntoCardNumber(n: number): number {
  return n == 16 ? 0 : n == 14 ? 1 : n == 15 ? 2 : n;
}

export function calcStrongerCardNumber(
  cardNumber: number,
  inverted: boolean
): number | null {
  let str = convertCardNumberIntoStrength(cardNumber);
  str = inverted ? str - 1 : str + 1;
  if (str == 2 || str == 16) {
    return null;
  }
  return convertStrengthIntoCardNumber(str);
}

export function calcWeakerCardNumber(
  cardNumber: number,
  inverted: boolean
): number | null {
  let str = convertCardNumberIntoStrength(cardNumber);
  str = inverted ? str + 1 : str - 1;
  if (str == 2 || str == 16) {
    return null;
  }
  return convertStrengthIntoCardNumber(str);
}
