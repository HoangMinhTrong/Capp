// ============================================
// EduTrack English - Phân hệ Thông báo (/announcements)
// Warm Minimalist Design System
// ============================================

import type { Announcement, Role } from '../types.ts';
import { announcementData, centerClassData, classData, createAnnouncement, deleteAnnouncement, enrollmentData, classAssignmentData } from '../data.ts';
import { getState } from '../state.ts';
import { showToast, formatDate } from '../utils.ts';
import { fetchAnnouncementsApi, createAnnouncementApi, deleteAnnouncementApi } from '../api.ts';

type FilterScope = 'all' | 'classes';

let activeScopeFilter: FilterScope = 'all';
let searchQuery = '';
let isModalOpen = false;
let isPreviewOpen = false;
let previewHtml = '';

// Modal State
let modalTargetScope: 'all' | 'classes' = 'all';
let selectedClassIds: Set<string> = new Set();
let classSearchQuery = '';

export function renderAnnouncementsPage(): string {
  const state = getState();
  const user = state.currentUser;
  const userRole = (user?.role || 'student') as Role;
  const canSend = userRole === 'admin' || userRole === 'teacher';

  // Count metrics
  const totalCount = announcementData.length;
  const allCenterCount = announcementData.filter(a => a.scope === 'all').length;
  const classTargetCount = announcementData.filter(a => a.scope === 'classes').length;

  // Filtered announcements
  let displayed = announcementData.filter(a => {
    if (userRole === 'student') {
      const studentId = state.currentStudentView || user?.staff_id;
      const myEnrollments = enrollmentData.filter(e => e.student_id === studentId);
      const myClassIds = new Set(myEnrollments.map(e => e.class_id));
      if (a.scope === 'classes') {
        const matches = a.target_class_ids?.some(cid => myClassIds.has(cid));
        if (!matches) return false;
      }
    }

    if (activeScopeFilter === 'all' && a.scope !== 'all') return false;
    if (activeScopeFilter === 'classes' && a.scope !== 'classes') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const content = a.content_html.toLowerCase();
      const sender = (a.sender_name || '').toLowerCase();
      const classes = (a.target_class_names || []).join(' ').toLowerCase();
      return content.includes(q) || sender.includes(q) || classes.includes(q);
    }
    return true;
  });

  return `
    <div class="announcements-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
            ${userRole === 'student' ? 'Thông báo học vụ' : 'Thông báo toàn trung tâm'}
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            ${userRole === 'student' ? 'Thông báo học tập từ Giảng viên & Trung tâm' : `EduTrack English · ${totalCount} lượt gửi`}
          </div>
        </div>

        <!-- Nút Gửi thông báo mới (chỉ Admin & Giáo viên) -->
        ${canSend ? `
          <button 
            id="btn-open-create-announcement" 
            type="button" 
            style="
              background:#A93226;
              color:#FFFFFF;
              border:none;
              border-radius:14px;
              padding:11px 22px;
              font-size:13.5px;
              font-weight:700;
              cursor:pointer;
              display:inline-flex;
              align-items:center;
              gap:8px;
              box-shadow:0 3px 10px rgba(169,50,38,0.25);
              transition:all 0.15s ease;
            "
            onmouseover="this.style.background='#922B21';this.style.transform='translateY(-1px)'"
            onmouseout="this.style.background='#A93226';this.style.transform='translateY(0)'"
          >
            <span style="font-size:16px">📢</span>
            <span>Gửi thông báo mới</span>
          </button>
        ` : ''}
      </div>

      <!-- 2. Khung lọc & tìm kiếm (thẻ trắng bo góc) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.02);display:flex;flex-direction:column;gap:14px">
        <!-- Hàng trên: 2 nút pill đếm số lượng động -->
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button 
            type="button" 
            class="btn-scope-pill ${activeScopeFilter === 'all' ? 'active' : ''}" 
            data-scope="all"
            style="
              border-radius:24px;
              padding:7px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${activeScopeFilter === 'all' 
                ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;box-shadow:0 2px 6px rgba(169,50,38,0.2);' 
                : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
              }
            "
          >
            Toàn trung tâm ${allCenterCount}
          </button>

          <button 
            type="button" 
            class="btn-scope-pill ${activeScopeFilter === 'classes' ? 'active' : ''}" 
            data-scope="classes"
            style="
              border-radius:24px;
              padding:7px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${activeScopeFilter === 'classes' 
                ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;box-shadow:0 2px 6px rgba(169,50,38,0.2);' 
                : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
              }
            "
          >
            Theo lớp ${classTargetCount}
          </button>
        </div>

        <!-- Hàng dưới: Ô tìm kiếm & Nút Lọc -->
        <div style="display:flex;align-items:center;gap:10px">
          <div style="position:relative;flex:1;max-width:540px">
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#A8A29A;font-size:15px">🔍</span>
            <input 
              id="input-announcement-search" 
              type="text" 
              placeholder="Tìm trong nội dung..."
              value="${searchQuery}"
              style="width:100%;height:40px;padding:0 14px 0 38px;border:1px solid #EAE4D8;border-radius:12px;background:#FDFBF7;font-size:13.5px;color:#2D2824;outline:none"
            />
          </div>
          <button 
            id="btn-apply-announcement-filter" 
            type="button" 
            style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:12px;padding:0 18px;height:40px;font-size:13px;font-weight:700;color:#2D2824;cursor:pointer;transition:all 0.15s ease"
          >
            Lọc
          </button>
        </div>
      </div>

      <!-- 3. Vùng hiển thị danh sách thông báo -->
      <div id="announcements-list-wrapper">
        ${renderAnnouncementsList(displayed, canSend)}
      </div>

      <!-- 4. Modal Gửi thông báo mới -->
      <div id="create-announcement-modal-container">
        ${isModalOpen ? renderCreateAnnouncementModal() : ''}
      </div>

      <!-- 5. Hộp thoại Xem thử popup -->
      <div id="preview-announcement-modal-container">
        ${isPreviewOpen ? renderPreviewModal(previewHtml) : ''}
      </div>

    </div>
  `;
}

