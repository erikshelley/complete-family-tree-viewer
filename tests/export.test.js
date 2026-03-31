import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function loadUiContextWithDom(html, overrides = {}) {
    const dom = new JSDOM(html);
    const context = loadBrowserScript('src/js/ui.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            innerWidth: 1200,
            max_canvas_width: 4000,
            max_canvas_height: 4000,
            save_filename: 'family-tree',
            tree_color: '#000000',
            ...overrides.windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            Event: dom.window.Event,
            d3: {
                hcl: () => ({})
            },
            optionsMenu: { style: {} },
            leftColumnWrapper: { classList: { remove: () => {}, add: () => {}, contains: () => false }, style: {} },
            leftCol: { offsetWidth: 300 },
            rightCol: { offsetWidth: 500 },
            family_tree_div: dom.window.document.getElementById('family-tree-div') || { querySelector: () => null, innerHTML: '' },
            expand_styling_button: { style: {} },
            collapse_styling_button: { style: {} },
            file_name_span: { textContent: '' },
            individual_filter: { value: '' },
            individual_select: { innerHTML: '' },
            generations_up_number: { value: '1' },
            generations_down_number: { value: '1' },
            max_stack_size_number: { value: '1' },
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
            ...overrides.globalOverrides,
        },
    });

    return { context, dom };
}

function loadUiEventsContextWithDom(html, overrides = {}) {
    const dom = new JSDOM(html);

    const defaultElements = {
        save_modal_ok_button: dom.window.document.getElementById('save-modal-ok-button') || { addEventListener: () => {}, click: () => {} },
        save_filename_input: dom.window.document.getElementById('save-filename-input') || { value: '' },
        clearIndividualFilterbutton: { addEventListener: () => {} },
        clearConnectionFilterbutton: { addEventListener: () => {} },
        individual_filter: { addEventListener: () => {}, value: '' },
        connection_filter: { addEventListener: () => {}, value: '' },
        connection_container: { classList: { remove: () => {}, add: () => {} } },
        connection_select: { addEventListener: () => {}, value: '' },
        color_picker: { addEventListener: () => {}, value: '#000000' },
        optionsMenu: { addEventListener: () => {}, style: {} },
        file_input: { addEventListener: () => {} },
        open_online_button: { addEventListener: () => {} },
        online_gedcom_modal: { addEventListener: () => {}, style: {} },
        online_gedcom_cancel_button: { addEventListener: () => {} },
        individual_select: { addEventListener: () => {}, value: '' },
        preset_select: { addEventListener: () => {}, value: '' },
        add_preset_button: { addEventListener: () => {} },
        save_preset_button: { addEventListener: () => {} },
        rename_preset_button: { addEventListener: () => {} },
        reload_preset_button: { addEventListener: () => {} },
        delete_preset_button: { addEventListener: () => {} },
        add_preset_modal: { addEventListener: () => {}, style: {}, dataset: {} },
        add_preset_modal_ok_button: { addEventListener: () => {} },
        add_preset_modal_cancel_button: { addEventListener: () => {} },
        rename_preset_modal: { addEventListener: () => {}, style: {} },
        rename_preset_modal_ok_button: { addEventListener: () => {}, click: () => {} },
        rename_preset_modal_cancel_button: { addEventListener: () => {} },
        save_tree_button: { addEventListener: () => {} },
        save_modal_cancel_button: dom.window.document.getElementById('save-modal-cancel-button') || { addEventListener: () => {}, click: () => {} },
        save_modal: dom.window.document.getElementById('save-modal') || { addEventListener: () => {}, style: {} },
        resize_tree_button: { addEventListener: () => {} },
        resize_tree_horizontal_button: { addEventListener: () => {} },
        resize_tree_vertical_button: { addEventListener: () => {} },
        expand_styling_button: { addEventListener: () => {} },
        collapse_styling_button: { addEventListener: () => {} },
    };

    const context = loadBrowserScript('src/js/ui_events.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            location: { protocol: 'file:' },
            ...overrides.windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            Event: dom.window.Event,
            KeyboardEvent: dom.window.KeyboardEvent,
            canvasSize: {
                maxArea: () => {},
                maxWidth: () => {},
                maxHeight: () => {},
            },
            elements: [],
            none_links: [],
            auto_links: [],
            requestFamilyTreeUpdate: () => {},
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
            d3: { select: () => ({ on: () => {} }) },
            treeKeyboardEvent: () => {},
            ...defaultElements,
            ...overrides.globalOverrides,
        },
    });

    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

    return { context, dom };
}

