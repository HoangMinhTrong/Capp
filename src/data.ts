// ============================================
// EduTrack - Mock Data Store
// Dữ liệu mẫu nhất quán cho MVP
// ============================================

import type {
  Student, Class, Enrollment, Staff, ClassAssignment, Session,
  Attendance, Assessment, AssessmentResult, Quiz, QuizAttempt,
  SupportTicket, SupportMessage, ProgressSnapshot, InterventionRecord,
  FeedbackRecord, AuditLog, SLAConfig, AlertRule,
  StudentAssignment, StudentSubmission, MakeupClassOption, MakeupBooking,
  CourseLesson, CourseVocabulary, CourseExamSample, TeacherInvite,
  CenterClassItem, CourseCatalogItem, StudentMonitoringItem, ActivityDay,
  Announcement,
  StudentStatus, Role
} from './types.ts';

// === Staff / Users ===
export const staffData: Staff[] = [
  { staff_id: 'STF001', full_name: 'Nguyễn Văn An', email: 'an.nguyen@edu.vn', phone: '0901234561', role: 'admin', campus: 'CS1', avatar_initials: 'NA', is_active: true },
  { staff_id: 'STF003', full_name: 'Lê Minh Cường', email: 'cuong.le@edu.vn', phone: '0901234563', role: 'teacher', campus: 'CS1', avatar_initials: 'LC', is_active: true },
  { staff_id: 'STF004', full_name: 'Phạm Thị Dung', email: 'dung.pham@edu.vn', phone: '0901234564', role: 'teacher', campus: 'CS2', avatar_initials: 'PD', is_active: true },
  { staff_id: 'STF005', full_name: 'Hoàng Văn Em', email: 'em.hoang@edu.vn', phone: '0901234565', role: 'teaching_assistant', campus: 'CS1', avatar_initials: 'HE', is_active: true },
  { staff_id: 'STF006', full_name: 'Võ Thị Phương', email: 'phuong.vo@edu.vn', phone: '0901234566', role: 'teaching_assistant', campus: 'CS2', avatar_initials: 'VP', is_active: true },
];

// === Students ===
export const studentData: Student[] = [
  { student_id: 'SV_NN', student_code: 'HV2026-NN', full_name: 'Nguyễn Hồng Nhung', email: 'hongnhung.student@edutrack.vn', phone: '0912345678', status: 'active', campus: 'CS1', enrollment_date: '2026-11-01', avatar_initials: 'HN', date_of_birth: '2005-08-18' },
  { student_id: 'SV001', student_code: 'HV2026-001', full_name: 'Nguyễn Thị Thảo Nguyên', email: 'thaonguyen.nt@email.com', phone: '0912345001', status: 'active', campus: 'CS1', enrollment_date: '2026-09-01', avatar_initials: 'TN', date_of_birth: '2005-03-15' },
  { student_id: 'SV002', student_code: 'HV2026002', full_name: 'Trần Thu Hà', email: 'ha.tt@email.com', phone: '0912345002', status: 'active', campus: 'CS1', enrollment_date: '2026-09-01', avatar_initials: 'TH', date_of_birth: '2004-07-22' },
  { student_id: 'SV003', student_code: 'HV2026003', full_name: 'Lê Quang Huy', email: 'huy.lq@email.com', phone: '0912345003', status: 'active', campus: 'CS1', enrollment_date: '2026-09-01', avatar_initials: 'LH', date_of_birth: '2005-01-10' },
  { student_id: 'SV004', student_code: 'HV2026004', full_name: 'Phạm Ngọc Linh', email: 'linh.pn@email.com', phone: '0912345004', status: 'active', campus: 'CS1', enrollment_date: '2026-09-15', avatar_initials: 'PL', date_of_birth: '2004-11-05' },
  { student_id: 'SV005', student_code: 'HV2026005', full_name: 'Hoàng Đức Mạnh', email: 'manh.hd@email.com', phone: '0912345005', status: 'active', campus: 'CS1', enrollment_date: '2026-09-15', avatar_initials: 'HM', date_of_birth: '2005-05-28' },
  { student_id: 'SV006', student_code: 'HV2026006', full_name: 'Võ Thanh Nhân', email: 'nhan.vt@email.com', phone: '0912345006', status: 'active', campus: 'CS2', enrollment_date: '2026-09-01', avatar_initials: 'VN', date_of_birth: '2004-09-18' },
  { student_id: 'SV007', student_code: 'HV2026007', full_name: 'Đặng Thị Oanh', email: 'oanh.dt@email.com', phone: '0912345007', status: 'active', campus: 'CS2', enrollment_date: '2026-09-01', avatar_initials: 'DO', date_of_birth: '2005-02-14' },
  { student_id: 'SV008', student_code: 'HV2026008', full_name: 'Bùi Văn Phúc', email: 'phuc.bv@email.com', phone: '0912345008', status: 'active', campus: 'CS2', enrollment_date: '2026-09-15', avatar_initials: 'BP', date_of_birth: '2004-12-03' },
  { student_id: 'SV009', student_code: 'HV2026009', full_name: 'Mai Thị Quỳnh', email: 'quynh.mt@email.com', phone: '0912345009', status: 'active', campus: 'CS1', enrollment_date: '2026-10-01', avatar_initials: 'MQ', date_of_birth: '2005-06-20' },
  { student_id: 'SV010', student_code: 'HV2026010', full_name: 'Đinh Công Sơn', email: 'son.dc@email.com', phone: '0912345010', status: 'active', campus: 'CS2', enrollment_date: '2026-10-01', avatar_initials: 'DS', date_of_birth: '2004-08-11' },
  { student_id: 'SV011', student_code: 'HV2026011', full_name: 'Lý Thị Trang', email: 'trang.lt@email.com', phone: '0912345011', status: 'active', campus: 'CS1', enrollment_date: '2026-09-01', avatar_initials: 'LT', date_of_birth: '2005-04-07' },
  { student_id: 'SV012', student_code: 'HV2026012', full_name: 'Cao Hữu Uyên', email: 'uyen.ch@email.com', phone: '0912345012', status: 'inactive', campus: 'CS2', enrollment_date: '2026-09-01', avatar_initials: 'CU', date_of_birth: '2004-10-25' },
];

// === Classes / Courses ===
export const classData: Class[] = [
  { class_id: 'CLS_NN01', class_code: 'IELTS-FND-NN', class_name: 'IELTS Foundation 5.5 — Giáo trình mẫu', course_name: 'IELTS Foundation', schedule: 'T5 - 19:12-22:12', campus: 'CS1', status: 'in_progress', start_date: '2026-11-01', end_date: '2027-02-28', total_sessions: 24, completed_sessions: 0, max_students: 20, current_students: 0, author_name: 'GV. Lê Minh Cường', lesson_count: 24 },
  { class_id: 'CLS001', class_code: 'ENG-A1-01', class_name: 'Tiếng Anh A1 - Lớp 01', course_name: 'Tiếng Anh A1', schedule: 'T2/T4/T6 - 18:00-20:00', campus: 'CS1', status: 'in_progress', start_date: '2026-09-02', end_date: '2026-12-27', total_sessions: 48, completed_sessions: 32, max_students: 25, current_students: 6, author_name: 'GV. Lê Minh Cường', lesson_count: 24 },
  { class_id: 'CLS002', class_code: 'ENG-A2-01', class_name: 'Tiếng Anh A2 - Lớp 01', course_name: 'Tiếng Anh A2', schedule: 'T3/T5/T7 - 09:00-11:00', campus: 'CS1', status: 'in_progress', start_date: '2026-09-03', end_date: '2026-12-28', total_sessions: 48, completed_sessions: 30, max_students: 20, current_students: 4, author_name: 'GV. Lê Minh Cường', lesson_count: 24 },
  { class_id: 'CLS003', class_code: 'IELTS-5.5-01', class_name: 'IELTS 5.5 - Lớp 01', course_name: 'IELTS 5.5', schedule: 'T2/T4/T6 - 14:00-16:00', campus: 'CS2', status: 'in_progress', start_date: '2026-09-02', end_date: '2026-12-27', total_sessions: 48, completed_sessions: 28, max_students: 18, current_students: 4, author_name: 'GV. Phạm Thị Dung', lesson_count: 32 },
  { class_id: 'CLS004', class_code: 'TOEIC-600-01', class_name: 'TOEIC 600 - Lớp 01', course_name: 'TOEIC 600', schedule: 'T3/T5 - 18:00-20:30', campus: 'CS1', status: 'in_progress', start_date: '2026-10-01', end_date: '2026-01-30', total_sessions: 36, completed_sessions: 18, max_students: 22, current_students: 3, author_name: 'GV. Lê Minh Cường', lesson_count: 18 },
  { class_id: 'CLS005', class_code: 'ENG-B1-01', class_name: 'Tiếng Anh B1 - Lớp 01', course_name: 'Tiếng Anh B1', schedule: 'T7/CN - 08:00-11:00', campus: 'CS2', status: 'upcoming', start_date: '2026-01-06', end_date: '2026-04-30', total_sessions: 36, completed_sessions: 0, max_students: 20, current_students: 0, author_name: 'GV. Phạm Thị Dung', lesson_count: 20 },
];

// === Course Lessons Data (Bài giảng trong khóa học) ===
export const courseLessonsData: CourseLesson[] = [
  // CLS003 - IELTS 5.5 - Lớp 01
  { lesson_id: 'LES001', class_id: 'CLS003', order: 1, title: 'Bài 1: Giới thiệu lộ trình IELTS & Diagnostic Assessment', duration_minutes: 45, skill_tag: 'Grammar', description: 'Định hướng mục tiêu 5.5+, tổng quan format đề thi và bài test chẩn đoán đầu khóa.', status: 'published', author_name: 'GV. Phạm Thị Dung' },
  { lesson_id: 'LES002', class_id: 'CLS003', order: 2, title: 'Bài 2: Listening Section 1: Note Completion & Numbers/Dates', duration_minutes: 60, skill_tag: 'Listening', description: 'Chiến thuật bắt từ khóa dạng điền thông tin cá nhân, ngày tháng, số điện thoại và địa chỉ.', status: 'published', author_name: 'GV. Phạm Thị Dung' },
  { lesson_id: 'LES003', class_id: 'CLS003', order: 3, title: 'Bài 3: Reading Passage 1: Skimming, Scanning & True/False/NG', duration_minutes: 60, skill_tag: 'Reading', description: 'Kỹ thuật đọc lướt, tìm kiếm bằng chứng và phân biệt False vs Not Given chuẩn xác.', status: 'published', author_name: 'GV. Phạm Thị Dung' },
  { lesson_id: 'LES004', class_id: 'CLS003', order: 4, title: 'Bài 4: Speaking Part 1: Fluency, Pronunciation & Personal Topics', duration_minutes: 45, skill_tag: 'Speaking', description: 'Mở rộng câu trả lời tự nhiên theo quy tắc A-R-E-A cho chủ đề Work/Study/Hometown.', status: 'published', author_name: 'GV. Phạm Thị Dung' },
  { lesson_id: 'LES005', class_id: 'CLS003', order: 5, title: 'Bài 5: Writing Task 1: Line Graph & Bar Chart Trend Analysis', duration_minutes: 60, skill_tag: 'Writing', description: 'Cách viết Overview ấn tượng, từ vựng mô tả xu hướng tăng/giảm và cấu trúc so sánh dữ liệu.', status: 'published', author_name: 'GV. Phạm Thị Dung' },
  { lesson_id: 'LES006', class_id: 'CLS003', order: 6, title: 'Bài 6: Listening Section 2: Multiple Choice & Map Labelling', duration_minutes: 45, skill_tag: 'Listening', description: 'Mẹo bẫy dạng trắc nghiệm 3 lựa chọn và các cụm từ định hướng trong bản đồ.', status: 'published', author_name: 'GV. Phạm Thị Dung' },
  { lesson_id: 'LES007', class_id: 'CLS003', order: 7, title: 'Bài 7: Reading Passage 2: Matching Headings & Summary Completion', duration_minutes: 60, skill_tag: 'Reading', description: 'Phương pháp chọn tiêu đề đoạn văn không bị phân tâm bởi chi tiết phụ.', status: 'published', author_name: 'GV. Phạm Thị Dung' },
  { lesson_id: 'LES008', class_id: 'CLS003', order: 8, title: 'Bài 8: Writing Task 2: Opinion Essay Structure & Idea Generation', duration_minutes: 60, skill_tag: 'Writing', description: 'Bố cục 4 đoạn chuẩn mực cho dạng bài Agree or Disagree và cách phát triển luận điểm vững chắc.', status: 'published', author_name: 'GV. Phạm Thị Dung' },

  // CLS001 - Tiếng Anh A1
  { lesson_id: 'LES101', class_id: 'CLS001', order: 1, title: 'Bài 1: Bảng chữ cái Alphabet & Nguyên âm IPA cơ bản', duration_minutes: 45, skill_tag: 'Speaking', description: 'Phát âm chuẩn 44 âm IPA tiếng Anh và đánh vần tên riêng.', status: 'published', author_name: 'GV. Lê Minh Cường' },
  { lesson_id: 'LES102', class_id: 'CLS001', order: 2, title: 'Bài 2: Danh từ số ít, số nhiều & Đại từ nhân xưng', duration_minutes: 45, skill_tag: 'Grammar', description: 'Quy tắc thêm -s/-es và cách sử dụng đại từ làm chủ ngữ/tân ngữ.', status: 'published', author_name: 'GV. Lê Minh Cường' },
  { lesson_id: 'LES103', class_id: 'CLS001', order: 3, title: 'Bài 3: Động từ To Be & Mẫu câu chào hỏi hàng ngày', duration_minutes: 45, skill_tag: 'Speaking', description: 'Thực hành hội thoại giao tiếp giới thiệu bản thân và nghề nghiệp.', status: 'published', author_name: 'GV. Lê Minh Cường' },
  { lesson_id: 'LES104', class_id: 'CLS001', order: 4, title: 'Bài 4: Thì Hiện tại đơn (Present Simple) & Tần suất', duration_minutes: 60, skill_tag: 'Grammar', description: 'Diễn tả thói quen sinh hoạt và lịch trình thường nhật.', status: 'published', author_name: 'GV. Lê Minh Cường' },

  // CLS002 - Tiếng Anh A2
  { lesson_id: 'LES201', class_id: 'CLS002', order: 1, title: 'Bài 1: Ôn tập Hiện tại đơn & Phân biệt Hiện tại tiếp diễn', duration_minutes: 45, skill_tag: 'Grammar', description: 'Dấu hiệu nhận biết và cách dùng thì tiếp diễn trong tình huống thực tế.', status: 'published', author_name: 'GV. Lê Minh Cường' },
  { lesson_id: 'LES202', class_id: 'CLS002', order: 2, title: 'Bài 2: Từ vựng Du lịch & Phương tiện giao thông', duration_minutes: 45, skill_tag: 'Vocabulary', description: 'Mở rộng 50 từ vựng chủ đề đặt phòng, sân bay và hỏi đường.', status: 'published', author_name: 'GV. Lê Minh Cường' },
  { lesson_id: 'LES203', class_id: 'CLS002', order: 3, title: 'Bài 3: Thì Quá khứ đơn (Past Simple) & Bảng động từ bất quy tắc', duration_minutes: 60, skill_tag: 'Grammar', description: 'Kể lại chuyến đi và trải nghiệm đã qua bằng tiếng Anh.', status: 'published', author_name: 'GV. Lê Minh Cường' },

  // CLS004 - TOEIC 600
  { lesson_id: 'LES401', class_id: 'CLS004', order: 1, title: 'Bài 1: Chiến thuật Part 1: Mô tả tranh ảnh người & vật', duration_minutes: 45, skill_tag: 'Listening', description: 'Phân tích các bẫy thường gặp trong tranh hành động và tĩnh vật.', status: 'published', author_name: 'GV. Lê Minh Cường' },
  { lesson_id: 'LES402', class_id: 'CLS004', order: 2, title: 'Bài 2: Chiến lược Part 2: Câu hỏi WH-Questions & Yes/No', duration_minutes: 60, skill_tag: 'Listening', description: 'Kỹ năng nghe từ để hỏi đầu câu và phản xạ câu trả lời gián tiếp.', status: 'published', author_name: 'GV. Lê Minh Cường' },
  { lesson_id: 'LES403', class_id: 'CLS004', order: 3, title: 'Bài 3: TOEIC Grammar: Trật tự từ (Word Order) & Từ loại', duration_minutes: 60, skill_tag: 'Grammar', description: 'Nhận diện nhanh danh/tính/động/trạng trong 5 giây mỗi câu Part 5.', status: 'published', author_name: 'GV. Lê Minh Cường' },
];

