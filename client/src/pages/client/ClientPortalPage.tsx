import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Camera,
  FileDown,
  Phone,
  Mail,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  LogOut,
  CreditCard,
  Copy,
  Check,
  Send,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  Eye,
  User as UserIcon,
  Lock,
  KeyRound,
  Save,
  RefreshCw,
  EyeOff,
  Building2,
  BadgeCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '@shared/types';
import { GKA_COMPANY } from '@shared/constants';

export const ClientPortalPage: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active view tab in Client Portal
  const [activePortalTab, setActivePortalTab] = useState<
    'overview' | 'milestones' | 'photos' | 'billing' | 'feedback' | 'profile'
  >('overview');

  // Copy bank details state
  const [copiedBank, setCopiedBank] = useState(false);

  // Payment Notification modal/form
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmountRupees, setPayAmountRupees] = useState('');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payTxnRef, setPayTxnRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Feedback / Query ticket modal/form
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<string>('site_query');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  // Client Profile state
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [profileSubTab, setProfileSubTab] = useState<'info' | 'edit' | 'password'>('info');
  const [profileEditName, setProfileEditName] = useState(user?.name || '');
  const [profileEditPhone, setProfileEditPhone] = useState(user?.phone || '');
  const [profileEditCompany, setProfileEditCompany] = useState('');
  const [profileEditAltPhone, setProfileEditAltPhone] = useState('');
  const [profileEditStreet, setProfileEditStreet] = useState('');
  const [profileEditCity, setProfileEditCity] = useState('');
  const [profileEditPincode, setProfileEditPincode] = useState('');
  const [isSavingClientProfile, setIsSavingClientProfile] = useState(false);
  const [clientProfileSuccess, setClientProfileSuccess] = useState('');
  const [clientProfileError, setClientProfileError] = useState('');

  // Client Change Password state
  const [clientCurrentPass, setClientCurrentPass] = useState('');
  const [clientNewPass, setClientNewPass] = useState('');
  const [clientConfirmPass, setClientConfirmPass] = useState('');
  const [showClientCurPass, setShowClientCurPass] = useState(false);
  const [showClientNewPass, setShowClientNewPass] = useState(false);
  const [showClientConfPass, setShowClientConfPass] = useState(false);
  const [isChangingClientPass, setIsChangingClientPass] = useState(false);
  const [clientPassSuccess, setClientPassSuccess] = useState('');
  const [clientPassError, setClientPassError] = useState('');

  useEffect(() => {
    const fetchClientProjects = async () => {
      try {
        setLoading(true);
        let res;
        if (user?.role === 'client') {
          res = await api.getClientProjects();
        } else {
          // If staff previewing portal, fetch all projects
          res = await api.getProjects();
        }

        if (res.success && res.projects && res.projects.length > 0) {
          setProjects(res.projects);
          setSelectedProjectId(res.projects[0]._id);
        }
      } catch (error) {
        console.error('Error fetching client projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientProjects();
    fetchClientProfile();
  }, [user]);

  const fetchProjectDetails = async (projId: string) => {
    if (!projId) return;
    try {
      const res = await api.getClientProjectDetails(projId);
      if (res.success) {
        setProjectData(res);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCopyBankDetails = () => {
    const text = `GKA CONSTRUCTION - Official Bank Transfer Details:
BENEFICIARY NAME: ${GKA_COMPANY.bankDetails.beneficiary}
ACCOUNT NUMBER: ${GKA_COMPANY.bankDetails.accountNumber}
BANK NAME: ${GKA_COMPANY.bankDetails.bankName}
BANK IFSC CODE: ${GKA_COMPANY.bankDetails.ifscCode}
MOBILE NUMBER: ${GKA_COMPANY.bankDetails.contactMobile}
ALTERNATE NUMBER: ${GKA_COMPANY.bankDetails.alternateMobile || '8940455917'}
MICR CODE: ${GKA_COMPANY.bankDetails.micr}
MAIL ID: ${(GKA_COMPANY.bankDetails.email || GKA_COMPANY.email).toUpperCase()}
WEBSITE: ${(GKA_COMPANY.bankDetails.website || GKA_COMPANY.website).toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 3000);
  };

  const handleSubmitPaymentClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmountRupees || !payTxnRef) {
      alert('Please enter amount and bank transaction reference.');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      const amountPaise = Math.round(Number(payAmountRupees) * 100);
      const res = await api.submitClientPayment({
        projectId: selectedProjectId,
        invoiceId: payInvoiceId || undefined,
        amountPaise,
        paymentDate: payDate,
        transactionReference: payTxnRef,
        notes: payNotes,
      });

      if (res.success) {
        setPaymentSuccessMsg(res.message);
        setPayAmountRupees('');
        setPayTxnRef('');
        setPayNotes('');
        fetchProjectDetails(selectedProjectId);
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccessMsg('');
        }, 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting payment claim');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSubject || !feedbackMessage) {
      alert('Please enter subject and message details.');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      const res = await api.submitClientFeedback({
        projectId: selectedProjectId,
        category: feedbackCategory,
        subject: feedbackSubject,
        message: feedbackMessage,
      });

      if (res.success) {
        setFeedbackSuccessMsg(res.message);
        setFeedbackSubject('');
        setFeedbackMessage('');
        fetchProjectDetails(selectedProjectId);
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackSuccessMsg('');
        }, 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting request');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const fetchClientProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.user) {
        setClientProfile(res.user);
        setProfileEditName(res.user.name || '');
        setProfileEditPhone(res.user.phone || '');
        if (res.user.clientDetails) {
          setProfileEditCompany(res.user.clientDetails.companyName || '');
          setProfileEditAltPhone(res.user.clientDetails.alternatePhone || '');
          setProfileEditStreet(res.user.clientDetails.billingAddress?.street || '');
          setProfileEditCity(res.user.clientDetails.billingAddress?.city || '');
          setProfileEditPincode(res.user.clientDetails.billingAddress?.pincode || '');
        }
      }
    } catch (e: any) {
      console.warn('Could not fetch client profile:', e.message);
    }
  };

  const handleSaveClientProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientProfileError('');
    setClientProfileSuccess('');

    if (!profileEditName.trim()) {
      setClientProfileError('Contact person name is required.');
      return;
    }
    if (!profileEditPhone.trim()) {
      setClientProfileError('Primary phone number is required.');
      return;
    }

    setIsSavingClientProfile(true);
    try {
      const res = await api.updateProfile({
        name: profileEditName.trim(),
        phone: profileEditPhone.trim(),
        companyName: profileEditCompany.trim(),
        alternatePhone: profileEditAltPhone.trim(),
        billingAddress: {
          street: profileEditStreet.trim(),
          city: profileEditCity.trim(),
          pincode: profileEditPincode.trim(),
        },
      });

      if (res.success) {
        setClientProfileSuccess('Profile and billing details updated successfully!');
        if (user) {
          setUser({
            ...user,
            name: profileEditName.trim(),
            phone: profileEditPhone.trim(),
          });
        }
        fetchClientProfile();
        setTimeout(() => setClientProfileSuccess(''), 3500);
      }
    } catch (err: any) {
      setClientProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingClientProfile(false);
    }
  };

  const handleChangeClientPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientPassError('');
    setClientPassSuccess('');

    if (!clientCurrentPass) {
      setClientPassError('Please enter current password.');
      return;
    }
    if (clientNewPass.length < 6) {
      setClientPassError('New password must be at least 6 characters.');
      return;
    }
    if (clientNewPass !== clientConfirmPass) {
      setClientPassError('New password and confirm password do not match.');
      return;
    }

    setIsChangingClientPass(true);
    try {
      const res = await api.changePassword({
        currentPassword: clientCurrentPass,
        newPassword: clientNewPass,
      });

      if (res.success) {
        setClientPassSuccess('Password updated successfully!');
        setClientCurrentPass('');
        setClientNewPass('');
        setClientConfirmPass('');
        setTimeout(() => setClientPassSuccess(''), 4000);
      }
    } catch (err: any) {
      setClientPassError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingClientPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-brand-navy-900 border-b border-brand-navy-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D6A21D] text-[#07172C] font-extrabold flex items-center justify-center font-heading text-lg shadow-md">
              GKA
            </div>
            <div>
              <span className="text-lg font-heading font-extrabold tracking-wider text-white">
                GKA <span className="text-brand-gold-400">CONSTRUCTION</span>
              </span>
              <p className="text-[10px] text-brand-gold-400 font-semibold uppercase tracking-wider">
                Authorized Client Progress Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePortalTab('profile')}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-left ${
                activePortalTab === 'profile'
                  ? 'bg-brand-navy-800 text-brand-gold-400 border-brand-gold-400 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
              title="View Client Profile"
            >
              <div className="w-8 h-8 rounded-full bg-brand-gold-500 text-brand-navy-950 font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold leading-tight">{user?.name || 'Authorized Client'}</span>
                <span className="text-[10px] text-brand-teal-300">My Profile & Account</span>
              </div>
            </button>

            {user?.role !== 'client' && (
              <Link
                to="/admin/dashboard"
                className="px-3 py-1.5 text-xs font-semibold bg-brand-navy-800 text-brand-gold-400 rounded-lg border border-brand-navy-700 hover:bg-brand-navy-700 transition-colors"
              >
                ← Back to ERP
              </Link>
            )}

            <button
              onClick={logout}
              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Staff Preview Notice Banner */}
      {user?.role !== 'client' && (
        <div className="bg-amber-500 text-[#07172C] py-2 px-4 text-xs font-bold text-center flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          <span>OWNER PREVIEW MODE: You are viewing the exact client portal layout for authorized clients.</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6 w-full">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your project portal...</div>
        ) : !projectData?.project && activePortalTab !== 'profile' ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-4">
            <p>No authorized project active on this account yet. Please contact GKA Construction at {GKA_COMPANY.phoneDisplay}.</p>
            <div>
              <button
                onClick={() => setActivePortalTab('profile')}
                className="px-4 py-2 bg-brand-navy-900 text-white rounded-lg text-xs font-bold hover:bg-brand-navy-800"
              >
                Go to My Profile & Password
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Multi-Project Switcher (if client has multiple properties) */}
            {projects.length > 1 && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-bold px-2">Select Property:</span>
                {projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => setSelectedProjectId(p._id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      selectedProjectId === p._id
                        ? 'bg-[#10203A] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.projectId} - {p.title}
                  </button>
                ))}
              </div>
            )}

            {/* Project Hero Banner & Quick Actions */}
            {projectData?.project && activePortalTab !== 'profile' && (
              <>
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-gold-600 bg-brand-gold-50 px-2.5 py-0.5 rounded border border-brand-gold-200">
                      {projectData.project.projectId}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full capitalize">
                      {projectData.project.status}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-navy-950 mt-1.5">
                    {projectData.project.title}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D6A21D]" />
                    <span>
                      {projectData.project.siteAddress?.street}, {projectData.project.siteAddress?.city}
                    </span>
                  </p>
                </div>

                <div className="bg-brand-navy-900 text-white p-4 rounded-xl text-center shrink-0 min-w-[150px]">
                  <span className="text-[10px] text-brand-gold-400 font-bold uppercase tracking-wider block">
                    Verified Progress
                  </span>
                  <span className="text-3xl font-extrabold font-heading text-white">
                    {projectData.project.progressPercent || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Calculated Milestone Completion</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Overall Construction Completion</span>
                  <span className="font-mono font-bold text-[#10203A]">
                    {projectData.project.progressPercent || 0}% Complete
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10203A] to-[#D6A21D] rounded-full transition-all duration-700"
                    style={{ width: `${projectData.project.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setFeedbackCategory('site_visit_request');
                  setFeedbackSubject('Request for Site Inspection Visit');
                  setShowFeedbackModal(true);
                }}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#D6A21D] flex items-center justify-center shrink-0 group-hover:bg-[#10203A] group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-xs text-[#10203A]">Request Site Visit</strong>
                  <span className="text-[11px] text-slate-500">Schedule on-site walk with engineer</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setFeedbackCategory('additional_requirement');
                  setFeedbackSubject('Additional Requirement / Change Inquiry');
                  setShowFeedbackModal(true);
                }}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#10203A] group-hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-xs text-[#10203A]">Request Estimate / Change</strong>
                  <span className="text-[11px] text-slate-500">Submit variation or design question</span>
                </div>
              </button>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-[#10203A] group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-xs text-[#10203A]">Submit Bank Transfer Proof</strong>
                  <span className="text-[11px] text-slate-500">Submit reference for verification</span>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Portal Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {[
                { id: 'overview', label: 'Stages & Milestones' },
                { id: 'photos', label: `Verified Photos (${projectData.publishedReports?.length || 0})` },
                { id: 'billing', label: 'Invoices & Bank Transfer' },
                { id: 'feedback', label: `Queries & Requests (${projectData.feedbackTickets?.length || 0})` },
                { id: 'profile', label: '👤 My Client Profile & Password' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePortalTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activePortalTab === tab.id
                      ? 'bg-[#10203A] text-white shadow-sm ring-1 ring-[#D6A21D]'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: STAGES & MILESTONES */}
            {activePortalTab === 'overview' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                      Construction Stages & Milestones
                    </h3>
                    <p className="text-xs text-slate-500">Live stage progress validated on site by our engineering team.</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-teal-700 bg-brand-teal-50 px-2.5 py-1 rounded-full border border-brand-teal-200">
                    {projectData.milestones?.filter((m: any) => m.status === 'completed').length || 0} of{' '}
                    {projectData.milestones?.length || 0} Stages Completed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectData.milestones?.map((m: any) => (
                    <div
                      key={m._id}
                      className={`p-4 rounded-xl border transition-all ${
                        m.status === 'completed'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : m.status === 'in_progress'
                          ? 'bg-brand-navy-50/50 border-brand-navy-200'
                          : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="w-6 h-6 rounded-full bg-brand-navy-900 text-brand-gold-400 font-bold text-xs flex items-center justify-center">
                          {m.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                            m.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.status?.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-brand-navy-950 mb-1">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{m.description}</p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Stage Progress</span>
                          <strong className="text-slate-900">{m.progressPercent}%</strong>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-navy-900 rounded-full" style={{ width: `${m.progressPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: VERIFIED PHOTOS */}
            {activePortalTab === 'photos' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                  <Camera className="w-5 h-5 text-brand-navy-900" />
                  <div>
                    <h3 className="text-lg font-heading font-bold text-brand-navy-950">Approved Site Progress Gallery</h3>
                    <p className="text-xs text-slate-500">Verified site photographs published by our supervising engineer.</p>
                  </div>
                </div>

                {projectData.publishedReports?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No site reports published yet.</p>
                ) : (
                  <div className="space-y-6">
                    {projectData.publishedReports.map((report: any) => (
                      <div key={report._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-brand-navy-950 block text-sm">
                              Work Completed on {new Date(report.reportDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </strong>
                            <span className="text-[11px] text-slate-500">Weather: {report.weatherCondition}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            ✓ Verified by Site Engineer
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                          {report.workCompletedSummary}
                        </p>

                        {report.photos && report.photos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                            {report.photos.map((ph: any, i: number) => (
                              <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                                <img src={ph.url} alt={ph.caption} className="h-44 w-full object-cover" />
                                <div className="p-2 text-[11px] text-slate-700">{ph.caption || 'Site inspection photo'}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: BILLING & BANK TRANSFER */}
            {activePortalTab === 'billing' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Invoices */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
                  <h3 className="text-base font-heading font-bold text-brand-navy-950 border-b border-slate-100 pb-3">
                    Billing & Tax Invoices
                  </h3>

                  {projectData.invoices?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No invoices issued yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {projectData.invoices.map((inv: any) => (
                        <div key={inv._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-brand-navy-950 font-bold block">{inv.invoiceNumber}</strong>
                            <span className="text-[11px] text-slate-500">
                              Issued: {new Date(inv.issueDate).toLocaleDateString('en-IN')} • Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                            </span>
                            <div className="flex items-center gap-3 mt-1 font-mono">
                              <span>Total: <strong>{formatINR(inv.totalAmountPaise)}</strong></span>
                              <span className="text-rose-600 font-bold">Due: {formatINR(inv.dueAmountPaise)}</span>
                            </div>
                          </div>

                          <div className="text-right space-y-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize block ${
                                inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status?.replace('_', ' ')}
                            </span>
                            <a
                              href={`/api/v1/finance/invoices/${inv._id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy-900 hover:text-brand-gold-600 underline"
                            >
                              <FileDown className="w-3.5 h-3.5 text-[#D6A21D]" />
                              <span>PDF</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Verified Receipts List */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Payment Submissions & Receipts
                    </h4>
                    {projectData.payments?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No payment claims recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {projectData.payments.map((p: any) => (
                          <div key={p._id} className="p-2.5 bg-white border rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <strong className="text-slate-900 block">{p.paymentNumber}</strong>
                              <span className="text-[11px] text-slate-500">Ref: {p.transactionReference}</span>
                              <span className="block font-mono font-bold text-emerald-700">{formatINR(p.amountPaise)}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.verificationStatus === 'verified' || p.verificationStatus === 'reconciled'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.verificationStatus === 'verification_pending' ? 'Verification Pending' : p.verificationStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Bank Transfer Instructions */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-base font-heading font-bold text-brand-navy-950">
                      GKA Construction — Bank Transfer
                    </h3>
                    <button
                      onClick={handleCopyBankDetails}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBank ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">BENEFICIARY NAME:</span>
                      <strong className="text-slate-900 text-xs font-bold">{GKA_COMPANY.bankDetails.beneficiary}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">ACCOUNT NUMBER:</span>
                      <strong className="text-slate-900 text-xs font-bold tracking-wider">
                        {GKA_COMPANY.bankDetails.accountNumber}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">BANK NAME:</span>
                      <strong className="text-slate-900 text-xs">{GKA_COMPANY.bankDetails.bankName}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">BANK IFSC CODE:</span>
                      <strong className="text-slate-900 text-xs font-bold">{GKA_COMPANY.bankDetails.ifscCode}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">MOBILE NUMBER:</span>
                      <strong className="text-slate-900 text-xs">{GKA_COMPANY.bankDetails.contactMobile}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">ALTERNATE NUMBER:</span>
                      <strong className="text-slate-900 text-xs">{GKA_COMPANY.bankDetails.alternateMobile || '8940455917'}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">MICR CODE:</span>
                      <strong className="text-slate-900 text-xs">{GKA_COMPANY.bankDetails.micr}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">MAIL ID:</span>
                      <strong className="text-slate-900 text-xs uppercase">{GKA_COMPANY.bankDetails.email || GKA_COMPANY.email}</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">WEBSITE:</span>
                      <strong className="text-slate-900 text-xs uppercase">{GKA_COMPANY.bankDetails.website || GKA_COMPANY.website}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    After completing NEFT / RTGS / IMPS transfer, submit your transaction reference number below. It will be marked as <strong>“Verification Pending”</strong> until confirmed by GKA accounts.
                  </p>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#10203A] text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#D6A21D]" />
                    <span>Submit Payment Claim</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: QUERIES & REQUESTS */}
            {activePortalTab === 'feedback' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                      Two-Way Engineering Communication
                    </h3>
                    <p className="text-xs text-slate-500">
                      Submit questions, site visit requests, or variation inquiries. Each request receives a tracked reference ticket.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#10203A] text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 text-[#D6A21D]" />
                    <span>Submit New Ticket</span>
                  </button>
                </div>

                {projectData.feedbackTickets?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No questions or variation tickets submitted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {projectData.feedbackTickets.map((t: any) => (
                      <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#10203A] bg-slate-200 px-2 py-0.5 rounded">
                              {t.ticketNumber}
                            </span>
                            <strong className="text-slate-900 text-sm">{t.subject}</strong>
                            <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {t.category?.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(t.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-100">{t.message}</p>

                        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                          <span>Status: <strong className="capitalize text-slate-900">{t.status}</strong></span>
                          {t.adminResponse && (
                            <span className="text-emerald-700 font-medium">Engineer Responded</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: CLIENT PROFILE & ACCOUNT DETAILS */}
            {activePortalTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Hero Summary */}
                <div className="bg-gradient-to-r from-brand-navy-950 via-brand-navy-900 to-brand-navy-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-brand-navy-700/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D6A21D] to-amber-300 text-brand-navy-950 font-extrabold text-2xl flex items-center justify-center font-heading shadow-md">
                        {user?.name?.charAt(0) || 'C'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold font-heading text-white">{user?.name}</h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            Verified Client Account
                          </span>
                        </div>
                        <p className="text-xs text-brand-gold-300">
                          {clientProfile?.clientDetails?.companyName || 'Roots Corporation Ltd / Ginger Hotel'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
                          <span>{user?.email}</span>
                          <span>•</span>
                          <span>+91 {user?.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setProfileSubTab('info')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          profileSubTab === 'info'
                            ? 'bg-[#D6A21D] text-brand-navy-950 shadow-sm'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        Basic Info
                      </button>
                      <button
                        onClick={() => setProfileSubTab('edit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          profileSubTab === 'edit'
                            ? 'bg-[#D6A21D] text-brand-navy-950 shadow-sm'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => setProfileSubTab('password')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          profileSubTab === 'password'
                            ? 'bg-[#D6A21D] text-brand-navy-950 shadow-sm'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

                {/* SubTab 1: Basic Information Overview */}
                {profileSubTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                        <h3 className="font-heading font-bold text-base text-brand-navy-950">Primary Contact Information</h3>
                        <button
                          onClick={() => setProfileSubTab('edit')}
                          className="text-xs font-semibold text-brand-gold-700 bg-brand-gold-50 px-2.5 py-1 rounded-lg border border-brand-gold-200"
                        >
                          Edit Info
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Contact Person</span>
                          <span className="font-bold text-slate-800">{user?.name}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Organization / Entity</span>
                          <span className="font-bold text-slate-800">
                            {clientProfile?.clientDetails?.companyName || 'Roots Corporation Ltd / Ginger Hotel'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Registered Email (Login ID)</span>
                          <span className="font-semibold text-slate-800">{user?.email}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Primary Phone Number</span>
                          <span className="font-semibold text-slate-800">+91 {user?.phone}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Alternate Phone / Landline</span>
                          <span className="font-semibold text-slate-800">
                            {clientProfile?.clientDetails?.alternatePhone || '044-67200000'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Portal Security</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            256-Bit SSL Encrypted
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                        <h3 className="font-heading font-bold text-base text-brand-navy-950">Official Billing & Tax Details</h3>
                        <span className="text-[11px] text-slate-400 font-mono">GST Registered</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">GSTIN</span>
                          <span className="font-mono font-bold text-slate-800">
                            {clientProfile?.clientDetails?.gstin || '33AABCR1234F1ZX'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">PAN Number</span>
                          <span className="font-mono font-bold text-slate-800">
                            {clientProfile?.clientDetails?.pan || 'AABCR1234F'}
                          </span>
                        </div>
                        <div className="py-1.5 border-b border-slate-100 space-y-1">
                          <span className="text-slate-500 block">Registered Billing Address</span>
                          <p className="font-medium text-slate-800 leading-relaxed">
                            {clientProfile?.clientDetails?.billingAddress?.street || 'Ginger Hotel, Rajiv Gandhi Salai (OMR), Navalur'},{' '}
                            {clientProfile?.clientDetails?.billingAddress?.city || 'Chennai'},{' '}
                            {clientProfile?.clientDetails?.billingAddress?.state || 'Tamil Nadu'} -{' '}
                            {clientProfile?.clientDetails?.billingAddress?.pincode || '600130'}
                          </p>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Associated GKA Projects</span>
                          <span className="font-bold text-slate-800">{projects.length || 1} Property</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab 2: Edit Contact Details Form */}
                {profileSubTab === 'edit' && (
                  <div className="max-w-2xl bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
                    <div className="border-b pb-3">
                      <h3 className="font-heading font-bold text-base text-brand-navy-950">Update Contact & Billing Information</h3>
                      <p className="text-xs text-slate-500">Update your primary contact person, phone numbers, and billing address.</p>
                    </div>

                    {clientProfileSuccess && (
                      <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{clientProfileSuccess}</span>
                      </div>
                    )}

                    {clientProfileError && (
                      <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{clientProfileError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveClientProfile} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Contact Person Name</label>
                          <input
                            type="text"
                            required
                            value={profileEditName}
                            onChange={(e) => setProfileEditName(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Primary Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={profileEditPhone}
                            onChange={(e) => setProfileEditPhone(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                          <input
                            type="text"
                            value={profileEditCompany}
                            onChange={(e) => setProfileEditCompany(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Alternate Phone / Landline</label>
                          <input
                            type="tel"
                            value={profileEditAltPhone}
                            onChange={(e) => setProfileEditAltPhone(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Billing Street Address</label>
                        <input
                          type="text"
                          value={profileEditStreet}
                          onChange={(e) => setProfileEditStreet(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            value={profileEditCity}
                            onChange={(e) => setProfileEditCity(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                          <input
                            type="text"
                            value={profileEditPincode}
                            onChange={(e) => setProfileEditPincode(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setProfileSubTab('info')}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingClientProfile}
                          className="px-5 py-2 rounded-lg bg-brand-navy-900 text-white font-bold hover:bg-brand-navy-800 transition-colors flex items-center gap-1.5"
                        >
                          {isSavingClientProfile ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving Details...</span>
                            </>
                          ) : (
                            <span>Save Contact Details</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SubTab 3: Change Password Form */}
                {profileSubTab === 'password' && (
                  <div className="max-w-md bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
                    <div className="border-b pb-3">
                      <h3 className="font-heading font-bold text-base text-brand-navy-950">Change Account Password</h3>
                      <p className="text-xs text-slate-500">Secure your client portal account with a new confidential password.</p>
                    </div>

                    {clientPassSuccess && (
                      <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{clientPassSuccess}</span>
                      </div>
                    )}

                    {clientPassError && (
                      <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{clientPassError}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangeClientPassword} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showClientCurPass ? 'text' : 'password'}
                            required
                            value={clientCurrentPass}
                            onChange={(e) => setClientCurrentPass(e.target.value)}
                            placeholder="Enter existing password"
                            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowClientCurPass(!showClientCurPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showClientCurPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                            type={showClientNewPass ? 'text' : 'password'}
                            required
                            value={clientNewPass}
                            onChange={(e) => setClientNewPass(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowClientNewPass(!showClientNewPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showClientNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                            type={showClientConfPass ? 'text' : 'password'}
                            required
                            value={clientConfirmPass}
                            onChange={(e) => setClientConfirmPass(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowClientConfPass(!showClientConfPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showClientConfPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setProfileSubTab('info')}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isChangingClientPass}
                          className="px-5 py-2 rounded-lg bg-brand-navy-900 text-white font-bold hover:bg-brand-navy-800 transition-colors flex items-center gap-1.5"
                        >
                          {isChangingClientPass ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <span>Change Password</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: Submit Bank Transfer Claim */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-heading font-bold text-base text-[#10203A]">Submit Payment Notification</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {paymentSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitPaymentClaim} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transfer Amount (₹ Rupees)</label>
                  <input
                    type="number"
                    value={payAmountRupees}
                    onChange={(e) => setPayAmountRupees(e.target.value)}
                    placeholder="e.g. 250000"
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Reference / UTR Number</label>
                  <input
                    type="text"
                    value={payTxnRef}
                    onChange={(e) => setPayTxnRef(e.target.value)}
                    placeholder="e.g. FDRLR520261024012"
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes / Invoice Reference (Optional)</label>
                  <textarea
                    rows={2}
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Paid towards Stage 2 Plinth Beam bill"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  />
                </div>

                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  * Submission will be recorded as <strong>“Verification Pending”</strong>. It will update your verified receipts only after GKA accounts matches it with bank records.
                </p>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-5 py-2 rounded-lg bg-[#10203A] text-white font-bold hover:bg-slate-800 transition-colors"
                  >
                    {isSubmittingPayment ? 'Submitting...' : 'Submit Payment Claim'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Submit Query / Feedback Ticket */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-heading font-bold text-base text-[#10203A]">Submit Question / Request</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {feedbackSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{feedbackSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Request Category</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  >
                    <option value="site_query">Site / Engineering Query</option>
                    <option value="site_visit_request">Request Site Visit Inspection</option>
                    <option value="additional_requirement">Additional Requirement / Change Inquiry</option>
                    <option value="variation_request">Specification Variation</option>
                    <option value="general_feedback">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    placeholder="Brief summary of your question"
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Details & Message</label>
                  <textarea
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Describe your site query or requested variation in detail..."
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-5 py-2 rounded-lg bg-[#10203A] text-white font-bold hover:bg-slate-800 transition-colors"
                  >
                    {isSubmittingFeedback ? 'Sending...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
