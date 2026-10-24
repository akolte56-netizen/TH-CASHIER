import React, { useState } from 'react';
import { 
  User, 
  X, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Check, 
  UserPlus, 
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmployeeProfile, UserRole } from '../types';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    allEmployees,
    setCurrentUser,
    updateEmployeeProfile,
    createEmployeeProfile,
    outlets,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'switch' | 'register'>('profile');

  // Edit profile form state
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [designation, setDesignation] = useState(currentUser.designation);
  const [outletId, setOutletId] = useState(currentUser.outletId);

  // New employee registration state
  const [newEmpId, setNewEmpId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('cashier');
  const [newDesignation, setNewDesignation] = useState('Cashier');
  const [newDept, setNewDept] = useState('Front of House');
  const [newOutletId, setNewOutletId] = useState(outlets[0].id);

  if (!isOpen) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const outlet = outlets.find(o => o.id === outletId) || outlets[0];
    updateEmployeeProfile({
      ...currentUser,
      fullName,
      email,
      phone,
      designation,
      outletId: outlet.id,
      outletName: outlet.name,
    });
    onClose();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId || !newName) return;
    const outlet = outlets.find(o => o.id === newOutletId) || outlets[0];
    const created = createEmployeeProfile({
      employeeId: newEmpId,
      fullName: newName,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@thcashier.internal`,
      role: newRole,
      designation: newDesignation,
      department: newDept,
      outletId: outlet.id,
      outletName: outlet.name,
      accountStatus: 'active',
      phone: '+1 (555) 000-0000',
    });
    setCurrentUser(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Employee Profile & Access</h3>
              <p className="text-xs text-neutral-400 font-mono">ID: {currentUser.employeeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 border-b border-neutral-800 flex items-center gap-2 bg-neutral-950/40 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 font-medium transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'text-amber-400 border-amber-400'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('switch')}
            className={`pb-2.5 font-medium transition-colors border-b-2 ${
              activeTab === 'switch'
                ? 'text-amber-400 border-amber-400'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            Switch Account ({allEmployees.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-2.5 font-medium transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'text-amber-400 border-amber-400'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            Register Employee
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: Profile Details & Edit */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-neutral-950 font-bold text-xl flex items-center justify-center shrink-0 shadow-lg">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{currentUser.fullName}</h4>
                  <div className="text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-amber-400">ID: {currentUser.employeeId}</span>
                    <span>·</span>
                    <span className="capitalize">{currentUser.role}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Created: {new Date(currentUser.createdAt).toLocaleDateString()} · Status: <span className="text-emerald-400 font-semibold">{currentUser.accountStatus}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Assigned Restaurant Outlet</label>
                <select
                  value={outletId}
                  onChange={e => setOutletId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                >
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-3 border-t border-neutral-800">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold hover:bg-amber-300 transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Fast Switch User for Multi-Role Testing */}
          {activeTab === 'switch' && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 mb-3">
                Instantly switch active profile to test workflow permissions from Cashier, Manager on Shift, or Administrator perspectives:
              </p>
              {allEmployees.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    setCurrentUser(emp);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    emp.id === currentUser.id
                      ? 'bg-amber-500/10 border-amber-400 text-white'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 text-white font-bold flex items-center justify-center text-xs">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                        {emp.fullName}
                        <span className="font-mono text-[10px] text-neutral-400">[{emp.employeeId}]</span>
                      </h5>
                      <p className="text-[11px] text-neutral-400 capitalize">
                        {emp.role} · {emp.designation} ({emp.outletName})
                      </p>
                    </div>
                  </div>

                  {emp.id === currentUser.id && (
                    <span className="text-xs font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10">
                      ACTIVE
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Register New Employee Profile */}
          {activeTab === 'register' && (
            <form onSubmit={handleCreateNew} className="space-y-4 text-xs">
              <p className="text-neutral-400">
                Register a new restaurant employee for cashier or management operations.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-310"
                    value={newEmpId}
                    onChange={e => setNewEmpId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Role *</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400 capitalize"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager on Shift</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={newDesignation}
                    onChange={e => setNewDesignation(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Assign Outlet</label>
                <select
                  value={newOutletId}
                  onChange={e => setNewOutletId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                >
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-3 border-t border-neutral-800">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold hover:bg-amber-300 transition-colors"
                >
                  Create & Log In As This Employee
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
