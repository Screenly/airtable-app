import { formatLocalizedDate, formatTime } from '@screenly/edge-apps'
import type { AirtableField, AirtableRecord, AirtableView } from './api'
import {
  AIRTABLE_COLORS,
  PILL_FALLBACK,
  SUPPORTED_VIEW_TYPES,
} from './constants'

export { AIRTABLE_COLORS, PILL_FALLBACK }

export interface Pill {
  label: string
  color?: string
}

export type CellValue = string | Pill[]

export function showScreen(screenId: string): void {
  const screens = ['table-wrapper', 'error-screen']
  screens.forEach((id) => {
    const el = document.getElementById(id)
    if (el) {
      el.style.display = id === screenId ? 'flex' : 'none'
    }
  })
}

export type ViewType = 'grid' | 'kanban'

export function resolveView(
  views: AirtableView[],
  viewId: string,
): { viewType: ViewType; effectiveViewId: string | undefined } {
  const requestedView = views.find((v) => v.id === viewId)
  const isSupportedType =
    requestedView !== undefined && SUPPORTED_VIEW_TYPES.has(requestedView.type)
  const viewType: ViewType =
    isSupportedType && requestedView!.type === 'kanban' ? 'kanban' : 'grid'
  const effectiveView = isSupportedType
    ? requestedView
    : views.find((v) => v.type === 'grid')
  return { viewType, effectiveViewId: effectiveView?.id }
}

export function showView(type: ViewType): void {
  const gridEl = document.getElementById('grid-container')
  const kanbanEl = document.getElementById('kanban-container')
  if (gridEl) {
    gridEl.style.display = type === 'grid' ? '' : 'none'
  }
  if (kanbanEl) {
    kanbanEl.style.display = type === 'kanban' ? '' : 'none'
  }
}

export function showError(message: string): void {
  showScreen('error-screen')
  const el = document.getElementById('error-message')
  if (el) {
    el.textContent = message
  }
}

export type ErrorReporter = (message: string) => void

export function createErrorReporter(displayErrors: boolean): ErrorReporter {
  if (displayErrors)
    return (msg) => {
      throw new Error(msg)
    }
  return showError
}

export function createPillsContainer(pills: Pill[]): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'cell-pills'
  pills.forEach((pill) => {
    const span = document.createElement('span')
    span.className = 'pill'
    span.textContent = pill.label
    const colors = (pill.color && AIRTABLE_COLORS[pill.color]) || PILL_FALLBACK
    span.style.backgroundColor = colors.bg
    span.style.color = colors.text
    container.appendChild(span)
  })
  return container
}

export function renderTable(headers: string[], rows: CellValue[][]): void {
  const thead = document.getElementById('table-head')
  const tbody = document.getElementById('table-body')
  if (!thead || !tbody) {
    return
  }

  thead.innerHTML = ''
  tbody.innerHTML = ''

  if (headers.length === 0) {
    return
  }

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
      if (typeof cell === 'string') {
        td.textContent = cell
      } else {
        td.appendChild(createPillsContainer(cell))
      }
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })
}

function buildFieldMaps(fields: AirtableField[]): {
  colorMap: Map<string, Map<string, string | undefined>>
  dateMap: Map<string, AirtableField>
} {
  const colorMap = new Map<string, Map<string, string | undefined>>()
  const dateMap = new Map<string, AirtableField>()
  fields.forEach((field) => {
    if (field.options?.choices) {
      colorMap.set(
        field.name,
        new Map(field.options.choices.map((c) => [c.name, c.color])),
      )
    }
    if (field.type === 'date' || field.type === 'dateTime') {
      dateMap.set(field.name, field)
    }
  })
  return { colorMap, dateMap }
}

function buildHeaders(
  records: AirtableRecord[],
  fields?: AirtableField[],
): string[] {
  if (fields && fields.length > 0) {
    return fields.map((f) => f.name)
  }
  const seen = new Set(records.flatMap((r) => Object.keys(r.fields)))
  return [...seen]
}

function formatCell(
  val: unknown,
  dateField: AirtableField | undefined,
  choiceMap: Map<string, string | undefined> | undefined,
  context?: { locale: string; timezone: string },
): CellValue {
  if (val === null || val === undefined) {
    return ''
  }

  if (dateField && context && typeof val === 'string') {
    if (dateField.type === 'date') {
      const [year, month, day] = val.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      if (isNaN(date.getTime())) {
        return val
      }
      return formatLocalizedDate(date, context.locale)
    }
    const date = new Date(val)
    if (isNaN(date.getTime())) {
      return val
    }
    const tz = dateField.options?.timeZone ?? context.timezone
    const datePart = formatLocalizedDate(date, context.locale, { timeZone: tz })
    const { hour, minute, dayPeriod } = formatTime(date, context.locale, tz)
    const timePart = dayPeriod
      ? `${hour}:${minute} ${dayPeriod}`
      : `${hour}:${minute}`
    return `${datePart} ${timePart}`
  }

  if (choiceMap) {
    const names = Array.isArray(val) ? val.map(String) : [String(val)]
    return names.map((name) => ({ label: name, color: choiceMap.get(name) }))
  }

  if (Array.isArray(val)) {
    return val.join(', ')
  }
  return String(val)
}

export function recordsToRows(
  records: AirtableRecord[],
  fields?: AirtableField[],
  context?: { locale: string; timezone: string },
): {
  headers: string[]
  rows: CellValue[][]
} {
  if (records.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = buildHeaders(records, fields)
  const { colorMap, dateMap } = fields
    ? buildFieldMaps(fields)
    : { colorMap: new Map(), dateMap: new Map() }

  const rows = records.map((r) =>
    headers.map((h) =>
      formatCell(r.fields[h], dateMap.get(h), colorMap.get(h), context),
    ),
  )

  return { headers, rows }
}

export function trimRowsToFit(): void {
  const wrapper = document.getElementById('table-wrapper')
  const thead = document.getElementById(
    'table-head',
  ) as HTMLTableSectionElement | null
  const tbody = document.getElementById(
    'table-body',
  ) as HTMLTableSectionElement | null
  if (!wrapper || !thead || !tbody) {
    return
  }

  const rows = Array.from(tbody.rows)
  if (rows.length < 2) {
    return
  }

  const rowHeight = rows[0].offsetHeight
  if (rowHeight === 0) {
    return
  }

  const container = wrapper.parentElement
  if (!container) {
    return
  }

  const titleEl = wrapper.querySelector('#table-title') as HTMLElement | null
  const titleHeight = titleEl ? titleEl.offsetHeight : 0
  const wrapperStyle = getComputedStyle(wrapper)
  const gap = parseFloat(wrapperStyle.gap) || 0
  const marginTop = parseFloat(wrapperStyle.marginTop) || 0
  const containerStyle = getComputedStyle(container)
  const paddingTop = parseFloat(containerStyle.paddingTop) || 0
  const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0

  const availableHeight =
    container.clientHeight -
    paddingTop -
    marginTop -
    titleHeight -
    gap -
    thead.offsetHeight -
    paddingBottom

  const maxRows = Math.floor(availableHeight / rowHeight)
  if (maxRows >= rows.length) {
    return
  }

  for (let i = rows.length - 1; i >= maxRows; i--) {
    rows[i].remove()
  }

  const lastRow = tbody.rows[tbody.rows.length - 1]
  if (lastRow) {
    lastRow.style.backgroundImage = 'none'
  }
}
