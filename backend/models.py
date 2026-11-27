# ============================================
# EduTrack - Pydantic Request & Response Models
# ============================================

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal

# Staff & Auth
class LoginRequest(BaseModel):
    staff_id: Optional[str] = None
    student_id: Optional[str] = None
    identifier: Optional[str] = None
    password: Optional[str] = None

# Students
class CreateStudentRequest(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    campus: Literal['CS1', 'CS2'] = 'CS1'
    class_id: Optional[str] = None
    student_code: Optional[str] = None

class BatchImportStudentRow(BaseModel):
    code: str
    name: str
    email: str
    phone: Optional[str] = None
    campus: str = 'CS1'

class BatchImportRequest(BaseModel):
    students: List[BatchImportStudentRow]

class JoinClassRequest(BaseModel):
    student_id: str
    class_code: str

# Classes
class CreateClassRequest(BaseModel):
    class_code: str
    class_name: str
    course_name: str
    schedule: str
    campus: Literal['CS1', 'CS2'] = 'CS1'
    teacher_id: str
    ta_id: str
    total_sessions: int = 48
    max_students: int = 25

# Attendance
class MarkAttendanceItem(BaseModel):
    student_id: str
    status: Literal['present', 'late', 'absent', 'excused']

class MarkAttendanceRequest(BaseModel):
    class_id: str
    session_id: str
    items: List[MarkAttendanceItem]
    marked_by: str = 'STF005'

# Assessments
class CreateAssessmentRequest(BaseModel):
    class_id: str
    title: str
    type: Literal['midterm', 'final', 'quiz'] = 'midterm'
    max_score: float = 100
    weight: float = 30
    date: str
    description: Optional[str] = None

class ScoreEntry(BaseModel):
    student_id: str
    score: float
    feedback: Optional[str] = None

class SaveScoresRequest(BaseModel):
    assessment_id: str
    scores: List[ScoreEntry]
    entered_by: str = 'STF003'

# Quizzes
class CreateQuizRequest(BaseModel):
    class_id: str
    title: str
    topic: str
    total_questions: int = 20
    max_score: float = 100
    due_date: str

# Support Tickets
class CreateTicketRequest(BaseModel):
    student_id: str
    class_id: Optional[str] = None
    category: Literal['lesson', 'attendance', 'score', 'schedule', 'technical', 'tuition', 'other']
    title: str
    description: str
    priority: Literal['low', 'medium', 'high'] = 'medium'

class ReplyTicketRequest(BaseModel):
    sender_id: str
    sender_name: str
    sender_role: str
    content: str
    is_internal_note: bool = False

class UpdateTicketStatusRequest(BaseModel):
    status: Literal['new', 'in_progress', 'waiting_student', 'escalated', 'resolved', 'closed', 'reopened']
    escalated_to: Optional[str] = None
    escalation_reason: Optional[str] = None

class ReopenTicketRequest(BaseModel):
    student_id: str
    student_name: str
    reason: str

class ManagerOverrideTicketRequest(BaseModel):
    manager_id: str
    manager_name: str
    action: Literal['in_progress', 'resolved'] = 'in_progress'
    notes: Optional[str] = None

# Interventions
class CreateInterventionRequest(BaseModel):
    student_id: str
    class_id: Optional[str] = None
    issue: str
    action: str
    performed_by: str
    performed_by_name: str
    follow_up_date: Optional[str] = None
    result: Optional[str] = None

# Alert Rules
class ToggleAlertRuleRequest(BaseModel):
    is_active: bool

# Teachers
class TeacherInviteRequest(BaseModel):
    email: str

class TeacherTransferRequest(BaseModel):
    target_teacher_id: str

# Center Classes
class CreateCenterClassRequest(BaseModel):
    course_name: str
    class_name: str
    teacher_id: str
    teacher_name: Optional[str] = None
    class_type: Literal['regular', 'self_study', 'communication', 'trial'] = 'regular'
    days_of_week: List[str]
    start_date: str
    weeks_count: int = 8
    unit_start: int = 1
    unit_end: int = 15
    include_sample_assignments: bool = True
    lessons_per_week: int = 1
    total_sessions: Optional[int] = None
    max_students: Optional[int] = 20
    auto_lock_months: Optional[int] = 1
    rules: Optional[str] = None
    show_rules_to_students: bool = True

class ChangeClassTeacherRequest(BaseModel):
    teacher_id: str
    teacher_name: Optional[str] = None

class SubstituteTeacherRequest(BaseModel):
    substitute_teacher_id: Optional[str] = None
    substitute_teacher_name: Optional[str] = None
    reason: Optional[str] = None

class CreateAnnouncementRequest(BaseModel):
    scope: str = "all"
    target_class_ids: Optional[List[str]] = None
    target_class_names: Optional[List[str]] = None
    content_html: str
    sender_id: str
    sender_name: str
    sender_role: str

# Account & Settings
class ChangePasswordRequest(BaseModel):
    user_id: str
    new_password: str

class UpdateSettingsRequest(BaseModel):
    notify_invite_rejection: Optional[bool] = None
    center_logo: Optional[str] = None

class CreateFeedbackRequest(BaseModel):
    user_id: str
    user_name: str
    category: str
    content: str

class UpdateAvatarRequest(BaseModel):
    user_id: str
    avatar_url: str

class GradeSubmissionRequest(BaseModel):
    teacher_id: str
    role: str
    score: float
    teacher_feedback: str
    xp_awarded: Optional[int] = None




