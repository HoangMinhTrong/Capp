// ============================================
// EduTrack - Progress Tracking Page (Tiến độ Học tập)
// ============================================

import type { ProgressSnapshot, InterventionRecord } from '../types.ts';
import {
  classData, studentData,
  progressSnapshotData, interventionData
} from '../data.ts';
import { getState } from '../state.ts';
import {
  icons, formatDate, formatPercent,
  alertLevelLabels, alertLevelBadgeClass,
  trendLabels, trendBadgeClass, showToast
} from '../utils.ts';

function getStudentName(studentId: string): string {
  return studentData.find(s => s.student_id === studentId)?.full_name ?? studentId;
}

function getClassCode(classId: string): string {
  return classData.find(c => c.class_id === classId)?.class_code ?? '';
}

function getFilteredClasses() {
  const campus = getState().selectedCampus;
  if (campus === 'all') return classData;
  return classData.filter(c => c.campus === campus);
}

function getLatestSnapshots(): ProgressSnapshot[] {
  const filteredClasses = getFilteredClasses();
  const filteredClassIds = new Set(filteredClasses.map(c => c.class_id));

  // Group by student+class, get latest period
  const latestMap = new Map<string, ProgressSnapshot>();
  for (const snap of progressSnapshotData) {
    if (!filteredClassIds.has(snap.class_id)) continue;
    const key = `${snap.student_id}-${snap.class_id}`;
    const existing = latestMap.get(key);
    if (!existing || snap.generated_at > existing.generated_at) {
      latestMap.set(key, snap);
    }
  }
  return Array.from(latestMap.values());
}

function renderRiskOverview(snapshots: ProgressSnapshot[]): string {
  const normalCount = snapshots.filter(s => s.alert_level === 'normal').length;
  const watchCount = snapshots.filter(s => s.alert_level === 'watch').length;
  const priorityCount = snapshots.filter(s => s.alert_level === 'priority').length;

  return `
    <div class="grid-cols-3" style="margin-bottom:var(--space-6)">
      <div class="kpi-card animate-fade-in-up stagger-1">
        <div class="kpi-icon" style="background:var(--green-50);color:var(--green-600)">${icons.check}</div>
        <div class="kpi-content">
          <span class="kpi-label">Bình thường</span>
          <span class="kpi-value" style="color:var(--green-600)">${normalCount}</span>
          <span class="kpi-change" style="color:var(--text-tertiary)">học viên ổn định</span>
        </div>
      </div>
      <div class="kpi-card animate-fade-in-up stagger-2">
        <div class="kpi-icon" style="background:var(--amber-50);color:var(--amber-600)">${icons.warning}</div>
        <div class="kpi-content">
          <span class="kpi-label">Cần theo dõi</span>
          <span class="kpi-value" style="color:var(--amber-600)">${watchCount}</span>
          <span class="kpi-change" style="color:var(--text-tertiary)">cần chú ý thêm</span>
        </div>
      </div>
      <div class="kpi-card animate-fade-in-up stagger-3">
        <div class="kpi-icon" style="background:var(--red-50);color:var(--red-600)">${icons.alertCircle}</div>
        <div class="kpi-content">
          <span class="kpi-label">Cần hỗ trợ ưu tiên</span>
          <span class="kpi-value" style="color:var(--red-600)">${priorityCount}</span>
          <span class="kpi-change" style="color:var(--text-tertiary)">cần can thiệp ngay</span>
        </div>
      </div>
    </div>
  `;
}

function attendanceColorClass(rate: number | null): string {
  if (rate === null) return 'color:var(--text-tertiary)';
  if (rate >= 85) return 'color:var(--green-600)';
  if (rate >= 70) return 'color:var(--amber-600)';
  return 'color:var(--red-600)';
}

