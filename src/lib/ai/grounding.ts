import universitiesData from '../../../data/universities_s27.json';
import equivalencesData from '../../../data/equivalences_s27.json';
import costsData from '../../../data/costs_by_country.json';
import courseOfferingsData from '../../../data/course_offerings_2627.json';
import handbookData from '../../../data/handbook_s27.json';
import { S27_RULES } from '../../config/s27Rules';
import { SOURCE_MANIFEST } from '../../config/sourceManifest';
import { CourseOffering } from '../../types/courseOffering';
import { CourseEquivalence } from '../../types/equivalence';
import { PartnerUniversity } from '../../types/university';
import { CountryCost } from '../../types/cost';
import { StudentProfile } from '../../types/studentProfile';
import { sourceLabel, sourceStatus, normalizeCode, normalizeName } from '../dataIntegrity';

const universities = universitiesData as PartnerUniversity[];
const equivalences = equivalencesData as CourseEquivalence[];
const costs = costsData as Record<string, CountryCost>;
const offerings = courseOfferingsData as CourseOffering[];

const STOP_WORDS = new Set([
  'cho', 'toi', 'tôi', 'cua', 'của', 'minh', 'mình', 'la', 'là', 'gi', 'gì', 'the', 'thế',
  'nao', 'nào', 'voi', 'với', 'mot', 'một', 'cac', 'các', 'truong', 'trường', 'mon', 'môn',
  'duoc', 'được', 'co', 'có', 'hay', 'va', 'và', 'toi', 'tôi', 'can', 'cần', 'xem', 'hoi', 'hỏi'
]);

export interface GroundingCourseContext {
  courseCode?: string;
  courseName?: string;
  credits?: number;
  isTaken?: boolean;
  isPassed?: boolean;
}

export interface GroundingPlanContext {
  universityId?: string;
  universityName?: string;
  status?: string;
  transferredCourses?: Array<{
    ftuCourseCode?: string;
    ftuCourseName?: string;
    ftuCredits?: number;
    hostCourseCode?: string;
    hostCourseName?: string;
    status?: string;
  }>;
  hostAdditionalCourses?: Array<{
    hostCourseName?: string;
    hostCourseCode?: string;
    estimatedCredits?: number;
    note?: string;
  }>;
  graduationSimulation?: {
    remainingCreditsAfterExchange?: number;
    remainingMandatoryCourses?: string[];
    thesisEligible?: boolean;
    canGraduateOnTime?: boolean;
    riskWarnings?: string[];
  };
}

export interface GroundingContext {
  currentStep?: number;
  profile?: Partial<StudentProfile> & { courses?: GroundingCourseContext[] };
  currentPlan?: GroundingPlanContext | null;
  rankedChoices?: {
    nv1?: GroundingPlanContext;
    nv2?: GroundingPlanContext;
    nv3?: GroundingPlanContext;
  };
  preferredUniversities?: {
    nv1?: { universityId?: string; universityName?: string };
    nv2?: { universityId?: string; universityName?: string };
    nv3?: { universityId?: string; universityName?: string };
  };
}

export interface GroundingResult {
  facts: string;
  sources: string[];
  matchedRecords: number;
}

function safeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function tokensFor(value: string): string[] {
  return normalizeName(value)
    .split(/[^A-Za-z0-9À-ỹ]+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));
}

function scoreText(text: string, tokens: string[]): number {
  const normalized = normalizeName(text);
  return tokens.reduce((score, token) => score + (normalized.includes(token) ? 1 : 0), 0);
}

function sourceText(source: PartnerUniversity['source'] | CourseEquivalence['source'] | CountryCost['source'] | CourseOffering['source']): string {
  return `[Nguồn: ${sourceLabel(source)}; trạng thái ${sourceStatus(source)}]`;
}

function addUniqueSource(sources: Set<string>, source: PartnerUniversity['source'] | CourseEquivalence['source'] | CountryCost['source'] | CourseOffering['source']): void {
  sources.add(sourceLabel(source));
}

