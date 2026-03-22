window.level_boundary_node_leaf = [];
window.level_boundary_node_ancestor = [];
window.level_heights = [];
window.max_gen_up = 0;
window.max_gen_down = 0;
window.max_stack_size = 1;
window.max_stack_actual = 1;
window.auto_box_width = 0;
window.auto_box_height = 0;
window.tree_padding = 160;

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
        // If inlaws are to the left and the person is root, position the person first
        if (!window.vertical_inlaws && (node.type === 'root')) positionNode(node, rows);

        // Position spouses
        let [spouse_min_x, spouse_max_x] = window.vertical_inlaws ? positionSpouses(node, rows, 'root') : positionSpouses(node, rows, 'inlaw');

        // If inlaws are to the left and the person is root, make sure they are next to their spouse
        if (!window.vertical_inlaws && (node.type === 'root')) shiftPersonNextToSpouse(node);

        // Position children
        let [child_min_x, child_max_x] = positionChildren(node, rows, false);
        
        // Position the ancestor
        if (window.vertical_inlaws || (node.type === 'ancestor')) positionNode(node, rows);
        
        // If there is a gap between the inlaws and the ancestor, close the gap
        if (node.spouse_nodes.length > 0) {
            let shift_x = node.x - (spouse_max_x + window.h_spacing);
            if (shift_x > 0) {
                node.spouse_nodes.forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                shiftSiblings(node, shift_x);
            }
        }

        if ((node.type == 'root') && window.vertical_inlaws) centerPersonAboveSpouses(node);

        // Male ancestor needs to be to the right of his siblings and their descendants
        if (node.father_node) {
            let sib_max_x = -Infinity;
            node.father_node.children_nodes.forEach(sibling_node => { sib_max_x = Math.max(sib_max_x, sibling_node.max_x); });
            let shift_x = sib_max_x - (node.x + window.box_width - window.h_spacing);
            if (shift_x > 0) {
                node.x += shift_x;
                //node.min_x += shift_x;  // DEBUG
                //node.max_x += shift_x;  // DEBUG
                node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
            }
        }

        // Male ancestor needs to be to the right of his inlaws and their descendants
        if ((node.spouse_nodes.length > 0) && (node.type != 'root')) {
            let shift_x = spouse_max_x - (node.x + window.box_width - window.h_spacing);
            if (shift_x > 0) {
                node.x += shift_x;
                //node.min_x += shift_x; // DEBUG
                //node.max_x += shift_x; // DEBUG
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
            let shift_x = max_x - (node.x + window.box_width);
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
    node.min_x = Infinity;
    node.max_x = -Infinity;

    // If inlaw is to the left of the relative, position the inlaw first
    if (!window.vertical_inlaws && (node.individual.gender === 'F') && (node.type === 'relative')) {
        // Position spouses
        let [spouse_min_x, spouse_max_x] = positionSpouses(node, rows, 'inlaw');
        positionNode(node, rows);
        node.min_x = Math.min(node.x, spouse_min_x);
        node.max_x = Math.max(node.x + window.box_width, spouse_max_x);
    }
    else positionNode(node, rows);

    // Keep track of this female ancestor as the boundary of her level so that later nodes do not cross the line down to her children
    if (node.type === 'ancestor') window.level_boundary_node_ancestor[node.level] = node;

    if (node.stacked || (node.spouse_nodes.length == 0)) {
        node.min_x = node.x;
        node.max_x = node.x + window.box_width;
    }
    
    // Position spouses
    if (window.vertical_inlaws || (node.individual.gender === 'M') || (node.type === 'ancestor')) {
        let [spouse_min_x, spouse_max_x] = window.vertical_inlaws ? positionSpouses(node, rows, 'relative') : positionSpouses(node, rows, 'inlaw');
        node.min_x = Math.min(node.min_x, spouse_min_x);
        node.max_x = Math.max(node.max_x, spouse_max_x);
    }

    if (node.type == 'relative') {
        if (window.vertical_inlaws) centerPersonAboveSpouses(node);
        else shiftPersonNextToSpouse(node);
    }

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
        else max_x = min_x + window.box_width / 2 - window.h_spacing / 2;

        if (!pedigree_spouse_node || (!pedigree_spouse_node.father_node && !pedigree_spouse_node.mother_node)) min_x = max_x;
        if (!node.father_node && !node.mother_node) max_x = min_x + window.box_width / 2 - window.h_spacing / 2;

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
            if (pedigree_spouse_node.father_node && !pedigree_spouse_node.duplicate_parents) {
                shiftSuperTree(pedigree_spouse_node.father_node, -shift_x);
                shiftSiblings(pedigree_spouse_node, shift_x); // undo shift caused by shiftSuperTree
            }
            if (pedigree_spouse_node.mother_node && !pedigree_spouse_node.duplicate_parents) shiftSuperTree(pedigree_spouse_node.mother_node, -shift_x);
            if (node.father_node && !node.duplicate_parents) {
                shiftSuperTree(node.father_node, -shift_x);
                shiftSiblings(node, shift_x); // undo shift caused by shiftSuperTree
            }
            if (node.mother_node && !node.duplicate_parents) shiftSuperTree(node.mother_node, -shift_x);
        }
    }
}


