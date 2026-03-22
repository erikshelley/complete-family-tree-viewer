// Tree drawing and visualization functionality using D3.js
async function drawTree(rows) {
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
    window.min_text_size = window.text_size;
    window.max_text_size = 6;

    // Set SVG dimensions
    const bounding_box = family_tree_div.getBoundingClientRect();
    let svg_width = bounding_box.width - 24; // horizontal padding in div
    let svg_height = bounding_box.height - 40; // bottom padding in div

    // Initial SVG
    const svg = d3.select('#family-tree-div')
        .append('svg')
        .attr('width', svg_width)
        .attr('height', svg_height);

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
    const zoom = d3.zoom().scaleExtent([1, 2 * max_scale]).on("zoom", zoomed);
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
        .attr('fill', window.transparent_bg_rect ? "rgba(0,0,0,0)" : window.tree_color || "#000")
        .attr('stroke', "000")
        .attr('stroke-width', 0);

    drawNonBoldLinks(svg_node, rows);
    drawBoldLinks(svg_node, rows);
    drawCircles(svg_node, rows);
    drawNodes(svg_node, rows);

    const root_name_span = document.getElementById('root-name');
    root_name_span.innerHTML = '&nbsp;&nbsp;&bull;&nbsp;&nbsp;' + selected_individual.name.replace(/ /g, '&nbsp;');

    const status_bar_div = document.getElementById('status-bar-div');
    let people_shown;
    if (node_count === "1") people_shown = `${node_count}&nbsp;Person&nbsp;Shown`;
    else people_shown = `${node_count} People`;
    let spacer = '&nbsp;&nbsp;&bull;&nbsp;&nbsp;';
    let tree_dimensions = `${spacer}${Math.ceil(max_x).toLocaleString()} x ${Math.ceil(max_y).toLocaleString()}`;
    //let megapixels = ((Math.ceil(max_x) * Math.ceil(max_y)) / 1_000_000).toFixed(2);
    //megapixels = `${Number(megapixels).toLocaleString()} MP`
    let print_dimensions = `${(Math.ceil(max_x) / 300).toFixed(1)}" x ${(Math.ceil(max_y) / 300).toFixed(1)}" @ 300 DPI`;
    let min_text_size = `${spacer}Min Font: ${window.min_text_size}px`;
    let max_text_size = `${spacer}Max Font: ${window.max_text_size}px`;
    let earliest_birth_year = window.earliest_birth_year ? `${spacer}Earliest Birth: ${window.earliest_birth_year}` : '';
    status_bar_div.innerHTML = `${people_shown}${tree_dimensions}${spacer}${print_dimensions}${min_text_size}${max_text_size}${earliest_birth_year}`;

    d3.select('body').on('keydown', function (event) {
        var k = d3.zoomTransform(svg.node()).k;
        var step_x = (bounding_box.width - 24) * max_scale * 0.1 / k;
        var step_y = (bounding_box.height - 40) * max_scale * 0.1 / k;
        var key = event.key;
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
    });
}


function drawNonBoldLinks(svg_node, rows) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                let [hue, chroma, luminance] = getNodeHCL(node, false);
                let color = d3.hcl(hue, 0, luminance * (window.inlaw_link_highlight_percent / 100) * (node.individual.is_descendant || node.individual.is_root ? window.pedigree_highlight_percent / 100 : 1));

                // Draw link between relative and spouse
                if (node.type === 'relative' || node.type === 'root') {
                    if (window.vertical_inlaws) {
                        node.spouse_nodes.forEach(spouse_node => {
                            drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, 
                                                      {x: spouse_node.x + window.box_width / 2, y: spouse_node.y}, 'inlaw');
                        });
                    }
                    else {
                        node.spouse_nodes.forEach(spouse_node => {
                            drawLink(svg_node, color, {x: node.x + window.box_width / 2,         y: node.y}, 
                                                      {x: spouse_node.x + window.box_width / 2,  y: spouse_node.y + window.box_height}, 'inlaw-center');
                        });
                    }
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
                    if (window.vertical_inlaws) {
                        node.children_nodes.filter(child_node => !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                            drawLink(svg_node, color, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, 
                                                      {x: child_node.x + window.box_width / 2, y: child_node.y});
                        });
                    }
                    else {
                        let left = -window.h_spacing / 2;
                        let right = window.box_width + window.h_spacing / 2;
                        let x_offset = (node.individual.gender === 'M') ? right : left;
                        if (node.spouse_nodes[0].type === 'ancestor') x_offset = (x_offset === right) ? left : right;
                        let radius = window.link_width * 1.5;
                        node.children_nodes.filter(child_node => !(child_node.stacked && !child_node.stack_top)).forEach(child_node => {
                            drawLink(svg_node, color, {x: node.x + x_offset, y: node.y + window.box_height / 2 + radius}, 
                                                      {x: child_node.x + window.box_width / 2, y: child_node.y});
                        });
                    }
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
}


