const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const XLSX = require('xlsx');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 }
  }).outputText, filename);
};
const { parseCurriculumRows } = require('../src/lib/curriculumParser.ts');
const header = ['Mã MH', 'Tên môn học', 'Số tín chỉ', 'Bắt buộc', 'Đang học', 'Đã đạt'];
const parsed = parseCurriculumRows([header, ['A101', 'Course A', '3,5', true, '✓', ''], ['B101', 'Course B', 3, 'x', '', true]]);
assert.equal(parsed[0].credits, 3.5);
assert.equal(parsed[0].isTaken, true);
assert.equal(parsed[0].isPassed, false);
assert.equal(parsed[0].status, 'IN_PROGRESS');
assert.equal(parsed[1].isTaken, true);
assert.equal(parsed[1].isPassed, true);
assert.equal(parsed[1].status, 'PASSED');
assert.throws(() => parseCurriculumRows([header, ['A101', 'A', '3garbage']]), /tín chỉ/);
assert.throws(() => parseCurriculumRows([header, ['A101', 'A', 3, '', '?']]), /Trạng thái/);
assert.throws(() => parseCurriculumRows([header, ['A101', 'A', 3], ['A 101', 'A', 3]]), /Trùng mã/);
assert.equal(parseCurriculumRows([...Array.from({ length: 8 }, () => ['Title']), header, ['A101', 'A', 3]]).length, 1);
const workbook = XLSX.readFile('document/ChuongTrinhDaoTao.xlsx');
const actual = parseCurriculumRows(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }));
const expected = require('../data/sample_curriculum.json');
assert.equal(actual.length, expected.length);
for (const course of actual) {
  const source = expected.find(item => item.courseCode === course.courseCode);
  assert(source, course.courseCode);
  for (const key of ['credits', 'isPassed', 'isTaken', 'isMandatory']) assert.equal(course[key], source[key], `${course.courseCode}: ${key}`);
}
console.log(`Curriculum parser: PASS (${actual.length} real workbook courses and malformed-input regressions)`);
