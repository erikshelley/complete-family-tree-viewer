// User interface and input handling functionality

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileContent = document.getElementById('fileContent');
    const individualSelect = document.getElementById('individualSelect');

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const isValidGedcom = validateGedcom(content);

                if (isValidGedcom) {
                    //fileContent.innerHTML = '<p style="color: green;">Valid GEDCOM file loaded!</p><pre>' + content + '</pre>';
                    //console.log('Valid GEDCOM file loaded into memory:', content);
                    fileContent.innerHTML = '<p style="color: green;">Valid GEDCOM file loaded!</p>';
                    console.log('Valid GEDCOM file loaded into memory');

                    // Parse GEDCOM data
                    const parsedData = parseGedcomData(content);
                    window.currentIndividuals = parsedData.individuals;
                    window.currentFamilies = parsedData.families;

                    populateIndividualSelect(window.currentIndividuals);
                } else {
                    fileContent.innerHTML = '<p style="color: red;">Invalid GEDCOM file. Please select a valid GEDCOM file.</p>';
                    console.log('Invalid file selected');
                    // Clear the dropdown
                    individualSelect.innerHTML = '<option>Select an individual...</option>';
                    window.currentIndividuals = [];
                    window.currentFamilies = [];
                }
            };
            reader.readAsText(file);
        }
    });

    // Add event listener for individual selection
    individualSelect.addEventListener('change', function(event) {
        updateFamilyTree();
    });

    // Add event listener for generations input
    const generationsInput = document.getElementById('generationsInput');
    generationsInput.addEventListener('input', function(event) {
        updateFamilyTree();
    });

    function updateFamilyTree() {
        const selectedId = individualSelect.value;
        const generations = parseInt(generationsInput.value) || 1;

        if (selectedId && selectedId !== 'Select an individual...') {
            const selectedIndividual = window.currentIndividuals.find(ind => ind.id === selectedId);
            if (selectedIndividual) {
                createFamilyTree(selectedIndividual, generations);
            }
        }
    }
});

function populateIndividualSelect(individuals) {
    const select = document.getElementById('individualSelect');
    select.innerHTML = '<option>Select an individual...</option>';

    individuals.forEach(individual => {
        const option = document.createElement('option');
        option.value = individual.id;
        option.textContent = individual.name || individual.id;
        select.appendChild(option);
    });
}