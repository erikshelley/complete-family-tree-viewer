# Automated Testing Plan

This project now includes a Vitest-based unit test suite.

## Run Tests

- `npm test` runs all tests once.
- `npm run test:watch` runs tests in watch mode.

## Initial Test Coverage

The first suite focuses on GEDCOM parsing logic in `src/js/gedcom.js`:

- GEDCOM format validation (`validateGedcom`)
- Year extraction (`extractYear`)
- Place normalization for US states and countries
- Parsing individuals and families from a GEDCOM sample (`parseGedcomData`)

The current suite also includes `src/js/build_tree.js` coverage for:

- Root tree construction (spouses, in-law children, and parent linking)
- Duplicate resolution behavior (`resolveDuplicate`)
- Unknown parent creation (`resolveParent` / `createUnknownIndividual`)
- Downward generation depth calculation (`calculateMaxGenDown`)

The current suite also includes `src/js/position_tree.js` helper coverage for:

- Centered/evenly-spaced column index planning
- Minimal-width stack group sizing
- Child stack eligibility and stack planning
- Layout trial acceptance decisions

The current suite also includes focused `src/js/ui_events.js` helper coverage for:

- Number input label resolution
- Custom number stepper wiring and event dispatch behavior

## Next High-Value Test Cases

1. `src/js/build_tree.js`
   - Build tree nodes from parsed GEDCOM data
   - Verify parent/spouse/child linkage integrity
   - Verify duplicate-parent and pedigree markers

2. `src/js/position_tree.js`
   - Positioning invariants: no overlap in level/sub-level rows
   - In-law placement behavior for vertical vs horizontal mode
   - Stack-size behavior and leaf stacking boundaries

3. `src/js/draw_tree.js`
   - SVG path generation for parent, child, and in-law links
   - Text rendering toggles (name/year/place)

4. `src/js/ui_events.js`
   - Input event handling for generation limits and filters
   - Preset application updates to related controls

## Strategy Notes

- Prioritize pure functions for stable unit tests.
- For DOM event behavior, use `jsdom` in focused tests.
- Add regression fixtures for GEDCOM edge cases (missing gender, unknown dates, multiple marriages, inbreeding).