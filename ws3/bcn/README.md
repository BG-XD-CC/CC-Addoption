# MCP Servers Setup — BCN Enterprise Guide

Connect Claude Code to **Jira**, **Docupedia (Confluence)**, and **Bitbucket** in the Bosch enterprise environment.

---

## Prerequisites

### 1. Install `uv` (required for Jira & Docupedia)

`uv` is a fast Python package manager. The MCP Atlassian server runs via `uvx`.

**Mac**
```bash
# Install uv (includes uvx)
brew install uv
```

**Windows**
```powershell
# Option 1 — winget
winget install astral-sh.uv

# Option 2 — PowerShell installer
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Verify (both platforms):
```bash
uvx --version
```

> `uvx` automatically downloads `mcp-atlassian` from PyPI on first run — no cloning or manual installation needed.

---

### 2. Install Node.js / npm (required for Bitbucket)

The Bitbucket MCP server runs via `npx`, which ships with Node.js.

**Mac** — using Homebrew:
```bash
brew install node
```

**Windows** — download the LTS installer from https://nodejs.org and run it.

Verify (both platforms):
```bash
node --version
npm --version
```

---

## Getting Your API Tokens

You need **3 personal access tokens** — one per service. These are generated once and stored in your Claude Code config.

### Jira Token

1. Open: `<JIRA URL>` (your team's tracker instance)
2. Click your avatar (top-right) → **Profile**
3. In the left sidebar go to **Personal Access Tokens** → **Create token**
4. Give it a name (e.g. `claude-code`), set an expiry, and click **Create**
5. Copy the token immediately — you will not see it again

### Docupedia (Confluence) Token

1. Open: <confluence URL>
2. Click your avatar (top-right) → **Settings**
3. Go to **Personal Access Tokens** → **Create token**
4. Copy the token

### Docupedia 2 (Confluence 2) Token

1. Open: <confluence URL>
2. Click your avatar (top-right) → **Settings**
3. Go to **Personal Access Tokens** → **Create token**
4. Copy the token

### Bitbucket Token

1. Open: https://sourcecode.socialcoding.bosch.com
2. Click your avatar (top-right) → **Manage account** or **Profile settings**
3. Go to **Personal access tokens** (or **HTTP access tokens**) → **Create**
4. Select permissions: **Repositories: Read** (add Write if needed)
5. Copy the token

---

## Configure Claude Code

### Step 1 — Open `~/.claude.json`

| Platform | Path |
|----------|------|
| Mac      | `~/.claude.json` |
| Windows  | `C:\Users\<username>\.claude.json` |

### Step 2 — Add the MCP servers

Find the `mcpServers` section (or create it) and add the block below. Replace the placeholder values:

```json
"mcpServers": {
  "jira": {
    "type": "stdio",
    "command": "uvx",
    "args": [
      "mcp-atlassian",
      "--jira-url",
      "<JIRA URL><your-tracker-instance>",
      "--jira-personal-token",
      "YOUR_JIRA_TOKEN_HERE"
    ],
    "env": {}
  },
  "docupedia": {
    "type": "stdio",
    "command": "uvx",
    "args": [
      "mcp-atlassian",
      "--confluence-url",
      "<confluence URL>",
      "--confluence-personal-token",
      "YOUR_DOCUPEDIA_TOKEN_HERE"
    ],
    "env": {}
  },
  "docupedia2": {
    "type": "stdio",
    "command": "uvx",
    "args": [
      "mcp-atlassian",
      "--confluence-url",
      "<confluence URL>",
      "--confluence-personal-token",
      "YOUR_DOCUPEDIA2_TOKEN_HERE"
    ],
    "env": {}
  },
  "bitbucket": {
    "command": "npx",
    "args": [
      "-y",
      "@nexus2520/bitbucket-mcp-server"
    ],
    "env": {
      "BITBUCKET_BASE_URL": "https://sourcecode.socialcoding.bosch.com",
      "BITBUCKET_USERNAME": "YOUR_NT_USERNAME@bosch.com",
      "BITBUCKET_TOKEN": "YOUR_BITBUCKET_TOKEN_HERE"
    }
  }
}
```

> **Security note:** Never commit this file to git. The config file lives outside your project by default.

---

## Verify the Setup

After saving the config, restart Claude Code and run a quick check inside a conversation:

```
List my open Jira issues
```
```
Search Docupedia for "onboarding"
```
```
List repositories I have access to in Bitbucket
```

If Claude responds with real data, your MCP servers are working.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `uvx: command not found` | `uv` not on PATH — restart terminal or re-run install |
| `npx: command not found` | Node.js not installed or not on PATH |
| `401 Unauthorized` | Token is wrong or expired — regenerate it |
| `Connection refused` | Check that the URL is reachable (VPN may be required) |
| MCP server not listed in Claude | Config JSON syntax error — validate with a JSON linter |

### Validate your JSON config

**Mac:**
```bash
cat ~/.claude.json | python3 -m json.tool
```

**Windows (PowerShell):**
```powershell
Get-Content "$env:USERPROFILE\.claude.json" | python -m json.tool
```

A valid file prints the formatted JSON. An invalid file shows the error line.

---

## Notes

- Tokens expire — if something stops working, regenerate the token for that service.
- `mcp-atlassian` covers both Jira and Confluence with separate process instances.
- The Bitbucket MCP server is downloaded automatically by `npx` on first use — no manual install needed.
