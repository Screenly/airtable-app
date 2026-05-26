import { AuthError } from './api'
import type { ErrorReporter } from './app'

export type RefreshToken = () => Promise<void>
export type RuntimeState = {
  accessToken: string | null
  credentialError: Error | null
}

export async function withFreshToken(
  getRuntimeState: () => RuntimeState,
  refreshToken: RefreshToken,
  reportError: ErrorReporter,
  action: (token: string) => Promise<void>,
): Promise<void> {
  const { accessToken, credentialError } = getRuntimeState()

  if (!accessToken) {
    reportError(credentialError?.message ?? 'No access token available.')
    return
  }

  let firstErr: unknown
  try {
    await action(accessToken)
    return
  } catch (err) {
    firstErr = err
  }

  if (!(firstErr instanceof AuthError)) {
    reportError(
      firstErr instanceof Error ? firstErr.message : 'Failed to load data.',
    )
    return
  }

  try {
    await refreshToken()
    const { accessToken: refreshed } = getRuntimeState()

    if (!refreshed) {
      reportError('No access token after refresh.')
      return
    }

    await action(refreshed)
  } catch (err) {
    reportError(
      err instanceof Error
        ? err.message
        : 'Session expired. Please re-authenticate.',
    )
  }
}
