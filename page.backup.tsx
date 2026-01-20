"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Pencil, Trash2, Check, X, Image as ImageIcon, GripVertical, Printer, FileSpreadsheet, FileText, FileIcon, Download, UploadCloud, ArrowUpDown } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Transliteration function: converts Cyrillic to Latin
const transliterate = (text: string): string => {
  const cyrillicToLatin: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text
    .split('')
    .map(char => cyrillicToLatin[char] || char)
    .join('')
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters except dot, underscore, hyphen
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
};

// Format filename: removes timestamp prefix (digits + underscore)
const formatFileName = (name: string): string => {
  // Check if name starts with digits followed by underscore
  const timestampPattern = /^\d+_/;
  if (timestampPattern.test(name)) {
    // Remove everything up to and including the first underscore
    return name.replace(/^\d+_/, '');
  }
  // Return name as is if no timestamp prefix
  return name;
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const supabase = createClient();

  // State management
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'estimates' | 'files'>(
    (searchParams.get('tab') as 'overview' | 'rooms' | 'estimates' | 'files') || 'overview'
  );
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    status: "",
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'date' | 'name'>('date');
  const [newRoomName, setNewRoomName] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [expandedRoomId, setExpandedRoomId] = useState<string | number | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | number | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [newItemData, setNewItemData] = useState({
    name: "",
    link: "",
    image_url: "",
    price: "",
    quantity: "",
    vendor: "",
    dimensions: "",
    material: "",
  });

  // Fetch rooms and items function
  const fetchRooms = async (projectId: number) => {
    if (!projectId) return;

    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("project_id", projectId)
        .order("name", { ascending: true });

      if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
      } else {
        setRooms(roomsData || []);
      }

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });

      if (itemsError) {
        console.error("Error fetching items:", itemsError);
      } else {
        setItems(itemsData || []);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      const id = params?.id;
      
      if (!id) {
        setLoading(false);
        return;
      }

      // Convert id to number (handle both string and string[])
      const idString = Array.isArray(id) ? id[0] : id;
      const projectId = parseInt(idString, 10);
      
      if (isNaN(projectId)) {
        console.error("Invalid project ID:", idString);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching project:", error);
          setLoading(false);
        } else if (data) {
          setProject(data);
          setFormData({
            title: data.title || "",
            client: data.client_name || data.client || "",
            status: data.status || "",
          });
          setLoading(false);
          // Fetch rooms when project is loaded
          fetchRooms(projectId);
        } else {
          // Data is null - project not found
          setProject(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error:", err);
        setLoading(false);
      }
    };

    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync activeTab with URL query params (for browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'rooms', 'estimates', 'files'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as 'overview' | 'rooms' | 'estimates' | 'files');
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (tab: 'overview' | 'rooms' | 'estimates' | 'files') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Fetch rooms when switching to 'rooms' tab
  useEffect(() => {
    if (activeTab === 'rooms' && project?.id) {
      fetchRooms(project.id);
    }
  }, [activeTab, project?.id]);

  // Fetch folders
  const fetchFolders = async () => {
    const id = params?.id;
    if (!id) return;

    const idString = Array.isArray(id) ? id[0] : id;
    const projectId = parseInt(idString.toString(), 10);

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching folders:', error);
        setFolders([]);
      } else {
        setFolders(data || []);
        // Set first folder as active if none selected and folders exist
        if (data && data.length > 0 && activeFolderId === null) {
          setActiveFolderId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setFolders([]);
    }
  };

  // Fetch files function
  const fetchFiles = async () => {
    const id = params?.id;
    if (!id || !activeFolderId) {
      setFiles([]);
      return;
    }

    const idString = Array.isArray(id) ? id[0] : id;
    const projectId = idString.toString();
    const folderPath = `${projectId}/${activeFolderId}`;

    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
      } else {
        setFiles(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setFiles([]);
    }
  };

  // Fetch folders when switching to 'files' tab
  useEffect(() => {
    if (activeTab === 'files' && params?.id) {
      fetchFolders();
      setSelectedFileNames([]);
    }
  }, [activeTab, params?.id]);

  // Fetch files when folder changes
  useEffect(() => {
    if (activeTab === 'files' && params?.id && activeFolderId) {
      fetchFiles();
      setSelectedFileNames([]);
    }
  }, [activeTab, params?.id, activeFolderId]);

  // Get file URL
  const getFileUrl = (fileName: string): string => {
    const id = params?.id;
    if (!id || !activeFolderId) return '';
    
    const idString = Array.isArray(id) ? id[0] : id;
    const projectId = idString.toString();
    const path = `${projectId}/${activeFolderId}/${fileName}`;
    
    const { data } = supabase.storage
      .from('project-files')
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  // Handle file upload (multi-file support)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !activeFolderId) return;

    const id = params?.id;
    if (!id) return;

    const idString = Array.isArray(id) ? id[0] : id;
    const projectId = idString.toString();

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const sanitizedName = transliterate(file.name);
        const fileName = `${Date.now()}_${index}_${sanitizedName}`;
        const path = `${projectId}/${activeFolderId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('project-files')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          throw new Error(`${file.name}: ${error.message}`);
        }

        return data;
      });

      await Promise.all(uploadPromises);
      
      // Success - refresh file list
      await fetchFiles();
    } catch (err: any) {
      console.error("Upload exception:", err);
      alert(`Ошибка загрузки: ${err.message || "Неизвестная ошибка"}`);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Введите название папки');
      return;
    }

    const id = params?.id;
    if (!id) return;

    const idString = Array.isArray(id) ? id[0] : id;
    const projectId = parseInt(idString.toString(), 10);

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: newFolderName.trim(),
          project_id: projectId
        })
        .select()
        .single();

      if (error) {
        alert(`Ошибка создания папки: ${error.message}`);
      } else {
        await fetchFolders();
        if (data) {
          setActiveFolderId(data.id);
        }
        setNewFolderName("");
        setIsCreatingFolder(false);
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle delete folder
  const handleDeleteFolder = async (folderId: number) => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить эту папку? Все файлы в ней также будут удалены."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) {
        alert(`Ошибка удаления папки: ${error.message}`);
      } else {
        await fetchFolders();
        // If deleted folder was active, set first folder as active or null
        if (activeFolderId === folderId) {
          if (folders.length > 1) {
            const remainingFolders = folders.filter(f => f.id !== folderId);
            setActiveFolderId(remainingFolders[0]?.id || null);
          } else {
            setActiveFolderId(null);
          }
        }
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle delete file
  const handleDeleteFile = async (fileName: string) => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить этот файл?"
    );

    if (!confirmed || !activeFolderId) return;

    const id = params?.id;
    if (!id) return;

    const idString = Array.isArray(id) ? id[0] : id;
    const projectId = idString.toString();
    const path = `${projectId}/${activeFolderId}/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from('project-files')
        .remove([path]);

      if (error) {
        alert(`Ошибка удаления файла: ${error.message}`);
      } else {
        await fetchFiles();
        // Remove from selection if selected
        setSelectedFileNames(prev => prev.filter(name => name !== fileName));
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedFileNames.length === 0 || !activeFolderId) return;

    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить ${selectedFileNames.length} файл(ов)?`
    );

    if (!confirmed) return;

    const id = params?.id;
    if (!id) return;

    const idString = Array.isArray(id) ? id[0] : id;
    const projectId = idString.toString();

    try {
      const paths = selectedFileNames.map(fileName => `${projectId}/${activeFolderId}/${fileName}`);
      
      const { error } = await supabase.storage
        .from('project-files')
        .remove(paths);

      if (error) {
        alert(`Ошибка удаления файлов: ${error.message}`);
      } else {
        await fetchFiles();
        setSelectedFileNames([]);
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileName: string) => {
    setSelectedFileNames(prev => 
      prev.includes(fileName)
        ? prev.filter(name => name !== fileName)
        : [...prev, fileName]
    );
  };

  // Toggle all files selection
  const toggleAllFilesSelection = () => {
    if (selectedFileNames.length === files.length) {
      setSelectedFileNames([]);
    } else {
      setSelectedFileNames(files.map(f => f.name));
    }
  };

  // Sort files
  const sortedFiles = [...files].sort((a, b) => {
    if (sortOrder === 'date') {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Descending (newest first)
    } else {
      const nameA = formatFileName(a.name).toLowerCase();
      const nameB = formatFileName(b.name).toLowerCase();
      return nameA.localeCompare(nameB, 'ru'); // Ascending
    }
  });

  // Handle add room
  const handleAddRoom = async () => {
    if (!project || !newRoomName.trim()) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .insert({
          name: newRoomName.trim(),
          project_id: project.id,
        });

      if (error) {
        alert(`Ошибка добавления комнаты: ${error.message}`);
      } else {
        setNewRoomName("");
        fetchRooms(project.id);
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle delete room
  const handleDeleteRoom = async (roomId: number) => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить эту комнату?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (error) {
        alert(`Ошибка удаления: ${error.message}`);
      } else {
        if (project?.id) {
          fetchRooms(project.id);
        }
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle start edit room
  const handleStartEdit = (room: any) => {
    setEditingRoomId(room.id);
    setEditingName(room.name);
  };

  // Handle cancel edit room
  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setEditingName("");
  };

  // Get room total price
  const getRoomTotal = (roomId: string | number): number => {
    const roomItems = items.filter(item => item.room_id === roomId);
    return roomItems.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Calculate grand total for all items
  const grandTotal = items.reduce((total, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return total + (price * quantity);
  }, 0);

  // Get rooms with their items (grouped by room)
  const roomsWithItems = rooms
    .map(room => {
      const roomItems = items
        .filter(item => item.room_id === room.id)
        .sort((a, b) => {
          const posA = a.position ?? 0;
          const posB = b.position ?? 0;
          return posA - posB;
        });
      const roomTotal = roomItems.reduce((total, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        return total + (price * quantity);
      }, 0);
      return {
        ...room,
        items: roomItems,
        total: roomTotal,
      };
    })
    .filter(room => room.items.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  // Export to Excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const projectName = project?.title || 'Проект';
    
    // Prepare data
    const excelData: any[] = [];
    
    roomsWithItems.forEach(room => {
      // Room header
      excelData.push({
        'Наименование': room.name,
        'Цена': '',
        'Кол-во': '',
        'Сумма': room.total.toLocaleString('ru-RU') + ' ₽',
      });
      
      // Room items
      room.items.forEach((item: any) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        const sum = price * quantity;
        excelData.push({
          'Наименование': item.name || 'Без названия',
          'Цена': price.toLocaleString('ru-RU') + ' ₽',
          'Кол-во': quantity,
          'Сумма': sum.toLocaleString('ru-RU') + ' ₽',
        });
      });
      
      // Empty row between rooms
      excelData.push({
        'Наименование': '',
        'Цена': '',
        'Кол-во': '',
        'Сумма': '',
      });
    });
    
    // Grand total
    excelData.push({
      'Наименование': 'ИТОГО',
      'Цена': '',
      'Кол-во': '',
      'Сумма': grandTotal.toLocaleString('ru-RU') + ' ₽',
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Смета');
    XLSX.writeFile(workbook, `Estimate_${projectName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      let fontName = 'helvetica';
      
      // Fetch and load Roboto font for Cyrillic support
      try {
        const fontResponse = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
        if (!fontResponse.ok) {
          throw new Error('Font fetch failed');
        }
        
        const fontArrayBuffer = await fontResponse.arrayBuffer();
        const fontBase64 = btoa(
          new Uint8Array(fontArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
        fontName = 'Roboto';
      } catch (fontError) {
        console.error('Error loading font:', fontError);
        alert('Не удалось загрузить шрифт. PDF будет создан со стандартным шрифтом (кириллица может отображаться некорректно).');
      }
      
      await generatePDF(doc, fontName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ошибка при создании PDF файла.');
    }
  };

  // Helper function to generate PDF content
  const generatePDF = async (doc: jsPDF, fontName: string) => {
    const projectName = project?.title || 'Проект';
    const clientName = project?.client_name || project?.client || 'Не указан';
    
    // Add title
    doc.setFontSize(18);
    doc.setFont(fontName, 'bold');
    doc.text(projectName, 14, 20);
    
    // Add client
    doc.setFontSize(12);
    doc.setFont(fontName, 'normal');
    doc.text(`Клиент: ${clientName}`, 14, 30);
    
    let yPosition = 45;
    
    // Iterate through rooms
    roomsWithItems.forEach((room, roomIndex) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Room header
      doc.setFontSize(14);
      doc.setFont(fontName, 'bold');
      doc.text(`${room.name} (${room.items.length} ${room.items.length === 1 ? 'товар' : 'товаров'})`, 14, yPosition);
      
      yPosition += 8;
      
      // Room total
      doc.setFontSize(11);
      doc.setFont(fontName, 'normal');
      doc.text(`Итого по комнате: ${room.total.toLocaleString('ru-RU')} ₽`, 14, yPosition);
      
      yPosition += 10;
      
      // Prepare table data
      const tableData = room.items.map((item: any) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        const sum = price * quantity;
        return [
          item.name || 'Без названия',
          price.toLocaleString('ru-RU') + ' ₽',
          quantity.toString(),
          sum.toLocaleString('ru-RU') + ' ₽',
        ];
      });
      
      // Add table
      autoTable(doc, {
        startY: yPosition,
        head: [['Наименование', 'Цена', 'Кол-во', 'Сумма']],
        body: tableData,
        styles: { 
          fontSize: 9,
          font: fontName,
          fontStyle: 'normal'
        },
        headStyles: { 
          fillColor: [240, 240, 240],
          font: fontName,
          fontStyle: 'bold'
        },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    });
    
    // Add grand total
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(fontName, 'bold');
    doc.text(`ИТОГО: ${grandTotal.toLocaleString('ru-RU')} ₽`, 14, yPosition);
    
    // Save PDF
    doc.save(`Estimate_${projectName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.pdf`);
  };

  // Handle drag end
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Only support reordering within the same room
    if (source.droppableId !== destination.droppableId) return;

    const roomId = parseInt(source.droppableId, 10);
    const roomItems = items.filter(item => item.room_id === roomId).sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      return posA - posB;
    });

    // Create a copy and reorder
    const reorderedItems = Array.from(roomItems);
    const [removed] = reorderedItems.splice(source.index, 1);
    reorderedItems.splice(destination.index, 0, removed);

    // Update local state optimistically
    const updatedItems = items.map(item => {
      if (item.room_id === roomId) {
        const newIndex = reorderedItems.findIndex(ri => ri.id === item.id);
        if (newIndex !== -1) {
          return { ...item, position: newIndex };
        }
      }
      return item;
    });
    setItems(updatedItems);

    // Update database in background
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from("items")
          .update({ position: update.position })
          .eq("id", update.id);
      }
    } catch (err) {
      console.error("Error updating item positions:", err);
      // Revert on error
      if (project?.id) {
        fetchRooms(project.id);
      }
    }
  };

  // Handle update room
  const handleUpdateRoom = async (roomId: number) => {
    if (!editingName.trim()) {
      alert("Название комнаты не может быть пустым");
      return;
    }

    try {
      const { error } = await supabase
        .from("rooms")
        .update({ name: editingName.trim() })
        .eq("id", roomId);

      if (error) {
        alert(`Ошибка обновления: ${error.message}`);
      } else {
        // Update local state
        setRooms(rooms.map(room => 
          room.id === roomId ? { ...room, name: editingName.trim() } : room
        ));
        handleCancelEdit();
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle open add item modal
  const openAddItemModal = (roomId: string | number) => {
    setActiveRoomId(roomId);
    setEditingItemId(null);
    setNewItemData({
      name: "",
      link: "",
      image_url: "",
      price: "",
      quantity: "",
      vendor: "",
      dimensions: "",
      material: "",
    });
    setIsItemModalOpen(true);
  };

  // Handle open edit item modal
  const openEditItemModal = (item: any) => {
    setEditingItemId(item.id);
    setActiveRoomId(item.room_id);
    setNewItemData({
      name: item.name || "",
      link: item.link || "",
      image_url: item.image_url || "",
      price: item.price ? item.price.toString() : "",
      quantity: item.quantity ? item.quantity.toString() : "",
      vendor: item.vendor || "",
      dimensions: item.dimensions || "",
      material: item.material || "",
    });
    setIsItemModalOpen(true);
  };

  // Handle save item
  const handleSaveItem = async () => {
    if (!newItemData.name.trim()) {
      alert("Название товара обязательно");
      return;
    }

    if (!project || !activeRoomId) return;

    // Convert id to number
    const idString = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const projectId = parseInt(idString as string, 10);

    if (isNaN(projectId)) {
      alert("Ошибка: неверный ID проекта");
      return;
    }

    const itemData = {
      name: newItemData.name.trim(),
      link: newItemData.link.trim() || null,
      image_url: newItemData.image_url.trim() || null,
      price: newItemData.price ? parseFloat(newItemData.price) : 0,
      quantity: newItemData.quantity ? parseInt(newItemData.quantity, 10) : 1,
      vendor: newItemData.vendor.trim() || null,
      dimensions: newItemData.dimensions.trim() || null,
      material: newItemData.material.trim() || null,
    };

    try {
      let error;
      
      if (editingItemId) {
        // Update existing item
        const { error: updateError } = await supabase
          .from("items")
          .update(itemData)
          .eq("id", editingItemId);
        error = updateError;
      } else {
        // Insert new item
        const { error: insertError } = await supabase
          .from("items")
          .insert({
            ...itemData,
            project_id: projectId,
            room_id: activeRoomId,
          });
        error = insertError;
      }

      if (error) {
        alert(`Ошибка ${editingItemId ? 'обновления' : 'добавления'} товара: ${error.message}`);
      } else {
        setIsItemModalOpen(false);
        setActiveRoomId(null);
        setEditingItemId(null);
        if (project?.id) {
          fetchRooms(project.id);
        }
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle delete item
  const handleDeleteItem = async (itemId: number) => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить этот товар?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) {
        alert(`Ошибка удаления: ${error.message}`);
      } else {
        if (project?.id) {
          fetchRooms(project.id);
        }
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title: formData.title.trim(),
          client_name: formData.client.trim(),
          status: formData.status.trim(),
        })
        .eq("id", project.id);

      if (error) {
        alert(`Ошибка сохранения: ${error.message}`);
      } else {
        // Update local state
        setProject({
          ...project,
          title: formData.title.trim(),
          client_name: formData.client.trim(),
          status: formData.status.trim(),
        });
        setIsEditing(false);
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!project) return;

    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (error) {
        alert(`Ошибка удаления: ${error.message}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    if (project) {
      setFormData({
        title: project.title || "",
        client: project.client_name || project.client || "",
        status: project.status || "",
      });
    }
    setIsEditing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="p-8">
        <div className="mb-4 text-lg">Проект не найден</div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Назад к списку
        </button>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="text-gray-500">
            Здесь будет сводка по проекту...
          </div>
        );
      case 'rooms':
        return (
          <div className="space-y-6">
            {/* Add Room Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRoom();
                  }
                }}
                placeholder="Название комнаты"
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={handleAddRoom}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                Добавить
              </button>
            </div>

            {/* Rooms List */}
            {rooms.length === 0 ? (
              <div className="text-gray-500 py-8 text-center">
                Комнаты не добавлены
              </div>
            ) : !isMounted ? (
              <div className="space-y-2">
                {rooms.map((room) => {
                  const isExpanded = expandedRoomId === room.id;
                  const isEditing = editingRoomId === room.id;
                  const roomItems = items.filter(item => item.room_id === room.id);

                  return (
                    <div
                      key={room.id}
                      className="border border-gray-200 rounded overflow-hidden"
                    >
                      {/* Accordion Header */}
                      <div
                        className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                          isExpanded ? 'bg-gray-50' : ''
                        }`}
                      >
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateRoom(room.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                              autoFocus
                            />
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateRoom(room.id);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Сохранить"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                title="Отмена"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                setExpandedRoomId(isExpanded ? null : room.id);
                              }}
                            >
                              <span className="text-lg font-medium">{room.name}</span>
                              {roomItems.length > 0 && (
                                <span className="ml-2 text-sm text-gray-500">
                                  ({roomItems.length} {roomItems.length === 1 ? 'товар' : 'товаров'})
                                </span>
                              )}
                              {roomItems.length > 0 && (
                                <span className="ml-2 text-sm font-semibold text-gray-700">
                                  — {getRoomTotal(room.id).toLocaleString('ru-RU')} ₽
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(room);
                                }}
                                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                title="Редактировать"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(room.id);
                                }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && !isEditing && (
                        <div className="border-t border-gray-200 bg-white p-4">
                          {/* Items Table */}
                          {roomItems.length === 0 ? (
                            <div className="text-gray-500 py-4 text-center text-sm">
                              Товары не добавлены
                            </div>
                          ) : (
                            <div className="mb-4">
                              {/* Header Row */}
                              <div className="grid grid-cols-[30px_60px_3fr_1fr_1fr_1fr_80px] gap-4 text-sm text-gray-500 font-medium mb-2 px-2">
                                <div></div>
                                <div>Фото</div>
                                <div>Наименование</div>
                                <div className="text-right">Цена</div>
                                <div className="text-right">Кол-во</div>
                                <div className="text-right">Сумма</div>
                                <div className="text-right">Действия</div>
                              </div>

                              {/* Droppable Items List */}
                              <Droppable droppableId={room.id.toString()}>
                                {(provided) => (
                                  <div className="flex flex-col gap-2" {...provided.droppableProps} ref={provided.innerRef}>
                                    {roomItems.map((item, index) => {
                                      const price = item.price || 0;
                                      const quantity = item.quantity || 0;
                                      const sum = price * quantity;
                                      return (
                                        <Draggable
                                          key={item.id}
                                          draggableId={item.id.toString()}
                                          index={index}
                                        >
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`grid grid-cols-[30px_60px_3fr_1fr_1fr_1fr_80px] gap-4 items-center bg-white p-2 rounded-md border ${
                                                snapshot.isDragging ? 'shadow-md' : 'border-gray-100'
                                              } hover:bg-gray-50 transition-colors`}
                                            >
                                              <div {...provided.dragHandleProps} className="flex items-center">
                                                <GripVertical className="text-gray-400 cursor-grab active:cursor-grabbing" />
                                              </div>
                                              <div className="flex items-center">
                                                {item.image_url ? (
                                                  <img
                                                    src={item.image_url}
                                                    alt={item.name || 'Товар'}
                                                    className="w-12 h-12 object-cover rounded-md"
                                                    onError={(e) => {
                                                      e.currentTarget.style.display = 'none';
                                                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                                      if (placeholder) {
                                                        placeholder.style.display = 'flex';
                                                      }
                                                    }}
                                                  />
                                                ) : null}
                                                <div 
                                                  className={`w-12 h-12 bg-gray-100 rounded-md items-center justify-center ${item.image_url ? 'hidden' : 'flex'}`}
                                                >
                                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                              </div>
                                              <div className="text-sm">
                                                {item.link ? (
                                                  <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                  >
                                                    {item.name || 'Без названия'}
                                                  </a>
                                                ) : (
                                                  <span className="font-medium">{item.name || 'Без названия'}</span>
                                                )}
                                                {(item.material || item.dimensions) && (
                                                  <div className="mt-1 text-xs text-gray-500">
                                                    {item.material && <span>{item.material}</span>}
                                                    {item.material && item.dimensions && <span> • </span>}
                                                    {item.dimensions && <span>{item.dimensions}</span>}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="text-sm text-right">
                                                {price.toLocaleString('ru-RU')} ₽
                                              </div>
                                              <div className="text-sm text-right">{quantity}</div>
                                              <div className="text-sm text-right font-medium">
                                                {sum.toLocaleString('ru-RU')} ₽
                                              </div>
                                              <div className="text-sm text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                  <button
                                                    onClick={() => openEditItemModal(item)}
                                                    className="p-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                                    title="Редактировать"
                                                  >
                                                    <Pencil size={16} />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                    title="Удалить"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          )}

                          {/* Add Item Button */}
                          <button
                            onClick={() => openAddItemModal(room.id)}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
                          >
                            Добавить товар
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="space-y-2">
                  {rooms.map((room) => {
                    const isExpanded = expandedRoomId === room.id;
                    const isEditing = editingRoomId === room.id;
                    const roomItems = items
                      .filter(item => item.room_id === room.id)
                      .sort((a, b) => {
                        const posA = a.position ?? 0;
                        const posB = b.position ?? 0;
                        return posA - posB;
                      });

                  return (
                    <div
                      key={room.id}
                      className="border border-gray-200 rounded overflow-hidden"
                    >
                      {/* Accordion Header */}
                      <div
                        className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                          isExpanded ? 'bg-gray-50' : ''
                        }`}
                      >
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateRoom(room.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                              autoFocus
                            />
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateRoom(room.id);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Сохранить"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                title="Отмена"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                setExpandedRoomId(isExpanded ? null : room.id);
                              }}
                            >
                              <span className="text-lg font-medium">{room.name}</span>
                              {roomItems.length > 0 && (
                                <span className="ml-2 text-sm text-gray-500">
                                  ({roomItems.length} {roomItems.length === 1 ? 'товар' : 'товаров'})
                                </span>
                              )}
                              {roomItems.length > 0 && (
                                <span className="ml-2 text-sm font-semibold text-gray-700">
                                  — {getRoomTotal(room.id).toLocaleString('ru-RU')} ₽
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(room);
                                }}
                                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                title="Редактировать"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(room.id);
                                }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && !isEditing && (
                        <div className="border-t border-gray-200 bg-white p-4">
                          {/* Items Table */}
                          {roomItems.length === 0 ? (
                            <div className="text-gray-500 py-4 text-center text-sm">
                              Товары не добавлены
                            </div>
                          ) : (
                            <div className="mb-4">
                              {/* Header Row */}
                              <div className="grid grid-cols-[30px_60px_3fr_1fr_1fr_1fr_80px] gap-4 text-sm text-gray-500 font-medium mb-2 px-2">
                                <div></div>
                                <div>Фото</div>
                                <div>Наименование</div>
                                <div className="text-right">Цена</div>
                                <div className="text-right">Кол-во</div>
                                <div className="text-right">Сумма</div>
                                <div className="text-right">Действия</div>
                              </div>

                              {/* Droppable Items List */}
                              <Droppable droppableId={room.id.toString()}>
                                {(provided) => (
                                  <div className="flex flex-col gap-2" {...provided.droppableProps} ref={provided.innerRef}>
                                    {roomItems.map((item, index) => {
                                      const price = item.price || 0;
                                      const quantity = item.quantity || 0;
                                      const sum = price * quantity;
                                      return (
                                        <Draggable
                                          key={item.id}
                                          draggableId={item.id.toString()}
                                          index={index}
                                        >
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`grid grid-cols-[30px_60px_3fr_1fr_1fr_1fr_80px] gap-4 items-center bg-white p-2 rounded-md border ${
                                                snapshot.isDragging ? 'shadow-md' : 'border-gray-100'
                                              } hover:bg-gray-50 transition-colors`}
                                            >
                                              <div {...provided.dragHandleProps} className="flex items-center">
                                                <GripVertical className="text-gray-400 cursor-grab active:cursor-grabbing" />
                                              </div>
                                              <div className="flex items-center">
                                                {item.image_url ? (
                                                  <img
                                                    src={item.image_url}
                                                    alt={item.name || 'Товар'}
                                                    className="w-12 h-12 object-cover rounded-md"
                                                    onError={(e) => {
                                                      e.currentTarget.style.display = 'none';
                                                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                                      if (placeholder) {
                                                        placeholder.style.display = 'flex';
                                                      }
                                                    }}
                                                  />
                                                ) : null}
                                                <div 
                                                  className={`w-12 h-12 bg-gray-100 rounded-md items-center justify-center ${item.image_url ? 'hidden' : 'flex'}`}
                                                >
                                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                              </div>
                                              <div className="text-sm">
                                                {item.link ? (
                                                  <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                  >
                                                    {item.name || 'Без названия'}
                                                  </a>
                                                ) : (
                                                  <span className="font-medium">{item.name || 'Без названия'}</span>
                                                )}
                                                {(item.material || item.dimensions) && (
                                                  <div className="mt-1 text-xs text-gray-500">
                                                    {item.material && <span>{item.material}</span>}
                                                    {item.material && item.dimensions && <span> • </span>}
                                                    {item.dimensions && <span>{item.dimensions}</span>}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="text-sm text-right">
                                                {price.toLocaleString('ru-RU')} ₽
                                              </div>
                                              <div className="text-sm text-right">{quantity}</div>
                                              <div className="text-sm text-right font-medium">
                                                {sum.toLocaleString('ru-RU')} ₽
                                              </div>
                                              <div className="text-sm text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                  <button
                                                    onClick={() => openEditItemModal(item)}
                                                    className="p-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                                    title="Редактировать"
                                                  >
                                                    <Pencil size={16} />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                    title="Удалить"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          )}

                          {/* Add Item Button */}
                          <button
                            onClick={() => openAddItemModal(room.id)}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
                          >
                            Добавить товар
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              </DragDropContext>
            )}
          </div>
        );
      case 'estimates':
        return (
          <div className="space-y-6">
            {/* Header with Export Buttons */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Смета проекта</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Печать
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-2">Итоговая стоимость реализации</div>
              <div className="text-4xl font-bold text-black">
                {grandTotal.toLocaleString('ru-RU')} ₽
              </div>
            </div>

            {/* Grouped by Room */}
            {roomsWithItems.length === 0 ? (
              <div className="text-gray-500 py-8 text-center">
                Товары не добавлены
              </div>
            ) : (
              <div className="space-y-4">
                {roomsWithItems.map((room) => (
                  <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Room Header */}
                    <div className="bg-gray-100 p-3 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">
                          {room.name} ({room.items.length} {room.items.length === 1 ? 'товар' : 'товаров'})
                        </div>
                        <div className="font-semibold text-gray-900">
                          Итого по комнате: {room.total.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    </div>

                    {/* Room Items Table */}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-16">
                            Фото
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Наименование
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            Цена
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            Кол-во
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            Сумма
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.items.map((item: any) => {
                          const price = item.price || 0;
                          const quantity = item.quantity || 0;
                          const sum = price * quantity;
                          return (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name || 'Товар'}
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (placeholder) {
                                        placeholder.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-12 h-12 bg-gray-100 rounded items-center justify-center ${item.image_url ? 'hidden' : 'flex'}`}
                                >
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-sm">{item.name || 'Без названия'}</div>
                                {(item.material || item.dimensions) && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    {item.material && <span>{item.material}</span>}
                                    {item.material && item.dimensions && <span> • </span>}
                                    {item.dimensions && <span>{item.dimensions}</span>}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-right">
                                {price.toLocaleString('ru-RU')} ₽
                              </td>
                              <td className="py-3 px-4 text-sm text-right">
                                {quantity}
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-medium">
                                {sum.toLocaleString('ru-RU')} ₽
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}

                {/* Grand Total Footer */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Итоговая стоимость реализации</div>
                      <div className="text-3xl font-bold text-black">
                        {grandTotal.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'files':
        const activeFolder = folders.find(f => f.id === activeFolderId);
        
        return (
          <div className="flex h-[600px] border border-gray-200 rounded-lg overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 border-r border-gray-200 p-4 flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Папки</h3>
              
              {/* Folders List */}
              <div className="flex-1 overflow-y-auto mb-4">
                {folders.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Нет папок
                  </div>
                ) : (
                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group ${
                          activeFolderId === folder.id
                            ? 'bg-gray-100 font-medium'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveFolderId(folder.id)}
                      >
                        <span className="text-sm text-gray-900 truncate flex-1">
                          {folder.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                          title="Удалить папку"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Folder Button */}
              {isCreatingFolder ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder();
                      } else if (e.key === 'Escape') {
                        setIsCreatingFolder(false);
                        setNewFolderName("");
                      }
                    }}
                    placeholder="Название папки"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateFolder}
                      className="flex-1 px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-gray-800"
                    >
                      Создать
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName("");
                      }}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  + Новая папка
                </button>
              )}
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeFolderId ? (
                <>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">
                      {activeFolder?.name || 'Папка'}
                    </h2>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileUpload}
                        disabled={isUploading || !activeFolderId}
                        className="hidden"
                        multiple={true}
                        accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.doc,.docx,.txt,.zip,.rar"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                          isUploading || !activeFolderId
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        {isUploading ? 'Загрузка...' : 'Загрузить файлы'}
                      </label>
                      {selectedFileNames.length > 0 && (
                        <button
                          onClick={handleBulkDelete}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить выбранные ({selectedFileNames.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Files Table */}
                  <div className="flex-1 overflow-y-auto">
                    {sortedFiles.length === 0 ? (
                      <div className="text-gray-500 py-12 text-center">
                        Файлы не загружены
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-12">
                              <input
                                type="checkbox"
                                checked={selectedFileNames.length === sortedFiles.length && sortedFiles.length > 0}
                                onChange={toggleAllFilesSelection}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-12">
                              {/* Icon column header */}
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Имя
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Дата
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Размер
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-24">
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedFiles.map((file) => {
                            const displayFileName = formatFileName(file.name);
                            const isImage = displayFileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
                            const fileUrl = getFileUrl(file.name);
                            const isSelected = selectedFileNames.includes(file.name);
                            const fileSize = file.metadata?.size 
                              ? `${(file.metadata.size / 1024).toFixed(1)} KB`
                              : '-';

                            return (
                              <tr
                                key={file.name}
                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                                  isSelected ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => toggleFileSelection(file.name)}
                              >
                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleFileSelection(file.name)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  {isImage ? (
                                    <ImageIcon className="w-5 h-5 text-blue-500" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-gray-500" />
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sm font-medium text-gray-900 hover:text-blue-600"
                                  >
                                    {displayFileName}
                                  </a>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {file.created_at 
                                    ? new Date(file.created_at).toLocaleDateString('ru-RU')
                                    : '-'}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {fileSize}
                                </td>
                                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-2">
                                    <a
                                      href={fileUrl}
                                      download={displayFileName}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Скачать"
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                    <button
                                      onClick={() => handleDeleteFile(file.name)}
                                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Удалить"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  {folders.length === 0 
                    ? 'Создайте папку для начала работы'
                    : 'Выберите папку'}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <span>←</span>
            <span>Назад к списку</span>
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Настройки
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 py-12 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-black mb-2">
          {project.title || "Проект без названия"}
        </h1>
        <p className="text-xl text-gray-600">
          Клиент: {project.client_name || project.client || "Не указан"}
        </p>
      </section>

      {/* Tabs */}
      <div className="px-8 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-4 py-4 transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-black font-medium text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Сводка
          </button>
          <button
            onClick={() => handleTabChange('rooms')}
            className={`px-4 py-4 transition-colors ${
              activeTab === 'rooms'
                ? 'border-b-2 border-black font-medium text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Комнаты
          </button>
          <button
            onClick={() => handleTabChange('estimates')}
            className={`px-4 py-4 transition-colors ${
              activeTab === 'estimates'
                ? 'border-b-2 border-black font-medium text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Смета
          </button>
          <button
            onClick={() => handleTabChange('files')}
            className={`px-4 py-4 transition-colors ${
              activeTab === 'files'
                ? 'border-b-2 border-black font-medium text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Файлы
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-12">
        {renderTabContent()}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Настройки проекта</h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Название проекта"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Клиент
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) =>
                    setFormData({ ...formData, client: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Имя клиента"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <input
                  type="text"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Статус проекта"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Удалить проект
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingItemId ? "Редактировать товар" : "Добавить товар"}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Наименование <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItemData.name}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Название товара"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка на товар
                </label>
                <input
                  type="text"
                  value={newItemData.link}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, link: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка на изображение
                </label>
                <input
                  type="text"
                  value={newItemData.image_url}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Нажмите правой кнопкой на фото на сайте → Копировать URL картинки
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Поставщик
                </label>
                <input
                  type="text"
                  value={newItemData.vendor}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, vendor: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Название поставщика"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена (₽)
                  </label>
                  <input
                    type="number"
                    value={newItemData.price}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество
                  </label>
                  <input
                    type="number"
                    value={newItemData.quantity}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, quantity: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Размеры
                  </label>
                  <input
                    type="text"
                    value={newItemData.dimensions}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, dimensions: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Например: 120x80x40 см"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Материал
                  </label>
                  <input
                    type="text"
                    value={newItemData.material}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, material: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Например: Дуб, МДФ"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsItemModalOpen(false);
                  setActiveRoomId(null);
                  setEditingItemId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

