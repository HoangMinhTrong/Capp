// ============================================
// NTTClass - Bộ công cụ lớp học trực tuyến
// Tham khảo thiết kế & tính năng từ nttclass.com / nttclass.app
// ============================================

import { studentData } from './data.ts';
import { showToast } from './utils.ts';

let currentTab: 'picker' | 'timer' | 'dice' | 'groups' | 'qr' = 'picker';
let timerInterval: any = null;
let timerSeconds = 180; // 3 mins default
let timerInitial = 180;
let isTimerRunning = false;

export function renderNttToolsModal(): string {
  return `
    <div class="modal-backdrop active" id="ntt-tools-backdrop" style="display:flex;align-items:center;justify-content:center;z-index:99999;background:rgba(15,23,42,0.6);backdrop-filter:blur(6px);position:fixed;inset:0">
      <div class="modal ntt-modal" style="width:720px;max-width:94vw;max-height:90vh;background:#fff;border-radius:20px;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);overflow:hidden;display:flex;flex-direction:column;border:1px solid #e2e8f0;animation:scaleIn 0.25s ease-out">
        
        <!-- Header -->
        <div style="padding:16px 24px;border-bottom:1px solid #ECE3D6;display:flex;align-items:center;justify-content:space-between;background:#FAF5EE">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg, #f59e0b, #ea580c);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(234,88,12,0.25)">
              ✨
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <h3 style="margin:0;font-size:1.15rem;font-weight:800;color:#24201D">Class <span style="color:#EA580C">Toolkit</span></h3>
                <span style="font-size:10.5px;padding:2px 8px;border-radius:9999px;background:#FDEEE9;color:#EA580C;font-weight:700">Giảng viên &amp; Trợ giảng</span>
              </div>
              <p style="margin:0;font-size:0.8rem;color:#7A6E65">Bộ công cụ trợ giảng &amp; hoạt động tương tác trực tiếp trên lớp học</p>
            </div>
          </div>
          <button id="close-ntt-tools" style="width:36px;height:36px;border-radius:10px;border:1px solid #ECE3D6;background:#fff;color:#7A6E65;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;transition:all 0.2s" title="Đóng">
            ✕
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display:flex;gap:4px;padding:8px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;overflow-x:auto">
          <button class="ntt-tab-btn ${currentTab === 'picker' ? 'active' : ''}" data-tab="picker" style="padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer;border:none;transition:all 0.2s">
            <span>🎯</span> Bốc thăm học sinh
          </button>
          <button class="ntt-tab-btn ${currentTab === 'timer' ? 'active' : ''}" data-tab="timer" style="padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer;border:none;transition:all 0.2s">
            <span>⏱️</span> Đồng hồ đếm giờ
          </button>
          <button class="ntt-tab-btn ${currentTab === 'dice' ? 'active' : ''}" data-tab="dice" style="padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer;border:none;transition:all 0.2s">
            <span>🎲</span> Xúc xắc & Đồng xu
          </button>
          <button class="ntt-tab-btn ${currentTab === 'groups' ? 'active' : ''}" data-tab="groups" style="padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer;border:none;transition:all 0.2s">
            <span>👥</span> Chia nhóm tự động
          </button>
          <button class="ntt-tab-btn ${currentTab === 'qr' ? 'active' : ''}" data-tab="qr" style="padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer;border:none;transition:all 0.2s">
            <span>📱</span> Tạo mã QR nhanh
          </button>
        </div>

        <!-- Tab Body Content -->
        <div id="ntt-tab-content" style="padding:24px;overflow-y:auto;flex:1">
          ${renderTabContent()}
        </div>

        <!-- Footer -->
        <div style="padding:12px 24px;background:#f8fafc;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#94a3b8">
          <span>✨ Chạy 100% Client-side trên trình duyệt · Không lưu dữ liệu cá nhân</span>
          <span style="font-weight:600;color:#4f46e5">Thiết kế theo chuẩn NTTClass</span>
        </div>
      </div>
    </div>
  `;
}

function renderTabContent(): string {
  switch (currentTab) {
    case 'picker':
      return renderPickerTab();
    case 'timer':
      return renderTimerTab();
    case 'dice':
      return renderDiceTab();
    case 'groups':
      return renderGroupsTab();
    case 'qr':
      return renderQrTab();
    default:
      return '';
  }
}

