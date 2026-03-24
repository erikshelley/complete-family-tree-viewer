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
window.positioning_log_level = 'none'; // 'none' | 'moves' | 'debug'
window.debug_positioning = false;


function getPositioningLogLevel() {
    if (window.positioning_log_level) return window.positioning_log_level;
    return window.debug_positioning ? 'debug' : 'none';
}


function logPositioning(message, data = null) {
    const level = getPositioningLogLevel();
    if (level === 'none') return;
    if ((level === 'moves') && (message !== 'balancing-node-moved')) return;

    if ((level === 'moves') && (message === 'balancing-node-moved')) {
        const move_summary = data ? {
            name: data.name,
            shift_x: (data.shift_x !== undefined) ? data.shift_x : data.allowed_shift,
        } : null;
        if (move_summary) console.log(`[position] ${message}`, move_summary);
        else console.log(`[position] ${message}`);
        return;
    }

    if (data) console.log(`[position] ${message}`, data);
    else console.log(`[position] ${message}`);
}

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
    if (node.type === 'inlaw') positionInlaw(node, rows);

    return rows;
}


function positionMaleAncestor(node, rows) {
    positionTree(node.father_node, rows);
    positionTree(node.mother_node, rows);

    if ((node.type === 'ancestor') || (node.type === 'root' && !node.father_node && !node.mother_node)) {
        // If inlaws are to the left and the person is root, position the person first
        if (!window.vertical_inlaws && (node.type === 'root')) positionNode(node, rows);

        // Position spouses
        let [, spouse_max_x] = window.vertical_inlaws ? positionSpouses(node, rows, 'root') : positionSpouses(node, rows, 'inlaw');

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

        if ((node.type === 'root') && window.vertical_inlaws) centerPersonAboveSpouses(node);

        // Male ancestor needs to be to the right of his siblings and their descendants
        if (node.father_node) {
            let sib_max_x = -Infinity;
            node.father_node.children_nodes.forEach(sibling_node => { sib_max_x = Math.max(sib_max_x, sibling_node.max_x); });
            let shift_x = sib_max_x - (node.x + window.box_width - window.h_spacing);
            if (shift_x > 0) {
                logPositioning('male-ancestor sibling-boundary shift', {
                    name: node.individual.name,
                    shift_x,
                    before_x: node.x,
                    h_spacing: window.h_spacing,
                    box_width: window.box_width,
                    sib_max_x,
                });
                node.x += shift_x;
                node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                logPositioning('male-ancestor sibling-boundary shift applied', {
                    name: node.individual.name,
                    after_x: node.x,
                });
            }
        }

        // Male ancestor needs to be to the right of his inlaws and their descendants
        if ((node.spouse_nodes.length > 0) && (node.type !== 'root')) {
            let shift_x = spouse_max_x - (node.x + window.box_width - window.h_spacing);
            if (shift_x > 0) {
                logPositioning('male-ancestor inlaw-boundary shift', {
                    name: node.individual.name,
                    shift_x,
                    before_x: node.x,
                    h_spacing: window.h_spacing,
                    spouse_max_x,
                });
                node.x += shift_x;
                logPositioning('male-ancestor inlaw-boundary shift applied', {
                    name: node.individual.name,
                    after_x: node.x,
                });
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
        if ((node.type !== 'root') && window.level_boundary_node_leaf[node.level] && (window.level_boundary_node_leaf[node.level] !== node)) {
            const boundary_node = window.level_boundary_node_leaf[node.level];
            let max_x = boundary_node.x + window.box_width + window.h_spacing;
            let shift_x = max_x - (node.x + window.box_width);
            if (shift_x > 0) {
                logPositioning('male-ancestor leaf-boundary shift', {
                    name: node.individual.name,
                    shift_x,
                    before_x: node.x,
                    boundary_name: boundary_node.individual ? boundary_node.individual.name : 'unknown',
                    boundary_x: boundary_node.x,
                    h_spacing: window.h_spacing,
                });
                node.x += shift_x;
                node.min_x += shift_x;
                node.max_x += shift_x;
                node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                logPositioning('male-ancestor leaf-boundary shift applied', {
                    name: node.individual.name,
                    after_x: node.x,
                });
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

    if (node.stacked || (node.spouse_nodes.length === 0)) {
        node.min_x = node.x;
        node.max_x = node.x + window.box_width;
    }
    
    // Position spouses
    if (window.vertical_inlaws || (node.individual.gender === 'M') || (node.type === 'ancestor')) {
        let [spouse_min_x, spouse_max_x] = window.vertical_inlaws ? positionSpouses(node, rows, 'relative') : positionSpouses(node, rows, 'inlaw');
        node.min_x = Math.min(node.min_x, spouse_min_x);
        node.max_x = Math.max(node.max_x, spouse_max_x);
    }

    if (node.type === 'relative') {
        if (window.vertical_inlaws) centerPersonAboveSpouses(node);
        else shiftPersonNextToSpouse(node);
    }

    if (node.type === 'ancestor') {
        positionTree(node.father_node, rows);
        positionTree(node.mother_node, rows);
        centerAncestorCouple(node);
    }
}


function centerAncestorCouple(node) {
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
    if (!node.father_node && !node.mother_node) max_x = min_x;

    let shift_x = (min_x + max_x) / 2 - (node.x - window.h_spacing / 2);
    logPositioning('center-ancestor-couple computed shift', {
        name: node.individual.name,
        spouse_name: pedigree_spouse_node ? pedigree_spouse_node.individual.name : 'none',
        shift_x,
        min_x,
        max_x,
        current_reference: node.x - window.h_spacing / 2,
        node_x: node.x,
        h_spacing: window.h_spacing,
        box_width: window.box_width,
        node_father_x: node.father_node ? node.father_node.x : null,
        node_mother_x: node.mother_node ? node.mother_node.x : null,
        spouse_father_x: (pedigree_spouse_node && pedigree_spouse_node.father_node) ? pedigree_spouse_node.father_node.x : null,
        spouse_mother_x: (pedigree_spouse_node && pedigree_spouse_node.mother_node) ? pedigree_spouse_node.mother_node.x : null,
    });

    // Move couple to the right
    if (shift_x > 0) {
        shiftSubtree(pedigree_spouse_node, shift_x);
        if (!pedigree_spouse_node.duplicate_parents) shiftSiblings(pedigree_spouse_node, shift_x);
        shiftSubtree(node, shift_x);
        if (!node.duplicate_parents) shiftSiblings(node, shift_x);
        logPositioning('center-ancestor-couple moved couple right', {
            name: node.individual.name,
            shift_x,
            node_x: node.x,
            spouse_x: pedigree_spouse_node ? pedigree_spouse_node.x : null,
        });
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
        logPositioning('center-ancestor-couple moved parents right', {
            name: node.individual.name,
            shift_x,
            node_x: node.x,
            spouse_x: pedigree_spouse_node ? pedigree_spouse_node.x : null,
            node_father_x: node.father_node ? node.father_node.x : null,
            node_mother_x: node.mother_node ? node.mother_node.x : null,
            spouse_father_x: (pedigree_spouse_node && pedigree_spouse_node.father_node) ? pedigree_spouse_node.father_node.x : null,
            spouse_mother_x: (pedigree_spouse_node && pedigree_spouse_node.mother_node) ? pedigree_spouse_node.mother_node.x : null,
        });
    }
}


function positionInlaw(node, rows) {
    positionNode(node, rows);
    node.min_x = Infinity, node.max_x = -Infinity;
    if (node.stacked || (node.children_nodes.length === 0) || !window.vertical_inlaws) {
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
            let child_max_x = -Infinity;
            node.children_nodes.forEach(child_node => { 
                shiftSubtree(child_node, shift_x); 
                child_max_x = Math.max(child_max_x, child_node.max_x);
            });
            if (node.min_x < node.x) node.min_x = Math.min(node.min_x + shift_x, node.x);
            node.max_x = Math.max(node.max_x, child_max_x);
        }
        if (shift_x < 0) {
            node.x -= shift_x;
            node.max_x = Math.max(node.max_x, node.x + window.box_width);
        }
    }
}


function shiftPersonNextToSpouse(node) {
    if (node.spouse_nodes.length === 0) return;
    let previous_x = Infinity;
    if (node.individual.gender === 'M') {
        node.spouse_nodes.reverse().forEach(spouse_node => {
            if ((previous_x !== Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x - window.box_width - window.h_spacing;
            previous_x = spouse_node.x;
        });
        node.x = previous_x - window.box_width - window.h_spacing;
    }
    else {
        node.spouse_nodes.forEach(spouse_node => {
            if ((previous_x !== Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x + window.box_width + window.h_spacing;
            previous_x = spouse_node.x;
        });
        node.x = previous_x + window.box_width + window.h_spacing;
        previous_x = Infinity;
        node.spouse_nodes.reverse().forEach(spouse_node => {
            if ((previous_x !== Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x - window.box_width - window.h_spacing;
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


function alignStacks(stacks) {
    stacks.forEach(stack => {
        let max_x = stack.map(n => n.x).reduce((a, b) => Math.max(a, b), -Infinity);
        stack.filter(n => n.stacked).forEach(n => {
            n.x = max_x;
            if (n.left_neighbor && (n.left_neighbor.x + window.box_width + window.h_spacing) > n.x) {
                let extra_x = n.left_neighbor.x + window.box_width + window.h_spacing - n.x;
                n.x += extra_x;
                max_x += extra_x;
            }
            n.min_x = n.x;
            n.max_x = n.x + window.box_width;
        });
    });
}


function positionStackableNode(parent_node, target_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, result_min_x, result_max_x, check_spouse_nodes = true) {
    const is_stackable = (window.max_stack_size > 1) && (!has_grandchildren || (target_node.children_nodes.length === 0 && (!check_spouse_nodes || target_node.spouse_nodes.length === 0)));
    if (is_stackable) {
        let min_stack_level = parent_node.sub_level + (drop_sub_level ? 1 : 0);
        let max_stack_level = min_stack_level + window.max_stack_size;
        if (stack_sub_level === min_stack_level) {
            target_node.stack_top = true;
            stacks.push([target_node]);
        }
        else stacks[stacks.length - 1].push(target_node);
        window.max_stack_actual = Math.max(window.max_stack_actual, stacks[stacks.length - 1].length);
        target_node.stacked = true;
        target_node.sub_level = stack_sub_level;
        stack_sub_level += 1;
        if (stack_sub_level === max_stack_level) stack_sub_level = min_stack_level;
    }
    else {
        if (drop_sub_level) target_node.sub_level = parent_node.sub_level + 1;
    }
    positionTree(target_node, rows);
    result_min_x = Math.min(result_min_x, target_node.min_x);
    result_max_x = Math.max(result_max_x, target_node.max_x);
    return [result_min_x, result_max_x, stacks, stack_sub_level];
}


function positionSpouses(node, rows, type_to_drop) {
    let spouse_min_x = Infinity, spouse_max_x = -Infinity;
    let stacks = [];
    let stack_sub_level = node.sub_level + (node.type === type_to_drop ? 1 : 0);
    const has_grandchildren = hasGrandChildren(node);
    const drop_sub_level = node.type === type_to_drop;

    if ((node.type !== 'ancestor') && window.vertical_inlaws) {
        node.spouse_nodes.filter(spouse_node => (window.max_stack_size > 1) && (!has_grandchildren || (spouse_node.children_nodes.length === 0))).forEach(spouse_node => { 
            [spouse_min_x, spouse_max_x, stacks, stack_sub_level] 
                = positionStackableNode(node, spouse_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, spouse_min_x, spouse_max_x, false);
        });
        alignStacks(stacks);
    }

    if (!window.vertical_inlaws) {
        node.spouse_nodes.forEach(spouse_node => {
            if (drop_sub_level) spouse_node.sub_level = node.sub_level + 1;
            positionTree(spouse_node, rows);
            spouse_min_x = Math.min(spouse_min_x, spouse_node.min_x);
            spouse_max_x = Math.max(spouse_max_x, spouse_node.max_x);
        });
    } else {
        node.spouse_nodes.filter(spouse_node => (window.max_stack_size === 1) || (node.type === 'ancestor') || (spouse_node.children_nodes.length > 0)).forEach(spouse_node => { 
            [spouse_min_x, spouse_max_x, stacks, stack_sub_level] 
                = positionStackableNode(node, spouse_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, spouse_min_x, spouse_max_x, false);
        });
    }

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
            = positionStackableNode(node, child_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, child_min_x, child_max_x);
    });

    alignStacks(stacks);

    // Position unstacked children
    node.children_nodes.filter(child_node => (window.max_stack_size === 1) || (child_node.spouse_nodes.length > 0)).forEach(child_node => { 
        [child_min_x, child_max_x, stacks, stack_sub_level] 
            = positionStackableNode(node, child_node, rows, has_grandchildren, drop_sub_level, stack_sub_level, stacks, child_min_x, child_max_x);
    });

    return [child_min_x, child_max_x];
}


function adjustInnerNodesSpacingForChain(chain_nodes, rows, direction = 'right-to-left', fixed_outer_nodes = new Set()) {
    if (!chain_nodes || chain_nodes.length < 3) return false;

    const sorted_children = chain_nodes.slice().sort((a, b) => getChainSortX(a) - getChainSortX(b));
    const inner_children = sorted_children.slice(1, -1);
    if (direction === 'right-to-left') inner_children.reverse();

    logPositioning('balancing-chain-pass', {
        direction,
        left_outer: sorted_children[0].individual.name,
        right_outer: sorted_children[sorted_children.length - 1].individual.name,
        inner_nodes: inner_children.map(node => node.individual.name),
        all_nodes: sorted_children.map(node => node.individual.name),
    });

    let moved = false;

    inner_children.forEach(child_node => {
        if (fixed_outer_nodes.has(child_node)) {
            logPositioning('balancing-node-skip', {
                name: child_node.individual.name,
                reason: 'outer-fixed',
            });
            return;
        }

        if (child_node.type === 'ancestor') {
            logPositioning('balancing-node-skip', {
                name: child_node.individual.name,
                reason: 'ancestor-fixed',
                spouse: child_node.pedigree_spouse_node ? child_node.pedigree_spouse_node.individual.name : null,
            });
            return;
        }

        if (child_node.stacked) {
            logPositioning('balancing-node-skip', {
                name: child_node.individual.name,
                reason: 'stacked',
            });
            return;
        }

        const child_index = sorted_children.indexOf(child_node);
        const left_sibling = sorted_children[child_index - 1];
        const right_sibling = sorted_children[child_index + 1];
        const movement_space = getSubtreeHorizontalMovementSpace(child_node, rows, window.h_spacing);

        let left_space = movement_space.left;
        let right_space = movement_space.right;

        if (!Number.isFinite(left_space) || !Number.isFinite(right_space)) {
            logPositioning('balancing-node-skip', {
                name: child_node.individual.name,
                reason: 'non-finite-space',
                left_space,
                right_space,
                movement_space,
            });
            return;
        }
        left_space = Math.max(0, left_space);
        right_space = Math.max(0, right_space);

        // Center the subtree within the free interval currently available around it.
        const centered_shift = (right_space - left_space) / 2;
        const allowed_shift = Math.max(0, centered_shift);

        logPositioning('balancing-node', {
            name: child_node.individual.name,
            left_sibling: left_sibling ? left_sibling.individual.name : null,
            right_sibling: right_sibling ? right_sibling.individual.name : null,
            left_space,
            right_space,
            centered_shift,
            allowed_shift,
            movement_left: movement_space.left,
            movement_right: movement_space.right,
            left_blocker: movement_space.left_blocker,
            right_blocker: movement_space.right_blocker,
            min_x: child_node.min_x,
            max_x: child_node.max_x,
            x: child_node.x,
        });

        if (Math.abs(allowed_shift) >= 0.5) {
            shiftSubtree(child_node, allowed_shift);
            moved = true;
            logPositioning('balancing-node-moved', {
                name: child_node.individual.name,
                shift_x: allowed_shift,
                allowed_shift,
                new_x: child_node.x,
                new_min_x: child_node.min_x,
                new_max_x: child_node.max_x,
            });
        }
    });

    return moved;
}


function adjustInnerChildrenSpacingGlobal(rows, max_rounds = 12) {
    if (!rows || max_rounds < 1) return;

    const chains = getBalancingChains(rows);

    for (let round = 0; round < max_rounds; round++) {
        const direction = (round % 2 === 0) ? 'right-to-left' : 'left-to-right';
        const fixed_outer_nodes = new Set([
            ...getFixedAdjacentOuterNodes(rows),
            ...getFixedStackOuterNodes(rows),
        ]);
        let moved = false;
        chains.forEach(chain_nodes => {
            if (adjustInnerNodesSpacingForChain(chain_nodes, rows, direction, fixed_outer_nodes)) moved = true;
        });
        if (!moved) break;
    }
}


function enforceBoundary(node) {
    if (!window.level_boundary_node_ancestor[node.level]) return;

    // Do not cross the vertical line below a female ancestor
    //if (node.type !== 'inlaw') {
        node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level].x + window.h_spacing);
    //}

    // Do not intersect with the horizontal line from a female to her parents (applies to siblings to the left of male ancestors)
    if (window.level_boundary_node_ancestor[node.level + 1] && (node.sub_level === 0) && (node.type === 'relative')) {
            if (node.parent_node && (node.parent_node.type === 'ancestor') && (node.parent_node.individual.pedigree_child_node) && (node.parent_node.individual.pedigree_child_node.individual.gender === 'M')) {
            node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level + 1].x + window.h_spacing);
        }
    }

    // Do not intersect with the horizontal line from a female to her children (applies to lines under male ancestors)
    if (window.level_boundary_node_ancestor[node.level] && (node.type === 'ancestor') && (node.individual.gender === 'M')) {
        if (node.individual.pedigree_child_node && node.individual.pedigree_child_node.individual.gender === 'M') {
            const pedigree_spouse_node = window.level_boundary_node_ancestor[node.level].pedigree_spouse_node;
            if (pedigree_spouse_node) {
                let spouse_children_max_x = -Infinity;
                pedigree_spouse_node.children_nodes.forEach(child_node => { spouse_children_max_x = Math.max(spouse_children_max_x, child_node.x); });
                node.x = Math.max(node.x, spouse_children_max_x);
            }
        }
    }

    // Use this node as a boundary for future male ancestors
    if (node.type !== 'ancestor') {
        if (!window.level_boundary_node_leaf[node.level] || (node.x >= window.level_boundary_node_leaf[node.level].x)) 
            window.level_boundary_node_leaf[node.level] = node;
    }
}


function positionNode(node, rows) {
    const length = rows[node.level][node.sub_level].length;
    // Start at the left most position of the level or to the right of the last node in this sub-level
    if (length === 0) node.x = window.tree_padding;
    else {
        node.x = rows[node.level][node.sub_level][length - 1].x + window.box_width + window.h_spacing;
        node.left_neighbor = rows[node.level][node.sub_level][length - 1];
    }

    enforceBoundary(node);

    window.level_heights[node.level] = Math.max(window.level_heights[node.level], node.sub_level + 1);
    node.is_positioned = true;
    rows[node.level][node.sub_level].push(node);
}


function shiftSubtree(node, shift_x) {
    if (!node) return;
    node.x += shift_x;
    node.min_x += shift_x;
    node.max_x += shift_x;
    if (node.spouse_nodes) node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x) });
    const shift_children = node.children_nodes && (node.type !== 'ancestor' || !node.individual.pedigree_child_node);
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
    parent_node.children_nodes.filter(child_node => child_node !== node).forEach(sibling_node => { shiftSubtree(sibling_node, shift_x); });
}


function collectShiftableSubtreeNodes(root_node, collected_nodes = new Set()) {
    if (!root_node || collected_nodes.has(root_node)) return collected_nodes;

    collected_nodes.add(root_node);

    if (root_node.spouse_nodes) {
        root_node.spouse_nodes
            .filter(spouse_node => spouse_node.type === 'inlaw')
            .forEach(spouse_node => { collectShiftableSubtreeNodes(spouse_node, collected_nodes); });
    }

    const shift_children = root_node.children_nodes && (root_node.type !== 'ancestor' || !root_node.individual.pedigree_child_node);
    if (shift_children) root_node.children_nodes.forEach(child_node => { collectShiftableSubtreeNodes(child_node, collected_nodes); });

    return collected_nodes;
}


function flattenRows(rows) {
    const nodes = [];
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                nodes.push(node);
            });
        });
    });
    return nodes;
}


