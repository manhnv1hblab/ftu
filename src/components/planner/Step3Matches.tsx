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

export const Step3Matches: React.FC = () => {
  const {
    profile,
    setCurrentStep,
    setSelectedUniId,
    rankedChoices,
    setRankedChoice
  } = useStudent();

  const [min3Only, setMin3Only] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

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
      // Threshold >= 3 courses filter
      if (min3Only && !res.meetsEligibility) return false;

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
  }, [evaluatedResults, min3Only, selectedRegion, searchQuery]);

  const handleSelectUniversity = (uniId: string) => {
    setSelectedUniId(uniId);
    setCurrentStep(4);
  };

  const isCompared = (uniId: string) => {
    return (
      rankedChoices.nv1?.universityId === uniId ||
      rankedChoices.nv2?.universityId === uniId ||
      rankedChoices.nv3?.universityId === uniId
    );
  };

  const toggleCompare = (uniId: string, uniName: string) => {
    if (rankedChoices.nv1?.universityId === uniId) {
      setRankedChoice('nv1', undefined);
    } else if (rankedChoices.nv2?.universityId === uniId) {
      setRankedChoice('nv2', undefined);
    } else if (rankedChoices.nv3?.universityId === uniId) {
      setRankedChoice('nv3', undefined);
    } else {
      if (!rankedChoices.nv1) {
        setRankedChoice('nv1', { universityId: uniId, universityName: uniName, transferredCourses: [] });
      } else if (!rankedChoices.nv2) {
        setRankedChoice('nv2', { universityId: uniId, universityName: uniName, transferredCourses: [] });
      } else if (!rankedChoices.nv3) {
        setRankedChoice('nv3', { universityId: uniId, universityName: uniName, transferredCourses: [] });
      } else {
        setNotification('Bạn đã chọn tối đa 3 trường vào danh sách so sánh. Hãy bỏ chọn một trường trước.');
        window.setTimeout(() => setNotification(null), 3000);
      }
    }
  };

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
          <span>{qualifiedCount} trường đủ điều kiện theo dữ liệu đã audit</span>
        </div>
      </div>

      {notification && (
        <div role="status" className="p-3 rounded-2xl bg-amber-600 text-white text-xs font-bold text-center shadow-sm">
          {notification}
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

          {/* S27 Rule Quick Toggle */}
          <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer select-none bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 transition-colors">
            <input
              type="checkbox"
              checked={min3Only}
              onChange={(e) => setMin3Only(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4"
            />
            <span>Quy đổi ≥ 3 môn (Ngưỡng S27)</span>
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
          <p className="text-xs text-on-surface-variant">Hãy thử nới lỏng bộ lọc khu vực hoặc tắt điều kiện ngưỡng ≥ 3 môn.</p>
          <button
            type="button"
            onClick={() => {
              setMin3Only(false);
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
            const inCompare = isCompared(uni.id);
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
                    <p><strong className="text-on-surface">Ngân sách:</strong> {res.budgetEvaluation.label}</p>
                    {res.recommendationReasons.slice(0, 2).map(reason => <p key={reason}>• {reason}</p>)}
                    <p className="truncate" title={res.sources[0]?.file || 'Chưa có nguồn'}>
                      <strong className="text-on-surface">Nguồn:</strong> {res.sources[0]?.file || 'Chưa có nguồn dữ liệu'}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-surface-container flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCompare(uni.id, uni.name)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${inCompare
                        ? 'bg-primary text-white font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {inCompare ? 'check' : 'add'}
                    </span>
                    <span>{inCompare ? 'Đã so sánh' : 'So sánh'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectUniversity(uni.id)}
                    className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span>Xem môn</span>
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
