import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, TrendingUp, Users, CalendarDays, Check, ChevronDown, Minus, Plus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TrekNav, TrekFooter } from "../../components/trek/TrekNav";
import { useAuth } from "../../context/AuthContext";
import Seo from "../../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/trek`;

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#e4ddd0] bg-white p-4">
      <Icon size={16} className="text-[#c2701e]" />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a8a80]">{label}</p>
      <p className="mt-1 font-display text-lg font-700">{value}</p>
    </div>
  );
}

export default function TrekDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trek, setTrek] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [openDay, setOpenDay] = useState(null);
  const [date, setDate] = useState("");
  const [pax, setPax] = useState(2);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [tr, rr] = await Promise.all([
          fetch(`${API}/treks/${slug}`),
          fetch(`${API}/treks/${slug}/reviews`),
        ]);
        if (!tr.ok) { setNotFound(true); return; }
        const t = await tr.json();
        setTrek(t);
        setDate(t.departures[0] || "");
        const r = await rr.json();
        setReviews(r.reviews || []);
      } catch { setNotFound(true); }
    })();
  }, [slug]);

  useEffect(() => { if (user?.name) setFullName((v) => v || user.name); }, [user]);

  async function book(e) {
    e.preventDefault();
    if (!user) { toast.error("Sign in to book this trek"); navigate("/auth"); return; }
    if (!fullName.trim() || !phone.trim()) { toast.error("Please fill in your name and phone"); return; }
    setBooking(true);
    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trek_slug: slug, departure_date: date, participants: pax, full_name: fullName.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Booking failed");
      toast.success(`Booked! Reference ${data.reference}`);
      navigate("/trek/bookings");
    } catch (err) {
      toast.error(err.message || "Booking failed — please try again");
    } finally {
      setBooking(false);
    }
  }

  async function postReview(e) {
    e.preventDefault();
    if (!user) { toast.error("Sign in to leave a review"); navigate("/auth"); return; }
    if (comment.trim().length < 3) { toast.error("Write a few words first"); return; }
    setPosting(true);
    try {
      const res = await fetch(`${API}/treks/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed");
      setReviews((r) => [data, ...r]);
      setComment("");
      toast.success("Review posted");
    } catch {
      toast.error("Could not post review");
    } finally {
      setPosting(false);
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#f6f3ec] text-[#1f2a24]">
        <TrekNav />
        <div className="mx-auto max-w-3xl px-4 py-32 text-center">
          <p className="font-display text-2xl font-700">Trek not found</p>
          <Link to="/trek" className="mt-4 inline-block text-[#2d5a3d] underline" data-testid="trek-notfound-back">Browse all treks</Link>
        </div>
        <TrekFooter />
      </main>
    );
  }

  if (!trek) {
    return (
      <main className="min-h-screen bg-[#f6f3ec]">
        <TrekNav />
        <div className="grid place-items-center py-40"><Loader2 size={28} className="animate-spin text-[#2d5a3d]" /></div>
      </main>
    );
  }

  const total = trek.price_usd * pax;

  return (
    <main className="min-h-screen bg-[#f6f3ec] text-[#1f2a24]" data-testid="trek-detail-page">
      <Seo title={`${trek.name} — Frasberg Treks`} description={trek.summary} />
      <TrekNav />

      <div className="relative h-[42vh] min-h-[300px] overflow-hidden sm:h-[52vh]">
        <img src={trek.image} alt={trek.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 sm:px-8">
          <Link to="/trek" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white" data-testid="trek-detail-back">
            <ArrowLeft size={14} /> All treks
          </Link>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="font-display text-3xl font-700 tracking-tighter text-white sm:text-5xl">
            {trek.name}
          </motion.h1>
          <p className="mt-2 flex items-center gap-3 text-sm text-white/85">
            <span>{trek.region}</span>
            <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" /> {trek.rating}</span>
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl gap-10 px-4 py-10 sm:px-8 lg:grid lg:grid-cols-[1fr_380px]">
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Clock} label="Duration" value={`${trek.duration_days} days`} />
            <Stat icon={TrendingUp} label="Max altitude" value={`${trek.max_altitude_m.toLocaleString()} m`} />
            <Stat icon={Users} label="Group size" value={trek.group_size} />
            <Stat icon={CalendarDays} label="Best season" value={trek.best_season} />
          </div>

          <p className="mt-8 text-base leading-relaxed text-[#4a5a50] sm:text-lg">{trek.summary}</p>

          <h2 className="mt-10 font-display text-lg font-700 tracking-tight">Highlights</h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {trek.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-[#4a5a50]">
                <Check size={15} className="mt-0.5 shrink-0 text-[#2d5a3d]" /> {h}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 font-display text-lg font-700 tracking-tight">Itinerary</h2>
          <div className="mt-4 space-y-2.5" data-testid="trek-itinerary">
            {trek.itinerary.map((d) => (
              <div key={d.day} className="overflow-hidden rounded-2xl border border-[#e4ddd0] bg-white">
                <button onClick={() => setOpenDay(openDay === d.day ? null : d.day)} data-testid={`trek-itinerary-day-${d.day}`}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2d5a3d]/10 font-mono text-xs font-700 text-[#2d5a3d]">{d.day}</span>
                    <span className="font-600">{d.title}</span>
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-[#7a8a80] transition-transform ${openDay === d.day ? "rotate-180" : ""}`} />
                </button>
                {openDay === d.day && <p className="border-t border-[#efeadf] px-5 py-4 text-sm text-[#4a5a50]">{d.detail}</p>}
              </div>
            ))}
          </div>

          <h2 className="mt-10 font-display text-lg font-700 tracking-tight">What's included</h2>
          <ul className="mt-4 space-y-2.5">
            {trek.includes.map((inc) => (
              <li key={inc} className="flex items-start gap-2.5 text-sm text-[#4a5a50]">
                <Check size={15} className="mt-0.5 shrink-0 text-[#2d5a3d]" /> {inc}
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-lg font-700 tracking-tight">Trekker reviews</h2>
          <form onSubmit={postReview} className="mt-4 rounded-2xl border border-[#e4ddd0] bg-white p-5" data-testid="trek-review-form">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} aria-label={`Rate ${s} stars`} data-testid={`trek-review-star-${s}`}>
                  <Star size={20} className={s <= rating ? "fill-amber-400 text-amber-400" : "text-[#d8d2c4]"} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              placeholder={user ? "How was your experience on this trek?" : "Sign in to share your experience…"}
              data-testid="trek-review-input"
              className="mt-3 w-full resize-none rounded-xl border border-[#e4ddd0] bg-[#faf8f3] p-3 text-sm outline-none focus:border-[#2d5a3d]" />
            <button type="submit" disabled={posting} data-testid="trek-review-submit"
              className="mt-3 rounded-full bg-[#2d5a3d] px-6 py-2.5 text-sm font-600 text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50">
              {posting ? "Posting…" : "Post review"}
            </button>
          </form>
          <div className="mt-5 space-y-4" data-testid="trek-reviews-list">
            {reviews.length === 0 && <p className="text-sm text-[#7a8a80]">No reviews yet — be the first to share.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#e4ddd0] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="font-600">{r.user_name}</span>
                  <span className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-[#d8d2c4]"} />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#4a5a50]">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="mt-10 lg:mt-0">
          <form onSubmit={book} className="sticky top-24 rounded-3xl border border-[#e4ddd0] bg-white p-6 shadow-lg" data-testid="trek-booking-panel">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-700 text-[#2d5a3d]">${trek.price_usd.toLocaleString()}</span>
              <span className="text-sm text-[#7a8a80]">per person</span>
            </div>

            <label className="mt-6 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a8a80]">Departure date</label>
            <select value={date} onChange={(e) => setDate(e.target.value)} data-testid="trek-booking-date"
              className="mt-2 w-full rounded-xl border border-[#e4ddd0] bg-[#faf8f3] px-4 py-3 text-sm outline-none focus:border-[#2d5a3d]">
              {trek.departures.map((d) => (
                <option key={d} value={d}>
                  {new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                </option>
              ))}
            </select>

            <label className="mt-5 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a8a80]">Trekkers</label>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-[#e4ddd0] bg-[#faf8f3] px-4 py-2.5">
              <button type="button" onClick={() => setPax((p) => Math.max(1, p - 1))} aria-label="Fewer trekkers" data-testid="trek-booking-pax-minus"
                className="grid h-9 w-9 place-items-center rounded-full border border-[#e4ddd0] text-[#2d5a3d] hover:bg-[#2d5a3d]/10">
                <Minus size={15} />
              </button>
              <span className="font-display text-xl font-700" data-testid="trek-booking-pax-value">{pax}</span>
              <button type="button" onClick={() => setPax((p) => Math.min(16, p + 1))} aria-label="More trekkers" data-testid="trek-booking-pax-plus"
                className="grid h-9 w-9 place-items-center rounded-full border border-[#e4ddd0] text-[#2d5a3d] hover:bg-[#2d5a3d]/10">
                <Plus size={15} />
              </button>
            </div>

            <label className="mt-5 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a8a80]">Lead trekker name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" data-testid="trek-booking-name"
              className="mt-2 w-full rounded-xl border border-[#e4ddd0] bg-[#faf8f3] px-4 py-3 text-sm outline-none focus:border-[#2d5a3d]" />

            <label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a8a80]">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" data-testid="trek-booking-phone"
              className="mt-2 w-full rounded-xl border border-[#e4ddd0] bg-[#faf8f3] px-4 py-3 text-sm outline-none focus:border-[#2d5a3d]" />

            <div className="mt-6 flex items-center justify-between border-t border-[#efeadf] pt-4">
              <span className="text-sm text-[#4a5a50]">Total ({pax} {pax === 1 ? "trekker" : "trekkers"})</span>
              <span className="font-display text-2xl font-700" data-testid="trek-booking-total">${total.toLocaleString()}</span>
            </div>

            <button type="submit" disabled={booking} data-testid="trek-booking-submit"
              className="mt-5 w-full rounded-full bg-[#2d5a3d] py-3.5 font-600 text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50">
              {booking ? "Booking…" : user ? "Book this trek" : "Sign in to book"}
            </button>
            <p className="mt-3 text-center text-xs text-[#9aa8a0]">Free cancellation up to 30 days before departure.</p>
          </form>
        </aside>
      </section>

      <TrekFooter />
    </main>
  );
}
