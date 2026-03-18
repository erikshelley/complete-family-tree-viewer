async function createFamilyTree(selected_individual) {
    // Clear previous content
    const family_tree_div = document.getElementById('family-tree-div');
    family_tree_div.innerHTML = '';
    window.level_boundary_node_leaf = [];
    window.level_boundary_node_ancestor = [];
    window.level_heights = [];
    window.max_gen_up = 0;
    window.max_gen_down = 0;
    window.max_stack_actual = 1;
    window.auto_box_width = 0;
    window.auto_box_height = 0;

    // Measure buildTree
    console.log('Building family tree...');
    const tree_data = buildTree(selected_individual);

    // Measure positionTree
    console.log('Positioning family tree...');
    const tree_positions = positionTree(tree_data);
    setHeights(tree_positions);

    // Measure drawTree
    console.log('Drawing family tree...');
    await drawTree(tree_positions);
}


function createUnknownIndividual(gender, family) {
    //console.log(`Creating unknown ${gender} individual`);
    //console.log(family);
    const known_spouse_id = gender === 'M' ? family.wife : family.husb;
    const known_spouse = window.individuals.find(ind => ind.id === known_spouse_id);
    //console.log(known_spouse);
    const person = { id: known_spouse.id + gender, name: `Spouse of ${known_spouse.name}`, famc: null, fams: [family], gender: gender };
    window.individuals.push(person);
    if (gender === 'M') family.husb = person.id;
    else family.wife = person.id;
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
            let father = node.parent_family.husb ? window.individuals.find(ind => ind.id === node.parent_family.husb) : createUnknownIndividual('M', node.parent_family);
            if (!father) father = createUnknownIndividual('M', node.parent_family);
            father.pedigree_family = node.parent_family;
            if (node.type != 'root') {
                if (!father.pedigree_child_node) father.pedigree_child_node = node;
                else father.duplicate_pedigree_child_node = node;
            }
            father.is_father = true;
            node.father_node = buildTree(father, current_gen + 1, anchor_gen + 1, 'ancestor');

            // Add mother
            let mother = node.parent_family.wife ? window.individuals.find(ind => ind.id === node.parent_family.wife) : createUnknownIndividual('F', node.parent_family );
            if (!mother) mother = createUnknownIndividual('F', node.parent_family);
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

    // Add spouses and non-inlaw children
    if (node.individual.fams && ['root', 'ancestor', 'relative'].includes(node.type) && (!window.pedigree_only || node.individual.is_descendant)) {
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
                    const spouse_gender = spouse_family.husb === node.individual.id ? 'F' : 'M';
                    let spouse = window.individuals.find(ind => ind.id === spouse_id);
                    if (!spouse) spouse = createUnknownIndividual(spouse_gender, spouse_family);
                    if (node.individual.is_root || node.individual.is_descendant) spouse.is_descendant = true;
                    spouse.spouse_family = spouse_family;
                    const spouse_node = buildTree(spouse, current_gen, anchor_gen, 'inlaw');
                    if (spouse_node) {
                        spouse_node.spouse_nodes.push(node);
                        node.spouse_nodes.push(spouse_node);
                    }
                }
            }
        });
    }

    // Add children
    if (node.individual.fams && (node.generation > 0) && (node.type === 'inlaw') && (!window.pedigree_only || node.individual.is_descendant)) {
        if (node.individual.spouse_family && node.individual.spouse_family.chil.length > 0) {
            node.individual.spouse_family.chil.forEach(child_id => {
                const child = window.individuals.find(ind => ind.id === child_id);
                if (child) {
                    if (node.individual.is_root || node.individual.is_descendant) child.is_descendant = true;
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

