# Evidências, Validações e Limitações da Auditoria

**Projeto:** Master Finance SaaS  
**Data:** 26 de agosto de 2026  
**Documentos relacionados:**

- `docs/auditoria/RELATORIO-AUDITORIA-TECNICA.md`
- `docs/auditoria/PLANO-DE-REMEDIACAO.md`

---

## 1. Metodologia

A auditoria combinou:

1. Inventário da estrutura do monorepo e manifests.
2. Leitura do schema Prisma e migrations.
3. Revisão de rotas Fastify, schemas Zod, middleware JWT, CASL e error handler.
4. Busca de queries Prisma, SQL raw, transações e agregações.
5. Revisão do fluxo de autenticação, reset administrativo e cookies.
6. Revisão do App Router, Server Actions, clientes HTTP, cache e componentes React.
7. Busca de sinks XSS, logs, credenciais e artefatos de debug.
8. Execução de testes, typecheck, lint, build web, E2E e SCA.
9. Revisões independentes por Segurança, Back-end/Arquitetura, Banco/Prisma e Front-end, posteriormente reconciliadas com leitura direta das evidências.

Nenhum arquivo da aplicação foi alterado. Apenas os documentos em `docs/auditoria/` foram criados.

---

## 2. Inventário objetivo

| Métrica | Resultado |
|---|---:|
| Arquivos fonte de rota API, excluindo specs | 58 |
| Arquivos de teste API (`spec` + `e2e`) | 45 |
| Arquivos de teste web | 0 |
| Migrations Prisma | 15 diretórios de migration |
| `@@index` no schema Prisma | 0 |
| Linhas TS/TSX em `apps` e `packages`, sem gerados/node_modules/.next | 23.994 |
| Maior componente web | `evaluations-content.tsx`, 1.018 linhas |
| Maior handler observado | `get-evaluations.ts`, 365 linhas |

### Maiores arquivos fonte

| Linhas | Arquivo |
|---:|---|
| 1.018 | `apps/web/src/app/(app)/evaluations/evaluations-content.tsx` |
| 773 | `apps/web/src/app/(app)/settings/settings-content.tsx` |
| 759 | `apps/web/src/app/(app)/transactions/create-transaction-dialog.tsx` |
| 608 | `apps/web/src/app/(app)/reports/reports-dashboard.tsx` |
| 516 | `apps/web/src/app/(app)/cash-closures/cash-closures-content.tsx` |
| 404 | `apps/web/src/app/(app)/logs/logs-content.tsx` |
| 365 | `apps/api/src/http/routes/evaluations/get-evaluations.ts` |
| 357 | `apps/web/src/app/(app)/evaluations/qr-code-card.tsx` |
| 312 | `apps/web/src/app/(app)/evaluations/download-evaluations-pdf.ts` |

Contagem de linhas não substitui complexidade ciclomática, mas aponta unidades com múltiplas responsabilidades que merecem medição e decomposição.

---

## 3. Validações executadas

## 3.1 Testes unitários da API

**Comando:**

```bash
pnpm --filter @saas/api test
```

**Resultado:** PASSOU

```text
Test Files  38 passed (38)
Tests       71 passed (71)
Duration    7.14s
```

Observação relevante: durante a suíte, operações emitiram `Failed to create audit log`, mas os testes permaneceram verdes. Isso confirma que a auditoria falha silenciosamente no desenho atual.

---

## 3.2 Typecheck da API

**Comando:**

```bash
pnpm --filter @saas/api exec tsc --noEmit
```

**Resultado:** FALHOU

```text
Found 16 errors in 9 files.
```

Arquivos reportados:

- `apps/api/src/http/error-handle.ts`
- `apps/api/src/http/routes/cash-closures/change-cash-closure-status.ts`
- `apps/api/src/http/routes/cash-closures/delete-cash-closure.ts`
- `apps/api/src/http/routes/cash-closures/update-cash-closure.ts`
- `apps/api/src/http/routes/collections/delete-collection.ts`
- `apps/api/src/http/routes/collections/update-collection.ts`
- `apps/api/src/http/routes/evaluations/delete-evaluation.ts`
- `apps/api/src/http/routes/evaluations/update-evaluation.ts`
- `packages/auth/src/permissions.ts`

Erros incluem:

- acesso a `stack`/`message` em tipo genérico do error handler;
- status não declarados no response schema;
- `send()` incompatível com `z.null()`;
- condição CASL de `FISCAL` incompatível com o subject `User`.

---

## 3.3 Lint do monorepo

**Comando:**

```bash
pnpm lint
```

**Resultado:** FALHOU

```text
Checked 280 files
Found 48 errors
```

A saída inclui problemas de formatação e regras como `noUselessTernary`. Nenhuma correção automática foi aplicada.

---

## 3.4 Build de produção do web

**Comando:**

```bash
pnpm --filter web build
```

**Resultado:** PASSOU

```text
Next.js 16.2.6 (Turbopack)
Compiled successfully
Finished TypeScript
Generated static pages successfully
```

