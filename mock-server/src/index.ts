import cors from 'cors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  AIRTABLE_AUTH_URL,
  AIRTABLE_TOKEN_URL,
  AIRTABLE_SCOPES,
  REDIRECT_URI,
} from './constants'
import {
  saveTokens,
  loadTokens,
  clearTokens,
  saveOAuthState,
  getOAuthState,
  clearOAuthState,
} from './db'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from './pkce'
import { startRefreshLoop } from './refresh'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_ID = process.env.AIRTABLE_CLIENT_ID
const PORT = 3000

if (!CLIENT_ID) {
  console.error('Error: AIRTABLE_CLIENT_ID environment variable is required.')
  process.exit(1)
}

const app = express()
app.use(cors({ origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ }))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, '..', 'dist')))
app.use(
  '/vendor/htmx',
  express.static(path.join(__dirname, '..', 'node_modules', 'htmx.org', 'dist'))
)
app.use(
  '/vendor/alpine',
  express.static(path.join(__dirname, '..', 'node_modules', 'alpinejs', 'dist'))
)
app.use(
  '/vendor/lucide',
  express.static(
    path.join(__dirname, '..', 'node_modules', 'lucide', 'dist', 'umd')
  )
)

interface TokenData {
  access_token: string
  refresh_token: string
  scope: string
}

async function exchangeCodeForTokens(
  code: string,
  verifier: string
): Promise<TokenData | null> {
  const clientSecret = process.env.AIRTABLE_CLIENT_SECRET

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (clientSecret) {
    const creds = Buffer.from(`${CLIENT_ID}:${clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${creds}`
  } else {
    body.set('client_id', CLIENT_ID!)
  }

  const res = await fetch(AIRTABLE_TOKEN_URL, {
    method: 'POST',
    headers,
    body: body.toString(),
  })

  if (!res.ok) return null
  return (await res.json()) as TokenData
}

app.get('/', (_req, res) => {
  res.render('index', { tokens: loadTokens() })
})

app.post('/start', (_req, res) => {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const state = generateState()

  saveOAuthState(state, verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: AIRTABLE_SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  res.redirect(`${AIRTABLE_AUTH_URL}?${params.toString()}`)
})

app.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query

  if (error) {
    res.render('error', { message: `Authorization failed: ${error}` })
    return
  }

  if (typeof code !== 'string' || typeof state !== 'string') {
    res.render('error', { message: 'Missing code or state in callback.' })
    return
  }

  const stored = getOAuthState(state)
  if (!stored) {
    res.render('error', {
      message: 'Invalid or expired OAuth state. Please try again.',
    })
    return
  }

  const data = await exchangeCodeForTokens(code, stored.code_verifier)
  if (!data) {
    res.render('error', {
      message: 'Token exchange failed. Check server logs.',
    })
    return
  }

  clearOAuthState()
  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    scope: data.scope,
  })

  res.redirect('/')
})

// Matches the shape expected by getCredentials() in @screenly/edge-apps.
// Set screenly_oauth_tokens_url=http://localhost:3000/ in mock-data.yml.
app.get('/access_token/', (_req, res) => {
  const tokens = loadTokens()
  if (!tokens) {
    res
      .status(401)
      .json({ error: 'No tokens stored. Please authenticate first.' })
    return
  }
  res.json({ token: tokens.access_token, metadata: { scope: tokens.scope } })
})

app.post('/clear', (_req, res) => {
  clearTokens()
  res.redirect('/')
})

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`)
  startRefreshLoop()
})
