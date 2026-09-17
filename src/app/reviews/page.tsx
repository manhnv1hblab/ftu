'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ReviewsPage() {
  const [selectedUni, setSelectedUni] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const reviews = [
    {
      id: 1,
      author: 'Thảo Linh',
      cohort: 'K59 QTKDQT',
      uni: 'Audencia Business School (Pháp)',
      uniKey: 'audencia',
      term: 'Kỳ Thu 2024 (Nantes, Pháp)',
      rating: 5.0,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-tVoKLOxr_mMnxDrZpdWWI1Z4BMfS_gCwtAsyEz0_FmWf1Bs2N3Qdvv5ap-9rTlpBLacVFLMfGZDiKgmR5tMu6WCAJ4WrKBwXhZD2CpgSOfUKvpHoFqVFsxwqumDcp2Ih3LTUMDfhm31rgjsDkEYGBAagk1tEB27uZaOLadD3H0-mo1ocUkVR3RXqPYALLea1foi14JnqPLZ3udAkRsZmrHH2VrbWzpbOaA-pVlWxhjzkQLv5c1Ri',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy6n-dVxW19wKcJJt2WX2x2BHYQWCpzd9B2RGqjxvtIbCa2i6r8-V7tpwW_f8l4qEDjtCy1ATkTDoCCq7CY6n_w9-0_vf_M77ZhlElSGql_LFmhzDVhA_kqynBneIGTVcLQpvq9LozYegl6F8qSRTOAa5OKaFDVQGceQFxX4nZxVRDnk2y7818BHjWayMaZqV7qAA1muDGfTeI2EPL9Z9CQr1XLSAcPF1mzw1VAXc0b75tIuW-nMBH',
      tags: ['Du lịch & Visa Schengen', 'Hỗ trợ thuê nhà CAF', 'Môn Supply Chain'],
      title: 'Bí kíp du lịch 15 nước Schengen và cách xin trợ cấp nhà ở CAF giảm 40% tiền thuê',
      content: 'Chào các FTUers! Kỳ trao đổi tại Nantes vừa rồi là trải nghiệm đáng giá nhất thời đại học của mình. Điểm mấu chốt nhất khi sang Pháp là làm hồ sơ CAF (Caisse d\'Allocations Familiales) ngay tuần đầu tiên: nhà mình 450€ được trừ thẳng còn 270€/tháng! Môn Global Supply Chain Management bên Audencia tương đương 100% với môn Quản trị Chuỗi cung ứng FTU, giáo sư cực kỳ thân thiện và tạo điều kiện làm bài thi sớm.',
      tip: 'Đăng ký trước syllabus tháng 6 gửi cô H. (BM QTKD) thẩm định trước khi bay để bảo đảm 100% được quy đổi điểm A!',
      cost: '~18 tr/tháng',
      transferredCredits: '15 tín chỉ'
    },
    {
      id: 2,
      author: 'Hoàng Minh',
      cohort: 'K59 KTĐN',
      uni: 'Chung-Ang University (Hàn Quốc)',
      uniKey: 'cau',
      term: 'Kỳ Thu 2023 (Seoul, Hàn Quốc)',
      rating: 4.8,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_pFEfte_XSyfbXcu0pe0i7IKiU4pEnChPulVMnsSxA7kgLe3Edwrk7Uq79KkMY-XsSgERFuZZ2g6p5VpknTEgR07CbrgKGeF9mth08wq5SpgmBrSxxOLbCg9-URi1QBPn3Qb-E0m0rK8YeG_qVh_d4yfPkTmIaobafM2sTkrtab_lWpPndyVBxAd_bThllqk5Ed3oCvwk890bJ3geauNVxijzdZMTR_q5uSEjwMYAtvT8S7h1FK4h',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBysOkM9Wc3oDT8XySTc6rMshRGrCVpuCQyX-5KKPJQo0dR_CljaXPM3H6IDXBKkz51l2PECTAMsuYNWljFtxEse_Dd1fl-sIwE2uk75hr8ifwChcbbrR0XNIj_UtlUFNAgpRo8AZ581INWdPch_CHAptu2Ht9rj1TW62HfoOlUzDOfOnalDhITlmvSJJZRAIDJoPOUqYca8ZPntaw7XX9ggxIWgI61gPbCCdKTNcXTjhygSUXmHJLe',
      tags: ['Sống tại Seoul', 'KTX Blue Mir Hall', 'Học bổng GKS'],
      title: 'Trải nghiệm học tập tại Thủ đô Seoul và kinh nghiệm đăng ký KTX Blue Mir Hall',
      content: 'Môi trường học tại CAU vô cùng năng động, cơ sở vật chất chuẩn quốc tế. Mình đăng ký được KTX Blue Mir Hall ngay trong campus trường nên tiết kiệm được rất nhiều thời gian di chuyển. Đồ ăn trong cantin trường có giá ưu đãi cho sinh viên, chỉ khoảng 4,000 - 5,500 KRW/bữa. Cộng đồng FTUer ở CAU rất đông đảo và luôn hỗ trợ nhau làm thủ tục ngoại kiều ARC.',
      tip: 'Nên chuẩn bị bảng điểm tiếng Anh có dấu giáp lai của FTU để làm thủ tục nộp học bổng Global Korea Scholarship!',
      cost: '~15 tr/tháng',
      transferredCredits: '12 tín chỉ'
    },
    {
      id: 3,
      author: 'Khánh An',
      cohort: 'K60 TCNH',
      uni: 'Oita University (Nhật Bản)',
      uniKey: 'oita',
      term: 'Kỳ Thu 2024 (Kyushu, Nhật Bản)',
      rating: 4.9,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXoh-yGm6N5n-Vdvayj9knH1MNBAVP24FJ4AUQsJQ1biHizC4hsFvigXlqbcl4bty1zoJB3f6J123hu-P-7GrC1gcAC6zM32nO5jybApKCqRvuumDbdpnDVLcqd_dg0PRu6V22J9uuY_6dkUaV_392PyeKplC8FA_qlqHYmUIQytevYs-bdZs-ey0pb3Y-rWo5apEQqrPAWJLuXV1Xao_WJ0l-8WHWlMhdeK6jbwzrUvb6UMV0meYR',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyfjIpzYbDP1CpfiPUNzQnJ6RIduGi9pZwhYCPSnh1VZ-qhvPnRV4tnFyacy5sn-HMiBL4mMAu4Ug7-xqOQAzz55TJMkCnmdstUb1HBIb7bLxKtGdadMk00zxR_iJIe7CeUb31vD7R3AGSsVwM5GUDty2jmFtfnE7m-bbIpjWZdSyFQYY3c13d6eMglSVPn8lT3HCR1HFKB_4c_IpbjkrVpKsrHpaYNata0LH9npO0jLwxQph7yuy4',
      tags: ['Học bổng JASSO', 'Chi phí siêu tiết kiệm', 'Văn hóa Onsen'],
      title: 'Học bổng JASSO 80.000 Yên/tháng & Cuộc sống an yên tại xứ sở Onsen Oita',
      content: 'Nếu bạn yêu thích nước Nhật nhưng e ngại chi phí đắt đỏ ở Tokyo, Oita chính là thiên đường! Tiền phòng KTX Kokusai Kaikan chỉ vỏn vẹn 12.000 Yên/tháng, phòng đơn khép kín tiện nghi. Nhờ có học bổng JASSO cấp hàng tháng, mình hoàn toàn tự trang trải được sinh hoạt phí và còn dư để đi du lịch khám phá Fukuoka, Kyoto, Osaka dịp nghỉ lễ.',
      tip: 'Môn Kinh tế Châu Á và Tài chính Quốc tế tại Oita dạy bằng 100% tiếng Anh, thi cử dưới dạng tiểu luận nhóm rất thực tế!',
      cost: '~10 tr/tháng',
      transferredCredits: '9 tín chỉ'
    }
  ];

  const filteredReviews = reviews.filter(r => {
    if (selectedUni !== 'all' && r.uniKey !== selectedUni) return false;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Disclaimer Notice Banner */}
      <div className="w-full bg-amber-50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 text-amber-900">
          <span className="material-symbols-outlined text-amber-600">info</span>
          <p className="font-body-sm text-body-sm leading-snug">
            <strong>Lưu ý:</strong> Nền tảng chỉ hỗ trợ tra cứu và chia sẻ kinh nghiệm tham khảo từ cựu sinh viên. Thủ tục công nhận tín chỉ chính thức do Phòng Quản lý Đào tạo FTU thẩm định.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 text-amber-950 font-label-sm text-label-sm rounded-full font-bold">
          <span className="material-symbols-outlined text-xs">verified</span> 100% FTUers Đã Xác Thực
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-container to-secondary text-on-primary p-6 sm:p-10 lg:p-12 shadow-xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md self-start text-white font-label-md text-label-md font-bold">
              <span className="material-symbols-outlined text-sm">star</span>
              <span>FTU Alumni Voice Hub • Mạng Lưới Cựu Du Học Sinh</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-white leading-tight">
              Góc Chia Sẻ Trải Nghiệm Thực Tế từ <span className="underline decoration-wavy decoration-white/40 underline-offset-8">FTUers Toàn Cầu</span>
            </h1>
            <p className="font-body-lg text-body-lg text-white/90 max-w-2xl leading-relaxed">
              Học hỏi từ những người đi trước để có một kỳ trao đổi rực rỡ, tích lũy kiến thức quốc tế và luôn an tâm bảo đảm tốt nghiệp đúng hạn tại Ngoại Thương.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/planner"
                className="px-6 py-3.5 rounded-full bg-white text-primary font-label-lg text-label-lg shadow-lg hover:bg-surface-container-low transition-all font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                <span>Bắt đầu lập kế hoạch ngay</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="bg-surface-container-lowest text-on-surface rounded-2xl p-5 shadow-xl flex flex-col items-center text-center max-w-xs w-full">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl mb-2">
                🦊
              </div>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                Foxie Ngoại Thương
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                "Kỳ trao đổi không chỉ là điểm số, mà là hành trình tự khẳng định bản lĩnh toàn cầu!"
              </p>
              <div className="w-full mt-3 pt-3 flex items-center justify-around bg-surface-container-low rounded-xl py-2">
                <div className="flex flex-col items-center">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">100%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Sinh viên FTU</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">116+</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Đối tác S27</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Impact Scoreboard with 3D Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container flex items-center gap-4 hover:border-primary/30 transition-all group">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/images/3d_scholarship.jpg"
              alt="3D Satisfaction"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface">4.9</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ 5.0 Hài Lòng</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Đánh giá chất lượng giảng dạy & hỗ trợ sinh viên
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container flex items-center gap-4 hover:border-emerald-300 transition-all group">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/images/3d_graduation.jpg"
              alt="3D On Time Graduation"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold text-emerald-800">
              96% Tốt nghiệp đúng hạn
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Nhờ quy đổi trọn vẹn từ 9-18 tín chỉ/kỳ
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container flex items-center gap-4 hover:border-primary/30 transition-all group">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/images/3d_passport.jpg"
              alt="3D Reviews & Guides"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-lg text-headline-lg font-bold text-primary">120+</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Bài Viết Chi Tiết</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Chứa syllabus mẫu, chi phí và thủ tục visa
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="font-label-md text-label-md font-bold text-on-surface">Lọc theo trường:</span>
          <select
            value={selectedUni}
            onChange={(e) => setSelectedUni(e.target.value)}
            className="px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả các trường đối tác</option>
            <option value="audencia">Audencia Business School (Pháp)</option>
            <option value="cau">Chung-Ang University (Hàn Quốc)</option>
            <option value="oita">Oita University (Nhật Bản)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedUni('all')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${selectedUni === 'all' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'
              }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedUni('audencia')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${selectedUni === 'audencia' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'
              }`}
          >
            Châu Âu
          </button>
          <button
            onClick={() => setSelectedUni('cau')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${selectedUni === 'cau' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'
              }`}
          >
            Hàn Quốc
          </button>
          <button
            onClick={() => setSelectedUni('oita')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${selectedUni === 'oita' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'
              }`}
          >
            Nhật Bản
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.map((rev) => (
          <article
            key={rev.id}
            className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-all gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-surface-container pb-3">
                <div className="flex items-center gap-3">
                  <img
                    alt={rev.author}
                    src={rev.avatar}
                    className="w-11 h-11 rounded-full object-cover shadow-xs ring-2 ring-primary/10"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        {rev.author}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold">
                        {rev.cohort}
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant block truncate max-w-[180px]">
                      {rev.uni}
                    </span>
                  </div>
                </div>

                <div className="flex text-amber-500">
                  <span className="material-symbols-outlined text-sm">star</span>
                  <span className="font-bold text-xs ml-1 text-on-surface">{rev.rating}</span>
                </div>
              </div>

              <div className="relative h-40 rounded-xl overflow-hidden shadow-inner">
                <img alt={rev.title} src={rev.image} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 text-xs font-bold text-tertiary shadow-xs">
                  {rev.transferredCredits} quy đổi
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {rev.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <h3 className="font-headline-sm text-headline-sm text-primary font-bold leading-snug">
                {rev.title}
              </h3>

              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-3">
                {rev.content}
              </p>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-1 text-xs">
              <span className="font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                Mẹo học vụ:
              </span>
              <p className="text-on-surface-variant">{rev.tip}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
