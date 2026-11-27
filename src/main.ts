// ============================================
// EduTrack - Main Application Entry Point
// ============================================

import './index.css';
import { getState, setState, subscribe, logout, canAccessPage } from './state.ts';
import { roleLabels, icons, ticketPriorityLabels, ticketStatusLabels, showToast, formatTimeAgo, formatDate } from './utils.ts';
import {
  studentData, classData, ticketData, messageData,
  studentAssignmentData, studentSubmissionData, classAssignmentData,
  enrollmentData, makeupBookingData, quizData
} from './data.ts';
import { router } from './router.ts';
import { renderLoginPage, initLoginPage } from './pages/login.ts';
import { renderDashboardPage, initDashboardPage } from './pages/dashboard.ts';
import { renderStudentsPage, initStudentsPage } from './pages/students.ts';
import { renderStudentDetailPage, initStudentDetailPage } from './pages/student-detail.ts';
import { renderClassesPage, initClassesPage } from './pages/classes.ts';
import { renderCoursesPage, initCoursesPage } from './pages/courses.ts';
import { renderClassDetailPage, initClassDetailPage } from './pages/class-detail.ts';
import { renderAttendancePage, initAttendancePage } from './pages/attendance.ts';
import { renderAssessmentsPage, initAssessmentsPage } from './pages/assessments.ts';
import { renderQuizzesPage, initQuizzesPage } from './pages/quizzes.ts';
// import { renderProgressPage, initProgressPage } from './pages/progress.ts';
import { renderSupportPage, initSupportPage } from './pages/support.ts';
import { renderReportsPage, initReportsPage } from './pages/reports.ts';
import { renderStudentDashboardPage, initStudentDashboardPage } from './pages/student-dashboard.ts';
import { renderStudentAssignmentsPage, initStudentAssignmentsPage } from './pages/student-assignments.ts';
import { renderStudentSchedulePage, initStudentSchedulePage } from './pages/student-schedule.ts';
import { renderSchedulePage, initSchedulePage } from './pages/schedule.ts';
import { renderStudentQuizzesPage, initStudentQuizzesPage } from './pages/student-quizzes.ts';
import { renderStudentJoinClassPage, initStudentJoinClassPage } from './pages/student-join-class.ts';
import { renderStudentClassDetailPage, initStudentClassDetailPage } from './pages/student-class-detail.ts';
import { renderStudentResultsPage, initStudentResultsPage } from './pages/student-results.ts';
import { renderAuditLogPage, initAuditLogPage } from './pages/audit-log.ts';
import { renderRiskMatrixPage, initRiskMatrixPage } from './pages/risk-matrix.ts';
import { renderImportDataPage, initImportDataPage } from './pages/import-data.ts';
import { renderTeachersPage, initTeachersPage } from './pages/teachers.ts';
import { renderTeacherDetailPage, initTeacherDetailPage } from './pages/teacher-detail.ts';
import { renderAnnouncementsPage, initAnnouncementsPage, checkAndShowUnreadAnnouncementPopup } from './pages/announcements.ts';
import { renderAccountPage, initAccountPage } from './pages/account.ts';
import { renderGradingPage, initGradingPage } from './pages/grading.ts';
import { renderNttToolsModal, initNttToolsModal } from './ntt-tools.ts';
import { checkBackendOnline } from './api.ts';
import type { Role } from './types.ts';