function compactProfile(profile?: GroundingContext['profile']): string[] {
  if (!profile) return [];
  const courses = Array.isArray(profile.courses) ? profile.courses : [];
  const remaining = courses.filter(course => !course.isPassed);
  const passedCredits = courses.filter(course => course.isPassed).reduce((sum, course) => sum + (course.credits || 0), 0);

  return [
    'HỒ SƠ NGƯỜI DÙNG (chỉ là dữ liệu người dùng cung cấp, không thay thế nguồn quy định):',
    `Khóa=${safeText(profile.cohort, 80) || 'chưa xác định'}; ngành=${safeText(profile.major, 120) || 'chưa xác định'}; chương trình=${safeText(profile.program, 80) || 'chưa xác định'}`,
    `GPA4=${typeof profile.gpa4 === 'number' ? profile.gpa4 : 'chưa có'}; GPA10=${typeof profile.gpa10 === 'number' ? profile.gpa10 : 'chưa có'}; số kỳ=${typeof profile.completedSemesters === 'number' ? profile.completedSemesters : 'chưa có'}; tín chỉ tích lũy=${typeof profile.accumulatedCredits === 'number' ? profile.accumulatedCredits : passedCredits}`,
    `Đã từng trao đổi=${profile.hasParticipatedSemesterExchange === null || profile.hasParticipatedSemesterExchange === undefined ? 'chưa xác minh' : profile.hasParticipatedSemesterExchange ? 'có' : 'không'}; học kỳ cuối=${profile.isFinalSemester === null || profile.isFinalSemester === undefined ? 'chưa xác minh' : profile.isFinalSemester ? 'có' : 'không'}; TTGK=${profile.hasPassedMidtermInternship === null || profile.hasPassedMidtermInternship === undefined ? 'chưa xác minh' : profile.hasPassedMidtermInternship ? 'đã hoàn thành' : 'chưa hoàn thành'}`,
    `Ngoại ngữ=${safeText(profile.languageCertificate?.testName, 60) || 'chưa có'} ${safeText(profile.languageCertificate?.score, 40)}; CEFR=${safeText(profile.languageCertificate?.level, 20) || 'chưa xác minh'}; còn hạn=${profile.languageCertificate?.isValid ? 'người dùng xác nhận' : 'chưa xác minh'}; hết hạn=${safeText(profile.languageCertificate?.expiryDate, 30) || 'chưa có'}`,
    `Tổng học phần=${courses.length}; đã đạt=${courses.filter(course => course.isPassed).length}; đang học=${courses.filter(course => course.isTaken && !course.isPassed).length}; còn lại=${remaining.length}; tín chỉ đã đạt tính từ danh sách=${passedCredits}`,
    `Mã các học phần còn lại: ${remaining.slice(0, 60).map(course => `${safeText(course.courseCode, 30)}${course.courseName ? ` (${safeText(course.courseName, 100)})` : ''}`).join(', ') || 'chưa có'}`
  ];
}

function compactPlan(label: string, plan?: GroundingPlanContext): string[] {
  if (!plan) return [];
  const transferred = Array.isArray(plan.transferredCourses) ? plan.transferredCourses : [];
  const additional = Array.isArray(plan.hostAdditionalCourses) ? plan.hostAdditionalCourses : [];
  const simulation = plan.graduationSimulation;
  return [
    `${label}: trường=${safeText(plan.universityName, 160) || 'chưa xác định'}; trạng thái=${safeText(plan.status, 40) || 'chưa xác định'}`,
    `Môn chuyển về FTU trong bản nháp: ${transferred.map(course => `${safeText(course.ftuCourseCode, 40)}-${safeText(course.hostCourseCode, 50)} [${safeText(course.status, 30) || 'chưa rõ'}]`).join(', ') || 'chưa có'}`,
    `Môn bổ sung tại đối tác: ${additional.map(course => `${safeText(course.hostCourseName, 100)}${course.hostCourseCode ? ` (${safeText(course.hostCourseCode, 50)})` : ''}`).join(', ') || 'chưa có'}`,
    simulation ? `Mô phỏng: còn ${typeof simulation.remainingCreditsAfterExchange === 'number' ? simulation.remainingCreditsAfterExchange : 'chưa có'} tín chỉ; HPTN=${simulation.thesisEligible === undefined ? 'chưa xác minh' : simulation.thesisEligible ? 'đạt theo mô phỏng' : 'chưa đạt theo mô phỏng'}; đúng hạn=${simulation.canGraduateOnTime === undefined ? 'chưa xác minh' : simulation.canGraduateOnTime ? 'có khả năng' : 'cần xác minh'}; cảnh báo=${simulation.riskWarnings?.join(' | ') || 'không có dữ liệu'}` : `${label}: chưa có mô phỏng tốt nghiệp`
  ];
}

