function rebuildLookupMaps() {
    window.individuals_by_id = new Map((window.individuals || []).map(i => [i.id, i]));
    window.families_by_id = new Map((window.families || []).map(f => [f.id, f]));
}

function computeRawConnectionPathIds(root_individual_id, target_id) {
    rebuildLookupMaps();
    if (!root_individual_id || !target_id || root_individual_id === target_id) return new Set();
    const queue = [root_individual_id];
    const visited = new Set([root_individual_id]);
    const parent_map = new Map();
    while (queue.length > 0) {
        const current_id = queue.shift();
        if (current_id === target_id) {
            const path_ids = new Set();
            let id = current_id;
            while (id !== undefined) {
                path_ids.add(id);
                id = parent_map.get(id);
            }
            return path_ids;
        }
        const person = window.individuals_by_id.get(current_id);
        if (!person) continue;
        const neighbors = [];
        if (person.famc) {
            const fam = window.families_by_id.get(person.famc);
            if (fam) {
                if (fam.husb) neighbors.push(fam.husb);
                if (fam.wife) neighbors.push(fam.wife);
            }
        }
        for (const fam_id of (person.fams || [])) {
            const fam = window.families_by_id.get(fam_id);
            if (!fam) continue;
            const spouse_id = fam.husb === current_id ? fam.wife : fam.husb;
            if (spouse_id) neighbors.push(spouse_id);
            for (const child_id of fam.chil) {
                neighbors.push(child_id);
            }
        }
        for (const nid of neighbors) {
            if (nid && !visited.has(nid)) {
                visited.add(nid);
                parent_map.set(nid, current_id);
                queue.push(nid);
            }
        }
    }
    return new Set();
}

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

    rebuildLookupMaps();
    resolveGenders(window.individuals, window.families);

    window.connection_path_individual_ids = (window.highlight_type === 'connection' && window.connection_selected_id)
        ? computeRawConnectionPathIds(selected_individual.id, window.connection_selected_id)
        : new Set();

    // Measure buildTree
    const tree_data = buildTree(selected_individual);

    // Measure positionTree
    const tree_positions = positionTree(tree_data);
    normalizeTreeX(tree_positions);
    setHeights(tree_positions);
    adjustInnerChildrenSpacingGlobal(tree_positions);
    normalizeTreeX(tree_positions);

    // Measure drawTree
    await drawTree(tree_positions);
}


function resolveGenders(individuals, families) {
    const fam_by_id = new Map(families.map(f => [f.id, f]));
    const ind_by_id = new Map(individuals.map(i => [i.id, i]));

    // Normalize any gender that is not M or F to empty string so it is treated as missing.
    individuals.forEach(person => { if (person.gender !== 'M' && person.gender !== 'F') person.gender = ''; });

    // Iteratively assign gender to people with no gender based on their spouses' genders.
    // A person with a female spouse is assumed male (rules 1, 4); with only male spouses,
    // assumed female (rule 2). Repeats until no further changes (handles chains).
    let changed = true;
    while (changed) {
        changed = false;
        individuals.forEach(person => {
            if (person.gender) return;
            let hasF = false, hasM = false;
            person.fams.forEach(fam_id => {
                const family = fam_by_id.get(fam_id);
                if (!family) return;
                const spouse_id = family.husb === person.id ? family.wife : family.husb;
                const spouse = ind_by_id.get(spouse_id);
                if (spouse?.gender === 'F') hasF = true;
                if (spouse?.gender === 'M') hasM = true;
            });
            if (hasF) { person.gender = 'M'; changed = true; }
            else if (hasM) { person.gender = 'F'; changed = true; }
        });
    }

    // Assign gender to any remaining no-gender people using their family role position.
    // When both spouses have no gender (rule 3), husb role → male, wife role → female.
    individuals.forEach(person => {
        if (person.gender) return;
        for (const fam_id of person.fams) {
            const family = fam_by_id.get(fam_id);
            if (!family) continue;
            if (family.husb === person.id) { person.gender = 'M'; return; }
            if (family.wife === person.id) { person.gender = 'F'; return; }
        }
        person.gender = 'M';
    });
}


