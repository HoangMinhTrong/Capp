// ============================================
// EduTrack - Student Dashboard Page (Trang chủ "Học" của Học viên)
// Không gian học tập Gamified: Nền #F8F6FF, viền #E8E2F8, màu nhấn #6C47D9
// ============================================

import { getState } from '../state.ts';
import { studentData, enrollmentData, classData } from '../data.ts';
import { showToast } from '../utils.ts';

// Check-in streak state
let isCheckedInToday = false;
let streakDays = 5;

export function renderStudentDashboardPage(): string {
  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV_NN';
  const student = studentData.find(s => s.student_id === studentId) || studentData[0];

  // Enrolled class
  const myEnrollments = enrollmentData.filter(e => e.student_id === student.student_id && e.status === 'active');
  const myClass = (myEnrollments.length > 0 
    ? classData.find(c => c.class_id === myEnrollments[0].class_id) 
    : null) || classData.find(c => c.class_id === 'CLS_NN01') || classData[0];

  // Vocabulary health status
  const vocabReviewed = parseInt(localStorage.getItem(`edutrack_vocab_count_${student.student_id}`) || '0', 10);
  const isVocabUnlocked = vocabReviewed >= 5;
  const vocabHealthPercent = isVocabUnlocked ? Math.min(100, 80 + (vocabReviewed - 5) * 3) : 0;
  const vocabRemaining = Math.max(0, 5 - vocabReviewed);

  return `
    <div class="student-dashboard-container" style="background:#F8F6FF;min-height:calc(100vh - 72px);margin:-24px;padding:28px 24px 60px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;justify-content:center">
      
      <div style="width:100%;max-width:680px;display:flex;flex-direction:column;gap:20px">

        <!-- ================= KHỐI 1: THẺ "🎯 Mục tiêu hôm nay" ================= -->
        <div class="card-gamified card-today-goal" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:22px 26px;box-shadow:0 4px 18px rgba(108,71,217,0.04);position:relative;overflow:hidden">
          
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h2 style="font-size:16px;font-weight:800;color:#2D2824;margin:0;letter-spacing:-0.01em;display:flex;align-items:center;gap:6px">
              <span>🎯</span>
              <span>Mục tiêu hôm nay</span>
            </h2>
            <div style="background:#F3EFFF;border:1px solid #E0D4FC;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:700;color:#6C47D9">
              🔥 ${isCheckedInToday ? streakDays : 'Chưa có'} ngày chuỗi
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:18px">
              <!-- Hình quả trứng nằm trong ổ rơm -->
              <div class="egg-nest-illustration" style="width:68px;height:68px;border-radius:20px;background:#FFF9EB;border:1.5px solid #FDE68A;display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0;box-shadow:0 2px 8px rgba(245,158,11,0.1)">
                <!-- Ổ rơm & quả trứng -->
                <span style="font-size:36px;line-height:1">🪺</span>
                <span style="position:absolute;font-size:22px;top:10px;transform:rotate(-5deg)">🥚</span>
              </div>

              <div>
                <div style="font-size:15px;font-weight:800;color:#2D2824;margin-bottom:4px">
                  ${isCheckedInToday ? 'Đã giữ chuỗi hôm nay! 🌟' : 'Chưa có chuỗi hôm nay'}
                </div>
                <div style="font-size:13px;color:#736B7C;font-weight:500;line-height:1.4">
                  Hoàn thành nhiệm vụ hôm nay để giữ chuỗi
                </div>
              </div>
            </div>

            <!-- Nút điểm danh giữ chuỗi -->
            <button 
              type="button" 
              id="btn-egg-checkin"
              style="background:${isCheckedInToday ? '#10B981' : '#6C47D9'};color:#FFFFFF;border:none;border-radius:9999px;padding:9px 20px;font-size:13px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 3px 12px rgba(108,71,217,0.25);transition:all 0.15s ease"
            >
              <span>${isCheckedInToday ? '✓' : '🔥'}</span>
              <span>${isCheckedInToday ? 'Đã giữ chuỗi' : 'Điểm danh ngay'}</span>
            </button>
          </div>

        </div>

        <!-- ================= KHỐI 2: HÀNG 2 THẺ CHIA ĐÔI (50% / 50%) ================= -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          
          <!-- Thẻ trái (nền xanh dương nhạt): Icon sách + "1 bài học chưa hoàn thành" -->
          <a 
            href="#/student-class-detail" 
            class="card-gamified card-split-left"
            style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:24px;padding:22px 20px;text-decoration:none;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 18px rgba(37,99,235,0.04);transition:all 0.15s ease"
          >
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
              <div style="width:44px;height:44px;border-radius:14px;background:#FFFFFF;border:1px solid #BFDBFE;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 2px 6px rgba(37,99,235,0.08)">
                📖
              </div>
              <span style="font-size:18px;color:#2563EB;font-weight:800">→</span>
            </div>
            <div>
              <div style="font-size:16px;font-weight:800;color:#1E3A8A;margin-bottom:4px;letter-spacing:-0.01em">
                1 bài học chưa hoàn thành
              </div>
              <div style="font-size:12.5px;color:#2563EB;font-weight:600">
                Học tiếp từ bài đang dở
              </div>
            </div>
          </a>

          <!-- Thẻ phải (nền trắng): Icon biểu đồ + "Sức khỏe từ vựng" -->
          <div 
            class="card-gamified card-split-right"
            style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:22px 20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 18px rgba(108,71,217,0.04)"
          >
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
              <div style="width:44px;height:44px;border-radius:14px;background:#F3EFFF;border:1px solid #E0D4FC;display:flex;align-items:center;justify-content:center;font-size:22px">
                📊
              </div>
              <span style="font-size:22px;font-weight:800;color:${isVocabUnlocked ? '#10B981' : '#9CA3AF'}">
                ${isVocabUnlocked ? `${vocabHealthPercent}%` : '—'}
              </span>
            </div>
            <div>
              <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:4px;letter-spacing:-0.01em">
                Sức khỏe từ vựng
              </div>
              <div style="font-size:12.5px;color:#736B7C;font-weight:500">
                ${isVocabUnlocked 
                  ? `Đã ôn ${vocabReviewed} từ · Sức khỏe từ vựng tốt` 
                  : `Chưa chấm · ôn ${vocabRemaining} từ nữa để mở khoá`
                }
              </div>
            </div>
          </div>

        </div>

        <!-- ================= KHỐI 4: THẺ "🏆 BXH toàn trung tâm" ================= -->
        <div class="card-gamified card-global-leaderboard" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:22px 24px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:20px">🏆</span>
              <span style="font-size:16px;font-weight:800;color:#2D2824">BXH toàn trung tâm</span>
            </div>
            <!-- Góc trên phải ghi "EduTrack English · 1 HV" -->
            <div style="font-size:12px;font-weight:700;color:#8E8897">
              EduTrack English · 1 HV
            </div>
          </div>

          <!-- Nội dung -->
          <div style="font-size:14px;color:#554F5D;font-weight:500;margin-bottom:14px">
            Chưa có XP tuần này — luyện tập để dẫn đầu!
          </div>

          <!-- Góc dưới phải có liên kết "Xem tất cả →" -->
          <div style="display:flex;justify-content:flex-end">
            <a href="#/student-class-detail" style="font-size:13px;font-weight:800;color:#6C47D9;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
              <span>Xem tất cả</span>
              <span>→</span>
            </a>
          </div>
        </div>

        <!-- ================= KHỐI 5: MỤC "LỚP CỦA TÔI" ================= -->
        <div class="section-my-classes">
          
          <!-- Hàng tiêu đề nhỏ: Chữ in hoa "LỚP CỦA TÔI" bên trái; nút chữ màu tím "+ Vào lớp" bên phải -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="font-size:12.5px;font-weight:800;color:#736B7C;letter-spacing:0.06em;text-transform:uppercase">
              LỚP CỦA TÔI
            </div>
            <a 
              href="#/student-join-class" 
              class="btn-join-class-pill"
              style="font-size:13px;font-weight:800;color:#6C47D9;background:#F3EFFF;border:1px solid #E0D4FC;border-radius:9999px;padding:5px 14px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s ease"
            >
              <span>+</span>
              <span>Vào lớp</span>
            </a>
          </div>

          <!-- Thẻ lớp học của học viên -->
          <div class="card-gamified class-card-main" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:24px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
            
            <!-- Hàng tên lớp + icon "ⓘ" + liên kết tím đậm "Vào học →" -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px">
              <div>
                <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.01em">
                  ${myClass.class_name}
                </h3>
                <div style="font-size:12.5px;color:#736B7C;font-weight:500">
                  Lịch: ${myClass.schedule} · Cơ sở: ${myClass.campus} · ${myClass.author_name || 'GV. Lê Minh Cường'}
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <!-- Icon "ⓘ" (bấm xem nội quy lớp) -->
                <button 
                  type="button" 
                  id="btn-rules-modal-trigger"
                  style="width:34px;height:34px;border-radius:50%;background:#F3EFFF;border:1px solid #E0D4FC;display:inline-flex;align-items:center;justify-content:center;color:#6C47D9;font-size:15px;font-weight:800;cursor:pointer" 
                  title="Xem nội quy lớp"
                >
                  ⓘ
                </button>

                <!-- Liên kết tím đậm "Vào học →" (bấm mở Màn hình 4: Chi tiết bài học) -->
                <a 
                  href="#/student-class-detail" 
                  style="background:#6C47D9;color:#FFFFFF;border-radius:9999px;padding:8px 18px;font-size:13px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;gap:4px;box-shadow:0 3px 10px rgba(108,71,217,0.25)"
                >
                  <span>Vào học</span>
                  <span>→</span>
                </a>
              </div>
            </div>

            <!-- Khu vực "🏆 BXH lớp" kèm nút "Xem tất cả →" -->
            <div style="border-top:1px dashed #E8E2F8;margin-top:18px;padding-top:16px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <div style="font-size:13.5px;font-weight:800;color:#2D2824;display:flex;align-items:center;gap:6px">
                  <span>🏆</span>
                  <span>BXH lớp</span>
                </div>
                <a href="#/student-class-detail" style="font-size:12.5px;font-weight:700;color:#6C47D9;text-decoration:none">
                  Xem tất cả →
                </a>
              </div>

              <!-- Top 3 members preview -->
              <div style="display:flex;gap:10px">
                <div style="flex:1;background:#F8F6FF;border:1px solid #E8E2F8;border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:8px">
                  <span style="font-size:14px">🥇</span>
                  <div style="overflow:hidden">
                    <div style="font-size:12px;font-weight:800;color:#2D2824;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${student.full_name}</div>
                    <div style="font-size:11px;color:#6C47D9;font-weight:700">30 XP</div>
                  </div>
                </div>
                <div style="flex:1;background:#FFFFFF;border:1px solid #E8E2F8;border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:8px">
                  <span style="font-size:14px">🥈</span>
                  <div style="overflow:hidden">
                    <div style="font-size:12px;font-weight:700;color:#2D2824;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Trần Thu Hà</div>
                    <div style="font-size:11px;color:#736B7C;font-weight:600">25 XP</div>
                  </div>
                </div>
                <div style="flex:1;background:#FFFFFF;border:1px solid #E8E2F8;border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:8px">
                  <span style="font-size:14px">🥉</span>
                  <div style="overflow:hidden">
                    <div style="font-size:12px;font-weight:700;color:#2D2824;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Hoàng Minh</div>
                    <div style="font-size:11px;color:#736B7C;font-weight:600">15 XP</div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- Modal Xem Nội quy lớp -->
    <div id="modal-dashboard-rules" style="display:none;position:fixed;inset:0;background:rgba(20,15,35,0.5);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="width:100%;max-width:500px;background:#FFFFFF;border-radius:24px;border:1.5px solid #E8E2F8;overflow:hidden;box-shadow:0 20px 40px rgba(108,71,217,0.15)">
        <div style="background:#F3EFFF;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E8E2F8">
          <h3 style="font-size:16px;font-weight:800;color:#2D2824;margin:0">
            ⓘ Nội quy lớp ${myClass.class_name}
          </h3>
          <button id="btn-close-dash-rules" type="button" style="background:#FFFFFF;border:1px solid #E0D4FC;width:30px;height:30px;border-radius:50%;color:#6C47D9;font-size:15px;font-weight:700;cursor:pointer">✕</button>
        </div>
        <div style="padding:22px;font-size:13.5px;color:#554F5D;line-height:1.6">
          <p><strong>1. Đi học đúng giờ:</strong> Lớp học bắt đầu lúc 19:12. Học viên vui lòng có mặt trước 5 phút.</p>
          <p><strong>2. Hoàn thành bài tập:</strong> Nộp bài tập trước 23:59 ngày trước buổi học tiếp theo.</p>
          <p><strong>3. Tương tác &amp; Luyện tập:</strong> Luyện tập tối thiểu 5 từ vựng/ngày để duy trì sức khỏe từ vựng.</p>
          <div style="text-align:right;margin-top:16px">
            <button id="btn-ack-dash-rules" type="button" style="background:#6C47D9;border:none;color:#FFFFFF;border-radius:9999px;padding:8px 20px;font-size:13px;font-weight:800;cursor:pointer">Đã rõ</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initStudentDashboardPage(): void {
  // Streak check-in
  const btnCheckin = document.getElementById('btn-egg-checkin');
  if (btnCheckin) {
    btnCheckin.addEventListener('click', () => {
      if (!isCheckedInToday) {
        isCheckedInToday = true;
        streakDays += 1;
        btnCheckin.style.background = '#10B981';
        btnCheckin.innerHTML = `<span>✓</span><span>Đã giữ chuỗi</span>`;
        showToast(`🎉 Chúc mừng! Bạn đã giữ chuỗi học tập ${streakDays} ngày liên tiếp (+10 XP, +5 Thóc)!`, 'success');
      } else {
        showToast(`Bạn đã hoàn thành mục tiêu giữ chuỗi hôm nay rồi! Hãy quay lại vào ngày mai nhé.`, 'info');
      }
    });
  }

  // Rules modal
  const btnRules = document.getElementById('btn-rules-modal-trigger');
  const modalRules = document.getElementById('modal-dashboard-rules');
  const btnClose = document.getElementById('btn-close-dash-rules');
  const btnAck = document.getElementById('btn-ack-dash-rules');

  if (btnRules && modalRules) {
    btnRules.addEventListener('click', () => { modalRules.style.display = 'flex'; });
  }
  if (btnClose && modalRules) {
    btnClose.addEventListener('click', () => { modalRules.style.display = 'none'; });
  }
  if (btnAck && modalRules) {
    btnAck.addEventListener('click', () => { modalRules.style.display = 'none'; });
  }
}
