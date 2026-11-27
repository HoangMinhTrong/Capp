// ============================================
// EduTrack - Student Results Page (Kết quả học tập)
// Không gian học tập Gamified: Nền #F8F6FF, viền #E8E2F8, màu nhấn #6C47D9
// ============================================

import { getState } from '../state.ts';
import {
  studentData, classData, enrollmentData, attendanceData,
  studentAssignmentData, studentSubmissionData, assessmentResultData, assessmentData
} from '../data.ts';
import { getClassWeights } from './class-detail.ts';

export function renderStudentResultsPage(): string {
  const state = getState();
  const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV_NN';
  const student = studentData.find(s => s.student_id === studentId) || studentData[0];

  // 1. Vocabulary review health check
  const vocabReviewed = parseInt(localStorage.getItem(`edutrack_vocab_count_${student.student_id}`) || '0', 10);
  const isVocabUnlocked = vocabReviewed >= 5;
  const vocabHealthPercent = isVocabUnlocked ? Math.min(100, 80 + (vocabReviewed - 5) * 3) : 0;
  const vocabRemaining = Math.max(0, 5 - vocabReviewed);

  // 2. Classes the student is enrolled in
  const myEnrollments = enrollmentData.filter(e => e.student_id === student.student_id && e.status === 'active');
  let enrolledClasses = classData.filter(c => myEnrollments.some(e => e.class_id === c.class_id));
  if (enrolledClasses.length === 0) {
    const fallbackClass = classData.find(c => c.class_id === 'CLS_NN01') || classData[0];
    enrolledClasses = [fallbackClass];
  }

  return `
    <div class="student-results-container" style="background:#F8F6FF;min-height:calc(100vh - 72px);margin:-24px;padding:28px 24px 60px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;justify-content:center">
      <div style="width:100%;max-width:680px;display:flex;flex-direction:column;gap:20px">

        <!-- ================= 1. HEADER TRANG "KẾT QUẢ" ================= -->
        <!-- Khối banner đầu trang nền trắng bo góc lớn -->
        <div class="results-header-banner" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:22px 26px;box-shadow:0 4px 18px rgba(108,71,217,0.04);display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="display:flex;align-items:center;gap:16px">
            <!-- Ảnh đại diện linh vật bo tròn -->
            <div style="width:52px;height:52px;border-radius:50%;background:#F3EFFF;border:1.5px solid #D8CCF8;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;box-shadow:0 2px 8px rgba(108,71,217,0.1)">
              🦉
            </div>
            <div>
              <!-- Tiêu đề lớn in đậm "Kết quả" -->
              <h1 style="font-size:24px;font-weight:800;color:#2D2824;margin:0 0 3px 0;letter-spacing:-0.02em">
                Kết quả
              </h1>
              <!-- Dòng phụ đề màu xám -->
              <div style="font-size:13px;color:#736B7C;font-weight:500">
                Bảng điểm, chuyên cần và tổng kết của bạn
              </div>
            </div>
          </div>

          <a href="#/student-dashboard" style="background:#F3EFFF;border:1px solid #E0D4FC;border-radius:9999px;padding:6px 16px;color:#6C47D9;font-size:12.5px;font-weight:700;text-decoration:none;flex-shrink:0">
            ← Về trang chủ
          </a>
        </div>

        <!-- ================= 2. MỤC "TỪ VỰNG CỦA BẠN" ================= -->
        <div class="section-vocab-health">
          <!-- Nhãn phân mục chữ in hoa nhỏ màu xám: "TỪ VỰNG CỦA BẠN" -->
          <div style="font-size:12px;font-weight:800;color:#8E8897;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px">
            TỪ VỰNG CỦA BẠN
          </div>

          <!-- Thẻ ngang bo góc lớn bên dưới -->
          <div class="card-gamified" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:20px 24px;box-shadow:0 4px 18px rgba(108,71,217,0.04);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:16px">
              <!-- Icon biểu đồ tròn -->
              <div style="width:46px;height:46px;border-radius:16px;background:#F3EFFF;border:1.5px solid #E0D4FC;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
                📊
              </div>
              <div>
                <div style="font-size:16px;font-weight:800;color:#2D2824;margin-bottom:3px;display:flex;align-items:center;gap:8px">
                  <span>Sức khỏe từ vựng</span>
                  <span style="font-size:16px;font-weight:800;color:${isVocabUnlocked ? '#10B981' : '#9CA3AF'}">
                    ${isVocabUnlocked ? `${vocabHealthPercent}%` : '—'}
                  </span>
                </div>
                <!-- Dòng mô tả bên dưới ghi "Ôn 5 từ nữa để mở khoá chỉ số này" -->
                <div style="font-size:13px;color:#736B7C;font-weight:500">
                  ${isVocabUnlocked 
                    ? `Đã ôn ${vocabReviewed} từ vựng · Sức khỏe từ vựng đạt mức tốt` 
                    : `Ôn ${vocabRemaining} từ nữa để mở khoá chỉ số này`
                  }
                </div>
              </div>
            </div>

            <!-- Bên phải: Liên kết chữ màu tím đậm "Ôn ngay →" -->
            <a 
              href="#/student-quizzes" 
              style="color:#6C47D9;font-weight:800;font-size:14px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:9999px;background:#F3EFFF;border:1px solid #E0D4FC"
            >
              <span>Ôn ngay</span>
              <span>→</span>
            </a>
          </div>
        </div>

        <!-- ================= 3. MỤC "KẾT QUẢ THEO LỚP" ================= -->
        <div class="section-class-results">
          <!-- Nhãn phân mục chữ in hoa nhỏ màu xám: "KẾT QUẢ THEO LỚP" -->
          <div style="font-size:12px;font-weight:800;color:#8E8897;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px">
            KẾT QUẢ THEO LỚP
          </div>

          <!-- Thẻ thông báo trạng thái đầu mục (nền tím rất nhạt, bo góc lớn) -->
          <div class="status-reminder-box" style="background:#F3EFFF;border:1.5px solid #E0D4FC;border-radius:20px;padding:16px 20px;margin-bottom:18px">
            <div style="font-size:14px;font-weight:800;color:#2D2824;margin-bottom:4px;display:flex;align-items:center;gap:6px">
              <span>💡</span>
              <span>Trình độ</span>
            </div>
            <div style="font-size:12.5px;color:#736B7C;line-height:1.5;font-weight:500">
              Giáo viên cần chốt kế hoạch từ vựng, lịch mở và thời hạn cho lớp trước khi bắt đầu theo dõi. Dữ liệu trước khi kích hoạt không tự được tính thành lịch sử đã đo.
            </div>
          </div>

          <!-- Danh sách thẻ kết quả từng lớp học viên đang tham gia -->
          <div style="display:flex;flex-direction:column;gap:18px">
            ${enrolledClasses.map(cls => {
              // 1. Chuyên cần của học viên ở lớp này
              const classAtt = attendanceData.filter(a => a.student_id === student.student_id && a.class_id === cls.class_id);
              const presentCount = classAtt.filter(a => a.status === 'present' || a.status === 'late').length;
              const absentCount = classAtt.filter(a => a.status === 'absent').length;
              const excusedCount = classAtt.filter(a => a.status === 'excused').length;
              const totalEvaluated = presentCount + absentCount;
              const attRateDisplay = totalEvaluated > 0 ? `${Math.round((presentCount / totalEvaluated) * 100)}%` : '—';
              const attScore = totalEvaluated > 0 ? (presentCount / totalEvaluated) * 10 : null;

              // 2. Bài tập & Điểm thường xuyên
              const classAssignments = studentAssignmentData.filter(a => a.class_id === cls.class_id);
              const classSubs = studentSubmissionData.filter(s => 
                s.student_id === student.student_id && 
                classAssignments.some(a => a.id === s.assignment_id)
              );
              const gradedSubs = classSubs.filter(s => s.status === 'graded' && s.score !== null);
              
              let avgScoreVal: number | null = null;
              if (gradedSubs.length > 0) {
                const total = gradedSubs.reduce((sum, s) => {
                  const sc = (s.score || 0) > 10 ? (s.score || 0) / 10 : (s.score || 0);
                  return sum + sc;
                }, 0);
                avgScoreVal = parseFloat((total / gradedSubs.length).toFixed(1));
              }

              // 3. Kiểm tra định kỳ & Cuối khóa (từ assessmentResultData)
              const classAssessmentIds = new Set(assessmentData.filter(a => a.class_id === cls.class_id).map(a => a.assessment_id));
              const periodicResults = assessmentResultData.filter(r => 
                r.student_id === student.student_id && 
                classAssessmentIds.has(r.assessment_id) && 
                r.score !== null
              );
              let periodicScoreVal: number | null = null;
              if (periodicResults.length > 0) {
                const sumP = periodicResults.reduce((acc, r) => acc + (r.score ?? 0), 0);
                periodicScoreVal = parseFloat((sumP / periodicResults.length).toFixed(1));
              }

              // 4. Đồng bộ Trọng số từ Tab "Cấu hình" của lớp
              const weights = getClassWeights(cls.class_id);
              const wAtt = weights.attendance ?? 10;
              const wHw = weights.homework ?? 30;
              const wPer = weights.periodic_test ?? 30;
              const wFin = weights.final_test ?? 30;

              // 5. Tính Điểm tổng kết tạm tính (phân bổ lại các thành phần đã có dữ liệu)
              let totalWeightWithData = 0;
              let weightedSum = 0;

              if (attScore !== null) {
                weightedSum += attScore * wAtt;
                totalWeightWithData += wAtt;
              }
              if (avgScoreVal !== null) {
                weightedSum += avgScoreVal * wHw;
                totalWeightWithData += wHw;
              }
              if (periodicScoreVal !== null) {
                weightedSum += periodicScoreVal * wPer;
                totalWeightWithData += wPer;
              }

              let summaryScoreStr = '—';
              if (totalWeightWithData > 0) {
                const calculated = (weightedSum / totalWeightWithData).toFixed(1);
                summaryScoreStr = calculated;
              }

              return `
                <!-- Thẻ trắng bo góc lớn cho mỗi lớp -->
                <div class="card-gamified class-result-card" style="background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:24px;box-shadow:0 4px 18px rgba(108,71,217,0.04)">
                  
                  <!-- Tiêu đề lớp in đậm -->
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px">
                    <div>
                      <h3 style="font-size:18px;font-weight:800;color:#2D2824;margin:0 0 4px 0;letter-spacing:-0.01em">
                        ${cls.class_name}
                      </h3>
                      <div style="font-size:12.5px;color:#736B7C;font-weight:500">
                        ${cls.schedule} · Cơ sở: ${cls.campus} · ${cls.author_name || 'GV. Lê Minh Cường'}
                      </div>
                    </div>
                    <a href="#/student-class-detail" style="background:#F3EFFF;color:#6C47D9;border:1px solid #E0D4FC;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:800;text-decoration:none;flex-shrink:0">
                      Vào lớp →
                    </a>
                  </div>

                  <!-- Hàng 3 cột chỉ số chính nằm ngang: Điểm TB, Chuyên cần, Tổng kết -->
                  <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:16px">
                    <!-- 1. Điểm TB -->
                    <div style="background:#FAF8FD;border:1px solid #E8E2F8;border-radius:16px;padding:14px;text-align:center">
                      <div style="font-size:12px;font-weight:700;color:#736B7C;margin-bottom:4px">
                        Điểm TB
                      </div>
                      <div style="font-size:22px;font-weight:900;color:#2D2824">
                        ${avgScoreVal !== null ? avgScoreVal.toFixed(1) : '—'}
                      </div>
                    </div>

                    <!-- 2. Chuyên cần -->
                    <div style="background:#FAF8FD;border:1px solid #E8E2F8;border-radius:16px;padding:14px;text-align:center">
                      <div style="font-size:12px;font-weight:700;color:#736B7C;margin-bottom:4px">
                        Chuyên cần
                      </div>
                      <div style="font-size:22px;font-weight:900;color:${totalEvaluated > 0 ? '#10B981' : '#2D2824'}">
                        ${attRateDisplay}
                      </div>
                    </div>

                    <!-- 3. Tổng kết -->
                    <div style="background:#F3EFFF;border:1.5px solid #E0D4FC;border-radius:16px;padding:14px;text-align:center">
                      <div style="font-size:12px;font-weight:800;color:#6C47D9;margin-bottom:4px">
                        Tổng kết
                      </div>
                      <div style="font-size:22px;font-weight:900;color:#6C47D9">
                        ${summaryScoreStr}
                      </div>
                    </div>
                  </div>

                  <!-- Dòng giải thích công thức chuyên cần -->
                  <div style="font-size:12px;color:#736B7C;line-height:1.5;margin-bottom:18px;background:#FFFFFF;border:1px dashed #E8E2F8;padding:10px 14px;border-radius:12px">
                    Chuyên cần = đi học / (đi học + vắng). Hiện tại: đi học <strong>${presentCount}</strong> · vắng <strong>${absentCount}</strong> · xin nghỉ <strong>${excusedCount}</strong> (không tính vào tỷ lệ).
                  </div>

                  <!-- Khối chi tiết "Các thành phần của điểm tổng kết" -->
                  <div style="margin-bottom:18px">
                    <div style="font-size:12.5px;font-weight:800;color:#2D2824;margin-bottom:10px">
                      Các thành phần của điểm tổng kết:
                    </div>
                    <!-- Liệt kê 4 thành phần trên một hàng ngang -->
                    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;margin-bottom:8px">
                      <!-- Thành phần 1: Chuyên cần -->
                      <div style="background:#FAF8FD;border:1px solid #E8E2F8;border-radius:12px;padding:10px 8px;text-align:center;font-size:11.5px">
                        <div style="font-weight:800;color:#2D2824">Chuyên cần</div>
                        <div style="color:${attScore !== null ? '#10B981' : '#8E8897'};font-weight:700;margin:3px 0">
                          ${attScore !== null ? `${attScore.toFixed(1)}/10` : 'chưa có điểm'}
                        </div>
                        <div style="color:#6C47D9;font-weight:700">trọng số ${wAtt}%</div>
                      </div>

                      <!-- Thành phần 2: Thường xuyên -->
                      <div style="background:#FAF8FD;border:1px solid #E8E2F8;border-radius:12px;padding:10px 8px;text-align:center;font-size:11.5px">
                        <div style="font-weight:800;color:#2D2824">Thường xuyên</div>
                        <div style="color:${avgScoreVal !== null ? '#6C47D9' : '#8E8897'};font-weight:700;margin:3px 0">
                          ${avgScoreVal !== null ? `${avgScoreVal.toFixed(1)}/10` : 'chưa có điểm'}
                        </div>
                        <div style="color:#6C47D9;font-weight:700">trọng số ${wHw}%</div>
                      </div>

                      <!-- Thành phần 3: Định kỳ -->
                      <div style="background:#FAF8FD;border:1px solid #E8E2F8;border-radius:12px;padding:10px 8px;text-align:center;font-size:11.5px">
                        <div style="font-weight:800;color:#2D2824">Định kỳ</div>
                        <div style="color:${periodicScoreVal !== null ? '#6C47D9' : '#8E8897'};font-weight:700;margin:3px 0">
                          ${periodicScoreVal !== null ? `${periodicScoreVal.toFixed(1)}/10` : 'chưa có điểm'}
                        </div>
                        <div style="color:#6C47D9;font-weight:700">trọng số ${wPer}%</div>
                      </div>

                      <!-- Thành phần 4: Cuối khóa -->
                      <div style="background:#FAF8FD;border:1px solid #E8E2F8;border-radius:12px;padding:10px 8px;text-align:center;font-size:11.5px">
                        <div style="font-weight:800;color:#2D2824">Cuối khóa</div>
                        <div style="color:#8E8897;font-weight:700;margin:3px 0">
                          chưa có điểm
                        </div>
                        <div style="color:#6C47D9;font-weight:700">trọng số ${wFin}%</div>
                      </div>
                    </div>

                    <!-- Dòng quy tắc tính điểm -->
                    <div style="font-size:11.5px;color:#8E8897;font-style:italic">
                      Thành phần chưa có điểm được phân bổ lại theo các phần đã có dữ liệu; điểm hiện tại là tạm tính.
                    </div>
                  </div>

                  <!-- Đường kẻ ngang phân cách ở đáy thẻ và dòng trạng thái bài tập -->
                  <div style="border-top:1px solid #E8E2F8;padding-top:16px;margin-top:14px">
                    ${classAssignments.length === 0 ? `
                      <div style="font-size:13px;color:#8E8897;font-style:italic;display:flex;align-items:center;gap:6px">
                        <span>📝</span>
                        <span>Lớp chưa có bài tập nào được xuất bản.</span>
                      </div>
                    ` : gradedSubs.length === 0 ? `
                      <div style="font-size:13px;color:#8E8897;display:flex;align-items:center;gap:6px">
                        <span>📝</span>
                        <span>Lớp có ${classAssignments.length} bài tập đã giao · Chưa có bài nộp nào được chấm điểm.</span>
                      </div>
                    ` : `
                      <div>
                        <div style="font-size:12.5px;font-weight:800;color:#2D2824;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                          <span>📝</span>
                          <span>Bài tập đã chấm điểm (${gradedSubs.length})</span>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px">
                          ${gradedSubs.map(sub => {
                            const asn = classAssignments.find(a => a.id === sub.assignment_id);
                            const scoreFormatted = (sub.score || 0) > 10 ? `${((sub.score || 0) / 10).toFixed(1)}/10` : `${sub.score}/10`;
                            return `
                              <div style="background:#FAF8FD;border:1px solid #E8E2F8;border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px">
                                <div>
                                  <div style="font-size:13px;font-weight:700;color:#2D2824">
                                    ${asn?.title || 'Bài tập trực tuyến'}
                                  </div>
                                  ${sub.teacher_feedback ? `
                                    <div style="font-size:12px;color:#736B7C;margin-top:3px">
                                      Nhận xét: "${sub.teacher_feedback}"
                                    </div>
                                  ` : ''}
                                </div>
                                <div style="text-align:right;flex-shrink:0">
                                  <span style="font-size:14px;font-weight:800;color:#6C47D9">${scoreFormatted}</span>
                                  <div style="font-size:10.5px;color:#10B981;font-weight:700">Đã chấm</div>
                                </div>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      </div>
                    `}
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}

export function initStudentResultsPage(): void {
  // Page interactive logic
}
