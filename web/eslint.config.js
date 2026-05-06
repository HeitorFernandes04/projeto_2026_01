// @ts-check
const angularEslint = require('@angular-eslint/eslint-plugin');
const angularEslintTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['tsconfig.app.json', 'tsconfig.spec.json'],
      },
    },
    plugins: {
      '@angular-eslint': angularEslint,
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs['recommended'].rules,
      ...angularEslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
    },
  },
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularEslintTemplate,
    },
    rules: {
      ...angularEslintTemplate.configs.recommended.rules,
    },
  },
];
