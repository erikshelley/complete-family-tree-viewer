// Tree drawing and visualization functionality using D3.js

function createFamilyTree(selected_individual) {
    // Clear previous content
    const family_tree_div = document.getElementById('family-tree-div');
    family_tree_div.innerHTML = '';

    // Build tree data structure
    const treeData = buildFamilyTree(selected_individual);
    console.log(treeData);

    // Set SVG dimensions
    const box_width = 120;
    const box_height = 80;
    const level_height = 160;
    const svg_width = 800;
    const svg_height = window.generations * level_height + box_height + 40;

    // Track occupied positions per generation to prevent overlaps
    //const positionsByGeneration = new Map();
    //for (let i = 0; i < generations; i++) {
        //positionsByGeneration.set(i, []);
    //}

    // Initial SVG
    const svg = d3.select('#familyTreeDiv')
        .append('svg')
        .attr('width', svg_width)
        .attr('height', svg_height);

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
    svg.attr('height', svg_height);
    svg.attr('viewBox', `0 0 ${svg_width} ${svg_height}`);
}

function buildFamilyTree(individual, current_gen = window.generations, anchor_gen = window.generations, type = 'root') {
    if (!individual || current_gen >= 2 * window.generations) return null;

    const node = {
        individual: individual,
        type: type,
        generation: current_gen,
        parent_family: null,
        father_node: null,
        mother_node: null,
        spouse_nodes: [],
        children_nodes: []
    };

    if (node.individual.famc && node.generation < 2 * window.generations - 1 && ['root', 'ancestor'].includes(node.type)) {
        node.parent_family = window.families.find(fam => fam.id === node.individual.famc);
        if (node.parent_family) {
            if (node.parent_family.husb) {
                const father = window.individuals.find(ind => ind.id === node.parent_family.husb);
                if (father) {
                    father.pedigree_family = node.parent_family;
                    father.pedigree_child = node.individual;
                    father.is_father = true;
                    node.father_node = buildFamilyTree(father, current_gen + 1, anchor_gen + 1, 'ancestor');
                }
            }
            if (node.parent_family.wife) {
                const mother = window.individuals.find(ind => ind.id === node.parent_family.wife);
                if (mother) {
                    mother.pedigree_family = node.parent_family;
                    mother.pedigree_child = node.individual;
                    node.mother_node = buildFamilyTree(mother, current_gen + 1, anchor_gen + 1, 'ancestor');
                }
            }
        }
    }

    if (node.individual.fams && ['root', 'ancestor', 'relative'].includes(node.type)) {
        node.individual.fams.map(fam_id => {
            if (node.individual.pedigree_family && node.individual.pedigree_family.id === fam_id) {
                if (node.individual.is_father) {
                    node.individual.pedigree_family.chil.filter(child_id => child_id != node.individual.pedigree_child.id).map(child_id => {
                        const child = window.individuals.find(ind => ind.id === child_id);
                        if (child) {
                            const child_node = buildFamilyTree(child, current_gen - 1, anchor_gen, 'relative');
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
                        const spouse_node = buildFamilyTree(spouse, current_gen, anchor_gen, 'inlaw');
                        if (spouse_node) node.spouse_nodes.push(spouse_node);
                    }
                }
            }
        });
    }

    if (node.individual.fams && (anchor_gen - current_gen < window.generations) && node.type === 'inlaw') {
        if (node.individual.spouse_family && node.individual.spouse_family.chil.length > 0) {
            node.individual.spouse_family.chil.map(child_id => {
                const child = window.individuals.find(ind => ind.id === child_id);
                if (child) {
                    const child_node = buildFamilyTree(child, current_gen - 1, anchor_gen, 'relative');
                    if (child_node) node.children_nodes.push(child_node);
                }
            });
        }
    }

    return node;
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

function createPersonBoxInSVG(svg, x, y, width, height, individual, generation) {
    const g = svg.append('g')
        .attr('transform', `translate(${x}, ${y})`);

    // Calculate background color based on generation
    // Use HCL for equal luminance regardless of hue
    const hue = (generation * 60) % 360; // 60 degrees apart for distinct colors
    const chroma = 50; // Colorfulness/chroma
    const luminance = 75; // Equal luminance for all backgrounds
    const border_luminance = 50; // 25% darker for borders
    
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
