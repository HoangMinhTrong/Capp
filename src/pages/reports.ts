// ============================================
// EduTrack English - Reports Page (Báo cáo Tổng hợp)
// Warm Minimalist Design System
// ============================================

import { getState } from '../state.ts';
import { icons, renderDonutChart, renderBarChart, showToast } from '../utils.ts';
import {
  studentData, classData, attendanceData,
  assessmentResultData, assessmentData, progressSnapshotData,
  ticketData, quizData, quizAttemptData
} from '../data.ts';

export function renderReportsPage(): string {
  const campus = getState().selectedCampus;

  // Filter data by campus
  const students = studentData.filter(s => s.status === 'active' && (campus === 'all' || s.campus === campus));
  const classes = classData.filter(c => c.status === 'in_progress' && (campus === 'all' || c.campus === campus));

  // Compute overall stats
  const totalStudents = students.length;
  const totalClasses = classes.length;

  // Attendance stats
  const relevantAttendance = attendanceData.filter(a => {
    if (campus === 'all') return true;
    const cls = classData.find(c => c.class_id === a.class_id);
    return cls?.campus === campus;
  });
  const presentCount = relevantAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const totalAttendance = relevantAttendance.length;
  const overallAttendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  // Alert distribution
  const latestSnapshots = progressSnapshotData.filter(p => p.period === 'Tháng 11');
  const normalCount = latestSnapshots.filter(p => p.alert_level === 'normal').length;
  const watchCount = latestSnapshots.filter(p => p.alert_level === 'watch').length;
  const priorityCount = latestSnapshots.filter(p => p.alert_level === 'priority').length;

  // Ticket stats
  const resolvedTickets = ticketData.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const totalTickets = ticketData.length;

  // Assessment averages per class
  const classScoreData = classes.map(cls => {
    const assessments = assessmentData.filter(a => a.class_id === cls.class_id);
    const results = assessmentResultData.filter(r => assessments.some(a => a.assessment_id === r.assessment_id));
    const scores = results.filter(r => r.score !== null).map(r => r.score as number);
    const maxScore = assessments.length > 0 ? assessments[0].max_score : 100;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { label: cls.class_code, value: avgScore, max: maxScore, color: '#A93226' };
  });

  return `
    <div class="reports-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>📊</span>
            <span>Báo cáo Tổng hợp Đào tạo</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            Tổng quan hiệu quả đào tạo ${campus !== 'all' ? `— ${campus === 'CS1' ? 'Cơ sở 1' : 'Cơ sở 2'}` : '— Tất cả cơ sở'}
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" id="btn-print-report" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:8px 18px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            ${icons.download} In / Lưu PDF
          </button>
          <button class="btn btn-primary" id="btn-export-report-csv" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:8px 18px;border:none;background:#A93226;color:#FFFFFF;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            ${icons.download} Xuất file CSV
          </button>
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${totalStudents}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tổng học viên đang học</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${totalClasses}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Lớp đang giảng dạy</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${overallAttendanceRate}%
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Chuyên cần trung bình</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#2563EB;line-height:1;margin-bottom:8px">
            ${resolvedTickets}/${totalTickets}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Ticket hỗ trợ đã giải quyết</div>
        </div>
      </div>

      <!-- 3. Hàng 2 biểu đồ phân bố chuyên cần & cảnh báo -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        <!-- Attendance Overview -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
          <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:20px">Phân bố chuyên cần toàn viện</div>
          <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap">
            ${renderDonutChart(presentCount, totalAttendance, '#059669', 'Có mặt / Đi muộn', 120)}
            ${renderDonutChart(totalAttendance - presentCount, totalAttendance, '#DC2626', 'Vắng / Có phép', 120)}
          </div>
        </div>

        <!-- Alert Distribution -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
          <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:20px">Phân bố mức độ cảnh báo (Tháng 11)</div>
          ${renderBarChart([
            { label: 'Bình thường', value: normalCount, max: Math.max(normalCount, watchCount, priorityCount, 1), color: '#059669' },
            { label: 'Theo dõi (Watch)', value: watchCount, max: Math.max(normalCount, watchCount, priorityCount, 1), color: '#D97706' },
            { label: 'Khẩn cấp (Priority)', value: priorityCount, max: Math.max(normalCount, watchCount, priorityCount, 1), color: '#DC2626' },
          ])}
        </div>
      </div>

      <!-- 4. Score by Class -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:24px;box-shadow:0 3px 12px rgba(45,40,36,0.03);margin-bottom:24px">
        <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:16px">Điểm kiểm tra trung bình theo từng lớp</div>
        ${classScoreData.length > 0 ? renderBarChart(classScoreData, 240) : '<p style="color:#7F7A72;text-align:center">Chưa có dữ liệu kiểm tra</p>'}
      </div>

      <!-- 5. Quiz Completion Table Card -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;overflow:hidden;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        <div style="background:#FAF5EE;padding:16px 24px;border-bottom:1px solid #EAE4D8">
          <h3 style="margin:0;font-size:16px;font-weight:800;color:#2D2824">Tỷ lệ hoàn thành Quiz theo lớp</h3>
        </div>
        <div style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em;background:#FFFDF9">
                <th style="padding:12px 18px">LỚP HỌC</th>
                <th style="padding:12px 18px">SỐ QUIZ</th>
                <th style="padding:12px 18px">ĐÃ NỘP</th>
                <th style="padding:12px 18px">CHƯA LÀM</th>
                <th style="padding:12px 18px">TỶ LỆ HOÀN THÀNH</th>
              </tr>
            </thead>
            <tbody>
              ${classes.map(cls => {
                const classQuizzes = quizData.filter(q => q.class_id === cls.class_id);
                const classQuizIds = new Set(classQuizzes.map(q => q.quiz_id));
                const classAttempts = quizAttemptData.filter(qa => classQuizIds.has(qa.quiz_id));
                const submitted = classAttempts.filter(qa => qa.status === 'submitted').length;
                const total = classAttempts.length;
                const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;
                return `
                  <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" onmouseover="this.style.background='#FAF7F2'" onmouseout="this.style.background='transparent'">
                    <td style="padding:12px 18px">
                      <strong style="color:#2D2824">${cls.class_code}</strong>
                      <div style="font-size:11.5px;color:#7F7A72">${cls.class_name}</div>
                    </td>
                    <td style="padding:12px 18px;font-weight:700;color:#2D2824">${classQuizzes.length}</td>
                    <td style="padding:12px 18px;color:#166534;font-weight:700">${submitted}</td>
                    <td style="padding:12px 18px;color:#DC2626">${total - submitted}</td>
                    <td style="padding:12px 18px">
                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="flex:1;max-width:140px;height:8px;border-radius:9999px;background:#EAE4D8;overflow:hidden">
                          <div style="width:${rate}%;height:100%;border-radius:9999px;background:${rate >= 70 ? '#166534' : rate >= 50 ? '#D97706' : '#DC2626'}"></div>
                        </div>
                        <span style="font-size:12px;font-weight:800;color:#2D2824">${rate}%</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

export function initReportsPage() {
  // Print report
  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    window.print();
  });

  // Export CSV
  document.getElementById('btn-export-report-csv')?.addEventListener('click', () => {
    const campus = getState().selectedCampus;
    const classes = classData.filter(c => c.status === 'in_progress' && (campus === 'all' || c.campus === campus));

    let csv = 'Mã lớp,Tên lớp,Cơ sở,Sĩ số,Số buổi hoàn thành,Tỷ lệ hoàn thành buổi học\n';
    classes.forEach(c => {
      const pct = c.total_sessions > 0 ? Math.round((c.completed_sessions / c.total_sessions) * 100) : 0;
      csv += `"${c.class_code}","${c.class_name}","${c.campus}","${c.current_students}/${c.max_students}","${c.completed_sessions}/${c.total_sessions}","${pct}%"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCao_TongHop_${campus}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file báo cáo tổng hợp CSV!', 'success');
  });
}