// === Course Vocabulary Data (Từ vựng trọng tâm trong khóa học) ===
export const courseVocabularyData: CourseVocabulary[] = [
  // CLS003 - IELTS 5.5
  { vocab_id: 'VOC001', class_id: 'CLS003', word: 'Significant', phonetic: '/sɪɡˈnɪfɪkənt/', part_of_speech: 'adjective', meaning_vi: 'Quan trọng, đáng kể, có ý nghĩa lớn', example_en: 'There was a significant increase in the number of international students.' },
  { vocab_id: 'VOC002', class_id: 'CLS003', word: 'Methodology', phonetic: '/ˌmeθəˈdɒlədʒi/', part_of_speech: 'noun', meaning_vi: 'Phương pháp luận, hệ thống phương pháp nghiên cứu', example_en: 'The research methodology was explained in detail in chapter three.' },
  { vocab_id: 'VOC003', class_id: 'CLS003', word: 'Comprehensive', phonetic: '/ˌkɒmprɪˈhensɪv/', part_of_speech: 'adjective', meaning_vi: 'Toàn diện, bao quát, đầy đủ', example_en: 'The course offers a comprehensive overview of academic writing skills.' },
  { vocab_id: 'VOC004', class_id: 'CLS003', word: 'Fluctuation', phonetic: '/ˌflʌktʃuˈeɪʃn/', part_of_speech: 'noun', meaning_vi: 'Sự biến động, sự dao động không ngừng', example_en: 'Prices experienced wild fluctuations over the summer period.' },
  { vocab_id: 'VOC005', class_id: 'CLS003', word: 'Coherence', phonetic: '/kəʊˈhɪərəns/', part_of_speech: 'noun', meaning_vi: 'Tính mạch lạc, sự gắn kết logic trong bài viết', example_en: 'Your essay demonstrates strong coherence and well-organized paragraphs.' },
  { vocab_id: 'VOC006', class_id: 'CLS003', word: 'Paraphrase', phonetic: '/ˈpærəfreɪz/', part_of_speech: 'verb/noun', meaning_vi: 'Diễn giải lại bằng từ ngữ khác mà giữ nguyên nghĩa', example_en: 'Candidates must paraphrase the essay prompt in their introduction.' },
];

// === Course Exam Samples Data (Đề thi mẫu trong khóa học) ===
export const courseExamSampleData: CourseExamSample[] = [
  // CLS003 - IELTS 5.5
  { exam_id: 'EXM001', class_id: 'CLS003', title: 'IELTS Diagnostic Mock Test 1: Listening & Reading Section 1', type: 'Đề thi chẩn đoán', duration_minutes: 45, total_questions: 20, difficulty: 'Cơ bản' },
  { exam_id: 'EXM002', class_id: 'CLS003', title: 'IELTS Mid-term Examination: 4 Skills Standard Assessment', type: 'Đề kiểm tra giữa kỳ', duration_minutes: 120, total_questions: 80, difficulty: 'Trung bình' },
  { exam_id: 'EXM003', class_id: 'CLS003', title: 'IELTS Target 5.5+ Final Certification Test', type: 'Đề thi kết thúc khóa', duration_minutes: 150, total_questions: 100, difficulty: 'Nâng cao' },

  // CLS001 - Tiếng Anh A1
  { exam_id: 'EXM101', class_id: 'CLS001', title: 'Bài kiểm tra A1 Giữa kỳ: Từ vựng & Ngữ pháp căn bản', type: 'Kiểm tra giữa kỳ', duration_minutes: 45, total_questions: 30, difficulty: 'Cơ bản' },
  { exam_id: 'EXM102', class_id: 'CLS001', title: 'Bài thi Chuẩn đầu ra Tiếng Anh A1 Toàn diện', type: 'Đề thi tốt nghiệp khóa', duration_minutes: 60, total_questions: 50, difficulty: 'Trung bình' },
];

// === Enrollments ===
export const enrollmentData: Enrollment[] = [
  // CLS_NN01 - IELTS Foundation 5.5 (Giáo trình mẫu)
  { enrollment_id: 'ENR_NN01', student_id: 'SV_NN', class_id: 'CLS_NN01', start_date: '2026-11-01', end_date: '2027-02-28', status: 'active' },
  { enrollment_id: 'ENR_NN02', student_id: 'SV001', class_id: 'CLS_NN01', start_date: '2026-11-01', end_date: '2027-02-28', status: 'active' },
  { enrollment_id: 'ENR_NN03', student_id: 'SV002', class_id: 'CLS_NN01', start_date: '2026-11-01', end_date: '2027-02-28', status: 'active' },
  { enrollment_id: 'ENR_NN04', student_id: 'SV005', class_id: 'CLS_NN01', start_date: '2026-11-01', end_date: '2027-02-28', status: 'active' },
  // CLS001 - Tiếng Anh A1
  { enrollment_id: 'ENR001', student_id: 'SV001', class_id: 'CLS001', start_date: '2026-09-02', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR002', student_id: 'SV002', class_id: 'CLS001', start_date: '2026-09-02', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR003', student_id: 'SV003', class_id: 'CLS001', start_date: '2026-09-02', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR004', student_id: 'SV004', class_id: 'CLS001', start_date: '2026-09-15', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR005', student_id: 'SV005', class_id: 'CLS001', start_date: '2026-09-15', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR006', student_id: 'SV011', class_id: 'CLS001', start_date: '2026-09-02', end_date: '2026-12-27', status: 'active' },
  // CLS002 - Tiếng Anh A2
  { enrollment_id: 'ENR007', student_id: 'SV001', class_id: 'CLS002', start_date: '2026-09-03', end_date: '2026-12-28', status: 'active' },
  { enrollment_id: 'ENR008', student_id: 'SV009', class_id: 'CLS002', start_date: '2026-10-01', end_date: '2026-12-28', status: 'active' },
  { enrollment_id: 'ENR009', student_id: 'SV011', class_id: 'CLS002', start_date: '2026-09-03', end_date: '2026-12-28', status: 'active' },
  { enrollment_id: 'ENR020', student_id: 'SV002', class_id: 'CLS002', start_date: '2026-09-03', end_date: '2026-12-28', status: 'active' },
  // CLS003 - IELTS 5.5
  { enrollment_id: 'ENR010', student_id: 'SV006', class_id: 'CLS003', start_date: '2026-09-02', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR011', student_id: 'SV007', class_id: 'CLS003', start_date: '2026-09-02', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR012', student_id: 'SV008', class_id: 'CLS003', start_date: '2026-09-15', end_date: '2026-12-27', status: 'active' },
  { enrollment_id: 'ENR013', student_id: 'SV010', class_id: 'CLS003', start_date: '2026-10-01', end_date: '2026-12-27', status: 'active' },
  // CLS004 - TOEIC 600
  { enrollment_id: 'ENR014', student_id: 'SV005', class_id: 'CLS004', start_date: '2026-10-01', end_date: '2026-01-30', status: 'active' },
  { enrollment_id: 'ENR015', student_id: 'SV009', class_id: 'CLS004', start_date: '2026-10-01', end_date: '2026-01-30', status: 'active' },
  { enrollment_id: 'ENR016', student_id: 'SV003', class_id: 'CLS004', start_date: '2026-10-01', end_date: '2026-01-30', status: 'active' },
];

// === Class Assignments ===
export const classAssignmentData: ClassAssignment[] = [
  { assignment_id: 'CA_NN01', class_id: 'CLS_NN01', teacher_id: 'STF003', teaching_assistant_id: 'STF005', start_date: '2026-11-01', end_date: '2027-02-28' },
  { assignment_id: 'CA001', class_id: 'CLS001', teacher_id: 'STF003', teaching_assistant_id: 'STF005', start_date: '2026-09-02', end_date: '2026-12-27' },
  { assignment_id: 'CA002', class_id: 'CLS002', teacher_id: 'STF003', teaching_assistant_id: 'STF006', start_date: '2026-09-03', end_date: '2026-12-28' },
  { assignment_id: 'CA003', class_id: 'CLS003', teacher_id: 'STF004', teaching_assistant_id: 'STF006', start_date: '2026-09-02', end_date: '2026-12-27' },
  { assignment_id: 'CA004', class_id: 'CLS004', teacher_id: 'STF003', teaching_assistant_id: 'STF005', start_date: '2026-10-01', end_date: '2026-01-30' },
  { assignment_id: 'CA005', class_id: 'CLS005', teacher_id: 'STF004', teaching_assistant_id: 'STF006', start_date: '2027-01-06', end_date: '2027-04-30' },
];

// === Sessions ===
const WEEKDAY_MAP: Record<string, number> = {
  CN: 0,
  T2: 1,
  T3: 2,
  T4: 3,
  T5: 4,
  T6: 5,
  T7: 6,
};

function generateSessions(
  classId: string,
  totalSessions: number,
  completedSessions: number,
  startDate: string,
  teacherId = 'STF003',
  teacherName = 'Lê Minh Cường',
  startTime = '18:00',
  endTime = '20:00',
  room = 'Phòng 101 - CS1'
): Session[] {
  const sessions: Session[] = [];
  const start = new Date(startDate);
  for (let i = 1; i <= totalSessions; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + (i - 1) * 2);
    sessions.push({
      session_id: `${classId}-S${String(i).padStart(2, '0')}`,
      class_id: classId,
      session_number: i,
      date: date.toISOString().split('T')[0],
      start_time: startTime,
      end_time: endTime,
      topic: `Buổi ${i}`,
      is_completed: i <= completedSessions,
      teacher_id: teacherId,
      teacher_name: teacherName,
      room,
    });
  }
  return sessions;
}

export const sessionData: Session[] = [
  // Lớp IELTS Foundation 5.5 — Giáo trình mẫu (Lê Minh Cường)
  {
    session_id: 'SES_NN01',
    class_id: 'CLS_NN01',
    session_number: 1,
    date: '2026-11-19',
    start_time: '19:12',
    end_time: '22:12',
    topic: 'Buổi 1: Giới thiệu & Định hướng IELTS',
    is_completed: true,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 204 - CS1',
  },
  {
    session_id: 'SES_NN02',
    class_id: 'CLS_NN01',
    session_number: 2,
    date: '2026-11-23',
    start_time: '19:12',
    end_time: '22:12',
    topic: 'Buổi 2: Listening & Speaking Fundamentals',
    is_completed: false,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 204 - CS1',
  },
  {
    session_id: 'SES_NN03',
    class_id: 'CLS_NN01',
    session_number: 3,
    date: '2026-11-25',
    start_time: '19:12',
    end_time: '22:12',
    topic: 'Buổi 3: Reading Passage 1 Strategies',
    is_completed: false,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 204 - CS1',
  },
  {
    session_id: 'SES_NN04',
    class_id: 'CLS_NN01',
    session_number: 4,
    date: '2026-11-27',
    start_time: '19:12',
    end_time: '22:12',
    topic: 'Buổi 4: Writing Task 1 Overview',
    is_completed: false,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 204 - CS1',
  },
  // Lớp English Communication (Lê Minh Cường)
  {
    session_id: 'SES_COMM01',
    class_id: 'CLS_COMM_01',
    session_number: 1,
    date: '2026-11-17',
    start_time: '18:30',
    end_time: '20:30',
    topic: 'Buổi 1: Pronunciation & Small Talk',
    is_completed: true,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 102 - CS1',
  },
  {
    session_id: 'SES_COMM02',
    class_id: 'CLS_COMM_01',
    session_number: 2,
    date: '2026-11-19',
    start_time: '18:30',
    end_time: '20:30',
    topic: 'Buổi 2: Daily Conversation Scenarios',
    is_completed: true,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 102 - CS1',
  },
  {
    session_id: 'SES_COMM03',
    class_id: 'CLS_COMM_01',
    session_number: 3,
    date: '2026-11-24',
    start_time: '18:30',
    end_time: '20:30',
    topic: 'Buổi 3: Presentation Skills in English',
    is_completed: false,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 102 - CS1',
  },
  {
    session_id: 'SES_COMM04',
    class_id: 'CLS_COMM_01',
    session_number: 4,
    date: '2026-11-26',
    start_time: '18:30',
    end_time: '20:30',
    topic: 'Buổi 4: Debate & Argumentation',
    is_completed: false,
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    room: 'Phòng 102 - CS1',
  },
  // Lớp IELTS 5.5 - Lớp 01 (Phạm Thị Dung)
  ...generateSessions('CLS003', 48, 28, '2026-09-02', 'STF004', 'Phạm Thị Dung', '14:00', '16:00', 'Phòng 201 - CS2'),
  // Lớp Tiếng Anh A1 (Lê Minh Cường)
  ...generateSessions('CLS001', 48, 32, '2026-09-02', 'STF003', 'Lê Minh Cường', '18:00', '20:00', 'Phòng 101 - CS1'),
  // Lớp Tiếng Anh A2 (Lê Minh Cường)
  ...generateSessions('CLS002', 48, 30, '2026-09-03', 'STF003', 'Lê Minh Cường', '09:00', '11:00', 'Phòng 102 - CS1'),
  // Lớp TOEIC 600 (Lê Minh Cường)
  ...generateSessions('CLS004', 36, 18, '2026-10-01', 'STF003', 'Lê Minh Cường', '18:00', '20:30', 'Phòng 103 - CS1'),
];

