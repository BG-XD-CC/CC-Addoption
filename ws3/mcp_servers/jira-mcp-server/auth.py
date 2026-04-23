"""Authentication module for Jira MCP server.

Provides authentication header selection based on available credentials.
"""


def get_auth_headers(jira_pat: str | None, session_cookie: str | None) -> dict[str, str]:
    """Return appropriate authentication headers based on provided credentials.

    Args:
        jira_pat: Personal Access Token for Jira authentication
        session_cookie: Session cookie for Jira authentication

    Returns:
        Dictionary containing appropriate authentication headers

    Raises:
        ValueError: If neither jira_pat nor session_cookie is provided

    Note:
        PAT takes precedence if both credentials are provided.
    """
    if jira_pat is not None:
        return {"Authorization": f"Bearer {jira_pat}"}
    elif session_cookie is not None:
        return {"Cookie": session_cookie}
    else:
        raise ValueError(
            "Either JIRA_PAT or JIRA_SESSION_COOKIE environment variable must be set"
        )
