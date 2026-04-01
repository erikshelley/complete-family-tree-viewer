import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            include: ['src/js/**/*.js'],
            exclude: ['src/js/ui_declarations.js'],
            reporter: ['text', 'html'],
            reportsDirectory: 'coverage',
        },
    },
});