// 1. Picker Tab (Bốc thăm ngẫu nhiên)
function renderPickerTab(): string {
  const activeStudents = studentData.filter(s => s.status === 'active');
  return `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:20px">
      <div>
        <h4 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin:0 0 6px 0">Vòng quay / Bốc thăm Học sinh ngẫu nhiên</h4>
        <p style="font-size:0.875rem;color:#64748b;margin:0">Chọn ngẫu nhiên học viên lên bảng, trả lời câu hỏi hoặc nhận quà khích lệ</p>
      </div>

      <div id="picker-result-box" style="width:100%;max-width:440px;height:160px;background:linear-gradient(135deg, #eef2ff, #f0fdf4);border:2px dashed #818cf8;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
        <div style="font-size:42px;margin-bottom:8px" id="picker-emoji">🎯</div>
        <div style="font-size:1.4rem;font-weight:800;color:#4338ca" id="picker-name">Sẵn sàng bốc thăm!</div>
        <div style="font-size:0.85rem;color:#64748b;margin-top:4px" id="picker-sub">Tổng cộng ${activeStudents.length} học viên trong danh sách</div>
      </div>

      <div style="display:flex;gap:12px;width:100%;max-width:440px">
        <button id="btn-spin-student" style="flex:1;padding:14px 24px;border-radius:14px;background:linear-gradient(135deg, #4f46e5, #4338ca);color:#fff;font-weight:700;font-size:1rem;border:none;box-shadow:0 8px 16px -4px rgba(79,70,229,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s">
          <span>🎲</span> Bốc thăm ngay!
        </button>
        <button id="btn-reset-picker" style="padding:14px 18px;border-radius:14px;background:#f1f5f9;color:#475569;font-weight:600;font-size:0.9rem;border:1px solid #cbd5e1;cursor:pointer">
          Đặt lại
        </button>
      </div>

      <div style="width:100%;max-width:520px;text-align:left;background:#f8fafc;padding:12px 16px;border-radius:12px;border:1px solid #e2e8f0;font-size:0.8rem;color:#64748b">
        <strong>💡 Mẹo lớp học:</strong> Bốc thăm ngẫu nhiên giúp tiết học hào hứng hơn, tạo cơ hội đồng đều cho mọi học viên tham gia phát biểu.
      </div>
    </div>
  `;
}

// 2. Timer Tab (Đồng hồ đếm giờ)
function renderTimerTab(): string {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const pct = Math.max(0, Math.min(100, Math.round((timerSeconds / timerInitial) * 100)));

  return `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:20px">
      <div>
        <h4 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin:0 0 6px 0">Đồng hồ đếm ngược tiết học (Classroom Timer)</h4>
        <p style="font-size:0.875rem;color:#64748b;margin:0">Canh giờ thảo luận nhóm, làm bài mini-quiz hoặc hoạt động khởi động</p>
      </div>

      <!-- Quick presets -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <button class="timer-preset-btn" data-time="60" style="padding:6px 14px;border-radius:9999px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:12px;font-weight:600;cursor:pointer">1 phút</button>
        <button class="timer-preset-btn" data-time="180" style="padding:6px 14px;border-radius:9999px;background:#eef2ff;border:1px solid #c7d2fe;color:#4f46e5;font-size:12px;font-weight:700;cursor:pointer">3 phút</button>
        <button class="timer-preset-btn" data-time="300" style="padding:6px 14px;border-radius:9999px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:12px;font-weight:600;cursor:pointer">5 phút</button>
        <button class="timer-preset-btn" data-time="600" style="padding:6px 14px;border-radius:9999px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:12px;font-weight:600;cursor:pointer">10 phút</button>
        <button class="timer-preset-btn" data-time="900" style="padding:6px 14px;border-radius:9999px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:12px;font-weight:600;cursor:pointer">15 phút</button>
      </div>

      <!-- Large Digital Clock Display -->
      <div style="width:100%;max-width:440px;background:#0f172a;border-radius:24px;padding:28px 20px;color:#fff;box-shadow:0 12px 28px -6px rgba(15,23,42,0.3);display:flex;flex-direction:column;align-items:center;position:relative;overflow:hidden">
        <div style="font-family:'Courier New', monospace;font-size:4rem;font-weight:900;letter-spacing:4px;color:#38bdf8" id="timer-display">
          ${timeStr}
        </div>
        <!-- Progress bar -->
        <div style="width:85%;height:8px;background:rgba(255,255,255,0.15);border-radius:9999px;margin-top:16px;overflow:hidden">
          <div id="timer-bar" style="width:${pct}%;height:100%;background:linear-gradient(90deg, #38bdf8, #818cf8);transition:width 0.5s ease"></div>
        </div>
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:12px;width:100%;max-width:440px">
        <button id="btn-timer-toggle" style="flex:1;padding:12px 24px;border-radius:14px;background:${isTimerRunning ? '#ef4444' : '#10b981'};color:#fff;font-weight:700;font-size:1rem;border:none;cursor:pointer;box-shadow:0 6px 14px -2px rgba(16,185,129,0.3);display:flex;align-items:center;justify-content:center;gap:8px">
          <span>${isTimerRunning ? '⏸️ Tạm dừng' : '▶️ Bắt đầu'}</span>
        </button>
        <button id="btn-timer-reset" style="padding:12px 20px;border-radius:14px;background:#f1f5f9;color:#475569;font-weight:600;border:1px solid #cbd5e1;cursor:pointer">
          🔄 Đặt lại
        </button>
      </div>
    </div>
  `;
}

