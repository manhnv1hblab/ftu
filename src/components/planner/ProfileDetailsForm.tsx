'use client';

import React from 'react';
import { useStudent } from '../../context/StudentContext';

const inputClass = 'w-full rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary';
const labelClass = 'text-xs font-bold text-on-surface';

export const ProfileDetailsForm: React.FC = () => {
  const { profile, updateProfile } = useStudent();
  const language = profile.languageCertificate;

  const updateLanguage = (updates: Partial<typeof language>) => {
    updateProfile({ languageCertificate: { ...language, ...updates } });
  };

  const updateNumber = (field: 'gpa4' | 'gpa10' | 'completedSemesters', value: string) => {
    const parsed = value === '' ? 0 : Number(value);
    updateProfile({ [field]: Number.isFinite(parsed) ? parsed : 0 });
  };

  const triStateValue = (value: boolean | null) => value === null ? '' : value ? 'true' : 'false';
  const updateTriState = (field: 'hasParticipatedSemesterExchange' | 'isFinalSemester' | 'hasPassedMidtermInternship' | 'hasExemplaryStudentAward', value: string) => {
    updateProfile({ [field]: value === '' ? null : value === 'true' } as Partial<typeof profile>);
  };

  const TriStateField: React.FC<{ id: string; label: string; field: 'hasParticipatedSemesterExchange' | 'isFinalSemester' | 'hasPassedMidtermInternship' | 'hasExemplaryStudentAward' }> = ({ id, label, field }) => (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass} htmlFor={id}>{label}</label>
      <select id={id} value={triStateValue(profile[field])} onChange={e => updateTriState(field, e.target.value)} className={inputClass}>
        <option value="">Chưa xác minh</option>
        <option value="true">Có</option>
        <option value="false">Không</option>
      </select>
    </div>
  );

  return (
    <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-sm border border-surface-container/80 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Bổ sung thông tin hồ sơ</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Các trường dưới đây không có trong file CTĐT/bảng điểm hiện tại nên cần bạn nhập hoặc xác nhận. Hệ thống không tự suy đoán.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
            <span className="material-symbols-outlined text-sm">person_check</span>
            Người dùng xác nhận
          </span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          Đã tự lấy từ file: {profile.courses.length} học phần, trạng thái từng môn, tín chỉ đã đạt {profile.accumulatedCredits} TC và danh sách môn còn lại.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="profile-cohort">Khóa</label>
          <select id="profile-cohort" value={profile.cohort} onChange={e => updateProfile({ cohort: e.target.value })} className={inputClass}>
            <option value="">Chưa xác định</option>
            <option value="K61">K61</option>
            <option value="K62">K62</option>
            <option value="K63">K63</option>
            <option value="K64">K64</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className={labelClass} htmlFor="profile-major">Ngành / khoa</label>
          <input id="profile-major" value={profile.major} onChange={e => updateProfile({ major: e.target.value })} placeholder="Nhập theo hồ sơ chính thức" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="profile-program">Chương trình</label>
          <select id="profile-program" value={profile.program} onChange={e => updateProfile({ program: e.target.value as typeof profile.program })} className={inputClass}>
            <option value="Tiêu chuẩn">Tiêu chuẩn</option>
            <option value="CLC">Chất lượng cao (CLC)</option>
            <option value="CTTT">Tiên tiến (CTTT)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className={labelClass} htmlFor="profile-graduation">Học kỳ dự kiến tốt nghiệp</label>
          <input id="profile-graduation" value={profile.targetGraduationSemester} onChange={e => updateProfile({ targetGraduationSemester: e.target.value })} placeholder="Ví dụ: HK2 năm học 2027-2028" className={inputClass} />
        </div>
      </div>

      <div className="border-t border-surface-container pt-4">
        <h3 className="text-sm font-extrabold text-on-surface mb-3">Điều kiện học vụ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-gpa4">GPA hệ 4</label>
            <input id="profile-gpa4" type="number" min="0" max="4" step="0.01" value={profile.gpa4 || ''} onChange={e => updateNumber('gpa4', e.target.value)} placeholder="0.00 - 4.00" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-gpa10">GPA hệ 10</label>
            <input id="profile-gpa10" type="number" min="0" max="10" step="0.01" value={profile.gpa10 || ''} onChange={e => updateNumber('gpa10', e.target.value)} placeholder="0.00 - 10.00" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-semesters">Số kỳ đã hoàn thành</label>
            <input id="profile-semesters" type="number" min="0" max="20" step="1" value={profile.completedSemesters || ''} onChange={e => updateNumber('completedSemesters', e.target.value)} placeholder="Nhập theo bảng điểm" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <TriStateField id="profile-previous-exchange" field="hasParticipatedSemesterExchange" label="Đã từng trao đổi theo kỳ" />
          <TriStateField id="profile-final-semester" field="isFinalSemester" label="Đang ở học kỳ cuối khóa" />
          <TriStateField id="profile-midterm-internship" field="hasPassedMidtermInternship" label="Đã hoàn thành TTGK" />
          <TriStateField id="profile-exemplary-award" field="hasExemplaryStudentAward" label="Có giấy khen tiêu biểu" />
        </div>
      </div>

      <div className="border-t border-surface-container pt-4">
        <h3 className="text-sm font-extrabold text-on-surface mb-3">Ngoại ngữ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-language">Ngôn ngữ</label>
            <select id="profile-language" value={language.language} onChange={e => updateLanguage({ language: e.target.value })} className={inputClass}>
              <option value="">Chưa xác định</option>
              <option value="English">Tiếng Anh</option>
              <option value="French">Tiếng Pháp</option>
              <option value="Japanese">Tiếng Nhật</option>
              <option value="Chinese">Tiếng Trung</option>
              <option value="German">Tiếng Đức</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-test">Loại chứng chỉ</label>
            <input id="profile-test" value={language.testName} onChange={e => updateLanguage({ testName: e.target.value })} placeholder="IELTS, TOEIC, VSTEP..." className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-score">Điểm / cấp độ ghi trên chứng chỉ</label>
            <input id="profile-score" value={language.score} onChange={e => updateLanguage({ score: e.target.value })} placeholder="Ví dụ: 6.5" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-language-level">Mức CEFR đã xác minh</label>
            <select id="profile-language-level" value={language.level} onChange={e => updateLanguage({ level: e.target.value })} className={inputClass}>
              <option value="">Chưa xác định</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-language-expiry">Ngày hết hạn</label>
            <input id="profile-language-expiry" type="date" value={language.expiryDate || ''} onChange={e => updateLanguage({ expiryDate: e.target.value })} className={inputClass} />
          </div>
          <label className="sm:col-span-3 flex items-center gap-2 rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-xs cursor-pointer self-end min-h-10">
            <input type="checkbox" checked={language.isValid} onChange={e => updateLanguage({ isValid: e.target.checked })} />
            <span>Tôi xác nhận thông tin chứng chỉ trên đúng với giấy tờ và chứng chỉ còn hiệu lực</span>
          </label>
        </div>
        <p className="text-[11px] text-amber-700 mt-3">Mức B2/C1/C2 phải được đối chiếu từ chứng chỉ hợp lệ; hệ thống không tự quy đổi điểm giữa các loại chứng chỉ.</p>
      </div>

    </section>
  );
};
