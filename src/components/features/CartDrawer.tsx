import { useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={closeCart}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl shadow-black/10 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black tracking-[0.2em] text-gray-900 uppercase">
              Cart ({items.length})
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Cart is empty</p>
              <p className="text-gray-400 text-xs mt-2">Browse products to get started</p>
              <button
                onClick={() => { closeCart(); navigate('/products'); }}
                className="mt-6 dh-btn-primary text-xs py-3 px-6"
              >
                BROWSE PRODUCTS
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productTitle}
                    className="w-16 h-16 object-cover flex-shrink-0 rounded-xl"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-gray-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-xs leading-tight line-clamp-1 uppercase tracking-wide">
                    {item.productTitle}
                  </p>
                  {item.variantInfo && (
                    <p className="text-[10px] text-blue-600 mt-0.5 font-semibold">{item.variantInfo}</p>
                  )}
                  <p className="font-black text-blue-600 text-sm mt-1">
                    {formatPrice(item.price * item.quantity)}
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors text-gray-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors text-gray-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto p-1 text-red-400 hover:text-red-500 transition-colors"
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
          <div className="px-5 py-5 border-t border-gray-100 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-gray-400 uppercase">Subtotal</span>
              <span className="font-black text-gray-900 text-lg">{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">+ delivery fee at checkout</p>
            <button onClick={handleCheckout} className="dh-btn-primary w-full py-4">
              CHECKOUT
            </button>
          </div>
        )}
      </div>
    </>
  );
}
