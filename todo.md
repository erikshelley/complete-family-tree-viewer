# Next Steps

🔴🟠🟡🟢

## Bugs

### Positioning
- ~~Stacking issues with Dad's tree~~
  - ~~0 gen down : broken tree~~
  - ~~1 gen down : overlapping nodes~~
- *Sometimes siblings and spouses are spaced unevenly when some have children and some do not*
  - Fixing this could sometimes force a choice between keeping parents centered above their children vs making the tree wider
  - To move a child, first confirm parents can move if the center point changes
  - Can probably compress siblings of male ancestors


## New Features

### Misc
- ~~Hide childless inlaws should mean no children visible in tree rather than no children even if the tree were expanded~~
- Limit generation up and generation down based on root person
  - Perhaps just keep track of whether there are any more than what was chosen
  - Or if the chosen value wasn't fully realized, limit retroactively
- Sort drop down

### Positioning
- *Stack all loose leaf nodes*
  - ~~Don't auto hide childless inlaws - rely on checkbox~~
  - ~~Multiple childless inlaws for one relative~~
  - ~~Ancestor siblings~~
  - Childless children with siblings who have children
- Option for maximum stack size
- Option to hide siblings
- Option to hide inlaws
- Pan and zoom using keys

### Style
- ~~Allow svg to overflow and still be interactive in the overflowed section~~
- Configurable distance between hues
- Configurable box width and height
- Configurable line thickness

### Interface
- Zoom icons
  - Zoom in
  - Zoom out
  - Zoom to full
