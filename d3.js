// Tree drawing and visualization functionality using D3.js
window.box_width = 120;
window.box_height = 80;
window.h_spacing = 40;
window.v_spacing = 80;
window.level_boundaries = [];
window.level_heights = [];

function createFamilyTree(selected_individual) {
    // Clear previous content
    const family_tree_div = document.getElementById('family-tree-div');
    family_tree_div.innerHTML = '';
    window.level_boundaries = [];
    window.level_heights = [];

    // Build tree data structure
    const tree_data = buildTree(selected_individual);
    //console.log(tree_data);
    const tree_positions = positionTree(tree_data);
    setHeights(tree_positions);
    console.log(tree_positions);
    //console.log(window.level_heights);

    // Set SVG dimensions
    const svg_width = 980;
    const svg_height = 880;

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
    //svg.attr('viewBox', `0 0 ${max_scale * svg_width} ${max_scale * svg_height}`);
    svg.attr('viewBox', `0 0 ${svg_width} ${svg_height}`);
    svg.call(d3.zoom().scaleExtent([0.01, 100]).on("zoom", zoomed));
    const svg_node = svg.append("g");
    function zoomed({transform}) { svg_node.attr("transform", transform); }

    drawTree(svg_node, tree_positions);
}

function createUnknownPerson(gender, node) {
    const person = { id: null, name: 'Unknown', famc: null, fams: [node.parent_family], birth: '', death: '', gender: gender };
    //if (gender === 'M') node.parent_family.husb = person;
    //if (gender === 'F') node.parent_family.wife = person;
    return person;
}

