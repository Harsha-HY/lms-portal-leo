# GSSS SSFGC LMS Portal — Digital Campus & Learning System

Official Smart Learning Management System (LMS) for **GSSS Simha Subbamahalakshmi First Grade College (SSFGC), Mysuru**, affiliated with the **University of Mysore**. Managed by **Geetha Shishu Shikshana Sangha (GSSS®)**.

A high-performance, responsive, and feature-rich LMS and academic digital hub. This platform delivers a digital learning experience for **BCA**, **BBA**, and **B.Com** students alongside a comprehensive faculty administrative workspace.

---

## 🌟 Core Features & Capabilities

### 1. Student Academic Portal
* **Modular Video Lectures**: High-definition, unit-wise curriculum lessons mapped directly to University of Mysore syllabi.
* **In-Browser Code Compiler**: Interactive practice IDE supporting **Python**, **Java**, **C++**, **JavaScript**, and **SQL** with automated test-case evaluation and AI debugging hints.
* **Anti-Cheat Proctored Assessments**: Timed Online Assessments (OAs) equipped with tab-switch monitoring and real-time alerts.
* **53-Week Contribution Heatmap**: GitHub-style visual tracker calculating daily lecture watch consistency, coding submissions, and study streaks.
* **WhatsApp Web-Style Batch Chat**: Real-time cohort communication channels with color-coded initials avatars and keyboard `Enter` sending.
* **Course-Targeted Live Meets**: Directly join faculty-scheduled Google Meet mentoring sessions.
* **Gamified XP Leaderboard**: Earn Experience Points (XP) for watched lectures, solved coding problems, and high quiz scores.

### 2. Faculty & Admin Management Console
* **Interactive Chart.js Analytics**: Live visualizations tracking course subscriptions, candidate completion rates, and 7-day login activity timelines.
* **Curriculum Publisher**: Upload video lectures, link chapter study notes, create MCQ quizzes, and configure coding problem sets.
* **Live Meeting Scheduler**: Manage course-targeted Google Meets and archive session histories.
* **Anti-Cheat Audit Logs**: Review student exam submissions, scores, elapsed time, and tab-switch records to ensure academic integrity.
* **Student Helpdesk Ticket Resolver**: View and resolve student inquiries submitted through the public portal.

---

## 🛠️ Tech Stack & Architecture

* **Backend**: Node.js & Express.js server (`server.js`)
* **Database**: SQLite3 (`database.db`)
* **File & Media Storage**: Local disk storage handled by Multer (`public/uploads/`)
* **Authentication**: Session-based auth with `express-session`, password encryption via `bcryptjs` (salt work factor = 10), and Role-Based Access Control (RBAC)
* **Frontend**: Vanilla HTML5, CSS3, Google Fonts (`Sora` + `Manrope`), and lightweight JS controllers (`api.js`, `app.js`)
* **Visuals & Charts**: Chart.js for admin analytics

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org) (v16+ recommended)
* npm

### Installation & Launch
1. Clone the repository:
   ```bash
   git clone https://github.com/Harsha-HY/lms-portal-leo.git
   cd lms-portal-leo
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **Admin / Faculty** | `harshahy701@gmail.com` | `admin123` | [Admin Console](http://localhost:3000/admin.html) |
| **Student** | `demo@gmail.com` | `demo123` | [Student Dashboard](http://localhost:3000/dashboard.html) |

---

## 🏛️ Institution Details

* **Institution**: GSSS Simha Subbamahalakshmi First Grade College (SSFGC), Mysuru
* **Affiliation**: Affiliated with the University of Mysore
* **Management**: Geetha Shishu Shikshana Sangha (GSSS®)
* **Campus Address**: Plot No. 45 & 46 (part), Survey No. 22, Belagola Industrial Area, KRS Road, Metagalli, Mysuru – 570016, Karnataka, India
* **Telephone**: +91 0821 2581302 / +91 944 878 2121
* **Email**: `gsssfgc@gmail.com`
