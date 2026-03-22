/*
UI functions for Complete Family Tree application
Function List:
- toggleOptions
- updateOptionsVisibility
- zoomToFit
- scaleBodyForSmallScreens
- toggleEnabled
- setMaxLinksEnabled
- updateMaxLinksState
- selectGedcomFile
- filterIndividuals
- usePresetStyle
- resetStyling
- openSaveModal
- saveSVG
- savePNG
- updateRangeThumbs
- requestFamilyTreeUpdate
- updateFamilyTree
- populateIndividualSelect
*/


function expandAllStylingSections() {
    const details_elements = document.querySelectorAll('details');
    details_elements.forEach(detail => {
        detail.open = true;
    });
    expand_styling_button.style.display = 'none';
    collapse_styling_button.style.display = 'block';
}


function collapseAllStylingSections() {
    const details_elements = document.querySelectorAll('details');
    details_elements.forEach(detail => {
        detail.open = false;
    });
    expand_styling_button.style.display = 'block';
    collapse_styling_button.style.display = 'none';
}


function toggleOptions() {
    if (leftColumnWrapper.classList.contains('open')) leftColumnWrapper.classList.remove('open');
    else leftColumnWrapper.classList.add('open');
}


function updateOptionsVisibility() {
    if (!rightCol || !leftCol) return;
    // If right column is narrower than left column, show options
    const rightWidth = rightCol.offsetWidth;
    const leftWidth = leftCol.offsetWidth;
    if (window.innerWidth <= 900 || rightWidth < leftWidth) {
        optionsMenu.style.display = 'block';
    } else {
        optionsMenu.style.display = 'none';
        leftColumnWrapper.classList.remove('open');
    }
}


function zoomToFit() {
    const svgEl = family_tree_div.querySelector('svg');
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const zoom = svgEl.__zoom_behavior;
    if (!zoom) return;
    const origW = svgEl.__orig_svg_width;
    const origH = svgEl.__orig_svg_height;
    const ms = svgEl.__max_scale;
    // Restore original SVG size and viewBox, reset zoom
    svg.attr('width', origW).attr('height', origH);
    svg.attr('viewBox', `0 0 ${ms * origW} ${ms * origH}`);
    svg.transition().call(zoom.transform, d3.zoomIdentity);
}


function zoomToFitHorizontal() {
    const svgEl = family_tree_div.querySelector('svg');
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const zoom = svgEl.__zoom_behavior;
    if (!zoom) return;
    const origW = svgEl.__orig_svg_width;
    const origH = svgEl.__orig_svg_height;
    const ms = svgEl.__max_scale;
    const divRect = family_tree_div.getBoundingClientRect();
    const availWidth = divRect.width - 24;
    const availHeight = divRect.height - 40;
    // Resize SVG and viewBox proportionally to fill available width
    svg.attr('width', availWidth).attr('height', availHeight);
    svg.attr('viewBox', `0 0 ${ms * availWidth} ${ms * availHeight}`);
    // Scale content so its width fills the available width
    const k = availWidth / origW;
    const origVW = ms * origW;
    const origVH = ms * origH;
    const ty = (ms * availHeight - k * origVH) / 2;
    const transform = d3.zoomIdentity.translate(0, Math.max(0, ty)).scale(k);
    svg.transition().call(zoom.transform, transform);
}


function zoomToFitVertical() {
    const svgEl = family_tree_div.querySelector('svg');
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const zoom = svgEl.__zoom_behavior;
    if (!zoom) return;
    const origW = svgEl.__orig_svg_width;
    const origH = svgEl.__orig_svg_height;
    const ms = svgEl.__max_scale;
    const divRect = family_tree_div.getBoundingClientRect();
    const availWidth = divRect.width - 24;
    const availHeight = divRect.height - 40;
    // Resize SVG and viewBox proportionally to fill available space
    svg.attr('width', availWidth).attr('height', availHeight);
    svg.attr('viewBox', `0 0 ${ms * availWidth} ${ms * availHeight}`);
    // Scale content so its height fills the available height
    const k = availHeight / origH;
    const origVW = ms * origW;
    const origVH = ms * origH;
    const tx = (ms * availWidth - k * origVW) / 2;
    const transform = d3.zoomIdentity.translate(Math.max(0, tx), 0).scale(k);
    svg.transition().call(zoom.transform, transform);
}


