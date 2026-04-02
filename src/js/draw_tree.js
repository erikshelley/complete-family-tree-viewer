// Tree drawing and visualization functionality using D3.js

// Pixel gap removed from the family-tree-div bounding box to obtain usable SVG space.
// Values come from the CSS padding on #family-tree-div (12px left + 12px right = 24px)
// and the combined vertical offset including bottom padding and status-bar clearance.
const DIV_PADDING_H = 24;
const DIV_PADDING_V = 40;

// Active rendering configuration for the current drawTree call.
// Set from the config argument if provided, otherwise falls back to window.
let _draw_cfg = window;

async function drawTree(rows, config) {
    _draw_cfg = (config !== undefined) ? (config ?? window) : (_draw_cfg ?? window);
    _fitTextInBoxCache = new Map();
    _textShadowFilterCreated = false;
    window.tree_rows = rows;
    window.connection_path_ids = ((_draw_cfg.highlight_type || 'pedigree') === 'connection')
        ? findConnectionPath(window.connection_selected_id)
        : new Set();
    promoteConnectionNodesInStacks(rows);
    // Track earliest birth year of displayed nodes
    let earliest_birth = null;
    for (const level of rows) {
        for (const sub_level of level ? level : []) {
            for (const node of sub_level) {
                const year = parseInt(node.individual && node.individual.birth, 10);
                if (year && (!earliest_birth || year < earliest_birth)) {
                    earliest_birth = year;
                }
            }
        }
    }
    window.earliest_birth_year = earliest_birth;
    window.min_text_size = _draw_cfg.text_size;
    window.max_text_size = 6;

    // Set SVG dimensions
    const bounding_box = family_tree_div.getBoundingClientRect();
    let svg_width = bounding_box.width - DIV_PADDING_H;
    let svg_height = bounding_box.height - DIV_PADDING_V;

    // Initial SVG
    const svg = d3.select('#family-tree-div')
        .append('svg')
        .attr('width', svg_width)
        .attr('height', svg_height)
        .attr('overflow', 'visible');

    const [max_x, max_y, node_count] = getMaximumDimensions(rows);
    const scale_x = max_x / svg_width;
    const scale_y = max_y / svg_height;
    const max_scale = Math.max(scale_x, scale_y);
    if (scale_x < scale_y) {
        svg_width *= scale_x / scale_y;
        svg.attr('width', svg_width);
    }
    if (scale_x > scale_y) {
        svg_height *= scale_y / scale_x;
        svg.attr('height', svg_height);
    }
    svg.attr('viewBox', `0 0 ${max_scale * svg_width} ${max_scale * svg_height}`);
    const zoom = d3.zoom().scaleExtent([1, 10 * max_scale]).on("zoom", zoomed);
    svg.call(zoom);
    svg.node().__zoom_behavior = zoom;
    svg.node().__orig_svg_width = svg_width;
    svg.node().__orig_svg_height = svg_height;
    svg.node().__max_scale = max_scale;
    const svg_node = svg.append("g");
    function zoomed({transform}) { svg_node.attr("transform", transform); }

    // Draw background rectangle
    svg_node.append('rect')
        .attr('width', max_x)
        .attr('height', max_y)
        .attr('fill', _draw_cfg.transparent_bg_rect ? "rgba(0,0,0,0)" : _draw_cfg.tree_color || "#000");

    drawNonBoldLinks(svg_node, rows, false);
    drawBoldLinks(svg_node, rows, false);
    drawCircles(svg_node, rows, false);
    drawNonBoldLinks(svg_node, rows, true);
    drawBoldLinks(svg_node, rows, true);
    drawCircles(svg_node, rows, true);
    drawNodes(svg_node, rows);

    const root_name_span = document.getElementById('root-name');
    root_name_span.textContent = '\u00A0\u00A0\u2022\u00A0\u00A0' + selected_individual.name;

    setStatusBarContent(document.getElementById('status-bar-div'), node_count, max_x, max_y);

}

function setStatusBarContent(status_bar_div, node_count, max_x, max_y) {
    const bull = '\u00A0\u00A0\u2022\u00A0\u00A0';
    const people = (node_count === '1')
        ? `${node_count}\u00A0Person\u00A0Shown`
        : `${node_count} People`;
    const w = Math.ceil(max_x);
    const h = Math.ceil(max_y);
    let text = `${people}${bull}${w.toLocaleString()} x ${h.toLocaleString()}`;
    text += `${bull}${(w / 300).toFixed(1)}" x ${(h / 300).toFixed(1)}" @ 300 DPI`;
    text += `${bull}Min Font: ${window.min_text_size}px`;
    text += `${bull}Max Font: ${window.max_text_size}px`;
    if (window.earliest_birth_year) text += `${bull}Earliest Birth: ${window.earliest_birth_year}`;
    status_bar_div.textContent = text;
}

function treeKeyboardEvent(event) {
    const svg_node = document.querySelector('#family-tree-div svg');
    if (!svg_node) return;
    const zoom = svg_node.__zoom_behavior;
    const max_scale = svg_node.__max_scale;
    if (!zoom || !max_scale) return;
    const bounding_box = family_tree_div.getBoundingClientRect();
    const svg = d3.select(svg_node);
    const k = d3.zoomTransform(svg_node).k;
    const step_x = (bounding_box.width - DIV_PADDING_H) * max_scale * 0.1 / k;
    const step_y = (bounding_box.height - DIV_PADDING_V) * max_scale * 0.1 / k;
    const key = event.key;
    switch (key) {
    case 'Escape':
        svg.transition().call(zoom.transform, d3.zoomIdentity);
        break;
    case '+':
    case '=':
        svg.transition().call(zoom.scaleBy, 2);
        break;
    case '-':
        svg.transition().call(zoom.scaleBy, 0.5);
        break;
    case 'ArrowLeft':
        svg.call(zoom.translateBy, step_x, 0);
        break;
    case 'ArrowRight':
        svg.call(zoom.translateBy, -step_x, 0);
        break;
    case 'ArrowUp':
        svg.call(zoom.translateBy, 0, step_y);
        break;
    case 'ArrowDown':
        svg.call(zoom.translateBy, 0, -step_y);
        break;
    }
}

