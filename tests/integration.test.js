import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { loadBrowserScripts } from './helpers/load-browser-script.js';

function getIntegrationGedcom() {
    return [
        '0 HEAD',
        '1 SOUR TEST',
        '0 @I1@ INDI',
        '1 NAME Root /Person/',
        '1 SEX M',
        '1 FAMS @F1@',
        '1 FAMS @F2@',
        '1 FAMC @F0@',
        '0 @I2@ INDI',
        '1 NAME Spouse /One/',
        '1 SEX F',
        '1 FAMS @F1@',
        '0 @I3@ INDI',
        '1 NAME Child /One/',
        '1 SEX F',
        '1 FAMC @F1@',
        '0 @I4@ INDI',
        '1 NAME Spouse /Two/',
        '1 SEX F',
        '1 FAMS @F2@',
        '0 @I5@ INDI',
        '1 NAME Father /Root/',
        '1 SEX M',
        '1 FAMS @F0@',
        '0 @I6@ INDI',
        '1 NAME Mother /Root/',
        '1 SEX F',
        '1 FAMS @F0@',
        '0 @F0@ FAM',
        '1 HUSB @I5@',
        '1 WIFE @I6@',
        '1 CHIL @I1@',
        '0 @F1@ FAM',
        '1 HUSB @I1@',
        '1 WIFE @I2@',
        '1 CHIL @I3@',
        '0 @F2@ FAM',
        '1 HUSB @I1@',
        '1 WIFE @I4@',
        '0 TRLR',
    ].join('\n');
}

function getWideInlawGedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI',
        '1 NAME Root /Person/',
        '1 SEX M',
        '1 FAMC @F0@',
        '0 @I2@ INDI',
        '1 NAME Father /Ancestor/',
        '1 SEX M',
        '1 FAMS @F0@',
        '1 FAMS @F1@',
        '0 @I3@ INDI',
        '1 NAME Mother /Ancestor/',
        '1 SEX F',
        '1 FAMS @F0@',
        '0 @I4@ INDI',
        '1 NAME InLaw /Wife/',
        '1 SEX F',
        '1 FAMS @F1@',
        '0 @I5@ INDI',
        '1 NAME InLaw /ChildA/',
        '1 SEX M',
        '1 FAMC @F1@',
        '0 @I6@ INDI',
        '1 NAME InLaw /ChildB/',
        '1 SEX F',
        '1 FAMC @F1@',
        '0 @I7@ INDI',
        '1 NAME InLaw /ChildC/',
        '1 SEX M',
        '1 FAMC @F1@',
        '0 @I8@ INDI',
        '1 NAME InLaw /ChildD/',
        '1 SEX F',
        '1 FAMC @F1@',
        '0 @I9@ INDI',
        '1 NAME InLaw /ChildE/',
        '1 SEX M',
        '1 FAMC @F1@',
        '0 @F0@ FAM',
        '1 HUSB @I2@',
        '1 WIFE @I3@',
        '1 CHIL @I1@',
        '0 @F1@ FAM',
        '1 HUSB @I2@',
        '1 WIFE @I4@',
        '1 CHIL @I5@',
        '1 CHIL @I6@',
        '1 CHIL @I7@',
        '1 CHIL @I8@',
        '1 CHIL @I9@',
        '0 TRLR',
    ].join('\n');
}

function getPedigreeSiblingGedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI',
        '1 NAME Root /Person/',
        '1 SEX M',
        '1 FAMC @F0@',
        '1 FAMS @F2@',
        '0 @I2@ INDI',
        '1 NAME RootSibling /Person/',
        '1 SEX F',
        '1 FAMC @F0@',
        '1 FAMS @F1@',
        '0 @I3@ INDI',
        '1 NAME Father /Ancestor/',
        '1 SEX M',
        '1 FAMS @F0@',
        '0 @I4@ INDI',
        '1 NAME Mother /Ancestor/',
        '1 SEX F',
        '1 FAMS @F0@',
        '0 @I5@ INDI',
        '1 NAME SiblingSpouse /Branch/',
        '1 SEX M',
        '1 FAMS @F1@',
        '0 @I6@ INDI',
        '1 NAME SiblingChild /Branch/',
        '1 SEX F',
        '1 FAMC @F1@',
        '0 @I7@ INDI',
        '1 NAME RootSpouse /Branch/',
        '1 SEX F',
        '1 FAMS @F2@',
        '0 @I8@ INDI',
        '1 NAME RootChild /Branch/',
        '1 SEX M',
        '1 FAMC @F2@',
        '0 @F0@ FAM',
        '1 HUSB @I3@',
        '1 WIFE @I4@',
        '1 CHIL @I1@',
        '1 CHIL @I2@',
        '0 @F1@ FAM',
        '1 HUSB @I5@',
        '1 WIFE @I2@',
        '1 CHIL @I6@',
        '0 @F2@ FAM',
        '1 HUSB @I1@',
        '1 WIFE @I7@',
        '1 CHIL @I8@',
        '0 TRLR',
    ].join('\n');
}

function getLayoutWidth(rootNode) {
    let minX = Infinity;
    let maxX = -Infinity;
    const visited = new Set();

    function visit(node) {
        if (!node || visited.has(node)) return;
        visited.add(node);
        if (typeof node.x === 'number') minX = Math.min(minX, node.x);
        if (typeof node.x === 'number') maxX = Math.max(maxX, node.x + 80);
        (node.spouse_nodes || []).forEach(visit);
        (node.children_nodes || []).forEach(visit);
        visit(node.father_node);
        visit(node.mother_node);
    }

    visit(rootNode);
    return maxX - minX;
}

function createPipelineContext({ dom, drawTree } = {}) {
    const windowOverrides = {
        generations_up: 2,
        generations_down: 2,
        hide_childless_inlaws: false,
        pedigree_only: false,
        vertical_inlaws: true,
        max_stack_size: 1,
        box_width: 80,
        box_height: 50,
        h_spacing: 24,
        v_spacing: 28,
        level_spacing: 40,
        box_padding: 2,
        tree_padding: 80,
        node_border_width: 2,
        link_width: 2,
    };

    const globalOverrides = {
        document: dom ? dom.window.document : undefined,
        drawTree: drawTree || (async () => {}),
    };

    const context = loadBrowserScripts(['src/js/gedcom.js', 'src/js/build_tree.js', 'src/js/position_tree.js'], {
        windowOverrides,
        globalOverrides,
    });

    return context;
}

// Mock reproducing conditions from a real GEDCOM file with a female root.
// Family structure: Root (F) married InlawSpouse (M), children ChildA + ChildB.
// Parents: Father (M) + Mother (F).
// Siblings: BrotherSib (M, two marriages: SibWifeA + SibWifeB, no children)
//           and SisterSib (F, married SibHusb, one child).
// The sibling subtrees give Father enough width to be placed well to the right of
// Root's own generation, producing the in-law ordering under test.
function getFemaleRootHorizontalInlawGedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F1@',
        '0 @I2@ INDI', '1 NAME InlawSpouse /Partner/', '1 SEX M', '1 FAMS @F1@',
        '0 @I3@ INDI', '1 NAME ChildA /Person/', '1 SEX M', '1 FAMC @F1@',
        '0 @I4@ INDI', '1 NAME ChildB /Person/', '1 SEX M', '1 FAMC @F1@',
        '0 @I5@ INDI', '1 NAME Father /Ancestor/', '1 SEX M', '1 FAMS @F0@',
        '0 @I6@ INDI', '1 NAME Mother /Ancestor/', '1 SEX F', '1 FAMS @F0@',
        '0 @I7@ INDI', '1 NAME BrotherSib /Person/', '1 SEX M', '1 FAMC @F0@', '1 FAMS @F2@', '1 FAMS @F3@',
        '0 @I8@ INDI', '1 NAME SibWifeA /Partner/', '1 SEX F', '1 FAMS @F2@',
        '0 @I9@ INDI', '1 NAME SibWifeB /Partner/', '1 SEX F', '1 FAMS @F3@',
        '0 @I10@ INDI', '1 NAME SisterSib /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F4@',
        '0 @I11@ INDI', '1 NAME SibHusb /Partner/', '1 SEX M', '1 FAMS @F4@',
        '0 @I12@ INDI', '1 NAME SibChild /Partner/', '1 SEX F', '1 FAMC @F4@',
        '0 @F0@ FAM', '1 HUSB @I5@', '1 WIFE @I6@', '1 CHIL @I1@', '1 CHIL @I7@', '1 CHIL @I10@',
        '0 @F1@ FAM', '1 HUSB @I2@', '1 WIFE @I1@', '1 CHIL @I3@', '1 CHIL @I4@',
        '0 @F2@ FAM', '1 HUSB @I7@', '1 WIFE @I8@',
        '0 @F3@ FAM', '1 HUSB @I7@', '1 WIFE @I9@',
        '0 @F4@ FAM', '1 HUSB @I11@', '1 WIFE @I10@', '1 CHIL @I12@',
        '0 TRLR',
    ].join('\n');
}

