# ============================================
# EduTrack - Database Seeder
# Populates SQLite with complete initial dataset
# ============================================

import math
from datetime import datetime, timedelta
from database import get_connection, init_db

def _insert(cursor, table, rows):
    # Insert by column name: tables gained columns (e.g. classes.teacher_id) after these tuples were written
    if not rows:
        return
    cols = [r[1] for r in cursor.execute(f"PRAGMA table_info({table})")][:len(rows[0])]
    cursor.executemany(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", rows)

def seed():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM staff")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    print("Seeding initial EduTrack data...")

    # 1. Staff
    staff_records = [
        ('STF001', 'Nguyễn Văn An', 'an.nguyen@edu.vn', '0901234561', 'admin', 'CS1', 'NA', 1),
        ('STF003', 'Lê Minh Cường', 'cuong.le@edu.vn', '0901234563', 'teacher', 'CS1', 'LC', 1),
        ('STF004', 'Phạm Thị Dung', 'dung.pham@edu.vn', '0901234564', 'teacher', 'CS2', 'PD', 1),
        ('STF005', 'Hoàng Văn Em', 'em.hoang@edu.vn', '0901234565', 'teaching_assistant', 'CS1', 'HE', 1),
        ('STF006', 'Võ Thị Phương', 'phuong.vo@edu.vn', '0901234566', 'teaching_assistant', 'CS2', 'VP', 1),
    ]
    _insert(cursor, "staff", staff_records)

    # 2. Students
    student_records = [
        ('SV001', 'HV2026001', 'Nguyễn Minh Khôi', 'khoi.nm@email.com', '0912345001', 'active', 'CS1', '2026-09-01', 'NK', '2005-03-15'),
        ('SV002', 'HV2026002', 'Trần Thu Hà', 'ha.tt@email.com', '0912345002', 'active', 'CS1', '2026-09-01', 'TH', '2004-07-22'),
        ('SV003', 'HV2026003', 'Lê Quang Huy', 'huy.lq@email.com', '0912345003', 'active', 'CS1', '2026-09-01', 'LH', '2005-01-10'),
        ('SV004', 'HV2026004', 'Phạm Ngọc Linh', 'linh.pn@email.com', '0912345004', 'active', 'CS1', '2026-09-15', 'PL', '2004-11-05'),
        ('SV005', 'HV2026005', 'Hoàng Đức Mạnh', 'manh.hd@email.com', '0912345005', 'active', 'CS1', '2026-09-15', 'HM', '2005-05-28'),
        ('SV006', 'HV2026006', 'Võ Thanh Nhân', 'nhan.vt@email.com', '0912345006', 'active', 'CS2', '2026-09-01', 'VN', '2004-09-18'),
        ('SV007', 'HV2026007', 'Đặng Thị Oanh', 'oanh.dt@email.com', '0912345007', 'active', 'CS2', '2026-09-01', 'DO', '2005-02-14'),
        ('SV008', 'HV2026008', 'Bùi Văn Phúc', 'phuc.bv@email.com', '0912345008', 'active', 'CS2', '2026-09-15', 'BP', '2004-12-03'),
        ('SV009', 'HV2026009', 'Mai Thị Quỳnh', 'quynh.mt@email.com', '0912345009', 'active', 'CS1', '2026-10-01', 'MQ', '2005-06-20'),
        ('SV010', 'HV2026010', 'Đinh Công Sơn', 'son.dc@email.com', '0912345010', 'active', 'CS2', '2026-10-01', 'DS', '2004-08-11'),
        ('SV011', 'HV2026011', 'Lý Thị Trang', 'trang.lt@email.com', '0912345011', 'active', 'CS1', '2026-09-01', 'LT', '2005-04-07'),
        ('SV012', 'HV2026012', 'Cao Hữu Uyên', 'uyen.ch@email.com', '0912345012', 'inactive', 'CS2', '2026-09-01', 'CU', '2004-10-25'),
    ]
    _insert(cursor, "students", student_records)

    # 3. Classes
    class_records = [
        ('CLS001', 'ENG-A1-01', 'Tiếng Anh A1 - Lớp 01', 'Tiếng Anh A1', 'T2/T4/T6 - 18:00-20:00', 'CS1', 'in_progress', '2026-09-02', '2026-12-27', 48, 32, 25, 6),
        ('CLS002', 'ENG-A2-01', 'Tiếng Anh A2 - Lớp 01', 'Tiếng Anh A2', 'T3/T5/T7 - 09:00-11:00', 'CS1', 'in_progress', '2026-09-03', '2026-12-28', 48, 30, 20, 4),
        ('CLS003', 'IELTS-5.5-01', 'IELTS 5.5 - Lớp 01', 'IELTS 5.5', 'T2/T4/T6 - 14:00-16:00', 'CS2', 'in_progress', '2026-09-02', '2026-12-27', 48, 28, 18, 4),
        ('CLS004', 'TOEIC-600-01', 'TOEIC 600 - Lớp 01', 'TOEIC 600', 'T3/T5 - 18:00-20:30', 'CS1', 'in_progress', '2026-10-01', '2026-01-30', 36, 18, 22, 3),
        ('CLS005', 'ENG-B1-01', 'Tiếng Anh B1 - Lớp 01', 'Tiếng Anh B1', 'T7/CN - 08:00-11:00', 'CS2', 'upcoming', '2026-01-06', '2026-04-30', 36, 0, 20, 0),
    ]
    _insert(cursor, "classes", class_records)

    # 4. Enrollments
    enrollment_records = [
        ('ENR001', 'SV001', 'CLS001', '2026-09-02', '2026-12-27', 'active'),
        ('ENR002', 'SV002', 'CLS001', '2026-09-02', '2026-12-27', 'active'),
        ('ENR003', 'SV003', 'CLS001', '2026-09-02', '2026-12-27', 'active'),
        ('ENR004', 'SV004', 'CLS001', '2026-09-15', '2026-12-27', 'active'),
        ('ENR005', 'SV005', 'CLS001', '2026-09-15', '2026-12-27', 'active'),
        ('ENR006', 'SV011', 'CLS001', '2026-09-02', '2026-12-27', 'active'),
        ('ENR007', 'SV001', 'CLS002', '2026-09-03', '2026-12-28', 'active'),
        ('ENR008', 'SV009', 'CLS002', '2026-10-01', '2026-12-28', 'active'),
        ('ENR009', 'SV011', 'CLS002', '2026-09-03', '2026-12-28', 'active'),
        ('ENR020', 'SV002', 'CLS002', '2026-09-03', '2026-12-28', 'active'),
        ('ENR010', 'SV006', 'CLS003', '2026-09-02', '2026-12-27', 'active'),
        ('ENR011', 'SV007', 'CLS003', '2026-09-02', '2026-12-27', 'active'),
        ('ENR012', 'SV008', 'CLS003', '2026-09-15', '2026-12-27', 'active'),
        ('ENR013', 'SV010', 'CLS003', '2026-10-01', '2026-12-27', 'active'),
        ('ENR014', 'SV005', 'CLS004', '2026-10-01', '2026-01-30', 'active'),
        ('ENR015', 'SV009', 'CLS004', '2026-10-01', '2026-01-30', 'active'),
        ('ENR016', 'SV003', 'CLS004', '2026-10-01', '2026-01-30', 'active'),
    ]
    _insert(cursor, "enrollments", enrollment_records)

    # 5. Class Assignments
    assignment_records = [
        ('CA001', 'CLS001', 'STF003', 'STF005', '2026-09-02', '2026-12-27'),
        ('CA002', 'CLS002', 'STF003', 'STF006', '2026-09-03', '2026-12-28'),
        ('CA003', 'CLS003', 'STF004', 'STF006', '2026-09-02', '2026-12-27'),
        ('CA004', 'CLS004', 'STF003', 'STF005', '2026-10-01', '2026-01-30'),
        ('CA005', 'CLS005', 'STF004', 'STF006', '2026-01-06', '2026-04-30'),
    ]
    _insert(cursor, "class_assignments", assignment_records)

    # 6. Sessions
    def create_sessions(class_id, total, completed, start_str):
        sessions = []
        base = datetime.strptime(start_str, "%Y-%m-%d")
        for i in range(1, total + 1):
            s_date = base + timedelta(days=(i - 1) * 2)
            s_id = f"{class_id}-S{i:02d}"
            sessions.append((s_id, class_id, i, s_date.strftime("%Y-%m-%d"), '18:00', '20:00', f'Buổi {i}', 1 if i <= completed else 0))
        return sessions

    all_sessions = []
    all_sessions += create_sessions('CLS001', 48, 32, '2026-09-02')
    all_sessions += create_sessions('CLS002', 48, 30, '2026-09-03')
    all_sessions += create_sessions('CLS003', 48, 28, '2026-09-02')
    all_sessions += create_sessions('CLS004', 36, 18, '2026-10-01')
    _insert(cursor, "sessions", all_sessions)

    # 7. Attendance
    attendance_rates = {
        'SV001': 0.95, 'SV002': 0.88, 'SV003': 0.75,
        'SV004': 0.92, 'SV005': 0.65, 'SV006': 0.90,
        'SV007': 0.97, 'SV008': 0.82, 'SV009': 0.70,
        'SV010': 0.85, 'SV011': 0.93, 'SV012': 0.60,
    }

    attendance_records = []
    for enr in enrollment_records:
        student_id, class_id = enr[1], enr[2]
        rate = attendance_rates.get(student_id, 0.85)
        # get completed sessions for this class
        class_completed_sessions = [s for s in all_sessions if s[1] == class_id and s[7] == 1]
        for idx, s in enumerate(class_completed_sessions):
            num = int(student_id.replace('SV', ''))
            rand = math.sin(idx * 1000 + num * 100) * 0.5 + 0.5
            if rand < rate * 0.9:
                status = 'present'
            elif rand < rate:
                status = 'late'
            elif rand < rate + 0.03:
                status = 'excused'
            else:
                status = 'absent'
            
            att_id = f"ATT-{student_id}-{s[0]}"
            attendance_records.append((
                att_id, student_id, class_id, s[0], status,
                f"{s[3]}T20:05:00", 'STF005', None
            ))
    _insert(cursor, "attendance", attendance_records)

    # 8. Assessments
    assessment_records = [
        ('ASM001', 'CLS001', 'Kiểm tra giữa kỳ 1', 'midterm', 100, 30, '2026-10-15', 'Kiểm tra nghe, đọc, viết'),
        ('ASM002', 'CLS001', 'Kiểm tra giữa kỳ 2', 'midterm', 100, 30, '2026-11-15', 'Kiểm tra tổng hợp kỹ năng'),
        ('ASM003', 'CLS001', 'Kiểm tra cuối kỳ', 'final', 100, 40, '2026-12-20', 'Thi cuối kỳ tổng quát'),
        ('ASM004', 'CLS002', 'Kiểm tra giữa kỳ 1', 'midterm', 100, 30, '2026-10-18', 'Đánh giá năng lực giai đoạn 1'),
        ('ASM005', 'CLS002', 'Kiểm tra giữa kỳ 2', 'midterm', 100, 30, '2026-11-20', 'Đánh giá năng lực giai đoạn 2'),
        ('ASM006', 'CLS003', 'Mock Test 1', 'midterm', 9, 50, '2026-10-14', 'IELTS Mock Test 1'),
        ('ASM007', 'CLS003', 'Mock Test 2', 'midterm', 9, 50, '2026-11-11', 'IELTS Mock Test 2'),
        ('ASM008', 'CLS004', 'Mini Test 1', 'quiz', 990, 50, '2026-11-01', 'TOEIC Mini Test 1'),
        ('ASM009', 'CLS004', 'Mini Test 2', 'quiz', 990, 50, '2026-12-01', 'TOEIC Mini Test 2'),
    ]
    _insert(cursor, "assessments", assessment_records)

    # 9. Assessment Results
    score_records = [
        ('AR001', 'SV001', 'ASM001', 82, 'STF003', '2026-10-16T10:00:00', 'Làm bài tốt'),
        ('AR002', 'SV002', 'ASM001', 75, 'STF003', '2026-10-16T10:00:00', 'Đạt yêu cầu'),
        ('AR003', 'SV003', 'ASM001', 58, 'STF003', '2026-10-16T10:00:00', 'Cần ôn thêm từ vựng'),
        ('AR004', 'SV004', 'ASM001', 88, 'STF003', '2026-10-16T10:00:00', 'Xuất sắc'),
        ('AR005', 'SV005', 'ASM001', 45, 'STF003', '2026-10-16T10:00:00', 'Yếu ngữ pháp'),
        ('AR006', 'SV011', 'ASM001', 91, 'STF003', '2026-10-16T10:00:00', 'Rất xuất sắc'),
        ('AR007', 'SV001', 'ASM002', 85, 'STF003', '2026-11-16T10:00:00', 'Tiến bộ'),
        ('AR008', 'SV002', 'ASM002', 70, 'STF003', '2026-11-16T10:00:00', 'Ổn định'),
        ('AR009', 'SV003', 'ASM002', 52, 'STF003', '2026-11-16T10:00:00', 'Điểm giảm'),
        ('AR010', 'SV004', 'ASM002', 90, 'STF003', '2026-11-16T10:00:00', 'Duy trì phong độ'),
        ('AR011', 'SV005', 'ASM002', 38, 'STF003', '2026-11-16T10:00:00', 'Cần can thiệp gấp'),
        ('AR012', 'SV011', 'ASM002', 88, 'STF003', '2026-11-16T10:00:00', 'Rất tốt'),
        ('AR013', 'SV001', 'ASM004', 78, 'STF003', '2026-10-19T10:00:00', 'Tốt'),
        ('AR014', 'SV009', 'ASM004', 62, 'STF003', '2026-10-19T10:00:00', 'Khá'),
        ('AR015', 'SV011', 'ASM004', 85, 'STF003', '2026-10-19T10:00:00', 'Giỏi'),
        ('AR021', 'SV002', 'ASM004', 72, 'STF003', '2026-10-19T10:00:00', 'Khá'),
        ('AR016', 'SV006', 'ASM006', 5.5, 'STF004', '2026-10-15T10:00:00', 'Listening tốt, Speaking cần luyện thêm'),
        ('AR017', 'SV007', 'ASM006', 6.0, 'STF004', '2026-10-15T10:00:00', 'Ổn định 4 kỹ năng'),
        ('AR018', 'SV008', 'ASM006', 4.5, 'STF004', '2026-10-15T10:00:00', 'Cần tăng tốc độ đọc'),
        ('AR019', 'SV010', 'ASM006', 5.0, 'STF004', '2026-10-15T10:00:00', 'Đạt mục tiêu ban đầu'),
        ('AR020', 'SV005', 'ASM008', 420, 'STF003', '2026-11-02T10:00:00', 'Part 5 còn sai nhiều'),
    ]
    _insert(cursor, "assessment_results", score_records)

    # 10. Quizzes
    quiz_records = [
        ('QZ001', 'CLS001', 'Quiz Vocabulary Unit 1-4', 20, 100, '2026-09-30', 'Vocabulary'),
        ('QZ002', 'CLS001', 'Quiz Grammar Unit 1-4', 25, 100, '2026-10-07', 'Grammar'),
        ('QZ003', 'CLS001', 'Quiz Vocabulary Unit 5-8', 20, 100, '2026-10-31', 'Vocabulary'),
        ('QZ004', 'CLS001', 'Quiz Grammar Unit 5-8', 25, 100, '2026-11-07', 'Grammar'),
        ('QZ005', 'CLS002', 'Quiz Listening Practice 1', 30, 100, '2026-10-10', 'Listening'),
        ('QZ006', 'CLS002', 'Quiz Reading Practice 1', 25, 100, '2026-10-20', 'Reading'),
        ('QZ007', 'CLS003', 'IELTS Listening Practice 1', 40, 40, '2026-10-07', 'Listening'),
        ('QZ008', 'CLS003', 'IELTS Reading Practice 1', 40, 40, '2026-10-14', 'Reading'),
        ('QZ009', 'CLS004', 'TOEIC Part 5 Practice 1', 30, 100, '2026-10-20', 'Grammar'),
    ]
    _insert(cursor, "quizzes", quiz_records)

    # 11. Quiz Attempts
    quiz_attempt_records = [
        ('QA001', 'SV001', 'QZ001', 85, 17, 20, 12, 'submitted', '2026-09-28T15:30:00'),
        ('QA002', 'SV002', 'QZ001', 75, 15, 20, 15, 'submitted', '2026-09-29T10:00:00'),
        ('QA003', 'SV003', 'QZ001', 55, 11, 20, 18, 'submitted', '2026-09-30T23:50:00'),
        ('QA004', 'SV004', 'QZ001', 90, 18, 20, 10, 'submitted', '2026-09-27T09:00:00'),
        ('QA005', 'SV005', 'QZ001', None, 0, 20, 0, 'not_started', None),
        ('QA006', 'SV011', 'QZ001', 95, 19, 20, 8, 'submitted', '2026-09-26T14:00:00'),
        ('QA007', 'SV001', 'QZ002', 80, 20, 25, 15, 'submitted', '2026-10-05T16:00:00'),
        ('QA008', 'SV002', 'QZ002', 68, 17, 25, 20, 'submitted', '2026-10-06T11:00:00'),
        ('QA009', 'SV003', 'QZ002', 48, 12, 25, 22, 'submitted', '2026-10-07T23:55:00'),
        ('QA010', 'SV005', 'QZ002', 36, 9, 25, 25, 'submitted', '2026-10-07T23:58:00'),
        ('QA011', 'SV001', 'QZ003', 90, 18, 20, 11, 'submitted', '2026-10-29T14:00:00'),
        ('QA012', 'SV002', 'QZ003', 70, 14, 20, 16, 'submitted', '2026-10-30T10:00:00'),
        ('QA013', 'SV003', 'QZ003', None, 0, 20, 0, 'not_started', None),
        ('QA014', 'SV005', 'QZ003', None, 0, 20, 0, 'not_started', None),
        ('QA015', 'SV006', 'QZ007', 28, 28, 40, 30, 'submitted', '2026-10-06T15:00:00'),
        ('QA016', 'SV007', 'QZ007', 32, 32, 40, 28, 'submitted', '2026-10-05T10:00:00'),
        ('QA017', 'SV008', 'QZ007', 22, 22, 40, 30, 'submitted', '2026-10-07T22:00:00'),
    ]
    _insert(cursor, "quiz_attempts", quiz_attempt_records)

    # 12. Support Tickets
    ticket_records = [
        ('TK001', 'SUP-2026-001', 'SV003', 'CLS001', 'lesson', 'Không hiểu bài Grammar Unit 5', 'Em không hiểu phần Past Perfect Continuous. Giảng viên giảng nhanh quá em không theo kịp.', 'medium', 'in_progress', 'STF005', '2026-11-05T14:30:00', '2026-11-05T16:00:00', None, None, None, None, '2026-11-06T02:30:00', 0),
        ('TK002', 'SUP-2026-002', 'SV005', 'CLS001', 'attendance', 'Xin phép nghỉ học 2 buổi', 'Em có việc gia đình cần nghỉ ngày 11/11 và 13/11. Em muốn hỏi có cách nào học bù không?', 'low', 'resolved', 'STF005', '2026-11-08T09:00:00', '2026-11-08T10:30:00', '2026-11-08T11:00:00', None, None, None, '2026-11-08T21:00:00', 0),
        ('TK003', 'SUP-2026-003', 'SV005', 'CLS001', 'score', 'Thắc mắc về điểm kiểm tra giữa kỳ 2', 'Em thấy điểm giữa kỳ 2 của em chỉ 38 điểm, em muốn xem lại bài kiểm tra vì em nghĩ mình làm đúng nhiều hơn.', 'high', 'escalated', 'STF003', '2026-11-18T08:00:00', '2026-11-18T09:30:00', None, '2026-11-18T10:00:00', 'STF005', 'Cần giảng viên xem xét lại bài kiểm tra và xác nhận điểm.', '2026-11-18T20:00:00', 0),
        ('TK004', 'SUP-2026-004', 'SV008', 'CLS003', 'assignment', 'Không nộp được bài Writing Task 2', 'Hệ thống báo lỗi khi em upload file bài writing. Em đã thử nhiều lần mà không được.', 'high', 'new', 'STF006', '2026-11-20T16:00:00', None, None, None, None, None, '2026-11-21T04:00:00', 0),
        ('TK005', 'SUP-2026-005', 'SV009', 'CLS004', 'schedule', 'Đổi lịch học sang lớp khác', 'Em đổi lịch làm việc nên không thể học T3/T5 được nữa. Em muốn chuyển sang lớp T7/CN nếu có.', 'medium', 'waiting_student', 'STF005', '2026-11-15T10:00:00', '2026-11-15T11:30:00', None, None, None, None, '2026-11-15T22:00:00', 0),
        ('TK006', 'SUP-2026-006', 'SV001', 'CLS001', 'lesson', 'Xin tài liệu bổ sung về Listening', 'Em muốn luyện thêm kỹ năng nghe. Thầy cô có thể gợi ý thêm tài liệu không?', 'low', 'resolved', 'STF005', '2026-10-20T09:00:00', '2026-10-20T10:00:00', '2026-10-20T14:00:00', None, None, None, '2026-10-20T21:00:00', 0),
    ]
    _insert(cursor, "support_tickets", ticket_records)

    # 13. Messages
    message_records = [
        ('MSG001', 'TK001', 'SV003', 'Lê Quang Huy', 'student', 'Em không hiểu phần Past Perfect Continuous. Giảng viên giảng nhanh quá em không theo kịp. Em muốn được giải thích lại.', '2026-11-05T14:30:00', 0),
        ('MSG002', 'TK001', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', 'Chào em Huy, anh đã nhận được yêu cầu. Em có thể cho anh biết cụ thể em bị vướng ở phần nào không?', '2026-11-05T16:00:00', 0),
        ('MSG003', 'TK001', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', '[Ghi chú nội bộ] Học viên này có dấu hiệu sa sút, cần theo dõi thêm kết quả quiz và bài tập.', '2026-11-05T16:05:00', 1),
        ('MSG004', 'TK001', 'SV003', 'Lê Quang Huy', 'student', 'Em không biết khi nào dùng Past Perfect Continuous và khi nào dùng Past Perfect. Hai cái giống nhau quá.', '2026-11-05T17:00:00', 0),
        ('MSG005', 'TK003', 'SV005', 'Hoàng Đức Mạnh', 'student', 'Em thấy điểm giữa kỳ 2 của em chỉ 38 điểm, em muốn xem lại bài kiểm tra vì em nghĩ mình làm đúng nhiều hơn.', '2026-11-18T08:00:00', 0),
        ('MSG006', 'TK003', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', 'Chào em Mạnh, anh đã ghi nhận. Anh sẽ chuyển yêu cầu này lên giảng viên Lê Minh Cường để xem xét lại bài.', '2026-11-18T09:30:00', 0),
        ('MSG007', 'TK003', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', '[Ghi chú nội bộ] Chuyển giảng viên xem lại điểm. Học viên có biểu hiện lo lắng.', '2026-11-18T10:00:00', 1),
        ('MSG008', 'TK005', 'SV009', 'Mai Thị Quỳnh', 'student', 'Em đổi lịch làm việc nên không thể học T3/T5 được nữa. Em muốn chuyển sang lớp T7/CN nếu có.', '2026-11-15T10:00:00', 0),
        ('MSG009', 'TK005', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', 'Chào em Quỳnh, hiện tại lớp TOEIC 600 chưa mở thêm ca T7/CN. Anh đang xác nhận với bộ phận quản lý.', '2026-11-15T11:30:00', 0),
    ]
    _insert(cursor, "support_messages", message_records)

    # 14. Progress Snapshots
    progress_records = [
        ('PS001', 'SV001', 'CLS001', 'Tháng 10', 96, 100, 82, 83, 'up', 'normal', '2026-10-31T00:00:00', 95, None),
        ('PS002', 'SV001', 'CLS001', 'Tháng 11', 94, 100, 84, 85, 'up', 'normal', '2026-11-30T00:00:00', 90, None),
        ('PS003', 'SV003', 'CLS001', 'Tháng 10', 78, 80, 58, 52, 'down', 'watch', '2026-10-31T00:00:00', 92, None),
        ('PS004', 'SV003', 'CLS001', 'Tháng 11', 72, 60, 52, None, 'down', 'priority', '2026-11-30T00:00:00', 75, 'Chuyên cần giảm, chưa làm quiz tháng 11.'),
        ('PS005', 'SV005', 'CLS001', 'Tháng 10', 68, 50, 45, None, 'down', 'priority', '2026-10-31T00:00:00', 60, 'Chuyên cần thấp, không làm quiz.'),
        ('PS006', 'SV005', 'CLS001', 'Tháng 11', 62, 40, 38, 36, 'down', 'priority', '2026-11-30T00:00:00', 70, 'Tình trạng xấu liên tục.'),
        ('PS007', 'SV002', 'CLS001', 'Tháng 10', 88, 90, 75, 72, 'stable', 'normal', '2026-10-31T00:00:00', 95, None),
        ('PS008', 'SV002', 'CLS001', 'Tháng 11', 86, 85, 70, 70, 'down', 'watch', '2026-11-30T00:00:00', 90, 'Theo dõi thêm.'),
        ('PS009', 'SV004', 'CLS001', 'Tháng 10', 92, 100, 88, 90, 'up', 'normal', '2026-10-31T00:00:00', 98, None),
        ('PS010', 'SV004', 'CLS001', 'Tháng 11', 94, 100, 90, 92, 'up', 'normal', '2026-11-30T00:00:00', 95, None),
        ('PS011', 'SV006', 'CLS003', 'Tháng 10', 90, 85, 61, 70, 'stable', 'normal', '2026-10-31T00:00:00', 88, None),
    ]
    _insert(cursor, "progress_snapshots", progress_records)

    # 15. Interventions
    intervention_records = [
        ('INT001', 'SV005', 'CLS001', 'Chuyên cần rất thấp (62%), điểm giữa kỳ 2 dưới 40, không hoàn thành quiz.', 'Trợ giảng liên hệ qua điện thoại, tìm hiểu nguyên nhân và lập kế hoạch hỗ trợ.', 'STF005', 'Hoàng Văn Em', 'Học viên khó khăn tài chính, đi làm thêm nhiều. Đã tư vấn chính sách hỗ trợ.', '2026-11-25', '2026-11-19T10:00:00', 'in_progress'),
        ('INT002', 'SV003', 'CLS001', 'Tỷ lệ nộp bài giảm từ 80% xuống 60%, chuyên cần giảm từ 78% xuống 72%.', 'Nhắn tin hỏi thăm tình hình và đề nghị hẹn gặp trực tiếp.', 'STF005', 'Hoàng Văn Em', None, '2026-11-22', '2026-11-17T14:00:00', 'planned'),
    ]
    _insert(cursor, "interventions", intervention_records)

    # 16. Alert Rules (Standardized per UC-16)
    rule_records = [
        ('ALR001', 'Rule 1: Chuyên cần dưới 65%', 'Tỷ lệ chuyên cần tích lũy < 65% (Tối thiểu 3 buổi)', 'attendance_below', 65, 'priority', 1),
        ('ALR002', 'Rule 2a: Vắng 3 buổi liên tiếp không phép', 'Vắng mặt 3 buổi học liên tiếp không có phép xin nghỉ', 'consecutive_absent', 3, 'priority', 1),
        ('ALR003', 'Rule 2b: Vắng 3 buổi liên tiếp có phép', 'Vắng mặt 3 buổi học liên tiếp có phép', 'consecutive_excused', 3, 'watch', 1),
        ('ALR004', 'Rule 3: Chuyên cần từ 65% đến dưới 80%', 'Tỷ lệ chuyên cần tích lũy nằm trong khoảng [65%, 80%)', 'attendance_range', 65, 'watch', 1),
        ('ALR005', 'Rule 4: Điểm giảm > 15% tương đối', 'Điểm trung bình giảm hơn 15% tương đối so với kỳ đánh giá trước', 'score_decline_pct', 15, 'watch', 1),
        ('ALR006', 'Rule 5: Nợ 2 bài tập liên tiếp quá hạn', 'Không nộp hoặc quá hạn 2 bài tập/quiz liên tiếp', 'consecutive_overdue', 2, 'watch', 1),
    ]
    _insert(cursor, "alert_rules", rule_records)

    # 17. Audit Logs
    audit_records = [
        ('LOG001', 'STF003', 'Lê Minh Cường', 'teacher', 'CREATE', 'AssessmentResult', 'AR001-AR006', 'Nhập điểm kiểm tra giữa kỳ 1 cho lớp CLS001 (6 học viên)', '2026-10-16T10:00:00'),
        ('LOG002', 'STF003', 'Lê Minh Cường', 'teacher', 'CREATE', 'AssessmentResult', 'AR007-AR012', 'Nhập điểm kiểm tra giữa kỳ 2 cho lớp CLS001 (6 học viên)', '2026-11-16T10:00:00'),
        ('LOG003', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', 'UPDATE', 'Attendance', 'ATT-SV003-CLS001-S25', 'Cập nhật trạng thái từ "absent" thành "excused"', '2026-11-10T08:30:00'),
        ('LOG004', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', 'ESCALATE', 'SupportTicket', 'TK003', 'Chuyển ticket cho giảng viên STF003 - Cần xem xét lại điểm', '2026-11-18T10:00:00'),
        ('LOG005', 'STF001', 'Nguyễn Văn An', 'admin', 'CREATE', 'Staff', 'STF006', 'Tạo tài khoản trợ giảng mới: Võ Thị Phương', '2026-09-01T09:00:00'),
        ('LOG006', 'STF001', 'Nguyễn Văn An', 'admin', 'UPDATE', 'ClassAssignment', 'CA003', 'Phân công trợ giảng STF006 cho lớp CLS003', '2026-09-01T09:15:00'),
        ('LOG007', 'STF003', 'Lê Minh Cường', 'teacher', 'UPDATE', 'AssessmentResult', 'AR005', 'Sửa điểm GK1 SV005 từ 47 thành 45', '2026-10-18T14:00:00'),
        ('LOG008', 'STF005', 'Hoàng Văn Em', 'teaching_assistant', 'CREATE', 'InterventionRecord', 'INT001', 'Tạo bản ghi can thiệp cho SV005 - Chuyên cần thấp', '2026-11-19T10:00:00'),
    ]
    _insert(cursor, "audit_logs", audit_records)

    conn.commit()
    conn.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()


