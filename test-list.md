# Complete Family Tree Viewer - Test Cases

## How to Run Tests

| Command | Description |
| ------- | ----------- |
| `npm test` | Run all automated tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:coverage` | Run all tests and generate an HTML coverage report in `coverage/` |
| `npm run test:check-ids` | Check for duplicate or missing test IDs across all test files |
| `npm run lint` | Lint source files in `src/js/` |
| `npx vitest run tests/performance.test.js` | Run only the performance and profiling tests |
| `PERF_TESTS=1 npx vitest run tests/performance.test.js` | Run performance tests with hard timing budget assertions enabled |
| `node update-mermaid-perf-colors.mjs` | Run 09.05 and update the `style` colors in all flowcharts in `mermaid.md` |

## Scope
This file defines test cases for:
- GEDCOM parsing and normalization
- Tree construction
- Tree positioning and layout behavior
- UI interactions
- Save/export behavior

## Test Data Fixtures
Use these fixture profiles when implementing tests:
1. Small family: root + spouse + one child + both parents
2. Multi-marriage family: one person with two spouse families and children in each
3. Missing-parent family: unknown husband or wife in a parent family
4. Inbreeding family: two relatives with common ancestors
5. Large family: deep generations with many leaf nodes for stack behavior

##  Automated  Unit Test Cases

### 01 GEDCOM Parsing
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 01.01 | validateGedcom returns true for valid HEAD/TRLR and numeric levels |
|  Automated  | 01.02 | validateGedcom returns false when HEAD is missing |
|  Automated  | 01.03 | validateGedcom returns false when TRLR is missing |
|  Automated  | 01.04 | extractYear returns the first 4-digit year in a date string |
|  Automated  | 01.05 | extractYear returns empty string when no year exists |
|  Automated  | 01.06 | parseGedcomData parses individuals with name, sex, birth/death date/place |
|  Automated  | 01.07 | parseGedcomData parses family records with husb/wife/chil links |
|  Automated  | 01.08 | parseGedcomData keeps final INDI record before entering a FAM block |
|  Automated  | 01.09 | place normalization removes County and trims spacing around commas |
|  Automated  | 01.10 | place normalization converts US state names to abbreviations and country names to alpha-3 |
|  Automated  | 01.11 | CONT continuation line appends to name with a space separator |
|  Automated  | 01.12 | CONC continuation line appends to name without a separator |
|  Automated  | 01.13 | CONC/CONT after BIRT does not corrupt the name field |
|  Automated  | 01.14 | CONC/CONT after DEAT does not corrupt the name field |
|  Automated  | 01.15 | CONC/CONT after FAMC does not corrupt the name field |
|  Automated  | 01.16 | CONC/CONT on a birth place appends to birth_place not to name |
|  Automated  | 01.17 | deep source-citation CONT lines (level 4+) under a NAME do not corrupt the name |
|  Automated  | 01.18 | extractGedcomCharset returns the declared charset value from a 1 CHAR line |
|  Automated  | 01.19 | extractGedcomCharset is case-insensitive and trims surrounding whitespace |
|  Automated  | 01.20 | extractGedcomCharset returns empty string when no 1 CHAR line is present |
|  Automated  | 01.21 | resolveGedcomDecoderEncoding returns utf-8 for UTF-8, UTF8, and UNICODE |
|  Automated  | 01.22 | resolveGedcomDecoderEncoding returns windows-1252 for ANSI, ANSEL, and ASCII |
|  Automated  | 01.23 | resolveGedcomDecoderEncoding defaults to utf-8 for absent or unrecognised charset |
|  Automated  | 01.24 | CRLF line endings parse identically to LF-only content |
|  Automated  | 01.25 | date modifiers ABT BEF AFT EST CAL INT all yield the embedded four-digit year |
|  Automated  | 01.26 | empty string input does not throw and returns empty arrays |
|  Automated  | 01.27 | MARR and BURI records do not crash the parser and surrounding fields remain intact |

### 02 Tree Construction (build_tree)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 02.01 | buildTree(root) creates root node with expected generation and type |
|  Automated  | 02.02 | root builds spouse as inlaw and links child nodes under that spouse |
|  Automated  | 02.03 | root with famc builds both parents as ancestor nodes |
|  Automated  | 02.04 | resolveDuplicate keeps existing ancestor when new node is non-ancestor |
|  Automated  | 02.05 | resolveDuplicate replaces existing non-ancestor when new node is ancestor |
|  Automated  | 02.06 | resolveParent creates unknown spouse record when parent id is missing |
|  Automated  | 02.07 | calculateMaxGenUp returns correct ancestor depth |
|  Automated  | 02.08 | calculateMaxGenDown returns correct descendant depth and avoids recursion loops |
|  Automated  | 02.09 | buildTree(root) with no famc leaves father_node and mother_node unset |
|  Automated  | 02.10 | resolveGenders assumes male when person has no gender and one female spouse |
|  Automated  | 02.11 | resolveGenders assumes female when person has no gender and one male spouse |
|  Automated  | 02.12 | resolveGenders assumes male for person and female for spouse when both have no gender |
|  Automated  | 02.13 | resolveGenders assumes male when person has no gender and has both male and female spouses |
|  Automated  | 02.14 | resolveGenders assumes all no-gender spouses are female when person is male |
|  Automated  | 02.15 | resolveGenders assumes all no-gender spouses are male when person is female |
|  Automated  | 02.16 | computeRawConnectionPathIds returns empty set when root and target are the same individual |
|  Automated  | 02.17 | computeRawConnectionPathIds returns empty set when target individual is not reachable |
|  Automated  | 02.18 | computeRawConnectionPathIds returns path IDs through shared parent to a sibling |
|  Automated  | 02.19 | computeRawConnectionPathIds returns path IDs through a child to a grandchild |
|  Automated  | 02.20 | hide_non_pedigree_family with connection path keeps sibling on the connection path |
|  Automated  | 02.21 | hide_non_pedigree_family without connection path still excludes sibling |
|  Automated  | 02.22 | hide_non_pedigree_family with connection path keeps ancestor in-law spouse on the connection path |
|  Automated  | 02.23 | hide_non_pedigree_family without connection path still excludes ancestor in-law spouse |
|  Automated  | 02.24 | calculateMaxStackSize returns 1 for a root with no siblings and no children |
|  Automated  | 02.25 | calculateMaxStackSize returns the leaf-child count when all children are childless |
|  Automated  | 02.26 | calculateMaxStackSize does not count children who have their own families |
|  Automated  | 02.27 | calculateMaxStackSize counts childless in-law spouses across multiple marriages |

### 03 Positioning Helpers (position_tree)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 03.01 | getCenteredColumnOrder returns center-out ordering for odd and even counts |
|  Automated  | 03.02 | getEvenlySpacedColumnIndexes returns sorted, non-duplicate index set |
|  Automated  | 03.03 | getMinimalWidthRunGroupSizes respects max_stack_size and run length |
|  Automated  | 03.04 | shouldChildBeStacked returns false when max_stack_size is 1 |
|  Automated  | 03.05 | shouldChildBeStacked respects spouse/grandchild rule |
|  Automated  | 03.06 | planOrderedChildStacks groups stackable children into minimal-width columns |
|  Automated  | 03.07 | shouldAcceptChildLayoutTrial prioritizes smaller child_max_x, then subtree width |
|  Automated  | 03.08 | positionTree assigns node level/sub_level and appends nodes to correct row buckets |
|  Automated  | 03.09 | normalizeTreeX shifts trees so all node x positions are non-negative |
|  Automated  | 03.10 | positionChildren returns min/max bounds that cover all positioned child nodes |
|  Automated  | 03.11 | Multiple child stacks stay balanced so no stack is more than one node deeper than another |
|  Automated  | 03.12 | Five child nodes with max stack size four split into balanced 2 and 3 node stacks |
|  Automated  | 03.13 | Thirteen child nodes with max stack size three split into balanced 2 and 3 node stacks |
|  Automated  | 03.14 | Thirteen child nodes with max stack size four split into balanced 3 and 4 node stacks |
|  Automated  | 03.15 | positionChildren preserves balanced final stack groups for thirteen child nodes at max stack size four |
|  Automated  | 03.16 | positionChildren compacts the left-most child subtree rightward when free horizontal space exists before parent centering |
|  Automated  | 03.17 | left-most compaction is skipped when that node is the top of a multi-node stack |

### 04 UI Helpers (ui_events)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 04.01 | getNumberInputLabel reads matching label text |
|  Automated  | 04.02 | getNumberInputLabel falls back to input id words when label is missing |
|  Automated  | 04.03 | setupCustomNumberSteppers wraps number input once and sets data-customStepper |
|  Automated  | 04.04 | stepper increment dispatches input and change events when value changes |
|  Automated  | 04.05 | stepper decrement dispatches input and change events when value changes |
|  Automated  | 04.06 | setupCustomNumberSteppers does not duplicate wrappers on repeated calls |

## 05 Integration Test Cases
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 05.01 | End-to-end: valid GEDCOM load -> individual selection -> tree appears with root and links |
|  Automated  | 05.02 | End-to-end: updateFamilyTree redraws tree without clamping generation or stack inputs |
|  Automated  | 05.03 | End-to-end: stack size changes reduce width for large leaf-heavy trees |
|  Automated  | 05.04 | End-to-end: toggle in-laws below spouses changes relative placement |
|  Automated  | 05.05 | End-to-end: hide childless in-laws removes expected inlaw nodes only |
|  Automated  | 05.06 | End-to-end: preset change updates related style inputs and redraws tree |
|  Automated  | 05.07 | Wide in-law subtree nodes do not cross the ancestor-to-child pedigree connector line |
|  Automated  | 05.08 | createFamilyTree executes without network/upload API calls (privacy/serverless behavior) |
|  Automated  | 05.09 | Siblings/children are positioned left-to-right in birth-year order with no-year nodes rightmost |
|  Automated  | 05.10 | Hide Non-Pedigree Family excludes root/ancestor sibling branches from the built tree |
|  Automated  | 05.11 | Hide Non-Pedigree Family excludes ancestor in-law spouse branches from the built tree |
|  Automated  | 05.12 | Horizontal in-law male spouse is positioned to the left of a female root |
|  Automated  | 05.13 | Horizontal in-law female spouses are positioned to the right of a male root |
|  Automated  | 05.14 | Horizontal in-law female spouses of a male root are positioned to the left of male ancestors |
|  Automated  | 05.15 | Horizontal in-law male spouse and female sibling are centered above their two children |
|  Automated  | 05.16 | Horizontal in-law male spouse and female sibling are centered above their three children |
|  Automated  | 05.17 | Horizontal in-law female spouse and male sibling are centered above their one child |
|  Automated  | 05.18 | Ancestor couple is centered above all of their children |
|  Automated  | 05.19 | drawCircles places a circle at the midpoint between a male and female ancestor |
|  Automated  | 05.20 | Vertical in-law root is centered above their spouses |
|  Automated  | 05.21 | Vertical in-law siblings are each centered above their own spouse |
|  Automated  | 05.22 | Vertical in-law sibling spouses are centered above their children |
|  Automated  | 05.23 | Vertical in-law children of a couple are in a single stack when count is within max_stack_size |
|  Automated  | 05.24 | Vertical in-law children exceeding max_stack_size are split into a stack of two and a stack of one |
|  Automated  | 05.25 | Vertical in-law childless spouses of root are stacked into a single column |
|  Automated  | 05.26 | hide_childless_inlaws removes all childless in-law spouses from the tree |
|  Automated  | 05.27 | hide_childless_inlaws and hide_non_pedigree_family with gen_down=0 leaves only root and direct ancestors |
|  Automated  | 05.28 | hide_non_pedigree_family with gen_down=0 excludes siblings but keeps root in-law spouses |
|  Automated  | 05.29 | In-law subtree to the left of the ancestor connector is separated by 1.5 * h_spacing |
|  Automated  | 05.30 | Siblings of the female pedigree ancestor are positioned to her right |
|  Automated  | 05.31 | Grandchildren of a sibling of the female ancestor are positioned level_spacing + v_spacing above the root generation |
|  Automated  | 05.32 | The in-law husband of a female ancestor is h_spacing to her right |
|  Automated  | 05.33 | Child of a female ancestor and her in-law husband is centered below the two parents |
|  Automated  | 05.34 | Vertical in-law child of ancestor is centered below the in-law parent |
|  Automated  | 05.35 | Sibling with no family is centered between the two flanking siblings with families |
|  Automated  | 05.36 | All nodes are separated horizontally by at least h_spacing |
|  Automated  | 05.37 | All nodes are separated vertically by at least v_spacing |
|  Automated  | 05.38 | All nodes are separated horizontally by at least h_spacing (vertical in-laws) |
|  Automated  | 05.39 | All nodes are separated vertically by at least v_spacing (vertical in-laws) |
|  Automated  | 05.40 | Shared great-grandparents of two ancestor lines appear exactly once and are linked to the first ancestor |
|  Automated  | 05.41 | Shared great-grandparents have a duplicate pedigree link to the second ancestor |
|  Automated  | 05.42 | Root inlaw spouse and their descendants are not duplicated as relatives under an ancestor |
|  Automated  | 05.43 | Ancestor stackable siblings are not stacked when they fit into existing horizontal space |
|  Automated  | 05.44 | Each descendant child is centered below the connector circle to the right of their male relative father |
|  Automated  | 05.45 | Child of female relative and male inlaw is centered below the connector circle to the left of the female relative |
|  Automated  | 05.46 | Pedigree-sibling link from parents does not intersect with another branch pedigree-sibling link from parents |
|  Automated  | 05.47 | Stacked in-law spouses of female ancestor are aligned to their column (two stacks of two) |
|  Automated  | 05.48 | Stacked in-law spouses of female ancestor are aligned to their column (single deeper stack) |

## 06 UI Behavior Test Cases
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 06.01 | Filter input narrows individual select options by typed substring |
|  Automated  | 06.02 | Clear filter button resets filter text and repopulates all individuals |
|  Automated  | 06.03 | Save modal Enter triggers OK action |
|  Automated  | 06.04 | Save modal Escape triggers cancel action |
|  Automated  | 06.05 | Resize controls call fit-all, fit-horizontal, and fit-vertical actions |
|  Automated  | 06.06 | Expand/collapse styling controls update section visibility state |
|  Automated  | 06.07 | Color picker updates background color setting and triggers redraw |
|  Automated  | 06.08 | updateOptionsVisibility shows options button when right column is narrower than left |
|  Automated  | 06.09 | updateMaxLinksState disables max links when no tree SVG exists and enables when tree exists |
|  Automated  | 06.10 | openSaveModal uses selected individual name slug and falls back to family-tree |
|  Automated  | 06.11 | Show Names/Years/Places checkboxes update state and trigger redraw |
|  Automated  | 06.12 | Text Shadow and Transparent Background checkboxes update state and trigger redraw |
|  Automated  | 06.13 | Browse input change forwards selected GEDCOM file to loader |
|  Automated  | 06.14 | Root person select change triggers redraw |
|  Automated  | 06.15 | Keyboard shortcuts (Esc, +/-, arrow keys) trigger zoom reset/zoom and pan actions |
|  Automated  | 06.16 | Window resize triggers options visibility update, body scaling, and redraw |
|  Automated  | 06.17 | Save modal OK with empty filename shows error message and does not save |
|  Automated  | 06.18 | selectGedcomFile renders file name as text node in status bar |
|  Automated  | 06.19 | decodeGedcomArrayBuffer decodes ANSI-declared bytes for Norse characters |
|  Automated  | 06.20 | decodeGedcomArrayBuffer preserves UTF-8 multibyte characters |
|  Automated  | 06.21 | Hide Non-Pedigree Family checkbox updates state and triggers redraw |
|  Automated  | 06.22 | Open online GEDCOM button click invokes openOnlineGedcomModal |
|  Automated  | 06.23 | Online GEDCOM cancel button hides modal |
|  Automated  | 06.24 | Online GEDCOM modal Escape key hides modal |
|  Automated  | 06.25 | Clicking a list item in the online GEDCOM modal calls loadGedcomFromUrl |
|  Automated  | 06.26 | Clicking a disabled list item does not call loadGedcomFromUrl |
|  Automated  | 06.27 | openOnlineGedcomModal shows modal and re-enables all items |
|  Automated  | 06.28 | loadGedcomFromUrl on success parses GEDCOM and updates file-name span |
|  Automated  | 06.29 | loadGedcomFromUrl on HTTP error shows error in status div |
|  Automated  | 06.30 | loadGedcomFromUrl on network failure shows error in status div |
|  Automated  | 06.31 | loadGedcomFromUrl on invalid GEDCOM shows error and re-enables items |
|  Automated  | 06.32 | populateIndividualSelect does not modify connection-select |
|  Automated  | 06.33 | populateConnectionSelect populates connection-select with tree individuals except root |
|  Automated  | 06.34 | populateConnectionSelect deduplicates individuals appearing in multiple tree nodes |
|  Automated  | 06.35 | Selecting "connection" in highlights-select shows connection-container |
|  Automated  | 06.36 | Selecting a non-connection value in highlights-select hides connection-container |
|  Automated  | 06.37 | filterConnections narrows connection-select options by typed substring |
|  Automated  | 06.38 | Clear connection filter resets text and repopulates all connections |
|  Automated  | 06.39 | connection-select change sets connection_selected_id and triggers redraw when highlight_type is connection |
|  Automated  | 06.40 | connection-select change sets connection_selected_id but does not trigger redraw when highlight_type is not connection |
|  Automated  | 06.41 | updateRangeThumbs sets highlighted-text-brightness-range thumb brightness to match its own value, not text-brightness-range value |
|  Automated  | 06.42 | addPreset opens the add-preset modal and clears the name input |
|  Automated  | 06.43 | addPreset hides any pre-existing name error when opening the modal |
|  Automated  | 06.44 | confirmAddPreset with empty name shows error message and does not create preset |
|  Automated  | 06.45 | confirmAddPreset with duplicate name prompts to replace; declining leaves modal open and preset unchanged |
|  Automated  | 06.56 | confirmAddPreset with duplicate name: confirming replaces the preset and closes modal |
|  Automated  | 06.57 | confirmAddPreset replacing a preset updates the existing option text, not adds a new one |
|  Automated  | 06.58 | confirmAddPreset detects duplicate when user types the display text of a preset whose option value differs |
|  Automated  | 06.46 | confirmAddPreset includes only checked settings in the created preset |
|  Automated  | 06.47 | confirmAddPreset captures background-color and highlight-type when their checkboxes are checked |
|  Automated  | 06.48 | confirmAddPreset adds option to preset-select, selects it, and closes the modal |
|  Automated  | 06.49 | Add-preset button click invokes addPreset |
|  Automated  | 06.50 | Add-preset modal OK button invokes confirmAddPreset |
|  Automated  | 06.51 | Add-preset modal cancel button hides the modal |
|  Automated  | 06.52 | Add-preset modal Enter key triggers the OK button |
|  Automated  | 06.53 | Add-preset modal Escape key hides the modal |
|  Automated  | 06.54 | All toggle button checks all checkboxes in its group |
|  Automated  | 06.55 | None toggle button unchecks all checkboxes in its group |
|  Automated  | 06.59 | savePreset opens the add-preset modal |
|  Automated  | 06.60 | savePreset pre-populates the name input with the selected preset display text |
|  Automated  | 06.61 | savePreset sets the name input to read-only |
|  Automated  | 06.62 | confirmAddPreset in save mode updates the preset without prompting |
|  Automated  | 06.63 | confirmAddPreset in save mode clears readOnly and saveMode on close |
|  Automated  | 06.64 | save-preset-button click invokes savePreset |
|  Automated  | 06.65 | renamePreset shows rename modal pre-filled with current name |
|  Automated  | 06.66 | confirmRenamePreset renames the preset and updates the option |
|  Automated  | 06.67 | confirmRenamePreset shows inline error when the entered name is already taken |
|  Automated  | 06.68 | rename-preset-button click invokes renamePreset |
|  Automated  | 06.69 | reload-preset-button click applies the currently selected preset |
|  Automated  | 06.70 | deletePreset prompts to confirm using the preset display name |
|  Automated  | 06.71 | deletePreset removes the preset and option when the user confirms |
|  Automated  | 06.72 | deletePreset does not delete when the user cancels |
|  Automated  | 06.73 | delete-preset-button click invokes deletePreset |
|  Automated  | 06.74 | preset edit buttons are disabled when loaded from a web server |
|  Automated  | 06.75 | preset edit buttons are not disabled when loaded locally |
|  Automated  | 06.76 | confirmAddPreset triggers a presets.js download |
|  Automated  | 06.77 | confirmRenamePreset triggers a presets.js download |
|  Automated  | 06.78 | deletePreset triggers a presets.js download |
|  Automated  | 06.79 | savePresetsFile uses showSaveFilePicker when available |
|  Automated  | 06.80 | savePresetsFile shows a message in the fallback download path |
|  Automated  | 06.81 | populatePresetSelect builds options from style_presets keys |
|  Automated  | 06.82 | populatePresetSelect is called during DOMContentLoaded |
|  Automated  | 06.83 | populatePresetSelect sorts options alphabetically |
|  Automated  | 06.84 | confirmRenamePreset shows inline error when name is empty |
|  Automated  | 06.85 | rename-preset-modal OK and Cancel buttons are wired during DOMContentLoaded |
|  Automated  | 06.86 | updatePresetEditButtonState disables rename and delete when Default is selected |
|  Automated  | 06.87 | updatePresetEditButtonState enables rename and delete when a non-Default preset is selected |
|  Automated  | 06.88 | preset-select change event calls updatePresetEditButtonState |
|  Automated  | 06.89 | addPreset resets all preset-setting checkboxes to checked |
|  Automated  | 06.90 | savePreset checks only the checkboxes whose settings are present in the selected preset |
|  Automated  | 06.91 | confirmAddPreset with quotes in the name generates valid loadable presets.js content |
|  Automated  | 06.92 | confirmRenamePreset with quotes in the name generates valid loadable presets.js content |
|  Automated  | 06.93 | about button click invokes openAboutModal |
|  Automated  | 06.94 | about modal close button hides the about modal |
|  Automated  | 06.95 | Escape key on about modal hides the modal |
|  Automated  | 06.96 | openAboutModal shows the modal and sets latest version to Checking |
|  Automated  | 06.97 | openAboutModal updates latest version span on successful fetch |
|  Automated  | 06.98 | openAboutModal sets latest version to Unavailable on fetch error |
|  Automated  | 06.99 | confirmAddPreset saves generations-up and generations-down when their checkboxes are checked |
|  Automated  | 06.100 | confirmAddPreset omits generations-up and generations-down when their checkboxes are unchecked |
|  Automated  | 06.101 | expandAllStylingSections opens all details elements and updates button visibility |
|  Automated  | 06.102 | collapseAllStylingSections closes all details elements and updates button visibility |
|  Automated  | 06.103 | toggleOptions adds open class when not open and removes it when already open |
|  Automated  | 06.104 | scaleBodyForSmallScreens applies proportional scale transform when innerWidth is below 450 |
|  Automated  | 06.105 | scaleBodyForSmallScreens resets body transform and width when innerWidth is at or above 450 |
|  Automated  | 06.106 | DOMContentLoaded initialises range element to default value and window variable |
|  Automated  | 06.107 | DOMContentLoaded sets number element to default; input below minimum clamps to min |
|  Automated  | 06.108 | DOMContentLoaded sets select element to default and updates window variable on change |
|  Automated  | 06.109 | DOMContentLoaded max-link click sets element and window variable to element maximum |
|  Automated  | 06.110 | DOMContentLoaded none_links click resets variable to 100 and updates range and number elements |
|  Automated  | 06.111 | DOMContentLoaded with non-local protocol adds disabled class to all preset edit buttons |
|  Automated  | 06.112 | usePresetStyle applies a radio-type preset key by checking the matching radio input |
|  Automated  | 06.113 | usePresetStyle removes hidden class from connection-container when highlight type becomes connection |
|  Automated  | 06.114 | usePresetStyle adds hidden class to connection-container when highlight type is not connection |
|  Automated  | 06.115 | requestFamilyTreeUpdate sets update_waiting when an update is already in progress |

## 07 Export Test Cases
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 07.01 | Save SVG creates valid SVG output for visible tree content |
|  Automated  | 07.02 | Save PNG creates PNG output for visible tree content |
|  Automated  | 07.03 | Export filename uses user-provided name and falls back to default when empty |
|  Automated  | 07.04 | PNG export handles overly large trees by resizing within limits |
|  Automated  | 07.05 | saveSVG preserves feDropShadow filter elements in the serialized SVG output |
|  Automated  | 07.06 | saveSVG on an empty tree calls alert and does not trigger a download |
|  Automated  | 07.07 | savePNG at normal scale preserves viewBox dimensions and does not alert |

## 08 Edge Cases
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 08.01 | Individual without name should not crash tree generation |
|  Automated  | 08.02 | Individual with unknown gender should still render node safely |
|  Automated  | 08.03 | Family with no children should not create child links |
|  Automated  | 08.04 | Circular references in malformed data should not cause infinite loops |
|  Automated  | 08.05 | Very large trees should still render without throwing runtime errors |

## 09 Performance/Stress
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 09.01 | Load and render medium tree (500+ people) under acceptable time budget |
|  Automated  | 09.02 | Load and render large tree (2000+ people) without browser freeze |
|  Automated  | 09.03 | Repeated redraw actions (style sliders) should not leak memory significantly |

## 10 Manual Regression Checklist
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
| Not Started | 10.01 | Open app and load a known GEDCOM file |
| Not Started | 10.02 | Select root person and verify tree renders |
| Not Started | 10.03 | Toggle each major content option and verify redraw correctness |
| Not Started | 10.04 | Toggle each major styling option and verify visual updates |
| Not Started | 10.05 | Save both SVG and PNG and verify files open correctly |
| Not Started | 10.06 | Resize browser window and verify responsive behavior still works |

## 11 Rendering Helpers (draw_tree)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 11.01 | getMaximumDimensions returns expected max width/height and node count from positioned rows |
|  Automated  | 11.02 | buildSecondaryStrings formats birth/death/place text and omits empty values |
|  Automated  | 11.03 | estimateTextDimensions scales width/height estimates with line count and font sizes |
|  Automated  | 11.04 | getNodeHCL returns adjusted color values for descendant/inlaw highlight states |
|  Automated  | 11.05 | shrinkToFit reduces text size until content fits within configured node box bounds |
|  Automated  | 11.06 | drawText never renders names, dates, or places below 6px |
|  Automated  | 11.07 | drawNode applies node_rounding and pedigree/border highlight multipliers to visual attributes |
|  Automated  | 11.08 | drawLink path geometry changes based on link_rounding setting |
|  Automated  | 11.09 | Non-top stacked children link to the node above in stack and do not link directly to parent |
|  Automated  | 11.10 | Non-top stacked in-laws link to the in-law above in stack and do not link directly to spouse |
|  Automated  | 11.11 | In-law spouse/stack links are always desaturated (grey) |
|  Automated  | 11.12 | drawText initial layout can reduce secondary font size (years shown) to improve long-name fit |
|  Automated  | 11.13 | drawText renders long names across multiple name lines before years when places are hidden |
|  Automated  | 11.14 | fitTextInBox does not split unbroken names mid-character; falls back to min font size instead |
|  Automated  | 11.15 | fitTextInBox fallback returns wrapped min-size lines when height is too constrained for a full fit |

## 12 Horizontal Orientation (draw_tree)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 12.01 | mapCoords returns {x: s, y: g} for vertical orientation |
|  Automated  | 12.02 | mapCoords returns {x: g, y: s} for horizontal orientation |
|  Automated  | 12.03 | nodeW returns box_width in both orientations |
|  Automated  | 12.04 | nodeH returns box_height in both orientations |
|  Automated  | 12.05 | getMaximumDimensions returns sibling extent as SVG width in vertical mode |
|  Automated  | 12.06 | getMaximumDimensions returns generation extent as SVG width in horizontal mode |
|  Automated  | 12.07 | drawNode uses (x, y) translate and box_width × box_height rect in vertical mode |
|  Automated  | 12.08 | drawNode uses (y, x) translate and box_width × box_height rect in horizontal mode |
|  Automated  | 12.09 | drawLink path advances along y-axis first in vertical mode |
|  Automated  | 12.10 | drawLink path advances along x-axis first in horizontal mode |
|  Automated  | 12.11 | drawCircle maps center sibling→cx, generation→cy in vertical mode |
|  Automated  | 12.12 | drawCircle maps center generation→cx, sibling→cy in horizontal mode |
|  Automated  | 12.13 | layout radio change to horizontal updates tree_orientation and triggers redraw |
|  Automated  | 12.14 | layout radio change to vertical updates tree_orientation and triggers redraw |
|  Automated  | 12.15 | layout radio change does not trigger redraw when the input is not checked |
|  Automated  | 12.17 | in horizontal mode setHeights places ancestor levels to the right of descendant levels |
|  Automated  | 12.18 | drawCircles places ancestor circle at sibling-axis midpoint between parents in vertical mode |
|  Automated  | 12.19 | drawCircles places ancestor circle at sibling-axis midpoint between parents in horizontal mode |
|  Automated  | 12.20 | drawBoldLinks mother link starts at correct sibling-axis position in horizontal mode (non-beside, box_width > box_height) |
|  Automated  | 12.21 | drawBoldLinks beside-mode link endpoint has correct sibling-axis position in horizontal mode (box_width > box_height) |
|  Automated  | 12.22 | drawCircles places circle at correct sibling-axis position for female inlaw (non-ancestor spouse) in horizontal mode (box_width > box_height) |
|  Automated  | 12.23 | drawNonBoldLinks beside-inlaw link from female inlaw starts at correct sibling-axis position in horizontal mode (box_width > box_height) |
|  Automated  | 11.16 | drawText wraps a long multi-part name before years when places are hidden |
|  Automated  | 11.17 | drawText uses a shared SVG filter for text shadows |
|  Automated  | 11.18 | auto_box_width equals text width at desired font size plus padding when name fits without shrinking |
|  Automated  | 11.19 | auto_box_width exceeds box_width when dates are wider than the box at the preferred secondary font size |
|  Automated  | 11.20 | auto_box_width accumulates the maximum across multiple drawText calls |
|  Automated  | 11.25 | auto_box_height reflects preferred secondary font size when box height is too small for unshrunk text |
|  Automated  | 11.26 | auto_box_height reflects preferred secondary even when selectInitialTextLayout reduced it to fit the name |
|  Automated  | 11.21 | alignTextVertically places text top/middle/bottom precisely using exact getBBox coords |
|  Automated  | 11.22 | alignTextVertically works correctly for multiline text with unequal dy gaps |
|  Automated  | 11.23 | drawText uses geometric bbox model so text is never placed at midpoint regardless of getBBox output |
|  Automated  | 11.24 | Non-top stacked in-law of a female ancestor links to the in-law above and not directly to the ancestor |

## 14 Content Display (draw_tree)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 14.01 | drawText shows name only when show_years and show_places are both false |
|  Automated  | 14.02 | drawText shows name and dates but no places when show_places is false |
|  Automated  | 14.03 | drawText shows name and places but no standalone date line when show_years is false |
|  Automated  | 14.04 | drawText shows name, dates embedded in places when both show_years and show_places are true |
|  Automated  | 14.05 | drawText shows name and dates but no places when show_places is false (variant) |

## 13 Node Styling (draw_tree)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 13.01 | Nodes at the root-sibling generation have hue equal to root_hue |
|  Automated  | 13.02 | Non-in-law nodes have chroma equal to node_saturation |
|  Automated  | 13.03 | In-law nodes have chroma 0 regardless of node_saturation |
|  Automated  | 13.04 | Links drawn to in-law spouses have no saturation (chroma 0) |
|  Automated  | 13.05 | Links drawn from an ancestor to non-in-law children have saturation equal to node_saturation |
|  Automated  | 13.06 | Nieces and nephews have a hue 60 less than the root-sibling generation hue |
|  Automated  | 13.07 | Step-siblings have the same hue as the root-sibling generation |
|  Automated  | 13.08 | Parents have a hue 60 more than the root-sibling generation hue |
|  Automated  | 13.09 | Links drawn to in-law spouses have stroke-dasharray equal to link_width,link_width |
|  Automated  | 13.10 | Nieces and nephews hue wraps to 300 when root_hue is 0 (no negative hues) |
|  Automated  | 13.11 | Parents hue wraps to 0 when root_hue is 300 (no hues >= 360) |
|  Automated  | 13.12 | drawNode with highlight_type "none" applies no pedigree factor to any node |
|  Automated  | 13.13 | drawNode with highlight_type "root" applies pedigree factor only to the root node, not ancestors |
|  Automated  | 13.14 | findConnectionPath returns IDs of all nodes on the path from root to target |
|  Automated  | 13.15 | drawNode with highlight_type "connection" brightens on-path nodes and leaves off-path nodes unchanged |
|  Automated  | 13.16 | getLinkHighlightFactor with linked_node requires both endpoints on path in connection mode |
|  Automated  | 13.17 | getLinkHighlightFactor with linked_node is ignored for pedigree and none modes |
|  Automated  | 13.18 | promoteConnectionNodesInStacks swaps a non-top stacked node to stack_top when it is on the connection path |
|  Automated  | 13.19 | promoteConnectionNodesInStacks leaves the stack unchanged when the stack_top is already on the connection path |
|  Automated  | 13.20 | promoteConnectionNodesInStacks does nothing when connection_path_ids is empty |
|  Automated  | 13.21 | drawLink uses link_width as stroke-width when the highlight factor is 1 |
|  Automated  | 13.22 | drawLink uses highlighted_link_width as stroke-width when the highlight factor is not 1 |
|  Automated  | 13.23 | drawText uses text_brightness for non-highlighted nodes |
|  Automated  | 13.24 | drawText uses highlighted_text_brightness for highlighted nodes |

## 15 UI Styles
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 15.01 | All checkbox labels use the pointer cursor |
|  Automated  | 15.02 | All radio button inputs and their labels use the pointer cursor |

## 16 Presets
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 16.01 | style_presets is a non-empty object when presets.js is loaded |
|  Automated  | 16.02 | each preset in style_presets is a non-empty object with at least one setting |

## 17 DOM Integrity
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 17.01 | every getElementById target in ui_declarations.js resolves to an element in index.html |
|  Automated  | 17.02 | every id in the elements, none_links, and auto_links arrays exists in index.html |

## Coverage Tracking
Mark each case as one of:
- Not Started
-  Automated 
- Manual Verified
- Blocked
