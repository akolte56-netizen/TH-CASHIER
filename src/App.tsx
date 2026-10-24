/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ChecklistRunner } from './components/ChecklistRunner';
import { Dashboard } from './components/Dashboard';
import { ManagerApprovalView } from './components/ManagerApprovalView';
import { ReportHistory } from './components/ReportHistory';
import { AdminTemplateEditor } from './components/AdminTemplateEditor';
import { OutletManagement } from './components/OutletManagement';
import { EmployeeManagement } from './components/EmployeeManagement';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { NotificationsModal } from './components/NotificationsModal';
import { EmailAuthModal } from './components/EmailAuthModal';
import { EmailAuthSettingsModal } from './components/EmailAuthSettingsModal';

const AppContent: React.FC = () => {
  const { activeTab, previewReport, setPreviewReport, isAuthenticated } = useApp();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [isEmailAuthOpen, setIsEmailAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Navigation Top Bar */}
      <Navbar
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenEmailSettings={() => setIsEmailSettingsOpen(true)}
        onOpenEmailAuth={() => setIsEmailAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16 md:pb-8">
        {activeTab === 'checklist' && <ChecklistRunner />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'approvals' && <ManagerApprovalView />}
        {activeTab === 'history' && <ReportHistory />}
        {activeTab === 'templates' && <AdminTemplateEditor />}
        {activeTab === 'outlets' && <OutletManagement />}
        {activeTab === 'employees' && <EmployeeManagement />}
      </main>

      {/* Global Modals */}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}

      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Email / Gmail Login & Registration Modal (Mandatory when unauthenticated or opened directly) */}
      <EmailAuthModal
        isOpen={!isAuthenticated || isEmailAuthOpen}
        onClose={() => setIsEmailAuthOpen(false)}
        isMandatoryLogin={!isAuthenticated}
      />

      {/* Email Auth & Supabase Provider Config Modal */}
      <EmailAuthSettingsModal
        isOpen={isEmailSettingsOpen}
        onClose={() => setIsEmailSettingsOpen(false)}
      />

      {/* Quiet Footer */}
      <footer className="no-print py-6 border-t border-neutral-900 bg-neutral-950 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">th Cashier</span>
            <span>·</span>
            <span>Gmail / Email & Password Authentication Enabled</span>
          </div>
          <div className="font-mono text-[11px] text-neutral-600 flex items-center gap-3">
            <button
              onClick={() => setIsEmailSettingsOpen(true)}
              className="text-neutral-500 hover:text-amber-400 underline"
            >
              Email Auth & Backend Settings
            </button>
            <span>·</span>
            <span>Android APK Compatible</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
