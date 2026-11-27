
import type { Class, ClassStatus, Campus } from '../types.ts';
import {
  classData, staffData, classAssignmentData,
  courseLessonsData, courseVocabularyData, courseExamSampleData,
} from '../data.ts';
import { getState } from '../state.ts';
import {
  icons,
  classStatusLabels,
  classStatusBadgeClass,
  campusLabels,
  formatDate,
  showToast,
} from '../utils.ts';

function getFilteredClasses(search: string, statusFilter: string): Class[] {
  const campus = getState().selectedCampus;
  let classes = [...classData];

  if (campus !== 'all') {
    classes = classes.filter(c => c.campus === campus);
  }

  if (statusFilter && statusFilter !== 'all') {
    classes = classes.filter(c => c.status === statusFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    classes = classes.filter(c =>
      c.class_name.toLowerCase().includes(q) ||
      c.class_code.toLowerCase().includes(q) ||
      c.course_name.toLowerCase().includes(q) ||
      (c.author_name && c.author_name.toLowerCase().includes(q))
    );
  }

  return classes;
}

function getTeacherNameForClass(classId: string, fallbackAuthor?: string): string {
  if (fallbackAuthor) return fallbackAuthor;
  const assignment = classAssignmentData.find(ca => ca.class_id === classId);
  if (assignment) {
    const staff = staffData.find(s => s.staff_id === assignment.teacher_id);
    if (staff) return `GV. ${staff.full_name}`;
  }
  return 'GV. Lê Minh Cường';
}

function renderCourseCard(cls: Class): string {
  const sessionPct = cls.total_sessions > 0
    ? Math.round((cls.completed_sessions / cls.total_sessions) * 100)
    : 0;

  // Lấy danh sách bài học thực tế trong khóa
  const lessons = courseLessonsData.filter(l => l.class_id === cls.class_id);
  const lessonCount = lessons.length > 0 ? lessons.length : (cls.lesson_count || cls.total_sessions || 24);
  const teacherName = getTeacherNameForClass(cls.class_id, cls.author_name);

  return `
    <div class="card animate-fade-in-up" style="background:#FFFDF9;border:1px solid #ECE3D6;border-radius:20px;box-shadow:0 4px 14px rgba(60,40,20,0.03);display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.15s,box-shadow 0.15s">
      <div class="card-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
        
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span class="badge ${classStatusBadgeClass[cls.status]}" style="font-size:10px">${classStatusLabels[cls.status]}</span>
              <span class="badge badge-teal" style="font-size:10px">${campusLabels[cls.campus]}</span>
            </div>
            <h3 style="font-size:16px;font-weight:800;color:#24201D;margin:0 0 4px 0;line-height:1.3">
              ${cls.class_name}
            </h3>
            <span style="font-size:11px;color:#8F8276;font-family:var(--font-mono,monospace)">Mã: ${cls.class_code}</span>
          </div>
        </div>

        <!-- 3 Required Key Info Points (Theo yêu cầu) -->
        <div style="display:flex;flex-direction:column;gap:8px;background:#FAF5EE;border:1px solid #ECE3D6;border-radius:14px;padding:12px 14px">
          <!-- 1. Số lượng bài học -->
          <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#24201D">
            <span style="font-size:15px;width:24px;text-align:center">📖</span>
            <div style="display:flex;align-items:baseline;gap:4px">
              <span style="color:#7A6E65">Số bài học:</span>
              <strong style="color:#0284c7;font-weight:800">${lessonCount} bài học</strong>
            </div>
          </div>

          <!-- 2. Bao nhiêu lớp cho khóa học đó -->
          <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#24201D">
            <span style="font-size:15px;width:24px;text-align:center">🏫</span>
            <div style="display:flex;align-items:baseline;gap:4px">
              <span style="color:#7A6E65">Quy mô lớp:</span>
              <strong style="color:#059669;font-weight:700">1 lớp trực thuộc</strong>
              <span style="font-size:11px;color:#8F8276">(${cls.current_students}/${cls.max_students} HV)</span>
            </div>
          </div>

          <!-- 3. Soạn bởi GV nào -->
          <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#24201D">
            <span style="font-size:15px;width:24px;text-align:center">👨‍🏫</span>
            <div style="display:flex;align-items:baseline;gap:4px">
              <span style="color:#7A6E65">Soạn bởi:</span>
              <strong style="color:#EA580C;font-weight:800">${teacherName}</strong>
            </div>
          </div>
        </div>

        <!-- Schedule & Timeline -->
        <div style="display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#7A6E65">
          <div style="display:flex;align-items:center;gap:6px">
            <span>⏰ Lịch:</span>
            <span style="font-weight:600;color:#24201D">${cls.schedule}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span>🗓️ Thời gian:</span>
            <span>${formatDate(cls.start_date)} – ${formatDate(cls.end_date)}</span>
          </div>
        </div>

        <!-- Session Progress -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:11px">
            <span style="color:#7A6E65">Tiến độ khóa</span>
            <span style="font-weight:700;color:#24201D">${cls.completed_sessions}/${cls.total_sessions} buổi (${sessionPct}%)</span>
          </div>
          <div class="progress-bar" style="height:6px;border-radius:9999px;background:#ECE3D6">
            <div class="progress-bar-fill" style="width:${sessionPct}%;background:#24201D;border-radius:9999px"></div>
          </div>
        </div>

      </div>

      <!-- Card Action Buttons (Sao chép, Xóa, Chi tiết) -->
      <div class="card-footer" style="padding:12px 18px;border-top:1px solid #ECE3D6;display:flex;justify-content:space-between;align-items:center;background:#FAF8F4;border-bottom-left-radius:20px;border-bottom-right-radius:20px">
        <div style="display:flex;gap:6px;align-items:center">
          <!-- Nút sao chép khóa học (Duplicate) -->
          <button type="button" class="btn btn-sm btn-secondary btn-duplicate-course" data-class-id="${cls.class_id}" title="Sao chép để tạo Khóa học y chang có thể sao chép bài giảng" style="border-radius:9999px;font-size:11.5px;font-weight:700;padding:5px 11px;display:flex;align-items:center;gap:4px;border:1px solid #ECE3D6;background:#FFFDF9;color:#24201D;cursor:pointer">
            📋 Sao chép
          </button>
          
          <!-- Nút xóa khóa học (Delete) -->
          <button type="button" class="btn btn-sm btn-ghost btn-delete-course" data-class-id="${cls.class_id}" data-class-name="${cls.class_name}" title="Xóa khóa học" style="border-radius:9999px;font-size:11.5px;font-weight:700;padding:5px 10px;color:#dc2626;display:flex;align-items:center;gap:4px;cursor:pointer">
            🗑️ Xóa
          </button>
        </div>

        <!-- Nút vào chi tiết khóa học -->
        <a href="#/classes/${cls.class_id}" class="btn btn-sm btn-primary" style="border-radius:9999px;font-size:11.5px;font-weight:700;padding:5px 14px;background:#24201D;color:#fff;text-decoration:none;display:flex;align-items:center;gap:4px">
          Chi tiết ➔
        </a>
      </div>
    </div>
  `;
}

export function renderCoursesPage(): string {
  const classes = getFilteredClasses('', 'all');
  const totalCourses = classData.length;
  const inProgressCourses = classData.filter(c => c.status === 'in_progress').length;
  const totalLessons = courseLessonsData.length;
  const totalVocabs = courseVocabularyData.length;

  return `
    <div class="courses-page-container" style="background:#FAF7F2;min-height:calc(100vh - 72px);margin:-24px;padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <!-- 1. Header Trang đồng nhất Bento Warm Minimalist -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#2D2824;margin:0 0 6px 0;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px">
            <span>📚</span>
            <span>Quản lý Khóa học</span>
          </h1>
          <div style="font-size:14px;color:#7F7A72;font-weight:500">
            Quản lý chương trình đào tạo, khung bài giảng, từ vựng và quy mô lớp trực thuộc toàn trung tâm
          </div>
        </div>
        <button class="btn btn-primary" id="btn-add-class" style="border-radius:9999px;font-weight:700;font-size:13px;padding:9px 20px;background:#A93226;border:none;color:#FFFFFF;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(169,50,38,0.25);cursor:pointer">
          ${icons.plus} Tạo khóa học mới
        </button>
      </div>

      <!-- 2. Hàng 4 Thẻ KPI Bento (1 hàng × 4 cột) -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
        <div style="background:#FDF6F5;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;position:relative;overflow:hidden;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#A93226;line-height:1;margin-bottom:8px">
            ${totalCourses}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Tổng số khóa học</div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:#A93226"></div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#166534;line-height:1;margin-bottom:8px">
            ${inProgressCourses}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Khóa đang giảng dạy</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#D97706;line-height:1;margin-bottom:8px">
            ${totalLessons}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Kho bài giảng hệ thống</div>
        </div>

        <div style="background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:20px 22px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
          <div style="font-size:32px;font-weight:900;color:#2563EB;line-height:1;margin-bottom:8px">
            ${totalVocabs}
          </div>
          <div style="font-size:13px;font-weight:700;color:#7F7A72">Từ vựng &amp; Đề thi mẫu</div>
        </div>
      </div>

      <!-- 3. Filter Bar Bento -->
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;background:#FFFFFF;border:1px solid #EAE4D8;border-radius:18px;padding:14px 20px;box-shadow:0 2px 8px rgba(45,40,36,0.02)">
        <div class="search-input-wrapper" style="flex:1;min-width:240px;position:relative">
          <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);opacity:0.6">${icons.search}</span>
          <input type="text" id="classes-search" class="form-input" placeholder="Tìm theo tên khóa học, mã khóa, giảng viên..." style="padding-left:38px;height:40px;border-radius:12px;border:1px solid #EAE4D8;background:#FAF7F2;color:#2D2824;font-size:13px;width:100%;outline:none;box-sizing:border-box" />
        </div>
        <select id="classes-campus-filter" class="form-select" style="min-width:140px;height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4D8;background:#FAF7F2;color:#2D2824;font-size:13px;outline:none;cursor:pointer">
          <option value="all">Tất cả cơ sở</option>
          <option value="CS1">Cơ sở 1</option>
          <option value="CS2">Cơ sở 2</option>
        </select>
        <select id="classes-status-filter" class="form-select" style="min-width:160px;height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4D8;background:#FAF7F2;color:#2D2824;font-size:13px;outline:none;cursor:pointer">
          <option value="all">Tất cả trạng thái</option>
          <option value="in_progress">Đang giảng dạy</option>
          <option value="upcoming">Sắp khai giảng</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <!-- Summary count -->
      <div style="margin-bottom:16px;font-size:13px;color:#7F7A72;display:flex;align-items:center;justify-content:space-between" id="classes-count">
        <span>Hiển thị <strong style="color:#2D2824">${classes.length}</strong> khóa học</span>
        <span style="font-size:12px;color:#A8A29A">Nhấn 📋 Sao chép để nhân bản khóa học cùng toàn bộ bài giảng</span>
      </div>

      <!-- Course Grid -->
      <div class="grid-cols-3" id="classes-grid" style="gap:20px">
        ${classes.length > 0
      ? classes.map((c, i) => `<div class="stagger-${(i % 6) + 1}">${renderCourseCard(c)}</div>`).join('')
      : `<div class="empty-state" style="grid-column:1/-1;background:#FFFFFF;border:1px solid #EAE4D8;border-radius:20px;padding:48px 24px;text-align:center">
              <div style="font-size:48px;margin-bottom:12px">📚</div>
              <h3 style="font-size:17px;font-weight:800;color:#2D2824;margin:0 0 6px 0">Không tìm thấy khóa học nào</h3>
              <p style="color:#7F7A72;margin:0;font-size:13px">Vui lòng thay đổi từ khóa hoặc bộ lọc để xem các khóa học khác.</p>
            </div>`
    }
      </div>

      <!-- Modals Container (Add Course & Delete Confirm) -->
      <div id="classes-modal-container"></div>
    </div>
  `;
}

export function initCoursesPage(): void {
  const searchInput = document.getElementById('classes-search') as HTMLInputElement | null;
  const campusFilter = document.getElementById('classes-campus-filter') as HTMLSelectElement | null;
  const statusFilter = document.getElementById('classes-status-filter') as HTMLSelectElement | null;
  const grid = document.getElementById('classes-grid');
  const countEl = document.getElementById('classes-count');
  const modalContainer = document.getElementById('classes-modal-container');

  // Sync campus filter with global state
  const currentCampus = getState().selectedCampus;
  if (campusFilter && currentCampus !== 'all') {
    campusFilter.value = currentCampus;
  }

  function attachCardListeners() {
    // 1. Sao chép Khóa học (Duplicate Course)
    document.querySelectorAll<HTMLElement>('.btn-duplicate-course').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = btn.dataset.classId;
        if (!classId) return;

        const sourceClass = classData.find(c => c.class_id === classId);
        if (!sourceClass) return;

        const timestamp = Date.now().toString().slice(-4);
        const newClassId = `CLS${timestamp}`;
        const newClassName = `${sourceClass.class_name} (bản sao)`;
        const newClassCode = `${sourceClass.class_code}-CPY`;

        const newClass: Class = {
          ...sourceClass,
          class_id: newClassId,
          class_name: newClassName,
          class_code: newClassCode,
          current_students: 0,
          completed_sessions: 0,
          start_date: new Date().toISOString().split('T')[0],
        };

        // Thêm vào danh sách khóa học
        classData.unshift(newClass);

        // Sao chép toàn bộ bài giảng của khóa cũ sang khóa mới
        const sourceLessons = courseLessonsData.filter(l => l.class_id === classId);
        sourceLessons.forEach((l, idx) => {
          courseLessonsData.push({
            ...l,
            lesson_id: `LES${timestamp}${idx + 1}`,
            class_id: newClassId,
            title: l.title,
          });
        });

        // Sao chép từ vựng của khóa cũ
        const sourceVocabs = courseVocabularyData.filter(v => v.class_id === classId);
        sourceVocabs.forEach((v, idx) => {
          courseVocabularyData.push({
            ...v,
            vocab_id: `VOC${timestamp}${idx + 1}`,
            class_id: newClassId,
          });
        });

        // Sao chép đề thi mẫu
        const sourceExams = courseExamSampleData.filter(ex => ex.class_id === classId);
        sourceExams.forEach((ex, idx) => {
          courseExamSampleData.push({
            ...ex,
            exam_id: `EXM${timestamp}${idx + 1}`,
            class_id: newClassId,
          });
        });

        showToast(`Đã sao chép khóa học "${newClassName}" cùng toàn bộ bài giảng!`, 'success');
        update();
      });
    });

    // 2. Xóa Khóa học với Modal Xác nhận chuẩn yêu cầu
    document.querySelectorAll<HTMLElement>('.btn-delete-course').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = btn.dataset.classId;
        const className = btn.dataset.className || 'Khóa học';
        if (!classId || !modalContainer) return;

        // Modal Xác nhận xóa chuẩn yêu cầu:
        // "Xóa cả bài giảng, từ vựng & lớp của “[Tên khóa]”? Không hoàn tác, cùng đó có 2 Nút: Hủy và Xóa vĩnh viễn."
        modalContainer.innerHTML = `
          <div class="modal-backdrop" id="delete-course-backdrop">
            <div class="modal" style="max-width:460px;background:#FFFDF9;border:1px solid #ECE3D6;border-radius:24px;overflow:hidden;box-shadow:0 16px 48px rgba(60,40,20,0.15)">
              <div class="modal-header" style="padding:20px 24px 12px 24px;border-bottom:1px solid #ECE3D6;display:flex;align-items:center;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:20px">⚠️</span>
                  <h3 style="margin:0;font-size:17px;font-weight:800;color:#dc2626">Xác nhận xóa khóa học</h3>
                </div>
                <button class="btn btn-ghost btn-icon btn-sm" id="close-delete-modal">${icons.close}</button>
              </div>

              <div class="modal-body" style="padding:20px 24px">
                <p style="font-size:14px;color:#24201D;line-height:1.6;margin:0 0 14px 0">
                  Xóa cả bài giảng, từ vựng &amp; lớp của <strong>“${className}”</strong>? Không hoàn tác.
                </p>
                <div style="background:#FFF5F5;border:1px solid #FED7D7;border-radius:12px;padding:12px 14px;font-size:12px;color:#C53030;line-height:1.5">
                  Dữ liệu về các bài giảng, ngân hàng từ vựng, bài tập và hồ sơ lớp học liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </div>
              </div>

              <div class="modal-footer" style="padding:14px 24px;border-top:1px solid #ECE3D6;background:#FAF8F4;display:flex;justify-content:flex-end;gap:10px">
                <button type="button" class="btn btn-secondary" id="btn-cancel-delete" style="border-radius:9999px;font-weight:700;font-size:13px;padding:7px 18px;border:1px solid #ECE3D6;background:#FFFDF9;color:#24201D;cursor:pointer">
                  Hủy
                </button>
                <button type="button" class="btn btn-danger" id="btn-confirm-delete" style="border-radius:9999px;font-weight:700;font-size:13px;padding:7px 20px;background:#dc2626;color:#fff;border:none;cursor:pointer">
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        `;

        const closeModal = () => { modalContainer.innerHTML = ''; };
        document.getElementById('close-delete-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-delete')?.addEventListener('click', closeModal);
        document.getElementById('delete-course-backdrop')?.addEventListener('click', (evt) => {
          if ((evt.target as HTMLElement).id === 'delete-course-backdrop') closeModal();
        });

        document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
          // Xóa khóa học
          const classIdx = classData.findIndex(c => c.class_id === classId);
          if (classIdx !== -1) {
            classData.splice(classIdx, 1);
          }

          // Xóa các bài giảng của khóa
          for (let i = courseLessonsData.length - 1; i >= 0; i--) {
            if (courseLessonsData[i].class_id === classId) {
              courseLessonsData.splice(i, 1);
            }
          }

          // Xóa từ vựng của khóa
          for (let i = courseVocabularyData.length - 1; i >= 0; i--) {
            if (courseVocabularyData[i].class_id === classId) {
              courseVocabularyData.splice(i, 1);
            }
          }

          // Xóa đề thi mẫu của khóa
          for (let i = courseExamSampleData.length - 1; i >= 0; i--) {
            if (courseExamSampleData[i].class_id === classId) {
              courseExamSampleData.splice(i, 1);
            }
          }

          closeModal();
          showToast(`Đã xóa vĩnh viễn khóa học “${className}”!`, 'success');
          update();
        });
      });
    });
  }

  function update() {
    const search = searchInput?.value ?? '';
    const status = statusFilter?.value ?? 'all';
    const campusVal = campusFilter?.value ?? 'all';

    let classes = [...classData];

    if (campusVal !== 'all') {
      classes = classes.filter(c => c.campus === campusVal);
    }

    if (status !== 'all') {
      classes = classes.filter(c => c.status === status as ClassStatus);
    }

    if (search) {
      const q = search.toLowerCase();
      classes = classes.filter(c =>
        c.class_name.toLowerCase().includes(q) ||
        c.class_code.toLowerCase().includes(q) ||
        c.course_name.toLowerCase().includes(q) ||
        (c.author_name && c.author_name.toLowerCase().includes(q))
      );
    }

    if (grid) {
      grid.innerHTML = classes.length > 0
        ? classes.map((c, i) => `<div class="stagger-${(i % 6) + 1}">${renderCourseCard(c)}</div>`).join('')
        : `<div class="empty-state" style="grid-column:1/-1;background:#FFFDF9;border:1px solid #ECE3D6;border-radius:20px;padding:48px 24px">
            <div style="font-size:48px;margin-bottom:12px">📚</div>
            <h3 style="font-size:17px;font-weight:700;color:#24201D;margin:0 0 6px 0">Không tìm thấy khóa học nào</h3>
            <p style="color:#7A6E65;margin:0">Vui lòng thay đổi từ khóa hoặc bộ lọc để xem các khóa học khác.</p>
          </div>`;
    }

    if (countEl) {
      countEl.innerHTML = `
        <span>Hiển thị <strong>${classes.length}</strong> khóa học</span>
        <span style="font-size:11.5px;color:#A3978B">Nhấn 📋 Sao chép để nhân bản khóa học cùng toàn bộ bài giảng</span>
      `;
    }

    attachCardListeners();
  }

  searchInput?.addEventListener('input', update);
  campusFilter?.addEventListener('change', update);
  statusFilter?.addEventListener('change', update);

  // Gắn listeners lần đầu
  attachCardListeners();

  // Modal Tạo khóa học mới
  const addBtn = document.getElementById('btn-add-class');
  addBtn?.addEventListener('click', () => {
    if (!modalContainer) return;

    const teachers = staffData.filter(s => s.role === 'teacher' && s.is_active);
    const tas = staffData.filter(s => s.role === 'teaching_assistant' && s.is_active);
    const nextNum = classData.length + 1;
    const defaultCode = `IELTS-5.5-0${nextNum}`;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" id="add-class-backdrop">
        <div class="modal" style="max-width:560px;background:#FFFDF9;border:1px solid #ECE3D6;border-radius:24px;overflow:hidden;box-shadow:0 16px 48px rgba(60,40,20,0.15)">
          <div class="modal-header" style="padding:20px 24px 14px 24px;border-bottom:1px solid #ECE3D6;display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:20px">📚</span>
              <h3 style="margin:0;font-size:17px;font-weight:800;color:#24201D">
                Tạo Khóa học mới
              </h3>
            </div>
            <button class="btn btn-ghost btn-icon btn-sm" id="close-add-class-modal">${icons.close}</button>
          </div>

          <form id="add-class-form">
            <div class="modal-body" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px">
              <div class="grid-cols-2" style="gap:12px">
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Tên Khóa học <span class="required">*</span></label>
                  <input type="text" class="form-input" id="new-class-name" placeholder="IELTS 5.5 - Lớp 02" required style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Mã Khóa học <span class="required">*</span></label>
                  <input type="text" class="form-input" id="new-class-code" value="${defaultCode}" required style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%" />
                </div>
              </div>

              <div class="grid-cols-2" style="gap:12px">
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Chương trình <span class="required">*</span></label>
                  <input type="text" class="form-input" id="new-course-name" placeholder="IELTS 5.5" value="IELTS 5.5" required style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Cơ sở đào tạo <span class="required">*</span></label>
                  <select class="form-select" id="new-class-campus" style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%">
                    <option value="CS1">Cơ sở 1</option>
                    <option value="CS2" selected>Cơ sở 2</option>
                  </select>
                </div>
              </div>

              <div class="grid-cols-2" style="gap:12px">
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Giảng viên biên soạn <span class="required">*</span></label>
                  <select class="form-select" id="new-class-teacher" style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%">
                    ${teachers.map(t => `<option value="${t.staff_id}">${t.full_name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Số lượng bài học ban đầu</label>
                  <input type="number" class="form-input" id="new-class-lessons" value="24" min="1" max="100" style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%" />
                </div>
              </div>

              <div class="grid-cols-2" style="gap:12px">
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Lịch học</label>
                  <input type="text" class="form-input" id="new-class-schedule" value="T2/T4/T6 - 18:00-20:00" style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px;font-weight:700;color:#24201D;margin-bottom:4px">Trợ giảng phụ trách</label>
                  <select class="form-select" id="new-class-ta" style="border-radius:12px;border:1px solid #ECE3D6;background:#FAF8F4;padding:8px 12px;font-size:13px;width:100%">
                    ${tas.map(t => `<option value="${t.staff_id}">${t.full_name}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer" style="padding:14px 24px;border-top:1px solid #ECE3D6;background:#FAF8F4;display:flex;justify-content:flex-end;gap:10px">
              <button type="button" class="btn btn-secondary" id="cancel-add-class" style="border-radius:9999px;font-weight:700;font-size:13px;padding:7px 18px;border:1px solid #ECE3D6;background:#FFFDF9;color:#24201D;cursor:pointer">
                Hủy
              </button>
              <button type="submit" class="btn btn-primary" style="border-radius:9999px;font-weight:700;font-size:13px;padding:7px 20px;background:#24201D;color:#fff;border:none;cursor:pointer">
                ${icons.plus} Tạo khóa học
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('close-add-class-modal');
    const cancelBtn = document.getElementById('cancel-add-class');
    const backdrop = document.getElementById('add-class-backdrop');
    const form = document.getElementById('add-class-form');

    const closeModal = () => { modalContainer.innerHTML = ''; };
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('new-class-name') as HTMLInputElement).value.trim();
      const code = (document.getElementById('new-class-code') as HTMLInputElement).value.trim();
      const course = (document.getElementById('new-course-name') as HTMLInputElement).value.trim();
      const campus = (document.getElementById('new-class-campus') as HTMLSelectElement).value as Campus;
      const schedule = (document.getElementById('new-class-schedule') as HTMLInputElement).value.trim();
      const teacherId = (document.getElementById('new-class-teacher') as HTMLSelectElement).value;
      const lessonsNum = parseInt((document.getElementById('new-class-lessons') as HTMLInputElement).value, 10) || 24;
      const teacherStaff = staffData.find(s => s.staff_id === teacherId);
      const authorName = teacherStaff ? `GV. ${teacherStaff.full_name}` : 'GV. Phạm Thị Dung';

      if (!name || !code || !course) return;

      const newId = `CLS${String(Date.now()).slice(-4)}`;
      const newClass: Class = {
        class_id: newId,
        class_code: code,
        class_name: name,
        course_name: course,
        schedule,
        campus,
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '2026-12-30',
        total_sessions: lessonsNum,
        completed_sessions: 0,
        max_students: 20,
        current_students: 0,
        author_name: authorName,
        lesson_count: lessonsNum,
      };

      classData.unshift(newClass);

      // Thêm bài học mẫu ban đầu cho khóa mới
      courseLessonsData.push({
        lesson_id: `LES${String(Date.now()).slice(-4)}1`,
        class_id: newId,
        order: 1,
        title: `Bài 1: Giới thiệu khóa học & Kiểm tra đầu vào`,
        duration_minutes: 45,
        skill_tag: 'Grammar',
        description: 'Tổng quan chương trình học và định hướng mục tiêu kết quả đầu ra.',
        status: 'published',
        author_name: authorName,
      });

      closeModal();
      update();
      showToast(`Đã tạo thành công khóa học "${name}" (${code})!`, 'success');
    });
  });
}