function scaleBodyForSmallScreens() {
    const minWidth = 450;
    if (window.innerWidth < minWidth) {
        const scale = window.innerWidth / minWidth;
        document.body.style.transform = `scale(${scale})`;
        document.body.style.transformOrigin = 'top left';
        document.body.style.width = minWidth + 'px';
    } else {
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.width = '';
    }
}


function toggleEnabled(enabled, element_id) {
    const element = document.getElementById(element_id);
    if (element) {
        element.style.pointerEvents = enabled ? '' : 'none';
        element.style.opacity = enabled ? '1' : '0.5';
        element.setAttribute('aria-disabled', enabled ? 'false' : 'true');
        if (!enabled) element.blur();
    }
}


function setMaxLinksEnabled(enabled) {
    const ids = [
        'generations-up-number-max-link',
        'generations-down-number-max-link',
        'max-stack-size-number-max-link'
    ];
    ids.forEach(id => { toggleEnabled(enabled, id); });
}


function updateMaxLinksState() {
    const hasTree = family_tree_div && family_tree_div.querySelector('svg');
    setMaxLinksEnabled(!!hasTree);
}


function selectGedcomFile(file) {
    if (file) {
        file_name_span.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(e) {
            window.gedcom_content = e.target.result;
            const is_valid_gedcom = validateGedcom(window.gedcom_content);

            if (is_valid_gedcom) {
                family_tree_div.innerHTML = '<p style="color: hsl(120, 25%, 50%);">Valid GEDCOM file loaded!</p><p>Select a root person to view their tree.</p>';

                // Parse GEDCOM data
                const parsed_data = parseGedcomData(window.gedcom_content);
                window.individuals = parsed_data.individuals;
                window.families = parsed_data.families;

                individual_filter.value = '';
                window.individual_filter_value = '';

                populateIndividualSelect(window.individuals);
                const status_bar_div = document.getElementById('status-bar-div');
                // Update status bar with file info, and individual and family counts formatted with commas
                status_bar_div.innerHTML = `<b>${file.name}</b>&nbsp;&nbsp;&bull;&nbsp;&nbsp;${window.individuals.length.toLocaleString()} individuals&nbsp;&nbsp;&bull;&nbsp;&nbsp;${window.families.length.toLocaleString()} families`;
            } else {
                family_tree_div.innerHTML = '<p style="color: red;">Invalid GEDCOM file. Please select a valid GEDCOM file.</p>';
                // Clear the dropdown
                individual_select.innerHTML = '<option>Select an individual...</option>';
                window.individuals = [];
                window.families = [];
            }
        };
        reader.readAsText(file);
    } else {
        file_name_span.textContent = '';
    }
}


function filterIndividuals(filter) {
    window.individual_filter_value = filter.toLowerCase();
    if (filter_timeout) clearTimeout(filter_timeout);
    filter_timeout = setTimeout(() => {
        populateIndividualSelect(window.individuals);
    }, 100);
}


function usePresetStyle(preset_name) {
    const preset = style_presets[preset_name];
    if (preset) {
        for (const [key, value] of Object.entries(preset)) {
            // Update the number and range values for this setting
            let element_info = elements.find(el => el.id === key + '-number');
            if (element_info) {
                const element = document.getElementById(element_info.id);
                element.value = value;
                // Not sure why element_info.linked_element is not populated here
                const linked_element = document.getElementById(element_info.id.replace('number', 'range'));
                if (linked_element) linked_element.value = value;
                window[element_info.variable] = value;
            }
            // Update the checkbox value for this setting
            else {
                element_info = elements.find(el => el.id === key + '-checkbox');
                if (element_info) {
                    const element = document.getElementById(element_info.id);
                    element.checked = value;
                    window[element_info.variable] = value;
                }
                // Update background color if it's part of the preset
                else {
                    if (key === 'background-color') {
                        color_picker.value = value;
                        window.tree_color = value;
                    }
                    if (key === 'text-align') {
                        const text_align_element = document.getElementById('text-align-select');
                        if (text_align_element) {
                            text_align_element.value = value;
                            window.text_align = value;
                        }
                    }
                }
            }
        }
    }
    updateRangeThumbs();
    updateFamilyTree();
}


