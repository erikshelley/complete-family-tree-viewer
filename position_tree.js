window.box_width = 120;
window.box_height = 80;
window.h_spacing = 40;
window.v_spacing = 80;
window.padding = 80;
window.level_boundary_node_leaf = [];
window.level_boundary_node_ancestor = [];
window.level_heights = [];


function positionTree(node, rows = []) {
    if (!node || node.is_positioned) return rows;

    node.level = node.anchor_generation;
    if (!node.sub_level) node.sub_level = node.anchor_generation - node.generation;

    if (!rows[node.level]) {
        rows[node.level] = [];
        window.level_boundary_node_ancestor[node.level] = null;
        window.level_boundary_node_leaf[node.level] = null;
        window.level_heights[node.level] = 0;
    }
    if (!rows[node.level][node.sub_level]) rows[node.level][node.sub_level] = [];

    if ((node.type === 'root') || (node.individual.gender === 'M' && node.type === 'ancestor')) positionMaleAncestor(node, rows);
    if ((node.type === 'relative') || (node.individual.gender === 'F' && node.type === 'ancestor')) positionRelative(node, rows);
    if (node.type == 'inlaw') positionInlaw(node, rows);

    return rows;
}


function positionMaleAncestor(node, rows) {
    positionTree(node.father_node, rows);
    positionTree(node.mother_node, rows);

    if ((node.type === 'ancestor') || (node.type === 'root' && !node.father_node && !node.mother_node)) {
        let [spouse_min_x, spouse_max_x] = positionSpouses(node, rows, 'root');
        let [child_min_x, child_max_x] = positionChildren(node, rows, false);
        positionNode(node, rows);
        if (node.type == 'root') centerPersonAboveSpouses(node);

        // Male ancestor needs to be to the right of his siblings and their descendants
        if (node.father_node) {
            let sib_max_x = -Infinity;
            node.father_node.children_nodes.forEach(sibling_node => { sib_max_x = Math.max(sib_max_x, sibling_node.max_x); });
            let shift_x = sib_max_x - (node.x + window.box_width - window.h_spacing);
            if (shift_x > 0) {
                node.x += shift_x;
                node.min_x += shift_x;
                node.max_x += shift_x;
                node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
            }
        }

        // Male ancestor needs to be to the right of his inlaws and their descendants
        if ((node.spouse_nodes.length > 0) && (node.type != 'root')) {
            let shift_x = spouse_max_x - (node.x + window.box_width - window.h_spacing);
            if (shift_x > 0) {
                node.x += shift_x;
                node.min_x += shift_x;
                node.max_x += shift_x;
            }
        }

        // Center children under ancestor if there is no pedigree child (ie. these are the parents of root)
        if (node.children_nodes.length > 0 && !node.individual.pedigree_child_node) {
            let shift_x = node.x + window.box_width + window.h_spacing / 2 - getChildCenter(node);
            if (shift_x > 0) { // Move the children to the right
                node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); });
                child_min_x += shift_x;
                child_max_x += shift_x;
            }
            if (shift_x < 0) { // Move the parent to the right
                node.x -= shift_x;
                node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, -shift_x); });
                shiftSiblings(node, -shift_x);
            }
        }

        node.min_x = Math.min(node.x, child_min_x);
        node.max_x = Math.max(node.x + window.box_width, child_max_x);

        // Male ancestors need to be to the right of the level boundary's max_x
        if ((node.type != 'root') && window.level_boundary_node_leaf[node.level] && (window.level_boundary_node_leaf[node.level] != node)) {
            const boundary_node = window.level_boundary_node_leaf[node.level];
            let max_x = boundary_node.x + window.box_width + window.h_spacing;
            let shift_x = max_x - (node.x + window.box_width + window.h_spacing / 2);
            if (shift_x > 0) {
                node.x += shift_x;
                node.min_x += shift_x;
                node.max_x += shift_x;
                node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
            }
        }
    }
}


