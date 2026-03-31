import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function createD3Harness(document) {
    const zoomCalls = [];
    const handlers = {};

    class Selection {
        constructor(node) {
            this._node = node;
        }

        append(tagName) {
            const ns = this._node.namespaceURI || 'http://www.w3.org/2000/svg';
            const child = this._node.ownerDocument.createElementNS(ns, tagName);
            this._node.appendChild(child);
            return new Selection(child);
        }

        attr(name, value) {
            if (value === undefined) return this._node.getAttribute(name);
            this._node.setAttribute(name, String(value));
            return this;
        }

        call(fn, ...args) {
            if (typeof fn === 'function') fn(this, ...args);
            return this;
        }

        node() {
            return this._node;
        }

        transition() {
            return this;
        }

        on(eventName, handler) {
            handlers[eventName] = handler;
            return this;
        }
    }

    const bodySelection = new Selection(document.body);

    const d3 = {
        select(target) {
            if (target === '#family-tree-div') {
                return new Selection(document.getElementById('family-tree-div'));
            }
            if (target === 'body') {
                return bodySelection;
            }
            return new Selection(target);
        },
        hcl() {
            return '#ffffff';
        },
        zoom() {
            const zoom = function() {};
            zoom.scaleExtent = () => zoom;
            zoom.on = () => zoom;
            zoom.transform = (selection, transform) => {
                zoomCalls.push({ type: 'transform', selection, transform });
            };
            zoom.scaleBy = (selection, factor) => {
                zoomCalls.push({ type: 'scaleBy', selection, factor });
            };
            zoom.translateBy = (selection, x, y) => {
                zoomCalls.push({ type: 'translateBy', selection, x, y });
            };
            return zoom;
        },
        zoomTransform() {
            return { k: 2 };
        },
        zoomIdentity: { id: 'identity' },
    };

    return { d3, handlers, zoomCalls };
}

describe('draw tree keyboard navigation', () => {
    it('06.15 keyboard shortcuts trigger zoom reset/zoom in/zoom out and pan calls', async () => {
        const dom = new JSDOM(`
            <div id="family-tree-div"></div>
            <span id="root-name"></span>
            <div id="status-bar-div"></div>
        `);

        const treeDiv = dom.window.document.getElementById('family-tree-div');
        treeDiv.getBoundingClientRect = () => ({ width: 1000, height: 800 });

        const { d3, zoomCalls } = createD3Harness(dom.window.document);

        const context = loadBrowserScript('src/js/draw_tree.js', {
            windowOverrides: {
                text_size: 14,
                tree_color: '#000000',
                transparent_bg_rect: false,
                inlaw_link_highlight_percent: 100,
                pedigree_highlight_percent: 100,
                link_highlight_percent: 100,
                box_width: 80,
                box_height: 50,
                sibling_spacing: 24,
                generation_spacing: 24,
                link_width: 2,
                selected_individual: { name: 'Root Person' },
            },
            globalOverrides: {
                document: dom.window.document,
                d3,
                family_tree_div: treeDiv,
                selected_individual: { name: 'Root Person' },
                getMaximumDimensions: () => [500, 400, '1'],
                drawNonBoldLinks: () => {},
                drawBoldLinks: () => {},
                drawCircles: () => {},
                drawNodes: async () => {},
                scheduler: { yield: async () => {} },
            },
        });

        // Override draw functions defined in draw_tree.js so this test only targets keyboard behavior.
        context.drawNonBoldLinks = () => {};
        context.drawBoldLinks = () => {};
        context.drawCircles = () => {};
        context.drawNodes = async () => {};

        await context.drawTree([]);

        context.treeKeyboardEvent({ key: 'Escape' });
        context.treeKeyboardEvent({ key: '+' });
        context.treeKeyboardEvent({ key: '-' });
        context.treeKeyboardEvent({ key: 'ArrowLeft' });
        context.treeKeyboardEvent({ key: 'ArrowRight' });
        context.treeKeyboardEvent({ key: 'ArrowUp' });
        context.treeKeyboardEvent({ key: 'ArrowDown' });

        const callTypes = zoomCalls.map(call => call.type);
        expect(callTypes).toContain('transform');
        expect(callTypes.filter(type => type === 'scaleBy').length).toBe(2);
        expect(callTypes.filter(type => type === 'translateBy').length).toBe(4);

        const translateCalls = zoomCalls.filter(call => call.type === 'translateBy');
        // At least one horizontal and one vertical pan should be issued.
        expect(translateCalls.some(call => call.x !== 0)).toBe(true);
        expect(translateCalls.some(call => call.y !== 0)).toBe(true);
    });
});
