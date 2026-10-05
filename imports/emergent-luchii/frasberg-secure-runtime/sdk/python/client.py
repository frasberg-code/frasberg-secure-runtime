"""Synchronous, dependency-free client for the Frasberg runtime API."""

from __future__ import annotations

import hashlib
import hmac
import json
import math
import posixpath
from decimal import Decimal
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import Request, urlopen


class ApiError(RuntimeError):
    """An HTTP error returned by the Frasberg runtime."""

    def __init__(self, status: int, payload: Any) -> None:
        super().__init__(f"Frasberg request failed with HTTP {status}.")
        self.status = status
        self.payload = payload


class Frasberg:
    def __init__(
        self,
        key: str,
        base_urls: list[str] | tuple[str, ...] | None = None,
        tenant_id: str | None = None,
        timeout: float = 15.0,
    ) -> None:
        if not key.strip():
            raise ValueError("Frasberg API key is required.")
        self._key = key
        self._base_urls = tuple(
            ("https://frasberg.com/api",) if base_urls is None else base_urls
        )
        if not self._base_urls:
            raise ValueError("At least one Frasberg API base URL is required.")
        if not math.isfinite(timeout) or timeout <= 0:
            raise ValueError("timeout must be a positive finite number.")
        self._tenant_id = tenant_id
        self._timeout = timeout

    def sign(self, serialized_body: str) -> str:
        return hmac.new(
            self._key.encode("utf-8"),
            serialized_body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def request(
        self,
        path: str,
        body: Any = None,
        *,
        method: str | None = None,
    ) -> Any:
        request_method = (method or ("GET" if body is None else "POST")).upper()
        if request_method not in ("GET", "HEAD", "POST"):
            raise ValueError("method must be GET, HEAD, or POST.")
        if request_method in ("GET", "HEAD") and body is not None:
            raise ValueError(f"{request_method} requests cannot include a body.")
        if not path.startswith("/") or path.startswith("//"):
            raise ValueError("path must be an absolute path on the API host.")

        serialized_body = None if body is None else _serialize_json(body)
        headers = {
            "Authorization": f"Bearer {self._key}",
            "Accept": "application/json",
        }
        if self._tenant_id:
            headers["x-tenant-id"] = self._tenant_id
        if serialized_body is not None:
            headers["Content-Type"] = "application/json"
            headers["x-api-signature"] = self.sign(serialized_body)
        data = None if serialized_body is None else serialized_body.encode("utf-8")

        last_error: Exception | None = None
        for base_url in self._base_urls:
            url = _resolve_url(base_url, path)
            request = Request(
                url,
                data=data,
                headers=headers,
                method=request_method,
            )
            try:
                with urlopen(request, timeout=self._timeout) as response:
                    status = response.status
                    response_body = response.read()
                payload = _decode_json(response_body, status)
                if status >= 400:
                    raise ApiError(status, payload)
                return payload
            except HTTPError as error:
                response_body = error.read()
                payload = _decode_json(response_body, error.code)
                if request_method not in ("GET", "HEAD") or error.code not in (
                    502,
                    503,
                    504,
                ):
                    raise ApiError(error.code, payload) from error
                last_error = ApiError(error.code, payload)
            except (URLError, TimeoutError) as error:
                if request_method not in ("GET", "HEAD"):
                    raise RuntimeError(
                        "Frasberg request could not be completed; POST was not retried."
                    ) from error
                last_error = error

        if last_error is not None:
            raise RuntimeError(
                "All configured Frasberg API regions failed."
            ) from last_error
        raise RuntimeError("No Frasberg API region was attempted.")


def _resolve_url(base_url: str, path: str) -> str:
    base = urlsplit(base_url if base_url.endswith("/") else f"{base_url}/")
    if (
        base.scheme not in ("https", "http")
        or not base.netloc
        or base.username is not None
        or base.password is not None
        or base.query
        or base.fragment
    ):
        raise ValueError("base URLs must be absolute HTTP(S) URLs.")
    resolved = urljoin(base.geturl(), path.lstrip("/"))
    resolved_parts = urlsplit(resolved)
    decoded_path = _decoded_path(resolved_parts.path)
    normalized_base_path = posixpath.normpath(base.path)
    normalized_request_path = posixpath.normpath(decoded_path)
    if (
        resolved_parts.netloc != base.netloc
        or (
            normalized_request_path != normalized_base_path
            and not normalized_request_path.startswith(
                f"{normalized_base_path.rstrip('/')}/"
            )
        )
    ):
        raise ValueError("path cannot escape the configured API base URL.")
    return resolved


def _decoded_path(path: str) -> str:
    return unquote(path)


def _decode_json(response_body: bytes, status: int) -> Any:
    if not response_body:
        return None
    try:
        return json.loads(response_body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise RuntimeError(
            f"Frasberg returned invalid JSON (HTTP {status})."
        ) from error


def _serialize_json(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, int):
        if abs(value) > 9_007_199_254_740_991:
            raise ValueError(
                "JSON integers must be within the safe JavaScript range."
            )
        return str(value)
    if isinstance(value, float):
        return _serialize_number(value)
    if isinstance(value, list):
        return "[" + ",".join(_serialize_json(item) for item in value) + "]"
    if isinstance(value, dict):
        if any(not isinstance(key, str) for key in value):
            raise TypeError("JSON object keys must be strings.")
        fields = (
            f"{json.dumps(key, ensure_ascii=False)}:{_serialize_json(item)}"
            for key, item in value.items()
        )
        return "{" + ",".join(fields) + "}"
    raise TypeError(f"Unsupported JSON value: {type(value).__name__}.")


def _serialize_number(value: float) -> str:
    if not math.isfinite(value):
        raise ValueError("JSON numbers must be finite.")
    if value == 0:
        return "0"

    number = Decimal(repr(value))
    if -6 <= number.adjusted() < 21:
        fixed = format(number, "f")
        return fixed.rstrip("0").rstrip(".") if "." in fixed else fixed

    normalized = number.normalize()
    digits = "".join(str(digit) for digit in normalized.as_tuple().digits)
    exponent = normalized.adjusted()
    coefficient = digits[0]
    if len(digits) > 1:
        coefficient += "." + digits[1:]
    exponent_text = f"+{exponent}" if exponent >= 0 else str(exponent)
    return f"{coefficient}e{exponent_text}"
