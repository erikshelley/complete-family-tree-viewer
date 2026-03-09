// Tree drawing and visualization functionality using D3.js
window.box_width = 120;
window.box_height = 80;
window.h_spacing = 60;
window.v_spacing = 60;

function createFamilyTree(selected_individual) {
    // Clear previous content
    const family_tree_div = document.getElementById('family-tree-div');
    family_tree_div.innerHTML = '';

    // Build tree data structure
    const tree_data = buildTree(selected_individual);
    console.log(tree_data);
    const tree_positions = positionTree(tree_data);
    console.log(tree_positions);

    // Set SVG dimensions
    const svg_width = 700;
    const svg_height = 700;

    // Initial SVG
    const svg = d3.select('#family-tree-div')
        .append('svg')
        .attr('width', svg_width)
        .attr('height', svg_height);

    const [max_x, max_y] = getMaximumDimensions(tree_positions);
    const scale_x = max_x / svg_width;
    const scale_y = max_y / svg_height;
    const max_scale = Math.max(scale_x, scale_y);
    //svg.attr('height', svg_height / max_scale);
    svg.attr('viewBox', `0 0 ${max_scale * svg_width} ${max_scale * svg_height}`);
    svg.call(d3.zoom().scaleExtent([1, 40]).on("zoom", zoomed));
    const svg_node = svg.append("g");
    function zoomed({transform}) { svg_node.attr("transform", transform); }

    //drawTree(svg, treeData, 0, generations - 1, svgWidth / 2, svgHeight - boxHeight - 20, boxWidth, boxHeight, levelHeight, positionsByGeneration);

    // Calculate maximum width using positionsByGeneration
    //const allPositions = [];
    //positionsByGeneration.forEach(posList => {
        //allPositions.push(...posList);
    //});
    //const svgMinX = Math.min(...allPositions) - boxWidth / 2 - 60;
    //const svgMaxX = Math.max(...allPositions) + boxWidth / 2 + 60;
    //const contentWidth = svgMaxX - svgMinX;
    //const scale = contentWidth / svgWidth;
    //svg.attr('height', svgHeight / scale);
    //svg.attr('viewBox', `${svgMinX} 0 ${scale * svgWidth} ${svgHeight}`);

    //svg.attr('height', svg_height);
    //svg.attr('viewBox', `0 0 ${svg_width} ${svg_height}`);

    drawTree(svg_node, tree_positions);
}

function buildTree(individual, current_gen = window.generations, anchor_gen = window.generations, type = 'root') {
    if (!individual || current_gen >= 2 * window.generations) return null;

    const node = {
        individual: individual,
        type: type,
        //inlaw_type: null,
        generation: current_gen,
        anchor_generation: anchor_gen,
        parent_family: null,
        father_node: null,
        mother_node: null,
        spouse_nodes: [],
        children_nodes: []
    };

    if (node.individual.famc && node.generation < 2 * window.generations && ['root', 'ancestor'].includes(node.type)) {
        node.parent_family = window.families.find(fam => fam.id === node.individual.famc);
        if (node.parent_family) {
            if (node.parent_family.husb) {
                const father = window.individuals.find(ind => ind.id === node.parent_family.husb);
                if (father) {
                    father.pedigree_family = node.parent_family;
                    if (node.type != 'root') father.pedigree_child = node.individual;
                    father.is_father = true;
                    node.father_node = buildTree(father, current_gen + 1, anchor_gen + 1, 'ancestor');
                }
            }
            if (node.parent_family.wife) {
                const mother = window.individuals.find(ind => ind.id === node.parent_family.wife);
                if (mother) {
                    mother.pedigree_family = node.parent_family;
                    if (node.type != 'root') mother.pedigree_child = node.individual;
                    node.mother_node = buildTree(mother, current_gen + 1, anchor_gen + 1, 'ancestor');
                }
            }
        }
    }

    if (node.individual.fams && ['root', 'ancestor', 'relative'].includes(node.type)) {
        node.individual.fams.forEach(fam_id => {
            if (node.individual.pedigree_family && node.individual.pedigree_family.id === fam_id) {
                if (node.individual.is_father) {
                    node.individual.pedigree_family.chil.filter(child_id => !node.individual.pedigree_child || child_id != node.individual.pedigree_child.id).forEach(child_id => {
                        const child = window.individuals.find(ind => ind.id === child_id);
                        if (child) {
                            const child_node = buildTree(child, current_gen - 1, anchor_gen, 'relative');
                            if (child_node) node.children_nodes.push(child_node);
                        }
                    });
                }
            }
            else {
                const spouse_family = window.families.find(fam => fam.id === fam_id);
                if (spouse_family) {
                    const spouse_id = spouse_family.husb === node.individual.id ? spouse_family.wife : spouse_family.husb;
                    const spouse = window.individuals.find(ind => ind.id === spouse_id);
                    if (spouse) {
                        spouse.spouse_family = spouse_family;
                        const spouse_node = buildTree(spouse, current_gen, anchor_gen, 'inlaw');
                        if (spouse_node) {
                            //spouse_node.inlaw_type = node.type;
                            node.spouse_nodes.push(spouse_node);
                        }
                    }
                }
            }
        });
    }

    if (node.individual.fams && (anchor_gen - current_gen < window.generations) && node.type === 'inlaw') {
        if (node.individual.spouse_family && node.individual.spouse_family.chil.length > 0) {
            node.individual.spouse_family.chil.forEach(child_id => {
                const child = window.individuals.find(ind => ind.id === child_id);
                if (child) {
                    const child_node = buildTree(child, current_gen - 1, anchor_gen, 'relative');
                    if (child_node) node.children_nodes.push(child_node);
                }
            });
        }
    }

    return node;
}

