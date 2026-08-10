export default function RemixPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Remix Project</h1>
        <a href="/dashboard/projects" className="px-3 py-1 bg-neutral-800 rounded text-white hover:bg-neutral-700 text-sm">Back to Projects</a>
      </div>
      <p className="mt-4 text-neutral-400">
        Remixing project <strong>{params.id}</strong>.
      </p>
      <p className="mt-6 text-neutral-500">
        The remix editor UI will be implemented here.
      </p>
    </div>
  );
}
