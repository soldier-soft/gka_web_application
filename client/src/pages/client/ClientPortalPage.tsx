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
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '@shared/types';
import { GKA_COMPANY } from '@shared/constants';

export const ClientPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientProjects = async () => {
      try {
        setLoading(true);
        // If client, fetch their authorized projects, or fall back to all projects for super_admin preview
        let res;
        if (user?.role === 'client') {
          res = await api.getClientProjects();
        } else {
          res = await api.getProjects();
        }

        if (res.success && res.projects && res.projects.length > 0) {
          setProjects(res.projects);
          setSelectedProject(res.projects[0]._id);
        }
      } catch (error) {
        console.error('Error fetching client projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientProjects();
  }, [user]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchDetails = async () => {
      try {
        const res = await api.getClientProjectDetails(selectedProject);
        if (res.success) {
          setProjectData(res);
        }
      } catch (error) {
        console.error('Error loading project details:', error);
      }
    };
    fetchDetails();
  }, [selectedProject]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Client Header */}
      <header className="bg-brand-navy-900 border-b border-brand-navy-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="GKA Logo" className="h-10 w-auto" />
            <div>
              <span className="text-lg font-heading font-extrabold tracking-wider text-white">
                GKA <span className="text-brand-gold-400">CONSTRUCTION</span>
              </span>
              <p className="text-[10px] text-brand-gold-400 font-semibold uppercase tracking-wider">
                Authorized Client Progress Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user?.name || 'Authorized Client'}</span>
              <span className="text-[10px] text-brand-teal-300">Verified Client Access</span>
            </div>

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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 w-full">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your project portal...</div>
        ) : !projectData?.project ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No authorized project active on this account yet. Please contact GKA Construction at {GKA_COMPANY.phoneDisplay}.
          </div>
        ) : (
          <>
            {/* Project Hero Banner */}
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
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{projectData.project.siteAddress?.street}, {projectData.project.siteAddress?.city}</span>
                  </p>
                </div>

                <div className="bg-brand-navy-900 text-white p-4 rounded-xl text-center shrink-0 min-w-[140px]">
                  <span className="text-[10px] text-brand-gold-400 font-bold uppercase tracking-wider block">
                    Total Progress
                  </span>
                  <span className="text-3xl font-extrabold font-heading text-white">
                    {projectData.project.progressPercent || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Physical Completion</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Current Project Progress</span>
                  <span>{projectData.project.progressPercent || 0}% Complete</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-teal-500 to-brand-gold-500 rounded-full transition-all duration-500"
                    style={{ width: `${projectData.project.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Milestones Flow */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                    Construction Stages & Milestones
                  </h3>
                  <p className="text-xs text-slate-500">Live progress per stage validated by our on-site engineers.</p>
                </div>
                <span className="text-xs font-semibold text-brand-teal-700 bg-brand-teal-50 px-2.5 py-1 rounded-full border border-brand-teal-200">
                  {projectData.milestones?.filter((m: any) => m.status === 'completed').length || 0} of {projectData.milestones?.length || 0} Stages Completed
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
                        <div
                          className="h-full bg-brand-navy-900 rounded-full"
                          style={{ width: `${m.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Site Photos & Work Updates */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-brand-navy-900" />
                  <div>
                    <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                      Approved Site Progress Gallery
                    </h3>
                    <p className="text-xs text-slate-500">Verified site photographs published by our supervising engineer.</p>
                  </div>
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
                            <div key={i} className="rounded-xl overflow-hidden border border-slate-200 relative group">
                              <img src={ph.url} alt={ph.caption} className="h-44 w-full object-cover" />
                              <div className="p-2 bg-white text-[11px] text-slate-700">
                                {ph.caption || 'Site inspection photograph'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices & Approved Documents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Invoices */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
                <h3 className="text-base font-heading font-bold text-brand-navy-950 border-b border-slate-100 pb-3">
                  Billing & Payment Records
                </h3>

                {projectData.invoices?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No invoices issued yet.</p>
                ) : (
                  <div className="space-y-3">
                    {projectData.invoices.map((inv: any) => (
                      <div key={inv._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-brand-navy-950 font-bold block">{inv.invoiceNumber}</strong>
                          <span className="text-[11px] text-slate-500">
                            Issued: {new Date(inv.issueDate).toLocaleDateString('en-IN')} • Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                          </span>
                          <span className="block font-mono font-bold text-slate-900 mt-1">
                            {formatINR(inv.totalAmountPaise)}
                          </span>
                        </div>

                        <div className="text-right space-y-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize block ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
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
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Support & Contact */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
                <h3 className="text-base font-heading font-bold text-brand-navy-950 border-b border-slate-100 pb-3">
                  Direct Engineering Support
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Have questions regarding upcoming milestones or drawings? Contact your assigned engineering team directly.
                </p>

                <div className="p-4 bg-brand-navy-50 rounded-xl border border-brand-navy-100 space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-brand-gold-600" />
                    <div>
                      <strong className="text-brand-navy-950 block">Hotline:</strong>
                      <a href={`tel:${GKA_COMPANY.phoneDisplay}`} className="text-slate-700 font-bold hover:underline">
                        +91 {GKA_COMPANY.phoneDisplay}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-brand-gold-600" />
                    <div>
                      <strong className="text-brand-navy-950 block">Direct Email:</strong>
                      <a href={`mailto:${GKA_COMPANY.email}`} className="text-slate-700 font-medium hover:underline">
                        {GKA_COMPANY.email}
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  GKA Construction • Chennai Branch: {GKA_COMPANY.chennaiBranch.full}
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
