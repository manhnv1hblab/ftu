import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-surface-container mt-16 text-on-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-base">
                G
              </div>
              <span className="font-display font-bold text-lg text-primary tracking-tight">FTU GoGlobal</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Cổng tra cứu môn tương đương, tìm kiếm trường đối tác và mô phỏng lộ trình học vụ trao đổi quốc tế kỳ S27 (Học kỳ II năm học 2026 - 2027) dành cho sinh viên Trường Đại học Ngoại thương.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-xs text-on-surface-variant font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Dữ liệu xác thực S27 (2026 - 2027)</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Luồng học vụ</h3>
            <ul className="space-y-2 text-xs font-medium text-on-surface-variant">
              <li>
                <Link href="/planner" className="hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  Bước 1: Tải lên CTĐT / Nhập mã môn
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  Danh mục 116 trường đối tác S27
                </Link>
              </li>
              <li>
                <Link href="/handbook" className="hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  Cẩm nang quy trình 11 bước S27
                </Link>
              </li>
              <li>
                <Link href="/print" className="hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  Bản in kế hoạch trao đổi A4
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Official FTU Contacts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Liên hệ chính thức</h3>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li className="font-semibold text-on-surface">Phòng Hợp tác Quốc tế (P.HTQT)</li>
              <li className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary flex-shrink-0 mt-0.5">location_on</span>
                <span>Phòng A903 - Tầng 9 - Nhà A, Trụ sở Hà Nội</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary flex-shrink-0">call</span>
                <span>Hotline: (+84) 24 325 95161 (ext. 6200)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary flex-shrink-0">mail</span>
                <a href="mailto:outbound@ftu.edu.vn" className="hover:text-primary underline">
                  outbound@ftu.edu.vn
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary flex-shrink-0">public</span>
                <a href="https://htqt.ftu.edu.vn" target="_blank" rel="noreferrer" className="hover:text-primary underline">
                  htqt.ftu.edu.vn
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Cơ sở II & Quảng Ninh */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Các cơ sở</h3>
            <div className="space-y-3 text-xs text-on-surface-variant">
              <div className="bg-surface-container-low p-2.5 rounded-xl">
                <p className="font-semibold text-on-surface">Cơ sở II - TP. Hồ Chí Minh</p>
                <p className="text-[11px]">Ban QLKH & HTQT: 028 35127254 (ext 881 - cô Loan)</p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl">
                <p className="font-semibold text-on-surface">Cơ sở Quảng Ninh</p>
                <p className="text-[11px]">P.HTQT & Ban Đào tạo: 091 580 9103 (cô Hoa)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="border-t border-surface-container mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-on-surface-variant">
          <p>
            © {new Date().getFullYear()} FTU GoGlobal. Bản quyền thuộc cộng đồng sinh viên Trường Đại học Ngoại thương.
          </p>
          <p className="text-center sm:text-right max-w-xl">
            Lưu ý: Kết quả đề xuất và mô phỏng dựa trên dữ liệu công khai S27. Sinh viên cần hoàn thiện Thỏa thuận học tập (Learning Agreement) và xin phê duyệt chính thức từ Phòng HTQT & Bộ môn trước khi bay.
          </p>
        </div>
      </div>
    </footer>
  );
};
