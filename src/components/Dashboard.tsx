import React from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Download, 
  TrendingUp, 
  Building2, 
  ShieldCheck, 
  Play,
  RotateCcw,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChecklistType } from '../types';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    reports,
    activeReport,
    startNewChecklist,
    loadReportForEditing,
    setActiveTab,
    setPreviewReport,
    outlets,
    shifts,
    allEmployees,
  } = useApp();

  // Metric aggregates
  const pendingApprovalsCount = reports.filter(r => r.approvalStatus === 'submitted').length;
  const returnedCount = reports.filter(r => r.approvalStatus === 'returned_for_correction').length;
  const cashVarianceReports = reports.filter(r => r.cashReconciliation && Math.abs(r.cashReconciliation.variance) > 0.05).length;
  
  // Total completed tasks across reports
  const totalReportsCount = reports.length;
  const approvedCount = reports.filter(r => r.approvalStatus === 'approved').length;

  const handleQuickStart = (type: ChecklistType) => {
    const defaultOutlet = outlets[0];
    const defaultShift = shifts[0];
    const defaultManager = allEmployees.find(e => e.role === 'manager') || allEmployees[0];

    startNewChecklist({
      checklistType: type,
      outletId: currentUser.outletId || defaultOutlet.id,
      shiftType: defaultShift.id,
      managerOnShiftId: defaultManager.id,
    });
    setActiveTab('checklist');
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Welcome & Shift Status Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 border border-neutral-700 shrink-0 shadow flex items-center justify-center">
              <img
                src="/assets/aistudio/image_0e8220c4.png"
                alt="th Cashier Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                RESTAURANT CASHIER OPERATIONS DESK
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome back, {currentUser.fullName}
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {currentUser.outletName} · Employee ID: <span className="font-mono text-neutral-200">{currentUser.employeeId}</span> · Role: <span className="capitalize text-neutral-200">{currentUser.role}</span>
              </p>
            </div>
          </div>

          {/* Quick Active Draft Resume Button */}
          {activeReport && (
            <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center gap-3">
              <div className="text-left">
                <span className="block text-[10px] font-mono uppercase text-amber-400">
                  ACTIVE DRAFT IN PROGRESS
                </span>
                <span className="text-xs font-semibold text-neutral-200 block truncate max-w-[170px]">
                  {activeReport.id}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('checklist')}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm"
              >
                <span>Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Awaiting Manager Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {pendingApprovalsCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Pending approval in queue</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Approved Submissions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {approvedCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Locked and audited reports</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Cash Discrepancies</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {cashVarianceReports}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Non-zero variance cases</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Returned for Correction</span>
            <RotateCcw className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {returnedCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Requiring cashier action</p>
        </div>
      </div>

      {/* Start Checklist Operational Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
            Cashier Shift Checklists
          </h2>
          <span className="text-xs text-neutral-500">Select shift stage to launch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              type: 'opening' as ChecklistType,
              title: 'Opening Checklist',
              time: '07:00 - 10:00',
              desc: 'Attendance, float verification, POS boot, EDC devices, advances.',
              color: 'text-amber-400',
              border: 'hover:border-amber-400/50',
            },
            {
              type: 'mid_shift' as ChecklistType,
              title: 'Mid-Shift Checklist',
              time: '12:00 - 15:00',
              desc: 'Billing accuracy, table audit, mid-day safe skim, card verification.',
              color: 'text-blue-400',
              border: 'hover:border-blue-400/50',
            },
            {
              type: 'handover' as ChecklistType,
              title: 'Shift Handover',
              time: 'Between Shifts',
              desc: 'Physical till count, open tabs transfer, dual staff custody sign-off.',
              color: 'text-purple-400',
              border: 'hover:border-purple-400/50',
            },
            {
              type: 'closing' as ChecklistType,
              title: 'Closing Checklist',
              time: '22:00 - 24:00',
              desc: 'Z-Report, denomination cash recon, payment channel reconciliation, security.',
              color: 'text-emerald-400',
              border: 'hover:border-emerald-400/50',
            },
          ].map(item => (
            <div
              key={item.type}
              className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between transition-all ${item.border}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold ${item.color}`}>
                    {item.time}
                  </span>
                  <ClipboardCheck className={`w-4 h-4 ${item.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800/80">
                <button
                  onClick={() => handleQuickStart(item.type)}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start {item.title}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outlets & Staff Quick Management */}
      {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:border-neutral-700">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Restaurant Outlets</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {outlets.length} properties configured · Manage branches & operational statuses
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('outlets')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:border-neutral-700">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Employee Rosters</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {allEmployees.length} registered staff · Assign multi-outlet authorizations & roles
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('employees')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity & Reports Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Shift Reports & Audit Log</h3>
            <p className="text-xs text-neutral-400">All authenticated submissions for current and past shifts.</p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            <span>View All ({reports.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[11px] font-mono">
              <tr>
                <th className="py-3 px-4">REPORT ID</th>
                <th className="py-3 px-4">TYPE & SHIFT</th>
                <th className="py-3 px-4">DUTY CASHIER</th>
                <th className="py-3 px-4">DATE & TIME</th>
                <th className="py-3 px-4">CASH VARIANCE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {reports.slice(0, 5).map(report => (
                <tr key={report.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-amber-400">
                    {report.id}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span className="font-medium text-white">{report.checklistType.replace('_', ' ')}</span>
                    <span className="block text-[11px] text-neutral-400">{report.outletName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-white">{report.cashierName}</span>
                    <span className="block text-[11px] font-mono text-neutral-400">[{report.cashierEmployeeId}]</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-300">
                    <div>{report.date}</div>
                    <div className="text-[10px] text-neutral-500">
                      {new Date(report.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {report.cashReconciliation ? (
                      <span className={`font-semibold tabular-nums ${
                        report.cashReconciliation.variance === 0
                          ? 'text-emerald-400'
                          : report.cashReconciliation.variance < 0
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}>
                        ${report.cashReconciliation.variance.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-neutral-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      report.approvalStatus === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : report.approvalStatus === 'submitted'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : report.approvalStatus === 'returned_for_correction'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {report.approvalStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setPreviewReport(report)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
