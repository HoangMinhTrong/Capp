# TÀI LIỆU KIẾN TRÚC & VẬN HÀNH HỆ THỐNG EDUTRACK

> **Hệ thống Quản lý Tiến độ Học tập & Can thiệp Rủi ro Học viên Toàn diện**  
> **Kiến trúc:** Python Backend (FastAPI + SQLite) & TypeScript Frontend (Vite SPA)  
> **Phiên bản:** 2.0 (Cập nhật ngày 05/11/2026)

---

## MỤC LỤC
1. [Tổng quan Kiến trúc & Quy chuẩn Đuôi File (.py / .ts)](#1-tong-quan-kien-truc--quy-chuan-duoi-file)
2. [Danh mục 15 Phân hệ & Chức năng Toàn diện](#2-danh-muc-15-phan-he--chuc-nang-toan-dien)
3. [Ma trận Phân quyền Truy cập (RBAC Matrix)](#3-ma-tran-phan-quyen-truy-cap-rbac-matrix)
4. [Sơ đồ Luồng Vận hành Nghiệp vụ (Workflows & Diagrams)](#4-so-do-luong-van-hanh-nghiep-vu)
   - 4.1. Luồng Tiếp nhận & Xếp lớp Học viên
   - 4.2. Luồng Điểm danh & Cập nhật Chuyên cần
   - 4.3. Luồng Kiểm tra & Nhập điểm Đánh giá
   - 4.4. Luồng Cảnh báo Sa sút & Thực hiện Can thiệp
   - 4.5. Luồng Tiếp nhận, Hỗ trợ & Chuyển cấp Ticket SLA
   - 4.6. Luồng Đồng bộ Dữ liệu Giữa Web Frontend và Python Backend
5. [Hướng dẫn Khởi chạy & Vận hành](#5-huong-dan-khoi-chay--van-hanh)

---

## 1. TỔNG QUAN KIẾN TRÚC & QUY CHUẨN ĐUÔI FILE

Hệ thống được thiết kế theo mô hình **Tách biệt Frontend - Backend (Client-Server Architecture)** chuẩn mực của ngành công nghệ:

- **Frontend (Giao diện người dùng):** Viết bằng **TypeScript (`.ts`)** + CSS3 Design Tokens, đóng gói qua Vite. Trình duyệt web chạy ứng dụng Single-Page Application (SPA) mượt mà, phản hồi tức thời.
- **Backend (Máy chủ xử lý & CSDL):** Viết bằng **Python (`.py`)** sử dụng framework **FastAPI**, kết nối cơ sở dữ liệu **SQLite** (`edutrack.db`) với 17 bảng dữ liệu chuẩn hóa và tự động sinh tài liệu Swagger UI.

### Bảng đối chiếu định dạng file trong dự án:

| Khu vực | Ngôn ngữ | Đuôi file | Chức năng nhiệm vụ |
| :--- | :--- | :--- | :--- |
| **`backend/main.py`** | **Python** | `.py` | Máy chủ REST API, định tuyến, xử lý nghiệp vụ, ghi nhận audit log |
| **`backend/database.py`** | **Python** | `.py` | Khởi tạo cấu trúc 17 bảng dữ liệu SQLite, hàm thực thi truy vấn SQL |
| **`backend/models.py`** | **Python** | `.py` | Pydantic Schemas xác thực dữ liệu request/response |
| **`backend/seed.py`** | **Python** | `.py` | Kịch bản nạp dữ liệu mẫu ban đầu cho toàn hệ thống |
| **`src/pages/*.ts`** | **TypeScript** | `.ts` | Mã nguồn giao diện 15 trang web chạy trực tiếp trên trình duyệt |
| **`src/api.ts`** | **TypeScript** | `.ts` | Cầu nối gọi API sang máy chủ Python cổng 8000 |
| **`src/state.ts`** | **TypeScript** | `.ts` | Quản lý trạng thái phiên làm việc và phân quyền Client-side |
| **`start_project.bat`** | **Batch Script** | `.bat` | File 1-click tự động chạy cả Python server và Web frontend |

---

## 2. DANH MỤC 15 PHÂN HỆ & CHỨC NĂNG TOÀN DIỆN

1. **Đăng nhập 1-chạm đa vai trò (`#/login`):** Chuyển đổi linh hoạt giữa 5 vai trò (*Admin, Trưởng học vụ, Giảng viên, Trợ giảng, Học viên*).
2. **Dashboard Tổng quan (`#/dashboard`):** 4 thẻ KPI thời gian thực, danh sách học viên rủi ro, lớp đang dạy, ticket mới nhận.
3. **Cổng Học viên Cá nhân (`#/student-dashboard`):** Dành riêng cho học sinh theo dõi chuyên cần, điểm kiểm tra, quiz và gửi trợ giúp.
4. **Quản lý Học viên (`#/students`):** Danh sách học viên, lọc theo cơ sở, tìm kiếm, Modal thêm học viên (sinh mã `HV2024xxx`, xếp lớp).
5. **Hồ sơ Học viên 360° (`#/students/:id`):** 5 tab chi tiết: Tiến độ & Cảnh báo, Lịch sử điểm danh, Điểm kiểm tra, Quiz, Ticket hỗ trợ.
6. **Quản lý Lớp học (`#/classes`):** Thẻ lớp học, thanh tiến độ buổi học (32/48), thanh lấp đầy sĩ số, Modal thêm lớp học mới.
7. **Chi tiết Lớp học (`#/classes/:id`):** 4 tab: Danh sách học viên kèm điểm TB, Điểm danh theo buổi kèm biểu đồ Donut, Bài kiểm tra, Tiến độ.
8. **Điểm danh Trực tiếp (`#/attendance`):** Lọc theo lớp & buổi học, 4 nút trạng thái (*Có mặt, Đi muộn, Vắng, Có phép*), **Điểm danh tất cả có mặt** và **Xuất CSV**.
9. **Kiểm tra & Chấm điểm (`#/assessments`):** Tạo bài thi (Giữa kỳ, Cuối kỳ, Test), Modal **Nhập điểm trực tiếp** và tự động tính lại điểm TB của lớp.
10. **Quiz Trắc nghiệm (`#/quizzes`):** Thống kê hoàn thành quiz, điểm TB, Modal tạo đề Quiz mới kèm deadline.
11. **Tiến độ & Can thiệp Học viên (`#/progress`):** Phân loại rủi ro 3 cấp (*Ưu tiên can thiệp, Cần theo dõi, Bình thường*), Modal ghi nhận biên bản can thiệp.
12. **Ma trận Cảnh báo Rủi ro Sớm (`#/risk-matrix`):** Bộ 6 quy tắc phát hiện sa sút tự động kèm công tắc Bật/Tắt (Toggle) cho từng quy tắc.
13. **Vé Hỗ trợ Học viên & Chuẩn SLA (`#/support`):** Đếm giờ hạn chót phản hồi (4h) & xử lý (12h), luồng chat thời gian thực, ghi chú nội bộ, nút Chuyển cấp và Đã xử lý.
14. **Nhập dữ liệu Hàng loạt (`#/import`):** Tải file mẫu CSV, vùng kéo thả file / dán trực tiếp, bảng kiểm tra hợp lệ trước khi nạp vào CSDL.
15. **Nhật ký Hệ thống & Báo cáo Thống kê (`#/audit-log` & `#/reports`):** Truy vết toàn bộ thay đổi dữ liệu (Audit Trail), biểu đồ Donut/Bar chart, tính năng In/Lưu PDF và Xuất CSV.

---

## 3. MA TRẬN PHÂN QUYỀN TRUY CẬP (RBAC MATRIX)

| Phân hệ / Chức năng | 👑 Quản trị viên (Admin) | 📋 Quản lý Học vụ (Academic Manager) | 👨‍🏫 Giảng viên (Teacher) | 🧑‍💼 Trợ giảng (TA) | 🎓 Học viên (Student) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard Tổng quan** | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Lớp phụ trách | ✅ Lớp phụ trách | ❌ Không |
| **Cổng Học viên Cá nhân** | ❌ | ❌ | ❌ | ❌ | ✅ Toàn quyền |
| **Xem Danh sách Học viên** | ✅ Tất cả | ✅ Tất cả | ✅ Lớp phụ trách | ✅ Lớp phụ trách | ❌ Không |
| **Thêm / Sửa Học viên** | ✅ Có | ✅ Có | ❌ Không | ❌ Không | ❌ Không |
| **Import Học viên (CSV)** | ✅ Có | ✅ Có | ❌ Không | ❌ Không | ❌ Không |
| **Tạo Lớp học / Xếp lịch** | ✅ Có | ✅ Có | ❌ Không | ❌ Không | ❌ Không |
| **Điểm danh Học viên** | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
| **Tạo Bài thi / Nhập điểm** | ✅ Có | ✅ Có | ✅ Có | ❌ Chỉ xem | ❌ Không |
| **Tạo Đề Quiz** | ✅ Có | ✅ Có | ✅ Có | ❌ Chỉ xem | ❌ Không |
| **Làm bài Quiz** | ❌ Không | ❌ Không | ❌ Không | ❌ Không | ✅ Có |
| **Xem Ma trận Rủi ro** | ✅ Tất cả | ✅ Tất cả | ✅ Lớp phụ trách | ❌ Không | ❌ Không |
| **Bật/Tắt Quy tắc Cảnh báo** | ✅ Có | ✅ Có | ❌ Không | ❌ Không | ❌ Không |
| **Ghi nhận Can thiệp Rủi ro** | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
| **Gửi Ticket Hỗ trợ** | ❌ | ❌ | ❌ | ❌ | ✅ Tạo mới |
| **Xử lý Ticket & Chat SLA** | ✅ Có | ✅ Có | ✅ Có | ✅ Xử lý chính | ✅ Chat xem phản hồi |
| **Chuyển cấp Ticket** | ✅ Có | ✅ Có | ❌ | ✅ Lên Giảng viên | ❌ Không |
| **Xem Báo cáo & Thống kê** | ✅ Tất cả | ✅ Tất cả | ❌ Không | ❌ Không | ❌ Không |
| **Xem Nhật ký Audit Log** | ✅ Toàn quyền | ✅ Chỉ xem | ❌ Không | ❌ Không | ❌ Không |

---

## 4. CÁC LUỒNG VẬN HÀNH NGHIỆP VỤ (WORKFLOWS)

### 4.1. Luồng Tiếp nhận & Xếp lớp Học viên
1. Người dùng chọn **"Thêm học viên"** (hoặc vào trang **"Import CSV"**).
2. Hệ thống tự sinh mã học viên `HV2024xxx`, avatar viết tắt và kiểm tra trùng lặp email/mã.
3. Người dùng chọn lớp học để ghi danh ngay.
4. Trình duyệt gửi API `POST /api/students` đến Python Server lưu vào SQLite và ghi nhận vào bảng `audit_logs`.

### 4.2. Luồng Điểm danh & Cập nhật Chuyên cần
1. Giảng viên hoặc Trợ giảng vào trang **Điểm danh**, chọn Lớp và Buổi học (từ 1 đến 48).
2. Bấm nhanh **"Điểm danh tất cả có mặt"** hoặc bấm nút trạng thái từng bạn (*Có mặt, Muộn, Vắng, Có phép*).
3. Trình duyệt gửi `POST /api/attendance/mark` đến Python Server lưu vào CSDL, cập nhật buổi học thành "Đã hoàn thành" và tính toán lại tỷ lệ chuyên cần trung bình.

### 4.3. Luồng Kiểm tra & Nhập điểm
1. Giảng viên tạo bài kiểm tra qua `POST /api/assessments`.
2. Giảng viên bấm nút **"Nhập điểm"** trên thẻ bài kiểm tra để mở modal bảng điểm.
3. Nhập điểm và nhận xét cho từng học viên -> Bấm **"Lưu bảng điểm"**.
4. Dữ liệu lưu vào bảng `assessment_results`, tự động tính toán lại điểm trung bình toàn lớp.

### 4.4. Luồng Cảnh báo Sa sút & Thực hiện Can thiệp
1. Mỗi khi điểm danh hoặc điểm số thay đổi, động cơ quy tắc tự động quét:
   - Chuyên cần < 65% hoặc vắng 3 buổi liên tiếp -> Gán mức **Ưu tiên can thiệp 🔴**.
   - Chuyên cần 65-80% hoặc điểm thi giảm > 15% -> Gán mức **Cần theo dõi 🟡**.
2. Học viên xuất hiện trên **Ma trận Rủi ro** và thanh chuông Thông báo trên Header.
3. Trợ giảng/Quản lý bấm nút **"Can thiệp"**, liên hệ học viên và ghi nhận biên bản hỗ trợ (lưu qua `POST /api/interventions`).

### 4.5. Luồng Hỗ trợ Học viên (Tickets & SLA)
1. Học viên vào Cổng học viên gửi yêu cầu hỗ trợ qua `POST /api/tickets`.
2. Hệ thống kích hoạt đồng hồ đếm SLA (phản hồi trong 4h, giải quyết trong 12h).
3. Trợ giảng tiếp nhận, chat phản hồi trực tiếp với học viên qua thread tin nhắn.
4. Khi gặp vấn đề phức tạp (ví dụ: thắc mắc phúc khảo điểm), Trợ giảng có thể thêm **Ghi chú nội bộ** và bấm **"Chuyển cấp"** lên Giảng viên chính.
5. Sau khi hoàn tất giải quyết, bấm **"Đã xử lý"** để đóng ticket.

---

## 5. HƯỚNG DẪN KHỞI CHẠY & VẬN HÀNH

- **Khởi động 1-Click:** Nhấp đúp chuột vào file `start_project.bat` tại thư mục gốc của dự án.
- **Web App Frontend:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **Python Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

