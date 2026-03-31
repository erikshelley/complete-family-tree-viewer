import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScript } from './helpers/load-browser-script.js';

class SvgSelection {
    constructor(element) {
        this.element = element;
    }

    append(tagName) {
        const child = this.element.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tagName);
        this.element.appendChild(child);
        return new SvgSelection(child);
    }

    attr(name, value) {
        if (value === undefined) return this.element.getAttribute(name);
        this.element.setAttribute(name, String(value));
        return this;
    }

    style(name, value) {
        if (value === undefined) return this.element.style[name];
        this.element.style[name] = value;
        return this;
    }

    text(value) {
        if (value === undefined) return this.element.textContent;
        this.element.textContent = value;
        return this;
    }

    selectAll() {
        return {
            remove: () => {
                while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
            },
        };
    }

    node() {
        return this.element;
    }
}

function createPathRecorder() {
    const commands = [];
    return {
        moveTo(x, y) {
            commands.push(`M${x},${y}`);
        },
        lineTo(x, y) {
            commands.push(`L${x},${y}`);
        },
        bezierCurveTo(x1, y1, x2, y2, x3, y3) {
            commands.push(`C${x1},${y1},${x2},${y2},${x3},${y3}`);
        },
        toString() {
            return commands.join(' ');
        },
    };
}

function loadDrawTreeContext({ windowOverrides = {}, d3Overrides = {} } = {}) {
    const dom = new JSDOM('<div id="root"></div>');
    const originalCreateElement = dom.window.document.createElement.bind(dom.window.document);

    dom.window.document.createElement = (tagName, ...args) => {
        if (String(tagName).toLowerCase() === 'canvas') {
            const ctx = {
                font: '',
                measureText(text) {
                    const fontMatch = / (\d+)px /.exec(ctx.font || ' 12px ');
                    const fontSize = fontMatch ? parseInt(fontMatch[1], 10) : 12;
                    return { width: String(text || '').length * fontSize * 0.55 };
                },
            };
            return {
                getContext: () => ctx,
            };
        }
        return originalCreateElement(tagName, ...args);
    };

    const d3 = {
        hcl: () => '#ffffff',
        path: () => createPathRecorder(),
        ...d3Overrides,
    };

    const context = loadBrowserScript('src/js/draw_tree.js', {
        windowOverrides: {
            box_width: 80,
            box_height: 40,
            node_rounding: 25,
            link_rounding: 0,
            node_border_width: 2,
            link_width: 2,
            pedigree_highlight_percent: 150,
            border_highlight_percent: 120,
            node_saturation: 30,
            node_brightness: 40,
            root_hue: 180,
            generations_down: 0,
            max_gen_up: 2,
            max_gen_down: 2,
            vertical_inlaws: true,
            text_size: 12,
            default_text_size: 12,
            ...windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            d3,
        },
    });

    return { context, dom };
}

