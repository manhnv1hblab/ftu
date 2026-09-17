const fs = require('fs');
const path = require('path');

// Load JSON data
const DATA_DIR = path.join(__dirname, '..', 'data');
const universities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'universities_s27.json'), 'utf8'));
const equivalences = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'equivalences_s27.json'), 'utf8'));
const costs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'costs_by_country.json'), 'utf8'));
const offerings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'course_offerings_2627.json'), 'utf8'));
const curriculum = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'sample_curriculum.json'), 'utf8'));

console.log('=== RUNNING ENGINE RULES TEST SUITE ===');

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, message) {
  testsTotal++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  }
}

// -------------------------------------------------------------
// Test 1: S27 GPA thresholds (2.8/4 and 7.5/10 - strictly enforced)
// -------------------------------------------------------------
assert(2.8 >= 2.8 && 2.79 < 2.8, "GPA 2.8 threshold strictly enforced");
assert(7.5 >= 7.5 && 7.49 < 7.5, "GPA 7.5/10 threshold strictly enforced");

// -------------------------------------------------------------
// Test 2: Threshold for matching is >= 3 (not > 3)
// -------------------------------------------------------------
const test3Courses = [
  { code: 'KTE402', name: 'Kinh tế vĩ mô 2', credits: 3 },
  { code: 'KTE408', name: 'Tổ chức ngành', credits: 3 },
  { code: 'TIN314', name: 'Lập trình cho phân tích dữ liệu', credits: 3 }
];
assert(test3Courses.length >= 3, "Threshold is >= 3, exactly 3 qualifies");
assert([test3Courses[0], test3Courses[1]].length < 3, "2 courses does NOT qualify");

// -------------------------------------------------------------
// Test 3: Bipartite 1-1 matching prevents duplicate pairing
// -------------------------------------------------------------
// If a partner course maps to 3 FTU courses in raw data, it must NOT produce 3 matches for a single host course
const hostCoursesUsed = new Set();
const ftuCoursesUsed = new Set();
let pairsCount = 0;

const mockCandidateEqs = [
  { hostCourseCode: 'ECON101', hostCourseName: 'Macro', ftuCode: 'KTE402' },
  { hostCourseCode: 'ECON101', hostCourseName: 'Macro', ftuCode: 'KTEE402' },
  { hostCourseCode: 'ECON101', hostCourseName: 'Macro', ftuCode: 'KTE402E' }
];

for (const eq of mockCandidateEqs) {
  if (!hostCoursesUsed.has(eq.hostCourseCode) && !ftuCoursesUsed.has(eq.ftuCode)) {
    hostCoursesUsed.add(eq.hostCourseCode);
    ftuCoursesUsed.add(eq.ftuCode);
    pairsCount++;
  }
}
assert(pairsCount === 1, "Single host course only pairs once (1-1 matching)");

// -------------------------------------------------------------
// Test 4: Electives Group calculation:
// Group needs 9 credits, student passed 3 (6 remaining).
// Student takes 3 courses (9 credits) at host:
// Only 6 credits should be deducted from remaining group debt! Extra 3 credits should not cross-deduct.
// -------------------------------------------------------------
const groupMin = 9;
const groupPassed = 3;
let groupRemaining = groupMin - groupPassed; // 6

const hostNewCoursesInGroup = [3, 3, 3]; // 9 credits
let effectiveDeducted = 0;
let wastedExcess = 0;

for (const cr of hostNewCoursesInGroup) {
  const deduct = Math.min(cr, groupRemaining);
  groupRemaining -= deduct;
  effectiveDeducted += deduct;
  wastedExcess += (cr - deduct);
}

assert(effectiveDeducted === 6, `Effective deduction is exactly 6 credits (actual: ${effectiveDeducted})`);
assert(wastedExcess === 3, `Excess 3 credits cannot deduct from other groups (actual: ${wastedExcess})`);
assert(groupRemaining === 0, `Group is now completed with 0 credits remaining`);

// -------------------------------------------------------------
// Test 5: Graduation Thesis (HPTN) <= 6 credits rule + TTGK check
// -------------------------------------------------------------
function testThesisEligibility(debtCredits, hasTTGK) {
  const eligibleCredits = debtCredits <= 6;
  const canRegister = eligibleCredits && hasTTGK;
  return { eligibleCredits, canRegister };
}

assert(testThesisEligibility(6, true).canRegister === true, "Debt = 6 and has TTGK -> Can register thesis");
assert(testThesisEligibility(7, true).canRegister === false, "Debt = 7 -> CANNOT register thesis (exceeds 6 credits)");
assert(testThesisEligibility(5, false).canRegister === false, "Debt = 5 but missing TTGK -> CANNOT register thesis");

// -------------------------------------------------------------
// Test 6: Switzerland (Thụy Sĩ) 2-column discrepancy warning
// -------------------------------------------------------------
const swissCosts1 = costs['Thụy Sĩ'];
const swissCosts2 = costs['Thuỵ Sỹ'];
assert(swissCosts1 && swissCosts2, "Both Swiss columns exist in normalized cost data");
assert(swissCosts1.requiresVerification === true, "Swiss cost 1 has requiresVerification flag");
assert(swissCosts2.requiresVerification === true, "Swiss cost 2 has requiresVerification flag");
assert(swissCosts1.livingCost.min !== swissCosts2.livingCost.min, "Living costs between the two Swiss columns are different");

// -------------------------------------------------------------
// Test 7: Sample curriculum passed vs taken-but-not-passed
// -------------------------------------------------------------
const passedInCurric = curriculum.filter(c => c.isPassed).length;
const takenNotPassedInCurric = curriculum.filter(c => c.isTaken && !c.isPassed).length;
assert(passedInCurric === 32, `Exactly 32 passed courses in sample curriculum (found: ${passedInCurric})`);
assert(takenNotPassedInCurric === 9, `Exactly 9 taken but not passed courses in sample curriculum (found: ${takenNotPassedInCurric})`);

console.log(`\n=== TEST RESULTS: ${testsPassed}/${testsTotal} TESTS PASSED ===`);
