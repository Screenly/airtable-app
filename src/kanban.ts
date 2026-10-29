import type { AirtableField, AirtableRecord } from './api'
import { AIRTABLE_COLORS, PILL_FALLBACK, TEXT_FIELD_TYPES } from './constants'

function resolvePrimaryField(
  fields: AirtableField[],
): AirtableField | undefined {
  if (TEXT_FIELD_TYPES.has(fields[0]?.type)) {
    return fields[0]
  }
  return fields.find((f) => TEXT_FIELD_TYPES.has(f.type))
}

function buildCard(
  record: AirtableRecord,
  primaryField: AirtableField | undefined,
): HTMLDivElement {
  const card = document.createElement('div')
  card.className =
    'kanban-card flex flex-col gap-2 p-3 bg-white/[0.07] border border-white/10 rounded-[0.625rem]'

  const primaryVal = record.fields[primaryField?.name ?? '']
  if (primaryVal !== null && primaryVal !== undefined && primaryVal !== '') {
    const cardTitle = document.createElement('p')
    cardTitle.className =
      'kanban-card-title m-0 text-sm font-medium text-[#f2f2f3] leading-[1.4] break-words'
    cardTitle.textContent = String(primaryVal)
    card.appendChild(cardTitle)
  }

  return card
}

function buildColumnHeader(
  name: string,
  color: string | undefined,
): HTMLDivElement {
  const header = document.createElement('div')
  header.className =
    'kanban-column-header flex-shrink-0 flex items-center gap-2 py-3.5 px-4 border-b border-white/[0.08]'

  if (color) {
    const colors = AIRTABLE_COLORS[color] || PILL_FALLBACK
    const dot = document.createElement('span')
    dot.className = 'kanban-column-dot flex-shrink-0 w-2.5 h-2.5 rounded-full'
    dot.style.backgroundColor = colors.bg
    header.appendChild(dot)
  }

  const titleEl = document.createElement('span')
  titleEl.className =
    'kanban-column-title flex-1 text-xs font-semibold tracking-[0.07em] uppercase text-[#9d9d9f] whitespace-nowrap overflow-hidden text-ellipsis'
  titleEl.textContent = name || 'No Status'
  header.appendChild(titleEl)

  return header
}

function buildColumn(
  name: string,
  color: string | undefined,
  colRecords: AirtableRecord[],
  primaryField: AirtableField | undefined,
): HTMLDivElement {
  const column = document.createElement('div')
  column.className =
    'kanban-column flex-[0_0_17rem] max-h-full flex flex-col bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden portrait:flex-[0_0_14rem]'
  column.appendChild(buildColumnHeader(name, color))

  const cardsEl = document.createElement('div')
  cardsEl.className =
    'kanban-cards flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-2xl'
  colRecords.forEach((record) => {
    cardsEl.appendChild(buildCard(record, primaryField))
  })
  column.appendChild(cardsEl)

  return column
}

type KanbanColumn = {
  name: string
  color?: string
  records: AirtableRecord[]
}

function groupByChoice(
  records: AirtableRecord[],
  stackField: AirtableField,
): KanbanColumn[] {
  const choices = stackField.options?.choices ?? []

  const columnMap = new Map<string, AirtableRecord[]>()
  columnMap.set('', [])
  choices.forEach((c) => columnMap.set(c.name, []))

  records.forEach((record) => {
    const val = record.fields[stackField.name]
    const key = typeof val === 'string' ? val : ''
    const bucket = columnMap.get(key)
    if (bucket) {
      bucket.push(record)
    } else {
      columnMap.get('')!.push(record)
    }
  })

  const columns: KanbanColumn[] = choices.map((c) => ({
    name: c.name,
    color: c.color,
    records: columnMap.get(c.name) ?? [],
  }))

  const uncategorized = columnMap.get('')!
  if (uncategorized.length > 0) {
    columns.push({ name: '', records: uncategorized })
  }

  return columns
}

export function renderKanban(
  records: AirtableRecord[],
  fields: AirtableField[],
): void {
  const board = document.getElementById('kanban-board')
  if (!board) {
    return
  }
  board.innerHTML = ''

  const stackField = fields.find((f) => f.type === 'singleSelect')
  if (!stackField) {
    console.warn(
      'renderKanban: cannot render board: no singleSelect field found in schema',
    )
    return
  }

  const primaryField = resolvePrimaryField(fields)
  const columns = groupByChoice(records, stackField)

  columns.forEach(({ name, color, records: colRecords }) => {
    board.appendChild(buildColumn(name, color, colRecords, primaryField))
  })
}
