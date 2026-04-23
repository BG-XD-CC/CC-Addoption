import html
from html.parser import HTMLParser
import httpx


class DocupediaAuthError(Exception):
    """Raised on 401 responses."""
    pass


class DocupediaNotFoundError(Exception):
    """Raised on 404 responses."""
    pass


class _HTMLStripper(HTMLParser):
    """Collects only text content from HTML, discarding all tags."""

    def __init__(self):
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def get_text(self) -> str:
        return "".join(self._parts).strip()


def _strip_html(html_content: str) -> str:
    """Strip HTML tags and unescape entities, returning plain text."""
    stripper = _HTMLStripper()
    stripper.feed(html_content)
    return stripper.get_text()


def _to_storage(text: str) -> str:
    """Convert plain text to Confluence storage format (XML).

    Each non-empty line becomes a <p> element. Special characters are escaped
    to prevent malformed XML.
    """
    return "".join(
        f"<p>{html.escape(line)}</p>"
        for line in text.splitlines()
        if line.strip()
    )


class DocupediaClient:
    def __init__(self, base_url: str, auth_headers: dict[str, str]) -> None:
        self.base_url = base_url.rstrip("/")
        self.auth_headers = auth_headers
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.auth_headers,
            timeout=30.0,
        )

    async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        response = await self._client.request(method, path, **kwargs)
        if response.status_code == 401:
            raise DocupediaAuthError(
                "PAT token is invalid or expired"
                if "Authorization" in self.auth_headers
                else "Session cookie expired. Please log into Docupedia in your browser, "
                "copy the session cookie from DevTools, and update DOCUPEDIA_SESSION_COOKIE"
            )
        if response.status_code == 404:
            raise DocupediaNotFoundError(f"Not found: {path}")
        if response.status_code == 403:
            raise PermissionError("Permission denied for this operation")
        response.raise_for_status()
        return response

    async def verify(self) -> dict:
        response = await self._request("GET", "/rest/api/space", params={"limit": "1"})
        return response.json()

    async def search(self, cql: str, max_results: int = 25) -> list[dict]:
        response = await self._request(
            "GET", "/rest/api/content/search",
            params={"cql": cql, "limit": max_results, "expand": "space"},
        )
        data = response.json()
        return [
            {
                "id": item["id"],
                "title": item["title"],
                "space": item["space"]["key"],
                "url": f"{self.base_url}{item['_links']['webui']}",
            }
            for item in data["results"]
        ]

    async def get_page(self, page_id: str) -> dict:
        response = await self._request(
            "GET", f"/rest/api/content/{page_id}",
            params={"expand": "body.view,version,space"},
        )
        data = response.json()
        return {
            "id": data["id"],
            "title": data["title"],
            "space": data["space"]["key"],
            "version": data["version"]["number"],
            "body": _strip_html(data["body"]["view"]["value"]),
            "url": f"{self.base_url}{data['_links']['webui']}",
        }

    async def list_pages(self, space_key: str, max_results: int = 25) -> list[dict]:
        response = await self._request(
            "GET", "/rest/api/content",
            params={"spaceKey": space_key, "type": "page", "limit": max_results},
        )
        data = response.json()
        return [
            {
                "id": item["id"],
                "title": item["title"],
                "url": f"{self.base_url}{item['_links']['webui']}",
            }
            for item in data["results"]
        ]

    async def create_page(
        self, space_key: str, title: str, body: str, parent_id: str | None = None
    ) -> dict:
        payload: dict = {
            "type": "page",
            "title": title,
            "space": {"key": space_key},
            "body": {"storage": {"value": _to_storage(body), "representation": "storage"}},
        }
        if parent_id is not None:
            payload["ancestors"] = [{"id": parent_id}]
        response = await self._request("POST", "/rest/api/content", json=payload)
        data = response.json()
        return {
            "id": data["id"],
            "title": data["title"],
            "url": f"{self.base_url}{data['_links']['webui']}",
        }

    async def update_page(self, page_id: str, title: str, body: str) -> dict:
        # Step 1: fetch current version and space
        current = await self._request(
            "GET", f"/rest/api/content/{page_id}",
            params={"expand": "version,space"},
        )
        current_data = current.json()
        new_version = current_data["version"]["number"] + 1
        space_key = current_data["space"]["key"]

        # Step 2: update with incremented version
        payload = {
            "type": "page",
            "title": title,
            "space": {"key": space_key},
            "version": {"number": new_version},
            "body": {"storage": {"value": _to_storage(body), "representation": "storage"}},
        }
        response = await self._request("PUT", f"/rest/api/content/{page_id}", json=payload)
        data = response.json()
        return {
            "id": data["id"],
            "title": data["title"],
            "url": f"{self.base_url}{data['_links']['webui']}",
        }

    async def add_comment(self, page_id: str, body: str) -> str:
        payload = {
            "type": "comment",
            "container": {"id": page_id, "type": "page"},
            "body": {"storage": {"value": _to_storage(body), "representation": "storage"}},
        }
        response = await self._request("POST", "/rest/api/content", json=payload)
        data = response.json()
        return data["id"]

    async def close(self) -> None:
        await self._client.aclose()
