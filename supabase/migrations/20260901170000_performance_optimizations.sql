-- ============================================================
-- e-PPGFIL - Índices de Performance e Otimização
-- ============================================================

BEGIN;

-- 1. Protocolos e Histórico
CREATE INDEX IF NOT EXISTS idx_protocols_category_id
  ON public.protocols(category_id);

CREATE INDEX IF NOT EXISTS idx_protocols_request_type_id
  ON public.protocols(request_type_id);

CREATE INDEX IF NOT EXISTS idx_protocols_archived_created_at
  ON public.protocols(archived, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_protocols_updated_at
  ON public.protocols(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_protocols_upper_number
  ON public.protocols(upper(number));

CREATE INDEX IF NOT EXISTS idx_protocol_history_author_user_id
  ON public.protocol_history(author_user_id);

-- 2. Arquivos e Documentos (Crítico para eliminar seq scans em subqueries)
CREATE INDEX IF NOT EXISTS idx_document_files_history_id_status
  ON public.document_files(protocol_history_id, status)
  WHERE protocol_history_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_files_required_document_id
  ON public.document_files(required_document_id)
  WHERE required_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_files_uploaded_by_user_id
  ON public.document_files(uploaded_by_user_id)
  WHERE uploaded_by_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_files_protocol_status
  ON public.document_files(protocol_id, status);

-- 3. Demandantes e Usuários
CREATE INDEX IF NOT EXISTS idx_requesters_email
  ON public.requesters(email);

-- 4. Catálogo e Tipos de Requisições
CREATE INDEX IF NOT EXISTS idx_request_types_cat_active_sort
  ON public.request_types(category_id, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_required_documents_type_sort
  ON public.required_documents(request_type_id, sort_order);

-- 5. Estrutura Institucional
CREATE INDEX IF NOT EXISTS idx_faculty_research_lines_line_id
  ON public.faculty_research_lines(research_line_id);

CREATE INDEX IF NOT EXISTS idx_institutional_forms_document_file
  ON public.institutional_forms(document_file_id)
  WHERE document_file_id IS NOT NULL;

-- 6. Auditoria (Filtros por ator e protocolo)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_label
  ON public.audit_logs(actor_label);

CREATE INDEX IF NOT EXISTS idx_audit_logs_protocol_number
  ON public.audit_logs(protocol_number)
  WHERE protocol_number IS NOT NULL;

COMMIT;
