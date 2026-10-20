# DS Agenda

SaaS de agendamento e gestão para barbearias e clínicas de estética, desenvolvido pela DS DevSites.

## Estado atual

O repositório contém a primeira interface navegável do painel. Os agendamentos são demonstrativos e ficam apenas na memória da página. Autenticação, cadastros persistentes e cobrança ainda não estão implementados.

## Stack

- React + TypeScript + Vite
- Supabase JS para autenticação e persistência (próxima etapa)
- Cloudflare Pages para a interface
- Cloudflare Workers opcional para APIs e integrações protegidas

## Execução local

Use Node.js 22 ou 24 e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

No PowerShell: `Copy-Item .env.example .env.local`. Sem as variáveis do Supabase, o painel abre em modo demonstração.

```bash
npm run build
npm run preview
```

## Supabase

1. Crie um projeto.
2. Em Project Settings → API, copie Project URL e publishable key (ou chave legada anon).
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local`.
4. Nunca exponha service_role/secret no navegador ou no GitHub.
5. Antes de usar dados reais, precisamos criar migrações, RLS, autenticação e operações de leitura/gravação.

## Cloudflare Pages com GitHub

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
2. Selecione `DsDevsites/DsAgenda`.
3. Framework Vite, branch `main`, build `npm run build`, diretório `dist`.
4. Em Environment variables, configure as duas variáveis `VITE_*` para Production e Preview.
5. Faça o deploy inicial. Push em `main` dispara build; branches podem gerar previews conforme as configurações.
6. Confira logs de build se falhar.

Variáveis `VITE_*` entram no bundle público. Só use valores publicáveis; nunca coloque segredos nessas variáveis.

## Fluxo seguro de atualização

Crie uma branch por funcionalidade; rode `npm run build`; faça commit/push; abra PR e teste o preview; só então mescle na `main`. Versione alterações de banco em migrações SQL no diretório `supabase/migrations`. Não remova tabelas ou migrações já usadas em produção sem plano de migração e backup.

## Segurança multiempresa

Todos os registros comerciais devem estar vinculados a um estabelecimento. Ative RLS nas tabelas privadas e valide acesso por organização. Filtros na interface não são controle de acesso. Privilégios administrativos devem ser validados do lado seguro.

## Próximas etapas

1. Esquema multiempresa: organizações, membros, clientes, profissionais, serviços e agendamentos.
2. Auth e criação inicial do estabelecimento.
3. CRUD Supabase + RLS, incluindo teste de isolamento entre duas contas.
4. Persistência dos agendamentos e cadastros.
5. Financeiro, pacotes, lembretes e assinatura depois de assegurar a base.