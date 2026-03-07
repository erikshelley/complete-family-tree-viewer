// Tree drawing and visualization functionality using D3.js

function createFamilyTree(selectedIndividual, generations = 1) {
    const fileContent = document.getElementById('fileContent');

    // Clear previous content
    fileContent.innerHTML = '';

    // Build tree data structure
    const treeData = buildFamilyTree(selectedIndividual, generations);

    // Calculate SVG dimensions
    const boxWidth = 120;
    const boxHeight = 80;
    const levelHeight = 160;
    const svgWidth = 800;
    const svgHeight = generations * levelHeight + boxHeight + 40;

    // Create SVG
    const svg = d3.select('#fileContent')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    // Draw the tree
    drawTree(svg, treeData, 0, generations - 1, svgWidth / 2, svgHeight - boxHeight - 20, boxWidth, boxHeight, levelHeight);
}

function buildFamilyTree(individual, generations, currentGen = 0) {
    if (!individual || currentGen >= generations) {
        return null;
    }

    const node = {
        individual: individual,
        generation: currentGen,
        children: []
    };

    // Find parents
    if (individual.famc && currentGen < generations - 1) {
        const family = window.currentFamilies.find(fam => fam.id === individual.famc);
        if (family) {
            if (family.husb) {
                const father = window.currentIndividuals.find(ind => ind.id === family.husb);
                if (father) {
                    node.children.push(buildFamilyTree(father, generations, currentGen + 1));
                }
            }
            if (family.wife) {
                const mother = window.currentIndividuals.find(ind => ind.id === family.wife);
                if (mother) {
                    node.children.push(buildFamilyTree(mother, generations, currentGen + 1));
                }
            }
        }
    }

    return node;
}

function drawTree(svg, node, level, maxLevel, centerX, centerY, boxWidth, boxHeight, levelHeight) {
    if (!node) return;

    // Draw current node
    createPersonBoxInSVG(svg, centerX - boxWidth/2, centerY, boxWidth, boxHeight, node.individual);

    // Draw children (parents in higher generations)
    if (node.children.length > 0) {
        const parentY = centerY - levelHeight;
        const childBottomY = centerY; // Bottom of current node
        const parentTopY = parentY + boxHeight; // Top of parent nodes

        // Calculate positions for children
        const spacing = 180; // Space between siblings
        const startX = centerX - ((node.children.length - 1) * spacing) / 2;

        // Draw children and their connecting lines
        node.children.forEach((child, index) => {
            if (!child) return;

            const childX = startX + (index * spacing);
            const childCenterX = childX; // childX is already the center of the box

            // Recursively draw child
            drawTree(svg, child, level + 1, maxLevel, childX, parentY, boxWidth, boxHeight, levelHeight);
        });

        // Draw connection lines based on number of parents
        if (node.children.length === 2) {
            // Two parents: draw horizontal line between parents, circle in middle, vertical to child
            const fatherX = startX;
            const motherX = startX + spacing;
            const parentsCenterX = (fatherX + motherX) / 2;
            const horizontalLineY = parentY + boxHeight / 2; // Vertically centered on parent boxes

            // Horizontal line from right edge of husband to left edge of wife
            const fatherRightEdge = fatherX + boxWidth / 2;
            const motherLeftEdge = motherX - boxWidth / 2;
            svg.append('line')
                .attr('x1', fatherRightEdge)
                .attr('y1', horizontalLineY)
                .attr('x2', motherLeftEdge)
                .attr('y2', horizontalLineY)
                .attr('stroke', '#666')
                .attr('stroke-width', 2);

            // Circle in the middle of the horizontal line
            const lineCenterX = (fatherRightEdge + motherLeftEdge) / 2;
            svg.append('circle')
                .attr('cx', lineCenterX)
                .attr('cy', horizontalLineY)
                .attr('r', 10) // 20px diameter = 10px radius
                .attr('fill', '#666');

            // Vertical line from circle to child
            svg.append('line')
                .attr('x1', lineCenterX)
                .attr('y1', horizontalLineY + 10) // Start from bottom of circle
                .attr('x2', centerX)
                .attr('y2', childBottomY)
                .attr('stroke', '#666')
                .attr('stroke-width', 2);
        } else if (node.children.length === 1) {
            // One parent: draw vertical line directly from parent to child
            const parentX = startX;
            const horizontalLineY = (childBottomY + parentTopY) / 2;

            // Vertical line from parent to child
            svg.append('line')
                .attr('x1', parentX)
                .attr('y1', parentTopY)
                .attr('x2', centerX)
                .attr('y2', childBottomY)
                .attr('stroke', '#666')
                .attr('stroke-width', 2);
        }
    }
}

function createPersonBoxInSVG(svg, x, y, width, height, individual) {
    const g = svg.append('g')
        .attr('transform', `translate(${x}, ${y})`);

    // Draw rectangle
    g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#e3f2fd')
        .attr('stroke', '#1976d2')
        .attr('stroke-width', 2)
        .attr('rx', 8);

    // Add text with 3 lines: name (2 lines), birth-death (1 line)
    const textElement = g.append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', '#1976d2');

    // Split name into two lines if too long
    const name = individual.name || '';
    const maxLineLength = 14; // Approximate characters per line for 2-line name

    let line1, line2;
    if (name.length <= maxLineLength) {
        line1 = name;
        line2 = '';
    } else {
        // Find a good break point
        const words = name.split(' ');
        line1 = words[0];
        let i = 1;
        while (i < words.length && (line1 + ' ' + words[i]).length <= maxLineLength) {
            line1 += ' ' + words[i];
            i++;
        }
        line2 = words.slice(i).join(' ');
    }

    // Add name lines
    if (line1) {
        textElement.append('tspan')
            .attr('x', width / 2)
            .attr('dy', '0em')
            .text(line1);
    }
    if (line2) {
        textElement.append('tspan')
            .attr('x', width / 2)
            .attr('dy', '1.2em')
            .text(line2);
    }

    // Add birth-death line
    const birthDeath = individual.birth && individual.death ? 
        `${individual.birth}-${individual.death}` : 
        individual.birth ? 
        `${individual.birth}-` : 
        individual.death ? 
        `-${individual.death}` : 
        '';

    if (birthDeath) {
        textElement.append('tspan')
            .attr('x', width / 2)
            .attr('dy', line2 ? '1.4em' : '1.2em')
            .text(birthDeath);
    }

    // Adjust font size if needed
    let fontSize = 12;
    const minFontSize = 8;
    const padding = 6;
    const maxWidth = width - padding;

    // Check if text fits
    const bbox = textElement.node().getBBox();
    if (bbox.width > maxWidth) {
        fontSize = Math.max(minFontSize, fontSize * (maxWidth / bbox.width));
        textElement.attr('font-size', fontSize + 'px');
    }
}