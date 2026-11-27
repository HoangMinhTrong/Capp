// ============================================
// EduTrack English - Trang Tổng quan ("Dashboard")
// Warm Minimalist Design System
// ============================================

import { studentData, staffData, classData, centerClassData, classAssignmentData, studentAssignmentData, studentSubmissionData } from '../data.ts';
import { showToast } from '../utils.ts';
import { getState } from '../state.ts';

// State for Dashboard filters and tabs
let selectedLevelFilter = 'all';
let filterActiveClassesOnly = true;
let isHealthExplanationOpen = false;
let activeXpTab: 'this_week' | 'last_week' = 'this_week';

// State for Teacher Dashboard
let teacherClassFilter: 'all' | 'regular' | 'self_study' | 'communication' | 'trial' = 'all';
let calendarViewMode: 'month' | 'week' | 'day' = 'month';
let calendarCurrentMonth = 'Tháng 11/2026';

// Helper: Calculate countdown to Sunday 23:59:59
function getWeeklyCountdown(): string {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const target = new Date(now);
  target.setDate(now.getDate() + daysUntilSunday);
  target.setHours(23, 59, 59, 999);

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return '⏱ sắp chốt tuần';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;

  if (days > 0) {
    return `⏱ còn ${days} ngày ${hours} giờ`;
  }
  return `⏱ còn ${hours} giờ`;
}

// Helper: Generate SVG smooth curve for 12 months student chart
function renderStudentTrendChart(): string {
  const months = ['T12', 'T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11'];
  
  // Data points for 12 months: realistic progressive growth of active students
  const data = [28, 34, 38, 42, 45, 52, 58, 63, 66, 72, 78, 86];

  const svgWidth = 460;
  const svgHeight = 150;
  const paddingLeft = 30;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 30;

  const width = svgWidth - paddingLeft - paddingRight;
  const height = svgHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(3, ...data);
  const stepX = width / (data.length - 1);

  const points = data.map((val, idx) => {
    const x = paddingLeft + idx * stepX;
    const y = paddingTop + height - (val / maxVal) * height;
    return { x, y, val, month: months[idx] };
  });

  // Generate SVG path d string
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX1 = prev.x + (curr.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (curr.x - prev.x) / 2;
    const cpY2 = curr.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }

  // Area fill under the line
  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + height} L ${points[0].x} ${paddingTop + height} Z`;

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%;height:150px;overflow:visible">
      <defs>
        <linearGradient id="terracottaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#A93226" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#A93226" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${svgWidth - paddingRight}" y2="${paddingTop}" stroke="#F2ECE1" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${paddingTop + height / 2}" x2="${svgWidth - paddingRight}" y2="${paddingTop + height / 2}" stroke="#F2ECE1" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${paddingTop + height}" x2="${svgWidth - paddingRight}" y2="${paddingTop + height}" stroke="#EAE4D8" />

      <!-- Area fill -->
      <path d="${areaD}" fill="url(#terracottaGradient)" />

      <!-- Main Line -->
      <path d="${pathD}" fill="none" stroke="#A93226" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Data Dots & Labels -->
      ${points.map((p, i) => `
        <circle cx="${p.x}" cy="${p.y}" r="${p.val > 0 ? 5 : 3}" fill="${p.val > 0 ? '#A93226' : '#FFFFFF'}" stroke="#A93226" stroke-width="2" />
        ${p.val > 0 ? `
          <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="11" font-weight="800" fill="#A93226">${p.val}</text>
        ` : ''}
        ${i % 2 === 0 || i === points.length - 1 ? `
          <text x="${p.x}" y="${paddingTop + height + 18}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#7F7A72">${p.month}</text>
        ` : ''}
      `).join('')}
    </svg>
  `;
}

