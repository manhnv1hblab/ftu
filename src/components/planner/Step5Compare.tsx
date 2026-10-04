'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudent } from '../../context/StudentContext';
import universitiesData from '../../../data/universities_s27.json';
import equivalencesData from '../../../data/equivalences_s27.json';
import courseOfferingsData from '../../../data/course_offerings_2627.json';
import { PartnerUniversity } from '../../types/university';
import { PreferenceRank } from '../../types/preference';
import { CourseEquivalence } from '../../types/equivalence';
import { CourseOffering } from '../../types/courseOffering';
import { CourseMatchPair } from '../../types/studyPlan';
import { S27_RULES } from '../../config/s27Rules';
import { UniversityMoreInfo, universityLivingCost } from './UniversityInfo';
import { matchCoursesForUniversity } from '../../engine/matcher';
import { isAvailableForTransfer } from '../../engine/transferEligibility';

const ranks: PreferenceRank[] = ['nv1', 'nv2', 'nv3'];
type ComparisonPlan = ReturnType<typeof useStudent>['rankedChoices']['nv1'];
type ComparisonSlotData = { plan?: ComparisonPlan; previewPairs: CourseMatchPair[] };

export const Step5Compare: React.FC = () => {
  const router = useRouter();
  const {
    profile,
    rankedChoices,
    preferredUniversities,
    setCurrentStep,
    setPreferenceReplacementRank,
    openPlanForPreference,
    removePreferredUniversity
  } = useStudent();

  const rawUnis = universitiesData as PartnerUniversity[];
  const rawEqs = equivalencesData as CourseEquivalence[];
  const rawOfferings = courseOfferingsData as CourseOffering[];
  const [notification, setNotification] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PreferenceRank | null>(null);

  // A selected university can be compared before its detailed plan is saved.
  // Keep the same matching input as Step 4 so the comparison table can show a
  // transparent preview instead of an empty cell for that selected slot.
  const previewPairsByUniversity = useMemo(() => {
    const profileProgram = profile.programType || profile.program;
    const studentRemaining = profile.courses.length > 0
      ? profile.courses.filter(isAvailableForTransfer).map(course => ({
        code: course.courseCode,
        name: course.courseName,
        credits: course.credits,
        program: course.program || profileProgram,
        cohort: profile.cohort,
        programMappingSource: course.program ? undefined : profile.programMappingSource
      }))
      : (profile.manualCourseCodes || []).map(code => ({
        code,
        name: '',
        credits: 0,
        program: profileProgram,
        cohort: profile.cohort,
        programMappingSource: profile.programMappingSource
      }));

    const selectedIds = new Set(Object.values(preferredUniversities).filter(Boolean).map(preference => preference!.universityId));
    return new Map(rawUnis.filter(university => selectedIds.has(university.id)).map(university => [
      university.id,
      matchCoursesForUniversity(university, studentRemaining, rawEqs, rawOfferings)
    ]));
  }, [preferredUniversities, profile, rawEqs, rawOfferings, rawUnis]);

  const slots = useMemo(() => ranks.map(rank => {
    const preference = preferredUniversities[rank];
    const plan = rankedChoices[rank];
    const uni = preference ? rawUnis.find(item => item.id === preference.universityId) : undefined;
    const previewPairs = preference ? (previewPairsByUniversity.get(preference.universityId) || []) : [];
    return { rank, preference, plan, uni, previewPairs };
  }), [preferredUniversities, rankedChoices, previewPairsByUniversity, rawUnis]);

  const selectedCount = slots.filter(slot => slot.preference).length;
  const draftedCount = slots.filter(slot => slot.plan?.transferredCourses?.length).length;
  const readyCount = slots.filter(slot => slot.plan?.status === 'VALID').length;
  const getComparisonPairs = (slot: ComparisonSlotData): CourseMatchPair[] => {
    const savedPairs = slot.plan?.transferredCourses;
    return savedPairs?.length ? savedPairs : slot.previewPairs;
  };
  const isPreviewOnly = (slot: ComparisonSlotData) => !slot.plan?.transferredCourses?.length && slot.previewPairs.length > 0;

  const showNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3500);
  };

  const openPlan = (rank: PreferenceRank) => {
    if (!openPlanForPreference(rank)) showNotification('Slot này chưa có trường được chọn.');
  };

  const renderSlotStatus = (rank: PreferenceRank) => {
    const slot = slots.find(item => item.rank === rank);
    if (!slot?.preference) return 'Chưa chọn trường';
    if (!slot.plan?.transferredCourses?.length) return slot.plan?.status ? 'Đã lưu bản nháp / chưa đủ điều kiện' : 'Chưa lập phương án';
    if (slot.plan.status === 'VALID') return 'Đã đủ dữ liệu theo rule hiện tại';
    if (slot.plan.status === 'DRAFT_NOT_ELIGIBLE') return 'Bản nháp chưa đủ điều kiện';
    return 'Đã lưu bản nháp / cần xác minh';
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in py-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-container/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-primary/20">
            <img src="/images/3d_scholarship.jpg" alt="Minh họa so sánh nguyện vọng" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              <span>Bước 5: So sánh & xuất bản nháp</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">So sánh nguyện vọng</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Các trường chưa lập phương án vẫn được giữ lại ở trạng thái chờ xử lý.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <span className="px-3 py-2 rounded-full bg-surface-container-low text-xs font-bold text-on-surface">Đã chọn {selectedCount}/3</span>
          <span className="px-3 py-2 rounded-full bg-surface-container-low text-xs font-bold text-on-surface">Đã lập {draftedCount}/3</span>
          <span className="px-3 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">Đủ dữ liệu {readyCount}/3</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => router.push('/print')} className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">print</span>
          Xuất bản nháp A4
        </button>
      </div>

      {notification && <div role="status" className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center shadow-sm">{notification}</div>}

      {pendingRemoval && (
        <div role="dialog" aria-modal="true" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
          <p className="text-sm font-bold">Bỏ {pendingRemoval.toUpperCase()} khỏi danh sách?</p>
          <p className="text-xs mt-1">Phương án của nguyện vọng này cũng sẽ không còn xuất hiện trong bảng so sánh.</p>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => setPendingRemoval(null)} className="px-3 py-1.5 rounded-full bg-white border border-rose-200 text-xs font-semibold">Hủy</button>
            <button type="button" onClick={() => { removePreferredUniversity(pendingRemoval); setPendingRemoval(null); }} className="px-3 py-1.5 rounded-full bg-rose-700 text-white text-xs font-bold">Bỏ chọn</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map(({ rank, preference, plan, uni }) => {
          const campusImage = uni?.imageSourceType === 'official-campus-image' || uni?.imageSourceType === 'internet-campus-image';
          return (
            <article key={rank} className={`rounded-3xl border p-4 shadow-sm ${preference ? 'bg-surface-container-lowest border-surface-container/80' : 'bg-surface-container-low/50 border-dashed border-surface-container'}`}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-black">{rank.toUpperCase()}</span>
                <span className={`text-[10px] font-bold ${preference ? 'text-primary' : 'text-on-surface-variant'}`}>{renderSlotStatus(rank)}</span>
              </div>
              {uni && preference ? (
                <>
                  <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-surface-container-low mt-3">
                    <img src={uni.imageUrl || '/images/logo.png'} alt={uni.name} className={`w-full h-full ${campusImage ? 'object-cover' : 'object-contain bg-white p-8'}`} />
                  </div>
                  <h2 className="text-sm font-bold text-on-surface mt-3 line-clamp-2 min-h-10">{uni.name}</h2>
                  <p className="text-xs text-on-surface-variant mt-1">{uni.city ? `${uni.city}, ` : ''}{uni.country}</p>
                </>
              ) : (
                <div className="min-h-40 flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">school</span>
                  <p className="text-sm font-bold text-on-surface mt-2">Chưa chọn trường</p>
                  <p className="text-xs text-on-surface-variant mt-1">Quay lại Step 3 để thêm trường vào {rank.toUpperCase()}.</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {!preference ? (
                  <button type="button" onClick={() => setCurrentStep(3)} className="px-3 py-2 rounded-full bg-primary text-white text-xs font-bold">Chọn trường</button>
                ) : !plan?.transferredCourses?.length ? (
                  <button type="button" onClick={() => openPlan(rank)} className="px-3 py-2 rounded-full bg-primary text-white text-xs font-bold">{plan?.status ? 'Tiếp tục lập phương án' : `Lập phương án ${rank.toUpperCase()}`}</button>
                ) : (
                  <button type="button" onClick={() => openPlan(rank)} className="px-3 py-2 rounded-full bg-primary text-white text-xs font-bold">Chỉnh sửa phương án</button>
                )}
                {preference && <>
                  <button type="button" onClick={() => { setPreferenceReplacementRank(rank); setCurrentStep(3); }} className="px-3 py-2 rounded-full bg-surface-container text-on-surface text-xs font-semibold">Đổi trường</button>
                  <button type="button" onClick={() => setPendingRemoval(rank)} className="px-3 py-2 rounded-full text-rose-700 hover:bg-rose-50 text-xs font-semibold">Bỏ chọn</button>
                </>}
              </div>
            </article>
          );
        })}
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container/80 overflow-hidden">
        <div className="p-5 border-b border-surface-container">
          <h2 className="text-sm font-extrabold text-on-surface">So sánh theo dữ liệu đã có</h2>
          <p className="text-xs text-on-surface-variant mt-1">Ô chưa có kế hoạch hoặc chưa có dữ liệu sẽ hiển thị “—”, không suy diễn thành kết quả đạt.</p>
        </div>

        <div className="divide-y divide-surface-container text-xs">
          <ComparisonRow title="1. Quy đổi về FTU" slots={slots} render={(slot) => {
            const pairs = getComparisonPairs(slot);
            if (!slot.preference) return '—';
            if (!pairs.length) return <span className="text-on-surface-variant">Chưa có dữ liệu quy đổi cho trường này</span>;
            const approved = pairs.filter(course => course.status === 'APPROVED');
            const verified = approved.filter(course => course.verificationStatus === 'VERIFIED');
            const credits = approved.reduce((sum, course) => sum + course.ftuCredits, 0);
            return <>{isPreviewOnly(slot) && <span className="text-sky-700">Gợi ý tự động · chưa lưu phương án</span>}<strong>{approved.length} môn · {credits} tín chỉ FTU</strong><span className={approved.length >= S27_RULES.transferredCoursesMinimum ? 'text-emerald-700' : 'text-amber-700'}>{approved.length >= S27_RULES.transferredCoursesMinimum ? `Đạt ngưỡng ${S27_RULES.transferredCoursesMinimum} môn đã duyệt` : `Chưa đủ ${S27_RULES.transferredCoursesMinimum} môn đã duyệt`}</span>{verified.length < approved.length && <span className="text-amber-700">Đã xác minh: {verified.length} môn · cần đối chiếu thêm</span>}</>;
          }} />
          <ComparisonRow title="2. Học phần tại trường đối tác" slots={slots} render={(slot) => {
            if (!slot.preference) return '—';
            const pairs = getComparisonPairs(slot);
            const count = pairs.length + (slot.plan?.hostAdditionalCourses?.length || 0);
            if (!count) return <span className="text-on-surface-variant">Chưa có dữ liệu học phần</span>;
            return <>{isPreviewOnly(slot) && <span className="text-sky-700">Theo matching hiện tại · chưa lưu phương án</span>}<strong>{count} môn</strong><span className={count >= S27_RULES.hostCoursesMinimum ? 'text-emerald-700' : 'text-amber-700'}>{count >= S27_RULES.hostCoursesMinimum ? `Đạt ngưỡng ${S27_RULES.hostCoursesMinimum} môn` : `Chưa đủ ${S27_RULES.hostCoursesMinimum} môn`}</span></>;
          }} />
          <ComparisonRow title="Địa điểm" slots={slots} render={slot => slot.uni ? [slot.uni.city, slot.uni.country].filter(Boolean).join(', ') : '—'} />
          <ComparisonRow title="Chỉ tiêu" slots={slots} render={slot => slot.uni ? slot.uni.quota || 'Chưa có thông tin' : '—'} />
          <ComparisonRow title="Ngôn ngữ giảng dạy" slots={slots} render={slot => slot.uni ? slot.uni.languages || 'Chưa có thông tin' : '—'} />
          <ComparisonRow title="Yêu cầu đầu vào" slots={slots} render={slot => slot.uni ? slot.uni.requirements || 'Chưa có thông tin' : '—'} />
          <ComparisonRow title="3. Học phí / học bổng" slots={slots} render={(slot) => slot.uni?.scholarship || 'Chưa có thông tin'} />
          <ComparisonRow title="4. Chi phí sinh hoạt tham khảo" slots={slots} render={(slot) => {
            if (!slot.uni) return '—';
            return universityLivingCost(slot.uni);
          }} />
          <ComparisonRow title="Thông tin chi tiết và nguồn" slots={slots} render={slot => slot.uni ? <UniversityMoreInfo university={slot.uni} /> : '—'} />
          <ComparisonRow title="5. Tiến độ tốt nghiệp / HPTN" slots={slots} render={(slot) => {
            if (!slot.preference) return '—';
            if (!slot.plan?.graduationSimulation) return <span className="text-on-surface-variant">Chưa lập phương án để mô phỏng</span>;
            return <><span>{slot.plan.graduationSimulation.canGraduateOnTime ? 'Có khả năng đúng hạn theo mô phỏng' : 'Có rủi ro cần xử lý'}</span><span className="text-amber-700">{slot.plan.status === 'VALID' ? 'Đã đủ dữ liệu theo rule hiện tại' : 'Cần xác minh'}</span></>;
          }} />
          <ComparisonRow title="6. Nguồn và rủi ro" slots={slots} render={(slot) => {
            if (!slot.preference) return '—';
            if (!slot.plan) return <span className="text-on-surface-variant">Chưa lập phương án; đang hiển thị dữ liệu matching</span>;
            const warnings = slot.plan.graduationSimulation?.riskWarnings || [];
            return <><span>{warnings.length ? `${warnings.length} cảnh báo mô phỏng` : 'Chưa ghi nhận cảnh báo mô phỏng'}</span><span className="text-on-surface-variant">{slot.plan.sources?.[0]?.file || 'Chưa có nguồn'}</span></>;
          }} />
        </div>

        <div className="p-5 bg-surface-container-low/30 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <button type="button" onClick={() => setCurrentStep(3)} className="text-xs text-on-surface-variant hover:text-on-surface font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Quay lại gợi ý trường
          </button>
          <button type="button" onClick={() => router.push('/print')} className="w-full sm:w-auto px-7 py-3 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">print</span>
            Xuất bản nháp A4
          </button>
        </div>
      </div>
    </div>
  );
};

function ComparisonRow({ title, slots, render }: {
  title: string;
  slots: Array<{ rank: PreferenceRank; preference?: { universityId: string; universityName: string }; plan?: ComparisonPlan; uni?: PartnerUniversity; previewPairs: CourseMatchPair[] }>;
  render: (slot: { rank: PreferenceRank; preference?: { universityId: string; universityName: string }; plan?: ComparisonPlan; uni?: PartnerUniversity; previewPairs: CourseMatchPair[] }) => React.ReactNode;
}) {
  return (
    <div className="p-5 flex flex-col gap-2">
      <span className="font-bold text-on-surface text-xs uppercase tracking-wider text-primary">{title}</span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {slots.map(slot => <div key={slot.rank} className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container/60 min-h-16 flex flex-col gap-1"><span className="text-[10px] font-black text-primary">{slot.rank.toUpperCase()}</span>{render(slot)}</div>)}
      </div>
    </div>
  );
}
