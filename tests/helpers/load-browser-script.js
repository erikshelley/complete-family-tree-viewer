import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function createBrowserContext(options = {}) {
    const { windowOverrides = {}, globalOverrides = {} } = options;

    const window = { ...windowOverrides };
    const context = {
        window,
        console,
        setTimeout,
        clearTimeout,
        TextDecoder,
        TextEncoder,
        scheduler: { yield: () => Promise.resolve() },
    };

    Object.assign(context, globalOverrides);

    context.globalThis = context;

    vm.createContext(context);
    return context;
}

export function runBrowserScriptInContext(relativeFilePath, context) {
    const absolutePath = path.resolve(process.cwd(), relativeFilePath);
    const sourceCode = fs.readFileSync(absolutePath, 'utf8');
    vm.runInContext(sourceCode, context, { filename: absolutePath });
}

export function loadBrowserScripts(relativeFilePaths, options = {}) {
    const context = createBrowserContext(options);
    relativeFilePaths.forEach(relativeFilePath => {
        runBrowserScriptInContext(relativeFilePath, context);
    });
    return context;
}

export function loadBrowserScript(relativeFilePath, options = {}) {
    return loadBrowserScripts([relativeFilePath], options);
}