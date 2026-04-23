import pytest
from auth import get_auth_headers


def test_pat_returns_bearer_header():
    headers = get_auth_headers(docupedia_pat="my-token", session_cookie=None)
    assert headers == {"Authorization": "Bearer my-token"}


def test_cookie_returns_cookie_header():
    headers = get_auth_headers(docupedia_pat=None, session_cookie="JSESSIONID=abc123")
    assert headers == {"Cookie": "JSESSIONID=abc123"}


def test_pat_takes_precedence_over_cookie():
    headers = get_auth_headers(docupedia_pat="my-token", session_cookie="JSESSIONID=abc123")
    assert headers == {"Authorization": "Bearer my-token"}


def test_neither_raises_value_error():
    with pytest.raises(ValueError, match="DOCUPEDIA_PAT or DOCUPEDIA_SESSION_COOKIE"):
        get_auth_headers(docupedia_pat=None, session_cookie=None)