function getChainSortX(node) {
    return node.x;
}


function getChainRightX(node) {
    return node.x + window.box_width;
}


function addBalancingChain(chains, seen_keys, nodes, source = 'unknown') {
    const unique_nodes = [...new Set((nodes || []).filter(Boolean))];
    if (unique_nodes.length < 3) return;

    const sorted_nodes = unique_nodes.slice().sort((a, b) => getChainSortX(a) - getChainSortX(b));
    const chain_key = sorted_nodes
        .map(node => `${node.individual.id}:${node.type}:${node.level}:${node.sub_level}`)
        .join('|');

    if (seen_keys.has(chain_key)) return;
    seen_keys.add(chain_key);
    chains.push(sorted_nodes);

    logPositioning('balancing-chain', {
        source,
        nodes: sorted_nodes.map(node => node.individual.name),
        left_outer: sorted_nodes[0].individual.name,
        right_outer: sorted_nodes[sorted_nodes.length - 1].individual.name,
    });
}


function getBalancingChains(rows) {
    if (!rows) return [];

    const all_nodes = flattenRows(rows);
    const chains = [];
    const seen_keys = new Set();
    const ancestor_row_keys = new Set();

    all_nodes.filter(node => node.type === 'ancestor').forEach(node => {
        ancestor_row_keys.add(`${node.level}:${node.sub_level}`);

        const sibling_nodes = node.father_node ? node.father_node.children_nodes : [];
        const inlaw_spouses = node.spouse_nodes ? node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw') : [];

        if (node.individual.gender === 'M') {
            const left_outer_sibling = sibling_nodes.slice().sort((a, b) => getChainSortX(a) - getChainSortX(b))[0];
            const ancestor_left_x = node.x;
            const left_side_nodes = [...sibling_nodes, ...inlaw_spouses].filter(candidate => candidate.x < ancestor_left_x);
            const near_outer = left_side_nodes
                .slice()
                .sort((a, b) => b.x - a.x)[0];

            if (left_outer_sibling && near_outer && left_outer_sibling !== near_outer) {
                const left_bound = left_outer_sibling.x;
                const right_bound = near_outer.x;
                const chain_nodes = left_side_nodes.filter(candidate => candidate.x >= left_bound && candidate.x <= right_bound);
                addBalancingChain(chains, seen_keys, chain_nodes, `male-ancestor-left:${node.individual.name}`);
            }
        }

        if (node.individual.gender === 'F') {
            const right_outer_sibling = sibling_nodes.slice().sort((a, b) => getChainSortX(b) - getChainSortX(a))[0];
            const ancestor_right_x = node.x;
            const right_side_nodes = [...inlaw_spouses, ...sibling_nodes].filter(candidate => candidate.x > ancestor_right_x);
            const near_outer = right_side_nodes
                .slice()
                .sort((a, b) => a.x - b.x)[0];

            if (right_outer_sibling && near_outer && right_outer_sibling !== near_outer) {
                const left_bound = near_outer.x;
                const right_bound = right_outer_sibling.x;
                const chain_nodes = right_side_nodes.filter(candidate => candidate.x >= left_bound && candidate.x <= right_bound);
                addBalancingChain(chains, seen_keys, chain_nodes, `female-ancestor-right:${node.individual.name}`);
            }
        }
    });

    all_nodes.filter(node => node.children_nodes && node.children_nodes.length >= 3).forEach(node => {
        const child_row_keys = new Set(node.children_nodes.map(child_node => `${child_node.level}:${child_node.sub_level}`));
        const row_has_ancestor = [...child_row_keys].some(row_key => ancestor_row_keys.has(row_key));
        if (!row_has_ancestor) addBalancingChain(chains, seen_keys, node.children_nodes, `children:${node.individual.name}`);
    });

    logPositioning('balancing-chain-count', { count: chains.length });

    return chains;
}


