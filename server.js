const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const multer = require('multer');
const pdfParse = require('pdf-parse');

// Configure upload directory
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Set storage engine for videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Configure file upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.db');

// Database initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Configure Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'lms_secret_session_key_123!#',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false // Set to true if running over HTTPS
  }
}));

// Session Authentication check middlewares
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }
  next();
};

const requireAdminOrFaculty = (req, res, next) => {
  if (!req.session.userId || (req.session.role !== 'admin' && req.session.role !== 'faculty')) {
    return res.status(403).json({ error: 'Access denied. Administrator or Faculty role required.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin access required.' });
  }
  next();
};

// Database Schema Initialization
function initializeDatabase() {
  db.serialize(() => {
    // 1. Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin', 'faculty', 'student'
      google_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Courses table
    db.run(`CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT, -- e.g., 'Programming', 'Interview Readiness'
      thumbnail_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Lectures table
    db.run(`CREATE TABLE IF NOT EXISTS lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL, -- YouTube video ID or direct video link
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    // 4. Progress table
    db.run(`CREATE TABLE IF NOT EXISTS progress (
      user_id INTEGER,
      lecture_id INTEGER,
      completed INTEGER DEFAULT 0, -- 1 for complete, 0 for incomplete
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, lecture_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
    )`);

    // 5. Login logs table
    db.run(`CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // 6. Enrollments table
    db.run(`CREATE TABLE IF NOT EXISTS enrollments (
      user_id INTEGER,
      course_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    // 7. Assignments table
    db.run(`CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      lecture_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      language TEXT DEFAULT 'javascript',
      boilerplate_code TEXT,
      test_cases TEXT,
      hint TEXT,
      order_index INTEGER DEFAULT 1,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    // 8. MCQs table
    db.run(`CREATE TABLE IF NOT EXISTS mcqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      lecture_id INTEGER,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL,
      explanation TEXT,
      order_index INTEGER DEFAULT 1,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    // 9. Submissions table
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference_id INTEGER NOT NULL,
      submitted_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      ai_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    // Migration updates for lectures table
    db.run(`ALTER TABLE lectures ADD COLUMN duration TEXT`, (err) => {
      // Ignored if column already exists
    });
    db.run(`ALTER TABLE lectures ADD COLUMN content_type TEXT DEFAULT 'Video Lecture'`, (err) => {
      // Ignored if column already exists
    });
    db.run(`ALTER TABLE lectures ADD COLUMN notes TEXT`, (err) => {
      // Ignored if column already exists
    });
    db.run(`ALTER TABLE assignments ADD COLUMN lecture_id INTEGER`, (err) => {
      // Ignored if column already exists
    });
    db.run(`ALTER TABLE assignments ADD COLUMN hint TEXT`, (err) => {
      // Ignored if column already exists
    });
    db.run(`ALTER TABLE mcqs ADD COLUMN lecture_id INTEGER`, (err) => {
      // Ignored if column already exists
    });

    db.run(`ALTER TABLE progress ADD COLUMN watched_seconds INTEGER DEFAULT 0`, (err) => {
      // Ignored if column already exists
    });

    db.run(`ALTER TABLE assignments ADD COLUMN hint_2 TEXT`, (err) => {
      // Ignored if column already exists
    });

    db.run(`ALTER TABLE submissions ADD COLUMN tab_switches INTEGER DEFAULT 0`, (err) => {
      // Ignored if column already exists
    });

    // 10. XP Settings table
    db.run(`CREATE TABLE IF NOT EXISTS xp_settings (
      key TEXT PRIMARY KEY,
      value INTEGER
    )`, () => {
      // Seed default multipliers if empty
      db.get(`SELECT COUNT(*) as count FROM xp_settings`, [], (err, row) => {
        if (!err && row && row.count === 0) {
          db.run(`INSERT INTO xp_settings (key, value) VALUES ('video_xp', 50)`);
          db.run(`INSERT INTO xp_settings (key, value) VALUES ('mcq_xp', 25)`);
          db.run(`INSERT INTO xp_settings (key, value) VALUES ('assignment_xp', 100)`);
        }
      });
    });

    // 11. Assessments tables
    db.run(`CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      duration INTEGER NOT NULL, -- in minutes
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS assessment_questions (
      assessment_id INTEGER NOT NULL,
      question_type TEXT NOT NULL, -- 'mcq' or 'assignment'
      question_id INTEGER NOT NULL,
      order_index INTEGER DEFAULT 0,
      PRIMARY KEY (assessment_id, question_type, question_id),
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS assessment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      assessment_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      tab_switch_count INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0, -- in seconds
      status TEXT DEFAULT 'completed', -- 'completed', 'disqualified'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    )`);

    // Database setup is complete
  });
}

// Helper to log user activity
function recordLoginLog(userId, email, req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown Browser';
  db.run(
    `INSERT INTO login_logs (user_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)`,
    [userId, email, ip, ua],
    (err) => {
      if (err) console.error("Error creating login log:", err.message);
    }
  );
}

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

// Check current user status
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    user: {
      id: req.session.userId,
      email: req.session.email,
      name: req.session.name,
      role: req.session.role
    }
  });
});

