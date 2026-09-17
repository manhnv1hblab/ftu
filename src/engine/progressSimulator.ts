import { StudentCourse } from '../types/curriculum';
import { CourseMatchPair } from '../types/studyPlan';
import { CourseOffering } from '../types/courseOffering';
import { calculateElectiveGroups, calculateElectiveDeductions } from './electives';

export interface ProgressSimulationResult {
  initialRemainingCredits: number;
  creditsTransferred: number;
  creditsEffectiveDeducted: number;
  remainingCreditsAfterExchange: number;
  
  // Thesis (HPTN) eligibility check
  // Threshold: Remaining debt <= 6 credits (excluding Thesis, PE/GDTC, Military/GDQP)
  remainingDebtExcludingThesisAndExempt: number;
  thesisEligible: boolean;
  hasMidtermInternship: boolean;
  canRegisterThesisImmediately: boolean;
  
  // Graduation timeline assessment
  targetGraduationSemester: string;
  isLikelyOnTime: boolean;
  warnings: string[];
  courseScheduleAnalysis: {
    courseCode: string;
    courseName: string;
    action: 'TRANSFER_AT_HOST' | 'TAKE_AT_FTU_LATER';
    offeredInFTU: ('HK1' | 'HK2')[];
    riskNote?: string;
  }[];
}

export function simulateStudentProgress(
  courses: StudentCourse[],
  transferredPairs: CourseMatchPair[],
  courseOfferings: CourseOffering[],
  targetGraduationSemester: string,
  hasMidtermInternship: boolean,
  failedTransferCourseCodes: string[] = []
): ProgressSimulationResult {
  const initialElectiveGroups = calculateElectiveGroups(courses);

  // Filter out courses simulated as failed transfer
  const successfulTransfers = transferredPairs.filter(
    p => !failedTransferCourseCodes.includes(p.ftuCourseCode.toUpperCase())
  );

  // Total credits transferred back
  const totalTransferredCredits = successfulTransfers.reduce((sum, p) => sum + p.ftuCredits, 0);

  // Map to format for elective group deduction
  const coursesForDeduction = successfulTransfers.map(p => {
    const origCourse = courses.find(c => c.courseCode.toUpperCase() === p.ftuCourseCode.toUpperCase());
    return {
      ftuCourseCode: p.ftuCourseCode,
      credits: p.ftuCredits,
      electiveGroup: origCourse?.electiveGroup
    };
  });

  const { updatedGroups, effectiveCreditsDeducted } = calculateElectiveDeductions(
    coursesForDeduction,
    initialElectiveGroups
  );

  // Calculate remaining courses after exchange
  const transferredCodesSet = new Set(successfulTransfers.map(p => p.ftuCourseCode.toUpperCase()));
  const remainingCoursesAfter = courses.filter(
    c => !c.isPassed && !transferredCodesSet.has(c.courseCode.toUpperCase())
  );

  const initialRemainingCredits = courses
    .filter(c => !c.isPassed)
    .reduce((sum, c) => sum + c.credits, 0);

  const remainingCreditsAfterExchange = Math.max(0, initialRemainingCredits - effectiveCreditsDeducted);

  // Check Thesis (HPTN) eligibility:
  // Under FTU Regulation (Điều 39-40), student can do thesis/graduation exam if:
  // 1. Debt <= 6 credits (excluding Thesis course itself, GDTC, GDQP)
  // 2. Has completed and passed Midterm Internship (TTGK)
  const exemptCoursePrefixes = ['GDTC', 'GDQP'];
  const thesisCourseCodes = ['KTE526', 'HPTN', 'KLTN', 'KTE525']; // Khóa luận tốt nghiệp

  const debtCourses = remainingCoursesAfter.filter(c => {
    const code = c.courseCode.toUpperCase();
    if (thesisCourseCodes.some(tc => code.includes(tc))) return false;
    if (exemptCoursePrefixes.some(ep => code.startsWith(ep))) return false;
    return true;
  });

  const remainingDebtExcludingThesisAndExempt = debtCourses.reduce((sum, c) => sum + c.credits, 0);
  const thesisEligible = remainingDebtExcludingThesisAndExempt <= 6;
  const canRegisterThesisImmediately = thesisEligible && hasMidtermInternship;

  // Warnings and course schedule analysis
  const warnings: string[] = [];
  const scheduleAnalysis: ProgressSimulationResult['courseScheduleAnalysis'] = [];

  if (!hasMidtermInternship) {
    warnings.push('Chưa hoàn thành Thực tập giữa khóa (TTGK). Đây là điều kiện bắt buộc trước khi làm Học phần tốt nghiệp.');
  }

  if (!thesisEligible) {
    warnings.push(`Số tín chỉ nợ còn lại sau trao đổi (${remainingDebtExcludingThesisAndExempt} tín chỉ) vượt quá ngưỡng cho phép làm HPTN (tối đa 6 tín chỉ).`);
  }

  if (failedTransferCourseCodes.length > 0) {
    warnings.push(`Đang mô phỏng rủi ro: ${failedTransferCourseCodes.length} môn không chuyển điểm được.`);
  }

  // Analyze schedule for remaining courses using CourseOfferings 26-27
  for (const c of remainingCoursesAfter) {
    const offList = courseOfferings.filter(o => o.courseCode.toUpperCase() === c.courseCode.toUpperCase());
    const terms: ('HK1' | 'HK2')[] = [];
    offList.forEach(o => {
      if (!terms.includes(o.semester)) terms.push(o.semester);
    });

    let riskNote: string | undefined;
    if (terms.length === 0) {
      riskNote = 'Chưa có trong kế hoạch mở lớp 2026-2027. Có thể cần học ghép với khóa khác hoặc chờ đợt mở bổ sung.';
    } else if (terms.length === 1 && terms[0] === 'HK1') {
      riskNote = 'Chỉ mở vào HK1. Nếu dự kiến học vào HK2 sẽ không có lớp mở.';
    }

    scheduleAnalysis.push({
      courseCode: c.courseCode,
      courseName: c.courseName,
      action: 'TAKE_AT_FTU_LATER',
      offeredInFTU: terms,
      riskNote
    });
  }

  const isLikelyOnTime = canRegisterThesisImmediately && remainingDebtExcludingThesisAndExempt <= 6;

  return {
    initialRemainingCredits,
    creditsTransferred: totalTransferredCredits,
    creditsEffectiveDeducted: effectiveCreditsDeducted,
    remainingCreditsAfterExchange,
    remainingDebtExcludingThesisAndExempt,
    thesisEligible,
    hasMidtermInternship,
    canRegisterThesisImmediately,
    targetGraduationSemester,
    isLikelyOnTime,
    warnings,
    courseScheduleAnalysis: scheduleAnalysis
  };
}
