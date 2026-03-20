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

const node_width_number = document.getElementById('node-width-number');
const node_width_range = document.getElementById('node-width-range');
const auto_node_width = document.getElementById('auto-node-width');
const node_height_number = document.getElementById('node-height-number');
const node_height_range = document.getElementById('node-height-range');
const auto_node_height = document.getElementById('auto-node-height');

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
window.vertical_inlaws; window.default_vertical_inlaws;
window.show_names; window.default_show_names;
window.show_years; window.default_show_years;
window.show_places; window.default_show_places;
window.show_tooltips; window.default_show_tooltips;

window.node_border_width; window.default_node_border_width;
window.border_highlight_percent; window.default_border_highlight_percent;

window.level_spacing; window.default_level_spacing;
window.tree_padding; window.default_tree_padding;

window.link_width; window.default_link_width;
window.link_rounding; window.default_link_rounding;
window.link_highlight_percent; window.default_link_highlight_percent;
window.inlaw_link_highlight_percent; window.default_inlaw_link_highlight_percent;

window.pedigree_highlight_percent; window.default_pedigree_highlight_percent;

window.text_size; window.default_text_size;
window.text_brightness; window.default_text_brightness;
window.text_shadow; window.default_text_shadow;
window.root_hue; window.default_node_hue;
window.node_saturation; window.default_node_saturation;
window.transparent_bg_rect; window.default_transparent_bg_rect;

window.tree_color = color_picker.value;

const style_presets = {
    'default': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': true, 'show-places': false,
        // Size
        'node-width': 150, 'node-height': 75, 'node-border-width': 3, 'link-width': 6, 'text-size': 16,
        // Spacing
        'h-spacing': 37, 'v-spacing': 66, 'level-spacing': 132, 'tree-padding': 150,
        // Color
        'hue': 180, 'saturation': 33, 'node-brightness': 25, 'text-brightness': 90, 'text-shadow': true, 'transparent-bg-rect': false, 'background-color': '#171717',
        // Highlights
        'pedigree-highlight-percent': 175, 'border-highlight-percent': 125, 'link-highlight-percent': 125, 'inlaw-link-highlight-percent': 150,
        // Rounding
        'node-rounding': 25, 'link-rounding': 50,
    },
    'print': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': true, 'show-places': false,
        // Size
        'node-width': 200, 'node-height': 100, 'node-border-width': 5, 'link-width': 5, 'text-size': 24,
        // Spacing
        'h-spacing': 25, 'v-spacing': 100, 'level-spacing': 100, 'tree-padding': 150,
        // Color
        'hue': 300, 'saturation': 25, 'node-brightness': 75, 'text-brightness': 100, 'text-shadow': false, 'transparent-bg-rect': false, 'background-color': '#ffffff',
        // Highlights
        'pedigree-highlight-percent': 75, 'border-highlight-percent': 90, 'link-highlight-percent': 90, 'inlaw-link-highlight-percent': 75,
        // Rounding
        'node-rounding': 25, 'link-rounding': 50,
    },
    'share': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': false, 'show-places': false,
        // Size
        'node-width': 200, 'node-height': 100, 'node-border-width': 5, 'link-width': 5, 'text-size': 24,
        // Spacing
        'h-spacing': 50, 'v-spacing': 100, 'level-spacing': 100, 'tree-padding': 150,
        // Color
        'hue': 300, 'saturation': 33, 'node-brightness': 33, 'text-brightness': 90, 'text-shadow': true, 'transparent-bg-rect': false, 'background-color': '#171717',
        // Highlights
        'pedigree-highlight-percent': 100, 'border-highlight-percent': 125, 'link-highlight-percent': 125, 'inlaw-link-highlight-percent': 125,
        // Rounding
        'node-rounding': 25, 'link-rounding': 50,
    },
    'orbs': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': false, 'show-places': false,
        // Size
        'node-width': 150, 'node-height': 150, 'node-border-width': 9, 'link-width': 9, 'text-size': 16,
        // Spacing
        'h-spacing': 25, 'v-spacing': 100, 'level-spacing': 100, 'tree-padding': 150,
        // Color
        'hue': 180, 'saturation': 33, 'node-brightness': 25, 'text-brightness': 85, 'text-shadow': true, 'transparent-bg-rect': false, 'background-color': '#171717',
        // Highlights
        'pedigree-highlight-percent': 175, 'border-highlight-percent': 125, 'link-highlight-percent': 125, 'inlaw-link-highlight-percent': 150,
        // Rounding
        'node-rounding': 100, 'link-rounding': 50,
    },
    'sharp': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': true, 'show-places': false,
        // Size
        'node-width': 150, 'node-height': 75, 'node-border-width': 3, 'link-width': 6, 'text-size': 16,
        // Spacing
        'h-spacing': 37, 'v-spacing': 66, 'level-spacing': 132, 'tree-padding': 150,
        // Color
        'hue': 180, 'saturation': 33, 'node-brightness': 33, 'text-brightness': 90, 'text-shadow': true, 'transparent-bg-rect': false, 'background-color': '#171717',
        // Highlights
        'pedigree-highlight-percent': 150, 'border-highlight-percent': 125, 'link-highlight-percent': 125, 'inlaw-link-highlight-percent': 150,
        // Rounding
        'node-rounding': 0, 'link-rounding': 0,
    },
    'dark': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': true, 'show-places': false,
        // Size
        'node-width': 150, 'node-height': 75, 'node-border-width': 3, 'link-width': 6, 'text-size': 16,
        // Spacing
        'h-spacing': 37, 'v-spacing': 66, 'level-spacing': 132, 'tree-padding': 150,
        // Color
        'hue': 180, 'saturation': 33, 'node-brightness': 20, 'text-brightness': 75, 'text-shadow': true, 'transparent-bg-rect': false, 'background-color': '#000000',
        // Highlights
        'pedigree-highlight-percent': 175, 'border-highlight-percent': 125, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 150,
        // Rounding
        'node-rounding': 25, 'link-rounding': 50,
    },
    'light': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': true, 'show-places': false,
        // Size
        'node-width': 150, 'node-height': 75, 'node-border-width': 3, 'link-width': 6, 'text-size': 16,
        // Spacing
        'h-spacing': 37, 'v-spacing': 66, 'level-spacing': 132, 'tree-padding': 150,
        // Color
        'hue': 180, 'saturation': 33, 'node-brightness': 85, 'text-brightness': 40, 'text-shadow': false, 'transparent-bg-rect': false, 'background-color': '#ffffff',
        // Highlights
        'pedigree-highlight-percent': 85, 'border-highlight-percent': 90, 'link-highlight-percent': 100, 'inlaw-link-highlight-percent': 90,
        // Rounding
        'node-rounding': 25, 'link-rounding': 50,
    },
    'detailed': {
        // Content
        'vertical-inlaws': true, 'show-names': true, 'show-years': true, 'show-places': true,
        // Size
        'node-width': 300, 'node-height': 100, 'node-border-width': 5, 'link-width': 10, 'text-size': 16,
        // Spacing
        'h-spacing': 37, 'v-spacing': 100, 'level-spacing': 300, 'tree-padding': 150,
        // Color
        'hue': 180, 'saturation': 33, 'node-brightness': 33, 'text-brightness': 90, 'text-shadow': true, 'transparent-bg-rect': false, 'background-color': '#171717',
        // Highlights
        'pedigree-highlight-percent': 150, 'border-highlight-percent': 125, 'link-highlight-percent': 125, 'inlaw-link-highlight-percent': 125,
        // Rounding
        'node-rounding': 50, 'link-rounding': 50,
    },
}

