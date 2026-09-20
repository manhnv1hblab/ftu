'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import universitiesData from '../../data/universities_s27.json';
import equivalencesData from '../../data/equivalences_s27.json';
import costsData from '../../data/costs_by_country.json';
import { PartnerUniversity } from '../types/university';
import { CourseEquivalence } from '../types/equivalence';

const FEATURED_CAMPUS_IMAGES: Record<string, string> = {
  'chung-ang-university': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  'audencia-business-school': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  'nagoya-university': 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
  'kobe-university': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  'sciences-po': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
  'shanghai-university-of-finance-and-economics': 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
};

export default function HomePage() {
  const rawUnis = universitiesData as PartnerUniversity[];
  const rawEqs = equivalencesData as CourseEquivalence[];

  const totalUnis = rawUnis.length;
  const uniqueCountries = new Set(rawUnis.map(u => u.country)).size;
  const approvedEquivalences = rawEqs.filter(e => e.status === 'APPROVED').length;
  const featuredUni = rawUnis[0];
  const featuredEqCount = featuredUni ? rawEqs.filter(e => e.partnerS27Id === featuredUni.id && e.status === 'APPROVED').length : 0;

  return (
    <div className="flex flex-col w-full pb-20 space-y-12">
      {/* Interactive Banner / Disclaimer Reminder (Exact Stitch Brand Standard) */}
      <div className="w-full max-w-7xl mx-auto px-space-lg pt-space-md">
        <div className="bg-amber-50 text-amber-900 rounded-full px-space-md py-space-xs flex items-center justify-between shadow-xs border border-amber-200 text-xs">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              info
            </span>
            <p className="font-body-sm text-body-sm truncate">
              <strong>Thông báo Kỳ S27 (Học kỳ II năm học 2026 – 2027):</strong> Công cụ tra cứu và mô phỏng tư vấn dựa trên các tài liệu S27 dành cho sinh viên đại học chính quy FTU.
            </p>
          </div>
          <Link
            className="hidden sm:inline-flex font-label-sm text-label-sm text-amber-900 hover:text-amber-950 font-bold underline pl-space-sm flex-shrink-0"
            href="/handbook"
          >
            Xem quy trình 11 bước
          </Link>
        </div>
      </div>

      {/* Hero Section (Playful Mascot, Dynamic Discovery, Visual Scale) */}
      <section className="relative w-full max-w-7xl mx-auto px-space-lg pt-space-md pb-space-xl overflow-hidden">
        {/* Ambient decorative blobs */}
        <div className="absolute -top-12 -left-12 w-96 h-96 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-secondary-fixed/50 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="inline-flex items-center gap-space-xs bg-primary/10 text-primary px-space-md py-1.5 rounded-full w-fit shadow-xs">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                travel_explore
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-xs font-bold">
                FTU Student Mobility Portal S27 (2026 - 2027)
              </span>
            </div>

            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-tight text-3xl sm:text-5xl font-extrabold">
              Chinh phục học kỳ{' '}
              <span className="text-primary relative inline-block">
                trao đổi quốc tế
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-primary-fixed-dim -z-10"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 12"
                >
                  <path d="M0,8 Q50,0 100,8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="6"></path>
                </svg>
              </span>{' '}
              cùng FTU GoGlobal
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed text-sm sm:text-base">
              Hệ thống hỗ trợ sinh viên Ngoại thương tìm kiếm trường đối tác phù hợp, tra cứu môn quy đổi tín chỉ và lập lộ trình học tập tối ưu mà không sợ trễ hạn tốt nghiệp!
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
              <Link
                className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-full font-label-lg text-label-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-xs sm:text-sm font-bold"
                href="/planner"
              >
                <span className="material-symbols-outlined text-xl">upload_file</span>
                <span>Tải lên CTĐT của bạn ngay 🚀</span>
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim rounded-full font-label-lg text-label-lg transition-all text-xs sm:text-sm font-bold"
                href="/partners"
              >
                <span>Khám phá {totalUnis} trường đối tác FTU</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>

            {/* Metrics Dashboard Strip */}
            <div className="grid grid-cols-3 gap-3 pt-space-md border-t border-surface-container">
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-xs hover:border-primary/30 transition-colors">
                <span className="block font-headline-lg font-extrabold text-primary text-2xl sm:text-3xl">{totalUnis}</span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Trường đối tác S27</span>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-xs hover:border-secondary/30 transition-colors">
                <span className="block font-headline-lg font-extrabold text-secondary text-2xl sm:text-3xl">{approvedEquivalences}</span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Môn duyệt chính thức</span>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-xs hover:border-tertiary/30 transition-colors">
                <span className="block font-headline-lg font-extrabold text-tertiary text-2xl sm:text-3xl">{uniqueCountries}</span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Quốc gia & Vùng</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card with 3D Pixar Mascot */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-surface-container-lowest rounded-3xl p-5 shadow-card-hover border border-surface-container/80 group">
              {/* Cute Floating 3D Badge */}
              <div className="absolute -top-3.5 -right-3.5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-primary/20 flex items-center gap-1.5 animate-float text-xs font-bold text-primary">
                <span className="material-symbols-outlined text-base text-amber-500">sparkles</span>
                <span>FTUer GoGlobal 3D</span>
              </div>

              <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-gradient-to-b from-primary/5 via-surface-container-low to-primary/10 mb-4 shadow-inner">
                <Image
                  src="/images/mascot_student.jpg"
                  alt="Linh vật 3D FTU GoGlobal Student Mascot"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"></div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                      Linh vật S27 FTU
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold">
                      Hộ chiếu trao đổi
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white/95 leading-snug">
                    Khám phá {uniqueCountries} quốc gia/vùng theo dữ liệu đối tác S27 • Mô phỏng tiến độ để tham khảo
                  </p>
                </div>
              </div>

              {/* Highlight Mini Card */}
              <div className="bg-surface-container-low/80 rounded-2xl p-4 space-y-2 border border-surface-container text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-on-surface">{featuredUni?.name || 'Chưa có trường được audit'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-primary">{featuredUni ? `${featuredUni.city ? `${featuredUni.city}, ` : ''}${featuredUni.country}` : 'Chưa có địa điểm'}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant text-[11px]">
                  <span>Học bổng/học phí: <strong className="text-emerald-700 font-bold">{featuredUni?.scholarship || 'Chưa có dữ liệu đã audit'}</strong></span>
                  <span>Môn tiền lệ: <strong className="text-primary font-bold">{featuredEqCount} môn duyệt</strong></span>
                </div>
                <Link
                  href={featuredUni ? `/partners/${featuredUni.id}` : '/partners'}
                  className="block w-full text-center py-2 rounded-xl bg-primary hover:bg-primary-container text-white font-bold transition-all text-xs shadow-xs"
                >
                  Xem chi tiết trường đối tác mẫu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Pipeline Overview Strip with 3D Icons */}
      <section className="w-full max-w-7xl mx-auto px-space-lg">
        <div className="text-center max-w-2xl mx-auto mb-space-lg space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            <span>QUY TRÌNH THÔNG MINH S27</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold text-2xl sm:text-3xl">
            5 bước tối ưu hóa kỳ trao đổi của bạn
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-xs sm:text-sm">
            Thuật toán đối soát 1-1, kiểm tra nghĩa vụ nhóm tự chọn và bảo đảm điều kiện làm Khóa luận tốt nghiệp
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              step: '1',
              title: 'Tải lên CTĐT',
              desc: 'Tải file Excel bảng điểm cá nhân hoặc dán mã môn để hệ thống nhận diện.',
              icon3d: '/images/3d_checklist.jpg',
            },
            {
              step: '2',
              title: 'Kiểm tra hồ sơ',
              desc: 'Rà soát GPA, số tín chỉ tích lũy, nhóm tự chọn và thực tập giữa khóa (TTGK).',
              icon3d: '/images/3d_graduation.jpg',
            },
            {
              step: '3',
              title: 'Chọn trường',
              desc: 'Tự động lọc các trường đối tác có ≥ 3 môn quy đổi hợp lệ theo Thông báo S27.',
              icon3d: '/images/3d_globe.jpg',
            },
            {
              step: '4',
              title: 'Lập phương án',
              desc: 'Ghép cặp 1-1 môn FTU ↔ đối tác, kiểm tra cam kết 5 môn và mô phỏng rủi ro.',
              icon3d: '/images/3d_scales.jpg',
            },
            {
              step: '5',
              title: 'So sánh & Xuất',
              desc: 'Xếp nguyện vọng NV1 - NV3, lưu bản nháp, xuất file JSON và in bản kế hoạch A4.',
              icon3d: '/images/3d_scholarship.jpg',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-surface-container-lowest rounded-3xl p-5 border border-surface-container shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                  <img
                    src={item.icon3d}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-label-sm text-primary font-extrabold uppercase text-[10px]">
                    Bước {item.step}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Partner Showcase Grid */}
      <section className="w-full max-w-7xl mx-auto px-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-space-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold text-xl sm:text-2xl">
              Trường đối tác tiêu biểu kỳ S27
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
              Các đại học có số lượng học phần quy đổi lớn và đa dạng học bổng song phương
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold hover:underline text-xs"
          >
            <span>Xem toàn bộ {totalUnis} trường đối tác S27</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {rawUnis.slice(0, 6).map((uni) => {
            const approvedCount = rawEqs.filter(
              e => e.partnerS27Id === uni.id && e.status === 'APPROVED'
            ).length;

            const img =
              FEATURED_CAMPUS_IMAGES[uni.id] ||
              (uni.region === 'Asia' ? FEATURED_CAMPUS_IMAGES['nagoya-university'] :
                uni.region === 'Europe' ? FEATURED_CAMPUS_IMAGES['audencia-business-school'] :
                  FEATURED_CAMPUS_IMAGES['default']);

            return (
              <article
                key={uni.id}
                className="bg-surface-container-lowest rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group border border-surface-container"
              >
                <div className="relative h-44 w-full overflow-hidden bg-surface-container-low">
                  <Image
                    src={img}
                    alt={uni.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold text-[10px]">
                      {uni.scholarship || 'Chưa có dữ liệu học bổng'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm font-semibold text-[10px]">
                      {uni.region}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                    <div className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span>{uni.country}</span>
                    </div>
                    <span className="bg-surface-container-lowest/30 px-2 py-0.5 rounded backdrop-blur-sm font-bold text-[10px]">
                      {uni.quota || 'Chưa có dữ liệu chỉ tiêu'}
                    </span>
                  </div>
                </div>

                <div className="p-space-md flex flex-col flex-grow justify-between gap-space-sm text-xs">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary transition-colors line-clamp-1 text-base">
                      {uni.name}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                      {uni.requirements || 'Chưa có yêu cầu riêng trong tài liệu nguồn.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-1 text-tertiary font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      <span>{approvedCount} môn đã duyệt</span>
                    </div>

                    <Link
                      href={`/partners/${uni.id}`}
                      className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold transition-all text-xs"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3D Mascot Advisor Assistant Callout Section */}
      <section className="w-full max-w-7xl mx-auto px-space-lg">
        <div className="bg-gradient-to-br from-primary/95 via-primary to-primary-container text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              <span>TRỢ LÝ HỌC VỤ 3D FTU</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Băn khoăn về môn tương đương & tiến độ tốt nghiệp?
            </h2>

            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
              Trợ lý học vụ 3D FTU GoGlobal sẽ đối chiếu các môn chưa học với dữ liệu đối tác và môn tương đương đã được chuẩn hóa từ tài liệu S27. Các kết quả thiếu dữ liệu sẽ được đánh dấu để xác minh.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/planner"
                className="px-6 py-3 rounded-full bg-white text-primary font-bold text-xs sm:text-sm shadow-md hover:bg-surface-container-low transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                <span>Bắt đầu lập kế hoạch ngay</span>
              </Link>
              <Link
                href="/handbook"
                className="px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm transition-all border border-white/30"
              >
                Đọc cẩm nang 11 bước S27
              </Link>
            </div>
          </div>

          {/* 3D Advisor Mascot Image */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl shrink-0 border-4 border-white/30 group">
            <Image
              src="/images/mascot_advisor.jpg"
              alt="3D Academic Advisor Mascot"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <span className="px-3 py-1 rounded-full bg-white/90 text-primary text-[11px] font-extrabold shadow-sm">
                Trợ lý Cố vấn Học vụ FTU 🎓
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
