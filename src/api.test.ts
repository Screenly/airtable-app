import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { fetchTableByViewId, fetchRecords, AuthError } from './api'

const TOKEN = 'test-token'
const BASE_ID = 'appABC123'
const TABLE_ID = 'tblXYZ456'
const VIEW_ID = 'viw1'

const MOCK_TABLE = {
  id: TABLE_ID,
  name: 'Team Directory',
  fields: [{ id: 'fld1', name: 'Name', type: 'singleLineText' }],
  views: [{ id: VIEW_ID, name: 'Grid view', type: 'grid' }],
}

const MOCK_RECORDS = [
  {
    id: 'rec1',
    fields: { Name: 'Alice' },
    createdTime: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rec2',
    fields: { Name: 'Bob' },
    createdTime: '2024-01-02T00:00:00.000Z',
  },
]

function makeResponse(status: number, body: unknown, statusText = '') {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = mock(() => Promise.resolve(new Response()))

describe('fetchTableByViewId', () => {
  beforeEach(() => {
    globalThis.fetch = fetchMock
    fetchMock.mockImplementation(() =>
      Promise.resolve(makeResponse(200, { tables: [MOCK_TABLE] })),
    )
  })

  afterEach(() => {
    fetchMock.mockReset()
  })

  test('returns the table containing the view', async () => {
    const table = await fetchTableByViewId(TOKEN, BASE_ID, VIEW_ID)
    expect(table).toEqual(MOCK_TABLE)
  })

  test('sends Authorization header', async () => {
    await fetchTableByViewId(TOKEN, BASE_ID, VIEW_ID)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((options?.headers as Record<string, string>)?.Authorization).toBe(
      `Bearer ${TOKEN}`,
    )
  })

  test('throws AuthError on 401', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(makeResponse(401, {})))
    await expect(
      fetchTableByViewId(TOKEN, BASE_ID, VIEW_ID),
    ).rejects.toBeInstanceOf(AuthError)
  })

  test('throws AuthError on 403', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(makeResponse(403, {})))
    await expect(
      fetchTableByViewId(TOKEN, BASE_ID, VIEW_ID),
    ).rejects.toBeInstanceOf(AuthError)
  })

  test('throws on non-ok status', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(makeResponse(500, {}, 'Internal Server Error')),
    )
    await expect(fetchTableByViewId(TOKEN, BASE_ID, VIEW_ID)).rejects.toThrow(
      'Failed to fetch table schema: 500 Internal Server Error',
    )
  })

  test('throws when no table contains the view', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(makeResponse(200, { tables: [] })),
    )
    await expect(fetchTableByViewId(TOKEN, BASE_ID, VIEW_ID)).rejects.toThrow(
      `No table found containing view '${VIEW_ID}' in base '${BASE_ID}'`,
    )
  })
})

describe('fetchRecords', () => {
  beforeEach(() => {
    globalThis.fetch = fetchMock
    fetchMock.mockImplementation(() =>
      Promise.resolve(makeResponse(200, { records: MOCK_RECORDS })),
    )
  })

  afterEach(() => {
    fetchMock.mockReset()
  })

  test('returns records on success', async () => {
    const records = await fetchRecords(TOKEN, BASE_ID, TABLE_ID)
    expect(records).toEqual(MOCK_RECORDS)
  })

  test('includes pageSize=100 in URL', async () => {
    await fetchRecords(TOKEN, BASE_ID, TABLE_ID)
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('pageSize=100')
  })

  test('includes view param when viewId is provided', async () => {
    await fetchRecords(TOKEN, BASE_ID, TABLE_ID, 'viwABC123')
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('view=viwABC123')
  })

  test('omits view param when viewId is not provided', async () => {
    await fetchRecords(TOKEN, BASE_ID, TABLE_ID)
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).not.toContain('view=')
  })

  test('throws AuthError on 401', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(makeResponse(401, {})))
    await expect(fetchRecords(TOKEN, BASE_ID, TABLE_ID)).rejects.toBeInstanceOf(
      AuthError,
    )
  })

  test('throws AuthError on 403', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(makeResponse(403, {})))
    await expect(fetchRecords(TOKEN, BASE_ID, TABLE_ID)).rejects.toBeInstanceOf(
      AuthError,
    )
  })

  test('throws on non-ok status', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(makeResponse(500, {}, 'Internal Server Error')),
    )
    await expect(fetchRecords(TOKEN, BASE_ID, TABLE_ID)).rejects.toThrow(
      'Failed to fetch records: 500 Internal Server Error',
    )
  })
})