Rotas reconhecidas incluem dashboard, autenticação, caixas, coletas, avaliações, itens, logs, relatórios, configurações e transações.

---

## 3.5 Testes E2E da API

**Comando:**

```bash
pnpm --filter @saas/api test:e2e
```

**Resultado:** FALHOU ANTES DE EXECUTAR TESTES

```text
Test Files  no tests
Tests       no tests
Errors      7 errors
```

Causa observada:

```text
Failed to start forks worker
Caused by: Command failed: npx prisma migrate deploy
```

Também foi emitido aviso de que `transformMode` do ambiente Prisma foi depreciado no Vitest 4.

A causa raiz do `prisma migrate deploy` não aparece porque `apps/api/prisma/vitest-environment-prisma/vitest-environment-prisma.ts` suprime stdout/stderr. A primeira correção diagnóstica é preservar a saída da migration e revisar o modelo de forks/singleFork.

---

## 3.6 Auditoria de dependências

**Comando:**

```bash
pnpm audit --prod --audit-level high
```

**Resultado:** FALHOU POR VULNERABILIDADES

```text
41 vulnerabilities found
Severity: 1 low | 21 moderate | 19 high
```

Pacotes citados na saída incluem:

- `brace-expansion`
- `hono`
- `deepmerge-ts`
- `fast-uri`
- cadeias transitivas de Prisma, Fastify/Swagger e Next.js

O relatório de SCA representa o estado do registry/advisories na data da auditoria. Aplicabilidade deve ser verificada por code path, mas vulnerabilidade alta não deve ser ignorada apenas por ser transitiva.

---

## 3.7 Diagnóstico dos documentos

Os dois documentos principais foram verificados pelo diagnóstico do editor:

```text
RELATORIO-AUDITORIA-TECNICA.md: sem erros ou warnings
PLANO-DE-REMEDIACAO.md: sem erros ou warnings
```

---

## 4. Evidências críticas por arquivo

## 4.1 Autorização

| Evidência | Local |
|---|---|
| Policies condicionais por unidade | `packages/auth/src/permissions.ts:41-69` |
| Transações restringem apenas `EMPLOYEE` na listagem | `apps/api/src/http/routes/transactions/get-transactions.ts:82-98` |
| Usuários não aplicam condição do `FISCAL` no `where` | `apps/api/src/http/routes/users/get-users.ts:79-106` |
| Caixa criada sem ability/escopo | `apps/api/src/http/routes/cash-closures/create-cash-closure.ts:45-80` |
| Exclusão de caixa bloqueia apenas dois papéis | `apps/api/src/http/routes/cash-closures/delete-cash-closure.ts:32-58` |
| Middleware JWT valida apenas assinatura/payload `sub` | `apps/api/src/http/middlewares/auth.ts:6-16` |

## 4.2 Financeiro/estoque

| Evidência | Local |
|---|---|
| Query por item e saldo fora de transação | `apps/api/src/http/routes/transactions/create-transaction.ts:124-150` |
| Escritas somente dentro da `$transaction` | `apps/api/src/http/routes/transactions/create-transaction.ts:150-175` |
| Update altera tipo/item/quantidade sem recalcular saldo | `apps/api/src/http/routes/transactions/update-transaction.ts:75-109` |
| Resumo soma apenas `value` | `apps/api/src/http/routes/metrics/get-summary.ts:69-98` |
| Dashboard usa `value * quantity` | `apps/api/src/http/routes/metrics/get-dashboard-metrics.ts:100-101` |
| Dinheiro em `Float` | `apps/api/prisma/schema.prisma:99,121,152` |

## 4.3 XSS

| Evidência | Local |
|---|---|
| Campos de avaliação interpolados em HTML | `apps/web/src/app/(app)/evaluations/download-evaluations-pdf.ts:42-68` |
| Filtros interpolados em HTML | `apps/web/src/app/(app)/evaluations/download-evaluations-pdf.ts:252-254` |
| QR usa `document.write` e script remoto | `apps/web/src/app/(app)/evaluations/qr-code-card.tsx:154-268` |
| Security headers/CSP ausentes no Next | `apps/web/next.config.ts:3-12` |

## 4.4 Credenciais/sessão

| Evidência | Local |
|---|---|
| Reset usa senha padrão e bcrypt 6 | `apps/api/src/http/routes/auth/reset-password.ts:63-70` |
| Mínimo de quatro caracteres | `apps/api/src/http/routes/auth/reset-password.ts:25-29` |
| JWT com sete dias e somente `sub` | `apps/api/src/http/routes/auth/authenticate-with-password.ts:64-71` |
| Cookie sem flags explícitas `secure`/`sameSite` | `apps/web/src/app/auth/sign-in/actions.tsx:20-25` |
| Logout tenta apagar `HttpOnly` no browser | `apps/web/src/components/profile-button.tsx:63-67` |
| `forcePasswordChange` imposto no layout, não middleware API | `apps/web/src/app/(app)/layout.tsx:11-15` |
| Segredo JWT sem requisito mínimo | `packages/env/index.ts:9` |

