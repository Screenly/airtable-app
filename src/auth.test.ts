import { describe, it, expect, mock } from 'bun:test'
import '@screenly/edge-apps/test'
import { withFreshToken } from './auth'
import { AuthError } from './api'

/* eslint-disable max-lines-per-function */
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

  it('when accessToken is null, should call reportError with credential error message', async () => {
    const getRuntimeState = mock(() => ({
      accessToken: null,
      credentialError: new Error('network failure'),
    }))
    const refreshToken = mock(async () => {})
    const reportError = mock((_msg: string) => {})
    const action = mock(async (_token: string) => {})

    await withFreshToken(getRuntimeState, refreshToken, reportError, action)

    expect(action).not.toHaveBeenCalled()
    expect(refreshToken).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalledWith('network failure')
  })

  it('when first call succeeds, should not refresh or retry', async () => {
    const getRuntimeState = mock(() => ({
      accessToken: 'valid-token',
      credentialError: null,
    }))
    const refreshToken = mock(async () => {})
    const reportError = mock((_msg: string) => {})
    const action = mock(async (_token: string) => {})

    await withFreshToken(getRuntimeState, refreshToken, reportError, action)

    expect(action).toHaveBeenCalledTimes(1)
    expect(refreshToken).not.toHaveBeenCalled()
    expect(reportError).not.toHaveBeenCalled()
  })

  it('when refreshed token is null after refresh, should call reportError', async () => {
    let refreshed = false
    const getRuntimeState = mock(() => ({
      accessToken: refreshed ? null : 'expired-token',
      credentialError: null,
    }))
    const refreshToken = mock(async () => {
      refreshed = true
    })
    const reportError = mock((_msg: string) => {})
    const action = mock(async () => {
      throw new AuthError()
    })

    await withFreshToken(getRuntimeState, refreshToken, reportError, action)

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledWith('No access token after refresh.')
  })
})
/* eslint-enable max-lines-per-function */
