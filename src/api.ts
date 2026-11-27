// ============================================
// EduTrack - Python API Service Client
// Connects Frontend to FastAPI Backend (port 8000)
// ============================================

// Dev: separate uvicorn on :8000. Prod build: served by FastAPI itself, so same-origin '/api'. VITE_API_URL overrides both.
export const API_BASE_URL: string = import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api');

let isBackendOnline = false;

export async function checkBackendOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    isBackendOnline = res.ok;
    return isBackendOnline;
  } catch {
    isBackendOnline = false;
    return false;
  }
}

export function getIsBackendOnline(): boolean {
  return isBackendOnline;
}

// === API Fetch Helper ===
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    isBackendOnline = true;
    return await res.json();
  } catch (err) {
    console.warn(`[Python API] Request to ${endpoint} failed, falling back to local state:`, err);
    return null;
  }
}

// === Health & Stats ===
export async function fetchDashboardStats(campus = 'all') {
  return apiFetch<any>(`/dashboard/stats?campus=${campus}`);
}

// === Students ===
export async function fetchStudentsApi(campus = 'all', status = 'all', search?: string) {
  const query = new URLSearchParams({ campus, status });
  if (search) query.append('search', search);
  return apiFetch<any[]>(`/students?${query.toString()}`);
}

export async function fetchStudentDetailApi(studentId: string) {
  return apiFetch<any>(`/students/${studentId}`);
}

