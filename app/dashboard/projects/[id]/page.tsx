"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export default function ProjectDetail() {
  const params = useParams();
  const [rooms, setRooms] = useState([
    { id: 1, name: "Гостиная" },
    { id: 2, name: "Кухня" },
  ]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      const newRoom = {
        id: rooms.length + 1,
        name: newRoomName.trim(),
      };
      setRooms([...rooms, newRoom]);
      setNewRoomName("");
      setIsDialogOpen(false);
    }
  };
  return (
    <>
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">
          Проект: ЖК Садовые Кварталы
        </h1>
        <Button variant="outline" className="border-gray-300">
          Settings
        </Button>
      </header>

      {/* Tabs */}
      <div className="px-8 border-b border-gray-200">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="bg-transparent border-b-0 p-0 h-auto">
            <TabsTrigger value="summary" className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent">
              Сводка
            </TabsTrigger>
            <TabsTrigger value="rooms" className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent">
              Комнаты
            </TabsTrigger>
            <TabsTrigger value="budget" className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent">
              Смета
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="summary" className="mt-0">
              <div className="flex-1 p-8">
                <p className="text-gray-600">Здесь будет информация о проекте.</p>
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="mt-0">
              <div className="flex-1 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-black">Комнаты</h2>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-black text-white hover:bg-gray-800">
                        + Добавить комнату
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Создать комнату</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Название</Label>
                          <Input
                            id="name"
                            placeholder="Например: Гостиная"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          className="bg-black text-white hover:bg-gray-800"
                          onClick={handleAddRoom}
                        >
                          Сохранить
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rooms.map((room) => (
                    <Link
                      key={room.id}
                      href={`/dashboard/projects/${params.id}/rooms/${room.id}`}
                    >
                      <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow cursor-pointer">
                        <h3 className="text-lg font-semibold text-black">{room.name}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="mt-0">
              <div className="flex-1 p-8">
                <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Наименование
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Кол-во
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Цена
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Сумма
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600" colSpan={4}>
                          Данные сметы появятся здесь
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}

