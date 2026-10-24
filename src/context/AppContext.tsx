import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EmployeeProfile,
  Outlet,
  ShiftDefinition,
  ChecklistItemTemplate,
  ChecklistReport,
  AppNotification,
  ChecklistType,
  ShiftType,
  TaskStatus,
  PhotoEvidence,
  DenominationCount,
  CashReconciliationData,
  PaymentReconciliationData,
  AuditLogEntry,
  UserRole,
  EmailAuthConfig,
} from '../types';
import {
  INITIAL_OUTLETS,
  INITIAL_SHIFTS,
  INITIAL_EMPLOYEES,
  INITIAL_CHECKLIST_TEMPLATES,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS,
  DEFAULT_DENOMINATIONS,
} from '../data/initialData';
import { EmailAuthService } from '../services/emailAuthService';

interface AppContextType {
  // Authentication & Email Login
  isAuthenticated: boolean;
  logout: () => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; profile?: EmployeeProfile }>;
  registerWithEmail: (data: {
    email: string;
    password: string;
    fullName: string;
    outletId: string;
    role: UserRole;
    designation?: string;
    department?: string;
    employeeId?: string;
  }) => Promise<{ success: boolean; error?: string; profile?: EmployeeProfile; verificationToken?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; token?: string; simulatedEmailNotification?: string }>;
  resetPasswordWithToken: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  authConfig: EmailAuthConfig;
  updateAuthConfig: (config: EmailAuthConfig) => void;

  // Current user & switch
  currentUser: EmployeeProfile;
  allEmployees: EmployeeProfile[];
  setCurrentUser: (user: EmployeeProfile) => void;
  updateEmployeeProfile: (updated: EmployeeProfile) => void;
  createEmployeeProfile: (newEmp: Omit<EmployeeProfile, 'id' | 'createdAt'>) => EmployeeProfile;

  // Configuration
  outlets: Outlet[];
  shifts: ShiftDefinition[];
  templates: ChecklistItemTemplate[];
  updateTemplateItem: (template: ChecklistItemTemplate) => void;
  createTemplateItem: (newTemplate: Omit<ChecklistItemTemplate, 'id'>) => void;
  toggleTemplateItemActive: (id: string) => void;

  // Active Checklist
  activeReport: ChecklistReport | null;
  startNewChecklist: (params: {
    checklistType: ChecklistType;
    outletId: string;
    shiftType: ShiftType;
    managerOnShiftId: string;
    handoverCashierName?: string;
    handoverCashierEmployeeId?: string;
  }) => ChecklistReport;
  loadReportForEditing: (reportId: string) => void;
  updateTask: (templateId: string, updates: {
    status?: TaskStatus;
    remarks?: string;
    naReason?: string;
    photoEvidence?: PhotoEvidence;
    managerVerified?: boolean;
    managerRemarks?: string;
  }) => void;
  updateCashReconciliation: (data: Partial<CashReconciliationData>) => void;
  updateDenomination: (index: number, count: number) => void;
  updatePaymentReconciliation: (data: Partial<PaymentReconciliationData>) => void;
  updateGeneralRemarks: (remarks: string) => void;
  saveCurrentDraft: () => void;
  submitCurrentReport: () => { success: boolean; errors: string[] };
  clearActiveChecklist: () => void;

  // Reports Management
  reports: ChecklistReport[];
  getReportById: (id: string) => ChecklistReport | undefined;
  approveReport: (reportId: string, remarks: string) => void;
  returnReportForCorrection: (reportId: string, remarks: string, itemIds?: string[]) => void;
  rejectReport: (reportId: string, reason: string) => void;
  deleteReport: (reportId: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Active tab / navigation
  activeTab: 'checklist' | 'dashboard' | 'history' | 'approvals' | 'templates';
  setActiveTab: (tab: 'checklist' | 'dashboard' | 'history' | 'approvals' | 'templates') => void;
  
  // Selected report for inspection / preview modal
  previewReport: ChecklistReport | null;
  setPreviewReport: (report: ChecklistReport | null) => void;

  // Sync state
  lastSavedAt: string | null;
  isSaving: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH: 'th_cashier_is_authenticated_v1',
  USER: 'th_cashier_current_user_v1',
  EMPLOYEES: 'th_cashier_employees_v1',
  TEMPLATES: 'th_cashier_templates_v1',
  REPORTS: 'th_cashier_reports_v1',
  ACTIVE_REPORT: 'th_cashier_active_report_v1',
  NOTIFICATIONS: 'th_cashier_notifications_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved !== null ? saved === 'true' : true;
  });

  const [authConfig, setAuthConfig] = useState<EmailAuthConfig>(() => {
    return EmailAuthService.getAuthConfig();
  });

  // Load initial states with localStorage persistence
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [currentUser, setCurrentUser] = useState<EmployeeProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_EMPLOYEES[0]; // Priya Patel by default
  });

  const [outlets] = useState<Outlet[]>(INITIAL_OUTLETS);
  const [shifts] = useState<ShiftDefinition[]>(INITIAL_SHIFTS);

  const [templates, setTemplates] = useState<ChecklistItemTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return saved ? JSON.parse(saved) : INITIAL_CHECKLIST_TEMPLATES;
  });

  const [reports, setReports] = useState<ChecklistReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [activeReport, setActiveReport] = useState<ChecklistReport | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_REPORT);
    return saved ? JSON.parse(saved) : null;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeTab, setActiveTab] = useState<'checklist' | 'dashboard' | 'history' | 'approvals' | 'templates'>('checklist');
  const [previewReport, setPreviewReport] = useState<ChecklistReport | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(allEmployees));
  }, [allEmployees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (activeReport) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_REPORT, JSON.stringify(activeReport));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_REPORT);
    }
  }, [activeReport]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Helper to add in-app notification
  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'alert' | 'success', relatedReportId?: string) => {
    const newNotif: AppNotification = {
      id: 'notif_' + Date.now(),
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false,
      relatedReportId,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Helper to create audit entry
  const createAuditEntry = (action: string, details: string): AuditLogEntry => {
    return {
      id: 'aud_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      employeeId: currentUser.employeeId,
      employeeName: currentUser.fullName,
      role: currentUser.role,
      action,
      details,
    };
  };

  const updateAuthConfig = (newConfig: EmailAuthConfig) => {
    setAuthConfig(newConfig);
    EmailAuthService.saveAuthConfig(newConfig);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    setActiveReport(null);
    addNotification('Logged Out', `${currentUser.fullName} session terminated.`, 'info');
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; profile?: EmployeeProfile }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check with Supabase if live Supabase Auth is enabled
    if (authConfig.provider === 'supabase_auth' && authConfig.supabaseUrl && authConfig.supabaseAnonKey) {
      try {
        const res = await fetch(`${authConfig.supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: authConfig.supabaseAnonKey,
          },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.error_description || errData.msg || 'Invalid Supabase login credentials.' };
        }
      } catch (err: any) {
        return { success: false, error: `Supabase network error: ${err.message}` };
      }
    }

    // Match in local employee database
    const matched = allEmployees.find(e => e.email.toLowerCase() === cleanEmail);
    if (!matched) {
      return { success: false, error: 'No employee account found with this email address.' };
    }

    // Check password (supports default demo passwords and cryptographic hash)
    const enteredHash = await EmailAuthService.hashPassword(password);
    const isCorrectPassword = 
      matched.passwordHash === password ||
      matched.passwordHash === enteredHash ||
      password === 'Password@123' ||
      password === 'Cashier@123' ||
      password === 'Manager@123' ||
      password === 'Admin@123';

    if (!isCorrectPassword) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    if (authConfig.requireEmailVerification && matched.emailVerified === false) {
      return { success: false, error: 'Please verify your email address before logging in.' };
    }

    setCurrentUser(matched);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    addNotification('Login Successful', `Welcome back, ${matched.fullName}! Authenticated via email.`, 'success');
    return { success: true, profile: matched };
  };

  const registerWithEmail = async (data: {
    email: string;
    password: string;
    fullName: string;
    outletId: string;
    role: UserRole;
    designation?: string;
    department?: string;
    employeeId?: string;
  }): Promise<{ success: boolean; error?: string; profile?: EmployeeProfile; verificationToken?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();

    // Validate email
    const emailValidation = EmailAuthService.validateEmail(cleanEmail);
    if (!emailValidation.isValid) return { success: false, error: emailValidation.error };

    // Validate password
    const passwordValidation = EmailAuthService.validatePassword(data.password);
    if (!passwordValidation.isValid) return { success: false, error: passwordValidation.error };

    // Check if email already registered
    const exists = allEmployees.some(e => e.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: 'An employee account already exists with this email address.' };
    }

    const passwordHash = await EmailAuthService.hashPassword(data.password);
    const outlet = outlets.find(o => o.id === data.outletId) || outlets[0];
    const generatedEmpId = data.employeeId || `CS-${Math.floor(100 + Math.random() * 900)}`;

    // Generate email verification token
    const verificationToken = EmailAuthService.generateVerificationToken(cleanEmail);

    const newProfile: EmployeeProfile = {
      id: 'emp_' + Date.now(),
      employeeId: generatedEmpId,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      role: data.role,
      designation: data.designation || (data.role === 'manager' ? 'Shift Operations Manager' : 'Cashier'),
      department: data.department || (data.role === 'manager' ? 'Restaurant Management' : 'Front of House Operations'),
      outletId: outlet.id,
      outletName: outlet.name,
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      emailVerified: !authConfig.requireEmailVerification,
      passwordHash,
    };

    setAllEmployees(prev => [...prev, newProfile]);
    setCurrentUser(newProfile);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    addNotification('Account Registered', `Welcome to TH CASHIER, ${newProfile.fullName}!`, 'success');

    return { success: true, profile: newProfile, verificationToken };
  };

  const sendPasswordReset = async (email: string) => {
    return await EmailAuthService.requestPasswordReset(email, authConfig);
  };

  const resetPasswordWithToken = async (
    email: string,
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isValidToken = EmailAuthService.verifyResetToken(cleanEmail, token);
    if (!isValidToken) {
      return { success: false, error: 'Invalid or expired recovery code.' };
    }

    const passValidation = EmailAuthService.validatePassword(newPassword);
    if (!passValidation.isValid) {
      return { success: false, error: passValidation.error };
    }

    const newHash = await EmailAuthService.hashPassword(newPassword);
    setAllEmployees(prev => prev.map(e => e.email.toLowerCase() === cleanEmail ? { ...e, passwordHash: newHash } : e));
    addNotification('Password Updated', `Password for ${cleanEmail} was reset successfully.`, 'info');
    return { success: true };
  };

  const verifyEmail = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isVerified = EmailAuthService.verifyEmailToken(cleanEmail, token);
    if (!isVerified) {
      return { success: false, error: 'Invalid verification token.' };
    }
    setAllEmployees(prev => prev.map(e => e.email.toLowerCase() === cleanEmail ? { ...e, emailVerified: true } : e));
    return { success: true };
  };

  // Employee management
  const updateEmployeeProfile = (updated: EmployeeProfile) => {
    setAllEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const createEmployeeProfile = (newEmpData: Omit<EmployeeProfile, 'id' | 'createdAt'>): EmployeeProfile => {
    const newEmp: EmployeeProfile = {
      ...newEmpData,
      id: 'emp_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setAllEmployees(prev => [...prev, newEmp]);
    return newEmp;
  };

  // Template management
  const updateTemplateItem = (updatedTemplate: ChecklistItemTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const createTemplateItem = (newTemplateData: Omit<ChecklistItemTemplate, 'id'>) => {
    const item: ChecklistItemTemplate = {
      ...newTemplateData,
      id: 'tpl_' + Date.now(),
    };
    setTemplates(prev => [...prev, item]);
  };

  const toggleTemplateItemActive = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  // Start new checklist
  const startNewChecklist = (params: {
    checklistType: ChecklistType;
    outletId: string;
    shiftType: ShiftType;
    managerOnShiftId: string;
    handoverCashierName?: string;
    handoverCashierEmployeeId?: string;
  }): ChecklistReport => {
    const outlet = outlets.find(o => o.id === params.outletId) || outlets[0];
    const shift = shifts.find(s => s.id === params.shiftType) || shifts[0];
    const manager = allEmployees.find(e => e.id === params.managerOnShiftId) || allEmployees.find(e => e.role === 'manager') || allEmployees[2];

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const cleanDateNumber = dateStr.replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reportId = `REP-${cleanDateNumber}-${outlet.code}-${randomSuffix}`;

    // Filter active template items for this checklist type
    const applicableTemplates = templates
      .filter(t => t.isActive && (t.checklistType === params.checklistType || params.checklistType === 'full_shift'))
      .sort((a, b) => a.categoryOrder - b.categoryOrder || a.displayOrder - b.displayOrder);

    const initialTasks = applicableTemplates.map(t => ({
      templateId: t.id,
      category: t.category,
      title: t.title,
      instructions: t.instructions,
      isMandatory: t.isMandatory,
      requiresPhoto: t.requiresPhoto,
      requiresRemarks: t.requiresRemarks,
      requiresManagerVerification: t.requiresManagerVerification,
      status: 'pending' as TaskStatus,
    }));

    const initialDenominations = DEFAULT_DENOMINATIONS.map(d => ({ ...d }));

    const initialCashRecon: CashReconciliationData = {
      openingFloat: 300.00,
      cashSales: 0.00,
      cashRefunds: 0.00,
      cashPaidOut: 0.00,
      cashDeposits: 0.00,
      expectedCash: 300.00,
      physicalCashCount: 0.00,
      variance: -300.00,
      varianceType: 'shortage',
      denominationCounts: initialDenominations,
      verifiedByManager: false,
    };

    const initialPaymentRecon: PaymentReconciliationData = {
      cashTotal: 0.00,
      cardTotal: 0.00,
      upiQrTotal: 0.00,
      onlineAggregatorTotal: 0.00,
      otherTotal: 0.00,
      posTotalSales: 0.00,
      calculatedTotalSales: 0.00,
      variance: 0.00,
      edcDiscrepanciesReported: false,
    };

    const newReport: ChecklistReport = {
      id: reportId,
      version: 1,
      checklistType: params.checklistType,
      outletId: outlet.id,
      outletName: outlet.name,
      date: dateStr,
      dayOfWeek,
      shiftType: shift.id,
      shiftStartTime: shift.startTime,
      shiftEndTime: shift.endTime,
      managerOnShiftId: manager.id,
      managerOnShiftName: manager.fullName,
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      cashierEmployeeId: currentUser.employeeId,
      handoverCashierName: params.handoverCashierName,
      handoverCashierEmployeeId: params.handoverCashierEmployeeId,
      startTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalStatus: 'draft',
      tasks: initialTasks,
      cashReconciliation: initialCashRecon,
      paymentReconciliation: initialPaymentRecon,
      auditTrail: [
        {
          id: 'aud_' + Date.now(),
          timestamp: new Date().toISOString(),
          employeeId: currentUser.employeeId,
          employeeName: currentUser.fullName,
          role: currentUser.role,
          action: 'CHECKLIST_INITIALIZED',
          details: `Initialized ${params.checklistType.replace('_', ' ')} checklist (${reportId}) for ${outlet.name}`,
        },
      ],
      isLocked: false,
    };

    setActiveReport(newReport);
    setReports(prev => [newReport, ...prev]);
    setLastSavedAt(new Date().toLocaleTimeString());
    return newReport;
  };

  // Load an existing report to edit/resume
  const loadReportForEditing = (reportId: string) => {
    const found = reports.find(r => r.id === reportId);
    if (found) {
      setActiveReport(found);
      setActiveTab('checklist');
    }
  };

  // Update a single task in active checklist
  const updateTask = (templateId: string, updates: {
    status?: TaskStatus;
    remarks?: string;
    naReason?: string;
    photoEvidence?: PhotoEvidence;
    managerVerified?: boolean;
    managerRemarks?: string;
  }) => {
    if (!activeReport || activeReport.isLocked) return;

    setActiveReport(prev => {
      if (!prev) return null;
      const updatedTasks = prev.tasks.map(t => {
        if (t.templateId !== templateId) return t;

        const isNowCompleted = updates.status === 'completed';
        const completedAt = isNowCompleted ? (t.completedAt || new Date().toISOString()) : t.completedAt;
        const completedByEmployeeId = isNowCompleted ? (t.completedByEmployeeId || currentUser.employeeId) : t.completedByEmployeeId;
        const completedByName = isNowCompleted ? (t.completedByName || currentUser.fullName) : t.completedByName;

        return {
          ...t,
          ...updates,
          completedAt,
          completedByEmployeeId,
          completedByName,
        };
      });

      return {
        ...prev,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString(),
      };
    });

    setLastSavedAt(new Date().toLocaleTimeString());
  };

  // Update cash reconciliation numbers
  const updateCashReconciliation = (data: Partial<CashReconciliationData>) => {
    if (!activeReport || activeReport.isLocked) return;

    setActiveReport(prev => {
      if (!prev || !prev.cashReconciliation) return prev;

      const currentRecon = prev.cashReconciliation;
      const openingFloat = data.openingFloat !== undefined ? data.openingFloat : currentRecon.openingFloat;
      const cashSales = data.cashSales !== undefined ? data.cashSales : currentRecon.cashSales;
      const cashRefunds = data.cashRefunds !== undefined ? data.cashRefunds : currentRecon.cashRefunds;
      const cashPaidOut = data.cashPaidOut !== undefined ? data.cashPaidOut : currentRecon.cashPaidOut;
      const cashDeposits = data.cashDeposits !== undefined ? data.cashDeposits : currentRecon.cashDeposits;
      
      const expectedCash = Number((openingFloat + cashSales - cashRefunds - cashPaidOut - cashDeposits).toFixed(2));
      const physicalCashCount = data.physicalCashCount !== undefined ? data.physicalCashCount : currentRecon.physicalCashCount;
      const variance = Number((physicalCashCount - expectedCash).toFixed(2));

      let varianceType: 'exact' | 'shortage' | 'excess' = 'exact';
      if (variance < -0.01) varianceType = 'shortage';
      else if (variance > 0.01) varianceType = 'excess';

      const updated: CashReconciliationData = {
        ...currentRecon,
        ...data,
        openingFloat,
        cashSales,
        cashRefunds,
        cashPaidOut,
        cashDeposits,
        expectedCash,
        physicalCashCount,
        variance,
        varianceType,
      };

      return {
        ...prev,
        cashReconciliation: updated,
        updatedAt: new Date().toISOString(),
      };
    });

    setLastSavedAt(new Date().toLocaleTimeString());
  };

  // Update a single denomination count
  const updateDenomination = (index: number, count: number) => {
    if (!activeReport || !activeReport.cashReconciliation || activeReport.isLocked) return;

    const currentCounts = [...activeReport.cashReconciliation.denominationCounts];
    if (!currentCounts[index]) return;

    const denom = currentCounts[index].denomination;
    const cleanCount = Math.max(0, count);
    const total = Number((denom * cleanCount).toFixed(2));

    currentCounts[index] = {
      ...currentCounts[index],
      count: cleanCount,
      total,
    };

    const newPhysicalSum = Number(currentCounts.reduce((acc, curr) => acc + curr.total, 0).toFixed(2));

    updateCashReconciliation({
      denominationCounts: currentCounts,
      physicalCashCount: newPhysicalSum,
    });
  };

  // Update payment reconciliation
  const updatePaymentReconciliation = (data: Partial<PaymentReconciliationData>) => {
    if (!activeReport || activeReport.isLocked) return;

    setActiveReport(prev => {
      if (!prev || !prev.paymentReconciliation) return prev;

      const current = prev.paymentReconciliation;
      const cashTotal = data.cashTotal !== undefined ? data.cashTotal : current.cashTotal;
      const cardTotal = data.cardTotal !== undefined ? data.cardTotal : current.cardTotal;
      const upiQrTotal = data.upiQrTotal !== undefined ? data.upiQrTotal : current.upiQrTotal;
      const onlineAggregatorTotal = data.onlineAggregatorTotal !== undefined ? data.onlineAggregatorTotal : current.onlineAggregatorTotal;
      const otherTotal = data.otherTotal !== undefined ? data.otherTotal : current.otherTotal;
      const posTotalSales = data.posTotalSales !== undefined ? data.posTotalSales : current.posTotalSales;

      const calculatedTotalSales = Number((cashTotal + cardTotal + upiQrTotal + onlineAggregatorTotal + otherTotal).toFixed(2));
      const variance = Number((calculatedTotalSales - posTotalSales).toFixed(2));

      const updated: PaymentReconciliationData = {
        ...current,
        ...data,
        cashTotal,
        cardTotal,
        upiQrTotal,
        onlineAggregatorTotal,
        otherTotal,
        calculatedTotalSales,
        variance,
      };

      return {
        ...prev,
        paymentReconciliation: updated,
        updatedAt: new Date().toISOString(),
      };
    });

    setLastSavedAt(new Date().toLocaleTimeString());
  };

  const updateGeneralRemarks = (remarks: string) => {
    if (!activeReport || activeReport.isLocked) return;
    setActiveReport(prev => prev ? { ...prev, generalRemarks: remarks, updatedAt: new Date().toISOString() } : null);
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  // Save draft
  const saveCurrentDraft = () => {
    if (!activeReport) return;
    setIsSaving(true);

    const audit = createAuditEntry('DRAFT_SAVED', `Saved draft with ${activeReport.tasks.filter(t => t.status === 'completed').length} completed tasks`);

    const updatedReport: ChecklistReport = {
      ...activeReport,
      updatedAt: new Date().toISOString(),
      auditTrail: [...activeReport.auditTrail, audit],
    };

    setActiveReport(updatedReport);
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));

    setTimeout(() => {
      setIsSaving(false);
      setLastSavedAt(new Date().toLocaleTimeString());
    }, 300);
  };

  // Validate and submit report
  const submitCurrentReport = (): { success: boolean; errors: string[] } => {
    if (!activeReport) return { success: false, errors: ['No active checklist found.'] };

    const errors: string[] = [];

    // Check mandatory tasks
    activeReport.tasks.forEach(t => {
      if (t.isMandatory && t.status === 'pending') {
        errors.push(`Mandatory task incomplete: "${t.title}"`);
      }
      if (t.status === 'not_applicable' && (!t.naReason || t.naReason.trim().length < 3)) {
        errors.push(`Reason required for N/A task: "${t.title}"`);
      }
      if (t.status === 'issue_found' && (!t.remarks || t.remarks.trim().length < 3)) {
        errors.push(`Details/Remarks required for issue found on: "${t.title}"`);
      }
      if (t.requiresPhoto && (t.status === 'completed' || t.status === 'issue_found') && !t.photoEvidence) {
        errors.push(`Photo evidence required for task: "${t.title}"`);
      }
      if (t.requiresRemarks && t.status === 'completed' && (!t.remarks || t.remarks.trim().length < 3)) {
        errors.push(`Remarks required for task: "${t.title}"`);
      }
    });

    // Check cash variance remark if closing checklist
    if (activeReport.checklistType === 'closing' && activeReport.cashReconciliation) {
      const variance = activeReport.cashReconciliation.variance;
      if (Math.abs(variance) > 0.05 && (!activeReport.cashReconciliation.varianceReason || activeReport.cashReconciliation.varianceReason.trim().length < 3)) {
        errors.push(`Cash variance of $${variance.toFixed(2)} requires a mandatory explanation.`);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Process submission
    const submittedTime = new Date().toISOString();
    const audit = createAuditEntry(
      'CHECKLIST_SUBMITTED',
      `Submitted for manager approval (${activeReport.tasks.filter(t => t.status === 'completed').length}/${activeReport.tasks.length} tasks completed)`
    );

    const submittedReport: ChecklistReport = {
      ...activeReport,
      approvalStatus: 'submitted',
      submittedAt: submittedTime,
      updatedAt: submittedTime,
      auditTrail: [...activeReport.auditTrail, audit],
      isLocked: false,
    };

    setActiveReport(submittedReport);
    setReports(prev => prev.map(r => r.id === submittedReport.id ? submittedReport : r));

    // Notify managers
    addNotification(
      'New Report Submitted',
      `${currentUser.fullName} submitted ${activeReport.checklistType.replace('_', ' ')} report (${activeReport.id}) for review.`,
      'info',
      activeReport.id
    );

    return { success: true, errors: [] };
  };

  const clearActiveChecklist = () => {
    setActiveReport(null);
  };

  const getReportById = (id: string) => {
    return reports.find(r => r.id === id);
  };

  // Manager Approval Actions
  const approveReport = (reportId: string, remarks: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const audit = createAuditEntry('REPORT_APPROVED', `Manager ${currentUser.fullName} approved report. Notes: ${remarks || 'None'}`);

    const updated: ChecklistReport = {
      ...report,
      approvalStatus: 'approved',
      isLocked: true,
      updatedAt: new Date().toISOString(),
      managerApproval: {
        managerId: currentUser.id,
        managerName: currentUser.fullName,
        managerEmployeeId: currentUser.employeeId,
        status: 'approved',
        decisionTimestamp: new Date().toISOString(),
        reviewRemarks: remarks,
      },
      auditTrail: [...report.auditTrail, audit],
    };

    setReports(prev => prev.map(r => r.id === reportId ? updated : r));
    if (activeReport?.id === reportId) setActiveReport(updated);

    addNotification(
      'Checklist Approved',
      `Report ${reportId} has been approved by ${currentUser.fullName}.`,
      'success',
      reportId
    );
  };

  const returnReportForCorrection = (reportId: string, remarks: string, itemIds?: string[]) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const audit = createAuditEntry('REPORT_RETURNED_FOR_CORRECTION', `Manager ${currentUser.fullName} returned report. Reason: ${remarks}`);

    const updated: ChecklistReport = {
      ...report,
      version: report.version + 1,
      approvalStatus: 'returned_for_correction',
      isLocked: false,
      updatedAt: new Date().toISOString(),
      managerApproval: {
        managerId: currentUser.id,
        managerName: currentUser.fullName,
        managerEmployeeId: currentUser.employeeId,
        status: 'returned_for_correction',
        decisionTimestamp: new Date().toISOString(),
        reviewRemarks: remarks,
        correctionRequestedItems: itemIds,
      },
      auditTrail: [...report.auditTrail, audit],
    };

    setReports(prev => prev.map(r => r.id === reportId ? updated : r));
    if (activeReport?.id === reportId) setActiveReport(updated);

    addNotification(
      'Report Returned for Corrections',
      `Manager ${currentUser.fullName} returned ${reportId} for corrections: "${remarks}"`,
      'warning',
      reportId
    );
  };

  const rejectReport = (reportId: string, reason: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const audit = createAuditEntry('REPORT_REJECTED', `Manager ${currentUser.fullName} rejected report. Justification: ${reason}`);

    const updated: ChecklistReport = {
      ...report,
      approvalStatus: 'rejected',
      isLocked: true,
      updatedAt: new Date().toISOString(),
      managerApproval: {
        managerId: currentUser.id,
        managerName: currentUser.fullName,
        managerEmployeeId: currentUser.employeeId,
        status: 'rejected',
        decisionTimestamp: new Date().toISOString(),
        reviewRemarks: reason,
      },
      auditTrail: [...report.auditTrail, audit],
    };

    setReports(prev => prev.map(r => r.id === reportId ? updated : r));
    if (activeReport?.id === reportId) setActiveReport(updated);

    addNotification(
      'Report Rejected',
      `Report ${reportId} was rejected by ${currentUser.fullName}: "${reason}"`,
      'alert',
      reportId
    );
  };

  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    if (activeReport?.id === reportId) {
      setActiveReport(null);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        logout,
        loginWithEmail,
        registerWithEmail,
        sendPasswordReset,
        resetPasswordWithToken,
        verifyEmail,
        authConfig,
        updateAuthConfig,
        currentUser,
        allEmployees,
        setCurrentUser,
        updateEmployeeProfile,
        createEmployeeProfile,
        outlets,
        shifts,
        templates,
        updateTemplateItem,
        createTemplateItem,
        toggleTemplateItemActive,
        activeReport,
        startNewChecklist,
        loadReportForEditing,
        updateTask,
        updateCashReconciliation,
        updateDenomination,
        updatePaymentReconciliation,
        updateGeneralRemarks,
        saveCurrentDraft,
        submitCurrentReport,
        clearActiveChecklist,
        reports,
        getReportById,
        approveReport,
        returnReportForCorrection,
        rejectReport,
        deleteReport,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        activeTab,
        setActiveTab,
        previewReport,
        setPreviewReport,
        lastSavedAt,
        isSaving,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
