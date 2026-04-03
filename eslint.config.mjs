import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-plugin-prettier/recommended";
import jest from "eslint-plugin-jest";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["tests/**/*.js", "**/*.test.js", "**/*.spec.js"],
    ...jest.configs["flat/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
]);
