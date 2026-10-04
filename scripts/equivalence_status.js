const NEGATIVE_MARKERS = [
  'khong co mon hoc',
  'khong co hoc phan',
  'khong tuong duong',
  'khong uong duong',
  'tu choi',
  'ko tuong duong'
];

const PENDING_MARKERS = ['dang xet', 'cho xet', 'dang xin y kien'];
const UNCERTAIN_MARKERS = ['chua ro', 'xem lai', 'can ra soat', 'chua xac minh'];

function normalizeEquivalenceText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[Đđ]/g, character => character === 'Đ' ? 'D' : 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasMarker(text, markers) {
  return markers.some(marker => text.includes(marker));
}

function inferEquivalenceStatus({ ftuCourseNameRaw, approver, approvalYear }) {
  const normalizedName = normalizeEquivalenceText(ftuCourseNameRaw);
  if (hasMarker(normalizedName, NEGATIVE_MARKERS)) return 'REJECTED';
  if (hasMarker(normalizedName, PENDING_MARKERS)) return 'PENDING';
  if (hasMarker(normalizedName, UNCERTAIN_MARKERS)) return 'UNCERTAIN';
  return approver || approvalYear ? 'APPROVED' : 'UNCERTAIN';
}

function isExplicitlyRejectedEquivalenceName(value) {
  return hasMarker(normalizeEquivalenceText(value), NEGATIVE_MARKERS);
}

module.exports = {
  NEGATIVE_MARKERS,
  normalizeEquivalenceText,
  inferEquivalenceStatus,
  isExplicitlyRejectedEquivalenceName
};
