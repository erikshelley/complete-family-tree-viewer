import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function loadUiContextWithDom(html) {
    const dom = new JSDOM(html);
    const context = loadBrowserScript('src/js/ui.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            innerWidth: 1200,
            individuals: [],
            families: [],
            gedcom_content: '',
            individual_filter_value: '',
            selected_individual: '',
            tree_color: '#000000',
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
            individual_filter: dom.window.document.getElementById('individual-filter-text') || { value: '' },
            connection_filter: dom.window.document.getElementById('connection-filter-text') || { value: '' },
            individual_select: dom.window.document.getElementById('individual-select') || { innerHTML: '' },
            connection_select: dom.window.document.getElementById('connection-select') || { innerHTML: '', appendChild: () => {} },
            generations_up_number: { value: '1' },
            generations_down_number: { value: '1' },
            max_stack_size_number: { value: '1' },
            hue_element: { value: '180' },
            sat_element: { value: '20' },
            lum_element: { value: '30' },
            text_lum_element: { value: '80' },
            root_name: null,
            color_picker: dom.window.document.getElementById('color-picker') || { value: '#000000' },
            save_filename_input: { value: '' },
            save_modal: { style: {} },
            style_presets: {},
            elements: [],
            filter_timeout: null,
            update_in_progress: false,
            update_waiting: false,
            update_timeout: null,
        },
    });

    return { context, dom };
}

function loadUiEventsContextWithDom(html, overrides = {}) {
    const dom = new JSDOM(html);

    const defaultElements = {
        save_modal_ok_button: dom.window.document.getElementById('save-modal-ok-button') || { addEventListener: () => {}, click: () => {} },
        save_filename_input: dom.window.document.getElementById('save-filename-input') || { value: '' },
        clearIndividualFilterbutton: dom.window.document.getElementById('clear-individual-filter') || { addEventListener: () => {} },
        individual_filter: dom.window.document.getElementById('individual-filter-text') || { value: '', addEventListener: () => {} },
        connection_filter: dom.window.document.getElementById('connection-filter-text') || { value: '', addEventListener: () => {} },
        clearConnectionFilterbutton: dom.window.document.getElementById('clear-connection-filter') || { addEventListener: () => {} },
        color_picker: dom.window.document.getElementById('color-picker') || { value: '#000000', addEventListener: () => {} },
        optionsMenu: dom.window.document.getElementById('options-menu-button') || { addEventListener: () => {}, style: {} },
        file_input: dom.window.document.getElementById('file-input-button') || { addEventListener: () => {} },
        open_online_button: dom.window.document.getElementById('open-online-button') || { addEventListener: () => {} },
        online_gedcom_modal: dom.window.document.getElementById('online-gedcom-modal') || { addEventListener: () => {}, style: {} },
        online_gedcom_cancel_button: dom.window.document.getElementById('online-gedcom-cancel-button') || { addEventListener: () => {} },
        individual_select: dom.window.document.getElementById('individual-select') || { addEventListener: () => {}, innerHTML: '' },
        connection_select: dom.window.document.getElementById('connection-select') || { addEventListener: () => {}, value: '' },
        preset_select: dom.window.document.getElementById('preset-select') || { addEventListener: () => {}, value: '' },
        save_tree_button: dom.window.document.getElementById('save-tree-button') || { addEventListener: () => {} },
        save_modal_cancel_button: dom.window.document.getElementById('save-modal-cancel-button') || { addEventListener: () => {}, click: () => {} },
        save_modal: dom.window.document.getElementById('save-modal') || { addEventListener: () => {}, style: {} },
        resize_tree_button: dom.window.document.getElementById('resize-tree-button') || { addEventListener: () => {} },
        resize_tree_horizontal_button: dom.window.document.getElementById('resize-tree-horizontal-button') || { addEventListener: () => {} },
        resize_tree_vertical_button: dom.window.document.getElementById('resize-tree-vertical-button') || { addEventListener: () => {} },
        expand_styling_button: dom.window.document.getElementById('expand-styling-button') || { addEventListener: () => {} },
        collapse_styling_button: dom.window.document.getElementById('collapse-styling-button') || { addEventListener: () => {} },
        connection_container: dom.window.document.getElementById('connection-container') || { classList: { add: () => {}, remove: () => {} } },
    };

    const context = loadBrowserScript('src/js/ui_events.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            individuals: [],
            individual_filter_value: '',
            connection_filter_value: '',
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
            ...defaultElements,
            ...overrides.globalOverrides,
        },
    });

    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

    return { context, dom };
}

