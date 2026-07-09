const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const multer = require('multer');

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

    // Migration updates for lectures table
    db.run(`ALTER TABLE lectures ADD COLUMN duration TEXT`, (err) => {
      // Ignored if column already exists
    });
    db.run(`ALTER TABLE lectures ADD COLUMN content_type TEXT DEFAULT 'Video Lecture'`, (err) => {
      // Ignored if column already exists
    });

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
  const { title, order_index, duration, content_type } = req.body;
  
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
    `INSERT INTO lectures (course_id, title, video_url, order_index, duration, content_type) VALUES (?, ?, ?, ?, ?, ?)`,
    [courseId, title, video_url, order, dur, cType],
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
    SELECT id, email, ip_address, user_agent, login_time 
    FROM login_logs 
    ORDER BY login_time DESC 
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

  db.all(queryStudents, [], (err, students) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch students.' });

    db.all(queryLogs, [], (err, logs) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch session audit logs.' });

      db.all(queryProgress, [], (err, progress) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch lecture progress details.' });

        db.all(queryEnrollments, [], (err, enrollments) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch enrollments details.' });

          res.json({
            students,
            logs,
            progress,
            enrollments
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

// Start Server
app.listen(PORT, () => {
  console.log(`LMS Server is running on http://localhost:${PORT}`);
});
