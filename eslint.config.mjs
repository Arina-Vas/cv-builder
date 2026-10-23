// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // tsc (noUnusedLocals/Parameters) already reports unused code;
      // ESLint is here for the autofix of dangling imports
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['backend/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      // Nest DI needs constructor parameter classes as runtime values
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  ...[...nextVitals, ...nextTs].map((config) => ({
    ...config,
    files: ['frontend/**/*.{ts,tsx,js,mjs}'],
  })),
  {
    files: ['frontend/**/*.{ts,tsx,js,mjs}'],
    settings: { next: { rootDir: 'frontend/' } },
  }, // must stay last: turns off rules that conflict with Prettier
  storybook.configs['flat/recommended'],
  prettier,
);
