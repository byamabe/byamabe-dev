import type { Passage } from "../schema/types";
export function searchCorpus(q: string, all: Passage[]): Passage[] {
  return all.filter((p) => p.text.includes(q));
}
export function rankInternal(xs: Passage[]): Passage[] { return xs; }
