import type { AirtableRecord, AirtableView } from './api'

export function showScreen(screenId: string): void {
  const screens = ['table-wrapper', 'error-screen']
  screens.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.style.display = id === screenId ? 'flex' : 'none'
  })
}

export function showError(message: string): void {
  showScreen('error-screen')
  const el = document.getElementById('error-message')
  if (el) el.textContent = message
}

export function renderTable(headers: string[], rows: string[][]): void {
  const thead = document.getElementById('table-head')
  const tbody = document.getElementById('table-body')
  if (!thead || !tbody) return

  thead.innerHTML = ''
  tbody.innerHTML = ''

  if (headers.length === 0) return

  const headerRow = document.createElement('tr')
  headers.forEach((header) => {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })
  thead.appendChild(headerRow)

  rows.forEach((row) => {
    const tr = document.createElement('tr')
    row.forEach((cell) => {
      const td = document.createElement('td')
      td.textContent = cell
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })
}

export function recordsToRows(records: AirtableRecord[]): {
  headers: string[]
  rows: string[][]
} {
  if (records.length === 0) return { headers: [], rows: [] }

  const seenHeaders = new Set<string>()
  const headers: string[] = []
  records.forEach((record) => {
    Object.keys(record.fields).forEach((field) => {
      if (!seenHeaders.has(field)) {
        seenHeaders.add(field)
        headers.push(field)
      }
    })
  })
  const rows = records.map((r) =>
    headers.map((h) => {
      const val = r.fields[h]
      if (val === null || val === undefined) return ''
      if (Array.isArray(val)) return val.join(', ')
      return String(val)
    }),
  )

  return { headers, rows }
}

export function findView(
  views: AirtableView[],
  viewType: string,
): AirtableView | undefined {
  return views.find((v) => v.type === viewType)
}
