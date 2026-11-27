// ============================================
// EduTrack - Student Interactive Quiz & Practice Arena
// Đấu trường Quiz & Luyện tập tương tác trực tuyến
// Bảng màu Tím Pastel Gamified (#F8F6FF, #E8E2F8, #6C47D9)
// ============================================

import { getState } from '../state.ts';
import { studentData, quizData, quizAttemptData, classData } from '../data.ts';
import { icons, formatDate, showToast } from '../utils.ts';
import type { QuizAttempt } from '../types.ts';

export function renderStudentQuizzesPage(): string {
  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV001';
  const student = studentData.find(s => s.student_id === studentId) || studentData[0];

  const myAttempts = quizAttemptData.filter(q => q.student_id === student.student_id);
  const attemptMap = new Map<string, QuizAttempt>();
  myAttempts.forEach(att => attemptMap.set(att.quiz_id, att));

  const completedCount = myAttempts.filter(a => a.status === 'submitted').length;
  const avgQuizScore = completedCount > 0
    ? Math.round(myAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / completedCount)
    : '—';

  return `
    <div class="student-quizzes-page" style="background:#F8F6FF;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- 1. Header Trang đồng nhất Gamified Pastel Purple -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
            Luyện tập &amp; Quiz
          </h1>
          <div style="font-size:14px;color:#736B7C;font-weight:500">
            Đấu trường Quiz &amp; Ôn tập phản xạ tương tác trực tuyến · Học viên: <strong style="color:#2D2824">${student.full_name}</strong> (${student.student_code})
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
            ${quizData.length}
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Tổng bài Quiz</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#6C47D9"></div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:20px 22px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
          <div style="font-size:32px;font-weight:900;color:#10B981;line-height:1;margin-bottom:8px">
            ${completedCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Đã hoàn thành</div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:20px 22px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
          <div style="font-size:32px;font-weight:900;color:#EA580C;line-height:1;margin-bottom:8px">
            ${quizData.length - completedCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Quiz chưa làm</div>
        </div>

        <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:20px 22px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
          <div style="font-size:32px;font-weight:900;color:#6C47D9;line-height:1;margin-bottom:8px">
            ${avgQuizScore}%
          </div>
          <div style="font-size:13px;font-weight:700;color:#736B7C">Điểm TB Quiz</div>
        </div>
      </div>

      <!-- Quiz Cards Grid -->
      <div class="card" style="border:1.5px solid #E8E2F8;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px rgba(108,71,217,0.04);background:#FFFFFF">
        <div class="card-header" style="background:#F3EFFF;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #E8E2F8">
          <div style="display:flex;align-items:center;gap:8px">
            <h3 style="margin:0;font-size:15px;font-weight:800;color:#2D2824;display:flex;align-items:center;gap:8px">
              <span style="color:#6C47D9">🎯</span> Bộ Quiz Trắc Nghiệm Đang Mở
            </h3>
          </div>
          <span class="badge" style="background:#EDE7FB;color:#6C47D9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;border:1px solid #D8CCF8">${quizData.length} bài thi</span>
        </div>

        <div class="card-body" style="padding:24px">
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:20px">
            ${quizData.map(q => {
              const attempt = attemptMap.get(q.quiz_id);
              const cls = classData.find(c => c.class_id === q.class_id);
              const isDone = attempt && attempt.status === 'submitted';

              return `
                <div class="quiz-card" style="border:1.5px solid ${isDone ? 'rgba(16,185,129,0.35)' : '#E8E2F8'};border-radius:20px;padding:22px;background:${isDone ? 'rgba(16,185,129,0.02)' : '#FFFFFF'};box-shadow:0 2px 10px rgba(108,71,217,0.03);display:flex;flex-direction:column;justify-content:space-between">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                      <span class="badge" style="background:#EDE7FB;color:#6C47D9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;border:1px solid #D8CCF8">${cls?.class_code ?? q.class_id}</span>
                      ${isDone ? `
                        <span class="badge" style="background:rgba(16,185,129,0.12);color:#059669;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:9999px;border:1px solid rgba(16,185,129,0.3)">✓ Đạt ${attempt.score}/100đ</span>
                      ` : `
                        <span class="badge" style="background:#FEF3C7;color:#D97706;font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;border:1px solid #FCD34D">Chưa làm</span>
                      `}
                    </div>
                    <h4 style="margin:0 0 6px 0;font-size:15px;font-weight:800;color:#2D2824">
                      ${q.title}
                    </h4>
                    <p style="margin:0 0 12px 0;font-size:13px;color:#736B7C;line-height:1.45">
                      ${q.description || 'Bài kiểm tra trắc nghiệm nhanh củng cố kiến thức trọng tâm.'}
                    </p>
                    <div style="display:flex;gap:12px;font-size:11.5px;color:#8E8897;margin-bottom:14px;flex-wrap:wrap">
                      <span>⏱️ ${q.time_limit_minutes || 15} phút</span>
                      <span>❓ ${q.total_questions} câu hỏi</span>
                      <span>🎯 Chuẩn đạt: ${q.passing_score || 70}%</span>
                    </div>
                  </div>

                  <div style="border-top:1px solid #F3EFFF;padding-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                    <span style="font-size:11.5px;color:#8E8897">
                      ${isDone ? `Làm lúc: ${formatDate(attempt.submitted_at || '')}` : 'Chưa có lượt thi'}
                    </span>
                    <button type="button" class="btn btn-primary btn-sm btn-start-quiz" data-quiz-id="${q.quiz_id}" style="font-size:12px;font-weight:700;padding:6px 16px;border-radius:9999px;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:4px;${isDone ? 'background:#F3EFFF;color:#6C47D9;border:1.5px solid #E8E2F8;' : 'background:#6C47D9;color:#FFFFFF;box-shadow:0 2px 8px rgba(108,71,217,0.25);'}">
                      ${isDone ? 'Luyện tập lại ↺' : 'Làm bài ngay 🎯'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Quiz Player Modal Container -->
      <div id="quiz-modal-container"></div>
    </div>
  `;
}

export function initStudentQuizzesPage(): void {
  document.querySelectorAll<HTMLElement>('.btn-start-quiz').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.dataset.quizId;
      if (qId) openQuizPlayerModal(qId);
    });
  });
}

function refreshQuizzesPage(): void {
  const el = document.getElementById('page-content');
  if (el) {
    el.innerHTML = renderStudentQuizzesPage();
    initStudentQuizzesPage();
  }
}

// === Interactive Quiz Player Modal ===
function openQuizPlayerModal(quizId: string): void {
  const container = document.getElementById('quiz-modal-container');
  if (!container) return;

  const quiz = quizData.find(q => q.quiz_id === quizId);
  if (!quiz) return;

  const sampleQuestions = [
    {
      q: 'Trong bài thi IELTS Writing Task 2, yếu tố "Lexical Resource" chiếm bao nhiêu phần trăm tổng điểm bài viết?',
      options: ['15%', '20%', '25%', '30%'],
      correct: 2,
      explain: 'IELTS Writing Task 2 được chấm theo 4 tiêu chí đồng đều 25% mỗi tiêu chí: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.',
    },
    {
      q: 'Từ nào sau đây là từ đồng nghĩa học thuật tốt nhất của từ "important" trong văn cảnh học thuật?',
      options: ['Big', 'Crucial / Paramount', 'Nice', 'Huge'],
      correct: 1,
      explain: '"Crucial" và "Paramount" mang sắc thái học thuật và mức độ nhấn mạnh tính quan trọng cao nhất.',
    },
    {
      q: 'Cấu trúc câu phức "Although..., ..." sử dụng để diễn đạt ý gì trong bài luận phản biện?',
      options: ['Nguyên nhân - kết quả', 'Sự nhượng bộ và đối lập (Concession)', 'Thời gian kế tiếp', 'Mục đích hành động'],
      correct: 1,
      explain: 'Mệnh đề trạng ngữ bắt đầu bằng "Although" diễn tả sự nhượng bộ, làm nổi bật luận điểm chính ở vế câu tiếp theo.',
    },
  ];

  let selectedAnswers: number[] = [-1, -1, -1];

  container.innerHTML = `
    <div class="modal-backdrop animate-fade-in" id="quiz-player-backdrop" style="position:fixed;inset:0;background:rgba(45,40,36,0.45);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">
      <div class="modal animate-scale-up" style="max-width:640px;width:100%;max-height:85vh;overflow-y:auto;background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;box-shadow:0 20px 40px rgba(108,71,217,0.12)">
        <div class="modal-header" style="background:#F8F6FF;padding:18px 24px;border-bottom:1.5px solid #E8E2F8;display:flex;justify-content:space-between;align-items:center">
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:800;color:#2D2824">Làm Quiz: ${quiz.title}</h3>
            <span style="font-size:12px;color:#736B7C">Thời gian: <strong style="color:#6C47D9">${quiz.time_limit_minutes || 15} phút</strong> · 3 câu hỏi trắc nghiệm tương tác</span>
          </div>
          <button class="btn btn-ghost btn-icon" id="close-quiz-player" type="button" style="background:none;border:none;cursor:pointer;font-size:18px;color:#736B7C">✕</button>
        </div>

        <form id="quiz-player-form">
          <div class="modal-body" style="padding:24px;display:flex;flex-direction:column;gap:18px">
            ${sampleQuestions.map((sq, qIdx) => `
              <div style="border:1.5px solid #E8E2F8;border-radius:18px;padding:18px;background:#F8F6FF">
                <div style="font-size:14px;font-weight:800;color:#2D2824;margin-bottom:12px">
                  Câu ${qIdx + 1}: ${sq.q}
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${sq.options.map((opt, optIdx) => `
                    <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #E8E2F8;border-radius:12px;background:#ffffff;cursor:pointer;font-size:13px;transition:all 0.15s">
                      <input type="radio" name="question_${qIdx}" value="${optIdx}" required style="accent-color:#6C47D9" />
                      <span><strong>${String.fromCharCode(65 + optIdx)}.</strong> ${opt}</span>
                    </label>
                  `).join('')}
                </div>
                <div id="explain-box-${qIdx}" style="display:none;margin-top:12px;padding:12px 14px;border-radius:12px;font-size:12px;line-height:1.5"></div>
              </div>
            `).join('')}
          </div>

          <div class="modal-footer" style="padding:16px 24px;background:#F8F6FF;border-top:1.5px solid #E8E2F8;display:flex;justify-content:space-between;align-items:center">
            <span id="quiz-result-summary" style="font-size:13px;font-weight:800;color:#6C47D9"></span>
            <div style="display:flex;gap:10px">
              <button type="button" class="btn btn-secondary btn-sm" id="cancel-quiz-player" style="height:38px;padding:0 16px;border-radius:9999px;border:1.5px solid #E8E2F8;background:#FFFFFF;color:#736B7C;font-weight:700;cursor:pointer">Đóng</button>
              <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-quiz" style="height:38px;padding:0 20px;border-radius:9999px;border:none;background:#6C47D9;color:#FFFFFF;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(108,71,217,0.25);display:inline-flex;align-items:center;gap:6px">
                ${icons.check} Nộp bài thi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };
  document.getElementById('close-quiz-player')?.addEventListener('click', closeModal);
  document.getElementById('cancel-quiz-player')?.addEventListener('click', closeModal);
  document.getElementById('quiz-player-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'quiz-player-backdrop') closeModal();
  });

  document.getElementById('quiz-player-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    let correctCount = 0;

    sampleQuestions.forEach((sq, qIdx) => {
      const radios = document.getElementsByName(`question_${qIdx}`) as NodeListOf<HTMLInputElement>;
      let val = -1;
      radios.forEach(r => { if (r.checked) val = parseInt(r.value); });
      selectedAnswers[qIdx] = val;

      const explainBox = document.getElementById(`explain-box-${qIdx}`);
      if (explainBox) {
        explainBox.style.display = 'block';
        if (val === sq.correct) {
          correctCount++;
          explainBox.style.background = 'rgba(16,185,129,0.1)';
          explainBox.style.border = '1px solid rgba(16,185,129,0.3)';
          explainBox.style.color = '#065f46';
          explainBox.innerHTML = `✓ <strong>Chính xác!</strong> ${sq.explain}`;
        } else {
          explainBox.style.background = 'rgba(239,68,68,0.1)';
          explainBox.style.border = '1px solid rgba(239,68,68,0.3)';
          explainBox.style.color = '#991b1b';
          explainBox.innerHTML = `✕ <strong>Chưa chính xác.</strong> Đáp án đúng là <strong>${String.fromCharCode(65 + sq.correct)}</strong>. ${sq.explain}`;
        }
      }
    });

    const finalScore = Math.round((correctCount / sampleQuestions.length) * 100);
    const summaryEl = document.getElementById('quiz-result-summary');
    if (summaryEl) {
      summaryEl.textContent = `Kết quả: ${finalScore}/100đ (${correctCount}/${sampleQuestions.length} câu đúng)`;
    }

    const state = getState();
    const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV001';

    // Record attempt
    quizAttemptData.unshift({
      attempt_id: `QA${String(quizAttemptData.length + 1).padStart(3, '0')}`,
      student_id: studentId,
      quiz_id: quizId,
      score: finalScore,
      correct_answers: correctCount,
      total_questions: sampleQuestions.length,
      time_spent_minutes: 5,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });

    const submitBtn = document.getElementById('btn-submit-quiz');
    if (submitBtn) {
      submitBtn.textContent = '✓ Đã ghi nhận điểm';
      submitBtn.setAttribute('disabled', 'true');
    }

    // Increment vocabulary health review count
    const curVocab = parseInt(localStorage.getItem(`edutrack_vocab_count_${studentId}`) || '0', 10);
    localStorage.setItem(`edutrack_vocab_count_${studentId}`, String(curVocab + 5));

    showToast(`Đã nộp bài Quiz! Kết quả: ${finalScore} điểm! Đã cộng thêm 5 từ vựng vào sức khỏe từ vựng.`, finalScore >= 70 ? 'success' : 'warning');
    setTimeout(() => refreshQuizzesPage(), 2500);
  });
}
