# Complete Family Tree Viewer

## About

The **Complete Family Tree Viewer** is a one-page application that allows users to load a family tree from a Gedcom file, then view the complete family tree for any person in that tree. A "complete family tree" for a given person is one that includes every one of their biological relatives and all of those relatives' spouses (in-laws).

This application comes with numerous configuration options to control which people and what information is displayed in the tree, as well as how the tree is styled. 

### Try it out here: [Complete Family Tree Viewer](https://www.erikshelley.com/complete-family-tree-viewer) 

If you don't have a Gedcom file available, you can download one of these [Gedcom sample files](https://github.com/D-Jeffrey/gedcom-samples) to use.

This application **does not** allow users to create or edit family trees. For that, you need to use some other genealogy applications or website that allows you to export your tree as a Gedcom file. Here are the most popular options:
- Websites: [Ancestry](https://www.ancestry.com/), [MyHeritage](https://www.myheritage.com/), [Family Search](https://www.familysearch.org/) 
- Desktop Software: [RootsMagic](https://www.rootsmagic.com/), [Gramps](https://www.gramps-project.org/wiki/index.php/Main_page), [Legacy Family Tree](https://legacyfamilytree.com/), [GenoPro](https://genopro.com/), [Family Tree Maker](https://www.mackiev.com/ftm/)

## Examples
Here are a few examples trees as seen in the **Complete Family Tree Viewer**.

| Root&nbsp;Person | People&nbsp;Shown | Family&nbsp;Tree |
|:----------------:|:-----------------:|:----------------:|
| John&nbsp;Fitzgerald&nbsp;Kennedy | 145 People | ![John Fitzgerald Kennedy](static/png/John-Fitzgerald-Kennedy.png) |
| Bart&nbsp;Simpson                 | 10 People  | ![Bart Simpson](static/png/Bart-Simpson.png) |
| Johann&nbsp;Sebastian&nbsp;Bach   | 32 People  | ![Johann Sebastian Bach](static/png/Johann-Sebastian-Bach.png) |
| Me                              | 4,123 People | ![My Family Tree](static/svg/Erik-Michael-Shelley.svg) |

### Data Privacy
When you use this program, your genealogy information is not uploaded anywhere. All processing is down in your browser. Feel free to review the code to confirm. In fact, after loading the page (and before selecting your Gedcom file), you can disconnect your computer from the internet and the application will continue to work.

### Dependencies
Two 3rd party Javascript libraries are used by this application.
- [D3.js](https://d3js.org/)
- [canvas-size](https://github.com/jhildenbiddle/canvas-size)

### Questions, Issues, Feature Requests
Feel free to ask questions, report issues, or request new features right [here on Github](https://github.com/erikshelley/complete-family-tree-viewer/issues)! Review the existing issues first to avoid creating a duplicate.


## Design
The table below describes how various relationships are depicted in the family trees.

| Relationship | Description | Example |
| ------------ | ----------- |:-------:|
| Ancestors | Ancestors are shown above their children with the father on the left and the mother on the right. This is similar to how other family tree programs work. Each generation is a different color. | ![](static/png/Design-Ancestors.png) |
| Spouses | Spouses who are ancestors are covered above. Spouses who are in-laws (not biologically related to the root of the tree) are shown in grey and connected to their spouse using a grey dotted line. If they are the spouse of an ancestor, they are displayed to the side of the ancestor. This is similar to how other family tree programs work. If they are not the spouse of an ancestor, they are displayed below their spouse. This is different from how other programs work and is done to save horizontal space and make large trees easier to view since they tend to become very wide. | ![](static/png/Design-Spouses.png) |
| Descendants | Descendants (children & siblings) whose parents are ancestors must by definition have a sibling who is also an ancestor or a sibling who is the root person. They are placed next to that sibling. Descendants who have a parent who is an in-law are shown below that parent. Each generation is a different color. | ![](static/png/Design-Descendants.png) |
| Inbreeding | Sometimes people who are related have children together. In this case they have common ancestors. Rather than show the common ancestors twice, a dashed line is used to connect one of the people to their common ancestors. In the example to the right, the root person's parents are first cousins. Their father's father and their mother's father are brothers. | ![](static/png/Design-Inbreeding.png) |

The table below describes two key design concepts that make it possible to display very large and complete family trees.

| Layout | Description | Example |
| ------ | ----------- |:-------:|
| Levels | To avoid having lines that cross, the concept of levels is introduced. Each ancestor is at the top of a level with the root person being on the bottom level (level 1). All of the descendants of the ancestor's siblings and all of thte descendants of the ancestor's in-law spouses must fit in that level and not cross into the level below.<br /><br />While this prevents crossing lines, it means not all people in the same generation are on the same level. To help with this problem each generation is given a color.<br /><br />In the example to the right, the root person and all people shaded green are in the same generation. Their relationships to root are as follows:<br />- Level 1: siblings<br />- Level 2: 1st cousins / half siblings<br />- Level 3: 2nd cousins / half 1st cousins<br />- Level 4: 3rd cousins / half 2nd cousins| ![](static/png/Design-Levels.png) |
| Stacking | To avoid trees that are extremely wide, the concept of stacking is introduced. A person is defined as a leaf node if they have no in-law spouses and no children. Leaf nodes can be arranged in a column rather than being side-by-side. In the example to the right, notice how both siblings and spouses can be stacked. This program allows the user to control the maximum stack size. A size of one means no stacking. | ![](static/png/Design-Stacking.png) |


## Usage

### Tree Content
<img src="static/png/Usage-Tree-Content.png" width="400">

| Option | Description |
| ------ | ----------- |
| Browse | Click the Browse button to select and load a Gedcom file from your computer. The people in thte Gedcom file will be populated in the list below. |
| Filter | Type a name in this box to filter the list of people. |
| Select Root Person | Click on a person to make the root of the tree. Their family tree will be drawn. |
| Generations Up | Change this value to control how many generations above the root person will be displayed. Click the up arrow <img src="static/png/icons8-top-50.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use the maximum possible value for the root person. |
| Generations Down | Change this value to control how many generations below the root person will be displayed. Click the up arrow <img src="static/png/icons8-top-50.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use the maximum possible value for the root person. |
| Maximum Stack Size | Change this value to control how many leaf nodes can be stacked in a single stack. Click the up arrow <img src="static/png/icons8-top-50.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use the maximum possible value for the root person. |
| Show Names | Click this checkbox to show people's names in the tree. |
| Show Years of BirthDeath | Click this checkbox to show people's years of birth and death in the tree. |
| Show Places of BirthDeath | Click this checkbox to show people's places of birth and death in the tree. |
| Hide Childless In-Laws | Click this checkbox to hide in-laws who are leaf nodes. |

## Tree Styling
<img src="static/png/Usage-Tree-Styling.png" width="400">

### Overall
| Option | Description |
| ------ | ----------- |
| Reset | Click this button to reset all options in the Tree Styling section to their default value. |
| Presets | Select a preset to quickly change a number of style settings. [Default, Orbs, Sharp, Dark, Light, Detailed] |

### Size
| Option | Description |
| ------ | ----------- |
| Boxes X | Change this value to control the width of the nodes. Click the resize icon <img src="static/png/icons8-resize-48-v2.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use the width needed to fit the text. |
| Boxes Y | Change this value to control thet height of the nodes. Click the resize icon <img src="static/png/icons8-resize-48-v2.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use thhe height needed to fit the text. |
| Borders | Change this value to control the size of the node borders. |
| Links | Change this value to control how thick the links are between nodes. |
| Font | Change this value to control the size of the text in the nodes. |

### Spacing
| Option | Description |
| ------ | ----------- |
| Boxes X | Change this value to control the horizontal space between nodes. |
| Boxes Y | Change this value to control the vertical space between nodes. |
| Levels Y | Change this value to control the vertical space between levels. |

### Color
| Option | Description |
| ------ | ----------- |
| Hue Root | Change this value to control the hue used for the color of the root generation. |
| Saturation | Change this value to control how saturated the colors of the nodes are. |
| Brightness | Change this value to control the brightness of the tree nodes and links. |
| Text | Change this value to control how bright the text is in the nodes. |
| Text Shadow | Click this checkbox to enable text shadows. |
| Transparent Background | Click this checkbox to use a transparent background for the tree. |
| Background Color | Click this control to choose a background color. The color will only be used if the Transparent Background checkbox is not checked. |

### Highlights (%)
| Option | Description |
| ------ | ----------- |
| Pedigree | Change this value to control if thte pedigree nodes (direct ancestors and descendants of the root person) are darker or brighter than everyone else. 0% is black, 100% is the same brightness as everyone else, and 200% is twice as bright as everyone else. Click the X icon <img src="static/png/icons8-cancel-50.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use 100% for no highlighting. |
| Borders | Change this value to control if the node borders are darker or brighter than the nodes. 0% is black, 100% is the same brightness as the nodes, and 200% is twice as bright as the nodes. Click the X icon <img src="static/png/icons8-cancel-50.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use 100% for no highlighting. |
| Links | Change this value to control if the links are darker or brighter than the nodes. 0% is black, 100% is the same brightness as the nodes, and 200% is twice as bright as the nodes. Click the X icon <img src="static/png/icons8-cancel-50.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use 100% for no highlighting. |
| In-Law Links | Change this value to control if the in-law links are darker or brighter than the nodes. 0% is black, 100% is the same brightness as the nodes, and 200% is twice as bright as the nodes. Click the X icon <img src="static/png/icons8-cancel-50.png" width="18" height="18" style="filter:invert() brightness(50%);"> to use 100% for no highlighting. |

### Rounded Corners
| Option | Description |
| ------ | ----------- |
| Rounding % | Change this value to control how rounded the corners of the nodes are. |
| Rounding % | Change this value to control how rounded the link paths between nodes are. |

## Tree Viewer
![](static/png/Usage-Tree-Viewer.png)

| Option | Description |
| ------ | ----------- |
| Save&nbsp;PNG | Click this button to save the tree as a PNG. Only the visible part of the tree is saved. If you zoom in before clicking the list you will only save part of the tree. If the tree is too large to save as a PNG, it will be resized and saved at a smaller size. SVGs have no size limits. |
| Save&nbsp;SVG | Click this button to save thte tree as an SVG. Only the visible part of the tree is saved. If you zoom in before clicking the list you will only save part of the tree. SVGs effectively have an infinite resolution. |
| <img src="static/png/icons8-resize-48-v2.png" width="36" height="36" style="filter:invert() brightness(50%);"> | Click the resize icon to fit the tree to the viewer. |
| Zoom | Zoom in on the tree as you would when using a mapping application like Google Maps (double-click, pinch, etc.). |
| Pan | Pan around a zoomed-in tree as you would when using a mapping application like Google Maps (click and drag). |

