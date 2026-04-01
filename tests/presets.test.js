import { describe, expect, it } from 'vitest';
import vm from 'node:vm';

import { createBrowserContext, runBrowserScriptInContext } from './helpers/load-browser-script.js';

function loadPresetsContext() {
    // presets.js uses `const style_presets = {...}` which is block-scoped and does not
    // attach to the vm context object. Appending a var alias makes it accessible via
    // context.window without modifying the source file.
    const context = createBrowserContext();
    runBrowserScriptInContext('src/js/presets.js', context);
    vm.runInContext('window.style_presets = style_presets;', context);
    return context;
}

describe('presets.js smoke test', () => {
    it('16.01 style_presets is a non-empty object when presets.js is loaded', () => {
        const context = loadPresetsContext();

        expect(typeof context.window.style_presets).toBe('object');
        expect(context.window.style_presets).not.toBeNull();
        expect(Object.keys(context.window.style_presets).length).toBeGreaterThan(0);
    });

    it('16.02 each preset in style_presets is a non-empty object with at least one setting', () => {
        const context = loadPresetsContext();
        const presets = context.window.style_presets;

        for (const [name, settings] of Object.entries(presets)) {
            expect(typeof settings, `preset "${name}" should be an object`).toBe('object');
            expect(settings, `preset "${name}" should not be null`).not.toBeNull();
            expect(Object.keys(settings).length, `preset "${name}" should have at least one setting`).toBeGreaterThan(0);
        }
    });
});