export function generateSessionsForClass(classItem: CenterClassItem): Session[] {
  if (classItem.class_type === 'self_study') {
    return [];
  }

  const sessions: Session[] = [];
  const daysArr = classItem.days_of_week
    ? classItem.days_of_week.split(',').map(s => s.trim()).filter(Boolean)
    : ['T2', 'T4', 'T6'];

  const targetDayIndices = daysArr.map(d => WEEKDAY_MAP[d]).filter(d => d !== undefined);
  if (targetDayIndices.length === 0) return [];

  const start = new Date(classItem.start_date || '2026-11-01');
  const total = classItem.total_sessions || 24;
  let count = 0;

  let startTime = '19:12';
  let endTime = '22:12';
  if (classItem.schedule && classItem.schedule.includes('-')) {
    const timePart = classItem.schedule.split('-')[1]?.trim();
    if (timePart && timePart.includes('-')) {
      const parts = timePart.split('-');
      startTime = parts[0].trim();
      endTime = parts[1].trim();
    }
  }

  for (let d = 0; d < 365 && count < total; d++) {
    const checkDate = new Date(start);
    checkDate.setDate(start.getDate() + d);
    const dayOfWeek = checkDate.getDay();

    if (targetDayIndices.includes(dayOfWeek)) {
      count++;
      const dateIso = checkDate.toISOString().split('T')[0];
      const sess: Session = {
        session_id: `${classItem.class_id}-S${String(count).padStart(2, '0')}`,
        class_id: classItem.class_id,
        session_number: count,
        date: dateIso,
        start_time: startTime,
        end_time: endTime,
        topic: `Buổi ${count}`,
        is_completed: false,
        teacher_id: classItem.teacher_id || 'STF003',
        teacher_name: classItem.teacher_name || 'Lê Minh Cường',
        room: classItem.campus === 'CS2' ? 'Phòng 201 - CS2' : 'Phòng 204 - CS1',
      };
      sessions.push(sess);
    }
  }

  // Upsert into sessionData
  sessions.forEach(s => {
    const exists = sessionData.findIndex(ex => ex.session_id === s.session_id || (ex.class_id === s.class_id && ex.date === s.date));
    if (exists >= 0) {
      sessionData[exists] = s;
    } else {
      sessionData.push(s);
    }
  });

  return sessions;
}

export function updateClassTeacherInSessions(classId: string, newTeacherId: string, newTeacherName: string) {
  sessionData.forEach(s => {
    if (s.class_id === classId) {
      s.teacher_id = newTeacherId;
      s.teacher_name = newTeacherName;
    }
  });
}

export function assignSubstituteTeacher(
  sessionId: string,
  substituteTeacherId?: string,
  substituteTeacherName?: string,
  reason?: string
) {
  const session = sessionData.find(s => s.session_id === sessionId);
  if (!session) return false;

  if (substituteTeacherId) {
    session.substitute_teacher_id = substituteTeacherId;
    session.substitute_teacher_name = substituteTeacherName;
    session.substitute_reason = reason;
  } else {
    delete session.substitute_teacher_id;
    delete session.substitute_teacher_name;
    delete session.substitute_reason;
  }
  return true;
}

// === Teacher Invites ===
export const teacherInviteData: TeacherInvite[] = [
  {
    invite_id: 'INV001',
    email: 'teacher.invite@edutrack.vn',
    token: 'PL8942A9B3C',
    invite_link: 'https://edutrack.vn/vao-trung-tam?token=PL8942A9B3C',
    created_at: '2026-11-19T10:00:00',
    status: 'pending',
  },
];

// === English Course Catalog (Các khóa học mẫu) ===
export const courseCatalogData: CourseCatalogItem[] = [
  { course_id: 'CRS_IELTS_FND', course_name: 'IELTS Foundation 5.5 — Giáo trình mẫu', units_count: 15 },
  { course_id: 'CRS_IELTS_INT', course_name: 'IELTS Intensive 6.5+', units_count: 20 },
  { course_id: 'CRS_TOEIC_650', course_name: 'TOEIC 4 Kỹ năng 650+', units_count: 16 },
  { course_id: 'CRS_ENG_COMM', course_name: 'English Communication', units_count: 12 },
];

// === Center Classes Data (Lớp của trung tâm) ===
export const centerClassData: CenterClassItem[] = [
  {
    class_id: 'CLS_IELTS_FND',
    class_code: 'Y739FJ',
    class_name: 'IELTS Foundation 5.5 — Lớp Tối T2/T4/T6',
    course_name: 'IELTS Foundation (Band 4.5 - 5.5)',
    schedule: 'T2,T4,T6 - 19:12-22:12',
    campus: 'CS1',
    status: 'in_progress',
    start_date: '2026-11-19',
    end_date: '2027-01-13',
    total_sessions: 15,
    completed_sessions: 1,
    max_students: 20,
    current_students: 16,
    class_type: 'regular',
    avg_score: '8.6',
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    days_of_week: 'T2,T4,T6',
    rules_content: 'Đi học đầy đủ (≥85% buổi), không nghỉ quá 3 buổi liên tục.\nNghỉ học phải báo trước ≥1 ngày.\nHoàn thành 100% bài tập được giao đúng hạn.\nHạn chế dùng điện thoại trong giờ học.',
    show_rules_to_students: true,
  },
  {
    class_id: 'CLS_COMM_01',
    class_code: 'COMM82',
    class_name: 'English Communication — Luyện phản xạ & Pronunciation',
    course_name: 'English Communication',
    schedule: 'T3,T5 - 18:30-20:30',
    campus: 'CS1',
    status: 'in_progress',
    start_date: '2026-11-15',
    total_sessions: 16,
    completed_sessions: 2,
    max_students: 12,
    current_students: 10,
    class_type: 'communication',
    avg_score: '8.8',
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    days_of_week: 'T3,T5',
    rules_content: 'Cố gắng đi học đều; báo trước khi nghỉ.\nHoàn thành bài tập trong tuần.',
    show_rules_to_students: true,
  },
  {
    class_id: 'CLS_SELF_01',
    class_code: 'SELF91',
    class_name: 'TOEIC 4 Kỹ năng 650+ — Tự học có định hướng',
    course_name: 'TOEIC 4 Kỹ năng 650+',
    schedule: 'Mở bài thứ 2 hàng tuần',
    campus: 'CS1',
    status: 'in_progress',
    start_date: '2026-11-10',
    total_sessions: 16,
    completed_sessions: 4,
    max_students: 30,
    current_students: 22,
    class_type: 'self_study',
    avg_score: '8.2',
    teacher_id: 'STF003',
    teacher_name: 'Lê Minh Cường',
    days_of_week: 'T2',
    rules_content: 'Hoàn thành 100% bài tập được giao đúng hạn.',
    show_rules_to_students: true,
  },
  {
    class_id: 'CLS_TRIAL_01',
    class_code: 'TR8821',
    class_name: 'IELTS Intensive 6.5+ — Lớp học thử cuối tuần',
    course_name: 'IELTS Intensive 6.5+',
    schedule: 'T7,CN - 09:00-11:00',
    campus: 'CS1',
    status: 'in_progress',
    start_date: '2026-11-21',
    total_sessions: 3,
    completed_sessions: 1,
    max_students: 15,
    current_students: 12,
    class_type: 'trial',
    avg_score: '8.5',
    teacher_id: 'STF004',
    teacher_name: 'Phạm Thị Dung',
    days_of_week: 'T7,CN',
    rules_content: 'Đi học đúng giờ và tích cực tương tác trong lớp.',
    show_rules_to_students: false,
  },
  {
    class_id: 'CLS_B1_01',
    class_code: 'B18832',
    class_name: 'Tiếng Anh B1 — Giao tiếp & Ngữ pháp nâng cao',
    course_name: 'Tiếng Anh B1 Intermediate',
    schedule: 'T7,CN - 14:00-16:00',
    campus: 'CS2',
    status: 'in_progress',
    start_date: '2026-11-05',
    total_sessions: 24,
    completed_sessions: 6,
    max_students: 18,
    current_students: 14,
    class_type: 'regular',
    avg_score: '8.5',
    teacher_id: 'STF004',
    teacher_name: 'Phạm Thị Dung',
    days_of_week: 'T7,CN',
    rules_content: 'Đi học đúng giờ và nộp bài tập trước 22h thứ Sáu.',
    show_rules_to_students: true,
  },
];

// === Attendance ===
function generateAttendance(studentId: string, classId: string, sessions: Session[]): Attendance[] {
  const records: Attendance[] = [];
  const completedSessions = sessions.filter(s => s.is_completed && s.class_id === classId);
  
  // Different attendance patterns per student
  const patterns: Record<string, number> = {
    'SV001': 0.95, 'SV002': 0.88, 'SV003': 0.75,
    'SV004': 0.92, 'SV005': 0.65, 'SV006': 0.90,
    'SV007': 0.97, 'SV008': 0.82, 'SV009': 0.70,
    'SV010': 0.85, 'SV011': 0.93, 'SV012': 0.60,
  };
  
  const rate = patterns[studentId] || 0.85;
  
  completedSessions.forEach((session, idx) => {
    const rand = Math.sin(idx * 1000 + parseInt(studentId.replace('SV', '')) * 100) * 0.5 + 0.5;
    let status: Attendance['status'];
    if (rand < rate * 0.9) status = 'present';
    else if (rand < rate) status = 'late';
    else if (rand < rate + 0.03) status = 'excused';
    else status = 'absent';
    
    records.push({
      attendance_id: `ATT-${studentId}-${session.session_id}`,
      student_id: studentId,
      class_id: classId,
      session_id: session.session_id,
      status,
      recorded_at: `${session.date}T20:05:00`,
      recorded_by: 'STF005',
    });
  });
  
  return records;
}

export const attendanceData: Attendance[] = [
  ...generateAttendance('SV001', 'CLS001', sessionData),
  ...generateAttendance('SV002', 'CLS001', sessionData),
  ...generateAttendance('SV003', 'CLS001', sessionData),
  ...generateAttendance('SV004', 'CLS001', sessionData),
  ...generateAttendance('SV005', 'CLS001', sessionData),
  ...generateAttendance('SV011', 'CLS001', sessionData),
  ...generateAttendance('SV001', 'CLS002', sessionData),
  ...generateAttendance('SV009', 'CLS002', sessionData),
  ...generateAttendance('SV011', 'CLS002', sessionData),
  ...generateAttendance('SV002', 'CLS002', sessionData),
  ...generateAttendance('SV006', 'CLS003', sessionData),
  ...generateAttendance('SV007', 'CLS003', sessionData),
  ...generateAttendance('SV008', 'CLS003', sessionData),
  ...generateAttendance('SV010', 'CLS003', sessionData),
  ...generateAttendance('SV005', 'CLS004', sessionData),
  ...generateAttendance('SV009', 'CLS004', sessionData),
  ...generateAttendance('SV003', 'CLS004', sessionData),
];

// === Assessments ===
export const assessmentData: Assessment[] = [
  { assessment_id: 'ASM001', class_id: 'CLS001', title: 'Kiểm tra giữa kỳ 1', type: 'midterm', max_score: 100, weight: 30, date: '2026-10-15', description: 'Kiểm tra nghe, đọc, viết' },
  { assessment_id: 'ASM002', class_id: 'CLS001', title: 'Kiểm tra giữa kỳ 2', type: 'midterm', max_score: 100, weight: 30, date: '2026-11-15', description: 'Kiểm tra tổng hợp kỹ năng' },
  { assessment_id: 'ASM003', class_id: 'CLS001', title: 'Kiểm tra cuối kỳ', type: 'final', max_score: 100, weight: 40, date: '2026-12-20' },
  { assessment_id: 'ASM004', class_id: 'CLS002', title: 'Kiểm tra giữa kỳ 1', type: 'midterm', max_score: 100, weight: 30, date: '2026-10-18' },
  { assessment_id: 'ASM005', class_id: 'CLS002', title: 'Kiểm tra giữa kỳ 2', type: 'midterm', max_score: 100, weight: 30, date: '2026-11-20' },
  { assessment_id: 'ASM006', class_id: 'CLS003', title: 'Mock Test 1', type: 'midterm', max_score: 9, date: '2026-10-14' },
  { assessment_id: 'ASM007', class_id: 'CLS003', title: 'Mock Test 2', type: 'midterm', max_score: 9, date: '2026-11-11' },
  { assessment_id: 'ASM008', class_id: 'CLS004', title: 'Mini Test 1', type: 'quiz', max_score: 990, date: '2026-11-01' },
  { assessment_id: 'ASM009', class_id: 'CLS004', title: 'Mini Test 2', type: 'quiz', max_score: 990, date: '2026-12-01' },
];

