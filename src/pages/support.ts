// ============================================
// EduTrack English - Trang Hỗ trợ & Tin nhắn Học viên
// Warm Minimalist Design System & Messenger-Style Layout
// ============================================

import type { SupportTicket, SupportMessage, TicketCategory } from '../types.ts';
import { ticketData, messageData, studentData, classData, centerClassData, classAssignmentData, enrollmentData } from '../data.ts';
import { getState } from '../state.ts';
import { formatDateTime, formatTimeAgo, roleLabels, showToast } from '../utils.ts';

// State for Support & Messenger filters
let activeStatusFilter: string = 'all'; // 'all', 'new', 'in_progress', 'resolved'
let activeCategoryFilter: string = 'all'; // 'all', 'attendance', 'assignment', 'lesson', 'schedule', 'other'
let selectedStudentFilter: string = 'all'; // student_id or 'all'
let selectedClassFilter: string = 'all'; // class_id or 'all'
let searchKeyword: string = '';
let activeTicketId: string | null = null;

function getStudentName(studentId: string): string {
  return studentData.find(s => s.student_id === studentId)?.full_name ?? studentId;
}

function getClassName(classId: string): string {
  const cls = centerClassData.find(c => c.class_id === classId) || classData.find(c => c.class_id === classId);
  return cls ? cls.class_name : classId;
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Category configuration for popular issue pills
const categoryConfig: { key: string; label: string; icon: string; match: (t: SupportTicket) => boolean }[] = [
  { key: 'all', label: 'Tất cả vấn đề', icon: '💬', match: () => true },
  { key: 'attendance', label: 'Xin nghỉ học & Học bù', icon: '📅', match: t => t.category === 'attendance' },
  { key: 'assignment', label: 'Bài tập & Chấm điểm', icon: '📝', match: t => t.category === 'assignment' || t.category === 'score' },
  { key: 'lesson', label: 'Hỏi bài & Ngữ pháp', icon: '💡', match: t => t.category === 'lesson' },
  { key: 'schedule', label: 'Lịch học & Đổi ca', icon: '⏰', match: t => t.category === 'schedule' },
  { key: 'other', label: 'Học phí & Tài liệu', icon: '📁', match: t => t.category === 'other' },
];

export function getOrCreateTicketForStudent(studentId: string, studentName?: string, classId?: string): SupportTicket {
  let ticket = ticketData.find(t => t.student_id === studentId);
  if (!ticket) {
    const newId = `TK${String(ticketData.length + 1).padStart(3, '0')}`;
    const code = `SUP-2026-${String(ticketData.length + 1).padStart(3, '0')}`;
    const state = getState();
    const teacherId = state.currentUser?.staff_id || 'STF003';
    const cId = classId || 'CLS_NN01';
    const sName = studentName || studentData.find(s => s.student_id === studentId)?.full_name || 'Học viên';

    ticket = {
      ticket_id: newId,
      ticket_code: code,
      student_id: studentId,
      class_id: cId,
      category: 'lesson',
      title: `Kênh trao đổi học tập · ${sName}`,
      description: `Kênh nhắn tin trực tiếp giữa giáo viên phụ trách và học viên ${sName}.`,
      priority: 'medium',
      status: 'in_progress',
      assigned_to: teacherId,
      created_at: new Date().toISOString(),
      first_response_at: new Date().toISOString(),
      sla_deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      is_sla_breached: false,
    };
    ticketData.unshift(ticket);

    // Initial welcoming message from Teacher
    messageData.push({
      message_id: `MSG${String(messageData.length + 1).padStart(3, '0')}`,
      ticket_id: newId,
      sender_id: teacherId,
      sender_name: state.currentUser?.full_name || 'Lê Minh Cường',
      sender_role: state.currentUser?.role || 'teacher',
      content: `Chào em ${sName}! Thầy/Cô mở kênh tin nhắn này để trao đổi và hỗ trợ em trong quá trình học tập. Em có câu hỏi hoặc cần giải đáp bài học thì nhắn cho Thầy/Cô tại đây nhé!`,
      sent_at: new Date().toISOString(),
      is_internal_note: false,
    });
  }
  return ticket;
}

export function getStudentMessages(studentId: string): SupportMessage[] {
  const studentTickets = ticketData.filter(t => t.student_id === studentId);
  const ticketIds = new Set(studentTickets.map(t => t.ticket_id));
  return messageData.filter(m => ticketIds.has(m.ticket_id));
}

function getFilteredTickets(): SupportTicket[] {
  const state = getState();
  const user = state.currentUser;
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  let list = [...ticketData];

  // 1. Strict role permission (RBAC Scoping)
  if (isStudent) {
    const studentId = state.currentStudentView || user?.staff_id;
    list = list.filter(t => t.student_id === studentId);
  } else if (isTeacher && staffId) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teacher_id === staffId).forEach(ca => myClassIds.add(ca.class_id));
    centerClassData.filter(c => c.teacher_id === staffId).forEach(c => myClassIds.add(c.class_id));
    if (staffId === 'STF003') {
      myClassIds.add('CLS_IELTS_FND');
      myClassIds.add('CLS_COMM_01');
      myClassIds.add('CLS_SELF_01');
      myClassIds.add('CLS_NN01');
    } else if (staffId === 'STF004') {
      myClassIds.add('CLS_TRIAL_01');
      myClassIds.add('CLS_B1_01');
      myClassIds.add('CLS003');
      myClassIds.add('CLS005');
    }
    const enrolledStudents = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    list = list.filter(t => t.assigned_to === staffId || myClassIds.has(t.class_id || '') || enrolledStudents.has(t.student_id));
  } else if (isTA && staffId) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teaching_assistant_id === staffId).forEach(ca => myClassIds.add(ca.class_id));
    if (staffId === 'STF005') {
      myClassIds.add('CLS_IELTS_FND');
      myClassIds.add('CLS_COMM_01');
      myClassIds.add('CLS_SELF_01');
      myClassIds.add('CLS_NN01');
      myClassIds.add('CLS001');
      myClassIds.add('CLS004');
    } else if (staffId === 'STF006') {
      myClassIds.add('CLS_TRIAL_01');
      myClassIds.add('CLS_B1_01');
      myClassIds.add('CLS002');
      myClassIds.add('CLS003');
      myClassIds.add('CLS005');
    }
    const enrolledStudents = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    list = list.filter(t => t.assigned_to === staffId || myClassIds.has(t.class_id || '') || enrolledStudents.has(t.student_id));
  }

  // 2. Filter by status (đồng bộ chính xác 100% với 4 thẻ KPI)
  if (activeStatusFilter !== 'all') {
    if (activeStatusFilter === 'new') {
      list = list.filter(t => t.status === 'new' || t.status === 'waiting_student');
    } else if (activeStatusFilter === 'in_progress') {
      list = list.filter(t => ['in_progress', 'assigned', 'escalated'].includes(t.status));
    } else if (activeStatusFilter === 'resolved') {
      list = list.filter(t => ['resolved', 'closed'].includes(t.status));
    }
  }

  // 3. Filter by category (popular issues)
  if (activeCategoryFilter !== 'all') {
    const catCfg = categoryConfig.find(c => c.key === activeCategoryFilter);
    if (catCfg) {
      list = list.filter(catCfg.match);
    }
  }

  // 4. Filter by student
  if (selectedStudentFilter !== 'all') {
    list = list.filter(t => t.student_id === selectedStudentFilter);
  }

  // 5. Filter by class
  if (selectedClassFilter !== 'all') {
    list = list.filter(t => t.class_id === selectedClassFilter);
  }

  // 6. Search keyword
  if (searchKeyword.trim()) {
    const q = searchKeyword.toLowerCase().trim();
    list = list.filter(t => {
      const studentName = getStudentName(t.student_id).toLowerCase();
      const code = (t.ticket_code || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const hasMatchingMsg = messageData.some(m => m.ticket_id === t.ticket_id && m.content.toLowerCase().includes(q));
      return studentName.includes(q) || code.includes(q) || title.includes(q) || desc.includes(q) || hasMatchingMsg;
    });
  }

  return list;
}

