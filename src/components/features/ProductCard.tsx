import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, getProductDisplayPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const price = getProductDisplayPrice(product);
  const mainImage = product.images?.[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants) {
      toast.info('Pick your variant on the product page', { duration: 2000 });
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
    toast.success('Added to cart!', { duration: 1500 });
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-navy-800 border border-navy-700 overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/30 animate-fade-in"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-navy-900 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-navy-900">
            <ShoppingCart className="w-12 h-12 text-navy-700" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/20 transition-colors duration-300" />

        {/* Badges */}
        <div className="absolute top-0 left-0 flex flex-col gap-0">
          {product.is_featured && (
            <span className="featured-badge rounded-none text-[10px] px-2 py-1 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              NEW
            </span>
          )}
        </div>

        {/* Quick Add */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white py-2.5 text-xs font-black tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-500 flex items-center justify-center gap-2"
          aria-label="Add to cart"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {product.has_variants ? 'SELECT VARIANT' : 'ADD TO CART'}
        </button>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors tracking-wide">
          {product.title}
        </h3>

        <div className="flex items-center justify-between">
          <span className="font-black text-blue-400 text-sm">
            {price > 0 ? (product.has_variants ? `From ₦${price.toLocaleString()}` : formatPrice(price)) : 'Ask price'}
          </span>

          {/* Mobile add button */}
          <button
            onClick={handleAddToCart}
            className="md:hidden bg-navy-700 text-blue-400 p-2 rounded-none hover:bg-blue-600 hover:text-white active:scale-90 transition-all duration-150 border border-navy-600 hover:border-blue-600"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
