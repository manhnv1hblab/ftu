'use client';

import React from 'react';
import Link from 'next/link';
import { useStudent } from '../../context/StudentContext';
import universitiesData from '../../../data/universities_s27.json';
import { PartnerUniversity } from '../../types/university';

export default function PrintPlanPage() {
  const { profile, rankedChoices } = useStudent();
  const rawUnis = universitiesData as PartnerUniversity[];

  const handlePrint = () => {
    window.print();
  };

  const ranks: ('nv1' | 'nv2' | 'nv3')[] = ['nv1', 'nv2', 'nv3'];
  const activeChoices = ranks
    .map(r => ({ rank: r, plan: rankedChoices[r] }))
    .filter(item => item.plan !== undefined);

  return (
    <div className="bg-white min-h-screen text-black p-6 sm:p-10 max-w-4xl mx-auto space-y-8 print:p-0 print:max-w-none">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print bg-surface-container-low p-4 rounded-2xl border border-surface-container flex items-center justify-between shadow-xs">
        <Link
          href="/planner"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Quay lại trang Lập kế hoạch</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant hidden sm:inline">
            Khuyến nghị: Chọn &quot;Lưu dưới dạng PDF&quot; trong hộp thoại in.
          </span>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>In bản kế hoạch này (A4)</span>
          </button>
        </div>
      </div>

      {/* Official Document Header */}
      <div className="border-b-2 border-black pb-4 text-center space-y-1">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700">
          <span>TRƯỜNG ĐẠI HỌC NGOẠI THƯƠNG</span>
          <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-600 pb-2">
          <span>PHÒNG HỢP TÁC QUỐC TẾ (P.HTQT)</span>
          <span>Độc lập - Tự do - Hạnh phúc</span>
        </div>

        <h1 className="text-lg sm:text-xl font-extrabold uppercase pt-2 text-black tracking-tight">
          BẢN KẾ HOẠCH HỌC TẬP TRAO ĐỔI SINH VIÊN S27
        </h1>
        <p className="text-xs italic text-gray-700">
          Chương trình trao đổi sinh viên đi Học kỳ II năm học 2026 – 2027 (Kỳ học Mùa Xuân 2027)
        </p>
      </div>

      {/* Student Academic Profile Summary */}
      <div className="space-y-2 text-xs">
        <h2 className="font-bold uppercase text-gray-900 border-b border-gray-300 pb-1">
          I. THÔNG TIN HỌC VỤ SINH VIÊN
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 pt-1">
          <div>Khóa: <strong>{profile.cohort}</strong></div>
          <div>Ngành: <strong>{profile.major}</strong></div>
          <div>Chương trình: <strong>{profile.program}</strong></div>
          <div>GPA Hệ 4: <strong>{profile.gpa4.toFixed(2)}</strong> (Yêu cầu ≥ 2.80)</div>
          <div>GPA Hệ 10: <strong>{profile.gpa10.toFixed(2)}</strong> (Yêu cầu ≥ 7.50)</div>
          <div>Số TC tích lũy: <strong>{profile.accumulatedCredits} TC</strong></div>
          <div>Ngoại ngữ: <strong>{profile.languageCertificate?.testName || 'B2 CEFR'} ({profile.languageCertificate?.score || 'Đạt'})</strong></div>
          <div>Thực tập giữa khóa (TTGK): <strong>{profile.hasPassedMidtermInternship ? 'Đã hoàn thành' : 'Chưa'}</strong></div>
          <div>Sinh viên tiêu biểu: <strong>{profile.hasExemplaryStudentAward ? 'Có giấy khen' : 'Không'}</strong></div>
        </div>
      </div>

      {/* Ranked Preferences Overview */}
      <div className="space-y-2 text-xs">
        <h2 className="font-bold uppercase text-gray-900 border-b border-gray-300 pb-1">
          II. DANH SÁCH NGUYỆN VỌNG ĐÃ XẾP HẠNG
        </h2>

        {activeChoices.length > 0 ? (
          <table className="w-full text-left border border-black divide-y divide-black text-[11px]">
            <thead className="bg-gray-100 font-bold">
              <tr>
                <th className="py-2 px-2 border-r border-black text-center w-12">Thứ tự</th>
                <th className="py-2 px-2 border-r border-black">Trường đối tác</th>
                <th className="py-2 px-2 border-r border-black">Quốc gia</th>
                <th className="py-2 px-2 border-r border-black text-center">Môn chuyển về FTU</th>
                <th className="py-2 px-2 border-r border-black text-center">Tổng môn đối tác</th>
                <th className="py-2 px-2 text-center">Điều kiện HPTN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {activeChoices.map(({ rank, plan }) => {
                const uni = rawUnis.find(u => u.id === plan!.universityId);
                const totalHost = plan!.transferredCourses.length + (plan!.hostAdditionalCourses?.length || 0);

                return (
                  <tr key={rank}>
                    <td className="py-2 px-2 border-r border-black text-center font-bold">
                      {rank.toUpperCase()}
                    </td>
                    <td className="py-2 px-2 border-r border-black font-semibold">
                      {uni?.name || plan!.universityName}
                    </td>
                    <td className="py-2 px-2 border-r border-black">
                      {uni?.country || '—'}
                    </td>
                    <td className="py-2 px-2 border-r border-black text-center font-bold">
                      {plan!.transferredCourses.length} môn
                    </td>
                    <td className="py-2 px-2 border-r border-black text-center font-bold">
                      {totalHost} môn
                    </td>
                    <td className="py-2 px-2 text-center">
                      {plan?.graduationSimulation?.thesisEligible ? 'Đủ điều kiện (Nợ ≤ 6 TC)' : 'Đang xét duyệt'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic">Chưa xếp trường vào các nguyện vọng NV1 - NV3.</p>
        )}
      </div>

      {/* Detailed Course Plan for Ranked Choices */}
      <div className="space-y-4 text-xs">
        <h2 className="font-bold uppercase text-gray-900 border-b border-gray-300 pb-1">
          III. CHI TIẾT KẾ HOẠCH MÔN HỌC QUY ĐỔI (THỎA THUẬN HỌC TẬP DỰ KIẾN)
        </h2>

        {activeChoices.map(({ rank, plan }) => {
          const uni = rawUnis.find(u => u.id === plan!.universityId);

          return (
            <div key={rank} className="space-y-2 border border-gray-400 p-3 rounded-xl">
              <div className="flex justify-between items-center font-bold text-[12px] bg-gray-100 p-2 rounded-lg">
                <span>{rank.toUpperCase()}: {uni?.name || plan!.universityName}</span>
                <span>{uni?.country}</span>
              </div>

              {/* Transferred courses table */}
              <table className="w-full text-left border border-gray-300 divide-y divide-gray-300 text-[11px]">
                <thead className="bg-gray-50 font-bold">
                  <tr>
                    <th className="py-1.5 px-2 border-r border-gray-300">Môn học tại đối tác</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Mã đối tác</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Học phần quy đổi FTU</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Mã FTU</th>
                    <th className="py-1.5 px-2 text-center">Số TC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {plan!.transferredCourses.map((c, i) => (
                    <tr key={i}>
                      <td className="py-1 px-2 border-r border-gray-300 font-medium">{c.hostCourseName}</td>
                      <td className="py-1 px-2 border-r border-gray-300 font-mono">{c.hostCourseCode || '—'}</td>
                      <td className="py-1 px-2 border-r border-gray-300 font-medium">{c.ftuCourseName}</td>
                      <td className="py-1 px-2 border-r border-gray-300 font-mono font-bold">{c.ftuCourseCode}</td>
                      <td className="py-1 px-2 text-center font-bold">{c.ftuCredits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {plan!.hostAdditionalCourses && plan!.hostAdditionalCourses.length > 0 && (
                <div className="text-[11px] text-gray-700 pt-1">
                  <strong>Các môn học bổ sung tại đối tác:</strong>{' '}
                  {plan!.hostAdditionalCourses.map(c => c.hostCourseName).join('; ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Student Commitment & Signatures */}
      <div className="space-y-3 text-xs pt-4 border-t border-black">
        <h2 className="font-bold uppercase text-gray-900">
          IV. CAM KẾT CỦA SINH VIÊN
        </h2>
        <p className="text-gray-800 text-[11px] leading-relaxed">
          Tôi xin cam kết: Đã đọc và hiểu rõ Quy trình tham gia CTTĐ học kỳ II năm học 2026 – 2027; cam kết học tối thiểu 05 học phần tại trường đối tác và hoàn thành thủ tục chuyển điểm về tối thiểu 03 học phần tương đương tại FTU; chấp hành nghiêm túc pháp luật nước sở tại và các quy chế đào tạo hiện hành của Trường Đại học Ngoại thương.
        </p>

        <div className="grid grid-cols-2 text-center pt-8 text-xs">
          <div className="space-y-16">
            <span className="font-bold block uppercase">Xác nhận của Bộ môn / P.HTQT</span>
            <span className="text-gray-400 italic block">(Ký và ghi rõ họ tên)</span>
          </div>

          <div className="space-y-16">
            <div>
              <span className="italic block text-[11px]">Hà Nội, ngày ..... tháng ..... năm 202...</span>
              <span className="font-bold block uppercase mt-1">Người lập kế hoạch</span>
            </div>
            <span className="text-gray-400 italic block">(Ký và ghi rõ họ tên)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
