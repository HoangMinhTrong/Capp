// ============================================
// EduTrack - Audit Log Page (Nhật ký Hoạt động Hệ thống)
// Warm Minimalist Design System
// ============================================

import { auditLogData } from '../data.ts';
import { icons, formatDateTime, formatTimeAgo, showToast } from '../utils.ts';

// Badge configurations for actions
const actionBadgeStyles: Record<string, { bg: string; border: string; color: string; dot: string; label: string }> = {
  CREATE: { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', dot: '#10B981', label: 'Tạo mới' },
  UPDATE: { bg: '#F0F9FF', border: '#BAE6FD', color: '#0284C7', dot: '#0284C7', label: 'Cập nhật' },
  ESCALATE: { bg: '#FEF3C7', border: '#FDE68A', color: '#D97706', dot: '#F59E0B', label: 'Chuyển cấp' },
  DELETE: { bg: '#FDF0EE', border: '#FBCBC7', color: '#A93226', dot: '#EF4444', label: 'Xóa' },
};

// Badge configurations for user roles
const roleBadgeStyles: Record<string, { bg: string; border: string; color: string; label: string }> = {
  admin: { bg: '#FFF8D9', border: '#F9E9A8', color: '#854D0E', label: 'Quản trị viên' },
  teacher: { bg: '#F0F9FF', border: '#BAE6FD', color: '#0284C7', label: 'Giảng viên' },
  teaching_assistant: { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', label: 'Trợ giảng' },
  student: { bg: '#FAF5FF', border: '#E9D5FF', color: '#7C3AED', label: 'Học viên' },
};

// Vietnamese friendly labels for entity types
const entityTypeLabels: Record<string, { label: string; icon: string }> = {
  AssessmentResult: { label: 'Điểm kiểm tra', icon: '📝' },
  Attendance: { label: 'Điểm danh', icon: '📅' },
  SupportTicket: { label: 'Ticket hỗ trợ', icon: '🎫' },
  ClassAssignment: { label: 'Phân công lớp', icon: '👥' },
  InterventionRecord: { label: 'Can thiệp học vụ', icon: '⚠️' },
  ClassConfig: { label: 'Cấu hình lớp', icon: '⚙️' },
  CourseLesson: { label: 'Bài giảng khóa học', icon: '📖' },
  Staff: { label: 'Hồ sơ nhân sự', icon: '👤' },
};

// Internal filter state
let currentSearchQuery = '';
let currentActionFilter = 'all';
let currentEntityFilter = 'all';

export function renderAuditLogPage(): string {
  // KPI counts
  const totalCount = auditLogData.length;
  const createCount = auditLogData.filter(l => l.action === 'CREATE').length;
  const updateCount = auditLogData.filter(l => l.action === 'UPDATE').length;
  const escalateCount = auditLogData.filter(l => l.action === 'ESCALATE').length;

  return `
    <div class="audit-log-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
            Nhật ký Hoạt động Hệ thống
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            EduTrack English · truy vết đầy đủ các thay đổi dữ liệu, nhập điểm, điểm danh và phân quyền
          </div>
        </div>

        <!-- Export CSV Button -->
        <button 
          id="btn-export-audit" 
          type="button" 
          style="display:inline-flex;align-items:center;gap:8px;background:#FFFFFF;border:1px solid #EAE4D8;color:#2D2824;border-radius:12px;padding:10px 18px;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 1px 4px rgba(45,40,36,0.04);transition:all 0.15s ease"
          onmouseover="this.style.background='#FDFBF7';this.style.borderColor='#A93226';this.style.color='#A93226'"
          onmouseout="this.style.background='#FFFFFF';this.style.borderColor='#EAE4D8';this.style.color='#2D2824'"
        >
          ${icons.download}
          <span>Xuất nhật ký CSV</span>
        </button>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento Thống kê (Warm theme) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        
        <!-- Thẻ 1: Tổng số bản ghi -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#2D2824;line-height:1;margin-bottom:8px">
            ${totalCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Tổng số hoạt động
          </div>
          <div style="font-size:11px;color:#A8A29A;margin-top:4px">
            Ghi nhận toàn thời gian
          </div>
        </div>

        <!-- Thẻ 2: Tạo mới (CREATE) -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#059669;line-height:1;margin-bottom:8px">
            ${createCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Thao tác tạo mới
          </div>
          <div style="font-size:11px;color:#059669;margin-top:4px;font-weight:600">
            Điểm, nhân sự &amp; can thiệp
          </div>
        </div>

        <!-- Thẻ 3: Cập nhật (UPDATE) -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#0284C7;line-height:1;margin-bottom:8px">
            ${updateCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Thao tác cập nhật
          </div>
          <div style="font-size:11px;color:#0284C7;margin-top:4px;font-weight:600">
            Điểm danh, sửa điểm, phân công
          </div>
        </div>

        <!-- Thẻ 4: Chuyển cấp (ESCALATE) -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${escalateCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Chuyển cấp &amp; Khiếu nại
          </div>
          <div style="font-size:11px;color:#D97706;margin-top:4px;font-weight:600">
            Theo quy trình leo thang SLA
          </div>
        </div>

      </div>

      <!-- 3. Bộ lọc và tìm kiếm chuẩn Bento Warm Minimalist -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;margin-bottom:24px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          
          <!-- Ô tìm kiếm với icon kính lúp -->
          <div style="position:relative;flex:1;min-width:260px">
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#A8A29A;display:flex;align-items:center;pointer-events:none">
              ${icons.search}
            </span>
            <input 
              type="text" 
              id="audit-search" 
              placeholder="Tìm theo người thực hiện, nội dung thay đổi, mã ID... ( / )" 
              value="${currentSearchQuery}"
              style="width:100%;height:42px;padding:0 14px 0 42px;border:1px solid #EAE4D8;border-radius:12px;background:#FAF7F2;font-size:13.5px;color:#2D2824;outline:none;transition:all 0.15s ease"
              onfocus="this.style.background='#FFFFFF';this.style.borderColor='#A93226'"
              onblur="this.style.background='#FAF7F2';this.style.borderColor='#EAE4D8'"
            />
          </div>

          <!-- Dropdown lọc Hành động -->
          <div style="min-width:180px">
            <select 
              id="audit-action-filter" 
              style="width:100%;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FAF7F2;font-size:13px;color:#2D2824;outline:none;cursor:pointer"
            >
              <option value="all" ${currentActionFilter === 'all' ? 'selected' : ''}>Tất cả hành động</option>
              <option value="CREATE" ${currentActionFilter === 'CREATE' ? 'selected' : ''}>Tạo mới (CREATE)</option>
              <option value="UPDATE" ${currentActionFilter === 'UPDATE' ? 'selected' : ''}>Cập nhật (UPDATE)</option>
              <option value="ESCALATE" ${currentActionFilter === 'ESCALATE' ? 'selected' : ''}>Chuyển cấp (ESCALATE)</option>
              <option value="DELETE" ${currentActionFilter === 'DELETE' ? 'selected' : ''}>Xóa (DELETE)</option>
            </select>
          </div>

          <!-- Dropdown lọc Đối tượng -->
          <div style="min-width:200px">
            <select 
              id="audit-entity-filter" 
              style="width:100%;height:42px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FAF7F2;font-size:13px;color:#2D2824;outline:none;cursor:pointer"
            >
              <option value="all" ${currentEntityFilter === 'all' ? 'selected' : ''}>Tất cả đối tượng</option>
              <option value="AssessmentResult" ${currentEntityFilter === 'AssessmentResult' ? 'selected' : ''}>Điểm kiểm tra (AssessmentResult)</option>
              <option value="Attendance" ${currentEntityFilter === 'Attendance' ? 'selected' : ''}>Điểm danh (Attendance)</option>
              <option value="SupportTicket" ${currentEntityFilter === 'SupportTicket' ? 'selected' : ''}>Ticket hỗ trợ (SupportTicket)</option>
              <option value="ClassAssignment" ${currentEntityFilter === 'ClassAssignment' ? 'selected' : ''}>Phân công lớp (ClassAssignment)</option>
              <option value="InterventionRecord" ${currentEntityFilter === 'InterventionRecord' ? 'selected' : ''}>Can thiệp học vụ (InterventionRecord)</option>
              <option value="ClassConfig" ${currentEntityFilter === 'ClassConfig' ? 'selected' : ''}>Cấu hình lớp (ClassConfig)</option>
              <option value="CourseLesson" ${currentEntityFilter === 'CourseLesson' ? 'selected' : ''}>Bài giảng khóa học (CourseLesson)</option>
              <option value="Staff" ${currentEntityFilter === 'Staff' ? 'selected' : ''}>Hồ sơ nhân sự (Staff)</option>
            </select>
          </div>

          <!-- Nút đặt lại bộ lọc -->
          <button 
            id="btn-reset-audit-filter" 
            type="button" 
            style="height:42px;padding:0 14px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px;font-size:13px;font-weight:600;color:#7F7A72;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s ease"
            title="Đặt lại tất cả bộ lọc"
          >
            <span>↻</span>
            <span>Đặt lại</span>
          </button>

        </div>

        <!-- Hàng chip lọc nhanh hành động -->
        <div style="display:flex;align-items:center;gap:8px;margin-top:14px;padding-top:14px;border-top:1px dashed #F2ECE1;flex-wrap:wrap">
          <span style="font-size:11.5px;font-weight:700;color:#7F7A72">Lọc nhanh hành động:</span>
          
          <button 
            type="button" 
            class="audit-chip-btn ${currentActionFilter === 'all' ? 'active' : ''}" 
            data-action="all"
            style="border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s ease;${currentActionFilter === 'all' ? 'background:#2D2824;color:#FFFFFF;border:1px solid #2D2824;' : 'background:#FAF7F2;color:#7F7A72;border:1px solid #EAE4D8;'}"
          >
            Tất cả (${totalCount})
          </button>
          
          <button 
            type="button" 
            class="audit-chip-btn ${currentActionFilter === 'CREATE' ? 'active' : ''}" 
            data-action="CREATE"
            style="border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s ease;${currentActionFilter === 'CREATE' ? 'background:#ECFDF5;color:#059669;border:1.5px solid #059669;' : 'background:#FAF7F2;color:#7F7A72;border:1px solid #EAE4D8;'}"
          >
            ● Tạo mới (${createCount})
          </button>
          
          <button 
            type="button" 
            class="audit-chip-btn ${currentActionFilter === 'UPDATE' ? 'active' : ''}" 
            data-action="UPDATE"
            style="border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s ease;${currentActionFilter === 'UPDATE' ? 'background:#F0F9FF;color:#0284C7;border:1.5px solid #0284C7;' : 'background:#FAF7F2;color:#7F7A72;border:1px solid #EAE4D8;'}"
          >
            ● Cập nhật (${updateCount})
          </button>
          
          <button 
            type="button" 
            class="audit-chip-btn ${currentActionFilter === 'ESCALATE' ? 'active' : ''}" 
            data-action="ESCALATE"
            style="border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s ease;${currentActionFilter === 'ESCALATE' ? 'background:#FEF3C7;color:#D97706;border:1.5px solid #D97706;' : 'background:#FAF7F2;color:#7F7A72;border:1px solid #EAE4D8;'}"
          >
            ● Chuyển cấp (${escalateCount})
          </button>
        </div>
      </div>

      <!-- 4. Thẻ Bảng Nhật ký Hoạt động (Bo góc lớn, viền be, nền trắng) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        
        <!-- Header của Thẻ Bảng -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 4px 0">
              Lịch sử thay đổi gần đây
            </h2>
            <div style="font-size:12.5px;color:#7F7A72">
              Thời gian thực, tự động gắn nhãn người dùng &amp; phân quyền RBAC
            </div>
          </div>
          <span 
            id="audit-count" 
            style="background:#FAF7F2;border:1px solid #EAE4D8;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;color:#7F7A72"
          >
            ${auditLogData.length} bản ghi
          </span>
        </div>

        <!-- Bảng Dữ liệu -->
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em">
                <th style="padding:12px 14px">THỜI GIAN</th>
                <th style="padding:12px 14px">NGƯỜI THỰC HIỆN</th>
                <th style="padding:12px 14px">VAI TRÒ</th>
                <th style="padding:12px 14px">HÀNH ĐỘNG</th>
                <th style="padding:12px 14px">ĐỐI TƯỢNG</th>
                <th style="padding:12px 14px">CHI TIẾT THAY ĐỔI</th>
              </tr>
            </thead>
            <tbody id="audit-tbody">
              ${renderAuditRows(auditLogData)}
            </tbody>
          </table>
        </div>

        <!-- Chân thẻ thông tin -->
        <div id="audit-footer-info" style="margin-top:18px;font-size:12.5px;color:#7F7A72;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #F5EFEB;padding-top:14px">
          <div>Hiển thị các thao tác mới nhất được ghi nhận trên toàn bộ cơ sở CS1 &amp; CS2.</div>
          <div style="font-size:11.5px;color:#A8A29A">Chuẩn bảo mật ISO/IEC 27001 &amp; Audit Trail</div>
        </div>

      </div>

    </div>
  `;
}

export function renderAuditRows(logs: typeof auditLogData): string {
  if (logs.length === 0) {
    return `
      <tr>
        <td colspan="6" style="text-align:center;padding:48px 16px;color:#7F7A72;background:#FAF7F2;border-radius:14px">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          <div style="font-weight:700;font-size:14px;color:#2D2824;margin-bottom:4px">Không tìm thấy bản ghi nhật ký phù hợp</div>
          <div style="font-size:12.5px;color:#A8A29A">Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bớt điều kiện lọc.</div>
        </td>
      </tr>
    `;
  }

  return logs.map(log => {
    const actStyle = actionBadgeStyles[log.action] || {
      bg: '#F5F5F5',
      border: '#E5E5E5',
      color: '#525252',
      dot: '#A3A3A3',
      label: log.action,
    };

    const roleStyle = roleBadgeStyles[log.user_role] || {
      bg: '#FAF7F2',
      border: '#EAE4D8',
      color: '#7F7A72',
      label: log.user_role,
    };

    const entityInfo = entityTypeLabels[log.entity_type] || {
      label: log.entity_type,
      icon: '📁',
    };

    const userInitials = log.user_name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(-2)
      .toUpperCase();

    return `
      <tr 
        style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" 
        onmouseover="this.style.background='#FAF7F2'" 
        onmouseout="this.style.background='transparent'"
      >
        <!-- 1. Thời gian -->
        <td style="padding:14px;white-space:nowrap;vertical-align:middle">
          <div style="font-weight:700;color:#2D2824;font-size:12.5px">
            ${formatDateTime(log.timestamp)}
          </div>
          <div style="font-size:11px;color:#A8A29A;margin-top:2px">
            ${formatTimeAgo(log.timestamp)}
          </div>
        </td>

        <!-- 2. Người thực hiện -->
        <td style="padding:14px;vertical-align:middle">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:50%;background:#F5E6E4;border:1px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:700;color:#A93226;font-size:11.5px;flex-shrink:0">
              ${userInitials}
            </div>
            <div>
              <div style="font-weight:700;color:#2D2824;font-size:13px">
                ${log.user_name}
              </div>
              <div style="font-size:11px;color:#A8A29A;font-family:monospace;margin-top:1px">
                ${log.user_id}
              </div>
            </div>
          </div>
        </td>

        <!-- 3. Vai trò -->
        <td style="padding:14px;vertical-align:middle">
          <span style="display:inline-block;padding:3px 9px;border-radius:99px;font-size:11.5px;font-weight:700;background:${roleStyle.bg};border:1px solid ${roleStyle.border};color:${roleStyle.color}">
            ${roleStyle.label}
          </span>
        </td>

        <!-- 4. Hành động -->
        <td style="padding:14px;vertical-align:middle">
          <span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;font-size:11.5px;font-weight:700;background:${actStyle.bg};border:1px solid ${actStyle.border};color:${actStyle.color}">
            <span style="width:6px;height:6px;border-radius:50%;background:${actStyle.dot}"></span>
            <span>${actStyle.label}</span>
          </span>
        </td>

        <!-- 5. Đối tượng -->
        <td style="padding:14px;vertical-align:middle">
          <div style="display:flex;align-items:center;gap:6px;font-weight:600;color:#2D2824;font-size:12.5px">
            <span>${entityInfo.icon}</span>
            <span>${entityInfo.label}</span>
          </div>
          <div style="font-size:11px;color:#A8A29A;font-family:monospace;margin-top:2px">
            ${log.entity_id}
          </div>
        </td>

        <!-- 6. Chi tiết thay đổi -->
        <td style="padding:14px;vertical-align:middle;color:#2D2824;font-size:13px;line-height:1.45;max-width:380px">
          ${log.changes}
        </td>
      </tr>
    `;
  }).join('');
}

export function initAuditLogPage(): void {
  const searchInput = document.getElementById('audit-search') as HTMLInputElement | null;
  const actionFilter = document.getElementById('audit-action-filter') as HTMLSelectElement | null;
  const entityFilter = document.getElementById('audit-entity-filter') as HTMLSelectElement | null;
  const tbody = document.getElementById('audit-tbody');
  const countEl = document.getElementById('audit-count');
  const resetBtn = document.getElementById('btn-reset-audit-filter');

  function getFilteredLogs() {
    const q = currentSearchQuery.trim().toLowerCase();
    let filtered = [...auditLogData];

    if (currentActionFilter !== 'all') {
      filtered = filtered.filter(l => l.action === currentActionFilter);
    }

    if (currentEntityFilter !== 'all') {
      filtered = filtered.filter(l => l.entity_type === currentEntityFilter);
    }

    if (q) {
      filtered = filtered.filter(l =>
        l.user_name.toLowerCase().includes(q) ||
        l.user_id.toLowerCase().includes(q) ||
        l.changes.toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q) ||
        l.entity_id.toLowerCase().includes(q) ||
        (entityTypeLabels[l.entity_type]?.label || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  function updateView() {
    const filtered = getFilteredLogs();
    if (tbody) tbody.innerHTML = renderAuditRows(filtered);
    if (countEl) countEl.textContent = `${filtered.length} bản ghi`;

    // Update active class on chips
    document.querySelectorAll<HTMLButtonElement>('.audit-chip-btn').forEach(btn => {
      const act = btn.dataset.action;
      const isActive = act === currentActionFilter;
      btn.classList.toggle('active', isActive);
      if (isActive) {
        if (act === 'all') {
          btn.style.background = '#2D2824';
          btn.style.color = '#FFFFFF';
          btn.style.borderColor = '#2D2824';
        } else if (act === 'CREATE') {
          btn.style.background = '#ECFDF5';
          btn.style.color = '#059669';
          btn.style.borderColor = '#059669';
        } else if (act === 'UPDATE') {
          btn.style.background = '#F0F9FF';
          btn.style.color = '#0284C7';
          btn.style.borderColor = '#0284C7';
        } else if (act === 'ESCALATE') {
          btn.style.background = '#FEF3C7';
          btn.style.color = '#D97706';
          btn.style.borderColor = '#D97706';
        }
      } else {
        btn.style.background = '#FAF7F2';
        btn.style.color = '#7F7A72';
        btn.style.borderColor = '#EAE4D8';
      }
    });

    if (actionFilter) actionFilter.value = currentActionFilter;
    if (entityFilter) entityFilter.value = currentEntityFilter;
  }

  // 1. Search input event
  searchInput?.addEventListener('input', () => {
    currentSearchQuery = searchInput.value;
    updateView();
  });

  // 2. Action filter change
  actionFilter?.addEventListener('change', () => {
    currentActionFilter = actionFilter.value;
    updateView();
  });

  // 3. Entity filter change
  entityFilter?.addEventListener('change', () => {
    currentEntityFilter = entityFilter.value;
    updateView();
  });

  // 4. Quick action chips click
  document.querySelectorAll<HTMLButtonElement>('.audit-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.action;
      if (act) {
        currentActionFilter = act;
        updateView();
      }
    });
  });

  // 5. Reset button click
  resetBtn?.addEventListener('click', () => {
    currentSearchQuery = '';
    currentActionFilter = 'all';
    currentEntityFilter = 'all';
    if (searchInput) searchInput.value = '';
    updateView();
    showToast('Đã đặt lại bộ lọc nhật ký', 'info');
  });

  // 6. Keyboard shortcut '/' to focus search input
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput?.focus();
    }
  };
  window.addEventListener('keydown', handleKeydown);

  // 7. Export CSV
  document.getElementById('btn-export-audit')?.addEventListener('click', () => {
    const dataToExport = getFilteredLogs();
    let csv = 'Mã Log,Thời gian,Người thực hiện,Mã nhân sự,Vai trò,Hành động,Phân loại đối tượng,Tên đối tượng,Mã đối tượng,Chi tiết thay đổi\n';
    dataToExport.forEach(l => {
      const entityLabel = entityTypeLabels[l.entity_type]?.label || l.entity_type;
      csv += `"${l.log_id}","${l.timestamp}","${l.user_name}","${l.user_id}","${l.user_role}","${l.action}","${l.entity_type}","${entityLabel}","${l.entity_id}","${l.changes.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NhatKy_HeThong_EduTrack_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất ${dataToExport.length} bản ghi nhật ký hệ thống ra file CSV!`, 'success');
  });
}
