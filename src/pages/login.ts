// ============================================
// EduTrack - Login Page (AIO English Bento Warm Theme)
// Phân quyền đa tài khoản: Admin, Quản lý, Giảng viên, Trợ giảng & Học viên
// ============================================

import { login, loginAsStudent, loginWithCredentials } from '../state.ts';
import { staffData, studentData } from '../data.ts';
import { icons, showToast } from '../utils.ts';

export interface RoleAccount {
  id: string;
  code: string;
  name: string;
  email: string;
  campus: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  note: string;
  isStudent?: boolean;
}

// Current selection state
let currentSelectedRole: 'admin' | 'manager' | 'teacher' | 'ta' | 'student' = 'admin';
let currentSelectedAccountId: string = 'STF001';

export function getRoleAccountsMap(): Record<string, RoleAccount[]> {
  const admins = staffData.filter(s => s.role === 'admin').map(s => ({
    id: s.staff_id,
    code: s.staff_id,
    name: s.full_name,
    email: s.email,
    campus: s.campus,
    avatar: '👑',
    avatarBg: '#FFF8D9',
    avatarColor: '#854d0e',
    note: 'Toàn quyền quản trị hệ thống, Phân quyền & Audit Log',
  }));

  const teachers = staffData.filter(s => s.role === 'teacher').map(s => ({
    id: s.staff_id,
    code: s.staff_id,
    name: s.full_name,
    email: s.email,
    campus: s.campus === 'CS1' ? 'Cơ sở 1' : 'Cơ sở 2',
    avatar: s.avatar_initials,
    avatarBg: s.campus === 'CS1' ? '#F0F9FF' : '#ECFDF5',
    avatarColor: s.campus === 'CS1' ? '#0284C7' : '#059669',
    note: s.staff_id === 'STF003' 
      ? 'IELTS Foundation 5.5, Comm, TOEIC · Màu Xanh dương' 
      : 'IELTS Intensive 6.5+, Tiếng Anh B1 · Màu Xanh lá',
  }));

  const tas = staffData.filter(s => s.role === 'teaching_assistant').map(s => ({
    id: s.staff_id,
    code: s.staff_id,
    name: s.full_name,
    email: s.email,
    campus: s.campus === 'CS1' ? 'Cơ sở 1' : 'Cơ sở 2',
    avatar: s.avatar_initials,
    avatarBg: '#ECFDF5',
    avatarColor: '#059669',
    note: s.staff_id === 'STF005'
      ? 'Trợ giảng CS1 · Điểm danh, nhắc bài & Toolkit'
      : 'Trợ giảng CS2 · Chấm bài & Hỗ trợ học tập',
  }));

  const targetStudentIds = ['SV_NN', 'SV001', 'SV002', 'SV006'];
  const students = targetStudentIds.map(id => studentData.find(st => st.student_id === id)).filter(Boolean).map(s => ({
    id: s!.student_id,
    code: s!.student_code,
    name: s!.full_name,
    email: s!.email,
    campus: s!.campus === 'CS1' ? 'Cơ sở 1' : 'Cơ sở 2',
    avatar: s!.avatar_initials,
    avatarBg: '#FAF5FF',
    avatarColor: '#7C3AED',
    note: s!.student_id === 'SV_NN' 
      ? 'Lớp IELTS Foundation 5.5 (Giáo trình mẫu)' 
      : (s!.student_id === 'SV001' 
        ? 'Lớp IELTS Foundation & Tiếng Anh A1' 
        : (s!.student_id === 'SV002' ? 'Lớp Tiếng Anh B1 & A1' : 'Lớp English Communication & IELTS 5.5')),
    isStudent: true,
  }));

  return {
    admin: admins,
    teacher: teachers,
    ta: tas,
    student: students,
  };
}

