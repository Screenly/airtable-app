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
  refresh_interval: '30'
  screenly_oauth_tokens_url: 'http://localhost:3000/'
  table_id: '<your Airtable table ID>'
  view_type: 'grid'
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
bun test
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

| Setting            | Type   | Required | Description                                                               |
| ------------------ | ------ | -------- | ------------------------------------------------------------------------- |
| `base_id`          | string | Yes      | Airtable base ID (e.g. `appXXXXXXXXXXXXXX`)                               |
| `table_id`         | string | Yes      | Airtable table ID within the base (e.g. `tblXXXXXXXXXXXXXX`)              |
| `view_type`        | string | No       | Type of view to use when fetching records. Default: `grid`                |
| `refresh_interval` | string | No       | How often (in seconds) to refresh Airtable data. Default: `30`            |
| `display_errors`   | string | No       | Display errors on screen for debugging (`true`/`false`). Default: `false` |

### View Types

| Value      | Description   |
| ---------- | ------------- |
| `grid`     | Grid view     |
| `calendar` | Calendar view |
| `gallery`  | Gallery view  |
| `block`    | Gantt view    |
| `kanban`   | Kanban view   |
| `timeline` | Timeline view |
| `form`     | Form view     |

## Authentication

This app uses the Screenly OAuth service to obtain an Airtable access token at runtime. For local development, the `mock-server` acts as a stand-in for that service.

## Finding Your IDs

Navigate to your table in Airtable. The base ID, table ID, and view ID are all present in the URL:

```
https://airtable.com/appXXXXXXXXXXXXXX/tblXXXXXXXXXXXXXX/viwXXXXXXXXXXXXXX
                     ^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^
                     Base ID             Table ID            View ID
```

| Prefix | Entity |
| ------ | ------ |
| `app`  | Base   |
| `tbl`  | Table  |
| `viw`  | View   |
