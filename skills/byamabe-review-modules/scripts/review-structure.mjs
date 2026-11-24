// Deterministic layer of byamabe-review-modules.
//
// Reads the Structure map YAML block in modules.md and checks the code
// against it. Same commit in, same report out: every list is sorted and
// the report carries the commit hash, not a timestamp.
//
// Exit codes:
//   0  report produced (findings or not)
//   2  the map can't be used (missing, observed draft, invalid, overlapping)
//   1  the script itself failed
//
// Usage: node review-structure.mjs <project-root> [--out <file.json>]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import YAML from "yaml";
import picomatch from "picomatch";
import { ESLint } from "eslint";
import tsParser from "@typescript-eslint/parser";
import sonarjs from "eslint-plugin-sonarjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const CODE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;

// ---------------------------------------------------------------- args
const args = process.argv.slice(2);
const root = path.resolve(args.find((a) => !a.startsWith("--")) ?? ".");
const outIdx = args.indexOf("--out");
const outFile = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : null;

class MapError extends Error {}
const rel = (abs) => path.relative(root, abs).split(path.sep).join("/");
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sortBy = (xs, key) => [...xs].sort((a, b) => byText(key(a), key(b)));

// ------------------------------------------------------------ the map
function readMap() {
  const mdPath = path.join(root, "modules.md");
  if (!fs.existsSync(mdPath)) throw new MapError("modules.md not found at the project root.");
  const md = fs.readFileSync(mdPath, "utf8");

  const fences = [...md.matchAll(/^```ya?ml[^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1]);
  const blocks = fences.filter((src) => {
    try { return YAML.parse(src)?.modules !== undefined; } catch { return false; }
  });
  if (blocks.length === 0) throw new MapError("modules.md has no Structure map YAML block (a ```yaml block with a `modules:` key).");
  if (blocks.length > 1) throw new MapError(`modules.md has ${blocks.length} Structure map YAML blocks; it must have exactly one.`);
  const src = blocks[0];
  const firstLine = src.split("\n").find((l) => l.trim() !== "")?.trim();
  if (firstLine === "# OBSERVED DRAFT") {
    throw new MapError("The Structure map is marked `# OBSERVED DRAFT`. Edit it into the intended design and remove that line before reviewing against it.");
  }

  const map = YAML.parse(src);
  const errors = [];
  if (!Array.isArray(map.source_roots) || map.source_roots.length === 0) errors.push("`source_roots` must be a non-empty list.");
  if (!Array.isArray(map.modules) || map.modules.length === 0) errors.push("`modules` must be a non-empty list.");
  if (errors.length) throw new MapError(errors.join("\n"));

  map.ignore ??= [];
  map.shared ??= [];
  const names = new Set();
  for (const [i, m] of map.modules.entries()) {
    const where = `modules[${i}]${m?.name ? ` (${m.name})` : ""}`;
    if (!m?.name) { errors.push(`${where}: missing \`name\`.`); continue; }
    if (names.has(m.name)) errors.push(`${where}: duplicate module name.`);
    names.add(m.name);
    if (!["proposed", "confirmed"].includes(m.status)) errors.push(`${where}: \`status\` must be proposed or confirmed.`);
    if (!Array.isArray(m.paths) || m.paths.length === 0) errors.push(`${where}: \`paths\` must be a non-empty list.`);
    if (!Array.isArray(m.may_depend_on)) errors.push(`${where}: \`may_depend_on\` must be a list (use [] for none).`);
    if (!Array.isArray(m.public_exports)) errors.push(`${where}: \`public_exports\` must be a list (use [] for not yet checked).`);
    if (m.entry !== undefined) {
      m.entry = [m.entry].flat();
      if (!m.entry.every((e) => typeof e === "string" && e)) errors.push(`${where}: \`entry\` must be a path or a list of paths.`);
    }
  }
  if (map.tsconfig !== undefined && !fs.existsSync(path.join(root, map.tsconfig))) {
    errors.push(`tsconfig "${map.tsconfig}" not found. Generate it first (for Nuxt: nuxt prepare), or remove the field.`);
  }
  for (const m of map.modules) {
    for (const d of m.may_depend_on ?? []) if (!names.has(d)) errors.push(`${m.name}: may_depend_on names unknown module "${d}".`);
  }
  for (const s of map.shared) if (!names.has(s)) errors.push(`shared names unknown module "${s}".`);
  // A shared module's incoming edges are never checked, so it must not
  // depend on anything that isn't itself shared. Otherwise a cycle
  // through it would disappear from the review.
  for (const m of map.modules) {
    if (!map.shared.includes(m.name)) continue;
    const upward = (m.may_depend_on ?? []).filter((d) => !map.shared.includes(d));
    if (upward.length) errors.push(`${m.name} is shared, so it may depend only on other shared modules; remove ${upward.join(", ")} from its may_depend_on (its imports of them are then reported as boundary violations).`);
  }
  if (errors.length) throw new MapError(errors.join("\n"));
  return { map, md };
}

// Prose entries under "## Modules": name -> { status, interface }.
function readProse(md) {
  const section = md.split(/^## /m).find((s) => s.startsWith("Modules"));
  const entries = new Map();
  if (!section) return entries;
  for (const chunk of section.split(/^### /m).slice(1)) {
    const name = chunk.split("\n")[0].trim();
    const status = chunk.match(/\*\*Status\*\*:\s*([a-z]+)/i)?.[1]?.toLowerCase() ?? null;
    const iface = chunk.match(/\*\*Interface\*\*:([\s\S]*?)(?=\n\*\*[^*\n]+\*\*:|\n---|$)/)?.[1] ?? "";
    entries.set(name, { status, interface: iface });
  }
  return entries;
}

function consistency(map, prose) {
  const out = [];
  const yamlNames = new Set(map.modules.map((m) => m.name));
  for (const m of map.modules) {
    const p = prose.get(m.name);
    if (!p) { out.push({ module: m.name, issue: "in the Structure map but has no prose entry" }); continue; }
    if (p.status !== m.status) out.push({ module: m.name, issue: `status is "${m.status}" in the Structure map but "${p.status ?? "missing"}" in the prose` });
    for (const sym of m.public_exports) {
      if (!new RegExp(`\\b${sym.replace(/[$]/g, "\\$")}\\b`).test(p.interface)) {
        out.push({ module: m.name, issue: `public export "${sym}" is not mentioned in its Interface prose` });
      }
    }
  }
  for (const name of prose.keys()) {
    if (!yamlNames.has(name)) out.push({ module: name, issue: "has a prose entry but no Structure map entry" });
  }
  return sortBy(out, (f) => f.module + f.issue);
}

// ---------------------------------------------------------- the files
// Code files the review covers, plus files it can't analyze (reported,
// never silently skipped).
const UNANALYZED_EXT = /\.(vue|svelte|astro)$/;
function listFiles(map) {
  const raw = execFileSync("git", ["-C", root, "ls-files", "-z", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
  const ignored = picomatch(map.ignore.length ? map.ignore : ["\0never"], { dot: true });
  const roots = map.source_roots.map((r) => r.replace(/\/+$/, "") + "/");
  const inScope = raw.split("\0").filter(Boolean)
    .filter((f) => roots.some((r) => f.startsWith(r)))
    .filter((f) => fs.existsSync(path.join(root, f)))
    .filter((f) => !ignored(f))
    .sort(byText);
  return { files: inScope.filter((f) => CODE_EXT.test(f)), notAnalyzed: inScope.filter((f) => UNANALYZED_EXT.test(f)) };
}

function assignModules(map, files) {
  const matchers = map.modules.map((m) => ({ name: m.name, match: picomatch(m.paths, { dot: true }) }));
  const owner = new Map();
  const overlaps = [];
  for (const f of files) {
    const hits = matchers.filter((m) => m.match(f)).map((m) => m.name);
    if (hits.length > 1) overlaps.push(`${f} matches ${hits.join(", ")}`);
    if (hits.length >= 1) owner.set(f, hits[0]);
  }
  if (overlaps.length) throw new MapError(`Module paths overlap, so the map is ambiguous:\n${overlaps.join("\n")}`);
  return owner;
}

// --------------------------------------------------------- the imports
function compilerOptions(map) {
  const cfg = map.tsconfig ? path.join(root, map.tsconfig) : ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!cfg) return { allowJs: true, jsx: ts.JsxEmit.Preserve, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext };
  const read = ts.readConfigFile(cfg, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(cfg));
  return { allowJs: true, ...parsed.options };
}

// `const { a, b: c } = await import("x")` (or require) uses a and b.
// Anything else (a namespace kept in a variable) counts as "*".
function destructuredNames(call) {
  let node = call.parent;
  if (node && ts.isAwaitExpression(node)) node = node.parent;
  if (node && ts.isParenthesizedExpression(node)) node = node.parent;
  if (!node || !ts.isVariableDeclaration(node) || !ts.isObjectBindingPattern(node.name)) return null;
  const names = [];
  for (const el of node.name.elements) {
    const key = el.propertyName ?? el.name;
    if (el.dotDotDotToken || !ts.isIdentifier(key)) return null;
    names.push(key.text);
  }
  return names;
}

// Every import-like reference in a file: specifier, symbols, line.
function referencesIn(file) {
  const abs = path.join(root, file);
  const sf = ts.createSourceFile(abs, fs.readFileSync(abs, "utf8"), ts.ScriptTarget.Latest, true);
  const refs = [];
  const line = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const add = (spec, symbols, node) => refs.push({ spec, symbols, line: line(node) });

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const syms = [];
      const clause = node.importClause;
      if (clause?.name) syms.push("default");
      const nb = clause?.namedBindings;
      if (nb && ts.isNamespaceImport(nb)) syms.push("*");
      if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) syms.push((el.propertyName ?? el.name).text);
      add(node.moduleSpecifier.text, syms, node);
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const syms = node.exportClause && ts.isNamedExports(node.exportClause)
        ? node.exportClause.elements.map((el) => (el.propertyName ?? el.name).text)
        : ["*"];
      add(node.moduleSpecifier.text, syms, node);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)
      && ts.isStringLiteral(node.moduleReference.expression)) {
      add(node.moduleReference.expression.text, ["*"], node);
    } else if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])
      && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
      add(node.arguments[0].text, destructuredNames(node) ?? ["*"], node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return refs;
}

