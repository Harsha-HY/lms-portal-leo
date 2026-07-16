const API = {
  async fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    
    // Log out if unauthorized (except during initial status check or login requests)
    if (res.status === 401 && !url.includes('/api/auth/me') && !url.includes('/api/auth/login') && !url.includes('/api/auth/register') && !url.includes('/api/auth/google-mock')) {
      window.location.href = 'index.html';
      return { error: 'Unauthorized session.' };
    }

    return res.json();
  },

  // Auth Operations
  register(name, email, password) {
    return this.fetchJSON('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  login(email, password) {
    return this.fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  loginGoogleMock(name, email, googleId) {
    return this.fetchJSON('/api/auth/google-mock', {
      method: 'POST',
      body: JSON.stringify({ name, email, googleId })
    });
  },

  logout() {
    return this.fetchJSON('/api/auth/logout', { method: 'POST' });
  },

  checkSession() {
    return this.fetchJSON('/api/auth/me');
  },

  // Course Operations
  getCourses() {
    return this.fetchJSON('/api/courses');
  },

  createCourse(formData) {
    return fetch('/api/courses', {
      method: 'POST',
      body: formData
    }).then(res => {
      if (res.status === 401) {
        window.location.href = 'index.html';
        return { error: 'Unauthorized session.' };
      }
      return res.json();
    });
  },

  getLectures(courseId) {
    return this.fetchJSON(`/api/courses/${courseId}/lectures`);
  },

  addLecture(courseId, formData) {
    return fetch(`/api/courses/${courseId}/lectures`, {
      method: 'POST',
      body: formData
    }).then(res => {
      if (res.status === 401) {
        window.location.href = 'index.html';
        return { error: 'Unauthorized session.' };
      }
      return res.json();
    });
  },

  // Student Progress Operations
  getProgress() {
    return this.fetchJSON('/api/student/progress');
  },

  getLoginLogs() {
    return this.fetchJSON('/api/student/logs');
  },

  getLeaderboard() {
    return this.fetchJSON('/api/leaderboard');
  },

  getStudentAssessments() {
    return this.fetchJSON('/api/student/assessments');
  },

  getStudentAssessmentDetails(id) {
    return this.fetchJSON(`/api/student/assessments/${id}`);
  },

  submitStudentAssessment(id, payload) {
    return this.fetchJSON(`/api/student/assessments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getStudentProfile() {
    return this.fetchJSON('/api/student/profile');
  },

  updateStudentProfile(payload) {
    return this.fetchJSON('/api/student/profile', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  uploadStudentResume(formData) {
    return fetch('/api/student/profile/resume', {
      method: 'POST',
      body: formData
    }).then(async (res) => {
      if (res.status === 401) {
        window.location.href = '/login.html';
        throw new Error('Unauthorized');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload');
      return data;
    });
  },

  getAdminStudentProfile(id) {
    return this.fetchJSON(`/api/admin/students/${id}/profile`);
  },

  submitCallbackRequest(payload) {
    return this.fetchJSON('/api/student/callback-request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getStudentCallbackRequests() {
    return this.fetchJSON('/api/student/callback-requests');
  },

  getAdminCallbackRequests() {
    return this.fetchJSON('/api/admin/callback-requests');
  },

  finishCallbackRequest(id) {
    return this.fetchJSON(`/api/admin/callback-requests/${id}/finish`, {
      method: 'POST'
    });
  },

  getStudentAssessmentReview(id) {
    return this.fetchJSON(`/api/student/assessments/${id}/review`);
  },

  updateProgress(lectureId, completed) {
    return this.fetchJSON('/api/student/progress', {
      method: 'POST',
      body: JSON.stringify({ lecture_id: lectureId, completed })
    });
  },

  updateVideoProgress(lectureId, watchedSeconds) {
    return this.fetchJSON('/api/student/video-progress', {
      method: 'POST',
      body: JSON.stringify({ lecture_id: lectureId, watched_seconds: watchedSeconds })
    });
  },

  // Student Enrollment Operations
  getEnrollments() {
    return this.fetchJSON('/api/student/enrollments');
  },

  enrollInCourse(courseId) {
    return this.fetchJSON('/api/student/enroll', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId })
    });
  },

  // Admin Operations
  inviteFaculty(name, email, password, role) {
    return this.fetchJSON('/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  },

  getTrackingData() {
    return this.fetchJSON('/api/admin/tracking');
  },

  getXPSettings() {
    return this.fetchJSON('/api/admin/xp-settings');
  },

  saveXPSettings(video_xp, mcq_xp, assignment_xp) {
    return this.fetchJSON('/api/admin/xp-settings', {
      method: 'POST',
      body: JSON.stringify({ video_xp, mcq_xp, assignment_xp })
    });
  },

  getAdminAssessments() {
    return this.fetchJSON('/api/admin/assessments');
  },

  createAdminAssessment(payload) {
    return this.fetchJSON('/api/admin/assessments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  deleteAdminAssessment(id) {
    return this.fetchJSON(`/api/admin/assessments/${id}`, {
      method: 'DELETE'
    });
  },

  getAdminAssessmentResults() {
    return this.fetchJSON('/api/admin/assessment-results');
  },

  getStudentHistory() {
    return this.fetchJSON('/api/admin/student-history');
  },

  deleteCourse(courseId) {
    return this.fetchJSON(`/api/courses/${courseId}`, {
      method: 'DELETE'
    });
  },

  deleteLecture(lectureId) {
    return this.fetchJSON(`/api/lectures/${lectureId}`, {
      method: 'DELETE'
    });
  },

  getTeamMembers() {
    return this.fetchJSON('/api/admin/team');
  },

  deleteTeamMember(userId) {
    return this.fetchJSON(`/api/admin/team/${userId}`, {
      method: 'DELETE'
    });
  },

  // Assignments API client
  getAssignments(courseId) {
    return this.fetchJSON(`/api/courses/${courseId}/assignments`);
  },
  createAssignment(courseId, assignmentData) {
    return this.fetchJSON(`/api/courses/${courseId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  },
  deleteAssignment(id) {
    return this.fetchJSON(`/api/assignments/${id}`, {
      method: 'DELETE'
    });
  },

  // MCQs API client
  getMCQs(courseId) {
    return this.fetchJSON(`/api/courses/${courseId}/mcqs`);
  },
  createMCQ(courseId, mcqData) {
    return this.fetchJSON(`/api/courses/${courseId}/mcqs`, {
      method: 'POST',
      body: JSON.stringify(mcqData)
    });
  },
  deleteMCQ(id) {
    return this.fetchJSON(`/api/mcqs/${id}`, {
      method: 'DELETE'
    });
  },

  // Submissions API client
  getSubmissions() {
    return this.fetchJSON('/api/submissions');
  },
  submitAnswer(submissionPayload) {
    return this.fetchJSON('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionPayload)
    });
  },

  // PDF & AI Generators
  parsePdfMCQ(formData) {
    return fetch('/api/admin/parse-pdf-mcq', {
      method: 'POST',
      body: formData
    }).then(res => {
      if (res.status === 401) {
        window.location.href = 'index.html';
        return { error: 'Unauthorized session.' };
      }
      return res.json();
    });
  },
  generateAiMCQ(topic) {
    return this.fetchJSON('/api/admin/generate-ai-mcq', {
      method: 'POST',
      body: JSON.stringify({ topic })
    });
  },
  saveLectureNotes(lectureId, notes) {
    return this.fetchJSON(`/api/lectures/${lectureId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }
};