// Register user
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }

  // Check if email already exists
  db.get(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()], (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error check.' });
    if (user) return res.status(400).json({ error: 'User already exists with this email.' });

    // Check if this is the first user overall
    db.get(`SELECT COUNT(*) as count FROM users`, (err, result) => {
      if (err) return res.status(500).json({ error: 'Server error counting users.' });
      
      // If count is 0, they are Admin/Owner. Otherwise, Student.
      const role = result.count === 0 ? 'admin' : 'student';
      
      // Hash password
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Error hashing password.' });

        db.run(
          `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
          [name, email.toLowerCase(), hash, role],
          function (err) {
            if (err) return res.status(500).json({ error: 'Database error registering user.' });

            const newUserId = this.lastID;
            
            // Set session
            req.session.userId = newUserId;
            req.session.email = email.toLowerCase();
            req.session.name = name;
            req.session.role = role;

            // Log activity
            recordLoginLog(newUserId, email.toLowerCase(), req);

            res.status(201).json({
              success: true,
              user: { id: newUserId, name, email: email.toLowerCase(), role }
            });
          }
        );
      });
    });
  });
});

// Standard Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database check failed.' });
    if (!user || !user.password_hash) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Comparison failed.' });
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

      // Create session
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.name = user.name;
      req.session.role = user.role;

      // Log login
      recordLoginLog(user.id, user.email, req);

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    });
  });
});



// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out. Please try again.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Successfully logged out.' });
  });
});


/* ==========================================================================
   COURSES & LECTURES ENDPOINTS
   ========================================================================== */

// Get all courses
app.get('/api/courses', requireLogin, (req, res) => {
  db.all(`SELECT * FROM courses ORDER BY created_at DESC`, [], (err, courses) => {
    if (err) return res.status(500).json({ error: 'Failed to retrieve courses.' });
    res.json(courses);
  });
});

// Create course (Admin / Faculty)
app.post('/api/courses', requireAdminOrFaculty, upload.single('thumbnail_file'), (req, res) => {
  const { title, description, category, thumbnail_url } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and Category are required.' });
  }

  let thumb = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60';
  if (req.file) {
    thumb = `uploads/${req.file.filename}`;
  } else if (thumbnail_url) {
    thumb = thumbnail_url;
  }

  db.run(
    `INSERT INTO courses (title, description, category, thumbnail_url) VALUES (?, ?, ?, ?)`,
    [title, description, category, thumb],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create course.' });
      res.status(201).json({ success: true, courseId: this.lastID });
    }
  );
});

// Get lectures for a course
app.get('/api/courses/:id/lectures', requireLogin, (req, res) => {
  const courseId = req.params.id;
  db.all(
    `SELECT * FROM lectures WHERE course_id = ? ORDER BY order_index ASC`,
    [courseId],
    (err, lectures) => {
      if (err) return res.status(500).json({ error: 'Failed to retrieve lectures.' });
      res.json(lectures);
    }
  );
});

// Create lecture (Admin / Faculty)
app.post('/api/courses/:id/lectures', requireAdminOrFaculty, upload.single('video_file'), (req, res) => {
  const courseId = req.params.id;
  const { title, order_index, duration, content_type, notes } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  let video_url = '';
  
  // Check if file was uploaded
  if (req.file) {
    video_url = `uploads/${req.file.filename}`;
  } else if (req.body.video_url) {
    video_url = req.body.video_url;
  } else {
    return res.status(400).json({ error: 'Video file or video URL is required.' });
  }

  const order = order_index || 0;
  const dur = duration || '15 mins';
  const cType = content_type || 'Video Lecture';

  db.run(
    `INSERT INTO lectures (course_id, title, video_url, order_index, duration, content_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [courseId, title, video_url, order, dur, cType, notes || ''],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create lecture.' });
      }
      res.status(201).json({ success: true, lectureId: this.lastID });
    }
  );
});



/* ==========================================================================
   STUDENT PROGRESS ENDPOINTS
   ========================================================================== */

// Get user progress (list of lecture completions)
app.get('/api/student/progress', requireLogin, (req, res) => {
  const userId = req.session.userId;
  db.all(
    `SELECT lecture_id, completed, updated_at FROM progress WHERE user_id = ? AND completed = 1`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch progress.' });
      res.json(rows);
    }
  );
});