// 3. Dice & Coin Tab
function renderDiceTab(): string {
  return `
    <div style="display:flex;flex-direction:column;gap:24px">
      <div style="text-align:center">
        <h4 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin:0 0 6px 0">Tung Xúc Xắc & Đồng Xu Ảo</h4>
        <p style="font-size:0.875rem;color:#64748b;margin:0">Công cụ quyết định lượt chơi, câu hỏi hoặc giải quyết tình huống công bằng</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- Dice Section -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:20px;display:flex;flex-direction:column;align-items:center;text-align:center">
          <span style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.05em">Tung Xúc Xắc (1 - 6)</span>
          <div id="dice-display" style="width:84px;height:84px;border-radius:18px;background:#fff;border:2px solid #cbd5e1;box-shadow:0 8px 16px -2px rgba(0,0,0,0.08);margin:20px 0;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:900;color:#4f46e5">
            ⚄
          </div>
          <div id="dice-value-text" style="font-size:1.1rem;font-weight:700;color:#0f172a;margin-bottom:14px">Số 5</div>
          <button id="btn-roll-dice" style="width:100%;padding:10px 16px;border-radius:10px;background:#4f46e5;color:#fff;font-weight:600;font-size:14px;border:none;cursor:pointer;box-shadow:0 4px 10px rgba(79,70,229,0.3)">
            🎲 Lắc xúc xắc
          </button>
        </div>

        <!-- Coin Section -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:20px;display:flex;flex-direction:column;align-items:center;text-align:center">
          <span style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.05em">Tung Đồng Xu (Sấp / Ngửa)</span>
          <div id="coin-display" style="width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg, #f59e0b, #d97706);box-shadow:0 8px 16px -2px rgba(245,158,11,0.3);margin:20px 0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;border:3px solid #fef3c7">
            NGỬA
          </div>
          <div id="coin-value-text" style="font-size:1.1rem;font-weight:700;color:#0f172a;margin-bottom:14px">Mặt Ngửa (Heads)</div>
          <button id="btn-flip-coin" style="width:100%;padding:10px 16px;border-radius:10px;background:#d97706;color:#fff;font-weight:600;font-size:14px;border:none;cursor:pointer;box-shadow:0 4px 10px rgba(217,119,6,0.3)">
            🪙 Tung đồng xu
          </button>
        </div>
      </div>
    </div>
  `;
}

