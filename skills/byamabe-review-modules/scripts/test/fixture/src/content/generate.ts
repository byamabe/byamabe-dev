import { searchCorpus } from "../corpus";
import { rankInternal } from "@corpus/search";
import type { Passage } from "../schema/types";
export function generateExercise(q: string, all: Passage[], mode: number) {
  let out = 0;
  for (const p of rankInternal(searchCorpus(q, all))) {
    if (mode > 1) {
      if (p.text.length > 10 && p.id !== "x") { out += 1; } else if (p.text) { out += 2; }
    } else {
      while (out < 3) { out++; }
    }
  }
  return out;
}
export function formatPassageList(items: Passage[]): string {
  const lines: string[] = [];
  for (const item of items) {
    const label = item.id.toUpperCase();
    const body = item.text.trim().replace(/\s+/g, " ");
    lines.push(`${label}: ${body}`);
    if (body.length > 80) { lines.push("  (truncated)"); }
  }
  return lines.join("\n");
}
