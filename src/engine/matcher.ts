import { PartnerUniversity } from '../types/university';
import { CourseEquivalence } from '../types/equivalence';
import { CourseOffering } from '../types/courseOffering';
import { StudentProfile } from '../types/studentProfile';
import { CourseMatchPair, UniversityMatchResult } from '../types/studyPlan';
import { checkProgramEligibility } from './eligibility';
import { evaluateBudget } from './costCalculator';
import { CountryCost } from '../types/cost';
import { normalizeCode, normalizeName, sourceStatus } from '../lib/dataIntegrity';
import { S27_RULES } from '../config/s27Rules';

export function matchCoursesForUniversity(
  university: PartnerUniversity,
  studentCoursesNotPassed: { code: string; name: string; credits: number; program?: string }[],
  allEquivalences: CourseEquivalence[],
  courseOfferings?: CourseOffering[]
): CourseMatchPair[] {
  // Filter equivalences for this university
  const uniId = university.id;
  const uniEquivalences = allEquivalences.filter(
    eq => eq.partnerS27Id === uniId || (!eq.partnerS27Id && normalizeName(eq.partnerUni) === normalizeName(university.name))
  ).filter(eq => eq.status !== 'REJECTED');

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
      const hostKey = `${normalizeCode(eq.hostCourseCode)}_${normalizeName(eq.hostCourseName)}`;
      if (usedHostCourses.has(hostKey)) continue;

      // Check if FTU course code matches
      const isCodeMatch = eq.ftuCourseCodes.some(
        c => normalizeCode(c) === normalizeCode(studentCourse.code)
      );

      // Or fallback to clean name match if code was omitted in raw note
      const isNameMatch = !eq.ftuCourseCodes.length &&
        normalizeName(eq.ftuCourseNameClean) === normalizeName(studentCourse.name);

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
        } else if (eq.status === 'UNCERTAIN') {
          riskLevel = 'HIGH';
          riskReason = 'Dữ liệu tương đương chưa đủ chắc chắn trong tài liệu nguồn. Không được coi là kết quả đã duyệt.';
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
        code: normalizeCode(code),
        name: '',
        credits: 0
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
    const uncertainPairs = matchedPairs.filter(p => p.status === 'UNCERTAIN');

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
    if (approvedPairs.length < S27_RULES.transferredCoursesMinimum) {
      missingReqs.push(`Chưa đủ ${S27_RULES.transferredCoursesMinimum} môn quy đổi đã được phê duyệt (Hiện có: ${approvedPairs.length}/${S27_RULES.transferredCoursesMinimum})`);
    }
    if (budgetEval.status === 'EXCEEDS_BUDGET') {
      missingReqs.push(`Dự kiến chi phí vượt ngân sách (${budgetEval.warning || ''})`);
    }

    // Recommendation score calculation
    let score = 0;
    const reasons: string[] = [];

    // Base score on approved pairs (crucial requirement: >= 3)
    score += approvedPairs.length * 25;
    if (approvedPairs.length >= S27_RULES.transferredCoursesMinimum) {
      reasons.push(`Đạt điều kiện ghép môn: Có ${approvedPairs.length} học phần chuyển điểm về FTU.`);
    }

    if (pendingPairs.length > 0) {
      score += pendingPairs.length * 5;
      reasons.push(`Có ${pendingPairs.length} môn đang trong diện xét duyệt bổ sung.`);
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

    const sources = [uni.source, ...matchedPairs.map(p => allEquivalences.find(eq => eq.id === p.equivalenceId)?.source).filter(Boolean) as NonNullable<CourseEquivalence['source']>[]];
    if (budgetEval.source) sources.push(budgetEval.source);
    // Budget and region are optional exploration metadata, not S27 eligibility
    // gates. Missing budget input must not hide a university that otherwise has
    // enough audited equivalences and a complete academic profile.
    const dataStatus = uncertainPairs.length > 0
      ? 'NEEDS_VERIFICATION'
      : sources.every(source => sourceStatus(source) === 'VERIFIED') ? 'VERIFIED' : 'NEEDS_VERIFICATION';

    results.push({
      university: uni,
      matchedPairs,
      approvedPairsCount: approvedPairs.length,
      pendingPairsCount: pendingPairs.length,
      totalMatchCount: matchedPairs.length,
      meetsEligibility: elig.isEligible
        && approvedPairs.length >= S27_RULES.transferredCoursesMinimum
        && dataStatus === 'VERIFIED',
      missingRequirements: missingReqs,
      budgetEvaluation: budgetEval,
      recommendationScore: score,
      recommendationReasons: reasons,
      dataStatus,
      sources
    });
  }

  // Sort descending by recommendation score
  return results.sort((a, b) => b.recommendationScore - a.recommendationScore);
}
