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
  card.className = 'kanban-card'

  const primaryVal = record.fields[primaryField?.name ?? '']
  if (primaryVal !== null && primaryVal !== undefined && primaryVal !== '') {
    const cardTitle = document.createElement('p')
    cardTitle.className = 'kanban-card-title'
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
  header.className = 'kanban-column-header'

  if (color) {
    const colors = AIRTABLE_COLORS[color] || PILL_FALLBACK
    const dot = document.createElement('span')
    dot.className = 'kanban-column-dot'
    dot.style.backgroundColor = colors.bg
    header.appendChild(dot)
  }

  const titleEl = document.createElement('span')
  titleEl.className = 'kanban-column-title'
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
  column.className = 'kanban-column'
  column.appendChild(buildColumnHeader(name, color))

  const cardsEl = document.createElement('div')
  cardsEl.className = 'kanban-cards'
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
  stackFieldName = '',
): void {
  const board = document.getElementById('kanban-board')
  if (!board) {
    return
  }
  board.innerHTML = ''

  const stackField = stackFieldName
    ? fields.find((f) => f.name === stackFieldName && f.type === 'singleSelect')
    : fields.find((f) => f.type === 'singleSelect')
  if (!stackField) {
    const reason = stackFieldName
      ? `field "${stackFieldName}" not found or is not a singleSelect`
      : 'no singleSelect field found in schema'
    console.warn(`renderKanban: cannot render board: ${reason}`)
    return
  }

  const primaryField = resolvePrimaryField(fields)
  const columns = groupByChoice(records, stackField)

  columns.forEach(({ name, color, records: colRecords }) => {
    board.appendChild(buildColumn(name, color, colRecords, primaryField))
  })
}