function resetStyling() {
    for (const element_info of elements) {
        if (!['generations-up-number', 'generations-down-number', 'max-stack-size-number', 'show-names-checkbox', 'show-years-checkbox', 'show-places-checkbox', 'hide-childless-inlaws-checkbox'].includes(element_info.id)) {
            const element = document.getElementById(element_info.id);
            if (element_info.type === 'checkbox') element.checked = element_info.default;
            else element.value = element_info.default;
            window[element_info.variable] = element_info.default;
            if (element_info.linked_element) element_info.linked_element.value = element_info.default;
        }
    }
    preset_select.value = 'default';
    color_picker.value = "#000000";
    window.tree_color = "#000000";
    updateRangeThumbs();
    requestFamilyTreeUpdate();
}


function openSaveModal() {
    save_filename_input.value = window.selected_individual ? window.selected_individual.name.replace(/ /g, '-') : 'family-tree';
    save_modal.style.display = 'flex';
}


function saveSVG() {
    const svg = family_tree_div.querySelector('svg');
    if (!svg) {
        alert('No SVG found to save.');
        return;
    }
    let serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    // Add XML declaration
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = window.save_filename + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


function savePNG() {
    const svg = family_tree_div.querySelector('svg');
    if (!svg) {
        alert('No SVG found to save as PNG.');
        return;
    }
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const svgBlob = new Blob([source], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        let vbWidth = 1200, vbHeight = 800;
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
            const vbVals = viewBox.split(/\s+|,/);
            if (vbVals.length === 4) {
                vbWidth = parseFloat(vbVals[2]);
                vbHeight = parseFloat(vbVals[3]);
            }
        }
        const original_vbWidth = vbWidth;
        const original_vbHeight = vbHeight;
        const max_canvas_area = window.max_canvas_width * window.max_canvas_height;
        const img_area = vbWidth * vbHeight;
        if (img_area > max_canvas_area) {
            const scale_factor = Math.sqrt(max_canvas_area / img_area);
            vbWidth = Math.floor(vbWidth * scale_factor);
            vbHeight = Math.floor(vbHeight * scale_factor);
        }
        if (vbWidth > window.max_canvas_width) {
            const scale_factor = window.max_canvas_width / vbWidth;
            vbWidth = Math.floor(vbWidth * scale_factor);
            vbHeight = Math.floor(vbHeight * scale_factor);
        }
        if (vbHeight > window.max_canvas_height) {
            const scale_factor = window.max_canvas_height / vbHeight;
            vbWidth = Math.floor(vbWidth * scale_factor);
            vbHeight = Math.floor(vbHeight * scale_factor);
        }
        canvas.width = vbWidth;
        canvas.height = vbHeight;
        const ctx = canvas.getContext('2d');
        let errorOccurred = false;
        try {
            ctx.drawImage(img, 0, 0, vbWidth, vbHeight);
        } catch (err) {
            errorOccurred = true;
            alert(`Error saving PNG: The canvas size (${vbWidth}x${vbHeight}) may exceed the browser or system limit. Try reducing the tree size or saving it as an SVG.`);
            return;
        }
        if (!errorOccurred) {
            canvas.toBlob(function(blob) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = window.save_filename + '.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url); //a.href
            }, 'image/png');
            if (original_vbHeight > vbHeight || original_vbWidth > vbWidth) {
                alert('Note: The saved PNG has been scaled down to fit within browser limits. For the best quality, consider saving as SVG or reducing the tree size before saving as PNG.');
            }
        }
    };
    img.src = url;
}


function updateRangeThumbs() {
    let hue = parseInt(hue_element.value);
    let sat = parseInt(sat_element.value);
    let lum = parseInt(lum_element.value);
    for (const element_info of elements) {
        if (element_info.type === 'range') {
            const element = document.getElementById(element_info.id);
            if (element) {
                let val = parseInt(element.value) || element_info.default;
                if (element_info.min !== undefined && val < element_info.min) val = element_info.min;
                if (element_info.max !== undefined && val > element_info.max) val = element_info.max;
                if (element_info.id === 'highlight-percent-range') {
                    const color = d3.hcl(hue, sat, lum * (element.value / 100));
                    element.style.setProperty('--range-thumb-color', color);
                }
                else if (['text-brightness-range', 'text-size-range'].includes(element_info.id)) {
                    const sat = 0;
                    const lum = parseInt(text_lum_element.value);
                    const color = d3.hcl(hue, sat, lum);
                    element.style.setProperty('--range-thumb-text-color', color);
                }
                else {
                    const color = d3.hcl(hue, sat, lum);
                    element.style.setProperty('--range-thumb-color', color);
                }
            }
        }
    }
    if (root_name) {
        const color = d3.hcl(hue, sat, 75);
        root_name.style.setProperty('--root-name-text-color', color);
    }
}


