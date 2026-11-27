// ============================================
// EduTrack - Utility Functions
// ============================================

import type { Role, Campus, AttendanceStatus, TicketStatus, TicketPriority, TicketCategory, AlertLevel, StudentStatus, ClassStatus, EnrollmentStatus, TrendDirection } from './types.ts';

// === Role Labels ===
export const roleLabels: Record<Role, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giảng viên',
  teaching_assistant: 'Trợ giảng',
  student: 'Học viên',
};

export const campusLabels: Record<Campus, string> = {
  CS1: 'Cơ sở 1',
  CS2: 'Cơ sở 2',
};

export const attendanceLabels: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  absent: 'Vắng mặt',
  late: 'Đi muộn',
  excused: 'Có phép',
};

export const attendanceBadgeClass: Record<AttendanceStatus, string> = {
  present: 'badge-green',
  absent: 'badge-red',
  late: 'badge-amber',
  excused: 'badge-blue',
};

export const ticketStatusLabels: Record<TicketStatus, string> = {
  new: 'Mới',
  assigned: 'Đã giao',
  in_progress: 'Đang xử lý',
  waiting_student: 'Chờ học viên',
  escalated: 'Đã chuyển cấp',
  resolved: 'Đã xử lý',
  closed: 'Đã đóng',
  reopened: 'Mở lại',
};

export const ticketStatusBadgeClass: Record<TicketStatus, string> = {
  new: 'badge-blue',
  assigned: 'badge-teal',
  in_progress: 'badge-amber',
  waiting_student: 'badge-gray',
  escalated: 'badge-red',
  resolved: 'badge-green',
  closed: 'badge-gray',
  reopened: 'badge-amber',
};

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export const ticketPriorityBadgeClass: Record<TicketPriority, string> = {
  low: 'badge-gray',
  medium: 'badge-blue',
  high: 'badge-amber',
  urgent: 'badge-red',
};

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  lesson: 'Bài học',
  assignment: 'Bài tập',
  score: 'Điểm số',
  attendance: 'Chuyên cần',
  schedule: 'Lịch học',
  other: 'Khác',
};

export const alertLevelLabels: Record<AlertLevel, string> = {
  normal: 'Bình thường',
  watch: 'Cần theo dõi',
  priority: 'Cần hỗ trợ ưu tiên',
  pending: 'Chờ thẩm định (< 3 buổi)',
};

export const alertLevelBadgeClass: Record<AlertLevel, string> = {
  normal: 'badge-green',
  watch: 'badge-amber',
  priority: 'badge-red',
  pending: 'badge-gray',
};

export const studentStatusLabels: Record<StudentStatus, string> = {
  active: 'Đang học',
  inactive: 'Ngừng học',
  graduated: 'Đã tốt nghiệp',
  suspended: 'Tạm dừng',
};

export const classStatusLabels: Record<ClassStatus, string> = {
  upcoming: 'Sắp khai giảng',
  in_progress: 'Đang học',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

export const classStatusBadgeClass: Record<ClassStatus, string> = {
  upcoming: 'badge-blue',
  in_progress: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
};

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  active: 'Đang học',
  completed: 'Hoàn thành',
  dropped: 'Bỏ học',
  transferred: 'Chuyển lớp',
};

export const trendLabels: Record<TrendDirection, string> = {
  up: '↑ Tăng',
  down: '↓ Giảm',
  stable: '→ Ổn định',
  insufficient_data: '? Chưa đủ dữ liệu',
};

export const trendBadgeClass: Record<TrendDirection, string> = {
  up: 'badge-green',
  down: 'badge-red',
  stable: 'badge-blue',
  insufficient_data: 'badge-gray',
};

// === Date/Time Formatting ===
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return formatDate(dateStr);
}

// === Number Formatting ===
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}%`;
}

export function formatScore(score: number | null | undefined, maxScore?: number): string {
  if (score === null || score === undefined) return 'Chưa có';
  if (maxScore) return `${score}/${maxScore}`;
  return String(score);
}

// === SVG Icons (inline, no external dependency) ===
export const icons = {
  dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
  students: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  classes: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  attendance: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  assessment: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  quiz: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  progress: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  support: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  reports: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  upload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  chevronLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  arrowUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrowDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  send: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  logout: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  alertCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  externalLink: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  history: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>',
  target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  teacher: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
};

// === Toast Notifications ===

export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const iconMap = {
    success: icons.check,
    error: icons.close,
    warning: icons.warning,
    info: icons.info,
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type]}</span>
    <span class="toast-text" style="flex:1;font-size:var(--text-sm)"></span>
    <button class="btn-ghost btn-icon btn-sm" onclick="this.parentElement.remove()">${icons.close}</button>
  `;
  // textContent: messages often embed user input (names, emails)
  toast.querySelector('.toast-text')!.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => toast.remove(), 4000);
}

// === Computed Helpers ===
// Công thức chuẩn hóa UC-10: Trọng số Có mặt=1.0, Muộn=0.5, Phép=0.5, Vắng=0.0
export function getAttendanceRate(studentId: string, classId: string, attendanceRecords: { student_id: string; class_id: string; status: AttendanceStatus }[]): number | null {
  const records = attendanceRecords.filter(a => a.student_id === studentId && a.class_id === classId);
  if (records.length === 0) return null;
  const weightedScore = records.reduce((sum, a) => {
    if (a.status === 'present') return sum + 1.0;
    if (a.status === 'late' || a.status === 'excused') return sum + 0.5;
    return sum; // absent = 0.0
  }, 0);
  return Math.round((weightedScore / records.length) * 100);
}

// === Simple Bar Chart (CSS-only) ===
export function renderBarChart(data: { label: string; value: number; max: number; color: string }[], height = 200): string {
  const maxVal = Math.max(...data.map(d => d.max), 1);
  return `
    <div style="display:flex;align-items:flex-end;gap:var(--space-2);height:${height}px;padding-top:var(--space-4)">
      ${data.map(d => {
        const pct = (d.value / maxVal) * 100;
        return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:var(--space-1);height:100%">
            <span style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary)">${d.value}</span>
            <div style="width:100%;flex:1;display:flex;align-items:flex-end">
              <div style="width:100%;height:${pct}%;background:${d.color};border-radius:var(--radius-sm) var(--radius-sm) 0 0;min-height:4px;transition:height 0.5s ease"></div>
            </div>
            <span style="font-size:10px;color:var(--text-tertiary);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${d.label}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// === Simple Donut Chart (SVG) ===
export function renderDonutChart(value: number, max: number, color: string, label: string, size = 120): string {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
      <svg width="${size}" height="${size}" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="var(--gray-100)" stroke-width="8"/>
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="8" 
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
          stroke-linecap="round" transform="rotate(-90 50 50)"
          style="transition: stroke-dashoffset 1s ease-in-out"/>
        <text x="50" y="46" text-anchor="middle" font-size="18" font-weight="700" fill="var(--text-primary)">${Math.round(pct)}%</text>
        <text x="50" y="60" text-anchor="middle" font-size="8" fill="var(--text-tertiary)">${value}/${max}</text>
      </svg>
      <span style="font-size:var(--text-xs);color:var(--text-secondary);text-align:center">${label}</span>
    </div>
  `;
}

// === Trend Mini Line ===
export function renderTrendLine(values: number[], color: string, width = 80, height = 30): string {
  if (values.length < 2) return '<span style="color:var(--text-tertiary);font-size:var(--text-xs)">—</span>';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
