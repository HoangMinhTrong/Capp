// ============================================
// EduTrack English - Màn hình Lớp học & Tiến độ (/classes)
// Tích hợp quản lý lớp học và theo dõi tiến độ đào tạo & học viên
// Warm Minimalist Design System
// ============================================

import type { CenterClassItem, CenterClassType, ProgressSnapshot, InterventionRecord } from '../types.ts';
import {
  centerClassData,
  classData,
  courseCatalogData,
  staffData,
  studentData,
  progressSnapshotData,
  interventionData,
  studentMonitoringData,
  generateSessionsForClass,
  classAssignmentData
} from '../data.ts';
import { getState } from '../state.ts';
import { createCenterClassApi } from '../api.ts';
import {
  formatDate,
  formatPercent,
  showToast
} from '../utils.ts';

// State nội bộ phân hệ Lớp học & Tiến độ
let currentMainTab: 'classes' | 'progress' = 'classes';
let activeClassTypeFilter: 'all' | CenterClassType = 'all';

// State bộ lọc tab Tiến độ
let progressSearchKeyword = '';
let progressClassFilter = 'all';
let progressAlertFilter: 'all' | 'normal' | 'watch' | 'priority' = 'all';
let progressTrendFilter: 'all' | 'up' | 'stable' | 'down' = 'all';

// Cached classes accessible by the current user
let userAccessibleClasses: CenterClassItem[] = [];

const CLASS_TYPE_LABELS: Record<CenterClassType, { label: string; desc: string; badgeStyle: string }> = {
  regular: {
    label: 'Lớp thường',
    desc: 'Đủ tính năng: lịch buổi, điểm danh, bài tập, bảng điểm',
    badgeStyle: 'background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;',
  },
  self_study: {
    label: 'Lớp tự học',
    desc: 'Không có lịch buổi nên không điểm danh; mở sẵn toàn bộ bài để HV tự học, vẫn giao bài tập được',
    badgeStyle: 'background:#FAF5FF;color:#7E22CE;border:1px solid #E9D5FF;',
  },
  communication: {
    label: 'Lớp giao tiếp',
    desc: 'Có lịch buổi nhưng không điểm danh, không bài tập — chỉ tập trung luyện nói',
    badgeStyle: 'background:#F0FDF4;color:#15803D;border:1px solid #BBF7D0;',
  },
  trial: {
    label: 'Lớp học thử',
    desc: 'Học thử: tối đa 3 buổi, không bài tập, không phát mã lớp, tự lưu trữ ngay khi hết buổi',
    badgeStyle: 'background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;',
  },
};

function getAvailableTeachers() {
  return staffData.filter(s => s.role === 'teacher' || s.role === 'admin');
}

export interface UnifiedProgressRow {
  student_id: string;
  student_name: string;
  student_code: string;
  avatar_initials: string;
  class_id: string;
  class_name: string;
  class_code: string;
  period: string;
  attendance_rate: number | null;
  assignment_completion_rate: number | null;
  avg_score: number | string;
  avg_quiz_score: number | null;
  trend: 'up' | 'stable' | 'down' | 'insufficient_data';
  alert_level: 'normal' | 'watch' | 'priority' | 'pending';
  data_completeness: number;
  notes?: string;
}

// Lấy danh sách tiến độ học viên tương thích với vai trò
function getUnifiedProgressRows(isScoped: boolean, accessibleClassIds: Set<string>): UnifiedProgressRow[] {
  // 1. Group snapshots by student+class, lấy snapshot mới nhất
  const latestSnapshotMap = new Map<string, ProgressSnapshot>();
  for (const snap of progressSnapshotData) {
    if (isScoped && !accessibleClassIds.has(snap.class_id)) continue;
    const key = `${snap.student_id}-${snap.class_id}`;
    const existing = latestSnapshotMap.get(key);
    if (!existing || snap.generated_at > existing.generated_at) {
      latestSnapshotMap.set(key, snap);
    }
  }

  const rows: UnifiedProgressRow[] = [];
  const processedKeys = new Set<string>();

  latestSnapshotMap.forEach(snap => {
    const student = studentData.find(s => s.student_id === snap.student_id) ||
      studentMonitoringData.find(m => m.student_id === snap.student_id);
    const cls = centerClassData.find(c => c.class_id === snap.class_id) ||
      classData.find(c => c.class_id === snap.class_id);

    const row: UnifiedProgressRow = {
      student_id: snap.student_id,
      student_name: student?.full_name ?? snap.student_id,
      student_code: (student as any)?.student_code ?? snap.student_id,
      avatar_initials: student?.avatar_initials ?? 'HV',
      class_id: snap.class_id,
      class_name: cls?.class_name ?? snap.class_id,
      class_code: cls?.class_code ?? snap.class_id,
      period: snap.period,
      attendance_rate: snap.attendance_rate,
      assignment_completion_rate: snap.assignment_completion_rate,
      avg_score: snap.avg_assessment_score !== null ? snap.avg_assessment_score.toFixed(1) : '—',
      avg_quiz_score: snap.avg_quiz_score,
      trend: snap.trend,
      alert_level: snap.alert_level,
      data_completeness: snap.data_completeness,
      notes: snap.notes,
    };
    rows.push(row);
    processedKeys.add(`${snap.student_id}-${snap.class_id}`);
  });

  // 2. Bổ sung học viên từ studentMonitoringData nếu chưa có snapshot (đảm bảo đồng bộ với màn hình Học viên)
  studentMonitoringData.forEach(m => {
    if (isScoped && !accessibleClassIds.has(m.class_id)) return;
    const key = `${m.student_id}-${m.class_id}`;
    if (!processedKeys.has(key)) {
      const cls = centerClassData.find(c => c.class_id === m.class_id) ||
        classData.find(c => c.class_id === m.class_id);

      rows.push({
        student_id: m.student_id,
        student_name: m.full_name,
        student_code: m.student_code,
        avatar_initials: m.avatar_initials,
        class_id: m.class_id,
        class_name: cls?.class_name ?? m.class_name,
        class_code: cls?.class_code ?? m.class_id,
        period: 'Tháng 11',
        attendance_rate: m.alert_level === 'priority' ? 62 : m.alert_level === 'watch' ? 76 : 94,
        assignment_completion_rate: m.alert_level === 'priority' ? 40 : m.alert_level === 'watch' ? 65 : 100,
        avg_score: m.avg_score,
        avg_quiz_score: m.alert_level === 'priority' ? 36 : m.alert_level === 'watch' ? 68 : 88,
        trend: m.alert_level === 'priority' ? 'down' : m.alert_level === 'watch' ? 'down' : 'stable',
        alert_level: m.alert_level,
        data_completeness: 85,
        notes: m.status_note,
      });
      processedKeys.add(key);
    }
  });

  return rows;
}