describe('ui behavior cases', () => {
    it('06.01 filter narrows individual select options by typed substring', () => {
        vi.useFakeTimers();
        const { context, dom } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <input id="individual-filter-text" />
            <select id="individual-select"></select>
        `);

        context.window.individuals = [
            { id: '@I1@', name: 'Alice Root', birth: '', death: '' },
            { id: '@I2@', name: 'Bob Branch', birth: '', death: '' },
            { id: '@I3@', name: 'Alicia Leaf', birth: '', death: '' },
        ];

        context.populateIndividualSelect(context.window.individuals);
        expect(dom.window.document.querySelectorAll('#individual-select option').length).toBe(3);

        context.filterIndividuals('ali');
        vi.advanceTimersByTime(150);

        const optionTexts = Array.from(dom.window.document.querySelectorAll('#individual-select option')).map(o => o.textContent);
        expect(optionTexts).toEqual(['Alice Root', 'Alicia Leaf']);

        vi.useRealTimers();
    });

    it('06.02 clear filter resets text and repopulates all individuals', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <button id="clear-individual-filter"></button>
            <input id="individual-filter-text" value="ali" />
            <select id="individual-select"></select>
        `, {
            windowOverrides: {
                individuals: [{ id: '@I1@' }, { id: '@I2@' }, { id: '@I3@' }],
                individual_filter_value: 'ali',
            },
            globalOverrides: {
                populateIndividualSelect: (individuals) => {
                    const select = dom.window.document.getElementById('individual-select');
                    select.innerHTML = individuals.map(ind => `<option>${ind.id}</option>`).join('');
                },
            },
        });

        dom.window.document.getElementById('clear-individual-filter').click();

        expect(dom.window.document.getElementById('individual-filter-text').value).toBe('');
        expect(dom.window.document.querySelectorAll('#individual-select option').length).toBe(3);
    });

    it('06.03 save modal Enter triggers OK action', () => {
        let okClicks = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <div id="save-modal" tabindex="0"></div>
            <button id="save-modal-ok-button"></button>
            <button id="save-modal-cancel-button"></button>
            <input id="save-filename-input" value="tree" />
            <input type="radio" name="save-format" value="png" checked />
        `, {
            globalOverrides: {
                savePNG: () => {},
                saveSVG: () => {},
            },
        });

        dom.window.document.getElementById('save-modal-ok-button').addEventListener('click', () => {
            okClicks += 1;
        });

        const saveModal = dom.window.document.getElementById('save-modal');
        saveModal.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

        expect(okClicks).toBe(1);
    });

    it('06.04 save modal Escape triggers cancel action', () => {
        let cancelClicks = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <div id="save-modal" tabindex="0"></div>
            <button id="save-modal-ok-button"></button>
            <button id="save-modal-cancel-button"></button>
            <input id="save-filename-input" value="tree" />
            <input type="radio" name="save-format" value="png" checked />
        `);

        dom.window.document.getElementById('save-modal-cancel-button').addEventListener('click', () => {
            cancelClicks += 1;
        });

        const saveModal = dom.window.document.getElementById('save-modal');
        saveModal.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(cancelClicks).toBe(1);
    });

    it('06.05 resize controls trigger fit-all, horizontal, and vertical actions', () => {
        const calls = { all: 0, horizontal: 0, vertical: 0 };
        const { dom } = loadUiEventsContextWithDom(`
            <button id="resize-tree-button"></button>
            <button id="resize-tree-horizontal-button"></button>
            <button id="resize-tree-vertical-button"></button>
        `, {
            globalOverrides: {
                zoomToFit: () => { calls.all += 1; },
                zoomToFitHorizontal: () => { calls.horizontal += 1; },
                zoomToFitVertical: () => { calls.vertical += 1; },
            },
        });

        dom.window.document.getElementById('resize-tree-button').click();
        dom.window.document.getElementById('resize-tree-horizontal-button').click();
        dom.window.document.getElementById('resize-tree-vertical-button').click();

        expect(calls.all).toBe(1);
        expect(calls.horizontal).toBe(1);
        expect(calls.vertical).toBe(1);
    });

    it('06.06 expand/collapse styling controls update section visibility actions', () => {
        const calls = { expand: 0, collapse: 0 };
        const { dom } = loadUiEventsContextWithDom(`
            <button id="expand-styling-button"></button>
            <button id="collapse-styling-button"></button>
        `, {
            globalOverrides: {
                expandAllStylingSections: () => { calls.expand += 1; },
                collapseAllStylingSections: () => { calls.collapse += 1; },
            },
        });

        dom.window.document.getElementById('expand-styling-button').click();
        dom.window.document.getElementById('collapse-styling-button').click();

        expect(calls.expand).toBe(1);
        expect(calls.collapse).toBe(1);
    });

    it('06.07 color picker updates background color and triggers redraw', () => {
        let redraws = 0;
        const { context, dom } = loadUiEventsContextWithDom(`
            <input id="color-picker" value="#000000" />
        `, {
            globalOverrides: {
                requestFamilyTreeUpdate: () => { redraws += 1; },
            },
        });

        const picker = dom.window.document.getElementById('color-picker');
        picker.value = '#123456';
        picker.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

        expect(context.window.tree_color).toBe('#123456');
        expect(redraws).toBe(1);
    });

    it('06.08 updateOptionsVisibility shows options button when right column narrower than left', () => {
        const { context } = loadUiContextWithDom('<div></div>');
        const optionsMenu = { style: {} };
        const leftColumnWrapper = { classList: { remove: vi.fn(), add: vi.fn(), contains: () => false } };
        context.optionsMenu = optionsMenu;
        context.leftColumnWrapper = leftColumnWrapper;

        // right narrower than left with wide viewport → show options
        context.leftCol = { offsetWidth: 500 };
        context.rightCol = { offsetWidth: 300 };
        context.window.innerWidth = 1200;
        context.updateOptionsVisibility();
        expect(optionsMenu.style.display).toBe('block');

        // right wider than left with wide viewport → hide options
        context.leftCol = { offsetWidth: 300 };
        context.rightCol = { offsetWidth: 500 };
        context.updateOptionsVisibility();
        expect(optionsMenu.style.display).toBe('none');
        expect(leftColumnWrapper.classList.remove).toHaveBeenCalledWith('open');
    });

    it('06.09 updateMaxLinksState disables max links when no SVG and enables when tree exists', () => {
        const { context } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <span id="generations-up-number-max-link"></span>
            <span id="generations-down-number-max-link"></span>
            <span id="max-stack-size-number-max-link"></span>
        `);

        const ftDiv = context.document.getElementById('family-tree-div');
        context.family_tree_div = ftDiv;

        // no SVG → all max-link controls disabled
        context.updateMaxLinksState();
        const upLink = context.document.getElementById('generations-up-number-max-link');
        expect(upLink.getAttribute('aria-disabled')).toBe('true');
        expect(upLink.style.opacity).toBe('0.5');

        // SVG present → all max-link controls enabled
        ftDiv.innerHTML = '<svg></svg>';
        context.updateMaxLinksState();
        expect(upLink.getAttribute('aria-disabled')).toBe('false');
        expect(upLink.style.opacity).toBe('1');
    });

    it('06.10 openSaveModal uses selected individual name slug and falls back to family-tree', () => {
        const { context } = loadUiContextWithDom('<div></div>');
        const saveFilenameInput = { value: '' };
        const saveModal = { style: {} };
        context.save_filename_input = saveFilenameInput;
        context.save_modal = saveModal;

        // selected individual with spaces → hyphenated slug
        context.window.selected_individual = { name: 'John Smith' };
        context.openSaveModal();
        expect(saveFilenameInput.value).toBe('John-Smith');
        expect(saveModal.style.display).toBe('flex');

        // no selected individual → default fallback
        context.window.selected_individual = null;
        context.openSaveModal();
        expect(saveFilenameInput.value).toBe('family-tree');
    });

    it('06.11 content checkboxes update show_names/show_years/show_places and trigger redraw', () => {
        let redraws = 0;
        const { context, dom } = loadUiEventsContextWithDom(`
            <input id="show-names-checkbox" type="checkbox" />
            <input id="show-years-checkbox" type="checkbox" />
            <input id="show-places-checkbox" type="checkbox" />
        `, {
            globalOverrides: {
                elements: [
                    { id: 'show-names-checkbox', type: 'checkbox', default: true, variable: 'show_names' },
                    { id: 'show-years-checkbox', type: 'checkbox', default: true, variable: 'show_years' },
                    { id: 'show-places-checkbox', type: 'checkbox', default: false, variable: 'show_places' },
                ],
                requestFamilyTreeUpdate: () => { redraws += 1; },
            },
        });

        const names = dom.window.document.getElementById('show-names-checkbox');
        const years = dom.window.document.getElementById('show-years-checkbox');
        const places = dom.window.document.getElementById('show-places-checkbox');

        names.checked = false;
        names.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        years.checked = false;
        years.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        places.checked = true;
        places.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(context.window.show_names).toBe(false);
        expect(context.window.show_years).toBe(false);
        expect(context.window.show_places).toBe(true);
        expect(redraws).toBe(3);
    });

    it('06.12 styling checkboxes update text_shadow/transparent_background and trigger redraw', () => {
        let redraws = 0;
        const { context, dom } = loadUiEventsContextWithDom(`
            <input id="text-shadow-checkbox" type="checkbox" />
            <input id="transparent-background-checkbox" type="checkbox" />
        `, {
            globalOverrides: {
                elements: [
                    { id: 'text-shadow-checkbox', type: 'checkbox', default: false, variable: 'text_shadow' },
                    { id: 'transparent-background-checkbox', type: 'checkbox', default: false, variable: 'transparent_background' },
                ],
                requestFamilyTreeUpdate: () => { redraws += 1; },
            },
        });

        const textShadow = dom.window.document.getElementById('text-shadow-checkbox');
        const transparent = dom.window.document.getElementById('transparent-background-checkbox');

        textShadow.checked = true;
        textShadow.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        transparent.checked = true;
        transparent.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(context.window.text_shadow).toBe(true);
        expect(context.window.transparent_background).toBe(true);
        expect(redraws).toBe(2);
    });

    it('06.13 browse input change forwards selected GEDCOM file to selectGedcomFile', () => {
        const fileCalls = [];
        const { dom } = loadUiEventsContextWithDom(`
            <input id="file-input-button" type="file" />
        `, {
            globalOverrides: {
                selectGedcomFile: (file) => { fileCalls.push(file); },
            },
        });

        const fileInput = dom.window.document.getElementById('file-input-button');
        const selectedFile = { name: 'sample.ged' };
        Object.defineProperty(fileInput, 'files', {
            configurable: true,
            value: [selectedFile],
        });

        fileInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(fileCalls).toHaveLength(1);
        expect(fileCalls[0]).toBe(selectedFile);
    });

    it('06.14 root-person select change requests redraw', () => {
        let redraws = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <select id="individual-select">
                <option value="@I1@">Root</option>
            </select>
        `, {
            globalOverrides: {
                requestFamilyTreeUpdate: () => { redraws += 1; },
            },
        });

        const select = dom.window.document.getElementById('individual-select');
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(redraws).toBe(1);
    });

    it('06.16 window resize triggers options visibility update, body scaling, and redraw', () => {
        let redraws = 0;
        let optionsUpdates = 0;
        let bodyScales = 0;
        let resizeHandler = null;

        loadUiEventsContextWithDom('<div></div>', {
            windowOverrides: {
                addEventListener: (eventName, handler) => {
                    if (eventName === 'resize') resizeHandler = handler;
                },
            },
            globalOverrides: {
                requestFamilyTreeUpdate: () => { redraws += 1; },
                updateOptionsVisibility: () => { optionsUpdates += 1; },
                scaleBodyForSmallScreens: () => { bodyScales += 1; },
            },
        });

        expect(typeof resizeHandler).toBe('function');

        resizeHandler();

        expect(optionsUpdates).toBeGreaterThanOrEqual(2);
        expect(bodyScales).toBeGreaterThanOrEqual(2);
        expect(redraws).toBe(1);
    });

    it('06.17 save modal OK with empty filename shows error and does not save', () => {
        let savesCalled = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <div id="save-modal"></div>
            <button id="save-modal-ok-button"></button>
            <button id="save-modal-cancel-button"></button>
            <input id="save-filename-input" value="" />
            <span id="save-filename-error" style="display:none;"></span>
            <input type="radio" name="save-format" value="png" checked />
        `, {
            globalOverrides: {
                savePNG: () => { savesCalled += 1; },
                saveSVG: () => { savesCalled += 1; },
            },
        });

        dom.window.document.getElementById('save-modal-ok-button').click();

        const errorSpan = dom.window.document.getElementById('save-filename-error');
        expect(errorSpan.style.display).not.toBe('none');
        expect(savesCalled).toBe(0);
    });

    it('06.18 selectGedcomFile renders file name as text in status bar', () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <input id="individual-filter-text" />
            <select id="individual-select"></select>
            <div id="status-bar-div"></div>
        `);

        context.validateGedcom = () => true;
        context.parseGedcomData = () => ({ individuals: [{ id: '@I1@' }], families: [{ id: '@F1@' }] });
        context.populateIndividualSelect = () => {};
        context.FileReader = class {
            readAsArrayBuffer() {
                const bytes = Uint8Array.from([48, 32, 72, 69, 65, 68, 10, 48, 32, 84, 82, 76, 82]);
                this.onload({ target: { result: bytes.buffer } });
            }
        };

        const file = { name: 'evil<img src=x onerror=1>.ged' };
        context.selectGedcomFile(file);
        const statusBar = dom.window.document.getElementById('status-bar-div');
        expect(statusBar.querySelector('img')).toBeNull();
        expect(statusBar.textContent).toContain('evil<img src=x onerror=1>.ged');
        expect(statusBar.querySelector('b')?.textContent).toBe('evil<img src=x onerror=1>.ged');
    });

    it('06.19 decodeGedcomArrayBuffer decodes ANSI-declared bytes for Norse characters', () => {
        const { context } = loadUiContextWithDom('<div></div>');

        const ansiGedcom = [
            '0 HEAD',
            '1 CHAR ANSI',
            '0 @I1@ INDI',
            '1 NAME Þór /Óðinsson/',
            '0 TRLR',
        ].join('\n');
        const ansiBytes = new Uint8Array(Buffer.from(ansiGedcom, 'latin1'));
        const decoded = context.decodeGedcomArrayBuffer(ansiBytes.buffer);

        expect(decoded.declared_charset).toBe('ANSI');
        expect(decoded.decoded_with).toBe('windows-1252');
        expect(decoded.content).toContain('1 NAME Þór /Óðinsson/');
    });

    it('06.20 decodeGedcomArrayBuffer preserves UTF-8 multibyte characters', () => {
        const { context } = loadUiContextWithDom('<div></div>');

        const utfGedcom = [
            '0 HEAD',
            '1 CHAR UTF-8',
            '0 @I1@ INDI',
            '1 NAME José /Muñoz/',
            '0 TRLR',
        ].join('\n');
        const utfBytes = new TextEncoder().encode(utfGedcom);
        const decoded = context.decodeGedcomArrayBuffer(utfBytes.buffer);

        expect(decoded.declared_charset).toBe('UTF-8');
        expect(decoded.decoded_with).toBe('utf-8');
        expect(decoded.content).toContain('1 NAME José /Muñoz/');
    });

    it('06.21 hide non-pedigree family checkbox updates state and triggers redraw', () => {
        let redraws = 0;
        const { context, dom } = loadUiEventsContextWithDom(`
            <input id="hide-non-pedigree-family-checkbox" type="checkbox" />
        `, {
            globalOverrides: {
                elements: [
                    { id: 'hide-non-pedigree-family-checkbox', type: 'checkbox', default: false, variable: 'hide_non_pedigree_family' },
                ],
                requestFamilyTreeUpdate: () => { redraws += 1; },
            },
        });

        const checkbox = dom.window.document.getElementById('hide-non-pedigree-family-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(context.window.hide_non_pedigree_family).toBe(true);
        expect(redraws).toBe(1);
    });

    it('06.22 open-online-button click invokes openOnlineGedcomModal', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <button id="open-online-button"></button>
            <div id="online-gedcom-modal" style="display:none;"></div>
            <button id="online-gedcom-cancel-button"></button>
        `, {
            globalOverrides: {
                openOnlineGedcomModal: () => { calls += 1; },
            },
        });

        dom.window.document.getElementById('open-online-button').click();

        expect(calls).toBe(1);
    });

    it('06.23 online gedcom cancel button hides modal', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <button id="open-online-button"></button>
            <div id="online-gedcom-modal" style="display:flex;"></div>
            <button id="online-gedcom-cancel-button"></button>
        `);

        const modal = dom.window.document.getElementById('online-gedcom-modal');
        dom.window.document.getElementById('online-gedcom-cancel-button').click();

        expect(modal.style.display).toBe('none');
    });

    it('06.24 online gedcom modal Escape key hides modal', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <button id="open-online-button"></button>
            <div id="online-gedcom-modal" style="display:flex;"></div>
            <button id="online-gedcom-cancel-button"></button>
        `);

        const modal = dom.window.document.getElementById('online-gedcom-modal');
        modal.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(modal.style.display).toBe('none');
    });

    it('06.25 clicking a list item in the modal calls loadGedcomFromUrl with url and name', () => {
        const calls = [];
        const { dom } = loadUiEventsContextWithDom(`
            <button id="open-online-button"></button>
            <div id="online-gedcom-modal" style="display:flex;">
                <button class="online-gedcom-item" data-url="https://example.com/test.ged" data-name="Test+Family.ged">Test Family</button>
            </div>
            <button id="online-gedcom-cancel-button"></button>
        `, {
            globalOverrides: {
                loadGedcomFromUrl: (url, name) => { calls.push({ url, name }); },
            },
        });

        dom.window.document.querySelector('.online-gedcom-item').click();

        expect(calls).toEqual([{ url: 'https://example.com/test.ged', name: 'Test+Family.ged' }]);
    });

    it('06.26 clicking a disabled list item does not call loadGedcomFromUrl', () => {
        const calls = [];
        const { dom } = loadUiEventsContextWithDom(`
            <button id="open-online-button"></button>
            <div id="online-gedcom-modal" style="display:flex;">
                <button class="online-gedcom-item" data-url="https://example.com/test.ged" data-name="Test+Family.ged" disabled>Test Family</button>
            </div>
            <button id="online-gedcom-cancel-button"></button>
        `, {
            globalOverrides: {
                loadGedcomFromUrl: (url, name) => { calls.push({ url, name }); },
            },
        });

        dom.window.document.querySelector('.online-gedcom-item').click();

        expect(calls).toHaveLength(0);
    });

    it('06.27 openOnlineGedcomModal shows modal and re-enables all items', () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="online-gedcom-modal" style="display:none;">
                <button class="online-gedcom-item" disabled></button>
                <button class="online-gedcom-item" disabled></button>
            </div>
            <div id="online-gedcom-status" style="display:block;">Previous error</div>
        `);

        context.openOnlineGedcomModal();

        const modal = dom.window.document.getElementById('online-gedcom-modal');
        expect(modal.style.display).toBe('flex');
        const status = dom.window.document.getElementById('online-gedcom-status');
        expect(status.style.display).toBe('none');
        const items = dom.window.document.querySelectorAll('.online-gedcom-item');
        items.forEach(btn => expect(btn.disabled).toBe(false));
    });

    it('06.28 loadGedcomFromUrl on success parses GEDCOM and updates file-name span', async () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <input id="individual-filter-text" />
            <select id="individual-select"></select>
            <div id="status-bar-div"></div>
            <div id="online-gedcom-modal" style="display:flex;">
                <div id="online-gedcom-status"></div>
                <button class="online-gedcom-item"></button>
            </div>
        `);

        const gedcomText = '0 HEAD\n1 CHAR UTF-8\n0 @I1@ INDI\n1 NAME John /Doe/\n0 TRLR\n';
        const buffer = new TextEncoder().encode(gedcomText).buffer;
        context.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(buffer) });
        context.validateGedcom = () => true;
        context.parseGedcomData = () => ({ individuals: [{ id: '@I1@' }], families: [] });
        context.populateIndividualSelect = () => {};
        context.file_name_span = { textContent: '' };
        context.individual_filter = dom.window.document.getElementById('individual-filter-text');
        context.family_tree_div = dom.window.document.getElementById('family-tree-div');

        await context.loadGedcomFromUrl('https://example.com/Lincoln+Family.ged', 'Lincoln+Family.ged');

        expect(context.file_name_span.textContent).toBe('Lincoln Family.ged');
        const modal = dom.window.document.getElementById('online-gedcom-modal');
        expect(modal.style.display).toBe('none');
    });

    it('06.29 loadGedcomFromUrl on HTTP error shows error in status div', async () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="online-gedcom-modal" style="display:flex;">
                <div id="online-gedcom-status"></div>
                <button class="online-gedcom-item"></button>
            </div>
        `);

        context.fetch = () => Promise.resolve({ ok: false, status: 404 });

        await context.loadGedcomFromUrl('https://example.com/notfound.ged', 'notfound.ged');

        const status = dom.window.document.getElementById('online-gedcom-status');
        expect(status.style.display).toBe('block');
        expect(status.textContent).toMatch(/HTTP 404/);
    });

    it('06.30 loadGedcomFromUrl on network failure shows error in status div', async () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="online-gedcom-modal" style="display:flex;">
                <div id="online-gedcom-status"></div>
                <button class="online-gedcom-item"></button>
            </div>
        `);

        context.fetch = () => Promise.reject(new Error('Network error'));

        await context.loadGedcomFromUrl('https://example.com/broken.ged', 'broken.ged');

        const status = dom.window.document.getElementById('online-gedcom-status');
        expect(status.style.display).toBe('block');
        expect(status.textContent).toMatch(/Network error/);
    });

    it('06.31 loadGedcomFromUrl on invalid GEDCOM shows error and re-enables items', async () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="online-gedcom-modal" style="display:flex;">
                <div id="online-gedcom-status"></div>
                <button class="online-gedcom-item"></button>
            </div>
        `);

        const buffer = new TextEncoder().encode('NOT A GEDCOM FILE').buffer;
        context.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(buffer) });
        context.validateGedcom = () => false;

        await context.loadGedcomFromUrl('https://example.com/bad.ged', 'bad.ged');

        const status = dom.window.document.getElementById('online-gedcom-status');
        expect(status.style.display).toBe('block');
        expect(status.textContent).toMatch(/valid GEDCOM/);
        const modal = dom.window.document.getElementById('online-gedcom-modal');
        expect(modal.style.display).toBe('flex');
        const item = dom.window.document.querySelector('.online-gedcom-item');
        expect(item.disabled).toBe(false);
    });

    it('06.32 populateIndividualSelect does not modify connection-select', () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <input id="individual-filter-text" />
            <select id="individual-select"></select>
            <select id="connection-select">
                <option value="@I2@">Bob Branch</option>
            </select>
        `);

        context.window.individuals = [
            { id: '@I1@', name: 'Alice Root', birth: '', death: '' },
            { id: '@I2@', name: 'Bob Branch', birth: '', death: '' },
            { id: '@I3@', name: 'Carol Leaf', birth: '', death: '' },
        ];

        context.populateIndividualSelect(context.window.individuals);

        expect(dom.window.document.querySelectorAll('#individual-select option').length).toBe(3);
        // connection-select must remain unchanged
        const connOptions = dom.window.document.querySelectorAll('#connection-select option');
        expect(connOptions.length).toBe(1);
        expect(connOptions[0].value).toBe('@I2@');
    });

    it('06.33 populateConnectionSelect populates connection-select with tree individuals except root', () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <input id="individual-filter-text" />
            <select id="individual-select"></select>
            <select id="connection-select"></select>
        `);

        context.window.selected_individual = { id: '@I1@', name: 'Alice Root' };
        context.window.tree_rows = [[
            [
                { individual: { id: '@I1@', name: 'Alice Root', birth: '', death: '' } },
                { individual: { id: '@I2@', name: 'Bob Branch', birth: '1950', death: '' } },
                { individual: { id: '@I3@', name: 'Carol Leaf', birth: '', death: '2000' } },
            ],
        ]];

        context.populateConnectionSelect();

        const connValues = Array.from(dom.window.document.querySelectorAll('#connection-select option')).map(o => o.value);
        expect(connValues).toEqual(['@I2@', '@I3@']);
    });

    it('06.34 populateConnectionSelect deduplicates individuals appearing in multiple tree nodes', () => {
        const { context, dom } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <input id="individual-filter-text" />
            <select id="individual-select"></select>
            <select id="connection-select"></select>
        `);

        context.window.selected_individual = { id: '@I1@', name: 'Root' };
        context.window.tree_rows = [
            [[
                { individual: { id: '@I1@', name: 'Root', birth: '', death: '' } },
                { individual: { id: '@I2@', name: 'Bob', birth: '', death: '' } },
            ]],
            [[
                { individual: { id: '@I2@', name: 'Bob', birth: '', death: '' } },
                { individual: { id: '@I3@', name: 'Carol', birth: '', death: '' } },
            ]],
        ];

        context.populateConnectionSelect();

        const connValues = Array.from(dom.window.document.querySelectorAll('#connection-select option')).map(o => o.value);
        expect(connValues).toEqual(['@I2@', '@I3@']);
    });

    it('06.35 selecting connection in highlights-select shows connection-container', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <select id="highlights-select">
                <option value="none">None</option>
                <option value="root" selected>Root</option>
                <option value="connection">Connection</option>
            </select>
            <div id="connection-container" class="hidden"></div>
        `);

        const highlightsSelect = dom.window.document.getElementById('highlights-select');
        highlightsSelect.value = 'connection';
        highlightsSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(dom.window.document.getElementById('connection-container').classList.contains('hidden')).toBe(false);
    });

    it('06.36 selecting a non-connection value in highlights-select hides connection-container', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <select id="highlights-select">
                <option value="none">None</option>
                <option value="root">Root</option>
                <option value="connection" selected>Connection</option>
            </select>
            <div id="connection-container"></div>
        `);

        const highlightsSelect = dom.window.document.getElementById('highlights-select');
        highlightsSelect.value = 'root';
        highlightsSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

        expect(dom.window.document.getElementById('connection-container').classList.contains('hidden')).toBe(true);
    });

    it('06.37 filterConnections narrows connection-select options by typed substring', () => {
        vi.useFakeTimers();
        const { context, dom } = loadUiContextWithDom(`
            <div id="family-tree-div"></div>
            <input id="individual-filter-text" />
            <input id="connection-filter-text" />
            <select id="individual-select"></select>
            <select id="connection-select"></select>
        `);

        context.window.selected_individual = { id: '@I1@', name: 'Alice Root' };
        context.window.tree_rows = [[
            [
                { individual: { id: '@I1@', name: 'Alice Root', birth: '', death: '' } },
                { individual: { id: '@I2@', name: 'Bob Branch', birth: '', death: '' } },
                { individual: { id: '@I3@', name: 'Alicia Leaf', birth: '', death: '' } },
            ],
        ]];

        context.populateConnectionSelect();
        expect(dom.window.document.querySelectorAll('#connection-select option').length).toBe(2);

        context.filterConnections('ali');
        vi.advanceTimersByTime(150);

        const optionTexts = Array.from(dom.window.document.querySelectorAll('#connection-select option')).map(o => o.textContent);
        expect(optionTexts).toEqual(['Alicia Leaf']);

        vi.useRealTimers();
    });

    it('06.38 clear connection filter resets text and repopulates all connections', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <button id="clear-connection-filter"></button>
            <input id="connection-filter-text" value="ali" />
            <select id="connection-select"></select>
        `, {
            windowOverrides: {
                connection_filter_value: 'ali',
                tree_rows: [[
                    [
                        { individual: { id: '@I2@', name: 'Bob', birth: '', death: '' } },
                        { individual: { id: '@I3@', name: 'Alicia', birth: '', death: '' } },
                    ],
                ]],
            },
            globalOverrides: {
                populateConnectionSelect: () => {
                    const select = dom.window.document.getElementById('connection-select');
                    select.innerHTML = '<option>@I2@</option><option>@I3@</option>';
                },
            },
        });

        dom.window.document.getElementById('clear-connection-filter').click();

        expect(dom.window.document.getElementById('connection-filter-text').value).toBe('');
        expect(dom.window.document.querySelectorAll('#connection-select option').length).toBe(2);
    });

    it('06.39 connection-select change sets connection_selected_id and triggers redraw when highlight_type is connection', () => {
        let redrawCalled = false;
        const { context, dom } = loadUiEventsContextWithDom(`
            <select id="connection-select">
                <option value="@I2@">Father</option>
            </select>
        `, {
            windowOverrides: { highlight_type: 'connection' },
            globalOverrides: { requestFamilyTreeUpdate: () => { redrawCalled = true; } },
        });

        const sel = dom.window.document.getElementById('connection-select');
        sel.value = '@I2@';
        sel.dispatchEvent(new dom.window.Event('change'));

        expect(context.window.connection_selected_id).toBe('@I2@');
        expect(redrawCalled).toBe(true);
    });

    it('06.40 connection-select change sets connection_selected_id but does not trigger redraw when highlight_type is not connection', () => {
        let redrawCalled = false;
        const { context, dom } = loadUiEventsContextWithDom(`
            <select id="connection-select">
                <option value="@I2@">Father</option>
            </select>
        `, {
            windowOverrides: { highlight_type: 'pedigree' },
            globalOverrides: { requestFamilyTreeUpdate: () => { redrawCalled = true; } },
        });

        const sel = dom.window.document.getElementById('connection-select');
        sel.value = '@I2@';
        sel.dispatchEvent(new dom.window.Event('change'));

        expect(context.window.connection_selected_id).toBe('@I2@');
        expect(redrawCalled).toBe(false);
    });

    it('06.41 updateRangeThumbs sets highlighted-text-brightness-range thumb to its own value, not text-brightness-range value', () => {
        const html = `
            <input type="range" id="text-brightness-range" value="50">
            <input type="range" id="highlighted-text-brightness-range" value="80">
        `;
        const dom = new JSDOM(html);
        const textBrightnessEl = dom.window.document.getElementById('text-brightness-range');

        const context = loadBrowserScript('src/js/ui.js', {
            windowOverrides: {
                document: dom.window.document,
                addEventListener: () => {},
                individuals: [],
                families: [],
                gedcom_content: '',
                individual_filter_value: '',
                selected_individual: '',
                tree_color: '#000000',
            },
            globalOverrides: {
                document: dom.window.document,
                Event: dom.window.Event,
                d3: { hcl: (h, c, l) => `hcl(${h},${c},${l})` },
                optionsMenu: { style: {} },
                leftColumnWrapper: { classList: { remove: () => {}, add: () => {}, contains: () => false }, style: {} },
                leftCol: { offsetWidth: 300 },
                rightCol: { offsetWidth: 500 },
                family_tree_div: { querySelector: () => null, innerHTML: '' },
                expand_styling_button: { style: {} },
                collapse_styling_button: { style: {} },
                file_name_span: { textContent: '' },
                individual_filter: { value: '' },
                connection_filter: { value: '' },
                individual_select: { innerHTML: '' },
                connection_select: { innerHTML: '', appendChild: () => {} },
                generations_up_number: { value: '1' },
                generations_down_number: { value: '1' },
                max_stack_size_number: { value: '1' },
                hue_element: { value: '180' },
                sat_element: { value: '20' },
                lum_element: { value: '30' },
                text_lum_element: textBrightnessEl,
                root_name: null,
                color_picker: { value: '#000000' },
                save_filename_input: { value: '' },
                save_modal: { style: {} },
                style_presets: {},
                filter_timeout: null,
                update_in_progress: false,
                update_waiting: false,
                update_timeout: null,
                elements: [
                    { id: 'text-brightness-range',             type: 'range', default: 80, min: 0, max: 100, variable: 'text_brightness' },
                    { id: 'highlighted-text-brightness-range', type: 'range', default: 80, min: 0, max: 100, variable: 'highlighted_text_brightness' },
                ],
            },
        });

        context.updateRangeThumbs();

        const highlightedEl = dom.window.document.getElementById('highlighted-text-brightness-range');
        // highlighted-text-brightness-range has value 80; text-brightness-range has value 50.
        // The thumb color must reflect the element's own value (lum=80), not text-brightness-range's (lum=50).
        expect(highlightedEl.style.getPropertyValue('--range-thumb-highlighted-text-color')).toBe('hcl(180,0,80)');
    });
});
