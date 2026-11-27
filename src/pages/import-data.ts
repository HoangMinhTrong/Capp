// ============================================
// EduTrack - Import Data Page (Nhập Dữ liệu Excel/CSV)
// ============================================

import { studentData } from '../data.ts';
import { icons, showToast } from '../utils.ts';
import { importStudentsApi } from '../api.ts';
import type { Student, Campus } from '../types.ts';

interface ParsedStudentRow {
  code: string;
  name: string;
  email: string;
  phone: string;
  campus: string;
  isValid: boolean;
  errors: string[];
}

export function renderImportDataPage(): string {
  return `
    <div class="import-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>📤</span>
            <span>Nhập Dữ liệu Học viên (CSV / Excel)</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            Nhập danh sách học viên hàng loạt an toàn, tự động kiểm tra định dạng và tránh trùng lặp
          </div>
        </div>
        <button class="btn btn-secondary" id="btn-download-sample-csv" style="border-radius:9999px;font-size:12.5px;font-weight:700;padding:8px 18px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;display:inline-flex;align-items:center;gap:6px">
          ${icons.download} Tải file mẫu CSV
        </button>
      </div>

      <!-- 2. Upload Zone Card -->
      <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:26px;box-shadow:0 3px 12px rgba(45,40,36,0.03);margin-bottom:24px">
        <div id="drop-zone" style="border:2px dashed #A93226;border-radius:18px;padding:36px 20px;text-align:center;background:#FDF6F5;cursor:pointer;transition:all 0.15s ease">
          <div style="font-size:42px;margin-bottom:8px">📁</div>
          <h3 style="font-size:16px;font-weight:800;color:#2D2824;margin:0 0 6px 0">Kéo thả file CSV vào đây hoặc click để chọn file</h3>
          <p style="font-size:12.5px;color:#7F7A72;margin:0 0 16px 0">Hỗ trợ định dạng file .csv chuẩn UTF-8</p>
          <input type="file" id="csv-file-input" accept=".csv" style="display:none" />
          <button type="button" class="btn btn-primary" onclick="document.getElementById('csv-file-input').click()" style="border-radius:9999px;padding:8px 22px;border:none;background:#A93226;color:#FFFFFF;font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer">
            Chọn file từ máy tính
          </button>
        </div>

        <!-- Quick Paste Option -->
        <div style="margin-top:16px">
          <details style="cursor:pointer">
            <summary style="font-size:12.5px;color:#7F7A72;font-weight:600">Hoặc dán nội dung CSV trực tiếp vào đây</summary>
            <div style="margin-top:10px">
              <textarea id="csv-paste-area" class="form-textarea" placeholder="Mã HV,Họ và tên,Email,Số điện thoại,Cơ sở&#10;HV2026013,Phạm Gia Huy,huy.pg@email.com,0901234567,CS1" style="width:100%;font-family:monospace;font-size:12px;min-height:90px;padding:12px;border:1px solid #EAE4D8;border-radius:12px;background:#FAF7F2;color:#2D2824;outline:none;box-sizing:border-box"></textarea>
              <div style="display:flex;justify-content:flex-end;margin-top:8px">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-parse-paste" style="border-radius:9999px;padding:6px 16px;border:1px solid #EAE4D8;background:#FFFFFF;color:#2D2824;font-weight:700;cursor:pointer">
                  Phân tích nội dung
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- 3. Preview Section -->
      <div id="import-preview-card" style="display:none;background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;overflow:hidden;box-shadow:0 3px 12px rgba(45,40,36,0.03)">
        <div style="background:#FAF5EE;padding:16px 24px;border-bottom:1px solid #EAE4D8;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <h3 style="margin:0;font-size:16px;font-weight:800;color:#2D2824">Xem trước dữ liệu phân tích</h3>
            <span id="preview-status-badge" class="badge" style="background:#E2F6ED;color:#059669;font-weight:700;padding:4px 12px;border-radius:9999px">0 bản ghi hợp lệ</span>
          </div>
          <button class="btn btn-primary" id="btn-confirm-import" disabled style="border-radius:9999px;padding:8px 20px;border:none;background:#A93226;color:#FFFFFF;font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer">
            ${icons.check} Xác nhận Nhập dữ liệu
          </button>
        </div>
        <div style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">
            <thead>
              <tr style="border-bottom:1.5px solid #EAE4D8;color:#7F7A72;font-size:11.5px;font-weight:800;letter-spacing:0.04em;background:#FFFDF9">
                <th style="padding:12px 16px;width:40px">#</th>
                <th style="padding:12px 16px">MÃ HỌC VIÊN</th>
                <th style="padding:12px 16px">HỌ VÀ TÊN</th>
                <th style="padding:12px 16px">EMAIL</th>
                <th style="padding:12px 16px">SỐ ĐIỆN THOẠI</th>
                <th style="padding:12px 16px">CƠ SỞ</th>
                <th style="padding:12px 16px">TRẠNG THÁI KIỂM TRA</th>
              </tr>
            </thead>
            <tbody id="preview-tbody"></tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

export function initImportDataPage(): void {
  const fileInput = document.getElementById('csv-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('drop-zone');
  const pasteArea = document.getElementById('csv-paste-area') as HTMLTextAreaElement | null;
  const parsePasteBtn = document.getElementById('btn-parse-paste');
  const previewCard = document.getElementById('import-preview-card');
  const previewTbody = document.getElementById('preview-tbody');
  const previewBadge = document.getElementById('preview-status-badge');
  const confirmBtn = document.getElementById('btn-confirm-import') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('btn-download-sample-csv');

  let currentParsedRows: ParsedStudentRow[] = [];

  // Drag and drop support
  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-600)';
    dropZone.style.background = 'var(--primary-100)';
  });
  dropZone?.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--primary-300)';
    dropZone.style.background = 'var(--primary-50)';
  });
  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-300)';
    dropZone.style.background = 'var(--primary-50)';
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        processCsvText(text);
      };
      reader.readAsText(file);
    }
  });

  // Download sample
  sampleBtn?.addEventListener('click', () => {
    const sample = 'Mã HV,Họ và tên,Email,Số điện thoại,Cơ sở\nHV2026013,Phạm Gia Huy,huy.pg@email.com,0901234567,CS1\nHV2026014,Ngô Thảo Nguyên,nguyen.nt@email.com,0901234568,CS2';
    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_DanhSach_HocVien.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file mẫu CSV!', 'info');
  });

  function processCsvText(text: string) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      showToast('File CSV không có dữ liệu!', 'warning');
      return;
    }

    // Skip header line
    const dataLines = lines.slice(1);
    currentParsedRows = dataLines.map((line, idx) => {
      // Split by comma
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      const code = parts[0] || `HV2026${String(studentData.length + idx + 1).padStart(3, '0')}`;
      const name = parts[1] || '';
      const email = parts[2] || '';
      const phone = parts[3] || '';
      const campus = (parts[4] || 'CS1').toUpperCase();

      const errors: string[] = [];
      if (!name) errors.push('Thiếu họ tên');
      if (!email || !email.includes('@')) errors.push('Email không hợp lệ');
      if (campus !== 'CS1' && campus !== 'CS2') errors.push('Cơ sở phải là CS1 hoặc CS2');

      const isDuplicate = studentData.some(s => s.student_code === code || s.email === email);
      if (isDuplicate) errors.push('Trùng mã HV hoặc email trong hệ thống');

      return {
        code,
        name,
        email,
        phone,
        campus: campus === 'CS2' ? 'CS2' : 'CS1',
        isValid: errors.length === 0,
        errors,
      };
    });

    renderPreview();
  }

  function renderPreview() {
    if (!previewCard || !previewTbody || !previewBadge || !confirmBtn) return;

    previewCard.style.display = 'block';
    const validCount = currentParsedRows.filter(r => r.isValid).length;

    previewBadge.className = validCount === currentParsedRows.length ? 'badge badge-green' : 'badge badge-amber';
    previewBadge.textContent = `${validCount}/${currentParsedRows.length} bản ghi hợp lệ`;
    confirmBtn.disabled = validCount === 0;

    previewTbody.innerHTML = currentParsedRows.map((r, i) => `
      <tr style="${r.isValid ? '' : 'background:var(--red-50)'}">
        <td>${i + 1}</td>
        <td style="font-family:var(--font-mono);font-size:var(--text-sm)">${r.code}</td>
        <td style="font-weight:600">${r.name || '—'}</td>
        <td>${r.email || '—'}</td>
        <td>${r.phone || '—'}</td>
        <td><span class="badge badge-blue">${r.campus}</span></td>
        <td>
          ${r.isValid ? `
            <span class="badge badge-green">${icons.check} Hợp lệ</span>
          ` : `
            <span class="badge badge-red" title="${r.errors.join(', ')}">${icons.warning} ${r.errors.join('; ')}</span>
          `}
        </td>
      </tr>
    `).join('');
  }

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCsvText(text);
    };
    reader.readAsText(file);
  });

  parsePasteBtn?.addEventListener('click', () => {
    const text = pasteArea?.value.trim() ?? '';
    if (!text) {
      showToast('Vui lòng dán nội dung CSV trước', 'warning');
      return;
    }
    processCsvText(text);
  });

  // Confirm import
  confirmBtn?.addEventListener('click', () => {
    const validRows = currentParsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    validRows.forEach(r => {
      const nameParts = r.name.split(' ');
      const avatar_initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : r.name.slice(0, 2).toUpperCase();

      const newStudent: Student = {
        student_id: `SV${String(studentData.length + 1).padStart(3, '0')}`,
        student_code: r.code,
        full_name: r.name,
        email: r.email,
        phone: r.phone,
        status: 'active',
        campus: r.campus as Campus,
        enrollment_date: new Date().toISOString().split('T')[0],
        avatar_initials,
      };

      studentData.unshift(newStudent);
    });

    // Async sync with Python API
    importStudentsApi(validRows.map(r => ({
      code: r.code,
      name: r.name,
      email: r.email,
      phone: r.phone,
      campus: r.campus,
    })));

    showToast(`Đã import thành công ${validRows.length} học viên mới vào hệ thống!`, 'success');
    if (previewCard) previewCard.style.display = 'none';
    if (pasteArea) pasteArea.value = '';
    currentParsedRows = [];
  });
}

