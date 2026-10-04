import { isAvailableForTransfer } from './transferEligibility';
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
  studentCoursesNotPassed: { code: string; name: string; credits: number; program?: string; cohort?: string; programMappingSource?: StudentProfile['programMappingSource'] }[],
  allEquivalences: CourseEquivalence[],
  courseOfferings?: CourseOffering[]
): CourseMatchPair[] {
  const uniId = university.id;
  const uniEquivalences = allEquivalences.filter(eq =>
    eq.partnerS27Id === uniId || (!eq.partnerS27Id && normalizeName(eq.partnerUni) === normalizeName(university.name))
  ).filter(eq => eq.status !== 'REJECTED').sort((a, b) => a.id.localeCompare(b.id));
  const courses = Array.from(new Map(studentCoursesNotPassed.map(course => [normalizeCode(course.code), course])).values())
    .sort((a, b) => normalizeCode(a.code).localeCompare(normalizeCode(b.code)));
  const candidates: { courseIndex: number; hostKey: string; eq: CourseEquivalence; scopeVerified: boolean; verificationReason?: string }[] = [];

  const appliesToProfile = (restriction: string, program?: string, cohort?: string): { applies: boolean; verified: boolean } => {
    if (!restriction.trim()) return { applies: true, verified: false };
    const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi-VN');
    const text = clean(restriction);
    let verified = true;
    let applies = true;
    const aliases: Record<string, string[]> = {
      'tieu chuan': ['tieu chuan', 'tc'],
      'clc': ['clc', 'chat luong cao'],
      'cttt': ['cttt', 'tien tien']
    };
    const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
    const hasStandard = text.includes('tieu chuan') || tokens.includes('tc');
    const hasClc = tokens.includes('clc') || text.includes('chat luong cao');
    const hasCttt = tokens.includes('cttt') || text.includes('tien tien');
    const explicitlyScoped = hasStandard || hasClc || hasCttt;
    if (explicitlyScoped) {
      if (!program) verified = false;
      else {
        const selected = clean(program);
        const choices = Object.entries(aliases).flatMap(([key, values]) =>
          values.some(alias => selected === alias || selected.includes(alias)) ? [key] : []
        );
        if (choices.length === 0) verified = false;
        else applies = choices.some(choice => {
          if (choice === 'tieu chuan') return hasStandard;
          if (choice === 'clc') return hasClc;
          return hasCttt;
        });
      }
    } else verified = false;

    const cohortRules = Array.from(text.matchAll(/\bk\s*(\d{2})\b/g)).map(match => Number(match[1]));
    if (cohortRules.length) {
      const studentCohort = Number((cohort || '').match(/\d{2}/)?.[0]);
      if (!Number.isFinite(studentCohort)) verified = false;
      else if (/ve truoc|tro ve truoc|den k|toi k/.test(text)) {
        applies = applies && studentCohort <= Math.min(...cohortRules);
      } else if (/tu k/.test(text)) {
        applies = applies && studentCohort >= Math.min(...cohortRules);
      } else if (cohortRules.length === 1) {
        applies = applies && studentCohort === cohortRules[0];
      } else verified = false;
    } else if (/k\d{2}|khoa/.test(text)) verified = false;
    return { applies, verified };
  };

  for (let courseIndex = 0; courseIndex < courses.length; courseIndex += 1) {
    const course = courses[courseIndex];
    for (const eq of uniEquivalences) {
      const codeMatch = eq.ftuCourseCodes.some(code => normalizeCode(code) === normalizeCode(course.code));
      const nameMatch = !eq.ftuCourseCodes.length && Boolean(course.name)
        && normalizeName(eq.ftuCourseNameClean) === normalizeName(course.name);
      if (!codeMatch && !nameMatch) continue;
      const scope = appliesToProfile(eq.curriculum || '', course.program, course.cohort);
      const mappingVerified = course.programMappingSource !== 'DEFAULT_STANDARD';
      if (!scope.applies) continue;
      const courseDataVerified = Boolean(course.name.trim()) && Number.isFinite(course.credits) && course.credits > 0;
      const hostKey = normalizeCode(eq.hostCourseCode)
        ? `code:${normalizeCode(eq.hostCourseCode)}`
        : `name:${normalizeName(eq.hostCourseName)}`;
      candidates.push({
        courseIndex,
        hostKey,
        eq,
        scopeVerified: scope.verified && mappingVerified && courseDataVerified,
        verificationReason: !courseDataVerified ? 'Hồ sơ chỉ có mã môn hoặc thiếu tên/tín chỉ; cần đối chiếu với CTĐT.'
          : !mappingVerified ? 'Loại chương trình đang dùng ánh xạ mặc định Tiêu chuẩn; cần đối chiếu nguồn FTU.'
          : scope.verified ? undefined : course.program
            ? 'Phạm vi chương trình/khóa trong nguồn thiếu hoặc chưa nhận diện được.'
            : 'Chưa có chương trình đào tạo để xác minh phạm vi áp dụng.'
      });
    }
  }

  // Max-cost augmenting paths maximize approved pairs first, then pending,
  // then uncertain pairs, while preserving a one-to-one course mapping.
  const hostKeys = Array.from(new Set(candidates.map(candidate => candidate.hostKey))).sort();
  const source = 0;
  const courseStart = 1;
  const hostStart = courseStart + courses.length;
  const sink = hostStart + hostKeys.length;
  type Edge = { to: number; rev: number; capacity: number; cost: number; candidate?: typeof candidates[number] };
  const graph: Edge[][] = Array.from({ length: sink + 1 }, () => []);
  const addEdge = (from: number, to: number, capacity: number, cost: number, candidate?: typeof candidates[number]) => {
    const forward: Edge = { to, rev: graph[to].length, capacity, cost, candidate };
    const reverse: Edge = { to: from, rev: graph[from].length, capacity: 0, cost: -cost };
    graph[from].push(forward);
    graph[to].push(reverse);
  };
  const hostIndex = new Map(hostKeys.map((key, index) => [key, index]));
  courses.forEach((_, index) => addEdge(source, courseStart + index, 1, 0));
  hostKeys.forEach((_, index) => addEdge(hostStart + index, sink, 1, 0));
  const count = courses.length;
  const statusWeight = { APPROVED: (count + 1) ** 2, PENDING: count + 1, UNCERTAIN: 1 };
  for (const candidate of candidates) {
    const matchStatus = candidate.scopeVerified ? candidate.eq.status : 'UNCERTAIN';
    const weight = statusWeight[matchStatus as keyof typeof statusWeight] || 0;
    if (weight) addEdge(courseStart + candidate.courseIndex, hostStart + hostIndex.get(candidate.hostKey)!, 1, -weight, candidate);
  }

  while (true) {
    const distance = Array(graph.length).fill(Number.POSITIVE_INFINITY) as number[];
    const previousNode = Array(graph.length).fill(-1) as number[];
    const previousEdge = Array(graph.length).fill(-1) as number[];
    const inQueue = Array(graph.length).fill(false) as boolean[];
    const queue = [source];
    distance[source] = 0;
    inQueue[source] = true;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const node = queue[cursor];
      inQueue[node] = false;
      graph[node].forEach((edge, edgeIndex) => {
        if (edge.capacity <= 0 || distance[edge.to] <= distance[node] + edge.cost) return;
        distance[edge.to] = distance[node] + edge.cost;
        previousNode[edge.to] = node;
        previousEdge[edge.to] = edgeIndex;
        if (!inQueue[edge.to]) { queue.push(edge.to); inQueue[edge.to] = true; }
      });
    }
    if (!Number.isFinite(distance[sink]) || distance[sink] >= 0) break;
    for (let node = sink; node !== source; node = previousNode[node]) {
      const edge = graph[previousNode[node]][previousEdge[node]];
      edge.capacity -= 1;
      graph[node][edge.rev].capacity += 1;
    }
  }

  const chosen = graph.slice(courseStart, hostStart).flatMap(edges => edges
    .filter(edge => edge.candidate && edge.capacity === 0)
    .map(edge => edge.candidate!));
  return chosen.map(candidate => {
    const course = courses[candidate.courseIndex];
    const eq = candidate.eq;
    const offeringTerms: ('HK1' | 'HK2')[] = [];
    for (const off of courseOfferings || []) {
      if (normalizeCode(off.courseCode) === normalizeCode(course.code) && !offeringTerms.includes(off.semester)) offeringTerms.push(off.semester);
    }
    const riskLevel: CourseMatchPair['riskLevel'] = eq.status === 'UNCERTAIN' || !candidate.scopeVerified ? 'HIGH'
      : eq.status === 'PENDING' || (offeringTerms.length === 1 && offeringTerms[0] === 'HK2') ? 'MEDIUM' : 'LOW';
    const riskReason = !candidate.scopeVerified ? candidate.verificationReason!
      : eq.status === 'PENDING' ? 'Môn đang chờ bộ môn phê duyệt. Cần nộp đề cương để xét.'
        : eq.status === 'UNCERTAIN' ? 'Dữ liệu tương đương chưa đủ chắc chắn trong tài liệu nguồn. Không được coi là kết quả đã duyệt.'
          : offeringTerms.length === 1 && offeringTerms[0] === 'HK2' ? 'Môn này tại FTU chỉ dự kiến mở vào HK2. Nếu không đổi được sẽ phải chờ năm sau.'
            : 'Môn tương đương đã được phê duyệt theo tài liệu nguồn.';
    return {
      ftuCourseCode: course.code,
      ftuCourseName: course.name,
      ftuCredits: course.credits,
      hostCourseCode: eq.hostCourseCode,
      hostCourseName: eq.hostCourseName,
      equivalenceId: eq.id,
      status: eq.status,
      verificationStatus: candidate.scopeVerified ? 'VERIFIED' as const : 'NEEDS_VERIFICATION' as const,
      verificationReason: candidate.verificationReason,
      faculty: eq.faculty,
      approver: eq.approver,
      approvalYear: eq.approvalYear,
      offeredInSemester: offeringTerms,
      riskLevel,
      riskReason
    };
  }).sort((a, b) => normalizeCode(a.ftuCourseCode).localeCompare(normalizeCode(b.ftuCourseCode)));
}

