-- ============================================================
-- e-PPGFIL - Cargos oficiais para usuarios do dashboard
-- ============================================================

BEGIN;

INSERT INTO public.roles (slug, name, description) VALUES
  ('ROOT', 'ROOT', 'Acesso tecnico total ao sistema.'),
  ('SECRETARY_ADMIN', 'SECRETARY_ADMIN', 'Administracao da secretaria, usuarios e cadastros.'),
  ('SECRETARY_OPERATOR', 'SECRETARY_OPERATOR', 'Operacao da secretaria e tramitacao de protocolos.'),
  ('COORDINATOR', 'COORDINATOR', 'Acompanhamento e decisoes da coordenacao.')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

DELETE FROM public.roles
WHERE slug IN ('admin', 'secretaria', 'coordenacao')
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.role_id = roles.id
  );

COMMIT;
