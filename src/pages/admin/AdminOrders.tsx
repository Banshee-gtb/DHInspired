import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (filterStatus) query = query.eq('status', filterStatus);
    if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    const { data } = await query;
    if (data) setOrders(data);
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    toast.success(`Order status updated to ${status}`);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input className="dh-input pl-12" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="dh-input sm:w-44" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="admin-card h-20 skeleton" />)
        ) : orders.length === 0 ? (
          <div className="admin-card text-center py-12">
            <Package className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="admin-card">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-500">
                    <span>📞 {order.customer_phone}</span>
                    {order.customer_email && <span>✉️ {order.customer_email}</span>}
                    <span>🕒 {formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                    <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="capitalize">{order.delivery_type === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}</span>
                    {order.payment_method && <span>{order.payment_method}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-dh-purple text-lg">{formatPrice(order.amount_paid)}</span>
                  <div className="relative">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-dh-purple cursor-pointer appearance-none pr-8"
                    >
                      {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                  >
                    {expandedId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
                  {order.customer_address && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">DELIVERY ADDRESS</p>
                      <p className="text-sm text-gray-700">{order.customer_address}</p>
                    </div>
                  )}
                  {order.delivery_notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">NOTES</p>
                      <p className="text-sm text-gray-700">{order.delivery_notes}</p>
                    </div>
                  )}
                  {order.payment_reference && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">PAYMENT REFERENCE</p>
                      <p className="text-sm font-mono text-gray-700">{order.payment_reference}</p>
                    </div>
                  )}

                  {order.order_items && order.order_items.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2">ORDER ITEMS</p>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start bg-gray-50 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.product_title}</p>
                              {item.variant_info && <p className="text-xs text-purple-500">{item.variant_info}</p>}
                              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <span className="font-bold text-sm text-dh-purple">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
