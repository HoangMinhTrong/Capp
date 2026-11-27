// ============================================
// EduTrack - Quản lý Giáo viên (Screen 1: /teachers)
// Warm Minimalist Design System
// ============================================

import { staffData, classAssignmentData, classData, teacherInviteData } from '../data.ts';
import { fetchTeachersApi, inviteTeacherApi, deleteTeacherInviteApi } from '../api.ts';
import { showToast, icons } from '../utils.ts';
import type { TeacherInvite } from '../types.ts';

interface TeacherDisplayItem {
  staff_id: string;
  full_name: string;
  email: string;
  avatar_initials: string;
  open_classes_count: number;
  total_students_count: number;
}

let searchQuery = '';
let sortAscending = true; // true = A-Z (▲), false = Z-A (▼)
let localTeachers: TeacherDisplayItem[] = [];
let localInvites: TeacherInvite[] = [];

// Initialize or refresh data
async function loadTeachersData() {
  const apiData = await fetchTeachersApi();
  if (apiData && apiData.teachers && apiData.teachers.length > 0) {
    localTeachers = apiData.teachers.map((t: any) => ({
      staff_id: t.staff_id,
      full_name: t.full_name,
      email: t.email,
      avatar_initials: t.avatar_initials || t.full_name.split(' ').map((n: string) => n[0]).join('').slice(-2).toUpperCase(),
      open_classes_count: t.open_classes_count ?? 0,
      total_students_count: t.total_students_count ?? 0,
    }));
    localInvites = apiData.invites || [];
  } else {
    // Fallback to local data
    const teachers = staffData.filter(s => s.role === 'teacher' && s.is_active);
    localTeachers = teachers.map(t => {
      const assignedClassIds = classAssignmentData
        .filter(ca => ca.teacher_id === t.staff_id)
        .map(ca => ca.class_id);
      const openClasses = classData.filter(c => assignedClassIds.includes(c.class_id) && c.status === 'in_progress');
      const totalStudents = openClasses.reduce((sum, c) => sum + (c.current_students || 0), 0);
      return {
        staff_id: t.staff_id,
        full_name: t.full_name,
        email: t.email,
        avatar_initials: t.avatar_initials,
        open_classes_count: openClasses.length,
        total_students_count: totalStudents,
      };
    });
    localInvites = [...teacherInviteData];
  }
}

