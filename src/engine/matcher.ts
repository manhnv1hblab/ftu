import { PartnerUniversity } from '../types/university';
import { CourseEquivalence } from '../types/equivalence';
import { CourseOffering } from '../types/courseOffering';
import { StudentProfile } from '../types/studentProfile';
import { CourseMatchPair, UniversityMatchResult } from '../types/studyPlan';
import { checkProgramEligibility } from './eligibility';
import { evaluateBudget } from './costCalculator';
import { CountryCost } from '../types/cost';

export function matchCoursesForUniversity(
  university: PartnerUniversity,
  studentCoursesNotPassed: { code: string; name: string; credits: number; program?: string }[],
  allEquivalences: CourseEquivalence[],
  courseOfferings?: CourseOffering[]
): CourseMatchPair[] {
  // Filter equivalences for this university
  const uniId = university.id;
  const uniEquivalences = allEquivalences.filter(
    eq => eq.partnerS27Id === uniId || eq.partnerUni.toLowerCase() === university.name.toLowerCase()
  );

  // Group approved equivalences
  // We need 1-to-1 matching so that:
  // - 1 host course is not reused for multiple FTU courses
  // - 1 FTU course is not paired multiple times
  const usedHostCourses = new Set<string>();
  const usedFtuCourses = new Set<string>();
  const matchedPairs: CourseMatchPair[] = [];

  // Sort candidate equivalences: APPROVED first, then PENDING
  const sortedEqs = [...uniEquivalences].sort((a, b) => {
    if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
    if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
    return 0;
  });

  for (const studentCourse of studentCoursesNotPassed) {
    if (usedFtuCourses.has(studentCourse.code.toUpperCase())) continue;

    for (const eq of sortedEqs) {
      const hostKey = `${eq.hostCourseCode}_${eq.hostCourseName}`.toLowerCase();
      if (usedHostCourses.has(hostKey)) continue;

      // Check if FTU course code matches
      const isCodeMatch = eq.ftuCourseCodes.some(
        c => c.toUpperCase() === studentCourse.code.toUpperCase()
      );

      // Or fallback to clean name match if code was omitted in raw note
      const isNameMatch = !eq.ftuCourseCodes.length &&
        eq.ftuCourseNameClean.toLowerCase() === studentCourse.name.toLowerCase();

      if (isCodeMatch || isNameMatch) {
        // Offerings check in FTU 2026-2027
        const offeringTerms: ('HK1' | 'HK2')[] = [];
        if (courseOfferings) {
          for (const off of courseOfferings) {
            if (off.courseCode.toUpperCase() === studentCourse.code.toUpperCase()) {
              if (!offeringTerms.includes(off.semester)) {
                offeringTerms.push(off.semester);
              }
            }
          }
        }

        // Assess risk
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        let riskReason = 'Môn tương đương đã được phê duyệt chính thức.';

        if (eq.status === 'PENDING') {
          riskLevel = 'MEDIUM';
          riskReason = 'Môn đang chờ bộ môn phê duyệt. Cần nộp đề cương để xét.';
        } else if (eq.status === 'REJECTED') {
          riskLevel = 'HIGH';
          riskReason = 'Bộ môn đã từ chối tương đương trong dữ liệu nguồn.';
        } else if (offeringTerms.length === 1 && offeringTerms[0] === 'HK2') {
          riskLevel = 'MEDIUM';
          riskReason = 'Môn này tại FTU chỉ dự kiến mở vào HK2. Nếu không đổi được sẽ phải chờ năm sau.';
        }

        matchedPairs.push({
          ftuCourseCode: studentCourse.code,
          ftuCourseName: studentCourse.name,
          ftuCredits: studentCourse.credits,
          hostCourseCode: eq.hostCourseCode,
          hostCourseName: eq.hostCourseName,
          equivalenceId: eq.id,
          status: eq.status,
          faculty: eq.faculty,
          approver: eq.approver,
          approvalYear: eq.approvalYear,
          offeredInSemester: offeringTerms,
          riskLevel,
          riskReason
        });

        usedHostCourses.add(hostKey);
        usedFtuCourses.add(studentCourse.code.toUpperCase());
        break; // 1-1 match found for this student course
      }
    }
  }

  return matchedPairs;
}

