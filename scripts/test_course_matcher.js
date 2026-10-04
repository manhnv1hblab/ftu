const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true }
  }).outputText;
  module._compile(output, filename);
};

const { evaluateAllUniversities, matchCoursesForUniversity } = require('../src/engine/matcher.ts');
const { isExcludedFromTransfer, isTransferCandidate } = require('../src/engine/transferEligibility.ts');
const { findCountryCost } = require('../src/engine/costCalculator.ts');
const university = { id: 'partner-1', name: 'Partner One' };
const student = (code, program = 'Tiêu chuẩn', cohort = 'K62') => ({ code, name: `FTU ${code}`, credits: 3, program, cohort });
const equivalence = (id, ftu, host, status = 'APPROVED', curriculum = 'Tiêu chuẩn, CLC, CTTT') => ({
  id, partnerUni: 'Partner One', partnerS27Id: 'partner-1', region: 'Asia', country: 'Korea',
  hostCourseName: `Host ${host}`, hostCourseCode: host, ftuCourseNameRaw: `FTU ${ftu}`,
  ftuCourseNameClean: `FTU ${ftu}`, ftuCourseCodeRaw: ftu, ftuCourseCodes: [ftu],
  curriculum, faculty: '', approver: 'Faculty', approvalYear: '2026', status,
  source: { file: 'Danh sách học phần tương đương (với các trường đối tác).xlsx', row: 2 }
});

const maximumMatching = matchCoursesForUniversity(university, [student('A'), student('B')], [
  equivalence('a-h1', 'A', 'H1'), equivalence('a-h2', 'A', 'H2'), equivalence('b-h1', 'B', 'H1')
]);
assert.equal(maximumMatching.length, 2, 'augmenting match finds two pairs when greedy first choice would find one');
assert.deepEqual(maximumMatching.map(pair => [pair.ftuCourseCode, pair.hostCourseCode]), [['A', 'H2'], ['B', 'H1']]);

const approvedPriority = matchCoursesForUniversity(university, [student('A')], [
  equivalence('pending', 'A', 'H1', 'PENDING'), equivalence('approved', 'A', 'H2', 'APPROVED')
]);
assert.equal(approvedPriority[0].equivalenceId, 'approved', 'approved mappings outrank pending alternatives');

const wrongProgram = matchCoursesForUniversity(university, [student('A', 'Tiêu chuẩn')], [
  equivalence('clc-only', 'A', 'H1', 'APPROVED', 'CLC')
]);
assert.equal(wrongProgram.length, 0, 'program-specific mapping is excluded from a different program');

const oldCohort = matchCoursesForUniversity(university, [student('A', 'Tiêu chuẩn', 'K62')], [
  equivalence('old-only', 'A', 'H1', 'APPROVED', 'Tiêu chuẩn áp dụng từ K59 về trước')
]);
assert.equal(oldCohort.length, 0, 'cohort-specific mapping is excluded outside its stated cohort range');

const incompleteScope = matchCoursesForUniversity(university, [student('A')], [
  equivalence('blank-scope', 'A', 'H1', 'APPROVED', '')
]);
assert.equal(incompleteScope[0].verificationStatus, 'NEEDS_VERIFICATION', 'blank curriculum scope cannot be counted as verified');

const manualCourse = matchCoursesForUniversity(university, [{ code: 'A', name: '', credits: 0, program: 'Tiêu chuẩn', cohort: 'K62' }], [
  equivalence('manual', 'A', 'H1')
]);
assert.equal(manualCourse[0].verificationStatus, 'NEEDS_VERIFICATION', 'manual code without course name and credits needs profile verification');

assert.equal(isExcludedFromTransfer({ courseCode: 'KTE504', courseName: '\u0054h\u1ef1c t\u1eadp gi\u1eefa kh\u00f3a' }), true, 'midterm internship is excluded from equivalence matching');
assert.equal(isExcludedFromTransfer({ courseCode: 'KTE526', courseName: 'Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p' }), true, 'graduation thesis is excluded from equivalence matching');
for (const code of ['KTE504', 'KTE526', 'HPTN', 'KLTN', 'KTE525']) {
  assert.equal(isTransferCandidate({
    courseCode: code,
    courseName: 'Open course',
    credits: 3,
    isMandatory: true,
    isTaken: false,
    isPassed: false,
    status: 'NOT_TAKEN'
  }), false, `${code} is not a transfer candidate`);
}
assert.equal(isTransferCandidate({
  courseCode: 'SPECIAL-1',
  courseName: 'Th\u1ef1c t\u1eadp gi\u1eefa kh\u00f3a',
  credits: 3,
  isMandatory: true,
  isTaken: false,
  isPassed: false,
  status: 'NOT_TAKEN'
}), false, 'midterm internship name marker is not a transfer candidate');
assert.equal(isTransferCandidate({
  courseCode: 'SPECIAL-2',
  courseName: 'Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p',
  credits: 9,
  isMandatory: true,
  isTaken: false,
  isPassed: false,
  status: 'NOT_TAKEN'
}), false, 'graduation thesis name marker is not a transfer candidate');
assert.equal(isTransferCandidate({
  courseCode: 'OPEN-1',
  courseName: 'Open course',
  credits: 3,
  isMandatory: true,
  isTaken: false,
  isPassed: false,
  status: 'NOT_TAKEN'
}), true, 'an open ordinary course remains a transfer candidate');
const excludedCourses = matchCoursesForUniversity(university, [
  student('KTE504'),
  { ...student('KTE526'), name: 'Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p' }
], [
  equivalence('ttgk', 'KTE504', 'TTGK'),
  equivalence('thesis', 'KTE526', 'THESIS')
]);
assert.equal(excludedCourses.length, 0, 'thesis and midterm internship never become transfer pairs');

