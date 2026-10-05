export default function ShareProjectPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="text-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Share Project</h1>
        <a href={`/dashboard/projects/${params.id}`} className="px-3 py-1 bg-neutral-800 rounded text-white hover:bg-neutral-700 text-sm">Back to Project</a>
      </div>
      <p className="mt-4 text-neutral-400">
        Share settings for project <strong>{params.id}</strong> will appear here.
      </p>
    </div>
  );
}
