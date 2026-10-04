'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function ResetPasswordPage() {
  const { resetPassword, updatePassword, user, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendReset = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    const result = await resetPassword(email); setBusy(false);
    if (result.error) setError(result.error); else setMessage('Đã gửi email đặt lại mật khẩu.');
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    const result = await updatePassword(password); setBusy(false);
    if (result.error) setError(result.error); else setMessage('Đã cập nhật mật khẩu thành công.');
  };

  return <main className="max-w-md mx-auto px-4 py-12"><section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-6 sm:p-8 shadow-sm"><h1 className="text-2xl font-extrabold">{user ? 'Đổi mật khẩu' : 'Đặt lại mật khẩu'}</h1><p className="mt-2 text-sm text-on-surface-variant">{user ? 'Chọn mật khẩu mới cho tài khoản.' : 'Nhập email đã đăng ký để nhận liên kết đặt lại.'}</p>{!isConfigured && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Supabase chưa được cấu hình.</p>}{user ? <form onSubmit={changePassword} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Mật khẩu mới<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-surface-container px-3 py-2.5" /></label><button disabled={busy || !isConfigured} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Cập nhật mật khẩu</button></form> : <form onSubmit={sendReset} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-surface-container px-3 py-2.5" /></label><button disabled={busy || !isConfigured} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Gửi email đặt lại</button></form>}{error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p>}<Link href="/auth/login" className="mt-5 block text-center text-sm font-bold text-primary hover:underline">Quay lại đăng nhập</Link></section></main>;
}
