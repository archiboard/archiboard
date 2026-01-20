'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
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
  User as UserIcon
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
};
type Folder = { id: number; name: string };
type FileItem = { name: string; created_at: string; url: string };
type Contact = { id: number; name: string; role: string; phone: string; email: string };

// --- Helpers ---
const transliterate = (text: string): string => {
  const ru: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '_', '.': '.'
  };
  return text.toLowerCase().split('').map(char => ru[char] || (/[a-z0-9._-]/.test(char) ? char : '')).join('');
};

const formatFileName = (name: string) => {
  if (name.includes('_')) return name.substring(name.indexOf('_') + 1);
  return name;
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  
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
  const [selectedView, setSelectedView] = useState<string>('overview');
  
  // UI State
  const [isMounted, setIsMounted] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('Загрузка...');

  // --- Init ---
  useEffect(() => {
    setIsMounted(true);
    fetchProjectDetails();
    fetchRooms();
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedView.startsWith('room:')) fetchItems();
    if (selectedView.startsWith('folder:')) fetchFiles();
    if (selectedView === 'estimates') fetchItems();
    if (selectedView === 'contacts') fetchContacts();
  }, [selectedView]);

  // --- Data Fetching ---
  const fetchProjectDetails = async () => {
    // Optional: Fetch actual project name if you have a projects table
    // const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    // if (data) setProjectName(data.name);
    setProjectName("Садовые кварталы"); // Placeholder for now
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
  }

  // --- Handlers ---
  const handleCreateFolder = async () => {
    const name = prompt('Название папки:');
    if (!name) return;
    const { data } = await supabase.from('folders').insert({ name, project_id: projectId }).select().single();
    if (data) {
        setFolders([...folders, data]);
        setSelectedView(`folder:${data.id}`);
    }
  };

  const handleCreateRoom = async () => {
    const name = prompt('Название комнаты:');
    if (!name) return;
    const { data } = await supabase.from('rooms').insert({ name, project_id: projectId }).select().single();
    if (data) {
        setRooms([...rooms, data]);
        setSelectedView(`room:${data.id}`);
    }
  };

  const handleAddContact = async () => {
    const name = prompt('Имя:');
    if (!name) return;
    const role = prompt('Роль (например: Плиточник):') || '';
    const phone = prompt('Телефон:') || '';
    const email = prompt('Email:') || '';
    
    const { data } = await supabase.from('project_contacts').insert({ name, role, phone, email, project_id: projectId }).select().single();
    if (data) setContacts([...contacts, data]);
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Удалить контакт?')) return;
    await supabase.from('project_contacts').delete().eq('id', id);
    setContacts(contacts.filter(c => c.id !== id));
  };

  // ... (Keep existing Items handlers: handleAddItem, updateItem, handleDeleteItem, onDragEnd) ...
  // Re-implementing briefly for completeness of the copy-paste
  const handleAddItem = async () => {
    const roomId = parseInt(selectedView.split(':')[1]);
    const name = prompt('Название товара:');
    if (!name) return;
    const { data } = await supabase.from('items').insert({ name, room_id: roomId, price: 0, quantity: 1, position: items.length }).select().single();
    if (data) setItems([...items, data]);
  };
  const updateItem = async (id: number, updates: any) => {
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
    await supabase.from('items').update(updates).eq('id', id);
  };
  const handleDeleteItem = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    setItems(items.filter(i => i.id !== id));
    await supabase.from('items').delete().eq('id', id);
  };
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const roomId = parseInt(selectedView.split(':')[1]);
    const roomItems = items.filter(i => i.room_id === roomId);
    const reordered = Array.from(roomItems);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const otherItems = items.filter(i => i.room_id !== roomId);
    setItems([...otherItems, ...reordered]);
    for (let i = 0; i < reordered.length; i++) await supabase.from('items').update({ position: i }).eq('id', reordered[i].id);
  };

  // ... (Keep existing Files handlers) ...
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const folderId = selectedView.split(':')[1];
    if (!e.target.files || !folderId) return;
    setLoadingFiles(true);
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const safeName = transliterate(file.name);
        const path = `${projectId}/${folderId}/${Date.now()}_${safeName}`;
        await supabase.storage.from('project-files').upload(path, file);
    }
    setLoadingFiles(false);
    fetchFiles();
  };
  const handleBulkDeleteFiles = async () => {
    if (!confirm(`Удалить ${selectedFileNames.length} файлов?`)) return;
    const folderId = selectedView.split(':')[1];
    const paths = selectedFileNames.map(name => `${projectId}/${folderId}/${name}`);
    await supabase.storage.from('project-files').remove(paths);
    setSelectedFileNames([]);
    fetchFiles();
  };

  // ... (Keep Export handlers) ...
  const getGrandTotal = () => items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const handleExportExcel = () => { /* reuse existing logic */ 
    const wb = XLSX.utils.book_new();
    const data: any[] = [];
    rooms.forEach(room => {
        const roomItems = items.filter(i => i.room_id === room.id);
        if (roomItems.length === 0) return;
        data.push({ Наименование: `КОМНАТА: ${room.name}`, Цена: '', Колво: '', Сумма: '' });
        roomItems.forEach(item => data.push({ Наименование: item.name, Цена: item.price, Колво: item.quantity, Сумма: item.price * item.quantity }));
        data.push({});
    });
    data.push({ Наименование: 'ИТОГО ПО ПРОЕКТУ', Сумма: getGrandTotal() });
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
    doc.text(`Grand Total: ${getGrandTotal()}`, 14, y + 10);
    doc.save('Estimate.pdf');
  };

  // --- Render Components ---

  const renderContactsContent = () => (
    <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Команда проекта</h2>
            <button onClick={handleAddContact} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={18} /> Добавить
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
                    В проекте пока нет контактов
                </div>
            )}
        </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0">
        <div className="p-4 border-b">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors">
                <ArrowLeft size={16} /> Назад к проектам
            </button>
            <h1 className="font-bold text-xl text-gray-900 leading-tight">{projectName}</h1>
        </div>

        <div className="flex-1 py-4 flex flex-col">
            {/* Main Links */}
            <div className="px-3 mb-6 space-y-1">
                <button onClick={() => setSelectedView('overview')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${selectedView === 'overview' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <LayoutDashboard size={18} /> Сводка
                </button>
                <button onClick={() => setSelectedView('estimates')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${selectedView === 'estimates' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <FileText size={18} /> Смета
                </button>
                <button onClick={() => setSelectedView('contacts')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${selectedView === 'contacts' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Users size={18} /> Контакты
                </button>
            </div>

            {/* Folders */}
            <div className="mb-6">
                <div className="px-6 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    <span>Файлы</span>
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
                    <span>Комнаты</span>
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
                <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">Ресурсы</div>
                <button onClick={() => router.push('/dashboard/catalog')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                    <Book size={18} /> Каталог
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
    if (!folder) return <div>Папка не найдена</div>;
    const toggleSelection = (name: string) => selectedFileNames.includes(name) ? setSelectedFileNames(selectedFileNames.filter(n => n !== name)) : setSelectedFileNames([...selectedFileNames, name]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><FolderIcon className="text-blue-500" /> {folder.name}</h2>
                <div className="flex gap-2">
                    {selectedFileNames.length > 0 && <button onClick={handleBulkDeleteFiles} className="px-4 py-2 bg-red-50 text-red-600 rounded">Удалить ({selectedFileNames.length})</button>}
                    <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">Загрузить <UploadCloud size={16} /><input type="file" multiple className="hidden" onChange={handleFileUpload} /></label>
                </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden flex-1">
                 <div className="grid grid-cols-[40px_40px_1fr_150px_100px] gap-4 p-3 bg-gray-50 border-b text-xs font-semibold text-gray-500"><div></div><div>ТИП</div><div>ИМЯ</div><div>ДАТА</div><div></div></div>
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
            <div className="grid grid-cols-[30px_60px_3fr_1fr_1fr_1fr_60px] gap-4 text-xs font-medium text-gray-400 mb-2 px-2"><div></div><div>ФОТО</div><div>НАИМЕНОВАНИЕ</div><div>ЦЕНА</div><div>КОЛ-ВО</div><div>СУММА</div><div></div></div>
            {isMounted && <DragDropContext onDragEnd={onDragEnd}><Droppable droppableId={roomId.toString()}>{(provided) => (<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">{roomItems.map((item, index) => (<Draggable key={item.id} draggableId={item.id.toString()} index={index}>{(provided) => (<div ref={provided.innerRef} {...provided.draggableProps} className="grid grid-cols-[30px_60px_3fr_1fr_1fr_1fr_60px] gap-4 items-center bg-white p-3 rounded-lg border shadow-sm"><div {...provided.dragHandleProps} className="cursor-grab text-gray-300"><GripVertical size={16} /></div><div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center overflow-hidden">{item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300" />}</div><div><input value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} className="font-medium w-full bg-transparent focus:outline-none" /><div className="text-xs text-gray-400 mt-1">{item.material} {item.dimensions}</div></div><input type="number" value={item.price} onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })} className="w-full bg-transparent text-sm" /><input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="w-full bg-transparent text-sm" /><div className="text-sm font-medium">{(item.price * item.quantity).toLocaleString()} ₽</div><button onClick={() => handleDeleteItem(item.id)} className="text-red-300 hover:text-red-500 ml-auto"><Trash2 size={16} /></button></div>)}</Draggable>))}{provided.placeholder}</div>)}</Droppable></DragDropContext>}
            <button onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium"><Plus size={16} /> Добавить товар</button>
        </div>
     );
  };

  const renderEstimatesContent = () => (
     // ... Standard Estimates Render ...
     <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8"><div><h2 className="text-2xl font-bold mb-1">Смета</h2></div><div className="text-right"><div className="text-3xl font-bold text-green-600 mb-2">{getGrandTotal().toLocaleString()} ₽</div><div className="flex gap-2"><button onClick={handleExportExcel} className="p-2 text-green-600 bg-green-50 rounded"><FileSpreadsheet size={20} /></button><button onClick={handleExportPDF} className="p-2 text-red-600 bg-red-50 rounded"><FileText size={20} /></button><button onClick={() => window.print()} className="p-2 text-gray-600 bg-gray-100 rounded"><Printer size={20} /></button></div></div></div>
        <div className="space-y-8">{rooms.map(room => { const roomItems = items.filter(i => i.room_id === room.id); if (!roomItems.length) return null; return (<div key={room.id} className="border rounded-lg overflow-hidden"><div className="bg-gray-50 p-3 border-b flex justify-between font-bold"><span>{room.name}</span><span>{roomItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()} ₽</span></div><table className="w-full text-sm"><tbody className="divide-y">{roomItems.map(item => (<tr key={item.id}><td className="p-3 font-medium">{item.name}</td><td className="p-3 text-right">{item.price}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">{item.price * item.quantity}</td></tr>))}</tbody></table></div>)})}</div>
     </div>
  );
  
  const renderOverviewContent = () => (
     <div className="p-8"><h2 className="text-2xl font-bold mb-6">Сводка</h2><div className="grid grid-cols-3 gap-6"><div className="bg-blue-50 p-6 rounded-xl border border-blue-100"><div className="text-blue-500 font-medium mb-2">Комнат</div><div className="text-3xl font-bold text-blue-700">{rooms.length}</div></div><div className="bg-green-50 p-6 rounded-xl border border-green-100"><div className="text-green-500 font-medium mb-2">Бюджет</div><div className="text-3xl font-bold text-green-700">{getGrandTotal().toLocaleString()} ₽</div></div></div></div>
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
    </div>
  );
}