// Mock reproducing conditions from a real GEDCOM file with a male root and two childless wives.
// Family structure: Root (M) had two marriages — WifeA (F) and WifeB (F), neither with children.
// Parents: Father (M) + Mother (F).
// Siblings: SisterA (F, married SibHusbA, two children: SibChildA + SibChildB)
//           and SisterB (F, married SibHusbB, one child).
// The sibling subtrees push Father far enough right that both of Root's female in-laws
// land between Root and Father, satisfying both 05.13 and 05.14.
function getMaleRootHorizontalInlawGedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX M', '1 FAMC @F0@', '1 FAMS @F1@', '1 FAMS @F2@',
        '0 @I2@ INDI', '1 NAME WifeA /Partner/', '1 SEX F', '1 FAMS @F1@',
        '0 @I3@ INDI', '1 NAME WifeB /Partner/', '1 SEX F', '1 FAMS @F2@',
        '0 @I4@ INDI', '1 NAME Father /Ancestor/', '1 SEX M', '1 FAMS @F0@',
        '0 @I5@ INDI', '1 NAME Mother /Ancestor/', '1 SEX F', '1 FAMS @F0@',
        '0 @I6@ INDI', '1 NAME SisterA /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F3@',
        '0 @I7@ INDI', '1 NAME SibHusbA /Partner/', '1 SEX M', '1 FAMS @F3@',
        '0 @I8@ INDI', '1 NAME SibChildA /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I9@ INDI', '1 NAME SibChildB /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I10@ INDI', '1 NAME SisterB /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F4@',
        '0 @I11@ INDI', '1 NAME SibHusbB /Partner/', '1 SEX M', '1 FAMS @F4@',
        '0 @I12@ INDI', '1 NAME SibChildC /Person/', '1 SEX F', '1 FAMC @F4@',
        '0 @F0@ FAM', '1 HUSB @I4@', '1 WIFE @I5@', '1 CHIL @I1@', '1 CHIL @I6@', '1 CHIL @I10@',
        '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
        '0 @F2@ FAM', '1 HUSB @I1@', '1 WIFE @I3@',
        '0 @F3@ FAM', '1 HUSB @I7@', '1 WIFE @I6@', '1 CHIL @I8@', '1 CHIL @I9@',
        '0 @F4@ FAM', '1 HUSB @I11@', '1 WIFE @I10@', '1 CHIL @I12@',
        '0 TRLR',
    ].join('\n');
}

// Mock reproducing conditions from a real GEDCOM file with a male root and siblings with children.
// Family structure: Root (M) with two childless wives.
// Parents: Father (M) + Mother (F).
// Siblings: SisterA (F, married SibHusbA, children SibChildA + SibChildB),
//           SisterB (F, married SibHusbB, children SibChildC + SibChildD + SibChildE),
//           BrotherSib (M, married SibWife, one child SibChildF).
// Used to verify centering of couples above their children under horizontal in-law layout.
// Mock for hide_childless_inlaws and hide_non_pedigree_family tests (05.26–05.28).
// Root (M) marries SpouseA and SpouseB (both childless in-laws).
// Root's sibling SibA marries SibSpouse (also a childless in-law).
// Root's parents are AncDad and AncMom.
function getHcilHnpfGedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX M', '1 FAMS @F1@', '1 FAMS @F2@', '1 FAMC @F0@',
        '0 @I2@ INDI', '1 NAME SpouseA /Partner/', '1 SEX F', '1 FAMS @F1@',
        '0 @I3@ INDI', '1 NAME SpouseB /Partner/', '1 SEX F', '1 FAMS @F2@',
        '0 @I4@ INDI', '1 NAME AncDad /Ancestor/', '1 SEX M', '1 FAMS @F0@',
        '0 @I5@ INDI', '1 NAME AncMom /Ancestor/', '1 SEX F', '1 FAMS @F0@',
        '0 @I6@ INDI', '1 NAME SibA /Person/', '1 SEX M', '1 FAMC @F0@', '1 FAMS @F3@',
        '0 @I7@ INDI', '1 NAME SibSpouse /Partner/', '1 SEX F', '1 FAMS @F3@',
        '0 @F0@ FAM', '1 HUSB @I4@', '1 WIFE @I5@', '1 CHIL @I1@', '1 CHIL @I6@',
        '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
        '0 @F2@ FAM', '1 HUSB @I1@', '1 WIFE @I3@',
        '0 @F3@ FAM', '1 HUSB @I6@', '1 WIFE @I7@',
        '0 TRLR',
    ].join('\n');
}

// Mock for endogamy (shared-ancestor) tests (05.40–05.41).
// Root's paternal grandfather (PatGF) and maternal grandmother (MatGM) are siblings:
// both are children of SharedGF+SharedGM. With gen_up=3, SharedGF and SharedGM appear
// once in the tree (as PatGF's parents); MatGM receives a duplicate pedigree link.
function getEndogamyMock() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX M', '1 FAMC @F0@',
        '0 @I2@ INDI', '1 NAME Father /Ancestor/', '1 SEX M', '1 FAMS @F0@', '1 FAMC @F1@',
        '0 @I3@ INDI', '1 NAME Mother /Ancestor/', '1 SEX F', '1 FAMS @F0@', '1 FAMC @F2@',
        '0 @I4@ INDI', '1 NAME PatGF /Ancestor/', '1 SEX M', '1 FAMS @F1@', '1 FAMC @F3@',
        '0 @I5@ INDI', '1 NAME PatGM /Ancestor/', '1 SEX F', '1 FAMS @F1@',
        '0 @I6@ INDI', '1 NAME MatGF /Ancestor/', '1 SEX M', '1 FAMS @F2@',
        '0 @I7@ INDI', '1 NAME MatGM /Ancestor/', '1 SEX F', '1 FAMS @F2@', '1 FAMC @F3@',
        '0 @I8@ INDI', '1 NAME SharedGF /Ancestor/', '1 SEX M', '1 FAMS @F3@',
        '0 @I9@ INDI', '1 NAME SharedGM /Ancestor/', '1 SEX F', '1 FAMS @F3@',
        '0 @F0@ FAM', '1 HUSB @I2@', '1 WIFE @I3@', '1 CHIL @I1@',
        '0 @F1@ FAM', '1 HUSB @I4@', '1 WIFE @I5@', '1 CHIL @I2@',
        '0 @F2@ FAM', '1 HUSB @I6@', '1 WIFE @I7@', '1 CHIL @I3@',
        '0 @F3@ FAM', '1 HUSB @I8@', '1 WIFE @I9@', '1 CHIL @I4@', '1 CHIL @I7@',
        '0 TRLR',
    ].join('\n');
}

// Mock for inlaw-over-relative priority test (05.42).
// Root has spouse (Inlaw) who is also a child of an ancestor (AncMom) via a second family.
// Inlaw and their child (InlawChild) should appear exactly once as Root's inlaw descendants,
// and not appear as relatives under AncMom's second family branch.
function getInlawPriorityMock() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX M', '1 FAMS @F0@', '1 FAMC @F1@',
        '0 @I2@ INDI', '1 NAME Inlaw /Partner/', '1 SEX F', '1 FAMS @F0@', '1 FAMC @F5@',
        '0 @I3@ INDI', '1 NAME InlawChild /Person/', '1 SEX M', '1 FAMC @F0@',
        '0 @I4@ INDI', '1 NAME Father /Ancestor/', '1 SEX M', '1 FAMS @F1@', '1 FAMC @F2@',
        '0 @I5@ INDI', '1 NAME Mother /Ancestor/', '1 SEX F', '1 FAMS @F1@',
        '0 @I6@ INDI', '1 NAME GrandFather /Ancestor/', '1 SEX M', '1 FAMS @F2@', '1 FAMC @F3@',
        '0 @I7@ INDI', '1 NAME GrandMother /Ancestor/', '1 SEX F', '1 FAMS @F2@',
        '0 @I8@ INDI', '1 NAME GreatGF /Ancestor/', '1 SEX M', '1 FAMS @F3@',
        '0 @I9@ INDI', '1 NAME AncMom /Ancestor/', '1 SEX F', '1 FAMS @F3@', '1 FAMS @F5@',
        '0 @I10@ INDI', '1 NAME AncMomInlaw /Partner/', '1 SEX M', '1 FAMS @F5@',
        '0 @F0@ FAM', '1 HUSB @I1@', '1 WIFE @I2@', '1 CHIL @I3@',
        '0 @F1@ FAM', '1 HUSB @I4@', '1 WIFE @I5@', '1 CHIL @I1@',
        '0 @F2@ FAM', '1 HUSB @I6@', '1 WIFE @I7@', '1 CHIL @I4@',
        '0 @F3@ FAM', '1 HUSB @I8@', '1 WIFE @I9@', '1 CHIL @I6@',
        '0 @F5@ FAM', '1 HUSB @I10@', '1 WIFE @I9@', '1 CHIL @I2@',
        '0 TRLR',
    ].join('\n');
}

// Mock for stackable-but-released ancestor siblings test (05.43).
// Root (F), Gen Up=2, Gen Down=0, max_stack_size=3, hide_childless_inlaws=true.
// PatGF's children: Father (pedigree/excluded), AncSib (1 spouse with 13 children),
// SibA, SibB, SibC (no spouses → eligible for stacking).
// AncSib's spouse has 13 children which group into 5 stacking columns (sizes [2,3,3,3,2]).
// Each group contributes one child to sub-level 2 at x=160, 264, 368, 472, 576, making
// the rightmost sub-level 2 position equal to 576. When SibA/B/C are stacked, SibC
// (at sub=2) gets placed at 576+104=680. In the unstacked trial, AncSib stays at
// x=368 (centered over spouse + 13 children), so SibC lands at 368+3*104=680 —
// identical. Equal max_x means the release trial is accepted: SibA/B/C are not stacked.
function getNoStackMock() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX F', '1 FAMC @F0@',
        '0 @I2@ INDI', '1 NAME Father /Ancestor/', '1 SEX M', '1 FAMS @F0@', '1 FAMC @F1@', '1 BIRT', '2 DATE 1890',
        '0 @I3@ INDI', '1 NAME Mother /Ancestor/', '1 SEX F', '1 FAMS @F0@',
        '0 @I4@ INDI', '1 NAME PatGF /Ancestor/', '1 SEX M', '1 FAMS @F1@',
        '0 @I5@ INDI', '1 NAME PatGM /Ancestor/', '1 SEX F', '1 FAMS @F1@',
        '0 @I6@ INDI', '1 NAME AncSib /Person/', '1 SEX M', '1 FAMC @F1@', '1 FAMS @F3@', '1 BIRT', '2 DATE 1850',
        '0 @I7@ INDI', '1 NAME SibA /Person/', '1 SEX M', '1 FAMC @F1@', '1 BIRT', '2 DATE 1855',
        '0 @I8@ INDI', '1 NAME SibB /Person/', '1 SEX F', '1 FAMC @F1@', '1 BIRT', '2 DATE 1860',
        '0 @I9@ INDI', '1 NAME SibC /Person/', '1 SEX F', '1 FAMC @F1@', '1 BIRT', '2 DATE 1865',
        '0 @I10@ INDI', '1 NAME SibSpouse /Partner/', '1 SEX F', '1 FAMS @F3@',
        '0 @I11@ INDI', '1 NAME SibChild1 /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I12@ INDI', '1 NAME SibChild2 /Person/', '1 SEX F', '1 FAMC @F3@',
        '0 @I13@ INDI', '1 NAME SibChild3 /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I14@ INDI', '1 NAME SibChild4 /Person/', '1 SEX F', '1 FAMC @F3@',
        '0 @I15@ INDI', '1 NAME SibChild5 /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I16@ INDI', '1 NAME SibChild6 /Person/', '1 SEX F', '1 FAMC @F3@',
        '0 @I17@ INDI', '1 NAME SibChild7 /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I18@ INDI', '1 NAME SibChild8 /Person/', '1 SEX F', '1 FAMC @F3@',
        '0 @I19@ INDI', '1 NAME SibChild9 /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I20@ INDI', '1 NAME SibChild10 /Person/', '1 SEX F', '1 FAMC @F3@',
        '0 @I21@ INDI', '1 NAME SibChild11 /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I22@ INDI', '1 NAME SibChild12 /Person/', '1 SEX F', '1 FAMC @F3@',
        '0 @I23@ INDI', '1 NAME SibChild13 /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @F0@ FAM', '1 HUSB @I2@', '1 WIFE @I3@', '1 CHIL @I1@',
        '0 @F1@ FAM', '1 HUSB @I4@', '1 WIFE @I5@', '1 CHIL @I2@', '1 CHIL @I6@', '1 CHIL @I7@', '1 CHIL @I8@', '1 CHIL @I9@',
        '0 @F3@ FAM', '1 HUSB @I6@', '1 WIFE @I10@', '1 CHIL @I11@', '1 CHIL @I12@', '1 CHIL @I13@', '1 CHIL @I14@', '1 CHIL @I15@', '1 CHIL @I16@', '1 CHIL @I17@', '1 CHIL @I18@', '1 CHIL @I19@', '1 CHIL @I20@', '1 CHIL @I21@', '1 CHIL @I22@', '1 CHIL @I23@',
        '0 TRLR',
    ].join('\n');
}

