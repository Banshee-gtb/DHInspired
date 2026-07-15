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
      toast.error(error.message.includes('unique') ? 'Category already exists' : 'Failed to add');
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
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">CATEGORIES</h1>
        <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{categories.length} categories</p>
      </div>

      {/* Add New */}
      <div className="admin-card">
        <h2 className="font-black text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-400" /> Add Category
        </h2>
        <div className="flex gap-3">
          <input
            className="dh-input-dark flex-1"
            placeholder="Category name (e.g. Hoodies, Tops)"
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
        <h2 className="font-black text-white text-sm uppercase tracking-widest mb-4">All Categories ({categories.length})</h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton-dark rounded-xl" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <Tag className="w-10 h-10 mx-auto mb-2 text-navy-700" />
            <p className="text-sm uppercase tracking-widest font-bold">No categories yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-navy-900/50 rounded-2xl hover:bg-navy-900 border border-navy-700/30 hover:border-navy-600/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/15 rounded-xl flex items-center justify-center">
                    <Tag className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">{cat.name}</p>
                    <p className="text-[10px] text-gray-600 font-mono">#{cat.id.slice(0, 8)}</p>
                  </div>
                </div>

                {deleteConfirm === cat.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 font-bold">Delete?</span>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10">No</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold">Yes</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(cat.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-sm text-blue-400 font-bold">💡 Tags are added directly on products.</p>
        <p className="text-xs text-blue-500/70 mt-1">Go to Products → Edit product → Add tags in the tag field.</p>
      </div>
    </div>
  );
}
