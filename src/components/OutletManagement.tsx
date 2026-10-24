import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  UserPlus, 
  ArrowRightLeft, 
  UserMinus, 
  ShieldCheck, 
  Database, 
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Outlet, EmployeeProfile, OutletEmployeeAssignment } from '../types';
import { DatabaseSchemaModal } from './DatabaseSchemaModal';

export const OutletManagement: React.FC = () => {
  const {
    outlets,
    addOutlet,
    updateOutlet,
    toggleOutletStatus,
    deleteOutlet,
    allEmployees,
    assignments,
    assignEmployeeToOutlet,
    removeEmployeeFromOutlet,
    transferEmployee,
    currentUser,
    reports,
  } = useApp();

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager' || isAdmin;

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [selectedOutletForRoster, setSelectedOutletForRoster] = useState<Outlet | null>(null);
  const [deleteConfirmationOutlet, setDeleteConfirmationOutlet] = useState<Outlet | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Form states for Add/Edit Outlet
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formManagerName, setFormManagerName] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  // Assign Employee to Outlet state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployeeRefId, setSelectedEmployeeRefId] = useState('');
  const [isPrimaryAssignment, setIsPrimaryAssignment] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  // Transfer Employee state
  const [transferringAssignment, setTransferringAssignment] = useState<OutletEmployeeAssignment | null>(null);
  const [destinationOutletId, setDestinationOutletId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  // Filtered outlets
  const filteredOutlets = useMemo(() => {
    return outlets.filter(o => {
      const matchesSearch = 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.address && o.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.managerName && o.managerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [outlets, searchQuery, statusFilter]);

  // Metric stats
  const activeCount = outlets.filter(o => o.status === 'active').length;
  const totalAssignmentsCount = assignments.filter(a => a.status === 'active').length;

  const openAddModal = () => {
    setFormName('');
    setFormCode('');
    setFormAddress('');
    setFormPhone('');
    setFormEmail('');
    setFormManagerName('');
    setFormStatus('active');
    setFormError(null);
    setIsAddOutletOpen(true);
  };

  const openEditModal = (o: Outlet) => {
    setEditingOutlet(o);
    setFormName(o.name);
    setFormCode(o.code);
    setFormAddress(o.address || '');
    setFormPhone(o.phone || '');
    setFormEmail(o.contactEmail || '');
    setFormManagerName(o.managerName || '');
    setFormStatus(o.status);
    setFormError(null);
  };

  const handleSaveOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Outlet name is required.');
      return;
    }
    if (!formCode.trim()) {
      setFormError('Outlet code is required (e.g., DGB, UGT).');
      return;
    }

    if (editingOutlet) {
      const res = updateOutlet(editingOutlet.id, {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        contactEmail: formEmail.trim(),
        managerName: formManagerName.trim(),
        status: formStatus,
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update outlet.');
        return;
      }
      setEditingOutlet(null);
    } else {
      const res = addOutlet({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        contactEmail: formEmail.trim(),
        managerName: formManagerName.trim(),
        status: formStatus,
        timezone: 'America/New_York',
        currency: 'USD',
        currencySymbol: '$',
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to create outlet.');
        return;
      }
      setIsAddOutletOpen(false);
    }
  };

  const handleDeleteOutlet = (o: Outlet, force = false) => {
    const res = deleteOutlet(o.id, force);
    if (!res.success) {
      setDeleteConfirmationOutlet(o);
    } else {
      setDeleteConfirmationOutlet(null);
      if (selectedOutletForRoster?.id === o.id) {
        setSelectedOutletForRoster(null);
      }
    }
  };

  const handleOpenAssignModal = () => {
    if (!selectedOutletForRoster) return;
    // Get employees not yet assigned to this outlet
    const alreadyAssignedRefIds = new Set(
      assignments.filter(a => a.outletId === selectedOutletForRoster.id && a.status === 'active').map(a => a.employeeRefId)
    );
    const available = allEmployees.filter(e => !alreadyAssignedRefIds.has(e.id));
    setSelectedEmployeeRefId(available[0]?.id || '');
    setIsPrimaryAssignment(false);
    setAssignmentNotes('');
    setAssignError(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutletForRoster || !selectedEmployeeRefId) return;

    const res = assignEmployeeToOutlet({
      outletId: selectedOutletForRoster.id,
      employeeRefId: selectedEmployeeRefId,
      isPrimary: isPrimaryAssignment,
      notes: assignmentNotes.trim() || undefined,
    });

    if (!res.success) {
      setAssignError(res.error || 'Failed to assign employee.');
      return;
    }

    setIsAssignModalOpen(false);
  };

  const handleOpenTransferModal = (asn: OutletEmployeeAssignment) => {
    setTransferringAssignment(asn);
    const otherOutlets = outlets.filter(o => o.id !== asn.outletId);
    setDestinationOutletId(otherOutlets[0]?.id || '');
    setTransferNotes('');
    setTransferError(null);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringAssignment || !destinationOutletId) return;

    const res = transferEmployee(
      transferringAssignment.employeeRefId,
      transferringAssignment.outletId,
      destinationOutletId,
      transferNotes.trim() || undefined
    );

    if (!res.success) {
      setTransferError(res.error || 'Transfer failed.');
      return;
    }

    setTransferringAssignment(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>RESTAURANT OUTLET MANAGEMENT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-neutral-400 font-normal">Multi-Property Network</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Outlets & Staff Rosters
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage restaurant outlets, branch operating status, and employee shift assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSchemaModalOpen(true)}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl text-xs flex items-center gap-2 font-medium transition-colors shadow-sm cursor-pointer"
            title="View Supabase PostgreSQL Schema"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Supabase SQL Schema</span>
          </button>

          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-400/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Outlet</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Total Outlets</span>
            <Building2 className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{outlets.length}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Configured properties</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Active Outlets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{activeCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Accepting cashier checklists</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Active Staff Assignments</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{totalAssignmentsCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Across all properties</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Historical Reports</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">{reports.length}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Stored audit records</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by outlet name, code, location, manager..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-neutral-500 mr-1 hidden sm:inline">Status:</span>
          {(['all', 'active', 'inactive'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-950'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutlets.map(outlet => {
          const outletAssignments = assignments.filter(a => a.outletId === outlet.id && a.status === 'active');
          const outletReportsCount = reports.filter(r => r.outletId === outlet.id).length;
          const isUserOutlet = currentUser.outletId === outlet.id || (currentUser.assignedOutletIds || []).includes(outlet.id);

          return (
            <div
              key={outlet.id}
              className={`bg-neutral-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-neutral-700 ${
                outlet.status === 'active' ? 'border-neutral-800' : 'border-neutral-800/60 opacity-80'
              }`}
            >
              <div>
                {/* Outlet Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 font-bold font-mono">
                      {outlet.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">{outlet.name}</h3>
                        {isUserOutlet && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 text-[10px] font-mono border border-amber-400/20">
                            My Outlet
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 font-mono">ID: {outlet.id}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                      outlet.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${outlet.status === 'active' ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                    {outlet.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-neutral-300 py-3 border-y border-neutral-800/80 my-3">
                  {outlet.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <span className="text-neutral-400 line-clamp-1">{outlet.address}</span>
                    </div>
                  )}
                  {outlet.managerName && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                      <span className="text-neutral-400">Manager: <strong className="text-neutral-200">{outlet.managerName}</strong></span>
                    </div>
                  )}
                  {outlet.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="text-neutral-400 font-mono">{outlet.phone}</span>
                    </div>
                  )}
                  {outlet.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="text-neutral-400 truncate">{outlet.contactEmail}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Employees Summary */}
                <div className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Assigned Staff: <strong className="text-white">{outletAssignments.length}</strong></span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {outletReportsCount} reports
                  </span>
                </div>

                {/* Staff avatars preview */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {outletAssignments.slice(0, 4).map(asn => (
                    <span
                      key={asn.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{asn.employeeName}</span>
                      {asn.isPrimary && <span className="text-amber-400 text-[9px]">(Primary)</span>}
                    </span>
                  ))}
                  {outletAssignments.length > 4 && (
                    <span className="text-[10px] text-neutral-500 px-1.5 py-0.5">
                      +{outletAssignments.length - 4} more
                    </span>
                  )}
                  {outletAssignments.length === 0 && (
                    <span className="text-[11px] text-neutral-500 italic">No employees assigned yet</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedOutletForRoster(outlet)}
                  className="flex-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assigned Staff ({outletAssignments.length})</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(outlet)}
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Outlet Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleOutletStatus(outlet.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        outlet.status === 'active'
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-neutral-500 hover:bg-neutral-800'
                      }`}
                      title={outlet.status === 'active' ? 'Deactivate Outlet' : 'Activate Outlet'}
                    >
                      {outlet.status === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteOutlet(outlet)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Outlet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredOutlets.length === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-3">
          <Building2 className="w-8 h-8 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-300">No matching restaurant outlets found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new restaurant outlet to the system.
          </p>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Outlet</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 1: ADD / EDIT OUTLET */}
      {/* ========================================================== */}
      {(isAddOutletOpen || editingOutlet) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingOutlet ? `Edit Outlet: ${editingOutlet.name}` : 'Add New Restaurant Outlet'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {editingOutlet ? `Outlet Code: ${editingOutlet.code}` : 'Register a new property branch in TH Cashier'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddOutletOpen(false);
                  setEditingOutlet(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 font-medium mb-1">
                    Outlet Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g., Downtown Grand Bistro"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Outlet Code <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g., DGB"
                    maxLength={10}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono uppercase placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Address / Location</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="Street address, unit, floor, city..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Outlet Manager Name</label>
                  <input
                    type="text"
                    value={formManagerName}
                    onChange={e => setFormManagerName(e.target.value)}
                    placeholder="Designated shift manager..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="outlet@thcashier.internal"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Operating Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="active">Active (Checklists enabled)</option>
                    <option value="inactive">Inactive (Temporarily closed)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOutletOpen(false);
                    setEditingOutlet(null);
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl transition-colors shadow cursor-pointer"
                >
                  {editingOutlet ? 'Save Changes' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: ASSIGNED EMPLOYEES ROSTER MODAL / DRAWER */}
      {/* ========================================================== */}
      {selectedOutletForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold font-mono">
                  {selectedOutletForRoster.code}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedOutletForRoster.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-normal">
                      Assigned Employees
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {selectedOutletForRoster.address || 'Authorized roster for shift cashiers and managers'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOutletForRoster(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header with Add Employee button */}
            <div className="px-5 py-3 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Staff members authorized to perform checklists at this property:
              </div>
              {isAdmin && (
                <button
                  onClick={handleOpenAssignModal}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Employee</span>
                </button>
              )}
            </div>

            {/* Roster List */}
            <div className="p-5 overflow-y-auto space-y-3">
              {assignments
                .filter(a => a.outletId === selectedOutletForRoster.id && a.status === 'active')
                .map(asn => {
                  const emp = allEmployees.find(e => e.id === asn.employeeRefId);

                  return (
                    <div
                      key={asn.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors hover:border-neutral-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-neutral-200 shrink-0 text-sm">
                          {asn.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{asn.employeeName}</h4>
                            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
                              {asn.employeeId}
                            </span>
                            {asn.isPrimary && (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                Primary Outlet
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            {asn.designation} · Status: <span className="text-emerald-400 font-medium capitalize">{emp?.accountStatus || 'active'}</span>
                          </div>
                          {asn.notes && (
                            <div className="text-[10px] text-neutral-500 italic mt-0.5">
                              Note: {asn.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleOpenTransferModal(asn)}
                            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Transfer employee to another outlet"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                            <span>Transfer</span>
                          </button>
                          <button
                            onClick={() => removeEmployeeFromOutlet(asn.id)}
                            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove assignment without deleting employee account"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              {assignments.filter(a => a.outletId === selectedOutletForRoster.id && a.status === 'active').length === 0 && (
                <div className="text-center py-8 text-neutral-500 text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-neutral-600" />
                  <p>No employees are currently assigned to {selectedOutletForRoster.name}.</p>
                  {isAdmin && (
                    <button
                      onClick={handleOpenAssignModal}
                      className="text-amber-400 underline hover:text-amber-300"
                    >
                      Assign an employee now
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span>Supports multiple outlet assignments per employee account.</span>
              <button
                onClick={() => setSelectedOutletForRoster(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3: ASSIGN EMPLOYEE TO OUTLET MODAL */}
      {/* ========================================================== */}
      {isAssignModalOpen && selectedOutletForRoster && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Assign Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignEmployee} className="space-y-4 text-xs">
              {assignError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs">
                  {assignError}
                </div>
              )}

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Target Outlet</label>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 font-semibold text-neutral-200">
                  {selectedOutletForRoster.name} ({selectedOutletForRoster.code})
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">
                  Select Existing Employee <span className="text-amber-400">*</span>
                </label>
                <select
                  value={selectedEmployeeRefId}
                  onChange={e => setSelectedEmployeeRefId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                >
                  {allEmployees.map(emp => {
                    const alreadyAtOutlet = assignments.some(
                      a => a.outletId === selectedOutletForRoster.id && a.employeeRefId === emp.id && a.status === 'active'
                    );
                    return (
                      <option key={emp.id} value={emp.id} disabled={alreadyAtOutlet}>
                        {emp.fullName} [{emp.employeeId}] - {emp.designation} {alreadyAtOutlet ? '(Already Assigned)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={isPrimaryAssignment}
                  onChange={e => setIsPrimaryAssignment(e.target.checked)}
                  className="rounded border-neutral-700 text-amber-400 focus:ring-amber-400 h-4 w-4 bg-neutral-900"
                />
                <label htmlFor="primaryCheck" className="text-xs text-neutral-300 cursor-pointer">
                  Mark as Employee's <strong>Primary Base Outlet</strong>
                </label>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Assignment Notes (Optional)</label>
                <input
                  type="text"
                  value={assignmentNotes}
                  onChange={e => setAssignmentNotes(e.target.value)}
                  placeholder="e.g., Weekend relief cashier, POS supervisor..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 4: TRANSFER EMPLOYEE MODAL */}
      {/* ========================================================== */}
      {transferringAssignment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Transfer Employee to Outlet</h3>
              </div>
              <button
                onClick={() => setTransferringAssignment(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              {transferError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs">
                  {transferError}
                </div>
              )}

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
                <div className="text-neutral-400">Employee:</div>
                <div className="text-white font-bold">{transferringAssignment.employeeName} ({transferringAssignment.employeeId})</div>
                <div className="text-[11px] text-neutral-500">
                  Current Branch: <strong className="text-amber-400">{transferringAssignment.outletName}</strong>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">
                  Destination Outlet <span className="text-amber-400">*</span>
                </label>
                <select
                  value={destinationOutletId}
                  onChange={e => setDestinationOutletId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                >
                  {outlets
                    .filter(o => o.id !== transferringAssignment.outletId)
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Transfer Rationale / Notes</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  placeholder="e.g., Staff redeployment, seasonal peak transfer..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferringAssignment(null)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl shadow"
                >
                  Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 5: DELETE OUTLET CONFIRMATION WITH SAFEGUARDS */}
      {/* ========================================================== */}
      {deleteConfirmationOutlet && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Outlet Deletion Guardrail</h3>
            </div>

            <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <p>
                Cannot permanently delete outlet <strong className="text-white">"{deleteConfirmationOutlet.name}"</strong> because checklist reports or operational audits are signed under this property code.
              </p>
              <p className="text-amber-400">
                Recommended Action: Keep the outlet but set its status to <strong>Inactive</strong>. This stops new checklists from being created while preserving complete audit logs for tax, accounting, and manager verification.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmationOutlet(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  toggleOutletStatus(deleteConfirmationOutlet.id);
                  setDeleteConfirmationOutlet(null);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer shadow"
              >
                Deactivate Outlet Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Schema Modal */}
      <DatabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
