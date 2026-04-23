import os
import sys
import json
from contextlib import asynccontextmanager
from mcp.server.fastmcp import FastMCP
from auth import get_auth_headers
from docupedia_client import DocupediaClient, DocupediaAuthError, DocupediaNotFoundError

docupedia_url = os.environ.get("DOCUPEDIA_URL")
if not docupedia_url:
    print("DOCUPEDIA_URL environment variable is required", file=sys.stderr)
    sys.exit(1)

try:
    auth_headers = get_auth_headers(
        docupedia_pat=os.environ.get("DOCUPEDIA_PAT"),
        session_cookie=os.environ.get("DOCUPEDIA_SESSION_COOKIE"),
    )
except ValueError as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)

client = DocupediaClient(base_url=docupedia_url, auth_headers=auth_headers)


@asynccontextmanager
async def lifespan(server):
    try:
        await client.verify()
        print(f"Connected to Docupedia at {docupedia_url}", file=sys.stderr)
    except DocupediaAuthError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Cannot reach Docupedia at {docupedia_url}: {e}", file=sys.stderr)
        sys.exit(1)
    try:
        yield
    finally:
        await client.close()


mcp = FastMCP("docupedia", lifespan=lifespan)


@mcp.tool()
async def search_pages(cql: str, max_results: int = 25) -> str:
    """Search Docupedia pages using CQL (Confluence Query Language).

    Args:
        cql: CQL query string (e.g., 'text ~ "hello" AND space = "MYSPACE"')
        max_results: Maximum number of results to return (default 25)
    """
    try:
        results = await client.search(cql, max_results)
        return json.dumps(results, indent=2)
    except DocupediaAuthError as e:
        return f"Error: {e}"
    except PermissionError as e:
        return f"Error: {e}"
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def get_page(page_id: str) -> str:
    """Get a Docupedia page by ID, returning a JSON object with id, title, space, version, body (plain text), and url.

    Args:
        page_id: The numeric page ID
    """
    try:
        result = await client.get_page(page_id)
        return json.dumps(result, indent=2)
    except DocupediaNotFoundError:
        return f"Error: Page {page_id} not found"
    except DocupediaAuthError as e:
        return f"Error: {e}"
    except PermissionError as e:
        return f"Error: {e}"
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def list_pages_in_space(space_key: str, max_results: int = 25) -> str:
    """List pages in a Docupedia space.

    Args:
        space_key: The space key (e.g., "MYSPACE")
        max_results: Maximum number of results to return (default 25)
    """
    try:
        results = await client.list_pages(space_key, max_results)
        return json.dumps(results, indent=2)
    except DocupediaNotFoundError:
        return f"Error: Space {space_key} not found"
    except DocupediaAuthError as e:
        return f"Error: {e}"
    except PermissionError as e:
        return f"Error: {e}"
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def create_page(space_key: str, title: str, body: str, parent_id: str = "") -> str:
    """Create a new page in Docupedia.

    Args:
        space_key: The space key where the page will be created (e.g., "MYSPACE")
        title: Page title
        body: Page content as plain text
        parent_id: Optional parent page ID (leave empty for top-level page)
    """
    try:
        result = await client.create_page(
            space_key, title, body, parent_id=parent_id or None
        )
        return json.dumps(result, indent=2)
    except DocupediaNotFoundError:
        return f"Error: Parent page {parent_id} not found"
    except DocupediaAuthError as e:
        return f"Error: {e}"
    except PermissionError as e:
        return f"Error: {e}"
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def update_page(page_id: str, title: str, body: str) -> str:
    """Update an existing Docupedia page.

    Args:
        page_id: The numeric page ID
        title: New page title
        body: New page content as plain text
    """
    try:
        result = await client.update_page(page_id, title, body)
        return json.dumps(result, indent=2)
    except DocupediaNotFoundError:
        return f"Error: Page {page_id} not found"
    except DocupediaAuthError as e:
        return f"Error: {e}"
    except PermissionError as e:
        return f"Error: {e}"
    except Exception as e:
        return f"Error: {e}"


@mcp.tool()
async def add_comment(page_id: str, body: str) -> str:
    """Add a comment to a Docupedia page.

    Args:
        page_id: The numeric page ID
        body: Comment text as plain text
    """
    try:
        comment_id = await client.add_comment(page_id, body)
        return f"Added comment {comment_id} to page {page_id}"
    except DocupediaNotFoundError:
        return f"Error: Page {page_id} not found"
    except DocupediaAuthError as e:
        return f"Error: {e}"
    except PermissionError as e:
        return f"Error: {e}"
    except Exception as e:
        return f"Error: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
