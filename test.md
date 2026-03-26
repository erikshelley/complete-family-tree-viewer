# Complete Family Tree Viewer - Test Cases

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
|  Automated  | 05.02 | End-to-end: generations up/down changes redraw tree and enforce max limits |
|  Automated  | 05.03 | End-to-end: stack size changes reduce width for large leaf-heavy trees |
|  Automated  | 05.04 | End-to-end: toggle in-laws below spouses changes relative placement |
|  Automated  | 05.05 | End-to-end: hide childless in-laws removes expected inlaw nodes only |
|  Automated  | 05.06 | End-to-end: preset change updates related style inputs and redraws tree |
|  Automated  | 05.07 | Wide in-law subtree nodes do not cross the ancestor-to-child pedigree connector line |
|  Automated  | 05.08 | createFamilyTree executes without network/upload API calls (privacy/serverless behavior) |
|  Automated  | 05.09 | Siblings/children are positioned left-to-right in birth-year order with no-year nodes rightmost |

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

## 07 Export Test Cases
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 07.01 | Save SVG creates valid SVG output for visible tree content |
|  Automated  | 07.02 | Save PNG creates PNG output for visible tree content |
|  Automated  | 07.03 | Export filename uses user-provided name and falls back to default when empty |
|  Automated  | 07.04 | PNG export handles overly large trees by resizing within limits |

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
|  Automated  | 11.14 | fitTextInBox wraps long unbroken names to multiple lines when vertical space allows |
|  Automated  | 11.15 | fitTextInBox fallback returns wrapped min-size lines when height is too constrained for a full fit |
|  Automated  | 11.16 | drawText wraps a long multi-part name before years when places are hidden |

## Coverage Tracking
Mark each case as one of:
- Not Started
-  Automated 
- Manual Verified
- Blocked
