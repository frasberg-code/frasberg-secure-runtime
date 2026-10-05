import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("checking");
  const [credits, setCredits] = useState(0);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) { setState("error"); return; }
    let cancelled = false;
    const poll = async () => {
      if (cancelled || attempts.current >= 10) { if (!cancelled) setState("timeout"); return; }
      attempts.current += 1;
      try {
        const res = await fetch(`${API}/payments/status/${sessionId}`, { credentials: "include" });
        const d = await res.json();
        if (d.payment_status === "paid") { setCredits(d.credits || 0); setState("paid"); return; }
        if (d.payment_status === "expired") { setState("error"); return; }
      } catch {}
      setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#05070B] px-6 text-white" data-testid="payment-success-page">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
        {state === "checking" && (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-[#00F0FF]" />
            <h1 className="mt-5 text-xl font-700">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-white/60">Hold tight — we're verifying with Stripe.</p>
          </>
        )}
        {state === "paid" && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
            <h1 className="mt-5 text-xl font-700" data-testid="payment-paid-heading">Payment complete</h1>
            <p className="mt-2 text-sm text-white/60">
              {credits ? `${credits.toLocaleString()} credits have been added.` : "Your purchase has been applied."}
            </p>
            <Link to="/dashboard" data-testid="payment-back-dashboard"
              className="mt-6 inline-block rounded-full bg-[#00F0FF] px-6 py-2.5 text-sm font-700 text-black">
              Back to Console
            </Link>
          </>
        )}
        {(state === "error" || state === "timeout") && (
          <>
            <XCircle size={40} className="mx-auto text-red-400" />
            <h1 className="mt-5 text-xl font-700">{state === "timeout" ? "Still processing" : "Payment not confirmed"}</h1>
            <p className="mt-2 text-sm text-white/60">
              {state === "timeout"
                ? "Your payment may still complete — check your dashboard in a minute or contact support."
                : "This checkout session was not completed. No charge was applied."}
            </p>
            <Link to="/dashboard" className="mt-6 inline-block rounded-full border border-white/20 px-6 py-2.5 text-sm font-600 text-white">
              Back to Console
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
