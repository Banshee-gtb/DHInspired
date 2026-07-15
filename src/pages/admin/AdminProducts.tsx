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
    toast.success(newVal ? 'Marked as featured' : 'Removed from featured');
    fetchProducts();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
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
        await supabase.from('product_variants').insert(newVariants.map((v) => ({
          product_id: productId, color: v.color, size: v.size, price: v.price ?? 0, stock: v.stock ?? 0,
        })));
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

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div onClick={onChange} className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 relative ${value ? 'bg-blue-600' : 'bg-navy-600'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">PRODUCTS</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{products.length} total</p>
        </div>
        <button onClick={openCreate} className="dh-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="admin-card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-white text-lg tracking-wide uppercase">{editProduct ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-4">
              <div>
                <label className="dh-label-dark">Product Title *</label>
                <input className="dh-input-dark" placeholder="e.g. Classic Hoodie" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label className="dh-label-dark">Description</label>
                <textarea className="dh-input-dark resize-none" rows={3} placeholder="Describe the product..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div>
                <label className="dh-label-dark">Category</label>
                <select className="dh-input-dark" value={form.category_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value || null }))}>
                  <option value="">No Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="dh-label-dark">Tags</label>
                <div className="flex gap-2">
                  <input
                    className="dh-input-dark flex-1"
                    placeholder="Add tag, press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <button onClick={addTag} type="button" className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors text-sm">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 bg-blue-500/15 text-blue-400 text-xs px-3 py-1.5 rounded-full font-bold">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Active (visible to customers)', key: 'is_active' },
                  { label: 'Has Variants (color/size)', key: 'has_variants' },
                  { label: '⭐ Featured (homepage)', key: 'is_featured' },
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-xl cursor-pointer hover:bg-navy-900 transition-colors">
                    <span className="text-sm font-medium text-gray-300">{toggle.label}</span>
                    <Toggle
                      value={!!form[toggle.key as keyof typeof form]}
                      onChange={() => setForm((f) => ({ ...f, [toggle.key]: !f[toggle.key as keyof typeof f] }))}
                    />
                  </label>
                ))}
              </div>

              {!form.has_variants && (
                <div>
                  <label className="dh-label-dark">Base Price (₦)</label>
                  <input type="number" min="0" className="dh-input-dark" placeholder="0.00" value={form.base_price} onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))} />
                </div>
              )}
            </div>

            {/* Right */}
            <div>
              <label className="dh-label-dark">Product Images</label>
              <ImageUploader images={form.images} onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))} />
            </div>
          </div>

          {/* Variants */}
          {form.has_variants && (
            <div className="mt-6 pt-6 border-t border-navy-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white text-sm uppercase tracking-widest">Variants</h3>
                <button onClick={addVariant} type="button" className="flex items-center gap-1.5 text-sm text-blue-400 font-bold hover:text-blue-300">
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end bg-navy-900/60 p-3 rounded-xl">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Color</label>
                      <input className="dh-input-dark text-sm py-2 mt-1" placeholder="e.g. Red" value={v.color ?? ''} onChange={(e) => updateVariant(i, 'color', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Size</label>
                      <input className="dh-input-dark text-sm py-2 mt-1" placeholder="e.g. M" value={v.size ?? ''} onChange={(e) => updateVariant(i, 'size', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Price (₦)</label>
                      <input type="number" min="0" className="dh-input-dark text-sm py-2 mt-1" placeholder="0" value={v.price ?? ''} onChange={(e) => updateVariant(i, 'price', Number(e.target.value))} />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Stock</label>
                        <input type="number" min="0" className="dh-input-dark text-sm py-2 mt-1" placeholder="0" value={v.stock ?? ''} onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))} />
                      </div>
                      <button onClick={() => removeVariant(i)} className="mt-auto p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {variants.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-6 bg-navy-900/30 rounded-xl">Click "Add Variant" to start</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-6 border-t border-navy-700/50">
            <button onClick={handleSave} disabled={saving} className="dh-btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-3 border border-navy-600 text-gray-400 hover:text-white hover:border-navy-500 rounded-xl transition-all font-bold text-sm uppercase tracking-wider">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input className="dh-input-dark pl-11" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="admin-card h-20 skeleton-dark" />)
        ) : products.length === 0 ? (
          <div className="admin-card text-center py-12 text-gray-500">No products found.</div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="admin-card hover:border-navy-600/80 transition-colors">
              <div className="flex gap-4 items-start">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-navy-900 rounded-xl flex-shrink-0 flex items-center justify-center">
                    <Search className="w-5 h-5 text-navy-700" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <h3 className="font-black text-white text-sm truncate">{p.title}</h3>
                    {p.is_featured && <span className="featured-badge flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" />Featured</span>}
                    {!p.is_active && <span className="bg-gray-500/15 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Inactive</span>}
                    {p.has_variants && <span className="bg-blue-500/15 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{p.product_variants?.length ?? 0} variants</span>}
                  </div>
                  <p className="text-sm text-blue-400 font-black">
                    {p.has_variants && p.product_variants?.length ? `From ${formatPrice(Math.min(...p.product_variants.map((v) => v.price)))}` : formatPrice(p.base_price)}
                  </p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.tags.map((t) => <span key={t} className="text-[10px] bg-navy-900 text-gray-500 px-2 py-0.5 rounded-full">#{t}</span>)}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleFeaturedToggle(p)} className={`p-2 rounded-xl transition-colors ${p.is_featured ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20' : 'text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/10'}`}>
                    <Star className={`w-4 h-4 ${p.is_featured ? 'fill-current' : ''}`} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/10 transition-colors">
                    {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === p.id && p.product_variants && p.product_variants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-navy-700/50">
                  <p className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">Variants</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {p.product_variants.map((v) => (
                      <div key={v.id} className="bg-navy-900/60 rounded-xl p-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-300">{[v.color, v.size].filter(Boolean).join(' / ') || 'Default'}</span>
                          <span className={`font-bold text-[10px] ${v.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>{v.stock} stock</span>
                        </div>
                        <p className="text-blue-400 font-black mt-0.5">{formatPrice(v.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deleteConfirm === p.id && (
                <div className="mt-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-3">
                  <p className="text-sm text-red-400 font-medium">Delete "{p.title}"? Cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">Cancel</button>
                    <button onClick={() => handleDelete(p.id)} className="text-sm px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold">Delete</button>
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
