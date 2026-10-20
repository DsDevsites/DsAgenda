# DS Agenda

SaaS de agendamento e gestão para barbearias e clínicas de estética, desenvolvido pela DS DevSites.

## Objetivo

Construir uma plataforma multiempresa com agenda, clientes, serviços, profissionais e ferramentas administrativas. Os dados de cada estabelecimento devem permanecer isolados.

## Stack planejada

- React + TypeScript + Vite
- Supabase Auth e PostgreSQL com Row Level Security (RLS)
- Cloudflare Pages para a interface
- Cloudflare Workers apenas para APIs/integrações que precisem de lógica no servidor

## Desenvolvimento local

Os comandos exatos serão definidos quando a aplicação for inicializada.

## Segurança

- Nunca comite arquivos `.env` ou credenciais.
- Chaves privadas do Supabase (service_role/secret) não podem ser expostas no navegador.
- Toda tabela com dados de clientes deve ter políticas RLS verificadas.
- Nunca confie apenas em filtros de interface para isolar empresas.

## Fluxo de atualização

1. Desenvolver e testar em uma branch de trabalho.
2. Fazer commit e enviar ao GitHub.
3. Abrir PR para `main`.
4. Conferir o resultado de build/preview.
5. Mesclar após verificar o preview; Cloudflare Pages pode publicar automaticamente a branch de produção.
6. Alterações no banco devem ser versionadas em migrações SQL e aplicadas de forma controlada.

## Status inicial

Repositório inicializado com documentação. A aplicação ainda precisa ser criada e conectada ao projeto Supabase e à Cloudflare.
