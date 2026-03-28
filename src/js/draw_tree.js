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
        .attr('fill', window.transparent_bg_rect ? "rgba(0,0,0,0)" : window.tree_color || "#000")
        .attr('stroke', "000")
        .attr('stroke-width', 0);

    drawNonBoldLinks(svg_node, rows);
    drawBoldLinks(svg_node, rows);
    drawCircles(svg_node, rows);
    drawNodes(svg_node, rows);

    const root_name_span = document.getElementById('root-name');
    root_name_span.textContent = '\u00A0\u00A0\u2022\u00A0\u00A0' + selected_individual.name;

    const status_bar_div = document.getElementById('status-bar-div');
    let people_shown;
    if (node_count === "1") people_shown = `${node_count}&nbsp;Person&nbsp;Shown`;
    else people_shown = `${node_count} People`;
    let spacer = '&nbsp;&nbsp;&bull;&nbsp;&nbsp;';
    let tree_dimensions = `${spacer}${Math.ceil(max_x).toLocaleString()} x ${Math.ceil(max_y).toLocaleString()}`;
    let print_dimensions = `${(Math.ceil(max_x) / 300).toFixed(1)}" x ${(Math.ceil(max_y) / 300).toFixed(1)}" @ 300 DPI`;
    let min_text_size = `${spacer}Min Font: ${window.min_text_size}px`;
    let max_text_size = `${spacer}Max Font: ${window.max_text_size}px`;
    let earliest_birth_year = window.earliest_birth_year ? `${spacer}Earliest Birth: ${window.earliest_birth_year}` : '';
    status_bar_div.innerHTML = `${people_shown}${tree_dimensions}${spacer}${print_dimensions}${min_text_size}${max_text_size}${earliest_birth_year}`;

    d3.select('body').on('keydown.tree', function (event) {
        const k = d3.zoomTransform(svg.node()).k;
        const step_x = (bounding_box.width - 24) * max_scale * 0.1 / k;
        const step_y = (bounding_box.height - 40) * max_scale * 0.1 / k;
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
                        node.spouse_nodes.filter(spouse_node => !(spouse_node.stacked && !spouse_node.stack_top)).forEach(spouse_node => {
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
                if (node.type === 'ancestor' && node.individual.gender === 'M') {
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

                // Draw link between stacked in-law and previous stacked in-law
                if ((node.type === 'inlaw') && node.stacked && !node.stack_top) {
                    const pedigree_factor = (node.individual.is_descendant || node.individual.is_root) ? window.pedigree_highlight_percent / 100 : 1;
                    const inlaw_color = d3.hcl(hue, 0, luminance * (window.inlaw_link_highlight_percent / 100) * pedigree_factor);
                    drawLink(svg_node, inlaw_color, {x: node.x + window.box_width / 2, y: node.y},
                                                    {x: node.x + window.box_width / 2, y: node.y - window.v_spacing}, 'inlaw');
                }

            });
        });
    });
}


