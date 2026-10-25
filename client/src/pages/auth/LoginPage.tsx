import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GKA_COMPANY } from '@shared/constants';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const QUICK_ACCOUNTS = [
    { label: '👑 Owner', email: 'owner@gkaconstruction.com', pass: 'GKAadmin2026!' },
    { label: '📋 PM', email: 'pm@gkaconstruction.com', pass: 'GKApm2026!' },
    { label: '🏗️ Supervisor', email: 'supervisor@gkaconstruction.com', pass: 'GKAsuper2026!' },
    { label: '💼 Accounts', email: 'accounts@gkaconstruction.com', pass: 'GKAaccounts2026!' },
    { label: '🏨 Client', email: 'client@gingerhotel.com', pass: 'GKAclient2026!' },
  ];

  const handleQuickFill = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      const role = loggedUser?.role;

      // Route each role to its designated workspace
      if (role === 'client' || email.includes('gingerhotel') || email.includes('client')) {
        navigate('/client-portal');
      } else if (role === 'site_supervisor') {
        navigate('/admin/site-ops');
      } else if (role === 'accounts') {
        navigate('/admin/finance');
      } else if (role === 'project_manager') {
        navigate('/admin/projects');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Quick-Fill Role Selector for Instant One-Click Access */}
          <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Click Role Login Selector
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email, acc.pass)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    email === acc.email
                      ? 'bg-brand-navy-900 text-white border-brand-navy-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

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

          {/* Security & Access Notice */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-Bit SSL Encrypted Session</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Authorized Access Only</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed text-center">
              Staff, field supervisors, and registered clients can contact administration at{' '}
              <a href={`tel:${GKA_COMPANY.phoneDisplay}`} className="text-brand-navy-950 hover:text-brand-gold-600 font-semibold">
                +91 {GKA_COMPANY.phoneDisplay}
              </a>{' '}
              for account activation or credential resets.
            </p>
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
