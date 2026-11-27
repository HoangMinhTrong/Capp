// ============================================
// EduTrack - Student Join Class Page (Vào lớp bằng mã)
// Gamified Purple Palette (#F8F6FF / #6C47D9 / #E8E2F8)
// ============================================

import { getState } from '../state.ts';
import { classData, enrollmentData } from '../data.ts';
import { showToast } from '../utils.ts';
import { API_BASE_URL } from '../api.ts';

export function renderStudentJoinClassPage(): string {

  return `
    <div class="student-join-class-container" style="background:#F8F6FF;min-height:calc(100vh - 72px);margin:-24px;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;flex-direction:column;align-items:center">
      
      <!-- 1. Header: Nút quay lại "<" + Tiêu đề lớn "Vào lớp" -->
      <div style="width:100%;max-width:540px;margin-bottom:28px;display:flex;align-items:center;gap:16px">
        <a href="#/student-dashboard" class="btn-back-circle" style="width:40px;height:40px;border-radius:50%;background:#FFFFFF;border:1.5px solid #E8E2F8;display:inline-flex;align-items:center;justify-content:center;color:#6C47D9;text-decoration:none;font-weight:700;font-size:18px;box-shadow:0 2px 6px rgba(108,71,217,0.06);transition:all 0.15s ease" title="Quay lại Tổng quan">
          ‹
        </a>
        <h1 style="font-size:26px;font-weight:800;color:#2D2824;margin:0;letter-spacing:-0.02em">
          Vào lớp
        </h1>
      </div>

      <!-- 2. Thẻ trung tâm bo góc lớn -->
      <div class="join-class-card" style="width:100%;max-width:540px;background:#FFFFFF;border:1.5px solid #E8E2F8;border-radius:24px;padding:36px 32px;box-shadow:0 8px 30px rgba(108,71,217,0.06);box-sizing:border-box">
        
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:68px;height:68px;margin:0 auto 16px;background:#F3EFFF;border:1.5px solid #E0D4FC;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:32px">
            🎒
          </div>
          <div style="font-size:15px;color:#554F5D;line-height:1.5;font-weight:500">
            Nhập mã lớp giáo viên cung cấp để tham gia.
          </div>
        </div>

        <form id="form-join-class" onsubmit="return false;" style="display:flex;flex-direction:column;gap:18px">
          <div>
            <label style="display:block;font-size:12.5px;font-weight:700;color:#6C47D9;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em">
              Mã tham gia lớp học
            </label>
            <input 
              type="text" 
              id="input-class-code" 
              placeholder="Nhập mã lớp (vd ABCDEF)" 
              maxlength="12"
              autocomplete="off"
              style="width:100%;box-sizing:border-box;background:#F8F6FF;border:1.5px solid #E8E2F8;border-radius:9999px;padding:14px 22px;font-size:16px;font-weight:700;color:#2D2824;letter-spacing:0.06em;text-align:center;text-transform:uppercase;outline:none;transition:all 0.2s ease"
            />
          </div>

          <!-- Alert message box -->
          <div id="join-class-alert" style="display:none;padding:12px 16px;border-radius:14px;font-size:13.5px;font-weight:600;line-height:1.4"></div>

          <!-- Nút full-width bo tròn màu tím đậm: "Vào lớp" -->
          <button 
            type="submit" 
            id="btn-submit-join-class"
            style="width:100%;background:#6C47D9;color:#FFFFFF;border:none;border-radius:9999px;padding:14px 20px;font-size:15px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(108,71,217,0.3);transition:all 0.15s ease"
          >
            <span>Vào lớp</span>
            <span style="font-size:16px">→</span>
          </button>
        </form>

        <!-- Suggested codes preview for quick demo -->
        <div style="margin-top:28px;padding-top:20px;border-top:1px dashed #E8E2F8;text-align:center">
          <div style="font-size:12px;color:#8E8897;margin-bottom:10px;font-weight:500">
            Gợi ý mã mẫu dành cho học viên kiểm thử:
          </div>
          <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn-demo-code" data-code="ABCDEF" style="background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9;border-radius:9999px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer">
              ABCDEF (IELTS FND)
            </button>
            <button type="button" class="btn-demo-code" data-code="COMM82" style="background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9;border-radius:9999px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer">
              COMM82 (Communication)
            </button>
            <button type="button" class="btn-demo-code" data-code="SELF91" style="background:#F3EFFF;border:1px solid #E0D4FC;color:#6C47D9;border-radius:9999px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer">
              SELF91 (TOEIC 4KN)
            </button>
          </div>
        </div>

      </div>

      <!-- Success Card (hidden initially, shown on successful join) -->
      <div id="join-success-card" style="display:none;width:100%;max-width:540px;background:#FFFFFF;border:1.5px solid #10B981;border-radius:24px;padding:28px 32px;margin-top:20px;text-align:center;box-shadow:0 8px 30px rgba(16,185,129,0.08)">
        <div style="font-size:40px;margin-bottom:10px">🎉</div>
        <h3 id="join-success-title" style="font-size:18px;font-weight:800;color:#065F46;margin:0 0 6px 0">
          Ghi danh thành công!
        </h3>
        <p id="join-success-desc" style="font-size:14px;color:#047857;margin:0 0 20px 0;line-height:1.5"></p>
        <div style="display:flex;gap:10px;justify-content:center">
          <a href="#/student-class-detail" class="btn" style="background:#6C47D9;color:#FFFFFF;border-radius:9999px;padding:10px 24px;font-size:13.5px;font-weight:800;text-decoration:none;box-shadow:0 4px 12px rgba(108,71,217,0.25)">
            Vào học ngay →
          </a>
          <a href="#/student-dashboard" class="btn" style="background:#F3EFFF;color:#6C47D9;border:1px solid #E0D4FC;border-radius:9999px;padding:10px 20px;font-size:13.5px;font-weight:700;text-decoration:none">
            Về trang chủ
          </a>
        </div>
      </div>

    </div>
  `;
}

