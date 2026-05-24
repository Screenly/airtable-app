import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import '@screenly/edge-apps/test'

import {
  renderTable,
  showError,
  showScreen,
  showView,
  recordsToRows,
  resolveView,
  createErrorReporter,
} from './app'

const DOM = `
  <div id="table-wrapper">
    <h2 id="table-title" hidden></h2>
    <div id="grid-container" style="display: none">
      <table id="data-table">
        <thead id="table-head"></thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>
    <div id="kanban-container" style="display: none"></div>
  </div>
  <div id="error-screen" style="display: none">
    <p id="error-message"></p>
  </div>
`

beforeEach(() => {
  document.body.innerHTML = DOM
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('renderTable', () => {
  it('when given headers, should render them', () => {
    renderTable(['Name', 'Department'], [['Alice', 'Engineering']])

    const headers = document.querySelectorAll('#table-head th')
    expect(headers.length).toBe(2)
    expect(headers[0].textContent).toBe('Name')
    expect(headers[1].textContent).toBe('Department')
  })

  it('when given rows, should render them', () => {
    renderTable(['Name'], [['Alice'], ['Bob']])

    const rows = document.querySelectorAll('#table-body tr')
    expect(rows.length).toBe(2)
  })

  it('should render cell content safely via textContent', () => {
    renderTable(['Name'], [['<script>alert(1)</script>']])

    const cell = document.querySelector('#table-body td')
    expect(cell?.textContent).toBe('<script>alert(1)</script>')
    expect(document.body.innerHTML).not.toContain('<script>alert(1)</script>')
  })

  it('when given empty input, should render nothing', () => {
    renderTable([], [])

    expect(document.querySelectorAll('#table-head th')).toHaveLength(0)
    expect(document.querySelectorAll('#table-body tr')).toHaveLength(0)
  })
})

describe('showError', () => {
  it('should display the error screen with the given message', () => {
    showError('Something went wrong')

    expect(document.getElementById('error-screen')?.style.display).toBe('flex')
    expect(document.getElementById('table-wrapper')?.style.display).toBe('none')
    expect(document.getElementById('error-message')?.textContent).toBe(
      'Something went wrong',
    )
  })
})

describe('showScreen', () => {
  it('when called with table-wrapper, should restore the table screen', () => {
    showError('oops')
    showScreen('table-wrapper')

    expect(document.getElementById('table-wrapper')?.style.display).toBe('flex')
    expect(document.getElementById('error-screen')?.style.display).toBe('none')
  })
})

describe('showView', () => {
  it('when grid, should show grid container and hide kanban', () => {
    showView('grid')
    expect(document.getElementById('grid-container')?.style.display).toBe('')
    expect(document.getElementById('kanban-container')?.style.display).toBe(
      'none',
    )
  })

  it('when kanban, should show kanban container and hide grid', () => {
    showView('kanban')
    expect(document.getElementById('kanban-container')?.style.display).toBe('')
    expect(document.getElementById('grid-container')?.style.display).toBe(
      'none',
    )
  })
})

/* eslint-disable max-lines-per-function */
describe('recordsToRows', () => {
  it('when records are empty, should return empty headers and rows', () => {
    expect(recordsToRows([])).toEqual({ headers: [], rows: [] })
  })

  it('when no fields provided, should derive headers from record keys', () => {
    const records = [
      { id: 'rec1', createdTime: '', fields: { Name: 'Alice', Age: 30 } },
    ]
    const { headers } = recordsToRows(records)
    expect(headers).toEqual(['Name', 'Age'])
  })

  it('should convert field values to strings', () => {
    const records = [
      { id: 'rec1', createdTime: '', fields: { Name: 'Alice', Age: 30 } },
    ]
    const { rows } = recordsToRows(records)
    expect(rows[0]).toEqual(['Alice', '30'])
  })

  it('should join array values with a comma', () => {
    const records = [
      { id: 'rec1', createdTime: '', fields: { Tags: ['a', 'b', 'c'] } },
    ]
    const { rows } = recordsToRows(records)
    expect(rows[0][0]).toBe('a, b, c')
  })

  it('when field value is null or undefined, should render as empty string', () => {
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

  describe('with schema fields', () => {
    it('when fields are provided, should use schema field order', () => {
      const records = [
        { id: 'rec1', createdTime: '', fields: { B: 2, A: 1, C: 3 } },
      ]
      const fields = [
        { id: 'f1', name: 'A', type: 'number' },
        { id: 'f2', name: 'B', type: 'number' },
        { id: 'f3', name: 'C', type: 'number' },
      ]
      const { headers, rows } = recordsToRows(records, fields)
      expect(headers).toEqual(['A', 'B', 'C'])
      expect(rows[0]).toEqual(['1', '2', '3'])
    })

    it('when field type is singleSelect, should return Pill[]', () => {
      const records = [
        { id: 'rec1', createdTime: '', fields: { Status: 'Open' } },
      ]
      const fields = [
        {
          id: 'f1',
          name: 'Status',
          type: 'singleSelect',
          options: {
            choices: [{ id: 's1', name: 'Open', color: 'blueLight2' }],
          },
        },
      ]
      const { rows } = recordsToRows(records, fields)
      expect(rows[0][0]).toEqual([{ label: 'Open', color: 'blueLight2' }])
    })

    it('when field type is multipleSelects, should return Pill[]', () => {
      const records = [
        { id: 'rec1', createdTime: '', fields: { Tags: ['login', 'urgent'] } },
      ]
      const fields = [
        {
          id: 'f1',
          name: 'Tags',
          type: 'multipleSelects',
          options: {
            choices: [
              { id: 's1', name: 'login', color: 'blueLight2' },
              { id: 's2', name: 'urgent', color: 'cyanLight2' },
            ],
          },
        },
      ]
      const { rows } = recordsToRows(records, fields)
      expect(rows[0][0]).toEqual([
        { label: 'login', color: 'blueLight2' },
        { label: 'urgent', color: 'cyanLight2' },
      ])
    })

    it('when date field value is malformed, should return raw value', () => {
      const context = { locale: 'en-US', timezone: 'UTC' }
      const records = [
        { id: 'rec1', createdTime: '', fields: { Due: 'not-a-date' } },
      ]
      const fields = [{ id: 'f1', name: 'Due', type: 'date' }]
      const { rows } = recordsToRows(records, fields, context)
      expect(rows[0][0]).toBe('not-a-date')
    })

    it('when dateTime field value is malformed, should return raw value', () => {
      const context = { locale: 'en-US', timezone: 'UTC' }
      const records = [
        { id: 'rec1', createdTime: '', fields: { Due: 'not-a-datetime' } },
      ]
      const fields = [{ id: 'f1', name: 'Due', type: 'dateTime' }]
      const { rows } = recordsToRows(records, fields, context)
      expect(rows[0][0]).toBe('not-a-datetime')
    })
  })
})
/* eslint-enable max-lines-per-function */

describe('resolveView', () => {
  it('when view type is unsupported, should fall back to first grid view', () => {
    const views = [
      { id: 'viw-grid', name: 'Grid view', type: 'grid' },
      { id: 'viw-form', name: 'Form', type: 'form' },
    ]
    const { viewType, effectiveViewId } = resolveView(views, 'viw-form')
    expect(viewType).toBe('grid')
    expect(effectiveViewId).toBe('viw-grid')
  })
})

describe('createErrorReporter', () => {
  it('when displayErrors is true, should throw', () => {
    const reporter = createErrorReporter(true)
    expect(() => reporter('oops')).toThrow('oops')
  })
})