export function evaluateAllUniversities(
  universities: PartnerUniversity[],
  profile: StudentProfile,
  allEquivalences: CourseEquivalence[],
  costsByCountry: Record<string, CountryCost>,
  courseOfferings: CourseOffering[]
): UniversityMatchResult[] {
  // Extract remaining courses for student
  const remainingCourses: { code: string; name: string; credits: number; program?: string }[] = [];

  if (profile.courses && profile.courses.length > 0) {
    for (const c of profile.courses) {
      if (!c.isPassed) {
        remainingCourses.push({
          code: c.courseCode,
          name: c.courseName,
          credits: c.credits,
          program: c.program
        });
      }
    }
  } else if (profile.manualCourseCodes && profile.manualCourseCodes.length > 0) {
    for (const code of profile.manualCourseCodes) {
      remainingCourses.push({
        code: code.trim().toUpperCase(),
        name: `Học phần ${code.trim().toUpperCase()}`,
        credits: 3
      });
    }
  }

  const results: UniversityMatchResult[] = [];

  for (const uni of universities) {
    const matchedPairs = matchCoursesForUniversity(
      uni,
      remainingCourses,
      allEquivalences,
      courseOfferings
    );

    const approvedPairs = matchedPairs.filter(p => p.status === 'APPROVED');
    const pendingPairs = matchedPairs.filter(p => p.status === 'PENDING');

    // Program eligibility check
    const elig = checkProgramEligibility(profile, uni);
    const budgetEval = evaluateBudget(
      uni.country,
      profile.monthlyBudgetVnd,
      profile.stayDurationMonths,
      profile.housingType,
      costsByCountry
    );

    const missingReqs = [...elig.unmetSummary];
    if (approvedPairs.length < 3) {
      missingReqs.push(`Chưa đủ 3 môn quy đổi hợp lệ (Hiện có: ${approvedPairs.length}/3)`);
    }
    if (budgetEval.status === 'EXCEEDS_BUDGET') {
      missingReqs.push(`Dự kiến chi phí vượt ngân sách (${budgetEval.warning || ''})`);
    }

    // Recommendation score calculation
    let score = 0;
    const reasons: string[] = [];

    // Base score on approved pairs (crucial requirement: >= 3)
    score += approvedPairs.length * 25;
    if (approvedPairs.length >= 3) {
      reasons.push(`Đạt điều kiện ghép môn: Có ${approvedPairs.length} học phần chuyển điểm về FTU.`);
    }

    if (pendingPairs.length > 0) {
      score += pendingPairs.length * 5;
      reasons.push(`Có ${pendingPairs.length} môn đang trong diện xét duyệt bổ sung.`);
    }

    // Region preference match
    if (profile.preferredRegions && profile.preferredRegions.includes(uni.region)) {
      score += 15;
      reasons.push(`Nằm trong khu vực ưu tiên: ${uni.region}`);
    }

    // Budget evaluation bonus
    if (budgetEval.status === 'WITHIN_BUDGET') {
      score += 20;
      reasons.push('Chi phí ước tính nằm trong khung ngân sách đăng ký.');
    } else if (budgetEval.status === 'NEAR_BUDGET') {
      score += 10;
      reasons.push('Chi phí ước tính sát mức trần ngân sách.');
    }

    // Exemplary student bonus
    if (profile.hasExemplaryStudentAward) {
      score += 10;
      reasons.push('Cộng điểm ưu tiên xét chọn sinh viên tiêu biểu FTU.');
    }

    // Partner scholarship note
    if (uni.scholarship && uni.scholarship.toLowerCase() !== 'không có' && uni.scholarship.trim().length > 0) {
      score += 10;
      reasons.push(`Cơ hội học bổng: ${uni.scholarship}`);
    }

    results.push({
      university: uni,
      matchedPairs,
      approvedPairsCount: approvedPairs.length,
      pendingPairsCount: pendingPairs.length,
      totalMatchCount: matchedPairs.length,
      meetsEligibility: elig.isEligible && approvedPairs.length >= 3,
      missingRequirements: missingReqs,
      budgetEvaluation: budgetEval,
      recommendationScore: score,
      recommendationReasons: reasons
    });
  }

  // Sort descending by recommendation score
  return results.sort((a, b) => b.recommendationScore - a.recommendationScore);
}