const elements = [
    // Tree Content
    { id: 'generations-up-number',               type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_up', max: 99 },
    { id: 'generations-down-number',             type: 'number',   default: 1,     min: 0, max: 99, variable: 'generations_down', max: 99 },
    { id: 'max-stack-size-number',               type: 'number',   default: 1,     min: 1, max: 99, variable: 'max_stack_size', max: 99 },
    { id: 'show-names-checkbox',                 type: 'checkbox', default: true,  variable: 'show_names' },
    { id: 'show-years-checkbox',                 type: 'checkbox', default: true,  variable: 'show_years' },
    { id: 'show-places-checkbox',                type: 'checkbox', default: false, variable: 'show_places' },
    { id: 'vertical-inlaws-checkbox',            type: 'checkbox', default: true,  variable: 'vertical_inlaws' },
    { id: 'hide-childless-inlaws-checkbox',      type: 'checkbox', default: false, variable: 'hide_childless_inlaws' },
    //{ id: 'pedigree-only', type: 'checkbox', default: false, variable: 'pedigree_only' },

    // Tree Styling
    { id: 'node-width-number',                   type: 'number',   default: 150,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-width-range',                    type: 'range',    default: 150,   min: 20, max: 480, variable: 'box_width' },
    { id: 'node-height-number',                  type: 'number',   default: 75,    min: 20, max: 480, variable: 'box_height' },
    { id: 'node-height-range',                   type: 'range',    default: 75,    min: 20, max: 480, variable: 'box_height' },
    { id: 'h-spacing-number',                    type: 'number',   default: 37,    min: 0, max: 480, variable: 'h_spacing' },
    { id: 'h-spacing-range',                     type: 'range',    default: 37,    min: 0, max: 480, variable: 'h_spacing' },
    { id: 'v-spacing-number',                    type: 'number',   default: 66,    min: 0, max: 480, variable: 'v_spacing' },
    { id: 'v-spacing-range',                     type: 'range',    default: 66,    min: 0, max: 480, variable: 'v_spacing' },
    { id: 'node-rounding-number',                type: 'number',   default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'node-rounding-range',                 type: 'range',    default: 25,    min: 0, max: 100, variable: 'node_rounding' },
    { id: 'node-brightness-number',              type: 'number',   default: 25,    min: 0, max: 100, variable: 'node_brightness' },
    { id: 'node-brightness-range',               type: 'range',    default: 25,    min: 0, max: 100, variable: 'node_brightness' },

    //{ id: 'show-tooltips-checkbox',         type: 'checkbox', default: false, variable: 'show_tooltips' },

    { id: 'node-border-width-number',            type: 'number',   default: 3,     min: 0, max: 20, variable: 'node_border_width' },
    { id: 'node-border-width-range',             type: 'range',    default: 3,     min: 0, max: 20, variable: 'node_border_width' },
    { id: 'border-highlight-percent-number',     type: 'number',   default: 125,   min: 0, max: 200, variable: 'border_highlight_percent' },
    { id: 'border-highlight-percent-range',      type: 'range',    default: 125,   min: 0, max: 200, variable: 'border_highlight_percent' },

    { id: 'level-spacing-number',                type: 'number',   default: 132,   min: 0, max: 400, variable: 'level_spacing' },
    { id: 'level-spacing-range',                 type: 'range',    default: 132,   min: 0, max: 400, variable: 'level_spacing' },
    { id: 'tree-padding-number',                 type: 'number',   default: 150,   min: 0, max: 600, variable: 'tree_padding' },
    { id: 'tree-padding-range',                  type: 'range',    default: 150,   min: 0, max: 600, variable: 'tree_padding' },

    { id: 'link-width-number',                   type: 'number',   default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'link-width-range',                    type: 'range',    default: 6,     min: 1, max: 20, variable: 'link_width' },
    { id: 'link-rounding-number',                type: 'number',   default: 50,    min: 0, max: 100, variable: 'link_rounding' },
    { id: 'link-rounding-range',                 type: 'range',    default: 50,    min: 0, max: 100, variable: 'link_rounding' },
    { id: 'link-highlight-percent-number',       type: 'number',   default: 125,   min: 0, max: 200, variable: 'link_highlight_percent' },
    { id: 'link-highlight-percent-range',        type: 'range',    default: 125,   min: 0, max: 200, variable: 'link_highlight_percent' },

    { id: 'inlaw-link-highlight-percent-number', type: 'number',   default: 150,   min: 0, max: 200, variable: 'inlaw_link_highlight_percent' },
    { id: 'inlaw-link-highlight-percent-range',  type: 'range',    default: 150,   min: 0, max: 200, variable: 'inlaw_link_highlight_percent' },

    { id: 'hue-number',                          type: 'number',   default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'hue-range',                           type: 'range',    default: 180,   min: 0, max: 360, variable: 'root_hue' },
    { id: 'saturation-number',                   type: 'number',   default: 33,    min: 0, max: 100, variable: 'node_saturation' },
    { id: 'saturation-range',                    type: 'range',    default: 33,    min: 0, max: 100, variable: 'node_saturation' },

    { id: 'pedigree-highlight-percent-number',   type: 'number',   default: 175,   min: 0, max: 200, variable: 'pedigree_highlight_percent' },
    { id: 'pedigree-highlight-percent-range',    type: 'range',    default: 175,   min: 0, max: 200, variable: 'pedigree_highlight_percent' },

    { id: 'text-size-number',                    type: 'number',   default: 16,    min: 1, max: 100, variable: 'text_size' },
    { id: 'text-size-range',                     type: 'range',    default: 16,    min: 1, max: 100, variable: 'text_size' },
    { id: 'text-brightness-number',              type: 'number',   default: 90,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'text-brightness-range',               type: 'range',    default: 90,    min: 0, max: 100, variable: 'text_brightness' },
    { id: 'text-shadow-checkbox',                type: 'checkbox', default: true,  variable: 'text_shadow' },

    { id: 'transparent-bg-rect-checkbox',        type: 'checkbox', default: false, variable: 'transparent_bg_rect' },
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
