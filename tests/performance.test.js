import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync } from 'node:fs';

import { loadBrowserScripts } from './helpers/load-browser-script.js';

// Set PERF_TESTS=1 in the environment to enable hard timing assertions.
// Without it, timing is measured and logged but never fails the build.
const PERF_TESTS = process.env.PERF_TESTS === '1';

// Real GEDCOM profiling (file is .gitignored; tests skip gracefully when absent).
const REAL_GEDCOM_PATH = 'ShelleyFamilyTree-2026-03-29.ged';
const REAL_GEDCOM_EXISTS = existsSync(REAL_GEDCOM_PATH);

function createPerformanceContext(windowOverrides = {}, globalOverrides = {}) {
    const dom = new JSDOM('<div id="family-tree-div"></div>');
    const context = loadBrowserScripts(['src/js/build_tree.js', 'src/js/position_tree_helpers.js', 'src/js/position_tree.js'], {
        windowOverrides: {
            generations_up: 0,
            generations_down: 6,
            max_stack_size: 4,
            show_childless_inlaws: true,
            pedigree_only: false,
            beside_inlaws: false,
            box_width: 80,
            box_height: 50,
            sibling_spacing: 24,
            generation_spacing: 28,
            level_spacing: 40,
            box_padding: 2,
            tree_padding: 80,
            node_border_width: 2,
            link_width: 2,
            individuals: [],
            families: [],
            ...windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            drawTree: async () => {},
            ...globalOverrides,
        },
    });

    context.window.positioning_log_level = 'none';
    context.window.suppress_positioning_log = true;

    return context;
}

function makePerformanceDataset(totalIndividuals, connectedDepth) {
    const individuals = [];
    const families = [];

    for (let i = 1; i <= connectedDepth; i += 1) {
        const mainId = `@P${i}@`;
        const spouseId = `@S${i}@`;
        const famId = `@F${i}@`;
        const childId = i < connectedDepth ? `@P${i + 1}@` : null;

        individuals.push({
            id: mainId,
            name: `Primary ${i}`,
            famc: i === 1 ? null : `@F${i - 1}@`,
            fams: i < connectedDepth ? [famId] : [],
            gender: 'M',
        });

        individuals.push({
            id: spouseId,
            name: `Spouse ${i}`,
            famc: null,
            fams: [],
            gender: 'F',
        });

        if (i < connectedDepth) families.push({ id: famId, husb: mainId, wife: spouseId, chil: [childId] });
    }

    const currentCount = individuals.length;
    const extraCount = Math.max(0, totalIndividuals - currentCount);
    for (let i = 1; i <= extraCount; i += 1) {
        individuals.push({
            id: `@X${i}@`,
            name: `Extra ${i}`,
            famc: null,
            fams: [],
            gender: i % 2 === 0 ? 'F' : 'M',
        });
    }

    return { individuals, families };
}

function elapsedMs(startNs, endNs) {
    return Number(endNs - startNs) / 1_000_000;
}

describe('performance and stress', () => {
    it('09.01 medium tree builds and positions correctness + scale sanity', async () => {
        const { individuals, families } = makePerformanceDataset(600, 180);
        const context = createPerformanceContext({
            individuals,
            families,
            generations_down: 180,
        });

        const start = process.hrtime.bigint();
        await context.createFamilyTree(individuals[0]);
        const end = process.hrtime.bigint();
        const elapsed = elapsedMs(start, end);

        // Structure correctness
        expect(context.window.tree_rows).not.toBeNull();
        expect(context.window.max_gen_down).toBeGreaterThan(150);

        // Timing: hard assertion only when PERF_TESTS=1, otherwise logged
        if (PERF_TESTS) {
            expect(elapsed).toBeLessThan(5000);
        } else {
            if (elapsed >= 5000) console.warn(`[perf] 09.01 medium tree: ${elapsed.toFixed(0)} ms (budget 5000 ms)`);
        }
    }, 20000);

    it('09.02 large tree builds and positions correctness + scale sanity', async () => {
        const { individuals, families } = makePerformanceDataset(2200, 260);
        const context = createPerformanceContext({
            individuals,
            families,
            generations_down: 260,
        });

        const start = process.hrtime.bigint();
        await context.createFamilyTree(individuals[0]);
        const end = process.hrtime.bigint();
        const elapsed = elapsedMs(start, end);

        // Structure correctness
        expect(context.window.tree_rows).not.toBeNull();
        expect(context.window.max_gen_down).toBeGreaterThan(220);

        if (PERF_TESTS) {
            expect(elapsed).toBeLessThan(12000);
        } else {
            if (elapsed >= 12000) console.warn(`[perf] 09.02 large tree: ${elapsed.toFixed(0)} ms (budget 12000 ms)`);
        }
    }, 30000);

    it('09.03 repeated redraw-style runs do not show runaway heap growth', async () => {
        const { individuals, families } = makePerformanceDataset(800, 160);
        const context = createPerformanceContext({
            individuals,
            families,
            generations_down: 160,
        });

        // Structure correctness on first run
        await context.createFamilyTree(individuals[0]);
        expect(context.window.tree_rows).not.toBeNull();

        const before = process.memoryUsage().heapUsed;

        for (let i = 0; i < 25; i += 1) {
            await context.createFamilyTree(individuals[0]);
        }

        const after = process.memoryUsage().heapUsed;
        const growthMb = (after - before) / (1024 * 1024);

        if (PERF_TESTS) {
            expect(growthMb).toBeLessThan(150);
        } else {
            if (growthMb >= 150) console.warn(`[perf] 09.03 heap growth: ${growthMb.toFixed(1)} MB (budget 150 MB)`);
        }
    }, 30000);
});

