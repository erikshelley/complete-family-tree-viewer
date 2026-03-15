// Page Element Variables
const optionsMenu = document.getElementById('options-menu-button');

const file_name_span = document.getElementById('file-name');
const save_filename_input = document.getElementById('save-filename-input');
const save_format_input = document.getElementById('save-format-input');
const save_modal = document.getElementById('save-modal');
const save_modal_ok_button = document.getElementById('save-modal-ok-button');
const save_modal_cancel_button = document.getElementById('save-modal-cancel-button');

const leftColumnWrapper = document.querySelector('.left-column-wrapper');
const leftCol = document.querySelector('.left-column');
const file_input = document.getElementById('file-input-button');
const individual_filter = document.getElementById('individual-filter-text');
const clearIndividualFilterbutton = document.getElementById('clear-individual-filter');
const individual_select = document.getElementById('individual-select');
const reset_styling_button = document.getElementById('reset-styling-button');
const preset_select = document.getElementById('preset-select');
const color_picker = document.getElementById('color-picker');
const auto_node_width = document.getElementById('auto-node-width');
const node_width_range = document.getElementById('node-width-range');
const auto_node_height = document.getElementById('auto-node-height');
const node_width_number = document.getElementById('node-width-number');
const node_height_range = document.getElementById('node-height-range');
const node_height_number = document.getElementById('node-height-number');
const hue_element = document.getElementById('hue-range');
const sat_element = document.getElementById('saturation-range');
const lum_element = document.getElementById('node-brightness-range');
const text_lum_element = document.getElementById('text-brightness-range');
const root_name = document.getElementById('root-name');
const generations_up_number = document.getElementById('generations-up-number');
const generations_down_number = document.getElementById('generations-down-number');
const max_stack_size_number = document.getElementById('max-stack-size-number');

const rightCol = document.querySelector('.right-column');
const family_tree_div = document.getElementById('family-tree-div');
const save_svg_button = document.getElementById('save-svg-button');
const save_png_button = document.getElementById('save-png-button');

let filter_timeout = null;
let update_in_progress = false;
let update_waiting = false;
let update_timeout = null;

// Tree Content Variables
window.individual_filter_value = '';
window.selected_individual = '';
window.generations_up;
window.generations_down;
window.max_stack_size;
window.hide_childless_inlaws;
//window.pedigree_only;

// Tree Styling Variables
window.box_width; window.default_box_width;
window.box_height; window.default_box_height;
window.h_spacing; window.default_h_spacing;
window.v_spacing; window.default_v_spacing;
window.node_rounding; window.default_node_rounding;
window.node_brightness; window.default_node_brightness;
window.node_border_width; window.default_node_border_width;
window.show_names; window.default_show_names;
window.show_years; window.default_show_years;
window.show_places; window.default_show_places;
window.show_tooltips; window.default_show_tooltips;

window.pedigree_highlight_percent; window.default_pedigree_highlight_percent;

window.border_highlight_percent; window.default_border_highlight_percent;

window.link_width; window.default_link_width;
window.link_rounding; window.default_link_rounding;
window.link_highlight_percent; window.default_link_highlight_percent;
window.inlaw_link_highlight_percent; window.default_inlaw_link_highlight_percent;

window.text_size; window.default_text_size;
window.text_brightness; window.default_text_brightness;
window.text_shadow; window.default_text_shadow;
window.root_hue; window.default_node_hue;
window.node_saturation; window.default_node_saturation;
window.transparent_bg_rect; window.default_transparent_bg_rect;

window.tree_color = color_picker.value;

