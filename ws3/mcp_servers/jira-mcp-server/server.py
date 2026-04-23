import os
import sys
import json
from contextlib import asynccontextmanager
from mcp.server.fastmcp import FastMCP
from auth import get_auth_headers
from jira_client import JiraClient, JiraAuthError, JiraNotFoundError

jira_url = os.environ.get("JIRA_URL")
if not jira_url:
    print("JIRA_URL environment variable is required", file=sys.stderr)
    sys.exit(1)

try:
    auth_headers = get_auth_headers(
        jira_pat=os.environ.get("JIRA_PAT"),
        session_cookie=os.environ.get("JIRA_SESSION_COOKIE"),
    )
except ValueError as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)

client = JiraClient(base_url=jira_url, auth_headers=auth_headers)


@asynccontextmanager
async def lifespan(server):
    try:
        user_info = await client.verify()
        print(
            f"Connected to Jira as {user_info.get('displayName', user_info.get('name', 'unknown'))}",
            file=sys.stderr,
        )
    except JiraAuthError as e:
        print(f"Authentication failed: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Cannot reach Jira at {jira_url}: {e}", file=sys.stderr)
        sys.exit(1)
    try:
        yield
    finally:
        await client.close()


mcp = FastMCP("jira", lifespan=lifespan)


@mcp.tool()
async def search_issues(jql: str, max_results: int = 50) -> str:
    """Search Jira issues using JQL.

    Args:
        jql: JQL query string (e.g., "project = TEST AND status = Open")
        max_results: Maximum number of results to return (default 50)
    """
    try:
        results = await client.search(jql, max_results)
        return json.dumps(results, indent=2)
    except (JiraAuthError, JiraNotFoundError) as e:
        return f"Error: {e}"


@mcp.tool()
async def get_issue(issue_key: str) -> str:
    """Get detailed information about a Jira issue.

    Args:
        issue_key: The issue key (e.g., "PROJ-123")
    """
    try:
        result = await client.get_issue(issue_key)
        return json.dumps(result, indent=2)
    except JiraNotFoundError:
        return f"Error: Issue {issue_key} not found"
    except JiraAuthError as e:
        return f"Error: {e}"


@mcp.tool()
async def assign_issue(issue_key: str, assignee: str) -> str:
    """Assign a Jira issue to a user.

    Args:
        issue_key: The issue key (e.g., "PROJ-123")
        assignee: Jira username to assign the issue to
    """
    try:
        await client.assign(issue_key, assignee)
        return f"Assigned {issue_key} to {assignee}"
    except JiraNotFoundError:
        return f"Error: Issue {issue_key} not found"
    except (JiraAuthError, PermissionError) as e:
        return f"Error: {e}"


@mcp.tool()
async def transition_issue(issue_key: str, transition_name: str) -> str:
    """Change the status of a Jira issue.

    Args:
        issue_key: The issue key (e.g., "PROJ-123")
        transition_name: Name of the transition (e.g., "In Progress", "Done")
    """
    try:
        new_status = await client.transition(issue_key, transition_name)
        return f"Transitioned {issue_key} to {new_status}"
    except JiraNotFoundError:
        return f"Error: Issue {issue_key} not found"
    except ValueError as e:
        return f"Error: {e}"
    except (JiraAuthError, PermissionError) as e:
        return f"Error: {e}"


@mcp.tool()
async def add_comment(issue_key: str, body: str) -> str:
    """Add a comment to a Jira issue.

    Args:
        issue_key: The issue key (e.g., "PROJ-123")
        body: Comment text
    """
    try:
        comment_id = await client.add_comment(issue_key, body)
        return f"Added comment {comment_id} to {issue_key}"
    except JiraNotFoundError:
        return f"Error: Issue {issue_key} not found"
    except (JiraAuthError, PermissionError) as e:
        return f"Error: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
