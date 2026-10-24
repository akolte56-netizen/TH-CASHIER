import React, { useState } from 'react';
import { Database, Copy, Check, X, Shield, Terminal, Key } from 'lucide-react';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- ====================================================================
-- TH CASHIER: OUTLETS, EMPLOYEES & MULTI-OUTLET ASSIGNMENTS SCHEMA
-- Run this in your Supabase SQL Editor to provision tables & RLS policies
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Outlets Table
CREATE TABLE IF NOT EXISTS public.outlets (
    id TEXT PRIMARY KEY DEFAULT ('out_' || extract(epoch from now())::bigint),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(64),
    contact_email VARCHAR(255),
    manager_name VARCHAR(255),
    manager_employee_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    timezone VARCHAR(64) DEFAULT 'America/New_York',
    currency VARCHAR(16) DEFAULT 'USD',
    currency_symbol VARCHAR(8) DEFAULT '$',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for outlet search
CREATE INDEX IF NOT EXISTS idx_outlets_code ON public.outlets(code);
CREATE INDEX IF NOT EXISTS idx_outlets_status ON public.outlets(status);

-- 3. Employees / Profiles Table
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY DEFAULT ('emp_' || extract(epoch from now())::bigint),
    employee_id VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
    designation VARCHAR(255) DEFAULT 'Cashier',
    department VARCHAR(255) DEFAULT 'Front of House Operations',
    primary_outlet_id TEXT REFERENCES public.outlets(id) ON DELETE SET NULL,
    employment_status VARCHAR(32) DEFAULT 'full_time' CHECK (employment_status IN ('full_time', 'part_time', 'contract', 'probation')),
    account_status VARCHAR(32) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    phone VARCHAR(64),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for employee queries
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);

-- 4. Outlet-Employee Assignments Junction Table (Multi-Outlet Support)
CREATE TABLE IF NOT EXISTS public.outlet_employee_assignments (
    id TEXT PRIMARY KEY DEFAULT ('asn_' || extract(epoch from now())::bigint),
    outlet_id TEXT NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    employee_ref_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_id VARCHAR(64) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'removed')),
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by TEXT,
    CONSTRAINT uq_active_outlet_employee UNIQUE (outlet_id, employee_ref_id, status)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_asn_outlet ON public.outlet_employee_assignments(outlet_id);
CREATE INDEX IF NOT EXISTS idx_asn_employee ON public.outlet_employee_assignments(employee_ref_id);
CREATE INDEX IF NOT EXISTS idx_asn_status ON public.outlet_employee_assignments(status);

-- 5. Row Level Security (RLS) Setup
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_employee_assignments ENABLE ROW LEVEL SECURITY;

-- Administrators: Full Access
CREATE POLICY "Admin full access on outlets" ON public.outlets
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'akolte56@gmail.com');

CREATE POLICY "Admin full access on employees" ON public.employees
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'akolte56@gmail.com');

CREATE POLICY "Admin full access on assignments" ON public.outlet_employee_assignments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'akolte56@gmail.com');

-- Managers & Cashiers: Read assigned outlets and active roster
CREATE POLICY "Employees can view active outlets" ON public.outlets
    FOR SELECT USING (status = 'active');

CREATE POLICY "Employees can view active assignments" ON public.outlet_employee_assignments
    FOR SELECT USING (status = 'active');

CREATE POLICY "Employees can view own and outlet peer profiles" ON public.employees
    FOR SELECT USING (account_status = 'active');
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Supabase / PostgreSQL Database Schema</h3>
              <p className="text-xs text-neutral-400">
                Safe migrations for outlets, employees, and junction assignments with RLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Supports multi-outlet employee assignments without duplicate user accounts. Historical checklists remain intact.
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied SQL' : 'Copy Script'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto font-mono text-[11px] leading-relaxed bg-neutral-950 text-neutral-300">
          <pre className="whitespace-pre-wrap select-all">{sqlSchema}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Target: Supabase PostgreSQL / Cloud SQL</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
