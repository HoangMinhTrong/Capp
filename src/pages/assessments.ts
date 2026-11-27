// ============================================
// EduTrack - Assessments & Submissions Grading Hub
// Quản lý kiểm tra & Hàng đợi chấm bài nộp trực tuyến
// ============================================

import type { Assessment, AssessmentResult, AssessmentType, StudentAssignment } from '../types.ts';
import {
  classData, assessmentData, assessmentResultData, studentData, enrollmentData,
  studentAssignmentData, studentSubmissionData, saveStudentSubmissions, saveStudentAssignments, classAssignmentData
} from '../data.ts';
import { getState } from '../state.ts';
import { icons, formatDate, formatScore, formatTimeAgo, showToast } from '../utils.ts';
import { updateBadgeUI } from '../main.ts';

let currentAssessmentTab: 'submissions' | 'exams' = 'submissions';
let activeSubFilter: 'all' | 'pending' | 'graded' = 'all';
let selectedAssignmentFilter: string = 'all';
let selectedClassFilter: string = 'all';
let subViewMode: 'queue' | 'cards' = 'queue';

const assessmentTypeLabels: Record<AssessmentType, string> = {
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
  quiz: 'Quiz',
  assignment: 'Bài tập',
  project: 'Dự án',
};

const assessmentTypeBadgeClass: Record<AssessmentType, string> = {
  midterm: 'badge-amber',
  final: 'badge-red',
  quiz: 'badge-blue',
  assignment: 'badge-teal',
  project: 'badge-green',
};

function getStudentName(studentId: string): string {
  return studentData.find(s => s.student_id === studentId)?.full_name ?? studentId;
}

function getFilteredClasses() {
  const campus = getState().selectedCampus;
  if (campus === 'all') return classData;
  return classData.filter(c => c.campus === campus);
}

// === Submissions Queue Component (Có bộ lọc chọn mục bài tập & lớp học) ===
function renderSubmissionsQueue(): string {
  const state = getState();
  const user = state.currentUser;
  const classes = getFilteredClasses();

  // Filter submissions by teacher classes if teacher
  const relevantSubs = studentSubmissionData.filter(sub => {
    const asn = studentAssignmentData.find(a => a.id === sub.assignment_id);
    if (!asn) return true;
    const cls = classData.find(c => c.class_id === asn.class_id);
    if (state.selectedCampus !== 'all' && cls?.campus !== state.selectedCampus) return false;

    // Filter by selected class dropdown
    if (selectedClassFilter !== 'all' && asn.class_id !== selectedClassFilter) return false;

    // Filter by selected assignment dropdown
    if (selectedAssignmentFilter !== 'all' && sub.assignment_id !== selectedAssignmentFilter) return false;

    if (user?.role === 'teacher') {
      const isAssigned = classAssignmentData.some(ca => ca.teacher_id === user.staff_id && ca.class_id === asn.class_id);
      if (!isAssigned && cls?.campus !== user.campus && user.staff_id !== 'STF001' && user.staff_id !== 'STF002') return false;
    }
    return true;
  });

  const pendingCount = relevantSubs.filter(s => s.status === 'submitted').length;
  const gradedCount = relevantSubs.filter(s => s.status === 'graded').length;

  const displayedSubs = relevantSubs.filter(s => {
    if (activeSubFilter === 'pending') return s.status === 'submitted';
    if (activeSubFilter === 'graded') return s.status === 'graded';
    return true;
  });

  // Selected Assignment Info if specific assignment chosen
  const selectedAsn = selectedAssignmentFilter !== 'all' 
    ? studentAssignmentData.find(a => a.id === selectedAssignmentFilter) 
    : null;
  const selectedCls = selectedAsn ? classData.find(c => c.class_id === selectedAsn.class_id) : null;
  const asnPendingCount = selectedAsn 
    ? studentSubmissionData.filter(s => s.assignment_id === selectedAsn.id && s.status === 'submitted').length 
    : 0;

  return `
    <div>
      <!-- Filter Bar: Chọn mục bài tập & Lớp học & Trạng thái -->
      <div style="background:var(--bg-secondary);padding:16px 20px;border-radius:var(--radius-xl);border:1px solid var(--border-light);box-shadow:var(--shadow-xs);margin-bottom:16px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <!-- Selectors: Assignment & Class -->
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px">
              <label style="font-size:12.5px;font-weight:700;color:var(--text-primary);white-space:nowrap">📝 Chọn mục bài tập:</label>
              <select id="sub-assignment-select" class="form-select" style="min-width:270px;font-weight:600;font-size:13px;border-radius:10px">
                <option value="all">📁 Tất cả mục bài tập (${studentAssignmentData.length} bài)</option>
                ${studentAssignmentData.map(a => {
                  const c = classData.find(cl => cl.class_id === a.class_id);
                  const pCount = studentSubmissionData.filter(s => s.assignment_id === a.id && s.status === 'submitted').length;
                  return `<option value="${a.id}" ${selectedAssignmentFilter === a.id ? 'selected' : ''}>${a.id} - ${a.title} (${c?.class_code || a.class_id}) [${pCount} chờ chấm]</option>`;
                }).join('')}
              </select>
            </div>

            <div style="display:flex;align-items:center;gap:6px">
              <label style="font-size:12.5px;font-weight:700;color:var(--text-primary);white-space:nowrap">🏫 Lớp:</label>
              <select id="sub-class-select" class="form-select" style="min-width:180px;font-size:13px;border-radius:10px">
                <option value="all">Tất cả lớp học</option>
                ${classes.map(c => `
                  <option value="${c.class_id}" ${selectedClassFilter === c.class_id ? 'selected' : ''}>${c.class_name} (${c.class_code})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- View Mode Toggle -->
          <div style="display:flex;gap:4px;background:var(--gray-100);padding:3px;border-radius:10px">
            <button type="button" class="btn btn-sm btn-sub-view-mode ${subViewMode === 'queue' ? 'btn-primary' : 'btn-ghost'}" data-mode="queue" style="font-size:12px;padding:4px 12px;border-radius:8px">
              📑 Hàng đợi bài nộp (${relevantSubs.length})
            </button>
            <button type="button" class="btn btn-sm btn-sub-view-mode ${subViewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}" data-mode="cards" style="font-size:12px;padding:4px 12px;border-radius:8px">
              📋 Danh mục thẻ bài tập (${studentAssignmentData.length})
            </button>
          </div>
        </div>

        <!-- Row 2: Status Pills -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-top:1px solid var(--border-light);padding-top:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:12px;font-weight:700;color:var(--text-secondary)">Trạng thái:</span>
            <div style="display:flex;gap:4px;background:var(--gray-100);padding:2px;border-radius:8px">
              <button type="button" class="btn btn-sm btn-sub-filter ${activeSubFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" data-filter="all" style="font-size:11px;padding:3px 10px;cursor:pointer">
                Tất cả (${relevantSubs.length})
              </button>
              <button type="button" class="btn btn-sm btn-sub-filter ${activeSubFilter === 'pending' ? 'btn-primary' : 'btn-ghost'}" data-filter="pending" style="font-size:11px;padding:3px 10px;cursor:pointer;color:${activeSubFilter === 'pending' ? '#fff' : 'var(--danger-600)'}">
                Chờ chấm (${pendingCount})
              </button>
              <button type="button" class="btn btn-sm btn-sub-filter ${activeSubFilter === 'graded' ? 'btn-primary' : 'btn-ghost'}" data-filter="graded" style="font-size:11px;padding:3px 10px;cursor:pointer;color:${activeSubFilter === 'graded' ? '#fff' : 'var(--success-700)'}">
                Đã chấm (${gradedCount})
              </button>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-tertiary)">
            ⚡ Giáo viên chấm điểm theo Rubric và gửi nhận xét trực tiếp tới học viên
          </div>
        </div>
      </div>

      <!-- Banner if specific assignment is selected -->
      ${selectedAsn ? `
        <div style="background:linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);border:1px solid #c7d2fe;border-radius:14px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 2px 6px rgba(79,70,229,0.06)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:38px;height:38px;border-radius:10px;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px">
              📝
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-weight:700;font-size:14px;color:#0f172a">Đang chọn chấm: ${selectedAsn.title}</span>
                <span class="badge badge-blue">${selectedCls?.class_name || selectedAsn.class_id}</span>
                <span class="badge badge-gray">${selectedAsn.id}</span>
              </div>
              <p style="margin:2px 0 0 0;font-size:12px;color:#64748b">
                Hạn nộp: <strong>${formatDate(selectedAsn.deadline)}</strong> · Thang điểm: <strong>${selectedAsn.max_score}đ</strong> · Người giao: <strong>${selectedAsn.assigned_by}</strong>
              </p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="badge badge-amber" style="font-size:11px;font-weight:700">${asnPendingCount} bài chờ chấm</span>
            <button class="btn btn-secondary btn-sm" id="btn-clear-asn-filter" style="font-size:11px;padding:4px 10px;border-radius:8px">
              ✕ Bỏ chọn bài tập (Xem tất cả)
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Main Body: Queue Table OR Cards Grid -->
      ${subViewMode === 'cards' ? renderAssignmentCards() : renderSubmissionsTable(displayedSubs)}
    </div>
  `;
}

