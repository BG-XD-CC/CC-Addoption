import pytest
from docupedia_client import DocupediaAuthError, DocupediaNotFoundError, DocupediaClient, _strip_html, _to_storage


def test_strip_html_removes_tags():
    assert _strip_html("<p>Hello world</p>") == "Hello world"


def test_strip_html_unescapes_entities():
    assert _strip_html("<p>AT&amp;T &lt;rocks&gt;</p>") == "AT&T <rocks>"


def test_strip_html_handles_multiple_paragraphs():
    result = _strip_html("<p>First</p><p>Second</p>")
    assert "First" in result
    assert "Second" in result


def test_strip_html_strips_whitespace():
    assert _strip_html("  <p>  Hello  </p>  ").strip() == "Hello"


def test_to_storage_wraps_lines():
    result = _to_storage("line one\nline two")
    assert result == "<p>line one</p><p>line two</p>"


def test_to_storage_skips_empty_lines():
    result = _to_storage("line one\n\nline two")
    assert result == "<p>line one</p><p>line two</p>"


def test_to_storage_escapes_html_special_chars():
    result = _to_storage("AT&T sells <phones>")
    assert result == "<p>AT&amp;T sells &lt;phones&gt;</p>"


@pytest.fixture
def client():
    return DocupediaClient(
        base_url="https://docupedia.example.com",
        auth_headers={"Authorization": "Bearer test-token"},
    )


async def test_verify_success(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/space?limit=1",
        json={"results": [{"key": "MYSPACE"}]},
    )
    result = await client.verify()
    assert "results" in result


async def test_verify_401_pat_raises_auth_error(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/space?limit=1",
        status_code=401,
    )
    with pytest.raises(DocupediaAuthError, match="PAT token is invalid or expired"):
        await client.verify()


async def test_verify_401_cookie_raises_auth_error(httpx_mock):
    cookie_client = DocupediaClient(
        base_url="https://docupedia.example.com",
        auth_headers={"Cookie": "JSESSIONID=abc"},
    )
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/space?limit=1",
        status_code=401,
    )
    with pytest.raises(DocupediaAuthError, match="Session cookie expired"):
        await cookie_client.verify()


async def test_verify_404_raises_not_found(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/space?limit=1",
        status_code=404,
    )
    with pytest.raises(DocupediaNotFoundError):
        await client.verify()


async def test_search_returns_flattened_results(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/search?cql=text+%7E+%22hello%22&limit=25&expand=space",
        json={
            "results": [
                {
                    "id": "111",
                    "title": "Hello Page",
                    "space": {"key": "MYSPACE"},
                    "_links": {"webui": "/display/MYSPACE/Hello+Page"},
                }
            ]
        },
    )
    results = await client.search("text ~ \"hello\"")
    assert results == [
        {
            "id": "111",
            "title": "Hello Page",
            "space": "MYSPACE",
            "url": "https://docupedia.example.com/display/MYSPACE/Hello+Page",
        }
    ]


async def test_search_empty_results(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/search?cql=nothing&limit=25&expand=space",
        json={"results": []},
    )
    results = await client.search("nothing")
    assert results == []


async def test_search_respects_max_results(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/search?cql=test&limit=5&expand=space",
        json={"results": []},
    )
    results = await client.search("test", max_results=5)
    assert results == []


async def test_get_page_returns_flattened_page(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/12345?expand=body.view%2Cversion%2Cspace",
        json={
            "id": "12345",
            "title": "My Page",
            "space": {"key": "MYSPACE"},
            "version": {"number": 3},
            "body": {"view": {"value": "<p>Hello world</p>"}},
            "_links": {"webui": "/display/MYSPACE/My+Page"},
        },
    )
    page = await client.get_page("12345")
    assert page == {
        "id": "12345",
        "title": "My Page",
        "space": "MYSPACE",
        "version": 3,
        "body": "Hello world",
        "url": "https://docupedia.example.com/display/MYSPACE/My+Page",
    }


async def test_get_page_strips_html_body(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/999?expand=body.view%2Cversion%2Cspace",
        json={
            "id": "999",
            "title": "Formatted",
            "space": {"key": "SP"},
            "version": {"number": 1},
            "body": {"view": {"value": "<h1>Title</h1><p>Body text</p>"}},
            "_links": {"webui": "/display/SP/Formatted"},
        },
    )
    page = await client.get_page("999")
    assert "<h1>" not in page["body"]
    assert "Title" in page["body"]
    assert "Body text" in page["body"]


async def test_get_page_404_raises_not_found(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/missing?expand=body.view%2Cversion%2Cspace",
        status_code=404,
    )
    with pytest.raises(DocupediaNotFoundError):
        await client.get_page("missing")


