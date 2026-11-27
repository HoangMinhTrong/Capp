// ============================================
// EduTrack English - Màn hình Điểm danh (/attendance)
// Hỗ trợ phân quyền Giáo viên, Trợ giảng & Quản lý trung tâm
// Warm Minimalist Design System
// ============================================

import type { AttendanceStatus } from '../types.ts';
import { classData, sessionData, attendanceData, enrollmentData, studentData, classAssignmentData, centerClassData } from '../data.ts';
import { getState } from '../state.ts';
import {
  icons,
  formatDate,
  formatDateTime,
  attendanceLabels,
  attendanceBadgeClass,
  showToast,
  renderDonutChart,
  renderBarChart,
} from '../utils.ts';

// === Helpers ===

function getFilteredClasses(campusFilter: string) {
  const user = getState().currentUser;
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  let classes = [...classData];

  // RBAC Scoping: Teacher / TA strictly only see their assigned classes
  if (isTeacher && staffId) {
    const assignedIds = new Set<string>();
    centerClassData.forEach(c => {
      if (c.teacher_id === staffId) assignedIds.add(c.class_id);
    });
    classAssignmentData.forEach(ca => {
      if (ca.teacher_id === staffId) assignedIds.add(ca.class_id);
    });
    classData.forEach(c => {
      if (c.author_name?.includes(user.full_name)) assignedIds.add(c.class_id);
    });
    if (staffId === 'STF003' || user.email === 'cuong.le@edu.vn') {
      assignedIds.add('CLS_NN01');
      assignedIds.add('CLS_IELTS_FND');
      assignedIds.add('CLS001');
      assignedIds.add('CLS002');
      assignedIds.add('CLS004');
    } else if (staffId === 'STF004') {
      assignedIds.add('CLS003');
      assignedIds.add('CLS005');
    }
    classes = classes.filter(c => assignedIds.has(c.class_id));
  } else if (isTA && staffId) {
    const assignedIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teaching_assistant_id === staffId).forEach(ca => assignedIds.add(ca.class_id));
    classes = classes.filter(c => assignedIds.has(c.class_id));
  } else {
    const effectiveCampus = campusFilter !== 'all' ? campusFilter : getState().selectedCampus;
    if (effectiveCampus !== 'all') {
      classes = classes.filter(c => c.campus === effectiveCampus);
    }
  }

  return classes;
}

function getSessionsForClass(classId: string) {
  // Returns all sessions for this class sorted by session number
  return sessionData
    .filter(s => s.class_id === classId)
    .sort((a, b) => a.session_number - b.session_number);
}

function getEnrolledStudents(classId: string) {
  const enrolledIds = enrollmentData
    .filter(e => e.class_id === classId && e.status === 'active')
    .map(e => e.student_id);
  return studentData.filter(s => enrolledIds.includes(s.student_id));
}

function computeGlobalKPIs(campusFilter: string) {
  const relevantClasses = getFilteredClasses(campusFilter);
  const classIds = new Set(relevantClasses.map(c => c.class_id));

  const records = attendanceData.filter(a => classIds.has(a.class_id));
  const totalSessions = records.length;
  const presentCount = records.filter(a => a.status === 'present').length;
  const lateCount = records.filter(a => a.status === 'late').length;
  const absentCount = records.filter(a => a.status === 'absent').length;
  const attendedCount = presentCount + lateCount;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

  return { totalSessions, attendanceRate, lateCount, absentCount };
}

