// ============================================
// EduTrack - Hồ sơ Chi tiết Giáo viên (Screen 2: /teachers/:id)
// Warm Minimalist Design System
// ============================================

import { staffData, classAssignmentData, classData, sessionData, centerClassData } from '../data.ts';
import { fetchTeacherDetailApi, transferTeacherClassesApi, deleteTeacherApi } from '../api.ts';
import { showToast, icons } from '../utils.ts';
import type { Staff, Class } from '../types.ts';

let currentTeacherId = '';
let currentWeekOffset = 0; // 0 = current week, -1 = previous, +1 = next

interface TeacherProfileState {
  teacher: Staff;
  activeClasses: Class[];
  otherTeachers: Staff[];
  kpis: {
    active_classes: number;
    total_students: number;
    avg_score: string;
    satisfaction: string;
    month_sessions: number;
    seniority: string;
  };
  weekSchedule: {
    weekRange: string;
    totalSessions: number;
    days: Array<{
      dayName: string;
      dateStr: string;
      isToday: boolean;
      session?: {
        time: string;
        className: string;
        sessionName: string;
      } | null;
    }>;
  };
}

let profileState: TeacherProfileState | null = null;

// Helper to get week data locally if API offline
function computeLocalTeacherProfile(teacherId: string, weekOffset: number): TeacherProfileState | null {
  const teacher = staffData.find(s => s.staff_id === teacherId);
  if (!teacher) return null;

  // Active classes
  const assignedClassIds = classAssignmentData
    .filter(ca => ca.teacher_id === teacherId)
    .map(ca => ca.class_id);
  const activeClasses = classData.filter(c => assignedClassIds.includes(c.class_id) && c.status === 'in_progress');
  const totalStudents = activeClasses.reduce((sum, c) => sum + (c.current_students || 0), 0);

  // Other active teachers
  const otherTeachers = staffData.filter(s => s.role === 'teacher' && s.staff_id !== teacherId && s.is_active);

  // Week days calculation
  const now = new Date();
  // Monday of current week
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);

  const weekdayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const days: TeacherProfileState['weekSchedule']['days'] = [];
  let weekSessionCount = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const fullDateIso = d.toISOString().split('T')[0];
    const isToday = d.toDateString() === now.toDateString();

    // Check if teacher teaches any session on this date (as main teacher or substitute)
    const matchedSession = sessionData.find(s => {
      if (s.date !== fullDateIso) return false;
      if (s.substitute_teacher_id && s.substitute_teacher_id !== teacherId && s.teacher_id === teacherId) {
        return false;
      }
      return s.substitute_teacher_id === teacherId || s.teacher_id === teacherId;
    });

    let sessionInfo = null;
    if (matchedSession) {
      const cls = classData.find(c => c.class_id === matchedSession!.class_id) || centerClassData.find(c => c.class_id === matchedSession!.class_id);
      const isSub = matchedSession.substitute_teacher_id === teacherId;
      sessionInfo = {
        time: `${matchedSession.start_time}–${matchedSession.end_time}`,
        className: (cls?.class_name || 'Lớp học') + (isSub ? ' (Dạy thay)' : ''),
        sessionName: matchedSession.topic || `Buổi ${matchedSession.session_number}`,
      };
      weekSessionCount++;
    }

    days.push({
      dayName: weekdayNames[i],
      dateStr: isToday ? `${dateStr} · hôm nay` : dateStr,
      isToday,
      session: sessionInfo,
    });
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekRange = `Tuần ${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')} – ${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalMonthSessions = sessionData.filter(s => {
    if (!s.date.startsWith(currentMonthStr)) return false;
    if (s.substitute_teacher_id && s.substitute_teacher_id !== teacherId && s.teacher_id === teacherId) return false;
    return s.substitute_teacher_id === teacherId || s.teacher_id === teacherId;
  }).length;

  return {
    teacher,
    activeClasses,
    otherTeachers,
    kpis: {
      active_classes: activeClasses.length,
      total_students: totalStudents,
      avg_score: '—',
      satisfaction: '—',
      month_sessions: totalMonthSessions,
      seniority: teacher.staff_id === 'STF003' ? '2 năm' : '1 năm',
    },
    weekSchedule: {
      weekRange,
      totalSessions: weekSessionCount,
      days,
    },
  };
}

export function renderTeacherDetailPage(): string {
  // Extract teacher id from hash: #/teachers/:id
  const hash = window.location.hash;
  const match = hash.match(/#\/teachers\/([^/?]+)/);
  currentTeacherId = match ? match[1] : 'STF003';

  profileState = computeLocalTeacherProfile(currentTeacherId, currentWeekOffset);

  if (!profileState) {
    return `
      <div style="padding:40px;text-align:center;background:#FAF7F2;min-height:80vh">
        <h2 style="color:#2D2824;font-size:22px">Không tìm thấy thông tin giáo viên</h2>
        <a href="#/teachers" style="display:inline-block;margin-top:16px;color:#A93226;font-weight:700">‹ Quay lại danh sách giáo viên</a>
      </div>
    `;
  }

  const { teacher, activeClasses, otherTeachers, kpis, weekSchedule } = profileState;

  return `
    <div class="teacher-detail-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- Top Header with Back Button -->
      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:28px">
        <a href="#/teachers" title="Quay lại danh sách giáo viên" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:#FFFFFF;border:1px solid #EAE4D8;color:#2D2824;text-decoration:none;font-size:18px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.04);transition:all 0.15s ease">
          ‹
        </a>
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
            ${teacher.full_name}
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            ${teacher.email} · EduTrack Center
          </div>
        </div>
      </div>

      <!-- 6 KPI Cards (Grid 6 columns on desktop) -->
      <div class="kpi-grid" style="display:grid;grid-template-columns:repeat(6, 1fr);gap:16px;margin-bottom:28px">
        
        <!-- KPI 1: Lớp đang dạy -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;box-shadow:0 2px 8px rgba(80, 60, 40, 0.02)">
          <div id="kpi-active-classes" style="font-size:28px;font-weight:800;color:#A93226;line-height:1.1;margin-bottom:6px">
            ${kpis.active_classes}
          </div>
          <div style="font-size:13px;color:#7F7A72;font-weight:600">Lớp đang dạy</div>
        </div>

        <!-- KPI 2: Học viên -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;box-shadow:0 2px 8px rgba(80, 60, 40, 0.02)">
          <div id="kpi-total-students" style="font-size:28px;font-weight:800;color:#B7950B;line-height:1.1;margin-bottom:6px">
            ${kpis.total_students}
          </div>
          <div style="font-size:13px;color:#7F7A72;font-weight:600">Học viên</div>
        </div>

        <!-- KPI 3: Điểm TB -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;box-shadow:0 2px 8px rgba(80, 60, 40, 0.02)">
          <div style="font-size:28px;font-weight:800;color:#1E8449;line-height:1.1;margin-bottom:6px">
            ${kpis.avg_score}
          </div>
          <div style="font-size:13px;color:#7F7A72;font-weight:600">Điểm TB</div>
        </div>

        <!-- KPI 4: Hài lòng -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;box-shadow:0 2px 8px rgba(80, 60, 40, 0.02)">
          <div style="font-size:28px;font-weight:800;color:#922B21;line-height:1.1;margin-bottom:6px">
            ${kpis.satisfaction}
          </div>
          <div style="font-size:13px;color:#7F7A72;font-weight:600">Hài lòng</div>
        </div>

        <!-- KPI 5: Buổi tháng này -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;box-shadow:0 2px 8px rgba(80, 60, 40, 0.02)">
          <div style="font-size:28px;font-weight:800;color:#A93226;line-height:1.1;margin-bottom:6px">
            ${kpis.month_sessions}
          </div>
          <div style="font-size:13px;color:#7F7A72;font-weight:600">Buổi tháng này</div>
        </div>

        <!-- KPI 6: Thâm niên -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;box-shadow:0 2px 8px rgba(80, 60, 40, 0.02)">
          <div style="font-size:24px;font-weight:800;color:#AF601A;line-height:1.2;margin-bottom:6px">
            ${kpis.seniority}
          </div>
          <div style="font-size:13px;color:#7F7A72;font-weight:600">Thâm niên</div>
        </div>

      </div>

      <!-- Main Content Cards (Vertical Stack) -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Khối 1: Card Lịch dạy trong tuần -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 12px rgba(80, 60, 40, 0.03)">
          
          <!-- Header Card -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="color:#A93226;display:flex;align-items:center">
                ${icons.calendar}
              </span>
              <h2 style="font-size:18px;font-weight:700;color:#2D2824;margin:0">
                Lịch dạy trong tuần
              </h2>
            </div>
            <a href="#/schedule" style="color:#A93226;font-size:13.5px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
              Lịch trung tâm →
            </a>
          </div>

          <!-- Week Navigation Bar -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:#FDFBF7;border:1px solid #EAE4D8;border-radius:14px;padding:10px 18px;margin-bottom:18px">
            <div style="font-size:14px;color:#2D2824;font-weight:700">
              <span id="week-range-text">${weekSchedule.weekRange}</span> 
              <span id="week-sessions-count" style="color:#7F7A72;font-weight:500">· ${weekSchedule.totalSessions} buổi</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <button id="btn-prev-week" type="button" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;color:#2D2824">
                ◀
              </button>
              <button id="btn-current-week" type="button" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:600;cursor:pointer;color:#2D2824">
                Tuần này
              </button>
              <button id="btn-next-week" type="button" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;color:#2D2824">
                ▶
              </button>
            </div>
          </div>

          <!-- 7 Weekday Rows -->
          <div id="week-days-container" style="display:flex;flex-direction:column;gap:10px">
            ${renderWeekdayRows(weekSchedule.days)}
          </div>

        </div>

        <!-- Khối 2: Card Lớp phụ trách (N) -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 12px rgba(80, 60, 40, 0.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
            <h2 id="assigned-classes-heading" style="font-size:18px;font-weight:700;color:#2D2824;margin:0">
              Lớp phụ trách (${activeClasses.length})
            </h2>
          </div>

          <div id="assigned-classes-list" style="display:flex;flex-direction:column;gap:12px">
            ${renderAssignedClasses(activeClasses)}
          </div>
        </div>

        <!-- Khối 3: Card Quản lý (Ràng buộc bàn giao & Gỡ giáo viên) -->
        <div id="management-card" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 12px rgba(80, 60, 40, 0.03)">
          <h2 style="font-size:18px;font-weight:700;color:#2D2824;margin:0 0 16px 0">
            Quản lý
          </h2>

          <div id="management-content-area">
            ${renderManagementContent(activeClasses.length, otherTeachers)}
          </div>
        </div>

      </div>

      <!-- Modal Xác nhận gỡ giáo viên -->
      <div id="modal-confirm-delete" style="display:none;position:fixed;inset:0;background:rgba(30, 24, 20, 0.5);backdrop-filter:blur(3px);z-index:9999;align-items:center;justify-content:center;padding:16px">
        <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:440px;box-shadow:0 20px 40px rgba(0,0,0,0.15);overflow:hidden;animation:fadeInScale 0.2s ease-out">
          <div style="padding:24px">
            <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 12px 0">Xác nhận gỡ giáo viên</h3>
            <p style="font-size:14px;color:#7F7A72;line-height:1.5;margin:0 0 24px 0">
              Bạn có chắc chắn muốn gỡ giáo viên <strong style="color:#2D2824">${teacher.full_name}</strong> khỏi EduTrack Center? Thao tác này sẽ thu hồi quyền truy cập của giáo viên.
            </p>
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px">
              <button id="btn-cancel-delete" type="button" style="background:#FAF7F2;border:1px solid #EAE4D8;color:#2D2824;border-radius:12px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer">
                Hủy
              </button>
              <button id="btn-confirm-delete" type="button" style="background:#A93226;border:none;color:#ffffff;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(169, 50, 38, 0.25)">
                Xác nhận gỡ
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

function renderWeekdayRows(days: TeacherProfileState['weekSchedule']['days']): string {
  return days.map(d => {
    const isToday = d.isToday;
    const rowBg = isToday ? '#F5E6E4' : '#FDFBF7';
    const dayColor = isToday ? '#A93226' : '#2D2824';
    const borderColor = isToday ? '#E8C9C5' : '#EAE4D8';

    let contentHtml = `<span style="color:#A8A29A;font-size:13.5px;font-style:italic">— nghỉ</span>`;
    if (d.session) {
      contentHtml = `
        <div style="background:#FFFFFF;border:1px solid ${isToday ? '#E8C9C5' : '#ECE3D6'};border-radius:10px;padding:8px 14px;display:inline-flex;align-items:center;gap:12px">
          <span style="font-weight:800;color:#2D2824;font-size:13.5px">${d.session.time}</span>
          <span style="color:#7F7A72;font-size:13.5px">·</span>
          <span style="font-weight:600;color:#2D2824;font-size:13.5px">${d.session.className}</span>
          <span style="background:#F5E6E4;color:#A93226;font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:6px">${d.session.sessionName}</span>
        </div>
      `;
    }

    return `
      <div style="background:${rowBg};border:1px solid ${borderColor};border-radius:12px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between">
        <div style="width:130px;flex-shrink:0">
          <div style="font-size:14px;font-weight:700;color:${dayColor}">${d.dayName}</div>
          <div style="font-size:12px;color:#7F7A72;margin-top:2px;font-weight:500">${d.dateStr}</div>
        </div>
        <div style="flex:1;text-align:left;padding-left:16px">
          ${contentHtml}
        </div>
      </div>
    `;
  }).join('');
}

function renderAssignedClasses(classes: Class[]): string {
  if (classes.length === 0) {
    return `
      <div style="padding:24px;text-align:center;color:#7F7A72;font-size:13.5px;background:#FDFBF7;border:1px dashed #EAE4D8;border-radius:12px">
        Giáo viên hiện không phụ trách lớp nào.
      </div>
    `;
  }

  return classes.map(c => `
    <div style="background:#FDFBF7;border:1px solid #EAE4D8;border-radius:14px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px">
      <div>
        <div style="font-size:15px;font-weight:700;color:#2D2824">
          ${c.class_name} <span style="font-weight:500;color:#7F7A72">| ${c.completed_sessions || 0} buổi</span>
        </div>
        <div style="display:flex;align-items:center;gap:14px;margin-top:8px">
          <span style="font-size:13px;color:#2D2824;font-weight:600;display:inline-flex;align-items:center;gap:4px">
            👥 ${c.current_students || 0} HV
          </span>
          <span style="background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-size:12px;font-weight:600;padding:2px 10px;border-radius:8px">
            Đi học —
          </span>
          <span style="background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-size:12px;font-weight:600;padding:2px 10px;border-radius:8px">
            Bài tập —
          </span>
        </div>
      </div>
      <a href="#/classes/${c.class_id}" style="color:#A93226;font-size:13.5px;font-weight:700;text-decoration:none">
        Xem chi tiết →
      </a>
    </div>
  `).join('');
}

function renderManagementContent(activeClassCount: number, otherTeachers: Staff[]): string {
  if (activeClassCount > 0) {
    const hasOtherTeachers = otherTeachers.length > 0;
    return `
      <div>
        <!-- Notice box -->
        <div style="background:#FBF4EE;border:1px solid #F0D4C3;border-radius:14px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px">
          <span style="color:#A93226;font-size:18px;line-height:1">⚠️</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:#922B21;margin-bottom:4px">
              Giáo viên còn ${activeClassCount} lớp đang mở — bàn giao cho giáo viên khác (hoặc đóng lớp) trước khi gỡ.
            </div>
            ${!hasOtherTeachers ? `
              <div style="font-size:13px;color:#AF601A;font-weight:600">
                Cần ≥2 giáo viên để bàn giao lớp. Hiện tại trung tâm chưa có giáo viên nào khác.
              </div>
            ` : `
              <div style="font-size:13px;color:#7F7A72">
                Chọn giáo viên tiếp nhận bên dưới để chuyển giao quyền phụ trách toàn bộ các lớp mở.
              </div>
            `}
          </div>
        </div>

        <!-- Handoff Action (when other teachers exist) -->
        ${hasOtherTeachers ? `
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:wrap">
            <label for="select-target-teacher" style="font-size:13.5px;font-weight:700;color:#2D2824">
              Bàn giao cho:
            </label>
            <select id="select-target-teacher" style="height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:14px;color:#2D2824;outline:none;min-width:240px">
              ${otherTeachers.map(t => `<option value="${t.staff_id}">${t.full_name} (${t.email})</option>`).join('')}
            </select>
            <button id="btn-transfer-classes" type="button" style="background:#A93226;color:#ffffff;border:none;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(169, 50, 38, 0.2)">
              Bàn giao lớp
            </button>
          </div>
        ` : ''}

        <!-- Disabled Delete Button -->
        <div>
          <button type="button" disabled style="background:#EAE4D8;color:#A8A29A;border:none;border-radius:12px;padding:11px 22px;font-size:14px;font-weight:700;cursor:not-allowed">
            Gỡ khỏi trung tâm
          </button>
          <span style="font-size:12.5px;color:#7F7A72;margin-left:12px">
            (Bị khóa do còn lớp đang mở)
          </span>
        </div>
      </div>
    `;
  }

  // When active classes == 0
  return `
    <div>
      <p style="font-size:14px;color:#7F7A72;margin:0 0 18px 0">
        Giáo viên hiện không phụ trách lớp mở nào. Bạn có thể gỡ giáo viên khỏi trung tâm khi cần thiết.
      </p>
      <button id="btn-open-delete-modal" type="button" style="background:#A93226;color:#ffffff;border:none;border-radius:12px;padding:11px 22px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(169, 50, 38, 0.25);transition:all 0.15s ease">
        Gỡ khỏi trung tâm
      </button>
    </div>
  `;
}

export function initTeacherDetailPage() {
  const hash = window.location.hash;
  const match = hash.match(/#\/teachers\/([^/?]+)/);
  currentTeacherId = match ? match[1] : 'STF003';

  // Load from API in background if possible
  fetchTeacherDetailApi(currentTeacherId, currentWeekOffset).then(apiRes => {
    if (apiRes && apiRes.teacher) {
      // Sync state if needed
    }
  });

  const refreshWeekUI = () => {
    profileState = computeLocalTeacherProfile(currentTeacherId, currentWeekOffset);
    if (!profileState) return;

    const rangeText = document.getElementById('week-range-text');
    const sessionsText = document.getElementById('week-sessions-count');
    const daysContainer = document.getElementById('week-days-container');

    if (rangeText) rangeText.textContent = profileState.weekSchedule.weekRange;
    if (sessionsText) sessionsText.textContent = `· ${profileState.weekSchedule.totalSessions} buổi`;
    if (daysContainer) daysContainer.innerHTML = renderWeekdayRows(profileState.weekSchedule.days);
  };

  // Week navigation listeners
  document.getElementById('btn-prev-week')?.addEventListener('click', () => {
    currentWeekOffset--;
    refreshWeekUI();
  });
  document.getElementById('btn-next-week')?.addEventListener('click', () => {
    currentWeekOffset++;
    refreshWeekUI();
  });
  document.getElementById('btn-current-week')?.addEventListener('click', () => {
    currentWeekOffset = 0;
    refreshWeekUI();
  });

  // Handoff classes handler
  const attachManagementListeners = () => {
    const transferBtn = document.getElementById('btn-transfer-classes');
    transferBtn?.addEventListener('click', async () => {
      const select = document.getElementById('select-target-teacher') as HTMLSelectElement | null;
      const targetId = select?.value;
      if (!targetId) return;

      const targetTeacher = staffData.find(s => s.staff_id === targetId);
      const targetName = targetTeacher?.full_name || 'giáo viên đã chọn';

      // 1. Call API
      await transferTeacherClassesApi(currentTeacherId, targetId);

      // 2. Update local state
      classAssignmentData.forEach(ca => {
        if (ca.teacher_id === currentTeacherId) {
          ca.teacher_id = targetId;
        }
      });

      showToast(`Đã bàn giao toàn bộ lớp thành công cho ${targetName}!`, 'success');

      // 3. Re-render management and KPI sections
      profileState = computeLocalTeacherProfile(currentTeacherId, currentWeekOffset);
      if (profileState) {
        const kpiClasses = document.getElementById('kpi-active-classes');
        const kpiStudents = document.getElementById('kpi-total-students');
        const assignedHeading = document.getElementById('assigned-classes-heading');
        const assignedList = document.getElementById('assigned-classes-list');
        const mgmtArea = document.getElementById('management-content-area');

        if (kpiClasses) kpiClasses.textContent = '0';
        if (kpiStudents) kpiStudents.textContent = '0';
        if (assignedHeading) assignedHeading.textContent = 'Lớp phụ trách (0)';
        if (assignedList) assignedList.innerHTML = renderAssignedClasses([]);
        if (mgmtArea) mgmtArea.innerHTML = renderManagementContent(0, profileState.otherTeachers);

        // Re-attach delete modal listener
        attachDeleteModalListeners();
      }
    });

    attachDeleteModalListeners();
  };

  const attachDeleteModalListeners = () => {
    const deleteModal = document.getElementById('modal-confirm-delete');
    const openDeleteBtn = document.getElementById('btn-open-delete-modal');
    const cancelDeleteBtn = document.getElementById('btn-cancel-delete');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');

    openDeleteBtn?.addEventListener('click', () => {
      if (deleteModal) deleteModal.style.display = 'flex';
    });

    cancelDeleteBtn?.addEventListener('click', () => {
      if (deleteModal) deleteModal.style.display = 'none';
    });

    confirmDeleteBtn?.addEventListener('click', async () => {
      await deleteTeacherApi(currentTeacherId);

      // Remove / deactivate in local data
      const t = staffData.find(s => s.staff_id === currentTeacherId);
      if (t) t.is_active = false;

      if (deleteModal) deleteModal.style.display = 'none';
      showToast(`Đã gỡ giáo viên khỏi trung tâm thành công`, 'success');
      window.location.hash = '#/teachers';
    });
  };

  attachManagementListeners();
}
