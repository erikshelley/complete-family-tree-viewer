// User interface and input handling functionality

document.addEventListener('DOMContentLoaded', function() {
    // Text shadow checkbox
    const text_shadow_checkbox = document.getElementById('text-shadow');
    window.text_shadow = text_shadow_checkbox ? text_shadow_checkbox.checked : true;
    if (text_shadow_checkbox) {
        text_shadow_checkbox.addEventListener('change', function(event) {
            window.text_shadow = event.target.checked;
            requestFamilyTreeUpdate();
        });
    }

    // Buttons
    const file_input = document.getElementById('file-input');
    const reset_styling_btn = document.getElementById('reset-styling-btn');

    const file_name_span = document.getElementById('file-name');
    const family_tree_div = document.getElementById('family-tree-div');
    const individual_select = document.getElementById('individual-select');
    const individual_filter = document.getElementById('individual-filter');
    window.individual_filter_value = '';
    const color_picker = document.getElementById('color-picker');
    window.tree_color = color_picker.value;
    window.selected_individual = '';

    // Numbers
    const generations_up = document.getElementById('generations-up');
    generations_up.addEventListener('input', function(event) { requestFamilyTreeUpdate(); });

    const generations_up_max_link = document.getElementById('generations-up-max-link');
    generations_up_max_link.addEventListener('click', function(e) {
        e.preventDefault();
        generations_up.value = 99;
        requestFamilyTreeUpdate();
    });

    const generations_down = document.getElementById('generations-down');
    generations_down.addEventListener('input', function(event) { requestFamilyTreeUpdate(); });
    const generations_down_max_link = document.getElementById('generations-down-max-link');
    generations_down_max_link.addEventListener('click', function(e) {
        e.preventDefault();
        generations_down.value = 99;
        requestFamilyTreeUpdate();
    });

    const max_stack_size = document.getElementById('max-stack-size');
    max_stack_size.addEventListener('input', function(event) { requestFamilyTreeUpdate(); });
    const max_stack_size_max_link = document.getElementById('max-stack-size-max-link');
    max_stack_size_max_link.addEventListener('click', function(e) {
        e.preventDefault();
        max_stack_size.value = 99;
        requestFamilyTreeUpdate();
    });

    // Checkboxes
    const hide_childless_inlaws = document.getElementById('hide-childless-inlaws');
    window.hide_childless_inlaws = hide_childless_inlaws.checked;
    hide_childless_inlaws.addEventListener('change', function(event) {
        window.hide_childless_inlaws = event.target.checked;
        requestFamilyTreeUpdate();
    });

    const pedigree_only = document.getElementById('pedigree-only');
    window.pedigree_only = pedigree_only.checked;
    pedigree_only.addEventListener('change', function(event) {
        window.pedigree_only = event.target.checked;
        requestFamilyTreeUpdate();
    });

    const transparent_bg_rect_checkbox = document.getElementById('transparent-bg-rect');
    window.transparent_bg_rect = transparent_bg_rect_checkbox.checked;
    color_picker.disabled = transparent_bg_rect_checkbox.checked;
    transparent_bg_rect_checkbox.addEventListener('change', function(event) {
        window.transparent_bg_rect = event.target.checked;
        color_picker.disabled = event.target.checked;
        requestFamilyTreeUpdate();
    });

    const show_names_checkbox = document.getElementById('show-names');
    window.show_names = show_names_checkbox ? show_names_checkbox.checked : true;
    if (show_names_checkbox) {
        show_names_checkbox.addEventListener('change', function(event) {
            window.show_names = event.target.checked;
            requestFamilyTreeUpdate();
        });
    }

    const show_years_checkbox = document.getElementById('show-years');
    window.show_years = show_years_checkbox ? show_years_checkbox.checked : true;
    if (show_years_checkbox) {
        show_years_checkbox.addEventListener('change', function(event) {
            window.show_years = event.target.checked;
            requestFamilyTreeUpdate();
        });
    }

    const show_tooltips_checkbox = document.getElementById('show-tooltips');
    window.show_tooltips = show_tooltips_checkbox ? show_tooltips_checkbox.checked : false;
    if (show_tooltips_checkbox) {
        show_tooltips_checkbox.addEventListener('change', function(event) {
            window.show_tooltips = event.target.checked;
            requestFamilyTreeUpdate();
        });
    }

    // Ranges
    const node_width_slider = document.getElementById('node-width');
    window.default_box_width = 150;
    node_width_slider.value = window.default_box_width;
    window.box_width = parseInt(node_width_slider.value) || window.default_box_width;
    const node_width_value = document.getElementById('node-width-value');
    node_width_value.value = window.box_width;
    if (node_width_slider && node_width_value) {
        node_width_slider.addEventListener('input', function(event) {
            window.box_width = parseInt(event.target.value) || window.default_box_width;
            node_width_value.value = window.box_width;
            requestFamilyTreeUpdate();
        });
        node_width_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value) || window.default_box_width;
            //if (val < 20) val = 20;
            if (val > 480) val = 480;
            window.box_width = val;
            node_width_slider.value = val;
            node_width_value.value = val;
            requestFamilyTreeUpdate();
        });
    }
    const auto_node_width_link = document.getElementById('auto-node-width-link');
    auto_node_width_link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.auto_box_width > 0) {
            node_width_slider.value = Math.ceil(window.auto_box_width / 10) * 10;
            window.box_width = parseInt(node_width_slider.value) || window.default_box_width;
            node_width_value.value = window.box_width;
            requestFamilyTreeUpdate();
        }
    });

    const node_height_slider = document.getElementById('node-height');
    window.default_box_height = 75;
    node_height_slider.value = window.default_box_height;
    window.box_height = parseInt(node_height_slider.value) || window.default_box_height;
    const node_height_value = document.getElementById('node-height-value');
    node_height_value.value = window.box_height;
    if (node_height_slider && node_height_value) {
        node_height_slider.addEventListener('input', function(event) {
            window.box_height = parseInt(event.target.value) || window.default_box_height;
            node_height_value.value = window.box_height;
            requestFamilyTreeUpdate();
        });
        node_height_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value) || window.default_box_height;
            //if (val < 20) val = 20;
            if (val > 320) val = 320;
            window.box_height = val;
            node_height_slider.value = val;
            node_height_value.value = val;
            requestFamilyTreeUpdate();
        });
    }
    const auto_node_height_link = document.getElementById('auto-node-height-link');
    auto_node_height_link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.auto_box_height > 0) {
            node_height_slider.value = Math.ceil(window.auto_box_height / 10) * 10;
            window.box_height = parseInt(node_height_slider.value) || window.default_box_height;
            node_height_value.value = window.box_height;
            requestFamilyTreeUpdate();
        }
    });

    const link_width_slider = document.getElementById('link-width-slider');
    window.default_link_width = 6;
    link_width_slider.value = window.default_link_width;
    window.link_width = parseInt(link_width_slider.value) || window.default_link_width;
    const link_width_value = document.getElementById('link-width-value');
    link_width_value.value = window.link_width;
    if (link_width_slider && link_width_value) {
        link_width_slider.addEventListener('input', function(event) {
            window.link_width = parseInt(event.target.value) || window.default_link_width;
            link_width_value.value = window.link_width;
            requestFamilyTreeUpdate();
        });
        link_width_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value) || window.default_link_width;
            if (val < 1) val = 1;
            if (val > 28) val = 28;
            window.link_width = val;
            link_width_slider.value = val;
            link_width_value.value = val;
            requestFamilyTreeUpdate();
        });
    }

    const h_spacing_slider = document.getElementById('h-spacing-slider');
    window.default_h_spacing = 40;
    h_spacing_slider.value = window.default_h_spacing;
    window.h_spacing = parseInt(h_spacing_slider.value) || window.default_h_spacing;
    const h_spacing_value = document.getElementById('h-spacing-value');
    h_spacing_value.value = window.h_spacing;
    if (h_spacing_slider && h_spacing_value) {
        h_spacing_slider.addEventListener('input', function(event) {
            window.h_spacing = parseInt(event.target.value) || window.default_h_spacing;
            h_spacing_value.value = window.h_spacing;
            requestFamilyTreeUpdate();
        });
        h_spacing_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value) || window.default_h_spacing;
            if (val < 1) val = 1;
            if (val > 400) val = 400;
            window.h_spacing = val;
            h_spacing_slider.value = val;
            h_spacing_value.value = val;
            requestFamilyTreeUpdate();
        });
    }

    const v_spacing_slider = document.getElementById('v-spacing-slider');
    window.default_v_spacing = 80;
    v_spacing_slider.value = window.default_v_spacing;
    window.v_spacing = parseInt(v_spacing_slider.value) || window.default_v_spacing;
    const v_spacing_value = document.getElementById('v-spacing-value');
    v_spacing_value.value = window.v_spacing;
    if (v_spacing_slider && v_spacing_value) {
        v_spacing_slider.addEventListener('input', function(event) {
            window.v_spacing = parseInt(event.target.value) || window.default_v_spacing;
            v_spacing_value.value = window.v_spacing;
            requestFamilyTreeUpdate();
        });
        v_spacing_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value) || window.default_v_spacing;
            if (val < 1) val = 1;
            if (val > 400) val = 400;
            window.v_spacing = val;
            v_spacing_slider.value = val;
            v_spacing_value.value = val;
            requestFamilyTreeUpdate();
        });
    }

    const node_rounding_slider = document.getElementById('node-rounding-slider');
    const node_rounding_value = document.getElementById('node-rounding');
    window.default_node_rounding = 25;
    if (node_rounding_slider) node_rounding_slider.value = window.default_node_rounding;
    if (node_rounding_value) node_rounding_value.value = window.default_node_rounding;
    if (node_rounding_slider && node_rounding_value) {
        node_rounding_slider.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            window.node_rounding = val;
            node_rounding_value.value = val;
            node_rounding_slider.value = val;
            requestFamilyTreeUpdate();
        });
        node_rounding_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            window.node_rounding = val;
            node_rounding_slider.value = val;
            node_rounding_value.value = val;
            requestFamilyTreeUpdate();
        });
    }

    const link_rounding_slider = document.getElementById('link-rounding-slider');
    const link_rounding_value = document.getElementById('link-rounding');
    window.default_link_rounding = 50;
    if (link_rounding_slider) link_rounding_slider.value = window.default_link_rounding;
    if (link_rounding_value) link_rounding_value.value = window.default_link_rounding;
    if (link_rounding_slider && link_rounding_value) {
        link_rounding_slider.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            window.link_rounding = val;
            link_rounding_value.value = val;
            link_rounding_slider.value = val;
            requestFamilyTreeUpdate();
        });
        link_rounding_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            window.link_rounding = val;
            link_rounding_slider.value = val;
            link_rounding_value.value = val;
            requestFamilyTreeUpdate();
        });
    }

    const hue_slider = document.getElementById('hue-slider');
    window.default_node_hue = 120;
    hue_slider.value = window.default_node_hue;
    window.root_hue = parseInt(hue_slider.value);
    const hue_value = document.getElementById('hue-value');
    hue_value.value = window.root_hue;
    if (hue_slider && hue_value) {
        hue_slider.addEventListener('input', function(event) {
            window.root_hue = parseInt(event.target.value);
            hue_value.value = window.root_hue;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
        hue_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 359) val = 359;
            window.root_hue = val;
            hue_slider.value = val;
            hue_value.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
    }


    const saturation_slider = document.getElementById('saturation-slider');
    window.default_node_saturation = 33;
    saturation_slider.value = window.default_node_saturation;
    window.node_saturation = parseInt(saturation_slider.value);
    const saturation_value = document.getElementById('saturation-value');
    saturation_value.value = window.node_saturation;
    if (saturation_slider && saturation_value) {
        saturation_slider.addEventListener('input', function(event) {
            window.node_saturation = parseInt(event.target.value);
            saturation_value.value = window.node_saturation;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
        saturation_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            window.node_saturation = val;
            saturation_slider.value = val;
            saturation_value.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
    }

    const brightness_slider = document.getElementById('brightness-slider');
    window.default_node_brightness = 33;
    brightness_slider.value = window.default_node_brightness;
    window.node_brightness = parseInt(brightness_slider.value);
    const brightness_value = document.getElementById('brightness-value');
    brightness_value.value = window.node_brightness;
    if (brightness_slider && brightness_value) {
        brightness_slider.addEventListener('input', function(event) {
            window.node_brightness = parseInt(event.target.value);
            brightness_value.value = window.node_brightness;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
        brightness_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            window.node_brightness = val;
            brightness_slider.value = val;
            brightness_value.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
    }

    const highlight_percent = document.getElementById('highlight-percent');
    window.default_highlight_percent = 150;
    highlight_percent.value = window.default_highlight_percent;
    window.highlight_percent = parseInt(highlight_percent.value);
    const highlight_percent_slider = document.getElementById('highlight-percent-slider');
    highlight_percent_slider.value = window.default_highlight_percent;
    if (highlight_percent && highlight_percent_slider) {
        highlight_percent.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 200) val = 200;
            window.highlight_percent = val;
            highlight_percent.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
        highlight_percent_slider.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 200) val = 200;
            window.highlight_percent = val;
            highlight_percent_slider.value = val;
            highlight_percent.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
    }

    const text_brightness_slider = document.getElementById('text-brightness-slider');
    window.default_text_brightness = 90;
    text_brightness_slider.value = window.default_text_brightness;
    window.text_brightness = parseInt(text_brightness_slider.value);
    const text_brightness_value = document.getElementById('text-brightness-value');
    text_brightness_value.value = window.text_brightness;
    if (text_brightness_slider && text_brightness_value) {
        text_brightness_slider.addEventListener('input', function(event) {
            window.text_brightness = parseInt(event.target.value);
            text_brightness_value.value = window.text_brightness;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
        text_brightness_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            window.text_brightness = val;
            text_brightness_slider.value = val;
            text_brightness_value.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
    }

    // Node text size
    const node_text_size_slider = document.getElementById('node-text-size-slider');
    const node_text_size_value = document.getElementById('node-text-size-value');
    window.default_text_size = 16;
    window.node_text_size = window.default_text_size;
    if (node_text_size_slider) node_text_size_slider.value = window.node_text_size;
    if (node_text_size_value) node_text_size_value.value = window.node_text_size;
    if (node_text_size_slider && node_text_size_value) {
        node_text_size_slider.addEventListener('input', function(event) {
            let val = parseInt(event.target.value) || window.default_text_size;
            if (val < 8) val = 8;
            if (val > 24) val = 24;
            window.node_text_size = val;
            node_text_size_value.value = val;
            node_text_size_slider.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
        node_text_size_value.addEventListener('input', function(event) {
            let val = parseInt(event.target.value) || window.default_text_size;
            if (val < 8) val = 8;
            if (val > 24) val = 24;
            window.node_text_size = val;
            node_text_size_slider.value = val;
            node_text_size_value.value = val;
            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
    }

    // Update family tree on window resize
    window.addEventListener('resize', function() { requestFamilyTreeUpdate(); });

    let filter_timeout = null;
    individual_filter.addEventListener('input', function(event) {
        window.individual_filter_value = event.target.value.toLowerCase();
        if (filter_timeout) clearTimeout(filter_timeout);
        filter_timeout = setTimeout(() => {
            populateIndividualSelect(window.individuals);
        }, 100);
    });

    // Add clear button functionality for individual-filter
    const clearIndividualFilterBtn = document.getElementById('clear-individual-filter');
    if (clearIndividualFilterBtn) {
        clearIndividualFilterBtn.addEventListener('click', function() {
            individual_filter.value = '';
            window.individual_filter_value = '';
            populateIndividualSelect(window.individuals);
        });
    }

    color_picker.addEventListener('input', function(event) {
        window.tree_color = event.target.value;
        requestFamilyTreeUpdate();
    });

    if (reset_styling_btn) {
        reset_styling_btn.addEventListener('click', function() {
            node_width_slider.value = window.default_box_width;
            window.box_width = window.default_box_width;
            node_width_value.value = window.box_width;

            node_height_slider.value = window.default_box_height;
            window.box_height = window.default_box_height;
            node_height_value.value = window.box_height;

            link_width_slider.value = window.default_link_width;
            window.link_width = window.default_link_width;
            link_width_value.value = window.link_width;

            v_spacing_slider.value = window.default_v_spacing;
            window.v_spacing = window.default_v_spacing;
            v_spacing_value.value = window.v_spacing;

            h_spacing_slider.value = window.default_h_spacing;
            window.h_spacing = window.default_h_spacing;
            h_spacing_value.value = window.h_spacing;

            node_rounding_slider.value = window.default_node_rounding;
            window.node_rounding = window.default_node_rounding;
            node_rounding_value.value = window.node_rounding;

            link_rounding_slider.value = window.default_link_rounding;
            window.link_rounding = window.default_link_rounding;
            link_rounding_value.value = window.link_rounding;

            hue_slider.value = window.default_node_hue;
            window.root_hue = window.default_node_hue;
            hue_value.value = window.root_hue;

            saturation_slider.value = window.default_node_saturation;
            window.node_saturation = window.default_node_saturation;
            saturation_value.value = window.node_saturation;

            brightness_slider.value = window.default_node_brightness;
            window.node_brightness = window.default_node_brightness;
            brightness_value.value = window.node_brightness;

            highlight_percent.value = window.default_highlight_percent;
            window.highlight_percent = window.default_highlight_percent;
            highlight_percent_slider.value = window.highlight_percent;

            text_brightness_slider.value = window.default_text_brightness;
            window.text_brightness = window.default_text_brightness;
            text_brightness_value.value = window.text_brightness;

            node_text_size_slider.value = window.default_text_size;
            window.node_text_size = window.default_text_size;
            node_text_size_value.value = window.node_text_size;

            transparent_bg_rect_checkbox.checked = true;
            window.transparent_bg_rect = true;

            color_picker.value = "#000000";
            window.tree_color = "#000000";

            window.highlight_ancestors = true;

            show_names_checkbox.checked = true;
            window.show_names = true;

            show_years_checkbox.checked = true;
            window.show_years = true;

            show_tooltips_checkbox.checked = false;
            window.show_tooltips = false;

            text_shadow_checkbox.checked = true;
            window.text_shadow = true;

            updateSliderThumbs();
            requestFamilyTreeUpdate();
        });
    }

    file_input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            file_name_span.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                window.gedcom_content = e.target.result;
                const is_valid_gedcom = validateGedcom(window.gedcom_content);

                if (is_valid_gedcom) {
                    family_tree_div.innerHTML = '<p style="color: hsl(120, 25%, 50%);">Valid GEDCOM file loaded!</p><p>Select a root person to view their tree.</p>';

                    // Parse GEDCOM data
                    const parsed_data = parseGedcomData(window.gedcom_content);
                    window.individuals = parsed_data.individuals;
                    window.families = parsed_data.families;

                    individual_filter.value = '';
                    window.individual_filter_value = '';

                    populateIndividualSelect(window.individuals);
                } else {
                    family_tree_div.innerHTML = '<p style="color: red;">Invalid GEDCOM file. Please select a valid GEDCOM file.</p>';
                    // Clear the dropdown
                    individual_select.innerHTML = '<option>Select an individual...</option>';
                    window.individuals = [];
                    window.families = [];
                }
            };
            reader.readAsText(file);
        } else {
            file_name_span.textContent = '';
        }
    });

    individual_select.addEventListener('change', function(event) { requestFamilyTreeUpdate(); });

    function updateSliderThumbs() {
        let hue = parseInt(hue_slider.value) || 0;
        let sat = parseInt(saturation_slider.value) || 0;
        let lum = parseInt(brightness_slider.value) || 0;
        let color = d3.hcl(hue, sat, lum);
        hue_slider.style.setProperty('--range-thumb-color', color);
        saturation_slider.style.setProperty('--range-thumb-color', color);
        brightness_slider.style.setProperty('--range-thumb-color', color);
        node_width_slider.style.setProperty('--range-thumb-color', color);
        node_height_slider.style.setProperty('--range-thumb-color', color);
        link_width_slider.style.setProperty('--range-thumb-color', color);
        h_spacing_slider.style.setProperty('--range-thumb-color', color);
        v_spacing_slider.style.setProperty('--range-thumb-color', color);
        node_rounding_slider.style.setProperty('--range-thumb-color', color);
        link_rounding_slider.style.setProperty('--range-thumb-color', color);
        color = d3.hcl(hue, sat, lum * (window.highlight_percent / 100));
        highlight_percent_slider.style.setProperty('--range-thumb-color', color);
        const root_name = document.getElementById('root-name');
        if (root_name) {
            color = d3.hcl(hue, sat, 75);
            root_name.style.setProperty('--root-name-text-color', color);
        }
        sat = 0;
        lum = parseInt(text_brightness_slider.value);
        color = d3.hcl(hue, sat, lum);
        text_brightness_slider.style.setProperty('--range-thumb-text-color', color);
        node_text_size_slider.style.setProperty('--range-thumb-text-color', color);
    }

    updateSliderThumbs();

    let update_in_progress = false;
    let update_waiting = false;
    let update_timeout = null;

    function requestFamilyTreeUpdate() {
        if (!update_in_progress) {
            update_in_progress = true;
            if (update_timeout) clearTimeout(update_timeout);
            update_timeout = setTimeout(() => { updateFamilyTree(); }, 100);
        }
        else update_waiting = true;
    }

    async function updateFamilyTree() {
        if (window.gedcom_content) {
            // The tree building process can change the data, so we reload to get a fresh copy each time
            const parsed_data = parseGedcomData(window.gedcom_content);
            window.individuals = parsed_data.individuals;
            window.families = parsed_data.families;

            const selected_id = individual_select.value || window.selected_individual.id;
            window.generations_up = parseInt(generations_up.value) || 0;
            window.generations_down = parseInt(generations_down.value) || 0;
            window.max_stack_size = parseInt(max_stack_size.value) || 0;

            if (selected_id && (selected_id !== 'Select an individual...')) {
                const selected_individual = window.individuals.find(ind => ind.id === selected_id);
                if (selected_individual) {
                    window.selected_individual = selected_individual;
                    await createFamilyTree(selected_individual);
                    if (generations_up.value > window.max_gen_up) generations_up.value = window.max_gen_up;
                    if (generations_down.value > window.max_gen_down) generations_down.value = window.max_gen_down;
                    if (max_stack_size.value > window.max_stack_actual) max_stack_size.value = window.max_stack_actual;
                }
            }
        }
        update_in_progress = false;
        if (update_waiting) {
            update_waiting = false;
            requestFamilyTreeUpdate();
        }
    }

    function populateIndividualSelect(individuals) {
        const select = document.getElementById('individual-select');
        select.innerHTML = '';
        let filter = window.individual_filter_value || '';
        let filtered = individuals;
        if (filter.length > 0) {
            filtered = individuals.filter(ind => (ind.name || ind.id).toLowerCase().includes(filter));
        }
        filtered.forEach(individual => {
            const option = document.createElement('option');
            option.value = individual.id;
            let birthYear = '';
            let deathYear = '';
            if (individual.birth) {
                const match = individual.birth.match(/\b(\d{4})\b/);
                if (match) birthYear = match[1];
            }
            if (individual.death) {
                const match = individual.death.match(/\b(\d{4})\b/);
                if (match) deathYear = match[1];
            }
            let years = '';
            if (birthYear || deathYear) {
                years = ` (${birthYear}${deathYear ? '–' + deathYear : ''})`;
            }
            option.textContent = (individual.name || individual.id) + years;
            select.appendChild(option);
        });
    }

    // Save SVG button functionality
    const saveSvgBtn = document.getElementById('save-svg-btn');
    if (saveSvgBtn) {
        saveSvgBtn.addEventListener('click', function() {
            const svg = family_tree_div.querySelector('svg');
            if (!svg) {
                alert('No SVG found to save.');
                return;
            }
            let serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);
            // Add XML declaration
            if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            const blob = new Blob([source], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'family-tree.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Save PNG button functionality
    const savePngBtn = document.getElementById('save-png-btn');
    if (savePngBtn) {
        savePngBtn.addEventListener('click', function() {
            savePngBtn.disabled = true;
            const svg = family_tree_div.querySelector('svg');
            if (!svg) {
                alert('No SVG found to save.');
                savePngBtn.disabled = false;
                return;
            }
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);
            if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            const svgBlob = new Blob([source], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let vbWidth = 1200, vbHeight = 800;
                const viewBox = svg.getAttribute('viewBox');
                if (viewBox) {
                    const vbVals = viewBox.split(/\s+|,/);
                    if (vbVals.length === 4) {
                        vbWidth = parseFloat(vbVals[2]);
                        vbHeight = parseFloat(vbVals[3]);
                    }
                }
                canvas.width = vbWidth;
                canvas.height = vbHeight;
                const ctx = canvas.getContext('2d');
                let errorOccurred = false;
                try {
                    ctx.drawImage(img, 0, 0, vbWidth, vbHeight);
                } catch (err) {
                    errorOccurred = true;
                    alert('Error saving PNG: The canvas size may exceed the browser or system limit. Try reducing the tree size or saving it as an SVG.');
                    savePngBtn.disabled = false;
                    return;
                }
                if (!errorOccurred) {
                    canvas.toBlob(function(blob) {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'family-tree.png';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        savePngBtn.disabled = false;
                    }, 'image/png');
                }
            };
            img.src = url;
        });
    }
});
