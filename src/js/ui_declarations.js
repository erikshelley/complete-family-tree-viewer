// Page Element Variables
const optionsMenu = document.getElementById('options-menu-button');

const file_name_span = document.getElementById('file-name');
const save_filename_input = document.getElementById('save-filename-input');
const save_modal = document.getElementById('save-modal');
const save_modal_ok_button = document.getElementById('save-modal-ok-button');
const save_modal_cancel_button = document.getElementById('save-modal-cancel-button');
const open_online_button = document.getElementById('open-online-button');
const online_gedcom_modal = document.getElementById('online-gedcom-modal');
const online_gedcom_cancel_button = document.getElementById('online-gedcom-cancel-button');
const about_button = document.getElementById('about-button');
const about_modal = document.getElementById('about-modal');
const about_modal_close_button = document.getElementById('about-modal-close-button');

const leftColumnWrapper = document.querySelector('.left-column-wrapper');
const leftCol = document.querySelector('.left-column');
const file_input = document.getElementById('file-input-button');
const individual_filter = document.getElementById('individual-filter-text');
const clearIndividualFilterbutton = document.getElementById('clear-individual-filter');
const individual_select = document.getElementById('individual-select');
const connection_filter = document.getElementById('connection-filter-text');
const clearConnectionFilterbutton = document.getElementById('clear-connection-filter');
const connection_select = document.getElementById('connection-select');
const connection_container = document.getElementById('connection-container');

const preset_select = document.getElementById('preset-select');
const add_preset_button = document.getElementById('add-preset-button');
const save_preset_button = document.getElementById('save-preset-button');
const rename_preset_button = document.getElementById('rename-preset-button');
const reload_preset_button = document.getElementById('reload-preset-button');
const delete_preset_button = document.getElementById('delete-preset-button');
const add_preset_modal = document.getElementById('add-preset-modal');
const add_preset_name_input = document.getElementById('add-preset-name-input');
const add_preset_modal_ok_button = document.getElementById('add-preset-modal-ok-button');
const add_preset_modal_cancel_button = document.getElementById('add-preset-modal-cancel-button');
const rename_preset_modal = document.getElementById('rename-preset-modal');
const rename_preset_name_input = document.getElementById('rename-preset-name-input');
const rename_preset_modal_ok_button = document.getElementById('rename-preset-modal-ok-button');
const rename_preset_modal_cancel_button = document.getElementById('rename-preset-modal-cancel-button');

const hue_element = document.getElementById('hue-range');
const sat_element = document.getElementById('saturation-range');
const lum_element = document.getElementById('node-brightness-range');
const text_lum_element = document.getElementById('text-brightness-range');
const root_name = document.getElementById('root-name');
const generations_up_number = document.getElementById('generations-up-number');
const generations_down_number = document.getElementById('generations-down-number');
const max_stack_size_number = document.getElementById('max-stack-size-number');

const color_picker = document.getElementById('color-picker');

const rightCol = document.querySelector('.right-column');
const family_tree_div = document.getElementById('family-tree-div');
const resize_tree_button = document.getElementById('resize-tree-button');
const resize_tree_horizontal_button = document.getElementById('resize-tree-horizontal-button');
const resize_tree_vertical_button = document.getElementById('resize-tree-vertical-button');
const expand_styling_button = document.getElementById('expand-styling-button');
const collapse_styling_button = document.getElementById('collapse-styling-button');
const save_tree_button = document.getElementById('save-tree-button');

let filter_timeout = null;
let connection_filter_timeout = null;
let update_in_progress = false;
let update_waiting = false;
let update_timeout = null;

// Tree Content Variables
window.individual_filter_value = '';
window.connection_filter_value = '';
window.connection_selected_id = null;
window.connection_path_individual_ids = new Set();
window.selected_individual = null;
window.tree_rows = null;
window.generations_up;
window.generations_down;
window.max_stack_size;
window.show_childless_inlaws;
window.show_non_pedigree_family;

// Tree Styling Variables
window.box_width; window.default_box_width;
window.box_height; window.default_box_height;
window.sibling_spacing; window.default_sibling_spacing;
window.generation_spacing; window.default_generation_spacing;
window.node_rounding; window.default_node_rounding;
window.node_brightness; window.default_node_brightness;
window.beside_inlaws; window.default_beside_inlaws;
window.tree_orientation = 'vertical'; // 'vertical' (default) or 'horizontal'
window.show_names; window.default_show_names;
window.show_years; window.default_show_years;
window.show_places; window.default_show_places;

