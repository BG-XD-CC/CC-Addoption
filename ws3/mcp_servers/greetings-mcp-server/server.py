import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("greetings")
mcp_http_app = mcp.streamable_http_app()

GREETINGS = {
    "english": "Hello",
    "spanish": "¡Hola",
    "french": "Bonjour",
    "german": "Hallo",
    "italian": "Ciao",
    "portuguese": "Olá",
    "japanese": "こんにちは",
    "chinese": "你好",
    "arabic": "مرحبا",
    "hindi": "नमस्ते",
    "bulgarian": "Здравейте",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with mcp_http_app.router.lifespan_context(mcp_http_app):
        yield


app = FastAPI(title="Greetings MCP Server", lifespan=lifespan)
app.mount("/", mcp_http_app)


@app.get("/languages")
@mcp.tool()
def get_languages() -> list[str]:
    """Return the list of supported greeting languages."""
    return list(GREETINGS.keys())


@app.get("/greet/{name}")
@mcp.tool()
def get_greet(name: str) -> str:
    """Greet a person by name in English."""
    return f"{GREETINGS['english']}, {name}!"


@app.get("/greet/{language}/{name}")
@mcp.tool()
def get_greet_in_language(language: str, name: str) -> str:
    """
    Greet a person by name in the specified language.

    Args:
        name: The name of the person to greet.
        language: The language to use.
    """
    language = language.lower()
    if language not in GREETINGS:
        supported = ", ".join(GREETINGS.keys())
        return f"Language '{language}' is not supported. Supported languages: {supported}"
    return f"{GREETINGS[language]}, {name}!"


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