function findConnectionPath(target_id) {
    if (!window.root_node || !target_id) return new Set();
    const queue = [window.root_node];
    const visited = new Set([window.root_node]);
    const parent_map = new Map();
    while (queue.length > 0) {
        const current = queue.shift();
        if (current.individual.id === target_id) {
            const path_nodes = [];
            let node = current;
            while (node) {
                path_nodes.push(node);
                node = parent_map.get(node);
            }
            const path_ids = new Set(path_nodes.map(n => n.individual.id));
            // Ancestors come in couples — include the pedigree spouse of every on-path node
            for (const n of path_nodes) {
                if (n.pedigree_spouse_node) path_ids.add(n.pedigree_spouse_node.individual.id);
            }
            return path_ids;
        }
        const neighbors = [
            current.father_node,
            current.mother_node,
            current.pedigree_spouse_node,
            ...(current.spouse_nodes || []),
            ...(current.children_nodes || []),
        ];
        if (current.parent_node) neighbors.push(current.parent_node);
        for (const neighbor of neighbors) {
            if (neighbor && !visited.has(neighbor)) {
                visited.add(neighbor);
                parent_map.set(neighbor, current);
                queue.push(neighbor);
            }
        }
    }
    return new Set();
}

function promoteConnectionNodesInStacks(rows) {
    if (!window.connection_path_ids || window.connection_path_ids.size === 0) return;
    rows.forEach(level => {
        if (!level) return;
        const stacks_by_x = new Map();
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                if (node.stacked) {
                    if (!stacks_by_x.has(node.x)) stacks_by_x.set(node.x, []);
                    stacks_by_x.get(node.x).push(node);
                }
            });
        });
        stacks_by_x.forEach(stack_nodes => {
            const top_node = stack_nodes.find(n => n.stack_top);
            if (!top_node || window.connection_path_ids.has(top_node.individual.id)) return;
            const path_node = stack_nodes.find(n => !n.stack_top && window.connection_path_ids.has(n.individual.id));
            if (!path_node) return;
            const saved_y = top_node.y;
            top_node.y = path_node.y;
            path_node.y = saved_y;
            top_node.stack_top = false;
            path_node.stack_top = true;
        });
    });
}

function getLinkHighlightFactor(node, linked_node) {
    const ht = window.highlight_type || 'pedigree';
    if (ht === 'none' || ht === 'root') return 1;
    if (ht === 'connection') {
        const on_path = window.connection_path_ids.has(node.individual.id);
        if (linked_node !== undefined) return (on_path && window.connection_path_ids.has(linked_node.individual.id)) ? _draw_cfg.special_highlight_percent / 100 : 1;
        return on_path ? _draw_cfg.special_highlight_percent / 100 : 1;
    }
    return (node.individual.is_descendant || node.individual.is_root) ? _draw_cfg.special_highlight_percent / 100 : 1;
}

function getAncestorLinkHighlightFactor(node) {
    const ht = window.highlight_type || 'pedigree';
    if (ht === 'none' || ht === 'root') return 1;
    if (ht === 'connection') return (node && window.connection_path_ids.has(node.individual.id)) ? _draw_cfg.special_highlight_percent / 100 : 1;
    return _draw_cfg.special_highlight_percent / 100;
}

function isNodeHighlighted(node) {
    const ht = window.highlight_type || 'pedigree';
    if (ht === 'none') return false;
    if (ht === 'root') return !!node.individual.is_root;
    if (ht === 'connection') return window.connection_path_ids.has(node.individual.id);
    return (node.type === 'ancestor') || !!node.individual.is_root || !!node.individual.is_descendant;
}

// Maps a point from layout space (sibling-axis = s, generation-axis = g) to SVG (x, y).
// For vertical trees the sibling axis is x and the generation axis is y (identity).
// For horizontal trees the axes are swapped: s → SVG-y, g → SVG-x.
function mapCoords(s, g) {
    if (_draw_cfg.tree_orientation === 'horizontal') return { x: g, y: s };
    return { x: s, y: g };
}

// Rendered node width (SVG x dimension) for the current orientation.
// Rendered node width (SVG x dimension).  Always box_width so that the user-visible
// "Node Width" setting directly controls the horizontal extent of each node on screen.
function nodeW() { return _draw_cfg.box_width; }

// y-coordinate of a node's generation-lower edge (the side that faces toward children /
// lower-generation nodes).  In vertical trees this is the bottom (node.y + box_height)
// because children sit at larger y.  In horizontal trees, after the y-mirror that places
// ancestors to the right, children sit at smaller y, so the child-facing edge is the left
// side (node.y).
function genLowerEdgeY(node) {
    return _draw_cfg.tree_orientation === 'horizontal' ? node.y : node.y + _draw_cfg.box_height;
}

// y-coordinate of a node's generation-higher edge (the side that faces toward ancestors /
// higher-generation nodes).  In horizontal mode the node occupies [node.y, node.y+box_width]
// in layout-y space (box_width = generation span after the semantics fix), so the
// ancestor-facing edge is node.y + box_width.  In vertical mode it is node.y.
function genHigherEdgeY(node) {
    return _draw_cfg.tree_orientation === 'horizontal' ? node.y + _draw_cfg.box_width : node.y;
}

// Rendered node height (SVG y dimension).  Always box_height so that the user-visible
// "Node Height" setting directly controls the vertical extent of each node on screen.
function nodeH() { return _draw_cfg.box_height; }

// Half the sibling-axis visual span of a node.  In vertical mode a node is box_width wide
// on screen so the sibling-centre offset is box_width/2.  In horizontal mode the node's
// vertical (sibling-axis) screen extent is box_height, so the centre offset is box_height/2.
function nodeHalf() {
    return _draw_cfg.tree_orientation === 'horizontal' ? _draw_cfg.box_height / 2 : _draw_cfg.box_width / 2;
}

