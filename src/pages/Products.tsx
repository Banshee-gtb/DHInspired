import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';
import ProductCard from '@/components/features/ProductCard';
import SearchAutocomplete from '@/components/features/SearchAutocomplete';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
];

export default function Products() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(100000);
  const [inStockOnly, setInStockOnly] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true);

    if (debouncedSearch) query = query.ilike('title', `%${debouncedSearch}%`);
    if (selectedCategory) query = query.eq('category_id', selectedCategory);
    if (selectedTags.length > 0) query = query.overlaps('tags', selectedTags);

    if (sortBy === 'newest') {
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'price_asc') {
      query = query.order('base_price', { ascending: true });
    } else {
      query = query.order('base_price', { ascending: false });
    }

    const { data } = await query;
    if (data) {
      let filtered = data as Product[];
      filtered = filtered.filter((p) => {
        const price = p.has_variants && p.product_variants?.length
          ? Math.min(...p.product_variants.map((v) => v.price))
          : p.base_price;
        return price <= maxPrice;
      });
      if (inStockOnly) {
        filtered = filtered.filter((p) =>
          p.has_variants ? p.product_variants?.some((v) => v.stock > 0) : true
        );
      }
      const tags = new Set<string>();
      data.forEach((p: Product) => p.tags?.forEach((t) => tags.add(t)));
      setAllTags(Array.from(tags).sort());
      setProducts(filtered);
    }
    setLoading(false);
  }, [debouncedSearch, selectedCategory, selectedTags, sortBy, maxPrice, inStockOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTags([]);
    setSortBy('newest');
    setMaxPrice(100000);
    setInStockOnly(false);
  };

  const hasFilters = !!(search || selectedCategory || selectedTags.length > 0 || inStockOnly || maxPrice < 100000);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16">
        {/* Header */}
        <div className="bg-navy-950 py-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <span className="section-tag-white">Collection</span>
            <h1 className="font-display text-6xl sm:text-7xl font-bold text-white tracking-wider">ALL PRODUCTS</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search & Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <SearchAutocomplete
              value={search}
              onChange={setSearch}
              placeholder="Search drops..."
              className="flex-1"
            />
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="dh-input pr-9 appearance-none cursor-pointer text-sm py-3"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 font-black text-xs tracking-widest uppercase rounded-xl border-2 transition-all ${
                  showFilters || hasFilters
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasFilters && <span className="bg-white text-blue-600 rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-black">!</span>}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="glass-card bg-white/80 p-5 mb-6 animate-fade-in space-y-5 border border-gray-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase">Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-bold uppercase tracking-wider">
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="dh-label">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="dh-input text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dh-label">Max Price: ₦{maxPrice.toLocaleString()}</label>
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={500}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ '--range-progress': `${(maxPrice / 100000) * 100}%` } as React.CSSProperties}
                    className="w-full mt-3"
                  />
                </div>

                <div>
                  <label className="dh-label">Availability</label>
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl border-2 transition-all ${
                      inStockOnly
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600'
                    }`}
                  >
                    <div className={`w-4 h-4 flex items-center justify-center rounded border-2 ${inStockOnly ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {inStockOnly && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                    In Stock Only
                  </button>
                </div>
              </div>

              {allTags.length > 0 && (
                <div>
                  <label className="dh-label">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-all uppercase tracking-wider ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 text-xs tracking-widest uppercase font-bold">
              {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] skeleton" />
                  <div className="mt-3 space-y-2 px-1">
                    <div className="h-3 skeleton" />
                    <div className="h-3 skeleton w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 rounded-3xl">
              <p className="font-display text-5xl text-gray-200 tracking-wider mb-4">NOTHING FOUND</p>
              <p className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-8">Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="dh-btn-outline text-sm">CLEAR FILTERS</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