const style_presets = {
    'default': {
        'node-width': 150, 'node-height': 75, 'h-spacing': 37, 'v-spacing': 66, 'node-rounding': 25, 'node-brightness': 33,
        'show-names': true, 'show-years': true, 'show-places': false,
        'pedigree-highlight-percent': 150,
        'node-border-width': 3, 'border-highlight-percent': 100,
        'link-width': 6, 'link-rounding': 50, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 125,
        'text-size': 16, 'text-brightness': 90, 'text-shadow': true,
        'hue': 180, 'saturation': 33, 
        'transparent-bg-rect': true, 'background-color': '#000000'
    },
    'orbs': {
        'node-width': 150, 'node-height': 150, 'h-spacing': 75, 'v-spacing': 75, 'node-rounding': 100, 'node-brightness': 33,
        'show-names': true, 'show-years': false, 'show-places': false,
        'pedigree-highlight-percent': 150,
        'node-border-width': 0, 'border-highlight-percent': 100,
         'link-width': 9, 'link-rounding': 50, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 125,
        'text-size': 16, 'text-brightness': 90, 'text-shadow': false,
        'hue': 180, 'saturation': 33, 
        'transparent-bg-rect': true, 'background-color': '#000000'
    },
    'sharp': {
        'node-width': 150, 'node-height': 75, 'h-spacing': 37, 'v-spacing': 66, 'node-rounding': 0, 'node-brightness': 33,
        'show-names': true, 'show-years': true, 'show-places': false,
        'pedigree-highlight-percent': 150,
        'node-border-width': 3, 'border-highlight-percent': 150,
        'link-width': 6, 'link-rounding': 50, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 125,
        'text-size': 16, 'text-brightness': 90, 'text-shadow': true,
        'hue': 180, 'saturation': 33, 
        'transparent-bg-rect': true, 'background-color': '#000000'
    },
    'dark': {
        'node-width': 150, 'node-height': 75, 'h-spacing': 37, 'v-spacing': 66, 'node-rounding': 25, 'node-brightness': 20,
        'show-names': true, 'show-years': true, 'show-places': false,
        'node-border-width': 3, 'border-highlight-percent': 125,
        'link-width': 6, 'link-rounding': 50, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 150,
        'text-size': 16, 'text-brightness': 75, 'text-shadow': true,
        'hue': 180, 'saturation': 33, 'pedigree-highlight-percent': 175,
        'transparent-bg-rect': false, 'background-color': '#000000'
    },
    'light': {
        'node-width': 150, 'node-height': 75, 'h-spacing': 37, 'v-spacing': 66, 'node-rounding': 25, 'node-brightness': 85,
        'show-names': true, 'show-years': true, 'show-places': false,
        'pedigree-highlight-percent': 85,
        'node-border-width': 3, 'border-highlight-percent': 90,
        'link-width': 6, 'link-rounding': 50, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 90,
        'text-size': 16, 'text-brightness': 40, 'text-shadow': false,
        'hue': 180, 'saturation': 33, 
        'transparent-bg-rect': false, 'background-color': '#ffffff'
    },
    'detailed': {
        'node-width': 300, 'node-height': 100, 'h-spacing': 37, 'v-spacing': 100, 'node-rounding': 50, 'node-brightness': 33,
        'show-names': true, 'show-years': true, 'show-places': true,
        'pedigree-highlight-percent': 150,
        'node-border-width': 5, 'border-highlight-percent': 150,
        'link-width': 10, 'link-rounding': 50, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 125,
        'text-size': 16, 'text-brightness': 90, 'text-shadow': true,
        'hue': 180, 'saturation': 33, 
        'transparent-bg-rect': false, 'background-color': '#202020'
    },
}

