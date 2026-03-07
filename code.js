// File reading functionality
let currentIndividuals = []; // Store parsed individuals globally
let currentFamilies = []; // Store parsed families globally

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileContent = document.getElementById('fileContent');
    const individualSelect = document.getElementById('individualSelect');

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const isValidGedcom = validateGedcom(content);
                
                if (isValidGedcom) {
                    //fileContent.innerHTML = '<p style="color: green;">Valid GEDCOM file loaded!</p><pre>' + content + '</pre>';
                    //console.log('Valid GEDCOM file loaded into memory:', content);
                    fileContent.innerHTML = '<p style="color: green;">Valid GEDCOM file loaded!</p>';
                    console.log('Valid GEDCOM file loaded into memory');
                    
                    // Parse GEDCOM data
                    const parsedData = parseGedcomData(content);
                    currentIndividuals = parsedData.individuals;
                    currentFamilies = parsedData.families;
                    
                    populateIndividualSelect(currentIndividuals);
                } else {
                    fileContent.innerHTML = '<p style="color: red;">Invalid GEDCOM file. Please select a valid GEDCOM file.</p>';
                    console.log('Invalid file selected');
                    // Clear the dropdown
                    individualSelect.innerHTML = '<option>Select an individual...</option>';
                    currentIndividuals = [];
                    currentFamilies = [];
                }
            };
            reader.readAsText(file);
        }
    });

    // Add event listener for individual selection
    individualSelect.addEventListener('change', function(event) {
        updateFamilyTree();
    });

    // Add event listener for generations input
    const generationsInput = document.getElementById('generationsInput');
    generationsInput.addEventListener('input', function(event) {
        updateFamilyTree();
    });

    function updateFamilyTree() {
        const selectedId = individualSelect.value;
        const generations = parseInt(generationsInput.value) || 1;
        
        if (selectedId && selectedId !== 'Select an individual...') {
            const selectedIndividual = currentIndividuals.find(ind => ind.id === selectedId);
            if (selectedIndividual) {
                createFamilyTree(selectedIndividual, generations);
            }
        }
    }
});

function validateGedcom(content) {
    const lines = content.trim().split('\n');
    
    // Check if first line starts with "0 HEAD"
    if (!lines[0] || !lines[0].trim().startsWith('0 HEAD')) {
        return false;
    }
    
    // Check if there's a "0 TRLR" line
    const hasTrailer = lines.some(line => line.trim().startsWith('0 TRLR'));
    if (!hasTrailer) {
        return false;
    }
    
    // Basic structure check: lines should start with level numbers 0-9
    const levelRegex = /^[0-9]/;
    for (let line of lines) {
        line = line.trim();
        if (line && !levelRegex.test(line)) {
            return false;
        }
    }
    
    return true;
}

function parseGedcomData(content) {
    const lines = content.trim().split('\n');
    const individuals = [];
    const families = [];
    let currentIndividual = null;
    let currentFamily = null;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        const parts = line.split(/\s+/); // Split on whitespace
        const level = parseInt(parts[0]);
        
        if (level === 0 && parts.length >= 3 && parts[2] === 'INDI') {
            // New individual: 0 @Ixxx@ INDI
            if (currentIndividual) {
                individuals.push(currentIndividual);
            }
            currentIndividual = { id: parts[1], name: '', famc: null };
            currentFamily = null; // Reset family
        } else if (level === 0 && parts.length >= 3 && parts[2] === 'FAM') {
            // New family: 0 @Fxxx@ FAM
            if (currentFamily) {
                families.push(currentFamily);
            }
            currentFamily = { id: parts[1], husb: null, wife: null, chil: [] };
            currentIndividual = null; // Reset individual
        } else if (level === 1 && parts[1] === 'NAME' && currentIndividual) {
            // Name line: 1 NAME Given /Surname/
            const nameParts = parts.slice(2);
            let name = nameParts.join(' ');
            // Remove all slashes
            name = name.replace(/\//g, '');
            currentIndividual.name = name.trim();
        } else if (level === 1 && parts[1] === 'FAMC' && currentIndividual) {
            // Family as child: 1 FAMC @Fxxx@
            currentIndividual.famc = parts[2];
        } else if (level === 1 && parts[1] === 'HUSB' && currentFamily) {
            // Husband: 1 HUSB @Ixxx@
            currentFamily.husb = parts[2];
        } else if (level === 1 && parts[1] === 'WIFE' && currentFamily) {
            // Wife: 1 WIFE @Ixxx@
            currentFamily.wife = parts[2];
        } else if (level === 1 && parts[1] === 'CHIL' && currentFamily) {
            // Child: 1 CHIL @Ixxx@
            currentFamily.chil.push(parts[2]);
        }
    }
    
    // Add the last individual and family
    if (currentIndividual) {
        individuals.push(currentIndividual);
    }
    if (currentFamily) {
        families.push(currentFamily);
    }
    
    console.log('Parsed individuals:', individuals);
    console.log('Parsed families:', families);
    return { individuals, families };
}

