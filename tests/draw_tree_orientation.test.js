import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScript, loadBrowserScripts } from './helpers/load-browser-script.js';

// ---------------------------------------------------------------------------
// Minimal D3 selection wrapper used to capture SVG element attributes
// ---------------------------------------------------------------------------
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

    selectAll() {
        return {
            remove: () => {
                while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
            },
        };
    }

    node() { return this.element; }
}

function createPathRecorder() {
    const commands = [];
    return {
        moveTo(x, y)                       { commands.push(`M${x},${y}`); },
        lineTo(x, y)                       { commands.push(`L${x},${y}`); },
        bezierCurveTo(x1, y1, x2, y2, x3, y3) { commands.push(`C${x1},${y1},${x2},${y2},${x3},${y3}`); },
        toString()                         { return commands.join(' '); },
    };
}

function loadDrawContext({ windowOverrides = {} } = {}) {
    const dom = new JSDOM('<div id="root"></div>');
    const orig = dom.window.document.createElement.bind(dom.window.document);
    dom.window.document.createElement = (tag, ...args) => {
        if (String(tag).toLowerCase() === 'canvas') {
            const ctx = {
                font: '',
                measureText(text) {
                    const m = / (\d+)px /.exec(ctx.font || ' 12px ');
                    return { width: String(text || '').length * (m ? parseInt(m[1], 10) : 12) * 0.55 };
                },
            };
            return { getContext: () => ctx };
        }
        return orig(tag, ...args);
    };

    const d3 = {
        hcl: () => '#ffffff',
        path: () => createPathRecorder(),
    };

    const context = loadBrowserScript('src/js/draw_tree.js', {
        windowOverrides: {
            box_width: 80,
            box_height: 40,
            node_rounding: 0,
            link_rounding: 0,
            node_border_width: 2,
            link_width: 2,
            highlighted_link_width: 4,
            special_highlight_percent: 100,
            border_highlight_percent: 100,
            inlaw_link_highlight_percent: 100,
            link_highlight_percent: 100,
            node_saturation: 20,
            node_brightness: 30,
            root_hue: 180,
            generations_down: 0,
            max_gen_up: 1,
            max_gen_down: 1,
            beside_inlaws: false,
            sibling_spacing: 20,
            generation_spacing: 30,
            tree_padding: 0,
            text_size: 12,
            default_text_size: 12,
            text_brightness: 80,
            text_shadow: false,
            show_names: false,
            show_years: false,
            show_places: false,
            highlight_type: 'none',
            tree_orientation: 'vertical',
            ...windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            d3,
        },
    });
    return { context, dom };
}

