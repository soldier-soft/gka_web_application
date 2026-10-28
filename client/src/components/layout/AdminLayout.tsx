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
  Sparkles,
  Receipt,
  FileSpreadsheet,
  User as UserIcon,
  KeyRound,
  Lock,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GKA_COMPANY } from '@shared/constants';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Quick Change Password Modal state across all admin pages
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const handleQuickPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPass) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New password and confirm password do not match.');
      return;
    }

    setIsSubmittingPass(true);
    try {
      const res = await api.changePassword({
        currentPassword: currentPass,
        newPassword: newPass,
      });

      if (res.success) {
        setPassSuccess('Password updated successfully!');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => {
          setShowChangePassModal(false);
          setPassSuccess('');
        }, 2500);
      }
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'CRM & Leads', path: '/admin/crm', icon: Users },
    { name: 'Client Profiles', path: '/admin/clients', icon: UserCheck },
    { name: 'Projects', path: '/admin/projects', icon: Briefcase },
    { name: 'Portfolio & Ideas', path: '/admin/portfolio', icon: Sparkles },
    { name: 'Quotations & Estimator', path: '/admin/quotations', icon: Calculator },
    { name: 'Invoices & Billing', path: '/admin/invoices', icon: FileSpreadsheet },
    { name: 'Site Operations', path: '/admin/site-ops', icon: Camera },
    { name: 'Inventory & Materials', path: '/admin/inventory', icon: Boxes },
    { name: 'Finance & Profitability', path: '/admin/finance', icon: IndianRupee },
    { name: 'GST & Tax Settlement', path: '/admin/finance?tab=gst', icon: Receipt },
    { name: 'My Profile', path: '/admin/profile', icon: UserIcon },
  ];

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
            const isCurrentQuery = item.path.includes('?');
            const isActive = isCurrentQuery
              ? (location.pathname + location.search) === item.path
              : location.pathname === item.path ||
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path) && !location.search);
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
            <Link
              to="/admin/profile"
              title="View & Edit Profile"
              className="flex items-center gap-3 flex-1 min-w-0 group hover:opacity-90 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-brand-gold-500/20 border border-brand-gold-400/40 flex items-center justify-center font-bold text-brand-gold-300 text-sm group-hover:border-brand-gold-400 transition-colors">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-brand-gold-300 transition-colors">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </Link>
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

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Change Password across all admin pages */}
            <button
              onClick={() => {
                setShowChangePassModal(true);
                setPassSuccess('');
                setPassError('');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-brand-navy-950 bg-brand-gold-100 hover:bg-brand-gold-200 border border-brand-gold-300 rounded-lg transition-colors shadow-xs"
              title="Change your account password"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-gold-700" />
              <span className="hidden md:inline">Change Password</span>
            </button>

            <Link
              to="/admin/profile"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-brand-navy-900 text-brand-gold-400 font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
              </div>
            </Link>

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

      {/* Global Change Password Modal across all Admin ERP Pages */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-gold-100 text-brand-gold-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">Change Account Password</h3>
                  <p className="text-[11px] text-slate-500">Update login password for {user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {passSuccess && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleQuickPasswordChange} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurPass ? 'text' : 'password'}
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurPass(!showCurPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showCurPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfPass ? 'text' : 'password'}
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfPass(!showConfPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPass}
                  className="px-5 py-2 rounded-lg bg-brand-navy-900 text-white font-bold hover:bg-brand-navy-800 transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingPass ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
