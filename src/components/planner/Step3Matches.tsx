'use client';

import React, { useState, useMemo } from 'react';
import { useStudent } from '../../context/StudentContext';
import { evaluateAllUniversities } from '../../engine/matcher';
import universitiesData from '../../../data/universities_s27.json';
import equivalencesData from '../../../data/equivalences_s27.json';
import costsData from '../../../data/costs_by_country.json';
import courseOfferingsData from '../../../data/course_offerings_2627.json';
import { PartnerUniversity } from '../../types/university';
import { CourseEquivalence } from '../../types/equivalence';
import { CountryCost } from '../../types/cost';
import { CourseOffering } from '../../types/courseOffering';
import { S27_RULES } from '../../config/s27Rules';
import { PreferenceRank } from '../../types/preference';

export const Step3Matches: React.FC = () => {
  const {
    profile,
    setCurrentStep,
    rankedChoices,
    preferredUniversities,
    preferenceReplacementRank,
    setPreferenceReplacementRank,
    selectPreferredUniversity,
    replacePreferredUniversity,
    removePreferredUniversity,
    reorderPreferredUniversities,
    openPlanForPreference
  } = useStudent();

  // Show auditable candidates first. Users can enable the strict S27 eligibility filter
  // after completing the profile fields in Step 2.
  const [min3Only, setMin3Only] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [replacementRank, setReplacementRank] = useState<PreferenceRank | null>(preferenceReplacementRank);
  const [pendingRemoval, setPendingRemoval] = useState<PreferenceRank | null>(null);

  React.useEffect(() => {
    setReplacementRank(preferenceReplacementRank);
  }, [preferenceReplacementRank]);

  const rawUnis = universitiesData as PartnerUniversity[];
  const rawEqs = equivalencesData as CourseEquivalence[];
  const rawCosts = costsData as Record<string, CountryCost>;
  const rawOfferings = courseOfferingsData as CourseOffering[];

  // Run matching engine
  const evaluatedResults = useMemo(() => {
    return evaluateAllUniversities(
      rawUnis,
      profile,
      rawEqs,
      rawCosts,
      rawOfferings
    );
  }, [rawUnis, profile, rawEqs, rawCosts, rawOfferings]);

  // Filter results
  const filteredResults = useMemo(() => {
    return evaluatedResults.filter((res) => {
      // This filter is only about the audited equivalence threshold. It must not
      // silently apply the complete profile, budget, and verification gates.
      if (min3Only && res.approvedPairsCount < S27_RULES.transferredCoursesMinimum) return false;

      // Keep the stricter, end-to-end gate explicit and separate from the
      // course-equivalence threshold above.
      if (verifiedOnly && !res.meetsEligibility) return false;

      // Region filter
      if (selectedRegion !== 'ALL') {
        const uniRegion = res.university.region;
        const country = res.university.country;
        if (selectedRegion === 'EAST_ASIA') {
          if (!['Hàn Quốc', 'Nhật Bản', 'Đài Loan', 'Trung Quốc'].includes(country) && uniRegion !== 'Asia') return false;
        } else if (selectedRegion === 'EUROPE') {
          if (uniRegion !== 'Europe') return false;
        } else if (selectedRegion === 'SEA') {
          if (!['Thái Lan', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines'].includes(country)) return false;
        } else if (selectedRegion === 'AMERICAS') {
          if (uniRegion !== 'America' && !['Hoa Kỳ', 'Canada'].includes(country)) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = res.university.name.toLowerCase().includes(q);
        const mCountry = res.university.country.toLowerCase().includes(q);
        const mCity = (res.university.city || '').toLowerCase().includes(q);
        if (!mName && !mCountry && !mCity) return false;
      }

      return true;
    });
  }, [evaluatedResults, min3Only, verifiedOnly, selectedRegion, searchQuery]);

  const preferenceRanks: PreferenceRank[] = ['nv1', 'nv2', 'nv3'];
  const selectedCount = preferenceRanks.filter(rank => Boolean(preferredUniversities[rank])).length;
  const draftedCount = preferenceRanks.filter(rank => Boolean(rankedChoices[rank]?.transferredCourses?.length)).length;
  const readyCount = preferenceRanks.filter(rank => rankedChoices[rank]?.status === 'VALID').length;

  const selectedRankForUniversity = (uniId: string): PreferenceRank | null => (
    preferenceRanks.find(rank => preferredUniversities[rank]?.universityId === uniId) || null
  );

  const nextAvailableRank = (): PreferenceRank | null => (
    preferenceRanks.find(rank => !preferredUniversities[rank]) || null
  );

  const notify = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3500);
  };

  const chooseUniversity = (uniId: string, uniName: string) => {
    const existingRank = selectedRankForUniversity(uniId);
    const targetRank = replacementRank || existingRank || nextAvailableRank();
    if (!targetRank) {
      notify('Bạn đã chọn đủ 3 trường. Hãy đổi hoặc bỏ một trường trước khi chọn thêm.');
      return;
    }

    const university = {
      universityId: uniId,
      universityName: uniName,
      selectedAt: new Date().toISOString()
    };
    const success = replacementRank
      ? replacePreferredUniversity(targetRank, university)
      : selectPreferredUniversity(targetRank, university);
    if (!success) {
      notify('Trường này đã có trong danh sách NV1–NV3.');
      return;
    }
    setReplacementRank(null);
    setPreferenceReplacementRank(null);
    notify(`${uniName} đã được chọn vào ${targetRank.toUpperCase()}.`);
  };

  const handleOpenPlan = (rank: PreferenceRank) => {
    if (!openPlanForPreference(rank)) notify('Hãy chọn trường vào nguyện vọng trước.');
  };

  const handleQuickPlan = (uniId: string, uniName: string) => {
    const existingRank = selectedRankForUniversity(uniId);
    if (existingRank) {
      handleOpenPlan(existingRank);
      return;
    }
    const rank = nextAvailableRank();
    if (!rank) {
      notify('Bạn đã chọn đủ 3 trường. Hãy lập phương án từ khay NV1–NV3.');
      return;
    }
    const success = selectPreferredUniversity(rank, {
      universityId: uniId,
      universityName: uniName,
      selectedAt: new Date().toISOString()
    });
    if (success) setCurrentStep(4);
  };

  const approvedThresholdCount = evaluatedResults.filter(
    r => r.approvedPairsCount >= S27_RULES.transferredCoursesMinimum
  ).length;
  const qualifiedCount = evaluatedResults.filter(r => r.meetsEligibility).length;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in py-2">
      {/* 1. Header & Summary Info with 3D Globe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-container/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-primary/20 animate-float">
            <img
              src="/images/3d_globe.jpg"
              alt="3D International Globe"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">handshake</span>
              <span>Mạng lưới {rawUnis.length} đối tác kỳ S27</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              Gợi ý trường đối tác theo độ khớp môn học
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Hệ thống đối soát syllabus với các trường đối tác và xếp hạng theo khả năng quy đổi tín chỉ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 self-start sm:self-auto shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
          <span>{approvedThresholdCount} trường có ≥{S27_RULES.transferredCoursesMinimum} môn đã duyệt · {qualifiedCount} trường đã xác minh đầy đủ</span>
        </div>
      </div>

      {notification && (
        <div role="status" className="p-3 rounded-2xl bg-amber-600 text-white text-xs font-bold text-center shadow-sm">
          {notification}
        </div>
      )}

      <section className="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-sm border border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-on-surface">Danh sách nguyện vọng</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Chọn trường theo thứ tự ưu tiên. Bạn sẽ lập phương án môn học riêng cho từng trường.</p>
          </div>
          <span className="text-xs font-bold text-primary">Đã chọn {selectedCount}/3 · Đã lập {draftedCount}/3 · Đủ dữ liệu {readyCount}/3</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {preferenceRanks.map((rank, index) => {
            const preference = preferredUniversities[rank];
            const plan = rankedChoices[rank];
            const planStatus = !preference
              ? 'Chưa chọn trường'
                : plan?.status === 'VALID'
                  ? 'Đã đủ dữ liệu theo rule hiện tại'
                : plan?.status
                  ? 'Đã lưu bản nháp / cần xác minh'
                  : 'Chưa lập phương án';
            return (
              <div key={rank} className={`rounded-2xl border p-3 ${preference ? 'border-primary/30 bg-primary/5' : 'border-surface-container bg-surface-container-low/40'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-primary">{rank.toUpperCase()}</span>
                  {preference && <span className="text-[10px] font-bold text-on-surface-variant">{planStatus}</span>}
                </div>
                <p className="text-xs font-bold text-on-surface mt-2 line-clamp-2 min-h-8">{preference?.universityName || 'Chưa chọn trường'}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {preference ? (
                    <>
                      <button type="button" onClick={() => handleOpenPlan(rank)} className="px-2.5 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold">{plan?.transferredCourses?.length ? 'Chỉnh sửa phương án' : 'Lập phương án'}</button>
                      <button type="button" onClick={() => { setReplacementRank(rank); setPreferenceReplacementRank(rank); }} className="px-2.5 py-1.5 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold">Đổi trường</button>
                      {index > 0 && preferredUniversities[preferenceRanks[index - 1]] && <button type="button" onClick={() => reorderPreferredUniversities(rank, preferenceRanks[index - 1])} className="px-2 py-1.5 rounded-full text-on-surface-variant hover:bg-surface-container" aria-label={`Đưa ${rank.toUpperCase()} lên trước`}><span className="material-symbols-outlined text-sm">arrow_back</span></button>}
                      {index < preferenceRanks.length - 1 && preferredUniversities[preferenceRanks[index + 1]] && <button type="button" onClick={() => reorderPreferredUniversities(rank, preferenceRanks[index + 1])} className="px-2 py-1.5 rounded-full text-on-surface-variant hover:bg-surface-container" aria-label={`Đưa ${rank.toUpperCase()} xuống sau`}><span className="material-symbols-outlined text-sm">arrow_forward</span></button>}
                      <button type="button" onClick={() => setPendingRemoval(rank)} className="px-2 py-1.5 rounded-full text-rose-700 hover:bg-rose-50 text-[11px] font-semibold">Bỏ chọn</button>
                    </>
                  ) : (
                    <span className="text-[11px] text-on-surface-variant">Chọn thêm từ danh sách bên dưới</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {replacementRank && (
        <div role="status" className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-sky-50 text-sky-900 border border-sky-200 text-xs">
          <span>Đang chọn trường thay thế cho {replacementRank.toUpperCase()}. Bấm “Chọn vào NV” ở một thẻ trường.</span>
          <button type="button" onClick={() => { setReplacementRank(null); setPreferenceReplacementRank(null); }} className="font-bold underline">Hủy</button>
        </div>
      )}

      {pendingRemoval && (
        <div role="dialog" aria-modal="true" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
          <p className="font-bold">Bỏ {pendingRemoval.toUpperCase()} khỏi danh sách?</p>
          <p className="text-xs mt-1">Nếu nguyện vọng này đã có phương án, phương án tương ứng cũng sẽ được xóa khỏi so sánh.</p>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => setPendingRemoval(null)} className="px-3 py-1.5 rounded-full bg-white border border-rose-200 text-xs font-semibold">Hủy</button>
            <button type="button" onClick={() => { removePreferredUniversity(pendingRemoval); setPendingRemoval(null); }} className="px-3 py-1.5 rounded-full bg-rose-700 text-white text-xs font-bold">Bỏ chọn</button>
          </div>
        </div>
      )}

      {/* 2. Clean Horizontal Tool Bar (Search, Region Chips, S27 Toggle) */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-sm border border-surface-container/80 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên trường, quốc gia..."
              className="w-full pl-9 pr-3 py-2 rounded-full bg-surface-container-low text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
            />
          </div>

          {/* Audited equivalence threshold */}
          <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer select-none bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 transition-colors">
            <input
              type="checkbox"
              checked={min3Only}
              onChange={(e) => setMin3Only(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4"
            />
            <span>Có ≥{S27_RULES.transferredCoursesMinimum} môn tương đương đã duyệt</span>
          </label>

          {/* Strict end-to-end eligibility gate */}
          <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer select-none bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200 transition-colors">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-600 h-4 w-4"
            />
            <span>Chỉ hiển thị đủ điều kiện + đã xác minh</span>
          </label>
        </div>

        {/* Region Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          {[
            { id: 'ALL', label: 'Tất cả khu vực' },
            { id: 'EAST_ASIA', label: 'Đông Á (Hàn, Nhật, Đài)' },
            { id: 'EUROPE', label: 'Châu Âu (Pháp, Đức...)' },
            { id: 'SEA', label: 'Đông Nam Á' },
            { id: 'AMERICAS', label: 'Châu Mỹ' }
          ].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRegion(r.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedRegion === r.id
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. University Cards Grid */}
      {filteredResults.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center shadow-sm border border-surface-container flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">travel_explore</span>
          <h3 className="text-base font-bold text-on-surface">Không tìm thấy trường đối tác phù hợp</h3>
          <p className="text-xs text-on-surface-variant">Hãy thử nới lỏng bộ lọc khu vực hoặc tắt một trong các bộ lọc đang bật.</p>
          <button
            type="button"
            onClick={() => {
              setMin3Only(false);
              setVerifiedOnly(false);
              setSelectedRegion('ALL');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-bold text-primary hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResults.map((res) => {
            const uni = res.university;
            const selectedRank = selectedRankForUniversity(uni.id);
            const transferredCredits = res.matchedPairs
              .filter(pair => pair.status === 'APPROVED')
              .reduce((sum, pair) => sum + pair.ftuCredits, 0);

            return (
              <div
                key={uni.id}
                className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-surface-container/80 flex flex-col justify-between gap-4 group hover:border-primary/40"
              >
                {/* Top: Logo, Name & Match Badge */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-surface-container p-1.5 flex items-center justify-center shrink-0 border border-surface-container">
                        <img
                          alt={uni.name}
                          className="w-full h-full object-contain"
                          src={
                            uni.logoUrl ||
                            '/images/logo.png'
                          }
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors" title={uni.name}>
                          {uni.name}
                        </h3>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span>{uni.flag || '🌏'}</span>
                          <span className="truncate">{uni.city ? `${uni.city}, ` : ''}{uni.country}</span>
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 border ${res.meetsEligibility ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                      {res.meetsEligibility ? 'Đủ điều kiện' : 'Cần xác minh'}
                    </span>
                  </div>

                  {/* Transfer pill */}
                  <div className="bg-surface-container-low rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">
                      Quy đổi đã duyệt: {res.approvedPairsCount} môn ({transferredCredits} TC FTU)
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {uni.region}
                    </span>
                  </div>

                  {/* Key specs row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant bg-surface rounded-xl p-2.5 border border-surface-container/60">
                    <div>
                      <span>GPA: </span>
                      <strong className="text-on-surface font-semibold">{uni.minGpa !== undefined ? `≥ ${uni.minGpa.toFixed(1)}/4.0` : 'Chưa có dữ liệu riêng'}</strong>
                    </div>
                    <div>
                      <span>Ngoại ngữ: </span>
                      <strong className="text-on-surface font-semibold">{uni.languages || 'Chưa có yêu cầu riêng'}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-on-surface-variant">
                    {res.recommendationReasons.slice(0, 2).map(reason => <p key={reason}>• {reason}</p>)}
                    {!res.meetsEligibility && res.missingRequirements.slice(0, 2).map(reason => (
                      <p key={reason} className="text-amber-700">• {reason}</p>
                    ))}
                    <p className="truncate" title={res.sources[0]?.file || 'Chưa có nguồn'}>
                      <strong className="text-on-surface">Nguồn:</strong> {res.sources[0]?.file || 'Chưa có nguồn dữ liệu'}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-surface-container flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => chooseUniversity(uni.id, uni.name)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${selectedRank
                        ? 'bg-primary text-white font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {selectedRank ? 'check' : 'add'}
                    </span>
                    <span>{selectedRank ? `Đã chọn ${selectedRank.toUpperCase()}` : 'Chọn vào NV'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPlan(uni.id, uni.name)}
                    className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span>{selectedRank ? `Lập phương án ${selectedRank.toUpperCase()}` : 'Chọn & lập phương án'}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