function renderAttendanceRows(classId: string, sessionId: string): string {
  const students = getEnrolledStudents(classId);
  if (students.length === 0) {
    return `
      <tr>
        <td colspan="6" style="padding:48px 16px;text-align:center">
          <div style="font-size:36px;margin-bottom:8px">👥</div>
          <p style="margin:0;color:#7F7A72;font-size:14px;font-weight:600">Không có học viên nào trong danh sách lớp này</p>
        </td>
      </tr>
    `;
  }

  return students.map((s) => {
    const record = attendanceData.find(
      a => a.student_id === s.student_id && a.session_id === sessionId
    );
    const status: AttendanceStatus = record?.status ?? 'absent';
    const recordedAt = record?.recorded_at ? formatDateTime(record.recorded_at) : '—';
    const notes = record?.notes ?? '—';

    return `
      <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" onmouseover="this.style.background='#FAF7F2'" onmouseout="this.style.background='transparent'">
        <td style="padding:14px 16px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;color:#A93226;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${s.avatar_initials}
            </div>
            <div>
              <div style="font-weight:700;color:#2D2824;font-size:13.5px">${s.full_name}</div>
              <div style="font-size:11.5px;color:#7F7A72">${s.email}</div>
            </div>
          </div>
        </td>
        <td style="padding:14px 16px">
          <span style="font-family:monospace;font-size:12.5px;font-weight:700;color:#2D2824;background:#FAF7F2;padding:3px 8px;border-radius:6px;border:1px solid #EAE4D8">
            ${s.student_code}
          </span>
        </td>
        <td style="padding:14px 16px">
          <span class="badge ${attendanceBadgeClass[status]}" style="font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:9999px">
            <span class="badge-dot"></span>${attendanceLabels[status]}
          </span>
        </td>
        <td style="padding:14px 16px;font-size:12.5px;color:#7F7A72">${recordedAt}</td>
        <td style="padding:14px 16px;font-size:12.5px;color:#7F7A72">${notes}</td>
        <td style="padding:14px 16px">
          <div style="display:flex;gap:6px">
            <button class="btn-mark-status" data-student="${s.student_id}" data-status="present" title="Có mặt" style="width:32px;height:32px;border-radius:8px;border:1px solid ${status === 'present' ? '#166534' : '#EAE4D8'};background:${status === 'present' ? '#E2F6ED' : '#FFFFFF'};color:#166534;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px">
              ✓
            </button>
            <button class="btn-mark-status" data-student="${s.student_id}" data-status="late" title="Đi muộn" style="width:32px;height:32px;border-radius:8px;border:1px solid ${status === 'late' ? '#D97706' : '#EAE4D8'};background:${status === 'late' ? '#FEF3C7' : '#FFFFFF'};color:#D97706;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px">
              ⏱
            </button>
            <button class="btn-mark-status" data-student="${s.student_id}" data-status="absent" title="Vắng mặt" style="width:32px;height:32px;border-radius:8px;border:1px solid ${status === 'absent' ? '#DC2626' : '#EAE4D8'};background:${status === 'absent' ? '#FEE2E2' : '#FFFFFF'};color:#DC2626;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderClassSummarySection(classId: string): string {
  if (!classId) return '';

  const sessions = getSessionsForClass(classId);
  const students = getEnrolledStudents(classId);
  if (sessions.length === 0 || students.length === 0) {
    return `
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:32px;text-align:center;box-shadow:0 3px 12px rgba(45,40,36,0.03);margin-top:24px">
        <p style="color:#7F7A72;margin:0;font-size:13.5px">Chưa có dữ liệu tổng hợp điểm danh cho lớp này.</p>
      </div>
    `;
  }

  const classRecords = attendanceData.filter(a => a.class_id === classId);
  const totalRecords = classRecords.length;
  const presentCount = classRecords.filter(a => a.status === 'present').length;
  const lateCount = classRecords.filter(a => a.status === 'late').length;
  const absentCount = classRecords.filter(a => a.status === 'absent').length;
  const excusedCount = classRecords.filter(a => a.status === 'excused').length;

  const cls = classData.find(c => c.class_id === classId);

  // Per-student attendance rates
  const studentRates = students.map(s => {
    const recs = classRecords.filter(a => a.student_id === s.student_id);
    const total = recs.length;
    const attended = recs.filter(a => a.status === 'present' || a.status === 'late').length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { name: s.full_name.split(' ').pop() || s.full_name, rate };
  });

  const barData = studentRates.map(sr => ({
    label: sr.name,
    value: sr.rate,
    max: 100,
    color: sr.rate >= 85 ? '#059669' : sr.rate >= 70 ? '#D97706' : '#DC2626',
  }));

  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03);margin-top:24px">
      <div style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;color:#2D2824;margin-bottom:20px">
        <span>📊</span>
        <span>Tổng hợp chuyên cần — ${cls?.class_name ?? classId}</span>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:start">
        <!-- Donut charts -->
        <div style="display:flex;gap:24px;flex-wrap:wrap">
          ${renderDonutChart(presentCount + lateCount, totalRecords, '#059669', 'Tỷ lệ có mặt', 115)}
          ${renderDonutChart(absentCount, totalRecords, '#DC2626', 'Tỷ lệ vắng', 115)}
        </div>

        <!-- Status breakdown -->
        <div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
            <div style="text-align:center;padding:14px;border-radius:14px;background:#F0FDF4;border:1px solid #BBF7D0">
              <div style="font-size:24px;font-weight:900;color:#166534;line-height:1;margin-bottom:4px">${presentCount}</div>
              <div style="font-size:12px;font-weight:700;color:#166534">Có mặt</div>
            </div>
            <div style="text-align:center;padding:14px;border-radius:14px;background:#FFFBEB;border:1px solid #FDE68A">
              <div style="font-size:24px;font-weight:900;color:#B45309;line-height:1;margin-bottom:4px">${lateCount}</div>
              <div style="font-size:12px;font-weight:700;color:#B45309">Đi muộn</div>
            </div>
            <div style="text-align:center;padding:14px;border-radius:14px;background:#FEF2F2;border:1px solid #FECACA">
              <div style="font-size:24px;font-weight:900;color:#991B1B;line-height:1;margin-bottom:4px">${absentCount}</div>
              <div style="font-size:12px;font-weight:700;color:#991B1B">Vắng mặt</div>
            </div>
            <div style="text-align:center;padding:14px;border-radius:14px;background:#EFF6FF;border:1px solid #BFDBFE">
              <div style="font-size:24px;font-weight:900;color:#1D4ED8;line-height:1;margin-bottom:4px">${excusedCount}</div>
              <div style="font-size:12px;font-weight:700;color:#1D4ED8">Có phép</div>
            </div>
          </div>

          <!-- Per-student bar chart -->
          <div style="font-size:13px;font-weight:700;color:#2D2824;margin-bottom:10px">Tỷ lệ có mặt theo từng học viên (%)</div>
          ${renderBarChart(barData, 160)}
        </div>
      </div>
    </div>
  `;
}

// === Render ===

export function renderAttendancePage(): string {
  const state = getState();
  const user = state.currentUser;
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const campusValue = state.selectedCampus || 'all';
  const kpis = computeGlobalKPIs(campusValue);
  const classes = getFilteredClasses(campusValue);

  const defaultClassId = classes.length > 0 ? classes[0].class_id : '';
  const defaultSessions = defaultClassId ? getSessionsForClass(defaultClassId) : [];
  const defaultSessionId = defaultSessions.length > 0 ? defaultSessions[defaultSessions.length - 1].session_id : '';

  return `
    <div class="attendance-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>📋</span>
            <span>Điểm danh lớp học</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            ${isTeacher 
              ? `Theo dõi chuyên cần &amp; Điểm danh các lớp phụ trách giảng dạy · Giảng viên: <strong style="color:#2D2824">${user?.full_name}</strong>`
              : isTA
              ? `Hỗ trợ điểm danh &amp; Nhắc nhở chuyên cần các lớp phụ trách · Trợ giảng: <strong style="color:#2D2824">${user?.full_name}</strong>`
              : 'Theo dõi và quản lý chuyên cần học viên toàn hệ thống trung tâm'
            }
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <button class="btn btn-outline" id="btn-export-attendance" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:8px 18px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            ${icons.download} Xuất báo cáo CSV
          </button>
          <button class="btn btn-primary" id="btn-mark-all-present" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:8px 18px;border:none;background:#A93226;color:#FFFFFF;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            ${icons.check} Điểm danh tất cả có mặt
          </button>
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${kpis.totalSessions.toLocaleString()}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tổng lượt điểm danh</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${kpis.attendanceRate}%
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tỷ lệ có mặt</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${kpis.lateCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Đi muộn</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#DC2626;line-height:1;margin-bottom:8px">
            ${kpis.absentCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Vắng mặt</div>
        </div>
      </div>

      <!-- 3. Thanh bộ lọc chọn Lớp & Buổi học -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:14px 20px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-bottom:24px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#2D2824">
          <span>🔍 Lọc buổi:</span>
        </div>
        <select class="form-select" id="att-class-filter" style="flex:1;min-width:240px;height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none;cursor:pointer">
          <option value="">— Chọn lớp học —</option>
          ${classes.map(c => `<option value="${c.class_id}" ${c.class_id === defaultClassId ? 'selected' : ''}>${c.class_code} — ${c.class_name}</option>`).join('')}
        </select>
        <select class="form-select" id="att-session-filter" style="flex:1;min-width:240px;height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none;cursor:pointer">
          <option value="">— Chọn buổi học —</option>
          ${defaultSessions.map(s => `<option value="${s.session_id}" ${s.session_id === defaultSessionId ? 'selected' : ''}>Buổi ${s.session_number} — ${formatDate(s.date)}${s.is_completed ? ' (Đã điểm danh)' : ' (Chưa điểm danh)'}</option>`).join('')}
        </select>
        <input type="date" class="form-input" id="att-date-filter" style="max-width:180px;height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none" placeholder="Lọc theo ngày">
      </div>

      <!-- 4. Thẻ Bảng Điểm Danh (Bento Table Card) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;overflow:hidden;box-shadow:0 3px 12px rgba(45,40,36,0.03);margin-bottom:24px">
        <div style="background:#FAF5EE;padding:16px 24px;border-bottom:1px solid #EAE4D8;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <span style="font-weight:800;font-size:15px;color:#2D2824;display:flex;align-items:center;gap:8px" id="att-table-title">
            <span>📝</span> Bảng điểm danh học viên
          </span>
          <span id="att-student-count" style="font-size:12.5px;font-weight:700;color:#7F7A72;background:#FFFFFF;padding:4px 12px;border-radius:9999px;border:1px solid #EAE4D8"></span>
        </div>
        <div style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left" id="attendance-table">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em;background:#FFFDF9">
                <th style="padding:12px 16px">HỌC VIÊN</th>
                <th style="padding:12px 16px">MÃ HV</th>
                <th style="padding:12px 16px">TRẠNG THÁI</th>
                <th style="padding:12px 16px">GHI NHẬN LÚC</th>
                <th style="padding:12px 16px">GHI CHÚ</th>
                <th style="padding:12px 16px;width:130px;text-align:center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody id="attendance-tbody">
              ${defaultClassId && defaultSessionId
                ? renderAttendanceRows(defaultClassId, defaultSessionId)
                : `<tr><td colspan="6" style="padding:48px 16px;text-align:center"><div style="font-size:36px;margin-bottom:8px">📋</div><p style="margin:0;color:#7F7A72;font-size:14px;font-weight:600">Chọn lớp và buổi học để xem danh sách điểm danh</p></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5. Khối tổng hợp điểm danh -->
      <div id="attendance-summary">
        ${defaultClassId ? renderClassSummarySection(defaultClassId) : ''}
      </div>

    </div>
  `;
}

// === Init ===

export function initAttendancePage(): void {
  const classFilter = document.getElementById('att-class-filter') as HTMLSelectElement | null;
  const sessionFilter = document.getElementById('att-session-filter') as HTMLSelectElement | null;
  const dateFilter = document.getElementById('att-date-filter') as HTMLInputElement | null;
  const tbody = document.getElementById('attendance-tbody');
  const countEl = document.getElementById('att-student-count');
  const titleEl = document.getElementById('att-table-title');
  const summaryEl = document.getElementById('attendance-summary');

  function updateTable() {
    const classId = classFilter?.value ?? '';
    const sessionId = sessionFilter?.value ?? '';

    if (!classId || !sessionId) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:48px 16px;text-align:center"><div style="font-size:36px;margin-bottom:8px">📋</div><p style="margin:0;color:#7F7A72;font-size:14px;font-weight:600">Chọn lớp và buổi học để xem danh sách điểm danh</p></td></tr>`;
      }
      if (countEl) countEl.textContent = '';
      return;
    }

    const students = getEnrolledStudents(classId);
    const session = sessionData.find(s => s.session_id === sessionId);
    const cls = classData.find(c => c.class_id === classId);

    if (tbody) {
      tbody.innerHTML = renderAttendanceRows(classId, sessionId);
    }
    if (countEl) {
      countEl.textContent = `${students.length} học viên`;
    }
    if (titleEl && cls && session) {
      titleEl.innerHTML = `<span>📝</span> Điểm danh — ${cls.class_code} — Buổi ${session.session_number} (${formatDate(session.date)})`;
    }

    // Re-bind action buttons
    bindMarkStatusButtons();
  }

  function updateSummary() {
    const classId = classFilter?.value ?? '';
    if (summaryEl) {
      summaryEl.innerHTML = classId ? renderClassSummarySection(classId) : '';
    }
  }

  function populateSessions() {
    const classId = classFilter?.value ?? '';
    if (!sessionFilter) return;

    const sessions = classId ? getSessionsForClass(classId) : [];
    const dateFilterValue = dateFilter?.value ?? '';

    // Optionally filter sessions by date
    let filteredSessions = sessions;
    if (dateFilterValue) {
      filteredSessions = sessions.filter(s => s.date === dateFilterValue);
    }

    sessionFilter.innerHTML = `<option value="">— Chọn buổi học —</option>` +
      filteredSessions.map(s =>
        `<option value="${s.session_id}">Buổi ${s.session_number} — ${formatDate(s.date)}${s.is_completed ? ' (Đã điểm danh)' : ' (Chưa điểm danh)'}</option>`
      ).join('');

    // Auto-select last session
    if (filteredSessions.length > 0) {
      sessionFilter.value = filteredSessions[filteredSessions.length - 1].session_id;
    }
  }

  function bindMarkStatusButtons() {
    document.querySelectorAll('.btn-mark-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const el = btn as HTMLElement;
        const studentId = el.dataset.student;
        const newStatus = el.dataset.status as AttendanceStatus;
        const classId = classFilter?.value ?? '';
        const sessionId = sessionFilter?.value ?? '';

        if (!studentId || !classId || !sessionId || !newStatus) return;

        let record = attendanceData.find(a => a.student_id === studentId && a.class_id === classId && a.session_id === sessionId);
        if (record) {
          record.status = newStatus;
          record.recorded_at = new Date().toISOString();
        } else {
          attendanceData.push({
            attendance_id: `ATT-${studentId}-${sessionId}`,
            student_id: studentId,
            class_id: classId,
            session_id: sessionId,
            status: newStatus,
            recorded_at: new Date().toISOString(),
            recorded_by: 'STF001',
          });
        }

        // Tự động chốt buổi học hoàn thành & cập nhật tiến độ lớp (UC-08)
        const session = sessionData.find(s => s.session_id === sessionId);
        if (session && !session.is_completed) {
          session.is_completed = true;
          const cls = classData.find(c => c.class_id === classId);
          if (cls) {
            cls.completed_sessions = sessionData.filter(s => s.class_id === classId && s.is_completed).length;
          }
        }

        updateTable();
        updateSummary();
        showToast(`Đã cập nhật trạng thái: ${attendanceLabels[newStatus]}`, 'success');
      });
    });
  }

  // Event listeners
  classFilter?.addEventListener('change', () => {
    populateSessions();
    updateTable();
    updateSummary();
  });

  sessionFilter?.addEventListener('change', () => {
    updateTable();
  });

  dateFilter?.addEventListener('change', () => {
    populateSessions();
    updateTable();
  });

  // Mark all present button
  const markAllBtn = document.getElementById('btn-mark-all-present');
  markAllBtn?.addEventListener('click', () => {
    const classId = classFilter?.value ?? '';
    const sessionId = sessionFilter?.value ?? '';
    if (!classId || !sessionId) {
      showToast('Vui lòng chọn lớp học và buổi học trước', 'warning');
      return;
    }

    const students = getEnrolledStudents(classId);
    students.forEach(s => {
      let record = attendanceData.find(a => a.student_id === s.student_id && a.class_id === classId && a.session_id === sessionId);
      if (record) {
        record.status = 'present';
        record.recorded_at = new Date().toISOString();
      } else {
        attendanceData.push({
          attendance_id: `ATT-${s.student_id}-${sessionId}`,
          student_id: s.student_id,
          class_id: classId,
          session_id: sessionId,
          status: 'present',
          recorded_at: new Date().toISOString(),
          recorded_by: 'STF001',
        });
      }
    });

    // Tự động chốt buổi học hoàn thành & cập nhật tiến độ lớp (UC-08)
    const session = sessionData.find(s => s.session_id === sessionId);
    if (session && !session.is_completed) {
      session.is_completed = true;
      const cls = classData.find(c => c.class_id === classId);
      if (cls) {
        cls.completed_sessions = sessionData.filter(s => s.class_id === classId && s.is_completed).length;
      }
    }

    updateTable();
    updateSummary();
    showToast(`Đã điểm danh Có mặt cho toàn bộ ${students.length} học viên!`, 'success');
  });

  // Export button
  const exportBtn = document.getElementById('btn-export-attendance');
  exportBtn?.addEventListener('click', () => {
    const classId = classFilter?.value ?? '';
    const sessionId = sessionFilter?.value ?? '';
    if (!classId) {
      showToast('Vui lòng chọn lớp học trước khi xuất', 'warning');
      return;
    }

    const cls = classData.find(c => c.class_id === classId);
    const session = sessionData.find(s => s.session_id === sessionId);
    const students = getEnrolledStudents(classId);

    let csvContent = 'Mã học viên,Họ và tên,Lớp,Buổi học,Trạng thái\n';
    students.forEach(s => {
      const rec = attendanceData.find(a => a.student_id === s.student_id && a.class_id === classId && (sessionId ? a.session_id === sessionId : true));
      const status = rec ? attendanceLabels[rec.status] : 'Chưa điểm danh';
      csvContent += `"${s.student_code}","${s.full_name}","${cls?.class_code ?? classId}","${session ? 'Buổi ' + session.session_number : 'Tổng hợp'}","${status}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DiemDanh_${cls?.class_code ?? classId}_${session ? 'Buoi' + session.session_number : 'TongHop'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file điểm danh CSV!', 'success');
  });

  // Initial bind for action buttons
  bindMarkStatusButtons();

  // Set initial count
  const classId = classFilter?.value ?? '';
  const sessionId = sessionFilter?.value ?? '';
  if (classId && sessionId) {
    const students = getEnrolledStudents(classId);
    if (countEl) countEl.textContent = `${students.length} học viên`;
    const session = sessionData.find(s => s.session_id === sessionId);
    const cls = classData.find(c => c.class_id === classId);
    if (titleEl && cls && session) {
      titleEl.innerHTML = `<span>📝</span> Điểm danh — ${cls.class_code} — Buổi ${session.session_number} (${formatDate(session.date)})`;
    }
  }
}
