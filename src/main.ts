import './css/style.css'
import './css/grid.css'
import './css/kanban.css'
import '@screenly/edge-apps/components'
import {
  getCredentials,
  getSettingWithDefault,
  initTokenRefreshLoop,
  setupErrorHandling,
  setupTheme,
  signalReady,
} from '@screenly/edge-apps'
import { showError, createErrorReporter } from './app'
import { withFreshToken } from './auth'
import type { RuntimeState } from './auth'
import { fetchViewData, renderView } from './render'

document.addEventListener('DOMContentLoaded', async () => {
  setupErrorHandling()
  setupTheme()

  const baseId = getSettingWithDefault<string>('base_id', '')
  const stackField = getSettingWithDefault<string>('stack_field', '')
  const viewId = getSettingWithDefault<string>('view_id', '')
  const refreshInterval = getSettingWithDefault<number>('refresh_interval', 30)
  const displayErrors =
    getSettingWithDefault<string>('display_errors', 'false') === 'true'
  const reportError = createErrorReporter(displayErrors)

  if (!baseId) {
    showError('Please configure the Base ID in settings.')
    signalReady()
    return
  }

  if (!viewId) {
    showError('Please configure the View ID in settings.')
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
    withFreshToken(
      getRuntimeState,
      refreshToken,
      reportError,
      async (token) => {
        const viewData = await fetchViewData(token, baseId, viewId)
        renderView(viewData, stackField)
      },
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
