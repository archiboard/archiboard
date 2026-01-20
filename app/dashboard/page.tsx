"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editClientName, setEditClientName] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase.from('projects').select('*');
        if (error) {
          console.error('Error fetching projects:', error);
        } else {
          setProjects(data || []);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*');
    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
  };

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      try {
        const { error } = await supabase.from('projects').insert({
          title: newProjectName.trim(),
        status: "Draft",
        client_name: "New Client",
          budget: 0,
        });

        if (error) {
          console.log("Supabase error:", error);
          alert("Error saving: " + error.message);
        } else {
          await fetchProjects();
          setNewProjectName("");
          setIsDialogOpen(false);
        }
      } catch (error) {
        console.error('Error adding project:', error);
        alert("Error saving project");
      }
    }
  };

  const handleDeleteProject = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) {
        console.log("Supabase error:", error);
        alert("Error deleting: " + error.message);
      } else {
        setProjects(projects.filter((project) => project.id !== id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert("Error deleting project");
    }
  };

  const handleStartEdit = (project: any) => {
    setEditingProjectId(project.id);
    setEditTitle(project.title);
    setEditClientName(project.client_name || project.client || "");
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditTitle("");
    setEditClientName("");
  };

  const handleUpdateProject = async (id: number) => {
    if (!editTitle.trim()) {
      alert("Project name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editTitle.trim(),
          client_name: editClientName.trim(),
        })
        .eq('id', id);

      if (error) {
        console.log("Supabase error:", error);
        alert("Error updating: " + error.message);
      } else {
        setProjects(
          projects.map((project) =>
            project.id === id
              ? { ...project, title: editTitle.trim(), client_name: editClientName.trim() }
              : project
          )
        );
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert("Error updating project");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const getStatusBadgeClass = (status: string) => {
    if (status === "Construction") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (status === "Procurement") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">My Projects</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              + New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Garden Quarters Apartment"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                className="bg-black text-white hover:bg-gray-800"
                onClick={handleAddProject}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Content */}
      <div className="flex-1 p-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stat Card 1 */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-sm text-gray-600 mb-2">Active Projects</div>
              <div className="text-3xl font-semibold text-black">4</div>
            </div>

            {/* Stat Card 2 */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-sm text-gray-600 mb-2">In Review</div>
              <div className="text-3xl font-semibold text-black">2</div>
            </div>

            {/* Stat Card 3 */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-sm text-gray-600 mb-2">Total Budget</div>
              <div className="text-3xl font-semibold text-black">$125,000</div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-lg hover:border-gray-300 transition-all relative"
              >
                {editingProjectId === project.id ? (
                  <>
                    <div className="mb-3">
                      <Label htmlFor={`edit-title-${project.id}`} className="text-xs text-gray-600">
                        Project Name
                      </Label>
                      <Input
                        id={`edit-title-${project.id}`}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="mb-3">
                      <Label htmlFor={`edit-client-${project.id}`} className="text-xs text-gray-600">
                        Client
                      </Label>
                      <Input
                        id={`edit-client-${project.id}`}
                        value={editClientName}
                        onChange={(e) => setEditClientName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeClass(
                          project.status
                        )}`}
                      >
                        {project.status === "Эскиз" ? "Draft" : project.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUpdateProject(project.id);
                          }}
                          className="text-green-600 text-xs hover:text-green-800 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="text-gray-600 text-xs hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href={`/dashboard/projects/${project.id}`} className="block cursor-pointer">
                      <h3 className="text-lg font-semibold text-black mb-3">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Client: <span className="text-gray-900 font-medium">{project.client_name || project.client}</span>
                      </p>
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeClass(
                          project.status
                        )}`}
                      >
                        {project.status === "Эскиз" ? "Draft" : project.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartEdit(project);
                          }}
                          className="text-blue-600 text-xs hover:text-blue-800 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="text-red-600 text-xs hover:text-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
      </div>
    </>
  );
}

