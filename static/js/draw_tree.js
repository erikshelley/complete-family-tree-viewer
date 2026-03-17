// Tree drawing and visualization functionality using D3.js
async function drawTree(svg_node, tree_width, tree_height, rows) {
    svg_node.append('rect')
        .attr('width', tree_width)
        .attr('height', tree_height)
        .attr('fill', window.transparent_bg_rect ? "rgba(0,0,0,0)" : window.tree_color || "#000")
        .attr('stroke', "000")
        .attr('stroke-width', 0);

    // Handle non-bold links
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                let [hue, chroma, luminance] = getNodeHCL(node, false);
                let color = d3.hcl(hue, 0, luminance * (window.inlaw_link_highlight_percent / 100) * (node.individual.is_descendant || node.individual.is_root ? window.pedigree_highlight_percent / 100 : 1));

                // Draw link between relative and spouse
                if (node.type === 'relative' || node.type === 'root') {
                    node.spouse_nodes.forEach(spouse_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, 
                                                  {x: spouse_node.x + window.box_width / 2, y: spouse_node.y}, 'inlaw');
                    });
                }

                // Draw link between ancestor and spouse
                if (node.type === 'ancestor') {
                    node.spouse_nodes.forEach(spouse_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2,         y: node.y}, 
                                                  {x: spouse_node.x + window.box_width / 2,  y: spouse_node.y + window.box_height}, 'inlaw-center');
                    });
                }

                if (node.children_nodes.length > 0) {
                    [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                    color = d3.hcl(hue, chroma, luminance * (window.link_highlight_percent / 100) * (node.individual.is_descendant || node.individual.is_root ? window.pedigree_highlight_percent / 100 : 1));
                }

                // Draw link between in-law and child at top of stack
                if (node.type === 'inlaw') {
                    node.children_nodes.filter(child_node => !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, 
                                                  {x: child_node.x + window.box_width / 2, y: child_node.y});
                    });
                }

                // Draw link between ancestor and child at top of stack
                if (node.type === 'ancestor' && node.individual.gender == 'M') {
                    node.children_nodes.filter(child_node => !child_node.individual.is_root && !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 
                                                  {x: child_node.x + window.box_width / 2,              y: child_node.y});
                    });
                }

                [hue, chroma, luminance] = getNodeHCL(node, false);
                color = d3.hcl(hue, chroma, luminance * (window.link_highlight_percent / 100) * (node.individual.is_descendant || node.individual.is_root ? window.pedigree_highlight_percent / 100 : 1));

                // Draw link stacked child and previous stacked child
                if ((node.type === 'relative') && node.stacked && !node.stack_top) {
                    drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y}, 
                                              {x: node.x + window.box_width / 2, y: node.y - window.v_spacing});
                }

            });
        });
    });

    // Handle bold links
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                if (node.type === 'ancestor' && node.individual.gender == 'M') {

                    let [hue, chroma, luminance] = getNodeHCL(node, false);
                    let color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));

                    // Draw links from father and mother to center point
                    drawLink(svg_node, color, {x: node.x + window.box_width / 2,                    y: node.y}, 
                                              {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 'center');
                    drawLink(svg_node, color, {x: node.x + 3 * window.box_width / 2 + window.h_spacing, y: node.y}, 
                                              {x: node.x + window.box_width + window.h_spacing / 2,     y: node.y + window.box_height}, 'center');

                    if (node.children_nodes.length > 0) {
                        [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                        color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and root child
                    node.children_nodes.filter(child_node => child_node.individual.is_root).forEach(child_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 
                                                  {x: child_node.x + window.box_width / 2,              y: child_node.y});
                    });

                    if (node.individual.pedigree_child_node) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.pedigree_child_node, false);
                        color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and pedigree child
                    if (node.individual.pedigree_child_node) {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2,             y: node.y + window.box_height}, 
                                                  {x: node.individual.pedigree_child_node.x + window.box_width / 2, y: node.individual.pedigree_child_node.y});
                    }

                    if (node.individual.duplicate_pedigree_child_node) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.duplicate_pedigree_child_node, false);
                        color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and duplicate pedigree child
                    if (node.individual.duplicate_pedigree_child_node) {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2,                       y: node.y + window.box_height}, 
                                                  {x: node.individual.duplicate_pedigree_child_node.x + window.box_width / 2, y: node.individual.duplicate_pedigree_child_node.y}, 
                                                  'duplicate');
                    }
                }
            });
        });
    });

    // Draw nodes on top of links
    let node_count = 0;
    for (const level of rows) {
        for (const sub_level of level ? level : []) {
            for (const node of sub_level) {
                drawNode(svg_node, node);
                node_count++;
                if (node_count % 100 == 0) await scheduler.yield();
            };
        };
    };
}