function buildTree(individual, current_gen = window.generations, anchor_gen = window.generations, type = 'root') {
    if (!individual || current_gen >= 2 * window.generations) return null;

    const node = {
        individual: individual,
        type: type,
        generation: current_gen,
        anchor_generation: anchor_gen,
        parent_family: null,
        father_node: null,
        mother_node: null,
        parent_node: null,
        spouse_nodes: [],
        children_nodes: []
    };

    // Add parents
    if (node.individual.famc && node.generation < 2 * window.generations && ['root', 'ancestor'].includes(node.type)) {
        node.parent_family = window.families.find(fam => fam.id === node.individual.famc);
        if (node.parent_family) {
            const father = node.parent_family.husb ? window.individuals.find(ind => ind.id === node.parent_family.husb) : createUnknownPerson('M', node);
            father.pedigree_family = node.parent_family;
            if (node.type != 'root') father.pedigree_child_node = node;
            father.is_father = true;
            node.father_node = buildTree(father, current_gen + 1, anchor_gen + 1, 'ancestor');

            const mother = node.parent_family.wife ? window.individuals.find(ind => ind.id === node.parent_family.wife) : createUnknownPerson('F', node);
            mother.pedigree_family = node.parent_family;
            if (node.type != 'root') mother.pedigree_child_node = node;
            node.mother_node = buildTree(mother, current_gen + 1, anchor_gen + 1, 'ancestor');

            if (node.father_node && node.mother_node) {
                node.father_node.pedigree_spouse_node = node.mother_node;
                node.mother_node.pedigree_spouse_node = node.father_node;
            }
        }
    }

    // Add spouses and non-inlaw children
    if (node.individual.fams && ['root', 'ancestor', 'relative'].includes(node.type)) {
        node.individual.fams.forEach(fam_id => {
            if (node.individual.pedigree_family && node.individual.pedigree_family.id === fam_id) {
                if (node.individual.is_father) {
                    node.individual.pedigree_family.chil.filter(child_id => !node.individual.pedigree_child_node || child_id != node.individual.pedigree_child_node.individual.id).forEach(child_id => {
                        const child = window.individuals.find(ind => ind.id === child_id);
                        if (child) {
                            const child_node = buildTree(child, current_gen - 1, anchor_gen - 1, 'relative');
                            if (child_node) {
                                child_node.parent_node = node;
                                node.children_nodes.push(child_node);
                            }
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
                            spouse_node.spouse_nodes.push(node);
                            node.spouse_nodes.push(spouse_node);
                        }
                    }
                }
            }
        });
    }

    // Add children
    if (node.individual.fams && (anchor_gen - current_gen < window.generations) && node.type === 'inlaw') {
        if (node.individual.spouse_family && node.individual.spouse_family.chil.length > 0) {
            node.individual.spouse_family.chil.forEach(child_id => {
                const child = window.individuals.find(ind => ind.id === child_id);
                if (child) {
                    const child_node = buildTree(child, current_gen - 1, anchor_gen, 'relative');
                    if (child_node) {
                        child_node.parent_node = node;
                        node.children_nodes.push(child_node);
                    }
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

    if (!rows[node.level]) {
        rows[node.level] = [];
        window.level_boundaries[node.level] = 0;
        window.level_heights[node.level] = 0;
    }
    if (!rows[node.level][node.sub_level]) rows[node.level][node.sub_level] = [];

    if ((node.type === 'root') || (node.individual.gender === 'M' && node.type === 'ancestor')) {
        positionTree(node.father_node, rows);
        positionTree(node.mother_node, rows);

        if ((node.type === 'ancestor') || (node.type === 'root' && !node.father_node && !node.mother_node)) {

            // Position inlaws of male ancestor (or root if they have no parents)
            let spouse_min_x = Infinity, spouse_max_x = -Infinity;
            node.spouse_nodes.forEach(spouse_node => { 
                if (node.type === 'root') spouse_node.sub_level = node.sub_level + 1;
                positionTree(spouse_node, rows); 
                spouse_min_x = Math.min(spouse_min_x, spouse_node.min_x);
                spouse_max_x = Math.max(spouse_max_x, spouse_node.max_x);
            });

            // Position children of male ancestor (or root if they have no parents)
            let child_min_x = Infinity, child_max_x = -Infinity;
            node.children_nodes.forEach(child_node => { 
                positionTree(child_node, rows); 
                child_min_x = Math.min(child_min_x, child_node.min_x);
                child_max_x = Math.max(child_max_x, child_node.max_x);
            });

            // Position male ancestor (or root if they have no parents)
            positionNode(node, rows);

            // Male ancestor needs to be to the right of his siblings and their descendants
            if (node.father_node) {
                let sib_max_x = -Infinity;
                node.father_node.children_nodes.forEach(sibling_node => { sib_max_x = Math.max(sib_max_x, sibling_node.max_x); });
                let shift_x = sib_max_x - node.x;
                //console.log(`Shifting ${node.individual.name} and descendants by ${shift_x} to be to the right of siblings`);
                //shift_x = 0;
                if (shift_x > 0) {
                    node.x += shift_x;
                    node.min_x += shift_x;
                    node.max_x += shift_x;
                    node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                }
            }

            // Male ancestor needs to be to the right of his inlaws and their descendants
            if (node.spouse_nodes.length > 0) {
                let shift_x = spouse_max_x + window.h_spacing - node.x - window.box_width;
                //console.log(`Shifting ${node.individual.name} and descendants by ${shift_x} to be to the right of in-laws`);
                //shift_x = 0;
                if (shift_x > 0) {
                    node.x += shift_x;
                    node.min_x += shift_x;
                    node.max_x += shift_x;
                }
            }

            // Center children under ancestor if there is no pedigree child (ie. these are the parents of root)
            if (node.children_nodes.length > 0 && !node.individual.pedigree_child_node) {
                let shift_x = node.x + window.box_width + window.h_spacing / 2 - (child_min_x + child_max_x) / 2;
                if (shift_x > 0) { // Move the children to the right
                    node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); });
                    child_min_x += shift_x;
                    child_max_x += shift_x;
                }
                if (shift_x < 0) { // Move the parent to the right
                    node.x -= shift_x;
                    node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, -shift_x); });
                }
            }

            node.min_x = Math.min(node.x, child_min_x);
            node.max_x = Math.max(node.x + window.box_width, child_max_x);
            //console.log(`${node.individual.name} : [${node.min_x} - ${node.max_x}]`);

            // Male ancestors need to be to the right of the level boundary's max_x
            if (window.level_boundaries[node.level]) {
                const boundary_node = window.level_boundaries[node.level];
                let max_x = boundary_node.max_x;
                //const boundary_spouse_node = boundary_node.pedigree_spouse_node;
                //if (boundary_spouse_node) max_x = Math.max(max_x, boundary_spouse_node.max_x);
                let shift_x = max_x + window.h_spacing - (node.x + window.box_width + window.h_spacing / 2);
                if (shift_x > 0) {
                    node.x += shift_x;
                    node.min_x += shift_x;
                    node.max_x += shift_x;
                    node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                    node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); });
                    //shiftSiblings(node, shift_x);
                }
            }
        }
    }

    if ((node.type === 'relative') || (node.individual.gender === 'F' && node.type === 'ancestor')) {
        positionNode(node, rows);
        node.min_x = Infinity;
        node.max_x = -Infinity;

        // Keep track of this female ancestor as the boundary of her level so that later nodes do not cross the line down to her children
        if (node.type === 'ancestor') window.level_boundaries[node.level] = node;

        if (node.spouse_nodes.length == 0) {
            node.min_x = node.x;
            node.max_x = node.x + window.box_width;
        }
        
        // Position spouses
        node.spouse_nodes.forEach(spouse_node => { 
            if (node.type === 'relative') spouse_node.sub_level = node.sub_level + 1;
            positionTree(spouse_node, rows); 
            node.min_x = Math.min(node.min_x, spouse_node.min_x);
            node.max_x = Math.max(node.max_x, spouse_node.max_x);
        });

        // Center person above their spouses
        if (node.type == 'relative') {
            let shift_x = node.x + window.box_width / 2 - (node.min_x + node.max_x) / 2;
            if (shift_x > 0) {
                node.spouse_nodes.forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
                node.min_x += shift_x;
                node.max_x += shift_x;
            }
            if (shift_x < 0) node.x -= shift_x;
        }

        if (node.type === 'ancestor') {
            positionTree(node.father_node, rows);
            positionTree(node.mother_node, rows);

            // Center female ancestor and her husband under their parents
            const pedigree_spouse_node = node.pedigree_spouse_node;
            let min_x = node.x - window.h_spacing / 2;
            let max_x = min_x;
            if (pedigree_spouse_node) {
                if (pedigree_spouse_node.father_node && pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.mother_node.x - window.h_spacing / 2;
                if (pedigree_spouse_node.father_node && !pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.father_node.x + window.box_width / 2;
                if (!pedigree_spouse_node.father_node && pedigree_spouse_node.mother_node) min_x = pedigree_spouse_node.mother_node.x + window.box_width / 2;
            }
            if (node.father_node && node.mother_node) max_x = node.mother_node.x - window.h_spacing / 2;
            if (node.father_node && !node.mother_node) max_x = node.father_node.x + window.box_width / 2;
            if (!node.father_node && node.mother_node) max_x = node.mother_node.x + window.box_width / 2;

            if (!pedigree_spouse_node) min_x = max_x;
            if (!node.father_node && !node.mother_node) max_x = min_x;

            let shift_x = (min_x + max_x) / 2 - (node.x - window.h_spacing / 2);
            //shift_x = 0;
            //console.log(`Shifting ${node.individual.name} and spouse by ${shift_x} to be centered between parents`);
            
            // Move couple to the right
            if (shift_x > 0) {
                //shift_x = 0;
                shiftSubtree(pedigree_spouse_node, shift_x);
                shiftSiblings(pedigree_spouse_node, shift_x);
                shiftSubtree(node, shift_x);
                shiftSiblings(node, shift_x);
            }
            
            // Move their parents to the right
            //shift_x = 0;
            if (shift_x < 0) {
                if (pedigree_spouse_node.father_node) {
                    shiftSupertree(pedigree_spouse_node.father_node, -shift_x);
                    shiftSiblings(pedigree_spouse_node, shift_x);
                }
                if (pedigree_spouse_node.mother_node) shiftSupertree(pedigree_spouse_node.mother_node, -shift_x);
                if (node.father_node) {
                    shiftSupertree(node.father_node, -shift_x);
                    shiftSiblings(node, shift_x);
                }
                if (node.mother_node) shiftSupertree(node.mother_node, -shift_x);
            }
        }
    }

    if (node.type == 'inlaw') {
        positionNode(node, rows);
        node.min_x = Infinity;
        node.max_x = -Infinity;
        if (node.children_nodes.length == 0) {
            node.min_x = node.x;
            node.max_x = node.x + window.box_width;
        }
        node.children_nodes.forEach(child_node => { 
            child_node.sub_level = node.sub_level + 1;
            positionTree(child_node, rows); 
            node.min_x = Math.min(node.min_x, child_node.min_x);
            node.max_x = Math.max(node.max_x, child_node.max_x);
        });

        // Center inlaw over their children
        if (node.children_nodes.length > 0) {
            let shift_x = node.x + window.box_width / 2 - (node.min_x + node.max_x) / 2;
            if (shift_x > 0) {
                node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); });
                node.min_x += shift_x;
                node.max_x += shift_x;
            }
            if (shift_x < 0) node.x -= shift_x;
        }
    }

    return rows;
}

