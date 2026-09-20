'use client';

import React from 'react';
import Link from 'next/link';

export default function ReviewsPage() {
  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary via-primary-container to-secondary text-on-primary p-7 sm:p-10 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-bold">
            <span className="material-symbols-outlined text-sm">forum</span>
            Kênh chia sẻ cộng đồng
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Kinh nghiệm cựu sinh viên</h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Tài liệu S27 hiện không cung cấp bộ bài viết hoặc thống kê review alumni đã được xác minh. Vì vậy trang này không hiển thị nội dung chi phí, học bổng, visa hay quy đổi do người dùng chưa cung cấp nguồn kiểm chứng.
          </p>
          <Link href="/planner" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg">
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            Lập kế hoạch từ dữ liệu S27
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600">info</span>
          <div className="space-y-2">
            <p className="font-bold">Chưa có review được audit</p>
            <p>
              Các chia sẻ cộng đồng trong tương lai cần ghi rõ người cung cấp, thời điểm, trường đối tác và tài liệu chứng minh. Nội dung cộng đồng sẽ chỉ mang tính tham khảo và không được dùng để kết luận eligibility, chi phí hoặc công nhận tín chỉ.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
