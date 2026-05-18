import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { setupScreenlyMock, resetScreenlyMock } from '@screenly/edge-apps/test'

import init, { renderTable } from './app'

const DOM = `
  <h2 id="table-title" hidden></h2>
  <table id="data-table">
    <thead id="table-head"></thead>
    <tbody id="table-body"></tbody>
  </table>
`

describe('Airtable App', () => {
  beforeEach(() => {
    document.body.innerHTML = DOM
    setupScreenlyMock({}, {})
  })

  afterEach(() => {
    resetScreenlyMock()
    document.body.innerHTML = ''
  })

  test('renders table headers', () => {
    init()

    const headers = document.querySelectorAll('#table-head th')
    expect(headers.length).toBeGreaterThan(0)
    expect(headers[0].textContent).toBe('Name')
  })

  test('renders data rows', () => {
    init()

    const rows = document.querySelectorAll('#table-body tr')
    expect(rows.length).toBeGreaterThan(0)
  })

  test('renders title', () => {
    init()

    const titleEl = document.getElementById('table-title')
    expect(titleEl?.hidden).toBe(false)
    expect(titleEl?.textContent).toBeTruthy()
  })

  test('renders cell content safely via textContent', () => {
    renderTable([['Name'], ['<script>alert(1)</script>']])

    const cell = document.querySelector('#table-body td')
    expect(cell?.textContent).toBe('<script>alert(1)</script>')
    expect(document.body.innerHTML).not.toContain('<script>alert(1)</script>')
  })

  test('handles empty rows gracefully', () => {
    renderTable([])

    expect(document.querySelectorAll('#table-head th')).toHaveLength(0)
    expect(document.querySelectorAll('#table-body tr')).toHaveLength(0)
  })
})
