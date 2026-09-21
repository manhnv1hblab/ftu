# 🌏 FTU GoGlobal — Nền Tảng Tư Vấn & Lập Kế Hoạch Trao Đổi Sinh Viên Quốc Tế

> **Công cụ tư vấn và lập bản nháp kế hoạch trao đổi kỳ S27 — dữ liệu nghiệp vụ được chuẩn hóa từ tài liệu trong thư mục `document/`.**

---

## 🌟 Giới Thiệu

**FTU GoGlobal** là ứng dụng web toàn diện giúp sinh viên Đại học Ngoại thương lập kế hoạch trao đổi học tập quốc tế song phương thông minh, chính xác và tối ưu:
- **Rà soát điều kiện học vụ:** Kiểm tra tự động điểm GPA (thang 4 / thang 10), chuẩn đầu ra tiếng Anh, tín chỉ tích lũy, các môn điều kiện (Triết học, Thể chất, GDQP...).
- **Khám phá danh sách đối tác S27:** Số lượng và thuộc tính hiển thị được lấy từ danh sách đối tác trong `document/`; dữ liệu thiếu được đánh dấu cần xác minh.
- **Ghép cặp môn học 1-1:** Tự động đối ứng các môn học FTU với các môn đối tác theo quy tắc học vụ của Nhà trường (tối thiểu 3 môn FTU / 5 môn đối tác, bảo toàn tiến độ tốt nghiệp).
- **So sánh đa chiều:** Đặt lên bàn cân 3 nguyện vọng theo học phí, chi phí sinh hoạt, tỷ lệ chuyển đổi tín chỉ và tiến độ ra trường.
- **Xuất kế hoạch & In ấn:** Xuất bản dự thảo kế hoạch để người dùng kiểm tra và gửi phê duyệt chính thức.

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend Core:** Next.js 14 (App Router) + TypeScript + React 18
- **Styling:** Tailwind CSS + Vanilla CSS Micro-animations + HCL Visual Tokens
- **Thiết kế & Đồ họa:** Bộ biểu tượng 3D & Linh vật FTUer Claymorphism / Pixar độc quyền
- **Xử lý Dữ liệu:** Pure Client-side + LocalStorage Persistence; đây không phải hệ thống lưu trữ hồ sơ chính thức.
- **AI tư vấn:** Groq Chat Completions qua server route `/api/chat`; API key chỉ nằm ở server, câu trả lời được grounding từ dữ liệu S27 đã audit.

---

## 🛠️ Cài Đặt & Chạy Cục Bộ

### 1. Yêu Cầu Môi Trường
- Node.js >= 18.17.0
- npm hoặc yarn

### 2. Cài Đặt Thư Viện
```bash
npm install
```

### 3. Chạy Development Server
```bash
npm run dev
```
Truy cập trình duyệt tại: [http://localhost:3000](http://localhost:3000)

### 4. Build Bản Production
```bash
npm run build
npm run start
```

### 5. Cấu hình chatbot Groq (tùy chọn)

Sao chép `.env.example` thành `.env.local`, sau đó thêm key ở server:

```env
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
```

Không dùng `NEXT_PUBLIC_GROQ_API_KEY` và không commit `.env.local`. Chatbot chỉ được cung cấp các bản ghi phù hợp từ `data/`, quy tắc S27 và nguồn trong `document/`; dữ liệu `PENDING`, `UNCERTAIN`, `REJECTED` hoặc thiếu nguồn phải được trả lời là cần xác minh.

### 6. Ảnh nhận diện trường đối tác

Mỗi trường trong `data/universities_s27.json` có `imageUrl`, `logoUrl`, `imageSourceUrl`, `imageSourceType` và `imageVerifiedAt`. Hệ thống ưu tiên ảnh khuôn viên/cơ sở vật chất có trang nguồn khớp với trường (`official-campus-image` hoặc `internet-campus-image`); nếu không tìm được nguồn đủ chắc chắn thì dùng ảnh nhận diện từ domain chính thức (`official-domain-favicon`) và ghi rõ loại ảnh. Không dùng ảnh stock theo quốc gia để giả làm ảnh của trường.

```bash
node scripts/enrich_university_images.js
```

Chạy `node scripts/enrich_university_campus_images.js` để tìm bổ sung ảnh campus từ internet, sau đó rà soát các bản ghi trước khi áp dụng. Ảnh là dữ liệu trình bày, không phải bằng chứng cho điều kiện S27. Các thông tin tuyển chọn, equivalence, chi phí và kết luận học vụ vẫn chỉ lấy từ nguồn trong `document/` và bộ dữ liệu đã audit.

---

## 📁 Cấu Trúc Dự Án

```
├── data/                         # Dữ liệu chuẩn hóa kỳ S27
│   ├── universities_s27.json     # Dữ liệu chuẩn hóa từ danh sách đối tác trong document/
│   ├── equivalences_s27.json     # Bảng tương đương môn học
│   ├── sample_curricula.json     # Khung chương trình đào tạo mẫu
│   └── country_costs.json        # Thống kê chi phí sinh hoạt các quốc gia
├── public/                       # Tài nguyên tĩnh
│   ├── images/                   # Bộ biểu tượng 3D & Linh vật FTU
│   └── favicon.ico
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── compare/              # Trang so sánh nguyện vọng
│   │   ├── handbook/             # Cẩm nang du học 4 giai đoạn
│   │   ├── partners/             # Danh mục và chi tiết trường từ dữ liệu đã audit
│   │   ├── planner/              # Bộ lập kế hoạch 5 bước
│   │   ├── print/                # Trang xuất in ấn PDF kế hoạch
│   │   └── reviews/              # Cộng đồng đánh giá & kinh nghiệm
│   ├── components/               # Các UI components tái sử dụng
│   └── types/                    # Định nghĩa TypeScript
├── scripts/                      # Scripts kiểm thử và xử lý dữ liệu
└── document/                     # Tài liệu văn bản gốc FTU S27
```

---

## 📋 Kiểm Thử Logic Học Vụ

Hệ thống tích hợp bộ kiểm thử tự động 17 quy tắc học vụ của FTU:
```bash
node scripts/test_engine_rules.js
```
Kết quả kiểm tra: **17/17 PASS**.

---

## 📜 Giấy Phép & Bản Quyền

Bản quyền thuộc về Trường Đại học Ngoại thương (FTU) & Dự án FTU GoGlobal.
Mọi thắc mắc và đóng góp vui lòng mở Issue hoặc Pull Request trên GitHub repository.
