import { describe, expect, it } from 'vitest';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function loadBuildTreeContext(windowOverrides = {}) {
    return loadBrowserScript('src/js/build_tree.js', { windowOverrides });
}

describe('build tree utilities', () => {
    it('builds root without parents when famc is missing', () => {
        const individuals = [
            { id: '@I1@', name: 'Root Person', famc: null, fams: [], gender: 'M' },
        ];

        const context = loadBuildTreeContext({
            individuals,
            families: [],
            generations_up: 1,
            generations_down: 1,
            hide_childless_inlaws: false,
            pedigree_only: false,
            max_gen_up: 0,
            max_gen_down: 0,
        });

        const rootNode = context.buildTree(individuals[0]);

        expect(rootNode.type).toBe('root');
        expect(rootNode.father_node).toBeNull();
        expect(rootNode.mother_node).toBeNull();
    });

    it('builds root tree with spouse and inlaw children', () => {
        const individuals = [
            { id: '@I1@', name: 'Root Person', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse Person', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I3@', name: 'Child Person', famc: '@F1@', fams: [], gender: 'F' },
        ];

        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: ['@I3@'] },
        ];

        const context = loadBuildTreeContext({
            individuals,
            families,
            generations_up: 1,
            generations_down: 1,
            hide_childless_inlaws: false,
            pedigree_only: false,
            max_gen_up: 0,
            max_gen_down: 0,
        });

        const root = individuals.find(person => person.id === '@I1@');
        const rootNode = context.buildTree(root);

        expect(rootNode.type).toBe('root');
        expect(rootNode.generation).toBe(1);
        expect(rootNode.spouse_nodes).toHaveLength(1);
        expect(rootNode.spouse_nodes[0].individual.id).toBe('@I2@');
        expect(rootNode.spouse_nodes[0].type).toBe('inlaw');
        expect(rootNode.spouse_nodes[0].children_nodes).toHaveLength(1);
        expect(rootNode.spouse_nodes[0].children_nodes[0].individual.id).toBe('@I3@');
        expect(rootNode.spouse_nodes[0].children_nodes[0].type).toBe('relative');
    });

    it('adds parents for root when family-as-child is present', () => {
        const individuals = [
            { id: '@I1@', name: 'Root Person', famc: '@F0@', fams: [], gender: 'M' },
            { id: '@I4@', name: 'Father Person', famc: null, fams: ['@F0@'], gender: 'M' },
            { id: '@I5@', name: 'Mother Person', famc: null, fams: ['@F0@'], gender: 'F' },
        ];

        const families = [
            { id: '@F0@', husb: '@I4@', wife: '@I5@', chil: ['@I1@'] },
        ];

        const context = loadBuildTreeContext({
            individuals,
            families,
            generations_up: 1,
            generations_down: 1,
            hide_childless_inlaws: false,
            pedigree_only: false,
            max_gen_up: 0,
            max_gen_down: 0,
        });

        const rootNode = context.buildTree(individuals[0]);
        expect(rootNode.father_node.individual.id).toBe('@I4@');
        expect(rootNode.mother_node.individual.id).toBe('@I5@');
    });

    it('keeps existing ancestor when duplicate is non-ancestor', () => {
        const context = loadBuildTreeContext();

        const existingNode = { type: 'ancestor' };
        const individual = { id: '@I20@', node: existingNode };

        const action = context.resolveDuplicate(individual, 'relative', 1);
        expect(action).toBe('keep-existing');
        expect(individual.node).toBe(existingNode);
    });

    it('replaces relative duplicate when ancestor path appears', () => {
        const context = loadBuildTreeContext();

        const childIndividual = { id: '@I11@', name: 'Nested Child', node: { marker: 'set' } };
        const nestedChildNode = { individual: childIndividual, spouse_nodes: [] };
        const existingIndividual = { id: '@I10@', name: 'Duplicate Person', node: null };
        const parentNode = { children_nodes: [] };
        const spouseNode = { children_nodes: [nestedChildNode] };
        const existingNode = {
            individual: existingIndividual,
            type: 'relative',
            anchor_generation: 0,
            spouse_nodes: [spouseNode],
            parent_node: parentNode,
        };

        existingIndividual.node = existingNode;
        parentNode.children_nodes = [existingNode];

        const action = context.resolveDuplicate(existingIndividual, 'ancestor', 1);

        expect(action).toBe('replace');
        expect(parentNode.children_nodes).toHaveLength(0);
        expect(existingIndividual.node).toBeNull();
        expect(childIndividual.node).toBeNull();
    });

    it('creates unknown parent when parent id is missing', () => {
        const individuals = [
            { id: '@I1@', name: 'Known Spouse', famc: null, fams: [], gender: 'F' },
        ];
        const family = { id: '@F1@', husb: null, wife: '@I1@', chil: [] };

        const context = loadBuildTreeContext({ individuals, families: [family] });
        const unknownFather = context.resolveParent(family.husb, 'M', family);

        expect(unknownFather.name).toBe('Spouse of Known');
        expect(unknownFather.gender).toBe('M');
        expect(family.husb).toBe(unknownFather.id);
        expect(individuals.some(person => person.id === unknownFather.id)).toBe(true);
    });

    it('calculates max generation depth downward', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Child', famc: '@F1@', fams: ['@F2@'], gender: 'F' },
            { id: '@I3@', name: 'Grandchild', famc: '@F2@', fams: [], gender: 'M' },
            { id: '@I4@', name: 'Spouse 1', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I5@', name: 'Spouse 2', famc: null, fams: ['@F2@'], gender: 'M' },
        ];

        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I4@', chil: ['@I2@'] },
            { id: '@F2@', husb: '@I5@', wife: '@I2@', chil: ['@I3@'] },
        ];

        const context = loadBuildTreeContext({
            individuals,
            families,
            generations_up: 0,
            visited_individuals: null,
        });

        const depth = context.calculateMaxGenDown(individuals[0]);
        expect(depth).toBe(2);
    });

    it('calculates max generation depth upward', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: '@F1@', fams: [], gender: 'M' },
            { id: '@I2@', name: 'Father', famc: '@F2@', fams: ['@F1@'], gender: 'M' },
            { id: '@I3@', name: 'Mother', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I4@', name: 'Grandfather', famc: null, fams: ['@F2@'], gender: 'M' },
            { id: '@I5@', name: 'Grandmother', famc: null, fams: ['@F2@'], gender: 'F' },
        ];

        const families = [
            { id: '@F1@', husb: '@I2@', wife: '@I3@', chil: ['@I1@'] },
            { id: '@F2@', husb: '@I4@', wife: '@I5@', chil: ['@I2@'] },
        ];

        const context = loadBuildTreeContext({ individuals, families });
        const depth = context.calculateMaxGenUp(individuals[0]);

        expect(depth).toBe(2);
    });

    it('hides non-pedigree family by excluding root sibling branches from ancestor children', () => {
        const individuals = [
            { id: '@I1@', name: 'Root Person', famc: '@F0@', fams: ['@F3@'], gender: 'M' },
            { id: '@I2@', name: 'Root Sibling', famc: '@F0@', fams: ['@F2@'], gender: 'F' },
            { id: '@I3@', name: 'Father Person', famc: null, fams: ['@F0@'], gender: 'M' },
            { id: '@I4@', name: 'Mother Person', famc: null, fams: ['@F0@'], gender: 'F' },
            { id: '@I5@', name: 'Sibling Spouse', famc: null, fams: ['@F2@'], gender: 'M' },
            { id: '@I6@', name: 'Sibling Child', famc: '@F2@', fams: [], gender: 'M' },
            { id: '@I7@', name: 'Root Spouse', famc: null, fams: ['@F3@'], gender: 'F' },
            { id: '@I8@', name: 'Root Child', famc: '@F3@', fams: [], gender: 'F' },
        ];

        const families = [
            { id: '@F0@', husb: '@I3@', wife: '@I4@', chil: ['@I1@', '@I2@'] },
            { id: '@F2@', husb: '@I5@', wife: '@I2@', chil: ['@I6@'] },
            { id: '@F3@', husb: '@I1@', wife: '@I7@', chil: ['@I8@'] },
        ];

        function buildRoot(hideNonPedigreeFamily) {
            const context = loadBuildTreeContext({
                individuals: structuredClone(individuals),
                families: structuredClone(families),
                generations_up: 1,
                generations_down: 2,
                hide_childless_inlaws: false,
                hide_non_pedigree_family: hideNonPedigreeFamily,
                pedigree_only: false,
                max_gen_up: 0,
                max_gen_down: 0,
            });

            return context.buildTree(context.window.individuals.find(person => person.id === '@I1@'));
        }

        const withBranches = buildRoot(false);
        const withoutBranches = buildRoot(true);

        expect(withBranches.father_node.children_nodes.map(node => node.individual.id)).toEqual(['@I1@', '@I2@']);
        expect(withBranches.father_node.children_nodes[1].spouse_nodes).toHaveLength(1);
        expect(withBranches.father_node.children_nodes[1].spouse_nodes[0].children_nodes.map(node => node.individual.id)).toEqual(['@I6@']);
        expect(withoutBranches.father_node.children_nodes.map(node => node.individual.id)).toEqual(['@I1@']);
        expect(withoutBranches.father_node.children_nodes[0].spouse_nodes.map(node => node.individual.id)).toEqual(['@I7@']);
        expect(withoutBranches.father_node.children_nodes[0].spouse_nodes[0].children_nodes.map(node => node.individual.id)).toEqual(['@I8@']);
    });

    it('hides non-pedigree family by excluding ancestor in-law spouse branches', () => {
        const individuals = [
            { id: '@I1@', name: 'Root Person', famc: '@F0@', fams: [], gender: 'M' },
            { id: '@I2@', name: 'Father Person', famc: null, fams: ['@F0@', '@F1@'], gender: 'M' },
            { id: '@I3@', name: 'Mother Person', famc: null, fams: ['@F0@'], gender: 'F' },
            { id: '@I4@', name: 'Inlaw Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I5@', name: 'Inlaw Child', famc: '@F1@', fams: [], gender: 'M' },
        ];

        const families = [
            { id: '@F0@', husb: '@I2@', wife: '@I3@', chil: ['@I1@'] },
            { id: '@F1@', husb: '@I2@', wife: '@I4@', chil: ['@I5@'] },
        ];

        function buildRoot(hideNonPedigreeFamily) {
            const context = loadBuildTreeContext({
                individuals: structuredClone(individuals),
                families: structuredClone(families),
                generations_up: 1,
                generations_down: 1,
                hide_childless_inlaws: false,
                hide_non_pedigree_family: hideNonPedigreeFamily,
                pedigree_only: false,
                max_gen_up: 0,
                max_gen_down: 0,
            });

            return context.buildTree(context.window.individuals.find(person => person.id === '@I1@'));
        }

        const withInlawBranch = buildRoot(false);
        const withoutInlawBranch = buildRoot(true);

        expect(withInlawBranch.father_node.spouse_nodes.map(node => node.individual.id)).toEqual(['@I4@']);
        expect(withInlawBranch.father_node.spouse_nodes[0].children_nodes.map(node => node.individual.id)).toEqual(['@I5@']);
        expect(withoutInlawBranch.father_node.spouse_nodes).toHaveLength(0);
    });
});