function drawToolTip(g, node) {
    // Tooltip group (hidden by default), appended to node group
    const tooltip = g.append('g')
        .style('opacity', 0);

    // Prepare tooltip lines
    const birthLine = (node.individual.birth ? node.individual.birth : '') + (node.individual.birth_place ? ' ' + node.individual.birth_place : '');
    const deathLine = (node.individual.death ? node.individual.death : '') + (node.individual.death_place ? ' ' + node.individual.death_place : '');
    const tooltipLines = [
        node.individual.name || '',
        birthLine != '' ? 'B: ' + birthLine : '',
        deathLine != '' ? 'D: ' + deathLine : ''
    ];

    const padding = 12;
    const tool_tip_font_size = window.default_text_size;

    // Tooltip text (render first to measure size)
    const tooltipText = tooltip.append('text')
        .attr('x', window.box_width / 2)
        .attr('y', -tooltipLines.length * tool_tip_font_size - padding) // Center text vertically based on number of lines
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', tool_tip_font_size + 'px')
        .attr('fill', '#fff');

    tooltipLines.forEach((line, i) => {
        tooltipText.append('tspan')
            .attr('x', window.box_width / 2)
            .attr('dy', i === 0 ? '0em' : '1.2em')
            .text(line);
    });

    // Show/hide tooltip on hover, and size/position on demand
    g.on('mouseover', function() {
        // Measure text and resize/position rect
        const bbox = tooltipText.node().getBBox();
        let rect = tooltip.select('rect');
        if (rect.empty()) {
            rect = tooltip.insert('rect', ':first-child');
        }
        rect
            .attr('width', bbox.width + 2 * padding)
            .attr('height', bbox.height + 2 * padding)
            .attr('x', window.box_width / 2 - (bbox.width / 2) - padding)
            .attr('y', -(tooltipLines.length + 1) * tool_tip_font_size - 1.5 * padding) // Center text vertically based on number of lines
            .attr('rx', Math.min(window.box_width, window.box_height) * window.node_rounding / 100)
            .attr('fill', '#000')
            .attr('opacity', 0.95);
        tooltip.style('opacity', 1);
    })
    .on('mouseout', function() {
        tooltip.style('opacity', 0);
    });
}


function drawNode(svg, node) {
    const g = svg.append('g').attr('transform', `translate(${node.x}, ${node.y})`);

    let highlight = ((node.type === 'ancestor') || node.individual.is_root || node.individual.is_descendant);

    let [hue, chroma, luminance] = getNodeHCL(node);
    const fill_color = d3.hcl(hue, chroma, highlight ? luminance * window.pedigree_highlight_percent / 100 : luminance);

    [hue, chroma, luminance] = getNodeHCL(node, false);
    const border_luminance = Math.max(1, luminance * window.border_highlight_percent / 100);
    const stroke_color = d3.hcl(hue, node.type === 'inlaw' ? 0 : chroma, highlight ? border_luminance * window.pedigree_highlight_percent / 100 : border_luminance);

    // Draw rectangle
    g.append('rect')
        .attr('width', window.box_width)
        .attr('height', window.box_height)
        .attr('fill', fill_color)
        .attr('stroke', stroke_color)
        .attr('stroke-width', window.node_border_width)
        .attr('rx', Math.min(window.box_width, window.box_height) * window.node_rounding / 100);

    drawText(g, node);
    if (window.show_tooltips) { drawToolTip(g, node); }
}


