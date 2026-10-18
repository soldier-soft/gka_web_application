import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { LeadStatus } from '@shared/types';

export const CrmPage: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertMessage, setConvertMessage] = useState<{ id: string; msg: string; projectId: string } | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getLeads(params);
      if (res.success) {
        setLeads(res.leads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await api.updateLeadStatus(leadId, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const handleConvertLead = async (leadId: string) => {
    try {
      setConvertingId(leadId);
      const res = await api.convertLeadToProject(leadId);
      if (res.success) {
        setConvertMessage({
          id: leadId,
          msg: res.message,
          projectId: res.project.projectId,
        });
        fetchLeads();
      }
    } catch (err: any) {
      alert(err.message || 'Error converting lead.');
    } finally {
      setConvertingId(null);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.siteLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-navy-950">
            CRM & Lead Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track website enquiries, site visit requests, and convert leads into active projects with 1 click.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone or site location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="new">New Enquiries</option>
            <option value="contacted">Contacted</option>
            <option value="site_visit_scheduled">Site Visit Scheduled</option>
            <option value="won">Converted / Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Conversion Banner Alert */}
      {convertMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Success!</strong> {convertMessage.msg} (Project ID: <strong>{convertMessage.projectId}</strong>)
            </span>
          </div>
          <button
            onClick={() => setConvertMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading CRM records...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No enquiries found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Client / Prospect</th>
                  <th className="py-3.5 px-4">Category & Location</th>
                  <th className="py-3.5 px-4">Source & Budget</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="text-brand-navy-950 font-bold block text-sm">{lead.name}</strong>
                      <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-brand-gold-500" />
                        <span>{lead.phone}</span>
                        {lead.email && (
                          <>
                            <span>•</span>
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{lead.email}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-slate-800 block">
                        {lead.projectCategory?.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{lead.siteLocation}</span>
                      </div>
                      {lead.approxAreaSqFt && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Approx. {lead.approxAreaSqFt} sq.ft
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 capitalize">
                        {lead.source?.replace('_', ' ')}
                      </span>
                      {lead.estimatedBudgetRupees ? (
                        <span className="block font-bold text-slate-900 mt-1 font-mono">
                          ₹ {lead.estimatedBudgetRupees.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400 block text-[11px] mt-1">Pending scope</span>
                      )}
                      {lead.preferredSiteVisitDate && (
                        <div className="flex items-center gap-1 text-[11px] text-brand-gold-600 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Visit: {new Date(lead.preferredSiteVisitDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value as any)}
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border outline-none ${
                          lead.status === 'won'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : lead.status === 'site_visit_scheduled'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : lead.status === 'new'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="site_visit_scheduled">Site Visit</option>
                        <option value="won">Won / Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {lead.convertedToProjectId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Project Created</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={convertingId === lead._id}
                          onClick={() => handleConvertLead(lead._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors shadow-sm"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-brand-gold-400" />
                          <span>{convertingId === lead._id ? 'Converting...' : 'Convert to Project'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