function shiftSubtree(node, shift_x) {
    if (!node) return;
    //console.log('Shifting', node.individual.name, 'by', shift_x);
    node.x += shift_x;
    node.min_x += shift_x;
    node.max_x += shift_x;
    //if (node.spouse_nodes && node.type === 'relative') node.spouse_nodes.forEach(spouse_node => shiftSubtree(spouse_node, shift_x));
    if (node.spouse_nodes) node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x) });
    if (node.children_nodes) node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x) });
}

function shiftSupertree(node, shift_x) {
    if (!node) return;
    node.x += shift_x;
    node.min_x += shift_x;
    node.max_x += shift_x;
    if (node.father_node) shiftSupertree(node.father_node, shift_x);
    if (node.mother_node) shiftSupertree(node.mother_node, shift_x);
    node.children_nodes.forEach(child_node => { shiftSubtree(child_node, shift_x); })
    node.spouse_nodes.filter(spouse_node => spouse_node.type === 'inlaw').forEach(spouse_node => { shiftSubtree(spouse_node, shift_x); });
}

function shiftSiblings(node, shift_x) {
    if (!node || !node.father_node) return;
    node.father_node.children_nodes.forEach(sibling_node => { shiftSubtree(sibling_node, shift_x); });
}

function positionNode(node, rows) {
    const length = rows[node.level][node.sub_level].length;
    if (length === 0) node.x = 0;
    else node.x = rows[node.level][node.sub_level][length - 1].x + window.box_width + window.h_spacing;
    if (window.level_boundaries[node.level]) node.x = Math.max(node.x, window.level_boundaries[node.level].x + window.h_spacing);
    window.level_heights[node.level] = Math.max(window.level_heights[node.level], node.sub_level + 1);
    //const sub_level_height = window.box_height + window.v_spacing;
    //const level_height = 2 * (window.generations + 1) * sub_level_height;
    //const total_height = (window.generations - 1) * level_height;
    //node.y = total_height - node.level * level_height + node.sub_level * sub_level_height;
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

function setHeights(rows) {
    let total_height = 0;
    window.level_heights.forEach(height => { total_height += height * (window.box_height + window.v_spacing) + window.v_spacing; });
    let y = total_height - window.box_height - window.v_spacing; // Start from the bottom of the tree
    rows.forEach((level, index) => {
        y -= window.level_heights[index] * (window.box_height + window.v_spacing) + window.v_spacing;
        let sub_y = y;
        level.forEach((sub_level, sub_index) => {
            if (sub_level.length > 0) sub_y += window.box_height + window.v_spacing;
            sub_level.forEach(node => { node.y = sub_y; });
        });
    });
}

function drawTree(svg_node, rows) {
    rows.forEach(level => {
        level.forEach(sub_level => {
            sub_level.forEach(node => {

                if (node.type === 'relative') {
                    node.spouse_nodes.forEach(spouse_node => {
                        // Draw link between relative and spouse
                        drawLink(svg_node, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, {x: spouse_node.x + window.box_width / 2, y: spouse_node.y});
                    });
                }

                if (node.type === 'inlaw') {
                    node.children_nodes.forEach(child_node => {
                        // Draw link between in-law and child
                        drawLink(svg_node, {x: node.x + window.box_width / 2, y: node.y + window.box_height}, {x: child_node.x + window.box_width / 2, y: child_node.y});
                    });
                }

                if (node.type === 'ancestor' && node.individual.gender == 'M') {
                    // Draw links from father and mother to center point
                    drawLink(svg_node, {x: node.x + window.box_width / 2,                    y: node.y}, 
                                       {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height});
                    drawLink(svg_node, {x: node.x + 3 * window.box_width / 2 + window.h_spacing, y: node.y}, 
                                       {x: node.x + window.box_width + window.h_spacing / 2,     y: node.y + window.box_height});

                    node.children_nodes.forEach(child_node => {
                        // Draw link between ancestor and child
                        drawLink(svg_node, {x: node.x + window.box_width + window.h_spacing / 2, y: node.y + window.box_height}, 
                                           {x: child_node.x + window.box_width / 2,              y: child_node.y});
                    });

                    if (node.individual.pedigree_child_node) {
                        // Draw link between ancestor and pedigree child
                        drawLink(svg_node, {x: node.x + window.box_width + window.h_spacing / 2,             y: node.y + window.box_height}, 
                                           {x: node.individual.pedigree_child_node.x + window.box_width / 2, y: node.individual.pedigree_child_node.y});
                    }
                }

                if (node.type === 'ancestor') {
                    node.spouse_nodes.forEach(spouse_node => {
                        // Draw link between ancestor and spouse
                        drawLink(svg_node, {x: node.x + window.box_width / 2,         y: node.y}, 
                                           {x: spouse_node.x + window.box_width / 2,  y: spouse_node.y + window.box_height});
                    });
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

    // Calculate background color based on generation
    // Use HCL for equal luminance regardless of hue
    const hue = (node.generation * 60) % 360; // 60 degrees apart for distinct colors
    const chroma = node.type === 'inlaw' ? 0 : 33;
    const luminance = 60;
    const border_luminance = 50;
    
    const fill_color = d3.hcl(hue, chroma, luminance);
    const stroke_color = d3.hcl(hue, chroma, border_luminance);

    // Draw rectangle
    g.append('rect')
        .attr('width', window.box_width)
        .attr('height', window.box_height)
        .attr('fill', fill_color)
        .attr('stroke', stroke_color)
        .attr('stroke-width', 2)
        .attr('rx', 8);

    // Add text with 3 lines: name (2 lines), birth-death (1 line)
    const text_element = g.append('text')
        .attr('x', window.box_width / 2)
        .attr('y', 24) // Vertically centered in 80px box
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', '#000000'); // Black font

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

    // Add name lines
    if (line1) {
        text_element.append('tspan')
            .attr('x', window.box_width / 2)
            .attr('dy', '0em')
            .text(line1);
    }
    if (line2) {
        text_element.append('tspan')
            .attr('x', window.box_width / 2)
            .attr('dy', '1.2em')
            .text(line2);
    }

    // Add birth-death line
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
            .attr('dy', line2 ? '1.4em' : '1.2em')
            .text(birth_death);
    }

    // Adjust font size if needed
    let font_size = 12;
    const min_font_size = 8;
    const padding = 4;
    const max_width = window.box_width - padding;

    // Check if text fits
    const bbox = text_element.node().getBBox();
    if (bbox.width > max_width) {
        font_size = Math.max(min_font_size, font_size * (max_width / bbox.width));
        text_element.attr('font-size', font_size + 'px');
    }
}

function drawLink(svg_node, point1, point2) {
    const customLink = (point1, point2) => {
        var x1 = point1.x;
        var x2 = point2.x;
        var y1 = point1.y;
        var y2 = point2.y;
        //const ymid = (y1 + y2) / 2;
        const ymid = y2 - window.v_spacing / 2;
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

    svg_node.append("path")
        .attr("d", customLink(point1, point2))
        .attr("fill", "none")
        .attr("stroke", d3.hcl(0, 0, 50))
        .attr("stroke-width", 3);
}
