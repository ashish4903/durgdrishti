import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Several components reset state at the start of an effect. That works, but this newer rule
      // reports it as an error; keep it visible as a warning until those effects are revisited.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // The serverless function, the Vite config and the unit tests run in Node.
    files: ['api/**/*.js', 'vite.config.js', '**/*.test.js'],
    languageOptions: { globals: globals.node },
  },
]);
