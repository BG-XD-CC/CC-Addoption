"""Tests for the auth module."""

import pytest

from auth import get_auth_headers


def test_pat_returns_bearer_header():
    """Test that providing a PAT returns a Bearer authorization header."""
    result = get_auth_headers(jira_pat="test-token-123", session_cookie=None)
    assert result == {"Authorization": "Bearer test-token-123"}


def test_cookie_returns_cookie_header():
    """Test that providing a session cookie returns a Cookie header."""
    result = get_auth_headers(jira_pat=None, session_cookie="JSESSIONID=abc123")
    assert result == {"Cookie": "JSESSIONID=abc123"}


def test_pat_takes_precedence_over_cookie():
    """Test that PAT is used when both PAT and cookie are provided."""
    result = get_auth_headers(
        jira_pat="test-token-456",
        session_cookie="JSESSIONID=xyz789"
    )
    assert result == {"Authorization": "Bearer test-token-456"}


def test_neither_raises_value_error():
    """Test that ValueError is raised when neither credential is provided."""
    with pytest.raises(ValueError) as exc_info:
        get_auth_headers(jira_pat=None, session_cookie=None)

    assert "Either JIRA_PAT or JIRA_SESSION_COOKIE environment variable must be set" in str(exc_info.value)
