import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function makeDomWithCanvasMock() {
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
            return { getContext: () => ctx };
        }
        return originalCreateElement(tagName, ...args);
    };
    return dom;
}

function loadDrawTreeContext(windowOverrides = {}) {
    const dom = makeDomWithCanvasMock();
    const context = loadBrowserScript('src/js/draw_tree.js', {
        windowOverrides: {
            box_width: 80,
            box_height: 50,
            box_padding: 3,
            text_align: 'middle',
            text_size: 12,
            default_text_size: 12,
            text_brightness: 80,
            text_shadow: false,
            show_names: true,
            show_years: true,
            show_places: false,
            pedigree_highlight_percent: 125,
            node_saturation: 30,
            node_brightness: 40,
            root_hue: 180,
            generations_down: 0,
            max_gen_up: 2,
            max_gen_down: 2,
            min_text_size: 12,
            max_text_size: 6,
            auto_box_width: 0,
            auto_box_height: 0,
            ...windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            d3: { hcl: () => '#ffffff' },
        },
    });
    return context;
}

describe('rendering helpers', () => {
    it('11.01 getMaximumDimensions returns max width/height and node count from positioned rows', () => {
        // position_tree.js sets window.tree_padding = 160 on load; override it after loading
        const context = loadBrowserScript('src/js/position_tree.js', {
            windowOverrides: { box_width: 80, box_height: 50 },
        });
        context.window.tree_padding = 50;

        const rows = [
            [[ { x: 50, y: 100 }, { x: 150, y: 100 } ]],
            [[ { x: 200, y: 200 } ]],
        ];

        const [max_x, max_y, node_count] = context.getMaximumDimensions(rows);

        // rightmost node: x=200 + box_width=80 + tree_padding=50 = 330
        expect(max_x).toBe(330);
        // bottom node: y=200 + box_height=50 + tree_padding=50 = 300
        expect(max_y).toBe(300);
        // 3 nodes total formatted as locale string
        expect(node_count).toBe('3');
    });

    it('11.02 buildSecondaryStrings formats birth/death/place text and omits empty values', () => {
        const context = loadDrawTreeContext();

        // show_years only, both dates → combined "birth-death" string
        context.window.show_years = true;
        context.window.show_places = false;
        const r1 = context.buildSecondaryStrings({ birth: '1900', death: '1980', birth_place: '', death_place: '' });
        expect(r1.secondary_strings).toEqual(['1900-1980']);
        expect(r1.place_strings).toEqual([]);

        // show_years only, birth only → "birth-" string
        const r2 = context.buildSecondaryStrings({ birth: '1900', death: '', birth_place: '', death_place: '' });
        expect(r2.secondary_strings).toEqual(['1900-']);

        // show_places=true → B:/D: formatted lines with years embedded
        context.window.show_places = true;
        const r3 = context.buildSecondaryStrings({ birth: '1900', death: '1980', birth_place: 'London', death_place: 'Paris' });
        expect(r3.place_strings).toEqual(['B: 1900 London', 'D: 1980 Paris']);
        expect(r3.secondary_strings).toEqual([]);

        // neither show_years nor show_places → all empty
        context.window.show_years = false;
        context.window.show_places = false;
        const r4 = context.buildSecondaryStrings({ birth: '', death: '', birth_place: '', death_place: '' });
        expect(r4.secondary_strings).toEqual([]);
        expect(r4.place_strings).toEqual([]);
    });

    it('11.03 estimateTextDimensions scales width/height estimates with line count and font sizes', () => {
        const context = loadDrawTreeContext();

        const singleLine = [{ text: 'Alice', type: 'name' }];
        const twoLines = [
            { text: 'Alice', type: 'name' },
            { text: '1900-1980', type: 'secondary' },
        ];

        const small = context.estimateTextDimensions(singleLine, 1, 8, 6, false);
        const large = context.estimateTextDimensions(singleLine, 1, 16, 12, false);

        // larger font size → wider and taller estimate
        expect(large.width).toBeGreaterThan(small.width);
        expect(large.height).toBeGreaterThan(small.height);

        // more lines at the same font size → taller estimate
        const oneLine = context.estimateTextDimensions(singleLine, 1, 12, 10, false);
        const twoLine = context.estimateTextDimensions(twoLines, 1, 12, 10, false);
        expect(twoLine.height).toBeGreaterThan(oneLine.height);
    });

    it('11.04 getNodeHCL returns adjusted color values for descendant/inlaw highlight states', () => {
        const context = loadDrawTreeContext();

        const rootNode = { generation: 0, type: 'root' };
        const inlawNode = { generation: 0, type: 'inlaw' };
        const relNode = { generation: 1, type: 'relative' };

        const [, rootChroma, rootLum] = context.getNodeHCL(rootNode);
        expect(rootChroma).toBe(30); // node_saturation
        expect(rootLum).toBe(40);   // node_brightness

        // in-law is desaturated (chroma=0) when inlaw_desaturated=true (default)
        const [, inlawChroma] = context.getNodeHCL(inlawNode);
        expect(inlawChroma).toBe(0);

        // in-law gets full saturation when inlaw_desaturated=false
        const [, inlawChromaFull] = context.getNodeHCL(inlawNode, false);
        expect(inlawChromaFull).toBe(30);

        // a different generation produces a different hue
        const [rootHue] = context.getNodeHCL(rootNode);
        const [relHue] = context.getNodeHCL(relNode);
        expect(relHue).not.toBe(rootHue);
    });

    it('11.05 shrinkToFit reduces text size until content fits within configured node box bounds', () => {
        // Use a very small box so large initial font sizes must be reduced
        const context = loadDrawTreeContext({ box_width: 60, box_height: 30 });

        const nameLines = ['Extremely Long Name'];
        const secondaryStrings = ['1800-1900'];
        const placeStrings = [];
        const lines = [
            { text: 'Extremely Long Name', type: 'name' },
            { text: '1800-1900', type: 'secondary' },
        ];

        const result = context.shrinkToFit(nameLines, secondaryStrings, placeStrings, lines, 40, 30, true, false);

        // Font sizes should be reduced to fit the small box, but not below minimum (6px)
        expect(result.name_font_size).toBeLessThan(40);
        expect(result.secondary_font_size).toBeLessThan(30);
        expect(result.name_font_size).toBeGreaterThanOrEqual(6);
        expect(result.secondary_font_size).toBeGreaterThanOrEqual(6);

        // Content that already fits should be left unchanged
        const tinyLines = [{ text: 'Al', type: 'name' }];
        const unchanged = context.shrinkToFit(['Al'], [], [], tinyLines, 10, 8, true, false);
        expect(unchanged.name_font_size).toBe(10);
    });

    it('11.12 selectInitialTextLayout reduces secondary font to improve name fit when years are shown', () => {
        const context = loadDrawTreeContext({ box_height: 40, text_size: 12 });

        context.fitTextInBox = (_str, _width, height) => {
            if (height >= 26) {
                return { lines: ['Very Long', 'Person Name'], fontSize: 7 };
            }
            return { lines: ['Very Long Person Name'], fontSize: 6 };
        };

        const layout = context.selectInitialTextLayout(
            'Very Long Person Name',
            'normal',
            12,
            ['1900-1980'],
            []
        );

        expect(layout.name_font_size).toBe(7);
        expect(layout.secondary_font_size).toBe(8);
        expect(layout.name_lines).toEqual(['Very Long', 'Person Name']);
    });

    it('11.14 fitTextInBox does not split unbroken names mid-character; falls back to min font size', () => {
        const context = loadDrawTreeContext({ box_width: 72, box_height: 56, box_padding: 2 });

        // A single token with no spaces or hyphens must not be broken mid-character.
        // It stays on one line and the font size falls to the minimum.
        const fit = context.fitTextInBox('AlexandriaCatherineMontgomerySmythe', 72, 56, 'Arial, sans-serif', 'normal', 12);

        expect(fit.fontSize).toBe(6);
        expect(fit.lines.length).toBe(1);
        expect(fit.lines[0]).toBe('AlexandriaCatherineMontgomerySmythe');
    });

    it('11.15 fitTextInBox fallback still returns wrapped lines at min size when no size fully fits height', () => {
        const context = loadDrawTreeContext({ box_width: 72, box_height: 10, box_padding: 2 });

        const fit = context.fitTextInBox('Dorothee Wilhelmine Louise Coldewey Bunte', 72, 10, 'Arial, sans-serif', 'normal', 12);

        expect(fit.fontSize).toBe(6);
        expect(fit.lines.length).toBeGreaterThan(1);
        fit.lines.forEach(line => {
            const lineOnly = context.fitTextInBox(line, 72, 56, 'Arial, sans-serif', 'normal', 6);
            expect(lineOnly.lines.length).toBe(1);
        });
    });

    it('11.21 alignTextVertically places text top/middle/bottom precisely using exact getBBox coords', () => {
        // alignTextVertically receives a bbox measured while text.y = box_height/2.
        // It must set y so that:
        //   top    → new bbox.y = box_padding
        //   bottom → new bbox.y + bbox.height = box_height - box_padding
        //   middle → new bbox.y = (box_height - bbox.height) / 2
        //
        // Key identity: after setting text.y = new_y, the bbox shifts by (new_y - old_y),
        // so new_bbox.y = bbox.y + (new_y - box_height/2).

        const BOX_H = 80;
        const BOX_PAD = 5;
        const MID = BOX_H / 2;  // 40

        // Simulate: text.y = 40 when getBBox was called, first tspan at 12px font.
        //   ascender ≈ 12 * 0.72 = 8.64  →  bbox.y = 40 - 8.64 = 31.36
        const ASCENDER = 8.64;
        const DESCENDER = 3.36;          // 12 * 0.28, bottom of single line beyond baseline
        const bbox = { x: 0, y: MID - ASCENDER, width: 50, height: ASCENDER + DESCENDER };

        // Helper: create a minimal mock D3 selection that captures the last attr('y', ...) call
        function makeCapture() {
            let y_set;
            return {
                attr(name, value) { if (name === 'y') y_set = value; return this; },
                get capturedY() { return y_set; },
            };
        }

        // --- top alignment ---
        // After setting y = text_y, new bbox.y = bbox.y + (text_y - MID). We want that = BOX_PAD.
        // → text_y = BOX_PAD - bbox.y + MID  → top of text (baseline − ascender) = BOX_PAD.
        const ctxTop = loadDrawTreeContext({ box_height: BOX_H, box_padding: BOX_PAD, text_align: 'top' });
        const selTop = makeCapture();
        ctxTop.alignTextVertically(selTop, bbox);

        const topOfText = selTop.capturedY - ASCENDER;           // baseline - ascender = top of glyphs
        expect(topOfText).toBeCloseTo(BOX_PAD, 5);

        // --- bottom alignment ---
        // new bbox.y + bbox.height = BOX_H - BOX_PAD
        const ctxBot = loadDrawTreeContext({ box_height: BOX_H, box_padding: BOX_PAD, text_align: 'bottom' });
        const selBot = makeCapture();
        ctxBot.alignTextVertically(selBot, bbox);

        const bottomOfText = selBot.capturedY + DESCENDER;       // baseline + descender = bottom of glyphs
        expect(bottomOfText).toBeCloseTo(BOX_H - BOX_PAD, 5);

        // --- middle alignment ---
        // new bbox.y = (BOX_H - bbox.height) / 2
        const ctxMid = loadDrawTreeContext({ box_height: BOX_H, box_padding: BOX_PAD, text_align: 'middle' });
        const selMid = makeCapture();
        ctxMid.alignTextVertically(selMid, bbox);

        const centeredTop = selMid.capturedY - ASCENDER;
        const expectedCenteredTop = (BOX_H - bbox.height) / 2;
        expect(centeredTop).toBeCloseTo(expectedCenteredTop, 5);
    });

    it('11.22 alignTextVertically works correctly for multiline text with unequal dy gaps', () => {
        // For a name + secondary-year layout the 1.7em gap before the year line makes
        // bbox.height larger per line than a uniform-spacing would.  The formula must still
        // place the FIRST LINE's top at box_padding for 'top' alignment.

        const BOX_H = 48;
        const BOX_PAD = 4;
        const MID = 24;
        const NAME_FS = 8;
        const SEC_FS = 6;

        // Simulate rendered positions (text.y = 24 throughout):
        //   name baseline  at 24,           name ascender ≈ 8*0.72 = 5.76
        //   year baseline  at 24 + 1.7*6 = 34.2, sec  ascender ≈ 6*0.72 = 4.32
        // bbox.y    = 24 - 5.76    = 18.24  (top of name glyphs)
        // bbox.bottom = 34.2 + 6*0.28 = 35.88
        // bbox.height = 35.88 - 18.24 = 17.64
        const NAME_ASC = NAME_FS * 0.72;   // 5.76
        const SEC_DES  = SEC_FS  * 0.28;   // 1.68
        const SEC_BASE = MID + 1.7 * SEC_FS;  // 34.2
        const multilineBbox = {
            x: 0,
            y: MID - NAME_ASC,
            width: 30,
            height: (SEC_BASE + SEC_DES) - (MID - NAME_ASC),
        };

        function makeCapture() {
            let y_set;
            return {
                attr(name, value) { if (name === 'y') y_set = value; return this; },
                get capturedY() { return y_set; },
            };
        }

        // top: first-line top should land on BOX_PAD
        const ctx = loadDrawTreeContext({ box_height: BOX_H, box_padding: BOX_PAD, text_align: 'top' });
        const sel = makeCapture();
        ctx.alignTextVertically(sel, multilineBbox);

        expect(sel.capturedY - NAME_ASC).toBeCloseTo(BOX_PAD, 5);
    });
});
