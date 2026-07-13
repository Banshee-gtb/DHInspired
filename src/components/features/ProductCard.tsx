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
  const { addItem, openCart } = useCart();
  const price = getProductDisplayPrice(product);
  const mainImage = product.images?.[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants) {
      toast.info('Select a variant on the product page');
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
    toast.success(`${product.title} added to cart!`);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-purple-50 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
            <ShoppingCart className="w-12 h-12 text-purple-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="featured-badge">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </span>
          )}
          {!product.is_active && (
            <span className="inline-flex items-center bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Unavailable
            </span>
          )}
        </div>

        {/* Quick Add (desktop) */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 bg-dh-purple text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-dh-purple-dark active:scale-90"
          aria-label="Add to cart"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1 group-hover:text-dh-purple transition-colors">
          {product.title}
        </h3>

        {product.has_variants && (
          <p className="text-xs text-purple-500 mb-1 font-medium">Multiple variants</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-dh-purple text-base">
            {price > 0 ? (product.has_variants ? `From ${formatPrice(price)}` : formatPrice(price)) : 'Price on request'}
          </span>

          {/* Mobile add to cart */}
          <button
            onClick={handleAddToCart}
            className="md:hidden bg-dh-purple/10 text-dh-purple p-2 rounded-full hover:bg-dh-purple hover:text-white active:scale-90 transition-all duration-200"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
