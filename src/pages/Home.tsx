import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronRight, Zap, Shield, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/features/ProductCard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import heroImage from '@/assets/hero.jpg';
import hero2 from '@/assets/hero2.jpg';
import hero3 from '@/assets/hero3.jpg';

const BRANDS = ['STREETWEAR', 'UNISEX', 'QUALITY FITS', 'URBAN STYLE', 'TRENDING', 'EXCLUSIVES'];

const HERO_SLIDES = [
  { image: heroImage, headline: 'DRESS\nDIFFERENT.', sub: 'New drops — unisex fits for every vibe.' },
  { image: hero2, headline: 'WEAR\nBOLD.', sub: 'Premium streetwear, no gatekeeping.' },
  { image: hero3, headline: 'STAY\nFRESH.', sub: 'Clean fits. Fresh styles. Every season.' },
];

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5000);
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO SLIDESHOW ─────────────────────────── */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {/* Slide images */}
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={slide.image}
              alt={`Hero slide ${i + 1}`}
              className="w-full h-full object-cover object-center"
              style={{ transform: i === heroIndex ? 'scale(1.03)' : 'scale(1)', transition: 'transform 5s ease-out' }}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-navy-950/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950/70 to-transparent" />
            <div className="absolute inset-0 bg-grid opacity-20" />
          </div>
        ))}

        {/* Scanline */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent"
            style={{ animation: 'scanline 8s linear infinite' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-32 w-full">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 glass px-3 py-1.5 text-xs font-black text-blue-300 tracking-[0.2em] uppercase mb-6 animate-fade-in">
              <Zap className="w-3 h-3 fill-current text-blue-400" />
              New Drops Available
            </div>

            {/* Animated headline */}
            <div className="mb-6 animate-slide-up" key={heroIndex}>
              <h1 className="font-display text-[clamp(4rem,12vw,9rem)] text-white leading-none tracking-wider whitespace-pre-line">
                {HERO_SLIDES[heroIndex].headline}
              </h1>
            </div>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-md animate-fade-in">
              {HERO_SLIDES[heroIndex].sub}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Link to="/products" className="dh-btn-primary inline-flex items-center justify-center gap-2 py-4 px-8">
                <ShoppingBag className="w-4 h-4" />
                SHOP NOW
              </Link>
              <Link to="/products" className="dh-btn-outline-white inline-flex items-center justify-center gap-2 py-4 px-8">
                EXPLORE ALL
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Slide dots */}
          <div className="flex gap-2 mt-10">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === heroIndex ? 'bg-blue-500 w-8 h-2' : 'bg-white/30 hover:bg-white/50 w-2 h-2'
                }`}
              />
            ))}
          </div>

          {/* Stats glass cards */}
          <div className="flex gap-4 mt-8">
            {[
              { label: 'Products', value: '100+' },
              { label: 'Unisex Styles', value: '✓' },
              { label: 'Fast Delivery', value: '✓' },
            ].map((s) => (
              <div key={s.label} className="glass px-4 py-3">
                <p className="text-white font-black text-lg">{s.value}</p>
                <p className="text-gray-400 text-[10px] tracking-widest uppercase font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────── */}
      <div className="bg-blue-600 py-3 overflow-hidden">
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="text-xs font-black tracking-[0.3em] text-white uppercase">
              {b} <span className="text-blue-300 mx-4">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ─────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50 relative">
          <div className="absolute inset-0 bg-grid-light" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="section-tag">Browse</span>
                <h2 className="font-display text-4xl sm:text-5xl text-navy-950 tracking-wider">CATEGORIES</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="group glass-card bg-white hover:bg-blue-50 hover:border-blue-200 flex items-center justify-between px-5 py-4 transition-all duration-200 hover:shadow-md hover:shadow-blue-100/50"
                >
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700 tracking-wide uppercase transition-colors">
                    {cat.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
              <Link
                to="/products"
                className="group flex items-center justify-between bg-blue-600 hover:bg-blue-500 rounded-2xl px-5 py-4 transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                <span className="text-sm font-bold text-white tracking-wide uppercase">View All</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED ───────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-tag">Handpicked</span>
              <h2 className="font-display text-4xl sm:text-5xl text-navy-950 tracking-wider">NEW ARRIVALS</h2>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-2 text-xs font-black tracking-[0.2em] text-gray-400 hover:text-blue-600 uppercase transition-colors"
            >
              SEE ALL <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] skeleton" />
                  <div className="mt-3 space-y-2 px-1">
                    <div className="h-4 skeleton" />
                    <div className="h-4 skeleton w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl">
              <ShoppingBag className="w-14 h-14 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No featured items yet</p>
              <Link to="/products" className="inline-block mt-6 dh-btn-primary text-sm">BROWSE PRODUCTS</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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

      {/* ── FEATURES STRIP ─────────────────────────── */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Truck className="w-7 h-7 text-blue-600 mx-auto mb-3" />, title: 'Fast Delivery', desc: 'Same day & next day options available' },
              { icon: <Shield className="w-7 h-7 text-blue-600 mx-auto mb-3" />, title: 'Secure Checkout', desc: 'Bank transfer, no card required' },
              { icon: <Zap className="w-7 h-7 text-blue-600 mx-auto mb-3" />, title: 'WhatsApp Support', desc: 'Chat with us instantly after order' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                {f.icon}
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide mb-1">{f.title}</h3>
                <p className="text-gray-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────── */}
      <section className="py-24 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="section-tag-white">No account needed</span>
          <h2 className="font-display text-5xl sm:text-7xl text-white tracking-wider mb-6">
            CHECKOUT<br />IN MINUTES
          </h2>
          <p className="text-gray-400 text-base mb-8 max-w-sm mx-auto">
            Guest checkout, bank transfer, WhatsApp confirmation. Simple as that.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-black text-sm px-10 py-4 rounded-2xl tracking-widest uppercase hover:bg-blue-500 transition-colors shadow-xl shadow-blue-900/30"
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
