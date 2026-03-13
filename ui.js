// User interface and input handling functionality

document.addEventListener('DOMContentLoaded', function() {
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
    generations_up.addEventListener('input', function(event) { updateFamilyTree(); });

    const generations_up_max_link = document.getElementById('generations-up-max-link');
    generations_up_max_link.addEventListener('click', function(e) {
        e.preventDefault();
        generations_up.value = 99;
        updateFamilyTree();
    });

    const generations_down = document.getElementById('generations-down');
    generations_down.addEventListener('input', function(event) { updateFamilyTree(); });
    const generations_down_max_link = document.getElementById('generations-down-max-link');
    generations_down_max_link.addEventListener('click', function(e) {
        e.preventDefault();
        generations_down.value = 99;
        updateFamilyTree();
    });

    const max_stack_size = document.getElementById('max-stack-size');
    max_stack_size.addEventListener('input', function(event) { updateFamilyTree(); });
    const max_stack_size_max_link = document.getElementById('max-stack-size-max-link');
    max_stack_size_max_link.addEventListener('click', function(e) {
        e.preventDefault();
        max_stack_size.value = 99;
        updateFamilyTree();
    });

    // Checkboxes
    const hide_childless_inlaws = document.getElementById('hide-childless-inlaws');
    window.hide_childless_inlaws = hide_childless_inlaws.checked;
    hide_childless_inlaws.addEventListener('change', function(event) {
        window.hide_childless_inlaws = event.target.checked;
        updateFamilyTree();
    });

    const pedigree_only = document.getElementById('pedigree-only');
    window.pedigree_only = pedigree_only.checked;
    pedigree_only.addEventListener('change', function(event) {
        window.pedigree_only = event.target.checked;
        updateFamilyTree();
    });

    const transparent_bg_rect_checkbox = document.getElementById('transparent-bg-rect');
    window.transparent_bg_rect = transparent_bg_rect_checkbox.checked;
    color_picker.disabled = transparent_bg_rect_checkbox.checked;
    transparent_bg_rect_checkbox.addEventListener('change', function(event) {
        window.transparent_bg_rect = event.target.checked;
        color_picker.disabled = event.target.checked;
        updateFamilyTree();
    });

    const highlight_ancestors = document.getElementById('highlight-ancestors');
    window.highlight_ancestors = highlight_ancestors.checked;
    highlight_ancestors.addEventListener('change', function(event) {
        window.highlight_ancestors = event.target.checked;
        updateFamilyTree();
    });

    const show_names_checkbox = document.getElementById('show-names');
    window.show_names = show_names_checkbox ? show_names_checkbox.checked : true;
    if (show_names_checkbox) {
        show_names_checkbox.addEventListener('change', function(event) {
            window.show_names = event.target.checked;
            updateFamilyTree();
        });
    }

    const show_years_checkbox = document.getElementById('show-years');
    window.show_years = show_years_checkbox ? show_years_checkbox.checked : true;
    if (show_years_checkbox) {
        show_years_checkbox.addEventListener('change', function(event) {
            window.show_years = event.target.checked;
            updateFamilyTree();
        });
    }

    const show_tooltips_checkbox = document.getElementById('show-tooltips');
    window.show_tooltips = show_tooltips_checkbox ? show_tooltips_checkbox.checked : false;
    if (show_tooltips_checkbox) {
        show_tooltips_checkbox.addEventListener('change', function(event) {
            window.show_tooltips = event.target.checked;
            updateFamilyTree();
        });
    }

    // Ranges
    const node_width_slider = document.getElementById('node-width');
    window.default_box_width = 140;
    node_width_slider.value = window.default_box_width;
    window.box_width = parseInt(node_width_slider.value) || window.default_box_width;
    const node_width_value = document.getElementById('node-width-value');
    node_width_value.innerHTML = window.box_width;
    if (node_width_slider) {
        node_width_slider.addEventListener('input', function(event) {
            window.box_width = parseInt(event.target.value) || 140;
            node_width_value.innerHTML = window.box_width;
            updateFamilyTree();
        });
    }
    const auto_node_width_link = document.getElementById('auto-node-width-link');
    auto_node_width_link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.auto_box_width > 0) {
            node_width_slider.value = Math.ceil(window.auto_box_width / 10) * 10;
            window.box_width = parseInt(node_width_slider.value) || window.default_box_width;
            node_width_value.innerHTML = window.box_width;
            updateFamilyTree();
        }
    });

    const node_height_slider = document.getElementById('node-height');
    window.default_box_height = 70;
    node_height_slider.value = window.default_box_height;
    window.box_height = parseInt(node_height_slider.value) || window.default_box_height;
    const node_height_value = document.getElementById('node-height-value');
    node_height_value.innerHTML = window.box_height;
    if (node_height_slider) {
        node_height_slider.addEventListener('input', function(event) {
            window.box_height = parseInt(event.target.value) || 70;
            node_height_value.innerHTML = window.box_height;
            updateFamilyTree();
        });
    }
    const auto_node_height_link = document.getElementById('auto-node-height-link');
    auto_node_height_link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.auto_box_height > 0) {
            node_height_slider.value = Math.ceil(window.auto_box_height / 10) * 10;
            window.box_height = parseInt(node_height_slider.value) || window.default_box_height;
            node_height_value.innerHTML = window.box_height;
            updateFamilyTree();
        }
    });

    const link_width_slider = document.getElementById('link-width-slider');
    window.default_link_width = 6;
    link_width_slider.value = window.default_link_width;
    window.link_width = parseInt(link_width_slider.value) || window.default_link_width;
    const link_width_value = document.getElementById('link-width-value');
    link_width_value.innerHTML = window.link_width;
    if (link_width_slider) {
        link_width_slider.addEventListener('input', function(event) {
            window.link_width = parseInt(event.target.value) || window.default_link_width;
            link_width_value.innerHTML = window.link_width;
            updateFamilyTree();
        });
    }

    const h_spacing_slider = document.getElementById('h-spacing-slider');
    window.default_h_spacing = 40;
    h_spacing_slider.value = window.default_h_spacing;
    window.h_spacing = parseInt(h_spacing_slider.value) || window.default_h_spacing;
    const h_spacing_value = document.getElementById('h-spacing-value');
    h_spacing_value.innerHTML = window.h_spacing;
    if (h_spacing_slider) {
        h_spacing_slider.addEventListener('input', function(event) {
            window.h_spacing = parseInt(event.target.value) || window.default_h_spacing;
            h_spacing_value.innerHTML = window.h_spacing;
            updateFamilyTree();
        });
    }

    const v_spacing_slider = document.getElementById('v-spacing-slider');
    window.default_v_spacing = 80;
    v_spacing_slider.value = window.default_v_spacing;
    window.v_spacing = parseInt(v_spacing_slider.value) || window.default_v_spacing;
    const v_spacing_value = document.getElementById('v-spacing-value');
    v_spacing_value.innerHTML = window.v_spacing;
    if (v_spacing_slider) {
        v_spacing_slider.addEventListener('input', function(event) {
            window.v_spacing = parseInt(event.target.value) || window.default_v_spacing;
            v_spacing_value.innerHTML = window.v_spacing;
            updateFamilyTree();
        });
    }

    const hue_slider = document.getElementById('hue-slider');
    window.default_node_hue = 120;
    hue_slider.value = window.default_node_hue;
    window.root_hue = parseInt(hue_slider.value);
    const hue_value = document.getElementById('hue-value');
    hue_value.innerHTML = window.root_hue;
    hue_slider.addEventListener('input', function(event) {
        window.root_hue = parseInt(event.target.value);
        hue_value.innerHTML = window.root_hue;
        updateSliderThumbs();
        updateFamilyTree();
    });


    const saturation_slider = document.getElementById('saturation-slider');
    window.default_node_saturation = 33;
    saturation_slider.value = window.default_node_saturation;
    window.node_saturation = parseInt(saturation_slider.value);
    const saturation_value = document.getElementById('saturation-value');
    saturation_value.innerHTML = window.node_saturation;
    saturation_slider.addEventListener('input', function(event) {
        window.node_saturation = parseInt(event.target.value);
        saturation_value.innerHTML = window.node_saturation;
        updateSliderThumbs();
        updateFamilyTree();
    });

    const brightness_slider = document.getElementById('brightness-slider');
    window.default_node_brightness = 33;
    brightness_slider.value = window.default_node_brightness;
    window.node_brightness = parseInt(brightness_slider.value);
    const brightness_value = document.getElementById('brightness-value');
    brightness_value.innerHTML = window.node_brightness;
    brightness_slider.addEventListener('input', function(event) {
        window.node_brightness = parseInt(event.target.value);
        brightness_value.innerHTML = window.node_brightness;
        updateSliderThumbs();
        updateFamilyTree();
    });

    const text_brightness_slider = document.getElementById('text-brightness-slider');
    window.default_text_brightness = 90;
    text_brightness_slider.value = window.default_text_brightness;
    window.text_brightness = parseInt(text_brightness_slider.value);
    const text_brightness_value = document.getElementById('text-brightness-value');
    text_brightness_value.innerHTML = window.text_brightness;
    text_brightness_slider.addEventListener('input', function(event) {
        window.text_brightness = parseInt(event.target.value);
        text_brightness_value.innerHTML = window.text_brightness;
        updateSliderThumbs();
        updateFamilyTree();
    });


    // Update family tree on window resize
    window.addEventListener('resize', function() { updateFamilyTree(); });

    let filterTimeout = null;
    individual_filter.addEventListener('input', function(event) {
        window.individual_filter_value = event.target.value.toLowerCase();
        if (filterTimeout) clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
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
        updateFamilyTree();
    });

    if (reset_styling_btn) {
        reset_styling_btn.addEventListener('click', function() {
            node_width_slider.value = window.default_box_width;
            window.box_width = window.default_box_width;
            node_width_value.innerHTML = window.box_width;

            node_height_slider.value = window.default_box_height;
            window.box_height = window.default_box_height;
            node_height_value.innerHTML = window.box_height;

            link_width_slider.value = window.default_link_width;
            window.link_width = window.default_link_width;
            link_width_value.innerHTML = window.link_width;

            v_spacing_slider.value = window.default_v_spacing;
            window.v_spacing = window.default_v_spacing;
            v_spacing_value.innerHTML = window.v_spacing;

            h_spacing_slider.value = window.default_h_spacing;
            window.h_spacing = window.default_h_spacing;
            h_spacing_value.innerHTML = window.h_spacing;

            hue_slider.value = window.default_node_hue;
            window.root_hue = window.default_node_hue;
            hue_value.innerHTML = window.root_hue;

            saturation_slider.value = window.default_node_saturation;
            window.node_saturation = window.default_node_saturation;
            saturation_value.innerHTML = window.node_saturation;

            brightness_slider.value = window.default_node_brightness;
            window.node_brightness = window.default_node_brightness;
            brightness_value.innerHTML = window.node_brightness;

            text_brightness_slider.value = window.default_text_brightness;
            window.text_brightness = window.default_text_brightness;
            text_brightness_value.innerHTML = window.text_brightness;

            transparent_bg_rect_checkbox.checked = true;
            window.transparent_bg_rect = true;

            color_picker.value = "#000000";
            window.tree_color = "#000000";

            highlight_ancestors.checked = true;
            window.highlight_ancestors = true;

            show_names_checkbox.checked = true;
            window.show_names = true;

            show_years_checkbox.checked = true;
            window.show_years = true;

            show_tooltips_checkbox.checked = false;
            window.show_tooltips = false;

            updateSliderThumbs();
            updateFamilyTree();
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

    individual_select.addEventListener('change', function(event) { updateFamilyTree(); });

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
        const root_name = document.getElementById('root-name');
        if (root_name) {
            color = d3.hcl(hue, sat, 75);
            root_name.style.setProperty('--root-name-text-color', color);
        }
        sat = 0;
        lum = parseInt(text_brightness_slider.value) || window.default_text_brightness;
        color = d3.hcl(hue, sat, lum);
        text_brightness_slider.style.setProperty('--range-thumb-text-color', color);
    }

    updateSliderThumbs();

    function updateFamilyTree() {
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
                    createFamilyTree(selected_individual);
                    if (generations_up.value > window.max_gen_up) generations_up.value = window.max_gen_up;
                    if (generations_down.value > window.max_gen_down) generations_down.value = window.max_gen_down;
                    if (max_stack_size.value > window.max_stack_actual) max_stack_size.value = window.max_stack_actual;
                }
            }
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
