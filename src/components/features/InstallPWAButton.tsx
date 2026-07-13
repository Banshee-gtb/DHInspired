import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function InstallPWAButton() {
  const { canInstall, isInstalled, installApp } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-4 py-2 rounded-xl">
        <CheckCircle2 className="w-4 h-4" />
        App Installed
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      onClick={installApp}
      className="flex items-center gap-2 bg-dh-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-dh-purple-dark active:scale-95 transition-all duration-200 shadow-md"
    >
      <Download className="w-4 h-4" />
      Install Admin App
    </button>
  );
}