// ---------------------------------------------------------------------------
// Real-GEDCOM profiling — requires the private GEDCOM file in the repo root.
// The file is .gitignored; tests skip automatically when it is absent.
// ---------------------------------------------------------------------------

function createRealTreeProfilingContext() {
    const dom = new JSDOM(
        '<div id="family-tree-div"></div>' +
        '<span id="root-name"></span>' +
        '<div id="status-bar-div"></div>',
    );

    const treeDiv = dom.window.document.getElementById('family-tree-div');
    // jsdom returns all-zero rects by default; give the div a realistic size.
    treeDiv.getBoundingClientRect = () => ({
        width: 1200, height: 900, top: 0, left: 0, right: 1200, bottom: 900,
    });

    // Canvas mock so draw_tree.js can measure text without a real browser.
    const origCreateElement = dom.window.document.createElement.bind(dom.window.document);
    dom.window.document.createElement = (tag, ...args) => {
        if (String(tag).toLowerCase() === 'canvas') {
            const ctx2d = {
                font: '',
                measureText(text) {
                    const m = / (\d+)px /.exec(ctx2d.font || ' 12px ');
                    return { width: String(text || '').length * (m ? parseInt(m[1], 10) : 12) * 0.55 };
                },
            };
            return { getContext: () => ctx2d };
        }
        return origCreateElement(tag, ...args);
    };

    // jsdom doesn't implement SVGElement.getBBox(); stub it on every SVG element
    // created via createElementNS so drawText's bbox measurement doesn't throw.
    const origCreateElementNS = dom.window.document.createElementNS.bind(dom.window.document);
    dom.window.document.createElementNS = (ns, tag, ...args) => {
        const el = origCreateElementNS(ns, tag, ...args);
        if (!el.getBBox) el.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });
        return el;
    };

    // Minimal D3 selection wrapper — enough for drawTree's fluent SVG-building
    // chain without pulling in the real d3 package.
    class Select {
        constructor(element) { this._el = element; }
        append(tag) {
            const child = this._el.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
            this._el.appendChild(child);
            return new Select(child);
        }
        attr(k, v) {
            if (v === undefined) return this._el.getAttribute ? this._el.getAttribute(k) : undefined;
            if (this._el.setAttribute) this._el.setAttribute(k, String(v));
            return this;
        }
        style(k, v) {
            if (v === undefined) return (this._el.style || {})[k];
            if (this._el.style) this._el.style[k] = v;
            return this;
        }
        text(v) {
            if (v === undefined) return this._el.textContent;
            this._el.textContent = v;
            return this;
        }
        selectAll() {
            const el = this._el;
            return { remove: () => { while (el.firstChild) el.removeChild(el.firstChild); } };
        }
        node() { return this._el; }
        // call(fn, ...args) mirrors d3's `selection.call(fn)` convention.
        call(fn, ...args) { fn(this, ...args); return this; }
        transition() { return this; }
        filter() { return this; }
    }

    function makeZoom() {
        const z = (selection) => selection;
        z.scaleExtent = () => z;
        z.on = () => z;
        z.transform = (selection) => selection;
        z.scaleBy = (selection) => selection;
        return z;
    }

    const d3 = {
        select: (sel) => new Select(
            typeof sel === 'string' ? dom.window.document.querySelector(sel) : sel,
        ),
        zoom: makeZoom,
        hcl: () => '#ffffff',
        path: () => ({ moveTo() {}, lineTo() {}, bezierCurveTo() {}, toString() { return ''; } }),
        zoomTransform: () => ({ k: 1 }),
        zoomIdentity: { x: 0, y: 0, k: 1 },
    };

    const context = loadBrowserScripts([
        'src/js/gedcom.js',
        'src/js/build_tree.js',
        'src/js/position_tree_helpers.js',
        'src/js/position_tree.js',
        'src/js/draw_tree.js',
    ], {
        windowOverrides: {
            generations_up: 5,
            generations_down: 5,
            max_stack_size: 99,
            show_childless_inlaws: true,
            show_non_pedigree_family: true,
            beside_inlaws: false,
            show_names: true,
            show_years: true,
            show_places: false,
            box_width: 160,
            box_height: 60,
            sibling_spacing: 24,
            generation_spacing: 28,
            level_spacing: 40,
            box_padding: 2,
            tree_padding: 80,
            node_border_width: 2,
            link_width: 2,
            highlighted_link_width: 4,
            node_rounding: 10,
            link_rounding: 4,
            special_highlight_percent: 100,
            border_highlight_percent: 100,
            inlaw_link_highlight_percent: 100,
            link_highlight_percent: 100,
            node_saturation: 20,
            node_brightness: 40,
            root_hue: 180,
            text_size: 12,
            default_text_size: 12,
            text_brightness: 80,
            text_shadow: false,
            text_align: 'center',
            highlight_type: 'pedigree',
            tree_orientation: 'vertical',
            tree_color: '#222',
            individuals: [],
            families: [],
        },
        globalOverrides: {
            document: dom.window.document,
            // draw_tree.js accesses family_tree_div and selected_individual as
            // bare globals (no window. prefix), so they must be in globalOverrides
            // to be reachable as VM-context-level identifiers.
            family_tree_div: treeDiv,
            // scheduler.yield() is a browser API not available in Node.js.
            scheduler: { yield: () => Promise.resolve() },
            d3,
        },
    });

    context.window.positioning_log_level = 'none';
    context.window.suppress_positioning_log = true;

    return context;
}

