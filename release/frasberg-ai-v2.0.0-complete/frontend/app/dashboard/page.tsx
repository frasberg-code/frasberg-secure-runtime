import { getUser } from "@/lib/user";
import { getUsage } from "@/lib/usage";
import CreditsPanel from "@/components/CreditsPanel";

export default async function DashboardHome() {
  const user = await getUser();

  let usage = { credits: 0, used: 0 };
  if (user) {
    usage = await getUsage(user.id);
  }

  return (
    <div className="text-white space-y-6">
      <h1 className="text-2xl font-semibold">
        Welcome{user ? `, ${user.email}` : ""}
      </h1>

      <CreditsPanel credits={usage.credits} used={usage.used} />

      <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
        <h2 className="text-lg font-semibold mb-2">Your Activity</h2>
        <p className="text-neutral-400 text-sm">
          Recent activity, projects, and analytics will appear here.
        </p>
      </div>
    </div>
  );
}