# --- list_pages ---

async def test_list_pages_returns_flattened_results(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content?spaceKey=MYSPACE&type=page&limit=25",
        json={
            "results": [
                {
                    "id": "111",
                    "title": "Page One",
                    "_links": {"webui": "/display/MYSPACE/Page+One"},
                }
            ]
        },
    )
    results = await client.list_pages("MYSPACE")
    assert results == [
        {
            "id": "111",
            "title": "Page One",
            "url": "https://docupedia.example.com/display/MYSPACE/Page+One",
        }
    ]


async def test_list_pages_empty(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content?spaceKey=EMPTY&type=page&limit=25",
        json={"results": []},
    )
    results = await client.list_pages("EMPTY")
    assert results == []


async def test_list_pages_respects_max_results(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content?spaceKey=SP&type=page&limit=10",
        json={"results": []},
    )
    results = await client.list_pages("SP", max_results=10)
    assert results == []


# --- create_page ---

async def test_create_page_without_parent(client, httpx_mock):
    httpx_mock.add_response(
        method="POST",
        url="https://docupedia.example.com/rest/api/content",
        json={
            "id": "999",
            "title": "New Page",
            "_links": {"webui": "/display/MYSPACE/New+Page"},
        },
    )
    result = await client.create_page("MYSPACE", "New Page", "Hello world")
    assert result == {
        "id": "999",
        "title": "New Page",
        "url": "https://docupedia.example.com/display/MYSPACE/New+Page",
    }


async def test_create_page_with_parent(client, httpx_mock):
    httpx_mock.add_response(
        method="POST",
        url="https://docupedia.example.com/rest/api/content",
        json={
            "id": "1000",
            "title": "Child Page",
            "_links": {"webui": "/display/MYSPACE/Child+Page"},
        },
    )
    result = await client.create_page("MYSPACE", "Child Page", "Content", parent_id="500")
    assert result["id"] == "1000"


async def test_create_page_escapes_body(client, httpx_mock):
    captured = {}

    def capture(request):
        import json as _json
        captured["body"] = _json.loads(request.content)
        from httpx import Response
        return Response(
            200,
            json={
                "id": "1",
                "title": "T",
                "_links": {"webui": "/x"},
            },
        )

    httpx_mock.add_callback(capture, method="POST", url="https://docupedia.example.com/rest/api/content")
    await client.create_page("SP", "T", "AT&T <sells> phones")
    storage_value = captured["body"]["body"]["storage"]["value"]
    assert "&amp;" in storage_value
    assert "&lt;" in storage_value


# --- update_page ---

async def test_update_page_increments_version(client, httpx_mock):
    # Step 1: GET to fetch current version and space
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/12345?expand=version%2Cspace",
        json={
            "version": {"number": 3},
            "space": {"key": "MYSPACE"},
        },
    )
    # Step 2: PUT with incremented version
    httpx_mock.add_response(
        method="PUT",
        url="https://docupedia.example.com/rest/api/content/12345",
        json={
            "id": "12345",
            "title": "Updated",
            "_links": {"webui": "/display/MYSPACE/Updated"},
        },
    )
    result = await client.update_page("12345", "Updated", "New body")
    assert result == {
        "id": "12345",
        "title": "Updated",
        "url": "https://docupedia.example.com/display/MYSPACE/Updated",
    }


async def test_update_page_404_raises_not_found(client, httpx_mock):
    httpx_mock.add_response(
        url="https://docupedia.example.com/rest/api/content/missing?expand=version%2Cspace",
        status_code=404,
    )
    with pytest.raises(DocupediaNotFoundError):
        await client.update_page("missing", "T", "B")


# --- add_comment ---

async def test_add_comment_returns_comment_id(client, httpx_mock):
    httpx_mock.add_response(
        method="POST",
        url="https://docupedia.example.com/rest/api/content",
        json={"id": "67890"},
    )
    comment_id = await client.add_comment("12345", "Great page!")
    assert comment_id == "67890"


async def test_add_comment_escapes_body(client, httpx_mock):
    captured = {}

    def capture(request):
        import json as _json
        captured["body"] = _json.loads(request.content)
        from httpx import Response
        return Response(200, json={"id": "1"})

    httpx_mock.add_callback(capture, method="POST", url="https://docupedia.example.com/rest/api/content")
    await client.add_comment("123", "AT&T <sells> phones")
    storage_value = captured["body"]["body"]["storage"]["value"]
    assert "&amp;" in storage_value
    assert "&lt;" in storage_value
