// Main application coordinator for student and admin portals
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// App state
let currentUser = null;
let allCourses = [];
let rawProgress = [];
let completedLectureIds = [];
let courseLecturesMap = {}; // courseId -> array of lectures
let activeModalLectureId = null;
let enrolledCourseIds = [];

// Admin audit history state
let historyStudents = [];
let historyLogs = [];
let historyProgress = [];
let historyEnrollments = [];
let selectedStudentId = null;

window.changeTheme = function(themeName) {
  document.body.classList.remove('theme-dark-slate', 'theme-cream-white', 'theme-cyberpunk', 'theme-ocean');
  document.body.classList.add(themeName);
  localStorage.setItem('leo-theme', themeName);
};

async function initApp() {
  // Initialize and apply stored theme
  const activeTheme = localStorage.getItem('leo-theme') || 'theme-dark-slate';
  document.body.classList.remove('theme-dark-slate', 'theme-cream-white', 'theme-cyberpunk', 'theme-ocean');
  document.body.classList.add(activeTheme);
  const selector = document.getElementById('theme-selector');
  if (selector) selector.value = activeTheme;

  // Check active session
  try {
    const session = await API.checkSession();
    if (!session.loggedIn) {
      // Redirect to login if not authenticated and not on index page
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
        return;
      }
    } else {
      currentUser = session.user;
      updateSidebarUser();
      
      // Page-specific initializers
      if (window.location.pathname.includes('dashboard.html')) {
        // Show Admin shortcut if user is Admin or Faculty
        if (currentUser.role === 'admin' || currentUser.role === 'faculty') {
          const shortcut = document.getElementById('admin-shortcut-container');
          if (shortcut) shortcut.style.display = 'block';
        }
        await loadDashboardData();
        renderHomeDates();
      } else if (window.location.pathname.includes('admin.html')) {
        // Observers / Faculty cannot invite other faculty members (Admin only)
        if (currentUser.role === 'faculty') {
          const inviteBtn = document.getElementById('invite-nav-btn');
          if (inviteBtn) inviteBtn.style.display = 'none';
        }
        
        // Attach change listener for course lectures management list
        const courseSelect = document.getElementById('lecture-course-select');
        if (courseSelect) {
          courseSelect.addEventListener('change', (e) => {
            loadAdminLecturesList(e.target.value);
          });
        }

        // Attach click listener for Delete Batch collapsible sidebar panel
        const toggleBtn = document.getElementById('delete-batch-toggle');
        const coursesContainer = document.getElementById('delete-batch-courses');
        const toggleArrow = document.getElementById('delete-batch-arrow');
        if (toggleBtn && coursesContainer) {
          toggleBtn.addEventListener('click', () => {
            if (coursesContainer.style.display === 'none') {
              coursesContainer.style.display = 'flex';
              if (toggleArrow) toggleArrow.textContent = '▲';
            } else {
              coursesContainer.style.display = 'none';
              if (toggleArrow) toggleArrow.textContent = '▼';
            }
          });
        }

        await loadAdminData();
        await populateCourseSelects();
      }
    }
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

// Update sidebar user metadata
function updateSidebarUser() {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');

  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleEl) roleEl.textContent = currentUser.role;
  if (avatarEl) {
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

// Log out handler
async function handleLogout() {
  try {
    await API.logout();
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Logout error:', err);
  }
}

/* ==========================================================================
   TAB SWITCHING LOGIC
   ========================================================================== */
function switchTab(tabId, button) {
  // Hide all views
  document.querySelectorAll('.tab-view').forEach(view => {
    view.style.display = 'none';
  });
  
  // Show target view
  const targetView = document.getElementById(`tab-${tabId}`);
  if (targetView) targetView.style.display = 'block';

  // Toggle active class on sidebar links
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');

  // Update headers
  const titleEl = document.getElementById('view-title');
  const subEl = document.getElementById('view-subtitle');

  if (tabId === 'home') {
    titleEl.textContent = 'Welcome back, ' + currentUser.name + '!';
    subEl.textContent = 'Track progress, complete milestones, and watch lectures.';
    renderHomeScreen();
  } else if (tabId === 'journey') {
    titleEl.textContent = 'My Learning Journey';
    subEl.textContent = 'Complete growth cycles to unlock technical modules.';
    renderJourneyScreen();
  } else if (tabId === 'courses') {
    titleEl.textContent = 'Browse Other Courses';
    subEl.textContent = 'Explore other specializations and catalog categories.';
    renderCoursesGrid();
  }
}

function switchAdminTab(tabId, button) {
  document.querySelectorAll('.admin-tab-view').forEach(view => {
    view.style.display = 'none';
  });

  const targetView = document.getElementById(`tab-admin-${tabId}`);
  if (targetView) targetView.style.display = 'block';

  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');

  const titleEl = document.getElementById('admin-view-title');
  const subEl = document.getElementById('admin-view-subtitle');

  if (tabId === 'tracking') {
    titleEl.textContent = 'LMS Administration Control';
    subEl.textContent = 'Track logins, coordinate students, and manage curriculum.';
    loadAdminData();
  } else if (tabId === 'content') {
    titleEl.textContent = 'Curriculum & Lectures Manager';
    subEl.textContent = 'Publish courses and upload multi-stage educational videos.';
    populateCourseSelects();
  } else if (tabId === 'access') {
    titleEl.textContent = 'Grant Portal Access';
    subEl.textContent = 'Setup login credentials for observers, instructors, and faculty.';
  } else if (tabId === 'history') {
    titleEl.textContent = 'Candidate Audit Logs';
    subEl.textContent = 'Track and review student session logs, course enrollments, and video lecture progress history.';
    loadStudentHistoryData();
  }
}

/* ==========================================================================
   STUDENT PORTAL LOGIC (dashboard.html)
   ========================================================================== */

// Fetch student progress and course lectures mapping
async function loadDashboardData() {
  try {
    allCourses = await API.getCourses();
    enrolledCourseIds = await API.getEnrollments();
    rawProgress = await API.getProgress();
    completedLectureIds = rawProgress.map(r => r.lecture_id);
    
    // Map lectures for each course
    for (const course of allCourses) {
      const lectures = await API.getLectures(course.id);
      courseLecturesMap[course.id] = lectures;
    }
    
    renderHomeScreen();
    renderHomeDates(); // Refresh calendar dates matching dynamic completions
  } catch (err) {
    console.error('Error fetching dashboard progress data:', err);
  }
}

// Render calendar days at top (14-day horizontal strip scroll)
function renderHomeDates() {
  const container = document.getElementById('schedule-dates-container');
  if (!container) return;

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const today = new Date();
  
  container.innerHTML = '';
  
  // Set current date title header to: "Tue, 29 Jun 2021" format
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const dateLbl = document.getElementById('current-date-lbl');
  if (dateLbl) {
    dateLbl.textContent = today.toLocaleDateString('en-US', options);
  }

  // Generate 14 days centered around today (6 days ago to 7 days ahead)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);

  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    
    const isToday = d.toDateString() === today.toDateString();
    
    const dayItem = document.createElement('div');
    dayItem.className = `date-strip-item ${isToday ? 'active' : ''}`;
    
    // Check completion status from rawProgress list
    const completedOnThisDate = rawProgress.some(p => {
      const compDate = new Date(p.updated_at);
      return compDate.toDateString() === d.toDateString();
    });
    
    if (completedOnThisDate) {
      dayItem.classList.add('completed');
    }

    dayItem.innerHTML = `
      <span>${days[d.getDay()]}</span>
      <span class="date-num">${d.getDate()}</span>
    `;
    
    // Clicking date toggles active styling
    dayItem.addEventListener('click', () => {
      document.querySelectorAll('.date-strip-item').forEach(item => item.classList.remove('active'));
      dayItem.classList.add('active');
    });

    container.appendChild(dayItem);
  }
}

// Render widgets and ongoing cycle listing on Home tab
function renderHomeScreen() {
  // Update progress widgets
  updateProgressWidgets();

  const enrolledCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id));

  // Update progression history summary
  const summarySection = document.getElementById('progression-summary-section');
  const summaryContent = document.getElementById('progression-summary-content');
  
  if (summarySection && summaryContent) {
    if (enrolledCourses.length === 0) {
      summarySection.style.display = 'none';
    } else {
      summarySection.style.display = 'block';
      summaryContent.innerHTML = '';
      
      enrolledCourses.forEach((course) => {
        const lectures = courseLecturesMap[course.id] || [];
        const totalLecs = lectures.length;
        if (totalLecs === 0) return;

        // Find last completed lecture index
        let lastCompletedIndex = -1;
        let nextLectureIndex = 0;

        for (let i = 0; i < totalLecs; i++) {
          if (completedLectureIds.includes(lectures[i].id)) {
            lastCompletedIndex = i;
            nextLectureIndex = i + 1;
          }
        }

        const numUploadedText = `${totalLecs} Lecture${totalLecs > 1 ? 's' : ''} Uploaded`;
        
        let lastCompletedText = "None yet";
        if (lastCompletedIndex !== -1) {
          lastCompletedText = `Lec ${lastCompletedIndex + 1}: ${lectures[lastCompletedIndex].title}`;
        }

        let nextLectureText = "All Completed! 🎉";
        if (nextLectureIndex < totalLecs) {
          nextLectureText = `Lec ${nextLectureIndex + 1}: ${lectures[nextLectureIndex].title}`;
        }

        const courseProgressBlock = document.createElement('div');
        courseProgressBlock.style.cssText = "display: flex; flex-direction: column; gap: 0.4rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--card-border);";
        
        courseProgressBlock.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-weight: 700; font-size: 1rem; color: var(--text-main);">${course.title}</span>
            <span class="lecture-badge badge-green" style="font-size: 0.7rem; border-radius: 9999px;">${numUploadedText}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem; padding-left: 0.25rem; width: 100%;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <span style="color: var(--text-muted);">Last Completed:</span>
              <span style="color: var(--text-main); font-weight: 600;">${lastCompletedText}</span>
            </div>
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <span style="color: var(--text-muted);">Up Next:</span>
              <span style="color: var(--primary); font-weight: 700;">${nextLectureText}</span>
            </div>
          </div>
        `;
        summaryContent.appendChild(courseProgressBlock);
      });
      
      if (summaryContent.lastElementChild) {
        summaryContent.lastElementChild.style.borderBottom = "none";
        summaryContent.lastElementChild.style.paddingBottom = "0";
      }
    }
  }

  // Render ongoing cycles list
  const ongoingContainer = document.getElementById('ongoing-cycles-list');
  if (!ongoingContainer) return;
  ongoingContainer.innerHTML = '';

  if (enrolledCourses.length === 0) {
    ongoingContainer.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-icon">🎓</div>
        <h3>Welcome to LeoAxis</h3>
        <p>You have not enrolled in any courses yet. Please navigate to the "Other Courses" tab to enroll in learning modules.</p>
      </div>
    `;
    return;
  }

  enrolledCourses.forEach((course, index) => {
    const lectures = courseLecturesMap[course.id] || [];
    const totalLectures = lectures.length;
    if (totalLectures === 0) return;

    const completedInCourse = lectures.filter(l => completedLectureIds.includes(l.id)).length;
    const progressPct = totalLectures > 0 ? Math.round((completedInCourse / totalLectures) * 100) : 0;

    const block = document.createElement('div');
    block.className = 'growth-cycle-block';
    block.innerHTML = `
      <div class="growth-cycle-header">
        <div>
          <span class="lecture-badge badge-yellow" style="margin-bottom: 0.5rem; display: inline-block;">Growth Cycle ${index + 1}</span>
          <h3 style="font-size: 1.4rem; color: var(--text-main);">${course.title}</h3>
        </div>
        <span class="growth-cycle-percentage">${progressPct}% Complete</span>
      </div>
      <div class="growth-cycle-progress-bar">
        <div class="growth-cycle-progress-fill" style="width: ${progressPct}%;"></div>
      </div>
      
      <!-- Connective Milestone Sequence Timeline -->
      <div class="timeline-container">
        ${lectures.slice(0, 4).map((lec, lecIdx) => {
          const isLecCompleted = completedLectureIds.includes(lec.id);
          
          const badgeType = (lec.content_type || 'Video Lecture').toUpperCase();
          const duration = lec.duration || '15 mins';
          
          let badgeColorClass = "badge-green";
          if (badgeType === 'ASSESSMENT' || badgeType === 'ASSIGNMENT') {
            badgeColorClass = "badge-yellow";
          } else if (badgeType === 'PRACTICE') {
            badgeColorClass = "badge-yellow";
          }

          return `
            <div class="timeline-item ${isLecCompleted ? 'completed' : ''}" onclick="playLecture(${lec.id}, '${lec.title}', '${course.title}', '${lec.video_url}')">
              <div class="timeline-content">
                <span class="timeline-title">${lec.title}</span>
                <div class="timeline-badges">
                  <span class="lecture-badge ${badgeColorClass}">${badgeType}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">⏱ ${duration}</span>
                </div>
              </div>
              <div class="lecture-status-indicator" onclick="event.stopPropagation(); toggleLectureStatus(${lec.id})" style="margin: 0; border: none; background: transparent;">
                <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 18px; height: 18px; color: ${isLecCompleted ? 'var(--success)' : 'rgba(255, 255, 255, 0.25)'}; filter: ${isLecCompleted ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' : 'none'};">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          `;
        }).join('')}
        ${totalLectures > 4 ? `
          <button class="btn" style="background: transparent; color: var(--primary-light); padding: 0.5rem; justify-content: flex-start; font-weight: 700;" onclick="navigateToJourneyTab()">
            + View all ${totalLectures} lectures in journey
          </button>
        ` : ''}
      </div>
    `;
    ongoingContainer.appendChild(block);
  });
}

function navigateToJourneyTab() {
  const journeyBtn = document.querySelector(".sidebar-link[onclick*='journey']");
  if (journeyBtn) switchTab('journey', journeyBtn);
}

// Recalculate and redraw progress trackers
function updateProgressWidgets() {
  let totalLecturesCount = 0;
  let totalCompletedCount = completedLectureIds.length;

  Object.values(courseLecturesMap).forEach(lectures => {
    totalLecturesCount += lectures.length;
  });

  const dailyPct = totalLecturesCount > 0 ? Math.round((totalCompletedCount / totalLecturesCount) * 100) : 0;
  
  // Daily circular indicator
  const circleVal = document.getElementById('daily-progress-val');
  const circleFill = document.getElementById('daily-progress-circle');
  if (circleVal) circleVal.textContent = `${dailyPct}%`;
  if (circleFill) {
    const circumference = 2 * Math.PI * 65; // ~408.4
    const offset = circumference - (circumference * dailyPct) / 100;
    circleFill.style.strokeDasharray = `${circumference}`;
    circleFill.style.strokeDashoffset = `${offset}`;
  }

  // Profile widget points and coins calculation (glowing gamified rewards)
  const pointsVal = document.getElementById('profile-points-val');
  const coinsVal = document.getElementById('profile-coins-val');
  const nameWidget = document.getElementById('profile-widget-name');
  const avatarWidget = document.getElementById('profile-widget-avatar');
  const dateWidget = document.getElementById('profile-widget-date');
  
  const calcPoints = totalCompletedCount * 100 + 18023;
  const calcCoins = totalCompletedCount * 10 + 200;

  if (pointsVal) pointsVal.textContent = calcPoints.toLocaleString();
  if (coinsVal) coinsVal.textContent = calcCoins.toLocaleString();
  if (nameWidget) nameWidget.textContent = currentUser.name;
  if (avatarWidget) {
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatarWidget.textContent = initials;
  }
  if (dateWidget) {
    const opt = { day: 'numeric', month: 'long', year: 'numeric' };
    dateWidget.textContent = today.toLocaleDateString('en-US', opt);
  }

  // Weekly Goal check bubbles list
  const ratioEl = document.getElementById('weekly-goal-ratio');
  const fillEl = document.getElementById('weekly-goal-fill');
  
  const startOfWeekDate = new Date(today);
  const dayIndex = today.getDay();
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  startOfWeekDate.setDate(today.getDate() + diffToMonday);
  startOfWeekDate.setHours(0, 0, 0, 0);

  const daysList = document.querySelectorAll('#weekly-days-list .day-bubble');
  daysList.forEach(bubble => {
    bubble.classList.remove('completed', 'active');
    const bubbleDay = parseInt(bubble.getAttribute('data-day'));
    
    const bubbleDate = new Date(startOfWeekDate);
    const offset = bubbleDay === 0 ? 6 : bubbleDay - 1;
    bubbleDate.setDate(startOfWeekDate.getDate() + offset);

    if (bubbleDate.toDateString() === today.toDateString()) {
      bubble.classList.add('active');
    }

    const completedOnThisDay = rawProgress.some(p => {
      const compDate = new Date(p.updated_at);
      return compDate.toDateString() === bubbleDate.toDateString();
    });

    if (completedOnThisDay) {
      bubble.classList.add('completed');
    }
  });

  const daysChecked = Array.from(daysList).filter(b => b.classList.contains('completed')).length;
  if (ratioEl) {
    ratioEl.textContent = `${daysChecked}/5 Days This Week`;
  }
  if (fillEl) {
    const weeklyPct = Math.min((daysChecked / 5) * 100, 100);
    fillEl.style.width = `${weeklyPct}%`;
  }
}

// Render "My Journey" growth cycles listing
function renderJourneyScreen() {
  const container = document.getElementById('journey-cycles-list');
  if (!container) return;
  container.innerHTML = '';

  const enrolledCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id));

  if (enrolledCourses.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-icon">🎓</div>
        <h3>No active cycles</h3>
        <p>You have not enrolled in any courses yet. Go to "Other Courses" to browse the curriculum.</p>
      </div>
    `;
    return;
  }

  enrolledCourses.forEach((course, index) => {
    const lectures = courseLecturesMap[course.id] || [];
    const totalLectures = lectures.length;
    const completedInCourse = lectures.filter(l => completedLectureIds.includes(l.id)).length;
    const progressPct = totalLectures > 0 ? Math.round((completedInCourse / totalLectures) * 100) : 0;

    const block = document.createElement('div');
    block.className = 'growth-cycle-block';
    block.innerHTML = `
      <div class="growth-cycle-header">
        <div>
          <span class="lecture-badge badge-green" style="margin-bottom: 0.5rem; display: inline-block;">Growth Cycle ${index + 1}</span>
          <h3 style="font-size: 1.4rem; color: var(--text-main);">${course.title}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">${course.description || ''}</p>
        </div>
        <span class="growth-cycle-percentage" style="font-size: 1.2rem;">${progressPct}% Complete</span>
      </div>
      <div class="growth-cycle-progress-bar" style="height: 10px;">
        <div class="growth-cycle-progress-fill" style="width: ${progressPct}%; background-color: var(--success);"></div>
      </div>
      <div class="timeline-container">
        ${lectures.map((lec, lecIdx) => {
          const isLecCompleted = completedLectureIds.includes(lec.id);
          
          const badgeType = (lec.content_type || 'Video Lecture').toUpperCase();
          const duration = lec.duration || '15 mins';
          
          let badgeColorClass = "badge-green";
          if (badgeType === 'ASSESSMENT' || badgeType === 'ASSIGNMENT') {
            badgeColorClass = "badge-yellow";
          } else if (badgeType === 'PRACTICE') {
            badgeColorClass = "badge-yellow";
          }

          return `
            <div class="timeline-item ${isLecCompleted ? 'completed' : ''}" onclick="playLecture(${lec.id}, '${lec.title}', '${course.title}', '${lec.video_url}')">
              <div class="timeline-content">
                <span class="timeline-title">${lec.title}</span>
                <div class="timeline-badges">
                  <span class="lecture-badge ${badgeColorClass}">${badgeType}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">⏱ ${duration}</span>
                </div>
              </div>
              <div class="lecture-status-indicator" onclick="event.stopPropagation(); toggleLectureStatus(${lec.id})" style="margin: 0; border: none; background: transparent;">
                <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 18px; height: 18px; color: ${isLecCompleted ? 'var(--success)' : 'rgba(255, 255, 255, 0.25)'}; filter: ${isLecCompleted ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' : 'none'};">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.appendChild(block);
  });
}

// Render "Other Courses" catalogs
function renderCoursesGrid() {
  const container = document.getElementById('courses-grid-container');
  if (!container) return;
  container.innerHTML = '';

  if (allCourses.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-icon">📚</div>
        <h3>No courses available</h3>
        <p>There are no courses listed in the curriculum database right now.</p>
      </div>
    `;
    return;
  }

  allCourses.forEach(course => {
    const lectures = courseLecturesMap[course.id] || [];
    const totalLectures = lectures.length;
    const completedInCourse = lectures.filter(l => completedLectureIds.includes(l.id)).length;
    const progressPct = totalLectures > 0 ? Math.round((completedInCourse / totalLectures) * 100) : 0;

    const isEnrolled = enrolledCourseIds.includes(course.id);

    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <div class="course-thumbnail" style="background-image: url('${course.thumbnail_url}');">
        <span class="course-category-tag">${course.category}</span>
      </div>
      <div class="course-card-content">
        <h4 class="course-card-title">${course.title}</h4>
        <p class="course-card-desc">${course.description || 'Access lectures and tracks progress.'}</p>
        <div class="course-card-footer" style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; width: 100%;">
          ${isEnrolled ? `
            <div style="flex: 1; display: flex; justify-content: flex-end; width: 100%;">
              <button class="btn btn-success" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--success); width: 100%; cursor: default; font-weight: 700;" disabled>
                ✓ Enrolled
              </button>
            </div>
          ` : `
            <div style="flex: 1; display: flex; justify-content: flex-end; width: 100%;">
              <button class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; background: var(--sidebar-active); width: 100%;" onclick="enrollCourse(${course.id})">
                Enroll Course
              </button>
            </div>
          `}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Quick play first lecture of a course
function openFirstLecture(courseId) {
  const lectures = courseLecturesMap[courseId] || [];
  if (lectures.length > 0) {
    const course = allCourses.find(c => c.id === courseId);
    playLecture(lectures[0].id, lectures[0].title, course.title, lectures[0].video_url);
  } else {
    alert("No video lectures uploaded for this course yet!");
  }
}

// Enroll in a course dynamically
window.enrollCourse = async function(courseId) {
  try {
    const res = await API.enrollInCourse(courseId);
    if (res.error) {
      alert('Enrollment failed: ' + res.error);
    } else {
      alert('Successfully enrolled in course!');
      await loadDashboardData();
    }
  } catch (err) {
    console.error('Error enrolling in course:', err);
  }
};

// Toggle status of a single lecture directly from row checkbox
async function toggleLectureStatus(lectureId) {
  const isCompleted = completedLectureIds.includes(lectureId);
  try {
    const res = await API.updateProgress(lectureId, isCompleted ? 0 : 1);
    if (res.success) {
      if (isCompleted) {
        completedLectureIds = completedLectureIds.filter(id => id !== lectureId);
      } else {
        completedLectureIds.push(lectureId);
      }
      // Re-render current UI state
      const homeBtn = document.querySelector(".sidebar-link[onclick*='home']");
      const journeyBtn = document.querySelector(".sidebar-link[onclick*='journey']");
      const coursesBtn = document.querySelector(".sidebar-link[onclick*='courses']");

      if (homeBtn && homeBtn.classList.contains('active')) renderHomeScreen();
      if (journeyBtn && journeyBtn.classList.contains('active')) renderJourneyScreen();
      if (coursesBtn && coursesBtn.classList.contains('active')) renderCoursesGrid();
    }
  } catch (err) {
    console.error('Error toggling progress:', err);
  }
}

/* ==========================================================================
   VIDEO PLAYER MODAL HANDLERS
   ========================================================================== */
function playLecture(lectureId, title, courseTitle, videoUrl) {
  activeModalLectureId = lectureId;
  const modal = document.getElementById('video-modal');
  const iframe = document.getElementById('video-iframe');
  const player = document.getElementById('video-player');
  const titleEl = document.getElementById('modal-lecture-title');
  const courseEl = document.getElementById('modal-lecture-course');
  const btnEl = document.getElementById('modal-complete-btn');

  if (!modal) return;

  titleEl.textContent = title;
  courseEl.textContent = `Course: ${courseTitle}`;
  
  // Detect if video is a local uploaded file path (starts with uploads/)
  const isLocalFile = videoUrl && videoUrl.startsWith('uploads/');

  // Reset custom controls inputs state
  const playPauseBtn = document.getElementById('custom-control-playpause');
  if (playPauseBtn) playPauseBtn.textContent = '⏸ Pause';
  const speedSelect = document.getElementById('custom-control-speed');
  if (speedSelect) speedSelect.value = '1.0';
  const qualitySelect = document.getElementById('custom-control-quality');
  if (qualitySelect) qualitySelect.value = 'auto';
  if (player) player.style.filter = 'none';

  const customControls = document.getElementById('custom-player-controls');

  if (isLocalFile) {
    if (customControls) customControls.style.display = 'flex';
    if (iframe) {
      iframe.style.display = 'none';
      iframe.src = '';
    }
    if (player) {
      player.style.display = 'block';
      player.src = videoUrl;
      
      // Reset listener to avoid closures leak
      player.ontimeupdate = null;
      
      // Trigger auto-completion if remaining duration is 30 seconds or less
      player.ontimeupdate = () => {
        if (player.duration) {
          const remaining = player.duration - player.currentTime;
          if (remaining <= 30 && !completedLectureIds.includes(lectureId)) {
            autoCompleteLecture(lectureId);
          }
        }
      };

      player.load();
      player.play().catch(e => console.log('Autoplay blocked:', e));
    }
  } else {
    if (customControls) customControls.style.display = 'none';
    if (player) {
      player.pause();
      player.style.display = 'none';
      player.src = '';
    }
    if (iframe) {
      iframe.style.display = 'block';
      iframe.src = `https://www.youtube.com/embed/${videoUrl}?autoplay=1&rel=0`;
    }
  }

  const isCompleted = completedLectureIds.includes(lectureId);
  btnEl.textContent = isCompleted ? 'Mark Incomplete' : 'Mark as Completed';
  btnEl.className = isCompleted ? 'btn btn-google' : 'btn btn-primary';

  modal.style.display = 'flex';
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  const iframe = document.getElementById('video-iframe');
  const player = document.getElementById('video-player');
  if (modal) modal.style.display = 'none';
  if (iframe) {
    iframe.src = ''; 
    iframe.style.display = 'none';
  }
  if (player) {
    player.pause();
    player.src = '';
    player.style.display = 'none';
  }
  activeModalLectureId = null;
}

