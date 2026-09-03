import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Trop strict pour shadcn/ui + utilitaires partagés: on préfère garder l'architecture
      // plutôt que de découper artificiellement les exports.
      'react-refresh/only-export-components': 'off',
      // Les effets déclenchent souvent des chargements async qui mettent à jour l'état.
      // Cette règle est trop agressive dans une app data-driven.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
