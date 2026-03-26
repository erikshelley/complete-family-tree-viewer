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

function loadDrawTreeContext() {
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

    dom.window.SVGElement.prototype.getBBox = function() {
        const tspans = Array.from(this.querySelectorAll('tspan'));
        if (tspans.length === 0) return { width: 0, height: 0, x: 0, y: 0 };
        let maxWidth = 0;
        let totalHeight = 0;
        tspans.forEach((tspan) => {
            const fontSize = parseFloat(tspan.getAttribute('font-size') || '12');
            maxWidth = Math.max(maxWidth, (tspan.textContent || '').length * fontSize * 0.55);
            totalHeight += fontSize * 1.2;
        });
        return { width: maxWidth, height: totalHeight, x: 0, y: 0 };
    };

    const context = loadBrowserScript('src/js/draw_tree.js', {
        windowOverrides: {
            box_width: 70,
            box_height: 40,
            box_padding: 2,
            text_align: 'middle',
            text_size: 14,
            default_text_size: 14,
            text_brightness: 80,
            text_shadow: false,
            show_names: true,
            show_years: true,
            show_places: true,
            pedigree_highlight_percent: 125,
            node_saturation: 30,
            node_brightness: 30,
            root_hue: 180,
            generations_down: 0,
            max_gen_up: 1,
            max_gen_down: 1,
            min_text_size: 14,
            max_text_size: 6,
            auto_box_width: 0,
            auto_box_height: 0,
        },
        globalOverrides: {
            document: dom.window.document,
            d3: {
                hcl: () => '#ffffff',
            },
        },
    });

    const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dom.window.document.getElementById('root').appendChild(svg);

    return { context, dom, svgSelection: new SvgSelection(svg) };
}

function getFontSizes(svgElement) {
    return Array.from(svgElement.querySelectorAll('tspan'))
        .map(node => parseFloat(node.getAttribute('font-size')))
        .filter(size => !Number.isNaN(size));
}

describe('draw text minimum font size', () => {
    it('never renders name text below 6px', () => {
        const { context, svgSelection } = loadDrawTreeContext();

        const node = {
            type: 'root',
            individual: {
                name: 'A Very Long Root Name That Should Force Aggressive Shrinking In A Tiny Node',
                birth: '',
                death: '',
                birth_place: '',
                death_place: '',
                is_root: true,
                is_descendant: true,
            },
        };

        context.drawText(svgSelection, node);

        const sizes = getFontSizes(svgSelection.node());
        expect(sizes.length).toBeGreaterThan(0);
        expect(Math.min(...sizes)).toBeGreaterThanOrEqual(6);
    });

    it('never renders names, dates, or places below 6px', () => {
        const { context, svgSelection } = loadDrawTreeContext();

        const node = {
            type: 'relative',
            individual: {
                name: 'Extremely Long Relative Name To Trigger Text Shrinking And Wrapping',
                birth: '1834',
                death: '1912',
                birth_place: 'Very Long Birthplace Name, Some County, Some State, United States of America',
                death_place: 'Very Long Deathplace Name, Another County, Another State, United States of America',
                is_root: false,
                is_descendant: false,
            },
        };

        context.drawText(svgSelection, node);

        const textValues = Array.from(svgSelection.node().querySelectorAll('tspan')).map(node => node.textContent || '');
        expect(textValues.some(text => text.includes('1834') || text.includes('1912'))).toBe(true);
        expect(textValues.some(text => text.startsWith('B:'))).toBe(true);
        expect(textValues.some(text => text.startsWith('D:'))).toBe(true);

        const sizes = getFontSizes(svgSelection.node());
        expect(sizes.length).toBeGreaterThan(0);
        expect(Math.min(...sizes)).toBeGreaterThanOrEqual(6);
    });
});