describe('export behavior', () => {
    it('07.01 saveSVG serializes SVG content and triggers svg download', () => {
        const xmlInputs = [];
        const createdUrls = [];
        const revokedUrls = [];
        const downloadClicks = [];

        class FakeBlob {
            constructor(parts, options = {}) {
                this.parts = parts;
                this.type = options.type;
            }
        }

        const { context, dom } = loadUiContextWithDom('<div id="family-tree-div"><svg viewBox="0 0 100 60"></svg></div>', {
            windowOverrides: {
                save_filename: 'my-export',
            },
            globalOverrides: {
                Blob: FakeBlob,
                XMLSerializer: class {
                    serializeToString(node) {
                        xmlInputs.push(node.tagName);
                        return '<svg viewBox="0 0 100 60"></svg>';
                    }
                },
                URL: {
                    createObjectURL: (blob) => {
                        createdUrls.push(blob);
                        return 'blob:svg-export';
                    },
                    revokeObjectURL: (url) => {
                        revokedUrls.push(url);
                    },
                },
                alert: () => {},
            },
        });

        const anchorClick = dom.window.HTMLAnchorElement.prototype.click;
        dom.window.HTMLAnchorElement.prototype.click = function() {
            downloadClicks.push({ download: this.download, href: this.href });
        };

        context.saveSVG();

        dom.window.HTMLAnchorElement.prototype.click = anchorClick;

        expect(xmlInputs).toEqual(['svg']);
        expect(createdUrls).toHaveLength(1);
        expect(createdUrls[0].type).toBe('image/svg+xml');
        expect(createdUrls[0].parts[0]).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(downloadClicks[0].download).toBe('my-export.svg');
        expect(downloadClicks[0].href).toBe('blob:svg-export');
        expect(revokedUrls).toEqual(['blob:svg-export']);
    });

    it('07.02 savePNG creates PNG blob and triggers png download', () => {
        const createdUrls = [];
        const revokedUrls = [];
        const downloadClicks = [];
        let drawImageArgs = null;

        class FakeBlob {
            constructor(parts, options = {}) {
                this.parts = parts;
                this.type = options.type;
            }
        }

        const { context, dom } = loadUiContextWithDom('<div id="family-tree-div"><svg viewBox="0 0 500 300"></svg></div>', {
            windowOverrides: {
                save_filename: 'png-export',
                max_canvas_width: 2000,
                max_canvas_height: 2000,
            },
            globalOverrides: {
                Blob: FakeBlob,
                XMLSerializer: class {
                    serializeToString() {
                        return '<svg viewBox="0 0 500 300"></svg>';
                    }
                },
                URL: {
                    createObjectURL: (blob) => {
                        createdUrls.push(blob);
                        return createdUrls.length === 1 ? 'blob:svg-src' : 'blob:png-out';
                    },
                    revokeObjectURL: (url) => {
                        revokedUrls.push(url);
                    },
                },
                Image: class {
                    set src(value) {
                        this._src = value;
                        if (this.onload) this.onload();
                    }
                },
                alert: () => {},
            },
        });

        const originalCreateElement = dom.window.document.createElement.bind(dom.window.document);
        const fakeCanvas = {
            width: 0,
            height: 0,
            getContext: () => ({
                drawImage: (...args) => {
                    drawImageArgs = args;
                },
            }),
            toBlob: (cb) => {
                cb({ kind: 'png-blob' });
            },
        };

        dom.window.document.createElement = (tagName) => {
            if (tagName === 'canvas') return fakeCanvas;
            return originalCreateElement(tagName);
        };

        const anchorClick = dom.window.HTMLAnchorElement.prototype.click;
        dom.window.HTMLAnchorElement.prototype.click = function() {
            downloadClicks.push({ download: this.download, href: this.href });
        };

        context.savePNG();

        dom.window.document.createElement = originalCreateElement;
        dom.window.HTMLAnchorElement.prototype.click = anchorClick;

        expect(drawImageArgs).not.toBeNull();
        expect(downloadClicks[0].download).toBe('png-export.png');
        expect(downloadClicks[0].href).toBe('blob:png-out');
        expect(revokedUrls).toContain('blob:png-out');
        expect(revokedUrls).toContain('blob:svg-src');
    });

    it('07.03 save modal OK with a filename closes modal and triggers save', () => {
        let invokedAs = '';
        const { context, dom } = loadUiEventsContextWithDom(`
            <div id="save-modal" tabindex="0"></div>
            <button id="save-modal-ok-button"></button>
            <button id="save-modal-cancel-button"></button>
            <input id="save-filename-input" value="my-tree" />
            <span id="save-filename-error" style="display:none;"></span>
            <input type="radio" name="save-format" value="svg" checked />
        `, {
            globalOverrides: {
                saveSVG: () => {
                    invokedAs = 'svg';
                },
            },
        });

        dom.window.document.getElementById('save-modal-ok-button').click();

        expect(invokedAs).toBe('svg');
        expect(context.window.save_filename).toBe('my-tree');
        expect(dom.window.document.getElementById('save-modal').style.display).toBe('none');
    });

    it('07.04 savePNG scales large SVG exports within browser limits', () => {
        const alerts = [];
        let drawImageArgs = null;

        class FakeBlob {
            constructor(parts, options = {}) {
                this.parts = parts;
                this.type = options.type;
            }
        }

        const { context, dom } = loadUiContextWithDom('<div id="family-tree-div"><svg viewBox="0 0 10000 5000"></svg></div>', {
            windowOverrides: {
                save_filename: 'scaled-export',
                max_canvas_width: 1000,
                max_canvas_height: 1000,
            },
            globalOverrides: {
                Blob: FakeBlob,
                XMLSerializer: class {
                    serializeToString() {
                        return '<svg viewBox="0 0 10000 5000"></svg>';
                    }
                },
                URL: {
                    createObjectURL: () => 'blob:any',
                    revokeObjectURL: () => {},
                },
                Image: class {
                    set src(value) {
                        this._src = value;
                        if (this.onload) this.onload();
                    }
                },
                alert: (message) => {
                    alerts.push(message);
                },
            },
        });

        const originalCreateElement = dom.window.document.createElement.bind(dom.window.document);
        const fakeCanvas = {
            width: 0,
            height: 0,
            getContext: () => ({
                drawImage: (...args) => {
                    drawImageArgs = args;
                },
            }),
            toBlob: (cb) => {
                cb({ kind: 'png-blob' });
            },
        };

        dom.window.document.createElement = (tagName) => {
            if (tagName === 'canvas') return fakeCanvas;
            return originalCreateElement(tagName);
        };

        context.savePNG();

        dom.window.document.createElement = originalCreateElement;

        expect(drawImageArgs).not.toBeNull();
        const width = drawImageArgs[3];
        const height = drawImageArgs[4];
        expect(width).toBeLessThanOrEqual(1000);
        expect(height).toBeLessThanOrEqual(1000);
        expect(alerts.some(message => message.startsWith('Note: The saved PNG has been scaled down'))).toBe(true);
    });
});
