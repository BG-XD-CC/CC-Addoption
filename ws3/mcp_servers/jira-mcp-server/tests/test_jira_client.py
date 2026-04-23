"""Tests for JiraClient core functionality."""

import json
import pytest
from pytest_httpx import HTTPXMock

from jira_client import JiraClient, JiraAuthError, JiraNotFoundError


@pytest.mark.asyncio
async def test_verify_success(httpx_mock: HTTPXMock):
    """Test successful authentication verification."""
    # Mock successful response from /rest/api/2/myself
    user_info = {
        "self": "https://jira.example.com/rest/api/2/user?username=testuser",
        "key": "testuser",
        "name": "testuser",
        "emailAddress": "testuser@example.com",
        "displayName": "Test User",
        "active": True,
    }
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/myself",
        json=user_info,
        status_code=200,
    )

    # Create client with PAT authentication
    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Verify should return user info
        result = await client.verify()
        assert result == user_info
        assert result["name"] == "testuser"
        assert result["emailAddress"] == "testuser@example.com"
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_verify_401_raises_auth_error(httpx_mock: HTTPXMock):
    """Test that 401 response raises JiraAuthError with appropriate message."""
    # Mock 401 Unauthorized response
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/myself",
        status_code=401,
    )

    # Create client with PAT authentication
    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Should raise JiraAuthError with PAT-specific message
        with pytest.raises(JiraAuthError) as exc_info:
            await client.verify()

        assert "PAT token is invalid or expired" in str(exc_info.value)
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_search_returns_flattened_issues(httpx_mock: HTTPXMock):
    """Test that search returns flattened issue data."""
    # Mock successful search response with one issue
    search_response = {
        "expand": "schema,names",
        "startAt": 0,
        "maxResults": 50,
        "total": 1,
        "issues": [
            {
                "key": "PROJ-123",
                "fields": {
                    "summary": "Test issue",
                    "status": {"name": "In Progress"},
                    "assignee": {"name": "testuser"},
                },
            }
        ],
    }
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/search?jql=project+%3D+PROJ&maxResults=50&fields=key%2Csummary%2Cstatus%2Cassignee",
        json=search_response,
        status_code=200,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Search for issues
        result = await client.search("project = PROJ")
        assert len(result) == 1
        assert result[0]["key"] == "PROJ-123"
        assert result[0]["summary"] == "Test issue"
        assert result[0]["status"] == "In Progress"
        assert result[0]["assignee"] == "testuser"
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_search_handles_null_assignee(httpx_mock: HTTPXMock):
    """Test that search handles null assignee correctly."""
    # Mock search response with null assignee
    search_response = {
        "expand": "schema,names",
        "startAt": 0,
        "maxResults": 50,
        "total": 1,
        "issues": [
            {
                "key": "PROJ-456",
                "fields": {
                    "summary": "Unassigned issue",
                    "status": {"name": "Open"},
                    "assignee": None,
                },
            }
        ],
    }
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/search?jql=assignee+is+EMPTY&maxResults=50&fields=key%2Csummary%2Cstatus%2Cassignee",
        json=search_response,
        status_code=200,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Search for unassigned issues
        result = await client.search("assignee is EMPTY")
        assert len(result) == 1
        assert result[0]["key"] == "PROJ-456"
        assert result[0]["assignee"] is None
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_get_issue_returns_flattened_details(httpx_mock: HTTPXMock):
    """Test that get_issue returns all flattened fields correctly."""
    # Mock full issue response
    issue_response = {
        "key": "PROJ-789",
        "fields": {
            "summary": "Detailed test issue",
            "description": "This is a test description",
            "status": {"name": "Done"},
            "assignee": {"name": "testuser"},
            "priority": {"name": "High"},
            "labels": ["bug", "urgent"],
            "comment": {
                "comments": [
                    {
                        "author": {"name": "commenter1"},
                        "body": "First comment",
                        "created": "2024-01-01T10:00:00.000+0000",
                    },
                    {
                        "author": {"name": "commenter2"},
                        "body": "Second comment",
                        "created": "2024-01-02T10:00:00.000+0000",
                    },
                ]
            },
        },
    }
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/issue/PROJ-789",
        json=issue_response,
        status_code=200,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Get issue details
        result = await client.get_issue("PROJ-789")
        assert result["key"] == "PROJ-789"
        assert result["summary"] == "Detailed test issue"
        assert result["description"] == "This is a test description"
        assert result["status"] == "Done"
        assert result["assignee"] == "testuser"
        assert result["priority"] == "High"
        assert result["labels"] == ["bug", "urgent"]
        assert len(result["comments"]) == 2
        assert result["comments"][0]["author"] == "commenter1"
        assert result["comments"][0]["body"] == "First comment"
        assert result["comments"][1]["author"] == "commenter2"
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_get_issue_not_found(httpx_mock: HTTPXMock):
    """Test that get_issue raises JiraNotFoundError for 404 response."""
    # Mock 404 Not Found response
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/issue/NONEXISTENT-999",
        status_code=404,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Should raise JiraNotFoundError
        with pytest.raises(JiraNotFoundError) as exc_info:
            await client.get_issue("NONEXISTENT-999")

        assert "Resource not found" in str(exc_info.value)
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_assign_issue(httpx_mock: HTTPXMock):
    """Test assigning an issue to a user."""
    # Mock successful assign response
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/issue/TEST-1/assignee",
        status_code=204,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Assign issue
        await client.assign("TEST-1", "john.doe")

        # Verify request
        request = httpx_mock.get_request()
        assert request.method == "PUT"
        assert json.loads(request.content) == {"name": "john.doe"}
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_transition_issue(httpx_mock: HTTPXMock):
    """Test transitioning an issue with case-insensitive matching."""
    # Mock GET transitions response
    transitions_response = {
        "transitions": [
            {"id": "21", "name": "In Progress"},
            {"id": "31", "name": "Done"},
        ]
    }
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/issue/TEST-1/transitions",
        json=transitions_response,
        status_code=200,
    )

    # Mock POST transition response
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/issue/TEST-1/transitions",
        status_code=204,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Transition issue (lowercase)
        result = await client.transition("TEST-1", "in progress")

        # Verify return value
        assert result == "In Progress"

        # Verify POST request
        requests = httpx_mock.get_requests()
        post_request = requests[-1]
        assert post_request.method == "POST"
        assert json.loads(post_request.content) == {"transition": {"id": "21"}}
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_transition_not_found_lists_available(httpx_mock: HTTPXMock):
    """Test that transition raises ValueError with available transitions."""
    # Mock GET transitions response
    transitions_response = {
        "transitions": [
            {"id": "21", "name": "In Progress"},
            {"id": "31", "name": "Done"},
        ]
    }
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/issue/TEST-1/transitions",
        json=transitions_response,
        status_code=200,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Should raise ValueError
        with pytest.raises(ValueError) as exc_info:
            await client.transition("TEST-1", "Cancelled")

        # Verify error message contains available transitions
        error_message = str(exc_info.value)
        assert "Transition 'Cancelled' not found" in error_message
        assert "In Progress" in error_message
        assert "Done" in error_message
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_add_comment(httpx_mock: HTTPXMock):
    """Test adding a comment to an issue."""
    # Mock successful comment creation
    comment_response = {
        "id": "12345",
        "author": {"name": "testuser"},
        "body": "This is a comment",
        "created": "2024-01-01T10:00:00.000+0000",
    }
    httpx_mock.add_response(
        url="https://jira.example.com/rest/api/2/issue/TEST-1/comment",
        json=comment_response,
        status_code=201,
    )

    client = JiraClient(
        base_url="https://jira.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )

    try:
        # Add comment
        comment_id = await client.add_comment("TEST-1", "This is a comment")

        # Verify return value
        assert comment_id == "12345"

        # Verify request
        request = httpx_mock.get_request()
        assert request.method == "POST"
        assert json.loads(request.content) == {"body": "This is a comment"}
    finally:
        await client.close()
