import * as Identifier from "../src/identifier";

describe("generateUniqueIdentifiers", () => {
  it("returns unique player identifier strings", () => {
    const ids = Identifier.generateUniqueIdentifiers(3);
    expect(ids.length).toBe(3);
    expect(ids[0].length).toBe(16);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[0]).not.toBe(ids[2]);
    expect(ids[1]).not.toBe(ids[2]);
  });
});
