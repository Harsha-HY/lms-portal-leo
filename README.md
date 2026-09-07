# LMS Portal Leo - Learning Management System

## Overview

LMS Portal Leo is a full-featured Learning Management System that enables educators to create and manage courses, deliver video lectures, and assess student learning through MCQs, coding assignments, and timed mock assessments. The platform includes gamification through XP leaderboards, real-time progress tracking, and comprehensive admin dashboards for monitoring student engagement.

## How It Works

### User Roles & Authentication

The system supports three user roles:

1. **Admin (Owner)** 
2. **Faculty** - Instructors invited by admins who can create courses and content
3. **Student** - Learners who enroll in courses and complete lessons

Users register with email/password (hashed with bcrypt) or can use pre-existing accounts. Sessions are maintained server-side using express-session with 24-hour expiry.

### Core Features

#### 1. Course Management
- Admins/Faculty create courses with title, description, category, and thumbnail
- Courses appear in course listings that students can explore
- Each course can contain multiple lectures, assignments, and MCQs
- Instructors add metadata like name, title, bio, avatar, and syllabus roadmap

#### 2. Video Lectures
- Upload videos directly or link YouTube/external video URLs
- Videos are streamed to students with automatic progress tracking
- System tracks seconds watched per video for XP calculations
- Lectures can have notes, duration, and content type indicators
- Lecures are ordered sequentially for structured learning paths

#### 3. Student Progress Tracking
- System automatically marks lectures as complete/incomplete
- Video watch time (seconds) is recorded in real-time as students watch
- Login activity is logged for engagement analytics
- A progress heatmap can be generated from login history for streak calculations

#### 4. Assessments & Quizzes

**MCQ (Multiple Choice Questions)**
- Faculty creates questions with four options and correct answer
- Students select answers during completion
- Instant feedback shows if correct or incorrect
- Progress and XP awarded automatically
- PDF worksheets can be parsed to auto-generate MCQ questions

**Coding Assignments**
- JavaScript-based assignments with boilerplate code templates
- Two-tier hint system (hint + hint_2) for progressive support
- Test cases stored in JSON format for validation
- System tracks tab-switch attempts to monitor exam integrity

**Timed Mock Assessments**
- Proctored exams combining MCQs and coding tasks
- Configurable duration in minutes
- Real-time grading on submission
- Tab-switch detection (>15 switches = disqualification)
- Time-spent tracking for analytics
- Student can review results after completion with correct answers visible

#### 5. Gamification & Leaderboards
- **XP System** - Points awarded for:
  - Video watching (50 XP per 30 seconds watched)
  - MCQ completion (25 XP default, configurable)
  - Assignment completion (100 XP default, configurable)
- **Global Leaderboard** - Ranks all students by total XP with course enrollments displayed
- Admins can customize XP multipliers

#### 6. Student Profiles & Onboarding
- Students complete profile with education level, institution, degree stream, major, GPA
- Resume upload support with PDF storage in `/uploads`
- GitHub and LinkedIn profile links
- Callback request system - students can request instructor call for doubt clarification
- Admins track pending/completed callback requests

#### 7. Admin Tracking & Analytics
- **Student Progress Dashboard** - View all students with lecture completion rates per course
- **Login Audit Logs** - Track IP addresses, user agents, and login timestamps
- **Detailed History** - Complete audit trail of:
  - Student enrollments and course progress
  - MCQ/Assignment submissions with correctness status
  - Tab-switch counts during assessments
  - Timestamps of all activities

#### 8. Team Management
- Admins invite faculty members with email/password credentials
- Can revoke faculty/admin access by deleting accounts
- Prevent self-removal of admin privileges

## Data Flow

### User Journey - Student

1. **Register** → Auto-enrolls as student (first user is admin)
2. **Browse Courses** → View available courses
3. **Enroll** → Add course to personal dashboard
4. **Watch Lectures** → Automatic progress/XP tracking, mark as complete
5. **Complete MCQs** → Submit answers, get instant feedback
6. **Solve Assignments** → Write/test code against test cases, earn XP
7. **Take Assessments** → Timed mock exams with proctoring features
8. **View Profile** → Track total XP, rank on leaderboard, enrolled courses
9. **Request Callback** → Submit doubts for faculty interaction

### Teacher/Admin Workflow

1. **Invite Faculty** → Create additional instructors
2. **Create Courses** → Define learning programs
3. **Add Lectures** → Upload videos with notes and metadata
4. **Create MCQs** → Build question pools (manual or PDF-parsed)
5. **Create Assignments** → Design coding challenges with hints and test cases
6. **Build Assessments** → Combine MCQs + assignments into timed exams
7. **Monitor Progress** → View student completion rates and engagement
8. **Manage Callbacks** → Track student doubts and mark as completed
9. **Generate Reports** → Export audit logs and submission history

## Database Architecture

**SQLite Database** with 14 core tables:

- `users` - Authentication & roles
- `courses` - Course metadata
- `lectures` - Video content
- `enrollments` - Student-course relationships
- `progress` - Video completion and watch time
- `assignments` - Coding challenges
- `mcqs` - Quiz questions
- `submissions` - Student answers and results
- `assessments` - Timed mock exams
- `assessment_questions` - Links questions to assessments
- `assessment_submissions` - Exam attempt results
- `login_logs` - Activity audit trail
- `student_profiles` - Extended profile information
- `callback_requests` - Doubt/support requests

## API Architecture

The backend exposes RESTful endpoints organized by domain:

- `/api/auth/*` - Authentication (register, login, logout, me)
- `/api/courses/*` - Course CRUD & lecture management
- `/api/student/*` - Student progress, profile, enrollment
- `/api/admin/*` - Tracking, team management, content creation
- `/api/submissions` - Student quiz/assignment submissions
- `/api/leaderboard` - XP rankings
- `/api/assignments`, `/api/mcqs` - Content management

All endpoints except login/register require `requireLogin` middleware. Admin/Faculty endpoints require `requireAdminOrFaculty` or `requireAdmin` middleware enforcing role-based access control.

## File Uploads

- **Video Lectures** - Stored in `/uploads` with automatic naming
- **Assignment Solutions** - Logged in submissions table
- **Resumes** - PDF files stored in `/uploads`
- **Thumbnails** - Course images from URLs or uploaded files
- **File Size Limit** - 100MB per upload

## Real-Time Features

- Video progress updates send `watched_seconds` to backend
- Tab-switch detection during assessments (client-side tracking)
- Instant XP calculation on leaderboard
- Automatic exam grading on submit with score/status response
- Session state maintained server-side for 24 hours

## Frontend Architecture

Built with React + Vite + React Router:
- SPA routing for multi-page navigation
- Separate `/client` directory with dist build
- Express serves React build as static files with fallback to index.html
- REST API client calls to backend endpoints

## Security Features

- Password hashing with bcryptjs (10 salt rounds)
- Session-based authentication with HTTP-only cookies
- Role-based middleware for endpoint protection
- Login tracking for audit purposes
- Prevents self-removal of admin privileges
- Assessment answers hidden during proctoring (exclude correct options)

