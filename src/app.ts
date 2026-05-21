import type { AirtableField, AirtableRecord } from './api'

const AIRTABLE_COLORS: Record<string, { bg: string; text: string }> = {
  blueLight2: { bg: '#cfdfff', text: '#00111f' },
  blueLight1: { bg: '#9cc7ff', text: '#00111f' },
  blueBright: { bg: '#2d7ff9', text: '#ffffff' },
  blueDark1: { bg: '#2750ae', text: '#ffffff' },
  cyanLight2: { bg: '#d0f0fd', text: '#00111f' },
  cyanLight1: { bg: '#77d1f3', text: '#00111f' },
  cyanBright: { bg: '#18bfff', text: '#00111f' },
  cyanDark1: { bg: '#0d78a4', text: '#ffffff' },
  tealLight2: { bg: '#c2f5e9', text: '#00111f' },
  tealLight1: { bg: '#72ddc3', text: '#00111f' },
  tealBright: { bg: '#20d9d2', text: '#00111f' },
  tealDark1: { bg: '#06a09b', text: '#ffffff' },
  greenLight2: { bg: '#d1f7c4', text: '#00111f' },
  greenLight1: { bg: '#93e088', text: '#00111f' },
  greenBright: { bg: '#20c933', text: '#ffffff' },
  greenDark1: { bg: '#338a17', text: '#ffffff' },
  yellowLight2: { bg: '#ffeab6', text: '#00111f' },
  yellowLight1: { bg: '#ffd66e', text: '#00111f' },
  yellowBright: { bg: '#fcb400', text: '#00111f' },
  yellowDark1: { bg: '#b87503', text: '#ffffff' },
  orangeLight2: { bg: '#fee2d5', text: '#00111f' },
  orangeLight1: { bg: '#ffa981', text: '#00111f' },
  orangeBright: { bg: '#ff6f2c', text: '#ffffff' },
  orangeDark1: { bg: '#d74d26', text: '#ffffff' },
  redLight2: { bg: '#ffdce5', text: '#00111f' },
  redLight1: { bg: '#ff9eb7', text: '#00111f' },
  redBright: { bg: '#f82b60', text: '#ffffff' },
  redDark1: { bg: '#ba1e45', text: '#ffffff' },
  pinkLight2: { bg: '#ffdaf6', text: '#00111f' },
  pinkLight1: { bg: '#f99de2', text: '#00111f' },
  pinkBright: { bg: '#ff08c2', text: '#ffffff' },
  pinkDark1: { bg: '#b2158b', text: '#ffffff' },
  purpleLight2: { bg: '#ede2fe', text: '#00111f' },
  purpleLight1: { bg: '#cdb0ff', text: '#00111f' },
  purpleBright: { bg: '#8b46ff', text: '#ffffff' },
  purpleDark1: { bg: '#6b1fb1', text: '#ffffff' },
  grayLight2: { bg: '#eeeefe', text: '#00111f' },
  grayLight1: { bg: '#cccce4', text: '#00111f' },
  grayBright: { bg: '#9999bc', text: '#ffffff' },
  grayDark1: { bg: '#666690', text: '#ffffff' },
}

const PILL_FALLBACK: { bg: string; text: string } = {
  bg: '#e5e5e5',
  text: '#00111f',
}

export interface Pill {
  label: string
  color?: string
}

export type CellValue = string | Pill[]

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

export function renderTable(headers: string[], rows: CellValue[][]): void {
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
      if (typeof cell === 'string') {
        td.textContent = cell
      } else {
        const container = document.createElement('div')
        container.classList.add('cell-pills')
        cell.forEach((pill) => {
          const span = document.createElement('span')
          span.classList.add('pill')
          span.textContent = pill.label
          const colors =
            (pill.color && AIRTABLE_COLORS[pill.color]) || PILL_FALLBACK
          span.style.backgroundColor = colors.bg
          span.style.color = colors.text
          container.appendChild(span)
        })
        td.appendChild(container)
      }
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })
}

export function recordsToRows(
  records: AirtableRecord[],
  fields?: AirtableField[],
): {
  headers: string[]
  rows: CellValue[][]
} {
  if (records.length === 0) return { headers: [], rows: [] }

  let headers: string[]
  if (fields && fields.length > 0) {
    headers = fields.map((f) => f.name)
  } else {
    const seenHeaders = new Set<string>()
    headers = []
    records.forEach((record) => {
      Object.keys(record.fields).forEach((field) => {
        if (!seenHeaders.has(field)) {
          seenHeaders.add(field)
          headers.push(field)
        }
      })
    })
  }

  const colorMap = new Map<string, Map<string, string | undefined>>()
  if (fields) {
    fields.forEach((field) => {
      if (!field.options?.choices) return
      colorMap.set(
        field.name,
        new Map(field.options.choices.map((c) => [c.name, c.color])),
      )
    })
  }

  const rows = records.map((r) =>
    headers.map((h): CellValue => {
      const val = r.fields[h]
      if (val === null || val === undefined) return ''
      const choiceMap = colorMap.get(h)
      if (choiceMap) {
        const names = Array.isArray(val) ? val.map(String) : [String(val)]
        return names.map((name) => ({
          label: name,
          color: choiceMap.get(name),
        }))
      }
      if (Array.isArray(val)) return val.join(', ')
      return String(val)
    }),
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
  if (!wrapper || !thead || !tbody) return

  const rows = Array.from(tbody.rows)
  if (rows.length < 2) return

  const rowHeight = rows[0].offsetHeight
  if (rowHeight === 0) return

  const container = wrapper.parentElement
  if (!container) return

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
  if (maxRows >= rows.length) return

  for (let i = rows.length - 1; i >= maxRows; i--) {
    rows[i].remove()
  }

  const lastRow = tbody.rows[tbody.rows.length - 1]
  if (lastRow) lastRow.style.backgroundImage = 'none'
}
