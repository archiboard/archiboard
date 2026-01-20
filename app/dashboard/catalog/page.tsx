'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Plus, Search, Image as ImageIcon, X, Pencil, ExternalLink, UploadCloud, Trash2 } from 'lucide-react';

type CatalogItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  supplier: string;
  material: string;
  dimensions: string;
  brand: string;
  link: string;
};

const CATEGORIES = ['All', 'Furniture', 'Lighting', 'Plumbing', 'Finishes', 'Decor', 'Appliances'];

// --- Helpers ---
const sanitizeFileName = (text: string): string => {
  return text.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');
};

export default function CatalogPage() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [viewingItem, setViewingItem] = useState<CatalogItem | null>(null);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    supplier: '',
    image_url: '',
    material: '',
    dimensions: '',
    brand: '',
    link: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, searchQuery]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from('catalog_items').select('*').order('name');
      if (error) {
        console.error('Error fetching catalog items:', error);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
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
        setFormData({ ...formData, image_url: urlData.publicUrl });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
      setSelectedFileName('');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      supplier: '',
      image_url: '',
      material: '',
      dimensions: '',
      brand: '',
      link: ''
    });
    setEditingItem(null);
    setSelectedFileName('');
    setIsUploadingImage(false);
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim()) {
      alert('Item name is required');
      return;
    }

    if (editingItem) {
      // Update existing item
      const { data, error } = await supabase
        .from('catalog_items')
        .update({
          name: formData.name,
          description: formData.description || '',
          price: formData.price || 0,
          category: formData.category || '',
          supplier: formData.supplier || '',
          image_url: formData.image_url || '',
          material: formData.material || '',
          dimensions: formData.dimensions || '',
          brand: formData.brand || '',
          link: formData.link || ''
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
        setIsFormOpen(false);
        resetForm();
      }
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from('catalog_items')
        .insert({
          name: formData.name,
          description: formData.description || '',
          price: formData.price || 0,
          category: formData.category || '',
          supplier: formData.supplier || '',
          image_url: formData.image_url || '',
          material: formData.material || '',
          dimensions: formData.dimensions || '',
          brand: formData.brand || '',
          link: formData.link || ''
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
        setIsFormOpen(false);
        resetForm();
      }
    }
  };

  const handleEditClick = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      category: item.category || '',
      supplier: item.supplier || '',
      image_url: item.image_url || '',
      material: item.material || '',
      dimensions: item.dimensions || '',
      brand: item.brand || '',
      link: item.link || ''
    });
    setSelectedFileName('');
    setIsFormOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Delete this item from catalog?')) return;
    
    try {
      const { error } = await supabase.from('catalog_items').delete().eq('id', id);
      if (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item: ' + error.message);
      } else {
        setItems(items.filter(i => i.id !== id));
        if (viewingItem?.id === id) setViewingItem(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const renderFormModal = () => {
    if (!isFormOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <button
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="relative w-full h-64 bg-white rounded-xl border border-gray-200 mb-4 flex items-center justify-center overflow-hidden">
                {formData.image_url || editingItem?.image_url ? (
                  <img 
                    src={formData.image_url || editingItem?.image_url} 
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
              
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="catalog-image-upload"
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
                    htmlFor="catalog-image-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors ${
                      isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <UploadCloud size={18} />
                    <span className="font-medium">
                      {isUploadingImage 
                        ? 'Uploading...' 
                        : (editingItem && formData.image_url) ? 'Change Image' : 'Choose Image'}
                    </span>
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedFileName || (editingItem?.image_url && !formData.image_url ? 'Current image' : 'No file selected')}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Item name"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {CATEGORIES.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand & Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brand name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website Link
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Item description"
                rows={3}
              />
            </div>

            {/* Material & Dimensions Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Material"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 100x50x30 cm"
                />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Supplier name"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveItem}
              disabled={isUploadingImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? 'Uploading...' : (editingItem ? 'Update Item' : 'Save Item')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsModal = () => {
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
                  {viewingItem.category && (
                    <span className="inline-block mt-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                      {viewingItem.category}
                    </span>
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

                  {viewingItem.supplier && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Supplier</p>
                      <p className="text-gray-700">{viewingItem.supplier}</p>
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t">
            <button
              onClick={() => {
                handleDeleteItem(viewingItem.id);
                setViewingItem(null);
              }}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
            <div className="flex items-center gap-3">
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
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold">Catalog</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-lg transition-shadow relative group cursor-pointer"
            onClick={() => setViewingItem(item)}
          >
            {/* Edit Button Overlay */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(item);
              }}
              className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
            >
              <Pencil size={18} className="text-gray-600" />
            </button>

            {/* Image */}
            <div className="w-full h-48 bg-white rounded-lg mb-4 border border-gray-200 flex items-center justify-center overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <ImageIcon size={48} className="text-gray-300" />
              )}
            </div>

            {/* Content */}
            <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center justify-between mt-4">
              <div className="text-xl font-bold text-green-600">${item.price.toLocaleString()}</div>
              {item.brand && (
                <div className="text-xs text-gray-500">{item.brand}</div>
              )}
            </div>
            {item.category && (
              <div className="mt-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {item.category}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl">
          {searchQuery || selectedCategory !== 'All'
            ? 'No items found matching your criteria'
            : 'No items in catalog yet'}
        </div>
      )}

      {/* Modals */}
      {renderFormModal()}
      {renderDetailsModal()}
    </div>
  );
}
