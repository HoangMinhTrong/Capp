// ============================================
// EduTrack - Application State Manager
// ============================================

import type { Staff, Role, Campus } from './types.ts';
import { staffData, studentData } from './data.ts';

export interface AppState {
  currentUser: Staff | null;
  currentStudentView: string | null; // for student role login
  currentPage: string;
  selectedCampus: Campus | 'all';
  isLoggedIn: boolean;
  sidebarOpen: boolean;
}

const STATE_KEY = 'edutrack_state';

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate deleted staff (TEA_NN or STF007)
      if (parsed.currentUser && (parsed.currentUser.staff_id === 'TEA_NN' || parsed.currentUser.staff_id === 'STF007')) {
        const replacement = staffData.find(s => s.staff_id === (parsed.currentUser.role === 'teacher' ? 'STF003' : 'STF005'));
        if (replacement) {
          parsed.currentUser = replacement;
          try {
            localStorage.setItem(STATE_KEY, JSON.stringify(parsed));
          } catch { /* ignore */ }
        }
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return {
    currentUser: null,
    currentStudentView: null,
    currentPage: 'login',
    selectedCampus: 'all',
    isLoggedIn: false,
    sidebarOpen: true,
  };
}

let state: AppState = loadState();
const listeners: Array<() => void> = [];

export function getState(): AppState {
  return state;
}

