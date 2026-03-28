export default [
    {
        files: ["static/js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                console: "readonly",
                alert: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                URL: "readonly",
                Blob: "readonly",
                Image: "readonly",
                FileReader: "readonly",
                XMLSerializer: "readonly",
                HTMLElement: "readonly",
                // Libraries
                d3: "readonly",
                canvasSize: "readonly",
                // Browser APIs
                scheduler: "readonly",
                // Cross-file functions
                validateGedcom: "writable",
                parseGedcomData: "writable",
                createFamilyTree: "writable",
                calculateMaxGenUp: "writable",
                calculateMaxGenDown: "writable",
                positionTree: "writable",
                setHeights: "writable",
                getMaximumDimensions: "writable",
                drawTree: "writable",
                // Cross-file variables (shared via script scope)
                family_tree_div: "writable",
                selected_individual: "writable",
            }
        },
        rules: {
            "no-unused-vars": ["warn", {
                "args": "none",
                "varsIgnorePattern": "^(validateGedcom|parseGedcomData|createFamilyTree|calculateMaxGenUp|calculateMaxGenDown|positionTree|setHeights|getMaximumDimensions|drawTree|expandAllStylingSections|collapseAllStylingSections|toggleOptions|updateOptionsVisibility|zoomToFit|zoomToFitHorizontal|zoomToFitVertical|scaleBodyForSmallScreens|updateMaxLinksState|selectGedcomFile|filterIndividuals|usePresetStyle|openSaveModal|saveSVG|savePNG|updateRangeThumbs|requestFamilyTreeUpdate|populateIndividualSelect|openOnlineGedcomModal|loadGedcomFromUrl)$"
            }],
            "no-undef": "warn",
            "no-redeclare": ["warn", { "builtinGlobals": false }],
            "eqeqeq": ["warn", "smart"],
            "no-constant-condition": "warn",
            "no-debugger": "warn",
            "no-duplicate-case": "error",
            "no-empty": ["warn", { "allowEmptyCatch": true }],
            "no-unreachable": "warn",
            "no-unsafe-finally": "error",
            "no-loss-of-precision": "warn",
        }
    },
    {
        // ui_declarations.js only exports shared state — suppress unused-vars
        files: ["static/js/ui_declarations.js"],
        rules: {
            "no-unused-vars": "off"
        }
    },
    {
        ignores: ["node_modules/**"]
    }
];
