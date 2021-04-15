import * as CalcFunctions from "../src/calcFunctions";

describe.each([
  [false, false, false],
  [false, true, true],
  [true, false, true],
  [true, true, false],
])("isStrengthInverted(jBack=%p, kakumei=%p)", (a, b, e) => {
  it("returns ${e}", () => {
    expect(CalcFunctions.isStrengthInverted(a, b)).toBe(e);
  });
});

describe.each([
  [4, 5, false, true],
  [4, 4, false, false],
  [4, 3, false, false],
  [3, 2, false, true],
  [2, 13, false, false],
  // inverted
  [4, 5, true, false],
  [4, 4, true, false],
  [4, 3, true, true],
  [3, 2, true, false],
  [2, 13, true, true],
])("is strong enough? (last=%i, new=%i, inverted=%p)", (a, b, c, e) => {
  it("returns ${e}", () => {
    expect(CalcFunctions.isStrongEnough(a, b, c)).toBe(e);
  });
});