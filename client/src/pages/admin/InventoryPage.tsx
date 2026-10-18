import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Truck,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, toPaise } from '@shared/types';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'suppliers' | 'orders' | 'transactions'>('stock');
  const [stockSummary, setStockSummary] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transaction modal
  const [showTransModal, setShowTransModal] = useState(false);
  const [transProject, setTransProject] = useState('');
  const [transMaterial, setTransMaterial] = useState('Ultratech 53-Grade OPC Cement');
  const [transCategory, setTransCategory] = useState('cement_steel');
  const [transType, setTransType] = useState<'purchase_receipt' | 'site_issue' | 'site_return' | 'wastage'>('site_issue');
  const [transQuantity, setTransQuantity] = useState(25);
  const [transUnit, setTransUnit] = useState('bags');
  const [transNotes, setTransNotes] = useState('Issued for brick masonry mortar CM 1:5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [stockRes, supRes, poRes, transRes, projRes] = await Promise.all([
        api.getStockSummary(),
        api.getSuppliers(),
        api.getPurchaseOrders(),
        api.getInventoryTransactions(),
        api.getProjects(),
      ]);

      if (stockRes.success) setStockSummary(stockRes.stock);
      if (supRes.success) setSuppliers(supRes.suppliers);
      if (poRes.success) setPurchaseOrders(poRes.purchaseOrders);
      if (transRes.success) setTransactions(transRes.transactions);
      if (projRes.success) {
        setProjects(projRes.projects);
        if (projRes.projects.length > 0) setTransProject(projRes.projects[0]._id);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createInventoryTransaction({
        projectId: transProject,
        materialName: transMaterial,
        category: transCategory,
        transactionType: transType,
        quantity: transQuantity,
        unit: transUnit,
        unitCostPaise: toPaise(410),
        notes: transNotes,
      });

      if (res.success) {
        setShowTransModal(false);
        fetchInventoryData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording material transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-navy-950">
            Material Inventory & Procurement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock ledger calculated from actual delivery receipts, site issues, returns, and wastage.
          </p>
        </div>

        <button
          onClick={() => setShowTransModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-brand-gold-400" />
          <span>Record Material Movement</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        {[
          { id: 'stock', label: 'Live Stock Balances' },
          { id: 'suppliers', label: 'Suppliers Directory' },
          { id: 'orders', label: 'Purchase Orders' },
          { id: 'transactions', label: 'Material Ledger Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 transition-colors relative ${
              activeTab === tab.id
                ? 'text-brand-navy-950 border-b-2 border-brand-navy-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Live Stock Balances */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Stock Computed Directly from Transaction Records</span>
            <span className="text-slate-500">{stockSummary.length} Active Materials Tracked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Material Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Delivered / Inward</th>
                  <th className="py-3.5 px-4 text-right">Issued to Sites</th>
                  <th className="py-3.5 px-4 text-right">Current Available Stock</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-navy-950">
                      {item.materialName}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">
                      {item.category?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                      {item.totalReceived} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                      {item.totalIssued} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-brand-navy-900">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.currentStock > 20 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Sufficient Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Reorder Alert
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suppliers.map((sup) => (
            <div key={sup._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading font-bold text-base text-brand-navy-950">{sup.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold capitalize mt-0.5">Category: {sup.category?.replace('_', ' ')}</p>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {sup.gstin || 'GST Unregistered'}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>Contact Person: <strong>{sup.contactPerson}</strong> ({sup.phone})</p>
                <p>Address: {sup.address}</p>
                <p>Payment Terms: {sup.paymentTermsDays} days credit</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Outstanding Payable:</span>
                <strong className="text-rose-600 font-mono text-sm">
                  {formatINR(sup.outstandingBalancePaise || 0)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4 font-right">Total (Inc. 18% GST)</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy-950">
                      {po.poNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {po.supplierName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {po.projectTitle}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy-950">
                      {formatINR(po.grandTotalPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                        {po.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Material Ledger Log */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Material</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4">Project & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(tx.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-navy-950">
                      {tx.materialName}
                    </td>
                    <td className="py-3.5 px-4">
                      {tx.transactionType === 'purchase_receipt' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Delivery Receipt</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Issued to Site</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {tx.quantity} {tx.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <strong className="block text-slate-900">{tx.projectId?.title || 'Site'}</strong>
                      <span className="text-[11px] text-slate-500">{tx.notes || 'No remarks'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="text-base font-heading font-bold text-brand-navy-950">
              Record Material Movement (Live Stock Ledger)
            </h3>

            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Site *</label>
                <select
                  value={transProject}
                  onChange={(e) => setTransProject(e.target.value)}
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
                <label className="block font-semibold text-slate-700 mb-1">Transaction Type *</label>
                <select
                  value={transType}
                  onChange={(e) => setTransType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="site_issue">Site Issue (Consumed on site)</option>
                  <option value="purchase_receipt">Purchase Receipt (Supplier Delivery)</option>
                  <option value="site_return">Site Return (Returned to central yard)</option>
                  <option value="wastage">Wastage / Breakage</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={transMaterial}
                  onChange={(e) => setTransMaterial(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={transQuantity}
                    onChange={(e) => setTransQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-right font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={transUnit}
                    onChange={(e) => setTransUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Purpose</label>
                <input
                  type="text"
                  value={transNotes}
                  onChange={(e) => setTransNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 shadow"
                >
                  {isSubmitting ? 'Recording...' : 'Update Stock Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