function drawBoldLinks(svg_node, rows) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                if (node.type === 'ancestor' && node.individual.gender == 'M') {

                    let [hue, chroma, luminance] = getNodeHCL(node, false);
                    let color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));

                    // Draw links from father and mother to center point
                    if (window.vertical_inlaws) {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2,                    y: node.y}, 
                                                  {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 'center');
                        drawLink(svg_node, color, {x: node.x + 3 * window.box_width / 2 + window.h_spacing, y: node.y}, 
                                                  {x: node.x + window.box_width + window.h_spacing / 2,     y: node.y + window.box_height}, 'center');
                    }
                    else {
                        drawLink(svg_node, color, {x: node.x + window.box_width / 2,                       y: node.y}, 
                                                  {x: node.x + 1.5 * window.box_width + window.h_spacing,  y: node.y + window.box_height}, 'center');
                    }

                    if (node.children_nodes.length > 0) {
                        [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                        color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and root child
                    if (window.vertical_inlaws) {
                        node.children_nodes.filter(child_node => child_node.individual.is_root).forEach(child_node => {
                            drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 
                                                      {x: child_node.x + window.box_width / 2,              y: child_node.y});
                        });
                    }
                    else {
                        node.children_nodes.filter(child_node => child_node.individual.is_root).forEach(child_node => {
                            drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height / 2}, 
                                                      {x: child_node.x + window.box_width / 2,              y: child_node.y});
                        });
                    }

                    if (node.individual.pedigree_child_node) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.pedigree_child_node, false);
                        color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));
                    }

                    // Draw link between ancestor and pedigree child
                    if (node.individual.pedigree_child_node) {
                        if (window.vertical_inlaws) {
                            drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2,             y: node.y + window.box_height}, 
                                                      {x: node.individual.pedigree_child_node.x + window.box_width / 2, y: node.individual.pedigree_child_node.y});
                        }
                        else {
                            drawLink(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2,             y: node.y + window.box_height / 2}, 
                                                      {x: node.individual.pedigree_child_node.x + window.box_width / 2, y: node.individual.pedigree_child_node.y});
                        }
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
}


