import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/features/ProductCard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import heroImage from '@/assets/hero.jpg';

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('is_featured', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (productsRes.data) setFeatured(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-dh-hero"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dh-purple-darker/90 via-dh-purple-darker/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dh-purple-darker/80 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-dh-gold" />
              New Collection Available
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Elevate<br />
              <span className="text-gradient-gold">Your Style.</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-8 max-w-lg">
              Discover curated fashion pieces that define elegance. From everyday wear to statement looks — DH-Inspired has you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-dh-purple hover:bg-dh-purple-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-dh-purple/30 hover:-translate-y-0.5 active:scale-95"
              >
                <ShoppingBag className="w-5 h-5" />
                Shop Now
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl border border-white/30 transition-all duration-300"
              >
                Browse All
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-purple-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-8 text-center">
              Shop by Category
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="px-6 py-3 bg-white rounded-2xl border border-purple-100 text-gray-700 font-medium hover:bg-dh-purple hover:text-white hover:border-dh-purple shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                to="/products"
                className="px-6 py-3 bg-dh-purple/10 text-dh-purple rounded-2xl border border-dh-purple/20 font-medium hover:bg-dh-purple hover:text-white transition-all duration-200"
              >
                View All →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                ✨ New Arrivals
              </h2>
              <p className="text-gray-500 mt-1">Handpicked by DH-Inspired</p>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-2 text-dh-purple font-semibold hover:gap-3 transition-all"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 skeleton rounded" />
                    <div className="h-4 skeleton rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-purple-100" />
              <p className="text-lg font-medium">No featured products yet</p>
              <p className="text-sm mt-1">Check back soon or browse all products</p>
              <Link to="/products" className="inline-block mt-6 dh-btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/products" className="dh-btn-outline inline-flex items-center gap-2">
              Shop All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-dh-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Your Style, Your Statement
          </h2>
          <p className="text-purple-200 text-lg mb-8">
            Checkout in minutes. No account needed — just pure, effortless shopping.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-dh-purple font-bold px-8 py-4 rounded-2xl hover:bg-purple-50 transition-all duration-200 hover:-translate-y-0.5 shadow-xl"
          >
            Start Shopping <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