// Mock for the in-law child centered below the in-law parent test (05.34).
// Male ancestor (Father) has a second wife (StepMom) whose only child is ChildA.
// In vertical_inlaws=true mode, ChildA is positioned directly below StepMom (same x).
function getInlawChildMock() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX M', '1 FAMC @F0@',
        '0 @I2@ INDI', '1 NAME Father /Ancestor/', '1 SEX M', '1 FAMS @F0@', '1 FAMS @F1@',
        '0 @I3@ INDI', '1 NAME Mother /Ancestor/', '1 SEX F', '1 FAMS @F0@',
        '0 @I4@ INDI', '1 NAME StepMom /Partner/', '1 SEX F', '1 FAMS @F1@',
        '0 @I5@ INDI', '1 NAME ChildA /Person/', '1 SEX M', '1 FAMC @F1@',
        '0 @F0@ FAM', '1 HUSB @I2@', '1 WIFE @I3@', '1 CHIL @I1@',
        '0 @F1@ FAM', '1 HUSB @I2@', '1 WIFE @I4@', '1 CHIL @I5@',
        '0 TRLR',
    ].join('\n');
}

// Mock for ChildB centered between ChildA and ChildC (05.35).
// RootF (female root) and RootSpouse have three children: ChildA, ChildB, ChildC.
// ChildA and ChildC each have a single-child family chain 3 levels deep; ChildB has no family.
// Because each branch is a single column wide, ChildB.x + bw/2 == center(ChildA.x, ChildC.x).
function getMiddleSibMock() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME RootF /Root/', '1 SEX F', '1 FAMS @F0@',
        '0 @I2@ INDI', '1 NAME RootSpouse /Partner/', '1 SEX M', '1 FAMS @F0@',
        '0 @I3@ INDI', '1 NAME ChildA /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F1@',
        '0 @I4@ INDI', '1 NAME ChildB /Person/', '1 SEX M', '1 FAMC @F0@',
        '0 @I5@ INDI', '1 NAME ChildC /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F2@',
        '0 @I6@ INDI', '1 NAME ChildASpouse /Partner/', '1 SEX M', '1 FAMS @F1@',
        '0 @I7@ INDI', '1 NAME ChildAChild /Person/', '1 SEX M', '1 FAMC @F1@', '1 FAMS @F3@',
        '0 @I8@ INDI', '1 NAME ChildAChildSpouse /Partner/', '1 SEX F', '1 FAMS @F3@',
        '0 @I9@ INDI', '1 NAME ChildAGC /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I10@ INDI', '1 NAME ChildCSpouse /Partner/', '1 SEX M', '1 FAMS @F2@',
        '0 @I11@ INDI', '1 NAME ChildCChild /Person/', '1 SEX F', '1 FAMC @F2@', '1 FAMS @F4@',
        '0 @I12@ INDI', '1 NAME ChildCChildSpouse /Partner/', '1 SEX M', '1 FAMS @F4@',
        '0 @I13@ INDI', '1 NAME ChildCGC /Person/', '1 SEX F', '1 FAMC @F4@',
        '0 @F0@ FAM', '1 HUSB @I2@', '1 WIFE @I1@', '1 CHIL @I3@', '1 CHIL @I4@', '1 CHIL @I5@',
        '0 @F1@ FAM', '1 HUSB @I6@', '1 WIFE @I3@', '1 CHIL @I7@',
        '0 @F2@ FAM', '1 HUSB @I10@', '1 WIFE @I5@', '1 CHIL @I11@',
        '0 @F3@ FAM', '1 HUSB @I7@', '1 WIFE @I8@', '1 CHIL @I9@',
        '0 @F4@ FAM', '1 HUSB @I12@', '1 WIFE @I11@', '1 CHIL @I13@',
        '0 TRLR',
    ].join('\n');
}

// Mock for gen_up=2 horizontal in-law positioning tests (05.29–05.33).
// Root (M) has parents AncDad+AncMom. AncDad's parents are PatGF+PatGM (pedigree grandparent level).
// PatGF also has a second wife InlawWife2 whose child is MarineChild. MarineChild's wife is MarineSpouse
// (placed to the right of MarineChild at sub-level 1 of the grandparent level).
// PatGM also has a second family with AncInlaw (inlaw), producing InlawChild (relative).
// AncMom's parents are MatGF+MatGM. AncMom has siblings SibA and SibB.
// SibA married SibASpouse; their child SibAChild married SibAChildSpouse, producing GCLeft and GCRight
// (placed at sub-level 2 of the parent level, one level below Root's generation).
function getGenUp2Gedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX M', '1 FAMC @F0@', '1 FAMS @F10@',
        '0 @I2@ INDI', '1 NAME RootWife /Partner/', '1 SEX F', '1 FAMS @F10@',
        '0 @I3@ INDI', '1 NAME AncDad /Ancestor/', '1 SEX M', '1 FAMS @F0@', '1 FAMC @F1@',
        '0 @I4@ INDI', '1 NAME AncMom /Ancestor/', '1 SEX F', '1 FAMS @F0@', '1 FAMC @F2@',
        '0 @I5@ INDI', '1 NAME PatGF /Ancestor/', '1 SEX M', '1 FAMS @F1@', '1 FAMS @F3@',
        '0 @I6@ INDI', '1 NAME PatGM /Ancestor/', '1 SEX F', '1 FAMS @F1@', '1 FAMS @F4@',
        '0 @I7@ INDI', '1 NAME InlawWife2 /Partner/', '1 SEX F', '1 FAMS @F3@',
        '0 @I8@ INDI', '1 NAME MarineChild /Person/', '1 SEX M', '1 FAMC @F3@', '1 FAMS @F7@',
        '0 @I9@ INDI', '1 NAME MarineSpouse /Partner/', '1 SEX F', '1 FAMS @F7@',
        '0 @I10@ INDI', '1 NAME MatGF /Ancestor/', '1 SEX M', '1 FAMS @F2@',
        '0 @I11@ INDI', '1 NAME MatGM /Ancestor/', '1 SEX F', '1 FAMS @F2@',
        '0 @I12@ INDI', '1 NAME SibA /Person/', '1 SEX F', '1 FAMC @F2@', '1 FAMS @F5@',
        '0 @I13@ INDI', '1 NAME SibASpouse /Partner/', '1 SEX M', '1 FAMS @F5@',
        '0 @I14@ INDI', '1 NAME SibAChild /Person/', '1 SEX M', '1 FAMC @F5@', '1 FAMS @F6@',
        '0 @I15@ INDI', '1 NAME SibAChildSpouse /Partner/', '1 SEX F', '1 FAMS @F6@',
        '0 @I16@ INDI', '1 NAME GCLeft /Person/', '1 SEX M', '1 FAMC @F6@',
        '0 @I17@ INDI', '1 NAME GCRight /Person/', '1 SEX F', '1 FAMC @F6@',
        '0 @I18@ INDI', '1 NAME SibB /Person/', '1 SEX M', '1 FAMC @F2@',
        '0 @I19@ INDI', '1 NAME AncInlaw /Partner/', '1 SEX M', '1 FAMS @F4@',
        '0 @I20@ INDI', '1 NAME InlawChild /Person/', '1 SEX F', '1 FAMC @F4@',
        '0 @F0@ FAM', '1 HUSB @I3@', '1 WIFE @I4@', '1 CHIL @I1@',
        '0 @F1@ FAM', '1 HUSB @I5@', '1 WIFE @I6@', '1 CHIL @I3@',
        '0 @F2@ FAM', '1 HUSB @I10@', '1 WIFE @I11@', '1 CHIL @I4@', '1 CHIL @I12@', '1 CHIL @I18@',
        '0 @F3@ FAM', '1 HUSB @I5@', '1 WIFE @I7@', '1 CHIL @I8@',
        '0 @F4@ FAM', '1 HUSB @I19@', '1 WIFE @I6@', '1 CHIL @I20@',
        '0 @F5@ FAM', '1 HUSB @I13@', '1 WIFE @I12@', '1 CHIL @I14@',
        '0 @F6@ FAM', '1 HUSB @I14@', '1 WIFE @I15@', '1 CHIL @I16@', '1 CHIL @I17@',
        '0 @F7@ FAM', '1 HUSB @I8@', '1 WIFE @I9@',
        '0 @F10@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
        '0 TRLR',
    ].join('\n');
}

