import { test } from '@playwright/test'
import {
  createMockScreenlyForScreenshots,
  getScreenshotsDir,
  RESOLUTIONS,
  setupClockMock,
  setupScreenlyJsMock,
} from '@screenly/edge-apps/test/screenshots'
import path from 'path'

const BASE_ID = 'appMockBase000001'
const TABLE_ID = 'tblMockTable00001'
const GRID_VIEW_ID = 'viwMockGrid000001'
const KANBAN_VIEW_ID = 'viwMockKanban0001'
const MOCK_TOKEN = 'mock-access-token'
const OAUTH_BASE_URL = 'http://localhost/mock-oauth/'

const MOCK_SCHEMA = {
  tables: [
    {
      id: TABLE_ID,
      name: 'Team Directory',
      fields: [
        { id: 'fld1', name: 'Name', type: 'singleLineText' },
        { id: 'fld2', name: 'Department', type: 'singleLineText' },
        {
          id: 'fld3',
          name: 'Status',
          type: 'singleSelect',
          options: {
            choices: [
              { id: 'sel1', name: 'Active', color: 'greenBright' },
              { id: 'sel2', name: 'On Leave', color: 'yellowBright' },
              { id: 'sel3', name: 'Inactive', color: 'redBright' },
            ],
          },
        },
        {
          id: 'fld4',
          name: 'Tags',
          type: 'multipleSelects',
          options: {
            choices: [
              { id: 'tag1', name: 'Engineering', color: 'blueBright' },
              { id: 'tag2', name: 'Design', color: 'purpleBright' },
              { id: 'tag3', name: 'Remote', color: 'cyanBright' },
              { id: 'tag4', name: 'Lead', color: 'orangeBright' },
            ],
          },
        },
        { id: 'fld5', name: 'Start Date', type: 'date' },
      ],
      views: [
        { id: GRID_VIEW_ID, name: 'Grid View', type: 'grid' },
        { id: KANBAN_VIEW_ID, name: 'Kanban View', type: 'kanban' },
      ],
    },
  ],
}

const MOCK_RECORDS = {
  records: [
    {
      id: 'rec1',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: {
        Name: 'Alice Chen',
        Department: 'Engineering',
        Status: 'Active',
        Tags: ['Engineering', 'Lead', 'Remote'],
        'Start Date': '2021-03-15',
      },
    },
    {
      id: 'rec2',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: {
        Name: 'Bob Martinez',
        Department: 'Design',
        Status: 'Active',
        Tags: ['Design', 'Remote'],
        'Start Date': '2022-07-01',
      },
    },
    {
      id: 'rec3',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: {
        Name: 'Carol Kim',
        Department: 'Engineering',
        Status: 'On Leave',
        Tags: ['Engineering'],
        'Start Date': '2020-11-10',
      },
    },
    {
      id: 'rec4',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: {
        Name: 'David Okafor',
        Department: 'Product',
        Status: 'Active',
        Tags: ['Lead'],
        'Start Date': '2019-05-20',
      },
    },
    {
      id: 'rec5',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: {
        Name: 'Eva Rossi',
        Department: 'Design',
        Status: 'Inactive',
        Tags: ['Design', 'Remote'],
        'Start Date': '2023-02-14',
      },
    },
  ],
}

const VIEWS = [
  { name: 'grid', viewId: GRID_VIEW_ID },
  { name: 'kanban', viewId: KANBAN_VIEW_ID },
]

for (const { name: viewName, viewId } of VIEWS) {
  const { screenlyJsContent } = createMockScreenlyForScreenshots(
    {},
    {
      base_id: BASE_ID,
      display_errors: 'false',
      override_locale: '',
      override_timezone: '',
      refresh_interval: '30',
      screenly_oauth_tokens_url: OAUTH_BASE_URL,
      view_id: viewId,
    },
  )

  for (const { width, height } of RESOLUTIONS) {
    test(`screenshot ${viewName} ${width}x${height}`, async ({ browser }) => {
      const screenshotsDir = getScreenshotsDir()

      const context = await browser.newContext({ viewport: { width, height } })
      const page = await context.newPage()

      await setupClockMock(page)
      await setupScreenlyJsMock(page, screenlyJsContent)

      await page.route(`${OAUTH_BASE_URL}access_token/`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: MOCK_TOKEN,
            metadata: { scope: 'data.records:read schema.bases:read' },
          }),
        })
      })

      await page.route('**/api.airtable.com/**', async (route) => {
        const url = route.request().url()
        const body = url.includes('/meta/bases/')
          ? JSON.stringify(MOCK_SCHEMA)
          : JSON.stringify(MOCK_RECORDS)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body,
        })
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await page.screenshot({
        path: path.join(
          screenshotsDir,
          `${viewName}-${width}x${height}.png`,
        ),
        fullPage: false,
      })

      await context.close()
    })
  }
}
