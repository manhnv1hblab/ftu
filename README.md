# 🌏 FTU GoGlobal — Nền Tảng Tư Vấn & Lập Kế Hoạch Trao Đổi Sinh Viên Quốc Tế

> **Hệ thống tư vấn học vụ trao đổi sinh viên chính thức cho kỳ S27 (Học kỳ II Năm học 2026–2027) — Trường Đại học Ngoại thương (FTU).**

---

## 🌟 Giới Thiệu

**FTU GoGlobal** là ứng dụng web toàn diện giúp sinh viên Đại học Ngoại thương lập kế hoạch trao đổi học tập quốc tế song phương thông minh, chính xác và tối ưu:
- **Rà soát điều kiện học vụ:** Kiểm tra tự động điểm GPA (thang 4 / thang 10), chuẩn đầu ra tiếng Anh, tín chỉ tích lũy, các môn điều kiện (Triết học, Thể chất, GDQP...).
- **Khám phá 116 đối tác toàn cầu:** Dữ liệu chuẩn hóa chi tiết 116 trường đại học đối tác tại Châu Âu, Châu Á, Châu Mỹ và Châu Đại Dương với đầy đủ kiểm định quốc tế (AACSB, EQUIS, AMBA), chi phí sinh hoạt bóc tách, khí hậu, visa, cơ sở vật chất và môn tương đương.
- **Ghép cặp môn học 1-1:** Tự động đối ứng các môn học FTU với các môn đối tác theo quy tắc học vụ của Nhà trường (tối thiểu 3 môn FTU / 5 môn đối tác, bảo toàn tiến độ tốt nghiệp).
- **So sánh đa chiều:** Đặt lên bàn cân 3 nguyện vọng theo học phí, chi phí sinh hoạt, tỷ lệ chuyển đổi tín chỉ và tiến độ ra trường.
- **Xuất kế hoạch & In ấn:** Xuất bản kế hoạch học tập PDF chuẩn form phòng Quản lý đào tạo FTU.

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend Core:** Next.js 14 (App Router) + TypeScript + React 18
- **Styling:** Tailwind CSS + Vanilla CSS Micro-animations + HCL Visual Tokens
- **Thiết kế & Đồ họa:** Bộ biểu tượng 3D & Linh vật FTUer Claymorphism / Pixar độc quyền
- **Xử lý Dữ liệu:** Pure Client-side + LocalStorage Persistence (bảo mật tuyệt đối thông tin sinh viên)

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

---

## 📁 Cấu Trúc Dự Án

```
├── data/                         # Dữ liệu chuẩn hóa kỳ S27
│   ├── universities_s27.json     # 116 trường đại học đối tác với đầy đủ dữ liệu
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
│   │   ├── partners/             # Danh mục & Chi tiết 116 trường
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