function getMaleRootCenteringGedcom() {
    return [
        '0 HEAD',
        '0 @I1@ INDI', '1 NAME Root /Person/', '1 SEX M', '1 FAMC @F0@', '1 FAMS @F1@', '1 FAMS @F2@',
        '0 @I2@ INDI', '1 NAME WifeA /Partner/', '1 SEX F', '1 FAMS @F1@',
        '0 @I3@ INDI', '1 NAME WifeB /Partner/', '1 SEX F', '1 FAMS @F2@',
        '0 @I4@ INDI', '1 NAME Father /Ancestor/', '1 SEX M', '1 FAMS @F0@',
        '0 @I5@ INDI', '1 NAME Mother /Ancestor/', '1 SEX F', '1 FAMS @F0@',
        '0 @I6@ INDI', '1 NAME SisterA /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F3@',
        '0 @I7@ INDI', '1 NAME SibHusbA /Partner/', '1 SEX M', '1 FAMS @F3@',
        '0 @I8@ INDI', '1 NAME SibChildA /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I9@ INDI', '1 NAME SibChildB /Person/', '1 SEX M', '1 FAMC @F3@',
        '0 @I10@ INDI', '1 NAME SisterB /Person/', '1 SEX F', '1 FAMC @F0@', '1 FAMS @F4@',
        '0 @I11@ INDI', '1 NAME SibHusbB /Partner/', '1 SEX M', '1 FAMS @F4@',
        '0 @I12@ INDI', '1 NAME SibChildC /Person/', '1 SEX M', '1 FAMC @F4@',
        '0 @I13@ INDI', '1 NAME SibChildD /Person/', '1 SEX F', '1 FAMC @F4@',
        '0 @I14@ INDI', '1 NAME SibChildE /Person/', '1 SEX M', '1 FAMC @F4@',
        '0 @I15@ INDI', '1 NAME BrotherSib /Person/', '1 SEX M', '1 FAMC @F0@', '1 FAMS @F5@',
        '0 @I16@ INDI', '1 NAME SibWife /Partner/', '1 SEX F', '1 FAMS @F5@',
        '0 @I17@ INDI', '1 NAME SibChildF /Person/', '1 SEX F', '1 FAMC @F5@',
        '0 @F0@ FAM', '1 HUSB @I4@', '1 WIFE @I5@', '1 CHIL @I1@', '1 CHIL @I6@', '1 CHIL @I10@', '1 CHIL @I15@',
        '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
        '0 @F2@ FAM', '1 HUSB @I1@', '1 WIFE @I3@',
        '0 @F3@ FAM', '1 HUSB @I7@', '1 WIFE @I6@', '1 CHIL @I8@', '1 CHIL @I9@',
        '0 @F4@ FAM', '1 HUSB @I11@', '1 WIFE @I10@', '1 CHIL @I12@', '1 CHIL @I13@', '1 CHIL @I14@',
        '0 @F5@ FAM', '1 HUSB @I15@', '1 WIFE @I16@', '1 CHIL @I17@',
        '0 TRLR',
    ].join('\n');
}

function buildAndPositionTree(context, rootId) {
    const root = context.window.individuals.find(person => person.id === rootId);
    const rootNode = context.buildTree(root);
    const rows = context.positionTree(rootNode);
    context.normalizeTreeX(rows);
    context.setHeights(rows);
    return rootNode;
}

function collectAllNodes(rootNode) {
    const seen = new Set();
    const nodes = [];
    function walk(n) {
        if (!n || seen.has(n)) return;
        seen.add(n);
        nodes.push(n);
        (n.spouse_nodes || []).forEach(walk);
        (n.children_nodes || []).forEach(walk);
        walk(n.father_node);
        walk(n.mother_node);
    }
    walk(rootNode);
    return nodes;
}

