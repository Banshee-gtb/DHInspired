import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { BankAccount, DeliveryOption } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Truck, CreditCard, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    deliveryOptionId: '',
    deliveryType: 'delivery',
    pickupLocation: '',
    notes: '',
    selectedBankId: '',
    paymentRef: '',
  });

  useEffect(() => {
    if (items.length === 0) navigate('/products');
  }, [items]);

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['bank_accounts', 'delivery_options'])
      .then(({ data }) => {
        if (!data) return;
        data.forEach((s: { key: string; value: string }) => {
          if (s.key === 'bank_accounts') {
            const parsed = JSON.parse(s.value || '[]') as BankAccount[];
            setBankAccounts(parsed.filter((b) => b.is_active));
          }
          if (s.key === 'delivery_options') {
            const parsed = JSON.parse(s.value || '[]') as DeliveryOption[];
            const active = parsed.filter((d) => d.is_active);
            setDeliveryOptions(active);
            if (active.length > 0) {
              setForm((f) => ({ ...f, deliveryOptionId: active[0].id, deliveryType: active[0].type }));
            }
          }
        });
      });
  }, []);

  const selectedDelivery = deliveryOptions.find((d) => d.id === form.deliveryOptionId);
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const grandTotal = totalPrice + deliveryFee;
  const selectedBank = bankAccounts.find((b) => b.id === form.selectedBankId);

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const buildWhatsAppMessage = (order: { id: string; customer_name: string; customer_phone: string; customer_address?: string; delivery_type: string; delivery_location?: string; delivery_notes?: string; amount_paid: number; payment_method: string; payment_reference?: string }) => {
    const itemsText = items.map((item) =>
      `• ${item.productTitle}${item.variantInfo ? ` (${item.variantInfo})` : ''} x${item.quantity} — ₦${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    return encodeURIComponent(
      `🛒 *NEW ORDER - DH-INSPIRED*\n\n` +
      `*Order ID:* #${order.id.slice(0, 8).toUpperCase()}\n\n` +
      `*👤 Customer*\n` +
      `Name: ${order.customer_name}\n` +
      `Phone: ${order.customer_phone}\n` +
      (form.email ? `Email: ${form.email}\n` : '') +
      `\n*🚚 Delivery*\n` +
      `Method: ${order.delivery_type === 'pickup' ? 'Store Pickup' : 'Home Delivery'}\n` +
      (order.customer_address ? `Address: ${order.customer_address}\n` : '') +
      (order.delivery_location ? `Location: ${order.delivery_location}\n` : '') +
      (order.delivery_notes ? `Notes: ${order.delivery_notes}\n` : '') +
      `\n*🧾 Items*\n${itemsText}\n\n` +
      `*💰 Payment*\n` +
      `Total: ₦${order.amount_paid.toLocaleString()}\n` +
      `Method: ${order.payment_method}\n` +
      (order.payment_reference ? `Reference: ${order.payment_reference}\n` : '') +
      `\n_Sent from DH-Inspired checkout_`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Name and phone number are required');
      return;
    }
    if (selectedDelivery?.type === 'delivery' && !form.address) {
      toast.error('Delivery address is required');
      return;
    }

    setLoading(true);

    const fullAddress = selectedDelivery?.type === 'delivery'
      ? [form.address, form.city, form.state, form.zipCode, form.country].filter(Boolean).join(', ')
      : '';

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_address: fullAddress,
        delivery_type: selectedDelivery?.type ?? form.deliveryType,
        delivery_location: selectedDelivery?.type === 'pickup' ? form.pickupLocation : (selectedDelivery?.label ?? ''),
        delivery_notes: form.notes,
        amount_paid: grandTotal,
        payment_method: selectedBank
          ? `${selectedBank.type === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'} — ${selectedBank.bank_name}`
          : 'Bank Transfer',
        payment_reference: form.paymentRef,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !order) {
      toast.error('Failed to place order. Try again.');
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      product_title: item.productTitle,
      variant_info: item.variantInfo,
      quantity: item.quantity,
      price: item.price,
    }));

    await supabase.from('order_items').insert(orderItems);

    // Notify edge function (fire and forget)
    supabase.functions.invoke('notify-order', { body: { orderId: order.id } });

    clearCart();
    setLoading(false);

    // Redirect to WhatsApp with order details
    const { data: waSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_number')
      .single();

    const waNum = waSetting?.value?.replace(/\D/g, '');
    if (waNum) {
      const msg = buildWhatsAppMessage({
        ...order,
        customer_address: fullAddress,
      });
      // Small delay so navigation doesn't clash
      setTimeout(() => {
        window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
      }, 300);
    }

    navigate(`/order-confirmation/${order.id}`);
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <h1 className="font-display text-6xl text-white tracking-wider mb-8">CHECKOUT</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              {/* Left */}
              <div className="space-y-4">
                {/* Contact */}
                <div className="admin-card">
                  <h2 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-5 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-400" /> Contact Info
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="dh-label">Full Name *</label>
                      <input required className="dh-input" placeholder="Your full name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                    </div>
                    <div>
                      <label className="dh-label">Phone Number *</label>
                      <input required type="tel" className="dh-input" placeholder="e.g. 08012345678" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="dh-label">Email (Optional)</label>
                      <input type="email" className="dh-input" placeholder="your@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="admin-card">
                  <h2 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-5 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-400" /> Delivery Method
                  </h2>

                  {deliveryOptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      {deliveryOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, deliveryOptionId: opt.id, deliveryType: opt.type }))}
                          className={`flex items-start gap-3 p-4 border-2 text-left transition-all ${
                            form.deliveryOptionId === opt.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-navy-600 hover:border-navy-500 bg-navy-900'
                          }`}
                        >
                          <div className={`w-4 h-4 border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${form.deliveryOptionId === opt.id ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                            {form.deliveryOptionId === opt.id && <div className="w-2 h-2 bg-white" />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm uppercase tracking-wide">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {opt.fee > 0 ? `+${formatPrice(opt.fee)}` : 'Free'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[{ key: 'delivery', label: '🚚 HOME DELIVERY' }, { key: 'pickup', label: '🏪 STORE PICKUP' }].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => update('deliveryType', key)}
                          className={`p-4 border-2 text-xs font-black tracking-widest uppercase transition-all ${
                            form.deliveryType === key
                              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                              : 'border-navy-600 bg-navy-900 text-gray-500'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {(selectedDelivery?.type === 'delivery' || (!selectedDelivery && form.deliveryType === 'delivery')) && (
                    <div className="space-y-3">
                      <div>
                        <label className="dh-label">Street Address *</label>
                        <input required className="dh-input" placeholder="House number, street name" value={form.address} onChange={(e) => update('address', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="dh-label">City</label>
                          <input className="dh-input" placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
                        </div>
                        <div>
                          <label className="dh-label">State</label>
                          <input className="dh-input" placeholder="State / Province" value={form.state} onChange={(e) => update('state', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="dh-label">ZIP / Postal Code</label>
                          <input className="dh-input" placeholder="ZIP code" value={form.zipCode} onChange={(e) => update('zipCode', e.target.value)} />
                        </div>
                        <div>
                          <label className="dh-label">Country</label>
                          <input className="dh-input" placeholder="Country" value={form.country} onChange={(e) => update('country', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedDelivery?.type === 'pickup' || (!selectedDelivery && form.deliveryType === 'pickup')) && (
                    <div>
                      <label className="dh-label"><MapPin className="inline w-3 h-3 mr-1" />Pickup Location / Note</label>
                      <input className="dh-input" placeholder="Preferred pickup location" value={form.pickupLocation} onChange={(e) => update('pickupLocation', e.target.value)} />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="dh-label">Order Notes (Optional)</label>
                    <textarea className="dh-input resize-none" rows={2} placeholder="Any special instructions..." value={form.notes} onChange={(e) => update('notes', e.target.value)} />
                  </div>
                </div>

                {/* Payment */}
                <div className="admin-card">
                  <h2 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-5 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" /> Payment Method
                  </h2>

                  {bankAccounts.length === 0 ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 text-sm text-yellow-400">
                      Payment details not yet configured. Contact us on WhatsApp for payment info.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Select where to transfer:</p>
                      <div className="space-y-3">
                        {bankAccounts.map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => update('selectedBankId', bank.id)}
                            className={`w-full text-left p-4 border-2 transition-all ${
                              form.selectedBankId === bank.id
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-navy-600 bg-navy-900 hover:border-navy-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-black text-white text-sm uppercase tracking-wide">{bank.bank_name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{bank.account_name}</p>
                                <p className="font-mono font-black text-blue-400 text-lg mt-1 tracking-widest">{bank.account_number}</p>
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">
                                  {bank.type === 'mobile_money' ? '📱 Mobile Money' : '🏦 Bank Transfer'}
                                </p>
                              </div>
                              <div className={`w-5 h-5 border-2 flex items-center justify-center ${form.selectedBankId === bank.id ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                                {form.selectedBankId === bank.id && <div className="w-2 h-2 bg-white" />}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {form.selectedBankId && (
                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 text-xs text-blue-300 space-y-1">
                          <p className="font-black uppercase tracking-wider text-blue-400 mb-2">Payment Instructions:</p>
                          <p>1. Transfer <strong className="text-white">{formatPrice(grandTotal)}</strong> to selected account</p>
                          <p>2. Enter your transfer receipt/reference number below</p>
                          <p>3. Place order — you'll be redirected to WhatsApp to confirm</p>
                        </div>
                      )}

                      <div>
                        <label className="dh-label">Payment Reference / Receipt No.</label>
                        <input
                          className="dh-input"
                          placeholder="Enter reference after transfer (optional)"
                          value={form.paymentRef}
                          onChange={(e) => update('paymentRef', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setSummaryOpen(!summaryOpen)}
                  className="lg:hidden w-full flex items-center justify-between bg-navy-800 border border-navy-700 text-gray-300 font-black text-xs px-4 py-3 uppercase tracking-widest"
                >
                  <span>Order Summary ({items.length} items)</span>
                  {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <div className={`admin-card ${!summaryOpen ? 'hidden lg:block' : ''}`}>
                  <h3 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-5">Order Summary</h3>
                  <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-hide mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.productTitle} className="w-14 h-14 object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-14 bg-navy-700 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white line-clamp-1">{item.productTitle}</p>
                          {item.variantInfo && <p className="text-xs text-blue-400">{item.variantInfo}</p>}
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                            <span className="text-sm font-black text-blue-400">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-navy-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Subtotal</span>
                      <span className="font-bold text-gray-300">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Delivery</span>
                      <span className={`font-bold ${deliveryFee === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                        {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-white text-lg border-t border-navy-700 pt-3 mt-2">
                      <span>TOTAL</span>
                      <span className="text-blue-400">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="dh-btn-primary w-full flex items-center justify-center gap-2 py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      PLACING ORDER...
                    </span>
                  ) : (
                    `PLACE ORDER — ${formatPrice(grandTotal)}`
                  )}
                </button>
                <p className="text-xs text-gray-600 text-center uppercase tracking-widest">
                  You'll be redirected to WhatsApp to confirm
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