function renderAnnouncementsList(list: Announcement[], canDelete: boolean): string {
  // Khi chưa có thông báo nào: Empty State
  if (list.length === 0) {
    return `
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:64px 32px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
        <div style="font-size:48px;margin-bottom:12px;line-height:1">📭</div>
        <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:6px">
          Chưa gửi thông báo nào
        </div>
        <div style="font-size:13.5px;color:#7F7A72;max-width:440px;margin:0 auto;line-height:1.5">
          Bấm “Gửi thông báo mới” để gửi cho toàn trung tâm hoặc chọn từng lớp.
        </div>
      </div>
    `;
  }

  // Khi đã có thông báo
  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      ${list.map(a => {
        const isAll = a.scope === 'all';
        const targetDesc = isAll
          ? 'Toàn trung tâm'
          : (a.target_class_names && a.target_class_names.length > 0)
            ? a.target_class_names.join(', ')
            : 'Các lớp được chỉ định';

        const dateStr = formatDate(a.created_at.split('T')[0]);
        const timeStr = a.created_at.includes('T') ? a.created_at.split('T')[1].substring(0, 5) : '';

        return `
          <div 
            class="announcement-item-card" 
            style="
              background:#FFFFFF;
              border:1px solid #EAE4D8;
              border-radius:18px;
              padding:20px 24px;
              box-shadow:0 1px 3px rgba(0,0,0,0.02);
              display:flex;
              flex-direction:column;
              gap:14px;
            "
          >
            <!-- Card Top Bar: Badge phạm vi, Người gửi, Thời gian, Nút xóa -->
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-bottom:1px solid #F0ECE4;padding-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <!-- Badge phạm vi -->
                ${isAll ? `
                  <span style="background:#F5E6E4;color:#A93226;font-size:12px;font-weight:800;padding:4px 12px;border-radius:20px;display:inline-flex;align-items:center;gap:5px">
                    <span>🏢</span>
                    <span>Toàn trung tâm</span>
                  </span>
                ` : `
                  <span style="background:#E0F2FE;color:#0284C7;font-size:12px;font-weight:800;padding:4px 12px;border-radius:20px;display:inline-flex;align-items:center;gap:5px">
                    <span>🎓</span>
                    <span>${targetDesc}</span>
                  </span>
                `}

                <span style="font-size:12.5px;color:#7F7A72">
                  Người gửi: <strong style="color:#2D2824">${a.sender_name || 'Ban Quản lý Trung tâm'}</strong>
                </span>
              </div>

              <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:12px;color:#A8A29A">
                  📅 ${dateStr} ${timeStr ? `lúc ${timeStr}` : ''}
                </span>

                ${canDelete ? `
                  <button 
                    class="btn-delete-announcement" 
                    data-id="${a.announcement_id}"
                    type="button" 
                    title="Xóa thông báo này"
                    style="background:none;border:none;cursor:pointer;color:#A8A29A;font-size:15px;padding:4px;border-radius:6px;transition:color 0.15s ease"
                    onmouseover="this.style.color='#922B21'"
                    onmouseout="this.style.color='#A8A29A'"
                  >
                    🗑️
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Card Content Body: Rich HTML rendered -->
            <div class="announcement-content-html" style="font-size:14px;color:#2D2824;line-height:1.6">
              ${a.content_html}
            </div>

          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Modal Soạn thông báo mới
function renderCreateAnnouncementModal(): string {
  const state = getState();
  const user = state.currentUser;
  const isAdmin = user?.role === 'admin';

  // Get available classes
  const classesList = centerClassData.length > 0 ? centerClassData : classData.map(c => ({
    class_id: c.class_id,
    class_name: c.class_name,
    class_code: c.class_code,
  }));

  const filteredClasses = classesList.filter(c => {
    if (!classSearchQuery.trim()) return true;
    const q = classSearchQuery.trim().toLowerCase();
    return c.class_name.toLowerCase().includes(q) || (c.class_code || '').toLowerCase().includes(q);
  });

  const selectedCount = selectedClassIds.size;
  const isSendDisabled = modalTargetScope === 'classes' && selectedCount === 0;
  const sendButtonText = modalTargetScope === 'all'
    ? 'Gửi toàn trung tâm'
    : `Gửi cho ${selectedCount} lớp`;

  return `
    <div id="modal-create-announcement" style="position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto">
      <div style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:680px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 48px rgba(0,0,0,0.18);animation:fadeInScale 0.18s ease-out">
        
        <!-- Modal Header -->
        <div style="padding:18px 24px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between;background:#FDFBF7;flex-shrink:0">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 2px 0">
              Gửi thông báo mới
            </h2>
            <div style="font-size:12.5px;color:#7F7A72">
              Soạn thảo và phát thông báo tức thì tới học viên & giáo viên
            </div>
          </div>
          <button id="btn-close-create-modal" type="button" style="width:32px;height:32px;border-radius:50%;background:#F0ECE4;border:none;font-size:16px;color:#7F7A72;cursor:pointer;display:flex;align-items:center;justify-content:center">
            ✕
          </button>
        </div>

        <!-- Modal Body Scrollable -->
        <div style="padding:22px 26px;overflow-y:auto;display:flex;flex-direction:column;gap:18px;flex:1">
          
          <!-- 1. GỬI CHO (2 nút chuyển đổi dạng pill) -->
          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;color:#7F7A72;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:8px">
              GỬI CHO
            </label>
            <div style="display:flex;align-items:center;gap:10px">
              ${isAdmin ? `
                <button 
                  type="button" 
                  class="btn-modal-target-pill ${modalTargetScope === 'all' ? 'active' : ''}" 
                  data-target="all"
                  style="
                    border-radius:24px;
                    padding:8px 18px;
                    font-size:13px;
                    font-weight:700;
                    cursor:pointer;
                    display:inline-flex;
                    align-items:center;
                    gap:6px;
                    transition:all 0.15s ease;
                    ${modalTargetScope === 'all' 
                      ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;box-shadow:0 2px 6px rgba(169,50,38,0.2);' 
                      : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
                    }
                  "
                >
                  <span>🏢</span>
                  <span>Toàn trung tâm</span>
                </button>
              ` : ''}

              <button 
                type="button" 
                class="btn-modal-target-pill ${modalTargetScope === 'classes' ? 'active' : ''}" 
                data-target="classes"
                style="
                  border-radius:24px;
                  padding:8px 18px;
                  font-size:13px;
                  font-weight:700;
                  cursor:pointer;
                  display:inline-flex;
                  align-items:center;
                  gap:6px;
                  transition:all 0.15s ease;
                  ${modalTargetScope === 'classes' 
                    ? 'background:#A93226;color:#FFFFFF;border:1px solid #A93226;box-shadow:0 2px 6px rgba(169,50,38,0.2);' 
                    : 'background:#FFFFFF;color:#2D2824;border:1px solid #EAE4D8;'
                  }
                "
              >
                <span>🎓</span>
                <span>Chọn lớp</span>
              </button>
            </div>

            <!-- Dòng mô tả -->
            <div style="font-size:12.5px;color:#7F7A72;margin-top:8px;line-height:1.4">
              ${modalTargetScope === 'all' 
                ? 'Học viên và giáo viên của trung tâm thấy thông báo trong hộp thoại ngay lần mở app kế tiếp, kèm thông báo đẩy.' 
                : 'Hiện trên bảng tin của từng lớp đã chọn — cùng chỗ với thông báo của giáo viên — và đẩy tới học viên trong lớp.'
              }
            </div>

            <!-- Khung chọn lớp (nếu là Chọn lớp) -->
            ${modalTargetScope === 'classes' ? `
              <div style="background:#FDFBF7;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px;margin-top:12px;display:flex;flex-direction:column;gap:10px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
                  <input 
                    id="input-class-search" 
                    type="text" 
                    placeholder="Tìm lớp theo tên..." 
                    value="${classSearchQuery}"
                    style="flex:1;height:36px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FFFFFF;font-size:12.5px;color:#2D2824;outline:none"
                  />
                  <span style="font-size:12px;font-weight:700;color:#7F7A72;white-space:nowrap">
                    ${classesList.length} lớp
                  </span>
                </div>

                <!-- Checkbox list -->
                <div style="max-height:150px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding-right:4px">
                  ${filteredClasses.map(c => {
                    const isChecked = selectedClassIds.has(c.class_id);
                    return `
                      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#2D2824;cursor:pointer;padding:6px 8px;border-radius:8px;background:${isChecked ? '#F5E6E4' : '#FFFFFF'};border:1px solid ${isChecked ? '#F0D5D2' : '#EAE4D8'}">
                        <input 
                          type="checkbox" 
                          class="cb-class-select" 
                          data-id="${c.class_id}" 
                          data-name="${c.class_name}"
                          ${isChecked ? 'checked' : ''} 
                          style="accent-color:#A93226;width:16px;height:16px;cursor:pointer"
                        />
                        <span style="font-weight:${isChecked ? '700' : '500'}">${c.class_name}</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- 2. Thanh công cụ Rich Text & Khung soạn thảo -->
          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;color:#7F7A72;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:8px">
              NỘI DUNG THÔNG BÁO <span style="color:#A93226">*</span>
            </label>

            <!-- Rich Text Toolbar -->
            <div style="background:#FDFBF7;border:1px solid #EAE4D8;border-radius:14px 14px 0 0;padding:8px 10px;display:flex;flex-direction:column;gap:6px">
              <!-- Hàng 1 -->
              <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                <button type="button" class="btn-editor-action" data-cmd="undo" title="Hoàn tác (Undo)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-size:13px">↩️</button>
                <button type="button" class="btn-editor-action" data-cmd="redo" title="Làm lại (Redo)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-size:13px">↪️</button>
                <span style="width:1px;height:18px;background:#EAE4D8;margin:0 2px"></span>
                <button type="button" class="btn-editor-action" data-cmd="bold" title="In đậm (Bold)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-weight:800">B</button>
                <button type="button" class="btn-editor-action" data-cmd="italic" title="In nghiêng (Italic)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-style:italic;font-family:serif">I</button>
                <button type="button" class="btn-editor-action" data-cmd="underline" title="Gạch chân (Underline)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;text-decoration:underline">U</button>
                <button type="button" class="btn-editor-action" data-cmd="strikeThrough" title="Gạch ngang (Strikethrough)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;text-decoration:line-through">S</button>
                <span style="width:1px;height:18px;background:#EAE4D8;margin:0 2px"></span>
                <button type="button" class="btn-editor-action" data-cmd="hiliteColor" data-val="#FFF3C4" title="Bút tô nền vàng (Highlight)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFF3C4;cursor:pointer;font-size:13px">🖍️</button>
                <button type="button" class="btn-editor-action" data-cmd="insertUnorderedList" title="Danh sách chấm tròn" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-size:13px">•≡</button>
                <button type="button" class="btn-editor-action" data-cmd="insertOrderedList" title="Danh sách đánh số" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-size:13px">1.≡</button>
                <button type="button" class="btn-editor-action" data-cmd="formatBlock" data-val="<h3>" title="Tiêu đề (Heading)" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-weight:800">H</button>
                <button type="button" class="btn-editor-action" data-cmd="formatBlock" data-val="<blockquote>" title="Trích dẫn" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-family:serif;font-weight:800">“</button>
                <span style="width:1px;height:18px;background:#EAE4D8;margin:0 2px"></span>
                <!-- 4 nút tròn chọn màu chữ -->
                <button type="button" class="btn-editor-color" data-color="#A93226" title="Màu đỏ đất" style="width:20px;height:20px;border-radius:50%;background:#A93226;border:2px solid #FFFFFF;box-shadow:0 0 2px rgba(0,0,0,0.3);cursor:pointer;margin:0 2px"></button>
                <button type="button" class="btn-editor-color" data-color="#0284C7" title="Màu xanh dương" style="width:20px;height:20px;border-radius:50%;background:#0284C7;border:2px solid #FFFFFF;box-shadow:0 0 2px rgba(0,0,0,0.3);cursor:pointer;margin:0 2px"></button>
                <button type="button" class="btn-editor-color" data-color="#059669" title="Màu xanh lá" style="width:20px;height:20px;border-radius:50%;background:#059669;border:2px solid #FFFFFF;box-shadow:0 0 2px rgba(0,0,0,0.3);cursor:pointer;margin:0 2px"></button>
                <button type="button" class="btn-editor-color" data-color="#AF601A" title="Màu nâu" style="width:20px;height:20px;border-radius:50%;background:#AF601A;border:2px solid #FFFFFF;box-shadow:0 0 2px rgba(0,0,0,0.3);cursor:pointer;margin:0 2px"></button>
                <span style="width:1px;height:18px;background:#EAE4D8;margin:0 2px"></span>
                <button type="button" class="btn-editor-action" data-cmd="removeFormat" title="Xóa định dạng" style="width:30px;height:30px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;color:#922B21;font-weight:800">×</button>
              </div>

              <!-- Hàng 2: Khối mã </> -->
              <div style="display:flex;align-items:center;gap:4px">
                <button type="button" id="btn-insert-code-block" title="Khối mã (Code block)" style="height:26px;padding:0 8px;border:1px solid #EAE4D8;border-radius:6px;background:#FFFFFF;cursor:pointer;font-family:monospace;font-size:12px;color:#2D2824;display:inline-flex;align-items:center;gap:4px">
                  <span>&lt;/&gt;</span>
                  <span style="font-size:11px">Khối mã</span>
                </button>
              </div>
            </div>

            <!-- Khung soạn thảo Contenteditable -->
            <div 
              id="editor-contenteditable" 
              contenteditable="true" 
              style="
                background:#FFFFFF;
                border:1px solid #EAE4D8;
                border-top:none;
                border-radius:0 0 14px 14px;
                padding:16px;
                min-height:190px;
                max-height:300px;
                overflow-y:auto;
                outline:none;
                font-size:14px;
                color:#2D2824;
                line-height:1.6;
              "
            ></div>
          </div>

        </div>

        <!-- Modal Footer: Xem thử & Nút Gửi chính -->
        <div style="padding:16px 24px;border-top:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between;background:#FDFBF7;flex-shrink:0">
          <!-- Nút Xem thử -->
          <button 
            id="btn-preview-announcement" 
            type="button" 
            style="
              background:#FFFFFF;
              color:#A93226;
              border:1px solid #A93226;
              border-radius:12px;
              padding:9px 18px;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              display:inline-flex;
              align-items:center;
              gap:6px;
              transition:all 0.15s ease;
            "
            onmouseover="this.style.background='#F5E6E4'"
            onmouseout="this.style.background='#FFFFFF'"
          >
            <span>👁️</span>
            <span>Xem thử</span>
          </button>

          <!-- Nút chính Gửi -->
          <button 
            id="btn-submit-send-announcement" 
            type="button" 
            ${isSendDisabled ? 'disabled' : ''}
            style="
              background:${isSendDisabled ? '#EAE4D8' : '#A93226'};
              color:${isSendDisabled ? '#A8A29A' : '#FFFFFF'};
              border:none;
              border-radius:12px;
              padding:10px 24px;
              font-size:13.5px;
              font-weight:700;
              cursor:${isSendDisabled ? 'not-allowed' : 'pointer'};
              box-shadow:${isSendDisabled ? 'none' : '0 2px 8px rgba(169,50,38,0.25)'};
              transition:all 0.15s ease;
            "
          >
            ${sendButtonText}
          </button>
        </div>

      </div>
    </div>
  `;
}

// Hộp thoại popup Xem thử / Popup thông báo cho người dùng
export function renderPreviewModal(contentHtml: string): string {
  return `
    <div id="modal-preview-popup" style="position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#FAF7F2;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:480px;box-shadow:0 24px 48px rgba(0,0,0,0.18);padding:24px 28px;display:flex;flex-direction:column;gap:18px;animation:fadeInScale 0.18s ease-out">
        
        <!-- Header: Loa + Tiêu đề màu đỏ đất -->
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">📢</span>
          <h3 style="font-size:18px;font-weight:800;color:#A93226;margin:0">
            Thông báo
          </h3>
        </div>

        <!-- Vùng hiển thị đúng nội dung HTML vừa soạn -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:18px;font-size:14px;color:#2D2824;line-height:1.6;max-height:320px;overflow-y:auto">
          ${contentHtml || '<p style="color:#7F7A72;font-style:italic">Chưa có nội dung soạn thảo.</p>'}
        </div>

        <!-- Đường kẻ ngăn cách -->
        <div style="width:100%;height:1px;background:#EAE4D8"></div>

        <!-- Nút full-width màu đỏ đất: Đóng -->
        <button 
          id="btn-close-preview-popup" 
          type="button" 
          style="
            width:100%;
            height:44px;
            background:#A93226;
            color:#FFFFFF;
            border:none;
            border-radius:14px;
            font-size:14px;
            font-weight:700;
            cursor:pointer;
            box-shadow:0 2px 8px rgba(169,50,38,0.25);
            transition:all 0.15s ease;
          "
          onmouseover="this.style.background='#922B21'"
          onmouseout="this.style.background='#A93226'"
        >
          Đóng
        </button>

      </div>
    </div>
  `;
}

export function initAnnouncementsPage(): void {
  // Đồng bộ dữ liệu mới nhất từ Python FastAPI backend nếu có
  fetchAnnouncementsApi().then(items => {
    if (items && Array.isArray(items) && items.length > 0) {
      let hasNew = false;
      items.forEach(backendItem => {
        if (!announcementData.some(a => a.announcement_id === backendItem.announcement_id)) {
          announcementData.push(backendItem);
          hasNew = true;
        }
      });
      if (hasNew) reRender();
    }
  }).catch(() => {});

  // 1. Filter Scope Pills
  document.querySelectorAll<HTMLButtonElement>('.btn-scope-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const scope = btn.dataset.scope as FilterScope;
      if (scope) {
        activeScopeFilter = scope;
        reRender();
      }
    });
  });

  // 2. Search & Filter Input
  const searchInput = document.getElementById('input-announcement-search') as HTMLInputElement | null;
  const filterBtn = document.getElementById('btn-apply-announcement-filter');

  filterBtn?.addEventListener('click', () => {
    searchQuery = searchInput?.value || '';
    reRender();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      searchQuery = searchInput.value;
      reRender();
    }
  });

  // 3. Open Create Modal
  document.getElementById('btn-open-create-announcement')?.addEventListener('click', () => {
    isModalOpen = true;
    modalTargetScope = getState().currentUser?.role === 'admin' ? 'all' : 'classes';
    selectedClassIds.clear();
    classSearchQuery = '';
    reRender();
    setupCreateModalEvents();
  });

  // 4. Delete Announcement
  document.querySelectorAll<HTMLButtonElement>('.btn-delete-announcement').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (id) {
        deleteAnnouncement(id);
        deleteAnnouncementApi(id).catch(() => {});
        showToast('Đã xóa thông báo!', 'success');
        reRender();
      }
    });
  });

  if (isModalOpen) {
    setupCreateModalEvents();
  }
}

