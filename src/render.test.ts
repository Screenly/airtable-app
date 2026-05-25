import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import '@screenly/edge-apps/test'
import { renderView } from './render'
import type { ViewData } from './render'
import { DOM } from './test-fixtures'

const GRID_VIEW_DATA: ViewData = {
  tableName: 'Team Directory',
  fields: [
    { id: 'f1', name: 'Name', type: 'singleLineText' },
    { id: 'f2', name: 'Department', type: 'singleLineText' },
  ],
  records: [
    {
      id: 'rec1',
      createdTime: '',
      fields: { Name: 'Alice', Department: 'Engineering' },
    },
  ],
  viewType: 'grid',
  locale: 'en-US',
  timezone: 'UTC',
}

const KANBAN_VIEW_DATA: ViewData = {
  ...GRID_VIEW_DATA,
  viewType: 'kanban',
  fields: [
    { id: 'f1', name: 'Name', type: 'singleLineText' },
    {
      id: 'f2',
      name: 'Status',
      type: 'singleSelect',
      options: {
        choices: [{ id: 's1', name: 'Todo', color: 'blueBright' }],
      },
    },
  ],
  records: [
    { id: 'rec1', createdTime: '', fields: { Name: 'Task A', Status: 'Todo' } },
  ],
}

describe('renderView', () => {
  beforeEach(() => {
    document.body.innerHTML = DOM
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should set the table title', () => {
    renderView(GRID_VIEW_DATA, '')
    expect(document.getElementById('table-title')?.textContent).toBe(
      'Team Directory',
    )
  })

  it('should unhide the table title', () => {
    renderView(GRID_VIEW_DATA, '')
    expect(document.getElementById('table-title')?.hidden).toBe(false)
  })

  it('when viewType is grid, should render table rows', () => {
    renderView(GRID_VIEW_DATA, '')
    expect(document.querySelectorAll('#table-body tr').length).toBe(1)
  })

  it('when viewType is kanban, should render kanban columns', () => {
    renderView(KANBAN_VIEW_DATA, '')
    expect(document.querySelectorAll('.kanban-column').length).toBeGreaterThan(
      0,
    )
  })
})