// 4. Groups Tab
function renderGroupsTab(): string {
  return `
    <div style="display:flex;flex-direction:column;gap:18px">
      <div style="text-align:center">
        <h4 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin:0 0 6px 0">Chia nhóm học tập tự động (Auto Group Maker)</h4>
        <p style="font-size:0.875rem;color:#64748b;margin:0">Tự động phân bổ học sinh vào các nhóm đồng đều cho bài tập thảo luận</p>
      </div>

      <div style="display:flex;align-items:center;justify-content:center;gap:12px;background:#f8fafc;padding:12px;border-radius:14px;border:1px solid #e2e8f0">
        <span style="font-size:13px;font-weight:600;color:#475569">Số nhóm cần chia:</span>
        <select id="group-count-select" style="padding:6px 12px;border-radius:8px;border:1px solid #cbd5e1;font-weight:700;color:#4f46e5">
          <option value="2">2 Nhóm</option>
          <option value="3" selected>3 Nhóm</option>
          <option value="4">4 Nhóm</option>
          <option value="5">5 Nhóm</option>
        </select>
        <button id="btn-generate-groups" style="padding:8px 18px;border-radius:10px;background:#4f46e5;color:#fff;font-weight:600;font-size:13px;border:none;cursor:pointer">
          ⚡ Phân chia ngay
        </button>
      </div>

      <div id="groups-container" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-top:8px">
        ${renderSampleGroups(3)}
      </div>
    </div>
  `;
}