function drawNonBoldLinks(svg_node, rows, highlight_pass = null) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                const [hue, chroma, luminance] = getNodeHCL(node, false);

                // Draw link between relative and spouse
                if (node.type === 'relative' || node.type === 'root') {
                    if (!window.beside_inlaws) {
                        node.spouse_nodes.filter(spouse_node => !(spouse_node.stacked && !spouse_node.stack_top)).forEach(spouse_node => {
                            const factor = getLinkHighlightFactor(node, spouse_node);
                            if (highlight_pass !== null && (factor !== 1) !== highlight_pass) return;
                            const inlaw_color = d3.hcl(hue, 0, luminance * (_draw_cfg.inlaw_link_highlight_percent / 100) * factor);
                            drawLink(svg_node, inlaw_color, {x: node.x + nodeHalf(), y: genLowerEdgeY(node)}, 
                                                            {x: spouse_node.x + nodeHalf(), y: genHigherEdgeY(spouse_node)}, 'inlaw', factor);
                        });
                    }
                    else {
                        node.spouse_nodes.forEach(spouse_node => {
                            const factor = getLinkHighlightFactor(node, spouse_node);
                            if (highlight_pass !== null && (factor !== 1) !== highlight_pass) return;
                            const inlaw_color = d3.hcl(hue, 0, luminance * (_draw_cfg.inlaw_link_highlight_percent / 100) * factor);
                            drawLink(svg_node, inlaw_color, {x: node.x + nodeHalf(),         y: genHigherEdgeY(node)}, 
                                                            {x: spouse_node.x + nodeHalf(),  y: genLowerEdgeY(spouse_node)}, 'inlaw-center', factor);
                        });
                    }
                }

                // Draw link between ancestor and spouse
                if (node.type === 'ancestor') {
                    node.spouse_nodes.filter(spouse_node => !(spouse_node.stacked && !spouse_node.stack_top)).forEach(spouse_node => {
                        const factor = getLinkHighlightFactor(node, spouse_node);
                        if (highlight_pass !== null && (factor !== 1) !== highlight_pass) return;
                        const inlaw_color = d3.hcl(hue, 0, luminance * (_draw_cfg.inlaw_link_highlight_percent / 100) * factor);
                        drawLink(svg_node, inlaw_color, {x: node.x + nodeHalf(),         y: genHigherEdgeY(node)}, 
                                                        {x: spouse_node.x + nodeHalf(),  y: genLowerEdgeY(spouse_node)}, 'inlaw-center', factor);
                    });
                }

                // Draw link between in-law and child at top of stack
                if (node.type === 'inlaw') {
                    if (!window.beside_inlaws) {
                        node.children_nodes.filter(child_node => !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                            const factor = getLinkHighlightFactor(node, child_node);
                            if (highlight_pass !== null && (factor !== 1) !== highlight_pass) return;
                            const [chue, cchroma, clum] = getNodeHCL(child_node, false);
                            const child_color = d3.hcl(chue, cchroma, clum * (_draw_cfg.link_highlight_percent / 100) * factor);
                            drawLink(svg_node, child_color, {x: node.x + nodeHalf(), y: genLowerEdgeY(node)}, 
                                                            {x: child_node.x + nodeHalf(), y: genHigherEdgeY(child_node)}, null, factor);
                        });
                    }
                    else {
                        let left = -_draw_cfg.sibling_spacing / 2;
                        let right = nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2;
                        let x_offset = (node.individual.gender === 'M') ? right : left;
                        if (node.spouse_nodes[0].type === 'ancestor') x_offset = (x_offset === right) ? left : right;
                        let radius = _draw_cfg.link_width * 1.5;
                        node.children_nodes.filter(child_node => !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                            const factor = getLinkHighlightFactor(node, child_node);
                            if (highlight_pass !== null && (factor !== 1) !== highlight_pass) return;
                            const [chue, cchroma, clum] = getNodeHCL(child_node, false);
                            const child_color = d3.hcl(chue, cchroma, clum * (_draw_cfg.link_highlight_percent / 100) * factor);
                            const genMidOffset = (_draw_cfg.tree_orientation === 'horizontal' ? -1 : 1) * radius;
                            drawLink(svg_node, child_color, {x: node.x + x_offset, y: (genLowerEdgeY(node) + genHigherEdgeY(node)) / 2 + genMidOffset}, 
                                                            {x: child_node.x + nodeHalf(), y: genHigherEdgeY(child_node)}, null, factor);
                        });
                    }
                }

                // Draw link between ancestor and child at top of stack
                if (node.type === 'ancestor' && node.individual.gender === 'M') {
                    node.children_nodes.filter(child_node => !child_node.individual.is_root && !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                        const factor = getLinkHighlightFactor(node, child_node);
                        if (highlight_pass !== null && (factor !== 1) !== highlight_pass) return;
                        const [chue, cchroma, clum] = getNodeHCL(child_node, false);
                        const child_color = d3.hcl(chue, cchroma, clum * (_draw_cfg.link_highlight_percent / 100) * factor);
                        drawLink(svg_node, child_color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2, y: genLowerEdgeY(node)}, 
                                                        {x: child_node.x + nodeHalf(),              y: genHigherEdgeY(child_node)}, null, factor);
                    });
                }

                // Stacked links — use the node's own factor (no distinct second endpoint)
                const self_factor = getLinkHighlightFactor(node);

                // Draw link stacked child and previous stacked child
                if ((node.type === 'relative') && node.stacked && !node.stack_top) {
                    if (highlight_pass === null || (self_factor !== 1) === highlight_pass) {
                        const color = d3.hcl(hue, chroma, luminance * (_draw_cfg.link_highlight_percent / 100) * self_factor);
                        drawLink(svg_node, color, {x: node.x + nodeHalf(), y: genHigherEdgeY(node)}, 
                                                  {x: node.x + nodeHalf(), y: genHigherEdgeY(node) + (_draw_cfg.tree_orientation === 'horizontal' ? _draw_cfg.generation_spacing : -_draw_cfg.generation_spacing)}, null, self_factor);
                    }
                }

                // Draw link between stacked in-law and previous stacked in-law
                if ((node.type === 'inlaw') && node.stacked && !node.stack_top) {
                    if (highlight_pass === null || (self_factor !== 1) === highlight_pass) {
                        const inlaw_color = d3.hcl(hue, 0, luminance * (_draw_cfg.inlaw_link_highlight_percent / 100) * self_factor);
                        drawLink(svg_node, inlaw_color, {x: node.x + nodeHalf(), y: genHigherEdgeY(node)},
                                                        {x: node.x + nodeHalf(), y: genHigherEdgeY(node) + (_draw_cfg.tree_orientation === 'horizontal' ? _draw_cfg.generation_spacing : -_draw_cfg.generation_spacing)}, 'inlaw', self_factor);
                    }
                }

            });
        });
    });
}


