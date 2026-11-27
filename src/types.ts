// ============================================
// EduTrack - Type Definitions
// Hệ thống quản lý tiến độ học tập
// ============================================

// === Enums ===

export type Role = 'admin' | 'teacher' | 'teaching_assistant' | 'student';

export type Campus = 'CS1' | 'CS2';

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'transferred';

export type ClassStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AssessmentType = 'midterm' | 'final' | 'quiz' | 'assignment' | 'project';

export type QuizStatus = 'not_started' | 'in_progress' | 'submitted' | 'no_data';

export type TicketCategory = 'lesson' | 'assignment' | 'score' | 'attendance' | 'schedule' | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'new' | 'assigned' | 'in_progress' | 'waiting_student' | 'escalated' | 'resolved' | 'closed' | 'reopened';

export type AlertLevel = 'normal' | 'watch' | 'priority' | 'pending';

export type TrendDirection = 'up' | 'down' | 'stable' | 'insufficient_data';

// === Core Entities ===

export interface Student {
  student_id: string;
  student_code: string;
  full_name: string;
  email: string;
  phone: string;
  status: StudentStatus;
  campus: Campus;
  enrollment_date: string;
  avatar_initials: string;
  date_of_birth?: string;
  notes?: string;
}

export interface Class {
  class_id: string;
  class_code: string;
  class_name: string;
  course_name: string;
  schedule: string;
  campus: Campus;
  status: ClassStatus;
  start_date: string;
  end_date: string;
  total_sessions: number;
  completed_sessions: number;
  max_students: number;
  current_students: number;
  author_name?: string;
  lesson_count?: number;
}

export interface CourseLesson {
  lesson_id: string;
  class_id: string;
  order: number;
  title: string;
  duration_minutes: number;
  skill_tag: 'Listening' | 'Speaking' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary';
  description?: string;
  status: 'published' | 'draft';
  author_name?: string;
}

export interface CourseVocabulary {
  vocab_id: string;
  class_id: string;
  word: string;
  phonetic: string;
  part_of_speech: string;
  meaning_vi: string;
  example_en: string;
}

export interface CourseExamSample {
  exam_id: string;
  class_id: string;
  title: string;
  type: string;
  duration_minutes: number;
  total_questions: number;
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao';
}

export interface Enrollment {
  enrollment_id: string;
  student_id: string;
  class_id: string;
  start_date: string;
  end_date: string;
  status: EnrollmentStatus;
}

export interface Staff {
  staff_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  campus: Campus;
  avatar_initials: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface StudentAssignment {
  id: string;
  class_id: string;
  title: string;
  description: string;
  deadline: string;
  max_score: number;
  format: 'file' | 'link' | 'code' | 'text';
  instructions?: string;
  created_at: string;
  assigned_by: string;
}

export interface StudentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late' | 'resubmit_required';
  attachment_name?: string;
  attachment_size?: string;
  submission_text?: string;
  submission_link?: string;
  score?: number | null;
  teacher_feedback?: string;
  graded_at?: string;
  graded_by?: string;
  audio_url?: string;
  audio_duration?: string;
  audio_transcript?: string;
  submission_type?: 'writing' | 'speaking' | 'quiz' | 'file';
  word_count?: number;
  xp_awarded?: number;
}

export interface MakeupClassOption {
  option_id: string;
  missed_topic: string;
  target_class_id: string;
  target_class_name: string;
  target_class_code: string;
  target_campus: Campus;
  date: string;
  time: string;
  room: string;
  teacher_name: string;
  available_slots: number;
  mode: 'in_person' | 'online_zoom';
}

export interface MakeupBooking {
  booking_id: string;
  student_id: string;
  missed_session_title: string;
  target_class_code: string;
  target_campus: Campus;
  date: string;
  time: string;
  room: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  booked_at: string;
  notes?: string;
}

export interface ClassAssignment {
  assignment_id: string;
  class_id: string;
  teacher_id: string;
  teaching_assistant_id: string;
  start_date: string;
  end_date: string;
}