function renderProgressTable(snapshots: ProgressSnapshot[]): string {
  if (snapshots.length === 0) {
    return `
      <div class="empty-state" style="padding:var(--space-8)">
        <div style="font-size:48px;margin-bottom:var(--space-3);opacity:0.3">${icons.progress}</div>
        <h3>Chưa có dữ liệu tiến độ</h3>
        <p>Không tìm thấy snapshot tiến độ nào phù hợp với bộ lọc.</p>
      </div>
    `;
  }

  return `
    <div class="card animate-fade-in-up" style="margin-bottom:var(--space-6)">
      <div class="card-header">
        <h3 style="margin:0;font-size:var(--text-base);font-weight:600;display:flex;align-items:center;gap:var(--space-2)">
          ${icons.students} Tiến độ học viên
        </h3>
      </div>
      <div class="card-body" style="padding:0;overflow-x:auto">
        <table class="data-table" id="progress-table">
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Lớp</th>
              <th>Kỳ</th>
              <th>Chuyên cần</th>
              <th>Điểm KT TB</th>
              <th>Điểm Quiz TB</th>
              <th>Xu hướng</th>
              <th>Mức cảnh báo</th>
              <th>Độ đầy đủ</th>
            </tr>
          </thead>
          <tbody>
            ${snapshots.map(snap => {
              const student = studentData.find(s => s.student_id === snap.student_id);
              return `
                <tr class="progress-row" data-student-id="${snap.student_id}" data-alert-level="${snap.alert_level}" style="cursor:pointer" title="Xem chi tiết ${student?.full_name ?? ''}">
                  <td>
                    <div style="display:flex;align-items:center;gap:var(--space-2)">
                      <div class="avatar avatar-sm">${student?.avatar_initials ?? '?'}</div>
                      <a href="#/students/${snap.student_id}" style="color:var(--primary-600);text-decoration:none;font-weight:500">
                        ${student?.full_name ?? snap.student_id}
                      </a>
                    </div>
                  </td>
                  <td>
                    <span style="font-size:var(--text-sm)">${getClassCode(snap.class_id)}</span>
                  </td>
                  <td style="font-size:var(--text-sm);color:var(--text-secondary)">${snap.period}</td>
                  <td>
                    <span style="font-weight:600;${attendanceColorClass(snap.attendance_rate)}">
                      ${formatPercent(snap.attendance_rate)}
                    </span>
                  </td>
                  <td style="font-weight:500">${snap.avg_assessment_score !== null ? snap.avg_assessment_score.toFixed(1) : '—'}</td>
                  <td style="font-weight:500">${snap.avg_quiz_score !== null ? snap.avg_quiz_score.toFixed(1) : '—'}</td>
                  <td><span class="badge ${trendBadgeClass[snap.trend]}">${trendLabels[snap.trend]}</span></td>
                  <td><span class="badge ${alertLevelBadgeClass[snap.alert_level]}">${alertLevelLabels[snap.alert_level]}</span></td>
                  <td style="min-width:100px">
                    <div style="display:flex;align-items:center;gap:var(--space-2)">
                      <div class="progress-bar" style="flex:1;height:6px">
                        <div class="progress-bar-fill" style="width:${snap.data_completeness}%;background:var(--primary-500)"></div>
                      </div>
                      <span style="font-size:var(--text-xs);color:var(--text-tertiary);min-width:30px">${snap.data_completeness}%</span>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInterventions(): string {
  const filteredClasses = getFilteredClasses();
  const filteredClassIds = new Set(filteredClasses.map(c => c.class_id));
  const interventions = interventionData.filter(i => filteredClassIds.has(i.class_id));

  if (interventions.length === 0) {
    return `
      <div class="card">
        <div class="card-header">
          <h3 style="margin:0;font-size:var(--text-base);font-weight:600;display:flex;align-items:center;gap:var(--space-2)">
            ${icons.target} Bản ghi can thiệp
          </h3>
        </div>
        <div class="card-body">
          <div class="empty-state" style="padding:var(--space-4)">
            <p style="color:var(--text-tertiary)">Chưa có bản ghi can thiệp nào.</p>
          </div>
        </div>
      </div>
    `;
  }

  const statusLabels: Record<string, string> = {
    planned: 'Đã lên kế hoạch',
    in_progress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  const statusBadge: Record<string, string> = {
    planned: 'badge-blue',
    in_progress: 'badge-amber',
    completed: 'badge-green',
    cancelled: 'badge-gray',
  };

  return `
    <div class="card animate-fade-in-up">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0;font-size:var(--text-base);font-weight:600;display:flex;align-items:center;gap:var(--space-2)">
          ${icons.target} Bản ghi can thiệp
          <span class="badge badge-gray">${interventions.length}</span>
        </h3>
        <button class="btn btn-primary btn-sm" id="btn-add-intervention">
          ${icons.plus} Thêm can thiệp
        </button>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${interventions.map(intv => `
          <div style="border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:var(--space-4);background:var(--gray-50)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-2)">
              <div style="display:flex;align-items:center;gap:var(--space-2)">
                <div class="avatar avatar-sm">${studentData.find(s => s.student_id === intv.student_id)?.avatar_initials ?? '?'}</div>
                <div>
                  <a href="#/students/${intv.student_id}" style="font-weight:600;color:var(--primary-600);text-decoration:none">
                    ${getStudentName(intv.student_id)}
                  </a>
                  <span style="font-size:var(--text-sm);color:var(--text-tertiary);margin-left:var(--space-2)">${getClassCode(intv.class_id)}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-2)">
                <span class="badge ${statusBadge[intv.status] ?? 'badge-gray'}">${statusLabels[intv.status] ?? intv.status}</span>
                <span style="font-size:var(--text-xs);color:var(--text-tertiary)">${formatDate(intv.created_at)}</span>
              </div>
            </div>
            <div style="margin-bottom:var(--space-2)">
              <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-1)">
                <strong>Vấn đề:</strong> ${intv.issue}
              </div>
              <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-1)">
                <strong>Hành động:</strong> ${intv.action}
              </div>
              ${intv.result ? `
                <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-1)">
                  <strong>Kết quả:</strong> ${intv.result}
                </div>
              ` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-4);font-size:var(--text-xs);color:var(--text-tertiary)">
              <span>Thực hiện: ${intv.performed_by_name}</span>
              ${intv.follow_up_date ? `<span>Theo dõi: ${formatDate(intv.follow_up_date)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderProgressPage(): string {
  const classes = getFilteredClasses();
  const latestSnapshots = getLatestSnapshots();

  return `
    <div class="animate-fade-in-up">
      <div class="page-title-section">
        <div>
          <h1 class="page-title">${icons.progress} Tiến độ Học tập</h1>
          <p class="page-subtitle">Theo dõi tiến độ, phát hiện rủi ro và can thiệp kịp thời</p>
        </div>
      </div>

      ${renderRiskOverview(latestSnapshots)}

      <div class="filter-bar" style="margin-bottom:var(--space-6)">
        <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap">
          <label class="form-label" style="margin:0;white-space:nowrap">${icons.filter} Bộ lọc:</label>
          <select id="progress-class-filter" class="form-select" style="min-width:250px">
            <option value="">Tất cả lớp học</option>
            ${classes.map(c => `<option value="${c.class_id}">${c.class_name} (${c.class_code})</option>`).join('')}
          </select>
          <select id="progress-alert-filter" class="form-select" style="min-width:180px">
            <option value="">Tất cả mức cảnh báo</option>
            <option value="normal">Bình thường</option>
            <option value="watch">Cần theo dõi</option>
            <option value="priority">Cần hỗ trợ ưu tiên</option>
          </select>
        </div>
      </div>

      <div id="progress-table-container">
        ${renderProgressTable(latestSnapshots)}
      </div>

      <div id="progress-interventions" style="margin-top:var(--space-6)">
        ${renderInterventions()}
      </div>

      <!-- Modal Container -->
      <div id="progress-modal-container"></div>
    </div>
  `;
}

function applyFilters(): void {
  const classFilter = document.getElementById('progress-class-filter') as HTMLSelectElement | null;
  const alertFilter = document.getElementById('progress-alert-filter') as HTMLSelectElement | null;
  const container = document.getElementById('progress-table-container');
  if (!container) return;

  let snapshots = getLatestSnapshots();

  const selectedClass = classFilter?.value || '';
  const selectedAlert = alertFilter?.value || '';

  if (selectedClass) {
    snapshots = snapshots.filter(s => s.class_id === selectedClass);
  }
  if (selectedAlert) {
    snapshots = snapshots.filter(s => s.alert_level === selectedAlert);
  }

  container.innerHTML = renderProgressTable(snapshots);

  // Re-attach row click handlers
  container.querySelectorAll('.progress-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') return; // let link handle
      const studentId = (row as HTMLElement).dataset.studentId;
      if (studentId) window.location.hash = `#/students/${studentId}`;
    });
  });
}

