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
});
