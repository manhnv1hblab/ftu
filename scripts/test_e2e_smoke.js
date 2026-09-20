/*
 * Deterministic smoke checks for the production data contract.
 * Browser-level tests can be layered on top of this without weakening the
 * source-of-truth guarantees enforced here.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'document/Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx',
  'document/[CTTĐ_S27] Danh sách trường đối tác trao đổi.xlsx',
  'document/Danh sách học phần tương đương (với các trường đối tác).xlsx',
  'document/Bảng chi phí ước tình khi tham gia kỳ trao đổi.xlsx',
  'document/Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx',
  'document/ChuongTrinhDaoTao.xlsx',
  'data/universities_s27.json',
  'data/equivalences_s27.json',
  'data/costs_by_country.json',
  'data/course_offerings_2627.json',
  'data/sample_curriculum.json'
];

for (const relative of required) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || fs.statSync(absolute).size === 0) {
    throw new Error(`Missing required artifact: ${relative}`);
  }
}

const universities = JSON.parse(fs.readFileSync(path.join(root, 'data/universities_s27.json'), 'utf8'));
const equivalences = JSON.parse(fs.readFileSync(path.join(root, 'data/equivalences_s27.json'), 'utf8'));
const costs = JSON.parse(fs.readFileSync(path.join(root, 'data/costs_by_country.json'), 'utf8'));

if (!Array.isArray(universities) || !universities.every((u) => u.source?.file)) {
  throw new Error('University data must be sourced from a document record.');
}
if (!Array.isArray(equivalences) || !equivalences.every((eq) => eq.source?.file)) {
  throw new Error('Equivalence data must be sourced from a document record.');
}
if (!costs || Object.values(costs).some((cost) => !cost.source?.file)) {
  throw new Error('Cost data must be sourced from a document record.');
}

console.log('E2E smoke contract: PASS');
