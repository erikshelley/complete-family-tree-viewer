#!/usr/bin/env node
/**
 * check-test-ids.mjs
 *
 * Cross-checks the test IDs embedded in it() calls against the registry in
 * test-list.md, and reports any drift between the two sources.
 *
 * The convention is that every it() description MAY begin with a two-part
 * numeric ID, e.g. it('06.15 Keyboard shortcuts...').  Tests that predate the
 * ID convention are not flagged as errors — only the IDs that ARE present in
 * the code are validated.
 *
 * Exit codes
 *   0  All checks passed (warnings are informational only)
 *   1  One or more hard errors: duplicate IDs, or code IDs absent from MD
 *
 * Usage
 *   node check-test-ids.mjs
 *   npm run test:check-ids
 */

import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'node:fs';

const TESTS_DIR = 'tests';
const MD_FILE = 'test-list.md';
const ID_PAT = /\d{2}\.\d{2}/;

// ── Collect IDs from test files ──────────────────────────────────────────────

const testFiles = fs.readdirSync(TESTS_DIR)
    .filter(f => f.endsWith('.test.js'))
    .map(f => path.join(TESTS_DIR, f));

// Match the opening of any it / it.skip / it.only call whose description starts
// with a numeric ID like "06.15 ".
const CODE_RE = /\bit(?:\.skip|\.only)?\s*\(\s*['"`](\d{2}\.\d{2})\s/;

const codeEntries = [];   // { id, file, line }
for (const file of testFiles) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(CODE_RE);
        if (m) codeEntries.push({ id: m[1], file, line: i + 1 });
    }
}

// ── Collect IDs from test-list.md ────────────────────────────────────────────

// Match any table row whose second pipe-delimited cell is a bare ID ("01.17")
// This deliberately excludes the header row (which says "ID") and comment lines.
const MD_ROW_RE = /^\|[^|]+\|\s*(\d{2}\.\d{2})\s*\|/;

const mdEntries = [];     // { id, line }
const mdLines = fs.readFileSync(MD_FILE, 'utf-8').split('\n');
for (let i = 0; i < mdLines.length; i++) {
    const m = mdLines[i].match(MD_ROW_RE);
    if (m) mdEntries.push({ id: m[1], line: i + 1 });
}

// ── Analysis ─────────────────────────────────────────────────────────────────

const codeIdSet = new Map();   // id -> first entry
const mdIdSet   = new Map();   // id -> first entry

const codeDuplicates = [];
for (const entry of codeEntries) {
    if (codeIdSet.has(entry.id)) {
        codeDuplicates.push({ id: entry.id, first: codeIdSet.get(entry.id), second: entry });
    } else {
        codeIdSet.set(entry.id, entry);
    }
}

const mdDuplicates = [];
for (const entry of mdEntries) {
    if (mdIdSet.has(entry.id)) {
        mdDuplicates.push({ id: entry.id, firstLine: mdIdSet.get(entry.id).line, secondLine: entry.line });
    } else {
        mdIdSet.set(entry.id, entry);
    }
}

// IDs present in code but absent from the MD  →  requires registration
const unregistered = codeEntries.filter(e => !mdIdSet.has(e.id) && !codeDuplicates.find(d => d.second === e));

// IDs present in the MD but absent from any it() call  →  informational only
// (the test may exist with a legacy un-IDed description)
const notIdedInCode = mdEntries.filter(e => !codeIdSet.has(e.id) && !mdDuplicates.find(d => d.secondLine === e.line));

// ── Report ───────────────────────────────────────────────────────────────────

let errors = 0;

if (codeDuplicates.length) {
    console.error('\n[ERROR] Duplicate IDs in test files:');
    for (const { id, first, second } of codeDuplicates) {
        console.error(`  ${id}  ${first.file}:${first.line}  ←→  ${second.file}:${second.line}`);
        errors++;
    }
}

if (mdDuplicates.length) {
    console.error('\n[ERROR] Duplicate IDs in test-list.md:');
    for (const { id, firstLine, secondLine } of mdDuplicates) {
        console.error(`  ${id}  lines ${firstLine} and ${secondLine}`);
        errors++;
    }
}

if (unregistered.length) {
    console.error('\n[ERROR] IDs present in test files but missing from test-list.md:');
    for (const { id, file, line } of unregistered) {
        console.error(`  ${id}  ${file}:${line}`);
        errors++;
    }
}

if (notIdedInCode.length) {
    console.warn('\n[WARN]  IDs in test-list.md with no matching it() call');
    console.warn('        (test may exist under a legacy un-IDed description):');
    for (const { id, line } of notIdedInCode) {
        console.warn(`  ${id}  (test-list.md line ${line})`);
    }
}

// ── Summary ──────────────────────────────────────────────────────────────────

const totalIdedTests = codeIdSet.size;
const totalMdEntries = mdIdSet.size;

if (errors > 0) {
    console.error(`\n${errors} error(s) found. Fix the issues above then re-run.\n`);
    process.exit(1);
} else {
    console.log(
        `\n✓ ${totalIdedTests} IDed test(s) in code, ${totalMdEntries} IDs in test-list.md — no drift detected.` +
        (notIdedInCode.length ? ` (${notIdedInCode.length} MD entries with legacy un-IDed tests)` : '') +
        '\n'
    );
}
