# Mock Server

A local OAuth helper for the Airtable Edge App. It handles the Airtable OAuth 2.0 Authorization Code + PKCE flow, stores the resulting tokens in SQLite, and exposes them via an endpoint that mimics the Screenly OAuth service.

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- An [Airtable OAuth integration](https://airtable.com/create/oauth) with `http://localhost:3000/oauth/callback` registered as the redirect URI

## Setting Up an Airtable OAuth Integration

1. Go to [airtable.com/create/oauth](https://airtable.com/create/oauth)
2. Fill in a name (e.g. `Screenly OAuth App`) and description
3. Under **OAuth redirect URL**, add `http://localhost:3000/oauth/callback`
4. Under **Scopes**, enable `data.records:read` and `schema.bases:read`
5. Copy the **Client ID** — this is your `AIRTABLE_CLIENT_ID`
6. Click **Generate client secret** and copy the value as `AIRTABLE_CLIENT_SECRET`. The mock server exchanges and refreshes tokens from a server process, so using a client secret is recommended as a security best practice. Without it, only the PKCE verifier protects the exchange, which is fine for quick local testing.

## Getting Started

```bash
cp .env.example .env
```

Fill in your Airtable Client ID in `.env`:

```
AIRTABLE_CLIENT_ID=your_airtable_client_id_here
```

Then install dependencies and start the server:

```bash
bun install
bun run dev
```

Open `http://localhost:3000` in a browser and click **Connect to Airtable**.

## How It Works

1. The server generates a PKCE code verifier and challenge, then redirects you to Airtable's authorization page.
2. You log in with your Airtable credentials and grant access to the requested bases.
3. Airtable redirects back to `/oauth/callback` with an authorization code.
4. The server exchanges the code for tokens using the PKCE verifier and stores the `access_token`, `refresh_token`, and `scope` in a local SQLite database (`auth.db`).
5. The access token is automatically refreshed every 50 minutes in the background.
6. The Edge App calls `GET /access_token/` to retrieve the current token at runtime.

## Endpoints

| Endpoint              | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `GET /`               | UI showing auth status, tokens, and controls              |
| `POST /start`         | Generates PKCE params and redirects to Airtable OAuth     |
| `GET /oauth/callback` | Exchanges the authorization code for tokens               |
| `GET /access_token/`  | Returns `{ token, metadata: { scope } }` for the Edge App |
| `POST /clear`         | Clears stored tokens                                      |

## Connecting to the Edge App

In `mock-data.yml` (at the repository root), set:

```yaml
settings:
  screenly_oauth_tokens_url: 'http://localhost:3000/'
```

The Edge App will call `GET /access_token/` on startup and whenever `getCredentials()` is invoked.
