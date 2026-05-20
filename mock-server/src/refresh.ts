import { AIRTABLE_TOKEN_URL } from './constants'
import { loadTokens, saveTokens } from './db'

const REFRESH_INTERVAL_MS = 50 * 60 * 1000

interface TokenRefreshResponse {
  access_token: string
  refresh_token?: string
  scope?: string
}

async function refreshTokens(): Promise<void> {
  const tokens = loadTokens()
  if (!tokens) return

  const clientId = process.env.AIRTABLE_CLIENT_ID!
  const clientSecret = process.env.AIRTABLE_CLIENT_SECRET

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: clientId,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (clientSecret) {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${creds}`
    body.delete('client_id')
  }

  const res = await fetch(AIRTABLE_TOKEN_URL, {
    method: 'POST',
    headers,
    body: body.toString(),
  })

  if (!res.ok) {
    console.error(`Token refresh failed: ${res.status}`)
    return
  }

  const data = (await res.json()) as TokenRefreshResponse

  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? tokens.refresh_token,
    scope: data.scope ?? tokens.scope,
  })

  console.log(`Access token refreshed at ${new Date().toISOString()}`)
}

export function startRefreshLoop(): void {
  setInterval(async () => {
    try {
      await refreshTokens()
    } catch (err) {
      console.error('Token refresh error:', err)
    }
  }, REFRESH_INTERVAL_MS)
}
