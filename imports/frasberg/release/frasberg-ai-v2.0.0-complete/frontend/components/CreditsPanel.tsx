export default function CreditsPanel({
  credits,
  used,
}: {
  credits: number;
  used: number;
}) {
  return (
    <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900">
      <h2 className="text-lg font-semibold mb-2">Usage</h2>

      <div className="text-neutral-400 text-sm space-y-1">
        <p>Total Credits: {credits}</p>
        <p>Used: {used}</p>
        <p>Remaining: {credits - used}</p>
      </div>
    </div>
  );
}