// === Assessment Results ===
export const assessmentResultData: AssessmentResult[] = [
  // CLS001 - Midterm 1
  { result_id: 'AR001', student_id: 'SV001', assessment_id: 'ASM001', score: 82, entered_by: 'STF003', entered_at: '2026-10-16T10:00:00' },
  { result_id: 'AR002', student_id: 'SV002', assessment_id: 'ASM001', score: 75, entered_by: 'STF003', entered_at: '2026-10-16T10:00:00' },
  { result_id: 'AR003', student_id: 'SV003', assessment_id: 'ASM001', score: 58, entered_by: 'STF003', entered_at: '2026-10-16T10:00:00' },
  { result_id: 'AR004', student_id: 'SV004', assessment_id: 'ASM001', score: 88, entered_by: 'STF003', entered_at: '2026-10-16T10:00:00' },
  { result_id: 'AR005', student_id: 'SV005', assessment_id: 'ASM001', score: 45, entered_by: 'STF003', entered_at: '2026-10-16T10:00:00' },
  { result_id: 'AR006', student_id: 'SV011', assessment_id: 'ASM001', score: 91, entered_by: 'STF003', entered_at: '2026-10-16T10:00:00' },
  // CLS001 - Midterm 2
  { result_id: 'AR007', student_id: 'SV001', assessment_id: 'ASM002', score: 85, entered_by: 'STF003', entered_at: '2026-11-16T10:00:00' },
  { result_id: 'AR008', student_id: 'SV002', assessment_id: 'ASM002', score: 70, entered_by: 'STF003', entered_at: '2026-11-16T10:00:00' },
  { result_id: 'AR009', student_id: 'SV003', assessment_id: 'ASM002', score: 52, entered_by: 'STF003', entered_at: '2026-11-16T10:00:00' },
  { result_id: 'AR010', student_id: 'SV004', assessment_id: 'ASM002', score: 90, entered_by: 'STF003', entered_at: '2026-11-16T10:00:00' },
  { result_id: 'AR011', student_id: 'SV005', assessment_id: 'ASM002', score: 38, entered_by: 'STF003', entered_at: '2026-11-16T10:00:00' },
  { result_id: 'AR012', student_id: 'SV011', assessment_id: 'ASM002', score: 88, entered_by: 'STF003', entered_at: '2026-11-16T10:00:00' },
  // CLS002 - Midterm 1
  { result_id: 'AR013', student_id: 'SV001', assessment_id: 'ASM004', score: 78, entered_by: 'STF003', entered_at: '2026-10-19T10:00:00' },
  { result_id: 'AR014', student_id: 'SV009', assessment_id: 'ASM004', score: 62, entered_by: 'STF003', entered_at: '2026-10-19T10:00:00' },
  { result_id: 'AR015', student_id: 'SV011', assessment_id: 'ASM004', score: 85, entered_by: 'STF003', entered_at: '2026-10-19T10:00:00' },
  { result_id: 'AR021', student_id: 'SV002', assessment_id: 'ASM004', score: 72, entered_by: 'STF003', entered_at: '2026-10-19T10:00:00' },
  // CLS003 - Mock Test 1
  { result_id: 'AR016', student_id: 'SV006', assessment_id: 'ASM006', score: 5.5, entered_by: 'STF004', entered_at: '2026-10-15T10:00:00' },
  { result_id: 'AR017', student_id: 'SV007', assessment_id: 'ASM006', score: 6.0, entered_by: 'STF004', entered_at: '2026-10-15T10:00:00' },
  { result_id: 'AR018', student_id: 'SV008', assessment_id: 'ASM006', score: 4.5, entered_by: 'STF004', entered_at: '2026-10-15T10:00:00' },
  { result_id: 'AR019', student_id: 'SV010', assessment_id: 'ASM006', score: 5.0, entered_by: 'STF004', entered_at: '2026-10-15T10:00:00' },
  // CLS004 - Mini Test 1
  { result_id: 'AR020', student_id: 'SV005', assessment_id: 'ASM008', score: 420, entered_by: 'STF003', entered_at: '2026-11-02T10:00:00' },
];

// === Quizzes ===
export const quizData: Quiz[] = [
  { quiz_id: 'QZ001', class_id: 'CLS001', title: 'Quiz Vocabulary Unit 1-4', total_questions: 20, max_score: 100, due_date: '2026-09-30', topic: 'Vocabulary' },
  { quiz_id: 'QZ002', class_id: 'CLS001', title: 'Quiz Grammar Unit 1-4', total_questions: 25, max_score: 100, due_date: '2026-10-07', topic: 'Grammar' },
  { quiz_id: 'QZ003', class_id: 'CLS001', title: 'Quiz Vocabulary Unit 5-8', total_questions: 20, max_score: 100, due_date: '2026-10-31', topic: 'Vocabulary' },
  { quiz_id: 'QZ004', class_id: 'CLS001', title: 'Quiz Grammar Unit 5-8', total_questions: 25, max_score: 100, due_date: '2026-11-07', topic: 'Grammar' },
  { quiz_id: 'QZ005', class_id: 'CLS002', title: 'Quiz Listening Practice 1', total_questions: 30, max_score: 100, due_date: '2026-10-10', topic: 'Listening' },
  { quiz_id: 'QZ006', class_id: 'CLS002', title: 'Quiz Reading Practice 1', total_questions: 25, max_score: 100, due_date: '2026-10-20', topic: 'Reading' },
  { quiz_id: 'QZ007', class_id: 'CLS003', title: 'IELTS Listening Practice 1', total_questions: 40, max_score: 40, due_date: '2026-10-07', topic: 'Listening' },
  { quiz_id: 'QZ008', class_id: 'CLS003', title: 'IELTS Reading Practice 1', total_questions: 40, max_score: 40, due_date: '2026-10-14', topic: 'Reading' },
  { quiz_id: 'QZ009', class_id: 'CLS004', title: 'TOEIC Part 5 Practice 1', total_questions: 30, max_score: 100, due_date: '2026-10-20', topic: 'Grammar' },
];

// === Quiz Attempts ===
export const quizAttemptData: QuizAttempt[] = [
  // CLS001 Quizzes
  { attempt_id: 'QA001', student_id: 'SV001', quiz_id: 'QZ001', score: 85, correct_answers: 17, total_questions: 20, time_spent_minutes: 12, status: 'submitted', submitted_at: '2026-09-28T15:30:00' },
  { attempt_id: 'QA002', student_id: 'SV002', quiz_id: 'QZ001', score: 75, correct_answers: 15, total_questions: 20, time_spent_minutes: 15, status: 'submitted', submitted_at: '2026-09-29T10:00:00' },
  { attempt_id: 'QA003', student_id: 'SV003', quiz_id: 'QZ001', score: 55, correct_answers: 11, total_questions: 20, time_spent_minutes: 18, status: 'submitted', submitted_at: '2026-09-30T23:50:00' },
  { attempt_id: 'QA004', student_id: 'SV004', quiz_id: 'QZ001', score: 90, correct_answers: 18, total_questions: 20, time_spent_minutes: 10, status: 'submitted', submitted_at: '2026-09-27T09:00:00' },
  { attempt_id: 'QA005', student_id: 'SV005', quiz_id: 'QZ001', score: null, correct_answers: 0, total_questions: 20, time_spent_minutes: 0, status: 'not_started' },
  { attempt_id: 'QA006', student_id: 'SV011', quiz_id: 'QZ001', score: 95, correct_answers: 19, total_questions: 20, time_spent_minutes: 8, status: 'submitted', submitted_at: '2026-09-26T14:00:00' },
  // QZ002
  { attempt_id: 'QA007', student_id: 'SV001', quiz_id: 'QZ002', score: 80, correct_answers: 20, total_questions: 25, time_spent_minutes: 15, status: 'submitted', submitted_at: '2026-10-05T16:00:00' },
  { attempt_id: 'QA008', student_id: 'SV002', quiz_id: 'QZ002', score: 68, correct_answers: 17, total_questions: 25, time_spent_minutes: 20, status: 'submitted', submitted_at: '2026-10-06T11:00:00' },
  { attempt_id: 'QA009', student_id: 'SV003', quiz_id: 'QZ002', score: 48, correct_answers: 12, total_questions: 25, time_spent_minutes: 22, status: 'submitted', submitted_at: '2026-10-07T23:55:00' },
  { attempt_id: 'QA010', student_id: 'SV005', quiz_id: 'QZ002', score: 36, correct_answers: 9, total_questions: 25, time_spent_minutes: 25, status: 'submitted', submitted_at: '2026-10-07T23:58:00' },
  // QZ003
  { attempt_id: 'QA011', student_id: 'SV001', quiz_id: 'QZ003', score: 90, correct_answers: 18, total_questions: 20, time_spent_minutes: 11, status: 'submitted', submitted_at: '2026-10-29T14:00:00' },
  { attempt_id: 'QA012', student_id: 'SV002', quiz_id: 'QZ003', score: 70, correct_answers: 14, total_questions: 20, time_spent_minutes: 16, status: 'submitted', submitted_at: '2026-10-30T10:00:00' },
  { attempt_id: 'QA013', student_id: 'SV003', quiz_id: 'QZ003', score: null, correct_answers: 0, total_questions: 20, time_spent_minutes: 0, status: 'not_started' },
  { attempt_id: 'QA014', student_id: 'SV005', quiz_id: 'QZ003', score: null, correct_answers: 0, total_questions: 20, time_spent_minutes: 0, status: 'not_started' },
  // IELTS quizzes
  { attempt_id: 'QA015', student_id: 'SV006', quiz_id: 'QZ007', score: 28, correct_answers: 28, total_questions: 40, time_spent_minutes: 30, status: 'submitted', submitted_at: '2026-10-06T15:00:00' },
  { attempt_id: 'QA016', student_id: 'SV007', quiz_id: 'QZ007', score: 32, correct_answers: 32, total_questions: 40, time_spent_minutes: 28, status: 'submitted', submitted_at: '2026-10-05T10:00:00' },
  { attempt_id: 'QA017', student_id: 'SV008', quiz_id: 'QZ007', score: 22, correct_answers: 22, total_questions: 40, time_spent_minutes: 30, status: 'submitted', submitted_at: '2026-10-07T22:00:00' },
];

// === Support Tickets ===
export const ticketData: SupportTicket[] = [
  {
    ticket_id: 'TK001', ticket_code: 'SUP-2026-001', student_id: 'SV003', class_id: 'CLS001',
    category: 'lesson', title: 'Không hiểu bài Grammar Unit 5',
    description: 'Em không hiểu phần Past Perfect Continuous. Giảng viên giảng nhanh quá em không theo kịp. Em muốn được giải thích lại.',
    priority: 'medium', status: 'in_progress', assigned_to: 'STF005',
    created_at: '2026-11-05T14:30:00', first_response_at: '2026-11-05T16:00:00',
    sla_deadline: '2026-11-06T02:30:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK002', ticket_code: 'SUP-2026-002', student_id: 'SV005', class_id: 'CLS001',
    category: 'attendance', title: 'Xin phép nghỉ học 2 buổi',
    description: 'Em có việc gia đình cần nghỉ ngày 11/11 và 13/11. Em muốn hỏi có cách nào học bù không?',
    priority: 'low', status: 'resolved', assigned_to: 'STF005',
    created_at: '2026-11-08T09:00:00', first_response_at: '2026-11-08T10:30:00',
    resolved_at: '2026-11-08T11:00:00',
    sla_deadline: '2026-11-08T21:00:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK003', ticket_code: 'SUP-2026-003', student_id: 'SV005', class_id: 'CLS001',
    category: 'score', title: 'Thắc mắc về điểm kiểm tra giữa kỳ 2',
    description: 'Em thấy điểm giữa kỳ 2 của em chỉ 38 điểm, em muốn xem lại bài kiểm tra vì em nghĩ mình làm đúng nhiều hơn.',
    priority: 'high', status: 'escalated', assigned_to: 'STF003',
    created_at: '2026-11-18T08:00:00', first_response_at: '2026-11-18T09:30:00',
    escalated_at: '2026-11-18T10:00:00', escalated_by: 'STF005',
    escalation_reason: 'Cần giảng viên xem xét lại bài kiểm tra và xác nhận điểm.',
    sla_deadline: '2026-11-18T20:00:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK004', ticket_code: 'SUP-2026-004', student_id: 'SV008', class_id: 'CLS003',
    category: 'assignment', title: 'Không nộp được bài Writing Task 2',
    description: 'Hệ thống báo lỗi khi em upload file bài writing. Em đã thử nhiều lần mà không được.',
    priority: 'high', status: 'new', assigned_to: 'STF006',
    created_at: '2026-11-20T16:00:00',
    sla_deadline: '2026-11-21T04:00:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK005', ticket_code: 'SUP-2026-005', student_id: 'SV009', class_id: 'CLS004',
    category: 'schedule', title: 'Đổi lịch học sang lớp khác',
    description: 'Em đổi lịch làm việc nên không thể học T3/T5 được nữa. Em muốn chuyển sang lớp T7/CN nếu có.',
    priority: 'medium', status: 'waiting_student', assigned_to: 'STF005',
    created_at: '2026-11-15T10:00:00', first_response_at: '2026-11-15T11:30:00',
    sla_deadline: '2026-11-15T22:00:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK006', ticket_code: 'SUP-2026-006', student_id: 'SV001', class_id: 'CLS001',
    category: 'lesson', title: 'Xin tài liệu bổ sung về Listening & Speaking',
    description: 'Em muốn luyện thêm kỹ năng nghe và phát âm. Thầy cô có thể gợi ý thêm tài liệu ôn tập không?',
    priority: 'low', status: 'resolved', assigned_to: 'STF005',
    created_at: '2026-10-20T09:00:00', first_response_at: '2026-10-20T10:00:00',
    resolved_at: '2026-10-20T14:00:00',
    sla_deadline: '2026-10-20T21:00:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK007', ticket_code: 'SUP-2026-007', student_id: 'SV001', class_id: 'CLS001',
    category: 'attendance', title: 'Đơn xin nghỉ học có phép & Đăng ký học bù Buổi 12',
    description: 'Em xin phép nghỉ buổi học số 12 (ngày 14/11) do trùng lịch thi tin học trường ĐH. Em xin đăng ký học bù vào ca tối Thứ 6 tuần này.',
    priority: 'medium', status: 'resolved', assigned_to: 'STF005',
    created_at: '2026-11-10T08:00:00', first_response_at: '2026-11-10T09:15:00',
    resolved_at: '2026-11-10T11:00:00',
    sla_deadline: '2026-11-10T20:00:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK008', ticket_code: 'SUP-2026-008', student_id: 'SV002', class_id: 'CLS_NN01',
    category: 'assignment', title: 'Thắc mắc bài tập Speaking Unit 2 & Ghi âm Audio',
    description: 'Em đã nộp file ghi âm Speaking Unit 2. Thầy Cường kiểm tra giúp em phần ngữ điệu và phát âm âm đuôi với ạ!',
    priority: 'medium', status: 'in_progress', assigned_to: 'STF003',
    created_at: '2026-11-19T20:30:00', first_response_at: '2026-11-20T08:15:00',
    sla_deadline: '2026-11-20T20:30:00', is_sla_breached: false,
  },
  {
    ticket_id: 'TK009', ticket_code: 'SUP-2026-009', student_id: 'SV_NN', class_id: 'CLS_NN01',
    category: 'lesson', title: 'Tài liệu mở rộng collocations chủ đề Daily Routines',
    description: 'Em muốn xin thêm danh sách collocations nâng cao cho bài viết Writing Task 1 miêu tả thói quen sinh hoạt hàng ngày.',
    priority: 'low', status: 'resolved', assigned_to: 'STF003',
    created_at: '2026-11-20T10:00:00', first_response_at: '2026-11-20T10:45:00',
    resolved_at: '2026-11-20T14:00:00',
    sla_deadline: '2026-11-21T10:00:00', is_sla_breached: false,
  },
];