// Helper: Generate XP Leaderboard table content
function renderXpLeaderboardTable(tab: 'this_week' | 'last_week'): string {
  const thisWeekData = [
    { rank: 1, medal: '🥇', name: 'Nguyễn Hồng Nhung', code: 'HV2026-NN', class: 'IELTS Foundation 5.5', exercises: '14/14 bài', xp: '680 XP', streak: '🔥 7 ngày', avatar: 'HN' },
    { rank: 2, medal: '🥈', name: 'Nguyễn Thị Thảo Nguyên', code: 'HV2026-001', class: 'IELTS Foundation 5.5', exercises: '13/14 bài', xp: '590 XP', streak: '🔥 5 ngày', avatar: 'TN' },
    { rank: 3, medal: '🥉', name: 'Trần Thu Hà', code: 'HV2026-002', class: 'Tiếng Anh B1', exercises: '12/12 bài', xp: '510 XP', streak: '🔥 6 ngày', avatar: 'TH' },
    { rank: 4, medal: '4', name: 'Võ Thanh Nhân', code: 'HV2026-006', class: 'English Communication', exercises: '10/11 bài', xp: '460 XP', streak: '🔥 4 ngày', avatar: 'VN' },
    { rank: 5, medal: '5', name: 'Lê Quang Huy', code: 'HV2026-003', class: 'TOEIC 4 Kỹ năng', exercises: '9/10 bài', xp: '420 XP', streak: '🔥 3 ngày', avatar: 'LH' },
  ];

  const lastWeekData = [
    { rank: 1, medal: '🥇', name: 'Nguyễn Thị Thảo Nguyên', code: 'HV2026-001', class: 'IELTS Foundation 5.5', exercises: '16/16 bài', xp: '720 XP', streak: '🔥 7 ngày', avatar: 'TN' },
    { rank: 2, medal: '🥈', name: 'Nguyễn Hồng Nhung', code: 'HV2026-NN', class: 'IELTS Foundation 5.5', exercises: '15/16 bài', xp: '690 XP', streak: '🔥 7 ngày', avatar: 'HN' },
    { rank: 3, medal: '🥉', name: 'Võ Thanh Nhân', code: 'HV2026-006', class: 'English Communication', exercises: '14/15 bài', xp: '580 XP', streak: '🔥 5 ngày', avatar: 'VN' },
    { rank: 4, medal: '4', name: 'Trần Thu Hà', code: 'HV2026-002', class: 'Tiếng Anh B1', exercises: '12/12 bài', xp: '530 XP', streak: '🔥 5 ngày', avatar: 'TH' },
    { rank: 5, medal: '5', name: 'Đặng Thị Oanh', code: 'HV2026-007', class: 'IELTS 5.5 - Lớp 01', exercises: '11/12 bài', xp: '470 XP', streak: '🔥 4 ngày', avatar: 'DO' },
  ];

  const list = tab === 'this_week' ? thisWeekData : lastWeekData;

  return `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
        <thead>
          <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em">
            <th style="padding:10px 8px;width:44px;text-align:center">HẠNG</th>
            <th style="padding:10px 12px">HỌC VIÊN</th>
            <th style="padding:10px 12px">LỚP HỌC</th>
            <th style="padding:10px 12px;text-align:center">TIẾN ĐỘ BÀI TẬP</th>
            <th style="padding:10px 12px;text-align:center">CHUỖI HỌC TẬP</th>
            <th style="padding:10px 14px;text-align:right">XP TUẦN</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(s => `
            <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" onmouseover="this.style.background='#FAF7F2'" onmouseout="this.style.background='transparent'">
              <td style="padding:12px 8px;text-align:center;font-weight:800;font-size:${s.rank <= 3 ? '16px' : '13px'};color:${s.rank === 1 ? '#D97706' : (s.rank === 2 ? '#64748B' : (s.rank === 3 ? '#B45309' : '#7F7A72'))}">
                ${s.medal}
              </td>
              <td style="padding:12px 12px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:32px;height:32px;border-radius:50%;background:#F5E6E4;border:1px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:700;color:#A93226;font-size:11.5px;flex-shrink:0">
                    ${s.avatar}
                  </div>
                  <div>
                    <span style="font-weight:700;color:#2D2824">${s.name}</span>
                    <div style="font-size:11px;color:#A8A29A">${s.code}</div>
                  </div>
                </div>
              </td>
              <td style="padding:12px 12px;color:#7F7A72;font-weight:500">
                ${s.class}
              </td>
              <td style="padding:12px 12px;text-align:center">
                <span style="background:#F0FDF4;color:#166534;font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:6px">
                  ${s.exercises}
                </span>
              </td>
              <td style="padding:12px 12px;text-align:center;font-weight:700;color:#D97706;font-size:12px">
                ${s.streak}
              </td>
              <td style="padding:12px 14px;text-align:right">
                <span style="font-size:13.5px;font-weight:900;color:#A93226;background:#FDF0EE;padding:4px 10px;border-radius:8px">
                  +${s.xp}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderCalendarDays(): string {
  if (calendarViewMode === 'day') {
    return `
      <div style="grid-column: span 7; background:#FFFFFF; border:1px solid #EAE4D8; border-radius:14px; padding:20px">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid #EAE4D8; padding-bottom:12px">
          <div>
            <div style="font-size:16px; font-weight:800; color:#2D2824">Thứ Sáu, 20 tháng 11, 2026</div>
            <div style="font-size:12.5px; color:#166534; font-weight:600; margin-top:2px">● Hôm nay (Không có ca dạy)</div>
          </div>
          <span style="background:#F0FDF4; color:#166534; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:700">0 Ca dạy</span>
        </div>
        <div style="padding:16px; background:#FAF7F2; border-radius:10px; border:1px dashed #EAE4D8; text-align:center; color:#7F7A72; font-size:13.5px">
          Hôm nay bạn không có lịch đứng lớp. Ca dạy tiếp theo sẽ diễn ra vào <strong style="color:#A93226">Thứ Hai (23/11/2026) lúc 19:12</strong> tại Phòng 204.
        </div>
      </div>
    `;
  }

  if (calendarViewMode === 'week') {
    const weekDays = [
      { day: 16, dow: 'T2', hasSession: false },
      { day: 17, dow: 'T3', hasSession: false },
      { day: 18, dow: 'T4', hasSession: false },
      { day: 19, dow: 'T5', hasSession: true, sessionText: '19:12 IELTS Foundation 5.5...' },
      { day: 20, dow: 'T6', isToday: true, hasSession: false },
      { day: 21, dow: 'T7', hasSession: false },
      { day: 22, dow: 'CN', hasSession: false },
    ];

    return weekDays.map(item => `
      <div style="border:${item.isToday ? '2px solid #166534' : '1px solid #EAE4D8'}; border-radius:12px; background:#FFFFFF; min-height:120px; padding:8px; display:flex; flex-direction:column; box-shadow:${item.isToday ? '0 0 0 1px #166534' : 'none'}">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px">
          ${item.isToday ? `
            <div style="width:24px; height:24px; border-radius:50%; background:#166534; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px">
              ${item.day}
            </div>
            <span style="font-size:11px; font-weight:700; color:#166534">Hôm nay</span>
          ` : `
            <span style="font-size:13px; font-weight:700; color:#2D2824">${item.day}</span>
          `}
        </div>
        ${item.hasSession ? `
          <div 
            style="background:#FDF0EE; border-left:3px solid #A93226; border-radius:4px; padding:4px 6px; font-size:11.5px; font-weight:600; color:#A93226; margin-top:auto; white-space:nowrap; overflow:hidden; text-overflow:ellipsis"
            title="19:12 - 22:12 · IELTS Foundation 5.5"
          >
            ${item.sessionText}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // Month view (default)
  const calendarCells = [
    // Week 1 (Oct 26 - Nov 1)
    { day: 26, isOther: true },
    { day: 27, isOther: true },
    { day: 28, isOther: true },
    { day: 29, isOther: true },
    { day: 30, isOther: true },
    { day: 31, isOther: true },
    { day: 1, isOther: false },

    // Week 2 (Nov 2 - Nov 8)
    { day: 2, isOther: false },
    { day: 3, isOther: false },
    { day: 4, isOther: false },
    { day: 5, isOther: false },
    { day: 6, isOther: false },
    { day: 7, isOther: false },
    { day: 8, isOther: false },

    // Week 3 (Nov 9 - Nov 15)
    { day: 9, isOther: false },
    { day: 10, isOther: false },
    { day: 11, isOther: false },
    { day: 12, isOther: false },
    { day: 13, isOther: false },
    { day: 14, isOther: false },
    { day: 15, isOther: false },

    // Week 4 (Nov 16 - Nov 22)
    { day: 16, isOther: false },
    { day: 17, isOther: false },
    { day: 18, isOther: false },
    { day: 19, isOther: false, session: '19:12 IELTS Foundation 5.5...' },
    { day: 20, isOther: false, isToday: true },
    { day: 21, isOther: false },
    { day: 22, isOther: false },

    // Week 5 (Nov 23 - Nov 29)
    { day: 23, isOther: false, session: '19:12 IELTS Foundation 5.5...' },
    { day: 24, isOther: false },
    { day: 25, isOther: false, session: '19:12 IELTS Foundation 5.5...' },
    { day: 26, isOther: false },
    { day: 27, isOther: false, session: '19:12 IELTS Foundation 5.5...' },
    { day: 28, isOther: false },
    { day: 29, isOther: false },

    // Week 6 (Nov 30 - Dec 6)
    { day: 30, isOther: false, session: '19:12 IELTS Foundation 5.5...' },
    { day: 1, isOther: true },
    { day: 2, isOther: true },
    { day: 3, isOther: true },
    { day: 4, isOther: true },
    { day: 5, isOther: true },
    { day: 6, isOther: true },
  ];

  return calendarCells.map(c => `
    <div style="border:${c.isToday ? '2px solid #166534' : '1px solid #EAE4D8'}; border-radius:12px; background:#FFFFFF; min-height:85px; padding:6px 8px; display:flex; flex-direction:column; box-shadow:${c.isToday ? '0 0 0 1px #166534' : 'none'}; opacity:${c.isOther ? '0.45' : '1'}">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px">
        ${c.isToday ? `
          <div style="width:24px; height:24px; border-radius:50%; background:#166534; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px">
            ${c.day}
          </div>
        ` : `
          <span style="font-size:12.5px; font-weight:${c.isOther ? '500' : '600'}; color:${c.isOther ? '#7F7A72' : '#2D2824'}">
            ${c.day}
          </span>
        `}
      </div>

      ${c.session ? `
        <div 
          style="background:#FDF0EE; border-left:3px solid #A93226; border-radius:4px; padding:3px 5px; font-size:11px; font-weight:600; color:#A93226; line-height:1.2; margin-top:auto; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" 
          title="${c.session}"
        >
          ${c.session}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function renderTeacherDashboardPage(user: any): string {
  const teacherId = user.staff_id || 'STF003';

  // 1. Classes assigned to this teacher
  const assignedClassIds = new Set<string>();
  classAssignmentData
    .filter(ca => ca.teacher_id === teacherId)
    .forEach(ca => assignedClassIds.add(ca.class_id));

  centerClassData
    .filter(c => c.teacher_id === teacherId)
    .forEach(c => assignedClassIds.add(c.class_id));

  classData
    .filter(c => c.author_name?.includes(user.full_name))
    .forEach(c => assignedClassIds.add(c.class_id));

  if (teacherId === 'STF003' || user.email === 'cuong.le@edu.vn') {
    assignedClassIds.add('CLS_IELTS_FND');
    assignedClassIds.add('CLS_NN01');
    assignedClassIds.add('CLS001');
    assignedClassIds.add('CLS002');
    assignedClassIds.add('CLS004');
  } else if (teacherId === 'STF004') {
    assignedClassIds.add('CLS003');
    assignedClassIds.add('CLS005');
  }

  // Teacher's classes
  const myClasses = centerClassData.filter(c => assignedClassIds.has(c.class_id) || c.teacher_id === teacherId);

  // Filtered classes according to teacherClassFilter
  const displayClasses = myClasses.filter(c => {
    if (teacherClassFilter === 'all') return true;
    return c.class_type === teacherClassFilter;
  });

  // Dynamic counts for 5 filter buttons:
  const countAll = myClasses.length;
  const countRegular = myClasses.filter(c => c.class_type === 'regular').length;
  const countSelfStudy = myClasses.filter(c => c.class_type === 'self_study').length;
  const countCommunication = myClasses.filter(c => c.class_type === 'communication').length;
  const countTrial = myClasses.filter(c => c.class_type === 'trial').length;

  // 2. Teacher KPIs
  const openClassesCount = myClasses.filter(c => c.status === 'in_progress').length;
  const totalStudents = myClasses.reduce((sum, c) => sum + (c.current_students || 0), 0);
  const todayClassesCount = myClasses.some(c => c.class_id === 'CLS_NN01') ? 1 : 0;
  
  // Real-time synchronization: Dynamic count of student submissions waiting for this teacher to grade
  const teacherAssignments = studentAssignmentData.filter(a => assignedClassIds.has(a.class_id));
  const teacherAssignmentIds = new Set(teacherAssignments.map(a => a.id));
  const needGradingCount = studentSubmissionData.filter(s => teacherAssignmentIds.has(s.assignment_id) && s.status === 'submitted').length;

  return `
    <div class="teacher-dashboard-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header chào mừng cá nhân hóa -->
      <div style="margin-bottom:24px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
          Chào, ${user.full_name} 🏫
        </h1>
        <div style="font-size:14px;color:#7F7A72;font-weight:500">
          Tổng quan giảng dạy
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Giảng dạy (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        
        <!-- Thẻ 1: Lớp đang mở (nền kem hồng nhạt, gạch chân đỏ đất dày ở đáy) -->
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${openClassesCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Lớp đang mở
          </div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <!-- Thẻ 2: Học viên (nền trắng kem, số vàng nghệ) -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${totalStudents}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Học viên
          </div>
        </div>

        <!-- Thẻ 3: Lớp hôm nay (nền trắng kem, số xanh lá đậm) -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${todayClassesCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Lớp hôm nay
          </div>
        </div>

        <!-- Thẻ 4: Cần chấm (nền trắng kem, số xanh lá đậm, bấm chuyển sang Chấm bài) -->
        <div 
          id="kpi-card-need-grading"
          style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(45,40,36,0.02)"
          title="Bấm để chuyển sang mục Chấm bài"
        >
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${needGradingCount}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Cần chấm</span>
            <span style="font-size:14px;color:#166534">›</span>
          </div>
        </div>

      </div>

      <!-- 3. Khối "Lớp của tôi" (thẻ trắng bo góc lớn) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px;margin-bottom:24px;box-shadow:0 2px 12px rgba(45,40,36,0.02)">
        <h2 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 16px 0">
          Lớp của tôi
        </h2>

        <!-- Hàng 5 nút lọc dạng thẻ bo tròn có đếm số lượng động -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
          <button 
            class="btn-t-filter ${teacherClassFilter === 'all' ? 'active' : ''}" 
            data-filter="all"
            style="${teacherClassFilter === 'all' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
          >
            Tất cả (${countAll})
          </button>
          <button 
            class="btn-t-filter ${teacherClassFilter === 'regular' ? 'active' : ''}" 
            data-filter="regular"
            style="${teacherClassFilter === 'regular' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
          >
            Lớp thường (${countRegular})
          </button>
          <button 
            class="btn-t-filter ${teacherClassFilter === 'self_study' ? 'active' : ''}" 
            data-filter="self_study"
            style="${teacherClassFilter === 'self_study' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
          >
            Lớp tự học (${countSelfStudy})
          </button>
          <button 
            class="btn-t-filter ${teacherClassFilter === 'communication' ? 'active' : ''}" 
            data-filter="communication"
            style="${teacherClassFilter === 'communication' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
          >
            Lớp giao tiếp (${countCommunication})
          </button>
          <button 
            class="btn-t-filter ${teacherClassFilter === 'trial' ? 'active' : ''}" 
            data-filter="trial"
            style="${teacherClassFilter === 'trial' 
              ? 'background:#F5E6E4;border:1.5px solid #A93226;color:#A93226;font-weight:700;' 
              : 'background:#FAF7F2;border:1px solid #EAE4D8;color:#7F7A72;font-weight:600;'}border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
          >
            Lớp học thử (${countTrial})
          </button>
        </div>

        <!-- Bảng danh sách lớp của giáo viên gồm 6 cột -->
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13.5px">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:12px;font-weight:700">
                <th style="padding:10px 14px;text-align:left">LỚP</th>
                <th style="padding:10px 14px;text-align:center">HỌC VIÊN</th>
                <th style="padding:10px 14px;text-align:left">TIẾN ĐỘ</th>
                <th style="padding:10px 14px;text-align:left">BUỔI KẾ</th>
                <th style="padding:10px 14px;text-align:center">MÃ LỚP</th>
                <th style="padding:10px 14px;text-align:center">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              ${displayClasses.length === 0 ? `
                <tr>
                  <td colspan="6" style="padding:32px;text-align:center;color:#7F7A72">
                    Không có lớp học nào trong danh mục này.
                  </td>
                </tr>
              ` : displayClasses.map(c => `
                <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.1s ease">
                  <!-- 1. LỚP -->
                  <td style="padding:16px 14px;vertical-align:middle">
                    <a 
                      href="#/classes?classId=${c.class_id === 'CLS_IELTS_FND' ? 'CLS_NN01' : c.class_id}"
                      style="color:#A93226;font-weight:700;font-size:14px;text-decoration:none;display:inline-block;margin-bottom:2px"
                      title="Bấm để mở chi tiết lớp & trình chiếu bài giảng"
                    >
                      ${c.class_name}
                    </a>
                    <div style="font-size:12px;color:#7F7A72">
                      ${c.course_name}
                    </div>
                  </td>

                  <!-- 2. HỌC VIÊN -->
                  <td style="padding:16px 14px;text-align:center;vertical-align:middle;font-weight:700;color:#2D2824">
                    ${c.current_students || 1}
                  </td>

                  <!-- 3. TIẾN ĐỘ -->
                  <td style="padding:16px 14px;vertical-align:middle">
                    <div style="display:flex;align-items:center;gap:10px">
                      <div style="width:65px;height:6px;background:#EAE4D8;border-radius:99px;overflow:hidden">
                        <div style="width:${Math.round(((c.completed_sessions || 1) / (c.total_sessions || 15)) * 100)}%;height:100%;background:#A93226;border-radius:99px"></div>
                      </div>
                      <span style="font-size:12.5px;font-weight:600;color:#7F7A72">
                        ${c.completed_sessions || 1}/${c.total_sessions || 15}
                      </span>
                    </div>
                  </td>

                  <!-- 4. BUỔI KẾ -->
                  <td style="padding:16px 14px;vertical-align:middle;color:#7F7A72;font-size:13px;font-weight:500">
                    3 ngày nữa · dự kiến 1
                  </td>

                  <!-- 5. MÃ LỚP -->
                  <td style="padding:16px 14px;text-align:center;vertical-align:middle">
                    <div style="display:inline-flex;align-items:center;gap:6px;background:#FAF7F2;border:1px solid #EAE4D8;border-radius:6px;padding:3px 8px">
                      <span style="font-family:monospace;font-weight:700;color:#2D2824;font-size:12.5px">${c.class_code}</span>
                      <button 
                        class="btn-copy-class-code" 
                        data-code="${c.class_code}" 
                        title="Sao chép mã lớp" 
                        style="background:none;border:none;cursor:pointer;color:#7F7A72;padding:0;display:flex;align-items:center"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </td>

                  <!-- 6. TRẠNG THÁI -->
                  <td style="padding:16px 14px;text-align:center;vertical-align:middle">
                    <span style="background:#E0F2FE;color:#0369A1;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700;display:inline-block">
                      ${c.class_type === 'regular' ? 'Lớp thường' : (c.class_type === 'self_study' ? 'Lớp tự học' : (c.class_type === 'communication' ? 'Lớp giao tiếp' : 'Lớp học thử'))}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. Khối "Lịch dạy" cá nhân hóa (thẻ trắng bo góc lớn) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px;box-shadow:0 2px 12px rgba(45,40,36,0.02)">
        
        <!-- Header thẻ -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">📅</span>
            <h2 style="font-size:18px;font-weight:800;color:#2D2824;margin:0">Lịch dạy</h2>
          </div>
          <a href="#/schedule" style="color:#A93226;font-weight:700;font-size:13.5px;text-decoration:none;cursor:pointer">
            Mở lịch →
          </a>
        </div>

        <!-- Thanh điều hướng lịch -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <!-- Bên trái: 3 nút chuyển chế độ xem dạng pill -->
          <div style="display:flex;align-items:center;gap:6px">
            <button 
              class="btn-cal-view ${calendarViewMode === 'month' ? 'active' : ''}" 
              data-view="month"
              style="${calendarViewMode === 'month' 
                ? 'background:#A93226;color:#FFFFFF;border:none;' 
                : 'background:transparent;color:#7F7A72;border:1px solid #EAE4D8;'}font-weight:700;border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
            >
              Tháng
            </button>
            <button 
              class="btn-cal-view ${calendarViewMode === 'week' ? 'active' : ''}" 
              data-view="week"
              style="${calendarViewMode === 'week' 
                ? 'background:#A93226;color:#FFFFFF;border:none;' 
                : 'background:transparent;color:#7F7A72;border:1px solid #EAE4D8;'}font-weight:600;border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
            >
              Tuần
            </button>
            <button 
              class="btn-cal-view ${calendarViewMode === 'day' ? 'active' : ''}" 
              data-view="day"
              style="${calendarViewMode === 'day' 
                ? 'background:#A93226;color:#FFFFFF;border:none;' 
                : 'background:transparent;color:#7F7A72;border:1px solid #EAE4D8;'}font-weight:600;border-radius:99px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all 0.15s ease"
            >
              Ngày
            </button>
          </div>

          <!-- Bên phải: Nút ←, Tháng 11/2026, →, Hôm nay -->
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn-cal-nav" data-action="prev" style="width:32px;height:32px;border:1px solid #EAE4D8;background:#FFFFFF;border-radius:8px;font-weight:700;color:#2D2824;cursor:pointer;display:flex;align-items:center;justify-content:center">
              ‹
            </button>
            <span style="font-weight:700;color:#2D2824;font-size:14px;padding:0 6px">
              ${calendarCurrentMonth}
            </span>
            <button class="btn-cal-nav" data-action="next" style="width:32px;height:32px;border:1px solid #EAE4D8;background:#FFFFFF;border-radius:8px;font-weight:700;color:#2D2824;cursor:pointer;display:flex;align-items:center;justify-content:center">
              ›
            </button>
            <button class="btn-cal-nav" data-action="today" style="border:1px solid #EAE4D8;background:#FAF7F2;border-radius:8px;padding:5px 14px;font-size:13px;font-weight:600;color:#2D2824;cursor:pointer;margin-left:4px">
              Hôm nay
            </button>
          </div>
        </div>

        <!-- Lưới lịch 7 cột (T2 đến CN) -->
        <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:8px;margin-bottom:16px">
          
          <!-- Tiêu đề 7 thứ trong tuần -->
          ${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(dow => `
            <div style="text-align:center;font-size:12.5px;font-weight:700;color:#7F7A72;padding:6px 0;border-bottom:1px solid #EAE4D8;margin-bottom:4px">
              ${dow}
            </div>
          `).join('')}

          <!-- Danh sách các ô ngày tháng 11/2026 -->
          ${renderCalendarDays()}

        </div>

        <!-- Chú thích màu lớp ở đáy lịch (Legend) -->
        <div style="display:flex;align-items:center;gap:16px;padding-top:14px;border-top:1px solid #EAE4D8;font-size:12.5px;color:#7F7A72">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#A93226"></span>
            <span style="font-weight:600;color:#2D2824">IELTS Foundation 5.5 — Giáo trình mẫu</span>
          </div>
        </div>

      </div>

    </div>
  `;
}

export function renderDashboardPage(): string {
  const state = getState();
  const user = state.currentUser;
  if (user?.role === 'teacher') {
    return renderTeacherDashboardPage(user);
  }
  if (user?.role === 'teaching_assistant') {
    return renderTaDashboardPage(user);
  }
  return renderAdminDashboardPage();
}

function renderTaDashboardPage(user: any): string {
  const taId = user.staff_id || 'STF005';

  // 1. Classes assigned to this Teaching Assistant
  const assignedClassIds = new Set<string>();
  classAssignmentData
    .filter(ca => ca.teaching_assistant_id === taId)
    .forEach(ca => assignedClassIds.add(ca.class_id));

  // Default demo mappings per TA
  if (taId === 'STF005' || user.email === 'em.hoang@edu.vn') {
    assignedClassIds.add('CLS_IELTS_FND');
    assignedClassIds.add('CLS_COMM_01');
    assignedClassIds.add('CLS_SELF_01');
    assignedClassIds.add('CLS_NN01');
    assignedClassIds.add('CLS001');
    assignedClassIds.add('CLS004');
  } else if (taId === 'STF006' || user.email === 'phuong.vo@edu.vn') {
    assignedClassIds.add('CLS_TRIAL_01');
    assignedClassIds.add('CLS_B1_01');
    assignedClassIds.add('CLS002');
    assignedClassIds.add('CLS003');
    assignedClassIds.add('CLS005');
  }

  const myClasses = centerClassData.filter(c => assignedClassIds.has(c.class_id));

  // KPIs
  const openClassesCount = myClasses.filter(c => c.status === 'in_progress').length;
  const totalStudents = myClasses.reduce((sum, c) => sum + (c.current_students || 0), 0);
  const pendingAttendanceCount = 1;
  const pendingTicketsCount = 2;

  return `
    <div class="ta-dashboard-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- 1. Header chào mừng cá nhân hóa -->
      <div style="margin-bottom:24px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
          Chào, ${user.full_name} 📋
        </h1>
        <div style="font-size:14px;color:#7F7A72;font-weight:500">
          Tổng quan phân công Trợ giảng
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Trợ giảng -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${openClassesCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Lớp phụ trách</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${totalStudents}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Học viên theo dõi</div>
        </div>

        <a href="#/attendance" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;text-decoration:none;display:block;box-shadow:0 2px 8px rgba(45,40,36,0.02);transition:all 0.15s ease">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${pendingAttendanceCount}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Cần điểm danh</span>
            <span style="font-size:14px;color:#166534">›</span>
          </div>
        </a>

        <a href="#/support" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;text-decoration:none;display:block;box-shadow:0 2px 8px rgba(45,40,36,0.02);transition:all 0.15s ease">
          <div style="font-size:32px;font-weight:900;color:#2563EB;line-height:1;margin-bottom:8px">
            ${pendingTicketsCount}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Hỏi đáp chờ hỗ trợ</span>
            <span style="font-size:14px;color:#2563EB">›</span>
          </div>
        </a>
      </div>

      <!-- 3. Danh sách lớp học trợ giảng -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px;margin-bottom:24px;box-shadow:0 2px 12px rgba(45,40,36,0.02)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 4px 0">
              Lớp học được phân công trợ giảng (${myClasses.length})
            </h2>
            <div style="font-size:13px;color:#7F7A72">Theo dõi sĩ số, thực hiện điểm danh và hỗ trợ học tập theo ca học</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px">
          ${myClasses.map(c => `
            <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:16px;padding:18px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <span style="background:#F5E6E4;color:#A93226;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px;border:1px solid #F0D5D2">${c.class_code}</span>
                  <span style="font-size:12px;color:#7F7A72;font-weight:600">${c.campus || 'CS1'}</span>
                </div>
                <h3 style="font-size:15px;font-weight:800;color:#2D2824;margin:0 0 6px 0">${c.class_name}</h3>
                <div style="font-size:12.5px;color:#7F7A72;margin-bottom:12px">
                  📅 ${c.schedule || 'Lịch trong tuần'} · 👥 Sĩ số: <strong>${c.current_students || 0}/${c.max_students || 20}</strong>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;padding-top:12px;border-top:1px dashed #EAE4D8">
                <a href="#/attendance?classId=${c.class_id}" style="flex:1;text-align:center;background:#A93226;color:#FFFFFF;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">
                  Điểm danh
                </a>
                <a href="#/students?classId=${c.class_id}" style="flex:1;text-align:center;background:#FFFFFF;border:1px solid #EAE4D8;color:#2D2824;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">
                  Học viên
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderAdminDashboardPage(): string {
  const activeStudents = studentData.filter(s => s.status === 'active');
  const activeStudentsCount = activeStudents.length || studentData.length || 1;

  const openClasses = centerClassData.filter(c => c.status === 'in_progress');
  const openClassesCount = openClasses.length;

  const teachers = staffData.filter(s => s.role === 'teacher' && s.is_active);
  const teacherCount = teachers.length;

  // Fill rate
  let totalCurrentStudents = 0;
  let totalMaxStudents = 0;
  centerClassData.forEach(c => {
    totalCurrentStudents += c.current_students || 0;
    totalMaxStudents += c.max_students || 0;
  });
  const fillRateStr = totalMaxStudents > 0 
    ? `${Math.round((totalCurrentStudents / totalMaxStudents) * 100)}%` 
    : '—';

  // 2. Class Level Stats for Chart 2
  const levelCounts: Record<string, number> = {
    'IELTS 5.5': 0,
    'Giao tiếp': 0,
    'TOEIC': 0,
    'Lớp học thử': 0,
  };

  openClasses.forEach(c => {
    const name = (c.class_name + ' ' + c.course_name).toLowerCase();
    if (c.class_type === 'trial' || name.includes('thử') || name.includes('trial')) {
      levelCounts['Lớp học thử'] = (levelCounts['Lớp học thử'] || 0) + 1;
    } else if (name.includes('ielts')) {
      levelCounts['IELTS 5.5'] = (levelCounts['IELTS 5.5'] || 0) + 1;
    } else if (name.includes('comm') || name.includes('giao tiếp') || c.class_type === 'communication') {
      levelCounts['Giao tiếp'] = (levelCounts['Giao tiếp'] || 0) + 1;
    } else if (name.includes('toeic')) {
      levelCounts['TOEIC'] = (levelCounts['TOEIC'] || 0) + 1;
    } else {
      levelCounts['IELTS 5.5'] = (levelCounts['IELTS 5.5'] || 0) + 1;
    }
  });

  // Distinct levels for dropdown filter
  const distinctLevels = Array.from(new Set(centerClassData.map(c => {
    if (c.course_name.includes('IELTS')) return 'IELTS 5.5';
    if (c.course_name.includes('Communication') || c.class_type === 'communication') return 'English Communication';
    if (c.class_type === 'trial') return 'Lớp học thử';
    return c.course_name || 'Khác';
  })));

  // Filtered classes for Class Management Table
  const filteredClasses = centerClassData.filter(c => {
    if (filterActiveClassesOnly && c.status !== 'in_progress') return false;
    if (selectedLevelFilter !== 'all') {
      const level = c.course_name.includes('IELTS') ? 'IELTS 5.5' 
        : (c.course_name.includes('Communication') || c.class_type === 'communication' ? 'English Communication' : 'Lớp học thử');
      if (level !== selectedLevelFilter) return false;
    }
    return true;
  });

  // Teacher Ranking Data
  const teacherRankingList = teachers.map((t, idx) => {
    const assignedClassIds = classAssignmentData
      .filter(ca => ca.teacher_id === t.staff_id)
      .map(ca => ca.class_id);
    const myClasses = centerClassData.filter(c => assignedClassIds.includes(c.class_id) || c.teacher_id === t.staff_id);
    const myOpenClasses = myClasses.filter(c => c.status === 'in_progress');
    const myStudentCount = myOpenClasses.reduce((sum, c) => sum + (c.current_students || 0), 0);

    const isCuong = t.staff_id === 'STF003';
    return {
      rank: idx + 1,
      staff_id: t.staff_id,
      full_name: t.full_name,
      avatar_initials: t.avatar_initials || t.full_name.slice(0, 2).toUpperCase(),
      class_count: myOpenClasses.length || (isCuong ? 3 : 2),
      student_count: myStudentCount || (isCuong ? 48 : 26),
      avg_score: isCuong ? '8.6' : '8.5',
      satisfaction: isCuong ? '98% (4.9⭐)' : '96% (4.8⭐)',
      sessions_per_month: isCuong ? '36 buổi' : '24 buổi',
      hours_per_month: isCuong ? '72h' : '48h',
      seniority: isCuong ? '2.0 năm' : '1.5 năm',
    };
  });

  return `
    <div class="dashboard-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang -->
      <div style="margin-bottom:24px">
        <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
          Tổng quan
        </h1>
        <div style="font-size:14px;color:#7F7A72;font-weight:500">
          EduTrack English · sức khỏe & vận hành
        </div>
      </div>

      <!-- 2. Hàng 8 Thẻ KPI (2 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        
        <!-- Hàng 1 (Có dấu > để điều hướng) -->
        
        <!-- Thẻ 1: Học viên đang học > -->
        <div 
          class="dash-kpi-card" 
          data-link="#/students"
          style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(45,40,36,0.02)"
        >
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${activeStudentsCount}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Học viên đang học</span>
            <span style="font-size:14px;color:#A93226">›</span>
          </div>
        </div>

        <!-- Thẻ 2: Lớp đang mở > -->
        <div 
          class="dash-kpi-card" 
          data-link="#/classes"
          style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(45,40,36,0.02)"
        >
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${openClassesCount}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Lớp đang mở</span>
            <span style="font-size:14px;color:#D97706">›</span>
          </div>
        </div>

        <!-- Thẻ 3: Giáo viên > -->
        <div 
          class="dash-kpi-card" 
          data-link="#/teachers"
          style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 8px rgba(45,40,36,0.02)"
        >
          <div style="font-size:32px;font-weight:900;color:#CA8A04;line-height:1;margin-bottom:8px">
            ${teacherCount}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Giáo viên</span>
            <span style="font-size:14px;color:#CA8A04">›</span>
          </div>
        </div>

        <!-- Thẻ 4: Tỷ lệ lấp đầy -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#059669;line-height:1;margin-bottom:8px">
            ${fillRateStr}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">
            Tỷ lệ lấp đầy
          </div>
        </div>

        <!-- Hàng 2 (Chỉ số hoạt động) -->
        
        <!-- Thẻ 5: Điểm TB bài tập -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#991B1B;line-height:1;margin-bottom:8px">
            8.5
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Điểm TB bài tập</span>
            <span style="font-size:11px;font-weight:700;color:#166534;background:#F0FDF4;padding:2px 6px;border-radius:6px">+0.3đ</span>
          </div>
        </div>

        <!-- Thẻ 6: Chuyên cần TB -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#059669;line-height:1;margin-bottom:8px">
            89.4%
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Chuyên cần TB</span>
            <span style="font-size:11px;font-weight:700;color:#059669;background:#E2F6ED;padding:2px 6px;border-radius:6px">≥85%</span>
          </div>
        </div>

        <!-- Thẻ 7: Tỷ lệ làm bài -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#92400E;line-height:1;margin-bottom:8px">
            91.6%
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Tỷ lệ làm bài</span>
            <span style="font-size:11px;font-weight:700;color:#92400E;background:#FEF3C7;padding:2px 6px;border-radius:6px">24/26 bài</span>
          </div>
        </div>

        <!-- Thẻ 8: Sức khỏe TT -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#CA8A04;line-height:1;margin-bottom:8px">
            88
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#7F7A72">
            <span>Sức khỏe TT</span>
            <span style="font-size:11px;font-weight:700;color:#166534;background:#F0FDF4;padding:2px 6px;border-radius:6px">Đạt chuẩn</span>
          </div>
        </div>

      </div>

      <!-- 3. Khối Sức khỏe trung tâm -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px 28px;margin-bottom:24px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:20px">
          Sức khỏe trung tâm
        </div>

        <!-- Chia 2 phần Trái - Phải -->
        <div style="display:flex;gap:24px;align-items:stretch;margin-bottom:20px;flex-wrap:wrap">
          
          <!-- Cột trái: Khung dọc nền be nhạt -->
          <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:16px;padding:28px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:140px;flex-shrink:0">
            <div style="font-size:52px;font-weight:900;color:#2D2824;line-height:1">
              88
            </div>
            <div style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:0.06em;margin-top:8px;text-align:center">
              / 100 · TỐT
            </div>
          </div>

          <!-- Cột phải: Lưới 7 thẻ tiêu chí (4 hàng trên, 3 hàng dưới) -->
          <div style="flex:1;min-width:320px;display:flex;flex-direction:column;gap:12px">
            
            <!-- Hàng trên (4 thẻ) -->
            <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px">
              
              <!-- 1. Duy trì cuối khóa (15%) -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px 14px">
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">94%</div>
                <div style="font-size:12px;font-weight:700;color:#2D2824;margin-bottom:2px">Duy trì cuối khóa</div>
                <div style="font-size:11px;color:#7F7A72">trọng số 15%</div>
              </div>

              <!-- 2. Tái ghi danh (15%) -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px 14px">
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">82%</div>
                <div style="font-size:12px;font-weight:700;color:#2D2824;margin-bottom:2px">Tái ghi danh</div>
                <div style="font-size:11px;color:#7F7A72">trọng số 15%</div>
              </div>

              <!-- 3. Hài lòng giảng viên (20%) -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px 14px">
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">96%</div>
                <div style="font-size:12px;font-weight:700;color:#2D2824;margin-bottom:2px">Hài lòng giảng viên</div>
                <div style="font-size:11px;color:#7F7A72">trọng số 20%</div>
              </div>

              <!-- 4. Hài lòng giáo trình (20%) -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px 14px">
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">92%</div>
                <div style="font-size:12px;font-weight:700;color:#2D2824;margin-bottom:2px">Hài lòng giáo trình</div>
                <div style="font-size:11px;color:#7F7A72">trọng số 20%</div>
              </div>

            </div>

            <!-- Hàng dưới (3 thẻ) -->
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px">
              
              <!-- 5. Điểm TB trên lớp (10%) -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px 14px">
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">8.5</div>
                <div style="font-size:12px;font-weight:700;color:#2D2824;margin-bottom:2px">Điểm TB trên lớp</div>
                <div style="font-size:11px;color:#7F7A72">trọng số 10%</div>
              </div>

              <!-- 6. Chuyên cần (10%) -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px 14px">
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">89.4%</div>
                <div style="font-size:12px;font-weight:700;color:#2D2824;margin-bottom:2px">Chuyên cần</div>
                <div style="font-size:11px;color:#7F7A72">trọng số 10%</div>
              </div>

              <!-- 7. Tỷ lệ lấp đầy lớp (10%) -->
              <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px 14px">
                <div style="font-size:18px;font-weight:800;color:#2D2824;margin-bottom:2px">84.6%</div>
                <div style="font-size:12px;font-weight:700;color:#2D2824;margin-bottom:2px">Tỷ lệ lấp đầy lớp</div>
                <div style="font-size:11px;color:#7F7A72">trọng số 10%</div>
              </div>

            </div>

          </div>

        </div>

        <!-- Hộp giải thích thu gọn/mở rộng -->
        <div style="border-top:1px dashed #F2ECE1;padding-top:14px">
          <button 
            id="btn-toggle-health-explanation" 
            type="button" 
            style="background:none;border:none;padding:0;font-size:13px;font-weight:700;color:#7F7A72;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
          >
            <span>${isHealthExplanationOpen ? '▲' : '▼'}</span>
            <span>ℹ️ Cách tính điểm sức khỏe</span>
          </button>

          <div 
            id="health-explanation-content" 
            style="display:${isHealthExplanationOpen ? 'block' : 'none'};background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:16px 20px;margin-top:12px;font-size:12.5px;color:#7F7A72;line-height:1.6"
          >
            <div style="font-weight:700;color:#2D2824;margin-bottom:8px">Định nghĩa 7 tiêu chí đo lường:</div>
            <ul style="margin:0 0 10px 0;padding-left:18px">
              <li><strong>1. Duy trì cuối khóa (15%):</strong> Tỷ lệ học viên hoàn thành đến hết khóa học, không bỏ ngang giữa chừng.</li>
              <li><strong>2. Tái ghi danh (15%):</strong> Tỷ lệ học viên tiếp tục đăng ký khóa học kế tiếp tại trung tâm.</li>
              <li><strong>3. Hài lòng giảng viên (20%):</strong> Điểm trung bình đánh giá mức độ hài lòng về chất lượng giảng dạy từ học viên.</li>
              <li><strong>4. Hài lòng giáo trình (20%):</strong> Điểm đánh giá chất lượng tài liệu, học liệu và lộ trình bài học.</li>
              <li><strong>5. Điểm TB trên lớp (10%):</strong> Điểm trung bình các bài tập, bài quiz và bài kiểm tra định kỳ.</li>
              <li><strong>6. Chuyên cần (10%):</strong> Tỷ lệ đi học đầy đủ và đúng giờ của học viên trong các buổi học.</li>
              <li><strong>7. Tỷ lệ lấp đầy lớp (10%):</strong> Tỷ lệ học viên đăng ký thực tế trên tổng quy mô sĩ số tối đa của lớp học.</li>
            </ul>
            <div style="font-weight:700;color:#A93226;border-top:1px dashed #EAE4D8;padding-top:8px">
              Điểm tổng = trung bình có trọng số của các tiêu chí CÓ dữ liệu (trọng số chia lại cho phần còn lại). Chưa gồm: XP tự học.
            </div>
          </div>
        </div>

        <!-- 2 dòng ghi chú màu xám dưới chân thẻ -->
        <div style="margin-top:16px;font-size:12px;color:#A8A29A;display:flex;flex-direction:column;gap:4px">
          <div>· Dữ liệu sức khỏe tổng hợp tự động từ các lớp đang hoạt động, 2 giảng viên (ThS. Lê Minh Cường, Cô Phạm Thị Dung) và 2 trợ giảng.</div>
          <div>· Điểm tổng kết: 88/100 (Đạt tiêu chuẩn vàng đào tạo chất lượng cao EduTrack).</div>
        </div>

      </div>

      <!-- 4. Khối Hài lòng học viên (CSAT) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;margin-bottom:24px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="font-size:18px;font-weight:800;color:#2D2824">
            Hài lòng học viên (CSAT)
          </div>
          <div style="display:inline-flex;align-items:center;gap:8px;background:#F0FDF4;border:1px solid #BBF7D0;padding:6px 14px;border-radius:99px">
            <span style="font-size:15px;font-weight:900;color:#166534">4.8 / 5.0 ⭐</span>
            <span style="font-size:12px;font-weight:600;color:#166534">(96% đánh giá tích cực · 14 phản hồi)</span>
          </div>
        </div>

        <!-- 3 Thước đo CSAT thành phần -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:14px;margin-bottom:20px">
          <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px">
            <div style="font-size:12px;font-weight:700;color:#7F7A72;margin-bottom:4px">Chất lượng giảng viên</div>
            <div style="display:flex;align-items:baseline;gap:6px">
              <span style="font-size:22px;font-weight:900;color:#A93226">4.9</span>
              <span style="font-size:12px;font-weight:600;color:#7F7A72">/ 5.0 (98%)</span>
            </div>
            <div style="width:100%;height:5px;background:#EAE4D8;border-radius:99px;margin-top:8px;overflow:hidden">
              <div style="width:98%;height:100%;background:#A93226;border-radius:99px"></div>
            </div>
          </div>

          <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px">
            <div style="font-size:12px;font-weight:700;color:#7F7A72;margin-bottom:4px">Giáo trình &amp; Tài liệu</div>
            <div style="display:flex;align-items:baseline;gap:6px">
              <span style="font-size:22px;font-weight:900;color:#D97706">4.7</span>
              <span style="font-size:12px;font-weight:600;color:#7F7A72">/ 5.0 (94%)</span>
            </div>
            <div style="width:100%;height:5px;background:#EAE4D8;border-radius:99px;margin-top:8px;overflow:hidden">
              <div style="width:94%;height:100%;background:#D97706;border-radius:99px"></div>
            </div>
          </div>

          <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px">
            <div style="font-size:12px;font-weight:700;color:#7F7A72;margin-bottom:4px">Trợ giảng &amp; Hỗ trợ học tập</div>
            <div style="display:flex;align-items:baseline;gap:6px">
              <span style="font-size:22px;font-weight:900;color:#059669">4.8</span>
              <span style="font-size:12px;font-weight:600;color:#7F7A72">/ 5.0 (96%)</span>
            </div>
            <div style="width:100%;height:5px;background:#EAE4D8;border-radius:99px;margin-top:8px;overflow:hidden">
              <div style="width:96%;height:100%;background:#059669;border-radius:99px"></div>
            </div>
          </div>
        </div>

        <!-- 3 Thẻ nhận xét thực tế từ học viên -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:14px">
          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between">
            <div style="font-size:12.5px;color:#2D2824;line-height:1.5;margin-bottom:10px;font-style:italic">
              “Thầy Cường dạy phát âm cực chuẩn và chấm bài rất kỹ. Trợ giảng Hoàng Văn Em hỗ trợ giải đáp bài tập 24/7 nhiệt tình.”
            </div>
            <div style="display:flex;align-items:center;gap:8px;border-top:1px dashed #F2ECE1;padding-top:8px">
              <div style="width:24px;height:24px;border-radius:50%;background:#F5E6E4;color:#A93226;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">TN</div>
              <div>
                <div style="font-size:11.5px;font-weight:700;color:#2D2824">Nguyễn Thị Thảo Nguyên</div>
                <div style="font-size:10.5px;color:#7F7A72">Lớp IELTS Foundation 5.5</div>
              </div>
            </div>
          </div>

          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between">
            <div style="font-size:12.5px;color:#2D2824;line-height:1.5;margin-bottom:10px;font-style:italic">
              “Cô Dung giảng dễ hiểu, không khí lớp học vui vẻ tạo nhiều động lực. Bạn trợ giảng Võ Thị Phương nhắc bài đầy đủ.”
            </div>
            <div style="display:flex;align-items:center;gap:8px;border-top:1px dashed #F2ECE1;padding-top:8px">
              <div style="width:24px;height:24px;border-radius:50%;background:#E2F6ED;color:#059669;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">TH</div>
              <div>
                <div style="font-size:11.5px;font-weight:700;color:#2D2824">Trần Thu Hà</div>
                <div style="font-size:10.5px;color:#7F7A72">Lớp Tiếng Anh B1</div>
              </div>
            </div>
          </div>

          <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between">
            <div style="font-size:12.5px;color:#2D2824;line-height:1.5;margin-bottom:10px;font-style:italic">
              “Giáo trình sát thực tế, nhiều bài tập phản xạ nhóm sinh động. Hệ thống nộp bài và xem tiến độ học tập rất rõ ràng.”
            </div>
            <div style="display:flex;align-items:center;gap:8px;border-top:1px dashed #F2ECE1;padding-top:8px">
              <div style="width:24px;height:24px;border-radius:50%;background:#FEF3C7;color:#92400E;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">VN</div>
              <div>
                <div style="font-size:11.5px;font-weight:700;color:#2D2824">Võ Thanh Nhân</div>
                <div style="font-size:10.5px;color:#7F7A72">Lớp English Communication</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Hàng 2 thẻ biểu đồ chia đôi chiều rộng (50% / 50%) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        
        <!-- Thẻ trái: Học viên mới theo tháng -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 26px;box-shadow:0 3px 12px rgba(45,40,36,0.03);display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px">
              Học viên mới theo tháng
            </div>
            ${renderStudentTrendChart()}
          </div>
          <div style="text-align:center;margin-top:14px;font-size:13px;font-weight:700;color:#7F7A72">
            ${activeStudentsCount} HV đang học · +18% tháng này
          </div>
        </div>

        <!-- Thẻ phải: Lớp đang mở theo trình độ -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 26px;box-shadow:0 3px 12px rgba(45,40,36,0.03);display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:18px">
              Lớp đang mở theo trình độ
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:14px">
              ${Object.entries(levelCounts).map(([lvl, count]) => `
                <div style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:14px;padding:16px;text-align:center">
                  <div style="font-size:28px;font-weight:900;color:#A93226;line-height:1;margin-bottom:6px">
                    ${count}
                  </div>
                  <div style="font-size:12.5px;font-weight:700;color:#2D2824">
                    ${lvl}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="text-align:center;margin-top:14px;font-size:12.5px;color:#7F7A72">
            Tổng cộng: <strong>${openClassesCount}</strong> lớp đang hoạt động
          </div>
        </div>

      </div>

      <!-- 6. Bảng Quản lý lớp trên Dashboard -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;margin-bottom:24px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        
        <!-- Header thẻ: Tiêu đề + Dropdown lọc trình độ + Checkbox -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div style="font-size:18px;font-weight:800;color:#2D2824">
            Quản lý lớp
          </div>

          <div style="display:flex;align-items:center;gap:16px">
            <!-- Dropdown lọc trình độ -->
            <select 
              id="dash-class-level-filter" 
              style="height:36px;padding:0 12px;border:1px solid #EAE4D8;border-radius:10px;background:#FAF7F2;font-size:12.5px;color:#2D2824;outline:none;cursor:pointer"
            >
              <option value="all" ${selectedLevelFilter === 'all' ? 'selected' : ''}>Mọi trình độ</option>
              ${distinctLevels.map(lvl => `
                <option value="${lvl}" ${selectedLevelFilter === lvl ? 'selected' : ''}>${lvl}</option>
              `).join('')}
            </select>

            <!-- Checkbox Chỉ lớp đang mở -->
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#2D2824;cursor:pointer">
              <input 
                type="checkbox" 
                id="dash-class-active-only" 
                ${filterActiveClassesOnly ? 'checked' : ''} 
                style="accent-color:#A93226;width:15px;height:15px;cursor:pointer"
              />
              <span>Chỉ lớp đang mở</span>
            </label>
          </div>
        </div>

        <!-- Bảng 10 cột -->
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em">
                <th style="padding:10px 12px">LỚP</th>
                <th style="padding:10px 12px">GIÁO VIÊN</th>
                <th style="padding:10px 12px">TRÌNH ĐỘ</th>
                <th style="padding:10px 12px">TIẾN ĐỘ</th>
                <th style="padding:10px 12px">SĨ SỐ</th>
                <th style="padding:10px 12px">ĐIỂM TB</th>
                <th style="padding:10px 12px">CHUYÊN CẦN</th>
                <th style="padding:10px 12px">LÀM BÀI</th>
                <th style="padding:10px 12px">XP</th>
                <th style="padding:10px 12px">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClasses.length === 0 ? `
                <tr>
                  <td colspan="10" style="padding:32px 12px;text-align:center;color:#7F7A72">
                    Không có lớp nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ` : filteredClasses.map(c => `
                <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" onmouseover="this.style.background='#FAF7F2'" onmouseout="this.style.background='transparent'">
                  <td style="padding:14px 12px">
                    <a href="#/classes/${c.class_id}" style="color:#A93226;font-weight:700;text-decoration:none">
                      ${c.class_name}
                    </a>
                    <div style="font-size:11px;color:#A8A29A;margin-top:2px">${c.class_code}</div>
                  </td>
                  <td style="padding:14px 12px">
                    <a href="#/teachers/${c.teacher_id}" style="color:#A93226;font-weight:700;text-decoration:none">
                      ${c.teacher_name || 'Lê Minh Cường'}
                    </a>
                  </td>
                  <td style="padding:14px 12px;font-weight:600;color:#2D2824">
                    ${c.course_name.includes('IELTS') ? 'IELTS 5.5' : (c.course_name.includes('Comm') ? 'Giao tiếp' : 'Cơ bản')}
                  </td>
                  <td style="padding:14px 12px;color:#7F7A72">
                    ${c.completed_sessions} buổi
                  </td>
                  <td style="padding:14px 12px;font-weight:600;color:#2D2824">
                    ${c.current_students}/${c.max_students}
                  </td>
                  <td style="padding:14px 12px;font-weight:700;color:#2D2824">${c.avg_score || '8.5'}</td>
                  <td style="padding:14px 12px;font-weight:600;color:#059669">${c.class_type === 'regular' ? '92%' : (c.class_type === 'communication' ? '90%' : (c.class_type === 'self_study' ? '88%' : '94%'))}</td>
                  <td style="padding:14px 12px;font-weight:600;color:#92400E">${c.class_type === 'regular' ? '95%' : (c.class_type === 'communication' ? '92%' : (c.class_type === 'self_study' ? '90%' : '96%'))}</td>
                  <td style="padding:14px 12px;font-weight:700;color:#A93226">${c.class_type === 'regular' ? '3,450 XP' : (c.class_type === 'communication' ? '2,820 XP' : (c.class_type === 'self_study' ? '3,120 XP' : '1,960 XP'))}</td>
                  <td style="padding:14px 12px">
                    <span style="background:#E2F6ED;color:#059669;padding:4px 10px;border-radius:9999px;font-size:11.5px;font-weight:700">
                      Đang mở
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Chân bảng -->
        <div style="margin-top:16px;font-size:12.5px;color:#7F7A72">
          Đang xem 1–${filteredClasses.length} trong ${filteredClasses.length} lớp
        </div>

      </div>

      <!-- 7. Bảng xếp hạng XP: 🏆 Toàn trung tâm EduTrack English ⓘ -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;margin-bottom:24px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        
        <!-- Header thẻ -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:gap;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">🏆</span>
            <span style="font-size:17px;font-weight:800;color:#2D2824">
              Toàn trung tâm EduTrack English
            </span>
            <span 
              style="font-size:14px;color:#7F7A72;cursor:help" 
              title="XP tuần được tính từ điểm bài tập nộp đúng hạn, làm bài quiz luyện tập và các hoạt động học tập trên hệ thống trong tuần hiện tại."
            >
              ⓘ
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:14px">
            <span style="font-size:13px;font-weight:600;color:#7F7A72">
              ${getWeeklyCountdown()}
            </span>
            <button 
              id="btn-refresh-xp-leaderboard" 
              type="button" 
              style="background:#FAF7F2;border:1px solid #EAE4D8;border-radius:10px;padding:6px 12px;font-size:12.5px;font-weight:700;color:#2D2824;cursor:pointer;display:inline-flex;align-items:center;gap:4px"
            >
              <span>↻</span>
              <span>Cập nhật</span>
            </button>
          </div>
        </div>

        <!-- Thanh chuyển 2 tab toàn chiều rộng -->
        <div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:1px solid #F2ECE1;padding-bottom:12px">
          <button 
            type="button" 
            class="btn-xp-tab" 
            data-tab="this_week"
            style="
              flex:1;
              height:38px;
              border-radius:10px;
              border:none;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${activeXpTab === 'this_week' 
                ? 'background:#A93226;color:#FFFFFF;' 
                : 'background:#FFFFFF;color:#7F7A72;border:1px solid #EAE4D8;'
              }
            "
          >
            Tuần này
          </button>
          <button 
            type="button" 
            class="btn-xp-tab" 
            data-tab="last_week"
            style="
              flex:1;
              height:38px;
              border-radius:10px;
              border:none;
              font-size:13px;
              font-weight:700;
              cursor:pointer;
              transition:all 0.15s ease;
              ${activeXpTab === 'last_week' 
                ? 'background:#A93226;color:#FFFFFF;' 
                : 'background:#FFFFFF;color:#7F7A72;border:1px solid #EAE4D8;'
              }
            "
          >
            Tuần trước
          </button>
        </div>

        <!-- Danh sách bảng xếp hạng học viên có XP -->
        <div id="xp-leaderboard-content" style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:14px;padding:12px">
          ${renderXpLeaderboardTable(activeXpTab)}
        </div>

      </div>

      <!-- 8. Thẻ Bảng xếp hạng giáo viên -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px 28px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        
        <!-- Header thẻ -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <div style="font-size:18px;font-weight:800;color:#2D2824">
            Bảng xếp hạng giáo viên
          </div>
          <div style="font-size:13px;color:#7F7A72;font-weight:600">
            Thâm niên TB: 1.8 năm
          </div>
        </div>

        <!-- Bảng 9 cột -->
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em">
                <th style="padding:10px 8px;width:36px">#</th>
                <th style="padding:10px 12px">GIÁO VIÊN</th>
                <th style="padding:10px 12px">LỚP</th>
                <th style="padding:10px 12px">HỌC VIÊN</th>
                <th style="padding:10px 12px">ĐIỂM TB</th>
                <th style="padding:10px 12px">HÀI LÒNG</th>
                <th style="padding:10px 12px">BUỔI/THÁNG</th>
                <th style="padding:10px 12px">GIỜ/THÁNG</th>
                <th style="padding:10px 12px">THÂM NIÊN</th>
              </tr>
            </thead>
            <tbody>
              ${teacherRankingList.map(t => `
                <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" onmouseover="this.style.background='#FAF7F2'" onmouseout="this.style.background='transparent'">
                  <td style="padding:14px 8px;font-weight:800;color:#7F7A72">${t.rank}</td>
                  <td style="padding:14px 12px">
                    <div style="display:flex;align-items:center;gap:10px">
                      <div style="width:32px;height:32px;border-radius:50%;background:#F5E6E4;border:1px solid #E8C9C5;display:flex;align-items:center;justify-content:center;font-weight:700;color:#A93226;font-size:12px;flex-shrink:0">
                        ${t.avatar_initials}
                      </div>
                      <a href="#/teachers/${t.staff_id}" style="color:#A93226;font-weight:700;text-decoration:none">
                        ${t.full_name}
                      </a>
                    </div>
                  </td>
                  <td style="padding:14px 12px;font-weight:700;color:#2D2824">${t.class_count}</td>
                  <td style="padding:14px 12px;color:#7F7A72">${t.student_count}</td>
                  <td style="padding:14px 12px;font-weight:700;color:#2D2824">${t.avg_score}</td>
                  <td style="padding:14px 12px;font-weight:600;color:#059669">${t.satisfaction}</td>
                  <td style="padding:14px 12px;color:#7F7A72">${t.sessions_per_month}</td>
                  <td style="padding:14px 12px;color:#7F7A72">${t.hours_per_month}</td>
                  <td style="padding:14px 12px;color:#7F7A72">${t.seniority}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `;
}

function initTeacherDashboardPage(): void {
  // 1. KPI Card 4: Need grading click -> Navigate to grading
  document.getElementById('kpi-card-need-grading')?.addEventListener('click', () => {
    window.location.hash = '#/grading';
  });

  // 2. Class filter buttons (5 buttons)
  document.querySelectorAll<HTMLButtonElement>('.btn-t-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter as any;
      if (filter) {
        teacherClassFilter = filter;
        reRender();
      }
    });
  });

  // 3. Copy class code buttons
  document.querySelectorAll<HTMLButtonElement>('.btn-copy-class-code').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const code = btn.dataset.code || 'Y739FJ';
      navigator.clipboard.writeText(code).then(() => {
        showToast(`Đã sao chép mã lớp: ${code}`, 'success');
      }).catch(() => {
        showToast(`Mã lớp: ${code}`, 'info');
      });
    });
  });

  // 4. Calendar view mode buttons (Month, Week, Day)
  document.querySelectorAll<HTMLButtonElement>('.btn-cal-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view as any;
      if (view) {
        calendarViewMode = view;
        reRender();
      }
    });
  });

  // 5. Calendar navigation buttons
  document.querySelectorAll<HTMLButtonElement>('.btn-cal-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'today') {
        calendarCurrentMonth = 'Tháng 11/2026';
        calendarViewMode = 'month';
        reRender();
        showToast('Đang xem lịch ngày hôm nay (20/11/2026)', 'info');
      } else if (action === 'prev') {
        showToast('Lịch tháng 10/2026', 'info');
      } else if (action === 'next') {
        showToast('Lịch tháng 12/2026', 'info');
      }
    });
  });
}

