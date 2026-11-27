// ============================================
// EduTrack English - Lịch trung tâm (/schedule)
// Warm Minimalist Design System
// ============================================

import type { Session, Staff } from '../types.ts';
import { sessionData, centerClassData, classData, staffData, assignSubstituteTeacher, classAssignmentData } from '../data.ts';
import { getState } from '../state.ts';
import { showToast } from '../utils.ts';
import { updateSessionSubstituteApi } from '../api.ts';

type ViewMode = 'month' | 'week' | 'day';

// State for Center Schedule
let currentViewMode: ViewMode = 'month';
let currentDate = new Date(2026, 10, 20); // Default Nov 20, 2026 (matching system date)
let selectedTeacherIds: Set<string> = new Set(); // Empty means "All teachers"
let activeModalSessionId: string | null = null;
let keyListenerBound = false;

// Color palette & theme system for teachers (Lê Minh Cường, Phạm Thị Dung)
export interface TeacherTheme {
  primary: string;
  bgLight: string;
  border: string;
  badgeBg: string;
  badgeColor: string;
  name: string;
  shortName: string;
  colorLabel: string;
  dotColor: string;
  hoverShadow: string;
}

export const TEACHER_THEMES: Record<string, TeacherTheme> = {
  STF003: {
    primary: '#0284C7', // Xanh dương (Ocean Sky Blue)
    bgLight: '#F0F9FF',
    border: '#BAE6FD',
    badgeBg: '#E0F2FE',
    badgeColor: '#0369A1',
    name: 'Lê Minh Cường',
    shortName: 'Lê Minh Cường',
    colorLabel: 'Xanh dương',
    dotColor: '#0284C7',
    hoverShadow: 'rgba(2, 132, 199, 0.3)',
  },
  STF004: {
    primary: '#059669', // Xanh lá (Emerald Green)
    bgLight: '#ECFDF5',
    border: '#A7F3D0',
    badgeBg: '#D1FAE5',
    badgeColor: '#047857',
    name: 'Phạm Thị Dung',
    shortName: 'Phạm Thị Dung',
    colorLabel: 'Xanh lá',
    dotColor: '#059669',
    hoverShadow: 'rgba(5, 150, 105, 0.3)',
  },
};

export function getTeacherTheme(teacherId?: string, teacherName?: string): TeacherTheme {
  if (teacherId && TEACHER_THEMES[teacherId]) {
    return TEACHER_THEMES[teacherId];
  }
  const name = teacherName || '';
  if (name.includes('Dung')) return TEACHER_THEMES.STF004;
  return TEACHER_THEMES.STF003;
}

export function getTeacherColor(teacherId: string): string {
  return TEACHER_THEMES[teacherId]?.primary || '#0284C7';
}

function getClassName(classId: string): string {
  const c = centerClassData.find(item => item.class_id === classId) || classData.find(item => item.class_id === classId);
  return c?.class_name || 'IELTS Foundation 5.5 — Giáo trình mẫu';
}

function getActiveTeachers(): Staff[] {
  return staffData.filter(s => s.role === 'teacher' && s.is_active);
}

