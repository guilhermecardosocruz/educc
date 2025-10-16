/** ESLint brando para permitir build/dev sem travar */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "eslint:recommended"],
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  rules: {
    // Tipos
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    // Preferências
    "prefer-const": "warn",
    // React
    "react/no-unescaped-entities": "off",
    // Hooks
    "react-hooks/exhaustive-deps": "warn",
  },
};
