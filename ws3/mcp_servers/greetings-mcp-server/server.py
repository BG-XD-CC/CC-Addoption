from mcp.server.fastmcp import FastMCP

mcp = FastMCP("greetings")

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


@mcp.tool()
def list_languages() -> list[str]:
    """Return the list of supported greeting languages."""
    return list(GREETINGS.keys())


@mcp.tool()
def greet(name: str, language: str = "english") -> str:
    """
    Greet a person by name in the specified language.

    Args:
        name: The name of the person to greet.
        language: The language to use (default: english).
    """
    language = language.lower()
    if language not in GREETINGS:
        supported = ", ".join(GREETINGS.keys())
        return (
            f"Language '{language}' is not supported. Supported languages: {supported}"
        )
    greeting = GREETINGS[language]
    return f"{greeting}, {name}!"


if __name__ == "__main__":
    mcp.run()