async function toggleModalLectureComplete() {
  if (!activeModalLectureId) return;
  const lectureId = activeModalLectureId;
  const isCompleted = completedLectureIds.includes(lectureId);
  
  try {
    const res = await API.updateProgress(lectureId, isCompleted ? 0 : 1);
    if (res.success) {
      if (isCompleted) {
        completedLectureIds = completedLectureIds.filter(id => id !== lectureId);
      } else {
        completedLectureIds.push(lectureId);
      }
      
      // Update modal controls
      const btnEl = document.getElementById('modal-complete-btn');
      const nowCompleted = !isCompleted;
      btnEl.textContent = nowCompleted ? 'Mark Incomplete' : 'Mark as Completed';
      btnEl.className = nowCompleted ? 'btn btn-google' : 'btn btn-primary';

      // Refresh background tabs
      loadDashboardData();
    }
  } catch (err) {
    console.error('Error updating progress from modal:', err);
  }
}

/* ==========================================================================
   ADMINISTRATOR PORTAL LOGIC (admin.html)
   ========================================================================== */

// Load admin metric data tables
async function loadAdminData() {
  try {
    const data = await API.getTrackingData();
    if (data.error) return;

    // Render Student Analytics Table
    const progressBody = document.getElementById('student-progress-tbody');
    if (progressBody) {
      progressBody.innerHTML = '';
      if (data.studentProgress.length === 0) {
        progressBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No student progress records found.</td></tr>`;
      } else {
        data.studentProgress.forEach(row => {
          const pct = row.total_lectures > 0 ? Math.round((row.completed_lectures / row.total_lectures) * 100) : 0;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="font-weight: 600; color: var(--text-main);">${row.name}</td>
            <td>${row.email}</td>
            <td>${row.course_title}</td>
            <td style="font-weight: 600;">${row.completed_lectures} / ${row.total_lectures}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="course-progress-bar" style="width: 100px; flex-shrink: 0; margin-bottom: 0;">
                  <div class="course-progress-fill" style="width: ${pct}%; background-color: var(--primary);"></div>
                </div>
                <span style="font-weight: bold; font-size: 0.85rem;">${pct}%</span>
              </div>
            </td>
          `;
          progressBody.appendChild(tr);
        });
      }
    }

    // Render Session Audit Logs Table
    const logsBody = document.getElementById('login-logs-tbody');
    if (logsBody) {
      logsBody.innerHTML = '';
      if (data.loginLogs.length === 0) {
        logsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No active logins recorded.</td></tr>`;
      } else {
        data.loginLogs.forEach(row => {
          const formattedTime = new Date(row.login_time).toLocaleString();
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="font-weight: 600; color: var(--text-main);">${row.email}</td>
            <td>${formattedTime}</td>
            <td><code>${row.ip_address}</code></td>
            <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row.user_agent}">
              ${row.user_agent}
            </td>
          `;
          logsBody.appendChild(tr);
        });
      }
    }

  } catch (err) {
    console.error('Error fetching admin details:', err);
  }
}

