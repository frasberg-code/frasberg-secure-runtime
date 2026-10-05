import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#05070B] px-6 text-white" data-testid="payment-cancel-page">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <XCircle size={40} className="mx-auto text-white/40" />
        <h1 className="mt-5 text-xl font-700">Checkout cancelled</h1>
        <p className="mt-2 text-sm text-white/60">No charge was made. You can restart checkout any time.</p>
        <Link to="/dashboard" data-testid="payment-cancel-back"
          className="mt-6 inline-block rounded-full bg-[#00F0FF] px-6 py-2.5 text-sm font-700 text-black">
          Back to Console
        </Link>
      </div>
    </main>
  );
}