function positionInlaw(node, rows) {
    positionNode(node, rows);
    node.min_x = Infinity, node.max_x = -Infinity;
    if (node.stacked || (node.children_nodes.length == 0) || !window.vertical_inlaws) {
        node.min_x = node.x;
        node.max_x = node.x + window.box_width;
    }
    let [child_min_x, child_max_x] = positionChildren(node, rows, true);
    node.min_x = Math.min(node.min_x, child_min_x);
    node.max_x = Math.max(node.max_x, child_max_x);

    let left = -window.box_width / 2 - window.h_spacing / 2;
    let right = window.box_width / 2 + window.h_spacing / 2;
    let x_offset = (node.individual.gender === 'M') ? right : left;
    if (node.spouse_nodes[0].type === 'ancestor') x_offset = (x_offset === right) ? left : right;

    // Center inlaw over their children
    if (node.children_nodes.length > 0) {
        let shift_x = node.x + window.box_width / 2 - getChildCenter(node) + (window.vertical_inlaws ? 0 : x_offset);
        if (shift_x > 0) {
            // DEBUG
            let child_max_x = -Infinity;
            node.children_nodes.forEach(child_node => { 
                shiftSubtree(child_node, shift_x); 
                child_max_x = Math.max(child_max_x, child_node.max_x);
            });
            if (node.min_x < node.x) node.min_x = Math.min(node.min_x + shift_x, node.x);
            node.max_x = Math.max(node.max_x, child_max_x);
            // node.min_x += shift_x; // DEBUG
            // node.max_x += shift_x; // DEBUG
        }
        if (shift_x < 0) {
            node.x -= shift_x;
            node.max_x = Math.max(node.max_x, node.x + window.box_width);
        }
    }
}