// === Sidebar Navigation Config ===
interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  roles: Role[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// === Support Badge & Notification Synchronizer ===
export interface AppNotificationItem {
  id: string;
  icon: string;
  color: string;
  title: string;
  sub: string;
  link: string;
  time?: string;
  ticketCode?: string;
  detailDescription?: string;
  actionNote?: string;
  isRead?: boolean;
}

function getReadNotifIds(): Set<string> {
  try {
    const raw = localStorage.getItem('edutrack_read_notifs');
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveReadNotifIds(set: Set<string>) {
  try {
    localStorage.setItem('edutrack_read_notifs', JSON.stringify(Array.from(set)));
  } catch { /* ignore */ }
}

const readNotifIds = getReadNotifIds();

export function markNotificationAsRead(id: string) {
  readNotifIds.add(id);
  saveReadNotifIds(readNotifIds);
  updateBadgeUI();
}

export function markAllNotificationsAsRead() {
  const notifs = getUserNotifications();
  notifs.forEach(n => readNotifIds.add(n.id));
  saveReadNotifIds(readNotifIds);
  updateBadgeUI();
  showToast('Đã đánh dấu tất cả thông báo là đã đọc', 'success');
}

export function getUnreadNotificationCount(): number {
  const notifs = getUserNotifications();
  return notifs.filter(n => !readNotifIds.has(n.id)).length;
}

export function getSupportBadgeCount(): number {
  return getUnreadNotificationCount();
}

export function updateBadgeUI() {
  const count = getUnreadNotificationCount();
  const bellBtn = document.getElementById('notification-btn');
  if (bellBtn) {
    const existingBadge = bellBtn.querySelector('.notif-badge-pill');
    if (count > 0) {
      if (existingBadge) {
        existingBadge.textContent = String(count);
      } else {
        const pill = document.createElement('span');
        pill.className = 'notif-badge-pill';
        pill.textContent = String(count);
        bellBtn.appendChild(pill);
      }
    } else {
      existingBadge?.remove();
    }
  }

  // Remove any count badge on the Support link as requested (only bell shows unread count)
  const supportLink = document.querySelector('.sidebar-link[data-nav="support"]');
  supportLink?.querySelector('.link-badge')?.remove();
}

export function getUserNotifications(): AppNotificationItem[] {
  const state = getState();
  const user = state.currentUser;
  if (!user) return [];

  const isStudent = user.role === 'student';
  const currentStudentId = state.currentStudentView || user.staff_id;

  // Student persona: strictly personalized notifications (leave request approval, teacher/TA replies, ticket progress)
  if (isStudent && currentStudentId) {
    const notifs: AppNotificationItem[] = [];
    const myTickets = ticketData.filter(t => t.student_id === currentStudentId);

    // Process tickets by priority
    myTickets.forEach(t => {
      const isLeave = t.category === 'attendance' || t.title.toLowerCase().includes('nghỉ');
      const replies = messageData.filter(m => m.ticket_id === t.ticket_id && m.sender_role !== 'student' && !m.is_internal_note);
      const latestReply = replies.length > 0 ? replies[replies.length - 1] : null;

      if (isLeave) {
        if (t.status === 'resolved') {
          const id = `notif-leave-res-${t.ticket_id}`;
          notifs.push({
            id,
            icon: icons.check,
            color: '#10b981',
            title: 'Đơn xin nghỉ học & học bù đã được chấp thuận!',
            sub: `${t.title} · Trợ giảng đã xếp lịch học bù`,
            link: '#/support',
            time: t.resolved_at || t.created_at,
            ticketCode: t.ticket_code,
            detailDescription: t.description,
            actionNote: 'Trợ giảng Hoàng Văn Em đã duyệt đơn xin nghỉ có phép và sắp xếp cho em học bù vào ca tối Thứ 6 tại Phòng 204. Chúc em thi tốt!',
            isRead: readNotifIds.has(id),
          });
        } else if (t.status === 'in_progress') {
          const id = `notif-leave-prog-${t.ticket_id}`;
          notifs.push({
            id,
            icon: icons.clock,
            color: '#f59e0b',
            title: 'Đơn xin nghỉ học đang được xử lý',
            sub: t.title,
            link: '#/support',
            time: t.created_at,
            ticketCode: t.ticket_code,
            detailDescription: t.description,
            actionNote: 'Yêu cầu đang được ban quản lý học vụ và trợ giảng xếp lớp bù tương ứng.',
            isRead: readNotifIds.has(id),
          });
        }
      } else {
        // Non-leave support ticket: prioritize latest teacher/TA reply
        if (latestReply) {
          const id = `notif-reply-${latestReply.message_id}`;
          notifs.push({
            id,
            icon: icons.support,
            color: '#2563eb',
            title: `${latestReply.sender_name} (${roleLabels[latestReply.sender_role] || 'Trợ giảng'}) đã hồi đáp`,
            sub: `"${latestReply.content.slice(0, 48)}..." (${t.ticket_code})`,
            link: '#/support',
            time: latestReply.sent_at,
            ticketCode: t.ticket_code,
            detailDescription: t.description,
            actionNote: `Tin nhắn hồi đáp từ ${latestReply.sender_name}: "${latestReply.content}"`,
            isRead: readNotifIds.has(id),
          });
        } else if (t.status === 'resolved') {
          const id = `notif-res-${t.ticket_id}`;
          notifs.push({
            id,
            icon: icons.check,
            color: '#10b981',
            title: `Yêu cầu hỗ trợ ${t.ticket_code} đã được xử lý xong`,
            sub: t.title,
            link: '#/support',
            time: t.resolved_at || t.created_at,
            ticketCode: t.ticket_code,
            detailDescription: t.description,
            actionNote: 'Yêu cầu đã được hoàn tất và xử lý thỏa đáng.',
            isRead: readNotifIds.has(id),
          });
        } else if (t.status === 'in_progress') {
          const id = `notif-prog-${t.ticket_id}`;
          notifs.push({
            id,
            icon: icons.clock,
            color: '#f59e0b',
            title: `Yêu cầu hỗ trợ ${t.ticket_code} đang được giải quyết`,
            sub: t.title,
            link: '#/support',
            time: t.created_at,
            ticketCode: t.ticket_code,
            detailDescription: t.description,
            actionNote: 'Đội ngũ học vụ đang tiếp nhận và phân công xử lý theo quy trình.',
            isRead: readNotifIds.has(id),
          });
        }
      }
    });

    // Graded assignment submissions notification for student
    const mySubmissions = studentSubmissionData.filter(s => s.student_id === currentStudentId && s.status === 'graded');
    mySubmissions.forEach(sub => {
      const asn = studentAssignmentData.find(a => a.id === sub.assignment_id);
      const id = `notif-graded-${sub.id}`;
      notifs.push({
        id,
        icon: icons.check,
        color: '#10b981',
        title: `Bài tập đã được chấm: ${asn?.title || 'Bài tập'}`,
        sub: `Điểm: ${sub.score}/${asn?.max_score || 100}đ · "${(sub.teacher_feedback || '').slice(0, 42)}..."`,
        link: '#/student-assignments',
        time: sub.graded_at || sub.submitted_at,
        ticketCode: sub.id,
        detailDescription: `Bài tập "${asn?.title}" đã được Giảng viên/Trợ giảng chấm điểm.\n\n📊 Điểm: ${sub.score}/${asn?.max_score || 100}đ\n💬 Lời nhận xét: "${sub.teacher_feedback || 'Đạt yêu cầu'}"`,
        actionNote: 'Nhấn nút bên dưới để xem bài làm và nhận xét chi tiết của Giảng viên.',
        isRead: readNotifIds.has(id),
      });
    });

    // New assignments assigned to student's enrolled classes
    const myEnrollments = enrollmentData.filter(e => e.student_id === currentStudentId && e.status === 'active');
    const myClassIds = new Set(myEnrollments.map(e => e.class_id));
    const submittedAsnIds = new Set(studentSubmissionData.filter(s => s.student_id === currentStudentId).map(s => s.assignment_id));
    
    studentAssignmentData.filter(a => myClassIds.has(a.class_id)).forEach(asn => {
      const cls = classData.find(c => c.class_id === asn.class_id);
      if (!submittedAsnIds.has(asn.id)) {
        const id = `notif-new-asn-${asn.id}`;
        notifs.push({
          id,
          icon: icons.upload,
          color: '#ea580c',
          title: `Bài tập mới cần làm: ${asn.title}`,
          sub: `Lớp ${cls?.class_code || ''} · Hạn nộp: ${formatDate(asn.deadline)}`,
          link: '#/student-assignments',
          time: asn.created_at,
          ticketCode: asn.id,
          detailDescription: `Giảng viên đã giao bài tập mới cho lớp ${cls?.class_name} (${cls?.class_code}).\n\n📝 Đề bài: ${asn.description}\n⏰ Hạn chót: ${formatDate(asn.deadline)}\n🎯 Thang điểm: ${asn.max_score}đ`,
          actionNote: 'Hãy hoàn thành và nộp bài trước hạn để duy trì điểm chuyên cần.',
          isRead: readNotifIds.has(id),
        });
      }
    });

    // Confirmed makeup bookings
    const myBookings = makeupBookingData.filter(b => b.student_id === currentStudentId);
    myBookings.forEach(b => {
      const id = `notif-booking-${b.booking_id}`;
      notifs.push({
        id,
        icon: icons.target,
        color: '#059669',
        title: `Đã xác nhận ca học bù: ${b.missed_session_title}`,
        sub: `${formatDate(b.date)} (${b.time}) tại ${b.room}`,
        link: '#/student-schedule',
        time: b.booked_at,
        ticketCode: b.booking_id,
        detailDescription: `Hệ thống đã ghép thành công ca học bù cho bạn.\n\n📚 Nội dung: ${b.missed_session_title}\n🏫 Lớp ghép: ${b.target_class_code} (${b.target_campus})\n📍 Địa điểm: ${b.room}\n⏰ Thời gian: ${formatDate(b.date)} lúc ${b.time}${b.notes ? `\n📝 Ghi chú: ${b.notes}` : ''}`,
        actionNote: 'Vui lòng đến đúng giờ để tham gia học bù đầy đủ.',
        isRead: readNotifIds.has(id),
      });
    });

    return notifs;
  }

  // General Staff personas (Admin, Teacher, TA):
  const staffNotifs: AppNotificationItem[] = [];

  // 1. Pending Assignment Submissions from students needing grading
  const pendingSubmissions = studentSubmissionData.filter(s => s.status === 'submitted');
  pendingSubmissions.forEach(sub => {
    const student = studentData.find(st => st.student_id === sub.student_id);
    const asn = studentAssignmentData.find(a => a.id === sub.assignment_id);
    const cls = classData.find(c => c.class_id === asn?.class_id);

    // Filter relevant submissions strictly for teachers / TAs assigned to this class
    if (user.role === 'teacher') {
      const isAssigned = classAssignmentData.some(ca => ca.teacher_id === user.staff_id && ca.class_id === asn?.class_id);
      if (!isAssigned) return;
    } else if (user.role === 'teaching_assistant') {
      const isAssigned = classAssignmentData.some(ca => ca.teaching_assistant_id === user.staff_id && ca.class_id === asn?.class_id);
      if (!isAssigned) return;
    } else if (user.role !== 'admin') {
      return;
    }

    const id = `staff-sub-${sub.id}`;
    staffNotifs.push({
      id,
      icon: icons.upload,
      color: '#2563eb',
      title: `Bài nộp mới: ${student?.full_name || sub.student_id}`,
      sub: `${asn?.title || 'Bài tập'} (${cls?.class_code || ''}) · File: ${sub.attachment_name || 'Bài làm'}`,
      link: (user.role === 'teacher' || user.role === 'teaching_assistant') ? '#/grading' : '#/assessments',
      time: sub.submitted_at,
      ticketCode: sub.id,
      detailDescription: `Học viên ${student?.full_name} (${student?.student_code}) vừa tải file lên nộp bài "${asn?.title}".\n\n🏫 Lớp: ${cls?.class_name} (${cls?.class_code})\n📄 Tệp nộp: ${sub.attachment_name || 'Không có'}\n${sub.submission_link ? `🔗 Đường dẫn: ${sub.submission_link}\n` : ''}📝 Lời nhắn học viên: "${sub.submission_text || 'Em xin gửi bài làm ạ.'}"`,
      actionNote: `Hạn chót: ${asn ? formatDate(asn.deadline) : ''} · Điểm tối đa: ${asn?.max_score || 100}đ.\nGiảng viên hãy vào mục Kiểm tra & Điểm số để chấm bài và gửi nhận xét.`,
      isRead: readNotifIds.has(id),
    });
  });

  // 2. Pending tickets needing attention (strictly filtered per user)
  const pendingTickets = ticketData.filter(t => {
    if (user.role === 'teacher') {
      const isAssignedToMe = t.assigned_to === user.staff_id;
      const isMyClass = classAssignmentData.some(ca => ca.teacher_id === user.staff_id && ca.class_id === t.class_id);
      return (isAssignedToMe || isMyClass) && (t.status === 'new' || t.status === 'in_progress' || t.status === 'escalated');
    }
    if (user.role === 'teaching_assistant') {
      const isAssignedToMe = t.assigned_to === user.staff_id;
      const isMyClass = classAssignmentData.some(ca => ca.teaching_assistant_id === user.staff_id && ca.class_id === t.class_id);
      return (isAssignedToMe || isMyClass) && (t.status === 'new' || t.status === 'in_progress' || t.status === 'escalated');
    }
    if (user.role === 'admin') {
      return t.priority === 'urgent' || t.priority === 'high' || t.status === 'escalated' || t.status === 'new';
    }
    return false;
  });
  pendingTickets.forEach(t => {
    const id = `staff-tk-${t.ticket_id}`;
    staffNotifs.push({
      id,
      icon: icons.warning,
      color: t.priority === 'urgent' || t.status === 'escalated' ? '#ef4444' : '#f59e0b',
      title: `[${t.ticket_code}] ${t.title}`,
      sub: `Mức độ: ${ticketPriorityLabels[t.priority]} · ${ticketStatusLabels[t.status]}`,
      link: '#/support',
      time: t.created_at,
      ticketCode: t.ticket_code,
      detailDescription: t.description,
      actionNote: `Mức độ: ${ticketPriorityLabels[t.priority]} · Trạng thái: ${ticketStatusLabels[t.status]}`,
      isRead: readNotifIds.has(id),
    });
  });

  return staffNotifs;
}

function getNavSections(userRole?: Role): NavSection[] {
  // Giáo viên: Quản lý giảng dạy, lớp học, học viên, lịch dạy, điểm danh, chấm bài, hỗ trợ tin nhắn và tài khoản
  if (userRole === 'teacher') {
    return [
      {
        label: 'Giảng viên',
        items: [
          { id: 'dashboard', label: 'Tổng quan', icon: icons.dashboard, roles: ['teacher'] },
          { id: 'classes', label: 'Lớp học phụ trách', icon: icons.classes, roles: ['teacher'] },
          { id: 'students', label: 'Học viên của tôi', icon: icons.students, roles: ['teacher'] },
          { id: 'schedule', label: 'Lịch giảng dạy', icon: icons.calendar, roles: ['teacher'] },
          { id: 'attendance', label: 'Điểm danh lớp', icon: icons.attendance, roles: ['teacher'] },
          { id: 'grading', label: 'Chấm bài', icon: icons.assessment, roles: ['teacher'] },
          { id: 'support', label: 'Hỗ trợ & Tin nhắn', icon: icons.support, roles: ['teacher'] },
          { id: 'account', label: 'Tài khoản', icon: icons.user, roles: ['teacher'] },
        ],
      },
    ];
  }

  // Trợ giảng: Hỗ trợ lớp học, điểm danh, theo dõi học viên, lịch trợ giảng, giải đáp thắc mắc và tài khoản
  if (userRole === 'teaching_assistant') {
    return [
      {
        label: 'Trợ giảng',
        items: [
          { id: 'dashboard', label: 'Tổng quan', icon: icons.dashboard, roles: ['teaching_assistant'] },
          { id: 'classes', label: 'Lớp học phụ trách', icon: icons.classes, roles: ['teaching_assistant'] },
          { id: 'attendance', label: 'Điểm danh', icon: icons.attendance, roles: ['teaching_assistant'] },
          { id: 'grading', label: 'Chấm bài', icon: icons.assessment, roles: ['teaching_assistant'] },
          { id: 'students', label: 'Học viên phụ trách', icon: icons.students, roles: ['teaching_assistant'] },
          { id: 'schedule', label: 'Lịch trợ giảng', icon: icons.calendar, roles: ['teaching_assistant'] },
          { id: 'support', label: 'Hỗ trợ & Hỏi đáp', icon: icons.support, roles: ['teaching_assistant'] },
          { id: 'account', label: 'Tài khoản', icon: icons.user, roles: ['teaching_assistant'] },
        ],
      },
    ];
  }

  // Học viên: 5 mục menu dọc: Học, Bài tập, Luyện tập, Kết quả, Cá nhân
  if (userRole === 'student') {
    return [
      {
        label: 'Menu học tập',
        items: [
          { id: 'student-dashboard', label: 'Học', icon: '📖', badge: 1, roles: ['student'] },
          { id: 'student-assignments', label: 'Bài tập', icon: '📝', roles: ['student'] },
          { id: 'student-quizzes', label: 'Luyện tập', icon: '🎯', roles: ['student'] },
          { id: 'student-results', label: 'Kết quả', icon: '📊', roles: ['student'] },
          { id: 'account', label: 'Cá nhân', icon: '👤', roles: ['student'] },
        ],
      },
    ];
  }

  return [
    {
      label: 'Tổng quan',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard, roles: ['admin'] },
      ],
    },
    {
      label: 'Quản lý',
      items: [
        { id: 'announcements', label: 'Thông báo', icon: icons.bell, roles: ['admin'] },
        { id: 'teachers', label: 'Giáo viên', icon: icons.teacher, roles: ['admin'] },
        { id: 'courses', label: 'Khóa học', icon: icons.classes, roles: ['admin'] },
        { id: 'classes', label: 'Lớp học & Tiến độ', icon: icons.classes, roles: ['admin'] },
        { id: 'students', label: 'Học viên', icon: icons.students, roles: ['admin'] },
        { id: 'risk-matrix', label: 'Ma trận Rủi ro', icon: icons.warning, roles: ['admin'] },
        { id: 'schedule', label: 'Lịch', icon: icons.calendar, roles: ['admin'] },
      ],
    },
    {
      label: 'Hỗ trợ',
      items: [
        { id: 'support', label: 'Hỗ trợ & Tin nhắn', icon: icons.support, roles: ['admin'] },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        { id: 'account', label: 'Tài khoản', icon: icons.user, roles: ['admin', 'teaching_assistant', 'student'] },
        { id: 'audit-log', label: 'Nhật ký Hệ thống', icon: icons.history, roles: ['admin'] },
      ],
    },
  ];
}

const navPastelConfig: Record<string, { bg: string; color: string; emoji?: string }> = {
  dashboard: { bg: '#DDF0FB', color: '#0284c7', emoji: '🏠' },
  'student-dashboard': { bg: '#E5DCFF', color: '#6C47D9', emoji: '📖' },
  teachers: { bg: '#F5E6E4', color: '#A93226', emoji: '👩‍🏫' },
  'teacher-detail': { bg: '#F5E6E4', color: '#A93226', emoji: '👩‍🏫' },
  'student-assignments': { bg: '#F3EFFF', color: '#6C47D9', emoji: '📝' },
  schedule: { bg: '#FDF0DD', color: '#d97706', emoji: '📅' },
  'student-schedule': { bg: '#FDF0DD', color: '#d97706', emoji: '📅' },
  announcements: { bg: '#FCE8EF', color: '#e11d48', emoji: '📢' },
  'student-quizzes': { bg: '#F3EFFF', color: '#6C47D9', emoji: '🎯' },
  'student-results': { bg: '#F3EFFF', color: '#6C47D9', emoji: '📊' },
  'student-join-class': { bg: '#F3EFFF', color: '#6C47D9', emoji: '🎒' },
  'student-class-detail': { bg: '#F3EFFF', color: '#6C47D9', emoji: '📚' },
  courses: { bg: '#EFE7FA', color: '#7c3aed', emoji: '📚' },
  classes: { bg: '#FDF0DD', color: '#d97706', emoji: '🏫' },
  students: { bg: '#FDF0DD', color: '#d97706', emoji: '👥' },
  attendance: { bg: '#FCE8EF', color: '#e11d48', emoji: '📋' },
  assessments: { bg: '#E2F6ED', color: '#059669', emoji: '📝' },
  quizzes: { bg: '#FFF8D9', color: '#ca8a04', emoji: '💡' },
  progress: { bg: '#DEF5F8', color: '#0891b2', emoji: '🗺️' },
  'risk-matrix': { bg: '#FFEAEA', color: '#dc2626', emoji: '⚠️' },
  support: { bg: '#EFE7FA', color: '#9333ea', emoji: '💬' },
  reports: { bg: '#E2F6ED', color: '#16a34a', emoji: '📊' },
  'audit-log': { bg: '#F2EBE1', color: '#64748b', emoji: '📜' },
  account: { bg: '#F5E6E4', color: '#A93226', emoji: '👤' },
  grading: { bg: '#FEE2E2', color: '#B91C1C', emoji: '✍️' },
  import: { bg: '#DDF0FB', color: '#0284c7', emoji: '📥' },
};

// === Render Sidebar ===
function renderSidebar(): string {
  const state = getState();
  const user = state.currentUser;
  if (!user) return '';

  const sections = getNavSections(user.role);
  const storedCenterLogo = localStorage.getItem('edutrack_center_logo');
  const storedUserAvatar = user.avatar_url || localStorage.getItem(`edutrack_avatar_${user.staff_id}`);

  // 1. Sidebar chuyên biệt cho Học viên (Gamified Purple Theme #F3EFFF / #E8E2F8 / #6C47D9)
  if (user.role === 'student') {
    return `
      <aside class="sidebar student-sidebar" id="sidebar" style="background:#F3EFFF;border-right:1px solid #E8E2F8">
        <!-- Sidebar Edge Arrow Toggle -->
        <button class="sidebar-edge-toggle" id="sidebar-edge-toggle" type="button" title="Thu gọn / Mở rộng menu" aria-label="Toggle Sidebar">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="#6C47D9" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="sidebar-edge-icon">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <!-- Avatar linh vật + tên trung tâm "EduTrack English" -->
        <div class="sidebar-logo" style="padding:22px 18px 18px;border-bottom:1px solid #E8E2F8">
          <div class="logo-icon" style="width:42px;height:42px;background:#EDE7FB;border:1.5px solid #D8CCF8;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(108,71,217,0.15);flex-shrink:0">
            <span style="font-size:24px">🦉</span>
          </div>
          <div class="logo-text">
            <div class="logo-title" style="display:flex;align-items:center;gap:4px">
              <span style="color:#2D2824;font-weight:800;font-size:16px;letter-spacing:-0.02em">EduTrack <span style="color:#6C47D9">English</span></span>
            </div>
            <span class="logo-sub" style="font-size:10.5px;color:#8E8897;font-weight:600">Gamified Learning</span>
          </div>
        </div>

        <!-- 5 mục menu dọc: Học, Bài tập, Luyện tập, Kết quả, Cá nhân -->
        <nav class="sidebar-nav" style="padding:16px 10px">
          ${sections.map(section => {
            const visibleItems = section.items.filter(item => item.roles.includes(user.role));
            return `
              <div class="sidebar-section">
                ${visibleItems.map(item => {
                  const isActive = state.currentPage === item.id || (item.id === 'student-dashboard' && (state.currentPage === 'student-join-class' || state.currentPage === 'student-class-detail'));
                  return `
                    <a class="sidebar-link ${isActive ? 'active' : ''}" data-nav="${item.id}" href="#/${item.id}" title="${item.label}" style="border-radius:14px;margin-bottom:6px;${isActive ? 'background:#E5DCFF;color:#6C47D9;font-weight:800' : 'color:#554F5D;font-weight:600'}">
                      <span class="link-icon-circle" style="background:${isActive ? '#D7C7FC' : '#FAF8FD'};color:#6C47D9;font-size:15px">
                        ${item.icon}
                      </span>
                      <span>${item.label}</span>
                      ${item.badge ? `<span class="link-badge" style="background:#6C47D9;color:#FFFFFF;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:800">${item.badge}</span>` : ''}
                    </a>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </nav>

        <!-- Sidebar footer: user info -->
        <div class="sidebar-footer" style="padding:16px;border-top:1px solid #E8E2F8">
          <div class="sidebar-user" id="sidebar-user" style="cursor:pointer;background:#FFFFFF;border:1px solid #E8E2F8;border-radius:18px;padding:12px 14px;box-shadow:0 2px 6px rgba(108,71,217,0.03)" title="Xem thông tin Tài khoản">
            <div class="sidebar-user-top" style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:10px">
                <div class="avatar avatar-sm" style="width:34px;height:34px;background:#EDE7FB;border:1.5px solid #D8CCF8;font-size:12.5px;font-weight:800;color:#6C47D9;display:flex;align-items:center;justify-content:center;border-radius:50%">
                  ${user.avatar_initials || 'HN'}
                </div>
                <div class="sidebar-user-info">
                  <div class="name" style="font-weight:800;color:#2D2824;font-size:13px">${user.full_name}</div>
                  <div class="role" style="font-size:11px;color:#6C47D9;font-weight:700">Học viên</div>
                </div>
              </div>
              <button class="btn-ghost btn-icon btn-sm" id="logout-btn" style="color:#8E8897" title="Đăng xuất">
                ${icons.logout}
              </button>
            </div>
            <div class="sidebar-user-stats" style="margin-top:10px;padding-top:8px;border-top:1px dashed #E8E2F8;display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;color:#6C47D9">
              <span>🔥 5 ngày</span>
              <span>🌾 45 Thóc</span>
              <span>⭐ 30 XP</span>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  // 2. Sidebar dành cho Admin / Giáo viên / Trợ giảng (Giữ nguyên phong cách Warm Minimalist)
  return `
    <aside class="sidebar" id="sidebar">
      <!-- Sidebar Edge Arrow Toggle (Kéo ra kéo vô) -->
      <button class="sidebar-edge-toggle" id="sidebar-edge-toggle" type="button" title="Thu gọn / Mở rộng menu" aria-label="Toggle Sidebar">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="sidebar-edge-icon">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="sidebar-logo">
        <div class="logo-icon" style="width:38px;height:38px;background:#F5E6E4;border:1.5px solid #E8C9C5;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(169, 50, 38, 0.15);flex-shrink:0;overflow:hidden">
          ${storedCenterLogo 
            ? `<img src="${storedCenterLogo}" alt="Logo" style="max-width:85%;max-height:85%;object-fit:contain" />` 
            : `<span style="font-size:20px">🦉</span>`
          }
        </div>
        <div class="logo-text">
          <div class="logo-title" style="display:flex;align-items:center;gap:4px">
            <span style="color:#2D2824;font-weight:800;font-size:16px;letter-spacing:-0.02em">EduTrack <span style="color:#A93226">Center</span></span>
          </div>
          <span class="logo-sub" style="font-size:10.5px;color:#7F7A72;font-weight:600">Smart Academic Suite</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${sections.map(section => {
          const visibleItems = section.items.filter(item => item.roles.includes(user.role));
          if (visibleItems.length === 0) return '';
          return `
            <div class="sidebar-section">
              <div class="sidebar-section-label">${section.label}</div>
              ${visibleItems.map(item => {
                const conf = navPastelConfig[item.id] || { bg: '#DDF0FB', color: '#0284c7', emoji: '✨' };
                return `
                  <a class="sidebar-link ${state.currentPage === item.id ? 'active' : ''}" data-nav="${item.id}" href="#/${item.id}" title="${item.label}">
                    <span class="link-icon-circle" style="background:${conf.bg};color:${conf.color}">
                      ${conf.emoji || item.icon}
                    </span>
                    <span>${item.label}</span>
                    ${item.badge ? `<span class="link-badge">${item.badge}</span>` : ''}
                  </a>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user" style="cursor:pointer" title="Xem thông tin Tài khoản">
          <div class="sidebar-user-top">
            <div class="avatar avatar-sm" style="background:#FFF8EC;border:1px solid #F5DEC2;font-size:16px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:50%">
              ${storedUserAvatar 
                ? `<img src="${storedUserAvatar}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />` 
                : `<span style="font-weight:700;color:#A93226">${user.avatar_initials || '🐻'}</span>`
              }
            </div>
            <div class="sidebar-user-info">
              <div class="name" style="font-weight:700;color:#2D2824">${user.full_name}</div>
              <div class="role" style="font-size:11.5px;color:#7F7A72;margin-top:1px">${user.role === 'teacher' ? 'Giáo viên' : (user.role === 'admin' ? 'Quản lý trung tâm' : roleLabels[user.role])}</div>
            </div>
            <button class="btn-ghost btn-icon btn-sm" id="logout-btn" style="color:var(--text-tertiary)" title="Đăng xuất">
              ${icons.logout}
            </button>
          </div>
        </div>
      </div>
    </aside>
  `;
}

// === Render Header ===
function renderHeader(pageTitle: string, breadcrumbs: { label: string; href?: string }[] = []): string {
  const state = getState();
  const user = state.currentUser;
  if (!user) return '';

  const isStudent = user.role === 'student';
  const notifCount = getSupportBadgeCount();

  // 1. Thẻ Header chào mừng chuyên biệt dành riêng cho Học viên
  if (isStudent) {
    return `
      <header class="page-header student-page-header" style="background:#FFFFFF;border-bottom:1px solid #E8E2F8;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 4px rgba(108,71,217,0.02)">
        <div class="page-header-left" style="display:flex;align-items:center;gap:14px">
          <!-- Mobile trigger -->
          <button class="mobile-sidebar-trigger" id="mobile-sidebar-trigger" title="Mở menu" type="button" aria-label="Open Menu">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#6C47D9" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Bên trái: Avatar học viên + lời chào in đậm "Chào, Nhung Nguyễn" + nhãn phụ "Học viên" -->
          <div style="display:flex;align-items:center;gap:12px">
            <div class="avatar" style="width:40px;height:40px;border-radius:50%;background:#EDE7FB;border:1.5px solid #D8CCF8;color:#6C47D9;font-weight:800;font-size:14.5px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(108,71,217,0.1)">
              ${user.avatar_initials || 'HN'}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:16.5px;font-weight:800;color:#2D2824;line-height:1.2">
                  Chào, ${user.full_name}
                </span>
                <span style="background:#EDE7FB;color:#6C47D9;border:1px solid #D8CCF8;font-size:11px;font-weight:700;padding:2px 10px;border-radius:9999px">
                  Học viên
                </span>
              </div>
              <div style="font-size:12px;color:#8E8897;font-weight:500;margin-top:2px">
                Không gian học tập gamified · EduTrack English
              </div>
            </div>
          </div>
        </div>

        <!-- Bên phải: Nút pill viền tím nhạt "🎯 Nhiệm vụ" + chuông + logout -->
        <div class="page-header-right" style="display:flex;align-items:center;gap:12px">
          <!-- Nút pill viền tím nhạt "🎯 Nhiệm vụ" -->
          <button 
            id="btn-student-quests" 
            type="button" 
            title="Mở danh sách nhiệm vụ ngày nhận thóc & XP"
            style="background:#FFFFFF;border:1.5px solid #E8E2F8;color:#6C47D9;border-radius:9999px;padding:7px 16px;font-size:13px;font-weight:800;display:inline-flex;align-items:center;gap:6px;cursor:pointer;box-shadow:0 1px 4px rgba(108,71,217,0.06);transition:all 0.15s ease"
          >
            <span style="font-size:14px">🎯</span>
            <span>Nhiệm vụ</span>
          </button>

          <!-- Notification Bell -->
          <div style="position:relative">
            <button class="notification-btn" id="notification-btn" type="button" title="Thông báo học tập cá nhân" style="background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9">
              ${icons.bell}
              ${notifCount > 0 ? `<span class="notif-badge-pill" style="background:#6C47D9">${notifCount}</span>` : ''}
            </button>
            <div id="notification-dropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;width:380px;max-width:92vw;background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;box-shadow:0 20px 25px -5px rgba(108,71,217,0.1);z-index:9999;overflow:hidden"></div>
          </div>

          <!-- Quick Logout Action Button -->
          <button id="btn-header-logout" type="button" title="Đăng xuất khỏi tài khoản" style="display:inline-flex;align-items:center;gap:6px;background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9;border-radius:9999px;padding:7px 14px;font-size:12.5px;font-weight:700;cursor:pointer">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>
    `;
  }

  // 2. Header mặc định dành cho Admin / Giáo viên / Trợ giảng
  return `
    <header class="page-header">
      <div class="page-header-left">
        <!-- Mobile-only open arrow button (Hidden on Desktop) -->
        <button class="mobile-sidebar-trigger" id="mobile-sidebar-trigger" title="Mở menu" type="button" aria-label="Open Menu">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <div class="breadcrumb">
          ${breadcrumbs.map((b, i) => 
            i < breadcrumbs.length - 1 
              ? `<a href="${b.href || '#'}">${b.label}</a><span class="separator">/</span>`
              : `<span class="current">${b.label}</span>`
          ).join('')}
          ${breadcrumbs.length === 0 ? `<span class="current">${pageTitle}</span>` : ''}
        </div>
      </div>
      <div class="page-header-right">
        <!-- Class Toolkit Button (Only for Teachers and Teaching Assistants) -->
        ${(user.role === 'teacher' || user.role === 'teaching_assistant') ? `
        <button class="ntt-tools-btn" id="btn-open-ntt-tools" type="button" title="Class Toolkit - Tiện ích hỗ trợ lớp học (Bốc thăm, Đếm giờ, Xúc xắc, QR)">
          <span style="font-size:14px">✨</span>
          <span>Class Toolkit</span>
        </button>
        ` : ''}

        <!-- Notification Bell (Strictly personalized for current logged-in user) -->
        <div style="position:relative">
          <button class="notification-btn" id="notification-btn" type="button" title="Thông báo cá nhân & công việc">
            ${icons.bell}
            ${notifCount > 0 ? `<span class="notif-badge-pill">${notifCount}</span>` : ''}
          </button>
          <div id="notification-dropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;width:380px;max-width:92vw;background:var(--bg-secondary);border:1px solid var(--border-light);border-radius:var(--radius-xl);box-shadow:0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);z-index:9999;overflow:hidden"></div>
        </div>

        <!-- Quick Profile Link -->
        <a href="#/account" class="header-user-badge" title="Tài khoản cá nhân: ${user.full_name} (${roleLabels[user.role]})" style="display:flex;align-items:center;gap:8px;padding:4px 10px 4px 5px;background:#FFFFFF;border:1px solid #EAE4D8;border-radius:var(--radius-full);text-decoration:none;transition:all 0.15s ease">
          <div class="avatar avatar-sm" style="width:26px;height:26px;font-size:11px;font-weight:700;background:linear-gradient(135deg, #A93226, #8B251B);color:#fff;border-radius:50%">${user.avatar_initials}</div>
          <span style="font-size:12.5px;font-weight:600;color:var(--text-primary);max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.full_name}</span>
        </a>

        <!-- Quick Logout Action Button -->
        <button id="btn-header-logout" type="button" title="Đăng xuất khỏi tài khoản" style="display:inline-flex;align-items:center;gap:6px;background:#FDF0EE;border:1px solid #FBCBC7;color:#A93226;border-radius:10px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s ease">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  `;
}

// === Render App Shell ===
function renderAppShell(pageTitle: string, pageContent: string, breadcrumbs: { label: string; href?: string }[] = []): string {
  const isCollapsed = localStorage.getItem('edutrack_sidebar_collapsed') === 'true';
  const state = getState();
  const isStudent = state.currentUser?.role === 'student';

  return `
    <div class="app-layout ${isCollapsed ? 'sidebar-collapsed' : ''} ${isStudent ? 'student-gamified-layout' : ''}" id="app-layout" style="${isStudent ? 'background:#F8F6FF' : ''}">
      ${renderSidebar()}
      <div id="sidebar-overlay" class="sidebar-overlay"></div>
      <main class="main-content" style="${isStudent ? 'background:#F8F6FF' : ''}">
        ${renderHeader(pageTitle, breadcrumbs)}
        <div class="page-content" id="page-content" style="${isStudent ? 'background:#F8F6FF;padding:24px' : ''}">
          ${pageContent}
        </div>
      </main>
      <div id="ntt-tools-modal-container"></div>
      <div id="student-quests-modal-container"></div>
    </div>
  `;
}

// === Page Title Map ===
const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  'student-dashboard': 'Học',
  'student-assignments': 'Bài tập',
  'student-schedule': 'Lịch học & Ghép ca học bù',
  'student-quizzes': 'Luyện tập',
  'student-results': 'Kết quả',
  'student-join-class': 'Vào lớp',
  'student-class-detail': 'Chi tiết bài học',
  teachers: 'Quản lý Giáo viên',
  'teacher-detail': 'Hồ sơ Giáo viên',
  courses: 'Quản lý Khóa học',
  classes: 'Lớp của trung tâm',
  students: 'Học viên đang học',
  'student-detail': 'Hồ sơ theo dõi học viên',
  schedule: 'Lịch trung tâm',
  announcements: 'Thông báo toàn trung tâm',
  account: 'Tài khoản',
  attendance: 'Điểm danh',
  assessments: 'Kiểm tra & Điểm',
  quizzes: 'Quiz trắc nghiệm',
  progress: 'Tiến độ Học tập',
  support: 'Hỗ trợ Học viên',
  reports: 'Báo cáo',
  'audit-log': 'Nhật ký Hệ thống',
  'risk-matrix': 'Ma trận Cảnh báo & Rủi ro',
  import: 'Nhập Dữ liệu Học viên',
};

// === Core Render Function ===
function renderPage(page: string) {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  const state = getState();

  // Login page
  if (!state.isLoggedIn || page === 'login') {
    app.innerHTML = renderLoginPage();
    initLoginPage();
    return;
  }

  // Access control
  if (!canAccessPage(page)) {
    page = state.currentUser?.role === 'student' ? 'student-dashboard' : 'dashboard';
    setState({ currentPage: page });
    showToast('⚠️ Bạn không có quyền truy cập vào trang này!', 'warning');
  }

  let pageContent = '';
  let breadcrumbs: { label: string; href?: string }[] = [];
  const title = pageTitles[page] || 'EduTrack';

  switch (page) {
    case 'dashboard':
      pageContent = renderDashboardPage();
      break;
    case 'student-dashboard':
      pageContent = renderStudentDashboardPage();
      break;
    case 'student-assignments':
      pageContent = renderStudentAssignmentsPage();
      breadcrumbs = [
        { label: 'Tổng quan học tập', href: '#/student-dashboard' },
        { label: 'Nộp bài trực tuyến' },
      ];
      break;
    case 'student-schedule':
      pageContent = renderStudentSchedulePage();
      breadcrumbs = [
        { label: 'Tổng quan học tập', href: '#/student-dashboard' },
        { label: 'Lịch học & Ghép ca học bù' },
      ];
      break;
    case 'student-quizzes':
      pageContent = renderStudentQuizzesPage();
      breadcrumbs = [
        { label: 'Học', href: '#/student-dashboard' },
        { label: 'Luyện tập' },
      ];
      break;
    case 'student-results':
      pageContent = renderStudentResultsPage();
      breadcrumbs = [
        { label: 'Học', href: '#/student-dashboard' },
        { label: 'Kết quả' },
      ];
      break;
    case 'student-join-class':
      pageContent = renderStudentJoinClassPage();
      breadcrumbs = [
        { label: 'Học', href: '#/student-dashboard' },
        { label: 'Vào lớp' },
      ];
      break;
    case 'student-class-detail':
      pageContent = renderStudentClassDetailPage();
      breadcrumbs = [
        { label: 'Học', href: '#/student-dashboard' },
        { label: 'Chi tiết bài học' },
      ];
      break;
    case 'teachers':
      pageContent = renderTeachersPage();
      break;
    case 'teacher-detail':
      pageContent = renderTeacherDetailPage();
      breadcrumbs = [
        { label: 'Giáo viên', href: '#/teachers' },
        { label: 'Hồ sơ giáo viên' },
      ];
      break;
    case 'students':
      pageContent = renderStudentsPage();
      break;
    case 'student-detail':
      pageContent = renderStudentDetailPage();
      breadcrumbs = [
        { label: 'Học viên', href: '#/students' },
        { label: 'Hồ sơ theo dõi' },
      ];
      break;
    case 'courses':
      pageContent = renderCoursesPage();
      break;
    case 'classes':
      pageContent = renderClassesPage();
      break;
    case 'schedule':
      pageContent = renderSchedulePage();
      break;
    case 'class-detail':
      pageContent = renderClassDetailPage();
      breadcrumbs = [
        { label: 'Khóa học', href: '#/courses' },
        { label: 'Chi tiết khóa học' },
      ];
      break;
    case 'attendance':
      pageContent = renderAttendancePage();
      break;
    case 'announcements':
      pageContent = renderAnnouncementsPage();
      break;
    case 'assessments':
      pageContent = renderAssessmentsPage();
      break;
    case 'quizzes':
      pageContent = renderQuizzesPage();
      break;
    case 'progress':
      pageContent = renderClassesPage();
      breadcrumbs = [
        { label: 'Lớp học & Tiến độ', href: '#/classes?tab=classes' },
        { label: 'Tiến độ học tập & Học viên' },
      ];
      break;
    case 'support':
      pageContent = renderSupportPage();
      breadcrumbs = [
        { label: 'Hỗ trợ & Tin nhắn Học viên' },
      ];
      break;
    case 'reports':
      pageContent = renderReportsPage();
      break;
    case 'audit-log':
      pageContent = renderAuditLogPage();
      break;
    case 'account':
      pageContent = renderAccountPage();
      break;
    case 'grading':
      pageContent = renderGradingPage();
      breadcrumbs = [
        { label: 'Giáo viên', href: '#/dashboard' },
        { label: 'Chấm bài' },
      ];
      break;
    case 'risk-matrix':
      pageContent = renderRiskMatrixPage();
      break;
    case 'import':
      pageContent = renderImportDataPage();
      break;
    default:
      pageContent = `
        <div class="empty-state">
          <div class="empty-state-icon" style="width:120px;height:120px">${icons.dashboard}</div>
          <h2 class="empty-state-title">Trang không tìm thấy</h2>
          <p class="empty-state-description">Trang bạn tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.</p>
          <a href="#/dashboard" class="btn btn-primary">Về Dashboard</a>
        </div>
      `;
  }

  app.innerHTML = renderAppShell(title, pageContent, breadcrumbs);
  initGlobalEvents();

  // Init page-specific events
  switch (page) {
    case 'dashboard': initDashboardPage(); break;
    case 'student-dashboard': initStudentDashboardPage(); break;
    case 'student-assignments': initStudentAssignmentsPage(); break;
    case 'student-schedule': initStudentSchedulePage(); break;
    case 'student-quizzes': initStudentQuizzesPage(); break;
    case 'student-results': initStudentResultsPage(); break;
    case 'student-join-class': initStudentJoinClassPage(); break;
    case 'student-class-detail': initStudentClassDetailPage(); break;
    case 'teachers': initTeachersPage(); break;
    case 'teacher-detail': initTeacherDetailPage(); break;
    case 'students': initStudentsPage(); break;
    case 'student-detail': initStudentDetailPage(); break;
    case 'courses': initCoursesPage(); break;
    case 'classes': initClassesPage(); break;
    case 'schedule': initSchedulePage(); break;
    case 'class-detail': initClassDetailPage(); break;
    case 'attendance': initAttendancePage(); break;
    case 'announcements': initAnnouncementsPage(); break;
    case 'assessments': initAssessmentsPage(); break;
    case 'quizzes': initQuizzesPage(); break;
    case 'progress': initClassesPage(); break;
    case 'support': initSupportPage(); break;
    case 'reports': initReportsPage(); break;
    case 'audit-log': initAuditLogPage(); break;
    case 'account': initAccountPage(); break;
    case 'grading': initGradingPage(); break;
    case 'risk-matrix': initRiskMatrixPage(); break;
    case 'import': initImportDataPage(); break;
  }

  // Tự động kiểm tra và hiện popup thông báo nếu có thông báo chưa đọc (dành cho Học viên & Giáo viên)
  setTimeout(() => {
    checkAndShowUnreadAnnouncementPopup();
  }, 100);
}

// === Modal Nhiệm vụ ngày dành cho Học viên ===
function openStudentQuestsModal() {
  const container = document.getElementById('student-quests-modal-container');
  if (!container) return;
  container.innerHTML = `
    <div id="modal-quests-backdrop" style="position:fixed;inset:0;background:rgba(20,15,35,0.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="width:100%;max-width:520px;background:#FFFFFF;border-radius:24px;border:1.5px solid #E8E2F8;overflow:hidden;box-shadow:0 20px 40px rgba(108,71,217,0.15)">
        <div style="background:#F3EFFF;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E8E2F8">
          <div>
            <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 2px 0">🎯 Nhiệm vụ hàng ngày</h3>
            <div style="font-size:12px;color:#736B7C;font-weight:500">Hoàn thành nhiệm vụ ngày để nhận thóc &amp; XP</div>
          </div>
          <button id="btn-close-quests-modal" type="button" style="background:#FFFFFF;border:1px solid #E0D4FC;width:32px;height:32px;border-radius:50%;color:#6C47D9;font-size:16px;font-weight:700;cursor:pointer">✕</button>
        </div>
        
        <!-- Wallet Bar -->
        <div style="background:#FAF8FD;padding:12px 24px;border-bottom:1px dashed #E8E2F8;display:flex;justify-content:space-around;font-size:13px;font-weight:800;color:#6C47D9">
          <span>🌾 45 Thóc</span>
          <span>⭐ 120 XP</span>
          <span>🔥 5 Ngày chuỗi</span>
        </div>

        <!-- Quests List -->
        <div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px">
          <div style="background:#FFFFFF;border:1px solid #E8E2F8;border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:14px;font-weight:800;color:#2D2824">1. Đăng nhập mỗi ngày</div>
              <div style="font-size:12px;color:#6C47D9;font-weight:700;margin-top:2px">+10 XP · +5 Thóc</div>
            </div>
            <span style="background:#E2F6ED;color:#059669;font-size:12px;font-weight:700;padding:4px 12px;border-radius:9999px">✓ Đã nhận</span>
          </div>

          <div style="background:#FFFFFF;border:1px solid #E8E2F8;border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:14px;font-weight:800;color:#2D2824">2. Hoàn thành 1 bài học Unit</div>
              <div style="font-size:12px;color:#6C47D9;font-weight:700;margin-top:2px">+25 XP · +10 Thóc</div>
            </div>
            <a href="#/student-class-detail" class="btn-quest-action" style="background:#6C47D9;color:#FFFFFF;font-size:12px;font-weight:800;padding:5px 14px;border-radius:9999px;text-decoration:none">Vào học →</a>
          </div>

          <div style="background:#FFFFFF;border:1px solid #E8E2F8;border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:14px;font-weight:800;color:#2D2824">3. Luyện 5 từ vựng mới</div>
              <div style="font-size:12px;color:#6C47D9;font-weight:700;margin-top:2px">+15 XP · +5 Thóc</div>
            </div>
            <a href="#/student-quizzes" class="btn-quest-action" style="background:#6C47D9;color:#FFFFFF;font-size:12px;font-weight:800;padding:5px 14px;border-radius:9999px;text-decoration:none">Luyện tập →</a>
          </div>

          <div style="background:#FFFFFF;border:1px solid #E8E2F8;border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:14px;font-weight:800;color:#2D2824">4. Góp 5 lượt ôn cho lớp</div>
              <div style="font-size:12px;color:#6C47D9;font-weight:700;margin-top:2px">+20 XP · +5 Thóc</div>
            </div>
            <a href="#/student-quizzes" class="btn-quest-action" style="background:#F3EFFF;color:#6C47D9;border:1px solid #E0D4FC;font-size:12px;font-weight:800;padding:5px 14px;border-radius:9999px;text-decoration:none">Góp lượt →</a>
          </div>
        </div>

        <div style="padding:12px 24px 20px;text-align:right;border-top:1px solid #E8E2F8">
          <button id="btn-close-quests-modal-bottom" type="button" style="background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9;border-radius:9999px;padding:8px 20px;font-size:13px;font-weight:700;cursor:pointer">Đóng</button>
        </div>
      </div>
    </div>
  `;

  const close = () => { container.innerHTML = ''; };
  document.getElementById('btn-close-quests-modal')?.addEventListener('click', close);
  document.getElementById('btn-close-quests-modal-bottom')?.addEventListener('click', close);
  document.getElementById('modal-quests-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'modal-quests-backdrop') close();
  });
  document.querySelectorAll('.btn-quest-action').forEach(btn => btn.addEventListener('click', close));
}

// === Global Event Handlers ===
function initGlobalEvents() {
  // Student Quests Modal
  document.getElementById('btn-student-quests')?.addEventListener('click', () => {
    openStudentQuestsModal();
  });

  // Open NTTClass Classroom Toolkit
  document.getElementById('btn-open-ntt-tools')?.addEventListener('click', () => {
    const container = document.getElementById('ntt-tools-modal-container');
    if (container) {
      container.innerHTML = renderNttToolsModal();
      initNttToolsModal();
    }
  });

  // Logout from sidebar
  document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    logout();
    showToast('Đã đăng xuất khỏi hệ thống thành công!', 'info');
  });

  // Logout from header quick action button
  document.getElementById('btn-header-logout')?.addEventListener('click', (e) => {
    e.stopPropagation();
    logout();
    showToast('Đã đăng xuất khỏi hệ thống thành công!', 'info');
  });

  // Click sidebar-user to go to Account page
  document.getElementById('sidebar-user')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#logout-btn')) return;
    window.location.hash = '#/account';
  });

  // Campus filter
  document.getElementById('campus-filter')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value as 'all' | 'CS1' | 'CS2';
    setState({ selectedCampus: val });
    renderPage(getState().currentPage);
  });

  // Sidebar edge arrow toggle (Dấu mũi tên trên mép thanh bên)
  const appLayout = document.getElementById('app-layout');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  const toggleSidebar = () => {
    if (window.innerWidth > 1024) {
      // Desktop: collapse to icon-only (72px) or expand (260px)
      const isCollapsed = appLayout?.classList.toggle('sidebar-collapsed');
      localStorage.setItem('edutrack_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } else {
      // Mobile / Tablet: slide in/out drawer
      sidebar?.classList.toggle('open');
      sidebarOverlay?.classList.toggle('open');
    }
  };

  document.getElementById('sidebar-edge-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('mobile-sidebar-trigger')?.addEventListener('click', toggleSidebar);

  sidebarOverlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('open');
  });

  // Mobile: auto close sidebar drawer when clicking any nav item
  sidebar?.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        sidebar?.classList.remove('open');
        sidebarOverlay?.classList.remove('open');
      }
    });
  });

  // Global Search with Strict Persona RBAC
  const searchInput = document.getElementById('global-search') as HTMLInputElement | null;
  const searchDropdown = document.getElementById('global-search-dropdown');

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!searchDropdown) return;

    if (!query) {
      searchDropdown.style.display = 'none';
      searchDropdown.innerHTML = '';
      return;
    }

    const state = getState();
    const isStudent = state.currentUser?.role === 'student';

    // Student Persona: ONLY search their coursework & quizzes. Strictly protect student privacy.
    if (isStudent) {
      const studentId = state.currentStudentView || state.currentUser?.staff_id;
      const myEnrollments = enrollmentData.filter(e => e.student_id === studentId && e.status === 'active');
      const myClassIds = new Set(myEnrollments.map(e => e.class_id));

      const matchedAssignments = studentAssignmentData.filter(a =>
        (myClassIds.size === 0 || myClassIds.has(a.class_id)) &&
        (a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query))
      ).slice(0, 4);

      const matchedQuizzes = quizData.filter(q =>
        q.title.toLowerCase().includes(query) || (q.description && q.description.toLowerCase().includes(query))
      ).slice(0, 3);

      if (matchedAssignments.length === 0 && matchedQuizzes.length === 0) {
        searchDropdown.style.display = 'block';
        searchDropdown.innerHTML = `
          <div style="padding:var(--space-4);text-align:center;font-size:var(--text-xs);color:var(--text-tertiary)">
            Không tìm thấy bài học hay bài tập nào phù hợp
          </div>
        `;
        return;
      }

      let html = '';
      if (matchedAssignments.length > 0) {
        html += `<div style="padding:var(--space-2) var(--space-3);font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;background:var(--gray-50)">Bài tập & Nhiệm vụ</div>`;
        matchedAssignments.forEach(a => {
          html += `
            <a href="#/student-assignments" class="global-search-item" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);text-decoration:none;color:inherit;border-bottom:1px solid var(--border-light)">
              <span style="color:var(--primary-600)">${icons.assessment}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:var(--text-xs);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.title}</div>
                <div style="font-size:10px;color:var(--text-tertiary)">Hạn nộp: ${formatDate(a.deadline)} · Thang điểm: ${a.max_score}đ</div>
              </div>
            </a>
          `;
        });
      }

      if (matchedQuizzes.length > 0) {
        html += `<div style="padding:var(--space-2) var(--space-3);font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;background:var(--gray-50)">Quiz & Ôn tập</div>`;
        matchedQuizzes.forEach(q => {
          html += `
            <a href="#/student-quizzes" class="global-search-item" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);text-decoration:none;color:inherit;border-bottom:1px solid var(--border-light)">
              <span style="color:#ca8a04">${icons.quiz}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:var(--text-xs);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${q.title}</div>
                <div style="font-size:10px;color:var(--text-tertiary)">${q.time_limit_minutes || 15} phút · ${q.total_questions} câu hỏi</div>
              </div>
            </a>
          `;
        });
      }

      searchDropdown.style.display = 'block';
      searchDropdown.innerHTML = html;

      searchDropdown.querySelectorAll('.global-search-item').forEach(item => {
        item.addEventListener('click', () => {
          searchDropdown.style.display = 'none';
          searchInput.value = '';
        });
      });
      return;
    }

    // Staff Persona: search students & classes
    const matchedStudents = studentData.filter(s =>
      s.full_name.toLowerCase().includes(query) ||
      s.student_code.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    ).slice(0, 4);

    const matchedClasses = classData.filter(c =>
      c.class_name.toLowerCase().includes(query) ||
      c.class_code.toLowerCase().includes(query) ||
      c.course_name.toLowerCase().includes(query)
    ).slice(0, 3);

    if (matchedStudents.length === 0 && matchedClasses.length === 0) {
      searchDropdown.style.display = 'block';
      searchDropdown.innerHTML = `
        <div style="padding:var(--space-4);text-align:center;font-size:var(--text-xs);color:var(--text-tertiary)">
          Không tìm thấy kết quả phù hợp
        </div>
      `;
      return;
    }

    let html = '';
    if (matchedStudents.length > 0) {
      html += `<div style="padding:var(--space-2) var(--space-3);font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;background:var(--gray-50)">Học viên</div>`;
      matchedStudents.forEach(s => {
        html += `
          <a href="#/students/${s.student_id}" class="global-search-item" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);text-decoration:none;color:inherit;border-bottom:1px solid var(--border-light)">
            <div class="avatar avatar-sm" style="width:24px;height:24px;font-size:10px">${s.avatar_initials}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--text-xs);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.full_name}</div>
              <div style="font-size:10px;color:var(--text-tertiary)">${s.student_code} · ${s.email}</div>
            </div>
          </a>
        `;
      });
    }

    if (matchedClasses.length > 0) {
      html += `<div style="padding:var(--space-2) var(--space-3);font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;background:var(--gray-50)">Lớp học</div>`;
      matchedClasses.forEach(c => {
        html += `
          <a href="#/classes/${c.class_id}" class="global-search-item" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);text-decoration:none;color:inherit;border-bottom:1px solid var(--border-light)">
            <span style="color:var(--primary-600)">${icons.classes}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--text-xs);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.class_name}</div>
              <div style="font-size:10px;color:var(--text-tertiary)">${c.class_code} · ${c.schedule}</div>
            </div>
          </a>
        `;
      });
    }

    searchDropdown.style.display = 'block';
    searchDropdown.innerHTML = html;

    searchDropdown.querySelectorAll('.global-search-item').forEach(item => {
      item.addEventListener('click', () => {
        searchDropdown.style.display = 'none';
        searchInput.value = '';
      });
    });
  });

// === Notification Modal & Dropdown Controller ===
function openNotificationModal(n: AppNotificationItem) {
  document.getElementById('notif-detail-modal-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop animate-fade-in';
  backdrop.id = 'notif-detail-modal-backdrop';
  backdrop.style.zIndex = '10000';

  backdrop.innerHTML = `
    <div class="modal animate-scale-up" style="max-width:540px;border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-xl)">
      <div class="modal-header" style="background:var(--gray-50);padding:var(--space-4) var(--space-6);border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="width:38px;height:38px;border-radius:50%;background:${n.color}20;color:${n.color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${n.icon}
          </div>
          <div>
            <h3 style="margin:0;font-size:var(--text-base);font-weight:700">${n.title}</h3>
            <span style="font-size:11px;color:var(--text-tertiary)">${n.ticketCode ? `Mã yêu cầu: <strong>${n.ticketCode}</strong> · ` : ''}${n.time ? formatTimeAgo(n.time) : 'Vừa xong'}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" id="close-notif-detail-modal" style="cursor:pointer">${icons.close}</button>
      </div>
      <div class="modal-body" style="padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-4)">
        ${n.detailDescription ? `
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:6px">Chi tiết yêu cầu</div>
            <div style="background:var(--gray-50);padding:12px 14px;border-radius:var(--radius-lg);font-size:var(--text-sm);line-height:1.5;color:var(--text-secondary);border:1px solid var(--border-light)">
              ${n.detailDescription}
            </div>
          </div>
        ` : ''}
        ${n.actionNote ? `
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--primary-700);text-transform:uppercase;margin-bottom:6px">Phản hồi &amp; Kết quả xử lý</div>
            <div style="background:rgba(37, 99, 235, 0.05);border-left:4px solid var(--primary-600);padding:12px 14px;border-radius:0 var(--radius-lg) var(--radius-lg) 0;font-size:var(--text-sm);line-height:1.5;color:var(--text-primary);font-weight:500">
              ${n.actionNote}
            </div>
          </div>
        ` : ''}
        <div style="font-size:var(--text-xs);color:var(--success-700);background:var(--success-50);padding:8px 12px;border-radius:var(--radius-md);display:flex;align-items:center;gap:6px">
          <span>${icons.check}</span>
          <span>Thông báo này đã được đánh dấu là đã đọc.</span>
        </div>
      </div>
      <div class="modal-footer" style="padding:var(--space-4) var(--space-6);background:var(--gray-50);border-top:1px solid var(--border-light);display:flex;justify-content:flex-end;gap:var(--space-2)">
        <a href="${n.link}" class="btn btn-primary btn-sm" id="btn-modal-go-ticket" style="font-size:12px;display:inline-flex;align-items:center;gap:6px">
          ${n.link.includes('assessments') ? `${icons.edit} Chấm bài & Nhập điểm ngay` : n.link.includes('student-assignments') ? `${icons.upload} Xem kết quả bài làm` : `${icons.support} Đi tới trang Hỗ trợ`}
        </a>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-modal-close" style="font-size:12px">Đóng</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const closeModal = () => backdrop.remove();
  document.getElementById('close-notif-detail-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-go-ticket')?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
}

