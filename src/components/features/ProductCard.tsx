import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Star, Check } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, getProductDisplayPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const price = getProductDisplayPrice(product);
  const mainImage = product.images?.[0];
  const secondImage = product.images?.[1];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants) {
      navigate(`/products/${product.id}`);
      toast.info('Select your variant', { duration: 1800 });
      return;
    }

    addItem({
      productId: product.id,
      productTitle: product.title,
      variantInfo: '',
      price: product.base_price,
      quantity: 1,
      image: mainImage,
    });

    setAdded(true);
    toast.success('Added to cart!', { duration: 1500 });
    setTimeout(() => setAdded(false), 2000);
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="store-card group animate-fade-in flex flex-col">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="relative block aspect-[3/4] overflow-hidden rounded-t-2xl bg-gray-50 flex-shrink-0">
        {mainImage ? (
          <>
            <img
              src={mainImage}
              alt={product.title}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={product.title}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ShoppingCart className="w-10 h-10 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {product.is_featured && (
            <span className="featured-badge flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              NEW
            </span>
          )}
          {product.has_variants && (
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Variants
            </span>
          )}
        </div>

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

        {/* Desktop quick-action buttons */}
        <div className="absolute bottom-3 left-3 right-3 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-20">
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            } shadow-lg`}
          >
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            {added ? 'Added!' : product.has_variants ? 'Select' : 'Add'}
          </button>
          <button
            onClick={handleView}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl hover:bg-white transition-colors shadow-lg flex-shrink-0"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto">
          <p className="font-black text-blue-600 text-sm mb-3">
            {price > 0 ? (product.has_variants ? `From ₦${price.toLocaleString()}` : formatPrice(price)) : 'Price on request'}
          </p>

          {/* Mobile action buttons — always visible */}
          <div className="flex gap-2 md:hidden">
            <button
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              } shadow-sm`}
            >
              {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
              {added ? 'Added' : product.has_variants ? 'Select' : 'Add'}
            </button>
            <Link
              to={`/products/${product.id}`}
              className="w-10 h-10 border-2 border-gray-200 hover:border-blue-400 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </Link>
          </div>

          {/* Desktop — always show View link below hover area */}
          <div className="hidden md:block">
            <Link
              to={`/products/${product.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border-2 border-gray-100 hover:border-blue-400 text-xs font-bold text-gray-500 hover:text-blue-600 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
