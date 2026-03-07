// GEDCOM parsing and validation functionality
window.currentIndividuals = []; // Store parsed individuals globally
window.currentFamilies = []; // Store parsed families globally

function validateGedcom(content) {
    const lines = content.trim().split('\n');

    // Check if first line starts with "0 HEAD"
    if (!lines[0] || !lines[0].trim().startsWith('0 HEAD')) {
        return false;
    }

    // Check if there's a "0 TRLR" line
    const hasTrailer = lines.some(line => line.trim().startsWith('0 TRLR'));
    if (!hasTrailer) {
        return false;
    }

    // Basic structure check: lines should start with level numbers 0-9
    const levelRegex = /^[0-9]/;
    for (let line of lines) {
        line = line.trim();
        if (line && !levelRegex.test(line)) {
            return false;
        }
    }

    return true;
}

function parseGedcomData(content) {
    const lines = content.trim().split('\n');
    const individuals = [];
    const families = [];
    let currentIndividual = null;
    let currentFamily = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const parts = line.split(/\s+/); // Split on whitespace
        const level = parseInt(parts[0]);

        if (level === 0 && parts.length >= 3 && parts[2] === 'INDI') {
            // New individual: 0 @Ixxx@ INDI
            if (currentIndividual) {
                individuals.push(currentIndividual);
            }
            currentIndividual = { id: parts[1], name: '', famc: null, birth: '', death: '' };
            currentFamily = null; // Reset family
            currentEvent = null;
        } else if (level === 0 && parts.length >= 3 && parts[2] === 'FAM') {
            // New family: 0 @Fxxx@ FAM
            if (currentFamily) {
                families.push(currentFamily);
            }
            currentFamily = { id: parts[1], husb: null, wife: null, chil: [] };
            currentIndividual = null; // Reset individual
            currentEvent = null;
        } else if (level === 1 && parts[1] === 'NAME' && currentIndividual) {
            // Name line: 1 NAME Given /Surname/
            const nameParts = parts.slice(2);
            let name = nameParts.join(' ');
            // Remove all slashes
            name = name.replace(/\//g, '');
            currentIndividual.name = name.trim();
            currentEvent = null;
        } else if (level === 1 && parts[1] === 'FAMC' && currentIndividual) {
            // Family as child: 1 FAMC @Fxxx@
            currentIndividual.famc = parts[2];
            currentEvent = null;
        } else if (level === 1 && parts[1] === 'BIRT' && currentIndividual) {
            // Birth event
            currentEvent = 'BIRT';
        } else if (level === 1 && parts[1] === 'DEAT' && currentIndividual) {
            // Death event
            currentEvent = 'DEAT';
        } else if (level === 2 && parts[1] === 'DATE' && currentEvent) {
            // Date for current event
            const dateParts = parts.slice(2);
            const date = dateParts.join(' ');
            if (currentEvent === 'BIRT' && currentIndividual) {
                currentIndividual.birth = extractYear(date);
                currentEvent = null; // Reset after processing
            } else if (currentEvent === 'DEAT' && currentIndividual) {
                currentIndividual.death = extractYear(date);
                currentEvent = null; // Reset after processing
            }
        } else if (level === 1 && parts[1] === 'HUSB' && currentFamily) {
            // Husband: 1 HUSB @Ixxx@
            currentFamily.husb = parts[2];
            currentEvent = null;
        } else if (level === 1 && parts[1] === 'WIFE' && currentFamily) {
            // Wife: 1 WIFE @Ixxx@
            currentFamily.wife = parts[2];
            currentEvent = null;
        } else if (level === 1 && parts[1] === 'CHIL' && currentFamily) {
            // Child: 1 CHIL @Ixxx@
            currentFamily.chil.push(parts[2]);
            currentEvent = null;
        } else if (level === 1) {
            // Any other level 1 event - reset currentEvent
            currentEvent = null;
        }
    }

    // Add the last individual and family
    if (currentIndividual) {
        individuals.push(currentIndividual);
    }
    if (currentFamily) {
        families.push(currentFamily);
    }

    console.log('Parsed individuals:', individuals.map(i => ({id: i.id, name: i.name, famc: i.famc, birth: i.birth, death: i.death})));
    console.log('Parsed families:', families);
    return { individuals, families };
}

function extractYear(dateString) {
    // Extract year from GEDCOM date format
    const yearMatch = dateString.match(/\b(\d{4})\b/);
    return yearMatch ? yearMatch[1] : '';
}