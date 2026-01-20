'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Folder as FolderIcon, 
  Home, 
  Plus, 
  Trash2, 
  UploadCloud, 
  FileSpreadsheet, 
  Printer, 
  GripVertical, 
  Download, 
  Image as ImageIcon,
  CheckSquare,
  Square,
  ArrowLeft,
  Users,
  Book,
  Phone,
  Mail,
  User as UserIcon,
  Search,
  X,
  Pencil,
  ExternalLink
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Types ---
type Room = { id: number; name: string };
type Item = {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  room_id: number;
  image_url: string;
  material: string;
  dimensions: string;
  position: number;
  brand: string;
  link: string;
};
type Folder = { id: number; name: string };
type FileItem = { name: string; created_at: string; url: string };
type Contact = { id: number; name: string; role: string; phone: string; email: string };
type CatalogItem = { id: number; name: string; description: string; price: number; category: string; image_url: string; supplier: string };

// --- Helpers ---
const sanitizeFileName = (text: string): string => {
  // Remove special characters and spaces, keep only alphanumeric, dots, hyphens, and underscores
  return text.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');
};

const formatFileName = (name: string) => {
  if (name.includes('_')) return name.substring(name.indexOf('_') + 1);
  return name;
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // FIX: Direct initialization
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const projectId = params.id;

  // --- State ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Navigation State: 'overview', 'estimates', 'contacts', 'folder:ID', 'room:ID'
  const [selectedView, setSelectedView] = useState<string>(searchParams.get('view') || 'overview');
  
  // UI State
  const [isMounted, setIsMounted] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('Loading...');
  
  // Catalog Modal State
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeRoomIdForCatalog, setActiveRoomIdForCatalog] = useState<number | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  
  // Add Item Modal State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [activeRoomIdForAdd, setActiveRoomIdForAdd] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [newItemFormData, setNewItemFormData] = useState({
    name: '',
    description: '',
    price: 0,
    quantity: 1,
    image_url: '',
    brand: '',
    link: ''
  });

  // --- Init ---
  useEffect(() => {
    setIsMounted(true);
    fetchProjectDetails();
    fetchRooms();
    fetchFolders();
    fetchCatalogItems();
  }, []);

  useEffect(() => {
    if (selectedView.startsWith('room:') && rooms.length > 0) {
      fetchItems();
    }
    if (selectedView.startsWith('folder:')) {
      fetchFiles();
    }
    if (selectedView === 'estimates' && rooms.length > 0) {
      fetchItems();
    }
    if (selectedView === 'contacts') {
      fetchContacts();
    }
  }, [selectedView, rooms]);

  // URL Persistence: Update URL when selectedView changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('view', selectedView);
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [selectedView, pathname]);

  // --- Data Fetching ---
  const fetchProjectDetails = async () => {
    // Optional: Fetch actual project name if you have a projects table
    // const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    // if (data) setProjectName(data.name);
    setProjectName("Garden Quarters"); // Placeholder for now
  };

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').eq('project_id', projectId).order('id');
    if (data) setRooms(data);
  };

  const fetchFolders = async () => {
    const { data } = await supabase.from('folders').select('*').eq('project_id', projectId).order('id');
    if (data) setFolders(data);
  };

  const fetchItems = async () => {
    const { data } = await supabase.from('items').select('*').in('room_id', rooms.map(r => r.id)).order('position');
    if (data) setItems(data);
  };

  const fetchFiles = async () => {
    const folderId = selectedView.split(':')[1];
    if (!folderId) return;
    const { data } = await supabase.storage.from('project-files').list(`${projectId}/${folderId}`);
    if (data) {
        const fileList = data.map(f => ({
            name: f.name,
            created_at: f.created_at,
            url: supabase.storage.from('project-files').getPublicUrl(`${projectId}/${folderId}/${f.name}`).data.publicUrl
        }));
        setFiles(fileList);
    }
  };

  const fetchContacts = async () => {
    const { data } = await supabase.from('project_contacts').select('*').eq('project_id', projectId).order('id');
    if (data) setContacts(data);
  };

  const fetchCatalogItems = async () => {
    const { data } = await supabase.from('catalog_items').select('*').order('name');
    if (data) setCatalogItems(data);
  };

  // --- Handlers ---
  const handleCreateFolder = async () => {
    const name = prompt('Folder name:');
    if (!name) return;
    const { data } = await supabase.from('folders').insert({ name, project_id: projectId }).select().single();
    if (data) {
        setFolders([...folders, data]);
        setSelectedView(`folder:${data.id}`);
    }
  };

  const handleCreateRoom = async () => {
    const name = prompt('Room name:');
    if (!name) return;
    const { data } = await supabase.from('rooms').insert({ name, project_id: projectId }).select().single();
    if (data) {
        setRooms([...rooms, data]);
        setSelectedView(`room:${data.id}`);
    }
  };

  const handleAddContact = async () => {
    const name = prompt('Name:');
    if (!name) return;
    const role = prompt('Role (e.g., Tiler):') || '';
    const phone = prompt('Phone:') || '';
    const email = prompt('Email:') || '';
    
    const { data } = await supabase.from('project_contacts').insert({ name, role, phone, email, project_id: projectId }).select().single();
    if (data) setContacts([...contacts, data]);
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Delete contact?')) return;
    await supabase.from('project_contacts').delete().eq('id', id);
    setContacts(contacts.filter(c => c.id !== id));
  };

  // ... (Keep existing Items handlers: updateItem, handleDeleteItem, onDragEnd) ...
  
  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setActiveRoomIdForAdd(item.room_id);
    setSelectedFileName('');
    setNewItemFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
      image_url: item.image_url || '',
      brand: item.brand || '',
      link: item.link || ''
    });
    setIsAddItemModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setSelectedFileName(file.name);
    setIsUploadingImage(true);
    try {
      const safeName = sanitizeFileName(file.name);
      const path = `items/${Date.now()}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert('Error uploading image: ' + uploadError.message);
        setIsUploadingImage(false);
        setSelectedFileName('');
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(path);
      
      if (urlData?.publicUrl) {
        setNewItemFormData({ ...newItemFormData, image_url: urlData.publicUrl });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
      setSelectedFileName('');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveNewItem = async () => {
    if (!newItemFormData.name.trim()) {
      alert('Item name is required');
      return;
    }
    
    if (editingItem) {
      // Update existing item
      const { data, error } = await supabase
        .from('items')
        .update({
          name: newItemFormData.name,
          description: newItemFormData.description || '',
          price: newItemFormData.price || 0,
          quantity: newItemFormData.quantity || 1,
          image_url: newItemFormData.image_url || '',
          brand: newItemFormData.brand || '',
          link: newItemFormData.link || ''
        })
        .eq('id', editingItem.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating item:', error);
        alert('Error updating item: ' + error.message);
        return;
      }
      
      if (data) {
        setItems(items.map(i => i.id === editingItem.id ? data : i));
        setIsAddItemModalOpen(false);
        setEditingItem(null);
        setActiveRoomIdForAdd(null);
        setIsUploadingImage(false);
        setSelectedFileName('');
        setNewItemFormData({
          name: '',
          description: '',
          price: 0,
          quantity: 1,
          image_url: '',
          brand: '',
          link: ''
        });
      }
    } else {
      // Insert new item
      if (!activeRoomIdForAdd) return;
      
      const roomItems = items.filter(i => i.room_id === activeRoomIdForAdd);
      const { data, error } = await supabase
        .from('items')
        .insert({
          name: newItemFormData.name,
          description: newItemFormData.description || '',
          price: newItemFormData.price || 0,
          quantity: newItemFormData.quantity || 1,
          image_url: newItemFormData.image_url || '',
          brand: newItemFormData.brand || '',
          link: newItemFormData.link || '',
          room_id: activeRoomIdForAdd,
          project_id: projectId,
          position: roomItems.length,
          material: '',
          dimensions: ''
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding item:', error);
        alert('Error adding item: ' + error.message);
        return;
      }
      
      if (data) {
        setItems([...items, data]);
        setIsAddItemModalOpen(false);
        setActiveRoomIdForAdd(null);
        setIsUploadingImage(false);
        setSelectedFileName('');
        setNewItemFormData({
          name: '',
          description: '',
          price: 0,
          quantity: 1,
          image_url: '',
          brand: '',
          link: ''
        });
      }
    }
  };
  const updateItem = async (id: number, updates: any) => {
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
    await supabase.from('items').update(updates).eq('id', id);
  };
  const handleDeleteItem = async (id: number) => {
    if (!confirm('Delete item?')) return;
    setItems(items.filter(i => i.id !== id));
    await supabase.from('items').delete().eq('id', id);
  };

  const handleAddItemFromCatalog = async (catalogItem: CatalogItem) => {
    if (!activeRoomIdForCatalog) return;
    
    const roomItems = items.filter(i => i.room_id === activeRoomIdForCatalog);
    const { data, error } = await supabase
      .from('items')
      .insert({
        name: catalogItem.name,
        price: catalogItem.price,
        image_url: catalogItem.image_url || '',
        brand: catalogItem.supplier || '',
        link: '',
        room_id: activeRoomIdForCatalog,
        project_id: projectId,
        quantity: 1,
        position: roomItems.length,
        description: catalogItem.description || '',
        material: '',
        dimensions: ''
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding item from catalog:', error);
      alert('Error adding item: ' + error.message);
      return;
    }
    
    if (data) {
      setItems([...items, data]);
      setIsCatalogOpen(false);
      setActiveRoomIdForCatalog(null);
      setCatalogSearchQuery('');
    }
  };
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const roomId = parseInt(selectedView.split(':')[1]);
    const roomItems = items.filter(i => i.room_id === roomId).sort((a, b) => a.position - b.position);
    const reordered = Array.from(roomItems);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    
    // Optimistic update
    const otherItems = items.filter(i => i.room_id !== roomId);
    setItems([...otherItems, ...reordered]);
    
    // Update all positions in database
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('items').update({ position: i }).eq('id', reordered[i].id);
    }
  };

  // ... (Keep existing Files handlers) ...
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const folderId = selectedView.split(':')[1];
    if (!e.target.files || !folderId) return;
    setLoadingFiles(true);
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const safeName = sanitizeFileName(file.name);
        const path = `${projectId}/${folderId}/${Date.now()}_${safeName}`;
        await supabase.storage.from('project-files').upload(path, file);
    }
    setLoadingFiles(false);
    fetchFiles();
  };
  const handleBulkDeleteFiles = async () => {
    if (!confirm(`Delete ${selectedFileNames.length} file(s)?`)) return;
    const folderId = selectedView.split(':')[1];
    const paths = selectedFileNames.map(name => `${projectId}/${folderId}/${name}`);
    await supabase.storage.from('project-files').remove(paths);
    setSelectedFileNames([]);
    fetchFiles();
  };

  // ... (Keep Export handlers) ...
  const getGrandTotal = () => items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: any[] = [];
    rooms.forEach(room => {
        const roomItems = items.filter(i => i.room_id === room.id);
        if (roomItems.length === 0) return;
        data.push({ Item: `ROOM: ${room.name}`, Price: '', Qty: '', Total: '' });
        roomItems.forEach(item => data.push({ Item: item.name, Price: item.price, Qty: item.quantity, Total: item.price * item.quantity }));
        data.push({});
    });
    data.push({ Item: 'PROJECT TOTAL', Total: getGrandTotal() });
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Estimate');
    XLSX.writeFile(wb, 'Estimate.xlsx');
  };
  const handleExportPDF = async () => { /* reuse existing logic */
    const doc = new jsPDF();
    let y = 20;
    doc.text(`Project Estimate`, 14, y);
    y += 10;
    rooms.forEach(room => {
        const roomItems = items.filter(i => i.room_id === room.id);
        if (roomItems.length === 0) return;
        doc.text(room.name, 14, y);
        autoTable(doc, { startY: y + 5, head: [['Item', 'Price', 'Qty', 'Total']], body: roomItems.map(i => [i.name, i.price, i.quantity, i.price * i.quantity]) });
        // @ts-ignore
        y = doc.lastAutoTable.finalY + 10;
    });
    doc.text(`Grand Total: $${getGrandTotal().toLocaleString()}`, 14, y + 10);
    doc.save('Estimate.pdf');
  };

  // --- Render Components ---

  const renderCatalogModal = () => {
    if (!isCatalogOpen) return null;
    
    const filteredItems = catalogItems.filter(item => {
      const query = catalogSearchQuery.toLowerCase();
      return item.name.toLowerCase().includes(query) ||
             item.description?.toLowerCase().includes(query) ||
             item.category?.toLowerCase().includes(query);
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">Select Item from Catalog</h2>
            <button
              onClick={() => {
                setIsCatalogOpen(false);
                setActiveRoomIdForCatalog(null);
                setCatalogSearchQuery('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search items..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-300" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</h3>
                  <div className="text-lg font-bold text-green-600 mb-3">${item.price.toLocaleString()}</div>
                  <button
                    onClick={() => handleAddItemFromCatalog(item)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Add to Room
                  </button>
                </div>
              ))}
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                {catalogSearchQuery ? 'No items found matching your search' : 'No items in catalog'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAddItemModal = () => {
    if (!isAddItemModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <button
              onClick={() => {
                setIsAddItemModalOpen(false);
                setActiveRoomIdForAdd(null);
                setEditingItem(null);
                setIsUploadingImage(false);
                setSelectedFileName('');
                setNewItemFormData({
                  name: '',
                  description: '',
                  price: 0,
                  quantity: 1,
                  image_url: '',
                  brand: '',
                  link: ''
                });
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newItemFormData.name}
                onChange={(e) => setNewItemFormData({ ...newItemFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Item name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={newItemFormData.brand}
                onChange={(e) => setNewItemFormData({ ...newItemFormData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brand or manufacturer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description / Material
              </label>
              <input
                type="text"
                value={newItemFormData.description}
                onChange={(e) => setNewItemFormData({ ...newItemFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description or material"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                value={newItemFormData.price}
                onChange={(e) => setNewItemFormData({ ...newItemFormData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={newItemFormData.quantity}
                onChange={(e) => setNewItemFormData({ ...newItemFormData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website Link
              </label>
              <input
                type="url"
                value={newItemFormData.link}
                onChange={(e) => setNewItemFormData({ ...newItemFormData, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              
              {/* Image Preview */}
              <div className="relative w-full h-64 bg-white rounded-xl border border-gray-200 mb-4 flex items-center justify-center overflow-hidden">
                {newItemFormData.image_url || editingItem?.image_url ? (
                  <img 
                    src={newItemFormData.image_url || editingItem?.image_url} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ImageIcon size={48} />
                    <span className="text-sm">No image selected</span>
                  </div>
                )}
              </div>
              
              {/* Custom File Upload Button */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="item-image-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  <label
                    htmlFor="item-image-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors ${
                      isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <UploadCloud size={18} />
                    <span className="font-medium">
                      {isUploadingImage 
                        ? 'Uploading...' 
                        : (editingItem && (newItemFormData.image_url || editingItem.image_url))
                          ? 'Change Image'
                          : 'Choose Image'}
                    </span>
                  </label>
                </div>
                
                {/* Selected File Name */}
                <div className="text-sm text-gray-500">
                  {selectedFileName || (editingItem?.image_url && !newItemFormData.image_url ? 'Current image' : 'No file selected')}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              onClick={() => {
                setIsAddItemModalOpen(false);
                setActiveRoomIdForAdd(null);
                setEditingItem(null);
                setIsUploadingImage(false);
                setSelectedFileName('');
                setNewItemFormData({
                  name: '',
                  description: '',
                  price: 0,
                  quantity: 1,
                  image_url: '',
                  brand: '',
                  link: ''
                });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNewItem}
              disabled={isUploadingImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? 'Uploading...' : 'Save Item'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderItemDetailsModal = () => {
    if (!viewingItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">Product Details</h2>
            <button
              onClick={() => setViewingItem(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Image */}
              <div className="relative w-full h-96 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                {viewingItem.image_url ? (
                  <img 
                    src={viewingItem.image_url} 
                    alt={viewingItem.name} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ImageIcon size={64} />
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{viewingItem.name}</h3>
                  {viewingItem.brand && (
                    <p className="text-lg text-gray-500">{viewingItem.brand}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {viewingItem.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700">{viewingItem.description}</p>
                    </div>
                  )}
                  
                  {(viewingItem.material || viewingItem.dimensions) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Specifications</p>
                      <div className="text-gray-700 space-y-1">
                        {viewingItem.material && <p>Material: {viewingItem.material}</p>}
                        {viewingItem.dimensions && <p>Dimensions: {viewingItem.dimensions}</p>}
                      </div>
                    </div>
                  )}

                  {viewingItem.link && (
                    <div>
                      <a
                        href={viewingItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink size={18} />
                        <span>Visit Website</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-1">Price</p>
                    <p className="text-3xl font-bold text-green-600">${viewingItem.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Quantity: {viewingItem.quantity}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              onClick={() => setViewingItem(null)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                handleEditClick(viewingItem);
                setViewingItem(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContactsContent = () => (
    <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Project Team</h2>
            <button onClick={handleAddContact} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={18} /> Add
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map(contact => (
                <div key={contact.id} className="bg-white border rounded-xl p-4 shadow-sm flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                            <UserIcon size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-lg">{contact.name}</div>
                            <div className="text-blue-600 font-medium text-sm mb-2">{contact.role}</div>
                            <div className="text-gray-500 text-sm space-y-1">
                                <div className="flex items-center gap-2"><Phone size={14} /> {contact.phone || '-'}</div>
                                <div className="flex items-center gap-2"><Mail size={14} /> {contact.email || '-'}</div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleDeleteContact(contact.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            {contacts.length === 0 && (
                <div className="col-span-2 text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                    No contacts in this project yet
                </div>
            )}
        </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0">
        <div className="p-4 border-b">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors">
                <ArrowLeft size={16} /> Back to Projects
            </button>
            <h1 className="font-bold text-xl text-gray-900 leading-tight">{projectName}</h1>
        </div>

        <div className="flex-1 py-4 flex flex-col">
            {/* Main Links */}
            <div className="px-3 mb-6 space-y-1">
                <button onClick={() => setSelectedView('overview')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${selectedView === 'overview' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <LayoutDashboard size={18} /> Overview
                </button>
                <button onClick={() => setSelectedView('estimates')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${selectedView === 'estimates' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <FileText size={18} /> Estimates
                </button>
                <button onClick={() => setSelectedView('contacts')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${selectedView === 'contacts' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Users size={18} /> Team
                </button>
            </div>

            {/* Folders */}
            <div className="mb-6">
                <div className="px-6 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    <span>Files</span>
                    <button onClick={handleCreateFolder} className="hover:text-blue-600"><Plus size={14} /></button>
                </div>
                <div className="px-3 space-y-1">
                    {folders.map(folder => (
                        <button key={folder.id} onClick={() => setSelectedView(`folder:${folder.id}`)} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md ${selectedView === `folder:${folder.id}` ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <FolderIcon size={16} /> {folder.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rooms */}
            <div className="mb-6">
                <div className="px-6 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    <span>Rooms</span>
                    <button onClick={handleCreateRoom} className="hover:text-blue-600"><Plus size={14} /></button>
                </div>
                <div className="px-3 space-y-1">
                    {rooms.map(room => (
                        <button key={room.id} onClick={() => setSelectedView(`room:${room.id}`)} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md ${selectedView === `room:${room.id}` ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <Home size={16} /> {room.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Catalog Link (Bottom) */}
            <div className="mt-auto px-3 pb-4 pt-4 border-t">
                <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">Resources</div>
                <button onClick={() => router.push('/dashboard/catalog')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                    <Book size={18} /> Catalog
                </button>
            </div>
        </div>
    </div>
  );

  // Reusing existing render functions for brevity in prompt, but in code strict rendering:
  const renderFilesContent = (folderId: string) => {
    // ... Copy paste your existing Files Render Logic here or use the one from previous step ... 
    // For safety, I included the full code block above, but simplifying the prompt text.
    // Let's assume the render functions are identical to previous step + the new renderContactsContent
    
    // (Simulating reusing the code from previous step for Room/Overview/Estimates/Files)
    // To ensure it works, the code block above contains EVERYTHING needed.
    
    // Simplified logic for this specific block in the response:
    const folder = folders.find(f => f.id.toString() === folderId);
    if (!folder) return <div>Folder not found</div>;
    const toggleSelection = (name: string) => selectedFileNames.includes(name) ? setSelectedFileNames(selectedFileNames.filter(n => n !== name)) : setSelectedFileNames([...selectedFileNames, name]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><FolderIcon className="text-blue-500" /> {folder.name}</h2>
                <div className="flex gap-2">
                    {selectedFileNames.length > 0 && <button onClick={handleBulkDeleteFiles} className="px-4 py-2 bg-red-50 text-red-600 rounded">Delete ({selectedFileNames.length})</button>}
                    <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">Upload <UploadCloud size={16} /><input type="file" multiple className="hidden" onChange={handleFileUpload} /></label>
                </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden flex-1">
                 <div className="grid grid-cols-[40px_40px_1fr_150px_100px] gap-4 p-3 bg-gray-50 border-b text-xs font-semibold text-gray-500"><div></div><div>TYPE</div><div>NAME</div><div>DATE</div><div></div></div>
                 <div className="divide-y overflow-y-auto">
                    {files.map(file => (
                        <div key={file.name} className="grid grid-cols-[40px_40px_1fr_150px_100px] gap-4 p-3 items-center hover:bg-gray-50">
                            <button onClick={() => toggleSelection(file.name)} className="pl-2 text-gray-400">{selectedFileNames.includes(file.name) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}</button>
                            <div className="text-gray-400">{file.name.endsWith('.pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}</div>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-700 hover:text-blue-600 truncate">{formatFileName(decodeURIComponent(file.name))}</a>
                            <div className="text-xs text-gray-400">{new Date(file.created_at).toLocaleDateString()}</div>
                            <a href={file.url} download target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 justify-self-end"><Download size={18} /></a>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
  };
  
  const renderRoomContent = (roomId: number) => {
     // ... Standard Room Render ...
     const room = rooms.find(r => r.id === roomId);
     if (!room) return <div>Room not found</div>;
     const roomItems = items.filter(i => i.room_id === roomId);
     return (
        <div className="p-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{room.name}</h2>
            <div className="grid grid-cols-[30px_64px_3fr_1fr_1fr_1fr_100px] gap-4 text-xs font-medium text-gray-400 mb-2 px-2"><div></div><div>PHOTO</div><div>ITEM</div><div>PRICE</div><div>QTY</div><div>TOTAL</div><div></div></div>
            {isMounted && <DragDropContext onDragEnd={onDragEnd}><Droppable droppableId={roomId.toString()}>{(provided) => (<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">{roomItems.map((item, index) => (<Draggable key={item.id} draggableId={item.id.toString()} index={index}>{(provided) => (<div ref={provided.innerRef} {...provided.draggableProps} className="grid grid-cols-[30px_64px_3fr_1fr_1fr_1fr_100px] gap-4 items-center bg-white p-3 rounded-lg border shadow-sm"><div {...provided.dragHandleProps} className="cursor-grab text-gray-300"><GripVertical size={16} /></div><div onClick={() => setViewingItem(item)} className="w-16 h-16 bg-white rounded border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors">{item.image_url ? <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain" /> : <ImageIcon size={20} className="text-gray-400" />}</div><div onClick={() => setViewingItem(item)} className="cursor-pointer"><input value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} onClick={(e) => e.stopPropagation()} className="font-medium w-full bg-transparent focus:outline-none" /><div className="text-xs text-gray-400 mt-1">{item.material} {item.dimensions}</div></div><input type="number" value={item.price} onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })} className="w-full bg-transparent text-sm" /><input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="w-full bg-transparent text-sm" /><div className="text-sm font-medium">${(item.price * item.quantity).toLocaleString()}</div><div className="flex items-center gap-2 justify-end"><button onClick={() => handleEditClick(item)} className="text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={16} /></button><button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div></div>)}</Draggable>))}{provided.placeholder}</div>)}</Droppable></DragDropContext>}
            <div className="mt-4 flex items-center gap-3">
                <button 
                    onClick={() => {
                        setEditingItem(null);
                        setActiveRoomIdForAdd(roomId);
                        setSelectedFileName('');
                        setNewItemFormData({
                            name: '',
                            description: '',
                            price: 0,
                            quantity: 1,
                            image_url: '',
                            brand: '',
                            link: ''
                        });
                        setIsAddItemModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                    <Plus size={16} /> Add Item
                </button>
                <button 
                    onClick={() => {
                        setIsCatalogOpen(true);
                        setActiveRoomIdForCatalog(roomId);
                    }}
                    className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                    <Book size={16} /> Import from Catalog
                </button>
            </div>
        </div>
     );
  };

  const renderEstimatesContent = () => (
     // ... Standard Estimates Render ...
     <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8"><div><h2 className="text-2xl font-bold mb-1">Estimates</h2></div><div className="text-right"><div className="text-3xl font-bold text-green-600 mb-2">${getGrandTotal().toLocaleString()}</div><div className="flex gap-2"><button onClick={handleExportExcel} className="p-2 text-green-600 bg-green-50 rounded"><FileSpreadsheet size={20} /></button><button onClick={handleExportPDF} className="p-2 text-red-600 bg-red-50 rounded"><FileText size={20} /></button><button onClick={() => window.print()} className="p-2 text-gray-600 bg-gray-100 rounded"><Printer size={20} /></button></div></div></div>
        <div className="space-y-8">{rooms.map(room => { const roomItems = items.filter(i => i.room_id === room.id); if (!roomItems.length) return null; return (<div key={room.id} className="border rounded-lg overflow-hidden"><div className="bg-gray-50 p-3 border-b flex justify-between font-bold"><span>{room.name}</span><span>${roomItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()}</span></div><table className="w-full text-sm"><tbody className="divide-y">{roomItems.map(item => (<tr key={item.id}><td className="p-3 font-medium">{item.name}</td><td className="p-3 text-right">{item.price}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">{item.price * item.quantity}</td></tr>))}</tbody></table></div>)})}</div>
     </div>
  );
  
  const renderOverviewContent = () => (
     <div className="p-8"><h2 className="text-2xl font-bold mb-6">Overview</h2><div className="grid grid-cols-3 gap-6"><div className="bg-blue-50 p-6 rounded-xl border border-blue-100"><div className="text-blue-500 font-medium mb-2">Rooms</div><div className="text-3xl font-bold text-blue-700">{rooms.length}</div></div><div className="bg-green-50 p-6 rounded-xl border border-green-100"><div className="text-green-500 font-medium mb-2">Budget</div><div className="text-3xl font-bold text-green-700">${getGrandTotal().toLocaleString()}</div></div></div></div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-gray-900">
        {renderSidebar()}
        <div className="flex-1 overflow-auto bg-white relative">
            {selectedView === 'overview' && renderOverviewContent()}
            {selectedView === 'estimates' && renderEstimatesContent()}
            {selectedView === 'contacts' && renderContactsContent()}
            {selectedView.startsWith('folder:') && renderFilesContent(selectedView.split(':')[1])}
            {selectedView.startsWith('room:') && renderRoomContent(parseInt(selectedView.split(':')[1]))}
        </div>
        {renderCatalogModal()}
        {renderAddItemModal()}
        {renderItemDetailsModal()}
    </div>
  );
}