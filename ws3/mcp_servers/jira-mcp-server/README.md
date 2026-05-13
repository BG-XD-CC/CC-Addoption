# Jira MCP Server

An MCP (Model Context Protocol) server for Jira Server/Data Center. Supports two authentication methods: PAT token (BCN) or browser session cookies (Entra SSO with 2FA/device compliance for Internet client users).

## Authentication

The server automatically selects the auth method based on which environment variable is set:

- **PAT token** (`JIRA_PAT`): Use when on the private network. Set this env var and the server uses it as a `Bearer` token.
- **Session cookie** (`JIRA_SESSION_COOKIE`): Use when outside the private network. Log into Jira via browser (Entra SSO), then copy the full cookie string from browser DevTools.

If both are set, `JIRA_PAT` takes precedence.

### Getting the session cookie (outside private network)

1. Open Jira in your browser and log in via Entra SSO (2FA + device check)
2. Press **F12** to open DevTools
3. Go to the **Network** tab, click any Jira request
4. In **Request Headers**, find the `Cookie:` header
5. Copy the entire value and use it as `JIRA_SESSION_COOKIE`

> **Note:** Session cookies expire within hours. When the server returns an auth error, repeat the steps above to get a fresh cookie.

## Environment Variables

| Variable              | Required | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `JIRA_URL`            | Yes      | Base Jira URL (e.g., `https://jira.example.com`) |
| `JIRA_PAT`            | No\*     | Personal Access Token                            |
| `JIRA_SESSION_COOKIE` | No\*     | Full cookie string from browser DevTools         |

\*At least one of `JIRA_PAT` or `JIRA_SESSION_COOKIE` must be set.

## MCP Tools

| Tool               | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `search_issues`    | Search issues using JQL (e.g., `assignee = currentUser()`) |
| `get_issue`        | Get full details of an issue by key (e.g., `PROJ-123`)     |
| `assign_issue`     | Assign an issue to a Jira username                         |
| `transition_issue` | Change issue status (e.g., "In Progress", "Done")          |
| `add_comment`      | Add a comment to an issue                                  |

## Where to put the config (Claude Code)

> ⚠️ **Heads up:** Claude Code reads MCP server config from one of these locations — **NOT** from `~/.claude/mcp.json` (that path is ignored by the CLI):
>
> - **`~/.claude.json`** — user-global config, root-level `mcpServers` key. This is what `claude mcp add` writes to.
> - **`<project>/.mcp.json`** — project-scoped, only loaded when running `claude` from that directory.
>
> If you put your config in `~/.claude/mcp.json` and the server says `MCP error -32000: Connection closed`, that's almost certainly why. Move the entry to `~/.claude.json` (or use `claude mcp add`) and reconnect.

## Running with uv (local)

```bash
uv sync
```

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "jira": {
      "type": "stdio",
      "command": "uv",
      "args": ["run", "--directory", "jira-mcp-server", "server.py"],
      "env": {
        "JIRA_URL": "https://jira.example.com",
        "JIRA_SESSION_COOKIE": "<paste full cookie string here>"
      }
    }
  }
}
```

## Running with Docker

**Build the image:**

```bash
docker build -t jira-mcp-server .
```

**Add to your `.mcp.json`:**

```json
{
  "mcpServers": {
    "jira-docker": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "JIRA_URL",
        "-e",
        "JIRA_SESSION_COOKIE",
        "jira-mcp-server"
      ],
      "env": {
        "JIRA_URL": "https://jira.example.com",
        "JIRA_SESSION_COOKIE": "<paste full cookie string here>"
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
jira-mcp-server/
├── pyproject.toml       # Dependencies and project metadata
├── Dockerfile           # Container image (python:3.13-slim + uv)
├── server.py            # MCP server entry point and tool definitions
├── jira_client.py       # Async Jira REST API wrapper
├── auth.py              # Auth header selection (PAT vs cookie)
└── tests/
    ├── test_auth.py      # Auth module tests
    └── test_jira_client.py  # JiraClient tests
```