function positionRelative(node, rows) {
    positionNode(node, rows);
    node.min_x = Infinity;
    node.max_x = -Infinity;

    // Keep track of this female ancestor as the boundary of her level so that later nodes do not cross the line down to her children
    if (node.type === 'ancestor') window.level_boundary_node_ancestor[node.level] = node;

    if (node.spouse_nodes.length == 0) {
        node.min_x = node.x;
        node.max_x = node.x + window.box_width;
    }
    
    // Position spouses
    let [spouse_min_x, spouse_max_x] = positionSpouses(node, rows, 'relative');
    node.min_x = Math.min(node.min_x, spouse_min_x);
    node.max_x = Math.max(node.max_x, spouse_max_x);

    if (node.type == 'relative') centerPersonAboveSpouses(node);

    if (node.type === 'ancestor') {
        positionTree(node.father_node, rows);
        positionTree(node.mother_node, rows);

        // Center female ancestor and her husband under their parents
        const pedigree_spouse_node = node.pedigree_spouse_node;
        let min_x = node.x - window.h_spacing / 2;
        let max_x = min_x;
        if (pedigree_spouse_node && !pedigree_spouse_node.duplicate_parents) {
            if (pedigree_spouse_node.father_node && pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.mother_node.x - window.h_spacing / 2;
            if (pedigree_spouse_node.father_node && !pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.father_node.x + window.box_width / 2;
            if (!pedigree_spouse_node.father_node && pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.mother_node.x + window.box_width / 2;
        }
        if (!node.duplicate_parents) {
            if (node.father_node && node.mother_node) max_x = node.mother_node.x - window.h_spacing / 2;
            if (node.father_node && !node.mother_node) max_x = node.father_node.x + window.box_width / 2;
            if (!node.father_node && node.mother_node) max_x = node.mother_node.x + window.box_width / 2;
        }

        if (!pedigree_spouse_node || (!pedigree_spouse_node.father_node && !pedigree_spouse_node.mother_node)) min_x = max_x;
        if (!node.father_node && !node.mother_node) max_x = min_x;

        let shift_x = (min_x + max_x) / 2 - (node.x - window.h_spacing / 2);

        // Move couple to the right
        if (shift_x > 0) {
            shiftSubtree(pedigree_spouse_node, shift_x);
            if (!pedigree_spouse_node.duplicate_parents) shiftSiblings(pedigree_spouse_node, shift_x);
            shiftSubtree(node, shift_x);
            if (!node.duplicate_parents) shiftSiblings(node, shift_x);
        }
        
        // Move their parents to the right
        if (shift_x < 0) {
            if (!pedigree_spouse_node.duplicate_parents && !node.duplicate_parents) {
                if (pedigree_spouse_node.father_node) {
                    shiftSupertree(pedigree_spouse_node.father_node, -shift_x);
                    shiftSiblings(pedigree_spouse_node, shift_x);
                }
                if (pedigree_spouse_node.mother_node) shiftSupertree(pedigree_spouse_node.mother_node, -shift_x);
                if (node.father_node) {
                    shiftSupertree(node.father_node, -shift_x);
                    shiftSiblings(node, shift_x);
                }
                if (node.mother_node) shiftSupertree(node.mother_node, -shift_x);
            }
        }
    }
}


function positionInlaw(node, rows) {
    positionNode(node, rows);
    node.min_x = Infinity, node.max_x = -Infinity;
    if (node.children_nodes.length == 0) {
        node.min_x = node.x;
        node.max_x = node.x + window.box_width;
    }
    let [child_min_x, child_max_x] = positionChildren(node, rows, true);
    node.min_x = Math.min(node.min_x, child_min_x);
    node.max_x = Math.max(node.max_x, child_max_x);

    // Center inlaw over their children
    if (node.children_nodes.length > 0) {
        let shift_x = node.x + window.box_width / 2 - getChildCenter(node);
        if (shift_x > 0) {
            node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); });
            node.min_x += shift_x;
            node.max_x += shift_x;
        }
        if (shift_x < 0) node.x -= shift_x;
    }
}


function centerPersonAboveSpouses(node) {
    let shift_x = node.x + window.box_width / 2 - getSpouseCenter(node);
    if (shift_x > 0) {
        node.spouse_nodes.forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
        node.min_x += shift_x;
        node.max_x += shift_x;
    }
    if (shift_x < 0) node.x -= shift_x;
}


function getSpouseCenter(node) {
    let min_x = Infinity, max_x = -Infinity;
    node.spouse_nodes.forEach(spouse_node => {
        min_x = Math.min(min_x, spouse_node.x);
        max_x = Math.max(max_x, spouse_node.x + window.box_width);
    });
    return (min_x + max_x) / 2;
}


function getChildCenter(node) {
    let min_x = Infinity, max_x = -Infinity;
    node.children_nodes.forEach(child_node => {
        min_x = Math.min(min_x, child_node.x);
        max_x = Math.max(max_x, child_node.x + window.box_width);
    });
    return (min_x + max_x) / 2;
}


