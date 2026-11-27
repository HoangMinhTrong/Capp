// ============================================
// EduTrack - Giám sát học viên & Cảnh báo sớm
// Màn hình 2: Hồ sơ theo dõi chi tiết học viên
// ============================================

import type { StudentMonitoringItem } from '../types.ts';
import { studentMonitoringData, studentData, generate14Days, classAssignmentData, centerClassData } from '../data.ts';
import { router } from '../router.ts';
import { getState } from '../state.ts';

function getStudentMonitoringItem(): StudentMonitoringItem | undefined {
  const params = router.getParams();
  const id = params.id || 'SV_NN';

  const found = studentMonitoringData.find(s => s.student_id === id);
  if (found) return found;

  // Fallback to standard student data
  const raw = studentData.find(s => s.student_id === id);
  if (!raw) return undefined;
  return {
    student_id: id,
    student_code: raw.student_code,
    full_name: raw.full_name,
    email: raw.email,
    avatar_initials: raw.avatar_initials,
    class_id: 'CLS_NN01',
    class_name: 'IELTS Foundation 5.5 — Giáo trình mẫu',
    alert_level: 'normal',
    status_note: 'Học viên mới (miễn cảnh báo)',
    course_progress: 0,
    avg_score: '—',
    avg_score_sub: 'Chưa có điểm bài tập',
    streak_days: 0,
    streak_sub: 'Chưa bắt đầu chuỗi',
    vocab_health_kpi: '—',
    vocab_health_sub: 'Chưa học từ vựng',
    activity_14_days: {
      days: generate14Days(2),
      streak_app_days: 1,
      avg_minutes_7_days: 'TB <1 phút/ngày (7 ngày)',
      usage_ratio_note: '1/7 ngày có dùng · 2 phút/ngày có dùng',
    },
    vocab_badge: 'Chưa đủ dữ liệu',
    vocab_msg: 'Học viên chưa có từ vựng được mở để luyện.',
    progress_completed: {
      lessons_done: 0,
      lessons_total: 0,
      percent: 0,
      on_time_count: 0,
      late_count: 0,
    },
    results_weakness: {
      avg_score: '—',
      avg_score_note: 'Chưa có bài tập nào có điểm',
      forget_rate: '0%',
    },
    attendance_interaction: {
      last_studied: '—',
      days_studied: 0,
      questions_asked: 0,
      flashcards_reviewed: 0,
    },
    gamification: {
      level: 'Lv 1',
      badge: '🥚 Trứng',
      xp_total: 0,
      xp_this_week: 0,
    },
  };
}

