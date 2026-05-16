/** @type {import('eslint').Linter.Config} */
module.exports = {
  // Configurações de Ambiente
  env: {
    es2021: true,
    node: true,
  },

  // Analisador (Parser)
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  // Extensões (Ordem é Crucial: Prettier por último!)
  extends: [
    // Substituindo 'standard'
    'plugin:import/recommended',
    'plugin:n/recommended',
    'plugin:promise/recommended',
    // Sempre por último:
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended', // Regras TypeScript
    // Garante que o Prettier desative as regras conflitantes
    'plugin:prettier/recommended',
    'eslint-config-prettier',
  ],

  // Plugins
  plugins: [
    '@typescript-eslint',
    'simple-import-sort', // Plugin de ordenação
  ],

  // Regras
  rules: {
    // Regra para ordenação de imports
    'simple-import-sort/imports': 'error',
    // Regras de Prettier (REMOVIDAS - As configs serão lidas do seu 'package.json')
  },

  // Configurações de Plugins
  settings: {
    'import/parsers': {
      // Configura o parser TS para arquivos de importação
      [require.resolve('@typescript-eslint/parser')]: ['.ts', '.d.ts'],
    },
  },

  ignorePatterns: ['node_modules'],
}
