import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScripts } from './helpers/load-browser-script.js';

function createTreeContext(windowOverrides = {}, globalOverrides = {}) {
    const dom = new JSDOM('<div id="family-tree-div"></div>');
    const context = loadBrowserScripts(['src/js/build_tree.js', 'src/js/position_tree.js'], {
        windowOverrides: {
            generations_up: 2,
            generations_down: 2,
            max_stack_size: 2,
            hide_childless_inlaws: false,
            pedigree_only: false,
            vertical_inlaws: true,
            box_width: 80,
            box_height: 50,
            h_spacing: 24,
            v_spacing: 28,
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

    return { context, dom };
}

describe('edge cases', () => {
    it('08.01 individual without name does not crash tree generation', async () => {
        const individuals = [
            { id: '@I1@', name: '', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse Person', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I3@', name: 'Child Person', famc: '@F1@', fams: [], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: ['@I3@'] },
        ];

        const { context } = createTreeContext({ individuals, families, generations_up: 0, generations_down: 1 });

        const root = individuals.find(person => person.id === '@I1@');
        await expect(context.createFamilyTree(root)).resolves.toBeUndefined();
        expect(context.window.root_node.individual.id).toBe('@I1@');
    });

    it('08.02 unknown gender still builds and positions safely', () => {
        const individuals = [
            { id: '@I1@', name: 'Root Unknown', famc: null, fams: ['@F1@'], gender: 'U' },
            { id: '@I2@', name: 'Spouse Person', famc: null, fams: ['@F1@'], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: [] },
        ];

        const { context } = createTreeContext({ individuals, families, generations_up: 0, generations_down: 1 });

        const root = individuals.find(person => person.id === '@I1@');
        const rootNode = context.buildTree(root);
        const rows = context.positionTree(rootNode);

        expect(rootNode).not.toBeNull();
        expect(rows.length).toBeGreaterThan(0);
        expect(Number.isFinite(rootNode.x)).toBe(true);
    });

    it('08.03 family with no children does not create child links', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: [] },
        ];

        const { context } = createTreeContext({ individuals, families, generations_up: 0, generations_down: 1 });

        const root = individuals.find(person => person.id === '@I1@');
        const rootNode = context.buildTree(root);

        expect(rootNode.spouse_nodes.length).toBe(1);
        expect(rootNode.spouse_nodes[0].children_nodes.length).toBe(0);
    });

    it('08.04 circular malformed references do not recurse forever in generation depth checks', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Child', famc: '@F1@', fams: ['@F2@'], gender: 'F' },
            { id: '@I3@', name: 'LoopBack', famc: '@F2@', fams: ['@F1@'], gender: 'M' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: null, chil: ['@I2@'] },
            { id: '@F2@', husb: '@I3@', wife: '@I2@', chil: ['@I1@'] },
        ];

        const { context } = createTreeContext({ individuals, families, generations_up: 0 });

        context.window.visited_individuals = null;
        const depth = context.calculateMaxGenDown(individuals[0]);

        expect(Number.isFinite(depth)).toBe(true);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThan(20);
    });

    it('08.05 large tree can be created without runtime errors', async () => {
        const nodeCount = 120;
        const individuals = [];
        const families = [];

        for (let i = 1; i <= nodeCount; i += 1) {
            individuals.push({
                id: `@I${i}@`,
                name: `Person ${i}`,
                famc: i === 1 ? null : `@F${i - 1}@`,
                fams: i < nodeCount ? [`@F${i}@`] : [],
                gender: i % 2 === 0 ? 'F' : 'M',
            });
            if (i < nodeCount) {
                families.push({
                    id: `@F${i}@`,
                    husb: `@I${i}@`,
                    wife: null,
                    chil: [`@I${i + 1}@`],
                });
            }
        }

        const { context } = createTreeContext({
            individuals,
            families,
            generations_up: 0,
            generations_down: nodeCount,
        });

        const root = individuals[0];
        await expect(context.createFamilyTree(root)).resolves.toBeUndefined();
        expect(context.window.max_gen_down).toBeGreaterThan(50);
    });
});
