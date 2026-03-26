import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScripts } from './helpers/load-browser-script.js';

function getIntegrationGedcom() {
    return [
        '0 HEAD',
        '1 SOUR TEST',
        '0 @I1@ INDI',
        '1 NAME Root /Person/',
        '1 SEX M',
        '1 FAMS @F1@',
        '1 FAMS @F2@',
        '1 FAMC @F0@',
        '0 @I2@ INDI',
        '1 NAME Spouse /One/',
        '1 SEX F',
        '1 FAMS @F1@',
        '0 @I3@ INDI',
        '1 NAME Child /One/',
        '1 SEX F',
        '1 FAMC @F1@',
        '0 @I4@ INDI',
        '1 NAME Spouse /Two/',
        '1 SEX F',
        '1 FAMS @F2@',
        '0 @I5@ INDI',
        '1 NAME Father /Root/',
        '1 SEX M',
        '1 FAMS @F0@',
        '0 @I6@ INDI',
        '1 NAME Mother /Root/',
        '1 SEX F',
        '1 FAMS @F0@',
        '0 @F0@ FAM',
        '1 HUSB @I5@',
        '1 WIFE @I6@',
        '1 CHIL @I1@',
        '0 @F1@ FAM',
        '1 HUSB @I1@',
        '1 WIFE @I2@',
        '1 CHIL @I3@',
        '0 @F2@ FAM',
        '1 HUSB @I1@',
        '1 WIFE @I4@',
        '0 TRLR',
    ].join('\n');
}

function getWideInlawGedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI',
        '1 NAME Root /Person/',
        '1 SEX M',
        '1 FAMC @F0@',
        '0 @I2@ INDI',
        '1 NAME Father /Ancestor/',
        '1 SEX M',
        '1 FAMS @F0@',
        '1 FAMS @F1@',
        '0 @I3@ INDI',
        '1 NAME Mother /Ancestor/',
        '1 SEX F',
        '1 FAMS @F0@',
        '0 @I4@ INDI',
        '1 NAME InLaw /Wife/',
        '1 SEX F',
        '1 FAMS @F1@',
        '0 @I5@ INDI',
        '1 NAME InLaw /ChildA/',
        '1 SEX M',
        '1 FAMC @F1@',
        '0 @I6@ INDI',
        '1 NAME InLaw /ChildB/',
        '1 SEX F',
        '1 FAMC @F1@',
        '0 @I7@ INDI',
        '1 NAME InLaw /ChildC/',
        '1 SEX M',
        '1 FAMC @F1@',
        '0 @I8@ INDI',
        '1 NAME InLaw /ChildD/',
        '1 SEX F',
        '1 FAMC @F1@',
        '0 @I9@ INDI',
        '1 NAME InLaw /ChildE/',
        '1 SEX M',
        '1 FAMC @F1@',
        '0 @F0@ FAM',
        '1 HUSB @I2@',
        '1 WIFE @I3@',
        '1 CHIL @I1@',
        '0 @F1@ FAM',
        '1 HUSB @I2@',
        '1 WIFE @I4@',
        '1 CHIL @I5@',
        '1 CHIL @I6@',
        '1 CHIL @I7@',
        '1 CHIL @I8@',
        '1 CHIL @I9@',
        '0 TRLR',
    ].join('\n');
}

function getLayoutWidth(rootNode) {
    let minX = Infinity;
    let maxX = -Infinity;
    const visited = new Set();

    function visit(node) {
        if (!node || visited.has(node)) return;
        visited.add(node);
        if (typeof node.x === 'number') minX = Math.min(minX, node.x);
        if (typeof node.x === 'number') maxX = Math.max(maxX, node.x + 80);
        (node.spouse_nodes || []).forEach(visit);
        (node.children_nodes || []).forEach(visit);
        visit(node.father_node);
        visit(node.mother_node);
    }

    visit(rootNode);
    return maxX - minX;
}

