import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Search,
  BadgeCheck,
  Briefcase,
  Lock,
  Save,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GKA_COMPANY } from '@shared/constants';

export const ProfilePage: React.FC = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'security' | 'team'>('overview');
  const [profileData, setProfileData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  // Admin User Password Reset Modal State (for changing each user's password)
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [adminNewPass, setAdminNewPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [isAdminResetting, setIsAdminResetting] = useState(false);
  const [adminResetSuccess, setAdminResetSuccess] = useState('');
  const [adminResetError, setAdminResetError] = useState('');

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminResetError('');
    setAdminResetSuccess('');

    if (!resetModalUser) return;
    if (adminNewPass.length < 6) {
      setAdminResetError('Password must be at least 6 characters.');
      return;
    }

    setIsAdminResetting(true);
    try {
      const res = await api.adminResetPassword({
        userId: resetModalUser._id || resetModalUser.id || resetModalUser.email,
        newPassword: adminNewPass,
      });

      if (res.success) {
        setAdminResetSuccess(res.message || 'Password updated successfully!');
        setAdminNewPass('');
        setTimeout(() => {
          setResetModalUser(null);
          setAdminResetSuccess('');
        }, 2500);
      }
    } catch (err: any) {
      setAdminResetError(err.message || 'Failed to update user password.');
    } finally {
      setIsAdminResetting(false);
    }
  };

  // Team Directory Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Load User Profile
  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const res = await api.getProfile();
      if (res.success && res.user) {
        setProfileData(res.user);
        setEditName(res.user.name || '');
        setEditPhone(res.user.phone || '');
      }
    } catch (err: any) {
      console.warn('Profile fetch note:', err.message);
      // Fallback with authUser
      if (authUser) {
        setProfileData({
          ...authUser,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
        setEditName(authUser.name || '');
        setEditPhone(authUser.phone || '');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load All Users Directory
  const fetchAllUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await api.getAllUsers();
      if (res.success && res.users) {
        setAllUsers(res.users);
      }
    } catch (err: any) {
      console.warn('Users directory fetch note:', err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAllUsers();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!editName.trim()) {
      setProfileErrorMsg('Full Name is required.');
      return;
    }
    if (!editPhone.trim()) {
      setProfileErrorMsg('Phone number is required.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });

      if (res.success) {
        setProfileSuccessMsg('Profile updated successfully!');
        setProfileData((prev: any) => ({
          ...prev,
          name: editName.trim(),
          phone: editPhone.trim(),
        }));

        if (authUser) {
          setAuthUser({
            ...authUser,
            name: editName.trim(),
            phone: editPhone.trim(),
          });
        }

        setTimeout(() => {
          setProfileSuccessMsg('');
        }, 3500);
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (!currentPassword) {
      setPassErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPassErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPassSuccessMsg('Your password has been changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setPassSuccessMsg('');
        }, 4000);
      }
    } catch (err: any) {
      setPassErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'Managing Director / Owner (Super Admin)';
      case 'project_manager':
        return 'Senior Project Manager';
      case 'site_supervisor':
        return 'Site Operations Supervisor';
      case 'accounts':
        return 'Billing & Financial Accounts Lead';
      case 'client':
        return 'Registered Client Account';
      default:
        return 'Staff Member';
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            Owner / Super Admin
          </span>
        );
      case 'project_manager':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-900 rounded-full border border-blue-300">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            Project Manager
          </span>
        );
      case 'site_supervisor':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
            Site Supervisor
          </span>
        );
      case 'accounts':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-900 rounded-full border border-purple-300">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            Accounts Lead
          </span>
        );
      case 'client':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-cyan-100 text-cyan-900 rounded-full border border-cyan-300">
            <Users className="w-3.5 h-3.5 text-cyan-600" />
            Client Account
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-800 rounded-full border border-slate-300">
            User
          </span>
        );
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Profile Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy-950 via-brand-navy-900 to-brand-navy-800 text-white p-6 sm:p-8 shadow-xl border border-brand-navy-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-gold-600 to-brand-gold-400 text-brand-navy-950 font-heading font-extrabold text-3xl flex items-center justify-center shadow-lg border-2 border-white/20">
                {profileData?.name?.charAt(0) || authUser?.name?.charAt(0) || 'U'}
              </div>
              <span
                className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-brand-navy-950 rounded-full"
                title="Account Active"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold font-heading text-white">
                  {profileData?.name || authUser?.name || 'User Profile'}
                </h1>
                {getRoleBadge(profileData?.role || authUser?.role)}
              </div>
              <p className="text-xs text-brand-gold-300/90 font-medium">
                {getRoleLabel(profileData?.role || authUser?.role)}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profileData?.email || authUser?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  +91 {profileData?.phone || authUser?.phone || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-start md:items-end gap-2 bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-brand-gold-400" />
              <span>GKA Security:</span>
              <span className="text-emerald-400 font-semibold">256-Bit SSL Active</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Last Login: {profileData?.lastLoginAt ? new Date(profileData.lastLoginAt).toLocaleString() : 'Active session'}
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-brand-gold-500 text-brand-navy-950 shadow-md font-bold'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Profile Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'edit'
                ? 'bg-brand-gold-500 text-brand-navy-950 shadow-md font-bold'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Edit Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-brand-gold-500 text-brand-navy-950 shadow-md font-bold'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'team'
                ? 'bg-brand-gold-500 text-brand-navy-950 shadow-md font-bold'
                : 'bg-white/5 hover:bg-white/10 text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All User Profiles ({allUsers.length || 5})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Basic Information Card */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">Basic Information</h2>
                <p className="text-xs text-slate-500">Official profile attributes registered on GKA ERP</p>
              </div>
              <button
                onClick={() => setActiveTab('edit')}
                className="text-xs font-semibold text-brand-navy-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Edit Info
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </span>
                <span className="text-sm font-bold text-slate-800">{profileData?.name || authUser?.name}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Primary Email (Login ID)
                </span>
                <span className="text-sm font-bold text-slate-800">{profileData?.email || authUser?.email}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Phone Number
                </span>
                <span className="text-sm font-bold text-slate-800">
                  +91 {profileData?.phone || authUser?.phone || 'Not specified'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned ERP Role
                </span>
                <span className="text-sm font-bold text-brand-navy-900 capitalize">
                  {profileData?.role?.replace('_', ' ') || authUser?.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Organization
                </span>
                <span className="text-sm font-bold text-slate-800">GKA Construction & Infra Projects</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Operating Location
                </span>
                <span className="text-sm font-bold text-slate-800">Chennai & Tiruvannamalai, Tamil Nadu</span>
              </div>
            </div>

            {/* Assigned Projects if any */}
            {profileData?.assignedProjects && profileData.assignedProjects.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Assigned Active Projects ({profileData.assignedProjects.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profileData.assignedProjects.map((p: any) => (
                    <div key={p._id || p.code} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-brand-navy-950">{p.title}</p>
                      <p className="text-[10px] text-slate-500">
                        Code: {p.code} • Status: <span className="capitalize">{p.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side System & Security Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-900 font-heading">Account & System Access</h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Account Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active & Verified
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">System Permissions</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {profileData?.role === 'super_admin' ? 'Unrestricted Root Access' : 'Standard Role Authorized'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Registered Since</span>
                  <span className="font-semibold text-slate-800">
                    {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'Jan 2024'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">User Identification</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[130px]" title={profileData?.id || profileData?._id}>
                    {profileData?.id || profileData?._id || 'UID-GKA-001'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-brand-navy-50 rounded-xl border border-brand-navy-100">
                <p className="text-xs text-brand-navy-900 leading-relaxed">
                  <strong className="block mb-1">Company Contact Information:</strong>
                  Need administrative credential resets or role changes? Contact Managing Director at{' '}
                  <a href={`tel:${GKA_COMPANY.phoneDisplay}`} className="font-bold underline text-brand-navy-950">
                    +91 {GKA_COMPANY.phoneDisplay}
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE */}
      {activeTab === 'edit' && (
        <div className="max-w-2xl bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 font-heading">Update Profile Information</h2>
            <p className="text-xs text-slate-500">Keep your personal contact details current on GKA Construction ERP</p>
          </div>

          {profileSuccessMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                  placeholder="Your Full Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                  placeholder="98401 23456"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Used for project updates, emergency site contacts, and billing alerts.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={profileData?.email || authUser?.email || ''}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Your email address serves as your unique login ID. Contact administration to modify it.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-brand-gold-400" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CHANGE PASSWORD */}
      {activeTab === 'security' && (
        <div className="max-w-xl bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 font-heading">Change Password</h2>
            <p className="text-xs text-slate-500">Ensure your account is protected with a secure password</p>
          </div>

          {passSuccessMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passSuccessMsg}</span>
            </div>
          )}

          {passErrorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-6 py-2.5 bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                {isChangingPass ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-brand-gold-400" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ALL USER PROFILES DIRECTORY */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  System Users & Team Directory ({filteredUsers.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Comprehensive profiles with basic information of all registered users on GKA ERP
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 pt-4">
              {[
                { label: 'All Roles', value: 'all' },
                { label: 'Super Admin / Owner', value: 'super_admin' },
                { label: 'Project Managers', value: 'project_manager' },
                { label: 'Site Supervisors', value: 'site_supervisor' },
                { label: 'Accounts Lead', value: 'accounts' },
                { label: 'Clients', value: 'client' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setSelectedRoleFilter(pill.value)}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                    selectedRoleFilter === pill.value
                      ? 'bg-brand-navy-900 text-white border-brand-navy-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const isCurrentUser = u.email?.toLowerCase() === authUser?.email?.toLowerCase();
              return (
                <div
                  key={u._id || u.id || u.email}
                  className={`bg-white rounded-xl p-5 border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                    isCurrentUser ? 'border-brand-gold-400 ring-2 ring-brand-gold-400/20 shadow-sm' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-navy-900 to-brand-navy-700 text-brand-gold-400 font-bold text-base flex items-center justify-center shadow-sm">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{u.name}</h3>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-brand-gold-100 text-brand-gold-800 font-bold px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 capitalize">
                            {getRoleLabel(u.role)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${u.email}`} className="text-brand-navy-900 hover:underline truncate">
                          {u.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${u.phone}`} className="hover:underline">
                          +91 {u.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Member
                    </span>
                    {(authUser?.role === 'super_admin' || authUser?.role === 'project_manager') && (
                      <button
                        onClick={() => {
                          setResetModalUser(u);
                          setAdminNewPass('');
                          setAdminResetSuccess('');
                          setAdminResetError('');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-brand-navy-950 bg-brand-gold-100 hover:bg-brand-gold-200 border border-brand-gold-300 rounded-md transition-colors shadow-2xs"
                        title={`Change / Reset password for ${u.name}`}
                      >
                        <KeyRound className="w-3 h-3 text-brand-gold-700" />
                        <span>Change Password</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No users found</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or role filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Admin User Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-gold-100 text-brand-gold-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">Change User Password</h3>
                  <p className="text-[11px] text-slate-500">
                    Set a new password for <strong className="text-slate-800">{resetModalUser.name}</strong> ({resetModalUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {adminResetSuccess && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminResetSuccess}</span>
              </div>
            )}

            {adminResetError && (
              <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminResetError}</span>
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] text-slate-500">User Account Target:</p>
                <p className="font-bold text-slate-800 text-xs">{resetModalUser.name}</p>
                <p className="text-slate-600 text-[11px]">{resetModalUser.email} • Role: {resetModalUser.role}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password for this User</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminNewPass}
                    onChange={(e) => setAdminNewPass(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdminResetting}
                  className="px-5 py-2 rounded-lg bg-brand-navy-900 text-white font-bold hover:bg-brand-navy-800 transition-colors flex items-center gap-1.5"
                >
                  {isAdminResetting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <span>Set New Password</span>
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
