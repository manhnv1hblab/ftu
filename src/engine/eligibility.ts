import { StudentProfile } from '../types/studentProfile';
import { PartnerUniversity } from '../types/university';

export interface EligibilityCriterionResult {
  code: string;
  title: string;
  passed: boolean;
  status: 'PASSED' | 'FAILED' | 'NEEDS_CONFIRMATION';
  currentValue: string | number;
  requiredValue: string;
  detail: string;
}

export interface ProgramEligibilityEvaluation {
  isEligible: boolean;
  canProceedToDraft: boolean; // Students with unmet criteria can still search & draft
  criteria: EligibilityCriterionResult[];
  unmetSummary: string[];
}

export function checkProgramEligibility(
  profile: StudentProfile,
  partnerUni?: PartnerUniversity
): ProgramEligibilityEvaluation {
  const criteria: EligibilityCriterionResult[] = [];
  const unmetSummary: string[] = [];

  // 1. GPA Hệ 4 (>= 2.8)
  const gpa4Passed = profile.gpa4 >= 2.8;
  criteria.push({
    code: 'GPA4',
    title: 'Điểm GPA thang 4 tối thiểu',
    passed: gpa4Passed,
    status: gpa4Passed ? 'PASSED' : 'FAILED',
    currentValue: profile.gpa4.toFixed(2),
    requiredValue: '≥ 2.80 / 4.0',
    detail: gpa4Passed
      ? 'Đạt yêu cầu GPA thang 4 quy định cho kỳ S27.'
      : 'Chưa đạt yêu cầu tối thiểu 2.80/4.0 theo Thông báo S27.'
  });
  if (!gpa4Passed) unmetSummary.push('GPA thang 4 chưa đạt 2.80');

  // 2. GPA Hệ 10 (>= 7.5)
  const gpa10Passed = profile.gpa10 >= 7.5;
  criteria.push({
    code: 'GPA10',
    title: 'Điểm GPA thang 10 tối thiểu',
    passed: gpa10Passed,
    status: gpa10Passed ? 'PASSED' : 'FAILED',
    currentValue: profile.gpa10.toFixed(2),
    requiredValue: '≥ 7.50 / 10.0',
    detail: gpa10Passed
      ? 'Đạt yêu cầu GPA thang 10 quy định cho kỳ S27.'
      : 'Chưa đạt yêu cầu tối thiểu 7.50/10.0 theo Thông báo S27.'
  });
  if (!gpa10Passed) unmetSummary.push('GPA thang 10 chưa đạt 7.50');

  // 3. Số kỳ hoàn thành (>= 2 kỳ)
  const semestersPassed = profile.completedSemesters >= 2;
  criteria.push({
    code: 'SEMESTERS',
    title: 'Số kỳ học đã hoàn thành',
    passed: semestersPassed,
    status: semestersPassed ? 'PASSED' : 'FAILED',
    currentValue: `${profile.completedSemesters} học kỳ`,
    requiredValue: '≥ 2 học kỳ',
    detail: semestersPassed
      ? 'Đã hoàn thành tối thiểu 2 kỳ học chính quy.'
      : 'Phải hoàn thành tối thiểu 2 kỳ học trước khi tham gia trao đổi.'
  });
  if (!semestersPassed) unmetSummary.push('Chưa hoàn thành đủ 2 kỳ học');

  // 4. Số tín chỉ tích lũy (>= 35 tín chỉ)
  const creditsPassed = profile.accumulatedCredits >= 35;
  criteria.push({
    code: 'CREDITS',
    title: 'Tín chỉ tích lũy tối thiểu',
    passed: creditsPassed,
    status: creditsPassed ? 'PASSED' : 'FAILED',
    currentValue: `${profile.accumulatedCredits} tín chỉ`,
    requiredValue: '≥ 35 tín chỉ',
    detail: creditsPassed
      ? 'Đã tích lũy đủ số tín chỉ tối thiểu.'
      : 'Chưa tích lũy đủ 35 tín chỉ tính đến thời điểm đi trao đổi.'
  });
  if (!creditsPassed) unmetSummary.push('Chưa tích lũy đủ 35 tín chỉ');

  // 5. Chưa từng tham gia trao đổi theo kỳ
  const noPrevExchange = !profile.hasParticipatedSemesterExchange;
  criteria.push({
    code: 'NO_PREV_EXCHANGE',
    title: 'Chưa từng trao đổi theo kỳ tại FTU',
    passed: noPrevExchange,
    status: noPrevExchange ? 'PASSED' : 'FAILED',
    currentValue: noPrevExchange ? 'Chưa từng tham gia' : 'Đã từng tham gia',
    requiredValue: 'Chưa từng tham gia',
    detail: noPrevExchange
      ? 'Hợp lệ: Sinh viên chưa từng đi trao đổi theo kỳ.'
      : 'Không đủ điều kiện: Sinh viên đã từng tham gia trao đổi theo kỳ của FTU.'
  });
  if (!noPrevExchange) unmetSummary.push('Đã từng tham gia trao đổi kỳ trước');

  // 6. Không đi vào học kỳ cuối khóa
  const notFinal = !profile.isFinalSemester;
  criteria.push({
    code: 'NOT_FINAL_SEMESTER',
    title: 'Không đi vào học kỳ cuối khóa',
    passed: notFinal,
    status: notFinal ? 'PASSED' : 'FAILED',
    currentValue: notFinal ? 'Hợp lệ' : 'Đang ở kỳ cuối',
    requiredValue: 'Không phải kỳ cuối',
    detail: notFinal
      ? 'Hợp lệ: Sinh viên không đi trao đổi vào kỳ tốt nghiệp cuối khóa.'
      : 'Không đủ điều kiện: Quy chế không cho phép trao đổi vào kỳ cuối khóa.'
  });
  if (!notFinal) unmetSummary.push('Không được đi trao đổi vào kỳ cuối khóa');

  // 7. Còn ít nhất 4 học phần chưa tích lũy (bao gồm học phần tốt nghiệp)
  const remainingCoursesCount = profile.courses && profile.courses.length > 0
    ? profile.courses.filter(c => !c.isPassed).length
    : (profile.manualCourseCodes ? profile.manualCourseCodes.length : 0);
  
  const min4CoursesPassed = remainingCoursesCount >= 4;
  criteria.push({
    code: 'REMAINING_COURSES',
    title: 'Còn tối thiểu 04 học phần chưa tích lũy',
    passed: min4CoursesPassed,
    status: min4CoursesPassed ? 'PASSED' : 'FAILED',
    currentValue: `${remainingCoursesCount} học phần còn lại`,
    requiredValue: '≥ 4 học phần',
    detail: min4CoursesPassed
      ? `Còn ${remainingCoursesCount} học phần chưa hoàn thành (thỏa mãn yêu cầu ≥ 4 học phần bao gồm HPTN).`
      : `Chỉ còn ${remainingCoursesCount} học phần chưa tích lũy. Quy chế yêu cầu còn ít nhất 4 học phần.`
  });
  if (!min4CoursesPassed) unmetSummary.push('Phải còn ít nhất 4 học phần chưa tích lũy');

  // 8. Ngoại ngữ
  const langCert = profile.languageCertificate;
  const langPassed = Boolean(langCert && langCert.isValid && (langCert.level === 'B2' || langCert.level === 'C1' || langCert.level === 'C2' || parseFloat(langCert.score) >= 5.5));
  criteria.push({
    code: 'LANGUAGE',
    title: 'Chứng chỉ ngoại ngữ (Tối thiểu B2 CEFR)',
    passed: langPassed,
    status: langPassed ? 'PASSED' : 'NEEDS_CONFIRMATION',
    currentValue: langCert ? `${langCert.testName} ${langCert.score}` : 'Chưa nhập',
    requiredValue: 'B2 CEFR hoặc tương đương',
    detail: langPassed
      ? `Chứng chỉ ${langCert.testName} đạt chuẩn B2 trở lên cho kỳ S27.`
      : 'Cần có chứng chỉ ngoại ngữ tương đương B2 CEFR trở lên còn hiệu lực.'
  });
  if (!langPassed) unmetSummary.push('Chứng chỉ ngoại ngữ chưa đạt B2 CEFR');

  // 9. Yêu cầu riêng của trường đối tác (nếu có)
  if (partnerUni && partnerUni.requirements) {
    criteria.push({
      code: 'PARTNER_SPECIFIC',
      title: `Yêu cầu riêng của ${partnerUni.name}`,
      passed: true,
      status: 'NEEDS_CONFIRMATION',
      currentValue: 'Cần tự đối chiếu',
      requiredValue: partnerUni.requirements,
      detail: partnerUni.requirements
    });
  }

  const isEligible = criteria.every(c => c.passed || c.status === 'NEEDS_CONFIRMATION');

  return {
    isEligible,
    canProceedToDraft: true, // Always allow exploration and drafting
    criteria,
    unmetSummary
  };
}
