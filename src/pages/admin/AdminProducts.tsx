import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Star, ChevronDown, ChevronUp, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Category, ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import ImageUploader from '@/components/features/ImageUploader';
import { toast } from 'sonner';

const emptyProduct = {
  title: '',
  description: '',
  is_active: true,
  is_featured: false,
  images: [] as string[],
  base_price: 0,
  has_variants: false,
  tags: [] as string[],
  category_id: null as string | null,
};

const emptyVariant = { color: '', size: '', price: 0, stock: 0 };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, product_variants(*), category:categories(*)').order('created_at', { ascending: false });
    if (search) query = query.ilike('title', `%${search}%`);
    const { data } = await query;
    if (data) setProducts(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const openCreate = () => {
    setEditProduct(null);
    setForm(emptyProduct);
    setVariants([]);
    setTagInput('');
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      title: p.title,
      description: p.description ?? '',
      is_active: p.is_active,
      is_featured: p.is_featured,
      images: p.images ?? [],
      base_price: p.base_price,
      has_variants: p.has_variants,
      tags: p.tags ?? [],
      category_id: p.category_id,
    });
    setVariants(p.product_variants ?? []);
    setTagInput('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeaturedToggle = async (product: Product) => {
    const newVal = !product.is_featured;
    if (newVal) {
      const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_featured', true);
      if ((count ?? 0) >= 6) {
        const { data: oldest } = await supabase.from('products').select('id').eq('is_featured', true).order('created_at', { ascending: true }).limit(1);
        if (oldest?.[0]) {
          await supabase.from('products').update({ is_featured: false }).eq('id', oldest[0].id);
        }
      }
    }
    await supabase.from('products').update({ is_featured: newVal }).eq('id', product.id);
    toast.success(newVal ? 'Marked as featured (New Arrival)' : 'Removed from featured');
    fetchProducts();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const addVariant = () => setVariants((v) => [...v, { ...emptyVariant }]);
  const removeVariant = (i: number) => setVariants((v) => v.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, key: string, val: string | number) => {
    setVariants((v) => v.map((variant, idx) => idx === i ? { ...variant, [key]: val } : variant));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Product title is required'); return; }
    setSaving(true);

    const productData = {
      title: form.title.trim(),
      description: form.description,
      is_active: form.is_active,
      is_featured: form.is_featured,
      images: form.images,
      base_price: form.has_variants ? 0 : form.base_price,
      has_variants: form.has_variants,
      tags: form.tags,
      category_id: form.category_id || null,
    };

    let productId = editProduct?.id;

    if (editProduct) {
      await supabase.from('products').update(productData).eq('id', editProduct.id);
    } else {
      const { data } = await supabase.from('products').insert(productData).select().single();
      if (data) productId = data.id;
    }

    if (productId && form.has_variants) {
      const existingIds = editProduct?.product_variants?.map((v) => v.id) ?? [];
      const newVariants = variants.filter((v) => !v.id);
      const updatedVariants = variants.filter((v) => v.id);
      const deletedIds = existingIds.filter((id) => !updatedVariants.some((v) => v.id === id));

      if (deletedIds.length) await supabase.from('product_variants').delete().in('id', deletedIds);
      for (const v of updatedVariants) {
        await supabase.from('product_variants').update({ color: v.color, size: v.size, price: v.price, stock: v.stock }).eq('id', v.id!);
      }
      if (newVariants.length) {
        await supabase.from('product_variants').insert(newVariants.map((v) => ({ product_id: productId, color: v.color, size: v.size, price: v.price ?? 0, stock: v.stock ?? 0 })));
      }
    }

    setSaving(false);
    setShowForm(false);
    toast.success(editProduct ? 'Product updated!' : 'Product created!');
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setDeleteConfirm(null);
    toast.success('Product deleted');
    fetchProducts();
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openCreate} className="dh-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="admin-card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 text-xl">{editProduct ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-4">
              <div>
                <label className="dh-label">Product Title *</label>
                <input className="dh-input" placeholder="e.g. Elegant Floral Dress" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label className="dh-label">Description</label>
                <textarea className="dh-input resize-none" rows={3} placeholder="Describe the product..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div>
                <label className="dh-label">Category</label>
                <select className="dh-input" value={form.category_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value || null }))}>
                  <option value="">No Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="dh-label">Tags</label>
                <div className="flex gap-2">
                  <input
                    className="dh-input flex-1"
                    placeholder="Add tag, press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <button onClick={addTag} type="button" className="px-4 py-3 bg-purple-100 text-dh-purple rounded-xl font-medium hover:bg-purple-200 transition-colors text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 bg-purple-100 text-dh-purple text-xs px-3 py-1 rounded-full font-medium">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-dh-purple-dark"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Active', key: 'is_active' },
                  { label: 'Has Variants', key: 'has_variants' },
                  { label: '⭐ Featured', key: 'is_featured' },
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors">
                    <div
                      onClick={() => setForm((f) => ({ ...f, [toggle.key]: !f[toggle.key as keyof typeof f] }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${form[toggle.key as keyof typeof form] ? 'bg-dh-purple' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[toggle.key as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{toggle.label}</span>
                  </label>
                ))}
              </div>

              {!form.has_variants && (
                <div>
                  <label className="dh-label">Base Price (₦)</label>
                  <input type="number" min="0" className="dh-input" placeholder="0.00" value={form.base_price} onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))} />
                </div>
              )}
            </div>

            {/* Right */}
            <div className="space-y-4">
              <div>
                <label className="dh-label">Product Images (Upload from file only)</label>
                <ImageUploader images={form.images} onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))} />
              </div>
            </div>
          </div>

          {/* Variants */}
          {form.has_variants && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Variants</h3>
                <button onClick={addVariant} type="button" className="flex items-center gap-1 text-sm text-dh-purple font-medium hover:text-dh-purple-dark">
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end bg-purple-50 p-3 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Color</label>
                      <input className="dh-input text-sm py-2" placeholder="e.g. Red" value={v.color ?? ''} onChange={(e) => updateVariant(i, 'color', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Size</label>
                      <input className="dh-input text-sm py-2" placeholder="e.g. M" value={v.size ?? ''} onChange={(e) => updateVariant(i, 'size', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Price (₦)</label>
                      <input type="number" min="0" className="dh-input text-sm py-2" placeholder="0" value={v.price ?? ''} onChange={(e) => updateVariant(i, 'price', Number(e.target.value))} />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 font-medium">Stock</label>
                        <input type="number" min="0" className="dh-input text-sm py-2" placeholder="0" value={v.stock ?? ''} onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))} />
                      </div>
                      <button onClick={() => removeVariant(i)} className="mt-auto p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {variants.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No variants yet. Click "Add Variant" to start.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            <button onClick={handleSave} disabled={saving} className="dh-btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <button onClick={() => setShowForm(false)} className="dh-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input className="dh-input pl-12" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="admin-card h-20 skeleton" />)
        ) : products.length === 0 ? (
          <div className="admin-card text-center py-12 text-gray-400">
            <p>No products found.</p>
          </div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="admin-card">
              <div className="flex gap-4 items-start">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-purple-50 rounded-xl flex-shrink-0 flex items-center justify-center text-purple-200">
                    <Search className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate">{p.title}</h3>
                    {p.is_featured && <span className="featured-badge"><Star className="w-3 h-3 fill-current" />Featured</span>}
                    {!p.is_active && <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">Inactive</span>}
                    {p.has_variants && <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">{p.product_variants?.length ?? 0} variants</span>}
                  </div>
                  <p className="text-sm text-dh-purple font-bold mt-0.5">
                    {p.has_variants && p.product_variants?.length ? `From ${formatPrice(Math.min(...p.product_variants.map((v) => v.price)))}` : formatPrice(p.base_price)}
                  </p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.tags.map((t) => <span key={t} className="text-xs bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full">#{t}</span>)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleFeaturedToggle(p)} title={p.is_featured ? 'Remove from featured' : 'Mark as featured'} className={`p-2 rounded-lg transition-colors ${p.is_featured ? 'text-dh-gold bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-dh-gold hover:bg-yellow-50'}`}>
                    <Star className={`w-4 h-4 ${p.is_featured ? 'fill-current' : ''}`} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-dh-purple hover:bg-purple-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Variants */}
              {expandedId === p.id && p.product_variants && p.product_variants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">VARIANTS</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {p.product_variants.map((v) => (
                      <div key={v.id} className="bg-purple-50 rounded-lg p-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">{[v.color, v.size].filter(Boolean).join(' / ') || 'Default'}</span>
                          <span className={`font-semibold ${v.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{v.stock} stock</span>
                        </div>
                        <p className="text-dh-purple font-bold mt-0.5">{formatPrice(v.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Confirm */}
              {deleteConfirm === p.id && (
                <div className="mt-3 p-4 bg-red-50 rounded-xl flex items-center justify-between gap-3">
                  <p className="text-sm text-red-700 font-medium">Delete "{p.title}"? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="text-sm px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button onClick={() => handleDelete(p.id)} className="text-sm px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
