// User interface and input handling functionality

document.addEventListener('DOMContentLoaded', function() {
    const file_input = document.getElementById('file-input');
    const file_name_span = document.getElementById('file-name');
    const family_tree_div = document.getElementById('family-tree-div');
    const individual_select = document.getElementById('individual-select');
    const individual_filter = document.getElementById('individual-filter');
    const generations_up = document.getElementById('generations-up');
    const generations_down = document.getElementById('generations-down');
    const hide_childless_inlaws = document.getElementById('hide-childless-inlaws');
    const stack_leaf_nodes = document.getElementById('stack-leaf-nodes');
    const color_picker = document.getElementById('color-picker');
    const saturation_slider = document.getElementById('saturation-slider');
    const brightness_slider = document.getElementById('brightness-slider');
    const hue_slider = document.getElementById('hue-slider');
    const transparent_bg_rect_checkbox = document.getElementById('transparent-bg-rect');
    const text_brightness_slider = document.getElementById('text-brightness-slider');
    const highlight_ancestors = document.getElementById('highlight-ancestors');
    window.default_text_brightness = 90;
    text_brightness_slider.value = window.default_text_brightness;
    window.default_node_brightness = 33;
    brightness_slider.value = window.default_node_brightness;
    window.default_node_saturation = 33;
    saturation_slider.value = window.default_node_saturation;
    window.default_node_hue = 120;
    hue_slider.value = window.default_node_hue;

    window.root_hue = parseInt(hue_slider.value) || window.default_node_hue;
    window.individual_filter_value = '';
    window.transparent_bg_rect = transparent_bg_rect_checkbox.checked;
    window.text_brightness = parseInt(text_brightness_slider.value) || window.default_text_brightness;
    window.node_brightness = parseInt(brightness_slider.value) || window.default_node_brightness;
    window.node_saturation = parseInt(saturation_slider.value) || window.default_node_saturation;
    window.tree_color = color_picker.value;
    window.selected_individual = '';
    window.hide_childless_inlaws = hide_childless_inlaws.checked || false;
    window.stack_leaf_nodes = stack_leaf_nodes.checked || false;
    window.highlight_ancestors = highlight_ancestors.checked || true;

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

    hue_slider.addEventListener('input', function(event) {
        window.root_hue = parseInt(event.target.value) || window.default_node_hue;
        updateSliderThumbs();
        updateFamilyTree();
    });

    brightness_slider.addEventListener('input', function(event) {
        window.node_brightness = parseInt(event.target.value) || window.default_node_brightness;
        updateSliderThumbs();
        updateFamilyTree();
    });

    saturation_slider.addEventListener('input', function(event) {
        window.node_saturation = parseInt(event.target.value) || window.default_node_saturation;
        updateSliderThumbs();
        updateFamilyTree();
    });

    text_brightness_slider.addEventListener('input', function(event) {
        window.text_brightness = parseInt(event.target.value) || window.default_text_brightness;
        updateSliderThumbs();
        updateFamilyTree();
    });

    hide_childless_inlaws.addEventListener('change', function(event) {
        window.hide_childless_inlaws = event.target.checked;
        updateFamilyTree();
    });

    stack_leaf_nodes.addEventListener('change', function(event) {
        window.stack_leaf_nodes = event.target.checked;
        updateFamilyTree();
    });

    transparent_bg_rect_checkbox.addEventListener('change', function(event) {
        window.transparent_bg_rect = event.target.checked;
        updateFamilyTree();
    });

    color_picker.addEventListener('input', function(event) {
        window.tree_color = event.target.value;
        updateFamilyTree();
    });

    highlight_ancestors.addEventListener('change', function(event) {
        window.highlight_ancestors = event.target.checked;
        updateFamilyTree();
    });

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
    generations_up.addEventListener('input', function(event) { updateFamilyTree(); });
    generations_down.addEventListener('input', function(event) { updateFamilyTree(); });

    function updateSliderThumbs() {
        let hue = parseInt(hue_slider.value) || window.default_node_hue;
        let sat = parseInt(saturation_slider.value) || window.default_node_saturation;
        let lum = parseInt(brightness_slider.value) || window.default_node_brightness;
        let color = d3.hcl(hue, sat, lum);
        hue_slider.style.setProperty('--range-thumb-color', color);
        saturation_slider.style.setProperty('--range-thumb-color', color);
        brightness_slider.style.setProperty('--range-thumb-color', color);
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

            //if (individual_select.value === '') createFamilyTree(window.selected_individual);
            const selected_id = individual_select.value || window.selected_individual.id;
            window.generations_up = parseInt(generations_up.value) || 0;
            window.generations_down = parseInt(generations_down.value) || 0;

            if (selected_id && (selected_id !== 'Select an individual...')) {
                const selected_individual = window.individuals.find(ind => ind.id === selected_id);
                if (selected_individual) {
                    window.selected_individual = selected_individual;
                    createFamilyTree(selected_individual);
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