window.node_border_width; window.default_node_border_width;
window.border_highlight_percent; window.default_border_highlight_percent;

window.level_spacing; window.default_level_spacing;
window.tree_padding; window.default_tree_padding;

window.link_width; window.default_link_width;
window.highlighted_link_width; window.default_highlighted_link_width;
window.link_rounding; window.default_link_rounding;
window.link_highlight_percent; window.default_link_highlight_percent;
window.inlaw_link_highlight_percent; window.default_inlaw_link_highlight_percent;

window.special_highlight_percent; window.default_special_highlight_percent;

window.highlight_type;

window.text_size; window.default_text_size;
window.text_brightness; window.default_text_brightness;
window.highlighted_text_brightness; window.default_highlighted_text_brightness;
window.text_shadow; window.default_text_shadow;
window.root_hue; window.default_node_hue;
window.node_saturation; window.default_node_saturation;
window.transparent_bg_rect; window.default_transparent_bg_rect;

window.tree_color = color_picker.value;

const elements = [
    // Tree Content
    { id: 'generations-up-number',               type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_up' },
    { id: 'generations-down-number',             type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_down' },
    { id: 'max-stack-size-number',               type: 'number',   default: 2,     min: 1, max: 99, variable: 'max_stack_size' },
    { id: 'show-names-checkbox',                 type: 'checkbox', default: true,  variable: 'show_names' },
    { id: 'show-years-checkbox',                 type: 'checkbox', default: true,  variable: 'show_years' },
    { id: 'show-places-checkbox',                type: 'checkbox', default: false, variable: 'show_places' },
    { id: 'beside-inlaws-checkbox',            type: 'checkbox', default: false, variable: 'beside_inlaws' },
    { id: 'show-childless-inlaws-checkbox',      type: 'checkbox', default: true,  variable: 'show_childless_inlaws' },
    { id: 'show-non-pedigree-family-checkbox',   type: 'checkbox', default: true,  variable: 'show_non_pedigree_family' },

    // Tree Styling
    // Size
    { id: 'node-width-number',                   type: 'number',   default: 100,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-width-range',                    type: 'range',    default: 100,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-height-number',                  type: 'number',   default: 100,    min: 20, max: 480, variable: 'box_height' },
    { id: 'node-height-range',                   type: 'range',    default: 100,    min: 20, max: 480, variable: 'box_height' },
    { id: 'node-border-width-number',            type: 'number',   default: 3,     min: 0, max: 20, variable: 'node_border_width' },
    { id: 'node-border-width-range',             type: 'range',    default: 3,     min: 0, max: 20, variable: 'node_border_width' },
    { id: 'link-width-number',                   type: 'number',   default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'link-width-range',                    type: 'range',    default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'highlighted-link-width-number',       type: 'number',   default: 6,     min: 1, max: 20, variable: 'highlighted_link_width' },
    { id: 'highlighted-link-width-range',        type: 'range',    default: 6,     min: 1, max: 20, variable: 'highlighted_link_width' },
    { id: 'text-size-number',                    type: 'number',   default: 16,    min: 1, max: 100, variable: 'text_size' },
    { id: 'text-size-range',                     type: 'range',    default: 16,    min: 1, max: 100, variable: 'text_size' },

    // Spacing
    { id: 'sibling-spacing-number',               type: 'number',   default: 50,    min: 0, max: 480, variable: 'sibling_spacing' },
    { id: 'sibling-spacing-range',               type: 'range',    default: 50,    min: 0, max: 480, variable: 'sibling_spacing' },
    { id: 'generation-spacing-number',           type: 'number',   default: 50,    min: 0, max: 480, variable: 'generation_spacing' },
    { id: 'generation-spacing-range',            type: 'range',    default: 50,    min: 0, max: 480, variable: 'generation_spacing' },
    { id: 'level-spacing-number',                type: 'number',   default: 100,   min: 0, max: 400, variable: 'level_spacing' },
    { id: 'level-spacing-range',                 type: 'range',    default: 100,   min: 0, max: 400, variable: 'level_spacing' },
    { id: 'box-padding-number',                  type: 'number',   default: 2,     min: 0, max: 50, variable: 'box_padding' },
    { id: 'box-padding-range',                   type: 'range',    default: 2,     min: 0, max: 50, variable: 'box_padding' },
    { id: 'tree-padding-number',                 type: 'number',   default: 150,   min: 0, max: 600, variable: 'tree_padding' },
    { id: 'tree-padding-range',                  type: 'range',    default: 150,   min: 0, max: 600, variable: 'tree_padding' },
    { id: 'text-align-select',                   type: 'select',   default: 'middle', variable: 'text_align' },

    // Color
    { id: 'hue-number',                          type: 'number',   default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'hue-range',                           type: 'range',    default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'saturation-number',                   type: 'number',   default: 20,    min: 0, max: 100, variable: 'node_saturation' },
    { id: 'saturation-range',                    type: 'range',    default: 20,    min: 0, max: 100, variable: 'node_saturation' },
    { id: 'node-brightness-number',              type: 'number',   default: 30,    min: 0, max: 100, variable: 'node_brightness' },
    { id: 'node-brightness-range',               type: 'range',    default: 30,    min: 0, max: 100, variable: 'node_brightness' },
    { id: 'text-brightness-number',              type: 'number',   default: 80,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'text-brightness-range',               type: 'range',    default: 80,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'highlighted-text-brightness-number',  type: 'number',   default: 80,    min: 0, max: 100, variable: 'highlighted_text_brightness' },
    { id: 'highlighted-text-brightness-range',   type: 'range',    default: 80,    min: 0, max: 100, variable: 'highlighted_text_brightness' },
    { id: 'text-shadow-checkbox',                type: 'checkbox', default: true,  variable: 'text_shadow' },
    { id: 'transparent-bg-rect-checkbox',        type: 'checkbox', default: false, variable: 'transparent_bg_rect' },

    // Highlights
    { id: 'special-highlight-percent-number',   type: 'number',   default: 175,   min: 0, max: 200, variable: 'special_highlight_percent' },
    { id: 'special-highlight-percent-range',    type: 'range',    default: 175,   min: 0, max: 200, variable: 'special_highlight_percent' },
    { id: 'border-highlight-percent-number',     type: 'number',   default: 125,   min: 0, max: 200, variable: 'border_highlight_percent' },
    { id: 'border-highlight-percent-range',      type: 'range',    default: 125,   min: 0, max: 200, variable: 'border_highlight_percent' },
    { id: 'link-highlight-percent-number',       type: 'number',   default: 125,   min: 0, max: 200, variable: 'link_highlight_percent' },
    { id: 'link-highlight-percent-range',        type: 'range',    default: 125,   min: 0, max: 200, variable: 'link_highlight_percent' },
    { id: 'inlaw-link-highlight-percent-number', type: 'number',   default: 150,   min: 0, max: 200, variable: 'inlaw_link_highlight_percent' },
    { id: 'inlaw-link-highlight-percent-range',  type: 'range',    default: 150,   min: 0, max: 200, variable: 'inlaw_link_highlight_percent' },

    // Rounding
    { id: 'node-rounding-number',                type: 'number',   default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'node-rounding-range',                 type: 'range',    default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'link-rounding-number',                type: 'number',   default: 25,    min: 0, max: 100, variable: 'link_rounding' },
    { id: 'link-rounding-range',                 type: 'range',    default: 25,    min: 0, max: 100, variable: 'link_rounding' },

    // Select and color controls (preset_key where element id differs from the preset key convention)
    { id: 'highlights-select',  type: 'select', variable: 'highlight_type', preset_key: 'highlight-type' },
    { id: 'color-picker',       type: 'color',  variable: 'tree_color',     preset_key: 'background-color' },

    // Radio group controls
    { id: 'layout-vertical', type: 'radio', name: 'layout', variable: 'tree_orientation', preset_key: 'tree-orientation' },
];

const none_links = [
    { id: 'no-border-highlight-percent', variable: 'border_highlight_percent' },
    { id: 'no-link-highlight-percent', variable: 'link_highlight_percent' },
    { id: 'no-inlaw-link-highlight-percent', variable: 'inlaw_link_highlight_percent' },
]

const auto_links = [
    { id: 'auto-node-width', variable: 'box_width' },
    { id: 'auto-node-height', variable: 'box_height' },
]

// Snapshot all rendering/layout parameters from window into a plain object.
// Pass this into createFamilyTree so the pipeline reads from a stable config
// rather than reaching into window at every call site.
function buildRenderConfig() {
    const config = {};
    const seen = new Set();
    for (const el of elements) {
        if (seen.has(el.variable)) continue;
        seen.add(el.variable);
        config[el.variable] = window[el.variable];
    }
    config.tree_orientation = window.tree_orientation;
    return config;
}
