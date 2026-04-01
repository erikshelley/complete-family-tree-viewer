import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

const workspaceRoot = '/home/erik/dev/complete-family-tree';
const htmlPath = resolve(workspaceRoot, 'index.html');
const cssPath = resolve(workspaceRoot, 'src/css/style.css');

describe('ui styles', () => {
    it('15.01 all checkbox labels use the pointer cursor', () => {
        const html = readFileSync(htmlPath, 'utf8');
        const css = readFileSync(cssPath, 'utf8');
        const dom = new JSDOM(html);
        const style = dom.window.document.createElement('style');
        style.textContent = css;
        dom.window.document.head.appendChild(style);

        const checkboxes = Array.from(dom.window.document.querySelectorAll('input[type="checkbox"]'));
        expect(checkboxes.length).toBeGreaterThan(0);

        checkboxes.forEach(checkbox => {
            const label = dom.window.document.querySelector(`label[for="${checkbox.id}"]`);
            expect(label, `missing label for checkbox ${checkbox.id}`).not.toBeNull();
            expect(dom.window.getComputedStyle(label).cursor, `checkbox label ${checkbox.id} should show pointer cursor`).toBe('pointer');
        });
    });

    it('15.02 all radio button inputs and their labels use the pointer cursor', () => {
        const html = readFileSync(htmlPath, 'utf8');
        const css = readFileSync(cssPath, 'utf8');
        const dom = new JSDOM(html);
        const style = dom.window.document.createElement('style');
        style.textContent = css;
        dom.window.document.head.appendChild(style);

        const radios = Array.from(dom.window.document.querySelectorAll('input[type="radio"]'));
        expect(radios.length).toBeGreaterThan(0);

        radios.forEach(radio => {
            expect(dom.window.getComputedStyle(radio).cursor, `radio input ${radio.id} should show pointer cursor`).toBe('pointer');
            const label = dom.window.document.querySelector(`label[for="${radio.id}"]`);
            expect(label, `missing label for radio ${radio.id}`).not.toBeNull();
            expect(dom.window.getComputedStyle(label).cursor, `radio label ${radio.id} should show pointer cursor`).toBe('pointer');
        });
    });
});
