import { db } from '@/lib/db'

export type EntityName = 'research-lines' | 'faculty-members' | 'procedures' | 'institutional-forms'

export type ResearchLinePayload = {
  title?: string
  summary?: string | null
  disciplines?: string[]
  source_url?: string | null
}

export type FacultyPayload = {
  full_name?: string
  position?: string
  expertise?: string | null
  highest_degree?: string | null
  lattes_url?: string | null
  profile_url?: string | null
  advising_count?: number | null
  is_active?: boolean
  research_line_ids?: string[]
}

export type ProcedurePayload = {
  title?: string
  deadline_text?: string | null
  steps?: string[]
  source_url?: string | null
}

export type InstitutionalFormPayload = {
  name?: string
  file_type?: string
  source_url?: string | null
  is_available?: boolean
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Campo obrigatorio ausente: ${field}.`)
  }
  return value.trim()
}

function nullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function booleanValue(value: unknown, fallback = true) {
  return typeof value === 'boolean' ? value : fallback
}

function nullableInteger(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

export async function listEntity(entity: EntityName) {
  if (entity === 'research-lines') {
    const result = await db.query(`
      SELECT id, title, summary, disciplines, source_url, created_at, updated_at
      FROM public.research_lines
      ORDER BY title
    `)
    return result.rows
  }

  if (entity === 'faculty-members') {
    const result = await db.query(`
      SELECT
        f.id,
        f.full_name,
        f.position,
        f.expertise,
        f.highest_degree,
        f.lattes_url,
        f.profile_url,
        f.advising_count,
        f.is_active,
        f.created_at,
        f.updated_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object('id', rl.id, 'title', rl.title)
            ORDER BY rl.title
          ) FILTER (WHERE rl.id IS NOT NULL),
          '[]'::jsonb
        ) AS research_lines
      FROM public.faculty_members f
      LEFT JOIN public.faculty_research_lines frl ON frl.faculty_member_id = f.id
      LEFT JOIN public.research_lines rl ON rl.id = frl.research_line_id
      GROUP BY f.id
      ORDER BY f.full_name
    `)
    return result.rows
  }

  if (entity === 'procedures') {
    const result = await db.query(`
      SELECT id, title, deadline_text, steps, source_url, created_at, updated_at
      FROM public.procedures
      ORDER BY title
    `)
    return result.rows
  }

  const result = await db.query(`
    SELECT id, name, file_type, source_url, is_available, document_file_id, created_at, updated_at
    FROM public.institutional_forms
    ORDER BY name
  `)
  return result.rows
}

export async function createEntity(entity: EntityName, payload: Record<string, unknown>) {
  if (entity === 'research-lines') {
    const result = await db.query(
      `
        INSERT INTO public.research_lines (title, summary, disciplines, source_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, summary, disciplines, source_url, created_at, updated_at
      `,
      [
        requiredString(payload.title, 'title'),
        nullableString(payload.summary),
        stringArray(payload.disciplines),
        nullableString(payload.source_url),
      ],
    )
    return result.rows[0]
  }

  if (entity === 'faculty-members') {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `
          INSERT INTO public.faculty_members (
            full_name, position, expertise, highest_degree, lattes_url, profile_url,
            advising_count, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, full_name, position, expertise, highest_degree, lattes_url, profile_url, advising_count, is_active, created_at, updated_at
        `,
        [
          requiredString(payload.full_name, 'full_name'),
          requiredString(payload.position, 'position'),
          nullableString(payload.expertise),
          nullableString(payload.highest_degree),
          nullableString(payload.lattes_url),
          nullableString(payload.profile_url),
          nullableInteger(payload.advising_count),
          booleanValue(payload.is_active),
        ],
      )
      await replaceFacultyResearchLines(client, result.rows[0].id, stringArray(payload.research_line_ids))
      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  if (entity === 'procedures') {
    const result = await db.query(
      `
        INSERT INTO public.procedures (title, deadline_text, steps, source_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, deadline_text, steps, source_url, created_at, updated_at
      `,
      [
        requiredString(payload.title, 'title'),
        nullableString(payload.deadline_text),
        stringArray(payload.steps),
        nullableString(payload.source_url),
      ],
    )
    return result.rows[0]
  }

  const result = await db.query(
    `
      INSERT INTO public.institutional_forms (name, file_type, source_url, is_available)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, file_type, source_url, is_available, document_file_id, created_at, updated_at
    `,
    [
      requiredString(payload.name, 'name'),
      requiredString(payload.file_type, 'file_type').toUpperCase(),
      nullableString(payload.source_url),
      booleanValue(payload.is_available),
    ],
  )
  return result.rows[0]
}

export async function updateEntity(entity: EntityName, id: string, payload: Record<string, unknown>) {
  if (entity === 'research-lines') {
    const result = await db.query(
      `
        UPDATE public.research_lines
        SET title = $2,
            summary = $3,
            disciplines = $4,
            source_url = $5
        WHERE id = $1
        RETURNING id, title, summary, disciplines, source_url, created_at, updated_at
      `,
      [
        id,
        requiredString(payload.title, 'title'),
        nullableString(payload.summary),
        stringArray(payload.disciplines),
        nullableString(payload.source_url),
      ],
    )
    return result.rows[0]
  }

  if (entity === 'faculty-members') {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `
          UPDATE public.faculty_members
          SET full_name = $2,
              position = $3,
              expertise = $4,
              highest_degree = $5,
              lattes_url = $6,
              profile_url = $7,
              advising_count = $8,
              is_active = $9
          WHERE id = $1
          RETURNING id, full_name, position, expertise, highest_degree, lattes_url, profile_url, advising_count, is_active, created_at, updated_at
        `,
        [
          id,
          requiredString(payload.full_name, 'full_name'),
          requiredString(payload.position, 'position'),
          nullableString(payload.expertise),
          nullableString(payload.highest_degree),
          nullableString(payload.lattes_url),
          nullableString(payload.profile_url),
          nullableInteger(payload.advising_count),
          booleanValue(payload.is_active),
        ],
      )
      await replaceFacultyResearchLines(client, id, stringArray(payload.research_line_ids))
      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  if (entity === 'procedures') {
    const result = await db.query(
      `
        UPDATE public.procedures
        SET title = $2,
            deadline_text = $3,
            steps = $4,
            source_url = $5
        WHERE id = $1
        RETURNING id, title, deadline_text, steps, source_url, created_at, updated_at
      `,
      [
        id,
        requiredString(payload.title, 'title'),
        nullableString(payload.deadline_text),
        stringArray(payload.steps),
        nullableString(payload.source_url),
      ],
    )
    return result.rows[0]
  }

  const result = await db.query(
    `
      UPDATE public.institutional_forms
      SET name = $2,
          file_type = $3,
          source_url = $4,
          is_available = $5
      WHERE id = $1
      RETURNING id, name, file_type, source_url, is_available, document_file_id, created_at, updated_at
    `,
    [
      id,
      requiredString(payload.name, 'name'),
      requiredString(payload.file_type, 'file_type').toUpperCase(),
      nullableString(payload.source_url),
      booleanValue(payload.is_available),
    ],
  )
  return result.rows[0]
}

export async function deleteEntity(entity: EntityName, id: string) {
  const tableByEntity: Record<EntityName, string> = {
    'research-lines': 'research_lines',
    'faculty-members': 'faculty_members',
    procedures: 'procedures',
    'institutional-forms': 'institutional_forms',
  }

  const result = await db.query(`DELETE FROM public.${tableByEntity[entity]} WHERE id = $1`, [id])
  return result.rowCount ?? 0
}

async function replaceFacultyResearchLines(
  client: Pick<typeof db, 'query'>,
  facultyId: string,
  researchLineIds: string[],
) {
  await client.query('DELETE FROM public.faculty_research_lines WHERE faculty_member_id = $1', [
    facultyId,
  ])

  for (const researchLineId of researchLineIds) {
    await client.query(
      `
        INSERT INTO public.faculty_research_lines (faculty_member_id, research_line_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [facultyId, researchLineId],
    )
  }
}