function setupNotificationDropdown() {
  const notifBtn = document.getElementById('notification-btn');
  const dropdown = document.getElementById('notification-dropdown');
  if (!notifBtn || !dropdown) return;

  const notifDropdown = dropdown;
  let currentTab: 'all' | 'unread' = 'all';

  function renderList() {
    const state = getState();
    const user = state.currentUser;
    const isStudent = user?.role === 'student';
    const notifs = getUserNotifications();
    const unreadCount = getUnreadNotificationCount();

    const displayed = currentTab === 'unread' ? notifs.filter(n => !readNotifIds.has(n.id)) : notifs;

    notifDropdown.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--gray-50);border-bottom:1px solid var(--border-light)">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:700;font-size:13px;color:var(--text-primary)">
            ${isStudent ? 'Thông báo học tập cá nhân' : 'Thông báo hệ thống & SLA'}
          </span>
          ${unreadCount > 0 ? `<span class="badge ${isStudent ? 'badge-green' : 'badge-red'}" style="font-size:10px;padding:2px 7px">${unreadCount} mới</span>` : ''}
        </div>
        ${unreadCount > 0 ? `
          <button type="button" class="btn btn-ghost btn-sm" id="btn-mark-all-read" style="font-size:11px;padding:2px 8px;color:var(--primary-600);font-weight:600;cursor:pointer">
            ✓ Đọc tất cả
          </button>
        ` : ''}
      </div>

      <!-- Filter tabs -->
      <div style="display:flex;border-bottom:1px solid var(--border-light);background:#fff;padding:0 8px">
        <button type="button" class="notif-tab-btn" data-tab="all" style="flex:1;text-align:center;padding:8px 0;font-size:11px;font-weight:600;border:none;background:none;border-bottom:2px solid ${currentTab === 'all' ? 'var(--primary-600)' : 'transparent'};color:${currentTab === 'all' ? 'var(--primary-600)' : 'var(--text-tertiary)'};cursor:pointer">
          Tất cả (${notifs.length})
        </button>
        <button type="button" class="notif-tab-btn" data-tab="unread" style="flex:1;text-align:center;padding:8px 0;font-size:11px;font-weight:600;border:none;background:none;border-bottom:2px solid ${currentTab === 'unread' ? 'var(--primary-600)' : 'transparent'};color:${currentTab === 'unread' ? 'var(--primary-600)' : 'var(--text-tertiary)'};cursor:pointer">
          Chưa đọc (${unreadCount})
        </button>
      </div>

      <!-- Items List -->
      <div style="max-height:320px;overflow-y:auto">
        ${displayed.length === 0 ? `
          <div style="padding:var(--space-6);text-align:center;font-size:var(--text-xs);color:var(--text-tertiary)">
            <div style="font-size:24px;margin-bottom:6px;opacity:0.4">${icons.check}</div>
            ${currentTab === 'unread' ? 'Bạn đã đọc hết tất cả thông báo!' : 'Chưa có thông báo nào dành cho bạn.'}
          </div>
        ` : displayed.map(n => {
          const isUnread = !readNotifIds.has(n.id);
          return `
            <div class="notif-item-row" data-id="${n.id}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border-light);cursor:pointer;background:${isUnread ? 'rgba(16, 185, 129, 0.05)' : '#ffffff'};transition:background 0.15s">
              <div style="width:34px;height:34px;border-radius:50%;background:${n.color}15;color:${n.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
                ${n.icon}
              </div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:3px">
                  <span style="font-size:12px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.title}</span>
                  ${isUnread ? `<span style="width:7px;height:7px;border-radius:50%;background:#10b981;flex-shrink:0" title="Chưa đọc"></span>` : ''}
                </div>
                <div style="font-size:11px;color:var(--text-secondary);line-height:1.4;margin-bottom:6px">${n.sub}</div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:10px;color:var(--text-tertiary)">${n.time ? formatTimeAgo(n.time) : 'Vừa xong'}</span>
                  <button type="button" class="btn-notif-preview" data-id="${n.id}" style="font-size:10px;padding:2px 8px;border-radius:4px;border:none;background:var(--primary-50);color:var(--primary-700);font-weight:700;cursor:pointer">
                    Xem chi tiết 👁️
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Footer -->
      <div style="padding:10px 16px;text-align:center;background:var(--gray-50);border-top:1px solid var(--border-light)">
        <a href="#/support" class="notif-footer-link" style="font-size:11px;font-weight:600;color:var(--primary-600);text-decoration:none;display:inline-flex;align-items:center;gap:4px">
          ${isStudent ? 'Quản lý tất cả yêu cầu hỗ trợ của bạn →' : 'Xem toàn bộ ticket & SLA →'}
        </a>
      </div>
    `;

    // Bind tab clicks
    notifDropdown.querySelectorAll('.notif-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentTab = (btn as HTMLElement).dataset.tab as 'all' | 'unread';
        renderList();
      });
    });

    // Bind mark all read
    document.getElementById('btn-mark-all-read')?.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllNotificationsAsRead();
      renderList();
    });

    // Bind row clicks & preview buttons
    notifDropdown.querySelectorAll('.notif-item-row').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (row as HTMLElement).dataset.id;
        const n = getUserNotifications().find(item => item.id === id);
        if (n) {
          markNotificationAsRead(n.id);
          notifDropdown.style.display = 'none';
          openNotificationModal(n);
        }
      });
    });

    notifDropdown.querySelector('.notif-footer-link')?.addEventListener('click', () => {
      notifDropdown.style.display = 'none';
    });
  }

  notifBtn.onclick = (e) => {
    e.stopPropagation();
    if (notifDropdown.style.display === 'block') {
      notifDropdown.style.display = 'none';
    } else {
      renderList();
      notifDropdown.style.display = 'block';
    }
  };
}

  // Notifications dropdown setup
  setupNotificationDropdown();

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (searchDropdown && !target.closest('.search-input-wrapper')) {
      searchDropdown.style.display = 'none';
    }
    const notifDropdownEl = document.getElementById('notification-dropdown');
    if (notifDropdownEl && !target.closest('#notification-btn') && !target.closest('#notification-dropdown')) {
      notifDropdownEl.style.display = 'none';
    }
  });
}

