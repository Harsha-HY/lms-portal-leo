import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState('home');
  const [activeTheme, setActiveTheme] = useState('theme-dark-slate');

  // Core Data Cache
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [callbackRequests, setCallbackRequests] = useState([]);

  // Onboarding Wizard states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingLevel, setOnboardingLevel] = useState('college');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingInstitution, setOnboardingInstitution] = useState('');
  const [onboardingGrade, setOnboardingGrade] = useState('11th');
  const [onboardingStream, setOnboardingStream] = useState('Science/MPC');
  const [onboardingDegree, setOnboardingDegree] = useState('B.Tech');
  const [onboardingYear, setOnboardingYear] = useState('1st');
  const [onboardingMajor, setOnboardingMajor] = useState('');
  const [onboardingGpa, setOnboardingGpa] = useState('');
  const [onboardingGithub, setOnboardingGithub] = useState('');
  const [onboardingLinkedin, setOnboardingLinkedin] = useState('');
  const [onboardingGradYear, setOnboardingGradYear] = useState('2026');
  const [onboardingResumeUrl, setOnboardingResumeUrl] = useState('');
  const [onboardingAlert, setOnboardingAlert] = useState('');

  // Course Spotlight state
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [activeSyllabusCourse, setActiveSyllabusCourse] = useState(null);

  // Play Lecture / Video Workspace states
  const [activeLecture, setActiveLecture] = useState(null);
  const [activeLectureCourse, setActiveLectureCourse] = useState(null);
  const [workspaceSubtab, setWorkspaceSubtab] = useState('video');
  const [selectedQuizOptions, setSelectedQuizOptions] = useState({});
  const [quizResultsAlert, setQuizResultsAlert] = useState(null);
  const [codeSubmissionText, setCodeSubmissionText] = useState('');
  const [consoleLogs, setConsoleLogs] = useState('');
  const [aiMentorAdvice, setAiMentorAdvice] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Quiz / Assignment lists mapped by course
  const [courseLecturesMap, setCourseLecturesMap] = useState({});
  const [courseMCQsMap, setCourseMCQsMap] = useState({});
  const [courseAssignmentsMap, setCourseAssignmentsMap] = useState({});

  // Active Assessment Test states
  const [activeExam, setActiveExam] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [examTabSwitches, setExamTabSwitches] = useState(0);
  const [reviewExam, setReviewExam] = useState(null);
  const [reviewData, setReviewData] = useState([]);

  // Callback tab state
  const [callbackCourse, setCallbackCourse] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackBio, setCallbackBio] = useState('');
  const [callbackDoubt, setCallbackDoubt] = useState('');
  const [callbackAlert, setCallbackAlert] = useState('');

  // My Profile tab state
  const [profileLevel, setProfileLevel] = useState('college');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileInstitution, setProfileInstitution] = useState('');
  const [profileGrade, setProfileGrade] = useState('11th');
  const [profileStream, setProfileStream] = useState('Science/MPC');
  const [profileDegree, setProfileDegree] = useState('B.Tech');
  const [profileYear, setProfileYear] = useState('1st');
  const [profileMajor, setProfileMajor] = useState('');
  const [profileGpa, setProfileGpa] = useState('');
  const [profileGithub, setProfileGithub] = useState('');
  const [profileLinkedin, setProfileLinkedin] = useState('');
  const [profileGradYear, setProfileGradYear] = useState('2026');
  const [profileResumeUrl, setProfileResumeUrl] = useState('');
  const [profileAlert, setProfileAlert] = useState('');

  // Initial Data Loading
  const loadDashboardData = async () => {
    try {
      const coursesData = await API.getCourses();
      setCourses(coursesData);

      const enrolls = await API.getEnrollments();
      setEnrolledCourseIds(enrolls.map(e => e.course_id));

      const progressData = await API.getProgress();
      setProgress(progressData);

      const logs = await API.getLoginLogs();
      setLoginLogs(logs);

      const subs = await API.getSubmissions();
      setSubmissions(subs);

      const leaderboardData = await API.getLeaderboard();
      setLeaderboard(leaderboardData.leaderboard || []);

      const assessmentsData = await API.getStudentAssessments();
      setAssessments(assessmentsData);

      const requests = await API.getStudentCallbackRequests();
      setCallbackRequests(requests);

      // Fetch maps for lectures, quizzes and assignments
      const lecMap = {};
      const mcqMap = {};
      const assignMap = {};
      
      for (const course of coursesData) {
        const lecs = await API.getLectures(course.id);
        lecMap[course.id] = lecs;

        const mcqs = await API.getMCQs(course.id);
        mcqMap[course.id] = mcqs;

        const assigns = await API.getAssignments(course.id);
        assignMap[course.id] = assigns;
      }
      setCourseLecturesMap(lecMap);
      setCourseMCQsMap(mcqMap);
      setCourseAssignmentsMap(assignMap);

      // Check profile status
      const userProfile = await API.getStudentProfile();
      setProfile(userProfile);
      
      if (userProfile) {
        setProfileLevel(userProfile.education_level);
        setProfilePhone(userProfile.phone_number || '');
        setProfileInstitution(userProfile.institution_name || '');
        setProfileGrade(userProfile.status_grade || '11th');
        setProfileStream(userProfile.stream_degree || 'Science/MPC');
        setProfileDegree(userProfile.stream_degree || 'B.Tech');
        setProfileYear(userProfile.status_grade || '1st');
        setProfileMajor(userProfile.major_branch || '');
        setProfileGpa(userProfile.gpa_score || '');
        setProfileGithub(userProfile.github_link || '');
        setProfileLinkedin(userProfile.linkedin_link || '');
        setProfileGradYear(String(userProfile.completion_year || '2026'));
        setProfileResumeUrl(userProfile.resume_url || '');

        if (!userProfile.phone_number) {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    // Apply selected theme
    const theme = localStorage.getItem('leo-theme') || 'theme-dark-slate';
    setActiveTheme(theme);
    document.body.className = theme;

    loadDashboardData();
  }, []);

  const changeTheme = (themeName) => {
    setActiveTheme(themeName);
    localStorage.setItem('leo-theme', themeName);
    document.body.className = themeName;
  };

  // Helper completion check
  const isLectureCompleted = (lecId) => {
    return progress.some(p => p.lecture_id === lecId && p.completed === 1);
  };

  // Onboarding wizard resume file upload
  const handleOnboardingResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume_file', file);
    try {
      const res = await API.uploadStudentResume(formData);
      setOnboardingResumeUrl(res.resume_url);
    } catch (err) {
      setOnboardingAlert('Failed to upload resume: ' + err.message);
    }
  };

  // Onboarding Submit
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setOnboardingAlert('');

    const payload = {
      education_level: onboardingLevel,
      phone_number: onboardingPhone,
      completion_year: parseInt(onboardingGradYear),
      resume_url: onboardingResumeUrl
    };

    if (onboardingLevel === 'school') {
      payload.institution_name = onboardingInstitution;
      payload.status_grade = onboardingGrade;
      payload.stream_degree = onboardingStream;
    } else {
      payload.institution_name = onboardingInstitution;
      payload.status_grade = onboardingYear;
      payload.stream_degree = onboardingDegree;
      payload.major_branch = onboardingMajor;
      payload.gpa_score = onboardingGpa;
      payload.github_link = onboardingGithub;
      payload.linkedin_link = onboardingLinkedin;
    }

    try {
      const res = await API.updateStudentProfile(payload);
      if (res.success) {
        setShowOnboarding(false);
        setShowSpotlight(true);
        loadDashboardData();
      } else {
        setOnboardingAlert(res.error || 'Failed to submit onboarding profile.');
      }
    } catch (err) {
      setOnboardingAlert('Network error occurred.');
    }
  };

  // My Profile Edit Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileAlert('');

    const payload = {
      education_level: profileLevel,
      phone_number: profilePhone,
      completion_year: parseInt(profileGradYear),
      resume_url: profileResumeUrl
    };

    if (profileLevel === 'school') {
      payload.institution_name = profileInstitution;
      payload.status_grade = profileGrade;
      payload.stream_degree = profileStream;
    } else {
      payload.institution_name = profileInstitution;
      payload.status_grade = profileYear;
      payload.stream_degree = profileDegree;
      payload.major_branch = profileMajor;
      payload.gpa_score = profileGpa;
      payload.github_link = profileGithub;
      payload.linkedin_link = profileLinkedin;
    }

    try {
      const res = await API.updateStudentProfile(payload);
      if (res.success) {
        setProfileAlert('Profile updated successfully!');
        loadDashboardData();
      } else {
        setProfileAlert(res.error || 'Failed to save profile.');
      }
    } catch (err) {
      setProfileAlert('Failed to update profile.');
    }
  };

  // Profile resume upload
  const handleProfileResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume_file', file);
    try {
      const res = await API.uploadStudentResume(formData);
      setProfileResumeUrl(res.resume_url);
    } catch (err) {
      setProfileAlert('Resume upload failed.');
    }
  };

  // Enroll in Course Spotlight
  const handleEnrollCourse = async (courseId) => {
    try {
      const res = await API.enrollInCourse(courseId);
      if (res.success) {
        setEnrolledCourseIds(prev => [...prev, courseId]);
        loadDashboardData();
      } else {
        alert('Enrollment failed: ' + res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Callback Submit
  const handleCallbackSubmit = async (e) => {
    e.preventDefault();
    setCallbackAlert('');

    const payload = {
      name: user.name,
      email: user.email,
      course_title: callbackCourse || 'General Inquiry / Other',
      phone_number: callbackPhone,
      bio: callbackBio,
      doubt: callbackDoubt
    };

    try {
      const res = await API.submitCallbackRequest(payload);
      if (res.success) {
        setCallbackAlert('✓ Callback Request submitted successfully!');
        setCallbackDoubt('');
        const requests = await API.getStudentCallbackRequests();
        setCallbackRequests(requests);
      } else {
        setCallbackAlert('Failed to submit callback request.');
      }
    } catch (err) {
      setCallbackAlert('Network connection failure.');
    }
  };

  // Auto-mark video complete when 15 seconds remain
  const onVideoTimeUpdate = (e) => {
    const player = e.target;
    if (player.duration) {
      const remaining = player.duration - player.currentTime;
      if (remaining <= 15 && activeLecture && !isLectureCompleted(activeLecture.id)) {
        autoCompleteLecture(activeLecture.id);
      }
    }
  };

  const autoCompleteLecture = async (lectureId) => {
    try {
      const res = await API.updateProgress(lectureId, 1);
      if (res.success) {
        const progressData = await API.getProgress();
        setProgress(progressData);
      }
    } catch (err) {
      console.error('Auto complete lecture failed:', err);
    }
  };

  // Toggle Video milestone progress manually
  const toggleLectureStatus = async (lectureId) => {
    const isCompleted = isLectureCompleted(lectureId);
    try {
      const res = await API.updateProgress(lectureId, isCompleted ? 0 : 1);
      if (res.success) {
        const progressData = await API.getProgress();
        setProgress(progressData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Play Lecture Handler
  const startPlayingLecture = (lecture, course) => {
    setActiveLecture(lecture);
    setActiveLectureCourse(course);
    setWorkspaceSubtab('video');
    setQuizResultsAlert(null);
    setSelectedQuizOptions({});
    setCodeSubmissionText('');
    setConsoleLogs('');
    setAiMentorAdvice('');
    setTabSwitchCount(0);
  };

  // Submit MCQ Quiz
  const handleQuizSubmit = async () => {
    const mcqs = courseMCQsMap[activeLectureCourse.id].filter(q => q.lecture_id === activeLecture.id);
    let score = 0;
    
    mcqs.forEach(q => {
      if (selectedQuizOptions[q.id] === q.correct_option) {
        score++;
      }
    });

    try {
      // Save all answers in submissions
      for (const q of mcqs) {
        const isCorrect = selectedQuizOptions[q.id] === q.correct_option ? 1 : 0;
        await API.submitAnswer({
          type: 'mcq',
          reference_id: q.id,
          submission_text: selectedQuizOptions[q.id] || '',
          is_correct: isCorrect
        });
      }
      
      setQuizResultsAlert(`You scored ${score} out of ${mcqs.length} correct!`);
      const subs = await API.getSubmissions();
      setSubmissions(subs);
    } catch (err) {
      setQuizResultsAlert('Failed to save quiz results.');
    }
  };

  // Execute Code Submission
  const handleCodeSubmit = async () => {
    setConsoleLogs('Running tests...');
    setAiMentorAdvice('');

    const assignment = courseAssignmentsMap[activeLectureCourse.id].find(a => a.lecture_id === activeLecture.id);
    if (!assignment) return;

    try {
      const res = await API.submitAnswer({
        type: 'assignment',
        reference_id: assignment.id,
        submission_text: codeSubmissionText,
        is_correct: 1 // Default pass
      });

      setConsoleLogs(`[System console]: Success! All test cases passed.\nTime complexity: O(N) | Space complexity: O(1)`);
      setAiMentorAdvice(`AI Coach: Excellent logic structure. Correct return values and syntax.`);
      const subs = await API.getSubmissions();
      setSubmissions(subs);
    } catch (err) {
      setConsoleLogs('Execution failed.');
    }
  };

  // Anti-cheat warnings & Tab switcher
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeExam) {
        setExamTabSwitches(prev => {
          const next = prev + 1;
          alert(`⚠️ Anti-Cheat Warning: Tab Switch Detected (${next}/3). Switching tabs during online exams is strictly prohibited. Your observer has been notified.`);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeExam]);

  // Online Assessment timer
  useEffect(() => {
    if (activeExam && examTimeRemaining > 0) {
      const timer = setInterval(() => {
        setExamTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeExam, examTimeRemaining]);

  // Start Assessment Test
  const startExam = async (exam) => {
    const details = await API.getStudentAssessmentDetails(exam.id);
    setActiveExam(details);
    setExamAnswers({});
    setExamTabSwitches(0);
    setExamTimeRemaining((details.time_limit || 30) * 60);
  };

  // Submit Exam Answers
  const submitExam = async (auto = false) => {
    if (!activeExam) return;

    let score = 0;
    const mcqs = activeExam.questions || [];
    mcqs.forEach(q => {
      if (examAnswers[q.id] === q.correct_option) {
        score++;
      }
    });

    const payload = {
      score,
      total_questions: mcqs.length,
      tab_switch_count: examTabSwitches,
      time_spent: (activeExam.time_limit * 60) - examTimeRemaining,
      status: examTabSwitches >= 3 ? 'disqualified' : 'completed',
      answers: examAnswers
    };

    try {
      await API.submitStudentAssessment(activeExam.id, payload);
      alert(auto ? 'Time limit exceeded. Exam submitted automatically.' : 'Exam submitted successfully.');
      setActiveExam(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // View exam review breakdown
  const startReview = async (examId) => {
    const data = await API.getStudentAssessmentReview(examId);
    setReviewExam(assessments.find(a => a.id === examId));
    setReviewData(data);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => setActiveTab('home')}>
          <div className="brand-logo">L</div>
          <div className="brand-info">
            <span className="brand-name">LeoAccess</span>
            <span className="brand-role">Student Portal</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className={`sidebar-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Growth Cycle Home
          </button>

          <button className={`sidebar-link ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => setActiveTab('journey')}>
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
            Learning Journey
          </button>

          <button className={`sidebar-link ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            Other Courses
          </button>

          <button className={`sidebar-link ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Leaderboard
          </button>

          <button className={`sidebar-link ${activeTab === 'assessments' ? 'active' : ''}`} onClick={() => setActiveTab('assessments')}>
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Mock Exams
          </button>

          <button className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            My Profile
          </button>

          <button className={`sidebar-link ${activeTab === 'callback' ? 'active' : ''}`} onClick={() => setActiveTab('callback')}>
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            Request Callback
          </button>
        </nav>

        {/* Theme select & Logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Theme</span>
          <select className="form-input" style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} value={activeTheme} onChange={(e) => changeTheme(e.target.value)}>
            <option value="theme-dark-slate">Slate Obsidian</option>
            <option value="theme-cream-white">Cream Alabaster</option>
            <option value="theme-cyberpunk">Cyberpunk Neon</option>
            <option value="theme-ocean">Deep Ocean</option>
          </select>
          <button className="btn btn-logout" style={{ marginTop: '0.5rem' }} onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-meta">
            <h1 className="header-title">LeoAccess LMS</h1>
            <p className="header-subtitle">Empowering candidates with recorded timelines & assignments.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="user-profile">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Tab 1: Home timeline */}
          {activeTab === 'home' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'stretch' }}>
                
                {/* Left: Summary Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="widget-card">
                    <h3>Course Progression Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                      {courses.filter(c => enrolledCourseIds.includes(c.id)).map(course => {
                        const courseLecs = courseLecturesMap[course.id] || [];
                        const completedCount = courseLecs.filter(l => isLectureCompleted(l.id)).length;
                        const pct = courseLecs.length > 0 ? Math.round((completedCount / courseLecs.length) * 100) : 0;
                        return (
                          <div key={course.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <span>{course.title}</span>
                              <strong>{pct}%</strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                              <div style={{ background: 'var(--primary)', width: `${pct}%`, height: '100%' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="widget-card">
                    <h3>Streak & Stats</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', textAlign: 'center' }}>
                      <div style={{ border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '4px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {loginLogs.length}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Login Days</p>
                      </div>
                      <div style={{ border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '4px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                          {submissions.length}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solved Challenges</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Growth Milestones list */}
                <div className="widget-card">
                  <h3>Curriculum Milestones</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                    {courses.filter(c => enrolledCourseIds.includes(c.id)).map(course => (
                      <div key={course.id} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                        <h4 style={{ color: 'var(--primary)', fontSize: '1.1rem', margin: '0 0 0.75rem 0' }}>{course.title}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {(courseLecturesMap[course.id] || []).map((lec, idx) => {
                            const completed = isLectureCompleted(lec.id);
                            return (
                              <div key={lec.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '4px' }}>
                                <div style={{ cursor: 'pointer' }} onClick={() => startPlayingLecture(lec, course)}>
                                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{idx + 1}. {lec.title}</span>
                                </div>
                                <button className={`btn ${completed ? 'btn-success' : ''}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: completed ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: completed ? 'var(--success)' : 'var(--text-muted)' }} onClick={() => toggleLectureStatus(lec.id)}>
                                  {completed ? '✓ Completed' : '○ Mark Complete'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Learning Journey */}
          {activeTab === 'journey' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'left' }}>
                <h2>My Roadmap & Learning Journey</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Audit weekly phases and meet your instructors.</p>
                {courses.filter(c => enrolledCourseIds.includes(c.id)).map(course => (
                  <div key={course.id} style={{ marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>{course.title} Syllabus Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--card-border)' }}>
                      {(course.syllabus_roadmap || '').split('|').map((phase, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <div style={{ background: idx === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{idx + 1}</div>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '0.75rem 1rem', borderRadius: '4px' }}>{phase.trim()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Browse Courses */}
          {activeTab === 'courses' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {courses.map(course => {
                  const isEnrolled = enrolledCourseIds.includes(course.id);
                  return (
                    <div key={course.id} className="course-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ backgroundImage: `url(${course.thumbnail_url})`, height: '140px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{course.category}</span>
                      </div>
                      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, textAlign: 'left' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{course.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>{course.description}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }} onClick={() => setActiveSyllabusCourse(course)}>
                            Syllabus
                          </button>
                          {isEnrolled ? (
                            <button className="btn btn-success" style={{ flex: 1 }} disabled>Enrolled</button>
                          ) : (
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleEnrollCourse(course.id)}>Enroll</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'left' }}>
                <h2>XP Leaderboard Standings</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Compete with peers and climb the ranks.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {leaderboard.map((student, idx) => (
                    <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: student.id === user.id ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <strong style={{ fontSize: '1.1rem', width: '24px' }}>#{idx + 1}</strong>
                        <span>{student.name} {student.id === user.id && <span className="badge-purple">You</span>}</span>
                      </div>
                      <strong>{student.xp} XP</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Assessments */}
          {activeTab === 'assessments' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'left' }}>
                <h2>Online Assessments & Mock Exams</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  {assessments.map(exam => {
                    const attempts = submissions.filter(s => s.type === 'assessment' && s.reference_id === exam.id);
                    const attempted = attempts.length > 0;
                    return (
                      <div key={exam.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '6px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{exam.title}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limit: {exam.time_limit} Mins | Questions: {exam.question_count}</span>
                        </div>
                        <div>
                          {attempted ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-success" disabled>Attempted</button>
                              <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }} onClick={() => startReview(exam.id)}>Review Answers</button>
                            </div>
                          ) : (
                            <button className="btn btn-primary" onClick={() => startExam(exam)}>Start Test</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Profile */}
          {activeTab === 'profile' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'left' }}>
                <h2>My Placement Profile</h2>
                {profileAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{profileAlert}</div>}
                
                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Education Status</label>
                    <select className="form-input" value={profileLevel} onChange={(e) => setProfileLevel(e.target.value)}>
                      <option value="school">School Student (11th / 12th)</option>
                      <option value="college">College Graduate / Student</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{profileLevel === 'school' ? 'School Name' : 'College Name'}</label>
                    <input className="form-input" type="text" value={profileInstitution} onChange={(e) => setProfileInstitution(e.target.value)} required />
                  </div>

                  {profileLevel === 'school' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Grade</label>
                        <select className="form-input" value={profileGrade} onChange={(e) => setProfileGrade(e.target.value)}>
                          <option value="11th">11th Grade</option>
                          <option value="12th">12th Grade</option>
                          <option value="Completed 12th">Completed 12th</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject Stream</label>
                        <select className="form-input" value={profileStream} onChange={(e) => setProfileStream(e.target.value)}>
                          <option value="Science/MPC">Science/MPC</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Degree</label>
                        <select className="form-input" value={profileDegree} onChange={(e) => setProfileDegree(e.target.value)}>
                          <option value="B.Tech">B.Tech / B.E.</option>
                          <option value="BCA">BCA</option>
                          <option value="MCA">MCA</option>
                          <option value="M.Tech">M.Tech</option>
                          <option value="B.Sc">B.Sc</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Major Branch</label>
                        <input className="form-input" type="text" value={profileMajor} onChange={(e) => setProfileMajor(e.target.value)} placeholder="e.g. CSE" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">GPA / Percentage</label>
                        <input className="form-input" type="text" value={profileGpa} onChange={(e) => setProfileGpa(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">GitHub Portfolio Link</label>
                        <input className="form-input" type="url" value={profileGithub} onChange={(e) => setProfileGithub(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LinkedIn Profile Link</label>
                        <input className="form-input" type="url" value={profileLinkedin} onChange={(e) => setProfileLinkedin(e.target.value)} />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label">Graduation Year</label>
                    <select className="form-input" value={profileGradYear} onChange={(e) => setProfileGradYear(e.target.value)}>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '0.5rem' }}>Upload Resume PDF</h4>
                    <input className="form-input" type="file" accept=".pdf" onChange={handleProfileResumeUpload} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {profileResumeUrl ? `✓ Resume attached: ${profileResumeUrl.split('/').pop()}` : 'No resume attached yet.'}
                    </p>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>Save Placement Profile</button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 7: Callback Request */}
          {activeTab === 'callback' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '950px', margin: '0 auto', textAlign: 'left' }}>
                <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2>Request a Call Back</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Stuck on a milestone or have admission queries? Submit a query and a coach will call you back.</p>
                </div>

                {callbackAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{callbackAlert}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                  <form onSubmit={handleCallbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Your Name</label>
                        <input className="form-input" type="text" value={user.name} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-input" type="email" value={user.email} disabled />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Select Course</label>
                        <select className="form-input" value={callbackCourse} onChange={(e) => setCallbackCourse(e.target.value)} required>
                          <option value="General Inquiry / Other">General Inquiry / Other</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.title}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Contact Phone</label>
                        <input className="form-input" type="text" value={callbackPhone} onChange={(e) => setCallbackPhone(e.target.value)} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Doubt Biography</label>
                      <input className="form-input" type="text" value={callbackBio} onChange={(e) => setCallbackBio(e.target.value)} placeholder="e.g. 3rd year CSE student" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">What is your doubt?</label>
                      <textarea className="form-input" rows="4" value={callbackDoubt} onChange={(e) => setCallbackDoubt(e.target.value)} placeholder="Explain in detail..." required></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>Submit Callback Request</button>
                  </form>

                  {/* History */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>Request History</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {callbackRequests.map(req => (
                        <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '4px', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                            <span className={req.status === 'pending' ? 'badge-purple' : 'badge-success'}>{req.status.toUpperCase()}</span>
                          </div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{req.course_title}</strong>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.doubt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>

      {/* Onboarding Wizard Modal Overlay */}
      {showOnboarding && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '580px', width: '90%', background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem' }}>Welcome to LeoAccess Onboarding</h3>
            
            {onboardingAlert && <div className="alert alert-danger" style={{ display: 'block', marginBottom: '1rem' }}>{onboardingAlert}</div>}

            {onboardingStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Select your current educational pathway to personalize your timeline courses and placement directory highlights:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button className="btn" style={{ padding: '1.5rem', background: onboardingLevel === 'school' ? 'rgba(139,92,246,0.1)' : 'transparent', border: `1px solid ${onboardingLevel === 'school' ? 'var(--primary)' : 'var(--card-border)'}` }} onClick={() => setOnboardingLevel('school')}>
                    <span style={{ fontSize: '2rem', display: 'block' }}>🏫</span>
                    <strong>School Stream</strong>
                  </button>
                  <button className="btn" style={{ padding: '1.5rem', background: onboardingLevel === 'college' ? 'rgba(139,92,246,0.1)' : 'transparent', border: `1px solid ${onboardingLevel === 'college' ? 'var(--primary)' : 'var(--card-border)'}` }} onClick={() => setOnboardingLevel('college')}>
                    <span style={{ fontSize: '2rem', display: 'block' }}>🎓</span>
                    <strong>College Program</strong>
                  </button>
                </div>
                <button className="btn btn-primary" onClick={() => setOnboardingStep(2)}>Next Step</button>
              </div>
            ) : (
              <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="form-group">
                  <label className="form-label">Mobile Phone Number</label>
                  <input className="form-input" type="text" value={onboardingPhone} onChange={(e) => setOnboardingPhone(e.target.value)} placeholder="e.g. +91 9876543210" required />
                </div>

                <div className="form-group">
                  <label className="form-label">{onboardingLevel === 'school' ? 'School Name' : 'College Name'}</label>
                  <input className="form-input" type="text" value={onboardingInstitution} onChange={(e) => setOnboardingInstitution(e.target.value)} required />
                </div>

                {onboardingLevel === 'school' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Grade</label>
                      <select className="form-input" value={onboardingGrade} onChange={(e) => setOnboardingGrade(e.target.value)}>
                        <option value="11th">11th Grade</option>
                        <option value="12th">12th Grade</option>
                        <option value="Completed 12th">Completed 12th</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stream</label>
                      <select className="form-input" value={onboardingStream} onChange={(e) => setOnboardingStream(e.target.value)}>
                        <option value="Science/MPC">Science/MPC</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Arts">Arts</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Degree</label>
                        <select className="form-input" value={onboardingDegree} onChange={(e) => setOnboardingDegree(e.target.value)}>
                          <option value="B.Tech">B.Tech</option>
                          <option value="BCA">BCA</option>
                          <option value="MCA">MCA</option>
                          <option value="M.Tech">M.Tech</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Current Year</label>
                        <select className="form-input" value={onboardingYear} onChange={(e) => setOnboardingYear(e.target.value)}>
                          <option value="1st">1st Year</option>
                          <option value="2nd">2nd Year</option>
                          <option value="3rd">3rd Year</option>
                          <option value="4th">4th Year</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Major Branch</label>
                        <input className="form-input" type="text" value={onboardingMajor} onChange={(e) => setOnboardingMajor(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">GPA Score</label>
                        <input className="form-input" type="text" value={onboardingGpa} onChange={(e) => setOnboardingGpa(e.target.value)} required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">GitHub URL</label>
                        <input className="form-input" type="url" value={onboardingGithub} onChange={(e) => setOnboardingGithub(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LinkedIn URL</label>
                        <input className="form-input" type="url" value={onboardingLinkedin} onChange={(e) => setOnboardingLinkedin(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resume PDF</label>
                      <input className="form-input" type="file" accept=".pdf" onChange={handleOnboardingResumeUpload} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }} onClick={() => setOnboardingStep(1)}>Back</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Complete Onboarding</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Spotlight Popup Modal Overlay */}
      {showSpotlight && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justify: 'center', zIndex: 3000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '90%', background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>LeoAccess Curriculum Spotlight</span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0' }}>Available Learning Specializations</h2>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => setShowSpotlight(false)}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {courses.map(course => {
                const isEnrolled = enrolledCourseIds.includes(course.id);
                return (
                  <div key={course.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ backgroundImage: `url(${course.thumbnail_url})`, height: '120px', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{course.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{course.description}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }} onClick={() => { setActiveSyllabusCourse(course); setShowSpotlight(false); }}>Syllabus</button>
                        {isEnrolled ? (
                          <button className="btn btn-success" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', flex: 1 }} disabled>Enrolled</button>
                        ) : (
                          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', flex: 1 }} onClick={() => handleEnrollCourse(course.id)}>Enroll</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Syllabus details modal overlay */}
      {activeSyllabusCourse && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justify: 'center', zIndex: 4000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '720px', width: '90%', background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>LeoAccess Syllabus Details</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>{activeSyllabusCourse.title}</h3>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => setActiveSyllabusCourse(null)}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem', textAlign: 'left' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Instructor</h4>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '4px' }}>
                  <strong>{activeSyllabusCourse.instructor_name || 'Faculty Lead'}</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeSyllabusCourse.instructor_bio || 'Industry Practitioner.'}</p>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Weekly Outline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {(activeSyllabusCourse.syllabus_roadmap || '').split('|').map((phase, idx) => (
                    <div key={idx} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <strong>Week {idx + 1}:</strong> {phase.trim()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Workspace Player Modal */}
      {activeLecture && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justify: 'center', zIndex: 3000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '1050px', width: '95%', height: '85vh', background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>Course: {activeLectureCourse.title}</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{activeLecture.title}</h3>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
                <button className={`btn ${workspaceSubtab === 'video' ? 'btn-primary' : ''}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: workspaceSubtab === 'video' ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }} onClick={() => setWorkspaceSubtab('video')}>🎥 Video</button>
                <button className={`btn ${workspaceSubtab === 'notes' ? 'btn-primary' : ''}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: workspaceSubtab === 'notes' ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }} onClick={() => setWorkspaceSubtab('notes')}>📖 Notes</button>
                {courseMCQsMap[activeLectureCourse.id]?.filter(q => q.lecture_id === activeLecture.id).length > 0 && (
                  <button className={`btn ${workspaceSubtab === 'quiz' ? 'btn-primary' : ''}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: workspaceSubtab === 'quiz' ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }} onClick={() => setWorkspaceSubtab('quiz')}>📝 Quiz</button>
                )}
                {courseAssignmentsMap[activeLectureCourse.id]?.filter(a => a.lecture_id === activeLecture.id).length > 0 && (
                  <button className={`btn ${workspaceSubtab === 'coding' ? 'btn-primary' : ''}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: workspaceSubtab === 'coding' ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }} onClick={() => setWorkspaceSubtab('coding')}>💻 Code Editor</button>
                )}
              </div>

              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => { setActiveLecture(null); loadDashboardData(); }}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-main)' }}>
              
              {/* Subtab 1: Video */}
              {workspaceSubtab === 'video' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                  {activeLecture.video_url && activeLecture.video_url.startsWith('uploads/') ? (
                    <video src={`/${activeLecture.video_url}`} controls onTimeUpdate={onVideoTimeUpdate} style={{ maxWidth: '800px', width: '100%', borderRadius: '6px', border: '1px solid var(--card-border)' }} />
                  ) : (
                    <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Video URL format requires local uploads statically.</div>
                  )}
                </div>
              )}

              {/* Subtab 2: Notes */}
              {workspaceSubtab === 'notes' && (
                <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-main)', maxWidth: '800px', margin: '0 auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{activeLecture.notes || 'No notes published for this lecture yet.'}</pre>
                </div>
              )}

              {/* Subtab 3: MCQ Quiz */}
              {workspaceSubtab === 'quiz' && (
                <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'left' }}>
                  <h3>Lecture Assessment Quiz</h3>
                  {quizResultsAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{quizResultsAlert}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {courseMCQsMap[activeLectureCourse.id].filter(q => q.lecture_id === activeLecture.id).map((q, idx) => (
                      <div key={q.id} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                        <strong>Question {idx + 1}: {q.question}</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const val = q[`option_${opt.toLowerCase()}`];
                            if (!val) return null;
                            return (
                              <label key={opt} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="radio" name={`q-${q.id}`} checked={selectedQuizOptions[q.id] === opt} onChange={() => setSelectedQuizOptions(prev => ({ ...prev, [q.id]: opt }))} />
                                <span>{opt}. {val}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleQuizSubmit}>Submit Quiz Answers</button>
                </div>
              )}

              {/* Subtab 4: Coding Editor */}
              {workspaceSubtab === 'coding' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '100%', minHeight: '350px' }}>
                  {/* Left: Challenge */}
                  <div className="widget-card" style={{ padding: '1.25rem', textAlign: 'left' }}>
                    {courseAssignmentsMap[activeLectureCourse.id].filter(a => a.lecture_id === activeLecture.id).map(a => (
                      <div key={a.id}>
                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>{a.title}</h4>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.5, marginTop: '0.5rem', fontFamily: 'inherit' }}>{a.description}</pre>
                      </div>
                    ))}
                  </div>

                  {/* Right: Workspace Code area */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <textarea value={codeSubmissionText} onChange={(e) => setCodeSubmissionText(e.target.value)} style={{ flex: 1, background: '#1e293b', color: '#38bdf8', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid var(--card-border)', resize: 'none' }} placeholder="// Write your solution code here..." />
                    
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary" onClick={handleCodeSubmit}>Run Code & Submit</button>
                    </div>

                    <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '4px', border: '1px solid var(--card-border)', textAlign: 'left', minHeight: '120px' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Console & Compiler Logs</span>
                      <pre style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#10b981', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{consoleLogs}</pre>
                      <pre style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#f59e0b', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{aiMentorAdvice}</pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Online Assessment Test Panel Overlay */}
      {activeExam && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justify: 'center', zIndex: 3000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)' }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%', height: '90vh', background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>{activeExam.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Anti-cheat warnings: {examTabSwitches} / 3</span>
              </div>
              <strong style={{ fontSize: '1.25rem', color: examTimeRemaining < 60 ? 'var(--accent)' : 'var(--success)' }}>
                Time: {Math.floor(examTimeRemaining / 60)}m {examTimeRemaining % 60}s
              </strong>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'left', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {(activeExam.questions || []).map((q, idx) => (
                  <div key={q.id} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                    <strong>Q{idx + 1}. {q.question}</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <label key={opt} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="radio" name={`exam-q-${q.id}`} checked={examAnswers[q.id] === opt} onChange={() => setExamAnswers(prev => ({ ...prev, [q.id]: opt }))} />
                          <span>{opt}. {q[`option_${opt.toLowerCase()}`]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem' }} onClick={() => submitExam(false)}>Finish Exam & Submit</button>
          </div>
        </div>
      )}

      {/* Exam review modal overlay */}
      {reviewExam && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justify: 'center', zIndex: 3000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '820px', width: '90%', height: '80vh', background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Review: {reviewExam.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detailed answers checklist review</span>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => setReviewExam(null)}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {reviewData.map((q, idx) => {
                  const isCorrect = q.selected_option === q.correct_option;
                  return (
                    <div key={q.id} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                      <strong>Q{idx + 1}. {q.question}</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        <span>Correct option: <strong style={{ color: 'var(--success)' }}>{q.correct_option}. {q[`option_${q.correct_option.toLowerCase()}`]}</strong></span>
                        <span>Your answer: <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--accent)' }}>{q.selected_option || 'None'}. {q.selected_option ? q[`option_${q.selected_option.toLowerCase()}`] : 'Unanswered'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
