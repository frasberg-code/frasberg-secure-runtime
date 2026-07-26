import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

import auth as auth_module

db = None


def setup(database):
    global db
    globals()["db"] = database


router = APIRouter(prefix="/api/trek", tags=["trek"])

TREK_SEED = [
    {
        "slug": "everest-base-camp",
        "name": "Everest Base Camp Trek",
        "region": "Khumbu, Nepal",
        "country": "Nepal",
        "difficulty": "Challenging",
        "duration_days": 14,
        "max_altitude_m": 5545,
        "price_usd": 1490,
        "rating": 4.9,
        "group_size": "2-12",
        "best_season": "Mar-May, Sep-Nov",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/32a112e5fcfe9970509665df5ee7311c64ee2295d911da5faa9d8aa1b48c22fc.jpeg",
        "summary": "The world's most iconic trek — follow the footsteps of legends through Sherpa villages, glacial moraines and prayer-flag passes to the foot of Everest itself.",
        "highlights": ["Kala Patthar sunrise over Everest", "Tengboche Monastery", "Namche Bazaar acclimatization", "Khumbu Icefall views", "Sherpa culture immersion"],
        "includes": ["All permits & TIMS card", "Licensed guide & porters", "Teahouse accommodation", "3 meals per day on trek", "Domestic flights (KTM-Lukla)"],
        "itinerary": [
            {"day": 1, "title": "Fly to Lukla, trek to Phakding", "detail": "Scenic mountain flight, gentle riverside walk (2,610 m)."},
            {"day": 2, "title": "Namche Bazaar", "detail": "Cross suspension bridges, steep climb to the Sherpa capital (3,440 m)."},
            {"day": 3, "title": "Acclimatization day", "detail": "Hike to Everest View Hotel, first sight of Everest."},
            {"day": 5, "title": "Tengboche Monastery", "detail": "The most beautiful monastery in the Khumbu (3,860 m)."},
            {"day": 8, "title": "Lobuche to Gorak Shep", "detail": "Along the Khumbu Glacier moraine (5,164 m)."},
            {"day": 9, "title": "Everest Base Camp", "detail": "Stand at the foot of the world's highest mountain (5,364 m)."},
            {"day": 10, "title": "Kala Patthar sunrise", "detail": "The classic Everest panorama (5,545 m), descend to Pheriche."},
            {"day": 14, "title": "Fly back to Kathmandu", "detail": "Farewell celebration dinner."},
        ],
        "departures": ["2026-09-12", "2026-09-26", "2026-10-10", "2026-10-24", "2026-11-07"],
    },
    {
        "slug": "annapurna-circuit",
        "name": "Annapurna Circuit Trek",
        "region": "Annapurna, Nepal",
        "country": "Nepal",
        "difficulty": "Challenging",
        "duration_days": 12,
        "max_altitude_m": 5416,
        "price_usd": 1190,
        "rating": 4.8,
        "group_size": "2-14",
        "best_season": "Mar-May, Oct-Nov",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/ed607a8fff4c7fa021b46e94d4311ef611bfb3663ecc4ca44e35398ff99113ed.jpeg",
        "summary": "The classic Himalayan circuit — subtropical valleys, high desert, the mighty Thorong La pass and the sacred temple of Muktinath in one unforgettable loop.",
        "highlights": ["Thorong La Pass (5,416 m)", "Muktinath temple", "Manang valley", "Marsyangdi river gorges", "Apple orchards of Marpha"],
        "includes": ["ACAP & TIMS permits", "Licensed guide & porters", "Teahouse accommodation", "3 meals per day on trek", "Private transport to trailhead"],
        "itinerary": [
            {"day": 1, "title": "Drive to Chame", "detail": "Jeep ride through the Marsyangdi valley (2,710 m)."},
            {"day": 3, "title": "Upper Pisang to Manang", "detail": "The scenic high route with Annapurna II views (3,540 m)."},
            {"day": 4, "title": "Acclimatization in Manang", "detail": "Ice Lake day hike, bakeries and mountain cinema."},
            {"day": 6, "title": "Thorong Phedi", "detail": "Base of the great pass (4,540 m)."},
            {"day": 7, "title": "Thorong La Pass", "detail": "Cross 5,416 m at dawn, descend to Muktinath."},
            {"day": 9, "title": "Kagbeni & Jomsom", "detail": "Gateway to Upper Mustang, windswept Kali Gandaki valley."},
            {"day": 12, "title": "Fly to Pokhara", "detail": "Lakeside celebration."},
        ],
        "departures": ["2026-09-19", "2026-10-03", "2026-10-17", "2026-10-31", "2026-11-14"],
    },
    {
        "slug": "langtang-valley",
        "name": "Langtang Valley Trek",
        "region": "Langtang, Nepal",
        "country": "Nepal",
        "difficulty": "Moderate",
        "duration_days": 8,
        "max_altitude_m": 4984,
        "price_usd": 790,
        "rating": 4.7,
        "group_size": "2-12",
        "best_season": "Mar-May, Oct-Dec",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/b1a662b41b1cfb6581b4c990876ae01bfc06639971f6d46a2f3e50fedeff098f.jpeg",
        "summary": "The valley of glaciers — a short, soulful trek through Tamang villages and yak pastures beneath Langtang Lirung, closer to Kathmandu than any other big-mountain trail.",
        "highlights": ["Kyanjin Ri summit (4,773 m)", "Kyanjin Gompa & yak cheese factory", "Tamang heritage villages", "Langtang Lirung glacier", "Red panda territory forests"],
        "includes": ["Langtang National Park permit", "Licensed guide & porters", "Teahouse accommodation", "3 meals per day on trek", "Private transport from Kathmandu"],
        "itinerary": [
            {"day": 1, "title": "Drive to Syabrubesi", "detail": "Winding mountain roads north of Kathmandu (1,550 m)."},
            {"day": 2, "title": "Lama Hotel", "detail": "Rhododendron and bamboo forest along the Langtang Khola."},
            {"day": 3, "title": "Langtang Village", "detail": "Rebuilt village beneath the great north wall (3,430 m)."},
            {"day": 4, "title": "Kyanjin Gompa", "detail": "Monastery, glaciers, and the famous cheese factory (3,870 m)."},
            {"day": 5, "title": "Kyanjin Ri or Tserko Ri", "detail": "Summit day — 360° Himalayan panorama."},
            {"day": 8, "title": "Return to Kathmandu", "detail": "Drive back with a farewell dinner."},
        ],
        "departures": ["2026-09-05", "2026-09-20", "2026-10-04", "2026-10-18", "2026-11-01"],
    },
    {
        "slug": "kilimanjaro-machame",
        "name": "Kilimanjaro — Machame Route",
        "region": "Kilimanjaro, Tanzania",
        "country": "Tanzania",
        "difficulty": "Challenging",
        "duration_days": 7,
        "max_altitude_m": 5895,
        "price_usd": 2390,
        "rating": 4.8,
        "group_size": "2-10",
        "best_season": "Jan-Mar, Jun-Oct",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/46a2817311185ae6b1a39869c42d8bd1335d0c7ec05fa73a95adb00253aed9cd.jpeg",
        "summary": "Africa's rooftop by the 'Whiskey Route' — five climate zones from rainforest to arctic summit, ending at Uhuru Peak, the highest free-standing mountain on Earth.",
        "highlights": ["Uhuru Peak summit (5,895 m)", "Barranco Wall scramble", "Shira Plateau sunsets", "Rainforest colobus monkeys", "Summit night under the stars"],
        "includes": ["Park fees & rescue fees", "Professional mountain crew", "4-season camping equipment", "All meals on the mountain", "Airport transfers"],
        "itinerary": [
            {"day": 1, "title": "Machame Gate to Machame Camp", "detail": "Through dense rainforest (2,835 m)."},
            {"day": 2, "title": "Shira Camp", "detail": "Moorland ridge with first summit views (3,750 m)."},
            {"day": 3, "title": "Lava Tower to Barranco", "detail": "Climb high, sleep low — key acclimatization (4,630 m)."},
            {"day": 4, "title": "Barranco Wall to Karanga", "detail": "The famous scramble above the clouds."},
            {"day": 5, "title": "Barafu Base Camp", "detail": "Rest and prepare for summit night (4,673 m)."},
            {"day": 6, "title": "Uhuru Peak summit", "detail": "Midnight start, sunrise at the roof of Africa, descend to Mweka."},
            {"day": 7, "title": "Mweka Gate", "detail": "Certificates and celebration."},
        ],
        "departures": ["2026-08-08", "2026-08-22", "2026-09-05", "2026-09-19", "2026-10-03"],
    },
    {
        "slug": "inca-trail",
        "name": "Classic Inca Trail to Machu Picchu",
        "region": "Cusco, Peru",
        "country": "Peru",
        "difficulty": "Moderate",
        "duration_days": 4,
        "max_altitude_m": 4215,
        "price_usd": 1090,
        "rating": 4.9,
        "group_size": "2-16",
        "best_season": "Apr-Oct",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/97c7dd8e8f767c15fb485a3e6d27f00c0ffe91f43da0ae126f33a1a064a2eb54.jpeg",
        "summary": "The pilgrimage of the Andes — original Inca stonework, cloud-forest ruins and the Sun Gate arrival at Machu Picchu that no train traveler will ever know.",
        "highlights": ["Sun Gate sunrise over Machu Picchu", "Dead Woman's Pass (4,215 m)", "Wiñay Wayna ruins", "Original Inca stone paths", "Cloud forest orchids"],
        "includes": ["Inca Trail permit & entry", "Bilingual archaeologist guide", "Full camping service & chef", "Machu Picchu guided tour", "Return train to Cusco"],
        "itinerary": [
            {"day": 1, "title": "Km 82 to Wayllabamba", "detail": "Gentle start past Llactapata ruins (3,000 m)."},
            {"day": 2, "title": "Dead Woman's Pass", "detail": "The big climb — highest point of the trail (4,215 m)."},
            {"day": 3, "title": "Runkurakay to Wiñay Wayna", "detail": "Three ruin complexes and endless cloud forest."},
            {"day": 4, "title": "Sun Gate to Machu Picchu", "detail": "Pre-dawn hike to Inti Punku, guided tour of the citadel."},
        ],
        "departures": ["2026-07-15", "2026-08-05", "2026-08-19", "2026-09-09", "2026-09-23"],
    },
    {
        "slug": "tour-du-mont-blanc",
        "name": "Tour du Mont Blanc",
        "region": "Alps — France, Italy, Switzerland",
        "country": "France",
        "difficulty": "Moderate",
        "duration_days": 10,
        "max_altitude_m": 2665,
        "price_usd": 1890,
        "rating": 4.7,
        "group_size": "4-12",
        "best_season": "Jun-Sep",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/1cb76dc666e1e6a70c7fb82f45a5fbcd3f20aacc1ec8160612b92588654b6ac2.jpeg",
        "summary": "Three countries, one mountain — circle the Mont Blanc massif through flower meadows, glacier valleys and alpine villages with fondue and fresh bread every night.",
        "highlights": ["Col de la Seigne border crossing", "Courmayeur Italian side", "Lac Blanc reflections", "Grand Col Ferret", "Chamonix finish"],
        "includes": ["Mountain refuge & hotel nights", "IML certified guide", "Luggage transfers", "Breakfasts & mountain dinners", "Cable cars & local buses"],
        "itinerary": [
            {"day": 1, "title": "Chamonix to Les Contamines", "detail": "Over the Col de Tricot beneath the Bionnassay glacier."},
            {"day": 3, "title": "Col de la Seigne", "detail": "Cross into Italy — Vallée des Glaciers behind, Val Veny ahead."},
            {"day": 4, "title": "Courmayeur", "detail": "Rest morning, espresso and the Italian face of Mont Blanc."},
            {"day": 6, "title": "Grand Col Ferret", "detail": "Into Switzerland through the pastoral Val Ferret (2,537 m)."},
            {"day": 8, "title": "Fenêtre d'Arpette", "detail": "The wildest variant — boulder fields and the Trient glacier."},
            {"day": 10, "title": "Lac Blanc to Chamonix", "detail": "The definitive Mont Blanc mirror shot, descend to town."},
        ],
        "departures": ["2026-07-04", "2026-07-18", "2026-08-01", "2026-08-15", "2026-08-29"],
    },
    {
        "slug": "kashmir-great-lakes",
        "name": "Kashmir Great Lakes Trek",
        "region": "Kashmir, India",
        "country": "India",
        "difficulty": "Moderate",
        "duration_days": 7,
        "max_altitude_m": 4191,
        "price_usd": 690,
        "rating": 4.8,
        "group_size": "4-16",
        "best_season": "Jul-Sep",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/1c88e4168af21ac32c1cbd0669ecde608180f427af191fafbe5b29f5315ab57a.jpeg",
        "summary": "India's most beautiful trek — seven alpine lakes in seven days, each a different shade of turquoise, strung across wildflower meadows beneath 5,000 m peaks.",
        "highlights": ["Vishansar & Kishansar twin lakes", "Gadsar Pass (4,191 m)", "Satsar seven lakes", "Gangbal beneath Harmukh", "Shepherd meadows of Sonamarg"],
        "includes": ["All camping equipment", "Expert trek leader & staff", "All meals on trek", "Permits & forest fees", "Srinagar transfers"],
        "itinerary": [
            {"day": 1, "title": "Sonamarg to Nichnai", "detail": "Meadow climb out of the treeline (3,450 m)."},
            {"day": 2, "title": "Vishansar Lake", "detail": "First great lake, camp on its shore (3,710 m)."},
            {"day": 3, "title": "Gadsar Pass", "detail": "Highest point — twin lakes behind, wildflowers ahead."},
            {"day": 4, "title": "Satsar Lakes", "detail": "A chain of seven pools among boulder fields."},
            {"day": 5, "title": "Gangbal & Nundkol", "detail": "Grand finale beneath Mt. Harmukh (3,600 m)."},
            {"day": 7, "title": "Naranag descent", "detail": "Steep pine forest exit, drive to Srinagar."},
        ],
        "departures": ["2026-07-12", "2026-07-26", "2026-08-09", "2026-08-23", "2026-09-06"],
    },
    {
        "slug": "torres-del-paine-w",
        "name": "Torres del Paine W Trek",
        "region": "Patagonia, Chile",
        "country": "Chile",
        "difficulty": "Moderate",
        "duration_days": 5,
        "max_altitude_m": 1200,
        "price_usd": 1590,
        "rating": 4.8,
        "group_size": "2-12",
        "best_season": "Nov-Mar",
        "image": "https://static.prod-images.emergentagent.com/jobs/c11f9f25-7faf-4488-ab1c-61bcece714f5/images/facc301aa2fef39614a11baafe1a2e9e1d96a6a2877dae2d66f0c90488f16dd0.jpeg",
        "summary": "Patagonia's masterpiece — granite towers, electric-blue glaciers and wind-carved steppe on the legendary W circuit through Torres del Paine National Park.",
        "highlights": ["Base of the Towers sunrise", "Grey Glacier viewpoint", "French Valley amphitheatre", "Lake Pehoé crossing", "Guanacos & condors"],
        "includes": ["Park entrance fees", "Refugio full board", "Certified Patagonia guide", "Catamaran & park transfers", "Puerto Natales transfers"],
        "itinerary": [
            {"day": 1, "title": "Base of the Towers", "detail": "The iconic granite trio above a glacial lagoon (900 m)."},
            {"day": 2, "title": "Los Cuernos traverse", "detail": "Along Lake Nordenskjöld beneath the Horns."},
            {"day": 3, "title": "French Valley", "detail": "Hanging glaciers thundering off Paine Grande."},
            {"day": 4, "title": "Grey Glacier", "detail": "Face-to-face with the Southern Patagonian Ice Field."},
            {"day": 5, "title": "Catamaran exit", "detail": "Cross Lake Pehoé, return to Puerto Natales."},
        ],
        "departures": ["2026-11-10", "2026-11-24", "2026-12-08", "2026-12-22", "2027-01-05"],
    },
]