const defaultStandard = matchCoursesForUniversity(university, [{
  code: 'A', name: 'FTU A', credits: 3, program: 'Tiêu chuẩn', cohort: 'K62', programMappingSource: 'DEFAULT_STANDARD'
}], [equivalence('standard-default', 'A', 'H1', 'APPROVED', 'Tiêu chuẩn')]);
assert.equal(defaultStandard.length, 1, 'default Standard mapping still exposes matching candidates');
assert.equal(defaultStandard[0].verificationStatus, 'NEEDS_VERIFICATION', 'default Standard mapping carries a verification warning');

const duplicateHost = matchCoursesForUniversity(university, [student('A'), student('B')], [
  equivalence('a-h1', 'A', 'H1'), equivalence('b-h1', 'B', 'H1')
]);
assert.equal(new Set(duplicateHost.map(pair => pair.hostCourseCode)).size, duplicateHost.length, 'host course cannot be reused');

const ordered = [equivalence('a-h1', 'A', 'H1'), equivalence('a-h2', 'A', 'H2'), equivalence('b-h1', 'B', 'H1')];
const reorderedResult = matchCoursesForUniversity(university, [student('A'), student('B')], [...ordered].reverse());
assert.deepEqual(reorderedResult.map(pair => [pair.ftuCourseCode, pair.equivalenceId]), maximumMatching.map(pair => [pair.ftuCourseCode, pair.equivalenceId]), 'input order does not change the selected mapping');

const currentUniversities = require('../data/universities_s27.json');
const currentEquivalences = require('../data/equivalences_s27.json');
const currentCosts = require('../data/costs_by_country.json');
assert.equal(findCountryCost('Korea', currentCosts)?.country, 'Hàn Quốc', 'known country aliases resolve to the audited cost record');
assert.equal(findCountryCost('"HongKong, China"', currentCosts), undefined, 'Hong Kong is not assigned mainland China costs when no audited Hong Kong source exists');
const currentOfferings = require('../data/course_offerings_2627.json');
const currentCourses = require('../data/sample_curriculum.json');
const currentProfile = {
  cohort: 'K63', major: 'Kinh tế quốc tế', program: 'Tiêu chuẩn', programType: 'Tiêu chuẩn', programMappingSource: 'DEFAULT_STANDARD',
  gpa4: 3.61, gpa10: 8.55, completedSemesters: 4, accumulatedCredits: 93, courses: currentCourses,
  monthlyBudgetVnd: 0, stayDurationMonths: 5, housingType: 'ANY', preferredRegions: [], manualCourseCodes: [],
  exchangeSemester: 'Học kỳ II năm học 2026 - 2027 (S27)', targetGraduationSemester: 'Học kỳ II năm học 2027 - 2028',
  hasParticipatedSemesterExchange: false, isFinalSemester: false, hasExemplaryStudentAward: false, hasPassedMidtermInternship: true,
  languageCertificate: { availability: 'HAS_CERTIFICATE', validity: 'VALID', language: 'English', testName: 'IELTS', score: '6.5', level: 'B2', isValid: true },
  isProfileComplete: true
};
const currentResults = evaluateAllUniversities(currentUniversities, currentProfile, currentEquivalences, currentCosts, currentOfferings);
assert(currentResults.some(result => result.approvedPairsCount >= 3), 'default Tiêu chuẩn mapping keeps approved university candidates visible');
const currentTop = currentResults.find(result => result.approvedPairsCount >= 3);
assert(currentTop && currentTop.verifiedPairsCount < currentTop.approvedPairsCount, 'default mapping keeps verification warning separate from approved count');

