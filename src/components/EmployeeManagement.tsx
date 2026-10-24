import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Building2, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  ArrowRightLeft, 
  UserMinus, 
  AlertTriangle,
  Briefcase,
  X,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmployeeProfile, UserRole, EmploymentStatus, AccountStatus } from '../types';

export const EmployeeManagement: React.FC = () => {
  const {
    allEmployees,
    outlets,
    assignments,
    createEmployeeProfile,
    updateEmployeeProfile,
    toggleEmployeeStatus,
    deleteEmployee,
    assignEmployeeToOutlet,
    removeEmployeeFromOutlet,
    transferEmployee,
    currentUser,
    reports,
  } = useApp();

  const isAdmin = currentUser.role === 'admin';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [outletFilter, setOutletFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [managingAssignmentsEmployee, setManagingAssignmentsEmployee] = useState<EmployeeProfile | null>(null);
  const [deleteConfirmationEmployee, setDeleteConfirmationEmployee] = useState<{ emp: EmployeeProfile; reportCount: number } | null>(null);

  // Add/Edit Form State
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cashier');
  const [formDesignation, setFormDesignation] = useState('Cashier & POS Host');
  const [formDepartment, setFormDepartment] = useState('Front of House Operations');
  const [formEmploymentStatus, setFormEmploymentStatus] = useState<EmploymentStatus>('full_time');
  const [formAccountStatus, setFormAccountStatus] = useState<AccountStatus>('active');
  const [formAssignedOutletIds, setFormAssignedOutletIds] = useState<string[]>([]);
  const [formPrimaryOutletId, setFormPrimaryOutletId] = useState<string>('');
  const [formManagerPin, setFormManagerPin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Transfer State inside assignment manager
  const [quickTransferFrom, setQuickTransferFrom] = useState('');
  const [quickTransferTo, setQuickTransferTo] = useState('');
  const [quickTransferNotes, setQuickTransferNotes] = useState('');

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      const matchesSearch = 
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || emp.role === roleFilter;

      const matchesOutlet = 
        outletFilter === 'all' || 
        emp.outletId === outletFilter || 
        (emp.assignedOutletIds || []).includes(outletFilter);

      const matchesStatus = statusFilter === 'all' || emp.accountStatus === statusFilter;

      return matchesSearch && matchesRole && matchesOutlet && matchesStatus;
    });
  }, [allEmployees, searchQuery, roleFilter, outletFilter, statusFilter]);

  // Statistics
  const activeEmployees = allEmployees.filter(e => e.accountStatus === 'active').length;
  const cashiersCount = allEmployees.filter(e => e.role === 'cashier').length;
  const managersCount = allEmployees.filter(e => e.role === 'manager').length;
  const adminsCount = allEmployees.filter(e => e.role === 'admin').length;

  const openAddModal = () => {
    const nextIdNumber = Math.floor(100 + Math.random() * 900);
    setFormEmployeeId(`CS-${nextIdNumber}`);
    setFormFullName('');
    setFormEmail('');
    setFormPhone('+91 ');
    setFormRole('cashier');
    setFormDesignation('Cashier & POS Host');
    setFormDepartment('Front of House Operations');
    setFormEmploymentStatus('full_time');
    setFormAccountStatus('active');
    setFormAssignedOutletIds(outlets[0] ? [outlets[0].id] : []);
    setFormPrimaryOutletId(outlets[0]?.id || '');
    setFormManagerPin('');
    setFormError(null);
    setIsAddEmployeeOpen(true);
  };

  const openEditModal = (emp: EmployeeProfile) => {
    setEditingEmployee(emp);
    setFormEmployeeId(emp.employeeId);
    setFormFullName(emp.fullName);
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormRole(emp.role);
    setFormDesignation(emp.designation);
    setFormDepartment(emp.department);
    setFormEmploymentStatus(emp.employmentStatus || 'full_time');
    setFormAccountStatus(emp.accountStatus);
    setFormAssignedOutletIds(emp.assignedOutletIds?.length ? emp.assignedOutletIds : [emp.outletId]);
    setFormPrimaryOutletId(emp.outletId);
    setFormManagerPin('');
    setFormError(null);
  };

  const toggleOutletCheckbox = (outletId: string) => {
    setFormAssignedOutletIds(prev => {
      if (prev.includes(outletId)) {
        // Don't allow unchecking if it's the only outlet
        if (prev.length <= 1) return prev;
        const filtered = prev.filter(id => id !== outletId);
        if (formPrimaryOutletId === outletId) {
          setFormPrimaryOutletId(filtered[0] || '');
        }
        return filtered;
      } else {
        return [...prev, outletId];
      }
    });
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formFullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formEmployeeId.trim()) {
      setFormError('Employee ID is required (e.g. CS-104).');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('A valid email address is required.');
      return;
    }
    if (formAssignedOutletIds.length === 0) {
      setFormError('Please select at least one assigned outlet for this employee.');
      return;
    }

    // Role elevation protection: changing or registering as manager/admin requires PIN 8899
    if ((formRole === 'manager' || formRole === 'admin') && !editingEmployee) {
      if (formManagerPin !== '8899') {
        setFormError('Elevated privileges security: PIN 8899 is required to register Manager or Administrator accounts.');
        return;
      }
    }

    const primaryOutlet = outlets.find(o => o.id === formPrimaryOutletId) || outlets.find(o => formAssignedOutletIds.includes(o.id)) || outlets[0];

    if (editingEmployee) {
      updateEmployeeProfile({
        ...editingEmployee,
        employeeId: formEmployeeId.trim().toUpperCase(),
        fullName: formFullName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        role: formRole,
        designation: formDesignation.trim(),
        department: formDepartment.trim(),
        employmentStatus: formEmploymentStatus,
        accountStatus: formAccountStatus,
        outletId: primaryOutlet.id,
        outletName: primaryOutlet.name,
        assignedOutletIds: formAssignedOutletIds,
      });

      // Synchronize assignments junction
      formAssignedOutletIds.forEach(oId => {
        const targetOutlet = outlets.find(o => o.id === oId);
        if (!targetOutlet) return;
        const exists = assignments.some(a => a.outletId === oId && a.employeeRefId === editingEmployee.id && a.status === 'active');
        if (!exists) {
          assignEmployeeToOutlet({
            outletId: oId,
            employeeRefId: editingEmployee.id,
            isPrimary: oId === primaryOutlet.id,
          });
        }
      });

      setEditingEmployee(null);
    } else {
      createEmployeeProfile({
        employeeId: formEmployeeId.trim().toUpperCase(),
        fullName: formFullName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        role: formRole,
        designation: formDesignation.trim(),
        department: formDepartment.trim(),
        employmentStatus: formEmploymentStatus,
        accountStatus: formAccountStatus,
        outletId: primaryOutlet.id,
        outletName: primaryOutlet.name,
        assignedOutletIds: formAssignedOutletIds,
        emailVerified: true,
        passwordHash: formRole === 'admin' ? 'Admin@123' : formRole === 'manager' ? 'Manager@123' : 'Cashier@123',
      });
      setIsAddEmployeeOpen(false);
    }
  };

  const handleDeleteRequest = (emp: EmployeeProfile) => {
    const reportCount = reports.filter(r => r.cashierId === emp.id || r.cashierEmployeeId === emp.employeeId).length;
    if (reportCount > 0) {
      setDeleteConfirmationEmployee({ emp, reportCount });
    } else {
      deleteEmployee(emp.id);
    }
  };

  const handleOpenAssignmentManager = (emp: EmployeeProfile) => {
    setManagingAssignmentsEmployee(emp);
    const empAssignments = assignments.filter(a => a.employeeRefId === emp.id && a.status === 'active');
    setQuickTransferFrom(empAssignments[0]?.outletId || emp.outletId);
    const otherOutlets = outlets.filter(o => o.id !== (empAssignments[0]?.outletId || emp.outletId));
    setQuickTransferTo(otherOutlets[0]?.id || '');
    setQuickTransferNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>EMPLOYEE & ROLE MANAGEMENT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-neutral-400 font-normal">Cross-Outlet Staff Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Employees & Access Control
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage cashier and manager profiles, credentials, role permissions, and branch assignments.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-400/10 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Total Staff</span>
            <Users className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{allEmployees.length}</div>
          <div className="text-[10px] text-emerald-400 mt-1">{activeEmployees} active accounts</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Cashiers</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{cashiersCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Checklist operators</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Shift Managers</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{managersCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Approval verifiers</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Administrators</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{adminsCount}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Full network controllers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, email..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Roles</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Shift Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Outlet Filter */}
          <div>
            <select
              value={outletFilter}
              onChange={e => setOutletFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Outlets</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Inactive / Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Directory List */}
      <div className="space-y-3">
        {filteredEmployees.map(emp => {
          const empAssignments = assignments.filter(a => a.employeeRefId === emp.id && a.status === 'active');
          const isCurrentSessionUser = currentUser.id === emp.id;

          return (
            <div
              key={emp.id}
              className={`bg-neutral-900 border rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:border-neutral-700 ${
                emp.accountStatus === 'active' ? 'border-neutral-800' : 'border-neutral-800/60 opacity-75'
              }`}
            >
              {/* Employee Info */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-neutral-950 font-bold text-base flex items-center justify-center shrink-0 shadow">
                  {emp.fullName.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight truncate">{emp.fullName}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-300 border border-neutral-800">
                      {emp.employeeId}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        emp.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : emp.role === 'manager'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {emp.role}
                    </span>
                    {isCurrentSessionUser && (
                      <span className="text-[10px] font-medium text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        You
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{emp.designation}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-neutral-500" />
                      <span>{emp.email}</span>
                    </span>
                    {emp.phone && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{emp.phone}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Assigned Outlets Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-[11px] text-neutral-500 flex items-center gap-1 mr-1">
                      <Building2 className="w-3 h-3" />
                      Assigned Outlets:
                    </span>
                    {(emp.assignedOutletIds || [emp.outletId]).map(oId => {
                      const outlet = outlets.find(o => o.id === oId);
                      const isPrimary = oId === emp.outletId;
                      return (
                        <span
                          key={oId}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1 ${
                            isPrimary
                              ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                              : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPrimary ? 'bg-amber-400' : 'bg-neutral-500'}`} />
                          <span>{outlet ? `${outlet.name} (${outlet.code})` : oId}</span>
                          {isPrimary && <span className="text-amber-400 text-[9px] font-semibold">[Base]</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                    emp.accountStatus === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {emp.accountStatus}
                </span>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleOpenAssignmentManager(emp)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Manage Outlets & Transfer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assignments</span>
                    </button>

                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Employee Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleEmployeeStatus(emp.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        emp.accountStatus === 'active'
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-neutral-500 hover:bg-neutral-800'
                      }`}
                      title={emp.accountStatus === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
                    >
                      {emp.accountStatus === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>

                    {!isCurrentSessionUser && (
                      <button
                        onClick={() => handleDeleteRequest(emp)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-3">
            <Users className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-semibold text-neutral-300">No matching employees found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Try adjusting your search criteria or register a new team member.
            </p>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {/* ========================================================== */}
      {(isAddEmployeeOpen || editingEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingEmployee ? `Edit Employee: ${editingEmployee.fullName}` : 'Add New Restaurant Employee'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Configure profile, permissions, and multi-outlet authorizations
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddEmployeeOpen(false);
                  setEditingEmployee(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 font-medium mb-1">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    placeholder="e.g., Jane Cooper"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Employee ID <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEmployeeId}
                    onChange={e => setFormEmployeeId(e.target.value.toUpperCase())}
                    placeholder="e.g., CS-105"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono uppercase placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Email Address <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="jane.cooper@thcashier.internal"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Role & Permissions</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="cashier">Cashier (Checklists)</option>
                    <option value="manager">Shift Manager (Review/Approve)</option>
                    <option value="admin">Administrator (Full Control)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                    placeholder="e.g., Senior Cashier"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Employment Status</label>
                  <select
                    value={formEmploymentStatus}
                    onChange={e => setFormEmploymentStatus(e.target.value as EmploymentStatus)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="probation">Probation</option>
                  </select>
                </div>
              </div>

              {/* Elevated Role PIN check if creating manager/admin */}
              {!editingEmployee && (formRole === 'manager' || formRole === 'admin') && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 space-y-1.5">
                  <label className="block text-amber-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Security PIN Required for Manager/Admin Elevation
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={formManagerPin}
                    onChange={e => setFormManagerPin(e.target.value)}
                    placeholder="Enter security PIN (8899)"
                    className="w-full bg-neutral-950 border border-amber-500/40 rounded-xl px-3 py-2 text-neutral-100 font-mono text-center tracking-widest text-sm focus:outline-none"
                  />
                  <p className="text-[10px] text-amber-400/80">Default security elevation PIN is 8899.</p>
                </div>
              )}

              {/* Multi-Outlet Assignment Section */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Authorized Outlet Assignments (Multiple Allowed)
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    {formAssignedOutletIds.length} of {outlets.length} selected
                  </span>
                </div>

                <div className="space-y-2">
                  {outlets.map(o => {
                    const isChecked = formAssignedOutletIds.includes(o.id);
                    const isPrimary = formPrimaryOutletId === o.id;

                    return (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                          isChecked ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-950 border-neutral-800/60 opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOutletCheckbox(o.id)}
                            className="rounded border-neutral-700 text-amber-400 focus:ring-amber-400 h-4 w-4 bg-neutral-950"
                          />
                          <div>
                            <span className="text-neutral-200 font-medium">{o.name}</span>
                            <span className="text-[10px] font-mono text-neutral-500 ml-1.5">[{o.code}]</span>
                          </div>
                        </label>

                        {isChecked && (
                          <button
                            type="button"
                            onClick={() => setFormPrimaryOutletId(o.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              isPrimary
                                ? 'bg-amber-400 text-neutral-950 font-bold shadow'
                                : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-800'
                            }`}
                          >
                            {isPrimary ? 'Base Outlet' : 'Set as Base'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEmployeeOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl shadow"
                >
                  {editingEmployee ? 'Save Changes' : 'Create Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: MANAGE ASSIGNMENTS & QUICK TRANSFER */}
      {/* ========================================================== */}
      {managingAssignmentsEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Outlet Assignments: {managingAssignmentsEmployee.fullName}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    ID: {managingAssignmentsEmployee.employeeId} · Base Outlet: {managingAssignmentsEmployee.outletName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingAssignmentsEmployee(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Current Active Assignments */}
              <div>
                <h4 className="font-semibold text-neutral-300 mb-2">Active Outlet Roster Records</h4>
                <div className="space-y-2">
                  {assignments
                    .filter(a => a.employeeRefId === managingAssignmentsEmployee.id && a.status === 'active')
                    .map(asn => (
                      <div
                        key={asn.id}
                        className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{asn.outletName}</span>
                            {asn.isPrimary && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            Assigned on {new Date(asn.assignedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <button
                          onClick={() => removeEmployeeFromOutlet(asn.id)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Transfer Form */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer to Another Outlet
                </h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-500 text-[10px] mb-1">From Outlet</label>
                    <select
                      value={quickTransferFrom}
                      onChange={e => setQuickTransferFrom(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-neutral-200"
                    >
                      {outlets.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-500 text-[10px] mb-1">To Outlet</label>
                    <select
                      value={quickTransferTo}
                      onChange={e => setQuickTransferTo(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-neutral-200"
                    >
                      {outlets.filter(o => o.id !== quickTransferFrom).map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-500 text-[10px] mb-1">Transfer Notes</label>
                  <input
                    type="text"
                    value={quickTransferNotes}
                    onChange={e => setQuickTransferNotes(e.target.value)}
                    placeholder="e.g., Staff redeployment..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 placeholder-neutral-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    transferEmployee(
                      managingAssignmentsEmployee.id,
                      quickTransferFrom,
                      quickTransferTo,
                      quickTransferNotes
                    );
                    setManagingAssignmentsEmployee(null);
                  }}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Confirm Staff Transfer
                </button>
              </div>
            </div>

            <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setManagingAssignmentsEmployee(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: DELETE EMPLOYEE SAFEGUARD MODAL */}
      {/* ========================================================== */}
      {deleteConfirmationEmployee && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Employee Deletion Guardrail</h3>
            </div>

            <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <p>
                Cannot delete <strong className="text-white">{deleteConfirmationEmployee.emp.fullName} ({deleteConfirmationEmployee.emp.employeeId})</strong> because <strong>{deleteConfirmationEmployee.reportCount}</strong> historical checklist reports are signed under their ID.
              </p>
              <p className="text-amber-400">
                Recommended Action: Keep the employee account but set their status to <strong>Inactive</strong>. This prevents them from signing in or running new checklists while keeping past shift compliance records 100% auditable.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmationEmployee(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  toggleEmployeeStatus(deleteConfirmationEmployee.emp.id);
                  setDeleteConfirmationEmployee(null);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer shadow"
              >
                Deactivate Employee Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
