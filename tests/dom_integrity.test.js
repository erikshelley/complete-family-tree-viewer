import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

function parseIndexHtml() {
    const html = fs.readFileSync('index.html', 'utf-8');
    return new JSDOM(html).window.document;
}

// Extract all IDs passed to document.getElementById() in ui_declarations.js
function extractGetElementByIdIds() {
    const src = fs.readFileSync('src/js/ui_declarations.js', 'utf-8');
    const ids = [];
    const re = /getElementById\('([^']+)'\)/g;
    let m;
    while ((m = re.exec(src)) !== null) ids.push(m[1]);
    return ids;
}

// Extract all { id: '...' } entries from the elements, none_links, and auto_links arrays
function extractArrayIds() {
    const src = fs.readFileSync('src/js/ui_declarations.js', 'utf-8');
    const ids = [];
    const re = /\{\s*id:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(src)) !== null) ids.push(m[1]);
    return ids;
}

describe('index.html DOM integrity', () => {
    it('17.01 every getElementById target in ui_declarations.js resolves to an element', () => {
        const doc = parseIndexHtml();
        const ids = extractGetElementByIdIds();
        const missing = ids.filter(id => !doc.getElementById(id));
        expect(missing).toEqual([]);
    });

    it('17.02 every id in the elements, none_links, and auto_links arrays exists in index.html', () => {
        const doc = parseIndexHtml();
        const ids = extractArrayIds();
        const missing = ids.filter(id => !doc.getElementById(id));
        expect(missing).toEqual([]);
    });
});