function drawBoldLinks(svg_node, rows) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                if (node.type === 'ancestor' && node.individual.gender === 'M') {

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
                        const [hue, chroma, luminance] = getNodeHCL(node.children_nodes[0], false);
                        const color = d3.hcl(hue, chroma, luminance * (window.link_highlight_percent / 100) * (node.individual.is_descendant || node.individual.is_root ? window.pedigree_highlight_percent / 100 : 1));
                        let left = -window.h_spacing / 2;
                        let right = window.box_width + window.h_spacing / 2;
                        let x_offset = (node.individual.gender === 'M') ? right : left;
                        if (node.spouse_nodes[0].type === 'ancestor') x_offset = (x_offset === right) ? left : right;
                        let radius = window.link_width * 1.5;
                        drawCircle(svg_node, color, {x: node.x + x_offset, y: node.y + window.box_height / 2}, radius);
                    }
                    if ((node.type === 'ancestor') && (node.individual.gender === 'M')) {
                        const [hue, chroma, luminance] = getNodeHCL(node.individual.pedigree_child_node ? node.individual.pedigree_child_node : window.root_node, false);
                        const color = d3.hcl(hue, chroma, luminance * (window.pedigree_highlight_percent / 100) * (window.link_highlight_percent / 100));
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
        const fit = fitTextInBox(s, window.box_width, secFontSize * 10, 'Arial, sans-serif', 'normal', secFontSize);
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
            .attr('x', window.box_width / 2)
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
    const max_width = window.box_width;
    const max_height = window.box_height;
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

// Position text element vertically based on text_align setting
function alignTextVertically(text_element, bbox, text_lines) {
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

function getNameAvailableHeight(secondary_lines, secondary_font_size) {
    let name_available_height = window.box_height;
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
            const fit = fitTextInBox(name, window.box_width, name_available_height, 'Arial, sans-serif', weight, main_font_size);
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

function ensureTextShadowFilter(selection) {
    if (window.text_shadow === false) return null;

    const selection_node = selection && typeof selection.node === 'function' ? selection.node() : null;
    if (!selection_node) return null;

    const svg = (selection_node.tagName && selection_node.tagName.toLowerCase() === 'svg') ? selection_node : selection_node.ownerSVGElement;
    if (!svg) return null;

    let filter = svg.querySelector(`#${TREE_TEXT_SHADOW_FILTER_ID}`);
    if (filter) return TREE_TEXT_SHADOW_FILTER_ID;

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

    return TREE_TEXT_SHADOW_FILTER_ID;
}

function drawText(g, node) {
    const text_luminance = window.text_brightness || 0;
    const text_color = d3.hcl(0, 0, text_luminance);
    const is_bold = ((node.type === 'ancestor' || node.individual.is_root || node.individual.is_descendant) && (window.pedigree_highlight_percent !== 100));
    const text_shadow_filter_id = ensureTextShadowFilter(g);
    const text_element = g.append('text')
        .attr('x', window.box_width / 2)
        .attr('y', window.box_height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-weight', is_bold ? 'bold' : 'normal')
        .attr('font-size', (window.text_size || window.default_text_size) + 'px')
        .attr('fill', text_color);

    if (text_shadow_filter_id) {
        text_element.attr('filter', `url(#${text_shadow_filter_id})`);
    }

    const name = node.individual.name || '';
    const weight = is_bold ? 'bold' : 'normal';
    const main_font_size = window.text_size || window.default_text_size || 12;

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
        const conservative_fit = fitTextInBox(name, window.box_width * 0.92, retry_name_height, 'Arial, sans-serif', weight, name_font_size);
        if ((conservative_fit.fontSize === name_font_size) && (conservative_fit.lines.length > 1)) {
            const candidate_lines = buildAllLines(conservative_fit.lines, current_secondary_lines);
            const candidate_est = estimateTextDimensions(candidate_lines, conservative_fit.lines.length, name_font_size, secondary_font_size, is_bold);
            if ((candidate_est.width <= window.box_width) && (candidate_est.height <= window.box_height)) {
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

    const max_width = window.box_width;
    const max_height = window.box_height;
    if (bbox.width <= max_width && bbox.height <= max_height) window.max_text_size = Math.max(window.max_text_size, name_font_size);
    window.auto_box_width = Math.max(window.auto_box_width, window.box_width * (bbox.width / max_width), 20);
    window.auto_box_height = Math.max(window.auto_box_height, bbox.height, 20);

    alignTextVertically(text_element, bbox, lines.length);
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
    if (window.vertical_inlaws || special === 'duplicate') {
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


// Shared off-screen canvas for text measurement (created once)
const _measureCanvas = document.createElement('canvas');
const _measureCtx = _measureCanvas.getContext('2d');

function fitTextInBox(str, width, height, fontFamily = 'Arial, sans-serif', fontWeight = 'normal', maxFontSize = null) {
    // Returns { lines: string[], fontSize: number } with the largest font size
    // such that the wrapped lines fit within the given width and height.

    // Reduce effective box size by box padding on all sides
    const padding = window.box_padding || 0;
    width = Math.max(0, width - 2 * padding);
    height = Math.max(0, height - 2 * padding);

    const ctx = _measureCtx;

    function measureTextWidth(text, fontSize) {
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        return ctx.measureText(text).width;
    }

    // Word-wrap the string into lines that fit within maxWidth at the given fontSize.
    // Splits on spaces and after hyphens; tokens wider than maxWidth are placed on their own line.
    function wrapText(text, fontSize, maxWidth) {
        function splitTokenToWidth(token) {
            if (measureTextWidth(token, fontSize) <= maxWidth) return [token];

            const pieces = [];
            let current = '';

            for (const ch of token) {
                const candidate = current + ch;
                if (current && (measureTextWidth(candidate, fontSize) > maxWidth)) {
                    pieces.push(current);
                    current = ch;
                } else {
                    current = candidate;
                }
            }

            if (current) pieces.push(current);
            return pieces.length > 0 ? pieces : [token];
        }

        // Split into tokens that break on spaces and after hyphens (keeping the hyphen with the preceding token)
        const tokens = text.match(/[^\s-]+-|[^\s-]+|\s+/g) || [''];
        // Filter out whitespace-only tokens but track where spaces were
        const parts = [];
        for (const token of tokens) {
            if (/^\s+$/.test(token)) continue;
            splitTokenToWidth(token).forEach(piece => parts.push(piece));
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

    return { lines: bestLines, fontSize: bestSize };
}
