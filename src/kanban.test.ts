import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
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

  test('renders one column per choice plus uncategorized', () => {
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column').length).toBe(3)
  })

  test('renders column titles in choice order with No Status last', () => {
    renderKanban(RECORDS, FIELDS)
    const titles = [...document.querySelectorAll('.kanban-column-title')].map(
      (el) => el.textContent,
    )
    expect(titles).toEqual(['Todo', 'Done', 'No Status'])
  })

  test('does not render count badges', () => {
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column-count').length).toBe(0)
  })

  test('renders card titles using the first text field', () => {
    renderKanban(RECORDS, FIELDS)
    const firstCard = document
      .querySelectorAll('.kanban-column')[0]
      .querySelector('.kanban-card-title')
    expect(firstCard?.textContent).toBe('Task A')
  })

  test('falls back to first text field when primary field is non-text', () => {
    renderKanban(NON_TEXT_PRIMARY_RECORDS, NON_TEXT_PRIMARY_FIELDS)
    const cardTitle = document.querySelector('.kanban-card-title')
    expect(cardTitle?.textContent).toBe('Task A')
  })

  test('renders color dots only for choices with a color', () => {
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column-dot').length).toBe(2)
  })

  test('omits uncategorized column when all records have a status', () => {
    renderKanban(RECORDS.slice(0, 3), FIELDS)
    const titles = [...document.querySelectorAll('.kanban-column-title')].map(
      (el) => el.textContent,
    )
    expect(titles).not.toContain('No Status')
  })

  test('clears the board on re-render', () => {
    renderKanban(RECORDS, FIELDS)
    renderKanban(RECORDS, FIELDS)
    expect(document.querySelectorAll('.kanban-column').length).toBe(3)
  })

  test('does nothing when no singleSelect field exists', () => {
    renderKanban(RECORDS, [{ id: 'f1', name: 'Name', type: 'singleLineText' }])
    expect(document.querySelectorAll('.kanban-column').length).toBe(0)
  })
})
