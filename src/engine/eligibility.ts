import { StudentProfile } from '../types/studentProfile';
import { PartnerUniversity } from '../types/university';
import { S27_RULES } from '../config/s27Rules';

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
  source: typeof S27_RULES.source;
}

function isLanguageCertificateValid(profile: StudentProfile): boolean {
  const cert = profile.languageCertificate;
  if (!cert || !cert.isValid) return false;
  if (!cert.expiryDate) return false;
  const expiry = new Date(`${cert.expiryDate}T23:59:59`);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() >= Date.now();
}

export function checkProgramEligibility(
  profile: StudentProfile,
  partnerUni?: PartnerUniversity
): ProgramEligibilityEvaluation {
  const criteria: EligibilityCriterionResult[] = [];
  const unmetSummary: string[] = [];

  // 1. GPA Hệ 4 (source: Quy trình S27)
  const gpa4Provided = Number.isFinite(profile.gpa4) && profile.gpa4 > 0;
  const gpa4Passed = gpa4Provided && profile.gpa4 >= S27_RULES.gpa4Minimum;
  criteria.push({
    code: 'GPA4',
    title: 'Điểm GPA thang 4 tối thiểu',
    passed: gpa4Passed,
    status: gpa4Passed ? 'PASSED' : gpa4Provided ? 'FAILED' : 'NEEDS_CONFIRMATION',
    currentValue: profile.gpa4.toFixed(2),
    requiredValue: `≥ ${S27_RULES.gpa4Minimum.toFixed(2)} / 4.0`,
    detail: gpa4Passed
      ? 'Đạt yêu cầu GPA thang 4 quy định cho kỳ S27.'
      : gpa4Provided ? 'Chưa đạt yêu cầu tối thiểu 2.80/4.0 theo Thông báo S27.' : 'Chưa có GPA thang 4 để đánh giá.'
  });
  if (!gpa4Passed) unmetSummary.push(gpa4Provided ? 'GPA thang 4 chưa đạt 2.80' : 'Chưa có dữ liệu GPA thang 4');

  // 2. GPA Hệ 10 (source: Quy trình S27)
  const gpa10Provided = Number.isFinite(profile.gpa10) && profile.gpa10 > 0;
  const gpa10Passed = gpa10Provided && profile.gpa10 >= S27_RULES.gpa10Minimum;
  criteria.push({
    code: 'GPA10',
    title: 'Điểm GPA thang 10 tối thiểu',
    passed: gpa10Passed,
    status: gpa10Passed ? 'PASSED' : gpa10Provided ? 'FAILED' : 'NEEDS_CONFIRMATION',
    currentValue: profile.gpa10.toFixed(2),
    requiredValue: `≥ ${S27_RULES.gpa10Minimum.toFixed(2)} / 10.0`,
    detail: gpa10Passed
      ? 'Đạt yêu cầu GPA thang 10 quy định cho kỳ S27.'
      : gpa10Provided ? 'Chưa đạt yêu cầu tối thiểu 7.50/10.0 theo Thông báo S27.' : 'Chưa có GPA thang 10 để đánh giá.'
  });
  if (!gpa10Passed) unmetSummary.push(gpa10Provided ? 'GPA thang 10 chưa đạt 7.50' : 'Chưa có dữ liệu GPA thang 10');

  // 3. Số kỳ hoàn thành (>= 2 kỳ)
  const semestersProvided = Number.isFinite(profile.completedSemesters) && profile.completedSemesters > 0;
  const semestersPassed = semestersProvided && profile.completedSemesters >= S27_RULES.completedSemestersMinimum;
  criteria.push({
    code: 'SEMESTERS',
    title: 'Số kỳ học đã hoàn thành',
    passed: semestersPassed,
    status: semestersPassed ? 'PASSED' : semestersProvided ? 'FAILED' : 'NEEDS_CONFIRMATION',
    currentValue: `${profile.completedSemesters} học kỳ`,
    requiredValue: `≥ ${S27_RULES.completedSemestersMinimum} học kỳ`,
    detail: semestersPassed
      ? 'Đã hoàn thành tối thiểu 2 kỳ học chính quy.'
      : semestersProvided ? 'Phải hoàn thành tối thiểu 2 kỳ học trước khi tham gia trao đổi.' : 'Chưa có số kỳ đã hoàn thành để đánh giá.'
  });
  if (!semestersPassed) unmetSummary.push(semestersProvided ? 'Chưa hoàn thành đủ 2 kỳ học' : 'Chưa có dữ liệu số kỳ đã hoàn thành');

  // 4. Số tín chỉ tích lũy (>= 35 tín chỉ)
  const creditsProvided = Number.isFinite(profile.accumulatedCredits) && profile.accumulatedCredits > 0;
  const creditsPassed = creditsProvided && profile.accumulatedCredits >= S27_RULES.accumulatedCreditsMinimum;
  criteria.push({
    code: 'CREDITS',
    title: 'Tín chỉ tích lũy tối thiểu',
    passed: creditsPassed,
    status: creditsPassed ? 'PASSED' : creditsProvided ? 'FAILED' : 'NEEDS_CONFIRMATION',
    currentValue: `${profile.accumulatedCredits} tín chỉ`,
    requiredValue: `≥ ${S27_RULES.accumulatedCreditsMinimum} tín chỉ`,
    detail: creditsPassed
      ? 'Đã tích lũy đủ số tín chỉ tối thiểu.'
      : creditsProvided ? 'Chưa tích lũy đủ 35 tín chỉ tính đến thời điểm đi trao đổi.' : 'Chưa có số tín chỉ tích lũy để đánh giá.'
  });
  if (!creditsPassed) unmetSummary.push(creditsProvided ? 'Chưa tích lũy đủ 35 tín chỉ' : 'Chưa có dữ liệu tín chỉ tích lũy');

  // 5. Chưa từng tham gia trao đổi theo kỳ
  const noPrevExchange = profile.hasParticipatedSemesterExchange === false;
  const prevExchangeKnown = profile.hasParticipatedSemesterExchange !== null;
  criteria.push({
    code: 'NO_PREV_EXCHANGE',
    title: 'Chưa từng trao đổi theo kỳ tại FTU',
    passed: noPrevExchange,
    status: !prevExchangeKnown ? 'NEEDS_CONFIRMATION' : noPrevExchange ? 'PASSED' : 'FAILED',
    currentValue: !prevExchangeKnown ? 'Chưa xác minh' : noPrevExchange ? 'Chưa từng tham gia' : 'Đã từng tham gia',
    requiredValue: 'Chưa từng tham gia',
    detail: !prevExchangeKnown
      ? 'Cần người dùng xác nhận lịch sử tham gia trao đổi theo kỳ.'
      : noPrevExchange
        ? 'Hợp lệ: Sinh viên chưa từng đi trao đổi theo kỳ.'
        : 'Không đủ điều kiện: Sinh viên đã từng tham gia trao đổi theo kỳ của FTU.'
  });
  if (!prevExchangeKnown) unmetSummary.push('Chưa xác minh lịch sử tham gia trao đổi kỳ trước');
  else if (!noPrevExchange) unmetSummary.push('Đã từng tham gia trao đổi kỳ trước');

  // 6. Không đi vào học kỳ cuối khóa
  const notFinal = profile.isFinalSemester === false;
  const finalSemesterKnown = profile.isFinalSemester !== null;
  criteria.push({
    code: 'NOT_FINAL_SEMESTER',
    title: 'Không đi vào học kỳ cuối khóa',
    passed: notFinal,
    status: !finalSemesterKnown ? 'NEEDS_CONFIRMATION' : notFinal ? 'PASSED' : 'FAILED',
    currentValue: !finalSemesterKnown ? 'Chưa xác minh' : notFinal ? 'Không phải kỳ cuối' : 'Đang ở kỳ cuối',
    requiredValue: 'Không phải kỳ cuối',
    detail: !finalSemesterKnown
      ? 'Cần người dùng xác nhận có đang ở học kỳ cuối hay không.'
      : notFinal
        ? 'Hợp lệ: Sinh viên không đi trao đổi vào kỳ tốt nghiệp cuối khóa.'
        : 'Không đủ điều kiện: Quy chế không cho phép trao đổi vào kỳ cuối khóa.'
  });
  if (!finalSemesterKnown) unmetSummary.push('Chưa xác minh có phải học kỳ cuối khóa hay không');
  else if (!notFinal) unmetSummary.push('Không được đi vào học kỳ cuối khóa');

  // 7. Còn ít nhất 4 học phần chưa tích lũy (bao gồm học phần tốt nghiệp)
  const hasRemainingCourseData = profile.courses.length > 0 || (profile.manualCourseCodes?.length ?? 0) > 0;
  const remainingCoursesCount = profile.courses && profile.courses.length > 0
    ? profile.courses.filter(c => !c.isPassed).length
    : (profile.manualCourseCodes ? profile.manualCourseCodes.length : 0);
  
  const min4CoursesPassed = hasRemainingCourseData && remainingCoursesCount >= S27_RULES.remainingCoursesMinimum;
  criteria.push({
    code: 'REMAINING_COURSES',
    title: 'Còn tối thiểu 04 học phần chưa tích lũy',
    passed: min4CoursesPassed,
    status: min4CoursesPassed ? 'PASSED' : hasRemainingCourseData ? 'FAILED' : 'NEEDS_CONFIRMATION',
    currentValue: `${remainingCoursesCount} học phần còn lại`,
    requiredValue: `≥ ${S27_RULES.remainingCoursesMinimum} học phần`,
    detail: min4CoursesPassed
      ? `Còn ${remainingCoursesCount} học phần chưa hoàn thành (thỏa mãn yêu cầu ≥ 4 học phần bao gồm HPTN).`
      : hasRemainingCourseData ? `Chỉ còn ${remainingCoursesCount} học phần chưa tích lũy. Quy chế yêu cầu còn ít nhất 4 học phần.` : 'Chưa có danh sách học phần để xác định số môn còn lại.'
  });
  if (!min4CoursesPassed) unmetSummary.push(hasRemainingCourseData ? 'Phải còn ít nhất 4 học phần chưa tích lũy' : 'Chưa có dữ liệu học phần còn lại');

  // 8. Ngoại ngữ
  const langCert = profile.languageCertificate;
  const langPassed = Boolean(langCert && isLanguageCertificateValid(profile) && ['B2', 'C1', 'C2'].includes(langCert.level));
  criteria.push({
    code: 'LANGUAGE',
    title: 'Chứng chỉ ngoại ngữ (Tối thiểu B2 CEFR)',
    passed: langPassed,
    status: langPassed ? 'PASSED' : 'NEEDS_CONFIRMATION',
    currentValue: langCert ? `${langCert.testName} ${langCert.score}` : 'Chưa nhập',
    requiredValue: 'B2 CEFR hoặc tương đương',
    detail: langPassed
      ? `Chứng chỉ ${langCert.testName} đạt chuẩn B2 trở lên và còn hiệu lực.`
      : 'Cần chứng chỉ tương đương B2 CEFR trở lên, còn hiệu lực và có ngày hết hạn để xác minh.'
  });
  if (!langPassed) unmetSummary.push('Chứng chỉ ngoại ngữ chưa đạt B2 CEFR');

  // 9. Yêu cầu riêng của trường đối tác (nếu có)
  if (partnerUni && partnerUni.requirements) {
    criteria.push({
      code: 'PARTNER_SPECIFIC',
      title: `Yêu cầu riêng của ${partnerUni.name}`,
      passed: false,
      status: 'NEEDS_CONFIRMATION',
      currentValue: 'Cần tự đối chiếu',
      requiredValue: partnerUni.requirements,
      detail: partnerUni.requirements
    });
  }

  const isEligible = criteria.every(c => c.passed);

  return {
    isEligible,
    canProceedToDraft: true, // Always allow exploration and drafting
    criteria,
    unmetSummary,
    source: S27_RULES.source
  };
}
