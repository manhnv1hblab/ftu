'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudent } from '../../context/StudentContext';
import costsData from '../../../data/costs_by_country.json';
import universitiesData from '../../../data/universities_s27.json';
import { CountryCost } from '../../types/cost';
import { PartnerUniversity } from '../../types/university';
import { S27_RULES } from '../../config/s27Rules';
import { findCountryCost } from '../../engine/costCalculator';

export const Step5Compare: React.FC = () => {
  const router = useRouter();
  const {
    profile,
    rankedChoices,
    setCurrentStep,
    saveDraft,
    exportDraftJson,
    importDraftJson
  } = useStudent();

  const rawCosts = costsData as Record<string, CountryCost>;
  const rawUnis = universitiesData as PartnerUniversity[];

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveDraft = () => {
    const ok = saveDraft();
    if (ok) showNotification('Đã lưu bản kế hoạch thành công!');
  };

  const handleExportJson = () => {
    const jsonStr = exportDraftJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ke_hoach_trao_doi_FTU_S27_${profile.cohort}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Đã tải xuống file JSON kế hoạch trao đổi!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const ok = importDraftJson(content);
      if (ok) {
        showNotification('Đã nạp thành công bản kế hoạch từ file JSON!');
      } else {
        showNotification('File JSON không hợp lệ hoặc không vượt qua kiểm tra nguồn dữ liệu.');
      }
    };
    reader.readAsText(file);
  };

  const uniCards = (['nv1', 'nv2', 'nv3'] as const)
    .map(rank => {
      const plan = rankedChoices[rank];
      if (!plan || !plan.status || plan.transferredCourses.length === 0) return null;
      const uni = rawUnis.find(u => u.id === plan.universityId);
      if (!uni) return null;
      return { rank, label: rank.toUpperCase(), uni, plan, badge: plan.status === 'VALID' ? 'Đã xác minh theo dữ liệu hiện có' : 'Bản nháp cần xác minh' };
    })
    .filter((card): card is NonNullable<typeof card> => Boolean(card));

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in py-2">
      {/* 1. Header & Actions with 3D Trophy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-container/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-primary/20 animate-float">
            <img
              src="/images/3d_scholarship.jpg"
              alt="3D Scholarship Trophy"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">award_star</span>
              <span>Bước 5: Hoàn tất & Xuất hồ sơ trao đổi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              Bảng so sánh 3 nguyện vọng trao đổi
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Chỉ hiển thị các nguyện vọng đã lưu từ dữ liệu người dùng và nguồn S27 được audit.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/print')}
            className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>In bản kế hoạch A4</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Lưu file JSON</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center shadow-sm animate-fade-in">
          {notification}
        </div>
      )}

      {uniCards.length === 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-sm">
          Chưa có nguyện vọng nào được lưu. Hãy quay lại bước 3 và bước 4 để chọn trường, xây dựng kế hoạch và lưu NV1–NV3.
        </div>
      )}

      {/* 2. Clean Comparison Table Card */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container/80 overflow-hidden">
        {/* Table Header: 3 Universities */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-container border-b border-surface-container bg-surface-container-low/40">
          {uniCards.map(({ rank, label, uni, badge }) => (
            <div key={rank} className="p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-surface-container-low mb-3 shadow-xs">
                  <img
                    src={uni.imageUrl || '/images/logo.png'}
                    alt={uni.name}
                    className={`w-full h-full ${uni.imageSourceType === 'official-campus-image' || uni.imageSourceType === 'internet-campus-image' ? 'object-cover' : 'object-contain bg-white p-8'}`}
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold shadow-xs">
                    {label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    {badge}
                  </span>
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    {uni.qsRank || uni.nationalRank || uni.region}
                  </span>
                </div>
                <h3 className="text-base font-bold text-on-surface line-clamp-1" title={uni.name}>
                  {uni.name}
                </h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span>{uni.flag || '🌏'}</span>
                  <span>{uni.city ? `${uni.city}, ` : ''}{uni.country}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                }}
                className="text-xs text-primary font-bold hover:underline self-start flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">sync</span>
                <span>Thay đổi trường này</span>
              </button>
            </div>
          ))}
        </div>

        {/* Comparison Dimensions */}
        <div className="divide-y divide-surface-container text-xs">
          {/* Row 1: Môn & Tín chỉ quy đổi */}
          <div className="p-5 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">
              1. Khả năng quy đổi tín chỉ về FTU (Chuẩn S27)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {uniCards.map(({ rank, plan }) => {
                const approvedCourses = plan?.transferredCourses?.filter(course => course.status === 'APPROVED') || [];
                const approvedCount = approvedCourses.length;
                const cr = approvedCourses.reduce((sum, course) => sum + course.ftuCredits, 0);
                return (
                  <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                    <span className="text-sm font-black text-on-surface block">
                      {approvedCount} môn đã duyệt ({cr} tín chỉ FTU)
                    </span>
                    <span className={`text-[11px] font-bold mt-0.5 block ${approvedCount >= S27_RULES.transferredCoursesMinimum ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {approvedCount >= S27_RULES.transferredCoursesMinimum ? `Đạt ngưỡng tối thiểu ${S27_RULES.transferredCoursesMinimum} môn đã duyệt` : `Chưa đủ ${S27_RULES.transferredCoursesMinimum} môn đã duyệt`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2: Môn học tại đối tác */}
          <div className="p-5 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">
              2. Tổng số môn học tại trường đối tác
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {uniCards.map(({ rank, plan }) => {
                const count = (plan?.transferredCourses?.length || 0) + (plan?.hostAdditionalCourses?.length || 0);
                const hasUnverifiedHostCourses = plan?.status !== 'VALID'
                  || Boolean(plan?.hostAdditionalCourses?.some(course => !course.hostCourseCode || !course.estimatedCredits));
                return (
                  <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                    <span className="text-sm font-black text-on-surface block">
                      {count} môn học quốc tế
                    </span>
                    <span className={`text-[11px] font-bold mt-0.5 block ${count >= S27_RULES.hostCoursesMinimum && !hasUnverifiedHostCourses ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {count < S27_RULES.hostCoursesMinimum
                        ? 'Chưa đạt ngưỡng tối thiểu'
                        : hasUnverifiedHostCourses
                          ? 'Đủ số lượng theo bản nháp; cần xác minh'
                          : `Đạt ngưỡng tối thiểu ${S27_RULES.hostCoursesMinimum} môn`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 3: Học phí & Học bổng */}
          <div className="p-5 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">
              3. Thông tin học bổng / học phí theo nguồn
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {uniCards.map(({ rank, uni }) => (
                <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                  <span className="font-bold text-emerald-800 block">
                    {uni.scholarship || 'Chưa có dữ liệu học bổng/học phí được audit'}
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                    {uni.source?.file ? `Nguồn: ${uni.source.file}` : 'Cần xác minh từ tài liệu nguồn'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: Chi phí sinh hoạt ước tính */}
          <div className="p-5 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">
              4. Chi phí sinh hoạt tham khảo theo tháng
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {uniCards.map(({ rank, uni }) => {
                const cost = findCountryCost(uni.country, rawCosts);
                const minMonthly = cost?.livingCost?.min;
                const maxMonthly = cost?.livingCost?.max;
                return (
                  <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                    <span className="text-sm font-bold text-on-surface block">
                      {minMonthly !== null && minMonthly !== undefined && maxMonthly !== null && maxMonthly !== undefined
                        ? `~${minMonthly} - ${maxMonthly} triệu VNĐ/tháng`
                        : 'Chưa có dữ liệu chi phí đã audit'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                      {cost?.source?.file ? `Nguồn: ${cost.source.file}` : 'Cần xác minh từ tài liệu nguồn'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 5: Yêu cầu GPA & Ký túc xá */}
          <div className="p-5 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">
              5. Yêu cầu đầu vào & Tiện ích KTX
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {uniCards.map(({ rank, uni }) => (
                <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                  <span className="font-semibold text-on-surface block">
                    {uni.minGpa !== undefined ? `GPA ≥ ${uni.minGpa.toFixed(1)}/4.0` : 'Chưa có ngưỡng GPA riêng'}
                    {uni.languages ? ` • ${uni.languages}` : ' • Chưa có yêu cầu ngoại ngữ riêng'}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                    {uni.hasDormitory === true ? 'Có dữ liệu KTX' : uni.hasDormitory === false ? 'Không có dữ liệu KTX' : 'Chưa có dữ liệu KTX được audit'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="p-5 bg-surface-container-low/30 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="text-xs text-on-surface-variant hover:text-on-surface font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay lại điều chỉnh phương án môn (Bước 4)</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/print')}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Xuất bản bản dự thảo A4</span>
          </button>
        </div>
      </div>
    </div>
  );
};
