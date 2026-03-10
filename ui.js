// User interface and input handling functionality

document.addEventListener('DOMContentLoaded', function() {
    const file_input = document.getElementById('file-input');
    const family_tree_div = document.getElementById('family-tree-div');
    const individual_select = document.getElementById('individual-select');
    const generations_input = document.getElementById('generations-input');

    file_input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                window.gedcom_content = e.target.result;
                const is_valid_gedcom = validateGedcom(window.gedcom_content);

                if (is_valid_gedcom) {
                    family_tree_div.innerHTML = '<p style="color: green;">Valid GEDCOM file loaded! Select a root person to view their tree.</p>';
                    //family_tree_div.innerHTML += `<pre>${content}</pre>`;
                    //console.log('Valid GEDCOM file loaded into memory');

                    // Parse GEDCOM data
                    const parsed_data = parseGedcomData(window.gedcom_content);
                    window.individuals = parsed_data.individuals;
                    window.families = parsed_data.families;

                    populateIndividualSelect(window.individuals);
                } else {
                    family_tree_div.innerHTML = '<p style="color: red;">Invalid GEDCOM file. Please select a valid GEDCOM file.</p>';
                    //console.log('Invalid file selected');
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

    generations_input.addEventListener('input', function(event) { updateFamilyTree(); });

    function updateFamilyTree() {
        const selected_id = individual_select.value;
        window.generations = parseInt(generations_input.value) || 1;

        if (selected_id && selected_id !== 'Select an individual...') {
            const selected_individual = window.individuals.find(ind => ind.id === selected_id);
            if (selected_individual) createFamilyTree(selected_individual);
        }
    }
});

function populateIndividualSelect(individuals) {
    const select = document.getElementById('individual-select');
    select.innerHTML = '<option>Select an individual...</option>';

    individuals.forEach(individual => {
        const option = document.createElement('option');
        option.value = individual.id;
        option.textContent = individual.name || individual.id;
        select.appendChild(option);
    });
}