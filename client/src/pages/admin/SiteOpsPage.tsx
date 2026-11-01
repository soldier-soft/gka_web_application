import React, { useEffect, useState, useRef } from 'react';
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
  Upload,
  Cloud,
  Folder,
  ExternalLink,
  X,
  Loader2,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { api, resolveImageUrl } from '../../services/api';
import { GOOGLE_DRIVE_CONFIG } from '../../constants';

interface UploadedSitePhoto {
  url: string;
  caption: string;
  category: string;
  driveNote?: string;
  driveSubfolder?: string;
}

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
  
  // Direct file upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedSitePhoto[]>([]);
  const [currentCaption, setCurrentCaption] = useState('');
  const [activePhotoCategory, setActivePhotoCategory] = useState('site_condition');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');

  const [publishDirectly, setPublishDirectly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox preview modal for inspecting images
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; caption: string; category?: string; projectTitle?: string } | null>(null);

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
        if (projectsRes.projects.length > 0 && !selectedProjectId) {
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

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedProjectId) {
      alert('Please select a project before uploading photos.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setUploadSuccessMessage('');
      const caption = currentCaption.trim() || 'Site progress photo';
      const res = await api.uploadSitePhoto(file, selectedProjectId, caption, activePhotoCategory);

      if (res.success) {
        const newPhoto: UploadedSitePhoto = {
          url: res.url,
          caption: res.caption || caption,
          category: res.category || activePhotoCategory,
          driveNote: res.driveNote,
          driveSubfolder: res.driveSubfolder,
        };
        setUploadedPhotos((prev) => [...prev, newPhoto]);
        setUploadSuccessMessage(res.driveNote || 'Photo saved & synced to Google Drive project folder!');
        setCurrentCaption('');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const photosPayload = uploadedPhotos.map((p) => ({
        url: p.url,
        caption: p.caption,
        category: p.category,
      }));

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
        photos: photosPayload,
        isPublishedToClient: publishDirectly,
      });

      if (res.success) {
        setShowModal(false);
        setWorkCompleted('');
        setMaterialsConsumed('');
        setUploadedPhotos([]);
        setUploadSuccessMessage('');
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
            Record daily work, labour attendance, materials consumed, and direct photographs synchronized to Google Drive project folders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={GOOGLE_DRIVE_CONFIG.folderUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-sm"
            title="Open Master Google Drive Archive"
          >
            <Cloud className="w-4 h-4 text-slate-900" />
            <span>Open Google Drive</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-brand-gold-400" />
            <span>New Site Diary Entry</span>
          </button>
        </div>
      </div>

      {/* Note banner explaining Google Drive Separate Project Folders */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0 mt-0.5">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Automatic Google Drive Project Folders</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-200/80 text-amber-950 font-bold">
                [GKA CONSTRUCTION] Master Folder
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Every project maintains its own isolated folder inside the master linked Google Drive folder. All site photos and progress logs uploaded here are automatically archived in their dedicated subfolder and rendered on the client portal.
            </p>
          </div>
        </div>
        <a
          href={GOOGLE_DRIVE_CONFIG.folderUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 shadow-sm"
        >
          <span>View Folder in Drive</span>
          <ExternalLink className="w-3 h-3" />
        </a>
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
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Site Photos ({report.photos.length})</span>
                        <span className="text-[10px] text-emerald-700 flex items-center gap-1">
                          <Cloud className="w-3 h-3" /> Synced to Google Drive
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {report.photos.map((ph: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={() =>
                              setPreviewPhoto({
                                url: ph.url,
                                caption: ph.caption || 'Site inspection photograph',
                                category: ph.category,
                                projectTitle: report.projectId?.title,
                              })
                            }
                            className="relative group rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md transition-all bg-slate-100"
                          >
                            <img
                              src={resolveImageUrl(ph.url)}
                              alt={ph.caption}
                              onError={(e) => {
                                (e.target as any).src =
                                  'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80';
                              }}
                              className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                              <span className="text-[10px] font-bold block truncate">
                                {ph.caption || ph.category}
                              </span>
                              {ph.category && (
                                <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
                                  {ph.category}
                                </span>
                              )}
                            </div>
                            <div className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ))}
                      </div>
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

      {/* Lightbox / Preview Photo Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-900 text-white">
              <div>
                <h4 className="font-bold text-sm truncate">{previewPhoto.caption}</h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  {previewPhoto.projectTitle || 'Site Progress Photo'}
                </span>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black/90 flex items-center justify-center max-h-[70vh]">
              <img
                src={resolveImageUrl(previewPhoto.url)}
                alt={previewPhoto.caption}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="p-3 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Site Photograph • Synced to Google Drive Project Folder</span>
              </span>
              <a
                href={resolveImageUrl(previewPhoto.url)}
                target="_blank"
                rel="noreferrer"
                download
                className="px-3 py-1 bg-brand-navy-900 text-white rounded font-bold text-[11px] hover:bg-brand-navy-800"
              >
                Download Photo
              </a>
            </div>
          </div>
        </div>
      )}

      {/* New Site Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                  New Daily Site Diary Entry
                </h3>
                <p className="text-xs text-slate-500">
                  Record work completed, labour attendance, and upload live photographs to Google Drive.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              {/* Project Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Project *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setUploadedPhotos([]);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectId} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dedicated Google Drive Subfolder Notice */}
              <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 text-xs text-brand-navy-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Cloud className="w-4 h-4 text-amber-600" />
                    Automatic Google Drive Project Folder
                  </span>
                  <a
                    href={GOOGLE_DRIVE_CONFIG.folderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-600">
                  📌 <strong>Note:</strong> Every project maintains its own isolated folder inside the master <strong>"GKA CONSTRUCTION"</strong> Google Drive folder.
                </p>
                {selectedProject && (
                  <div className="font-mono text-[10px] bg-white p-2 rounded border border-amber-200 text-slate-700 break-all">
                    📁 GKA CONSTRUCTION / {selectedProject.projectId}_{selectedProject.title?.replace(/[^a-zA-Z0-9_-]/g, '_')} / Site Diary Photos /
                  </div>
                )}
              </div>

              {/* Weather Condition */}
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

              {/* Work Completed */}
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

              {/* Materials Consumed */}
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

              {/* DIRECT PHOTO UPLOAD (Not as a link - direct upload button) */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-brand-navy-900" />
                      <span>Upload Site Diary Photographs</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Upload directly from your phone camera or computer (not as a web link).
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto || !selectedProjectId}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading & Syncing to Drive...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo File</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pre-upload caption and category settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                      Stage / Category
                    </label>
                    <select
                      value={activePhotoCategory}
                      onChange={(e) => setActivePhotoCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="site_condition">Site Condition</option>
                      <option value="foundation">Foundation</option>
                      <option value="structure">Structure / RCC</option>
                      <option value="plastering">Plastering</option>
                      <option value="finishing">Finishing / Painting</option>
                      <option value="inspection">Inspection / QA</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                      Photo Caption / Note
                    </label>
                    <input
                      type="text"
                      value={currentCaption}
                      onChange={(e) => setCurrentCaption(e.target.value)}
                      placeholder="e.g. Sump tank curing and steel inspection"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                {uploadSuccessMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccessMessage}</span>
                  </div>
                )}

                {/* Uploaded Photos Gallery Preview */}
                {uploadedPhotos.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Uploaded Photos for this Log ({uploadedPhotos.length}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {uploadedPhotos.map((p, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm group"
                        >
                          <img
                            src={resolveImageUrl(p.url)}
                            alt={p.caption}
                            className="h-28 w-full object-cover"
                          />
                          <div className="p-2 text-[10px]">
                            <span className="font-bold text-slate-800 block truncate">{p.caption}</span>
                            <span className="text-emerald-700 font-semibold block text-[9px] uppercase mt-0.5">
                              ✓ {p.category} • Drive Synced
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white shadow hover:bg-red-700 transition-colors"
                            title="Remove Photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Publish to client portal toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pubClient"
                  checked={publishDirectly}
                  onChange={(e) => setPublishDirectly(e.target.checked)}
                  className="rounded text-brand-gold-500 h-4 w-4"
                />
                <label htmlFor="pubClient" className="font-semibold text-slate-700 cursor-pointer">
                  Publish directly to authorized client portal (client sees photos immediately)
                </label>
              </div>

              {/* Actions */}
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
                  disabled={isSubmitting || isUploadingPhoto}
                  className="px-5 py-2 rounded-lg font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 shadow transition-all disabled:opacity-50"
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
