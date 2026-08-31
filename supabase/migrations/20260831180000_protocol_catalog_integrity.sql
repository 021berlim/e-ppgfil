-- Vincula protocolos legados ao catalogo e impede pares categoria/tipo inconsistentes.
BEGIN;

WITH matched AS (
  SELECT p.id AS protocol_id, min(c.id::text)::uuid AS category_id,
         min(t.id::text)::uuid AS request_type_id
  FROM public.protocols p
  JOIN public.request_categories c ON lower(c.name) = lower(p.category_name_snapshot)
  JOIN public.request_types t ON t.category_id = c.id
    AND lower(t.name) = lower(p.request_type_name_snapshot)
  WHERE p.category_id IS NULL OR p.request_type_id IS NULL
  GROUP BY p.id
  HAVING count(*) = 1
)
UPDATE public.protocols p
SET category_id = matched.category_id, request_type_id = matched.request_type_id
FROM matched
WHERE p.id = matched.protocol_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_request_types_id_category
  ON public.request_types(id, category_id);

DO $$ BEGIN
  ALTER TABLE public.protocols
    ADD CONSTRAINT fk_protocols_request_type_category
    FOREIGN KEY (request_type_id, category_id)
    REFERENCES public.request_types(id, category_id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