export function renderTeachersPage(): string {
  // Compute initial local teachers if not loaded
  if (localTeachers.length === 0) {
    const teachers = staffData.filter(s => s.role === 'teacher' && s.is_active);
    localTeachers = teachers.map(t => {
      const assignedClassIds = classAssignmentData
        .filter(ca => ca.teacher_id === t.staff_id)
        .map(ca => ca.class_id);
      const openClasses = classData.filter(c => assignedClassIds.includes(c.class_id) && c.status === 'in_progress');
      const totalStudents = openClasses.reduce((sum, c) => sum + (c.current_students || 0), 0);
      return {
        staff_id: t.staff_id,
        full_name: t.full_name,
        email: t.email,
        avatar_initials: t.avatar_initials,
        open_classes_count: openClasses.length,
        total_students_count: totalStudents,
      };
    });
  }
  if (localInvites.length === 0) {
    localInvites = [...teacherInviteData];
  }

  return `
    <div class="teachers-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- Page Header -->
      <div style="margin-bottom:28px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">Giáo viên</h1>
        <div style="font-size:14px;color:#7F7A72;font-weight:500">
          EduTrack Center · quản lý đội ngũ giảng dạy
        </div>
      </div>

      <!-- 2-Column Layout: Left ~68%, Right ~32% -->
      <div class="teachers-grid" style="display:grid;grid-template-columns:minmax(0, 2.1fr) minmax(0, 1fr);gap:24px;align-items:start">
        
        <!-- Left Column: Teachers List -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 2px 12px rgba(80, 60, 40, 0.03)">
          
          <!-- Section Title & Invite Action -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h2 id="teachers-count-heading" style="font-size:18px;font-weight:700;color:#2D2824;margin:0">
              Giáo viên (${localTeachers.length})
            </h2>
            <button id="btn-open-invite-modal" type="button" style="display:inline-flex;align-items:center;gap:8px;background:#A93226;color:#ffffff;border:none;border-radius:12px;padding:10px 18px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(169, 50, 38, 0.25);transition:all 0.18s ease">
              <span>+ Mời giáo viên</span>
            </button>
          </div>

          <!-- Search Bar with Shortcut / -->
          <div style="position:relative;margin-bottom:20px">
            <input 
              id="teacher-search-input" 
              type="text" 
              placeholder="Tìm theo tên hoặc email... ( / )" 
              value="${searchQuery}"
              style="width:100%;height:44px;padding:0 16px 0 42px;border:1px solid #EAE4D8;border-radius:14px;background:#FDFBF7;font-size:14px;color:#2D2824;outline:none;transition:all 0.15s ease"
            />
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#A8A29A;display:flex;align-items:center;pointer-events:none">
              ${icons.search}
            </span>
          </div>

          <!-- Teachers Table -->
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;text-align:left">
              <thead>
                <tr style="border-bottom:1px solid #EAE4D8">
                  <th id="th-sort-teacher" style="padding:12px 16px;font-size:13px;font-weight:700;color:#2D2824;cursor:pointer;user-select:none;width:58%">
                    <span style="display:inline-flex;align-items:center;gap:4px">
                      Giáo viên <span id="sort-arrow" style="font-size:11px;color:#A93226">${sortAscending ? '▲' : '▼'}</span>
                    </span>
                  </th>
                  <th style="padding:12px 16px;font-size:13px;font-weight:700;color:#2D2824;text-align:center;width:21%">
                    Lớp đang mở
                  </th>
                  <th style="padding:12px 16px;font-size:13px;font-weight:700;color:#2D2824;text-align:center;width:21%">
                    Học viên
                  </th>
                </tr>
              </thead>
              <tbody id="teachers-table-body">
                <!-- Rows injected dynamically -->
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div id="teachers-pagination-label" style="margin-top:20px;font-size:13px;color:#7F7A72;font-weight:500">
            Đang xem 1–${localTeachers.length} trong ${localTeachers.length} giáo viên
          </div>

        </div>

        <!-- Right Column: Pending Invites Card -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px;box-shadow:0 2px 12px rgba(80, 60, 40, 0.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
            <h2 style="font-size:17px;font-weight:700;color:#2D2824;margin:0">
              Lời mời đang chờ
            </h2>
            <span id="pending-invites-badge" style="background:#F5E6E4;color:#A93226;font-size:12px;font-weight:700;padding:2px 8px;border-radius:10px">
              ${localInvites.length}
            </span>
          </div>

          <div id="pending-invites-list" style="display:flex;flex-direction:column;gap:14px">
            <!-- Invite items rendered dynamically -->
          </div>
        </div>

      </div>

      <!-- Modal: Mời giáo viên mới -->
      <div id="modal-invite-teacher" style="display:none;position:fixed;inset:0;background:rgba(30, 24, 20, 0.5);backdrop-filter:blur(3px);z-index:9999;align-items:center;justify-content:center;padding:16px">
        <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:440px;box-shadow:0 20px 40px rgba(0,0,0,0.15);overflow:hidden;animation:fadeInScale 0.2s ease-out">
          
          <div style="padding:22px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between">
            <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0">Mời giáo viên mới</h3>
            <button id="btn-close-invite-modal" type="button" style="background:none;border:none;color:#A8A29A;cursor:pointer;padding:4px;display:flex;align-items:center">
              ${icons.close}
            </button>
          </div>

          <form id="form-invite-teacher" style="padding:24px">
            <div style="margin-bottom:20px">
              <label for="input-invite-email" style="display:block;font-size:13px;font-weight:700;color:#2D2824;margin-bottom:8px">
                Email giáo viên
              </label>
              <input 
                id="input-invite-email" 
                type="email" 
                placeholder="VD: teacher@edutrack.vn" 
                required 
                style="width:100%;height:44px;padding:0 14px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:14px;color:#2D2824;outline:none"
              />
              <p style="font-size:12px;color:#7F7A72;margin:6px 0 0 0">
                Hệ thống sẽ tạo đường dẫn tham gia trung tâm cho giáo viên này.
              </p>
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px">
              <button id="btn-cancel-invite" type="button" style="background:#FAF7F2;border:1px solid #EAE4D8;color:#2D2824;border-radius:12px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer">
                Hủy
              </button>
              <button id="btn-submit-invite" type="submit" style="background:#A93226;border:none;color:#ffffff;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(169, 50, 38, 0.25)">
                Tạo link mời
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  `;
}

