# Complete Family Tree Viewer

## About

The **Complete Family Tree Viewer** is a one-page application that allows users to load a family tree from a Gedcom file, then view the complete family tree for any person in that tree. This includes every one of the selected person's biological relatives and all of those relatives' spouses. It comes with numerous configuration options to control what people and information is displayed in the tree and how the tree is styled.

### A Few Examples
| Root&nbsp;Person | People&nbsp;Shown | Family&nbsp;Tree |
|:----------------:|:-----------------:|:----------------:|
| John&nbsp;Fitzgerald&nbsp;Kennedy | 145 People | ![John Fitzgerald Kennedy](static/png/John-Fitzgerald-Kennedy.png) |
| Bart&nbsp;Simpson                 | 10 People  | ![Bart Simpson](static/png/Bart-Simpson.png) |
| Johann&nbsp;Sebastian&nbsp;Bach   | 32 People  | ![Johann Sebastian Bach](static/png/Johann-Sebastian-Bach.png) |
| Me                              | 4,123 People | ![My Family Tree](static/svg/Erik-Michael-Shelley.svg) |

### Demo
If you would like to try out this application without downloading the code for yourself, it is available on my personal website: [Complete Family Tree Viewer](https://www.erikshelley.com/complete-family-tree-viewer). 

### Data Privacy
When you use this program, your genealogy information is not uploaded to my site. All processing is down in your browser. Feel free to review the code to confirm. In fact, after loading the page (and before selecting your Gedcom file), you can disconnect your computer from the internet and the application will continue to work.

If you don't have a Gedcom file of your own, download one of these [Gedcom sample files](https://github.com/D-Jeffrey/gedcom-samples) to use.

### Dependencies
Two Javascript libraries are used by this application.
- [D3.js](https://d3js.org/)
- [canvas-size](https://github.com/jhildenbiddle/canvas-size)

### Questions, Issues, Feature Requests
Feel free to ask questions, report issues, or request new features right here on Github. Click on "Issues" above, make sure there is not already an existing issue that covers your topic, then create an issue.


## Design
| Relationship | Description | Example |
| ------------ | ----------- |:-------:|
| Ancestors | Ancestors are shown above their children with the father on the left and the mother on the right. This is similar to how other family tree programs work. Each generation is a different color. | ![](static/png/Design-Ancestors.png) |
| Spouses | Spouses who are ancestors are covered above. Spouses who are inlaws (not biologically related to the root of the tree) are shown in grey and connected to their spouse using a grey dotted line. If they are the spouse of an ancestor, they are displayed to the side of the ancestor. This is similar to how other family tree programs work. If they are not the spouse of an ancestor, they are displayed below their spouse. This is different from how other programs work and is done to save horizontal space and make large trees easier to view since they tend to become very wide. | ![](static/png/Design-Spouses.png) |
| Descendants | Descendants (children & siblings) whose parents are ancestors must by definition have a sibling who is also an ancestor or a sibling who is the root person. They are placed next to that sibling. Descendants who have a parent who is an inlaw are shown below that parent. Each generation is a different color. | ![](static/png/Design-Descendants.png) |
| Inbreeding | Sometimes people who are related have children together. In this case they have common ancestors. Rather than show the common ancestors twice, a dashed line is used to connect one of the people to their common ancestors. In the example to the right, the root person's parents are first cousins. Their father's father and their mother's father are brothers. | ![](static/png/Design-Inbreeding.png) |

| Layout | Description | Example |
| ------ | ----------- |:-------:|
| Levels | To avoid having lines that cross, the concept of levels is introduced. Each ancestor is at the top of a level with the root person being on the bottom level (level 1). All of the descendants of the ancestor's siblings and all of thte descendants of the ancestor's inlaw spouses must fit in that level and not cross into the level below.<br /><br />While this prevents crossing lines, it means not all people in the same generation are on the same level. To help with this problem each generation is given a color.<br /><br />In the example to the right, the root person and all people shaded green are in the same generation. Their relationships to root are as follows:<br />- Level 1: siblings<br />- Level 2: 1st cousins / half siblings<br />- Level 3: 2nd cousins / half 1st cousins<br />- Level 4: 3rd cousins / half 2nd cousins| ![](static/png/Design-Levels.png) |
| Stacking | To avoid trees that are extremely wide, the concept of stacking is introduced. A person is defined as a leaf node if they have no inlaw spouses and no children. Leaf nodes can be arranged in a column rather than being side-by-side. In the example to the right, notice how both siblings and spouses can be stacked. This program allows the user to control the maximum stack size. A size of one means no stacking. | ![](static/png/Design-Stacking.png) |


## Usage

### Tree Content
![](static/png/Usage-Tree-Content.png)

| Option | Description |
| ------ | ----------- |
| Browse | Load Gedcom file |
| Filter | |
| Select Root Person | |
| Generations Up | |
| Generations Up MAX | |
| Generations Down | |
| Generations Down MAX | |
| Maximum Stack Size | |
| Maximum Stack Size MAX | |
| Hide Childless Inlaws | |

## Tree Styling
![](static/png/Usage-Tree-Styling.png)

| Option | Description |
| ------ | ----------- |
| Use Defaults | |
| Width | |
| Height | |
| X Spacing | |
| Y Spacing | |
| Rounding | |
| Show Names | |
| Show Years of BirthDeath | |
| Show Places of BirthDeath | |
| Thickness | |
| Link Rounding | |
| Text | |
| Size | |
| Brightness | |
| Text Shadows | |
| Hue Root | |
| Saturation | |
| Luminance | |
| Highlight | |
| Transparent Background | |
| Background Color | |

## Tree Viewer
![](static/png/Usage-Tree-Viewer.png)

| Option | Description |
| ------ | ----------- |
| Save PNG | |
| Save SVG | |
| Zoom | |
| Pan | |

Only the visible part of the tree is saved.