// Get user login logs for streaks / heatmap calculations
app.get('/api/student/logs', requireLogin, (req, res) => {
  const userId = req.session.userId;
  db.all(
    `SELECT login_time FROM login_logs WHERE user_id = ? ORDER BY login_time ASC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch logs.' });
      res.json(rows);
    }
  );
});

// Toggle lecture progress (mark complete / incomplete)
app.post('/api/student/progress', requireLogin, (req, res) => {
  const userId = req.session.userId;
  const { lecture_id, completed } = req.body; // completed: 1 or 0
  if (lecture_id === undefined || completed === undefined) {
    return res.status(400).json({ error: 'Missing lecture_id or completed state.' });
  }

  db.run(
    `INSERT INTO progress (user_id, lecture_id, completed) VALUES (?, ?, ?)
     ON CONFLICT(user_id, lecture_id) DO UPDATE SET completed = excluded.completed, updated_at = CURRENT_TIMESTAMP`,
    [userId, lecture_id, completed],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update progress.' });
      }
      res.json({ success: true });
    }
  );
});

// Update student video watch progression ticks
app.post('/api/student/video-progress', requireLogin, (req, res) => {
  const userId = req.session.userId;
  const { lecture_id, watched_seconds } = req.body;
  if (!lecture_id || watched_seconds === undefined) {
    return res.status(400).json({ error: 'Missing lecture_id or watched_seconds.' });
  }

  db.get(`SELECT watched_seconds FROM progress WHERE user_id = ? AND lecture_id = ?`, [userId, lecture_id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    
    const existingSecs = row ? (row.watched_seconds || 0) : 0;
    if (watched_seconds <= existingSecs) {
      return res.json({ success: true, watched_seconds: existingSecs });
    }

    db.run(`
      INSERT INTO progress (user_id, lecture_id, watched_seconds) VALUES (?, ?, ?)
      ON CONFLICT(user_id, lecture_id) DO UPDATE SET watched_seconds = excluded.watched_seconds, updated_at = CURRENT_TIMESTAMP
    `, [userId, lecture_id, watched_seconds], (err2) => {
      if (err2) return res.status(500).json({ error: 'Failed to update video progress.' });
      res.json({ success: true, watched_seconds });
    });
  });
});

// Get student enrolled course IDs
app.get('/api/student/enrollments', requireLogin, (req, res) => {
  const userId = req.session.userId;
  db.all(
    `SELECT course_id FROM enrollments WHERE user_id = ?`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch enrollments.' });
      res.json(rows.map(r => r.course_id));
    }
  );
});

// Enroll student in a course
app.post('/api/student/enroll', requireLogin, (req, res) => {
  const userId = req.session.userId;
  const { course_id } = req.body;
  if (course_id === undefined) {
    return res.status(400).json({ error: 'Missing course_id.' });
  }

  db.run(
    `INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)`,
    [userId, course_id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to enroll in course.' });
      }
      res.json({ success: true });
    }
  );
});


/* ==========================================================================
   ADMINISTRATOR / OBSERVER TRACKING ENDPOINTS
   ========================================================================== */

// Invite new Faculty / Admin user (Admin only)
app.post('/api/admin/invite', requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }
  if (role !== 'faculty' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role selection.' });
  }

  db.get(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()], (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error checking email.' });
    if (user) return res.status(400).json({ error: 'User already exists with this email.' });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Error hashing password.' });

      db.run(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        [name, email.toLowerCase(), hash, role],
        function (err) {
          if (err) return res.status(500).json({ error: 'Database error creating faculty.' });
          res.status(201).json({
            success: true,
            user: { id: this.lastID, name, email: email.toLowerCase(), role }
          });
        }
      );
    });
  });
});

// Get administrator tracking panel logs and metrics (Admin & Faculty)
app.get('/api/admin/tracking', requireAdminOrFaculty, (req, res) => {
  // 1. Fetch all student logs and calculate their progress in lectures
  const metricsQuery = `
    SELECT 
      u.id as student_id,
      u.name,
      u.email,
      c.id as course_id,
      c.title as course_title,
      COUNT(l.id) as total_lectures,
      SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) as completed_lectures
    FROM users u
    CROSS JOIN courses c
    LEFT JOIN lectures l ON l.course_id = c.id
    LEFT JOIN progress p ON p.lecture_id = l.id AND p.user_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id, c.id
    HAVING total_lectures > 0
    ORDER BY u.name ASC, c.title ASC
  `;

  // 2. Fetch login logs
  const logsQuery = `
    SELECT l.id, l.email, u.name as user_name, l.ip_address, l.user_agent, l.login_time 
    FROM login_logs l
    LEFT JOIN users u ON u.id = l.user_id
    ORDER BY l.login_time DESC 
    LIMIT 100
  `;

  db.all(metricsQuery, [], (err, studentProgress) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch student progress metrics.' });
    }

    db.all(logsQuery, [], (err, loginLogs) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch session audit logs.' });
      }

      res.json({
        studentProgress,
        loginLogs
      });
    });
  });
});

// Get detailed student histories (Admin & Faculty)
app.get('/api/admin/student-history', requireAdminOrFaculty, (req, res) => {
  const queryStudents = `SELECT id, name, email, created_at FROM users WHERE role = 'student' ORDER BY name ASC`;
  const queryLogs = `SELECT user_id, email, ip_address, user_agent, login_time FROM login_logs ORDER BY login_time DESC`;
  const queryProgress = `
    SELECT p.user_id, p.lecture_id, l.title as lecture_title, c.title as course_title, p.completed, p.updated_at 
    FROM progress p 
    JOIN lectures l ON l.id = p.lecture_id 
    JOIN courses c ON c.id = l.course_id 
    WHERE p.completed = 1 
    ORDER BY p.updated_at DESC
  `;
  const queryEnrollments = `
    SELECT e.user_id, e.course_id, c.title as course_title 
    FROM enrollments e 
    JOIN courses c ON c.id = e.course_id
  `;
  const querySubmissions = `
    SELECT s.user_id, s.type, s.reference_id, s.submitted_answer, s.is_correct, s.created_at, s.tab_switches,
           CASE 
             WHEN s.type = 'mcq' THEN m.question 
             ELSE a.title 
           END as title,
           CASE 
             WHEN s.type = 'mcq' THEN m.correct_option 
             ELSE a.language 
           END as correct_or_lang,
           CASE 
             WHEN s.type = 'mcq' THEN c_m.title 
             ELSE c_a.title 
           END as course_title,
           CASE 
             WHEN s.type = 'mcq' THEN l_m.title 
             ELSE l_a.title 
           END as lecture_title
    FROM submissions s
    LEFT JOIN mcqs m ON m.id = s.reference_id AND s.type = 'mcq'
    LEFT JOIN courses c_m ON c_m.id = m.course_id AND s.type = 'mcq'
    LEFT JOIN lectures l_m ON l_m.id = m.lecture_id AND s.type = 'mcq'
    LEFT JOIN assignments a ON a.id = s.reference_id AND s.type = 'assignment'
    LEFT JOIN courses c_a ON c_a.id = a.course_id AND s.type = 'assignment'
    LEFT JOIN lectures l_a ON l_a.id = a.lecture_id AND s.type = 'assignment'
    ORDER BY s.created_at DESC
  `;
  const queryAllLectures = `
    SELECT l.id, l.course_id, l.title, l.order_index, c.title as course_title 
    FROM lectures l 
    JOIN courses c ON c.id = l.course_id
    ORDER BY l.course_id, l.order_index ASC
  `;

  db.all(queryStudents, [], (err, students) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch students.' });

    db.all(queryLogs, [], (err, logs) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch session audit logs.' });

      db.all(queryProgress, [], (err, progress) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch lecture progress details.' });

        db.all(queryEnrollments, [], (err, enrollments) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch enrollments details.' });

          db.all(querySubmissions, [], (err, submissions) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch submissions details.' });

            db.all(queryAllLectures, [], (err, lectures) => {
              if (err) return res.status(500).json({ error: 'Failed to fetch lectures details.' });

              res.json({
                students,
                logs,
                progress,
                enrollments,
                submissions,
                lectures
              });
            });
          });
        });
      });
    });
  });
});

// Delete course (Admin only)
app.delete('/api/courses/:id', requireAdmin, (req, res) => {
  const courseId = req.params.id;
  db.run(`DELETE FROM courses WHERE id = ?`, [courseId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete course.' });
    }
    res.json({ success: true, message: 'Course deleted successfully from everywhere.' });
  });
});

// Delete a particular lecture (Admin only)
app.delete('/api/lectures/:id', requireAdmin, (req, res) => {
  const lectureId = req.params.id;
  db.run(`DELETE FROM lectures WHERE id = ?`, [lectureId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete lecture.' });
    }
    res.json({ success: true, message: 'Lecture deleted successfully.' });
  });
});

// Update notes for a particular lecture milestone
app.post('/api/lectures/:lectureId/notes', requireAdminOrFaculty, (req, res) => {
  const { notes } = req.body;
  db.run(
    `UPDATE lectures SET notes = ? WHERE id = ?`,
    [notes || '', req.params.lectureId],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update lecture notes.' });
      res.json({ success: true });
    }
  );
});

// Get all invited/authorized team members (Admin only)
app.get('/api/admin/team', requireAdmin, (req, res) => {
  db.all(
    `SELECT id, name, email, role, created_at FROM users WHERE role IN ('admin', 'faculty') ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch team members.' });
      res.json(rows);
    }
  );
});