function drawBoldLinks(svg_node, rows, highlight_pass = null) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                if (node.type === 'ancestor' && node.individual.gender === 'M') {

                    const anc_factor = getAncestorLinkHighlightFactor(node);
                    if (highlight_pass !== null && (anc_factor !== 1) !== highlight_pass) return;

                    let [hue, chroma, luminance] = getNodeHCL(node, false);
                    let color = d3.hcl(hue, chroma, luminance * anc_factor * (_draw_cfg.link_highlight_percent / 100));

                    // Draw links from father and mother to center point
                    if (!window.beside_inlaws) {
                        drawLink(svg_node, color, {x: node.x + nodeHalf(),                    y: genHigherEdgeY(node)}, 
                                                  {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2, y: genLowerEdgeY(node)}, 'center', anc_factor);
                        drawLink(svg_node, color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing + nodeHalf(), y: genHigherEdgeY(node)}, 
                                                  {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2,          y: genLowerEdgeY(node)}, 'center', anc_factor);
                    }
                    else {
                        drawLink(svg_node, color, {x: node.x + nodeHalf(),                                             y: genHigherEdgeY(node)}, 
                                                  {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing + nodeHalf(), y: genLowerEdgeY(node)}, 'center', anc_factor);
                    }

                    if (node.children_nodes.length > 0) {
                        [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                        color = d3.hcl(hue, chroma, luminance * anc_factor * (_draw_cfg.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and root child
                    if (!window.beside_inlaws) {
                        node.children_nodes.filter(child_node => child_node.individual.is_root).forEach(child_node => {
                            drawLink(svg_node, color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2, y: genLowerEdgeY(node)}, 
                                                      {x: child_node.x + nodeHalf(),              y: genHigherEdgeY(child_node)}, null, anc_factor);
                        });
                    }
                    else {
                        node.children_nodes.filter(child_node => child_node.individual.is_root).forEach(child_node => {
                            drawLink(svg_node, color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2, y: (genLowerEdgeY(node) + genHigherEdgeY(node)) / 2}, 
                                                      {x: child_node.x + nodeHalf(),              y: genHigherEdgeY(child_node)}, null, anc_factor);
                        });
                    }

                    if (node.individual.pedigree_child_node) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.pedigree_child_node, false);
                        color = d3.hcl(hue, chroma, luminance * anc_factor * (_draw_cfg.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and pedigree child
                    if (node.individual.pedigree_child_node) {
                        if (!window.beside_inlaws) {
                            drawLink(svg_node, color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2,             y: genLowerEdgeY(node)}, 
                                                      {x: node.individual.pedigree_child_node.x + nodeHalf(), y: genHigherEdgeY(node.individual.pedigree_child_node)}, null, anc_factor);
                        }
                        else {
                            drawLink(svg_node, color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2,             y: (genLowerEdgeY(node) + genHigherEdgeY(node)) / 2}, 
                                                      {x: node.individual.pedigree_child_node.x + nodeHalf(), y: genHigherEdgeY(node.individual.pedigree_child_node)}, null, anc_factor);
                        }
                    }

                    if (node.individual.duplicate_pedigree_child_node) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.duplicate_pedigree_child_node, false);
                        color = d3.hcl(hue, chroma, luminance * anc_factor * (_draw_cfg.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and duplicate pedigree child
                    if (node.individual.duplicate_pedigree_child_node) {
                        drawLink(svg_node, color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2,                       y: genLowerEdgeY(node)}, 
                                                  {x: node.individual.duplicate_pedigree_child_node.x + nodeHalf(), y: genHigherEdgeY(node.individual.duplicate_pedigree_child_node)}, 
                                                  'duplicate', anc_factor);
                    }
                }
            });
        });
    });
}


function drawCircles(svg_node, rows, highlight_pass = null) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                if (window.beside_inlaws) {
                    if ((node.type === 'inlaw') && (node.children_nodes.length > 0)) {
                        const factor = getLinkHighlightFactor(node);
                        if (highlight_pass === null || (factor !== 1) === highlight_pass) {
                            const [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                            const color = d3.hcl(hue, chroma, luminance * (_draw_cfg.link_highlight_percent / 100) * factor);
                            let left = -_draw_cfg.sibling_spacing / 2;
                            let right = nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2;
                            let x_offset = (node.individual.gender === 'M') ? right : left;
                            if (node.spouse_nodes[0].type === 'ancestor') x_offset = (x_offset === right) ? left : right;
                            let radius = (factor !== 1 ? (_draw_cfg.highlighted_link_width || _draw_cfg.link_width) : _draw_cfg.link_width) * 1.5;
                            drawCircle(svg_node, color, {x: node.x + x_offset, y: (genLowerEdgeY(node) + genHigherEdgeY(node)) / 2}, radius);
                        }
                    }
                    if ((node.type === 'ancestor') && (node.individual.gender === 'M')) {
                        const factor = getAncestorLinkHighlightFactor(node);
                        if (highlight_pass === null || (factor !== 1) === highlight_pass) {
                            const [hue, chroma, luminance] = getNodeHCL(node.individual.pedigree_child_node ? node.individual.pedigree_child_node : window.root_node, false);
                            const color = d3.hcl(hue, chroma, luminance * factor * (_draw_cfg.link_highlight_percent / 100));
                            drawCircle(svg_node, color, {x: node.x + nodeHalf() + nodeHalf() + _draw_cfg.sibling_spacing / 2, y: (genLowerEdgeY(node) + genHigherEdgeY(node)) / 2}, (factor !== 1 ? (_draw_cfg.highlighted_link_width || _draw_cfg.link_width) : _draw_cfg.link_width) * 1.5);
                        }
                    }
                }
            });
        });
    });
}
    

async function drawNodes(svg_node, rows) {
    // Draw nodes on top of links
    let count = 0;
    for (const level of rows) {
        for (const sub_level of level ? level : []) {
            for (const node of sub_level) {
                drawNode(svg_node, node);
                count++;
                if (count % 100 === 0) await scheduler.yield();
                logPositioning('drawNodes', {
                    name: node.individual.name,
                    x: node.x,
                });
            };
        };
    };
}


