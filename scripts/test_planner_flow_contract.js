const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const context = read('src/context/StudentContext.tsx');
const step3 = read('src/components/planner/Step3Matches.tsx');
const step4 = read('src/components/planner/Step4CoursePlan.tsx');
const step5 = read('src/components/planner/Step5Compare.tsx');
const print = read('src/app/print/page.tsx');

const checks = [
  ['shortlist state is separate from saved plans', context.includes('preferredUniversities') && context.includes('PreferenceRank')],
  ['old Step 3 placeholder plans are no longer created', !step3.includes('setRankedChoice(')],
  ['Step 3 exposes the preference tray', step3.includes('Danh sách nguyện vọng') && step3.includes('Chọn vào NV')],
  ['Step 4 restores an existing plan', step4.includes('savedPlan?.transferredCourses') && step4.includes('savedPlan?.hostAdditionalCourses')],
  ['Step 4 labels the active preference', step4.includes('Đang lập phương án') && step4.includes('Lưu & xem so sánh')],
  ['Step 5 renders all three slots', step5.includes("const ranks: PreferenceRank[] = ['nv1', 'nv2', 'nv3']") && step5.includes('Chưa chọn trường')],
  ['Step 5 does not invent metrics for missing plans', step5.includes("if (!slot.plan) return '—'")],
  ['print output contains incomplete slots', print.includes('Chưa lập phương án') && print.includes('Chưa chọn trường')],
  ['export includes shortlist state', context.includes('preferredUniversities,') && context.includes('exportDraftJson')]
];

const failures = checks.filter(([, passed]) => !passed);
checks.forEach(([label, passed]) => console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${label}`));
if (failures.length > 0) process.exitCode = 1;
else console.log('Planner flow contract: PASS');