export function initProgressPage(): void {
  const classFilter = document.getElementById('progress-class-filter') as HTMLSelectElement | null;
  const alertFilter = document.getElementById('progress-alert-filter') as HTMLSelectElement | null;
  const modalContainer = document.getElementById('progress-modal-container');

  classFilter?.addEventListener('change', applyFilters);
  alertFilter?.addEventListener('change', applyFilters);

  // Attach row click handlers
  document.querySelectorAll('.progress-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') return;
      const studentId = (row as HTMLElement).dataset.studentId;
      if (studentId) window.location.hash = `#/students/${studentId}`;
    });
  });

  // Add intervention button
  function bindInterventionButton() {
    document.getElementById('btn-add-intervention')?.addEventListener('click', () => {
      if (!modalContainer) return;
      const activeStudents = studentData.filter(s => s.status === 'active');
      const activeClasses = classData.filter(c => c.status === 'in_progress');

      modalContainer.innerHTML = `
        <div class="modal-backdrop" id="intervention-modal-backdrop">
          <div class="modal" style="max-width:560px">
            <div class="modal-header">
              <h3 style="margin:0;font-size:var(--text-lg);font-weight:600;display:flex;align-items:center;gap:var(--space-2)">
                ${icons.target} Thêm bản ghi can thiệp học viên
              </h3>
              <button class="btn btn-ghost btn-icon" id="close-intervention-modal">${icons.close}</button>
            </div>
            <form id="intervention-form">
              <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--space-4)">
                <div class="grid-cols-2" style="gap:var(--space-3)">
                  <div class="form-group">
                    <label class="form-label">Học viên cần can thiệp <span class="required">*</span></label>
                    <select class="form-select" id="intv-student" required>
                      ${activeStudents.map(s => `<option value="${s.student_id}">${s.full_name} (${s.student_code})</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Lớp học <span class="required">*</span></label>
                    <select class="form-select" id="intv-class" required>
                      ${activeClasses.map(c => `<option value="${c.class_id}">${c.class_name} (${c.class_code})</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Vấn đề phát hiện <span class="required">*</span></label>
                  <textarea class="form-textarea" id="intv-issue" placeholder="Ví dụ: Chuyên cần giảm dưới 70%, vắng 2 buổi liên tiếp..." style="min-height:70px" required></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Hành động can thiệp <span class="required">*</span></label>
                  <textarea class="form-textarea" id="intv-action" placeholder="Ví dụ: Trợ giảng gọi điện thoại trao đổi, xếp lịch kèm bù..." style="min-height:70px" required></textarea>
                </div>

                <div class="grid-cols-2" style="gap:var(--space-3)">
                  <div class="form-group">
                    <label class="form-label">Trạng thái <span class="required">*</span></label>
                    <select class="form-select" id="intv-status">
                      <option value="planned">Đã lên kế hoạch</option>
                      <option value="in_progress" selected>Đang thực hiện</option>
                      <option value="completed">Đã hoàn thành</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ngày theo dõi lại</label>
                    <input type="date" class="form-input" id="intv-follow-up" value="${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}" />
                  </div>
                </div>
              </div>

              <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:var(--space-2);padding:var(--space-4) var(--space-6);border-top:1px solid var(--border-light)">
                <button type="button" class="btn btn-secondary" id="cancel-intv-modal">Hủy</button>
                <button type="submit" class="btn btn-primary">${icons.plus} Lưu bản ghi</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => { modalContainer.innerHTML = ''; };
      document.getElementById('close-intervention-modal')?.addEventListener('click', closeModal);
      document.getElementById('cancel-intv-modal')?.addEventListener('click', closeModal);
      document.getElementById('intervention-modal-backdrop')?.addEventListener('click', (ev) => {
        if (ev.target === document.getElementById('intervention-modal-backdrop')) closeModal();
      });

      document.getElementById('intervention-form')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const studentId = (document.getElementById('intv-student') as HTMLSelectElement).value;
        const classId = (document.getElementById('intv-class') as HTMLSelectElement).value;
        const issue = (document.getElementById('intv-issue') as HTMLTextAreaElement).value.trim();
        const action = (document.getElementById('intv-action') as HTMLTextAreaElement).value.trim();
        const status = (document.getElementById('intv-status') as HTMLSelectElement).value as InterventionRecord['status'];
        const followUpDate = (document.getElementById('intv-follow-up') as HTMLInputElement).value || undefined;

        if (!studentId || !classId || !issue || !action) return;

        const newIntv: InterventionRecord = {
          intervention_id: `INT${String(interventionData.length + 1).padStart(3, '0')}`,
          student_id: studentId,
          class_id: classId,
          issue,
          action,
          performed_by: 'STF005',
          performed_by_name: 'Hoàng Văn Em',
          follow_up_date: followUpDate,
          created_at: new Date().toISOString(),
          status,
        };

        interventionData.unshift(newIntv);
        closeModal();
        const intvContainer = document.getElementById('progress-interventions');
        if (intvContainer) {
          intvContainer.innerHTML = renderInterventions();
          bindInterventionButton();
        }
        showToast('Đã thêm bản ghi can thiệp thành công!', 'success');
      });
    });
  }

  bindInterventionButton();
}
