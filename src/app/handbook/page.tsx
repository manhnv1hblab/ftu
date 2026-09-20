'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import handbookData from '../../../data/handbook_s27.json';

export default function HandbookPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'GUIDE' | 'CONVERSION' | 'PITFALLS'>('GUIDE');

  const steps = handbookData.steps;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Top Advisory Banner */}
      <div className="bg-gradient-to-r from-primary via-primary-container to-secondary rounded-3xl p-6 sm:p-8 text-on-primary shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white font-label-sm text-label-sm font-bold self-start">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span>CẨM NANG HỌC VỤ & QUY TRÌNH CHÍNH THỨC FTU S27</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-white font-extrabold tracking-tight">
              Hướng Dẫn Thủ Tục Trao Đổi Sinh Viên Toàn Diện
            </h1>
            <p className="font-body-md text-body-md text-white/90">
              Tài liệu hướng dẫn nghiệp vụ do Phòng Quản lý Đào tạo & Phòng Hợp tác Quốc tế (Trường Đại học Ngoại thương) ban hành cho Chương trình trao đổi sinh viên Học kỳ II năm học 2026–2027.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/planner"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-primary font-label-md text-label-md font-bold shadow-md hover:bg-surface-container-low transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Lập kế hoạch quy đổi ngay</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Official Deadline Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-bold text-on-surface">Đợt 1: Châu Âu & Bắc Mỹ (S27)</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Chốt hồ sơ nội bộ & duyệt đề cương</span>
          </div>
          <div className="text-right">
            <span className="font-headline-sm text-headline-sm font-black text-primary">15/05/2026</span>
            <span className="block font-label-sm text-label-sm text-on-surface-variant">Hạn chót 17:00</span>
          </div>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-bold text-on-surface">Đợt 2: Châu Á & AIMS (S27)</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Chốt hồ sơ đề cử đối tác & visa</span>
          </div>
          <div className="text-right">
            <span className="font-headline-sm text-headline-sm font-black text-secondary">30/05/2026</span>
            <span className="block font-label-sm text-label-sm text-on-surface-variant">Hạn chót 17:00</span>
          </div>
        </div>
      </div>

      {/* 4-Stage Procedure Matrix */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-surface-container pb-4">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Lộ Trình Hành Chính</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
              Quy Trình 4 Giai Đoạn Nộp Hồ Sơ Trao Đổi
            </h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
            Thực hiện tuần tự các bước dưới đây để đảm bảo môn học được chuyển đổi tín chỉ hợp lệ theo tiêu chuẩn đào tạo FTU.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stage 1 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between shadow-sm border border-surface-container hover:shadow-md hover:border-primary/40 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs border border-primary/20 group-hover:scale-105 transition-transform">
                  <img
                    src="/images/3d_checklist.jpg"
                    alt="Stage 1 Checklist"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-bold text-xs">
                  Phòng HTQT (A202)
                </span>
              </div>
              <div>
                <span className="font-label-sm text-primary font-bold uppercase text-[10px]">Giai đoạn 01</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base mt-0.5">
                  Chuẩn Bị & Nộp Nội Bộ
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs">
                  Sàng lọc năng lực học tập và phê duyệt danh sách đề cử chính thức.
                </p>
              </div>
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>GPA tích lũy ≥ 2.80 / 4.0 (≥ 7.50 / 10).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Chứng chỉ tiếng Anh tương đương B2 CEFR trở lên, còn hiệu lực theo quy trình S27.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Tích lũy tối thiểu 35 tín chỉ FTU.</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 bg-surface-container-low -mx-6 -mb-6 p-4 rounded-b-3xl flex items-center justify-between border-t border-surface-container text-xs">
              <span className="font-label-sm text-label-sm font-bold text-primary">Tiền đề cử</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Trước 4-5 tháng</span>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between shadow-sm border border-surface-container hover:shadow-md hover:border-secondary/40 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs border border-secondary/20 group-hover:scale-105 transition-transform">
                  <img
                    src="/images/3d_scales.jpg"
                    alt="Stage 2 Scales"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed/50 font-label-sm text-label-sm text-on-secondary-fixed-variant font-bold text-xs">
                  Khoa Chuyên Môn
                </span>
              </div>
              <div>
                <span className="font-label-sm text-secondary font-bold uppercase text-[10px]">Giai đoạn 02</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base mt-0.5">
                  Duyệt Đề Cương Môn Học
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs">
                  Thủ tục quan trọng nhất để bảo đảm quyền lợi quy đổi điểm sau này.
                </p>
              </div>
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Điền đơn theo <strong>Mẫu 04/QĐ-ĐT</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Đính kèm Syllabus chính thức bằng tiếng Anh.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Xin chữ ký xác nhận của <strong>Trưởng Bộ môn</strong>.</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 bg-surface-container-low -mx-6 -mb-6 p-4 rounded-b-3xl flex items-center justify-between border-t border-surface-container text-xs">
              <span className="font-label-sm text-label-sm font-bold text-secondary">Trước khi bay</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Tối thiểu 30 ngày</span>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between shadow-sm border border-surface-container hover:shadow-md hover:border-tertiary/40 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs border border-tertiary/20 group-hover:scale-105 transition-transform">
                  <img
                    src="/images/3d_passport.jpg"
                    alt="Stage 3 Passport"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/50 font-label-sm text-label-sm text-on-tertiary-fixed-variant font-bold text-xs">
                  Tại Nước Ngoài
                </span>
              </div>
              <div>
                <span className="font-label-sm text-tertiary font-bold uppercase text-[10px]">Giai đoạn 03</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base mt-0.5">
                  Học Tập & Cập Nhật Mã
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs">
                  Xử lý linh hoạt khi lịch học trường đối tác bị trùng hoặc hủy lớp.
                </p>
              </div>
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Đăng ký tối thiểu <strong>05 môn</strong> tại đối tác.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Báo P.HTQT nếu có thay đổi trong <strong>02 tuần đầu</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Duy trì điểm chuyên cần và thi cử đầy đủ.</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 bg-surface-container-low -mx-6 -mb-6 p-4 rounded-b-3xl flex items-center justify-between border-t border-surface-container text-xs">
              <span className="font-label-sm text-label-sm font-bold text-tertiary">Trong học kỳ</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Học kỳ mùa Xuân</span>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between shadow-sm border border-surface-container hover:shadow-md hover:border-primary/40 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs border border-primary/20 group-hover:scale-105 transition-transform">
                  <img
                    src="/images/3d_graduation.jpg"
                    alt="Stage 4 Graduation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary-fixed font-label-sm text-label-sm text-primary font-bold text-xs">
                  Phòng QLĐT
                </span>
              </div>
              <div>
                <span className="font-label-sm text-primary font-bold uppercase text-[10px]">Giai đoạn 04</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base mt-0.5">
                  Chuyển Điểm & Khóa Luận
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs">
                  Quy đổi kết quả học tập về bảng điểm FTU và tốt nghiệp đúng hạn.
                </p>
              </div>
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Nộp bản gốc Bảng điểm có niêm phong từ đối tác.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Hoàn tất đổi điểm tối thiểu <strong>03 môn</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-tertiary shrink-0 mt-0.5">check_circle</span>
                  <span>Điều kiện HPTN: nợ không quá <strong>06 tín chỉ</strong>.</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 bg-surface-container-low -mx-6 -mb-6 p-4 rounded-b-3xl flex items-center justify-between border-t border-surface-container text-xs">
              <span className="font-label-sm text-label-sm font-bold text-primary">Sau khi về</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Tối đa 30 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* 9 S27 Academic Rules */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-2xl">verified</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            9 Điều kiện bắt buộc tham gia chương trình S27
          </h2>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Ban hành kèm theo Thông báo S27 dành cho sinh viên đại học chính quy Trường Đại học Ngoại thương.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {handbookData.academicConditions.map((cond, idx) => (
            <div key={idx} className="bg-surface-container-low p-4 rounded-2xl border border-surface-container flex items-start gap-3 text-body-sm">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 mt-0.5 text-xs">
                {idx + 1}
              </span>
              <span className="text-on-surface leading-relaxed">{cond}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 11-Step Interactive Accordion & Detail */}
      <div className="space-y-4">
        <div className="border-b border-surface-container pb-3">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Chi tiết 11 bước quy trình học vụ S27
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Nhấp vào từng bước để theo dõi chi tiết hướng dẫn và cơ quan thẩm quyền giải quyết.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            {steps.map((s) => {
              const isSelected = activeStep === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(s.step)}
                  className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-between gap-2 border ${
                    isSelected
                      ? 'bg-primary text-white font-bold border-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-white text-primary' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {s.step}
                    </span>
                    <span className="truncate">{s.title.split(':')[0]}</span>
                  </div>
                  <span className="material-symbols-outlined text-base shrink-0">chevron_right</span>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-5">
            {(() => {
              const current = steps.find(s => s.step === activeStep) || steps[0];
              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container pb-4">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase">
                      Bước {current.step} trên 11
                    </span>
                    {current.timeline && (
                      <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                        {current.timeline}
                      </span>
                    )}
                  </div>

                  <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                    {current.title}
                  </h3>

                  <div className="bg-surface-container-low p-5 rounded-2xl text-body-sm space-y-2 text-on-surface-variant leading-relaxed border border-surface-container">
                    <div className="font-bold text-on-surface">Nội dung thực hiện chi tiết:</div>
                    <p className="whitespace-pre-line">{current.detail}</p>
                  </div>

                  {current.department && (
                    <div className="flex items-center gap-2 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-primary text-lg">domain</span>
                      <span>Đơn vị phụ trách: <strong>{current.department}</strong></span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                    <button
                      type="button"
                      disabled={activeStep <= 1}
                      onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 transition-colors"
                    >
                      ← Bước trước
                    </button>
                    <button
                      type="button"
                      disabled={activeStep >= steps.length}
                      onClick={() => setActiveStep(prev => Math.min(steps.length, prev + 1))}
                      className="px-5 py-2 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-container disabled:opacity-40 transition-colors"
                    >
                      Bước tiếp theo →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Credit Conversion Reference */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary">
          <span className="material-symbols-outlined text-2xl">calculate</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Quy đổi tín chỉ
          </h2>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Tài liệu S27 hiện cung cấp bảng equivalence theo từng học phần và trường đối tác, nhưng không cung cấp một bảng tỷ lệ quy đổi tín chỉ quốc tế dùng chung. Hệ thống không tự suy đoán tỷ lệ; việc công nhận chính thức cần được FTU thẩm định.
        </p>
      </div>

      {/* Official FTU Contacts Strip */}
      <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 border border-surface-container flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-3xl">contact_support</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Cần hỗ trợ trực tiếp từ Ban Điều phối Trao đổi FTU?
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Phòng Hợp tác Quốc tế, A903 - Tầng 9 - Nhà A • 09:00 - 11:30 hoặc 14:00 - 17:00 các ngày làm việc
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:outbound@ftu.edu.vn"
            className="px-5 py-2.5 rounded-full bg-white text-on-surface hover:text-primary font-label-md text-label-md font-bold transition-all shadow-xs border border-surface-container"
          >
            Email: outbound@ftu.edu.vn
          </a>
          <a
            href="tel:02432595161"
            className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs hover:bg-primary-container transition-all"
          >
            Hotline: (+84) 24 325 95161 (ext. 6200)
          </a>
        </div>
      </div>
    </div>
  );
}
