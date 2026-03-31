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
            connection_filter_timeout: null,
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
        add_preset_button: dom.window.document.getElementById('add-preset-button') || { addEventListener: () => {} },
        save_preset_button: dom.window.document.getElementById('save-preset-button') || { addEventListener: () => {} },
        rename_preset_button: dom.window.document.getElementById('rename-preset-button') || { addEventListener: () => {} },
        reload_preset_button: dom.window.document.getElementById('reload-preset-button') || { addEventListener: () => {} },
        delete_preset_button: dom.window.document.getElementById('delete-preset-button') || { addEventListener: () => {} },
        add_preset_modal: dom.window.document.getElementById('add-preset-modal') || { addEventListener: () => {}, style: {} },
        add_preset_modal_ok_button: dom.window.document.getElementById('add-preset-modal-ok-button') || { addEventListener: () => {}, click: () => {} },
        add_preset_modal_cancel_button: dom.window.document.getElementById('add-preset-modal-cancel-button') || { addEventListener: () => {} },
        rename_preset_modal: dom.window.document.getElementById('rename-preset-modal') || { addEventListener: () => {}, style: {} },
        rename_preset_modal_ok_button: dom.window.document.getElementById('rename-preset-modal-ok-button') || { addEventListener: () => {}, click: () => {} },
        rename_preset_modal_cancel_button: dom.window.document.getElementById('rename-preset-modal-cancel-button') || { addEventListener: () => {} },
        save_tree_button: dom.window.document.getElementById('save-tree-button') || { addEventListener: () => {} },
        save_modal_cancel_button: dom.window.document.getElementById('save-modal-cancel-button') || { addEventListener: () => {}, click: () => {} },
        save_modal: dom.window.document.getElementById('save-modal') || { addEventListener: () => {}, style: {} },
        resize_tree_button: dom.window.document.getElementById('resize-tree-button') || { addEventListener: () => {} },
        resize_tree_horizontal_button: dom.window.document.getElementById('resize-tree-horizontal-button') || { addEventListener: () => {} },
        resize_tree_vertical_button: dom.window.document.getElementById('resize-tree-vertical-button') || { addEventListener: () => {} },
        expand_styling_button: dom.window.document.getElementById('expand-styling-button') || { addEventListener: () => {} },
        collapse_styling_button: dom.window.document.getElementById('collapse-styling-button') || { addEventListener: () => {} },
        connection_container: dom.window.document.getElementById('connection-container') || { classList: { add: () => {}, remove: () => {} } },
        about_button: dom.window.document.getElementById('about-button') || { addEventListener: () => {} },
        about_modal: dom.window.document.getElementById('about-modal') || { addEventListener: () => {}, style: {} },
        about_modal_close_button: dom.window.document.getElementById('about-modal-close-button') || { addEventListener: () => {} },
    };

    const context = loadBrowserScript('src/js/ui_events.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            individuals: [],
            individual_filter_value: '',
            connection_filter_value: '',
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
            openAboutModal: () => {},
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

function loadUiWithAddPresetDom(html, overrides = {}) {
    const dom = new JSDOM(html);
    const style_presets = overrides.style_presets || {};
    const elements_override = overrides.elements || [];
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
            location: { protocol: 'file:' },
            ...overrides.windowOverrides,
        },
        globalOverrides: {
            document: dom.window.document,
            Event: dom.window.Event,
            Blob,
            URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
            d3: { hcl: () => ({}) },
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
            text_lum_element: { value: '80' },
            root_name: null,
            color_picker: dom.window.document.getElementById('color-picker') || { value: '#000000' },
            save_filename_input: { value: '' },
            save_modal: { style: {} },
            add_preset_modal: dom.window.document.getElementById('add-preset-modal') || { style: {} },
            add_preset_name_input: dom.window.document.getElementById('add-preset-name-input') || { value: '', focus: () => {} },
            preset_select: dom.window.document.getElementById('preset-select') || { appendChild: () => {}, value: '' },
            rename_preset_modal: dom.window.document.getElementById('rename-preset-modal') || { style: {} },
            rename_preset_name_input: dom.window.document.getElementById('rename-preset-name-input') || { value: '', focus: () => {} },
            rename_preset_button: dom.window.document.getElementById('rename-preset-button') || { parentElement: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } } },
            delete_preset_button: dom.window.document.getElementById('delete-preset-button') || { parentElement: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } } },
            style_presets,
            elements: elements_override,
            filter_timeout: null,
            connection_filter_timeout: null,
            update_in_progress: false,
            update_waiting: false,
            update_timeout: null,
            ...overrides.globalOverrides,
        },
    });
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
                connection_filter_timeout: null,
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

    it('06.42 addPreset opens the modal and clears the name input', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="old-value" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <select id="preset-select"></select>
        `);

        context.addPreset();

        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('flex');
        expect(dom.window.document.getElementById('add-preset-name-input').value).toBe('');
    });

    it('06.43 addPreset hides any pre-existing name error', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <span id="add-preset-name-error" style="display:block;">previous error</span>
            <select id="preset-select"></select>
        `);

        context.addPreset();

        expect(dom.window.document.getElementById('add-preset-name-error').style.display).toBe('none');
    });

    it('06.44 confirmAddPreset with empty name shows error and does not create preset', () => {
        const style_presets = {};
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings"></div>
            <select id="preset-select"></select>
        `, { style_presets });

        context.confirmAddPreset();

        expect(dom.window.document.getElementById('add-preset-name-error').style.display).not.toBe('none');
        expect(Object.keys(style_presets)).toHaveLength(0);
        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('flex');
    });

    it('06.45 confirmAddPreset with duplicate name prompts to replace; declining leaves modal open and preset unchanged', () => {
        const existing = { 'node-width': 100 };
        const style_presets = { 'my-preset': existing };
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="my-preset" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings"></div>
            <select id="preset-select"><option value="my-preset">my-preset</option></select>
        `, { style_presets });
        context.window.confirm = () => false;

        context.confirmAddPreset();

        expect(style_presets['my-preset']).toBe(existing);
        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('flex');
    });


    it('06.46 confirmAddPreset includes only checked settings in the created preset', () => {
        const style_presets = {};
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="partial" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="node-width" checked />
                <input type="checkbox" name="preset-setting" value="node-height" />
                <input type="checkbox" name="preset-setting" value="text-size" checked />
            </div>
            <select id="preset-select"></select>
        `, {
            style_presets,
            elements: [
                { id: 'node-width-number',  type: 'number', default: 100, min: 20, max: 480, variable: 'box_width' },
                { id: 'node-height-number', type: 'number', default: 100, min: 20, max: 480, variable: 'box_height' },
                { id: 'text-size-number',   type: 'number', default: 16,  min: 1,  max: 100, variable: 'text_size' },
            ],
            windowOverrides: { box_width: 120, box_height: 80, text_size: 18 },
        });

        context.confirmAddPreset();

        expect(style_presets['partial']['node-width']).toBe(120);
        expect(style_presets['partial']['text-size']).toBe(18);
        expect(style_presets['partial']['node-height']).toBeUndefined();
    });

    it('06.47 confirmAddPreset captures background-color and highlight-type when checked', () => {
        const style_presets = {};
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="color-preset" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="background-color" checked />
                <input type="checkbox" name="preset-setting" value="highlight-type" checked />
            </div>
            <input type="color" id="color-picker" value="#abcdef" />
            <select id="highlights-select"><option value="pedigree" selected>Pedigree</option></select>
            <select id="preset-select"></select>
        `, {
            style_presets,
            elements: [
                { id: 'color-picker', type: 'color', variable: 'tree_color', preset_key: 'background-color' },
                { id: 'highlights-select', type: 'select', variable: 'highlight_type', preset_key: 'highlight-type' },
            ],
            windowOverrides: { tree_color: '#abcdef', highlight_type: 'pedigree' },
        });

        context.confirmAddPreset();

        expect(style_presets['color-preset']['background-color']).toBe('#abcdef');
        expect(style_presets['color-preset']['highlight-type']).toBe('pedigree');
    });

    it('06.56 confirmAddPreset with duplicate name: confirming replaces the preset and closes modal', () => {
        const style_presets = { 'my-preset': { 'node-width': 100 } };
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="my-preset" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="node-width" checked />
            </div>
            <select id="preset-select"><option value="my-preset">my-preset</option></select>
        `, {
            style_presets,
            elements: [
                { id: 'node-width-number', type: 'number', default: 100, min: 20, max: 480, variable: 'box_width' },
            ],
            windowOverrides: { box_width: 200 },
        });
        context.window.confirm = () => true;

        context.confirmAddPreset();

        expect(style_presets['my-preset']['node-width']).toBe(200);
        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('none');
        expect(dom.window.document.querySelectorAll('#preset-select option')).toHaveLength(1);
    });

    it('06.57 confirmAddPreset replacing a preset updates the existing option text, not adds a new one', () => {
        const style_presets = { 'my-preset': { 'node-width': 100 } };
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="my-preset" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings"></div>
            <select id="preset-select"><option value="my-preset">my-preset</option></select>
        `, { style_presets });
        context.window.confirm = () => true;

        context.confirmAddPreset();

        const options = dom.window.document.querySelectorAll('#preset-select option');
        expect(options).toHaveLength(1);
        expect(options[0].value).toBe('my-preset');
    });

    it('06.58 confirmAddPreset detects duplicate when user types the display text of a preset whose option value differs', () => {
        const style_presets = { 'traditional': { 'node-width': 48 } };
        let confirmMessage = '';
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="Traditional" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="node-width" checked />
            </div>
            <select id="preset-select"><option value="traditional">Traditional</option></select>
        `, {
            style_presets,
            elements: [
                { id: 'node-width-number', type: 'number', default: 100, min: 20, max: 480, variable: 'box_width' },
            ],
            windowOverrides: { box_width: 75 },
        });
        context.window.confirm = (msg) => { confirmMessage = msg; return true; };

        context.confirmAddPreset();

        // Confirm was prompted
        expect(confirmMessage).toMatch(/Traditional/);
        // Existing preset was updated under the original lowercase key
        expect(style_presets['traditional']['node-width']).toBe(75);
        // No new preset key was created
        expect(style_presets['Traditional']).toBeUndefined();
        // No duplicate option was added
        expect(dom.window.document.querySelectorAll('#preset-select option')).toHaveLength(1);
    });

    it('06.48 confirmAddPreset adds option to preset-select, selects it, and closes modal', () => {
        const style_presets = {};
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="new-preset" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings"></div>
            <select id="preset-select"></select>
        `, { style_presets });

        context.confirmAddPreset();

        const options = dom.window.document.querySelectorAll('#preset-select option');
        expect(options).toHaveLength(1);
        expect(options[0].value).toBe('new-preset');
        expect(dom.window.document.getElementById('preset-select').value).toBe('new-preset');
        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('none');
    });

    it('06.49 add-preset-button click invokes addPreset', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { addPreset: () => { calls += 1; } },
        });

        dom.window.document.getElementById('add-preset-button').click();

        expect(calls).toBe(1);
    });

    it('06.50 add-preset-modal OK button invokes confirmAddPreset', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { confirmAddPreset: () => { calls += 1; } },
        });

        dom.window.document.getElementById('add-preset-modal-ok-button').click();

        expect(calls).toBe(1);
    });

    it('06.51 add-preset-modal cancel button hides modal', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `);

        dom.window.document.getElementById('add-preset-modal-cancel-button').click();

        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('none');
    });

    it('06.52 add-preset-modal Enter key triggers OK button', () => {
        let okClicks = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `);

        dom.window.document.getElementById('add-preset-modal-ok-button').addEventListener('click', () => { okClicks += 1; });

        dom.window.document.getElementById('add-preset-modal')
            .dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

        expect(okClicks).toBe(1);
    });

    it('06.53 add-preset-modal Escape key hides modal', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `);

        dom.window.document.getElementById('add-preset-modal')
            .dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('none');
    });

    it('06.54 All toggle button checks all checkboxes in its group', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:flex;">
                <button class="add-preset-group-toggle" data-group="size" data-check="true">All</button>
                <div id="add-preset-group-size">
                    <input type="checkbox" name="preset-setting" value="node-width" />
                    <input type="checkbox" name="preset-setting" value="node-height" />
                    <input type="checkbox" name="preset-setting" value="text-size" />
                </div>
            </div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `);

        dom.window.document.querySelector('.add-preset-group-toggle[data-check="true"]').click();

        const checkboxes = dom.window.document.querySelectorAll('#add-preset-group-size input[type="checkbox"]');
        checkboxes.forEach(cb => expect(cb.checked).toBe(true));
    });

    it('06.55 None toggle button unchecks all checkboxes in its group', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:flex;">
                <button class="add-preset-group-toggle" data-group="content" data-check="false">None</button>
                <div id="add-preset-group-content">
                    <input type="checkbox" name="preset-setting" value="max-stack-size" checked />
                    <input type="checkbox" name="preset-setting" value="show-names" checked />
                    <input type="checkbox" name="preset-setting" value="show-years" checked />
                </div>
            </div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `);

        dom.window.document.querySelector('.add-preset-group-toggle[data-check="false"]').click();

        const checkboxes = dom.window.document.querySelectorAll('#add-preset-group-content input[type="checkbox"]');
        checkboxes.forEach(cb => expect(cb.checked).toBe(false));
    });

    it('06.59 savePreset opens the add-preset modal', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
        `);

        context.savePreset();

        expect(dom.window.document.getElementById('add-preset-modal').style.display).toBe('flex');
    });

    it('06.60 savePreset pre-populates the name input with the selected preset display text', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <select id="preset-select">
                <option value="traditional">Traditional</option>
                <option value="balanced">Balanced</option>
            </select>
        `);
        dom.window.document.getElementById('preset-select').value = 'balanced';

        context.savePreset();

        expect(dom.window.document.getElementById('add-preset-name-input').value).toBe('Balanced');
    });

    it('06.61 savePreset sets the name input to read-only', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
        `);

        context.savePreset();

        expect(dom.window.document.getElementById('add-preset-name-input').readOnly).toBe(true);
    });

    it('06.62 confirmAddPreset in save mode updates the preset without prompting', () => {
        const style_presets = { 'traditional': { 'node-width': 48 } };
        let confirmCalled = false;
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;" data-save-mode="true"></div>
            <input id="add-preset-name-input" value="Traditional" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="node-width" checked />
            </div>
            <select id="preset-select"><option value="traditional">Traditional</option></select>
        `, {
            style_presets,
            elements: [
                { id: 'node-width-number', type: 'number', default: 100, min: 20, max: 480, variable: 'box_width' },
            ],
            windowOverrides: { box_width: 120 },
        });
        context.window.confirm = () => { confirmCalled = true; return true; };

        context.confirmAddPreset();

        expect(confirmCalled).toBe(false);
        expect(style_presets['traditional']['node-width']).toBe(120);
    });

    it('06.63 confirmAddPreset in save mode clears readOnly and saveMode on close', () => {
        const style_presets = { 'traditional': { 'node-width': 48 } };
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;" data-save-mode="true"></div>
            <input id="add-preset-name-input" value="Traditional" readonly />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings"></div>
            <select id="preset-select"><option value="traditional">Traditional</option></select>
        `, { style_presets });

        context.confirmAddPreset();

        const input = dom.window.document.getElementById('add-preset-name-input');
        expect(input.readOnly).toBe(false);
        const modal = dom.window.document.getElementById('add-preset-modal');
        expect(modal.dataset.saveMode).toBeUndefined();
    });

    it('06.64 save-preset-button click invokes savePreset', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { savePreset: () => { calls += 1; } },
        });

        dom.window.document.getElementById('save-preset-button').click();

        expect(calls).toBe(1);
    });

    it('06.65 renamePreset shows the rename modal pre-filled with the current preset name', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
                <option value="balanced">Balanced</option>
            </select>
            <div id="rename-preset-modal" style="display:none;"></div>
            <input id="rename-preset-name-input" value="" />
            <span id="rename-preset-name-error" style="display:none;"></span>
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, { style_presets: { traditional: {}, balanced: {} } });
        dom.window.document.getElementById('preset-select').value = 'balanced';

        context.renamePreset();

        expect(dom.window.document.getElementById('rename-preset-name-input').value).toBe('Balanced');
        expect(dom.window.document.getElementById('rename-preset-modal').style.display).toBe('flex');
    });

    it('06.66 confirmRenamePreset renames the preset and updates the option', () => {
        const style_presets = { traditional: { 'node-width': 48 } };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
            <div id="rename-preset-modal" style="display:flex;"></div>
            <input id="rename-preset-name-input" value="Classic" />
            <span id="rename-preset-name-error" style="display:none;"></span>
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, { style_presets });

        context.confirmRenamePreset();

        expect(style_presets['Classic']).toBeDefined();
        expect(style_presets['traditional']).toBeUndefined();
        const option = dom.window.document.querySelector('#preset-select option');
        expect(option.value).toBe('Classic');
        expect(option.textContent).toBe('Classic');
        expect(dom.window.document.getElementById('preset-select').value).toBe('Classic');
        expect(dom.window.document.getElementById('rename-preset-modal').style.display).toBe('none');
    });

    it('06.67 confirmRenamePreset shows inline error when the entered name is already taken', () => {
        const style_presets = { traditional: {}, balanced: {} };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
                <option value="balanced">Balanced</option>
            </select>
            <div id="rename-preset-modal" style="display:flex;"></div>
            <input id="rename-preset-name-input" value="Balanced" />
            <span id="rename-preset-name-error" style="display:none;"></span>
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, { style_presets });

        context.confirmRenamePreset();

        const error = dom.window.document.getElementById('rename-preset-name-error');
        expect(error.style.display).toBe('inline');
        expect(error.textContent).toMatch(/Balanced/);
        // preset and option should be unchanged
        expect(style_presets['traditional']).toBeDefined();
        const opts = dom.window.document.querySelectorAll('#preset-select option');
        expect(opts).toHaveLength(2);
    });

    it('06.68 rename-preset-button click invokes renamePreset', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { renamePreset: () => { calls += 1; } },
        });

        dom.window.document.getElementById('rename-preset-button').click();

        expect(calls).toBe(1);
    });

    it('06.69 reload-preset-button click applies the currently selected preset', () => {
        let appliedPreset = null;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#"><img id="reload-preset-button" /></a>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select">
                <option value="traditional">Traditional</option>
                <option value="balanced">Balanced</option>
            </select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { usePresetStyle: (name) => { appliedPreset = name; } },
        });
        dom.window.document.getElementById('preset-select').value = 'balanced';

        dom.window.document.getElementById('reload-preset-button').click();

        expect(appliedPreset).toBe('balanced');
    });

    it('06.70 deletePreset prompts to confirm using the preset display name', () => {
        const style_presets = { traditional: { 'node-width': 48 } };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
        `, { style_presets });
        let confirmMessage = '';
        context.window.confirm = (msg) => { confirmMessage = msg; return false; };

        context.deletePreset();

        expect(confirmMessage).toMatch(/Traditional/);
    });

    it('06.71 deletePreset removes the preset and option when the user confirms', () => {
        const style_presets = { traditional: { 'node-width': 48 }, balanced: {} };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
                <option value="balanced">Balanced</option>
            </select>
        `, { style_presets });
        context.window.confirm = () => true;

        context.deletePreset();

        expect(style_presets['traditional']).toBeUndefined();
        const opts = dom.window.document.querySelectorAll('#preset-select option');
        expect(opts).toHaveLength(1);
        expect(opts[0].value).toBe('balanced');
    });

    it('06.72 deletePreset does not delete when the user cancels', () => {
        const style_presets = { traditional: { 'node-width': 48 } };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
        `, { style_presets });
        context.window.confirm = () => false;

        context.deletePreset();

        expect(style_presets['traditional']).toBeDefined();
        expect(dom.window.document.querySelectorAll('#preset-select option')).toHaveLength(1);
    });

    it('06.73 delete-preset-button click invokes deletePreset', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#"><img id="delete-preset-button" /></a>
            <a href="#"><img id="reload-preset-button" /></a>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#" id="add-preset-button"></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { deletePreset: () => { calls += 1; } },
        });

        dom.window.document.getElementById('delete-preset-button').click();

        expect(calls).toBe(1);
    });

    it('06.74 preset edit buttons are disabled when loaded from a web server', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#"><img id="add-preset-button" /></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="reload-preset-button" /></a>
            <a href="#"><img id="delete-preset-button" /></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            windowOverrides: { location: { protocol: 'https:' } },
        });

        const buttonIds = ['add-preset-button', 'save-preset-button', 'rename-preset-button', 'reload-preset-button', 'delete-preset-button'];
        buttonIds.forEach(id => {
            const anchor = dom.window.document.getElementById(id).parentElement;
            expect(anchor.classList.contains('preset-button-disabled'), `${id} parent should have preset-button-disabled`).toBe(true);
        });
    });

    it('06.75 preset edit buttons are not disabled when loaded locally', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#"><img id="add-preset-button" /></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="reload-preset-button" /></a>
            <a href="#"><img id="delete-preset-button" /></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            windowOverrides: { location: { protocol: 'file:' } },
        });

        const buttonIds = ['add-preset-button', 'save-preset-button', 'rename-preset-button', 'reload-preset-button', 'delete-preset-button'];
        buttonIds.forEach(id => {
            const anchor = dom.window.document.getElementById(id).parentElement;
            expect(anchor.classList.contains('preset-button-disabled'), `${id} parent should not have preset-button-disabled`).toBe(false);
        });
    });

    it('06.76 confirmAddPreset triggers a presets.js download', () => {
        const style_presets = {};
        let blobContent = '';
        const { context } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value="MyPreset" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings"></div>
            <select id="preset-select"></select>
        `, {
            style_presets,
            globalOverrides: {
                Blob: class extends Blob {
                    constructor(parts, opts) { super(parts, opts); blobContent = parts[0]; }
                },
            },
        });

        context.confirmAddPreset();

        expect(blobContent).toContain('const style_presets');
        expect(blobContent).toContain('"MyPreset"');
    });

    it('06.77 confirmRenamePreset triggers a presets.js download', () => {
        const style_presets = { traditional: { 'node-width': 48 } };
        let blobContent = '';
        const { context } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
            <div id="rename-preset-modal" style="display:flex;"></div>
            <input id="rename-preset-name-input" value="Classic" />
            <span id="rename-preset-name-error" style="display:none;"></span>
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, {
            style_presets,
            globalOverrides: {
                Blob: class extends Blob {
                    constructor(parts, opts) { super(parts, opts); blobContent = parts[0]; }
                },
            },
        });

        context.confirmRenamePreset();

        expect(blobContent).toContain('const style_presets');
        expect(blobContent).toContain('"Classic"');
    });

    it('06.78 deletePreset triggers a presets.js download', () => {
        const style_presets = { traditional: {}, balanced: {} };
        let blobContent = '';
        const { context } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
                <option value="balanced">Balanced</option>
            </select>
        `, {
            style_presets,
            globalOverrides: {
                Blob: class extends Blob {
                    constructor(parts, opts) { super(parts, opts); blobContent = parts[0]; }
                },
            },
        });
        context.window.confirm = () => true;

        context.deletePreset();

        expect(blobContent).toContain('const style_presets');
        expect(blobContent).not.toContain('"traditional"');
        expect(blobContent).toContain('"balanced"');
    });

    it('06.79 savePresetsFile uses showSaveFilePicker when available', async () => {
        const style_presets = { traditional: { 'node-width': 48 } };
        let savedContent = '';
        let pickerOptions = null;
        const mockWritable = {
            write: async (text) => { savedContent = text; },
            close: async () => {},
        };
        const mockHandle = { createWritable: async () => mockWritable };
        const { context } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
        `, {
            style_presets,
            windowOverrides: {
                showSaveFilePicker: async (opts) => { pickerOptions = opts; return mockHandle; },
            },
        });

        await context.savePresetsFile();

        expect(pickerOptions.suggestedName).toBe('presets.js');
        expect(savedContent).toContain('const style_presets');
        expect(savedContent).toContain('"traditional"');
    });

    it('06.80 savePresetsFile shows a message in the fallback download path', async () => {
        const style_presets = { traditional: { 'node-width': 48 } };
        let alertMessage = '';
        const { context } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
        `, { style_presets });
        context.window.alert = (msg) => { alertMessage = msg; };

        await context.savePresetsFile();

        expect(alertMessage).toContain('Downloads');
        expect(alertMessage).toContain('src/js/presets.js');
    });

    it('06.81 populatePresetSelect builds options from style_presets keys', () => {
        const style_presets = { traditional: {}, balanced: {}, mypreset: {} };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select"></select>
        `, { style_presets });

        context.populatePresetSelect();

        const options = dom.window.document.querySelectorAll('#preset-select option');
        expect(options).toHaveLength(3);
        expect(options[0].value).toBe('balanced');
        expect(options[0].textContent).toBe('Balanced');
        expect(options[1].value).toBe('mypreset');
        expect(options[2].value).toBe('traditional');
        expect(options[2].textContent).toBe('Traditional');
    });

    it('06.83 populatePresetSelect sorts options alphabetically', () => {
        const style_presets = { zebra: {}, apple: {}, mango: {} };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select"></select>
        `, { style_presets });

        context.populatePresetSelect();

        const values = [...dom.window.document.querySelectorAll('#preset-select option')].map(o => o.value);
        expect(values).toEqual(['apple', 'mango', 'zebra']);
    });

    it('06.82 populatePresetSelect is called during DOMContentLoaded', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <select id="preset-select"></select>
            <a href="#" id="add-preset-button"></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="reload-preset-button" /></a>
            <a href="#"><img id="delete-preset-button" /></a>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { populatePresetSelect: () => { calls += 1; } },
        });

        expect(calls).toBe(1);
    });

    it('06.84 confirmRenamePreset shows inline error when name is empty', () => {
        const style_presets = { traditional: {} };
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
            <div id="rename-preset-modal" style="display:flex;"></div>
            <input id="rename-preset-name-input" value="   " />
            <span id="rename-preset-name-error" style="display:none;"></span>
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, { style_presets });

        context.confirmRenamePreset();

        const error = dom.window.document.getElementById('rename-preset-name-error');
        expect(error.style.display).toBe('inline');
        expect(style_presets['traditional']).toBeDefined();
    });

    it('06.85 rename-preset-modal OK and Cancel buttons are wired during DOMContentLoaded', () => {
        let okCalls = 0;
        let cancelCalls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="reload-preset-button" /></a>
            <a href="#"><img id="delete-preset-button" /></a>
            <select id="preset-select"></select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
            <div id="rename-preset-modal" style="display:none;"></div>
            <input id="rename-preset-name-input" value="" />
            <span id="rename-preset-name-error"></span>
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: {
                confirmRenamePreset: () => { okCalls += 1; },
            },
        });

        dom.window.document.getElementById('rename-preset-modal-ok-button').click();
        dom.window.document.getElementById('rename-preset-modal-cancel-button').click();

        expect(okCalls).toBe(1);
        expect(dom.window.document.getElementById('rename-preset-modal').style.display).toBe('none');
    });

    it('06.86 updatePresetEditButtonState disables rename and delete when Default is selected', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="Default">Default</option>
                <option value="Balanced">Balanced</option>
            </select>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="delete-preset-button" /></a>
        `, { style_presets: { Default: {}, Balanced: {} } });
        dom.window.document.getElementById('preset-select').value = 'Default';

        context.updatePresetEditButtonState();

        const renameParent = dom.window.document.getElementById('rename-preset-button').parentElement;
        const deleteParent = dom.window.document.getElementById('delete-preset-button').parentElement;
        expect(renameParent.classList.contains('preset-button-disabled')).toBe(true);
        expect(deleteParent.classList.contains('preset-button-disabled')).toBe(true);
    });

    it('06.87 updatePresetEditButtonState enables rename and delete when a non-Default preset is selected', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="Default">Default</option>
                <option value="Balanced">Balanced</option>
            </select>
            <a href="#" class="preset-button-disabled"><img id="rename-preset-button" /></a>
            <a href="#" class="preset-button-disabled"><img id="delete-preset-button" /></a>
        `, { style_presets: { Default: {}, Balanced: {} } });
        dom.window.document.getElementById('preset-select').value = 'Balanced';

        context.updatePresetEditButtonState();

        const renameParent = dom.window.document.getElementById('rename-preset-button').parentElement;
        const deleteParent = dom.window.document.getElementById('delete-preset-button').parentElement;
        expect(renameParent.classList.contains('preset-button-disabled')).toBe(false);
        expect(deleteParent.classList.contains('preset-button-disabled')).toBe(false);
    });

    it('06.88 preset-select change event calls updatePresetEditButtonState', () => {
        let calls = 0;
        const { dom } = loadUiEventsContextWithDom(`
            <a href="#" id="add-preset-button"></a>
            <a href="#"><img id="save-preset-button" /></a>
            <a href="#"><img id="rename-preset-button" /></a>
            <a href="#"><img id="reload-preset-button" /></a>
            <a href="#"><img id="delete-preset-button" /></a>
            <select id="preset-select">
                <option value="Default">Default</option>
                <option value="Balanced">Balanced</option>
            </select>
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <button id="add-preset-modal-ok-button"></button>
            <button id="add-preset-modal-cancel-button"></button>
            <div id="rename-preset-modal" style="display:none;"></div>
            <input id="rename-preset-name-input" value="" />
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, {
            globalOverrides: { updatePresetEditButtonState: () => { calls += 1; } },
        });
        const callsAfterInit = calls;

        dom.window.document.getElementById('preset-select').dispatchEvent(new dom.window.Event('change'));

        expect(calls).toBe(callsAfterInit + 1);
    });

    it('06.89 addPreset resets all preset-setting checkboxes to checked', () => {
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="node-width" checked>
                <input type="checkbox" name="preset-setting" value="text-size">
                <input type="checkbox" name="preset-setting" value="hue">
            </div>
            <select id="preset-select"></select>
        `);

        context.addPreset();

        const checkboxes = dom.window.document.querySelectorAll('#add-preset-settings input[type="checkbox"][name="preset-setting"]');
        expect(checkboxes).toHaveLength(3);
        checkboxes.forEach(cb => expect(cb.checked).toBe(true));
    });

    it('06.90 savePreset checks only the checkboxes whose settings are present in the selected preset', () => {
        const style_presets = { traditional: { 'node-width': 48, 'hue': 180 } };
        const { context, dom } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:none;"></div>
            <input id="add-preset-name-input" value="" />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="node-width" checked>
                <input type="checkbox" name="preset-setting" value="text-size" checked>
                <input type="checkbox" name="preset-setting" value="hue">
            </div>
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
        `, { style_presets });

        context.savePreset();

        const nodeWidth = dom.window.document.querySelector('input[value="node-width"]');
        const textSize = dom.window.document.querySelector('input[value="text-size"]');
        const hue = dom.window.document.querySelector('input[value="hue"]');
        expect(nodeWidth.checked).toBe(true);
        expect(textSize.checked).toBe(false);
        expect(hue.checked).toBe(true);
    });

    it('06.91 confirmAddPreset with quotes in the name generates valid loadable presets.js content', () => {
        const style_presets = {};
        let blobContent = '';
        const { context } = loadUiWithAddPresetDom(`
            <div id="add-preset-modal" style="display:flex;"></div>
            <input id="add-preset-name-input" value='My "Best" Preset' />
            <span id="add-preset-name-error" style="display:none;"></span>
            <div id="add-preset-settings">
                <input type="checkbox" name="preset-setting" value="node-width" checked>
            </div>
            <select id="preset-select"></select>
        `, {
            style_presets,
            globalOverrides: {
                Blob: class extends Blob {
                    constructor(parts, opts) { super(parts, opts); blobContent = parts[0]; }
                },
            },
        });

        context.confirmAddPreset();

        expect(() => new Function(blobContent)()).not.toThrow();
        const loaded = new Function(blobContent + '; return style_presets;')();
        expect('My "Best" Preset' in loaded).toBe(true);
    });

    it('06.92 confirmRenamePreset with quotes in the name generates valid loadable presets.js content', () => {
        const style_presets = { traditional: { 'node-width': 48 } };
        let blobContent = '';
        const { context } = loadUiWithAddPresetDom(`
            <select id="preset-select">
                <option value="traditional">Traditional</option>
            </select>
            <div id="rename-preset-modal" style="display:flex;"></div>
            <input id="rename-preset-name-input" value="It's Mine" />
            <span id="rename-preset-name-error" style="display:none;"></span>
            <button id="rename-preset-modal-ok-button"></button>
            <button id="rename-preset-modal-cancel-button"></button>
        `, {
            style_presets,
            globalOverrides: {
                Blob: class extends Blob {
                    constructor(parts, opts) { super(parts, opts); blobContent = parts[0]; }
                },
            },
        });

        context.confirmRenamePreset();

        expect(() => new Function(blobContent)()).not.toThrow();
        const loaded = new Function(blobContent + '; return style_presets;')();
        expect("It's Mine" in loaded).toBe(true);
    });

    it('06.93 about button click invokes openAboutModal', () => {
        let openAboutModalCalled = false;
        loadUiEventsContextWithDom(`
            <button id="about-button"></button>
            <div id="about-modal" style="display:none;"></div>
            <button id="about-modal-close-button"></button>
        `, {
            globalOverrides: {
                openAboutModal: () => { openAboutModalCalled = true; },
            },
        });
        expect(openAboutModalCalled).toBe(false);
        // loadUiEventsContextWithDom fires DOMContentLoaded which wires listeners,
        // so we re-load to get a clean wired context then trigger the click
        let clicked = false;
        const { dom } = loadUiEventsContextWithDom(`
            <button id="about-button"></button>
            <div id="about-modal" style="display:none;"></div>
            <button id="about-modal-close-button"></button>
        `, {
            globalOverrides: {
                openAboutModal: () => { clicked = true; },
            },
        });
        dom.window.document.getElementById('about-button').click();
        expect(clicked).toBe(true);
    });

    it('06.94 about modal close button hides the about modal', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <button id="about-button"></button>
            <div id="about-modal" style="display:flex;"></div>
            <button id="about-modal-close-button"></button>
        `);
        const about_modal_el = dom.window.document.getElementById('about-modal');
        about_modal_el.style.display = 'flex';
        dom.window.document.getElementById('about-modal-close-button').click();
        expect(about_modal_el.style.display).toBe('none');
    });

    it('06.95 Escape key on about modal hides the modal', () => {
        const { dom } = loadUiEventsContextWithDom(`
            <button id="about-button"></button>
            <div id="about-modal" style="display:flex;"></div>
            <button id="about-modal-close-button"></button>
        `);
        const about_modal_el = dom.window.document.getElementById('about-modal');
        about_modal_el.style.display = 'flex';
        const event = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
        about_modal_el.dispatchEvent(event);
        expect(about_modal_el.style.display).toBe('none');
    });

    it('06.96 openAboutModal shows the modal and sets latest version to Checking', async () => {
        const pendingFetch = new Promise(() => {});
        const dom = new JSDOM(`
            <div id="about-modal" style="display:none;"></div>
            <span id="about-latest-version">v0.0.0</span>
        `);
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
                fetch: () => pendingFetch,
                Event: dom.window.Event,
                d3: { hcl: () => ({}) },
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
                text_lum_element: { value: '80' },
                root_name: null,
                color_picker: { value: '#000000' },
                save_filename_input: { value: '' },
                save_modal: { style: {} },
                style_presets: {},
                elements: [],
                filter_timeout: null,
                connection_filter_timeout: null,
                update_in_progress: false,
                update_waiting: false,
                update_timeout: null,
            },
        });
        context.openAboutModal();
        expect(dom.window.document.getElementById('about-modal').style.display).toBe('flex');
        expect(dom.window.document.getElementById('about-latest-version').textContent).toBe('Checking\u2026');
    });

    it('06.97 openAboutModal updates latest version span on successful fetch', async () => {
        const dom = new JSDOM(`
            <div id="about-modal" style="display:none;"></div>
            <span id="about-latest-version">Checking\u2026</span>
        `);
        const mockFetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tag_name: 'v2.5.0' }),
        });
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
                fetch: mockFetch,
                Event: dom.window.Event,
                d3: { hcl: () => ({}) },
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
                text_lum_element: { value: '80' },
                root_name: null,
                color_picker: { value: '#000000' },
                save_filename_input: { value: '' },
                save_modal: { style: {} },
                style_presets: {},
                elements: [],
                filter_timeout: null,
                connection_filter_timeout: null,
                update_in_progress: false,
                update_waiting: false,
                update_timeout: null,
            },
        });
        await context.openAboutModal();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(dom.window.document.getElementById('about-latest-version').textContent).toBe('v2.5.0');
    });

    it('06.98 openAboutModal sets latest version to Unavailable on fetch error', async () => {
        const dom = new JSDOM(`
            <div id="about-modal" style="display:none;"></div>
            <span id="about-latest-version">Checking\u2026</span>
        `);
        const mockFetch = () => Promise.reject(new Error('network'));
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
                fetch: mockFetch,
                Event: dom.window.Event,
                d3: { hcl: () => ({}) },
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
                text_lum_element: { value: '80' },
                root_name: null,
                color_picker: { value: '#000000' },
                save_filename_input: { value: '' },
                save_modal: { style: {} },
                style_presets: {},
                elements: [],
                filter_timeout: null,
                connection_filter_timeout: null,
                update_in_progress: false,
                update_waiting: false,
                update_timeout: null,
            },
        });
        await context.openAboutModal();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(dom.window.document.getElementById('about-latest-version').textContent).toBe('Unavailable');
    });
});
