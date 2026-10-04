'use client';
import React from 'react';
import { useStudent } from '../../context/StudentContext';
import { graduationYears, validateProfile } from '../../lib/profileValidation';
import { AcademicProfileFields, Field, inputClass } from './AcademicProfileFields';

export const ProfileDetailsForm: React.FC = () => {
  const { profile, updateProfile } = useStudent();
  const errors = validateProfile(profile);
  const language = profile.languageCertificate;
  const updateLanguage = (updates: Partial<typeof language>) => updateProfile({ languageCertificate: { ...language, ...updates } });
  const attributes = (id: string) => ({ id, 'aria-invalid': !!errors[id], 'aria-describedby': errors[id] ? `${id}-error` : undefined, className: inputClass });
  const graduation = profile.targetGraduationSemester.match(/^Học kỳ (I|II|Hè) năm học (\d{4}) - (\d{4})$/);
  const year = graduation?.[2] || profile.targetGraduationSemester.match(/năm học (\d{4})/)?.[1] || '';
  const term = graduation?.[1] || profile.targetGraduationSemester.match(/^Học kỳ (I|II|Hè) /)?.[1] || '';
  const setGraduation = (y: string, t: string) => updateProfile({ targetGraduationSemester: `Học kỳ ${t} năm học ${y}${y ? ` - ${Number(y) + 1}` : ''}` });
  return <section id="profile-details" className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-sm border border-surface-container/80 flex flex-col gap-5">
    <div><h2 className="text-lg font-extrabold text-on-surface">Bổ sung thông tin hồ sơ</h2><p className="text-xs text-on-surface-variant mt-1">Các mục có dấu * cần được trả lời trước khi tìm trường. Bạn có thể khai chưa có chứng chỉ; điều kiện tham gia sẽ được đánh giá riêng.</p><p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">Hồ sơ có {profile.courses.length} học phần, tín chỉ đã đạt {profile.accumulatedCredits} TC.</p></div>
    {Object.keys(errors).length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900" aria-live="polite"><p className="font-bold mb-2">Cần hoàn thành {Object.keys(errors).length} mục trước khi tiếp tục:</p><ul className="list-disc pl-4 space-y-1">{Object.entries(errors).map(([id, message]) => <li key={id}><a href={`#${id}`} onClick={() => document.getElementById(id)?.focus()} className="underline">{message}</a></li>)}</ul></div>}
    <AcademicProfileFields errors={errors} />
    <Field id="profile-graduation" label="Học kỳ dự kiến tốt nghiệp" error={errors['profile-graduation']}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><select {...attributes('profile-graduation')} aria-label="Năm học dự kiến tốt nghiệp" value={year} onChange={e => setGraduation(e.target.value, term)}><option value="">Chọn năm học</option>{graduationYears(profile.targetGraduationSemester).map(y => <option key={y} value={y}>{y} – {y + 1}</option>)}</select><select className={inputClass} aria-label="Học kỳ dự kiến tốt nghiệp" aria-invalid={!!errors['profile-graduation']} value={term} onChange={e => setGraduation(year, e.target.value)}><option value="">Chọn học kỳ</option>{['I', 'II', 'Hè'].map(t => <option key={t} value={t}>Học kỳ {t}</option>)}</select></div>
      {!graduation && profile.targetGraduationSemester && !profile.targetGraduationSemester.startsWith('Học kỳ ') && <p className="text-xs text-amber-700">Đã lưu: {profile.targetGraduationSemester}. Hãy chọn lại năm học và học kỳ.</p>}
      <p className="text-xs text-on-surface-variant">Đây là thời điểm bạn dự kiến, không phải ngày xét tốt nghiệp được FTU xác nhận.</p>
    </Field>
    <div className="border-t border-surface-container pt-4"><h3 className="text-sm font-extrabold mb-3">Điều kiện học vụ</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{([
        ['gpa4', 'profile-gpa4', 'GPA hệ 4', 4], ['gpa10', 'profile-gpa10', 'GPA hệ 10', 10], ['completedSemesters', 'profile-semesters', 'Số kỳ đã hoàn thành', 20]
      ] as const).map(([field, id, label, max]) => <Field key={id} id={id} label={label} error={errors[id]}><input {...attributes(id)} type="number" min={0} max={max} step={field === 'completedSemesters' ? 1 : 0.01} value={profile.academicInputs?.[field] ? profile[field] : ''} onChange={e => updateProfile({ [field]: e.target.value === '' ? 0 : Number(e.target.value), academicInputs: { ...profile.academicInputs, [field]: e.target.value !== '' } })} /></Field>)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">{([
        ['hasParticipatedSemesterExchange', 'profile-previous-exchange', 'Đã từng trao đổi theo kỳ'], ['isFinalSemester', 'profile-final-semester', 'Đang ở học kỳ cuối khóa'], ['hasPassedMidtermInternship', 'profile-midterm-internship', 'Đã hoàn thành TTGK'], ['hasExemplaryStudentAward', 'profile-exemplary-award', 'Có giấy khen tiêu biểu']
      ] as const).map(([field, id, label]) => <Field key={id} id={id} label={label} error={errors[id]}><select {...attributes(id)} value={profile[field] === null ? '' : String(profile[field])} onChange={e => updateProfile({ [field]: e.target.value === '' ? null : e.target.value === 'true' })}><option value="">Chọn câu trả lời</option><option value="true">Có</option><option value="false">Không</option></select></Field>)}</div>
    </div>
    <div className="border-t border-surface-container pt-4 space-y-4"><h3 className="text-sm font-extrabold">Ngoại ngữ</h3>
      <Field id="profile-certificate" label="Chứng chỉ ngoại ngữ" error={errors['profile-certificate']}><select {...attributes('profile-certificate')} value={language.availability || ''} onChange={e => updateLanguage({ availability: e.target.value as typeof language.availability })}><option value="">Chọn câu trả lời</option><option value="HAS_CERTIFICATE">Có chứng chỉ</option><option value="NO_CERTIFICATE">Chưa có chứng chỉ</option></select></Field>
      {language.availability === 'NO_CERTIFICATE' && <p className="text-xs text-amber-800">Bạn vẫn có thể xem trường và lập bản nháp. Hồ sơ chưa đạt điều kiện chứng chỉ ngoại ngữ.</p>}
      {language.availability === 'HAS_CERTIFICATE' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="profile-language" label="Ngôn ngữ" error={errors['profile-language']}><select {...attributes('profile-language')} value={language.language} onChange={e => updateLanguage({ language: e.target.value })}><option value="">Chọn ngôn ngữ</option>{[['English', 'Tiếng Anh'], ['French', 'Tiếng Pháp'], ['Japanese', 'Tiếng Nhật'], ['Chinese', 'Tiếng Trung'], ['German', 'Tiếng Đức'], ['Other', 'Ngôn ngữ khác']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>
        <Field id="profile-test" label="Loại chứng chỉ" error={errors['profile-test']}><input {...attributes('profile-test')} value={language.testName} onChange={e => updateLanguage({ testName: e.target.value })} placeholder="IELTS, TOEIC, VSTEP…" /></Field>
        <Field id="profile-score" label="Điểm / cấp độ ghi trên chứng chỉ" error={errors['profile-score']}><input {...attributes('profile-score')} value={language.score} onChange={e => updateLanguage({ score: e.target.value })} /></Field>
        <Field id="profile-language-level" label="Mức CEFR đã đối chiếu" error={errors['profile-language-level']}><select {...attributes('profile-language-level')} value={language.level} onChange={e => updateLanguage({ level: e.target.value })}><option value="">Chọn mức CEFR</option><option value="UNKNOWN">Chưa xác định</option>{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field id="profile-language-validity" label="Tình trạng hiệu lực" error={errors['profile-language-validity']}><select {...attributes('profile-language-validity')} value={language.validity || ''} onChange={e => updateLanguage({ validity: e.target.value as typeof language.validity })}><option value="">Chọn tình trạng</option><option value="VALID">Tôi xác nhận còn hiệu lực</option><option value="EXPIRED">Đã hết hiệu lực</option><option value="UNKNOWN">Chưa xác định</option></select></Field>
        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold" htmlFor="profile-language-expiry">Ngày hết hạn {language.validity !== 'UNKNOWN' ? '*' : '(nếu biết)'}</label><input {...attributes('profile-language-expiry')} type="date" value={language.expiryDate || ''} onChange={e => updateLanguage({ expiryDate: e.target.value })} />{errors['profile-language-expiry'] && <p id="profile-language-expiry-error" className="text-xs text-rose-700">{errors['profile-language-expiry']}</p>}</div>
        <p className="sm:col-span-2 text-xs text-amber-700">Hệ thống không tự quy đổi điểm chứng chỉ sang CEFR. Thông tin chưa xác định cần được đối chiếu trước khi kết luận đủ điều kiện.</p>
      </div>}
    </div>
  </section>;
};
