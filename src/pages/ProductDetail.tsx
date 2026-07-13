import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, Tag, ArrowLeft, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import ProductGallery from '@/components/features/ProductGallery';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
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
      (v) =>
        (!selectedColor || v.color === selectedColor) &&
        (!selectedSize || v.size === selectedSize)
    );
    setSelectedVariant(found ?? null);
  }, [selectedColor, selectedSize, product]);

  const colors = [...new Set(product?.product_variants?.map((v) => v.color).filter(Boolean))];
  const sizes = [...new Set(product?.product_variants?.map((v) => v.size).filter(Boolean))];

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : product?.has_variants && product?.product_variants?.length
    ? Math.min(...product.product_variants.map((v) => v.price))
    : product?.base_price ?? 0;

  const stockCount = selectedVariant ? selectedVariant.stock : null;
  const inStock = !product?.has_variants || (selectedVariant ? selectedVariant.stock > 0 : true);

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
      image: product.images?.[0],
    });

    setAdded(true);
    toast.success('Added to cart!');
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square skeleton rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 skeleton rounded-xl" />
              <div className="h-6 skeleton rounded-xl w-1/3" />
              <div className="h-32 skeleton rounded-xl" />
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
          <p className="text-xl text-gray-500">Product not found</p>
          <Link to="/products" className="dh-btn-primary">Browse Products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-dh-purple text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery */}
            <ProductGallery images={product.images ?? []} title={product.title} />

            {/* Product Info */}
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {product.is_featured && (
                  <span className="featured-badge">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </span>
                )}
                {product.category && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-dh-purple text-xs font-semibold px-3 py-1 rounded-full">
                    <Tag className="w-3 h-3" />
                    {(product.category as { name: string }).name}
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                {product.title}
              </h1>

              {/* Price */}
              <div>
                <p className="text-3xl font-bold text-dh-purple">
                  {product.has_variants && !selectedVariant ? `From ` : ''}{formatPrice(displayPrice)}
                </p>
                {stockCount !== null && (
                  <p className={`text-sm mt-1 font-medium ${stockCount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stockCount > 0 ? `${stockCount} in stock` : 'Out of stock'}
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              )}

              {/* Variant Selectors */}
              {product.has_variants && (
                <div className="space-y-4">
                  {/* Colors */}
                  {colors.length > 0 && (
                    <div>
                      <label className="dh-label">
                        Color {selectedColor && <span className="text-dh-purple font-semibold">— {selectedColor}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                              selectedColor === color
                                ? 'bg-dh-purple text-white border-dh-purple shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-dh-purple'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {sizes.length > 0 && (
                    <div>
                      <label className="dh-label">
                        Size {selectedSize && <span className="text-dh-purple font-semibold">— {selectedSize}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {sizes.map((size) => {
                          const available = product.product_variants?.some(
                            (v) =>
                              v.size === size &&
                              (!selectedColor || v.color === selectedColor) &&
                              v.stock > 0
                          );
                          return (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                              disabled={!available && !!selectedColor}
                              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                selectedSize === size
                                  ? 'bg-dh-purple text-white border-dh-purple shadow-md'
                                  : available || !selectedColor
                                  ? 'bg-white text-gray-700 border-gray-200 hover:border-dh-purple'
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

              {/* Quantity Picker */}
              <div>
                <label className="dh-label">Quantity</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-dh-purple hover:text-dh-purple transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stockCount ?? 99, q + 1))}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-dh-purple hover:text-dh-purple transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Add to Cart — Desktop */}
              <div className="hidden lg:block">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex items-center justify-center gap-2 w-full py-4 px-8 rounded-2xl font-bold text-base transition-all duration-300 ${
                    added
                      ? 'bg-green-500 text-white'
                      : inStock
                      ? 'bg-dh-purple hover:bg-dh-purple-dark text-white hover:shadow-lg hover:shadow-dh-purple/30 active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {added ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {inStock ? 'Add to Cart' : 'Out of Stock'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar — Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 line-clamp-1">{product.title}</p>
            <p className="font-bold text-dh-purple">{formatPrice(displayPrice)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              added
                ? 'bg-green-500 text-white'
                : inStock
                ? 'bg-dh-purple text-white active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {added ? (
              <><CheckCircle2 className="w-4 h-4" /> Added!</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> {inStock ? 'Add to Cart' : 'Out of Stock'}</>
            )}
          </button>
        </div>
      </div>

      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