// ---------------------------------------------------------------------------
// Helper: build a standard DOM fragment with layout radio buttons and load
// ui_events.js so DOMContentLoaded wires up the change handlers.
// ---------------------------------------------------------------------------
function loadUiEventsWithRadioDom(overrides = {}) {
    const html = `
        <input type="radio" id="layout-vertical"   name="layout" value="vertical"   checked>
        <label for="layout-vertical">Vertical</label>
        <input type="radio" id="layout-horizontal" name="layout" value="horizontal">
        <label for="layout-horizontal">Horizontal</label>
    `;
    const dom = new JSDOM(html);

    const dummy = { value: '', addEventListener: () => {}, click: () => {} };

    let redrawCallCount = 0;
    const requestFamilyTreeUpdate = () => { redrawCallCount += 1; };

    const context = loadBrowserScript('src/js/ui_events.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            tree_orientation: 'vertical',
            location: { protocol: 'file:' },
            ...overrides.windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            Event: dom.window.Event,
            canvasSize: { maxArea: () => {}, maxWidth: () => {}, maxHeight: () => {} },
            elements: [],
            none_links: [],
            auto_links: [],
            requestFamilyTreeUpdate,
            updateRangeThumbs: () => {},
            populateIndividualSelect: () => {},
            savePNG: () => {},
            saveSVG: () => {},
            expandAllStylingSections: () => {},
            collapseAllStylingSections: () => {},
            toggleOptions: () => {},
            selectGedcomFile: () => {},
            filterIndividuals: () => {},
            filterConnections: () => {},
            populateConnectionSelect: () => {},
            usePresetStyle: () => {},
            populatePresetSelect: () => {},
            addPreset: () => {},
            savePreset: () => {},
            renamePreset: () => {},
            deletePreset: () => {},
            confirmAddPreset: () => {},
            confirmRenamePreset: () => {},
            updatePresetEditButtonState: () => {},
            openSaveModal: () => {},
            openOnlineGedcomModal: () => {},
            loadGedcomFromUrl: () => {},
            zoomToFit: () => {},
            zoomToFitHorizontal: () => {},
            zoomToFitVertical: () => {},
            scaleBodyForSmallScreens: () => {},
            updateOptionsVisibility: () => {},
            updateMaxLinksState: () => {},
            calculateMaxGenUp: () => 0,
            calculateMaxGenDown: () => 0,
            calculateMaxStackSize: () => 1,
            d3: { select: () => ({ on: () => {} }) },
            treeKeyboardEvent: () => {},
            save_modal_ok_button: dummy,
            save_filename_input: dummy,
            save_modal_cancel_button: dummy,
            save_modal: dummy,
            clearIndividualFilterbutton: dummy,
            clearConnectionFilterbutton: dummy,
            individual_filter: dummy,
            connection_filter: dummy,
            color_picker: dummy,
            optionsMenu: dummy,
            file_input: dummy,
            open_online_button: dummy,
            online_gedcom_modal: dummy,
            online_gedcom_cancel_button: dummy,
            individual_select: dummy,
            connection_select: dummy,
            preset_select: dummy,
            add_preset_button: dummy,
            save_preset_button: dummy,
            rename_preset_button: dummy,
            reload_preset_button: dummy,
            delete_preset_button: dummy,
            add_preset_modal: { ...dummy, style: {}, dataset: {} },
            add_preset_modal_ok_button: dummy,
            add_preset_modal_cancel_button: dummy,
            rename_preset_modal: { ...dummy, style: {} },
            rename_preset_modal_ok_button: dummy,
            rename_preset_modal_cancel_button: dummy,
            save_tree_button: dummy,
            resize_tree_button: dummy,
            resize_tree_horizontal_button: dummy,
            resize_tree_vertical_button: dummy,
            expand_styling_button: dummy,
            collapse_styling_button: dummy,
            connection_container: { classList: { add: () => {}, remove: () => {} } },
            about_button: dummy,
            about_modal: { ...dummy, style: {} },
            about_modal_close_button: dummy,
        },
    });

    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

    return { context, dom, getRedrawCount: () => redrawCallCount };
}

