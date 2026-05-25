import { getLocale, getTimeZone } from '@screenly/edge-apps'
import type { AirtableField, AirtableRecord } from './api'
import { fetchTableByViewId, fetchRecords } from './api'
import {
  showScreen,
  showView,
  renderTable,
  recordsToRows,
  trimRowsToFit,
  resolveView,
} from './app'
import type { ViewType } from './app'
import { renderKanban } from './kanban'

export type ViewData = {
  tableName: string
  fields: AirtableField[]
  records: AirtableRecord[]
  viewType: ViewType
  locale: string
  timezone: string
}

export async function fetchViewData(
  accessToken: string,
  baseId: string,
  viewId: string,
): Promise<ViewData> {
  const table = await fetchTableByViewId(accessToken, baseId, viewId)
  const { viewType, effectiveViewId } = resolveView(table.views, viewId)

  // Locale and timezone are only needed for grid view date formatting.
  // Skipping them for kanban avoids unnecessary calls that could fail on players.
  const [records, locale, timezone] = await Promise.all([
    fetchRecords(accessToken, baseId, table.id, effectiveViewId),
    viewType === 'grid' ? getLocale() : Promise.resolve(''),
    viewType === 'grid' ? getTimeZone() : Promise.resolve(''),
  ])

  return {
    tableName: table.name,
    fields: table.fields,
    records,
    viewType,
    locale,
    timezone,
  }
}

export function renderView(viewData: ViewData, stackField: string): void {
  const titleEl = document.getElementById('table-title')
  if (titleEl) {
    titleEl.textContent = viewData.tableName
    titleEl.hidden = false
  }

  if (viewData.viewType === 'kanban') {
    renderKanban(viewData.records, viewData.fields, stackField)
    showView('kanban')
  } else {
    const { headers, rows } = recordsToRows(viewData.records, viewData.fields, {
      locale: viewData.locale,
      timezone: viewData.timezone,
    })
    renderTable(headers, rows)
    showView('grid')
    trimRowsToFit()
  }

  showScreen('table-wrapper')
}
