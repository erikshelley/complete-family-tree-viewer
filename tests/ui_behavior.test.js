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
            individual_select: dom.window.document.getElementById('individual-select') || { innerHTML: '' },
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
        color_picker: dom.window.document.getElementById('color-picker') || { value: '#000000', addEventListener: () => {} },
        optionsMenu: dom.window.document.getElementById('options-menu-button') || { addEventListener: () => {}, style: {} },
        file_input: dom.window.document.getElementById('file-input-button') || { addEventListener: () => {} },
        individual_select: dom.window.document.getElementById('individual-select') || { addEventListener: () => {}, innerHTML: '' },
        preset_select: dom.window.document.getElementById('preset-select') || { addEventListener: () => {}, value: '' },
        save_tree_button: dom.window.document.getElementById('save-tree-button') || { addEventListener: () => {} },
        save_modal_cancel_button: dom.window.document.getElementById('save-modal-cancel-button') || { addEventListener: () => {}, click: () => {} },
        save_modal: dom.window.document.getElementById('save-modal') || { addEventListener: () => {}, style: {} },
        resize_tree_button: dom.window.document.getElementById('resize-tree-button') || { addEventListener: () => {} },
        resize_tree_horizontal_button: dom.window.document.getElementById('resize-tree-horizontal-button') || { addEventListener: () => {} },
        resize_tree_vertical_button: dom.window.document.getElementById('resize-tree-vertical-button') || { addEventListener: () => {} },
        expand_styling_button: dom.window.document.getElementById('expand-styling-button') || { addEventListener: () => {} },
        collapse_styling_button: dom.window.document.getElementById('collapse-styling-button') || { addEventListener: () => {} },
    };

    const context = loadBrowserScript('src/js/ui_events.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            individuals: [],
            individual_filter_value: '',
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
            usePresetStyle: () => {},
            openSaveModal: () => {},
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
});