// Delete/Revoke team member access (Admin only)
app.delete('/api/admin/team/:id', requireAdmin, (req, res) => {
  const targetId = req.params.id;
  if (parseInt(targetId) === req.session.userId) {
    return res.status(400).json({ error: 'You cannot revoke your own admin access.' });
  }
  db.run(`DELETE FROM users WHERE id = ?`, [targetId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to revoke access.' });
    res.json({ success: true, message: 'Access revoked successfully.' });
  });
});

// Configure memory storage for PDF processing
const memoryMulter = multer({ storage: multer.memoryStorage() });

// --- ASSIGNMENTS API ---
app.get('/api/courses/:courseId/assignments', requireLogin, (req, res) => {
  const courseId = req.params.courseId;
  db.all(`SELECT * FROM assignments WHERE course_id = ? ORDER BY order_index ASC`, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch assignments.' });
    res.json(rows);
  });
});

app.post('/api/courses/:courseId/assignments', requireAdminOrFaculty, (req, res) => {
  const courseId = req.params.courseId;
  const { lecture_id, title, description, language, boilerplate_code, test_cases, hint, hint_2, order_index } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }
  db.run(
    `INSERT INTO assignments (course_id, lecture_id, title, description, language, boilerplate_code, test_cases, hint, hint_2, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [courseId, lecture_id || null, title, description, language || 'javascript', boilerplate_code || '', test_cases || '[]', hint || '', hint_2 || '', order_index || 1],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create assignment.' });
      res.status(201).json({ success: true, assignmentId: this.lastID });
    }
  );
});

app.delete('/api/assignments/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM assignments WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete assignment.' });
    res.json({ success: true, message: 'Assignment deleted successfully.' });
  });
});

// --- MCQS API ---
app.get('/api/courses/:courseId/mcqs', requireLogin, (req, res) => {
  const courseId = req.params.courseId;
  db.all(`SELECT * FROM mcqs WHERE course_id = ? ORDER BY order_index ASC`, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch MCQs.' });
    res.json(rows);
  });
});

app.post('/api/courses/:courseId/mcqs', requireAdminOrFaculty, (req, res) => {
  const courseId = req.params.courseId;
  const { lecture_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, order_index } = req.body;
  if (!question || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ error: 'All question options and correct answer are required.' });
  }
  db.run(
    `INSERT INTO mcqs (course_id, lecture_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [courseId, lecture_id || null, question, option_a, option_b, option_c, option_d, correct_option.toUpperCase(), explanation || '', order_index || 1],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create MCQ.' });
      res.status(201).json({ success: true, mcqId: this.lastID });
    }
  );
});

app.delete('/api/mcqs/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM mcqs WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete MCQ.' });
    res.json({ success: true, message: 'MCQ deleted successfully.' });
  });
});

