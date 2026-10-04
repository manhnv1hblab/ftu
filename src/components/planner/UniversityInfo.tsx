import React from 'react';
import { PartnerUniversity } from '../../types/university';
import { CountryCost } from '../../types/cost';
import costs from '../../../data/costs_by_country.json';
import { findCountryCost } from '../../engine/costCalculator';
import { sourceStatus } from '../../lib/dataIntegrity';

export function universityLivingCost(university: PartnerUniversity): string {
  const cost = findCountryCost(university.country, costs as Record<string, CountryCost>);
  const range = cost?.livingCost;
  if (range?.min == null || range.max == null) return 'Chưa có thông tin';
  return `Ước tính ${range.min} – ${range.max} triệu VNĐ/tháng (theo quốc gia)${cost?.requiresVerification ? ' · Cần xác minh' : ''}`;
}

function ExternalLink({ url, children }: { url?: string; children: React.ReactNode }) {
  return url && /^https?:\/\//i.test(url) ? <a href={url} target="_blank" rel="noreferrer" className="text-primary underline break-words">{children}</a> : <span>Chưa có thông tin</span>;
}

export function UniversityMoreInfo({ university }: { university: PartnerUniversity }) {
  const cost = findCountryCost(university.country, costs as Record<string, CountryCost>);
  return <details className="mt-3 text-xs rounded-xl border border-surface-container p-3" key={university.id}>
    <summary className="cursor-pointer font-bold text-primary">Xem thêm thông tin trường</summary>
    <dl className="mt-3 space-y-3 text-on-surface-variant break-words">
      {[
        ['Giới thiệu', university.description], ['Lịch học', university.semesterDates], ['Hạn đăng ký S27', university.applicationDeadlineS27],
        ['Ký túc xá', university.hasDormitory === undefined ? undefined : university.hasDormitory ? 'Có ký túc xá; cần xác minh chỗ ở và chi phí.' : 'Không có ký túc xá theo dữ liệu hiện có.']
      ].map(([label, value]) => <div key={label}><dt className="font-bold text-on-surface">{label}</dt><dd>{value || 'Chưa có thông tin'}</dd></div>)}
      <div><dt className="font-bold">Website</dt><dd><ExternalLink url={university.websiteUrl}>Website chính thức</ExternalLink></dd></div>
      <div><dt className="font-bold">Danh mục môn học</dt><dd><ExternalLink url={university.catalogueUrl}>Xem catalogue</ExternalLink></dd></div>
      <div><dt className="font-bold">Nguồn thông tin tuyển chọn</dt><dd>{university.source.file}{university.source.sheet ? ` · ${university.source.sheet}` : ''}{university.source.row ? ` · dòng ${university.source.row}` : ''} · {sourceStatus(university.source) === 'VERIFIED' ? 'Đã đối chiếu nguồn' : 'Cần xác minh'}</dd></div>
      <div><dt className="font-bold">Nguồn chi phí tham khảo</dt><dd>{cost?.source.file || 'Chưa có thông tin'}{cost?.warningNote ? ` · ${cost.warningNote}` : ''}</dd></div>
    </dl>
    <p className="mt-3 text-amber-800">Lịch học, hạn đăng ký và thông tin sinh hoạt cần được xác nhận lại với trường đối tác. Nguồn danh sách S27 không xác minh toàn bộ thông tin giới thiệu.</p>
  </details>;
}

export function UniversityInfo({ university }: { university: PartnerUniversity }) {
  return <section aria-label="Thông tin trường đã chọn" className="rounded-3xl border border-surface-container bg-white p-5 sm:p-6">
    <h2 className="font-bold text-on-surface mb-4">Thông tin trường đã chọn</h2>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      {[
        ['Địa điểm', [university.city, university.country].filter(Boolean).join(', ')], ['Chỉ tiêu', university.quota],
        ['Ngôn ngữ giảng dạy', university.languages], ['Yêu cầu đầu vào', university.requirements],
        ['Học bổng / hỗ trợ', university.scholarship], ['Chi phí sinh hoạt tham khảo', universityLivingCost(university)]
      ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-bold mb-1">{label}</dt><dd className="text-on-surface-variant whitespace-pre-line break-words">{value || 'Chưa có thông tin'}</dd></div>)}
    </dl>
    <UniversityMoreInfo university={university} />
  </section>;
}
