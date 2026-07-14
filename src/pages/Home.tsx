import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/features/ProductCard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import heroImage from '@/assets/hero.jpg';

const BRANDS = ['STREETWEAR', 'UNISEX', 'QUALITY FITS', 'URBAN STYLE', 'TRENDING', 'EXCLUSIVES'];

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  const HERO_PHRASES = ['DRESS\nDIFFERENT.', 'WEAR\nBOLD.', 'STAY\nFRESH.'];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_PHRASES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([
      supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('categories').select('*').order('name'),
    ]).then(([pRes, cRes]) => {
      if (pRes.data) setFeatured(pRes.data);
      if (cRes.data) setCategories(cRes.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="DH-Inspired Hero"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/80 to-transparent" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid opacity-30" />
        </div>

        {/* Animated scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
            style={{ animation: 'scanline 8s linear infinite' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-32 w-full">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 border border-blue-500/40 bg-blue-500/10 text-blue-400 text-xs font-black px-3 py-1.5 tracking-[0.2em] uppercase mb-6 animate-fade-in">
              <Zap className="w-3 h-3 fill-current" />
              New Drops Available
            </div>

            {/* Heading with animation */}
            <div className="mb-6 animate-slide-up" key={heroIndex}>
              <h1 className="font-display text-[clamp(4rem,12vw,9rem)] text-white leading-none tracking-wider whitespace-pre-line">
                {HERO_PHRASES[heroIndex]}
              </h1>
            </div>

            <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-md animate-fade-in">
              Unisex streetwear & fashion trends. No gatekeeping — just clean fits for everyone who knows their style.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Link
                to="/products"
                className="dh-btn-primary inline-flex items-center justify-center gap-2 text-sm py-4 px-8"
              >
                <ShoppingBag className="w-4 h-4" />
                SHOP NOW
              </Link>
              <Link
                to="/products"
                className="dh-btn-outline inline-flex items-center justify-center gap-2 py-4 px-8"
              >
                EXPLORE ALL
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-14 border-t border-white/10 pt-8">
            {[
              { label: 'Products', value: '100+' },
              { label: 'Unisex Styles', value: '✓' },
              { label: 'Fast Delivery', value: '✓' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-white font-black text-xl">{s.value}</p>
                <p className="text-gray-500 text-xs tracking-widest uppercase font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand ticker */}
      <div className="bg-blue-600 py-3 overflow-hidden">
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="text-xs font-black tracking-[0.3em] text-white uppercase">
              {b} <span className="text-blue-300 mx-4">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-navy-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="section-tag">Browse</span>
                <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider">CATEGORIES</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="group flex items-center justify-between bg-navy-800 border border-navy-700 hover:border-blue-500/60 px-5 py-4 transition-all duration-200 hover:bg-navy-700"
                >
                  <span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-wide uppercase transition-colors">
                    {cat.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                </Link>
              ))}
              <Link
                to="/products"
                className="group flex items-center justify-between bg-blue-600 hover:bg-blue-500 border border-blue-500 px-5 py-4 transition-all duration-200"
              >
                <span className="text-sm font-bold text-white tracking-wide uppercase">View All</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-tag">Handpicked</span>
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider">
                NEW ARRIVALS
              </h2>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-2 text-xs font-black tracking-[0.2em] text-gray-400 hover:text-blue-400 uppercase transition-colors"
            >
              SEE ALL <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] skeleton" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 skeleton" />
                    <div className="h-4 skeleton w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-navy-700" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No featured items yet</p>
              <Link to="/products" className="inline-block mt-6 dh-btn-primary text-sm">
                BROWSE PRODUCTS
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/products" className="dh-btn-outline inline-flex items-center gap-2">
              SHOP ALL PRODUCTS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-blue-200 text-xs font-black tracking-[0.3em] uppercase mb-4 block">
            No account needed
          </span>
          <h2 className="font-display text-5xl sm:text-7xl text-white tracking-wider mb-6">
            CHECKOUT<br />IN MINUTES
          </h2>
          <p className="text-blue-100 text-base mb-8">
            Guest checkout, bank transfer, WhatsApp confirmation. Simple.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-navy-950 font-black text-sm px-10 py-4 tracking-widest uppercase hover:bg-blue-50 transition-colors"
          >
            START SHOPPING <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