// Populate admin course selectors
async function populateCourseSelects() {
  const select = document.getElementById('lecture-course-select');
  if (!select) return;

  try {
    const courses = await API.getCourses();
    select.innerHTML = '';
    
    if (courses.length === 0) {
      select.innerHTML = `<option value="">No courses created yet</option>`;
      loadAdminLecturesList('');
    } else {
      courses.forEach(course => {
        const opt = document.createElement('option');
        opt.value = course.id;
        opt.textContent = course.title;
        select.appendChild(opt);
      });
      // Load lectures of the first course by default
      loadAdminLecturesList(courses[0].id);
    }

    // Populate active courses list in collapsible Delete Batch panel
    const deleteBatchList = document.getElementById('delete-batch-courses');
    if (deleteBatchList) {
      deleteBatchList.innerHTML = '';
      if (courses.length === 0) {
        deleteBatchList.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">No active batches.</span>`;
      } else {
        courses.forEach(course => {
          const courseItem = document.createElement('div');
          courseItem.style.cssText = 'display: flex; flex-direction: column; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; width: 100%;';
          
          courseItem.innerHTML = `
            <!-- Course Title click toggle -->
            <div onclick="toggleSidebarCourseDetail(${course.id})" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 0.4rem 0.5rem; border-radius: var(--radius-sm); background: rgba(255,255,255,0.01); margin-bottom: 0.15rem; width: 100%;">
              <span style="font-weight: 700; font-size: 0.8rem; color: var(--text-main); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 140px;" title="${course.title}">${course.title}</span>
              <span id="course-arrow-${course.id}" style="font-size: 0.65rem; color: var(--text-muted);">▶</span>
            </div>
            
            <!-- Course Detail/Lecture Sublist (hidden by default) -->
            <div id="course-detail-${course.id}" style="display: none; flex-direction: column; gap: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); margin-top: 0.15rem; width: 100%;">
              <button onclick="deleteCourse(${course.id}, '${course.title.replace(/'/g, "\\'")}')" style="width: 100%; padding: 0.3rem 0.4rem; font-size: 0.75rem; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #f43f5e; border-radius: var(--radius-sm); cursor: pointer; font-weight: 700;">
                ❌ Delete Entire Batch
              </button>
              <div style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); margin-top: 0.15rem; text-transform: uppercase; letter-spacing: 0.05em; text-align: left;">
                Videos List:
              </div>
              <div id="course-lectures-sublist-${course.id}" style="display: flex; flex-direction: column; gap: 0.3rem; width: 100%;">
                <span style="font-size: 0.65rem; color: var(--text-muted); font-style: italic;">Loading videos...</span>
              </div>
            </div>
          `;
          deleteBatchList.appendChild(courseItem);
        });
      }
    }
  } catch (err) {
    console.error('Failed to populate course selects & delete list:', err);
  }
}