// A specifier that can't be a package name points into the project. If
// it doesn't resolve, an edge may be missing: report it, don't skip it.
const INTERNAL_SPEC = /^(\.|\/|#|~|@\/|@@\/)/;

function crossModuleImports(files, owner, options) {
  const host = ts.createCompilerHost(options);
  const edges = [], unresolved = [];
  for (const file of files) {
    const from = owner.get(file);
    if (!from) continue;
    for (const ref of referencesIn(file)) {
      const res = ts.resolveModuleName(ref.spec, path.join(root, file), options, host).resolvedModule;
      if (!res) {
        if (INTERNAL_SPEC.test(ref.spec)) unresolved.push({ module: from, file, line: ref.line, specifier: ref.spec });
        continue;
      }
      if (res.isExternalLibraryImport) continue;
      const target = rel(res.resolvedFileName);
      const to = owner.get(target);
      if (!to || to === from) continue;
      edges.push({ from, to, file, line: ref.line, target, symbols: ref.symbols });
    }
  }
  return { edges, unresolved: sortBy(unresolved, (u) => `${u.file}:${String(u.line).padStart(6, "0")}`) };
}

// ------------------------------------------------------------ the checks
function checkEdges(map, edges) {
  const mods = new Map(map.modules.map((m) => [m.name, m]));
  const boundary = [], entryBypass = [], surface = [];
  for (const e of edges) {
    const src = mods.get(e.from), dst = mods.get(e.to);
    if (!src.may_depend_on.includes(e.to) && !map.shared.includes(e.to)) {
      boundary.push({ from: e.from, to: e.to, file: e.file, line: e.line, target: e.target });
    }
    if (dst.entry && !dst.entry.includes(e.target)) {
      entryBypass.push({ from: e.from, to: e.to, file: e.file, line: e.line, target: e.target, entry: dst.entry.join(", ") });
    }
    if (dst.public_exports.length > 0) {
      for (const sym of e.symbols) {
        if (!dst.public_exports.includes(sym)) {
          surface.push({ module: e.to, symbol: sym, importer: e.from, file: e.file, line: e.line });
        }
      }
    }
  }
  const key = (f) => `${f.file}:${String(f.line).padStart(6, "0")}:${f.to ?? f.module}:${f.symbol ?? ""}`;
  return { boundary: sortBy(boundary, key), entry_bypass: sortBy(entryBypass, key), surface: sortBy(surface, key) };
}

function checkPresence(map, files, owner) {
  const unmapped = files.filter((f) => !owner.has(f));
  const counts = new Map(map.modules.map((m) => [m.name, 0]));
  for (const mod of owner.values()) counts.set(mod, counts.get(mod) + 1);
  const empty = [], notBuilt = [];
  for (const m of map.modules) {
    if (counts.get(m.name) > 0) continue;
    (m.status === "confirmed" ? empty : notBuilt).push(m.name);
  }
  return { unmapped, empty_confirmed: empty.sort(byText), proposed_not_built: notBuilt.sort(byText), counts };
}

// ---------------------------------------------------------- the totals
async function complexity(files) {
  if (files.length === 0) return [];
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [{
      files: ["**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"],
      languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { sonarjs },
      rules: { "sonarjs/cognitive-complexity": ["error", 0] },
    }],
  });
  const results = await eslint.lintFiles(files.map((f) => path.join(root, f)));
  const fns = [];
  for (const r of results) {
    for (const msg of r.messages) {
      if (msg.fatal) throw new Error(`Could not parse ${rel(r.filePath)}: ${msg.message}`);
      const n = msg.message.match(/Cognitive Complexity from (\d+)/);
      if (n) fns.push({ file: rel(r.filePath), line: msg.line, value: Number(n[1]) });
    }
  }
  return fns;
}

