import { useEffect, useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('categories').insert({ name: newName.trim() });
    if (error) {
      toast.error(error.message.includes('unique') ? 'Category already exists' : 'Failed to add category');
    } else {
      toast.success('Category added!');
      setNewName('');
      fetchCategories();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Category deleted');
    setDeleteConfirm(null);
    fetchCategories();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Categories & Tags</h1>

      {/* Add New */}
      <div className="admin-card">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-dh-purple" /> Add Category
        </h2>
        <div className="flex gap-3">
          <input
            className="dh-input flex-1"
            placeholder="Category name (e.g. Dresses, Tops, Accessories)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="dh-btn-primary flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="admin-card">
        <h2 className="font-bold text-gray-900 mb-4">All Categories ({categories.length})</h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-2 text-gray-200" />
            <p>No categories yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-dh-purple" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-400">ID: {cat.id.slice(0, 8)}</p>
                  </div>
                </div>

                {deleteConfirm === cat.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium">Delete?</span>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-200">No</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600">Yes</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(cat.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-sm text-blue-700 font-medium">💡 Tags are added directly on products.</p>
        <p className="text-xs text-blue-500 mt-1">Go to Products → Edit product → Add tags in the tag field to categorize your items further.</p>
      </div>
    </div>
  );
}
