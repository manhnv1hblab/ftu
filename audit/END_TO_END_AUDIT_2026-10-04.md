# FTU GoGlobal — Audit end-to-end

Ngày audit: 04/10/2026  
Phạm vi: mã nguồn và production build local trong workspace  
Đầu ra: báo cáo phát hiện và kế hoạch sửa; audit không thay đổi logic sản phẩm.

## Kết quả kiểm tra

| Nhóm | Kết quả |
|---|---|
| Lint hợp đồng dữ liệu | PASS |
| TypeScript | PASS |
| Engine rule | PASS — 17/17 kiểm tra |
| Course matcher | PASS — matcher chính và regression enrolled-course |
| Data validation | PASS contract, có cảnh báo chất lượng dữ liệu bên dưới |
| E2E data smoke | PASS |
| Planner flow contract | PASS — 10/10 kiểm tra |
| Browser flow | PASS — 7/7 test hiện có, gồm desktop/mobile, hồ sơ cũ và lưu phương án |
| Production build | PASS — các route Next.js được prerender/build thành công |

Các test browser hiện có tập trung vào planner. Chưa có coverage tự động tương đương cho danh sách trường, chi tiết trường, cẩm nang, reviews, compare trực tiếp, print trực tiếp, Firefox/WebKit, chạy mạng chậm hoặc URL đã triển khai.

## Phát hiện theo mức độ

### P1 — cần xử lý trước khi dùng dữ liệu để kết luận quy đổi

1. **412 dòng equivalence chưa có `partnerS27Id`.** `data/validation_report.json` ghi nhận các dòng này chỉ có tên trường. Một số màn hình ghép theo ID, một số nơi fallback theo tên; vì vậy cùng một trường có thể có số môn/khả năng ghép khác nhau giữa danh sách trường, trang chi tiết và planner. Cần gắn ID chuẩn hoặc đánh dấu rõ dòng chưa liên kết và loại khỏi kết luận tự động.

2. **Luồng chuyển trường từ trang đối tác đặt planner ở bước 4.** `src/app/partners/page.tsx` và `src/app/partners/[id]/page.tsx` gọi `setCurrentStep(4)` rồi chuyển `/planner`. Nếu hồ sơ chưa đủ, guard mới có thể đưa người dùng về bước 2/3; trải nghiệm sẽ giống như nút không làm đúng điều đã chọn. Cần hiển thị trạng thái trường đã chọn và lý do bước bị khóa, hoặc chuyển đến bước hồ sơ trước rồi quay lại trường đó.

### P2 — ảnh hưởng tính nhất quán và khả năng sử dụng

3. **Năm trường không có dữ liệu chi phí.** Báo cáo dữ liệu gồm University of the Bahamas, Lingnan University, Karpagam Academy of Higher Education, S. P. Jain Institute of Management Research và Sopot University of Applied Sciences. UI đã có fallback “Chưa có thông tin”, nhưng cần kiểm thử trực tiếp ở card, detail, bước 4, bước 5 và bản in để không hiển thị `0`, `NaN` hoặc dòng trống.

4. **Chi phí Thụy Sĩ có hai biến thể tên và mức khác nhau.** Validator đã gắn `requiresVerification`, nhưng cần thống nhất alias quốc gia và hiển thị cảnh báo cùng nguồn ở mọi nơi dùng chi phí.

5. **Banner S27 còn nằm trong Navbar toàn website.** Trang chủ đã bỏ banner thông báo riêng, nhưng `src/components/layout/Navbar.tsx` vẫn hiển thị “Cổng thông tin trao đổi S27...”. Nếu yêu cầu bỏ dòng S27 là toàn website, nội dung này chưa đạt; nếu chỉ bỏ banner trang chủ, cần ghi rõ phạm vi để tránh hai thông báo cạnh nhau.

6. **Trang chi tiết trường có return trước các hook `useMemo`.** `src/app/partners/[id]/page.tsx` trả về màn hình “Không tìm thấy trường” trước khi gọi các hook phía dưới. Đây là vi phạm Rules of Hooks nếu component chuyển giữa ID hợp lệ và không hợp lệ trong cùng lifecycle; nên tách `UniversityNotFound` hoặc tính dữ liệu sau khi kiểm tra mà không thay đổi thứ tự hook.

7. **Chưa có cơ chế audit lỗi ảnh ngoài mạng.** Nhiều ảnh campus/fallback là URL bên ngoài. Build không kiểm tra ảnh trả 404, timeout hoặc bị chặn; cần fallback runtime và một kiểm tra HEAD/GET định kỳ cho metadata ảnh.

8. **Nút lưu chung và trạng thái editor môn cần kiểm tra lại khi rời trang.** Browser test hiện có xác nhận lưu phương án trong các đường đi chính, nhưng chưa bao phủ nút “Lưu nháp” ở Navbar khi đang có thay đổi môn chưa lưu, Back/Forward, reload ngay trong editor, hoặc hai tab cùng sửa. Đây là vùng có nguy cơ mất thao tác.