// Form submits handlers
async function handleCreateCourse(e) {
  e.preventDefault();
  const alertContainer = document.getElementById('admin-content-alerts');
  if (alertContainer) alertContainer.innerHTML = '';

  const title = document.getElementById('course-title').value;
  const category = document.getElementById('course-category').value;
  const description = document.getElementById('course-desc').value;
  const fileInput = document.getElementById('course-thumb-file');
  const file = fileInput ? fileInput.files[0] : null;

  if (!file) {
    showAdminAlert(alertContainer, 'error', 'Please choose a course thumbnail image file.');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('description', description);
  formData.append('thumbnail_file', file);

  try {
    const res = await API.createCourse(formData);
    if (res.error) {
      showAdminAlert(alertContainer, 'error', res.error);
    } else {
      showAdminAlert(alertContainer, 'success', 'Course created successfully!');
      e.target.reset();
      populateCourseSelects();
    }
  } catch (err) {
    showAdminAlert(alertContainer, 'error', 'Network failure.');
  }
}

async function handleUploadLecture(e) {
  e.preventDefault();
  const alertContainer = document.getElementById('admin-content-alerts');
  if (alertContainer) alertContainer.innerHTML = '';

  const courseId = document.getElementById('lecture-course-select').value;
  const title = document.getElementById('lecture-title').value;
  const order_index = document.getElementById('lecture-order').value;
  const fileInput = document.getElementById('lecture-video-file');
  const file = fileInput.files[0];

  if (!courseId) {
    showAdminAlert(alertContainer, 'error', 'Please select or create a course first.');
    return;
  }
  if (!file) {
    showAdminAlert(alertContainer, 'error', 'Please choose a recorded video file to upload.');
    return;
  }

  const progressWrapper = document.getElementById('upload-progress-wrapper');
  const progressFill = document.getElementById('upload-progress-fill');
  const progressPct = document.getElementById('upload-pct');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (progressWrapper) progressWrapper.style.display = 'block';
  if (submitBtn) submitBtn.disabled = true;

  const content_type = document.getElementById('lecture-type').value;
  const duration = document.getElementById('lecture-duration').value;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('order_index', order_index);
  formData.append('content_type', content_type);
  formData.append('duration', duration);
  formData.append('video_file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `/api/courses/${courseId}/lectures`, true);

  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      const pct = Math.round((event.loaded / event.total) * 100);
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';
    }
  };

  xhr.onload = function () {
    if (progressWrapper) progressWrapper.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
    if (progressFill) progressFill.style.width = '0%';
    if (progressPct) progressPct.textContent = '0%';

    try {
      const res = JSON.parse(xhr.responseText);
      if (res.error) {
        showAdminAlert(alertContainer, 'error', res.error);
      } else {
        showAdminAlert(alertContainer, 'success', 'Video lecture recorded and uploaded successfully!');
        e.target.reset();
        document.getElementById('lecture-course-select').value = courseId; // preserve selection
        loadAdminLecturesList(courseId);
      }
    } catch (err) {
      showAdminAlert(alertContainer, 'error', 'Failed to parse server response.');
    }
  };

  xhr.onerror = function () {
    if (progressWrapper) progressWrapper.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
    showAdminAlert(alertContainer, 'error', 'Video upload failed due to a network error.');
  };

  xhr.send(formData);
}

