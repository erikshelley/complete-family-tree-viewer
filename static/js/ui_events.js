document.addEventListener('DOMContentLoaded', function() {
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
                    let val = parseInt(event.target.value);
                    if ((element_info.min !== undefined) && (val < element_info.min)) val = element_info.min;
                    if ((element_info.max !== undefined) && (val > element_info.max)) val = element_info.max;
                    window[element_info.variable] = val;
                    if (event.target.linked_element) event.target.linked_element.value = val;
                    updateRangeThumbs();
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
        window.save_filename = save_filename_input.value || 'family-tree';
        document.getElementById('save-modal').style.display = 'none';
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
    individual_filter.addEventListener('input', function(event) { filterIndividuals(event.target.value); });
    individual_select.addEventListener('change', function(event) { requestFamilyTreeUpdate(); });
    preset_select.addEventListener('change', function(event) { usePresetStyle(event.target.value); });
    reset_styling_button.addEventListener('click', function() { resetStyling(); });
    save_svg_button.addEventListener('click', function() { openSaveModal('svg'); });
    save_png_button.addEventListener('click', function() { openSaveModal('png'); });
    save_modal_cancel_button.addEventListener('click', function() { document.getElementById('save-modal').style.display = 'none'; });
    resize_tree_button.addEventListener('click', function() { zoomToFit(); requestFamilyTreeUpdate(); });

    preset_select.value = 'default';
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