export function initDashboardPage(): void {
  const state = getState();
  const user = state.currentUser;
  if (user?.role === 'teacher') {
    initTeacherDashboardPage();
    return;
  }
  initAdminDashboardPage();
}

function initAdminDashboardPage(): void {
  // 1. Clickable KPI cards in Row 1
  document.querySelectorAll<HTMLElement>('.dash-kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const link = card.dataset.link;
      if (link) window.location.hash = link;
    });
  });

  // 2. Toggle Health Score Explanation
  const toggleBtn = document.getElementById('btn-toggle-health-explanation');
  toggleBtn?.addEventListener('click', () => {
    isHealthExplanationOpen = !isHealthExplanationOpen;
    const content = document.getElementById('health-explanation-content');
    if (content) {
      content.style.display = isHealthExplanationOpen ? 'block' : 'none';
    }
    const arrow = toggleBtn.querySelector('span');
    if (arrow) {
      arrow.textContent = isHealthExplanationOpen ? '▲' : '▼';
    }
  });

  // 3. Class Table Filters (Level & Active Only)
  const levelSelect = document.getElementById('dash-class-level-filter') as HTMLSelectElement | null;
  levelSelect?.addEventListener('change', () => {
    selectedLevelFilter = levelSelect.value;
    reRender();
  });

  const activeCheck = document.getElementById('dash-class-active-only') as HTMLInputElement | null;
  activeCheck?.addEventListener('change', () => {
    filterActiveClassesOnly = activeCheck.checked;
    reRender();
  });

  // 4. XP Leaderboard Tabs
  document.querySelectorAll<HTMLButtonElement>('.btn-xp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab as 'this_week' | 'last_week';
      if (tab) {
        activeXpTab = tab;
        reRender();
      }
    });
  });

  // 5. Refresh XP Leaderboard
  document.getElementById('btn-refresh-xp-leaderboard')?.addEventListener('click', () => {
    showToast('Đã cập nhật dữ liệu bảng xếp hạng XP!', 'success');
  });
}

function reRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = renderDashboardPage();
    initDashboardPage();
  }
}
