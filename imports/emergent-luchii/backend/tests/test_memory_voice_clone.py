"""Iteration 11 — Backend tests:
- Memory Manager CRUD + validation (POST/PUT/DELETE /api/memory)
- Voice Clone lifecycle (status, upload, custom speak, delete, fallback)
- /api/voice/engine reports xtts-v2 (cloning) ready
"""
import base64
import os
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}


@pytest.fixture(scope="module", autouse=True)
def _wait_engine_ready():
    deadline = time.time() + 120
    while time.time() < deadline:
        try:
            d = requests.get(f"{API}/voice/engine", timeout=10).json()
            if (d.get("stt", {}).get("status") == "ready"
                    and d.get("tts", {}).get("status") == "ready"
                    and d.get("memory_vault", {}).get("status") == "ready"):
                return
        except Exception:
            pass
        time.sleep(5)
    pytest.skip("Sovereign engine not ready in 120s")


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=20)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def other_user():
    s = requests.Session()
    email = f"TEST_other_{int(time.time())}@example.com"
    r = s.post(f"{API}/auth/register",
               json={"name": "TEST Other", "email": email, "password": "TestPass2026!"},
               timeout=20)
    if r.status_code not in (200, 201):
        # try login as fallback
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "TestPass2026!"}, timeout=20)
    assert r.status_code in (200, 201), f"register/login failed: {r.status_code} {r.text}"
    return s