function drawText(g, node) {
    // Add text with 3+ lines: name (2 lines), birth-death (1 line), and optionally birth/death places (2 lines)
    const text_luminance = window.text_brightness || 0;
    const text_color = d3.hcl(0, 0, text_luminance);
    const is_bold = ((node.type === 'ancestor' || node.individual.is_root || node.individual.is_descendant) && (window.pedigree_highlight_percent != 100));
    const text_element = g.append('text')
        .attr('x', window.box_width / 2)
        .attr('y', window.box_height / 2) // Initial vertical center
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-weight', is_bold ? 'bold' : 'normal')
        .attr('font-size', (window.text_size || window.default_text_size) + 'px')
        .attr('fill', text_color)
        .style('text-shadow', (window.text_shadow !== false) ? '1px 1px 2px rgba(0,0,0,0.75)' : 'none');

    // Name line logic: if show_places is enabled, show name on a single line; otherwise, split into two lines if needed
    const name = node.individual.name || '';
    let line1, line2;
    if (window.show_places) {
        line1 = name;
        line2 = '';
    } else {
        let splitIdx = -1;
        let minDist = name.length;
        const mid = Math.floor(name.length / 2);
        for (let i = 0; i < name.length; i++) {
            if (name[i] === ' ') {
                const dist = Math.abs(i - mid);
                if (dist < minDist) {
                    minDist = dist;
                    splitIdx = i;
                }
            }
        }
        if (splitIdx !== -1) {
            line1 = name.slice(0, splitIdx);
            line2 = name.slice(splitIdx + 1);
        } else {
            line1 = name;
            line2 = '';
        }
    }

    // Collect lines to render
    let lines = [];
    if (window.show_names) {
        if (line1) lines.push({text: line1, anchor: 'middle'});
        if (line2) lines.push({text: line2, anchor: 'middle'});
    }

    // Add birth-death line if enabled (centered), but only if show_places is not also enabled
    if (window.show_years && !window.show_places) {
        const birth_death = node.individual.birth && node.individual.death ? 
            `${node.individual.birth}-${node.individual.death}` : 
                node.individual.birth ? `${node.individual.birth}-` : 
                    node.individual.death ? `-${node.individual.death}` : 
                        '';
        if (birth_death != '') {
            lines.push({text: birth_death, anchor: 'middle'});
        }
    }

    // Add birth/death places if enabled (centered, below name/years)
    if (window.show_places) {
        // Compose birth and death place lines
        let birth_line = '';
        let death_line = '';
        if (node.individual.birth_place) {
            birth_line = window.show_years && node.individual.birth ? `B: ${node.individual.birth} ` : 'B: ';
            birth_line += node.individual.birth_place;
        } else if (window.show_years && node.individual.birth && node.individual.birth_place !== undefined) {
            // If birth_place is empty string but show_years is on, still show year
            birth_line = `B: ${node.individual.birth}`;
        }
        if (node.individual.death_place) {
            death_line = window.show_years && node.individual.death ? `D: ${node.individual.death} ` : 'D: ';
            death_line += node.individual.death_place;
        } else if (window.show_years && node.individual.death && node.individual.death_place !== undefined) {
            death_line = `D: ${node.individual.death}`;
        }
        if (birth_line) lines.push({text: birth_line, anchor: 'middle'});
        if (death_line) lines.push({text: death_line, anchor: 'middle'});
    }

    // Render all lines as tspans, with smaller font for dates/places
    let text_lines = lines.length;
    let dy = 0;
    let main_font_size = window.text_size || window.default_text_size || 12;
    let secondary_font_size = Math.max(6, Math.round(main_font_size * 0.75));
    // Determine how many name lines there are (1 if show_places, else 1 or 2)
    let name_line_count = 0;
    if (window.show_names) {
        if (lines.length > 0) name_line_count++;
        if (lines.length > 1 && !window.show_places) name_line_count++;
    }

    // Helper to render tspans for a given font size
    function renderTspans(fontSize, secondaryFontSize) {
        text_element.selectAll('*').remove();
        lines.forEach((line, i) => {
            const is_name_line = (i === 0) || (i === 1 && lines[1] && (!window.show_places));
            let dy = '1.2em';
            if (i === 0) {
                dy = '0em';
            } else if (i === name_line_count) {
                dy = '1.7em';
            }
            text_element.append('tspan')
                .attr('x', window.box_width / 2)
                .attr('text-anchor', 'middle')
                .attr('dy', dy)
                .attr('font-size', is_name_line ? fontSize : secondaryFontSize)
                .attr('font-weight', is_name_line && is_bold ? 'bold' : 'normal')
                .text(line.text);
        });
    }

    // Initial render
    renderTspans(main_font_size, secondary_font_size);

    // Adjust font size if needed (scale all lines together, min 6px)
    if (text_lines > 0) {
        const min_font_size = 6;
        const padding = 0;
        const max_width = window.box_width - padding;
        const max_height = window.box_height - padding;
        let bbox = text_element.node().getBBox();
        if (bbox.width > max_width) {
            // Scale both main and secondary font sizes proportionally
            let scale = max_width / bbox.width;
            
            let new_main = Math.max(main_font_size, Math.floor(main_font_size * scale));
            let new_secondary = Math.floor(new_main * 0.75);
            renderTspans(new_main, new_secondary);
            bbox = text_element.node().getBBox();

            new_main = Math.max(min_font_size, Math.floor(main_font_size * scale));
            new_secondary = Math.floor(new_main * 0.75);
            renderTspans(new_main, new_secondary);
        }
        if (bbox.height > max_height) {
            let scale = max_height / bbox.height;
            let new_main = Math.max(main_font_size, Math.floor(main_font_size * scale));
            let new_secondary = Math.floor(new_main * 0.75);
            renderTspans(new_main, new_secondary);
            bbox = text_element.node().getBBox();

            new_main = Math.max(min_font_size, Math.floor(main_font_size * scale));
            new_secondary = Math.floor(new_main * 0.75);
            renderTspans(new_main, new_secondary);
        }
        window.auto_box_width = Math.max(window.auto_box_width, window.box_width * (bbox.width / max_width), 20);
        window.auto_box_height = Math.max(window.auto_box_height, bbox.height, 20);
        // Vertically center text in node
        const line_height = bbox.height / text_lines;
        const text_y = line_height / 1.25 + (window.box_height - bbox.height) / 2;
        text_element.attr('y', text_y);
    }

}


