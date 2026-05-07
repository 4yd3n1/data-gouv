import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "react/jsx-no-comment-textnodes": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "build/**",
      "coverage/**",
      "design-ref/**",
      "documentation/HATVP-data/**",
      "node_modules/**",
      "out/**",
      "documentation/HATVP-PDF/**",
    ],
  },
];

export default config;
