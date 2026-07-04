"""Tests for claude_service.py — all Claude API calls mocked."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.mark.asyncio
async def test_call_claude_sends_correct_headers():
    """call_claude must include x-api-key and anthropic-version headers."""
    fake_response_data = {"content": [{"text": '{"steps": [], "answer": "ok"}'}]}

    mock_response = MagicMock()
    mock_response.json.return_value = fake_response_data
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("claude_service.httpx.AsyncClient", return_value=mock_client), \
         patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
        from claude_service import call_claude
        result = await call_claude("system prompt", "user message")

    call_kwargs = mock_client.post.call_args
    headers = call_kwargs.kwargs["headers"]
    assert headers["x-api-key"] == "test-key"
    assert headers["anthropic-version"] == "2023-06-01"


@pytest.mark.asyncio
async def test_call_claude_returns_parsed_json():
    """call_claude must return the parsed dict from the response text."""
    payload = {"steps": [{"id": 1, "text": "step", "cites": [], "is_conclusion": True}], "answer": "42"}
    fake_response_data = {"content": [{"text": json.dumps(payload)}]}

    mock_response = MagicMock()
    mock_response.json.return_value = fake_response_data
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("claude_service.httpx.AsyncClient", return_value=mock_client), \
         patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
        from claude_service import call_claude
        result = await call_claude("sys", "usr")

    assert result["answer"] == "42"
    assert result["steps"][0]["id"] == 1


@pytest.mark.asyncio
async def test_call_claude_raises_on_non_json():
    """call_claude must raise ValueError when response is not valid JSON."""
    fake_response_data = {"content": [{"text": "Sorry, I cannot help with that."}]}

    mock_response = MagicMock()
    mock_response.json.return_value = fake_response_data
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("claude_service.httpx.AsyncClient", return_value=mock_client), \
         patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
        from claude_service import call_claude
        with pytest.raises(ValueError, match="non-JSON"):
            await call_claude("sys", "usr")


@pytest.mark.asyncio
async def test_call_claude_raises_without_api_key():
    """call_claude must raise ValueError when ANTHROPIC_API_KEY is missing."""
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    with patch.dict(os.environ, env, clear=True):
        from claude_service import call_claude
        with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
            await call_claude("sys", "usr")
