import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface CustomerSummary {
  phone: string;
  name: string;
  email: string;
  orderCount: number;
  lastOrder: string;
}

export default function AdminUsers() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('orders').select('customer_name, customer_phone, customer_email, created_at').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const map = new Map<string, CustomerSummary>();
          (data as Pick<Order, 'customer_name' | 'customer_phone' | 'customer_email' | 'created_at'>[]).forEach((o) => {
            const key = o.customer_phone;
            if (!map.has(key)) {
              map.set(key, { phone: o.customer_phone, name: o.customer_name, email: o.customer_email, orderCount: 1, lastOrder: o.created_at });
            } else {
              const existing = map.get(key)!;
              map.set(key, { ...existing, orderCount: existing.orderCount + 1 });
            }
          });
          setCustomers(Array.from(map.values()));
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      <p className="text-gray-500 text-sm">Customers who have placed orders (guest checkout).</p>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="admin-card h-16 skeleton" />)}</div>
      ) : customers.length === 0 ? (
        <div className="admin-card text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No customers yet</p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-4">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-4">Phone</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-4 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-4">Orders</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 hidden md:table-cell">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.phone} className="hover:bg-purple-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{c.name}</td>
                    <td className="py-3 pr-4 text-gray-600">{c.phone}</td>
                    <td className="py-3 pr-4 text-gray-500 hidden sm:table-cell">{c.email || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className="bg-purple-100 text-dh-purple font-bold text-xs px-2.5 py-1 rounded-full">{c.orderCount}</span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs hidden md:table-cell">{formatDate(c.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