function shiftPersonNextToSpouse(node) {
    if (node.spouse_nodes.length == 0) return;
    let previous_x = Infinity;
    if (node.individual.gender === 'M') {
        node.spouse_nodes.reverse().forEach(spouse_node => {
            if ((previous_x != Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x - window.box_width - window.h_spacing;
            previous_x = spouse_node.x;
        });
        node.x = previous_x - window.box_width - window.h_spacing;
    }
    else {
        node.spouse_nodes.forEach(spouse_node => {
            if ((previous_x != Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x + window.box_width + window.h_spacing;
            previous_x = spouse_node.x;
        });
        node.x = previous_x + window.box_width + window.h_spacing;
        // DEBUG
        previous_x = Infinity;
        node.spouse_nodes.reverse().forEach(spouse_node => {
            if ((previous_x != Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x - window.box_width - window.h_spacing;
            previous_x = spouse_node.x;
        });
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


function hasGrandChildren(node) {
    let result = false;
    if (['inlaw', 'ancestor'].includes(node.type)) {
        node.children_nodes.forEach(child_node => { 
            if (child_node.spouse_nodes && child_node.spouse_nodes.length > 0) result = true;
        });
    }
    if (['root', 'relative'].includes(node.type)) {
        node.spouse_nodes.forEach(spouse_node => {
            if (spouse_node.children_nodes && spouse_node.children_nodes.length > 0) result = true;
        });
    }
    return result;
}


function positionSpouses(node, rows, type_to_drop) {
    let spouse_min_x = Infinity, spouse_max_x = -Infinity;
    let stacks = [];
    let stack_sub_level = node.sub_level + (node.type === type_to_drop ? 1 : 0);
    const has_grandchildren = hasGrandChildren(node);

    if ((node.type != 'ancestor') && window.vertical_inlaws) {
        node.spouse_nodes.filter(spouse_node => (window.max_stack_size > 1) && (!has_grandchildren || (spouse_node.children_nodes.length === 0))).forEach(spouse_node => { 
            [spouse_min_x, spouse_max_x, stacks, stack_sub_level] 
                = positionSpouse(node, spouse_node, rows, has_grandchildren, type_to_drop, stack_sub_level, stacks, spouse_min_x, spouse_max_x);
        });

        // If stacks aren't aligned, align them
        stacks.forEach(stack => {
            let max_x = stack.filter(spouse_node => stack.includes(spouse_node)).map(spouse_node => spouse_node.x).reduce((a, b) => Math.max(a, b), -Infinity);
            stack.filter(spouse_node => spouse_node.stacked).forEach(spouse_node => {
                spouse_node.x = max_x;
                if (spouse_node.left_neighbor && (spouse_node.left_neighbor.x + window.box_width + window.h_spacing) > spouse_node.x) {
                    let extra_x = spouse_node.left_neighbor.x + window.box_width + window.h_spacing - spouse_node.x;
                    spouse_node.x += extra_x;
                    max_x += extra_x;
                }
                spouse_node.min_x = spouse_node.x;
                spouse_node.max_x = spouse_node.x + window.box_width;
            });
        });
    }

    node.spouse_nodes.filter(spouse_node => !window.vertical_inlaws || (window.max_stack_size === 1) || (node.type === 'ancestor') || (spouse_node.children_nodes.length > 0)).forEach(spouse_node => { 
        [spouse_min_x, spouse_max_x, stacks, stack_sub_level] 
            = positionSpouse(node, spouse_node, rows, has_grandchildren, type_to_drop, stack_sub_level, stacks, spouse_min_x, spouse_max_x);
    });

    return [spouse_min_x, spouse_max_x];
}


// drop_sub_level will be true for inlaws so that their children are positioned one sub-level lower than the inlaw
function positionChildren(node, rows, drop_sub_level) {
    let child_min_x = Infinity, child_max_x = -Infinity;
    let stacks = [];
    let stack_sub_level = node.sub_level + (drop_sub_level ? 1 : 0);
    const has_grandchildren = hasGrandChildren(node);

    // If node is a parent of root and root would be in a stack, make sure they are the top of the stack
    if ((node.type === 'ancestor') && (window.max_stack_size > 1) && (node.children_nodes.length > 0) && !node.individual.pedigree_child_node) {
        const root_node = node.children_nodes.find(child_node => child_node.individual.is_root);
        if (!has_grandchildren || (root_node.spouse_nodes.length === 0)) {
            // Make root the first child in children_nodes so that it is positioned first and becomes the top of the stack
            const root_index = node.children_nodes.indexOf(root_node);
            if (root_index > 0) {
                node.children_nodes.splice(root_index, 1);
                node.children_nodes.unshift(root_node);
            }
        }
    }

    // Position stacked children
    node.children_nodes.filter(child_node => (window.max_stack_size > 1) && (!has_grandchildren || (child_node.spouse_nodes.length === 0))).forEach(child_node => { 
        [child_min_x, child_max_x, stacks, stack_sub_level] 
            = positionChild(node, child_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, child_min_x, child_max_x);
    });

    // If stacks aren't aligned, align them
    stacks.forEach(stack => {
        let max_x = stack.filter(child_node => stack.includes(child_node)).map(child_node => child_node.x).reduce((a, b) => Math.max(a, b), -Infinity);
        stack.filter(child_node => child_node.stacked).forEach(child_node => {
            child_node.x = max_x;
            if (child_node.left_neighbor && (child_node.left_neighbor.x + window.box_width + window.h_spacing) > child_node.x) {
                let extra_x = child_node.left_neighbor.x + window.box_width + window.h_spacing - child_node.x;
                child_node.x += extra_x;
                max_x += extra_x;
            }
            child_node.min_x = child_node.x;
            child_node.max_x = child_node.x + window.box_width;
        });
    });

    // Position unstacked children
    node.children_nodes.filter(child_node => (window.max_stack_size === 1) || (child_node.spouse_nodes.length > 0)).forEach(child_node => { 
        [child_min_x, child_max_x, stacks, stack_sub_level] 
            = positionChild(node, child_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, child_min_x, child_max_x);
    });

    return [child_min_x, child_max_x];
}


function positionSpouse(node, spouse_node, rows, has_grandchildren, type_to_drop, stack_sub_level, stacks, spouse_min_x, spouse_max_x) {
    if (window.vertical_inlaws && (node.type != 'ancestor') && (window.max_stack_size > 1) && (!has_grandchildren || (spouse_node.children_nodes.length === 0))) {
        let min_stack_level = node.sub_level + (node.type === type_to_drop ? 1 : 0);
        let max_stack_level = min_stack_level + window.max_stack_size;
        if (stack_sub_level === min_stack_level) {
            spouse_node.stack_top = true;
            stacks.push([spouse_node]);
        }
        else stacks[stacks.length - 1].push(spouse_node);
        window.max_stack_actual = Math.max(window.max_stack_actual, stacks[stacks.length - 1].length);
        spouse_node.stacked = true;
        spouse_node.sub_level = stack_sub_level;
        stack_sub_level += 1;
        if (stack_sub_level === max_stack_level) stack_sub_level = min_stack_level;
    }
    else {
        if (node.type === type_to_drop) spouse_node.sub_level = node.sub_level + 1;
    }
    positionTree(spouse_node, rows); 
    spouse_min_x = Math.min(spouse_min_x, spouse_node.min_x);
    spouse_max_x = Math.max(spouse_max_x, spouse_node.max_x);
    return [spouse_min_x, spouse_max_x, stacks, stack_sub_level];
}


function positionChild(node, child_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, child_min_x, child_max_x) {
    if ((window.max_stack_size > 1) && (!has_grandchildren || (child_node.spouse_nodes.length === 0))) {
        let min_stack_level = node.sub_level + (drop_sub_level ? 1 : 0);
        let max_stack_level = min_stack_level + window.max_stack_size;
        if (stack_sub_level === min_stack_level) {
            child_node.stack_top = true;
            stacks.push([child_node]);
        }
        else stacks[stacks.length - 1].push(child_node);
        window.max_stack_actual = Math.max(window.max_stack_actual, stacks[stacks.length - 1].length);
        child_node.stacked = true;
        child_node.sub_level = stack_sub_level;
        stack_sub_level += 1;
        if (stack_sub_level === max_stack_level) stack_sub_level = min_stack_level;
    }
    else {
        if (drop_sub_level) child_node.sub_level = node.sub_level + 1;
    }
    positionTree(child_node, rows); 
    child_min_x = Math.min(child_min_x, child_node.min_x);
    child_max_x = Math.max(child_max_x, child_node.max_x);
    return [child_min_x, child_max_x, stacks, stack_sub_level];
}


function positionNode(node, rows) {
    const length = rows[node.level][node.sub_level].length;
    // Start at the left most position of the level or to the right of the last node in this sub-level
    if (length === 0) node.x = window.tree_padding;
    else {
        node.x = rows[node.level][node.sub_level][length - 1].x + window.box_width + window.h_spacing;
        node.left_neighbor = rows[node.level][node.sub_level][length - 1];
    }

    if (window.level_boundary_node_ancestor[node.level]) {
        // Do not cross the vertical line below a female ancestor
        node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level].x + window.h_spacing);
        // Do not intersect with the horizontal line from a female to her parents (applies to siblings to the left of male ancestors)
        if (window.level_boundary_node_ancestor[node.level + 1] && (node.sub_level == 0) && (node.type == 'relative')) {
            if (node.parent_node && (node.parent_node.individual.pedigree_child_node) && (node.parent_node.individual.pedigree_child_node.individual.gender === 'M')) {
                node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level + 1].x + window.h_spacing);
            }
        }
        // Do not intersect with the horizontal line from a female to her children (applies to lines under male ancestors)
        if (window.level_boundary_node_ancestor[node.level] && (node.type === 'ancestor') && (node.individual.gender === 'M')) {
            if (node.individual.pedigree_child_node && node.individual.pedigree_child_node.individual.gender === 'M') {
                // Calculate max x for children of boundary node ancestor's pedigree spouse (if exists) and shift if intersecting
                const pedigree_spouse_node = window.level_boundary_node_ancestor[node.level].pedigree_spouse_node;
                if (pedigree_spouse_node) {
                    let spouse_children_max_x = -Infinity;
                    pedigree_spouse_node.children_nodes.forEach(child_node => { spouse_children_max_x = Math.max(spouse_children_max_x, child_node.x); });
                    node.x = Math.max(node.x, spouse_children_max_x); // DEBUG
                    // let shift_x = Math.max(node.x, spouse_children_max_x) - node.x;
                    // if (shift_x > 0) {
                        // node.x += shift_x;
                        // node.min_x += shift_x;
                        // node.max_x += shift_x;
                        // node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                        // shiftSiblings(node, shift_x);
                    // }
                }
            }
        }
        // Use this node as a boundary for future male ancestors
        if (node.type != 'ancestor') {
            if (!window.level_boundary_node_leaf[node.level] || (node.x >= window.level_boundary_node_leaf[node.level].x)) 
                window.level_boundary_node_leaf[node.level] = node;
        }
    }
    window.level_heights[node.level] = Math.max(window.level_heights[node.level], node.sub_level + 1);
    node.is_positioned = true;
    rows[node.level][node.sub_level].push(node);
    //node.min_x = node.x;
    //node.max_x = node.x + window.box_width;
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


function shiftSuperTree(node, shift_x) {
    if (!node) return;
    node.x += shift_x;
    node.min_x += shift_x;
    node.max_x += shift_x;
    if (!node.duplicate_parents) {
        if (node.father_node) shiftSuperTree(node.father_node, shift_x);
        if (node.mother_node) shiftSuperTree(node.mother_node, shift_x);
    }
    node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); })
    node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
}


function shiftSiblings(node, shift_x) {
    const parent_node = node.father_node ? node.father_node : node.parent_node;
    if (!node || !parent_node) return;
    parent_node.children_nodes.filter(child_node => child_node != node).forEach(sibling_node => { shiftSubtree(sibling_node, shift_x); });
}


function getMaximumDimensions(rows) {
    let max_x = -Infinity;
    let max_y = -Infinity;
    let node_count = 0;
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                max_x = Math.max(max_x, node.x + window.box_width + window.tree_padding);
                max_y = Math.max(max_y, node.y + window.box_height + window.tree_padding);
                node_count += 1;
            });
        });
    });
    return [max_x, max_y, node_count.toLocaleString()];
}


