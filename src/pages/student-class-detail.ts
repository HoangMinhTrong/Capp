// ============================================
// EduTrack - Student Class Detail Page (Màn hình chi tiết lớp học của học viên)
// Gamified Purple Palette (#F8F6FF / #6C47D9 / #E8E2F8)
// ============================================

import { getState } from '../state.ts';
import { studentData, classData, enrollmentData } from '../data.ts';
import { showToast } from '../utils.ts';

export function renderStudentClassDetailPage(): string {
  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV_NN';
  const student = studentData.find(s => s.student_id === studentId) || studentData[0];

  // Pick enrolled class or default to CLS_NN01
  const myEnrollment = enrollmentData.find(e => e.student_id === student.student_id && e.status === 'active');
  const classItem = (myEnrollment ? classData.find(c => c.class_id === myEnrollment.class_id) : null) 
    || classData.find(c => c.class_id === 'CLS_NN01') 
    || classData[0];

  return `
    <div class="student-class-detail-container" style="background:#F8F6FF;min-height:calc(100vh - 72px);margin:-24px;padding:24px 20px 48px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;justify-content:center">
      
      <div style="width:100%;max-width:680px">

        <!-- 1. Khối nhắc trạng thái trên cùng: Tiêu đề "Trình độ" -->
        <div class="status-reminder-banner" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:18px 22px;margin-bottom:20px;box-shadow:0 2px 10px rgba(108,71,217,0.03)">
          <div style="display:flex;align-items:flex-start;gap:14px">
            <div style="width:36px;height:36px;border-radius:12px;background:#F3EFFF;border:1px solid #E0D4FC;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">
              💡
            </div>
            <div>
              <div style="font-size:15px;font-weight:800;color:#2D2824;margin-bottom:4px">
                Trình độ
              </div>
              <div style="font-size:13px;color:#736B7C;line-height:1.55;font-weight:500">
                Giáo viên cần chốt kế hoạch từ vựng, lịch mở và thời hạn cho lớp trước khi bắt đầu theo dõi. Dữ liệu trước khi kích hoạt không tự được tính thành lịch sử đã đo.
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Thanh tiêu đề bài học: Nút quay lại "<", chữ đậm "Bài học", tiến độ "0/15 Units đã hoàn thành" -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <div style="display:flex;align-items:center;gap:14px">
            <a href="#/student-dashboard" style="width:38px;height:38px;border-radius:50%;background:#FFFFFF;border:1.5px solid #E8E2F8;display:inline-flex;align-items:center;justify-content:center;color:#6C47D9;text-decoration:none;font-weight:700;font-size:18px;box-shadow:0 1px 4px rgba(108,71,217,0.05)" title="Quay lại Tổng quan">
              ‹
            </a>
            <div>
              <h1 style="font-size:22px;font-weight:800;color:#2D2824;margin:0 0 2px 0;letter-spacing:-0.01em">
                Bài học
              </h1>
              <div style="font-size:12.5px;color:#8E8897;font-weight:600">
                0/15 Units đã hoàn thành · <span style="color:#6C47D9;font-weight:700">${classItem.class_name}</span>
              </div>
            </div>
          </div>

          <button id="btn-show-class-rules" type="button" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:9999px;padding:6px 14px;color:#6C47D9;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px">
            <span>ⓘ</span>
            <span>Nội quy</span>
          </button>
        </div>

        <!-- 3. Thanh chuyển 2 Tab toàn chiều rộng: "Bài học" và "Bảng xếp hạng · #1" -->
        <div class="tabs-segmented-control" style="background:#EFEAF8;padding:4px;border-radius:16px;display:flex;gap:4px;margin-bottom:16px">
          <button 
            type="button" 
            id="tab-btn-lessons" 
            class="tab-btn active"
            style="flex:1;border:none;background:#6C47D9;color:#FFFFFF;border-radius:12px;padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(108,71,217,0.25)"
          >
            Bài học
          </button>
          <button 
            type="button" 
            id="tab-btn-leaderboard" 
            class="tab-btn"
            style="flex:1;border:none;background:transparent;color:#6C47D9;border-radius:12px;padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s ease"
          >
            Bảng xếp hạng · #1
          </button>
        </div>

        <!-- 4. Thẻ nhắc bật thông báo (nằm ngay dưới thanh tab) -->
        <div id="card-notification-prompt" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 8px rgba(108,71,217,0.03)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:#FFFBEB;border:1px solid #FDE68A;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">
              🔔
            </div>
            <div>
              <div style="font-size:14px;font-weight:800;color:#2D2824">
                Bật thông báo lớp
              </div>
              <div style="font-size:12px;color:#736B7C;font-weight:500">
                Nhận báo ngay khi giáo viên đăng bài hoặc thông báo.
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <button id="btn-notif-later" type="button" style="background:transparent;border:none;color:#8E8897;font-size:13px;font-weight:700;cursor:pointer;padding:6px 10px">
              Để sau
            </button>
            <button id="btn-notif-enable" type="button" style="background:#6C47D9;border:none;border-radius:9999px;color:#FFFFFF;font-size:13px;font-weight:700;cursor:pointer;padding:7px 18px;box-shadow:0 2px 6px rgba(108,71,217,0.25)">
              Bật
            </button>
          </div>
        </div>

        <!-- ================= TAB 1: BÀI HỌC ================= -->
        <div id="tab-content-lessons" style="display:block">
          
          <!-- Thẻ "📅 Xin nghỉ" -->
          <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:18px 22px;margin-bottom:16px;box-shadow:0 2px 8px rgba(108,71,217,0.02)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div>
                <div style="font-size:11.5px;font-weight:800;color:#8E8897;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">
                  📅 Lịch học sắp tới
                </div>
                <div style="font-size:16px;font-weight:800;color:#2D2824">
                  Buổi tiếp theo · Thứ Hai · 23/11/2026
                </div>
                <div style="font-size:12.5px;color:#736B7C;margin-top:2px;font-weight:500">
                  Thời gian: 19:15 - 21:15 · Phòng 302 (CS1) · GV. Lê Minh Cường
                </div>
              </div>
              <button 
                type="button" 
                id="btn-open-leave-modal"
                style="background:#6C47D9;color:#FFFFFF;border:none;border-radius:9999px;padding:9px 20px;font-size:13.5px;font-weight:800;cursor:pointer;box-shadow:0 3px 10px rgba(108,71,217,0.25);flex-shrink:0"
              >
                Xin nghỉ
              </button>
            </div>
            <div style="border-top:1px dashed #E8E2F8;padding-top:10px;margin-top:8px">
              <a href="javascript:void(0)" id="link-leave-multiple" style="font-size:12.5px;color:#6C47D9;text-decoration:none;font-weight:700">
                + Xin nghỉ nhiều buổi
              </a>
            </div>
          </div>

          <!-- Thẻ "👥 Lớp mình tuần này" -->
          <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:18px 22px;margin-bottom:24px;box-shadow:0 2px 8px rgba(108,71,217,0.02)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">👥</span>
                <span style="font-size:15px;font-weight:800;color:#2D2824">Lớp mình tuần này</span>
              </div>
              <div style="font-size:14px;font-weight:800;color:#6C47D9">
                0/280 lượt ôn
              </div>
            </div>
            <div style="width:100%;height:8px;background:#F3EFFF;border-radius:9999px;overflow:hidden;margin-bottom:10px">
              <div style="width:4%;height:100%;background:#6C47D9;border-radius:9999px"></div>
            </div>
            <div style="text-align:right">
              <a href="#/student-quizzes" style="font-size:12.5px;color:#6C47D9;text-decoration:none;font-weight:700">
                Góp lượt ôn cho lớp →
              </a>
            </div>
          </div>

          <!-- Lộ trình danh sách Unit dạng timeline dọc -->
          <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
            <h2 style="font-size:16px;font-weight:800;color:#2D2824;margin:0;letter-spacing:-0.01em">
              Lộ trình bài học
            </h2>
            <span style="font-size:12px;color:#8E8897;font-weight:600">15 Units</span>
          </div>

          <div class="timeline-unit-list" style="display:flex;flex-direction:column;gap:14px">
            
            <!-- Unit 1: ĐÃ MỞ -->
            <div 
              class="unit-card-item unlocked" 
              id="unit-1-item"
              style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:20px;padding:18px 20px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 3px 12px rgba(108,71,217,0.04)"
            >
              <!-- Vòng tròn số "1" màu tím nhạt -->
              <div style="width:44px;height:44px;border-radius:50%;background:#F3EFFF;border:1.5px solid #E0D4FC;display:flex;align-items:center;justify-content:center;color:#6C47D9;font-size:18px;font-weight:800;flex-shrink:0">
                1
              </div>

              <!-- Nội dung Unit 1 -->
              <div style="flex:1">
                <div style="font-size:15px;font-weight:800;color:#2D2824;margin-bottom:4px">
                  Unit 1 · Greetings &amp; Daily Introductions
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:12px;font-weight:700;color:#6C47D9;background:#F3EFFF;padding:2px 8px;border-radius:6px">Chưa học</span>
                  <span style="font-size:12px;color:#8E8897;font-weight:500">24 từ vựng · 1 tài liệu PDF</span>
                </div>
              </div>

              <!-- Mũi tên "→" bên phải -->
              <div style="color:#6C47D9;font-size:20px;font-weight:800">
                →
              </div>
            </div>

            <!-- Unit 2: CHƯA MỞ -->
            <div class="unit-card-item locked" style="background:#FAF8FD;border:1.5px solid #EFEAF8;border-radius:20px;padding:18px 20px;display:flex;align-items:center;gap:16px;opacity:0.75">
              <div style="width:44px;height:44px;border-radius:50%;background:#F3EFFF;border:1.5px solid #E5E1EE;display:flex;align-items:center;justify-content:center;color:#8E8897;font-size:18px;flex-shrink:0">
                🔒
              </div>
              <div style="flex:1">
                <div style="font-size:15px;font-weight:700;color:#554F5D;margin-bottom:4px">
                  Bài chưa mở · Unit 2
                </div>
                <div style="font-size:12px;color:#8E8897;font-weight:500">
                  Mở 26/11/2026
                </div>
              </div>
              <div style="color:#C4BFCE;font-size:16px">
                🔒
              </div>
            </div>

            <!-- Unit 3: CHƯA MỞ -->
            <div class="unit-card-item locked" style="background:#FAF8FD;border:1.5px solid #EFEAF8;border-radius:20px;padding:18px 20px;display:flex;align-items:center;gap:16px;opacity:0.75">
              <div style="width:44px;height:44px;border-radius:50%;background:#F3EFFF;border:1.5px solid #E5E1EE;display:flex;align-items:center;justify-content:center;color:#8E8897;font-size:18px;flex-shrink:0">
                🔒
              </div>
              <div style="flex:1">
                <div style="font-size:15px;font-weight:700;color:#554F5D;margin-bottom:4px">
                  Bài chưa mở · Unit 3
                </div>
                <div style="font-size:12px;color:#8E8897;font-weight:500">
                  Mở 01/12/2026
                </div>
              </div>
              <div style="color:#C4BFCE;font-size:16px">
                🔒
              </div>
            </div>

            <!-- Unit 4: CHƯA MỞ -->
            <div class="unit-card-item locked" style="background:#FAF8FD;border:1.5px solid #EFEAF8;border-radius:20px;padding:18px 20px;display:flex;align-items:center;gap:16px;opacity:0.75">
              <div style="width:44px;height:44px;border-radius:50%;background:#F3EFFF;border:1.5px solid #E5E1EE;display:flex;align-items:center;justify-content:center;color:#8E8897;font-size:18px;flex-shrink:0">
                🔒
              </div>
              <div style="flex:1">
                <div style="font-size:15px;font-weight:700;color:#554F5D;margin-bottom:4px">
                  Bài chưa mở · Unit 4
                </div>
                <div style="font-size:12px;color:#8E8897;font-weight:500">
                  Mở 05/12/2026
                </div>
              </div>
              <div style="color:#C4BFCE;font-size:16px">
                🔒
              </div>
            </div>

          </div>

        </div>

        <!-- ================= TAB 2: BẢNG XẾP HẠNG ================= -->
        <div id="tab-content-leaderboard" style="display:none">
          
          <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:24px 22px;box-shadow:0 3px 12px rgba(108,71,217,0.03)">
            
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:22px">🏆</span>
                <span style="font-size:18px;font-weight:800;color:#2D2824">Bảng xếp hạng</span>
              </div>
              <button id="btn-refresh-lb" type="button" style="background:#F3EFFF;border:1px solid #E0D4FC;border-radius:9999px;padding:5px 12px;color:#6C47D9;font-size:12px;font-weight:700;cursor:pointer">
                ↻ Cập nhật
              </button>
            </div>

            <!-- 2 nút chuyển tab con "Tuần này" (nền tím đậm) và "🎓 Học bá" -->
            <div style="display:flex;gap:8px;margin-bottom:20px">
              <button 
                type="button" 
                id="subtab-week" 
                style="background:#6C47D9;color:#FFFFFF;border:none;border-radius:9999px;padding:7px 18px;font-size:13px;font-weight:700;cursor:pointer"
              >
                Tuần này
              </button>
              <button 
                type="button" 
                id="subtab-alltime" 
                style="background:#F3EFFF;color:#6C47D9;border:1px solid #E0D4FC;border-radius:9999px;padding:7px 18px;font-size:13px;font-weight:700;cursor:pointer"
              >
                🎓 Học bá (Tích lũy toàn khóa)
              </button>
            </div>

            <!-- Danh sách thành viên lớp -->
            <div id="leaderboard-members-list" style="display:flex;flex-direction:column;gap:10px">
              
              <!-- Rank 1: Bạn (Current Student) -->
              <div style="background:#FBF9FF;border:1.5px solid #E0D4FC;border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:14px">
                <div style="width:28px;height:28px;border-radius:50%;background:#FEF3C7;color:#D97706;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">
                  🥇
                </div>
                <div style="width:36px;height:36px;border-radius:50%;background:#6C47D9;color:#FFFFFF;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">
                  ${student.avatar_initials}
                </div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:800;color:#2D2824">
                    ${student.full_name} <span style="font-size:11px;color:#6C47D9;background:#EDE7FB;padding:2px 6px;border-radius:9999px;margin-left:4px">Bạn</span>
                  </div>
                  <div style="font-size:12px;color:#736B7C;font-weight:500">
                    🔥 5 ngày chuỗi · 150 từ vựng đã ôn
                  </div>
                </div>
                <div style="font-size:15px;font-weight:800;color:#6C47D9">
                  30 XP
                </div>
              </div>

              <!-- Rank 2: Nguyễn Hồng Nhung -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:14px">
                <div style="width:28px;height:28px;border-radius:50%;background:#F3F4F6;color:#6B7280;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">
                  🥈
                </div>
                <div style="width:36px;height:36px;border-radius:50%;background:#EDE7FB;color:#6C47D9;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">
                  TH
                </div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:700;color:#2D2824">
                    Trần Thu Hà
                  </div>
                  <div style="font-size:12px;color:#736B7C;font-weight:500">
                    🔥 4 ngày chuỗi · 120 từ vựng đã ôn
                  </div>
                </div>
                <div style="font-size:15px;font-weight:700;color:#554F5D">
                  25 XP
                </div>
              </div>

              <!-- Rank 3: Hoàng Minh Tuấn -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:14px">
                <div style="width:28px;height:28px;border-radius:50%;background:#F3F4F6;color:#6B7280;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">
                  🥉
                </div>
                <div style="width:36px;height:36px;border-radius:50%;background:#EDE7FB;color:#6C47D9;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">
                  HM
                </div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:700;color:#2D2824">
                    Hoàng Minh Tuấn
                  </div>
                  <div style="font-size:12px;color:#736B7C;font-weight:500">
                    🔥 3 ngày chuỗi · 90 từ vựng đã ôn
                  </div>
                </div>
                <div style="font-size:15px;font-weight:700;color:#554F5D">
                  15 XP
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- Modal 1: Unit 1 Study & Materials Drawer -->
    <div id="modal-unit1-study" style="display:none;position:fixed;inset:0;background:rgba(20,15,35,0.5);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="width:100%;max-width:560px;background:#FFFFFF;border-radius:24px;border:1.5px solid #E8E2F8;overflow:hidden;box-shadow:0 20px 40px rgba(108,71,217,0.15)">
        <div style="background:#F3EFFF;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E8E2F8">
          <div>
            <span style="font-size:11px;font-weight:800;color:#6C47D9;text-transform:uppercase;letter-spacing:0.04em">Học từ vựng &amp; Tài liệu</span>
            <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:2px 0 0 0">Unit 1 · Greetings &amp; Daily Introductions</h3>
          </div>
          <button id="btn-close-unit1-modal" type="button" style="background:#FFFFFF;border:1px solid #E0D4FC;width:32px;height:32px;border-radius:50%;color:#6C47D9;font-size:16px;font-weight:700;cursor:pointer">✕</button>
        </div>
        <div style="padding:22px 24px;max-height:70vh;overflow-y:auto">
          <!-- Flashcards preview -->
          <div style="font-size:13.5px;font-weight:800;color:#2D2824;margin-bottom:10px">📖 Từ vựng trọng tâm (24 từ)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
            <div style="background:#F8F6FF;border:1px solid #E8E2F8;padding:10px 14px;border-radius:12px">
              <div style="font-weight:800;color:#6C47D9;font-size:13.5px">Greeting / ˈɡriː.tɪŋ /</div>
              <div style="font-size:12px;color:#554F5D">Lời chào hỏi mở đầu</div>
            </div>
            <div style="background:#F8F6FF;border:1px solid #E8E2F8;padding:10px 14px;border-radius:12px">
              <div style="font-weight:800;color:#6C47D9;font-size:13.5px">Occupation / ˌɑː.kjəˈpeɪ.ʃən /</div>
              <div style="font-size:12px;color:#554F5D">Nghề nghiệp, công việc</div>
            </div>
            <div style="background:#F8F6FF;border:1px solid #E8E2F8;padding:10px 14px;border-radius:12px">
              <div style="font-weight:800;color:#6C47D9;font-size:13.5px">Routine / ruːˈtiːn /</div>
              <div style="font-size:12px;color:#554F5D">Thói quen sinh hoạt</div>
            </div>
            <div style="background:#F8F6FF;border:1px solid #E8E2F8;padding:10px 14px;border-radius:12px">
              <div style="font-weight:800;color:#6C47D9;font-size:13.5px">Acquaintance / əˈkweɪn.təns /</div>
              <div style="font-size:12px;color:#554F5D">Người quen, bạn mới</div>
            </div>
          </div>

          <!-- Teacher PDF Material -->
          <div style="font-size:13.5px;font-weight:800;color:#2D2824;margin-bottom:10px">📚 Sổ tay &amp; Tài liệu giáo viên</div>
          <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;padding:14px 16px;border-radius:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:24px">📄</span>
              <div>
                <div style="font-size:13.5px;font-weight:700;color:#2D2824">Unit1_LectureNotes_TeacherCuong.pdf</div>
                <div style="font-size:11.5px;color:#8E8897">PDF 2.4 MB · Giáo trình chuẩn IELTS Foundation</div>
              </div>
            </div>
            <button id="btn-download-pdf-unit1" type="button" style="background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9;border-radius:9999px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer">
              Tải PDF ↓
            </button>
          </div>

          <!-- Practice exercises CTA -->
          <div style="background:#FAF8FD;border:1px dashed #D8CCF8;padding:16px;border-radius:14px;text-align:center">
            <div style="font-size:13.5px;font-weight:700;color:#2D2824;margin-bottom:4px">Làm bài luyện tập phản xạ</div>
            <div style="font-size:12px;color:#736B7C;margin-bottom:12px">Hoàn thành 10 câu trắc nghiệm để nhận ngay +20 XP</div>
            <a href="#/student-quizzes" class="btn" style="background:#6C47D9;color:#FFFFFF;border-radius:9999px;padding:8px 20px;font-size:13px;font-weight:800;text-decoration:none">
              Bắt đầu luyện tập 🚀
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 2: Leave Request ("Xin nghỉ") -->
    <div id="modal-leave-request" style="display:none;position:fixed;inset:0;background:rgba(20,15,35,0.5);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="width:100%;max-width:500px;background:#FFFFFF;border-radius:24px;border:1.5px solid #E8E2F8;overflow:hidden;box-shadow:0 20px 40px rgba(108,71,217,0.15)">
        <div style="background:#F3EFFF;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E8E2F8">
          <h3 style="font-size:16px;font-weight:800;color:#2D2824;margin:0">
            📅 Đơn xin nghỉ phép
          </h3>
          <button id="btn-close-leave-modal" type="button" style="background:#FFFFFF;border:1px solid #E0D4FC;width:30px;height:30px;border-radius:50%;color:#6C47D9;font-size:15px;font-weight:700;cursor:pointer">✕</button>
        </div>
        <form id="form-submit-leave" onsubmit="return false;" style="padding:22px">
          <div style="margin-bottom:14px">
            <label style="display:block;font-size:12px;font-weight:700;color:#6C47D9;margin-bottom:6px">Lớp học</label>
            <input type="text" value="${classItem.class_name}" readonly style="width:100%;box-sizing:border-box;background:#F8F6FF;border:1px solid #E8E2F8;border-radius:10px;padding:10px 14px;font-size:13.5px;font-weight:600;color:#2D2824" />
          </div>
          <div style="margin-bottom:14px">
            <label style="display:block;font-size:12px;font-weight:700;color:#6C47D9;margin-bottom:6px">Buổi xin nghỉ</label>
            <input type="text" id="input-leave-date" value="Thứ Hai · 23/11/2026 (Buổi 2)" style="width:100%;box-sizing:border-box;background:#FFFFFF;border:1px solid #E8E2F8;border-radius:10px;padding:10px 14px;font-size:13.5px;font-weight:600;color:#2D2824" />
          </div>
          <div style="margin-bottom:18px">
            <label style="display:block;font-size:12px;font-weight:700;color:#6C47D9;margin-bottom:6px">Lý do xin nghỉ</label>
            <textarea id="input-leave-reason" rows="3" placeholder="Nhập lý do (ví dụ: bận lịch thi học phần trên trường, có việc gia đình...)" style="width:100%;box-sizing:border-box;background:#FFFFFF;border:1px solid #E8E2F8;border-radius:10px;padding:10px 14px;font-size:13.5px;font-family:inherit;outline:none"></textarea>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button type="button" id="btn-cancel-leave" style="background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9;border-radius:9999px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer">Hủy</button>
            <button type="submit" id="btn-confirm-leave" style="background:#6C47D9;border:none;color:#FFFFFF;border-radius:9999px;padding:8px 22px;font-size:13px;font-weight:800;cursor:pointer">Gửi đơn xin nghỉ</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 3: Class Rules & Info -->
    <div id="modal-class-rules" style="display:none;position:fixed;inset:0;background:rgba(20,15,35,0.5);z-index:9999;align-items:center;justify-content:center;padding:16px">
      <div style="width:100%;max-width:500px;background:#FFFFFF;border-radius:24px;border:1.5px solid #E8E2F8;overflow:hidden;box-shadow:0 20px 40px rgba(108,71,217,0.15)">
        <div style="background:#F3EFFF;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E8E2F8">
          <h3 style="font-size:16px;font-weight:800;color:#2D2824;margin:0">
            ⓘ Nội quy lớp học
          </h3>
          <button id="btn-close-rules-modal" type="button" style="background:#FFFFFF;border:1px solid #E0D4FC;width:30px;height:30px;border-radius:50%;color:#6C47D9;font-size:15px;font-weight:700;cursor:pointer">✕</button>
        </div>
        <div style="padding:22px;font-size:13.5px;color:#554F5D;line-height:1.6">
          <p><strong>1. Chuyên cần:</strong> Học viên tham gia tối thiểu 80% số buổi học để đủ điều kiện xét chứng chỉ kết khóa.</p>
          <p><strong>2. Xin nghỉ phép:</strong> Vui lòng gửi đơn trước giờ học ít nhất 2 tiếng qua nút "Xin nghỉ" để giảng viên và trợ giảng hỗ trợ ghép ca bù.</p>
          <p><strong>3. Bài tập về nhà:</strong> Nộp bài tập đầy đủ theo thời hạn của từng Unit trên mục "Bài tập".</p>
          <div style="text-align:right;margin-top:16px">
            <button id="btn-ack-rules" type="button" style="background:#6C47D9;border:none;color:#FFFFFF;border-radius:9999px;padding:8px 20px;font-size:13px;font-weight:800;cursor:pointer">Đã hiểu</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initStudentClassDetailPage(): void {
  // Tabs switching
  const tabLessons = document.getElementById('tab-btn-lessons');
  const tabLeaderboard = document.getElementById('tab-btn-leaderboard');
  const contentLessons = document.getElementById('tab-content-lessons');
  const contentLeaderboard = document.getElementById('tab-content-leaderboard');

  if (tabLessons && tabLeaderboard && contentLessons && contentLeaderboard) {
    tabLessons.addEventListener('click', () => {
      tabLessons.style.background = '#6C47D9';
      tabLessons.style.color = '#FFFFFF';
      tabLessons.style.boxShadow = '0 2px 8px rgba(108,71,217,0.25)';
      tabLeaderboard.style.background = 'transparent';
      tabLeaderboard.style.color = '#6C47D9';
      tabLeaderboard.style.boxShadow = 'none';
      contentLessons.style.display = 'block';
      contentLeaderboard.style.display = 'none';
    });

    tabLeaderboard.addEventListener('click', () => {
      tabLeaderboard.style.background = '#6C47D9';
      tabLeaderboard.style.color = '#FFFFFF';
      tabLeaderboard.style.boxShadow = '0 2px 8px rgba(108,71,217,0.25)';
      tabLessons.style.background = 'transparent';
      tabLessons.style.color = '#6C47D9';
      tabLessons.style.boxShadow = 'none';
      contentLessons.style.display = 'none';
      contentLeaderboard.style.display = 'block';
    });
  }

  // Notification Banner
  const notifCard = document.getElementById('card-notification-prompt');
  const btnNotifEnable = document.getElementById('btn-notif-enable');
  const btnNotifLater = document.getElementById('btn-notif-later');

  if (btnNotifEnable && notifCard) {
    btnNotifEnable.addEventListener('click', () => {
      notifCard.style.display = 'none';
      showToast('Đã bật thông báo lớp học thành công! Bạn sẽ nhận thông báo khi có bài mới.', 'success');
    });
  }
  if (btnNotifLater && notifCard) {
    btnNotifLater.addEventListener('click', () => {
      notifCard.style.display = 'none';
    });
  }

  // Unit 1 modal
  const unit1Item = document.getElementById('unit-1-item');
  const modalUnit1 = document.getElementById('modal-unit1-study');
  const btnCloseUnit1 = document.getElementById('btn-close-unit1-modal');
  const btnDownloadPdf = document.getElementById('btn-download-pdf-unit1');

  if (unit1Item && modalUnit1) {
    unit1Item.addEventListener('click', () => {
      modalUnit1.style.display = 'flex';
    });
  }
  if (btnCloseUnit1 && modalUnit1) {
    btnCloseUnit1.addEventListener('click', () => {
      modalUnit1.style.display = 'none';
    });
  }
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', () => {
      showToast('Đang tải tài liệu Unit 1 (PDF)...', 'info');
      setTimeout(() => {
        showToast('Tải tài liệu thành công!', 'success');
      }, 1000);
    });
  }

  // Leave Modal
  const btnOpenLeave = document.getElementById('btn-open-leave-modal');
  const linkLeaveMulti = document.getElementById('link-leave-multiple');
  const modalLeave = document.getElementById('modal-leave-request');
  const btnCloseLeave = document.getElementById('btn-close-leave-modal');
  const btnCancelLeave = document.getElementById('btn-cancel-leave');
  const formLeave = document.getElementById('form-submit-leave') as HTMLFormElement;
  const inputLeaveDate = document.getElementById('input-leave-date') as HTMLInputElement;

  const openLeave = (isMulti: boolean = false) => {
    if (modalLeave) {
      if (inputLeaveDate && isMulti) {
        inputLeaveDate.value = 'Nhiều buổi (23/11/2026 - 27/11/2026)';
      }
      modalLeave.style.display = 'flex';
    }
  };

  if (btnOpenLeave) btnOpenLeave.addEventListener('click', () => openLeave(false));
  if (linkLeaveMulti) linkLeaveMulti.addEventListener('click', () => openLeave(true));
  if (btnCloseLeave && modalLeave) btnCloseLeave.addEventListener('click', () => { modalLeave.style.display = 'none'; });
  if (btnCancelLeave && modalLeave) btnCancelLeave.addEventListener('click', () => { modalLeave.style.display = 'none'; });

  if (formLeave && modalLeave) {
    formLeave.addEventListener('submit', (e) => {
      e.preventDefault();
      const reason = (document.getElementById('input-leave-reason') as HTMLTextAreaElement)?.value || 'Lý do cá nhân';
      modalLeave.style.display = 'none';
      showToast(`Đã gửi đơn xin nghỉ phép thành công (Lý do: ${reason})! Giáo viên và Trợ giảng sẽ kiểm tra và xác nhận.`, 'success');
    });
  }

  // Rules Modal
  const btnShowRules = document.getElementById('btn-show-class-rules');
  const modalRules = document.getElementById('modal-class-rules');
  const btnCloseRules = document.getElementById('btn-close-rules-modal');
  const btnAckRules = document.getElementById('btn-ack-rules');

  if (btnShowRules && modalRules) {
    btnShowRules.addEventListener('click', () => { modalRules.style.display = 'flex'; });
  }
  if (btnCloseRules && modalRules) {
    btnCloseRules.addEventListener('click', () => { modalRules.style.display = 'none'; });
  }
  if (btnAckRules && modalRules) {
    btnAckRules.addEventListener('click', () => { modalRules.style.display = 'none'; });
  }

  // Sub-tab week vs alltime
  const subWeek = document.getElementById('subtab-week');
  const subAllTime = document.getElementById('subtab-alltime');
  if (subWeek && subAllTime) {
    subWeek.addEventListener('click', () => {
      subWeek.style.background = '#6C47D9';
      subWeek.style.color = '#FFFFFF';
      subWeek.style.border = 'none';
      subAllTime.style.background = '#F3EFFF';
      subAllTime.style.color = '#6C47D9';
      subAllTime.style.border = '1px solid #E0D4FC';
    });
    subAllTime.addEventListener('click', () => {
      subAllTime.style.background = '#6C47D9';
      subAllTime.style.color = '#FFFFFF';
      subAllTime.style.border = 'none';
      subWeek.style.background = '#F3EFFF';
      subWeek.style.color = '#6C47D9';
      subWeek.style.border = '1px solid #E0D4FC';
    });
  }

  const btnRefreshLb = document.getElementById('btn-refresh-lb');
  if (btnRefreshLb) {
    btnRefreshLb.addEventListener('click', () => {
      showToast('Đang cập nhật bảng xếp hạng...', 'info');
      setTimeout(() => {
        showToast('Bảng xếp hạng đã cập nhật mới nhất!', 'success');
      }, 500);
    });
  }
}
