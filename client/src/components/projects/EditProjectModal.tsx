import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  Calendar,
  MapPin,
  IndianRupee,
  Users,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, toRupees, toPaise, ProjectCategory, ProjectStatus } from '@shared/types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onProjectUpdated: (updatedProject: any) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}) => {
  if (!isOpen || !project) return null;

  // Form states
  const [title, setTitle] = useState(project.title || '');
  const [category, setCategory] = useState<ProjectCategory>(project.category || 'residential');
  const [status, setStatus] = useState<ProjectStatus>(project.status || 'planning');
  const [progressPercent, setProgressPercent] = useState<number>(project.progressPercent || 0);

  // Dates
  const [startDate, setStartDate] = useState(
    project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''
  );
  const [targetEndDate, setTargetEndDate] = useState(
    project.targetEndDate ? new Date(project.targetEndDate).toISOString().split('T')[0] : ''
  );
  const [actualEndDate, setActualEndDate] = useState(
    project.actualEndDate ? new Date(project.actualEndDate).toISOString().split('T')[0] : ''
  );

  // Site Address
  const [street, setStreet] = useState(project.siteAddress?.street || '');
  const [city, setCity] = useState(project.siteAddress?.city || 'Chennai');
  const [state, setState] = useState(project.siteAddress?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState(project.siteAddress?.pincode || '');
  const [landmark, setLandmark] = useState(project.siteAddress?.landmark || '');

  // Financials in Rupees (converted to Paise for backend)
  const [contractValueRupees, setContractValueRupees] = useState<number>(
    toRupees(project.contractValuePaise || 0)
  );
  const [totalBudgetRupees, setTotalBudgetRupees] = useState<number>(
    toRupees(project.totalBudgetPaise || 0)
  );
  const [approvedVariationsRupees, setApprovedVariationsRupees] = useState<number>(
    toRupees(project.approvedVariationsPaise || 0)
  );

  // Team
  const [assignedManagerId, setAssignedManagerId] = useState(
    project.assignedManagerId?._id || project.assignedManagerId || ''
  );
  const [assignedSupervisorId, setAssignedSupervisorId] = useState(
    project.assignedSupervisorId?._id || project.assignedSupervisorId || ''
  );

  // Scope & Notes
  const [scopeOfWorkText, setScopeOfWorkText] = useState(
    Array.isArray(project.scopeOfWork) ? project.scopeOfWork.join('\n') : ''
  );
  const [notes, setNotes] = useState(project.notes || '');

  // Staff options
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.getAllUsers();
        if (res.success && Array.isArray(res.users)) {
          setStaffUsers(res.users);
        }
      } catch (err) {
        console.warn('Could not fetch staff users for dropdown:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Project title is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const scopeArray = scopeOfWorkText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: any = {
        title: title.trim(),
        category,
        status,
        progressPercent: Number(progressPercent),
        startDate: startDate ? new Date(startDate) : project.startDate,
        targetEndDate: targetEndDate ? new Date(targetEndDate) : project.targetEndDate,
        siteAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          landmark: landmark.trim(),
        },
        contractValuePaise: toPaise(Number(contractValueRupees) || 0),
        totalBudgetPaise: toPaise(Number(totalBudgetRupees) || 0),
        approvedVariationsPaise: toPaise(Number(approvedVariationsRupees) || 0),
        scopeOfWork: scopeArray,
        notes: notes.trim(),
      };

      if (actualEndDate) {
        payload.actualEndDate = new Date(actualEndDate);
      }

      if (assignedManagerId) {
        payload.assignedManagerId = assignedManagerId;
      }

      if (assignedSupervisorId) {
        payload.assignedSupervisorId = assignedSupervisorId;
      }

      const res = await api.updateProject(project._id, payload);

      if (res.success && res.project) {
        onProjectUpdated(res.project);
        onClose();
      } else {
        setErrorMsg('Failed to update project. Please try again.');
      }
    } catch (err: any) {
      console.error('Error saving project:', err);
      setErrorMsg(err.message || 'Error updating project.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-[#0F254B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#D6A21D]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-white">
                  Edit Project Workspace
                </h3>
                <span className="font-mono text-xs font-bold text-brand-gold-300 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  {project.projectId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Client: <strong className="text-white">{project.clientId?.name || 'Client'}</strong> &bull;{' '}
                Owner Management Panel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Sliders className="w-4 h-4 text-[#D6A21D]" />
              <h4 className="font-bold text-sm text-[#0F254B] uppercase tracking-wide">
                1. Project Identity & Execution Status
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Residential Villa Construction"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#D6A21D] focus:outline-none font-medium text-slate-800"
                >
                  <option value="residential">Residential Construction</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="renovation">Renovation & Remodeling</option>
                  <option value="civil_structural">Civil & Structural Works</option>
                  <option value="turnkey">Turnkey Package</option>
                  <option value="interiors">Architectural Interiors</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Execution Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#D6A21D] focus:outline-none font-bold capitalize text-slate-800"
                >
                  <option value="planning">Planning & Estimation Phase</option>
                  <option value="active">Active Execution</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed & Handed Over</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Physical Progress Percentage
                  </label>
                  <span className="font-mono font-bold text-sm text-[#0F254B] bg-white px-2.5 py-0.5 rounded-md border border-slate-300">
                    {progressPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F254B]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0% Site Kickoff</span>
                  <span>50% Structural Lock</span>
                  <span>100% Handover Complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Timeline & Milestones */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Calendar className="w-4 h-4 text-[#D6A21D]" />
              <h4 className="font-bold text-sm text-[#0F254B] uppercase tracking-wide">
                2. Project Timeline & Delivery Dates
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Handover Date *</label>
                <input
                  type="date"
                  required
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Completion Date</label>
                <input
                  type="date"
                  value={actualEndDate}
                  onChange={(e) => setActualEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Site Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-[#D6A21D]" />
              <h4 className="font-bold text-sm text-[#0F254B] uppercase tracking-wide">
                3. Site Location & Civil Address
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Street / Plot / Layout *
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Plot No 42, Rajan Nagar, Kelambakkam – Vandalur High Rd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 603103"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Landmark</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Chettinad Health City"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Commercial Ledger & Budget */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <IndianRupee className="w-4 h-4 text-[#D6A21D]" />
              <h4 className="font-bold text-sm text-[#0F254B] uppercase tracking-wide">
                4. Commercial Contract Value & Budget (₹)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">
                  Contract Value (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={contractValueRupees}
                  onChange={(e) => setContractValueRupees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
                <span className="block text-[11px] text-brand-gold-600 font-bold mt-1">
                  {formatINR(toPaise(contractValueRupees))}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Planned Budget (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={totalBudgetRupees}
                  onChange={(e) => setTotalBudgetRupees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
                <span className="block text-[11px] text-slate-500 font-medium mt-1">
                  {formatINR(toPaise(totalBudgetRupees))}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">
                  Approved Variations (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={approvedVariationsRupees}
                  onChange={(e) => setApprovedVariationsRupees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                />
                <span className="block text-[11px] text-slate-500 font-medium mt-1">
                  {formatINR(toPaise(approvedVariationsRupees))}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Team Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Users className="w-4 h-4 text-[#D6A21D]" />
              <h4 className="font-bold text-sm text-[#0F254B] uppercase tracking-wide">
                5. Engineering Team Assignment
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Project Manager
                </label>
                <select
                  value={assignedManagerId}
                  onChange={(e) => setAssignedManagerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#D6A21D] focus:outline-none font-medium text-slate-800"
                >
                  <option value="">Unassigned (Desk Pool)</option>
                  {staffUsers
                    .filter((u) => ['project_manager', 'super_admin'].includes(u.role))
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role.replace('_', ' ')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Site Supervisor
                </label>
                <select
                  value={assignedSupervisorId}
                  onChange={(e) => setAssignedSupervisorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#D6A21D] focus:outline-none font-medium text-slate-800"
                >
                  <option value="">Unassigned</option>
                  {staffUsers
                    .filter((u) => ['site_supervisor', 'project_manager', 'super_admin'].includes(u.role))
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role.replace('_', ' ')})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 6: Scope of Work & Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <FileText className="w-4 h-4 text-[#D6A21D]" />
              <h4 className="font-bold text-sm text-[#0F254B] uppercase tracking-wide">
                6. Scope of Work & Internal Engineering Notes
              </h4>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scope of Work Items (One item per line)
              </label>
              <textarea
                rows={3}
                value={scopeOfWorkText}
                onChange={(e) => setScopeOfWorkText(e.target.value)}
                placeholder="Site Clearance & Substructure&#10;RCC Column & Slab Casting&#10;Brickwork & Internal Plastering"
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none font-mono text-xs text-slate-800 leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Owner / Internal Workspace Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal engineering observations, plot constraints, or owner instructions..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#D6A21D] focus:outline-none text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#0F254B] hover:bg-[#1A3A73] text-white font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D6A21D]" />
                  <span>Saving Project...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#D6A21D]" />
                  <span>Save Project Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
