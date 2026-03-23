# Backlog

🔴🟠🟡🟢⚫

| Priority |   Type  | &nbsp;Target&nbsp;  | Functions | Description |
|:--------:|:-------:| ------------------- |:---------:| ----------- |
|    🔴    |   Bug   |        | Position | *Sometimes siblings and spouses are spaced unevenly when some have children and others do not* |
|    🔴    |   Bug   |        | Position | *Sometimes stacked siblings and spouses could be spread in the gaps to save horizontal space* |
|    🟠    |   Bug   |        | Position | With stacking > 1 and only stackable child/sibling/spouse, they are no longer in the proper order |
|    🟠    |   Bug   |        | Position | ~~Extra space between top level ancestors~~ |
|    🟡    |   Bug   |        | Position | Sometimes extra gap between inlaws in descendant trees : Sharlot 0up x 2dn has no gap, 1up x 2dn has a gap |
|    🟡    | Feature |        | Build + Position | Sometimes siblings/children can fit in the gaps with no need to stack them |
|    🟡    | Feature |        | UI + Build + Position | Ignore order of birth to save space |
|    ⚫    | ------- | ------ | ------ | ------ |
|    🟠    |   Bug   |        | TBD | Issues when root has no gender? no spouse? Issue for non-root individuals? |
|    🟡    |   Bug   |        | UI | Narrow windows push Tree Viewer header below buttons |
|    🟡    |   Bug   |        | Draw | Text shadow can have issues when saving a large tree as a PNG |
|    🟢    |   Bug   |        | Parse | Are special characters displayed properly (accents, umlauts, etc.)? : UTF-8 |
|    🟢    |   Bug   |        | Build | Warning in dev tools when showing dates for an Unknown Person |
|    🟢    |   Bug   |        | Draw | Slower rendering for very large trees seems to be due to the text - without text it is quick |
|    ⚫    | ------- | ------ | ------ | ------ |
|    🟠    | Feature |        | Gedcom + UI | Open Gedcom from URL |
|    🟡    | Feature |        | UI + Build | *Option to hide siblings (and ancestor inlaws) - pedigree only tree* |
|    🟡    | Feature |        | Build + Position | Option to not add Unknown Spouse nodes |
|    🟡    | Feature |        | Draw | *Click on node to make them the new root person - is this possible?* |
|    🟡    | Feature |        | UI + Build + Draw | *After selecting root, create 2nd list of people to select from (or click on another person), highlight the path between them* |
|    🟡    | Feature |        | UI + Draw | Tooltips |
|    🟢    | Feature |        | UI + Draw | Auto text size |
|    🟢    | Feature |        | UI | Save and load settings |
|    🟢    | Feature |        | UI + Build + Position | Allow end siblings/children to be moved into gaps to compress the tree - violate age order |
|    🟢    | Feature |        | README | Explain hcl vs hsl - colors seem to shift depending on brightness (hue 0 doesn't look red at high brightness) |
|    🟢    | Feature |        | Draw | Is there a way to make the root person easier to find |
|    🟢    | Feature |        | Parse | Is it possible to show profile images from sites like Ancestry.com from what's in the Gedcom? |

FYI - text shadow effects the size of the text bounding box

## Under Considuration
- Raise horizontal lines to some ancestors so horizontal line from other ancestor siblings can slide underneath (raise duplicates twice as much)
- Demo branch that can load example Gedcoms available
- Zoom icons - Zoom in - Zoom out
- Hue direction
- Distance between hues
- Sort drop down
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
- Design-In-Laws.png: Grace
- Design-In-Laws-Below.png: Grace
- Design-Descendants.png: Me
- Design-Descendants-Below.png: Me
- Design-Inbreeding.png: Mathias B
- Design-Levels.png: Jas J M
- Design-Stacking.png: Jas J M

### Other Possible Icons
- <a target="_blank" href="https://icons8.com/icon/O8HXRH0j3VSX/compress">Compress</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
- <a target="_blank" href="https://icons8.com/icon/pfF6HpODcjW0/close">Close</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
- <a target="_blank" href="https://icons8.com/icon/40JxrZB76JLv/info">Info</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
- <a target="_blank" href="https://icons8.com/icon/A5bT1cyFfulU/flow-chart">Flow Chart</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
