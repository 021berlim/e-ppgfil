import type { PoolClient } from 'pg'
import { db } from './db'
import {
  invalidateCatalogCache,
  readCatalogCache,
  writeCatalogCache,
} from './redis-cache'
import type { CategoriaItem } from './categorias'

type DocumentInput = {
  nome: string
  obrigatorio?: boolean
  formatosAceitos?: string[]
  tamanhoMaximoMB?: number
  descricao?: string
}

type TypeInput = {
  id?: string
  nome: string
  descricao?: string
  prazoDias?: number
  prazoDescricao?: string
  documentosExigidos?: DocumentInput[]
}

type CategoryInput = {
  id?: string
  nome: string
  descricao?: string
  tiposSolicitacao?: TypeInput[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item'
}

export async function listRequestCatalog() {
  const cached = await readCatalogCache<CategoriaItem[]>()
  if (cached) return cached

  const result = await db.query(`
    SELECT c.id, c.name, c.description,
      COALESCE(jsonb_agg(jsonb_build_object(
        'id', t.id, 'nome', t.name, 'descricao', t.description,
        'prazoDias', t.sla_business_days, 'prazoDescricao', t.deadline_description,
        'documentosExigidos', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'id', d.id, 'nome', d.name, 'descricao', d.description,
          'obrigatorio', d.is_required, 'formatosAceitos', d.accepted_formats,
          'tamanhoMaximoMB', d.max_size_mb
        ) ORDER BY d.sort_order, d.created_at) FROM required_documents d WHERE d.request_type_id=t.id), '[]'::jsonb)
      ) ORDER BY t.sort_order, t.created_at) FILTER (WHERE t.id IS NOT NULL), '[]'::jsonb) AS types
    FROM request_categories c
    LEFT JOIN request_types t ON t.category_id=c.id AND t.is_active=true
    WHERE c.is_active=true
    GROUP BY c.id
    ORDER BY c.sort_order, c.created_at
  `)
  const catalog = result.rows.map((row) => ({
    id: row.id, nome: row.name, descricao: row.description, tiposSolicitacao: row.types,
  }))
  await writeCatalogCache(catalog)
  return catalog
}

async function upsertCategory(client: PoolClient, item: CategoryInput, order: number) {
  if (UUID_RE.test(item.id ?? '')) {
    const updated = await client.query(`UPDATE request_categories SET name=$2, description=$3, sort_order=$4, is_active=true WHERE id=$1 RETURNING id`, [item.id, item.nome.trim(), item.descricao?.trim() ?? '', order])
    if (updated.rows[0]) return updated.rows[0].id as string
  }
  const slug = slugify(item.id || item.nome)
  const result = await client.query(`
    INSERT INTO request_categories (slug, name, description, sort_order, is_active)
    VALUES ($1, $2, $3, $4, true)
    ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
      sort_order=EXCLUDED.sort_order, is_active=true
    RETURNING id
  `, [slug, item.nome.trim(), item.descricao?.trim() ?? '', order])
  return result.rows[0].id as string
}

async function upsertType(client: PoolClient, categoryId: string, item: TypeInput, order: number) {
  if (UUID_RE.test(item.id ?? '')) {
    const updated = await client.query(`UPDATE request_types SET category_id=$2, name=$3, description=$4, sla_business_days=$5, deadline_description=$6, sort_order=$7, is_active=true WHERE id=$1 RETURNING id`, [item.id, categoryId, item.nome.trim(), item.descricao?.trim() || null, item.prazoDias ?? null, item.prazoDescricao?.trim() || null, order])
    if (updated.rows[0]) return updated.rows[0].id as string
  }
  const slug = slugify(item.id || item.nome)
  const result = await client.query(`
    INSERT INTO request_types (category_id, slug, name, description, sla_business_days, deadline_description, sort_order, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,true)
    ON CONFLICT (category_id, slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
      sla_business_days=EXCLUDED.sla_business_days, deadline_description=EXCLUDED.deadline_description,
      sort_order=EXCLUDED.sort_order, is_active=true RETURNING id
  `, [categoryId, slug, item.nome.trim(), item.descricao?.trim() || null, item.prazoDias ?? null, item.prazoDescricao?.trim() || null, order])
  return result.rows[0].id as string
}

export async function replaceRequestCatalog(input: unknown) {
  if (!Array.isArray(input)) throw new Error('O corpo deve ser uma lista de categorias.')
  const categories = input as CategoryInput[]
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const activeCategoryIds: string[] = []
    for (const [categoryIndex, category] of categories.entries()) {
      if (!category?.nome?.trim()) throw new Error('Categoria invalida.')
      const categoryId = await upsertCategory(client, category, (categoryIndex + 1) * 10)
      activeCategoryIds.push(categoryId)
      const activeTypeIds: string[] = []
      for (const [typeIndex, type] of (category.tiposSolicitacao ?? []).entries()) {
        if (!type?.nome?.trim()) throw new Error('Tipo de solicitacao invalido.')
        const typeId = await upsertType(client, categoryId, type, (typeIndex + 1) * 10)
        activeTypeIds.push(typeId)
        await client.query('DELETE FROM required_documents WHERE request_type_id=$1', [typeId])
        for (const [documentIndex, document] of (type.documentosExigidos ?? []).entries()) {
          if (!document.nome?.trim()) throw new Error('Documento exigido invalido.')
          await client.query(`INSERT INTO required_documents (request_type_id,name,description,is_required,accepted_formats,max_size_mb,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [typeId, document.nome.trim(), document.descricao?.trim() || null, document.obrigatorio !== false, document.formatosAceitos?.length ? document.formatosAceitos : ['pdf'], document.tamanhoMaximoMB ?? 10, (documentIndex + 1) * 10])
        }
      }
      await client.query('UPDATE request_types SET is_active=false WHERE category_id=$1 AND NOT (id=ANY($2::uuid[]))', [categoryId, activeTypeIds])
    }
    await client.query('UPDATE request_categories SET is_active=false WHERE NOT (id=ANY($1::uuid[]))', [activeCategoryIds])
    await client.query('COMMIT')
    await invalidateCatalogCache()
    return listRequestCatalog()
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}
