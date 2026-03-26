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
});