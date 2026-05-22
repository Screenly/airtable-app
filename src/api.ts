export class AuthError extends Error {
  constructor(message = 'Airtable authentication failed') {
    super(message)
    this.name = 'AuthError'
  }
}

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0'

function throwIfAuthError(res: Response): void {
  if (res.status === 401 || res.status === 403) throw new AuthError()
}

export interface AirtableView {
  id: string
  name: string
  type: string
}

export interface AirtableChoice {
  id: string
  name: string
  color?: string
}

export interface AirtableField {
  id: string
  name: string
  type: string
  options?: {
    choices?: AirtableChoice[]
    dateFormat?: { name: string; format: string }
    timeFormat?: { name: string; format: string }
    timeZone?: string
  }
}

export interface AirtableTable {
  id: string
  name: string
  fields: AirtableField[]
  views: AirtableView[]
}

export interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
  createdTime: string
}

async function fetchTables(
  token: string,
  baseId: string,
): Promise<AirtableTable[]> {
  const res = await fetch(`${AIRTABLE_API_BASE}/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  throwIfAuthError(res)
  if (!res.ok)
    throw new Error(
      `Failed to fetch table schema: ${res.status} ${res.statusText}`,
    )

  const data = (await res.json()) as { tables: AirtableTable[] }
  return data.tables
}

export async function fetchTableByViewId(
  token: string,
  baseId: string,
  viewId: string,
): Promise<AirtableTable> {
  const tables = await fetchTables(token, baseId)
  const table = tables.find((t) => t.views.some((v) => v.id === viewId))
  if (!table)
    throw new Error(
      `No table found containing view '${viewId}' in base '${baseId}'`,
    )
  return table
}

export async function fetchRecords(
  token: string,
  baseId: string,
  tableId: string,
  viewId?: string,
): Promise<AirtableRecord[]> {
  const params = new URLSearchParams({ pageSize: '100' })
  if (viewId) params.set('view', viewId)

  const res = await fetch(
    `${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  throwIfAuthError(res)
  if (!res.ok)
    throw new Error(`Failed to fetch records: ${res.status} ${res.statusText}`)

  const data = (await res.json()) as { records: AirtableRecord[] }
  return data.records
}
