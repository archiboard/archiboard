"use client";

import { useState } from "react";
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

export default function Dashboard() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: "Квартира ЖК Садовые Кварталы",
      client: "Анна В.",
      status: "Стройка",
    },
    {
      id: 2,
      title: "Дом в Барвихе",
      client: "Сергей П.",
      status: "Комплектация",
    },
    {
      id: 3,
      title: "Офис City Tower",
      client: "TechCorp",
      status: "Эскиз",
    },
  ]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now(),
        title: newProjectName.trim(),
        status: "Эскиз",
        client: "Новый клиент",
      };
      setProjects([...projects, newProject]);
      setNewProjectName("");
      setIsDialogOpen(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "Стройка") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (status === "Комплектация") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Мои проекты</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              + Новый проект
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Создать проект</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Название проекта</Label>
                <Input
                  id="project-name"
                  placeholder="Например: Квартира ЖК Садовые Кварталы"
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
                Создать
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
              <div className="text-sm text-gray-600 mb-2">Активные проекты</div>
              <div className="text-3xl font-semibold text-black">4</div>
            </div>

            {/* Stat Card 2 */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-sm text-gray-600 mb-2">На согласовании</div>
              <div className="text-3xl font-semibold text-black">2</div>
            </div>

            {/* Stat Card 3 */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-sm text-gray-600 mb-2">Бюджет в работе</div>
              <div className="text-3xl font-semibold text-black">12.5 млн ₽</div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href="/dashboard/projects/1">
                <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer">
                  <h3 className="text-lg font-semibold text-black mb-3">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Клиент: <span className="text-gray-900 font-medium">{project.client}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeClass(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
      </div>
    </>
  );
}

