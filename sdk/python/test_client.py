import hashlib
import hmac
import json
import unittest
from unittest.mock import patch
from urllib.error import URLError

from client import Frasberg, _serialize_json


class FakeResponse:
    def __init__(self, payload, status=200):
        self.status = status
        self._payload = json.dumps(payload).encode()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def read(self):
        return self._payload


class FrasbergTests(unittest.TestCase):
    def test_post_is_signed_and_bound_to_the_selected_tenant(self):
        client = Frasberg("secret", tenant_id="tenant-a")
        with patch("client.urlopen", return_value=FakeResponse({"ok": True})) as send:
            self.assertEqual(client.request("/v1/chat", {"text": "hello"}), {"ok": True})

        request = send.call_args.args[0]
        body = request.data.decode()
        expected = hmac.new(b"secret", body.encode(), hashlib.sha256).hexdigest()
        self.assertEqual(request.get_header("X-api-signature"), expected)
        self.assertEqual(request.get_header("X-tenant-id"), "tenant-a")
        self.assertIsNone(request.get_header("X-owner-id"))

    def test_get_fails_over_but_post_is_not_retried(self):
        client = Frasberg("secret", base_urls=["https://one.example/api", "https://two.example/api"])
        with patch(
            "client.urlopen",
            side_effect=[URLError("offline"), FakeResponse({"ok": True})],
        ) as send:
            self.assertEqual(client.request("/health"), {"ok": True})
        self.assertEqual(send.call_count, 2)

        with patch("client.urlopen", side_effect=URLError("offline")) as send:
            with self.assertRaisesRegex(RuntimeError, "POST was not retried"):
                client.request("/jobs", {"prompt": "test"})
        self.assertEqual(send.call_count, 1)

    def test_http_errors_are_not_converted_to_success(self):
        client = Frasberg("secret")
        with patch("client.urlopen", side_effect=URLError("offline")):
            with self.assertRaises(RuntimeError):
                client.request("/health")

    def test_rejects_host_override_paths(self):
        client = Frasberg("secret")
        with self.assertRaisesRegex(ValueError, "absolute path"):
            client.request("//attacker.example/path")

    def test_rejects_paths_that_escape_the_configured_base(self):
        client = Frasberg("secret", base_urls=["https://runtime.example/api"])
        with self.assertRaisesRegex(ValueError, "escape"):
            client.request("/%2e%2e/private")

    def test_rejects_an_explicit_empty_region_list(self):
        with self.assertRaisesRegex(ValueError, "At least one"):
            Frasberg("secret", base_urls=[])

    def test_json_encoding_matches_javascript_for_supported_numbers(self):
        self.assertEqual(
            _serialize_json(
                {
                    "text": "caf\u00e9",
                    "values": [1, 0.000001, 0.0000001, 1e20, 1e21],
                }
            ),
            '{"text":"caf\u00e9","values":[1,0.000001,1e-7,100000000000000000000,1e+21]}',
        )

    def test_rejects_non_finite_json_numbers(self):
        with self.assertRaisesRegex(ValueError, "finite"):
            _serialize_json(float("nan"))


if __name__ == "__main__":
    unittest.main()
