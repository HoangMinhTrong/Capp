// ============================================
// EduTrack - Student Online Assignment Submission Portal
// Cổng nộp bài tập trực tuyến & Theo dõi chấm điểm 2 chiều
// Bảng màu Tím Pastel Gamified (#F8F6FF, #E8E2F8, #6C47D9)
// ============================================

import { getState } from '../state.ts';
import {
  studentData, studentAssignmentData, studentSubmissionData, classData, saveStudentSubmissions,
  enrollmentData
} from '../data.ts';
import { icons, formatDate, formatTimeAgo, showToast } from '../utils.ts';
import { updateBadgeUI } from '../main.ts';
import type { StudentSubmission } from '../types.ts';

let activeFilter: 'all' | 'pending' | 'submitted' | 'graded' = 'all';

export function renderStudentAssignmentsPage(): string {
  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV001';
  const student = studentData.find(s => s.student_id === studentId) || studentData[0];

  // RBAC: strictly filter assignments belonging to student's enrolled classes
  const myEnrollments = enrollmentData.filter(e => e.student_id === student.student_id && e.status === 'active');
  const myClassIds = new Set(myEnrollments.map(e => e.class_id));
  const myAssignments = studentAssignmentData.filter(a => myClassIds.size === 0 || myClassIds.has(a.class_id));

  // Get student's submissions
  const mySubmissions = studentSubmissionData.filter(sub => sub.student_id === student.student_id);
  const subMap = new Map<string, StudentSubmission>();
  mySubmissions.forEach(sub => subMap.set(sub.assignment_id, sub));

  // Compute metrics
  const totalAssignments = myAssignments.length;
  const submittedCount = mySubmissions.length;
  const gradedCount = mySubmissions.filter(s => s.status === 'graded').length;
  const pendingCount = totalAssignments - submittedCount;
  
  const gradedWithScore = mySubmissions.filter(s => s.score !== null && s.score !== undefined);
  const avgScore = gradedWithScore.length > 0
    ? Math.round(gradedWithScore.reduce((sum, s) => sum + (s.score ?? 0), 0) / gradedWithScore.length)
    : '—';

  // Filter list
  const filteredAssignments = myAssignments.filter(asn => {
    const sub = subMap.get(asn.id);
    if (activeFilter === 'pending') return !sub;
    if (activeFilter === 'submitted') return sub && sub.status === 'submitted';
    if (activeFilter === 'graded') return sub && sub.status === 'graded';
    return true;
  });

  return `
    <div class="student-assignments-page" style="background:#F8F6FF;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- 1. Header Trang đồng nhất Gamified Pastel Purple -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
            Bài tập &amp; Nộp bài
          </h1>
          <div style="font-size:14px;color:#736B7C;font-weight:500">
            Nhiệm vụ rèn luyện &amp; Theo dõi chấm điểm 2 chiều · Học viên: <strong style="color:#2D2824">${student.full_name}</strong> (${student.student_code})
          </div>
        </div>
        <div>
          <a href="#/student-dashboard" class="btn btn-secondary btn-sm" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:7px 18px;border:1.5px solid #E8E2F8;background:#ffffff;color:#6C47D9;box-shadow:0 2px 6px rgba(108,71,217,0.06);transition:all 0.15s">
            ← Về Tổng quan
          </a>
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Gamified Purple (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#EDE7FB;border:1.5px solid #D8CCF8;border-radius:20px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 4px 18px rgba(108,71,217,0.06)">
          <div style="font-size:32px;font-weight:900;color:#6C47D9;line-height:1;margin-bottom:8px">
            ${totalAssignments}
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Tổng bài được giao</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#6C47D9"></div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:20px 22px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
          <div style="font-size:32px;font-weight:900;color:#EA580C;line-height:1;margin-bottom:8px">
            ${pendingCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Cần nộp gấp</div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:20px 22px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
          <div style="font-size:32px;font-weight:900;color:#10B981;line-height:1;margin-bottom:8px">
            ${submittedCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Đã nộp thành công</div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:20px 22px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
          <div style="font-size:32px;font-weight:900;color:#6C47D9;line-height:1;margin-bottom:8px">
            ${avgScore}${typeof avgScore === 'number' ? '/100' : ''}
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Điểm trung bình</div>
        </div>
      </div>

      <!-- Filter Controls & Assignment Feed -->
      <div class="card" style="border:1.5px solid #E8E2F8;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px rgba(108,71,217,0.04);background:#FFFFFF">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;background:#F3EFFF;padding:16px 24px;border-bottom:1.5px solid #E8E2F8">
          <div style="display:flex;align-items:center;gap:8px">
            <h3 style="margin:0;font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px;color:#2D2824">
              <span style="color:#6C47D9">${icons.upload}</span> Danh sách Bài tập &amp; Nhiệm vụ Học tập
            </h3>
            <span class="badge" style="background:#EDE7FB;color:#6C47D9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;border:1px solid #D8CCF8">${filteredAssignments.length} bài</span>
          </div>

          <!-- Segmented Filter Buttons -->
          <div style="display:flex;background:#FFFFFF;padding:4px;border-radius:9999px;border:1.5px solid #E8E2F8;gap:4px">
            <button type="button" class="btn btn-sm btn-asn-filter" data-filter="all" style="font-size:11.5px;padding:6px 14px;border-radius:9999px;cursor:pointer;border:none;font-weight:700;transition:all 0.15s;${activeFilter === 'all' ? 'background:#6C47D9;color:#FFFFFF;box-shadow:0 2px 6px rgba(108,71,217,0.25);' : 'background:transparent;color:#736B7C;'}">
              Tất cả (${totalAssignments})
            </button>
            <button type="button" class="btn btn-sm btn-asn-filter" data-filter="pending" style="font-size:11.5px;padding:6px 14px;border-radius:9999px;cursor:pointer;border:none;font-weight:700;transition:all 0.15s;${activeFilter === 'pending' ? 'background:#EA580C;color:#FFFFFF;box-shadow:0 2px 6px rgba(234,88,12,0.25);' : 'background:transparent;color:#EA580C;'}">
              Chưa nộp (${pendingCount})
            </button>
            <button type="button" class="btn btn-sm btn-asn-filter" data-filter="submitted" style="font-size:11.5px;padding:6px 14px;border-radius:9999px;cursor:pointer;border:none;font-weight:700;transition:all 0.15s;${activeFilter === 'submitted' ? 'background:#6C47D9;color:#FFFFFF;box-shadow:0 2px 6px rgba(108,71,217,0.25);' : 'background:transparent;color:#6C47D9;'}">
              Đang chấm (${submittedCount - gradedCount})
            </button>
            <button type="button" class="btn btn-sm btn-asn-filter" data-filter="graded" style="font-size:11.5px;padding:6px 14px;border-radius:9999px;cursor:pointer;border:none;font-weight:700;transition:all 0.15s;${activeFilter === 'graded' ? 'background:#10B981;color:#FFFFFF;box-shadow:0 2px 6px rgba(16,185,129,0.25);' : 'background:transparent;color:#10B981;'}">
              Đã có điểm (${gradedCount})
            </button>
          </div>
        </div>

        <div class="card-body" style="padding:24px">
          ${filteredAssignments.length === 0 ? `
            <div class="empty-state" style="padding:48px;text-align:center">
              <div style="font-size:32px;margin-bottom:8px">🎉</div>
              <p style="margin:0;color:#736B7C;font-size:14px;font-weight:600">Không có bài tập nào trong danh mục này.</p>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:18px">
              ${filteredAssignments.map(asn => {
                const sub = subMap.get(asn.id);
                const cls = classData.find(c => c.class_id === asn.class_id);
                const isOverdue = new Date(asn.deadline).getTime() < Date.now();
                const deadlineStr = formatDate(asn.deadline);

                return `
                  <div class="assignment-card" style="border:1.5px solid ${sub?.status === 'graded' ? 'rgba(16, 185, 129, 0.4)' : sub ? 'rgba(108, 71, 217, 0.3)' : isOverdue ? 'rgba(239, 68, 68, 0.3)' : '#E8E2F8'};border-radius:20px;padding:22px 24px;background:${sub?.status === 'graded' ? 'rgba(16, 185, 129, 0.02)' : '#FFFFFF'};box-shadow:0 2px 10px rgba(108,71,217,0.03);transition:all 0.15s">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:12px">
                      <div style="flex:1;min-width:260px">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                          <span class="badge" style="background:#EDE7FB;color:#6C47D9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;border:1px solid #D8CCF8">${cls?.class_code ?? asn.class_id}</span>
                          <span class="badge" style="background:#F3EFFF;color:#736B7C;font-size:11px;font-weight:600;padding:3px 10px;border-radius:9999px">Định dạng: ${asn.format === 'file' ? '📁 Tệp đính kèm' : asn.format === 'link' ? '🔗 Đường link Drive/Git' : '📝 Văn bản trực tiếp'}</span>
                          <span style="font-size:12px;color:#8E8897">Giao bởi: <strong style="color:#2D2824">${asn.assigned_by}</strong></span>
                        </div>
                        <h4 style="margin:0 0 6px 0;font-size:16px;font-weight:800;color:#2D2824">
                          ${asn.title}
                        </h4>
                        <p style="margin:0 0 8px 0;font-size:13.5px;color:#736B7C;line-height:1.5">
                          ${asn.description}
                        </p>
                        ${asn.instructions ? `
                          <div style="font-size:12px;background:#F8F6FF;padding:8px 14px;border-radius:12px;color:#5B37C7;border-left:3px solid #6C47D9;margin-bottom:8px">
                            📌 <strong>Yêu cầu nộp:</strong> ${asn.instructions}
                          </div>
                        ` : ''}
                      </div>

                      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
                        ${sub?.status === 'graded' ? `
                          <div style="display:flex;align-items:center;gap:6px">
                            <span class="badge" style="background:rgba(16,185,129,0.12);color:#059669;font-size:12px;padding:5px 12px;font-weight:700;border-radius:9999px;border:1px solid rgba(16,185,129,0.3)">
                              ✓ Đã chấm: ${sub.score}/${asn.max_score} điểm
                            </span>
                          </div>
                        ` : sub ? `
                          <span class="badge" style="background:#EDE7FB;color:#6C47D9;font-size:11.5px;padding:5px 12px;font-weight:700;border-radius:9999px;border:1px solid #D8CCF8">
                            ⏱️ Đã nộp · Chờ giáo viên chấm
                          </span>
                        ` : `
                          <span class="badge" style="font-size:11.5px;padding:5px 12px;font-weight:700;border-radius:9999px;${isOverdue ? 'background:#FEE2E2;color:#DC2626;border:1px solid #FCA5A5;' : 'background:#FEF3C7;color:#D97706;border:1px solid #FCD34D;'}">
                            ${isOverdue ? '⚠️ Quá hạn' : '🕒 Chưa nộp bài'}
                          </span>
                        `}
                        <div style="font-size:12px;color:#8E8897">
                          Hạn chót: <strong style="color:${isOverdue ? '#DC2626' : '#2D2824'}">${deadlineStr}</strong>
                        </div>
                      </div>
                    </div>

                    <!-- Submission Details or Action Trigger -->
                    <div style="border-top:1px solid #F3EFFF;padding-top:14px;margin-top:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
                      ${sub ? `
                        <div style="font-size:12.5px;color:#736B7C;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                          <span>📄 Đã nộp: <strong style="color:#2D2824">${sub.attachment_name || sub.submission_link || 'Đoạn văn bài làm'}</strong></span>
                          <span>🕒 Lúc: ${formatTimeAgo(sub.submitted_at)}</span>
                          ${sub.teacher_feedback ? `
                            <span style="color:#6C47D9;font-weight:600">💬 Nhận xét: "${sub.teacher_feedback.slice(0, 50)}..."</span>
                          ` : ''}
                        </div>
                        <div style="display:flex;gap:8px">
                          ${sub.teacher_feedback ? `
                            <button type="button" class="btn btn-ghost btn-sm btn-view-feedback" data-asn-id="${asn.id}" style="font-size:12px;color:#6C47D9;font-weight:700;padding:6px 12px;border-radius:9999px;background:#F3EFFF;border:1px solid #E8E2F8;cursor:pointer">
                              Xem nhận xét chi tiết 📝
                            </button>
                          ` : ''}
                          <button type="button" class="btn btn-secondary btn-sm btn-open-submit-modal" data-asn-id="${asn.id}" style="font-size:12px;padding:6px 14px;border-radius:9999px;border:1.5px solid #E8E2F8;background:#FFFFFF;color:#6C47D9;font-weight:700;cursor:pointer">
                            ${icons.upload} Nộp lại bài
                          </button>
                        </div>
                      ` : `
                        <div style="font-size:12px;color:#8E8897">
                          Chưa có bài nộp nào được ghi nhận. Vui lòng hoàn thành trước hạn chót.
                        </div>
                        <button type="button" class="btn btn-primary btn-sm btn-open-submit-modal" data-asn-id="${asn.id}" style="font-size:12.5px;font-weight:700;padding:7px 18px;border-radius:9999px;border:none;background:#6C47D9;color:#FFFFFF;box-shadow:0 2px 8px rgba(108,71,217,0.25);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                          ${icons.upload} Nộp bài ngay
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Modal Container -->
      <div id="asn-modal-container"></div>
    </div>
  `;
}

export function initStudentAssignmentsPage(): void {
  // 1. Filter tabs
  document.querySelectorAll<HTMLElement>('.btn-asn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter as 'all' | 'pending' | 'submitted' | 'graded';
      if (f) {
        activeFilter = f;
        refreshPage();
      }
    });
  });

  // 2. Open submit modal
  document.querySelectorAll<HTMLElement>('.btn-open-submit-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const asnId = btn.dataset.asnId;
      if (asnId) openSubmitModal(asnId);
    });
  });

  // 3. View teacher feedback modal
  document.querySelectorAll<HTMLElement>('.btn-view-feedback').forEach(btn => {
    btn.addEventListener('click', () => {
      const asnId = btn.dataset.asnId;
      if (asnId) openFeedbackModal(asnId);
    });
  });
}

function refreshPage(): void {
  const el = document.getElementById('page-content');
  if (el) {
    el.innerHTML = renderStudentAssignmentsPage();
    initStudentAssignmentsPage();
  }
}

// === Modal: Online Assignment Submission ===
function openSubmitModal(asnId: string): void {
  const container = document.getElementById('asn-modal-container');
  if (!container) return;

  const asn = studentAssignmentData.find(a => a.id === asnId);
  if (!asn) return;

  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV001';
  const existingSub = studentSubmissionData.find(s => s.assignment_id === asnId && s.student_id === studentId);

  container.innerHTML = `
    <div class="modal-backdrop animate-fade-in" id="submit-modal-backdrop" style="position:fixed;inset:0;background:rgba(45,40,36,0.45);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">
      <div class="modal animate-scale-up" style="max-width:560px;width:100%;background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(108,71,217,0.12)">
        <div class="modal-header" style="background:#F8F6FF;padding:18px 24px;border-bottom:1.5px solid #E8E2F8;display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:#EDE7FB;color:#6C47D9;display:flex;align-items:center;justify-content:center;font-size:16px">
              ${icons.upload}
            </div>
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:800;color:#2D2824">Nộp bài trực tuyến</h3>
              <span style="font-size:11.5px;color:#736B7C">Mã bài tập: <strong style="color:#6C47D9">${asn.id}</strong></span>
            </div>
          </div>
          <button class="btn btn-ghost btn-icon" id="close-submit-modal" type="button" style="background:none;border:none;cursor:pointer;font-size:18px;color:#736B7C">✕</button>
        </div>

        <form id="assignment-submit-form">
          <div class="modal-body" style="padding:24px;display:flex;flex-direction:column;gap:16px">
            <div style="background:#F8F6FF;border:1.5px solid #E8E2F8;border-radius:16px;padding:14px 18px">
              <div style="font-size:14px;font-weight:800;color:#2D2824;margin-bottom:4px">${asn.title}</div>
              <div style="font-size:12px;color:#736B7C">Hạn chót: <strong style="color:#2D2824">${formatDate(asn.deadline)}</strong> · Điểm tối đa: <strong style="color:#6C47D9">${asn.max_score}</strong></div>
            </div>

            <!-- Upload Zone -->
            <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
              <label class="form-label" style="font-weight:700;font-size:13px;color:#2D2824">Đính kèm Tệp bài làm (.pdf, .docx, .zip) <span style="color:#DC2626">*</span></label>
              <div id="drop-zone" style="border:2px dashed #6C47D9;border-radius:18px;padding:26px 16px;text-align:center;background:#F8F6FF;cursor:pointer;transition:all 0.15s">
                <div style="font-size:32px;margin-bottom:6px">📁</div>
                <div style="font-size:13.5px;font-weight:700;color:#6C47D9" id="selected-file-label">
                  ${existingSub?.attachment_name ? `Tệp hiện tại: ${existingSub.attachment_name}` : 'Nhấp để chọn tệp từ máy tính hoặc kéo thả vào đây'}
                </div>
                <div style="font-size:11.5px;color:#8E8897;margin-top:4px">Hỗ trợ PDF, Word, PowerPoint, ZIP (Tối đa 50MB)</div>
                <input type="file" id="assignment-file-input" style="display:none" />
              </div>
            </div>

            <!-- Link / Drive Input -->
            <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
              <label class="form-label" style="font-weight:700;font-size:13px;color:#2D2824">Đường dẫn bài làm bổ sung (Google Drive / GitHub / Figma)</label>
              <input type="url" class="form-input" id="assignment-link-input" placeholder="https://drive.google.com/..." value="${existingSub?.submission_link || ''}" style="height:42px;padding:0 14px;border:1.5px solid #E8E2F8;border-radius:12px;font-size:13px;background:#F8F6FF;color:#2D2824;outline:none" />
            </div>

            <!-- Notes to Teacher -->
            <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
              <label class="form-label" style="font-weight:700;font-size:13px;color:#2D2824">Ghi chú hoặc câu hỏi gửi Giảng viên / Trợ giảng</label>
              <textarea class="form-textarea" id="assignment-notes-input" placeholder="Em xin gửi bài tập kèm ghi chú các phần em đã làm..." style="min-height:75px;padding:12px 14px;border:1.5px solid #E8E2F8;border-radius:12px;font-size:13px;background:#F8F6FF;color:#2D2824;outline:none;font-family:inherit">${existingSub?.submission_text || ''}</textarea>
            </div>

            <div style="background:rgba(16, 185, 129, 0.08);border:1px solid rgba(16, 185, 129, 0.3);padding:10px 14px;border-radius:12px;font-size:11.5px;color:#065f46;display:flex;align-items:center;gap:6px">
              <span>✓ Hệ thống tự động ghi nhận mốc thời gian nộp bài thời gian thực để đối soát chuẩn SLA.</span>
            </div>
          </div>

          <div class="modal-footer" style="padding:16px 24px;background:#F8F6FF;border-top:1.5px solid #E8E2F8;display:flex;justify-content:flex-end;gap:10px">
            <button type="button" class="btn btn-secondary btn-sm" id="cancel-submit-modal" style="height:38px;padding:0 16px;border-radius:9999px;border:1.5px solid #E8E2F8;background:#FFFFFF;color:#736B7C;font-weight:700;cursor:pointer">Hủy</button>
            <button type="submit" class="btn btn-primary btn-sm" style="height:38px;padding:0 20px;border-radius:9999px;border:none;background:#6C47D9;color:#FFFFFF;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(108,71,217,0.25);display:inline-flex;align-items:center;gap:6px">
              ${icons.check} Xác nhận Nộp bài
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  let currentFileName = existingSub?.attachment_name || 'BaiLam_HocVien_ThaoNguyen.pdf';

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('assignment-file-input') as HTMLInputElement | null;
  const fileLabel = document.getElementById('selected-file-label');

  dropZone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      currentFileName = fileInput.files[0].name;
      if (fileLabel) fileLabel.innerHTML = `✓ Đã chọn: <strong>${currentFileName}</strong> (${(fileInput.files[0].size / (1024 * 1024)).toFixed(1)} MB)`;
    }
  });

  const closeModal = () => { container.innerHTML = ''; };
  document.getElementById('close-submit-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-submit-modal')?.addEventListener('click', closeModal);
  document.getElementById('submit-modal-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'submit-modal-backdrop') closeModal();
  });

  document.getElementById('assignment-submit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = (document.getElementById('assignment-link-input') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('assignment-notes-input') as HTMLTextAreaElement).value.trim();

    if (existingSub) {
      existingSub.attachment_name = currentFileName;
      existingSub.submission_link = link;
      existingSub.submission_text = notes;
      existingSub.submitted_at = new Date().toISOString();
      existingSub.status = 'submitted';
    } else {
      studentSubmissionData.unshift({
        id: `SUB${String(studentSubmissionData.length + 1).padStart(3, '0')}`,
        assignment_id: asnId,
        student_id: studentId,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        attachment_name: currentFileName,
        attachment_size: '2.1 MB',
        submission_link: link,
        submission_text: notes,
        score: null,
        teacher_feedback: 'Đang xếp hàng chờ giảng viên chấm điểm.',
      });
    }

    saveStudentSubmissions(studentSubmissionData);
    updateBadgeUI();

    closeModal();
    showToast(`Đã nộp bài tập "${asn.title}" thành công!`, 'success');
    refreshPage();
  });
}

