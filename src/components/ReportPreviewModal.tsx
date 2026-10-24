import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Clock, 
  FileText, 
  ShieldCheck,
  Camera,
  ExternalLink
} from 'lucide-react';
import { ChecklistReport } from '../types';
import { generateChecklistPDF } from '../utils/pdfGenerator';

interface ReportPreviewModalProps {
  report: ChecklistReport | null;
  onClose: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({ report, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!report) return null;

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      await generateChecklistPDF(report);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const completedCount = report.tasks.filter(t => t.status === 'completed').length;
  const issueCount = report.tasks.filter(t => t.status === 'issue_found').length;
  const naCount = report.tasks.filter(t => t.status === 'not_applicable').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[95vh]">
        
        {/* Top Control Bar */}
        <div className="no-print px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                Official Report Document · {report.id}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  report.approvalStatus === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : report.approvalStatus === 'submitted'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {report.approvalStatus.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-xs text-neutral-400">Version {report.version} · {report.outletName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-neutral-900 text-neutral-100 space-y-6">
          
          {/* Official Letterhead Header */}
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white p-2 border border-neutral-700 shrink-0 shadow-lg flex items-center justify-center">
                <img
                  src="/assets/aistudio/image_0e8220c4.png"
                  alt="th Cashier Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                  RESTAURANT CASHIER OPERATIONS AUDIT
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {report.checklistType.replace('_', ' ').toUpperCase()} CHECKLIST
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {report.outletName} · Duty Shift: {report.shiftType.toUpperCase()} ({report.shiftStartTime} - {report.shiftEndTime})
                </p>
              </div>
            </div>

            {/* Approval Stamp Box */}
            <div className="border-2 border-dashed rounded-xl p-3 text-center sm:text-right shrink-0 min-w-[140px] bg-neutral-900/60">
              <span className="block text-[10px] uppercase font-mono text-neutral-400">
                AUDIT STATUS
              </span>
              <span className={`text-sm font-bold uppercase tracking-wider block ${
                report.approvalStatus === 'approved' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {report.approvalStatus.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
                {report.id}
              </span>
            </div>
          </div>

          {/* Operational Header Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div>
              <span className="block text-[11px] text-neutral-500 font-medium">Business Date & Day</span>
              <span className="font-semibold text-neutral-200">{report.date} ({report.dayOfWeek})</span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-500 font-medium">Duty Cashier</span>
              <span className="font-semibold text-neutral-200">{report.cashierName} [{report.cashierEmployeeId}]</span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-500 font-medium">Manager on Shift</span>
              <span className="font-semibold text-neutral-200">{report.managerOnShiftName}</span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-500 font-medium">Checklist Start / End</span>
              <span className="font-mono text-neutral-300">
                {new Date(report.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {report.submittedAt ? ` · ${new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </div>
          </div>

          {/* Metric Summary KPI */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400">Completed Tasks</span>
              <span className="block text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {completedCount} / {report.tasks.length}
              </span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400">Issues Encountered</span>
              <span className={`block text-xl font-bold font-mono tabular-nums ${issueCount > 0 ? 'text-rose-400' : 'text-neutral-300'}`}>
                {issueCount}
              </span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400">Marked N/A</span>
              <span className="block text-xl font-bold font-mono text-neutral-400 tabular-nums">
                {naCount}
              </span>
            </div>
          </div>

          {/* Cash Drawer Reconciliation Section */}
          {report.cashReconciliation && (
            <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span>Cash Reconciliation Statement</span>
                <span className={`font-mono text-xs font-semibold ${
                  report.cashReconciliation.variance === 0
                    ? 'text-emerald-400'
                    : report.cashReconciliation.variance < 0
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}>
                  Variance: ${report.cashReconciliation.variance.toFixed(2)}
                </span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-neutral-900 rounded-lg">
                  <span className="text-[11px] text-neutral-400 block">Opening Float</span>
                  <span className="font-mono font-bold text-neutral-200 tabular-nums">
                    ${report.cashReconciliation.openingFloat.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg">
                  <span className="text-[11px] text-neutral-400 block">Cash Sales (+)</span>
                  <span className="font-mono font-bold text-neutral-200 tabular-nums">
                    ${report.cashReconciliation.cashSales.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg">
                  <span className="text-[11px] text-neutral-400 block">Expected in Drawer</span>
                  <span className="font-mono font-bold text-neutral-200 tabular-nums">
                    ${report.cashReconciliation.expectedCash.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg">
                  <span className="text-[11px] text-neutral-400 block">Physical Count</span>
                  <span className="font-mono font-bold text-neutral-200 tabular-nums">
                    ${report.cashReconciliation.physicalCashCount.toFixed(2)}
                  </span>
                </div>
              </div>

              {report.cashReconciliation.varianceReason && (
                <div className="p-3 bg-neutral-900 rounded-lg text-xs text-neutral-300 border border-neutral-800">
                  <span className="text-[11px] font-semibold text-amber-400 block mb-0.5">Variance Note:</span>
                  {report.cashReconciliation.varianceReason}
                </div>
              )}
            </div>
          )}

          {/* Task Breakdown Table */}
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800 font-semibold text-xs text-neutral-200">
              Task Execution & Verification Records
            </div>
            <div className="divide-y divide-neutral-800/60 text-xs">
              {report.tasks.map((task, idx) => (
                <div key={idx} className="p-3.5 hover:bg-neutral-900/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 max-w-xl">
                    <div className="text-[11px] text-neutral-500 font-mono">{task.category}</div>
                    <div className="font-medium text-neutral-200 flex items-center gap-2">
                      <span>{task.title}</span>
                      {task.isMandatory && (
                        <span className="text-[10px] text-amber-400 font-normal">· Mandatory</span>
                      )}
                    </div>
                    {task.remarks && (
                      <p className="text-[11px] text-neutral-400 italic">Remarks: {task.remarks}</p>
                    )}
                    {task.naReason && (
                      <p className="text-[11px] text-neutral-400 italic">N/A Reason: {task.naReason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {task.photoEvidence && (
                      <button
                        onClick={() => setSelectedPhoto(task.photoEvidence?.dataUrl || null)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 text-[11px] text-amber-300 hover:bg-neutral-700 transition-colors"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Photo Proof</span>
                      </button>
                    )}

                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold ${
                        task.status === 'completed'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : task.status === 'issue_found'
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-neutral-400 bg-neutral-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {task.completedByEmployeeId ? `${task.completedByEmployeeId} · ` : ''}
                        {task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Evidence Gallery (if any) */}
          {report.tasks.some(t => t.photoEvidence) && (
            <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                Attached Photographic Evidence Thumbnails
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {report.tasks.filter(t => t.photoEvidence).map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(t.photoEvidence!.dataUrl)}
                    className="group relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 cursor-pointer aspect-video hover:border-amber-400 transition-all"
                  >
                    <img
                      src={t.photoEvidence!.dataUrl}
                      alt={t.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 flex flex-col justify-end text-[10px]">
                      <span className="text-white font-medium truncate">{t.title}</span>
                      <span className="text-neutral-400 font-mono">{t.photoEvidence!.capturedByEmployeeId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign-Off & Official Audit Block */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-neutral-800 pb-4 sm:pb-0 sm:pr-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Cashier Submission Attestation
              </span>
              <p className="text-neutral-300">
                I hereby attest that all checklist items, till count values, and recorded logs strictly represent the physical workstation state and authorized transactions.
              </p>
              <div className="pt-2 font-mono text-[11px] text-neutral-400">
                <div>Cashier: <strong className="text-neutral-200">{report.cashierName}</strong> [{report.cashierEmployeeId}]</div>
                <div>Digital Signature Token: <span className="text-amber-400 font-mono">AUTH-SIG-{report.cashierEmployeeId}-{report.id.slice(-4)}</span></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Manager on Shift Review & Final Decision
              </span>
              <p className="text-neutral-300">
                Review Remarks: {report.managerApproval?.reviewRemarks || 'No formal manager remarks logged yet.'}
              </p>
              <div className="pt-2 font-mono text-[11px] text-neutral-400">
                <div>Manager: <strong className="text-neutral-200">{report.managerOnShiftName}</strong></div>
                <div>Status: <span className="uppercase text-emerald-400 font-semibold">{report.managerApproval?.status || 'PENDING'}</span></div>
                <div>Timestamp: {report.managerApproval?.decisionTimestamp ? new Date(report.managerApproval.decisionTimestamp).toLocaleString() : 'Pending'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Photo Inspector */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-amber-400"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged Evidence"
              className="max-h-[85vh] w-auto object-contain rounded-xl border border-neutral-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