function requestFamilyTreeUpdate() {
    if (!window.gedcom_content) {
        //console.log('No GEDCOM content loaded, cannot update family tree.');
        return;
    }
    //console.log('Family tree update requested...');
    if (!update_in_progress) {
        //console.log(`No update in progress, starting update...`);
        update_in_progress = true;
        setMaxLinksEnabled(false);
        //console.log('Max links disabled...');
        toggleEnabled(false, 'auto-node-width-link');
        toggleEnabled(false, 'auto-node-height-link');
        //console.log('Auto box size links disabled...');
        if (update_timeout) clearTimeout(update_timeout);
        update_timeout = setTimeout(() => { updateFamilyTree(); }, 100);
    }
    else {
        //console.log('Update already in progress, marking update as waiting...');
        update_waiting = true;
    }
}


async function updateFamilyTree() {
    if (window.gedcom_content) {
        //console.log('Gedcom content found, updating family tree...');
        // The tree building process can change the data, so we reload to get a fresh copy each time
        const parsed_data = parseGedcomData(window.gedcom_content);
        window.individuals = parsed_data.individuals;
        window.families = parsed_data.families;
        update_in_progress = false;

        const selected_id = individual_select.value || window.selected_individual.id;

        if (selected_id && (selected_id !== 'Select an individual...')) {
            const selected_individual = window.individuals.find(ind => ind.id === selected_id);
            //console.log('Updating family tree for', selected_individual.name);
            if (selected_individual) {
                window.selected_individual = selected_individual;
                await createFamilyTree(selected_individual);
                if (generations_up_number.value > window.max_gen_up) {
                    generations_up_number.value = window.max_gen_up;
                    window.generations_up = window.max_gen_up;
                }
                if (generations_down_number.value > window.max_gen_down) {
                    generations_down_number.value = window.max_gen_down;
                    window.generations_down = window.max_gen_down;
                }
                if (max_stack_size_number.value > window.max_stack_actual) {
                    max_stack_size_number.value = window.max_stack_actual;
                    window.max_stack_size = window.max_stack_actual;
                }
            }
        }
        updateMaxLinksState();
        setMaxLinksEnabled(true);
        toggleEnabled(true, 'auto-node-width-link');
        toggleEnabled(true, 'auto-node-height-link');
        update_in_progress = false;
        if (update_waiting) {
            update_waiting = false;
            requestFamilyTreeUpdate();
        }
    }
}


function populateIndividualSelect(individuals) {
    individual_select.innerHTML = '';
    let filter = window.individual_filter_value || '';
    let filtered = individuals;
    if (filter.length > 0) {
        filtered = individuals.filter(ind => (ind.name || ind.id).toLowerCase().includes(filter));
    }
    filtered.forEach(individual => {
        const option = document.createElement('option');
        option.value = individual.id;
        let birthYear = '';
        let deathYear = '';
        if (individual.birth) {
            const match = individual.birth.match(/\b(\d{4})\b/);
            if (match) birthYear = match[1];
        }
        if (individual.death) {
            const match = individual.death.match(/\b(\d{4})\b/);
            if (match) deathYear = match[1];
        }
        let years = '';
        if (birthYear || deathYear) {
            years = ` (${birthYear}${deathYear ? '–' + deathYear : ''})`;
        }
        option.textContent = (individual.name || individual.id) + years;
        individual_select.appendChild(option);
    });
}

canvasSize.maxArea({
  onSuccess({ width, height, testTime, totalTime }) {
    window.max_canvas_width = width;
    window.max_canvas_height = height;
  }
});

canvasSize.maxWidth({
    onSuccess({ width, testTime, totalTime }) {
        window.max_canvas_width = width;
    }
})

canvasSize.maxHeight({
    onSuccess({ height, testTime, totalTime }) {
        window.max_canvas_height = height;
    }
})
