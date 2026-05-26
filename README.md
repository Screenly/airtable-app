# Airtable App

Displays data from an Airtable base on your Screenly digital signage screens.

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- [Screenly CLI](https://developer.screenly.io/edge-apps/#getting-started)
- An [Airtable](https://airtable.com/) account with at least one base

## Getting Started

Clone the repository and install dependencies:

```bash
gh repo clone Screenly/airtable-app -- --recurse-submodules
bun install
```

## Development

```bash
bun run dev
```

This generates a `mock-data.yml` file (gitignored), starts the dev server, and starts a local CORS proxy on `http://127.0.0.1:8080`.

For local development without depending on the Screenly backend, use the [mock-server](mock-server/README.md). It simulates the Screenly OAuth service by running a local Authorization Code + PKCE flow against Airtable and serving the resulting tokens to the Edge App.

After `mock-data.yml` is generated, fill in your values under `settings`:

```yaml
settings:
  base_id: '<your Airtable base ID>'
  display_errors: 'false'
  override_locale: ''
  override_timezone: ''
  refresh_interval: '30'
  screenly_oauth_tokens_url: 'http://localhost:3000/'
  stack_field: '<single-select field name for kanban stacking, e.g. Status>'
  view_id: '<your Airtable view ID>'
```

## Building

```bash
bun run build
```

## Type Checking

```bash
bun run type-check
```

## Linting & Formatting

```bash
bun run lint
bun run format
```

## Testing

```bash
bun run test
```

## Screenshots

```bash
bun run screenshots
```

## Deployment

```bash
screenly edge-app create --name airtable-app --in-place
bun run deploy
screenly edge-app instance create
```

## Configuration

| Setting             | Type   | Required | Description                                                                                                                                                           |
| ------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `access_token`      | secret | No       | For testing only. In production, the access token is fetched dynamically via the Screenly OAuth service.                                                              |
| `base_id`           | string | Yes      | Airtable base ID (e.g. `appXXXXXXXXXXXXXX`)                                                                                                                           |
| `display_errors`    | string | No       | Display errors on screen for debugging (`true`/`false`). Default: `false`                                                                                             |
| `override_locale`   | string | No       | Override the locale for date formatting (e.g. `en-US`, `fr`). Defaults to GPS-based detection.                                                                        |
| `override_timezone` | string | No       | Override the timezone for date formatting (e.g. `America/New_York`). Defaults to GPS-based detection.                                                                 |
| `refresh_interval`  | string | No       | How often (in seconds) to refresh Airtable data. Default: `30`                                                                                                        |
| `stack_field`       | string | No       | For kanban views: name of the single-select field to stack by (e.g. `Status`). Must be a single-select field. Falls back to the first single-select field if not set. |
| `view_id`           | string | Yes      | Airtable view ID (e.g. `viwXXXXXXXXXXXXXX`). Supports grid and kanban views.                                                                                          |

## Limitations

- A maximum of 100 records are fetched per refresh. Tables with more than 100 records will be truncated.

## Authentication

This app uses the Screenly OAuth service to obtain an Airtable access token at runtime. For local development, the `mock-server` acts as a stand-in for that service.

## Finding Your IDs

Navigate to your view in Airtable. The base ID and view ID are present in the URL:

```
https://airtable.com/appXXXXXXXXXXXXXX/tblXXXXXXXXXXXXXX/viwXXXXXXXXXXXXXX
                     ^^^^^^^^^^^^^^^^^^                     ^^^^^^^^^^^^^^^^^^
                     Base ID                                View ID
```

| Prefix | Entity |
| ------ | ------ |
| `app`  | Base   |
| `viw`  | View   |
