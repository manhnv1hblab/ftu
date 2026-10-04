'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../lib/supabase/client';

type AuthResult = { error: string | null; code?: string };
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
function normalizeAuthError(error: unknown): AuthResult {
  const candidate = error as { message?: string; code?: string; status?: number } | null;
  const message = candidate?.message || (error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
  const lower = message.toLowerCase();
  if (candidate?.status === 429 || candidate?.code?.toLowerCase().includes('rate') || lower.includes('rate limit') || lower.includes('too many')) {
    return { code: 'EMAIL_RATE_LIMIT', error: 'Dịch vụ email Supabase đang giới hạn lượt gửi. Hãy chờ rồi thử lại, không bấm gửi lại liên tục.' };
  }
  if (lower.includes('error sending confirmation email') || lower.includes('smtp')) {
    return {
      code: 'EMAIL_PROVIDER_ERROR',
      error: 'Supabase không gửi được email xác minh. Hãy kiểm tra SMTP, API key và domain của địa chỉ gửi trong Supabase/Resend.'
    };
  }
  return { code: candidate?.code, error: message };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => { if (mounted) { setUser(data.user); setIsLoading(false); } });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user || null);
    });
    return () => { mounted = false; subscription.subscription.unsubscribe(); };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isConfigured: Boolean(supabase),
    async signIn(email, password) {
      if (!supabase) return { error: 'Supabase chưa được cấu hình.' };
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? normalizeAuthError(error) : { error: null };
    },
    async signUp(email, password) {
      if (!supabase) return { error: 'Supabase chưa được cấu hình.' };
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) return normalizeAuthError(error);
      return { error: null };
    },
    async resetPassword(email) {
      if (!supabase) return { error: 'Supabase chưa được cấu hình.' };
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` });
      return error ? normalizeAuthError(error) : { error: null };
    },
    async updatePassword(password) {
      if (!supabase) return { error: 'Supabase chưa được cấu hình.' };
      const { error } = await supabase.auth.updateUser({ password });
      return error ? normalizeAuthError(error) : { error: null };
    },
    async signOut() {
      if (!supabase) return { error: null };
      const { error } = await supabase.auth.signOut();
      return error ? normalizeAuthError(error) : { error: null };
    },
  }), [isLoading, supabase, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