### P3 — chất lượng nội dung, SEO và bảo trì

9. **Một số nội dung mô tả chi phí có thể hiểu là dữ liệu chính thức.** Trang detail ghi “Bảng so sánh chi phí ... chính thức” trong khi dữ liệu nguồn là ước tính; cần thống nhất nhãn “tham khảo/ước tính” và nguồn.

10. **Sitemap dùng ngày cố định `2026-09-21`.** `src/app/sitemap.ts` cần lấy ngày dữ liệu/build hoặc ngày cập nhật thực tế; các trang partner động hiện không có entry riêng.

11. **Metadata canonical chỉ khai báo ở root layout.** Trang partner detail, planner, compare và print dùng cùng canonical `/`; cần quyết định trang nào indexable và tạo metadata theo route.

12. **Coverage accessibility chưa đủ.** Các thông báo có `role=status` và form đã có `aria-invalid`, nhưng chưa có audit tự động cho focus trap dialog, focus sau lỗi, bảng ngang trên mobile, thứ tự heading, tương phản và thao tác chỉ bằng bàn phím.

## Ma trận hành trình

| Hành trình | Kết quả hiện tại | Bằng chứng / giới hạn |
|---|---|---|
| Upload Excel → rà soát môn | PASS | Browser test hiện có |
| Nhập mã môn → lưu phương án → reload | PASS | Browser test hiện có |
| Hồ sơ thiếu → chặn bước 3–5 | PASS | Browser test profile-validation |
| Chưa có chứng chỉ → vẫn khám phá trường | PASS | Browser test profile-validation |
| Đổi khóa/ngành làm mất chương trình cũ | PASS | Browser test profile-validation |
| Mobile profile + detail trường + so sánh | PASS | Browser test mobile, ảnh trong `test-results` |
| Trang danh sách → detail → planner | Chưa audit tự động | Cần test route liên trang |
| Compare/print mở trực tiếp, không có draft | Chưa audit tự động | Cần test trạng thái rỗng |
| Handbook trước/sau và anchor | Chưa audit tự động | Cần test keyboard + mobile |
| Firefox/WebKit | Chưa chạy | Playwright config hiện chỉ dùng Desktop Chrome |
| Website đã deploy | Ngoài phạm vi | Chưa có URL triển khai |

## Kế hoạch sửa sau audit

### P0/P1 — dữ liệu và luồng chính

- Tạo bước chuẩn hóa equivalence: map toàn bộ 412 dòng theo ID trường; dòng không xác định giữ trạng thái `NEEDS_VERIFICATION` và không dùng để đếm “đã duyệt”. Thêm test kiểm tra mọi màn hình dùng cùng một hàm liên kết.
- Sửa điều hướng từ `/partners` và `/partners/[id]`: lưu trường đã chọn, chuyển đến bước phù hợp với trạng thái hồ sơ, hiển thị lý do nếu cần hoàn thiện hồ sơ trước.
- Bổ sung test browser route-to-route, test URL trường không tồn tại và test trạng thái không có draft cho compare/print.

### P2 — dữ liệu thiếu và độ bền giao diện

- Chuẩn hóa alias chi phí, bổ sung coverage cho 5 trường không có chi phí và hiển thị nguồn/cờ xác minh thống nhất.
- Quyết định phạm vi bỏ banner S27; sau đó kiểm tra toàn bộ layout và trang partners để không còn nội dung mâu thuẫn.
- Tách component not-found khỏi detail page để bảo đảm thứ tự hook; thêm test điều hướng valid → invalid → valid.
- Thêm fallback ảnh và script kiểm tra link ảnh; ghi lỗi nhưng không làm hỏng card.
- Bổ sung autosave editor, cảnh báo rời trang và test Back/Forward, reload, Navbar save, hai tab.

### P3 — nội dung, SEO, accessibility và hiệu năng

- Chuẩn hóa từ “ước tính/tham khảo”, nguồn và trạng thái xác minh ở card, detail, planner, compare và print.
- Cập nhật sitemap/canonical/metadata theo route và quyết định index/noindex cho planner, compare, print.
- Thêm kiểm tra keyboard/accessibility và ảnh chụp ở 360/390/768/1440 px; sửa tràn bảng, focus và dialog nếu phát hiện.
- Bổ sung đo production build: LCP/CLS/JS tải đầu, thời gian render danh sách 116 trường, thời gian parse Excel và lọc equivalence.

## Điều kiện nghiệm thu đợt sửa

- Mọi equivalence dùng chung một quy tắc liên kết trường; không còn dòng không thể giải thích trong kết luận tự động.
- Mọi đường từ danh sách/chi tiết trường đến planner đưa người dùng đến đúng bước và giữ trường đã chọn.
- Compare/print trực tiếp, reload, Back/Forward, mobile và dữ liệu thiếu đều có trạng thái rõ ràng, không mất draft.
- `npm run verify`, browser matrix Chromium/Firefox/WebKit và kiểm tra accessibility đều đạt; báo cáo ghi rõ các kiểm tra ngoài phạm vi.
