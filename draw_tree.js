// Tree drawing and visualization functionality using D3.js
function drawTree(svg_node, tree_width, tree_height, rows) {
    svg_node.append('rect')
        .attr('width', tree_width)
        .attr('height', tree_height)
        .attr('fill', window.transparent_bg_rect ? "rgba(0,0,0,0)" : window.tree_color || "#000")
        .attr('stroke', "000")
        .attr('stroke-width', 0);

    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                let [hue, chroma, luminance] = getNodeHCL(node, false);
                let color = d3.hcl(hue, 0, luminance);

                // Draw link between relative and spouse
                if (node.type === 'relative' || node.type === 'root') {
                    node.spouse_nodes.forEach(spouse_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, 
                                                  {x: spouse_node.x + window.box_width / 2, y: spouse_node.y}, false, 'inlaw');
                    });
                }

                // Draw link between ancestor and spouse
                if (node.type === 'ancestor') {
                    node.spouse_nodes.forEach(spouse_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2,         y: node.y}, 
                                                  {x: spouse_node.x + window.box_width / 2,  y: spouse_node.y + window.box_height}, false, 'inlaw');
                    });
                }

                if (node.children_nodes.length > 0) {
                    [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                    color = d3.hcl(hue, chroma, luminance);
                }

                // Draw link between in-law and unstacked child
                if (node.type === 'inlaw') {
                    node.children_nodes.filter(child_node => !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, 
                                                  {x: child_node.x + window.box_width / 2, y: child_node.y}, false);
                    });
                }

                // Draw link between ancestor and unstacked child
                if (node.type === 'ancestor' && node.individual.gender == 'M') {
                    node.children_nodes.filter(child_node => !child_node.individual.is_root && !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 
                                                  {x: child_node.x + window.box_width / 2,              y: child_node.y}, false);
                    });
                }

                [hue, chroma, luminance] = getNodeHCL(node, false);
                color = d3.hcl(hue, chroma, luminance);

                // Draw link stacked child and previous stacked child
                if ((node.type === 'relative') && node.stacked && !node.stack_top) {
                    drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y}, 
                                              {x: node.x + window.box_width / 2, y: node.y - window.v_spacing}, false);
                }

            });
        });
    });

    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                if (node.type === 'ancestor' && node.individual.gender == 'M') {

                    let [hue, chroma, luminance] = getNodeHCL(node, false);
                    let color = d3.hcl(hue, chroma, calculateHighlight(luminance));

                    // Draw links from father and mother to center point
                    drawLink(svg_node, color, {x: node.x + window.box_width / 2,                    y: node.y}, 
                                              {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, true);
                    drawLink(svg_node, color, {x: node.x + 3 * window.box_width / 2 + window.h_spacing, y: node.y}, 
                                              {x: node.x + window.box_width + window.h_spacing / 2,     y: node.y + window.box_height}, true);

                    if (node.children_nodes.length > 0) {
                        [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                        color = d3.hcl(hue, chroma, calculateHighlight(luminance));
                    }

                    // Draw link between ancestor and root child
                    node.children_nodes.filter(child_node => child_node.individual.is_root).forEach(child_node => {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 
                                                  {x: child_node.x + window.box_width / 2,              y: child_node.y}, true);
                    });

                    if (node.individual.pedigree_child_node) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.pedigree_child_node, false);
                        color = d3.hcl(hue, chroma, calculateHighlight(luminance));
                    }

                    // Draw link between ancestor and pedigree child
                    if (node.individual.pedigree_child_node) {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2,             y: node.y + window.box_height}, 
                                                  {x: node.individual.pedigree_child_node.x + window.box_width / 2, y: node.individual.pedigree_child_node.y}, true);
                    }

                    if (node.individual.duplicate_pedigree_child_node) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.duplicate_pedigree_child_node, false);
                        color = d3.hcl(hue, chroma, calculateHighlight(luminance));
                    }

                    // Draw link between ancestor and duplicate pedigree child
                    if (node.individual.duplicate_pedigree_child_node) {
                        drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2,                       y: node.y + window.box_height}, 
                                                  {x: node.individual.duplicate_pedigree_child_node.x + window.box_width / 2, y: node.individual.duplicate_pedigree_child_node.y}, 
                                                  true, 'duplicate');
                    }
                }
            });
        });
    });

    // Draw nodes on top of links
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                drawNode(svg_node, node);
            });
        });
    });
}