export function renderStudentDetailPage(): string {
  const st = getStudentMonitoringItem();
  if (!st) {
    return `
      <div style="padding:40px;text-align:center;background:#FAF7F2;min-height:80vh">
        <h2 style="color:#2D2824;font-size:22px">Không tìm thấy học viên</h2>
        <a href="#/students" style="display:inline-block;margin-top:16px;color:#A93226;font-weight:700">‹ Quay lại danh sách học viên</a>
      </div>
    `;
  }
  const user = getState().currentUser;
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isTA = user?.role === 'teaching_assistant';
  const staffId = user?.staff_id;

  // Strict RBAC: Check student belongs to teacher / TA's classes
  if ((isTeacher || isTA) && staffId && !isAdmin) {
    const assignedClassIds = new Set<string>();
    if (isTeacher) {
      centerClassData.filter(c => c.teacher_id === staffId).forEach(c => assignedClassIds.add(c.class_id));
      classAssignmentData.filter(ca => ca.teacher_id === staffId).forEach(ca => assignedClassIds.add(ca.class_id));
      if (staffId === 'STF003') {
        assignedClassIds.add('CLS_NN01');
        assignedClassIds.add('CLS_IELTS_FND');
        assignedClassIds.add('CLS_COMM_01');
        assignedClassIds.add('CLS_SELF_01');
      } else if (staffId === 'STF004') {
        assignedClassIds.add('CLS_TRIAL_01');
        assignedClassIds.add('CLS_B1_01');
        assignedClassIds.add('CLS003');
        assignedClassIds.add('CLS005');
      }
    } else if (isTA) {
      classAssignmentData.filter(ca => ca.teaching_assistant_id === staffId).forEach(ca => assignedClassIds.add(ca.class_id));
      if (staffId === 'STF005') {
        assignedClassIds.add('CLS_IELTS_FND');
        assignedClassIds.add('CLS_COMM_01');
        assignedClassIds.add('CLS_SELF_01');
        assignedClassIds.add('CLS_NN01');
        assignedClassIds.add('CLS001');
        assignedClassIds.add('CLS004');
      } else if (staffId === 'STF006') {
        assignedClassIds.add('CLS_TRIAL_01');
        assignedClassIds.add('CLS_B1_01');
        assignedClassIds.add('CLS002');
        assignedClassIds.add('CLS003');
        assignedClassIds.add('CLS005');
      }
    }

    if (st.class_id && !assignedClassIds.has(st.class_id)) {
      return `
        <div style="background:#FAF7F2;min-height:100vh;padding:64px 24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
          <div style="font-size:48px;margin-bottom:12px">🚫</div>
          <h2 style="color:#2D2824;font-size:22px;font-weight:800;margin:0 0 8px 0">Truy cập bị từ chối (403 Forbidden)</h2>
          <p style="color:#7F7A72;margin:0 0 20px 0;font-size:14px">Bạn không có quyền xem thông tin chi tiết học viên thuộc lớp của giáo viên / trợ giảng khác.</p>
          <a href="#/students" style="background:#A93226;color:#FFFFFF;padding:10px 20px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13.5px">
            ‹ Về danh sách học viên
          </a>
        </div>
      `;
    }
  }

  // Cấu hình Banner Cảnh báo sớm
  let bannerBg = '#E6F4EA';
  let bannerBorderColor = '#1E8449';
  let bannerTextColor = '#1E8449';
  let bannerStateText = 'Ổn';

  if (st.alert_level === 'watch') {
    bannerBg = '#F9F3D9';
    bannerBorderColor = '#B7950B';
    bannerTextColor = '#AF601A';
    bannerStateText = 'Chú ý';
  } else if (st.alert_level === 'priority') {
    bannerBg = '#F9EBEA';
    bannerBorderColor = '#922B21';
    bannerTextColor = '#922B21';
    bannerStateText = 'Nguy cơ';
  }

  // 14 days chart data
  const days = st.activity_14_days.days;
  const firstDayLabel = days[0]?.label || '06/11';
  const lastDayLabel = days[days.length - 1]?.label || 'Hôm nay';

  return `
    <div class="student-detail-monitoring" style="background:#FAF7F2;min-height:100vh;padding:24px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      
      <!-- Top Navigation & Header -->
      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:24px">
        <!-- Nút mũi tên quay lại < -->
        <a 
          href="#/students" 
          style="
            width:40px;
            height:40px;
            border-radius:50%;
            background:#FFFFFF;
            border:1px solid #EAE4D8;
            color:#2D2824;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:18px;
            font-weight:700;
            text-decoration:none;
            box-shadow:0 1px 3px rgba(0,0,0,0.02);
            transition:all 0.15s ease;
            flex-shrink:0;
            margin-top:2px;
          "
          onmouseover="this.style.background='#F5E6E4';this.style.borderColor='#E8C9C5';this.style.color='#A93226'"
          onmouseout="this.style.background='#FFFFFF';this.style.borderColor='#EAE4D8';this.style.color='#2D2824'"
          title="Quay lại danh sách học viên"
        >
          ‹
        </a>

        <div>
          <!-- Tiêu đề lớn: Tên học viên -->
          <h1 style="font-size:26px;font-weight:800;color:#2D2824;margin:0 0 4px 0;letter-spacing:-0.02em">
            ${st.full_name}
          </h1>
          <!-- Dòng phụ đề bên dưới -->
          <div style="font-size:13.5px;color:#7F7A72;font-weight:500">
            Hồ sơ theo dõi · ${st.class_name}
          </div>
        </div>
      </div>

      <!-- KHỐI 1: Banner trạng thái Cảnh báo sớm (chiếm trọn chiều ngang, viền trái 6px) -->
      <div style="
        background:${bannerBg};
        border-left:6px solid ${bannerBorderColor};
        border-radius:16px;
        padding:20px 24px;
        margin-bottom:20px;
        box-shadow:0 1px 3px rgba(0,0,0,0.02);
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:14px;color:${bannerBorderColor}">●</span>
          <span style="font-size:11.5px;font-weight:800;letter-spacing:0.06em;color:${bannerBorderColor};text-transform:uppercase">
            CẢNH BÁO SỚM
          </span>
        </div>
        <div style="font-size:24px;font-weight:800;color:${bannerTextColor};line-height:1.2;margin-bottom:6px">
          ${bannerStateText}
        </div>
        <div style="font-size:13.5px;color:${bannerTextColor};font-weight:500">
          • ${st.status_note}
        </div>
      </div>

      <!-- KHỐI 2: Hàng 4 thẻ chỉ số nhanh (KPI Cards) chia đều -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:20px">
        <!-- KPI 1: Tiến độ khóa -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;min-height:115px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div>
            <div style="font-size:12.5px;font-weight:600;color:#7F7A72;margin-bottom:6px">Tiến độ khóa</div>
            <div style="font-size:28px;font-weight:800;color:#2D2824;line-height:1">${st.course_progress}%</div>
          </div>
          <!-- Thanh tiến độ mảnh ở đáy thẻ -->
          <div style="width:100%;height:4px;background:#EAE4D8;border-radius:2px;overflow:hidden;margin-top:12px">
            <div style="width:${st.course_progress}%;height:100%;background:#A93226;border-radius:2px"></div>
          </div>
        </div>

        <!-- KPI 2: Điểm trung bình -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;min-height:115px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div>
            <div style="font-size:12.5px;font-weight:600;color:#7F7A72;margin-bottom:6px">Điểm trung bình</div>
            <div style="font-size:28px;font-weight:800;color:#B7950B;line-height:1">${st.avg_score}</div>
          </div>
          <div style="font-size:12px;color:#7F7A72;margin-top:10px">${st.avg_score_sub}</div>
        </div>

        <!-- KPI 3: Ngày streak -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;min-height:115px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div>
            <div style="font-size:12.5px;font-weight:600;color:#7F7A72;margin-bottom:6px">Ngày streak</div>
            <div style="font-size:28px;font-weight:800;color:#2D2824;line-height:1">${st.streak_days} 🔥</div>
          </div>
          <div style="font-size:12px;color:#7F7A72;margin-top:10px">${st.streak_sub}</div>
        </div>

        <!-- KPI 4: Sức khỏe từ vựng -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;min-height:115px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div>
            <div style="font-size:12.5px;font-weight:600;color:#7F7A72;margin-bottom:6px">Sức khỏe từ vựng</div>
            <div style="font-size:28px;font-weight:800;color:#7F7A72;line-height:1">${st.vocab_health_kpi}</div>
          </div>
          <div style="font-size:12px;color:#7F7A72;margin-top:10px">${st.vocab_health_sub}</div>
        </div>
      </div>

      <!-- KHỐI 3: Thẻ Thời gian hoạt động 14 ngày -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:24px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
          <span style="font-size:16px">📈</span>
          <span style="font-size:15px;font-weight:700;color:#2D2824">Thời gian hoạt động 14 ngày</span>
          <span style="font-size:12.5px;color:#7F7A72;font-weight:400">(ước lượng · không theo dõi hành vi chi tiết)</span>
        </div>

        <!-- Biểu đồ cột 14 ngày -->
        <div style="display:flex;align-items:flex-end;gap:8px;height:90px;padding:0 4px 8px 4px;border-bottom:1px solid #F0ECE4">
          ${days.map(d => {
            if (d.is_today) {
              return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end" title="${d.label}: ${d.active_minutes} phút">
                  <div style="
                    width:100%;
                    max-width:28px;
                    height:76px;
                    border-radius:5px 5px 0 0;
                    background:linear-gradient(180deg, #A93226 0%, #AF601A 100%);
                    box-shadow:0 2px 6px rgba(169,50,38,0.25);
                  "></div>
                </div>
              `;
            } else {
              return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end" title="${d.label}: Không hoạt động">
                  <div style="
                    width:100%;
                    max-width:28px;
                    height:5px;
                    border-radius:2px;
                    background:#EAE4D8;
                  "></div>
                </div>
              `;
            }
          }).join('')}
        </div>

        <!-- Trục thời gian bên dưới -->
        <div style="display:flex;justify-content:space-between;padding:8px 4px 0 4px;font-size:11.5px;color:#7F7A72;font-weight:600">
          <span>${firstDayLabel}</span>
          <span>${lastDayLabel}</span>
        </div>

        <!-- Chân thẻ: 3 chỉ số ngang -->
        <div style="
          display:grid;
          grid-template-columns:repeat(3, 1fr);
          gap:12px;
          margin-top:20px;
          padding-top:16px;
          border-top:1px solid #F0ECE4;
          font-size:13px;
          color:#2D2824;
          font-weight:600;
        ">
          <div>Vào app ${st.activity_14_days.streak_app_days} ngày liên tiếp</div>
          <div style="text-align:center">${st.activity_14_days.avg_minutes_7_days}</div>
          <div style="text-align:right">${st.activity_14_days.usage_ratio_note}</div>
        </div>
      </div>

      <!-- KHỐI 4: Thẻ Sức khỏe từ vựng -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:22px 24px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <!-- Icon tròn phân bổ -->
            <span style="font-size:16px">📊</span>
            <span style="font-size:15px;font-weight:700;color:#2D2824">Sức khỏe từ vựng</span>
          </div>
          <!-- Badge xanh dương Chưa đủ dữ liệu -->
          <span style="
            background:#E0F2FE;
            color:#0284C7;
            font-size:11.5px;
            font-weight:700;
            padding:3px 10px;
            border-radius:20px;
          ">
            ${st.vocab_badge}
          </span>
        </div>
        <div style="font-size:13px;color:#7F7A72">
          ${st.vocab_msg}
        </div>
      </div>

      <!-- KHỐI 5: Hai thẻ đặt cạnh nhau (50% / 50%) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <!-- Thẻ bên trái: Tiến độ & hoàn thành -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
            <span style="font-size:16px">📖</span>
            <span style="font-size:15px;font-weight:700;color:#2D2824">Tiến độ & hoàn thành</span>
          </div>

          <!-- Dòng chữ 0/0 bài đã học (0%) -->
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#2D2824;font-weight:600;margin-bottom:8px">
            <span>${st.progress_completed.lessons_done}/${st.progress_completed.lessons_total} bài đã học</span>
            <span>(${st.progress_completed.percent}%)</span>
          </div>
          <div style="width:100%;height:6px;background:#EAE4D8;border-radius:3px;overflow:hidden;margin-bottom:16px">
            <div style="width:${st.progress_completed.percent}%;height:100%;background:#A93226;border-radius:3px"></div>
          </div>

          <!-- Thanh tiến độ thứ hai cho bài tập -->
          <div style="width:100%;height:6px;background:#EAE4D8;border-radius:3px;overflow:hidden;margin-bottom:16px">
            <div style="width:0%;height:100%;background:#1E8449;border-radius:3px"></div>
          </div>

          <!-- Phía dưới chia 2 bên: Đúng hạn 0 và Trễ 0 -->
          <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #F0ECE4;font-size:13px;font-weight:700">
            <span style="color:#1E8449">Đúng hạn ${st.progress_completed.on_time_count}</span>
            <span style="color:#AF601A">Trễ ${st.progress_completed.late_count}</span>
          </div>
        </div>

        <!-- Thẻ bên phải: Kết quả & điểm yếu -->
        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
            <span style="font-size:16px">🎯</span>
            <span style="font-size:15px;font-weight:700;color:#2D2824">Kết quả & điểm yếu</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <!-- Cột 1: Điểm trung bình -->
            <div>
              <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">Điểm trung bình</div>
              <div style="font-size:26px;font-weight:800;color:#2D2824;line-height:1;margin-bottom:6px">
                ${st.results_weakness.avg_score}
              </div>
              <div style="font-size:11.5px;color:#7F7A72;line-height:1.3">
                ${st.results_weakness.avg_score_note}
              </div>
            </div>

            <!-- Cột 2: Tỷ lệ quên từ -->
            <div>
              <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">Tỷ lệ quên từ</div>
              <div style="font-size:26px;font-weight:800;color:#2D2824;line-height:1;margin-bottom:6px">
                ${st.results_weakness.forget_rate}
              </div>
              <!-- Thanh chỉ số mảnh -->
              <div style="width:100%;height:4px;background:#EAE4D8;border-radius:2px;overflow:hidden;margin-top:8px">
                <div style="width:${st.results_weakness.forget_rate};height:100%;background:#AF601A;border-radius:2px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KHỐI 6: Thẻ Chuyên cần & tương tác (icon lịch) -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:22px 24px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">
          <span style="font-size:16px">📅</span>
          <span style="font-size:15px;font-weight:700;color:#2D2824">Chuyên cần & tương tác</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px">
          <!-- Cột 1: Học gần nhất -->
          <div>
            <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">Học gần nhất</div>
            <div style="font-size:16px;font-weight:700;color:#2D2824">${st.attendance_interaction.last_studied}</div>
          </div>

          <!-- Cột 2: Số ngày học -->
          <div>
            <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">Số ngày học</div>
            <div style="font-size:16px;font-weight:700;color:#2D2824">${st.attendance_interaction.days_studied}</div>
          </div>

          <!-- Cột 3: Câu hỏi đã đặt -->
          <div>
            <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">Câu hỏi đã đặt</div>
            <div style="font-size:16px;font-weight:700;color:#2D2824">${st.attendance_interaction.questions_asked}</div>
          </div>

          <!-- Cột 4: Lượt ôn thẻ -->
          <div>
            <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">Lượt ôn thẻ</div>
            <div style="font-size:16px;font-weight:700;color:#2D2824">${st.attendance_interaction.flashcards_reviewed}</div>
          </div>
        </div>
      </div>

      <!-- KHỐI 7: Thẻ Điểm thưởng & cấp độ -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <div style="display:flex;align-items:center;gap:8px">
            <!-- Icon cúp vàng -->
            <span style="font-size:18px">🏆</span>
            <span style="font-size:15px;font-weight:700;color:#2D2824">Điểm thưởng & cấp độ</span>
          </div>
          <!-- Badge hình trứng -->
          <span style="
            background:#FDFBF7;
            border:1px solid #EAE4D8;
            color:#2D2824;
            font-size:12px;
            font-weight:700;
            padding:3px 12px;
            border-radius:20px;
            display:inline-flex;
            align-items:center;
            gap:4px;
          ">
            ${st.gamification.badge}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px">
          <div>
            <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">Cấp độ</div>
            <div style="font-size:16px;font-weight:700;color:#2D2824">${st.gamification.level}</div>
          </div>

          <div>
            <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">XP tổng</div>
            <div style="font-size:16px;font-weight:700;color:#2D2824">${st.gamification.xp_total}</div>
          </div>

          <div>
            <div style="font-size:12.5px;color:#7F7A72;margin-bottom:4px">XP tuần này</div>
            <div style="font-size:16px;font-weight:700;color:#1E8449">+${st.gamification.xp_this_week}</div>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function initStudentDetailPage(): void {
  // Page initialization & event listeners if needed
}
