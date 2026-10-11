import base64
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import anthropic
import httpx2 as httpx
import pytest

from app.ai import provider as provider_module
from app.ai.claude_provider import MODEL, ClaudeProvider
from app.ai.images import pick_instances
from app.ai.provider import AIError, ChatTurn, DraftReport, Observation


def make_draft():
    return DraftReport(
        findings="No focal consolidation.",
        impression="1. No acute abnormality on the slices reviewed.",
        observations=[
            Observation(
                title="Clear lungs",
                description="Lungs are clear on the reviewed slices.",
                body_region="lungs",
                significance="normal",
                confidence=0.8,
            )
        ],
        limitations="Only six slices were reviewed.",
        recommendations=[],
    )


def make_provider(response):
    with patch("app.ai.claude_provider.anthropic.Anthropic") as client_class:
        client = client_class.return_value
        client.beta.messages.parse.return_value = response
        client.beta.messages.create.return_value = response
        provider = ClaudeProvider()
    return provider, client


def api_status_error(cls, status):
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    response = httpx.Response(status, request=request)
    return cls("error", response=response, body=None)


def test_get_provider_is_none_without_api_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    assert provider_module.get_provider() is None


def test_get_provider_returns_claude_with_api_key(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    with patch("app.ai.claude_provider.anthropic.Anthropic"):
        provider = provider_module.get_provider()
    assert provider.name == "anthropic"
    assert provider.model == MODEL


def test_analyze_sends_images_and_returns_draft():
    draft = make_draft()
    response = SimpleNamespace(stop_reason="end_turn", parsed_output=draft, model=MODEL)
    provider, client = make_provider(response)

    result = provider.analyze_study([b"png-one", b"png-two"], "Study context")

    assert result.draft == draft
    assert result.model == MODEL
    kwargs = client.beta.messages.parse.call_args.kwargs
    assert kwargs["model"] == MODEL
    assert kwargs["output_format"] is DraftReport
    assert kwargs["fallbacks"] == "default"
    images = [block for block in kwargs["messages"][0]["content"] if block["type"] == "image"]
    assert [base64.b64decode(block["source"]["data"]) for block in images] == [b"png-one", b"png-two"]


def test_analyze_refusal_raises_clear_error():
    response = SimpleNamespace(stop_reason="refusal", parsed_output=None, model=MODEL)
    provider, _ = make_provider(response)

    with pytest.raises(AIError) as error:
        provider.analyze_study([b"png"], "context")
    assert error.value.status_code == 422


def test_analyze_incomplete_output_raises():
    response = SimpleNamespace(stop_reason="max_tokens", parsed_output=None, model=MODEL)
    provider, _ = make_provider(response)

    with pytest.raises(AIError):
        provider.analyze_study([b"png"], "context")


@pytest.mark.parametrize(
    ("error_class", "status", "expected"),
    [
        (anthropic.AuthenticationError, 401, 503),
        (anthropic.RateLimitError, 429, 429),
        (anthropic.InternalServerError, 500, 502),
    ],
)
def test_api_errors_become_user_safe_errors(error_class, status, expected):
    provider, client = make_provider(None)
    client.beta.messages.parse.side_effect = api_status_error(error_class, status)

    with pytest.raises(AIError) as error:
        provider.analyze_study([b"png"], "context")
    assert error.value.status_code == expected


def test_chat_puts_study_context_in_first_turn_and_returns_text():
    response = SimpleNamespace(
        stop_reason="end_turn",
        content=[SimpleNamespace(type="thinking", text=""), SimpleNamespace(type="text", text="Answer")],
    )
    provider, client = make_provider(response)

    answer = provider.chat(
        [ChatTurn("user", "First?"), ChatTurn("assistant", "Yes."), ChatTurn("user", "Second?")],
        "CT chest",
    )

    assert answer == "Answer"
    messages = client.beta.messages.create.call_args.kwargs["messages"]
    assert "CT chest" in messages[0]["content"]
    assert messages[-1] == {"role": "user", "content": "Second?"}


def test_pick_instances_spreads_slices_evenly():
    db = MagicMock()
    db.execute.return_value.scalars.return_value = [f"id-{index}" for index in range(100)]

    picked = pick_instances(db, MagicMock(), limit=6)

    assert len(picked) == 6
    assert len(set(picked)) == 6
    assert "id-0" not in picked and "id-99" not in picked


def test_pick_instances_returns_all_when_few():
    db = MagicMock()
    db.execute.return_value.scalars.return_value = ["a", None, "b"]

    assert pick_instances(db, MagicMock(), limit=6) == ["a", "b"]
