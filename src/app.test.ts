import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import '@screenly/edge-apps/test'

import {
  renderTable,
  showError,
  showScreen,
  recordsToRows,
  findView,
} from './app'

const DOM = `
  <div id="table-wrapper">
    <h2 id="table-title" hidden></h2>
    <table id="data-table">
      <thead id="table-head"></thead>
      <tbody id="table-body"></tbody>
    </table>
  </div>
  <div id="error-screen" style="display: none">
    <p id="error-message"></p>
  </div>
`

describe('DOM functions', () => {
  beforeEach(() => {
    document.body.innerHTML = DOM
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('renderTable', () => {
    test('renders headers', () => {
      renderTable(['Name', 'Department'], [['Alice', 'Engineering']])

      const headers = document.querySelectorAll('#table-head th')
      expect(headers.length).toBe(2)
      expect(headers[0].textContent).toBe('Name')
      expect(headers[1].textContent).toBe('Department')
    })

    test('renders data rows', () => {
      renderTable(['Name'], [['Alice'], ['Bob']])

      const rows = document.querySelectorAll('#table-body tr')
      expect(rows.length).toBe(2)
    })

    test('renders cell content safely via textContent', () => {
      renderTable(['Name'], [['<script>alert(1)</script>']])

      const cell = document.querySelector('#table-body td')
      expect(cell?.textContent).toBe('<script>alert(1)</script>')
      expect(document.body.innerHTML).not.toContain('<script>alert(1)</script>')
    })

    test('handles empty input gracefully', () => {
      renderTable([], [])

      expect(document.querySelectorAll('#table-head th')).toHaveLength(0)
      expect(document.querySelectorAll('#table-body tr')).toHaveLength(0)
    })
  })

  describe('showError / showScreen', () => {
    test('showError displays the error screen with message', () => {
      showError('Something went wrong')

      expect(document.getElementById('error-screen')?.style.display).toBe(
        'flex',
      )
      expect(document.getElementById('table-wrapper')?.style.display).toBe(
        'none',
      )
      expect(document.getElementById('error-message')?.textContent).toBe(
        'Something went wrong',
      )
    })

    test('showScreen restores the table screen', () => {
      showError('oops')
      showScreen('table-wrapper')

      expect(document.getElementById('table-wrapper')?.style.display).toBe(
        'flex',
      )
      expect(document.getElementById('error-screen')?.style.display).toBe(
        'none',
      )
    })
  })
})

describe('recordsToRows', () => {
  test('returns empty headers and rows for empty input', () => {
    expect(recordsToRows([])).toEqual({ headers: [], rows: [] })
  })

  test('extracts headers from first record fields', () => {
    const records = [
      { id: 'rec1', createdTime: '', fields: { Name: 'Alice', Age: 30 } },
    ]
    const { headers } = recordsToRows(records)
    expect(headers).toEqual(['Name', 'Age'])
  })

  test('converts field values to strings', () => {
    const records = [
      { id: 'rec1', createdTime: '', fields: { Name: 'Alice', Age: 30 } },
    ]
    const { rows } = recordsToRows(records)
    expect(rows[0]).toEqual(['Alice', '30'])
  })

  test('joins array values with comma', () => {
    const records = [
      { id: 'rec1', createdTime: '', fields: { Tags: ['a', 'b', 'c'] } },
    ]
    const { rows } = recordsToRows(records)
    expect(rows[0][0]).toBe('a, b, c')
  })

  test('uses fieldNames order when provided', () => {
    const records = [
      { id: 'rec1', createdTime: '', fields: { B: 2, A: 1, C: 3 } },
    ]
    const { headers, rows } = recordsToRows(records, ['A', 'B', 'C'])
    expect(headers).toEqual(['A', 'B', 'C'])
    expect(rows[0]).toEqual(['1', '2', '3'])
  })

  test('renders null and undefined fields as empty string', () => {
    const records = [
      {
        id: 'rec1',
        createdTime: '',
        fields: { Name: null as unknown, Age: undefined as unknown },
      },
    ]
    const { rows } = recordsToRows(records)
    expect(rows[0]).toEqual(['', ''])
  })
})

describe('findView', () => {
  const views = [
    { id: 'viw1', name: 'Grid View', type: 'grid' },
    { id: 'viw2', name: 'Calendar View', type: 'calendar' },
  ]

  test('returns the first matching view by type', () => {
    expect(findView(views, 'grid')?.id).toBe('viw1')
    expect(findView(views, 'calendar')?.id).toBe('viw2')
  })

  test('returns undefined for a non-existent type', () => {
    expect(findView(views, 'kanban')).toBeUndefined()
  })
})
