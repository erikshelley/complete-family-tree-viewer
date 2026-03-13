function createFamilyTree(selected_individual) {
    // Clear previous content
    const family_tree_div = document.getElementById('family-tree-div');
    family_tree_div.innerHTML = '';
    window.level_boundary_node_leaf = [];
    window.level_boundary_node_ancestor = [];
    window.level_heights = [];
    window.max_gen_up = 0;
    window.max_gen_down = 0;
    window.max_stack_actual = 0;
    window.auto_box_width = 0;
    window.auto_box_height = 0;

    // Measure buildTree
    //const t0 = performance.now();
    const tree_data = buildTree(selected_individual);
    //const t1 = performance.now();
    //console.log(selected_individual.name);
    //console.log(`buildTree: ${(t1 - t0).toFixed(2)} ms`);

    // Measure positionTree
    //const t2 = performance.now();
    const tree_positions = positionTree(tree_data);
    setHeights(tree_positions);
    //const t3 = performance.now();
    //console.log(`positionTree: ${(t3 - t2).toFixed(2)} ms`);

    // Set SVG dimensions
    const bounding_box = family_tree_div.getBoundingClientRect();
    let svg_width = bounding_box.width - 24; // horizontal padding in div
    let svg_height = bounding_box.height - 40; // bottom padding in div

    // Initial SVG
    const svg = d3.select('#family-tree-div')
        .append('svg')
        .attr('width', svg_width)
        .attr('height', svg_height);

    const [max_x, max_y, node_count] = getMaximumDimensions(tree_positions);
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
    svg.call(d3.zoom().scaleExtent([1, 100]).on("zoom", zoomed));
    const svg_node = svg.append("g");
    function zoomed({transform}) { svg_node.attr("transform", transform); }

    // Measure drawTree
    //const t4 = performance.now();
    drawTree(svg_node, max_x, max_y, tree_positions);
    //const t5 = performance.now();
    //console.log(`drawTree: ${(t5 - t4).toFixed(2)} ms`);
    //const total_time = (t1 - t0) + (t3 - t2) + (t5 - t4);
    //console.log(`Total time: ${total_time.toFixed(2)} ms`);
    //console.log(`Total nodes: ${node_count}`);
    //const nodes_per_second = node_count / (total_time / 1000);
    //console.log(`Nodes per second: ${nodes_per_second.toFixed(2)}`);

    const root_name_span = document.getElementById('root-name');
    root_name_span.innerHTML = selected_individual.name.replace(/ /g, '&nbsp;');

    const node_count_span = document.getElementById('node-count');
    if (node_count === "1") node_count_span.innerHTML = `${node_count}&nbsp;Person&nbsp;Shown`;
    else node_count_span.innerHTML = `${node_count}&nbsp;People&nbsp;Shown`;

    //console.log(window.auto_box_width);
    //console.log(window.auto_box_height);
}


function createUnknownPerson(gender, node) {
    const person = { id: null, name: 'Unknown', famc: null, fams: [node.parent_family], birth: '', death: '', gender: gender };
    return person;
}


function removeSubTree(node) {
    node.spouse_nodes.forEach(spouse_node => {
        spouse_node.children_nodes.forEach(child_node => {
            removeSubTree(child_node);
            child_node.individual.node = null;
        });
    });
    node.individual.node = null;
}

function buildTree(individual, current_gen = window.generations_down, anchor_gen = window.generations_down, type = 'root') {
    if (!individual || (current_gen > window.generations_up + window.generations_down)) return null;

    // Handle duplicates from relatives having children together
    if (individual.node) {
        // If existing individual is ancestor or root and the new individual is inlaw or relative, return
        if (['ancestor', 'root'].includes(individual.node.type) && ['inlaw', 'relative'].includes(type)) return null;
        // If both individuals are inlaws or relatives, return
        if (['inlaw', 'relative'].includes(individual.node.type) && ['inlaw', 'relative'].includes(type)) return null;
        // If new individual is ancestor or root and the existing individual is inlaw or relative, remove the previous individual and continue
        if (['inlaw', 'relative'].includes(individual.node.type) && ['ancestor', 'root'].includes(type)) {
            if (individual.node.type === 'relative') {
                // If the existing node has a parent node, remove the existing node from its children
                if (individual.node.parent_node) individual.node.parent_node.children_nodes = individual.node.parent_node.children_nodes.filter(child => child !== individual.node);
                // Visit existing node's subtree and remove the node from their individual elements
                removeSubTree(individual.node);
            }
        }
        else {
            // If both individuals are ancestors, link pedigree child to previous ancestor and return
            if (['ancestor', 'root'].includes(individual.node.type) && ['ancestor', 'root'].includes(type)) {
                individual.duplicate_pedigree_child_node.duplicate_parents = true;
                return individual.node;
            }
        }
    }

    if (window.hide_childless_inlaws && (type === 'inlaw')) {
        if (!individual.spouse_family || (individual.spouse_family.chil.length === 0) || (current_gen === 0)) return null;
    }

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
        children_nodes: [],
    };

    window.max_gen_up = Math.max(window.max_gen_up, anchor_gen - window.generations_down);
    window.max_gen_down = Math.max(window.max_gen_down, window.generations_down - current_gen);

    if (type === 'root') node.individual.is_root = true;
    else individual.node = node;

    // Add parents
    if (node.individual.famc && (node.generation < window.generations_up + window.generations_down) && ['root', 'ancestor'].includes(node.type)) {
        node.parent_family = window.families.find(fam => fam.id === node.individual.famc);
        if (node.parent_family) {

            // Add father
            const father = node.parent_family.husb ? window.individuals.find(ind => ind.id === node.parent_family.husb) : createUnknownPerson('M', node);
            father.pedigree_family = node.parent_family;
            if (node.type != 'root') {
                if (!father.pedigree_child_node) father.pedigree_child_node = node;
                else father.duplicate_pedigree_child_node = node;
            }
            father.is_father = true;
            node.father_node = buildTree(father, current_gen + 1, anchor_gen + 1, 'ancestor');

            // Add mother
            const mother = node.parent_family.wife ? window.individuals.find(ind => ind.id === node.parent_family.wife) : createUnknownPerson('F', node);
            mother.pedigree_family = node.parent_family;
            if (node.type != 'root') {
                if (!mother.pedigree_child_node) mother.pedigree_child_node = node;
                else mother.duplicate_pedigree_child_node = node;
            }
            node.mother_node = buildTree(mother, current_gen + 1, anchor_gen + 1, 'ancestor');

            if (node.father_node && node.mother_node) {
                node.father_node.pedigree_spouse_node = node.mother_node;
                node.mother_node.pedigree_spouse_node = node.father_node;
            }
        }
    }

    const is_descendant = 
            (node.individual.is_root || 
            ((node.anchor_generation === window.generations_down) && 
                (node.generation <= window.generations_down) || 
                ((node.generation === window.generations_down) && (node.spouse_nodes.length === 1) && node.spouse_nodes[0].individual.is_root))
        );

    // Add spouses and non-inlaw children
    if (node.individual.fams && ['root', 'ancestor', 'relative'].includes(node.type) && (!window.pedigree_only || is_descendant)) {
        node.individual.fams.forEach(fam_id => {
            // Add pedigree children
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
            // Add inlaw spouses
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
    if (node.individual.fams && (node.generation > 0) && node.type === 'inlaw' && (!window.pedigree_only || is_descendant)) {
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

