import { getLocale, getTimeZone } from '@screenly/edge-apps'
import { fetchTableByViewId, fetchRecords } from './api'
import {
  showScreen,
  showView,
  renderTable,
  recordsToRows,
  trimRowsToFit,
  resolveView,
} from './app'
import { renderKanban } from './kanban'

export async function renderView(
  accessToken: string,
  baseId: string,
  viewId: string,
  stackField: string,
): Promise<void> {
  const table = await fetchTableByViewId(accessToken, baseId, viewId)

  const titleEl = document.getElementById('table-title')
  if (titleEl) {
    titleEl.textContent = table.name
    titleEl.hidden = false
  }

  const { viewType, effectiveViewId } = resolveView(table.views, viewId)

  const records = await fetchRecords(
    accessToken,
    baseId,
    table.id,
    effectiveViewId,
  )

  if (viewType === 'kanban') {
    renderKanban(records, table.fields, stackField)
    showView('kanban')
    showScreen('table-wrapper')
  } else {
    const [locale, timezone] = await Promise.all([getLocale(), getTimeZone()])
    const { headers, rows } = recordsToRows(records, table.fields, {
      locale,
      timezone,
    })
    renderTable(headers, rows)
    showView('grid')
    showScreen('table-wrapper')
    trimRowsToFit()
  }
}