function computeKPIs() {
  const state = getState();
  const user = state.currentUser;
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  let baseTickets = [...ticketData];
  if (isStudent) {
    const currentStudentId = state.currentStudentView || staffId;
    baseTickets = baseTickets.filter(t => t.student_id === currentStudentId);
  } else if (isTeacher && staffId) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teacher_id === staffId).forEach(ca => myClassIds.add(ca.class_id));
    centerClassData.filter(c => c.teacher_id === staffId).forEach(c => myClassIds.add(c.class_id));
    if (staffId === 'STF003') {
      myClassIds.add('CLS_IELTS_FND');
      myClassIds.add('CLS_COMM_01');
      myClassIds.add('CLS_SELF_01');
      myClassIds.add('CLS_NN01');
    } else if (staffId === 'STF004') {
      myClassIds.add('CLS_TRIAL_01');
      myClassIds.add('CLS_B1_01');
      myClassIds.add('CLS003');
      myClassIds.add('CLS005');
    }
    const enrolledStudents = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    baseTickets = baseTickets.filter(t => t.assigned_to === staffId || myClassIds.has(t.class_id || '') || enrolledStudents.has(t.student_id));
  } else if (isTA && staffId) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teaching_assistant_id === staffId).forEach(ca => myClassIds.add(ca.class_id));
    if (staffId === 'STF005') {
      myClassIds.add('CLS_IELTS_FND');
      myClassIds.add('CLS_COMM_01');
      myClassIds.add('CLS_SELF_01');
      myClassIds.add('CLS_NN01');
      myClassIds.add('CLS001');
      myClassIds.add('CLS004');
    } else if (staffId === 'STF006') {
      myClassIds.add('CLS_TRIAL_01');
      myClassIds.add('CLS_B1_01');
      myClassIds.add('CLS002');
      myClassIds.add('CLS003');
      myClassIds.add('CLS005');
    }
    const enrolledStudents = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    baseTickets = baseTickets.filter(t => t.assigned_to === staffId || myClassIds.has(t.class_id || '') || enrolledStudents.has(t.student_id));
  }

  const total = baseTickets.length;
  const waiting = baseTickets.filter(t => t.status === 'new' || t.status === 'waiting_student').length;
  const inProgress = baseTickets.filter(t => ['in_progress', 'assigned', 'escalated'].includes(t.status)).length;
  const resolved = baseTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;

  return { total, waiting, inProgress, resolved };
}

function getLatestMessage(ticketId: string): SupportMessage | undefined {
  const msgs = messageData.filter(m => m.ticket_id === ticketId);
  return msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
}

