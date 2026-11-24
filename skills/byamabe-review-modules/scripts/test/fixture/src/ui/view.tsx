import { getPassage } from "../corpus";
import { missing } from "~/not-there";
import { generateExercise } from "../content/generate";
import { validateExercise } from "../content";
import type { Passage } from "../schema/types";
export function render(all: Passage[]) { getPassage("a"); void missing; return validateExercise(generateExercise("q", all, 2)); }
export function formatPassageListAgain(items: Passage[]): string {
  const lines: string[] = [];
  for (const item of items) {
    const label = item.id.toUpperCase();
    const body = item.text.trim().replace(/\s+/g, " ");
    lines.push(`${label}: ${body}`);
    if (body.length > 80) { lines.push("  (truncated)"); }
  }
  return lines.join("\n");
}
export async function lazy() {
  const { validateExercise: check } = await import("../content");
  return check(1);
}