describe('integration test cases', () => {
    it('05.01 parses GEDCOM, selects root, and creates a drawable tree', async () => {
        const dom = new JSDOM('<div id="family-tree-div"></div>');

        let capturedRows = null;
        const context = createPipelineContext({
            dom,
            drawTree: async (rows) => {
                capturedRows = rows;
                dom.window.document.getElementById('family-tree-div').innerHTML = '<svg><path></path></svg>';
            },
        });

        const parsed = context.parseGedcomData(getIntegrationGedcom());
        context.window.individuals = parsed.individuals;
        context.window.families = parsed.families;

        const root = parsed.individuals.find(person => person.id === '@I1@');
        await context.createFamilyTree(root);

        const allNodeIds = capturedRows
            .flatMap(level => level || [])
            .flatMap(subLevel => subLevel || [])
            .map(node => node.individual && node.individual.id)
            .filter(Boolean);

        expect(parsed.individuals.length).toBe(6);
        expect(parsed.families.length).toBe(3);
        expect(context.window.root_node.individual.id).toBe('@I1@');
        expect(capturedRows).not.toBeNull();
        expect(allNodeIds).toContain('@I1@');
        expect(allNodeIds).toContain('@I2@');
        expect(allNodeIds).toContain('@I3@');
        expect(dom.window.document.querySelector('#family-tree-div svg')).not.toBeNull();
    });

    it('05.02 updateFamilyTree enforces generation and stack maximums after redraw', async () => {
        const dom = new JSDOM(`
            <div id="family-tree-div"></div>
            <select id="individual-select"><option value="@I1@" selected>Root</option></select>
            <input id="generations-up-number" value="99" />
            <input id="generations-down-number" value="99" />
            <input id="max-stack-size-number" value="99" />
        `);

        const elements = {
            family_tree_div: dom.window.document.getElementById('family-tree-div'),
            individual_select: dom.window.document.getElementById('individual-select'),
            generations_up_number: dom.window.document.getElementById('generations-up-number'),
            generations_down_number: dom.window.document.getElementById('generations-down-number'),
            max_stack_size_number: dom.window.document.getElementById('max-stack-size-number'),
        };

        const context = loadBrowserScripts(
            ['src/js/ui.js'],
            {
                windowOverrides: {
                    ...elements,
                    generations_up: 2,
                    generations_down: 2,
                    max_stack_size: 50,
                    hide_childless_inlaws: false,
                    vertical_inlaws: true,
                    pedigree_only: false,
                    box_width: 80,
                    box_height: 50,
                    h_spacing: 24,
                    v_spacing: 28,
                    level_spacing: 40,
                    box_padding: 2,
                    tree_padding: 80,
                    node_border_width: 2,
                    link_width: 2,
                    selected_individual: { id: '@I1@' },
                    gedcom_content: 'fixture',
                },
                globalOverrides: {
                    document: dom.window.document,
                    d3: { hcl: () => ({}) },
                    individual_select: elements.individual_select,
                    generations_up_number: elements.generations_up_number,
                    generations_down_number: elements.generations_down_number,
                    max_stack_size_number: elements.max_stack_size_number,
                    family_tree_div: elements.family_tree_div,
                    parseGedcomData: () => ({
                        individuals: [{ id: '@I1@', name: 'Root' }],
                        families: [],
                    }),
                    createFamilyTree: async () => {
                        elements.family_tree_div.innerHTML = '<svg></svg>';
                        context.window.max_gen_up = 1;
                        context.window.max_gen_down = 1;
                        context.window.max_stack_actual = 1;
                    },
                    optionsMenu: { style: {}, addEventListener: () => {} },
                    leftColumnWrapper: { classList: { remove: () => {}, add: () => {}, contains: () => false }, style: {} },
                    leftCol: { offsetWidth: 300 },
                    rightCol: { offsetWidth: 500 },
                    expand_styling_button: { style: {} },
                    collapse_styling_button: { style: {} },
                    file_name_span: { textContent: '' },
                    individual_filter: { value: '' },
                    hue_element: { value: '180' },
                    sat_element: { value: '20' },
                    lum_element: { value: '30' },
                    text_lum_element: { value: '80' },
                    root_name: null,
                    color_picker: { value: '#000000' },
                    save_filename_input: { value: '' },
                    save_modal: { style: {} },
                    style_presets: {},
                    elements: [],
                    filter_timeout: null,
                    update_in_progress: false,
                    update_waiting: false,
                    update_timeout: null,
                },
            }
        );

        await context.updateFamilyTree();

        expect(elements.generations_up_number.value).toBe('1');
        expect(elements.generations_down_number.value).toBe('1');
        expect(elements.max_stack_size_number.value).toBe('1');
    });

    it('05.03 larger stack size produces narrower layout for leaf-heavy children', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I3@', name: 'C1', famc: '@F1@', fams: [], gender: 'M' },
            { id: '@I4@', name: 'C2', famc: '@F1@', fams: [], gender: 'F' },
            { id: '@I5@', name: 'C3', famc: '@F1@', fams: [], gender: 'M' },
            { id: '@I6@', name: 'C4', famc: '@F1@', fams: [], gender: 'F' },
            { id: '@I7@', name: 'C5', famc: '@F1@', fams: [], gender: 'M' },
            { id: '@I8@', name: 'C6', famc: '@F1@', fams: [], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: ['@I3@', '@I4@', '@I5@', '@I6@', '@I7@', '@I8@'] },
        ];

        function layoutWidth(maxStackSize) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(individuals);
            context.window.families = structuredClone(families);
            context.window.max_stack_size = maxStackSize;
            context.window.generations_up = 0;
            context.window.generations_down = 1;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            const rows = context.positionTree(rootNode);
            context.normalizeTreeX(rows);
            context.setHeights(rows);
            context.adjustInnerChildrenSpacingGlobal(rows);
            context.normalizeTreeX(rows);
            return getLayoutWidth(rootNode);
        }

        const widthWithoutStacking = layoutWidth(1);
        const widthWithStacking = layoutWidth(99);

        expect(widthWithStacking).toBeLessThan(widthWithoutStacking);
    });

    it('05.04 toggling vertical in-laws changes spouse placement from side to below', () => {
        const individuals = [
            { id: '@I1@', name: 'Root', famc: null, fams: ['@F1@'], gender: 'M' },
            { id: '@I2@', name: 'Spouse', famc: null, fams: ['@F1@'], gender: 'F' },
            { id: '@I3@', name: 'Child', famc: '@F1@', fams: [], gender: 'F' },
        ];
        const families = [
            { id: '@F1@', husb: '@I1@', wife: '@I2@', chil: ['@I3@'] },
        ];

        function spouseY(verticalInlaws) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(individuals);
            context.window.families = structuredClone(families);
            context.window.vertical_inlaws = verticalInlaws;
            context.window.generations_up = 0;
            context.window.generations_down = 1;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            const rows = context.positionTree(rootNode);
            context.normalizeTreeX(rows);
            context.setHeights(rows);
            return {
                rootY: rootNode.y,
                spouseY: rootNode.spouse_nodes[0].y,
            };
        }

        const vertical = spouseY(true);
        const horizontal = spouseY(false);

        expect(vertical.spouseY).toBeGreaterThan(vertical.rootY);
        expect(horizontal.spouseY).toBeLessThanOrEqual(horizontal.rootY);
    });

    it('05.05 hide_childless_inlaws removes childless spouse branches only', () => {
        const parsed = createPipelineContext().parseGedcomData(getIntegrationGedcom());

        function spouseIds(hideChildlessInlaws) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(parsed.individuals);
            context.window.families = structuredClone(parsed.families);
            context.window.hide_childless_inlaws = hideChildlessInlaws;
            context.window.generations_up = 0;
            context.window.generations_down = 1;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            return rootNode.spouse_nodes.map(node => node.individual.id).sort();
        }

        const visibleAll = spouseIds(false);
        const visibleWithoutChildless = spouseIds(true);

        expect(visibleAll).toEqual(['@I2@', '@I4@']);
        expect(visibleWithoutChildless).toEqual(['@I2@']);
    });

    it('05.06 usePresetStyle updates linked UI inputs and requests redraw', () => {
        const dom = new JSDOM(`
            <input id="max-stack-size-number" value="1" />
            <input id="max-stack-size-range" value="1" />
            <input id="show-places-checkbox" type="checkbox" />
            <select id="text-align-select"><option value="top">top</option><option value="middle">middle</option></select>
            <input id="color-picker" value="#000000" />
        `);

        let redrawRequests = 0;
        const context = loadBrowserScripts(['src/js/ui.js'], {
            windowOverrides: {
                max_stack_size: 1,
                show_places: false,
                tree_color: '#000000',
                text_align: 'top',
            },
            globalOverrides: {
                document: dom.window.document,
                d3: {
                    hcl: () => ({})
                },
                style_presets: {
                    'integration-preset': {
                        'max-stack-size': 4,
                        'show-places': true,
                        'background-color': '#112233',
                        'text-align': 'middle',
                    },
                },
                elements: [
                    { id: 'max-stack-size-number', variable: 'max_stack_size' },
                    { id: 'show-places-checkbox', variable: 'show_places' },
                ],
                color_picker: dom.window.document.getElementById('color-picker'),
                updateRangeThumbs: () => {},
                requestFamilyTreeUpdate: () => {
                    redrawRequests += 1;
                },
                optionsMenu: { style: {}, addEventListener: () => {} },
                leftColumnWrapper: { classList: { remove: () => {}, add: () => {}, contains: () => false }, style: {} },
                leftCol: { offsetWidth: 300 },
                rightCol: { offsetWidth: 500 },
                family_tree_div: { querySelector: () => null },
                expand_styling_button: { style: {} },
                collapse_styling_button: { style: {} },
                file_name_span: { textContent: '' },
                individual_filter: { value: '' },
                individual_select: { innerHTML: '' },
                generations_up_number: { value: '1' },
                generations_down_number: { value: '1' },
                max_stack_size_number: dom.window.document.getElementById('max-stack-size-number'),
                hue_element: { value: '180' },
                sat_element: { value: '20' },
                lum_element: { value: '30' },
                text_lum_element: { value: '80' },
                root_name: null,
                save_filename_input: { value: '' },
                save_modal: { style: {} },
                filter_timeout: null,
                update_in_progress: false,
                update_waiting: false,
                update_timeout: null,
            },
        });

        context.updateRangeThumbs = () => {};
        context.requestFamilyTreeUpdate = () => {
            redrawRequests += 1;
        };

        context.usePresetStyle('integration-preset');

        expect(dom.window.document.getElementById('max-stack-size-number').value).toBe('4');
        expect(dom.window.document.getElementById('max-stack-size-range').value).toBe('4');
        expect(dom.window.document.getElementById('show-places-checkbox').checked).toBe(true);
        expect(dom.window.document.getElementById('text-align-select').value).toBe('middle');
        expect(dom.window.document.getElementById('color-picker').value).toBe('#112233');
        expect(context.window.max_stack_size).toBe(4);
        expect(context.window.show_places).toBe(true);
        expect(context.window.tree_color).toBe('#112233');
        expect(context.window.text_align).toBe('middle');
        expect(redrawRequests).toBe(1);
    });

    it('05.07 wide in-law subtree nodes do not cross the ancestor-to-child connector line', () => {
        const parsed = createPipelineContext().parseGedcomData(getWideInlawGedcom());

        [true, false].forEach(verticalInlaws => {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(parsed.individuals);
            context.window.families = structuredClone(parsed.families);
            context.window.vertical_inlaws = verticalInlaws;
            context.window.generations_up = 1;
            context.window.generations_down = 1;
            context.window.suppress_positioning_log = true;

            const root = context.window.individuals.find(ind => ind.id === '@I1@');
            const rootNode = context.buildTree(root);
            const rows = context.positionTree(rootNode);
            context.normalizeTreeX(rows);
            context.setHeights(rows);

            const fatherNode = rootNode.father_node;
            expect(fatherNode, `father_node should exist (vertical_inlaws=${verticalInlaws})`).not.toBeNull();

            // The x coordinate of the vertical connector line from male ancestor couple → pedigree child
            const box_width = context.window.box_width;
            const h_spacing = context.window.h_spacing;
            const connector_x = fatherNode.x + box_width + h_spacing / 2;

            // Collect all nodes in the in-law subtree (in-law spouse + all their descendants)
            const inlawSpouseNodes = fatherNode.spouse_nodes.filter(n => n.type === 'inlaw');
            expect(inlawSpouseNodes.length, `in-law spouse should exist (vertical_inlaws=${verticalInlaws})`).toBeGreaterThan(0);

            const visited = new Set();
            function collectSubtree(node) {
                if (!node || visited.has(node)) return [];
                visited.add(node);
                const result = [node];
                (node.children_nodes || []).forEach(child => result.push(...collectSubtree(child)));
                return result;
            }

            const inlawSubtree = inlawSpouseNodes.flatMap(n => collectSubtree(n));
            // 1 in-law spouse + 5 children
            expect(inlawSubtree.length, `in-law subtree should include spouse and 5 children (vertical_inlaws=${verticalInlaws})`).toBeGreaterThanOrEqual(6);

            // No in-law subtree node should straddle the connector line
            inlawSubtree.forEach(node => {
                if (typeof node.x !== 'number') return;
                const crosses = node.x < connector_x && (node.x + box_width) > connector_x;
                expect(crosses, `[vertical_inlaws=${verticalInlaws}] "${node.individual?.name}" (x=${node.x.toFixed(1)}) crosses connector_x=${connector_x.toFixed(1)}`).toBe(false);
            });
        });
    });

    it('05.08 createFamilyTree runs without network/upload calls (privacy/serverless)', async () => {
        const dom = new JSDOM('<div id="family-tree-div"></div>');
        const context = createPipelineContext({
            dom,
            drawTree: async () => {
                dom.window.document.getElementById('family-tree-div').innerHTML = '<svg></svg>';
            },
        });

        let fetchCalls = 0;
        let xhrCalls = 0;
        let beaconCalls = 0;

        const fakeFetch = async () => {
            fetchCalls += 1;
            return { ok: true };
        };
        function FakeXMLHttpRequest() {
            xhrCalls += 1;
        }
        const fakeNavigator = {
            sendBeacon: () => {
                beaconCalls += 1;
                return true;
            },
        };

        context.fetch = fakeFetch;
        context.window.fetch = fakeFetch;
        context.XMLHttpRequest = FakeXMLHttpRequest;
        context.window.XMLHttpRequest = FakeXMLHttpRequest;
        context.navigator = fakeNavigator;
        context.window.navigator = fakeNavigator;

        const parsed = context.parseGedcomData(getIntegrationGedcom());
        context.window.individuals = parsed.individuals;
        context.window.families = parsed.families;

        const root = parsed.individuals.find(person => person.id === '@I1@');
        await context.createFamilyTree(root);

        expect(fetchCalls).toBe(0);
        expect(xhrCalls).toBe(0);
        expect(beaconCalls).toBe(0);
        expect(dom.window.document.querySelector('#family-tree-div svg')).not.toBeNull();
    });

    it('05.09 siblings are positioned left-to-right in birth-year order with no-year nodes rightmost', () => {
        // Children are listed in deliberate non-birth-year order in the GEDCOM CHIL list:
        //   @I5@ (2000), @I8@ (no year), @I4@ (1985), @I1@ (root, 1990), @I6@ (no year), @I7@ (1995)
        // After sorting, father's children_nodes x positions should be in order: 1985, 1990, 1995, 2000, no-year, no-year
        const gedcom = [
            '0 HEAD',
            '0 @I1@ INDI',
            '1 NAME Root /Person/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 1990',
            '1 FAMC @F0@',
            '0 @I2@ INDI',
            '1 NAME Father /Ancestor/',
            '1 SEX M',
            '1 FAMS @F0@',
            '0 @I3@ INDI',
            '1 NAME Mother /Ancestor/',
            '1 SEX F',
            '1 FAMS @F0@',
            '0 @I4@ INDI',
            '1 NAME Sibling /Earliest/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 1985',
            '1 FAMC @F0@',
            '0 @I5@ INDI',
            '1 NAME Sibling /Latest/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 2000',
            '1 FAMC @F0@',
            '0 @I6@ INDI',
            '1 NAME Sibling /NoYearA/',
            '1 SEX F',
            '1 FAMC @F0@',
            '0 @I7@ INDI',
            '1 NAME Sibling /Middle/',
            '1 SEX M',
            '1 BIRT',
            '2 DATE 1995',
            '1 FAMC @F0@',
            '0 @I8@ INDI',
            '1 NAME Sibling /NoYearB/',
            '1 SEX F',
            '1 FAMC @F0@',
            '0 @F0@ FAM',
            '1 HUSB @I2@',
            '1 WIFE @I3@',
            '1 CHIL @I5@',
            '1 CHIL @I8@',
            '1 CHIL @I4@',
            '1 CHIL @I1@',
            '1 CHIL @I6@',
            '1 CHIL @I7@',
            '0 TRLR',
        ].join('\n');

        const context = createPipelineContext();
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const parsed = context.parseGedcomData(gedcom);
        context.window.individuals = parsed.individuals;
        context.window.families = parsed.families;

        const root = parsed.individuals.find(ind => ind.id === '@I1@');
        const rootNode = context.buildTree(root);
        const rows = context.positionTree(rootNode);
        context.normalizeTreeX(rows);

        const fatherNode = rootNode.father_node;
        expect(fatherNode, 'father_node should exist').not.toBeNull();

        // Root appears in children_nodes as a relative node alongside its siblings
        const siblings = fatherNode.children_nodes;
        expect(siblings.length).toBe(6);

        // Sort siblings by their x position (left to right)
        const byPosition = siblings.slice().sort((a, b) => a.x - b.x);
        const birthYears = byPosition.map(n => {
            const year = parseInt(n.individual.birth, 10);
            return isNaN(year) ? null : year;
        });

        // Nodes with birth years should all precede nodes without birth years
        const lastYearIndex = birthYears.reduce((last, y, i) => (y !== null ? i : last), -1);
        const firstNullIndex = birthYears.indexOf(null);
        if (firstNullIndex !== -1 && lastYearIndex !== -1) {
            expect(lastYearIndex, 'all nodes with birth years should be left of no-year nodes').toBeLessThan(firstNullIndex);
        }

        // Birth years (where present) should be in ascending order left to right
        const years = birthYears.filter(y => y !== null);
        expect(years, 'birth years should be in ascending order left to right').toEqual([...years].sort((a, b) => a - b));
    });

    it('05.10 hide_non_pedigree_family excludes root sibling branches from the built tree', () => {
        const parsed = createPipelineContext().parseGedcomData(getPedigreeSiblingGedcom());

        function getFatherChildren(hideNonPedigreeFamily) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(parsed.individuals);
            context.window.families = structuredClone(parsed.families);
            context.window.hide_non_pedigree_family = hideNonPedigreeFamily;
            context.window.generations_up = 1;
            context.window.generations_down = 2;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            return rootNode.father_node.children_nodes;
        }

        const withBranches = getFatherChildren(false);
        const withoutBranches = getFatherChildren(true);

        expect(withBranches.map(node => node.individual.id)).toEqual(['@I1@', '@I2@']);
        expect(withoutBranches.map(node => node.individual.id)).toEqual(['@I1@']);
        expect(withoutBranches[0].spouse_nodes.map(node => node.individual.id)).toEqual(['@I7@']);
        expect(withoutBranches[0].spouse_nodes[0].children_nodes.map(node => node.individual.id)).toEqual(['@I8@']);
    });

    it('05.11 hide_non_pedigree_family excludes ancestor in-law spouse branches from the built tree', () => {
        const parsed = createPipelineContext().parseGedcomData(getWideInlawGedcom());

        function getFatherInlawIds(hideNonPedigreeFamily) {
            const context = createPipelineContext();
            context.window.individuals = structuredClone(parsed.individuals);
            context.window.families = structuredClone(parsed.families);
            context.window.hide_non_pedigree_family = hideNonPedigreeFamily;
            context.window.generations_up = 1;
            context.window.generations_down = 1;

            const root = context.window.individuals.find(person => person.id === '@I1@');
            const rootNode = context.buildTree(root);
            return rootNode.father_node.spouse_nodes.map(node => node.individual.id).sort();
        }

        expect(getFatherInlawIds(false)).toEqual(['@I4@']);
        expect(getFatherInlawIds(true)).toEqual([]);
    });

    it('05.12 horizontal in-law male spouse is positioned to the left of female root', () => {
        const parsed = createPipelineContext().parseGedcomData(getFemaleRootHorizontalInlawGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');

        // The root is female, so the positioned copy lives in father's children_nodes.
        // Male in-law (InlawSpouse) is accessible via that copy's spouse_nodes.
        const rootRelativeNode = rootNode.father_node.children_nodes.find(n => n.individual.id === '@I1@');
        expect(rootRelativeNode, 'positioned root node should exist under father').toBeDefined();

        const jonNode = rootRelativeNode.spouse_nodes.find(n => n.individual.id === '@I2@');
        expect(jonNode, 'male in-law should be in spouse_nodes').toBeDefined();

        expect(jonNode.x).toBeLessThan(rootRelativeNode.x);
    });

    it('05.13 horizontal in-law female spouses are positioned to the right of male root', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootHorizontalInlawGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');

        // The root is male; his positioned copy lives in father's children_nodes.
        // Female in-laws (WifeA, WifeB) are in that copy's spouse_nodes.
        const rootRelativeNode = rootNode.father_node.children_nodes.find(n => n.individual.id === '@I1@');
        expect(rootRelativeNode, 'positioned root node should exist under father').toBeDefined();

        const femaleInlaws = rootRelativeNode.spouse_nodes.filter(n => n.individual.gender === 'F');
        expect(femaleInlaws.length).toBeGreaterThanOrEqual(2);

        femaleInlaws.forEach(spouseNode => {
            expect(spouseNode.x).toBeGreaterThan(rootRelativeNode.x);
        });
    });

    it('05.14 horizontal in-law female spouses of male root are positioned to the left of male ancestors', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootHorizontalInlawGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');

        const rootRelativeNode = rootNode.father_node.children_nodes.find(n => n.individual.id === '@I1@');
        expect(rootRelativeNode, 'positioned root node should exist under father').toBeDefined();

        const fatherNode = rootNode.father_node;
        expect(fatherNode.individual.gender).toBe('M');

        const femaleInlaws = rootRelativeNode.spouse_nodes.filter(n => n.individual.gender === 'F');
        expect(femaleInlaws.length).toBeGreaterThanOrEqual(2);

        femaleInlaws.forEach(spouseNode => {
            expect(spouseNode.x).toBeLessThan(fatherNode.x);
        });
    });

    it('05.15 horizontal in-law male spouse and female sibling are centered above their two children', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const sisterA = find('@I6@');
        const sibHusbA = find('@I7@');
        const sibChildA = find('@I8@');
        const sibChildB = find('@I9@');

        expect(sisterA, 'SisterA should be in tree').toBeDefined();
        expect(sibHusbA, 'SibHusbA should be in tree').toBeDefined();
        expect(sibChildA, 'SibChildA should be in tree').toBeDefined();
        expect(sibChildB, 'SibChildB should be in tree').toBeDefined();

        const boxWidth = context.window.box_width;
        const coupleCenter = (Math.min(sibHusbA.x, sisterA.x) + Math.max(sibHusbA.x, sisterA.x) + boxWidth) / 2;
        const childrenCenter = (Math.min(sibChildA.x, sibChildB.x) + Math.max(sibChildA.x, sibChildB.x) + boxWidth) / 2;

        expect(coupleCenter).toBe(childrenCenter);
    });

    it('05.16 horizontal in-law male spouse and female sibling are centered above their three children', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const sisterB = find('@I10@');
        const sibHusbB = find('@I11@');
        const sibChildC = find('@I12@');
        const sibChildD = find('@I13@');
        const sibChildE = find('@I14@');

        expect(sisterB, 'SisterB should be in tree').toBeDefined();
        expect(sibHusbB, 'SibHusbB should be in tree').toBeDefined();
        expect(sibChildC, 'SibChildC should be in tree').toBeDefined();
        expect(sibChildD, 'SibChildD should be in tree').toBeDefined();
        expect(sibChildE, 'SibChildE should be in tree').toBeDefined();

        const boxWidth = context.window.box_width;
        const childXs = [sibChildC.x, sibChildD.x, sibChildE.x];
        const coupleCenter = (Math.min(sibHusbB.x, sisterB.x) + Math.max(sibHusbB.x, sisterB.x) + boxWidth) / 2;
        const childrenCenter = (Math.min(...childXs) + Math.max(...childXs) + boxWidth) / 2;

        expect(coupleCenter).toBe(childrenCenter);
    });

    it('05.17 horizontal in-law female spouse and male sibling are centered above their one child', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const brotherSib = find('@I15@');
        const sibWife = find('@I16@');
        const sibChildF = find('@I17@');

        expect(brotherSib, 'BrotherSib should be in tree').toBeDefined();
        expect(sibWife, 'SibWife should be in tree').toBeDefined();
        expect(sibChildF, 'SibChildF should be in tree').toBeDefined();

        const boxWidth = context.window.box_width;
        const coupleCenter = (Math.min(brotherSib.x, sibWife.x) + Math.max(brotherSib.x, sibWife.x) + boxWidth) / 2;
        const childCenter = sibChildF.x + boxWidth / 2;

        expect(coupleCenter).toBe(childCenter);
    });

    it('05.18 ancestor couple is centered above all of their children', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const father = find('@I4@');
        const mother = find('@I5@');
        // The root's positioned copy lives under the father's children_nodes (type='relative')
        const rootCopy = rootNode.father_node.children_nodes.find(n => n.individual.id === '@I1@');
        const sisterA = find('@I6@');
        const sisterB = find('@I10@');
        const brotherSib2 = find('@I15@');

        [father, mother, rootCopy, sisterA, sisterB, brotherSib2].forEach(n => {
            expect(n, 'expected node should be in tree').toBeDefined();
        });

        const boxWidth = context.window.box_width;
        const coupleCenter = (Math.min(father.x, mother.x) + Math.max(father.x, mother.x) + boxWidth) / 2;
        const childXs = [rootCopy, sisterA, sisterB, brotherSib2].map(n => n.x);
        const childrenCenter = (Math.min(...childXs) + Math.max(...childXs) + boxWidth) / 2;

        expect(coupleCenter).toBe(childrenCenter);
    });

    it('05.20 vertical in-law root is centered above their spouses', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const rootCopy = rootNode.father_node.children_nodes.find(n => n.individual.id === '@I1@');
        const nodes = collectAllNodes(rootNode);
        const wifeA = nodes.find(n => n.individual.id === '@I2@');
        const wifeB = nodes.find(n => n.individual.id === '@I3@');

        expect(rootCopy, 'rootCopy should be in tree').toBeDefined();
        expect(wifeA, 'WifeA should be in tree').toBeDefined();
        expect(wifeB, 'WifeB should be in tree').toBeDefined();

        const boxWidth = context.window.box_width;
        const rootCenter = rootCopy.x + boxWidth / 2;
        const spousesCenter = (Math.min(wifeA.x, wifeB.x) + Math.max(wifeA.x, wifeB.x) + boxWidth) / 2;
        expect(rootCenter).toBe(spousesCenter);
    });

    it('05.21 vertical in-law siblings are each centered above their own spouse', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const sisterA = find('@I6@');
        const sibHusbA = find('@I7@');
        const sisterB = find('@I10@');
        const sibHusbB = find('@I11@');
        const brotherSib = find('@I15@');
        const sibWife = find('@I16@');

        [sisterA, sibHusbA, sisterB, sibHusbB, brotherSib, sibWife].forEach(n => {
            expect(n, 'expected node should be in tree').toBeDefined();
        });

        const boxWidth = context.window.box_width;
        const centerX = n => n.x + boxWidth / 2;
        expect(centerX(sisterA)).toBe(centerX(sibHusbA));
        expect(centerX(sisterB)).toBe(centerX(sibHusbB));
        expect(centerX(brotherSib)).toBe(centerX(sibWife));
    });

    it('05.22 vertical in-law sibling spouses are centered above their children', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const sibHusbA = find('@I7@');
        const sibChildA = find('@I8@');
        const sibChildB = find('@I9@');
        const sibHusbB = find('@I11@');
        const sibChildC = find('@I12@');
        const sibChildD = find('@I13@');
        const sibChildE = find('@I14@');
        const sibWife = find('@I16@');
        const sibChildF = find('@I17@');

        [sibHusbA, sibChildA, sibChildB, sibHusbB, sibChildC, sibChildD, sibChildE, sibWife, sibChildF].forEach(n => {
            expect(n, 'expected node should be in tree').toBeDefined();
        });

        const boxWidth = context.window.box_width;
        const centerX = n => n.x + boxWidth / 2;
        const childrenCenter = (...children) => {
            const xs = children.map(c => c.x);
            return (Math.min(...xs) + Math.max(...xs) + boxWidth) / 2;
        };

        expect(centerX(sibHusbA)).toBe(childrenCenter(sibChildA, sibChildB));
        expect(centerX(sibHusbB)).toBe(childrenCenter(sibChildC, sibChildD, sibChildE));
        expect(centerX(sibWife)).toBe(centerX(sibChildF));
    });

    it('05.23 vertical in-law children of a couple are in a single stack when count is within max_stack_size', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;
        context.window.max_stack_size = 2;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const sibChildA = find('@I8@');
        const sibChildB = find('@I9@');

        expect(sibChildA, 'SibChildA should be in tree').toBeDefined();
        expect(sibChildB, 'SibChildB should be in tree').toBeDefined();

        // Two children fits within max_stack_size=2: they share the same x (single stack column)
        expect(sibChildA.x).toBe(sibChildB.x);
    });

    it('05.24 vertical in-law children exceeding max_stack_size are split into a stack of two and a stack of one', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;
        context.window.max_stack_size = 2;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const sibChildC = find('@I12@');
        const sibChildD = find('@I13@');
        const sibChildE = find('@I14@');

        expect(sibChildC, 'SibChildC should be in tree').toBeDefined();
        expect(sibChildD, 'SibChildD should be in tree').toBeDefined();
        expect(sibChildE, 'SibChildE should be in tree').toBeDefined();

        // Three children with max_stack_size=2: two columns → exactly two distinct x values
        const xValues = new Set([sibChildC.x, sibChildD.x, sibChildE.x]);
        expect(xValues.size).toBe(2);
    });

    it('05.25 vertical in-law childless spouses of root are stacked into a single column', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;
        context.window.max_stack_size = 2;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const wifeA = nodes.find(n => n.individual.id === '@I2@');
        const wifeB = nodes.find(n => n.individual.id === '@I3@');

        expect(wifeA, 'WifeA should be in tree').toBeDefined();
        expect(wifeB, 'WifeB should be in tree').toBeDefined();

        // Both childless spouses are stacked: they share the same x (single column)
        expect(wifeA.x).toBe(wifeB.x);
    });

    it('05.26 hide_childless_inlaws removes all childless in-law spouses from the tree', () => {
        const parsed = createPipelineContext().parseGedcomData(getHcilHnpfGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;
        context.window.hide_childless_inlaws = true;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const ids = nodes.filter(n => n.individual).map(n => n.individual.id);

        expect(ids).not.toContain('@I2@'); // Melissa
        expect(ids).not.toContain('@I3@'); // Rebecca
        expect(ids).not.toContain('@I7@'); // Jessica
    });

    it('05.27 hide_childless_inlaws and hide_non_pedigree_family with gen_down=0 leaves only root and direct ancestors', () => {
        const parsed = createPipelineContext().parseGedcomData(getHcilHnpfGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 0;
        context.window.hide_childless_inlaws = true;
        context.window.hide_non_pedigree_family = true;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const uniqueIds = new Set(nodes.filter(n => n.individual).map(n => n.individual.id));

        expect(uniqueIds.size).toBe(3);
        expect(uniqueIds.has('@I1@')).toBe(true); // Root
        expect(uniqueIds.has('@I4@')).toBe(true); // AncDad
        expect(uniqueIds.has('@I5@')).toBe(true); // AncMom
    });

    it('05.28 hide_non_pedigree_family with gen_down=0 excludes siblings but keeps root in-law spouses', () => {
        const parsed = createPipelineContext().parseGedcomData(getHcilHnpfGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 0;
        context.window.hide_childless_inlaws = false;
        context.window.hide_non_pedigree_family = true;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const uniqueIds = new Set(nodes.filter(n => n.individual).map(n => n.individual.id));

        expect(uniqueIds.size).toBe(5);
        expect(uniqueIds.has('@I1@')).toBe(true); // Root
        expect(uniqueIds.has('@I2@')).toBe(true); // SpouseA
        expect(uniqueIds.has('@I3@')).toBe(true); // SpouseB
        expect(uniqueIds.has('@I4@')).toBe(true); // AncDad
        expect(uniqueIds.has('@I5@')).toBe(true); // AncMom
        expect(uniqueIds.has('@I6@')).toBe(false); // SibA excluded
        expect(uniqueIds.has('@I7@')).toBe(false); // SibSpouse excluded
    });

    it('05.29 in-law subtree to the left of the ancestor connector is separated by 1.5 * h_spacing', () => {
        // Tests the positioning constraint: the rightmost edge of an in-law subtree hanging off a male
        // ancestor's secondary family must stay at least h_spacing to the left of the connector circle
        // between the ancestor and his pedigree spouse. The connector is at ancestor.x + box_width + h_spacing/2.
        // In practice the gap equals exactly 1.5 * h_spacing.
        const parsed = createPipelineContext().parseGedcomData(getGenUp2Gedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 2;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const patGF = find('@I5@');           // PatGF: male pedigree ancestor
        const marineSpouse = find('@I9@');    // MarineSpouse: rightmost node in the left-side inlaw subtree

        expect(patGF, 'PatGF should be in tree').toBeDefined();
        expect(marineSpouse, 'MarineSpouse should be in tree').toBeDefined();

        const bw = context.window.box_width;
        const hs = context.window.h_spacing;
        const connectorX = patGF.x + bw + hs / 2;
        const marineSpouseRightEdge = marineSpouse.x + bw;

        expect(connectorX - marineSpouseRightEdge).toBe(1.5 * hs);
    });

    it('05.30 siblings of the female pedigree ancestor are positioned to her right', () => {
        const parsed = createPipelineContext().parseGedcomData(getGenUp2Gedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 2;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const ancMom = find('@I4@');      // AncMom: female pedigree ancestor
        const sibA = find('@I12@');       // SibA: AncMom's sibling
        const sibB = find('@I18@');       // SibB: AncMom's other sibling

        expect(ancMom, 'AncMom should be in tree').toBeDefined();
        expect(sibA, 'SibA should be in tree').toBeDefined();
        expect(sibB, 'SibB should be in tree').toBeDefined();

        expect(sibA.x).toBeGreaterThan(ancMom.x);
        expect(sibB.x).toBeGreaterThan(ancMom.x);
    });

    it('05.31 grandchildren of a sibling of the female ancestor are positioned one level_spacing + v_spacing above the root generation', () => {
        // The bottom edge of the deepest relatives hanging off the parent level is exactly
        // level_spacing + v_spacing above the top of the root generation row.
        // (Note: test-examples.md lists 2 * v_spacing, but the computed gap is v_spacing.)
        const parsed = createPipelineContext().parseGedcomData(getGenUp2Gedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 2;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const gcLeft = find('@I16@');     // GCLeft: grandchild of AncMom's sibling
        const rootRel = rootNode.father_node.children_nodes.find(n => n.individual.id === '@I1@');

        expect(gcLeft, 'GCLeft should be in tree').toBeDefined();
        expect(rootRel, 'Root relative copy should be in tree').toBeDefined();

        const bh = context.window.box_height;
        const ls = context.window.level_spacing;
        const vs = context.window.v_spacing;

        expect(rootRel.y - (gcLeft.y + bh)).toBe(ls + vs);
    });

    it('05.32 the in-law husband of a female ancestor is h_spacing to her right', () => {
        const parsed = createPipelineContext().parseGedcomData(getGenUp2Gedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 2;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const patGM = find('@I6@');        // PatGM: female pedigree ancestor
        const ancInlaw = find('@I19@');     // AncInlaw: inlaw husband in PatGM's second family

        expect(patGM, 'PatGM should be in tree').toBeDefined();
        expect(ancInlaw, 'AncInlaw should be in tree').toBeDefined();

        const bw = context.window.box_width;
        const hs = context.window.h_spacing;
        expect(ancInlaw.x - (patGM.x + bw)).toBe(hs);
    });

    it('05.33 child of a female ancestor and her in-law husband is centered below the two parents', () => {
        const parsed = createPipelineContext().parseGedcomData(getGenUp2Gedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 2;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const patGM = find('@I6@');        // PatGM: female pedigree ancestor
        const ancInlaw = find('@I19@');     // AncInlaw: inlaw husband
        const inlawChild = find('@I20@');   // InlawChild: child of PatGM and AncInlaw

        expect(patGM, 'PatGM should be in tree').toBeDefined();
        expect(ancInlaw, 'AncInlaw should be in tree').toBeDefined();
        expect(inlawChild, 'InlawChild should be in tree').toBeDefined();

        const bw = context.window.box_width;
        const parentCenter = (Math.min(patGM.x, ancInlaw.x) + Math.max(patGM.x, ancInlaw.x) + bw) / 2;
        const childCenter = inlawChild.x + bw / 2;
        expect(childCenter).toBe(parentCenter);
    });

    it('05.34 vertical in-law child of ancestor is centered below the in-law parent', () => {
        const parsed = createPipelineContext().parseGedcomData(getInlawChildMock());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const stepMom = find('@I4@'); // StepMom: inlaw wife of Father
        const childA = find('@I5@');  // ChildA: only child of Father+StepMom

        expect(stepMom, 'StepMom should be in tree').toBeDefined();
        expect(childA, 'ChildA should be in tree').toBeDefined();

        // ChildA (sole child) is directly below StepMom — same center x
        expect(childA.x).toBe(stepMom.x);
    });

    it('05.35 sibling with no family is centered between the two flanking siblings with families', () => {
        const parsed = createPipelineContext().parseGedcomData(getMiddleSibMock());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 0;
        context.window.generations_down = 3;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual.id === id);

        const childA = find('@I3@'); // ChildA: left sibling with family
        const childB = find('@I4@'); // ChildB: middle sibling with no family
        const childC = find('@I5@'); // ChildC: right sibling with family

        expect(childA, 'ChildA should be in tree').toBeDefined();
        expect(childB, 'ChildB should be in tree').toBeDefined();
        expect(childC, 'ChildC should be in tree').toBeDefined();

        const bw = context.window.box_width;
        const flanksCenter = (Math.min(childA.x, childC.x) + Math.max(childA.x, childC.x) + bw) / 2;
        expect(childB.x + bw / 2).toBe(flanksCenter);
    });

    it('05.36 all nodes are separated horizontally by at least h_spacing', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);

        const bw = context.window.box_width;
        const bh = context.window.box_height;
        const hs = context.window.h_spacing;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                if (Math.abs(a.y - b.y) < bh) {
                    expect(Math.abs(a.x - b.x),
                        `nodes ${a.individual?.id} and ${b.individual?.id} share a row but are too close horizontally`
                    ).toBeGreaterThanOrEqual(bw + hs);
                }
            }
        }
    });

    it('05.37 all nodes are separated vertically by at least v_spacing', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);

        const bw = context.window.box_width;
        const bh = context.window.box_height;
        const vs = context.window.v_spacing;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                if (Math.abs(a.x - b.x) < bw) {
                    expect(Math.abs(a.y - b.y),
                        `nodes ${a.individual?.id} and ${b.individual?.id} share a column but are too close vertically`
                    ).toBeGreaterThanOrEqual(bh + vs);
                }
            }
        }
    });

    it('05.38 all nodes are separated horizontally by at least h_spacing (vertical in-laws)', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);

        const bw = context.window.box_width;
        const bh = context.window.box_height;
        const hs = context.window.h_spacing;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                if (Math.abs(a.y - b.y) < bh) {
                    expect(Math.abs(a.x - b.x),
                        `nodes ${a.individual?.id} and ${b.individual?.id} share a row but are too close horizontally`
                    ).toBeGreaterThanOrEqual(bw + hs);
                }
            }
        }
    });

    it('05.39 all nodes are separated vertically by at least v_spacing (vertical in-laws)', () => {
        const parsed = createPipelineContext().parseGedcomData(getMaleRootCenteringGedcom());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 1;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);

        const bw = context.window.box_width;
        const bh = context.window.box_height;
        const vs = context.window.v_spacing;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                if (Math.abs(a.x - b.x) < bw) {
                    expect(Math.abs(a.y - b.y),
                        `nodes ${a.individual?.id} and ${b.individual?.id} share a column but are too close vertically`
                    ).toBeGreaterThanOrEqual(bh + vs);
                }
            }
        }
    });

    it('05.40 shared great-grandparents of two ancestor lines appear exactly once and are linked to the first ancestor', () => {
        const parsed = createPipelineContext().parseGedcomData(getEndogamyMock());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 3;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual && n.individual.id === id);

        const patGF = find('@I4@');   // PatGF: first ancestor whose path reaches SharedGF+SharedGM
        const sharedGF = find('@I8@'); // SharedGF: shared great-grandparent
        const sharedGM = find('@I9@'); // SharedGM: shared great-grandparent

        // SharedGF and SharedGM must each appear exactly once (not duplicated)
        expect(nodes.filter(n => n.individual && n.individual.id === '@I8@').length).toBe(1);
        expect(nodes.filter(n => n.individual && n.individual.id === '@I9@').length).toBe(1);

        // pedigree_child_node points to PatGF (the first ancestor to reach them)
        expect(sharedGF.individual.pedigree_child_node).toBe(patGF);
        expect(sharedGM.individual.pedigree_child_node).toBe(patGF);
    });

    it('05.41 shared great-grandparents have a duplicate pedigree link to the second ancestor', () => {
        const parsed = createPipelineContext().parseGedcomData(getEndogamyMock());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = false;
        context.window.generations_up = 3;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);
        const find = id => nodes.find(n => n.individual && n.individual.id === id);

        const matGM = find('@I7@');    // MatGM: second ancestor whose path reaches SharedGF+SharedGM
        const sharedGF = find('@I8@'); // SharedGF: shared great-grandparent
        const sharedGM = find('@I9@'); // SharedGM: shared great-grandparent

        // duplicate_pedigree_child_node points to MatGM (triggers the dashed link in draw_tree)
        expect(sharedGF.individual.duplicate_pedigree_child_node).toBe(matGM);
        expect(sharedGM.individual.duplicate_pedigree_child_node).toBe(matGM);
    });

    it('05.42 root inlaw spouse and their descendants are not duplicated as relatives under an ancestor', () => {
        const parsed = createPipelineContext().parseGedcomData(getInlawPriorityMock());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.generations_up = 3;
        context.window.generations_down = 1;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);

        // Inlaw (@I2@) and InlawChild (@I3@) must each appear exactly once
        expect(nodes.filter(n => n.individual && n.individual.id === '@I2@').length,
            'Inlaw should appear exactly once').toBe(1);
        expect(nodes.filter(n => n.individual && n.individual.id === '@I3@').length,
            'InlawChild should appear exactly once').toBe(1);

        // Inlaw should be type 'inlaw' (Root's spouse) not 'relative' (AncMom's descendant)
        const inlaw = nodes.find(n => n.individual && n.individual.id === '@I2@');
        expect(inlaw.type, 'Inlaw should be Root\'s inlaw spouse, not a relative').toBe('inlaw');

        // AncMomInlaw (@I10@) should have no children in the tree (Inlaw detached from that branch)
        const ancMomInlaw = nodes.find(n => n.individual && n.individual.id === '@I10@');
        expect(ancMomInlaw.children_nodes.length,
            'AncMomInlaw should have no children (Inlaw was re-homed under Root)').toBe(0);
    });

    it('05.43 ancestor stackable siblings are not stacked when they fit into existing horizontal space', () => {
        const parsed = createPipelineContext().parseGedcomData(getNoStackMock());

        const context = createPipelineContext();
        context.window.individuals = structuredClone(parsed.individuals);
        context.window.families = structuredClone(parsed.families);
        context.window.vertical_inlaws = true;
        context.window.hide_childless_inlaws = true;
        context.window.generations_up = 2;
        context.window.generations_down = 0;
        context.window.max_stack_size = 3;

        const rootNode = buildAndPositionTree(context, '@I1@');
        const nodes = collectAllNodes(rootNode);

        const sibA = nodes.find(n => n.individual && n.individual.id === '@I7@');
        const sibB = nodes.find(n => n.individual && n.individual.id === '@I8@');
        const sibC = nodes.find(n => n.individual && n.individual.id === '@I9@');

        expect(sibA, 'SibA should be in tree').toBeDefined();
        expect(sibB, 'SibB should be in tree').toBeDefined();
        expect(sibC, 'SibC should be in tree').toBeDefined();

        // Although SibA/B/C are initially eligible for stacking (no spouses, max_stack_size=3),
        // AncSib's inlaw subtree fills the ancestor-generation sub-levels, making the stacked
        // column as wide as the unstacked row. The release trial is accepted and none are stacked.
        expect(sibA.stacked, 'SibA should not be stacked').toBe(false);
        expect(sibB.stacked, 'SibB should not be stacked').toBe(false);
        expect(sibC.stacked, 'SibC should not be stacked').toBe(false);
    });
});
