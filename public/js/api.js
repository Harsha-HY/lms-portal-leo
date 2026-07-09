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

  updateProgress(lectureId, completed) {
    return this.fetchJSON('/api/student/progress', {
      method: 'POST',
      body: JSON.stringify({ lecture_id: lectureId, completed })
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
  }
};
