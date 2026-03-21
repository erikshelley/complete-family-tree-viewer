# Backlog

🔴🟠🟡🟢⚫

| Priority |   Type  | &nbsp;Target&nbsp;  | Functions | Description |
|:--------:|:-------:| ------------------- |:---------:| ----------- |
|    🟡    |   Bug   |        | UI | Narrow windows push Tree Viewer header below buttons |
|    🟡    |   Bug   |        | UI | Sometimes extra gap between inlaws in descendaant trees : Sharlot 0up x 2dn has no gap, 1up x 2dn has a gap |
|    🟡    |   Bug   |        | TBD | Issues when root has no gender? no spouse? Issue for non-root individuals? |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟡    | Feature | 19-Mar | UI | ~~Collapsible options sections~~ |
|    🟡    |   Bug   | 19-Mar | UI | ~~Mouse cursor not changing over label of Show Places of Birth/Death~~ |
|    🟡    |   Bug   | 19-Mar | UI | ~~Size to fit does not need to redraw the tree~~ |
|    🔴    |   Bug   | 20-Mar | Build | ~~Alexander Fred as root, 2 generations up, >0 gen down, Maria Fitzpatrick as his spouse gets replaced by Maria as the daughter of his Aunt~~ |
|    🔴    |   Bug   | 20-Mar | Build + UI | ~~Maxing out generations down (or exceeding by one) breaks the color hues, but not always~~ |
|    🔴    |   Bug   | 20-Mar | UI | ~~Sometimes selecting a root person does not display a tree~~ |
|    🔴    | Feature | 20-Mar | UI + Position | ~~Option to have inlaws next to their spouses - will require updates to the README~~ |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟠    | Feature | 20-Mar | UI + Draw | Specify number of lines allowed for name |
|    🟡    | Feature | 20-Mar | UI + Draw | Vertical text alignment, top/middle/bottom |
|    🟡    |   Bug   | 20-Mar | Draw | Vertical text centering is slightly too low for one-liners |
|    🟡    |   Bug   | 20-Mar | Draw | Vertical text centering is slightly too high for nodes with smaller fonts than the rest |
|    🟠    |   Bug   | 20-Mar | Draw | Text giving up on sizing at some point? Noah's 5-down tree, box width 100, go from font size 16 to 17 and some sizes jump |
|    🟡    | Feature | 20-Mar | UI + Draw | Auto text size |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🔴    |   Bug   | 21-Mar | Position | *Sometimes siblings and spouses are spaced unevenly when some have children and others do not* |
|    🟠    |   Bug   | 21-Mar | Position | With stacking > 1 and only stackable child/sibling/spouse, they are no longer in the proper order |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟡    | Feature | 22-Mar | UI + Build | *Option to hide siblings (and ancestor inlaws) - pedigree only tree* |
|    🟡    | Feature | 22-Mar | Build + Position | Option to not add Unknown Spouse nodes |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟡    | Feature | 23-Mar | Draw | *Click on node to make them the new root person - is this possible?* |
|    🟡    | Feature | 23-Mar | UI + Build+Draw | *After selecting root, create 2nd list of people to select from (or click on another person), highlight the path between them* |
|    🟡    | Feature | 24-Mar | UI + Build + Position + Draw | Option to hide dotted links for inbreeding - add nodes with "Duplicate of {person name}" |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟢    | Feature |        | Build + Position | Sometimes siblings/children can fit in the gaps with no need to stack them |
|    🟢    | Feature |        | UI + Build + Position | Allow end siblings/children to be moved into gaps to compress the tree - violate age order |
|    🟢    | Feature |        | UI | Typing Enter should activate OK in save file modal, Escape shoudl activate cancel |
|    🟢    | Feature |        | README | Explain hcl vs hsl - colors seem to shift depending on brightness (hue 0 doesn't look red at high brightness) |
|    🟢    | Feature |        | Draw | Is there a way to make the root person easier to find |
|    🟢    | Feature |        | Parse | Is it possible to show profile images from sites like Ancestry.com from what's in the Gedcom? |
|    🟢    |   Bug   |        | Parse | Are special characters displayed properly (accents, umlauts, etc.)? : UTF-8 |
|    🟢    |   Bug   |        | Draw | Text shadow can have issues when saving a large tree as a PNG |
|    🟢    |   Bug   |        | Build | Warning in dev tools when showing dates for an Unknown Person |
|    🟢    |   Bug   |        | Draw | Slower rendering for very large trees seems to be due to the text - without text it is quick |

FYI - text shadow effects the size of the text bounding box

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
- Are there any Gedcom fields I could use to indicate which people are my DNA matches? Highlight them and the paths to them from me.
- Highlight immigrants
- Highlight people with military service

### Extra Thoughts
- Sometimes siblings and spouses are spaced unevenly when some have children and some do not
  - Fixing this could sometimes force a choice between keeping parents centered above their children vs making the tree wider
  - To move a child, first confirm parents can move if the center point changes
  - Can probably compress siblings of male ancestors

### Trees Used for Examples
- Design-Ancestors.png: Ann B
- Design-Spouses.png: Grace
- Design-Descendants.png: Me
- Design-Inbreeding.png: Mathias B
- Design-Levels.png: Jas J M
- Design-Stacking.png: Mom
