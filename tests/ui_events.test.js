import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function loadUiEventsWithDom(html) {
    const dom = new JSDOM(html);

    const canvasSize = {
        maxArea: () => {},
        maxWidth: () => {},
        maxHeight: () => {},
    };

    const dummyElement = {
        value: '',
        addEventListener: () => {},
        click: () => {},
    };

    const context = loadBrowserScript('src/js/ui_events.js', {
        windowOverrides: {
            document: dom.window.document,
            addEventListener: () => {},
            location: { protocol: 'file:' },
        },
        globalOverrides: {
            document: dom.window.document,
            Event: dom.window.Event,
            canvasSize,
            elements: [],
            none_links: [],
            auto_links: [],
            save_modal_ok_button: dummyElement,
            save_filename_input: dummyElement,
            clearIndividualFilterbutton: dummyElement,
            clearConnectionFilterbutton: dummyElement,
            individual_filter: dummyElement,
            connection_filter: dummyElement,
            connection_container: { classList: { remove: () => {}, add: () => {} } },
            color_picker: dummyElement,
            optionsMenu: dummyElement,
            file_input: dummyElement,
            open_online_button: dummyElement,
            online_gedcom_modal: dummyElement,
            online_gedcom_cancel_button: dummyElement,
            individual_select: dummyElement,
            connection_select: dummyElement,
            preset_select: dummyElement,
            add_preset_button: dummyElement,
            save_preset_button: dummyElement,
            rename_preset_button: dummyElement,
            reload_preset_button: dummyElement,
            delete_preset_button: dummyElement,
            add_preset_modal: { ...dummyElement, style: {}, dataset: {} },
            add_preset_modal_ok_button: dummyElement,
            add_preset_modal_cancel_button: dummyElement,
            rename_preset_modal: { ...dummyElement, style: {} },
            rename_preset_modal_ok_button: dummyElement,
            rename_preset_modal_cancel_button: dummyElement,
            save_tree_button: dummyElement,
            save_modal_cancel_button: dummyElement,
            save_modal: dummyElement,
            resize_tree_button: dummyElement,
            resize_tree_horizontal_button: dummyElement,
            resize_tree_vertical_button: dummyElement,
            expand_styling_button: dummyElement,
            collapse_styling_button: dummyElement,
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
            calculateMaxStackSize: () => 1,
        },
    });

    return { context, dom };
}

describe('ui events helpers', () => {
    it('gets a number input label from matching label element', () => {
        const { context, dom } = loadUiEventsWithDom(`
            <div>
                <label for="generations-up-number">Generations Up</label>
                <input id="generations-up-number" type="number" value="2" />
            </div>
        `);

        const input = dom.window.document.getElementById('generations-up-number');
        expect(context.getNumberInputLabel(input)).toBe('Generations Up');
    });

    it('falls back to id-derived label when no label element exists', () => {
        const { context, dom } = loadUiEventsWithDom(`
            <div>
                <input id="max-stack-size-number" type="number" value="2" />
            </div>
        `);

        const input = dom.window.document.getElementById('max-stack-size-number');
        expect(context.getNumberInputLabel(input)).toBe('max stack size number');
    });

    it('adds custom steppers once and dispatches input/change on click', () => {
        const { context, dom } = loadUiEventsWithDom(`
            <p>
                <label for="generations-down-number">Generations Down</label>
                <input id="generations-down-number" type="number" value="1" min="0" max="10" />
            </p>
        `);

        const input = dom.window.document.getElementById('generations-down-number');
        let inputCount = 0;
        let changeCount = 0;
        input.addEventListener('input', () => { inputCount += 1; });
        input.addEventListener('change', () => { changeCount += 1; });

        context.setupCustomNumberSteppers();
        context.setupCustomNumberSteppers();

        const wrappers = dom.window.document.querySelectorAll('.number-input-wrapper');
        expect(wrappers.length).toBe(1);
        expect(input.dataset.customStepper).toBe('true');

        const incrementButton = wrappers[0].querySelector('.number-stepper-button');
        incrementButton.click();

        expect(input.value).toBe('2');
        expect(inputCount).toBe(1);
        expect(changeCount).toBe(1);
    });

    it('decrement stepper dispatches input and change when value changes', () => {
        const { context, dom } = loadUiEventsWithDom(`
            <p>
                <label for="stack-size-number">Stack Size</label>
                <input id="stack-size-number" type="number" value="3" min="1" max="10" />
            </p>
        `);

        const input = dom.window.document.getElementById('stack-size-number');
        let inputCount = 0;
        let changeCount = 0;
        input.addEventListener('input', () => { inputCount += 1; });
        input.addEventListener('change', () => { changeCount += 1; });

        context.setupCustomNumberSteppers();

        const buttons = dom.window.document.querySelectorAll('.number-stepper-button');
        const decrementButton = buttons[1];
        decrementButton.click();

        expect(input.value).toBe('2');
        expect(inputCount).toBe(1);
        expect(changeCount).toBe(1);
    });
});