import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';
import ProductCard from '@/components/features/ProductCard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
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
      .select('*, product_variants(*)', { count: 'exact' })
      .eq('is_active', true);

    if (debouncedSearch) {
      query = query.ilike('title', `%${debouncedSearch}%`);
    }
    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }
    if (selectedTags.length > 0) {
      query = query.overlaps('tags', selectedTags);
    }

    if (sortBy === 'newest') {
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'price_asc') {
      query = query.order('base_price', { ascending: true });
    } else {
      query = query.order('base_price', { ascending: false });
    }

    const { data, count } = await query;
    if (data) {
      let filtered = data as Product[];

      // Price filter
      filtered = filtered.filter((p) => {
        const price = p.has_variants && p.product_variants?.length
          ? Math.min(...p.product_variants.map((v) => v.price))
          : p.base_price;
        return price >= priceRange[0] && price <= priceRange[1];
      });

      // In-stock filter
      if (inStockOnly) {
        filtered = filtered.filter((p) => {
          if (p.has_variants) return p.product_variants?.some((v) => v.stock > 0);
          return true;
        });
      }

      // Collect all tags
      const tags = new Set<string>();
      data.forEach((p: Product) => p.tags?.forEach((t) => tags.add(t)));
      setAllTags(Array.from(tags).sort());

      setProducts(filtered);
      setTotalCount(count ?? filtered.length);
    }
    setLoading(false);
  }, [debouncedSearch, selectedCategory, selectedTags, sortBy, priceRange, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTags([]);
    setSortBy('newest');
    setPriceRange([0, 100000]);
    setInStockOnly(false);
  };

  const hasFilters = search || selectedCategory || selectedTags.length > 0 || inStockOnly;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-dh-hero py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl font-bold text-white mb-2">All Products</h1>
            <p className="text-purple-200">Explore the full DH-Inspired collection</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search & Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dh-input pl-12"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="dh-input pr-10 appearance-none cursor-pointer text-sm py-3"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border transition-all ${
                  showFilters || hasFilters
                    ? 'bg-dh-purple text-white border-dh-purple'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-dh-purple hover:text-dh-purple'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasFilters && (
                  <span className="bg-white text-dh-purple rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                    !
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-purple-100 p-5 mb-6 animate-fade-in space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600 font-medium">
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Category */}
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

                {/* Price Range */}
                <div>
                  <label className="dh-label">Max Price: ₦{priceRange[1].toLocaleString()}</label>
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={500}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    style={{ '--range-progress': `${(priceRange[1] / 100000) * 100}%` } as React.CSSProperties}
                    className="w-full mt-2"
                  />
                </div>

                {/* In Stock */}
                <div>
                  <label className="dh-label">Availability</label>
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      inStockOnly
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${inStockOnly ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {inStockOnly && <span className="text-white text-xs">✓</span>}
                    </div>
                    In Stock Only
                  </button>
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <label className="dh-label">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-dh-purple text-white border-dh-purple'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-dh-purple hover:text-dh-purple'
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

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 text-sm">
              {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </p>
            {selectedCategory && (
              <span className="text-xs bg-purple-100 text-dh-purple font-medium px-3 py-1 rounded-full">
                {categories.find((c) => c.id === selectedCategory)?.name}
              </span>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 skeleton rounded" />
                    <div className="h-4 skeleton rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4 text-purple-100" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="mt-6 dh-btn-outline">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
