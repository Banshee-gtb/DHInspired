import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck, MapPin, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { BankAccount, DeliveryOption } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

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
    deliveryType: 'delivery',
    deliveryOptionId: '',
    pickupLocation: '',
    notes: '',
    selectedBankId: '',
    paymentRef: '',
  });

  useEffect(() => {
    if (items.length === 0) navigate('/products');
  }, [items]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['bank_accounts', 'delivery_options', 'pickup_locations']);
      if (data) {
        data.forEach((s: { key: string; value: string }) => {
          if (s.key === 'bank_accounts') {
            const parsed = JSON.parse(s.value || '[]') as BankAccount[];
            setBankAccounts(parsed.filter((b) => b.is_active));
          }
          if (s.key === 'delivery_options') {
            const parsed = JSON.parse(s.value || '[]') as DeliveryOption[];
            setDeliveryOptions(parsed.filter((d) => d.is_active));
            const def = parsed.find((d) => d.is_active);
            if (def) setForm((f) => ({ ...f, deliveryOptionId: def.id, deliveryType: def.type }));
          }
        });
      }
    };
    fetchSettings();
  }, []);

  const selectedDelivery = deliveryOptions.find((d) => d.id === form.deliveryOptionId);
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const grandTotal = totalPrice + deliveryFee;
  const selectedBank = bankAccounts.find((b) => b.id === form.selectedBankId);

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Name and phone are required');
      return;
    }
    if (form.deliveryType === 'delivery' && !form.address) {
      toast.error('Delivery address is required');
      return;
    }

    setLoading(true);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_address: form.deliveryType === 'delivery' ? `${form.address}, ${form.city}, ${form.state}` : '',
        delivery_type: form.deliveryType,
        delivery_location: form.deliveryType === 'pickup' ? form.pickupLocation : (selectedDelivery?.label ?? ''),
        delivery_notes: form.notes,
        amount_paid: grandTotal,
        payment_method: selectedBank ? `${selectedBank.type} - ${selectedBank.bank_name}` : 'Bank Transfer',
        payment_reference: form.paymentRef,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error('Failed to place order. Please try again.');
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

    // Trigger WhatsApp notification
    supabase.functions.invoke('notify-order', { body: { orderId: order.id } });

    clearCart();
    setLoading(false);
    navigate(`/order-confirmation/${order.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-dh-purple text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              {/* Left */}
              <div className="space-y-6">
                {/* Contact */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-dh-purple" /> Contact Info
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
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-dh-purple" /> Delivery Method
                  </h2>

                  {deliveryOptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {deliveryOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => update('deliveryOptionId', opt.id)}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            form.deliveryOptionId === opt.id ? 'border-dh-purple bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${form.deliveryOptionId === opt.id ? 'border-dh-purple bg-dh-purple' : 'border-gray-300'}`}>
                            {form.deliveryOptionId === opt.id && <div className="w-full h-full rounded-full bg-white scale-50" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {opt.fee > 0 ? `+${formatPrice(opt.fee)}` : 'Free'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {['delivery', 'pickup'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => update('deliveryType', t)}
                          className={`p-4 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                            form.deliveryType === t ? 'border-dh-purple bg-purple-50 text-dh-purple' : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {t === 'delivery' ? '🚚 Home Delivery' : '🏪 Store Pickup'}
                        </button>
                      ))}
                    </div>
                  )}

                  {(selectedDelivery?.type === 'delivery' || form.deliveryType === 'delivery') && (
                    <div className="space-y-3 mt-4">
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
                          <input className="dh-input" placeholder="State" value={form.state} onChange={(e) => update('state', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedDelivery?.type === 'pickup' || form.deliveryType === 'pickup') && (
                    <div className="mt-4">
                      <label className="dh-label"><MapPin className="inline w-4 h-4 mr-1" />Pickup Location</label>
                      <input className="dh-input" placeholder="Preferred pickup location or address" value={form.pickupLocation} onChange={(e) => update('pickupLocation', e.target.value)} />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="dh-label">Order Notes (Optional)</label>
                    <textarea className="dh-input resize-none" rows={2} placeholder="Any special instructions..." value={form.notes} onChange={(e) => update('notes', e.target.value)} />
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-dh-purple" /> Payment
                  </h2>

                  {bankAccounts.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                      Bank account details not yet configured. Contact us on WhatsApp for payment info.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Select account to transfer to:</p>
                      <div className="space-y-3">
                        {bankAccounts.map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => update('selectedBankId', bank.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              form.selectedBankId === bank.id ? 'border-dh-purple bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-800">{bank.bank_name}</p>
                                <p className="text-sm text-gray-600 mt-0.5">{bank.account_name}</p>
                                <p className="text-lg font-mono font-bold text-dh-purple mt-1">{bank.account_number}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 ${form.selectedBankId === bank.id ? 'border-dh-purple bg-dh-purple' : 'border-gray-300'}`} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 capitalize">{bank.type.replace('_', ' ')}</p>
                          </button>
                        ))}
                      </div>

                      {form.selectedBankId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                          <p className="font-semibold mb-1">Payment Instructions:</p>
                          <p>1. Transfer <strong>{formatPrice(grandTotal)}</strong> to the selected account</p>
                          <p>2. Enter your transfer reference/receipt number below</p>
                          <p>3. Place your order — we'll confirm receipt</p>
                        </div>
                      )}

                      <div>
                        <label className="dh-label">Payment Reference / Receipt Number</label>
                        <input
                          className="dh-input"
                          placeholder="Enter after making transfer (optional)"
                          value={form.paymentRef}
                          onChange={(e) => update('paymentRef', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                {/* Mobile toggle */}
                <button
                  type="button"
                  onClick={() => setSummaryOpen(!summaryOpen)}
                  className="lg:hidden w-full flex items-center justify-between bg-dh-purple/10 text-dh-purple font-semibold px-4 py-3 rounded-xl"
                >
                  <span>Order Summary ({items.length} items)</span>
                  {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${!summaryOpen ? 'hidden lg:block' : ''}`}>
                  <div className="p-5 border-b border-gray-50">
                    <h3 className="font-bold text-gray-900">Order Summary</h3>
                  </div>
                  <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.productTitle} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.productTitle}</p>
                          {item.variantInfo && <p className="text-xs text-purple-500">{item.variantInfo}</p>}
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-400">x{item.quantity}</span>
                            <span className="text-sm font-bold text-dh-purple">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Delivery</span>
                      <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                        {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-2">
                      <span>Total</span>
                      <span className="text-dh-purple">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="dh-btn-primary w-full text-center flex items-center justify-center gap-2 py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order...</span>
                  ) : (
                    <>Place Order — {formatPrice(grandTotal)}</>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">No account required. Secure guest checkout.</p>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