// === Support Messages ===
export const messageData: SupportMessage[] = [
  // TK001 messages
  { message_id: 'MSG001', ticket_id: 'TK001', sender_id: 'SV003', sender_name: 'Lê Quang Huy', sender_role: 'student', content: 'Em không hiểu phần Past Perfect Continuous. Giảng viên giảng nhanh quá em không theo kịp. Em muốn được giải thích lại.', sent_at: '2026-11-05T14:30:00', is_internal_note: false },
  { message_id: 'MSG002', ticket_id: 'TK001', sender_id: 'STF005', sender_name: 'Hoàng Văn Em', sender_role: 'teaching_assistant', content: 'Chào em Huy, anh đã nhận được yêu cầu. Em có thể cho anh biết cụ thể em bị vướng ở phần nào không? Ví dụ cấu trúc câu hay cách dùng trong ngữ cảnh?', sent_at: '2026-11-05T16:00:00', is_internal_note: false },
  { message_id: 'MSG003', ticket_id: 'TK001', sender_id: 'STF005', sender_name: 'Hoàng Văn Em', sender_role: 'teaching_assistant', content: '[Ghi chú nội bộ] Học viên này có dấu hiệu sa sút, cần theo dõi thêm kết quả quiz và bài tập.', sent_at: '2026-11-05T16:05:00', is_internal_note: true },
  { message_id: 'MSG004', ticket_id: 'TK001', sender_id: 'SV003', sender_name: 'Lê Quang Huy', sender_role: 'student', content: 'Em không biết khi nào dùng Past Perfect Continuous và khi nào dùng Past Perfect. Hai cái giống nhau quá.', sent_at: '2026-11-05T17:00:00', is_internal_note: false },
  // TK003 messages
  { message_id: 'MSG005', ticket_id: 'TK003', sender_id: 'SV005', sender_name: 'Hoàng Đức Mạnh', sender_role: 'student', content: 'Em thấy điểm giữa kỳ 2 của em chỉ 38 điểm, em muốn xem lại bài kiểm tra vì em nghĩ mình làm đúng nhiều hơn.', sent_at: '2026-11-18T08:00:00', is_internal_note: false },
  { message_id: 'MSG006', ticket_id: 'TK003', sender_id: 'STF005', sender_name: 'Hoàng Văn Em', sender_role: 'teaching_assistant', content: 'Chào em Mạnh, anh đã ghi nhận. Anh sẽ chuyển yêu cầu này lên giảng viên Lê Minh Cường để xem xét lại bài.', sent_at: '2026-11-18T09:30:00', is_internal_note: false },
  { message_id: 'MSG007', ticket_id: 'TK003', sender_id: 'STF005', sender_name: 'Hoàng Văn Em', sender_role: 'teaching_assistant', content: '[Ghi chú nội bộ] Chuyển giảng viên xem lại điểm. Học viên có biểu hiện lo lắng.', sent_at: '2026-11-18T10:00:00', is_internal_note: true },
  // TK005 messages
  { message_id: 'MSG008', ticket_id: 'TK005', sender_id: 'SV009', sender_name: 'Mai Thị Quỳnh', sender_role: 'student', content: 'Em đổi lịch làm việc nên không thể học T3/T5 được nữa. Em muốn chuyển sang lớp T7/CN nếu có.', sent_at: '2026-11-15T10:00:00', is_internal_note: false },
  { message_id: 'MSG009', ticket_id: 'TK005', sender_id: 'STF005', sender_name: 'Hoàng Văn Em', sender_role: 'teaching_assistant', content: 'Chào em Quỳnh, hiện tại lớp TOEIC 600 chưa mở thêm ca T7/CN. Anh đang xác nhận với bộ phận quản lý. Em có thể chờ phản hồi trong 1-2 ngày không?', sent_at: '2026-11-15T11:30:00', is_internal_note: false },
  // TK006 messages (Student SV001 - Thảo Nguyên)
  { message_id: 'MSG010', ticket_id: 'TK006', sender_id: 'SV001', sender_name: 'Nguyễn Thị Thảo Nguyên', sender_role: 'student', content: 'Em muốn xin thêm tài liệu tự luyện đề Listening Cambridge 18 và bài tập phát âm để tự ôn thêm ạ.', sent_at: '2026-10-20T09:00:00', is_internal_note: false },
  { message_id: 'MSG011', ticket_id: 'TK006', sender_id: 'STF005', sender_name: 'Hoàng Văn Em', sender_role: 'teaching_assistant', content: 'Chào Thảo Nguyên, anh đã tải trọn bộ Audio & Transcripts bộ đề Listening vào thư mục tài liệu lớp CLS001 rồi nhé. Em vào tải về học nha!', sent_at: '2026-10-20T10:00:00', is_internal_note: false },
  // TK007 messages (Student SV001 - Thảo Nguyên: Đơn nghỉ học có phép)
  { message_id: 'MSG012', ticket_id: 'TK007', sender_id: 'SV001', sender_name: 'Nguyễn Thị Thảo Nguyên', sender_role: 'student', content: 'Kính gửi thầy cô, em xin phép gửi đơn xin nghỉ buổi 12 ngày 14/11 do vướng lịch thi chứng chỉ tin học và đăng ký học bù ca tối Thứ 6.', sent_at: '2026-11-10T08:00:00', is_internal_note: false },
  { message_id: 'MSG013', ticket_id: 'TK007', sender_id: 'STF005', sender_name: 'Hoàng Văn Em', sender_role: 'teaching_assistant', content: 'Chào Thảo Nguyên, trợ giảng đã duyệt đơn xin nghỉ có phép và sắp xếp cho em học bù vào ca tối Thứ 6 tại Phòng 204. Chúc em thi tốt!', sent_at: '2026-11-10T09:15:00', is_internal_note: false },
  // TK008 messages (Student SV002 - Trần Thu Hà)
  { message_id: 'MSG014', ticket_id: 'TK008', sender_id: 'SV002', sender_name: 'Trần Thu Hà', sender_role: 'student', content: 'Dạ thưa thầy Cường, phần bài tập Speaking Unit 2 em đã ghi âm và nộp qua hệ thống rồi ạ. Thầy cho em hỏi phần ngữ điệu và phát âm âm đuôi của em đã ổn chưa ạ?', sent_at: '2026-11-19T20:30:00', is_internal_note: false },
  { message_id: 'MSG015', ticket_id: 'TK008', sender_id: 'STF003', sender_name: 'Lê Minh Cường', sender_role: 'teacher', content: 'Chào Thu Hà, thầy đã nghe bài nói của em rồi nhé. Phát âm của em khá tự nhiên và ngữ điệu rất trôi chảy! Em chỉ cần chú ý nhấn trọng âm rõ hơn ở các từ 3 âm tiết như \'particular\' và \'comfortable\' nhé.', sent_at: '2026-11-20T08:15:00', is_internal_note: false },
  { message_id: 'MSG016', ticket_id: 'TK008', sender_id: 'SV002', sender_name: 'Trần Thu Hà', sender_role: 'student', content: 'Dạ em cảm ơn thầy nhiều ạ! Em sẽ chú ý luyện tập thêm phần trọng âm và ngữ điệu theo hướng dẫn của thầy ạ.', sent_at: '2026-11-20T08:45:00', is_internal_note: false },
  // TK009 messages (Student SV_NN - Nguyễn Hồng Nhung)
  { message_id: 'MSG017', ticket_id: 'TK009', sender_id: 'SV_NN', sender_name: 'Nguyễn Hồng Nhung', sender_role: 'student', content: 'Thưa thầy, em muốn xin thêm danh sách collocations nâng cao cho bài viết Writing Task 1 miêu tả thói quen sinh hoạt hàng ngày ạ.', sent_at: '2026-11-20T10:00:00', is_internal_note: false },
  { message_id: 'MSG018', ticket_id: 'TK009', sender_id: 'STF003', sender_name: 'Lê Minh Cường', sender_role: 'teacher', content: 'Thầy chào em, thầy đã đính kèm cẩm nang từ vựng Academic Collocations chuyên đề Daily Routine & Productivity trên mục tài liệu lớp IELTS Foundation rồi nhé. Em tải về tham khảo nhé!', sent_at: '2026-11-20T10:45:00', is_internal_note: false },
];

// === Progress Snapshots ===
export const progressSnapshotData: ProgressSnapshot[] = [
  // SV001 in CLS001
  { snapshot_id: 'PS001', student_id: 'SV001', class_id: 'CLS001', period: 'Tháng 10', attendance_rate: 96, assignment_completion_rate: 100, avg_assessment_score: 82, avg_quiz_score: 83, trend: 'up', alert_level: 'normal', generated_at: '2026-10-31T00:00:00', data_completeness: 95 },
  { snapshot_id: 'PS002', student_id: 'SV001', class_id: 'CLS001', period: 'Tháng 11', attendance_rate: 94, assignment_completion_rate: 100, avg_assessment_score: 84, avg_quiz_score: 85, trend: 'up', alert_level: 'normal', generated_at: '2026-11-30T00:00:00', data_completeness: 90 },
  // SV003 in CLS001 - declining
  { snapshot_id: 'PS003', student_id: 'SV003', class_id: 'CLS001', period: 'Tháng 10', attendance_rate: 78, assignment_completion_rate: 80, avg_assessment_score: 58, avg_quiz_score: 52, trend: 'down', alert_level: 'watch', generated_at: '2026-10-31T00:00:00', data_completeness: 92 },
  { snapshot_id: 'PS004', student_id: 'SV003', class_id: 'CLS001', period: 'Tháng 11', attendance_rate: 72, assignment_completion_rate: 60, avg_assessment_score: 52, avg_quiz_score: null, trend: 'down', alert_level: 'priority', generated_at: '2026-11-30T00:00:00', data_completeness: 75, notes: 'Chuyên cần giảm, chưa làm quiz tháng 11. Cần trợ giảng liên hệ.' },
  // SV005 in CLS001 - critical
  { snapshot_id: 'PS005', student_id: 'SV005', class_id: 'CLS001', period: 'Tháng 10', attendance_rate: 68, assignment_completion_rate: 50, avg_assessment_score: 45, avg_quiz_score: null, trend: 'down', alert_level: 'priority', generated_at: '2026-10-31T00:00:00', data_completeness: 60, notes: 'Chuyên cần rất thấp, không làm quiz, điểm kiểm tra dưới trung bình.' },
  { snapshot_id: 'PS006', student_id: 'SV005', class_id: 'CLS001', period: 'Tháng 11', attendance_rate: 62, assignment_completion_rate: 40, avg_assessment_score: 38, avg_quiz_score: 36, trend: 'down', alert_level: 'priority', generated_at: '2026-11-30T00:00:00', data_completeness: 70, notes: 'Tình trạng tiếp tục xấu. Đã gửi ticket hỏi về điểm.' },
  // SV002 in CLS001 - stable  
  { snapshot_id: 'PS007', student_id: 'SV002', class_id: 'CLS001', period: 'Tháng 10', attendance_rate: 88, assignment_completion_rate: 90, avg_assessment_score: 75, avg_quiz_score: 72, trend: 'stable', alert_level: 'normal', generated_at: '2026-10-31T00:00:00', data_completeness: 95 },
  { snapshot_id: 'PS008', student_id: 'SV002', class_id: 'CLS001', period: 'Tháng 11', attendance_rate: 86, assignment_completion_rate: 85, avg_assessment_score: 70, avg_quiz_score: 70, trend: 'down', alert_level: 'watch', generated_at: '2026-11-30T00:00:00', data_completeness: 90, notes: 'Nhẹ giảm so với kỳ trước. Theo dõi thêm.' },
  // SV004 in CLS001 - excellent
  { snapshot_id: 'PS009', student_id: 'SV004', class_id: 'CLS001', period: 'Tháng 10', attendance_rate: 92, assignment_completion_rate: 100, avg_assessment_score: 88, avg_quiz_score: 90, trend: 'up', alert_level: 'normal', generated_at: '2026-10-31T00:00:00', data_completeness: 98 },
  { snapshot_id: 'PS010', student_id: 'SV004', class_id: 'CLS001', period: 'Tháng 11', attendance_rate: 94, assignment_completion_rate: 100, avg_assessment_score: 90, avg_quiz_score: 92, trend: 'up', alert_level: 'normal', generated_at: '2026-11-30T00:00:00', data_completeness: 95 },
  // SV006 in CLS003
  { snapshot_id: 'PS011', student_id: 'SV006', class_id: 'CLS003', period: 'Tháng 10', attendance_rate: 90, assignment_completion_rate: 85, avg_assessment_score: 61, avg_quiz_score: 70, trend: 'stable', alert_level: 'normal', generated_at: '2026-10-31T00:00:00', data_completeness: 88 },
  // SV010 in CLS003 - Cold-Start (< 3 buổi hoàn thành, chưa đủ dữ liệu)
  { snapshot_id: 'PS012', student_id: 'SV010', class_id: 'CLS003', period: 'Tháng 11', attendance_rate: 100, assignment_completion_rate: 100, avg_assessment_score: null, avg_quiz_score: null, trend: 'insufficient_data', alert_level: 'pending', generated_at: '2026-11-30T00:00:00', data_completeness: 20, notes: 'Học viên mới vào lớp (< 3 buổi hoàn thành). Chưa đủ dữ liệu để xếp hạng sa sút.' },
];

