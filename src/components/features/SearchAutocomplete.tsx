import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  images: string[];
  base_price: number;
  has_variants: boolean;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchAutocomplete({ value, onChange, placeholder = 'Search products...', className = '' }: SearchAutocompleteProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedValue = useDebounce(value, 280);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    supabase
      .from('products')
      .select('id, title, images, base_price, has_variants')
      .eq('is_active', true)
      .ilike('title', `%${debouncedValue}%`)
      .limit(5)
      .then(({ data }) => {
        setResults(data ?? []);
        setOpen(true);
        setLoading(false);
      });
  }, [debouncedValue]);

  const handleSelect = (id: string) => {
    setOpen(false);
    navigate(`/products/${id}`);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="dh-input pl-12 pr-10"
          autoComplete="off"
        />
        {value && (
          <button
            onClick={() => { onChange(''); setResults([]); setOpen(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 z-50 overflow-hidden animate-fade-in">
          {loading ? (
            <div className="p-4 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">No products found for "{value}"</div>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    onMouseDown={() => handleSelect(r.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${i < results.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {r.images?.[0] ? (
                        <img src={r.images[0]} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">
                        {r.has_variants ? 'Multiple variants' : r.base_price > 0 ? `₦${r.base_price.toLocaleString()}` : 'Price on request'}
                      </p>
                    </div>
                    <Search className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  onMouseDown={() => setOpen(false)}
                  className="w-full px-4 py-2.5 text-xs text-center text-blue-600 font-bold hover:bg-blue-50 transition-colors border-t border-gray-100"
                >
                  See all results for "{value}" →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