function buildTree(individual, current_gen = window.generations_down, anchor_gen = window.generations_down, type = 'root') {
    if (type === 'root') rebuildLookupMaps();
    if (!individual || (current_gen > window.generations_up + window.generations_down)) return null;

    // Handle duplicates from relatives having children together
    if (individual.node) {
        const action = resolveDuplicate(individual, type, anchor_gen);
        if (action === 'keep-existing') return null;
        if (action === 'link-pedigree') return individual.node;
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

    if (type === 'root') {
        node.individual.is_root = true;
        window.root_node = node;
    }
    else individual.node = node;

    addParents(node, anchor_gen);
    addSpousesAndRelatives(node, anchor_gen);
    addInlawChildren(node, anchor_gen);

    return node;
}


function createUnknownIndividual(gender, family) {
    const known_spouse_id = gender === 'M' ? family.wife : family.husb;
    const known_spouse = window.individuals.find(ind => ind.id === known_spouse_id);
    // Only use first name of known spouse to create unknown individual ID
    const first_name = known_spouse ? known_spouse.name.split(' ')[0] : 'Unknown';
    const person = { id: known_spouse ? known_spouse.id + gender : 'unknown' + gender, name: `Spouse of ${first_name}`, famc: null, fams: [family], gender: gender };
    window.individuals.push(person);
    window.individuals_by_id?.set(person.id, person);
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


function detachNode(node) {
    if (node.type === 'relative' && node.parent_node) {
        node.parent_node.children_nodes = node.parent_node.children_nodes.filter(child => child !== node);
    }
    removeSubTree(node);
}


// Resolve what to do when an individual already has a node in the tree.
// Returns 'keep-existing', 'replace', or 'link-pedigree'.
function resolveDuplicate(individual, type, anchor_gen) {
    const existing = individual.node;
    const existingIsAncestor = ['ancestor', 'root'].includes(existing.type);
    const newIsAncestor = ['ancestor', 'root'].includes(type);

    if (existingIsAncestor && !newIsAncestor) return 'keep-existing';

    if (existingIsAncestor && newIsAncestor) {
        individual.duplicate_pedigree_child_node.duplicate_parents = true;
        return 'link-pedigree';
    }

    if (!existingIsAncestor && newIsAncestor) {
        detachNode(existing);
        return 'replace';
    }

    // Both inlaw/relative — keep the one with the lower anchor generation
    if (existing.anchor_generation <= anchor_gen) return 'keep-existing';
    detachNode(existing);
    return 'replace';
}


function resolveParent(parent_id, gender, family) {
    let parent = parent_id ? window.individuals_by_id.get(parent_id) : null;
    if (!parent) parent = createUnknownIndividual(gender, family);
    return parent;
}


function prepareParent(parent, node, gender) {
    parent.pedigree_family = node.parent_family;
    if (node.type !== 'root') {
        if (!parent.pedigree_child_node) parent.pedigree_child_node = node;
        else parent.duplicate_pedigree_child_node = node;
    }
    if (gender === 'M') parent.is_father = true;
}


function addParents(node, anchor_gen) {
    if (!node.individual.famc) return;
    if (node.generation >= window.generations_up + window.generations_down) return;
    if (!['root', 'ancestor'].includes(node.type)) return;

    node.parent_family = window.families_by_id.get(node.individual.famc);
    if (!node.parent_family) return;

    const father = resolveParent(node.parent_family.husb, 'M', node.parent_family);
    prepareParent(father, node, 'M');
    node.father_node = buildTree(father, node.generation + 1, anchor_gen + 1, 'ancestor');

    const mother = resolveParent(node.parent_family.wife, 'F', node.parent_family);
    prepareParent(mother, node, 'F');
    node.mother_node = buildTree(mother, node.generation + 1, anchor_gen + 1, 'ancestor');

    if (node.father_node && node.mother_node) {
        node.father_node.pedigree_spouse_node = node.mother_node;
        node.mother_node.pedigree_spouse_node = node.father_node;
    }
}


function addPedigreeChildren(node, fam_id, anchor_gen) {
    if (!node.individual.pedigree_family || node.individual.pedigree_family.id !== fam_id) return;
    if (!node.individual.is_father) return;

    node.individual.pedigree_family.chil
        .filter(child_id => {
            if (window.hide_non_pedigree_family) {
                const pedigree_child_id = node.individual.pedigree_child_node
                    ? node.individual.pedigree_child_node.individual.id
                    : (window.root_node ? window.root_node.individual.id : null);
                return child_id === pedigree_child_id || (window.connection_path_individual_ids && window.connection_path_individual_ids.has(child_id));
            }

            return !node.individual.pedigree_child_node || child_id !== node.individual.pedigree_child_node.individual.id;
        })
        .forEach(child_id => {
            const child = window.individuals_by_id.get(child_id);
            if (child) {
                const child_node = buildTree(child, node.generation - 1, anchor_gen - 1, 'relative');
                if (child_node) {
                    child_node.parent_node = node;
                    node.children_nodes.push(child_node);
                }
            }
        });
}


function addInlawSpouse(node, fam_id, anchor_gen) {
    const spouse_family = window.families_by_id.get(fam_id);
    if (!spouse_family) return;

    const spouse_id = spouse_family.husb === node.individual.id ? spouse_family.wife : spouse_family.husb;
    const spouse_gender = spouse_family.husb === node.individual.id ? 'F' : 'M';
    let spouse = window.individuals_by_id.get(spouse_id);
    if (!spouse) spouse = createUnknownIndividual(spouse_gender, spouse_family);
    if (node.individual.is_root || node.individual.is_descendant) spouse.is_descendant = true;
    spouse.spouse_family = spouse_family;

    const spouse_node = buildTree(spouse, node.generation, anchor_gen, 'inlaw');
    if (spouse_node) {
        spouse_node.spouse_nodes.push(node);
        node.spouse_nodes.push(spouse_node);
    }
}


function addSpousesAndRelatives(node, anchor_gen) {
    if (!node.individual.fams) return;
    if (!['root', 'ancestor', 'relative'].includes(node.type)) return;
    if (window.pedigree_only && !node.individual.is_descendant) return;

    node.individual.fams.forEach(fam_id => {
        if (node.individual.pedigree_family && node.individual.pedigree_family.id === fam_id) {
            addPedigreeChildren(node, fam_id, anchor_gen);
        } else {
            if (window.hide_non_pedigree_family && (node.type === 'ancestor')) {
                const fam = window.families_by_id.get(fam_id);
                const spouse_id = fam && (fam.husb === node.individual.id ? fam.wife : fam.husb);
                if (!spouse_id || !window.connection_path_individual_ids || !window.connection_path_individual_ids.has(spouse_id)) return;
            }
            addInlawSpouse(node, fam_id, anchor_gen);
        }
    });
}


function addInlawChildren(node, anchor_gen) {
    if (!node.individual.fams || node.generation <= 0 || node.type !== 'inlaw') return;
    if (window.pedigree_only && !node.individual.is_descendant) return;
    if (!node.individual.spouse_family || node.individual.spouse_family.chil.length === 0) return;

    node.individual.spouse_family.chil.forEach(child_id => {
        const child = window.individuals_by_id.get(child_id);
        if (child) {
            if (node.individual.is_root || node.individual.is_descendant) child.is_descendant = true;
            const child_node = buildTree(child, node.generation - 1, anchor_gen, 'relative');
            if (child_node) {
                child_node.parent_node = node;
                node.children_nodes.push(child_node);
            }
        }
    });
}


function calculateMaxGenUp(individual, current_gen = 0, max_gen = 0) {
    if (current_gen === 0) rebuildLookupMaps();
    if (!individual) return max_gen;
    if (individual.famc) {
        const parent_family = window.families_by_id.get(individual.famc);
        const father = parent_family.husb ? window.individuals_by_id.get(parent_family.husb) : createUnknownIndividual('M', parent_family);
        max_gen = calculateMaxGenUp(father, current_gen + 1, max_gen);
        const mother = parent_family.wife ? window.individuals_by_id.get(parent_family.wife) : createUnknownIndividual('F', parent_family);
        max_gen = calculateMaxGenUp(mother, current_gen + 1, max_gen);
    }
    return Math.max(max_gen, current_gen);
}


// Calculate maximum generations down from individual in a tree that goes up windows.generations_up from that individual
function calculateMaxGenDown(individual, current_gen = 0, max_gen = 0, ancestor = true) {
    if (current_gen === 0) rebuildLookupMaps();
    if (!individual) return max_gen;
    window.visited_individuals = window.visited_individuals || new Set();
    if (window.visited_individuals.has(individual.id)) return max_gen;
    window.visited_individuals.add(individual.id);

    if (individual.famc && ancestor && (current_gen < window.generations_up)) {
        const parent_family = window.families_by_id.get(individual.famc);
        const father = parent_family.husb ? window.individuals_by_id.get(parent_family.husb) : null;
        max_gen = Math.max(max_gen, calculateMaxGenDown(father, current_gen + 1, max_gen));
        const mother = parent_family.wife ? window.individuals_by_id.get(parent_family.wife) : null;
        max_gen = Math.max(max_gen, calculateMaxGenDown(mother, current_gen + 1, max_gen));
    }
    if (individual.fams) {
        individual.fams.forEach(fam_id => {
            const family = window.families_by_id.get(fam_id);
            if (family) {
                family.chil.forEach(child_id => {
                    const child = window.individuals_by_id.get(child_id);
                    max_gen = Math.max(max_gen, calculateMaxGenDown(child, current_gen - 1, max_gen, false));
                });
            }
        });
    }
    return Math.max(max_gen, -current_gen);
}

// Calculate the maximum useful stack size for the tree rooted at individual.
// Returns the largest number of stackable nodes in any single group:
//   - siblings with no spousal family under any ancestor family (walking up to generations_up)
//   - childless in-law spouses grouped by individual
//   - leaf children (no spousal family) under any descendant family (walking down to generations_down)
// Setting max_stack_size higher than this value has no further effect on the layout.
function calculateMaxStackSize(individual, current_gen = 0, ancestor = true) {
    if (current_gen === 0) rebuildLookupMaps();
    if (!individual) return 1;
    window.visited_individuals = window.visited_individuals || new Set();
    if (window.visited_individuals.has(individual.id)) return 1;
    window.visited_individuals.add(individual.id);

    let max_size = 1;

    // Walk ancestor chain upward, counting stackable siblings in each ancestor family
    if (ancestor && individual.famc && (current_gen < window.generations_up)) {
        const parent_family = window.families_by_id.get(individual.famc);
        if (parent_family) {
            const stackable_count = parent_family.chil.filter(child_id => {
                const child = window.individuals_by_id.get(child_id);
                return !child || !child.fams || child.fams.length === 0;
            }).length;
            max_size = Math.max(max_size, stackable_count);

            const father = parent_family.husb ? window.individuals_by_id.get(parent_family.husb) : null;
            const mother = parent_family.wife ? window.individuals_by_id.get(parent_family.wife) : null;
            max_size = Math.max(max_size, calculateMaxStackSize(father, current_gen + 1, true));
            max_size = Math.max(max_size, calculateMaxStackSize(mother, current_gen + 1, true));
        }
    }

    // Count childless in-law spouses of this individual (they stack as a group)
    if (individual.fams) {
        const childless_spouse_count = individual.fams.filter(fam_id => {
            const family = window.families_by_id.get(fam_id);
            return family && family.chil.length === 0;
        }).length;
        max_size = Math.max(max_size, childless_spouse_count);
    }

    // Walk downward through children, counting stackable leaf children per family
    if (individual.fams) {
        individual.fams.forEach(fam_id => {
            const family = window.families_by_id.get(fam_id);
            if (!family) return;
            const stackable_count = family.chil.filter(child_id => {
                const child = window.individuals_by_id.get(child_id);
                return !child || !child.fams || child.fams.length === 0;
            }).length;
            max_size = Math.max(max_size, stackable_count);
            family.chil.forEach(child_id => {
                const child = window.individuals_by_id.get(child_id);
                max_size = Math.max(max_size, calculateMaxStackSize(child, current_gen - 1, false));
            });
        });
    }

    return max_size;
}
