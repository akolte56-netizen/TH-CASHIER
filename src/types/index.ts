/**
 * Core TypeScript definitions for the Restaurant Cashier Checklist Management System
 */

export type UserRole = 'cashier' | 'manager' | 'admin';
export type EmploymentStatus = 'full_time' | 'part_time' | 'contract' | 'probation';
export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface EmployeeProfile {
  id: string;
  employeeId: string; // e.g., 'CS-104'
  fullName: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  outletId: string; // Primary outlet ID
  outletName: string; // Primary outlet Name
  assignedOutletIds: string[]; // Supports multiple outlet assignments
  employmentStatus?: EmploymentStatus;
  accountStatus: AccountStatus;
  createdAt: string;
  phone?: string;
  emailVerified?: boolean;
  passwordHash?: string;
  profilePhotoUrl?: string;
}

export interface OutletEmployeeAssignment {
  id: string;
  outletId: string;
  outletName: string;
  employeeId: string; // CS-104
  employeeRefId: string; // employee profile id
  employeeName: string;
  designation: string;
  isPrimary: boolean;
  assignedAt: string;
  status: 'active' | 'transferred' | 'removed';
  notes?: string;
}

export interface EmailAuthConfig {
  provider: 'local_secure' | 'supabase_auth';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  smtpConfigured: boolean;
  requireEmailVerification: boolean;
}

export interface Outlet {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  managerName?: string;
  managerEmployeeId?: string;
  contactEmail?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
}

export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'full';

export interface ShiftDefinition {
  id: ShiftType;
  name: string;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "15:30"
}

export type ChecklistType = 'opening' | 'mid_shift' | 'handover' | 'closing' | 'full_shift';

export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'not_applicable'
  | 'issue_found'
  | 'awaiting_manager';

export interface PhotoEvidence {
  id: string;
  dataUrl: string;
  capturedAt: string;
  capturedByEmployeeId: string;
  capturedByName: string;
  source: 'live_camera' | 'device_upload';
  notes?: string;
}

export interface ChecklistItemTemplate {
  id: string;
  checklistType: ChecklistType;
  category: string;
  categoryOrder: number;
  title: string;
  instructions: string;
  isMandatory: boolean;
  requiresPhoto: boolean;
  requiresRemarks: boolean;
  requiresManagerVerification: boolean;
  frequency: 'every_shift' | 'daily' | 'weekly';
  isActive: boolean;
  displayOrder: number;
}

export interface TaskCompletionRecord {
  templateId: string;
  category: string;
  title: string;
  instructions: string;
  isMandatory: boolean;
  requiresPhoto: boolean;
  requiresRemarks: boolean;
  requiresManagerVerification: boolean;
  status: TaskStatus;
  completedAt?: string;
  completedByEmployeeId?: string;
  completedByName?: string;
  photoEvidence?: PhotoEvidence;
  remarks?: string;
  naReason?: string;
  managerVerified?: boolean;
  managerRemarks?: string;
}

export interface DenominationCount {
  denomination: number; // e.g. 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25
  label: string;
  count: number;
  total: number;
}

export interface CashReconciliationData {
  openingFloat: number;
  cashSales: number;
  cashRefunds: number;
  cashPaidOut: number; // expenses or supplier cash payouts
  cashDeposits: number; // interim safe drop / banking
  expectedCash: number; // formula: openingFloat + cashSales - cashRefunds - cashPaidOut - cashDeposits
  physicalCashCount: number; // sum of denominations
  variance: number; // physicalCashCount - expectedCash
  varianceType: 'exact' | 'shortage' | 'excess';
  varianceReason?: string;
  denominationCounts: DenominationCount[];
  verifiedByManager?: boolean;
}

export interface PaymentReconciliationData {
  cashTotal: number;
  cardTotal: number;
  upiQrTotal: number;
  onlineAggregatorTotal: number; // Delivery channels (UberEats, DoorDash, etc.)
  otherTotal: number;
  posTotalSales: number;
  calculatedTotalSales: number;
  variance: number;
  discrepancyNotes?: string;
  edcDiscrepanciesReported: boolean;
}

export type ReportApprovalStatus = 
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'returned_for_correction'
  | 'rejected';

export interface ManagerApprovalData {
  managerId: string;
  managerName: string;
  managerEmployeeId: string;
  status: 'approved' | 'rejected' | 'returned_for_correction';
  decisionTimestamp: string;
  reviewRemarks: string;
  correctionRequestedItems?: string[];
  signatureDataUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface ChecklistReport {
  id: string; // e.g. "REP-20261024-DGB-0842"
  version: number;
  checklistType: ChecklistType;
  outletId: string;
  outletName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  shiftType: ShiftType;
  shiftStartTime: string;
  shiftEndTime: string;
  managerOnShiftId: string;
  managerOnShiftName: string;
  cashierId: string;
  cashierName: string;
  cashierEmployeeId: string;
  handoverCashierName?: string;
  handoverCashierEmployeeId?: string;
  startTime: string;
  submittedAt?: string;
  updatedAt: string;
  approvalStatus: ReportApprovalStatus;
  tasks: TaskCompletionRecord[];
  cashReconciliation?: CashReconciliationData;
  paymentReconciliation?: PaymentReconciliationData;
  generalRemarks?: string;
  handoverNotes?: string;
  managerApproval?: ManagerApprovalData;
  auditTrail: AuditLogEntry[];
  isLocked: boolean;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  relatedReportId?: string;
}