describe('performance profile - real GEDCOM', () => {
    it.skipIf(!REAL_GEDCOM_EXISTS)(
        '09.04 profile real GEDCOM - parse / build / position / draw per-stage timing',
        async () => {
            const gedcomText = readFileSync(REAL_GEDCOM_PATH, 'utf8');
            const context = createRealTreeProfilingContext();

            // ── Stage 1: Parse ────────────────────────────────────────────────
            const t0 = process.hrtime.bigint();
            const parsed = context.parseGedcomData(gedcomText);
            const t1 = process.hrtime.bigint();

            context.window.individuals = parsed.individuals;
            context.window.families    = parsed.families;

            // Use the first person in the file as root.
            // No real names are referenced in test source code.
            const root = parsed.individuals[0];
            expect(root).toBeDefined();

            // draw_tree.js references `selected_individual` as a bare global
            // (VM context identifier), not via `window.`; set both to be safe.
            context.selected_individual        = root;
            context.window.selected_individual = root;

            // ── Stage 2: Build ────────────────────────────────────────────────
            context.rebuildLookupMaps();
            context.resolveGenders(parsed.individuals, parsed.families);

            const t2 = process.hrtime.bigint();
            const tree_data = context.buildTree(root);
            const t3 = process.hrtime.bigint();

            expect(tree_data).not.toBeNull();

            // ── Stage 3: Position ─────────────────────────────────────────────
            const t4 = process.hrtime.bigint();
            const rows = await context.positionTree(tree_data);
            context.normalizeTreeX(rows);
            context.setHeights(rows);
            context.adjustInnerChildrenSpacingGlobal(rows);
            context.normalizeTreeX(rows);
            const t5 = process.hrtime.bigint();

            expect(rows).toBeDefined();

            // ── Stage 4: Draw ─────────────────────────────────────────────────
            // drawTree calls drawNodes without `await`, so the timer would stop
            // before drawNodes finishes processing nodes 100-200.  Capture its
            // promise explicitly so we can await full completion.
            let _drawNodesPromise = null;
            const _origDrawNodes = context.drawNodes;
            context.drawNodes = function (...args) {
                _drawNodesPromise = _origDrawNodes.apply(this, args);
                return _drawNodesPromise;
            };
            const t6 = process.hrtime.bigint();
            await context.drawTree(rows);
            if (_drawNodesPromise) await _drawNodesPromise;
            const t7 = process.hrtime.bigint();
            context.drawNodes = _origDrawNodes;

            const ms = (a, b) => (Number(b - a) / 1_000_000).toFixed(1);
            console.log(
                `[perf 09.04]` +
                `  individuals=${parsed.individuals.length}` +
                `  families=${parsed.families.length}` +
                `  root=${root.id}` +
                `\n             parse=${ms(t0, t1)}ms` +
                `  build=${ms(t2, t3)}ms` +
                `  position=${ms(t4, t5)}ms` +
                `  draw=${ms(t6, t7)}ms` +
                `  total=${ms(t0, t7)}ms`,
            );
        },
        120000,
    );

    it.skipIf(!REAL_GEDCOM_EXISTS)(
        '09.05 profile real GEDCOM - per-function timing across all pipeline stages',
        async () => {
            const gedcomText = readFileSync(REAL_GEDCOM_PATH, 'utf8');
            const context = createRealTreeProfilingContext();

            // ── Functions to instrument, grouped by source file ───────────────
            const ALL_FNS = {
                // gedcom.js
                'validateGedcom':                 'gedcom',
                'parseGedcomData':                'gedcom',

                // build_tree.js
                'rebuildLookupMaps':              'build',
                'computeRawConnectionPathIds':    'build',
                'createFamilyTree':               'build',
                'resolveGenders':                 'build',
                'buildTree':                      'build',
                'createUnknownIndividual':        'build',
                'removeSubTree':                  'build',
                'detachNode':                     'build',
                'resolveDuplicate':               'build',
                'resolveParent':                  'build',
                'prepareParent':                  'build',
                'addParents':                     'build',
                'addPedigreeChildren':            'build',
                'addInlawSpouse':                 'build',
                'addSpousesAndRelatives':         'build',
                'addInlawChildren':               'build',
                'calculateMaxGenUp':              'build',
                'calculateMaxGenDown':            'build',
                'calculateMaxStackSize':          'build',

                // position_tree_helpers.js + position_tree.js
                'positionTree':                   'position',
                'positionMaleAncestor':           'position',
                'positionRelative':               'position',
                'positionInlaw':                  'position',
                'centerAncestorCouple':           'position',
                'positionStackableNode':          'position',
                'layoutChildrenWithPlan':         'position',
                'positionSpouses':                'position',
                'positionChildren':               'position',
                'adjustInnerNodesSpacingForChain':'position',
                'adjustInnerChildrenSpacingGlobal':'position',
                'normalizeTreeX':                 'position',
                'setHeights':                     'position',
                'positionNode':                   'position',
                'shiftSubtree':                   'position',
                'shiftSuperTree':                 'position',
                'shiftSiblings':                  'position',
                'collectShiftableSubtreeNodes':   'position',
                'planOrderedChildStacks':         'position',
                'shouldAcceptChildLayoutTrial':   'position',
                'enforceBoundary':                'position',
                'getBalancingChains':             'position',
                'compactLeftMostGroupNodeRight':  'position',
                'alignStacks':                    'position',
                'buildChildLayoutOrder':          'position',
                'snapshotChildLayoutState':       'position',
                'restoreChildLayoutState':        'position',
                'collectChildLayoutNodes':        'position',
                'resetChildLayoutNodes':          'position',
                'getSubtreeHorizontalMovementSpace': 'position',
                'flattenRows':                    'position',
                'getFixedAdjacentOuterNodes':     'position',
                'getFixedStackOuterNodes':        'position',
                'hasGrandChildren':               'position',

                // draw_tree.js
                'drawTree':                       'draw',
                'drawNodes':                      'draw',
                'drawNode':                       'draw',
                'drawNonBoldLinks':               'draw',
                'drawBoldLinks':                  'draw',
                'drawCircles':                    'draw',
                'drawText':                       'draw',
                'drawLink':                       'draw',
                'drawCircle':                     'draw',
                'buildSecondaryStrings':          'draw',
                'buildSecondaryLines':            'draw',
                'buildAllLines':                  'draw',
                'estimateTextDimensions':         'draw',
                'renderTspans':                   'draw',
                'shrinkToFit':                    'draw',
                'alignTextVertically':            'draw',
                'selectInitialTextLayout':        'draw',
                'fitTextInBox':                   'draw',
                'getNameAvailableHeight':         'draw',
                'getNodeHCL':                     'draw',
                'promoteConnectionNodesInStacks': 'draw',
                'findConnectionPath':             'draw',
                'getLinkHighlightFactor':         'draw',
                'getAncestorLinkHighlightFactor': 'draw',
                'isNodeHighlighted':              'draw',
                'ensureTextShadowFilter':         'draw',
                'getMaximumDimensions':           'draw',
            };

            // ── Wrap every known function with a timing shim ──────────────────
            // Async functions (drawTree, drawNodes) return a Promise whose body
            // continues after the first `await` suspension point.  A plain
            // synchronous shim would stop the timer at that first suspension,
            // missing all subsequent work (e.g. nodes 100-200 in drawNodes).
            // The shim chains .then() so the timer stops only when the full
            // Promise resolves.
            const stats = {};
            for (const [name, group] of Object.entries(ALL_FNS)) {
                const original = context[name];
                if (typeof original !== 'function') continue;
                stats[name] = { group, calls: 0, totalNs: 0n };
                const entry = stats[name];
                context[name] = function (...args) {
                    const s = process.hrtime.bigint();
                    const result = original.apply(this, args);
                    if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
                        return result.then(
                            val => { entry.totalNs += process.hrtime.bigint() - s; entry.calls++; return val; },
                            err => { entry.totalNs += process.hrtime.bigint() - s; entry.calls++; throw err; },
                        );
                    }
                    entry.totalNs += process.hrtime.bigint() - s;
                    entry.calls++;
                    return result;
                };
            }

            // drawTree calls drawNodes without `await`, so drawTree's promise
            // resolves before drawNodes finishes.  Capture drawNodes' promise
            // here so we can await it explicitly after drawTree.
            let _drawNodesPromise = null;
            const _capturedDrawNodes = context.drawNodes;
            context.drawNodes = function (...args) {
                _drawNodesPromise = _capturedDrawNodes.apply(this, args);
                return _drawNodesPromise;
            };

            // ── Run the full pipeline ─────────────────────────────────────────
            const tStart = process.hrtime.bigint();

            const parsed = context.parseGedcomData(gedcomText);
            context.window.individuals = parsed.individuals;
            context.window.families    = parsed.families;
            const root = parsed.individuals[0];
            expect(root).toBeDefined();
            context.selected_individual        = root;
            context.window.selected_individual = root;

            context.rebuildLookupMaps();
            context.resolveGenders(parsed.individuals, parsed.families);
            const tree_data = context.buildTree(root);
            expect(tree_data).not.toBeNull();

            const rows = await context.positionTree(tree_data);
            context.normalizeTreeX(rows);
            context.setHeights(rows);
            context.adjustInnerChildrenSpacingGlobal(rows);
            context.normalizeTreeX(rows);

            await context.drawTree(rows);
            // drawTree does not await drawNodes; drain its remaining async
            // iterations so all node/text timing is captured before tEnd.
            if (_drawNodesPromise) await _drawNodesPromise;

            const tEnd = process.hrtime.bigint();

            // ── Print ranked results grouped by source file ───────────────────
            const msF = (ns) => (Number(ns) / 1_000_000).toFixed(1);
            const totalMs = Number(tEnd - tStart) / 1_000_000;

            const groups = ['gedcom', 'build', 'position', 'draw'];
            const groupLabel = { gedcom: 'gedcom.js', build: 'build_tree.js', position: 'position_tree.js', draw: 'draw_tree.js' };

            const outputLines = [];
            for (const group of groups) {
                const entries = Object.entries(stats)
                    .filter(([, e]) => e.group === group)
                    .sort(([, a], [, b]) => (b.totalNs > a.totalNs ? 1 : -1));
                outputLines.push(`\n  ── ${groupLabel[group]} ──`);
                for (const [name, e] of entries) {
                    const pct = ((Number(e.totalNs) / 1_000_000 / totalMs) * 100).toFixed(1);
                    const callStr = e.calls > 0 ? String(e.calls).padStart(6) : '     -';
                    const msStr  = e.calls > 0 ? msF(e.totalNs).padStart(8) : '       -';
                    outputLines.push(`  ${pct.padStart(5)}%  ${msStr}ms  ${callStr} calls  ${name}`);
                }
            }

            console.log(
                `[perf 09.05] full pipeline per-function breakdown  (total wall=${totalMs.toFixed(1)}ms)\n` +
                `  % of wall      self ms   calls  function` +
                outputLines.join('\n'),
            );

            expect(rows).toBeDefined();
        },
        120000,
    );
});
