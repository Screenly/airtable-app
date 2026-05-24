import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import '@screenly/edge-apps/test'
import { renderKanban } from './kanban'

const DOM = '<div id="kanban-board"></div>'

const FIELDS = [
  { id: 'f1', name: 'Name', type: 'singleLineText' },
  {
    id: 'f2',
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { id: 's1', name: 'Todo', color: 'blueBright' },
        { id: 's2', name: 'Done', color: 'greenBright' },
      ],
    },
  },
]

const RECORDS = [
  { id: 'rec1', createdTime: '', fields: { Name: 'Task A', Status: 'Todo' } },
  { id: 'rec2', createdTime: '', fields: { Name: 'Task B', Status: 'Done' } },
  { id: 'rec3', createdTime: '', fields: { Name: 'Task C', Status: 'Done' } },
  { id: 'rec4', createdTime: '', fields: { Name: 'Task D' } },
]

const NON_TEXT_PRIMARY_FIELDS = [
  { id: 'f1', name: 'Score', type: 'number' },
  { id: 'f2', name: 'Label', type: 'singleLineText' },
  {
    id: 'f3',
    name: 'Status',
    type: 'singleSelect',
    options: { choices: [{ id: 's1', name: 'Todo', color: 'blueBright' }] },
  },
]

const NON_TEXT_PRIMARY_RECORDS = [
  {
    id: 'rec1',
    createdTime: '',
    fields: { Score: 42, Label: 'Task A', Status: 'Todo' },
  },
]

describe('renderKanban', () => {
  beforeEach(() => {
    document.body.innerHTML = DOM
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render one column per choice plus one uncategorized column', () => {
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column').length).toBe(3)
  })

  it('should render column titles in choice order with No Status last', () => {
    renderKanban(RECORDS, FIELDS)
    const titles = [...document.querySelectorAll('.kanban-column-title')].map(
      (el) => el.textContent,
    )
    expect(titles).toEqual(['Todo', 'Done', 'No Status'])
  })

  it('should not render count badges', () => {
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column-count').length).toBe(0)
  })

  it('should render card titles using the primary text field', () => {
    renderKanban(RECORDS, FIELDS)
    const firstCard = document
      .querySelectorAll('.kanban-column')[0]
      .querySelector('.kanban-card-title')
    expect(firstCard?.textContent).toBe('Task A')
  })

  it('when primary field is non-text, should fall back to first text field', () => {
    renderKanban(NON_TEXT_PRIMARY_RECORDS, NON_TEXT_PRIMARY_FIELDS)
    const cardTitle = document.querySelector('.kanban-card-title')
    expect(cardTitle?.textContent).toBe('Task A')
  })

  it('should render color dots only for choices that have a color', () => {
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column-dot').length).toBe(2)
  })

  it('when all records have a status, should omit the uncategorized column', () => {
    renderKanban(RECORDS.slice(0, 3), FIELDS)
    const titles = [...document.querySelectorAll('.kanban-column-title')].map(
      (el) => el.textContent,
    )
    expect(titles).not.toContain('No Status')
  })

  it('when called again, should clear and re-render the board', () => {
    renderKanban(RECORDS, FIELDS)
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column').length).toBe(3)
  })

  it('when no singleSelect field exists, should warn and do nothing', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    renderKanban(RECORDS, [{ id: 'f1', name: 'Name', type: 'singleLineText' }])
    expect(document.querySelectorAll('.kanban-column').length).toBe(0)
    expect(warn).toHaveBeenCalledWith(
      'renderKanban: cannot render board: no singleSelect field found in schema',
    )
    warn.mockRestore()
  })

  it('when stack_field names a non-existent field, should warn and do nothing', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    renderKanban(RECORDS, FIELDS, 'Missing')
    expect(document.querySelectorAll('.kanban-column').length).toBe(0)
    expect(warn).toHaveBeenCalledWith(
      'renderKanban: cannot render board: field "Missing" not found or is not a singleSelect',
    )
    warn.mockRestore()
  })
})
