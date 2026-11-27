// ============================================
// EduTrack English - Màn hình Chi tiết Lớp học (/classes/:id)
// Warm Minimalist Design System
// Hỗ trợ cả 2 luồng: 
// 1. Luồng Admin: 3 Tab (Tổng quan, Cấu hình, Mời học viên) + Cột phải Học viên cố định
// 2. Luồng Giáo viên: Danh sách Unit, Sổ đầu bài, Đánh boss & Trình chiếu slide tương tác
// ============================================

import {
  centerClassData,
  classData,
  studentData,
  studentMonitoringData,
  announcementData,
  createAnnouncement,
  classAssignmentData,
} from '../data.ts';
import type { CenterClassItem, CenterClassType } from '../types.ts';
import { getState } from '../state.ts';
import { router } from '../router.ts';
import { showToast } from '../utils.ts';
import {
  lockCenterClassApi,
  deleteCenterClassApi,
  updateCenterClassSettingsApi,
} from '../api.ts';

// State nội bộ
type AdminDetailTab = 'overview' | 'settings' | 'invite';
type TeacherDetailTab = 'timeline' | 'students' | 'assignments' | 'exams' | 'grades' | 'journal' | 'boss';

let activeAdminTab: AdminDetailTab = 'overview';
let activeTeacherTab: TeacherDetailTab = 'timeline';
let adminViewMode: 'admin_dashboard' | 'teacher_units' = 'admin_dashboard';

let isManageDrawerOpen = false;
let isWarningThresholdModalOpen = false;
let isSlidePresentationOpen = false;
let isAddStudentModalOpen = false;
let isTransferStudentModalOpen = false;
let isEditScheduleModalOpen = false;
let selectedStudentForTransfer: { id: string; name: string } | null = null;

let currentSlideIndex = 0;
let presentingUnitNumber = 1;

// Interface cho học viên trong lớp
interface ClassStudentItem {
  student_id: string;
  student_code: string;
  full_name: string;
  avatar_initials: string;
  status_note: string;
  alert_level: 'normal' | 'watch' | 'priority';
}

// Lưu trữ danh sách học viên theo từng lớp (in-memory state)
const classStudentsStore: Record<string, ClassStudentItem[]> = {
  CLS_IELTS_FND: [
    {
      student_id: 'SV_NN',
      student_code: 'HV2026-NN',
      full_name: 'Nguyễn Hồng Nhung',
      avatar_initials: 'HN',
      status_note: 'Học viên mới (miễn cảnh báo)',
      alert_level: 'normal',
    },
  ],
  CLS_NN01: [
    {
      student_id: 'SV_NN',
      student_code: 'HV2026-NN',
      full_name: 'Nguyễn Hồng Nhung',
      avatar_initials: 'HN',
      status_note: 'Học viên mới (miễn cảnh báo)',
      alert_level: 'normal',
    },
  ],
};

// Cấu hình trọng số điểm tổng kết theo lớp
export interface ClassGradeWeights {
  attendance: number;
  homework: number;
  periodic_test: number;
  final_test: number;
}

export const classWeightsStore: Record<string, ClassGradeWeights> = {};

// Cấu hình ngưỡng cảnh báo theo lớp
interface ClassWarningThresholds {
  inactive_days: number;
  missing_homework: number;
  vocab_forget_rate: number;
}

const classThresholdsStore: Record<string, ClassWarningThresholds> = {};

// Cấu hình phạm vi giáo trình
interface ClassCourseScope {
  start_unit: number;
  end_unit: number;
}

const classScopeStore: Record<string, ClassCourseScope> = {};

// Cấu hình lời mời học viên
interface ClassInvitationItem {
  id: string;
  email: string;
  status: 'accepted' | 'expired' | 'revoked';
  date_label: string;
}

const classInvitationsStore: Record<string, ClassInvitationItem[]> = {
  CLS_IELTS_FND: [
    { id: 'INV_1', email: 'hongnhung.student@edutrack.vn', status: 'accepted', date_label: '19/11/2026' },
    { id: 'INV_2', email: 'duc.student@edutrack.vn', status: 'accepted', date_label: '20/11/2026' },
    { id: 'INV_3', email: 'an.nguyen.test@gmail.com', status: 'revoked', date_label: 'Đã thu hồi' },
  ],
};

// 15 Standard Units for IELTS Foundation 5.5 Course
const COURSE_UNITS = [
  { num: 1, title: 'Greetings & Daily Introductions', isOpen: true, openDate: '19/11/2026', completedPercent: '0/1 · 0%' },
  { num: 2, title: 'Introducing Yourself & Career Goals', isOpen: false, openDate: '26/11/2026', completedPercent: '0/1 · 0%' },
  { num: 3, title: 'Numbers, Dates & Daily Schedules', isOpen: false, openDate: '03/12/2026', completedPercent: '0/1 · 0%' },
  { num: 4, title: 'Family, Relationships & Modern Lifestyle', isOpen: false, openDate: '10/12/2026', completedPercent: '0/1 · 0%' },
  { num: 5, title: 'Global Travel & Airport Experience', isOpen: false, openDate: '17/12/2026', completedPercent: '0/1 · 0%' },
  { num: 6, title: 'Food, Dining & Cultural Etiquette', isOpen: false, openDate: '24/12/2026', completedPercent: '0/1 · 0%' },
  { num: 7, title: 'Environment, Climate & Nature', isOpen: false, openDate: '31/12/2026', completedPercent: '0/1 · 0%' },
  { num: 8, title: 'Technology, AI & Modern Innovation', isOpen: false, openDate: '07/01/2027', completedPercent: '0/1 · 0%' },
  { num: 9, title: 'Health, Nutrition & Sports Fitness', isOpen: false, openDate: '14/01/2027', completedPercent: '0/1 · 0%' },
  { num: 10, title: 'Education, Learning & Study Habits', isOpen: false, openDate: '21/01/2027', completedPercent: '0/1 · 0%' },
  { num: 11, title: 'Arts, Media & Entertainment', isOpen: false, openDate: '28/01/2027', completedPercent: '0/1 · 0%' },
  { num: 12, title: 'Work Environment & Business Communication', isOpen: false, openDate: '04/02/2027', completedPercent: '0/1 · 0%' },
  { num: 13, title: 'Urban Living vs Rural Life', isOpen: false, openDate: '11/02/2027', completedPercent: '0/1 · 0%' },
  { num: 14, title: 'History, Archaeology & Heritage', isOpen: false, openDate: '18/02/2027', completedPercent: '0/1 · 0%' },
  { num: 15, title: 'Science, Discovery & Final Review', isOpen: false, openDate: '25/02/2027', completedPercent: '0/1 · 0%' },
];

function getCurrentClass(): CenterClassItem | undefined {
  const id = router.getParams().id;
  const found = centerClassData.find(c => c.class_id === id);
  if (found) return found;
  // Courses page links to classData ids (CLS001, CLS_NN01...), not only centerClassData
  const legacy = classData.find(c => c.class_id === id);
  return legacy ? { ...legacy, class_type: 'regular' } : undefined;
}

function getClassStudents(classId: string): ClassStudentItem[] {
  if (!classStudentsStore[classId]) {
    classStudentsStore[classId] = [
      {
        student_id: 'SV_NN',
        student_code: 'HV2026-NN',
        full_name: 'Nguyễn Hồng Nhung',
        avatar_initials: 'HN',
        status_note: 'Học viên mới (miễn cảnh báo)',
        alert_level: 'normal',
      },
    ];
  }
  return classStudentsStore[classId];
}

export function getClassWeights(classId: string): ClassGradeWeights {
  if (!classWeightsStore[classId]) {
    try {
      const saved = localStorage.getItem(`edutrack_weights_${classId}`);
      if (saved) {
        classWeightsStore[classId] = JSON.parse(saved);
        return classWeightsStore[classId];
      }
    } catch { /* ignore */ }
    classWeightsStore[classId] = {
      attendance: 10,
      homework: 30,
      periodic_test: 30,
      final_test: 30,
    };
  }
  return classWeightsStore[classId];
}

function getClassThresholds(classId: string): ClassWarningThresholds {
  if (!classThresholdsStore[classId]) {
    classThresholdsStore[classId] = {
      inactive_days: 7,
      missing_homework: 2,
      vocab_forget_rate: 40,
    };
  }
  return classThresholdsStore[classId];
}

function getClassScope(classId: string): ClassCourseScope {
  if (!classScopeStore[classId]) {
    classScopeStore[classId] = {
      start_unit: 1,
      end_unit: 15,
    };
  }
  return classScopeStore[classId];
}

function getClassInvitations(classId: string): ClassInvitationItem[] {
  if (!classInvitationsStore[classId]) {
    classInvitationsStore[classId] = [
      { id: 'INV_1', email: 'hongnhung.student@edutrack.vn', status: 'accepted', date_label: '19/11/2026' },
      { id: 'INV_2', email: 'duc.student@edutrack.vn', status: 'accepted', date_label: '20/11/2026' },
      { id: 'INV_3', email: 'an.nguyen.test@gmail.com', status: 'revoked', date_label: 'Đã thu hồi' },
    ];
  }
  return classInvitationsStore[classId];
}

export function renderClassDetailPage(): string {
  const cls = getCurrentClass();
  const state = getState();
  const user = state.currentUser;
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  if (!cls) {
    return `
      <div style="background:#FAF7F2;padding:48px 24px;text-align:center">
        <h2 style="color:#2D2824">Không tìm thấy lớp học</h2>
        <a href="#/classes" style="color:#A93226;font-weight:700">‹ Quay lại danh sách lớp</a>
      </div>
    `;
  }

  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  // Strict RBAC: Check teacher / TA permission
  const isMyClass = isAdmin ||
    (isTeacher && (cls.teacher_id === staffId || classAssignmentData.some(ca => ca.teacher_id === staffId && ca.class_id === cls.class_id))) ||
    (isTA && (classAssignmentData.some(ca => ca.teaching_assistant_id === staffId && ca.class_id === cls.class_id)));

  if ((isTeacher || isTA) && !isMyClass) {
    return `
      <div style="background:#FAF7F2;padding:64px 24px;text-align:center">
        <div style="font-size:48px;margin-bottom:12px">🚫</div>
        <h2 style="color:#2D2824;font-size:22px;font-weight:800;margin:0 0 8px 0">Truy cập bị từ chối (403 Forbidden)</h2>
        <p style="color:#7F7A72;margin:0 0 20px 0;font-size:14px">Bạn không có quyền truy cập vào lớp học mà mình không được phân công phụ trách.</p>
        <a href="#/classes" style="background:#A93226;color:#FFFFFF;padding:10px 20px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13.5px">
          ‹ Về danh sách lớp phụ trách
        </a>
      </div>
    `;
  }

  // Nếu người dùng là Admin và đang ở chế độ xem Admin
  if (isAdmin && adminViewMode === 'admin_dashboard') {
    return renderAdminClassDetailView(cls);
  }

  // Chế độ xem của Giáo viên (hoặc khi Admin bấm xem thử bài giảng Unit)
  return renderTeacherClassDetailView(cls, isAdmin);
}

