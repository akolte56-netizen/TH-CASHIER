import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  LayoutDashboard, 
  History, 
  CheckSquare, 
  Settings, 
  Bell, 
  User, 
  ChevronDown, 
  Building2, 
  LogOut,
  ShieldCheck,
  Camera,
  Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenEmailSettings?: () => void;
  onOpenEmailAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenProfile, 
  onOpenNotifications,
  onOpenEmailSettings,
  onOpenEmailAuth,
}) => {
  const {
    currentUser,
    allEmployees,
    setCurrentUser,
    activeTab,
    setActiveTab,
    notifications,
    activeReport,
    logout,
  } = useApp();

  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRoleSelect = (emp: typeof allEmployees[0]) => {
    setCurrentUser(emp);
    setIsSwitchUserOpen(false);
  };

  return (
    <>
      {/* Top Header strictly adhering to the 3-zone contract */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single brand mark with user logo image */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border border-neutral-700 shadow-md transition-transform group-hover:scale-105">
                <img
                  src="/assets/aistudio/image_0e8220c4.png"
                  alt="th Cashier Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                  <span>th CASHIER</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-normal">
                    OPS
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-normal truncate max-w-[160px]">
                  {currentUser.outletName}
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation links (single line, whitespace-nowrap) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'checklist'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-amber-400" />
              <span>Active Checklist</span>
              {activeReport && activeReport.approvalStatus === 'draft' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Operations Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'approvals'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Manager Reviews</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <History className="w-4 h-4 text-purple-400" />
              <span>Report Archive</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'templates'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Settings className="w-4 h-4 text-neutral-300" />
                <span>Templates</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions & Account Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-neutral-950 font-bold text-[10px] rounded-full flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile / Switch Role dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSwitchUserOpen(!isSwitchUserOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-bold flex items-center justify-center text-xs shadow-inner">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-neutral-200 leading-tight flex items-center gap-1.5">
                    <span>{currentUser.fullName}</span>
                    <span className="text-[10px] uppercase font-mono font-normal px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                      {currentUser.employeeId}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 capitalize">
                    {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'manager' ? 'Shift Manager' : 'Cashier'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
              </button>

              {/* Fast Switch Dropdown */}
              {isSwitchUserOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-3.5 py-2 border-b border-neutral-800">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Switch Active Profile
                    </p>
                    <p className="text-xs text-neutral-300 truncate">
                      {currentUser.fullName} ({currentUser.role})
                    </p>
                  </div>

                  <div className="py-1">
                    {allEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleRoleSelect(emp)}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-800/70 transition-colors ${
                          emp.id === currentUser.id ? 'bg-amber-500/10 text-amber-300 font-semibold' : 'text-neutral-300'
                        }`}
                      >
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate">{emp.fullName}</span>
                            <span className="text-[10px] font-mono text-neutral-500">[{emp.employeeId}]</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 capitalize truncate">
                            {emp.designation}
                          </div>
                        </div>
                        {emp.id === currentUser.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 mt-1 border-t border-neutral-800 px-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsSwitchUserOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Edit My Profile</span>
                    </button>

                    {onOpenEmailSettings && (
                      <button
                        onClick={() => {
                          setIsSwitchUserOpen(false);
                          onOpenEmailSettings();
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Email Auth & Supabase</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsSwitchUserOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Natural thumb-zone reach, <=15% height) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-4 items-center gap-1">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === 'checklist' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <ClipboardCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === 'dashboard' ? 'text-blue-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === 'approvals' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Review</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === 'history' ? 'text-purple-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Archive</span>
          </button>
        </div>
      </div>
    </>
  );
};
