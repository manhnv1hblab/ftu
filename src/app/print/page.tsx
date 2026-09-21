'use client';

import React from 'react';
import Link from 'next/link';
import { useStudent } from '../../context/StudentContext';
import universitiesData from '../../../data/universities_s27.json';
import { PartnerUniversity } from '../../types/university';
import { PreferenceRank } from '../../types/preference';

const ranks: PreferenceRank[] = ['nv1', 'nv2', 'nv3'];

export default function PrintPlanPage() {
  const { profile, rankedChoices, preferredUniversities } = useStudent();
  const rawUnis = universitiesData as PartnerUniversity[];
  const generatedAt = new Date().toLocaleString('vi-VN');
  const selectedCount = ranks.filter(rank => preferredUniversities[rank]).length;
  const draftedCount = ranks.filter(rank => rankedChoices[rank]?.transferredCourses?.length).length;
  const languageSummary = profile.languageCertificate?.isValid && profile.languageCertificate.testName && profile.languageCertificate.score
    ? `${profile.languageCertificate.testName} ${profile.languageCertificate.score}`
    : 'Chưa có dữ liệu / cần xác minh';

  return (
    <div className="bg-white min-h-screen text-black p-6 sm:p-10 max-w-4xl mx-auto space-y-8 print:p-0 print:max-w-none">
      <div className="no-print bg-surface-container-low p-4 rounded-2xl border border-surface-container flex items-center justify-between shadow-xs">
        <Link href="/planner" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại trang Lập kế hoạch
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant hidden sm:inline">Khuyến nghị: Chọn “Lưu dưới dạng PDF” trong hộp thoại in.</span>
          <button onClick={() => window.print()} className="px-5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">print</span>
            In bản kế hoạch này (A4)
          </button>
        </div>
      </div>

      <div className="border-b-2 border-black pb-4 text-center space-y-1">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700">
          <span>TRƯỜNG ĐẠI HỌC NGOẠI THƯƠNG</span>
          <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-600 pb-2">
          <span>PHÒNG HỢP TÁC QUỐC TẾ (P.HTQT)</span>
          <span>Độc lập - Tự do - Hạnh phúc</span>
        </div>
        <h1 className="text-lg sm:text-xl font-extrabold uppercase pt-2 text-black tracking-tight">BẢN DỰ THẢO KẾ HOẠCH HỌC TẬP TRAO ĐỔI SINH VIÊN S27</h1>
        <p className="text-xs italic text-gray-700">Chương trình trao đổi sinh viên đi Học kỳ II năm học 2026 – 2027</p>
        <p className="text-[10px] font-semibold text-gray-600 uppercase">DỰ THẢO — không thay thế phê duyệt chính thức của P.HTQT hoặc Bộ môn</p>
        <p className="text-[10px] text-gray-600">Thời điểm xuất bản: {generatedAt} · Đã chọn {selectedCount}/3 trường · Đã lập {draftedCount}/3 phương án</p>
      </div>

      <div className="space-y-2 text-xs">
        <h2 className="font-bold uppercase text-gray-900 border-b border-gray-300 pb-1">I. THÔNG TIN HỌC VỤ SINH VIÊN</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 pt-1">
          <div>Khóa: <strong>{profile.cohort || 'Chưa xác minh'}</strong></div>
          <div>Ngành: <strong>{profile.major || 'Chưa xác minh'}</strong></div>
          <div>Chương trình: <strong>{profile.program || 'Chưa xác minh'}</strong></div>
          <div>GPA Hệ 4: <strong>{profile.gpa4.toFixed(2)}</strong></div>
          <div>GPA Hệ 10: <strong>{profile.gpa10.toFixed(2)}</strong></div>
          <div>Số TC tích lũy: <strong>{profile.accumulatedCredits} TC</strong></div>
          <div>Ngoại ngữ: <strong>{languageSummary}</strong></div>
          <div>TTGK: <strong>{profile.hasPassedMidtermInternship === null ? 'Chưa xác minh' : profile.hasPassedMidtermInternship ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</strong></div>
          <div>Sinh viên tiêu biểu: <strong>{profile.hasExemplaryStudentAward === null ? 'Chưa xác minh' : profile.hasExemplaryStudentAward ? 'Có giấy khen' : 'Không có'}</strong></div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <h2 className="font-bold uppercase text-gray-900 border-b border-gray-300 pb-1">II. DANH SÁCH NGUYỆN VỌNG</h2>
        <table className="w-full text-left border border-black divide-y divide-black text-[11px]">
          <thead className="bg-gray-100 font-bold"><tr>
            <th className="py-2 px-2 border-r border-black text-center w-12">NV</th>
            <th className="py-2 px-2 border-r border-black">Trường đối tác</th>
            <th className="py-2 px-2 border-r border-black">Quốc gia</th>
            <th className="py-2 px-2 border-r border-black text-center">Môn FTU</th>
            <th className="py-2 px-2 border-r border-black text-center">Môn host</th>
            <th className="py-2 px-2 text-center">Trạng thái</th>
          </tr></thead>
          <tbody className="divide-y divide-black">
            {ranks.map(rank => {
              const preference = preferredUniversities[rank];
              const plan = rankedChoices[rank];
              const uni = preference ? rawUnis.find(item => item.id === preference.universityId) : undefined;
              const hostCount = plan ? plan.transferredCourses.length + (plan.hostAdditionalCourses?.length || 0) : null;
              return <tr key={rank}>
                <td className="py-2 px-2 border-r border-black text-center font-bold">{rank.toUpperCase()}</td>
                <td className="py-2 px-2 border-r border-black font-semibold">{uni?.name || preference?.universityName || 'Chưa chọn trường'}</td>
                <td className="py-2 px-2 border-r border-black">{uni?.country || '—'}</td>
                <td className="py-2 px-2 border-r border-black text-center font-bold">{plan ? `${plan.transferredCourses.length} môn` : '—'}</td>
                <td className="py-2 px-2 border-r border-black text-center font-bold">{hostCount === null ? '—' : `${hostCount} môn`}</td>
                <td className="py-2 px-2 text-center">{!preference ? 'Chưa chọn' : !plan ? 'Chưa lập phương án' : plan.status === 'VALID' ? 'Đủ dữ liệu theo rule hiện tại' : 'Dự thảo / cần xác minh'}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 text-xs">
        <h2 className="font-bold uppercase text-gray-900 border-b border-gray-300 pb-1">III. CHI TIẾT KẾ HOẠCH MÔN HỌC DỰ KIẾN</h2>
        {ranks.map(rank => {
          const preference = preferredUniversities[rank];
          const plan = rankedChoices[rank];
          const uni = preference ? rawUnis.find(item => item.id === preference.universityId) : undefined;
          if (!preference) return <div key={rank} className="border border-dashed border-gray-400 p-3 rounded-xl italic text-gray-500">{rank.toUpperCase()}: Chưa chọn trường.</div>;
          if (!plan) return <div key={rank} className="border border-dashed border-amber-500 p-3 rounded-xl text-amber-800">{rank.toUpperCase()}: {uni?.name || preference.universityName} — Chưa lập phương án môn học.</div>;
          return <div key={rank} className="space-y-2 border border-gray-400 p-3 rounded-xl">
            <div className="flex justify-between items-center font-bold text-[12px] bg-gray-100 p-2 rounded-lg"><span>{rank.toUpperCase()}: {uni?.name || plan.universityName}</span><span>{uni?.country || '—'}</span></div>
            <p className="text-[10px] text-gray-600">Trạng thái: {plan.status || 'NEEDS_VERIFICATION'} · Nguồn dữ liệu: tài liệu S27 đã chuẩn hóa</p>
            <table className="w-full text-left border border-gray-300 divide-y divide-gray-300 text-[11px]"><thead className="bg-gray-50 font-bold"><tr>
              <th className="py-1.5 px-2 border-r border-gray-300">Môn tại đối tác</th><th className="py-1.5 px-2 border-r border-gray-300">Mã đối tác</th><th className="py-1.5 px-2 border-r border-gray-300">Môn quy đổi FTU</th><th className="py-1.5 px-2 border-r border-gray-300">Mã FTU</th><th className="py-1.5 px-2 text-center">TC</th>
            </tr></thead><tbody className="divide-y divide-gray-300">
              {plan.transferredCourses.map((course, index) => <tr key={`${course.equivalenceId}-${index}`}><td className="py-1 px-2 border-r border-gray-300 font-medium">{course.hostCourseName}</td><td className="py-1 px-2 border-r border-gray-300 font-mono">{course.hostCourseCode || '—'}</td><td className="py-1 px-2 border-r border-gray-300 font-medium">{course.ftuCourseName}</td><td className="py-1 px-2 border-r border-gray-300 font-mono font-bold">{course.ftuCourseCode}</td><td className="py-1 px-2 text-center font-bold">{course.ftuCredits}</td></tr>)}
            </tbody></table>
            {plan.hostAdditionalCourses?.length ? <p className="text-[11px] text-gray-700 pt-1"><strong>Môn bổ sung tại đối tác:</strong> {plan.hostAdditionalCourses.map(course => course.hostCourseName).join('; ')}</p> : null}
            {plan.graduationSimulation?.riskWarnings?.length ? <p className="text-[11px] text-amber-800"><strong>Cảnh báo:</strong> {plan.graduationSimulation.riskWarnings.join(' ')}</p> : null}
          </div>;
        })}
      </div>

      <div className="space-y-3 text-xs pt-4 border-t border-black">
        <h2 className="font-bold uppercase text-gray-900">IV. CAM KẾT VÀ LƯU Ý</h2>
        <p className="text-gray-800 text-[11px] leading-relaxed">Tài liệu này là bản tư vấn dự thảo dựa trên dữ liệu S27 đã được chuẩn hóa. Các mapping PENDING/UNCERTAIN, điều kiện chưa đủ dữ liệu và mô phỏng tốt nghiệp cần được xác minh với P.HTQT/Bộ môn trước khi sử dụng cho hồ sơ chính thức.</p>
        <p className="text-gray-800 text-[11px] leading-relaxed">Người dùng chịu trách nhiệm kiểm tra thông tin cá nhân, lựa chọn học phần và các yêu cầu của trường đối tác trước khi nộp hồ sơ.</p>
        <div className="grid grid-cols-2 text-center pt-8 text-xs"><div className="space-y-16"><span className="font-bold block uppercase">Xác nhận của Bộ môn / P.HTQT</span><span className="text-gray-400 italic block">(Ký và ghi rõ họ tên)</span></div><div className="space-y-16"><div><span className="italic block text-[11px]">Hà Nội, ngày ..... tháng ..... năm 202...</span><span className="font-bold block uppercase mt-1">Người lập kế hoạch</span></div><span className="text-gray-400 italic block">(Ký và ghi rõ họ tên)</span></div></div>
      </div>
    </div>
  );
}
