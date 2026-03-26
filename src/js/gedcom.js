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
            if (current_individual) individuals.push(current_individual);
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
            // Remove 'County' and extra spaces
            place = place.replace(/\bCounty\b/g, '').replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim();
            place = replaceUSStateNamesWithAbbr(place);
            place = replaceCountryNamesWithAlpha3(place);
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

    return { individuals, families };
}


function extractYear(date_string) {
    // Extract year from GEDCOM date format
    const yearMatch = date_string.match(/\b(\d{4})\b/);
    return yearMatch ? yearMatch[1] : '';
}

// Map of US state names to postal abbreviations
const usStateNameToAbbr = {
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

// Pre-compile state regexes once at load time, longest names first
const usStateRegexes = Object.entries(usStateNameToAbbr)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([state, abbr]) => ({ regex: new RegExp(`\\b${state}\\b`, 'gi'), abbr }));

function replaceUSStateNamesWithAbbr(place) {
    for (const { regex, abbr } of usStateRegexes) {
        place = place.replace(regex, abbr);
    }
    return place;
}

// Map of country names to ISO 3166-1 alpha-3 codes
// Source: https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
const countryNameToAlpha3 = {
    'Afghanistan': 'AFG',
    'Albania': 'ALB',
    'Algeria': 'DZA',
    'Andorra': 'AND',
    'Angola': 'AGO',
    'Argentina': 'ARG',
    'Armenia': 'ARM',
    'Australia': 'AUS',
    'Austria': 'AUT',
    'Azerbaijan': 'AZE',
    'Bahamas': 'BHS',
    'Bahrain': 'BHR',
    'Bangladesh': 'BGD',
    'Barbados': 'BRB',
    'Belarus': 'BLR',
    'Belgium': 'BEL',
    'Belize': 'BLZ',
    'Benin': 'BEN',
    'Bhutan': 'BTN',
    'Bolivia': 'BOL',
    'Bosnia and Herzegovina': 'BIH',
    'Botswana': 'BWA',
    'Brazil': 'BRA',
    'Brunei': 'BRN',
    'Bulgaria': 'BGR',
    'Burkina Faso': 'BFA',
    'Burundi': 'BDI',
    'Cabo Verde': 'CPV',
    'Cambodia': 'KHM',
    'Cameroon': 'CMR',
    'Canada': 'CAN',
    'Central African Republic': 'CAF',
    'Chad': 'TCD',
    'Chile': 'CHL',
    'China': 'CHN',
    'Colombia': 'COL',
    'Comoros': 'COM',
    'Congo': 'COG',
    'Costa Rica': 'CRI',
    'Croatia': 'HRV',
    'Cuba': 'CUB',
    'Cyprus': 'CYP',
    'Czechia': 'CZE',
    'Denmark': 'DNK',
    'Djibouti': 'DJI',
    'Dominica': 'DMA',
    'Dominican Republic': 'DOM',
    'Ecuador': 'ECU',
    'Egypt': 'EGY',
    'El Salvador': 'SLV',
    'Equatorial Guinea': 'GNQ',
    'Eritrea': 'ERI',
    'Estonia': 'EST',
    'Eswatini': 'SWZ',
    'Ethiopia': 'ETH',
    'Fiji': 'FJI',
    'Finland': 'FIN',
    'France': 'FRA',
    'Gabon': 'GAB',
    'Gambia': 'GMB',
    'Georgia': 'GEO',
    'Germany': 'DEU',
    'Ghana': 'GHA',
    'Greece': 'GRC',
    'Grenada': 'GRD',
    'Guatemala': 'GTM',
    'Guinea': 'GIN',
    'Guinea-Bissau': 'GNB',
    'Guyana': 'GUY',
    'Haiti': 'HTI',
    'Honduras': 'HND',
    'Hungary': 'HUN',
    'Iceland': 'ISL',
    'India': 'IND',
    'Indonesia': 'IDN',
    'Iran': 'IRN',
    'Iraq': 'IRQ',
    'Ireland': 'IRL',
    'Israel': 'ISR',
    'Italy': 'ITA',
    'Jamaica': 'JAM',
    'Japan': 'JPN',
    'Jordan': 'JOR',
    'Kazakhstan': 'KAZ',
    'Kenya': 'KEN',
    'Kiribati': 'KIR',
    'Kuwait': 'KWT',
    'Kyrgyzstan': 'KGZ',
    'Laos': 'LAO',
    'Latvia': 'LVA',
    'Lebanon': 'LBN',
    'Lesotho': 'LSO',
    'Liberia': 'LBR',
    'Libya': 'LBY',
    'Liechtenstein': 'LIE',
    'Lithuania': 'LTU',
    'Luxembourg': 'LUX',
    'Madagascar': 'MDG',
    'Malawi': 'MWI',
    'Malaysia': 'MYS',
    'Maldives': 'MDV',
    'Mali': 'MLI',
    'Malta': 'MLT',
    'Marshall Islands': 'MHL',
    'Mauritania': 'MRT',
    'Mauritius': 'MUS',
    'Mexico': 'MEX',
    'Micronesia': 'FSM',
    'Moldova': 'MDA',
    'Monaco': 'MCO',
    'Mongolia': 'MNG',
    'Montenegro': 'MNE',
    'Morocco': 'MAR',
    'Mozambique': 'MOZ',
    'Myanmar': 'MMR',
    'Namibia': 'NAM',
    'Nauru': 'NRU',
    'Nepal': 'NPL',
    'Netherlands': 'NLD',
    'New Zealand': 'NZL',
    'Nicaragua': 'NIC',
    'Niger': 'NER',
    'Nigeria': 'NGA',
    'North Korea': 'PRK',
    'North Macedonia': 'MKD',
    'Norway': 'NOR',
    'Oman': 'OMN',
    'Pakistan': 'PAK',
    'Palau': 'PLW',
    'Palestine': 'PSE',
    'Panama': 'PAN',
    'Papua New Guinea': 'PNG',
    'Paraguay': 'PRY',
    'Peru': 'PER',
    'Philippines': 'PHL',
    'Poland': 'POL',
    'Portugal': 'PRT',
    'Qatar': 'QAT',
    'Romania': 'ROU',
    'Russia': 'RUS',
    'Rwanda': 'RWA',
    'Saint Kitts and Nevis': 'KNA',
    'Saint Lucia': 'LCA',
    'Saint Vincent and the Grenadines': 'VCT',
    'Samoa': 'WSM',
    'San Marino': 'SMR',
    'Sao Tome and Principe': 'STP',
    'Saudi Arabia': 'SAU',
    'Senegal': 'SEN',
    'Serbia': 'SRB',
    'Seychelles': 'SYC',
    'Sierra Leone': 'SLE',
    'Singapore': 'SGP',
    'Slovakia': 'SVK',
    'Slovenia': 'SVN',
    'Solomon Islands': 'SLB',
    'Somalia': 'SOM',
    'South Africa': 'ZAF',
    'South Korea': 'KOR',
    'South Sudan': 'SSD',
    'Spain': 'ESP',
    'Sri Lanka': 'LKA',
    'Sudan': 'SDN',
    'Suriname': 'SUR',
    'Sweden': 'SWE',
    'Switzerland': 'CHE',
    'Syria': 'SYR',
    'Taiwan': 'TWN',
    'Tajikistan': 'TJK',
    'Tanzania': 'TZA',
    'Thailand': 'THA',
    'Timor-Leste': 'TLS',
    'Togo': 'TGO',
    'Tonga': 'TON',
    'Trinidad and Tobago': 'TTO',
    'Tunisia': 'TUN',
    'Turkey': 'TUR',
    'Turkmenistan': 'TKM',
    'Tuvalu': 'TUV',
    'Uganda': 'UGA',
    'Ukraine': 'UKR',
    'United Arab Emirates': 'ARE',
    'United Kingdom': 'GBR',
    'United States': 'USA',
    'United States of America': 'USA',
    'Uruguay': 'URY',
    'Uzbekistan': 'UZB',
    'Vanuatu': 'VUT',
    'Vatican City': 'VAT',
    'Venezuela': 'VEN',
    'Vietnam': 'VNM',
    'Yemen': 'YEM',
    'Zambia': 'ZMB',
    'Zimbabwe': 'ZWE'
};

// Pre-compile country regexes once at load time, longest names first
const countryRegexes = Object.entries(countryNameToAlpha3)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([country, code]) => ({ regex: new RegExp(`\\b${country}\\b`, 'gi'), code }));

function replaceCountryNamesWithAlpha3(place) {
    for (const { regex, code } of countryRegexes) {
        place = place.replace(regex, code);
    }
    return place;
}