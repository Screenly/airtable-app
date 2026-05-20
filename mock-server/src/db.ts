import { Database } from 'bun:sqlite'

const db = new Database('auth.db')

db.run(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS oauth_state (
    id INTEGER PRIMARY KEY,
    state TEXT NOT NULL UNIQUE,
    code_verifier TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`)

export interface StoredTokens {
  access_token: string
  refresh_token: string
  scope: string
}

export function saveTokens(tokens: StoredTokens): void {
  db.run('DELETE FROM tokens')
  db.run(
    'INSERT INTO tokens (access_token, refresh_token, scope) VALUES (?, ?, ?)',
    [tokens.access_token, tokens.refresh_token, tokens.scope]
  )
}

export function loadTokens(): StoredTokens | null {
  return (
    db
      .query<StoredTokens, []>(
        'SELECT access_token, refresh_token, scope FROM tokens LIMIT 1'
      )
      .get() ?? null
  )
}

export function clearTokens(): void {
  db.run('DELETE FROM tokens')
}

export function saveOAuthState(state: string, codeVerifier: string): void {
  db.run('DELETE FROM oauth_state')
  db.run('INSERT INTO oauth_state (state, code_verifier) VALUES (?, ?)', [
    state,
    codeVerifier,
  ])
}

export function getOAuthState(
  state: string
): { code_verifier: string } | null {
  return (
    db
      .query<{ code_verifier: string }, [string]>(
        'SELECT code_verifier FROM oauth_state WHERE state = ?'
      )
      .get(state) ?? null
  )
}

export function clearOAuthState(): void {
  db.run('DELETE FROM oauth_state')
}
