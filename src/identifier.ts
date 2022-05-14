export function generateUniqueIdentifiers(count: number): string[] {
  const ret: string[] = [];
  for (let i = 0; i < count; i++) {
    let id = "";
    while (id === "" || ret.includes(id)) {
      id = randomHex(16);
    }
    ret.push(id);
  }
  return ret;
}

export function randomHex(size: number): string {
  const s: string[] = [];
  for (let i = 0; i < size; i++) {
    s.push(Math.floor(Math.random() * 16).toString(16));
  }
  return s.join("");
}