function populateIndividualSelect(individuals) {
    const select = document.getElementById('individualSelect');
    select.innerHTML = '<option>Select an individual...</option>';
    
    individuals.forEach(individual => {
        const option = document.createElement('option');
        option.value = individual.id;
        option.textContent = individual.name || individual.id;
        select.appendChild(option);
    });
}

function createFamilyTree(selectedIndividual, generations = 1) {
    const fileContent = document.getElementById('fileContent');
    
    // Clear previous content
    fileContent.innerHTML = '';
    
    // Build tree data structure
    const treeData = buildFamilyTree(selectedIndividual, generations);
    
    // Calculate SVG dimensions
    const boxWidth = 120;
    const boxHeight = 40;
    const levelHeight = 80;
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
        const family = currentFamilies.find(fam => fam.id === individual.famc);
        if (family) {
            if (family.husb) {
                const father = currentIndividuals.find(ind => ind.id === family.husb);
                if (father) {
                    node.children.push(buildFamilyTree(father, generations, currentGen + 1));
                }
            }
            if (family.wife) {
                const mother = currentIndividuals.find(ind => ind.id === family.wife);
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
    createPersonBoxInSVG(svg, centerX - boxWidth/2, centerY, boxWidth, boxHeight, node.individual.name);
    
    // Draw children (parents in higher generations)
    if (node.children.length > 0) {
        const parentY = centerY - levelHeight;
        const childBottomY = centerY; // Bottom of current node
        const parentTopY = parentY + boxHeight; // Top of parent nodes
        const horizontalLineY = (childBottomY + parentTopY) / 2; // Halfway point
        
        // Calculate positions for children
        const spacing = 180; // Space between siblings
        const startX = centerX - ((node.children.length - 1) * spacing) / 2;
        
        // Draw horizontal line connecting all children at this level
        if (node.children.length > 1) {
            const leftmostX = startX; // Center of first child
            const rightmostX = startX + ((node.children.length - 1) * spacing); // Center of last child
            
            svg.append('line')
                .attr('x1', leftmostX)
                .attr('y1', horizontalLineY)
                .attr('x2', rightmostX)
                .attr('y2', horizontalLineY)
                .attr('stroke', '#666')
                .attr('stroke-width', 2);
        }
        
        // Draw vertical line from current node to horizontal line
        svg.append('line')
            .attr('x1', centerX)
            .attr('y1', childBottomY)
            .attr('x2', centerX)
            .attr('y2', horizontalLineY)
            .attr('stroke', '#666')
            .attr('stroke-width', 2);
        
        // Draw children and their connecting lines
        node.children.forEach((child, index) => {
            if (!child) return;
            
            const childX = startX + (index * spacing);
            const childCenterX = childX; // childX is already the center of the box
            
            // Vertical line from parent box to horizontal line
            svg.append('line')
                .attr('x1', childCenterX)
                .attr('y1', parentTopY)
                .attr('x2', childCenterX)
                .attr('y2', horizontalLineY)
                .attr('stroke', '#666')
                .attr('stroke-width', 2);
            
            // Recursively draw child
            drawTree(svg, child, level + 1, maxLevel, childX, parentY, boxWidth, boxHeight, levelHeight);
        });
    }
}

function createPersonBoxInSVG(svg, x, y, width, height, name) {
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
    
    // Add text with dynamic font sizing
    const textElement = g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', '#1976d2')
        .text(name);
    
    // Adjust font size to fit
    let fontSize = 14;
    const minFontSize = 8;
    const padding = 10; // Padding on each side
    const maxWidth = width - padding;
    
    textElement.attr('font-size', fontSize + 'px');
    
    // Measure text width and adjust font size if needed
    while (fontSize > minFontSize) {
        const textWidth = textElement.node().getComputedTextLength();
        if (textWidth <= maxWidth) {
            break;
        }
        fontSize -= 1;
        textElement.attr('font-size', fontSize + 'px');
    }
}