function drawLink(svg_node, color, point1, point2, special) {
    const customLink = (point1, point2) => {
        var x1 = point1.x;
        var x2 = point2.x;
        var y1 = point1.y;
        var y2 = point2.y;
        const ymid = (special && special.includes('center') ? y1 + window.box_height / 2 : y2 - window.v_spacing / 2) - (special === 'duplicate' ? window.v_spacing / 2 : 0);
        const xmid = x1 + (x2 - x1) / 2;
        const corner_radius = Math.min(window.box_width, window.box_height) * window.link_rounding / 200;
        const context = d3.path();
        context.moveTo(x1, y1);
        context.lineTo(x1, ymid - corner_radius);
        if (x2 > x1) {
            if (x1 + corner_radius > x2 - corner_radius) context.bezierCurveTo(x1, ymid, xmid, ymid, xmid, ymid);
            else {
                context.bezierCurveTo(x1, ymid, x1 + corner_radius, ymid, x1 + corner_radius, ymid);
                context.lineTo(x2 - corner_radius, ymid);
            }
        }
        if (x2 < x1) {
            if (x1 - corner_radius < x2 + corner_radius) context.bezierCurveTo(x1, ymid, xmid, ymid, xmid, ymid);
            else {
                context.bezierCurveTo(x1, ymid, x1 - corner_radius, ymid, x1 - corner_radius, ymid);
                context.lineTo(x2 + corner_radius, ymid);
            }
        }
        context.bezierCurveTo(x2, ymid, x2, ymid + corner_radius, x2, ymid + corner_radius);
        context.lineTo(x2, y2);
        return context.toString();
    };

    const stroke_width = window.link_width || 3;
    svg_node.append("path")
        .attr("d", customLink(point1, point2))
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", stroke_width)
        .attr("stroke-dasharray", special === 'duplicate' ? `${stroke_width},${stroke_width}` : special && special.includes('inlaw') ? `${stroke_width},${stroke_width}` : "none");
}


function getNodeHCL(node, inlaw_desaturated = true) {
    // Calculate fill color based on generation
    // Use HCL for equal luminance regardless of hue
    var hue_spacing = 60;
    if (window.max_gen_up + window.max_gen_down >= 6) hue_spacing = 360 / (window.max_gen_up + window.max_gen_down + 1);
    const base_hue = window.root_hue;
    const hue = ((node.generation - window.generations_down) * hue_spacing + base_hue + 360) % 360;
    const chroma = (inlaw_desaturated && (node.type === 'inlaw')) ? 0 : window.node_saturation;
    const luminance = window.node_brightness;
    return [hue, chroma, luminance];
}
