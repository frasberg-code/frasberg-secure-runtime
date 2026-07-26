"""Tests for Trek Booking Platform + Laws search + code highlighting endpoints"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-gateway-demo.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


# ---------- Public trek endpoints ----------

class TestTrekList:
    def test_list_returns_8_treks(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks")
        assert r.status_code == 200
        data = r.json()
        assert "treks" in data and "countries" in data and "difficulties" in data
        assert len(data["treks"]) == 8
        assert "Nepal" in data["countries"]
        assert data["difficulties"] == ["Easy", "Moderate", "Challenging", "Extreme"]

    def test_filter_q(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks", params={"q": "everest"})
        assert r.status_code == 200
        treks = r.json()["treks"]
        assert len(treks) >= 1
        assert any("everest" in t["name"].lower() for t in treks)

    def test_filter_difficulty(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks", params={"difficulty": "Moderate"})
        assert r.status_code == 200
        treks = r.json()["treks"]
        assert len(treks) >= 1
        assert all(t["difficulty"] == "Moderate" for t in treks)

    def test_filter_country(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks", params={"country": "Nepal"})
        assert r.status_code == 200
        treks = r.json()["treks"]
        assert all(t["country"] == "Nepal" for t in treks)

    def test_filter_max_price(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks", params={"max_price": 1000})
        assert r.status_code == 200
        treks = r.json()["treks"]
        assert all(t["price_usd"] <= 1000 for t in treks)

    def test_sort_price_asc(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks", params={"sort": "price_asc"})
        assert r.status_code == 200
        prices = [t["price_usd"] for t in r.json()["treks"]]
        assert prices == sorted(prices)


class TestTrekDetail:
    def test_detail_ok(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks/everest-base-camp")
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == "everest-base-camp"
        assert isinstance(d["itinerary"], list) and len(d["itinerary"]) > 0
        assert isinstance(d["departures"], list) and len(d["departures"]) > 0
        assert isinstance(d["includes"], list)

    def test_detail_unknown(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks/does-not-exist")
        assert r.status_code == 404


# ---------- Bookings ----------

class TestBookings:
    def test_booking_requires_auth(self, client):
        r = client.post(f"{BASE_URL}/api/trek/bookings", json={
            "trek_slug": "everest-base-camp",
            "departure_date": "2026-09-12",
            "participants": 2,
            "full_name": "Guest User",
            "phone": "+1234567890",
        })
        assert r.status_code in (401, 403)

    def test_booking_invalid_date(self, auth_client):
        r = auth_client.post(f"{BASE_URL}/api/trek/bookings", json={
            "trek_slug": "everest-base-camp",
            "departure_date": "1999-01-01",
            "participants": 2,
            "full_name": "TEST Admin",
            "phone": "+1234567890",
        })
        assert r.status_code == 400

    def test_booking_create_and_total(self, auth_client):
        # get price
        trek = auth_client.get(f"{BASE_URL}/api/trek/treks/langtang-valley").json()
        price = trek["price_usd"]
        dep = trek["departures"][0]
        r = auth_client.post(f"{BASE_URL}/api/trek/bookings", json={
            "trek_slug": "langtang-valley",
            "departure_date": dep,
            "participants": 3,
            "full_name": "TEST Admin",
            "phone": "+1234567890",
            "notes": "TEST booking",
        })
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["total_usd"] == price * 3
        assert b["status"] == "confirmed"
        assert b["reference"].startswith("TRK-")
        pytest.booking_id = b["id"]
        pytest.booking_ref = b["reference"]

    def test_my_bookings_lists_created(self, auth_client):
        r = auth_client.get(f"{BASE_URL}/api/trek/bookings")
        assert r.status_code == 200
        bs = r.json()["bookings"]
        assert any(b["id"] == pytest.booking_id for b in bs)

    def test_cancel_booking(self, auth_client):
        r = auth_client.delete(f"{BASE_URL}/api/trek/bookings/{pytest.booking_id}")
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"
        # verify persisted
        bs = auth_client.get(f"{BASE_URL}/api/trek/bookings").json()["bookings"]
        found = next(b for b in bs if b["id"] == pytest.booking_id)
        assert found["status"] == "cancelled"

    def test_cancel_unknown_returns_404(self, auth_client):
        r = auth_client.delete(f"{BASE_URL}/api/trek/bookings/nonexistent-id")
        assert r.status_code == 404


# ---------- Reviews ----------

class TestReviews:
    def test_reviews_public_get(self, client):
        r = client.get(f"{BASE_URL}/api/trek/treks/ai-gateway-demo/reviews")
        # trek may not exist but review list should still return []
        assert r.status_code == 200
        assert "reviews" in r.json()

    def test_review_requires_auth(self, client):
        r = client.post(f"{BASE_URL}/api/trek/treks/everest-base-camp/reviews",
                        json={"rating": 5, "comment": "amazing"})
        assert r.status_code in (401, 403)

    def test_review_rating_validation(self, auth_client):
        r = auth_client.post(f"{BASE_URL}/api/trek/treks/everest-base-camp/reviews",
                             json={"rating": 7, "comment": "TEST invalid"})
        assert r.status_code == 422

    def test_review_comment_length(self, auth_client):
        r = auth_client.post(f"{BASE_URL}/api/trek/treks/everest-base-camp/reviews",
                             json={"rating": 4, "comment": "a"})
        assert r.status_code == 422

    def test_review_create_ok(self, auth_client):
        r = auth_client.post(f"{BASE_URL}/api/trek/treks/everest-base-camp/reviews",
                             json={"rating": 5, "comment": "TEST great trek"})
        assert r.status_code == 200
        assert r.json()["rating"] == 5
