import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calculator,
  Camera,
  Boxes,
  IndianRupee,
  Eye,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GKA_COMPANY } from '@shared/constants';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'CRM & Leads', path: '/admin/crm', icon: Users },
    { name: 'Projects', path: '/admin/projects', icon: Briefcase },
    { name: 'Quotations & Estimator', path: '/admin/quotations', icon: Calculator },
    { name: 'Site Operations', path: '/admin/site-ops', icon: Camera },
    { name: 'Inventory & Materials', path: '/admin/inventory', icon: Boxes },
    { name: 'Finance & Profitability', path: '/admin/finance', icon: IndianRupee },
  ];

  const handleRoleSwitch = async (roleEmail: string) => {
    // Quick role switch for testing and demos
    const passwords: Record<string, string> = {
      'owner@gkaconstruction.com': 'GKAadmin2026!',
      'pm@gkaconstruction.com': 'GKApm2026!',
      'supervisor@gkaconstruction.com': 'GKAsuper2026!',
      'accounts@gkaconstruction.com': 'GKAaccounts2026!',
      'client@gingerhotel.com': 'GKAclient2026!',
    };

    const pass = passwords[roleEmail];
    if (pass) {
      await login(roleEmail, pass);
      if (roleEmail === 'client@gingerhotel.com') {
        navigate('/client-portal');
      } else {
        navigate('/admin/dashboard');
      }
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-300">Owner / Super Admin</span>;
      case 'project_manager':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-300">Project Manager</span>;
      case 'site_supervisor':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">Site Supervisor</span>;
      case 'accounts':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-800 rounded-full border border-purple-300">Accounts Lead</span>;
      case 'client':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-100 text-cyan-800 rounded-full border border-cyan-300">Client Account</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-800 rounded-full">User</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-navy-900 border-r border-brand-navy-800 text-slate-200 shrink-0 select-none">
        {/* Brand header */}
        <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3">
          <img src="/logo.png" alt="GKA Logo" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-base tracking-wider text-white">
              GKA <span className="text-brand-gold-400">ERP</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Operating System
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-navy-800 text-brand-gold-400 shadow-sm border border-brand-navy-700 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-gold-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-white/10 mt-4">
            <Link
              to="/client-portal"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-brand-teal-300 hover:bg-brand-teal-900/30 border border-brand-teal-500/20 transition-all"
            >
              <Eye className="w-4 h-4 text-brand-teal-400" />
              <span>Preview Client Portal</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all mt-1"
            >
              <span>← Back to Public Website</span>
            </Link>
          </div>
        </nav>

        {/* User profile card */}
        <div className="p-4 border-t border-white/10 bg-brand-navy-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-gold-500/20 border border-brand-gold-400/40 flex items-center justify-center font-bold text-brand-gold-300 text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top ERP Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-brand-navy-900">GKA Construction</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="capitalize">{location.pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}</span>
            </div>
          </div>

          {/* Quick Role Switcher for seamless testing */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-1">
              <span className="text-slate-500 px-2 font-medium">Switch Role:</span>
              <button
                onClick={() => handleRoleSwitch('owner@gkaconstruction.com')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  user?.role === 'super_admin' ? 'bg-amber-600 text-white' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Owner
              </button>
              <button
                onClick={() => handleRoleSwitch('pm@gkaconstruction.com')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  user?.role === 'project_manager' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                PM
              </button>
              <button
                onClick={() => handleRoleSwitch('supervisor@gkaconstruction.com')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  user?.role === 'site_supervisor' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Supervisor
              </button>
              <button
                onClick={() => handleRoleSwitch('accounts@gkaconstruction.com')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  user?.role === 'accounts' ? 'bg-purple-600 text-white' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Accounts
              </button>
            </div>

            <div className="flex items-center gap-2">
              {getRoleBadge(user?.role)}
              <button
                onClick={logout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="md:hidden bg-brand-navy-900 border-b border-brand-navy-800 p-4 space-y-1.5 z-50 text-slate-200">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10"
              >
                <item.icon className="w-4 h-4 text-brand-gold-400" />
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                to="/client-portal"
                onClick={() => setSidebarOpen(false)}
                className="text-xs text-brand-teal-300 py-1"
              >
                Preview Client Portal →
              </Link>
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="text-xs text-slate-400 py-1"
              >
                ← Back to Public Website
              </Link>
            </div>
          </div>
        )}

        {/* Child Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
