import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScripts } from './helpers/load-browser-script.js';

// Set PERF_TESTS=1 in the environment to enable hard timing assertions.
// Without it, timing is measured and logged but never fails the build.
const PERF_TESTS = process.env.PERF_TESTS === '1';

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
