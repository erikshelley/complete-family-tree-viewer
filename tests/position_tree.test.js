import { describe, expect, it } from 'vitest';

import { loadBrowserScript } from './helpers/load-browser-script.js';

function loadPositioningContext(windowOverrides = {}) {
    const context = loadBrowserScript('src/js/position_tree.js');
    Object.assign(context.window, windowOverrides);
    return context;
}

function createChild(name, spouseCount = 0) {
    return {
        individual: { name },
        spouse_nodes: Array.from({ length: spouseCount }, () => ({})),
    };
}

describe('position tree helpers', () => {
    it('assigns row buckets and level metadata in positionTree', () => {
        const context = loadPositioningContext({
            box_width: 80,
            box_height: 50,
            h_spacing: 20,
            v_spacing: 20,
            level_spacing: 20,
            tree_padding: 50,
            vertical_inlaws: true,
            max_stack_size: 1,
        });

        context.positionMaleAncestor = (node, rows) => {
            rows[node.level][node.sub_level].push(node);
            node.is_positioned = true;
            node.x = 10;
            node.min_x = 10;
            node.max_x = 90;
        };

        const rootNode = {
            type: 'root',
            anchor_generation: 2,
            generation: 1,
            individual: { name: 'Root', gender: 'M' },
            spouse_nodes: [],
            children_nodes: [],
            father_node: null,
            mother_node: null,
        };

        const rows = context.positionTree(rootNode);

        expect(rootNode.level).toBe(2);
        expect(rootNode.sub_level).toBe(1);
        expect(rows[2]).toBeDefined();
        expect(rows[2][1]).toBeDefined();
        expect(rows[2][1][0]).toBe(rootNode);
    });

    it('returns centered column order for odd and even counts', () => {
        const context = loadPositioningContext();

        expect(context.getCenteredColumnOrder(5)).toEqual([2, 1, 3, 0, 4]);
        expect(context.getCenteredColumnOrder(4)).toEqual([1, 2, 0, 3]);
    });

    it('returns evenly spaced indexes across columns', () => {
        const context = loadPositioningContext();

        expect(context.getEvenlySpacedColumnIndexes(5, 2)).toEqual([1, 3]);
        expect(context.getEvenlySpacedColumnIndexes(3, 0)).toEqual([]);
    });

    it('computes minimal-width stack group sizes based on max stack size', () => {
        const context = loadPositioningContext({ max_stack_size: 3 });

        expect(context.getMinimalWidthRunGroupSizes(7).slice().sort((a, b) => a - b)).toEqual([2, 2, 3]);
        expect(context.getMinimalWidthRunGroupSizes(8).slice().sort((a, b) => a - b)).toEqual([2, 3, 3]);
    });

    it('decides stacking based on grandchildren and spouse presence', () => {
        const context = loadPositioningContext({ max_stack_size: 3 });

        const singleChild = createChild('Single');
        const marriedChild = createChild('Married', 1);

        expect(context.shouldChildBeStacked(singleChild, false)).toBe(true);
        expect(context.shouldChildBeStacked(singleChild, true)).toBe(true);
        expect(context.shouldChildBeStacked(marriedChild, true)).toBe(false);
    });

    it('does not stack when max_stack_size is 1', () => {
        const context = loadPositioningContext({ max_stack_size: 1 });
        const singleChild = createChild('Single');

        expect(context.shouldChildBeStacked(singleChild, false)).toBe(false);
    });

    it('plans ordered child stacks with minimal-width grouping', () => {
        const context = loadPositioningContext({ max_stack_size: 3, positioning_log_level: 'none' });

        const children = [
            createChild('A'),
            createChild('B'),
            createChild('C'),
            createChild('D'),
            createChild('E'),
            createChild('F'),
            createChild('G'),
        ];

        const plan = context.planOrderedChildStacks(createChild('Parent'), children, false);
        const stackDepths = plan.stack_groups.map(group => group.length).slice().sort((a, b) => a - b);

        expect(plan.stack_groups).toHaveLength(3);
        expect(stackDepths).toEqual([2, 2, 3]);
        expect(plan.stacked_children.size).toBe(7);
        expect(plan.layout_order.map(node => node.individual.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });

    it('balances multiple child stacks so no stack is more than one node deeper than another', () => {
        const context = loadPositioningContext({ max_stack_size: 3, positioning_log_level: 'none' });

        const children = [
            createChild('A'),
            createChild('B'),
            createChild('C'),
            createChild('D'),
        ];

        const plan = context.planOrderedChildStacks(createChild('Parent'), children, false);
        const stackDepths = plan.stack_groups.map(group => group.length);

        expect(stackDepths.slice().sort((a, b) => a - b)).toEqual([2, 2]);
        expect(Math.max(...stackDepths) - Math.min(...stackDepths)).toBeLessThanOrEqual(1);
        expect(plan.layout_order.map(node => node.individual.name)).toEqual(['A', 'B', 'C', 'D']);
    });

    it('balances two stack columns for five children at max stack size four', () => {
        const context = loadPositioningContext({ max_stack_size: 4, positioning_log_level: 'none' });

        const children = [
            createChild('A'),
            createChild('B'),
            createChild('C'),
            createChild('D'),
            createChild('E'),
        ];

        const plan = context.planOrderedChildStacks(createChild('Parent'), children, false);
        const stackDepths = plan.stack_groups.map(group => group.length);

        expect(stackDepths.slice().sort((a, b) => a - b)).toEqual([2, 3]);
        expect(Math.max(...stackDepths) - Math.min(...stackDepths)).toBeLessThanOrEqual(1);
        expect(plan.layout_order.map(node => node.individual.name)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('thirteen child nodes with max stack size three split into balanced 2 and 3 node stacks', () => {
        const context = loadPositioningContext({ max_stack_size: 3, positioning_log_level: 'none' });

        const children = [
            createChild('A'),
            createChild('B'),
            createChild('C'),
            createChild('D'),
            createChild('E'),
            createChild('F'),
            createChild('G'),
            createChild('H'),
            createChild('I'),
            createChild('J'),
            createChild('K'),
            createChild('L'),
            createChild('M'),
        ];

        const plan = context.planOrderedChildStacks(createChild('Parent'), children, false);
        const stackDepths = plan.stack_groups.map(group => group.length);

        expect(stackDepths.slice().sort((a, b) => a - b)).toEqual([2, 2, 3, 3, 3]);
        expect(Math.max(...stackDepths) - Math.min(...stackDepths)).toBeLessThanOrEqual(1);
        expect(plan.stacked_children.size).toBe(13);
        expect(plan.layout_order.map(node => node.individual.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']);
    });

    it('thirteen child nodes with max stack size four split into balanced 3 and 4 node stacks', () => {
        const context = loadPositioningContext({ max_stack_size: 4, positioning_log_level: 'none' });

        const children = [
            createChild('A'),
            createChild('B'),
            createChild('C'),
            createChild('D'),
            createChild('E'),
            createChild('F'),
            createChild('G'),
            createChild('H'),
            createChild('I'),
            createChild('J'),
            createChild('K'),
            createChild('L'),
            createChild('M'),
        ];

        const plan = context.planOrderedChildStacks(createChild('Parent'), children, false);
        const stackDepths = plan.stack_groups.map(group => group.length);

        expect(stackDepths.slice().sort((a, b) => a - b)).toEqual([3, 3, 3, 4]);
        expect(Math.max(...stackDepths) - Math.min(...stackDepths)).toBeLessThanOrEqual(1);
        expect(plan.stacked_children.size).toBe(13);
        expect(plan.layout_order.map(node => node.individual.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']);
    });

    it('accepts or rejects child layout trials by max width then subtree width', () => {
        const context = loadPositioningContext();

        const current = { child_max_x: 100, subtree_width: 50, child_min_x: 20 };
        const betterMax = { child_max_x: 99, subtree_width: 60, child_min_x: 10 };
        const worseMax = { child_max_x: 101, subtree_width: 40, child_min_x: 10 };
        const equalMaxBetterWidth = { child_max_x: 100.2, subtree_width: 49, child_min_x: 15 };
        const equalMaxEqualWidthBetterLeft = { child_max_x: 100.1, subtree_width: 50.1, child_min_x: 21 };

        expect(context.shouldAcceptChildLayoutTrial(current, betterMax)).toBe(true);
        expect(context.shouldAcceptChildLayoutTrial(current, worseMax)).toBe(false);
        expect(context.shouldAcceptChildLayoutTrial(current, equalMaxBetterWidth)).toBe(true);
        expect(context.shouldAcceptChildLayoutTrial(current, equalMaxEqualWidthBetterLeft)).toBe(true);
    });

    it('returns stack depth for a stack top and zero for non-stack-top nodes', () => {
        const context = loadPositioningContext();

        const top = { stacked: true, stack_top: true };
        const middle = { stacked: true, stack_top: false };
        const bottom = { stacked: true, stack_top: false };
        const nextTop = { stacked: true, stack_top: true };

        const depth = context.getStackDepthAtTopNode([top, middle, bottom, nextTop], top);
        const notTopDepth = context.getStackDepthAtTopNode([top, middle, bottom], middle);

        expect(depth).toBe(3);
        expect(notTopDepth).toBe(0);
    });

    it('detects stack depth from layout geometry when stacked members are non-contiguous in array order', () => {
        const context = loadPositioningContext();

        const top = { stacked: true, stack_top: true, x: 120, sub_level: 1 };
        const unrelated = { stacked: false, stack_top: false, x: 240, sub_level: 1 };
        const below = { stacked: true, stack_top: false, x: 120, sub_level: 2 };

        const depth = context.getStackDepthAtTopNode([top, unrelated, below], top);

        expect(depth).toBe(2);
    });

    it('does not compact left-most node when it is the top of a stack deeper than one', () => {
        const context = loadPositioningContext({
            h_spacing: 20,
            box_width: 80,
        });

        const leftTop = {
            individual: { name: 'Left Top' },
            x: 100,
            min_x: 100,
            max_x: 180,
            stacked: true,
            stack_top: true,
        };
        const leftBelow = {
            individual: { name: 'Left Below' },
            x: 100,
            min_x: 100,
            max_x: 180,
            stacked: true,
            stack_top: false,
        };
        const rightNode = {
            individual: { name: 'Right' },
            x: 320,
            min_x: 320,
            max_x: 400,
            stacked: false,
            stack_top: false,
        };

        let shiftCalled = false;
        context.getSubtreeHorizontalMovementSpace = () => ({ left: 0, right: 90, left_blocker: null, right_blocker: null });
        context.shiftSubtree = () => { shiftCalled = true; };

        const result = context.compactLeftMostGroupNodeRight([leftTop, leftBelow, rightNode], [], 'children');

        expect(result.moved).toBe(false);
        expect(result.shift_x).toBe(0);
        expect(shiftCalled).toBe(false);
        expect(leftTop.x).toBe(100);
    });

    it('normalizes tree x positions to be non-negative with padding', () => {
        const context = loadPositioningContext({ tree_padding: 100 });

        const rows = [
            [
                [
                    { x: -40, min_x: -60, max_x: 20 },
                    { x: 20, min_x: 10, max_x: 80 },
                ],
            ],
        ];

        context.normalizeTreeX(rows);

        expect(rows[0][0][0].x).toBeGreaterThanOrEqual(100);
        expect(rows[0][0][1].x).toBeGreaterThanOrEqual(100);
        // normalizeTreeX shifts all tracked x-values by a shared delta.
        expect(rows[0][0][0].x - rows[0][0][0].min_x).toBe(20);
        expect(rows[0][0][1].x - rows[0][0][1].min_x).toBe(10);
    });

    it('positionChildren returns bounds covering positioned children', () => {
        const context = loadPositioningContext({
            max_stack_size: 1,
            vertical_inlaws: true,
            box_width: 80,
            h_spacing: 20,
            v_spacing: 20,
        });

        const children = [
            {
                individual: { name: 'Child A', is_root: false },
                spouse_nodes: [],
                children_nodes: [],
                stacked: false,
                stack_top: false,
            },
            {
                individual: { name: 'Child B', is_root: false },
                spouse_nodes: [],
                children_nodes: [],
                stacked: false,
                stack_top: false,
            },
        ];

        const parent = {
            type: 'root',
            individual: { name: 'Parent', gender: 'M' },
            spouse_nodes: [],
            children_nodes: children,
            sub_level: 0,
            x: 100,
        };

        context.collectChildLayoutNodes = () => children;
        context.snapshotChildLayoutState = () => ({});
        context.planOrderedChildStacks = () => ({
            stacked_children: new Set(),
            stack_groups: [],
            layout_order: children,
        });
        context.layoutChildrenWithPlan = () => {
            children[0].min_x = 120;
            children[0].max_x = 200;
            children[1].min_x = 230;
            children[1].max_x = 310;
            return {
                child_min_x: 120,
                child_max_x: 310,
                subtree_width: 190,
            };
        };

        const [childMinX, childMaxX] = context.positionChildren(parent, [], false);

        expect(childMinX).toBe(120);
        expect(childMaxX).toBe(310);
        const minChildMin = Math.min(...children.map(child => child.min_x));
        const maxChildMax = Math.max(...children.map(child => child.max_x));
        expect(childMinX).toBeLessThanOrEqual(minChildMin);
        expect(childMaxX).toBeGreaterThanOrEqual(maxChildMax);
    });

    it('positionChildren keeps final child stack groups balanced for thirteen children at max stack size four', () => {
        const context = loadPositioningContext({
            max_stack_size: 4,
            vertical_inlaws: true,
            box_width: 80,
            h_spacing: 20,
            v_spacing: 20,
            level_boundary_node_leaf: [],
            level_boundary_node_ancestor: [],
            level_heights: [],
            max_stack_actual: 1,
            positioning_log_level: 'none',
        });

        const children = Array.from({ length: 13 }, (_, index) => ({
            individual: { name: `Child ${index + 1}`, is_root: false },
            spouse_nodes: [],
            children_nodes: [],
            stacked: false,
            stack_top: false,
            left_neighbor: null,
        }));

        const parent = {
            type: 'root',
            individual: { name: 'Parent', gender: 'M' },
            spouse_nodes: [],
            children_nodes: children,
            sub_level: 0,
            level: 0,
            x: 100,
        };

        context.positionTree = (node, rows = []) => {
            node.level = 0;
            if (!rows[0]) rows[0] = [];
            if (!rows[0][node.sub_level]) rows[0][node.sub_level] = [];
            rows[0][node.sub_level].push(node);
            node.is_positioned = true;
            node.x = 100 + (node.sub_level * 30);
            node.min_x = node.x;
            node.max_x = node.x + context.window.box_width;
            return rows;
        };

        // Force the release heuristic to evaluate but never replace the balanced initial plan.
        context.shouldAcceptChildLayoutTrial = () => false;

        const rows = [[]];
        context.positionChildren(parent, rows, false);

        const finalStackGroups = [];
        let currentGroup = [];

        children.forEach(child => {
            if (child.stack_top && currentGroup.length > 0) {
                finalStackGroups.push(currentGroup);
                currentGroup = [];
            }
            if (child.stacked) currentGroup.push(child);
        });
        if (currentGroup.length > 0) finalStackGroups.push(currentGroup);

        const stackDepths = finalStackGroups.map(group => group.length).slice().sort((a, b) => a - b);

        expect(stackDepths).toEqual([3, 3, 3, 4]);
        expect(Math.max(...stackDepths) - Math.min(...stackDepths)).toBeLessThanOrEqual(1);
        expect(children.every(child => child.stacked)).toBe(true);
    });

    it('positionChildren compacts the left-most child subtree to the right before parent centering', () => {
        const context = loadPositioningContext({
            max_stack_size: 1,
            vertical_inlaws: true,
            box_width: 80,
            h_spacing: 20,
            v_spacing: 20,
            level_boundary_node_leaf: [],
            level_boundary_node_ancestor: [],
            level_heights: [],
        });

        const children = [
            {
                individual: { name: 'Child A', is_root: false },
                spouse_nodes: [],
                children_nodes: [],
                stacked: false,
                stack_top: false,
                left_neighbor: null,
            },
            {
                individual: { name: 'Child B', is_root: false },
                spouse_nodes: [],
                children_nodes: [],
                stacked: false,
                stack_top: false,
                left_neighbor: null,
            },
        ];

        const parent = {
            type: 'root',
            individual: { name: 'Parent', gender: 'M' },
            spouse_nodes: [],
            children_nodes: children,
            sub_level: 0,
            level: 0,
            x: 100,
        };

        context.collectChildLayoutNodes = () => children;
        context.snapshotChildLayoutState = () => ({
            level_boundary_node_leaf: [],
            level_heights: [],
            max_stack_actual: 1,
        });
        context.restoreChildLayoutState = () => {};
        context.planOrderedChildStacks = () => ({
            stacked_children: new Set(),
            stack_groups: [],
            layout_order: children,
        });

        context.layoutChildrenWithPlan = () => {
            children[0].x = 100;
            children[0].min_x = 100;
            children[0].max_x = 180;
            children[1].x = 340;
            children[1].min_x = 340;
            children[1].max_x = 420;

            return {
                child_min_x: 100,
                child_max_x: 420,
                subtree_width: 320,
            };
        };

        context.getSubtreeHorizontalMovementSpace = node => {
            if (node === children[0]) {
                return { left: 0, right: 80, left_blocker: null, right_blocker: null };
            }
            return { left: 0, right: 0, left_blocker: null, right_blocker: null };
        };

        context.shiftSubtree = (node, shiftX) => {
            node.x += shiftX;
            node.min_x += shiftX;
            node.max_x += shiftX;
        };

        const [childMinX, childMaxX] = context.positionChildren(parent, [[]], false);

        expect(children[0].x).toBe(180);
        expect(children[0].min_x).toBe(180);
        expect(children[0].max_x).toBe(260);
        expect(childMinX).toBe(180);
        expect(childMaxX).toBe(420);
    });
});