describe('draw tree styling outcomes', () => {
    it('11.07 drawNode applies node rounding and highlight multipliers to fill/border colors', () => {
        const hclCalls = [];
        const { context, dom } = loadDrawTreeContext({
            d3Overrides: {
                hcl: (h, c, l) => {
                    hclCalls.push([h, c, l]);
                    return `hcl(${h},${c},${l})`;
                },
            },
        });

        // Keep this test focused on shape/color attrs instead of text layout.
        context.drawText = () => {};

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgSelection = new SvgSelection(svg);

        const node = {
            type: 'ancestor',
            generation: 0,
            individual: {
                name: 'Ancestor',
                is_root: false,
                is_descendant: false,
            },
        };

        context.drawNode(svgSelection, node);

        const rect = svg.querySelector('rect');
        expect(rect).not.toBeNull();
        // min(box_width, box_height)=40, node_rounding=25% -> rx=10
        expect(rect.getAttribute('rx')).toBe('10');

        // First hcl call in drawNode is fill, second is stroke.
        expect(hclCalls.length).toBeGreaterThanOrEqual(2);
        const fillLuminance = hclCalls[0][2];
        const strokeLuminance = hclCalls[1][2];

        // fill luminance = node_brightness * pedigree_highlight_percent / 100
        expect(fillLuminance).toBeCloseTo(60, 5);
        // stroke luminance = (node_brightness * border_highlight_percent / 100) * pedigree_highlight_percent / 100
        expect(strokeLuminance).toBeCloseTo(72, 5);
    });

    it('11.08 drawLink path changes when link_rounding changes', () => {
        const { context, dom } = loadDrawTreeContext();

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgSelection = new SvgSelection(svg);

        const point1 = { x: 20, y: 20 };
        const point2 = { x: 180, y: 120 };

        context.window.link_rounding = 0;
        context.drawLink(svgSelection, '#fff', point1, point2, null);
        const dNoRounding = svg.querySelectorAll('path')[0].getAttribute('d');

        context.window.link_rounding = 100;
        context.drawLink(svgSelection, '#fff', point1, point2, null);
        const dWithRounding = svg.querySelectorAll('path')[1].getAttribute('d');

        expect(dNoRounding).not.toBe(dWithRounding);
    });

    it('11.09 non-top stacked child links to node above in stack and not directly to parent', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 80,
                box_height: 40,
                sibling_spacing: 20,
                generation_spacing: 30,
                vertical_inlaws: true,
                link_highlight_percent: 100,
                inlaw_link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
            },
        });

        const recordedLinks = [];
        context.drawLink = (_svg, _color, p1, p2, special) => {
            recordedLinks.push({ p1, p2, special });
        };

        const parent = {
            type: 'ancestor',
            generation: 1,
            x: 300,
            y: 100,
            stacked: false,
            stack_top: false,
            spouse_nodes: [],
            children_nodes: [],
            individual: { name: 'Parent', gender: 'M', is_root: false, is_descendant: false },
        };

        const topStackChild = {
            type: 'relative',
            generation: 0,
            x: 360,
            y: 220,
            stacked: true,
            stack_top: true,
            spouse_nodes: [],
            children_nodes: [],
            individual: { name: 'Top Child', is_root: false, is_descendant: false },
        };

        const lowerStackChild = {
            type: 'relative',
            generation: 0,
            x: 360,
            y: 250,
            stacked: true,
            stack_top: false,
            spouse_nodes: [],
            children_nodes: [],
            individual: { name: 'Lower Child', is_root: false, is_descendant: false },
        };

        parent.children_nodes = [topStackChild, lowerStackChild];

        const rows = [
            [
                [parent, topStackChild, lowerStackChild],
            ],
        ];

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgSelection = new SvgSelection(svg);

        context.drawNonBoldLinks(svgSelection, rows);

        const parentConnectorX = parent.x + context.window.box_width + context.window.sibling_spacing / 2;
        const topChildCenterX = topStackChild.x + context.window.box_width / 2;
        const lowerChildCenterX = lowerStackChild.x + context.window.box_width / 2;

        const parentToTop = recordedLinks.find(link =>
            link.p1.x === parentConnectorX &&
            link.p2.x === topChildCenterX &&
            link.p2.y === topStackChild.y
        );
        expect(parentToTop).toBeDefined();

        const parentToLower = recordedLinks.find(link =>
            link.p1.x === parentConnectorX &&
            link.p2.x === lowerChildCenterX &&
            link.p2.y === lowerStackChild.y
        );
        expect(parentToLower).toBeUndefined();

        const stackedToAbove = recordedLinks.find(link =>
            link.p1.x === lowerChildCenterX &&
            link.p1.y === lowerStackChild.y &&
            link.p2.x === lowerChildCenterX &&
            link.p2.y === lowerStackChild.y - context.window.generation_spacing
        );
        expect(stackedToAbove).toBeDefined();
    });

    it('11.10 non-top stacked in-law links to in-law above and not directly to spouse', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 80,
                box_height: 40,
                sibling_spacing: 20,
                generation_spacing: 30,
                vertical_inlaws: true,
                link_highlight_percent: 100,
                inlaw_link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
            },
        });

        const recordedLinks = [];
        context.drawLink = (_svg, _color, p1, p2, special) => {
            recordedLinks.push({ p1, p2, special });
        };

        const spouse = {
            type: 'relative',
            generation: 0,
            x: 300,
            y: 120,
            stacked: false,
            stack_top: false,
            spouse_nodes: [],
            children_nodes: [],
            individual: { name: 'Spouse', gender: 'F', is_root: false, is_descendant: false },
        };

        const topInlaw = {
            type: 'inlaw',
            generation: 0,
            x: 300,
            y: 210,
            stacked: true,
            stack_top: true,
            spouse_nodes: [spouse],
            children_nodes: [],
            individual: { name: 'Top InLaw', gender: 'M', is_root: false, is_descendant: false },
        };

        const lowerInlaw = {
            type: 'inlaw',
            generation: 0,
            x: 300,
            y: 240,
            stacked: true,
            stack_top: false,
            spouse_nodes: [spouse],
            children_nodes: [],
            individual: { name: 'Lower InLaw', gender: 'M', is_root: false, is_descendant: false },
        };

        spouse.spouse_nodes = [topInlaw, lowerInlaw];

        const rows = [
            [
                [spouse, topInlaw, lowerInlaw],
            ],
        ];

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgSelection = new SvgSelection(svg);

        context.drawNonBoldLinks(svgSelection, rows);

        const spouseCenterX = spouse.x + context.window.box_width / 2;
        const spouseBottomY = spouse.y + context.window.box_height;
        const topInlawCenterX = topInlaw.x + context.window.box_width / 2;
        const lowerInlawCenterX = lowerInlaw.x + context.window.box_width / 2;

        const spouseToTopInlaw = recordedLinks.find(link =>
            link.p1.x === spouseCenterX &&
            link.p1.y === spouseBottomY &&
            link.p2.x === topInlawCenterX &&
            link.p2.y === topInlaw.y
        );
        expect(spouseToTopInlaw).toBeDefined();

        const spouseToLowerInlaw = recordedLinks.find(link =>
            link.p1.x === spouseCenterX &&
            link.p1.y === spouseBottomY &&
            link.p2.x === lowerInlawCenterX &&
            link.p2.y === lowerInlaw.y
        );
        expect(spouseToLowerInlaw).toBeUndefined();

        const inlawToAboveInlaw = recordedLinks.find(link =>
            link.p1.x === lowerInlawCenterX &&
            link.p1.y === lowerInlaw.y &&
            link.p2.x === lowerInlawCenterX &&
            link.p2.y === lowerInlaw.y - context.window.generation_spacing
        );
        expect(inlawToAboveInlaw).toBeDefined();
    });

    it('11.11 all in-law spouse/stack links are desaturated (grey)', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 80,
                box_height: 40,
                sibling_spacing: 20,
                generation_spacing: 30,
                vertical_inlaws: true,
                link_highlight_percent: 100,
                inlaw_link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
            },
            d3Overrides: {
                hcl: (h, c, l) => ({ h, c, l }),
            },
        });

        const inlawLinks = [];
        context.drawLink = (_svg, color, p1, p2, special) => {
            if (special && special.includes('inlaw')) {
                inlawLinks.push({ color, p1, p2, special });
            }
        };

        const spouse = {
            type: 'relative',
            generation: 0,
            x: 300,
            y: 120,
            stacked: false,
            stack_top: false,
            spouse_nodes: [],
            children_nodes: [],
            individual: { name: 'Spouse', gender: 'F', is_root: false, is_descendant: false },
        };

        const topInlaw = {
            type: 'inlaw',
            generation: 0,
            x: 300,
            y: 210,
            stacked: true,
            stack_top: true,
            spouse_nodes: [spouse],
            children_nodes: [],
            individual: { name: 'Top InLaw', gender: 'M', is_root: false, is_descendant: false },
        };

        const lowerInlaw = {
            type: 'inlaw',
            generation: 0,
            x: 300,
            y: 240,
            stacked: true,
            stack_top: false,
            spouse_nodes: [spouse],
            children_nodes: [],
            individual: { name: 'Lower InLaw', gender: 'M', is_root: false, is_descendant: false },
        };

        spouse.spouse_nodes = [topInlaw, lowerInlaw];

        const rows = [
            [
                [spouse, topInlaw, lowerInlaw],
            ],
        ];

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgSelection = new SvgSelection(svg);

        context.drawNonBoldLinks(svgSelection, rows);

        expect(inlawLinks.length).toBeGreaterThanOrEqual(2);
        inlawLinks.forEach(link => {
            expect(link.color && typeof link.color.c === 'number').toBe(true);
            expect(link.color.c).toBe(0);
        });
    });

    it('11.13 drawText wraps long names into multiple lines when years are shown and places are hidden', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 72,
                box_height: 56,
                box_padding: 2,
                text_size: 12,
                default_text_size: 12,
                show_names: true,
                show_years: true,
                show_places: false,
                text_shadow: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function() {
            return { width: 60, height: 34 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const groupSelection = new SvgSelection(svg).append('g');

        const node = {
            type: 'relative',
            generation: 0,
            individual: {
                name: 'Alexandria Catherine Montgomery Smythe',
                birth: '1900',
                death: '1980',
                birth_place: '',
                death_place: '',
                is_root: false,
                is_descendant: false,
            },
        };

        context.drawText(groupSelection, node);

        const tspans = Array.from(svg.querySelectorAll('tspan'));
        expect(tspans.length).toBeGreaterThan(1);

        const secondaryStartIndex = tspans.findIndex(t => t.getAttribute('dy') === '1.7em');
        expect(secondaryStartIndex).toBeGreaterThan(1);
        expect(tspans[secondaryStartIndex].textContent).toBe('1900-1980');
    });

    it('11.16 drawText wraps a long multi-part name before years when places are hidden', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 78,
                box_height: 48,
                box_padding: 2,
                text_size: 12,
                default_text_size: 12,
                show_names: true,
                show_years: true,
                show_places: false,
                text_shadow: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function() {
            return { width: 64, height: 34 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const groupSelection = new SvgSelection(svg).append('g');

        const node = {
            type: 'relative',
            generation: 0,
            individual: {
                name: 'Alexandria Wilhelmina Louisa Montgomery Bancroft',
                birth: '1900',
                death: '1980',
                birth_place: '',
                death_place: '',
                is_root: false,
                is_descendant: false,
            },
        };

        context.drawText(groupSelection, node);

        const tspans = Array.from(svg.querySelectorAll('tspan'));
        expect(tspans.length).toBeGreaterThan(1);

        const secondaryStartIndex = tspans.findIndex(t => t.getAttribute('dy') === '1.7em');
        expect(secondaryStartIndex).toBeGreaterThan(1);
        expect(tspans[secondaryStartIndex].textContent).toBe('1900-1980');
    });

    it('11.17 drawText uses a shared SVG filter for text shadows', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                text_shadow: true,
                show_names: true,
                show_years: false,
                show_places: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function() {
            return { width: 40, height: 16 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgSelection = new SvgSelection(svg);

        const firstNode = {
            type: 'relative',
            generation: 0,
            individual: {
                name: 'First Person',
                is_root: false,
                is_descendant: false,
            },
        };

        const secondNode = {
            type: 'relative',
            generation: 0,
            individual: {
                name: 'Second Person',
                is_root: false,
                is_descendant: false,
            },
        };

        context.drawText(svgSelection.append('g'), firstNode);
        context.drawText(svgSelection.append('g'), secondNode);

        const textNodes = svg.querySelectorAll('text');
        expect(textNodes).toHaveLength(2);
        expect(textNodes[0].getAttribute('filter')).toBe('url(#tree-text-shadow-filter)');
        expect(textNodes[1].getAttribute('filter')).toBe('url(#tree-text-shadow-filter)');

        const filters = svg.querySelectorAll('defs filter#tree-text-shadow-filter');
        expect(filters).toHaveLength(1);

        const dropShadow = filters[0].querySelector('feDropShadow');
        expect(dropShadow).not.toBeNull();
        expect(dropShadow.getAttribute('dx')).toBe('1');
        expect(dropShadow.getAttribute('dy')).toBe('1');
        expect(dropShadow.getAttribute('stdDeviation')).toBe('1');
    });

    it('05.19 drawCircles places a circle at the midpoint between a male and female ancestor', () => {
        const circlesCaptured = [];
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 80,
                box_height: 40,
                sibling_spacing: 24,
                vertical_inlaws: false,
                link_width: 2,
                node_saturation: 20,
                node_brightness: 30,
                root_hue: 180,
                link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
            },
        });

        context.drawCircle = (_svg, _color, center, _radius) => {
            circlesCaptured.push({ x: center.x, y: center.y });
        };

        // root_node is referenced by getNodeHCL when pedigree_child_node is null
        context.window.root_node = { generation: 1, type: 'relative', individual: { is_root: true, is_descendant: false } };

        const child = {
            type: 'relative',
            generation: 1,
            x: 240, y: 120,
            stacked: false, stack_top: false,
            spouse_nodes: [], children_nodes: [],
            individual: { name: 'Child', gender: 'M', is_root: true, is_descendant: false },
        };

        const father = {
            type: 'ancestor',
            generation: 2,
            x: 160, y: 0,
            stacked: false, stack_top: false,
            children_nodes: [child],
            spouse_nodes: [],
            individual: { name: 'Father', gender: 'M', is_root: false, is_descendant: false, pedigree_child_node: null },
        };

        const mother = {
            type: 'ancestor',
            generation: 2,
            x: 264, y: 0,
            stacked: false, stack_top: false,
            children_nodes: [],
            spouse_nodes: [father],
            individual: { name: 'Mother', gender: 'F', is_root: false, is_descendant: false },
        };

        father.spouse_nodes = [mother];

        const rows = [[[ father, mother, child ]]];
        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        context.drawCircles(new SvgSelection(svg), rows);

        // Circle should be at x = father.x + box_width + sibling_spacing/2
        const expectedX = father.x + context.window.box_width + context.window.sibling_spacing / 2;
        const expectedY = father.y + context.window.box_height / 2;
        const ancestorCircle = circlesCaptured.find(c => c.x === expectedX && c.y === expectedY);
        expect(ancestorCircle, 'circle should exist between ancestor pair').toBeDefined();
    });

    it('12.01 drawText renders the name but no dates or places when show_years and show_places are both false', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                show_names: true,
                show_years: false,
                show_places: false,
                text_shadow: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 60, height: 20 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'relative', generation: 0,
            individual: {
                name: 'Root Person', birth: '1980', death: '2024',
                birth_place: 'Oslo', death_place: 'Bergen',
                is_root: false, is_descendant: false,
            },
        });

        const allText = Array.from(svg.querySelectorAll('tspan')).map(t => t.textContent).join(' ');
        expect(allText).toMatch(/Root|Person/);
        expect(allText).not.toContain('1980');
        expect(allText).not.toContain('2024');
        expect(allText).not.toContain('Oslo');
        expect(allText).not.toContain('Bergen');
    });

    it('12.02 drawText renders the name and dates but no places when show_places is false', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                show_names: true,
                show_years: true,
                show_places: false,
                text_shadow: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 60, height: 30 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'relative', generation: 0,
            individual: {
                name: 'Root Person', birth: '1980', death: '2024',
                birth_place: 'Oslo', death_place: 'Bergen',
                is_root: false, is_descendant: false,
            },
        });

        const tspanTexts = Array.from(svg.querySelectorAll('tspan')).map(t => t.textContent);
        const allText = tspanTexts.join(' ');
        expect(allText).toMatch(/Root|Person/);
        expect(tspanTexts.some(t => t.includes('1980') && t.includes('2024'))).toBe(true);
        expect(allText).not.toContain('Oslo');
        expect(allText).not.toContain('Bergen');
        expect(allText).not.toContain('B:');
        expect(allText).not.toContain('D:');
    });

    it('12.03 drawText renders the name and places but no year-only line when show_years is false', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                show_names: true,
                show_years: false,
                show_places: true,
                text_shadow: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 70, height: 40 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'relative', generation: 0,
            individual: {
                name: 'Root Person', birth: '1980', death: '2024',
                birth_place: 'Oslo', death_place: 'Bergen',
                is_root: false, is_descendant: false,
            },
        });

        const tspanTexts = Array.from(svg.querySelectorAll('tspan')).map(t => t.textContent);
        const allText = tspanTexts.join(' ');
        expect(allText).toMatch(/Root|Person/);
        expect(tspanTexts.some(t => t.includes('Oslo'))).toBe(true);
        expect(tspanTexts.some(t => t.includes('Bergen'))).toBe(true);
        // No standalone year line (no "1980-2024"), years only appear embedded in place lines when show_years=false
        expect(tspanTexts.some(t => t === '1980-2024')).toBe(false);
    });

    it('12.04 drawText renders the name and dates and places when all show flags are true', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                show_names: true,
                show_years: true,
                show_places: true,
                text_shadow: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 70, height: 50 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'relative', generation: 0,
            individual: {
                name: 'Root Person', birth: '1980', death: '2024',
                birth_place: 'Oslo', death_place: 'Bergen',
                is_root: false, is_descendant: false,
            },
        });

        const tspanTexts = Array.from(svg.querySelectorAll('tspan')).map(t => t.textContent);
        const allText = tspanTexts.join(' ');
        expect(allText).toMatch(/Root|Person/);
        expect(tspanTexts.some(t => t.includes('Oslo') && t.includes('1980'))).toBe(true);
        expect(tspanTexts.some(t => t.includes('Bergen') && t.includes('2024'))).toBe(true);
    });

    it('12.05 drawText renders the name and dates but no places when show_places is false (variant)', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                show_names: true,
                show_years: true,
                show_places: false,
                text_shadow: false,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 60, height: 30 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'relative', generation: 0,
            individual: {
                name: 'Root Person', birth: '1960', death: '2010',
                birth_place: 'Paris', death_place: 'Lyon',
                is_root: false, is_descendant: false,
            },
        });

        const tspanTexts = Array.from(svg.querySelectorAll('tspan')).map(t => t.textContent);
        const allText = tspanTexts.join(' ');
        expect(allText).toMatch(/Root|Person/);
        expect(tspanTexts.some(t => t.includes('1960') && t.includes('2010'))).toBe(true);
        expect(allText).not.toContain('Paris');
        expect(allText).not.toContain('Lyon');
    });

    it('13.01 nodes at the root-sibling generation have hue equal to root_hue', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
                generations_down: 1,
                max_gen_up: 1,
                max_gen_down: 1,
            },
        });

        // hue = ((generation - generations_down) * hue_spacing + root_hue + 360) % 360
        // for generation=1, generations_down=1 → (0) * hue_spacing + 180 = 180
        const siblingNode = { generation: 1, type: 'relative' };
        const [hue] = context.getNodeHCL(siblingNode);
        expect(hue).toBe(180);
    });

    it('13.02 non-in-law nodes have chroma equal to node_saturation', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
            },
        });

        for (const type of ['relative', 'root', 'ancestor']) {
            const node = { generation: 1, type };
            const [, chroma] = context.getNodeHCL(node);
            expect(chroma).toBe(20);
        }
    });

    it('13.03 in-law nodes have chroma 0 regardless of node_saturation', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
            },
        });

        const inlawNode = { generation: 1, type: 'inlaw' };
        const [, chroma] = context.getNodeHCL(inlawNode);
        expect(chroma).toBe(0);
    });

    it('13.04 links drawn between a relative and their in-law spouse have no saturation', () => {
        const inlawLinks = [];
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
                vertical_inlaws: true,
                link_highlight_percent: 100,
                inlaw_link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
            },
            d3Overrides: {
                hcl: (h, c, l) => ({ h, c, l }),
            },
        });

        context.drawLink = (_svg, color, _p1, _p2, special) => {
            if (special && special.includes('inlaw')) inlawLinks.push(color);
        };

        const relative = {
            type: 'relative', generation: 1, x: 200, y: 100,
            stacked: false, stack_top: false,
            spouse_nodes: [], children_nodes: [],
            individual: { name: 'Relative', gender: 'F', is_root: false, is_descendant: false },
        };
        const inlaw = {
            type: 'inlaw', generation: 1, x: 200, y: 200,
            stacked: true, stack_top: true,
            spouse_nodes: [relative], children_nodes: [],
            individual: { name: 'Inlaw', gender: 'M', is_root: false, is_descendant: false },
        };
        relative.spouse_nodes = [inlaw];

        const rows = [[[ relative, inlaw ]]];
        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawNonBoldLinks(new SvgSelection(svg), rows);

        expect(inlawLinks.length).toBeGreaterThanOrEqual(1);
        inlawLinks.forEach(color => {
            expect(color.c).toBe(0);
        });
    });

    it('13.05 links drawn from an ancestor to non-in-law children have saturation equal to node_saturation', () => {
        const childLinks = [];
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
                vertical_inlaws: true,
                link_highlight_percent: 100,
                inlaw_link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
            },
            d3Overrides: {
                hcl: (h, c, l) => ({ h, c, l }),
            },
        });

        context.drawLink = (_svg, color, _p1, _p2, special) => {
            if (!special || !special.includes('inlaw')) childLinks.push(color);
        };

        const child = {
            type: 'relative', generation: 0, x: 200, y: 200,
            stacked: false, stack_top: false,
            spouse_nodes: [], children_nodes: [],
            individual: { name: 'Child', gender: 'M', is_root: false, is_descendant: false },
        };
        const father = {
            type: 'ancestor', generation: 1, x: 200, y: 100,
            stacked: false, stack_top: false,
            children_nodes: [child], spouse_nodes: [],
            individual: {
                name: 'Father', gender: 'M', is_root: false, is_descendant: false,
                pedigree_child_node: null, duplicate_pedigree_child_node: null,
            },
        };

        const rows = [[[ father, child ]]];
        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawNonBoldLinks(new SvgSelection(svg), rows);

        expect(childLinks.length).toBeGreaterThanOrEqual(1);
        childLinks.forEach(color => {
            expect(color.c).toBe(20);
        });
    });

    it('13.06 nieces and nephews have a hue 60 less than the root-sibling generation hue', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
                generations_down: 1,
                max_gen_up: 1,
                max_gen_down: 1,
            },
        });

        // hue = (generation - generations_down) * 60 + root_hue
        // sibling generation=1: hue = (1-1)*60+180 = 180
        // nieces/nephews generation=0: hue = (0-1)*60+180 = 120
        const siblingNode = { generation: 1, type: 'relative' };
        const niecesNode = { generation: 0, type: 'relative' };
        const [siblingHue] = context.getNodeHCL(siblingNode);
        const [niecesHue] = context.getNodeHCL(niecesNode);
        expect(siblingHue - niecesHue).toBe(60);
    });

    it('13.07 step-siblings have the same hue as the root-sibling generation', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
                generations_down: 1,
                max_gen_up: 1,
                max_gen_down: 1,
            },
        });

        // Both siblings and step-siblings sit at generation=1
        const siblingNode = { generation: 1, type: 'relative' };
        const stepSiblingNode = { generation: 1, type: 'relative' };
        const [siblingHue] = context.getNodeHCL(siblingNode);
        const [stepSiblingHue] = context.getNodeHCL(stepSiblingNode);
        expect(stepSiblingHue).toBe(siblingHue);
    });

    it('13.08 parents have a hue 60 more than the root-sibling generation hue', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
                generations_down: 1,
                max_gen_up: 1,
                max_gen_down: 1,
            },
        });

        // sibling generation=1: hue = 180
        // parent generation=2: hue = (2-1)*60+180 = 240
        const siblingNode = { generation: 1, type: 'relative' };
        const parentNode = { generation: 2, type: 'ancestor' };
        const [siblingHue] = context.getNodeHCL(siblingNode);
        const [parentHue] = context.getNodeHCL(parentNode);
        expect(parentHue - siblingHue).toBe(60);
    });

    it('13.10 nieces and nephews hue wraps to 300 when root_hue is 0 (no negative hues)', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 0,
                node_saturation: 20,
                node_brightness: 30,
                generations_down: 1,
                max_gen_up: 1,
                max_gen_down: 1,
            },
        });

        // sibling generation=1: hue = (1-1)*60 + 0 = 0
        // nieces/nephews generation=0: hue = (0-1)*60 + 0 + 360) % 360 = 300
        const niecesNode = { generation: 0, type: 'relative' };
        const [niecesHue] = context.getNodeHCL(niecesNode);
        expect(niecesHue).toBe(300);
    });

    it('13.11 parents hue wraps to 0 when root_hue is 300 (no hues >= 360)', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 300,
                node_saturation: 20,
                node_brightness: 30,
                generations_down: 1,
                max_gen_up: 1,
                max_gen_down: 1,
            },
        });

        // sibling generation=1: hue = (1-1)*60 + 300 = 300
        // parent generation=2: hue = ((2-1)*60 + 300 + 360) % 360 = 720 % 360 = 0
        const parentNode = { generation: 2, type: 'ancestor' };
        const [parentHue] = context.getNodeHCL(parentNode);
        expect(parentHue).toBe(0);
    });

    it('13.12 drawNode with highlight_type none applies no pedigree factor to any node', () => {
        const hclCalls = [];
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                highlight_type: 'none',
                pedigree_highlight_percent: 150,
                border_highlight_percent: 120,
                node_brightness: 40,
            },
            d3Overrides: {
                hcl: (h, c, l) => { hclCalls.push([h, c, l]); return `hcl(${h},${c},${l})`; },
            },
        });
        context.drawText = () => {};

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgSelection = new SvgSelection(svg);
        const node = {
            type: 'ancestor', generation: 0,
            individual: { name: 'Ancestor', is_root: false, is_descendant: false },
        };

        context.drawNode(svgSelection, node);

        // Neither fill nor stroke should have the pedigree factor applied
        expect(hclCalls[0][2]).toBeCloseTo(40, 5);   // fill: node_brightness unchanged
        expect(hclCalls[1][2]).toBeCloseTo(48, 5);   // stroke: 40 * 120/100 = 48, unchanged
    });

    it('13.13 drawNode with highlight_type root applies pedigree factor only to the root node', () => {
        const hclCallsRoot = [];
        const hclCallsAnc = [];

        const makeContext = (calls) => {
            const { context, dom } = loadDrawTreeContext({
                windowOverrides: {
                    highlight_type: 'root',
                    pedigree_highlight_percent: 150,
                    border_highlight_percent: 120,
                    node_brightness: 40,
                },
                d3Overrides: {
                    hcl: (h, c, l) => { calls.push([h, c, l]); return `hcl(${h},${c},${l})`; },
                },
            });
            context.drawText = () => {};
            return { context, dom };
        };

        // Root node should be highlighted
        const { context: ctxRoot, dom: domRoot } = makeContext(hclCallsRoot);
        ctxRoot.drawNode(
            new SvgSelection(domRoot.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
            { type: 'relative', generation: 0, individual: { name: 'Root', is_root: true, is_descendant: false } }
        );
        expect(hclCallsRoot[0][2]).toBeCloseTo(60, 5);  // 40 * 150/100 = 60
        expect(hclCallsRoot[1][2]).toBeCloseTo(72, 5);  // 48 * 150/100 = 72

        // Ancestor node should NOT be highlighted
        const { context: ctxAnc, dom: domAnc } = makeContext(hclCallsAnc);
        ctxAnc.drawNode(
            new SvgSelection(domAnc.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
            { type: 'ancestor', generation: 0, individual: { name: 'Ancestor', is_root: false, is_descendant: false } }
        );
        expect(hclCallsAnc[0][2]).toBeCloseTo(40, 5);  // no pedigree factor
        expect(hclCallsAnc[1][2]).toBeCloseTo(48, 5);  // no pedigree factor
    });

    it('13.14 findConnectionPath returns IDs of all nodes on the path from root to target', () => {
        const context = loadDrawTreeContext().context;

        const grandpa_ind = { id: '@I3@', name: 'Grandpa' };
        const father_ind  = { id: '@I2@', name: 'Father' };
        const root_ind    = { id: '@I1@', name: 'Root', is_root: true };
        const uncle_ind   = { id: '@I4@', name: 'Uncle' };

        const grandpa_node = { individual: grandpa_ind, father_node: null, mother_node: null, pedigree_spouse_node: null, spouse_nodes: [], children_nodes: [], parent_node: null };
        const father_node  = { individual: father_ind,  father_node: grandpa_node, mother_node: null, pedigree_spouse_node: null, spouse_nodes: [], children_nodes: [], parent_node: null };
        const root_node    = { individual: root_ind,    father_node: father_node, mother_node: null, pedigree_spouse_node: null, spouse_nodes: [], children_nodes: [], parent_node: null };
        // Uncle is a sibling – child of grandpa, not on the root→grandpa path
        const uncle_node   = { individual: uncle_ind,   father_node: null, mother_node: null, pedigree_spouse_node: null, spouse_nodes: [], children_nodes: [], parent_node: grandpa_node };
        grandpa_node.children_nodes.push(uncle_node);

        context.window.root_node = root_node;
        context.window.connection_path_ids = new Set();

        // Path to grandpa should include root, father, grandpa, AND grandpa's pedigree spouse
        // (pedigree_spouse_node is null on all nodes in this test, so no spouse expansion)
        const path = context.findConnectionPath('@I3@');
        expect(path.has('@I1@')).toBe(true);
        expect(path.has('@I2@')).toBe(true);
        expect(path.has('@I3@')).toBe(true);
        expect(path.size).toBe(3);

        // Path to uncle: root → father → grandpa → uncle
        const uncle_path = context.findConnectionPath('@I4@');
        expect(uncle_path.has('@I1@')).toBe(true);
        expect(uncle_path.has('@I4@')).toBe(true);
        expect(uncle_path.size).toBe(4);

        // Unknown ID returns empty set
        expect(context.findConnectionPath('@IX@').size).toBe(0);

        // Pedigree spouse expansion: if father has a pedigree_spouse_node (mother), she is added
        const mother_ind = { id: '@I6@', name: 'Grandma' };
        const mother_node = { individual: mother_ind, father_node: null, mother_node: null, pedigree_spouse_node: null, spouse_nodes: [], children_nodes: [], parent_node: null };
        grandpa_node.pedigree_spouse_node = mother_node;
        const path_with_spouse = context.findConnectionPath('@I3@');
        expect(path_with_spouse.has('@I6@')).toBe(true);
        expect(path_with_spouse.size).toBe(4);  // root, father, grandpa, grandma
    });

    it('13.15 drawNode with highlight_type connection brightens on-path nodes and leaves off-path nodes unchanged', () => {
        const hclOnPath  = [];
        const hclOffPath = [];

        const makeCtx = (calls, id, path_ids) => {
            const { context, dom } = loadDrawTreeContext({
                windowOverrides: {
                    highlight_type: 'connection',
                    connection_path_ids: path_ids,
                    pedigree_highlight_percent: 150,
                    border_highlight_percent: 120,
                    node_brightness: 40,
                },
                d3Overrides: {
                    hcl: (h, c, l) => { calls.push([h, c, l]); return `hcl(${h},${c},${l})`; },
                },
            });
            context.drawText = () => {};
            return { context, dom };
        };

        const path_ids = new Set(['@I2@']);

        // On-path node should be highlighted
        const { context: ctxOn, dom: domOn } = makeCtx(hclOnPath, '@I2@', path_ids);
        ctxOn.drawNode(
            new SvgSelection(domOn.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
            { type: 'ancestor', generation: 1, individual: { id: '@I2@', name: 'Father', is_root: false, is_descendant: false } }
        );
        expect(hclOnPath[0][2]).toBeCloseTo(60, 5);   // 40 * 150/100 = 60

        // Off-path node should not be highlighted
        const { context: ctxOff, dom: domOff } = makeCtx(hclOffPath, '@I5@', path_ids);
        ctxOff.drawNode(
            new SvgSelection(domOff.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
            { type: 'ancestor', generation: 2, individual: { id: '@I5@', name: 'Uncle', is_root: false, is_descendant: false } }
        );
        expect(hclOffPath[0][2]).toBeCloseTo(40, 5);  // no highlight
    });

    it('13.16 getLinkHighlightFactor with linked_node requires both endpoints on path in connection mode', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                highlight_type: 'connection',
                connection_path_ids: new Set(['@I1@', '@I2@']),
                pedigree_highlight_percent: 150,
            },
        });

        const on_path  = { individual: { id: '@I1@' } };
        const on_path2 = { individual: { id: '@I2@' } };
        const off_path = { individual: { id: '@I3@' } };

        // Both on path → highlight
        expect(context.getLinkHighlightFactor(on_path, on_path2)).toBeCloseTo(1.5, 5);
        // One endpoint off path → no highlight
        expect(context.getLinkHighlightFactor(on_path, off_path)).toBe(1);
        expect(context.getLinkHighlightFactor(off_path, on_path)).toBe(1);
        // No linked_node → falls back to single-node check
        expect(context.getLinkHighlightFactor(on_path)).toBeCloseTo(1.5, 5);
        expect(context.getLinkHighlightFactor(off_path)).toBe(1);
    });

    it('13.17 getLinkHighlightFactor with linked_node is ignored for pedigree and none modes', () => {
        const make = (ht) => loadDrawTreeContext({
            windowOverrides: { highlight_type: ht, connection_path_ids: new Set(['@I1@']), pedigree_highlight_percent: 150 },
        }).context;

        const node_a = { individual: { id: '@I1@', is_root: true, is_descendant: false } };
        const node_b = { individual: { id: '@I2@', is_root: false, is_descendant: false } };

        // pedigree mode: linked_node ignored, result based solely on node_a
        const ctx_ped = make('pedigree');
        expect(ctx_ped.getLinkHighlightFactor(node_a, node_b)).toBeCloseTo(1.5, 5);

        // none mode: always 1 regardless of linked_node
        const ctx_none = make('none');
        expect(ctx_none.getLinkHighlightFactor(node_a, node_b)).toBe(1);
    });

    it('11.18 auto_box_width equals text width at desired font size plus padding when name fits without shrinking', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 100,
                box_height: 50,
                box_padding: 5,
                text_size: 12,
                default_text_size: 12,
                show_names: true,
                show_years: false,
                show_places: false,
                text_shadow: false,
                auto_box_width: 0,
                auto_box_height: 0,
                min_text_size: 12,
                max_text_size: 6,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 30, height: 14, x: 0, y: 0 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'relative', generation: 0,
            individual: {
                name: 'Alice',
                birth: '', death: '', birth_place: '', death_place: '',
                is_root: false, is_descendant: false,
            },
        });

        // "Alice" (5 chars) at 12px = 5 * 12 * 0.55 = 33, + 2 * padding(5) = 43
        expect(context.window.auto_box_width).toBeCloseTo(43, 1);
        expect(context.window.auto_box_width).toBeLessThan(context.window.box_width);
    });

    it('11.19 auto_box_width exceeds box_width when dates are wider than the box at the preferred secondary font size', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 40,
                box_height: 30,
                box_padding: 0,
                text_size: 12,
                default_text_size: 12,
                show_names: true,
                show_years: true,
                show_places: false,
                text_shadow: false,
                auto_box_width: 0,
                auto_box_height: 0,
                min_text_size: 12,
                max_text_size: 6,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 35, height: 25, x: 0, y: 0 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'relative', generation: 0,
            individual: {
                name: 'Short',
                birth: '1900', death: '1980', birth_place: '', death_place: '',
                is_root: false, is_descendant: false,
            },
        });

        // "1900-1980" (9 chars) at preferred secondary size 9px = 9 * 9 * 0.55 = 44.55 > box_width 40
        // The secondary font is shrunk to 8px to fit, but auto_box_width is measured at the preferred 9px,
        // so it reflects the width needed to avoid any font size reduction
        expect(context.window.auto_box_width).toBeGreaterThan(context.window.box_width);
        expect(context.window.auto_box_width).toBeCloseTo(44.55, 1);
    });

    it('11.20 auto_box_width accumulates the maximum across multiple drawText calls', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 200,
                box_height: 200,
                box_padding: 0,
                text_size: 12,
                default_text_size: 12,
                show_names: true,
                show_years: false,
                show_places: false,
                text_shadow: false,
                auto_box_width: 0,
                auto_box_height: 0,
                min_text_size: 12,
                max_text_size: 6,
            },
        });

        dom.window.SVGElement.prototype.getBBox = function () {
            return { width: 50, height: 14, x: 0, y: 0 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        function makeNode(name) {
            return {
                type: 'relative', generation: 0,
                individual: { name, birth: '', death: '', birth_place: '', death_place: '', is_root: false, is_descendant: false },
            };
        }

        context.drawText(new SvgSelection(svg).append('g'), makeNode('Alice'));
        // "Alice" (5 chars) at 12px = 5 * 12 * 0.55 = 33
        const afterShort = context.window.auto_box_width;
        expect(afterShort).toBeCloseTo(33, 1);

        context.drawText(new SvgSelection(svg).append('g'), makeNode('AlexandraWilhelmina'));
        // "AlexandraWilhelmina" (19 chars) at 12px = 19 * 12 * 0.55 = 125.4
        const afterLong = context.window.auto_box_width;
        expect(afterLong).toBeCloseTo(125.4, 1);
        expect(afterLong).toBeGreaterThan(afterShort);

        context.drawText(new SvgSelection(svg).append('g'), makeNode('Al'));
        // "Al" (2 chars) is narrower — auto_box_width stays at the prior maximum
        expect(context.window.auto_box_width).toBeCloseTo(125.4, 1);
    });

    it('13.09 links drawn to in-law spouses have stroke-dasharray equal to link_width,link_width', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                root_hue: 180,
                node_saturation: 20,
                node_brightness: 30,
                vertical_inlaws: true,
                link_highlight_percent: 100,
                inlaw_link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
            },
            d3Overrides: {
                hcl: (h, c, l) => `hcl(${h},${c},${l})`,
            },
        });

        const relative = {
            type: 'relative', generation: 1, x: 200, y: 100,
            stacked: false, stack_top: false,
            spouse_nodes: [], children_nodes: [],
            individual: { name: 'Relative', gender: 'F', is_root: false, is_descendant: false },
        };
        const inlaw = {
            type: 'inlaw', generation: 1, x: 200, y: 200,
            stacked: true, stack_top: true,
            spouse_nodes: [relative], children_nodes: [],
            individual: { name: 'Inlaw', gender: 'M', is_root: false, is_descendant: false },
        };
        relative.spouse_nodes = [inlaw];

        const rows = [[[ relative, inlaw ]]];
        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawNonBoldLinks(new SvgSelection(svg), rows);

        const paths = Array.from(svg.querySelectorAll('path'));
        const dashedPaths = paths.filter(p => {
            const dash = p.getAttribute('stroke-dasharray');
            return dash !== null && dash !== 'none';
        });

        const linkWidth = context.window.link_width;
        expect(dashedPaths.length).toBeGreaterThanOrEqual(1);
        dashedPaths.forEach(p => {
            expect(p.getAttribute('stroke-dasharray')).toBe(`${linkWidth},${linkWidth}`);
        });
    });

    it('13.18 promoteConnectionNodesInStacks swaps a non-top stacked node to stack_top when it is on the connection path', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: {
                highlight_type: 'connection',
            },
        });

        const top_ind  = { id: '@I1@', name: 'Top' };
        const lower_ind = { id: '@I2@', name: 'Lower' };

        const top_node = {
            type: 'relative', generation: 0,
            x: 100, y: 200,
            stacked: true, stack_top: true,
            individual: top_ind, spouse_nodes: [], children_nodes: [],
        };
        const lower_node = {
            type: 'relative', generation: 0,
            x: 100, y: 230,
            stacked: true, stack_top: false,
            individual: lower_ind, spouse_nodes: [], children_nodes: [],
        };

        // lower_node is on the connection path; top_node is not
        context.window.connection_path_ids = new Set(['@I2@']);
        const rows = [[ [top_node, lower_node] ]];

        context.promoteConnectionNodesInStacks(rows);

        // After promotion: lower_node should be stack_top at y=200; top_node at y=230
        expect(lower_node.stack_top).toBe(true);
        expect(lower_node.y).toBe(200);
        expect(top_node.stack_top).toBe(false);
        expect(top_node.y).toBe(230);
    });

    it('13.19 promoteConnectionNodesInStacks leaves the stack unchanged when the stack_top is already on the connection path', () => {
        const { context } = loadDrawTreeContext({
            windowOverrides: { highlight_type: 'connection' },
        });

        const top_ind   = { id: '@I1@', name: 'Top' };
        const lower_ind = { id: '@I2@', name: 'Lower' };

        const top_node = {
            type: 'relative', generation: 0,
            x: 100, y: 200,
            stacked: true, stack_top: true,
            individual: top_ind, spouse_nodes: [], children_nodes: [],
        };
        const lower_node = {
            type: 'relative', generation: 0,
            x: 100, y: 230,
            stacked: true, stack_top: false,
            individual: lower_ind, spouse_nodes: [], children_nodes: [],
        };

        // top_node is already on the connection path — no swap needed
        context.window.connection_path_ids = new Set(['@I1@']);
        context.promoteConnectionNodesInStacks([[ [top_node, lower_node] ]]);

        expect(top_node.stack_top).toBe(true);
        expect(top_node.y).toBe(200);
        expect(lower_node.stack_top).toBe(false);
        expect(lower_node.y).toBe(230);
    });

    it('13.20 promoteConnectionNodesInStacks does nothing when connection_path_ids is empty', () => {
        const { context } = loadDrawTreeContext();

        const top_node   = { type: 'relative', generation: 0, x: 100, y: 200, stacked: true, stack_top: true,  individual: { id: '@I1@' }, spouse_nodes: [], children_nodes: [] };
        const lower_node = { type: 'relative', generation: 0, x: 100, y: 230, stacked: true, stack_top: false, individual: { id: '@I2@' }, spouse_nodes: [], children_nodes: [] };

        context.window.connection_path_ids = new Set();
        context.promoteConnectionNodesInStacks([[ [top_node, lower_node] ]]);

        expect(top_node.stack_top).toBe(true);
        expect(top_node.y).toBe(200);
    });

    it('13.21 drawLink uses link_width as stroke-width when factor is 1', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: { link_width: 4, highlighted_link_width: 8, generation_spacing: 50 },
        });

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawLink(new SvgSelection(svg), '#fff', { x: 0, y: 0 }, { x: 50, y: 100 }, null, 1);

        const path = svg.querySelector('path');
        expect(path.getAttribute('stroke-width')).toBe('4');
    });

    it('13.22 drawLink uses highlighted_link_width as stroke-width when factor is not 1', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: { link_width: 4, highlighted_link_width: 8, generation_spacing: 50 },
        });

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawLink(new SvgSelection(svg), '#fff', { x: 0, y: 0 }, { x: 50, y: 100 }, null, 1.5);

        const path = svg.querySelector('path');
        expect(path.getAttribute('stroke-width')).toBe('8');
    });

    it('13.23 drawText uses text_brightness for non-highlighted nodes', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                highlight_type: 'pedigree',
                text_brightness: 50,
                highlighted_text_brightness: 90,
                pedigree_highlight_percent: 150,
            },
            d3Overrides: {
                hcl: (h, c, l) => `hcl(${h},${c},${l})`,
            },
        });

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // inlaw type → isNodeHighlighted returns false in pedigree mode
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'inlaw', generation: 0,
            individual: { name: 'Spouse', birth: '', death: '', birth_place: '', death_place: '', is_root: false, is_descendant: false },
        });

        expect(svg.querySelector('text').getAttribute('fill')).toBe('hcl(0,0,50)');
    });

    it('13.24 drawText uses highlighted_text_brightness for highlighted nodes', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                highlight_type: 'pedigree',
                text_brightness: 50,
                highlighted_text_brightness: 90,
                pedigree_highlight_percent: 150,
            },
            d3Overrides: {
                hcl: (h, c, l) => `hcl(${h},${c},${l})`,
            },
        });

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // ancestor type → isNodeHighlighted returns true in pedigree mode
        context.drawText(new SvgSelection(svg).append('g'), {
            type: 'ancestor', generation: 0,
            individual: { name: 'Parent', birth: '', death: '', birth_place: '', death_place: '', is_root: false, is_descendant: false },
        });

        expect(svg.querySelector('text').getAttribute('fill')).toBe('hcl(0,0,90)');
    });

    it('11.23 drawText uses geometric bbox model so text is never placed at midpoint regardless of getBBox output', () => {
        // Simulates the case where getBBox() returns {x:0, y:0, width:0, height:0} because the SVG
        // is not yet laid out (e.g. after scheduler.yield() in a large async draw loop).
        // The fallback must still position text correctly instead of placing it at mid+padding.
        const BOX_H = 48;
        const BOX_PAD = 4;
        const NAME_FS = 8;

        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 48, box_height: BOX_H, box_padding: BOX_PAD,
                text_size: NAME_FS, default_text_size: NAME_FS,
                text_align: 'top',
                show_names: true, show_years: false, show_places: false,
                text_shadow: false,
                min_text_size: NAME_FS, max_text_size: 6,
                auto_box_width: 0, auto_box_height: 0,
            },
        });

        // Return zero dimensions — exactly what Chrome returns for unrendered SVG elements
        dom.window.SVGElement.prototype.getBBox = function() {
            return { x: 0, y: 0, width: 0, height: 0 };
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        dom.window.document.getElementById('root').appendChild(svg);
        const gSel = new SvgSelection(svg).append('g');

        context.drawText(gSel, {
            type: 'relative', generation: 2,
            individual: { name: 'Alice Smith', birth: '', death: '', birth_place: '', death_place: '', is_root: false, is_descendant: false },
        });

        const textY = parseFloat(svg.querySelector('text').getAttribute('y'));
        // With the fallback, text_y must NOT equal box_height/2 + box_padding (= 28)
        // which is what the broken no-fallback formula would produce.
        // It should be close to box_padding + ascender ≈ 4 + 8*0.72 = 9.76.
        expect(textY).not.toBeCloseTo(BOX_H / 2 + BOX_PAD, 1);
        // And it should be below box_height/2 to confirm it's nearer the top
        expect(textY).toBeLessThan(BOX_H / 2);
    });
});
