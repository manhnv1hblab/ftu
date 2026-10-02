// Read-only reconciliation of the equivalence workbook and normalized records.
const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
const workbookPath = path.join(root, 'document', 'Danh sách học phần tương đương (với các trường đối tác).xlsx');
const workbook = XLSX.readFile(workbookPath, { cellDates: false });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Tổng, { header: 1, defval: null, blankrows: true });
const records = JSON.parse(fs.readFileSync(path.join(root, 'data', 'equivalences_s27.json'), 'utf8'));
const sourceRows = new Map();
const omitted = {};
for (let index = 1; index < rows.length; index += 1) {
  const row = rows[index];
  if (!row || !row.some(value => value !== null && value !== '')) continue;
  const rowNumber = index + 1;
  sourceRows.set(rowNumber, row);
  const reason = !String(row[2] || '').trim() ? 'missing_partner'
    : !String(row[3] || '').trim() ? 'missing_host_course_name' : null;
  if (reason) omitted[reason] = (omitted[reason] || 0) + 1;
}
const countByRow = new Map();
const unlinked = {};
const flags = { approvedWithoutApproverOrYear: [], approvedWithReviewMarker: [] };
const sourceStatusDifferences = [];
for (const record of records) {
  const row = record.source?.row;
  countByRow.set(row, (countByRow.get(row) || 0) + 1);
  const source = sourceRows.get(row) || [];
  const rawName = String(source[5] || '').toLocaleLowerCase('vi-VN');
  const sourceStatus = ['không tương đương', 'không ương đương', 'không có học phần', 'từ chối', 'ko tương đương'].some(marker => rawName.includes(marker)) ? 'REJECTED'
    : ['đang xét', 'chờ xét', 'đang xin ý kiến'].some(marker => rawName.includes(marker)) ? 'PENDING'
      : ['chưa rõ', 'xem lại', 'cần rà soát', 'chưa xác minh'].some(marker => rawName.includes(marker)) ? 'UNCERTAIN'
        : source[9] || source[10] ? 'APPROVED' : 'UNCERTAIN';
  if (sourceStatus !== record.status) sourceStatusDifferences.push({ id: record.id, row, sourceStatus, normalizedStatus: record.status });
  if (!record.partnerS27Id) {
    const name = record.partnerUni || '(trường trống)';
    unlinked[name] ||= {};
    unlinked[name][record.status] = (unlinked[name][record.status] || 0) + 1;
  }
  if (record.status === 'APPROVED' && !record.approver && !record.approvalYear) flags.approvedWithoutApproverOrYear.push(record.id);
  if (record.status === 'APPROVED' && /chưa rõ|xem lại|cần rà soát|chưa xác minh/i.test(record.ftuCourseNameRaw || '')) flags.approvedWithReviewMarker.push(record.id);
}
const missing = [...sourceRows.keys()].filter(row => !countByRow.has(row));
const rowsWithoutSource = [...countByRow.keys()].filter(row => !sourceRows.has(row));
console.log(JSON.stringify({
  source: path.relative(root, workbookPath), sheet: 'Tổng', nonEmptySourceRows: sourceRows.size,
  normalizedRows: records.length, rowsMissingFromNormalizedData: missing.length,
  rowsMissingFromNormalizedDataSample: missing.slice(0, 30), normalizedRowsWithoutSource: rowsWithoutSource,
  sourceRowsWithMultipleNormalizedRecords: [...countByRow.values()].filter(count => count > 1).length,
  omittedSourceRowsByReason: omitted, unlinkedPartnerNames: unlinked,
  sourceStatusDifferences: { count: sourceStatusDifferences.length, sample: sourceStatusDifferences.slice(0, 30) },
  approvedStatusReviewFlags: Object.fromEntries(Object.entries(flags).map(([key, values]) => [key, { count: values.length, sampleIds: values.slice(0, 30) }])),
  blankCurriculumRows: records.filter(record => !String(record.curriculum || '').trim()).length
}, null, 2));
