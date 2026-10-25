import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  OutletEmployeeAssignment,
} from '../types';
import {
  INITIAL_OUTLETS,
  INITIAL_SHIFTS,
  INITIAL_EMPLOYEES,
  INITIAL_ASSIGNMENTS,
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
  loginWithGoogleEmail: () => Promise<{ success: boolean; error?: string; profile?: EmployeeProfile }>;
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
  toggleEmployeeStatus: (id: string) => void;
  deleteEmployee: (id: string) => { success: boolean; error?: string };

  // Outlets Management
  outlets: Outlet[];
  addOutlet: (outlet: Omit<Outlet, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; outlet?: Outlet; error?: string };
  updateOutlet: (id: string, updates: Partial<Outlet>) => { success: boolean; error?: string };
  toggleOutletStatus: (id: string) => void;
  deleteOutlet: (id: string, force?: boolean) => { success: boolean; error?: string; assignedCount?: number; reportCount?: number };

  // Multi-Outlet & Employee Assignments
  assignments: OutletEmployeeAssignment[];
  assignEmployeeToOutlet: (params: { outletId: string; employeeRefId: string; isPrimary?: boolean; notes?: string }) => { success: boolean; error?: string };
  removeEmployeeFromOutlet: (assignmentId: string) => { success: boolean; error?: string };
  transferEmployee: (employeeRefId: string, fromOutletId: string, toOutletId: string, notes?: string) => { success: boolean; error?: string };
  getEmployeesForOutlet: (outletId: string) => EmployeeProfile[];
  getAssignmentsForOutlet: (outletId: string) => OutletEmployeeAssignment[];
  getOutletsForEmployee: (employeeRefId: string) => Outlet[];
  authorizedOutlets: Outlet[];

  // Shifts & Templates Configuration
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
  activeTab: 'checklist' | 'dashboard' | 'history' | 'approvals' | 'templates' | 'outlets' | 'employees';
  setActiveTab: (tab: 'checklist' | 'dashboard' | 'history' | 'approvals' | 'templates' | 'outlets' | 'employees') => void;
  
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
  OUTLETS: 'th_cashier_outlets_v1',
  ASSIGNMENTS: 'th_cashier_assignments_v1',
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

  const [outlets, setOutlets] = useState<Outlet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OUTLETS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_OUTLETS;
  });

  const [assignments, setAssignments] = useState<OutletEmployeeAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_ASSIGNMENTS;
  });

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

  const [activeTab, setActiveTab] = useState<'checklist' | 'dashboard' | 'history' | 'approvals' | 'templates' | 'outlets' | 'employees'>('checklist');
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
    localStorage.setItem(STORAGE_KEYS.OUTLETS, JSON.stringify(outlets));
  }, [outlets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

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

  const loginWithGoogleEmail = async (): Promise<{ success: boolean; error?: string; profile?: EmployeeProfile }> => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.accounts) {
        resolve({ success: false, error: "Google Sign-In script not loaded. Please refresh the page." });
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        scope: "email profile",
        callback: async (response: any) => {
          if (response.error) {
            resolve({ success: false, error: response.error_description || "Google authentication failed." });
            return;
          }

          try {
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const googleUser = await userInfoRes.json();
            const verifiedEmail = googleUser.email;

            if (!verifiedEmail) {
              resolve({ success: false, error: "Could not retrieve email from Google account." });
              return;
            }

            const matchedEmployee = allEmployees.find(
              (emp) => emp.email.toLowerCase() === verifiedEmail.toLowerCase()
            );

            if (!matchedEmployee) {
              resolve({ 
                success: false, 
                error: `Email ${verifiedEmail} is not registered in the system. Please contact your manager.` 
              });
              return;
            }

            if (matchedEmployee.status !== "ACTIVE") {
              resolve({ 
                success: false, 
                error: "Your account is currently inactive. Please contact the administrator." 
              });
              return;
            }

            setCurrentUser(matchedEmployee);
            setIsAuthenticated(true);
            resolve({ success: true, profile: matchedEmployee });

          } catch (err) {
            resolve({ success: false, error: "Failed to fetch user profile from Google." });
          }
        },
      });

      client.requestAccessToken();
    });
  
    const cleanEmail = email.trim().toLowerCase();
    const matched = allEmployees.find(employee => employee.email.trim().toLowerCase() === cleanEmail);
    if (!matched) return { success: false, error: "No employee account is registered with this Google email." };
    if (matched.accountStatus !== "active") return { success: false, error: "This employee account is inactive or suspended. Contact your administrator." };
    setCurrentUser(matched);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(matched));
    localStorage.setItem(STORAGE_KEYS.AUTH, "true");
    addNotification("Login Successful", `Welcome back, ${matched.fullName}! Authenticated via Google.`, "success");
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
      assignedOutletIds: [outlet.id],
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      emailVerified: !authConfig.requireEmailVerification,
      passwordHash,
    };

    setAllEmployees(prev => [...prev, newProfile]);
    setAssignments(prev => [
      ...prev,
      {
        id: 'asn_' + Date.now(),
        outletId: outlet.id,
        outletName: outlet.name,
        employeeId: generatedEmpId,
        employeeRefId: newProfile.id,
        employeeName: newProfile.fullName,
        designation: newProfile.designation,
        isPrimary: true,
        assignedAt: new Date().toISOString(),
        status: 'active',
      },
    ]);
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
    // Sync employee names and designations across active assignments
    setAssignments(prev => prev.map(asn => {
      if (asn.employeeRefId === updated.id) {
        return {
          ...asn,
          employeeName: updated.fullName,
          employeeId: updated.employeeId,
          designation: updated.designation,
        };
      }
      return asn;
    }));
  };

  const createEmployeeProfile = (newEmpData: Omit<EmployeeProfile, 'id' | 'createdAt'>): EmployeeProfile => {
    const newEmpId = 'emp_' + Date.now();
    const assignedOutletIds = newEmpData.assignedOutletIds && newEmpData.assignedOutletIds.length > 0 
      ? newEmpData.assignedOutletIds 
      : [newEmpData.outletId];

    const newEmp: EmployeeProfile = {
      ...newEmpData,
      id: newEmpId,
      assignedOutletIds,
      createdAt: new Date().toISOString(),
    };
    setAllEmployees(prev => [...prev, newEmp]);

    // Create assignments for all assignedOutletIds
    const newAssignments: OutletEmployeeAssignment[] = assignedOutletIds.map((oId, idx) => {
      const targetOutlet = outlets.find(o => o.id === oId);
      return {
        id: 'asn_' + Date.now() + '_' + idx,
        outletId: oId,
        outletName: targetOutlet ? targetOutlet.name : newEmp.outletName,
        employeeId: newEmp.employeeId,
        employeeRefId: newEmpId,
        employeeName: newEmp.fullName,
        designation: newEmp.designation,
        isPrimary: oId === newEmp.outletId,
        assignedAt: new Date().toISOString(),
        status: 'active',
      };
    });
    setAssignments(prev => [...prev, ...newAssignments]);
    addNotification('Employee Created', `${newEmp.fullName} (${newEmp.employeeId}) registered successfully.`, 'success');
    return newEmp;
  };

  const toggleEmployeeStatus = (id: string) => {
    setAllEmployees(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus = e.accountStatus === 'active' ? 'inactive' : 'active';
        addNotification(
          'Employee Status Updated',
          `${e.fullName} (${e.employeeId}) is now ${nextStatus.toUpperCase()}.`,
          nextStatus === 'active' ? 'success' : 'warning'
        );
        return { ...e, accountStatus: nextStatus };
      }
      return e;
    }));
  };

  const deleteEmployee = (id: string): { success: boolean; error?: string } => {
    const target = allEmployees.find(e => e.id === id);
    if (!target) return { success: false, error: 'Employee not found.' };

    if (currentUser.id === id) {
      return { success: false, error: 'You cannot delete your own active account.' };
    }

    // Protection: check if historical checklist reports exist
    const linkedReports = reports.filter(r => r.cashierId === target.id || r.cashierEmployeeId === target.employeeId);
    if (linkedReports.length > 0) {
      return {
        success: false,
        error: `Cannot permanently delete ${target.fullName}: ${linkedReports.length} historical checklist report(s) are signed under this employee ID. Please deactivate this employee instead to preserve historical records.`,
      };
    }

    setAllEmployees(prev => prev.filter(e => e.id !== id));
    setAssignments(prev => prev.filter(a => a.employeeRefId !== id));
    addNotification('Employee Removed', `${target.fullName} record deleted from system.`, 'info');
    return { success: true };
  };

  // Outlet Management
  const addOutlet = (data: Omit<Outlet, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; outlet?: Outlet; error?: string } => {
    const cleanCode = data.code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Outlet code is required.' };
    }
    if (!data.name.trim()) {
      return { success: false, error: 'Outlet name is required.' };
    }
    const duplicateCode = outlets.some(o => o.code.toUpperCase() === cleanCode);
    if (duplicateCode) {
      return { success: false, error: `Outlet code "${cleanCode}" is already in use by another outlet.` };
    }

    const newOutlet: Outlet = {
      ...data,
      id: 'out_' + Date.now(),
      code: cleanCode,
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOutlets(prev => [...prev, newOutlet]);
    addNotification('Outlet Added', `New outlet "${newOutlet.name}" (${newOutlet.code}) created successfully.`, 'success');
    return { success: true, outlet: newOutlet };
  };

  const updateOutlet = (id: string, updates: Partial<Outlet>): { success: boolean; error?: string } => {
    const existing = outlets.find(o => o.id === id);
    if (!existing) return { success: false, error: 'Outlet not found.' };

    if (updates.code) {
      const cleanCode = updates.code.trim().toUpperCase();
      const duplicateCode = outlets.some(o => o.id !== id && o.code.toUpperCase() === cleanCode);
      if (duplicateCode) {
        return { success: false, error: `Outlet code "${cleanCode}" is already in use by another outlet.` };
      }
      updates.code = cleanCode;
    }

    const updatedOutlet = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setOutlets(prev => prev.map(o => o.id === id ? updatedOutlet : o));

    // If outlet name changed, synchronize assignments and employee records
    if (updates.name && updates.name !== existing.name) {
      setAssignments(prev => prev.map(a => a.outletId === id ? { ...a, outletName: updates.name! } : a));
      setAllEmployees(prev => prev.map(e => e.outletId === id ? { ...e, outletName: updates.name! } : e));
    }

    addNotification('Outlet Updated', `Outlet "${updatedOutlet.name}" details updated.`, 'info');
    return { success: true };
  };

  const toggleOutletStatus = (id: string) => {
    setOutlets(prev => prev.map(o => {
      if (o.id === id) {
        const nextStatus = o.status === 'active' ? 'inactive' : 'active';
        addNotification(
          'Outlet Status Changed',
          `Outlet "${o.name}" is now ${nextStatus.toUpperCase()}.`,
          nextStatus === 'active' ? 'success' : 'warning'
        );
        return { ...o, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return o;
    }));
  };

  const deleteOutlet = (id: string, force = false): { success: boolean; error?: string; assignedCount?: number; reportCount?: number } => {
    const target = outlets.find(o => o.id === id);
    if (!target) return { success: false, error: 'Outlet not found.' };

    const reportCount = reports.filter(r => r.outletId === id).length;
    const assignedCount = assignments.filter(a => a.outletId === id && a.status === 'active').length;

    if (!force && reportCount > 0) {
      return {
        success: false,
        error: `Cannot delete "${target.name}": ${reportCount} checklist report(s) are recorded for this outlet. Please deactivate the outlet instead to preserve historical records.`,
        reportCount,
        assignedCount,
      };
    }

    setOutlets(prev => prev.filter(o => o.id !== id));
    setAssignments(prev => prev.filter(a => a.outletId !== id));
    // Remove outletId from employees' assignedOutletIds
    setAllEmployees(prev => prev.map(e => {
      const remaining = (e.assignedOutletIds || []).filter(oId => oId !== id);
      const isPrimaryLost = e.outletId === id;
      const fallbackOutlet = outlets.find(o => o.id !== id) || { id: '', name: '' };
      return {
        ...e,
        assignedOutletIds: remaining,
        outletId: isPrimaryLost ? fallbackOutlet.id : e.outletId,
        outletName: isPrimaryLost ? fallbackOutlet.name : e.outletName,
      };
    }));

    addNotification('Outlet Deleted', `Outlet "${target.name}" and associated assignments removed.`, 'info');
    return { success: true };
  };

  // Multi-Outlet & Assignment Operations
  const assignEmployeeToOutlet = (params: {
    outletId: string;
    employeeRefId: string;
    isPrimary?: boolean;
    notes?: string;
  }): { success: boolean; error?: string } => {
    const targetOutlet = outlets.find(o => o.id === params.outletId);
    if (!targetOutlet) return { success: false, error: 'Target outlet does not exist.' };

    const targetEmp = allEmployees.find(e => e.id === params.employeeRefId);
    if (!targetEmp) return { success: false, error: 'Employee record not found.' };

    // Prevent duplicate active assignments to the same outlet
    const alreadyAssigned = assignments.some(
      a => a.outletId === params.outletId && a.employeeRefId === params.employeeRefId && a.status === 'active'
    );
    if (alreadyAssigned) {
      return { success: false, error: `${targetEmp.fullName} is already actively assigned to ${targetOutlet.name}.` };
    }

    const newAssignment: OutletEmployeeAssignment = {
      id: 'asn_' + Date.now(),
      outletId: params.outletId,
      outletName: targetOutlet.name,
      employeeId: targetEmp.employeeId,
      employeeRefId: targetEmp.id,
      employeeName: targetEmp.fullName,
      designation: targetEmp.designation,
      isPrimary: Boolean(params.isPrimary),
      assignedAt: new Date().toISOString(),
      status: 'active',
      notes: params.notes,
    };

    setAssignments(prev => [...prev, newAssignment]);

    // Update employee profile's assignedOutletIds
    setAllEmployees(prev => prev.map(e => {
      if (e.id === params.employeeRefId) {
        const set = new Set([...(e.assignedOutletIds || []), params.outletId]);
        return {
          ...e,
          assignedOutletIds: Array.from(set),
          ...(params.isPrimary ? { outletId: targetOutlet.id, outletName: targetOutlet.name } : {}),
        };
      }
      return e;
    }));

    if (currentUser.id === targetEmp.id && params.isPrimary) {
      setCurrentUser(prev => ({
        ...prev,
        outletId: targetOutlet.id,
        outletName: targetOutlet.name,
        assignedOutletIds: Array.from(new Set([...(prev.assignedOutletIds || []), params.outletId])),
      }));
    }

    addNotification(
      'Assignment Added',
      `${targetEmp.fullName} (${targetEmp.employeeId}) assigned to ${targetOutlet.name}.`,
      'success'
    );
    return { success: true };
  };

  const removeEmployeeFromOutlet = (assignmentId: string): { success: boolean; error?: string } => {
    const asn = assignments.find(a => a.id === assignmentId);
    if (!asn) return { success: false, error: 'Assignment not found.' };

    // Remove assignment
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));

    // Remove from employee's assignedOutletIds
    setAllEmployees(prev => prev.map(e => {
      if (e.id === asn.employeeRefId) {
        const remaining = (e.assignedOutletIds || []).filter(oId => oId !== asn.outletId);
        let nextPrimaryId = e.outletId;
        let nextPrimaryName = e.outletName;

        if (e.outletId === asn.outletId) {
          const nextOutlet = outlets.find(o => remaining.includes(o.id)) || outlets[0];
          nextPrimaryId = nextOutlet?.id || '';
          nextPrimaryName = nextOutlet?.name || '';
        }

        return {
          ...e,
          assignedOutletIds: remaining,
          outletId: nextPrimaryId,
          outletName: nextPrimaryName,
        };
      }
      return e;
    }));

    addNotification(
      'Assignment Removed',
      `Removed ${asn.employeeName} assignment from ${asn.outletName}. (Account preserved)`,
      'info'
    );
    return { success: true };
  };

  const transferEmployee = (
    employeeRefId: string,
    fromOutletId: string,
    toOutletId: string,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (fromOutletId === toOutletId) {
      return { success: false, error: 'Source and destination outlets cannot be identical.' };
    }

    const sourceOutlet = outlets.find(o => o.id === fromOutletId);
    const destOutlet = outlets.find(o => o.id === toOutletId);
    const emp = allEmployees.find(e => e.id === employeeRefId);

    if (!sourceOutlet || !destOutlet || !emp) {
      return { success: false, error: 'Invalid outlet or employee transfer reference.' };
    }

    // Check if already active at destination
    const alreadyAtDest = assignments.some(
      a => a.outletId === toOutletId && a.employeeRefId === employeeRefId && a.status === 'active'
    );

    // Update old assignment to transferred
    setAssignments(prev => {
      const updated = prev.map(a => {
        if (a.outletId === fromOutletId && a.employeeRefId === employeeRefId && a.status === 'active') {
          return { ...a, status: 'transferred' as const, notes: `Transferred to ${destOutlet.name}: ${notes || ''}` };
        }
        return a;
      });

      if (!alreadyAtDest) {
        const newAsn: OutletEmployeeAssignment = {
          id: 'asn_' + Date.now(),
          outletId: toOutletId,
          outletName: destOutlet.name,
          employeeId: emp.employeeId,
          employeeRefId: emp.id,
          employeeName: emp.fullName,
          designation: emp.designation,
          isPrimary: true,
          assignedAt: new Date().toISOString(),
          status: 'active',
          notes: `Transferred from ${sourceOutlet.name}: ${notes || ''}`,
        };
        return [...updated, newAsn];
      }
      return updated;
    });

    // Update employee profile
    setAllEmployees(prev => prev.map(e => {
      if (e.id === employeeRefId) {
        const nextAssigned = Array.from(new Set([
          ...(e.assignedOutletIds || []).filter(id => id !== fromOutletId),
          toOutletId
        ]));
        return {
          ...e,
          assignedOutletIds: nextAssigned,
          outletId: destOutlet.id,
          outletName: destOutlet.name,
        };
      }
      return e;
    }));

    if (currentUser.id === employeeRefId) {
      setCurrentUser(prev => ({
        ...prev,
        outletId: destOutlet.id,
        outletName: destOutlet.name,
        assignedOutletIds: Array.from(new Set([
          ...(prev.assignedOutletIds || []).filter(id => id !== fromOutletId),
          toOutletId
        ])),
      }));
    }

    addNotification(
      'Employee Transferred',
      `${emp.fullName} was transferred from ${sourceOutlet.name} to ${destOutlet.name}.`,
      'success'
    );
    return { success: true };
  };

  const getEmployeesForOutlet = (outletId: string): EmployeeProfile[] => {
    const activeEmpIds = new Set(
      assignments.filter(a => a.outletId === outletId && a.status === 'active').map(a => a.employeeRefId)
    );
    return allEmployees.filter(e => activeEmpIds.has(e.id) || (e.assignedOutletIds && e.assignedOutletIds.includes(outletId)));
  };

  const getAssignmentsForOutlet = (outletId: string): OutletEmployeeAssignment[] => {
    return assignments.filter(a => a.outletId === outletId && a.status === 'active');
  };

  const getOutletsForEmployee = (employeeRefId: string): Outlet[] => {
    const emp = allEmployees.find(e => e.id === employeeRefId);
    if (!emp) return [];
    const outletIds = new Set(emp.assignedOutletIds || [emp.outletId]);
    return outlets.filter(o => outletIds.has(o.id));
  };

  // Compute authorized outlets for current user
  const authorizedOutlets = useMemo(() => {
    if (currentUser.role === 'admin') {
      return outlets.filter(o => o.status === 'active');
    }
    if (currentUser.role === 'manager') {
      const managerOutletIds = new Set([
        ...(currentUser.assignedOutletIds || [currentUser.outletId]),
        ...outlets.filter(o => o.managerName === currentUser.fullName || o.managerEmployeeId === currentUser.employeeId).map(o => o.id)
      ]);
      const allowed = outlets.filter(o => managerOutletIds.has(o.id) && o.status === 'active');
      return allowed.length > 0 ? allowed : outlets.filter(o => o.status === 'active');
    }
    // Cashier
    const cashierOutletIds = new Set(currentUser.assignedOutletIds || [currentUser.outletId]);
    const allowed = outlets.filter(o => cashierOutletIds.has(o.id) && o.status === 'active');
    return allowed.length > 0 ? allowed : [outlets.find(o => o.id === currentUser.outletId) || outlets[0]];
  }, [currentUser, outlets]);

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
        loginWithGoogleEmail,
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
        toggleEmployeeStatus,
        deleteEmployee,
        outlets,
        addOutlet,
        updateOutlet,
        toggleOutletStatus,
        deleteOutlet,
        assignments,
        assignEmployeeToOutlet,
        removeEmployeeFromOutlet,
        transferEmployee,
        getEmployeesForOutlet,
        getAssignmentsForOutlet,
        getOutletsForEmployee,
        authorizedOutlets,
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
