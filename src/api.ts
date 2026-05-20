export class AuthError extends Error {
  constructor(message = 'Airtable authentication failed') {
    super(message)
    this.name = 'AuthError'
  }
}

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0'

export interface AirtableView {
  id: string
  name: string
  type: string
}

export interface AirtableTable {
  id: string
  name: string
  views: AirtableView[]
}

export interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
  createdTime: string
}

export async function fetchTableSchema(
  token: string,
  baseId: string,
  tableId: string
): Promise<AirtableTable | null> {
  const res = await fetch(`${AIRTABLE_API_BASE}/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401 || res.status === 403) throw new AuthError()
  if (!res.ok) return null

  const data = (await res.json()) as { tables: AirtableTable[] }
  return data.tables.find((t) => t.id === tableId) ?? null
}

export async function fetchRecords(
  token: string,
  baseId: string,
  tableId: string,
  viewId?: string
): Promise<AirtableRecord[]> {
  const params = new URLSearchParams({ pageSize: '100' })
  if (viewId) params.set('view', viewId)

  const res = await fetch(
    `${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (res.status === 401 || res.status === 403) throw new AuthError()
  if (!res.ok) return []

  const data = (await res.json()) as { records: AirtableRecord[] }
  return data.records
}
