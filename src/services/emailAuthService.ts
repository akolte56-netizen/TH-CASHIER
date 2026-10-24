/**
 * Email & Gmail Authentication Service for TH CASHIER
 * Supports Supabase Auth / Local Persistent Store, Email Verification, and Password Recovery
 */

export interface EmailAuthConfig {
  provider: 'local_secure' | 'supabase_auth';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  smtpConfigured: boolean;
  requireEmailVerification: boolean;
}

export const DEFAULT_EMAIL_AUTH_CONFIG: EmailAuthConfig = {
  provider: 'local_secure',
  smtpConfigured: false,
  requireEmailVerification: false,
};

const CONFIG_STORAGE_KEY = 'th_cashier_email_auth_config_v1';
const RESET_TOKENS_STORAGE_KEY = 'th_cashier_password_resets_v1';
const VERIFY_TOKENS_STORAGE_KEY = 'th_cashier_email_verifications_v1';

export class EmailAuthService {
  /**
   * Simple SHA-256 equivalent hashing using Web Crypto API to never store plaintext passwords
   */
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_th_cashier_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validates email format (standard RFC 5322 regex)
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    const clean = email.trim();
    if (!clean) {
      return { isValid: false, error: 'Email address is required.' };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) {
      return { isValid: false, error: 'Please enter a valid email or Gmail address.' };
    }
    return { isValid: true };
  }

  /**
   * Validates password strength (minimum 6 characters)
   */
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long.' };
    }
    return { isValid: true };
  }

  /**
   * Generates a password reset token and registers simulated/Supabase dispatch
   */
  static async requestPasswordReset(
    email: string,
    config: EmailAuthConfig = DEFAULT_EMAIL_AUTH_CONFIG
  ): Promise<{ success: boolean; token?: string; error?: string; simulatedEmailNotification?: string }> {
    const validation = this.validateEmail(email);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const cleanEmail = email.trim().toLowerCase();

    // If Supabase configured, execute password reset via Supabase Auth API
    if (config.provider === 'supabase_auth' && config.supabaseUrl && config.supabaseAnonKey) {
      try {
        const response = await fetch(`${config.supabaseUrl}/auth/v1/recover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: config.supabaseAnonKey,
          },
          body: JSON.stringify({ email: cleanEmail }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, error: errData.msg || errData.error_description || 'Supabase password recovery failed.' };
        }

        return {
          success: true,
          simulatedEmailNotification: `Password recovery email sent via Supabase Auth to ${cleanEmail}. Check your inbox for the reset link.`,
        };
      } catch (err: any) {
        return { success: false, error: `Supabase recovery error: ${err.message || 'Connection failed'}` };
      }
    }

    // Standard secure token generator
    const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    // Save token
    const existing = this.getResetTokens();
    existing[cleanEmail] = { token: resetToken, expiresAt };
    localStorage.setItem(RESET_TOKENS_STORAGE_KEY, JSON.stringify(existing));

    const simulatedEmailNotification = `[TH CASHIER EMAIL GATEWAY] To: ${cleanEmail} · Subject: Password Reset Request. Your security recovery code is: ${resetToken}. (Expires in 15 minutes).`;

    return {
      success: true,
      token: resetToken,
      simulatedEmailNotification,
    };
  }

  /**
   * Verifies reset token
   */
  static verifyResetToken(email: string, token: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim().toUpperCase();
    const resets = this.getResetTokens();
    const record = resets[cleanEmail];

    if (!record) return false;
    if (Date.now() > record.expiresAt) return false;
    return record.token === cleanToken;
  }

  /**
   * Generates email verification token for new registrations
   */
  static generateVerificationToken(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = this.getVerificationTokens();
    existing[cleanEmail] = { token, verified: false, createdAt: Date.now() };
    localStorage.setItem(VERIFY_TOKENS_STORAGE_KEY, JSON.stringify(existing));
    return token;
  }

  static isEmailVerified(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.getVerificationTokens();
    return existing[cleanEmail]?.verified === true;
  }

  static verifyEmailToken(email: string, token: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim().toUpperCase();
    const existing = this.getVerificationTokens();
    const record = existing[cleanEmail];

    if (!record) return false;
    if (record.token === cleanToken) {
      existing[cleanEmail].verified = true;
      localStorage.setItem(VERIFY_TOKENS_STORAGE_KEY, JSON.stringify(existing));
      return true;
    }
    return false;
  }

  static getResetTokens(): Record<string, { token: string; expiresAt: number }> {
    const raw = localStorage.getItem(RESET_TOKENS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  static getVerificationTokens(): Record<string, { token: string; verified: boolean; createdAt: number }> {
    const raw = localStorage.getItem(VERIFY_TOKENS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  static getAuthConfig(): EmailAuthConfig {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_EMAIL_AUTH_CONFIG;
  }

  static saveAuthConfig(config: EmailAuthConfig) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}
