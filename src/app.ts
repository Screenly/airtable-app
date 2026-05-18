import { setupTheme, signalReady } from '@screenly/edge-apps'

const TABLE_TITLE = 'Team Directory'

const TABLE_DATA = [
  ['Name', 'Department', 'Location', 'Role'],
  ['Alice Johnson', 'Engineering', 'New York', 'Senior Engineer'],
  ['Bob Smith', 'Marketing', 'Los Angeles', 'Marketing Manager'],
  ['Carol White', 'Design', 'Chicago', 'Lead Designer'],
  ['David Lee', 'Engineering', 'San Francisco', 'Software Engineer'],
  ['Eva Brown', 'Product', 'Seattle', 'Product Manager'],
]

export function renderTable(rows: string[][]): void {
  const thead = document.getElementById('table-head')
  const tbody = document.getElementById('table-body')
  if (!thead || !tbody) return

  thead.innerHTML = ''
  tbody.innerHTML = ''

  if (rows.length === 0) return

  const [headers, ...dataRows] = rows

  const headerRow = document.createElement('tr')
  headers.forEach((header) => {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })
  thead.appendChild(headerRow)

  dataRows.forEach((row) => {
    const tr = document.createElement('tr')
    row.forEach((cell) => {
      const td = document.createElement('td')
      td.textContent = cell
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })
}

export default function init(): void {
  setupTheme()

  const titleEl = document.getElementById('table-title')
  if (titleEl) {
    titleEl.textContent = TABLE_TITLE
    titleEl.hidden = false
  }

  renderTable(TABLE_DATA)

  signalReady()
}