function positionTree(node, rows = []) {
    if (!node || node.is_positioned) return rows;

    node.level = node.anchor_generation - window.generations;
    if (!node.sub_level) node.sub_level = node.anchor_generation - node.generation;

    if (!rows[node.level]) rows[node.level] = [];
    if (!rows[node.level][node.sub_level]) rows[node.level][node.sub_level] = [];

    if ((node.type === 'root') || (node.individual.gender === 'M' && node.type === 'ancestor')) {
        positionTree(node.father_node, rows);
        positionTree(node.mother_node, rows);
        if ((node.type === 'ancestor') || (node.type === 'root' && !node.father_node && !node.mother_node)) {
            node.spouse_nodes.forEach(spouse_node => { 
                if (node.type === 'root') spouse_node.sub_level = node.sub_level + 1;
                positionTree(spouse_node, rows); 
            });
            node.children_nodes.forEach(child_node => { positionTree(child_node, rows); });
            positionNode(node, rows);
        }
    }

    if ((node.type === 'relative') || (node.individual.gender === 'F' && node.type === 'ancestor')) {
        positionNode(node, rows);
        node.spouse_nodes.forEach(spouse_node => { 
            if (node.type === 'relative') spouse_node.sub_level = node.sub_level + 1;
            positionTree(spouse_node, rows); 
        });
        if (node.type === 'ancestor') {
            positionTree(node.father_node, rows);
            positionTree(node.mother_node, rows);
        }
    }

    if (node.type == 'inlaw') {
        positionNode(node, rows);
        node.children_nodes.forEach(child_node => { 
            child_node.sub_level = node.sub_level + 1;
            positionTree(child_node, rows); 
        });
    }

    return rows;
}

function positionNode(node, rows) {
    node.x = rows[node.level][node.sub_level].length * (window.box_width + window.h_spacing);
    node.y = (((window.generations - 1) * (2 * (window.generations - 1) - node.level)) + node.sub_level) * (window.box_height + window.v_spacing);
    node.is_positioned = true;
    rows[node.level][node.sub_level].push(node);
}

function getMaximumDimensions(rows) {
    let max_x = -Infinity;
    let max_y = -Infinity;
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                max_x = Math.max(max_x, node.x + window.box_width);
                max_y = Math.max(max_y, node.y + window.box_height);
            });
        });
    });
    return [max_x, max_y];
}