// ===========================================================================
// Tests
// ===========================================================================
describe('horizontal orientation', () => {
    it('12.01 mapCoords returns {x: s, y: g} for vertical orientation', () => {
        const { context } = loadDrawContext({ windowOverrides: { tree_orientation: 'vertical' } });
        expect(context.mapCoords(100, 200)).toEqual({ x: 100, y: 200 });
    });

    it('12.02 mapCoords returns {x: g, y: s} for horizontal orientation', () => {
        const { context } = loadDrawContext({ windowOverrides: { tree_orientation: 'horizontal' } });
        expect(context.mapCoords(100, 200)).toEqual({ x: 200, y: 100 });
    });

    it('12.03 nodeW returns box_width in both orientations', () => {
        const { context: cv } = loadDrawContext({ windowOverrides: { tree_orientation: 'vertical',   box_width: 80, box_height: 40 } });
        const { context: ch } = loadDrawContext({ windowOverrides: { tree_orientation: 'horizontal', box_width: 80, box_height: 40 } });
        expect(cv.nodeW()).toBe(80);
        expect(ch.nodeW()).toBe(80);
    });

    it('12.04 nodeH returns box_height in both orientations', () => {
        const { context: cv } = loadDrawContext({ windowOverrides: { tree_orientation: 'vertical',   box_width: 80, box_height: 40 } });
        const { context: ch } = loadDrawContext({ windowOverrides: { tree_orientation: 'horizontal', box_width: 80, box_height: 40 } });
        expect(cv.nodeH()).toBe(40);
        expect(ch.nodeH()).toBe(40);
    });

    it('12.05 getMaximumDimensions returns sibling extent as SVG width in vertical mode', () => {
        const cfg = { box_width: 80, box_height: 40, tree_padding: 0, tree_orientation: 'vertical' };
        const posCtx = loadBrowserScripts(
            ['src/js/position_tree_helpers.js', 'src/js/position_tree.js'],
            { windowOverrides: { box_width: 80, box_height: 40 } },
        );
        // node at layout (sibling=200, generation=100)
        const rows = [[[ { x: 200, y: 100 } ]]];
        const [svgW, svgH] = posCtx.getMaximumDimensions(rows, cfg);
        // vertical: SVG width = sibling axis → 200 + 80 = 280; SVG height = gen axis → 100 + 40 = 140
        expect(svgW).toBe(280);
        expect(svgH).toBe(140);
    });

    it('12.06 getMaximumDimensions returns generation extent as SVG width in horizontal mode', () => {
        const cfg = { box_width: 80, box_height: 40, tree_padding: 0, tree_orientation: 'horizontal' };
        const posCtx = loadBrowserScripts(
            ['src/js/position_tree_helpers.js', 'src/js/position_tree.js'],
            { windowOverrides: { box_width: 80, box_height: 40 } },
        );
        // same node at layout (sibling=200, generation=100)
        const rows = [[[ { x: 200, y: 100 } ]]];
        const [svgW, svgH] = posCtx.getMaximumDimensions(rows, cfg);
        // horizontal: SVG width = gen axis → 100 + box_width(80) = 180; SVG height = sibling axis → 200 + box_height(40) = 240
        expect(svgW).toBe(180);
        expect(svgH).toBe(240);
    });

    it('12.07 drawNode uses (x, y) translate and box_width × box_height rect in vertical mode', () => {
        const { context, dom } = loadDrawContext({ windowOverrides: { tree_orientation: 'vertical' } });
        context.drawText = () => {};

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const node = { type: 'inlaw', generation: 0, x: 150, y: 200,
            individual: { name: 'P', is_root: false, is_descendant: false } };
        context.drawNode(new SvgSelection(svg), node);

        const g = svg.querySelector('g');
        expect(g.getAttribute('transform')).toBe('translate(150, 200)');
        expect(svg.querySelector('rect').getAttribute('width')).toBe('80');
        expect(svg.querySelector('rect').getAttribute('height')).toBe('40');
    });

    it('12.08 drawNode uses (y, x) translate and box_width × box_height rect in horizontal mode', () => {
        const { context, dom } = loadDrawContext({ windowOverrides: { tree_orientation: 'horizontal' } });
        context.drawText = () => {};

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const node = { type: 'inlaw', generation: 0, x: 150, y: 200,
            individual: { name: 'P', is_root: false, is_descendant: false } };
        context.drawNode(new SvgSelection(svg), node);

        const g = svg.querySelector('g');
        // horizontal: SVG x = node.y (generation axis), SVG y = node.x (sibling axis)
        expect(g.getAttribute('transform')).toBe('translate(200, 150)');
        expect(svg.querySelector('rect').getAttribute('width')).toBe('80');   // box_width (same as vertical)
        expect(svg.querySelector('rect').getAttribute('height')).toBe('40');  // box_height (same as vertical)
    });

    it('12.09 drawLink path advances along y-axis first in vertical mode', () => {
        // layout point1 = (sibling=40, generation=10), point2 = (sibling=40, generation=110)
        // In vertical mode: start SVG coord = (40, 10); second point = (40, genMid-r) → same x, y moves
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'vertical', generation_spacing: 30, link_rounding: 0,
        } });

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawLink(new SvgSelection(svg), '#fff', { x: 40, y: 10 }, { x: 40, y: 110 }, null);

        const d = svg.querySelector('path').getAttribute('d');
        const moveMatch = d.match(/^M([^,\s]+),([^,\s]+)/);
        const lineMatch = d.match(/L([^,\s]+),([^,\s]+)/);

        expect(moveMatch[1]).toBe('40'); // SVG x stays at sibling position
        expect(moveMatch[2]).toBe('10'); // SVG y starts at generation position
        // First lineTo: x unchanged, y advances toward genMid
        expect(lineMatch[1]).toBe('40');
        expect(parseFloat(lineMatch[2])).toBeGreaterThan(10);
    });

    it('12.10 drawLink path advances along x-axis first in horizontal mode', () => {
        // Same layout points — in horizontal mode SVG x = generation, SVG y = sibling
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'horizontal', generation_spacing: 30, link_rounding: 0,
        } });

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawLink(new SvgSelection(svg), '#fff', { x: 40, y: 10 }, { x: 40, y: 110 }, null);

        const d = svg.querySelector('path').getAttribute('d');
        const moveMatch = d.match(/^M([^,\s]+),([^,\s]+)/);
        const lineMatch = d.match(/L([^,\s]+),([^,\s]+)/);

        expect(moveMatch[1]).toBe('10'); // SVG x starts at generation position
        expect(moveMatch[2]).toBe('40'); // SVG y = sibling position
        // First lineTo: y unchanged, x advances toward genMid
        expect(lineMatch[2]).toBe('40');
        expect(parseFloat(lineMatch[1])).toBeGreaterThan(10);
    });

    it('12.11 drawCircle maps center sibling→cx, generation→cy in vertical mode', () => {
        const { context, dom } = loadDrawContext({ windowOverrides: { tree_orientation: 'vertical' } });
        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawCircle(new SvgSelection(svg), '#ff0', { x: 30, y: 90 }, 5);

        const circle = svg.querySelector('circle');
        expect(circle.getAttribute('cx')).toBe('30'); // sibling → SVG x
        expect(circle.getAttribute('cy')).toBe('90'); // generation → SVG y
    });

    it('12.12 drawCircle maps center generation→cx, sibling→cy in horizontal mode', () => {
        const { context, dom } = loadDrawContext({ windowOverrides: { tree_orientation: 'horizontal' } });
        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawCircle(new SvgSelection(svg), '#ff0', { x: 30, y: 90 }, 5);

        const circle = svg.querySelector('circle');
        expect(circle.getAttribute('cx')).toBe('90'); // generation → SVG x
        expect(circle.getAttribute('cy')).toBe('30'); // sibling → SVG y
    });

    it('12.13 layout radio change to horizontal updates tree_orientation and triggers redraw', () => {
        const { context, dom, getRedrawCount } = loadUiEventsWithRadioDom();

        const horizontal = dom.window.document.getElementById('layout-horizontal');
        horizontal.checked = true;
        horizontal.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(context.window.tree_orientation).toBe('horizontal');
        expect(getRedrawCount()).toBe(1);
    });

    it('12.14 layout radio change to vertical updates tree_orientation and triggers redraw', () => {
        // Start with horizontal preselected
        const { context, dom, getRedrawCount } = loadUiEventsWithRadioDom({
            windowOverrides: { tree_orientation: 'horizontal' },
        });

        const vertical = dom.window.document.getElementById('layout-vertical');
        vertical.checked = true;
        vertical.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(context.window.tree_orientation).toBe('vertical');
        expect(getRedrawCount()).toBe(1);
    });

    it('12.15 layout radio change does not trigger redraw when the input is not checked', () => {
        const { getRedrawCount, dom } = loadUiEventsWithRadioDom();

        const horizontal = dom.window.document.getElementById('layout-horizontal');
        // Do not set checked = true — fire change with unchecked state
        horizontal.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(getRedrawCount()).toBe(0);
    });

    it('12.17 in horizontal mode setHeights places ancestor levels to the right of descendant levels', () => {
        const posCtx = loadBrowserScripts(
            ['src/js/position_tree_helpers.js', 'src/js/position_tree.js'],
            { windowOverrides: { level_spacing: 0, level_heights: [] } },
        );

        const root_node   = { x: 0, y: 0 };
        const parent_node = { x: 0, y: 0 };

        // Sparse rows: root at anchor_gen=1, parent at anchor_gen=2
        const rows = [];
        rows[1] = [[ root_node ]];
        rows[2] = [[ parent_node ]];

        posCtx.window.level_heights = [];
        posCtx.window.level_heights[1] = 1;
        posCtx.window.level_heights[2] = 1;
        posCtx.window.level_spacing = 0;

        const cfg = {
            box_width: 80, box_height: 40, generation_spacing: 30,
            tree_padding: 10, level_spacing: 0, tree_orientation: 'horizontal',
        };

        posCtx.setHeights(rows, cfg);

        // In horizontal mode layout y maps to SVG x.
        // The ancestor (parent_node, higher anchor_gen) must have a larger y so it renders
        // further to the right than the root node.
        expect(parent_node.y).toBeGreaterThan(root_node.y);
    });

    it('12.18 drawCircles places ancestor circle at sibling-axis midpoint between parents in vertical mode', () => {
        // box_width=80, sibling_spacing=20 → mother node is positioned at father.x + 80 + 20 = 100
        // Circle sibling-axis center = father.x + 80 + 20/2 = 90 → SVG cx = 90
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'vertical',
            box_width: 80,
            box_height: 40,
            sibling_spacing: 20,
            beside_inlaws: true,
            highlight_type: 'none',
        } });

        const pedigreeChild = { generation: 0, type: 'root', individual: { is_root: true, is_descendant: false } };
        const father = {
            type: 'ancestor',
            generation: 1,
            x: 50,
            y: 200,
            individual: { gender: 'M', is_root: false, is_descendant: false, pedigree_child_node: pedigreeChild },
            pedigree_child_node: pedigreeChild,
        };

        context.window.root_node = pedigreeChild;

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const rows = [[[father]]];
        context.drawCircles(new SvgSelection(svg), rows);

        const circle = svg.querySelector('circle');
        expect(circle).not.toBeNull();
        // SVG cx = sibling axis center = father.x + box_width + sibling_spacing/2 = 50 + 80 + 10 = 140
        expect(parseFloat(circle.getAttribute('cx'))).toBe(140);
    });

    it('12.19 drawCircles places ancestor circle at sibling-axis midpoint between parents in horizontal mode', () => {
        // box_width=80, box_height=40, sibling_spacing=20 → mother is at father.x + box_height + 20 = father.x + 60
        // Circle sibling-axis center = father.x + box_height + sibling_spacing/2 = 50 + 40 + 10 = 100
        // In horizontal mode sibling axis → SVG y, so SVG cy = 100
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'horizontal',
            box_width: 80,
            box_height: 40,
            sibling_spacing: 20,
            beside_inlaws: true,
            highlight_type: 'none',
        } });

        const pedigreeChild = { generation: 0, type: 'root', individual: { is_root: true, is_descendant: false } };
        const father = {
            type: 'ancestor',
            generation: 1,
            x: 50,
            y: 200,
            individual: { gender: 'M', is_root: false, is_descendant: false, pedigree_child_node: pedigreeChild },
            pedigree_child_node: pedigreeChild,
        };

        context.window.root_node = pedigreeChild;

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const rows = [[[father]]];
        context.drawCircles(new SvgSelection(svg), rows);

        const circle = svg.querySelector('circle');
        expect(circle).not.toBeNull();
        // SVG cy = sibling axis center = father.x + box_height + sibling_spacing/2 = 50 + 40 + 10 = 100
        expect(parseFloat(circle.getAttribute('cy'))).toBe(100);
    });

    it('12.20 drawBoldLinks mother link starts at correct sibling-axis position in horizontal mode (non-beside, box_width > box_height)', () => {
        // box_width=80, box_height=40, sibling_spacing=20 — nodeHalf() = box_height/2 = 20 (horizontal)
        // Mother link start sibling: father.x + 3*nodeHalf() + sibling_spacing = 50 + 60 + 20 = 130
        // In horizontal mode sibling maps to SVG y → mother link M command SVG-y must be 130 (was 170 before fix)
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'horizontal',
            box_width: 80,
            box_height: 40,
            sibling_spacing: 20,
            beside_inlaws: false,
            highlight_type: 'none',
        } });

        const father = {
            type: 'ancestor',
            generation: 1,
            x: 50,
            y: 200,
            children_nodes: [],
            individual: { gender: 'M', is_root: false, is_descendant: false },
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawBoldLinks(new SvgSelection(svg), [[[father]]], null);

        const paths = svg.querySelectorAll('path');
        // beside_inlaws=false, no children: father link + mother link = 2 paths
        expect(paths).toHaveLength(2);

        // Extract start SVG y from each path's M command
        const startYs = Array.from(paths).map(p => {
            const m = p.getAttribute('d').match(/^M([^,\s]+),([^,\s]+)/);
            return parseFloat(m[2]);
        });
        startYs.sort((a, b) => a - b);

        // Father: sibling = father.x + nodeHalf() = 50 + 20 = 70 → SVG y = 70
        // Mother: sibling = father.x + 3*nodeHalf() + sibling_spacing = 50 + 60 + 20 = 130 → SVG y = 130
        expect(startYs[0]).toBe(70);   // father link
        expect(startYs[1]).toBe(130);  // mother link (was 170 before fix)
    });

    it('12.21 drawBoldLinks beside-mode link endpoint has correct sibling-axis position in horizontal mode (box_width > box_height)', () => {
        // box_width=80, box_height=40, sibling_spacing=20 — nodeHalf() = 20 (horizontal)
        // Beside link endpoint sibling: father.x + 3*nodeHalf() + sibling_spacing = 50 + 60 + 20 = 130
        // In horizontal mode sibling maps to SVG y → last L command SVG-y must be 130 (was 170 before fix)
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'horizontal',
            box_width: 80,
            box_height: 40,
            sibling_spacing: 20,
            beside_inlaws: true,
            highlight_type: 'none',
        } });

        const father = {
            type: 'ancestor',
            generation: 1,
            x: 50,
            y: 200,
            children_nodes: [],
            individual: { gender: 'M', is_root: false, is_descendant: false },
        };

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        context.drawBoldLinks(new SvgSelection(svg), [[[father]]], null);

        const paths = svg.querySelectorAll('path');
        // beside_inlaws=true, no children: one link from father to mother = 1 path
        expect(paths).toHaveLength(1);

        const d = paths[0].getAttribute('d');
        // The path ends with L{gen},{sibling} (final lineTo the endpoint) in horizontal mode
        const lastLMatch = [...d.matchAll(/L([^,\s]+),([^,\s]+)/g)].at(-1);
        const endSvgY = parseFloat(lastLMatch[2]);

        // Endpoint sibling = father.x + 3*nodeHalf() + sibling_spacing = 50 + 60 + 20 = 130 → SVG y = 130
        expect(endSvgY).toBe(130);  // was 170 before fix
    });

    it('12.22 drawCircles places circle at correct sibling-axis position for female inlaw (non-ancestor spouse) in horizontal mode (box_width > box_height)', () => {
        // Female inlaw is to the right of male root at x = root.x + sibNodeSize + sibling_spacing
        // box_width=80, box_height=40, sibling_spacing=20 → sibNodeSize=40 (horizontal)
        // inlaw.x = 50 + 40 + 20 = 110
        // Circle sibling offset from inlaw left edge = -sibling_spacing/2 = -10
        // Circle sibling-axis = 110 - 10 = 100 → SVG cy = 100 (was 80 before fix = 110 + (20-40)/2 - 10)
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'horizontal',
            box_width: 80,
            box_height: 40,
            sibling_spacing: 20,
            beside_inlaws: true,
            highlight_type: 'none',
        } });

        const child = {
            type: 'relative',
            generation: 0,
            x: 110, y: 300,
            stacked: false, stack_top: false,
            spouse_nodes: [], children_nodes: [],
            individual: { gender: 'M', is_root: true, is_descendant: false },
        };

        const maleRoot = {
            type: 'root',
            generation: 0,
            x: 50, y: 200,
            individual: { gender: 'M', is_root: true, is_descendant: false },
        };

        const femaleInlaw = {
            type: 'inlaw',
            generation: 0,
            x: 110,   // = maleRoot.x + sibNodeSize(=40) + sibling_spacing(=20)
            y: 200,
            children_nodes: [child],
            spouse_nodes: [maleRoot],
            individual: { gender: 'F', is_root: false, is_descendant: false },
        };

        context.window.root_node = child;

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const rows = [[[femaleInlaw, maleRoot, child]]];
        context.drawCircles(new SvgSelection(svg), rows);

        const circle = svg.querySelector('circle');
        expect(circle).not.toBeNull();

        // SVG cy = sibling-axis circle center = inlaw.x + x_offset = 110 + (-10) = 100
        // (was 110 + (20-40)/2 - 10 = 80 before fix when box_width > box_height)
        expect(parseFloat(circle.getAttribute('cy'))).toBe(100);
    });

    it('12.23 drawNonBoldLinks beside-inlaw link from female inlaw starts at correct sibling-axis position in horizontal mode (box_width > box_height)', () => {
        // Same layout: female inlaw at x=110, sibling_spacing=20, box_height=40
        // Link start sibling = inlaw.x - sibling_spacing/2 = 110 - 10 = 100 → SVG y = 100
        const { context, dom } = loadDrawContext({ windowOverrides: {
            tree_orientation: 'horizontal',
            box_width: 80,
            box_height: 40,
            sibling_spacing: 20,
            beside_inlaws: true,
            highlight_type: 'none',
        } });

        const child = {
            type: 'relative',
            generation: -1,
            x: 110, y: 350,
            stacked: false, stack_top: false,
            spouse_nodes: [], children_nodes: [],
            individual: { gender: 'M', is_root: true, is_descendant: false },
        };

        const maleRoot = {
            type: 'root',
            generation: 0,
            x: 50, y: 200,
            stacked: false, stack_top: false,
            children_nodes: [],
            spouse_nodes: [],
            individual: { gender: 'M', is_root: true, is_descendant: false },
        };

        const femaleInlaw = {
            type: 'inlaw',
            generation: 0,
            x: 110,
            y: 200,
            children_nodes: [child],
            spouse_nodes: [maleRoot],
            individual: { gender: 'F', is_root: false, is_descendant: false },
        };

        maleRoot.spouse_nodes = [femaleInlaw];

        context.window.root_node = child;

        const svg = dom.window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const rows = [[[femaleInlaw, maleRoot, child]]];
        context.drawNonBoldLinks(new SvgSelection(svg), rows, null);

        const paths = svg.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);

        // Find the beside-inlaw link whose start SVG y = 100 (sibling = inlaw.x - sibling_spacing/2 = 100)
        const startYs = Array.from(paths).map(p => {
            const m = p.getAttribute('d').match(/^M([^,\s]+),([^,\s]+)/);
            return parseFloat(m[2]);
        });

        // At least one link must start at SVG y = 100 (the beside-inlaw junction link)
        // (was 80 before fix: 110 + (20-40)/2 - 10 = 80 when box_width=80, box_height=40)
        expect(startYs).toContain(100);
    });
});
