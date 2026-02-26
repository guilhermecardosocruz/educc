import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Converte os presets clássicos do Next
const baseConfigs = compat.extends("next/core-web-vitals", "next/typescript");

export default [
  // 1) Ignorar tudo que não faz sentido lintrar
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "backups/**",
      "public/**",      // ignora sw.js, workbox-*.js, fallback-*.js etc
      "scripts/**",     // se quiser lintrar scripts depois, a gente tira
    ],
  },

  // 2) Config base do Next + TS
  ...baseConfigs,

  // 3) Regras "brandas" pro teu fluxo
  {
    rules: {
      // Tipos
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Preferências
      "prefer-const": "warn",

      // React
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",

      // Next
      "@next/next/no-img-element": "off",

      // SW / bundles gerados (caso escapem do ignore por algum motivo)
      "no-unused-expressions": "off",

      // Flat config reclamando de default anônimo
      "import/no-anonymous-default-export": "off",
    },
  },
];