// =========================================================================
// 1. MÀN HÌNH CHI TIẾT LỚP HỌC (GÓC NHÌN ADMIN: 3 TABS + CỘT PHẢI CỐ ĐỊNH)
// =========================================================================
function renderAdminClassDetailView(cls: CenterClassItem): string {
  const students = getClassStudents(cls.class_id);
  const studentCount = students.length;

  return `
    <div class="class-detail-admin-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. HEADER TRÊN CÙNG: Nút quay lại < + Tên lớp cỡ lớn + Phụ đề + Nút phụ -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:14px">
          <button 
            id="btn-back-to-classes-list" 
            type="button" 
            style="width:38px;height:38px;border-radius:12px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 6px rgba(45,40,36,0.03)"
            title="Quay về danh sách Lớp của trung tâm"
          >
            ‹
          </button>
          <div>
            <h1 id="class-detail-header-title" style="font-size:24px;font-weight:800;color:#2D2824;margin:0 0 4px 0;letter-spacing:-0.02em">
              ${cls.class_name}
            </h1>
            <div style="font-size:13.5px;color:#7F7A72;font-weight:600">
              ${cls.course_name} · GV <span style="color:#A93226;font-weight:700">${cls.teacher_name || 'Lê Minh Cường'}</span>
            </div>
          </div>
        </div>

        <!-- Cụm nút hành động góc trên bên phải cho Admin -->
        <div style="display:flex;align-items:center;gap:10px">
          <button 
            id="btn-switch-to-teacher-units" 
            type="button" 
            style="background:#FFFFFF;color:#A93226;border:1.5px solid #E8C9C5;border-radius:12px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease;box-shadow:0 2px 6px rgba(169,50,38,0.05)"
            title="Xem danh sách 15 Unit và trình chiếu slide bài giảng"
          >
            <span>▶</span>
            <span>Xem giáo trình &amp; Trình chiếu</span>
          </button>

          <button 
            id="btn-open-manage-class-drawer" 
            type="button" 
            style="background:#FFFFFF;color:#2D2824;border:1.5px solid #EAE4D8;border-radius:12px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"
            title="Mở bảng cài đặt nâng cao"
          >
            <span>⚙</span>
            <span>Cài đặt hệ thống</span>
          </button>
        </div>
      </div>

      <!-- 2. THANH 3 TAB ĐIỀU HƯỚNG NGANG (Tổng quan, Cấu hình, Mời học viên) -->
      <div style="display:flex;align-items:center;gap:32px;border-bottom:1.5px solid #EAE4D8;margin-bottom:24px">
        <button 
          class="admin-nav-tab ${activeAdminTab === 'overview' ? 'active' : ''}" 
          data-tab="overview" 
          type="button" 
          style="background:none;border:none;padding:12px 2px;font-size:15px;font-weight:${activeAdminTab === 'overview' ? '800' : '600'};color:${activeAdminTab === 'overview' ? '#A93226' : '#7F7A72'};border-bottom:${activeAdminTab === 'overview' ? '2.5px solid #A93226' : '2.5px solid transparent'};cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:-1.5px;transition:all 0.15s ease"
        >
          <span>Tổng quan</span>
        </button>

        <button 
          class="admin-nav-tab ${activeAdminTab === 'settings' ? 'active' : ''}" 
          data-tab="settings" 
          type="button" 
          style="background:none;border:none;padding:12px 2px;font-size:15px;font-weight:${activeAdminTab === 'settings' ? '800' : '600'};color:${activeAdminTab === 'settings' ? '#A93226' : '#7F7A72'};border-bottom:${activeAdminTab === 'settings' ? '2.5px solid #A93226' : '2.5px solid transparent'};cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:-1.5px;transition:all 0.15s ease"
        >
          <span>Cấu hình</span>
        </button>

        <button 
          class="admin-nav-tab ${activeAdminTab === 'invite' ? 'active' : ''}" 
          data-tab="invite" 
          type="button" 
          style="background:none;border:none;padding:12px 2px;font-size:15px;font-weight:${activeAdminTab === 'invite' ? '800' : '600'};color:${activeAdminTab === 'invite' ? '#A93226' : '#7F7A72'};border-bottom:${activeAdminTab === 'invite' ? '2.5px solid #A93226' : '2.5px solid transparent'};cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:-1.5px;transition:all 0.15s ease"
        >
          <span>Mời học viên</span>
        </button>
      </div>

      <!-- 3. BỐ CỤC 2 CỘT (Cột trái ~68% thay đổi theo tab, Cột phải ~32% cố định Học viên) -->
      <div style="display:flex;gap:24px;align-items:flex-start">
        
        <!-- CỘT TRÁI (~68%) -->
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:20px">
          ${activeAdminTab === 'overview' ? renderAdminOverviewTab(cls, students) : ''}
          ${activeAdminTab === 'settings' ? renderAdminSettingsTab(cls) : ''}
          ${activeAdminTab === 'invite' ? renderAdminInviteTab(cls) : ''}
        </div>

        <!-- CỘT PHẢI CỐ ĐỊNH (~32%) — THẺ QUẢN LÝ "HỌC VIÊN (N)" -->
        <div style="width:340px;flex-shrink:0">
          ${renderFixedStudentsCard(cls, students, studentCount)}
        </div>

      </div>

      <!-- Modal Thêm học viên sẵn có -->
      ${renderAddStudentModal(cls)}

      <!-- Modal Chuyển lớp -->
      ${renderTransferStudentModal(cls)}

      <!-- Modal Điều chỉnh lịch học -->
      ${renderEditScheduleModal(cls)}

      <!-- Drawer Quản lý lớp nâng cao -->
      ${renderManageClassDrawer(cls, true)}

    </div>
  `;
}

