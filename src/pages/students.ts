// ============================================
// EduTrack English - Màn hình "Học viên"
// Hỗ trợ góc nhìn Giáo viên (lọc theo lớp phụ trách) & Quản lý trung tâm
// Warm Minimalist Design System
// ============================================

import { studentMonitoringData, centerClassData, classAssignmentData, messageData } from '../data.ts';
import { getState } from '../state.ts';
import { showToast, formatDateTime } from '../utils.ts';
import { getOrCreateTicketForStudent, getStudentMessages } from './support.ts';
import type { SupportTicket, SupportMessage } from '../types.ts';

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type StudentsTab = 'list' | 'leaderboard';
type AlertStatusFilter = 'all' | 'priority' | 'watch' | 'normal';

let activeTab: StudentsTab = 'list';
let activeAlertFilter: AlertStatusFilter = 'all';
let filterNameQuery: string = '';
let filterClassId: string = 'all';
let filterCourseId: string = 'all';
let showArchivedStudents: boolean = false;
let sortAscending: boolean = true;
let expandedStudentIds: Set<string> = new Set(['SV_NN']); // Default expand first student

export function renderStudentsPage(): string {
  const state = getState();
  const user = state.currentUser;
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  // 1. Determine assigned classes for Teacher or Teaching Assistant (Strict RBAC)
  const assignedClassIds = new Set<string>();
  if (isTeacher && staffId) {
    centerClassData.forEach(c => {
      if (c.teacher_id === staffId) assignedClassIds.add(c.class_id);
    });
    classAssignmentData.forEach(ca => {
      if (ca.teacher_id === staffId) assignedClassIds.add(ca.class_id);
    });
    if (staffId === 'STF003') {
      assignedClassIds.add('CLS_NN01');
      assignedClassIds.add('CLS_IELTS_FND');
      assignedClassIds.add('CLS_COMM_01');
      assignedClassIds.add('CLS_SELF_01');
    } else if (staffId === 'STF004') {
      assignedClassIds.add('CLS_TRIAL_01');
      assignedClassIds.add('CLS_B1_01');
      assignedClassIds.add('CLS003');
      assignedClassIds.add('CLS005');
    }
  } else if (isTA && staffId) {
    classAssignmentData.forEach(ca => {
      if (ca.teaching_assistant_id === staffId) assignedClassIds.add(ca.class_id);
    });
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

  // 2. Filter base students strictly scoped to assigned classes
  const baseStudents = (isTeacher || isTA)
    ? studentMonitoringData.filter(s => assignedClassIds.has(s.class_id))
    : studentMonitoringData;

  // 3. Compute 4 KPIs
  const activeCount = baseStudents.length;
  const priorityCount = baseStudents.filter(s => s.alert_level === 'priority').length;
  const watchCount = baseStudents.filter(s => s.alert_level === 'watch').length;
  const normalCount = baseStudents.filter(s => s.alert_level === 'normal').length;
  const totalWeeklyXp = baseStudents.reduce((acc, curr) => acc + (curr.gamification?.xp_this_week || 0), 0);

  // 4. Apply filters to table list
  let displayStudents = baseStudents.filter(s => {
    if (activeAlertFilter !== 'all' && s.alert_level !== activeAlertFilter) {
      return false;
    }
    if (filterClassId !== 'all' && s.class_id !== filterClassId) {
      return false;
    }
    if (filterCourseId !== 'all') {
      const cls = centerClassData.find(c => c.class_id === s.class_id);
      if (cls?.course_name !== filterCourseId) return false;
    }
    if (filterNameQuery.trim()) {
      const q = filterNameQuery.toLowerCase().trim();
      const matchName = s.full_name.toLowerCase().includes(q);
      const matchCode = (s.student_code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  // Sort by alert level or status
  displayStudents.sort((a, b) => {
    const alertOrder: Record<string, number> = { priority: 1, watch: 2, normal: 3 };
    const valA = alertOrder[a.alert_level] || 9;
    const valB = alertOrder[b.alert_level] || 9;
    return sortAscending ? valA - valB : valB - valA;
  });

  // Extract unique courses and classes for dropdowns
  const availableClasses = isTeacher
    ? centerClassData.filter(c => assignedClassIds.has(c.class_id))
    : centerClassData;

  const uniqueCourses = Array.from(new Set(availableClasses.map(c => c.course_name).filter(Boolean)));

  // Weekly Leaderboard sorted by xp_this_week descending
  const leaderboardStudents = [...baseStudents].sort((a, b) => {
    return (b.gamification?.xp_this_week || 0) - (a.gamification?.xp_this_week || 0);
  });

  return `
    <div class="students-page" style="background:#FAF7F2;min-height:100vh;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang -->
      <div style="margin-bottom:20px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">Học viên</h1>
        <div style="font-size:13.5px;color:#7F7A72;font-weight:500">
          ${(isTeacher || isTA) 
            ? 'Tất cả học viên trong các lớp bạn phụ trách — điểm trung bình, level, XP và tình hình học.' 
            : 'Tất cả học viên trong các lớp của trung tâm — điểm trung bình, level, XP và tình hình học.'}
        </div>
      </div>

      <!-- 2. 2 Tab Điều Hướng (Danh sách & Bảng xếp hạng) -->
      <div style="display:flex;align-items:center;gap:28px;border-bottom:1.5px solid #EAE4D8;margin-bottom:24px">
        <button 
          id="btn-tab-students-list" 
          type="button" 
          class="students-nav-tab ${activeTab === 'list' ? 'active' : ''}"
          style="
            background:none;
            border:none;
            padding:12px 4px 14px 4px;
            font-size:15px;
            font-weight:800;
            color:${activeTab === 'list' ? '#A93226' : '#7F7A72'};
            border-bottom:${activeTab === 'list' ? '3px solid #A93226' : '3px solid transparent'};
            cursor:pointer;
            transition:all 0.15s ease;
          "
        >
          Danh sách
        </button>

        <button 
          id="btn-tab-students-leaderboard" 
          type="button" 
          class="students-nav-tab ${activeTab === 'leaderboard' ? 'active' : ''}"
          style="
            background:none;
            border:none;
            padding:12px 4px 14px 4px;
            font-size:15px;
            font-weight:800;
            color:${activeTab === 'leaderboard' ? '#A93226' : '#7F7A72'};
            border-bottom:${activeTab === 'leaderboard' ? '3px solid #A93226' : '3px solid transparent'};
            cursor:pointer;
            transition:all 0.15s ease;
          "
        >
          Bảng xếp hạng
        </button>
      </div>

      ${activeTab === 'list' ? `
        <!-- ================= TAB 1: DANH SÁCH HỌC VIÊN ================= -->
        
        <!-- 4 Thẻ KPI Nằm Ngang -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
          <!-- Thẻ 1: Đang học -->
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
            <div style="font-size:32px;font-weight:800;color:#2D2824;line-height:1;margin-bottom:8px">${activeCount}</div>
            <div style="font-size:13.5px;font-weight:600;color:#7F7A72">Đang học</div>
          </div>

          <!-- Thẻ 2: Nguy cơ -->
          <div style="background:#F9EBEA;border:1px solid #F5D6D4;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(146,43,33,0.04)">
            <div style="font-size:32px;font-weight:800;color:#922B21;line-height:1;margin-bottom:8px">${priorityCount}</div>
            <div style="font-size:13.5px;font-weight:700;color:#922B21">Nguy cơ</div>
          </div>

          <!-- Thẻ 3: Chú ý -->
          <div style="background:#F9F3D9;border:1px solid #F3E8B9;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(183,149,11,0.04)">
            <div style="font-size:32px;font-weight:800;color:#AF601A;line-height:1;margin-bottom:8px">${watchCount}</div>
            <div style="font-size:13.5px;font-weight:700;color:#AF601A">Chú ý</div>
          </div>

          <!-- Thẻ 4: XP tuần -->
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
            <div style="font-size:32px;font-weight:800;color:#15803D;line-height:1;margin-bottom:8px">${totalWeeklyXp}</div>
            <div style="font-size:13.5px;font-weight:700;color:#15803D">XP tuần</div>
          </div>
        </div>

        <!-- Thanh Bộ Lọc -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          
          <!-- Hàng trên: Tìm kiếm, Dropdown Lớp, Dropdown Khóa -->
          <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div style="position:relative">
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#A8A29A;font-size:14px">🔍</span>
              <input 
                id="input-students-search" 
                type="text" 
                placeholder="Tìm theo tên..." 
                value="${filterNameQuery}"
                style="width:100%;height:38px;padding:0 12px 0 34px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box"
              />
            </div>

            <select 
              id="select-students-class" 
              style="height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FFFFFF;font-size:13px;color:#2D2824;outline:none;cursor:pointer"
            >
              <option value="all" ${filterClassId === 'all' ? 'selected' : ''}>Mọi lớp</option>
              ${availableClasses.map(c => `
                <option value="${c.class_id}" ${filterClassId === c.class_id ? 'selected' : ''}>${c.class_name}</option>
              `).join('')}
            </select>

            <select 
              id="select-students-course" 
              style="height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FFFFFF;font-size:13px;color:#2D2824;outline:none;cursor:pointer"
            >
              <option value="all" ${filterCourseId === 'all' ? 'selected' : ''}>Mọi khóa</option>
              ${uniqueCourses.map(crs => `
                <option value="${crs}" ${filterCourseId === crs ? 'selected' : ''}>${crs}</option>
              `).join('')}
            </select>
          </div>

          <!-- Hàng dưới: 3 nút Pill trạng thái có chấm tròn màu + Checkbox học viên lưu trữ -->
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-top:1px solid #F5F3ED;padding-top:12px">
            
            <div style="display:flex;align-items:center;gap:10px">
              <button 
                type="button" 
                class="btn-status-filter-pill ${activeAlertFilter === 'all' ? 'active' : ''}" 
                data-filter="all"
                style="
                  border-radius:30px;
                  padding:6px 16px;
                  font-size:12.5px;
                  font-weight:700;
                  cursor:pointer;
                  transition:all 0.15s ease;
                  ${activeAlertFilter === 'all' 
                    ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;' 
                    : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
                  }
                "
              >
                Tất cả (${activeCount})
              </button>

              <button 
                type="button" 
                class="btn-status-filter-pill ${activeAlertFilter === 'priority' ? 'active' : ''}" 
                data-filter="priority"
                style="
                  border-radius:30px;
                  padding:6px 16px;
                  font-size:12.5px;
                  font-weight:700;
                  cursor:pointer;
                  display:inline-flex;
                  align-items:center;
                  gap:6px;
                  transition:all 0.15s ease;
                  ${activeAlertFilter === 'priority' 
                    ? 'background:#922B21;color:#FFFFFF;border:1px solid #922B21;' 
                    : 'background:#FFFFFF;color:#922B21;border:1px solid #F5D6D4;'
                  }
                "
              >
                <span style="width:7px;height:7px;border-radius:50%;background:${activeAlertFilter === 'priority' ? '#FFFFFF' : '#922B21'}"></span>
                <span>Nguy cơ (${priorityCount})</span>
              </button>

              <button 
                type="button" 
                class="btn-status-filter-pill ${activeAlertFilter === 'watch' ? 'active' : ''}" 
                data-filter="watch"
                style="
                  border-radius:30px;
                  padding:6px 16px;
                  font-size:12.5px;
                  font-weight:700;
                  cursor:pointer;
                  display:inline-flex;
                  align-items:center;
                  gap:6px;
                  transition:all 0.15s ease;
                  ${activeAlertFilter === 'watch' 
                    ? 'background:#AF601A;color:#FFFFFF;border:1px solid #AF601A;' 
                    : 'background:#FFFFFF;color:#AF601A;border:1px solid #F3E8B9;'
                  }
                "
              >
                <span style="width:7px;height:7px;border-radius:50%;background:${activeAlertFilter === 'watch' ? '#FFFFFF' : '#AF601A'}"></span>
                <span>Chú ý (${watchCount})</span>
              </button>

              <button 
                type="button" 
                class="btn-status-filter-pill ${activeAlertFilter === 'normal' ? 'active' : ''}" 
                data-filter="normal"
                style="
                  border-radius:30px;
                  padding:6px 16px;
                  font-size:12.5px;
                  font-weight:700;
                  cursor:pointer;
                  display:inline-flex;
                  align-items:center;
                  gap:6px;
                  transition:all 0.15s ease;
                  ${activeAlertFilter === 'normal' 
                    ? 'background:#196F3D;color:#FFFFFF;border:1px solid #196F3D;' 
                    : 'background:#FFFFFF;color:#196F3D;border:1px solid #D5F5E3;'
                  }
                "
              >
                <span style="width:7px;height:7px;border-radius:50%;background:${activeAlertFilter === 'normal' ? '#FFFFFF' : '#196F3D'}"></span>
                <span>Ổn (${normalCount})</span>
              </button>
            </div>

            <label style="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#7F7A72;cursor:pointer">
              <input id="chk-archived-students" type="checkbox" ${showArchivedStudents ? 'checked' : ''} style="accent-color:#A93226" />
              <span>Hiện học viên đã học xong / lưu trữ</span>
            </label>

          </div>

        </div>

        <!-- Bảng Danh Sách Học Viên 8 Cột -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.02);margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse;font-size:13.5px;color:#2D2824;text-align:left">
            <thead>
              <tr style="background:#FCFAF7;border-bottom:1.5px solid #EAE4D8;font-size:12px;font-weight:800;color:#7F7A72;text-transform:uppercase;letter-spacing:0.03em">
                <th style="padding:16px 20px">Học viên</th>
                <th style="padding:16px 16px">Lớp</th>
                <th style="padding:16px 14px">Điểm TB</th>
                <th style="padding:16px 14px">Trình độ</th>
                <th style="padding:16px 14px">Level</th>
                <th style="padding:16px 14px">XP tổng</th>
                <th style="padding:16px 14px">XP tuần</th>
                <th id="th-sort-status" style="padding:16px 20px;cursor:pointer;user-select:none" title="Nhấp để đảo chiều sắp xếp">
                  Tình hình ${sortAscending ? '↑' : '↓'}
                </th>
              </tr>
            </thead>
            <tbody>
              ${displayStudents.length === 0 ? `
                <tr>
                  <td colspan="8" style="padding:48px 20px;text-align:center;color:#7F7A72">
                    <div style="font-size:36px;margin-bottom:10px">🔍</div>
                    <div style="font-size:15px;font-weight:700;color:#2D2824;margin-bottom:4px">Không tìm thấy học viên nào phù hợp</div>
                    <div style="font-size:12.5px;color:#A8A29A">Vui lòng thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc.</div>
                  </td>
                </tr>
              ` : displayStudents.map((st, index) => {
                const isExpanded = expandedStudentIds.has(st.student_id);
                const cls = centerClassData.find(c => c.class_id === st.class_id);

                let badgeStyle = 'background:#EAFAF1;color:#196F3D;border:1px solid #D5F5E3;';
                let badgeLabel = '● Ổn';
                if (st.alert_level === 'priority') {
                  badgeStyle = 'background:#F9EBEA;color:#922B21;border:1px solid #F5D6D4;';
                  badgeLabel = '● Nguy cơ';
                } else if (st.alert_level === 'watch') {
                  badgeStyle = 'background:#F9F3D9;color:#AF601A;border:1px solid #F3E8B9;';
                  badgeLabel = '● Chú ý';
                }

                return `
                  <!-- Hàng chính học viên -->
                  <tr 
                    class="student-row-item" 
                    data-id="${st.student_id}" 
                    style="border-bottom:1px solid ${isExpanded ? 'transparent' : '#F2ECE1'};cursor:pointer;background:${isExpanded ? '#FDFBF7' : index % 2 === 0 ? '#FFFFFF' : '#FCFAF7'};transition:background 0.15s"
                  >
                    <!-- 1. Học viên (Avatar + Tên in đậm + Mã HV) -->
                    <td style="padding:14px 20px">
                      <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:38px;height:38px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:800;color:#A93226;font-size:13.5px;flex-shrink:0">
                          ${st.avatar_initials}
                        </div>
                        <div>
                          <div style="font-size:14px;font-weight:800;color:#2D2824">${st.full_name}</div>
                          <div style="font-size:11.5px;color:#7F7A72">${st.student_code}</div>
                        </div>
                      </div>
                    </td>

                    <!-- 2. Lớp -->
                    <td style="padding:14px 16px">
                      <span style="font-size:12.5px;font-weight:600;color:#2D2824">${st.class_name}</span>
                    </td>

                    <!-- 3. Điểm TB -->
                    <td style="padding:14px 14px;font-size:14px;font-weight:800;color:${st.avg_score === '—' ? '#A8A29A' : '#A93226'}">
                      ${st.avg_score}
                    </td>

                    <!-- 4. Trình độ -->
                    <td style="padding:14px 14px">
                      <span style="font-size:12px;font-weight:700;color:#2563EB;background:#EFF6FF;border-radius:6px;padding:3px 8px">
                        ${st.cefr_level || 'IELTS Foundation'}
                      </span>
                    </td>

                    <!-- 5. Level -->
                    <td style="padding:14px 14px;font-size:13px;font-weight:700;color:#7C3AED">
                      ${st.gamification?.level || 'Lv 1'} ${st.gamification?.badge || '🥚'}
                    </td>

                    <!-- 6. XP tổng -->
                    <td style="padding:14px 14px;font-size:13px;font-weight:700;color:#7F7A72">
                      ${st.gamification?.xp_total || 0} XP
                    </td>

                    <!-- 7. XP tuần -->
                    <td style="padding:14px 14px;font-size:13.5px;font-weight:800;color:#15803D">
                      +${st.gamification?.xp_this_week || 0} XP
                    </td>

                    <!-- 8. Tình hình -->
                    <td style="padding:14px 20px">
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                        <span style="border-radius:30px;padding:4px 12px;font-size:12px;font-weight:700;${badgeStyle}">
                          ${badgeLabel}
                        </span>
                        <div style="display:flex;align-items:center;gap:6px">
                          <button 
                            type="button" 
                            class="btn-open-student-chat"
                            data-student-id="${st.student_id}" 
                            data-student-name="${escapeHtml(st.full_name)}"
                            data-student-code="${escapeHtml(st.student_code)}"
                            data-class-name="${escapeHtml(st.class_name)}"
                            style="background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;padding:4px 8px;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:all 0.15s"
                            title="Nhắn tin trực tiếp với ${escapeHtml(st.full_name)}"
                          >
                            <span>💬</span>
                            <span>Nhắn tin</span>
                          </button>
                          <span class="btn-toggle-expand" data-id="${st.student_id}" style="color:#A8A29A;font-size:12px;padding:4px;cursor:pointer">
                            ${isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Hàng mở rộng chi tiết -->
                  ${isExpanded ? `
                    <tr style="background:#FDFBF7;border-bottom:1px solid #EAE4D8">
                      <td colspan="8" style="padding:10px 20px 20px 20px">
                        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:16px 20px">
                          
                          <!-- Dòng lý do cần chú ý -->
                          <div style="font-size:13px;color:#A93226;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <span>⚠️</span>
                            <span>Lý do cần chú ý:</span>
                            <span style="color:#2D2824;font-weight:600">${st.status_note || 'Học viên mới (miễn cảnh báo)'}</span>
                          </div>

                          <!-- Thẻ tóm tắt theo từng lớp -->
                          <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
                            <div>
                              <div style="font-size:13.5px;font-weight:800;color:#2D2824;margin-bottom:3px">${st.class_name}</div>
                              <div style="font-size:12px;color:#7F7A72">${st.course_name || cls?.course_name || 'IELTS Foundation 5.5'}</div>
                            </div>

                            <div style="display:flex;align-items:center;gap:20px;font-size:12.5px">
                              <div>
                                <span style="color:#7F7A72">TB:</span> 
                                <strong style="color:#A93226">${st.avg_score}</strong>
                              </div>
                              <div>
                                <span style="color:#7F7A72">Nộp:</span> 
                                <strong style="color:#2D2824">${st.progress_completed ? `${st.progress_completed.lessons_done}/${st.progress_completed.lessons_total}` : '0/0'}</strong>
                              </div>
                              <div>
                                <span style="color:#7F7A72">Chuyên cần:</span> 
                                <strong style="color:#15803D">${st.attendance_interaction?.days_studied || 0} có mặt</strong> · 
                                <strong style="color:#A93226">0 vắng</strong> · 
                                <strong style="color:#D97706">0 có phép</strong>
                              </div>
                              <div style="display:flex;align-items:center;gap:12px">
                                <button 
                                  type="button"
                                  class="btn-open-student-chat" 
                                  data-student-id="${st.student_id}" 
                                  data-student-name="${escapeHtml(st.full_name)}"
                                  data-student-code="${escapeHtml(st.student_code)}"
                                  data-class-name="${escapeHtml(st.class_name)}"
                                  style="display:inline-flex;align-items:center;gap:4px;background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;padding:5px 12px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 3px rgba(169,50,38,0.08)"
                                  title="Gửi tin nhắn hoặc mở cuộc trò chuyện với học viên này"
                                >
                                  <span>💬 Nhắn tin ngay</span>
                                </button>
                                <a href="#/students/${st.student_id}" style="color:#A93226;font-weight:700;text-decoration:none;font-size:12.5px">
                                  Hồ sơ chi tiết →
                                </a>
                              </div>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  ` : ''}
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Chân bảng: Đang xem 1-N trong N học viên -->
          <div style="padding:14px 20px;background:#FCFAF7;border-top:1px solid #EAE4D8;font-size:12.5px;color:#7F7A72;display:flex;align-items:center;justify-content:space-between">
            <div>Đang xem 1–${displayStudents.length} trong ${activeCount} học viên</div>
            <div style="font-size:12px;color:#A8A29A">Nhấp vào từng hàng để mở rộng/thu gọn thông tin chi tiết</div>
          </div>
        </div>

      ` : `
        <!-- ================= TAB 2: BẢNG XẾP HẠNG ================= -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 30px;box-shadow:0 1px 4px rgba(0,0,0,0.02)">
          
          <!-- Header Thẻ Bảng Xếp Hạng -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid #F2ECE1;padding-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:22px">🏆</span>
              <span style="font-size:18px;font-weight:800;color:#2D2824">Bảng xếp hạng · EduTrack English</span>
              <span style="font-size:13px;color:#A8A29A" title="Bảng xếp hạng tổng hợp dựa trên XP hoàn thành bài tập, flashcard và chuỗi học tập trong tuần">ⓘ</span>
            </div>

            <div style="display:flex;align-items:center;gap:14px">
              <div style="font-size:13px;font-weight:700;color:#D97706;background:#FEF3C7;padding:6px 14px;border-radius:20px;border:1px solid #FDE68A">
                ⏱ còn 2 ngày 11 giờ
              </div>
              <button 
                id="btn-refresh-leaderboard" 
                type="button" 
                style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:10px;padding:6px 14px;font-size:13px;font-weight:700;color:#2D2824;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
              >
                <span>↻</span>
                <span>Cập nhật</span>
              </button>
            </div>
          </div>

          <!-- Nội Dung Bảng Xếp Hạng -->
          ${leaderboardStudents.every(s => (s.gamification?.xp_this_week || 0) === 0) ? `
            <div style="text-align:center;padding:48px 20px;color:#7F7A72">
              <div style="font-size:48px;margin-bottom:12px">🏅</div>
              <div style="font-size:16px;font-weight:700;color:#2D2824;margin-bottom:4px">Chưa có XP tuần này — luyện tập để dẫn đầu!</div>
              <div style="font-size:13px;color:#A8A29A">Học viên tích lũy XP khi hoàn thành bài tập, làm quiz và ôn từ vựng.</div>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:12px">
              ${leaderboardStudents.map((st, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                const rankBadge = idx < 3 ? medals[idx] : `#${idx + 1}`;
                const weeklyXp = st.gamification?.xp_this_week || 0;

                return `
                  <div 
                    style="
                      display:flex;
                      align-items:center;
                      justify-content:space-between;
                      background:${idx === 0 ? '#FEFCE8' : '#FAF7F2'};
                      border:1px solid ${idx === 0 ? '#FEF08A' : '#EAE4D8'};
                      border-radius:16px;
                      padding:16px 20px;
                    "
                  >
                    <!-- Thứ hạng & Học viên -->
                    <div style="display:flex;align-items:center;gap:16px">
                      <div style="font-size:22px;font-weight:900;width:34px;text-align:center">${rankBadge}</div>
                      <div style="width:40px;height:40px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:800;color:#A93226;font-size:14px">
                        ${st.avatar_initials}
                      </div>
                      <div>
                        <div style="font-size:15px;font-weight:800;color:#2D2824">${st.full_name}</div>
                        <div style="font-size:12px;color:#7F7A72">${st.class_name} · ${st.cefr_level || 'IELTS Foundation'}</div>
                      </div>
                    </div>

                    <!-- Chuỗi & XP tuần -->
                    <div style="display:flex;align-items:center;gap:24px">
                      <div style="font-size:13px;color:#D97706;font-weight:700">
                        🔥 ${st.streak_days} ngày liền
                      </div>
                      <div style="font-size:16px;font-weight:900;color:#15803D">
                        +${weeklyXp} XP
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}

        </div>
      `}

      <!-- Hộp thoại Chat với học viên (Student Chat Modal) -->
      <div id="student-chat-modal-container"></div>

    </div>
  `;
}

export function initStudentsPage(): void {
  // 1. Tab switching
  document.getElementById('btn-tab-students-list')?.addEventListener('click', () => {
    activeTab = 'list';
    reRender();
  });

  document.getElementById('btn-tab-students-leaderboard')?.addEventListener('click', () => {
    activeTab = 'leaderboard';
    reRender();
  });

  // 2. Alert Status Filter Pills
  document.querySelectorAll<HTMLButtonElement>('.btn-status-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter as AlertStatusFilter;
      if (f) {
        activeAlertFilter = f;
        reRender();
      }
    });
  });

  // 3. Search input
  const searchInput = document.getElementById('input-students-search') as HTMLInputElement | null;
  searchInput?.addEventListener('input', () => {
    filterNameQuery = searchInput.value;
    setTimeout(() => {
      if (filterNameQuery === searchInput.value) {
        reRender();
      }
    }, 250);
  });

  // 4. Class filter
  const classSelect = document.getElementById('select-students-class') as HTMLSelectElement | null;
  classSelect?.addEventListener('change', () => {
    filterClassId = classSelect.value;
    reRender();
  });

  // 5. Course filter
  const courseSelect = document.getElementById('select-students-course') as HTMLSelectElement | null;
  courseSelect?.addEventListener('change', () => {
    filterCourseId = courseSelect.value;
    reRender();
  });

  // 6. Archived checkbox
  const chkArchived = document.getElementById('chk-archived-students') as HTMLInputElement | null;
  chkArchived?.addEventListener('change', () => {
    showArchivedStudents = chkArchived.checked;
    showToast(showArchivedStudents ? 'Đang hiển thị cả học viên đã kết thúc khóa' : 'Đang ẩn học viên lưu trữ', 'info');
  });

  // 7. Sort by status
  document.getElementById('th-sort-status')?.addEventListener('click', () => {
    sortAscending = !sortAscending;
    reRender();
  });

  // 8. Toggle row expand
  document.querySelectorAll<HTMLElement>('.btn-toggle-expand').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (id) {
        if (expandedStudentIds.has(id)) {
          expandedStudentIds.delete(id);
        } else {
          expandedStudentIds.add(id);
        }
        reRender();
      }
    });
  });

  // 9. Click row -> toggle expand or navigate
  document.querySelectorAll<HTMLElement>('.student-row-item').forEach(row => {
    row.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.btn-toggle-expand') || target.closest('.btn-open-student-chat') || target.tagName === 'A') return;
      const id = row.dataset.id;
      if (id) {
        if (expandedStudentIds.has(id)) {
          expandedStudentIds.delete(id);
        } else {
          expandedStudentIds.add(id);
        }
        reRender();
      }
    });
  });

  // 10. Refresh leaderboard
  document.getElementById('btn-refresh-leaderboard')?.addEventListener('click', () => {
    showToast('Đã cập nhật Bảng xếp hạng XP tuần mới nhất!', 'success');
    reRender();
  });

  // 11. Mở ngay box chat trực tiếp với học viên (Hiển thị đầy đủ lịch sử chat)
  document.querySelectorAll<HTMLElement>('.btn-open-student-chat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const studentId = btn.dataset.studentId;
      const studentName = btn.dataset.studentName || 'Học viên';
      const studentCode = btn.dataset.studentCode || '';
      const className = btn.dataset.className || '';
      if (studentId) {
        openStudentChatModal(studentId, studentName, studentCode, className);
      }
    });
  });
}

function openStudentChatModal(studentId: string, studentName: string, studentCode: string, className: string): void {
  const ticket = getOrCreateTicketForStudent(studentId, studentName);
  const messages = getStudentMessages(studentId);
  const modalContainer = document.getElementById('student-chat-modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = renderStudentChatModalHtml(studentId, studentName, studentCode, className, ticket, messages);
  bindStudentChatModalEvents(studentId, studentName, ticket);
}

function renderStudentChatModalHtml(
  studentId: string,
  studentName: string,
  studentCode: string,
  className: string,
  ticket: SupportTicket,
  messages: SupportMessage[]
): string {
  const initials = studentName.trim().split(/\s+/).slice(-2).map(p => p[0]).join('').toUpperCase() || 'HV';

  return `
    <div id="student-chat-modal-backdrop" style="position:fixed;inset:0;background:rgba(45,40,36,0.55);backdrop-filter:blur(3px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.15s ease">
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:22px;width:100%;max-width:580px;height:85vh;max-height:720px;display:flex;flex-direction:column;box-shadow:0 24px 48px rgba(45,40,36,0.18);overflow:hidden;animation:fadeInUp 0.18s ease-out">
        
        <!-- Modal Header -->
        <div style="padding:16px 20px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between;background:#FDFBF7">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:42px;height:42px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:800;color:#A93226;font-size:15px;flex-shrink:0">
              ${initials}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <h3 style="font-size:16px;font-weight:800;color:#2D2824;margin:0">
                  ${escapeHtml(studentName)}
                </h3>
                <span style="font-size:11px;font-weight:700;color:#15803D;background:#DCFCE7;padding:1px 6px;border-radius:4px">
                  ● Trực tuyến
                </span>
              </div>
              <div style="font-size:12px;color:#7F7A72;margin-top:2px;display:flex;align-items:center;gap:6px">
                <span>${escapeHtml(studentCode)}</span>
                <span>·</span>
                <span style="color:#2D2824;font-weight:600">${escapeHtml(className)}</span>
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <a 
              href="#/support?studentId=${studentId}" 
              style="font-size:12px;font-weight:700;color:#A93226;background:#FFFFFF;border:1px solid #E8C9C5;padding:6px 12px;border-radius:8px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s"
              title="Mở toàn màn hình trong phân hệ Hỗ trợ"
            >
              <span>Mở trang Hỗ trợ</span>
              <span>↗</span>
            </a>
            <button 
              id="btn-close-student-chat-modal" 
              type="button" 
              style="background:none;border:none;font-size:20px;color:#7F7A72;cursor:pointer;padding:4px 8px;border-radius:6px"
              title="Đóng (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Ticket Info Banner -->
        <div style="padding:8px 20px;background:#FAF8F5;border-bottom:1px solid #F0ECE4;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#7F7A72">
          <div>
            <span>Kênh trao đổi: </span>
            <strong style="color:#2D2824">${escapeHtml(ticket.title)}</strong>
          </div>
          <span style="font-size:11px;font-weight:700;color:${ticket.status === 'resolved' ? '#166534' : '#0369A1'};background:${ticket.status === 'resolved' ? '#DCFCE7' : '#E0F2FE'};padding:2px 6px;border-radius:4px">
            ${ticket.status === 'resolved' ? 'Đã giải quyết' : 'Đang trao đổi'}
          </span>
        </div>

        <!-- Chat History Messages Container -->
        <div 
          id="student-chat-history-container" 
          style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;background:#FAF7F2"
        >
          ${messages.length === 0 ? `
            <div style="padding:40px 20px;text-align:center;color:#7F7A72">
              <div style="font-size:36px;margin-bottom:8px">💬</div>
              <div style="font-size:14px;font-weight:700;color:#2D2824">Chưa có tin nhắn nào trước đây</div>
              <div style="font-size:12.5px;color:#7F7A72;margin-top:4px">Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi với học viên này.</div>
            </div>
          ` : messages.map(msg => {
            const isMe = msg.sender_role === 'teacher' || msg.sender_role === 'admin' || msg.sender_role === 'teaching_assistant';
            const isInternal = msg.is_internal_note;
            const timeStr = formatDateTime(msg.sent_at);

            return `
              <div style="display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'};gap:3px">
                <div style="font-size:11px;font-weight:700;color:${isMe ? '#A93226' : '#2D2824'};display:flex;align-items:center;gap:6px">
                  <span>${escapeHtml(msg.sender_name)}</span>
                  ${isInternal ? '<span style="background:#FEF3C7;color:#B45309;padding:1px 5px;border-radius:4px;font-size:10px">🔒 Ghi chú nội bộ</span>' : ''}
                </div>
                <div style="
                  max-width:80%;
                  padding:10px 15px;
                  border-radius:${isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
                  font-size:13.5px;
                  line-height:1.5;
                  ${isInternal 
                    ? 'background:#FFFBEB;color:#78350F;border:1px solid #FDE68A;' 
                    : (isMe 
                      ? 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 6px rgba(169,50,38,0.2);' 
                      : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;box-shadow:0 1px 3px rgba(0,0,0,0.02);'
                    )
                  }
                ">
                  ${escapeHtml(msg.content)}
                </div>
                <div style="font-size:10.5px;color:#A8A29A;margin-top:1px">
                  ${timeStr}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Quick Reply Suggestions -->
        <div style="padding:8px 16px;background:#FFFFFF;border-top:1px solid #F0ECE4;display:flex;align-items:center;gap:6px;overflow-x:auto">
          <span style="font-size:11.5px;color:#7F7A72;font-weight:700;flex-shrink:0">Gợi ý nhanh:</span>
          ${[
            'Nhắc nộp bài tập về nhà 📝',
            'Khen ngợi tiến độ học tập tốt ⭐',
            'Cần Thầy/Cô hỗ trợ bài tập không em? 💡',
            'Nhớ xem lại tài liệu buổi học nhé 📚',
          ].map(q => `
            <button 
              type="button" 
              class="btn-modal-quick-chip" 
              data-text="${q}"
              style="background:#FAF8F5;border:1px solid #EAE4D8;border-radius:14px;padding:3px 10px;font-size:11.5px;color:#2D2824;cursor:pointer;white-space:nowrap;transition:all 0.15s"
            >
              ${q}
            </button>
          `).join('')}
        </div>

        <!-- Footer Input & Controls -->
        <div style="padding:14px 18px;border-top:1px solid #EAE4D8;background:#FFFFFF;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#7F7A72;cursor:pointer">
              <input type="checkbox" id="modal-internal-check" style="accent-color:#A93226;cursor:pointer" />
              <span>Ghi chú nội bộ (chỉ giáo viên & trợ giảng thấy)</span>
            </label>
            <span style="font-size:11.5px;color:#A8A29A">Enter để gửi · Shift+Enter xuống dòng</span>
          </div>

          <div style="display:flex;align-items:flex-end;gap:10px">
            <textarea 
              id="student-chat-modal-input" 
              placeholder="Nhập tin nhắn gửi cho ${escapeHtml(studentName)}..." 
              rows="2"
              style="flex:1;border:1px solid #EAE4D8;border-radius:12px;padding:10px 14px;font-size:13.5px;color:#2D2824;background:#FDFBF7;outline:none;resize:none;font-family:inherit;line-height:1.4"
            ></textarea>
            <button 
              id="btn-student-chat-modal-send" 
              type="button" 
              style="background:#A93226;color:#FFFFFF;border:none;border-radius:12px;padding:12px 20px;font-weight:700;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(169,50,38,0.25);transition:all 0.15s;flex-shrink:0"
            >
              <span>Gửi</span>
              <span>🚀</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

function bindStudentChatModalEvents(_studentId: string, studentName: string, ticket: SupportTicket): void {
  const backdrop = document.getElementById('student-chat-modal-backdrop');
  const closeBtn = document.getElementById('btn-close-student-chat-modal');
  const sendBtn = document.getElementById('btn-student-chat-modal-send');
  const textarea = document.getElementById('student-chat-modal-input') as HTMLTextAreaElement | null;
  const internalCheck = document.getElementById('modal-internal-check') as HTMLInputElement | null;
  const container = document.getElementById('student-chat-history-container');

  const scrollToBottom = () => {
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 30);
    }
  };

  scrollToBottom();
  textarea?.focus();

  const closeModal = () => {
    backdrop?.remove();
  };

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Quick chips
  document.querySelectorAll<HTMLButtonElement>('.btn-modal-quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      if (text && textarea) {
        textarea.value = text;
        textarea.focus();
      }
    });
  });

  const sendMessage = () => {
    const content = textarea?.value.trim();
    if (!content) return;

    const state = getState();
    const user = state.currentUser;
    const isInternal = internalCheck?.checked || false;

    const newMsg: SupportMessage = {
      message_id: `MSG${String(messageData.length + 1).padStart(3, '0')}`,
      ticket_id: ticket.ticket_id,
      sender_id: user?.staff_id || 'STF003',
      sender_name: user?.full_name || 'Lê Minh Cường',
      sender_role: user?.role || 'teacher',
      content: content,
      sent_at: new Date().toISOString(),
      is_internal_note: isInternal,
    };

    messageData.push(newMsg);
    if (ticket.status === 'new' || ticket.status === 'waiting_student') {
      ticket.status = 'in_progress';
    }

    if (textarea) textarea.value = '';
    showToast(`Đã gửi tin nhắn cho ${studentName}!`, 'success');

    // Append message HTML directly into container
    const timeStr = formatDateTime(newMsg.sent_at);
    const newMsgHtml = `
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;animation:fadeIn 0.2s ease">
        <div style="font-size:11px;font-weight:700;color:#A93226;display:flex;align-items:center;gap:6px">
          <span>${escapeHtml(newMsg.sender_name)}</span>
          ${isInternal ? '<span style="background:#FEF3C7;color:#B45309;padding:1px 5px;border-radius:4px;font-size:10px">🔒 Ghi chú nội bộ</span>' : ''}
        </div>
        <div style="
          max-width:80%;
          padding:10px 15px;
          border-radius:16px 16px 4px 16px;
          font-size:13.5px;
          line-height:1.5;
          ${isInternal 
            ? 'background:#FFFBEB;color:#78350F;border:1px solid #FDE68A;' 
            : 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 6px rgba(169,50,38,0.2);'
          }
        ">
          ${escapeHtml(newMsg.content)}
        </div>
        <div style="font-size:10.5px;color:#A8A29A;margin-top:1px">
          ${timeStr}
        </div>
      </div>
    `;

    // Remove empty placeholder if any
    if (container && container.innerHTML.includes('Chưa có tin nhắn nào trước đây')) {
      container.innerHTML = '';
    }
    container?.insertAdjacentHTML('beforeend', newMsgHtml);
    scrollToBottom();
  };

  sendBtn?.addEventListener('click', sendMessage);
  textarea?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function reRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderStudentsPage();
    initStudentsPage();
  }
}
