# Migrações Supabase

Guarde migrações SQL numeradas por timestamp, por exemplo `20261020190000_initial_schema.sql`.

O esquema multiempresa ainda precisa ser criado. Cada tabela com dados do negócio deve habilitar RLS e validar acesso por organização. Não execute migrações destrutivas em produção sem revisão e backup.