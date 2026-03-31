import { describe, expect, it } from 'vitest';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function loadGedcomFunctions() {
    const context = loadBrowserScript('src/js/gedcom.js');
    return {
        validateGedcom: context.validateGedcom,
        parseGedcomData: context.parseGedcomData,
        extractYear: context.extractYear,
        replaceUSStateNamesWithAbbr: context.replaceUSStateNamesWithAbbr,
        replaceCountryNamesWithAlpha3: context.replaceCountryNamesWithAlpha3,
    };
}

describe('gedcom utilities', () => {
    it('validates GEDCOM headers, trailer, and level format', () => {
        const { validateGedcom } = loadGedcomFunctions();

        const validGedcom = [
            '0 HEAD',
            '1 SOUR Test',
            '0 @I1@ INDI',
            '1 NAME John /Doe/',
            '0 TRLR',
        ].join('\n');

        const missingHeader = [
            '0 @I1@ INDI',
            '1 NAME John /Doe/',
            '0 TRLR',
        ].join('\n');

        const missingTrailer = [
            '0 HEAD',
            '1 SOUR Test',
            '0 @I1@ INDI',
        ].join('\n');

        const invalidLevelLine = [
            '0 HEAD',
            '1 SOUR Test',
            'x INVALID',
            '0 TRLR',
        ].join('\n');

        expect(validateGedcom(validGedcom)).toBe(true);
        expect(validateGedcom(missingHeader)).toBe(false);
        expect(validateGedcom(missingTrailer)).toBe(false);
        expect(validateGedcom(invalidLevelLine)).toBe(false);
    });

    it('extracts years from GEDCOM date strings', () => {
        const { extractYear } = loadGedcomFunctions();

        expect(extractYear('15 JAN 1980')).toBe('1980');
        expect(extractYear('ABT 2020')).toBe('2020');
        expect(extractYear('UNKNOWN')).toBe('');
    });

    it('normalizes US states and countries in places', () => {
        const { replaceUSStateNamesWithAbbr, replaceCountryNamesWithAlpha3 } = loadGedcomFunctions();

        expect(replaceUSStateNamesWithAbbr('Austin, Texas, United States')).toBe('Austin, TX, United States');
        expect(replaceUSStateNamesWithAbbr('Texastown, texas')).toBe('Texastown, TX');

        expect(replaceCountryNamesWithAlpha3('London, United Kingdom')).toBe('London, GBR');
        expect(replaceCountryNamesWithAlpha3('Boston, United States of America')).toBe('Boston, USA');
    });

    it('parses individuals and families from GEDCOM content', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '1 SOUR Test',
            '0 @I1@ INDI',
            '1 NAME John /Doe/ Jr',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 15 JAN 1980',
            '2 PLAC Los Angeles County, California, United States',
            '1 DEAT',
            '2 DATE ABT 2020',
            '2 PLAC Orange County, California, United States of America',
            '1 FAMS @F1@',
            '0 @I2@ INDI',
            '1 NAME Jane /Smith/',
            '1 SEX F',
            '1 BIRT',
            '2 DATE 1982',
            '2 PLAC London, United Kingdom',
            '1 FAMS @F1@',
            '0 @I3@ INDI',
            '1 NAME Kid /Doe/',
            '1 SEX F',
            '1 BIRT',
            '2 DATE 2010',
            '2 PLAC Austin, Texas, United States',
            '1 FAMC @F1@',
            '0 @F1@ FAM',
            '1 HUSB @I1@',
            '1 WIFE @I2@',
            '1 CHIL @I3@',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);

        expect(result.individuals).toHaveLength(3);
        expect(result.families).toHaveLength(1);

        const john = result.individuals.find(person => person.id === '@I1@');
        expect(john).toMatchObject({
            name: 'John Doe',
            gender: 'M',
            birth: '1980',
            death: '2020',
            birth_place: 'Los Angeles, CA, USA',
            death_place: 'Orange, CA, USA',
            fams: ['@F1@'],
        });

        const family = result.families[0];
        expect(family).toEqual({
            id: '@F1@',
            husb: '@I1@',
            wife: '@I2@',
            chil: ['@I3@'],
        });
    });

    it('01.11 CONT continuation line appends to name with a space separator', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME John',
            '2 CONT Doe',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);
        expect(result.individuals[0].name).toBe('John Doe');
    });

    it('01.12 CONC continuation line appends to name without a separator', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME John',
            '2 CONC ny',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);
        // NAME handler stores the processed name after slash removal; CONC appends raw
        expect(result.individuals[0].name).toBe('Johnny');
    });

    it('01.13 CONC/CONT after BIRT does not corrupt the name field', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME Alice /Smith/',
            '1 BIRT',
            '2 DATE 15 JAN 1990',
            '2 CONT some extra note',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);
        expect(result.individuals[0].name).toBe('Alice Smith');
        expect(result.individuals[0].birth).toBe('1990');
    });

    it('01.14 CONC/CONT after DEAT does not corrupt the name field', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME Bob /Jones/',
            '1 DEAT',
            '2 DATE 2020',
            '2 CONT extra',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);
        expect(result.individuals[0].name).toBe('Bob Jones');
    });

    it('01.15 CONC/CONT after FAMC does not corrupt the name field', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME Carol /Lee/',
            '1 FAMC @F1@',
            '2 CONT continuation that should be ignored',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);
        expect(result.individuals[0].name).toBe('Carol Lee');
    });

    it('01.16 CONC/CONT on a birth place appends to birth_place not to name', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME Dave /Brown/',
            '1 BIRT',
            '2 PLAC Springfield',
            '3 CONT Illinois, United States',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);
        expect(result.individuals[0].name).toBe('Dave Brown');
        expect(result.individuals[0].birth_place).toContain('Springfield');
        expect(result.individuals[0].birth_place).toContain('Illinois');
    });

    it('01.17 deep source-citation CONT lines (level 4+) under a NAME do not corrupt the name', () => {
        // Ancestry and other tools embed SOUR->DATA->TEXT->CONT sub-records under NAME.
        // These CONT lines are at level 4 or 5, not at level 2 (the immediate child of NAME),
        // so they must be ignored.
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME John /Doe/',
            '2 SOUR @S1@',
            '3 PAGE Death Certificate, 1943',
            '3 DATA',
            '4 DATE 15 OCT 1943',
            '4 TEXT Transcription of death certificate',
            '5 CONT John Doe, died 1943, age 45',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);
        expect(result.individuals[0].name).toBe('John Doe');
    });

    it('preserves UTF-8 and special characters in names and places', () => {
        const { parseGedcomData } = loadGedcomFunctions();

        const content = [
            '0 HEAD',
            '1 CHAR UTF-8',
            '0 @I1@ INDI',
            '1 NAME José /Muñoz/',
            '1 BIRT',
            '2 DATE 1980',
            '2 PLAC Göteborg, Västra Götaland, Sweden',
            '0 @I2@ INDI',
            '1 NAME 李 /小龍/',
            '1 BIRT',
            '2 DATE 1940',
            '2 PLAC Hong Kong, China',
            '0 TRLR',
        ].join('\n');

        const result = parseGedcomData(content);

        expect(result.individuals).toHaveLength(2);
        expect(result.individuals[0].name).toBe('José Muñoz');
        expect(result.individuals[0].birth_place).toBe('Göteborg, Västra Götaland, SWE');
        expect(result.individuals[1].name).toBe('李 小龍');
        expect(result.individuals[1].birth_place).toBe('Hong Kong, CHN');
    });
});