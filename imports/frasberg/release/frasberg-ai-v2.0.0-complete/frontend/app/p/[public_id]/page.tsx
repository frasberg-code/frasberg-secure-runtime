export default async function PublicProjectPage({
  params,
}: {
  params: { public_id: string };
}) {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-semibold">Public Project</h1>

      <p className="mt-4 text-neutral-400">
        This is the public view for project <strong>{params.public_id}</strong>.
      </p>

      <p className="mt-6 text-neutral-500">
        Public rendering, metadata, and shareable assets will appear here.
      </p>
    </div>
  );
}
