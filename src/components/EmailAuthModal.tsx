import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  KeyRound, 
  X, 
  RotateCcw, 
  ShieldCheck,
  Check,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatoryLogin?: boolean;
}

type AuthTab = 'signin' | 'register' | 'forgot_password' | 'reset_password' | 'verify_email';

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({ 
  isOpen, 
  onClose,
  isMandatoryLogin = false,
}) => {
  const {
    loginWithEmail,
    loginWithGoogleEmail,
    registerWithEmail,
    sendPasswordReset,
    resetPasswordWithToken,
    verifyEmail,
    outlets,
    authConfig,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  
  // Sign In form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOutletId, setRegOutletId] = useState(outlets[0]?.id || 'out_1');
  const [regRole, setRegRole] = useState<UserRole>('cashier');
  const [regDesignation, setRegDesignation] = useState('Cashier');
  const [managerAuthPin, setManagerAuthPin] = useState('');
  const [managerPinError, setManagerPinError] = useState('');

  // Password Recovery form
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Verification form
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationTokenInput, setVerificationTokenInput] = useState('');

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [simulatedEmailNotification, setSimulatedEmailNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await loginWithEmail(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to authenticate.');
      } else {
        setSuccessMessage(`Welcome back, ${res.profile?.fullName}!`);
        setTimeout(() => {
          if (onClose) onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // Role elevation restriction: Cashier is default, Manager or Admin requires 8899 security PIN
    if (regRole !== 'cashier') {
      if (managerAuthPin !== '8899') {
        setManagerPinError('Elevated privileges require Manager Security PIN (Default: 8899).');
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await registerWithEmail({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        outletId: regOutletId,
        role: regRole,
        designation: regDesignation,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
        setIsLoading(false);
        return;
      }

      if (authConfig.requireEmailVerification && res.verificationToken) {
        setSimulatedEmailNotification(
          `[TH CASHIER VERIFICATION] To: ${regEmail}. Click the confirmation link or enter security token: ${res.verificationToken}`
        );
        setVerificationEmail(regEmail);
        setActiveTab('verify_email');
      } else {
        setSuccessMessage(`Account created! Welcome, ${res.profile?.fullName}.`);
        setTimeout(() => {
          if (onClose) onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await sendPasswordReset(recoveryEmail);
      if (!res.success) {
        setErrorMessage(res.error || 'Password reset request failed.');
      } else {
        if (res.simulatedEmailNotification) {
          setSimulatedEmailNotification(res.simulatedEmailNotification);
        }
        if (res.token) {
          setRecoveryToken(res.token);
        }
        setSuccessMessage('Password reset instructions sent. Please check your email.');
        setActiveTab('reset_password');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resetting Password with Token
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithToken(recoveryEmail, recoveryToken, newPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Password reset failed.');
      } else {
        setSuccessMessage('Password updated successfully! Please log in with your new password.');
        setLoginEmail(recoveryEmail);
        setLoginPassword(newPassword);
        setTimeout(() => {
          setActiveTab('signin');
          setSuccessMessage('Password updated! Ready to log in.');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email Verification Token
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await verifyEmail(verificationEmail, verificationTokenInput);
      if (!res.success) {
        setErrorMessage(res.error || 'Email verification failed.');
      } else {
        setSuccessMessage('Email verified successfully! You are now logged in.');
        setTimeout(() => {
          if (onClose) onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Account Autofill
  const handleSelectDemoAccount = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-neutral-700 flex items-center justify-center shrink-0 shadow">
              <img
                src="/assets/aistudio/image_0e8220c4.png"
                alt="th Cashier Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                EMAIL & GMAIL AUTHENTICATION
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {activeTab === 'signin' && 'Cashier & Staff Sign-In'}
                {activeTab === 'register' && 'Register Employee Account'}
                {activeTab === 'forgot_password' && 'Password Recovery'}
                {activeTab === 'reset_password' && 'Set New Password'}
                {activeTab === 'verify_email' && 'Verify Email Address'}
              </h3>
            </div>
          </div>

          {!isMandatoryLogin && onClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Tabs (Sign In / Register) */}
        {(activeTab === 'signin' || activeTab === 'register') && (
          <div className="grid grid-cols-2 bg-neutral-950/60 p-1 border-b border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In with Email
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Register New Staff
            </button>
          </div>
        )}

        {/* Email Simulation / Delivery Banner */}
        {simulatedEmailNotification && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-3.5 text-xs text-amber-200">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Email Notification (Simulator):</span>
                <p className="font-mono text-[11px] text-amber-300 mt-0.5 break-all">{simulatedEmailNotification}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Gmail or Email Address <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="e.g. priya.patel@thcashier.internal or name@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-semibold">
                    Password <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(loginEmail);
                      setActiveTab('forgot_password');
                    }}
                    className="text-amber-400 hover:underline text-[11px]"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Select Demo Accounts */}
              <div className="pt-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
                  One-Tap Demo Credentials:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectDemoAccount('priya.patel@thcashier.internal', 'Cashier@123')}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400 text-left transition-colors"
                  >
                    <span className="font-semibold text-neutral-200 block truncate">Priya Patel (Cashier)</span>
                    <span className="font-mono text-[10px] text-amber-400 block truncate">priya.patel@thcashier.internal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDemoAccount('marcus.vance@thcashier.internal', 'Manager@123')}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400 text-left transition-colors"
                  >
                    <span className="font-semibold text-neutral-200 block truncate">Marcus Vance (MOS)</span>
                    <span className="font-mono text-[10px] text-amber-400 block truncate">marcus.vance@thcashier.internal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDemoAccount('david.ross@thcashier.internal', 'Admin@123')}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400 text-left transition-colors"
                  >
                    <span className="font-semibold text-neutral-200 block truncate">David Ross (Director)</span>
                    <span className="font-mono text-[10px] text-amber-400 block truncate">david.ross@thcashier.internal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDemoAccount('akolte56@gmail.com', 'Password@123')}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400 text-left transition-colors"
                  >
                    <span className="font-semibold text-neutral-200 block truncate">akolte56@gmail.com</span>
                    <span className="font-mono text-[10px] text-amber-400 block truncate">Gmail Administrator</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !loginEmail || !loginPassword}
                  className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-400/10 disabled:opacity-40 cursor-pointer"
                >
                  {isLoading ? 'Signing in...' : 'Sign In to Operations Portal'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Gmail or Work Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="e.g. s.jenkins@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Outlet</label>
                  <select
                    value={regOutletId}
                    onChange={e => setRegOutletId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Role</label>
                  <select
                    value={regRole}
                    onChange={e => {
                      setRegRole(e.target.value as UserRole);
                      setManagerPinError('');
                    }}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs capitalize"
                  >
                    <option value="cashier">Cashier (Standard)</option>
                    <option value="manager">Manager on Shift (Protected)</option>
                    <option value="admin">Administrator (Protected)</option>
                  </select>
                </div>
              </div>

              {/* Elevated Role PIN Protection */}
              {regRole !== 'cashier' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Manager Security Authorization Required</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Restricted privileges require Executive Security PIN (Default: <strong>8899</strong>):
                  </p>
                  <input
                    type="password"
                    maxLength={6}
                    value={managerAuthPin}
                    onChange={e => {
                      setManagerAuthPin(e.target.value);
                      setManagerPinError('');
                    }}
                    placeholder="Enter Security PIN"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  {managerPinError && (
                    <p className="text-[10px] text-rose-400">{managerPinError}</p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-400/10 disabled:opacity-40 cursor-pointer"
                >
                  {isLoading ? 'Creating Account...' : 'Register Employee Account'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot_password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-neutral-400 text-xs">
                Enter your registered Gmail or employee email address. We will send a security recovery code or reset link.
              </p>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder="e.g. employee@thcashier.internal or name@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-neutral-400 hover:text-white text-xs"
                >
                  Back to Sign In
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !recoveryEmail}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-amber-400/10 disabled:opacity-40"
                >
                  {isLoading ? 'Sending...' : 'Send Recovery Email'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: RESET PASSWORD WITH CODE */}
          {activeTab === 'reset_password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  6-Digit Recovery Code *
                </label>
                <input
                  type="text"
                  required
                  value={recoveryToken}
                  onChange={e => setRecoveryToken(e.target.value.toUpperCase())}
                  placeholder="e.g. 8A3B9F"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-neutral-400 hover:text-white text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !recoveryToken || !newPassword}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-amber-400/10 disabled:opacity-40"
                >
                  {isLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: VERIFY EMAIL */}
          {activeTab === 'verify_email' && (
            <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
              <p className="text-neutral-400 text-xs">
                A verification link and security token were sent to <strong className="text-white">{verificationEmail}</strong>.
              </p>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Verification Security Token</label>
                <input
                  type="text"
                  required
                  value={verificationTokenInput}
                  onChange={e => setVerificationTokenInput(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character token"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !verificationTokenInput}
                  className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-400/10 disabled:opacity-40"
                >
                  {isLoading ? 'Verifying...' : 'Verify Email & Log In'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