function createPipelineContext({ dom, drawTree } = {}) {
    const windowOverrides = {
        generations_up: 2,
        generations_down: 2,
        hide_childless_inlaws: false,
        pedigree_only: false,
        vertical_inlaws: true,
        max_stack_size: 1,
        box_width: 80,
        box_height: 50,
        h_spacing: 24,
        v_spacing: 28,
        level_spacing: 40,
        box_padding: 2,
        tree_padding: 80,
        node_border_width: 2,
        link_width: 2,
    };

    const globalOverrides = {
        document: dom ? dom.window.document : undefined,
        drawTree: drawTree || (async () => {}),
    };

    const context = loadBrowserScripts(['src/js/gedcom.js', 'src/js/build_tree.js', 'src/js/position_tree.js'], {
        windowOverrides,
        globalOverrides,
    });

    return context;
}

describe('integration test cases', () => {
    it('05.01 parses GEDCOM, selects root, and creates a drawable tree', async () => {
        const dom = new JSDOM('<div id="family-tree-div"></div>');

        let capturedRows = null;
        const context = createPipelineContext({
            dom,
            drawTree: async (rows) => {
                capturedRows = rows;
                dom.window.document.getElementById('family-tree-div').innerHTML = '<svg><path></path></svg>';
            },
        });

        const parsed = context.parseGedcomData(getIntegrationGedcom());
        context.window.individuals = parsed.individuals;
        context.window.families = parsed.families;

        const root = parsed.individuals.find(person => person.id === '@I1@');
        await context.createFamilyTree(root);

        const allNodeIds = capturedRows
            .flatMap(level => level || [])
            .flatMap(subLevel => subLevel || [])
            .map(node => node.individual && node.individual.id)
            .filter(Boolean);

        expect(parsed.individuals.length).toBe(6);
        expect(parsed.families.length).toBe(3);
        expect(context.window.root_node.individual.id).toBe('@I1@');
        expect(capturedRows).not.toBeNull();
        expect(allNodeIds).toContain('@I1@');
        expect(allNodeIds).toContain('@I2@');
        expect(allNodeIds).toContain('@I3@');
        expect(dom.window.document.querySelector('#family-tree-div svg')).not.toBeNull();
    });

    it('05.02 updateFamilyTree enforces generation and stack maximums after redraw', async () => {
        const dom = new JSDOM(`
            <div id="family-tree-div"></div>
            <select id="individual-select"><option value="@I1@" selected>Root</option></select>
            <input id="generations-up-number" value="99" />
            <input id="generations-down-number" value="99" />
            <input id="max-stack-size-number" value="99" />
        `);

        const elements = {
            family_tree_div: dom.window.document.getElementById('family-tree-div'),
            individual_select: dom.window.document.getElementById('individual-select'),
            generations_up_number: dom.window.document.getElementById('generations-up-number'),
            generations_down_number: dom.window.document.getElementById('generations-down-number'),
            max_stack_size_number: dom.window.document.getElementById('max-stack-size-number'),
        };

        const context = loadBrowserScripts(
            ['src/js/ui.js'],
            {
                windowOverrides: {
                    ...elements,
                    generations_up: 2,
                    generations_down: 2,
                    max_stack_size: 50,
                    hide_childless_inlaws: false,
                    vertical_inlaws: true,
                    pedigree_only: false,
                    box_width: 80,
                    box_height: 50,
                    h_spacing: 24,
                    v_spacing: 28,
                    level_spacing: 40,
                    box_padding: 2,
                    tree_padding: 80,
                    node_border_width: 2,
                    link_width: 2,
                    selected_individual: { id: '@I1@' },
                    gedcom_content: 'fixture',
                },
                globalOverrides: {
                    document: dom.window.document,
                    d3: { hcl: () => ({}) },
                    individual_select: elements.individual_select,
                    generations_up_number: elements.generations_up_number,
                    generations_down_number: elements.generations_down_number,
                    max_stack_size_number: elements.max_stack_size_number,
                    family_tree_div: elements.family_tree_div,
                    parseGedcomData: () => ({
                        individuals: [{ id: '@I1@', name: 'Root' }],
                        families: [],
                    }),
                    createFamilyTree: async () => {
                        elements.family_tree_div.innerHTML = '<svg></svg>';
                        context.window.max_gen_up = 1;
                        context.window.max_gen_down = 1;
                        context.window.max_stack_actual = 1;
                    },
                    optionsMenu: { style: {}, addEventListener: () => {} },
                    leftColumnWrapper: { classList: { remove: () => {}, add: () => {}, contains: () => false }, style: {} },
                    leftCol: { offsetWidth: 300 },
                    rightCol: { offsetWidth: 500 },
                    expand_styling_button: { style: {} },
                    collapse_styling_button: { style: {} },
                    file_name_span: { textContent: '' },
                    individual_filter: { value: '' },
                    hue_element: { value: '180' },
                    sat_element: { value: '20' },
                    lum_element: { value: '30' },
                    text_lum_element: { value: '80' },
                    root_name: null,
                    color_picker: { value: '#000000' },
                    save_filename_input: { value: '' },
                    save_modal: { style: {} },
                    style_presets: {},
                    elements: [],
                    filter_timeout: null,
                    update_in_progress: false,
                    update_waiting: false,
                    update_timeout: null,
                },
            }
        );

        await context.updateFamilyTree();

        expect(elements.generations_up_number.value).toBe('1');
        expect(elements.generations_down_number.value).toBe('1');
        expect(elements.max_stack_size_number.value).toBe('1');
    });

    it('05.03 larger stack size produces narrower layout for leaf-heavy children', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I3@', name: 'C1', famc: '@F1@', fams: [], gender: 'M' },
            { id: '@I4@', name: 'C2', famc: '@F1@', fams: [], gender: 'F' },
            { id: '@I5@', name: 'C3', famc: '@F1@', fams: [], gender: 'M' },
            { id: '@I6@', name: 'C4', famc: '@F1@', fams: [], gender: 'F' },
            { id: '@I7@', name: 'C5', famc: '@F1@', fams: [], gender: 'M' },
            { id: '@I8@', name: 'C6', famc: '@F1@', fams: [], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: ['@I3@', '@I4@', '@I5@', '@I6@', '@I7@', '@I8@'] },
        ];

        function layoutWidth(maxStackSize) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(individuals);
            context.window.families = structuredClone(families);
            context.window.max_stack_size = maxStackSize;
            context.window.generations_up = 0;
            context.window.generations_down = 1;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            const rows = context.positionTree(rootNode);
            context.normalizeTreeX(rows);
            context.setHeights(rows);
            context.adjustInnerChildrenSpacingGlobal(rows);
            context.normalizeTreeX(rows);
            return getLayoutWidth(rootNode);
        }

        const widthWithoutStacking = layoutWidth(1);
        const widthWithStacking = layoutWidth(99);

        expect(widthWithStacking).toBeLessThan(widthWithoutStacking);
    });

    it('05.04 toggling vertical in-laws changes spouse placement from side to below', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I3@', name: 'Child', famc: '@F1@', fams: [], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: ['@I3@'] },
        ];

        function spouseY(verticalInlaws) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(individuals);
            context.window.families = structuredClone(families);
            context.window.vertical_inlaws = verticalInlaws;
            context.window.generations_up = 0;
            context.window.generations_down = 1;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            const rows = context.positionTree(rootNode);
            context.normalizeTreeX(rows);
            context.setHeights(rows);
            return {
                rootY: rootNode.y,
                spouseY: rootNode.spouse_nodes[0].y,
            };
        }

        const vertical = spouseY(true);
        const horizontal = spouseY(false);

        expect(vertical.spouseY).toBeGreaterThan(vertical.rootY);
        expect(horizontal.spouseY).toBeLessThanOrEqual(horizontal.rootY);
    });

    it('05.05 hide_childless_inlaws removes childless spouse branches only', () => {
        const parsed = createPipelineContext().parseGedcomData(getIntegrationGedcom());

        function spouseIds(hideChildlessInlaws) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(parsed.individuals);
            context.window.families = structuredClone(parsed.families);
            context.window.hide_childless_inlaws = hideChildlessInlaws;
            context.window.generations_up = 0;
            context.window.generations_down = 1;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            return rootNode.spouse_nodes.map(node => node.individual.id).sort();
        }

        const visibleAll = spouseIds(false);
        const visibleWithoutChildless = spouseIds(true);

        expect(visibleAll).toEqual(['@I2@', '@I4@']);
        expect(visibleWithoutChildless).toEqual(['@I2@']);
    });

    it('05.06 usePresetStyle updates linked UI inputs and requests redraw', () => {
        const dom = new JSDOM(`
            <input id="max-stack-size-number" value="1" />
            <input id="max-stack-size-range" value="1" />
            <input id="show-places-checkbox" type="checkbox" />
            <select id="text-align-select"><option value="top">top</option><option value="middle">middle</option></select>
            <input id="color-picker" value="#000000" />
        `);

        let redrawRequests = 0;
        const context = loadBrowserScripts(['src/js/ui.js'], {
            windowOverrides: {
                max_stack_size: 1,
                show_places: false,
                tree_color: '#000000',
                text_align: 'top',
            },
            globalOverrides: {
                document: dom.window.document,
                d3: {
                    hcl: () => ({})
                },
                style_presets: {
                    'integration-preset': {
                        'max-stack-size': 4,
                        'show-places': true,
                        'background-color': '#112233',
                        'text-align': 'middle',
                    },
                },
                elements: [
                    { id: 'max-stack-size-number', variable: 'max_stack_size' },
                    { id: 'show-places-checkbox', variable: 'show_places' },
                ],
                color_picker: dom.window.document.getElementById('color-picker'),
                updateRangeThumbs: () => {},
                requestFamilyTreeUpdate: () => {
                    redrawRequests += 1;
                },
                optionsMenu: { style: {}, addEventListener: () => {} },
                leftColumnWrapper: { classList: { remove: () => {}, add: () => {}, contains: () => false }, style: {} },
                leftCol: { offsetWidth: 300 },
                rightCol: { offsetWidth: 500 },
                family_tree_div: { querySelector: () => null },
                expand_styling_button: { style: {} },
                collapse_styling_button: { style: {} },
                file_name_span: { textContent: '' },
                individual_filter: { value: '' },
                individual_select: { innerHTML: '' },
                generations_up_number: { value: '1' },
                generations_down_number: { value: '1' },
                max_stack_size_number: dom.window.document.getElementById('max-stack-size-number'),
                hue_element: { value: '180' },
                sat_element: { value: '20' },
                lum_element: { value: '30' },
                text_lum_element: { value: '80' },
                root_name: null,
                save_filename_input: { value: '' },
                save_modal: { style: {} },
                filter_timeout: null,
                update_in_progress: false,
                update_waiting: false,
                update_timeout: null,
            },
        });

        context.updateRangeThumbs = () => {};
        context.requestFamilyTreeUpdate = () => {
            redrawRequests += 1;
        };

        context.usePresetStyle('integration-preset');

        expect(dom.window.document.getElementById('max-stack-size-number').value).toBe('4');
        expect(dom.window.document.getElementById('max-stack-size-range').value).toBe('4');
        expect(dom.window.document.getElementById('show-places-checkbox').checked).toBe(true);
        expect(dom.window.document.getElementById('text-align-select').value).toBe('middle');
        expect(dom.window.document.getElementById('color-picker').value).toBe('#112233');
        expect(context.window.max_stack_size).toBe(4);
        expect(context.window.show_places).toBe(true);
        expect(context.window.tree_color).toBe('#112233');
        expect(context.window.text_align).toBe('middle');
        expect(redrawRequests).toBe(1);
    });

    it('05.07 wide in-law subtree nodes do not cross the ancestor-to-child connector line', () => {
        const parsed = createPipelineContext().parseGedcomData(getWideInlawGedcom());

        [true, false].forEach(verticalInlaws => {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(parsed.individuals);
            context.window.families = structuredClone(parsed.families);
            context.window.vertical_inlaws = verticalInlaws;
            context.window.generations_up = 1;
            context.window.generations_down = 1;
            context.window.suppress_positioning_log = true;

            const root = context.window.individuals.find(ind => ind.id === '@I1@');
            const rootNode = context.buildTree(root);
            const rows = context.positionTree(rootNode);
            context.normalizeTreeX(rows);
            context.setHeights(rows);

            const fatherNode = rootNode.father_node;
            expect(fatherNode, `father_node should exist (vertical_inlaws=${verticalInlaws})`).not.toBeNull();

            // The x coordinate of the vertical connector line from male ancestor couple → pedigree child
            const box_width = context.window.box_width;
            const h_spacing = context.window.h_spacing;
            const connector_x = fatherNode.x + box_width + h_spacing / 2;

            // Collect all nodes in the in-law subtree (in-law spouse + all their descendants)
            const inlawSpouseNodes = fatherNode.spouse_nodes.filter(n => n.type === 'inlaw');
            expect(inlawSpouseNodes.length, `in-law spouse should exist (vertical_inlaws=${verticalInlaws})`).toBeGreaterThan(0);

            const visited = new Set();
            function collectSubtree(node) {
                if (!node || visited.has(node)) return [];
                visited.add(node);
                const result = [node];
                (node.children_nodes || []).forEach(child => result.push(...collectSubtree(child)));
                return result;
            }

            const inlawSubtree = inlawSpouseNodes.flatMap(n => collectSubtree(n));
            // 1 in-law spouse + 5 children
            expect(inlawSubtree.length, `in-law subtree should include spouse and 5 children (vertical_inlaws=${verticalInlaws})`).toBeGreaterThanOrEqual(6);

            // No in-law subtree node should straddle the connector line
            inlawSubtree.forEach(node => {
                if (typeof node.x !== 'number') return;
                const crosses = node.x < connector_x && (node.x + box_width) > connector_x;
                expect(crosses, `[vertical_inlaws=${verticalInlaws}] "${node.individual?.name}" (x=${node.x.toFixed(1)}) crosses connector_x=${connector_x.toFixed(1)}`).toBe(false);
            });
        });
    });

    it('05.08 createFamilyTree runs without network/upload calls (privacy/serverless)', async () => {
        const dom = new JSDOM('<div id="family-tree-div"></div>');
        const context = createPipelineContext({
            dom,
            drawTree: async () => {
                dom.window.document.getElementById('family-tree-div').innerHTML = '<svg></svg>';
            },
        });

        let fetchCalls = 0;
        let xhrCalls = 0;
        let beaconCalls = 0;

        const fakeFetch = async () => {
            fetchCalls += 1;
            return { ok: true };
        };
        function FakeXMLHttpRequest() {
            xhrCalls += 1;
        }
        const fakeNavigator = {
            sendBeacon: () => {
                beaconCalls += 1;
                return true;
            },
        };

        context.fetch = fakeFetch;
        context.window.fetch = fakeFetch;
        context.XMLHttpRequest = FakeXMLHttpRequest;
        context.window.XMLHttpRequest = FakeXMLHttpRequest;
        context.navigator = fakeNavigator;
        context.window.navigator = fakeNavigator;

        const parsed = context.parseGedcomData(getIntegrationGedcom());
        context.window.individuals = parsed.individuals;
        context.window.families = parsed.families;

        const root = parsed.individuals.find(person => person.id === '@I1@');
        await context.createFamilyTree(root);

        expect(fetchCalls).toBe(0);
        expect(xhrCalls).toBe(0);
        expect(beaconCalls).toBe(0);
        expect(dom.window.document.querySelector('#family-tree-div svg')).not.toBeNull();
    });

    it('05.09 siblings are positioned left-to-right in birth-year order with no-year nodes rightmost', () => {
        // Children are listed in deliberate non-birth-year order in the GEDCOM CHIL list:
        //   @I5@ (2000), @I8@ (no year), @I4@ (1985), @I1@ (root, 1990), @I6@ (no year), @I7@ (1995)
        // After sorting, father's children_nodes x positions should be in order: 1985, 1990, 1995, 2000, no-year, no-year
        const gedcom = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME Root /Person/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 1990',
            '1 FAMC @F0@',
            '0 @I2@ INDI',
            '1 NAME Father /Ancestor/',
            '1 SEX M',
            '1 FAMS @F0@',
            '0 @I3@ INDI',
            '1 NAME Mother /Ancestor/',
            '1 SEX F',
            '1 FAMS @F0@',
            '0 @I4@ INDI',
            '1 NAME Sibling /Earliest/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 1985',
            '1 FAMC @F0@',
            '0 @I5@ INDI',
            '1 NAME Sibling /Latest/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 2000',
            '1 FAMC @F0@',
            '0 @I6@ INDI',
            '1 NAME Sibling /NoYearA/',
            '1 SEX F',
            '1 FAMC @F0@',
            '0 @I7@ INDI',
            '1 NAME Sibling /Middle/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 1995',
            '1 FAMC @F0@',
            '0 @I8@ INDI',
            '1 NAME Sibling /NoYearB/',
            '1 SEX F',
            '1 FAMC @F0@',
            '0 @F0@ FAM',
            '1 HUSB @I2@',
            '1 WIFE @I3@',
            '1 CHIL @I5@',
            '1 CHIL @I8@',
            '1 CHIL @I4@',
            '1 CHIL @I1@',
            '1 CHIL @I6@',
            '1 CHIL @I7@',
            '0 TRLR',
        ].join('\n');

        const context = createPipelineContext();
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const parsed = context.parseGedcomData(gedcom);
        context.window.individuals = parsed.individuals;
        context.window.families = parsed.families;

        const root = parsed.individuals.find(ind => ind.id === '@I1@');
        const rootNode = context.buildTree(root);
        const rows = context.positionTree(rootNode);
        context.normalizeTreeX(rows);

        const fatherNode = rootNode.father_node;
        expect(fatherNode, 'father_node should exist').not.toBeNull();

        // Root appears in children_nodes as a relative node alongside its siblings
        const siblings = fatherNode.children_nodes;
        expect(siblings.length).toBe(6);

        // Sort siblings by their x position (left to right)
        const byPosition = siblings.slice().sort((a, b) => a.x - b.x);
        const birthYears = byPosition.map(n => {
            const year = parseInt(n.individual.birth, 10);
            return isNaN(year) ? null : year;
        });

        // Nodes with birth years should all precede nodes without birth years
        const lastYearIndex = birthYears.reduce((last, y, i) => (y !== null ? i : last), -1);
        const firstNullIndex = birthYears.indexOf(null);
        if (firstNullIndex !== -1 && lastYearIndex !== -1) {
            expect(lastYearIndex, 'all nodes with birth years should be left of no-year nodes').toBeLessThan(firstNullIndex);
        }

        // Birth years (where present) should be in ascending order left to right
        const years = birthYears.filter(y => y !== null);
        expect(years, 'birth years should be in ascending order left to right').toEqual([...years].sort((a, b) => a - b));
    });
});
