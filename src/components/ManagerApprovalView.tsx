import React, { useState } from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Camera, 
  User, 
  Eye, 
  Download,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChecklistReport } from '../types';

export const ManagerApprovalView: React.FC = () => {
  const {
    currentUser,
    reports,
    approveReport,
    returnReportForCorrection,
    rejectReport,
    setPreviewReport,
    setCurrentUser,
    allEmployees,
  } = useApp();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(() => {
    const firstPending = reports.find(r => r.approvalStatus === 'submitted');
    return firstPending ? firstPending.id : reports[0]?.id || null;
  });

  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'returned_for_correction'>('all');
  
  // Modals for actions
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState('');
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'admin';

  // Filter reports
  const filteredReports = reports.filter(r => {
    if (statusFilter === 'all') return true;
    return r.approvalStatus === statusFilter;
  });

  const selectedReport = reports.find(r => r.id === selectedReportId) || filteredReports[0] || null;

  const handleApprove = () => {
    if (!selectedReport) return;
    approveReport(selectedReport.id, approveRemarks || 'Checklist reviewed and approved per SOP.');
    setShowApproveModal(false);
    setApproveRemarks('');
  };

  const handleReturn = () => {
    if (!selectedReport || !returnRemarks.trim()) return;
    returnReportForCorrection(selectedReport.id, returnRemarks);
    setShowReturnModal(false);
    setReturnRemarks('');
  };

  const handleReject = () => {
    if (!selectedReport || !rejectReason.trim()) return;
    rejectReport(selectedReport.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  // Quick switch to manager account if current user is cashier
  const handleSwitchToManager = () => {
    const manager = allEmployees.find(e => e.role === 'manager') || allEmployees[2];
    setCurrentUser(manager);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
            SHIFT AUDIT & COMPLIANCE DESK
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Manager Review & Approval Center
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit submitted cashier checklists, inspect photographic proof, and execute operational sign-offs.
          </p>
        </div>

        {/* Status role warning */}
        {!isManagerOrAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs text-neutral-300">
              <span>Viewing in Cashier mode. To execute approvals: </span>
              <button
                onClick={handleSwitchToManager}
                className="text-amber-400 hover:underline font-semibold"
              >
                Switch to Shift Manager (Marcus Vance)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Split Grid: Reports Queue (Left) & Inspector Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Review Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Submission Queue ({filteredReports.length})
            </span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Awaiting Review</option>
              <option value="returned_for_correction">Returned</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filteredReports.map(report => {
              const isSelected = selectedReport?.id === report.id;
              const hasVariance = report.cashReconciliation && Math.abs(report.cashReconciliation.variance) > 0.05;

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-neutral-800 border-amber-400/80 shadow-md'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-amber-400">{report.id}</span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                      report.approvalStatus === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : report.approvalStatus === 'submitted'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {report.approvalStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white">
                    {report.checklistType.replace('_', ' ').toUpperCase()} CHECKLIST
                  </h4>

                  <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{report.cashierName} [{report.cashierEmployeeId}]</span>
                    <span>·</span>
                    <span>{report.outletName}</span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>{report.date}</span>
                    {hasVariance && (
                      <span className="text-rose-400 font-semibold">
                        Variance: ${report.cashReconciliation!.variance.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Report Inspection (7 cols) */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
              
              {/* Report Header Strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">{selectedReport.id}</span>
                    <span className="text-xs text-neutral-500">·</span>
                    <span className="text-xs text-neutral-400">Version {selectedReport.version}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedReport.checklistType.replace('_', ' ').toUpperCase()}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Cashier: <strong className="text-neutral-200">{selectedReport.cashierName} [{selectedReport.cashierEmployeeId}]</strong> · MOS: {selectedReport.managerOnShiftName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewReport(selectedReport)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Full Document</span>
                  </button>
                </div>
              </div>

              {/* Cash Reconciliation Summary Callout */}
              {selectedReport.cashReconciliation && (
                <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-300">Cash Drawer Audit</span>
                    <span className={`font-mono text-sm ${
                      selectedReport.cashReconciliation.variance === 0
                        ? 'text-emerald-400'
                        : selectedReport.cashReconciliation.variance < 0
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}>
                      Variance: ${selectedReport.cashReconciliation.variance.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono pt-1">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Float</span>
                      <span className="text-neutral-200">${selectedReport.cashReconciliation.openingFloat.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Sales</span>
                      <span className="text-neutral-200">${selectedReport.cashReconciliation.cashSales.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Expected</span>
                      <span className="text-neutral-200">${selectedReport.cashReconciliation.expectedCash.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Physical</span>
                      <span className="text-neutral-200">${selectedReport.cashReconciliation.physicalCashCount.toFixed(2)}</span>
                    </div>
                  </div>
                  {selectedReport.cashReconciliation.varianceReason && (
                    <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-2">
                      <strong>Cashier Explanation:</strong> {selectedReport.cashReconciliation.varianceReason}
                    </div>
                  )}
                </div>
              )}

              {/* Tasks Checklist Inspection */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Task Execution Records ({selectedReport.tasks.length})
                </h4>
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-800/80 bg-neutral-950 p-2 rounded-2xl border border-neutral-800 text-xs">
                  {selectedReport.tasks.map((task, idx) => (
                    <div key={idx} className="p-2.5 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-neutral-500 font-mono">{task.category}</div>
                        <div className="font-medium text-neutral-200">{task.title}</div>
                        {task.remarks && (
                          <div className="text-[11px] text-amber-400 mt-0.5">Note: {task.remarks}</div>
                        )}
                        {task.naReason && (
                          <div className="text-[11px] text-neutral-400 mt-0.5">N/A Reason: {task.naReason}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.photoEvidence && (
                          <button
                            onClick={() => setInspectPhotoUrl(task.photoEvidence!.dataUrl)}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400"
                            title="Inspect photo proof"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : task.status === 'issue_found'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Remarks (if already approved/reviewed) */}
              {selectedReport.managerApproval && (
                <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs space-y-1">
                  <span className="text-[11px] text-neutral-500 font-medium">Prior Manager Decision:</span>
                  <div className="font-semibold text-white capitalize">
                    {selectedReport.managerApproval.status.replace('_', ' ')} by {selectedReport.managerApproval.managerName}
                  </div>
                  <p className="text-neutral-400 italic">"{selectedReport.managerApproval.reviewRemarks}"</p>
                </div>
              )}

              {/* Action Buttons for Manager */}
              <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={!isManagerOrAdmin || selectedReport.isLocked}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  Reject Report
                </button>

                <button
                  onClick={() => setShowReturnModal(true)}
                  disabled={!isManagerOrAdmin || selectedReport.isLocked}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  Request Corrections
                </button>

                <button
                  onClick={() => setShowApproveModal(true)}
                  disabled={!isManagerOrAdmin || selectedReport.approvalStatus === 'approved'}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg shadow-emerald-500/10 disabled:opacity-40"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Approve & Lock Report</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-xs text-neutral-400">
              No reports selected.
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Approve Cashier Checklist
            </h3>
            <p className="text-xs text-neutral-400">
              This will officially stamp report <strong className="text-neutral-200 font-mono">{selectedReport?.id}</strong> with your manager credentials and lock the record against editing.
            </p>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-300">Manager Review Remarks</label>
              <textarea
                rows={3}
                value={approveRemarks}
                onChange={e => setApproveRemarks(e.target.value)}
                placeholder="All counts verified, equipment stored correctly, approved."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Correction Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              Return for Corrections
            </h3>
            <p className="text-xs text-neutral-400">
              Specify what the cashier must correct before the report can be approved:
            </p>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-300">Required Corrections <span className="text-amber-400">*</span></label>
              <textarea
                rows={3}
                value={returnRemarks}
                onChange={e => setReturnRemarks(e.target.value)}
                placeholder="e.g. Please re-count quarter rolls, cash variance note is missing details, attach EDC settlement slip..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={!returnRemarks.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300 disabled:opacity-40"
              >
                Return to Cashier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-rose-400">
              <XCircle className="w-5 h-5" />
              Reject Checklist Submission
            </h3>
            <p className="text-xs text-neutral-400">
              Provide mandatory escalation justification for rejecting this report:
            </p>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-300">Mandatory Justification <span className="text-rose-400">*</span></label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="State formal audit reason for checklist rejection..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-40"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Photo Inspector */}
      {inspectPhotoUrl && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button
              onClick={() => setInspectPhotoUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-amber-400 text-xs font-mono"
            >
              Close [ESC]
            </button>
            <img
              src={inspectPhotoUrl}
              alt="Evidence Fullsize"
              className="max-h-[80vh] w-auto object-contain rounded-2xl border border-neutral-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
