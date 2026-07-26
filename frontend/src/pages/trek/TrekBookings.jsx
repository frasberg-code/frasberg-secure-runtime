import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Users, Loader2, XCircle, Mountain } from "lucide-react";
import { toast } from "sonner";
import { TrekNav, TrekFooter } from "../../components/trek/TrekNav";
import { useAuth } from "../../context/AuthContext";
import Seo from "../../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/trek`;

export default function TrekBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${API}/bookings`, { credentials: "include" });
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch { setBookings([]); }
    })();
  }, [user]);

  async function cancel(id) {
    try {
      const res = await fetch(`${API}/bookings/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
      toast.success("Booking cancelled");
    } catch {
      toast.error("Could not cancel booking");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f3ec] text-[#1f2a24]" data-testid="trek-bookings-page">
      <Seo title="My Bookings — Frasberg Treks" description="Manage your trek bookings." />
      <TrekNav />

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
        <h1 className="font-display text-3xl font-700 tracking-tighter sm:text-4xl">My Bookings</h1>

        {!user && user !== undefined ? (
          <div className="mt-10 rounded-3xl border border-[#e4ddd0] bg-white p-12 text-center" data-testid="trek-bookings-signin">
            <p className="text-[#4a5a50]">Sign in to see your trek bookings.</p>
            <Link to="/auth" className="mt-5 inline-block rounded-full bg-[#2d5a3d] px-7 py-3 text-sm font-600 text-white">Sign in</Link>
          </div>
        ) : bookings === null ? (
          <div className="grid place-items-center py-24"><Loader2 size={26} className="animate-spin text-[#2d5a3d]" /></div>
        ) : bookings.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[#e4ddd0] bg-white p-12 text-center" data-testid="trek-bookings-empty">
            <Mountain size={28} className="mx-auto text-[#2d5a3d]" />
            <p className="mt-4 text-[#4a5a50]">No bookings yet — your next adventure awaits.</p>
            <Link to="/trek" className="mt-5 inline-block rounded-full bg-[#2d5a3d] px-7 py-3 text-sm font-600 text-white" data-testid="trek-bookings-browse">Browse treks</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5" data-testid="trek-bookings-list">
            {bookings.map((b) => (
              <div key={b.id} className={`overflow-hidden rounded-3xl border bg-white sm:flex ${b.status === "cancelled" ? "border-[#e4ddd0] opacity-60" : "border-[#e4ddd0]"}`} data-testid={`trek-booking-${b.reference}`}>
                <img src={b.trek_image} alt={b.trek_name} className="h-40 w-full object-cover sm:h-auto sm:w-52" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link to={`/trek/${b.trek_slug}`} className="font-display text-lg font-700 tracking-tight hover:text-[#2d5a3d]">{b.trek_name}</Link>
                      <p className="text-xs text-[#7a8a80]">{b.region} · Ref {b.reference}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-600 ${b.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`} data-testid={`trek-booking-status-${b.reference}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#4a5a50]">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {new Date(b.departure_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    <span className="inline-flex items-center gap-1.5"><Users size={14} /> {b.participants} {b.participants === 1 ? "trekker" : "trekkers"}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-display text-xl font-700 text-[#2d5a3d]">${b.total_usd.toLocaleString()}</span>
                    {b.status === "confirmed" && (
                      <button onClick={() => cancel(b.id)} data-testid={`trek-booking-cancel-${b.reference}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-600 text-red-600 transition-colors hover:bg-red-50">
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <TrekFooter />
    </main>
  );
}
