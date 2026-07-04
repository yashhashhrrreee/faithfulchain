"""Single reusable async Claude API caller."""

import json
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 1500


async def call_claude(system: str, user: str) -> dict:
    """Call Claude API with a system and user message, return parsed JSON dict.

    Raises ValueError if response cannot be parsed as JSON.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set in environment")

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    payload = {
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(ANTHROPIC_API_URL, headers=headers, json=payload)
        response.raise_for_status()

    data = response.json()
    raw_text = data["content"][0]["text"]

    # Strip markdown code fences if Claude wraps the JSON
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]  # drop opening fence line
        text = text.rsplit("```", 1)[0]  # drop closing fence

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Claude returned non-JSON response: {raw_text}") from exc