// --- SUBMISSIONS PROGRESS API ---
app.get('/api/submissions', requireLogin, (req, res) => {
  const userId = req.session.userId;
  db.all(`SELECT * FROM submissions WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch submissions.' });
    res.json(rows);
  });
});

app.post('/api/submissions', requireLogin, (req, res) => {
  const userId = req.session.userId;
  const { course_id, type, reference_id, submitted_answer, is_correct, ai_feedback, tab_switches } = req.body;
  if (!course_id || !type || !reference_id) {
    return res.status(400).json({ error: 'Missing required submission fields.' });
  }
  
  db.serialize(() => {
    db.run(
      `DELETE FROM submissions WHERE user_id = ? AND course_id = ? AND type = ? AND reference_id = ?`,
      [userId, course_id, type, reference_id],
      () => {
        db.run(
          `INSERT INTO submissions (user_id, course_id, type, reference_id, submitted_answer, is_correct, ai_feedback, tab_switches) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, course_id, type, reference_id, submitted_answer || '', is_correct ? 1 : 0, ai_feedback || '', tab_switches || 0],
          function (err) {
            if (err) return res.status(500).json({ error: 'Failed to save submission.' });
            res.json({ success: true, submissionId: this.lastID });
          }
        );
      }
    );
  });
});

// --- PDF PARSING & AI GENERATORS ---
app.post('/api/admin/parse-pdf-mcq', requireAdminOrFaculty, memoryMulter.single('pdf_file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded.' });
  }
  try {
    const parser = new pdfParse.PDFParse(new Uint8Array(req.file.buffer));
    const data = await parser.getText();
    const text = data.text;
    const questions = [];
    const blocks = text.split(/\n\s*(?=\d+[\.\)\:]\s+)/);
    
    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 3) return;
      
      let questionText = lines[0].replace(/^\d+[\.\)\:]\s*/, '');
      let optionA = '';
      let optionB = '';
      let optionC = '';
      let optionD = '';
      let correct = 'A';
      let explanation = 'Extracted from PDF worksheet.';

      lines.slice(1).forEach(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith('a)') || lower.startsWith('a.') || lower.startsWith('(a)')) {
          optionA = line.replace(/^[aA][\)\.]\s*|^\([aA]\)\s*/, '');
        } else if (lower.startsWith('b)') || lower.startsWith('b.') || lower.startsWith('(b)')) {
          optionB = line.replace(/^[bB][\)\.]\s*|^\([bB]\)\s*/, '');
        } else if (lower.startsWith('c)') || lower.startsWith('c.') || lower.startsWith('(c)')) {
          optionC = line.replace(/^[cC][\)\.]\s*|^\([cC]\)\s*/, '');
        } else if (lower.startsWith('d)') || lower.startsWith('d.') || lower.startsWith('(d)')) {
          optionD = line.replace(/^[dD][\)\.]\s*|^\([dD]\)\s*/, '');
        } else if (lower.includes('correct:') || lower.includes('answer:') || lower.includes('ans:')) {
          const match = line.match(/[a-dA-D]/);
          if (match) correct = match[0].toUpperCase();
        }
      });

      if (optionA && optionB) {
        questions.push({
          question: questionText,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC || 'None of the above',
          option_d: optionD || 'All of the above',
          correct_option: correct,
          explanation: explanation
        });
      }
    });

    if (questions.length === 0) {
      // Mock questions fallback
      questions.push({
        question: "Sample Question 1: What is the main runtime engine of Node.js?",
        option_a: "V8 Engine",
        option_b: "Spidermonkey",
        option_c: "JVM",
        option_d: "Chakra",
        correct_option: "A",
        explanation: "Node.js runs on the Google V8 engine."
      });
      questions.push({
        question: "Sample Question 2: Which keyword is used to declare a constant in JS?",
        option_a: "var",
        option_b: "let",
        option_c: "const",
        option_d: "define",
        correct_option: "C",
        explanation: "const declares a read-only variable assignment."
      });
    }

    res.json({ success: true, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process PDF file content.' });
  }
});

app.post('/api/admin/generate-ai-mcq', requireAdminOrFaculty, (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Please specify a quiz topic.' });
  }

  const mcqs = [
    {
      question: `Which of the following describes the core concepts of ${topic}?`,
      option_a: "Inheritance and dynamic encapsulation.",
      option_b: "Syntactic structure optimizations.",
      option_c: "Memory allocations and caching systems.",
      option_d: "All of the above.",
      correct_option: "D",
      explanation: `All options represent standard functional paradigms inside ${topic}.`
    },
    {
      question: `What is the standard time complexity for basic queries or operations in ${topic}?`,
      option_a: "O(1) constant time",
      option_b: "O(log n) logarithmic time",
      option_c: "O(n) linear time",
      option_d: "O(n^2) quadratic time",
      correct_option: "B",
      explanation: "Logarithmic time represents the optimal sequence for index/search queries."
    },
    {
      question: `Which built-in operator or function is commonly used for verification in ${topic}?`,
      option_a: "typeof or instanceof check",
      option_b: "assert or inspect module",
      option_c: "validate pattern match",
      option_d: "inspect verify check",
      correct_option: "A",
      explanation: "typeof and instanceof are primary operators for datatype checking."
    },
    {
      question: `Which error is thrown when accessing a null or undefined variable referencing ${topic}?`,
      option_a: "TypeError",
      option_b: "ReferenceError",
      option_c: "SyntaxError",
      option_d: "RangeError",
      correct_option: "A",
      explanation: "TypeError is thrown when operations are performed on incompatible types."
    },
    {
      question: `What is the best practice recommendation when scaling implementations of ${topic}?`,
      option_a: "Keep all logic global and unoptimized.",
      option_b: "Utilize caching, indexes, and functional encapsulation.",
      option_c: "Avoid asynchronous event handling.",
      option_d: "Avoid static type checkers.",
      correct_option: "B",
      explanation: "Caching, query indexes, and clean functions are essential for scaling."
    }
  ];

  res.json({ success: true, mcqs });
});

/* ==========================================================================
   GAMIFICATION XP & LEADERBOARD ENDPOINTS
   ========================================================================== */

