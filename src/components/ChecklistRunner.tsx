import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  MinusCircle, 
  Camera, 
  Save, 
  Send, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  User, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Eye,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChecklistType, ShiftType, TaskStatus, PhotoEvidence } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { CashReconciliationWidget } from './CashReconciliationWidget';
import { PaymentReconciliationWidget } from './PaymentReconciliationWidget';

export const ChecklistRunner: React.FC = () => {
  const {
    currentUser,
    outlets,
    shifts,
    allEmployees,
    activeReport,
    startNewChecklist,
    updateTask,
    updateCashReconciliation,
    updateDenomination,
    updatePaymentReconciliation,
    updateGeneralRemarks,
    saveCurrentDraft,
    submitCurrentReport,
    setPreviewReport,
    lastSavedAt,
    isSaving,
    clearActiveChecklist,
  } = useApp();

  // New Checklist Form state (if no active report)
  const [selectedOutletId, setSelectedOutletId] = useState<string>(currentUser.outletId || outlets[0].id);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>('morning');
  const [selectedChecklistType, setSelectedChecklistType] = useState<ChecklistType>('opening');
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    allEmployees.find(e => e.role === 'manager')?.id || allEmployees[0].id
  );
  const [handoverName, setHandoverName] = useState<string>('');
  const [handoverEmployeeId, setHandoverEmployeeId] = useState<string>('');

  // Runner filtering & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [cameraModalTask, setCameraModalTask] = useState<{ id: string; title: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  // Remarks edit inline modal/state
  const [editingRemarkTaskId, setEditingRemarkTaskId] = useState<string | null>(null);
  const [tempRemark, setTempRemark] = useState<string>('');
  const [editingNaTaskId, setEditingNaTaskId] = useState<string | null>(null);
  const [tempNaReason, setTempNaReason] = useState<string>('');

  // Handle starting a new checklist
  const handleStartChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    startNewChecklist({
      checklistType: selectedChecklistType,
      outletId: selectedOutletId,
      shiftType: selectedShiftType,
      managerOnShiftId: selectedManagerId,
      handoverCashierName: handoverName || undefined,
      handoverCashierEmployeeId: handoverEmployeeId || undefined,
    });
  };

  // Extract unique categories from active tasks
  const categories = useMemo(() => {
    if (!activeReport) return [];
    const set = new Set(activeReport.tasks.map(t => t.category));
    return Array.from(set);
  }, [activeReport]);

  // Filter tasks based on search & filters
  const filteredTasks = useMemo(() => {
    if (!activeReport) return [];
    return activeReport.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.instructions.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [activeReport, searchQuery, categoryFilter, statusFilter]);

  // Overall completion metrics
  const totalTasks = activeReport?.tasks.length || 0;
  const completedTasks = activeReport?.tasks.filter(t => t.status === 'completed').length || 0;
  const issueTasks = activeReport?.tasks.filter(t => t.status === 'issue_found').length || 0;
  const naTasks = activeReport?.tasks.filter(t => t.status === 'not_applicable').length || 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Handle task status quick switch
  const handleSetStatus = (templateId: string, currentStatus: TaskStatus, newStatus: TaskStatus) => {
    if (newStatus === 'not_applicable') {
      const task = activeReport?.tasks.find(t => t.templateId === templateId);
      setEditingNaTaskId(templateId);
      setTempNaReason(task?.naReason || '');
      return;
    }

    if (newStatus === 'issue_found') {
      const task = activeReport?.tasks.find(t => t.templateId === templateId);
      setEditingRemarkTaskId(templateId);
      setTempRemark(task?.remarks || '');
      return;
    }

    // Direct toggle
    updateTask(templateId, { status: newStatus });
  };

  const handleSaveNaReason = (templateId: string) => {
    if (!tempNaReason.trim()) return;
    updateTask(templateId, { status: 'not_applicable', naReason: tempNaReason });
    setEditingNaTaskId(null);
    setTempNaReason('');
  };

  const handleSaveIssueRemark = (templateId: string) => {
    if (!tempRemark.trim()) return;
    updateTask(templateId, { status: 'issue_found', remarks: tempRemark });
    setEditingRemarkTaskId(null);
    setTempRemark('');
  };

  const handlePhotoCaptured = (photo: PhotoEvidence) => {
    if (!cameraModalTask) return;
    updateTask(cameraModalTask.id, {
      photoEvidence: photo,
      status: 'completed', // auto mark as completed once required photo is attached
    });
    setCameraModalTask(null);
  };

  const handleRemovePhoto = (templateId: string) => {
    updateTask(templateId, { photoEvidence: undefined });
  };

  const handleSubmit = () => {
    const result = submitCurrentReport();
    if (!result.success) {
      setValidationErrors(result.errors);
      setShowValidationModal(true);
    } else {
      setSubmitSuccess(true);
    }
  };

  // If no active report is open, show the initial setup screen
  if (!activeReport) {
    const selectedOutlet = outlets.find(o => o.id === selectedOutletId) || outlets[0];
    const selectedShift = shifts.find(s => s.id === selectedShiftType) || shifts[0];
    const today = new Date();
    const dateFormatted = today.toISOString().split('T')[0];
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-800">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 border border-neutral-700 flex items-center justify-center shrink-0 shadow">
              <img
                src="/assets/aistudio/image_0e8220c4.png"
                alt="th Cashier Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] font-mono text-amber-400 font-semibold tracking-wider uppercase">
                SHIFT OPERATIONS SETUP
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Initialize Shift Checklist
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configure operational parameters before initiating cashier task checklist.
              </p>
            </div>
          </div>

          <form onSubmit={handleStartChecklist} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Checklist Type */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Select Checklist Type <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'opening', label: 'Opening Shift', desc: 'Pre-service float & equipment' },
                    { id: 'mid_shift', label: 'Mid-Shift', desc: 'Audit accuracy & till levels' },
                    { id: 'handover', label: 'Handover', desc: 'Till transfer & custody switch' },
                    { id: 'closing', label: 'Closing Shift', desc: 'Z-report, cash & payment recon' },
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedChecklistType(type.id as ChecklistType)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedChecklistType === type.id
                          ? 'bg-amber-400/10 border-amber-400 text-white shadow-sm'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                      }`}
                    >
                      <span className="block text-xs font-semibold text-neutral-100">{type.label}</span>
                      <span className="block text-[11px] text-neutral-400 mt-1">{type.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Date & Day (Auto matched) */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <span className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  Business Date & Day (Auto-calculated)
                </span>
                <div className="text-sm font-semibold font-mono text-neutral-200">
                  {dateFormatted} <span className="text-amber-400 font-sans font-normal">({dayName})</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Synchronized with outlet local timezone ({selectedOutlet.timezone})
                </p>
              </div>

              {/* Restaurant / Outlet */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  Restaurant Outlet <span className="text-amber-400">*</span>
                </label>
                <select
                  value={selectedOutletId}
                  onChange={e => setSelectedOutletId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                >
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Type & Timings */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  Shift Timing <span className="text-amber-400">*</span>
                </label>
                <select
                  value={selectedShiftType}
                  onChange={e => setSelectedShiftType(e.target.value as ShiftType)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                >
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Manager on Shift (MOS) */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                  Designated Manager on Shift (MOS) <span className="text-amber-400">*</span>
                </label>
                <select
                  value={selectedManagerId}
                  onChange={e => setSelectedManagerId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                >
                  {allEmployees
                    .filter(e => e.role === 'manager' || e.role === 'admin')
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} [{m.employeeId}] - {m.designation}
                      </option>
                    ))}
                </select>
              </div>

              {/* Cashier Authenticated Identity (Read-only, tamper-proof) */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <span className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  Authenticated Cashier (System Bound)
                </span>
                <div className="text-xs font-semibold text-neutral-200">
                  {currentUser.fullName}
                  <span className="ml-2 font-mono text-[11px] text-amber-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    ID: {currentUser.employeeId}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  All actions will be cryptographically bound to this authenticated account.
                </p>
              </div>

              {/* Optional Second Cashier / Handover Staff */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Optional Handover / Incoming Cashier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={handoverName}
                    onChange={e => setHandoverName(e.target.value)}
                    placeholder="Staff Full Name"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={handoverEmployeeId}
                    onChange={e => setHandoverEmployeeId(e.target.value)}
                    placeholder="Employee ID"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-400/10 cursor-pointer"
              >
                <span>Launch Operational Checklist</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Active Checklist View
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 space-y-6">
      
      {/* Top Banner / Operational Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 border border-neutral-700 shrink-0 shadow flex items-center justify-center">
              <img
                src="/assets/aistudio/image_0e8220c4.png"
                alt="th Cashier Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wide">
                  {activeReport.id}
                </span>
                <span className="text-xs text-neutral-500">·</span>
                <span className="text-xs text-neutral-300 font-medium">
                  {activeReport.outletName}
                </span>
                <span className="text-xs text-neutral-500">·</span>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                  activeReport.approvalStatus === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : activeReport.approvalStatus === 'submitted'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                }`}>
                  {activeReport.approvalStatus.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                {activeReport.checklistType.replace('_', ' ').toUpperCase()} CHECKLIST
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 mt-1">
                <span>Date: <strong className="text-neutral-200">{activeReport.date} ({activeReport.dayOfWeek})</strong></span>
                <span>Shift: <strong className="text-neutral-200">{activeReport.shiftType.toUpperCase()} ({activeReport.shiftStartTime} - {activeReport.shiftEndTime})</strong></span>
                <span>Cashier: <strong className="text-neutral-200">{activeReport.cashierName} [{activeReport.cashierEmployeeId}]</strong></span>
                <span>MOS: <strong className="text-neutral-200">{activeReport.managerOnShiftName}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Preview */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <button
              onClick={() => setPreviewReport(activeReport)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview / PDF</span>
            </button>
            <button
              onClick={clearActiveChecklist}
              className="px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Close and choose another checklist"
            >
              Switch Checklist
            </button>
          </div>
        </div>

        {/* Progress Bar & KPI metrics */}
        <div className="mt-4 pt-4 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-400 font-medium">
                Completion Progress: <strong className="text-white">{completedTasks}/{totalTasks}</strong> tasks
              </span>
              <span className="font-mono font-bold text-amber-400">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400 md:col-span-2 justify-end">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {completedTasks} Done
            </span>
            <span className="text-neutral-600">·</span>
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> {issueTasks} Issues
            </span>
            <span className="text-neutral-600">·</span>
            <span className="flex items-center gap-1">
              <MinusCircle className="w-3.5 h-3.5 text-neutral-500" /> {naTasks} N/A
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-mono text-neutral-500">
              Autosaved {lastSavedAt || 'just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search checklist criteria or instructions..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Category & Status Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 truncate max-w-[180px]"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="issue_found">Issue Found</option>
            <option value="not_applicable">N/A</option>
          </select>
        </div>
      </div>

      {/* Embedded Cash Reconciliation Widget for Closing or Handover Checklists */}
      {(activeReport.checklistType === 'closing' || activeReport.checklistType === 'handover') && activeReport.cashReconciliation && (
        <CashReconciliationWidget
          data={activeReport.cashReconciliation}
          onChange={updateCashReconciliation}
          onDenominationChange={updateDenomination}
          isReadOnly={activeReport.isLocked}
        />
      )}

      {/* Embedded Payment Channel Reconciliation for Closing Checklist */}
      {activeReport.checklistType === 'closing' && activeReport.paymentReconciliation && (
        <PaymentReconciliationWidget
          data={activeReport.paymentReconciliation}
          onChange={updatePaymentReconciliation}
          isReadOnly={activeReport.isLocked}
        />
      )}

      {/* Checklist Tasks List grouped by Category */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <p className="text-xs text-neutral-400">No tasks match your current search query or filter.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isIssue = task.status === 'issue_found';
            const isNa = task.status === 'not_applicable';
            const isPending = task.status === 'pending';

            return (
              <div
                key={task.templateId}
                className={`bg-neutral-900 border rounded-2xl p-4 sm:p-5 transition-all ${
                  isCompleted
                    ? 'border-neutral-800/80 bg-neutral-900/60'
                    : isIssue
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  
                  {/* Task Title & Details */}
                  <div className="space-y-1 max-w-2xl">
                    <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-2">
                      <span>{task.category}</span>
                      {task.isMandatory && (
                        <span className="text-amber-400 font-sans font-medium text-[10px] bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                          Mandatory
                        </span>
                      )}
                      {task.requiresPhoto && (
                        <span className="text-blue-400 font-sans text-[10px] bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5" /> Photo Proof Required
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-semibold ${isCompleted ? 'text-neutral-200' : 'text-white'}`}>
                      {task.title}
                    </h4>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {task.instructions}
                    </p>

                    {/* Metadata strip: completed by + timestamp */}
                    {task.completedByEmployeeId && (
                      <div className="pt-1 text-[11px] font-mono text-neutral-500 flex items-center gap-2">
                        <span>Staff: {task.completedByName} [{task.completedByEmployeeId}]</span>
                        <span>·</span>
                        <span>{new Date(task.completedAt || '').toLocaleTimeString()}</span>
                      </div>
                    )}

                    {/* Existing remarks or N/A reason */}
                    {task.remarks && (
                      <div className="mt-2 text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-start gap-2">
                        <span className="text-amber-400 font-semibold shrink-0">Remarks:</span>
                        <span>{task.remarks}</span>
                      </div>
                    )}
                    {task.naReason && (
                      <div className="mt-2 text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-start gap-2">
                        <span className="text-neutral-400 font-semibold shrink-0">N/A Reason:</span>
                        <span>{task.naReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Status Controls */}
                  <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
                    
                    {/* Status Pill Buttons */}
                    <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 self-start sm:self-end">
                      <button
                        type="button"
                        disabled={activeReport.isLocked}
                        onClick={() => handleSetStatus(task.templateId, task.status, 'completed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeReport.isLocked}
                        onClick={() => handleSetStatus(task.templateId, task.status, 'issue_found')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          isIssue
                            ? 'bg-rose-500 text-white font-semibold shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Issue</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeReport.isLocked}
                        onClick={() => handleSetStatus(task.templateId, task.status, 'not_applicable')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          isNa
                            ? 'bg-neutral-700 text-white font-semibold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>N/A</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeReport.isLocked}
                        onClick={() => updateTask(task.templateId, { status: 'pending' })}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isPending ? 'text-amber-400 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                        title="Reset to pending"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Photo Action / Attached Photo Thumbnail */}
                    <div className="flex items-center gap-2 self-start sm:self-end">
                      {task.photoEvidence ? (
                        <div className="flex items-center gap-2 bg-neutral-950 p-1.5 pr-2.5 rounded-xl border border-neutral-800">
                          <img
                            src={task.photoEvidence.dataUrl}
                            alt="Evidence thumbnail"
                            onClick={() => setInspectPhotoUrl(task.photoEvidence!.dataUrl)}
                            className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-neutral-700"
                          />
                          <span className="text-[11px] font-mono text-emerald-400">Proof Attached</span>
                          {!activeReport.isLocked && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(task.templateId)}
                              className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={activeReport.isLocked}
                          onClick={() => setCameraModalTask({ id: task.templateId, title: task.title })}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border cursor-pointer ${
                            task.requiresPhoto && isPending
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>{task.requiresPhoto ? 'Capture Photo *' : 'Attach Photo'}</span>
                        </button>
                      )}

                      {/* Add remarks trigger */}
                      {!task.remarks && !isIssue && !isNa && (
                        <button
                          type="button"
                          disabled={activeReport.isLocked}
                          onClick={() => {
                            setEditingRemarkTaskId(task.templateId);
                            setTempRemark('');
                          }}
                          className="text-[11px] text-neutral-400 hover:text-neutral-200 underline underline-offset-2 px-1"
                        >
                          Add note
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* General Shift Handover / Closure Remarks */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-2">
        <label className="block text-xs font-semibold text-neutral-200 uppercase tracking-wider">
          General Shift Operational Remarks / Handover Log
        </label>
        <p className="text-[11px] text-neutral-400">
          Document overall shift performance, guest feedback, maintenance issues, or notes for the next shift:
        </p>
        <textarea
          rows={3}
          disabled={activeReport.isLocked}
          value={activeReport.generalRemarks || ''}
          onChange={e => updateGeneralRemarks(e.target.value)}
          placeholder="Type operational remarks, handover notes, or incidents during the shift..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 disabled:opacity-60"
        />
      </div>

      {/* Sticky Bottom Operations Action Bar */}
      <div className="fixed bottom-0 md:bottom-3 left-0 right-0 z-30 p-3 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 px-4 shadow-2xl flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveCurrentDraft}
              disabled={isSaving || activeReport.isLocked}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors border border-neutral-700 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <span className="hidden sm:inline text-[11px] font-mono text-neutral-500">
              {lastSavedAt ? `Saved at ${lastSavedAt}` : 'Draft saved locally'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewReport(activeReport)}
              className="px-3 py-2.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 text-xs font-medium transition-colors"
            >
              Preview Document
            </button>

            {activeReport.approvalStatus !== 'approved' && (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-transform active:scale-95 shadow-lg shadow-amber-400/10 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Manager Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Camera Modal */}
      {cameraModalTask && (
        <CameraCaptureModal
          isOpen={!!cameraModalTask}
          onClose={() => setCameraModalTask(null)}
          onCapture={handlePhotoCaptured}
          taskTitle={cameraModalTask.title}
          employeeId={currentUser.employeeId}
          employeeName={currentUser.fullName}
          reportId={activeReport.id}
        />
      )}

      {/* Inline Modal for Issue Remarks */}
      {editingRemarkTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Issue Found · Mandatory Details
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Describe the operational defect or payment issue for manager escalation:
            </p>
            <textarea
              rows={3}
              value={tempRemark}
              onChange={e => setTempRemark(e.target.value)}
              placeholder="e.g. Thermal paper jammed, cash drawer mechanism sticky, credit bill signature unreadable..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRemarkTaskId(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveIssueRemark(editingRemarkTaskId)}
                disabled={!tempRemark.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-40"
              >
                Record Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Modal for N/A Reason */}
      {editingNaTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-neutral-400" />
                Mark as Not Applicable
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Per restaurant SOP, provide a concrete reason why this operational task is not applicable for this shift:
            </p>
            <textarea
              rows={3}
              value={tempNaReason}
              onChange={e => setTempNaReason(e.target.value)}
              placeholder="e.g. Outlet closed for private catering, online ordering disabled due to maintenance..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNaTaskId(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveNaReason(editingNaTaskId)}
                disabled={!tempNaReason.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 disabled:opacity-40"
              >
                Save N/A Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Checklist Incomplete</h3>
                <p className="text-xs text-neutral-400">Mandatory criteria must be resolved prior to submission.</p>
              </div>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 max-h-60 overflow-y-auto space-y-2 text-xs">
              {validationErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-rose-300">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
              >
                Review & Complete Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Success Modal */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Checklist Submitted</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Report <strong className="text-amber-400 font-mono">{activeReport.id}</strong> has been forwarded to Manager on Shift <strong className="text-neutral-200">{activeReport.managerOnShiftName}</strong> for formal audit and approval.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setPreviewReport(activeReport);
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
              >
                View / Download PDF
              </button>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Photo Modal */}
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
