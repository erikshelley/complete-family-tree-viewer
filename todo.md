# Next Steps

🔴🟠😑🟡🥎🟢⚫

## Bugs
- ~~If root is part of a stack but not the top of a stack, the link to their parent misbehaves (Sarah Britcher) - force them to the top of the stack~~
- Vertical centering is slightly off for one-liners (too low)
- Vertical centering is slightly off for nodes with smaller fonts than the rest (too high)
- Max stack size does not work if clicked while tree is updating
- The Max stack size input sometimes becomes zero (when gen up and gen down become zero), don't think the max size variable is being changed, just the inputs
- Warning when showing dates for an Unknown Person

## New Features
- *README.md | about page*
- *Pedigree only - option to hide siblings (and ancestor inlaws)*
- Highlight descendants (all pedigree)
- Node borders
- Responsive design (mobile)
- Style presets (dark, light, square, round, default)
- Tool tips should be the same size regardless of the zoom
- Max zoom should depend on svg size rather than being fixed at 100x
- Visibly disable / hide [max] and [auto] links if there is no tree displayed
- If there is enough vertical room, break names into more lines rather than shrinking their font
- Specify PNG size to avoid failing on large trees

## Under Considuration
- *Raise horizontal lines to female ancestor so horizontal line from male ancestor siblings can slide underneath (raise duplicates twice as much)*
- *After selecting root, create a second list of people and if one is selected, highlight the path between them*
- Collapsible sections in the left nav
- Gallery of cool examples
- Pan and zoom using keyboard
- Zoom icons - Zoom in - Zoom out - Zoom to full
- Hue direction
- Sort drop down
- Distance between hues
- Sometimes siblings and spouses are spaced unevenly when some have children and some do not
  - Fixing this could sometimes force a choice between keeping parents centered above their children vs making the tree wider
  - To move a child, first confirm parents can move if the center point changes
  - Can probably compress siblings of male ancestors
  - Not going to happen with stacking