export function evaluateAllUniversities(
  universities: PartnerUniversity[],
  profile: StudentProfile,
  allEquivalences: CourseEquivalence[],
  costsByCountry: Record<string, CountryCost>,
  courseOfferings: CourseOffering[]
): UniversityMatchResult[] {
  // Extract remaining courses for student
  const remainingCourses: { code: string; name: string; credits: number; program?: string; cohort?: string; programMappingSource?: StudentProfile['programMappingSource'] }[] = [];
  const profileProgram = profile.programType || profile.program;

  if (profile.courses && profile.courses.length > 0) {
    for (const c of profile.courses) {
      if (isAvailableForTransfer(c)) {
        remainingCourses.push({
          code: c.courseCode,
          name: c.courseName,
          credits: c.credits,
          program: c.program || profileProgram,
          cohort: profile.cohort,
          programMappingSource: c.program ? undefined : profile.programMappingSource
        });
      }
    }
  } else if (profile.manualCourseCodes && profile.manualCourseCodes.length > 0) {
    for (const code of profile.manualCourseCodes) {
      remainingCourses.push({
        code: normalizeCode(code),
        name: '',
        credits: 0,
        program: profileProgram,
        cohort: profile.cohort,
        programMappingSource: profile.programMappingSource
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
    const verifiedPairs = approvedPairs.filter(p => p.verificationStatus === 'VERIFIED');
    const pendingPairs = matchedPairs.filter(p => p.status === 'PENDING');
    const uncertainPairs = matchedPairs.filter(p => p.status === 'UNCERTAIN' || p.verificationStatus !== 'VERIFIED');

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
    if (verifiedPairs.length < approvedPairs.length) {
      missingReqs.push(`${approvedPairs.length - verifiedPairs.length} môn đã duyệt cần xác minh thêm phạm vi chương trình`);
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

    if (uncertainPairs.length > 0) {
      missingReqs.push(`${uncertainPairs.length} equivalence chưa đủ cơ sở xác minh`);
    }
    if (dataStatus !== 'VERIFIED') {
      missingReqs.push('Một hoặc nhiều nguồn dữ liệu của kết quả này chưa ở trạng thái VERIFIED');
    }

    results.push({
      university: uni,
      matchedPairs,
      approvedPairsCount: approvedPairs.length,
      verifiedPairsCount: verifiedPairs.length,
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
