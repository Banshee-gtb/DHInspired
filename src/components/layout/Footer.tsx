import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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

function ShopifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.924 7.625a1.523 1.523 0 00-1.238-1.044l-1.399-.19c-.07-.47-.285-.908-.642-1.264A2.366 2.366 0 0016 4.2c-.02 0-.041 0-.06.003l-.492-.724A2.374 2.374 0 0013.5 2.46a2.37 2.37 0 00-2.263 1.636L9.672 4.59c-.615.16-1.073.627-1.234 1.243l-2.41 9.23a.497.497 0 00.48.624h10.98a.497.497 0 00.484-.382l2.018-7.29a.497.497 0 00-.066-.39zM13.5 3.46c.42 0 .8.23 1.014.586l.375.55-.847.222a2.366 2.366 0 00-1.076-.847l.534-.511zM12 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
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

export default function Footer() {
  const [socials, setSocials] = useState<SocialLinks>({
    instagram_url: '',
    tiktok_url: '',
    twitter_url: '',
    shopify_url: '',
    whatsapp_number: '',
  });

  useEffect(() => {
    const fetchSocials = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['instagram_url', 'tiktok_url', 'twitter_url', 'shopify_url', 'whatsapp_number']);
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
    };
    fetchSocials();
  }, []);

  const socialLinks = [
    {
      href: socials.instagram_url,
      icon: <InstagramIcon />,
      label: 'Instagram',
      color: 'hover:text-pink-600',
    },
    {
      href: socials.tiktok_url,
      icon: <TikTokIcon />,
      label: 'TikTok',
      color: 'hover:text-gray-900',
    },
    {
      href: socials.whatsapp_number ? `https://wa.me/${socials.whatsapp_number.replace(/\D/g, '')}` : '',
      icon: <WhatsAppIcon />,
      label: 'WhatsApp',
      color: 'hover:text-green-500',
    },
    {
      href: socials.twitter_url,
      icon: <XIcon />,
      label: 'X (Twitter)',
      color: 'hover:text-gray-900',
    },
    {
      href: socials.shopify_url,
      icon: <ShopifyIcon />,
      label: 'Shopify',
      color: 'hover:text-[#95BF47]',
    },
  ];

  return (
    <footer className="bg-dh-purple-darker text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-6 h-6 text-dh-purple-light" />
              <span className="font-display font-bold text-xl text-white">DH-Inspired</span>
            </div>
            <p className="text-purple-300 text-sm leading-relaxed">
              Curated fashion for those who lead. Elevate your style, own your look.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-purple-300 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/checkout" className="hover:text-white transition-colors">Checkout</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-white mb-4">Follow Us</h4>
            <div className="flex gap-4">
              {socialLinks.map((s) =>
                s.href ? (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`text-purple-300 transition-colors duration-200 ${s.color}`}
                  >
                    {s.icon}
                  </a>
                ) : (
                  <span
                    key={s.label}
                    className="text-purple-600 cursor-not-allowed"
                    title={`${s.label} not configured`}
                  >
                    {s.icon}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-purple-400 text-sm">
          <p>© {new Date().getFullYear()} DH-Inspired. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/products?page=terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/products?page=privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