// === Sub-component: Assignment Cards View ===
function renderAssignmentCards(): string {
  const asns = selectedClassFilter === 'all' 
    ? studentAssignmentData 
    : studentAssignmentData.filter(a => a.class_id === selectedClassFilter);

  if (asns.length === 0) {
    return `
      <div class="empty-state" style="padding:var(--space-8);text-align:center;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
        <div style="color:var(--text-tertiary);margin-bottom:var(--space-2)">${icons.check}</div>
        <p style="margin:0;color:var(--text-tertiary);font-size:var(--text-sm)">Không có bài tập nào cho lớp học này.</p>
      </div>
    `;
  }

  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px">
      ${asns.map(asn => {
        const cls = classData.find(c => c.class_id === asn.class_id);
        const enrolled = enrollmentData.filter(e => e.class_id === asn.class_id && e.status === 'active');
        const subs = studentSubmissionData.filter(s => s.assignment_id === asn.id);
        const pendingCount = subs.filter(s => s.status === 'submitted').length;
        const gradedCount = subs.filter(s => s.status === 'graded').length;
        const pct = enrolled.length > 0 ? Math.round((subs.length / enrolled.length) * 100) : 0;

        return `
          <div class="card animate-fade-in-up" style="border:1px solid var(--border-light);border-radius:16px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;box-shadow:0 2px 8px rgba(15,23,42,0.04)">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <span class="badge badge-blue" style="font-weight:700">${cls?.class_code || asn.class_id}</span>
                <span style="font-size:11px;font-weight:600;color:var(--text-tertiary)">${asn.id}</span>
              </div>
              <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 6px 0;line-height:1.35">
                ${asn.title}
              </h3>
              <p style="font-size:12px;color:var(--text-secondary);margin:0 0 10px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                ${asn.description}
              </p>
              
              <div style="font-size:11.5px;color:var(--text-tertiary);display:flex;flex-direction:column;gap:3px;margin-bottom:12px">
                <div>📅 Hạn nộp: <strong style="color:var(--text-primary)">${formatDate(asn.deadline)}</strong></div>
                <div>👤 Giao bởi: <strong>${asn.assigned_by}</strong></div>
                <div>🎯 Thang điểm: <strong>${asn.max_score}đ</strong> · Hình thức: <strong>${asn.format === 'file' ? 'Tệp đính kèm' : asn.format === 'link' ? 'Đường dẫn link' : 'Nhập văn bản'}</strong></div>
              </div>

              <!-- Progress bar -->
              <div style="background:var(--gray-100);border-radius:8px;padding:8px 10px;margin-bottom:6px">
                <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:4px">
                  <span>Tiến độ nộp: ${subs.length}/${enrolled.length} bạn</span>
                  <span style="color:var(--primary-600)">${pct}%</span>
                </div>
                <div class="progress-bar" style="height:6px;border-radius:9999px">
                  <div class="progress-bar-fill" style="width:${pct}%;background:${pct >= 80 ? 'var(--green-500)' : pct >= 50 ? 'var(--primary-600)' : 'var(--amber-500)'}"></div>
                </div>
              </div>

              <div style="display:flex;gap:6px">
                <span class="badge ${pendingCount > 0 ? 'badge-amber' : 'badge-green'}" style="font-size:10px">
                  ${pendingCount > 0 ? `${pendingCount} bài chờ chấm` : 'Đã chấm hết'}
                </span>
                <span class="badge badge-gray" style="font-size:10px">${gradedCount} bài đã chấm</span>
              </div>
            </div>

            <button type="button" class="btn btn-primary btn-sm btn-grade-this-asn" data-asn-id="${asn.id}" style="width:100%;border-radius:10px;padding:8px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px">
              ${icons.edit} Chấm bài tập này (${pendingCount} bài chờ) 📝
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// === Sub-component: Submissions Table ===
function renderSubmissionsTable(displayedSubs: any[]): string {
  return `
    <div class="card" style="border:1px solid var(--border-light);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-sm)">
      <div class="card-body" style="padding:0">
        ${displayedSubs.length === 0 ? `
          <div class="empty-state" style="padding:var(--space-8);text-align:center">
            <div style="color:var(--text-tertiary);margin-bottom:var(--space-2)">${icons.check}</div>
            <p style="margin:0;color:var(--text-tertiary);font-size:var(--text-sm)">Không tìm thấy bài nộp nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Bài tập &amp; Lớp học</th>
                <th>Tệp bài nộp &amp; Ghi chú</th>
                <th>Thời gian nộp</th>
                <th>Trạng thái</th>
                <th style="text-align:right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${displayedSubs.map(sub => {
                const student = studentData.find(s => s.student_id === sub.student_id);
                const asn = studentAssignmentData.find(a => a.id === sub.assignment_id);
                const cls = classData.find(c => c.class_id === asn?.class_id);
                const isGraded = sub.status === 'graded';

                return `
                  <tr style="background:${isGraded ? 'transparent' : 'rgba(245, 158, 11, 0.03)'}">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${isGraded ? 'var(--primary-600)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};color:#fff;font-weight:700">
                          ${student?.avatar_initials ?? '??'}
                        </div>
                        <div>
                          <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${student?.full_name ?? sub.student_id}</div>
                          <div style="font-size:11px;color:var(--text-tertiary)">${student?.student_code ?? ''} · Cơ sở: ${student?.campus ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${asn?.title ?? sub.assignment_id}</div>
                      <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">
                        ${cls?.class_name ?? ''} <span class="badge badge-gray" style="font-size:10px">${cls?.class_code ?? ''}</span>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex;flex-direction:column;gap:3px">
                        <div style="display:flex;align-items:center;gap:6px">
                          <span style="font-size:12px;font-weight:600;color:var(--primary-700)">📄 ${sub.attachment_name || 'Bài làm trực tuyến'}</span>
                          ${sub.attachment_size ? `<span style="font-size:10px;color:var(--text-tertiary)">(${sub.attachment_size})</span>` : ''}
                          <button type="button" class="btn btn-ghost btn-icon btn-sm btn-preview-file" data-file-name="${sub.attachment_name || 'BaiLam.pdf'}" title="Xem trước bài làm" style="width:20px;height:20px;padding:0">
                            👁️
                          </button>
                        </div>
                        ${sub.submission_link ? `
                          <a href="${sub.submission_link}" target="_blank" style="font-size:11px;color:var(--primary-600);text-decoration:none">
                            🔗 ${sub.submission_link.slice(0, 35)}...
                          </a>
                        ` : ''}
                        ${sub.submission_text ? `
                          <div style="font-size:11px;color:var(--text-secondary);font-style:italic">
                            "${sub.submission_text.slice(0, 50)}..."
                          </div>
                        ` : ''}
                      </div>
                    </td>
                    <td>
                      <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${formatTimeAgo(sub.submitted_at)}</div>
                      <div style="font-size:10px;color:var(--text-tertiary)">${formatDate(sub.submitted_at)}</div>
                    </td>
                    <td>
                      ${isGraded ? `
                        <div style="display:flex;flex-direction:column;gap:2px">
                          <span class="badge badge-green" style="font-size:11px;font-weight:700">✓ Đã chấm: ${sub.score}/${asn?.max_score || 100}đ</span>
                          ${sub.teacher_feedback ? `<span style="font-size:10px;color:var(--text-tertiary)">"${sub.teacher_feedback.slice(0, 24)}..."</span>` : ''}
                        </div>
                      ` : `
                        <span class="badge badge-amber" style="font-size:11px;font-weight:700">
                          <span class="badge-dot"></span>Chờ chấm điểm
                        </span>
                      `}
                    </td>
                    <td style="text-align:right">
                      <button type="button" class="btn ${isGraded ? 'btn-secondary' : 'btn-primary'} btn-sm btn-open-grade-sub" data-sub-id="${sub.id}" style="font-size:11px;padding:4px 12px;display:inline-flex;align-items:center;gap:4px">
                        ${icons.edit} ${isGraded ? 'Sửa điểm & Góp ý' : 'Chấm bài ngay 📝'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    </div>
  `;
}

// === Exam / Test Component ===
function renderResultsTable(assessment: Assessment, results: AssessmentResult[]): string {
  if (results.length === 0) {
    return `<div class="empty-state" style="padding:var(--space-4)">
      <p style="color:var(--text-tertiary);font-size:var(--text-sm)">Chưa có kết quả nào</p>
    </div>`;
  }

  return `
    <table class="data-table" style="margin-top:var(--space-3)">
      <thead>
        <tr>
          <th>Học viên</th>
          <th>Điểm</th>
          <th>Tỷ lệ</th>
          <th>Ngày nhập</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => {
          const pct = r.score !== null ? Math.round((r.score / assessment.max_score) * 100) : 0;
          const barColor = pct >= 80 ? 'var(--green-500)' : pct >= 60 ? 'var(--amber-500)' : 'var(--red-500)';
          return `
            <tr>
              <td>
                <a href="#/students/${r.student_id}" style="color:var(--primary-600);text-decoration:none;font-weight:500">
                  ${getStudentName(r.student_id)}
                </a>
              </td>
              <td style="font-weight:600">${formatScore(r.score, assessment.max_score)}</td>
              <td style="min-width:140px">
                <div style="display:flex;align-items:center;gap:var(--space-2)">
                  <div class="progress-bar" style="flex:1;height:8px">
                    <div class="progress-bar-fill" style="width:${pct}%;background:${barColor}"></div>
                  </div>
                  <span style="font-size:var(--text-xs);color:var(--text-secondary);min-width:35px">${r.score !== null ? pct + '%' : '—'}</span>
                </div>
              </td>
              <td style="font-size:var(--text-sm);color:var(--text-tertiary)">${formatDate(r.entered_at)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderAssessmentCard(assessment: Assessment): string {
  const results = assessmentResultData.filter(r => r.assessment_id === assessment.assessment_id);
  const enrolledStudents = enrollmentData.filter(e => e.class_id === assessment.class_id && e.status === 'active');
  const completedCount = results.filter(r => r.score !== null).length;
  const avgScore = results.filter(r => r.score !== null).length > 0
    ? results.filter(r => r.score !== null).reduce((sum, r) => sum + (r.score ?? 0), 0) / results.filter(r => r.score !== null).length
    : null;

  return `
    <div class="card animate-fade-in-up" style="margin-bottom:var(--space-4)">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-2)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            ${icons.assessment}
            <h3 style="margin:0;font-size:var(--text-base);font-weight:600">${assessment.title}</h3>
          </div>
          <span class="badge ${assessmentTypeBadgeClass[assessment.type]}">${assessmentTypeLabels[assessment.type]}</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-4);font-size:var(--text-sm);color:var(--text-secondary)">
          <span style="display:flex;align-items:center;gap:var(--space-1)">${icons.calendar} ${formatDate(assessment.date)}</span>
          <span style="font-weight:600">Điểm tối đa: ${assessment.max_score}</span>
          ${assessment.weight ? `<span>Trọng số: ${assessment.weight}%</span>` : ''}
          <span>${completedCount}/${enrolledStudents.length} đã nộp</span>
          ${avgScore !== null ? `<span>TB: <strong>${avgScore.toFixed(1)}</strong></span>` : ''}
          <button class="btn btn-primary btn-sm btn-grade-assessment" data-assessment-id="${assessment.assessment_id}" style="font-size:11px;padding:3px 8px">
            ${icons.edit} Nhập điểm
          </button>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        ${renderResultsTable(assessment, results)}
      </div>
    </div>
  `;
}

function renderOverviewByClass(): string {
  const classes = getFilteredClasses();
  return classes.map(cls => {
    const assessments = assessmentData.filter(a => a.class_id === cls.class_id);
    if (assessments.length === 0) return '';

    return `
      <div style="margin-bottom:var(--space-6)">
        <h2 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--space-3);color:var(--text-primary);display:flex;align-items:center;gap:var(--space-2)">
          ${icons.classes}
          ${cls.class_name}
          <span class="badge badge-gray" style="font-weight:400">${cls.class_code}</span>
          <span style="font-size:var(--text-sm);color:var(--text-tertiary);font-weight:400">${assessments.length} bài kiểm tra</span>
        </h2>
        ${assessments.map(a => renderAssessmentCard(a)).join('')}
      </div>
    `;
  }).join('');
}

// === Main Page Renderer ===
export function renderAssessmentsPage(): string {
  const classes = getFilteredClasses();
  const totalAssignments = studentAssignmentData.length;
  const pendingSubsCount = studentSubmissionData.filter(s => s.status === 'submitted').length;
  const gradedSubsCount = studentSubmissionData.filter(s => s.status === 'graded').length;
  const gradedWithScore = studentSubmissionData.filter(s => s.score !== null);
  const avgOverallScore = gradedWithScore.length > 0 
    ? Math.round(gradedWithScore.reduce((sum, s) => sum + (s.score ?? 0), 0) / gradedWithScore.length) 
    : '—';

  return `
    <div class="assessments-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>📝</span>
            <span>Quản trị Kiểm tra &amp; Chấm Bài Tập</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            Theo dõi bài nộp của học viên, chấm điểm rubric và quản lý bảng điểm định kỳ toàn trung tâm
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary btn-sm" id="btn-create-assignment" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:8px 18px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            ${icons.plus} Giao bài tập mới
          </button>
          <button class="btn btn-primary btn-sm" id="btn-create-assessment" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:8px 18px;border:none;background:#A93226;color:#FFFFFF;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            ${icons.plus} Tạo bài kiểm tra
          </button>
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${totalAssignments}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tổng bài tập được giao</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#EA580C;line-height:1;margin-bottom:8px">
            ${pendingSubsCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Bài chờ chấm điểm</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${gradedSubsCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Đã chấm thành công</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#2563EB;line-height:1;margin-bottom:8px">
            ${avgOverallScore}${typeof avgOverallScore === 'number' ? '/100' : ''}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Điểm trung bình toàn viện</div>
        </div>
      </div>

      <!-- 3. Main Segmented Navigation Tabs -->
      <div style="display:flex;gap:10px;margin-bottom:20px;background:#FFFFFF;border:1px solid #EAE4D8;padding:6px;border-radius:9999px;width:fit-content">
        <button type="button" class="btn btn-sm btn-asm-main-tab" data-tab="submissions" style="font-size:13px;padding:8px 20px;border-radius:9999px;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;${currentAssessmentTab === 'submissions' ? 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 8px rgba(169,50,38,0.25);' : 'background:transparent;color:#7F7A72;'}">
          ${icons.upload} Hàng Đợi Chấm Bài Tập Trực Tuyến ${pendingSubsCount > 0 ? `(${pendingSubsCount})` : ''}
        </button>
        <button type="button" class="btn btn-sm btn-asm-main-tab" data-tab="exams" style="font-size:13px;padding:8px 20px;border-radius:9999px;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;${currentAssessmentTab === 'exams' ? 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 8px rgba(169,50,38,0.25);' : 'background:transparent;color:#7F7A72;'}">
          ${icons.assessment} Bảng Điểm Kiểm Tra Định Kỳ (${assessmentData.length})
        </button>
      </div>

      ${currentAssessmentTab === 'submissions' ? `
        <!-- Submissions Queue Tab Body -->
        <div id="submissions-queue-container">
          ${renderSubmissionsQueue()}
        </div>
      ` : `
        <!-- Exams Tab Body -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:14px 20px;display:flex;align-items:center;gap:12px;margin-bottom:24px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <label style="margin:0;font-size:13px;font-weight:700;color:#2D2824;white-space:nowrap">${icons.filter} Lọc theo lớp:</label>
          <select id="assessment-class-filter" class="form-select" style="min-width:280px;height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none;cursor:pointer">
            <option value="">Tất cả lớp học</option>
            ${classes.map(c => `<option value="${c.class_id}">${c.class_name} (${c.class_code})</option>`).join('')}
          </select>
        </div>

        <div id="assessments-content">
          ${renderOverviewByClass()}
        </div>
      `}

      <!-- Modal Container -->
      <div id="assessment-modal-container"></div>
    </div>
  `;
}

// === Interactive Handlers ===
export function initAssessmentsPage(): void {
  const modalContainer = document.getElementById('assessment-modal-container');

  // Main Tabs Toggle
  document.querySelectorAll<HTMLElement>('.btn-asm-main-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab as 'submissions' | 'exams';
      if (tab) {
        currentAssessmentTab = tab;
        refreshAssessmentsPage();
      }
    });
  });

  // Submissions Sub-filter (Tất cả / Chờ chấm / Đã chấm)
  document.querySelectorAll<HTMLElement>('.btn-sub-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter as 'all' | 'pending' | 'graded';
      if (f) {
        activeSubFilter = f;
        refreshAssessmentsPage();
      }
    });
  });

  // Submissions Assignment Dropdown Filter (#sub-assignment-select)
  const subAsnSelect = document.getElementById('sub-assignment-select') as HTMLSelectElement | null;
  subAsnSelect?.addEventListener('change', () => {
    selectedAssignmentFilter = subAsnSelect.value;
    refreshAssessmentsPage();
  });

  // Submissions Class Dropdown Filter (#sub-class-select)
  const subClsSelect = document.getElementById('sub-class-select') as HTMLSelectElement | null;
  subClsSelect?.addEventListener('change', () => {
    selectedClassFilter = subClsSelect.value;
    if (selectedClassFilter !== 'all' && selectedAssignmentFilter !== 'all') {
      const currentAsn = studentAssignmentData.find(a => a.id === selectedAssignmentFilter);
      if (currentAsn && currentAsn.class_id !== selectedClassFilter) {
        selectedAssignmentFilter = 'all';
      }
    }
    refreshAssessmentsPage();
  });

  // Submissions View Mode Toggle (Queue Table vs Cards Grid)
  document.querySelectorAll<HTMLElement>('.btn-sub-view-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode as 'queue' | 'cards';
      if (mode) {
        subViewMode = mode;
        refreshAssessmentsPage();
      }
    });
  });

  // "Chấm bài tập này" button inside cards view
  document.querySelectorAll<HTMLElement>('.btn-grade-this-asn').forEach(btn => {
    btn.addEventListener('click', () => {
      const asnId = btn.dataset.asnId;
      if (asnId) {
        selectedAssignmentFilter = asnId;
        subViewMode = 'queue';
        refreshAssessmentsPage();
        const asn = studentAssignmentData.find(a => a.id === asnId);
        showToast(`Đã lọc danh sách bài làm cho: "${asn?.title || asnId}"`, 'info');
      }
    });
  });

  // "Bỏ chọn bài tập" reset button
  document.getElementById('btn-clear-asn-filter')?.addEventListener('click', () => {
    selectedAssignmentFilter = 'all';
    refreshAssessmentsPage();
  });

  // Preview Submitted File
  document.querySelectorAll<HTMLElement>('.btn-preview-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fileName = btn.dataset.fileName;
      showToast(`Mở tệp bài nộp: "${fileName}" (Xem trước)`, 'info');
    });
  });

  // Open Grading Modal for Submission
  document.querySelectorAll<HTMLElement>('.btn-open-grade-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.dataset.subId;
      if (subId) openGradeSubmissionModal(subId);
    });
  });

  // Create Assignment Modal (+ Giao bài tập mới)
  document.getElementById('btn-create-assignment')?.addEventListener('click', () => {
    if (!modalContainer) return;
    const availableClasses = classData.filter(c => c.status === 'in_progress');
    const user = getState().currentUser;

    modalContainer.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="create-asn-backdrop">
        <div class="modal animate-scale-up" style="max-width:580px;border-radius:16px;overflow:hidden">
          <div class="modal-header" style="background:var(--gray-50);padding:var(--space-4) var(--space-6);border-bottom:1px solid var(--border-light)">
            <h3 style="margin:0;font-size:var(--text-lg);font-weight:700;display:flex;align-items:center;gap:var(--space-2)">
              ${icons.upload} Giao bài tập trực tuyến mới
            </h3>
            <button class="btn btn-ghost btn-icon" id="close-create-asn-modal">${icons.close}</button>
          </div>
          <form id="create-asn-form">
            <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--space-4);padding:var(--space-6)">
              <div class="form-group">
                <label class="form-label" style="font-weight:600">Tiêu đề bài tập <span class="required">*</span></label>
                <input type="text" class="form-input" id="asn-title" placeholder="VD: Writing Task 1: Academic Line Graph Report" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:600">Lớp học tiếp nhận bài tập <span class="required">*</span></label>
                <select class="form-select" id="asn-class" required>
                  <option value="">-- Chọn lớp học --</option>
                  ${availableClasses.map(c => `<option value="${c.class_id}">${c.class_name} (${c.class_code})</option>`).join('')}
                </select>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
                <div class="form-group">
                  <label class="form-label" style="font-weight:600">Hình thức nộp bài <span class="required">*</span></label>
                  <select class="form-select" id="asn-format" required>
                    <option value="file">Tệp đính kèm (.doc, .docx, .pdf)</option>
                    <option value="link">Đường dẫn liên kết (Google Drive / Figma)</option>
                    <option value="text">Nhập văn bản trực tuyến</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-weight:600">Thang điểm tối đa <span class="required">*</span></label>
                  <input type="number" class="form-input" id="asn-max-score" value="100" min="10" max="1000" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:600">Hạn chót nộp bài (Deadline) <span class="required">*</span></label>
                <input type="datetime-local" class="form-input" id="asn-deadline" value="2026-11-28T23:59" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:600">Mô tả chi tiết &amp; Đề bài <span class="required">*</span></label>
                <textarea class="form-textarea" id="asn-desc" placeholder="Ghi chú chi tiết yêu cầu đề bài, số từ hoặc tiêu chí..." style="min-height:75px" required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:600">Hướng dẫn nộp bài</label>
                <input type="text" class="form-input" id="asn-instructions" placeholder="VD: Nộp định dạng PDF, tối thiểu 250 từ..." />
              </div>
            </div>

            <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:var(--space-2);padding:var(--space-4) var(--space-6);border-top:1px solid var(--border-light);background:var(--gray-50)">
              <button type="button" class="btn btn-secondary btn-sm" id="cancel-create-asn">Hủy</button>
              <button type="submit" class="btn btn-primary btn-sm" style="display:inline-flex;align-items:center;gap:6px">
                ${icons.check} Phát hành bài tập cho học viên
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalContainer.innerHTML = ''; };
    document.getElementById('close-create-asn-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancel-create-asn')?.addEventListener('click', closeModal);
    document.getElementById('create-asn-backdrop')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('create-asn-backdrop')) closeModal();
    });

    document.getElementById('create-asn-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (document.getElementById('asn-title') as HTMLInputElement).value.trim();
      const classId = (document.getElementById('asn-class') as HTMLSelectElement).value;
      const format = (document.getElementById('asn-format') as HTMLSelectElement).value as 'file' | 'link' | 'text';
      const maxScore = parseFloat((document.getElementById('asn-max-score') as HTMLInputElement).value) || 100;
      const deadline = (document.getElementById('asn-deadline') as HTMLInputElement).value;
      const desc = (document.getElementById('asn-desc') as HTMLTextAreaElement).value.trim();
      const instructions = (document.getElementById('asn-instructions') as HTMLInputElement).value.trim();

      const newId = `ASN${String(studentAssignmentData.length + 1).padStart(3, '0')}`;
      const newAsn: StudentAssignment = {
        id: newId,
        class_id: classId,
        title,
        description: desc,
        deadline,
        max_score: maxScore,
        format,
        instructions: instructions || 'Nộp bài trước hạn chót quy định.',
        created_at: new Date().toISOString(),
        assigned_by: user?.full_name || 'Giảng viên phụ trách',
      };

      studentAssignmentData.unshift(newAsn);
      saveStudentAssignments(studentAssignmentData);
      selectedAssignmentFilter = newId;
      selectedClassFilter = classId;
      subViewMode = 'queue';
      currentAssessmentTab = 'submissions';
      closeModal();
      refreshAssessmentsPage();
      showToast(`Đã giao bài tập mới "${title}" thành công cho lớp!`, 'success');
    });
  });

  // Exam list logic
  if (currentAssessmentTab === 'exams') {
    const classFilter = document.getElementById('assessment-class-filter') as HTMLSelectElement | null;
    const contentEl = document.getElementById('assessments-content');

    function renderCurrentView() {
      if (!contentEl) return;
      const selectedClassId = classFilter?.value;

      if (!selectedClassId) {
        contentEl.innerHTML = renderOverviewByClass();
      } else {
        const cls = classData.find(c => c.class_id === selectedClassId);
        const assessments = assessmentData.filter(a => a.class_id === selectedClassId);

        if (assessments.length === 0) {
          contentEl.innerHTML = `
            <div class="empty-state">
              <div style="font-size:48px;margin-bottom:var(--space-3);opacity:0.3">${icons.assessment}</div>
              <h3>Chưa có bài kiểm tra</h3>
              <p>Lớp ${cls?.class_name ?? ''} chưa có bài kiểm tra nào.</p>
            </div>
          `;
        } else {
          contentEl.innerHTML = `
            <div style="margin-bottom:var(--space-4)">
              <h2 style="font-size:var(--text-lg);font-weight:600;display:flex;align-items:center;gap:var(--space-2)">
                ${icons.classes} ${cls?.class_name ?? ''}
                <span class="badge badge-gray">${cls?.class_code ?? ''}</span>
              </h2>
            </div>
            ${assessments.map(a => renderAssessmentCard(a)).join('')}
          `;
        }
      }
      bindGradeButtons();
    }

    function bindGradeButtons() {
      document.querySelectorAll('.btn-grade-assessment').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const assessmentId = (btn as HTMLElement).dataset.assessmentId;
          const assessment = assessmentData.find(a => a.assessment_id === assessmentId);
          if (!assessment || !modalContainer) return;

          const enrolled = enrollmentData.filter(en => en.class_id === assessment.class_id && en.status === 'active');
          const results = assessmentResultData.filter(r => r.assessment_id === assessmentId);
          const resultMap = new Map(results.map(r => [r.student_id, r.score]));

          modalContainer.innerHTML = `
            <div class="modal-backdrop animate-fade-in" id="grade-modal-backdrop">
              <div class="modal animate-scale-up" style="max-width:560px;max-height:85vh;display:flex;flex-direction:column">
                <div class="modal-header">
                  <div>
                    <h3 style="margin:0;font-size:var(--text-base);font-weight:600">${icons.edit} Nhập điểm — ${assessment.title}</h3>
                    <span style="font-size:var(--text-xs);color:var(--text-tertiary)">Điểm tối đa: ${assessment.max_score}</span>
                  </div>
                  <button class="btn btn-ghost btn-icon" id="close-grade-modal">${icons.close}</button>
                </div>
                <form id="grade-form" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
                  <div class="modal-body" style="flex:1;overflow-y:auto;padding:var(--space-4)">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Học viên</th>
                          <th style="width:140px">Điểm số</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${enrolled.map(en => {
                          const student = studentData.find(s => s.student_id === en.student_id);
                          const currentScore = resultMap.get(en.student_id);
                          return `
                            <tr>
                              <td>
                                <div style="font-weight:600">${student?.full_name ?? en.student_id}</div>
                                <div style="font-size:10px;color:var(--text-tertiary)">${student?.student_code ?? ''}</div>
                              </td>
                              <td>
                                <input type="number" step="any" min="0" max="${assessment.max_score}" 
                                  class="form-input grade-input" 
                                  data-student-id="${en.student_id}" 
                                  value="${currentScore !== null && currentScore !== undefined ? currentScore : ''}" 
                                  placeholder="Chưa có" 
                                  style="padding:4px 8px;font-size:var(--text-sm);font-weight:600" />
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                  <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:var(--space-2);padding:var(--space-4);border-top:1px solid var(--border-light)">
                    <button type="button" class="btn btn-secondary" id="cancel-grade-modal">Hủy</button>
                    <button type="submit" class="btn btn-primary">${icons.check} Lưu bảng điểm</button>
                  </div>
                </form>
              </div>
            </div>
          `;

          const closeModal = () => { modalContainer.innerHTML = ''; };
          document.getElementById('close-grade-modal')?.addEventListener('click', closeModal);
          document.getElementById('cancel-grade-modal')?.addEventListener('click', closeModal);
          document.getElementById('grade-modal-backdrop')?.addEventListener('click', (ev) => {
            if (ev.target === document.getElementById('grade-modal-backdrop')) closeModal();
          });

          document.getElementById('grade-form')?.addEventListener('submit', (ev) => {
            ev.preventDefault();
            let failingCount = 0;
            modalContainer.querySelectorAll<HTMLInputElement>('.grade-input').forEach(input => {
              const sid = input.dataset.studentId;
              const val = input.value.trim();
              const scoreNum = val !== '' ? parseFloat(val) : null;

              if (!sid) return;

              if (scoreNum !== null) {
                const normalized = (scoreNum / assessment.max_score) * 100;
                if (normalized < 50.0) {
                  failingCount++;
                }
              }

              let res = assessmentResultData.find(r => r.assessment_id === assessment.assessment_id && r.student_id === sid);
              if (res) {
                res.score = scoreNum;
                res.last_modified_at = new Date().toISOString();
              } else if (scoreNum !== null) {
                assessmentResultData.push({
                  result_id: `AR${String(assessmentResultData.length + 1).padStart(3, '0')}`,
                  student_id: sid,
                  assessment_id: assessment.assessment_id,
                  score: scoreNum,
                  entered_by: 'STF001',
                  entered_at: new Date().toISOString(),
                });
              }
            });

            closeModal();
            renderCurrentView();
            showToast(`Đã lưu bảng điểm bài "${assessment.title}" thành công!`, 'success');
            if (failingCount > 0) {
              setTimeout(() => {
                showToast(`[Chính sách UC-12] Phát hiện ${failingCount} học viên có điểm liệt (< 50 quy đổi thang 100). Đã kích hoạt cảnh báo tới Trợ giảng!`, 'warning');
              }, 1000);
            }
          });
        });
      });
    }

    classFilter?.addEventListener('change', renderCurrentView);
    bindGradeButtons();
  }

  // Create assessment modal
  document.getElementById('btn-create-assessment')?.addEventListener('click', () => {
    if (!modalContainer) return;
    const availableClasses = classData.filter(c => c.status === 'in_progress');

    modalContainer.innerHTML = `
      <div class="modal-backdrop animate-fade-in" id="create-asm-backdrop">
        <div class="modal animate-scale-up" style="max-width:540px">
          <div class="modal-header">
            <h3 style="margin:0;font-size:var(--text-lg);font-weight:600;display:flex;align-items:center;gap:var(--space-2)">
              ${icons.assessment} Tạo bài kiểm tra mới
            </h3>
            <button class="btn btn-ghost btn-icon" id="close-create-asm-modal">${icons.close}</button>
          </div>
          <form id="create-asm-form">
            <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--space-4);padding:var(--space-5)">
              <div class="form-group">
                <label class="form-label">Tên bài kiểm tra <span class="required">*</span></label>
                <input type="text" class="form-input" id="asm-title" placeholder="VD: Kiểm tra giữa kỳ 1" required />
              </div>

              <div class="form-group">
                <label class="form-label">Lớp học <span class="required">*</span></label>
                <select class="form-select" id="asm-class" required>
                  <option value="">-- Chọn lớp học --</option>
                  ${availableClasses.map(c => `<option value="${c.class_id}">${c.class_name} (${c.class_code})</option>`).join('')}
                </select>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
                <div class="form-group">
                  <label class="form-label">Phân loại <span class="required">*</span></label>
                  <select class="form-select" id="asm-type" required>
                    <option value="assignment">Bài tập</option>
                    <option value="midterm">Giữa kỳ</option>
                    <option value="final">Cuối kỳ</option>
                    <option value="quiz">Quiz</option>
                    <option value="project">Dự án</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Điểm tối đa <span class="required">*</span></label>
                  <input type="number" class="form-input" id="asm-max-score" value="100" min="1" max="1000" required />
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
                <div class="form-group">
                  <label class="form-label">Trọng số (%)</label>
                  <input type="number" class="form-input" id="asm-weight" value="20" min="0" max="100" />
                </div>

                <div class="form-group">
                  <label class="form-label">Ngày kiểm tra / Hạn nộp <span class="required">*</span></label>
                  <input type="date" class="form-input" id="asm-date" value="2026-11-20" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Mô tả bài kiểm tra</label>
                <textarea class="form-textarea" id="asm-desc" placeholder="Nội dung, cấu trúc đề bài hoặc ghi chú..." style="min-height:70px"></textarea>
              </div>
            </div>

            <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:var(--space-2);padding:var(--space-4) var(--space-6);border-top:1px solid var(--border-light)">
              <button type="button" class="btn btn-secondary" id="cancel-create-asm">Hủy</button>
              <button type="submit" class="btn btn-primary">${icons.check} Lưu bài kiểm tra</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalContainer.innerHTML = ''; };
    document.getElementById('close-create-asm-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancel-create-asm')?.addEventListener('click', closeModal);
    document.getElementById('create-asm-backdrop')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('create-asm-backdrop')) closeModal();
    });

    document.getElementById('create-asm-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (document.getElementById('asm-title') as HTMLInputElement).value.trim();
      const classId = (document.getElementById('asm-class') as HTMLSelectElement).value;
      const type = (document.getElementById('asm-type') as HTMLSelectElement).value as AssessmentType;
      const maxScore = parseFloat((document.getElementById('asm-max-score') as HTMLInputElement).value) || 100;
      const weight = parseFloat((document.getElementById('asm-weight') as HTMLInputElement).value) || undefined;
      const date = (document.getElementById('asm-date') as HTMLInputElement).value;
      const desc = (document.getElementById('asm-desc') as HTMLTextAreaElement).value.trim();

      const newAssessment: Assessment = {
        assessment_id: `ASM${String(assessmentData.length + 1).padStart(3, '0')}`,
        class_id: classId,
        title,
        type,
        max_score: maxScore,
        weight,
        date,
        description: desc || undefined,
      };

      assessmentData.unshift(newAssessment);
      closeModal();
      currentAssessmentTab = 'exams';
      refreshAssessmentsPage();
      showToast(`Đã tạo bài kiểm tra "${title}" thành công!`, 'success');
    });
  });
}

function refreshAssessmentsPage(): void {
  const el = document.getElementById('page-content');
  if (el) {
    el.innerHTML = renderAssessmentsPage();
    initAssessmentsPage();
  }
}

// === Modal: Teacher Grading Student Submission ===
export function openGradeSubmissionModal(subId: string): void {
  const sub = studentSubmissionData.find(s => s.id === subId);
  if (!sub) return;

  const student = studentData.find(s => s.student_id === sub.student_id);
  const asn = studentAssignmentData.find(a => a.id === sub.assignment_id);
  const cls = classData.find(c => c.class_id === asn?.class_id);

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop animate-fade-in';
  modalEl.id = 'grade-sub-modal-backdrop';
  modalEl.style.zIndex = '10000';

  modalEl.innerHTML = `
    <div class="modal animate-scale-up" style="max-width:620px;max-height:90vh;overflow-y:auto;border-radius:var(--radius-xl);box-shadow:var(--shadow-xl)">
      <div class="modal-header" style="background:var(--gray-50);padding:var(--space-4) var(--space-6);border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,0.1);color:var(--primary-600);display:flex;align-items:center;justify-content:center">
            ${icons.edit}
          </div>
          <div>
            <h3 style="margin:0;font-size:var(--text-base);font-weight:700">Chấm điểm &amp; Nhận xét Bài nộp</h3>
            <span style="font-size:11px;color:var(--text-tertiary)">Mã bài nộp: <strong>${sub.id}</strong> · Lớp ${cls?.class_code ?? ''}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" id="close-grade-sub-modal" type="button">${icons.close}</button>
      </div>

      <form id="grade-sub-form">
        <div class="modal-body" style="padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-4)">
          <!-- Student & Assignment Header Box -->
          <div style="background:var(--gray-50);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:14px 18px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="font-size:14px;font-weight:700;color:var(--text-primary)">
                Học viên: ${student?.full_name ?? sub.student_id} <span style="font-size:11px;color:var(--text-tertiary)">(${student?.student_code})</span>
              </div>
              <span class="badge badge-blue">${cls?.class_name ?? ''}</span>
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--primary-700);margin-bottom:4px">
              ${asn?.title ?? sub.assignment_id}
            </div>
            <div style="font-size:11px;color:var(--text-secondary)">
              ${asn?.description ?? ''}
            </div>
          </div>

          <!-- Submitted File & Student Notes -->
          <div style="border:1px solid rgba(37,99,235,0.25);border-radius:var(--radius-lg);padding:14px 18px;background:rgba(37,99,235,0.02)">
            <div style="font-size:11px;font-weight:700;color:var(--primary-700);text-transform:uppercase;margin-bottom:6px">
              Thông tin tệp bài nộp của học viên
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:24px">📄</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${sub.attachment_name || 'Bài làm trực tuyến'}</div>
                  <div style="font-size:11px;color:var(--text-tertiary)">
                    ${sub.attachment_size ? `Kích thước: ${sub.attachment_size} · ` : ''}Nộp lúc: <strong>${formatDate(sub.submitted_at)}</strong> (${formatTimeAgo(sub.submitted_at)})
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-preview-in-modal" style="font-size:11px;padding:4px 10px">
                👁️ Xem trước bài làm
              </button>
            </div>

            ${sub.submission_link ? `
              <div style="margin-top:10px;font-size:12px">
                🔗 <strong>Đường dẫn dự án:</strong> <a href="${sub.submission_link}" target="_blank" style="color:var(--primary-600)">${sub.submission_link}</a>
              </div>
            ` : ''}

            ${sub.submission_text ? `
              <div style="margin-top:10px;padding:10px 12px;background:#ffffff;border-radius:var(--radius-md);border:1px solid var(--border-light);font-size:12px;color:var(--text-secondary)">
                💬 <strong>Lời nhắn của học viên:</strong> "${sub.submission_text}"
              </div>
            ` : ''}
          </div>

          <!-- Score Input -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700">Điểm số (Thang điểm 100) <span class="required">*</span></label>
            <div style="display:flex;align-items:center;gap:12px">
              <input type="number" class="form-input" id="grade-sub-score" min="0" max="${asn?.max_score || 100}" step="1" value="${sub.score !== null && sub.score !== undefined ? sub.score : ''}" placeholder="Nhập điểm từ 0 - 100" style="font-size:18px;font-weight:700;max-width:180px" required />
              <span style="font-size:13px;color:var(--text-tertiary)">/ ${asn?.max_score || 100} điểm (Chuẩn đạt: ≥ 70đ)</span>
            </div>
          </div>

          <!-- Feedback / Rubric Comments -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700">Nhận xét chi tiết &amp; Hướng dẫn sửa bài <span class="required">*</span></label>
            <textarea class="form-textarea" id="grade-sub-feedback" placeholder="Nhận xét ưu điểm, chỉ ra các lỗi ngữ pháp, từ vựng hoặc hướng dẫn cụ thể để học viên cải thiện..." style="min-height:95px" required>${sub.teacher_feedback || ''}</textarea>
          </div>

          <div style="background:rgba(16, 185, 129, 0.08);border:1px solid rgba(16, 185, 129, 0.3);padding:10px 14px;border-radius:var(--radius-md);font-size:11px;color:#065f46;display:flex;align-items:center;gap:6px">
            <span>✓ Sau khi lưu, kết quả và lời nhận xét sẽ được gửi thông báo ngay tới tài khoản học viên.</span>
          </div>
        </div>

        <div class="modal-footer" style="padding:var(--space-4) var(--space-6);background:var(--gray-50);border-top:1px solid var(--border-light);display:flex;justify-content:flex-end;gap:var(--space-2)">
          <button type="button" class="btn btn-secondary btn-sm" id="cancel-grade-sub-modal">Hủy</button>
          <button type="submit" class="btn btn-primary btn-sm" style="display:inline-flex;align-items:center;gap:6px">
            ${icons.check} Lưu điểm &amp; Gửi phản hồi cho học viên
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalEl);

  const closeModal = () => modalEl.remove();
  document.getElementById('close-grade-sub-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-grade-sub-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-preview-in-modal')?.addEventListener('click', () => {
    showToast(`Đang mở xem bài nộp: ${sub.attachment_name || 'Bài làm'}`, 'info');
  });
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });

  document.getElementById('grade-sub-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const scoreVal = parseFloat((document.getElementById('grade-sub-score') as HTMLInputElement).value);
    const feedbackVal = (document.getElementById('grade-sub-feedback') as HTMLTextAreaElement).value.trim();
    const user = getState().currentUser;

    sub.score = scoreVal;
    sub.teacher_feedback = feedbackVal;
    sub.status = 'graded';
    sub.graded_at = new Date().toISOString();
    sub.graded_by = user?.staff_id || 'STF003';

    saveStudentSubmissions(studentSubmissionData);
    updateBadgeUI();
    closeModal();

    showToast(`Đã chấm điểm thành công cho bài nộp của ${student?.full_name}! (Điểm: ${scoreVal})`, 'success');
    refreshAssessmentsPage();
  });
}