// === Intervention Records ===
export const interventionData: InterventionRecord[] = [
  {
    intervention_id: 'INT001', student_id: 'SV005', class_id: 'CLS001',
    issue: 'Chuyên cần rất thấp (62%), điểm giữa kỳ 2 dưới 40, không hoàn thành quiz.',
    action: 'Trợ giảng liên hệ qua điện thoại, tìm hiểu nguyên nhân và lập kế hoạch hỗ trợ.',
    performed_by: 'STF005', performed_by_name: 'Hoàng Văn Em',
    result: 'Học viên cho biết gặp khó khăn về tài chính và phải đi làm thêm. Đã trao đổi với quản lý về chính sách hỗ trợ.',
    follow_up_date: '2026-11-25',
    created_at: '2026-11-19T10:00:00',
    status: 'in_progress',
  },
  {
    intervention_id: 'INT002', student_id: 'SV003', class_id: 'CLS001',
    issue: 'Tỷ lệ nộp bài giảm từ 80% xuống 60%, chuyên cần giảm từ 78% xuống 72%.',
    action: 'Nhắn tin hỏi thăm tình hình và đề nghị hẹn gặp trực tiếp.',
    performed_by: 'STF005', performed_by_name: 'Hoàng Văn Em',
    follow_up_date: '2026-11-22',
    created_at: '2026-11-17T14:00:00',
    status: 'planned',
  },
];

// === Feedback Records ===
export const feedbackData: FeedbackRecord[] = [
  {
    feedback_id: 'FB001', student_id: 'SV005', class_id: 'CLS001', period: 'Tháng 11',
    observation: 'Tỷ lệ chuyên cần giảm từ 68% (Tháng 10) xuống 62% (Tháng 11). Điểm kiểm tra giữa kỳ 2 là 38/100, giảm 7 điểm so với giữa kỳ 1. Chưa hoàn thành 2/4 quiz trắc nghiệm.',
    evidence: 'Điểm danh: 20/32 buổi có mặt. Kết quả kiểm tra: GK1=45, GK2=38. Quiz: QZ001=Chưa làm, QZ002=36/100, QZ003=Chưa làm.',
    interpretation: 'Đây là dấu hiệu sa sút liên tục qua hai kỳ. Tuy nhiên, nguyên nhân cần được xác minh trực tiếp với học viên trước khi đưa ra kết luận.',
    recommended_action: 'Trợ giảng liên hệ học viên để xác minh khó khăn, thống nhất kế hoạch hoàn thành bài còn thiếu và cải thiện chuyên cần. Đánh giá lại sau 1 tuần.',
    owner: 'STF005', owner_role: 'teaching_assistant',
    follow_up_date: '2026-12-02',
    is_approved: true, approved_by: 'STF002',
    created_at: '2026-11-20T09:00:00', created_by: 'STF005',
  },
  {
    feedback_id: 'FB002', student_id: 'SV003', class_id: 'CLS001', period: 'Tháng 11',
    observation: 'Tỷ lệ nộp bài giảm từ 80% xuống 60%. Chuyên cần ổn định ở mức 72-78% nhưng dưới ngưỡng khuyến nghị (85%). Điểm kiểm tra giảm nhẹ.',
    evidence: 'Nộp bài: 3/5 bài tháng 11. Điểm danh: 23/32 buổi. GK1=58, GK2=52.',
    interpretation: 'Học viên có dấu hiệu mất tập trung hoặc gặp khó khăn. Kết quả quiz cũng cho thấy xu hướng giảm.',
    recommended_action: 'Trợ giảng liên hệ hỏi thăm và đề nghị hỗ trợ thêm. Giảng viên xem xét cung cấp tài liệu bổ sung.',
    owner: 'STF005', owner_role: 'teaching_assistant',
    follow_up_date: '2026-11-28',
    is_approved: false,
    created_at: '2026-11-20T09:30:00', created_by: 'STF005',
  },
];

// === Audit Logs ===
export const auditLogData: AuditLog[] = [
  { log_id: 'LOG015', user_id: 'STF006', user_name: 'Võ Thị Phương', user_role: 'teaching_assistant', action: 'CREATE', entity_type: 'Attendance', entity_id: 'ATT-CLS_B1_01-S06', changes: 'Hoàn thành điểm danh buổi học 06 lớp Tiếng Anh B1 (14/14 học viên có mặt)', timestamp: '2026-11-20T20:15:00' },
  { log_id: 'LOG014', user_id: 'STF001', user_name: 'Nguyễn Văn An', user_role: 'admin', action: 'UPDATE', entity_type: 'ClassConfig', entity_id: 'CLS_IELTS_FND', changes: 'Khóa trọng số điểm tổng kết: Chuyên cần 10%, BTVN 30%, GK 30%, CK 30%', timestamp: '2026-11-20T16:45:00' },
  { log_id: 'LOG013', user_id: 'STF003', user_name: 'Lê Minh Cường', user_role: 'teacher', action: 'CREATE', entity_type: 'CourseLesson', entity_id: 'LES009', changes: 'Tải lên tài liệu và bài tập Unit 2: IELTS Writing Task 1 Line Graph', timestamp: '2026-11-20T14:30:00' },
  { log_id: 'LOG008', user_id: 'STF005', user_name: 'Hoàng Văn Em', user_role: 'teaching_assistant', action: 'CREATE', entity_type: 'InterventionRecord', entity_id: 'INT001', changes: 'Tạo bản ghi can thiệp cho SV005 - Chuyên cần thấp, điểm giảm', timestamp: '2026-11-19T10:00:00' },
  { log_id: 'LOG004', user_id: 'STF005', user_name: 'Hoàng Văn Em', user_role: 'teaching_assistant', action: 'ESCALATE', entity_type: 'SupportTicket', entity_id: 'TK003', changes: 'Chuyển ticket cho giảng viên STF003 - Lý do: Cần xem xét lại điểm kiểm tra', timestamp: '2026-11-18T10:00:00' },
  { log_id: 'LOG002', user_id: 'STF003', user_name: 'Lê Minh Cường', user_role: 'teacher', action: 'CREATE', entity_type: 'AssessmentResult', entity_id: 'AR007-AR012', changes: 'Nhập điểm kiểm tra giữa kỳ 2 cho lớp CLS001 (6 học viên)', timestamp: '2026-11-16T10:00:00' },
  { log_id: 'LOG010', user_id: 'STF006', user_name: 'Võ Thị Phương', user_role: 'teaching_assistant', action: 'UPDATE', entity_type: 'Attendance', entity_id: 'ATT-SV006-CLS003-S28', changes: 'Ghi nhận có mặt và phát tài liệu ôn tập IELTS cho học viên Võ Thanh Nhân', timestamp: '2026-11-12T19:00:00' },
  { log_id: 'LOG009', user_id: 'STF004', user_name: 'Phạm Thị Dung', user_role: 'teacher', action: 'CREATE', entity_type: 'AssessmentResult', entity_id: 'AR013-AR020', changes: 'Nhập điểm kiểm tra kỹ năng Speaking cho lớp Tiếng Anh B1 (8 học viên)', timestamp: '2026-11-11T14:00:00' },
  { log_id: 'LOG003', user_id: 'STF005', user_name: 'Hoàng Văn Em', user_role: 'teaching_assistant', action: 'UPDATE', entity_type: 'Attendance', entity_id: 'ATT-SV003-CLS001-S25', changes: 'Cập nhật trạng thái từ "absent" thành "excused" (có đơn xin phép)', timestamp: '2026-11-10T08:30:00' },
  { log_id: 'LOG007', user_id: 'STF003', user_name: 'Lê Minh Cường', user_role: 'teacher', action: 'UPDATE', entity_type: 'AssessmentResult', entity_id: 'AR005', changes: 'Sửa điểm GK1 SV005 từ 47 thành 45 (phát hiện lỗi cộng điểm)', timestamp: '2026-10-18T14:00:00' },
  { log_id: 'LOG001', user_id: 'STF003', user_name: 'Lê Minh Cường', user_role: 'teacher', action: 'CREATE', entity_type: 'AssessmentResult', entity_id: 'AR001-AR006', changes: 'Nhập điểm kiểm tra giữa kỳ 1 cho lớp CLS001 (6 học viên)', timestamp: '2026-10-16T10:00:00' },
  { log_id: 'LOG006', user_id: 'STF001', user_name: 'Nguyễn Văn An', user_role: 'admin', action: 'UPDATE', entity_type: 'ClassAssignment', entity_id: 'CA003', changes: 'Phân công trợ giảng STF006 cho lớp CLS003', timestamp: '2026-09-01T09:15:00' },
  { log_id: 'LOG005', user_id: 'STF001', user_name: 'Nguyễn Văn An', user_role: 'admin', action: 'CREATE', entity_type: 'Staff', entity_id: 'STF006', changes: 'Tạo tài khoản trợ giảng mới: Võ Thị Phương', timestamp: '2026-09-01T09:00:00' },
];

// === SLA Configuration ===
export const slaConfig: SLAConfig = {
  max_first_response_hours: 4,
  max_resolution_hours: 12,
  business_hours_start: '08:00',
  business_hours_end: '18:00', // Khung giờ hành chính chuẩn 08:00 - 18:00 (10 tiếng/ngày)
  working_days: [1, 2, 3, 4, 5, 6], // Thứ 2 đến Thứ 7
  escalation_rules: [
    { condition: 'no_response', hours_threshold: 4, escalate_to: 'teacher', notification: 'SLA-1 vi phạm: Trợ giảng chưa phản hồi sau 4 giờ làm việc' },
    { condition: 'no_resolution', hours_threshold: 12, escalate_to: 'admin', notification: 'SLA-2 vi phạm: Giảng viên chưa giải quyết sau 12 giờ làm việc (Chuyển Quản trị viên)' },
    { condition: 'high_priority_no_response', hours_threshold: 2, escalate_to: 'teacher', notification: 'Ticket ưu tiên cao chưa có phản hồi sau 2 giờ làm việc' },
  ],
  pause_on_waiting_student: true,
};

// === 6 Quy tắc Rủi ro Chuẩn hóa theo UC-16 ===
export const alertRules: AlertRule[] = [
  { rule_id: 'ALR001', name: 'Rule 1: Chuyên cần < 65%', description: 'Cảnh báo ưu tiên can thiệp khi tỷ lệ chuyên cần dưới 65%', condition_type: 'attendance_below', threshold: 65, alert_level: 'priority', is_active: true },
  { rule_id: 'ALR002', name: 'Rule 2a: Vắng 3 buổi không phép', description: 'Cảnh báo ưu tiên can thiệp khi học viên vắng 3 buổi liên tiếp không phép (nguy cơ bỏ học)', condition_type: 'consecutive_unexcused_absent', threshold: 3, alert_level: 'priority', is_active: true },
  { rule_id: 'ALR003', name: 'Rule 2b: Vắng ≥ 3 buổi có phép', description: 'Cảnh báo cần theo dõi khi vắng ≥ 3 buổi có phép (cần phụ đạo/tư vấn bảo lưu)', condition_type: 'consecutive_excused_absent', threshold: 3, alert_level: 'watch', is_active: true },
  { rule_id: 'ALR004', name: 'Rule 3: Chuyên cần 65% – dưới 80%', description: 'Cảnh báo cần theo dõi khi chuyên cần dao động trong khoảng [65%, 80%)', condition_type: 'attendance_range', threshold: 80, alert_level: 'watch', is_active: true },
  { rule_id: 'ALR005', name: 'Rule 4: Điểm giảm > 15 điểm', description: 'Cảnh báo cần theo dõi khi điểm bài thi giảm hơn 15 điểm tuyệt đối so với bài trước', condition_type: 'score_decline_points', threshold: 15, alert_level: 'watch', is_active: true },
  { rule_id: 'ALR006', name: 'Rule 5: Nợ 2 bài quiz/bài tập quá hạn', description: 'Cảnh báo cần theo dõi khi học viên nợ 2 bài tập hoặc quiz liên tiếp đã quá hạn', condition_type: 'overdue_debt', threshold: 2, alert_level: 'watch', is_active: true },
];

// === Student Assignments (Cổng Bài tập trực tuyến) ===
const ASSIGNMENTS_STORAGE_KEY = 'edutrack_student_assignments';

