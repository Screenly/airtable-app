import './css/style.css'
import '@screenly/edge-apps/components'
import {
  getCredentials,
  getLocale,
  getSettingWithDefault,
  getTimeZone,
  initTokenRefreshLoop,
  setupErrorHandling,
  setupTheme,
  signalReady,
} from '@screenly/edge-apps'
import { fetchTableSchema, fetchRecords, AuthError } from './api'
import {
  showError,
  showScreen,
  renderTable,
  recordsToRows,
  trimRowsToFit,
} from './app'

type RefreshToken = () => Promise<void>
type RuntimeState = {
  accessToken: string | null
  credentialError: Error | null
}

function handleError(message: string, displayErrors: boolean): void {
  if (displayErrors) throw new Error(message)
  showError(message)
}

async function loadAndRender(
  accessToken: string,
  baseId: string,
  tableId: string,
): Promise<void> {
  const table = await fetchTableSchema(accessToken, baseId, tableId)

  const titleEl = document.getElementById('table-title')
  if (titleEl) {
    titleEl.textContent = table.name
    titleEl.hidden = false
  }

  const gridView = table.views.find((v) => v.type === 'grid')
  const records = await fetchRecords(accessToken, baseId, tableId, gridView?.id)
  const [locale, timezone] = await Promise.all([getLocale(), getTimeZone()])
  const { headers, rows } = recordsToRows(records, table.fields, {
    locale,
    timezone,
  })

  renderTable(headers, rows)
  showScreen('table-wrapper')
  trimRowsToFit()
}

async function fetchAndRender(
  baseId: string,
  tableId: string,
  getRuntimeState: () => RuntimeState,
  refreshToken: RefreshToken,
  displayErrors: boolean,
): Promise<void> {
  let { accessToken } = getRuntimeState()
  const { credentialError } = getRuntimeState()

  if (!accessToken) {
    handleError(
      credentialError?.message ?? 'No access token available.',
      displayErrors,
    )
    return
  }

  try {
    await loadAndRender(accessToken, baseId, tableId)
    return
  } catch (err) {
    if (!(err instanceof AuthError)) {
      handleError(
        err instanceof Error ? err.message : 'Failed to load data.',
        displayErrors,
      )
      return
    }
  }

  try {
    await refreshToken()
    ;({ accessToken } = getRuntimeState())

    if (!accessToken) {
      handleError('No access token after refresh.', displayErrors)
      return
    }

    await loadAndRender(accessToken, baseId, tableId)
  } catch (retryErr) {
    handleError(
      retryErr instanceof Error
        ? retryErr.message
        : 'Session expired. Please re-authenticate.',
      displayErrors,
    )
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupErrorHandling()
  setupTheme()

  const baseId = getSettingWithDefault<string>('base_id', '')
  const tableId = getSettingWithDefault<string>('table_id', '')
  const refreshInterval = getSettingWithDefault<number>('refresh_interval', 30)
  const displayErrors =
    getSettingWithDefault<string>('display_errors', 'false') === 'true'

  if (!baseId) {
    showError('Please configure the Base ID in settings.')
    signalReady()
    return
  }

  if (!tableId) {
    showError('Please configure the Table ID in settings.')
    signalReady()
    return
  }

  let accessToken: string | null = null
  let credentialError: Error | null = null

  const refreshToken = async () => {
    const devToken = getSettingWithDefault<string>('access_token', '')
    if (devToken) {
      accessToken = devToken
      credentialError = null
      return
    }
    const { token } = await getCredentials()
    accessToken = token
    credentialError = null
  }

  try {
    await refreshToken()
  } catch (err) {
    credentialError = err instanceof Error ? err : new Error(String(err))
    console.warn('Failed to fetch initial credentials:', err)
  }

  initTokenRefreshLoop(refreshToken)

  const getRuntimeState = (): RuntimeState => ({ accessToken, credentialError })

  const run = () =>
    fetchAndRender(
      baseId,
      tableId,
      getRuntimeState,
      refreshToken,
      displayErrors,
    )

  await run()
  signalReady()

  setInterval(async () => {
    try {
      await run()
    } catch (err) {
      console.error('Refresh failed:', err)
    }
  }, refreshInterval * 1000)
})
