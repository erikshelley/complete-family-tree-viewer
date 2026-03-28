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
|  Automated  | 05.02 | End-to-end: generations up/down changes redraw tree and enforce max limits |
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
|  Automated  | 06.22 | All checkbox labels use the pointer cursor |
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
|  Automated  | 11.17 | drawText uses a shared SVG filter for text shadows |

## 12 Content Display (draw_tree)
|    Status   |  ID   | Test Description |
| ----------- | ----- | ---------------- |
|  Automated  | 12.01 | drawText shows name only when show_years and show_places are both false |
|  Automated  | 12.02 | drawText shows name and dates but no places when show_places is false |
|  Automated  | 12.03 | drawText shows name and places but no standalone date line when show_years is false |
|  Automated  | 12.04 | drawText shows name, dates embedded in places when both show_years and show_places are true |
|  Automated  | 12.05 | drawText shows name and dates but no places when show_places is false (variant) |

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

## Coverage Tracking
Mark each case as one of:
- Not Started
-  Automated 
- Manual Verified
- Blocked
