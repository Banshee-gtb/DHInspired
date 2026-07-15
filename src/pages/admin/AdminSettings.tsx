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

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div onClick={onChange} className={`w-10 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 relative ${value ? 'bg-blue-600' : 'bg-navy-600'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </div>
  );

  const SectionCard = ({ title, icon, children, saveKeys }: { title: string; icon?: string; children: React.ReactNode; saveKeys?: string[] }) => (
    <div className="admin-card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-2">
          {icon && <span>{icon}</span>}{title}
        </h2>
        {saveKeys && (
          <button onClick={() => saveSection(saveKeys)} disabled={saving[saveKeys[0]]} className="dh-btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving[saveKeys[0]] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        )}
      </div>
      {children}
    </div>
  );

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      {[...Array(4)].map((_, i) => <div key={i} className="admin-card h-32 skeleton-dark" />)}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">SETTINGS</h1>
        <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Store configuration</p>
      </div>

      {/* Admin Credentials */}
      <SectionCard title="Admin Credentials" icon="🔐" saveKeys={['admin_email', 'admin_password']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="dh-label-dark">Admin Email</label>
            <input className="dh-input-dark" value={settings.admin_email ?? ''} onChange={(e) => upd('admin_email', e.target.value)} placeholder="admin@example.com" />
          </div>
          <div>
            <label className="dh-label-dark">New Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="dh-input-dark pr-12" value={settings.admin_password ?? ''} onChange={(e) => upd('admin_password', e.target.value)} placeholder="New password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-xs text-yellow-400">
          ⚠️ Credential changes take effect immediately. Write them down before saving.
        </div>
      </SectionCard>

      {/* Store Info */}
      <SectionCard title="Store Information" icon="🏪" saveKeys={['store_name', 'store_tagline', 'store_address', 'whatsapp_number']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="dh-label-dark">Store Name</label>
            <input className="dh-input-dark" value={settings.store_name ?? ''} onChange={(e) => upd('store_name', e.target.value)} />
          </div>
          <div>
            <label className="dh-label-dark">Tagline</label>
            <input className="dh-input-dark" value={settings.store_tagline ?? ''} onChange={(e) => upd('store_tagline', e.target.value)} />
          </div>
          <div>
            <label className="dh-label-dark">WhatsApp Number</label>
            <input className="dh-input-dark" placeholder="e.g. 2348012345678" value={settings.whatsapp_number ?? ''} onChange={(e) => upd('whatsapp_number', e.target.value)} />
          </div>
          <div>
            <label className="dh-label-dark">Store Address</label>
            <input className="dh-input-dark" placeholder="Physical address (for pickup)" value={settings.store_address ?? ''} onChange={(e) => upd('store_address', e.target.value)} />
          </div>
        </div>
      </SectionCard>

      {/* Social Links */}
      <SectionCard title="Social Links" icon="📱" saveKeys={['instagram_url', 'tiktok_url', 'twitter_url', 'shopify_url']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
            { key: 'tiktok_url', label: 'TikTok URL', placeholder: 'https://tiktok.com/@...' },
            { key: 'twitter_url', label: 'X (Twitter) URL', placeholder: 'https://x.com/...' },
            { key: 'shopify_url', label: 'Shopify Store URL', placeholder: 'https://yourstore.myshopify.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="dh-label-dark">{label}</label>
              <input className="dh-input-dark" placeholder={placeholder} value={settings[key] ?? ''} onChange={(e) => upd(key, e.target.value)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600">Leave blank to hide the icon in the footer.</p>
      </SectionCard>

      {/* Bank Accounts */}
      <div className="admin-card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white text-sm uppercase tracking-widest">💳 Bank Accounts</h2>
          <button onClick={() => saveBankAccounts(bankAccounts)} disabled={saving['bank_accounts']} className="dh-btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['bank_accounts'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save All
          </button>
        </div>
        <p className="text-xs text-gray-500">Customers select from these at checkout for payment.</p>

        <div className="space-y-3">
          {bankAccounts.map((bank) => (
            <div key={bank.id} className="bg-navy-900/60 rounded-2xl p-4 space-y-3 border border-navy-700/30">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Bank / Service</label>
                  <input className="dh-input-dark text-sm py-2 mt-1" placeholder="e.g. GTBank" value={bank.bank_name} onChange={(e) => updateBank(bank.id, 'bank_name', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Account Name</label>
                  <input className="dh-input-dark text-sm py-2 mt-1" placeholder="Account holder" value={bank.account_name} onChange={(e) => updateBank(bank.id, 'account_name', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Account Number</label>
                  <input className="dh-input-dark text-sm py-2 mt-1 font-mono" placeholder="0000000000" value={bank.account_number} onChange={(e) => updateBank(bank.id, 'account_number', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Type</label>
                  <select className="dh-input-dark text-sm py-2 mt-1" value={bank.type} onChange={(e) => updateBank(bank.id, 'type', e.target.value)}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="opay">OPay</option>
                    <option value="palmpay">PalmPay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Toggle value={bank.is_active} onChange={() => updateBank(bank.id, 'is_active', !bank.is_active)} />
                    <span className="text-xs text-gray-400">Active</span>
                  </label>
                  <button onClick={() => saveBankAccounts(bankAccounts.filter((b) => b.id !== bank.id))} className="ml-auto p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {bankAccounts.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-6 bg-navy-900/30 rounded-xl">No payment accounts yet.</p>
          )}
        </div>

        <button onClick={() => setBankAccounts((prev) => [...prev, { ...emptyBank, id: generateId() }])} className="flex items-center gap-2 text-sm text-blue-400 font-bold hover:text-blue-300 transition-colors">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Delivery Options */}
      <div className="admin-card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white text-sm uppercase tracking-widest">🚚 Delivery Options</h2>
          <button onClick={() => saveDeliveryOptions(deliveryOptions)} disabled={saving['delivery_options']} className="dh-btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['delivery_options'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save All
          </button>
        </div>

        <div className="space-y-3">
          {deliveryOptions.map((opt) => (
            <div key={opt.id} className="bg-navy-900/60 rounded-2xl p-4 border border-navy-700/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Label</label>
                  <input className="dh-input-dark text-sm py-2 mt-1" placeholder="e.g. Home Delivery" value={opt.label} onChange={(e) => updateDelivery(opt.id, 'label', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Type</label>
                  <select className="dh-input-dark text-sm py-2 mt-1" value={opt.type} onChange={(e) => updateDelivery(opt.id, 'type', e.target.value)}>
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Fee (₦)</label>
                  <input type="number" min="0" className="dh-input-dark text-sm py-2 mt-1" placeholder="0" value={opt.fee} onChange={(e) => updateDelivery(opt.id, 'fee', Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Toggle value={opt.is_active} onChange={() => updateDelivery(opt.id, 'is_active', !opt.is_active)} />
                    <span className="text-xs text-gray-400">Active</span>
                  </label>
                  <button onClick={() => saveDeliveryOptions(deliveryOptions.filter((d) => d.id !== opt.id))} className="ml-auto p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {deliveryOptions.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-6 bg-navy-900/30 rounded-xl">No delivery options yet.</p>
          )}
        </div>

        <button onClick={() => setDeliveryOptions((prev) => [...prev, { ...emptyDelivery, id: generateId() }])} className="flex items-center gap-2 text-sm text-blue-400 font-bold hover:text-blue-300 transition-colors">
          <Plus className="w-4 h-4" /> Add Delivery Option
        </button>
      </div>

      {/* Terms & Privacy */}
      <div className="admin-card space-y-5">
        <h2 className="font-black text-white text-sm uppercase tracking-widest">📄 Terms & Privacy Policy</h2>
        <div>
          <label className="dh-label-dark">Terms of Service (HTML supported)</label>
          <textarea className="dh-input-dark resize-y min-h-[120px] font-mono text-sm mt-1" value={settings.terms ?? ''} onChange={(e) => upd('terms', e.target.value)} placeholder="<p>Enter your terms of service...</p>" />
          <button onClick={() => saveSetting('terms', settings.terms ?? '')} disabled={saving['terms']} className="mt-2 dh-btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['terms'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Terms
          </button>
        </div>
        <div>
          <label className="dh-label-dark">Privacy Policy (HTML supported)</label>
          <textarea className="dh-input-dark resize-y min-h-[120px] font-mono text-sm mt-1" value={settings.privacy ?? ''} onChange={(e) => upd('privacy', e.target.value)} placeholder="<p>Enter your privacy policy...</p>" />
          <button onClick={() => saveSetting('privacy', settings.privacy ?? '')} disabled={saving['privacy']} className="mt-2 dh-btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-60">
            {saving['privacy'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Privacy
          </button>
        </div>
      </div>
    </div>
  );
}
