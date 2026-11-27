# TÀI LIỆU QUY TRÌNH NGHIỆP VỤ HỆ THỐNG EDUTRACK ENGLISH (BPMN 2.0 TOÀN DIỆN)
> **Phiên bản:** 3.0 — Bản Phát hành Chuẩn hóa Hệ Thống Toàn Quyền  
> **Áp dụng cho các Tác nhân (Actors):** Ban Giám đốc (BOD), Quản trị viên (Admin), Quản lý Học vụ (Academic Manager), Giảng viên (Teacher), Trợ giảng (Teaching Assistant), Học viên (Student).  
> **Kiến trúc hệ thống:** SPA Frontend (TypeScript + Vite), Backend RESTful API (FastAPI Python), Cơ sở dữ liệu quan hệ (SQLite/PostgreSQL) với kiểm soát phân quyền RBAC 2 lớp và cơ chế Audit Trail.

---

## MỤC LỤC
1. [Tổng quan Kiến trúc Phân quyền & Ma trận Tác nhân](#1-tổng-quan-kiến-trúc-phân-quyền--ma-trận-tác-nhân)
2. [BPMN 01: Đăng nhập, Xác thực Đa vai trò & Điều hướng Không gian](#bpmn-01-đăng-nhập-xác-thực-đa-vai-trò--điều-hướng-không-gian-rbac)
3. [BPMN 02: Tiếp nhận Hồ sơ & Xếp lớp Học viên Thủ công](#bpmn-02-tiếp-nhận-hồ-sơ--xếp-lớp-học-viên-thủ-công)
4. [BPMN 03: Nhập Dữ liệu Học viên Hàng loạt (Batch CSV Import 3 Tầng)](#bpmn-03-nhập-dữ-liệu-học-viên-hàng-loạt-batch-csv-import-3-tầng)
5. [BPMN 04: Khởi tạo Lớp học, Phân công Giảng dạy & Sinh Lịch Tự động](#bpmn-04-khởi-tạo-lớp-học-phân-công-giảng-dạy--sinh-lịch-tự-động)
6. [BPMN 05: Điểm danh Buổi học, Cập nhật Chuyên cần & Chốt Tiến độ Lớp](#bpmn-05-điểm-danh-buổi-học-cập-nhật-chuyên-cần--chốt-tiến-độ-lớp)
7. [BPMN 06: Tổ chức Khảo thí, Nhập điểm Rubric & Cảnh báo Điểm liệt](#bpmn-06-tổ-chức-khảo-thí-nhập-điểm-rubric--cảnh-báo-điểm-liệt)
8. [BPMN 07: Tạo Đề Quiz & Học viên Thi Trắc nghiệm Tương tác](#bpmn-07-tạo-đề-quiz--học-viên-thi-trắc-nghiệm-tương-tác)
9. [BPMN 08: Giám sát Sa sút Học tập (Risk Matrix) & Thực thi Can thiệp](#bpmn-08-giám-sát-sa-sút-học-tập-risk-matrix--thực-thi-can-thiệp)
10. [BPMN 09: Tiếp nhận, Phân luồng & Xử lý Ticket Hỗ trợ (SLA 4h / 12h)](#bpmn-09-tiếp-nhận-phân-luồng--xử-lý-ticket-hỗ-trợ-sla-4h--12h)
11. [BPMN 10: Xuất Báo cáo Hiệu suất Trung tâm, In PDF & Audit Trail](#bpmn-10-xuất-báo-cáo-hiệu-suất-trung-tâm-in-pdf--audit-trail)
12. [BPMN 11: Học viên Vào Lớp bằng Mã Mời (Join Class by Code)](#bpmn-11-học-viên-vào-lớp-bằng-mã-mời-join-class-by-code)
13. [BPMN 12: Học viên Học Unit Bài giảng, Ôn Flashcard & Xin Nghỉ Bù](#bpmn-12-học-viên-học-unit-bài-giảng-ôn-flashcard--xin-nghỉ-bù)
14. [BPMN 13: Học viên Nộp Bài tập Trực tuyến & Giảng viên Chấm Điểm 4 Tiêu chí](#bpmn-13-học-viên-nộp-bài-tập-trực-tuyến--giảng-viên-chấm-điểm-4-tiêu-chí)
15. [BPMN 14: Điểm danh Chuỗi (Streak) & Hoàn thành Nhiệm vụ Ngày (Gamification)](#bpmn-14-điểm-danh-chuỗi-streak--hoàn-thành-nhiệm-vụ-ngày-gamification)

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN QUYỀN & MA TRẬN TÁC NHÂN

Hệ thống **EduTrack English** được thiết kế dựa trên mô hình kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) kết hợp bảo mật 2 lớp:
1. **Frontend Route & Layout Guard:** Nhận diện `user.role` từ Token/Local Session để định tuyến chính xác không gian giao diện:
   - Giao diện Gamified Violet Pastel (`#F8F6FF`, `#6C47D9`) chuyên biệt dành riêng cho **Học viên (Student)**.
   - Giao diện Quản trị & Nghiệp vụ Sư phạm Warm Minimalist (`#FAF7F2`, `#A93226`) dành cho **Admin, Academic Manager, Teacher, Teaching Assistant, BOD**.
2. **Backend API Dependency Injection:** FastAPI `Depends(get_current_user)` thẩm định tính hợp lệ của JWT Bearer Token, kiểm tra quyền hạn (Role Scope) trước mọi thao tác ghi/đọc CSDL. Mọi hành vi làm thay đổi trạng thái dữ liệu đều được lưu vết tự động vào bảng bất biến `audit_logs`.

### Ma trận Phân quyền Nghiệp vụ (Actor Permission Matrix)
| Nghiệp vụ chính | BOD | Admin | QL Học vụ | Giảng viên | Trợ giảng | Học viên |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Xem Dashboard & Báo cáo trung tâm | Toàn diện (Chỉ đọc) | Toàn diện | Học vụ & Lớp | Lớp phụ trách | Lớp trợ giảng | Cá nhân & Lớp tham gia |
| Quản lý Khóa học & Lớp học | Chỉ xem | Toàn quyền | Toàn quyền | Xem lớp & Cấu hình | Xem lớp | Tham gia qua mã / Được xếp |
| Điểm danh & Chốt buổi học | Chỉ xem | Toàn quyền | Toàn quyền | Lớp phụ trách | Lớp trợ giảng | Xem kết quả chuyên cần |
| Khảo thí, Chấm điểm Rubric | Chỉ xem | Toàn quyền | Toàn quyền | Chấm lớp phụ trách | Chấm bài được giao | Xem điểm & Lịch sử phúc khảo |
| Soạn đề & Quản lý Quiz | Chỉ xem | Toàn quyền | Soạn đề | Soạn đề cho lớp | Phối hợp | Làm bài đếm giờ |
| Quét Sa sút & Lập Can thiệp | Xem tổng hợp | Toàn quyền | Toàn quyền | Xem & Cập nhật log | Hỗ trợ tương tác | Không truy cập |
| Hệ thống Hỗ trợ Học vụ (Ticket) | Giám sát SLA | Toàn quyền | Điều phối | Xử lý cấp 2 (12h) | Xử lý cấp 1 (4h) | Tạo ticket & Phản hồi |
| Gamification & Học tập Trực tuyến | — | — | — | — | — | Streak, Quests, XP, Flashcard |

---

## BPMN 01: ĐĂNG NHẬP, XÁC THỰC ĐA VAI TRÒ & ĐIỀU HƯỚNG KHÔNG GIAN (RBAC)

### Mô tả Quy trình
Quy trình đảm bảo bất kỳ người dùng nào khi truy cập vào hệ thống đều phải xác minh danh tính qua JWT Token. Dựa trên vai trò được cấp, hệ thống tự động phân tách trải nghiệm người dùng: Học viên được chuyển vào Không gian Học tập Tương tác Gamified Violet, trong khi Cán bộ / Giảng viên được chuyển vào Bảng điều khiển Nghiệp vụ Warm Minimalist.

```mermaid
flowchart TD
    subgraph LANEU["1. Tác nhân (Người dùng)"]
        U_Start([Bắt đầu: Truy cập web]) --> U_Input[Nhập Username / Email & Mật khẩu]
        U_Input --> U_Submit[Bấm Đăng nhập]
        U_Fail[Nhận thông báo lỗi & Nhập lại]
        U_StudentHome([Trang chủ Học tập: #/student-dashboard])
        U_StaffHome([Bảng điều khiển Nghiệp vụ: #/dashboard])
    end

    subgraph LANEF["2. Giao diện (SPA Frontend)"]
        F_Validate{Kiểm tra Client-side}
        F_CallAPI[Gửi POST /api/auth/login]
        F_ParseToken[Lưu Token vào Storage & Đọc User Role]
        F_RoleCheck{Vai trò của User?}
    end

    subgraph LANEB["3. Dịch vụ (FastAPI Backend)"]
        B_CheckUser{Tài khoản tồn tại & Active?}
        B_VerifyPwd{Mật khẩu BCrypt khớp?}
        B_GenToken[Sinh JWT Bearer Access Token]
        B_WriteAudit[Ghi Audit Log: USER_LOGIN]
    end

    subgraph LANED["4. CSDL (Database)"]
        D_QueryUser[(Bảng users)]
        D_AuditLog[(Bảng audit_logs)]
    end

    U_Submit --> F_Validate
    F_Validate -- Thiếu dữ liệu --> U_Fail
    F_Validate -- Hợp lệ --> F_CallAPI
    F_CallAPI --> B_CheckUser
    B_CheckUser --> D_QueryUser
    D_QueryUser --> B_CheckUser
    B_CheckUser -- Không tìm thấy / Bị khóa --> U_Fail
    B_CheckUser -- Hợp lệ --> B_VerifyPwd
    B_VerifyPwd -- Sai mật khẩu --> U_Fail
    B_VerifyPwd -- Đúng mật khẩu --> B_GenToken
    B_GenToken --> B_WriteAudit
    B_WriteAudit --> D_AuditLog
    B_GenToken --> F_ParseToken
    F_ParseToken --> F_RoleCheck
    F_RoleCheck -- role == 'student' --> U_StudentHome
    F_RoleCheck -- role in ['admin','teacher','teaching_assistant','bod'] --> U_StaffHome
```

### Các bước Thực thi & Quy tắc Nghiệp vụ
1. **Kiểm tra đầu vào (Client Validation):** Bắt buộc trường Email/Username và Password không được rỗng.
2. **Xác thực BCrypt:** Backend băm mật khẩu với muối bảo mật và so khớp với bản ghi trong bảng `users`.
3. **Cấp phát Token:** Sinh chuỗi JWT Token chứa payload `{sub: user_id, role: role, exp: timestamp}`.
4. **Kiểm toán (Audit Trail):** Mọi lượt đăng nhập thành công hay thất bại liên tiếp đều được ghi nhận IP và thời gian để chống tấn công brute-force.

---

## BPMN 02: TIẾP NHẬN HỒ SƠ & XẾP LỚP HỌC VIÊN THỦ CÔNG

### Mô tả Quy trình
Quy trình dành cho Quản lý Học vụ hoặc Admin khi ghi nhận học viên mới đến đăng ký tại quầy hoặc qua kênh tuyển sinh, thực hiện kiểm tra đầu vào, tạo hồ sơ 360° và phân bổ vào lớp học phù hợp với sĩ số tối ưu.

```mermaid
flowchart TD
    subgraph LANEO["Quản lý Học vụ / Admin"]
        O_Start([Bắt đầu: Tiếp nhận học viên]) --> O_Input[Nhập Họ tên, SĐT, Email, Trình độ đầu vào]
        O_ChooseClass[Tra cứu danh sách lớp còn chỉ tiêu]
        O_Submit[Bấm Tạo hồ sơ & Xếp lớp]
        O_Success([Hoàn tất: Xuất thẻ học viên & Lịch học])
    end

    subgraph LANEF["Frontend SPA"]
        F_CheckCapacity{Sĩ số lớp hiện tại < Sĩ số tối đa?}
        F_SendPost[Gửi POST /api/students]
        F_UpdateUI[Cập nhật bảng học viên & Huy hiệu sĩ số]
    end

    subgraph LANEB["FastAPI Backend"]
        B_DuplCheck{Kiểm tra trùng SĐT / Email?}
        B_GenCode[Tạo mã định danh duy nhất: HV-XXXX]
        B_CreateStudent[Thêm bản ghi vào bảng students]
        B_Enroll[Ghi danh vào bảng enrollments: status='active']
        B_Log[Ghi Audit Log: STUDENT_ENROLLED]
    end

    subgraph LANED["CSDL"]
        D_Student[(Bảng students)]
        D_Enrollment[(Bảng enrollments)]
        D_Classes[(Bảng classes)]
    end

    O_Input --> O_ChooseClass
    O_ChooseClass --> F_CheckCapacity
    F_CheckCapacity -- Lớp đã đầy --> O_ChooseClass
    F_CheckCapacity -- Còn chỗ --> O_Submit
    O_Submit --> F_SendPost
    F_SendPost --> B_DuplCheck
    B_DuplCheck --> D_Student
    B_DuplCheck -- Đã tồn tại hồ sơ --> O_Input
    B_DuplCheck -- Hợp lệ --> B_GenCode
    B_GenCode --> B_CreateStudent
    B_CreateStudent --> D_Student
    B_CreateStudent --> B_Enroll
    B_Enroll --> D_Enrollment
    B_Enroll --> D_Classes
    B_Enroll --> B_Log
    B_Log --> F_UpdateUI
    F_UpdateUI --> O_Success
```

---

## BPMN 03: NHẬP DỮ LIỆU HỌC VIÊN HÀNG LOẠT (BATCH CSV IMPORT 3 TẦNG)

### Mô tả Quy trình
Quy trình nhập dữ liệu danh sách hàng loạt học viên đầu kỳ từ file Excel/CSV. Để bảo đảm toàn vẹn CSDL, hệ thống áp dụng cơ chế kiểm duyệt 3 tầng (Kiểm tra cấu trúc file $\rightarrow$ Xác thực từng dòng dữ liệu $\rightarrow$ Giao dịch ghi Database Transaction).

```mermaid
flowchart TD
    subgraph LANEO["Cán bộ Học vụ"]
        O_Start([Tải lên file CSV / Excel]) --> O_Upload[Chọn file từ máy tính]
        O_Preview[Xem trước lưới dữ liệu 3 tầng kiểm tra]
        O_Fix[Sửa lỗi dữ liệu trực tiếp trên bảng xem trước]
        O_Confirm[Xác nhận Nhập dữ liệu chính thức]
        O_Done([Kết thúc: Xem báo cáo kết quả nhập])
    end

    subgraph LANES["Hệ thống (Client + Server)"]
        S_T1{Tầng 1: Cấu trúc Header & Dung lượng?}
        S_T2{Tầng 2: Kiểm tra định dạng từng dòng: SĐT, Email, Ngày sinh?}
        S_ShowErr[Hiển thị danh sách dòng lỗi & Lý do]
        S_T3[Tầng 3: Mở DB Transaction atomicity]
        S_BatchInsert[Ghi nhận dữ liệu hàng loạt & Tự động tạo User Login]
        S_Audit[Ghi Audit Log: BATCH_STUDENT_IMPORT]
    end

    O_Upload --> S_T1
    S_T1 -- Sai header / Quá 5MB --> S_ShowErr
    S_ShowErr --> O_Upload
    S_T1 -- Hợp lệ --> S_T2
    S_T2 -- Có lỗi nghiệp vụ --> S_ShowErr
    S_ShowErr --> O_Fix
    O_Fix --> S_T2
    S_T2 -- Toàn bộ dòng hợp lệ --> O_Preview
    O_Preview --> O_Confirm
    O_Confirm --> S_T3
    S_T3 --> S_BatchInsert
    S_BatchInsert --> S_Audit
    S_Audit --> O_Done
```

---

## BPMN 04: KHỞI TẠO LỚP HỌC, PHÂN CÔNG GIẢNG DẠY & SINH LỊCH TỰ ĐỘNG

### Mô tả Quy trình
Khi mở một lớp học mới thuộc lộ trình giảng dạy, hệ thống tự động phân tích khung chương trình của khóa học, đối chiếu thời khóa biểu của Giảng viên & Trợ giảng để tránh trùng lịch phòng học và tự động sinh toàn bộ danh sách 24 - 48 buổi học trong hệ thống.

```mermaid
flowchart TD
    subgraph LANEM["Quản lý Học vụ"]
        M_Start([Bắt đầu: Mở lớp mới]) --> M_SelectCourse[Chọn Khóa học & Lộ trình]
        M_SelectCourse --> M_InputInfo[Chọn Ngày khai giảng, Phòng học, Thứ trong tuần & Ca học]
        M_InputInfo --> M_AssignStaff[Chỉ định Giảng viên & Trợ giảng]
        M_AssignStaff --> M_GenSchedule[Bấm Tự động sinh lịch học]
        M_CheckCal[Kiểm tra lịch học sinh ra]
        M_Confirm[Chốt tạo lớp & Kích hoạt mã tham gia]
        M_End([Lớp chuyển trạng thái: Đang hoạt động])
    end

    subgraph LANEB["Hệ thống Backend & CSDL"]
        B_ConflictCheck{Kiểm tra xung đột phòng & giảng viên?}
        B_CalcDates[Tính toán danh sách các ngày học thực tế]
        B_SkipHolidays[Tự động bỏ qua các ngày nghỉ lễ trung tâm]
        B_CreateClass[Tạo bản ghi Class & sinh mã Code lớp học 6 ký tự]
        B_InsertSessions[Lưu batch lịch 48 buổi vào bảng sessions]
    end

    M_GenSchedule --> B_ConflictCheck
    B_ConflictCheck -- Bị trùng ca/phòng --> M_InputInfo
    B_ConflictCheck -- Trống lịch --> B_CalcDates
    B_CalcDates --> B_SkipHolidays
    B_SkipHolidays --> M_CheckCal
    M_CheckCal --> M_Confirm
    M_Confirm --> B_CreateClass
    B_CreateClass --> B_InsertSessions
    B_InsertSessions --> M_End
```

---

## BPMN 05: ĐIỂM DANH BUỔI HỌC, CẬP NHẬT CHUYÊN CẦN & CHỐT TIẾN ĐỘ LỚP

### Mô tả Quy trình
Vào mỗi buổi học, Giảng viên hoặc Trợ giảng mở giao diện Điểm danh (`#/attendance`), tích chọn trạng thái của từng học viên (Có mặt, Đi trễ, Vắng có phép, Vắng không phép), ghi chú và bấm Lưu điểm danh. Hệ thống tự động tính toán lại tỷ lệ chuyên cần và lũy kế tiến độ lớp học mà không cho phép đếm trùng tiến độ khi chỉnh sửa lại.

```mermaid
flowchart TD
    subgraph LANET["Giảng viên / Trợ giảng"]
        T_Start([Đến giờ học: Mở màn hình Điểm danh]) --> T_SelectClass[Chọn Lớp & Buổi học tương ứng]
        T_SelectClass --> T_Mark[Đánh dấu từng học viên: Có mặt / Trễ / Có phép / Vắng]
        T_Mark --> T_Note[Nhập nhận xét buổi học nếu có]
        T_Note --> T_Save[Bấm Lưu & Chốt điểm danh]
        T_Done([Hoàn thành buổi điểm danh])
    end

    subgraph LANEB["Backend Service & Logic"]
        B_CheckSession{Buổi học này đã từng điểm danh chưa?}
        B_UpdateRecord[Cập nhật chi tiết bảng attendance_records]
        B_CalcAtt[Tính tỷ lệ chuyên cần: Đi học / Đi học + Vắng]
        B_IncProgress[Tăng completed_sessions = completed_sessions + 1]
        B_KeepProgress[Giữ nguyên số buổi hoàn thành: Không đếm trùng]
        B_TriggerRisk{Tỷ lệ vắng liên tiếp >= 2 hoặc Chuyên cần < 80%?}
        B_PushRisk[Đẩy cờ cảnh báo vào Ma trận Sa sút]
    end

    T_Save --> B_CheckSession
    B_CheckSession -- Buổi học mới --> B_UpdateRecord
    B_UpdateRecord --> B_IncProgress
    B_CheckSession -- Chỉnh sửa buổi cũ --> B_UpdateRecord
    B_UpdateRecord --> B_KeepProgress
    B_IncProgress --> B_CalcAtt
    B_KeepProgress --> B_CalcAtt
    B_CalcAtt --> B_TriggerRisk
    B_TriggerRisk -- Có nguy cơ --> B_PushRisk
    B_TriggerRisk -- Bình thường --> T_Done
    B_PushRisk --> T_Done
```

---

## BPMN 06: TỔ CHỨC KHẢO THÍ, NHẬP ĐIỂM RUBRIC & CẢNH BÁO ĐIỂM LIỆT

### Mô tả Quy trình
Quy trình tổ chức kỳ thi định kỳ (Mid-term, Final-term hoặc Đánh giá Speaking/Writing theo Rubric 4 tiêu chí chuẩn IELTS). Hệ thống kiểm soát tính hợp lệ của thang điểm (0 - 100) và tự động kích hoạt cờ cảnh báo đối với học viên có điểm dưới ngưỡng liệt (< 50 điểm).

```mermaid
flowchart TD
    subgraph LANET["Giảng viên / Khảo thí"]
        T_Start([Bắt đầu: Mở đợt chấm thi]) --> T_OpenGrading[Mở giao diện Bảng điểm & Rubric]
        T_OpenGrading --> T_InputScores[Nhập điểm theo 4 tiêu chí: Fluency, Lexical, Grammar, Pronunciation]
        T_InputScores --> T_AudioFeedback[Tải lên file ghi âm nhận xét hoặc nhập phản hồi chi tiết]
        T_AudioFeedback --> T_Submit[Bấm Lưu & Công bố điểm]
        T_Done([Bảng điểm cập nhật lên Cổng Học viên])
    end

    subgraph LANEB["Backend & Thuật toán Tính điểm"]
        B_ValidateRange{Điểm thành phần thuộc [0, 100]?}
        B_CalcWeighted[Tính điểm tổng kết: sum Điểm_i * Trọng_số_i]
        B_CheckFail{Điểm thi < 50 điểm?}
        B_RaiseAlert[Gắn nhãn: CẢNH BÁO ĐIỂM LIỆT - Chuyển sang Early Warning]
        B_SaveGrades[Lưu vào bảng grades & student_results]
        B_NotifyStudent[Phát thông báo điểm mới cho Học viên]
    end

    T_Submit --> B_ValidateRange
    B_ValidateRange -- Sai thang điểm --> T_InputScores
    B_ValidateRange -- Hợp lệ --> B_CalcWeighted
    B_CalcWeighted --> B_CheckFail
    B_CheckFail -- Điểm dưới 50 --> B_RaiseAlert
    B_CheckFail -- Đạt yêu cầu --> B_SaveGrades
    B_RaiseAlert --> B_SaveGrades
    B_SaveGrades --> B_NotifyStudent
    B_NotifyStudent --> T_Done
```

---

## BPMN 07: TẠO ĐỀ QUIZ & HỌC VIÊN THI TRẮC NGHIỆM TƯƠNG TÁC

### Mô tả Quy trình
Giảng viên biên soạn ngân hàng câu hỏi trắc nghiệm trực quan (có media âm thanh, hình ảnh), thiết lập thời gian làm bài đếm ngược. Khi học viên làm bài, hệ thống ghi nhận thời gian thực và tự động thu bài khi hết giờ.

```mermaid
flowchart TD
    subgraph LANET["Giảng viên"]
        T_CreateQuiz[Soạn đề thi Quiz: Câu hỏi, Đáp án đúng, Thời gian làm bài]
        T_Publish[Phát hành đề Quiz cho Lớp học]
    end

    subgraph LANES["Học viên (Student)"]
        S_Start([Vào mục Luyện tập / Quiz]) --> S_JoinQuiz[Bắt đầu làm bài: Bộ đếm giờ kích hoạt]
        S_Answer[Chọn đáp án cho từng câu hỏi]
        S_Choice{Học viên chủ động nộp hay hết giờ?}
        S_Submit[Bấm Nộp bài]
        S_AutoSub[Hệ thống tự động thu bài khi Timer = 0]
        S_Review[Xem kết quả, số câu đúng và giải thích đáp án]
    end

    subgraph LANEB["Backend Engine"]
        B_ScoreCalc[Đối chiếu đáp án với Database Key]
        B_GenXP[Cộng điểm kinh nghiệm XP & Cập nhật sức khỏe từ vựng]
        B_SaveResult[Ghi nhận vào bảng quiz_submissions]
    end

    T_CreateQuiz --> T_Publish
    T_Publish --> S_Start
    S_Start --> S_JoinQuiz
    S_JoinQuiz --> S_Answer
    S_Answer --> S_Choice
    S_Choice -- Nộp trước giờ --> S_Submit
    S_Choice -- Hết thời gian --> S_AutoSub
    S_Submit --> B_ScoreCalc
    S_AutoSub --> B_ScoreCalc
    B_ScoreCalc --> B_GenXP
    B_GenXP --> B_SaveResult
    B_SaveResult --> S_Review
```

---

## BPMN 08: GIÁM SÁT SA SÚT HỌC TẬP (RISK MATRIX) & THỰC THI CAN THIỆP

### Mô tả Quy trình
Hệ thống chạy thuật toán quét tự động theo 6 bộ quy tắc sa sút học tập (Vắng 2 buổi liên tiếp, Chuyên cần <80%, Điểm kiểm tra giảm đột ngột >15%, Điểm <50, Chưa nộp bài tập >3 ngày, Ticket chưa xử lý). Quản lý Học vụ lập hồ sơ can thiệp và theo dõi tiến độ phục hồi của học viên.

```mermaid
flowchart TD
    subgraph LANES["Động cơ Hệ thống (Cron / Trigger Engine)"]
        S_Scan[Quét CSDL toàn trung tâm theo chu kỳ]
        S_Eval{Thỏa mãn 1 trong 6 quy tắc sa sút?}
        S_CreateFlag[Khởi tạo bản ghi Cảnh báo nguy cơ mức độ: Thấp / TB / Cao]
    end

    subgraph LANEM["Quản lý Học vụ / Giảng viên"]
        M_ViewMatrix[Truy cập Ma trận Sa sút #/risk-matrix]
        M_SelectStudent[Chọn học viên có cảnh báo Đỏ / Vàng]
        M_CreatePlan[Lập Kế hoạch Can thiệp: Gọi điện phụ huynh / Phụ đạo kèm 1-1]
        M_Execute[Thực hiện can thiệp và cập nhật tiến độ]
        M_Evaluate{Học viên có cải thiện sau 2 tuần?}
        M_CloseRisk[Đóng cảnh báo: Chuyển trạng thái Bình phục]
        M_Escalate[Báo cáo Ban Giám đốc để xử lý chuyển lớp/bảo lưu]
    end

    S_Scan --> S_Eval
    S_Eval -- Không vi phạm --> S_Scan
    S_Eval -- Có nguy cơ --> S_CreateFlag
    S_CreateFlag --> M_ViewMatrix
    M_ViewMatrix --> M_SelectStudent
    M_SelectStudent --> M_CreatePlan
    M_CreatePlan --> M_Execute
    M_Execute --> M_Evaluate
    M_Evaluate -- Đạt yêu cầu --> M_CloseRisk
    M_Evaluate -- Vẫn tiếp tục sa sút --> M_Escalate
```

---

## BPMN 09: TIẾP NHẬN, PHÂN LUỒNG & XỬ LÝ TICKET HỖ TRỢ (SLA 4H / 12H)

### Mô tả Quy trình
Học viên gặp vướng mắc bài học hoặc thủ tục hành chính gửi vé hỗ trợ. Hệ thống phân luồng 2 cấp: Cấp 1 giao cho Trợ giảng xử lý với cam kết SLA $\le$ 4 giờ; nếu vượt thẩm quyền hoặc quá hạn, ticket tự động chuyển cấp 2 lên Giảng viên chính với hạn SLA $\le$ 12 giờ.

```mermaid
flowchart TD
    subgraph LANESTU["Học viên"]
        St_Open([Tạo Ticket Hỗ trợ mới]) --> St_Input[Nhập Tiêu đề, Nội dung câu hỏi, Phân loại, File đính kèm]
        St_Input --> St_Send[Gửi yêu cầu]
        St_ReceiveAns[Nhận thông báo phản hồi & Đánh giá mức độ hài lòng]
        St_CloseOrReopen{Vấn đề đã được giải quyết triệt để?}
        St_Closed([Hài lòng: Đóng Ticket])
        St_Reopen[Mở lại Ticket & Bổ sung thắc mắc]
    end

    subgraph LANETA["Cấp 1: Trợ giảng (SLA 4 giờ)"]
        TA_Receive[Nhận thông báo Ticket mới]
        TA_CheckSLA{Phản hồi trong 4 giờ?}
        TA_Handle{Nội dung thuộc thẩm quyền Trợ giảng?}
        TA_Reply[Trả lời giải đáp bài tập & Hướng dẫn học viên]
        TA_Escalate[Bấm Chuyển cấp lên Giảng viên chính]
    end

    subgraph LANETCH["Cấp 2: Giảng viên chính (SLA 12 giờ)"]
        TC_Receive[Nhận thông báo Escalation]
        TC_Answer[Soạn giải đáp học thuật chuyên sâu]
    end

    St_Send --> TA_Receive
    TA_Receive --> TA_CheckSLA
    TA_CheckSLA -- Sắp quá hạn hoặc Quá 4h --> TA_Escalate
    TA_CheckSLA -- Trong hạn 4h --> TA_Handle
    TA_Handle -- Xử lý được --> TA_Reply
    TA_Handle -- Vấn đề học thuật sâu --> TA_Escalate
    TA_Escalate --> TC_Receive
    TC_Receive --> TC_Answer
    TA_Reply --> St_ReceiveAns
    TC_Answer --> St_ReceiveAns
    St_ReceiveAns --> St_CloseOrReopen
    St_CloseOrReopen -- Đã rõ --> St_Closed
    St_CloseOrReopen -- Chưa rõ --> St_Reopen
    St_Reopen --> TA_Receive
```

---

## BPMN 10: XUẤT BÁO CÁO HIỆU SUẤT TRUNG TÂM, IN PDF & AUDIT TRAIL

### Mô tả Quy trình
Ban Giám đốc (BOD) hoặc Quản lý Trung tâm cần số liệu tổng hợp định kỳ về tỷ lệ chuyên cần, phổ điểm trung bình, hiệu suất xử lý ticket SLA và nhật ký truy vết hệ thống. Hệ thống tạo báo cáo động, hỗ trợ tải file CSV và xuất bản in PDF chuẩn hóa.

```mermaid
flowchart TD
    subgraph LANEBOD["Ban Giám đốc / Admin"]
        BOD_Start([Truy cập Báo cáo & Kiểm toán]) --> BOD_Filter[Chọn Cơ sở, Khóa học, Khoảng ngày thống kê]
        BOD_Filter --> BOD_ViewDashboard[Xem biểu đồ xu hướng trực quan]
        BOD_Action{Lựa chọn định dạng xuất dữ liệu?}
        BOD_ExportCSV[Tải file số liệu thô CSV/Excel]
        BOD_PrintPDF[In / Lưu Báo cáo dạng PDF chuẩn format A4]
        BOD_Audit[Truy vấn Nhật ký Kiểm toán Audit Trail]
    end

    subgraph LANEENG["Công cụ Xuất dữ liệu & Ghi nhận"]
        ENG_Aggregate[Tổng hợp số liệu từ các bảng: attendance, grades, tickets, logs]
        ENG_RenderReport[Kết xuất dữ liệu định dạng chuẩn hóa]
        ENG_WriteAudit[Ghi vết Audit: REPORT_EXPORTED]
    end

    BOD_Filter --> ENG_Aggregate
    ENG_Aggregate --> BOD_ViewDashboard
    BOD_ViewDashboard --> BOD_Action
    BOD_Action -- Tải bảng tính --> BOD_ExportCSV
    BOD_Action -- Bản in chính thức --> BOD_PrintPDF
    BOD_Action -- Kiểm tra gian lận --> BOD_Audit
    BOD_ExportCSV --> ENG_WriteAudit
    BOD_PrintPDF --> ENG_WriteAudit
```

---

## BPMN 11: HỌC VIÊN VÀO LỚP BẰNG MÃ MỜI (JOIN CLASS BY CODE)

### Mô tả Quy trình
Học viên nhận được mã lớp 6 ký tự do Giảng viên hoặc Trung tâm cung cấp. Tại Không gian Học tập, học viên nhập mã để hệ thống kiểm tra và tự động liên kết học viên vào lớp ngay lập tức mà không cần chờ Admin thao tác thủ công.

```mermaid
flowchart TD
    subgraph LANES["Học viên (Giao diện Gamified Violet)"]
        S_Start([Tại Trang chủ Học viên: #/student-dashboard]) --> S_ClickJoin[Bấm nút '+ Vào lớp']
        S_ClickJoin --> S_OpenModal[Mở màn hình Vào lớp: #/student-join-class]
        S_OpenModal --> S_InputCode[Nhập mã lớp gồm 6 ký tự, VD: IEL55A]
        S_InputCode --> S_Submit[Bấm 'Xác nhận vào lớp']
        S_Fail[Hiển thị cảnh báo lỗi viền đỏ & Thông báo nguyên nhân]
        S_Success[Thông báo thành công kèm hiệu ứng chúc mừng]
        S_ToClass([Tự động mở Trang chi tiết bài học của lớp: #/student-class-detail])
    end

    subgraph LANEB["FastAPI Backend (POST /api/students/join-class)"]
        B_Auth{Xác thực Token Học viên?}
        B_FindClass{Tìm thấy Lớp học theo class_code?}
        B_CheckStatus{Lớp học đang có trạng thái 'active'?}
        B_CheckEnrolled{Học viên đã ở trong lớp này chưa?}
        B_CreateEnrollment[Ghi bản ghi mới vào enrollments: status='active', joined_at=now]
        B_WriteAudit[Ghi Audit Log: STUDENT_JOINED_VIA_CODE]
    end

    S_Submit --> B_Auth
    B_Auth -- Không hợp lệ --> S_Fail
    B_Auth -- Hợp lệ --> B_FindClass
    B_FindClass -- Không tìm thấy mã --> S_Fail
    S_Fail --> S_InputCode
    B_FindClass -- Tìm thấy lớp --> B_CheckStatus
    B_CheckStatus -- Lớp đã đóng/lưu trữ --> S_Fail
    B_CheckStatus -- Lớp đang mở --> B_CheckEnrolled
    B_CheckEnrolled -- Đã tham gia từ trước --> S_Fail
    B_CheckEnrolled -- Chưa tham gia --> B_CreateEnrollment
    B_CreateEnrollment --> B_WriteAudit
    B_WriteAudit --> S_Success
    S_Success --> S_ToClass
```

---

## BPMN 12: HỌC VIÊN HỌC UNIT BÀI GIẢNG, ÔN FLASHCARD & XIN NGHỈ BÙ

### Mô tả Quy trình
Học viên theo dõi lộ trình từng Unit trong lớp học, truy cập slide bài giảng, lật Flashcard từ vựng 2 mặt (từ, phiên âm, định nghĩa, ví dụ). Nếu có việc bận vào ngày học, học viên nộp đơn xin nghỉ và chọn ghép ca bù sang lớp song song tương đương.

```mermaid
flowchart TD
    subgraph LANES["Học viên"]
        S_Start([Mở Chi tiết Lớp học: #/student-class-detail]) --> S_SelectUnit[Chọn Unit bài học trong danh sách]
        S_SelectUnit --> S_Action{Học viên thực hiện hoạt động nào?}
        
        S_Action -- Học bài giảng & Ôn từ --> S_OpenStudy[Mở Flashcard & Tài liệu Unit]
        S_OpenStudy --> S_FlipCard[Lật thẻ Flashcard ghi nhớ từ vựng]
        S_FlipCard --> S_MarkLearned[Đánh dấu: 'Đã thuộc từ này']
        S_MarkLearned --> S_UpdateVocab[Tăng chỉ số Sức khỏe Từ vựng]

        S_Action -- Có việc bận buổi tới --> S_LeaveRequest[Bấm 'Xin nghỉ học']
        S_LeaveRequest --> S_ChooseSession[Chọn Buổi xin nghỉ & Lý do]
        S_ChooseSession --> S_ChooseMakeup{Đăng ký Ghép ca học bù?}
        S_ChooseMakeup -- Có --> S_SelectAltClass[Chọn Lớp song song có cùng Unit]
        S_ChooseMakeup -- Không --> S_SubmitLeave[Bấm Gửi đơn xin nghỉ]
        S_SelectAltClass --> S_SubmitLeave
    end

    subgraph LANETA["Trợ giảng & Hệ thống"]
        TA_ReviewLeave[Hệ thống cập nhật trạng thái điểm danh: 'excused']
        TA_ConfirmMakeup[Ghi nhận lịch học ghép cho học viên vào danh sách ca bù]
        TA_Notify[Gửi thông báo xác nhận cho học viên]
    end

    S_SubmitLeave --> TA_ReviewLeave
    TA_ReviewLeave --> TA_ConfirmMakeup
    TA_ConfirmMakeup --> TA_Notify
```

---

## BPMN 13: HỌC VIÊN NỘP BÀI TẬP TRỰC TUYẾN & GIẢNG VIÊN CHẤM ĐIỂM 4 TIÊU CHÍ

### Mô tả Quy trình
Giảng viên giao bài tập (Assignment). Học viên làm bài và nộp trực tuyến qua 3 hình thức (đính kèm file, dán liên kết Google Docs/Drive, nhập văn bản trực tiếp). Giảng viên mở giao diện Chấm bài (`#/grading`), nghe file ghi âm hoặc đọc bài, chấm điểm theo Rubric 4 tiêu chí và gửi phản hồi 2 chiều cho học viên.

```mermaid
flowchart TD
    subgraph LANESTU["Học viên"]
        St_View[Xem danh sách Bài tập tại #/student-assignments] --> St_OpenTask[Mở chi tiết bài tập cần nộp]
        St_OpenTask --> St_Prepare[Chuẩn bị bài nộp: Tải file / Nhập text / Dán link Drive]
        St_Prepare --> St_CheckDeadline{Còn trong hạn nộp?}
        St_SubmitNormal[Bấm Nộp bài đúng hạn]
        St_SubmitLate[Bấm Nộp bài muộn: Hệ thống gắn cờ 'Late']
        St_FeedbackView[Xem điểm số Rubric 4 tiêu chí & Lời phê của Giảng viên]
    end

    subgraph LANETCH["Giảng viên / Trợ giảng (#/grading)"]
        Tc_Queue[Truy cập danh sách bài tập cần chấm] --> Tc_SelectSub[Chọn bài nộp của học viên]
        Tc_SelectSub --> Tc_Review[Đọc nội dung / Nghe audio học viên gửi]
        Tc_Review --> Tc_Rubric[Chấm theo 4 tiêu chí: Task Response, Coherence, Lexical, Grammar]
        Tc_Rubric --> Tc_Comment[Nhập nhận xét chi tiết & Lời khuyên cải thiện]
        Tc_Comment --> Tc_Publish[Bấm Hoàn tất & Công bố điểm]
    end

    St_CheckDeadline -- Trước Deadline --> St_SubmitNormal
    St_CheckDeadline -- Quá Deadline --> St_SubmitLate
    St_SubmitNormal --> Tc_Queue
    St_SubmitLate --> Tc_Queue
    Tc_Publish --> St_FeedbackView
```

---

## BPMN 14: ĐIỂM DANH CHUỖI (STREAK) & HOÀN THÀNH NHIỆM VỤ NGÀY (GAMIFICATION)

### Mô tả Quy trình
Hệ thống tạo động lực học tập cho học viên thông qua cơ chế Gamification: Mỗi ngày đăng nhập học tập, học viên giữ vững Chuỗi ngày (Streak). Khi hoàn thành các nhiệm vụ ngày (ôn từ vựng, làm quiz, nộp bài), hệ thống tự động cộng Thóc và Điểm kinh nghiệm (XP) để vinh danh trên Bảng xếp hạng trung tâm.

```mermaid
flowchart TD
    subgraph LANESTU["Học viên"]
        S_Login([Đăng nhập vào Hệ thống]) --> S_CheckIn[Mở Thẻ 'Mục tiêu hôm nay']
        S_CheckIn --> S_DoQuest[Thực hiện 1 nhiệm vụ: Ôn 5 từ vựng / Hoàn thành 1 Quiz]
        S_DoQuest --> S_OpenQuests[Bấm nút '🎯 Nhiệm vụ' trên Header]
        S_OpenQuests --> S_Claim[Bấm 'Nhận thưởng' tại nhiệm vụ đã hoàn thành]
        S_RewardModal[Hiển thị chúc mừng: Nhận Thóc + Điểm XP]
        S_Leaderboard[Học viên thăng hạng trên BXH Toàn trung tâm]
    end

    subgraph LANESYS["Hệ thống Động cơ Gamification"]
        SYS_CalcStreak{Hôm qua học viên có học không?}
        SYS_StreakPlus[Tăng Streak: streak_count = streak_count + 1]
        SYS_StreakReset[Đặt lại Streak = 1]
        SYS_CheckTasks{Hoàn thành điều kiện nhiệm vụ ngày?}
        SYS_AddXP[Cộng điểm XP và Thóc vào tài khoản học viên]
        SYS_ReorderRank[Cập nhật lại thứ hạng Bảng xếp hạng tuần]
    end

    S_Login --> SYS_CalcStreak
    SYS_CalcStreak -- Có học liên tục --> SYS_StreakPlus
    SYS_CalcStreak -- Đứt chuỗi > 24h --> SYS_StreakReset
    SYS_StreakPlus --> S_CheckIn
    SYS_StreakReset --> S_CheckIn
    S_DoQuest --> SYS_CheckTasks
    SYS_CheckTasks -- Đạt chỉ tiêu --> S_OpenQuests
    S_Claim --> SYS_AddXP
    SYS_AddXP --> SYS_ReorderRank
    SYS_AddXP --> S_RewardModal
    SYS_ReorderRank --> S_Leaderboard
```

---
*Tài liệu Quy trình Nghiệp vụ BPMN 2.0 Toàn diện được chuẩn hóa cho hệ thống quản lý đào tạo tiếng Anh EduTrack English.*
