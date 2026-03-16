# Backlog

🔴🟠🟡🟢

| Priority |   Type  | Description |
|:--------:|:-------:| ----------- |
|    🔴    | Feature | 🟢 ~~README - Add description for the style presets~~ |
|    🔴    | Feature | 🟢 ~~README - Add links for how to create and export Gedcom files~~ |
|    🟠    | Feature | 🟢 ~~README - Change example image for tree viewer to include a loaded tree~~ |
|    🟠    | Feature | 🟢 ~~Gap between levels~~ |
|    🟠    | Feature | Reset zoom |
|    🟠    | Feature | Option to have inlaws next to their spouses |
|    🟡    | Feature | Vertical text alignment, top/middle/bottom |
|    🟡    |   Bug   | Vertical text centering is slightly too low for one-liners |
|    🟡    |   Bug   | Vertical text centering is slightly too high for nodes with smaller fonts than the rest |
|    🟡    | Feature | Auto text size |
|    🟡    | Feature | Option to hide siblings (and ancestor inlaws) - pedigree only tree |
|    🟡    | Feature | Click on node to make them the new root person - is this possible? |
|    🟡    | Feature | After selecting root, create 2nd list, if selected, highlight the path between them |
|    🟡    | Feature | Option to hide dotted links for inbreeding - add nodes with "Duplicate of {person name}" |
|    🟡    |   Bug   | Warning in dev tools when showing dates for an Unknown Person |
|    🟡    |   Bug   | Are special characters displayed properly (accents, umlauts, etc.)? : UTF-8 |
|    🟡    | Feature | Is it possible to show profile images from sites like Ancestry.com from what's in the Gedcom? |
|    🟡    |   Bug   | Slower rendering for very large trees seems to be due to the text - without text it is quick |

## Under Considuration
- Raise horizontal lines to some ancestors so horizontal line from other ancestor siblings can slide underneath (raise duplicates twice as much)
- Demo branch that can load example Gedcoms available
- Tool tips - should be the same size regardless of the zoom
- If there is enough vertical room, break names into more lines rather than shrinking their font
- Collapsible sections in the left nav
- Pan and zoom using keyboard
- Zoom icons - Zoom in - Zoom out - Zoom to full
- Hue direction
- Sort drop down
- Distance between hues
- Instructions for exporting Gedcom files from various Genealogy sites and applications
- Sometimes siblings and spouses are spaced unevenly when some have children and some do not
  - Fixing this could sometimes force a choice between keeping parents centered above their children vs making the tree wider
  - To move a child, first confirm parents can move if the center point changes
  - Can probably compress siblings of male ancestors
  - Not going to happen with stacking