# -------------------- /api/voice/engine --------------------
class TestEngineStatus:
    def test_engine_cloning_ready(self):
        r = requests.get(f"{API}/voice/engine", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("stt", {}).get("status") == "ready"
        assert d.get("tts", {}).get("status") == "ready"
        assert d.get("memory_vault", {}).get("status") == "ready"
        cloning = d.get("cloning") or {}
        assert "xtts" in (cloning.get("model") or "").lower(), f"cloning model missing: {cloning}"
        assert cloning.get("status") == "ready", f"cloning not ready: {cloning}"


# -------------------- Memory Manager CRUD --------------------
class TestMemoryCRUD:
    created_ids = []

    def test_guest_memory_requires_auth(self):
        r = requests.post(f"{API}/memory", json={"fact": "guest cannot write"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_create_memory_persists(self, admin):
        payload = {"fact": "TEST_favorite_color is aqua"}
        r = admin.post(f"{API}/memory", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d["fact"] == payload["fact"]
        assert "id" in d
        TestMemoryCRUD.created_ids.append(d["id"])
        # Verify persistence
        lst = admin.get(f"{API}/memory", timeout=15).json()
        assert any(m["id"] == d["id"] and m["fact"] == payload["fact"] for m in lst)

    def test_validation_too_short(self, admin):
        r = admin.post(f"{API}/memory", json={"fact": "hi"}, timeout=15)
        assert r.status_code == 400, r.text

    def test_validation_too_long(self, admin):
        r = admin.post(f"{API}/memory", json={"fact": "x" * 301}, timeout=15)
        assert r.status_code == 400, r.text

    def test_update_memory_persists(self, admin):
        assert TestMemoryCRUD.created_ids, "no memory to update"
        mid = TestMemoryCRUD.created_ids[0]
        r = admin.put(f"{API}/memory/{mid}", json={"fact": "TEST_favorite_color is magenta"}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["fact"] == "TEST_favorite_color is magenta"
        lst = admin.get(f"{API}/memory", timeout=15).json()
        m = next((x for x in lst if x["id"] == mid), None)
        assert m and m["fact"] == "TEST_favorite_color is magenta"

    def test_update_validation_too_short(self, admin):
        assert TestMemoryCRUD.created_ids
        mid = TestMemoryCRUD.created_ids[0]
        r = admin.put(f"{API}/memory/{mid}", json={"fact": "ab"}, timeout=15)
        assert r.status_code == 400

    def test_other_users_id_404(self, admin, other_user):
        # Create memory as other user, then attempt to update as admin
        r = other_user.post(f"{API}/memory", json={"fact": "TEST_other_user_secret"}, timeout=15)
        assert r.status_code in (200, 201)
        foreign_id = r.json()["id"]
        r = admin.put(f"{API}/memory/{foreign_id}", json={"fact": "TEST_hacked_by_admin_yz"}, timeout=15)
        assert r.status_code == 404, f"expected 404 for cross-user; got {r.status_code}"
        r = admin.delete(f"{API}/memory/{foreign_id}", timeout=15)
        assert r.status_code == 404
        # cleanup
        other_user.delete(f"{API}/memory/{foreign_id}", timeout=15)

    def test_delete_memory(self, admin):
        assert TestMemoryCRUD.created_ids
        mid = TestMemoryCRUD.created_ids[0]
        r = admin.delete(f"{API}/memory/{mid}", timeout=15)
        assert r.status_code == 200
        # verify gone
        r2 = admin.delete(f"{API}/memory/{mid}", timeout=15)
        assert r2.status_code == 404
        TestMemoryCRUD.created_ids.pop(0)


# -------------------- Voice Clone lifecycle --------------------
class TestVoiceClone:
    saved_sample_bytes = None  # to re-upload at end
    was_cloned_before = False

    def test_status_before(self, admin):
        r = admin.get(f"{API}/voice/clone/status", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "has_sample" in d and "cloning_status" in d
        TestVoiceClone.was_cloned_before = bool(d.get("has_sample"))

    def _make_sample(self, admin) -> bytes:
        """Get a real WAV via /api/voice/speak (p251/p273 fallback) — long enough (>3s)."""
        # Ask for ~15s of text so wav > 3s
        long_text = (
            "This is a sovereign voice cloning enrollment sample recorded for automated testing. "
            "I speak in a steady, calm cadence so the model can learn my timbre and rhythm. "
            "Frasberg Luchii, Court World, Constitution, Realms, and Mythos."
        )
        r = admin.post(f"{API}/voice/speak", json={"text": long_text, "voice": "p273"}, timeout=180)
        assert r.status_code == 200, f"speak failed: {r.status_code} {r.text[:300]}"
        d = r.json()
        assert d.get("mime") == "audio/wav" and d.get("engine") == "frasberg-sovereign"
        wav = base64.b64decode(d["audio_base64"])
        assert wav[:4] == b"RIFF"
        return wav

    def test_upload_sample(self, admin):
        wav = self._make_sample(admin)
        TestVoiceClone.saved_sample_bytes = wav
        files = {"file": ("sample.wav", wav, "audio/wav")}
        r = admin.post(f"{API}/voice/clone", files=files, timeout=60)
        assert r.status_code == 200, f"clone upload failed: {r.status_code} {r.text[:300]}"
        d = r.json()
        assert d.get("ok") is True
        assert d.get("duration_sec", 0) >= 3, f"duration should be >=3s: {d}"
        # status
        s = admin.get(f"{API}/voice/clone/status", timeout=15).json()
        assert s["has_sample"] is True

    def test_short_sample_rejected(self, admin):
        # Craft a tiny 1s silent wav
        import struct, wave, io
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
            w.writeframes(b"\x00\x00" * 16000)  # 1 second
        buf.seek(0)
        files = {"file": ("tiny.wav", buf.read(), "audio/wav")}
        r = admin.post(f"{API}/voice/clone", files=files, timeout=30)
        assert r.status_code == 400, f"expected 400 for short sample; got {r.status_code} {r.text[:200]}"

    def test_speak_custom_returns_clone_engine(self, admin):
        r = admin.post(f"{API}/voice/speak",
                       json={"text": "Testing my cloned sovereign voice.", "voice": "custom"},
                       timeout=240)
        assert r.status_code == 200, f"clone speak failed: {r.status_code} {r.text[:300]}"
        d = r.json()
        assert d.get("engine") == "frasberg-sovereign-clone", f"got engine {d.get('engine')}"
        assert d.get("mime") == "audio/wav"
        assert len(d.get("audio_base64", "")) > 1000

    def test_delete_clone(self, admin):
        r = admin.delete(f"{API}/voice/clone", timeout=15)
        assert r.status_code == 200
        s = admin.get(f"{API}/voice/clone/status", timeout=15).json()
        assert s["has_sample"] is False

    def test_speak_custom_fallback_after_delete(self, admin):
        r = admin.post(f"{API}/voice/speak",
                       json={"text": "After delete, custom should fall back.", "voice": "custom"},
                       timeout=180)
        assert r.status_code == 200
        d = r.json()
        assert d.get("engine") == "frasberg-sovereign", f"expected fallback engine sovereign; got {d.get('engine')}"

    def test_zzz_restore_sample(self, admin):
        """Re-upload the sample at end so admin user retains their clone."""
        if TestVoiceClone.saved_sample_bytes is None or not TestVoiceClone.was_cloned_before:
            pytest.skip("no prior sample to restore")
        files = {"file": ("sample.wav", TestVoiceClone.saved_sample_bytes, "audio/wav")}
        r = admin.post(f"{API}/voice/clone", files=files, timeout=60)
        assert r.status_code == 200


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v", "--tb=short"]))
