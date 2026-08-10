"""Agent wrappers for Frasberg.

Thin wrappers around the canonical LLM endpoint that implement the
Planner → Architect → Code Writer pipeline.  All three call
:func:`backend.app.integrations.llm.canonical.generate` so they share
the same sovereign code path, provider routing, and usage logging.
"""

from __future__ import annotations

from typing import Any, Dict

from backend.app.integrations.llm.canonical import GenerateRequest, Message, generate


async def run_planner(user_request: str) -> Dict[str, Any]:
    """Take a plain-text user request and produce a structured plan.

    Returns a dict with ``plan`` (str) and ``raw_output`` (str).
    """
    request = GenerateRequest(
        model="frasberg",
        messages=[
            Message(
                role="system",
                content=(
                    "You are the Frasberg Planner. "
                    "Given a user request, produce a concise, numbered execution plan. "
                    "Respond with JSON: {\"plan\": [\"step 1\", \"step 2\", ...]}."
                ),
            ),
            Message(role="user", content=user_request),
        ],
    )
    response = await generate(request)
    return {"plan": response.output, "raw_output": response.output, "usage": response.usage.model_dump()}


async def run_architect(plan: str) -> Dict[str, Any]:
    """Take a plan and produce a system design with a file map.

    Returns a dict with ``design`` (str) and ``raw_output`` (str).
    """
    request = GenerateRequest(
        model="frasberg",
        messages=[
            Message(
                role="system",
                content=(
                    "You are the Frasberg Architect. "
                    "Given an execution plan, produce a system design and file map. "
                    "Respond with JSON: {\"design\": \"...\", \"files\": [\"path/to/file\", ...]}."
                ),
            ),
            Message(role="user", content=plan),
        ],
    )
    response = await generate(request)
    return {"design": response.output, "raw_output": response.output, "usage": response.usage.model_dump()}


async def run_code_writer(file_map: str) -> Dict[str, Any]:
    """Take a file map and produce code blocks for each file.

    Returns a dict with ``code`` (str) and ``raw_output`` (str).
    """
    request = GenerateRequest(
        model="frasberg",
        messages=[
            Message(
                role="system",
                content=(
                    "You are the Frasberg Code Writer. "
                    "Given a file map and system design, produce the implementation "
                    "for each file as a JSON object: {\"files\": {\"path\": \"content\", ...}}."
                ),
            ),
            Message(role="user", content=file_map),
        ],
    )
    response = await generate(request)
    return {"code": response.output, "raw_output": response.output, "usage": response.usage.model_dump()}