function drawNode(svg, node) {
    const g = svg.append('g').attr('transform', `translate(${node.x}, ${node.y})`);
    let highlight = ((node.type === 'ancestor') || node.individual.is_root);
    if (!window.highlight_ancestors) highlight = false;

    let [hue, chroma, luminance] = getNodeHCL(node);
    const fill_color = d3.hcl(hue, chroma, highlight ? calculateHighlight(luminance) : luminance);

    [hue, chroma, luminance] = getNodeHCL(node, false);
    const border_luminance = Math.max(1, luminance);
    const stroke_color = d3.hcl(hue, node.type === 'inlaw' ? 0 : chroma, highlight ? calculateHighlight(border_luminance) : border_luminance);

    // Draw rectangle
    g.append('rect')
        .attr('width', window.box_width)
        .attr('height', window.box_height)
        .attr('fill', fill_color)
        .attr('stroke', stroke_color)
        .attr('stroke-width', 3)
        .attr('rx', 8);

    // Add text with 3 lines: name (2 lines), birth-death (1 line)
    const text_luminance = window.text_brightness || 0;
    const text_color = d3.hcl(0, 0, text_luminance);
    //const text_color = d3.hcl(hue, chroma, text_luminance);
    const text_element = g.append('text')
        .attr('x', window.box_width / 2)
        .attr('y', 24) // Vertically centered in 80px box
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-weight', highlight ? 'bold' : 'normal')
        .attr('fill', text_color);

    // Split name into two lines if too long
    const name = node.individual.name || '';
    const max_line_length = 14; // Approximate characters per line for 2-line name

    let line1, line2;
    if (name.length <= max_line_length) {
        line1 = name;
        line2 = '';
    } else {
        // Find a good break point
        const words = name.split(' ');
        line1 = words[0];
        let i = 1;
        while (i < words.length && (line1 + ' ' + words[i]).length <= max_line_length) {
            line1 += ' ' + words[i];
            i++;
        }
        line2 = words.slice(i).join(' ');
    }

    // Add name lines if enabled
    let name_lines = 0;
    if (window.show_names) {
        if (line1) {
            text_element.append('tspan')
                .attr('x', window.box_width / 2)
                .attr('dy', '0em')
                .text(line1);
            name_lines++;
        }
        if (line2) {
            text_element.append('tspan')
                .attr('x', window.box_width / 2)
                .attr('dy', '1.2em')
                .text(line2);
            name_lines++;
        }
    }

    // Add birth-death line if enabled
    if (window.show_years) {
        const birth_death = node.individual.birth && node.individual.death ? 
            `${node.individual.birth}-${node.individual.death}` : 
            node.individual.birth ? 
            `${node.individual.birth}-` : 
            node.individual.death ? 
            `-${node.individual.death}` : 
            '';

        if (birth_death) {
            text_element.append('tspan')
                .attr('x', window.box_width / 2)
                .attr('dy', name_lines === 2 ? '1.4em' : '1.2em')
                .text(birth_death);
        }
    }

    // Adjust font size if needed
    let font_size = 12;
    const min_font_size = 6;
    const padding = 0;
    const max_width = window.box_width - padding;

    // Check if text fits
    const bbox = text_element.node().getBBox();
    if (bbox.width > max_width) {
        font_size = Math.round(10 * Math.max(min_font_size, font_size * (max_width / bbox.width))) / 10;
        text_element.attr('font-size', font_size + 'px');
    }
}


function drawLink(svg_node, color, point1, point2, highlight, special) {
    if (!window.highlight_ancestors) highlight = false;
    const customLink = (point1, point2) => {
        var x1 = point1.x;
        var x2 = point2.x;
        var y1 = point1.y;
        var y2 = point2.y;
        const ymid = y2 - window.v_spacing / 2 - (special === 'duplicate' ? window.v_spacing / 2 : 0);
        const corner_radius = 10;
        const context = d3.path();
        context.moveTo(x1, y1);
        context.lineTo(x1, ymid - corner_radius);
        if (x2 > x1) {
            context.bezierCurveTo(x1, ymid, x1 + corner_radius, ymid, x1 + corner_radius, ymid);
            context.lineTo(x2 - corner_radius, ymid);
        }
        if (x2 < x1) {
            context.bezierCurveTo(x1, ymid, x1 - corner_radius, ymid, x1 - corner_radius, ymid);
            context.lineTo(x2 + corner_radius, ymid);
        }
        context.bezierCurveTo(x2, ymid, x2, ymid + corner_radius, x2, ymid + corner_radius);
        context.lineTo(x2, y2);
        return context.toString();
    };

    const strokeWidth = window.link_width || 3;
    svg_node.append("path")
        .attr("d", customLink(point1, point2))
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", special === 'duplicate' ? "10,5" : special === 'inlaw' ? "5,5" : "none");
}


function getNodeHCL(node, inlaw_desaturated = true) {
    // Calculate fill color based on generation
    // Use HCL for equal luminance regardless of hue
    var hue_spacing = 60;
    if (window.max_gen_up + window.max_gen_down >= 6) hue_spacing = 360 / (window.max_gen_up + window.max_gen_down + 1);
    const base_hue = window.root_hue || window.default_node_hue;
    const hue = ((node.generation - window.generations_down) * hue_spacing + base_hue + 360) % 360;
    const chroma = (inlaw_desaturated && (node.type === 'inlaw')) ? 0 : (window.node_saturation || window.default_node_saturation);
    const luminance = window.node_brightness || window.default_node_brightness;
    return [hue, chroma, luminance];
}

function calculateHighlight(luminance) {
    if (window.highlight_ancestors) {
        if (luminance > 100/1.5) return luminance * 1/1.5;
        else return luminance * 1.5;
    }
    else return luminance * 1.0;
}