export interface Session {
  session_id: string;
  class_id: string;
  session_number: number;
  date: string;
  start_time: string;
  end_time: string;
  topic?: string;
  is_completed: boolean;
  teacher_id?: string;
  teacher_name?: string;
  substitute_teacher_id?: string;
  substitute_teacher_name?: string;
  substitute_reason?: string;
  room?: string;
}

// === Learning Data ===

export interface Attendance {
  attendance_id: string;
  student_id: string;
  class_id: string;
  session_id: string;
  status: AttendanceStatus;
  recorded_at: string;
  recorded_by: string;
  notes?: string;
}

export interface Assessment {
  assessment_id: string;
  class_id: string;
  title: string;
  type: AssessmentType;
  max_score: number;
  weight?: number;
  date: string;
  description?: string;
}

export interface AssessmentResult {
  result_id: string;
  student_id: string;
  assessment_id: string;
  score: number | null; // null = chưa có dữ liệu, != 0
  entered_by: string;
  entered_at: string;
  last_modified_at?: string;
  last_modified_by?: string;
  notes?: string;
}

export interface Quiz {
  quiz_id: string;
  class_id: string;
  title: string;
  total_questions: number;
  max_score: number;
  due_date: string;
  topic?: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score?: number;
}

export interface QuizAttempt {
  attempt_id: string;
  student_id: string;
  quiz_id: string;
  score: number | null;
  correct_answers: number;
  total_questions: number;
  time_spent_minutes: number;
  status: QuizStatus;
  submitted_at?: string;
}

// === Support System ===

export interface SupportTicket {
  ticket_id: string;
  ticket_code: string;
  student_id: string;
  class_id: string;
  category: TicketCategory;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string;
  created_at: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  escalated_at?: string;
  escalated_by?: string;
  escalation_reason?: string;
  sla_deadline: string;
  is_sla_breached: boolean;
  is_manager_overridden?: boolean;
  manager_override_at?: string;
  reopen_count?: number;
  reopened_at?: string;
  reopen_first_reply_at?: string;
  reopen_resolved_at?: string;
}

export interface SupportMessage {
  message_id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: Role;
  content: string;
  sent_at: string;
  is_internal_note: boolean;
  attachment_name?: string;
}

// === Analytics ===

export interface ProgressSnapshot {
  snapshot_id: string;
  student_id: string;
  class_id: string;
  period: string;
  attendance_rate: number | null;
  assignment_completion_rate: number | null;
  avg_assessment_score: number | null;
  avg_quiz_score: number | null;
  trend: TrendDirection;
  alert_level: AlertLevel;
  generated_at: string;
  data_completeness: number;
  notes?: string;
}

