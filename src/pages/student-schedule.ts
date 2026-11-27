// ============================================
// EduTrack - Student Smart Schedule & Makeup Class Matcher
// Thời khóa biểu thông minh & Đặt lịch học bù 1-chạm
// ============================================

import { getState } from '../state.ts';
import {
  studentData, sessionData, classData, attendanceData,
  makeupOptionsData, makeupBookingData
} from '../data.ts';
import { icons, formatDate, showToast } from '../utils.ts';


let currentScheduleTab: 'calendar' | 'makeup' = 'calendar';

export function renderStudentSchedulePage(): string {
  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV001';
  const student = studentData.find(s => s.student_id === studentId) || studentData[0];

  // Find student classes
  const myAttendance = attendanceData.filter(a => a.student_id === student.student_id);
  const myClassIds = new Set(myAttendance.map(a => a.class_id));

  // Sessions
  const allMySessions = sessionData
    .filter(s => myClassIds.has(s.class_id))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Missed sessions (vắng hoặc có phép)
  const missedAtt = myAttendance.filter(a => a.status === 'absent' || a.status === 'excused');
  const missedSessionIds = new Set(missedAtt.map(a => a.session_id));
  const missedSessions = sessionData.filter(s => missedSessionIds.has(s.session_id));

  // Bookings
  const myBookings = makeupBookingData.filter(b => b.student_id === student.student_id);

  return `
    <div class="student-schedule-page" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em">
            Lịch học &amp; Học bù
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            Thời khóa biểu cá nhân &amp; Ghép ca học bù thông minh 1-chạm · Học viên: <strong style="color:#2D2824">${student.full_name}</strong> (${student.student_code})
          </div>
        </div>
        <div>
          <a href="#/student-dashboard" class="btn btn-secondary btn-sm" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:7px 18px;border:1px solid #EAE4D8;background:#ffffff;color:#2D2824;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
            ← Về Tổng quan
          </a>
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento Đồng nhất (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${allMySessions.length}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tổng số buổi học</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${allMySessions.filter(s => s.is_completed).length}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Buổi đã học</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#2563EB;line-height:1;margin-bottom:8px">
            ${allMySessions.filter(s => !s.is_completed).length}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Buổi sắp diễn ra</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#EA580C;line-height:1;margin-bottom:8px">
            ${missedSessions.length}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Buổi cần học bù</div>
        </div>
      </div>

      <!-- Segmented Main Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:var(--space-6);border-bottom:1px solid #ECE3D6;padding-bottom:12px">
        <button type="button" class="btn btn-sm btn-sched-tab ${currentScheduleTab === 'calendar' ? 'btn-primary' : 'btn-ghost'}" data-tab="calendar" style="font-size:13px;padding:8px 18px;border-radius:9999px;font-weight:600;display:inline-flex;align-items:center;gap:8px">
          ${icons.calendar} <span>Thời Khóa Biểu Cá Nhân (${allMySessions.length} buổi)</span>
        </button>
        <button type="button" class="btn btn-sm btn-sched-tab ${currentScheduleTab === 'makeup' ? 'btn-primary' : 'btn-ghost'}" data-tab="makeup" style="font-size:13px;padding:8px 18px;border-radius:9999px;font-weight:600;display:inline-flex;align-items:center;gap:8px">
          ${icons.target} <span>Ghép Ca Học Bù Thông Minh (${makeupOptionsData.length} ca đề xuất)</span>
          ${missedSessions.length > 0 ? `<span class="badge" style="background:#FDEEE9;color:#EA580C;font-size:10px;font-weight:700">${missedSessions.length} buổi cần bù</span>` : ''}
        </button>
      </div>

      ${currentScheduleTab === 'calendar' ? `
        <!-- Calendar / Timetable View -->
        <div class="card" style="border:1px solid var(--border-light);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-sm)">
          <div class="card-header" style="background:var(--gray-50);padding:var(--space-4) var(--space-6);display:flex;justify-content:space-between;align-items:center">
            <h3 style="margin:0;font-size:var(--text-base);font-weight:700">Lộ trình học tập &amp; Lịch các buổi học</h3>
            <span class="badge badge-blue">Niên khóa 2026</span>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Buổi</th>
                  <th>Lớp học</th>
                  <th>Ngày học</th>
                  <th>Khung giờ</th>
                  <th>Chủ đề bài giảng</th>
                  <th>Địa điểm</th>
                  <th>Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                ${allMySessions.map(s => {
                  const cls = classData.find(c => c.class_id === s.class_id);
                  const att = myAttendance.find(a => a.session_id === s.session_id);
                  const isFuture = !s.is_completed;

                  return `
                    <tr>
                      <td><span style="font-weight:700;color:var(--primary-600)">Buổi ${s.session_number}</span></td>
                      <td>
                        <div style="font-weight:600">${cls?.class_name ?? s.class_id}</div>
                        <div style="font-size:10px;color:var(--text-tertiary)">${cls?.class_code}</div>
                      </td>
                      <td><span style="font-weight:600">${formatDate(s.date)}</span></td>
                      <td style="font-size:var(--text-xs);color:var(--text-secondary)">${s.start_time} - ${s.end_time}</td>
                      <td style="font-weight:500;max-width:240px">${s.topic || `Bài học Buổi ${s.session_number}`}</td>
                      <td><span class="badge badge-gray">${cls?.campus === 'CS2' ? 'CS2 - P.302' : 'CS1 - P.201'}</span></td>
                      <td>
                        ${att?.status === 'present' ? `<span class="badge badge-green">✓ Có mặt</span>` :
                          att?.status === 'late' ? `<span class="badge badge-amber">⏱️ Đi muộn</span>` :
                          att?.status === 'excused' ? `<span class="badge badge-blue">📝 Có phép</span>` :
                          att?.status === 'absent' ? `<span class="badge badge-red">✕ Vắng mặt</span>` :
                          isFuture ? `<span class="badge badge-blue"><span class="badge-dot"></span>Sắp diễn ra</span>` :
                          `<span class="badge badge-gray">Chưa điểm danh</span>`}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <!-- Smart Makeup Matcher View -->
        <div style="display:flex;flex-direction:column;gap:var(--space-6)">
          <!-- Confirmed Makeup Bookings -->
          <div class="card" style="border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-xl);background:rgba(16,185,129,0.02);overflow:hidden">
            <div class="card-header" style="background:rgba(16,185,129,0.08);padding:var(--space-4) var(--space-6);display:flex;justify-content:space-between;align-items:center">
              <h3 style="margin:0;font-size:var(--text-base);font-weight:700;color:#065f46;display:flex;align-items:center;gap:6px">
                ✓ Lịch Học Bù Đã Đặt Thành Công (${myBookings.length})
              </h3>
              <span class="badge badge-green">Đã đồng bộ vào hệ thống</span>
            </div>
            <div class="card-body" style="padding:var(--space-5)">
              ${myBookings.length === 0 ? `
                <p style="margin:0;color:var(--text-tertiary);font-size:var(--text-sm)">Bạn chưa có ca học bù nào đã đăng ký.</p>
              ` : `
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${myBookings.map(b => `
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 16px;background:#ffffff;border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-lg);box-shadow:var(--shadow-xs)">
                      <div>
                        <div style="font-size:13px;font-weight:700;color:var(--text-primary)">
                          Học bù: ${b.missed_session_title} → Lớp ${b.target_class_code} (${b.target_campus})
                        </div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">
                          📅 Ngày: <strong>${formatDate(b.date)}</strong> · ⏰ Giờ: <strong>${b.time}</strong> · 📍 <strong>${b.room}</strong>
                        </div>
                        ${b.notes ? `<div style="font-size:11px;color:var(--primary-700);margin-top:2px">📌 Ghi chú: ${b.notes}</div>` : ''}
                      </div>
                      <span class="badge badge-green" style="font-size:11px;padding:4px 10px;font-weight:700">✓ Đã xác nhận chỗ</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- Suggested Makeup Slots (Smart Algorithm Results) -->
          <div class="card" style="border:1px solid var(--border-light);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-sm)">
            <div class="card-header" style="background:var(--gray-50);padding:var(--space-4) var(--space-6);display:flex;justify-content:space-between;align-items:center">
              <div>
                <h3 style="margin:0;font-size:var(--text-base);font-weight:700">
                  ⚡ Các Ca Học Bù Được Hệ Thống Tự Động Đề Xuất
                </h3>
                <p style="margin:2px 0 0 0;font-size:11px;color:var(--text-tertiary)">
                  Thuật toán quét tự động các lớp song song có cùng tiến độ bài giảng tại CS1, CS2 và ca kèm 1-1
                </p>
              </div>
              <span class="badge badge-blue">Độ chuẩn xác bài giảng: 100%</span>
            </div>

            <div class="card-body" style="padding:var(--space-6)">
              <div style="display:flex;flex-direction:column;gap:16px">
                ${makeupOptionsData.map(opt => `
                  <div class="makeup-card" style="border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:var(--space-5);background:#ffffff;box-shadow:var(--shadow-xs);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
                    <div style="flex:1;min-width:280px">
                      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <span class="badge ${opt.mode === 'online_zoom' ? 'badge-blue' : 'badge-green'}" style="font-size:10px">
                          ${opt.mode === 'online_zoom' ? '💻 Kèm 1-1 Online' : '🏫 Trực tiếp tại cơ sở'}
                        </span>
                        <span class="badge badge-gray" style="font-size:10px">${opt.target_campus}</span>
                        <span style="font-size:11px;color:var(--text-tertiary);font-weight:600">Còn ${opt.available_slots} chỗ trống</span>
                      </div>
                      <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:3px">
                        ${opt.target_class_name}
                      </div>
                      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">
                        Chủ đề bù: <strong>${opt.missed_topic}</strong>
                      </div>
                      <div style="font-size:11px;color:var(--text-tertiary)">
                        📅 Ngày: <strong>${formatDate(opt.date)}</strong> · ⏰ Giờ: <strong>${opt.time}</strong> · 📍 <strong>${opt.room}</strong> · GV/TG: <strong>${opt.teacher_name}</strong>
                      </div>
                    </div>

                    <button type="button" class="btn btn-primary btn-sm btn-book-makeup" data-opt-id="${opt.option_id}" style="font-size:12px;padding:8px 18px;display:inline-flex;align-items:center;gap:6px">
                      ${icons.check} Đặt lịch học bù 1-Chạm
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

export function initStudentSchedulePage(): void {
  // Tabs
  document.querySelectorAll<HTMLElement>('.btn-sched-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab as 'calendar' | 'makeup';
      if (tab) {
        currentScheduleTab = tab;
        refreshSchedulePage();
      }
    });
  });

  // 1-Click Booking
  document.querySelectorAll<HTMLElement>('.btn-book-makeup').forEach(btn => {
    btn.addEventListener('click', () => {
      const optId = btn.dataset.optId;
      const opt = makeupOptionsData.find(o => o.option_id === optId);
      if (!opt) return;

      const state = getState();
      const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV001';

      makeupBookingData.unshift({
        booking_id: `MB${String(makeupBookingData.length + 1).padStart(3, '0')}`,
        student_id: studentId,
        missed_session_title: opt.missed_topic.slice(0, 32),
        target_class_code: opt.target_class_code,
        target_campus: opt.target_campus,
        date: opt.date,
        time: opt.time,
        room: opt.room,
        status: 'confirmed',
        booked_at: new Date().toISOString(),
        notes: `Học viên tự đặt chỗ thành công cho ca học bù cùng chủ đề ${opt.missed_topic.slice(0, 30)}...`,
      });

      showToast(`Đã đặt lịch học bù thành công cho lớp ${opt.target_class_name}!`, 'success');
      refreshSchedulePage();
    });
  });
}

function refreshSchedulePage(): void {
  const el = document.getElementById('page-content');
  if (el) {
    el.innerHTML = renderStudentSchedulePage();
    initStudentSchedulePage();
  }
}
