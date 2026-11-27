// ============================================
// EduTrack English - Màn hình "Chấm bài"
// Dành riêng cho vai trò Giáo viên (Strict RBAC)
// Warm Minimalist Design System
// ============================================

import { getState } from '../state.ts';
import { 
  studentSubmissionData, 
  studentAssignmentData, 
  studentMonitoringData, 
  studentData,
  classData,
  centerClassData, 
  classAssignmentData,
  gradeSubmissionLocal,
  saveStudentAssignments
} from '../data.ts';
import { submitGradeApi } from '../api.ts';
import { showToast } from '../utils.ts';
import { updateBadgeUI } from '../main.ts';
import type { StudentAssignment } from '../types.ts';

type SubmissionFilterStatus = 'all' | 'submitted' | 'graded';

let activeStatusFilter: SubmissionFilterStatus = 'submitted';
let selectedClassFilter: string = 'all';
let searchQuery: string = '';
let selectedSubmissionId: string | null = null;
let isGradingModalOpen = false;
let isCreateAssignmentModalOpen = false;

// Audio player simulation state
let isAudioPlaying = false;
let audioPlayTimer: any = null;
let audioCurrentSeconds = 0;

export function renderGradingPage(): string {
  const state = getState();
  const user = state.currentUser;

  // Strict RBAC: Only teachers and teaching assistants can access
  if (!user || (user.role !== 'teacher' && user.role !== 'teaching_assistant')) {
    return `
      <div style="background:#FAF7F2;min-height:100vh;padding:40px 32px;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:24px;padding:36px 40px;max-width:480px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.05)">
          <div style="font-size:52px;margin-bottom:16px">🔒</div>
          <h2 style="font-size:22px;font-weight:800;color:#2D2824;margin:0 0 10px 0">Truy cập bị từ chối (403 Forbidden)</h2>
          <p style="font-size:14px;color:#7F7A72;line-height:1.5;margin:0 0 24px 0">
            Phân hệ <strong>Chấm bài</strong> chỉ dành riêng cho tài khoản Giảng viên / Trợ giảng để chấm điểm và nhận xét bài nộp của học viên thuộc các lớp mình phụ trách.
          </p>
          <a href="#/dashboard" style="display:inline-block;background:#A93226;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px">
            Quay về Tổng quan
          </a>
        </div>
      </div>
    `;
  }

  // 1. Identify Teacher / TA's assigned classes
  const staffId = user.staff_id || 'STF003';
  const assignedClassIds = new Set<string>();

  if (user.role === 'teacher') {
    centerClassData.forEach(c => {
      if (c.teacher_id === staffId) assignedClassIds.add(c.class_id);
    });
    classAssignmentData.forEach(ca => {
      if (ca.teacher_id === staffId) assignedClassIds.add(ca.class_id);
    });
    classData.forEach(c => {
      if (c.author_name?.includes(user.full_name)) assignedClassIds.add(c.class_id);
    });
    if (staffId === 'STF003' || user.email === 'cuong.le@edu.vn') {
      assignedClassIds.add('CLS_NN01');
      assignedClassIds.add('CLS_IELTS_FND');
      assignedClassIds.add('CLS001');
      assignedClassIds.add('CLS002');
      assignedClassIds.add('CLS004');
    } else if (staffId === 'STF004') {
      assignedClassIds.add('CLS003');
      assignedClassIds.add('CLS005');
    }
  } else if (user.role === 'teaching_assistant') {
    classAssignmentData.forEach(ca => {
      if (ca.teaching_assistant_id === staffId) assignedClassIds.add(ca.class_id);
    });
    if (staffId === 'STF005') {
      assignedClassIds.add('CLS_NN01');
      assignedClassIds.add('CLS001');
      assignedClassIds.add('CLS004');
    } else if (staffId === 'STF006') {
      assignedClassIds.add('CLS002');
      assignedClassIds.add('CLS003');
      assignedClassIds.add('CLS005');
    }
  }

  // 2. Filter assignments belonging to teacher's classes
  const teacherAssignments = studentAssignmentData.filter(a => assignedClassIds.has(a.class_id));
  const teacherAssignmentIds = new Set(teacherAssignments.map(a => a.id));

  // 3. Filter submissions of those assignments
  const allSubmissions = studentSubmissionData.filter(s => teacherAssignmentIds.has(s.assignment_id));

  // Calculate KPIs
  const pendingCount = allSubmissions.filter(s => s.status === 'submitted').length;
  const gradedTodayCount = allSubmissions.filter(s => s.status === 'graded').length;
  const gradedList = allSubmissions.filter(s => s.status === 'graded' && s.score !== null);
  const avgClassScore = gradedList.length > 0
    ? (gradedList.reduce((acc, curr) => acc + (curr.score || 0), 0) / gradedList.length).toFixed(1)
    : '8.5';
  const onTimeRate = '94%';

  // Filter list by status, class, and search
  let filteredSubmissions = allSubmissions.filter(s => {
    if (activeStatusFilter !== 'all' && s.status !== activeStatusFilter) {
      return false;
    }
    const asn = studentAssignmentData.find(a => a.id === s.assignment_id);
    if (selectedClassFilter !== 'all' && asn?.class_id !== selectedClassFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const student = studentMonitoringData.find(m => m.student_id === s.student_id) || studentData.find(st => st.student_id === s.student_id);
      const studentName = student?.full_name?.toLowerCase() || '';
      const studentCode = (student as any)?.student_code?.toLowerCase() || '';
      const asnTitle = asn?.title?.toLowerCase() || '';
      if (!studentName.includes(q) && !studentCode.includes(q) && !asnTitle.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Get active modal submission if open
  const currentSubmission = selectedSubmissionId ? allSubmissions.find(s => s.id === selectedSubmissionId) : null;
  const currentAssignment = currentSubmission ? studentAssignmentData.find(a => a.id === currentSubmission.assignment_id) : null;
  const currentStudent = currentSubmission ? (studentMonitoringData.find(m => m.student_id === currentSubmission.student_id) || studentData.find(st => st.student_id === currentSubmission.student_id)) : null;
  const currentClass = currentAssignment ? (centerClassData.find(c => c.class_id === currentAssignment.class_id) || classData.find(c => c.class_id === currentAssignment.class_id)) : null;

  return `
    <div class="grading-page" style="background:#FAF7F2;min-height:100vh;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
            Chấm bài &amp; Quản lý Bài tập
          </h1>
          <div style="font-size:13.5px;color:#7F7A72;font-weight:500">
            ${user.role === 'teacher' ? 'Giáo viên phụ trách' : 'Trợ giảng'} theo dõi bài tập học viên nộp, giao bài mới và gửi nhận xét 2 chiều.
          </div>
        </div>
        <div>
          <button 
            id="btn-grading-create-assignment" 
            type="button" 
            style="background:#A93226;color:#FFFFFF;border:none;border-radius:12px;padding:10px 22px;font-size:13.5px;font-weight:700;display:inline-flex;align-items:center;gap:8px;box-shadow:0 3px 10px rgba(169,50,38,0.25);cursor:pointer;transition:all 0.15s ease"
          >
            <span style="font-size:18px;line-height:1">+</span>
            <span>Giao bài tập mới</span>
          </button>
        </div>
      </div>
      <div style="margin-bottom:24px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">Chấm bài</h1>
        <div style="font-size:13.5px;color:#7F7A72;font-weight:500">
          Bài tập tự luận, Writing & Speaking của học viên chờ chấm điểm và nhận xét.
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Tổng Quan Nằm Ngang -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <!-- Thẻ 1: Chờ chấm -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div style="font-size:32px;font-weight:800;color:#A93226;line-height:1;margin-bottom:8px">${pendingCount}</div>
          <div style="font-size:13.5px;font-weight:700;color:#A93226">Chờ chấm</div>
        </div>

        <!-- Thẻ 2: Đã chấm hôm nay -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div style="font-size:32px;font-weight:800;color:#15803D;line-height:1;margin-bottom:8px">${gradedTodayCount}</div>
          <div style="font-size:13.5px;font-weight:700;color:#15803D">Đã chấm</div>
        </div>

        <!-- Thẻ 3: Điểm TB lớp -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div style="font-size:32px;font-weight:800;color:#D97706;line-height:1;margin-bottom:8px">${avgClassScore}</div>
          <div style="font-size:13.5px;font-weight:700;color:#D97706">Điểm TB lớp</div>
        </div>

        <!-- Thẻ 4: Tỷ lệ nộp đúng hạn -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div style="font-size:32px;font-weight:800;color:#1D4ED8;line-height:1;margin-bottom:8px">${onTimeRate}</div>
          <div style="font-size:13.5px;font-weight:700;color:#1D4ED8">Tỷ lệ nộp đúng hạn</div>
        </div>
      </div>

      <!-- 3. Thanh Lọc & Tìm Kiếm -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        
        <!-- Cụm 3 Pills trạng thái -->
        <div style="display:flex;align-items:center;gap:10px">
          <button 
            type="button" 
            class="btn-grading-status-pill ${activeStatusFilter === 'submitted' ? 'active' : ''}" 
            data-status="submitted"
            style="
              border-radius:30px;
              padding:8px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${activeStatusFilter === 'submitted' 
                ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;box-shadow:0 2px 6px rgba(169,50,38,0.25);' 
                : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
              }
            "
          >
            Chờ chấm (${pendingCount})
          </button>

          <button 
            type="button" 
            class="btn-grading-status-pill ${activeStatusFilter === 'graded' ? 'active' : ''}" 
            data-status="graded"
            style="
              border-radius:30px;
              padding:8px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${activeStatusFilter === 'graded' 
                ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;box-shadow:0 2px 6px rgba(169,50,38,0.25);' 
                : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
              }
            "
          >
            Đã chấm (${gradedTodayCount})
          </button>

          <button 
            type="button" 
            class="btn-grading-status-pill ${activeStatusFilter === 'all' ? 'active' : ''}" 
            data-status="all"
            style="
              border-radius:30px;
              padding:8px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${activeStatusFilter === 'all' 
                ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;box-shadow:0 2px 6px rgba(169,50,38,0.25);' 
                : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
              }
            "
          >
            Tất cả (${allSubmissions.length})
          </button>
        </div>

        <!-- Cụm tìm kiếm và lọc lớp -->
        <div style="display:flex;align-items:center;gap:12px;flex:1;max-width:550px">
          <div style="position:relative;flex:1">
            <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#A8A29A;font-size:14px">🔍</span>
            <input 
              id="input-grading-search" 
              type="text" 
              placeholder="Tìm học viên hoặc tên bài tập..." 
              value="${searchQuery}"
              style="width:100%;height:38px;padding:0 12px 0 34px;border:1px solid #EAE4D8;border-radius:10px;background:#FDFBF7;font-size:13px;color:#2D2824;outline:none;box-sizing:border-box"
            />
          </div>

          <select 
            id="select-grading-class" 
            style="height:38px;padding:0 14px;border:1px solid #EAE4D8;border-radius:10px;background:#FFFFFF;font-size:13px;color:#2D2824;outline:none;cursor:pointer"
          >
            <option value="all" ${selectedClassFilter === 'all' ? 'selected' : ''}>Mọi lớp</option>
            ${Array.from(assignedClassIds).map(cid => {
              const cls = centerClassData.find(c => c.class_id === cid) || classData.find(c => c.class_id === cid);
              return `<option value="${cid}" ${selectedClassFilter === cid ? 'selected' : ''}>${cls?.class_name || cid}</option>`;
            }).join('')}
          </select>
        </div>

      </div>

      <!-- 4. Danh Sách Thẻ Bài Nộp Của Học Viên -->
      <div style="display:flex;flex-direction:column;gap:14px">
        ${filteredSubmissions.length === 0 ? `
          <div style="background:#FFFFFF;border:1px dashed #EAE4D8;border-radius:20px;padding:48px 24px;text-align:center;color:#7F7A72">
            <div style="font-size:42px;margin-bottom:12px">📭</div>
            <div style="font-size:16px;font-weight:700;color:#2D2824;margin-bottom:4px">Không tìm thấy bài nộp nào</div>
            <div style="font-size:13px;color:#A8A29A">Các bài tập nộp mới của học viên sẽ tự động hiển thị tại đây để bạn chấm điểm.</div>
          </div>
        ` : filteredSubmissions.map(sub => {
          const asn = studentAssignmentData.find(a => a.id === sub.assignment_id);
          const student = studentMonitoringData.find(m => m.student_id === sub.student_id) || studentData.find(st => st.student_id === sub.student_id);
          const cls = centerClassData.find(c => c.class_id === asn?.class_id) || classData.find(c => c.class_id === asn?.class_id);
          const isGraded = sub.status === 'graded';
          const maxSc = asn?.max_score || (asn?.id?.startsWith('ASN_NN') ? 10 : 100);

          return `
            <div 
              class="grading-submission-card" 
              data-id="${sub.id}"
              style="
                background:#FFFFFF;
                border:1px solid #EAE4D8;
                border-radius:18px;
                padding:20px 24px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:20px;
                box-shadow:0 1px 3px rgba(0,0,0,0.02);
                transition:all 0.15s ease;
              "
            >
              <!-- Thông tin học viên -->
              <div style="display:flex;align-items:center;gap:14px;min-width:220px">
                <div style="width:44px;height:44px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:800;color:#A93226;font-size:15px;flex-shrink:0">
                  ${student?.avatar_initials || 'HV'}
                </div>
                <div>
                  <div style="font-size:15px;font-weight:800;color:#2D2824;margin-bottom:3px">${student?.full_name || sub.student_id}</div>
                  <div style="font-size:12px;color:#7F7A72">${(student as any)?.student_code || 'HV2026'} · ${(student as any)?.cefr_level || cls?.class_code || 'Học viên'}</div>
                </div>
              </div>

              <!-- Chi tiết bài tập -->
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                  <span style="font-size:11px;font-weight:700;background:#F5F3ED;color:#7F7A72;border-radius:6px;padding:2px 8px">
                    ${cls?.class_name || 'Lớp phụ trách'}
                  </span>
                  <span style="font-size:11px;font-weight:700;color:${sub.submission_type === 'speaking' ? '#7C3AED' : '#0284C7'};background:${sub.submission_type === 'speaking' ? '#F5F3FF' : '#E0F2FE'};border-radius:6px;padding:2px 8px">
                    ${sub.submission_type === 'speaking' ? '🎙️ Speaking' : '✍️ Writing / Bài làm'}
                  </span>
                </div>
                <div style="font-size:14.5px;font-weight:700;color:#2D2824;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">
                  ${asn?.title || 'Bài tập'}
                </div>
                <div style="font-size:12px;color:#A8A29A;display:flex;align-items:center;gap:8px">
                  <span>📅 Nộp: ${sub.submitted_at.replace('T', ' ').slice(0, 16)}</span>
                  ${sub.attachment_name ? `<span>📎 ${sub.attachment_name}</span>` : ''}
                </div>
              </div>

              <!-- Trạng thái & Nút hành động -->
              <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
                ${isGraded ? `
                  <div style="background:#F0FDF4;color:#15803D;border:1px solid #BBF7D0;border-radius:30px;padding:6px 14px;font-size:12.5px;font-weight:700">
                    Đã chấm · ${sub.score}/${maxSc}đ
                  </div>
                ` : `
                  <div style="background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA;border-radius:30px;padding:6px 14px;font-size:12.5px;font-weight:700">
                    ● Chờ chấm
                  </div>
                `}

                <button 
                  type="button" 
                  class="btn-open-grading-modal" 
                  data-id="${sub.id}"
                  style="
                    height:38px;
                    padding:0 18px;
                    background:#A93226;
                    color:#FFFFFF;
                    border:none;
                    border-radius:10px;
                    font-size:13px;
                    font-weight:700;
                    cursor:pointer;
                    box-shadow:0 2px 6px rgba(169,50,38,0.25);
                    transition:all 0.15s ease;
                  "
                >
                  ${isGraded ? 'Xem lại' : 'Chấm ngay'}
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>

      <!-- 5. Modal / Drawer Chi Tiết Chấm Bài -->
      ${isGradingModalOpen && currentSubmission && currentAssignment ? `
        <div 
          id="modal-grading-backdrop" 
          style="
            position:fixed;
            inset:0;
            background:rgba(20, 16, 12, 0.6);
            backdrop-filter:blur(4px);
            z-index:9999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
          "
        >
          <div 
            style="
              background:#FFFFFF;
              border-radius:24px;
              border:1px solid #EAE4D8;
              width:100%;
              max-width:1050px;
              max-height:90vh;
              overflow-y:auto;
              box-shadow:0 24px 60px rgba(0,0,0,0.2);
              display:flex;
              flex-direction:column;
            "
          >
            <!-- Modal Header -->
            <div style="padding:20px 28px;border-bottom:1px solid #F2ECE1;display:flex;align-items:center;justify-content:space-between;background:#FCFAF7;border-radius:24px 24px 0 0">
              <div>
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">
                  ${currentAssignment.title}
                </div>
                <div style="font-size:12.5px;color:#7F7A72">
                  Học viên: <strong>${currentStudent?.full_name || currentSubmission.student_id}</strong> (${currentStudent?.student_code || 'HV2026'}) · Lớp: <strong>${currentClass?.class_name || 'IELTS Foundation'}</strong>
                </div>
              </div>
              <button id="btn-close-grading-modal" type="button" style="background:none;border:none;color:#A8A29A;font-size:22px;cursor:pointer;padding:4px 8px">✕</button>
            </div>

            <!-- Modal Body: Lưới 2 cột -->
            <div style="padding:28px;display:grid;grid-template-columns:1.2fr 1fr;gap:28px">
              
              <!-- CỘT TRÁI: ĐỀ BÀI & BÀI LÀM CỦA HỌC VIÊN -->
              <div style="display:flex;flex-direction:column;gap:20px">
                
                <!-- Khối Đề bài yêu cầu -->
                <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:16px;padding:18px 20px">
                  <div style="font-size:12.5px;font-weight:800;color:#A93226;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">
                    📌 Yêu cầu đề bài (Assignment Prompt)
                  </div>
                  <div style="font-size:13.5px;color:#2D2824;line-height:1.5;margin-bottom:8px">
                    ${currentAssignment.description}
                  </div>
                  <div style="font-size:12px;color:#7F7A72;font-style:italic">
                    💡 Hướng dẫn: ${currentAssignment.instructions || 'Làm theo format chuẩn.'}
                  </div>
                </div>

                <!-- Khối Bài làm của học viên -->
                <div style="background:#FFFFFF;border:1.5px solid #EAE4D8;border-radius:18px;padding:22px;box-shadow:0 1px 4px rgba(0,0,0,0.02)">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                    <div style="font-size:14px;font-weight:800;color:#2D2824">
                      ${currentSubmission.submission_type === 'speaking' ? '🎙️ Ghi âm Speaking của học viên' : '✍️ Bài viết Writing của học viên'}
                    </div>
                    ${currentSubmission.word_count ? `
                      <span style="font-size:11.5px;font-weight:700;background:#EFF6FF;color:#1D4ED8;padding:3px 10px;border-radius:20px">
                        ${currentSubmission.word_count} từ
                      </span>
                    ` : ''}
                  </div>

                  <!-- Nội dung bài làm: Speaking (Audio Player + Transcript) -->
                  ${currentSubmission.submission_type === 'speaking' ? `
                    <!-- Audio Player Box -->
                    <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:16px 18px;margin-bottom:18px">
                      <div style="display:flex;align-items:center;gap:14px">
                        <button 
                          id="btn-play-speaking-audio" 
                          type="button" 
                          style="
                            width:42px;
                            height:42px;
                            border-radius:50%;
                            background:#A93226;
                            color:#FFFFFF;
                            border:none;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:16px;
                            cursor:pointer;
                            flex-shrink:0;
                          "
                        >
                          ${isAudioPlaying ? '⏸' : '▶'}
                        </button>
                        <div style="flex:1">
                          <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:#7F7A72;margin-bottom:6px">
                            <span>Thời lượng audio</span>
                            <span id="audio-timer-display">${currentSubmission.audio_duration || '01:42'}</span>
                          </div>
                          <!-- Audio Waveform Visualization -->
                          <div style="display:flex;align-items:center;gap:3px;height:24px">
                            ${[30, 60, 45, 80, 100, 70, 50, 90, 85, 40, 65, 95, 75, 55, 85, 100, 60, 40, 70, 90, 65, 45, 80, 60, 30].map((h, i) => `
                              <div style="flex:1;height:${h}%;background:${isAudioPlaying && i < 12 ? '#A93226' : '#D1C7BA'};border-radius:3px;transition:all 0.2s"></div>
                            `).join('')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Transcript -->
                    <div>
                      <div style="font-size:12px;font-weight:700;color:#7F7A72;margin-bottom:6px">🗣️ Bản ghi lời thoại (Transcript):</div>
                      <div style="background:#FDFBF7;border:1px solid #EAE4D8;border-radius:12px;padding:16px;font-size:13.5px;color:#2D2824;line-height:1.6;font-style:italic">
                        "${currentSubmission.audio_transcript || 'Bản ghi âm lời nói của học viên...'}"
                      </div>
                    </div>
                  ` : `
                    <!-- Nội dung bài làm: Writing Text -->
                    <div style="background:#FDFBF7;border:1px solid #EAE4D8;border-radius:12px;padding:18px;font-size:14px;color:#2D2824;line-height:1.7;white-space:pre-wrap">
${currentSubmission.submission_text || 'Học viên nộp bài đính kèm tệp.'}
                    </div>
                  `}

                  <!-- File đính kèm -->
                  ${currentSubmission.attachment_name ? `
                    <div style="margin-top:14px;display:flex;align-items:center;gap:8px;font-size:12.5px;color:#7F7A72">
                      <span>Tệp nộp:</span>
                      <span style="background:#F2ECE1;color:#2D2824;padding:4px 10px;border-radius:8px;font-weight:600">
                        📎 ${currentSubmission.attachment_name} (${currentSubmission.attachment_size || '1.2 MB'})
                      </span>
                    </div>
                  ` : ''}

                </div>

              </div>

              <!-- CỘT PHẢI: BẢNG CHẤM ĐIỂM CỦA GIÁO VIÊN -->
              <div style="background:#FFFFFF;border:1.5px solid #EAE4D8;border-radius:18px;padding:22px;display:flex;flex-direction:column;justify-content:space-between">
                
                <div>
                  <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px;display:flex;align-items:center;gap:6px">
                    <span>📝</span>
                    <span>Bảng chấm điểm & Nhận xét</span>
                  </div>

                  <!-- 1. Ô nhập điểm số -->
                  <div style="margin-bottom:20px">
                    <label for="input-grading-score" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
                      Điểm số (Thang điểm ${currentAssignment?.max_score || (currentAssignment?.id?.startsWith('ASN_NN') ? 10 : 100)}) <span style="color:#A93226">*</span>
                    </label>
                    <div style="display:flex;align-items:center;gap:12px">
                      <input 
                        id="input-grading-score" 
                        type="number" 
                        step="${(currentAssignment?.max_score || (currentAssignment?.id?.startsWith('ASN_NN') ? 10 : 100)) <= 10 ? '0.5' : '1'}" 
                        min="0" 
                        max="${currentAssignment?.max_score || (currentAssignment?.id?.startsWith('ASN_NN') ? 10 : 100)}" 
                        value="${currentSubmission?.score !== null && currentSubmission?.score !== undefined ? currentSubmission.score : ((currentAssignment?.max_score || (currentAssignment?.id?.startsWith('ASN_NN') ? 10 : 100)) <= 10 ? '8.5' : '85')}" 
                        style="width:110px;height:44px;padding:0 14px;font-size:18px;font-weight:800;color:#A93226;border:1.5px solid #EAE4D8;border-radius:12px;outline:none;background:#FDFBF7"
                      />
                      <div style="font-size:12.5px;color:#15803D;font-weight:700;background:#F0FDF4;padding:8px 12px;border-radius:10px;border:1px solid #BBF7D0">
                        ⭐ Tự động thưởng: <span id="label-reward-xp">+${Math.round(((currentSubmission?.score !== null && currentSubmission?.score !== undefined ? currentSubmission.score : ((currentAssignment?.max_score || (currentAssignment?.id?.startsWith('ASN_NN') ? 10 : 100)) <= 10 ? 8.5 : 85))) * ((currentAssignment?.max_score || (currentAssignment?.id?.startsWith('ASN_NN') ? 10 : 100)) <= 10 ? 10 : 1))} XP</span>
                      </div>
                    </div>
                  </div>

                  <!-- 2. Nút nhận xét nhanh (Quick Feedback chips) -->
                  <div style="margin-bottom:18px">
                    <div style="font-size:12px;font-weight:700;color:#7F7A72;margin-bottom:8px">
                      ⚡ Chèn nhanh nhận xét (Quick Feedback Chips):
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px">
                      ${[
                        'Ngữ pháp chính xác',
                        'Từ vựng phong phú',
                        'Cần chú ý chia thì',
                        'Phát âm rõ ràng',
                        'Phát triển ý tốt',
                        'Cần mở rộng từ vựng'
                      ].map(chip => `
                        <button 
                          type="button" 
                          class="btn-quick-feedback-chip" 
                          data-text="${chip}"
                          style="
                            background:#F5F3ED;
                            color:#2D2824;
                            border:1px solid #EAE4D8;
                            border-radius:20px;
                            padding:5px 12px;
                            font-size:12px;
                            font-weight:600;
                            cursor:pointer;
                            transition:all 0.15s ease;
                          "
                        >
                          + ${chip}
                        </button>
                      `).join('')}
                    </div>
                  </div>

                  <!-- 3. Khung Textarea nhận xét chi tiết -->
                  <div style="margin-bottom:20px">
                    <label for="textarea-grading-feedback" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:6px">
                      Nhận xét chi tiết của Giáo viên <span style="color:#A93226">*</span>
                    </label>
                    <textarea 
                      id="textarea-grading-feedback" 
                      rows="6" 
                      placeholder="Nhập lời nhận xét chi tiết, điểm mạnh cần phát huy và các điểm cần cải thiện cho học viên..."
                      style="width:100%;padding:12px 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13.5px;color:#2D2824;line-height:1.5;outline:none;resize:vertical;box-sizing:border-box"
                    >${currentSubmission.teacher_feedback || 'Bài làm rất tốt, lập luận rõ ràng và áp dụng từ vựng bài học rất tự nhiên. Cần chú ý thêm một số lỗi ngữ pháp nhỏ.'}</textarea>
                  </div>

                </div>

                <!-- 4. Nút chính: Lưu điểm & Gửi trả bài -->
                <div>
                  <button 
                    id="btn-submit-save-grade" 
                    type="button" 
                    style="
                      width:100%;
                      height:46px;
                      background:#A93226;
                      color:#FFFFFF;
                      border:none;
                      border-radius:12px;
                      font-size:14.5px;
                      font-weight:700;
                      cursor:pointer;
                      box-shadow:0 3px 10px rgba(169,50,38,0.25);
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      gap:8px;
                    "
                  >
                    <span>📤</span>
                    <span>Lưu điểm & Gửi trả bài</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      ` : ''}

      <!-- 6. Modal Giao Bài Tập Mới -->
      ${isCreateAssignmentModalOpen ? `
        <div id="create-assignment-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(45,40,36,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px">
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:24px;width:100%;max-width:580px;box-shadow:0 20px 40px rgba(45,40,36,0.15);overflow:hidden;animation:fadeInUp 0.2s ease">
            
            <!-- Modal Header -->
            <div style="padding:20px 24px;border-bottom:1px solid #EAE4D8;background:#FFFDFB;display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:22px">📝</span>
                <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0">
                  Giao bài tập mới cho học viên
                </h3>
              </div>
              <button id="btn-close-create-asn-modal" type="button" style="background:none;border:none;font-size:20px;color:#7F7A72;cursor:pointer;padding:4px">
                ✕
              </button>
            </div>

            <!-- Modal Form -->
            <form id="grading-create-asn-form" style="padding:24px;display:flex;flex-direction:column;gap:16px">
              
              <!-- Tiêu đề bài tập -->
              <div>
                <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                  Tiêu đề bài tập <span style="color:#A93226">*</span>
                </label>
                <input 
                  type="text" 
                  id="new-asn-title" 
                  placeholder="VD: Writing Task 1: Academic Line Graph, Speaking Unit 3..." 
                  required 
                  style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none"
                />
              </div>

              <!-- Lớp học & Thang điểm -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div>
                  <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                    Lớp học tiếp nhận <span style="color:#A93226">*</span>
                  </label>
                  <select id="new-asn-class" required style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none">
                    ${Array.from(assignedClassIds).map(cid => {
                      const cls = centerClassData.find(c => c.class_id === cid) || classData.find(c => c.class_id === cid);
                      return `<option value="${cid}">${cls?.class_name || cid} (${cls?.class_code || cid})</option>`;
                    }).join('')}
                  </select>
                </div>

                <div>
                  <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                    Thang điểm tối đa <span style="color:#A93226">*</span>
                  </label>
                  <select id="new-asn-max-score" required style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none">
                    <option value="10" selected>Thang điểm 10 (IELTS Band 0.0 – 9.0)</option>
                    <option value="100">Thang điểm 100 (Bài thi / Dự án)</option>
                  </select>
                </div>
              </div>

              <!-- Hình thức nộp & Hạn nộp -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div>
                  <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                    Hình thức nộp bài <span style="color:#A93226">*</span>
                  </label>
                  <select id="new-asn-format" required style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none">
                    <option value="file" selected>Tệp đính kèm (.doc, .docx, .pdf)</option>
                    <option value="link">Đường dẫn liên kết (Drive / Youtube)</option>
                    <option value="text">Nhập văn bản trực tuyến</option>
                  </select>
                </div>

                <div>
                  <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                    Hạn nộp (Deadline) <span style="color:#A93226">*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    id="new-asn-deadline" 
                    value="2026-11-28T23:59" 
                    required 
                    style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none"
                  />
                </div>
              </div>

              <!-- Mô tả & Đề bài -->
              <div>
                <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                  Mô tả đề bài &amp; Yêu cầu <span style="color:#A93226">*</span>
                </label>
                <textarea 
                  id="new-asn-desc" 
                  placeholder="Ghi rõ đề bài, yêu cầu số lượng từ hoặc các điểm ngữ pháp cần vận dụng..." 
                  required 
                  style="width:100%;min-height:80px;padding:10px 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none;resize:vertical;font-family:inherit"
                ></textarea>
              </div>

              <!-- Hướng dẫn làm bài -->
              <div>
                <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                  Hướng dẫn làm bài
                </label>
                <input 
                  type="text" 
                  id="new-asn-instructions" 
                  placeholder="VD: Nộp đúng định dạng PDF, hoàn thành trước 23h59..." 
                  style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none"
                />
              </div>

              <!-- Modal Footer -->
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:8px">
                <button 
                  type="button" 
                  id="btn-cancel-create-asn" 
                  style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:99px;padding:8px 18px;font-size:13px;font-weight:600;color:#7F7A72;cursor:pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  style="background:#A93226;color:#FFFFFF;border:none;border-radius:99px;padding:9px 24px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(169,50,38,0.25)"
                >
                  Phát hành bài tập
                </button>
              </div>

            </form>
          </div>
        </div>
      ` : ''}

    </div>
  `;
}

export function initGradingPage(): void {
  const state = getState();
  const user = state.currentUser;
  if (!user || (user.role !== 'teacher' && user.role !== 'teaching_assistant')) return;

  // 1. Status Filter Pills
  document.querySelectorAll<HTMLButtonElement>('.btn-grading-status-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const st = btn.dataset.status as SubmissionFilterStatus;
      if (st) {
        activeStatusFilter = st;
        reRender();
      }
    });
  });

  // 2. Class Filter
  const classSelect = document.getElementById('select-grading-class') as HTMLSelectElement | null;
  classSelect?.addEventListener('change', () => {
    selectedClassFilter = classSelect.value;
    reRender();
  });

  // 3. Search input
  const searchInput = document.getElementById('input-grading-search') as HTMLInputElement | null;
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value;
    setTimeout(() => {
      if (searchQuery === searchInput.value) {
        reRender();
      }
    }, 250);
  });

  // 4. Open Grading Modal
  document.querySelectorAll<HTMLButtonElement>('.btn-open-grading-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (id) {
        selectedSubmissionId = id;
        isGradingModalOpen = true;
        isAudioPlaying = false;
        reRender();
      }
    });
  });

  // 5. Close Grading Modal
  document.getElementById('btn-close-grading-modal')?.addEventListener('click', () => {
    isGradingModalOpen = false;
    isAudioPlaying = false;
    if (audioPlayTimer) clearInterval(audioPlayTimer);
    reRender();
  });

  // 6. Audio Player Toggle
  document.getElementById('btn-play-speaking-audio')?.addEventListener('click', () => {
    isAudioPlaying = !isAudioPlaying;
    if (isAudioPlaying) {
      showToast('Đang phát đoạn ghi âm Speaking của học viên...', 'info');
      audioPlayTimer = setInterval(() => {
        audioCurrentSeconds++;
      }, 1000);
    } else {
      if (audioPlayTimer) clearInterval(audioPlayTimer);
    }
    reRender();
  });

  // 7. Live score input -> update reward XP label
  const scoreInput = document.getElementById('input-grading-score') as HTMLInputElement | null;
  const rewardLabel = document.getElementById('label-reward-xp');
  scoreInput?.addEventListener('input', () => {
    const scoreVal = parseFloat(scoreInput.value) || 0;
    const calcXp = scoreVal <= 10 ? Math.round(scoreVal * 10) : Math.round(scoreVal);
    if (rewardLabel) {
      rewardLabel.textContent = `+${calcXp} XP`;
    }
  });

  // 8. Quick Feedback Chips
  const feedbackTextarea = document.getElementById('textarea-grading-feedback') as HTMLTextAreaElement | null;
  document.querySelectorAll<HTMLButtonElement>('.btn-quick-feedback-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.text;
      if (text && feedbackTextarea) {
        const currentVal = feedbackTextarea.value.trim();
        feedbackTextarea.value = currentVal ? `${currentVal}. ${text}` : text;
        feedbackTextarea.focus();
      }
    });
  });

  // 9. Submit Grade & Send Back to Student
  document.getElementById('btn-submit-save-grade')?.addEventListener('click', async () => {
    if (!selectedSubmissionId || !scoreInput || !feedbackTextarea) return;

    const sub = studentSubmissionData.find(s => s.id === selectedSubmissionId);
    const asn = sub ? studentAssignmentData.find(a => a.id === sub.assignment_id) : null;
    const maxScore = asn?.max_score || (asn?.id?.startsWith('ASN_NN') ? 10 : 100);

    const score = parseFloat(scoreInput.value);
    if (isNaN(score) || score < 0 || score > maxScore) {
      showToast(`Vui lòng nhập điểm số hợp lệ từ 0 đến ${maxScore}!`, 'error');
      return;
    }

    const feedback = feedbackTextarea.value.trim();
    if (!feedback) {
      showToast('Vui lòng nhập nhận xét chi tiết cho học viên!', 'error');
      return;
    }

    const xp = maxScore <= 10 ? Math.round(score * 10) : Math.round(score);

    // 1. Local update
    gradeSubmissionLocal(selectedSubmissionId, score, feedback, user.staff_id, xp);

    // 2. Remote API update
    try {
      await submitGradeApi(selectedSubmissionId, {
        teacher_id: user.staff_id || 'STF003',
        role: user.role,
        score,
        teacher_feedback: feedback,
        xp_awarded: xp,
      });
    } catch {
      // offline fallback is already handled locally
    }

    updateBadgeUI();
    showToast(`Đã chấm ${score}/${maxScore} điểm và gửi trả bài cho học viên thành công (+${xp} XP)!`, 'success');
    isGradingModalOpen = false;
    isAudioPlaying = false;
    if (audioPlayTimer) clearInterval(audioPlayTimer);
    reRender();
  });

  // 10. Open & Handle "+ Giao bài tập mới" Modal
  document.getElementById('btn-grading-create-assignment')?.addEventListener('click', () => {
    isCreateAssignmentModalOpen = true;
    reRender();
  });

  document.getElementById('btn-close-create-asn-modal')?.addEventListener('click', () => {
    isCreateAssignmentModalOpen = false;
    reRender();
  });

  document.getElementById('btn-cancel-create-asn')?.addEventListener('click', () => {
    isCreateAssignmentModalOpen = false;
    reRender();
  });

  document.getElementById('create-assignment-backdrop')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('create-assignment-backdrop')) {
      isCreateAssignmentModalOpen = false;
      reRender();
    }
  });

  const createAsnForm = document.getElementById('grading-create-asn-form') as HTMLFormElement | null;
  createAsnForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = (document.getElementById('new-asn-title') as HTMLInputElement).value.trim();
    const classId = (document.getElementById('new-asn-class') as HTMLSelectElement).value;
    const maxScore = parseFloat((document.getElementById('new-asn-max-score') as HTMLSelectElement).value) || 10;
    const format = (document.getElementById('new-asn-format') as HTMLSelectElement).value as 'file' | 'link' | 'text';
    const deadline = (document.getElementById('new-asn-deadline') as HTMLInputElement).value;
    const desc = (document.getElementById('new-asn-desc') as HTMLTextAreaElement).value.trim();
    const instructions = (document.getElementById('new-asn-instructions') as HTMLInputElement).value.trim();

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
      assigned_by: user.full_name || 'Giáo viên phụ trách',
    };

    studentAssignmentData.unshift(newAsn);
    saveStudentAssignments(studentAssignmentData);

    selectedClassFilter = classId;
    isCreateAssignmentModalOpen = false;
    reRender();
    updateBadgeUI();

    const targetCls = centerClassData.find(c => c.class_id === classId) || classData.find(c => c.class_id === classId);
    showToast(`Đã giao bài tập mới "${title}" thành công cho lớp ${targetCls?.class_name || classId}!`, 'success');
  });
}

function reRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderGradingPage();
    initGradingPage();
  }
}