function duplication(files) {
  if (files.length < 2) return [];
  const bin = path.join(here, "node_modules", ".bin", "jscpd");
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "review-structure-"));
  try {
    execFileSync(bin, [
      "--reporters", "json", "--output", outDir, "--absolute",
      "--formats-exts", "typescript:ts,tsx,mts,cts;javascript:js,jsx,mjs,cjs",
      "--no-gitignore",
      ...files.map((f) => path.join(root, f)),
    ], { cwd: root, stdio: ["ignore", "ignore", "pipe"] });
    const report = JSON.parse(fs.readFileSync(path.join(outDir, "jscpd-report.json"), "utf8"));
    return report.duplicates.map((d) => ({
      a: { file: rel(d.firstFile.name), line: d.firstFile.startLoc.line },
      b: { file: rel(d.secondFile.name), line: d.secondFile.startLoc.line },
      lines: d.lines,
    }));
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

function totals(map, owner, counts, fns, clones) {
  const t = {};
  for (const m of map.modules) {
    t[m.name] = { files: counts.get(m.name), functions_scored: 0, cognitive_total: 0, cognitive_max: null, clones: 0, duplicated_lines: 0 };
  }
  for (const f of fns) {
    const mod = owner.get(f.file);
    if (!mod) continue;
    const row = t[mod];
    row.functions_scored += 1;
    row.cognitive_total += f.value;
    if (!row.cognitive_max || f.value > row.cognitive_max.value) row.cognitive_max = f;
  }
  const crossClones = [];
  for (const c of clones) {
    const ma = owner.get(c.a.file), mb = owner.get(c.b.file);
    for (const mod of new Set([ma, mb])) {
      if (!mod) continue;
      t[mod].clones += 1;
      t[mod].duplicated_lines += c.lines;
    }
    if (ma && mb && ma !== mb) crossClones.push({ ...c, modules: [ma, mb] });
  }
  return { totals: t, cross_module_clones: sortBy(crossClones, (c) => c.a.file + c.b.file) };
}

function previousReport() {
  const dir = path.join(root, "docs", "reviews");
  if (!fs.existsSync(dir)) return null;
  const prev = fs.readdirSync(dir).filter((f) => /^structure-.*\.json$/.test(f))
    .map((f) => path.join(dir, f)).filter((f) => !outFile || f !== outFile).sort(byText).pop();
  return prev ? { file: rel(prev), data: JSON.parse(fs.readFileSync(prev, "utf8")) } : null;
}

function deltas(now, prev) {
  if (!prev) return null;
  const d = {};
  for (const [mod, row] of Object.entries(now)) {
    const old = prev.data.totals?.[mod];
    if (!old) { d[mod] = "new since previous report"; continue; }
    d[mod] = {
      files: row.files - old.files,
      cognitive_total: row.cognitive_total - old.cognitive_total,
      clones: row.clones - old.clones,
    };
  }
  return { previous: prev.file, by_module: d };
}

// ------------------------------------------------------------- output
function markdown(r) {
  const L = [];
  const loc = (f) => `${f.file}:${f.line}`;
  L.push(`# Structure review (${r.commit.slice(0, 7)})`, "");
  const s = r.summary;
  L.push("| Finding | Count |", "|---|---|");
  for (const [k, v] of Object.entries(s)) L.push(`| ${k.replace(/_/g, " ")} | ${v} |`);
  L.push("");
  const section = (title, items, fmt) => {
    if (!items.length) return;
    L.push(`## ${title}`, "", ...items.map((i) => `- ${fmt(i)}`), "");
  };
  const f = r.findings;
  section("Map consistency", f.map_consistency, (i) => `**${i.module}**: ${i.issue}`);
  section("Boundary violations", f.boundary, (i) => `${i.from} → ${i.to} at \`${loc(i)}\` (imports \`${i.target}\`; not in may_depend_on)`);
  section("Entry bypass", f.entry_bypass, (i) => `${i.from} → ${i.to} at \`${loc(i)}\` imports \`${i.target}\` instead of \`${i.entry}\``);
  section("Surface growth", f.surface, (i) => `${i.importer} imports \`${i.symbol}\` from ${i.module} at \`${loc(i)}\` (not in public_exports)`);
  section("Unresolved internal imports (edges may be missing)", f.unresolved, (i) => `\`${loc(i)}\` in ${i.module}: \`${i.specifier}\``);
  section("Unmapped files", f.unmapped, (i) => `\`${i}\``);
  section("Not analyzed (unsupported file type)", f.not_analyzed, (i) => `\`${i}\``);
  section("Empty confirmed modules", f.empty_confirmed, (i) => i);
  section("Proposed, not yet built", f.proposed_not_built, (i) => i);
  section("Cross-module duplication", r.cross_module_clones, (c) => `${c.lines} lines: \`${loc(c.a)}\` (${c.modules[0]}) ↔ \`${loc(c.b)}\` (${c.modules[1]})`);
  L.push("## Module totals", "", "| Module | Files | Functions scored | Cognitive total | Max (location) | Clones | Duplicated lines |", "|---|---|---|---|---|---|---|");
  for (const [mod, t] of Object.entries(r.totals)) {
    const max = t.cognitive_max ? `${t.cognitive_max.value} (\`${loc(t.cognitive_max)}\`)` : "-";
    L.push(`| ${mod} | ${t.files} | ${t.functions_scored} | ${t.cognitive_total} | ${max} | ${t.clones} | ${t.duplicated_lines} |`);
  }
  L.push("");
  if (r.deltas) {
    L.push(`## Changes since ${r.deltas.previous}`, "", "| Module | Files | Cognitive total | Clones |", "|---|---|---|---|");
    const sign = (n) => (n > 0 ? `+${n}` : String(n));
    for (const [mod, d] of Object.entries(r.deltas.by_module)) {
      L.push(typeof d === "string" ? `| ${mod} | ${d} | | |` : `| ${mod} | ${sign(d.files)} | ${sign(d.cognitive_total)} | ${sign(d.clones)} |`);
    }
  } else {
    L.push("No previous structure report; no deltas.");
  }
  return L.join("\n");
}

// --------------------------------------------------------------- main
async function main() {
  const { map, md } = readMap();
  const { files, notAnalyzed } = listFiles(map);
  const owner = assignModules(map, files);
  const { edges, unresolved } = crossModuleImports(files, owner, compilerOptions(map));
  const presence = checkPresence(map, files, owner);
  const mapped = files.filter((f) => owner.has(f));
  const t = totals(map, owner, presence.counts, await complexity(mapped), duplication(mapped));

  const findings = {
    map_consistency: consistency(map, readProse(md)),
    ...checkEdges(map, edges),
    unresolved,
    unmapped: presence.unmapped,
    not_analyzed: notAnalyzed,
    empty_confirmed: presence.empty_confirmed,
    proposed_not_built: presence.proposed_not_built,
  };
  const report = {
    commit: execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    dirty: execFileSync("git", ["-C", root, "status", "--porcelain"], { encoding: "utf8" }).trim() !== "",
    summary: Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, v.length]).concat([["cross_module_clones", t.cross_module_clones.length]])),
    findings,
    cross_module_clones: t.cross_module_clones,
    totals: t.totals,
    deltas: deltas(t.totals, previousReport()),
  };
  if (outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(markdown(report));
}

main().catch((err) => {
  if (err instanceof MapError) {
    console.error(`MAP ERROR: ${err.message}`);
    process.exit(2);
  }
  console.error(`review-structure failed: ${err.stack ?? err}`);
  process.exit(1);
});
