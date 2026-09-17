'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudent } from '../../context/StudentContext';
import costsData from '../../../data/costs_by_country.json';
import universitiesData from '../../../data/universities_s27.json';
import { CountryCost } from '../../types/cost';
import { PartnerUniversity } from '../../types/university';

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
        alert('File JSON không hợp lệ hoặc sai cấu trúc.');
      }
    };
    reader.readAsText(file);
  };

  // Ensure default sample assignments for NV1, NV2, NV3 if empty
  const defaultUni1 = rawUnis.find(u => u.id === 'chung-ang-university') || rawUnis[0];
  const defaultUni2 = rawUnis.find(u => u.id === 'audencia-business-school') || rawUnis[1] || rawUnis[0];
  const defaultUni3 = rawUnis.find(u => u.id === 'oita-university') || rawUnis[2] || rawUnis[0];

  const plan1 = rankedChoices.nv1;
  const uni1 = plan1 ? (rawUnis.find(u => u.id === plan1.universityId) || defaultUni1) : defaultUni1;

  const plan2 = rankedChoices.nv2;
  const uni2 = plan2 ? (rawUnis.find(u => u.id === plan2.universityId) || defaultUni2) : defaultUni2;

  const plan3 = rankedChoices.nv3;
  const uni3 = plan3 ? (rawUnis.find(u => u.id === plan3.universityId) || defaultUni3) : defaultUni3;

  const uniCards = [
    { rank: 'nv1' as const, label: 'Nguyện vọng 1', uni: uni1, plan: plan1, badge: 'Ưu tiên cao nhất' },
    { rank: 'nv2' as const, label: 'Nguyện vọng 2', uni: uni2, plan: plan2, badge: 'Đề xuất cân bằng' },
    { rank: 'nv3' as const, label: 'Nguyện vọng 3', uni: uni3, plan: plan3, badge: 'Dự phòng tối ưu' }
  ];

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
              Đối chiếu toàn diện tín chỉ, học bổng 100% và bảo đảm tiến độ tốt nghiệp chuẩn K62.
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

      {/* 2. Clean Comparison Table Card */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container/80 overflow-hidden">
        {/* Table Header: 3 Universities */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-container border-b border-surface-container bg-surface-container-low/40">
          {uniCards.map(({ rank, label, uni, badge }) => (
            <div key={rank} className="p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-surface-container-low mb-3 shadow-xs">
                  <img
                    src={uni.imageUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80'}
                    alt={uni.name}
                    className="w-full h-full object-cover"
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
                const count = plan?.transferredCourses?.length || 4;
                const cr = count * 3;
                return (
                  <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                    <span className="text-sm font-black text-on-surface block">
                      {count} môn ({cr} tín chỉ FTU)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
                      ✓ Đạt quy tắc S27 (≥ 3 môn chuyển giao)
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
                const count = (plan?.transferredCourses?.length || 4) + (plan?.hostAdditionalCourses?.length || 2);
                return (
                  <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                    <span className="text-sm font-black text-on-surface block">
                      {count} môn học quốc tế
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
                      ✓ Đạt quy định tối thiểu ≥ 5 môn
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 3: Học phí & Học bổng */}
          <div className="p-5 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">
              3. Chính sách học phí
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {uniCards.map(({ rank }) => (
                <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                  <span className="font-bold text-emerald-800 block">
                    Miễn 100% học phí đối tác
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                    Đóng học phí tín chỉ FTU theo khung hiện hành
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: Chi phí sinh hoạt ước tính */}
          <div className="p-5 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">
              4. Ước tính sinh hoạt phí / kỳ học (5 tháng)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {uniCards.map(({ rank, uni }) => {
                const cost = rawCosts[uni.country];
                const minMonthly = cost?.livingCost?.min ? cost.livingCost.min / 1_000_000 : 15;
                const maxMonthly = cost?.livingCost?.max ? cost.livingCost.max / 1_000_000 : 22;
                const totalMin = Math.round(minMonthly * 5);
                const totalMax = Math.round(maxMonthly * 5);
                return (
                  <div key={rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60">
                    <span className="text-sm font-bold text-on-surface block">
                      ~{totalMin} - {totalMax} triệu VNĐ
                    </span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                      Ăn ở, bảo hiểm, visa & đi lại
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
                    GPA ≥ {(uni.minGpa || 2.8).toFixed(1)}/4.0 • {uni.minIelts ? `IELTS ≥ ${uni.minIelts}` : (uni.languages || 'IELTS ≥ 6.0')}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                    {uni.hasDormitory ? '✓ Có KTX sinh viên quốc tế' : 'Hỗ trợ thuê ngoài'}
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
            <span>Xuất bản kế hoạch học tập A4 (Trình QLĐT)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
