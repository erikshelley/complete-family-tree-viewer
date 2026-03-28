/* global elements, none_links, auto_links,
    save_modal_ok_button, save_filename_input, clearIndividualFilterbutton,
    individual_filter, color_picker, optionsMenu, file_input, individual_select,
    preset_select, save_tree_button, save_modal_cancel_button, save_modal,
    resize_tree_button, resize_tree_horizontal_button, resize_tree_vertical_button,
    expand_styling_button, collapse_styling_button,
    open_online_button, online_gedcom_modal, online_gedcom_cancel_button */
/* global requestFamilyTreeUpdate, updateRangeThumbs, populateIndividualSelect,
    savePNG, saveSVG, expandAllStylingSections, collapseAllStylingSections,
    toggleOptions, selectGedcomFile, filterIndividuals, usePresetStyle,
    openSaveModal, zoomToFit, zoomToFitHorizontal, zoomToFitVertical,
    scaleBodyForSmallScreens, updateOptionsVisibility, updateMaxLinksState,
    calculateMaxGenUp, calculateMaxGenDown,
    openOnlineGedcomModal, loadGedcomFromUrl */

function getNumberInputLabel(input) {
    if (!input || !input.id) return 'value';
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
    return input.id.replace(/-/g, ' ');
}

function setupCustomNumberSteppers() {
    const number_inputs = document.querySelectorAll('input[type="number"]');
    number_inputs.forEach((input) => {
        if (input.dataset.customStepper === 'true') return;

        const parent = input.parentNode;
        if (!parent) return;

        const wrapper = document.createElement('span');
        wrapper.className = 'number-input-wrapper';

        const controls = document.createElement('span');
        controls.className = 'number-stepper-controls';

        const increment_button = document.createElement('button');
        increment_button.type = 'button';
        increment_button.className = 'number-stepper-button';
        increment_button.textContent = '\u25b2';

        const decrement_button = document.createElement('button');
        decrement_button.type = 'button';
        decrement_button.className = 'number-stepper-button';
        decrement_button.textContent = '\u25bc';

        const label = getNumberInputLabel(input);
        increment_button.setAttribute('aria-label', `Increase ${label}`);
        decrement_button.setAttribute('aria-label', `Decrease ${label}`);

        const applyStep = (delta) => {
            if (input.disabled || input.readOnly) return;
            const old_value = input.value;
            if (delta > 0) input.stepUp(delta);
            else input.stepDown(-delta);
            if (old_value !== input.value) {
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        increment_button.addEventListener('click', function(event) {
            event.preventDefault();
            applyStep(1);
        });

        decrement_button.addEventListener('click', function(event) {
            event.preventDefault();
            applyStep(-1);
        });

        parent.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        controls.appendChild(increment_button);
        controls.appendChild(decrement_button);
        wrapper.appendChild(controls);

        input.dataset.customStepper = 'true';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupCustomNumberSteppers();

    // Setup event listeners for all input elements based on the configuration in ui_declarations.js
    for (const element_info of elements) {
        let element = document.getElementById(element_info.id);
        if (element) {
            if (element_info.type === 'checkbox') {
                element.checked = element_info.default;
                window[element_info.variable] = element_info.default;
                element.addEventListener('change', function(event) {
                    window[element_info.variable] = event.target.checked;
                    requestFamilyTreeUpdate();
                });
            }
            else if ((element_info.type === 'range') || (element_info.type === 'number')) {
                element.linked_element = (element_info.type === 'range') ?
                    document.getElementById(element_info.id.replace('range', 'number')) :
                    document.getElementById(element_info.id.replace('number', 'range'));
                element.value = element_info.default;
                window[element_info.variable] = element_info.default;
                element.addEventListener('input', function(event) {
                    let max = element_info.max;
                    if (element_info.variable === 'generations_up' && window.selected_individual) max = calculateMaxGenUp(window.selected_individual);
                    if (element_info.variable === 'generations_down' && window.selected_individual) {
                        window.visited_individuals = null;
                        max = calculateMaxGenDown(window.selected_individual);
                    }
                    let val = parseInt(event.target.value);
                    if ((element_info.min !== undefined) && (val < element_info.min)) val = element_info.min;
                    if ((element_info.max !== undefined) && (val > max)) val = max;
                    window[element_info.variable] = val;
                    if (event.target.linked_element) event.target.linked_element.value = val;
                    updateRangeThumbs();
                    requestFamilyTreeUpdate();
                });
            }
            else if (element_info.type === 'select') {
                element.value = element_info.default;
                window[element_info.variable] = element_info.default;
                element.addEventListener('change', function(event) {
                    window[element_info.variable] = event.target.value;
                    requestFamilyTreeUpdate();
                });
            }
        }
        let link_element = document.getElementById(element_info.id + '-max-link');
        if (link_element && element_info.max !== undefined) {
            link_element.addEventListener('click', function(e) {
                e.preventDefault();
                let max = element_info.max;
                if (element_info.variable === 'generations_up' && window.selected_individual) max = calculateMaxGenUp(window.selected_individual);
                if (element_info.variable === 'generations_down' && window.selected_individual) {
                    window.visited_individuals = null;
                    max = calculateMaxGenDown(window.selected_individual);
                }
                element.value = max;
                window[element_info.variable] = max;
                requestFamilyTreeUpdate();
            });
        }
    }

    // Listen to inputs for resetting highlight intensity to 100%
    for (const link_info of none_links) {
        const link_element = document.getElementById(link_info.id);
        if (link_element) {
            link_element.addEventListener('click', function(e) {
                e.preventDefault();
                window[link_info.variable] = 100;
                const range_element = document.getElementById(link_info.id.replace('no-', '') + '-range');
                const number_element = document.getElementById(link_info.id.replace('no-', '') + '-number');
                if (range_element) range_element.value = 100;
                if (number_element) number_element.value = 100;
                updateRangeThumbs();
                requestFamilyTreeUpdate();
            });
        }
    }

    // Listen to inputs for resetting auto link sizes to default
    for (const link_info of auto_links) {
        const link_element = document.getElementById(link_info.id);
        if (link_element) {
            link_element.addEventListener('click', function(e) {
                e.preventDefault();
                if (window['auto_' + link_info.variable] > 0) {
                    const range_element = document.getElementById(link_info.id.replace('auto-', '') + '-range');
                    const number_element = document.getElementById(link_info.id.replace('auto-', '') + '-number');
                    range_element.value = Math.ceil(window['auto_' + link_info.variable] / 10) * 10;
                    window[link_info.variable] = parseInt(range_element.value) || window[link_info.variable + '_default'];
                    number_element.value = window[link_info.variable];
                    updateRangeThumbs();
                    requestFamilyTreeUpdate();
                }
            });
        }
    }

    save_modal_ok_button.addEventListener('click', function() {
        const save_filename_error = document.getElementById('save-filename-error');
        if (!save_filename_input.value.trim()) {
            if (save_filename_error) save_filename_error.style.display = 'inline';
            return;
        }
        if (save_filename_error) save_filename_error.style.display = 'none';
        window.save_filename = save_filename_input.value;
        document.getElementById('save-modal').style.display = 'none';
        // Determine selected format
        const save_format_input = document.querySelector('input[name="save-format"]:checked');
        if (save_format_input.value === 'png') savePNG();
        if (save_format_input.value === 'svg') saveSVG();
    });

    clearIndividualFilterbutton.addEventListener('click', function() {
        individual_filter.value = '';
        window.individual_filter_value = '';
        populateIndividualSelect(window.individuals);
    });

    color_picker.addEventListener('input', function(event) {
        window.tree_color = event.target.value;
        requestFamilyTreeUpdate();
    });

    optionsMenu.addEventListener('click', function() { toggleOptions(); });
    file_input.addEventListener('change', function(event) { selectGedcomFile(event.target.files[0]); });
    open_online_button.addEventListener('click', function() { openOnlineGedcomModal(); });
    online_gedcom_cancel_button.addEventListener('click', function() { online_gedcom_modal.style.display = 'none'; });
    online_gedcom_modal.addEventListener('click', function(event) {
        const btn = event.target.closest('.online-gedcom-item');
        if (btn && !btn.disabled) {
            loadGedcomFromUrl(btn.dataset.url, btn.dataset.name);
        }
    });
    online_gedcom_modal.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            online_gedcom_modal.style.display = 'none';
        }
    });
    individual_filter.addEventListener('input', function(event) { filterIndividuals(event.target.value); });
    individual_select.addEventListener('change', function(event) { requestFamilyTreeUpdate(); });
    preset_select.addEventListener('change', function(event) { usePresetStyle(event.target.value); });
    save_tree_button.addEventListener('click', function() { openSaveModal(); });
    save_modal_cancel_button.addEventListener('click', function() { document.getElementById('save-modal').style.display = 'none'; });

    save_modal.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            save_modal_ok_button.click();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            save_modal_cancel_button.click();
        }
    });
    resize_tree_button.addEventListener('click', function() { zoomToFit(); });
    resize_tree_horizontal_button.addEventListener('click', function() { zoomToFitHorizontal(); });
    resize_tree_vertical_button.addEventListener('click', function() { zoomToFitVertical(); });
    expand_styling_button.addEventListener('click', function() { expandAllStylingSections(); });
    collapse_styling_button.addEventListener('click', function() { collapseAllStylingSections(); });

    preset_select.value = 'traditional';
    usePresetStyle('traditional');
    scaleBodyForSmallScreens();
    updateOptionsVisibility();
    updateRangeThumbs();
    updateMaxLinksState();
    window.addEventListener('resize', function() {
        updateOptionsVisibility();
        scaleBodyForSmallScreens();
        requestFamilyTreeUpdate();
    });
});

canvasSize.maxArea({
  onSuccess({ width, height, testTime, totalTime }) {
    window.max_canvas_width = width;
    window.max_canvas_height = height;
  }
});

canvasSize.maxWidth({
    onSuccess({ width, testTime, totalTime }) {
        window.max_canvas_width = width;
    }
})

canvasSize.maxHeight({
    onSuccess({ height, testTime, totalTime }) {
        window.max_canvas_height = height;
    }
})
