import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck, HardHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GKA_COMPANY } from '@shared/constants';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('owner@gkaconstruction.com');
  const [password, setPassword] = useState('GKAadmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      // If client, navigate to client portal, otherwise admin dashboard
      if (email.includes('gingerhotel') || email.includes('client')) {
        navigate('/client-portal');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetUser = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
  };

  return (
    <div className="min-h-screen gradient-navy flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-navy-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <img src="/logo.png" alt="GKA Logo" className="h-14 w-auto drop-shadow-md group-hover:scale-105 transition-transform" />
          <div className="text-left">
            <span className="text-2xl font-heading font-extrabold tracking-wider text-white">
              GKA <span className="text-brand-gold-400">ERP</span>
            </span>
            <p className="text-[10px] text-slate-300 tracking-wider uppercase font-medium">
              Enterprise & Client Portal
            </p>
          </div>
        </Link>
        <p className="text-xs text-slate-300">
          Sign in to access your projects, finance, site operations, or client progress.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100 space-y-6">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gkaconstruction.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Selector for Easy Testing & Demo */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Role Login (Demo & Testing):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPresetUser('owner@gkaconstruction.com', 'GKAadmin2026!')}
                className="p-2 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 font-semibold"
              >
                👑 Owner / Admin
                <span className="block text-[10px] font-normal text-amber-700">Full Business ERP</span>
              </button>

              <button
                type="button"
                onClick={() => setPresetUser('pm@gkaconstruction.com', 'GKApm2026!')}
                className="p-2 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-900 font-semibold"
              >
                📋 Project Manager
                <span className="block text-[10px] font-normal text-blue-700">Milestones & Quotes</span>
              </button>

              <button
                type="button"
                onClick={() => setPresetUser('supervisor@gkaconstruction.com', 'GKAsuper2026!')}
                className="p-2 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-900 font-semibold"
              >
                👷 Site Supervisor
                <span className="block text-[10px] font-normal text-emerald-700">Mobile Site Diary</span>
              </button>

              <button
                type="button"
                onClick={() => setPresetUser('accounts@gkaconstruction.com', 'GKAaccounts2026!')}
                className="p-2 text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-900 font-semibold"
              >
                📊 Accounts Lead
                <span className="block text-[10px] font-normal text-purple-700">Invoices & Finance</span>
              </button>
            </div>

            <div className="mt-2">
              <button
                type="button"
                onClick={() => setPresetUser('client@gingerhotel.com', 'GKAclient2026!')}
                className="w-full p-2 text-left bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg text-cyan-900 font-semibold text-xs flex justify-between items-center"
              >
                <div>
                  🏨 Client Portal: Ginger Hotel
                  <span className="block text-[10px] font-normal text-cyan-700">Progress, Photos & Invoices</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-700" />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="text-brand-gold-400 hover:underline">
            ← Return to GKA Construction Website
          </Link>
        </p>
      </div>
    </div>
  );
};
