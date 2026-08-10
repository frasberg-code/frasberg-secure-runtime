import Link from "next/link";

export default async function ProjectsPage() {
  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-semibold mb-4">Projects</h1>

      <div className="mt-6 border border-neutral-800 rounded-lg p-6">
        <p className="text-neutral-400">Your projects will appear here.</p>
        <div className="flex gap-4 mt-4">
          <Link
            href="/dashboard/projects/new"
            className="px-4 py-2 bg-emerald-600 rounded-md text-white hover:bg-emerald-700"
          >
            Create Project
          </Link>
        </div>
      </div>
    </div>
  );
}