function drawTree(svg_node, rows) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {
                createPersonBoxInSVG(svg_node, node.x, node.y, window.box_width, window.box_height, node.individual, node.generation, node.type);
                //createPersonBoxInSVG(d3.select('svg'), node.x, node.y, window.box_width, window.box_height, node.individual, node.generation);
            });
        });
    });
}

/*function drawTree(svg, node, level, maxLevel, centerX, centerY, boxWidth, boxHeight, levelHeight, positionsByGeneration) {
    if (!node) return;

    // Check for position conflicts and adjust centerX if needed
    const positions = positionsByGeneration.get(node.generation) || [];
    const minX = centerX - boxWidth / 2;
    const maxX = centerX + boxWidth / 2;
    
    let adjustedCenterX = centerX;
    let hasConflict = positions.some(pos => {
        const posMinX = pos - boxWidth / 2;
        const posMaxX = pos + boxWidth / 2;
        // Check if boxes would overlap (with small margin)
        return (minX < posMaxX + 5 && maxX > posMinX - 5);
    });
    
    if (hasConflict) {
        // Find nearest available position
        let offset = boxWidth + 60; // spacing between boxes
        let found = false;
        for (let shift = offset; shift < 800; shift += offset) {
            // Try right
            adjustedCenterX = centerX + shift;
            const checkMinX = adjustedCenterX - boxWidth / 2;
            const checkMaxX = adjustedCenterX + boxWidth / 2;
            if (!positions.some(pos => {
                const posMinX = pos - boxWidth / 2;
                const posMaxX = pos + boxWidth / 2;
                return (checkMinX < posMaxX + 5 && checkMaxX > posMinX - 5);
            })) {
                found = true;
                break;
            }
            // Try left
            adjustedCenterX = centerX - shift;
            if (adjustedCenterX > 0) {
                const checkMinX = adjustedCenterX - boxWidth / 2;
                const checkMaxX = adjustedCenterX + boxWidth / 2;
                if (!positions.some(pos => {
                    const posMinX = pos - boxWidth / 2;
                    const posMaxX = pos + boxWidth / 2;
                    return (checkMinX < posMaxX + 5 && checkMaxX > posMinX - 5);
                })) {
                    found = true;
                    break;
                }
            }
        }
    }
    
    // Record this position
    positionsByGeneration.get(node.generation).push(adjustedCenterX);

    // Draw current node at adjusted position
    createPersonBoxInSVG(svg, adjustedCenterX - boxWidth/2, centerY, boxWidth, boxHeight, node.individual, node.generation);

    // Draw children (parents in higher generations)
    if (node.children.length > 0) {
        const parentY = centerY - levelHeight;
        const childBottomY = centerY; // Bottom of current node
        const parentTopY = parentY + boxHeight; // Top of parent nodes

        // Calculate positions for children
        const spacing = 180; // Space between siblings
        const startX = centerX - ((node.children.length - 1) * spacing) / 2;

        // Track actual X positions of drawn children
        const childPositions = [];

        // Draw children and their connecting lines
        node.children.forEach((child, index) => {
            if (!child) return;

            const childX = startX + (index * spacing);
            
            // Track the child's actual position by recording current number of positions
            const positionsBeforeChild = (positionsByGeneration.get(child.generation) || []).length;

            // Recursively draw child
            drawTree(svg, child, level + 1, maxLevel, childX, parentY, boxWidth, boxHeight, levelHeight, positionsByGeneration);
            
            // Get the actual position used for this child
            const allChildPositions = positionsByGeneration.get(child.generation) || [];
            const actualChildX = allChildPositions[allChildPositions.length - 1];
            childPositions.push(actualChildX);
        });

        // Draw connection lines based on number of parents
        if (node.children.length === 2) {
            // Two parents: draw horizontal line between parents, circle in middle, vertical to child
            const fatherX = childPositions[0];
            const motherX = childPositions[1];
            const parentsCenterX = (fatherX + motherX) / 2;
            const horizontalLineY = parentY + boxHeight / 2; // Vertically centered on parent boxes

            // Calculate line color based on parent's generation (use father's generation)
            const parentHue = (node.children[0].generation * 60) % 360;
            const parentChroma = 50;
            const parentLuminance = 50;
            const lineColor = d3.hcl(parentHue, parentChroma, parentLuminance);

            // Horizontal line from right edge of husband to left edge of wife
            const fatherRightEdge = fatherX + boxWidth / 2;
            const motherLeftEdge = motherX - boxWidth / 2;
            svg.append('line')
                .attr('x1', fatherRightEdge)
                .attr('y1', horizontalLineY)
                .attr('x2', motherLeftEdge)
                .attr('y2', horizontalLineY)
                .attr('stroke', lineColor)
                .attr('stroke-width', 2);

            // Circle in the middle of the horizontal line
            const lineCenterX = (fatherRightEdge + motherLeftEdge) / 2;
            svg.append('circle')
                .attr('cx', lineCenterX)
                .attr('cy', horizontalLineY)
                .attr('r', 10) // 20px diameter = 10px radius
                .attr('fill', lineColor);

            // Vertical line from circle to child (using adjusted center position)
            svg.append('line')
                .attr('x1', lineCenterX)
                .attr('y1', horizontalLineY + 10) // Start from bottom of circle
                .attr('x2', adjustedCenterX)
                .attr('y2', childBottomY)
                .attr('stroke', lineColor)
                .attr('stroke-width', 2);
        } else if (node.children.length === 1) {
            // One parent: draw vertical line directly from parent to child
            const parentX = childPositions[0];
            const horizontalLineY = (childBottomY + parentTopY) / 2;

            // Calculate line color based on parent's generation
            const parentHue = (node.children[0].generation * 60) % 360;
            const parentChroma = 50;
            const parentLuminance = 50;
            const lineColor = d3.hcl(parentHue, parentChroma, parentLuminance);

            // Vertical line from parent to child
            svg.append('line')
                .attr('x1', parentX)
                .attr('y1', parentTopY)
                .attr('x2', adjustedCenterX)
                .attr('y2', childBottomY)
                .attr('stroke', lineColor)
                .attr('stroke-width', 2);
        }
    }
}*/