export function setState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
  listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function loginWithCredentials(identifier: string, password: string): { success: boolean; message: string } {
  const q = identifier.trim().toLowerCase();
  const pass = password.trim();

  // 1. Kiểm tra tài khoản Quản trị viên (Admin) & các bí danh vai trò nhanh
  let targetStaffId: string | null = null;
  let targetStudentId: string | null = null;

  if (q === 'admin' || q === 'admin@edutrack.vn' || q === 'admin@edu.vn' || q === 'quantri' || q === 'root') {
    targetStaffId = 'STF001'; // Nguyễn Văn An - Admin hệ thống
  } else if (q === 'cuong' || q === 'leminhcuong' || q === 'cuong.le@edu.vn') {
    targetStaffId = 'STF003'; // Lê Minh Cường - Giảng viên
  } else if (q === 'dung' || q === 'phamthidung' || q === 'dung.pham@edu.vn') {
    targetStaffId = 'STF004'; // Phạm Thị Dung - Giảng viên
  } else if (q === 'teacher' || q === 'giangvien' || q === 'gv' || q === 'teacher@edutrack.vn') {
    targetStaffId = 'STF003'; // Mặc định Lê Minh Cường - Giảng viên
  } else if (q === 'em' || q === 'hoangvanem' || q === 'em.hoang@edu.vn') {
    targetStaffId = 'STF005'; // Hoàng Văn Em - Trợ giảng
  } else if (q === 'phuong' || q === 'vothiphuong' || q === 'phuong.vo@edu.vn') {
    targetStaffId = 'STF006'; // Võ Thị Phương - Trợ giảng
  } else if (q === 'ta' || q === 'trogiang' || q === 'assistant' || q === 'ta@edutrack.vn') {
    targetStaffId = 'STF005'; // Hoàng Văn Em - Trợ giảng
  } else if (q === 'student' || q === 'hocvien' || q === 'hv' || q === 'student@edutrack.vn') {
    targetStudentId = 'SV001'; // Nguyễn Thị Thảo Nguyên - Học viên
  }

  // Kiểm tra thông tin xác thực từ Staff (hoặc alias staff)
  const staff = targetStaffId
    ? staffData.find(s => s.staff_id === targetStaffId)
    : staffData.find(s => s.email.toLowerCase() === q || s.staff_id.toLowerCase() === q);

  if (staff) {
    if (!staff.is_active) {
      return { success: false, message: 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ Quản trị viên.' };
    }
    // Mật khẩu demo linh hoạt: 123456, admin, demo hoặc bất kỳ mật khẩu nào khi demo
    if (pass !== '123456' && pass !== 'admin' && pass !== 'demo' && pass.length < 3) {
      return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu (Mật khẩu demo: 123456)' };
    }
    setState({ currentUser: staff, isLoggedIn: true, currentPage: 'dashboard' });
    window.location.hash = '#/dashboard';
    return { success: true, message: `Đăng nhập thành công với vai trò ${staff.role === 'admin' ? 'Quản trị viên (Admin)' : staff.full_name}!` };
  }

  // Kiểm tra thông tin xác thực từ Student (hoặc alias student)
  const student = targetStudentId
    ? studentData.find(s => s.student_id === targetStudentId)
    : studentData.find(s => s.email.toLowerCase() === q || s.student_code.toLowerCase() === q || s.student_id.toLowerCase() === q);

  if (student) {
    if (student.status === 'inactive' || student.status === 'suspended') {
      return { success: false, message: 'Tài khoản đã bị tạm dừng hoặc ngừng hoạt động. Vui lòng liên hệ Quản trị viên.' };
    }
    if (pass !== '123456' && pass !== 'admin' && pass !== 'demo' && pass.length < 3) {
      return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu (Mật khẩu demo: 123456)' };
    }
    const pseudoStaff: Staff = {
      staff_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      role: 'student' as Role,
      campus: student.campus,
      avatar_initials: student.avatar_initials,
      is_active: true,
    };
    setState({ currentUser: pseudoStaff, currentStudentView: student.student_id, isLoggedIn: true, currentPage: 'student-dashboard' });
    window.location.hash = '#/student-dashboard';
    return { success: true, message: `Đăng nhập cổng học viên thành công: ${student.full_name}!` };
  }

  return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu (Thử: admin / 123456)' };
}

export function login(staffId: string) {
  const user = staffData.find(s => s.staff_id === staffId);
  if (user) {
    setState({ currentUser: user, isLoggedIn: true, currentPage: 'dashboard' });
    window.location.hash = '#/dashboard';
  }
}

export function loginAsStudent(studentId: string) {
  // Create a pseudo-staff entry for student login
  const student = studentData.find(s => s.student_id === studentId);
  if (student) {
    const pseudoStaff: Staff = {
      staff_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      role: 'student' as Role,
      campus: student.campus,
      avatar_initials: student.avatar_initials,
      is_active: true,
    };
    setState({ currentUser: pseudoStaff, currentStudentView: student.student_id, isLoggedIn: true, currentPage: 'student-dashboard' });
    window.location.hash = '#/student-dashboard';
  }
}

export function logout() {
  setState({ currentUser: null, currentStudentView: null, isLoggedIn: false, currentPage: 'login' });
  localStorage.removeItem(STATE_KEY);
  window.location.hash = '#/login';
}

export function hasRole(...roles: Role[]): boolean {
  return !!state.currentUser && roles.includes(state.currentUser.role);
}

export function canAccessPage(page: string): boolean {
  if (!state.currentUser) return page === 'login';

  // Strict RBAC for 'grading': teachers & TAs only (grading.ts scopes to their assigned classes)
  if (page === 'grading') {
    return state.currentUser.role === 'teacher' || state.currentUser.role === 'teaching_assistant';
  }

  // Quản trị viên (Admin) có toàn quyền truy cập tất cả các tính năng khác
  if (state.currentUser.role === 'admin') return true;

  const rolePages: Record<Role, string[]> = {
    admin: ['dashboard', 'teachers', 'teacher-detail', 'courses', 'classes', 'students', 'schedule', 'attendance', 'announcements', 'assessments', 'quizzes', 'progress', 'support', 'reports', 'admin', 'student-detail', 'class-detail', 'import', 'audit-log', 'risk-matrix', 'student-assignments', 'student-schedule', 'student-quizzes', 'student-dashboard', 'account'],
    teacher: ['dashboard', 'classes', 'students', 'schedule', 'attendance', 'announcements', 'assessments', 'quizzes', 'support', 'student-detail', 'class-detail', 'account', 'grading'],
    teaching_assistant: ['dashboard', 'classes', 'attendance', 'students', 'schedule', 'announcements', 'support', 'student-detail', 'class-detail', 'account'],
    student: ['student-dashboard', 'student-assignments', 'student-quizzes', 'student-results', 'student-join-class', 'student-class-detail', 'student-schedule', 'student-support', 'support', 'schedule', 'announcements', 'account'],
  };

  const allowedPages = rolePages[state.currentUser.role] || [];
  return allowedPages.includes(page);
}