console.log('Course matcher scenarios: PASS');
const { removeUnavailableTransfers } = require('../src/engine/transferEligibility.ts');
const { simulateStudentProgress } = require('../src/engine/progressSimulator.ts');
const universities = require('../data/universities_s27.json');
const equivalences = require('../data/equivalences_s27.json');
const shanghai = universities.find(u => u.name === 'Shanghai University of Finance and Economics');
assert.ok(shanghai);
const courses = ['KTE402', 'KTE441', 'TIN314'].map(code => ({
  courseCode: code, courseName: code, credits: 3, program: 'Tiêu chuẩn',
  isMandatory: true, isPassed: false, isTaken: false
}));
const profile = { gpa4: 3, gpa10: 8, accumulatedCredits: 60, completedSemesters: 4, monthlyBudgetVnd: 0, stayDurationMonths: 5, courses, program: 'Tiêu chuẩn', cohort: 'K62', languageCertificate: {}, preferredRegions: [] };
const evaluate = () => evaluateAllUniversities([shanghai], profile, equivalences, {}, [])[0];
const before = evaluate();
assert.equal(before.approvedPairsCount, 3);
courses[2].isTaken = true;
const after = evaluate();
assert.equal(after.approvedPairsCount, 2, 'enrolled TIN314 must not satisfy the 3-transfer minimum');
assert.ok(after.matchedPairs.every(pair => pair.ftuCourseCode !== 'TIN314'));
const draft = { universityId: shanghai.id, universityName: shanghai.name, status: 'VALID', transferredCourses: before.matchedPairs, graduationSimulation: {} };
const cleaned = removeUnavailableTransfers(draft, courses);
assert.equal(cleaned.transferredCourses.length, 2);
assert.equal(cleaned.status, 'NEEDS_VERIFICATION');
assert.equal(cleaned.graduationSimulation, undefined);
assert.equal(draft.transferredCourses.length, 3, 'draft sanitation must not mutate the original');
const simulation = simulateStudentProgress(courses, before.matchedPairs, [], '', null);
assert.equal(simulation.creditsTransferred, 6, 'stale enrolled selection cannot add transfer credits');
const specialTransferPair = { ...before.matchedPairs[0], ftuCourseCode: 'KTE526', ftuCourseName: 'Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p' };
assert.equal(simulateStudentProgress(courses, [specialTransferPair], [], '', null).creditsTransferred, 0, 'thesis pair cannot add transfer credits from a stale plan');
const staleSpecialPlan = removeUnavailableTransfers({ ...draft, transferredCourses: [specialTransferPair] }, courses);
assert.equal(staleSpecialPlan.transferredCourses.length, 0, 'stale thesis pair is removed from saved plans');
const inProgressProjection = simulateStudentProgress([
  { courseCode: 'DONE-LATER', courseName: 'Đang học', credits: 12, isMandatory: true, isTaken: true, isPassed: false },
  { courseCode: 'NOT-TAKEN', courseName: 'Chưa học', credits: 3, isMandatory: true, isTaken: false, isPassed: false }
], [], [], '', true);
assert.equal(inProgressProjection.initialRemainingCredits, 3, 'in-progress credits are excluded from projected remaining credits');
assert.equal(inProgressProjection.remainingDebtExcludingThesisAndExempt, 3, 'in-progress credits are excluded from HPTN debt');
assert.equal(inProgressProjection.warnings.some(warning => warning.includes('12 tín chỉ')), false, 'in-progress credits do not trigger a debt warning');
const explicitStatusProjection = simulateStudentProgress([
  { courseCode: 'STALE', courseName: 'Explicitly in progress', credits: 12, isMandatory: true, isTaken: false, isPassed: false, status: 'IN_PROGRESS' },
  { courseCode: 'OPEN', courseName: 'Not taken', credits: 3, isMandatory: true, isTaken: true, isPassed: true, status: 'NOT_TAKEN' }
], [], [], '', true);
assert.equal(explicitStatusProjection.initialRemainingCredits, 3, 'explicit status overrides stale imported boolean flags');

const electiveProjection = simulateStudentProgress([
  { courseCode: 'E1', courseName: 'Elective 1', credits: 3, isMandatory: false, isTaken: false, isPassed: true, electiveGroup: 'G', minCredits: 6 },
  { courseCode: 'E2', courseName: 'Elective 2', credits: 3, isMandatory: false, isTaken: false, isPassed: false, electiveGroup: 'G', minCredits: 6 },
  { courseCode: 'E3', courseName: 'Elective 3', credits: 3, isMandatory: false, isTaken: false, isPassed: false, electiveGroup: 'G', minCredits: 6 },
  { courseCode: 'E4', courseName: 'Elective 4', credits: 3, isMandatory: false, isTaken: false, isPassed: false, electiveGroup: 'G', minCredits: 6 }
], [], [], '', true);
assert.equal(electiveProjection.initialRemainingCredits, 3, 'elective debt counts the group minimum instead of every available option');
assert.equal(electiveProjection.remainingDebtExcludingThesisAndExempt, 3, 'HPTN debt also caps elective alternatives at the group requirement');
courses[2].isPassed = true;
assert.equal(evaluate().approvedPairsCount, 2, 'passed courses must remain excluded');
courses[2].isPassed = false;
courses[2].isTaken = false;
assert.equal(evaluate().approvedPairsCount, 3, 'course becomes available after status returns to not taken');
console.log('Enrolled-course Shanghai regression: PASS');
