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
            current_individual = { id: parts[1], name: '', famc: null, fams: [], birth: '', death: '', gender: '', birth_place: '', death_place: '' };
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
            } else if (current_event === 'DEAT' && current_individual) {
                current_individual.death = extractYear(date);
            }
        } else if (level === 2 && parts[1] === 'PLAC' && current_event && current_individual) {
            // Place for current event
            const place_parts = parts.slice(2);
            let place = place_parts.join(' ');
            // Replace 'United States of America' with 'USA' and remove 'County'
            place = place.replace(/United States of America/g, 'USA');
            place = place.replace(/\bCounty\b/g, '').replace(/\s{2,}/g, ' ').trim();

            // US state name to abbreviation map
            const stateMap = {
                'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA', 'Colorado': 'CO',
                'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
                'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA',
                'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
                'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
                'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
                'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA',
                'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
                'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
                'Wisconsin': 'WI', 'Wyoming': 'WY'
            };
            // Replace all state names with abbreviations, anywhere in the string
            let germanyToDE = false;
            // Mark if 'Germany' is present before replacement
            if (/\bGermany\b/i.test(place)) germanyToDE = true;
            for (const [state, abbr] of Object.entries(stateMap)) {
                // Replace as a whole word, case-insensitive
                const regex = new RegExp(`\\b${state}\\b`, 'gi');
                place = place.replace(regex, abbr);
            }
            // Replace 'Germany' with 'DE' as a whole word
            place = place.replace(/\bGermany\b/gi, 'DE');
            // If place ends with a US state abbreviation, append ', USA' if not already present
            const stateAbbrs = Object.values(stateMap);
            const placeParts = place.split(',').map(s => s.trim());
            const last = placeParts[placeParts.length - 1];
            // Do not append ', USA' if last is 'DE' and it was formerly Germany
            if (stateAbbrs.includes(last) && !/USA$/.test(place)) {
                if (!(last === 'DE' && germanyToDE)) {
                    place = place + ', USA';
                }
            }
            if (current_event === 'BIRT' && current_individual) {
                current_individual.birth_place = place;
            } else if (current_event === 'DEAT' && current_individual) {
                current_individual.death_place = place;
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