const initialStudentAssignments: StudentAssignment[] = [
  {
    id: 'ASN_NN01',
    class_id: 'CLS_NN01',
    title: 'Unit 1 · Writing Task 1: Describing Daily Routines',
    description: 'Viết bài luận ngắn 150 - 180 từ miêu tả thói quen sinh hoạt hàng ngày, thời gian biểu học tập và các hoạt động thể thao.',
    deadline: '2026-11-25T23:59:00',
    max_score: 10,
    format: 'file',
    instructions: 'Sử dụng thì hiện tại đơn, trạng từ chỉ tần suất và từ nối chỉ trình tự thời gian (Firstly, Afterwards, Consequently).',
    created_at: '2026-11-15T08:00:00',
    assigned_by: 'Lê Minh Cường',
  },
  {
    id: 'ASN_NN02',
    class_id: 'CLS_NN01',
    title: 'Unit 2 · Speaking: Self Introduction Audio',
    description: 'Ghi âm đoạn nói 1 - 2 phút giới thiệu bản thân, mục tiêu học IELTS và định hướng nghề nghiệp tương lai.',
    deadline: '2026-11-26T23:59:00',
    max_score: 10,
    format: 'link',
    instructions: 'Phát âm rõ ràng theo chuẩn IPA, ngữ điệu tự nhiên, tránh ngắt quãng quá lâu.',
    created_at: '2026-11-16T09:00:00',
    assigned_by: 'Lê Minh Cường',
  },
  {
    id: 'ASN_NN03',
    class_id: 'CLS_NN01',
    title: 'Unit 3 · Reading & Grammar Collocations',
    description: 'Hoàn thành bài tập điền từ và phân tích ngữ pháp trong bài đọc lịch trình chuyến bay.',
    deadline: '2026-11-28T23:59:00',
    max_score: 10,
    format: 'text',
    instructions: 'Trả lời đủ 10 câu hỏi ngắn dựa theo Unit 3.',
    created_at: '2026-11-18T10:00:00',
    assigned_by: 'Lê Minh Cường',
  },
  {
    id: 'ASN001',
    class_id: 'CLS001',
    title: 'Writing Task 2: Opinion Essay on Remote Working & Education',
    description: 'Viết bài luận học thuật 250 - 300 từ phân tích ưu/nhược điểm của xu hướng làm việc từ xa và học trực tuyến trong kỷ nguyên số.',
    deadline: '2026-11-20T23:59:00',
    max_score: 100,
    format: 'file',
    instructions: 'Nộp định dạng .doc, .docx hoặc .pdf. Bài viết cần đủ 4 đoạn: Introduction, 2 Body paragraphs, Conclusion.',
    created_at: '2026-11-10T08:00:00',
    assigned_by: 'ThS. Lê Minh Cường',
  },
  {
    id: 'ASN002',
    class_id: 'CLS001',
    title: 'Speaking Portfolio: 3-Minute Presentation on Climate Action',
    description: 'Ghi âm hoặc quay video thuyết trình ngắn về giải pháp giảm phát thải rác thải nhựa tại trường học hoặc nơi cư trú.',
    deadline: '2026-11-25T23:59:00',
    max_score: 100,
    format: 'link',
    instructions: 'Tải video lên Google Drive / Youtube ở chế độ xem riêng tư và dán link vào ô nộp bài.',
    created_at: '2026-11-12T09:00:00',
    assigned_by: 'ThS. Lê Minh Cường',
  },
  {
    id: 'ASN003',
    class_id: 'CLS001',
    title: 'Reading Comprehension Mini-Project: Academic Collocations',
    description: 'Hoàn thiện bảng tra cứu 50 cụm Collocations chủ đề Education & Technology kèm ví dụ thực tế.',
    deadline: '2026-11-05T23:59:00',
    max_score: 100,
    format: 'file',
    instructions: 'Sử dụng mẫu template Excel hoặc Word của trung tâm để nộp bài.',
    created_at: '2026-10-28T08:00:00',
    assigned_by: 'Trợ giảng Hoàng Văn Em',
  },
  {
    id: 'ASN004',
    class_id: 'CLS002',
    title: 'Listening Practice: Summarize British Council Podcast Ep 14',
    description: 'Nghe đoạn ghi âm podcast và viết bản tóm tắt 150 từ các luận điểm chính về Trí tuệ nhân tạo.',
    deadline: '2026-11-22T23:59:00',
    max_score: 100,
    format: 'text',
    instructions: 'Nhập trực tiếp câu trả lời vào khung bài làm trực tuyến.',
    created_at: '2026-11-14T10:00:00',
    assigned_by: 'ThS. Lê Minh Cường',
  },
  {
    id: 'ASN005',
    class_id: 'CLS003',
    title: 'Reading Passage 2 Practice: Sustainable Architecture',
    description: 'Đọc bài đọc học thuật về kiến trúc bền vững và trả lời 13 câu hỏi theo chuẩn đề thi IELTS Reading.',
    deadline: '2026-11-27T23:59:00',
    max_score: 100,
    format: 'file',
    instructions: 'Nộp file bài làm .pdf hoặc .docx. Ghi rõ giải thích cho các câu hỏi True/False/Not Given.',
    created_at: '2026-11-15T09:00:00',
    assigned_by: 'Cô Phạm Thị Dung',
  },
  {
    id: 'ASN006',
    class_id: 'CLS003',
    title: 'Writing Task 1: Comparative Bar Chart on Renewable Energy',
    description: 'Viết bài báo cáo học thuật 150 - 180 từ miêu tả biểu đồ cột so sánh sản lượng năng lượng tái tạo.',
    deadline: '2026-11-29T23:59:00',
    max_score: 100,
    format: 'file',
    instructions: 'Phân tích đủ Overview, 2 đoạn thân bài so sánh chi tiết số liệu nổi bật.',
    created_at: '2026-11-17T14:00:00',
    assigned_by: 'Cô Phạm Thị Dung',
  },
];

function loadStudentAssignments(): StudentAssignment[] {
  try {
    const saved = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Merge initial with saved (saved items take precedence, but newly defined initial items are kept)
        const map = new Map<string, StudentAssignment>();
        initialStudentAssignments.forEach(a => map.set(a.id, a));
        parsed.forEach((a: StudentAssignment) => map.set(a.id, a));
        return Array.from(map.values());
      }
    }
  } catch { /* ignore */ }
  return initialStudentAssignments;
}

export const studentAssignmentData: StudentAssignment[] = loadStudentAssignments();

