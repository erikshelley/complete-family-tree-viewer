// User interface and input handling functionality

document.addEventListener('DOMContentLoaded', function() {
    const file_input = document.getElementById('file-input');
    const family_tree_div = document.getElementById('family-tree-div');
    const individual_select = document.getElementById('individual-select');
    const individual_filter = document.getElementById('individual-filter');
    const generations_up = document.getElementById('generations-up');
    const generations_down = document.getElementById('generations-down');
    const color_picker = document.getElementById('color-picker');
    const saturation_slider = document.getElementById('saturation-slider');
    const brightness_slider = document.getElementById('brightness-slider');
    const hue_slider = document.getElementById('hue-slider');
    const transparent_bg_rect_checkbox = document.getElementById('transparent-bg-rect');
    const text_brightness_slider = document.getElementById('text-brightness-slider');
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

    let filterTimeout = null;
    individual_filter.addEventListener('input', function(event) {
        window.individual_filter_value = event.target.value.toLowerCase();
        if (filterTimeout) clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            populateIndividualSelect(window.individuals);
        }, 100);
    });

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

    transparent_bg_rect_checkbox.addEventListener('change', function(event) {
        window.transparent_bg_rect = event.target.checked;
        updateFamilyTree();
    });

    color_picker.addEventListener('input', function(event) {
        window.tree_color = event.target.value;
        updateFamilyTree();
    });

    file_input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                window.gedcom_content = e.target.result;
                const is_valid_gedcom = validateGedcom(window.gedcom_content);

                if (is_valid_gedcom) {
                    family_tree_div.innerHTML = '<p style="color: green;">Valid GEDCOM file loaded!</p><p>Select a root person to view their tree.</p>';

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
        }
    });

    individual_select.addEventListener('change', function(event) { 
        const parsed_data = parseGedcomData(window.gedcom_content);
        window.individuals = parsed_data.individuals;
        window.families = parsed_data.families;
        updateFamilyTree(); 
    });

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
        sat = 0;
        lum = parseInt(text_brightness_slider.value) || window.default_text_brightness;
        color = d3.hcl(hue, sat, lum);
        text_brightness_slider.style.setProperty('--range-thumb-text-color', color);
    }

    updateSliderThumbs();

    function updateFamilyTree() {
        if (individual_select.value === '') createFamilyTree(window.selected_individual);
        const selected_id = individual_select.value;
        window.generations_up = parseInt(generations_up.value) || 0;
        window.generations_down = parseInt(generations_down.value) || 0;

        if (selected_id && selected_id !== 'Select an individual...') {
            const selected_individual = window.individuals.find(ind => ind.id === selected_id);
            if (selected_individual) {
                window.selected_individual = selected_individual;
                createFamilyTree(selected_individual);
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
        //let first = true;
        filtered.forEach(individual => {
            const option = document.createElement('option');
            option.value = individual.id;
            option.textContent = individual.name || individual.id;
            //if (first) option.selected = true;
            select.appendChild(option);
            //first = false;
        });
        //updateFamilyTree(); 
    }
});
