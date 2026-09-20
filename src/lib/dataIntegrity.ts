import { DataSourceRef, DataVerificationStatus } from '../types/provenance';

export function normalizeCode(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, '').toUpperCase();
}

export function normalizeName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN');
}

export function sourceStatus(source?: DataSourceRef): DataVerificationStatus {
  if (source?.status) return source.status;
  const canonicalDocuments = new Set([
    'Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx',
    '[CTTĐ_S27] Danh sách trường đối tác trao đổi.xlsx',
    'Danh sách học phần tương đương (với các trường đối tác).xlsx',
    'Bảng chi phí ước tình khi tham gia kỳ trao đổi.xlsx',
    'Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx',
    'ChuongTrinhDaoTao.xlsx'
  ]);
  return source?.file && canonicalDocuments.has(source.file) ? 'VERIFIED' : 'NEEDS_VERIFICATION';
}

export function hasVerifiedSource(source?: DataSourceRef): boolean {
  return sourceStatus(source) === 'VERIFIED';
}

export function sourceLabel(source?: DataSourceRef): string {
  if (!source) return 'Chưa có nguồn dữ liệu';
  const location = [source.sheet, source.row && `dòng ${source.row}`, source.column && `cột ${source.column}`]
    .filter(Boolean)
    .join(', ');
  return `${source.file}${location ? ` (${location})` : ''}`;
}