export interface InterventionRecord {
  intervention_id: string;
  student_id: string;
  class_id: string;
  issue: string;
  action: string;
  performed_by: string;
  performed_by_name: string;
  result?: string;
  follow_up_date?: string;
  created_at: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface FeedbackRecord {
  feedback_id: string;
  student_id: string;
  class_id: string;
  period: string;
  observation: string;
  evidence: string;
  interpretation: string;
  recommended_action: string;
  owner: string;
  owner_role: Role;
  follow_up_date: string;
  outcome?: string;
  is_approved: boolean;
  approved_by?: string;
  created_at: string;
  created_by: string;
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  user_name: string;
  user_role: Role;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: string;
  timestamp: string;
  ip_address?: string;
}

// === SLA Config ===

export interface SLAConfig {
  max_first_response_hours: number;
  max_resolution_hours: number;
  business_hours_start: string;
  business_hours_end: string;
  working_days: number[];
  escalation_rules: EscalationRule[];
  pause_on_waiting_student: boolean;
}

export interface EscalationRule {
  condition: string;
  hours_threshold: number;
  escalate_to: Role;
  notification: string;
}

// === Alert Config ===

export interface AlertRule {
  rule_id: string;
  name: string;
  description: string;
  condition_type: string;
  threshold: number;
  alert_level: AlertLevel;
  is_active: boolean;
}

// === UI State ===

export interface AppState {
  currentUser: Staff | null;
  currentPage: string;
  selectedCampus: Campus | 'all';
  selectedClassId: string | null;
  isLoggedIn: boolean;
  sidebarOpen: boolean;
}

export interface DashboardKPI {
  label: string;
  value: string | number;
  change?: string;
  changeDirection?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

// === Import Data ===

export interface ImportResult {
  total_rows: number;
  successful: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

// === Teacher Management ===
export interface TeacherItem {
  staff_id: string;
  full_name: string;
  email: string;
  phone: string;
  campus: Campus;
  avatar_initials: string;
  is_active: boolean;
  open_classes_count: number;
  total_students_count: number;
}

export interface TeacherInvite {
  invite_id: string;
  email: string;
  token: string;
  invite_link?: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'revoked';
}

export interface WeekDaySchedule {
  day_index: number;
  day_name: string;
  date_str: string;
  full_date: string;
  is_today: boolean;
  session?: {
    session_id: string;
    time: string;
    class_name: string;
    session_name: string;
  } | null;
}

export interface TeacherDetailKPIs {
  active_classes: number;
  total_students: number;
  avg_score: string | number;
  satisfaction: string | number;
  month_sessions: number;
  seniority: string;
}

// === Center Classes ===
export type CenterClassType = 'regular' | 'self_study' | 'communication' | 'trial';

export interface CenterClassItem {
  class_id: string;
  class_code: string;
  class_name: string;
  course_name: string;
  schedule?: string;
  campus?: Campus;
  status: 'in_progress' | 'upcoming' | 'completed' | 'cancelled';
  start_date: string;
  end_date?: string;
  total_sessions: number;
  completed_sessions: number;
  max_students: number;
  current_students: number;
  class_type: CenterClassType;
  rules_content?: string;
  show_rules_to_students?: boolean;
  avg_score?: string;
  teacher_id?: string;
  teacher_name?: string;
  days_of_week?: string;
}

export interface CourseCatalogItem {
  course_id: string;
  course_name: string;
  units_count: number;
}

// === Student Monitoring & Early Warning ===
export interface ActivityDay {
  date: string;
  label: string;
  active_minutes: number;
  is_today: boolean;
}

export interface StudentMonitoringItem {
  student_id: string;
  student_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_initials: string;
  class_id: string;
  class_name: string;
  course_name?: string;
  cefr_level?: string;
  alert_level: 'normal' | 'watch' | 'priority'; // Ổn | Chú ý | Nguy cơ
  status_note: string; // VD: "Học viên mới (miễn cảnh báo)"
  // Khối 2: KPI
  course_progress: number; // 0%
  avg_score: string; // '—'
  avg_score_sub: string; // 'Chưa có điểm bài tập'
  streak_days: number; // 0
  streak_sub: string; // 'Chưa bắt đầu chuỗi'
  vocab_health_kpi: string; // '—'
  vocab_health_sub: string; // 'Chưa học từ vựng'
  // Khối 3: 14-day activity
  activity_14_days: {
    days: ActivityDay[];
    streak_app_days: number; // 1
    avg_minutes_7_days: string; // '<1 phút/ngày (7 ngày)'
    usage_ratio_note: string; // '1/7 ngày có dùng · 2 phút/ngày có dùng'
  };
  // Khối 4: Vocab health
  vocab_badge: string; // 'Chưa đủ dữ liệu'
  vocab_msg: string; // 'Học viên chưa có từ vựng được mở để luyện.'
  // Khối 5: 50/50 Cards
  progress_completed: {
    lessons_done: number;
    lessons_total: number;
    percent: number;
    on_time_count: number;
    late_count: number;
  };
  results_weakness: {
    avg_score: string;
    avg_score_note: string;
    forget_rate: string;
  };
  // Khối 6: Chuyên cần & tương tác
  attendance_interaction: {
    last_studied: string;
    days_studied: number;
    questions_asked: number;
    flashcards_reviewed: number;
  };
  // Khối 7: Điểm thưởng & cấp độ
  gamification: {
    level: string;
    badge: string;
    xp_total: number;
    xp_this_week: number;
  };
}

// === Announcements (Thông báo toàn trung tâm) ===
export interface Announcement {
  announcement_id: string;
  scope: 'all' | 'classes';
  target_class_ids?: string[];
  target_class_names?: string[];
  content_html: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
}