export function renderRoleAccountsHtml(role: string, selectedId: string): string {
  const map = getRoleAccountsMap();
  const accounts = map[role] || [];

  return `
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:12px;font-weight:700;color:#24201D;display:flex;align-items:center;gap:6px">
          <span>Danh sách tài khoản (${accounts.length} người dùng):</span>
        </span>
        <span style="font-size:11px;color:#8F8276">Bấm vào thẻ để chọn tài khoản</span>
      </div>

      <div style="display:grid;grid-template-columns:${accounts.length === 1 ? '1fr' : (accounts.length === 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))')};gap:10px">
        ${accounts.map(acc => {
          const isSelected = acc.id === selectedId;
          return `
            <div 
              class="account-card-item"
              data-role="${role}"
              data-account-id="${acc.id}"
              data-email="${acc.email}"
              data-name="${acc.name}"
              data-is-student="${acc.isStudent ? 'true' : 'false'}"
              style="
                display:flex;
                align-items:center;
                gap:12px;
                padding:12px 14px;
                border-radius:16px;
                cursor:pointer;
                transition:all 0.15s ease;
                background:${isSelected ? '#FAF4EE' : '#FFFDF9'};
                border:1.5px solid ${isSelected ? '#A93226' : '#ECE3D6'};
                box-shadow:${isSelected ? '0 3px 12px rgba(169,50,38,0.12)' : '0 1px 3px rgba(0,0,0,0.02)'};
              "
            >
              <div style="
                width:38px;
                height:38px;
                border-radius:12px;
                background:${acc.avatarBg};
                color:${acc.avatarColor};
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:13px;
                font-weight:800;
                flex-shrink:0;
              ">
                ${acc.avatar}
              </div>

              <div style="min-width:0;flex:1;line-height:1.3">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                  <span style="font-size:13px;font-weight:800;color:#24201D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${acc.name}
                  </span>
                  <span style="font-size:10px;font-weight:700;background:#ECE3D6;color:#7A6E65;padding:1px 6px;border-radius:4px">
                    ${acc.code}
                  </span>
                </div>
                <div style="font-size:11.5px;color:${isSelected ? '#A93226' : '#7A6E65'};font-weight:${isSelected ? '700' : '500'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${acc.email}
                </div>
                <div style="font-size:10.5px;color:#A3978B;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${acc.campus} · ${acc.note}
                </div>
              </div>

              <div style="
                width:20px;
                height:20px;
                border-radius:50%;
                border:1.5px solid ${isSelected ? '#A93226' : '#D1C7BC'};
                background:${isSelected ? '#A93226' : '#FFFFFF'};
                display:flex;
                align-items:center;
                justify-content:center;
                flex-shrink:0;
              ">
                ${isSelected ? '<span style="color:#FFF;font-size:11px;font-weight:900">✓</span>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderLoginPage(): string {
  const map = getRoleAccountsMap();
  const currentAccounts = map[currentSelectedRole] || [];
  const currentAccount = currentAccounts.find(a => a.id === currentSelectedAccountId) || currentAccounts[0] || {
    id: 'STF001',
    code: 'STF001',
    name: 'Nguyễn Văn An',
    email: 'admin',
  };

  const roleConfigs = [
    { role: 'admin', icon: '👑', label: 'Admin', count: map.admin.length, activeBg: '#FFF8EC', activeBorder: '#F5DEC2', activeColor: '#854d0e' },
    { role: 'teacher', icon: '👨‍🏫', label: 'Giảng viên', count: map.teacher.length, activeBg: '#F0F9FF', activeBorder: '#BAE6FD', activeColor: '#0284C7' },
    { role: 'ta', icon: '🤝', label: 'Trợ giảng', count: map.ta.length, activeBg: '#ECFDF5', activeBorder: '#A7F3D0', activeColor: '#059669' },
    { role: 'student', icon: '🎒', label: 'Học viên', count: map.student.length, activeBg: '#FAF5FF', activeBorder: '#E9D5FF', activeColor: '#7C3AED' },
  ];

  return `
    <div class="login-page" style="background:#FAF6EF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:var(--font-sans)">
      <div style="display:flex;max-width:1120px;width:100%;background:#FFFDF9;border:1px solid #ECE3D6;border-radius:28px;box-shadow:0 12px 40px rgba(60, 40, 20, 0.06);overflow:hidden;flex-wrap:wrap">
        
        <!-- Left Column: Bento Brand Story -->
        <div style="flex:1;min-width:320px;padding:48px 40px;background:#FAF5EE;border-right:1px solid #ECE3D6;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <!-- EduTrack Brand Logo -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
              <div style="width:48px;height:48px;background:linear-gradient(135deg, #f59e0b, #ef4444);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(245, 158, 11, 0.25);font-size:24px">
                📚
              </div>
              <div>
                <div style="display:flex;align-items:center;gap:4px">
                  <span style="color:#24201D;font-weight:900;font-size:24px;letter-spacing:-0.03em">Edu<span style="color:#EA580C">Track</span></span>
                </div>
                <div style="font-size:11px;font-weight:600;color:#8F8276;text-transform:uppercase;letter-spacing:0.06em">Smart Academic Suite</div>
              </div>
            </div>

            <!-- Heading -->
            <div style="display:inline-flex;align-items:center;gap:6px;background:#FDEEE9;color:#EA580C;padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:700;margin-bottom:12px">
              <span>⚡ Hệ thống Điều hành Đào tạo & Quản trị Toàn diện</span>
            </div>
            <h2 style="font-size:25px;font-weight:800;color:#24201D;line-height:1.3;margin:0 0 12px 0">
              Cổng Đăng Nhập Đa Vai Trò EduTrack
            </h2>
            <p style="font-size:13.5px;color:#7A6E65;line-height:1.6;margin:0 0 24px 0">
              Nền tảng phân quyền chuyên sâu: Quản trị viên (Admin), Giảng viên, Trợ giảng và Học viên với giao diện trực quan chuẩn Bento.
            </p>

            <!-- Bento Role Badges Overview -->
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#FFFDF9;border:1px solid #ECE3D6;border-radius:14px">
                <span style="font-size:16px;background:#FFF8D9;color:#854d0e;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center">👑</span>
                <div>
                  <div style="font-size:12.5px;color:#24201D;font-weight:700">Quản trị viên (Admin)</div>
                  <div style="font-size:11px;color:#7A6E65">Toàn quyền hệ thống, đào tạo, audit log, người dùng & cấu hình</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#FFFDF9;border:1px solid #ECE3D6;border-radius:14px">
                <span style="font-size:16px;background:#E2F6ED;color:#059669;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center">👨‍🏫</span>
                <div>
                  <div style="font-size:12.5px;color:#24201D;font-weight:700">Giảng viên &amp; Trợ giảng</div>
                  <div style="font-size:11px;color:#7A6E65">Chấm bài, điểm danh và công cụ Class Toolkit trên lớp</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#FFFDF9;border:1px solid #ECE3D6;border-radius:14px">
                <span style="font-size:16px;background:#FCE8EF;color:#be185d;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center">🎒</span>
                <div>
                  <div style="font-size:12.5px;color:#24201D;font-weight:700">Cổng Học viên cá nhân hóa</div>
                  <div style="font-size:11px;color:#7A6E65">Nộp bài tập, thi Quiz, xin nghỉ/học bù & nhận phản hồi</div>
                </div>
              </div>
            </div>
          </div>

          <div style="font-size:11px;color:#A3978B;margin-top:28px;display:flex;align-items:center;gap:8px">
            <span>EduTrack Platform v2.0</span>
            <span>·</span>
            <span>Bảo mật RBAC &amp; Audit Log</span>
          </div>
        </div>

        <!-- Right Column: Login Form & Role Account Selector -->
        <div style="flex:1.4;min-width:360px;padding:40px;display:flex;flex-direction:column;justify-content:center">
          <div style="margin-bottom:20px">
            <h3 style="font-size:22px;font-weight:800;color:#24201D;margin:0 0 6px 0">Đăng nhập tài khoản</h3>
            <p style="font-size:13px;color:#7A6E65;margin:0">Bấm chọn vai trò bên dưới để xem danh sách tài khoản tương ứng:</p>
          </div>

          <!-- Role Selection Pills on Top -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px">
            ${roleConfigs.map(cfg => {
              const isActive = cfg.role === currentSelectedRole;
              return `
                <button 
                  type="button" 
                  class="btn-role-tab" 
                  data-role="${cfg.role}"
                  style="
                    border-radius:9999px;
                    padding:7px 14px;
                    font-size:12px;
                    font-weight:700;
                    cursor:pointer;
                    transition:all 0.15s ease;
                    display:inline-flex;
                    align-items:center;
                    gap:6px;
                    ${isActive 
                      ? `background:${cfg.activeBg};border:1.5px solid ${cfg.activeColor};color:${cfg.activeColor};box-shadow:0 2px 6px rgba(0,0,0,0.04);` 
                      : `background:#FFFDF9;border:1px solid #ECE3D6;color:#7A6E65;`
                    }
                  "
                >
                  <span>${cfg.icon}</span>
                  <span>${cfg.label}</span>
                  <span style="font-size:10.5px;opacity:0.85;background:${isActive ? '#FFFFFF' : '#ECE3D6'};padding:1px 6px;border-radius:99px;font-weight:800">
                    ${cfg.count}
                  </span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Dynamic Container: Accounts of the selected role (separated individually) -->
          <div id="login-role-accounts-container">
            ${renderRoleAccountsHtml(currentSelectedRole, currentSelectedAccountId)}
          </div>

          <!-- Credential Login Form -->
          <form id="credential-login-form" style="display:flex;flex-direction:column;gap:14px">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin:0">Tài khoản / Email / Mã định danh</label>
                <span style="font-size:11px;color:#A93226;font-weight:600">Đã tự động điền</span>
              </div>
              <input 
                type="text" 
                id="login-identifier" 
                class="form-input" 
                style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:10px 14px;font-size:13.5px;width:100%;color:#24201D;font-weight:600" 
                placeholder="Email hoặc mã định danh" 
                required 
                value="${currentAccount.email}" 
              />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin:0">Mật khẩu</label>
                <span style="font-size:10.5px;color:#A3978B">Mật khẩu demo: <b>123456</b></span>
              </div>
              <input 
                type="password" 
                id="login-password" 
                class="form-input" 
                style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:10px 14px;font-size:13.5px;width:100%;color:#24201D" 
                placeholder="Mật khẩu" 
                required 
                value="123456" 
              />
            </div>

            <button 
              type="submit" 
              id="btn-submit-login"
              class="btn btn-primary" 
              style="background:#24201D;color:#fff;border-radius:9999px;font-size:13.5px;font-weight:700;padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 3px 10px rgba(36,32,29,0.15);cursor:pointer;margin-top:4px"
            >
              ${icons.target} <span id="btn-submit-login-text">Đăng nhập vào hệ thống (${currentAccount.name})</span>
            </button>
          </form>

          <div style="text-align:center;margin-top:16px;font-size:11.5px;color:#A3978B">
            💡 Nhấp đúp vào thẻ tài khoản để đăng nhập nhanh tức thì
          </div>

        </div>
      </div>
    </div>
  `;
}

export function initLoginPage() {
  const map = getRoleAccountsMap();

  function selectAccount(acc: RoleAccount, triggerLogin = false) {
    currentSelectedAccountId = acc.id;
    const idInput = document.getElementById('login-identifier') as HTMLInputElement | null;
    const pwInput = document.getElementById('login-password') as HTMLInputElement | null;
    const submitText = document.getElementById('btn-submit-login-text');

    if (idInput) idInput.value = acc.email;
    if (pwInput) pwInput.value = '123456';
    if (submitText) submitText.textContent = `Đăng nhập vào hệ thống (${acc.name})`;

    // Re-render accounts container to update active state
    const container = document.getElementById('login-role-accounts-container');
    if (container) {
      container.innerHTML = renderRoleAccountsHtml(currentSelectedRole, currentSelectedAccountId);
      attachAccountClickEvents();
    }

    if (triggerLogin) {
      if (acc.isStudent) {
        loginAsStudent(acc.id);
        showToast(`Đăng nhập thành công cổng học viên: ${acc.name}!`, 'success');
      } else {
        login(acc.id);
        showToast(`Đăng nhập thành công: ${acc.name}!`, 'success');
      }
    }
  }

  function attachAccountClickEvents() {
    document.querySelectorAll<HTMLElement>('.account-card-item').forEach(card => {
      card.addEventListener('click', () => {
        const accId = card.dataset.accountId;
        const role = card.dataset.role || currentSelectedRole;
        const accounts = map[role] || [];
        const acc = accounts.find(a => a.id === accId);
        if (acc) {
          selectAccount(acc, false);
          showToast(`Đã chọn tài khoản: ${acc.name}`, 'info');
        }
      });

      card.addEventListener('dblclick', () => {
        const accId = card.dataset.accountId;
        const role = card.dataset.role || currentSelectedRole;
        const accounts = map[role] || [];
        const acc = accounts.find(a => a.id === accId);
        if (acc) {
          selectAccount(acc, true);
        }
      });
    });
  }

  // 1. Role button clicks (Tabs)
  document.querySelectorAll<HTMLElement>('.btn-role-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role as 'admin' | 'manager' | 'teacher' | 'ta' | 'student';
      if (!role) return;

      currentSelectedRole = role;

      // Update button active styles
      document.querySelectorAll<HTMLElement>('.btn-role-tab').forEach(b => {
        const bRole = b.dataset.role;
        const isActive = bRole === role;
        b.style.background = isActive ? '#FAF4EE' : '#FFFDF9';
        b.style.borderColor = isActive ? '#A93226' : '#ECE3D6';
        b.style.color = isActive ? '#A93226' : '#7A6E65';
      });

      // Default to first account of this role
      const accounts = map[role] || [];
      const firstAcc = accounts[0];
      if (firstAcc) {
        selectAccount(firstAcc, false);
      }
    });
  });

  // 2. Initial account click listeners
  attachAccountClickEvents();

  // 3. Form submit
  const loginForm = document.getElementById('credential-login-form');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const identifier = (document.getElementById('login-identifier') as HTMLInputElement).value;
    const password = (document.getElementById('login-password') as HTMLInputElement).value;
    const res = loginWithCredentials(identifier, password);
    if (!res.success) {
      showToast(res.message, 'error');
    } else {
      showToast(res.message, 'success');
    }
  });
}
