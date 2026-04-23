# Docupedia MCP Server

An MCP (Model Context Protocol) server for Docupedia (Bosch's internal Confluence Server/Data Center). Supports two authentication methods: PAT token (private network) or browser session cookies (Entra SSO with 2FA/device compliance for users outside the private network).

## Authentication

The server automatically selects the auth method based on which environment variable is set:

- **PAT token** (`DOCUPEDIA_PAT`): Use when on the private network. Set this env var and the server uses it as a `Bearer` token.
- **Session cookie** (`DOCUPEDIA_SESSION_COOKIE`): Use when outside the private network. Log into Docupedia via browser (Entra SSO), then copy the full cookie string from browser DevTools.

If both are set, `DOCUPEDIA_PAT` takes precedence.

### Getting the session cookie (outside private network)

1. Open Docupedia in your browser and log in via Entra SSO (2FA + device check)
2. Press **F12** to open DevTools
3. Go to the **Network** tab, click any Docupedia request
4. In **Request Headers**, find the `Cookie:` header
5. Copy the entire value and use it as `DOCUPEDIA_SESSION_COOKIE`

> **Note:** Session cookies expire within hours. When the server returns an auth error, repeat the steps above to get a fresh cookie.

## Environment Variables

| Variable                 | Required | Description                              |
|--------------------------|----------|------------------------------------------|
| `DOCUPEDIA_URL`          | Yes      | Base Docupedia URL (e.g., `https://docupedia.bosch.com`) |
| `DOCUPEDIA_PAT`          | No*      | Personal Access Token                    |
| `DOCUPEDIA_SESSION_COOKIE` | No*      | Full cookie string from browser DevTools |

*At least one of `DOCUPEDIA_PAT` or `DOCUPEDIA_SESSION_COOKIE` must be set.

## MCP Tools

| Tool | Description |
|------|-------------|
| `search_pages` | Search pages using CQL (e.g., `text ~ "hello"`) |
| `get_page` | Get page content by ID (returned as plain text) |
| `list_pages_in_space` | List pages in a space by space key |
| `create_page` | Create a new page (plain text body, optional parent) |
| `update_page` | Update an existing page's title and content |
| `add_comment` | Add a comment to a page |

## Running with uv (local)

```bash
uv sync
```

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "docupedia": {
      "type": "stdio",
      "command": "uv",
      "args": ["run", "--directory", "docupedia-mcp-server", "server.py"],
      "env": {
        "DOCUPEDIA_URL": "https://docupedia.bosch.com",
        "DOCUPEDIA_SESSION_COOKIE": "<paste full cookie string here>"
      }
    }
  }
}
```

## Running with Docker

**Build the image:**

```bash
docker build -t docupedia-mcp-server .
```

**Add to your `.mcp.json`:**

```json
{
  "mcpServers": {
    "docupedia-docker": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "DOCUPEDIA_URL",
        "-e", "DOCUPEDIA_PAT",
        "-e", "DOCUPEDIA_SESSION_COOKIE",
        "docupedia-mcp-server"
      ],
      "env": {
        "DOCUPEDIA_URL": "https://docupedia.bosch.com",
        "DOCUPEDIA_SESSION_COOKIE": "<paste full cookie string here>"
      }
    }
  }
}
```

> **Note:** The `-i` flag is required (keeps stdin open for the MCP stdio protocol). Do **not** add `-t`.

## Running tests

```bash
uv sync --all-extras
uv run pytest tests/ -v
```

## Project Structure

```
docupedia-mcp-server/
├── pyproject.toml              # Dependencies and project metadata
├── uv.lock                     # Locked dependencies (run uv sync to generate)
├── Dockerfile                  # Container image (python:3.13-slim + uv)
├── README.md                   # This file
├── server.py                   # MCP server entry point and tool definitions
├── docupedia_client.py         # Async Confluence REST API wrapper
├── auth.py                     # Auth header selection (PAT vs cookie)
└── tests/
    ├── __init__.py
    ├── test_auth.py            # Auth module tests
    └── test_docupedia_client.py # DocupediaClient tests
```
