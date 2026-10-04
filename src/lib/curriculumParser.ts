import { StudentCourse } from '../types/curriculum';

function readFlag(value: unknown, row: number): boolean {
  const text = String(value ?? '').trim().toLowerCase();
  if (['', '0', 'false', 'không', 'no'].includes(text)) return false;
  if (['x', '1', 'true', 'có', 'yes', '✓', '✔'].includes(text)) return true;
  throw new Error(`Trạng thái học phần không hợp lệ tại dòng ${row}: ${text}.`);
}

export function parseCurriculumRows(rawData: unknown[][]): StudentCourse[] {
let headerRowIndex = -1;
let colCode = -1;
let colName = -1;
let colCredits = -1;
let colMandatory = -1;
let colTaken = -1;
let colPassed = -1;
let colGroup = -1;
let colBranch = -1;
let colMinCr = -1;
let colMaxCr = -1;

for (let r = 0; r < Math.min(rawData.length, 30); r++) {
  const row = rawData[r];
  if (!row) continue;
  colCode = colName = colCredits = colMandatory = colTaken = colPassed = colGroup = colBranch = colMinCr = colMaxCr = -1;
  row.forEach((cell: any, c: number) => {
    const str = String(cell ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
    if (str === 'mã mh' || str === 'mã học phần' || str.includes('mã môn')) colCode = c;
    if (str === 'tên môn học' || str === 'tên học phần') colName = c;
    if (str === 'số tín chỉ' || str === 'số tc') colCredits = c;
    if (str.includes('bắt buộc')) colMandatory = c;
    if (str === 'đã học' || str === 'đang học') colTaken = c;
    if (str.includes('đã học và đạt') || str.includes('đã đạt')) colPassed = c;
    if (str === 'nhóm') colGroup = c;
    if (str === 'nhánh') colBranch = c;
    if (str.includes('tối thiểu')) colMinCr = c;
    if (str.includes('tối đa')) colMaxCr = c;
  });

  if (colCode !== -1) {
    headerRowIndex = r;
    break;
  }
}

if (headerRowIndex === -1 || colCode === -1) {
  throw new Error('Không tìm thấy cột "Mã MH" hoặc "Tên môn học". Vui lòng kiểm tra lại cấu trúc file CTĐT.');
}

const parsedCourses: StudentCourse[] = [];
let currentSemester = '';

for (let r = headerRowIndex + 1; r < rawData.length; r++) {
  const row = rawData[r];
  if (!row || !row.length) continue;

  const firstCell = String(row[0] || '').trim();
  const codeVal = colCode !== -1 && row[colCode] ? String(row[colCode]).normalize('NFKC').replace(/\s+/g, '').trim() : '';

  if (firstCell.toLowerCase().includes('học kỳ') || firstCell.toLowerCase().includes('năm học')) {
    currentSemester = firstCell;
    continue;
  }
  if (firstCell.toLowerCase().includes('tổng') || !codeVal) {
    continue;
  }

  if (colName === -1 || !row[colName] || !String(row[colName]).trim()) {
    throw new Error(`Thiếu tên học phần tại dòng ${r + 1}. Không được tự suy đoán dữ liệu môn học.`);
  }
  if (colCredits === -1 || row[colCredits] === undefined || row[colCredits] === null || row[colCredits] === '') {
    throw new Error(`Thiếu số tín chỉ tại dòng ${r + 1}. Không được tự gán số tín chỉ mặc định.`);
  }
  const nameVal = String(row[colName]).trim();
  const crVal = Number(String(row[colCredits]).trim().replace(',', '.'));
  if (!Number.isFinite(crVal) || crVal <= 0) {
    throw new Error(`Số tín chỉ không hợp lệ tại dòng ${r + 1}.`);
  }
  const isMand = colMandatory !== -1 && row[colMandatory] ? readFlag(row[colMandatory], r + 1) : false;
  const isTak = colTaken !== -1 && row[colTaken] ? readFlag(row[colTaken], r + 1) : false;
  const isPass = colPassed !== -1 && row[colPassed] ? readFlag(row[colPassed], r + 1) : false;

  const grpVal = colGroup !== -1 && row[colGroup] ? String(row[colGroup]).trim() : undefined;
  const brVal = colBranch !== -1 && row[colBranch] ? String(row[colBranch]).trim() : undefined;
  const minCr = colMinCr !== -1 && row[colMinCr] ? parseFloat(String(row[colMinCr])) || 0 : 0;
  const maxCr = colMaxCr !== -1 && row[colMaxCr] ? parseFloat(String(row[colMaxCr])) || 0 : 0;

  parsedCourses.push({
    courseCode: codeVal.toUpperCase(),
    courseName: nameVal,
    credits: crVal,
    isMandatory: isMand,
    isTaken: isTak || isPass,
    isPassed: isPass,
    status: isPass ? 'PASSED' : isTak ? 'IN_PROGRESS' : 'NOT_TAKEN',
    electiveGroup: grpVal,
    electiveBranch: brVal,
    minCredits: minCr,
    maxCredits: maxCr,
    suggestedSemester: currentSemester
    ,dataStatus: 'VERIFIED'
  });
}

if (parsedCourses.length === 0) {
  throw new Error('File không chứa danh sách môn học hợp lệ.');
}

const duplicateCodes = parsedCourses
  .map(course => course.courseCode)
  .filter((code, index, allCodes) => allCodes.indexOf(code) !== index);
if (duplicateCodes.length > 0) {
  const uniqueDuplicateCodes = Array.from(new Set(duplicateCodes));
  throw new Error(`Trùng mã học phần: ${uniqueDuplicateCodes.join(', ')}. Vui lòng kiểm tra lại file trước khi import.`);
}

return parsedCourses;
}
