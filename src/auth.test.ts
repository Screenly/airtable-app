import { describe, it, expect, mock } from 'bun:test'
import '@screenly/edge-apps/test'
import { withFreshToken } from './auth'
import { AuthError } from './api'

describe('withFreshToken', () => {
  it('when action throws AuthError, should refresh token and retry', async () => {
    let refreshed = false
    const getRuntimeState = mock(() => ({
      accessToken: refreshed ? 'new-token' : 'expired-token',
      credentialError: null,
    }))
    const refreshToken = mock(async () => {
      refreshed = true
    })
    const reportError = mock((_msg: string) => {})
    const action = mock(async (token: string) => {
      if (token === 'expired-token') {
        throw new AuthError()
      }
    })

    await withFreshToken(getRuntimeState, refreshToken, reportError, action)

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledTimes(2)
    expect(reportError).not.toHaveBeenCalled()
  })

  it('when retry also throws, should call reportError', async () => {
    let callCount = 0
    const getRuntimeState = mock(() => ({
      accessToken: 'token',
      credentialError: null,
    }))
    const refreshToken = mock(async () => {})
    const reportError = mock((_msg: string) => {})
    const action = mock(async () => {
      if (callCount++ === 0) {
        throw new AuthError()
      }
      throw new Error('retry failed')
    })

    await withFreshToken(getRuntimeState, refreshToken, reportError, action)

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledWith('retry failed')
  })
})