describe('resolveGenders', () => {
    function makeContext() {
        return loadBuildTreeContext();
    }

    it('assumes male when person has no gender and one female spouse', () => {
        const individuals = [
            { id: '@I1@', name: 'Unknown Person', famc: null, fams: ['@F1@'], gender: '' },
            { id: '@I2@', name: 'Female Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
        ];
        const families = [{ id: '@F1@', husb: '@I1@', wife: '@I2@', chil: [] }];

        makeContext().resolveGenders(individuals, families);

        expect(individuals[0].gender).toBe('M');
    });

    it('assumes female when person has no gender and one male spouse', () => {
        const individuals = [
            { id: '@I1@', name: 'Unknown Person', famc: null, fams: ['@F1@'], gender: '' },
            { id: '@I2@', name: 'Male Spouse', famc: null, fams: ['@F1@'], gender: 'M' },
        ];
        const families = [{ id: '@F1@', husb: '@I2@', wife: '@I1@', chil: [] }];

        makeContext().resolveGenders(individuals, families);

        expect(individuals[0].gender).toBe('F');
    });

    it('assumes male for person and female for spouse when both have no gender', () => {
        const individuals = [
            { id: '@I1@', name: 'Unknown Person', famc: null, fams: ['@F1@'], gender: '' },
            { id: '@I2@', name: 'Unknown Spouse', famc: null, fams: ['@F1@'], gender: '' },
        ];
        const families = [{ id: '@F1@', husb: '@I1@', wife: '@I2@', chil: [] }];

        makeContext().resolveGenders(individuals, families);

        expect(individuals[0].gender).toBe('M');
        expect(individuals[1].gender).toBe('F');
    });

    it('assumes male when person has no gender and has both male and female spouses', () => {
        const individuals = [
            { id: '@I1@', name: 'Unknown Person', famc: null, fams: ['@F1@', '@F2@'], gender: '' },
            { id: '@I2@', name: 'Male Spouse', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I3@', name: 'Female Spouse', famc: null, fams: ['@F2@'], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I2@', wife: '@I1@', chil: [] },
            { id: '@F2@', husb: '@I1@', wife: '@I3@', chil: [] },
        ];

        makeContext().resolveGenders(individuals, families);

        expect(individuals[0].gender).toBe('M');
    });

    it('assumes all no-gender spouses are female when person is male', () => {
        const individuals = [
            { id: '@I1@', name: 'Male Person', famc: null, fams: ['@F1@', '@F2@'], gender: 'M' },
            { id: '@I2@', name: 'Unknown Spouse 1', famc: null, fams: ['@F1@'], gender: '' },
            { id: '@I3@', name: 'Unknown Spouse 2', famc: null, fams: ['@F2@'], gender: '' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: [] },
            { id: '@F2@', husb: '@I1@', wife: '@I3@', chil: [] },
        ];

        makeContext().resolveGenders(individuals, families);

        expect(individuals[1].gender).toBe('F');
        expect(individuals[2].gender).toBe('F');
    });

    it('assumes all no-gender spouses are male when person is female', () => {
        const individuals = [
            { id: '@I1@', name: 'Female Person', famc: null, fams: ['@F1@', '@F2@'], gender: 'F' },
            { id: '@I2@', name: 'Unknown Spouse 1', famc: null, fams: ['@F1@'], gender: '' },
            { id: '@I3@', name: 'Unknown Spouse 2', famc: null, fams: ['@F2@'], gender: '' },
        ];
        const families = [
            { id: '@F1@', husb: '@I2@', wife: '@I1@', chil: [] },
            { id: '@F2@', husb: '@I3@', wife: '@I1@', chil: [] },
        ];

        makeContext().resolveGenders(individuals, families);

        expect(individuals[1].gender).toBe('M');
        expect(individuals[2].gender).toBe('M');
    });

    it('treats non-M/F gender (e.g. U) the same as missing gender and infers from spouse', () => {
        const individuals = [
            { id: '@I1@', name: 'Unknown Gender Person', famc: null, fams: ['@F1@'], gender: 'U' },
            { id: '@I2@', name: 'Female Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
        ];
        const families = [{ id: '@F1@', husb: '@I1@', wife: '@I2@', chil: [] }];

        makeContext().resolveGenders(individuals, families);

        expect(individuals[0].gender).toBe('M');
    });
});

describe('computeRawConnectionPathIds', () => {
    function makeConnectionContext(individuals, families) {
        const context = loadBuildTreeContext({ individuals, families });
        context.rebuildLookupMaps();
        return context;
    }

    it('02.16 returns empty set when root and target are the same individual', () => {
        const context = makeConnectionContext(
            [{ id: '@I1@', name: 'Root', famc: null, fams: [], gender: 'M' }],
            []
        );
        const result = context.computeRawConnectionPathIds('@I1@', '@I1@');
        expect(result.size).toBe(0);
    });

    it('02.17 returns empty set when target individual is not reachable', () => {
        const context = makeConnectionContext(
            [
                { id: '@I1@', name: 'Root', famc: null, fams: [], gender: 'M' },
                { id: '@I2@', name: 'Unrelated', famc: null, fams: [], gender: 'F' },
            ],
            []
        );
        const result = context.computeRawConnectionPathIds('@I1@', '@I2@');
        expect(result.size).toBe(0);
    });

    it('02.18 returns path IDs through shared parent to a sibling', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: '@F0@', fams: [], gender: 'M' },
            { id: '@I2@', name: 'Sibling', famc: '@F0@', fams: [], gender: 'F' },
            { id: '@I3@', name: 'Father', famc: null, fams: ['@F0@'], gender: 'M' },
            { id: '@I4@', name: 'Mother', famc: null, fams: ['@F0@'], gender: 'F' },
        ];
        const families = [
            { id: '@F0@', husb: '@I3@', wife: '@I4@', chil: ['@I1@', '@I2@'] },
        ];
        const context = makeConnectionContext(individuals, families);
        const result = context.computeRawConnectionPathIds('@I1@', '@I2@');
        expect(result.has('@I1@')).toBe(true);
        expect(result.has('@I2@')).toBe(true);
        expect(result.has('@I3@')).toBe(true);  // path goes through father (husb reached before wife)
        expect(result.has('@I4@')).toBe(false); // mother is not on the shortest path
        expect(result.size).toBe(3);
    });

    it('02.19 returns path IDs through a child to a grandchild', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F0@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse', famc: null, fams: ['@F0@'], gender: 'F' },
            { id: '@I3@', name: 'Child', famc: '@F0@', fams: ['@F1@'], gender: 'M' },
            { id: '@I4@', name: 'Child Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I5@', name: 'Grandchild', famc: '@F1@', fams: [], gender: 'F' },
        ];
        const families = [
            { id: '@F0@', husb: '@I1@', wife: '@I2@', chil: ['@I3@'] },
            { id: '@F1@', husb: '@I3@', wife: '@I4@', chil: ['@I5@'] },
        ];
        const context = makeConnectionContext(individuals, families);
        const result = context.computeRawConnectionPathIds('@I1@', '@I5@');
        expect(result.has('@I1@')).toBe(true);
        expect(result.has('@I3@')).toBe(true);
        expect(result.has('@I5@')).toBe(true);
        expect(result.has('@I2@')).toBe(false); // spouse not on path
        expect(result.has('@I4@')).toBe(false); // child spouse not on path
        expect(result.size).toBe(3);
    });

    it('02.20 hide_non_pedigree_family with connection path keeps sibling on the connection path', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: '@F0@', fams: [], gender: 'M' },
            { id: '@I2@', name: 'Sibling', famc: '@F0@', fams: [], gender: 'F' },
            { id: '@I3@', name: 'Father', famc: null, fams: ['@F0@'], gender: 'M' },
            { id: '@I4@', name: 'Mother', famc: null, fams: ['@F0@'], gender: 'F' },
        ];
        const families = [
            { id: '@F0@', husb: '@I3@', wife: '@I4@', chil: ['@I1@', '@I2@'] },
        ];
        const context = loadBuildTreeContext({
            individuals: structuredClone(individuals),
            families: structuredClone(families),
            generations_up: 1,
            generations_down: 1,
            hide_childless_inlaws: false,
            hide_non_pedigree_family: true,
            pedigree_only: false,
            max_gen_up: 0,
            max_gen_down: 0,
            connection_path_individual_ids: new Set(['@I2@']),
        });

        const rootNode = context.buildTree(context.window.individuals.find(p => p.id === '@I1@'));
        const childIds = rootNode.father_node.children_nodes.map(n => n.individual.id);
        expect(childIds).toContain('@I1@');
        expect(childIds).toContain('@I2@');
    });

    it('02.21 hide_non_pedigree_family without connection path still excludes sibling', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: '@F0@', fams: [], gender: 'M' },
            { id: '@I2@', name: 'Sibling', famc: '@F0@', fams: [], gender: 'F' },
            { id: '@I3@', name: 'Father', famc: null, fams: ['@F0@'], gender: 'M' },
            { id: '@I4@', name: 'Mother', famc: null, fams: ['@F0@'], gender: 'F' },
        ];
        const families = [
            { id: '@F0@', husb: '@I3@', wife: '@I4@', chil: ['@I1@', '@I2@'] },
        ];
        const context = loadBuildTreeContext({
            individuals: structuredClone(individuals),
            families: structuredClone(families),
            generations_up: 1,
            generations_down: 1,
            hide_childless_inlaws: false,
            hide_non_pedigree_family: true,
            pedigree_only: false,
            max_gen_up: 0,
            max_gen_down: 0,
            connection_path_individual_ids: new Set(),
        });

        const rootNode = context.buildTree(context.window.individuals.find(p => p.id === '@I1@'));
        const childIds = rootNode.father_node.children_nodes.map(n => n.individual.id);
        expect(childIds).not.toContain('@I2@');
        expect(childIds).toContain('@I1@');
    });

    it('02.22 hide_non_pedigree_family with connection path keeps ancestor in-law spouse on the connection path', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: '@F0@', fams: [], gender: 'M' },
            { id: '@I2@', name: 'Father', famc: null, fams: ['@F0@', '@F1@'], gender: 'M' },
            { id: '@I3@', name: 'Mother', famc: null, fams: ['@F0@'], gender: 'F' },
            { id: '@I4@', name: 'Inlaw Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I5@', name: 'Inlaw Child', famc: '@F1@', fams: [], gender: 'M' },
        ];
        const families = [
            { id: '@F0@', husb: '@I2@', wife: '@I3@', chil: ['@I1@'] },
            { id: '@F1@', husb: '@I2@', wife: '@I4@', chil: ['@I5@'] },
        ];
        const context = loadBuildTreeContext({
            individuals: structuredClone(individuals),
            families: structuredClone(families),
            generations_up: 1,
            generations_down: 1,
            hide_childless_inlaws: false,
            hide_non_pedigree_family: true,
            pedigree_only: false,
            max_gen_up: 0,
            max_gen_down: 0,
            connection_path_individual_ids: new Set(['@I4@']),
        });

        const rootNode = context.buildTree(context.window.individuals.find(p => p.id === '@I1@'));
        expect(rootNode.father_node.spouse_nodes.map(n => n.individual.id)).toContain('@I4@');
    });

    it('02.23 hide_non_pedigree_family without connection path still excludes ancestor in-law spouse', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: '@F0@', fams: [], gender: 'M' },
            { id: '@I2@', name: 'Father', famc: null, fams: ['@F0@', '@F1@'], gender: 'M' },
            { id: '@I3@', name: 'Mother', famc: null, fams: ['@F0@'], gender: 'F' },
            { id: '@I4@', name: 'Inlaw Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I5@', name: 'Inlaw Child', famc: '@F1@', fams: [], gender: 'M' },
        ];
        const families = [
            { id: '@F0@', husb: '@I2@', wife: '@I3@', chil: ['@I1@'] },
            { id: '@F1@', husb: '@I2@', wife: '@I4@', chil: ['@I5@'] },
        ];
        const context = loadBuildTreeContext({
            individuals: structuredClone(individuals),
            families: structuredClone(families),
            generations_up: 1,
            generations_down: 1,
            hide_childless_inlaws: false,
            hide_non_pedigree_family: true,
            pedigree_only: false,
            max_gen_up: 0,
            max_gen_down: 0,
            connection_path_individual_ids: new Set(),
        });

        const rootNode = context.buildTree(context.window.individuals.find(p => p.id === '@I1@'));
        expect(rootNode.father_node.spouse_nodes).toHaveLength(0);
    });
});