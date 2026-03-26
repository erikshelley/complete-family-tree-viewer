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
});