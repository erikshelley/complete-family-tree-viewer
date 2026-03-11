// GEDCOM parsing and validation functionality
window.gedcom_content = ''; // Store raw GEDCOM content globally
window.individuals = []; // Store parsed individuals globally
window.families = []; // Store parsed families globally
window.generations = 1; // Default generation depth


function validateGedcom(content) {
    const lines = content.trim().split('\n');

    // Check if first line starts with "0 HEAD"
    if (!lines[0] || !lines[0].trim().startsWith('0 HEAD')) {
        return false;
    }

    // Check if there's a "0 TRLR" line
    const has_trailer = lines.some(line => line.trim().startsWith('0 TRLR'));
    if (!has_trailer) return false;

    // Basic structure check: lines should start with level numbers 0-9
    const level_regex = /^[0-9]/;
    for (let line of lines) {
        line = line.trim();
        if (line && !level_regex.test(line)) {
            return false;
        }
    }

    return true;
}

function parseGedcomData(content) {
    const lines = content.trim().split('\n');
    const individuals = [];
    const families = [];
    let current_individual = null;
    let current_family = null;
    let current_event = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const parts = line.split(/\s+/); // Split on whitespace
        const level = parseInt(parts[0]);

        if (level === 0 && parts.length >= 3 && parts[2] === 'INDI') {
            // New individual: 0 @Ixxx@ INDI
            if (current_individual) individuals.push(current_individual);
            current_individual = { id: parts[1], name: '', famc: null, fams: [], birth: '', death: '', gender: '' };
            current_family = null; // Reset family
            current_event = null;
        } else if (level === 0 && parts.length >= 3 && parts[2] === 'FAM') {
            // New family: 0 @Fxxx@ FAM
            if (current_family) families.push(current_family);
            current_family = { id: parts[1], husb: null, wife: null, chil: [] };
            current_individual = null; // Reset individual
            current_event = null;
        } else if (level === 1 && parts[1] === 'NAME' && current_individual) {
            // Name line: 1 NAME Given /Surname/
            const nameParts = parts.slice(2);
            let name = nameParts.join(' ');
            // Remove content after the second slash (if present)
            const slashCount = (name.match(/\//g) || []).length;
            if (slashCount > 1) {
                const firstSlashIndex = name.indexOf('/');
                const secondSlashIndex = name.indexOf('/', firstSlashIndex + 1);
                name = name.substring(0, secondSlashIndex);
            }
            // Remove all slashes
            name = name.replace(/\//g, '');
            current_individual.name = name.trim();
            current_event = null;
        } else if (level === 1 && parts[1] === 'SEX' && current_individual) {
            // Gender line: 1 SEX M or 1 SEX F
            current_individual.gender = parts[2];
            current_event = null;
        } else if (level === 1 && parts[1] === 'FAMC' && current_individual) {
            // Family as child: 1 FAMC @Fxxx@
            current_individual.famc = parts[2];
            current_event = null;
        } else if (level === 1 && parts[1] === 'FAMS' && current_individual) {
            // Family as spouse: 1 FAMS @Fxxx@
            current_individual.fams.push(parts[2]);
            current_event = null;
        } else if (level === 1 && parts[1] === 'BIRT' && current_individual) {
            // Birth event
            current_event = 'BIRT';
        } else if (level === 1 && parts[1] === 'DEAT' && current_individual) {
            // Death event
            current_event = 'DEAT';
        } else if (level === 2 && parts[1] === 'DATE' && current_event && current_individual) {
            // Date for current event
            const date_parts = parts.slice(2);
            const date = date_parts.join(' ');
            if (current_event === 'BIRT' && current_individual) {
                current_individual.birth = extractYear(date);
                current_event = null; // Reset after processing
            } else if (current_event === 'DEAT' && current_individual) {
                current_individual.death = extractYear(date);
                current_event = null; // Reset after processing
            }
        } else if (level === 1 && parts[1] === 'HUSB' && current_family) {
            // Husband: 1 HUSB @Ixxx@
            current_family.husb = parts[2];
            current_event = null;
        } else if (level === 1 && parts[1] === 'WIFE' && current_family) {
            // Wife: 1 WIFE @Ixxx@
            current_family.wife = parts[2];
            current_event = null;
        } else if (level === 1 && parts[1] === 'CHIL' && current_family) {
            // Child: 1 CHIL @Ixxx@
            current_family.chil.push(parts[2]);
            current_event = null;
        } else if (level === 1) {
            // Any other level 1 event - reset current_event
            current_event = null;
        }
    }

    // Add the last individual and family
    if (current_individual) individuals.push(current_individual);
    if (current_family) families.push(current_family);

    //console.log('Parsed individuals:', individuals.forEach(i => ({id: i.id, name: i.name, famc: i.famc, fams: i.fams, birth: i.birth, death: i.death, gender: i.gender})));
    //console.log('Parsed individuals:', individuals);
    //console.log('Parsed families:', families);
    return { individuals, families };
}


function extractYear(date_string) {
    // Extract year from GEDCOM date format
    const yearMatch = date_string.match(/\b(\d{4})\b/);
    return yearMatch ? yearMatch[1] : '';
}