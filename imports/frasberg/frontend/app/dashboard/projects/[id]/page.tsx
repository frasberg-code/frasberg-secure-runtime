export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="text-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Project {params.id}</h1>
        <a href={`/dashboard/projects/${params.id}/share`} className="px-3 py-1 bg-emerald-700 rounded text-white hover:bg-emerald-800 text-sm">Share</a>
      </div>
      <p className="mt-4 text-neutral-400">
        This is where project details, assets, and metadata will appear.
      </p>
    </div>
  );
}