function positionSpouses(node, rows, type_to_drop) {
    let spouse_min_x = Infinity, spouse_max_x = -Infinity;
    node.spouse_nodes.forEach(spouse_node => { 
        if (node.type === type_to_drop) spouse_node.sub_level = node.sub_level + 1;
        positionTree(spouse_node, rows); 
        spouse_min_x = Math.min(spouse_min_x, spouse_node.min_x);
        spouse_max_x = Math.max(spouse_max_x, spouse_node.max_x);
    });
    return [spouse_min_x, spouse_max_x];
}


function positionChildren(node, rows, drop_sub_level) {
    let child_min_x = Infinity, child_max_x = -Infinity;
    node.children_nodes.forEach(child_node => { 
        if (drop_sub_level) child_node.sub_level = node.sub_level + 1;
        positionTree(child_node, rows); 
        child_min_x = Math.min(child_min_x, child_node.min_x);
        child_max_x = Math.max(child_max_x, child_node.max_x);
    });
    return [child_min_x, child_max_x];
}


function shiftSubtree(node, shift_x) {
    if (!node) return;
    node.x += shift_x;
    node.min_x += shift_x;
    node.max_x += shift_x;
    if (node.spouse_nodes) node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x) });
    const shift_children = node.children_nodes && (node.type != 'ancestor' || !node.individual.pedigree_child_node);
    if (shift_children) node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x) });
    // Use this node as a boundary for future male ancestors
    if (!window.level_boundary_node_leaf[node.level] || (node.x >= window.level_boundary_node_leaf[node.level].x)) window.level_boundary_node_leaf[node.level] = node;
}


function shiftSupertree(node, shift_x) {
    if (!node) return;
    node.x += shift_x;
    node.min_x += shift_x;
    node.max_x += shift_x;
    if (!node.duplicate_parents) {
        if (node.father_node) shiftSupertree(node.father_node, shift_x);
        if (node.mother_node) shiftSupertree(node.mother_node, shift_x);
    }
    node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); })
    node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
}


function shiftSiblings(node, shift_x) {
    const parent_node = node.father_node ? node.father_node : node.parent_node;
    if (!node || !parent_node) return;
    parent_node.children_nodes.filter(child_node => child_node != node).forEach(sibling_node => { shiftSubtree(sibling_node, shift_x); });
}


function positionNode(node, rows) {
    const length = rows[node.level][node.sub_level].length;
    // Start at the left most position of the level or to the right of the last node in this sub-level
    if (length === 0) node.x = window.padding;
    else node.x = rows[node.level][node.sub_level][length - 1].x + window.box_width + window.h_spacing;

    if (window.level_boundary_node_ancestor[node.level]) {
        // Do not cross the vertical line below a female ancestor
        node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level].x + window.h_spacing);
        // Do not intersect with the horizontal line from a female to her parents (applies to siblings to the left of male ancestors)
        if (window.level_boundary_node_ancestor[node.level + 1] && (node.sub_level == 0) && (node.type == 'relative')) {
            if (node.parent_node && (node.parent_node.individual.pedigree_child_node) && (node.parent_node.individual.pedigree_child_node.individual.gender === 'M')) {
                node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level + 1].x + window.h_spacing);
            }
        }
        // Use this node as a boundary for future male ancestors
        if (!window.level_boundary_node_leaf[node.level] || (node.x >= window.level_boundary_node_leaf[node.level].x)) window.level_boundary_node_leaf[node.level] = node;
    }
    window.level_heights[node.level] = Math.max(window.level_heights[node.level], node.sub_level + 1);
    node.is_positioned = true;
    rows[node.level][node.sub_level].push(node);
}


function getMaximumDimensions(rows) {
    let max_x = -Infinity;
    let max_y = -Infinity;
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                max_x = Math.max(max_x, node.x + window.box_width + window.padding);
                max_y = Math.max(max_y, node.y + window.box_height + window.padding);
            });
        });
    });
    return [max_x, max_y];
}


function setHeights(rows) {
    let total_height = window.padding * 2;
    window.level_heights.forEach(height => { total_height += height * (window.box_height + window.v_spacing) + window.v_spacing; });
    let y = total_height - window.box_height - window.v_spacing - window.padding; // Start from the bottom of the tree
    rows.forEach((level, index) => {
        y -= window.level_heights[index] * (window.box_height + window.v_spacing) + window.v_spacing;
        let sub_y = y;
        level.forEach(sub_level => {
            if (sub_level.length > 0) sub_y += window.box_height + window.v_spacing;
            sub_level.forEach(node => { node.y = sub_y; });
        });
    });
}

