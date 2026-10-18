import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Camera,
  Layers,
  ArrowLeft,
  Eye,
  Sliders,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '@shared/types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [siteReports, setSiteReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getProjectById(id);
      if (res.success) {
        setProject(res.project);
        setMilestones(res.milestones || []);
        setSiteReports(res.recentSiteReports || []);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleUpdateMilestoneProgress = async (milestoneId: string, progress: number, status?: string) => {
    try {
      setUpdatingMilestoneId(milestoneId);
      const res = await api.updateMilestone(milestoneId, {
        progressPercent: progress,
        ...(status && { status }),
      });
      if (res.success) {
        // Refresh project to get re-calculated overall progress
        fetchProjectDetails();
      }
    } catch (error) {
      console.error('Failed to update milestone:', error);
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  const handleTogglePublish = async (reportId: string) => {
    try {
      const res = await api.togglePublishReport(reportId);
      if (res.success) {
        setSiteReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, isPublishedToClient: res.report.isPublishedToClient } : r))
        );
      }
    } catch (error) {
      console.error('Failed to toggle report publish:', error);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading project workspace...</div>;
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-xs text-rose-500">
        Project not found. <Link to="/admin/projects" className="underline ml-2">Back to projects</Link>
      </div>
    );
  }

  const receivablesPaise = Math.max(0, (project.invoicedAmountPaise || 0) - (project.collectedAmountPaise || 0));
  const estimatedProfitPaise = Math.max(0, (project.contractValuePaise || 0) - (project.totalBudgetPaise || 0));

  return (
    <div className="space-y-8">
      {/* Back button & Title Header */}
      <div>
        <Link
          to="/admin/projects"
          className="text-xs font-semibold text-slate-500 hover:text-brand-navy-900 inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Projects</span>
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-brand-gold-600 bg-brand-gold-50 px-2 py-0.5 rounded border border-brand-gold-200">
                {project.projectId}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize bg-emerald-100 text-emerald-800">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-navy-950 mt-1">
              {project.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong>{project.clientId?.name}</strong> • Site: {project.siteAddress?.street}, {project.siteAddress?.city}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/client-portal"
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-brand-teal-50 text-brand-teal-800 border border-brand-teal-300 hover:bg-brand-teal-100 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-brand-teal-600" />
              <span>Preview Client Portal View</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contract Value</span>
          <strong className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
            {formatINR(project.contractValuePaise || 0)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Execution Budget</span>
          <strong className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
            {formatINR(project.totalBudgetPaise || 0)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Actual Cost</span>
          <strong className="text-sm font-bold text-rose-600 font-mono block mt-0.5">
            {formatINR(project.actualCostPaise || 0)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Invoiced to Client</span>
          <strong className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
            {formatINR(project.invoicedAmountPaise || 0)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Collected Cash</span>
          <strong className="text-sm font-bold text-emerald-700 font-mono block mt-0.5">
            {formatINR(project.collectedAmountPaise || 0)}
          </strong>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Receivables Due</span>
          <strong className="text-sm font-bold text-amber-600 font-mono block mt-0.5">
            {formatINR(receivablesPaise)}
          </strong>
        </div>
      </div>

      {/* Main Grid: Milestones & Site Diary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Milestone Schedule & Progress Tracker */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Project Schedule & Milestones
              </h3>
              <p className="text-xs text-slate-500">
                Weighted progress updates automatically calculate overall completion ({project.progressPercent || 0}%).
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-brand-navy-900 text-white rounded-lg">
              Overall: {project.progressPercent || 0}%
            </span>
          </div>

          <div className="space-y-4">
            {milestones.map((m) => (
              <div
                key={m._id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-navy-900 text-brand-gold-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {m.code}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-brand-navy-950">{m.title}</h4>
                      <p className="text-[11px] text-slate-500">{m.description}</p>
                    </div>
                  </div>

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

                {/* Progress Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Milestone Progress (Weight: {m.weightagePercent}%)</span>
                    <strong className="text-brand-navy-950 font-bold">{m.progressPercent}%</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={m.progressPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const status = val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'pending';
                      handleUpdateMilestoneProgress(m._id, val, status);
                    }}
                    className="w-full accent-brand-gold-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Site Diary & Published Updates */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-navy-900" />
                <h3 className="font-heading font-bold text-base text-brand-navy-950">
                  Site Reports & Client Feeds
                </h3>
              </div>
              <Link to="/admin/site-ops" className="text-xs font-semibold text-brand-gold-600 hover:underline">
                + New Report
              </Link>
            </div>

            {siteReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No site reports submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {siteReports.map((report) => (
                  <div key={report._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-brand-navy-950 block">
                          {new Date(report.reportDate).toLocaleDateString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Weather: {report.weatherCondition} • Labour: {report.labourCount?.totalCount || 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(report._id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                          report.isPublishedToClient
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {report.isPublishedToClient ? '✓ Client Visible' : 'Publish to Client'}
                      </button>
                    </div>

                    <p className="text-slate-600 leading-relaxed">{report.workCompletedSummary}</p>

                    {report.photos && report.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {report.photos.map((photo: any, idx: number) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                            <img src={photo.url} alt={photo.caption} className="h-24 w-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-white truncate">
                              {photo.caption || photo.category}
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
        </div>
      </div>
    </div>
  );
};
