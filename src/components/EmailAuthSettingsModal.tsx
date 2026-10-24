import React, { useState } from 'react';
import { 
  Server, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Key, 
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmailAuthConfig } from '../types';

interface EmailAuthSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailAuthSettingsModal: React.FC<EmailAuthSettingsModalProps> = ({ isOpen, onClose }) => {
  const { authConfig, updateAuthConfig } = useApp();

  const [provider, setProvider] = useState<EmailAuthConfig['provider']>(authConfig.provider);
  const [supabaseUrl, setSupabaseUrl] = useState(authConfig.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(authConfig.supabaseAnonKey || '');
  const [requireVerification, setRequireVerification] = useState(authConfig.requireEmailVerification);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAuthConfig({
      provider,
      supabaseUrl,
      supabaseAnonKey,
      smtpConfigured: provider === 'supabase_auth' && !!supabaseUrl && !!supabaseAnonKey,
      requireEmailVerification: requireVerification,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Email Authentication & Supabase Backend</h3>
              <p className="text-xs text-neutral-400">Configure email verification, password reset, and Supabase keys</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Status banner */}
          <div className="p-4 rounded-2xl border bg-neutral-950 border-neutral-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white">
                {provider === 'supabase_auth' && supabaseUrl ? 'Supabase Auth Mode' : 'Standalone Secure Email Auth Mode'}
              </h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Passwords are authenticated using client-side SHA-256 cryptographic salt and stored in a secure session. Never stored in plaintext.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Provider Mode Selection */}
            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                Authentication Backend Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('local_secure')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider === 'local_secure'
                      ? 'bg-amber-500/10 border-amber-400 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block text-neutral-200">Local Secure Auth</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Built-in salt hashing & reset simulation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('supabase_auth')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider === 'supabase_auth'
                      ? 'bg-amber-500/10 border-amber-400 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block text-neutral-200">Supabase Auth API</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Cloud Supabase project connection</span>
                </button>
              </div>
            </div>

            {/* Supabase inputs */}
            {provider === 'supabase_auth' && (
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-white block">Supabase Project Settings</span>
                <div>
                  <label className="block text-neutral-400 mb-1">Project URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={e => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Anon Public API Key</label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={e => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Email Verification Requirement Toggle */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={requireVerification}
                onChange={e => setRequireVerification(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-500"
              />
              <div>
                <span className="font-semibold text-white block">Enforce Email Verification on Registration</span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  When enabled, newly registered users must confirm their email before logging in.
                </span>
              </div>
            </label>

            {/* Android APK Deep Linking & Redirect Guide */}
            <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl space-y-1.5 text-[11px] text-neutral-400">
              <span className="font-semibold text-neutral-200 block flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Android APK Redirect & Reset Link Setup:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                <li>In Supabase Dashboard → Authentication → URL Configuration:</li>
                <li>Set <strong>Site URL</strong> to: <code className="text-amber-300 font-mono">https://ais-pre-dakbp5lnhsozfwy4nppi2x-475302824174.asia-northeast1.run.app</code></li>
                <li>Add Redirect URLs for Android app scheme: <code className="text-amber-300 font-mono">thcashier://auth/callback</code> or web preview domain.</li>
                <li>Custom SMTP can be connected under <strong>Project Settings → Auth → SMTP Settings</strong> (e.g. Gmail App Password, Resend, or SendGrid).</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold hover:bg-amber-300 transition-colors"
              >
                Save Auth Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
