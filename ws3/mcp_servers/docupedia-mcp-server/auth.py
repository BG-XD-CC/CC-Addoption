def get_auth_headers(docupedia_pat: str | None, session_cookie: str | None) -> dict[str, str]:
    """Return HTTP auth headers based on available credentials.

    PAT takes precedence if both are provided.
    Raises ValueError if neither is provided.
    """
    if docupedia_pat:
        return {"Authorization": f"Bearer {docupedia_pat}"}
    if session_cookie:
        return {"Cookie": session_cookie}
    raise ValueError(
        "Either DOCUPEDIA_PAT or DOCUPEDIA_SESSION_COOKIE environment variable must be set"
    )