function drawNode(svg, node) {
    const pos = mapCoords(node.x, node.y);
    const g = svg.append('g').attr('transform', `translate(${pos.x}, ${pos.y})`);

    let highlight = isNodeHighlighted(node);

    let [hue, chroma, luminance] = getNodeHCL(node);
    const fill_color = d3.hcl(hue, chroma, highlight ? luminance * _draw_cfg.special_highlight_percent / 100 : luminance);

    [hue, chroma, luminance] = getNodeHCL(node, false);
    const border_luminance = Math.max(1, luminance * _draw_cfg.border_highlight_percent / 100);
    const stroke_color = d3.hcl(hue, node.type === 'inlaw' ? 0 : chroma, highlight ? border_luminance * _draw_cfg.special_highlight_percent / 100 : border_luminance);

    // Draw rectangle — swap width/height for horizontal orientation
    g.append('rect')
        .attr('width', nodeW())
        .attr('height', nodeH())
        .attr('fill', fill_color)
        .attr('stroke', stroke_color)
        .attr('stroke-width', _draw_cfg.node_border_width)
        .attr('rx', Math.min(_draw_cfg.box_width, _draw_cfg.box_height) * _draw_cfg.node_rounding / 100);

    drawText(g, node);
}


// Build secondary content strings (dates and places) from a node's individual data
function buildSecondaryStrings(individual) {
    const secondary_strings = [];
    const place_strings = [];

    if (window.show_years && !window.show_places) {
        const birth_death = individual.birth && individual.death ?
            `${individual.birth}-${individual.death}` :
                individual.birth ? `${individual.birth}-` :
                    individual.death ? `-${individual.death}` :
                        '';
        if (birth_death !== '') {
            secondary_strings.push(birth_death);
        }
    }

    if (window.show_places) {
        let birth_line = '';
        let death_line = '';
        if (individual.birth_place) {
            birth_line = window.show_years && individual.birth ? `B: ${individual.birth} ` : 'B: ';
            birth_line += individual.birth_place;
        } else if (window.show_years && individual.birth && individual.birth_place !== undefined) {
            birth_line = `B: ${individual.birth}`;
        }
        if (individual.death_place) {
            death_line = window.show_years && individual.death ? `D: ${individual.death} ` : 'D: ';
            death_line += individual.death_place;
        } else if (window.show_years && individual.death && individual.death_place !== undefined) {
            death_line = `D: ${individual.death}`;
        }
        if (birth_line) place_strings.push(birth_line);
        if (death_line) place_strings.push(death_line);
    }

    return { secondary_strings, place_strings };
}

// Wrap place strings and combine with date strings into final secondary lines
function buildSecondaryLines(secondary_strings, place_strings, secFontSize) {
    const result = secondary_strings.slice();
    place_strings.forEach(s => {
        const fit = fitTextInBox(s, nodeW(), secFontSize * 10, 'Arial, sans-serif', 'normal', secFontSize);
        fit.lines.forEach(l => result.push(l));
    });
    return result;
}

// Combine name lines and secondary lines into a single array of {text, type} objects
function buildAllLines(name_lines, secondary_lines) {
    const result = [];
    name_lines.forEach(l => result.push({text: l, type: 'name'}));
    secondary_lines.forEach(l => result.push({text: l, type: 'secondary'}));
    return result;
}

// Estimate text dimensions via the shared off-screen canvas
function estimateTextDimensions(lines, nameCount, nameFontSize, secFontSize, is_bold) {
    let maxW = 0;
    let totalH = 0;
    lines.forEach((line, i) => {
        const isName = i < nameCount;
        const fs = isName ? nameFontSize : secFontSize;
        const fw = isName && is_bold ? 'bold' : 'normal';
        _measureCtx.font = `${fw} ${fs}px Arial, sans-serif`;
        maxW = Math.max(maxW, _measureCtx.measureText(line.text).width);
        if (i === 0) totalH += fs;
        else if (i === nameCount) totalH += fs * 1.7;
        else totalH += fs * 1.2;
    });
    return { width: maxW, height: totalH };
}

