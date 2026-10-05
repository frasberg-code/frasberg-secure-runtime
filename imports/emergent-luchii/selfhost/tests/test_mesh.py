import os
import sys
import json
import base64

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "luchii_ci")
os.environ.setdefault("JWT_SECRET", "ci-only-secret")
os.environ.setdefault("EMERGENT_LLM_KEY", "ci-only-key")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

import mesh_ws  # noqa: E402
from nacl.public import PrivateKey, SealedBox  # noqa: E402


def test_sign_verify():
    data = {"role": "user", "content": "hello"}
    sig = mesh_ws.sign(data)
    assert mesh_ws.verify(data, sig) is True


def test_tamper_detection():
    data = {"role": "user", "content": "hello"}
    sig = mesh_ws.sign(data)
    data["content"] = "tampered"
    assert mesh_ws.verify(data, sig) is False


def test_empty_signature_rejected():
    assert mesh_ws.verify({"content": "x"}, "") is False


def test_sealed_box_roundtrip():
    sk = PrivateKey.generate()
    payload = {"content": "Frasberg mesh test", "session_id": "ci"}
    sealed = SealedBox(sk.public_key).encrypt(json.dumps(payload).encode())
    sealed_b64 = base64.b64encode(sealed).decode()
    plain = SealedBox(sk).decrypt(base64.b64decode(sealed_b64))
    assert json.loads(plain.decode()) == payload


def test_signed_envelope_shape():
    env = mesh_ws._signed({"event": "pong"})
    assert env["sig"] and mesh_ws.verify({"event": "pong"}, env["sig"])