export function initStudentJoinClassPage(): void {
  const form = document.getElementById('form-join-class') as HTMLFormElement;
  const inputCode = document.getElementById('input-class-code') as HTMLInputElement;
  const alertBox = document.getElementById('join-class-alert');
  const btnSubmit = document.getElementById('btn-submit-join-class') as HTMLButtonElement;
  const successCard = document.getElementById('join-success-card');
  const successDesc = document.getElementById('join-success-desc');

  if (!form || !inputCode) return;

  // Auto uppercase
  inputCode.addEventListener('input', () => {
    inputCode.value = inputCode.value.toUpperCase();
    if (alertBox) alertBox.style.display = 'none';
  });

  // Demo code chips
  document.querySelectorAll('.btn-demo-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = (btn as HTMLElement).dataset.code || '';
      inputCode.value = code;
      inputCode.focus();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawCode = inputCode.value.trim().toUpperCase();

    if (!rawCode) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#FEE2E2';
        alertBox.style.color = '#B91C1C';
        alertBox.style.border = '1px solid #FCA5A5';
        alertBox.textContent = 'Vui lòng nhập mã lớp do giáo viên cung cấp!';
      }
      inputCode.focus();
      return;
    }

    const state = getState();
    const studentId = state.currentStudentView || state.currentUser?.staff_id || 'SV_NN';

    // Disable button during call
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span>Đang kiểm tra...</span>`;

    try {
      // 1. Try FastAPI backend first
      let resJson: any = null;
      try {
        const resp = await fetch(`${API_BASE_URL}/students/join-class`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, class_code: rawCode })
        });
        if (resp.ok) {
          resJson = await resp.json();
        } else {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.detail || 'Không thể tham gia lớp học');
        }
      } catch (backendErr: any) {
        // If network issue with backend, fallback client validation
        if (backendErr.message && !backendErr.message.includes('fetch')) {
          throw backendErr;
        }

        // Local fallback logic matching requirements
        let matchedClass = classData.find(c => 
          c.class_code.toUpperCase() === rawCode || 
          c.class_id.toUpperCase() === rawCode ||
          c.class_code.replace(/-/g, '').toUpperCase() === rawCode
        );

        if (!matchedClass && (rawCode === 'ABCDEF' || rawCode === 'IELTS5' || rawCode === 'FND550')) {
          matchedClass = classData.find(c => c.class_id === 'CLS_NN01') || classData[0];
        }

        if (!matchedClass) {
          throw new Error('Mã lớp không tồn tại hoặc đã nhập sai. Vui lòng kiểm tra lại!');
        }

        if ((matchedClass.status as string) === 'closed' || matchedClass.status === 'completed') {
          throw new Error('Lớp học này đã kết thúc hoặc đóng tiếp nhận học viên.');
        }

        if (matchedClass.class_name.toLowerCase().includes('học thử') || matchedClass.class_id === 'CLS_TRIAL_01') {
          throw new Error('Không thể tự ghi danh vào lớp học thử. Vui lòng liên hệ trung tâm để được xếp lớp!');
        }

        // Check if student already enrolled
        const already = enrollmentData.some(e => e.student_id === studentId && e.class_id === matchedClass?.class_id);
        if (already) {
          resJson = {
            success: true,
            already_joined: true,
            class_id: matchedClass.class_id,
            class_name: matchedClass.class_name,
            message: `Bạn đã tham gia lớp '${matchedClass.class_name}' từ trước!`
          };
        } else {
          // Add enrollment locally
          enrollmentData.push({
            enrollment_id: `ENR_${Date.now()}`,
            student_id: studentId,
            class_id: matchedClass.class_id,
            start_date: new Date().toISOString().slice(0, 10),
            end_date: matchedClass.end_date || '2027-02-28',
            status: 'active'
          });
          matchedClass.current_students = (matchedClass.current_students || 0) + 1;
          resJson = {
            success: true,
            already_joined: false,
            class_id: matchedClass.class_id,
            class_name: matchedClass.class_name,
            message: `Chúc mừng bạn đã gia nhập lớp '${matchedClass.class_name}' thành công!`
          };
        }
      }

      // 2. Synchronize local classData & enrollmentData
      if (resJson && resJson.class_id) {
        const localClass = classData.find(c => c.class_id === resJson.class_id);
        if (localClass && !resJson.already_joined) {
          localClass.current_students = (localClass.current_students || 0) + 1;
        }
        if (!enrollmentData.some(e => e.student_id === studentId && e.class_id === resJson.class_id)) {
          enrollmentData.push({
            enrollment_id: resJson.enrollment_id || `ENR_${Date.now()}`,
            student_id: studentId,
            class_id: resJson.class_id,
            start_date: new Date().toISOString().slice(0, 10),
            end_date: localClass?.end_date || '2027-02-28',
            status: 'active'
          });
        }
      }

      // Success Display
      showToast(resJson.message, 'success');
      if (alertBox) alertBox.style.display = 'none';

      if (successCard && successDesc) {
        successCard.style.display = 'block';
        successDesc.textContent = resJson.message;
        form.style.display = 'none';
      }

    } catch (err: any) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#FEE2E2';
        alertBox.style.color = '#B91C1C';
        alertBox.style.border = '1px solid #FCA5A5';
        alertBox.textContent = err.message || 'Mã lớp không hợp lệ';
      }
      showToast(err.message || 'Lỗi khi vào lớp', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<span>Vào lớp</span><span style="font-size:16px">→</span>`;
    }
  });
}