function createPersonBoxInSVG(svg, x, y, width, height, individual, generation, type) {
    const g = svg.append('g')
        .attr('transform', `translate(${x}, ${y})`);

    // Calculate background color based on generation
    // Use HCL for equal luminance regardless of hue
    const hue = (generation * 60) % 360; // 60 degrees apart for distinct colors
    const chroma = type === 'inlaw' ? 0 : 25;
    const luminance = 75;
    const border_luminance = 50;
    
    const fill_color = d3.hcl(hue, chroma, luminance);
    const stroke_color = d3.hcl(hue, chroma, border_luminance);

    // Draw rectangle
    g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', fill_color)
        .attr('stroke', stroke_color)
        .attr('stroke-width', 2)
        .attr('rx', 8);

    // Add text with 3 lines: name (2 lines), birth-death (1 line)
    const text_element = g.append('text')
        .attr('x', width / 2)
        .attr('y', 24) // Vertically centered in 80px box
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', '#000000'); // Black font

    // Split name into two lines if too long
    const name = individual.name || '';
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

    // Add name lines
    if (line1) {
        text_element.append('tspan')
            .attr('x', width / 2)
            .attr('dy', '0em')
            .text(line1);
    }
    if (line2) {
        text_element.append('tspan')
            .attr('x', width / 2)
            .attr('dy', '1.2em')
            .text(line2);
    }

    // Add birth-death line
    const birth_death = individual.birth && individual.death ? 
        `${individual.birth}-${individual.death}` : 
        individual.birth ? 
        `${individual.birth}-` : 
        individual.death ? 
        `-${individual.death}` : 
        '';

    if (birth_death) {
        text_element.append('tspan')
            .attr('x', width / 2)
            .attr('dy', line2 ? '1.4em' : '1.2em')
            .text(birth_death);
    }

    // Adjust font size if needed
    let font_size = 12;
    const min_font_size = 8;
    const padding = 6;
    const max_width = width - padding;

    // Check if text fits
    const bbox = text_element.node().getBBox();
    if (bbox.width > max_width) {
        font_size = Math.max(min_font_size, font_size * (max_width / bbox.width));
        text_element.attr('font-size', font_size + 'px');
    }
}