function renderSampleGroups(count: number): string {
  const students = [...studentData].filter(s => s.status === 'active');
  const groups: any[][] = Array.from({ length: count }, () => []);
  students.forEach((s, i) => {
    groups[i % count].push(s);
  });

  const colors = [
    { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca', badge: '#4f46e5' },
    { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', badge: '#10b981' },
    { bg: '#fffbeb', border: '#fde68a', text: '#92400e', badge: '#f59e0b' },
    { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', badge: '#ec4899' },
    { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', badge: '#0284c7' },
  ];

  return groups.map((grp, idx) => {
    const c = colors[idx % colors.length];
    return `
      <div style="background:${c.bg};border:1px solid ${c.border};border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:800;font-size:14px;color:${c.text}">Nhóm ${idx + 1}</span>
          <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:9999px;background:${c.badge};color:#fff">${grp.length} bạn</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">
          ${grp.map((s: any) => `
            <div style="font-size:12px;font-weight:500;color:#1e293b;background:#fff;padding:4px 8px;border-radius:6px;border:1px solid rgba(0,0,0,0.05);display:flex;align-items:center;gap:6px">
              <span style="width:6px;height:6px;border-radius:50%;background:${c.badge}"></span>
              <span>${s.full_name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// 5. QR Code Generator Tab
function renderQrTab(): string {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:20px">
      <div>
        <h4 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin:0 0 6px 0">Tạo mã QR & Phiếu học phí nhanh</h4>
        <p style="font-size:0.875rem;color:#64748b;margin:0">Chuyển link bài tập, tài liệu học hoặc tạo mã QR lớp học cho học sinh quét ngay</p>
      </div>

      <div style="width:100%;max-width:480px;display:flex;flex-direction:column;gap:12px;text-align:left">
        <div>
          <label style="font-size:12px;font-weight:600;color:#475569">Nội dung hoặc đường Link tài liệu:</label>
          <input type="text" id="qr-input-text" value="https://nttclass.com" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;font-size:14px;margin-top:4px" />
        </div>
        <button id="btn-generate-qr" style="padding:10px 16px;border-radius:10px;background:#4f46e5;color:#fff;font-weight:600;border:none;cursor:pointer">
          ⚡ Tạo mã QR
        </button>
      </div>

      <div style="width:180px;height:180px;background:#fff;border:2px solid #e2e8f0;border-radius:16px;padding:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.05)" id="qr-image-container">
        <!-- Stylized QR preview -->
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" fill="#ffffff"/>
          <!-- Position squares -->
          <rect x="10" y="10" width="24" height="24" fill="#0f172a"/>
          <rect x="14" y="14" width="16" height="16" fill="#ffffff"/>
          <rect x="18" y="18" width="8" height="8" fill="#4f46e5"/>
          <rect x="66" y="10" width="24" height="24" fill="#0f172a"/>
          <rect x="70" y="14" width="16" height="16" fill="#ffffff"/>
          <rect x="74" y="18" width="8" height="8" fill="#4f46e5"/>
          <rect x="10" y="66" width="24" height="24" fill="#0f172a"/>
          <rect x="14" y="70" width="16" height="16" fill="#ffffff"/>
          <rect x="18" y="74" width="8" height="8" fill="#4f46e5"/>
          <!-- Random blocks -->
          <rect x="42" y="15" width="8" height="8" fill="#0f172a"/>
          <rect x="45" y="35" width="14" height="6" fill="#4f46e5"/>
          <rect x="25" y="45" width="10" height="10" fill="#0f172a"/>
          <rect x="50" y="55" width="8" height="14" fill="#0f172a"/>
          <rect x="70" y="45" width="12" height="12" fill="#4f46e5"/>
          <rect x="40" y="75" width="18" height="8" fill="#0f172a"/>
          <rect x="75" y="75" width="10" height="10" fill="#4f46e5"/>
        </svg>
      </div>

      <span style="font-size:12px;color:#64748b">Học viên quét mã trực tiếp trên điện thoại để mở link tài liệu</span>
    </div>
  `;
}

// === Event Listeners & Interactive Handlers ===
export function initNttToolsModal(): void {
  const modalContainer = document.getElementById('ntt-tools-modal-container');
  const closeBtn = document.getElementById('close-ntt-tools');
  const backdrop = document.getElementById('ntt-tools-backdrop');

  const closeModal = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      isTimerRunning = false;
    }
    if (modalContainer) modalContainer.innerHTML = '';
  };

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Tab switching
  document.querySelectorAll('.ntt-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = (btn.getAttribute('data-tab') as any) || 'picker';
      if (modalContainer) {
        modalContainer.innerHTML = renderNttToolsModal();
        initNttToolsModal();
      }
    });
  });

  // 1. Picker Handlers
  const spinBtn = document.getElementById('btn-spin-student');
  const resetPickerBtn = document.getElementById('btn-reset-picker');
  const nameEl = document.getElementById('picker-name');
  const subEl = document.getElementById('picker-sub');
  const emojiEl = document.getElementById('picker-emoji');

  spinBtn?.addEventListener('click', () => {
    const activeStudents = studentData.filter(s => s.status === 'active');
    if (!activeStudents.length) return;

    let counter = 0;
    const emojis = ['🌟', '✨', '🎉', '🏆', '🎯', '🚀', '🔥'];
    spinBtn.setAttribute('disabled', 'true');

    const interval = setInterval(() => {
      const rand = activeStudents[Math.floor(Math.random() * activeStudents.length)];
      if (nameEl) nameEl.textContent = rand.full_name;
      if (subEl) subEl.textContent = `Mã HV: ${rand.student_code} · Cơ sở ${rand.campus}`;
      if (emojiEl) emojiEl.textContent = emojis[counter % emojis.length];
      counter++;

      if (counter > 16) {
        clearInterval(interval);
        spinBtn.removeAttribute('disabled');
        const winner = activeStudents[Math.floor(Math.random() * activeStudents.length)];
        if (nameEl) nameEl.textContent = `🎉 ${winner.full_name}`;
        if (subEl) subEl.textContent = `Chúc mừng ${winner.full_name} (${winner.student_code})!`;
        if (emojiEl) emojiEl.textContent = '👑';
        showToast(`Chúc mừng ${winner.full_name} được chọn!`, 'success');
      }
    }, 80);
  });

  resetPickerBtn?.addEventListener('click', () => {
    if (nameEl) nameEl.textContent = 'Sẵn sàng bốc thăm!';
    if (subEl) subEl.textContent = `Tổng cộng ${studentData.filter(s => s.status === 'active').length} học viên trong danh sách`;
    if (emojiEl) emojiEl.textContent = '🎯';
  });

  // 2. Timer Handlers
  const timerToggleBtn = document.getElementById('btn-timer-toggle');
  const timerResetBtn = document.getElementById('btn-timer-reset');
  const timerDisplay = document.getElementById('timer-display');
  const timerBar = document.getElementById('timer-bar');

  const updateTimerDisplay = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    if (timerDisplay) {
      timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const pct = Math.max(0, Math.min(100, Math.round((timerSeconds / timerInitial) * 100)));
    if (timerBar) {
      timerBar.style.width = `${pct}%`;
    }
  };

  timerToggleBtn?.addEventListener('click', () => {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      timerInterval = null;
      isTimerRunning = false;
      timerToggleBtn.innerHTML = '<span>▶️ Tiếp tục</span>';
      timerToggleBtn.style.background = '#10b981';
    } else {
      isTimerRunning = true;
      timerToggleBtn.innerHTML = '<span>⏸️ Tạm dừng</span>';
      timerToggleBtn.style.background = '#ef4444';
      timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
          timerSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          timerInterval = null;
          isTimerRunning = false;
          timerToggleBtn.innerHTML = '<span>▶️ Bắt đầu</span>';
          timerToggleBtn.style.background = '#10b981';
          showToast('⏰ Hết giờ làm bài!', 'warning');
        }
      }, 1000);
    }
  });

  timerResetBtn?.addEventListener('click', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      isTimerRunning = false;
    }
    timerSeconds = timerInitial;
    updateTimerDisplay();
    if (timerToggleBtn) {
      timerToggleBtn.innerHTML = '<span>▶️ Bắt đầu</span>';
      timerToggleBtn.style.background = '#10b981';
    }
  });

  document.querySelectorAll('.timer-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-time') || '180', 10);
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
      }
      timerInitial = val;
      timerSeconds = val;
      updateTimerDisplay();
      if (timerToggleBtn) {
        timerToggleBtn.innerHTML = '<span>▶️ Bắt đầu</span>';
        timerToggleBtn.style.background = '#10b981';
      }
    });
  });

  // 3. Dice & Coin Handlers
  const rollDiceBtn = document.getElementById('btn-roll-dice');
  const diceDisplay = document.getElementById('dice-display');
  const diceText = document.getElementById('dice-value-text');
  const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  rollDiceBtn?.addEventListener('click', () => {
    let rollCount = 0;
    const interval = setInterval(() => {
      const randVal = Math.floor(Math.random() * 6);
      if (diceDisplay) diceDisplay.textContent = diceIcons[randVal];
      rollCount++;
      if (rollCount > 8) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6);
        if (diceDisplay) diceDisplay.textContent = diceIcons[finalVal];
        if (diceText) diceText.textContent = `Số ${finalVal + 1}`;
        showToast(`Kết quả xúc xắc: Số ${finalVal + 1}`, 'info');
      }
    }, 60);
  });

  const flipCoinBtn = document.getElementById('btn-flip-coin');
  const coinDisplay = document.getElementById('coin-display');
  const coinText = document.getElementById('coin-value-text');

  flipCoinBtn?.addEventListener('click', () => {
    let flipCount = 0;
    const interval = setInterval(() => {
      const isHeads = flipCount % 2 === 0;
      if (coinDisplay) {
        coinDisplay.textContent = isHeads ? 'NGỬA' : 'SẤP';
        coinDisplay.style.background = isHeads
          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      }
      flipCount++;
      if (flipCount > 8) {
        clearInterval(interval);
        const finalHeads = Math.random() >= 0.5;
        if (coinDisplay) {
          coinDisplay.textContent = finalHeads ? 'NGỬA' : 'SẤP';
          coinDisplay.style.background = finalHeads
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
        }
        if (coinText) coinText.textContent = finalHeads ? 'Mặt Ngửa (Heads)' : 'Mặt Sấp (Tails)';
        showToast(`Kết quả đồng xu: ${finalHeads ? 'Mặt Ngửa' : 'Mặt Sấp'}`, 'info');
      }
    }, 70);
  });

  // 4. Group Handlers
  const groupSelect = document.getElementById('group-count-select') as HTMLSelectElement | null;
  const genGroupBtn = document.getElementById('btn-generate-groups');
  const groupsContainer = document.getElementById('groups-container');

  genGroupBtn?.addEventListener('click', () => {
    const count = parseInt(groupSelect?.value || '3', 10);
    if (groupsContainer) {
      groupsContainer.innerHTML = renderSampleGroups(count);
      showToast(`Đã chia đều học sinh thành ${count} nhóm!`, 'success');
    }
  });

  // 5. QR Handlers
  const genQrBtn = document.getElementById('btn-generate-qr');
  const qrInput = document.getElementById('qr-input-text') as HTMLInputElement | null;

  genQrBtn?.addEventListener('click', () => {
    const txt = qrInput?.value.trim() || 'NTTClass';
    showToast(`Đã cập nhật mã QR cho "${txt}"`, 'success');
  });
}
