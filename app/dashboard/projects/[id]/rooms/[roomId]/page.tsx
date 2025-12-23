"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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

export default function RoomDetail({
  params,
}: {
  params: Promise<{ id: string; roomId: string }>;
}) {
  const { id, roomId } = use(params);
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Диван угловой",
      supplier: "Мебель Плюс",
      price: 85000,
      status: "Заказано",
    },
    {
      id: 2,
      name: "Люстра лофт",
      supplier: "Студия Света",
      price: 15000,
      status: "В ожидании",
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
  });

  const handleAddProduct = () => {
    if (newProduct.name.trim() && newProduct.price.trim()) {
      const product = {
        id: products.length + 1,
        name: newProduct.name.trim(),
        supplier: "Поставщик",
        price: Number(newProduct.price),
        status: "Выбрано",
      };
      setProducts([...products, product]);
      setNewProduct({ name: "", price: "" });
      setIsDialogOpen(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "Заказано") {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (status === "В ожидании") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/projects/${id}`}>
            <Button variant="outline" className="border-gray-300">
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-black">
            Комплектация: Гостиная
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">Товары</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800">
                + Добавить товар
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Добавить товар</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="product-name">Наименование</Label>
                  <Input
                    id="product-name"
                    placeholder="Например: Диван угловой"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-price">Цена</Label>
                  <Input
                    id="product-price"
                    type="number"
                    placeholder="Например: 85000"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={handleAddProduct}
                >
                  Сохранить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Фото</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Поставщик</TableHead>
                <TableHead>Кол-во</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.supplier}</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeClass(
                        product.status
                      )}`}
                    >
                      {product.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

