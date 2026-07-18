import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, Star, Tag, ArrowLeft, Plus, Minus, CheckCircle2,
  ChevronLeft, ChevronRight, ZoomIn, X, Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useProductLike } from '@/hooks/useProductLike';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import ProductReviews from '@/components/features/ProductReviews';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const { liked, likeCount, toggleLike } = useProductLike(id ?? '');

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('products')
      .select('*, product_variants(*), category:categories(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!product?.has_variants || !product.product_variants) return;
    const found = product.product_variants.find(
      (v) => (!selectedColor || v.color === selectedColor) && (!selectedSize || v.size === selectedSize)
    );
    setSelectedVariant(found ?? null);
  }, [selectedColor, selectedSize, product]);

  const images = product?.images?.length ? product.images : [];
  const colors = [...new Set(product?.product_variants?.map((v) => v.color).filter(Boolean))];
  const sizes = [...new Set(product?.product_variants?.map((v) => v.size).filter(Boolean))];

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : product?.has_variants && product?.product_variants?.length
    ? Math.min(...product.product_variants.map((v) => v.price))
    : product?.base_price ?? 0;

  const stockCount = selectedVariant ? selectedVariant.stock : null;
  const inStock = !product?.has_variants || (selectedVariant ? selectedVariant.stock > 0 : true);

  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? nextImage() : prevImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.has_variants && !selectedVariant) {
      toast.error('Please select color and size');
      return;
    }
    if (selectedVariant && selectedVariant.stock < quantity) {
      toast.error(`Only ${selectedVariant.stock} in stock`);
      return;
    }
    const variantInfo = selectedVariant
      ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(' / ')
      : '';
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      productTitle: product.title,
      variantInfo,
      price: displayPrice,
      quantity,
      image: images[0],
    });
    setAdded(true);
    toast.success('Added to cart!');
    setTimeout(() => setAdded(false), 2500);
  };

  /* LOADING */
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse" />
            <div className="space-y-5 pt-4">
              <div className="h-10 bg-gray-100 rounded-xl w-3/4 animate-pulse" />
              <div className="h-6 bg-gray-100 rounded-xl w-1/3 animate-pulse" />
              <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 pt-16">
          <p className="font-display text-4xl text-gray-300 tracking-wider">NOT FOUND</p>
          <Link to="/products" className="dh-btn-primary">Browse Products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* LIGHTBOX */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 z-10">
            <X className="w-8 h-8" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={images[currentImageIndex]}
            alt={product.title}
            className="max-h-[90vh] max-w-[90vw] object-contain animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/50 text-xs font-bold tracking-widest">
            {currentImageIndex + 1} / {images.length}
          </p>
        </div>
      )}

      <div className="pt-16 pb-28 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Breadcrumb */}
          <Link to="/products" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 text-sm font-semibold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* IMAGE GALLERY */}
            <div className="space-y-3">
              <div
                className="relative aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden cursor-zoom-in group"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onClick={() => images.length > 0 && setLightboxOpen(true)}
              >
                {images.length > 0 ? (
                  <img
                    src={images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ShoppingCart className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </div>

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.is_featured && (
                    <span className="featured-badge flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      New Arrival
                    </span>
                  )}
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white p-2 rounded-xl shadow-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white p-2 rounded-xl shadow-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                        className={`rounded-full transition-all duration-200 ${
                          i === currentImageIndex ? 'bg-blue-600 w-5 h-2' : 'bg-white/60 w-2 h-2 hover:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        i === currentImageIndex
                          ? 'border-blue-500 shadow-md shadow-blue-200'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt={`${product.title} ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PRODUCT INFO */}
            <div className="space-y-6">

              {/* Category & actions row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {product.category && (
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">
                      <Tag className="w-3 h-3" />
                      {(product.category as { name: string }).name}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleLike}
                  className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                    liked ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  {likeCount > 0 && <span className="text-xs font-black">{likeCount}</span>}
                </button>
              </div>

              {/* Title */}
              <h1 className="font-display text-5xl sm:text-6xl text-navy-950 leading-none tracking-wider">
                {product.title.toUpperCase()}
              </h1>

              {/* Rating summary */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-end gap-4">
                <p className="font-black text-blue-600 text-3xl">
                  {product.has_variants && !selectedVariant ? 'From ' : ''}{formatPrice(displayPrice)}
                </p>
                {stockCount !== null && (
                  <p className={`text-sm font-bold pb-1 ${stockCount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stockCount > 0 ? `${stockCount} in stock` : 'Out of stock'}
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 leading-relaxed text-base">{product.description}</p>
              )}

              {/* VARIANTS */}
              {product.has_variants && (
                <div className="space-y-5">
                  {colors.length > 0 && (
                    <div>
                      <label className="dh-label">
                        Color {selectedColor && <span className="text-blue-600 normal-case font-black">— {selectedColor}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                            className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 ${
                              selectedColor === color
                                ? 'bg-navy-950 text-white border-navy-950 shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-navy-400 hover:bg-gray-50'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {sizes.length > 0 && (
                    <div>
                      <label className="dh-label">
                        Size {selectedSize && <span className="text-blue-600 normal-case font-black">— {selectedSize}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sizes.map((size) => {
                          const available = product.product_variants?.some(
                            (v) => v.size === size && (!selectedColor || v.color === selectedColor) && v.stock > 0
                          );
                          return (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                              disabled={!available && !!selectedColor}
                              className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 min-w-[3.5rem] text-center ${
                                selectedSize === size
                                  ? 'bg-navy-950 text-white border-navy-950 shadow-md'
                                  : available || !selectedColor
                                  ? 'bg-white text-gray-700 border-gray-200 hover:border-navy-400 hover:bg-gray-50'
                                  : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="dh-label">Quantity</label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-navy-500 hover:bg-gray-50 transition-all text-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black text-xl text-navy-950">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stockCount ?? 99, q + 1))}
                    className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-navy-500 hover:bg-gray-50 transition-all text-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Add to Cart — Desktop */}
              <div className="hidden lg:block pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex items-center justify-center gap-3 w-full py-5 px-8 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-200 ${
                    added
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : inStock
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {added ? (
                    <><CheckCircle2 className="w-5 h-5" /> Added to Cart!</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" /> {inStock ? `Add to Cart — ${formatPrice(displayPrice * quantity)}` : 'Out of Stock'}</>
                  )}
                </button>
                {product.has_variants && !selectedVariant && (
                  <p className="text-center text-xs text-amber-500 font-bold mt-2 uppercase tracking-wider">
                    ↑ Select a color & size to continue
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <ProductReviews
            productId={product.id}
            onAvgRatingUpdate={(avg, count) => {
              setAvgRating(avg);
              setReviewCount(count);
            }}
          />
        </div>
      </div>

      {/* STICKY BOTTOM BAR (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/80 px-4 py-3 shadow-2xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium line-clamp-1">{product.title}</p>
              <p className="font-black text-blue-600 text-lg">{formatPrice(displayPrice * quantity)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 flex-shrink-0 ${
                added
                  ? 'bg-green-500 text-white'
                  : inStock
                  ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {added ? (
                <><CheckCircle2 className="w-4 h-4" /> Added!</>
              ) : (
                <><ShoppingCart className="w-4 h-4" /> {inStock ? 'Add to Cart' : 'Out of Stock'}</>
              )}
            </button>
          </div>
          {product.has_variants && !selectedVariant && (
            <p className="text-center text-xs text-amber-500 font-bold mt-1 uppercase tracking-wider">
              Select variant above
            </p>
          )}
        </div>
      </div>

      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
