// Requires: position_tree_helpers.js (defines _layout_cfg and all helper functions)

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

function positionTree(node, rows = [], config) {
    _layout_cfg = (config !== undefined) ? (config ?? window) : (_layout_cfg ?? window);
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
        if (_layout_cfg.beside_inlaws && (node.type === 'root')) positionNode(node, rows);

        // Position spouses
        let [, spouse_max_x] = !_layout_cfg.beside_inlaws ? positionSpouses(node, rows, 'root') : positionSpouses(node, rows, 'inlaw');

        // If inlaws are to the left and the person is root, make sure they are next to their spouse
        if (_layout_cfg.beside_inlaws && (node.type === 'root')) shiftPersonNextToSpouse(node);

        // Position children
        let [child_min_x, child_max_x] = positionChildren(node, rows, false);
        
        // Position the ancestor
        if (!_layout_cfg.beside_inlaws || (node.type === 'ancestor')) positionNode(node, rows);
        
        // If there is a gap between the inlaws and the ancestor, close the gap
        if (node.spouse_nodes.length > 0) {
            let shift_x = node.x - (spouse_max_x + _layout_cfg.sibling_spacing);
            if (shift_x > 0) {
                node.spouse_nodes.forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                shiftSiblings(node, shift_x);
            }
        }

        if ((node.type === 'root') && !_layout_cfg.beside_inlaws) centerPersonAboveSpouses(node);

        // Male ancestor needs to be to the right of his siblings and their descendants
        if (node.father_node) {
            let sib_max_x = -Infinity;
            node.father_node.children_nodes.forEach(sibling_node => { sib_max_x = Math.max(sib_max_x, sibling_node.max_x); });
            let shift_x = sib_max_x - (node.x + sibNodeSize() - _layout_cfg.sibling_spacing);
            if (shift_x > 0) {
                logPositioning('male-ancestor sibling-boundary shift', {
                    name: node.individual.name,
                    shift_x,
                    before_x: node.x,
                    sibling_spacing: _layout_cfg.sibling_spacing,
                    box_width: _layout_cfg.box_width,
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
            let shift_x = spouse_max_x - (node.x + sibNodeSize() - _layout_cfg.sibling_spacing);
            if (shift_x > 0) {
                logPositioning('male-ancestor inlaw-boundary shift', {
                    name: node.individual.name,
                    shift_x,
                    before_x: node.x,
                    sibling_spacing: _layout_cfg.sibling_spacing,
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
            let shift_x = node.x + sibNodeSize() + _layout_cfg.sibling_spacing / 2 - getChildCenter(node);
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
        node.max_x = Math.max(node.x + sibNodeSize(), child_max_x);

        // Male ancestors need to be to the right of the level boundary's max_x
        if ((node.type !== 'root') && window.level_boundary_node_leaf[node.level] && (window.level_boundary_node_leaf[node.level] !== node)) {
            const boundary_node = window.level_boundary_node_leaf[node.level];
            let max_x = boundary_node.x + sibNodeSize() + _layout_cfg.sibling_spacing;
            let shift_x = max_x - (node.x + sibNodeSize());
            if (shift_x > 0) {
                logPositioning('male-ancestor leaf-boundary shift', {
                    name: node.individual.name,
                    shift_x,
                    before_x: node.x,
                    boundary_name: boundary_node.individual ? boundary_node.individual.name : 'unknown',
                    boundary_x: boundary_node.x,
                    sibling_spacing: _layout_cfg.sibling_spacing,
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
    if (_layout_cfg.beside_inlaws && (node.individual.gender === 'F') && (node.type === 'relative')) {
        // Position spouses
        let [spouse_min_x, spouse_max_x] = positionSpouses(node, rows, 'inlaw');
        positionNode(node, rows);
        node.min_x = Math.min(node.x, spouse_min_x);
        node.max_x = Math.max(node.x + sibNodeSize(), spouse_max_x);
    }
    else positionNode(node, rows);

    // Keep track of this female ancestor as the boundary of her level so that later nodes do not cross the line down to her children
    if (node.type === 'ancestor') window.level_boundary_node_ancestor[node.level] = node;

    if (node.stacked || (node.spouse_nodes.length === 0)) {
        node.min_x = node.x;
        node.max_x = node.x + sibNodeSize();
    }
    
    // Position spouses
    if (!_layout_cfg.beside_inlaws || (node.individual.gender === 'M') || (node.type === 'ancestor')) {
        let [spouse_min_x, spouse_max_x] = !_layout_cfg.beside_inlaws ? positionSpouses(node, rows, 'relative') : positionSpouses(node, rows, 'inlaw');
        node.min_x = Math.min(node.min_x, spouse_min_x);
        node.max_x = Math.max(node.max_x, spouse_max_x);
    }

    if (node.type === 'relative') {
        if (!_layout_cfg.beside_inlaws) centerPersonAboveSpouses(node);
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
    let min_x = node.x - _layout_cfg.sibling_spacing / 2;
    let max_x = min_x;
    if (pedigree_spouse_node && !pedigree_spouse_node.duplicate_parents) {
        if (pedigree_spouse_node.father_node && pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.mother_node.x - _layout_cfg.sibling_spacing / 2;
        if (pedigree_spouse_node.father_node && !pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.father_node.x + sibNodeSize() / 2;
        if (!pedigree_spouse_node.father_node && pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.mother_node.x + sibNodeSize() / 2;
    }
    if (!node.duplicate_parents) {
        if (node.father_node && node.mother_node) max_x = node.mother_node.x - _layout_cfg.sibling_spacing / 2;
        if (node.father_node && !node.mother_node) max_x = node.father_node.x + sibNodeSize() / 2;
        if (!node.father_node && node.mother_node) max_x = node.mother_node.x + sibNodeSize() / 2;
    }
    else max_x = min_x + sibNodeSize() / 2 - _layout_cfg.sibling_spacing / 2;

    if (!pedigree_spouse_node || (!pedigree_spouse_node.father_node && !pedigree_spouse_node.mother_node)) min_x = max_x;
    if (!node.father_node && !node.mother_node) max_x = min_x;

    let shift_x = (min_x + max_x) / 2 - (node.x - _layout_cfg.sibling_spacing / 2);
    logPositioning('center-ancestor-couple computed shift', {
        name: node.individual.name,
        spouse_name: pedigree_spouse_node ? pedigree_spouse_node.individual.name : 'none',
        shift_x,
        min_x,
        max_x,
        current_reference: node.x - _layout_cfg.sibling_spacing / 2,
        node_x: node.x,
        sibling_spacing: _layout_cfg.sibling_spacing,
        box_width: _layout_cfg.box_width,
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
    if (node.stacked || (node.children_nodes.length === 0) || _layout_cfg.beside_inlaws) {
        node.min_x = node.x;
        node.max_x = node.x + sibNodeSize();
    }
    let [child_min_x, child_max_x] = positionChildren(node, rows, true);
    node.min_x = Math.min(node.min_x, child_min_x);
    node.max_x = Math.max(node.max_x, child_max_x);

    let left = -sibNodeSize() / 2 - _layout_cfg.sibling_spacing / 2;
    let right = sibNodeSize() / 2 + _layout_cfg.sibling_spacing / 2;
    let x_offset = (node.individual.gender === 'M') ? right : left;
    if (node.spouse_nodes[0].type === 'ancestor') x_offset = (x_offset === right) ? left : right;

    // Center inlaw over their children
    if (node.children_nodes.length > 0) {
        let shift_x = node.x + sibNodeSize() / 2 - getChildCenter(node) + (!_layout_cfg.beside_inlaws ? 0 : x_offset);
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
            node.max_x = Math.max(node.max_x, node.x + sibNodeSize());
        }
    }
}


function positionStackableNode(parent_node, target_node, rows, has_grandchildren, drop_sub_level, ctx, check_spouse_nodes = true, force_stack = null) {
    const auto_stackable = (_layout_cfg.max_stack_size > 1) && (!has_grandchildren || (target_node.children_nodes.length === 0 && (!check_spouse_nodes || target_node.spouse_nodes.length === 0)));
    const is_stackable = (force_stack === null) ? auto_stackable : force_stack;
    if (is_stackable) {
        const min_stack_level = parent_node.sub_level + (drop_sub_level ? 1 : 0);
        const max_stack_level = min_stack_level + _layout_cfg.max_stack_size;
        if (ctx.stack_sub_level === min_stack_level) {
            target_node.stack_top = true;
            ctx.stacks.push([target_node]);
        }
        else ctx.stacks[ctx.stacks.length - 1].push(target_node);
        window.max_stack_actual = Math.max(window.max_stack_actual, ctx.stacks[ctx.stacks.length - 1].length);
        target_node.stacked = true;
        target_node.sub_level = ctx.stack_sub_level;
        ctx.stack_sub_level += 1;
        if (ctx.stack_sub_level === max_stack_level) ctx.stack_sub_level = min_stack_level;
    }
    else {
        if (drop_sub_level) target_node.sub_level = parent_node.sub_level + 1;
    }
    positionTree(target_node, rows);
    ctx.min_x = Math.min(ctx.min_x, target_node.min_x);
    ctx.max_x = Math.max(ctx.max_x, target_node.max_x);
    logPositioning('child-stack-placement', {
        parent: getNodeLogName(parent_node),
        child: getNodeLogName(target_node),
        auto_stackable,
        forced_stack: force_stack,
        stacked: !!target_node.stacked,
        stack_top: !!target_node.stack_top,
        sub_level: target_node.sub_level,
        x: target_node.x,
        min_x: target_node.min_x,
        max_x: target_node.max_x,
        stack_count: ctx.stacks.length,
    });
}


function layoutChildrenWithPlan(node, ordered_children, rows, drop_sub_level, has_grandchildren, stacked_children, stack_groups, child_layout_nodes, layout_snapshot, enable_logging = true) {
    const previous_suppressed = !!window.suppress_positioning_log;
    window.suppress_positioning_log = previous_suppressed || !enable_logging;
    const stack_top_children = new Set((stack_groups || []).map(stack_group => stack_group[0]).filter(Boolean));

    resetChildLayoutNodes(child_layout_nodes, rows);
    restoreChildLayoutState(layout_snapshot);

    const initial_sub_level = node.sub_level + (drop_sub_level ? 1 : 0);
    const ctx = makeStackCtx(initial_sub_level);

    ordered_children.forEach(child_node => {
        if (stacked_children.has(child_node) && stack_top_children.has(child_node) && (ctx.stacks.length > 0)) {
            alignStacks(ctx.stacks);
            resetStackCtx(ctx, initial_sub_level);
        }

        if (!stacked_children.has(child_node) && (ctx.stacks.length > 0)) {
            alignStacks(ctx.stacks);
            resetStackCtx(ctx, initial_sub_level);
        }

        positionStackableNode(
            node,
            child_node,
            rows,
            has_grandchildren,
            drop_sub_level,
            ctx,
            true,
            stacked_children.has(child_node),
        );
    });

    alignStacks(ctx.stacks);
    window.suppress_positioning_log = previous_suppressed;

    return {
        child_min_x: ctx.min_x,
        child_max_x: ctx.max_x,
        subtree_width: (Number.isFinite(ctx.min_x) && Number.isFinite(ctx.max_x)) ? (ctx.max_x - ctx.min_x) : 0,
    };
}


function positionSpouses(node, rows, type_to_drop) {
    const has_grandchildren = hasGrandChildren(node);
    const drop_sub_level = node.type === type_to_drop;
    const initial_sub_level = node.sub_level + (drop_sub_level ? 1 : 0);

    const ctx = makeStackCtx(initial_sub_level);

    if ((node.type !== 'ancestor') && !_layout_cfg.beside_inlaws) {
        node.spouse_nodes.filter(spouse_node => (_layout_cfg.max_stack_size > 1) && (!has_grandchildren || (spouse_node.children_nodes.length === 0))).forEach(spouse_node => {
            positionStackableNode(node, spouse_node, rows, has_grandchildren, drop_sub_level, ctx, false);
        });
        alignStacks(ctx.stacks);
    }

    if (_layout_cfg.beside_inlaws) {
        node.spouse_nodes.forEach(spouse_node => {
            if (drop_sub_level) spouse_node.sub_level = node.sub_level + 1;
            positionTree(spouse_node, rows);
            ctx.min_x = Math.min(ctx.min_x, spouse_node.min_x);
            ctx.max_x = Math.max(ctx.max_x, spouse_node.max_x);
        });
    } else {
        node.spouse_nodes.filter(spouse_node => (_layout_cfg.max_stack_size === 1) || (node.type === 'ancestor') || (spouse_node.children_nodes.length > 0)).forEach(spouse_node => {
            positionStackableNode(node, spouse_node, rows, has_grandchildren, drop_sub_level, ctx, false);
        });
        alignStacks(ctx.stacks);
    }

    let spouse_min_x = ctx.min_x, spouse_max_x = ctx.max_x;

    if (!_layout_cfg.beside_inlaws && drop_sub_level && (node.spouse_nodes.length > 0)) {
        const compact_result = compactLeftMostGroupNodeRight(node.spouse_nodes, rows, 'spouses');
        if (compact_result.moved) {
            spouse_min_x = Infinity;
            spouse_max_x = -Infinity;
            node.spouse_nodes.forEach(spouse_node => {
                spouse_min_x = Math.min(spouse_min_x, spouse_node.min_x);
                spouse_max_x = Math.max(spouse_max_x, spouse_node.max_x);
            });
        }
    }

    return [spouse_min_x, spouse_max_x];
}


// drop_sub_level will be true for inlaws so that their children are positioned one sub-level lower than the inlaw
function positionChildren(node, rows, drop_sub_level) {
    const has_grandchildren = hasGrandChildren(node);

    // Sort children by birth year (ascending), nodes without a birth year go to the right end
    node.children_nodes.sort((a, b) => {
        const aYear = parseInt(a.individual.birth, 10);
        const bYear = parseInt(b.individual.birth, 10);
        if (isNaN(aYear) && isNaN(bYear)) return 0;
        if (isNaN(aYear)) return 1;
        if (isNaN(bYear)) return -1;
        return aYear - bYear;
    });

    // If node is a parent of root and root would be in a stack, make sure they are the top of the stack
    if ((node.type === 'ancestor') && (_layout_cfg.max_stack_size > 1) && (node.children_nodes.length > 0) && !node.individual.pedigree_child_node) {
        const root_node = node.children_nodes.find(child_node => child_node.individual.is_root);
        if (root_node && (!has_grandchildren || (root_node.spouse_nodes.length === 0))) {
            // Make root the first child in children_nodes so that it is positioned first and becomes the top of the stack
            const root_index = node.children_nodes.indexOf(root_node);
            if (root_index > 0) {
                node.children_nodes.splice(root_index, 1);
                node.children_nodes.unshift(root_node);
            }
        }
    }

    const child_layout_nodes = collectChildLayoutNodes(node.children_nodes);
    const layout_snapshot = snapshotChildLayoutState();
    let { stacked_children, stack_groups, layout_order } = planOrderedChildStacks(node, node.children_nodes, has_grandchildren);
    let best_layout = layoutChildrenWithPlan(node, layout_order, rows, drop_sub_level, has_grandchildren, stacked_children, stack_groups, child_layout_nodes, layout_snapshot, true);

    let released_stack_group = true;
    while (released_stack_group) {
        released_stack_group = false;
        const current_stack_groups = stack_groups.filter(stack_group => stack_group.length > 1);

        for (const stack_group of current_stack_groups) {
            const trial_stacked_children = new Set(stacked_children);
            stack_group.forEach(child_node => { trial_stacked_children.delete(child_node); });
            const trial_stack_groups = removeMatchingStackGroup(stack_groups, stack_group);
            const trial_layout_order = buildChildLayoutOrder(node.children_nodes, trial_stack_groups);

            const trial_layout = layoutChildrenWithPlan(node, trial_layout_order, rows, drop_sub_level, has_grandchildren, trial_stacked_children, trial_stack_groups, child_layout_nodes, layout_snapshot, false);
            const accepted = shouldAcceptChildLayoutTrial(best_layout, trial_layout);

            logPositioning('child-stack-width-check', {
                parent: getNodeLogName(node),
                released_children: stack_group.map(getNodeLogName),
                current_stacked_children: [...stacked_children].map(getNodeLogName),
                trial_stacked_children: [...trial_stacked_children].map(getNodeLogName),
                current_width: best_layout.subtree_width,
                trial_width: trial_layout.subtree_width,
                current_min_x: best_layout.child_min_x,
                current_max_x: best_layout.child_max_x,
                trial_min_x: trial_layout.child_min_x,
                trial_max_x: trial_layout.child_max_x,
                max_x_improved: trial_layout.child_max_x < best_layout.child_max_x,
                accepted,
            });

            if (accepted) {
                stacked_children = trial_stacked_children;
                stack_groups = trial_stack_groups;
                layout_order = trial_layout_order;
                best_layout = layoutChildrenWithPlan(node, layout_order, rows, drop_sub_level, has_grandchildren, stacked_children, stack_groups, child_layout_nodes, layout_snapshot, true);
                released_stack_group = true;
                logPositioning('child-stack-release', {
                    parent: getNodeLogName(node),
                    released_children: stack_group.map(getNodeLogName),
                    resulting_stacked_children: [...stacked_children].map(getNodeLogName),
                    resulting_width: best_layout.subtree_width,
                });
                break;
            }

            best_layout = layoutChildrenWithPlan(node, layout_order, rows, drop_sub_level, has_grandchildren, stacked_children, stack_groups, child_layout_nodes, layout_snapshot, false);
        }
    }

    const compact_result = compactLeftMostGroupNodeRight(node.children_nodes, rows, 'children');
    if (compact_result.moved) {
        best_layout.child_min_x = Infinity;
        best_layout.child_max_x = -Infinity;
        node.children_nodes.forEach(child_node => {
            best_layout.child_min_x = Math.min(best_layout.child_min_x, child_node.min_x);
            best_layout.child_max_x = Math.max(best_layout.child_max_x, child_node.max_x);
        });
        best_layout.subtree_width = best_layout.child_max_x - best_layout.child_min_x;
    }

    const child_min_x = best_layout.child_min_x;
    const child_max_x = best_layout.child_max_x;

    logPositioning('child-subtree-width', {
        parent: getNodeLogName(node),
        child_order: node.children_nodes.map(getNodeLogName),
        stacked_children: node.children_nodes.filter(child_node => child_node.stacked).map(getNodeLogName),
        unstacked_children: node.children_nodes.filter(child_node => !child_node.stacked).map(getNodeLogName),
        child_min_x,
        child_max_x,
        subtree_width: (Number.isFinite(child_min_x) && Number.isFinite(child_max_x)) ? (child_max_x - child_min_x) : 0,
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
        const movement_space = getSubtreeHorizontalMovementSpace(child_node, rows, _layout_cfg.sibling_spacing);

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


function normalizeTreeX(rows, config) {
    _layout_cfg = (config !== undefined) ? (config ?? window) : (_layout_cfg ?? window);
    let min_x = Infinity;
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                min_x = Math.min(min_x, node.x);
            });
        });
    });

    if (!Number.isFinite(min_x)) return;

    const shift_x = _layout_cfg.tree_padding - min_x;
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


function getMaximumDimensions(rows, config) {
    _layout_cfg = (config !== undefined) ? (config ?? window) : (_layout_cfg ?? window);
    let max_x = -Infinity;
    let max_y = -Infinity;
    let node_count = 0;
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                max_x = Math.max(max_x, node.x + sibNodeSize() + _layout_cfg.tree_padding);
                max_y = Math.max(max_y, node.y + (_layout_cfg.tree_orientation === 'horizontal' ? _layout_cfg.box_width : _layout_cfg.box_height) + _layout_cfg.tree_padding);
                node_count += 1;
            });
        });
    });
    // For horizontal orientation the generation axis maps to SVG x and the sibling
    // axis maps to SVG y, so swap the returned dimensions accordingly.
    if (_layout_cfg.tree_orientation === 'horizontal') return [max_y, max_x, node_count.toLocaleString()];
    return [max_x, max_y, node_count.toLocaleString()];
}


function setHeights(rows, config) {
    _layout_cfg = (config !== undefined) ? (config ?? window) : (_layout_cfg ?? window);
    // In horizontal mode box_width is the generation-direction node span (user's node width =
    // horizontal screen extent = generation axis).  In vertical mode box_height is the generation span.
    const gen_span = _layout_cfg.tree_orientation === 'horizontal' ? _layout_cfg.box_width : _layout_cfg.box_height;
    let total_height = _layout_cfg.tree_padding * 2;
    window.level_heights.forEach(height => { total_height += height * (gen_span + _layout_cfg.generation_spacing) + _layout_cfg.level_spacing; });
    let y = total_height - gen_span - _layout_cfg.generation_spacing - _layout_cfg.tree_padding; // Start from the bottom of the tree
    rows.forEach((level, index) => {
        y -= window.level_heights[index] * (gen_span + _layout_cfg.generation_spacing) + _layout_cfg.level_spacing;
        let sub_y = y;
        level.forEach(sub_level => {
            if (sub_level.length > 0) sub_y += gen_span + _layout_cfg.generation_spacing;
            sub_level.forEach(node => { node.y = sub_y; });
        });
    });
    // In horizontal mode the generation axis maps to SVG x (node.y → SVG x via mapCoords).
    // The loop above assigns small y to high-anchor-gen rows (ancestors) and large y to
    // low-anchor-gen rows (descendants).  Mirror all y values so that ancestors, which
    // should appear on the right, end up with the largest y values.
    if (_layout_cfg.tree_orientation === 'horizontal') {
        let min_y = Infinity, max_y = -Infinity;
        rows.forEach(level => level.forEach(sub => sub.forEach(n => {
            min_y = Math.min(min_y, n.y);
            max_y = Math.max(max_y, n.y);
        })));
        const mirror = max_y + min_y;
        rows.forEach(level => level.forEach(sub => sub.forEach(n => { n.y = mirror - n.y; })));
    }
}