async function handleInviteFaculty(e) {
  e.preventDefault();
  const alertContainer = document.getElementById('admin-access-alerts');
  if (alertContainer) alertContainer.innerHTML = '';

  const name = document.getElementById('invite-name').value;
  const email = document.getElementById('invite-email').value;
  const password = document.getElementById('invite-password').value;
  const role = document.getElementById('invite-role').value;

  try {
    const res = await API.inviteFaculty(name, email, password, role);
    if (res.error) {
      showAdminAlert(alertContainer, 'error', res.error);
    } else {
      showAdminAlert(alertContainer, 'success', `Successfully granted ${role} access to ${email}!`);
      e.target.reset();
    }
  } catch (err) {
    showAdminAlert(alertContainer, 'error', 'Network failure.');
  }
}

function showAdminAlert(container, type, message) {
  if (!container) return;
  const alert = document.createElement('div');
  alert.className = `alert ${type === 'error' ? 'alert-danger' : 'alert-success'}`;
  alert.style.display = 'block';
  alert.style.marginBottom = '1.5rem';
  alert.textContent = message;
  container.appendChild(alert);
  
  // Auto clear after 4 seconds
  setTimeout(() => {
    alert.remove();
  }, 4000);
}

// Load detailed student tracking history
async function loadStudentHistoryData() {
  try {
    const data = await API.getStudentHistory();
    historyStudents = data.students || [];
    historyLogs = data.logs || [];
    historyProgress = data.progress || [];
    historyEnrollments = data.enrollments || [];
    
    renderHistoryStudentList();
  } catch (err) {
    console.error('Failed to load student history details:', err);
  }
}

