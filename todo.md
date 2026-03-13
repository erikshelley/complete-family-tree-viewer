# Next Steps

🔴🟠🟡🟢

## Bugs
- ~~Failing on newest gedcom file~~
- ~~Horizontal link to inlaw not always vertically centered~~
- ~~Zero hue on the slider is showing as 120~~
- ~~Are names always being split in the middle?~~
- Warning showing dates for Unknown Person
- Vertical centering is off for one-liners

### Positioning
- ? Sometimes siblings and spouses are spaced unevenly when some have children and some do not
  - Fixing this could sometimes force a choice between keeping parents centered above their children vs making the tree wider
  - To move a child, first confirm parents can move if the center point changes
  - Can probably compress siblings of male ancestors
  - Not going to happen with stacking


## New Features

### Misc
- Show locations in nodes
- Queue second request to update family tree to keep interface responsive
- Disable [max] and [auto] links if there is no tree displayed
- ? Sort drop down

### Positioning
- *Pedigree only - option to hide siblings (and ancestor inlaws)*
- Raise horizontal lines to female ancestor so horizontal line from male ancestor siblings can slide underneath
  - Raise the line for duplicates twice as much
- Pan and zoom using keys

### Style
- ~~Min width for left column~~
- ~~Make size of dashes responsive to the line size~~
- Responsive design
- Highlight descendants (all pedigree)
- Node borders
- Hue direction
- Node rounding
- Link rounding
- ? Font size
- ? Distance between hues

### Interface
- Number inputs for each range input
- Zoom icons
  - Zoom in
  - Zoom out
  - Zoom to full
- Max zoom should depend on svg size rather than being fixed at 100x