export function saveStudentAssignments(data: StudentAssignment[]) {
  try {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// === Student Submissions (Bài đã nộp của học viên) ===
const SUBMISSIONS_STORAGE_KEY = 'edutrack_submissions';

const initialStudentSubmissions: StudentSubmission[] = [
  {
    id: 'SUB_NN01',
    assignment_id: 'ASN_NN01',
    student_id: 'SV_NN',
    submitted_at: '2026-11-20T10:30:00',
    status: 'submitted',
    submission_type: 'writing',
    word_count: 172,
    attachment_name: 'HongNhung_Unit1_DailyRoutine.docx',
    attachment_size: '1.2 MB',
    submission_text: 'My daily routine begins at 6:30 AM every weekday. First, I spend 30 minutes jogging around the campus park, which energizes me for the entire day. After a quick breakfast with oatmeal and black coffee, I attend my morning classes at the university. In the afternoon, I regularly dedicate two hours to reviewing English vocabulary and practicing IELTS listening tasks. In the evening, I usually prepare dinner with my roommates and read academic articles before going to bed at 11:00 PM. Maintaining this disciplined schedule helps me stay focused on achieving my target band score of 6.5 in the upcoming test.',
    score: null,
    teacher_feedback: 'Đang trong hàng đợi chờ giáo viên chấm điểm.',
  },
  {
    id: 'SUB_NN02',
    assignment_id: 'ASN_NN02',
    student_id: 'SV002',
    submitted_at: '2026-11-19T18:45:00',
    status: 'submitted',
    submission_type: 'speaking',
    audio_duration: '01:42',
    audio_url: 'https://actions.google.com/sounds/v1/speech/female_english.ogg',
    audio_transcript: 'Hello teacher, my name is Thu Ha, and I am currently a sophomore majoring in International Business. Today, I would like to introduce myself and share my primary objectives for taking the IELTS Foundation course. In my free time, I genuinely enjoy reading economics journals and conversing with international friends online. My ultimate career ambition is to work for a multinational consulting firm in Singapore, which strictly requires exceptional fluency and professional presentation skills. Therefore, I am determined to master academic speaking techniques, expand my collocations, and eliminate grammatical pauses throughout this 15-week journey.',
    attachment_name: 'ThuHa_Speaking_SelfIntro_Unit2.mp3',
    attachment_size: '3.4 MB',
    score: null,
    teacher_feedback: 'Đang trong hàng đợi chờ giáo viên chấm điểm.',
  },
  {
    id: 'SUB_NN03',
    assignment_id: 'ASN_NN01',
    student_id: 'SV005',
    submitted_at: '2026-11-18T16:20:00',
    status: 'graded',
    submission_type: 'writing',
    word_count: 158,
    attachment_name: 'ManhHD_DailyRoutine.pdf',
    attachment_size: '850 KB',
    submission_text: 'Every morning, I wake up at 7:00 AM to prepare for my daily study routine. As an engineering student, my timetable is frequently packed with laboratory sessions and technical lectures. However, I always reserve at least one hour during the evening to learn English on EduTrack. I practice flashcards and write short paragraphs to sharpen my communication ability. On weekends, I join study clubs to exchange ideas with peers.',
    score: 8.5,
    teacher_feedback: 'Bài viết có bố cục rõ ràng, ngữ pháp chia thì chính xác. Sử dụng các trạng từ chỉ tần suất rất tự nhiên. Cần bổ sung thêm một số liên từ nâng cao.',
    graded_at: '2026-11-19T20:30:00',
    graded_by: 'STF003',
    xp_awarded: 85,
  },
  {
    id: 'SUB001',
    assignment_id: 'ASN003',
    student_id: 'SV001',
    submitted_at: '2026-11-04T16:45:00',
    status: 'graded',
    attachment_name: 'ThaoNguyen_SV001_Collocations_Unit5.docx',
    attachment_size: '2.4 MB',
    score: 92,
    teacher_feedback: 'Bài làm rất tốt, cách phân loại từ vựng khoa học. Đạt chuẩn Rubric 9/10 từ vựng học thuật. Chú ý thêm một số giới từ đi kèm động từ.',
    graded_at: '2026-11-06T14:00:00',
    graded_by: 'STF005',
  },
  {
    id: 'SUB002',
    assignment_id: 'ASN001',
    student_id: 'SV001',
    submitted_at: '2026-11-15T21:10:00',
    status: 'submitted',
    attachment_name: 'ThaoNguyen_WritingTask2_Essay_Draft.pdf',
    attachment_size: '1.8 MB',
    submission_text: 'Thưa thầy, em đã bổ sung thêm 2 ví dụ phản biện ở phần Thân bài 2 theo góp ý buổi trước ạ.',
    score: null,
    teacher_feedback: 'Đang trong hàng đợi chờ giảng viên chấm điểm.',
  },
  {
    id: 'SUB003',
    assignment_id: 'ASN001',
    student_id: 'SV002',
    submitted_at: '2026-11-16T09:30:00',
    status: 'submitted',
    attachment_name: 'Baitap_Writing_TranThuHa_Essay.docx',
    attachment_size: '1.2 MB',
    submission_text: 'Em nộp bài luận về chủ đề Remote Working ạ, mong thầy cô góp ý phần từ vựng.',
    score: null,
    teacher_feedback: 'Đang chờ chấm điểm.',
  },
  {
    id: 'SUB004',
    assignment_id: 'ASN001',
    student_id: 'SV003',
    submitted_at: '2026-11-16T14:20:00',
    status: 'submitted',
    attachment_name: 'WritingTask2_LeQuangHuy.pdf',
    attachment_size: '2.1 MB',
    submission_text: 'Bài luận Opinion Essay 280 từ hoàn thiện.',
    score: null,
    teacher_feedback: 'Đang chờ chấm điểm.',
  },
  {
    id: 'SUB005',
    assignment_id: 'ASN001',
    student_id: 'SV004',
    submitted_at: '2026-11-14T10:15:00',
    status: 'graded',
    attachment_name: 'Writing_Task2_PhamNgocLinh.pdf',
    attachment_size: '1.5 MB',
    score: 88,
    teacher_feedback: 'Luận điểm rõ ràng, cấu trúc bài viết chặt chẽ. Cần chú ý thêm sự đa dạng của câu phức.',
    graded_at: '2026-11-15T16:00:00',
    graded_by: 'STF003',
  },
  {
    id: 'SUB006',
    assignment_id: 'ASN002',
    student_id: 'SV001',
    submitted_at: '2026-11-15T18:00:00',
    status: 'submitted',
    submission_link: 'https://drive.google.com/file/d/speaking_portfolio_khoi/view',
    attachment_name: 'Presentation_Slide_ClimateAction.pdf',
    attachment_size: '3.5 MB',
    submission_text: 'Em đã nộp slide tóm tắt đính kèm và link video bài nói 3 phút trên Google Drive ạ.',
    score: null,
    teacher_feedback: 'Đang chờ chấm điểm.',
  },
  {
    id: 'SUB007',
    assignment_id: 'ASN002',
    student_id: 'SV002',
    submitted_at: '2026-11-16T11:45:00',
    status: 'submitted',
    submission_link: 'https://youtube.com/watch?v=demo_speaking_tran_thu_ha',
    submission_text: 'Video thuyết trình 3 phút về giải pháp rác thải nhựa.',
    score: null,
    teacher_feedback: 'Đang chờ chấm điểm.',
  },
  {
    id: 'SUB008',
    assignment_id: 'ASN003',
    student_id: 'SV002',
    submitted_at: '2026-11-05T15:20:00',
    status: 'graded',
    attachment_name: 'TranThuHa_50_Collocations.xlsx',
    attachment_size: '950 KB',
    score: 86,
    teacher_feedback: 'Đủ 50 cụm từ, ví dụ ứng dụng tốt.',
    graded_at: '2026-11-06T11:00:00',
    graded_by: 'STF005',
  },
  {
    id: 'SUB009',
    assignment_id: 'ASN003',
    student_id: 'SV003',
    submitted_at: '2026-11-05T20:10:00',
    status: 'submitted',
    attachment_name: 'Reading_Collocations_HuyLQ.docx',
    attachment_size: '1.1 MB',
    score: null,
    teacher_feedback: 'Đang chờ chấm điểm.',
  },
  {
    id: 'SUB010',
    assignment_id: 'ASN004',
    student_id: 'SV009',
    submitted_at: '2026-11-15T14:30:00',
    status: 'submitted',
    attachment_name: 'Podcast_Summary_QuynhMai.pdf',
    attachment_size: '1.4 MB',
    submission_text: 'Bản tóm tắt podcast Ep 14 về AI trong giáo dục.',
    score: null,
    teacher_feedback: 'Đang chờ chấm điểm.',
  },
  {
    id: 'SUB011',
    assignment_id: 'ASN005',
    student_id: 'SV006',
    submitted_at: '2026-11-20T15:30:00',
    status: 'submitted',
    attachment_name: 'BaoChau_Reading_Passage2_Answers.pdf',
    attachment_size: '1.4 MB',
    submission_text: 'Em nộp bài đọc Passage 2 ạ. Phần Matching Headings em đã giải thích kỹ từng đoạn.',
    score: null,
    teacher_feedback: 'Đang trong hàng đợi chờ giảng viên chấm điểm.',
  },
  {
    id: 'SUB012',
    assignment_id: 'ASN005',
    student_id: 'SV007',
    submitted_at: '2026-11-19T11:00:00',
    status: 'graded',
    attachment_name: 'HoangLong_Sustainable_Architecture.docx',
    attachment_size: '950 KB',
    score: 85,
    teacher_feedback: 'Làm đúng 11/13 câu. Đọc hiểu ý chính rất tốt, cần lưu ý bẫy từ đồng nghĩa ở câu số 7 và 9.',
    graded_at: '2026-11-20T16:00:00',
    graded_by: 'STF004',
  },
];

function loadStudentSubmissions(): StudentSubmission[] {
  try {
    const saved = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        initialStudentSubmissions.forEach(initSub => {
          if (!parsed.some((p: StudentSubmission) => p.id === initSub.id)) {
            parsed.unshift(initSub);
          }
        });
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return initialStudentSubmissions;
}

export const studentSubmissionData: StudentSubmission[] = loadStudentSubmissions();

export function saveStudentSubmissions(data: StudentSubmission[]) {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function gradeSubmissionLocal(
  submissionId: string,
  score: number,
  feedback: string,
  teacherId = 'STF003',
  xpAwarded?: number
): boolean {
  const sub = studentSubmissionData.find(s => s.id === submissionId);
  if (!sub) return false;

  const xp = xpAwarded !== undefined ? xpAwarded : Math.round(score * 10);
  sub.status = 'graded';
  sub.score = score;
  sub.teacher_feedback = feedback;
  sub.graded_at = new Date().toISOString();
  sub.graded_by = teacherId;
  sub.xp_awarded = xp;
  saveStudentSubmissions(studentSubmissionData);

  // Sync to student monitoring data
  const mon = studentMonitoringData.find(m => m.student_id === sub.student_id);
  if (mon) {
    mon.avg_score = String(score);
    mon.avg_score_sub = `Đã chấm bài: ${score}/10`;
    mon.gamification.xp_this_week += xp;
    mon.gamification.xp_total += xp;
  }

  return true;
}

// === Smart Makeup Class Options (Độc quyền: Ca học bù được hệ thống AI ghép tự động) ===
export const makeupOptionsData: MakeupClassOption[] = [
  {
    option_id: 'MKO001',
    missed_topic: 'Buổi 12: Kỹ thuật Skimming & Scanning Nâng cao + Phân tích dạng True/False/Not Given',
    target_class_id: 'CLS002',
    target_class_name: 'IELTS Intensive 6.5 - Ca Tối 3-5',
    target_class_code: 'CLS002',
    target_campus: 'CS1',
    date: '2026-11-20',
    time: '19:30 - 21:00',
    room: 'Phòng 204 - CS1',
    teacher_name: 'ThS. Lê Minh Cường',
    available_slots: 3,
    mode: 'in_person',
  },
  {
    option_id: 'MKO002',
    missed_topic: 'Buổi 12: Kỹ thuật Skimming & Scanning Nâng cao + Phân tích dạng True/False/Not Given',
    target_class_id: 'CLS003',
    target_class_name: 'IELTS Intensive 6.5 - Ca Thứ 7',
    target_class_code: 'CLS003',
    target_campus: 'CS2',
    date: '2026-11-21',
    time: '09:00 - 11:30',
    room: 'Phòng 302 - CS2',
    teacher_name: 'Cô Phạm Thị Dung',
    available_slots: 2,
    mode: 'in_person',
  },
  {
    option_id: 'MKO003',
    missed_topic: 'Buổi 12: Bổ trợ Kèm 1-1 Chuyên sâu với Trợ giảng',
    target_class_id: 'CLS001',
    target_class_name: 'Phụ đạo Trợ giảng kèm 1-1',
    target_class_code: 'TUTOR-1-1',
    target_campus: 'CS1',
    date: '2026-11-22',
    time: '15:00 - 16:30',
    room: 'Phòng Tutoring 102 / Zoom Online',
    teacher_name: 'Trợ giảng Hoàng Văn Em',
    available_slots: 1,
    mode: 'online_zoom',
  },
];

// === Makeup Bookings (Ca học bù đã xác nhận của học viên) ===
export const makeupBookingData: MakeupBooking[] = [
  {
    booking_id: 'MB001',
    student_id: 'SV001',
    missed_session_title: 'Buổi 12 - Lớp CLS001',
    target_class_code: 'CLS002',
    target_campus: 'CS1',
    date: '2026-11-20',
    time: '19:30 - 21:00',
    room: 'Phòng 204 - CS1',
    status: 'confirmed',
    booked_at: '2026-11-10T08:30:00',
    notes: 'Đã xác nhận chuyển lớp bù theo đơn xin nghỉ phép của học viên.',
  },
];

// === Student Status Updater for Academic Managers & Admin ===
export function updateStudentStatus(
  studentId: string,
  newStatus: StudentStatus,
  notes?: string,
  updatedBy?: { id: string; name: string; role: Role }
): boolean {
  const student = studentData.find(s => s.student_id === studentId);
  if (!student) return false;
  const oldStatus = student.status;
  student.status = newStatus;
  if (notes !== undefined) {
    student.notes = notes;
  }
  // Record in Audit Log
  auditLogData.unshift({
    log_id: `LOG${Date.now()}`,
    user_id: updatedBy?.id || 'STF001',
    user_name: updatedBy?.name || 'Nguyễn Văn An',
    user_role: updatedBy?.role || 'admin',
    action: 'UPDATE',
    entity_type: 'Student',
    entity_id: studentId,
    changes: `Cập nhật trạng thái học viên ${student.full_name} (${student.student_code}) từ "${oldStatus}" sang "${newStatus}"${notes ? ` · Ghi chú: ${notes}` : ''}`,
    timestamp: new Date().toISOString(),
  });
  return true;
}

// === Student Monitoring Data ===
export const generate14Days = (todayMinutes = 2): ActivityDay[] => {
  const days: ActivityDay[] = [];
  const dayLabels = ['06/11', '07/11', '08/11', '09/11', '10/11', '11/11', '12/11', '13/11', '14/11', '15/11', '16/11', '17/11', '18/11', 'Hôm nay'];
  dayLabels.forEach((lbl, idx) => {
    const isToday = idx === 13;
    days.push({
      date: `2026-11-${String(idx + 6).padStart(2, '0')}`,
      label: lbl,
      active_minutes: isToday ? todayMinutes : 0,
      is_today: isToday,
    });
  });
  return days;
};

export const studentMonitoringData: StudentMonitoringItem[] = [
  {
    student_id: 'SV_NN',
    student_code: 'HV2026-NN',
    full_name: 'Nguyễn Hồng Nhung',
    email: 'hongnhung.student@edutrack.vn',
    phone: '0912345678',
    avatar_initials: 'HN',
    class_id: 'CLS_NN01',
    class_name: 'IELTS Foundation 5.5 — Giáo trình mẫu',
    course_name: 'IELTS Foundation 5.5',
    cefr_level: 'B1 · Pre-IELTS',
    alert_level: 'normal',
    status_note: 'Học viên mới (miễn cảnh báo)',
    course_progress: 0,
    avg_score: '—',
    avg_score_sub: 'Chưa có điểm bài tập',
    streak_days: 0,
    streak_sub: 'Chưa bắt đầu chuỗi',
    vocab_health_kpi: '—',
    vocab_health_sub: 'Chưa học từ vựng',
    activity_14_days: {
      days: generate14Days(2),
      streak_app_days: 1,
      avg_minutes_7_days: 'TB <1 phút/ngày (7 ngày)',
      usage_ratio_note: '1/7 ngày có dùng · 2 phút/ngày có dùng',
    },
    vocab_badge: 'Chưa đủ dữ liệu',
    vocab_msg: 'Học viên chưa có từ vựng được mở để luyện.',
    progress_completed: {
      lessons_done: 0,
      lessons_total: 0,
      percent: 0,
      on_time_count: 0,
      late_count: 0,
    },
    results_weakness: {
      avg_score: '—',
      avg_score_note: 'Chưa có bài tập nào có điểm',
      forget_rate: '0%',
    },
    attendance_interaction: {
      last_studied: '—',
      days_studied: 0,
      questions_asked: 0,
      flashcards_reviewed: 0,
    },
    gamification: {
      level: 'Lv 1',
      badge: '🥚 Trứng',
      xp_total: 0,
      xp_this_week: 0,
    },
  },
  {
    student_id: 'SV002',
    student_code: 'HV2026002',
    full_name: 'Trần Thu Hà',
    email: 'ha.tt@email.com',
    phone: '0912345002',
    avatar_initials: 'TH',
    class_id: 'CLS_NN01',
    class_name: 'IELTS Foundation 5.5 — Giáo trình mẫu',
    course_name: 'IELTS Foundation 5.5',
    cefr_level: 'B2 · IELTS 6.0',
    alert_level: 'watch',
    status_note: 'Chưa nộp bài tập tuần này',
    course_progress: 25,
    avg_score: '6.5',
    avg_score_sub: 'Cần nộp bài tập đúng hạn',
    streak_days: 2,
    streak_sub: 'Chuỗi 2 ngày',
    vocab_health_kpi: '72%',
    vocab_health_sub: '18 từ đã ghi nhớ',
    activity_14_days: {
      days: generate14Days(15),
      streak_app_days: 2,
      avg_minutes_7_days: 'TB 15 phút/ngày (7 ngày)',
      usage_ratio_note: '3/7 ngày có dùng · 18 phút/ngày có dùng',
    },
    vocab_badge: 'Đang tích lũy',
    vocab_msg: 'Học viên đã mở 25 từ vựng, tỷ lệ nhớ 72%.',
    progress_completed: {
      lessons_done: 6,
      lessons_total: 24,
      percent: 25,
      on_time_count: 5,
      late_count: 1,
    },
    results_weakness: {
      avg_score: '6.5',
      avg_score_note: 'Điểm TB các bài tập gần nhất',
      forget_rate: '28%',
    },
    attendance_interaction: {
      last_studied: 'Hôm qua',
      days_studied: 8,
      questions_asked: 3,
      flashcards_reviewed: 45,
    },
    gamification: {
      level: 'Lv 3',
      badge: '🐥 Gà con',
      xp_total: 350,
      xp_this_week: 40,
    },
  },
  {
    student_id: 'SV005',
    student_code: 'HV2026005',
    full_name: 'Hoàng Đức Mạnh',
    email: 'manh.hd@email.com',
    phone: '0912345005',
    avatar_initials: 'HM',
    class_id: 'CLS_NN01',
    class_name: 'IELTS Foundation 5.5 — Giáo trình mẫu',
    course_name: 'IELTS Foundation 5.5',
    cefr_level: 'A2 · IELTS 4.0',
    alert_level: 'priority',
    status_note: 'Nghỉ học liên tiếp 3 buổi',
    course_progress: 12,
    avg_score: '4.0',
    avg_score_sub: 'Chưa đạt yêu cầu tối thiểu',
    streak_days: 0,
    streak_sub: 'Đã đứt chuỗi',
    vocab_health_kpi: '35%',
    vocab_health_sub: 'Nguy cơ quên từ vựng cao',
    activity_14_days: {
      days: generate14Days(0),
      streak_app_days: 0,
      avg_minutes_7_days: 'TB 0 phút/ngày (7 ngày)',
      usage_ratio_note: '0/7 ngày có dùng',
    },
    vocab_badge: 'Báo động',
    vocab_msg: 'Học viên không tương tác bài học trong 7 ngày qua.',
    progress_completed: {
      lessons_done: 3,
      lessons_total: 24,
      percent: 12,
      on_time_count: 1,
      late_count: 3,
    },
    results_weakness: {
      avg_score: '4.0',
      avg_score_note: 'Điểm TB dưới chuẩn 5.0',
      forget_rate: '65%',
    },
    attendance_interaction: {
      last_studied: '8 ngày trước',
      days_studied: 4,
      questions_asked: 0,
      flashcards_reviewed: 10,
    },
    gamification: {
      level: 'Lv 1',
      badge: '🥚 Trứng',
      xp_total: 80,
      xp_this_week: 0,
    },
  },
];

// === Announcements Data ===
export const announcementData: Announcement[] = [
  {
    announcement_id: 'ANC_001',
    scope: 'all',
    content_html: '<p>Chào mừng toàn thể Giảng viên và Học viên đến với học kỳ mới tại <strong>EduTrack English</strong>! Chúc các bạn có một kỳ học thật hiệu quả và đạt kết quả xuất sắc.</p>',
    sender_id: 'STF001',
    sender_name: 'Ban Quản lý Trung tâm',
    sender_role: 'admin',
    created_at: '2026-11-19T09:00:00',
  },
];

export function createAnnouncement(data: {
  scope: 'all' | 'classes';
  target_class_ids?: string[];
  target_class_names?: string[];
  content_html: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
}): Announcement {
  const newAnc: Announcement = {
    announcement_id: `ANC_${Date.now()}`,
    scope: data.scope,
    target_class_ids: data.target_class_ids,
    target_class_names: data.target_class_names,
    content_html: data.content_html,
    sender_id: data.sender_id,
    sender_name: data.sender_name,
    sender_role: data.sender_role,
    created_at: new Date().toISOString(),
  };
  announcementData.unshift(newAnc);
  return newAnc;
}

export function deleteAnnouncement(announcementId: string): boolean {
  const idx = announcementData.findIndex(a => a.announcement_id === announcementId);
  if (idx >= 0) {
    announcementData.splice(idx, 1);
    return true;
  }
  return false;
}