function renderTableRows(teachers: TeacherDisplayItem[]) {
  const tbody = document.getElementById('teachers-table-body');
  if (!tbody) return;

  if (teachers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="padding:36px 16px;text-align:center;color:#7F7A72;font-size:14px">
          Không tìm thấy giáo viên nào phù hợp với từ khóa "${searchQuery}".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = teachers.map(t => `
    <tr class="teacher-row" data-teacher-id="${t.staff_id}" style="border-bottom:1px solid #F5EFEB;cursor:pointer;transition:background 0.15s ease">
      <td style="padding:16px">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:42px;height:42px;border-radius:50%;background:#F5E6E4;color:#A93226;border:1px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">
            ${t.avatar_initials}
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:#A93226;line-height:1.2;display:inline-flex;align-items:center;gap:4px">
              <span>${t.full_name}</span>
              <span style="color:#A93226;font-size:15px">›</span>
            </div>
            <div style="font-size:13px;color:#7F7A72;margin-top:3px;font-weight:400">
              ${t.email}
            </div>
          </div>
        </div>
      </td>
      <td style="padding:16px;text-align:center;font-size:15px;font-weight:700;color:#2D2824">
        ${t.open_classes_count}
      </td>
      <td style="padding:16px;text-align:center;font-size:15px;font-weight:700;color:#2D2824">
        ${t.total_students_count}
      </td>
    </tr>
  `).join('');

  // Hover and click listeners
  tbody.querySelectorAll<HTMLTableRowElement>('.teacher-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.background = '#FAF7F2';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = 'transparent';
    });
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-teacher-id');
      if (id) {
        window.location.hash = `#/teachers/${id}`;
      }
    });
  });
}

