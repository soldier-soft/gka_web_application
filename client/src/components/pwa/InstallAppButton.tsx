import React from 'react';
import { Download, CheckCircle, Smartphone } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

interface InstallAppButtonProps {
  variant?: 'navbar' | 'mobile-menu' | 'admin-header' | 'admin-sidebar' | 'portal';
  className?: string;
  showInstalledBadge?: boolean;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'navbar',
  className = '',
  showInstalledBadge = false,
}) => {
  const { isInstalled, installApp } = usePwa();

  // If already installed, hide the install button unless badge is requested
  if (isInstalled) {
    if (!showInstalledBadge) return null;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>Installed</span>
      </span>
    );
  }

  // Variant styling
  if (variant === 'navbar') {
    return (
      <button
        onClick={() => installApp()}
        aria-label="Install GKA Construction App"
        title="Install GKA App on your smartphone or computer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-gold-500/15 hover:bg-brand-gold-500/25 text-brand-gold-300 border border-brand-gold-400/40 transition-all ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-brand-gold-400" />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === 'mobile-menu') {
    return (
      <button
        onClick={() => installApp()}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-600 hover:to-brand-gold-700 text-brand-navy-950 shadow-md transition-all ${className}`}
      >
        <Smartphone className="w-4 h-4" />
        <span>Install GKA Mobile App</span>
      </button>
    );
  }

  if (variant === 'admin-header') {
    return (
      <button
        onClick={() => installApp()}
        aria-label="Install App"
        title="Install GKA ERP as a standalone app"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-brand-navy-950 bg-brand-gold-100 hover:bg-brand-gold-200 border border-brand-gold-300 rounded-lg transition-colors shadow-xs ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-brand-gold-700" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (variant === 'admin-sidebar') {
    return (
      <button
        onClick={() => installApp()}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-brand-gold-300 hover:bg-brand-gold-500/10 border border-brand-gold-500/30 transition-all ${className}`}
      >
        <Download className="w-4 h-4 text-brand-gold-400" />
        <span>Install ERP App</span>
      </button>
    );
  }

  if (variant === 'portal') {
    return (
      <button
        onClick={() => installApp()}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-sm transition-all ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install Client App</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => installApp()}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-gold-500 text-brand-navy-950 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>Install App</span>
    </button>
  );
};
