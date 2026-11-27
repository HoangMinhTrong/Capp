# BỘ TÀI LIỆU SƠ ĐỒ QUY TRÌNH NGHIỆP VỤ BPMN - HỆ THỐNG EDUTRACK

> **Tài liệu Mô hình hóa Quy trình Nghiệp vụ (Business Process Model and Notation - BPMN 2.0)**  
> **Dự án:** Hệ thống Quản lý Tiến độ Học tập & Can thiệp Rủi ro Học viên EduTrack  
> **Kiến trúc:** Python FastAPI Backend + SQLite + TypeScript Vite Frontend SPA  
> **Ngày phát hành:** 05/11/2026

---

## MỤC LỤC 10 QUY TRÌNH BPMN CHUẨN HÓA

1. [BPMN 01: Quy trình Đăng nhập, Xác thực & Phân bổ Không gian Làm việc](#bpmn-01-quy-trinh-dang-nhap-xac-thuc--phan-bo-khong-gian-lam-viec)
2. [BPMN 02: Quy trình Tiếp nhận & Xếp lớp Học viên Thủ công](#bpmn-02-quy-trinh-tiep-nhan--xep-lop-hoc-vien-thu-cong)
3. [BPMN 03: Quy trình Nhập Dữ liệu Học viên Hàng loạt (Batch CSV/Excel Import)](#bpmn-03-quy-trinh-nhap-du-lieu-hoc-vien-hang-loat-batch-csvexcel-import)
4. [BPMN 04: Quy trình Khởi tạo Lớp học, Phân công Giảng dạy & Sinh Lịch 48 Buổi](#bpmn-04-quy-trinh-khoi-tao-lop-hoc-phan-cong-giang-day--sinh-lich-48-buoi)
5. [BPMN 05: Quy trình Điểm danh Buổi học & Tự động Cập nhật Chuyên cần](#bpmn-05-quy-trinh-diem-danh-buoi-hoc--tu-dong-cap-nhat-chuyen-can)
6. [BPMN 06: Quy trình Tổ chức Kiểm tra, Nhập điểm & Đánh giá Năng lực](#bpmn-06-quy-trinh-to-chuc-kiem-tra-nhap-diem--danh-gia-nang-luc)
7. [BPMN 07: Quy trình Tạo Đề Quiz & Học viên Nộp bài Trắc nghiệm](#bpmn-07-quy-trinh-tao-de-quiz--hoc-vien-nop-bai-trac-nghiem)
8. [BPMN 08: Quy trình Giám sát Học tập, Quét Cảnh báo Sa sút & Thực hiện Can thiệp](#bpmn-08-quy-trinh-giam-sat-hoc-tap-quet-canh-bao-sa-sut--thuc-hien-can-thiep)
9. [BPMN 09: Quy trình Tiếp nhận, Xử lý & Chuyển cấp Vé Hỗ trợ Học viên theo Chuẩn SLA](#bpmn-09-quy-trinh-tiep-nhan-xu-ly--chuyen-cap-ve-ho-tro-hoc-vien-theo-chuan-sla)
10. [BPMN 10: Quy trình Xuất Báo cáo Đa chiều, In ấn PDF & Kiểm toán Audit Trail](#bpmn-10-quy-trinh-xuat-bao-cao-da-chieu-in-an-pdf--kiem-toan-audit-trail)

---

## BPMN 01: Quy trình Đăng nhập, Xác thực & Phân bổ Không gian Làm việc

```mermaid
flowchart TD
    subgraph Lane_User ["Làn 1: Người dùng"]
        Start1(["Bắt đầu: Mở ứng dụng"]) --> ClickRole["Chọn tài khoản đăng nhập trên giao diện Login"]
    end

    subgraph Lane_Client ["Làn 2: Frontend SPA (TypeScript)"]
        ClickRole --> CaptureId["Đọc staff_id hoặc student_id từ nút chọn"]
        CaptureId --> CallAuthAPI["Gửi yêu cầu đăng nhập sang API Python"]
        HandleRes{"Vai trò là gì?"}
        RouteStudent["Lưu state học viên -> Điều hướng sang #/student-dashboard"]
        RouteStaff["Lưu state nhân sự -> Điều hướng sang #/dashboard"]
    end

    subgraph Lane_Server ["Làn 3: Python API (backend/main.py)"]
        CallAuthAPI --> PostLogin["POST /api/auth/login"]
        PostLogin --> QueryDB{"Kiểm tra sự tồn tại trong CSDL"}
        ReturnUser["Trả về thông tin User, Quyền Role và Token phiên"]
    end

    subgraph Lane_DB ["Làn 4: SQLite Database"]
        QueryDB --> StaffTbl[("Bảng staff / students")]
    end

    StaffTbl --> ReturnUser
    ReturnUser --> HandleRes
    HandleRes -->|student| RouteStudent
    HandleRes -->|admin / academic_manager / teacher / ta| RouteStaff

    subgraph Lane_Result ["Kết thúc"]
        RouteStudent --> EndStudent(["Hiển thị Cổng Học viên cá nhân"])
        RouteStaff --> EndStaff(["Hiển thị Dashboard & Sidebar theo quyền"])
    end
```

---

## BPMN 02: Quy trình Tiếp nhận & Xếp lớp Học viên Thủ công

```mermaid
flowchart TD
    subgraph Lane_Admin ["Làn 1: Quản trị viên / Quản lý học vụ"]
        Start2(["Bắt đầu"]) --> OpenStudents["Vào trang Quản lý Học viên"]
        OpenStudents --> ClickAdd["Bấm 'Thêm học viên mới'"]
        ClickAdd --> FillForm["Nhập Họ tên, Email, SĐT, Cơ sở, Chọn Lớp ghi danh"]
        FillForm --> SubmitStudent["Bấm 'Tạo học viên'"]
    end

    subgraph Lane_Client ["Làn 2: Frontend SPA"]
        SubmitStudent --> ValidateClient{"Form hợp lệ?"}
        ValidateClient -->|Thiếu thông tin| ShowFormError["Báo lỗi trường bắt buộc trên Form"]
        ShowFormError --> FillForm
        ValidateClient -->|Hợp lệ| GenInfo["Tự động sinh mã HV2024xxx & Avatar Initials"]
        GenInfo --> SendPostStudent["Gửi API POST /api/students"]
        UpdateStudentTable["Cập nhật ngay vào bảng hiển thị & Báo Toast thành công"]
    end

    subgraph Lane_Server ["Làn 3: Python API (FastAPI)"]
        SendPostStudent --> ProcessStudent["Xử lý create_student() trong main.py"]
        ProcessStudent --> CheckDup{"Kiểm tra trùng Email/Mã?"}
        CheckDup -->|Trùng| ThrowErr["Trả về HTTP 400: Đã tồn tại"]
        CheckDup -->|Không trùng| ExecInsert["Thực thi câu lệnh SQL INSERT"]
        ExecInsert --> AutoAudit["Ghi Audit Log: Thêm mới học viên"]
    end

    subgraph Lane_DB ["Làn 4: SQLite Database"]
        ExecInsert --> TblStudent[("Bảng students & enrollments")]
        ExecInsert --> TblClassUpdate[("Bảng classes: Tăng sĩ số +1")]
        AutoAudit --> TblAudit[("Bảng audit_logs")]
    end

    TblStudent --> UpdateStudentTable
    UpdateStudentTable --> End2(["Kết thúc: Học viên sẵn sàng học tập"])
```

---

## BPMN 03: Quy trình Nhập Dữ liệu Học viên Hàng loạt (Batch CSV/Excel Import)

```mermaid
flowchart TD
    subgraph Lane_User ["Làn 1: Quản lý học vụ / Admin"]
        Start3(["Bắt đầu"]) --> OpenImportPage["Vào trang Import Dữ liệu (#/import)"]
        OpenImportPage --> DownloadTemplate["(Tùy chọn) Bấm 'Tải file mẫu CSV'"]
        DownloadTemplate --> PrepareFile["Chuẩn bị file danh sách học viên .csv"]
        PrepareFile --> DropFile["Kéo thả file vào Drop Zone hoặc Dán text CSV"]
    end

    subgraph Lane_Client ["Làn 2: Frontend SPA"]
        DropFile --> ParseCSV["Đọc file bằng FileReader & Phân tích các dòng"]
        ParseCSV --> LoopRows["Kiểm tra từng dòng: Email hợp lệ, Cơ sở CS1/CS2, Trùng lặp"]
        LoopRows --> ShowPreview["Hiển thị Bảng Preview có gắn nhãn: Hợp lệ / Lỗi"]
        ShowPreview --> CheckCount{"Có ít nhất 1 dòng hợp lệ?"}
        CheckCount -->|Không| DisableBtn["Khóa nút Xác nhận & Báo cảnh báo"]
        CheckCount -->|Có| EnableBtn["Mở khóa nút 'Xác nhận Nhập dữ liệu'"]
        EnableBtn --> ClickConfirm["Người dùng bấm 'Xác nhận Nhập dữ liệu'"]
        ClickConfirm --> CallBatchAPI["Gửi POST /api/students/import (danh sách hợp lệ)"]
    end

    subgraph Lane_Server ["Làn 3: Python API (FastAPI)"]
        CallBatchAPI --> PythonBatch["Thực thi import_students()"]
        PythonBatch --> BulkInsert["Thực hiện vòng lặp INSERT vào SQLite"]
        BulkInsert --> LogImportAudit["Ghi nhật ký hệ thống: Import N học viên"]
        LogImportAudit --> ReturnSuccess["Trả về: {'message': 'Thành công', 'count': N}"]
    end

    subgraph Lane_DB ["Làn 4: SQLite Database"]
        BulkInsert --> TblStudentsBulk[("Bảng students")]
        LogImportAudit --> TblAuditBulk[("Bảng audit_logs")]
    end

    ReturnSuccess --> ResetUI["Ẩn bảng Preview, Xóa dữ liệu cũ, Báo Toast xanh"]
    ResetUI --> End3(["Kết thúc: Toàn bộ học viên đã được nhập"])
```

---

## BPMN 04: Quy trình Khởi tạo Lớp học, Phân công Giảng dạy & Sinh Lịch 48 Buổi

```mermaid
flowchart TD
    subgraph Lane_User ["Làn 1: Quản lý học vụ / Admin"]
        Start4(["Bắt đầu"]) --> OpenClasses["Vào trang Quản lý Lớp học (#/classes)"]
        OpenClasses --> ClickNewClass["Bấm 'Thêm lớp học mới'"]
        ClickNewClass --> InputClassData["Điền Mã lớp, Tên lớp, Khóa học, Chọn GV, Trợ giảng, Lịch học"]
        InputClassData --> SubmitNewClass["Bấm 'Tạo lớp học'"]
    end

    subgraph Lane_Client ["Làn 2: Frontend SPA"]
        SubmitNewClass --> ValidateClass["Kiểm tra tính đầy đủ thông tin"]
        ValidateClass --> PostClassAPI["Gửi API POST /api/classes"]
    end

    subgraph Lane_Server ["Làn 3: Python API (FastAPI)"]
        PostClassAPI --> ExecCreateClass["create_class() trong main.py"]
        ExecCreateClass --> InsertClass["Lưu thông tin lớp vào classes"]
        InsertClass --> InsertAssign["Lưu phân công vào class_assignments"]
        InsertAssign --> Gen48Sessions["Vòng lặp i từ 1 đến 48: Sinh 48 bản ghi buổi học"]
        Gen48Sessions --> InsertSessions["INSERT đồng loạt vào sessions"]
        InsertSessions --> AuditClass["Ghi Audit Log: Tạo lớp học mới"]
        AuditClass --> ResClass["Trả về: {'class_id': 'CLS006'}"]
    end

    subgraph Lane_DB ["Làn 4: SQLite Database"]
        InsertClass --> TblClasses[("Bảng classes")]
        InsertAssign --> TblAssign[("Bảng class_assignments")]
        InsertSessions --> TblSessions[("Bảng sessions")]
        AuditClass --> TblAuditClass[("Bảng audit_logs")]
    end

    ResClass --> RenderNewCard["Thêm thẻ lớp mới vào Grid hiển thị"]
    RenderNewCard --> End4(["Kết thúc: Lớp học sẵn sàng hoạt động"])
```

---

## BPMN 05: Quy trình Điểm danh Buổi học & Tự động Cập nhật Chuyên cần

```mermaid
flowchart TD
    subgraph Lane_Staff ["Làn 1: Giảng viên / Trợ giảng"]
        Start5(["Bắt đầu buổi học"]) --> OpenAttendance["Vào trang Điểm danh (#/attendance)"]
        OpenAttendance --> SelectClassSession["Chọn Lớp học & Buổi học (Buổi 1 - 48)"]
        SelectClassSession --> ChooseMethod{"Hình thức điểm danh?"}
        ChooseMethod -->|Cả lớp đủ| MarkAll["Bấm 'Điểm danh tất cả có mặt'"]
        ChooseMethod -->|Từng học viên| MarkIndividual["Bấm nút: Có mặt / Muộn / Vắng / Phép"]
    end

    subgraph Lane_Client ["Làn 2: Frontend SPA"]
        MarkAll --> UpdateClientState["Cập nhật giao diện tức thì & Vẽ lại Donut Chart"]
        MarkIndividual --> UpdateClientState
        UpdateClientState --> PrepAttPayload["Tạo gói dữ liệu: session_id, danh sách học viên & trạng thái"]
        PrepAttPayload --> SendMarkAPI["Gửi POST /api/attendance/mark"]
    end

    subgraph Lane_Server ["Làn 3: Python API (FastAPI)"]
        SendMarkAPI --> ProcessAttendance["mark_attendance() trong main.py"]
        ProcessAttendance --> UpsertAtt["Thực thi INSERT ... ON CONFLICT DO UPDATE"]
        UpsertAtt --> MarkSessionDone["Cập nhật sessions.is_completed = 1"]
        MarkSessionDone --> CountCompleted["Đếm lại tổng số buổi hoàn thành của lớp"]
        CountCompleted --> UpdateClassCompleted["UPDATE classes.completed_sessions"]
        UpdateClassCompleted --> AuditAttendance["Ghi nhật ký Audit Log"]
    end

    subgraph Lane_DB ["Làn 4: SQLite Database"]
        UpsertAtt --> TblAtt[("Bảng attendance")]
        MarkSessionDone --> TblSess[("Bảng sessions")]
        UpdateClassCompleted --> TblCls[("Bảng classes")]
        AuditAttendance --> TblAuditAtt[("Bảng audit_logs")]
    end

    AuditAttendance --> ToastAtt["Trả về 200 OK -> Hiển thị Toast thông báo thành công"]
    ToastAtt --> End5(["Kết thúc buổi điểm danh"])
```

---

## BPMN 06: Quy trình Tổ chức Kiểm tra, Nhập điểm & Đánh giá Năng lực

```mermaid
flowchart TD
    subgraph Lane_Teacher ["Làn 1: Giảng viên"]
        Start6(["Bắt đầu kỳ kiểm tra"]) --> OpenAssessments["Vào trang Kiểm tra (#/assessments)"]
        OpenAssessments --> ClickCreateExam["Bấm 'Tạo bài kiểm tra mới'"]
        ClickCreateExam --> InputExamInfo["Nhập: Tên bài, Loại bài, Trọng số %, Điểm tối đa, Ngày thi"]
        InputExamInfo --> SaveExam["Bấm 'Tạo bài kiểm tra'"]

        SaveExam --> ClickInputScores["Bấm 'Nhập điểm' trên thẻ bài thi vừa tạo"]
        ClickInputScores --> ShowScoreModal["Mở Modal Danh sách học viên lớp"]
        ShowScoreModal --> EnterStudentScores["Nhập điểm (0-100) & Lời nhận xét từng bạn"]
        EnterStudentScores --> SubmitScores["Bấm 'Lưu bảng điểm'"]
    end

    subgraph Lane_Client ["Làn 2: Frontend SPA"]
        SubmitScores --> ValidateScores{"Điểm số hợp lệ (<= max_score)?"}
        ValidateScores -->|Sai| ShowScoreError["Báo đỏ học viên có điểm không hợp lệ"]
        ShowScoreError --> EnterStudentScores
        ValidateScores -->|Đúng| PostScoresAPI["Gửi POST /api/assessments/scores"]
    end

    subgraph Lane_Server ["Làn 3: Python API (FastAPI)"]
        PostScoresAPI --> ProcessScores["save_assessment_scores() trong main.py"]
        ProcessScores --> LoopUpsertScores["Vòng lặp lưu điểm vào assessment_results"]
        LoopUpsertScores --> CalcClassAvg["Tính toán điểm trung bình mới của cả lớp"]
        CalcClassAvg --> CheckLowScore["Phát hiện học viên điểm < 50 (Có nguy cơ sa sút)"]
        CheckLowScore --> AuditScore["Ghi Audit Log: Nhập điểm bài thi"]
    end

    subgraph Lane_DB ["Làn 4: SQLite Database"]
        LoopUpsertScores --> TblScores[("Bảng assessment_results")]
        AuditScore --> TblAuditScore[("Bảng audit_logs")]
    end

    AuditScore --> ResScoresSuccess["Trả về kết quả thành công -> Cập nhật bảng điểm trên web"]
    ResScoresSuccess --> End6(["Kết thúc: Bảng điểm đã lưu trữ an toàn"])
```

---

## BPMN 07: Quy trình Tạo Đề Quiz & Học viên Nộp bài Trắc nghiệm

```mermaid
flowchart TD
    subgraph Lane_Teacher ["Làn 1: Giảng viên"]
        Start7(["Bắt đầu"]) --> CreateQuizBtn["Vào trang Quiz -> Bấm 'Tạo Quiz mới'"]
        CreateQuizBtn --> InputQuizData["Nhập: Chủ đề, Số câu hỏi, Điểm tối đa, Hạn nộp (Deadline)"]
        InputQuizData --> PostQuizAPI["Gửi POST /api/quizzes -> Lưu đề vào bảng quizzes"]
    end

    subgraph Lane_Student ["Làn 2: Học viên"]
        PostQuizAPI --> StudentNotif["Học viên nhận thông báo có đề Quiz mới"]
        StudentNotif --> LoginStudentPortal["Đăng nhập Cổng Học viên (#/student-dashboard)"]
        LoginStudentPortal --> ViewQuizTab["Mở Tab 'Quiz trắc nghiệm'"]
        ViewQuizTab --> CheckDeadline{"Còn trong hạn nộp?"}
        CheckDeadline -->|Hết hạn| ShowOverdue["Hiển thị nhãn: Đã quá hạn nộp"]
        CheckDeadline -->|Còn hạn| DoQuiz["Học viên tiến hành trả lời câu hỏi trắc nghiệm"]
        DoQuiz --> SubmitQuiz["Bấm 'Nộp bài trắc nghiệm'"]
    end

    subgraph Lane_System ["Làn 3: Hệ thống & Python Server"]
        SubmitQuiz --> AutoGrade["Chấm điểm tự động: Đếm số câu đúng / Tổng câu"]
        AutoGrade --> SaveAttempt["Lưu kết quả nộp bài vào bảng quiz_attempts"]
        SaveAttempt --> UpdateCompletionRate["Cập nhật tỷ lệ hoàn thành Quiz của lớp"]
    end

    subgraph Lane_DB ["Làn 4: SQLite Database"]
        SaveAttempt --> TblQuizAttempts[("Bảng quiz_attempts")]
        UpdateCompletionRate --> TblQuizzes[("Bảng quizzes")]
    end

    UpdateCompletionRate --> StudentResultView["Hiển thị điểm tức thì cho học viên"]
    StudentResultView --> End7(["Kết thúc: Học viên hoàn thành Quiz"])
```

---

## BPMN 08: Quy trình Giám sát Học tập, Quét Cảnh báo Sa sút & Thực hiện Can thiệp

```mermaid
flowchart TD
    subgraph Lane_Engine ["Làn 1: Động cơ Quy tắc Rủi ro (Alert Rules Engine)"]
        Start8(["Định kỳ / Sau mỗi lần cập nhật dữ liệu"]) --> FetchLatest["Thu thập điểm danh, điểm kiểm tra, quiz của học viên"]
        FetchLatest --> ScanRules["Quét qua 6 quy tắc cảnh báo rủi ro tự động"]
        ScanRules --> EvaluateRule{"Đánh giá mức độ sa sút"}
        
        EvaluateRule -->|Chuyên cần < 65% HOẶC Vắng 3 buổi liên tiếp| FlagPriority["Gán nhãn: Ưu tiên can thiệp (Priority) 🔴"]
        EvaluateRule -->|Chuyên cần 65-80% HOẶC Điểm giảm > 15%| FlagWatch["Gán nhãn: Cần theo dõi (Watch) 🟡"]
        EvaluateRule -->|Các chỉ số đạt yêu cầu| FlagNormal["Gán nhãn: Bình thường (Normal) 🟢"]

        FlagPriority --> SaveSnapshot["Lưu Snapshot vào progress_snapshots & Đẩy chuông thông báo"]
        FlagWatch --> SaveSnapshot
    end

    subgraph Lane_TA ["Làn 2: Trợ giảng / Quản lý học vụ"]
        SaveSnapshot --> AlertReceived["Trợ giảng thấy cảnh báo trên Dashboard / Ma trận rủi ro"]
        AlertReceived --> ReviewDetail["Xem Hồ sơ học viên 360° để nắm rõ nguyên nhân"]
        ReviewDetail --> ContactStudent["Liên hệ học viên: Gọi điện thoại / Nhắn tin / Hẹn gặp"]
        ContactStudent --> OpenInterveneModal["Bấm nút 'Thêm can thiệp' trên hệ thống"]
        OpenInterveneModal --> FillIntervention["Ghi nhận: Vấn đề phát hiện, Biện pháp hỗ trợ, Ngày tái khám"]
        FillIntervention --> SubmitIntervention["Bấm 'Lưu bản ghi can thiệp'"]
    end

    subgraph Lane_Server ["Làn 3: Python Server & CSDL"]
        SubmitIntervention --> PostInterventionAPI["POST /api/interventions"]
        PostInterventionAPI --> SaveInterveneDB[("Lưu vào bảng interventions")]
        SaveInterveneDB --> AutoAuditIntervene["Ghi Audit Log: Can thiệp học viên"]
    end

    AutoAuditIntervene --> ScheduleFollowUp["Đưa vào lịch theo dõi 7 ngày tiếp theo"]
    ScheduleFollowUp --> End8(["Kết thúc chu trình can thiệp ban đầu"])
```

---

## BPMN 09: Quy trình Tiếp nhận, Xử lý & Chuyển cấp Vé Hỗ trợ Học viên theo Chuẩn SLA

```mermaid
flowchart TD
    subgraph Lane_Student ["Làn 1: Học viên"]
        Start9(["Gặp khó khăn học tập"]) --> OpenSupportModal["Mở form gửi hỗ trợ trên Cổng học viên"]
        OpenSupportModal --> InputTicket["Chọn danh mục, Nhập tiêu đề & Mô tả chi tiết vấn đề"]
        InputTicket --> SubmitTicket["Bấm 'Gửi yêu cầu'"]
        SubmitTicket --> WaitForReply["Chờ phản hồi & Nhận tin nhắn trong luồng chat"]
    end

    subgraph Lane_Server ["Làn 2: Python API & SLA Engine"]
        SubmitTicket --> CreateTicketAPI["POST /api/tickets"]
        CreateTicketAPI --> SaveTicketDB[("Lưu vào support_tickets & support_messages")]
        SaveTicketDB --> StartSLATimer["Kích hoạt đồng hồ SLA: Phản hồi 4h, Giải quyết 12h"]
        StartSLATimer --> NotifyTA["Bắn thông báo nổi lên thanh Header của Trợ giảng"]
    end

    subgraph Lane_TA ["Làn 3: Trợ giảng"]
        NotifyTA --> OpenTicketDetail["Mở chi tiết Ticket trong phân hệ Hỗ trợ (#/support)"]
        OpenTicketDetail --> AssessComplexity{"Độ phức tạp của vấn đề?"}
        
        AssessComplexity -->|Hỗ trợ thông thường| ReplyMsg["Nhập nội dung phản hồi trực tiếp cho học viên"]
        ReplyMsg --> SendReply["Gửi tin nhắn -> Lưu thời gian phản hồi đầu tiên"]

        AssessComplexity -->|Phức tạp / Phúc khảo điểm| AddInternalNote["Tích chọn: Ghi chú nội bộ (Học viên không thấy)"]
        AddInternalNote --> ClickEscalate["Bấm nút 'Chuyển cấp' (Escalate to Teacher)"]
    end

    subgraph Lane_Teacher ["Làn 4: Giảng viên"]
        ClickEscalate --> TeacherNotified["Giảng viên nhận ticket chuyển cấp"]
        TeacherNotified --> TeacherReview["Xem lại bài thi / đề kiểm tra của học viên"]
        TeacherReview --> TeacherReply["Giảng viên phản hồi xác nhận chính thức vào luồng chat"]
    end

    TeacherReply --> MarkResolved["Trợ giảng / Giảng viên bấm 'Đã xử lý' (Resolved)"]
    SendReply --> MarkResolved

    MarkResolved --> StopSLATimer["Chốt thời gian giải quyết & Đánh giá đạt chuẩn SLA"]
    StopSLATimer --> EndTicketNotify["Học viên nhận thông báo ticket đã hoàn tất"]
    EndTicketNotify --> End9(["Kết thúc xử lý Ticket"])
```

---

## BPMN 10: Quy trình Xuất Báo cáo Đa chiều, In ấn PDF & Kiểm toán Audit Trail

```mermaid
flowchart TD
    subgraph Lane_User ["Làn 1: Quản lý học vụ / Ban Giám đốc"]
        Start10(["Bắt đầu"]) --> OpenReports["Vào trang Báo cáo (#/reports) hoặc Audit Log (#/audit-log)"]
        OpenReports --> SelectScope["Lựa chọn Phạm vi: Cơ sở 1, Cơ sở 2 hoặc Toàn hệ thống"]
        SelectScope --> ChooseOutput{"Nhu cầu xuất báo cáo?"}
        
        ChooseOutput -->|In / Lưu PDF| ClickPrint["Bấm nút 'In / Lưu PDF'"]
        ChooseOutput -->|Tải file Excel/CSV| ClickCSV["Bấm nút 'Xuất báo cáo CSV'"]
        ChooseOutput -->|Tra soát lịch sử| SearchAudit["Lọc Audit Log theo Hành động (CREATE/UPDATE/DELETE)"]
    end

    subgraph Lane_Client ["Làn 2: Frontend SPA"]
        ClickPrint --> TriggerMediaPrint["Kích hoạt CSS @media print: Tự động ẩn Sidebar, mở hộp thoại in trình duyệt"]
        TriggerMediaPrint --> SavePDF["Người dùng chọn 'Save as PDF' hoặc gửi máy in"]

        ClickCSV --> AggregateData["Thu thập dữ liệu học viên, chuyên cần, điểm số hiện tại"]
        AggregateData --> GenCSVBlob["Tạo đối tượng Blob chứa định dạng CSV UTF-8 kèm ký tự BOM"]
        GenCSVBlob --> AutoDownload["Tự động tải xuống file: Bao_Cao_Hoc_Vien.csv"]

        SearchAudit --> FilterLogsClient["Lọc danh sách thay đổi và người thực hiện"]
        FilterLogsClient --> ExportAuditCSV["Bấm 'Xuất nhật ký CSV' -> Tải file Audit_Log.csv"]
    end

    subgraph Lane_Server ["Làn 3: Python Server & CSDL"]
        FilterLogsClient --> FetchAuditAPI["Gọi GET /api/audit-logs khi cần tải mới"]
        FetchAuditAPI --> ReadAuditDB[("Truy vấn bảng audit_logs trong SQLite")]
    end

    SavePDF --> End10(["Kết thúc: Tài liệu báo cáo sẵn sàng"])
    AutoDownload --> End10
    ExportAuditCSV --> End10
```

