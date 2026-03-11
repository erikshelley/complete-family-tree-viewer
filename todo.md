# Next Steps

## Bugs

### Positioning
- Sometimes siblings and spouses are spaced unevenly when some have children and some do not
- Sometimes there is blank space at the left of the tree, like everything was shifted right
  - Mostly when generations_up = 0?
  - Usually a tiny gap on the left with generations_up > 0, but at least one tree has no gap


## New Features

### Positioning
- Handle duplicates when relatives have children together
- Option to stack children if a parent has no grandchildren (also hides childrens' spouses)
  - Option for maximum stack size
- Change tree options without repositioning tree (or save and restore viewpoint)

### Style
- ~~Reduce distance between hues to avoid repeats when more than six generations~~
- ~~Option for node saturation~~
- ~~Option for node brightness~~
- ~~Option to choose hue for root~~
- ~~Disable dark reader~~
- ~~Scale tree to svg~~
- ~~Dynamically sized svg to fit the available space instead of fixed size~~
- Highlight pedigree nodes and paths
- Different connector style for parent-child relationship vs spouse-spouse relationship
- Add padding around the edges of the tree (after fixing padding bug)
- Option for transparent background

### Interface
- Smart filtering of person list
- Zoom icons
    - Zoom in
    - Zoom out
    - Zoom to full
