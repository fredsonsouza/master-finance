/** @type {import('eslint').Linter.Config} */
module.exports = {
  // Configurações de Ambiente
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },

  // Analisador (Parser)
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  // Extensões (Ordem é Crucial: Prettier por último!)
  extends: [
    'standard', // Regras básicas JavaScript
    'plugin:@typescript-eslint/recommended', // Regras TypeScript
    'plugin:react/recommended', // Regras React
    'plugin:react-hooks/recommended', // Regras Hooks
    'plugin:jsx-a11y/recommended', // Regras Acessibilidade
    // Garante que o Prettier desative as regras conflitantes
    'plugin:prettier/recommended',
    'eslint-config-prettier', // Desativa regras conflitantes (redundante, mas seguro com 'plugin:prettier/recommended')
  ],

  // Plugins
  plugins: [
    'react',
    'jsx-a11y',
    '@typescript-eslint',
    'simple-import-sort', // Plugin de ordenação
  ],

  // Regras
  rules: {
    // Regra para ordenação de imports
    'simple-import-sort/imports': 'error',
    // Regras de React
    'react/self-closing-comp': ['error', { component: true, html: true }],
    'react/react-in-jsx-scope': 'off', // Necessário para React 17+ (Nova arquitetura)
    'react/prop-types': 'off', // Desativado pois usamos TypeScript
    'react/no-unknown-property': 'error',

    // Regras de Prettier (REMOVIDAS - As configs serão lidas do seu 'package.json')
    // Se você quiser regras específicas aqui, descomente e adicione-as:
    // 'prettier/prettier': ["error", { ...configurações... }],
  },

  // Configurações de Plugins
  settings: {
    react: {
      version: 'detect', // Detecta automaticamente a versão do React
    },
    'import/parsers': {
      // Configura o parser TS para arquivos de importação
      [require.resolve('@typescript-eslint/parser')]: ['.ts', '.tsx', '.d.ts'],
    },
  },

  ignorePatterns: [
    'node_modules',
    // Adicione outras pastas que devem ser ignoradas
  ],
}