function setupCreateModalEvents(): void {
  const modal = document.getElementById('modal-create-announcement');
  if (!modal) return;

  const closeModal = () => {
    isModalOpen = false;
    reRender();
  };

  document.getElementById('btn-close-create-modal')?.addEventListener('click', closeModal);

  // Close on Esc key
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      window.removeEventListener('keydown', handleEsc);
    }
  };
  window.addEventListener('keydown', handleEsc);

  // Target Switch Pills
  document.querySelectorAll<HTMLButtonElement>('.btn-modal-target-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target as 'all' | 'classes';
      if (target) {
        modalTargetScope = target;
        // Save current editor content before re-rendering modal
        const editor = document.getElementById('editor-contenteditable');
        const currentHtml = editor ? editor.innerHTML : '';
        reRender();
        setupCreateModalEvents();
        const newEditor = document.getElementById('editor-contenteditable');
        if (newEditor) newEditor.innerHTML = currentHtml;
      }
    });
  });

  // Class Search in Modal
  const classInput = document.getElementById('input-class-search') as HTMLInputElement | null;
  classInput?.addEventListener('input', () => {
    classSearchQuery = classInput.value;
    const editor = document.getElementById('editor-contenteditable');
    const currentHtml = editor ? editor.innerHTML : '';
    reRender();
    setupCreateModalEvents();
    const newEditor = document.getElementById('editor-contenteditable');
    if (newEditor) newEditor.innerHTML = currentHtml;
  });

  // Class Checkboxes
  document.querySelectorAll<HTMLInputElement>('.cb-class-select').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      if (id) {
        if (cb.checked) {
          selectedClassIds.add(id);
        } else {
          selectedClassIds.delete(id);
        }
        updateModalSubmitBtn();
      }
    });
  });

  // Rich Text Toolbar Actions
  document.querySelectorAll<HTMLButtonElement>('.btn-editor-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val || '';
      if (cmd) {
        document.execCommand(cmd, false, val);
      }
    });
  });

  // Color Buttons
  document.querySelectorAll<HTMLButtonElement>('.btn-editor-color').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      if (color) {
        document.execCommand('foreColor', false, color);
      }
    });
  });

  // Insert Code Block
  document.getElementById('btn-insert-code-block')?.addEventListener('click', () => {
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    const codeHtml = `<pre style="background:#2D2824;color:#FAF7F2;padding:12px;border-radius:10px;font-family:monospace;font-size:13px;overflow-x:auto"><code>${selectedText || 'console.log("Hello EduTrack");'}</code></pre><p><br></p>`;
    document.execCommand('insertHTML', false, codeHtml);
  });

  // Preview Button
  document.getElementById('btn-preview-announcement')?.addEventListener('click', () => {
    const editor = document.getElementById('editor-contenteditable');
    previewHtml = editor?.innerHTML || '';
    isPreviewOpen = true;
    reRender();
    setupPreviewModalEvents();
  });

  // Submit Send Announcement
  document.getElementById('btn-submit-send-announcement')?.addEventListener('click', () => {
    const editor = document.getElementById('editor-contenteditable');
    const html = editor?.innerHTML.trim() || '';

    if (!html || html === '<p><br></p>') {
      showToast('Vui lòng nhập nội dung thông báo trước khi gửi!', 'warning');
      return;
    }

    if (modalTargetScope === 'classes' && selectedClassIds.size === 0) {
      showToast('Vui lòng chọn ít nhất 1 lớp để gửi thông báo!', 'warning');
      return;
    }

    const state = getState();
    const user = state.currentUser;

    const classNames = Array.from(selectedClassIds).map(id => {
      const c = centerClassData.find(item => item.class_id === id) || classData.find(item => item.class_id === id);
      return c?.class_name || id;
    });

    const payload = {
      scope: modalTargetScope,
      target_class_ids: modalTargetScope === 'classes' ? Array.from(selectedClassIds) : undefined,
      target_class_names: modalTargetScope === 'classes' ? classNames : undefined,
      content_html: html,
      sender_id: user?.staff_id || 'STF001',
      sender_name: user?.full_name || 'Ban Quản lý Trung tâm',
      sender_role: user?.role || 'admin',
    };

    // Save locally
    createAnnouncement(payload);

    // Call API in background
    createAnnouncementApi(payload).catch(() => {});

    showToast(
      modalTargetScope === 'all'
        ? 'Đã gửi thông báo tới toàn trung tâm thành công!'
        : `Đã gửi thông báo tới ${selectedClassIds.size} lớp thành công!`,
      'success'
    );

    isModalOpen = false;
    reRender();
  });
}