// Get current XP settings
app.get('/api/admin/xp-settings', requireLogin, (req, res) => {
  db.all(`SELECT key, value FROM xp_settings`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch XP settings.' });
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  });
});

// Update XP settings (Admin only)
app.post('/api/admin/xp-settings', requireAdmin, (req, res) => {
  const { video_xp, mcq_xp, assignment_xp } = req.body;
  if (video_xp === undefined || mcq_xp === undefined || assignment_xp === undefined) {
    return res.status(400).json({ error: 'Missing XP setting multipliers.' });
  }

  db.serialize(() => {
    db.run(`INSERT OR REPLACE INTO xp_settings (key, value) VALUES ('video_xp', ?)`, [parseInt(video_xp)]);
    db.run(`INSERT OR REPLACE INTO xp_settings (key, value) VALUES ('mcq_xp', ?)`, [parseInt(mcq_xp)]);
    db.run(`INSERT OR REPLACE INTO xp_settings (key, value) VALUES ('assignment_xp', ?)`, [parseInt(assignment_xp)], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save XP settings.' });
      res.json({ success: true });
    });
  });
});

// Get global leaderboard (computes XP on the fly for all students)
app.get('/api/leaderboard', requireLogin, (req, res) => {
  // 1. Fetch XP multipliers
  db.all(`SELECT key, value FROM xp_settings`, [], (err, settingsRows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch XP settings.' });
    const multipliers = {};
    settingsRows.forEach(r => { multipliers[r.key] = r.value; });

    const videoXP = multipliers.video_xp || 50;
    const mcqXP = multipliers.mcq_xp || 20;
    const assignmentXP = multipliers.assignment_xp || 100;

    // 2. Fetch all students statistics
    const queryStats = `
      SELECT u.id, u.name, u.email,
             (SELECT SUM(watched_seconds) FROM progress WHERE user_id = u.id) as total_watched_seconds,
             (SELECT COUNT(*) FROM submissions WHERE user_id = u.id AND type = 'mcq' AND is_correct = 1) as mcqs_solved,
             (SELECT COUNT(*) FROM submissions WHERE user_id = u.id AND type = 'assignment' AND is_correct = 1) as assignments_solved
      FROM users u 
      WHERE u.role = 'student'
    `;

    db.all(queryStats, [], (err, students) => {
      if (err) return res.status(500).json({ error: 'Failed to query student statistics.' });

      // 3. Fetch enrollments
      const queryEnrollments = `
        SELECT e.user_id, c.title as course_title 
        FROM enrollments e 
        JOIN courses c ON c.id = e.course_id
      `;

      db.all(queryEnrollments, [], (err, enrollments) => {
        if (err) return res.status(500).json({ error: 'Failed to query student enrollments.' });

        // Map course names to students
        const userCoursesMap = {};
        enrollments.forEach(e => {
          if (!userCoursesMap[e.user_id]) userCoursesMap[e.user_id] = [];
          userCoursesMap[e.user_id].push(e.course_title);
        });

        // Compute total XP
        students.forEach(s => {
          const watchedSecs = s.total_watched_seconds || 0;
          s.xp = Math.floor(watchedSecs / 30) + (s.mcqs_solved * mcqXP) + (s.assignments_solved * assignmentXP);
          s.courses = userCoursesMap[s.id] || [];
        });

        // Sort descending by XP
        students.sort((a, b) => b.xp - a.xp);

        // Assign Rank
        students.forEach((s, index) => {
          s.rank = index + 1;
        });

        res.json({
          multipliers,
          leaderboard: students
        });
      });
    });
  });
});

/* ==========================================================================
   TIMED MOCK ASSESSMENT ENDPOINTS
   ========================================================================== */

// Admin: Get all assessments with question count
app.get('/api/admin/assessments', requireLogin, (req, res) => {
  const query = `
    SELECT a.*, c.title as course_title,
           (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) as question_count
    FROM assessments a
    JOIN courses c ON c.id = a.course_id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch assessments.' });
    res.json(rows);
  });
});

// Admin: Create a timed mock assessment
app.post('/api/admin/assessments', requireAdminOrFaculty, (req, res) => {
  const { title, course_id, duration, questions, dynamic_mcqs, dynamic_assignments } = req.body;
  if (!title || !course_id || !duration) {
    return res.status(400).json({ error: 'Missing assessment parameters.' });
  }

  const finalQuestions = Array.isArray(questions) ? [...questions] : [];
  const mcqsToCreate = Array.isArray(dynamic_mcqs) ? dynamic_mcqs : [];
  const assignmentsToCreate = Array.isArray(dynamic_assignments) ? dynamic_assignments : [];

  db.serialize(async () => {
    try {
      // 1. Create dynamic MCQs first
      for (const d of mcqsToCreate) {
        if (!d.question || !d.option_a || !d.option_b || !d.option_c || !d.option_d || !d.correct_option) {
          continue; // skip incomplete fields
        }
        
        const newMcqId = await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO mcqs (course_id, question, option_a, option_b, option_c, option_d, correct_option, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Mock Exam MCQ')
          `, [course_id, d.question, d.option_a, d.option_b, d.option_c, d.option_d, d.correct_option], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
        finalQuestions.push({ type: 'mcq', id: newMcqId });
      }

      // 2. Create dynamic Coding Tasks
      for (const a of assignmentsToCreate) {
        if (!a.title || !a.description || !a.expected_output) {
          continue; // skip incomplete fields
        }

        const testCasesJson = JSON.stringify([{ input: a.test_case_input || '', output: a.expected_output }]);

        const newAssignId = await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO assignments (course_id, title, description, language, boilerplate_code, test_cases, hint, hint_2, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
          `, [course_id, a.title, a.description, a.language || 'javascript', a.boilerplate_code || '', testCasesJson, a.hint || '', a.hint_2 || ''], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
        finalQuestions.push({ type: 'assignment', id: newAssignId });
      }

      if (finalQuestions.length === 0) {
        return res.status(400).json({ error: 'Assessment must contain at least one question.' });
      }

      // 2. Create the assessment record
      db.run(`INSERT INTO assessments (course_id, title, duration) VALUES (?, ?, ?)`, [course_id, title, duration], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create assessment.' });
        
        const assessmentId = this.lastID;
        const stmt = db.prepare(`INSERT INTO assessment_questions (assessment_id, question_type, question_id, order_index) VALUES (?, ?, ?, ?)`);
        
        finalQuestions.forEach((q, idx) => {
          stmt.run(assessmentId, q.type, q.id, idx);
        });
        
        stmt.finalize((err2) => {
          if (err2) return res.status(500).json({ error: 'Failed to link assessment questions.' });
          res.json({ success: true, assessmentId });
        });
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to save dynamic exam questions.' });
    }
  });
});

// Admin: Delete assessment
app.delete('/api/admin/assessments/:id', requireAdminOrFaculty, (req, res) => {
  db.run(`DELETE FROM assessments WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete assessment.' });
    res.json({ success: true });
  });
});

