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
  [3, 4, false, 4],
  [3, 2, false, 2],
  [3, 4, true, 3],
  [3, 2, true, 3],
])("findStrongerCardNumber(a:%i,b:%i,inverted:%p)", (a, b, c, e) => {
  it("returns ${e}", () => {
    expect(CalcFunctions.findStrongerCardNumber(a, b, c)).toBe(e);
  });
});

describe.each([
  [4, 5, false, true],
  [4, 4, false, false],
  [4, 3, false, false],
  // inverted
  [4, 5, true, false],
  [4, 4, true, false],
  [4, 3, true, true],
])("is strong enough? (last=%i, new=%i, inverted=%p)", (a, b, c, e) => {
  it("returns ${e}", () => {
    expect(CalcFunctions.isStrongEnough(a, b, c)).toBe(e);
  });
});

describe.each([
  [0, 16],
  [1, 14],
  [2, 15],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6],
  [7, 7],
  [8, 8],
  [9, 9],
  [10, 10],
  [11, 11],
  [12, 12],
  [13, 13],
])("convertCardNumberToStrength (%i)", (a, e) => {
  it("returns ${e}", () => {
    expect(CalcFunctions.convertCardNumberIntoStrength(a)).toBe(e);
  });
});

describe.each([
  [0, 16],
  [1, 14],
  [2, 15],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6],
  [7, 7],
  [8, 8],
  [9, 9],
  [10, 10],
  [11, 11],
  [12, 12],
  [13, 13],
])("convertCardNumberToStrength (%i)", (a, e) => {
  it("returns ${e}", () => {
    expect(CalcFunctions.convertCardNumberIntoStrength(a)).toBe(e);
  });
});
