-- Tokens para download publico de anexos enquanto o fluxo de protocolos ainda
-- permanece no armazenamento local do prototipo.

BEGIN;

ALTER TABLE public.document_files
  ADD COLUMN IF NOT EXISTS access_token_hash char(64);

CREATE INDEX IF NOT EXISTS idx_document_files_access_token_hash
  ON public.document_files(access_token_hash)
  WHERE access_token_hash IS NOT NULL;

COMMIT;