// Render text lines as tspan elements inside a text element
function renderTspans(text_element, lines, nameCount, nameFontSize, secFontSize, is_bold) {
    text_element.selectAll('*').remove();
    lines.forEach((line, i) => {
        let dy = '1.2em';
        if (i === 0) dy = '0em';
        else if (i === nameCount) dy = '1.7em';
        const is_name = line.type === 'name';
        text_element.append('tspan')
            .attr('x', nodeW() / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', dy)
            .attr('font-size', is_name ? nameFontSize : secFontSize)
            .attr('font-weight', is_name && is_bold ? 'bold' : 'normal')
            .text(line.text);
    });
}

// Shrink font sizes until text fits within box, returns adjusted sizes and lines
function shrinkToFit(name_lines, secondary_strings, place_strings, lines, name_font_size, secondary_font_size, name_fits_at_desired, is_bold) {
    const min_font_size = 6;
    const max_width = nodeW();
    const max_height = nodeH();
    let secondary_lines = lines.filter(l => l.type === 'secondary').map(l => l.text);
    let est = estimateTextDimensions(lines, name_lines.length, name_font_size, secondary_font_size, is_bold);

    if (est.width > max_width || est.height > max_height) {
        if (name_fits_at_desired && secondary_lines.length > 0) {
            let sec_size = secondary_font_size;
            while (sec_size > min_font_size && (est.width > max_width || est.height > max_height)) {
                sec_size--;
                secondary_lines = buildSecondaryLines(secondary_strings, place_strings, sec_size);
                lines = buildAllLines(name_lines, secondary_lines);
                est = estimateTextDimensions(lines, name_lines.length, name_font_size, sec_size, is_bold);
            }
            secondary_font_size = sec_size;
            if (name_font_size < secondary_font_size) secondary_font_size = name_font_size;
        }

        if (est.width > max_width || est.height > max_height) {
            const scale = Math.min(
                est.width > max_width ? max_width / est.width : 1,
                est.height > max_height ? max_height / est.height : 1
            );
            name_font_size = Math.max(min_font_size, Math.floor(name_font_size * scale));
            secondary_font_size = Math.min(name_font_size, Math.max(min_font_size, Math.floor(secondary_font_size * scale)));
        }
    }

    return { name_font_size, secondary_font_size, lines };
}

// Position text element vertically based on text_align setting.
// bbox must be expressed relative to text.y = nodeH()/2:
//   bbox.y      = nodeH()/2 - ascender_of_first_line
//   bbox.height = ascender_of_first_line + distance_to_bottom_of_last_glyph
// Callers must supply a geometrically correct bbox (not raw getBBox() output, which
// can be zero or incorrect in Chrome after scheduler.yield() in large async draw loops).
function alignTextVertically(text_element, bbox) {
    const pad = _draw_cfg.box_padding || 0;
    const mid = nodeH() / 2;
    let text_y;
    if (_draw_cfg.text_align === 'top') {
        text_y = mid + pad - bbox.y;
    } else if (_draw_cfg.text_align === 'bottom') {
        text_y = mid + (nodeH() - pad - bbox.height) - bbox.y;
    } else {
        text_y = mid + (nodeH() - bbox.height) / 2 - bbox.y;
    }
    text_element.attr('y', text_y);
}

function getNameAvailableHeight(secondary_lines, secondary_font_size) {
    let name_available_height = nodeH();
    if (secondary_lines.length > 0) {
        const gap = secondary_font_size * 0.5;
        name_available_height -= secondary_lines.length * secondary_font_size * 1.2 + gap;
    }
    return Math.max(name_available_height, 6 * 1.2);
}

function selectInitialTextLayout(name, weight, main_font_size, secondary_strings, place_strings) {
    const min_font_size = 6;
    const preferred_secondary_size = Math.max(min_font_size, Math.round(main_font_size * 0.75));
    let best_layout = null;

    for (let sec_size = preferred_secondary_size; sec_size >= min_font_size; sec_size--) {
        const secondary_lines = buildSecondaryLines(secondary_strings, place_strings, sec_size);
        const name_available_height = getNameAvailableHeight(secondary_lines, sec_size);

        let name_lines = [];
        let name_font_size = main_font_size;
        if (window.show_names && name) {
            const fit = fitTextInBox(name, nodeW(), name_available_height, 'Arial, sans-serif', weight, main_font_size);
            name_lines = fit.lines;
            name_font_size = fit.fontSize;
        }

        const is_better_name = !best_layout || (name_font_size > best_layout.name_font_size);
        const same_name_better_secondary = best_layout && (name_font_size === best_layout.name_font_size) && (sec_size > best_layout.secondary_font_size);

        if (is_better_name || same_name_better_secondary) {
            best_layout = {
                name_lines,
                name_font_size,
                secondary_lines,
                secondary_font_size: sec_size,
            };
        }

        if (name_font_size === main_font_size) break;
    }

    if (best_layout) return best_layout;
    return {
        name_lines: [],
        name_font_size: main_font_size,
        secondary_lines: buildSecondaryLines(secondary_strings, place_strings, preferred_secondary_size),
        secondary_font_size: preferred_secondary_size,
    };
}

const TREE_TEXT_SHADOW_FILTER_ID = 'tree-text-shadow-filter';
let _textShadowFilterCreated = false;

function ensureTextShadowFilter(selection) {
    if (_draw_cfg.text_shadow === false) return null;
    if (_textShadowFilterCreated) return TREE_TEXT_SHADOW_FILTER_ID;

    const selection_node = selection && typeof selection.node === 'function' ? selection.node() : null;
    if (!selection_node) return null;

    const svg = (selection_node.tagName && selection_node.tagName.toLowerCase() === 'svg') ? selection_node : selection_node.ownerSVGElement;
    if (!svg) return null;

    let filter = svg.querySelector(`#${TREE_TEXT_SHADOW_FILTER_ID}`);
    if (filter) { _textShadowFilterCreated = true; return TREE_TEXT_SHADOW_FILTER_ID; }

    let defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        if (svg.firstChild) svg.insertBefore(defs, svg.firstChild);
        else svg.appendChild(defs);
    }

    filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', TREE_TEXT_SHADOW_FILTER_ID);
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '160%');
    filter.setAttribute('height', '160%');

    const drop_shadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    drop_shadow.setAttribute('dx', '1');
    drop_shadow.setAttribute('dy', '1');
    drop_shadow.setAttribute('stdDeviation', '1');
    drop_shadow.setAttribute('flood-color', '#000000');
    drop_shadow.setAttribute('flood-opacity', '0.75');

    filter.appendChild(drop_shadow);
    defs.appendChild(filter);
    _textShadowFilterCreated = true;

    return TREE_TEXT_SHADOW_FILTER_ID;
}