// Render candidates list in left panel
function renderHistoryStudentList() {
  const container = document.getElementById('history-student-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (historyStudents.length === 0) {
    container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">No students registered yet.</span>`;
    return;
  }
  
  historyStudents.forEach(student => {
    const isSelected = selectedStudentId === student.id;
    const row = document.createElement('div');
    row.className = 'lecture-row';
    row.style.cssText = `
      padding: 0.85rem 1rem; 
      border-radius: var(--radius-sm); 
      margin-bottom: 0.35rem; 
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      border: 1px solid ${isSelected ? 'var(--primary)' : 'transparent'};
      background-color: ${isSelected ? 'var(--sidebar-hover)' : 'rgba(255, 255, 255, 0.01)'};
    `;
    
    row.innerHTML = `
      <span style="font-weight: 700; color: ${isSelected ? 'var(--primary)' : 'var(--text-main)'}; font-size: 0.95rem;">${student.name}</span>
      <span style="font-size: 0.75rem; color: var(--text-muted);">${student.email}</span>
    `;
    
    row.onclick = () => {
      selectedStudentId = student.id;
      renderHistoryStudentList(); // Refresh selected highlight border
      selectAuditStudent(student.id);
    };
    
    container.appendChild(row);
  });
}

// Display selected student audit logs details on the right
function selectAuditStudent(studentId) {
  const student = historyStudents.find(s => s.id === studentId);
  if (!student) return;
  
  const emptyState = document.getElementById('history-empty-state');
  const auditContent = document.getElementById('history-audit-content');
  
  if (emptyState) emptyState.style.display = 'none';
  if (auditContent) auditContent.style.display = 'flex';
  
  // Set details header
  const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('audit-student-avatar').textContent = initials;
  document.getElementById('audit-student-name').textContent = student.name;
  document.getElementById('audit-student-email').textContent = student.email;
  
  // Filter student-specific records
  const studentLogs = historyLogs.filter(l => l.user_id === studentId);
  const studentProgress = historyProgress.filter(p => p.user_id === studentId);
  const studentEnrollments = historyEnrollments.filter(e => e.user_id === studentId);
  
  // Set metric counts
  document.getElementById('audit-total-logins').textContent = studentLogs.length;
  document.getElementById('audit-total-completed').textContent = studentProgress.length;
  document.getElementById('audit-total-courses').textContent = studentEnrollments.length;
  
  // Render enrollment course badges
  const enrollmentContainer = document.getElementById('audit-enrollment-list');
  if (enrollmentContainer) {
    enrollmentContainer.innerHTML = '';
    if (studentEnrollments.length === 0) {
      enrollmentContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">No active enrollments yet.</span>`;
    } else {
      studentEnrollments.forEach(e => {
        const badge = document.createElement('span');
        badge.className = 'lecture-badge badge-yellow';
        badge.style.cssText = 'padding: 0.4rem 0.85rem; font-size: 0.8rem; border-radius: 9999px;';
        badge.textContent = e.course_title;
        enrollmentContainer.appendChild(badge);
      });
    }
  }
  
  // Render login logs table rows
  const loginBody = document.getElementById('audit-login-logs-body');
  if (loginBody) {
    loginBody.innerHTML = '';
    if (studentLogs.length === 0) {
      loginBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); font-style: italic;">No session history available.</td></tr>`;
    } else {
      studentLogs.forEach(log => {
        const dateStr = new Date(log.login_time).toLocaleString('en-US', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const browser = log.user_agent ? getSimplifiedUserAgent(log.user_agent) : 'Unknown';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${dateStr}</td>
          <td style="font-family: monospace;">${log.ip_address || '127.0.0.1'}</td>
          <td>${browser}</td>
        `;
        loginBody.appendChild(row);
      });
    }
  }
  
  // Render completed videos progress logs table rows
  const progressBody = document.getElementById('audit-progress-logs-body');
  if (progressBody) {
    progressBody.innerHTML = '';
    if (studentProgress.length === 0) {
      progressBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); font-style: italic;">No videos completed yet.</td></tr>`;
    } else {
      studentProgress.forEach(prog => {
        const dateStr = new Date(prog.updated_at).toLocaleString('en-US', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 700; color: var(--text-main);">${prog.course_title}</td>
          <td>${prog.lecture_title}</td>
          <td>${dateStr}</td>
        `;
        progressBody.appendChild(row);
      });
    }
  }
}

// Clean user-agent rendering helper
function getSimplifiedUserAgent(ua) {
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Safari';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Edge')) return 'Microsoft Edge';
  return 'Desktop Device';
}

// Delete a course dynamically
window.deleteCourse = async function(courseId, courseTitle) {
  const confirmed = confirm(`Are you sure you want to delete "${courseTitle}"? This will remove all associated lectures, progress, and student enrollments permanently.`);
  if (!confirmed) return;
  
  try {
    const res = await API.deleteCourse(courseId);
    if (res.error) {
      alert('Deletion failed: ' + res.error);
    } else {
      alert('Course deleted successfully!');
      if (window.location.pathname.includes('admin.html')) {
        await loadAdminDashboardData();
      } else {
        await loadDashboardData();
      }
    }
  } catch (err) {
    console.error('Error deleting course:', err);
  }
};

// Load list of video lectures uploaded to a course for deletion
async function loadAdminLecturesList(courseId) {
  const listContainer = document.getElementById('admin-lectures-list');
  if (!listContainer) return;
  if (!courseId) {
    listContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">Select a course to load lectures list.</span>`;
    return;
  }
  
  try {
    const lectures = await API.getLectures(courseId);
    listContainer.innerHTML = '';
    
    if (lectures.length === 0) {
      listContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">No lectures uploaded yet for this course.</span>`;
      return;
    }
    
    lectures.forEach(lec => {
      const row = document.createElement('div');
      row.className = 'lecture-row';
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--card-border); background-color: rgba(255, 255, 255, 0.01); width: 100%;';
      
      const typeBadge = (lec.content_type || 'Video Lecture').toUpperCase();
      
      row.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.2rem; overflow: hidden; flex: 1; text-align: left;">
          <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${lec.title}</span>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span class="lecture-badge badge-green" style="font-size: 0.65rem; padding: 0.15rem 0.4rem;">${typeBadge}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">⏱ ${lec.duration || '15 mins'}</span>
          </div>
        </div>
        <button class="btn btn-logout" onclick="deleteLecture(${lec.id}, '${lec.title.replace(/'/g, "\\'")}', ${courseId})" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; background: rgba(244, 63, 94, 0.15); border-radius: var(--radius-sm); border: none; cursor: pointer; color: #f43f5e; flex-shrink: 0;" title="Delete Video">
          Delete
        </button>
      `;
      listContainer.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load admin lectures list:', err);
  }
}

// Delete a particular video/lecture
window.deleteLecture = async function(lectureId, lectureTitle, courseId) {
  const confirmed = confirm(`Are you sure you want to delete lecture "${lectureTitle}"? This will remove completion logs for students permanently.`);
  if (!confirmed) return;
  
  try {
    const res = await API.deleteLecture(lectureId);
    if (res.error) {
      alert('Deletion failed: ' + res.error);
    } else {
      alert('Lecture deleted successfully!');
      
      // Refresh the detail panel in the sidebar for that course
      const detailPanel = document.getElementById(`course-detail-${courseId}`);
      if (detailPanel) {
        // Toggle twice to reload lectures dynamically!
        detailPanel.style.display = 'none';
        toggleSidebarCourseDetail(courseId);
      }
      
      // Also reload the main admin lectures list if it exists and matches
      const mainSelect = document.getElementById('lecture-course-select');
      if (mainSelect && parseInt(mainSelect.value) === courseId) {
        await loadAdminLecturesList(courseId);
      }
    }
  } catch (err) {
    console.error('Error deleting lecture:', err);
  }
};

// Toggle course details inside the collapsible Delete Batch sidebar
window.toggleSidebarCourseDetail = async function(courseId) {
  const detailPanel = document.getElementById(`course-detail-${courseId}`);
  const arrow = document.getElementById(`course-arrow-${courseId}`);
  if (!detailPanel) return;
  
  if (detailPanel.style.display === 'none') {
    detailPanel.style.display = 'flex';
    if (arrow) arrow.textContent = '▼';
    
    // Fetch lectures for this course and render them
    const sublist = document.getElementById(`course-lectures-sublist-${courseId}`);
    if (sublist) {
      try {
        const lectures = await API.getLectures(courseId);
        sublist.innerHTML = '';
        if (lectures.length === 0) {
          sublist.innerHTML = `<span style="font-size: 0.65rem; color: var(--text-muted); font-style: italic;">No videos uploaded.</span>`;
          return;
        }
        lectures.forEach(lec => {
          const lecRow = document.createElement('div');
          lecRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 0.35rem; width: 100%; background: rgba(255,255,255,0.01); padding: 0.25rem 0.4rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.02);';
          
          lecRow.innerHTML = `
            <span style="font-size: 0.7rem; color: var(--text-main); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 100px; text-align: left;" title="${lec.title}">${lec.title}</span>
            <button onclick="deleteLecture(${lec.id}, '${lec.title.replace(/'/g, "\\'")}', ${courseId})" style="background: transparent; border: none; cursor: pointer; color: #f43f5e; font-size: 0.75rem; padding: 0.1rem 0.25rem; font-weight: 700; flex-shrink: 0;" title="Delete Video">
              🗑
            </button>
          `;
          sublist.appendChild(lecRow);
        });
      } catch (err) {
        sublist.innerHTML = `<span style="font-size: 0.65rem; color: var(--text-muted);">Error loading.</span>`;
      }
    }
  } else {
    detailPanel.style.display = 'none';
    if (arrow) arrow.textContent = '▶';
  }
};

// Auto mark video lecture as completed when 30 seconds or less remain
async function autoCompleteLecture(lectureId) {
  if (completedLectureIds.includes(lectureId)) return;
  
  // Locally mark complete
  completedLectureIds.push(lectureId);
  
  try {
    const res = await API.updateProgress(lectureId, 1);
    if (res.success) {
      // Re-render student timelines to show checkmark instantly
      const homeBtn = document.querySelector(".sidebar-link[onclick*='home']");
      const journeyBtn = document.querySelector(".sidebar-link[onclick*='journey']");
      
      if (homeBtn && homeBtn.classList.contains('active')) renderHomeScreen();
      if (journeyBtn && journeyBtn.classList.contains('active')) renderJourneyScreen();
      
      // Update modal complete/incomplete button
      if (activeModalLectureId === lectureId) {
        const btnEl = document.getElementById('modal-complete-btn');
        if (btnEl) {
          btnEl.textContent = 'Mark Incomplete';
          btnEl.className = 'btn btn-google';
        }
      }
    }
  } catch (err) {
    console.error('Failed to auto complete lecture:', err);
  }
}

// Seek playback forward or backward by specific seconds
window.seekVideo = function(seconds) {
  const player = document.getElementById('video-player');
  if (player) {
    player.currentTime = Math.max(0, Math.min(player.duration || 0, player.currentTime + seconds));
  }
};

// Play or Pause the native video player dynamically
window.togglePlayPause = function() {
  const player = document.getElementById('video-player');
  const btn = document.getElementById('custom-control-playpause');
  if (player && btn) {
    if (player.paused) {
      player.play().catch(e => console.log(e));
      btn.textContent = '⏸ Pause';
    } else {
      player.pause();
      btn.textContent = '▶ Play';
    }
  }
};

// Adjust playback speed rate
window.changePlaybackSpeed = function(val) {
  const player = document.getElementById('video-player');
  if (player) {
    player.playbackRate = parseFloat(val);
  }
};

// Adjust visual video quality using contrast/blur filters
window.changeVideoQuality = function(val) {
  const player = document.getElementById('video-player');
  if (!player) return;
  if (val === '1080') {
    player.style.filter = 'none';
  } else if (val === '720') {
    player.style.filter = 'contrast(1.02)';
  } else if (val === '480') {
    player.style.filter = 'blur(0.6px) contrast(0.97)';
  } else {
    player.style.filter = 'none';
  }
  console.log(`Resolution changed to: ${val === 'auto' ? 'Auto' : val + 'p'}`);
};