function setHeights(rows) {
    let total_height = window.tree_padding * 2;
    window.level_heights.forEach(height => { total_height += height * (window.box_height + window.v_spacing) + window.level_spacing; });
    let y = total_height - window.box_height - window.v_spacing - window.tree_padding; // Start from the bottom of the tree
    rows.forEach((level, index) => {
        y -= window.level_heights[index] * (window.box_height + window.v_spacing) + window.level_spacing;
        let sub_y = y;
        level.forEach(sub_level => {
            if (sub_level.length > 0) sub_y += window.box_height + window.v_spacing;
            sub_level.forEach(node => { node.y = sub_y; });
        });
    });
}


function verifyMaxXForAllNodes(rows) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                verifyMaxX(node);
            });
        });
    });
}

// Verify max_x values for all nodes equal the maximum x position of their subtree
function verifyMaxX(individual_node) {
    if (!individual_node) return -Infinity;
    if (individual_node.verified) return individual_node.max_x;
    let calculated_max_x = -Infinity;
    const related = ['root', 'relative', 'ancestor'].includes(individual_node.type);
    if (related && individual_node.spouse_nodes) {
        individual_node.spouse_nodes.forEach(spouse_node => {
            calculated_max_x = Math.max(calculated_max_x, verifyMaxX(spouse_node, false));
        });
    }
    if (individual_node.children_nodes) {
        individual_node.children_nodes.forEach(child_node => {
            calculated_max_x = Math.max(calculated_max_x, verifyMaxX(child_node));
        });
    }
    calculated_max_x = Math.max(calculated_max_x, individual_node.x + window.box_width);
    if (individual_node.max_x !== calculated_max_x) {
        console.log(`X ${individual_node.individual.name} self=${individual_node.x + window.box_width} rec=${individual_node.max_x} calc=${calculated_max_x}`);
    }
    else {
        console.log(`- ${individual_node.individual.name} self=${individual_node.x + window.box_width} rec=${individual_node.max_x} calc=${calculated_max_x}`);
    }
    individual_node.verified = true;
    return calculated_max_x;
}