// User interface and input handling functionality

document.addEventListener('DOMContentLoaded', function() {
        const text_brightness_slider = document.getElementById('text-brightness-slider');

        // Set initial text brightness
        window.text_brightness = parseInt(text_brightness_slider.value) || 90;

        text_brightness_slider.addEventListener('input', function(event) {
            window.text_brightness = parseInt(event.target.value) || 90;
            updateFamilyTree();
        });
    const file_input = document.getElementById('file-input');
    const family_tree_div = document.getElementById('family-tree-div');
    const individual_select = document.getElementById('individual-select');
    const generations_up = document.getElementById('generations-up');
    const generations_down = document.getElementById('generations-down');
    const color_picker = document.getElementById('color-picker');
    const saturation_slider = document.getElementById('saturation-slider');
    const brightness_slider = document.getElementById('brightness-slider');
    const hue_slider = document.getElementById('hue-slider');

    // Set initial root hue
    window.root_hue = parseInt(hue_slider.value) || 0;

    hue_slider.addEventListener('input', function(event) {
        window.root_hue = parseInt(event.target.value) || 0;
        updateFamilyTree();
    });
    // Set initial node brightness
    window.node_brightness = parseInt(brightness_slider.value) || 40;

    brightness_slider.addEventListener('input', function(event) {
        window.node_brightness = parseInt(event.target.value) || 40;
        updateFamilyTree();
    });
    // Set initial node saturation
    window.node_saturation = parseInt(saturation_slider.value) || 33;

    saturation_slider.addEventListener('input', function(event) {
        window.node_saturation = parseInt(event.target.value) || 33;
        updateFamilyTree();
    });
    // Set initial tree color
    window.tree_color = color_picker.value;

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

    function updateFamilyTree() {
        const selected_id = individual_select.value;
        window.generations_up = parseInt(generations_up.value) || 0;
        window.generations_down = parseInt(generations_down.value) || 0;

        if (selected_id && selected_id !== 'Select an individual...') {
            const selected_individual = window.individuals.find(ind => ind.id === selected_id);
            if (selected_individual) createFamilyTree(selected_individual);
        }
    }
});

function populateIndividualSelect(individuals) {
    const select = document.getElementById('individual-select');
    //select.innerHTML = '<option>Select an individual...</option>';
    select.innerHTML = '';

    individuals.forEach(individual => {
        const option = document.createElement('option');
        option.value = individual.id;
        option.textContent = individual.name || individual.id;
        select.appendChild(option);
    });
}