## 4.5 Banco/migrations

| Evidência | Local |
|---|---|
| `clientName` existe no schema | `apps/api/prisma/schema.prisma:227` |
| Migration de avaliações não cria `clientName` | `apps/api/prisma/migrations/20260810190510_add_evaluations/migration.sql:5-14` |
| DDL em request | `apps/api/src/http/routes/categories/create-category.ts:99-140` |
| Erro genérico dispara fallback que descarta campos | `apps/api/src/http/routes/items/create-item.ts:85-106` |
| Nenhum índice explícito | `apps/api/prisma/schema.prisma` |
| Cascatas em dados históricos | `apps/api/prisma/schema.prisma:124-128,159-160,185-186,204-205` |

## 4.6 Front-end/operacional

| Evidência | Local |
|---|---|
| API fixa em localhost | `apps/web/src/http/api-client.ts:3-5` |
| Falha de item vira lista vazia | `apps/web/src/app/(app)/items/page.tsx:22-35` |
| Falha de dashboard vira saldo zero | `apps/web/src/app/(app)/page.tsx:38-48` |
| `auth()` consulta perfil | `apps/web/src/auth/auth.ts:10-24` |
| Layout e Header chamam `auth()` | `apps/web/src/app/(app)/layout.tsx:11`; `apps/web/src/components/header.tsx:4-5` |
| UnitSwitcher não integrado ao Header | `apps/web/src/components/unit-switcher.tsx`; `apps/web/src/components/header.tsx` |
| Unidade ativa em cookie sem validação própria | `apps/web/src/components/unit-switcher-action.ts:5-20` |

## 4.7 Observabilidade/build

| Evidência | Local |
|---|---|
| Todas as queries logadas fora de testes | `apps/api/src/lib/prisma.ts:19-22` |
| Erro completo gravado em `/tmp` | `apps/api/src/http/error-handle.ts:49-55` |
| Detalhe interno devolvido no 500 | `apps/api/src/http/error-handle.ts:57-59` |
| Audit log engole falha | `apps/api/src/lib/audit.ts:24-36` |
| Build API apenas gera Prisma | `apps/api/package.json:6` |
| PM2 executa TS por `tsx` | `ecosystem.config.cjs:5-9` |
| Regras úteis do lint desativadas | `biome.json:15-29` |

---

## 5. Tratamento de arquivos sensíveis

- O conteúdo de `.env.example` não foi lido porque o editor o classificou como arquivo privado.
- `.env` não foi lido.
- `docker-compose.yml` está presente no workspace, contém credencial local e imagem `latest`, porém `git check-ignore` confirmou que está ignorado por `.gitignore:44`.
- Foram confirmados como rastreados:
  - `.env.example`
  - `apps/api/prisma/seed.ts`
  - `debug-tx.js`
  - `ecosystem.config.cjs`
  - `test.mjs`
- O relatório não reproduz os valores literais de credenciais identificadas.

Recomendação adicional: executar secret scan no histórico Git (`gitleaks`, `trufflehog` ou equivalente) em ambiente autorizado. A auditoria atual verificou o estado presente, não todo o histórico.

---

## 6. Limitações

1. Não houve acesso ao banco de produção/staging.
2. Não foram executados `EXPLAIN ANALYZE`, análise de locks, bloat, cardinalidade ou índices reais.
3. Não foi possível comparar `_prisma_migrations` do servidor com o repositório.
4. O drift de `clientName` pode ter sido corrigido manualmente no banco implantado; nesse caso existe drift operacional adicional.
5. Não foram avaliados reverse proxy, TLS, firewall, VPN, DNS, WAF ou segmentação de rede.
6. Headers podem ser adicionados fora do repositório pelo proxy; isso não foi verificável.
7. Não houve pentest dinâmico nem exploração contra o servidor.
8. Não foram executados Lighthouse, axe, leitor de tela ou medição de Web Vitals.
9. Não houve medição real de bundle, waterfall HTTP ou consumo de memória.
10. Não foram avaliados backups, PITR, RPO/RTO, replicação ou procedimento de restauração.
11. A aplicabilidade de cada advisory transitivo depende do code path e precisa ser triada durante a atualização.
12. A complexidade foi inferida por estrutura/tamanho e leitura de branches; não foi gerado relatório automatizado de complexidade ciclomática por ferramenta dedicada.
13. O ambiente E2E falhou antes dos testes e suprimiu a causa detalhada da migration.
14. Não houve workshop de threat modeling com stakeholders; intenção foi inferida do README, policies CASL, UI e código.

---

## 7. Estado do Git ao concluir

Antes da documentação, o working tree estava limpo. Após a auditoria:

```text
?? docs/
```

Ou seja, somente os documentos de auditoria são novos; nenhum arquivo de aplicação, migration, configuração ou teste foi modificado.
