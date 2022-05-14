import * as Calculation from "../src/calculation";

describe.each([
  [false, false, false],
  [false, true, true],
  [true, false, true],
  [true, true, false],
])("isStrengthInverted(jBack=%p, kakumei=%p)", (a, b, e) => {
  it("returns expected value", () => {
    expect(Calculation.isStrengthInverted(a, b)).toBe(e);
  });
});

describe.each([
  [3, 4, false, 4],
  [3, 2, false, 2],
  [3, 4, true, 3],
  [3, 2, true, 3],
])("findStrongerCardNumber(a:%i,b:%i,inverted:%p)", (a, b, c, e) => {
  it("returns expected value", () => {
    expect(Calculation.findStrongerCardNumber(a, b, c)).toBe(e);
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
  it("returns expected value", () => {
    expect(Calculation.isStrongEnough(a, b, c)).toBe(e);
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
  it("returns expected value", () => {
    expect(Calculation.convertCardNumberIntoStrength(a)).toBe(e);
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
  it("returns expected value", () => {
    expect(Calculation.convertCardNumberIntoStrength(a)).toBe(e);
  });
});

describe.each([
  [3, false, 4],
  [4, false, 5],
  [5, false, 6],
  [6, false, 7],
  [7, false, 8],
  [8, false, 9],
  [9, false, 10],
  [10, false, 11],
  [11, false, 12],
  [12, false, 13],
  [13, false, 1],
  [1, false, 2],
  [2, false, null],
  // strength inverted
  [3, true, null],
  [4, true, 3],
  [5, true, 4],
  [6, true, 5],
  [7, true, 6],
  [8, true, 7],
  [9, true, 8],
  [10, true, 9],
  [11, true, 10],
  [12, true, 11],
  [13, true, 12],
  [1, true, 13],
  [2, true, 1],
])("calcStrongerCardNumber (%i, inverted %p)", (a, b, e) => {
  it("returns expected value", () => {
    expect(Calculation.calcStrongerCardNumber(a, b)).toBe(e);
  });
});

describe.each([
  [3, false, null],
  [4, false, 3],
  [5, false, 4],
  [6, false, 5],
  [7, false, 6],
  [8, false, 7],
  [9, false, 8],
  [10, false, 9],
  [11, false, 10],
  [12, false, 11],
  [13, false, 12],
  [1, false, 13],
  [2, false, 1],
  // strength inverted
  [3, true, 4],
  [4, true, 5],
  [5, true, 6],
  [6, true, 7],
  [7, true, 8],
  [8, true, 9],
  [9, true, 10],
  [10, true, 11],
  [11, true, 12],
  [12, true, 13],
  [13, true, 1],
  [1, true, 2],
  [2, true, null],
])("calcWeakerCardNumber (%i, inverted %p)", (a, b, e) => {
  it("returns expected value", () => {
    expect(Calculation.calcWeakerCardNumber(a, b)).toBe(e);
  });
});

describe.each([
  [1, 1, [1]],
  [1, 2, [1, 2]],
  [2, 1, [1, 2]],
])("enumerateNumbersBetween(a=%i, b=%i)", (a, b, e) => {
  it("returns expected value", () => {
    expect(Calculation.enumerateNumbersBetween(a, b)).toStrictEqual(e);
  });
});

describe.each([
  [1, 1],
  [6, 1],
  [7, 2],
  [12, 2],
  [13, 3],
])("calcRequiredDeckCount when %i players will join", (a, e) => {
  it("returns expected value", () => {
    expect(Calculation.calcRequiredDeckCount(a)).toBe(e);
  });
});

describe.each([
  [false, 3],
  [true, 2],
])("calcWeakestCardNumber(strengthInverted=%p)", (a, e) => {
  it("returns expected value", () => {
    expect(Calculation.calcWeakestCardNumber(a)).toBe(e);
  });
});

describe.each([
  [true, 3],
  [false, 2],
])("calcStrongestCardNumber(strengthInverted=%p)", (a, e) => {
  it("returns expected value", () => {
    expect(Calculation.calcStrongestCardNumber(a)).toBe(e);
  });
});
