import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  User, 
  Clock, 
  Download, 
  Eye, 
  RotateCcw, 
  FileText, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateChecklistPDF } from '../utils/pdfGenerator';
import { ChecklistReport } from '../types';

export const ReportHistory: React.FC = () => {
  const {
    reports,
    outlets,
    shifts,
    allEmployees,
    setPreviewReport,
    loadReportForEditing,
    currentUser,
  } = useApp();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedChecklistType, setSelectedChecklistType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVarianceOnly, setSelectedVarianceOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Selected audit trail view modal
  const [inspectAuditReport, setInspectAuditReport] = useState<ChecklistReport | null>(null);

  // Apply filters
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Role permission: if cashier, allow viewing outlet reports
      const matchesSearch = 
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cashierEmployeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.outletName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOutlet = selectedOutlet === 'all' || r.outletId === selectedOutlet;
      const matchesEmployee = selectedEmployee === 'all' || r.cashierId === selectedEmployee || r.cashierEmployeeId === selectedEmployee;
      const matchesShift = selectedShift === 'all' || r.shiftType === selectedShift;
      const matchesType = selectedChecklistType === 'all' || r.checklistType === selectedChecklistType;
      const matchesStatus = selectedStatus === 'all' || r.approvalStatus === selectedStatus;
      const matchesDate = !selectedDate || r.date === selectedDate;
      const matchesVariance = !selectedVarianceOnly || (r.cashReconciliation && Math.abs(r.cashReconciliation.variance) > 0.05);

      return matchesSearch && matchesOutlet && matchesEmployee && matchesShift && matchesType && matchesStatus && matchesDate && matchesVariance;
    });
  }, [reports, searchQuery, selectedOutlet, selectedEmployee, selectedShift, selectedChecklistType, selectedStatus, selectedDate, selectedVarianceOnly]);

  const handleDownload = async (r: ChecklistReport) => {
    await generateChecklistPDF(r);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
            HISTORICAL AUDIT ARCHIVE
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Checklist Reports & Compliance Records
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Search, filter, and download immutable records of past cashier shift operations.
          </p>
        </div>

        <div className="text-xs font-mono text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
          Showing <strong className="text-amber-400">{filteredReports.length}</strong> of {reports.length} records
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Report ID, Cashier Name, ID..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Outlet Selector */}
          <div>
            <select
              value={selectedOutlet}
              onChange={e => setSelectedOutlet(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Outlets</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Checklist Type */}
          <div>
            <select
              value={selectedChecklistType}
              onChange={e => setSelectedChecklistType(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Checklist Types</option>
              <option value="opening">Opening Checklist</option>
              <option value="mid_shift">Mid-Shift Checklist</option>
              <option value="handover">Shift Handover</option>
              <option value="closing">Closing Checklist</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Approval States</option>
              <option value="approved">Approved</option>
              <option value="submitted">Submitted</option>
              <option value="returned_for_correction">Returned</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Employees</option>
              {allEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeId})
                </option>
              ))}
            </select>

            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Shifts</option>
              {shifts.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={selectedVarianceOnly}
                onChange={e => setSelectedVarianceOnly(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Cash Discrepancies Only</span>
            </label>
          </div>

          {(searchQuery || selectedOutlet !== 'all' || selectedShift !== 'all' || selectedChecklistType !== 'all' || selectedStatus !== 'all' || selectedDate || selectedVarianceOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOutlet('all');
                setSelectedShift('all');
                setSelectedChecklistType('all');
                setSelectedStatus('all');
                setSelectedDate('');
                setSelectedVarianceOnly(false);
              }}
              className="text-amber-400 hover:underline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[11px] font-mono">
              <tr>
                <th className="py-3 px-4">REPORT ID & DATE</th>
                <th className="py-3 px-4">CHECKLIST & SHIFT</th>
                <th className="py-3 px-4">OUTLET</th>
                <th className="py-3 px-4">CASHIER & MOS</th>
                <th className="py-3 px-4">CASH VARIANCE</th>
                <th className="py-3 px-4">APPROVAL STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    No historical records match the applied criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-amber-400 block">{report.id}</span>
                      <span className="text-[11px] text-neutral-400">{report.date} ({report.dayOfWeek})</span>
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="font-medium text-white block">{report.checklistType.replace('_', ' ')}</span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {report.shiftType} ({report.shiftStartTime} - {report.shiftEndTime})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-neutral-300 font-medium">{report.outletName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-white">{report.cashierName}</span>
                      <span className="text-[10px] font-mono text-neutral-400 ml-1">[{report.cashierEmployeeId}]</span>
                      <span className="block text-[11px] text-neutral-400">MOS: {report.managerOnShiftName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
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
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewReport(report)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                          title="Preview full document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(report)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInspectAuditReport(report)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                          title="View audit trail"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {(report.approvalStatus === 'draft' || report.approvalStatus === 'returned_for_correction') && (
                          <button
                            onClick={() => loadReportForEditing(report.id)}
                            className="px-2 py-1 rounded bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-[11px] font-medium transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail Timeline Modal */}
      {inspectAuditReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  Audit Trail & Compliance Log
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{inspectAuditReport.id}</p>
              </div>
              <button
                onClick={() => setInspectAuditReport(null)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              {inspectAuditReport.auditTrail.map((entry, idx) => (
                <div key={idx} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[11px] font-mono">
                    <span className="font-semibold text-amber-400">{entry.action}</span>
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-neutral-200">{entry.details}</p>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Staff: {entry.employeeName} [{entry.employeeId}] · Role: {entry.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