export async function createStudentApi(data: {
  full_name: string;
  email: string;
  phone?: string;
  campus: 'CS1' | 'CS2';
  class_id?: string;
  student_code?: string;
}) {
  return apiFetch<{ message: string; student_id: string; student_code: string }>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function importStudentsApi(students: Array<{ code: string; name: string; email: string; phone?: string; campus: string }>) {
  return apiFetch<{ message: string; count: number }>('/students/import', {
    method: 'POST',
    body: JSON.stringify({ students }),
  });
}

// === Classes ===
export async function fetchClassesApi(campus = 'all') {
  return apiFetch<any[]>(`/classes?campus=${campus}`);
}

export async function fetchClassDetailApi(classId: string) {
  return apiFetch<any>(`/classes/${classId}`);
}

export async function createClassApi(data: {
  class_code: string;
  class_name: string;
  course_name: string;
  schedule: string;
  campus: 'CS1' | 'CS2';
  teacher_id: string;
  ta_id: string;
  total_sessions?: number;
  max_students?: number;
}) {
  return apiFetch<{ message: string; class_id: string }>('/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// === Attendance ===
export async function fetchAttendanceApi(classId: string, sessionId?: string) {
  const q = sessionId ? `?class_id=${classId}&session_id=${sessionId}` : `?class_id=${classId}`;
  return apiFetch<any[]>(`/attendance${q}`);
}

export async function markAttendanceApi(data: {
  class_id: string;
  session_id: string;
  items: Array<{ student_id: string; status: 'present' | 'late' | 'absent' | 'excused' }>;
  marked_by?: string;
}) {
  return apiFetch<{ message: string; count: number }>('/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// === Assessments & Scores ===
export async function fetchAssessmentsApi(classId?: string) {
  const q = classId ? `?class_id=${classId}` : '';
  return apiFetch<any[]>(`/assessments${q}`);
}

export async function fetchAssessmentScoresApi(assessmentId: string) {
  return apiFetch<any[]>(`/assessments/${assessmentId}/scores`);
}

export async function createAssessmentApi(data: {
  class_id: string;
  title: string;
  type: 'midterm' | 'final' | 'quiz';
  max_score: number;
  weight: number;
  date: string;
  description?: string;
}) {
  return apiFetch<{ message: string; assessment_id: string }>('/assessments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function saveAssessmentScoresApi(data: {
  assessment_id: string;
  scores: Array<{ student_id: string; score: number; feedback?: string }>;
  entered_by?: string;
}) {
  return apiFetch<{ message: string; count: number }>('/assessments/scores', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// === Quizzes ===
export async function fetchQuizzesApi(classId?: string) {
  const q = classId ? `?class_id=${classId}` : '';
  return apiFetch<any[]>(`/quizzes${q}`);
}

export async function createQuizApi(data: {
  class_id: string;
  title: string;
  topic: string;
  total_questions: number;
  max_score: number;
  due_date: string;
}) {
  return apiFetch<{ message: string; quiz_id: string }>('/quizzes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// === Support Tickets ===
export async function fetchTicketsApi(status = 'all', priority = 'all', search?: string) {
  const q = new URLSearchParams({ status, priority });
  if (search) q.append('search', search);
  return apiFetch<any[]>(`/tickets?${q.toString()}`);
}

export async function fetchTicketMessagesApi(ticketId: string) {
  return apiFetch<any[]>(`/tickets/${ticketId}/messages`);
}

export async function createTicketApi(data: {
  student_id: string;
  class_id?: string;
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}) {
  return apiFetch<{ message: string; ticket_id: string; ticket_code: string }>('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function replyTicketApi(ticketId: string, data: {
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  is_internal_note?: boolean;
}) {
  return apiFetch<{ message: string; message_id: string }>(`/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTicketStatusApi(ticketId: string, data: {
  status: string;
  escalated_to?: string;
  escalation_reason?: string;
}) {
  return apiFetch<{ message: string }>(`/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// === Progress & Interventions ===
export async function fetchProgressApi() {
  return apiFetch<any[]>('/progress');
}

export async function createInterventionApi(data: {
  student_id: string;
  class_id?: string;
  issue: string;
  action: string;
  performed_by: string;
  performed_by_name: string;
  follow_up_date?: string;
  result?: string;
}) {
  return apiFetch<{ message: string; intervention_id: string }>('/interventions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// === Risk Matrix & Alert Rules ===
export async function fetchRiskMatrixApi() {
  return apiFetch<{ rules: any[]; risk_students: any[] }>('/risk-matrix');
}

export async function toggleAlertRuleApi(ruleId: string, isActive: boolean) {
  return apiFetch<{ message: string }>(`/alert-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

// === Audit Logs ===
export async function fetchAuditLogsApi(action = 'all', entity = 'all') {
  return apiFetch<any[]>(`/audit-logs?action=${action}&entity=${entity}`);
}

// === Teachers & Team Management ===
export async function fetchTeachersApi() {
  return apiFetch<{ teachers: any[]; invites: any[] }>('/teachers');
}

export async function fetchTeacherDetailApi(teacherId: string, weekOffset = 0) {
  return apiFetch<any>(`/teachers/${teacherId}?week_offset=${weekOffset}`);
}

export async function inviteTeacherApi(email: string) {
  return apiFetch<any>('/teachers/invite', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function deleteTeacherInviteApi(inviteId: string) {
  return apiFetch<{ message: string; invite_id: string }>(`/teachers/invites/${inviteId}`, {
    method: 'DELETE',
  });
}

export async function transferTeacherClassesApi(teacherId: string, targetTeacherId: string) {
  return apiFetch<{ message: string }>(`/teachers/${teacherId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ target_teacher_id: targetTeacherId }),
  });
}

export async function deleteTeacherApi(teacherId: string) {
  return apiFetch<{ message: string }>(`/teachers/${teacherId}`, {
    method: 'DELETE',
  });
}

// === Center Classes ===
export async function fetchCenterClassesApi(params?: { teacher_id?: string; role?: string }) {
  const query = new URLSearchParams();
  if (params?.teacher_id) query.set('teacher_id', params.teacher_id);
  if (params?.role) query.set('role', params.role);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<any[]>(`/center-classes${qStr}`);
}

export async function fetchCenterClassDetailApi(classId: string, params?: { teacher_id?: string; role?: string }) {
  const query = new URLSearchParams();
  if (params?.teacher_id) query.set('teacher_id', params.teacher_id);
  if (params?.role) query.set('role', params.role);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<any>(`/center-classes/${classId}${qStr}`);
}

export async function lockCenterClassApi(classId: string, role: string) {
  return apiFetch<{ message: string }>(`/center-classes/${classId}/lock?role=${role}`, {
    method: 'POST',
  });
}

export async function deleteCenterClassApi(classId: string, role: string) {
  return apiFetch<{ message: string }>(`/center-classes/${classId}?role=${role}`, {
    method: 'DELETE',
  });
}

export async function updateCenterClassSettingsApi(classId: string, settings: any) {
  return apiFetch<{ message: string }>(`/center-classes/${classId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function createCenterClassApi(data: any) {
  return apiFetch<{ message: string; class_id: string; class_code: string; class_name: string }>('/center-classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changeClassTeacherApi(classId: string, teacherId: string, teacherName?: string) {
  return apiFetch<{ message: string }>(`/center-classes/${classId}/teacher`, {
    method: 'PATCH',
    body: JSON.stringify({ teacher_id: teacherId, teacher_name: teacherName }),
  });
}

// === Center Schedule / Sessions ===
export async function fetchSessionsApi(classId?: string) {
  const query = classId ? `?class_id=${classId}` : '';
  return apiFetch<any[]>(`/sessions${query}`);
}

export async function updateSessionSubstituteApi(
  sessionId: string,
  substituteTeacherId?: string,
  substituteTeacherName?: string,
  reason?: string
) {
  return apiFetch<{ success: boolean; session_id: string }>(`/sessions/${sessionId}/substitute`, {
    method: 'POST',
    body: JSON.stringify({
      substitute_teacher_id: substituteTeacherId || null,
      substitute_teacher_name: substituteTeacherName || null,
      reason: reason || null,
    }),
  });
}

// === Announcements ===
export async function fetchAnnouncementsApi(scope?: string) {
  const query = scope && scope !== 'all' ? `?scope=${scope}` : '';
  return apiFetch<any[]>(`/announcements${query}`);
}

export async function createAnnouncementApi(data: {
  scope: 'all' | 'classes';
  target_class_ids?: string[];
  target_class_names?: string[];
  content_html: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
}) {
  return apiFetch<any>('/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAnnouncementApi(announcementId: string) {
  return apiFetch<{ message: string; announcement_id: string }>(`/announcements/${announcementId}`, {
    method: 'DELETE',
  });
}

// === Account & Settings ===
export async function getAccountSettingsApi() {
  return apiFetch<{ notify_invite_rejection: boolean; center_logo: string }>('/account/settings');
}

export async function updateAccountSettingsApi(data: { notify_invite_rejection?: boolean; center_logo?: string }) {
  return apiFetch<{ message: string }>('/account/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePasswordApi(data: { user_id: string; new_password: string }) {
  return apiFetch<{ message: string }>('/account/password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitFeedbackApi(data: { user_id: string; user_name: string; category: string; content: string }) {
  return apiFetch<{ message: string; feedback_id: string }>('/account/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAvatarApi(data: { user_id: string; avatar_url: string }) {
  return apiFetch<{ message: string; avatar_url: string }>('/account/avatar', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// === Teacher Grading & Student Monitoring APIs ===
export async function fetchGradingSubmissionsApi(params?: {
  role?: string;
  teacher_id?: string;
  class_id?: string;
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.role) query.append('role', params.role);
  if (params?.teacher_id) query.append('teacher_id', params.teacher_id);
  if (params?.class_id && params.class_id !== 'all') query.append('class_id', params.class_id);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const qs = query.toString();
  return apiFetch<any[]>(`/grading/submissions${qs ? `?${qs}` : ''}`);
}

export async function submitGradeApi(submissionId: string, data: {
  teacher_id: string;
  role: string;
  score: number;
  teacher_feedback: string;
  xp_awarded?: number;
}) {
  return apiFetch<{ message: string; submission_id: string; score: number; teacher_feedback: string; xp_awarded: number }>(
    `/grading/submissions/${submissionId}/grade`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function fetchTeacherStudentsApi(params?: { role?: string; teacher_id?: string }) {
  const query = new URLSearchParams();
  if (params?.role) query.append('role', params.role);
  if (params?.teacher_id) query.append('teacher_id', params.teacher_id);
  const qs = query.toString();
  return apiFetch<any[]>(`/teacher/students${qs ? `?${qs}` : ''}`);
}





