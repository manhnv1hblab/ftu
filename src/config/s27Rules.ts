import { DataSourceRef } from '../types/provenance';

export const S27_RULE_SOURCE: DataSourceRef = {
  file: 'Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx',
  status: 'VERIFIED',
  note: 'Các điều kiện tham gia chương trình được trích từ mục I của tài liệu quy trình S27.'
};

export const S27_RULES = {
  gpa4Minimum: 2.8,
  gpa10Minimum: 7.5,
  completedSemestersMinimum: 2,
  accumulatedCreditsMinimum: 35,
  remainingCoursesMinimum: 4,
  hostCoursesMinimum: 5,
  transferredCoursesMinimum: 3,
  englishMinimumLevel: 'B2',
  source: S27_RULE_SOURCE,
  dataVersion: 'S27-2026-2027'
} as const;

