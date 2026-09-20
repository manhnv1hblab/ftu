'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import universitiesData from '../../../../data/universities_s27.json';
import equivalencesData from '../../../../data/equivalences_s27.json';
import costsData from '../../../../data/costs_by_country.json';
import { PartnerUniversity } from '../../../types/university';
import { CourseEquivalence } from '../../../types/equivalence';
import { CountryCost } from '../../../types/cost';
import { useStudent } from '../../../context/StudentContext';
import { S27_RULES } from '../../../config/s27Rules';

const COUNTRY_CAMPUS_HEROES: Record<string, string> = {
  'Korea': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85',
  'Japan': 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1600&q=85',
  'China': 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=1600&q=85',
  'Taiwan': 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1600&q=85',
  'France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=85',
  'Germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=85',
  'Switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=85',
  'Sweden': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1600&q=85',
  'Norway': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=85',
  'Finland': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=85',
  'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=1600&q=85',
  'Spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&q=85',
  'Belgium': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1600&q=85',
  'USA': 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=85',
  'Canada': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=85',
  'Australia': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85',
  'Russia': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=85',
  'default': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1600&q=85',
};

export default function UniversityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setSelectedUniId, setCurrentStep } = useStudent();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EQUIVALENCES' | 'COSTS' | 'LIFE' | 'PROCEDURES'>('OVERVIEW');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED');
  const [searchTerm, setSearchTerm] = useState('');

  const uniId = params?.id as string;
  const rawUnis = universitiesData as PartnerUniversity[];
  const rawEqs = equivalencesData as CourseEquivalence[];
  const rawCosts = costsData as Record<string, CountryCost>;

  const university = rawUnis.find(u => u.id === uniId);

  if (!university) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 animate-fade-in">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">error</span>
        <h1 className="text-xl font-bold text-on-surface">Không tìm thấy trường đối tác</h1>
        <p className="text-xs text-on-surface-variant">Mã trường không tồn tại trong danh mục S27.</p>
        <Link href="/partners" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          Quay lại danh mục trường
        </Link>
      </div>
    );
  }

  // Equivalences
  const uniEquivalences = useMemo(() => {
    return rawEqs.filter(
      e => e.partnerS27Id === university.id || e.partnerUni.toLowerCase() === university.name.toLowerCase()
    );
  }, [rawEqs, university]);

  const approvedList = useMemo(() => uniEquivalences.filter(e => e.status === 'APPROVED'), [uniEquivalences]);
  const pendingList = useMemo(() => uniEquivalences.filter(e => e.status === 'PENDING'), [uniEquivalences]);
  const rejectedList = useMemo(() => uniEquivalences.filter(e => e.status === 'REJECTED'), [uniEquivalences]);

  const filteredEquivalences = useMemo(() => {
    return uniEquivalences.filter(e => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mHost = e.hostCourseName.toLowerCase().includes(q) || e.hostCourseCode.toLowerCase().includes(q);
        const mFtu = e.ftuCourseNameClean.toLowerCase().includes(q) || e.ftuCourseCodeRaw.toLowerCase().includes(q);
        if (!mHost && !mFtu) return false;
      }
      return true;
    });
  }, [uniEquivalences, statusFilter, searchTerm]);

  const countryCost = rawCosts[university.country];

  const heroImg =
    university.imageUrl ||
    COUNTRY_CAMPUS_HEROES[university.country] ||
    (university.region === 'Asia' ? COUNTRY_CAMPUS_HEROES['Korea'] :
      university.region === 'Europe' ? COUNTRY_CAMPUS_HEROES['France'] :
        COUNTRY_CAMPUS_HEROES['default']);

  const gallery = university.galleryImages && university.galleryImages.length > 0
    ? university.galleryImages
    : [heroImg];

  const handleSelectForPlanner = () => {
    setSelectedUniId(university.id);
    setCurrentStep(4);
    router.push('/planner');
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-8 animate-fade-in">
      {/* 1. Panoramic Hero Header Banner */}
      <div className="relative h-[360px] md:h-[440px] w-full overflow-hidden bg-surface-container-high">
        <Image
          src={heroImg}
          alt={`Khuôn viên trường ${university.name}`}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-white">
          {/* Top Breadcrumb & Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <nav className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
              <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <Link href="/partners" className="hover:text-white transition-colors">Trường đối tác S27</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-white font-bold truncate max-w-[220px]">{university.name}</span>
            </nav>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-sm">
                {university.quota || 'Chưa có dữ liệu chỉ tiêu'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                {university.flag || '🌏'} {university.city ? `${university.city}, ` : ''}{university.country}
              </span>
            </div>
          </div>

          {/* Main Title & Specs */}
          <div className="space-y-3 pb-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-container text-white text-xs font-extrabold uppercase tracking-wider shadow-sm">
                {university.scholarship || 'Chưa có dữ liệu học bổng/học phí'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                {university.qsRank || university.nationalRank || university.region}
              </span>
              {university.accreditation && (
                <span className="px-3 py-1 rounded-full bg-emerald-700/80 backdrop-blur-md text-white text-xs font-semibold hidden sm:inline-block">
                  ✓ {university.accreditation.split(',')[0]}
                </span>
              )}
            </div>

            <h1 className="font-extrabold text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              {university.name}
            </h1>

            {university.vietnameseName && (
              <p className="text-sm sm:text-base text-white/90 font-medium">
                {university.vietnameseName}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-white/90">
              <span className="flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-primary-fixed text-base">language</span>
                <span>{university.languages || 'Chưa có dữ liệu ngôn ngữ'}</span>
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
                <span>{approvedList.length} môn học đã phê duyệt công nhận tại FTU</span>
              </span>
              {university.websiteUrl && (
                <a
                  href={university.websiteUrl.startsWith('http') ? university.websiteUrl : `https://${university.websiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary-fixed hover:underline font-bold"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Website chính thức</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quantitative KPI Dashboard Strip */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container/80 flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase">Học phí đối tác</span>
            <span className="text-xl font-black text-primary mt-1">
              {university.scholarship || 'Chưa có dữ liệu'}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Thỏa thuận trao đổi song phương</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container/80 flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase">Sinh hoạt phí ước tính</span>
            <span className="text-xl font-black text-on-surface mt-1">
              {countryCost ? countryCost.livingCost.raw : 'Chưa có dữ liệu chi phí'}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">Ăn ở thiết yếu / kỳ 5 tháng</span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container/80 flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase">Môn tiền lệ FTU</span>
            <span className="text-xl font-black text-emerald-700 mt-1">
              {approvedList.length} môn duyệt
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">
              {approvedList.length >= 3 ? '✓ Đạt ngưỡng quy đổi S27' : 'Có thể đề xuất thẩm định thêm'}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container/80 flex flex-col justify-center">
            <button
              type="button"
              onClick={handleSelectForPlanner}
              className="w-full py-3 px-4 rounded-full bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              <span>Lập kế hoạch với trường</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Segmented 5-Tab Navigation Bar */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex border-b border-surface-container text-xs sm:text-sm font-bold overflow-x-auto scrollbar-none gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'OVERVIEW'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-lg">school</span>
            <span>Tổng quan & Cơ sở vật chất</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EQUIVALENCES')}
            className={`pb-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'EQUIVALENCES'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-lg">sync_alt</span>
            <span>Bảng môn học quy đổi FTU ({uniEquivalences.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COSTS')}
            className={`pb-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'COSTS'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            <span>Dự toán chi phí 01 kỳ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LIFE')}
            className={`pb-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'LIFE'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-lg">apartment</span>
            <span>Đời sống campus & Tiện ích</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROCEDURES')}
            className={`pb-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'PROCEDURES'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-lg">policy</span>
            <span>Quy chế S27 & Thủ tục</span>
          </button>
        </div>
      </section>

      {/* TAB 1: OVERVIEW & CAMPUS PHOTO GALLERY */}
      {activeTab === 'OVERVIEW' && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Overview & Quick Facts Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                Giới thiệu trường {university.name}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
                {university.description || university.requirements}
              </p>
            </div>

            {/* Quick Academic Facts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Năm thành lập</span>
                <span className="text-base font-extrabold text-on-surface block">
                  {university.foundedYear || 'Chưa có dữ liệu'}
                </span>
                <span className="text-[11px] text-on-surface-variant">Chỉ hiển thị khi có nguồn xác minh</span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Quy mô sinh viên</span>
                <span className="text-base font-extrabold text-on-surface block">
                  {university.studentCount || 'Chưa có dữ liệu'}
                </span>
                <span className="text-[11px] text-on-surface-variant">Chỉ hiển thị khi có nguồn xác minh</span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Xếp hạng quốc tế</span>
                <span className="text-base font-extrabold text-primary block">
                  {university.qsRank || university.nationalRank || 'Chưa có dữ liệu'}
                </span>
                <span className="text-[11px] text-on-surface-variant">Chỉ hiển thị khi có nguồn xác minh</span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Thời gian học kỳ S27</span>
                <span className="text-base font-extrabold text-emerald-800 block">
                  {university.semesterDates || 'Chưa có dữ liệu'}
                </span>
                <span className="text-[11px] text-on-surface-variant">Theo tài liệu S27; lịch cụ thể cần xác minh</span>
              </div>
            </div>

            {/* Accreditation & Campus Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Kiểm định & Chứng nhận chất lượng</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {university.accreditation || 'Chưa có dữ liệu kiểm định được xác minh trong bộ dữ liệu S27.'}
                </p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1.5">
                <div className="flex items-center gap-2 text-secondary font-bold text-xs">
                  <span className="material-symbols-outlined text-base">apartment</span>
                  <span>Đặc điểm khuôn viên trường</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {university.campusType || 'Chưa có dữ liệu đặc điểm khuôn viên được xác minh trong bộ dữ liệu S27.'}
                </p>
              </div>
            </div>

            {/* Key Faculties & Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {university.keyFaculties && university.keyFaculties.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">local_library</span>
                    <span>Các khoa & Viện đào tạo trọng điểm</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {university.keyFaculties.map((fac, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-surface-container text-xs text-on-surface font-medium">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {university.popularCourses && university.popularCourses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-secondary">trending_up</span>
                    <span>Học phần phổ biến được sinh viên FTU chọn học</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {university.popularCourses.map((c, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-primary-fixed/40 text-xs text-primary font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Highlights List */}
            {university.highlights && university.highlights.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-surface-container">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-amber-600">star</span>
                  <span>Điểm nhấn học thuật & Trải nghiệm sinh viên</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant">
                  {university.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-surface-container-low p-2.5 rounded-xl border border-surface-container/60">
                      <span className="material-symbols-outlined text-emerald-600 text-sm shrink-0 mt-0.5">check_circle</span>
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Photo Gallery Grid */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">Thư viện ảnh khuôn viên trường</h3>
                <p className="text-xs text-on-surface-variant">Không gian giảng đường, thư viện và đời sống sinh viên tại {university.name}</p>
              </div>
              <span className="text-xs font-bold text-primary">{gallery.length} hình ảnh</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((imgUrl, idx) => (
                <div key={idx} className="relative h-56 rounded-2xl overflow-hidden shadow-xs border border-surface-container group">
                  <Image
                    src={imgUrl}
                    alt={`Khuôn viên ${university.name} ảnh ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Campus {university.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: EQUIVALENCES TABLE */}
      {activeTab === 'EQUIVALENCES' && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 space-y-5">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((status) => {
                  const count = status === 'ALL'
                    ? uniEquivalences.length
                    : status === 'APPROVED'
                      ? approvedList.length
                      : status === 'PENDING'
                        ? pendingList.length
                        : rejectedList.length;

                  const label = status === 'ALL'
                    ? 'Tất cả'
                    : status === 'APPROVED'
                      ? 'Đã duyệt FTU'
                      : status === 'PENDING'
                        ? 'Đang xét'
                        : 'Không tương đương';

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === status
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[260px]">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã hoặc tên môn học..."
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-surface-container-low text-on-surface focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container"
                />
              </div>
            </div>

            {/* Equivalences Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase font-bold border-y border-surface-container">
                  <tr>
                    <th className="py-3.5 px-4">Môn học tại {university.name}</th>
                    <th className="py-3.5 px-4">Mã môn đối tác</th>
                    <th className="py-3.5 px-4">Học phần quy đổi tại FTU</th>
                    <th className="py-3.5 px-4">Mã học phần FTU</th>
                    <th className="py-3.5 px-4">Khoa / Người ký duyệt</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredEquivalences.map((eq) => {
                    const isAppr = eq.status === 'APPROVED';
                    const isPend = eq.status === 'PENDING';
                    const isRej = eq.status === 'REJECTED';

                    return (
                      <tr key={eq.id} className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-on-surface max-w-[240px]">
                          {eq.hostCourseName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-on-surface-variant font-semibold">
                          {eq.hostCourseCode || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-on-surface max-w-[240px]">
                          {eq.ftuCourseNameClean}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-primary">
                          {eq.ftuCourseCodeRaw || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          <div className="font-semibold text-on-surface">{eq.approver || 'Bộ môn FTU'}</div>
                          <div className="text-[11px] text-on-surface-variant">
                            {eq.faculty} {eq.approvalYear ? `• Năm ${eq.approvalYear}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${isAppr
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPend
                                  ? 'bg-amber-100 text-amber-900'
                                  : isRej
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {isAppr ? 'Đã công nhận' : isPend ? 'Đang thẩm định' : isRej ? 'Không tương đương' : 'Chưa rõ'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredEquivalences.length === 0 && (
                <div className="text-center py-12 text-on-surface-variant text-xs space-y-1">
                  <span className="material-symbols-outlined text-3xl">inbox</span>
                  <p>Không tìm thấy môn học nào khớp với điều kiện lọc.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: COSTS & HOUSING BREAKDOWN */}
      {activeTab === 'COSTS' && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                Dự toán chi phí sinh hoạt & Nhà ở tại {university.country}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Bảng so sánh chi phí tham gia trao đổi sinh viên chính thức của FTU (ước tính cho 1 học kỳ 5 tháng)
              </p>
            </div>

            {university.costBreakdown && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface">Chi tiết từng khoản sinh hoạt phí hàng tháng</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                    <span className="text-on-surface-variant font-medium">Ký túc xá / Nhà ở:</span>
                    <span className="font-bold text-on-surface block text-sm">{university.costBreakdown.dormitoryMonthly}</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                    <span className="text-on-surface-variant font-medium">Ăn uống cơ bản:</span>
                    <span className="font-bold text-on-surface block text-sm">{university.costBreakdown.mealsMonthly}</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                    <span className="text-on-surface-variant font-medium">Giao thông công cộng:</span>
                    <span className="font-bold text-on-surface block text-sm">{university.costBreakdown.transportMonthly}</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1">
                    <span className="text-on-surface-variant font-medium">Bảo hiểm Y tế:</span>
                    <span className="font-bold text-emerald-800 block text-sm">{university.costBreakdown.insuranceSemester}</span>
                  </div>
                </div>
              </div>
            )}

            {countryCost && (
              <div className="space-y-4 pt-2 border-t border-surface-container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <span className="material-symbols-outlined text-lg">restaurant</span>
                      <span>Sinh hoạt phí thiết yếu</span>
                    </div>
                    <div className="text-xl font-extrabold text-on-surface">
                      {countryCost.livingCost.raw}
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Bao gồm ăn uống, đi lại bằng phương tiện công cộng, internet, điện thoại và sinh hoạt phí thiết yếu.
                    </p>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-2">
                    <div className="flex items-center gap-2 text-secondary font-bold text-xs">
                      <span className="material-symbols-outlined text-lg">apartment</span>
                      <span>Ký túc xá Campus</span>
                    </div>
                    <div className="text-xl font-extrabold text-on-surface">
                      {countryCost.dormitoryCost.raw}
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {countryCost.oneTimeDepositFee
                        ? `Phí cọc hoặc đăng ký trước: Khoảng ${countryCost.oneTimeDepositFee} triệu VNĐ.`
                        : 'Chi phí phòng tiêu chuẩn trong campus trường đối tác.'}
                    </p>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-2">
                    <div className="flex items-center gap-2 text-tertiary font-bold text-xs">
                      <span className="material-symbols-outlined text-lg">home</span>
                      <span>Căn hộ thuê ngoài</span>
                    </div>
                    <div className="text-xl font-extrabold text-on-surface">
                      {countryCost.rentCost.raw}
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Chi phí thuê phòng ngoài campus, dao động theo cự ly tới ga tàu và loại phòng đơn/phòng ghép.
                    </p>
                  </div>
                </div>

                <div className="bg-primary-fixed/30 p-4 rounded-2xl border border-primary/20 text-xs text-on-surface space-y-1.5">
                  <strong className="text-primary font-bold block text-sm">Các khoản tự túc bổ sung sinh viên cần chuẩn bị:</strong>
                  <p className="text-on-surface-variant leading-relaxed">
                    • Vé máy bay khứ hồi (mua theo lịch học sau khi có Thư chấp nhận và Visa)
                    <br />• Bảo hiểm sức khỏe quốc tế bắt buộc và lệ phí nộp hồ sơ xin thị thực (Visa)
                    <br />• Nghĩa vụ học phí tại FTU được áp dụng theo quy chế tín chỉ của Nhà trường
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: CAMPUS LIFE & FACILITIES */}
      {activeTab === 'LIFE' && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                Môi trường học tập & Đời sống sinh viên tại {university.name}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Thông tin thực tế về điều kiện khí hậu, tiện ích ký túc xá và hoạt động giao lưu quốc tế.
              </p>
            </div>

            {university.climate && (
              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-base">wb_sunny</span>
                  <span>Khí hậu & Thời tiết địa phương</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {university.climate}
                </p>
              </div>
            )}

            {university.campusFacilities && university.campusFacilities.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-secondary">apartment</span>
                  <span>Cơ sở vật chất & Tiện ích khuôn viên</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {university.campusFacilities.map((fac, idx) => (
                    <div key={idx} className="bg-surface-container-low p-3.5 rounded-2xl border border-surface-container/70 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">check_circle</span>
                      <span className="text-on-surface leading-relaxed">{fac}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!university.climate && (!university.campusFacilities || university.campusFacilities.length === 0) && (
              <p className="text-xs text-on-surface-variant border-t border-surface-container pt-4">
                Tài liệu S27 hiện chưa cung cấp dữ liệu đã audit về đời sống và cơ sở vật chất của trường này.
              </p>
            )}
          </div>
        </section>
      )}

      {/* TAB 5: PROCEDURES & S27 RULES */}
      {activeTab === 'PROCEDURES' && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                Quy chế S27 áp dụng cho {university.name}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Các quy định đào tạo bắt buộc, thời hạn hồ sơ và cam kết chuyển đổi tín chỉ.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1.5">
                <span className="text-[11px] font-bold text-primary uppercase block">Thời hạn nộp hồ sơ S27</span>
                <span className="text-base font-extrabold text-on-surface block">
                  {university.applicationDeadlineS27 || 'Chưa có deadline trong tài liệu đối tác'}
                </span>
                <span className="text-[11px] text-on-surface-variant">Sinh viên cần chuẩn bị đầy đủ hồ sơ trước hạn chót</span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-1.5">
                <span className="text-[11px] font-bold text-secondary uppercase block">Loại thị thực du học (Visa)</span>
                <span className="text-base font-extrabold text-on-surface block">
                  {university.visaType || 'Chưa có dữ liệu visa trong tài liệu đối tác'}
                </span>
                <span className="text-[11px] text-on-surface-variant">Được cấp theo Thư chấp nhận (Letter of Acceptance)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-2">
                <h3 className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Điều kiện học vụ bắt buộc</span>
                </h3>
                <ul className="space-y-1.5 text-on-surface-variant list-disc pl-4 leading-relaxed">
                  <li>GPA chung S27: <strong>≥ {S27_RULES.gpa4Minimum.toFixed(2)}/4.0</strong> hoặc <strong>≥ {S27_RULES.gpa10Minimum.toFixed(2)}/10.0</strong>.</li>
                  <li>Ngoại ngữ riêng đối tác: <strong>{university.requirements || 'Chưa có dữ liệu yêu cầu riêng'}</strong>.</li>
                  <li>Hoàn thành tối thiểu {S27_RULES.completedSemestersMinimum} học kỳ và tích lũy ít nhất {S27_RULES.accumulatedCreditsMinimum} tín chỉ FTU.</li>
                  <li>Không tham gia trao đổi vào học kỳ cuối khóa tốt nghiệp.</li>
                </ul>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-2">
                <h3 className="font-bold text-secondary flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-base">swap_horiz</span>
                  <span>Cam kết số lượng môn học</span>
                </h3>
                <ul className="space-y-1.5 text-on-surface-variant list-disc pl-4 leading-relaxed">
                  <li>Học <strong>tối thiểu {S27_RULES.hostCoursesMinimum} học phần</strong> tại trường đối tác.</li>
                  <li>Chuyển điểm về <strong>tối thiểu {S27_RULES.transferredCoursesMinimum} học phần</strong> tương đương tại FTU.</li>
                  <li>Chi tiết thủ tục và thời hạn phải đối chiếu trực tiếp với quy trình S27 và thông báo của trường đối tác.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
