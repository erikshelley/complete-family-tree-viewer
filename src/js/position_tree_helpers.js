// Layout helper utilities for position_tree.js.
// Loaded before position_tree.js; shares the _layout_cfg variable with it.

// Module-level layout config — set by positionTree() and other public entry
// points in position_tree.js. Declared with 'var' so it is accessible across
// both script files when loaded in the same context.
// eslint-disable-next-line no-var
var _layout_cfg = window;

function getPositioningLogLevel() {
    if (window.positioning_log_level) return window.positioning_log_level;
    return window.debug_positioning ? 'debug' : 'none';
}


function logPositioning(message, data = null) {
    const level = getPositioningLogLevel();
    if (level === 'none') return;
    if (window.suppress_positioning_log) return;
    if ((level === 'moves') && (message !== 'balancing-node-moved')) return;
    if ((level === 'stack') && !message.startsWith('child-stack-') && (message !== 'child-subtree-width')) return;

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


function getNodeLogName(node) {
    if (!node) return 'unknown';
    return node.individual && node.individual.name ? node.individual.name : 'unknown';
}


function getGroupNodeNames(nodes, group_sizes) {
    let group_start = 0;
    return group_sizes.map(group_size => {
        const names = nodes.slice(group_start, group_start + group_size).map(getNodeLogName);
        group_start += group_size;
        return names;
    });
}

function shiftPersonNextToSpouse(node) {
    if (node.spouse_nodes.length === 0) return;
    let previous_x = Infinity;
    if (node.individual.gender === 'M') {
        [...node.spouse_nodes].reverse().forEach(spouse_node => {
            if ((previous_x !== Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x - _layout_cfg.box_width - _layout_cfg.sibling_spacing;
            previous_x = spouse_node.x;
        });
        node.x = previous_x - _layout_cfg.box_width - _layout_cfg.sibling_spacing;
    }
    else {
        node.spouse_nodes.forEach(spouse_node => {
            if ((previous_x !== Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x + _layout_cfg.box_width + _layout_cfg.sibling_spacing;
            previous_x = spouse_node.x;
        });
        node.x = previous_x + _layout_cfg.box_width + _layout_cfg.sibling_spacing;
        previous_x = Infinity;
        [...node.spouse_nodes].reverse().forEach(spouse_node => {
            if ((previous_x !== Infinity) && (spouse_node.children_nodes.length === 0)) spouse_node.x = previous_x - _layout_cfg.box_width - _layout_cfg.sibling_spacing;
            previous_x = spouse_node.x;
        });
    }
}


function centerPersonAboveSpouses(node) {
    let shift_x = node.x + _layout_cfg.box_width / 2 - getSpouseCenter(node);
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
        max_x = Math.max(max_x, spouse_node.x + _layout_cfg.box_width);
    });
    return (min_x + max_x) / 2;
}


function getChildCenter(node) {
    let min_x = Infinity, max_x = -Infinity;
    node.children_nodes.forEach(child_node => {
        min_x = Math.min(min_x, child_node.x);
        max_x = Math.max(max_x, child_node.x + _layout_cfg.box_width);
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
        const before_x = stack.map(n => ({ name: getNodeLogName(n), x: n.x }));
        let max_x = stack.map(n => n.x).reduce((a, b) => Math.max(a, b), -Infinity);
        let total_extra_x = 0;
        stack.filter(n => n.stacked).forEach(n => {
            n.x = max_x;
            if (n.left_neighbor && (n.left_neighbor.x + _layout_cfg.box_width + _layout_cfg.sibling_spacing) > n.x) {
                let extra_x = n.left_neighbor.x + _layout_cfg.box_width + _layout_cfg.sibling_spacing - n.x;
                n.x += extra_x;
                max_x += extra_x;
                total_extra_x += extra_x;
            }
            n.min_x = n.x;
            n.max_x = n.x + _layout_cfg.box_width;
        });
        logPositioning('child-stack-align', {
            stack: stack.map(getNodeLogName),
            before_x,
            after_x: stack.map(n => ({ name: getNodeLogName(n), x: n.x })),
            final_stack_x: max_x,
            total_extra_x,
        });
    });
}


function makeStackCtx(initial_sub_level) {
    return { stacks: [], stack_sub_level: initial_sub_level, min_x: Infinity, max_x: -Infinity };
}

function resetStackCtx(ctx, initial_sub_level) {
    ctx.stacks = [];
    ctx.stack_sub_level = initial_sub_level;
}

function shouldChildBeStacked(child_node, has_grandchildren) {
    return (_layout_cfg.max_stack_size > 1) && (!has_grandchildren || (child_node.spouse_nodes.length === 0));
}


function getCenteredColumnOrder(column_count) {
    const center = (column_count - 1) / 2;
    return Array.from({ length: column_count }, (_, index) => index)
        .sort((a, b) => {
            const distance_a = Math.abs(a - center);
            const distance_b = Math.abs(b - center);
            if (distance_a !== distance_b) return distance_a - distance_b;
            return a - b;
        });
}


function getEvenlySpacedColumnIndexes(column_count, selected_count) {
    if (selected_count <= 0) return [];

    const indexes = [];
    const used_indexes = new Set();

    for (let position = 0; position < selected_count; position++) {
        const ideal_index = ((position + 1) * (column_count + 1) / (selected_count + 1)) - 1;
        let candidate_index = Math.round(ideal_index);
        let offset = 0;

        while (used_indexes.has(candidate_index + offset) || (candidate_index + offset < 0) || (candidate_index + offset >= column_count)) {
            offset = (offset <= 0) ? Math.abs(offset) + 1 : -offset;
        }

        candidate_index += offset;
        used_indexes.add(candidate_index);
        indexes.push(candidate_index);
    }

    return indexes.sort((a, b) => a - b);
}


function getMinimalWidthRunGroupSizes(run_length) {
    if (run_length <= 0) return [];
    if ((_layout_cfg.max_stack_size <= 1) || (run_length === 1)) return [1];

    const column_count = Math.ceil(run_length / _layout_cfg.max_stack_size);
    const base_group_size = Math.floor(run_length / column_count);
    const group_sizes = Array(column_count).fill(base_group_size);
    const remainder = run_length % column_count;
    const expanded_indexes = getCenteredColumnOrder(column_count).slice(0, remainder);

    expanded_indexes.forEach(index => {
        group_sizes[index] += 1;
    });

    return group_sizes;
}


function buildChildLayoutOrder(children_nodes, stack_groups) {
    const layout_order = [];
    const group_by_child = new Map();

    stack_groups.forEach((stack_group, group_index) => {
        stack_group.forEach(child_node => { group_by_child.set(child_node, group_index); });
    });

    const inserted_groups = new Set();

    children_nodes.forEach(child_node => {
        const group_index = group_by_child.get(child_node);
        if (group_index === undefined) {
            layout_order.push(child_node);
            return;
        }

        if (inserted_groups.has(group_index)) return;
        inserted_groups.add(group_index);
        stack_groups[group_index].forEach(group_child => { layout_order.push(group_child); });
    });

    return layout_order;
}


function planOrderedChildStacks(parent_node, children_nodes, has_grandchildren) {
    const eligible_children = children_nodes.filter(child_node => shouldChildBeStacked(child_node, has_grandchildren));
    const stacked_children = new Set();
    const stack_groups = [];

    if (eligible_children.length <= 1) {
        if (eligible_children.length === 1) {
            logPositioning('child-stack-run', {
                parent: getNodeLogName(parent_node),
                run_children: eligible_children.map(getNodeLogName),
                eligible_count: eligible_children.length,
                max_stack_size: _layout_cfg.max_stack_size,
                column_count: 1,
                group_sizes: [1],
                grouped_children: [eligible_children.map(getNodeLogName)],
                stacked_children: [],
                unstacked_children: eligible_children.map(getNodeLogName),
                reason: 'single-eligible-child',
            });
        }

        return {
            stacked_children,
            stack_groups,
            layout_order: children_nodes.slice(),
        };
    }

    const group_sizes = getMinimalWidthRunGroupSizes(eligible_children.length);
    const grouped_children = getGroupNodeNames(eligible_children, group_sizes);
    const column_count = group_sizes.length;
    let child_index = 0;

    group_sizes.forEach(group_size => {
        const group_children = eligible_children.slice(child_index, child_index + group_size);
        if (group_size > 1) {
            stack_groups.push(group_children);
            group_children.forEach(child_node => { stacked_children.add(child_node); });
        }
        child_index += group_size;
    });

    logPositioning('child-stack-run', {
        parent: getNodeLogName(parent_node),
        run_children: eligible_children.map(getNodeLogName),
        eligible_count: eligible_children.length,
        max_stack_size: _layout_cfg.max_stack_size,
        column_count,
        group_sizes,
        grouped_children,
        stacked_children: eligible_children.filter(child_node => stacked_children.has(child_node)).map(getNodeLogName),
        unstacked_children: eligible_children.filter(child_node => !stacked_children.has(child_node)).map(getNodeLogName),
    });

    grouped_children.forEach((grouped_names, group_index) => {
        logPositioning('child-stack-decision', {
            parent: getNodeLogName(parent_node),
            group_index,
            group_size: group_sizes[group_index],
            children: grouped_names,
            stacked: group_sizes[group_index] > 1,
            reason: group_sizes[group_index] > 1 ? 'minimal-width multi-child column' : 'minimal-width singleton column',
        });
    });

    return {
        stacked_children,
        stack_groups,
        layout_order: buildChildLayoutOrder(children_nodes, stack_groups),
    };
}


function snapshotChildLayoutState() {
    return {
        level_boundary_node_leaf: window.level_boundary_node_leaf.slice(),
        level_heights: window.level_heights.slice(),
        max_stack_actual: window.max_stack_actual,
    };
}


function restoreChildLayoutState(snapshot) {
    window.level_boundary_node_leaf = snapshot.level_boundary_node_leaf.slice();
    window.level_heights = snapshot.level_heights.slice();
    window.max_stack_actual = snapshot.max_stack_actual;
}


function collectChildLayoutNodes(children_nodes) {
    const collected_nodes = new Set();
    children_nodes.forEach(child_node => {
        collectShiftableSubtreeNodes(child_node, collected_nodes);
    });
    return [...collected_nodes];
}


function removeNodeFromRows(rows, node) {
    if (!rows || !node || (node.level === undefined) || (node.sub_level === undefined)) return;
    const level_rows = rows[node.level];
    if (!level_rows || !level_rows[node.sub_level]) return;
    level_rows[node.sub_level] = level_rows[node.sub_level].filter(row_node => row_node !== node);
}


function resetChildLayoutNodes(nodes, rows) {
    nodes.forEach(node => {
        if (node.is_positioned) removeNodeFromRows(rows, node);
        node.is_positioned = false;
        node.left_neighbor = null;
        node.stacked = false;
        node.stack_top = false;
        node.x = undefined;
        node.y = undefined;
        node.min_x = undefined;
        node.max_x = undefined;
        node.sub_level = undefined;
    });
}


function getCurrentStackGroups(children_nodes) {
    const stack_groups = [];
    let current_group = [];

    children_nodes.forEach(child_node => {
        if (child_node.stacked) current_group.push(child_node);
        else if (current_group.length > 0) {
            stack_groups.push(current_group);
            current_group = [];
        }
    });

    if (current_group.length > 0) stack_groups.push(current_group);
    return stack_groups;
}


function removeMatchingStackGroup(stack_groups, target_group) {
    return stack_groups.filter(group => {
        if (group.length !== target_group.length) return true;
        return !group.every((child_node, index) => child_node === target_group[index]);
    });
}


function shouldAcceptChildLayoutTrial(current_layout, trial_layout) {
    const epsilon = 0.5;

    if (trial_layout.child_max_x < current_layout.child_max_x - epsilon) return true;
    if (trial_layout.child_max_x > current_layout.child_max_x + epsilon) return false;

    if (trial_layout.subtree_width < current_layout.subtree_width - epsilon) return true;
    if (trial_layout.subtree_width > current_layout.subtree_width + epsilon) return false;

    return trial_layout.child_min_x >= current_layout.child_min_x - epsilon;
}


function getStackDepthAtTopNode(group_nodes, top_node) {
    if (!top_node || !top_node.stack_top || !top_node.stacked) return 0;

    const top_index = group_nodes.indexOf(top_node);
    if (top_index < 0) return 0;

    let depth = 1;
    for (let index = top_index + 1; index < group_nodes.length; index++) {
        const candidate = group_nodes[index];
        if (!candidate.stacked || candidate.stack_top) break;
        depth += 1;
    }

    // Fallback: stacked nodes can be non-contiguous in array order.
    // In that case, detect stack depth from aligned x and deeper sub-levels.
    if (depth <= 1) {
        const epsilon = 0.5;
        const aligned_depth = (group_nodes || []).filter(candidate => {
            if (!candidate || !candidate.stacked) return false;
            if (!Number.isFinite(candidate.x) || !Number.isFinite(top_node.x)) return false;
            if (!Number.isFinite(candidate.sub_level) || !Number.isFinite(top_node.sub_level)) return false;
            if (Math.abs(candidate.x - top_node.x) > epsilon) return false;
            return candidate.sub_level >= top_node.sub_level;
        }).length;
        depth = Math.max(depth, aligned_depth);
    }

    return depth;
}


function compactLeftMostGroupNodeRight(group_nodes, rows, group_label = 'group') {
    const candidates = (group_nodes || []).filter(node => node && Number.isFinite(node.min_x) && Number.isFinite(node.max_x));
    if (candidates.length === 0) return { shift_x: 0, moved: false };

    const left_most_node = candidates
        .slice()
        .sort((a, b) => {
            if (a.min_x !== b.min_x) return a.min_x - b.min_x;
            return a.x - b.x;
        })[0];

    const stack_depth = getStackDepthAtTopNode(group_nodes || [], left_most_node);
    if (stack_depth > 1) {
        logPositioning('compact-left-most-subtree-skipped', {
            group: group_label,
            moved_node: getNodeLogName(left_most_node),
            reason: 'left-most-is-multi-node-stack-top',
            stack_depth,
        });
        return {
            shift_x: 0,
            moved: false,
            node: left_most_node,
            movement_space: null,
        };
    }

    const movement_space = getSubtreeHorizontalMovementSpace(left_most_node, rows, _layout_cfg.sibling_spacing);
    const shift_x = Number.isFinite(movement_space.right) ? Math.max(0, movement_space.right) : 0;
    const moved = shift_x >= 0.5;

    if (moved) {
        shiftSubtree(left_most_node, shift_x);
        logPositioning('compact-left-most-subtree', {
            group: group_label,
            moved_node: getNodeLogName(left_most_node),
            shift_x,
            movement_right: movement_space.right,
            right_blocker: movement_space.right_blocker,
            new_x: left_most_node.x,
            new_min_x: left_most_node.min_x,
            new_max_x: left_most_node.max_x,
        });
    }

    return {
        shift_x,
        moved,
        node: left_most_node,
        movement_space,
    };
}


function enforceBoundary(node) {
    if (!window.level_boundary_node_ancestor[node.level]) return;

    // Do not cross the vertical line below a female ancestor
    //if (node.type !== 'inlaw') {
        node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level].x + _layout_cfg.sibling_spacing);
    //}

    // Do not intersect with the horizontal line from a female to her parents (applies to siblings to the left of male ancestors)
    if (window.level_boundary_node_ancestor[node.level + 1] && (node.sub_level === 0) && (node.type === 'relative')) {
            if (node.parent_node && (node.parent_node.type === 'ancestor') && (node.parent_node.individual.pedigree_child_node) && (node.parent_node.individual.pedigree_child_node.individual.gender === 'M')) {
            node.x = Math.max(node.x, window.level_boundary_node_ancestor[node.level + 1].x + _layout_cfg.sibling_spacing);
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
    if (length === 0) node.x = _layout_cfg.tree_padding;
    else {
        node.x = rows[node.level][node.sub_level][length - 1].x + _layout_cfg.box_width + _layout_cfg.sibling_spacing;
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
    return node.x + _layout_cfg.box_width;
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
    if (!rows || (_layout_cfg.max_stack_size <= 1)) return fixed_nodes;

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
        const subtree_right = subtree_node.x + _layout_cfg.box_width + extra_gap;
        const subtree_top = subtree_node.y;
        const subtree_bottom = (subtree_node.y === undefined) ? undefined : subtree_node.y + _layout_cfg.box_height;

        other_nodes.forEach(other_node => {
            const other_top = other_node.y;
            const other_bottom = (other_node.y === undefined) ? undefined : other_node.y + _layout_cfg.box_height;

            let vertical_overlap = false;
            if (subtree_top !== undefined && subtree_bottom !== undefined && other_top !== undefined && other_bottom !== undefined) {
                vertical_overlap = subtree_top < other_bottom && other_top < subtree_bottom;
            } else {
                vertical_overlap = subtree_node.level === other_node.level && subtree_node.sub_level === other_node.sub_level;
            }

            if (!vertical_overlap) return;

            const other_left = other_node.x;
            const other_right = other_node.x + _layout_cfg.box_width;

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