DIFFICULTIES = ["Easy", "Moderate", "Challenging", "Extreme"]


async def seed_treks():
    for t in TREK_SEED:
        await db.treks.update_one({"slug": t["slug"]}, {"$set": t}, upsert=True)
    await db.trek_bookings.create_index([("user_id", 1), ("created_at", -1)])
    await db.trek_reviews.create_index([("trek_slug", 1), ("created_at", -1)])


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@router.get("/treks")
async def list_treks(q: Optional[str] = None, difficulty: Optional[str] = None,
                     country: Optional[str] = None, max_price: Optional[int] = None,
                     sort: Optional[str] = None):
    query = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"region": {"$regex": q, "$options": "i"}},
            {"summary": {"$regex": q, "$options": "i"}},
        ]
    if difficulty:
        query["difficulty"] = difficulty
    if country:
        query["country"] = country
    if max_price:
        query["price_usd"] = {"$lte": max_price}
    sort_map = {"price_asc": ("price_usd", 1), "price_desc": ("price_usd", -1),
                "duration": ("duration_days", 1), "rating": ("rating", -1)}
    field, direction = sort_map.get(sort, ("rating", -1))
    docs = await db.treks.find(query).sort(field, direction).to_list(100)
    countries = sorted(await db.treks.distinct("country"))
    return {"treks": [_clean(d) for d in docs], "countries": countries, "difficulties": DIFFICULTIES}


