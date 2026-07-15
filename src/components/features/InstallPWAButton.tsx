import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useEffect } from 'react';

export default function InstallPWAButton() {
  const { canInstall, isInstalled, installApp } = usePWAInstall();

  // Dynamically add manifest link only when on admin pages
  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]');
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, []);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-xs font-black tracking-widest uppercase bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5">
        <CheckCircle2 className="w-4 h-4" />
        App Installed
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      onClick={installApp}
      className="flex items-center gap-2 bg-blue-600 text-white text-xs font-black tracking-widest uppercase px-5 py-2.5 rounded-xl hover:bg-blue-500 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/20"
    >
      <Download className="w-4 h-4" />
      INSTALL APP
    </button>
  );
}