// Format helpers
function formatPeriodTitle(): string {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const date = currentDate.getDate();

  if (currentViewMode === 'month') {
    return `Tháng ${month}/${year}`;
  } else if (currentViewMode === 'week') {
    const monday = getMonday(currentDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mStr = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
    const sStr = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`;
    return `Tuần ${mStr} – ${sStr}`;
  } else {
    const weekdayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const wd = weekdayNames[currentDate.getDay()];
    return `${wd}, ${String(date).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Filter sessions strictly scoped by persona role (RBAC)
function getFilteredSessions(): Session[] {
  const user = getState().currentUser;
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  if (isTeacher && staffId) {
    const assignedClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teacher_id === staffId).forEach(ca => assignedClassIds.add(ca.class_id));
    centerClassData.filter(c => c.teacher_id === staffId).forEach(c => assignedClassIds.add(c.class_id));
    if (staffId === 'STF003') {
      assignedClassIds.add('CLS_IELTS_FND');
      assignedClassIds.add('CLS_COMM_01');
      assignedClassIds.add('CLS_SELF_01');
      assignedClassIds.add('CLS_NN01');
    } else if (staffId === 'STF004') {
      assignedClassIds.add('CLS_TRIAL_01');
      assignedClassIds.add('CLS_B1_01');
      assignedClassIds.add('CLS003');
      assignedClassIds.add('CLS005');
    }
    return sessionData.filter(s => {
      const matchTeacher = s.teacher_id === staffId || s.substitute_teacher_id === staffId;
      const matchClass = s.class_id && assignedClassIds.has(s.class_id);
      return matchTeacher || matchClass;
    });
  }

  if (isTA && staffId) {
    const assignedClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teaching_assistant_id === staffId).forEach(ca => assignedClassIds.add(ca.class_id));
    if (staffId === 'STF005') {
      assignedClassIds.add('CLS_IELTS_FND');
      assignedClassIds.add('CLS_COMM_01');
      assignedClassIds.add('CLS_SELF_01');
      assignedClassIds.add('CLS_NN01');
      assignedClassIds.add('CLS001');
      assignedClassIds.add('CLS004');
    } else if (staffId === 'STF006') {
      assignedClassIds.add('CLS_TRIAL_01');
      assignedClassIds.add('CLS_B1_01');
      assignedClassIds.add('CLS002');
      assignedClassIds.add('CLS003');
      assignedClassIds.add('CLS005');
    }
    return sessionData.filter(s => {
      const matchClass = s.class_id && assignedClassIds.has(s.class_id);
      return Boolean(matchClass);
    });
  }

  // Admin / Academic Manager:
  if (selectedTeacherIds.size === 0) {
    return sessionData;
  }
  return sessionData.filter(s => {
    // Check main teacher or substitute teacher
    const mainMatches = s.teacher_id && selectedTeacherIds.has(s.teacher_id);
    const subMatches = s.substitute_teacher_id && selectedTeacherIds.has(s.substitute_teacher_id);
    return mainMatches || subMatches;
  });
}

// Render Month View
function renderMonthGrid(filteredSessions: Session[], today: Date): string {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month & total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Day of week for first day (0 is Sun, 1 is Mon...)
  let startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon...
  const startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // 0 for Mon, 6 for Sun

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  let daysHtml = '';

  // 1. Prev month filler days
  for (let i = startOffset - 1; i >= 0; i--) {
    const prevDateNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, prevDateNum);
    const dateIso = prevDate.toISOString().split('T')[0];
    const daySessions = filteredSessions.filter(s => s.date === dateIso);

    daysHtml += `
      <div class="calendar-day-cell other-month" style="background:#FAF8F5;border:1px solid #EAE4D8;padding:8px;min-height:115px;opacity:0.55;display:flex;flex-direction:column">
        <div style="font-size:12.5px;font-weight:600;color:#A8A29A;margin-bottom:6px">
          ${prevDateNum}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;overflow-y:auto;flex:1">
          ${renderSessionPills(daySessions)}
        </div>
      </div>
    `;
  }

  // 2. Current month days
  for (let d = 1; d <= totalDays; d++) {
    const cellDate = new Date(year, month, d);
    const dateIso = cellDate.toISOString().split('T')[0];
    const isToday = isSameDay(cellDate, today);
    const daySessions = filteredSessions.filter(s => s.date === dateIso);

    daysHtml += `
      <div class="calendar-day-cell current-month" style="background:#FFFFFF;border:1px solid #EAE4D8;padding:8px;min-height:115px;display:flex;flex-direction:column;transition:background 0.15s ease">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          ${isToday ? `
            <span style="
              width:26px;
              height:26px;
              border-radius:50%;
              background:#A93226;
              color:#FFFFFF;
              font-weight:800;
              font-size:13px;
              display:inline-flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 2px 6px rgba(169,50,38,0.3);
            ">
              ${d}
            </span>
          ` : `
            <span style="font-size:13px;font-weight:700;color:#2D2824">
              ${d}
            </span>
          `}
          ${daySessions.length > 0 ? `
            <span style="font-size:10.5px;font-weight:700;color:#7F7A72">
              ${daySessions.length} buổi
            </span>
          ` : ''}
        </div>
        
        <!-- Session Pills -->
        <div style="display:flex;flex-direction:column;gap:4px;overflow-y:auto;flex:1">
          ${renderSessionPills(daySessions)}
        </div>
      </div>
    `;
  }

  // 3. Next month filler days (to complete 35 or 42 grid cells)
  const totalRendered = startOffset + totalDays;
  const remainingCells = totalRendered <= 35 ? 35 - totalRendered : 42 - totalRendered;
  for (let n = 1; n <= remainingCells; n++) {
    const nextDate = new Date(year, month + 1, n);
    const dateIso = nextDate.toISOString().split('T')[0];
    const daySessions = filteredSessions.filter(s => s.date === dateIso);

    daysHtml += `
      <div class="calendar-day-cell other-month" style="background:#FAF8F5;border:1px solid #EAE4D8;padding:8px;min-height:115px;opacity:0.55;display:flex;flex-direction:column">
        <div style="font-size:12.5px;font-weight:600;color:#A8A29A;margin-bottom:6px">
          ${n}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;overflow-y:auto;flex:1">
          ${renderSessionPills(daySessions)}
        </div>
      </div>
    `;
  }

  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.02)">
      <!-- 7 Column Headers (T2 to CN) -->
      <div style="display:grid;grid-template-columns:repeat(7, 1fr);background:#FDFBF7;border-bottom:1px solid #EAE4D8">
        ${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(wd => `
          <div style="padding:12px;text-align:center;font-size:13px;font-weight:800;color:#7F7A72;letter-spacing:0.02em">
            ${wd}
          </div>
        `).join('')}
      </div>

      <!-- Month Days Grid -->
      <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:1px;background:#EAE4D8">
        ${daysHtml}
      </div>
    </div>
  `;
}

// Render Week View
function renderWeekGrid(filteredSessions: Session[], today: Date): string {
  const monday = getMonday(currentDate);
  const weekdayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.02)">
      <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:1px;background:#EAE4D8">
        ${weekdayNames.map((wdName, idx) => {
          const colDate = new Date(monday);
          colDate.setDate(monday.getDate() + idx);
          const dateIso = colDate.toISOString().split('T')[0];
          const isToday = isSameDay(colDate, today);
          const daySessions = filteredSessions.filter(s => s.date === dateIso);

          return `
            <div style="background:#FFFFFF;display:flex;flex-direction:column;min-height:480px">
              <!-- Column Header -->
              <div style="
                padding:14px 10px;
                text-align:center;
                border-bottom:1px solid #EAE4D8;
                background:${isToday ? '#F5E6E4' : '#FDFBF7'};
              ">
                <div style="font-size:12.5px;font-weight:700;color:${isToday ? '#A93226' : '#7F7A72'};margin-bottom:4px">
                  ${wdName}
                </div>
                <div style="
                  font-size:16px;
                  font-weight:800;
                  color:${isToday ? '#A93226' : '#2D2824'};
                ">
                  ${colDate.getDate()}/${colDate.getMonth() + 1}
                  ${isToday ? '<span style="font-size:11px;font-weight:700;display:block;margin-top:2px">● Hôm nay</span>' : ''}
                </div>
              </div>

              <!-- Day Sessions Cards -->
              <div style="padding:10px;display:flex;flex-direction:column;gap:8px;flex:1;background:#FAF8F5">
                ${daySessions.length === 0 ? `
                  <div style="font-size:12px;color:#A8A29A;text-align:center;margin-top:20px;font-style:italic">
                    Không có ca học
                  </div>
                ` : daySessions.map(s => {
                  const className = getClassName(s.class_id);
                  const isSub = Boolean(s.substitute_teacher_name);
                  const theme = getTeacherTheme(s.teacher_id, s.teacher_name);

                  return `
                    <div 
                      class="schedule-session-card" 
                      data-session-id="${s.session_id}"
                      style="
                        background:#FFFFFF;
                        border:1px solid ${isSub ? '#F5DEC2' : theme.border};
                        border-left:4.5px solid ${isSub ? '#D97706' : theme.primary};
                        border-radius:12px;
                        padding:10px 12px;
                        cursor:pointer;
                        transition:all 0.15s ease;
                        box-shadow:0 1px 3px rgba(0,0,0,0.03);
                      "
                      onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px ${theme.hoverShadow}'"
                      onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.03)'"
                    >
                      <div style="font-size:11.5px;font-weight:800;color:${theme.primary};margin-bottom:3px">
                        ⏰ ${s.start_time} – ${s.end_time}
                      </div>
                      <div style="font-size:12.5px;font-weight:700;color:#2D2824;line-height:1.3;margin-bottom:4px">
                        ${className}
                      </div>
                      <div style="margin-top:2px;display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                        <span style="background:${theme.badgeBg};color:${theme.badgeColor};border:1px solid ${theme.border};font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:5px;display:inline-flex;align-items:center;gap:4px">
                          <span style="width:6px;height:6px;border-radius:50%;background:${theme.dotColor}"></span>
                          GV: ${s.teacher_name || theme.name}
                        </span>
                      </div>
                      ${isSub ? `
                        <div style="margin-top:4px;font-size:10.5px;font-weight:700;color:#B45309;background:#FEF3C7;border:1px solid #FDE68A;padding:2px 6px;border-radius:5px;display:inline-block">
                          🔄 Dạy thay: ${s.substitute_teacher_name}
                        </div>
                      ` : ''}
                      <div style="font-size:10.5px;color:#A8A29A;margin-top:4px">
                        📍 ${s.room || 'Phòng 204 - CS1'}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Render Day View
function renderDayGrid(filteredSessions: Session[], today: Date): string {
  const dateIso = currentDate.toISOString().split('T')[0];
  const daySessions = filteredSessions.filter(s => s.date === dateIso);
  const isToday = isSameDay(currentDate, today);

  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:28px 32px;box-shadow:0 2px 10px rgba(0,0,0,0.02)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid #EAE4D8;padding-bottom:18px">
        <div>
          <h2 style="font-size:22px;font-weight:800;color:#2D2824;margin:0 0 4px 0">
            ${formatPeriodTitle()}
          </h2>
          <div style="font-size:13.5px;color:#7F7A72">
            Tổng cộng: <strong style="color:#A93226">${daySessions.length}</strong> ca học trong ngày
          </div>
        </div>
        ${isToday ? `
          <span style="background:#F5E6E4;color:#A93226;font-size:13px;font-weight:800;padding:6px 16px;border-radius:20px;border:1px solid #F0D5D2">
            ● Hôm nay
          </span>
        ` : ''}
      </div>

      <!-- List of day sessions -->
      <div style="display:flex;flex-direction:column;gap:14px">
        ${daySessions.length === 0 ? `
          <div style="padding:48px 24px;text-align:center;color:#7F7A72">
            <div style="font-size:36px;margin-bottom:8px">☕</div>
            <div style="font-size:15px;font-weight:700;color:#2D2824">Không có ca học nào trong ngày này</div>
            <div style="font-size:13px;color:#7F7A72;margin-top:4px">Chọn ngày khác trên thanh điều hướng để xem lịch dạy.</div>
          </div>
        ` : daySessions.map(s => {
          const className = getClassName(s.class_id);
          const isSub = Boolean(s.substitute_teacher_name);
          const theme = getTeacherTheme(s.teacher_id, s.teacher_name);

          return `
            <div 
              class="schedule-session-card" 
              data-session-id="${s.session_id}"
              style="
                background:#FDFBF7;
                border:1px solid ${isSub ? '#F5DEC2' : theme.border};
                border-left:6px solid ${isSub ? '#D97706' : theme.primary};
                border-radius:16px;
                padding:18px 22px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                cursor:pointer;
                transition:all 0.15s ease;
                box-shadow:0 1px 3px rgba(0,0,0,0.02);
              "
              onmouseover="this.style.background='#FFFFFF';this.style.boxShadow='0 4px 16px ${theme.hoverShadow}'"
              onmouseout="this.style.background='#FDFBF7';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)'"
            >
              <div style="display:flex;align-items:center;gap:20px">
                <div style="
                  background:#FFFFFF;
                  border:1px solid ${theme.border};
                  border-radius:12px;
                  padding:10px 16px;
                  text-align:center;
                  min-width:110px;
                ">
                  <div style="font-size:16px;font-weight:800;color:${theme.primary};line-height:1.2">${s.start_time}</div>
                  <div style="font-size:12px;color:#7F7A72">đến ${s.end_time}</div>
                </div>

                <div>
                  <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:4px">
                    ${className}
                  </div>
                  <div style="font-size:13px;color:#7F7A72;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                    <span style="background:${theme.badgeBg};color:${theme.badgeColor};border:1px solid ${theme.border};padding:2px 8px;border-radius:6px;font-weight:700;font-size:12px;display:inline-flex;align-items:center;gap:5px">
                      <span style="width:7px;height:7px;border-radius:50%;background:${theme.dotColor}"></span>
                      GV: <strong style="color:${theme.primary}">${s.teacher_name || theme.name}</strong>
                    </span>
                    <span>📍 ${s.room || 'Phòng 204 - CS1'}</span>
                  </div>
                  ${isSub ? `
                    <div style="margin-top:6px;font-size:12px;font-weight:700;color:#B45309;background:#FEF3C7;border:1px solid #FDE68A;padding:3px 10px;border-radius:6px;display:inline-block">
                      🔄 Dạy thay: ${s.substitute_teacher_name} ${s.substitute_reason ? `(${s.substitute_reason})` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>

              <div>
                <button type="button" style="background:${theme.primary};color:#FFFFFF;border:none;border-radius:10px;padding:8px 16px;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px ${theme.hoverShadow}">
                  ${getState().currentUser?.role === 'admin' ? 'Đổi GV dạy thay' : 'Chi tiết'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Render session pill for month cell
function renderSessionPills(sessions: Session[]): string {
  return sessions.map(s => {
    const className = getClassName(s.class_id);
    const isSub = Boolean(s.substitute_teacher_name);
    const theme = getTeacherTheme(s.teacher_id, s.teacher_name);
    const subTheme = isSub ? getTeacherTheme(s.substitute_teacher_id, s.substitute_teacher_name) : null;
    const pillBg = isSub 
      ? `linear-gradient(135deg, ${theme.primary} 0%, ${subTheme ? subTheme.primary : '#D97706'} 100%)` 
      : theme.primary;
    const shortLabel = theme.name.includes('Dung') ? 'Dung' : theme.name.includes('Cường') ? 'Cường' : theme.name.split(' ').pop();

    return `
      <div 
        class="schedule-session-pill" 
        data-session-id="${s.session_id}"
        style="
          background:${pillBg};
          color:#FFFFFF;
          font-size:11px;
          font-weight:700;
          padding:3.5px 7px;
          border-radius:6px;
          cursor:pointer;
          line-height:1.3;
          box-shadow:0 1px 3px ${theme.hoverShadow};
          transition:transform 0.1s ease, filter 0.1s ease;
          display:flex;
          flex-direction:column;
          gap:1px;
        "
        onmouseover="this.style.transform='scale(1.02)';this.style.filter='brightness(1.08)'"
        onmouseout="this.style.transform='scale(1)';this.style.filter='brightness(1)'"
        title="${s.start_time} ${className} - GV: ${s.teacher_name || theme.name}${isSub ? ` (Dạy thay: ${s.substitute_teacher_name})` : ''}"
      >
        <div style="display:flex;align-items:center;justify-content:space-between;gap:4px">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${s.start_time} ${className}</span>
          <span style="background:rgba(255,255,255,0.25);font-size:9.5px;font-weight:700;padding:1px 4px;border-radius:3px;flex-shrink:0;letter-spacing:0.02em">
            ${shortLabel}
          </span>
        </div>
        ${isSub ? `<span style="font-size:9.5px;opacity:0.95;color:#FEF3C7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🔄 ${s.substitute_teacher_name}</span>` : ''}
      </div>
    `;
  }).join('');
}

// Render Substitute Modal
function renderSubstituteModal(session: Session | null): string {
  if (!session) return '';

  const state = getState();
  const isAdmin = state.currentUser?.role === 'admin';
  const className = getClassName(session.class_id);
  const teachers = getActiveTeachers();
  const currentSubId = session.substitute_teacher_id;
  const theme = getTeacherTheme(session.teacher_id, session.teacher_name);

  return `
    <div id="modal-substitute-teacher" style="position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:520px;box-shadow:0 24px 48px rgba(0,0,0,0.18);overflow:hidden;animation:fadeInScale 0.18s ease-out">
        
        <!-- Modal Header -->
        <div style="padding:20px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between;background:#FDFBF7">
          <div>
            <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 3px 0">
              ${isAdmin ? 'Ghi nhận giáo viên dạy thay' : 'Thông tin chi tiết buổi học'}
            </h3>
            <div style="font-size:12.5px;color:#7F7A72">
              EduTrack English · điều phối nhân sự giảng dạy
            </div>
          </div>
          <button id="btn-close-sub-modal" type="button" style="background:none;border:none;font-size:20px;color:#7F7A72;cursor:pointer;padding:4px">
            ✕
          </button>
        </div>

        <!-- Modal Body -->
        <div style="padding:22px 24px;display:flex;flex-direction:column;gap:16px">
          <!-- Session Info Summary -->
          <div style="background:#FAF8F5;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:8px">
            <div style="font-size:14px;font-weight:800;color:#2D2824">
              📚 ${className}
            </div>
            <div style="font-size:12.5px;color:#7F7A72;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <span>📅 ${session.date}</span>
              <span>⏰ ${session.start_time} – ${session.end_time}</span>
              <span>📍 ${session.room || 'Phòng 204 - CS1'}</span>
            </div>
            <div style="font-size:13px;color:#2D2824;border-top:1px dashed #EAE4D8;padding-top:8px;margin-top:2px;display:flex;align-items:center;gap:6px">
              <span>Giáo viên chính:</span>
              <span style="background:${theme.badgeBg};color:${theme.primary};border:1px solid ${theme.border};padding:2px 8px;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;gap:5px">
                <span style="width:6px;height:6px;border-radius:50%;background:${theme.dotColor}"></span>
                ${session.teacher_name || theme.name}
              </span>
            </div>
          </div>

          ${isAdmin ? `
            <!-- Admin Form: Select Substitute Teacher -->
            <div>
              <label for="substitute-teacher-select" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
                Giáo viên dạy thay
              </label>
              <select id="substitute-teacher-select" style="width:100%;height:42px;padding:0 12px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13.5px;color:#2D2824;outline:none">
                <option value="">
                  — Khôi phục giáo viên chính (${session.teacher_name || 'Lê Minh Cường'}) —
                </option>
                ${teachers.map(t => `
                  <option value="${t.staff_id}" ${t.staff_id === currentSubId ? 'selected' : ''}>
                    ${t.full_name} (${t.email})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Optional Reason -->
            <div>
              <label for="substitute-reason-input" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
                Lý do dạy thay (tùy chọn)
              </label>
              <input 
                id="substitute-reason-input" 
                type="text" 
                placeholder="VD: Nghỉ phép đột xuất, tham gia hội thảo..."
                value="${session.substitute_reason || ''}"
                style="width:100%;height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none"
              />
            </div>
          ` : `
            <!-- Non-admin read only note -->
            <div style="font-size:13px;color:#7F7A72;background:#FFF8EC;border:1px solid #F5DEC2;border-radius:12px;padding:12px 14px">
              ℹ️ ${session.substitute_teacher_name ? `Buổi học này do <strong>${session.substitute_teacher_name}</strong> dạy thay.` : 'Buổi học do giáo viên chính phụ trách.'}
              <div style="margin-top:4px;font-size:11.5px;color:#AF601A">
                Chỉ Quản trị viên (Admin) mới có quyền chỉ định hoặc thay đổi giáo viên dạy thay.
              </div>
            </div>
          `}
        </div>

        <!-- Modal Footer -->
        <div style="padding:16px 24px;border-top:1px solid #EAE4D8;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:#FDFBF7">
          <button id="btn-cancel-sub-modal" type="button" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:600;color:#2D2824;cursor:pointer">
            ${isAdmin ? 'Hủy' : 'Đóng'}
          </button>
          ${isAdmin ? `
            <button id="btn-save-sub-modal" type="button" style="background:#A93226;color:#FFFFFF;border:none;border-radius:10px;padding:8px 20px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(169,50,38,0.25)">
              Lưu thay đổi
            </button>
          ` : ''}
        </div>

      </div>
    </div>
  `;
}

// Main page render
export function renderSchedulePage(): string {
  const user = getState().currentUser;
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const teachers = getActiveTeachers();
  const filteredSessions = getFilteredSessions();
  const today = new Date(2026, 10, 20); // Nov 20, 2026

  let gridContent = '';
  if (currentViewMode === 'month') {
    gridContent = renderMonthGrid(filteredSessions, today);
  } else if (currentViewMode === 'week') {
    gridContent = renderWeekGrid(filteredSessions, today);
  } else {
    gridContent = renderDayGrid(filteredSessions, today);
  }

  const activeSession = activeModalSessionId
    ? sessionData.find(s => s.session_id === activeModalSessionId) || null
    : null;

  return `
    <div class="schedule-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Page Header -->
      <div style="margin-bottom:24px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
          ${isTeacher ? 'Lịch giảng dạy của tôi' : isTA ? 'Lịch trợ giảng của tôi' : 'Lịch trung tâm'}
        </h1>
        <div style="font-size:14px;color:#7F7A72;font-weight:500">
          ${isTeacher 
            ? 'Theo dõi ca dạy, phòng học và lịch đào tạo các lớp bạn phụ trách' 
            : isTA 
            ? 'Theo dõi ca trực, phòng học và hỗ trợ điểm danh các lớp bạn phụ trách' 
            : 'EduTrack English · lịch dạy mọi giáo viên'}
        </div>
      </div>

      <!-- 2. Hàng điều hướng trên cùng (View mode pills bên trái, Cụm kỳ bên phải) -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:18px">
        <!-- Bên trái: 3 nút chuyển chế độ xem dạng pill -->
        <div style="display:flex;align-items:center;background:#FFFFFF;border:1px solid #EAE4D8;border-radius:30px;padding:3px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <button 
            type="button" 
            class="btn-view-mode ${currentViewMode === 'month' ? 'active' : ''}" 
            data-mode="month"
            style="
              border:none;
              border-radius:24px;
              padding:7px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${currentViewMode === 'month' ? 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 6px rgba(169,50,38,0.25);' : 'background:transparent;color:#2D2824;'}
            "
          >
            Tháng
          </button>
          <button 
            type="button" 
            class="btn-view-mode ${currentViewMode === 'week' ? 'active' : ''}" 
            data-mode="week"
            style="
              border:none;
              border-radius:24px;
              padding:7px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${currentViewMode === 'week' ? 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 6px rgba(169,50,38,0.25);' : 'background:transparent;color:#2D2824;'}
            "
          >
            Tuần
          </button>
          <button 
            type="button" 
            class="btn-view-mode ${currentViewMode === 'day' ? 'active' : ''}" 
            data-mode="day"
            style="
              border:none;
              border-radius:24px;
              padding:7px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${currentViewMode === 'day' ? 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 6px rgba(169,50,38,0.25);' : 'background:transparent;color:#2D2824;'}
            "
          >
            Ngày
          </button>
        </div>

        <!-- Bên phải: Cụm điều hướng kỳ (◀, Nhãn kỳ, ▶, Hôm nay) -->
        <div style="display:flex;align-items:center;gap:8px">
          <button 
            id="btn-schedule-prev" 
            type="button" 
            title="Kỳ trước (Phím ←)"
            style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#2D2824;font-size:14px;box-shadow:0 1px 3px rgba(0,0,0,0.02)"
          >
            ◀
          </button>

          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:10px;padding:7px 16px;font-size:14px;font-weight:800;color:#2D2824;min-width:140px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
            ${formatPeriodTitle()}
          </div>

          <button 
            id="btn-schedule-next" 
            type="button" 
            title="Kỳ sau (Phím →)"
            style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#2D2824;font-size:14px;box-shadow:0 1px 3px rgba(0,0,0,0.02)"
          >
            ▶
          </button>

          <button 
            id="btn-schedule-today" 
            type="button" 
            title="Về ngày hiện tại (Phím T)"
            style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;color:#2D2824;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.02)"
          >
            Hôm nay
          </button>
        </div>
      </div>

      <!-- 3. Hàng lọc giáo viên (Chỉ hiển thị cho Ban Quản lý / Admin) -->
      ${(!isTeacher && !isTA) ? `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <!-- Nút Tất cả -->
        <button 
          id="btn-filter-all-teachers" 
          type="button"
          style="
            border-radius:20px;
            padding:6px 16px;
            font-size:12.5px;
            font-weight:700;
            cursor:pointer;
            transition:all 0.15s ease;
            ${selectedTeacherIds.size === 0 
              ? 'background:#2D2824;color:#FFFFFF;border:1px solid #2D2824;' 
              : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
            }
          "
        >
          Tất cả giáo viên (${teachers.length})
        </button>

        <!-- Danh sách chip từng giáo viên -->
        ${teachers.map(t => {
          const isSelected = selectedTeacherIds.has(t.staff_id);
          const theme = getTeacherTheme(t.staff_id, t.full_name);

          return `
            <button 
              type="button" 
              class="btn-teacher-chip" 
              data-teacher-id="${t.staff_id}"
              style="
                border-radius:20px;
                padding:6px 14px;
                font-size:12.5px;
                font-weight:700;
                cursor:pointer;
                display:inline-flex;
                align-items:center;
                gap:7px;
                transition:all 0.15s ease;
                ${isSelected 
                  ? `background:${theme.bgLight};color:${theme.primary};border:1.5px solid ${theme.primary};box-shadow:0 2px 6px ${theme.hoverShadow};` 
                  : `background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;`
                }
              "
            >
              <span style="width:8px;height:8px;border-radius:50%;background:${theme.dotColor};display:inline-block"></span>
              <span>${t.full_name}</span>
              <span style="font-size:11px;font-weight:600;opacity:0.85;color:${isSelected ? theme.primary : '#7F7A72'}">(${theme.colorLabel})</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- 5. Dòng hướng dẫn & phím tắt nhỏ màu xám -->
      <div style="font-size:12px;color:#7F7A72;margin-bottom:20px;line-height:1.4">
        💡 <strong>Bấm vào một buổi để ghi nhận giáo viên dạy thay</strong> · bấm chip giáo viên để lọc (chọn được nhiều). · <em>Phím tắt: ← → đổi kỳ · T hôm nay · M / W / D đổi xem</em>
      </div>
      ` : `
      <div style="font-size:12px;color:#7F7A72;margin-bottom:20px;line-height:1.4">
        💡 Lịch học được tự động đồng bộ theo các lớp bạn được phân công phụ trách. <em>Phím tắt: ← → đổi kỳ · T hôm nay · M / W / D đổi xem</em>
      </div>
      `}

      <!-- 6. Lưới lịch (Chế độ Tháng / Tuần / Ngày) -->
      ${gridContent}

      <!-- 7. Modal ghi nhận dạy thay (nếu đang active) -->
      <div id="substitute-modal-container">
        ${renderSubstituteModal(activeSession)}
      </div>

    </div>
  `;
}

// Bind events & keyboard shortcuts
export function initSchedulePage(): void {
  // 1. View Mode Pills
  document.querySelectorAll<HTMLButtonElement>('.btn-view-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode as ViewMode;
      if (mode && mode !== currentViewMode) {
        currentViewMode = mode;
        reRender();
      }
    });
  });

  // 2. Navigation controls
  document.getElementById('btn-schedule-prev')?.addEventListener('click', () => {
    navigatePeriod(-1);
  });

  document.getElementById('btn-schedule-next')?.addEventListener('click', () => {
    navigatePeriod(1);
  });

  document.getElementById('btn-schedule-today')?.addEventListener('click', () => {
    currentDate = new Date(2026, 10, 20); // Default Today Nov 20, 2026
    reRender();
  });

  // 3. Teacher Filter Chips
  document.getElementById('btn-filter-all-teachers')?.addEventListener('click', () => {
    selectedTeacherIds.clear();
    reRender();
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-teacher-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tId = chip.dataset.teacherId;
      if (!tId) return;

      if (selectedTeacherIds.has(tId)) {
        selectedTeacherIds.delete(tId);
      } else {
        selectedTeacherIds.add(tId);
      }
      reRender();
    });
  });

  // 4. Session Click (Open Substitute Modal)
  document.querySelectorAll<HTMLElement>('.schedule-session-pill, .schedule-session-card').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const sessionId = el.dataset.sessionId;
      if (sessionId) {
        activeModalSessionId = sessionId;
        const container = document.getElementById('substitute-modal-container');
        if (container) {
          const session = sessionData.find(s => s.session_id === sessionId) || null;
          container.innerHTML = renderSubstituteModal(session);
          bindModalEvents();
        }
      }
    });
  });

  bindModalEvents();

  // 5. Global Keyboard Shortcuts
  if (!keyListenerBound) {
    window.addEventListener('keydown', handleScheduleKeyboard);
    keyListenerBound = true;
  }
}

function navigatePeriod(step: number) {
  if (currentViewMode === 'month') {
    currentDate.setMonth(currentDate.getMonth() + step);
  } else if (currentViewMode === 'week') {
    currentDate.setDate(currentDate.getDate() + step * 7);
  } else {
    currentDate.setDate(currentDate.getDate() + step);
  }
  reRender();
}

function handleScheduleKeyboard(e: KeyboardEvent) {
  // Only trigger if user is on #/schedule
  if (!window.location.hash.startsWith('#/schedule')) return;

  // Don't intercept when user is typing in inputs or selects
  const target = e.target as HTMLElement;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    navigatePeriod(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    navigatePeriod(1);
  } else if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    currentDate = new Date(2026, 10, 20);
    reRender();
  } else if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    currentViewMode = 'month';
    reRender();
  } else if (e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    currentViewMode = 'week';
    reRender();
  } else if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    currentViewMode = 'day';
    reRender();
  }
}

function bindModalEvents() {
  const modal = document.getElementById('modal-substitute-teacher');
  if (!modal) return;

  const closeModal = () => {
    activeModalSessionId = null;
    modal.remove();
  };

  document.getElementById('btn-close-sub-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-sub-modal')?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Save button
  document.getElementById('btn-save-sub-modal')?.addEventListener('click', () => {
    if (!activeModalSessionId) return;

    const select = document.getElementById('substitute-teacher-select') as HTMLSelectElement | null;
    const reasonInput = document.getElementById('substitute-reason-input') as HTMLInputElement | null;
    const subTeacherId = select?.value || '';
    const reason = reasonInput?.value.trim() || '';

    const subTeacher = staffData.find(s => s.staff_id === subTeacherId);
    const subTeacherName = subTeacher?.full_name;

    assignSubstituteTeacher(
      activeModalSessionId,
      subTeacherId || undefined,
      subTeacherName || undefined,
      reason || undefined
    );

    // Call backend API in background
    updateSessionSubstituteApi(
      activeModalSessionId,
      subTeacherId || undefined,
      subTeacherName,
      reason
    ).catch(() => {});

    if (subTeacherId) {
      showToast(`Đã ghi nhận GV ${subTeacherName} dạy thay buổi học!`, 'success');
    } else {
      showToast('Đã khôi phục lại giáo viên chính cho buổi học!', 'success');
    }

    closeModal();
    reRender();
  });
}

function reRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderSchedulePage();
    initSchedulePage();
  }
}
