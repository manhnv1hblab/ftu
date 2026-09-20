'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStudent } from '../../context/StudentContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { currentStep, saveDraft, resetAll, lastSavedAt } = useStudent();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saveAlert, setSaveAlert] = useState<string | null>(null);

  const handleQuickSave = () => {
    const ok = saveDraft();
    if (ok) {
      setSaveAlert('Đã lưu bản nháp học tập thành công!');
      setTimeout(() => setSaveAlert(null), 3000);
    }
  };

  const handleResetDraft = () => {
    if (!window.confirm('Xóa toàn bộ hồ sơ, kế hoạch và nguyện vọng đang lưu trên trình duyệt?')) return;
    resetAll();
    setSaveAlert('Đã xóa bản nháp trên trình duyệt.');
    setTimeout(() => setSaveAlert(null), 3000);
  };

  const navLinks = [
    { href: '/', label: 'Trang chủ', path: 'trang-chu' },
    { href: '/partners', label: 'Danh sách trường', path: 'danh-sach-truong' },
    { href: '/planner', label: 'Lập kế hoạch quy đổi', path: 'lap-ke-hoach-quy-doi', badge: `Bước ${currentStep}/5` },
    { href: '/compare', label: 'So sánh trường', path: 'so-sanh-truong' },
    { href: '/reviews', label: 'Review Alumni', path: 'review-alumni' },
    { href: '/handbook', label: 'Cẩm nang & FAQ', path: 'cam-nang-faq' },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_4px_20px_rgba(149,0,42,0.06)] transition-all">
      {/* Top Banner Identity Notice */}
      <div className="bg-primary text-on-primary py-1.5 px-space-md text-center text-body-sm font-body-sm flex items-center justify-center gap-space-xs text-xs">
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          verified_user
        </span>
        <span>
          Cổng thông tin trao đổi S27 (Học kỳ II năm học 2026 - 2027) • Dữ liệu đối tác & môn quy đổi được đối chiếu từ tài liệu S27; kết quả chỉ mang tính tư vấn
        </span>
      </div>

      {/* Main Nav Container */}
      <div className="h-20 w-full max-w-7xl mx-auto px-space-lg flex items-center justify-between">
        {/* Brand Logo with 3D Mascot Icon */}
        <Link href="/" className="flex items-center gap-space-md group">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shadow-sm group-hover:shadow-md border border-primary/20 group-hover:scale-105 transition-all">
            <img
              src="/images/3d_globe.jpg"
              alt="FTU GoGlobal 3D Mascot"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-extrabold leading-tight">
                FTU GoGlobal
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-bold uppercase shadow-xs">
                S27
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:block">
              Cổng Tra Cứu Trao Đổi Sinh Viên
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Pill Style) */}
        <nav className="hidden lg:flex items-center gap-space-xs">
          {navLinks.map((item) => {
            const isActive =
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-label-md rounded-full px-4 py-2 shadow-sm'
                    : 'px-3.5 py-2 text-on-surface-variant hover:text-on-surface font-label-md text-label-md rounded-full hover:bg-surface-container-low'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-space-sm">
          <button
            onClick={handleQuickSave}
            title="Lưu bản nháp kế hoạch"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary/20 text-primary font-label-md text-label-md hover:bg-primary/5 transition-all"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Lưu nháp</span>
          </button>

          {lastSavedAt && (
            <span className="hidden xl:inline text-[11px] text-on-surface-variant" title={lastSavedAt}>
              Đã lưu {new Date(lastSavedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            type="button"
            onClick={handleResetDraft}
            title="Xóa toàn bộ dữ liệu bản nháp trên trình duyệt"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-rose-200 text-rose-700 font-label-md text-label-md hover:bg-rose-50 transition-all"
          >
            <span className="material-symbols-outlined text-base">delete_sweep</span>
            <span>Xóa draft</span>
          </button>

          <Link
            href="/planner"
            className="inline-flex items-center gap-space-xs px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container transition-all transform active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            <span className="hidden sm:inline">Lập kế hoạch ngay</span>
            <span className="sm:hidden">Lập KH</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveAlert && (
        <div className="bg-emerald-700 text-white text-xs font-bold text-center py-1.5 px-4 animate-fade-in shadow-inner">
          {saveAlert}
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-container bg-surface-container-lowest px-space-lg pt-space-sm pb-space-lg space-y-2 shadow-xl animate-fade-in">
          {navLinks.map((item) => {
            const isActive =
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2">
            <button
              onClick={() => {
                handleQuickSave();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-primary/20 text-primary text-xs font-bold bg-primary/5"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>Lưu bản nháp vào trình duyệt</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
