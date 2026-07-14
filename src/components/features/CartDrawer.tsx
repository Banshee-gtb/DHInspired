import { useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Zap } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={closeCart}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-navy-900 border-l border-white/5 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black tracking-[0.2em] text-white uppercase">
              Cart ({items.length})
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag className="w-12 h-12 text-navy-700 mb-4" />
              <p className="text-gray-500 font-black text-xs uppercase tracking-widest">Cart is empty</p>
              <p className="text-gray-600 text-xs mt-2">Browse products to get started</p>
              <button
                onClick={() => { closeCart(); navigate('/products'); }}
                className="mt-6 dh-btn-primary text-xs py-3 px-6"
              >
                BROWSE PRODUCTS
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-navy-800 border border-navy-700 p-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productTitle}
                    className="w-16 h-16 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-navy-700 flex-shrink-0 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-navy-600" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-xs leading-tight line-clamp-1 uppercase tracking-wide">
                    {item.productTitle}
                  </p>
                  {item.variantInfo && (
                    <p className="text-[10px] text-blue-400 mt-0.5 font-semibold">{item.variantInfo}</p>
                  )}
                  <p className="font-black text-blue-400 text-sm mt-1">
                    {formatPrice(item.price * item.quantity)}
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 bg-navy-700 border border-navy-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-400 transition-colors text-gray-400"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-black text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-navy-700 border border-navy-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-400 transition-colors text-gray-400"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto p-1 text-red-500/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-white/5 space-y-3 bg-navy-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-gray-500 uppercase">Subtotal</span>
              <span className="font-black text-white text-lg">{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">+ delivery fee at checkout</p>
            <button onClick={handleCheckout} className="dh-btn-primary w-full py-4">
              CHECKOUT
            </button>
          </div>
        )}
      </div>
    </>
  );
}
