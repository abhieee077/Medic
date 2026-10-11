import base64

import anthropic

from app.ai.provider import AIError, AnalysisResult, ChatTurn, DraftReport

MODEL = "claude-opus-5-5"

# Server-side fallback: if a request is declined, the API retries it on the
# model Anthropic recommends for that refusal category.
FALLBACK_BETA = "server-side-fallback-2026-07-01"

ANALYSIS_SYSTEM = """You are an AI assistant inside Medic, a radiology reporting workspace.
You draft reports for a qualified radiologist, who reviews, edits and signs every report.

Rules:
- Your output is a DRAFT. Never present it as a final diagnosis.
- You only see a few representative slices, not the full study. Say so in limitations,
  and do not claim findings you cannot see.
- Describe what is visible precisely (location, size estimate, density/signal), state
  uncertainty plainly, and prefer "may represent" over definitive diagnoses.
- Flag anything that could need urgent attention so the radiologist can check it first.
- The images are anonymised research/demo data."""

CHAT_SYSTEM = """You are an AI assistant inside Medic, a radiology reporting workspace,
helping a qualified radiologist. Answer concisely and precisely. You can explain
findings, suggest report wording, and summarise the study context you are given.
You have not seen the images in this chat unless an AI analysis is included in the
context; never invent imaging findings. Everything you write is a suggestion for the
radiologist to verify."""


def _translate_error(error: Exception) -> AIError:
    if isinstance(error, anthropic.AuthenticationError):
        return AIError("The Anthropic API key was rejected. Check the key and restart the backend.", 503)
    if isinstance(error, anthropic.RateLimitError):
        return AIError("The AI service is rate limited right now. Try again in a minute.", 429)
    if isinstance(error, anthropic.APIConnectionError):
        return AIError("Could not reach the AI service. Check the internet connection.", 503)
    if isinstance(error, anthropic.APIStatusError):
        return AIError(f"The AI service returned an error ({error.status_code}).", 502)
    return AIError("The AI request failed unexpectedly.", 500)


class ClaudeProvider:
    name = "anthropic"
    model = MODEL

    def __init__(self):
        # Analyses read several images and think before answering.
        self.client = anthropic.Anthropic(timeout=300, max_retries=2)

    def analyze_study(self, images: list[bytes], context: str) -> AnalysisResult:
        content: list[dict] = [{"type": "text", "text": context}]
        for index, image in enumerate(images, start=1):
            content.append({"type": "text", "text": f"Slice {index} of {len(images)} shown:"})
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": base64.standard_b64encode(image).decode("ascii"),
                },
            })
        content.append({
            "type": "text",
            "text": "Draft the findings and impression for this study from these slices.",
        })

        try:
            response = self.client.beta.messages.parse(
                model=self.model,
                max_tokens=16000,
                system=ANALYSIS_SYSTEM,
                messages=[{"role": "user", "content": content}],
                output_format=DraftReport,
                output_config={"effort": "medium"},
                betas=[FALLBACK_BETA],
                fallbacks="default",
            )
        except anthropic.APIError as error:
            raise _translate_error(error) from error

        if response.stop_reason == "refusal":
            raise AIError("The AI declined to analyse this study.", 422)
        if response.parsed_output is None:
            raise AIError("The AI returned an incomplete draft. Try again.", 502)

        return AnalysisResult(draft=response.parsed_output, model=response.model)

    def chat(self, turns: list[ChatTurn], context: str) -> str:
        messages = [{"role": turn.role, "content": turn.content} for turn in turns]
        # Study context goes first in the conversation so the system prompt stays stable.
        messages[0] = {
            "role": "user",
            "content": f"Study context:\n{context}\n\nQuestion:\n{messages[0]['content']}",
        }

        try:
            response = self.client.beta.messages.create(
                model=self.model,
                max_tokens=8000,
                system=CHAT_SYSTEM,
                messages=messages,
                output_config={"effort": "low"},
                betas=[FALLBACK_BETA],
                fallbacks="default",
            )
        except anthropic.APIError as error:
            raise _translate_error(error) from error

        if response.stop_reason == "refusal":
            raise AIError("The AI declined to answer this question.", 422)

        text = "".join(block.text for block in response.content if block.type == "text").strip()
        if not text:
            raise AIError("The AI returned an empty answer. Try again.", 502)
        return text
