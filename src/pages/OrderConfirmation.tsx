import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Phone, MapPin, ShoppingBag, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [waNumber, setWaNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single(),
      supabase.from('settings').select('value').eq('key', 'whatsapp_number').single(),
    ]).then(([orderRes, waRes]) => {
      if (orderRes.data) setOrder(orderRes.data);
      if (waRes.data?.value) setWaNumber(waRes.data.value.replace(/\D/g, ''));
      setLoading(false);
    });
  }, [orderId]);

  const buildWhatsAppMessage = () => {
    if (!order) return '';
    const items = order.order_items ?? [];
    const itemsText = items.map((i) =>
      `• ${i.product_title}${i.variant_info ? ` (${i.variant_info})` : ''} x${i.quantity} — ₦${i.price.toLocaleString()}`
    ).join('\n');
    return encodeURIComponent(
      `🛒 *NEW ORDER - DH-INSPIRED*\n\n` +
      `*Order ID:* #${order.id.slice(0, 8).toUpperCase()}\n` +
      `*Customer:* ${order.customer_name}\n` +
      `*Phone:* ${order.customer_phone}\n` +
      `*Delivery:* ${order.delivery_type === 'pickup' ? 'Pickup' : 'Home Delivery'}\n` +
      (order.customer_address ? `*Address:* ${order.customer_address}\n` : '') +
      `\n*Items:*\n${itemsText}\n\n` +
      `*Total:* ₦${order.amount_paid.toLocaleString()}\n` +
      `*Payment:* ${order.payment_method}\n` +
      (order.payment_reference ? `*Ref:* ${order.payment_reference}\n` : '')
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          {/* Success header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <span className="section-tag">Order Placed</span>
            <h1 className="font-display text-6xl text-navy-950 tracking-wider mb-2">ORDER CONFIRMED</h1>
            <p className="text-gray-500 text-sm">Thank you for shopping with DH-Inspired</p>
            {order && (
              <p className="text-xs font-mono bg-blue-50 border border-blue-200 text-blue-600 px-5 py-2.5 inline-block mt-4 tracking-widest font-bold rounded-xl">
                ORDER #{order.id.slice(0, 8).toUpperCase()}
              </p>
            )}
          </div>

          {/* WhatsApp CTA */}
          {waNumber && order && (
            <div className="bg-[#25D366]/10 border border-[#25D366]/30 p-5 mb-5 animate-fade-in rounded-2xl">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-2">
                📱 Send Order via WhatsApp
              </h3>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                Your order was auto-sent. Click below if the WhatsApp tab didn't open.
              </p>
              <a
                href={`https://wa.me/${waNumber}?text=${buildWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-black font-black text-xs px-6 py-3 uppercase tracking-widest transition-colors rounded-xl"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Open WhatsApp
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {order && (
            <div className="space-y-4">
              {/* Order details */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Order Details
                </h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-bold text-gray-700">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="bg-yellow-50 border border-yellow-200 text-yellow-700 font-black px-2.5 py-1 text-xs uppercase tracking-widest rounded-full capitalize">{order.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-black text-blue-600 text-base">{formatPrice(order.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-bold text-gray-700">{order.payment_method || 'Bank Transfer'}</span>
                  </div>
                  {order.payment_reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference</span>
                      <span className="font-mono font-bold text-gray-700">{order.payment_reference}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" /> Delivery Info
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-bold">{order.customer_phone}</span>
                  </div>
                  {order.customer_address && (
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{order.customer_address}</span>
                    </div>
                  )}
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mt-2">
                    {order.delivery_type === 'pickup' ? '🏪 Store Pickup' : '🚚 Home Delivery'}
                  </p>
                  {order.delivery_notes && (
                    <p className="text-gray-400 text-xs">Notes: {order.delivery_notes}</p>
                  )}
                </div>
              </div>

              {/* Items */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-4">Items Ordered</h2>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-gray-900">{item.product_title}</p>
                          {item.variant_info && <p className="text-xs text-blue-600">{item.variant_info}</p>}
                          <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-black text-blue-600">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link to="/products" className="dh-btn-outline w-full flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" /> CONTINUE SHOPPING
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
