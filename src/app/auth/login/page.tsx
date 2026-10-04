'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push('/planner');
  };

  const switchMode = () => {
    setMode(value => value === 'login' ? 'signup' : 'login');
    setError(null);
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">FTU GoGlobal</p>
          <h1 className="mt-2 text-2xl font-extrabold text-on-surface">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Đăng nhập để lưu hồ sơ CTĐT và bản nháp planner trên nhiều thiết bị.</p>
        </div>
        {!isConfigured && <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">Supabase chưa được cấu hình trong môi trường này. Planner guest chỉ hoạt động tạm trong phiên hiện tại.</div>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-surface-container px-3 py-2.5" autoComplete="email" /></label>
          <label className="block text-sm font-semibold">Mật khẩu<input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-surface-container px-3 py-2.5" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
          <button disabled={busy || !isConfigured} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
        </form>
        <div className="mt-5 flex flex-col gap-2 text-center text-sm">
          <button type="button" onClick={switchMode} className="font-bold text-primary hover:underline">{mode === 'login' ? 'Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập'}</button>
          {mode === 'login' && <Link href="/auth/reset-password" className="text-on-surface-variant hover:underline">Quên mật khẩu?</Link>}
          <Link href="/planner" className="text-on-surface-variant hover:underline">Tiếp tục với chế độ khách</Link>
        </div>
      </section>
    </main>
  );
}
