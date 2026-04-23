"""Core Jira API client with authentication and error handling."""

import httpx


class JiraAuthError(Exception):
    """Raised when Jira authentication fails (401 response)."""
    pass


class JiraNotFoundError(Exception):
    """Raised when a Jira resource is not found (404 response)."""
    pass


class JiraClient:
    """Async HTTP client for Jira Server/Data Center REST API."""

    def __init__(self, base_url: str, auth_headers: dict[str, str]) -> None:
        """Initialize Jira client.

        Args:
            base_url: Base URL of Jira instance (e.g., https://jira.example.com)
            auth_headers: Authentication headers (either Authorization for PAT or Cookie for session)
        """
        self.base_url = base_url.rstrip("/")
        self.auth_headers = auth_headers
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.auth_headers,
            timeout=30.0,
        )

    async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        """Make an HTTP request to Jira API with error handling.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            path: API path (e.g., /rest/api/2/myself)
            **kwargs: Additional arguments to pass to httpx request

        Returns:
            httpx.Response object

        Raises:
            JiraAuthError: On 401 Unauthorized response
            JiraNotFoundError: On 404 Not Found response
            PermissionError: On 403 Forbidden response
            httpx.HTTPStatusError: On other HTTP errors
        """
        response = await self._client.request(method, path, **kwargs)

        if response.status_code == 401:
            # Determine which auth method is being used
            if "Authorization" in self.auth_headers:
                error_msg = "PAT token is invalid or expired"
            elif "Cookie" in self.auth_headers:
                error_msg = (
                    "Session cookie expired. Please log into Jira in your browser, "
                    "copy the session cookie from DevTools, and update JIRA_SESSION_COOKIE"
                )
            else:
                error_msg = "Authentication failed"
            raise JiraAuthError(error_msg)

        if response.status_code == 404:
            raise JiraNotFoundError(f"Resource not found: {path}")

        if response.status_code == 403:
            raise PermissionError(f"Permission denied: {path}")

        response.raise_for_status()
        return response

    async def verify(self) -> dict:
        """Verify authentication by fetching current user info.

        Returns:
            dict: User information from /rest/api/2/myself endpoint

        Raises:
            JiraAuthError: If authentication fails
        """
        response = await self._request("GET", "/rest/api/2/myself")
        return response.json()

    async def search(self, jql: str, max_results: int = 50) -> list[dict]:
        """Search for issues using JQL (Jira Query Language).

        Args:
            jql: JQL query string
            max_results: Maximum number of results to return (default: 50)

        Returns:
            list[dict]: List of issues with key, summary, status, and assignee

        Raises:
            JiraAuthError: If authentication fails
            httpx.HTTPStatusError: On other HTTP errors
        """
        response = await self._request(
            "GET",
            "/rest/api/2/search",
            params={
                "jql": jql,
                "maxResults": str(max_results),
                "fields": "key,summary,status,assignee",
            },
        )
        data = response.json()
        return [
            {
                "key": issue["key"],
                "summary": issue["fields"]["summary"],
                "status": issue["fields"]["status"]["name"],
                "assignee": (
                    issue["fields"]["assignee"]["name"]
                    if issue["fields"]["assignee"]
                    else None
                ),
            }
            for issue in data["issues"]
        ]

    async def get_issue(self, issue_key: str) -> dict:
        """Get detailed information about a specific issue.

        Args:
            issue_key: Issue key (e.g., 'PROJ-123')

        Returns:
            dict: Issue details including key, summary, description, status, assignee,
                  priority, labels, and comments

        Raises:
            JiraAuthError: If authentication fails
            JiraNotFoundError: If issue is not found
            httpx.HTTPStatusError: On other HTTP errors
        """
        response = await self._request("GET", f"/rest/api/2/issue/{issue_key}")
        data = response.json()
        fields = data["fields"]
        return {
            "key": data["key"],
            "summary": fields["summary"],
            "description": fields.get("description"),
            "status": fields["status"]["name"],
            "assignee": (
                fields["assignee"]["name"] if fields["assignee"] else None
            ),
            "priority": fields["priority"]["name"] if fields.get("priority") else None,
            "labels": fields.get("labels", []),
            "comments": [
                {
                    "author": c["author"]["name"],
                    "body": c["body"],
                    "created": c["created"],
                }
                for c in fields.get("comment", {}).get("comments", [])
            ],
        }

    async def assign(self, issue_key: str, username: str) -> None:
        """Assign an issue to a user.

        Args:
            issue_key: Issue key (e.g., 'PROJ-123')
            username: Username of the assignee

        Raises:
            JiraAuthError: If authentication fails
            JiraNotFoundError: If issue is not found
            httpx.HTTPStatusError: On other HTTP errors
        """
        await self._request(
            "PUT",
            f"/rest/api/2/issue/{issue_key}/assignee",
            json={"name": username},
        )

    async def transition(self, issue_key: str, transition_name: str) -> str:
        """Transition an issue to a new status.

        Args:
            issue_key: Issue key (e.g., 'PROJ-123')
            transition_name: Name of the transition (case-insensitive)

        Returns:
            str: The actual name of the transition that was applied

        Raises:
            JiraAuthError: If authentication fails
            JiraNotFoundError: If issue is not found
            ValueError: If the transition name is not valid for this issue
            httpx.HTTPStatusError: On other HTTP errors
        """
        response = await self._request(
            "GET", f"/rest/api/2/issue/{issue_key}/transitions"
        )
        transitions = response.json()["transitions"]
        match = next(
            (t for t in transitions if t["name"].lower() == transition_name.lower()),
            None,
        )
        if not match:
            available = ", ".join(t["name"] for t in transitions)
            raise ValueError(
                f"Transition '{transition_name}' not found. "
                f"Available transitions: {available}"
            )
        await self._request(
            "POST",
            f"/rest/api/2/issue/{issue_key}/transitions",
            json={"transition": {"id": match["id"]}},
        )
        return match["name"]

    async def add_comment(self, issue_key: str, body: str) -> str:
        """Add a comment to an issue.

        Args:
            issue_key: Issue key (e.g., 'PROJ-123')
            body: Comment text

        Returns:
            str: The ID of the created comment

        Raises:
            JiraAuthError: If authentication fails
            JiraNotFoundError: If issue is not found
            httpx.HTTPStatusError: On other HTTP errors
        """
        response = await self._request(
            "POST",
            f"/rest/api/2/issue/{issue_key}/comment",
            json={"body": body},
        )
        return response.json()["id"]

    async def close(self) -> None:
        """Close the HTTP client and release resources."""
        await self._client.aclose()
