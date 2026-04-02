#!/usr/bin/env node
/**
 * update-mermaid-perf-colors.mjs
 *
 * Runs the per-function performance test (09.05) and updates the `style`
 * declarations in each flowchart in mermaid.md to reflect the latest timing.
 *
 * Encoding rules (globally normalised across all three source files):
 *   Fill hue  — based on self ms    (log scale, hue 0 = slowest, 210 = fastest)
 *   Stroke hue — based on call count (log scale, hue 0 = most called, 210 = least)
 *   Fill:   HSL(hue, 25%, 25%)
 *   Stroke: HSL(hue, 25%, 50%)
 *   Stroke-width: 2px
 *
 * Usage
 *   node update-mermaid-perf-colors.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const MERMAID_FILE = 'mermaid.md';
const PERF_TEST    = 'tests/performance.test.js';

// ── 1. Run the performance test and capture stdout ───────────────────────────

console.log('Running performance test 09.05…');
let testOutput;
try {
    testOutput = execSync(
        `npx vitest run ${PERF_TEST} --reporter=verbose`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
} catch (err) {
    // vitest exits non-zero when tests fail; still check stdout for the perf block
    testOutput = (err.stdout ?? '') + (err.stderr ?? '');
    if (!testOutput.includes('[perf 09.05]')) {
        console.error('Test run failed and produced no 09.05 output.\n', testOutput.slice(-2000));
        process.exit(1);
    }
}

// ── 2. Parse the 09.05 per-function table ────────────────────────────────────

// Each data line looks like:
//   "  25.0%     197.0ms       1 calls  parseGedcomData"
const LINE_RE = /^\s+[\d.]+%\s+([\d.]+|-)\s*ms\s+(\d+|-)\s*calls\s+(\w+)\s*$/;

const stats = {};
for (const line of testOutput.split('\n')) {
    const m = LINE_RE.exec(line);
    if (!m) continue;
    const msVal    = m[1] === '-' ? 0 : parseFloat(m[1]);
    const callsVal = m[2] === '-' ? 0 : parseInt(m[2], 10);
    const name     = m[3];
    // Keep the highest ms seen (the test may emit multiple runs, though normally just one)
    if (!stats[name] || msVal > stats[name].ms) {
        stats[name] = { ms: msVal, calls: callsVal };
    }
}

if (Object.keys(stats).length === 0) {
    console.error('Could not parse any function data from test output.');
    process.exit(1);
}
console.log(`Parsed ${Object.keys(stats).length} functions from test output.`);

// ── 3. Compute globally-normalised log-scale colours ────────────────────────

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

const allMs    = Object.values(stats).map(v => v.ms);
const allCalls = Object.values(stats).map(v => v.calls);
const maxMs    = Math.max(...allMs);
const maxCalls = Math.max(...allCalls);
const logMaxMs    = Math.log1p(maxMs);
const logMaxCalls = Math.log1p(maxCalls);

function styleFor(name) {
    const { ms, calls } = stats[name] ?? { ms: 0, calls: 0 };
    const normMs    = logMaxMs    > 0 ? Math.log1p(ms)    / logMaxMs    : 0;
    const normCalls = logMaxCalls > 0 ? Math.log1p(calls) / logMaxCalls : 0;
    const fillHue   = Math.round(210 * (1 - normMs));
    const strokeHue = Math.round(210 * (1 - normCalls));
    const fill   = hslToHex(fillHue,   25, 25);
    const stroke = hslToHex(strokeHue, 25, 50);
    return `fill:${fill},stroke:${stroke},stroke-width:2px,color:#fff`;
}

// ── 4. Rewrite style lines in mermaid.md ────────────────────────────────────

let md = readFileSync(MERMAID_FILE, 'utf8');

// Match every existing style line inside a mermaid code block and replace its
// colour values, leaving unrecognised names (not in stats) unchanged so the
// file doesn't silently lose hand-authored entries.
let replaced = 0;
md = md.replace(
    /^(    style )(\w+)( fill:#[0-9a-f]{6},stroke:#[0-9a-f]{6}(?:,stroke-width:\S+)?),color:#\w+$/gm,
    (_, prefix, name, _colors) => {
        if (!stats[name]) return _;  // not in perf data — leave as-is
        replaced++;
        return `${prefix}${name} ${styleFor(name)}`;
    },
);

writeFileSync(MERMAID_FILE, md, 'utf8');
console.log(`Updated ${replaced} style lines in ${MERMAID_FILE}.`);
console.log(`Global max: ${maxMs.toFixed(1)}ms  ${maxCalls} calls`);
