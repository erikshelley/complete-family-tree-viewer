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

    drawTree(svg_node, max_x, max_y, tree_positions);
}


function createUnknownPerson(gender, node) {
    const person = { id: null, name: 'Unknown', famc: null, fams: [node.parent_family], birth: '', death: '', gender: gender };
    return person;
}


function buildTree(individual, current_gen = window.generations_down, anchor_gen = window.generations_down, type = 'root') {
    if (!individual || (current_gen > window.generations_up + window.generations_down)) return null;

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

    if (type === 'root') node.individual.is_root = true;

    // Add parents
    if (node.individual.famc && (node.generation < window.generations_up + window.generations_down) && ['root', 'ancestor'].includes(node.type)) {
        node.parent_family = window.families.find(fam => fam.id === node.individual.famc);
        if (node.parent_family) {

            // Add father
            const father = node.parent_family.husb ? window.individuals.find(ind => ind.id === node.parent_family.husb) : createUnknownPerson('M', node);
            father.pedigree_family = node.parent_family;
            if (node.type != 'root') father.pedigree_child_node = node;
            father.is_father = true;
            node.father_node = buildTree(father, current_gen + 1, anchor_gen + 1, 'ancestor');

            // Add mother
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
    if (node.individual.fams && (node.generation > 0) && node.type === 'inlaw') {
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