// === Modal: Teacher Feedback & Rubric ===
function openFeedbackModal(asnId: string): void {
  const container = document.getElementById('asn-modal-container');
  if (!container) return;

  const asn = studentAssignmentData.find(a => a.id === asnId);
  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV001';
  const sub = studentSubmissionData.find(s => s.assignment_id === asnId && s.student_id === studentId);
  if (!asn || !sub) return;

  container.innerHTML = `
    <div class="modal-backdrop animate-fade-in" id="feedback-modal-backdrop" style="position:fixed;inset:0;background:rgba(45,40,36,0.45);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">
      <div class="modal animate-scale-up" style="max-width:540px;width:100%;background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(108,71,217,0.12)">
        <div class="modal-header" style="background:#F8F6FF;padding:18px 24px;border-bottom:1.5px solid #E8E2F8;display:flex;justify-content:space-between;align-items:center">
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:800;color:#2D2824">Chi tiết Đánh giá &amp; Nhận xét</h3>
            <span style="font-size:11.5px;color:#736B7C">${asn.title}</span>
          </div>
          <button class="btn btn-ghost btn-icon" id="close-feedback-modal" type="button" style="background:none;border:none;cursor:pointer;font-size:18px;color:#736B7C">✕</button>
        </div>
        <div class="modal-body" style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(16, 185, 129, 0.08);border:1px solid rgba(16, 185, 129, 0.3);padding:14px 18px;border-radius:18px">
            <div>
              <div style="font-size:11px;font-weight:700;color:#065f46;text-transform:uppercase">Điểm đánh giá chính thức</div>
              <div style="font-size:28px;font-weight:900;color:#059669">${sub.score} <span style="font-size:14px;color:#736B7C">/ ${asn.max_score}</span></div>
            </div>
            <span class="badge" style="background:rgba(16,185,129,0.15);color:#059669;font-size:12px;padding:5px 12px;font-weight:700;border-radius:9999px;border:1px solid rgba(16,185,129,0.3)">✓ Đạt chuẩn đầu ra</span>
          </div>

          <div>
            <div style="font-size:11.5px;font-weight:700;color:#736B7C;text-transform:uppercase;margin-bottom:6px">Lời nhận xét từ Giảng viên / Trợ giảng</div>
            <div style="background:#F8F6FF;border-left:4px solid #6C47D9;padding:14px 16px;border-radius:0 16px 16px 0;font-size:13.5px;line-height:1.6;color:#2D2824">
              "${sub.teacher_feedback}"
            </div>
          </div>

          <div>
            <div style="font-size:11.5px;font-weight:700;color:#736B7C;text-transform:uppercase;margin-bottom:6px">Thông tin tệp bài nộp</div>
            <div style="font-size:12.5px;color:#736B7C;background:#F8F6FF;padding:10px 14px;border-radius:12px;border:1px solid #E8E2F8">
              📄 ${sub.attachment_name || 'Tệp trực tuyến'} · Nộp lúc: ${formatDate(sub.submitted_at)}
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding:16px 24px;background:#F8F6FF;border-top:1.5px solid #E8E2F8;display:flex;justify-content:space-between;align-items:center">
          <a href="#/support" class="btn btn-ghost btn-sm" style="font-size:12px;color:#6C47D9;font-weight:700;text-decoration:none">
            ${icons.support} Gửi thắc mắc về điểm →
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-close-feedback" style="height:36px;padding:0 18px;border-radius:9999px;border:1.5px solid #E8E2F8;background:#FFFFFF;color:#736B7C;font-weight:700;cursor:pointer">Đóng</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };
  document.getElementById('close-feedback-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-feedback')?.addEventListener('click', closeModal);
  document.getElementById('feedback-modal-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'feedback-modal-backdrop') closeModal();
  });
}