// -------------------------------------------------------------------------
// TAB 1 (ADMIN): TỔNG QUAN
// -------------------------------------------------------------------------
function renderAdminOverviewTab(cls: CenterClassItem, students: ClassStudentItem[]): string {
  const attentionCount = students.filter(s => s.alert_level === 'watch' || s.alert_level === 'priority').length;
  const startDateStr = cls.start_date ? cls.start_date.split('-').reverse().join('/') : '19/11/2026';
  const endDateStr = cls.end_date ? cls.end_date.split('-').reverse().join('/') : '—';

  return `
    <!-- Thẻ lớn: Thông tin lớp -->
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <h2 style="font-size:17.5px;font-weight:800;color:#2D2824;margin:0">
          Thông tin lớp
        </h2>
        <span style="background:#E2F6ED;color:#059669;border:1px solid #A7F3D0;font-size:12px;font-weight:700;padding:4px 12px;border-radius:9999px">
          ● Đang mở
        </span>
      </div>

      <!-- Dòng chỉnh sửa tên lớp -->
      <div style="margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid #F2ECE1">
        <label for="input-class-name-overview" style="display:block;font-size:12.5px;font-weight:700;color:#7F7A72;margin-bottom:6px">
          Tên lớp học
        </label>
        <div style="display:flex;gap:10px">
          <input 
            id="input-class-name-overview" 
            type="text" 
            value="${cls.class_name}" 
            data-original="${cls.class_name}"
            style="flex:1;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:14px;font-weight:600;color:#2D2824;outline:none;box-sizing:border-box"
          />
          <button 
            id="btn-rename-class" 
            type="button" 
            disabled
            style="height:42px;padding:0 20px;border:1px solid #EAE4D8;border-radius:12px;background:#F6F4F0;color:#A8A29A;font-size:13.5px;font-weight:700;cursor:not-allowed;transition:all 0.15s ease;white-space:nowrap"
          >
            Đổi tên
          </button>
        </div>
      </div>

      <!-- Lưới thông tin 2 cột chia 2 bên -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 28px;margin-bottom:22px;font-size:13.5px">
        
        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Trạng thái:</span>
          <strong style="color:#059669">Đang mở</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Khóa học:</span>
          <strong style="color:#2D2824;text-align:right">${cls.course_name}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">GV phụ trách:</span>
          <strong style="color:#A93226">${cls.teacher_name || 'Lê Minh Cường'}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Mã lớp:</span>
          <strong style="color:#2D2824;font-family:monospace;letter-spacing:0.05em">${cls.class_code}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Bắt đầu:</span>
          <strong style="color:#2D2824">${startDateStr}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Kết thúc:</span>
          <strong style="color:#2D2824">${endDateStr}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Lịch học:</span>
          <strong style="color:#2D2824">${cls.days_of_week || cls.schedule || 'T2, T3, T4, T5'}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Sĩ số:</span>
          <strong style="color:#2D2824">${students.length} học viên</strong>
        </div>

        <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #F2ECE1;padding-bottom:8px">
          <span style="color:#7F7A72">Cần chú ý:</span>
          <strong style="color:${attentionCount > 0 ? '#A93226' : '#059669'}">${attentionCount} học viên</strong>
        </div>

      </div>

      <!-- 2 nút trải ngang ở đáy thẻ -->
      <div style="display:flex;gap:12px;padding-top:10px;border-top:1px solid #F2ECE1">
        <button 
          id="btn-open-edit-schedule-modal" 
          type="button" 
          style="flex:1;height:42px;background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:all 0.15s ease"
        >
          <span>📅</span>
          <span>Điều chỉnh lịch học</span>
        </button>

        <button 
          id="btn-scroll-to-csat" 
          type="button" 
          style="flex:1;height:42px;background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:all 0.15s ease"
        >
          <span>☑</span>
          <span>Kết quả khảo sát</span>
        </button>
      </div>

    </div>

    <!-- Thẻ bên dưới: 📊 Hài lòng học viên (CSAT) -->
    <div id="card-csat-section" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03);transition:all 0.3s ease">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <h3 style="font-size:16.5px;font-weight:800;color:#2D2824;margin:0">
          📊 Hài lòng học viên (CSAT)
        </h3>
        <span style="font-size:12.5px;color:#7F7A72;font-weight:600">Thang đo 5★</span>
      </div>

      <div style="background:#FAF7F2;border:1px dashed #EAE4D8;border-radius:16px;padding:28px 20px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px;opacity:0.6">☆☆☆☆☆</div>
        <div style="font-size:14px;color:#7F7A72;font-weight:600;margin-bottom:4px">
          Chưa có học viên nào trả lời khảo sát hài lòng cuối khóa.
        </div>
        <div style="font-size:12px;color:#A8A29A">
          Khảo sát tự động gửi tới học viên khi lớp hoàn thành 80% giáo trình đào tạo.
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------------------
// TAB 2 (ADMIN): CẤU HÌNH (4 THẺ XẾP DỌC)
// -------------------------------------------------------------------------
function renderAdminSettingsTab(cls: CenterClassItem): string {
  const weights = getClassWeights(cls.class_id);
  const thresholds = getClassThresholds(cls.class_id);
  const scope = getClassScope(cls.class_id);
  const totalWeight = weights.attendance + weights.homework + weights.periodic_test + weights.final_test;
  const isWeightValid = totalWeight === 100;

  return `
    <!-- Thẻ 1 — Trọng số điểm tổng kết -->
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <div style="margin-bottom:14px">
        <h3 style="font-size:16.5px;font-weight:800;color:#2D2824;margin:0 0 4px 0">
          ⚖ Trọng số điểm tổng kết
        </h3>
        <div style="font-size:12.5px;color:#7F7A72;line-height:1.45">
          Tổng kết = trung bình theo trọng số của 4 thành phần (tổng 100%). Trọng số khóa vĩnh viễn khi lớp có bài được chấm đầu tiên. Giáo viên chỉ xem.
        </div>
      </div>

      <!-- Hàng ngang 4 ô nhập số -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;margin-bottom:14px">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Chuyên cần (%)</label>
          <input id="weight-attendance" type="number" min="0" max="100" value="${weights.attendance}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;font-weight:700;color:#2D2824;outline:none;box-sizing:border-box" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Bài tập về nhà (%)</label>
          <input id="weight-homework" type="number" min="0" max="100" value="${weights.homework}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;font-weight:700;color:#2D2824;outline:none;box-sizing:border-box" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Test định kỳ (%)</label>
          <input id="weight-periodic" type="number" min="0" max="100" value="${weights.periodic_test}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;font-weight:700;color:#2D2824;outline:none;box-sizing:border-box" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Test cuối khóa (%)</label>
          <input id="weight-final" type="number" min="0" max="100" value="${weights.final_test}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;font-weight:700;color:#2D2824;outline:none;box-sizing:border-box" />
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px dashed #EAE4D8">
        <div id="weight-sum-indicator" style="font-size:12.5px;font-weight:700;color:${isWeightValid ? '#059669' : '#A93226'}">
          ${isWeightValid ? '✓ Tổng: 100% (Hợp lệ)' : `⚠ Tổng: ${totalWeight}% (Phải bằng đúng 100%)`}
        </div>
        <button 
          id="btn-save-weights" 
          type="button" 
          style="height:38px;padding:0 20px;border:none;border-radius:10px;background:#A93226;color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(169,50,38,0.2)"
        >
          Lưu trọng số
        </button>
      </div>
    </div>

    <!-- Thẻ 2 — 📖 Phạm vi giáo trình -->
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <div style="margin-bottom:14px">
        <h3 style="font-size:16.5px;font-weight:800;color:#2D2824;margin:0 0 4px 0">
          📖 Phạm vi giáo trình
        </h3>
        <div style="font-size:12.5px;color:#7F7A72;line-height:1.45">
          Lớp học từ bài nào đến bài nào. Để trống cả hai = dạy trọn khóa. Nới phạm vi sẽ thêm mốc mở bài theo nhịp của lớp; thu hẹp chỉ gỡ mốc của bài chưa tới hạn mở — bài học viên đã mở thì giữ lại để xem lại.
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Bắt đầu từ</label>
          <select id="scope-start-unit" style="width:100%;height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none">
            ${Array.from({ length: 15 }, (_, i) => `
              <option value="${i + 1}" ${scope.start_unit === i + 1 ? 'selected' : ''}>Từ Unit ${i + 1}</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Kết thúc tại</label>
          <select id="scope-end-unit" style="width:100%;height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none">
            ${Array.from({ length: 15 }, (_, i) => `
              <option value="${i + 1}" ${scope.end_unit === i + 1 ? 'selected' : ''}>
                ${i + 1 === 15 ? 'Hết khóa (15 Units)' : `Đến Unit ${i + 1}`}
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button 
          id="btn-save-scope-admin" 
          type="button" 
          style="height:38px;padding:0 22px;border:none;border-radius:10px;background:#A93226;color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(169,50,38,0.2)"
        >
          Lưu
        </button>
      </div>
    </div>

    <!-- Thẻ 3 — 🏷 Loại lớp -->
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <div style="margin-bottom:14px">
        <h3 style="font-size:16.5px;font-weight:800;color:#2D2824;margin:0 0 4px 0">
          🏷 Loại lớp
        </h3>
        <div style="font-size:12.5px;color:#7F7A72;line-height:1.45">
          Quyết định lớp này dùng tính năng nào. Đổi loại không xóa dữ liệu — chỉ ẩn/hiện.
        </div>
      </div>

      <!-- Lưới 2x2 radio card chọn loại lớp -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        ${renderTypeRadioCard('regular', 'Lớp thường', 'Đủ tính năng: lịch buổi, điểm danh, bài tập, bảng điểm', cls.class_type === 'regular')}
        ${renderTypeRadioCard('self_study', 'Lớp tự học', 'Không có lịch buổi nên không điểm danh; mở sẵn toàn bộ bài để HV tự học, vẫn giao bài tập được', cls.class_type === 'self_study')}
        ${renderTypeRadioCard('communication', 'Lớp giao tiếp', 'Có lịch buổi nhưng không điểm danh, không bài tập — chỉ tập trung luyện nói', cls.class_type === 'communication')}
        ${renderTypeRadioCard('trial', 'Lớp học thử', 'Học thử: tối đa 3 buổi, không bài tập, không phát mã lớp, tự lưu trữ ngay khi hết buổi', cls.class_type === 'trial')}
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button 
          id="btn-save-class-type-admin" 
          type="button" 
          style="height:38px;padding:0 20px;border:none;border-radius:10px;background:#A93226;color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(169,50,38,0.2)"
        >
          Đổi loại lớp
        </button>
      </div>
    </div>

    <!-- Thẻ 4 — ⚠ Ngưỡng cảnh báo -->
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <div style="margin-bottom:14px">
        <h3 style="font-size:16.5px;font-weight:800;color:#2D2824;margin:0 0 4px 0">
          ⚠ Ngưỡng cảnh báo
        </h3>
        <div style="font-size:12.5px;color:#7F7A72;line-height:1.45">
          Điều chỉnh ngưỡng “Chú ý” / “Nguy cơ” phù hợp với lịch học của lớp. Giáo viên chỉ xem.
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:14px">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Không hoạt động (ngày)</label>
          <input id="thresh-inactive" type="number" min="1" max="30" value="${thresholds.inactive_days}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;font-weight:700;color:#2D2824;outline:none;box-sizing:border-box" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Bài còn thiếu (bài)</label>
          <input id="thresh-missing" type="number" min="1" max="10" value="${thresholds.missing_homework}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;font-weight:700;color:#2D2824;outline:none;box-sizing:border-box" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#2D2824;margin-bottom:4px">Tỷ lệ quên từ (%)</label>
          <input id="thresh-forget" type="number" min="10" max="90" value="${thresholds.vocab_forget_rate}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;font-weight:700;color:#2D2824;outline:none;box-sizing:border-box" />
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button 
          id="btn-save-thresholds-admin" 
          type="button" 
          style="height:38px;padding:0 20px;border:none;border-radius:10px;background:#A93226;color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(169,50,38,0.2)"
        >
          Lưu ngưỡng
        </button>
      </div>
    </div>
  `;
}

function renderTypeRadioCard(type: string, title: string, desc: string, isChecked: boolean): string {
  return `
    <label 
      class="class-type-select-card ${isChecked ? 'selected' : ''}" 
      data-type="${type}"
      style="border:1.5px solid ${isChecked ? '#A93226' : '#EAE4D8'};border-radius:12px;padding:12px 14px;cursor:pointer;background:${isChecked ? '#F5E6E4' : '#FFFFFF'};display:flex;flex-direction:column;gap:4px;transition:all 0.15s ease"
    >
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13.5px;font-weight:700;color:${isChecked ? '#A93226' : '#2D2824'}">${title}</span>
        <input type="radio" name="admin_class_type" value="${type}" ${isChecked ? 'checked' : ''} style="accent-color:#A93226" />
      </div>
      <div style="font-size:11.5px;color:#7F7A72;line-height:1.35">${desc}</div>
    </label>
  `;
}

// -------------------------------------------------------------------------
// TAB 3 (ADMIN): MỜI HỌC VIÊN (2 THẺ LỚN XẾP DỌC)
// -------------------------------------------------------------------------
function renderAdminInviteTab(cls: CenterClassItem): string {
  const invitations = getClassInvitations(cls.class_id);
  const acceptedInvites = invitations.filter(i => i.status === 'accepted');
  const revokedInvites = invitations.filter(i => i.status === 'revoked' || i.status === 'expired');
  const joinUrl = `https://edutrack.vn/join?code=${cls.class_code}`;

  return `
    <!-- Thẻ 1 — 🔗 Mời vào lớp -->
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <h3 style="font-size:16.5px;font-weight:800;color:#2D2824;margin:0 0 16px 0">
        🔗 Mời vào lớp
      </h3>

      <!-- Mục 1: Mã lớp -->
      <div style="margin-bottom:18px">
        <label style="display:block;font-size:12.5px;font-weight:700;color:#7F7A72;margin-bottom:6px">
          Mã lớp — học viên nhập ở "Vào lớp"
        </label>
        <div style="display:flex;gap:10px">
          <div style="flex:1;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FAF7F2;display:flex;align-items:center;font-size:16px;font-weight:800;font-family:monospace;letter-spacing:0.1em;color:#2D2824">
            ${cls.class_code}
          </div>
          <button 
            id="btn-copy-class-code" 
            data-code="${cls.class_code}"
            type="button" 
            style="height:42px;padding:0 18px;border:1.5px solid #A93226;border-radius:12px;background:#FFFFFF;color:#A93226;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
          >
            Sao chép
          </button>
        </div>
      </div>

      <!-- Mục 2: Link tham gia & QR Code -->
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:12.5px;font-weight:700;color:#7F7A72;margin-bottom:6px">
          Hoặc gửi link / cho quét QR
        </label>
        <div style="display:flex;gap:10px;margin-bottom:16px">
          <input 
            type="text" 
            readonly 
            value="${joinUrl}" 
            style="flex:1;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FAF7F2;font-size:13px;color:#2D2824;outline:none"
          />
          <button 
            id="btn-copy-join-link" 
            data-link="${joinUrl}"
            type="button" 
            style="height:42px;padding:0 18px;border:1.5px solid #A93226;border-radius:12px;background:#FFFFFF;color:#A93226;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
          >
            Sao chép
          </button>
        </div>

        <!-- Hình mã QR vuông căn giữa ngay bên dưới -->
        <div style="background:#FDFBF7;border:1px solid #EAE4D8;border-radius:16px;padding:20px;max-width:240px;margin:0 auto;text-align:center;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <svg width="140" height="140" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto">
            <!-- QR Position Targets -->
            <rect x="5" y="5" width="28" height="28" rx="4" fill="#2D2824" />
            <rect x="9" y="9" width="20" height="20" rx="2" fill="#FFFFFF" />
            <rect x="13" y="13" width="12" height="12" rx="1" fill="#A93226" />

            <rect x="67" y="5" width="28" height="28" rx="4" fill="#2D2824" />
            <rect x="71" y="9" width="20" height="20" rx="2" fill="#FFFFFF" />
            <rect x="75" y="13" width="12" height="12" rx="1" fill="#A93226" />

            <rect x="5" y="67" width="28" height="28" rx="4" fill="#2D2824" />
            <rect x="9" y="71" width="20" height="20" rx="2" fill="#FFFFFF" />
            <rect x="13" y="75" width="12" height="12" rx="1" fill="#A93226" />

            <!-- Random Matrix Modules -->
            <rect x="38" y="8" width="6" height="6" fill="#2D2824" />
            <rect x="48" y="12" width="6" height="6" fill="#2D2824" />
            <rect x="56" y="8" width="6" height="6" fill="#2D2824" />
            <rect x="38" y="22" width="6" height="6" fill="#2D2824" />
            <rect x="46" y="26" width="6" height="6" fill="#2D2824" />

            <rect x="8" y="38" width="6" height="6" fill="#2D2824" />
            <rect x="16" y="46" width="6" height="6" fill="#2D2824" />
            <rect x="24" y="38" width="6" height="6" fill="#2D2824" />
            <rect x="8" y="52" width="6" height="6" fill="#2D2824" />

            <rect x="38" y="38" width="8" height="8" rx="2" fill="#A93226" />
            <rect x="54" y="38" width="6" height="6" fill="#2D2824" />
            <rect x="46" y="48" width="8" height="8" rx="1" fill="#2D2824" />
            <rect x="38" y="58" width="6" height="6" fill="#2D2824" />
            <rect x="50" y="62" width="6" height="6" fill="#2D2824" />

            <rect x="68" y="38" width="6" height="6" fill="#2D2824" />
            <rect x="80" y="42" width="6" height="6" fill="#2D2824" />
            <rect x="74" y="52" width="6" height="6" fill="#2D2824" />
            <rect x="86" y="58" width="6" height="6" fill="#2D2824" />

            <rect x="38" y="74" width="6" height="6" fill="#2D2824" />
            <rect x="48" y="82" width="6" height="6" fill="#2D2824" />
            <rect x="56" y="74" width="6" height="6" fill="#2D2824" />
            <rect x="68" y="78" width="6" height="6" fill="#2D2824" />
            <rect x="80" y="84" width="6" height="6" fill="#2D2824" />
            <rect x="74" y="68" width="6" height="6" fill="#2D2824" />
          </svg>
          <div style="font-size:12px;color:#7F7A72;font-weight:600;margin-top:8px">Quét mã để vào lớp</div>
        </div>
      </div>

      <!-- Mục 3: Mời qua email -->
      <div style="padding-top:18px;border-top:1px dashed #EAE4D8">
        <label style="display:block;font-size:12.5px;font-weight:700;color:#7F7A72;margin-bottom:6px">
          Hoặc mời qua email (gửi link cho học viên)
        </label>
        <form id="form-invite-email" style="display:flex;gap:10px">
          <input 
            id="input-invite-email" 
            type="email" 
            required 
            placeholder="Email học viên" 
            style="flex:1;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13.5px;color:#2D2824;outline:none"
          />
          <button 
            type="submit" 
            style="height:42px;padding:0 24px;border:none;border-radius:12px;background:#A93226;color:#FFFFFF;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(169,50,38,0.2)"
          >
            Mời
          </button>
        </form>
      </div>

    </div>

    <!-- Thẻ 2 — Tình hình lời mời (N) -->
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <h3 style="font-size:16.5px;font-weight:800;color:#2D2824;margin:0 0 16px 0">
        Tình hình lời mời (${invitations.length})
      </h3>

      <!-- Nhóm 1: ĐÃ VÀO LỚP -->
      <div style="margin-bottom:20px">
        <div style="font-size:12.5px;font-weight:800;color:#059669;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.04em">
          ĐÃ VÀO LỚP (${acceptedInvites.length})
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          ${acceptedInvites.map(inv => `
            <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
              <div>
                <div style="font-weight:700;color:#2D2824;font-size:13.5px">${inv.email}</div>
                <div style="font-size:11.5px;color:#7F7A72">Đã chấp nhận: ${inv.date_label}</div>
              </div>
              <span style="font-size:12px;font-weight:700;color:#059669;background:#E2F6ED;padding:3px 10px;border-radius:9999px">
                ● Đã vào lớp
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Nhóm 2: HẾT HIỆU LỰC -->
      <div>
        <div style="font-size:12.5px;font-weight:800;color:#7F7A72;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.04em">
          HẾT HIỆU LỰC (${revokedInvites.length})
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          ${revokedInvites.map(inv => `
            <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
              <div>
                <div style="font-weight:600;color:#7F7A72;font-size:13.5px">${inv.email}</div>
                <div style="font-size:11.5px;color:#A8A29A">${inv.date_label}</div>
              </div>
              <button 
                class="btn-resend-invite" 
                data-email="${inv.email}"
                type="button" 
                style="height:32px;padding:0 14px;border:1.5px solid #A93226;border-radius:8px;background:#FFFFFF;color:#A93226;font-size:12px;font-weight:700;cursor:pointer"
              >
                Mời lại
              </button>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------------------
// CỘT PHẢI CỐ ĐỊNH — THẺ QUẢN LÝ "HỌC VIÊN (N)"
// -------------------------------------------------------------------------
function renderFixedStudentsCard(_cls: CenterClassItem, students: ClassStudentItem[], studentCount: number): string {
  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:22px 24px;box-shadow:0 2px 10px rgba(45,40,36,0.03);position:sticky;top:88px">
      
      <!-- Hàng tiêu đề: Học viên (N) + Nút viền đỏ đất -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px">
        <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0">
          Học viên (${studentCount})
        </h3>
        <button 
          id="btn-open-add-student-modal" 
          type="button" 
          style="background:#FFFFFF;color:#A93226;border:1.5px solid #A93226;border-radius:10px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.15s ease"
        >
          + Thêm học viên sẵn có
        </button>
      </div>

      <!-- Dòng ghi chú màu xám bên dưới -->
      <div style="font-size:12px;color:#7F7A72;line-height:1.4;margin-bottom:16px">
        Trung tâm quản danh sách lớp. Điểm danh / chấm bài do giáo viên phụ trách thực hiện.
      </div>

      <!-- Danh sách thẻ học viên trong lớp -->
      <div id="class-students-list-fixed" style="display:flex;flex-direction:column;gap:12px">
        ${students.length === 0 ? `
          <div style="padding:28px 12px;text-align:center;color:#7F7A72;font-size:13px;background:#FAF7F2;border-radius:12px;border:1px dashed #EAE4D8">
            Chưa có học viên nào trong lớp này.
          </div>
        ` : students.map(st => {
          let badgeStyle = 'background:#E2F6ED;color:#059669;';
          let badgeText = '● Ổn';
          if (st.alert_level === 'watch') {
            badgeStyle = 'background:#FFFBEB;color:#B45309;';
            badgeText = '● Chú ý';
          } else if (st.alert_level === 'priority') {
            badgeStyle = 'background:#FEF2F2;color:#A93226;';
            badgeText = '● Nguy cơ';
          }

          return `
            <div 
              class="class-fixed-student-item" 
              data-id="${st.student_id}"
              style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;transition:all 0.15s ease"
            >
              <!-- Hàng trên: Avatar tròn + Tên in đậm + Ghi chú + Badge xanh lá -->
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:38px;height:38px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:800;color:#A93226;font-size:13px;flex-shrink:0">
                    ${st.avatar_initials}
                  </div>
                  <div>
                    <div style="font-size:14px;font-weight:800;color:#2D2824">${st.full_name}</div>
                    <div style="font-size:11.5px;color:#7F7A72;margin-top:2px">${st.status_note}</div>
                  </div>
                </div>

                <span style="font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:9999px;white-space:nowrap;${badgeStyle}">
                  ${badgeText}
                </span>
              </div>

              <!-- Hàng dưới bên phải: Nút Chuyển lớp & Mời ra -->
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-top:8px;border-top:1px dashed #EAE4D8">
                <button 
                  class="btn-trigger-transfer-student" 
                  data-student-id="${st.student_id}" 
                  data-student-name="${st.full_name}" 
                  type="button" 
                  style="background:#FFFFFF;color:#A93226;border:1px solid #E8C9C5;border-radius:8px;padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer"
                >
                  Chuyển lớp
                </button>
                <button 
                  class="btn-trigger-remove-student" 
                  data-student-id="${st.student_id}" 
                  data-student-name="${st.full_name}" 
                  type="button" 
                  style="background:none;border:none;color:#7F7A72;font-size:11.5px;font-weight:600;cursor:pointer;padding:4px 6px"
                  onmouseover="this.style.color='#A93226'"
                  onmouseout="this.style.color='#7F7A72'"
                >
                  Mời ra
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

// -------------------------------------------------------------------------
// MODALS DÀNH CHO ADMIN
// -------------------------------------------------------------------------
function renderAddStudentModal(cls: CenterClassItem): string {
  const currentStudentIds = new Set(getClassStudents(cls.class_id).map(s => s.student_id));
  const availableStudents = studentMonitoringData.filter(s => !currentStudentIds.has(s.student_id));

  return `
    <div id="modal-add-existing-student" style="display:${isAddStudentModalOpen ? 'flex' : 'none'};position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:520px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 48px rgba(0,0,0,0.18)">
        
        <div style="padding:18px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between">
          <div>
            <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0 0 2px 0">Thêm học viên sẵn có vào lớp</h3>
            <div style="font-size:12px;color:#7F7A72">Chọn học viên từ danh sách trung tâm để gán vào "${cls.class_name}"</div>
          </div>
          <button id="btn-close-add-student-modal" type="button" style="background:none;border:none;color:#A8A29A;cursor:pointer;font-size:18px">✕</button>
        </div>

        <div style="padding:18px 24px">
          <!-- Ô tìm kiếm -->
          <input 
            id="input-search-add-student" 
            type="text" 
            placeholder="Tìm theo tên hoặc mã học viên..." 
            style="width:100%;height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box;margin-bottom:14px"
          />

          <!-- Danh sách học viên có thể thêm -->
          <div id="available-students-list" style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto">
            ${availableStudents.length === 0 ? `
              <div style="text-align:center;color:#7F7A72;padding:24px;font-size:13px">
                Tất cả học viên trong trung tâm đã có mặt trong lớp này.
              </div>
            ` : availableStudents.map(st => `
              <div style="border:1px solid #EAE4D8;border-radius:12px;padding:10px 14px;background:#FAF7F2;display:flex;align-items:center;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:34px;height:34px;border-radius:50%;background:#F5E6E4;color:#A93226;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center">
                    ${st.avatar_initials}
                  </div>
                  <div>
                    <div style="font-size:13.5px;font-weight:700;color:#2D2824">${st.full_name}</div>
                    <div style="font-size:11.5px;color:#7F7A72">${st.student_code} · ${st.course_name || 'Khóa học'}</div>
                  </div>
                </div>
                <button 
                  class="btn-do-add-student" 
                  data-student-id="${st.student_id}"
                  data-student-code="${st.student_code}"
                  data-student-name="${st.full_name}"
                  data-student-initials="${st.avatar_initials}"
                  type="button" 
                  style="height:32px;padding:0 14px;background:#A93226;color:#FFFFFF;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer"
                >
                  + Thêm
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="padding:14px 24px;border-top:1px solid #EAE4D8;display:flex;justify-content:flex-end">
          <button id="btn-done-add-student" type="button" style="height:36px;padding:0 20px;background:#F2ECE1;border:none;border-radius:10px;font-size:13px;font-weight:700;color:#2D2824;cursor:pointer">
            Đóng
          </button>
        </div>

      </div>
    </div>
  `;
}

function renderTransferStudentModal(cls: CenterClassItem): string {
  const otherClasses = centerClassData.filter(c => c.class_id !== cls.class_id);

  return `
    <div id="modal-transfer-student" style="display:${isTransferStudentModalOpen ? 'flex' : 'none'};position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:480px;box-shadow:0 24px 48px rgba(0,0,0,0.18)">
        
        <div style="padding:18px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between">
          <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0">Chuyển học viên sang lớp khác</h3>
          <button id="btn-close-transfer-modal" type="button" style="background:none;border:none;color:#A8A29A;cursor:pointer;font-size:18px">✕</button>
        </div>

        <form id="form-do-transfer-student" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="display:block;font-size:12.5px;font-weight:700;color:#7F7A72;margin-bottom:4px">Học viên cần chuyển</label>
            <input 
              id="transfer-student-name" 
              type="text" 
              readonly 
              value="${selectedStudentForTransfer?.name || ''}" 
              style="width:100%;height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#F6F4F0;font-size:13px;font-weight:700;color:#2D2824;box-sizing:border-box"
            />
          </div>

          <div>
            <label for="select-target-class" style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:4px">Chọn lớp học chuyển đến <span style="color:#A93226">*</span></label>
            <select id="select-target-class" required style="width:100%;height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none">
              <option value="">— Chọn lớp đích —</option>
              ${otherClasses.map(c => `
                <option value="${c.class_id}">${c.class_name} (${c.class_code})</option>
              `).join('')}
            </select>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;border-top:1px solid #EAE4D8;padding-top:14px">
            <button id="btn-cancel-transfer" type="button" style="height:38px;padding:0 18px;border:1px solid #EAE4D8;border-radius:10px;background:#FFFFFF;font-size:13px;font-weight:700;color:#7F7A72;cursor:pointer">Hủy</button>
            <button type="submit" style="height:38px;padding:0 22px;border:none;border-radius:10px;background:#A93226;font-size:13px;font-weight:700;color:#FFFFFF;cursor:pointer">Xác nhận chuyển lớp</button>
          </div>
        </form>

      </div>
    </div>
  `;
}

function renderEditScheduleModal(cls: CenterClassItem): string {
  const currentDays = cls.days_of_week || 'T2,T4,T6';
  const isT2 = currentDays.includes('T2');
  const isT3 = currentDays.includes('T3');
  const isT4 = currentDays.includes('T4');
  const isT5 = currentDays.includes('T5');
  const isT6 = currentDays.includes('T6');
  const isT7 = currentDays.includes('T7');
  const isCN = currentDays.includes('CN');

  return `
    <div id="modal-edit-schedule" style="display:${isEditScheduleModalOpen ? 'flex' : 'none'};position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:500px;box-shadow:0 24px 48px rgba(0,0,0,0.18)">
        
        <div style="padding:18px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between">
          <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0">📅 Điều chỉnh lịch học của lớp</h3>
          <button id="btn-close-edit-schedule-modal" type="button" style="background:none;border:none;color:#A8A29A;cursor:pointer;font-size:18px">✕</button>
        </div>

        <form id="form-save-schedule" style="padding:20px 24px;display:flex;flex-direction:column;gap:16px">
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label for="schedule-start-date" style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:4px">Ngày bắt đầu</label>
              <input id="schedule-start-date" type="date" value="${cls.start_date || '2026-11-19'}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box" />
            </div>
            <div>
              <label for="schedule-end-date" style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:4px">Dự kiến kết thúc</label>
              <input id="schedule-end-date" type="date" value="${cls.end_date || ''}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box" />
            </div>
          </div>

          <div>
            <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:8px">Các thứ học trong tuần</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${renderDayCheckbox('T2', 'Thứ 2', isT2)}
              ${renderDayCheckbox('T3', 'Thứ 3', isT3)}
              ${renderDayCheckbox('T4', 'Thứ 4', isT4)}
              ${renderDayCheckbox('T5', 'Thứ 5', isT5)}
              ${renderDayCheckbox('T6', 'Thứ 6', isT6)}
              ${renderDayCheckbox('T7', 'Thứ 7', isT7)}
              ${renderDayCheckbox('CN', 'Chủ nhật', isCN)}
            </div>
          </div>

          <div>
            <label for="schedule-time-slot" style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:4px">Ca học / Giờ học</label>
            <input id="schedule-time-slot" type="text" value="${cls.schedule || '19:12 - 22:12'}" style="width:100%;height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;border-top:1px solid #EAE4D8;padding-top:14px">
            <button id="btn-cancel-edit-schedule" type="button" style="height:38px;padding:0 18px;border:1px solid #EAE4D8;border-radius:10px;background:#FFFFFF;font-size:13px;font-weight:700;color:#7F7A72;cursor:pointer">Hủy</button>
            <button type="submit" style="height:38px;padding:0 22px;border:none;border-radius:10px;background:#A93226;font-size:13px;font-weight:700;color:#FFFFFF;cursor:pointer">Lưu thay đổi</button>
          </div>
        </form>

      </div>
    </div>
  `;
}

function renderDayCheckbox(code: string, label: string, isChecked: boolean): string {
  return `
    <label style="border:1px solid #EAE4D8;border-radius:8px;padding:6px 10px;background:#FAF7F2;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600">
      <input type="checkbox" name="class_schedule_days" value="${code}" ${isChecked ? 'checked' : ''} style="accent-color:#A93226" />
      <span>${label}</span>
    </label>
  `;
}

// =========================================================================
// 2. MÀN HÌNH CHI TIẾT LỚP HỌC (GÓC NHÌN GIÁO VIÊN HOẶC CHẾ ĐỘ XEM BÀI HỌC)
// =========================================================================
function renderTeacherClassDetailView(cls: CenterClassItem, isAdmin: boolean): string {
  const classTypeLabel = cls.class_type === 'self_study' ? 'Lớp tự học'
    : cls.class_type === 'communication' ? 'Lớp giao tiếp'
    : cls.class_type === 'trial' ? 'Lớp học thử'
    : 'Lớp thường';

  return `
    <div class="class-detail-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang: Nút quay lại < + Tên lớp + Nút chuyển đổi -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:14px">
          <button 
            id="btn-back-to-classes-list" 
            type="button" 
            style="width:38px;height:38px;border-radius:12px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease"
            title="Quay lại danh sách Lớp học"
          >
            ‹
          </button>
          <div>
            <h1 style="font-size:24px;font-weight:800;color:#2D2824;margin:0 0 4px 0;letter-spacing:-0.02em">
              ${cls.class_name}
            </h1>
            <div style="font-size:13.5px;color:#7F7A72;font-weight:600">
              ${classTypeLabel} · GV: <span style="color:#A93226">${cls.teacher_name || 'Lê Minh Cường'}</span>
            </div>
          </div>
        </div>

        <!-- Cụm nút hành động góc trên bên phải -->
        <div style="display:flex;align-items:center;gap:10px">
          ${isAdmin ? `
            <button 
              id="btn-return-admin-dashboard" 
              type="button" 
              style="background:#A93226;color:#FFFFFF;border:none;border-radius:12px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(169,50,38,0.22)"
            >
              <span>‹</span>
              <span>Về Quản lý lớp Admin</span>
            </button>
          ` : ''}

          <button 
            id="btn-open-manage-class-drawer" 
            type="button" 
            style="background:#FFFFFF;color:#A93226;border:1.5px solid #A93226;border-radius:12px;padding:9px 18px;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(169,50,38,0.1);transition:all 0.15s ease"
          >
            <span>⚙</span>
            <span>Cài đặt vận hành</span>
          </button>
        </div>
      </div>

      <!-- 2. Thanh 7 Tab điều hướng giáo viên -->
      <div class="class-detail-nav-tabs" style="display:flex;gap:4px;border-bottom:2px solid #EAE4D8;margin-bottom:24px;overflow-x:auto;padding-bottom:2px">
        ${renderTeacherTabButton('timeline', 'Lịch mở bài', activeTeacherTab)}
        ${renderTeacherTabButton('students', 'Học viên', activeTeacherTab)}
        ${renderTeacherTabButton('assignments', 'Bài tập', activeTeacherTab)}
        ${renderTeacherTabButton('exams', 'Đề thi', activeTeacherTab)}
        ${renderTeacherTabButton('grades', 'Bảng điểm', activeTeacherTab)}
        ${renderTeacherTabButton('journal', 'Sổ đầu bài', activeTeacherTab)}
        ${renderTeacherTabButton('boss', '⚔️ Đánh boss', activeTeacherTab)}
      </div>

      <!-- 3. Nội dung tương ứng theo Tab đang chọn -->
      <div id="class-tab-content-container">
        ${activeTeacherTab === 'timeline' ? renderTimelineTab(cls) : ''}
        ${activeTeacherTab === 'students' ? renderTeacherStudentsTab(cls) : ''}
        ${activeTeacherTab === 'assignments' ? renderAssignmentsTab() : ''}
        ${activeTeacherTab === 'exams' ? renderExamsTab() : ''}
        ${activeTeacherTab === 'grades' ? renderGradesTab() : ''}
        ${activeTeacherTab === 'journal' ? renderJournalTab(cls) : ''}
        ${activeTeacherTab === 'boss' ? renderBossTab() : ''}
      </div>

      <!-- Drawer Quản lý lớp -->
      ${renderManageClassDrawer(cls, isAdmin)}

      <!-- Modal Cài đặt Ngưỡng Cảnh Báo -->
      ${renderWarningThresholdModal()}

      <!-- Modal Trình chiếu Bài giảng Tương tác Slide -->
      ${renderSlidePresentationModal(cls)}

    </div>
  `;
}

function renderTeacherTabButton(tabKey: TeacherDetailTab, label: string, activeTab: TeacherDetailTab): string {
  const isActive = tabKey === activeTab;
  return `
    <button 
      class="btn-detail-tab" 
      data-tab="${tabKey}"
      type="button" 
      style="
        background:transparent;
        border:none;
        padding:12px 20px;
        font-size:14px;
        font-weight:${isActive ? '800' : '600'};
        color:${isActive ? '#A93226' : '#7F7A72'};
        border-bottom:${isActive ? '3px solid #A93226' : '3px solid transparent'};
        margin-bottom:-2px;
        cursor:pointer;
        white-space:nowrap;
        transition:all 0.15s ease;
      "
    >
      ${label}
    </button>
  `;
}

function renderTimelineTab(cls: any): string {
  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 30px;box-shadow:0 2px 10px rgba(45,40,36,0.03)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">
        <button 
          id="btn-edit-timeline-dates" 
          type="button" 
          style="background:#FFFFFF;color:#A93226;border:1.5px solid #A93226;border-radius:20px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
        >
          <span>📅</span>
          <span>Sửa lịch mở bài</span>
        </button>

        <span style="font-size:12.5px;color:#7F7A72">
          Lộ trình: <strong>${COURSE_UNITS.length} Units</strong> · ${cls?.course_name || 'Khóa học'} · Tự động mở theo tuần
        </span>
      </div>

      <div style="position:relative;display:flex;flex-direction:column;gap:0;padding-left:10px">
        <div style="position:absolute;left:34px;top:20px;bottom:30px;width:2px;background:#F2ECE1;z-index:1"></div>

        ${COURSE_UNITS.map((unit, idx) => {
          const isOpened = unit.isOpen;
          return `
            <div style="display:flex;align-items:flex-start;gap:20px;position:relative;z-index:2;padding-bottom:${idx === COURSE_UNITS.length - 1 ? '0' : '28px'}">
              <div style="
                width:48px;
                height:48px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                font-weight:800;
                font-size:14px;
                flex-shrink:0;
                ${isOpened 
                  ? 'background:#E2F6ED;color:#059669;border:2px solid #A7F3D0;' 
                  : 'background:#EFF6FF;color:#1D4ED8;border:2px solid #BFDBFE;'
                }
              ">
                #${unit.num}
              </div>

              <div style="
                flex:1;
                background:#FAF7F2;
                border:1px solid #EAE4D8;
                border-radius:16px;
                padding:16px 20px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:16px;
                flex-wrap:wrap;
              ">
                <div>
                  <div style="font-size:15px;font-weight:800;color:#2D2824;margin-bottom:8px">
                    Unit ${unit.num} · ${unit.title}
                  </div>

                  <button 
                    class="btn-start-presentation" 
                    data-unit="${unit.num}"
                    type="button" 
                    style="
                      background:#F5E6E4;
                      color:#A93226;
                      border:1px solid #E8C9C5;
                      border-radius:10px;
                      padding:6px 14px;
                      font-size:12.5px;
                      font-weight:800;
                      cursor:pointer;
                      display:inline-flex;
                      align-items:center;
                      gap:6px;
                      transition:all 0.15s ease;
                    "
                  >
                    <span>▶</span>
                    <span>Trình chiếu</span>
                  </button>
                </div>

                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  ${isOpened ? `
                    <span style="background:#FCE8EF;color:#A93226;border:1px solid #F8D0DC;font-size:12px;font-weight:700;padding:4px 10px;border-radius:9999px">
                      ${unit.completedPercent}
                    </span>
                    <span style="background:#E2F6ED;color:#059669;border:1px solid #A7F3D0;font-size:12px;font-weight:700;padding:4px 10px;border-radius:9999px">
                      Đã mở: ${unit.openDate} ✓
                    </span>
                  ` : `
                    <span style="background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;font-size:12px;font-weight:700;padding:4px 10px;border-radius:9999px">
                      Mở: ${unit.openDate}
                    </span>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderTeacherStudentsTab(cls: any): string {
  const student = studentData[0] || { full_name: 'Nguyễn Hồng Nhung', student_code: 'HV2026-NN', student_id: 'SV_NN' };
  const classId = cls.class_id;
  const classNotices = announcementData.filter(a => a.scope === 'classes' && (a.target_class_ids || []).includes(classId));

  return `
    <div style="display:flex;flex-direction:column;gap:22px">
      <div style="grid-template-columns:repeat(4, 1fr);gap:16px;display:grid">
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px">
          <div style="font-size:22px;font-weight:900;color:#B45309;margin-bottom:4px">23/11/2026</div>
          <div style="font-size:12.5px;font-weight:700;color:#7F7A72">Buổi học tới</div>
        </div>
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px">
          <div style="font-size:22px;font-weight:900;color:#059669;margin-bottom:4px">—</div>
          <div style="font-size:12.5px;font-weight:700;color:#7F7A72">Tham gia buổi gần nhất</div>
        </div>
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px">
          <div style="font-size:22px;font-weight:900;color:#DC2626;margin-bottom:4px">—</div>
          <div style="font-size:12.5px;font-weight:700;color:#7F7A72">Điểm TB bài trước</div>
        </div>
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px">
          <div style="font-size:22px;font-weight:900;color:#059669;margin-bottom:4px">0</div>
          <div style="font-size:12.5px;font-weight:700;color:#7F7A72">HV nguy cơ</div>
        </div>
      </div>

      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px">
        <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:14px">
          📢 Thông báo lớp (${classNotices.length})
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
          <textarea id="input-class-notice-content" rows="2" placeholder="Viết thông báo cho lớp..." style="width:100%;padding:12px 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FAF7F2;font-size:13.5px;color:#2D2824;outline:none;font-family:inherit;box-sizing:border-box"></textarea>
          <button id="btn-post-class-notice" type="button" style="width:100%;height:40px;background:#A93226;color:#FFFFFF;border:none;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer">
            Đăng thông báo
          </button>
        </div>
        ${classNotices.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:10px;border-top:1px dashed #EAE4D8;padding-top:14px">
            ${classNotices.map(n => `
              <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px;padding:12px 16px;font-size:13px">
                <div style="font-weight:700;color:#2D2824;margin-bottom:4px">${n.sender_name} (${n.created_at})</div>
                <div style="color:#2D2824;line-height:1.5">${n.content_html}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px">
        <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px">Học viên (1)</div>
        <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:16px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:42px;height:42px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:800;color:#A93226;font-size:14px">
              NN
            </div>
            <div>
              <div style="font-size:14.5px;font-weight:800;color:#2D2824">${student.full_name}</div>
              <div style="font-size:12px;color:#7F7A72;margin-top:2px">Học viên mới (miễn cảnh báo)</div>
            </div>
          </div>
          <span style="background:#E2F6ED;color:#059669;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:700">
            ● Ổn
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderAssignmentsTab(): string {
  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 30px">
      <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px">
        Danh sách Bài tập về nhà
      </div>
      <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:14.5px;font-weight:700;color:#2D2824">Unit 1 · Vocabulary & Daily Conversation Recording</div>
          <div style="font-size:12px;color:#7F7A72;margin-top:2px">Hạn nộp: 23:59 Chủ nhật · Đã nộp 1/1</div>
        </div>
        <a href="#/grading" style="background:#A93226;color:#FFFFFF;text-decoration:none;padding:8px 16px;border-radius:10px;font-size:12.5px;font-weight:700">
          Chấm bài ngay ›
        </a>
      </div>
    </div>
  `;
}

function renderExamsTab(): string {
  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 30px">
      <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px">Đề thi định kỳ & Giữa kỳ</div>
      <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:16px 20px">
        <div style="font-size:14.5px;font-weight:700;color:#2D2824">Midterm Progress Assessment (Giữa kỳ)</div>
        <div style="font-size:12px;color:#7F7A72;margin-top:2px">Dự kiến diễn ra sau Unit 7 · Trắc nghiệm 40 câu & Nói 1-1</div>
      </div>
    </div>
  `;
}

function renderGradesTab(): string {
  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 30px">
      <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px">Bảng điểm lớp học</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;text-align:left">
            <th style="padding:10px 12px">Học viên</th>
            <th style="padding:10px 12px">Chuyên cần</th>
            <th style="padding:10px 12px">Bài tập TB</th>
            <th style="padding:10px 12px">Giữa kỳ</th>
            <th style="padding:10px 12px">Tổng kết</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #F2ECE1">
            <td style="padding:12px;font-weight:700">Nguyễn Hồng Nhung</td>
            <td style="padding:12px;color:#059669;font-weight:700">100%</td>
            <td style="padding:12px">9.0/10</td>
            <td style="padding:12px">—</td>
            <td style="padding:12px;font-weight:800;color:#A93226">9.0</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderJournalTab(cls: any): string {
  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 30px">
      <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px">📖 Sổ đầu bài — ${cls.class_name}</div>
      <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:16px 20px">
        <div style="font-weight:700;color:#2D2824;font-size:14px">Buổi 1: Khai giảng & Định hướng học tập</div>
        <div style="font-size:12px;color:#7F7A72;margin-top:2px">GV: ${cls.teacher_name || 'Lê Minh Cường'} · Nhận xét: Lớp tương tác rất tốt.</div>
      </div>
    </div>
  `;
}

function renderBossTab(): string {
  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 30px;text-align:center">
      <div style="font-size:42px;margin-bottom:8px">⚔️</div>
      <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 6px 0">Đấu trường Vocab Boss</h3>
      <p style="color:#7F7A72;font-size:13px;max-width:460px;margin:0 auto 18px auto">Cả lớp cùng làm bài tập từ vựng để gây sát thương hạ gục quái vật tuần này!</p>
      <button id="btn-attack-boss" type="button" style="background:#A93226;color:#FFFFFF;border:none;border-radius:12px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer">
        ⚔️ Tấn công Boss (+50 XP)
      </button>
    </div>
  `;
}

// -------------------------------------------------------------------------
// DRAWER & MODAL CŨ
// -------------------------------------------------------------------------
function renderManageClassDrawer(cls: any, isAdmin: boolean): string {
  return `
    <div id="drawer-manage-class" style="display:${isManageDrawerOpen ? 'flex' : 'none'};position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;justify-content:flex-end">
      <div style="background:#FFFFFF;width:100%;max-width:540px;height:100%;overflow-y:auto;padding:28px 32px;display:flex;flex-direction:column;gap:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #EAE4D8;padding-bottom:14px">
          <h2 style="font-size:19px;font-weight:800;color:#2D2824;margin:0">Cài đặt vận hành lớp học</h2>
          <button id="btn-close-manage-drawer" type="button" style="background:none;border:none;color:#A8A29A;cursor:pointer;font-size:20px">✕</button>
        </div>

        <div>
          <h4 style="font-size:14px;font-weight:800;color:#2D2824;margin:0 0 6px 0">1. Đóng/Mở lớp học</h4>
          <p style="font-size:12px;color:#7F7A72;margin:0 0 8px 0">Trạng thái hiện tại: <strong>${cls.status === 'completed' ? 'Đã khoá' : 'Đang mở'}</strong></p>
          ${isAdmin ? `
            <div style="display:flex;gap:10px">
              <button id="btn-drawer-lock-class" type="button" style="padding:8px 16px;background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer">
                Khoá lớp
              </button>
              <button id="btn-drawer-delete-class" type="button" style="padding:8px 16px;background:#FEF2F2;color:#A93226;border:1px solid #FECACA;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer">
                Xóa vĩnh viễn lớp
              </button>
            </div>
          ` : `
            <div style="font-size:12px;color:#A8A29A;font-style:italic">Chỉ Quản trị viên (Admin) mới có quyền khoá hoặc xóa lớp.</div>
          `}
        </div>

        <div style="border-top:1px dashed #EAE4D8;padding-top:14px">
          <h4 style="font-size:14px;font-weight:800;color:#2D2824;margin:0 0 6px 0">2. Đổi loại lớp</h4>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <label style="font-size:12px;display:flex;align-items:center;gap:4px">
              <input type="radio" name="drawer_class_type" value="regular" ${cls.class_type === 'regular' ? 'checked' : ''} /> Lớp thường
            </label>
            <label style="font-size:12px;display:flex;align-items:center;gap:4px">
              <input type="radio" name="drawer_class_type" value="self_study" ${cls.class_type === 'self_study' ? 'checked' : ''} /> Tự học
            </label>
            <label style="font-size:12px;display:flex;align-items:center;gap:4px">
              <input type="radio" name="drawer_class_type" value="communication" ${cls.class_type === 'communication' ? 'checked' : ''} /> Giao tiếp
            </label>
          </div>
          <button id="btn-save-class-type" type="button" style="padding:6px 14px;background:#2D2824;color:#FFFFFF;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderWarningThresholdModal(): string {
  return `
    <div id="modal-warning-threshold" style="display:${isWarningThresholdModalOpen ? 'flex' : 'none'};position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="background:#FFFFFF;border-radius:20px;padding:24px;max-width:440px;width:100%">
        <h3 style="font-size:16px;font-weight:800;margin:0 0 12px 0">Cài đặt ngưỡng cảnh báo</h3>
        <p style="font-size:12.5px;color:#7F7A72;margin:0 0 16px 0">Hệ thống sẽ gắn cờ cảnh báo học viên nếu vượt quá ngưỡng này.</p>
        <button id="btn-close-threshold-modal" type="button" style="width:100%;height:38px;background:#A93226;color:#FFFFFF;border:none;border-radius:10px;font-weight:700;cursor:pointer">
          Đóng
        </button>
      </div>
    </div>
  `;
}

function renderSlidePresentationModal(cls: any): string {
  return `
    <div id="modal-slide-presentation" style="display:${isSlidePresentationOpen ? 'flex' : 'none'};position:fixed;inset:0;background:#14100C;z-index:99999;flex-direction:column;color:#FFFFFF">
      <div style="padding:14px 24px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between">
        <div>
          <span style="font-weight:800;color:#F5E6E4">Unit ${presentingUnitNumber} · Slide Trình chiếu</span>
          <span style="font-size:12px;opacity:0.7;margin-left:8px">${cls.class_name}</span>
        </div>
        <button id="btn-close-slide-presentation" type="button" style="background:rgba(255,255,255,0.15);border:none;color:#FFFFFF;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:700">
          ✕ Thoát trình chiếu
        </button>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:32px;text-align:center">
        <div>
          <div style="font-size:48px;margin-bottom:16px">🎯</div>
          <h2 style="font-size:28px;font-weight:800;margin:0 0 12px 0">Slide ${currentSlideIndex + 1} / 5: IELTS Topic Speaking & Grammar</h2>
          <p style="opacity:0.8;max-width:560px;margin:0 auto">Nội dung bài giảng tương tác đang hiển thị toàn màn hình cho học sinh trong lớp.</p>
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// SỰ KIỆN TƯƠNG TÁC (initClassDetailPage)
// =========================================================================
export function initClassDetailPage(): void {
  const cls = getCurrentClass();
  if (!cls) return;
  const state = getState();
  const isAdmin = state.currentUser?.role === 'admin';

  // 1. Nút quay lại danh sách lớp học
  document.getElementById('btn-back-to-classes-list')?.addEventListener('click', () => {
    window.location.hash = '#/classes';
  });

  // 2. Tab Navigation dành cho Admin (Tổng quan, Cấu hình, Mời học viên)
  document.querySelectorAll<HTMLButtonElement>('.admin-nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab as AdminDetailTab;
      if (tab) {
        activeAdminTab = tab;
        reRender();
      }
    });
  });

  // 3. Tab Navigation dành cho Giáo viên (Lịch mở bài, Bài tập,...)
  document.querySelectorAll<HTMLButtonElement>('.btn-detail-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab as TeacherDetailTab;
      if (tab) {
        activeTeacherTab = tab;
        reRender();
      }
    });
  });

  // 4. Chuyển đổi giữa Chế độ xem Admin và Chế độ xem Bài giảng Units
  document.getElementById('btn-switch-to-teacher-units')?.addEventListener('click', () => {
    adminViewMode = 'teacher_units';
    reRender();
  });

  document.getElementById('btn-return-admin-dashboard')?.addEventListener('click', () => {
    adminViewMode = 'admin_dashboard';
    reRender();
  });

  // 5. Drawer Quản lý lớp
  document.getElementById('btn-open-manage-class-drawer')?.addEventListener('click', () => {
    isManageDrawerOpen = true;
    reRender();
  });
  document.getElementById('btn-close-manage-drawer')?.addEventListener('click', () => {
    isManageDrawerOpen = false;
    reRender();
  });

  // 6. Đổi tên lớp (Tab 1 Admin)
  const nameInput = document.getElementById('input-class-name-overview') as HTMLInputElement | null;
  const renameBtn = document.getElementById('btn-rename-class') as HTMLButtonElement | null;

  nameInput?.addEventListener('input', () => {
    const original = nameInput.dataset.original || '';
    const current = nameInput.value.trim();
    if (renameBtn) {
      if (current && current !== original) {
        renameBtn.disabled = false;
        renameBtn.style.background = '#A93226';
        renameBtn.style.color = '#FFFFFF';
        renameBtn.style.cursor = 'pointer';
      } else {
        renameBtn.disabled = true;
        renameBtn.style.background = '#F6F4F0';
        renameBtn.style.color = '#A8A29A';
        renameBtn.style.cursor = 'not-allowed';
      }
    }
  });

  renameBtn?.addEventListener('click', () => {
    if (!nameInput) return;
    const newName = nameInput.value.trim();
    if (newName && cls) {
      cls.class_name = newName;
      nameInput.dataset.original = newName;
      renameBtn.disabled = true;
      renameBtn.style.background = '#F6F4F0';
      renameBtn.style.color = '#A8A29A';
      renameBtn.style.cursor = 'not-allowed';
      
      const headerTitle = document.getElementById('class-detail-header-title');
      if (headerTitle) headerTitle.textContent = newName;

      showToast(`Đã đổi tên lớp thành "${newName}"!`, 'success');
    }
  });

  // 7. Nút cuộn tới CSAT (Tab 1 Admin)
  document.getElementById('btn-scroll-to-csat')?.addEventListener('click', () => {
    const csatCard = document.getElementById('card-csat-section');
    if (csatCard) {
      csatCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      csatCard.style.borderColor = '#A93226';
      csatCard.style.boxShadow = '0 0 0 3px #F5E6E4';
      setTimeout(() => {
        csatCard.style.borderColor = '#EAE4D8';
        csatCard.style.boxShadow = '0 2px 10px rgba(45,40,36,0.03)';
      }, 1500);
    }
  });

  // 8. Modal Điều chỉnh lịch học (Tab 1 Admin)
  document.getElementById('btn-open-edit-schedule-modal')?.addEventListener('click', () => {
    isEditScheduleModalOpen = true;
    reRender();
  });
  document.getElementById('btn-close-edit-schedule-modal')?.addEventListener('click', () => {
    isEditScheduleModalOpen = false;
    reRender();
  });
  document.getElementById('btn-cancel-edit-schedule')?.addEventListener('click', () => {
    isEditScheduleModalOpen = false;
    reRender();
  });
  document.getElementById('form-save-schedule')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const startDate = (document.getElementById('schedule-start-date') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('schedule-end-date') as HTMLInputElement)?.value;
    const timeSlot = (document.getElementById('schedule-time-slot') as HTMLInputElement)?.value;
    const checkedDays = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="class_schedule_days"]:checked')).map(cb => cb.value);

    if (checkedDays.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 ngày học trong tuần!', 'error');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      showToast('Ngày kết thúc phải sau ngày bắt đầu!', 'error');
      return;
    }

    if (startDate) cls.start_date = startDate;
    if (endDate) cls.end_date = endDate;
    if (timeSlot) cls.schedule = timeSlot;
    cls.days_of_week = checkedDays.join(',');

    isEditScheduleModalOpen = false;
    showToast('Đã điều chỉnh lịch học thành công!', 'success');
    reRender();
  });

  // 9. Cấu hình Trọng số điểm tổng kết (Tab 2 Admin)
  const weightAtt = document.getElementById('weight-attendance') as HTMLInputElement | null;
  const weightHw = document.getElementById('weight-homework') as HTMLInputElement | null;
  const weightPer = document.getElementById('weight-periodic') as HTMLInputElement | null;
  const weightFin = document.getElementById('weight-final') as HTMLInputElement | null;
  const sumIndicator = document.getElementById('weight-sum-indicator');

  const updateWeightSum = () => {
    const a = parseInt(weightAtt?.value || '0', 10);
    const b = parseInt(weightHw?.value || '0', 10);
    const c = parseInt(weightPer?.value || '0', 10);
    const d = parseInt(weightFin?.value || '0', 10);
    const sum = a + b + c + d;
    if (sumIndicator) {
      if (sum === 100) {
        sumIndicator.textContent = '✓ Tổng: 100% (Hợp lệ)';
        sumIndicator.style.color = '#059669';
      } else {
        sumIndicator.textContent = `⚠ Tổng: ${sum}% (Phải bằng đúng 100%)`;
        sumIndicator.style.color = '#A93226';
      }
    }
  };

  [weightAtt, weightHw, weightPer, weightFin].forEach(input => {
    input?.addEventListener('input', updateWeightSum);
  });

  document.getElementById('btn-save-weights')?.addEventListener('click', () => {
    const a = parseInt(weightAtt?.value || '0', 10);
    const b = parseInt(weightHw?.value || '0', 10);
    const c = parseInt(weightPer?.value || '0', 10);
    const d = parseInt(weightFin?.value || '0', 10);
    if (a + b + c + d !== 100) {
      showToast('Tổng 4 trọng số phải bằng đúng 100%!', 'warning');
      return;
    }
    classWeightsStore[cls.class_id] = {
      attendance: a,
      homework: b,
      periodic_test: c,
      final_test: d,
    };
    try {
      localStorage.setItem(`edutrack_weights_${cls.class_id}`, JSON.stringify(classWeightsStore[cls.class_id]));
    } catch { /* ignore */ }
    showToast('Đã lưu trọng số điểm tổng kết!', 'success');
  });

  // 10. Cấu hình Phạm vi giáo trình (Tab 2 Admin)
  document.getElementById('btn-save-scope-admin')?.addEventListener('click', () => {
    const start = parseInt((document.getElementById('scope-start-unit') as HTMLSelectElement)?.value || '1', 10);
    const end = parseInt((document.getElementById('scope-end-unit') as HTMLSelectElement)?.value || '15', 10);
    classScopeStore[cls.class_id] = { start_unit: start, end_unit: end };
    showToast(`Đã lưu phạm vi giáo trình: Từ Unit ${start} đến Unit ${end}!`, 'success');
  });

  // 11. Cấu hình Loại lớp (Tab 2 Admin)
  document.querySelectorAll<HTMLLabelElement>('.class-type-select-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll<HTMLLabelElement>('.class-type-select-card').forEach(c => {
        c.style.borderColor = '#EAE4D8';
        c.style.background = '#FFFFFF';
        const span = c.querySelector('span');
        if (span) span.style.color = '#2D2824';
      });
      card.style.borderColor = '#A93226';
      card.style.background = '#F5E6E4';
      const span = card.querySelector('span');
      if (span) span.style.color = '#A93226';
      const radio = card.querySelector('input[type="radio"]') as HTMLInputElement;
      if (radio) radio.checked = true;
    });
  });

  document.getElementById('btn-save-class-type-admin')?.addEventListener('click', () => {
    const checked = document.querySelector('input[name="admin_class_type"]:checked') as HTMLInputElement | null;
    if (checked && cls) {
      cls.class_type = checked.value as CenterClassType;
      updateCenterClassSettingsApi(cls.class_id, { class_type: cls.class_type }).catch(() => {});
      showToast('Đã đổi loại lớp thành công!', 'success');
      reRender();
    }
  });

  // 12. Cấu hình Ngưỡng cảnh báo (Tab 2 Admin)
  document.getElementById('btn-save-thresholds-admin')?.addEventListener('click', () => {
    const inact = parseInt((document.getElementById('thresh-inactive') as HTMLInputElement)?.value || '7', 10);
    const miss = parseInt((document.getElementById('thresh-missing') as HTMLInputElement)?.value || '2', 10);
    const forg = parseInt((document.getElementById('thresh-forget') as HTMLInputElement)?.value || '40', 10);
    classThresholdsStore[cls.class_id] = {
      inactive_days: inact,
      missing_homework: miss,
      vocab_forget_rate: forg,
    };
    showToast('Đã cập nhật ngưỡng cảnh báo học viên!', 'success');
  });

  // 13. Mời học viên (Tab 3 Admin): Sao chép mã & link
  document.getElementById('btn-copy-class-code')?.addEventListener('click', () => {
    navigator.clipboard.writeText(cls.class_code);
    showToast(`Đã sao chép mã lớp: ${cls.class_code}!`, 'success');
  });

  document.getElementById('btn-copy-join-link')?.addEventListener('click', () => {
    const url = `https://edutrack.vn/join?code=${cls.class_code}`;
    navigator.clipboard.writeText(url);
    showToast('Đã sao chép đường link tham gia lớp học!', 'success');
  });

  // Gửi email mời
  document.getElementById('form-invite-email')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('input-invite-email') as HTMLInputElement | null;
    const email = emailInput?.value.trim();
    if (email) {
      const invs = getClassInvitations(cls.class_id);
      invs.unshift({
        id: `INV_${Date.now()}`,
        email,
        status: 'accepted',
        date_label: 'Vừa mời xong',
      });
      if (emailInput) emailInput.value = '';
      showToast(`Đã gửi lời mời tham gia lớp tới email ${email}!`, 'success');
      reRender();
    }
  });

  // Nút Mời lại lời mời hết hạn
  document.querySelectorAll<HTMLButtonElement>('.btn-resend-invite').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.dataset.email;
      showToast(`Đã gửi lại email mời tới ${email}!`, 'success');
    });
  });

  // 14. Quản lý học viên cột phải: Mở modal thêm học viên
  document.getElementById('btn-open-add-student-modal')?.addEventListener('click', () => {
    isAddStudentModalOpen = true;
    reRender();
  });
  document.getElementById('btn-close-add-student-modal')?.addEventListener('click', () => {
    isAddStudentModalOpen = false;
    reRender();
  });
  document.getElementById('btn-done-add-student')?.addEventListener('click', () => {
    isAddStudentModalOpen = false;
    reRender();
  });

  // Thêm học viên từ modal
  document.querySelectorAll<HTMLButtonElement>('.btn-do-add-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.studentId || '';
      const code = btn.dataset.studentCode || '';
      const name = btn.dataset.studentName || '';
      const initials = btn.dataset.studentInitials || 'HV';

      const students = getClassStudents(cls.class_id);
      students.push({
        student_id: id,
        student_code: code,
        full_name: name,
        avatar_initials: initials,
        status_note: 'Học viên mới (miễn cảnh báo)',
        alert_level: 'normal',
      });
      cls.current_students = students.length;

      showToast(`Đã thêm học viên "${name}" vào lớp!`, 'success');
      reRender();
    });
  });

  // Mở modal Chuyển lớp
  document.querySelectorAll<HTMLButtonElement>('.btn-trigger-transfer-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const sId = btn.dataset.studentId || '';
      const sName = btn.dataset.studentName || '';
      selectedStudentForTransfer = { id: sId, name: sName };
      isTransferStudentModalOpen = true;
      reRender();
    });
  });
  document.getElementById('btn-close-transfer-modal')?.addEventListener('click', () => {
    isTransferStudentModalOpen = false;
    reRender();
  });
  document.getElementById('btn-cancel-transfer')?.addEventListener('click', () => {
    isTransferStudentModalOpen = false;
    reRender();
  });
  document.getElementById('form-do-transfer-student')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const targetClassId = (document.getElementById('select-target-class') as HTMLSelectElement)?.value;
    const targetClass = centerClassData.find(c => c.class_id === targetClassId);
    if (!targetClass || !selectedStudentForTransfer) {
      showToast('Vui lòng chọn lớp đích!', 'warning');
      return;
    }

    // Gỡ khỏi lớp hiện tại
    const students = getClassStudents(cls.class_id);
    const idx = students.findIndex(s => s.student_id === selectedStudentForTransfer?.id);
    if (idx >= 0) {
      const removed = students.splice(idx, 1)[0];
      cls.current_students = students.length;

      // Thêm vào lớp mới
      const targetStudents = getClassStudents(targetClassId);
      targetStudents.push(removed);
      targetClass.current_students = targetStudents.length;
    }

    isTransferStudentModalOpen = false;
    showToast(`Đã chuyển học viên sang "${targetClass.class_name}"!`, 'success');
    reRender();
  });

  // Mời ra khỏi lớp kèm xác nhận
  document.querySelectorAll<HTMLButtonElement>('.btn-trigger-remove-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const sId = btn.dataset.studentId || '';
      const sName = btn.dataset.studentName || 'học viên';
      if (confirm(`Bạn có chắc chắn muốn mời học viên "${sName}" ra khỏi lớp không?`)) {
        const students = getClassStudents(cls.class_id);
        const idx = students.findIndex(s => s.student_id === sId);
        if (idx >= 0) {
          students.splice(idx, 1);
          cls.current_students = students.length;
          showToast(`Đã mời học viên "${sName}" ra khỏi lớp!`, 'info');
          reRender();
        }
      }
    });
  });

  // 15. Trình chiếu slide tương tác
  document.querySelectorAll<HTMLButtonElement>('.btn-start-presentation').forEach(btn => {
    btn.addEventListener('click', () => {
      presentingUnitNumber = parseInt(btn.dataset.unit || '1', 10);
      currentSlideIndex = 0;
      isSlidePresentationOpen = true;
      reRender();
    });
  });
  document.getElementById('btn-close-slide-presentation')?.addEventListener('click', () => {
    isSlidePresentationOpen = false;
    reRender();
  });

  // 16. Drawer lưu cài đặt cũ
  document.getElementById('btn-save-class-type')?.addEventListener('click', () => {
    const checked = document.querySelector('input[name="drawer_class_type"]:checked') as HTMLInputElement | null;
    if (checked && cls) {
      cls.class_type = checked.value as any;
      updateCenterClassSettingsApi(cls.class_id, { class_type: cls.class_type }).catch(() => {});
      showToast('Đã đổi loại lớp thành công!', 'success');
      reRender();
    }
  });

  // Khoá lớp (Admin only)
  document.getElementById('btn-drawer-lock-class')?.addEventListener('click', () => {
    if (!isAdmin) return;
    if (confirm(`Bạn có chắc chắn muốn khoá lớp "${cls.class_name}" không?`)) {
      cls.status = 'completed';
      lockCenterClassApi(cls.class_id, 'admin').catch(() => {});
      isManageDrawerOpen = false;
      showToast(`Đã khoá lớp "${cls.class_name}"!`, 'info');
      reRender();
    }
  });

  // Xóa lớp (Admin only)
  document.getElementById('btn-drawer-delete-class')?.addEventListener('click', () => {
    if (!isAdmin) return;
    if (confirm(`HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn lớp "${cls.class_name}" không?`)) {
      const idx = centerClassData.findIndex(c => c.class_id === cls.class_id);
      if (idx >= 0) centerClassData.splice(idx, 1);
      deleteCenterClassApi(cls.class_id, 'admin').catch(() => {});
      isManageDrawerOpen = false;
      showToast(`Đã xóa vĩnh viễn lớp "${cls.class_name}"!`, 'success');
      window.location.hash = '#/classes';
    }
  });

  // Đăng thông báo lớp
  document.getElementById('btn-post-class-notice')?.addEventListener('click', () => {
    const textarea = document.getElementById('input-class-notice-content') as HTMLTextAreaElement | null;
    const content = textarea?.value.trim();
    if (content) {
      createAnnouncement({
        content_html: content,
        scope: 'classes',
        target_class_ids: [cls.class_id],
        target_class_names: [cls.class_name],
        sender_id: state.currentUser?.staff_id || 'STF001',
        sender_name: state.currentUser?.full_name || 'Lê Minh Cường',
        sender_role: state.currentUser?.role || 'teacher',
      });
      if (textarea) textarea.value = '';
      showToast('Đã đăng thông báo cho lớp thành công!', 'success');
      reRender();
    }
  });
}

function reRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderClassDetailPage();
    initClassDetailPage();
  }
}