@router.get("/treks/{slug}")
async def get_trek(slug: str):
    doc = await db.treks.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Trek not found")
    return _clean(doc)


class BookingCreate(BaseModel):
    trek_slug: str
    departure_date: str
    participants: int = Field(ge=1, le=16)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=30)
    notes: Optional[str] = Field(default=None, max_length=500)


@router.post("/bookings")
async def create_booking(body: BookingCreate, user: dict = Depends(auth_module.get_current_user)):
    trek = await db.treks.find_one({"slug": body.trek_slug})
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")
    if body.departure_date not in trek["departures"]:
        raise HTTPException(status_code=400, detail="Invalid departure date for this trek")
    booking = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "trek_slug": trek["slug"],
        "trek_name": trek["name"],
        "trek_image": trek["image"],
        "region": trek["region"],
        "duration_days": trek["duration_days"],
        "departure_date": body.departure_date,
        "participants": body.participants,
        "full_name": body.full_name,
        "phone": body.phone,
        "notes": body.notes or "",
        "price_per_person": trek["price_usd"],
        "total_usd": trek["price_usd"] * body.participants,
        "status": "confirmed",
        "reference": f"TRK-{uuid.uuid4().hex[:8].upper()}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.trek_bookings.insert_one({**booking})
    return booking


@router.get("/bookings")
async def my_bookings(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.trek_bookings.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return {"bookings": [_clean(d) for d in docs]}


@router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.trek_bookings.update_one(
        {"id": booking_id, "user_id": user["id"]}, {"$set": {"status": "cancelled"}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"ok": True, "status": "cancelled"}


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=1000)


@router.get("/treks/{slug}/reviews")
async def list_reviews(slug: str):
    docs = await db.trek_reviews.find({"trek_slug": slug}).sort("created_at", -1).to_list(50)
    return {"reviews": [_clean(d) for d in docs]}


@router.post("/treks/{slug}/reviews")
async def create_review(slug: str, body: ReviewCreate, user: dict = Depends(auth_module.get_current_user)):
    trek = await db.treks.find_one({"slug": slug})
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")
    review = {
        "id": str(uuid.uuid4()),
        "trek_slug": slug,
        "user_name": user.get("name", "Trekker"),
        "rating": body.rating,
        "comment": body.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.trek_reviews.insert_one({**review})
    return review