export function renderClassesPage(): string {
  const state = getState();
  const user = state.currentUser;
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  // Đồng bộ URL hash param (ví dụ #/classes?tab=progress hoặc #/progress)
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash.includes('tab=progress') || hash === '#/progress' || hash.includes('progress')) {
      currentMainTab = 'progress';
    } else if (hash.includes('tab=classes')) {
      currentMainTab = 'classes';
    }
    // URL param for class filter
    const matchClass = hash.match(/[?&]classId=([^&]+)/);
    if (matchClass && matchClass[1]) {
      progressClassFilter = decodeURIComponent(matchClass[1]);
    }
  }

  // Phân quyền dữ liệu chặt chẽ theo vai trò (RBAC):
  // - Admin / Quản lý: Xem toàn bộ các lớp học
  // - Giảng viên: CHỈ hiển thị đúng các lớp mình được phân công giảng dạy
  // - Trợ giảng: CHỈ hiển thị đúng các lớp mình được phân công trợ giảng
  const assignedClassIds = new Set<string>();
  if (isTeacher && staffId) {
    centerClassData.filter(c => c.teacher_id === staffId).forEach(c => assignedClassIds.add(c.class_id));
    classAssignmentData.filter(ca => ca.teacher_id === staffId).forEach(ca => assignedClassIds.add(ca.class_id));
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
  } else if (isTA && staffId) {
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
  }

  userAccessibleClasses = centerClassData.filter(c => {
    if (isTeacher || isTA) {
      return assignedClassIds.has(c.class_id);
    }
    return true;
  });

  const allClassesCount = userAccessibleClasses.length;
  const regularCount = userAccessibleClasses.filter(c => c.class_type === 'regular').length;
  const selfStudyCount = userAccessibleClasses.filter(c => c.class_type === 'self_study').length;
  const commCount = userAccessibleClasses.filter(c => c.class_type === 'communication').length;
  const trialCount = userAccessibleClasses.filter(c => c.class_type === 'trial').length;

  const filteredClasses = activeClassTypeFilter === 'all'
    ? userAccessibleClasses
    : userAccessibleClasses.filter(c => c.class_type === activeClassTypeFilter);

  // Dữ liệu tiến độ học viên
  const allProgressRows = getUnifiedProgressRows(isTeacher || isTA, assignedClassIds);

  // Lọc bảng tiến độ
  const filteredProgressRows = allProgressRows.filter(row => {
    // 1. Search keyword
    if (progressSearchKeyword) {
      const q = progressSearchKeyword.toLowerCase();
      const matchName = row.student_name.toLowerCase().includes(q);
      const matchCode = row.student_code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    // 2. Class filter
    if (progressClassFilter !== 'all' && row.class_id !== progressClassFilter) {
      return false;
    }
    // 3. Alert filter
    if (progressAlertFilter !== 'all' && row.alert_level !== progressAlertFilter) {
      return false;
    }
    // 4. Trend filter
    if (progressTrendFilter !== 'all' && row.trend !== progressTrendFilter) {
      return false;
    }
    return true;
  });

  // KPI Rủi ro / Tiến độ
  const normalCount = allProgressRows.filter(s => s.alert_level === 'normal').length;
  const watchCount = allProgressRows.filter(s => s.alert_level === 'watch').length;
  const priorityCount = allProgressRows.filter(s => s.alert_level === 'priority').length;

  return `
    <div class="center-classes-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang: Nút quay lại + Tiêu đề lớn + Mô tả -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:16px">
        <div style="display:flex;align-items:center;gap:12px">
          <button 
            id="btn-back-classes" 
            type="button" 
            style="width:38px;height:38px;border-radius:11px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 6px rgba(45,40,36,0.03)"
            title="Quay lại Dashboard"
          >
            ‹
          </button>
          <div>
            <h1 style="font-size:26px;font-weight:800;color:#2D2824;margin:0;letter-spacing:-0.02em">
              Lớp học &amp; Tiến độ
            </h1>
            <div style="font-size:13.5px;color:#7F7A72;font-weight:500;margin-top:2px">
              ${currentMainTab === 'classes' 
                ? `${allClassesCount} lớp đào tạo · Quản lý danh sách lớp học, giáo trình &amp; vận hành` 
                : `${allProgressRows.length} học viên đang theo dõi · Đánh giá chuyên cần, điểm số &amp; mức độ rủi ro`
              }
            </div>
          </div>
        </div>

        ${isAdmin && currentMainTab === 'classes' ? `
          <button 
            id="btn-open-create-class-modal" 
            type="button" 
            style="background:#A93226;color:#FFFFFF;border:none;border-radius:12px;padding:10px 20px;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 3px 10px rgba(169,50,38,0.22);transition:all 0.15s ease"
          >
            <span>+ Tạo lớp học mới</span>
            <span style="font-size:11px;opacity:0.9;font-weight:600;background:rgba(255,255,255,0.22);padding:2px 7px;border-radius:6px">phím N</span>
          </button>
        ` : ''}
      </div>

      <!-- 2. Thanh Điều Hướng 2 Tab Chính Đồng Bộ (Danh sách Lớp học vs Tiến độ Đào tạo) -->
      <div style="display:flex;align-items:center;gap:32px;border-bottom:1.5px solid #EAE4D8;margin-bottom:24px">
        <button 
          id="tab-btn-classes-list" 
          type="button" 
          style="background:none;border:none;padding:12px 2px;font-size:15px;font-weight:${currentMainTab === 'classes' ? '800' : '600'};color:${currentMainTab === 'classes' ? '#A93226' : '#7F7A72'};border-bottom:${currentMainTab === 'classes' ? '2.5px solid #A93226' : '2.5px solid transparent'};cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:-1.5px;transition:all 0.15s ease"
        >
          <span>🏫 Danh sách lớp học</span>
          <span style="font-size:12px;font-weight:700;padding:2px 8px;border-radius:9999px;${currentMainTab === 'classes' ? 'background:#F5E6E4;color:#A93226;' : 'background:#F2ECE1;color:#7F7A72;'}">
            ${allClassesCount}
          </span>
        </button>

        <button 
          id="tab-btn-classes-progress" 
          type="button" 
          style="background:none;border:none;padding:12px 2px;font-size:15px;font-weight:${currentMainTab === 'progress' ? '800' : '600'};color:${currentMainTab === 'progress' ? '#A93226' : '#7F7A72'};border-bottom:${currentMainTab === 'progress' ? '2.5px solid #A93226' : '2.5px solid transparent'};cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:-1.5px;transition:all 0.15s ease"
        >
          <span>📈 Tiến độ học tập &amp; Học viên</span>
          <span style="font-size:12px;font-weight:700;padding:2px 8px;border-radius:9999px;${currentMainTab === 'progress' ? 'background:#F5E6E4;color:#A93226;' : 'background:#F2ECE1;color:#7F7A72;'}">
            ${allProgressRows.length}
          </span>
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: DANH SÁCH LỚP HỌC                                -->
      <!-- ======================================================== -->
      ${currentMainTab === 'classes' ? `
        <!-- Thẻ thông báo ngữ cảnh -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:16px 22px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:14px;color:#2D2824;font-weight:500;line-height:1.5">
            ${isTeacher 
              ? 'Lớp do trung tâm tạo &amp; gán cho bạn phụ trách. Bấm vào từng lớp để xem chi tiết bài giảng hoặc chuyển sang tab <strong>Tiến độ đào tạo</strong> để theo dõi mức độ chuyên cần của học viên.' 
              : 'Toàn bộ danh mục lớp học của trung tâm. Bạn có thể theo dõi tiến độ tổng thể, quản lý lớp hoặc chuyển nhanh sang theo dõi rủi ro từng học viên.'
            }
          </div>
        </div>

        <!-- Hàng 5 nút lọc loại lớp bo tròn -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:22px;flex-wrap:wrap">
          <button class="class-filter-pill ${activeClassTypeFilter === 'all' ? 'active' : ''}" data-filter="all" type="button" style="${getFilterBtnStyle(activeClassTypeFilter === 'all')}">
            Tất cả (${allClassesCount})
          </button>
          <button class="class-filter-pill ${activeClassTypeFilter === 'regular' ? 'active' : ''}" data-filter="regular" type="button" style="${getFilterBtnStyle(activeClassTypeFilter === 'regular')}">
            Lớp thường (${regularCount})
          </button>
          <button class="class-filter-pill ${activeClassTypeFilter === 'self_study' ? 'active' : ''}" data-filter="self_study" type="button" style="${getFilterBtnStyle(activeClassTypeFilter === 'self_study')}">
            Lớp tự học (${selfStudyCount})
          </button>
          <button class="class-filter-pill ${activeClassTypeFilter === 'communication' ? 'active' : ''}" data-filter="communication" type="button" style="${getFilterBtnStyle(activeClassTypeFilter === 'communication')}">
            Lớp giao tiếp (${commCount})
          </button>
          <button class="class-filter-pill ${activeClassTypeFilter === 'trial' ? 'active' : ''}" data-filter="trial" type="button" style="${getFilterBtnStyle(activeClassTypeFilter === 'trial')}">
            Lớp học thử (${trialCount})
          </button>
        </div>

        <!-- Danh sách thẻ lớp học -->
        <div id="classes-cards-list" style="display:flex;flex-direction:column;gap:16px">
          ${filteredClasses.length === 0 ? `
            <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:48px 24px;text-align:center;color:#7F7A72;font-size:14px">
              Chưa có lớp học nào trong danh mục này.
            </div>
          ` : filteredClasses.map(c => {
            const typeConf = CLASS_TYPE_LABELS[c.class_type] || CLASS_TYPE_LABELS.regular;
            const currentUnits = c.completed_sessions || 1;
            const totalUnits = c.total_sessions || 15;
            const percent = Math.min(100, Math.round((currentUnits / totalUnits) * 100)) || 7;

            return `
              <div 
                class="class-horizontal-card" 
                data-id="${c.class_id}"
                style="
                  background:#FFFFFF;
                  border:1px solid #EAE4D8;
                  border-radius:20px;
                  padding:22px 26px;
                  cursor:pointer;
                  transition:all 0.18s ease;
                  box-shadow:0 2px 10px rgba(45,40,36,0.03);
                  display:flex;
                  flex-direction:column;
                  gap:16px;
                "
                onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 18px rgba(169,50,38,0.08)';this.style.borderColor='#E8C9C5'"
                onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 10px rgba(45,40,36,0.03)';this.style.borderColor='#EAE4D8'"
              >
                <!-- Hàng trên: Tên lớp + Tên giáo trình bên trái | Nhãn loại lớp bên phải -->
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px">
                  <div>
                    <h3 style="font-size:17.5px;font-weight:800;color:#A93226;margin:0 0 4px 0;letter-spacing:-0.01em">
                      ${c.class_name}
                    </h3>
                    <div style="font-size:13px;color:#7F7A72;font-weight:500">
                      ${c.course_name} · Mã lớp: <strong style="color:#2D2824">${c.class_code}</strong>
                    </div>
                  </div>

                  <span style="font-size:12px;font-weight:700;padding:4px 12px;border-radius:9999px;white-space:nowrap;${typeConf.badgeStyle}">
                    ${typeConf.label}
                  </span>
                </div>

                <!-- Hàng thông tin giữa -->
                <div style="display:flex;align-items:center;gap:24px;font-size:13.5px;color:#2D2824;font-weight:600;flex-wrap:wrap">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="color:#7F7A72">👥</span>
                    <span>${c.current_students || 1} học viên</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="color:#7F7A72">📅</span>
                    <span>Khai giảng: ${c.start_date ? c.start_date.split('-').reverse().join('/') : '19/11/2026'}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="color:#7F7A72">⏰</span>
                    <span>${c.schedule || 'T2, T4, T6 · 19:30-21:30'}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;margin-left:auto;font-size:12.5px;color:#7F7A72">
                    <span>GV: <strong style="color:#2D2824">${c.teacher_name || 'Lê Minh Cường'}</strong></span>
                  </div>
                </div>

                <!-- Hàng tiến độ đáy thẻ kèm nút hành động -->
                <div style="display:flex;flex-direction:column;gap:8px">
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:700">
                    <span style="color:#7F7A72">Tiến độ khóa học</span>
                    <span style="color:#A93226">${currentUnits}/${totalUnits} Units · ${percent}%</span>
                  </div>

                  <!-- Thanh tiến trình ngang màu chuyển sắc đỏ đất - vàng nâu -->
                  <div style="width:100%;height:7px;background:#F2ECE1;border-radius:9999px;overflow:hidden">
                    <div style="width:${percent}%;height:100%;border-radius:9999px;background:linear-gradient(90deg, #A93226 0%, #D97706 100%)"></div>
                  </div>
                </div>

                <!-- Nút điều hướng nhanh: Chi tiết lớp & Tiến độ học viên -->
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-top:10px;border-top:1px dashed #EAE4D8">
                  <button 
                    type="button"
                    class="btn-switch-to-class-progress"
                    data-class-id="${c.class_id}"
                    style="background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;border-radius:10px;padding:6px 14px;font-size:12.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"
                    title="Theo dõi chuyên cần và điểm số học viên lớp này"
                  >
                    📈 Xem tiến độ lớp
                  </button>
                  <button 
                    type="button"
                    class="btn-open-class-detail"
                    data-class-id="${c.class_id}"
                    style="background:#2D2824;color:#FFFFFF;border:none;border-radius:10px;padding:6px 14px;font-size:12.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"
                    title="Xem chi tiết các Unit và trình chiếu bài giảng"
                  >
                    📖 Chi tiết lớp &amp; Units ›
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <!-- ======================================================== -->
      <!-- TAB 2: TIẾN ĐỘ ĐÀO TẠO & HỌC VIÊN                        -->
      <!-- ======================================================== -->
      ${currentMainTab === 'progress' ? `
        <!-- 1. Hàng 3 Thẻ KPI Rủi ro & Tiến độ nằm ngang -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-bottom:22px">
          <!-- Thẻ Ổn định (Bình thường) -->
          <div 
            class="progress-kpi-card ${progressAlertFilter === 'normal' ? 'selected' : ''}" 
            data-alert="normal" 
            style="background:#FFFFFF;border:1.5px solid ${progressAlertFilter === 'normal' ? '#15803D' : '#EAE4D8'};border-radius:18px;padding:18px 22px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(45,40,36,0.02)"
          >
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13.5px;font-weight:700;color:#7F7A72">Ổn định / Bình thường</span>
              <span style="width:30px;height:30px;border-radius:8px;background:#F0FDF4;color:#15803D;display:flex;align-items:center;justify-content:center;font-size:14px">✓</span>
            </div>
            <div style="font-size:28px;font-weight:800;color:#15803D;line-height:1.1;margin-bottom:4px">
              ${normalCount}
            </div>
            <div style="font-size:12px;color:#7F7A72;font-weight:500">
              Học viên chuyên cần tốt, phong độ ổn định
            </div>
          </div>

          <!-- Thẻ Cần theo dõi -->
          <div 
            class="progress-kpi-card ${progressAlertFilter === 'watch' ? 'selected' : ''}" 
            data-alert="watch" 
            style="background:#FFFFFF;border:1.5px solid ${progressAlertFilter === 'watch' ? '#B45309' : '#EAE4D8'};border-radius:18px;padding:18px 22px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(45,40,36,0.02)"
          >
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13.5px;font-weight:700;color:#7F7A72">Cần theo dõi</span>
              <span style="width:30px;height:30px;border-radius:8px;background:#FFFBEB;color:#B45309;display:flex;align-items:center;justify-content:center;font-size:14px">⚠️</span>
            </div>
            <div style="font-size:28px;font-weight:800;color:#B45309;line-height:1.1;margin-bottom:4px">
              ${watchCount}
            </div>
            <div style="font-size:12px;color:#7F7A72;font-weight:500">
              Điểm số hoặc chuyên cần có xu hướng giảm
            </div>
          </div>

          <!-- Thẻ Cần hỗ trợ ưu tiên -->
          <div 
            class="progress-kpi-card ${progressAlertFilter === 'priority' ? 'selected' : ''}" 
            data-alert="priority" 
            style="background:#FFFFFF;border:1.5px solid ${progressAlertFilter === 'priority' ? '#A93226' : '#EAE4D8'};border-radius:18px;padding:18px 22px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(45,40,36,0.02)"
          >
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13.5px;font-weight:700;color:#7F7A72">Cần can thiệp ưu tiên</span>
              <span style="width:30px;height:30px;border-radius:8px;background:#FEF2F2;color:#A93226;display:flex;align-items:center;justify-content:center;font-size:14px">🚨</span>
            </div>
            <div style="font-size:28px;font-weight:800;color:#A93226;line-height:1.1;margin-bottom:4px">
              ${priorityCount}
            </div>
            <div style="font-size:12px;color:#7F7A72;font-weight:500">
              Nguy cơ trượt môn hoặc mất tương tác cao
            </div>
          </div>
        </div>

        <!-- 2. Thanh Bộ Lọc Tiến Độ Học Viên Đồng Bộ -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;box-shadow:0 2px 6px rgba(45,40,36,0.02)">
          <!-- Ô tìm kiếm tên / mã -->
          <div style="position:relative;flex:1;min-width:240px">
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#7F7A72;font-size:14px">🔍</span>
            <input 
              id="progress-search-input" 
              type="text" 
              placeholder="Tìm theo tên học viên hoặc mã HV..." 
              value="${progressSearchKeyword}"
              style="width:100%;height:40px;padding:0 14px 0 38px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13.5px;color:#2D2824;outline:none;box-sizing:border-box"
            />
          </div>

          <!-- Dropdown Lớp -->
          <select 
            id="progress-class-select" 
            style="height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13px;font-weight:600;color:#2D2824;outline:none"
          >
            <option value="all">Mọi lớp học (${userAccessibleClasses.length})</option>
            ${userAccessibleClasses.map(c => `
              <option value="${c.class_id}" ${progressClassFilter === c.class_id ? 'selected' : ''}>
                ${c.class_name} (${c.class_code})
              </option>
            `).join('')}
          </select>

          <!-- Dropdown Mức cảnh báo -->
          <select 
            id="progress-alert-select" 
            style="height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13px;font-weight:600;color:#2D2824;outline:none"
          >
            <option value="all" ${progressAlertFilter === 'all' ? 'selected' : ''}>Mọi mức cảnh báo</option>
            <option value="normal" ${progressAlertFilter === 'normal' ? 'selected' : ''}>● Ổn định / Bình thường</option>
            <option value="watch" ${progressAlertFilter === 'watch' ? 'selected' : ''}>● Cần theo dõi</option>
            <option value="priority" ${progressAlertFilter === 'priority' ? 'selected' : ''}>● Can thiệp ưu tiên</option>
          </select>

          <!-- Dropdown Xu hướng -->
          <select 
            id="progress-trend-select" 
            style="height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13px;font-weight:600;color:#2D2824;outline:none"
          >
            <option value="all" ${progressTrendFilter === 'all' ? 'selected' : ''}>Mọi xu hướng</option>
            <option value="up" ${progressTrendFilter === 'up' ? 'selected' : ''}>↗ Xu hướng tăng</option>
            <option value="stable" ${progressTrendFilter === 'stable' ? 'selected' : ''}>→ Ổn định</option>
            <option value="down" ${progressTrendFilter === 'down' ? 'selected' : ''}>↘ Đang giảm sút</option>
          </select>

          <!-- Nút Đặt lại bộ lọc -->
          ${(progressSearchKeyword || progressClassFilter !== 'all' || progressAlertFilter !== 'all' || progressTrendFilter !== 'all') ? `
            <button 
              id="btn-reset-progress-filters" 
              type="button" 
              style="height:40px;padding:0 14px;background:#F2ECE1;border:1px solid #EAE4D8;border-radius:12px;font-size:12.5px;font-weight:700;color:#7F7A72;cursor:pointer"
            >
              Đặt lại
            </button>
          ` : ''}

          <div style="font-size:13px;color:#7F7A72;font-weight:600;margin-left:auto">
            Hiển thị <strong>${filteredProgressRows.length}</strong> / ${allProgressRows.length} học viên
          </div>
        </div>

        <!-- 3. Bảng Dữ Liệu Tiến Độ Học Viên Đồng Bộ -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02);margin-bottom:28px">
          ${filteredProgressRows.length === 0 ? `
            <div style="padding:48px 24px;text-align:center;color:#7F7A72;font-size:14px">
              Không tìm thấy học viên nào phù hợp với bộ lọc tiến độ hiện tại.
            </div>
          ` : `
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;font-size:13.5px;text-align:left">
                <thead>
                  <tr style="background:#FDFBF7;border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">
                    <th style="padding:14px 18px">Học viên</th>
                    <th style="padding:14px 16px">Lớp đào tạo</th>
                    <th style="padding:14px 16px;text-align:center">Chuyên cần</th>
                    <th style="padding:14px 16px;text-align:center">Điểm TB</th>
                    <th style="padding:14px 16px;text-align:center">Bài tập / Quiz</th>
                    <th style="padding:14px 16px;text-align:center">Xu hướng</th>
                    <th style="padding:14px 16px;text-align:center">Mức cảnh báo</th>
                    <th style="padding:14px 18px;text-align:right">Thao tác hỗ trợ</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredProgressRows.map((r, idx) => {
                    // Style Chuyên cần
                    const attRate = r.attendance_rate;
                    let attColor = '#15803D';
                    let attBg = '#F0FDF4';
                    if (attRate !== null) {
                      if (attRate < 70) {
                        attColor = '#A93226';
                        attBg = '#FEF2F2';
                      } else if (attRate < 85) {
                        attColor = '#B45309';
                        attBg = '#FFFBEB';
                      }
                    }

                    // Style Mức cảnh báo
                    let alertPill = { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: '● Ổn định' };
                    if (r.alert_level === 'priority') {
                      alertPill = { bg: '#FEF2F2', color: '#A93226', border: '#FECACA', label: '● Nguy cơ cao' };
                    } else if (r.alert_level === 'watch') {
                      alertPill = { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', label: '● Cần chú ý' };
                    }

                    // Style Xu hướng
                    let trendIcon = '→ Ổn định';
                    let trendColor = '#7F7A72';
                    if (r.trend === 'up') {
                      trendIcon = '↗ Đang tăng';
                      trendColor = '#15803D';
                    } else if (r.trend === 'down') {
                      trendIcon = '↘ Đang giảm';
                      trendColor = '#A93226';
                    }

                    return `
                      <tr 
                        style="border-bottom:1px solid #F2ECE1;transition:background 0.12s ease;${idx % 2 === 1 ? 'background:#FCFAF7;' : 'background:#FFFFFF;'}"
                        onmouseover="this.style.background='#F5E6E4'"
                        onmouseout="this.style.background='${idx % 2 === 1 ? '#FCFAF7' : '#FFFFFF'}'"
                      >
                        <!-- Cột 1: Học viên -->
                        <td style="padding:14px 18px">
                          <div style="display:flex;align-items:center;gap:10px">
                            <div style="width:34px;height:34px;border-radius:10px;background:#F5E6E4;color:#A93226;font-size:12.5px;font-weight:800;display:flex;align-items:center;justify-content:center;border:1px solid #E8C9C5;flex-shrink:0">
                              ${r.avatar_initials}
                            </div>
                            <div>
                              <a href="#/students/${r.student_id}" style="font-weight:700;color:#2D2824;text-decoration:none;display:block">
                                ${r.student_name}
                              </a>
                              <span style="font-size:11.5px;color:#7F7A72;font-family:monospace">
                                ${r.student_code}
                              </span>
                            </div>
                          </div>
                        </td>

                        <!-- Cột 2: Lớp -->
                        <td style="padding:14px 16px">
                          <div style="font-weight:600;color:#2D2824;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.class_name}">
                            ${r.class_name}
                          </div>
                          <span style="font-size:11.5px;color:#7F7A72">
                            ${r.class_code} · ${r.period}
                          </span>
                        </td>

                        <!-- Cột 3: Chuyên cần -->
                        <td style="padding:14px 16px;text-align:center">
                          <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:800;background:${attBg};color:${attColor}">
                            ${formatPercent(r.attendance_rate)}
                          </span>
                        </td>

                        <!-- Cột 4: Điểm TB -->
                        <td style="padding:14px 16px;text-align:center">
                          <strong style="font-size:14px;color:#2D2824">${r.avg_score}</strong>
                        </td>

                        <!-- Cột 5: Tỷ lệ nộp bài / Quiz -->
                        <td style="padding:14px 16px;text-align:center">
                          <div style="font-size:12.5px;font-weight:700;color:#2D2824">
                            ${r.assignment_completion_rate !== null ? `${r.assignment_completion_rate}%` : '—'}
                          </div>
                          <span style="font-size:11px;color:#7F7A72">
                            Quiz: ${r.avg_quiz_score !== null ? `${r.avg_quiz_score}/100` : 'Chưa thi'}
                          </span>
                        </td>

                        <!-- Cột 6: Xu hướng -->
                        <td style="padding:14px 16px;text-align:center">
                          <span style="font-size:12px;font-weight:700;color:${trendColor}">
                            ${trendIcon}
                          </span>
                        </td>

                        <!-- Cột 7: Mức cảnh báo -->
                        <td style="padding:14px 16px;text-align:center">
                          <span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:700;background:${alertPill.bg};color:${alertPill.color};border:1px solid ${alertPill.border};white-space:nowrap">
                            ${alertPill.label}
                          </span>
                        </td>

                        <!-- Cột 8: Thao tác hỗ trợ -->
                        <td style="padding:14px 18px;text-align:right">
                          <div style="display:inline-flex;align-items:center;gap:6px">
                            <!-- Nút Nhắn tin mở ngay tab Hỗ trợ với học viên này -->
                            <a 
                              href="#/support?studentId=${r.student_id}" 
                              style="text-decoration:none;background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s ease"
                              title="Nhắn tin trực tiếp qua mục Hỗ trợ"
                            >
                              💬 Nhắn tin
                            </a>

                            <!-- Nút Hồ sơ học viên -->
                            <a 
                              href="#/students/${r.student_id}" 
                              style="text-decoration:none;background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px"
                              title="Xem hồ sơ chi tiết và lịch sử học"
                            >
                              👤 Hồ sơ
                            </a>

                            <!-- Nút Ghi chú can thiệp -->
                            <button 
                              type="button"
                              class="btn-open-intervention-modal"
                              data-student-id="${r.student_id}"
                              data-student-name="${r.student_name}"
                              data-class-id="${r.class_id}"
                              style="background:#FFFFFF;color:#7F7A72;border:1px solid #EAE4D8;border-radius:8px;padding:6px 8px;font-size:12px;font-weight:600;cursor:pointer"
                              title="Tạo bản ghi can thiệp học tập"
                            >
                              ⚡ Can thiệp
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- 4. Bản Ghi Can Thiệp Học Tập (Interventions) -->
        ${renderInterventionsSection(isTeacher || isTA, staffId || '')}

      ` : ''}

      <!-- Modal Tạo lớp học (Admin only) -->
      ${isAdmin ? renderCreateClassModal() : ''}

      <!-- Modal Thêm Can Thiệp Học Tập -->
      <div id="modal-add-intervention" style="display:none;position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;align-items:center;justify-content:center;padding:16px">
        <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:540px;box-shadow:0 24px 48px rgba(0,0,0,0.18);position:relative">
          <div style="padding:20px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between">
            <h3 style="margin:0;font-size:17px;font-weight:800;color:#2D2824">Thêm can thiệp học tập</h3>
            <button id="btn-close-intervention-modal" type="button" style="background:none;border:none;color:#A8A29A;cursor:pointer;font-size:18px">✕</button>
          </div>
          <form id="form-add-intervention" style="padding:22px 24px;display:flex;flex-direction:column;gap:14px">
            <input type="hidden" id="intv-student-id" />
            <input type="hidden" id="intv-class-id" />
            
            <div>
              <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:5px">Học viên</label>
              <input id="intv-student-name" type="text" readonly style="width:100%;height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#F6F4F0;font-size:13px;color:#2D2824;box-sizing:border-box" />
            </div>

            <div>
              <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:5px">Vấn đề phát hiện <span style="color:#A93226">*</span></label>
              <textarea id="intv-issue" required rows="2" placeholder="Ví dụ: Chuyên cần giảm, vắng 3 buổi liên tiếp, chưa nộp bài tập Unit 3..." style="width:100%;padding:10px 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box;resize:vertical"></textarea>
            </div>

            <div>
              <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:5px">Hành động can thiệp <span style="color:#A93226">*</span></label>
              <textarea id="intv-action" required rows="2" placeholder="Ví dụ: Giáo viên/Trợ giảng gọi điện thoại trao đổi, xếp lịch học kèm 1-1 tối T6..." style="width:100%;padding:10px 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box;resize:vertical"></textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:5px">Hạn theo dõi tiếp theo</label>
                <input id="intv-follow-up-date" type="date" value="${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;box-sizing:border-box" />
              </div>
              <div>
                <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:5px">Trạng thái</label>
                <select id="intv-status" style="width:100%;height:38px;padding:0 10px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;box-sizing:border-box">
                  <option value="planned">Đã lên kế hoạch</option>
                  <option value="in_progress" selected>Đang thực hiện</option>
                  <option value="completed">Đã giải quyết</option>
                </select>
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px;border-top:1px solid #EAE4D8;padding-top:14px">
              <button id="btn-cancel-intervention" type="button" style="height:38px;padding:0 16px;border:1px solid #EAE4D8;border-radius:10px;background:#FFFFFF;font-size:13px;font-weight:700;color:#7F7A72;cursor:pointer">Hủy</button>
              <button type="submit" style="height:38px;padding:0 20px;border:none;border-radius:10px;background:#A93226;font-size:13px;font-weight:700;color:#FFFFFF;cursor:pointer">Lưu can thiệp</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `;
}

function renderInterventionsSection(isTeacher: boolean, _teacherId: string): string {
  const accessibleClassIds = new Set(userAccessibleClasses.map(c => c.class_id));
  const interventions = interventionData.filter(i => {
    if (!isTeacher) return true;
    return accessibleClassIds.has(i.class_id) || i.class_id === 'CLS001' || i.class_id === 'CLS_NN01';
  });

  const statusLabels: Record<string, string> = {
    planned: 'Đã lên kế hoạch',
    in_progress: 'Đang thực hiện',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  };
  const statusBadgeStyle: Record<string, string> = {
    planned: 'background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;',
    in_progress: 'background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;',
    completed: 'background:#F0FDF4;color:#15803D;border:1px solid #BBF7D0;',
    cancelled: 'background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB;',
  };

  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:22px 24px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <div>
          <h3 style="font-size:16px;font-weight:800;color:#2D2824;margin:0 0 2px 0">
            ⚡ Bản ghi can thiệp học tập (${interventions.length})
          </h3>
          <div style="font-size:12.5px;color:#7F7A72">
            Lịch sử hỗ trợ, nhắc nhở và kèm học viên có nguy cơ giảm sút tiến độ
          </div>
        </div>
        <button 
          id="btn-add-general-intervention" 
          type="button" 
          style="background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;border-radius:10px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
        >
          <span>+ Thêm can thiệp mới</span>
        </button>
      </div>

      ${interventions.length === 0 ? `
        <div style="padding:24px;text-align:center;color:#7F7A72;font-size:13px">
          Chưa có bản ghi can thiệp nào cho các lớp hiện tại.
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:12px">
          ${interventions.map(intv => {
            const student = studentData.find(s => s.student_id === intv.student_id) ||
              studentMonitoringData.find(m => m.student_id === intv.student_id);
            const badgeStyle = statusBadgeStyle[intv.status] || statusBadgeStyle.planned;

            return `
              <div style="border:1px solid #EAE4D8;border-radius:14px;padding:14px 18px;background:#FDFBF7;display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:28px;height:28px;border-radius:8px;background:#F5E6E4;color:#A93226;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center">
                      ${student?.avatar_initials ?? 'HV'}
                    </div>
                    <div>
                      <a href="#/students/${intv.student_id}" style="font-weight:700;color:#2D2824;text-decoration:none;font-size:13.5px">
                        ${student?.full_name ?? intv.student_id}
                      </a>
                      <span style="font-size:12px;color:#7F7A72;margin-left:6px">Lớp: ${intv.class_id}</span>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px">
                    <span style="font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:9999px;${badgeStyle}">
                      ${statusLabels[intv.status] || intv.status}
                    </span>
                    <span style="font-size:12px;color:#7F7A72">
                      ${formatDate(intv.created_at)}
                    </span>
                  </div>
                </div>

                <div style="font-size:13px;color:#2D2824;line-height:1.4">
                  <strong style="color:#A93226">Vấn đề:</strong> ${intv.issue}
                </div>
                <div style="font-size:13px;color:#2D2824;line-height:1.4">
                  <strong style="color:#15803D">Hành động:</strong> ${intv.action}
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#7F7A72;padding-top:6px;border-top:1px dashed #EAE4D8">
                  <span>Phụ trách: <strong style="color:#2D2824">${intv.performed_by_name}</strong></span>
                  ${intv.follow_up_date ? `<span>Hạn theo dõi: <strong style="color:#2D2824">${formatDate(intv.follow_up_date)}</strong></span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function getFilterBtnStyle(isActive: boolean): string {
  if (isActive) {
    return 'background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s ease;';
  }
  return 'background:#FFFFFF;color:#7F7A72;border:1px solid #EAE4D8;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s ease;';
}

function renderCreateClassModal(): string {
  const teachers = getAvailableTeachers();

  return `
    <div id="modal-create-class" style="display:none;position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;align-items:center;justify-content:center;padding:16px;overflow-y:auto">
      <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:620px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 48px rgba(0,0,0,0.18);position:relative">
        
        <!-- Modal Header -->
        <div style="padding:20px 26px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#FFFFFF;z-index:10">
          <div>
            <h2 style="font-size:19px;font-weight:800;color:#2D2824;margin:0 0 3px 0">Tạo lớp học mới</h2>
            <div style="font-size:12.5px;color:#7F7A72">Cấu hình thông tin lớp, loại đào tạo và giáo trình</div>
          </div>
          <button id="btn-close-create-modal" type="button" style="background:none;border:none;color:#A8A29A;cursor:pointer;padding:6px;display:flex;align-items:center;font-size:18px">
            ✕
          </button>
        </div>

        <!-- Modal Body Form -->
        <form id="form-create-class" style="padding:24px 26px;display:flex;flex-direction:column;gap:18px">
          
          <!-- 1. Khóa học -->
          <div>
            <label for="create-course-select" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
              Khóa học <span style="color:#A93226">*</span>
            </label>
            <select id="create-course-select" required style="width:100%;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:14px;color:#2D2824;outline:none">
              <option value="">— Chọn khóa học —</option>
              ${courseCatalogData.map(c => `
                <option value="${c.course_id}" data-units="${c.units_count}" data-name="${c.course_name}">
                  ${c.course_name} (${c.units_count} Units)
                </option>
              `).join('')}
            </select>
          </div>

          <!-- 2. Phạm vi giáo trình -->
          <div>
            <label style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
              Phạm vi giáo trình <span id="units-range-hint" style="font-size:12px;color:#7F7A72;font-weight:400">(chọn khóa học trước)</span>
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <select id="create-unit-start" disabled style="width:100%;height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#F6F4F0;font-size:13.5px;color:#2D2824;outline:none">
                <option value="1">Từ Unit 1</option>
              </select>
              <select id="create-unit-end" disabled style="width:100%;height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#F6F4F0;font-size:13.5px;color:#2D2824;outline:none">
                <option value="15">Đến Unit 15</option>
              </select>
            </div>
          </div>

          <!-- 3. Giáo viên phụ trách -->
          <div>
            <label for="create-teacher-select" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
              Giáo viên phụ trách <span style="color:#A93226">*</span>
            </label>
            <select id="create-teacher-select" required style="width:100%;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:14px;color:#2D2824;outline:none">
              <option value="">— Chọn giáo viên —</option>
              ${teachers.map(t => `
                <option value="${t.staff_id}" data-name="${t.full_name}">
                  ${t.full_name} (${t.email})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- 4. Tên lớp -->
          <div>
            <label for="create-class-name" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
              Tên lớp <span style="color:#A93226">*</span>
            </label>
            <input 
              id="create-class-name" 
              type="text" 
              required 
              placeholder="Tên lớp (vd IELTS Foundation — lớp tối)" 
              style="width:100%;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:14px;color:#2D2824;outline:none;box-sizing:border-box"
            />
          </div>

          <!-- 5. Loại lớp (lưới 2x2) -->
          <div>
            <label style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:8px">
              Loại lớp <span style="color:#A93226">*</span>
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              ${Object.entries(CLASS_TYPE_LABELS).map(([typeKey, item]) => `
                <label 
                  class="class-type-radio-label ${typeKey === 'regular' ? 'selected' : ''}" 
                  data-type="${typeKey}" 
                  style="border:1.5px solid ${typeKey === 'regular' ? '#A93226' : '#EAE4D8'};border-radius:12px;padding:12px 14px;cursor:pointer;background:${typeKey === 'regular' ? '#F5E6E4' : '#FFFFFF'};display:flex;flex-direction:column;gap:4px;transition:all 0.15s ease"
                >
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <span style="font-size:13.5px;font-weight:700;color:${typeKey === 'regular' ? '#A93226' : '#2D2824'}">${item.label}</span>
                    <input type="radio" name="class_type" value="${typeKey}" ${typeKey === 'regular' ? 'checked' : ''} style="accent-color:#A93226" />
                  </div>
                  <div style="font-size:11.5px;color:#7F7A72;line-height:1.35">${item.desc}</div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 6. Ngày khai giảng & Lịch học -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label for="create-start-date" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
                Ngày bắt đầu <span style="color:#A93226">*</span>
              </label>
              <input id="create-start-date" type="date" required value="${new Date().toISOString().split('T')[0]}" style="width:100%;height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13.5px;color:#2D2824;outline:none;box-sizing:border-box" />
            </div>
            <div>
              <label for="create-max-students" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
                Sĩ số tối đa
              </label>
              <input id="create-max-students" type="number" min="5" max="50" value="20" style="width:100%;height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13.5px;color:#2D2824;outline:none;box-sizing:border-box" />
            </div>
          </div>

          <!-- Nút Submit -->
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:10px;border-top:1px solid #EAE4D8;padding-top:16px">
            <button id="btn-cancel-create" type="button" style="height:42px;padding:0 20px;border:1px solid #EAE4D8;border-radius:12px;background:#FFFFFF;font-size:13.5px;font-weight:700;color:#7F7A72;cursor:pointer">
              Hủy
            </button>
            <button id="btn-submit-create-class" type="submit" style="height:42px;padding:0 24px;border:none;border-radius:12px;background:#A93226;font-size:13.5px;font-weight:700;color:#FFFFFF;cursor:pointer;box-shadow:0 3px 10px rgba(169,50,38,0.25)">
              Tạo lớp học
            </button>
          </div>

        </form>

      </div>
    </div>
  `;
}

export function initClassesPage(): void {
  const state = getState();
  const isAdmin = state.currentUser?.role === 'admin';

  // 1. Nút quay lại Dashboard
  document.getElementById('btn-back-classes')?.addEventListener('click', () => {
    window.location.hash = '#/dashboard';
  });

  // 2. Chuyển Tab Chính (Danh sách Lớp học vs Tiến độ Đào tạo)
  document.getElementById('tab-btn-classes-list')?.addEventListener('click', () => {
    currentMainTab = 'classes';
    window.location.hash = '#/classes?tab=classes';
    reRender();
  });

  document.getElementById('tab-btn-classes-progress')?.addEventListener('click', () => {
    currentMainTab = 'progress';
    window.location.hash = '#/classes?tab=progress';
    reRender();
  });

  // 3. Tab Danh sách Lớp học: Click vào thẻ hoặc nút
  document.querySelectorAll<HTMLElement>('.class-horizontal-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Nếu bấm trúng nút bên trong thì không xử lý click thẻ
      if ((e.target as HTMLElement).closest('button')) return;
      const classId = card.dataset.id;
      if (classId) {
        window.location.hash = `#/classes/${classId}`;
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-open-class-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const classId = btn.dataset.classId;
      if (classId) {
        window.location.hash = `#/classes/${classId}`;
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-switch-to-class-progress').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const classId = btn.dataset.classId;
      if (classId) {
        currentMainTab = 'progress';
        progressClassFilter = classId;
        window.location.hash = `#/classes?tab=progress&classId=${encodeURIComponent(classId)}`;
        reRender();
      }
    });
  });

  // 4. Filter Pills loại lớp
  document.querySelectorAll<HTMLButtonElement>('.class-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter as 'all' | CenterClassType;
      if (filter) {
        activeClassTypeFilter = filter;
        reRender();
      }
    });
  });

  // 5. Tab Tiến độ: KPI Cards click để lọc nhanh
  document.querySelectorAll<HTMLElement>('.progress-kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const alert = card.dataset.alert as 'normal' | 'watch' | 'priority';
      if (alert) {
        progressAlertFilter = progressAlertFilter === alert ? 'all' : alert;
        reRender();
      }
    });
  });

  // 6. Tab Tiến độ: Search & Filter inputs
  const searchInput = document.getElementById('progress-search-input') as HTMLInputElement | null;
  searchInput?.addEventListener('input', () => {
    progressSearchKeyword = searchInput.value.trim();
    reRender();
  });

  const classSelect = document.getElementById('progress-class-select') as HTMLSelectElement | null;
  classSelect?.addEventListener('change', () => {
    progressClassFilter = classSelect.value;
    reRender();
  });

  const alertSelect = document.getElementById('progress-alert-select') as HTMLSelectElement | null;
  alertSelect?.addEventListener('change', () => {
    progressAlertFilter = alertSelect.value as any;
    reRender();
  });

  const trendSelect = document.getElementById('progress-trend-select') as HTMLSelectElement | null;
  trendSelect?.addEventListener('change', () => {
    progressTrendFilter = trendSelect.value as any;
    reRender();
  });

  document.getElementById('btn-reset-progress-filters')?.addEventListener('click', () => {
    progressSearchKeyword = '';
    progressClassFilter = 'all';
    progressAlertFilter = 'all';
    progressTrendFilter = 'all';
    reRender();
  });

  // 7. Modal Thêm Can Thiệp Học Tập
  const intvModal = document.getElementById('modal-add-intervention');
  const closeIntvModal = () => {
    if (intvModal) intvModal.style.display = 'none';
  };

  document.getElementById('btn-close-intervention-modal')?.addEventListener('click', closeIntvModal);
  document.getElementById('btn-cancel-intervention')?.addEventListener('click', closeIntvModal);

  document.querySelectorAll<HTMLButtonElement>('.btn-open-intervention-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sId = btn.dataset.studentId || '';
      const sName = btn.dataset.studentName || '';
      const cId = btn.dataset.classId || '';

      const sIdInput = document.getElementById('intv-student-id') as HTMLInputElement | null;
      const sNameInput = document.getElementById('intv-student-name') as HTMLInputElement | null;
      const cIdInput = document.getElementById('intv-class-id') as HTMLInputElement | null;

      if (sIdInput) sIdInput.value = sId;
      if (sNameInput) sNameInput.value = sName;
      if (cIdInput) cIdInput.value = cId;

      if (intvModal) intvModal.style.display = 'flex';
    });
  });

  document.getElementById('btn-add-general-intervention')?.addEventListener('click', () => {
    const sIdInput = document.getElementById('intv-student-id') as HTMLInputElement | null;
    const sNameInput = document.getElementById('intv-student-name') as HTMLInputElement | null;
    const cIdInput = document.getElementById('intv-class-id') as HTMLInputElement | null;

    if (sIdInput) sIdInput.value = userAccessibleClasses[0]?.class_id || 'CLS_IELTS_FND';
    if (sNameInput) sNameInput.value = 'Học viên cần can thiệp';
    if (cIdInput) cIdInput.value = userAccessibleClasses[0]?.class_id || 'CLS_IELTS_FND';

    if (intvModal) intvModal.style.display = 'flex';
  });

  document.getElementById('form-add-intervention')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const sId = (document.getElementById('intv-student-id') as HTMLInputElement)?.value || 'SV001';
    const cId = (document.getElementById('intv-class-id') as HTMLInputElement)?.value || 'CLS001';
    const issue = (document.getElementById('intv-issue') as HTMLTextAreaElement)?.value || '';
    const action = (document.getElementById('intv-action') as HTMLTextAreaElement)?.value || '';
    const followUp = (document.getElementById('intv-follow-up-date') as HTMLInputElement)?.value || '';
    const status = (document.getElementById('intv-status') as HTMLSelectElement)?.value as any || 'in_progress';

    const currentUser = getState().currentUser;
    const newIntv: InterventionRecord = {
      intervention_id: `INT_${Date.now()}`,
      student_id: sId,
      class_id: cId,
      issue,
      action,
      performed_by: currentUser?.staff_id || 'STF001',
      performed_by_name: currentUser?.full_name || 'Lê Minh Cường',
      follow_up_date: followUp,
      created_at: new Date().toISOString(),
      status,
    };

    interventionData.unshift(newIntv);
    closeIntvModal();
    showToast('Đã lưu bản ghi can thiệp học tập thành công!', 'success');
    reRender();
  });

  // 8. Modal Tạo lớp học (Admin only)
  const createModal = document.getElementById('modal-create-class');
  const openCreateModal = () => {
    if (createModal) createModal.style.display = 'flex';
  };
  const closeCreateModal = () => {
    if (createModal) createModal.style.display = 'none';
  };

  document.getElementById('btn-open-create-class-modal')?.addEventListener('click', openCreateModal);
  document.getElementById('btn-close-create-modal')?.addEventListener('click', closeCreateModal);
  document.getElementById('btn-cancel-create')?.addEventListener('click', closeCreateModal);

  // Phím tắt N mở modal tạo lớp (khi ở Tab Lớp học)
  const handleKeydown = (e: KeyboardEvent) => {
    if (!isAdmin || currentMainTab !== 'classes') return;
    const target = e.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
    if (e.key === 'n' || e.key === 'N') {
      if (!isTyping && createModal?.style.display !== 'flex') {
        e.preventDefault();
        openCreateModal();
      }
    } else if (e.key === 'Escape') {
      if (createModal?.style.display === 'flex') {
        closeCreateModal();
      }
      if (intvModal?.style.display === 'flex') {
        closeIntvModal();
      }
    }
  };
  window.removeEventListener('keydown', handleKeydown);
  window.addEventListener('keydown', handleKeydown);

  // Course select change -> load units
  const courseSelect = document.getElementById('create-course-select') as HTMLSelectElement | null;
  const unitStart = document.getElementById('create-unit-start') as HTMLSelectElement | null;
  const unitEnd = document.getElementById('create-unit-end') as HTMLSelectElement | null;
  const hint = document.getElementById('units-range-hint');

  courseSelect?.addEventListener('change', () => {
    const opt = courseSelect.selectedOptions[0];
    if (opt && opt.value) {
      const units = parseInt(opt.dataset.units || '15', 10);
      if (unitStart && unitEnd) {
        unitStart.disabled = false;
        unitEnd.disabled = false;
        unitStart.style.background = '#FDFBF7';
        unitEnd.style.background = '#FDFBF7';

        unitStart.innerHTML = Array.from({ length: units }, (_, i) => `<option value="${i + 1}">Từ Unit ${i + 1}</option>`).join('');
        unitEnd.innerHTML = Array.from({ length: units }, (_, i) => `<option value="${i + 1}" ${i + 1 === units ? 'selected' : ''}>Đến Unit ${i + 1}</option>`).join('');
      }
      if (hint) hint.textContent = `(Khóa có ${units} Units)`;
    } else {
      if (unitStart && unitEnd) {
        unitStart.disabled = true;
        unitEnd.disabled = true;
        unitStart.style.background = '#F6F4F0';
        unitEnd.style.background = '#F6F4F0';
      }
      if (hint) hint.textContent = '(chọn khóa học trước)';
    }
  });

  // Class Type radio cards
  document.querySelectorAll<HTMLLabelElement>('.class-type-radio-label').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll<HTMLLabelElement>('.class-type-radio-label').forEach(l => {
        l.style.borderColor = '#EAE4D8';
        l.style.background = '#FFFFFF';
        const span = l.querySelector('span');
        if (span) span.style.color = '#2D2824';
      });
      label.style.borderColor = '#A93226';
      label.style.background = '#F5E6E4';
      const span = label.querySelector('span');
      if (span) span.style.color = '#A93226';
      const radio = label.querySelector('input[type="radio"]') as HTMLInputElement;
      if (radio) radio.checked = true;
    });
  });

  // Form Submit Tạo lớp học
  const createForm = document.getElementById('form-create-class');
  createForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const courseOpt = courseSelect?.selectedOptions[0];
    const courseName = courseOpt?.dataset.name || 'IELTS Foundation 5.5';
    const classNameInput = document.getElementById('create-class-name') as HTMLInputElement | null;
    const teacherSelect = document.getElementById('create-teacher-select') as HTMLSelectElement | null;
    const startDateInput = document.getElementById('create-start-date') as HTMLInputElement | null;
    const maxStudentsInput = document.getElementById('create-max-students') as HTMLInputElement | null;
    const checkedType = document.querySelector('input[name="class_type"]:checked') as HTMLInputElement | null;

    const classType = (checkedType?.value || 'regular') as CenterClassType;
    const teacherId = teacherSelect?.value || 'STF003';
    const teacherName = teacherSelect?.selectedOptions[0]?.dataset.name || 'Lê Minh Cường';
    const className = classNameInput?.value.trim() || `${courseName} — Lớp mới`;

    const randomCode = classType === 'trial' ? '—' : Math.random().toString(36).substring(2, 8).toUpperCase();
    const newClassId = `CLS_${Date.now()}`;

    const newClassItem: CenterClassItem = {
      class_id: newClassId,
      class_code: randomCode,
      class_name: className,
      course_name: courseName,
      schedule: 'T2,T4,T6 - 19:30-21:30',
      status: 'in_progress',
      start_date: startDateInput?.value || new Date().toISOString().split('T')[0],
      total_sessions: 15,
      completed_sessions: 1,
      max_students: parseInt(maxStudentsInput?.value || '20', 10),
      current_students: 1,
      class_type: classType,
      teacher_id: teacherId,
      teacher_name: teacherName,
    };

    centerClassData.unshift(newClassItem);

    if (classType !== 'self_study') {
      generateSessionsForClass(newClassItem);
    }

    createCenterClassApi({
      course_name: courseName,
      class_name: className,
      teacher_id: teacherId,
      teacher_name: teacherName,
      class_type: classType,
      days_of_week: ['T2', 'T4', 'T6'],
      start_date: newClassItem.start_date,
      max_students: newClassItem.max_students,
    }).catch(() => {});

    closeCreateModal();
    showToast(`Đã tạo thành công lớp học "${className}"!`, 'success');
    reRender();
  });
}

function reRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderClassesPage();
    initClassesPage();
  }
}