// Admin: Get candidate exam attempts/results
app.get('/api/admin/assessment-results', requireLogin, (req, res) => {
  const query = `
    SELECT sub.*, u.name as student_name, u.email as student_email, a.title as exam_title, c.title as course_title
    FROM assessment_submissions sub
    JOIN users u ON u.id = sub.user_id
    JOIN assessments a ON a.id = sub.assessment_id
    JOIN courses c ON c.id = a.course_id
    ORDER BY sub.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch candidate assessment results.' });
    res.json(rows);
  });
});

// Student: List assessments available for enrolled courses
app.get('/api/student/assessments', requireLogin, (req, res) => {
  const userId = req.session.userId;
  const query = `
    SELECT a.id, a.title, a.duration, a.course_id, c.title as course_title,
           (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) as question_count,
           sub.score, sub.total_questions, sub.status as attempt_status, sub.tab_switch_count, sub.created_at as attempted_at
    FROM assessments a
    JOIN courses c ON c.id = a.course_id
    JOIN enrollments e ON e.course_id = a.course_id AND e.user_id = ?
    LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.id AND sub.user_id = ?
    ORDER BY a.created_at DESC
  `;
  db.all(query, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load assessments list.' });
    res.json(rows);
  });
});

// Student: Get test structure/questions (excludes correct answers to prevent inspecting)
app.get('/api/student/assessments/:id', requireLogin, (req, res) => {
  const assessmentId = req.params.id;

  // Verify student is enrolled in the course associated with this assessment
  const verifyQuery = `
    SELECT a.* FROM assessments a
    JOIN enrollments e ON e.course_id = a.course_id
    WHERE a.id = ? AND e.user_id = ?
  `;
  db.get(verifyQuery, [assessmentId, req.session.userId], (err, assessment) => {
    if (err || !assessment) {
      return res.status(403).json({ error: 'Access denied: You are not enrolled in the course for this mock test.' });
    }

    // Load linked questions
    db.all(`SELECT question_type, question_id FROM assessment_questions WHERE assessment_id = ? ORDER BY order_index`, [assessmentId], async (err, linkedItems) => {
      if (err) return res.status(500).json({ error: 'Failed to load test questions structure.' });

      const questions = [];
      for (const item of linkedItems) {
        if (item.question_type === 'mcq') {
          const mcq = await new Promise((resolve) => {
            db.get(`SELECT id, question, option_a, option_b, option_c, option_d FROM mcqs WHERE id = ?`, [item.question_id], (e, r) => resolve(r));
          });
          if (mcq) questions.push({ type: 'mcq', data: mcq });
        } else if (item.question_type === 'assignment') {
          const coding = await new Promise((resolve) => {
            db.get(`SELECT id, title, description, language, boilerplate_code, test_cases, hint FROM assignments WHERE id = ?`, [item.question_id], (e, r) => resolve(r));
          });
          if (coding) questions.push({ type: 'assignment', data: coding });
        }
      }

      res.json({
        id: assessment.id,
        title: assessment.title,
        duration: assessment.duration,
        questions
      });
    });
  });
});

// Student: Submit assessment answers & grade in real-time
app.post('/api/student/assessments/:id/submit', requireLogin, (req, res) => {
  const assessmentId = req.params.id;
  const userId = req.session.userId;
  const { answers, tab_switches, time_spent } = req.body; // answers: { question_type_id: "A" or submitted_code }

  if (!answers) return res.status(400).json({ error: 'Missing submitted answers.' });

  // Verify enrolled
  const verifyQuery = `
    SELECT a.* FROM assessments a
    JOIN enrollments e ON e.course_id = a.course_id
    WHERE a.id = ? AND e.user_id = ?
  `;
  db.get(verifyQuery, [assessmentId, userId], async (err, assessment) => {
    if (err || !assessment) {
      return res.status(403).json({ error: 'Access denied: Enroll in course first.' });
    }

    // Check if already submitted
    db.get(`SELECT id FROM assessment_submissions WHERE user_id = ? AND assessment_id = ?`, [userId, assessmentId], (err, existing) => {
      if (existing) {
        return res.status(400).json({ error: 'You have already submitted thisTimed Assessment. It can only be submitted once.' });
      }

      // Load questions to compare
      db.all(`SELECT question_type, question_id FROM assessment_questions WHERE assessment_id = ?`, [assessmentId], async (err, linkedItems) => {
        if (err) return res.status(500).json({ error: 'Failed to grade assessment.' });

        let score = 0;
        const totalQuestions = linkedItems.length;

        for (const item of linkedItems) {
          const answerKey = `${item.question_type}_${item.question_id}`;
          const submitted = answers[answerKey];

          if (item.question_type === 'mcq') {
            const dbMCQ = await new Promise((resolve) => {
              db.get(`SELECT correct_option FROM mcqs WHERE id = ?`, [item.question_id], (e, r) => resolve(r));
            });
            
            const isCorrect = dbMCQ && dbMCQ.correct_option === submitted;
            if (isCorrect) score++;

            // Also record into standard submissions log so progress counts
            db.run(`
              INSERT INTO submissions (user_id, course_id, type, reference_id, submitted_answer, is_correct)
              VALUES (?, ?, 'mcq', ?, ?, ?)
            `, [userId, assessment.course_id, item.question_id, submitted || '', isCorrect ? 1 : 0]);
          } else if (item.question_type === 'assignment') {
          // Check if solved successfully in submissions
          const passSubmission = await new Promise((resolve) => {
            db.get(`
              SELECT is_correct FROM submissions 
              WHERE user_id = ? AND type = 'assignment' AND reference_id = ? AND is_correct = 1
              LIMIT 1
            `, [userId, item.question_id], (e, r) => resolve(r));
          });

          if (passSubmission && passSubmission.is_correct === 1) {
            score++;
          } else {
            // Log as incorrect submission if not solved
            db.run(`
              INSERT INTO submissions (user_id, course_id, type, reference_id, submitted_answer, is_correct)
              VALUES (?, ?, 'assignment', ?, ?, 0)
            `, [userId, assessment.course_id, item.question_id, submitted || '']);
          }
        }
      }

      // Check for disqualification (e.g. excessive tab switching > 15 times)
      const status = (tab_switches && parseInt(tab_switches) > 15) ? 'disqualified' : 'completed';

      // Insert result
      db.run(`
        INSERT INTO assessment_submissions (user_id, assessment_id, score, total_questions, tab_switch_count, time_spent, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, assessmentId, score, totalQuestions, tab_switches || 0, time_spent || 0, status], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to save exam results.' });
        res.json({
          success: true,
          score,
          totalQuestions,
          status,
          submissionId: this.lastID
        });
      });
    });
  });
});
});

