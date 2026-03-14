// User interface and input handling functionality

// Tree Content Variables
window.generations_up;
window.generations_down;
window.max_stack_size;
window.hide_childless_inlaws;
//window.pedigree_only;

// Tree Styling Variables
window.box_width;
window.default_box_width;
window.box_height;
window.default_box_height;
window.h_spacing;
window.default_h_spacing;
window.v_spacing;
window.default_v_spacing;
window.node_rounding;
window.default_node_rounding;
window.link_rounding;
window.default_link_rounding;
window.show_names;
window.show_years;
window.show_places;
window.show_tooltips = false;
window.text_shadow;
window.link_width;
window.root_hue;
window.default_node_hue;
window.node_saturation;
window.default_node_saturation;
window.node_brightness;
window.default_node_brightness;
window.highlight_percent;
window.default_highlight_percent;
window.transparent_bg_rect;
window.node_text_size;
window.text_brightness;

const elements = [
    // Tree Content
    { id: 'generations-up-number',          type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_up', max: 99 },
    { id: 'generations-down-number',        type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_down', max: 99 },
    { id: 'max-stack-size-number',          type: 'number',   default: 1,     min: 1, max: 99, variable: 'max_stack_size', max: 99 },
    { id: 'hide-childless-inlaws-checkbox', type: 'checkbox', default: false, variable: 'hide_childless_inlaws' },
    //{ id: 'pedigree-only', type: 'checkbox', default: false, variable: 'pedigree_only' },

    // Tree Styling
    { id: 'node-width-number',              type: 'number',   default: 150,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-width-range',               type: 'range',    default: 150,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-height-number',             type: 'number',   default: 75,    min: 20, max: 480, variable: 'box_height' },
    { id: 'node-height-range',              type: 'range',    default: 75,    min: 20, max: 480, variable: 'box_height' },
    { id: 'h-spacing-number',               type: 'number',   default: 37,    min: 0, max: 480, variable: 'h_spacing' },
    { id: 'h-spacing-range',                type: 'range',    default: 37,    min: 0, max: 480, variable: 'h_spacing' },
    { id: 'v-spacing-number',               type: 'number',   default: 66,    min: 0, max: 480, variable: 'v_spacing' },
    { id: 'v-spacing-range',                type: 'range',    default: 66,    min: 0, max: 480, variable: 'v_spacing' },
    { id: 'node-rounding-number',           type: 'number',   default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'node-rounding-range',            type: 'range',    default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'show-names-checkbox',            type: 'checkbox', default: true,  variable: 'show_names' },
    { id: 'show-years-checkbox',            type: 'checkbox', default: true,  variable: 'show_years' },
    { id: 'show-places-checkbox',           type: 'checkbox', default: false, variable: 'show_places' },
    //{ id: 'show-tooltips-checkbox',         type: 'checkbox', default: false, variable: 'show_tooltips' },

    { id: 'link-width-number',              type: 'number',   default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'link-width-range',               type: 'range',    default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'link-rounding-number',           type: 'number',   default: 50,    min: 0, max: 100, variable: 'link_rounding' },
    { id: 'link-rounding-range',            type: 'range',    default: 50,    min: 0, max: 100, variable: 'link_rounding' },

    { id: 'node-text-size-number',          type: 'number',   default: 16,    min: 1, max: 100, variable: 'node_text_size' },
    { id: 'node-text-size-range',           type: 'range',    default: 16,    min: 1, max: 100, variable: 'node_text_size' },
    { id: 'text-brightness-number',         type: 'number',   default: 90,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'text-brightness-range',          type: 'range',    default: 90,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'text-shadow-checkbox',           type: 'checkbox', default: true,  variable: 'text_shadow' },

    { id: 'hue-number',                     type: 'number',   default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'hue-range',                      type: 'range',    default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'saturation-number',              type: 'number',   default: 33,    min: 0, max: 100, variable: 'node_saturation' },
    { id: 'saturation-range',               type: 'range',    default: 33,    min: 0, max: 100, variable: 'node_saturation' },
    { id: 'brightness-number',              type: 'number',   default: 33,    min: 0, max: 100, variable: 'node_brightness' },
    { id: 'brightness-range',               type: 'range',    default: 33,    min: 0, max: 100, variable: 'node_brightness' },
    { id: 'highlight-percent-number',       type: 'number',   default: 150,   min: 0, max: 200, variable: 'highlight_percent' },
    { id: 'highlight-percent-range',        type: 'range',    default: 150,   min: 0, max: 200, variable: 'highlight_percent' },
    { id: 'transparent-bg-rect-checkbox',   type: 'checkbox', default: true,  variable: 'transparent_bg_rect' },
];

document.addEventListener('DOMContentLoaded', function() {
    // Inputs for selecting the Gedcom file
    const file_input = document.getElementById('file-input-button');
    const file_name_span = document.getElementById('file-name');
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

    // Inputs for filtering the list of individuals
    const individual_filter = document.getElementById('individual-filter-text');
    window.individual_filter_value = '';
    let filter_timeout = null;
    individual_filter.addEventListener('input', function(event) {
        window.individual_filter_value = event.target.value.toLowerCase();
        if (filter_timeout) clearTimeout(filter_timeout);
        filter_timeout = setTimeout(() => {
            populateIndividualSelect(window.individuals);
        }, 100);
    });
    const clearIndividualFilterbutton = document.getElementById('clear-individual-filter');
    if (clearIndividualFilterbutton) {
        clearIndividualFilterbutton.addEventListener('click', function() {
            individual_filter.value = '';
            window.individual_filter_value = '';
            populateIndividualSelect(window.individuals);
        });
    }

    // Input for selecting the root individual
    const individual_select = document.getElementById('individual-select');
    individual_select.addEventListener('change', function(event) { requestFamilyTreeUpdate(); });
    window.selected_individual = '';

    // Input to reset styling
    const reset_styling_button = document.getElementById('reset-styling-button');
    if (reset_styling_button) {
        reset_styling_button.addEventListener('click', function() {
            for (const element_info of elements) {
                if (!['generations-up-number', 'generations-down-number', 'max-stack-size-number', 'hide-childless-inlaws-checkbox'].includes(element_info.id)) {
                    const element = document.getElementById(element_info.id);
                    if (element_info.type === 'checkbox') element.checked = element_info.default;
                    else element.value = element_info.default;
                    window[element_info.variable] = element_info.default;
                    if (element_info.linked_element) element_info.linked_element.value = element_info.default;
                }
            }
            color_picker.value = "#000000";
            window.tree_color = "#000000";
            updateRangeThumbs();
            requestFamilyTreeUpdate();
        });
    }

    // Input for choosing the background color
    const color_picker = document.getElementById('color-picker');
    window.tree_color = color_picker.value;
    color_picker.addEventListener('input', function(event) {
        window.tree_color = event.target.value;
        requestFamilyTreeUpdate();
    });

    // Inputs listed in the 'elements' array at the top of this file
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
                element.value = element_info.max;
                window[element_info.variable] = element_info.max;
                requestFamilyTreeUpdate();
            });
        }
    }

    // Inputs for automatically setting node width and height based on content
    const auto_node_width_link = document.getElementById('auto-node-width-link');
    auto_node_width_link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.auto_box_width > 0) {
            const node_width_range = document.getElementById('node-width-range');
            const node_width_value = document.getElementById('node-width-number');
            node_width_range.value = Math.ceil(window.auto_box_width / 10) * 10;
            window.box_width = parseInt(node_width_range.value) || window.default_box_width;
            node_width_value.value = window.box_width;
            requestFamilyTreeUpdate();
        }
    });

    const auto_node_height_link = document.getElementById('auto-node-height-link');
    auto_node_height_link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.auto_box_height > 0) {
            const node_height_range = document.getElementById('node-height-range');
            const node_height_value = document.getElementById('node-height-number');
            node_height_range.value = Math.ceil(window.auto_box_height / 10) * 10;
            window.box_height = parseInt(node_height_range.value) || window.default_box_height;
            node_height_value.value = window.box_height;
            requestFamilyTreeUpdate();
        }
    });

    // Input for setting highlight intensity to 100%
    const no_highlight_percent_link = document.getElementById('no-highlight-percent-link');
    no_highlight_percent_link.addEventListener('click', function(e) {
        e.preventDefault();
        window.highlight_percent = 100;
        const highlight_percent_range = document.getElementById('highlight-percent-range');
        const highlight_percent_value = document.getElementById('highlight-percent-number');
        highlight_percent_value.value = 100;
        highlight_percent_range.value = 100;
        updateRangeThumbs();
        requestFamilyTreeUpdate();
    });


    const family_tree_div = document.getElementById('family-tree-div');

    // Save SVG button functionality
    const save_svg_button = document.getElementById('save-svg-button');
    if (save_svg_button) {
        save_svg_button.addEventListener('click', function() {
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
    const save_png_button = document.getElementById('save-png-button');
    if (save_png_button) {
        save_png_button.addEventListener('click', function() {
            save_png_button.disabled = true;
            const svg = family_tree_div.querySelector('svg');
            if (!svg) {
                alert('No SVG found to save.');
                save_png_button.disabled = false;
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
                    save_png_button.disabled = false;
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
                        save_png_button.disabled = false;
                    }, 'image/png');
                }
            };
            img.src = url;
        });
    }

    function updateRangeThumbs() {
        const hue_element = document.getElementById('hue-range');
        const sat_element = document.getElementById('saturation-range');
        const lum_element = document.getElementById('brightness-range');
        let hue = parseInt(hue_element.value);
        let sat = parseInt(sat_element.value);
        let lum = parseInt(lum_element.value);
        for (const element_info of elements) {
            if (element_info.type === 'range') {
                const element = document.getElementById(element_info.id);
                if (element) {
                    let val = parseInt(element.value) || element_info.default;
                    if (element_info.min !== undefined && val < element_info.min) val = element_info.min;
                    if (element_info.max !== undefined && val > element_info.max) val = element_info.max;
                    if (element_info.id === 'highlight-percent-range') {
                        const color = d3.hcl(hue, sat, lum * (element.value / 100));
                        element.style.setProperty('--range-thumb-color', color);
                    }
                    else if (['text-brightness-range', 'node-text-size-range'].includes(element_info.id)) {
                        const text_lum_element = document.getElementById('text-brightness-range');
                        const sat = 0;
                        const lum = parseInt(text_lum_element.value);
                        const color = d3.hcl(hue, sat, lum);
                        element.style.setProperty('--range-thumb-text-color', color);
                    }
                    else {
                        const color = d3.hcl(hue, sat, lum);
                        element.style.setProperty('--range-thumb-color', color);
                    }
                }
            }
        }
        const root_name = document.getElementById('root-name');
        if (root_name) {
            const color = d3.hcl(hue, sat, 75);
            root_name.style.setProperty('--root-name-text-color', color);
        }
    }

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

            const individual_select = document.getElementById('individual-select');
            const selected_id = individual_select.value || window.selected_individual.id;

            if (selected_id && (selected_id !== 'Select an individual...')) {
                const selected_individual = window.individuals.find(ind => ind.id === selected_id);
                if (selected_individual) {
                    window.selected_individual = selected_individual;
                    await createFamilyTree(selected_individual);
                    const generations_up_number = document.getElementById('generations-up-number');
                    const generations_down_number = document.getElementById('generations-down-number');
                    const max_stack_size_number = document.getElementById('max-stack-size-number');
                    if (generations_up_number.value > window.max_gen_up) {
                        generations_up_number.value = window.max_gen_up;
                        window.generations_up = window.max_gen_up;
                    }
                    if (generations_down_number.value > window.max_gen_down) {
                        generations_down_number.value = window.max_gen_down;
                        window.generations_down = window.max_gen_down;
                    }
                    if (max_stack_size_number.value > window.max_stack_actual) {
                        console.log('Adjusting max stack size to fit tree: ' + window.max_stack_actual);
                        max_stack_size_number.value = window.max_stack_actual;
                        window.max_stack_size = window.max_stack_actual;
                    }
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

    updateRangeThumbs();
    window.addEventListener('resize', function() { requestFamilyTreeUpdate(); });
});
