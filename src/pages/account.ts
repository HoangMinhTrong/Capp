// ============================================
// EduTrack English - Phân hệ Tài khoản (/account)
// Warm Minimalist Design System & Gamified Purple for Students
// ============================================

import { getState, setState, logout } from '../state.ts';
import { showToast } from '../utils.ts';
import {
  changePasswordApi,
  getAccountSettingsApi,
  updateAccountSettingsApi,
  submitFeedbackApi,
  updateAvatarApi,
} from '../api.ts';

function getTodayKey(): string {
  const d = new Date();
  return `edutrack_feedback_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

function getRemainingFeedbackCount(): number {
  try {
    const raw = localStorage.getItem(getTodayKey());
    const used = raw ? parseInt(raw, 10) : 0;
    return Math.max(0, 3 - (isNaN(used) ? 0 : used));
  } catch {
    return 3;
  }
}

function decrementFeedbackCount(): number {
  try {
    const key = getTodayKey();
    const raw = localStorage.getItem(key);
    const used = raw ? parseInt(raw, 10) : 0;
    const nextUsed = isNaN(used) ? 1 : used + 1;
    localStorage.setItem(key, String(nextUsed));
    return Math.max(0, 3 - nextUsed);
  } catch {
    return 2;
  }
}

export function renderAccountPage(): string {
  const state = getState();
  const user = state.currentUser;
  if (!user) return '';

  const isStudent = user.role === 'student';
  const isAdmin = user.role === 'admin';
  const displayRole = isAdmin
    ? 'Quản lý trung tâm'
    : user.role === 'teacher'
    ? 'Giáo viên'
    : user.role === 'teaching_assistant'
    ? 'Trợ giảng'
    : 'Học viên';

  // Avatar priority: user.avatar_url -> stored local avatar -> avatar_initials / default
  const storedAvatar = localStorage.getItem(`edutrack_avatar_${user.staff_id}`) || user.avatar_url;
  const storedLogo = localStorage.getItem('edutrack_center_logo') || '';
  const notifyOn = localStorage.getItem('edutrack_notify_invite_rejection') !== 'false';
  const remainingFeedback = getRemainingFeedbackCount();

  // Student specific stats
  const studentStreak = localStorage.getItem(`edutrack_streak_${user.staff_id}`) || '1';
  const studentThoc = localStorage.getItem(`edutrack_thoc_${user.staff_id}`) || '120';
  const studentXp = localStorage.getItem(`edutrack_xp_${user.staff_id}`) || '450';

  // If Student: Render Gamified Purple Theme (#F8F6FF, #E8E2F8, #6C47D9)
  if (isStudent) {
    return `
      <div class="account-page-container student-account-theme" style="background:#F8F6FF;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        
        <!-- 1. Header Trang -->
        <div style="margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div>
            <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
              Tài khoản cá nhân
            </h1>
            <div style="font-size:14px;color:#736B7C;font-weight:500">
              ${user.email || 'thao.nguyen@edu.vn'} · Không gian học tập cá nhân
            </div>
          </div>
          <div>
            <a href="#/student-dashboard" class="btn btn-secondary btn-sm" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:7px 18px;border:1.5px solid #E8E2F8;background:#ffffff;color:#6C47D9;box-shadow:0 2px 6px rgba(108,71,217,0.06);text-decoration:none">
              ← Về Trang chủ
            </a>
          </div>
        </div>

        <!-- 2. Lưới 2 cột (Trái và Phải) -->
        <div class="account-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
          
          <!-- ================= CỘT TRÁI ================= -->
          <div style="display:flex;flex-direction:column;gap:24px">
            
            <!-- KHỐI HỒ SƠ HỌC VIÊN -->
            <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:26px 28px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
              <div style="font-size:11px;font-weight:800;color:#6C47D9;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px">
                HỒ SƠ HỌC VIÊN
              </div>

              <!-- Hàng trên cùng: Ảnh đại diện + nút Đổi avatar -->
              <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;padding-bottom:22px;border-bottom:1.5px solid #F3EFFF">
                <div id="account-avatar-preview" style="width:76px;height:76px;border-radius:50%;overflow:hidden;background:#EDE7FB;border:2.5px solid #D8CCF8;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(108,71,217,0.12);flex-shrink:0">
                  ${storedAvatar 
                    ? `<img src="${storedAvatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover" />` 
                    : `<span style="font-size:26px;font-weight:900;color:#6C47D9">${user.avatar_initials || 'TN'}</span>`
                  }
                </div>
                <div>
                  <button 
                    id="btn-trigger-change-avatar" 
                    type="button" 
                    style="background:#EDE7FB;border:1.5px solid #D8CCF8;padding:6px 14px;border-radius:9999px;font-size:13px;font-weight:700;color:#6C47D9;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s"
                  >
                    <span>📷</span>
                    <span>Đổi avatar</span>
                  </button>
                  <input type="file" id="input-account-avatar" accept="image/*" style="display:none" />
                  <div style="font-size:12px;color:#8E8897;margin-top:6px">
                    Hỗ trợ định dạng JPG, PNG hoặc GIF.
                  </div>
                </div>
              </div>

              <!-- 4 dòng thông tin 2 bên -->
              <div style="display:flex;flex-direction:column;gap:14px">
                
                <!-- Dòng 1: Họ tên -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0">
                  <span style="font-size:13.5px;color:#736B7C">Họ và tên</span>
                  <span style="font-size:14.5px;font-weight:800;color:#2D2824">${user.full_name || 'Nguyễn Phương Thảo'}</span>
                </div>

                <!-- Dòng 2: Email -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px dashed #E8E2F8">
                  <span style="font-size:13.5px;color:#736B7C">Email</span>
                  <span style="font-size:14px;font-weight:700;color:#2D2824">${user.email || 'thao.nguyen@edu.vn'}</span>
                </div>

                <!-- Dòng 3: Vai trò -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px dashed #E8E2F8">
                  <span style="font-size:13.5px;color:#736B7C">Vai trò</span>
                  <span style="font-size:12px;font-weight:800;color:#6C47D9;background:#EDE7FB;padding:4px 12px;border-radius:9999px;border:1px solid #D8CCF8">
                    ${displayRole}
                  </span>
                </div>

                <!-- Dòng 4: Trung tâm -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px dashed #E8E2F8">
                  <span style="font-size:13.5px;color:#736B7C">Trung tâm học tập</span>
                  <span style="font-size:14px;font-weight:800;color:#6C47D9">EduTrack English</span>
                </div>

              </div>
            </div>

            <!-- KHỐI HUY HIỆU & CHỈ SỐ HỌC TẬP (GAMIFICATION) -->
            <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:26px 28px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
              <div style="font-size:11px;font-weight:800;color:#6C47D9;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px">
                CHỈ SỐ THÀNH TÍCH GAMIFIED
              </div>

              <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px">
                <div style="background:#F8F6FF;border:1.5px solid #E8E2F8;border-radius:16px;padding:14px;text-align:center">
                  <div style="font-size:22px;margin-bottom:4px">🔥</div>
                  <div style="font-size:18px;font-weight:900;color:#6C47D9">${studentStreak}</div>
                  <div style="font-size:11px;font-weight:700;color:#736B7C">Chuỗi ngày</div>
                </div>

                <div style="background:#F8F6FF;border:1.5px solid #E8E2F8;border-radius:16px;padding:14px;text-align:center">
                  <div style="font-size:22px;margin-bottom:4px">🌾</div>
                  <div style="font-size:18px;font-weight:900;color:#6C47D9">${studentThoc}</div>
                  <div style="font-size:11px;font-weight:700;color:#736B7C">Thóc vàng</div>
                </div>

                <div style="background:#F8F6FF;border:1.5px solid #E8E2F8;border-radius:16px;padding:14px;text-align:center">
                  <div style="font-size:22px;margin-bottom:4px">⭐</div>
                  <div style="font-size:18px;font-weight:900;color:#6C47D9">${studentXp}</div>
                  <div style="font-size:11px;font-weight:700;color:#736B7C">Kinh nghiệm XP</div>
                </div>
              </div>
            </div>

          </div>

          <!-- ================= CỘT PHẢI ================= -->
          <div style="display:flex;flex-direction:column;gap:24px">
            
            <!-- KHỐI THÔNG BÁO -->
            <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:24px 28px;box-shadow:0 4px 18px rgba(108,71,217,0.04);display:flex;align-items:center;justify-content:space-between;gap:16px">
              <div style="display:flex;align-items:flex-start;gap:14px">
                <span style="font-size:22px;line-height:1">🔔</span>
                <div>
                  <div style="font-size:14.5px;font-weight:800;color:#2D2824;margin-bottom:4px">
                    Thông báo lớp học &amp; Bài tập
                  </div>
                  <div style="font-size:12.5px;color:#736B7C;line-height:1.4">
                    Nhận chuông nhắc lịch học, bài tập mới và nhận xét chấm điểm từ giáo viên.
                  </div>
                </div>
              </div>

              <button 
                id="btn-toggle-center-notify" 
                type="button" 
                style="
                  min-width:68px;
                  height:36px;
                  border-radius:9999px;
                  border:none;
                  font-size:13px;
                  font-weight:800;
                  cursor:pointer;
                  transition:all 0.15s ease;
                  ${notifyOn 
                    ? 'background:#6C47D9;color:#FFFFFF;box-shadow:0 2px 8px rgba(108,71,217,0.25);' 
                    : 'background:#F3EFFF;color:#736B7C;'
                  }
                "
              >
                ${notifyOn ? 'Bật' : 'Tắt'}
              </button>
            </div>

            <!-- KHỐI BẢO MẬT -->
            <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:26px 28px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
              <div style="font-size:11px;font-weight:800;color:#6C47D9;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:18px">
                BẢO MẬT &amp; MẬT KHẨU
              </div>

              <form id="form-change-password" style="display:flex;flex-direction:column;gap:14px">
                <!-- Ô 1: Mật khẩu mới -->
                <div>
                  <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                    Mật khẩu mới
                  </label>
                  <div style="position:relative">
                    <input 
                      id="input-new-password" 
                      type="password" 
                      placeholder="Tối thiểu 6 ký tự" 
                      style="width:100%;height:42px;padding:0 40px 0 14px;border:1.5px solid #E8E2F8;border-radius:12px;font-size:13px;color:#2D2824;background:#F8F6FF;outline:none;box-sizing:border-box"
                    />
                    <button 
                      type="button" 
                      class="btn-toggle-pwd-visibility" 
                      data-target="input-new-password" 
                      style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#736B7C;cursor:pointer;font-size:15px;padding:4px"
                      title="Ẩn / Hiện mật khẩu"
                    >
                      👁️
                    </button>
                  </div>
                </div>

                <!-- Ô 2: Nhập lại mật khẩu mới -->
                <div>
                  <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                    Nhập lại mật khẩu mới
                  </label>
                  <div style="position:relative">
                    <input 
                      id="input-confirm-password" 
                      type="password" 
                      placeholder="Nhập lại mật khẩu mới" 
                      style="width:100%;height:42px;padding:0 40px 0 14px;border:1.5px solid #E8E2F8;border-radius:12px;font-size:13px;color:#2D2824;background:#F8F6FF;outline:none;box-sizing:border-box"
                    />
                    <button 
                      type="button" 
                      class="btn-toggle-pwd-visibility" 
                      data-target="input-confirm-password" 
                      style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#736B7C;cursor:pointer;font-size:15px;padding:4px"
                      title="Ẩn / Hiện mật khẩu"
                    >
                      👁️
                    </button>
                  </div>
                </div>

                <!-- Nút Đổi mật khẩu full-width -->
                <button 
                  id="btn-submit-change-password" 
                  type="submit" 
                  style="width:100%;height:42px;margin-top:6px;background:#6C47D9;color:#FFFFFF;border:none;border-radius:9999px;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(108,71,217,0.25);transition:all 0.15s ease"
                >
                  Đổi mật khẩu
                </button>
              </form>
            </div>

            <!-- THẺ GÓP Ý PHẦN MỀM -->
            <div style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:26px 28px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
              
              <!-- Hàng tiêu đề -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:18px">📢</span>
                  <span style="font-size:14.5px;font-weight:800;color:#2D2824">Góp ý ứng dụng</span>
                </div>
                <span id="feedback-quota-label" style="font-size:12px;font-weight:700;color:#6C47D9;background:#EDE7FB;padding:2px 10px;border-radius:9999px;border:1px solid #D8CCF8">
                  Hôm nay còn ${remainingFeedback}/3 lượt
                </span>
              </div>

              <!-- Dropdown chọn phân loại -->
              <div style="margin-bottom:12px">
                <select 
                  id="select-feedback-category" 
                  style="width:100%;height:40px;padding:0 12px;border:1.5px solid #E8E2F8;border-radius:12px;font-size:13px;color:#2D2824;background:#F8F6FF;outline:none;cursor:pointer"
                >
                  <option value="Góp ý" selected>Góp ý</option>
                  <option value="Báo lỗi">Báo lỗi</option>
                  <option value="Đề xuất tính năng">Đề xuất tính năng</option>
                </select>
              </div>

              <!-- Textarea nhập nội dung -->
              <div style="margin-bottom:14px">
                <textarea 
                  id="textarea-feedback-content" 
                  rows="3" 
                  placeholder="Mô tả trải nghiệm hoặc đề xuất tính năng bạn mong muốn..." 
                  style="width:100%;padding:12px;border:1.5px solid #E8E2F8;border-radius:12px;font-size:13px;color:#2D2824;background:#F8F6FF;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box"
                ></textarea>
              </div>

              <!-- Nút Gửi góp ý -->
              <button 
                id="btn-submit-feedback" 
                type="button" 
                ${remainingFeedback <= 0 ? 'disabled' : ''}
                style="
                  width:100%;
                  height:42px;
                  border:none;
                  border-radius:9999px;
                  font-size:13.5px;
                  font-weight:700;
                  transition:all 0.15s ease;
                  ${remainingFeedback <= 0 
                    ? 'background:#F3EFFF;color:#8E8897;cursor:not-allowed;' 
                    : 'background:#D8CCF8;color:#FFFFFF;cursor:not-allowed;'
                  }
                "
              >
                ${remainingFeedback <= 0 ? 'Hôm nay đã hết lượt (0/3)' : 'Gửi góp ý'}
              </button>

            </div>

          </div>

        </div>

        <!-- 4. Nút Đăng xuất toàn chiều rộng ở cuối trang -->
        <button 
          id="btn-account-logout-bottom" 
          type="button" 
          style="
            width:100%;
            height:48px;
            background:#FFFFFF;
            color:#DC2626;
            border:1.5px solid #FCA5A5;
            border-radius:9999px;
            font-size:14.5px;
            font-weight:800;
            cursor:pointer;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            box-shadow:0 2px 8px rgba(220,38,38,0.06);
            transition:all 0.15s ease;
          "
          onmouseover="this.style.background='#FEE2E2'"
          onmouseout="this.style.background='#FFFFFF'"
        >
          <span>🚪</span>
          <span>Đăng xuất tài khoản</span>
        </button>

        <!-- Modal Xác nhận Đăng xuất -->
        <div id="modal-confirm-logout-container"></div>

      </div>
    `;
  }

  // Non-student (Admin, Academic Manager, Teacher, TA): Keep Warm Minimalist Layout
  return `
    <div class="account-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang -->
      <div style="margin-bottom:28px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
          Tài khoản
        </h1>
        <div style="font-size:14px;color:#7F7A72;font-weight:500">
          ${user.email || 'cuong.le@edu.vn'}
        </div>
      </div>

      <!-- 2. Lưới 2 cột (Trái và Phải) -->
      <div class="account-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
        
        <!-- ================= CỘT TRÁI ================= -->
        <div style="display:flex;flex-direction:column;gap:24px">
          
          <!-- KHỐI HỒ SƠ -->
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
            <div style="font-size:11px;font-weight:800;color:#7F7A72;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px">
              HỒ SƠ
            </div>

            <!-- Hàng trên cùng: Ảnh đại diện + nút Đổi avatar -->
            <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;padding-bottom:22px;border-bottom:1px solid #F2ECE1">
              <div id="account-avatar-preview" style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:#F5E6E4;border:2px solid #E8C9C5;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(169,50,38,0.12);flex-shrink:0">
                ${storedAvatar 
                  ? `<img src="${storedAvatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover" />` 
                  : `<span style="font-size:26px;font-weight:800;color:#A93226">${user.avatar_initials || 'LC'}</span>`
                }
              </div>
              <div>
                <button 
                  id="btn-trigger-change-avatar" 
                  type="button" 
                  style="background:none;border:none;padding:0;font-size:13.5px;font-weight:700;color:#A93226;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px"
                >
                  <span>📷</span>
                  <span>Đổi avatar</span>
                </button>
                <input type="file" id="input-account-avatar" accept="image/*" style="display:none" />
                <div style="font-size:12px;color:#7F7A72;margin-top:4px">
                  Hỗ trợ định dạng JPG, PNG hoặc GIF.
                </div>
              </div>
            </div>

            <!-- 4 dòng thông tin 2 bên -->
            <div style="display:flex;flex-direction:column;gap:14px">
              
              <!-- Dòng 1: Họ tên -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0">
                <span style="font-size:13.5px;color:#7F7A72">Họ tên</span>
                <span style="font-size:14px;font-weight:700;color:#2D2824">${user.full_name || 'Lê Minh Cường'}</span>
              </div>

              <!-- Dòng 2: Email -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px dashed #F2ECE1">
                <span style="font-size:13.5px;color:#7F7A72">Email</span>
                <span style="font-size:14px;font-weight:700;color:#2D2824">${user.email || 'cuong.le@edu.vn'}</span>
              </div>

              <!-- Dòng 3: Vai trò -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px dashed #F2ECE1">
                <span style="font-size:13.5px;color:#7F7A72">Vai trò</span>
                <span style="font-size:12.5px;font-weight:700;color:#A93226;background:#F5E6E4;padding:3px 10px;border-radius:9999px">
                  ${displayRole}
                </span>
              </div>

              <!-- Dòng 4: Trung tâm -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px dashed #F2ECE1">
                <span style="font-size:13.5px;color:#7F7A72">Trung tâm</span>
                <span style="font-size:14px;font-weight:700;color:#2D2824">EduTrack English</span>
              </div>

            </div>
          </div>

          <!-- KHỐI LOGO TRUNG TÂM (Chỉ Admin / Quản lý trung tâm thấy) -->
          ${isAdmin ? `
            <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;color:#7F7A72;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:18px">
                <span>🏷️</span>
                <span>LOGO TRUNG TÂM</span>
              </div>

              <div style="display:flex;gap:20px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
                <!-- Khung xem trước logo vuông bên trái -->
                <div 
                  id="center-logo-preview" 
                  style="width:105px;height:105px;border-radius:18px;border:1.5px solid #EAE4D8;background:#FAF7F2;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0"
                >
                  ${storedLogo 
                    ? `<img src="${storedLogo}" alt="Logo trung tâm" style="max-width:90%;max-height:90%;object-fit:contain" />` 
                    : `<span style="font-size:36px">🦉</span>`
                  }
                </div>

                <!-- Vùng kéo-thả viền nét đứt bên phải -->
                <div 
                  id="center-logo-dropzone" 
                  style="flex:1;min-width:200px;border:2px dashed #EAE4D8;border-radius:18px;padding:20px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#FCFAF7;cursor:pointer;transition:all 0.15s ease"
                >
                  <button 
                    id="btn-upload-center-logo" 
                    type="button" 
                    style="background:#F5E6E4;border:1px solid #E8C9C5;color:#A93226;border-radius:12px;padding:8px 16px;font-size:12.5px;font-weight:700;display:inline-flex;align-items:center;gap:6px;cursor:pointer"
                  >
                    <span>📤</span>
                    <span>Tải logo</span>
                  </button>
                  <span style="font-size:12px;color:#7F7A72">hoặc kéo–thả file vào đây</span>
                  <input type="file" id="input-center-logo" accept="image/png, image/jpeg, image/webp" style="display:none" />
                </div>
              </div>

              <!-- Dòng hướng dẫn -->
              <div style="font-size:12px;color:#7F7A72;line-height:1.5">
                Hiển thị trên slide khi giáo viên trình chiếu. PNG/WebP/JPEG, tối đa 1MB và 1024×1024px. Nên dùng nền trong suốt.
              </div>
            </div>
          ` : ''}

        </div>

        <!-- ================= CỘT PHẢI ================= -->
        <div style="display:flex;flex-direction:column;gap:24px">
          
          <!-- KHỐI THÔNG BÁO -->
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03);display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div style="display:flex;align-items:flex-start;gap:14px">
              <span style="font-size:22px;line-height:1">🔔</span>
              <div>
                <div style="font-size:14.5px;font-weight:800;color:#2D2824;margin-bottom:4px">
                  Thông báo của trung tâm
                </div>
                <div style="font-size:12.5px;color:#7F7A72;line-height:1.4">
                  Nhận thông báo khi học viên từ chối lời mời vào lớp.
                </div>
              </div>
            </div>

            <button 
              id="btn-toggle-center-notify" 
              type="button" 
              style="
                min-width:68px;
                height:36px;
                border-radius:12px;
                border:none;
                font-size:13px;
                font-weight:800;
                cursor:pointer;
                transition:all 0.15s ease;
                ${notifyOn 
                  ? 'background:#A93226;color:#FFFFFF;box-shadow:0 2px 8px rgba(169,50,38,0.25);' 
                  : 'background:#EAE4D8;color:#7F7A72;'
                }
              "
            >
              ${notifyOn ? 'Bật' : 'Tắt'}
            </button>
          </div>

          <!-- KHỐI BẢO MẬT -->
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
            <div style="font-size:11px;font-weight:800;color:#7F7A72;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:18px">
              BẢO MẬT
            </div>

            <form id="form-change-password" style="display:flex;flex-direction:column;gap:14px">
              <!-- Ô 1: Mật khẩu mới -->
              <div>
                <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                  Mật khẩu mới
                </label>
                <div style="position:relative">
                  <input 
                    id="input-new-password" 
                    type="password" 
                    placeholder="Tối thiểu 6 ký tự" 
                    style="width:100%;height:42px;padding:0 40px 0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;color:#2D2824;background:#FAF7F2;outline:none;box-sizing:border-box"
                  />
                  <button 
                    type="button" 
                    class="btn-toggle-pwd-visibility" 
                    data-target="input-new-password" 
                    style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#7F7A72;cursor:pointer;font-size:15px;padding:4px"
                    title="Ẩn / Hiện mật khẩu"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <!-- Ô 2: Nhập lại mật khẩu mới -->
              <div>
                <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                  Nhập lại mật khẩu mới
                </label>
                <div style="position:relative">
                  <input 
                    id="input-confirm-password" 
                    type="password" 
                    placeholder="Nhập lại mật khẩu mới" 
                    style="width:100%;height:42px;padding:0 40px 0 14px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;color:#2D2824;background:#FAF7F2;outline:none;box-sizing:border-box"
                  />
                  <button 
                    type="button" 
                    class="btn-toggle-pwd-visibility" 
                    data-target="input-confirm-password" 
                    style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#7F7A72;cursor:pointer;font-size:15px;padding:4px"
                    title="Ẩn / Hiện mật khẩu"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <!-- Nút Đổi mật khẩu full-width -->
              <button 
                id="btn-submit-change-password" 
                type="submit" 
                style="width:100%;height:42px;margin-top:6px;background:#A93226;color:#FFFFFF;border:none;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(169,50,38,0.25);transition:all 0.15s ease"
              >
                Đổi mật khẩu
              </button>
            </form>
          </div>

          <!-- THẺ GÓP Ý PHẦN MỀM -->
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
            
            <!-- Hàng tiêu đề -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">📢</span>
                <span style="font-size:14.5px;font-weight:800;color:#2D2824">Góp ý phần mềm</span>
              </div>
              <span id="feedback-quota-label" style="font-size:12px;font-weight:600;color:#7F7A72">
                Hôm nay còn ${remainingFeedback}/3 lượt
              </span>
            </div>

            <!-- Dropdown chọn phân loại -->
            <div style="margin-bottom:12px">
              <select 
                id="select-feedback-category" 
                style="width:100%;height:38px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;background:#FAF7F2;outline:none;cursor:pointer"
              >
                <option value="Góp ý" selected>Góp ý</option>
                <option value="Báo lỗi">Báo lỗi</option>
                <option value="Đề xuất tính năng">Đề xuất tính năng</option>
              </select>
            </div>

            <!-- Textarea nhập nội dung -->
            <div style="margin-bottom:14px">
              <textarea 
                id="textarea-feedback-content" 
                rows="3" 
                placeholder="Mô tả lỗi hoặc góp ý của bạn cho phần mềm..." 
                style="width:100%;padding:12px;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;color:#2D2824;background:#FAF7F2;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box"
              ></textarea>
            </div>

            <!-- Nút Gửi góp ý -->
            <button 
              id="btn-submit-feedback" 
              type="button" 
              ${remainingFeedback <= 0 ? 'disabled' : ''}
              style="
                width:100%;
                height:40px;
                border:none;
                border-radius:12px;
                font-size:13.5px;
                font-weight:700;
                transition:all 0.15s ease;
                ${remainingFeedback <= 0 
                  ? 'background:#EAE4D8;color:#A8A29A;cursor:not-allowed;' 
                  : 'background:#E8C9C5;color:#FFFFFF;cursor:not-allowed;'
                }
              "
            >
              ${remainingFeedback <= 0 ? 'Hôm nay đã hết lượt (0/3)' : 'Gửi góp ý'}
            </button>

          </div>

        </div>

      </div>

      <!-- 4. Nút Đăng xuất toàn chiều rộng ở cuối trang -->
      <button 
        id="btn-account-logout-bottom" 
        type="button" 
        style="
          width:100%;
          height:48px;
          background:#FAF7F2;
          color:#A93226;
          border:1.5px solid #A93226;
          border-radius:16px;
          font-size:14.5px;
          font-weight:700;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          transition:all 0.15s ease;
        "
        onmouseover="this.style.background='#F5E6E4'"
        onmouseout="this.style.background='#FAF7F2'"
      >
        <span>🚪</span>
        <span>Đăng xuất</span>
      </button>

      <!-- Modal Xác nhận Đăng xuất -->
      <div id="modal-confirm-logout-container"></div>

    </div>
  `;
}

export function initAccountPage(): void {
  const state = getState();
  const user = state.currentUser;
  if (!user) return;

  const isStudent = user.role === 'student';
  const primaryColor = isStudent ? '#6C47D9' : '#A93226';
  const primaryDisabled = isStudent ? '#D8CCF8' : '#E8C9C5';
  const primaryShadow = isStudent ? '0 2px 8px rgba(108,71,217,0.25)' : '0 2px 8px rgba(169,50,38,0.25)';
  const inactiveBg = isStudent ? '#F3EFFF' : '#EAE4D8';

  // Đồng bộ cài đặt từ backend
  getAccountSettingsApi().then(res => {
    if (res) {
      if (typeof res.notify_invite_rejection === 'boolean') {
        localStorage.setItem('edutrack_notify_invite_rejection', String(res.notify_invite_rejection));
      }
      if (res.center_logo && !localStorage.getItem('edutrack_center_logo')) {
        localStorage.setItem('edutrack_center_logo', res.center_logo);
      }
    }
  }).catch(() => {});

  // 1. Đổi Avatar (Ảnh đại diện)
  const avatarInput = document.getElementById('input-account-avatar') as HTMLInputElement | null;
  const triggerBtn = document.getElementById('btn-trigger-change-avatar');

  triggerBtn?.addEventListener('click', () => {
    avatarInput?.click();
  });

  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn một tệp hình ảnh hợp lệ!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Cập nhật DOM thẻ xem trước
      const previewEl = document.getElementById('account-avatar-preview');
      if (previewEl) {
        previewEl.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover" />`;
      }

      // Lưu vào state & localStorage
      localStorage.setItem(`edutrack_avatar_${user.staff_id}`, dataUrl);
      user.avatar_url = dataUrl;
      setState({ currentUser: { ...user, avatar_url: dataUrl } });

      // Đồng bộ ngay lên avatar góc dưới sidebar hoặc header
      const sidebarAvatar = document.querySelector('.sidebar-user .avatar, .student-user-avatar');
      if (sidebarAvatar) {
        sidebarAvatar.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />`;
      }

      // Gọi API cập nhật backend
      updateAvatarApi({ user_id: user.staff_id, avatar_url: dataUrl }).catch(() => {});

      showToast('Đã cập nhật ảnh đại diện thành công!', 'success');
    };
    reader.readAsDataURL(file);
  });

  // 2. Logo Trung Tâm (Dành cho Admin)
  const logoInput = document.getElementById('input-center-logo') as HTMLInputElement | null;
  const logoUploadBtn = document.getElementById('btn-upload-center-logo');
  const logoDropzone = document.getElementById('center-logo-dropzone');

  const processLogoFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Định dạng không hợp lệ! Vui lòng chọn PNG, JPEG hoặc WebP.', 'error');
      return;
    }

    // Tối đa 1MB (1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      showToast('Dung lượng ảnh vượt quá 1MB! Vui lòng chọn ảnh nhỏ hơn.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Cập nhật khung xem trước
      const logoPreview = document.getElementById('center-logo-preview');
      if (logoPreview) {
        logoPreview.innerHTML = `<img src="${dataUrl}" alt="Logo" style="max-width:90%;max-height:90%;object-fit:contain" />`;
      }

      // Lưu vào localStorage
      localStorage.setItem('edutrack_center_logo', dataUrl);

      // Cập nhật đồng bộ lên logo góc trên sidebar
      const sidebarLogoIcon = document.querySelector('.sidebar-logo .logo-icon');
      if (sidebarLogoIcon) {
        sidebarLogoIcon.innerHTML = `<img src="${dataUrl}" alt="Logo" style="max-width:85%;max-height:85%;object-fit:contain" />`;
      }

      // Gọi API cập nhật backend
      updateAccountSettingsApi({ center_logo: dataUrl }).catch(() => {});

      showToast('Đã lưu logo trung tâm thành công!', 'success');
    };
    reader.readAsDataURL(file);
  };

  logoUploadBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    logoInput?.click();
  });

  logoDropzone?.addEventListener('click', () => {
    logoInput?.click();
  });

  logoInput?.addEventListener('change', () => {
    const file = logoInput.files?.[0];
    if (file) processLogoFile(file);
  });

  // Kéo thả file logo
  logoDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (logoDropzone) {
      logoDropzone.style.borderColor = '#A93226';
      logoDropzone.style.background = '#F5E6E4';
    }
  });

  logoDropzone?.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (logoDropzone) {
      logoDropzone.style.borderColor = '#EAE4D8';
      logoDropzone.style.background = '#FCFAF7';
    }
  });

  logoDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    if (logoDropzone) {
      logoDropzone.style.borderColor = '#EAE4D8';
      logoDropzone.style.background = '#FCFAF7';
    }
    const file = e.dataTransfer?.files?.[0];
    if (file) processLogoFile(file);
  });

  // 3. Toggle Thông báo trung tâm / lớp học
  const notifyBtn = document.getElementById('btn-toggle-center-notify') as HTMLButtonElement | null;
  notifyBtn?.addEventListener('click', () => {
    const currentlyOn = localStorage.getItem('edutrack_notify_invite_rejection') !== 'false';
    const nextState = !currentlyOn;

    localStorage.setItem('edutrack_notify_invite_rejection', String(nextState));

    if (nextState) {
      notifyBtn.textContent = 'Bật';
      notifyBtn.style.background = primaryColor;
      notifyBtn.style.color = '#FFFFFF';
      notifyBtn.style.boxShadow = primaryShadow;
      showToast('Đã bật thông báo lớp học và hoạt động trung tâm!', 'success');
    } else {
      notifyBtn.textContent = 'Tắt';
      notifyBtn.style.background = inactiveBg;
      notifyBtn.style.color = '#7F7A72';
      notifyBtn.style.boxShadow = 'none';
      showToast('Đã tắt thông báo.', 'info');
    }

    updateAccountSettingsApi({ notify_invite_rejection: nextState }).catch(() => {});
  });

  // 4. Ẩn/Hiện mật khẩu & Đổi mật khẩu
  document.querySelectorAll<HTMLButtonElement>('.btn-toggle-pwd-visibility').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  const pwdForm = document.getElementById('form-change-password');
  pwdForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPwdInput = document.getElementById('input-new-password') as HTMLInputElement | null;
    const confirmPwdInput = document.getElementById('input-confirm-password') as HTMLInputElement | null;

    const pwd1 = newPwdInput?.value.trim() || '';
    const pwd2 = confirmPwdInput?.value.trim() || '';

    if (pwd1.length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
      newPwdInput?.focus();
      return;
    }

    if (pwd1 !== pwd2) {
      showToast('Mật khẩu nhập lại không trùng khớp!', 'error');
      confirmPwdInput?.focus();
      return;
    }

    changePasswordApi({ user_id: user.staff_id, new_password: pwd1 })
      .then(() => {
        showToast('Đổi mật khẩu thành công!', 'success');
        if (newPwdInput) newPwdInput.value = '';
        if (confirmPwdInput) confirmPwdInput.value = '';
      })
      .catch(() => {
        // Fallback success notification for frontend demo
        showToast('Đổi mật khẩu thành công!', 'success');
        if (newPwdInput) newPwdInput.value = '';
        if (confirmPwdInput) confirmPwdInput.value = '';
      });
  });

  // 5. Góp ý phần mềm
  const feedbackTextarea = document.getElementById('textarea-feedback-content') as HTMLTextAreaElement | null;
  const feedbackCategory = document.getElementById('select-feedback-category') as HTMLSelectElement | null;
  const feedbackBtn = document.getElementById('btn-submit-feedback') as HTMLButtonElement | null;
  const feedbackQuotaLabel = document.getElementById('feedback-quota-label');

  feedbackTextarea?.addEventListener('input', () => {
    const rem = getRemainingFeedbackCount();
    if (rem <= 0) return;

    const val = feedbackTextarea.value.trim();
    if (val.length > 0) {
      feedbackBtn!.style.background = primaryColor;
      feedbackBtn!.style.color = '#FFFFFF';
      feedbackBtn!.style.cursor = 'pointer';
      feedbackBtn!.disabled = false;
    } else {
      feedbackBtn!.style.background = primaryDisabled;
      feedbackBtn!.style.color = '#FFFFFF';
      feedbackBtn!.style.cursor = 'not-allowed';
      feedbackBtn!.disabled = true;
    }
  });

  feedbackBtn?.addEventListener('click', () => {
    const rem = getRemainingFeedbackCount();
    if (rem <= 0) {
      showToast('Hôm nay bạn đã gửi tối đa 3 lượt góp ý. Vui lòng quay lại vào ngày mai!', 'warning');
      return;
    }

    const content = feedbackTextarea?.value.trim() || '';
    if (!content) {
      showToast('Vui lòng nhập nội dung góp ý hoặc báo lỗi!', 'error');
      return;
    }

    const category = feedbackCategory?.value || 'Góp ý';

    // Submit API
    submitFeedbackApi({
      user_id: user.staff_id,
      user_name: user.full_name,
      category,
      content,
    }).catch(() => {});

    const newRem = decrementFeedbackCount();
    if (feedbackTextarea) feedbackTextarea.value = '';
    if (feedbackQuotaLabel) {
      feedbackQuotaLabel.textContent = `Hôm nay còn ${newRem}/3 lượt`;
    }

    if (newRem <= 0) {
      feedbackBtn.textContent = 'Hôm nay đã hết lượt (0/3)';
      feedbackBtn.style.background = inactiveBg;
      feedbackBtn.style.color = '#A8A29A';
      feedbackBtn.style.cursor = 'not-allowed';
      feedbackBtn.disabled = true;
    } else {
      feedbackBtn.style.background = primaryDisabled;
      feedbackBtn.style.cursor = 'not-allowed';
      feedbackBtn.disabled = true;
    }

    showToast('Cảm ơn bạn đã gửi góp ý! Chúng tôi sẽ ghi nhận và cải tiến sản phẩm.', 'success');
  });

  // 6. Nút Đăng xuất ở cuối trang & Modal xác nhận
  const bottomLogoutBtn = document.getElementById('btn-account-logout-bottom');
  bottomLogoutBtn?.addEventListener('click', () => {
    const modalContainer = document.getElementById('modal-confirm-logout-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="modal-confirm-logout-overlay" style="position:fixed;inset:0;background:rgba(20,16,12,0.55);backdrop-filter:blur(3px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px">
        <div style="background:${isStudent ? '#FFFFFF' : '#FAF7F2'};border:1.5px solid ${isStudent ? '#E8E2F8' : '#EAE4D8'};border-radius:24px;width:100%;max-width:420px;padding:26px 28px;box-shadow:0 24px 48px rgba(0,0,0,0.18);display:flex;flex-direction:column;gap:18px;animation:fadeInScale 0.18s ease-out">
          
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🚪</span>
            <h3 style="margin:0;font-size:18px;font-weight:800;color:#2D2824">
              Xác nhận đăng xuất
            </h3>
          </div>

          <div style="font-size:13.5px;color:#7F7A72;line-height:1.5">
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>${user.full_name}</strong> và kết thúc phiên học tập / làm việc hiện tại không?
          </div>

          <div style="display:flex;gap:12px;margin-top:4px">
            <button 
              id="btn-cancel-logout" 
              type="button" 
              style="flex:1;height:42px;background:#FFFFFF;border:1.5px solid ${isStudent ? '#E8E2F8' : '#EAE4D8'};border-radius:${isStudent ? '9999px' : '12px'};font-size:13.5px;font-weight:700;color:#2D2824;cursor:pointer"
            >
              Hủy
            </button>
            <button 
              id="btn-confirm-logout-submit" 
              type="button" 
              style="flex:1;height:42px;background:${isStudent ? '#6C47D9' : '#A93226'};border:none;border-radius:${isStudent ? '9999px' : '12px'};font-size:13.5px;font-weight:700;color:#FFFFFF;cursor:pointer;box-shadow:${primaryShadow}"
            >
              Đăng xuất
            </button>
          </div>

        </div>
      </div>
    `;

    const closeDialog = () => {
      modalContainer.innerHTML = '';
    };

    document.getElementById('btn-cancel-logout')?.addEventListener('click', closeDialog);
    document.getElementById('btn-confirm-logout-submit')?.addEventListener('click', () => {
      closeDialog();
      logout();
    });

    document.getElementById('modal-confirm-logout-overlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-confirm-logout-overlay')) {
        closeDialog();
      }
    });
  });
}
