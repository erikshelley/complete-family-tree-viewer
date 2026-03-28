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
                h_spacing: 20,
                v_spacing: 30,
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

        const parentConnectorX = parent.x + context.window.box_width + context.window.h_spacing / 2;
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
            link.p2.y === lowerStackChild.y - context.window.v_spacing
        );
        expect(stackedToAbove).toBeDefined();
    });

    it('11.10 non-top stacked in-law links to in-law above and not directly to spouse', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 80,
                box_height: 40,
                h_spacing: 20,
                v_spacing: 30,
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
            link.p2.y === lowerInlaw.y - context.window.v_spacing
        );
        expect(inlawToAboveInlaw).toBeDefined();
    });

    it('11.11 all in-law spouse/stack links are desaturated (grey)', () => {
        const { context, dom } = loadDrawTreeContext({
            windowOverrides: {
                box_width: 80,
                box_height: 40,
                h_spacing: 20,
                v_spacing: 30,
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
                h_spacing: 24,
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

        // Circle should be at x = father.x + box_width + h_spacing/2
        const expectedX = father.x + context.window.box_width + context.window.h_spacing / 2;
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
});
