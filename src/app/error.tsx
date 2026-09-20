'use client';

import React from 'react';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-container-low px-6">
      <section className="max-w-lg rounded-3xl bg-surface-container-lowest border border-surface-container p-8 text-center shadow-sm">
        <span className="material-symbols-outlined text-4xl text-primary">error</span>
        <h1 className="mt-4 text-2xl font-extrabold text-on-surface">Không thể tải dữ liệu trang</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Có lỗi tạm thời khi xử lý dữ liệu. Hồ sơ bản nháp trong trình duyệt không bị thay đổi.
        </p>
        <button type="button" onClick={() => reset()} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary">
          Thử lại
        </button>
      </section>
    </main>
  );
}
