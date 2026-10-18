import React, { useEffect, useState } from 'react';
import {
  Camera,
  Plus,
  Users,
  Sun,
  CloudRain,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
  Layers,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';

export const SiteOpsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New report form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [weather, setWeather] = useState('sunny');
  const [masons, setMasons] = useState(3);
  const [helpers, setHelpers] = useState(5);
  const [plumbers, setPlumbers] = useState(1);
  const [electricians, setElectricians] = useState(0);
  const [carpenters, setCarpenters] = useState(0);
  const [materialsConsumed, setMaterialsConsumed] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80');
  const [photoCaption, setPhotoCaption] = useState('Plastering & structural inspection on site');
  const [publishDirectly, setPublishDirectly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReportsAndProjects = async () => {
    try {
      setLoading(true);
      const [reportsRes, projectsRes] = await Promise.all([
        api.getSiteReports(),
        api.getProjects(),
      ]);
      if (reportsRes.success) setReports(reportsRes.reports);
      if (projectsRes.success) {
        setProjects(projectsRes.projects);
        if (projectsRes.projects.length > 0) {
          setSelectedProjectId(projectsRes.projects[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching site ops data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndProjects();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createSiteReport({
        projectId: selectedProjectId,
        workCompletedSummary: workCompleted,
        weatherCondition: weather,
        labourCount: {
          masons,
          helpers,
          plumbers,
          electricians,
          carpenters,
          supervisors: 1,
        },
        materialsConsumedSummary: materialsConsumed,
        photos: photoUrl ? [{ url: photoUrl, caption: photoCaption, category: 'plastering' }] : [],
        isPublishedToClient: publishDirectly,
      });

      if (res.success) {
        setShowModal(false);
        setWorkCompleted('');
        setMaterialsConsumed('');
        fetchReportsAndProjects();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording site report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (reportId: string) => {
    try {
      const res = await api.togglePublishReport(reportId);
      if (res.success) {
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, isPublishedToClient: res.report.isPublishedToClient } : r))
        );
      }
    } catch (error) {
      console.error('Error toggling publish state:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-navy-950">
            Mobile-First Site Diary & Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record daily work, labour attendance, materials consumed, and live photographs from any mobile phone.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-brand-gold-400" />
          <span>New Site Diary Entry</span>
        </button>
      </div>

      {/* Reports Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading site reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No site reports recorded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle hover:border-brand-navy-900 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-brand-gold-600 bg-brand-gold-50 px-2 py-0.5 rounded border border-brand-gold-200">
                        {report.projectId?.projectId || 'Project'}
                      </span>
                      <h3 className="text-base font-bold text-brand-navy-950 mt-1">
                        {report.projectId?.title || 'Site Entry'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(report.reportDate).toLocaleDateString('en-IN')}</span>
                        <span>•</span>
                        <span className="capitalize">Weather: {report.weatherCondition}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(report._id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                        report.isPublishedToClient
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {report.isPublishedToClient ? '✓ Published to Client' : 'Internal Only'}
                    </button>
                  </div>

                  {/* Work description */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold text-brand-navy-950 mb-1">Work Completed:</p>
                    {report.workCompletedSummary}
                  </div>

                  {/* Labour Count Breakdown */}
                  <div className="p-3 bg-brand-navy-50/50 rounded-xl border border-brand-navy-100/50 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-brand-navy-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-navy-700" />
                        <span>Labour on Site ({report.labourCount?.totalCount || 0} total)</span>
                      </strong>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px] text-slate-600 mt-2">
                      <span>Masons: <strong>{report.labourCount?.masons || 0}</strong></span>
                      <span>Helpers: <strong>{report.labourCount?.helpers || 0}</strong></span>
                      <span>Plumbers: <strong>{report.labourCount?.plumbers || 0}</strong></span>
                      <span>Electricians: <strong>{report.labourCount?.electricians || 0}</strong></span>
                      <span>Carpenters: <strong>{report.labourCount?.carpenters || 0}</strong></span>
                    </div>
                  </div>

                  {/* Materials consumed if any */}
                  {report.materialsConsumedSummary && (
                    <div className="text-xs text-slate-600">
                      <strong className="text-slate-800">Materials Consumed: </strong>
                      <span>{report.materialsConsumedSummary}</span>
                    </div>
                  )}

                  {/* Photographs */}
                  {report.photos && report.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {report.photos.map((ph: any, idx: number) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                          <img src={ph.url} alt={ph.caption} className="h-32 w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[10px] text-white truncate">
                            {ph.caption || ph.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Site Engineer: <strong>{report.supervisorId?.name || 'Engineer'}</strong></span>
                  <span>Recorded at: {new Date(report.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Site Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                  New Daily Site Report
                </h3>
                <p className="text-xs text-slate-500">Record work completed, labour attendance and site photos.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Project *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectId} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weather Condition</label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="sunny">☀️ Sunny / Clear</option>
                  <option value="cloudy">⛅ Cloudy</option>
                  <option value="rainy">🌧️ Rainy / Wet Site</option>
                  <option value="windy">💨 Windy</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Completed Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="e.g. Completed 2nd coat plastering inside tank. Chipped loose concrete on perimeter wall..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* Labour attendance */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Labour Headcount on Site:</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Masons</span>
                    <input
                      type="number"
                      min={0}
                      value={masons}
                      onChange={(e) => setMasons(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Helpers</span>
                    <input
                      type="number"
                      min={0}
                      value={helpers}
                      onChange={(e) => setHelpers(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Plumbers</span>
                    <input
                      type="number"
                      min={0}
                      value={plumbers}
                      onChange={(e) => setPlumbers(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Electricians</span>
                    <input
                      type="number"
                      min={0}
                      value={electricians}
                      onChange={(e) => setElectricians(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Carpenters</span>
                    <input
                      type="number"
                      min={0}
                      value={carpenters}
                      onChange={(e) => setCarpenters(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Materials Consumed Today</label>
                <input
                  type="text"
                  value={materialsConsumed}
                  onChange={(e) => setMaterialsConsumed(e.target.value)}
                  placeholder="e.g. 25 bags cement, 1 bundle PVC pipes"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo URL / Demo Image</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Caption</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pubClient"
                  checked={publishDirectly}
                  onChange={(e) => setPublishDirectly(e.target.checked)}
                  className="rounded text-brand-gold-500"
                />
                <label htmlFor="pubClient" className="font-semibold text-slate-700">
                  Publish directly to authorized client portal
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 shadow"
                >
                  {isSubmitting ? 'Submitting...' : 'Save Site Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
