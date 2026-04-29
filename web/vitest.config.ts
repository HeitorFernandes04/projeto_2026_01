import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';

function inlineAngularComponentResources() {
  return {
    name: 'inline-angular-component-resources',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.endsWith('.component.ts')) {
        return null;
      }

      const componentDir = dirname(id);
      let transformed = code.replace(
        /templateUrl:\s*['"](.+?\.html)['"]/g,
        (_match, templatePath: string) => {
          const template = readFileSync(resolvePath(componentDir, templatePath), 'utf8');
          return `template: ${JSON.stringify(template)}`;
        },
      );

      transformed = transformed.replace(
        /styleUrl:\s*['"](.+?\.(?:scss|css))['"]/g,
        "styles: ['']",
      );

      return transformed === code ? null : { code: transformed, map: null };
    },
  };
}

export default defineConfig({
  plugins: [inlineAngularComponentResources()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
