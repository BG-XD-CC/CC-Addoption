# Greetings MCP Server

A FastAPI application that exposes MCP tools via FastMCP's streamable-HTTP transport. It provides two tools:

- **`list_languages`** — returns all supported greeting languages
- **`greet`** — greets a person by name in a given language

## Setup

### 1. Install dependencies

```bash
cd ws3/mcp_servers/greetings-mcp-server
uv sync
```

### 2. Start the server

```bash
uv run python server.py
```

Override the port via the `PORT` environment variable (default: `8000`):

```bash
PORT=9000 uv run python server.py
```

The MCP endpoint is available at `http://localhost:<PORT>/mcp`.

## Docker

```bash
docker build -t greetings-mcp-server .
docker run -p 8000:8000 greetings-mcp-server
```

Override the port:

```bash
docker run -e PORT=9000 -p 9000:9000 greetings-mcp-server
```

## Integrating with Claude Code

### Via CLI (recommended)

Make sure the server is running, then register it with:

```bash
claude mcp add --transport http greetings http://localhost:8000/mcp
```

To remove it:

```bash
claude mcp remove greetings
```

### Via .mcp.json

Alternatively, add it manually to your project's `.mcp.json` (or `~/.claude.json` for global config):

```json
{
  "mcpServers": {
    "greetings": {
      "type": "http",
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

You can verify the tools are available inside a Claude Code session by running:

```
/mcp
```
