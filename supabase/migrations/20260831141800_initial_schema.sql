-- ============================================================
-- e-PPGFIL - Schema inicial para Supabase PostgreSQL
-- Autenticacao propria no schema public. Nao usa Supabase Auth.
-- PDFs ficam no Cloudflare R2; aqui ficam apenas metadados.
-- ============================================================

BEGIN;

-- ---------- Extensoes ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------- Tipos ----------
DO $$ BEGIN
  CREATE TYPE public.protocol_status AS ENUM (
    'Gerado',
    'Em tramitação',
    'Com exigência',
    'Deferido',
    'Indeferido'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.history_origin AS ENUM ('sistema', 'secretaria', 'solicitante');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.audit_category AS ENUM ('protocolo', 'autenticacao', 'sistema', 'documento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_status AS ENUM ('pending_upload', 'available', 'quarantined', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_access_level AS ENUM ('owner', 'read', 'download', 'manage');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- Funcoes utilitarias ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.unaccent_fallback(input text)
RETURNS text AS $$
  SELECT translate(
    input,
    'áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
  );
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text AS $$
  SELECT regexp_replace(
    regexp_replace(
      lower(public.unaccent_fallback(coalesce(input, ''))),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    '(^-|-$)',
    '',
    'g'
  );
$$ LANGUAGE sql IMMUTABLE;

-- ============================================================
-- 1. Usuarios e autenticacao propria
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(50) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  user_agent text,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_valid
  ON public.user_sessions(user_id, expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_valid
  ON public.password_reset_tokens(user_id, expires_at)
  WHERE used_at IS NULL;

-- ============================================================
-- 2. Cadastros: categorias, tipos e documentos exigidos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.request_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(140) NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_request_categories_updated_at ON public.request_categories;
CREATE TRIGGER trg_request_categories_updated_at
BEFORE UPDATE ON public.request_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.request_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.request_categories(id) ON DELETE CASCADE,
  slug varchar(120) NOT NULL,
  name varchar(180) NOT NULL,
  description text,
  sla_business_days integer CHECK (sla_business_days IS NULL OR sla_business_days BETWEEN 1 AND 365),
  deadline_description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

DROP TRIGGER IF EXISTS trg_request_types_updated_at ON public.request_types;
CREATE TRIGGER trg_request_types_updated_at
BEFORE UPDATE ON public.request_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.required_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type_id uuid NOT NULL REFERENCES public.request_types(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  description text,
  is_required boolean NOT NULL DEFAULT true,
  accepted_formats text[] NOT NULL DEFAULT ARRAY['pdf'],
  max_size_mb integer NOT NULL DEFAULT 10 CHECK (max_size_mb BETWEEN 1 AND 100),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_types_category_id ON public.request_types(category_id);
CREATE INDEX IF NOT EXISTS idx_required_documents_request_type_id ON public.required_documents(request_type_id);

-- ============================================================
-- 3. Protocolos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.requesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf char(11) NOT NULL UNIQUE CHECK (cpf ~ '^[0-9]{11}$'),
  full_name varchar(180) NOT NULL,
  email citext NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_requesters_updated_at ON public.requesters;
CREATE TRIGGER trg_requesters_updated_at
BEFORE UPDATE ON public.requesters
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.protocol_sequences (
  year integer PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.next_protocol_number(target_year integer DEFAULT EXTRACT(YEAR FROM now())::integer)
RETURNS varchar AS $$
DECLARE
  next_seq integer;
BEGIN
  INSERT INTO public.protocol_sequences(year, last_number)
  VALUES (target_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET
    last_number = public.protocol_sequences.last_number + 1,
    updated_at = now()
  RETURNING last_number INTO next_seq;

  RETURN 'PPGFIL-' || lpad(next_seq::text, 6, '0') || '/' || target_year::text;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number varchar(32) NOT NULL UNIQUE DEFAULT public.next_protocol_number(),
  requester_id uuid NOT NULL REFERENCES public.requesters(id) ON DELETE RESTRICT,
  category_id uuid REFERENCES public.request_categories(id) ON DELETE SET NULL,
  request_type_id uuid REFERENCES public.request_types(id) ON DELETE SET NULL,
  category_name_snapshot varchar(140) NOT NULL,
  request_type_name_snapshot varchar(180) NOT NULL,
  summary text,
  status public.protocol_status NOT NULL DEFAULT 'Gerado',
  requirement_substage varchar(40) CHECK (requirement_substage IS NULL OR requirement_substage = 'respondida'),
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  archived_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_protocols_updated_at ON public.protocols;
CREATE TRIGGER trg_protocols_updated_at
BEFORE UPDATE ON public.protocols
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.protocol_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  author_name varchar(180) NOT NULL,
  origin public.history_origin NOT NULL,
  status public.protocol_status NOT NULL,
  message text NOT NULL,
  visible_to_requester boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  author_name varchar(180) NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocols_number ON public.protocols(number);
CREATE INDEX IF NOT EXISTS idx_protocols_requester_id ON public.protocols(requester_id);
CREATE INDEX IF NOT EXISTS idx_protocols_status_created_at ON public.protocols(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_protocols_assigned_to ON public.protocols(assigned_to);
CREATE INDEX IF NOT EXISTS idx_protocols_archived ON public.protocols(archived, archived_at);
CREATE INDEX IF NOT EXISTS idx_protocol_history_protocol_id_created_at
  ON public.protocol_history(protocol_id, created_at);
CREATE INDEX IF NOT EXISTS idx_internal_notes_protocol_id_created_at
  ON public.internal_notes(protocol_id, created_at);

-- ============================================================
-- 4. PDFs e anexos: metadados Cloudflare R2
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid REFERENCES public.protocols(id) ON DELETE CASCADE,
  protocol_history_id uuid REFERENCES public.protocol_history(id) ON DELETE SET NULL,
  required_document_id uuid REFERENCES public.required_documents(id) ON DELETE SET NULL,
  owner_requester_id uuid REFERENCES public.requesters(id) ON DELETE SET NULL,
  uploaded_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  r2_bucket varchar(120) NOT NULL,
  r2_key text NOT NULL,
  original_filename varchar(255) NOT NULL,
  mime_type varchar(120) NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 char(64),
  status public.document_status NOT NULL DEFAULT 'available',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (r2_bucket, r2_key)
);

DROP TRIGGER IF EXISTS trg_document_files_updated_at ON public.document_files;
CREATE TRIGGER trg_document_files_updated_at
BEFORE UPDATE ON public.document_files
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.document_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_file_id uuid NOT NULL REFERENCES public.document_files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  requester_id uuid REFERENCES public.requesters(id) ON DELETE CASCADE,
  access_level public.document_access_level NOT NULL DEFAULT 'read',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR requester_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_file_id uuid NOT NULL REFERENCES public.document_files(id) ON DELETE CASCADE,
  protocol_id uuid REFERENCES public.protocols(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  requester_id uuid REFERENCES public.requesters(id) ON DELETE SET NULL,
  action varchar(40) NOT NULL CHECK (action IN ('view', 'download', 'signed_url')),
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_files_protocol_id ON public.document_files(protocol_id);
CREATE INDEX IF NOT EXISTS idx_document_files_owner_requester_id ON public.document_files(owner_requester_id);
CREATE INDEX IF NOT EXISTS idx_document_files_created_at ON public.document_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_grants_file_id ON public.document_access_grants(document_file_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_file_created_at
  ON public.document_access_logs(document_file_id, created_at DESC);

-- ============================================================
-- 5. Dados institucionais do e-PPGFIL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.research_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(180) NOT NULL UNIQUE,
  summary text,
  disciplines text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_research_lines_updated_at ON public.research_lines;
CREATE TRIGGER trg_research_lines_updated_at
BEFORE UPDATE ON public.research_lines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.faculty_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(180) NOT NULL UNIQUE,
  position varchar(80) NOT NULL,
  expertise text,
  highest_degree text,
  lattes_url text,
  profile_url text,
  advising_count integer CHECK (advising_count IS NULL OR advising_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_faculty_members_updated_at ON public.faculty_members;
CREATE TRIGGER trg_faculty_members_updated_at
BEFORE UPDATE ON public.faculty_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.faculty_research_lines (
  faculty_member_id uuid NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
  research_line_id uuid NOT NULL REFERENCES public.research_lines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (faculty_member_id, research_line_id)
);

CREATE TABLE IF NOT EXISTS public.institutional_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(220) NOT NULL UNIQUE,
  file_type varchar(20) NOT NULL,
  source_url text,
  document_file_id uuid REFERENCES public.document_files(id) ON DELETE SET NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_institutional_forms_updated_at ON public.institutional_forms;
CREATE TRIGGER trg_institutional_forms_updated_at
BEFORE UPDATE ON public.institutional_forms
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(220) NOT NULL UNIQUE,
  deadline_text text,
  steps text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_procedures_updated_at ON public.procedures;
CREATE TRIGGER trg_procedures_updated_at
BEFORE UPDATE ON public.procedures
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. Auditoria
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_requester_id uuid REFERENCES public.requesters(id) ON DELETE SET NULL,
  actor_label varchar(180) NOT NULL,
  category public.audit_category NOT NULL,
  action varchar(120) NOT NULL,
  protocol_id uuid REFERENCES public.protocols(id) ON DELETE SET NULL,
  protocol_number varchar(32),
  document_file_id uuid REFERENCES public.document_files(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category_created_at ON public.audit_logs(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_protocol_id ON public.audit_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);

-- ============================================================
-- 7. Seeds iniciais
-- ============================================================

INSERT INTO public.roles (slug, name, description) VALUES
  ('admin', 'Administrador', 'Acesso completo ao sistema.'),
  ('secretaria', 'Secretaria', 'Gestao de protocolos e documentos.'),
  ('coordenacao', 'Coordenacao', 'Acompanhamento e decisoes administrativas.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.request_categories (slug, name, description, sort_order) VALUES
  ('docente', 'Docente', 'Docentes do Programa de Pos-Graduacao em Filosofia.', 10),
  ('discente', 'Discente', 'Alunos regularmente matriculados no Mestrado ou Doutorado em Filosofia.', 20),
  ('egresso', 'Egresso / Ex-Aluno', 'Egressos dos cursos de Mestrado e Doutorado do PPGFIL.', 30),
  ('externo', 'Aluno externo / Disciplina isolada', 'Interessados em disciplinas como aluno externo ou em regime de disciplina isolada.', 40)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.request_types (category_id, slug, name, description, deadline_description, sort_order)
SELECT c.id, v.slug, v.name, v.description, v.deadline_description, v.sort_order
FROM public.request_categories c
JOIN (VALUES
  ('docente', 'solicitacao-auxilio', 'Solicitação de Auxílio', 'Pedido associado ao formulário oficial de Solicitação de Auxílio.', 'Prazo não especificado no regimento/manual', 10),
  ('docente', 'homologacao-banca', 'Requerimento de homologação de banca', 'Submissão do formulário oficial para análise e homologação de banca.', 'Prazo administrativo não especificado no regimento/manual', 20),
  ('docente', 'pedido-prorrogacao', 'Pedido de prorrogação', 'Pedido associado ao formulário oficial de prorrogação.', 'Prazo de solicitação não especificado no regimento/manual', 30),
  ('discente', 'matricula-mestrado', 'Matrícula - Mestrado', 'Envio do formulário oficial de matrícula do Mestrado.', 'Conforme o calendário acadêmico do período', 10),
  ('discente', 'inscricao-disciplinas-mestrado', 'Inscrição em disciplina - Mestrado', 'Inscrição semestral por meio do formulário oficial.', 'Conforme o calendário acadêmico do período', 20),
  ('discente', 'alteracao-disciplinas-mestrado', 'Alteração de inscrição em disciplina', 'Cancelamento, troca ou inclusão de disciplina.', 'Durante as quatro primeiras semanas de aula', 30),
  ('discente', 'aproveitamento-creditos-mestrado', 'Aproveitamento de créditos', 'Pedido de validação de créditos cursados em programa reconhecido.', 'Prazo de solicitação não especificado no regimento/manual', 40),
  ('discente', 'estagio-docente-mestrado', 'Estágio docente - Mestrado', 'Registro do estágio docente de 15 horas em um semestre.', 'Período de envio não especificado no regimento/manual', 50),
  ('discente', 'prorrogacao-conclusao-mestrado', 'Prorrogação de prazo de conclusão do curso', 'Requerimento oficial de prorrogação do prazo de conclusão.', 'Prazo de solicitação não especificado no regimento/manual', 60),
  ('discente', 'requerimento-diploma-mestrado', 'Requerimento de diploma - Mestrado', 'Envio do formulário oficial de requerimento de diploma do Mestrado.', 'Prazo não especificado no regimento/manual', 70),
  ('discente', 'matricula-doutorado', 'Matrícula - Doutorado', 'Envio do formulário oficial de matrícula do Doutorado.', 'Conforme o calendário acadêmico do período', 80),
  ('discente', 'inscricao-disciplinas-doutorado', 'Inscrição em disciplina - Doutorado', 'Inscrição semestral por meio do formulário oficial.', 'Conforme o calendário acadêmico do período', 90),
  ('discente', 'alteracao-disciplinas-doutorado', 'Alteração de inscrição em disciplina', 'Cancelamento, troca ou inclusão de disciplina.', 'Durante as quatro primeiras semanas de aula', 100),
  ('discente', 'aproveitamento-creditos-doutorado', 'Aproveitamento de créditos', 'Pedido de validação de créditos cursados em programa reconhecido.', 'Prazo de solicitação não especificado no regimento/manual', 110),
  ('discente', 'estagio-docente-doutorado', 'Estágio docente - Doutorado', 'Registro do estágio docente de 30 horas em dois semestres.', 'Período de envio não especificado no regimento/manual', 120),
  ('discente', 'prorrogacao-conclusao-doutorado', 'Prorrogação de prazo de conclusão do curso', 'Requerimento oficial de prorrogação do prazo de conclusão.', 'Prazo de solicitação não especificado no regimento/manual', 130),
  ('discente', 'homologacao-banca-doutorado', 'Requerimento de homologação de banca', 'Submissão do formulário oficial para análise e homologação de banca.', 'Prazo administrativo não especificado no regimento/manual', 140),
  ('discente', 'requerimento-diploma-doutorado', 'Requerimento de diploma - Doutorado', 'Envio do formulário oficial de requerimento de diploma do Doutorado.', 'Prazo não especificado no regimento/manual', 150),
  ('egresso', 'requerimento-diploma-egresso', 'Requerimento de diploma', 'Envio do formulário oficial de requerimento de diploma.', 'Prazo não especificado no regimento/manual', 10),
  ('externo', 'inscricao-aluno-externo', 'Inscrição de aluno externo', 'Inscrição por meio do formulário oficial destinado a aluno externo.', 'Conforme o calendário acadêmico do período', 10),
  ('externo', 'inscricao-disciplina-isolada', 'Inscrição em disciplina isolada', 'Inscrição por meio do formulário oficial de disciplina isolada.', 'Conforme o calendário acadêmico do período', 20)
) AS v(category_slug, slug, name, description, deadline_description, sort_order)
  ON c.slug = v.category_slug
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.research_lines (title, summary, disciplines, source_url) VALUES
  ('Estética e Filosofia da Arte', 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', ARRAY['Tópicos de Estética', 'Estética I', 'Estética II', 'Questões de Estética'], 'https://ppgfil.uerj.br/cópia-formulários'),
  ('Ética e Filosofia Política', 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', ARRAY['Tópicos de Ética', 'Filosofia Política I'], 'https://ppgfil.uerj.br/cópia-formulários'),
  ('Metafísica e Filosofia da Natureza', 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', ARRAY['Metafísica I', 'Tópicos de Filosofia da Natureza', 'Filosofia da Natureza II', 'Tópicos Especiais de Metafísica'], 'https://ppgfil.uerj.br/cópia-formulários'),
  ('Teoria do Conhecimento e Filosofia das Ciências', 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', ARRAY['Questões de Teoria do Conhecimento'], 'https://ppgfil.uerj.br/cópia-formulários')
ON CONFLICT (title) DO NOTHING;

INSERT INTO public.institutional_forms (name, file_type, source_url, is_available) VALUES
  ('Formulário de Solicitação de Auxílio', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/50de38_7efe70be390b485db701caa5a715cfa9.pdf', true),
  ('Formulário de Requerimento de homologação de banca', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/50de38_365539fadc80439cbc4e77679c3349a9.pdf', true),
  ('Formulário de Requerimento de diploma', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/50de38_278f6792584e464685882e0ebd3102aa.pdf', true),
  ('Formulário de Alteração de Disciplinas', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/50de38_0a559a61fa724dbc9c98cc81447dfa67.pdf', true),
  ('Formulário de Pedido de prorrogação', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/50de38_bd2b04526bb745af8c236622525322af.pdf', true),
  ('Formulário de Aproveitamento de créditos', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/50de38_56c02fdeabb647c695e69736ecd16051.pdf', true),
  ('Formulário de estágio docente - Mestrado', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/756bb3_0f8f5233c74447bb83835b2ddaffa7dd.pdf', true),
  ('Formulário de estágio docente - Doutorado', 'PDF', NULL, false),
  ('Requerimento de prorrogação de prazo de conclusão do curso', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/756bb3_e9a9d6af012e42b88d2eda0132489de9.pdf', true),
  ('Inscrição em disciplina - Mestrado', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/756bb3_e50728f7ba3b4c08a0f3beebcf70a7d7.pdf', true),
  ('Inscrição em disciplina - Doutorado', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/756bb3_e50728f7ba3b4c08a0f3beebcf70a7d7.pdf', true),
  ('Inscrição de aluno externo', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/756bb3_a2875d86bce2476ea1a34f20ee983e0e.pdf', true),
  ('Inscrição em disciplina isolada', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/756bb3_eda83bb38c6d466c86f12e0758bff595.pdf', true),
  ('Alteração de inscrição em disciplina', 'PDF', 'https://ppgfil.uerj.br/_files/ugd/756bb3_8ade9dc59c7e48df880348ac60e993bb.pdf', true),
  ('Formulário de Matrícula', 'DOC', 'https://ppgfil.uerj.br/_files/ugd/50de38_9e29addcf4cf4110b1170588bae5902c.doc?dn=Formul%C3%A1rio%20de%20Matr%C3%ADcula%20atualizado.doc', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.procedures (title, deadline_text, steps, source_url) VALUES
  ('Matrícula e inscrição em disciplinas', 'Conforme o calendário acadêmico de cada período', ARRAY['Consultar previamente o quadro de horários e as ementas publicados pelo PPGFIL.', 'Preencher o formulário de inscrição disponibilizado no site e enviado pela secretaria.', 'Enviar o formulário pelo canal específico de inscrições dentro do período divulgado.', 'Manter inscrição em disciplinas em todos os períodos letivos enquanto houver vínculo com o Programa.'], 'https://ppgfil.uerj.br/manual-do-aluno'),
  ('Alteração de inscrição em disciplina', 'Durante as quatro primeiras semanas de aula', ARRAY['Preencher o formulário oficial de alteração de inscrição em disciplina.', 'Indicar claramente cancelamento, troca ou inclusão pretendida.', 'Enviar a solicitação pelo canal de inscrições dentro das quatro primeiras semanas.', 'Aguardar a validação da secretaria; abandono após esse limite implica reprovação.'], 'https://ppgfil.uerj.br/manual-do-aluno'),
  ('Aproveitamento de créditos', 'Prazo de solicitação não especificado no regimento/manual', ARRAY['Reunir histórico e ementa da disciplina cursada em programa reconhecido.', 'Confirmar que a disciplina possui quatro créditos e foi cursada nos três anos anteriores à matrícula.', 'Preencher o formulário oficial de aproveitamento de créditos.', 'Submeter o pedido à análise da Comissão de Pós-Graduação, que pode validar até duas disciplinas.'], 'https://ppgfil.uerj.br/manual-do-aluno'),
  ('Trancamento de matrícula', 'Até 6 meses no Mestrado e 12 meses no Doutorado', ARRAY['Confirmar o cumprimento de ao menos um semestre com todas as exigências do curso.', 'Obter a anuência do orientador e apresentar motivos relevantes.', 'Encaminhar a solicitação à Comissão de Pós-Graduação em Filosofia.', 'Aguardar a deliberação; o período deferido não conta para a integralização do curso.'], 'https://ppgfil.uerj.br/manual-do-aluno'),
  ('Marcação de defesa', 'Prazo administrativo não especificado no regimento/manual', ARRAY['Confirmar com a secretaria o atendimento aos créditos e demais requisitos do curso.', 'Solicitar ao orientador a indicação da banca examinadora.', 'Encaminhar o requerimento de homologação de banca e a versão do trabalho.', 'Aguardar confirmação da homologação e as orientações para realização da defesa.'], 'https://ppgfil.uerj.br/regimentos')
ON CONFLICT (title) DO NOTHING;

-- ============================================================
-- 8. Hardening para Supabase
-- O app usa autenticacao propria; acesso direto via anon/authenticated
-- fica bloqueado. Use backend com service role/conexao servidor-servidor.
-- ============================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_research_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

COMMIT;