// ============================================
// Render Conversation List Cards (Left Column)
// ============================================
function renderConversationCards(tickets: SupportTicket[]): string {
  if (tickets.length === 0) {
    return `
      <div style="padding:48px 20px;text-align:center;color:#7F7A72">
        <div style="font-size:36px;margin-bottom:8px">💬</div>
        <div style="font-weight:700;color:#2D2824;font-size:14px;margin-bottom:4px">Chưa có cuộc trò chuyện nào</div>
        <div style="font-size:12.5px">Không tìm thấy yêu cầu hỗ trợ nào phù hợp với bộ lọc hiện tại.</div>
      </div>
    `;
  }

  return tickets.map(ticket => {
    const student = studentData.find(s => s.student_id === ticket.student_id);
    const studentName = student?.full_name ?? getStudentName(ticket.student_id);
    const initials = student?.avatar_initials || getInitials(studentName);
    const className = getClassName(ticket.class_id);
    const latestMsg = getLatestMessage(ticket.ticket_id);
    const isActive = activeTicketId === ticket.ticket_id;

    // Status badge formatting
    let statusLabel = 'Đang trao đổi';
    let statusBg = '#E0F2FE';
    let statusColor = '#0369A1';

    if (ticket.status === 'new' || ticket.status === 'waiting_student') {
      statusLabel = ticket.status === 'waiting_student' ? 'Chờ học viên' : 'Chờ phản hồi';
      statusBg = '#FEE2E2';
      statusColor = '#DC2626';
    } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
      statusLabel = 'Đã giải quyết';
      statusBg = '#DCFCE7';
      statusColor = '#166534';
    } else if (ticket.status === 'escalated') {
      statusLabel = 'Chuyển cấp';
      statusBg = '#FEF3C7';
      statusColor = '#B45309';
    } else {
      statusLabel = 'Đang trao đổi';
      statusBg = '#E0F2FE';
      statusColor = '#0369A1';
    }

    // Category tag label
    let categoryBadge = 'Hỏi bài';
    if (ticket.category === 'attendance') categoryBadge = 'Xin nghỉ học';
    else if (ticket.category === 'assignment') categoryBadge = 'Bài tập';
    else if (ticket.category === 'score') categoryBadge = 'Điểm số';
    else if (ticket.category === 'schedule') categoryBadge = 'Lịch học';
    else if (ticket.category === 'other') categoryBadge = 'Tài liệu';

    const previewText = latestMsg ? latestMsg.content : (ticket.description || 'Chưa có tin nhắn');

    return `
      <div 
        class="conversation-card ${isActive ? 'active' : ''}" 
        data-ticket-id="${ticket.ticket_id}"
        style="
          padding:14px 16px;
          border-bottom:1px solid #F5EFEB;
          cursor:pointer;
          transition:all 0.15s ease;
          background:${isActive ? '#FDF6F5' : '#FFFFFF'};
          border-left:${isActive ? '4px solid #A93226' : '4px solid transparent'};
        "
      >
        <div style="display:flex;align-items:flex-start;gap:12px">
          <!-- Avatar tròn -->
          <div style="position:relative;flex-shrink:0">
            <div style="width:40px;height:40px;border-radius:50%;background:#FFF8EC;border:1.5px solid #F5DEC2;display:flex;align-items:center;justify-content:center;font-weight:700;color:#A93226;font-size:13px">
              ${initials}
            </div>
            ${ticket.status === 'new' ? `
              <span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:#EF4444;border:2px solid #FFFFFF"></span>
            ` : ''}
          </div>

          <!-- Nội dung tóm tắt -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
              <span style="font-weight:700;font-size:13.5px;color:#2D2824;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px">
                ${studentName}
              </span>
              <span style="font-size:11px;color:#9E968D;flex-shrink:0">
                ${formatTimeAgo(latestMsg?.sent_at || ticket.created_at)}
              </span>
            </div>

            <!-- Dòng tiêu đề & category -->
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="font-size:10.5px;font-weight:700;background:#F5E6E4;color:#A93226;padding:1px 6px;border-radius:4px;flex-shrink:0">
                ${categoryBadge}
              </span>
              <span style="font-size:12px;font-weight:600;color:#524B43;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${ticket.title}
              </span>
            </div>

            <!-- Dòng preview tin nhắn -->
            <div style="font-size:12px;color:${isActive ? '#2D2824' : '#7F7A72'};font-weight:${ticket.status === 'new' ? '600' : '400'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px">
              ${latestMsg?.sender_role !== 'student' ? '<span style="color:#A93226;font-weight:600">Bạn: </span>' : ''}${previewText}
            </div>

            <!-- Footer thẻ: Lớp & Trạng thái -->
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px">
              <span style="color:#9E968D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px">
                ${className}
              </span>
              <span style="background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:99px;font-weight:700;font-size:10.5px">
                ${statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// Render Messenger Thread Pane (Right Column)
// ============================================
function renderMessengerPane(ticket?: SupportTicket | null): string {
  if (!ticket) {
    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;color:#7F7A72;text-align:center">
        <div style="width:72px;height:72px;background:#F5E6E4;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;color:#A93226;margin-bottom:16px">
          💬
        </div>
        <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 6px 0">Chọn một cuộc trò chuyện</h3>
        <p style="font-size:13.5px;max-width:380px;line-height:1.5;margin:0 0 20px 0">
          Chọn một cuộc hội thoại ở danh sách bên trái hoặc bấm nút "Nhắn tin với học viên" để khởi tạo trao đổi mới.
        </p>
        <button class="btn-open-new-chat" style="background:#A93226;color:#FFFFFF;border:none;border-radius:99px;font-weight:700;padding:9px 20px;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
          <span>+</span>
          <span>Nhắn tin với học viên</span>
        </button>
      </div>
    `;
  }

  const state = getState();
  const currentUser = state.currentUser;
  const isStudent = currentUser?.role === 'student';
  const student = studentData.find(s => s.student_id === ticket.student_id);
  const studentName = student?.full_name ?? getStudentName(ticket.student_id);
  const studentInitials = student?.avatar_initials || getInitials(studentName);
  const className = getClassName(ticket.class_id);
  const messages = messageData.filter(m => m.ticket_id === ticket.ticket_id && (!isStudent || !m.is_internal_note));

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return `
    <div style="flex:1;display:flex;flex-direction:column;height:100%;min-width:0;background:#FFFFFF">
      
      <!-- 1. Header Messenger -->
      <div style="padding:14px 22px;border-bottom:1px solid #EAE4D8;background:#FFFDFB;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:12px;min-width:0">
          <div style="position:relative;flex-shrink:0">
            <div style="width:42px;height:42px;border-radius:50%;background:#F5E6E4;border:1.5px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:800;color:#A93226;font-size:14px">
              ${studentInitials}
            </div>
            <span style="position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#10B981;border:2px solid #FFFFFF" title="Đang trực tuyến"></span>
          </div>
          <div style="min-width:0">
            <div style="display:flex;align-items:center;gap:8px">
              <h2 style="font-size:15px;font-weight:800;color:#2D2824;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${studentName}
              </h2>
              <span style="font-size:11px;font-weight:700;color:#7F7A72;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:6px;padding:1px 6px">
                ${student?.student_code || ticket.student_id}
              </span>
            </div>
            <div style="font-size:12px;color:#7F7A72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">
              <span style="font-weight:600;color:#A93226">${ticket.title}</span> · <span>${className}</span>
            </div>
          </div>
        </div>

        <!-- Cụm công cụ trạng thái bên phải -->
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          ${!isStudent ? `
            ${!isResolved ? `
              <button 
                id="btn-quick-resolve" 
                class="btn-messenger-action" 
                data-ticket-id="${ticket.ticket_id}"
                style="background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;border-radius:8px;padding:6px 12px;font-size:12.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px"
                title="Đánh dấu đã giải đáp và đóng ticket"
              >
                <span>✓</span>
                <span>Đã xử lý xong</span>
              </button>
            ` : `
              <button 
                id="btn-quick-reopen" 
                class="btn-messenger-action" 
                data-ticket-id="${ticket.ticket_id}"
                style="background:#FAF7F2;color:#7F7A72;border:1px solid #EAE4D8;border-radius:8px;padding:6px 12px;font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px"
                title="Mở lại cuộc trò chuyện này"
              >
                <span>↻</span>
                <span>Mở lại</span>
              </button>
            `}
            <a 
              href="#/students" 
              style="background:#FAF7F2;color:#2D2824;border:1px solid #EAE4D8;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:4px"
              title="Xem hồ sơ chi tiết của học viên này"
            >
              <span>👤 Hồ sơ HV</span>
            </a>
          ` : `
            ${isResolved ? `
              <button 
                id="btn-student-reopen" 
                data-ticket-id="${ticket.ticket_id}"
                style="background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer"
              >
                Yêu cầu hỗ trợ thêm (48h)
              </button>
            ` : ''}
          `}
        </div>
      </div>

      <!-- 2. Thân hội thoại Messenger (Scrollable) -->
      <div 
        id="messenger-body-container"
        style="flex:1;overflow-y:auto;padding:20px 24px;background:#FAF7F2;display:flex;flex-direction:column;gap:14px"
      >
        <!-- Khung mô tả vấn đề ban đầu -->
        <div style="background:#FFFDFB;border:1px solid #EAE4D8;border-radius:14px;padding:14px 18px;margin-bottom:8px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;font-weight:700;background:#F5E6E4;color:#A93226;padding:2px 8px;border-radius:4px">
                Mã: ${ticket.ticket_code}
              </span>
              <span style="font-size:12.5px;font-weight:700;color:#2D2824">
                Chủ đề: ${ticket.title}
              </span>
            </div>
            <span style="font-size:11px;color:#9E968D">
              Bắt đầu: ${formatDateTime(ticket.created_at)}
            </span>
          </div>
          <div style="font-size:13px;color:#524B43;line-height:1.5">
            ${escapeHtml(ticket.description || '')}
          </div>
        </div>

        <div style="text-align:center;margin:4px 0">
          <span style="font-size:11px;font-weight:600;color:#9E968D;background:#EAE4D8;padding:2px 10px;border-radius:99px">
            Lịch sử trao đổi
          </span>
        </div>

        <!-- Render danh sách tin nhắn Messenger -->
        ${renderMessageBubbles(messages, isStudent)}
      </div>

      <!-- 3. Thanh Quick Response Chips (Gợi ý câu trả lời nhanh) -->
      ${!isStudent ? `
        <div style="background:#FFFDFB;border-top:1px solid #F0EAE1;padding:8px 16px;display:flex;align-items:center;gap:8px;overflow-x:auto;white-space:nowrap;flex-shrink:0">
          <span style="font-size:11px;font-weight:700;color:#7F7A72;flex-shrink:0">⚡ Trả lời nhanh:</span>
          <button class="btn-quick-reply" data-text="Thầy/Cô đã nhận được thông tin, sẽ kiểm tra và phản hồi em ngay nhé! 👌" style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:99px;padding:3px 10px;font-size:11.5px;color:#2D2824;cursor:pointer;transition:all 0.1s ease">
            👌 Đã nhận thông tin
          </button>
          <button class="btn-quick-reply" data-text="Đã duyệt đơn xin nghỉ học & Thầy/Cô đã xếp lịch học bù vào ca tiếp theo cho em nhé! ✅" style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:99px;padding:3px 10px;font-size:11.5px;color:#2D2824;cursor:pointer;transition:all 0.1s ease">
            ✅ Duyệt nghỉ & học bù
          </button>
          <button class="btn-quick-reply" data-text="Em nhớ hoàn thành và nộp bài tập đúng hạn trước 23h hôm nay nhé ⏰" style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:99px;padding:3px 10px;font-size:11.5px;color:#2D2824;cursor:pointer;transition:all 0.1s ease">
            ⏰ Nhắc nộp bài tập
          </button>
          <button class="btn-quick-reply" data-text="Thầy/Cô đã chấm xong và để lại nhận xét chi tiết trong bài nộp của em rồi nhé 📝" style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:99px;padding:3px 10px;font-size:11.5px;color:#2D2824;cursor:pointer;transition:all 0.1s ease">
            📝 Đã chấm bài tập
          </button>
        </div>
      ` : ''}

      <!-- 4. Footer nhập tin nhắn Messenger -->
      <div style="padding:14px 20px;border-top:1px solid #EAE4D8;background:#FFFFFF;flex-shrink:0">
        <div style="border:1.5px solid #EAE4D8;border-radius:16px;background:#FAF7F2;padding:8px 12px;transition:border-color 0.15s ease">
          <textarea 
            id="messenger-reply-input" 
            placeholder="${isStudent ? 'Nhập tin nhắn gửi tới Giảng viên / Trợ giảng... (Enter để gửi, Shift+Enter xuống dòng)' : 'Nhập tin nhắn trao đổi với học viên... (Enter để gửi, Shift+Enter xuống dòng)'}" 
            style="width:100%;min-height:56px;max-height:120px;border:none;background:transparent;outline:none;font-size:13.5px;color:#2D2824;resize:none;line-height:1.45;font-family:inherit"
          ></textarea>
          
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;border-top:1px solid #F0EAE1;padding-top:6px">
            <div>
              ${!isStudent ? `
                <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#7F7A72;cursor:pointer;user-select:none">
                  <input type="checkbox" id="messenger-internal-check" style="accent-color:#A93226;cursor:pointer" />
                  <span>🔒 Lưu dạng ghi chú nội bộ (chỉ GV/TG thấy)</span>
                </label>
              ` : `
                <span style="font-size:11.5px;color:#9E968D">Hệ thống hỗ trợ 24/7 của EduTrack English</span>
              `}
            </div>

            <button 
              id="btn-messenger-send"
              style="background:#A93226;color:#FFFFFF;border:none;border-radius:99px;padding:7px 18px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(169,50,38,0.2);transition:all 0.15s ease"
            >
              <span>Gửi tin</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

// Render message bubbles in Messenger
function renderMessageBubbles(messages: SupportMessage[], isStudentView = false): string {
  if (messages.length === 0) {
    return `
      <div style="text-align:center;padding:24px;color:#9E968D;font-size:13px">
        Chưa có tin nhắn phản hồi nào. Hãy gửi lời chào đầu tiên!
      </div>
    `;
  }

  return messages.map(msg => {
    const isSenderStudent = msg.sender_role === 'student';

    // 1. Ghi chú nội bộ
    if (msg.is_internal_note) {
      if (isStudentView) return ''; // Hide from student
      return `
        <div style="align-self:center;max-width:85%;background:#FFFBEB;border:1px dashed #D97706;border-radius:12px;padding:10px 14px;font-size:12.5px;color:#92400E;margin:4px 0">
          <div style="display:flex;align-items:center;gap:6px;font-weight:700;margin-bottom:3px">
            <span>🔒 Ghi chú nội bộ</span>
            <span style="font-weight:400;color:#B45309">· ${msg.sender_name} (${roleLabels[msg.sender_role] || 'Nhân sự'}) · ${formatDateTime(msg.sent_at)}</span>
          </div>
          <div style="line-height:1.45">${escapeHtml(msg.content)}</div>
        </div>
      `;
    }

    // 2. Tin nhắn từ Học viên (Căn bên trái)
    if (isSenderStudent) {
      const initials = getInitials(msg.sender_name);
      return `
        <div style="display:flex;align-items:flex-start;gap:10px;max-width:76%;align-self:flex-start">
          <div style="width:34px;height:34px;border-radius:50%;background:#FFF8EC;border:1px solid #F5DEC2;color:#A93226;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11.5px;flex-shrink:0">
            ${initials}
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <span style="font-size:12px;font-weight:700;color:#2D2824">${msg.sender_name}</span>
              <span style="font-size:11px;color:#9E968D">${formatTimeAgo(msg.sent_at)}</span>
            </div>
            <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:16px 16px 16px 4px;padding:11px 15px;color:#2D2824;font-size:13.5px;line-height:1.5;box-shadow:0 1px 4px rgba(45,40,36,0.03);word-break:break-word">
              ${escapeHtml(msg.content)}
            </div>
          </div>
        </div>
      `;
    }

    // 3. Tin nhắn từ Giáo viên / Trợ giảng / Quản lý (Căn bên phải)
    const initials = getInitials(msg.sender_name);
    return `
      <div style="display:flex;align-items:flex-start;gap:10px;max-width:76%;align-self:flex-end;flex-direction:row-reverse">
        <div style="width:34px;height:34px;border-radius:50%;background:#A93226;color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11.5px;flex-shrink:0">
          ${initials}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="font-size:11px;color:#9E968D">${formatTimeAgo(msg.sent_at)}</span>
            <span style="font-size:12px;font-weight:700;color:#A93226">${msg.sender_name}</span>
          </div>
          <div style="background:#A93226;color:#FFFFFF;border-radius:16px 16px 4px 16px;padding:11px 15px;font-size:13.5px;line-height:1.5;box-shadow:0 2px 8px rgba(169,50,38,0.18);word-break:break-word">
            ${escapeHtml(msg.content)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// Main Support Page Render
// ============================================
export function renderSupportPage(): string {
  const state = getState();
  const user = state.currentUser;
  const isStudent = user?.role === 'student';

  // Check URL query params from hash, e.g. #/support?studentId=SV002 or #/support?ticketId=TK008
  const hash = window.location.hash;
  if (hash.includes('?')) {
    const queryStr = hash.split('?')[1];
    const params = new URLSearchParams(queryStr);
    const paramStudentId = params.get('studentId');
    const paramTicketId = params.get('ticketId');
    if (paramStudentId) {
      selectedStudentFilter = paramStudentId;
      activeStatusFilter = 'all';
      activeCategoryFilter = 'all';
      selectedClassFilter = 'all';
      searchKeyword = '';

      const ticket = getOrCreateTicketForStudent(paramStudentId);
      activeTicketId = ticket.ticket_id;
    }
    if (paramTicketId) {
      activeTicketId = paramTicketId;
      activeStatusFilter = 'all';
      activeCategoryFilter = 'all';
      searchKeyword = '';
    }
  }

  const tickets = getFilteredTickets();
  const kpis = computeKPIs();

  // Ensure activeTicketId belongs to current filtered tickets
  if (!activeTicketId || !tickets.some(t => t.ticket_id === activeTicketId)) {
    activeTicketId = tickets.length > 0 ? tickets[0].ticket_id : null;
  }

  const activeTicket = activeTicketId ? ticketData.find(t => t.ticket_id === activeTicketId) : undefined;

  // Available students and classes for dropdowns
  let availableClasses: Array<{ class_id: string; class_name: string }> = centerClassData.length > 0 ? centerClassData : classData;
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  let availableStudents = studentData.filter(s => s.status === 'active');
  if (isStudent) {
    const studentId = state.currentStudentView || user?.staff_id;
    const enrolledClassIds = new Set(enrollmentData.filter(e => e.student_id === studentId).map(e => e.class_id));
    availableClasses = availableClasses.filter(c => enrolledClassIds.has(c.class_id));
  } else if (isTeacher && user?.staff_id) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teacher_id === user.staff_id).forEach(ca => myClassIds.add(ca.class_id));
    centerClassData.filter(c => c.teacher_id === user.staff_id).forEach(c => myClassIds.add(c.class_id));
    const enrolledIds = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    availableStudents = availableStudents.filter(s => enrolledIds.has(s.student_id));
  } else if (isTA && user?.staff_id) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teaching_assistant_id === user.staff_id).forEach(ca => myClassIds.add(ca.class_id));
    const enrolledIds = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    availableStudents = availableStudents.filter(s => enrolledIds.has(s.student_id));
  }

  // Counts for popular issues
  const baseTicketsForCat = isStudent
    ? ticketData.filter(t => t.student_id === (state.currentStudentView || user?.staff_id))
    : ticketData;

  const countAll = baseTicketsForCat.length;
  const countAttendance = baseTicketsForCat.filter(t => t.category === 'attendance').length;
  const countAssignment = baseTicketsForCat.filter(t => t.category === 'assignment' || t.category === 'score').length;
  const countLesson = baseTicketsForCat.filter(t => t.category === 'lesson').length;
  const countSchedule = baseTicketsForCat.filter(t => t.category === 'schedule').length;
  const countOther = baseTicketsForCat.filter(t => t.category === 'other').length;

  return `
    <div class="support-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>💬</span>
            <span>${isStudent ? 'Hỗ trợ & Tin nhắn học tập' : 'Hỗ trợ & Tin nhắn học viên'}</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            ${isStudent ? 'Kênh giải đáp học tập, xin nghỉ học & trao đổi trực tiếp với Thầy Cô.' : 'Kênh liên lạc, giải đáp học tập và chăm sóc học viên trực tiếp theo thời gian thực.'}
          </div>
        </div>

        <button 
          id="btn-open-new-chat" 
          class="btn-open-new-chat"
          style="background:#A93226;color:#FFFFFF;border:none;border-radius:99px;font-weight:700;padding:10px 22px;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(169,50,38,0.2);transition:all 0.15s ease"
        >
          <span style="font-size:16px;line-height:1">+</span>
          <span>${isStudent ? 'Gửi yêu cầu / Nhắn tin mới' : 'Nhắn tin với học viên'}</span>
        </button>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Clickable (Click được để lọc nhanh) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:20px">
        
        <!-- Thẻ 1: Tổng cuộc trò chuyện -->
        <div 
          class="dash-kpi-card ${activeStatusFilter === 'all' ? 'active' : ''}" 
          data-status="all"
          style="
            background:${activeStatusFilter === 'all' ? '#FDF2F0' : '#FFFFFF'};
            border:${activeStatusFilter === 'all' ? '2px solid #A93226' : '1px solid #EAE4D8'};
            border-radius:18px;
            padding:18px 22px;
            cursor:pointer;
            transition:all 0.15s ease;
            box-shadow:${activeStatusFilter === 'all' ? '0 4px 16px rgba(169,50,38,0.12)' : '0 2px 8px rgba(45,40,36,0.02)'};
            transform:${activeStatusFilter === 'all' ? 'translateY(-2px)' : 'none'};
          "
        >
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1">
              ${kpis.total}
            </div>
            ${activeStatusFilter === 'all' ? `
              <span style="font-size:11px;font-weight:700;color:#A93226;background:#F5E6E4;padding:2px 8px;border-radius:12px;border:1px solid #E8C9C5">
                ● Đang xem
              </span>
            ` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:${activeStatusFilter === 'all' ? '#A93226' : '#7F7A72'}">
            <span>Cuộc hội thoại</span>
            <span style="color:#A93226">›</span>
          </div>
        </div>

        <!-- Thẻ 2: Chờ phản hồi -->
        <div 
          class="dash-kpi-card ${activeStatusFilter === 'new' ? 'active' : ''}" 
          data-status="new"
          style="
            background:${activeStatusFilter === 'new' ? '#FEF2F2' : '#FFFFFF'};
            border:${activeStatusFilter === 'new' ? '2px solid #DC2626' : '1px solid #EAE4D8'};
            border-radius:18px;
            padding:18px 22px;
            cursor:pointer;
            transition:all 0.15s ease;
            box-shadow:${activeStatusFilter === 'new' ? '0 4px 16px rgba(220,38,38,0.15)' : '0 2px 8px rgba(45,40,36,0.02)'};
            transform:${activeStatusFilter === 'new' ? 'translateY(-2px)' : 'none'};
          "
        >
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:32px;font-weight:900;color:#DC2626;line-height:1">
              ${kpis.waiting}
            </div>
            ${activeStatusFilter === 'new' ? `
              <span style="font-size:11px;font-weight:700;color:#DC2626;background:#FEE2E2;padding:2px 8px;border-radius:12px;border:1px solid #FECACA">
                ● Đang lọc
              </span>
            ` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:${activeStatusFilter === 'new' ? '#DC2626' : '#7F7A72'}">
            <span>Chờ phản hồi</span>
            <span style="color:#DC2626">›</span>
          </div>
        </div>

        <!-- Thẻ 3: Đang trao đổi -->
        <div 
          class="dash-kpi-card ${activeStatusFilter === 'in_progress' ? 'active' : ''}" 
          data-status="in_progress"
          style="
            background:${activeStatusFilter === 'in_progress' ? '#FFFBEB' : '#FFFFFF'};
            border:${activeStatusFilter === 'in_progress' ? '2px solid #D97706' : '1px solid #EAE4D8'};
            border-radius:18px;
            padding:18px 22px;
            cursor:pointer;
            transition:all 0.15s ease;
            box-shadow:${activeStatusFilter === 'in_progress' ? '0 4px 16px rgba(217,119,6,0.15)' : '0 2px 8px rgba(45,40,36,0.02)'};
            transform:${activeStatusFilter === 'in_progress' ? 'translateY(-2px)' : 'none'};
          "
        >
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1">
              ${kpis.inProgress}
            </div>
            ${activeStatusFilter === 'in_progress' ? `
              <span style="font-size:11px;font-weight:700;color:#D97706;background:#FEF3C7;padding:2px 8px;border-radius:12px;border:1px solid #FDE68A">
                ● Đang lọc
              </span>
            ` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:${activeStatusFilter === 'in_progress' ? '#D97706' : '#7F7A72'}">
            <span>Đang trao đổi</span>
            <span style="color:#D97706">›</span>
          </div>
        </div>

        <!-- Thẻ 4: Đã giải quyết -->
        <div 
          class="dash-kpi-card ${activeStatusFilter === 'resolved' ? 'active' : ''}" 
          data-status="resolved"
          style="
            background:${activeStatusFilter === 'resolved' ? '#F0FDF4' : '#FFFFFF'};
            border:${activeStatusFilter === 'resolved' ? '2px solid #166534' : '1px solid #EAE4D8'};
            border-radius:18px;
            padding:18px 22px;
            cursor:pointer;
            transition:all 0.15s ease;
            box-shadow:${activeStatusFilter === 'resolved' ? '0 4px 16px rgba(22,101,52,0.15)' : '0 2px 8px rgba(45,40,36,0.02)'};
            transform:${activeStatusFilter === 'resolved' ? 'translateY(-2px)' : 'none'};
          "
        >
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:32px;font-weight:900;color:#166534;line-height:1">
              ${kpis.resolved}
            </div>
            ${activeStatusFilter === 'resolved' ? `
              <span style="font-size:11px;font-weight:700;color:#166534;background:#DCFCE7;padding:2px 8px;border-radius:12px;border:1px solid #BBF7D0">
                ● Đang lọc
              </span>
            ` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:${activeStatusFilter === 'resolved' ? '#166534' : '#7F7A72'}">
            <span>Đã giải quyết</span>
            <span style="color:#166534">›</span>
          </div>
        </div>

      </div>

      <!-- 3. Khối Bộ Lọc Toàn Diện (Học viên & Vấn đề gặp nhiều) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:16px 20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
        
        <!-- Hàng 1: Ô tìm kiếm + Lọc học viên + Lọc lớp -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
          <!-- Ô tìm kiếm -->
          <div style="flex:1;min-width:240px;position:relative">
            <input 
              type="text" 
              id="support-search-input"
              value="${searchKeyword}"
              placeholder="${isStudent ? 'Tìm kiếm nội dung tin nhắn hoặc chủ đề trao đổi...' : 'Tìm theo tên học viên, mã HV hoặc nội dung tin nhắn...'}" 
              style="width:100%;height:38px;padding:0 14px 0 34px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none"
            />
            <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#9E968D;font-size:13px">🔍</span>
          </div>

          ${!isStudent ? `
            <!-- Dropdown chọn học viên cụ thể -->
            <div style="min-width:180px">
              <select 
                id="filter-student-select"
                style="width:100%;height:38px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none;cursor:pointer"
              >
                <option value="all" ${selectedStudentFilter === 'all' ? 'selected' : ''}>Tất cả học viên</option>
                ${availableStudents.map(s => `
                  <option value="${s.student_id}" ${selectedStudentFilter === s.student_id ? 'selected' : ''}>
                    ${s.full_name} (${s.student_code})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Dropdown chọn lớp -->
            <div style="min-width:180px">
              <select 
                id="filter-class-select"
                style="width:100%;height:38px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none;cursor:pointer"
              >
                <option value="all" ${selectedClassFilter === 'all' ? 'selected' : ''}>Tất cả lớp học</option>
                ${availableClasses.map(c => `
                  <option value="${c.class_id}" ${selectedClassFilter === c.class_id ? 'selected' : ''}>
                    ${c.class_name}
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}
        </div>

        <!-- Hàng 2: Vấn đề gặp nhiều (Popular Issue Pills with Counts) -->
        <div style="display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:2px">
          <span style="font-size:12px;font-weight:700;color:#7F7A72;flex-shrink:0">Vấn đề gặp nhiều:</span>
          
          <button 
            class="btn-cat-filter ${activeCategoryFilter === 'all' ? 'active' : ''}" 
            data-cat="all"
            style="${activeCategoryFilter === 'all' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:5px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap"
          >
            Tất cả (${countAll})
          </button>

          <button 
            class="btn-cat-filter ${activeCategoryFilter === 'attendance' ? 'active' : ''}" 
            data-cat="attendance"
            style="${activeCategoryFilter === 'attendance' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:5px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap"
          >
            ● Xin nghỉ học & Học bù (${countAttendance})
          </button>

          <button 
            class="btn-cat-filter ${activeCategoryFilter === 'assignment' ? 'active' : ''}" 
            data-cat="assignment"
            style="${activeCategoryFilter === 'assignment' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:5px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap"
          >
            ● Bài tập & Chấm điểm (${countAssignment})
          </button>

          <button 
            class="btn-cat-filter ${activeCategoryFilter === 'lesson' ? 'active' : ''}" 
            data-cat="lesson"
            style="${activeCategoryFilter === 'lesson' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:5px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap"
          >
            ● Hỏi bài & Ngữ pháp (${countLesson})
          </button>

          <button 
            class="btn-cat-filter ${activeCategoryFilter === 'schedule' ? 'active' : ''}" 
            data-cat="schedule"
            style="${activeCategoryFilter === 'schedule' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:5px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap"
          >
            ● Lịch học & Đổi ca (${countSchedule})
          </button>

          <button 
            class="btn-cat-filter ${activeCategoryFilter === 'other' ? 'active' : ''}" 
            data-cat="other"
            style="${activeCategoryFilter === 'other' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:5px 14px;font-size:12.5px;cursor:pointer;white-space:nowrap"
          >
            ● Học phí & Tài liệu (${countOther})
          </button>
        </div>

      </div>

      <!-- 4. Giao diện 2 Cột chuẩn Messenger (Messenger-style Dual-Pane Layout) -->
      <div 
        id="messenger-container"
        style="
          background:#FFFFFF;
          border:1px solid #EAE4D8;
          border-radius:20px;
          height:calc(100vh - 290px);
          min-height:580px;
          display:flex;
          overflow:hidden;
          box-shadow:0 4px 20px rgba(45,40,36,0.03);
        "
      >
        <!-- Cột Trái: Danh sách cuộc trò chuyện (~380px) -->
        <div style="width:380px;flex-shrink:0;border-right:1px solid #EAE4D8;display:flex;flex-direction:column;background:#FFFDFB">
          <!-- Header danh sách -->
          <div style="padding:14px 18px;border-bottom:1px solid #EAE4D8;display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="font-size:14px;font-weight:800;color:#2D2824">Hộp thư học viên</span>
              ${activeStatusFilter !== 'all' ? `
                <span style="font-size:11px;font-weight:700;background:${activeStatusFilter === 'new' ? '#FEE2E2' : activeStatusFilter === 'in_progress' ? '#FEF3C7' : '#DCFCE7'};color:${activeStatusFilter === 'new' ? '#DC2626' : activeStatusFilter === 'in_progress' ? '#D97706' : '#166534'};padding:1px 8px;border-radius:10px">
                  ${activeStatusFilter === 'new' ? 'Chờ phản hồi' : activeStatusFilter === 'in_progress' ? 'Đang trao đổi' : 'Đã giải quyết'}
                </span>
              ` : ''}
              <span style="font-size:11px;font-weight:700;background:#F5E6E4;color:#A93226;padding:1px 7px;border-radius:99px">
                ${tickets.length}
              </span>
            </div>
            ${activeStatusFilter !== 'all' ? `
              <button 
                id="btn-reset-status-filter" 
                type="button" 
                title="Xem tất cả cuộc trò chuyện"
                style="background:none;border:none;font-size:11.5px;font-weight:700;color:#A93226;cursor:pointer;padding:2px 4px;text-decoration:underline"
              >
                Xem tất cả
              </button>
            ` : ''}
          </div>

          <!-- Danh sách thẻ cuộc hội thoại cuộn được -->
          <div 
            id="conversation-list-container"
            style="flex:1;overflow-y:auto"
          >
            ${renderConversationCards(tickets)}
          </div>
        </div>

        <!-- Cột Phải: Khung Trò Chuyện Messenger (Flex: 1) -->
        <div 
          id="messenger-pane-wrapper" 
          style="flex:1;display:flex;flex-direction:column;min-width:0"
        >
          ${renderMessengerPane(activeTicket)}
        </div>
      </div>

      <!-- Modal Container -->
      <div id="support-modal-container"></div>

    </div>
  `;
}

// ============================================
// Event Binding & Page Controller
// ============================================
export function initSupportPage(): void {
  // 1. KPI Cards click to filter status
  document.querySelectorAll<HTMLElement>('.dash-kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.dataset.status;
      if (status) {
        if (activeStatusFilter === status && status !== 'all') {
          activeStatusFilter = 'all';
        } else {
          activeStatusFilter = status;
        }

        // Reset conflicting sub-filters so the conversation list matches the exact count of this status
        selectedStudentFilter = 'all';
        selectedClassFilter = 'all';
        activeCategoryFilter = 'all';
        searchKeyword = '';

        // Clear query parameters in URL hash so hash doesn't re-lock studentId
        if (window.location.hash.includes('?')) {
          history.replaceState(null, '', '#/support');
        }

        // Auto select the first ticket of the newly filtered list
        const filtered = getFilteredTickets();
        activeTicketId = filtered.length > 0 ? filtered[0].ticket_id : null;

        reRenderSupportPage();
      }
    });
  });

  // Reset filter link in conversation list header
  document.getElementById('btn-reset-status-filter')?.addEventListener('click', () => {
    activeStatusFilter = 'all';
    selectedStudentFilter = 'all';
    selectedClassFilter = 'all';
    activeCategoryFilter = 'all';
    searchKeyword = '';
    const filtered = getFilteredTickets();
    activeTicketId = filtered.length > 0 ? filtered[0].ticket_id : null;
    reRenderSupportPage();
  });

  // 2. Search input handler
  const searchInput = document.getElementById('support-search-input') as HTMLInputElement | null;
  searchInput?.addEventListener('input', () => {
    searchKeyword = searchInput.value;
    updateConversationList();
  });

  // 3. Student select filter
  const studentSelect = document.getElementById('filter-student-select') as HTMLSelectElement | null;
  studentSelect?.addEventListener('change', () => {
    selectedStudentFilter = studentSelect.value;
    reRenderSupportPage();
  });

  // 4. Class select filter
  const classSelect = document.getElementById('filter-class-select') as HTMLSelectElement | null;
  classSelect?.addEventListener('change', () => {
    selectedClassFilter = classSelect.value;
    reRenderSupportPage();
  });

  // 5. Popular category filters
  document.querySelectorAll<HTMLButtonElement>('.btn-cat-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (cat) {
        activeCategoryFilter = cat;
        reRenderSupportPage();
      }
    });
  });

  // 6. Open "+ Nhắn tin với học viên" Modal
  document.querySelectorAll('.btn-open-new-chat').forEach(btn => {
    btn.addEventListener('click', openNewConversationModal);
  });

  // 7. Attach card selection & messenger events
  attachConversationCardEvents();
  attachMessengerPaneEvents();

  // 8. Auto-scroll messenger body to bottom
  scrollMessengerToBottom();
}

function attachConversationCardEvents(): void {
  document.querySelectorAll<HTMLElement>('.conversation-card').forEach(card => {
    card.addEventListener('click', () => {
      const ticketId = card.dataset.ticketId;
      if (ticketId && ticketId !== activeTicketId) {
        activeTicketId = ticketId;
        
        // Update active class on cards
        document.querySelectorAll('.conversation-card').forEach(c => {
          c.classList.remove('active');
          (c as HTMLElement).style.background = '#FFFFFF';
          (c as HTMLElement).style.borderLeft = '4px solid transparent';
        });
        card.classList.add('active');
        card.style.background = '#FDF6F5';
        card.style.borderLeft = '4px solid #A93226';

        // Re-render right pane
        const activeTicket = ticketData.find(t => t.ticket_id === activeTicketId);
        const wrapper = document.getElementById('messenger-pane-wrapper');
        if (wrapper) {
          wrapper.innerHTML = renderMessengerPane(activeTicket);
          attachMessengerPaneEvents();
          scrollMessengerToBottom();
        }
      }
    });
  });
}

function attachMessengerPaneEvents(): void {
  // Send message button
  const sendBtn = document.getElementById('btn-messenger-send');
  sendBtn?.addEventListener('click', sendMessengerReply);

  // Enter to send
  const replyInput = document.getElementById('messenger-reply-input') as HTMLTextAreaElement | null;
  replyInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessengerReply();
    }
  });

  // Quick reply chips
  document.querySelectorAll<HTMLButtonElement>('.btn-quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      if (text && replyInput) {
        replyInput.value = text;
        replyInput.focus();
      }
    });
  });

  // Action buttons: Resolve ticket
  document.getElementById('btn-quick-resolve')?.addEventListener('click', () => {
    if (!activeTicketId) return;
    const ticket = ticketData.find(t => t.ticket_id === activeTicketId);
    if (ticket) {
      ticket.status = 'resolved';
      ticket.resolved_at = new Date().toISOString();
      showToast(`Đã đánh dấu cuộc trò chuyện ${ticket.ticket_code} là Đã xử lý!`, 'success');
      reRenderSupportPage();
    }
  });

  // Action buttons: Reopen ticket
  document.getElementById('btn-quick-reopen')?.addEventListener('click', () => {
    if (!activeTicketId) return;
    const ticket = ticketData.find(t => t.ticket_id === activeTicketId);
    if (ticket) {
      ticket.status = 'in_progress';
      showToast(`Đã mở lại cuộc trò chuyện ${ticket.ticket_code}!`, 'info');
      reRenderSupportPage();
    }
  });

  // Student reopen handler (48h)
  document.getElementById('btn-student-reopen')?.addEventListener('click', () => {
    if (!activeTicketId) return;
    const ticket = ticketData.find(t => t.ticket_id === activeTicketId);
    if (ticket) {
      ticket.status = 'reopened';
      ticket.reopen_count = (ticket.reopen_count || 0) + 1;
      ticket.reopened_at = new Date().toISOString();
      const state = getState();
      const user = state.currentUser;
      messageData.push({
        message_id: `MSG${String(messageData.length + 1).padStart(3, '0')}`,
        ticket_id: activeTicketId,
        sender_id: user?.staff_id || 'SV001',
        sender_name: user?.full_name || 'Học viên',
        sender_role: 'student',
        content: '[Yêu cầu Hỗ trợ thêm] Em vẫn còn thắc mắc về vấn đề này và mong muốn được Thầy/Cô hỗ trợ giải đáp thêm ạ.',
        sent_at: new Date().toISOString(),
        is_internal_note: false,
      });
      showToast('Đã gửi yêu cầu mở lại cuộc trò chuyện thành công!', 'info');
      reRenderSupportPage();
    }
  });
}

function sendMessengerReply(): void {
  const input = document.getElementById('messenger-reply-input') as HTMLTextAreaElement | null;
  const isInternalCheck = document.getElementById('messenger-internal-check') as HTMLInputElement | null;
  const content = input?.value.trim();
  if (!content || !activeTicketId) return;

  const ticket = ticketData.find(t => t.ticket_id === activeTicketId);
  if (!ticket) return;

  const state = getState();
  const user = state.currentUser;
  const isStudent = user?.role === 'student';
  const isInternal = isStudent ? false : (isInternalCheck?.checked || false);

  const newMsgId = `MSG${String(messageData.length + 1).padStart(3, '0')}`;
  const newMsg: SupportMessage = {
    message_id: newMsgId,
    ticket_id: activeTicketId,
    sender_id: user?.staff_id || 'STF003',
    sender_name: user?.full_name || 'Giáo viên',
    sender_role: user?.role || 'teacher',
    content: content,
    sent_at: new Date().toISOString(),
    is_internal_note: isInternal,
  };

  messageData.push(newMsg);

  // Update ticket status
  if (ticket.status === 'new') {
    ticket.status = isStudent ? 'new' : 'in_progress';
  }
  if (!ticket.first_response_at && !isStudent) {
    ticket.first_response_at = new Date().toISOString();
  }

  // Clear inputs
  if (input) input.value = '';
  if (isInternalCheck) isInternalCheck.checked = false;

  // Refresh thread
  const messages = messageData.filter(m => m.ticket_id === activeTicketId && (!isStudent || !m.is_internal_note));
  const bodyContainer = document.getElementById('messenger-body-container');
  if (bodyContainer) {
    // Append or replace messages
    const bubblesHtml = renderMessageBubbles(messages, isStudent);
    // Find the marker
    const marker = `<span style="font-size:11px;font-weight:600;color:#9E968D;background:#EAE4D8;padding:2px 10px;border-radius:99px">Lịch sử trao đổi</span>`;
    const parts = bodyContainer.innerHTML.split(marker);
    if (parts.length >= 2) {
      bodyContainer.innerHTML = parts[0] + marker + '</div>' + bubblesHtml;
    } else {
      bodyContainer.innerHTML = bubblesHtml;
    }
  }

  scrollMessengerToBottom();
  updateConversationList();
  showToast('Đã gửi tin nhắn thành công!', 'success');
}

function scrollMessengerToBottom(): void {
  const container = document.getElementById('messenger-body-container');
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }
}

function updateConversationList(): void {
  const tickets = getFilteredTickets();
  const listContainer = document.getElementById('conversation-list-container');
  if (listContainer) {
    listContainer.innerHTML = renderConversationCards(tickets);
    attachConversationCardEvents();
  }
}

function reRenderSupportPage(): void {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderSupportPage();
    initSupportPage();
  }
}

// ============================================
// Modal "+ Nhắn tin với học viên" (New Chat Modal)
// ============================================
function openNewConversationModal(): void {
  const modalContainer = document.getElementById('support-modal-container');
  if (!modalContainer) return;

  const state = getState();
  const user = state.currentUser;
  const isStudent = user?.role === 'student';
  const currentStudentId = state.currentStudentView || user?.staff_id;
  const currentStudent = studentData.find(s => s.student_id === currentStudentId);

  let availableClasses: Array<{ class_id: string; class_name: string }> = centerClassData.length > 0 ? centerClassData : classData;
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  let availableStudents = studentData.filter(s => s.status === 'active');
  if (isStudent && currentStudentId) {
    const enrolledClassIds = new Set(enrollmentData.filter(e => e.student_id === currentStudentId).map(e => e.class_id));
    availableClasses = availableClasses.filter(c => enrolledClassIds.has(c.class_id));
  } else if (isTeacher && user?.staff_id) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teacher_id === user.staff_id).forEach(ca => myClassIds.add(ca.class_id));
    centerClassData.filter(c => c.teacher_id === user.staff_id).forEach(c => myClassIds.add(c.class_id));
    const enrolledIds = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    availableStudents = availableStudents.filter(s => enrolledIds.has(s.student_id));
  } else if (isTA && user?.staff_id) {
    const myClassIds = new Set<string>();
    classAssignmentData.filter(ca => ca.teaching_assistant_id === user.staff_id).forEach(ca => myClassIds.add(ca.class_id));
    const enrolledIds = new Set(enrollmentData.filter(e => myClassIds.has(e.class_id)).map(e => e.student_id));
    availableStudents = availableStudents.filter(s => enrolledIds.has(s.student_id));
  }

  modalContainer.innerHTML = `
    <div 
      id="new-chat-backdrop" 
      style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(45,40,36,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px"
    >
      <div 
        style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:24px;width:100%;max-width:560px;box-shadow:0 20px 40px rgba(45,40,36,0.15);overflow:hidden;animation:fadeInUp 0.2s ease"
      >
        <!-- Modal Header -->
        <div style="padding:20px 24px;border-bottom:1px solid #EAE4D8;background:#FFFDFB;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:22px">💬</span>
            <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0">
              ${isStudent ? 'Gửi yêu cầu hỗ trợ mới' : 'Bắt đầu cuộc trò chuyện với học viên'}
            </h3>
          </div>
          <button id="btn-close-new-chat-modal" style="background:none;border:none;font-size:20px;color:#7F7A72;cursor:pointer;padding:4px">
            ✕
          </button>
        </div>

        <!-- Modal Form -->
        <form id="new-chat-form" style="padding:24px;display:flex;flex-direction:column;gap:16px">
          
          <!-- Field 1: Học viên -->
          <div>
            <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
              Học viên nhận tin nhắn <span style="color:#A93226">*</span>
            </label>
            ${isStudent && currentStudent ? `
              <input type="hidden" id="modal-chat-student" value="${currentStudent.student_id}" />
              <input type="text" value="${currentStudent.full_name} (${currentStudent.student_code})" disabled style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#7F7A72" />
            ` : `
              <select id="modal-chat-student" required style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none">
                ${availableStudents.map(s => `
                  <option value="${s.student_id}">
                    ${s.full_name} (${s.student_code}) · ${s.campus || 'CS1'}
                  </option>
                `).join('')}
              </select>
            `}
          </div>

          <!-- Field 2: Lớp học & Vấn đề -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                Lớp học liên quan <span style="color:#A93226">*</span>
              </label>
              <select id="modal-chat-class" required style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none">
                ${availableClasses.map(c => `
                  <option value="${c.class_id}">${c.class_name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
                Vấn đề / Chủ đề <span style="color:#A93226">*</span>
              </label>
              <select id="modal-chat-category" required style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none">
                <option value="attendance">Xin nghỉ học & Học bù</option>
                <option value="assignment" selected>Bài tập & Chấm điểm</option>
                <option value="lesson">Hỏi bài & Ngữ pháp</option>
                <option value="score">Điểm số & Đánh giá</option>
                <option value="schedule">Lịch học & Đổi ca</option>
                <option value="other">Học phí & Tài liệu</option>
              </select>
            </div>
          </div>

          <!-- Field 3: Tiêu đề cuộc trò chuyện -->
          <div>
            <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
              Tiêu đề cuộc trò chuyện <span style="color:#A93226">*</span>
            </label>
            <input 
              type="text" 
              id="modal-chat-title" 
              placeholder="VD: Nhắc nhở nộp bài Writing Task 1, Hướng dẫn phát âm..." 
              required
              style="width:100%;height:40px;padding:0 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none"
            />
          </div>

          <!-- Field 4: Nội dung tin nhắn đầu tiên -->
          <div>
            <label style="display:block;font-size:12.5px;font-weight:700;color:#2D2824;margin-bottom:6px">
              ${isStudent ? 'Nội dung tin nhắn / câu hỏi gửi Thầy Cô' : 'Nội dung tin nhắn gửi tới học viên'} <span style="color:#A93226">*</span>
            </label>
            <textarea 
              id="modal-chat-message" 
              placeholder="${isStudent ? 'Nhập chi tiết câu hỏi hoặc vấn đề em cần hỗ trợ...' : 'Nhập nội dung tin nhắn chi tiết...'}" 
              required
              style="width:100%;min-height:90px;padding:10px 12px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;font-size:13px;color:#2D2824;outline:none;resize:vertical;font-family:inherit"
            ></textarea>
          </div>

          <!-- Modal Footer -->
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:8px">
            <button 
              type="button" 
              id="btn-cancel-new-chat"
              style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:99px;padding:8px 18px;font-size:13px;font-weight:600;color:#7F7A72;cursor:pointer"
            >
              Hủy
            </button>
            <button 
              type="submit"
              style="background:#A93226;color:#FFFFFF;border:none;border-radius:99px;padding:8px 22px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(169,50,38,0.2)"
            >
              ${isStudent ? 'Gửi yêu cầu ngay' : 'Bắt đầu cuộc trò chuyện'}
            </button>
          </div>

        </form>
      </div>
    </div>
  `;

  // Close modal handlers
  const closeModal = () => { modalContainer.innerHTML = ''; };
  document.getElementById('btn-close-new-chat-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-new-chat')?.addEventListener('click', closeModal);
  document.getElementById('new-chat-backdrop')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('new-chat-backdrop')) closeModal();
  });

  // Submit form handler
  const form = document.getElementById('new-chat-form') as HTMLFormElement | null;
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = (document.getElementById('modal-chat-student') as HTMLSelectElement).value;
    const classId = (document.getElementById('modal-chat-class') as HTMLSelectElement).value;
    const category = (document.getElementById('modal-chat-category') as HTMLSelectElement).value as TicketCategory;
    const title = (document.getElementById('modal-chat-title') as HTMLInputElement).value.trim();
    const content = (document.getElementById('modal-chat-message') as HTMLTextAreaElement).value.trim();

    if (!title || !content) return;

    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 3600000);
    const nextTicketNum = ticketData.length + 1;
    const newTicketId = `TK${String(nextTicketNum).padStart(3, '0')}`;
    const newTicketCode = `SUP-2026-${String(nextTicketNum).padStart(3, '0')}`;

    const newTicket: SupportTicket = {
      ticket_id: newTicketId,
      ticket_code: newTicketCode,
      student_id: studentId,
      class_id: classId,
      category: category,
      title: title,
      description: content,
      priority: 'medium',
      status: 'in_progress',
      assigned_to: user?.staff_id || 'STF003',
      created_at: now.toISOString(),
      first_response_at: now.toISOString(),
      sla_deadline: deadline.toISOString(),
      is_sla_breached: false,
    };

    // First message in thread
    const newMsgId = `MSG${String(messageData.length + 1).padStart(3, '0')}`;
    const newMsg: SupportMessage = {
      message_id: newMsgId,
      ticket_id: newTicketId,
      sender_id: user?.staff_id || (isStudent ? studentId : 'STF003'),
      sender_name: user?.full_name || (isStudent ? getStudentName(studentId) : 'Giáo viên'),
      sender_role: user?.role || (isStudent ? 'student' : 'teacher'),
      content: content,
      sent_at: now.toISOString(),
      is_internal_note: false,
    };

    ticketData.unshift(newTicket);
    messageData.push(newMsg);

    activeTicketId = newTicketId;
    closeModal();
    reRenderSupportPage();
    showToast(isStudent ? 'Đã gửi câu hỏi / yêu cầu hỗ trợ thành công!' : `Đã bắt đầu cuộc trò chuyện mới với ${getStudentName(studentId)}!`, 'success');
  });
}