function renderPendingInvites() {
  const container = document.getElementById('pending-invites-list');
  const badge = document.getElementById('pending-invites-badge');
  if (!container) return;

  if (badge) {
    badge.textContent = String(localInvites.length);
  }

  if (localInvites.length === 0) {
    container.innerHTML = `
      <div style="padding:28px 12px;text-align:center;color:#7F7A72;font-size:13px;background:#FDFBF7;border:1px dashed #EAE4D8;border-radius:14px">
        Chưa có lời mời nào đang chờ.
      </div>
    `;
    return;
  }

  container.innerHTML = localInvites.map(inv => {
    const link = inv.invite_link || `https://edutrack.vn/vao-trung-tam?token=${inv.token}`;
    return `
      <div style="background:#FDFBF7;border:1px solid #EAE4D8;border-radius:16px;padding:16px;transition:box-shadow 0.15s ease">
        <!-- Top Row: Email & Delete -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span style="font-size:13.5px;font-weight:700;color:#2D2824;word-break:break-all">
            ${inv.email}
          </span>
          <button class="btn-delete-invite" data-invite-id="${inv.invite_id}" type="button" style="background:none;border:none;color:#A93226;font-size:13px;font-weight:600;cursor:pointer;padding:2px 6px;border-radius:6px">
            Xóa
          </button>
        </div>

        <!-- Middle Row: Read-only Link Box -->
        <div style="background:#FFFFFF;border:1px solid #ECE3D6;border-radius:10px;padding:8px 12px;font-size:12px;color:#7F7A72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:12px;user-select:all" title="${link}">
          ${link}
        </div>

        <!-- Bottom Row: Copy Button -->
        <div>
          <button class="btn-copy-invite" data-link="${link}" type="button" style="display:inline-flex;align-items:center;gap:6px;background:#FFFFFF;color:#A93226;border:1.5px solid #A93226;border-radius:10px;padding:6px 14px;font-size:12.5px;font-weight:700;cursor:pointer;transition:all 0.15s ease">
            <span>Sao chép</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Delete invite handlers
  container.querySelectorAll<HTMLButtonElement>('.btn-delete-invite').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const inviteId = btn.getAttribute('data-invite-id');
      if (!inviteId) return;

      if (!confirm('Bạn có chắc chắn muốn xóa lời mời này?')) return;

      // Call API
      await deleteTeacherInviteApi(inviteId);
      // Remove from local
      localInvites = localInvites.filter(inv => inv.invite_id !== inviteId);
      renderPendingInvites();
      showToast('Đã thu hồi lời mời thành công', 'success');
    });
  });

  // Copy link handlers
  container.querySelectorAll<HTMLButtonElement>('.btn-copy-invite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const link = btn.getAttribute('data-link') || '';
      navigator.clipboard.writeText(link).then(() => {
        btn.innerHTML = `<span>Đã sao chép ✓</span>`;
        btn.style.background = '#F5E6E4';
        btn.style.color = '#A93226';
        setTimeout(() => {
          btn.innerHTML = `<span>Sao chép</span>`;
          btn.style.background = '#FFFFFF';
          btn.style.color = '#A93226';
        }, 2000);
      }).catch(() => {
        showToast('Không thể sao chép liên kết vào clipboard', 'error');
      });
    });
  });
}

function getFilteredAndSortedTeachers(): TeacherDisplayItem[] {
  let list = [...localTeachers];
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(t => t.full_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
  }

  list.sort((a, b) => {
    const comp = a.full_name.localeCompare(b.full_name, 'vi');
    return sortAscending ? comp : -comp;
  });

  return list;
}

function updateUI() {
  const filtered = getFilteredAndSortedTeachers();
  renderTableRows(filtered);

  // Update counts
  const heading = document.getElementById('teachers-count-heading');
  if (heading) {
    heading.textContent = `Giáo viên (${localTeachers.length})`;
  }

  const pagination = document.getElementById('teachers-pagination-label');
  if (pagination) {
    if (filtered.length === 0) {
      pagination.textContent = `Không có giáo viên nào`;
    } else {
      pagination.textContent = `Đang xem 1–${filtered.length} trong ${localTeachers.length} giáo viên`;
    }
  }

  // Update sort arrow
  const arrow = document.getElementById('sort-arrow');
  if (arrow) {
    arrow.textContent = sortAscending ? '▲' : '▼';
  }
}

export function initTeachersPage() {
  // Load fresh from API in background and update
  loadTeachersData().then(() => {
    updateUI();
    renderPendingInvites();
  });

  updateUI();
  renderPendingInvites();

  // Sort click
  const sortTh = document.getElementById('th-sort-teacher');
  sortTh?.addEventListener('click', () => {
    sortAscending = !sortAscending;
    updateUI();
  });

  // Search input and shortcut '/'
  const searchInput = document.getElementById('teacher-search-input') as HTMLInputElement | null;
  searchInput?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    updateUI();
  });

  // Global keydown listener for '/' shortcut
  const handleKeyDown = (e: KeyboardEvent) => {
    const activeEl = document.activeElement;
    const isEditing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable);
    if (e.key === '/' && !isEditing) {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Modal invite
  const modal = document.getElementById('modal-invite-teacher');
  const openModalBtn = document.getElementById('btn-open-invite-modal');
  const closeModalBtn = document.getElementById('btn-close-invite-modal');
  const cancelBtn = document.getElementById('btn-cancel-invite');
  const form = document.getElementById('form-invite-teacher') as HTMLFormElement | null;
  const emailInput = document.getElementById('input-invite-email') as HTMLInputElement | null;

  const openModal = () => {
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => emailInput?.focus(), 50);
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.style.display = 'none';
      form?.reset();
    }
  };

  openModalBtn?.addEventListener('click', openModal);
  closeModalBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Close on outside click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput?.value.trim() || '';
    if (!email) return;

    // Browser type=email accepts "a@b"; require a dotted domain
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Email không hợp lệ (VD: teacher@edutrack.vn)', 'error');
      return;
    }

    if (staffData.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      showToast('Email này đã thuộc về một tài khoản nhân sự trong hệ thống', 'warning');
      return;
    }

    // Check duplicate
    if (localInvites.some(inv => inv.email.toLowerCase() === email.toLowerCase())) {
      showToast('Email này đã được gửi lời mời đang chờ', 'warning');
      return;
    }

    // Call API
    const res = await inviteTeacherApi(email);
    const newInvite: TeacherInvite = res || {
      invite_id: `INV${Date.now()}`,
      email,
      token: `PL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      invite_link: `https://edutrack.vn/vao-trung-tam?token=PL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    localInvites.unshift(newInvite);
    teacherInviteData.unshift(newInvite);
    renderPendingInvites();
    closeModal();
    showToast(`Đã tạo link mời thành công cho ${email}!`, 'success');
  });
}
