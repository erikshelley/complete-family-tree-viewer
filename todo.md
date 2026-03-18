# Backlog

🔴🟠🟡🟢⚫
The data for this tree came from a file called `kennedy.ged` in a Github repository called [Gedcom Samples](https://github.com/D-Jeffrey/gedcom-samples). The visualization of the tree was created using a program of my own creation, also available in a Github repository, called [Complete Family Tree Viewer](https://github.com/erikshelley/complete-family-tree-viewer).

| Priority |   Type  | &nbsp;Target&nbsp;  | Functions | Description |
|:--------:|:-------:| ------------------- |:---------:| ----------- |
|    🔴    |   Bug   |        | TBD | Sometimes selecting a root person does not display a tree |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟡    | Feature | 16-Mar | Parse | ~~Convert country names (Deutschland) to their three letter abbreviations (DEU)~~ |
|    🟡    | Feature | 16-Mar | Build + Draw | ~~Tree padding~~ |
|    🟡    |   Bug   | 16-Mar | README | ~~Be careful which example trees have transparent backgrounds, they may look strange if someone has a white background on github~~ |
|    🟡    | Feature | 16-Mar | README | ~~Installation instructions~~ |
|    🟡    | Feature | 16-Mar | README | ~~New preset~~ |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🔴    | Feature | 17-Mar | UI + Position | *Option to have inlaws next to their spouses* |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟠    | Feature | 18-Mar | UI + Draw | Specify number of lines allowed for name |
|    🟡    | Feature | 18-Mar | UI + Draw | Vertical text alignment, top/middle/bottom |
|    🟡    |   Bug   | 18-Mar | Draw | Vertical text centering is slightly too low for one-liners |
|    🟡    |   Bug   | 18-Mar | Draw | Vertical text centering is slightly too high for nodes with smaller fonts than the rest |
|    🟠    |   Bug   | 18-Mar | Draw | Text giving up on sizing at some point? Noah's 5-down tree, box width 100, go from font size 16 to 17 and some sizes jump |
|    🟡    | Feature | 18-Mar | UI + Draw | Auto text size |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🔴    |   Bug   | 19-Mar | Position | *Sometimes siblings and spouses are spaced unevenly when some have children and others do not* |
|    🟠    |   Bug   | 19-Mar | Position | With stacking > 1 and only stackable child/sibling/spouse, they are no longer in the proper order |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟡    | Feature | 20-Mar | UI + Build | *Option to hide siblings (and ancestor inlaws) - pedigree only tree* |
|    🟡    | Feature | 20-Mar | UI | Add a status bar at the bottom: number of people, tree dimensions, max/min font used, countries, earliest year |
|    🟡    | Feature | 20-Mar | Build + Position | Option to not add Unknown Spouse nodes |
|    ⚫    | ------- | ------ | --------------------- | ------------ |
|    🟡    | Feature | 21-Mar | Draw | *Click on node to make them the new root person - is this possible?* |
|    🟡    | Feature | 22-Mar | UI + Build+Draw | *After selecting root, create 2nd list of people to select from (or click on another person), highlight the path between them* |
|    🟡    | Feature | 22-Mar | UI + Build + Position + Draw | Option to hide dotted links for inbreeding - add nodes with "Duplicate of {person name}" |
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