// === Router Setup ===
function setupRouter() {
  const pages = [
    'login', 'dashboard', 'student-dashboard', 'student-assignments', 'student-schedule', 'schedule', 'student-quizzes',
    'student-results', 'student-join-class', 'student-class-detail',
    'teachers', 'courses', 'classes', 'students', 'attendance', 'announcements', 'assessments', 'quizzes', 'progress', 'support', 'reports', 'audit-log', 'account', 'risk-matrix', 'import', 'grading',
  ];

  pages.forEach(page => {
    router.addRoute(`/${page}`, () => {
      setState({ currentPage: page });
      renderPage(page);
    });
  });

  // Detail pages with params
  router.addRoute('/teachers/:id', () => {
    setState({ currentPage: 'teacher-detail' });
    renderPage('teacher-detail');
  });

  router.addRoute('/students/:id', () => {
    setState({ currentPage: 'student-detail' });
    renderPage('student-detail');
  });

  router.addRoute('/courses/:id', () => {
    setState({ currentPage: 'class-detail' });
    renderPage('class-detail');
  });

  router.addRoute('/classes/:id', () => {
    setState({ currentPage: 'class-detail' });
    renderPage('class-detail');
  });

  router.setNotFound(() => {
    const state = getState();
    if (state.isLoggedIn) {
      window.location.hash = state.currentUser?.role === 'student' ? '#/student-dashboard' : '#/dashboard';
    } else {
      window.location.hash = '#/login';
    }
  });

  router.start();
}

// === Subscribe to State Changes ===
subscribe(() => {
  // Re-render on state change when needed
});

// === Initialize App ===
setupRouter();

// Periodic Python Backend Check
checkBackendOnline();

// If no hash, redirect based on login state
if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
  const state = getState();
  if (state.isLoggedIn) {
    window.location.hash = state.currentUser?.role === 'student' ? '#/student-dashboard' : '#/dashboard';
  } else {
    window.location.hash = '#/login';
  }
}
