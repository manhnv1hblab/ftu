import { PROGRAM_TYPES, ProgramMappingSource, ProgramType, StudentProfile } from '../types/studentProfile';
import catalogue from '../../data/ftu_programs.json';

export const academicPrograms = catalogue.programs;
export const cohorts = ['K61', 'K62', 'K63', 'K64'];
export type ProfileErrors = Record<string, string>;

export function resolveProgramType(program: { matchingProgram?: string; programType?: string; programMappingSource?: string; name?: string }): { programType: ProgramType; source: ProgramMappingSource } {
  if (program.programType && (PROGRAM_TYPES as readonly string[]).includes(program.programType)) {
    const source = ['CATALOGUE', 'NAME_INFERRED', 'DEFAULT_STANDARD'].includes(program.programMappingSource || '')
      ? program.programMappingSource as ProgramMappingSource
      : 'CATALOGUE';
    return { programType: program.programType as ProgramType, source };
  }
  const explicit = program.matchingProgram?.trim();
  if (explicit && (PROGRAM_TYPES as readonly string[]).includes(explicit)) {
    return { programType: explicit as ProgramType, source: 'CATALOGUE' };
  }
  const name = (program.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi-VN');
  if (name.includes('clc') || name.includes('chat luong cao')) return { programType: 'CLC', source: 'NAME_INFERRED' };
  if (name.includes('cttt') || name.includes('tien tien') || name.includes('dhnnqt') || name.includes('đhnnqt')) return { programType: 'CTTT', source: 'NAME_INFERRED' };
  return { programType: 'Tiêu chuẩn', source: 'DEFAULT_STANDARD' };
}

export function graduationYears(saved = '', now = new Date()): number[] {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric' }).formatToParts(now);
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const start = year - (month < 8 ? 1 : 0);
  const values = Array.from({ length: 7 }, (_, index) => start + index);
  const savedYear = Number(saved.match(/năm học (\d{4})/)?.[1]);
  if (savedYear && !values.includes(savedYear)) values.push(savedYear);
  return values.sort((a, b) => a - b);
}

export function normalizeProfile(profile: StudentProfile): StudentProfile {
  const selected = academicPrograms.find(p => p.id === profile.programId && p.majorId === profile.majorId && p.cohorts.includes(profile.cohort));
  const academicInputs = { ...profile.academicInputs };
  for (const field of ['gpa4', 'gpa10', 'completedSemesters'] as const) {
    // Old drafts used zero for both an empty field and an entered zero.
    if (academicInputs[field] === undefined) academicInputs[field] = profile[field] > 0;
  }
  const normalized = {
    ...profile,
    academicInputs,
    ...(selected ? {
      major: selected.majorName,
      programName: selected.name,
      programSourceUrl: selected.sourceUrl,
      ...(() => {
        const resolved = resolveProgramType(selected);
        return { program: resolved.programType, programType: resolved.programType, programMappingSource: resolved.source };
      })()
    } : {}),
    languageCertificate: {
      ...profile.languageCertificate,
      isValid: profile.languageCertificate.availability === 'NO_CERTIFICATE' ? false
        : profile.languageCertificate.validity ? profile.languageCertificate.validity === 'VALID'
        : profile.languageCertificate.isValid
    }
  };
  return { ...normalized, isProfileComplete: Object.keys(validateProfile(normalized)).length === 0 };
}

export function validateProfile(profile: StudentProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!cohorts.includes(profile.cohort)) errors['profile-cohort'] = 'Chọn khóa sinh viên.';
  if (!academicPrograms.some(p => p.majorId === profile.majorId && p.cohorts.includes(profile.cohort))) errors['profile-major'] = 'Chọn ngành theo khóa.';
  if (!academicPrograms.some(p => p.id === profile.programId && p.majorId === profile.majorId && p.cohorts.includes(profile.cohort))) errors['profile-program'] = 'Chọn chuyên ngành / chương trình đào tạo.';
  if (!profile.programType || !(PROGRAM_TYPES as readonly string[]).includes(profile.programType) || profile.program !== profile.programType) errors['profile-program'] = 'Chọn chương trình đào tạo để xác định loại chương trình.';
  const graduation = profile.targetGraduationSemester.match(/^Học kỳ (I|II|Hè) năm học (\d{4}) - (\d{4})$/);
  if (!graduation || Number(graduation[3]) !== Number(graduation[2]) + 1) errors['profile-graduation'] = 'Chọn năm học và học kỳ dự kiến tốt nghiệp.';
  for (const [field, id, label, max] of [
    ['gpa4', 'profile-gpa4', 'GPA hệ 4', 4],
    ['gpa10', 'profile-gpa10', 'GPA hệ 10', 10],
    ['completedSemesters', 'profile-semesters', 'Số kỳ đã hoàn thành', 20]
  ] as const) {
    const value = profile[field];
    if (!profile.academicInputs?.[field] || !Number.isFinite(value) || value < 0 || value > max || (field === 'completedSemesters' && !Number.isInteger(value))) {
      errors[id] = `${label}: nhập ${field === 'completedSemesters' ? 'số nguyên ' : 'số '}từ 0 đến ${max}.`;
    }
  }
  for (const [field, id, label] of [
    ['hasParticipatedSemesterExchange', 'profile-previous-exchange', 'Đã từng trao đổi theo kỳ'],
    ['isFinalSemester', 'profile-final-semester', 'Đang ở học kỳ cuối khóa'],
    ['hasPassedMidtermInternship', 'profile-midterm-internship', 'Đã hoàn thành TTGK'],
    ['hasExemplaryStudentAward', 'profile-exemplary-award', 'Có giấy khen tiêu biểu']
  ] as const) {
    if (typeof profile[field] !== 'boolean') errors[id] = `${label}: chọn Có hoặc Không.`;
  }
  const cert = profile.languageCertificate;
  if (!['HAS_CERTIFICATE', 'NO_CERTIFICATE'].includes(cert.availability || '')) errors['profile-certificate'] = 'Cho biết bạn đã có chứng chỉ hay chưa.';
  if (cert.availability === 'HAS_CERTIFICATE') {
    for (const [key, id, label] of [['language', 'profile-language', 'ngôn ngữ'], ['testName', 'profile-test', 'loại chứng chỉ'], ['score', 'profile-score', 'điểm / cấp độ']] as const) {
      if (!cert[key]?.trim()) errors[id] = `Nhập ${label}.`;
    }
    if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'UNKNOWN'].includes(cert.level)) errors['profile-language-level'] = 'Chọn mức CEFR hoặc Chưa xác định.';
    if (!['VALID', 'EXPIRED', 'UNKNOWN'].includes(cert.validity || '')) errors['profile-language-validity'] = 'Chọn tình trạng hiệu lực hoặc Chưa xác định.';
    const date = cert.expiryDate || '';
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
    if ((cert.validity !== 'UNKNOWN' || date) && !validDate) errors['profile-language-expiry'] = 'Nhập ngày hết hạn hợp lệ.';
  }
  return errors;
}

export function allowedPlannerStep(step: number, profile: StudentProfile, selectedUniId: string | null): number {
  if (!Number.isInteger(step) || step < 1 || step > 5) return 1;
  if (step >= 2 && !profile.courses.length) return 1;
  if (step >= 3 && Object.keys(validateProfile(profile)).length) return 2;
  if (step === 4 && !selectedUniId) return 3;
  return step;
}
