import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BankAccount, DeliveryOption } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';

type SettingsMap = Record<string, string>;

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);

  const emptyBank: BankAccount = { id: generateId(), bank_name: '', account_name: '', account_number: '', type: 'bank_transfer', is_active: true };
  const emptyDelivery: DeliveryOption = { id: generateId(), label: '', type: 'delivery', fee: 0, is_active: true };

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (data) {
        const map: SettingsMap = {};
        data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
        setSettings(map);
        try { setBankAccounts(JSON.parse(map.bank_accounts || '[]')); } catch { setBankAccounts([]); }
        try { setDeliveryOptions(JSON.parse(map.delivery_options || '[]')); } catch { setDeliveryOptions([]); }
      }
      setLoading(false);
    });
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving((s) => ({ ...s, [key]: true }));
    await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setSettings((s) => ({ ...s, [key]: value }));
    setSaving((s) => ({ ...s, [key]: false }));
    toast.success('Saved!');
  };

  const saveSection = async (keys: string[]) => {
    const sectionKey = keys[0];
    setSaving((s) => ({ ...s, [sectionKey]: true }));
    for (const key of keys) {
      await supabase.from('settings').upsert({ key, value: settings[key] ?? '', updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSaving((s) => ({ ...s, [sectionKey]: false }));
    toast.success('Saved!');
  };

  const saveBankAccounts = async (accounts: BankAccount[]) => {
    setBankAccounts(accounts);
    await saveSetting('bank_accounts', JSON.stringify(accounts));
  };

  const saveDeliveryOptions = async (opts: DeliveryOption[]) => {
    setDeliveryOptions(opts);
    await saveSetting('delivery_options', JSON.stringify(opts));
  };

  const updateBank = (id: string, key: keyof BankAccount, val: string | boolean) => {
    setBankAccounts((prev) => prev.map((b) => b.id === id ? { ...b, [key]: val } : b));
  };

  const updateDelivery = (id: string, key: keyof DeliveryOption, val: string | number | boolean) => {
    setDeliveryOptions((prev) => prev.map((d) => d.id === id ? { ...d, [key]: val } : d));
  };

  const upd = (key: string, val: string) => setSettings((s) => ({ ...s, [key]: val }));

  const SectionCard = ({ title, children, saveKeys }: { title: string; children: React.ReactNode; saveKeys?: string[] }) => (
    <div className="admin-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
        {saveKeys && (
          <button onClick={() => saveSection(saveKeys)} disabled={saving[saveKeys[0]]} className="dh-btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving[saveKeys[0]] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        )}
      </div>
      {children}
    </div>
  );

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="admin-card h-32 skeleton" />)}</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Admin Credentials */}
      <SectionCard title="🔐 Admin Credentials" saveKeys={['admin_email', 'admin_password']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="dh-label">Admin Email</label>
            <input className="dh-input" value={settings.admin_email ?? ''} onChange={(e) => upd('admin_email', e.target.value)} placeholder="admin@example.com" />
          </div>
          <div>
            <label className="dh-label">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="dh-input pr-12" value={settings.admin_password ?? ''} onChange={(e) => upd('admin_password', e.target.value)} placeholder="New password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">⚠️ Changing credentials takes effect immediately. Write them down before saving.</p>
      </SectionCard>

      {/* Store Info */}
      <SectionCard title="🏪 Store Information" saveKeys={['store_name', 'store_tagline', 'store_address', 'whatsapp_number']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="dh-label">Store Name</label>
            <input className="dh-input" value={settings.store_name ?? ''} onChange={(e) => upd('store_name', e.target.value)} />
          </div>
          <div>
            <label className="dh-label">Tagline</label>
            <input className="dh-input" value={settings.store_tagline ?? ''} onChange={(e) => upd('store_tagline', e.target.value)} />
          </div>
          <div>
            <label className="dh-label">WhatsApp Number (with country code)</label>
            <input className="dh-input" placeholder="e.g. 2348012345678" value={settings.whatsapp_number ?? ''} onChange={(e) => upd('whatsapp_number', e.target.value)} />
          </div>
          <div>
            <label className="dh-label">Store Address</label>
            <input className="dh-input" placeholder="Physical address (for pickup)" value={settings.store_address ?? ''} onChange={(e) => upd('store_address', e.target.value)} />
          </div>
        </div>
      </SectionCard>

      {/* Social Links */}
      <SectionCard title="📱 Social Links" saveKeys={['instagram_url', 'tiktok_url', 'twitter_url', 'shopify_url']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/youraccount' },
            { key: 'tiktok_url', label: 'TikTok URL', placeholder: 'https://tiktok.com/@youraccount' },
            { key: 'twitter_url', label: 'X (Twitter) URL', placeholder: 'https://x.com/youraccount' },
            { key: 'shopify_url', label: 'Shopify Store URL', placeholder: 'https://yourstore.myshopify.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="dh-label">{label}</label>
              <input className="dh-input" placeholder={placeholder} value={settings[key] ?? ''} onChange={(e) => upd(key, e.target.value)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Links update immediately in the footer once saved. Leave blank to hide the icon.</p>
      </SectionCard>

      {/* Bank Accounts */}
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">💳 Bank Accounts / Payment Details</h2>
          <button onClick={() => saveBankAccounts(bankAccounts)} disabled={saving['bank_accounts']} className="dh-btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['bank_accounts'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
        <p className="text-sm text-gray-500">Customers will select from these accounts at checkout.</p>

        <div className="space-y-3">
          {bankAccounts.map((bank) => (
            <div key={bank.id} className="bg-purple-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Bank/Service Name</label>
                  <input className="dh-input text-sm py-2 mt-1" placeholder="e.g. GTBank" value={bank.bank_name} onChange={(e) => updateBank(bank.id, 'bank_name', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Account Name</label>
                  <input className="dh-input text-sm py-2 mt-1" placeholder="Account holder" value={bank.account_name} onChange={(e) => updateBank(bank.id, 'account_name', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Account Number</label>
                  <input className="dh-input text-sm py-2 mt-1 font-mono" placeholder="0000000000" value={bank.account_number} onChange={(e) => updateBank(bank.id, 'account_number', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Type</label>
                  <select className="dh-input text-sm py-2 mt-1" value={bank.type} onChange={(e) => updateBank(bank.id, 'type', e.target.value)}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="opay">OPay</option>
                    <option value="palmpay">PalmPay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => updateBank(bank.id, 'is_active', !bank.is_active)} className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${bank.is_active ? 'bg-dh-purple' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${bank.is_active ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-xs text-gray-600">Active</span>
                  </label>
                  <button onClick={() => saveBankAccounts(bankAccounts.filter((b) => b.id !== bank.id))} className="ml-auto p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {bankAccounts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No payment accounts yet. Add one below.</p>}
        </div>

        <button onClick={() => setBankAccounts((prev) => [...prev, { ...emptyBank, id: generateId() }])} className="flex items-center gap-2 text-sm text-dh-purple font-medium hover:text-dh-purple-dark">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Delivery Options */}
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">🚚 Delivery Options</h2>
          <button onClick={() => saveDeliveryOptions(deliveryOptions)} disabled={saving['delivery_options']} className="dh-btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['delivery_options'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>

        <div className="space-y-3">
          {deliveryOptions.map((opt) => (
            <div key={opt.id} className="bg-blue-50 rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Label</label>
                  <input className="dh-input text-sm py-2 mt-1" placeholder="e.g. Home Delivery" value={opt.label} onChange={(e) => updateDelivery(opt.id, 'label', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Type</label>
                  <select className="dh-input text-sm py-2 mt-1" value={opt.type} onChange={(e) => updateDelivery(opt.id, 'type', e.target.value)}>
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Fee (₦)</label>
                  <input type="number" min="0" className="dh-input text-sm py-2 mt-1" placeholder="0" value={opt.fee} onChange={(e) => updateDelivery(opt.id, 'fee', Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => updateDelivery(opt.id, 'is_active', !opt.is_active)} className={`w-10 h-6 rounded-full cursor-pointer transition-colors ${opt.is_active ? 'bg-dh-purple' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${opt.is_active ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-xs text-gray-600">Active</span>
                  </label>
                  <button onClick={() => saveDeliveryOptions(deliveryOptions.filter((d) => d.id !== opt.id))} className="ml-auto p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {deliveryOptions.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No delivery options. Add one below.</p>}
        </div>

        <button onClick={() => setDeliveryOptions((prev) => [...prev, { ...emptyDelivery, id: generateId() }])} className="flex items-center gap-2 text-sm text-dh-purple font-medium hover:text-dh-purple-dark">
          <Plus className="w-4 h-4" /> Add Delivery Option
        </button>
      </div>

      {/* Terms & Privacy */}
      <div className="admin-card space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">📄 Terms & Privacy Policy</h2>
        <div>
          <label className="dh-label">Terms of Service (HTML supported)</label>
          <textarea className="dh-input resize-y min-h-[120px] font-mono text-sm" value={settings.terms ?? ''} onChange={(e) => upd('terms', e.target.value)} placeholder="<p>Enter your terms of service...</p>" />
          <button onClick={() => saveSetting('terms', settings.terms ?? '')} disabled={saving['terms']} className="mt-2 dh-btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['terms'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Terms
          </button>
        </div>
        <div>
          <label className="dh-label">Privacy Policy (HTML supported)</label>
          <textarea className="dh-input resize-y min-h-[120px] font-mono text-sm" value={settings.privacy ?? ''} onChange={(e) => upd('privacy', e.target.value)} placeholder="<p>Enter your privacy policy...</p>" />
          <button onClick={() => saveSetting('privacy', settings.privacy ?? '')} disabled={saving['privacy']} className="mt-2 dh-btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['privacy'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Privacy
          </button>
        </div>
      </div>
    </div>
  );
}