const elements = [
    // Tree Content
    { id: 'generations-up-number',           type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_up', max: 99 },
    { id: 'generations-down-number',         type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_down', max: 99 },
    { id: 'max-stack-size-number',           type: 'number',   default: 1,     min: 1, max: 99, variable: 'max_stack_size', max: 99 },
    { id: 'hide-childless-inlaws-checkbox',  type: 'checkbox', default: false, variable: 'hide_childless_inlaws' },
    //{ id: 'pedigree-only', type: 'checkbox', default: false, variable: 'pedigree_only' },

    // Tree Styling
    { id: 'node-width-number',               type: 'number',   default: 150,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-width-range',                type: 'range',    default: 150,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-height-number',              type: 'number',   default: 75,    min: 20, max: 480, variable: 'box_height' },
    { id: 'node-height-range',               type: 'range',    default: 75,    min: 20, max: 480, variable: 'box_height' },
    { id: 'h-spacing-number',                type: 'number',   default: 37,    min: 0, max: 480, variable: 'h_spacing' },
    { id: 'h-spacing-range',                 type: 'range',    default: 37,    min: 0, max: 480, variable: 'h_spacing' },
    { id: 'v-spacing-number',                type: 'number',   default: 66,    min: 0, max: 480, variable: 'v_spacing' },
    { id: 'v-spacing-range',                 type: 'range',    default: 66,    min: 0, max: 480, variable: 'v_spacing' },
    { id: 'node-rounding-number',            type: 'number',   default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'node-rounding-range',             type: 'range',    default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'node-brightness-number',          type: 'number',   default: 33,    min: 0, max: 100, variable: 'node_brightness' },
    { id: 'node-brightness-range',           type: 'range',    default: 33,    min: 0, max: 100, variable: 'node_brightness' },

    { id: 'show-names-checkbox',             type: 'checkbox', default: true,  variable: 'show_names' },
    { id: 'show-years-checkbox',             type: 'checkbox', default: true,  variable: 'show_years' },
    { id: 'show-places-checkbox',            type: 'checkbox', default: false, variable: 'show_places' },
    //{ id: 'show-tooltips-checkbox',         type: 'checkbox', default: false, variable: 'show_tooltips' },

    { id: 'pedigree-highlight-percent-number',        type: 'number',   default: 150,   min: 0, max: 200, variable: 'pedigree_highlight_percent' },
    { id: 'pedigree-highlight-percent-range',         type: 'range',    default: 150,   min: 0, max: 200, variable: 'pedigree_highlight_percent' },

    { id: 'node-border-width-number',        type: 'number',   default: 3,     min: 0, max: 20, variable: 'node_border_width' },
    { id: 'node-border-width-range',         type: 'range',    default: 3,     min: 0, max: 20, variable: 'node_border_width' },
    { id: 'border-highlight-percent-number', type: 'number',  default: 100,   min: 0, max: 200, variable: 'border_highlight_percent' },
    { id: 'border-highlight-percent-range',  type: 'range',   default: 100,   min: 0, max: 200, variable: 'border_highlight_percent' },

    { id: 'link-width-number',               type: 'number',   default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'link-width-range',                type: 'range',    default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'link-rounding-number',            type: 'number',   default: 50,    min: 0, max: 100, variable: 'link_rounding' },
    { id: 'link-rounding-range',             type: 'range',    default: 50,    min: 0, max: 100, variable: 'link_rounding' },
    { id: 'link-highlight-percent-number',           type: 'number',   default: 100,   min: 0, max: 200, variable: 'link_highlight_percent' },
    { id: 'link-highlight-percent-range',            type: 'range',    default: 100,   min: 0, max: 200, variable: 'link_highlight_percent' },
    { id: 'inlaw-link-highlight-percent-number',     type: 'number',   default: 150,   min: 0, max: 200, variable: 'inlaw_link_highlight_percent' },
    { id: 'inlaw-link-highlight-percent-range',      type: 'range',    default: 150,   min: 0, max: 200, variable: 'inlaw_link_highlight_percent' },

    { id: 'text-size-number',                type: 'number',   default: 16,    min: 1, max: 100, variable: 'text_size' },
    { id: 'text-size-range',                 type: 'range',    default: 16,    min: 1, max: 100, variable: 'text_size' },
    { id: 'text-brightness-number',          type: 'number',   default: 90,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'text-brightness-range',           type: 'range',    default: 90,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'text-shadow-checkbox',            type: 'checkbox', default: true,  variable: 'text_shadow' },

    { id: 'hue-number',                      type: 'number',   default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'hue-range',                       type: 'range',    default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'saturation-number',               type: 'number',   default: 33,    min: 0, max: 100, variable: 'node_saturation' },
    { id: 'saturation-range',                type: 'range',    default: 33,    min: 0, max: 100, variable: 'node_saturation' },
    { id: 'transparent-bg-rect-checkbox',    type: 'checkbox', default: true,  variable: 'transparent_bg_rect' },
];

const none_links = [
    { id: 'no-border-highlight-percent', variable: 'border_highlight_percent' },
    { id: 'no-pedigree-highlight-percent', variable: 'pedigree_highlight_percent' },
    { id: 'no-link-highlight-percent', variable: 'link_highlight_percent' },
    { id: 'no-inlaw-link-highlight-percent', variable: 'inlaw_link_highlight_percent' },
]

const auto_links = [
    { id: 'auto-node-width', variable: 'box_width' },
    { id: 'auto-node-height', variable: 'box_height' },
]
