'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStudent } from '../../context/StudentContext';
import { matchCoursesForUniversity } from '../../engine/matcher';
import { simulateStudentProgress } from '../../engine/progressSimulator';
import universitiesData from '../../../data/universities_s27.json';
import equivalencesData from '../../../data/equivalences_s27.json';
import courseOfferingsData from '../../../data/course_offerings_2627.json';
import { PartnerUniversity } from '../../types/university';
import { CourseEquivalence } from '../../types/equivalence';
import { CourseOffering } from '../../types/courseOffering';
import { CourseMatchPair, SelectedStudyPlan } from '../../types/studyPlan';
import { S27_RULES } from '../../config/s27Rules';
import { PreferenceRank } from '../../types/preference';

export const Step4CoursePlan: React.FC = () => {
  const {
    profile,
    selectedUniId,
    setCurrentStep,
    setRankedChoice,
    setCurrentPlan,
    rankedChoices,
    preferredUniversities,
    activePreferenceRank,
    openPlanForPreference,
    setPreferenceReplacementRank
  } = useStudent();

  const rawUnis = universitiesData as PartnerUniversity[];
  const rawEqs = equivalencesData as CourseEquivalence[];
  const rawOfferings = courseOfferingsData as CourseOffering[];

  const university = selectedUniId ? rawUnis.find(u => u.id === selectedUniId) : undefined;

  // Match all candidate pairs for this university
  const candidatePairs = useMemo(() => {
    if (!university) return [];
    const studentRemaining = profile.courses && profile.courses.length > 0
      ? profile.courses.filter(c => !c.isPassed).map(c => ({
        code: c.courseCode,
        name: c.courseName,
        credits: c.credits,
        program: c.program
      }))
      : (profile.manualCourseCodes || []).map(code => ({
        code,
        name: '',
        credits: 0
      }));

    return matchCoursesForUniversity(
      university,
      studentRemaining,
      rawEqs,
      rawOfferings
    );
  }, [university, profile, rawEqs, rawOfferings]);

  const inferredRank = (['nv1', 'nv2', 'nv3'] as const).find(rank => preferredUniversities[rank]?.universityId === selectedUniId);
  const [selectedRank, setSelectedRank] = useState<PreferenceRank>(activePreferenceRank || inferredRank || 'nv1');

  useEffect(() => {
    if (activePreferenceRank) setSelectedRank(activePreferenceRank);
  }, [activePreferenceRank]);

  const savedPlan = rankedChoices[selectedRank]?.universityId === university?.id
    ? rankedChoices[selectedRank]
    : undefined;

  // Selected transferred pairs (minimum 3), restored from the current NV plan when available.
  const [selectedPairs, setSelectedPairs] = useState<CourseMatchPair[]>([]);

  // Additional host courses to ensure >= 5 courses
  const [additionalHostCourses, setAdditionalHostCourses] = useState<
    { hostCourseName: string; hostCourseCode?: string; estimatedCredits?: number; note?: string }[]
  >([]);

  const editorKey = `${selectedRank}:${university?.id || 'none'}:${savedPlan?.savedAt || 'new'}:${candidatePairs.map(pair => `${pair.equivalenceId}:${pair.status}`).join('|')}`;
  const [initializedEditorKey, setInitializedEditorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!university || initializedEditorKey === editorKey) return;
    setSelectedPairs(savedPlan?.transferredCourses || candidatePairs.filter(p => p.status === 'APPROVED').slice(0, S27_RULES.transferredCoursesMinimum));
    setAdditionalHostCourses(savedPlan?.hostAdditionalCourses || []);
    setInitializedEditorKey(editorKey);
  }, [candidatePairs, editorKey, initializedEditorKey, savedPlan, university]);

  const [newHostName, setNewHostName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Toggle selection of a course pair
  const toggleSelectPair = (pair: CourseMatchPair) => {
    const exists = selectedPairs.some(p => p.ftuCourseCode === pair.ftuCourseCode);
    if (exists) {
      setSelectedPairs(prev => prev.filter(p => p.ftuCourseCode !== pair.ftuCourseCode));
    } else {
      setSelectedPairs(prev => [...prev, pair]);
    }
  };

  const handleAddHostCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostName.trim()) return;
    const normalizedName = newHostName.trim().toLocaleLowerCase('vi-VN');
    const alreadySelected = selectedPairs.some(pair => pair.hostCourseName.trim().toLocaleLowerCase('vi-VN') === normalizedName)
      || additionalHostCourses.some(course => course.hostCourseName.trim().toLocaleLowerCase('vi-VN') === normalizedName);
    if (alreadySelected) {
      setSaveSuccessMsg('Môn đối tác này đã có trong kế hoạch. Không thể thêm trùng.');
      return;
    }
    setAdditionalHostCourses(prev => [
      ...prev,
      { hostCourseName: newHostName.trim(), note: 'Chưa xác minh mã và tín chỉ host từ tài liệu nguồn' }
    ]);
    setNewHostName('');
  };

  const handleRemoveHostCourse = (idx: number) => {
    setAdditionalHostCourses(prev => prev.filter((_, i) => i !== idx));
  };

  // Run progress simulation
  const simulation = useMemo(() => {
    return simulateStudentProgress(
      profile.courses,
      selectedPairs,
      rawOfferings,
      profile.targetGraduationSemester,
      profile.hasPassedMidtermInternship,
      []
    );
  }, [profile, selectedPairs, rawOfferings]);

  const totalHostCoursesCount = selectedPairs.length + additionalHostCourses.length;
  const approvedSelectedPairs = selectedPairs.filter(pair => pair.status === 'APPROVED');
  const selectedTransferredCredits = approvedSelectedPairs.reduce((sum, pair) => sum + pair.ftuCredits, 0);
  const satisfies3Transfers = approvedSelectedPairs.length >= S27_RULES.transferredCoursesMinimum;
  const satisfies5HostCourses = totalHostCoursesCount >= S27_RULES.hostCoursesMinimum;
  const additionalCoursesVerified = additionalHostCourses.every(course => Boolean(
    course.hostCourseCode && course.estimatedCredits && course.estimatedCredits > 0
  ));
  const planStatus: SelectedStudyPlan['status'] = !satisfies3Transfers || !satisfies5HostCourses
    ? 'DRAFT_NOT_ELIGIBLE'
    : !additionalCoursesVerified || simulation.thesisEligibilityStatus !== 'VERIFIED'
      ? 'NEEDS_VERIFICATION'
      : 'VALID';
  const missingPlanRequirements = [
    !satisfies3Transfers ? `Cần tối thiểu ${S27_RULES.transferredCoursesMinimum} môn FTU có mapping APPROVED.` : null,
    !satisfies5HostCourses ? `Cần tối thiểu ${S27_RULES.hostCoursesMinimum} học phần tại trường đối tác.` : null,
    !additionalCoursesVerified ? 'Môn host bổ sung cần mã môn và số tín chỉ đã xác minh.' : null,
    simulation.thesisEligibilityStatus !== 'VERIFIED' ? 'Mô phỏng HPTN hiện chỉ mang tính tư vấn và cần xác minh.' : null
  ].filter((reason): reason is string => Boolean(reason));
  const hasUnsavedChanges = JSON.stringify(selectedPairs) !== JSON.stringify(savedPlan?.transferredCourses || [])
    || JSON.stringify(additionalHostCourses) !== JSON.stringify(savedPlan?.hostAdditionalCourses || []);
  const confirmLeaveEditor = () => !hasUnsavedChanges || window.confirm('Bạn có thay đổi chưa lưu. Rời màn hình này sẽ giữ lại bản đã lưu trước đó. Bạn có muốn tiếp tục không?');

  const handleSaveToPreference = () => {
    if (!university) return;
    const plan: SelectedStudyPlan = {
      universityId: university.id,
      universityName: university.name,
      status: planStatus,
      savedAt: new Date().toISOString(),
      sources: [university.source, ...selectedPairs.map(pair => rawEqs.find(eq => eq.id === pair.equivalenceId)?.source).filter(Boolean) as NonNullable<CourseEquivalence['source']>[]],
      transferredCourses: selectedPairs,
      hostAdditionalCourses: additionalHostCourses,
      graduationSimulation: {
        remainingCreditsAfterExchange: simulation.remainingCreditsAfterExchange,
        remainingMandatoryCourses: simulation.courseScheduleAnalysis.map(c => c.courseCode),
        thesisEligible: simulation.thesisEligible,
        hasMidtermInternship: simulation.hasMidtermInternship,
        canGraduateOnTime: simulation.isLikelyOnTime,
        riskWarnings: simulation.warnings
      }
    };

    setRankedChoice(selectedRank, plan);
    setCurrentPlan(plan);
    setSaveSuccessMsg(planStatus === 'VALID'
      ? `Đã lưu phương án vào ${selectedRank.toUpperCase()} thành công.`
      : `Đã lưu ${selectedRank.toUpperCase()} với trạng thái ${planStatus === 'DRAFT_NOT_ELIGIBLE' ? 'chưa đủ điều kiện' : 'cần xác minh'}.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    !university ? (
      <div className="max-w-3xl mx-auto bg-surface-container-lowest rounded-3xl p-8 text-center border border-surface-container shadow-sm">
        <h1 className="text-xl font-bold text-on-surface">Chưa chọn trường đối tác</h1>
        <p className="text-sm text-on-surface-variant mt-2">Hãy chọn một trường từ danh sách đối tác trước khi xây dựng kế hoạch môn học.</p>
        <button type="button" onClick={() => setCurrentStep(3)} className="mt-5 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-bold">Quay lại danh sách trường</button>
      </div>
    ) : (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in py-2">
      {/* 1. Clean Partner Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container p-2 flex items-center justify-center shrink-0 border border-surface-container">
            <img
              alt={university.name}
              className="w-full h-full object-contain"
              src={
                university.logoUrl || '/images/logo.png'
              }
            />
          </div>
          <div>
            <p className="text-[11px] font-bold text-primary mb-1">Gợi ý trường → {selectedRank.toUpperCase()} → Lập phương án môn học</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {university.region} • {university.flag || '🌏'}
              </span>
              <span className="text-xs text-on-surface-variant">
                {university.city ? `${university.city}, ` : ''}{university.country}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
              Đang lập phương án {selectedRank.toUpperCase()}: {university.name}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!confirmLeaveEditor()) return;
            setPreferenceReplacementRank(selectedRank);
            setCurrentStep(3);
          }}
          className="text-xs text-primary font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">sync_alt</span>
          <span>Chọn trường khác</span>
        </button>
      </div>

      {/* 2. S27 Compliance Checklist Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${satisfies3Transfers
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
          <span className={`material-symbols-outlined text-lg ${satisfies3Transfers ? 'text-emerald-600' : 'text-amber-600'}`}>
            {satisfies3Transfers ? 'check_circle' : 'warning'}
          </span>
          <div>
            <span className="font-bold block">Quy đổi FTU: {approvedSelectedPairs.length}/{S27_RULES.transferredCoursesMinimum} môn đã duyệt</span>
            <span className="text-[11px] opacity-80">{selectedTransferredCredits} tín chỉ đã được công nhận</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${satisfies5HostCourses
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
          <span className={`material-symbols-outlined text-lg ${satisfies5HostCourses ? 'text-emerald-600' : 'text-amber-600'}`}>
            {satisfies5HostCourses ? 'check_circle' : 'warning'}
          </span>
          <div>
            <span className="font-bold block">Học tại đối tác: {totalHostCoursesCount}/{S27_RULES.hostCoursesMinimum} môn</span>
            <span className="text-[11px] opacity-80">{selectedPairs.length} môn đổi + {additionalHostCourses.length} môn tự do</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-surface-container bg-surface-container-low flex items-center gap-2.5 text-on-surface">
          <span className="material-symbols-outlined text-lg text-secondary">
            timeline
          </span>
          <div>
            <span className="font-bold block">Tiến độ tốt nghiệp</span>
            <span className="text-[11px] text-on-surface-variant">
              {simulation.isLikelyOnTime ? 'Có khả năng đúng hạn theo mô phỏng' : 'Cần đăng ký bù / xác minh'}
            </span>
          </div>
        </div>
      </div>

      {missingPlanRequirements.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="text-xs font-extrabold">Phương án hiện chưa hoàn tất theo dữ liệu đang có</p>
          <ul className="mt-1 space-y-1 text-[11px] list-disc list-inside">
            {missingPlanRequirements.map(reason => <li key={reason}>{reason}</li>)}
          </ul>
          <p className="mt-2 text-[11px]">Bạn vẫn có thể lưu bản nháp để tiếp tục xác minh sau.</p>
        </div>
      )}

      {/* 3. Bilateral Course Mapping Section with 3D Scales */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-sm border border-surface-container/80 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xs shrink-0 border border-primary/20">
              <img
                src="/images/3d_scales.jpg"
                alt="3D Course Scales"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Phương án đối ứng môn học (FTU ⟷ Đối tác)</h2>
              <p className="text-xs text-on-surface-variant">Tích chọn các môn bạn muốn đưa vào bản kế hoạch dự thảo để xin phê duyệt.</p>
            </div>
          </div>
          <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">
            Đã chọn {selectedPairs.length} cặp môn
          </span>
        </div>

        {candidatePairs.length === 0 ? (
          <div className="text-center py-8 text-xs text-on-surface-variant">
            Chưa tìm thấy môn học tương đương tự động. Bạn có thể tra cứu mã môn đối tác trong cẩm nang S27.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {candidatePairs.map((pair) => {
              const isSelected = selectedPairs.some(p => p.ftuCourseCode === pair.ftuCourseCode);
              const pairStatusLabel = pair.status === 'APPROVED'
                ? pair.approvalYear ? `Đã phê duyệt (${pair.approvalYear})` : 'Đã phê duyệt theo dữ liệu nguồn'
                : pair.status === 'PENDING'
                  ? 'Đang chờ phê duyệt'
                  : 'Chưa đủ cơ sở xác minh';
              const pairStatusClass = pair.status === 'APPROVED' ? 'text-emerald-700' : pair.status === 'PENDING' ? 'text-amber-700' : 'text-rose-700';

              return (
                <div
                  key={pair.ftuCourseCode}
                  onClick={() => toggleSelectPair(pair)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isSelected
                      ? 'bg-primary/5 border-primary/40 shadow-xs'
                      : 'bg-surface-container-low/50 border-surface-container hover:bg-surface-container-low'
                    }`}
                >
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => {
                        event.stopPropagation();
                        toggleSelectPair(pair);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="rounded text-primary focus:ring-primary h-4 w-4 shrink-0"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{pair.ftuCourseCode}</span>
                        <span className="text-xs font-bold text-on-surface">{pair.ftuCourseName}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant">
                        Môn FTU • {pair.ftuCredits} tín chỉ
                      </span>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-on-surface-variant text-base hidden md:block">
                    sync_alt
                  </span>

                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    <div className="flex flex-col text-left md:text-right">
                      <div className="flex items-center md:justify-end gap-1.5">
                        <span className="text-xs font-semibold text-on-surface">{pair.hostCourseName}</span>
                        {pair.hostCourseCode && (
                          <span className="font-mono text-[11px] text-on-surface-variant">({pair.hostCourseCode})</span>
                        )}
                      </div>
                      <span className={`text-[11px] ${pairStatusClass} font-medium`}>
                        {pair.status === 'APPROVED' ? '✓' : '•'} {pairStatusLabel} • {pair.hostCredits !== undefined ? `${pair.hostCredits} Credits` : 'Chưa có tín chỉ host'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Additional Host Courses (To satisfy >= 5 courses rule) */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container/80 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div>
            <h2 className="text-base font-bold text-on-surface">Môn học tự do tại trường đối tác</h2>
            <p className="text-xs text-on-surface-variant">
              Theo tài liệu S27, sinh viên cần đăng ký tối thiểu <strong>5 học phần</strong> tại trường đối tác; các học phần chưa có mapping phải được người dùng bổ sung và xác minh riêng.
            </p>
          </div>
          <span className="text-xs font-bold text-secondary">
            {additionalHostCourses.length} môn thêm
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {additionalHostCourses.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary">menu_book</span>
                <span className="font-semibold text-on-surface">{c.hostCourseName}</span>
                {c.hostCourseCode && <span className="font-mono text-on-surface-variant">({c.hostCourseCode})</span>}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveHostCourse(idx)}
                className="text-on-surface-variant hover:text-rose-600 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ))}
        </div>

        {/* Add Host Course Form */}
        <form onSubmit={handleAddHostCourse} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newHostName}
            onChange={(e) => setNewHostName(e.target.value)}
            placeholder="Nhập tên môn tiếng Anh tại trường đối tác (VD: Korean Language & Culture)..."
            className="flex-1 px-3.5 py-2 rounded-full bg-surface-container-low border border-surface-container text-xs focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all shrink-0"
          >
            + Thêm môn
          </button>
        </form>
      </div>

      {/* 5. Floating / Sticky Wishlist Assignment & Next Step */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-surface-container/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface">Lưu vào nguyện vọng:</span>
          <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-full">
            {(['nv1', 'nv2', 'nv3'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  if (!preferredUniversities[r] || r === selectedRank || !confirmLeaveEditor()) return;
                  openPlanForPreference(r);
                }}
                disabled={!preferredUniversities[r]}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selectedRank === r
                    ? 'bg-primary text-white shadow-xs'
                    : preferredUniversities[r] ? 'text-on-surface-variant hover:text-on-surface' : 'text-on-surface-variant/40 cursor-not-allowed'
                  }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveToPreference}
            className="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-xs font-bold text-on-surface border border-surface-container transition-colors"
          >
            Lưu bản nháp
          </button>
        </div>

        {saveSuccessMsg && (
          <span className="text-xs font-bold text-emerald-700 animate-fade-in">
            {saveSuccessMsg}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            handleSaveToPreference();
            setCurrentStep(5);
          }}
          className="w-full sm:w-auto px-7 py-3 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
        >
          <span>Lưu & xem so sánh</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
    )
  );
};