function getFixedAdjacentOuterNodes(rows) {
    const fixed_nodes = new Set();
    if (!rows) return fixed_nodes;

    const all_nodes = flattenRows(rows);

    all_nodes.filter(node => node.type === 'ancestor').forEach(node => {
        const sibling_nodes = node.father_node ? node.father_node.children_nodes : [];
        const inlaw_spouses = node.spouse_nodes ? node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw') : [];

        if (node.individual.gender === 'M') {
            const candidates = [...sibling_nodes, ...inlaw_spouses].filter(candidate => candidate.x < node.x);
            const adjacent_left = candidates.slice().sort((a, b) => b.x - a.x)[0];
            if (adjacent_left) fixed_nodes.add(adjacent_left);
        }

        if (node.individual.gender === 'F') {
            const candidates = [...inlaw_spouses, ...sibling_nodes].filter(candidate => candidate.x > node.x);
            const adjacent_right = candidates.slice().sort((a, b) => a.x - b.x)[0];
            if (adjacent_right) fixed_nodes.add(adjacent_right);
        }
    });

    logPositioning('balancing-fixed-adjacent-outers', {
        count: fixed_nodes.size,
        names: [...fixed_nodes].map(node => node.individual.name),
    });

    return fixed_nodes;
}


function getFixedStackOuterNodes(rows) {
    const fixed_nodes = new Set();
    if (!rows || (window.max_stack_size <= 1)) return fixed_nodes;

    const all_nodes = flattenRows(rows);

    all_nodes.filter(node => node.children_nodes && node.children_nodes.length > 0).forEach(node => {
        const all_children_stacked = node.children_nodes.every(child_node => child_node.stacked);
        if (!all_children_stacked) return;

        const stack_tops = node.children_nodes.filter(child_node => child_node.stack_top);
        if (stack_tops.length === 0) return;

        const right_most_stack_top = stack_tops.slice().sort((a, b) => b.x - a.x)[0];
        if (right_most_stack_top) fixed_nodes.add(right_most_stack_top);
    });

    logPositioning('balancing-fixed-stack-outers', {
        count: fixed_nodes.size,
        names: [...fixed_nodes].map(node => node.individual.name),
    });

    return fixed_nodes;
}


