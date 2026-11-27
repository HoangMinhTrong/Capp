# ============================================
# EduTrack - SQLite Database Manager
# ============================================

import sqlite3
import os
from typing import List, Dict, Any, Optional

# EDUTRACK_DB_PATH lets a host point the DB at a persistent volume (e.g. /data/edutrack.db)
DB_PATH = os.environ.get("EDUTRACK_DB_PATH") or os.path.join(os.path.dirname(__file__), "edutrack.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Staff table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS staff (
        staff_id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        role TEXT NOT NULL,
        campus TEXT NOT NULL,
        avatar_initials TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    );
    """)

    # Students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        student_id TEXT PRIMARY KEY,
        student_code TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'active',
        campus TEXT NOT NULL,
        enrollment_date TEXT NOT NULL,
        avatar_initials TEXT NOT NULL,
        date_of_birth TEXT
    );
    """)

    # Classes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS classes (
        class_id TEXT PRIMARY KEY,
        class_code TEXT NOT NULL UNIQUE,
        class_name TEXT NOT NULL,
        course_name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        campus TEXT NOT NULL,
        status TEXT DEFAULT 'in_progress',
        start_date TEXT,
        end_date TEXT,
        total_sessions INTEGER DEFAULT 48,
        completed_sessions INTEGER DEFAULT 0,
        max_students INTEGER DEFAULT 25,
        current_students INTEGER DEFAULT 0,
        teacher_id TEXT
    );
    """)

    # Safe migration for classes table
    cursor.execute("PRAGMA table_info(classes)")
    cls_cols = [row[1] for row in cursor.fetchall()]
    if "teacher_id" not in cls_cols:
        try:
            cursor.execute("ALTER TABLE classes ADD COLUMN teacher_id TEXT")
        except Exception:
            pass

    # Enrollments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS enrollments (
        enrollment_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (class_id) REFERENCES classes(class_id)
    );
    """)

    # Class assignments (Teacher & TA)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS class_assignments (
        assignment_id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        teaching_assistant_id TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        FOREIGN KEY (class_id) REFERENCES classes(class_id)
    );
    """)

    # Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        session_number INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT DEFAULT '18:00',
        end_time TEXT DEFAULT '20:00',
        topic TEXT,
        is_completed INTEGER DEFAULT 0,
        FOREIGN KEY (class_id) REFERENCES classes(class_id)
    );
    """)

    # Safe migration for new sessions columns
    cursor.execute("PRAGMA table_info(sessions)")
    sess_cols = [row[1] for row in cursor.fetchall()]
    new_sess_cols = [
        ("substitute_teacher_id", "TEXT"),
        ("substitute_teacher_name", "TEXT"),
        ("substitute_reason", "TEXT"),
        ("teacher_id", "TEXT"),
        ("teacher_name", "TEXT"),
        ("room", "TEXT")
    ]
    for col_name, col_type in new_sess_cols:
        if col_name not in sess_cols:
            try:
                cursor.execute(f"ALTER TABLE sessions ADD COLUMN {col_name} {col_type}")
            except Exception:
                pass

    # Attendance table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        attendance_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        status TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        recorded_by TEXT,
        notes TEXT,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (class_id) REFERENCES classes(class_id)
    );
    """)

    # Assessments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        assessment_id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        max_score REAL DEFAULT 100,
        weight REAL DEFAULT 30,
        date TEXT,
        description TEXT,
        FOREIGN KEY (class_id) REFERENCES classes(class_id)
    );
    """)

    # Assessment results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessment_results (
        result_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        assessment_id TEXT NOT NULL,
        score REAL,
        entered_by TEXT,
        entered_at TEXT,
        feedback TEXT,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id)
    );
    """)

    # Quizzes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quizzes (
        quiz_id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        title TEXT NOT NULL,
        total_questions INTEGER DEFAULT 20,
        max_score REAL DEFAULT 100,
        due_date TEXT,
        topic TEXT,
        FOREIGN KEY (class_id) REFERENCES classes(class_id)
    );
    """)

    # Quiz attempts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_attempts (
        attempt_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        quiz_id TEXT NOT NULL,
        score REAL,
        correct_answers INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 20,
        time_spent_minutes INTEGER DEFAULT 0,
        status TEXT DEFAULT 'submitted',
        submitted_at TEXT,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    );
    """)

    # Support tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id TEXT PRIMARY KEY,
        ticket_code TEXT NOT NULL UNIQUE,
        student_id TEXT NOT NULL,
        class_id TEXT,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'new',
        assigned_to TEXT,
        created_at TEXT NOT NULL,
        first_response_at TEXT,
        resolved_at TEXT,
        escalated_at TEXT,
        escalated_by TEXT,
        escalation_reason TEXT,
        sla_deadline TEXT,
        is_sla_breached INTEGER DEFAULT 0,
        is_manager_overridden INTEGER DEFAULT 0,
        manager_override_at TEXT,
        reopen_count INTEGER DEFAULT 0,
        reopened_at TEXT,
        reopen_first_reply_at TEXT,
        reopen_resolved_at TEXT,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
    """)

    # Safe migration for new support_tickets columns
    cursor.execute("PRAGMA table_info(support_tickets)")
    ticket_cols = [row[1] for row in cursor.fetchall()]
    new_ticket_cols = [
        ("is_manager_overridden", "INTEGER DEFAULT 0"),
        ("manager_override_at", "TEXT"),
        ("reopen_count", "INTEGER DEFAULT 0"),
        ("reopened_at", "TEXT"),
        ("reopen_first_reply_at", "TEXT"),
        ("reopen_resolved_at", "TEXT")
    ]
    for col_name, col_type in new_ticket_cols:
        if col_name not in ticket_cols:
            try:
                cursor.execute(f"ALTER TABLE support_tickets ADD COLUMN {col_name} {col_type}")
            except Exception:
                pass

    # Support messages (Thread)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_messages (
        message_id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        content TEXT NOT NULL,
        sent_at TEXT NOT NULL,
        is_internal_note INTEGER DEFAULT 0,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id)
    );
    """)

    # Progress snapshots
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS progress_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        period TEXT NOT NULL,
        attendance_rate REAL,
        assignment_completion_rate REAL,
        avg_assessment_score REAL,
        avg_quiz_score REAL,
        trend TEXT DEFAULT 'stable',
        alert_level TEXT DEFAULT 'normal',
        generated_at TEXT NOT NULL,
        data_completeness REAL,
        notes TEXT,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
    """)

    # Interventions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interventions (
        intervention_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT,
        issue TEXT NOT NULL,
        action TEXT NOT NULL,
        performed_by TEXT NOT NULL,
        performed_by_name TEXT NOT NULL,
        result TEXT,
        follow_up_date TEXT,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'planned',
        FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
    """)

    # Alert rules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alert_rules (
        rule_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        condition_type TEXT NOT NULL,
        threshold REAL NOT NULL,
        alert_level TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    );
    """)

    # Audit logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        log_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        changes TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );
    """)

    # Teacher invites table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teacher_invites (
        invite_id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
    );
    """)

    # Announcements table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS announcements (
        announcement_id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        target_class_ids TEXT,
        target_class_names TEXT,
        content_html TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("SELECT COUNT(*) FROM announcements")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO announcements (announcement_id, scope, target_class_ids, target_class_names, content_html, sender_id, sender_name, sender_role, created_at)
        VALUES (
            'ANC_001',
            'all',
            '[]',
            '[]',
            '<p>Chào mừng toàn thể Giảng viên và Học viên đến với học kỳ mới tại <strong>EduTrack English</strong>! Chúc các bạn có một kỳ học thật hiệu quả và đạt kết quả xuất sắc.</p>',
            'STF001',
            'Ban Quản lý Trung tâm',
            'admin',
            '2026-11-19T09:00:00'
        )
        """)

    # System settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL
    );
    """)

    # User feedback table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_feedback (
        feedback_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # Assignments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
        assignment_id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        deadline TEXT,
        max_score REAL DEFAULT 100,
        format TEXT DEFAULT 'file',
        instructions TEXT,
        created_at TEXT,
        assigned_by TEXT
    );
    """)

    # Student submissions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_submissions (
        submission_id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        status TEXT DEFAULT 'submitted',
        attachment_name TEXT,
        attachment_size TEXT,
        submission_text TEXT,
        submission_link TEXT,
        score REAL,
        teacher_feedback TEXT,
        graded_at TEXT,
        graded_by TEXT,
        audio_url TEXT,
        audio_duration TEXT,
        audio_transcript TEXT,
        submission_type TEXT DEFAULT 'writing',
        word_count INTEGER,
        xp_awarded INTEGER DEFAULT 0
    );
    """)

    conn.commit()
    conn.close()

def query_all(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def query_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def execute_cmd(sql: str, params: tuple = ()) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id

