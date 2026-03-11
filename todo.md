# Next Steps

## Bugs

### Positioning
- ~~Tree updates stop working after filtering drop down~~
- ~~Horizontal line for male siblings intersects horizontal line from female to her parents (Mom's 4th generation tree)~~
- ~~Male ancestor line crossed by node that should have set a leaf boundary (Mom's 4th generation tree)~~
- ~~Some extra spacing in Grace's 2nd gen tree between Mary Kistler and her siblings, goes away in 3rd gen tree~~
- ~~Some extra spacing in Mom's 2nd gen tree between James Spicer and his siblings~~
- Sometimes siblings and spouses are spaced unevenly when some have children and some do not
  - Fixing this could sometimes force a choice between keeping parents centered above their children vs making the tree wider
- Slow performance for very large trees


## New Features

### Positioning
- Handle duplicates when relatives have children together
- Option to stack children if a parent has no grandchildren (also hides childrens' spouses)
  - Option for maximum stack size
- Change tree options without repositioning tree (or save and restore viewpoint)
  - Some changes don't require recreating the viewbox

### Style
- Different connector style for parent-child relationship vs spouse-spouse relationship
- Configurable distance between hues

### Interface
- Zoom icons
    - Zoom in
    - Zoom out
    - Zoom to full
