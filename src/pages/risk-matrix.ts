// ============================================
// EduTrack English - Risk Matrix Page (Ma trận Cảnh báo Rủi ro)
// Warm Minimalist Design System
// ============================================

import { alertRules, studentData, progressSnapshotData, classData } from '../data.ts';
import {
  icons, formatPercent, alertLevelLabels, alertLevelBadgeClass,
  trendLabels, trendBadgeClass, showToast
} from '../utils.ts';

export function renderRiskMatrixPage(): string {
  // Compute active alert rules
  const activeRules = alertRules.filter(r => r.is_active);

  // Group latest snapshot per student
  const latestSnapshots = new Map<string, typeof progressSnapshotData[0]>();
  for (const snap of progressSnapshotData) {
    const existing = latestSnapshots.get(snap.student_id);
    if (!existing || snap.generated_at > existing.generated_at) {
      latestSnapshots.set(snap.student_id, snap);
    }
  }

  // Filter students with risk or pending assessment (UC-16 Cold-Start handling)
  const riskStudents = Array.from(latestSnapshots.values())
    .filter(s => s.alert_level === 'priority' || s.alert_level === 'watch' || s.alert_level === 'pending')
    .sort((a, b) => {
      const order: Record<string, number> = { priority: 1, watch: 2, pending: 3, normal: 4 };
      if (order[a.alert_level] !== order[b.alert_level]) {
        return (order[a.alert_level] ?? 5) - (order[b.alert_level] ?? 5);
      }
      return (b.attendance_rate ?? 0) - (a.attendance_rate ?? 0);
    });

  const priorityCount = riskStudents.filter(s => s.alert_level === 'priority').length;
  const watchCount = riskStudents.filter(s => s.alert_level === 'watch').length;
  const pendingCount = riskStudents.filter(s => s.alert_level === 'pending').length;

  return `
    <div class="risk-matrix-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>⚠️</span>
            <span>Ma trận Cảnh báo &amp; Rủi ro Học tập</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            Hệ thống phát hiện sớm học viên có nguy cơ sa sút dựa trên ngưỡng quy tắc tự động
          </div>
        </div>
        <div style="font-size:12.5px;color:#7F7A72;background:#FFFFFF;border:1px solid #EAE4D8;padding:8px 16px;border-radius:9999px;font-weight:700">
          🔄 Chu kỳ quét: Hàng ngày (Tự động 00:00)
        </div>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${priorityCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Cảnh báo khẩn cấp (Priority)</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${watchCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Cần theo dõi (Watch)</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#2563EB;line-height:1;margin-bottom:8px">
            ${pendingCount}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Chờ đánh giá đầu vào</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${activeRules.length}/${alertRules.length}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Quy tắc đang kích hoạt</div>
        </div>
      </div>

      <!-- 3. Alert Rules Grid -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;overflow:hidden;box-shadow:0 3px 12px rgba(45,40,36,0.03);margin-bottom:24px">
        <div style="background:#FAF5EE;padding:16px 24px;border-bottom:1px solid #EAE4D8;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <h3 style="margin:0;font-size:15px;font-weight:800;color:#2D2824;display:flex;align-items:center;gap:8px">
            <span>⚙️</span>
            <span>Bộ quy tắc cảnh báo sa sút học tập (${activeRules.length}/${alertRules.length} kích hoạt)</span>
          </h3>
          <span style="font-size:12px;font-weight:700;color:#7F7A72">Hệ số chuẩn hóa theo trung tâm</span>
        </div>
        <div style="padding:22px">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:16px">
            ${alertRules.map(rule => `
              <div style="border:1px solid #EAE4D8;border-radius:16px;padding:18px;background:#FAF7F2;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px">
                    <strong style="font-size:14px;color:#2D2824">${rule.name}</strong>
                    <span class="badge ${alertLevelBadgeClass[rule.alert_level]}" style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:9999px">${alertLevelLabels[rule.alert_level]}</span>
                  </div>
                  <p style="font-size:12.5px;color:#7F7A72;line-height:1.45;margin:0">${rule.description}</p>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px dashed #EAE4D8">
                  <span style="font-size:12px;color:#7F7A72">Ngưỡng kích hoạt: <strong style="color:#2D2824">${rule.threshold}${rule.condition_type.includes('points') ? ' điểm' : rule.condition_type.includes('below') || rule.condition_type.includes('range') ? '%' : ' buổi'}</strong></span>
                  <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#2D2824;cursor:pointer">
                    <input type="checkbox" class="rule-toggle" data-rule-id="${rule.rule_id}" ${rule.is_active ? 'checked' : ''} style="accent-color:#A93226;width:16px;height:16px;cursor:pointer"> Bật
                  </label>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 4. Risk Students Table -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;overflow:hidden;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        <div style="background:#FAF5EE;padding:16px 24px;border-bottom:1px solid #EAE4D8;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <h3 style="margin:0;font-size:15px;font-weight:800;color:#2D2824;display:flex;align-items:center;gap:8px">
            <span>👥</span>
            <span>Danh sách học viên cần can thiệp &amp; theo dõi rủi ro</span>
          </h3>
          <span class="badge" style="background:#FEE2E2;color:#DC2626;border:1px solid #FCA5A5;font-weight:800;font-size:11.5px;padding:4px 12px;border-radius:9999px">
            ${riskStudents.length} học viên cần can thiệp
          </span>
        </div>
        <div style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em;background:#FFFDF9">
                <th style="padding:12px 16px">HỌC VIÊN</th>
                <th style="padding:12px 16px">LỚP HỌC</th>
                <th style="padding:12px 16px">MỨC CẢNH BÁO</th>
                <th style="padding:12px 16px">CHUYÊN CẦN</th>
                <th style="padding:12px 16px">ĐIỂM KT TB</th>
                <th style="padding:12px 16px">ĐIỂM QUIZ TB</th>
                <th style="padding:12px 16px">XU HƯỚNG</th>
                <th style="padding:12px 16px">GHI CHÚ VẤN ĐỀ</th>
                <th style="padding:12px 16px;text-align:center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              ${riskStudents.map(snap => {
                const student = studentData.find(s => s.student_id === snap.student_id);
                const cls = classData.find(c => c.class_id === snap.class_id);
                return `
                  <tr style="border-bottom:1px solid #F5EFEB;transition:background 0.15s ease" onmouseover="this.style.background='#FAF7F2'" onmouseout="this.style.background='transparent'">
                    <td style="padding:14px 16px">
                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:34px;height:34px;border-radius:50%;background:#F5E6E4;border:1px solid #E8C9C5;color:#A93226;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                          ${student?.avatar_initials ?? '?'}
                        </div>
                        <div>
                          <a href="#/students/${snap.student_id}" style="color:#2D2824;font-weight:700;text-decoration:none">${student?.full_name ?? snap.student_id}</a>
                          <div style="font-size:11px;color:#7F7A72;margin-top:2px">${student?.student_code}</div>
                        </div>
                      </div>
                    </td>
                    <td style="padding:14px 16px">
                      <div style="font-weight:700;color:#2D2824">${cls?.class_name ?? snap.class_id}</div>
                      <div style="font-size:11px;color:#7F7A72;margin-top:2px">${cls?.class_code}</div>
                    </td>
                    <td style="padding:14px 16px">
                      <span class="badge ${alertLevelBadgeClass[snap.alert_level]}" style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px">
                        <span class="badge-dot"></span>${alertLevelLabels[snap.alert_level]}
                      </span>
                    </td>
                    <td style="padding:14px 16px">
                      <strong style="color:${(snap.attendance_rate ?? 0) < 70 ? '#DC2626' : '#D97706'}">
                        ${formatPercent(snap.attendance_rate)}
                      </strong>
                    </td>
                    <td style="padding:14px 16px;font-weight:700;color:#2D2824">${snap.avg_assessment_score ?? '—'}</td>
                    <td style="padding:14px 16px;font-weight:700;color:#2D2824">${snap.avg_quiz_score ?? '—'}</td>
                    <td style="padding:14px 16px">
                      <span class="badge ${trendBadgeClass[snap.trend]}" style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px">${trendLabels[snap.trend]}</span>
                    </td>
                    <td style="padding:14px 16px;font-size:12px;color:#7F7A72;max-width:240px;line-height:1.4">
                      ${snap.notes || 'Cần theo dõi thêm do chuyên cần hoặc điểm số giảm'}
                    </td>
                    <td style="padding:14px 16px;text-align:center">
                      <a href="#/progress" class="btn btn-secondary btn-sm" style="font-size:11.5px;font-weight:700;padding:6px 14px;border-radius:9999px;border:1px solid #EAE4D8;background:#FFFFFF;color:#A93226;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                        ${icons.target} Can thiệp
                      </a>
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

export function initRiskMatrixPage(): void {
  document.querySelectorAll('.rule-toggle').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const ruleId = target.dataset.ruleId;
      const rule = alertRules.find(r => r.rule_id === ruleId);
      if (rule) {
        rule.is_active = target.checked;
        showToast(`Đã ${target.checked ? 'bật' : 'tắt'} quy tắc "${rule.name}"`, 'info');
      }
    });
  });
}