function drawCircles(svg_node, rows) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                if (!window.vertical_inlaws) {
                    if ((node.type === 'inlaw') && (node.children_nodes.length > 0)) {
                        [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                        color = d3.hcl(hue, chroma, luminance * (window.link_highlight_percent / 100) * (node.individual.is_descendant || node.individual.is_root ? window.pedigree_highlight_percent / 100 : 1));
                        let left = -window.h_spacing / 2;
                        let right = window.box_width + window.h_spacing / 2;
                        let x_offset = (node.individual.gender === 'M') ? right : left;
                        if (node.spouse_nodes[0].type === 'ancestor') x_offset = (x_offset === right) ? left : right;
                        let radius = window.link_width * 1.5;
                        drawCircle(svg_node, color, {x: node.x + x_offset, y: node.y + window.box_height / 2}, radius);
                    }
                    if ((node.type === 'ancestor') && (node.individual.gender == 'M')) {
                        [hue, chroma, luminance] = getNodeHCL(node.individual.pedigree_child_node ? node.individual.pedigree_child_node : window.root_node, false);
                        color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));
                        drawCircle(svg_node, color, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height / 2}, window.link_width * 1.5);
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
                if (count % 100 == 0) await scheduler.yield();
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

    // Name
    const name = node.individual.name || '';
    const weight = is_bold ? 'bold' : 'normal';
    let main_font_size = window.text_size || window.default_text_size || 12;
    let secondary_font_size = Math.max(6, Math.round(main_font_size * 0.75));

    // Build secondary content before fitting the name
    let secondary_strings = [];   // raw unwrapped strings (for dates, only one line each)
    let place_strings = [];       // raw unwrapped place strings (may need re-wrapping)

    if (window.show_years && !window.show_places) {
        const birth_death = node.individual.birth && node.individual.death ?
            `${node.individual.birth}-${node.individual.death}` :
                node.individual.birth ? `${node.individual.birth}-` :
                    node.individual.death ? `-${node.individual.death}` :
                        '';
        if (birth_death !== '') {
            secondary_strings.push(birth_death);
        }
    }

    if (window.show_places) {
        let birth_line = '';
        let death_line = '';
        if (node.individual.birth_place) {
            birth_line = window.show_years && node.individual.birth ? `B: ${node.individual.birth} ` : 'B: ';
            birth_line += node.individual.birth_place;
        } else if (window.show_years && node.individual.birth && node.individual.birth_place !== undefined) {
            birth_line = `B: ${node.individual.birth}`;
        }
        if (node.individual.death_place) {
            death_line = window.show_years && node.individual.death ? `D: ${node.individual.death} ` : 'D: ';
            death_line += node.individual.death_place;
        } else if (window.show_years && node.individual.death && node.individual.death_place !== undefined) {
            death_line = `D: ${node.individual.death}`;
        }
        if (birth_line) place_strings.push(birth_line);
        if (death_line) place_strings.push(death_line);
    }

    // Wrap place strings and build secondary_lines at a given font size
    function buildSecondaryLines(secFontSize) {
        let result = secondary_strings.slice();
        place_strings.forEach(s => {
            const fit = fitTextInBox(s, window.box_width, secFontSize * 10, 'Arial, sans-serif', 'normal', secFontSize);
            fit.lines.forEach(l => result.push(l));
        });
        return result;
    }

    let secondary_lines = buildSecondaryLines(secondary_font_size);

    // Calculate available height for the name, reserving space for secondary lines
    let name_available_height = window.box_height;
    if (secondary_lines.length > 0) {
        const gap = secondary_font_size * 0.5;
        name_available_height -= secondary_lines.length * secondary_font_size * 1.2 + gap;
        name_available_height = Math.max(name_available_height, main_font_size * 1.2);
    }

    // Fit the name into the available space
    let name_lines = [];
    let name_font_size = main_font_size;
    if (window.show_names && name) {
        const fit = fitTextInBox(name, window.box_width, name_available_height, 'Arial, sans-serif', weight, main_font_size);
        name_lines = fit.lines;
        name_font_size = fit.fontSize;
    }

    // Ensure secondary font never exceeds name font
    secondary_font_size = Math.min(secondary_font_size, name_font_size);
    if (secondary_font_size < Math.max(6, Math.round(main_font_size * 0.75))) {
        // Re-wrap secondary lines at the reduced font size
        secondary_lines = buildSecondaryLines(secondary_font_size);
    }

    // Check whether the name fits at the desired size (no shrink needed)
    const name_fits_at_desired = (name_font_size === main_font_size);

    // Assemble combined lines
    function buildAllLines(secLines) {
        let result = [];
        name_lines.forEach(l => result.push({text: l, type: 'name'}));
        secLines.forEach(l => result.push({text: l, type: 'secondary'}));
        return result;
    }

    let lines = buildAllLines(secondary_lines);
    let text_lines = lines.length;
    if (text_lines === 0) return;

    // Render tspans
    function renderAllTspans(nameFontSize, secFontSize) {
        text_element.selectAll('*').remove();
        lines.forEach((line, i) => {
            let dy = '1.2em';
            if (i === 0) dy = '0em';
            else if (i === name_lines.length) dy = '1.7em';
            const is_name = line.type === 'name';
            text_element.append('tspan')
                .attr('x', window.box_width / 2)
                .attr('text-anchor', 'middle')
                .attr('dy', dy)
                .attr('font-size', is_name ? nameFontSize : secFontSize)
                .attr('font-weight', is_name && is_bold ? 'bold' : 'normal')
                .text(line.text);
        });
    }

    renderAllTspans(name_font_size, secondary_font_size);

    window.min_text_size = Math.min(window.min_text_size, name_font_size);
    window.max_text_size = Math.max(window.max_text_size, name_font_size);

    // Handle overflow: if name fits at desired size, only shrink secondary font
    const min_font_size = 6;
    const max_width = window.box_width;
    const max_height = window.box_height;
    let bbox = text_element.node().getBBox();

    if (bbox.width > max_width || bbox.height > max_height) {
        if (name_fits_at_desired && secondary_lines.length > 0) {
            // Only shrink secondary font, re-wrap places, keep name font unchanged
            let sec_size = secondary_font_size;
            while (sec_size > min_font_size && (bbox.width > max_width || bbox.height > max_height)) {
                sec_size--;
                secondary_lines = buildSecondaryLines(sec_size);
                lines = buildAllLines(secondary_lines);
                text_lines = lines.length;
                renderAllTspans(name_font_size, sec_size);
                bbox = text_element.node().getBBox();
            }
            secondary_font_size = sec_size;
            // Ensure name is never smaller than secondary after shrinking
            if (name_font_size < secondary_font_size) secondary_font_size = name_font_size;
        }

        // If still overflowing, scale both proportionally
        if (bbox.width > max_width || bbox.height > max_height) {
            let scale = Math.min(
                bbox.width > max_width ? max_width / bbox.width : 1,
                bbox.height > max_height ? max_height / bbox.height : 1
            );
            let new_name = Math.max(min_font_size, Math.floor(name_font_size * scale));
            let new_sec = Math.min(new_name, Math.max(min_font_size, Math.floor(secondary_font_size * scale)));
            renderAllTspans(new_name, new_sec);
            window.min_text_size = Math.min(window.min_text_size, new_name);
            window.max_text_size = Math.max(window.max_text_size, new_name);
            bbox = text_element.node().getBBox();
        }
    }

    if (bbox.width <= max_width && bbox.height <= max_height) window.max_text_size = Math.max(window.max_text_size, name_font_size);
    window.auto_box_width = Math.max(window.auto_box_width, window.box_width * (bbox.width / max_width), 20);
    window.auto_box_height = Math.max(window.auto_box_height, bbox.height, 20);

    // Vertically position text in node based on text_align setting
    const line_height = bbox.height / text_lines;
    const pad = window.box_padding || 0;
    let text_y;
    if (window.text_align === 'top') {
        text_y = line_height / 1.25 + pad;
    } else if (window.text_align === 'bottom') {
        text_y = line_height / 1.25 + (window.box_height - bbox.height) - pad;
    } else {
        text_y = line_height / 1.25 + (window.box_height - bbox.height) / 2;
    }
    text_element.attr('y', text_y);

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
    if (window.vertical_inlaws || special == 'duplicate') {
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
    svg_node.append("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", radius)
        .attr("fill", color);
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


function fitTextInBox(str, width, height, fontFamily = 'Arial, sans-serif', fontWeight = 'normal', maxFontSize = null) {
    // Returns { lines: string[], fontSize: number } with the largest font size
    // such that the wrapped lines fit within the given width and height.

    // Reduce effective box size by box padding on all sides
    const padding = window.box_padding || 0;
    width = Math.max(0, width - 2 * padding);
    height = Math.max(0, height - 2 * padding);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    function measureTextWidth(text, fontSize) {
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        return ctx.measureText(text).width;
    }

    // Word-wrap the string into lines that fit within maxWidth at the given fontSize.
    // Splits on spaces and after hyphens; tokens wider than maxWidth are placed on their own line.
    function wrapText(text, fontSize, maxWidth) {
        // Split into tokens that break on spaces and after hyphens (keeping the hyphen with the preceding token)
        const tokens = text.match(/[^\s-]+-|[^\s-]+|\s+/g) || [''];
        // Filter out whitespace-only tokens but track where spaces were
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
    let lo = 1;
    let hi = maxFontSize ? Math.min(Math.ceil(height), maxFontSize) : Math.ceil(height);
    let bestLines = [str];
    let bestSize = 1;

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

    return { lines: bestLines, fontSize: bestSize };
}
