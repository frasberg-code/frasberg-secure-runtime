import { redirect } from "next/navigation";

export default function NewProjectPage() {
  // Placeholder for project creation logic
  // In a real app, this would be a form to create a new project
  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-semibold mb-4">Create New Project</h1>
      <p className="text-neutral-400 mb-4">Project creation form will go here.</p>
      <form className="space-y-4">
        <input
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 text-white"
          placeholder="Project Name"
        />
        <textarea
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 text-white"
          placeholder="Project Description"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 rounded-md text-white"
        >
          Create
        </button>
      </form>
    </div>
  );
}
