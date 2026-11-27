// ============================================
// EduTrack English - Quizzes Page (Quiz Trắc nghiệm)
// Warm Minimalist Design System
// ============================================

import type { Quiz, QuizStatus } from '../types.ts';
import { classData, quizData, quizAttemptData, studentData, enrollmentData } from '../data.ts';
import { getState } from '../state.ts';
import { icons, formatDate, formatScore, showToast } from '../utils.ts';

const quizStatusLabels: Record<QuizStatus, string> = {
  submitted: 'Đã nộp',
  in_progress: 'Đang làm',
  not_started: 'Chưa làm',
  no_data: 'Không có dữ liệu',
};

const quizStatusBadgeClass: Record<QuizStatus, string> = {
  submitted: 'badge-green',
  in_progress: 'badge-amber',
  not_started: 'badge-gray',
  no_data: 'badge-gray',
};

function getStudentName(studentId: string): string {
  return studentData.find(s => s.student_id === studentId)?.full_name ?? studentId;
}

function getFilteredClasses() {
  const campus = getState().selectedCampus;
  if (campus === 'all') return classData;
  return classData.filter(c => c.campus === campus);
}

function renderQuizCard(quiz: Quiz): string {
  const attempts = quizAttemptData.filter(a => a.quiz_id === quiz.quiz_id);
  const enrolledStudents = enrollmentData.filter(e => e.class_id === quiz.class_id && e.status === 'active');

  // Stats
  const submittedAttempts = attempts.filter(a => a.status === 'submitted');
  const completionRate = enrolledStudents.length > 0 ? Math.round((submittedAttempts.length / enrolledStudents.length) * 100) : 0;
  const avgScore = submittedAttempts.length > 0
    ? submittedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / submittedAttempts.length
    : null;

  const topicColor = quiz.topic === 'Vocabulary' ? 'badge-blue'
    : quiz.topic === 'Grammar' ? 'badge-amber'
      : quiz.topic === 'Listening' ? 'badge-teal'
        : quiz.topic === 'Reading' ? 'badge-green'
          : 'badge-gray';

  return `
    <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;overflow:hidden;box-shadow:0 3px 12px rgba(45,40,36,0.03);margin-bottom:20px">
      <div style="background:#FAF5EE;padding:16px 22px;border-bottom:1px solid #EAE4D8;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="color:#A93226">${icons.quiz}</span>
            <h3 style="margin:0;font-size:16px;font-weight:800;color:#2D2824">${quiz.title}</h3>
            ${quiz.topic ? `<span class="badge ${topicColor}" style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:9999px">${quiz.topic}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:14px;font-size:12.5px;color:#7F7A72;margin-top:4px;flex-wrap:wrap">
            <span>❓ <strong>${quiz.total_questions}</strong> câu hỏi</span>
            <span>🎯 Thang điểm: <strong>${quiz.max_score}đ</strong></span>
            <span style="display:flex;align-items:center;gap:4px">📅 Hạn chót: <strong style="color:#2D2824">${formatDate(quiz.due_date)}</strong></span>
          </div>
        </div>
        <div style="display:flex;gap:12px">
          <div style="text-align:center;padding:8px 14px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px">
            <div style="font-size:18px;font-weight:900;color:${completionRate >= 80 ? '#166534' : completionRate >= 50 ? '#D97706' : '#DC2626'}">${completionRate}%</div>
            <div style="font-size:11px;font-weight:700;color:#7F7A72">Hoàn thành</div>
          </div>
          <div style="text-align:center;padding:8px 14px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px">
            <div style="font-size:18px;font-weight:900;color:#A93226">${avgScore !== null ? avgScore.toFixed(1) : '—'}</div>
            <div style="font-size:11px;font-weight:700;color:#7F7A72">Điểm TB</div>
          </div>
        </div>
      </div>

      <div style="padding:0;overflow-x:auto">
        ${attempts.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em;background:#FFFDF9">
                <th style="padding:12px 18px">HỌC VIÊN</th>
                <th style="padding:12px 18px">ĐIỂM SỐ</th>
                <th style="padding:12px 18px">ĐÚNG / TỔNG</th>
                <th style="padding:12px 18px">THỜI GIAN LÀM</th>
                <th style="padding:12px 18px">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              ${attempts.map(a => {
                const s = studentData.find(st => st.student_id === a.student_id);
                return `
                  <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" onmouseover="this.style.background='#FAF7F2'" onmouseout="this.style.background='transparent'">
                    <td style="padding:12px 18px">
                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:30px;height:30px;border-radius:50%;background:#F5E6E4;border:1px solid #E8C9C5;color:#A93226;font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center">
                          ${s?.avatar_initials ?? '?'}
                        </div>
                        <div>
                          <div style="font-weight:700;color:#2D2824">${getStudentName(a.student_id)}</div>
                          <div style="font-size:11px;color:#7F7A72">${s?.student_code || a.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style="padding:12px 18px">
                      <strong style="color:${(a.score ?? 0) >= 80 ? '#166534' : (a.score ?? 0) >= 60 ? '#D97706' : '#DC2626'}">
                        ${formatScore(a.score, quiz.max_score)}
                      </strong>
                    </td>
                    <td style="padding:12px 18px;font-weight:700;color:#2D2824">
                      ${a.correct_answers}/${a.total_questions} câu
                    </td>
                    <td style="padding:12px 18px;color:#7F7A72">
                      ${a.time_spent_minutes ? `${a.time_spent_minutes} phút` : '—'}
                    </td>
                    <td style="padding:12px 18px">
                      <span class="badge ${quizStatusBadgeClass[a.status]}" style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px">
                        ${quizStatusLabels[a.status]}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : `
          <div style="padding:24px;text-align:center;color:#7F7A72;font-size:13px">
            Chưa có học viên nào làm bài quiz này.
          </div>
        `}
      </div>
    </div>
  `;
}

function renderAllQuizzesByClass(): string {
  const classes = getFilteredClasses();
  let html = '';

  classes.forEach(cls => {
    const quizzes = quizData.filter(q => q.class_id === cls.class_id);
    if (quizzes.length === 0) return;

    html += `
      <div style="margin-bottom:28px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span style="font-size:18px">🏫</span>
          <h2 style="font-size:17px;font-weight:800;color:#2D2824;margin:0">
            ${cls.class_name}
          </h2>
          <span class="badge" style="background:#FFF8EC;color:#EA580C;border:1px solid #F5DEC2;font-size:11.5px;font-weight:800;padding:2px 10px;border-radius:9999px">${cls.class_code}</span>
          <span style="font-size:12.5px;color:#7F7A72;font-weight:600">(${quizzes.length} bài thi)</span>
        </div>
        ${quizzes.map(q => renderQuizCard(q)).join('')}
      </div>
    `;
  });

  if (!html) {
    html = `
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:48px 24px;text-align:center">
        <div style="font-size:48px;margin-bottom:12px">🎯</div>
        <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0 0 6px 0">Chưa có bài quiz nào</h3>
        <p style="color:#7F7A72;margin:0;font-size:13px">Không tìm thấy quiz trắc nghiệm nào trong bộ lọc hiện tại.</p>
      </div>
    `;
  }

  return html;
}

export function renderQuizzesPage(): string {
  const classes = getFilteredClasses();
  const totalQuizzes = quizData.length;
  const totalAttempts = quizAttemptData.length;
  const passedAttempts = quizAttemptData.filter(a => (a.score ?? 0) >= 70).length;
  const avgOverallScore = totalAttempts > 0 
    ? Math.round(quizAttemptData.reduce((sum, a) => sum + (a.score ?? 0), 0) / totalAttempts) 
    : 0;

  return `
    <div class="quizzes-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>🎯</span>
            <span>Quiz Trắc nghiệm &amp; Đấu trường Luyện thi</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            Quản lý ngân hàng đề trắc nghiệm, theo dõi tỷ lệ hoàn thành và điểm số phản xạ của học viên
          </div>
        </div>
        <button class="btn btn-primary" id="btn-create-quiz" style="border-radius:9999px;font-weight:700;font-size:13px;padding:9px 20px;background:#A93226;border:none;color:#FFFFFF;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer">
          ${icons.plus} Tạo Quiz mới
        </button>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${totalQuizzes}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tổng bài Quiz đang mở</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${totalAttempts}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Lượt nộp bài thi</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0}%
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tỷ lệ đạt chuẩn (≥70đ)</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#2563EB;line-height:1;margin-bottom:8px">
            ${avgOverallScore}%
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Điểm trung bình toàn viện</div>
        </div>
      </div>

      <!-- 3. Filter Bar -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:14px 20px;display:flex;align-items:center;gap:14px;margin-bottom:24px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
        <span style="font-size:13px;font-weight:700;color:#2D2824">🔍 Lọc theo lớp học:</span>
        <select id="quiz-class-filter" class="form-select" style="min-width:280px;height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none;cursor:pointer">
          <option value="">Tất cả lớp học</option>
          ${classes.map(c => `<option value="${c.class_id}">${c.class_name} (${c.class_code})</option>`).join('')}
        </select>
      </div>

      <!-- 4. Quizzes Content -->
      <div id="quizzes-content">
        ${renderAllQuizzesByClass()}
      </div>

      <!-- Modal Container -->
      <div id="quiz-modal-container"></div>
    </div>
  `;
}

export function initQuizzesPage(): void {
  const classFilter = document.getElementById('quiz-class-filter') as HTMLSelectElement | null;
  const contentEl = document.getElementById('quizzes-content');
  const modalContainer = document.getElementById('quiz-modal-container');

  function renderView() {
    if (!contentEl) return;
    const selectedClassId = classFilter?.value;

    if (!selectedClassId) {
      contentEl.innerHTML = renderAllQuizzesByClass();
    } else {
      const cls = classData.find(c => c.class_id === selectedClassId);
      const quizzes = quizData.filter(q => q.class_id === selectedClassId);

      if (quizzes.length === 0) {
        contentEl.innerHTML = `
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:48px 24px;text-align:center">
            <div style="font-size:48px;margin-bottom:12px">🎯</div>
            <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0 0 6px 0">Chưa có bài quiz nào</h3>
            <p style="color:#7F7A72;margin:0;font-size:13px">Lớp ${cls?.class_name ?? ''} chưa có quiz trắc nghiệm nào.</p>
          </div>
        `;
      } else {
        contentEl.innerHTML = `
          <div style="margin-bottom:20px">
            <h2 style="font-size:18px;font-weight:800;color:#2D2824;display:flex;align-items:center;gap:8px">
              <span>🏫</span>
              <span>${cls?.class_name ?? ''}</span>
              <span class="badge" style="background:#FFF8EC;color:#EA580C;border:1px solid #F5DEC2;font-size:12px;font-weight:800;padding:2px 10px;border-radius:9999px">${cls?.class_code ?? ''}</span>
            </h2>
          </div>
          ${quizzes.map(q => renderQuizCard(q)).join('')}
        `;
      }
    }
  }

  classFilter?.addEventListener('change', renderView);

  // Create quiz modal
  document.getElementById('btn-create-quiz')?.addEventListener('click', () => {
    if (!modalContainer) return;
    const availableClasses = classData.filter(c => c.status === 'in_progress');

    modalContainer.innerHTML = `
      <div class="modal-backdrop" id="create-quiz-backdrop" style="position:fixed;inset:0;background:rgba(20,16,12,0.55);backdrop-filter:blur(3px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px">
        <div class="modal" style="max-width:540px;width:100%;background:#FFFFFF;border:1px solid #EAE4D8;border-radius:24px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,0.18)">
          <div class="modal-header" style="background:#FAF5EE;padding:18px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between">
            <h3 style="margin:0;font-size:17px;font-weight:800;color:#2D2824;display:flex;align-items:center;gap:8px">
              <span>🎯</span>
              <span>Tạo bài Quiz mới</span>
            </h3>
            <button class="btn btn-ghost btn-icon" id="close-create-quiz-modal" type="button" style="background:none;border:none;font-size:18px;cursor:pointer;color:#7F7A72">✕</button>
          </div>
          <form id="create-quiz-form">
            <div class="modal-body" style="padding:24px;display:flex;flex-direction:column;gap:16px">
              <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
                <label class="form-label" style="font-size:13px;font-weight:700;color:#2D2824">Tiêu đề Quiz <span style="color:#DC2626">*</span></label>
                <input type="text" class="form-input" id="new-quiz-title" placeholder="Ví dụ: Quiz Vocabulary Unit 9-12..." required style="height:40px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none" />
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
                <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
                  <label class="form-label" style="font-size:13px;font-weight:700;color:#2D2824">Lớp học <span style="color:#DC2626">*</span></label>
                  <select class="form-select" id="new-quiz-class" required style="height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none;cursor:pointer">
                    ${availableClasses.map(c => `<option value="${c.class_id}">${c.class_name} (${c.class_code})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
                  <label class="form-label" style="font-size:13px;font-weight:700;color:#2D2824">Chủ đề <span style="color:#DC2626">*</span></label>
                  <select class="form-select" id="new-quiz-topic" style="height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none;cursor:pointer">
                    <option value="Vocabulary">Vocabulary</option>
                    <option value="Grammar">Grammar</option>
                    <option value="Listening">Listening</option>
                    <option value="Reading">Reading</option>
                    <option value="General">Tổng hợp</option>
                  </select>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px">
                <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
                  <label class="form-label" style="font-size:12.5px;font-weight:700;color:#2D2824">Số câu hỏi <span style="color:#DC2626">*</span></label>
                  <input type="number" class="form-input" id="new-quiz-questions" value="20" min="5" max="100" required style="height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none" />
                </div>
                <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
                  <label class="form-label" style="font-size:12.5px;font-weight:700;color:#2D2824">Điểm tối đa <span style="color:#DC2626">*</span></label>
                  <input type="number" class="form-input" id="new-quiz-max-score" value="100" min="10" max="1000" required style="height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none" />
                </div>
                <div class="form-group" style="display:flex;flex-direction:column;gap:6px">
                  <label class="form-label" style="font-size:12.5px;font-weight:700;color:#2D2824">Hạn nộp <span style="color:#DC2626">*</span></label>
                  <input type="date" class="form-input" id="new-quiz-due-date" value="${new Date().toISOString().split('T')[0]}" required style="height:40px;padding:0 12px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;background:#FAF7F2;color:#2D2824;outline:none" />
                </div>
              </div>
            </div>

            <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #EAE4D8;background:#FAF5EE">
              <button type="button" class="btn btn-secondary" id="cancel-create-quiz" style="height:38px;padding:0 18px;border-radius:9999px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;font-weight:700;cursor:pointer">Hủy</button>
              <button type="submit" class="btn btn-primary" style="height:38px;padding:0 20px;border-radius:9999px;border:none;background:#A93226;color:#FFFFFF;font-weight:700;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                ${icons.plus} Tạo bài Quiz
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalContainer.innerHTML = ''; };
    document.getElementById('close-create-quiz-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancel-create-quiz')?.addEventListener('click', closeModal);
    document.getElementById('create-quiz-backdrop')?.addEventListener('click', (ev) => {
      if (ev.target === document.getElementById('create-quiz-backdrop')) closeModal();
    });

    document.getElementById('create-quiz-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const title = (document.getElementById('new-quiz-title') as HTMLInputElement).value.trim();
      const classId = (document.getElementById('new-quiz-class') as HTMLSelectElement).value;
      const topic = (document.getElementById('new-quiz-topic') as HTMLSelectElement).value;
      const questions = parseInt((document.getElementById('new-quiz-questions') as HTMLInputElement).value, 10) || 20;
      const maxScore = parseFloat((document.getElementById('new-quiz-max-score') as HTMLInputElement).value) || 100;
      const dueDate = (document.getElementById('new-quiz-due-date') as HTMLInputElement).value;

      if (!title || !classId) return;

      const newId = `QZ${String(quizData.length + 1).padStart(3, '0')}`;
      const newQuiz: Quiz = {
        quiz_id: newId,
        class_id: classId,
        title,
        topic,
        total_questions: questions,
        max_score: maxScore,
        due_date: dueDate,
      };

      quizData.unshift(newQuiz);
      closeModal();
      renderView();
      showToast(`Đã tạo thành công bài Quiz "${title}"!`, 'success');
    });
  });
}
