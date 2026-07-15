import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SocialLinks {
  instagram_url: string;
  tiktok_url: string;
  twitter_url: string;
  shopify_url: string;
  whatsapp_number: string;
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.53V6.77a4.85 4.85 0 01-1-.08z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
function ShopifyBagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M15.337 23.979l7.216-1.561s-2.604-17.609-2.625-17.73c-.019-.119-.12-.198-.234-.198-.114 0-2.112-.044-2.112-.044s-1.408-1.37-1.571-1.532v21.065zM13.395 6.005c-.015.044-1.605.497-1.605.497s-.953-2.738-2.846-2.738c-.042 0-.083.003-.125.007.374-1.393 1.046-2.072 1.621-2.325 1.392 1.016 2.562 2.984 2.955 4.559zM9.75 3.967c-.062.019-.124.04-.185.062C9.2 2.649 8.314 1.548 7.099 1.003c.434.073.88.278 1.305.683.543.509.993 1.259 1.346 2.281zM6.765 1.201C5.479 1.706 4.498 3.337 4.063 5.724c-.84.259-1.65.509-1.651.509L.374 23.979 15.337 24V2.956l-.049.013c-.428-.858-1.044-1.422-1.752-1.603-.047-.012-.099-.02-.151-.025-.048-.005-.097-.008-.145-.008-.852 0-1.796.617-2.598 1.694-.038.052-.077.107-.116.163-.071-.199-.149-.39-.234-.575-.591-1.278-1.456-2.15-2.527-2.414z"/>
    </svg>
  );
}

const MARQUEE_ITEMS = [
  'STREETWEAR', 'UNISEX FASHION', 'NEW ARRIVALS', 'QUALITY FITS', 'URBAN STYLE',
  'DH-INSPIRED', 'STREETWEAR', 'UNISEX FASHION', 'NEW ARRIVALS', 'QUALITY FITS', 'URBAN STYLE',
  'DH-INSPIRED',
];

export default function Footer() {
  const [socials, setSocials] = useState<SocialLinks>({
    instagram_url: '', tiktok_url: '', twitter_url: '', shopify_url: '', whatsapp_number: '',
  });

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['instagram_url', 'tiktok_url', 'twitter_url', 'shopify_url', 'whatsapp_number'])
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
          setSocials({
            instagram_url: map.instagram_url || '',
            tiktok_url: map.tiktok_url || '',
            twitter_url: map.twitter_url || '',
            shopify_url: map.shopify_url || '',
            whatsapp_number: map.whatsapp_number || '',
          });
        }
      });
  }, []);

  const socialLinks = [
    { href: socials.instagram_url, icon: <InstagramIcon />, label: 'Instagram', hoverClass: 'hover:text-pink-500 hover:border-pink-300 hover:bg-pink-50' },
    { href: socials.tiktok_url, icon: <TikTokIcon />, label: 'TikTok', hoverClass: 'hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50' },
    { href: socials.whatsapp_number ? `https://wa.me/${socials.whatsapp_number.replace(/\D/g, '')}` : '', icon: <WhatsAppIcon />, label: 'WhatsApp', hoverClass: 'hover:text-green-600 hover:border-green-400 hover:bg-green-50' },
    { href: socials.twitter_url, icon: <XIcon />, label: 'X', hoverClass: 'hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50' },
    { href: socials.shopify_url, icon: <ShopifyBagIcon />, label: 'Shopify', hoverClass: 'hover:text-[#95bf47] hover:border-[#95bf47] hover:bg-[#95bf47]/10' },
  ];

  return (
    <footer className="bg-navy-950 text-white">
      {/* Marquee */}
      <div className="overflow-hidden border-y border-white/5 bg-navy-900 py-3">
        <div className="flex animate-marquee whitespace-nowrap gap-10">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="text-xs font-black tracking-[0.3em] text-gray-600 uppercase">
              {item} <span className="text-blue-700 mx-3">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <img src="/logo.png" alt="DH-Inspired" className="w-10 h-10 rounded-xl object-cover" />
              <span className="font-display text-2xl text-white tracking-widest group-hover:text-blue-400 transition-colors">DH-INSPIRED</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Unisex streetwear and fashion trends. Built for those who move different. Quality fits, bold style.
            </p>

            <div className="flex gap-2 mt-6">
              {socialLinks.map((s) =>
                s.href ? (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 border border-white/10 transition-all duration-200 ${s.hoverClass}`}
                  >
                    {s.icon}
                  </a>
                ) : (
                  <span
                    key={s.label}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-700 border border-white/5 cursor-not-allowed"
                  >
                    {s.icon}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-5">Navigate</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'Shop All' },
                { to: '/checkout', label: 'Checkout' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase mb-5">Info</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>Guest checkout — no account needed</li>
              <li>Bank transfer payment</li>
              <li>Delivery & pickup available</li>
              {socials.whatsapp_number && (
                <li>
                  <a
                    href={`https://wa.me/${socials.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 font-semibold transition-colors"
                  >
                    Chat on WhatsApp →
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs tracking-widest uppercase">
            © {new Date().getFullYear()} DH-Inspired. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-xs tracking-widest uppercase">
            <Link to="/products?page=terms" className="text-gray-600 hover:text-white transition-colors">Terms</Link>
            <Link to="/products?page=privacy" className="text-gray-600 hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
