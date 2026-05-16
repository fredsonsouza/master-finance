/** @type {import('eslint').Linter.Config} */
module.exports = {
  // Estende a configuração base (React, TS, Prettier, etc.)
  extends: [
    './base.js',
    // Opcional: Para regras específicas do Next.js. Exige 'eslint-config-next'
    // 'next/core-web-vitals'
  ],
  plugins: ['simple-import-sort'],

  // Regras específicas do Next.js (Se houver)
  rules: {
    'simple-import-sort/import': 'error',
    // Você pode sobrescrever regras aqui
    // Exemplo: desativar uma regra do base.js para o Next
    // 'react/self-closing-comp': 'off',
  },
}