// Student: Review assessment results and answers
app.get('/api/student/assessments/:id/review', requireLogin, (req, res) => {
  const assessmentId = req.params.id;
  const userId = req.session.userId;

  // 1. Verify student has submitted this exam
  db.get(`SELECT * FROM assessment_submissions WHERE user_id = ? AND assessment_id = ?`, [userId, assessmentId], (err, submission) => {
    if (err || !submission) {
      return res.status(403).json({ error: 'Access denied: You must complete the exam before reviewing correct answers.' });
    }

    // 2. Fetch assessment details and linked questions
    db.get(`SELECT * FROM assessments WHERE id = ?`, [assessmentId], (err, assessment) => {
      if (err || !assessment) return res.status(404).json({ error: 'Assessment not found.' });

      db.all(`SELECT question_type, question_id FROM assessment_questions WHERE assessment_id = ? ORDER BY order_index`, [assessmentId], async (err, linkedItems) => {
        if (err) return res.status(500).json({ error: 'Failed to retrieve review questions.' });

        const questions = [];
        const studentAnswers = {};

        for (const item of linkedItems) {
          // Fetch questions content including correct answers
          if (item.question_type === 'mcq') {
            const mcq = await new Promise((resolve) => {
              db.get(`SELECT id, question, option_a, option_b, option_c, option_d, correct_option FROM mcqs WHERE id = ?`, [item.question_id], (e, r) => resolve(r));
            });
            if (mcq) questions.push({ type: 'mcq', data: mcq });

            // Fetch what student submitted
            const sub = await new Promise((resolve) => {
              db.get(`
                SELECT submitted_answer, is_correct FROM submissions 
                WHERE user_id = ? AND type = 'mcq' AND reference_id = ? 
                ORDER BY created_at DESC LIMIT 1
              `, [userId, item.question_id], (e, r) => resolve(r));
            });
            studentAnswers[`mcq_${item.question_id}`] = sub || { submitted_answer: null, is_correct: 0 };

          } else if (item.question_type === 'assignment') {
            const coding = await new Promise((resolve) => {
              db.get(`SELECT id, title, description, boilerplate_code, test_cases, hint FROM assignments WHERE id = ?`, [item.question_id], (e, r) => resolve(r));
            });
            if (coding) questions.push({ type: 'assignment', data: coding });

            // Fetch what student submitted
            const sub = await new Promise((resolve) => {
              db.get(`
                SELECT submitted_answer, is_correct FROM submissions 
                WHERE user_id = ? AND type = 'assignment' AND reference_id = ? 
                ORDER BY created_at DESC LIMIT 1
              `, [userId, item.question_id], (e, r) => resolve(r));
            });
            studentAnswers[`assignment_${item.question_id}`] = sub || { submitted_answer: null, is_correct: 0 };
          }
        }

        res.json({
          success: true,
          assessment,
          submission,
          questions,
          studentAnswers
        });
      });
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`LMS Server is running on http://localhost:${PORT}`);
});