function updateModalSubmitBtn() {
  const submitBtn = document.getElementById('btn-submit-send-announcement') as HTMLButtonElement | null;
  if (!submitBtn) return;

  const count = selectedClassIds.size;
  if (modalTargetScope === 'classes') {
    submitBtn.textContent = `Gửi cho ${count} lớp`;
    if (count === 0) {
      submitBtn.disabled = true;
      submitBtn.style.background = '#EAE4D8';
      submitBtn.style.color = '#A8A29A';
      submitBtn.style.cursor = 'not-allowed';
      submitBtn.style.boxShadow = 'none';
    } else {
      submitBtn.disabled = false;
      submitBtn.style.background = '#A93226';
      submitBtn.style.color = '#FFFFFF';
      submitBtn.style.cursor = 'pointer';
      submitBtn.style.boxShadow = '0 2px 8px rgba(169,50,38,0.25)';
    }
  } else {
    submitBtn.textContent = 'Gửi toàn trung tâm';
    submitBtn.disabled = false;
    submitBtn.style.background = '#A93226';
    submitBtn.style.color = '#FFFFFF';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.boxShadow = '0 2px 8px rgba(169,50,38,0.25)';
  }
}

function setupPreviewModalEvents() {
  const modal = document.getElementById('modal-preview-popup');
  if (!modal) return;

  const closePreview = () => {
    isPreviewOpen = false;
    modal.remove();
  };

  document.getElementById('btn-close-preview-popup')?.addEventListener('click', closePreview);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePreview();
  });
}

function reRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderAnnouncementsPage();
    initAnnouncementsPage();
  }
}

/**
 * Trải nghiệm Popup khi mở app:
 * Tự động hiện popup thông báo mới nhất cho Học viên & Giáo viên khi mở app / đổi vai trò
 * nếu có thông báo chưa đọc (lưu trong localStorage 'edutrack_viewed_announcements').
 */
export function checkAndShowUnreadAnnouncementPopup() {
  const state = getState();
  if (!state.isLoggedIn || !state.currentUser) return;
  const user = state.currentUser;
  const role = user.role;
  if (role !== 'student' && role !== 'teacher') return;

  // Tránh mở trùng lặp
  if (document.getElementById('modal-unread-announcement-popup')) return;

  let viewedIds: string[] = [];
  try {
    const raw = localStorage.getItem('edutrack_viewed_announcements');
    if (raw) viewedIds = JSON.parse(raw);
  } catch {
    viewedIds = [];
  }
  const viewedSet = new Set(viewedIds);

  const relevantAnnouncements = announcementData.filter(a => {
    if (viewedSet.has(a.announcement_id)) return false;
    if (a.scope === 'all') return true;
    if (role === 'student') {
      const studentId = state.currentStudentView || user.staff_id;
      const enrolledClassIds = new Set(
        enrollmentData.filter(e => e.student_id === studentId && e.status === 'active').map(e => e.class_id)
      );
      return (a.target_class_ids || []).some(cid => enrolledClassIds.has(cid));
    }
    if (role === 'teacher') {
      const teacherClassIds = new Set(
        classAssignmentData.filter(ca => ca.teacher_id === user.staff_id).map(ca => ca.class_id)
      );
      return (a.target_class_ids || []).some(cid => teacherClassIds.has(cid));
    }
    return false;
  });

  if (relevantAnnouncements.length === 0) return;

  const targetAnnouncement = relevantAnnouncements[0];

  const popup = document.createElement('div');
  popup.id = 'modal-unread-announcement-popup';
  popup.style.cssText = 'position:fixed;inset:0;background:rgba(20, 16, 12, 0.55);backdrop-filter:blur(3px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';
  popup.innerHTML = `
    <div style="background:#FAF7F2;border-radius:20px;border:1px solid #EAE4D8;width:100%;max-width:480px;box-shadow:0 24px 48px rgba(0,0,0,0.18);padding:24px 28px;display:flex;flex-direction:column;gap:18px;animation:fadeInScale 0.18s ease-out">
      <!-- Header: Loa + Tiêu đề màu đỏ đất -->
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">📢</span>
        <h3 style="font-size:18px;font-weight:800;color:#A93226;margin:0">
          Thông báo
        </h3>
      </div>

      <!-- Vùng hiển thị đúng nội dung HTML vừa soạn -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:18px;font-size:14px;color:#2D2824;line-height:1.6;max-height:320px;overflow-y:auto">
        ${targetAnnouncement.content_html}
      </div>

      <!-- Đường kẻ ngăn cách -->
      <div style="width:100%;height:1px;background:#EAE4D8"></div>

      <!-- Nút full-width màu đỏ đất: Đóng -->
      <button 
        id="btn-close-unread-popup" 
        type="button" 
        style="
          width:100%;
          height:44px;
          background:#A93226;
          color:#FFFFFF;
          border:none;
          border-radius:14px;
          font-size:14px;
          font-weight:700;
          cursor:pointer;
          box-shadow:0 2px 8px rgba(169,50,38,0.25);
          transition:all 0.15s ease;
        "
      >
        Đóng
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  const closeUnread = () => {
    viewedSet.add(targetAnnouncement.announcement_id);
    try {
      localStorage.setItem('edutrack_viewed_announcements', JSON.stringify(Array.from(viewedSet)));
    } catch { /* ignore */ }
    popup.remove();
  };

  document.getElementById('btn-close-unread-popup')?.addEventListener('click', closeUnread);
  popup.addEventListener('click', (e) => {
    if (e.target === popup) closeUnread();
  });
}