export function buildGroundingContext(query: string, context: GroundingContext = {}): GroundingResult {
  const queryText = safeText(query, 2000);
  const queryTokens = tokensFor(queryText);
  const sourceSet = new Set<string>();
  const facts: string[] = [
    'PHẠM VI: FTU GoGlobal S27, Học kỳ II năm học 2026-2027. Chỉ sử dụng dữ liệu và quy định trong các nguồn dưới đây.',
    `PHIÊN BẢN DỮ LIỆU: ${S27_RULES.dataVersion}.`,
    `NGUỒN ĐÃ KHAI BÁO: ${SOURCE_MANIFEST.map(source => `${source.file} [${source.status}]`).join('; ')}`,
    `QUY TẮC S27 ĐÃ CHUẨN HÓA: GPA4 >= ${S27_RULES.gpa4Minimum}; GPA10 >= ${S27_RULES.gpa10Minimum}; hoàn thành >= ${S27_RULES.completedSemestersMinimum} học kỳ; tích lũy >= ${S27_RULES.accumulatedCreditsMinimum} tín chỉ; còn >= ${S27_RULES.remainingCoursesMinimum} học phần; học tại đối tác >= ${S27_RULES.hostCoursesMinimum} học phần; chuyển về FTU tối thiểu ${S27_RULES.transferredCoursesMinimum} học phần; ngoại ngữ tối thiểu ${S27_RULES.englishMinimumLevel} và phải còn hiệu lực. ${sourceText(S27_RULES.source)}`
  ];
  addUniqueSource(sourceSet, S27_RULES.source);

  if (Array.isArray(handbookData.academicConditions)) {
    facts.push(`ĐIỀU KIỆN TRONG CẨM NANG S27: ${handbookData.academicConditions.map(condition => safeText(condition, 500)).join(' | ')} ${sourceText(S27_RULES.source)}`);
  }

  const profileCourseCodes = (context.profile?.courses || [])
    .map(course => normalizeCode(safeText(course.courseCode, 40)))
    .filter(Boolean);
  const searchTokens = Array.from(new Set([...queryTokens, ...profileCourseCodes.map(code => code.toLocaleLowerCase('vi-VN'))]));

  const partnerMatches = universities
    .map(university => ({
      university,
      score: scoreText([
        university.name,
        university.aliasInTong,
        university.country,
        university.region,
        university.languages,
        university.requirements,
        university.scholarship
      ].filter(Boolean).join(' '), searchTokens)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const selectedUniversityIds = new Set<string>([
    context.currentPlan?.universityId,
    context.rankedChoices?.nv1?.universityId,
    context.rankedChoices?.nv2?.universityId,
    context.rankedChoices?.nv3?.universityId,
    context.preferredUniversities?.nv1?.universityId,
    context.preferredUniversities?.nv2?.universityId,
    context.preferredUniversities?.nv3?.universityId
  ].filter((value): value is string => Boolean(value)));
  for (const university of universities.filter(item => selectedUniversityIds.has(item.id))) {
    if (!partnerMatches.some(item => item.university.id === university.id)) partnerMatches.push({ university, score: 100 });
  }

  for (const { university } of partnerMatches) {
    facts.push(`ĐỐI TÁC: ${university.name} | quốc gia=${university.country} | khu vực=${university.region} | ngôn ngữ=${university.languages || 'chưa có'} | yêu cầu riêng=${university.requirements || 'chưa có dữ liệu'} | học bổng=${university.scholarship || 'chưa có dữ liệu'} ${sourceText(university.source)}`);
    addUniqueSource(sourceSet, university.source);
  }

  const equivalenceMatches = equivalences
    .map(equivalence => ({
      equivalence,
      score: scoreText([
        equivalence.partnerUni,
        equivalence.hostCourseCode,
        equivalence.hostCourseName,
        equivalence.ftuCourseNameClean,
        equivalence.ftuCourseCodes.join(' '),
        equivalence.country
      ].join(' '), searchTokens)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => {
      const statusScore = (status: string) => status === 'APPROVED' ? 3 : status === 'PENDING' ? 2 : status === 'UNCERTAIN' ? 1 : 0;
      return statusScore(b.equivalence.status) - statusScore(a.equivalence.status) || b.score - a.score;
    })
    .slice(0, 20);

  for (const { equivalence } of equivalenceMatches) {
    facts.push(`EQUIVALENCE: ${equivalence.partnerUni} | host=${equivalence.hostCourseCode} ${equivalence.hostCourseName} | FTU=${equivalence.ftuCourseCodes.join(', ') || equivalence.ftuCourseNameClean} | trạng thái=${equivalence.status} | tín chỉ FTU không được tự suy ra ngoài dữ liệu hồ sơ | ${sourceText(equivalence.source)}`);
    addUniqueSource(sourceSet, equivalence.source);
  }

  const partnerCountries = partnerMatches.map(item => normalizeName(item.university.country));
  const costMatches = Object.values(costs)
    .map(cost => ({ cost, score: scoreText([cost.country, cost.warningNote].join(' '), searchTokens) + (partnerCountries.includes(normalizeName(cost.country)) ? 2 : 0) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  for (const { cost } of costMatches) {
    facts.push(`CHI PHÍ: ${cost.country} | sinh hoạt=${cost.livingCost.min ?? 'NO_DATA'}-${cost.livingCost.max ?? 'NO_DATA'} triệu VNĐ/tháng | KTX=${cost.dormitoryCost.min ?? 'NO_DATA'}-${cost.dormitoryCost.max ?? 'NO_DATA'} | thuê ngoài=${cost.rentCost.min ?? 'NO_DATA'}-${cost.rentCost.max ?? 'NO_DATA'} | requiresVerification=${cost.requiresVerification} | ghi chú=${cost.warningNote || 'không có'} ${sourceText(cost.source)}`);
    addUniqueSource(sourceSet, cost.source);
  }

  const offeringMatches = offerings
    .map(offering => ({ offering, score: scoreText([offering.courseCode, offering.courseName, offering.semester, offering.academicYear, offering.cohortTarget].join(' '), searchTokens) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
  for (const { offering } of offeringMatches) {
    facts.push(`MỞ MÔN: ${offering.courseCode} ${offering.courseName} | ${offering.credits} tín chỉ | ${offering.semester} | năm học=${offering.academicYear} | đối tượng=${offering.cohortTarget} ${sourceText(offering.source)}`);
    addUniqueSource(sourceSet, offering.source);
  }

  const handbookSteps = Array.isArray(handbookData.steps)
    ? handbookData.steps
      .map(step => ({ step, score: scoreText(`${step.title} ${step.detail} ${step.timeline}`, queryTokens) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
    : [];
  for (const { step } of handbookSteps) {
    facts.push(`QUY TRÌNH BƯỚC ${step.step}: ${safeText(step.title, 240)} | ${safeText(step.detail, 900)} | thời gian=${safeText(step.timeline, 300)} ${sourceText(S27_RULES.source)}`);
  }

  facts.push(...compactProfile(context.profile));
  facts.push(...compactPlan('KẾ HOẠCH HIỆN TẠI', context.currentPlan || undefined));
  facts.push(...compactPlan('NGUYỆN VỌNG 1', context.rankedChoices?.nv1));
  facts.push(...compactPlan('NGUYỆN VỌNG 2', context.rankedChoices?.nv2));
  facts.push(...compactPlan('NGUYỆN VỌNG 3', context.rankedChoices?.nv3));
  for (const rank of ['nv1', 'nv2', 'nv3'] as const) {
    const preferred = context.preferredUniversities?.[rank];
    if (preferred) {
      facts.push(`${rank.toUpperCase()}: trường đã chọn=${safeText(preferred.universityName, 160)}; trạng thái phương án=${context.rankedChoices?.[rank] ? 'đã lưu' : 'chưa lập phương án'}`);
    }
  }
  facts.push(`CÂU HỎI HIỆN TẠI: ${queryText}`);
  facts.push('NGUYÊN TẮC DỮ LIỆU: APPROVED mới là mapping đã duyệt; PENDING/UNCERTAIN/REJECTED không được trình bày như đã được công nhận. Thiếu nguồn hoặc yêu cầu riêng chưa đối chiếu phải trả lời là NEEDS_VERIFICATION. Không suy ra dữ liệu học phí, visa, học bổng, tín chỉ host, equivalence hoặc khả năng đỗ nếu nguồn không nêu rõ.');

  return {
    facts: facts.join('\n'),
    sources: Array.from(sourceSet),
    matchedRecords: partnerMatches.length + equivalenceMatches.length + costMatches.length + offeringMatches.length + handbookSteps.length
  };
}
