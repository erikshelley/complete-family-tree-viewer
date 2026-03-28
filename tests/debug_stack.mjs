import { createBrowserContext, runBrowserScriptInContext } from './tests/helpers/load-browser-script.js';

function loadCtx() {
    const c = createBrowserContext({ windowOverrides: {
        generations_up:2, generations_down:0, max_stack_size:3,
        hide_childless_inlaws:true, pedigree_only:false, vertical_inlaws:true,
        hide_non_pedigree_family:false,
        box_width:80,h_spacing:24,v_spacing:28,box_height:50,level_spacing:40,
        box_padding:2,tree_padding:80,node_border_width:2,link_width:2
    }});
    ['src/js/gedcom.js','src/js/build_tree.js','src/js/position_tree.js'].forEach(f=>runBrowserScriptInContext(f,c));
    return c;
}

const gedcom = [
    '0 HEAD',
    '0 @I1@ INDI', '1 NAME Root', '1 SEX F', '1 FAMC @F0@',
    '0 @I2@ INDI', '1 NAME Father', '1 SEX M', '1 FAMS @F0@', '1 FAMC @F1@', '1 BIRT', '2 DATE 1900',
    '0 @I3@ INDI', '1 NAME Mother', '1 SEX F', '1 FAMS @F0@',
    '0 @I4@ INDI', '1 NAME PatGF', '1 SEX M', '1 FAMS @F1@',
    '0 @I5@ INDI', '1 NAME PatGM', '1 SEX F', '1 FAMS @F1@',
    '0 @I6@ INDI', '1 NAME AncSib', '1 SEX M', '1 FAMC @F1@', '1 FAMS @F3@', '1 FAMS @F4@', '1 BIRT', '2 DATE 1850',
    '0 @I7@ INDI', '1 NAME SibA', '1 SEX M', '1 FAMC @F1@', '1 BIRT', '2 DATE 1855',
    '0 @I8@ INDI', '1 NAME SibB', '1 SEX F', '1 FAMC @F1@', '1 BIRT', '2 DATE 1860',
    '0 @I9@ INDI', '1 NAME SibC', '1 SEX F', '1 FAMC @F1@', '1 BIRT', '2 DATE 1865',
    '0 @I10@ INDI', '1 NAME SpouseA', '1 SEX F', '1 FAMS @F3@',
    '0 @I11@ INDI', '1 NAME ChildA', '1 SEX M', '1 FAMC @F3@',
    '0 @I12@ INDI', '1 NAME SpouseB', '1 SEX F', '1 FAMS @F4@',
    '0 @I13@ INDI', '1 NAME ChildB1', '1 SEX M', '1 FAMC @F4@',
    '0 @I14@ INDI', '1 NAME ChildB2', '1 SEX F', '1 FAMC @F4@',
    '0 @F0@ FAM', '1 HUSB @I2@', '1 WIFE @I3@', '1 CHIL @I1@',
    '0 @F1@ FAM', '1 HUSB @I4@', '1 WIFE @I5@', '1 CHIL @I2@', '1 CHIL @I6@', '1 CHIL @I7@', '1 CHIL @I8@', '1 CHIL @I9@',
    '0 @F3@ FAM', '1 HUSB @I6@', '1 WIFE @I10@', '1 CHIL @I11@',
    '0 @F4@ FAM', '1 HUSB @I6@', '1 WIFE @I12@', '1 CHIL @I13@', '1 CHIL @I14@',
    '0 TRLR',
].join('\n');

// Test 1: Same-context parse (like probe tests)
const ctx1 = loadCtx();
const parsed1 = ctx1.parseGedcomData(gedcom);
const inds1 = JSON.parse(JSON.stringify(parsed1.individuals));
const fams1 = JSON.parse(JSON.stringify(parsed1.families));
ctx1.window.individuals = inds1;
ctx1.window.families = fams1;
const root1 = ctx1.window.individuals.find(p => p.id === '@I1@');
const rn1 = ctx1.buildTree(root1);
ctx1.positionTree(rn1); ctx1.normalizeTreeX([]); ctx1.setHeights([]);
// Actually redo properly:
const ctx1b = loadCtx();
ctx1b.window.individuals = JSON.parse(JSON.stringify(parsed1.individuals));
ctx1b.window.families = JSON.parse(JSON.stringify(parsed1.families));
const root1b = ctx1b.window.individuals.find(p => p.id === '@I1@');
const rn1b = ctx1b.buildTree(root1b);
const rows1b = ctx1b.positionTree(rn1b);
ctx1b.normalizeTreeX(rows1b);
ctx1b.setHeights(rows1b);
const vis1b = new Set(), all1b = [];
function col1b(n) { if (!n || vis1b.has(n)) return; vis1b.add(n); all1b.push(n); (n.spouse_nodes||[]).forEach(col1b); (n.children_nodes||[]).forEach(col1b); if(n.father_node) col1b(n.father_node); if(n.mother_node) col1b(n.mother_node); }
col1b(rn1b);
console.log('=== Test 1: same-context parse, JSON.parse/stringify clone ===');
all1b.forEach(n => { if (n.individual) console.log(n.individual.id, n.individual.name, 'stacked='+!!n.stacked, 'x='+Math.round(n.x)); });

// Test 2: Cross-context (like integration test using structuredClone)
const parseCtx = loadCtx(); // separate context for parsing
const parsed2 = parseCtx.parseGedcomData(gedcom);
const ctx2 = loadCtx(); // separate context for building
ctx2.window.individuals = structuredClone(parsed2.individuals);
ctx2.window.families = structuredClone(parsed2.families);
const root2 = ctx2.window.individuals.find(p => p.id === '@I1@');
const rn2 = ctx2.buildTree(root2);
const rows2 = ctx2.positionTree(rn2);
ctx2.normalizeTreeX(rows2);
ctx2.setHeights(rows2);
const vis2 = new Set(), all2 = [];
function col2(n) { if (!n || vis2.has(n)) return; vis2.add(n); all2.push(n); (n.spouse_nodes||[]).forEach(col2); (n.children_nodes||[]).forEach(col2); if(n.father_node) col2(n.father_node); if(n.mother_node) col2(n.mother_node); }
col2(rn2);
console.log('\n=== Test 2: cross-context with structuredClone ===');
all2.forEach(n => { if (n.individual) console.log(n.individual.id, n.individual.name, 'stacked='+!!n.stacked, 'x='+Math.round(n.x)); });

// Check birth field
console.log('\nBirth field check (cross-ctx):');
ctx2.window.individuals.forEach(i => console.log(i.id, i.name, 'birth='+i.birth));