function getSubtreeHorizontalMovementSpace(node, rows, extra_gap = 0) {
    if (!node || !rows) return { left: 0, right: 0 };

    const subtree_nodes = collectShiftableSubtreeNodes(node);
    const all_nodes = flattenRows(rows);
    const other_nodes = all_nodes.filter(other_node => !subtree_nodes.has(other_node));

    let max_left = Infinity;
    let max_right = Infinity;
    let left_blocker = null;
    let right_blocker = null;

    subtree_nodes.forEach(subtree_node => {
        const subtree_left = subtree_node.x - extra_gap;
        const subtree_right = subtree_node.x + window.box_width + extra_gap;
        const subtree_top = subtree_node.y;
        const subtree_bottom = (subtree_node.y === undefined) ? undefined : subtree_node.y + window.box_height;

        other_nodes.forEach(other_node => {
            const other_top = other_node.y;
            const other_bottom = (other_node.y === undefined) ? undefined : other_node.y + window.box_height;

            let vertical_overlap = false;
            if (subtree_top !== undefined && subtree_bottom !== undefined && other_top !== undefined && other_bottom !== undefined) {
                vertical_overlap = subtree_top < other_bottom && other_top < subtree_bottom;
            } else {
                vertical_overlap = subtree_node.level === other_node.level && subtree_node.sub_level === other_node.sub_level;
            }

            if (!vertical_overlap) return;

            const other_left = other_node.x;
            const other_right = other_node.x + window.box_width;

            if (other_left >= subtree_right) {
                // Rightward movement is limited by outside nodes that are to the right.
                const candidate_right = other_left - subtree_right;
                if (candidate_right < max_right) {
                    max_right = candidate_right;
                    right_blocker = {
                        subtree_node: subtree_node.individual.name,
                        blocker_node: other_node.individual.name,
                        blocker_x: other_node.x,
                        available_space: candidate_right,
                    };
                }
            }
            if (other_right <= subtree_left) {
                // Leftward movement is limited by outside nodes that are to the left.
                const candidate_left = subtree_left - other_right;
                if (candidate_left < max_left) {
                    max_left = candidate_left;
                    left_blocker = {
                        subtree_node: subtree_node.individual.name,
                        blocker_node: other_node.individual.name,
                        blocker_x: other_node.x,
                        available_space: candidate_left,
                    };
                }
            }
        });
    });

    return {
        left: Number.isFinite(max_left) ? Math.max(0, max_left) : Infinity,
        right: Number.isFinite(max_right) ? Math.max(0, max_right) : Infinity,
        left_blocker,
        right_blocker,
    };
}


function normalizeTreeX(rows) {
    let min_x = Infinity;
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                min_x = Math.min(min_x, node.x);
            });
        });
    });

    if (!Number.isFinite(min_x)) return;

    const shift_x = window.tree_padding - min_x;
    if (shift_x === 0) return;

    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                node.x += shift_x;
                if (node.min_x !== undefined) node.min_x += shift_x;
                if (node.max_x !== undefined) node.max_x += shift_x;
            });
        });
    });
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
