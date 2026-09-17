'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import universitiesData from '../../../data/universities_s27.json';
import equivalencesData from '../../../data/equivalences_s27.json';
import costsData from '../../../data/costs_by_country.json';
import { PartnerUniversity } from '../../types/university';
import { CourseEquivalence } from '../../types/equivalence';
import { CountryCost } from '../../types/cost';
import { useStudent } from '../../context/StudentContext';

// Reliable representative campus images for partner regions/countries
const COUNTRY_CAMPUS_IMAGES: Record<string, string> = {
  'Korea': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  'Japan': 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
  'China': 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=800&q=80',
  'Taiwan': 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=800&q=80',
  'France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  'Germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80',
  'Switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
  'Sweden': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
  'Norway': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
  'Finland': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=800&q=80',
  'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=800&q=80',
  'Spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  'Belgium': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80',
  'USA': 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
  'Canada': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
  'Australia': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  'Russia': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
};

export default function PartnersPage() {
  const router = useRouter();
  const { setSelectedUniId, setCurrentStep } = useStudent();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedScholarship, setSelectedScholarship] = useState('ALL');
  const [hasEquivalencesOnly, setHasEquivalencesOnly] = useState(false);

  const rawUnis = universitiesData as PartnerUniversity[];
  const rawEqs = equivalencesData as CourseEquivalence[];
  const rawCosts = costsData as Record<string, CountryCost>;

  // Count approved equivalences per university
  const approvedCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const eq of rawEqs) {
      if (eq.status === 'APPROVED' && eq.partnerS27Id) {
        map[eq.partnerS27Id] = (map[eq.partnerS27Id] || 0) + 1;
      }
    }
    return map;
  }, [rawEqs]);

  // Filtered universities
  const filteredUnis = useMemo(() => {
    return rawUnis.filter((uni) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = uni.name.toLowerCase().includes(term);
        const matchesCountry = uni.country.toLowerCase().includes(term);
        if (!matchesName && !matchesCountry) return false;
      }

      // Region filter
      if (selectedRegion === 'ASIA' && uni.region !== 'Asia') return false;
      if (selectedRegion === 'EUROPE' && uni.region !== 'Europe') return false;
      if (selectedRegion === 'AMERICAS_OCEANIA' && uni.region !== 'America' && uni.region !== 'Oceania') return false;

      // Language filter
      if (selectedLanguage !== 'ALL') {
        if (!uni.languages.toLowerCase().includes(selectedLanguage.toLowerCase())) {
          return false;
        }
      }

      // Scholarship filter
      if (selectedScholarship === 'WITH_SCHOLARSHIP') {
        if (!uni.scholarship || uni.scholarship.toLowerCase().includes('không') || uni.scholarship.trim().length === 0) {
          return false;
        }
      }

      // Has equivalences only
      if (hasEquivalencesOnly) {
        if ((approvedCounts[uni.id] || 0) === 0) {
          return false;
        }
      }

      return true;
    });
  }, [rawUnis, searchTerm, selectedRegion, selectedLanguage, selectedScholarship, hasEquivalencesOnly, approvedCounts]);

  const handleSelectForPlan = (uniId: string) => {
    setSelectedUniId(uniId);
    setCurrentStep(4);
    router.push('/planner');
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-8">
      {/* Disclaimer Notice (Stitch Brand Standard) */}
      <div className="w-full max-w-7xl mx-auto px-space-lg pt-space-md">
        <div className="bg-surface-container-low rounded-DEFAULT px-space-md py-space-sm flex items-center justify-between gap-space-sm shadow-sm border border-surface-container">
          <div className="flex items-center gap-space-sm text-xs">
            <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">info</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <strong className="font-label-md text-on-surface">Lưu ý cố vấn:</strong> Dữ liệu chỉ tiêu, học bổng và quy đổi tín chỉ được cập nhật theo Biên bản Thỏa thuận (MoU/MoA) và Danh mục môn tương đương S27 của FTU.
            </p>
          </div>
          <span className="hidden sm:inline-flex font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider px-space-sm py-1 bg-primary-fixed rounded-full flex-shrink-0">
            Kỳ S27 (2026 - 2027)
          </span>
        </div>
      </div>

      {/* Page Header & Key Statistics Section */}
      <section className="w-full max-w-7xl mx-auto px-space-lg">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md mb-space-sm text-xs">
          <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-semibold">Mạng lưới Trường Đối tác FTU</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm text-xs font-bold">
              <span className="material-symbols-outlined text-sm">public</span>
              <span>FTU GLOBAL PARTNERSHIP DIRECTORY 2026 - 2027</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-extrabold text-2xl sm:text-4xl">
              Khám phá Mạng lưới Trường Trao đổi Đối tác FTU
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm sm:text-base leading-relaxed">
              Tra cứu chỉ tiêu tuyển chọn, học bổng song phương, yêu cầu ngoại ngữ và lộ trình quy đổi tín chỉ tương đương cho sinh viên Foreign Trade University.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-space-sm self-start lg:self-auto">
            <Link
              href="/planner"
              className="inline-flex items-center gap-space-xs px-5 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container transition-all text-xs sm:text-sm font-bold"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Gợi ý theo Bảng điểm FTU</span>
            </Link>
          </div>
        </div>

        {/* Quantitative Metrics Dashboard Strip with 3D Icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mt-space-lg">
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-surface-container flex items-center gap-space-md hover:border-primary/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/images/3d_globe.jpg"
                alt="3D Globe"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-on-surface font-extrabold leading-tight text-xl sm:text-2xl">116</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">Đại học đối tác S27</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-surface-container flex items-center gap-space-md hover:border-secondary/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/images/3d_passport.jpg"
                alt="3D Passport"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-on-surface font-extrabold leading-tight text-xl sm:text-2xl">22</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">Quốc gia & Vùng</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-surface-container flex items-center gap-space-md hover:border-tertiary/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/images/3d_graduation.jpg"
                alt="3D Graduation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-on-surface font-extrabold leading-tight text-xl sm:text-2xl">2.094+</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">Môn tương đương đã duyệt</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-surface-container flex items-center gap-space-md hover:border-primary/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/images/3d_scholarship.jpg"
                alt="3D Scholarship"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-on-surface font-extrabold leading-tight text-xl sm:text-2xl">100%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">Miễn học phí song phương</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Search & Multi-Dimensional Criteria Panel */}
      <section className="w-full max-w-7xl mx-auto px-space-lg">
        <div className="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-3xl shadow-md border border-surface-container flex flex-col gap-space-md">
          {/* Main Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên trường, tên thành phố hoặc quốc gia (VD: Chung-Ang, Yonsei, Pháp, Hàn Quốc)..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm transition-all"
            />
          </div>

          {/* Horizontal Region Pills */}
          <div className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold text-xs uppercase tracking-wider">
              Khu vực địa lý:
            </span>
            <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
              {[
                { id: 'ALL', label: 'Tất cả đối tác toàn cầu' },
                { id: 'ASIA', label: 'Châu Á (Hàn Quốc, Nhật Bản, Đài Loan, TQ...)' },
                { id: 'EUROPE', label: 'Châu Âu (Pháp, Đức, Ý, Thụy Điển...)' },
                { id: 'AMERICAS_OCEANIA', label: 'Châu Mỹ & Châu Úc (Mỹ, Canada, Úc)' },
              ].map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`px-4 py-2 rounded-full transition-all ${selectedRegion === reg.id
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                    }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deep 3-Column Criteria Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md pt-space-xs text-xs">
            {/* Criterion 1: Teaching Medium */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">translate</span>
                Ngôn ngữ giảng dạy
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container"
              >
                <option value="ALL">Tất cả ngôn ngữ</option>
                <option value="Tiếng Anh">Tiếng Anh (IELTS / TOEFL / B2)</option>
                <option value="Tiếng Pháp">Tiếng Pháp (DELF B2 / TCF)</option>
                <option value="Tiếng Nhật">Tiếng Nhật (JLPT N2 / N1)</option>
                <option value="Tiếng Hàn">Tiếng Hàn (TOPIK 3 / 4)</option>
                <option value="Tiếng Trung">Tiếng Trung (HSK 4 / 5)</option>
              </select>
            </div>

            {/* Criterion 2: Scholarship Type */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">redeem</span>
                Gói Học bổng / Tài trợ
              </label>
              <select
                value={selectedScholarship}
                onChange={(e) => setSelectedScholarship(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container"
              >
                <option value="ALL">Tất cả (Bao gồm miễn 100% học phí)</option>
                <option value="WITH_SCHOLARSHIP">Có học bổng sinh hoạt phí song phương</option>
              </select>
            </div>

            {/* Criterion 3: Equivalences Availability */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">verified</span>
                Môn tương đương FTU
              </label>
              <select
                value={hasEquivalencesOnly ? 'APPROVED_ONLY' : 'ALL'}
                onChange={(e) => setHasEquivalencesOnly(e.target.value === 'APPROVED_ONLY')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container"
              >
                <option value="ALL">Tất cả 116 trường đối tác</option>
                <option value="APPROVED_ONLY">Chỉ trường đã có môn duyệt tại FTU</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary Bar */}
          <div className="flex items-center justify-between flex-wrap gap-space-sm pt-space-xs border-t border-surface-container text-xs">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-on-surface-variant font-medium">Đang áp dụng:</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
                Kỳ S27 (2026 - 2027)
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
                Miễn học phí song phương
              </span>
              {(searchTerm || selectedRegion !== 'ALL' || selectedLanguage !== 'ALL' || selectedScholarship !== 'ALL' || hasEquivalencesOnly) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRegion('ALL');
                    setSelectedLanguage('ALL');
                    setSelectedScholarship('ALL');
                    setHasEquivalencesOnly(false);
                  }}
                  className="font-label-sm text-primary hover:underline font-bold ml-2"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>

            <div className="text-on-surface-variant font-semibold">
              Hiển thị <span className="font-bold text-on-surface">{filteredUnis.length}</span> trong tổng số{' '}
              <span className="font-bold text-primary">{rawUnis.length}</span> trường đối tác khả dụng
            </div>
          </div>
        </div>
      </section>

      {/* Partner University Cards Grid (Exact Stitch Structure) */}
      <section className="w-full max-w-7xl mx-auto px-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {filteredUnis.map((uni) => {
            const approvedCount = approvedCounts[uni.id] || 0;
            const countryCost = rawCosts[uni.country];

            // Resolve campus image
            const campusImg =
              COUNTRY_CAMPUS_IMAGES[uni.country] ||
              (uni.region === 'Asia' ? COUNTRY_CAMPUS_IMAGES['Korea'] :
                uni.region === 'Europe' ? COUNTRY_CAMPUS_IMAGES['France'] :
                  COUNTRY_CAMPUS_IMAGES['default']);

            return (
              <article
                key={uni.id}
                className="bg-surface-container-lowest rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group border border-surface-container"
              >
                {/* Image & Floating Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-surface-container-low">
                  <Image
                    src={campusImg}
                    alt={`Khuôn viên trường ${uni.name}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <span className="px-3 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-sm text-[11px]">
                      {uni.scholarship && !uni.scholarship.toLowerCase().includes('không') ? uni.scholarship : 'FTU Partner'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm font-semibold text-[11px]">
                      {uni.region}
                    </span>
                  </div>

                  {/* Bottom Location & Quota Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10 text-xs">
                    <div className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span>{uni.country}</span>
                    </div>
                    <span className="bg-surface-container-lowest/30 px-2 py-0.5 rounded backdrop-blur-sm font-bold text-[11px]">
                      {uni.quota || 'Theo thông báo S27'}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-space-md flex flex-col flex-grow justify-between gap-space-md">
                  <div className="flex flex-col">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary transition-colors text-base line-clamp-1">
                      {uni.name}
                    </h3>

                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs line-clamp-2 mt-1.5 leading-relaxed">
                      {uni.requirements || 'Yêu cầu: Sinh viên chính quy FTU, GPA ≥ 2.8/4, tiếng Anh tối thiểu B2 CEFR hoặc tương đương.'}
                    </p>

                    {/* Key Criteria Pills */}
                    <div className="grid grid-cols-2 gap-2 mt-space-md pt-space-xs text-xs">
                      <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                        <span className="font-label-sm text-on-surface-variant text-[11px]">Ngôn ngữ đào tạo</span>
                        <span className="font-label-md text-on-surface font-bold truncate">
                          {uni.languages || 'Tiếng Anh'}
                        </span>
                      </div>

                      <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                        <span className="font-label-sm text-on-surface-variant text-[11px]">Sinh hoạt phí TB</span>
                        <span className="font-label-md text-primary font-bold truncate">
                          {countryCost ? countryCost.livingCost.raw : 'Theo Factsheet'}
                        </span>
                      </div>
                    </div>

                    {/* Approved Subjects Indicator */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      <span className="font-label-sm text-label-sm text-tertiary font-bold">
                        {approvedCount > 0 ? `Đã có ${approvedCount} môn khớp CTĐT FTU` : 'Chưa có môn duyệt sẵn (Đề xuất thêm)'}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-space-sm flex items-center justify-between gap-space-sm border-t border-surface-container">
                    <Link
                      href={`/partners/${uni.id}`}
                      className="px-3.5 py-2 rounded-full text-on-surface-variant hover:text-primary font-label-md text-label-md font-semibold text-xs transition-colors"
                    >
                      Chi tiết đối tác
                    </Link>

                    <button
                      onClick={() => handleSelectForPlan(uni.id)}
                      className="px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center gap-1 hover:bg-primary-container transition-all shadow-sm text-xs"
                    >
                      <span>Chọn vào lộ trình</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredUnis.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-surface-container p-8 space-y-3 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
            <h3 className="text-base font-bold text-on-surface">Không tìm thấy trường đối tác phù hợp</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Hãy thử thay đổi từ khóa hoặc điều chỉnh lại các bộ lọc khu vực và ngôn ngữ.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