function drawText(g, node) {
    const highlight = isNodeHighlighted(node);
    const text_luminance = highlight ? (_draw_cfg.highlighted_text_brightness ?? _draw_cfg.text_brightness ?? 0) : (_draw_cfg.text_brightness ?? 0);
    const text_color = d3.hcl(0, 0, text_luminance);
    const is_bold = highlight && (_draw_cfg.special_highlight_percent !== 100);
    const text_shadow_filter_id = ensureTextShadowFilter(g);
    const text_element = g.append('text')
        .attr('x', nodeW() / 2)
        .attr('y', nodeH() / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-weight', is_bold ? 'bold' : 'normal')
        .attr('font-size', (_draw_cfg.text_size || window.default_text_size) + 'px')
        .attr('fill', text_color);

    if (text_shadow_filter_id) {
        text_element.attr('filter', `url(#${text_shadow_filter_id})`);
    }

    const name = node.individual.name || '';
    const weight = is_bold ? 'bold' : 'normal';
    const main_font_size = _draw_cfg.text_size || window.default_text_size || 12;

    // Build secondary content
    const { secondary_strings, place_strings } = buildSecondaryStrings(node.individual);
    const initial_layout = selectInitialTextLayout(name, weight, main_font_size, secondary_strings, place_strings);
    let name_lines = initial_layout.name_lines;
    let name_font_size = initial_layout.name_font_size;
    let secondary_lines = initial_layout.secondary_lines;
    let secondary_font_size = initial_layout.secondary_font_size;

    // Ensure secondary font never exceeds name font
    secondary_font_size = Math.min(secondary_font_size, name_font_size);
    if (secondary_font_size < Math.max(6, Math.round(main_font_size * 0.75))) {
        secondary_lines = buildSecondaryLines(secondary_strings, place_strings, secondary_font_size);
    }

    const name_fits_at_desired = (name_font_size === main_font_size);
    let lines = buildAllLines(name_lines, secondary_lines);
    if (lines.length === 0) return;

    // Shrink to fit
    const shrunk = shrinkToFit(name_lines, secondary_strings, place_strings, lines, name_font_size, secondary_font_size, name_fits_at_desired, is_bold);
    name_font_size = shrunk.name_font_size;
    secondary_font_size = shrunk.secondary_font_size;
    lines = shrunk.lines;

    // Final conservative pass for name wrapping: if a long name ends up on one line at a very small size,
    // retry wrapping with a slight width margin to avoid borderline overflow from measurement differences.
    const current_name_lines = lines.filter(l => l.type === 'name').map(l => l.text);
    const current_secondary_lines = lines.filter(l => l.type === 'secondary').map(l => l.text);
    if (window.show_names && name && current_name_lines.length === 1 && name_font_size <= 7 && name.includes(' ')) {
        const retry_name_height = getNameAvailableHeight(current_secondary_lines, secondary_font_size);
        const conservative_fit = fitTextInBox(name, _draw_cfg.box_width * 0.92, retry_name_height, 'Arial, sans-serif', weight, name_font_size);
        if ((conservative_fit.fontSize === name_font_size) && (conservative_fit.lines.length > 1)) {
            const candidate_lines = buildAllLines(conservative_fit.lines, current_secondary_lines);
            const candidate_est = estimateTextDimensions(candidate_lines, conservative_fit.lines.length, name_font_size, secondary_font_size, is_bold);
            if ((candidate_est.width <= _draw_cfg.box_width) && (candidate_est.height <= _draw_cfg.box_height)) {
                name_lines = conservative_fit.lines;
                lines = candidate_lines;
            }
        }
    }

    window.min_text_size = Math.min(window.min_text_size, name_font_size);
    window.max_text_size = Math.max(window.max_text_size, name_font_size);

    // Single DOM render + getBBox
    renderTspans(text_element, lines, name_lines.length, name_font_size, secondary_font_size, is_bold);
    const bbox = text_element.node().getBBox();

    const max_width = _draw_cfg.box_width;
    const max_height = _draw_cfg.box_height;
    if (bbox.width <= max_width && bbox.height <= max_height) window.max_text_size = Math.max(window.max_text_size, name_font_size);
    const padding = _draw_cfg.box_padding || 0;
    const preferred_secondary_size = Math.max(6, Math.round(main_font_size * 0.75));
    let required_text_width = 0;
    lines.forEach(line => {
        const is_name = line.type === 'name';
        const desired_fs = is_name ? main_font_size : preferred_secondary_size;
        const fw = is_name && is_bold ? 'bold' : 'normal';
        _measureCtx.font = `${fw} ${desired_fs}px Arial, sans-serif`;
        required_text_width = Math.max(required_text_width, _measureCtx.measureText(line.text).width);
    });
    window.auto_box_width = Math.max(window.auto_box_width, required_text_width + 2 * padding, 20);
    // Compute the height required to render both name and secondary at their preferred font sizes.
    // We cannot use bbox.height (post-shrink DOM measurement) or initial_layout (which may already
    // have reduced secondary_font_size to maximize name size), so we estimate directly:
    //   name lines at main_font_size (wrapped for current box width, no height constraint)
    //   secondary lines at preferred_secondary_size
    const pref_sec_lines = buildSecondaryLines(secondary_strings, place_strings, preferred_secondary_size);
    let pref_name_lines = [];
    if (window.show_names && name) {
        const pref_name_fit = fitTextInBox(name, nodeW(), main_font_size * 24, 'Arial, sans-serif', weight, main_font_size);
        pref_name_lines = pref_name_fit.lines;
    }
    const pref_all_lines = buildAllLines(pref_name_lines, pref_sec_lines);
    const pref_height_est = estimateTextDimensions(pref_all_lines, pref_name_lines.length, main_font_size, preferred_secondary_size, is_bold);
    window.auto_box_height = Math.max(window.auto_box_height, pref_height_est.height + 2 * padding, 20);

    // Compute text position from the known line geometry (dy values + font sizes) rather than
    // getBBox().  getBBox() can return incorrect bbox.y values in Chrome after each
    // scheduler.yield() in a large async draw loop, causing text to appear at the node midpoint
    // instead of the requested alignment position.  The geometric model is always correct.
    const sec_line_count = lines.length - name_lines.length;
    const first_fs = name_lines.length > 0 ? name_font_size : secondary_font_size;
    const last_fs  = sec_line_count > 0 ? secondary_font_size : name_font_size;
    const asc = first_fs * 0.72;  // ascender of first rendered glyph row
    let sum_dy = 0;
    if (name_lines.length > 1) sum_dy += (name_lines.length - 1) * 1.2 * name_font_size;
    if (sec_line_count > 0) {
        if (name_lines.length > 0) sum_dy += 1.7 * secondary_font_size;  // 1.7em gap before secondary
        if (sec_line_count > 1)   sum_dy += (sec_line_count - 1) * 1.2 * secondary_font_size;
    }
    const align_bbox = {
        y: nodeH() / 2 - asc,
        height: asc + sum_dy + last_fs * 0.28,
    };
    alignTextVertically(text_element, align_bbox);
}


function drawLink(svg_node, color, point1, point2, special, factor = 1) {
    // point1 and point2 are always in layout space: { x: sibling, y: generation }.
    // The customLink function works entirely in (sibling, generation) coordinates and
    // converts each path point to SVG space via mapCoords so the result is correct for
    // both vertical and horizontal orientations.
    const customLink = (p1, p2) => {
        const s1 = p1.x, g1 = p1.y;
        const s2 = p2.x, g2 = p2.y;
        // genDir: +1 when g1 > g2 (horizontal mode after y-mirror), -1 when g1 < g2 (vertical).
        // Used to keep the elbow geometry correct for both orientations.
        const genDir = Math.sign(g1 - g2) || -1;
        const genMid = (special && special.includes('center')
            ? (g1 + g2) / 2
            : g2 + genDir * _draw_cfg.generation_spacing / 2 * (special === 'duplicate' ? 2 : 1));
        const sibMid = s1 + (s2 - s1) / 2;
        const corner_radius = Math.min(_draw_cfg.box_width, _draw_cfg.box_height) * _draw_cfg.link_rounding / 200;
        const pt = (s, g) => { const c = mapCoords(s, g); return [c.x, c.y]; };
        const context = d3.path();
        context.moveTo(...pt(s1, g1));
        context.lineTo(...pt(s1, genMid + genDir * corner_radius));
        if (s2 > s1) {
            if (s1 + corner_radius > s2 - corner_radius) {
                context.bezierCurveTo(...pt(s1, genMid), ...pt(sibMid, genMid), ...pt(sibMid, genMid));
            } else {
                context.bezierCurveTo(...pt(s1, genMid), ...pt(s1 + corner_radius, genMid), ...pt(s1 + corner_radius, genMid));
                context.lineTo(...pt(s2 - corner_radius, genMid));
            }
        }
        if (s2 < s1) {
            if (s1 - corner_radius < s2 + corner_radius) {
                context.bezierCurveTo(...pt(s1, genMid), ...pt(sibMid, genMid), ...pt(sibMid, genMid));
            } else {
                context.bezierCurveTo(...pt(s1, genMid), ...pt(s1 - corner_radius, genMid), ...pt(s1 - corner_radius, genMid));
                context.lineTo(...pt(s2 + corner_radius, genMid));
            }
        }
        context.bezierCurveTo(...pt(s2, genMid), ...pt(s2, genMid - genDir * corner_radius), ...pt(s2, genMid - genDir * corner_radius));
        context.lineTo(...pt(s2, g2));
        return context.toString();
    };

    const base_link_width = _draw_cfg.link_width || 3;
    const stroke_width = (factor !== 1) ? (_draw_cfg.highlighted_link_width || base_link_width) : base_link_width;
    if (!window.beside_inlaws || special === 'duplicate') {
        svg_node.append("path")
            .attr("d", customLink(point1, point2))
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", stroke_width)
            .attr("stroke-dasharray", special === 'duplicate' ? `${stroke_width},${stroke_width}` : special && special.includes('inlaw') ? `${stroke_width},${stroke_width}` : "none");
    }
    else {
        svg_node.append("path")
            .attr("d", customLink(point1, point2))
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", stroke_width);
    }
}


function drawCircle(svg_node, color, center, radius) {
    const c = mapCoords(center.x, center.y);
    svg_node.append("circle")
        .attr("cx", c.x)
        .attr("cy", c.y)
        .attr("r", radius)
        .attr("fill", color);
} 


function getNodeHCL(node, inlaw_desaturated = true) {
    // Calculate fill color based on generation
    // Use HCL for equal luminance regardless of hue
    var hue_spacing = 60;
    if (window.max_gen_up + window.max_gen_down >= 6) hue_spacing = 360 / (window.max_gen_up + window.max_gen_down + 1);
    const base_hue = _draw_cfg.root_hue;
    const hue = ((node.generation - window.generations_down) * hue_spacing + base_hue + 360) % 360;
    const chroma = (inlaw_desaturated && (node.type === 'inlaw')) ? 0 : _draw_cfg.node_saturation;
    const luminance = _draw_cfg.node_brightness;
    return [hue, chroma, luminance];
}


// Shared off-screen canvas for text measurement (created once)
const _measureCanvas = document.createElement('canvas');
const _measureCtx = _measureCanvas.getContext('2d');
let _fitTextInBoxCache = null;

function fitTextInBox(str, width, height, fontFamily = 'Arial, sans-serif', fontWeight = 'normal', maxFontSize = null) {
    // Returns { lines: string[], fontSize: number } with the largest font size
    // such that the wrapped lines fit within the given width and height.

    const _cacheKey = _fitTextInBoxCache !== null && `${str}|${width}|${height}|${fontFamily}|${fontWeight}|${maxFontSize}`;
    if (_cacheKey) {
        const _cached = _fitTextInBoxCache.get(_cacheKey);
        if (_cached) return _cached;
    }

    // Reduce effective box size by box padding on all sides
    const padding = _draw_cfg.box_padding || 0;
    width = Math.max(0, width - 2 * padding);
    height = Math.max(0, height - 2 * padding);

    const ctx = _measureCtx;

    function measureTextWidth(text, fontSize) {
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        return ctx.measureText(text).width;
    }

    // Word-wrap the string into lines that fit within maxWidth at the given fontSize.
    // Splits only on spaces and after hyphens; tokens wider than maxWidth are placed on their
    // own line without further character splitting (the caller reduces font size instead).
    function wrapText(text, fontSize, maxWidth) {
        // Split into tokens that break on spaces and after hyphens (keeping the hyphen with the preceding token)
        const tokens = text.match(/[^\s-]+-|[^\s-]+|\s+/g) || [''];
        // Filter out whitespace-only tokens
        const parts = [];
        for (const token of tokens) {
            if (/^\s+$/.test(token)) continue;
            parts.push(token);
        }
        if (parts.length === 0) return [''];
        const lines = [];
        let currentLine = parts[0];
        for (let i = 1; i < parts.length; i++) {
            const separator = currentLine.endsWith('-') ? '' : ' ';
            const candidate = currentLine + separator + parts[i];
            if (measureTextWidth(candidate, fontSize) <= maxWidth) {
                currentLine = candidate;
            } else {
                lines.push(currentLine);
                currentLine = parts[i];
            }
        }
        lines.push(currentLine);
        return lines;
    }

    // Check whether the string fits in the box at a given font size.
    // Line height is estimated as 1.2 × fontSize.
    function fitsAtSize(fontSize) {
        const lines = wrapText(str, fontSize, width);
        const totalHeight = lines.length * fontSize * 1.2;
        if (totalHeight > height) return null;
        for (const line of lines) {
            if (measureTextWidth(line, fontSize) > width) return null;
        }
        return lines;
    }

    // Binary search for the largest integer font size that fits.
    const minFontSize = 6;
    let lo = minFontSize;
    let hi = maxFontSize ? Math.min(Math.ceil(height), maxFontSize) : Math.ceil(height);
    let bestLines = wrapText(str, minFontSize, width);
    let bestSize = minFontSize;

    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const result = fitsAtSize(mid);
        if (result) {
            bestLines = result;
            bestSize = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    const _result = { lines: bestLines, fontSize: bestSize };
    if (_cacheKey) _fitTextInBoxCache.set(_cacheKey, _result);
    return _result;
}
