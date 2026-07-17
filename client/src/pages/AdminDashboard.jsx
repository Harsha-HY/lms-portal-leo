import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  // Active Tab state
  const [activeTab, setActiveTab] = useState('tracking');
  const [activeTheme, setActiveTheme] = useState('theme-dark-slate');

  // Core Data Cache
  const [courses, setCourses] = useState([]);
  const [trackingLogs, setTrackingLogs] = useState([]);
  const [trackingStudents, setTrackingStudents] = useState([]);
  const [trackingProgress, setTrackingProgress] = useState([]);
  const [trackingSubmissions, setTrackingSubmissions] = useState([]);
  const [trackingEnrollments, setTrackingEnrollments] = useState([]);
  const [trackingLectures, setTrackingLectures] = useState([]);

  // Callback requests state
  const [callbackRequests, setCallbackRequests] = useState([]);

  // XP Gamification configs
  const [videoXp, setVideoXp] = useState(10);
  const [mcqXp, setMcqXp] = useState(20);
  const [assignmentXp, setAssignmentXp] = useState(50);
  const [xpLeaderboard, setXpLeaderboard] = useState([]);
  const [xpAlert, setXpAlert] = useState('');

  // Assessment/Exams state
  const [assessments, setAssessments] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCourseId, setNewExamCourseId] = useState('');
  const [newExamTime, setNewExamTime] = useState(30);
  const [newExamQuestionIds, setNewExamQuestionIds] = useState([]);
  const [examCourseMCQs, setExamCourseMCQs] = useState([]);
  const [examAlert, setExamAlert] = useState('');

  // Curriculum & Video manager state
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseCat, setNewCourseCat] = useState('Programming');
  const [newCourseRoadmap, setNewCourseRoadmap] = useState('');
  const [newCourseInstName, setNewCourseInstName] = useState('');
  const [newCourseInstBio, setNewCourseInstBio] = useState('');
  const [newCourseInstAvatar, setNewCourseInstAvatar] = useState('avatar-1');
  const [newCourseThumbFile, setNewCourseThumbFile] = useState(null);
  
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureVideoFile, setNewLectureVideoFile] = useState(null);

  // Asset Linking state
  const [linkingCourseId, setLinkingCourseId] = useState('');
  const [linkingLectureId, setLinkingLectureId] = useState('');
  const [linkingNotes, setLinkingNotes] = useState('');
  const [linkingMCQsList, setLinkingMCQsList] = useState([]);
  const [linkingAssignmentsList, setLinkingAssignmentsList] = useState([]);
  const [linkedMCQIds, setLinkedMCQIds] = useState([]);
  const [linkedAssignmentId, setLinkedAssignmentId] = useState('');
  const [linkingAlert, setLinkingAlert] = useState('');

  // Assignments manager state
  const [assignmentCourseId, setAssignmentCourseId] = useState('');
  const [assignmentLectureId, setAssignmentLectureId] = useState('');
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignBoilerplate, setNewAssignBoilerplate] = useState('');
  const [newAssignSolution, setNewAssignSolution] = useState('');
  const [newAssignTestCases, setNewAssignTestCases] = useState('[]');
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [assignmentAlert, setAssignmentAlert] = useState('');

  // MCQs manager state
  const [mcqCourseId, setMcqCourseId] = useState('');
  const [mcqLectureId, setMcqLectureId] = useState('');
  const [newMcqQuestion, setNewMcqQuestion] = useState('');
  const [newMcqOptA, setNewMcqOptA] = useState('');
  const [newMcqOptB, setNewMcqOptB] = useState('');
  const [newMcqOptC, setNewMcqOptC] = useState('');
  const [newMcqOptD, setNewMcqOptD] = useState('');
  const [newMcqCorrect, setNewMcqCorrect] = useState('A');
  const [mcqsList, setMCQsList] = useState([]);
  
  const [pdfUploadFile, setPdfUploadFile] = useState(null);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [mcqAlert, setMcqAlert] = useState('');

  // Access credentials manager state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [newTeamPass, setNewTeamPass] = useState('');
  const [newTeamRole, setNewTeamRole] = useState('faculty');
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamAlert, setTeamAlert] = useState('');

  // Search filter
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedAnalyticsStudentId, setSelectedAnalyticsStudentId] = useState(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  // Initial Data Loader
  const loadAdminData = async () => {
    try {
      const coursesData = await API.getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
        setNewExamCourseId(coursesData[0].id);
        setLinkingCourseId(coursesData[0].id);
        setAssignmentCourseId(coursesData[0].id);
        setMcqCourseId(coursesData[0].id);
      }

      const tracking = await API.getTrackingData();
      setTrackingLogs(tracking.logs || []);
      setTrackingStudents(tracking.students || []);
      setTrackingProgress(tracking.progress || []);
      setTrackingSubmissions(tracking.submissions || []);
      setTrackingEnrollments(tracking.enrollments || []);
      setTrackingLectures(tracking.lectures || []);

      const callbacks = await API.getAdminCallbackRequests();
      setCallbackRequests(callbacks);

      const xp = await API.getXPSettings();
      if (xp) {
        setVideoXp(xp.video_xp || 10);
        setMcqXp(xp.mcq_xp || 20);
        setAssignmentXp(xp.assignment_xp || 50);
      }

      const leaderboardData = await API.getLeaderboard();
      setXpLeaderboard(leaderboardData.leaderboard || []);

      const exams = await API.getAdminAssessments();
      setAssessments(exams);

      const results = await API.getAdminAssessmentResults();
      setExamResults(results);

      const team = await API.getTeamMembers();
      setTeamMembers(team);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    // Apply selected theme
    const theme = localStorage.getItem('leo-theme') || 'theme-dark-slate';
    setActiveTheme(theme);
    document.body.className = theme;

    loadAdminData();
  }, []);

  const changeTheme = (themeName) => {
    setActiveTheme(themeName);
    localStorage.setItem('leo-theme', themeName);
    document.body.className = themeName;
  };

  // Switch Course dropdown in linking/MCQ/assignment views
  const handleCourseChangeInLinking = async (courseId) => {
    setLinkingCourseId(courseId);
    const lecs = await API.getLectures(courseId);
    if (lecs.length > 0) {
      setLinkingLectureId(lecs[0].id);
      loadLinkingLectureAssets(lecs[0].id, courseId);
    } else {
      setLinkingLectureId('');
    }
  };

  const loadLinkingLectureAssets = async (lectureId, courseId) => {
    try {
      const lecs = await API.getLectures(courseId);
      const lec = lecs.find(l => l.id === parseInt(lectureId));
      setLinkingNotes(lec ? lec.notes || '' : '');

      const mcqs = await API.getMCQs(courseId);
      setLinkingMCQsList(mcqs);

      const assigns = await API.getAssignments(courseId);
      setLinkingAssignmentsList(assigns);

      // Filter linked items
      const linkedQIds = mcqs.filter(q => q.lecture_id === parseInt(lectureId)).map(q => q.id);
      setLinkedMCQIds(linkedQIds);

      const linkedAssign = assigns.find(a => a.lecture_id === parseInt(lectureId));
      setLinkedAssignmentId(linkedAssign ? linkedAssign.id : '');
    } catch (err) {
      console.error(err);
    }
  };

  // Save linking changes
  const saveAssetLinking = async () => {
    setLinkingAlert('');
    try {
      // 1. Save notes
      await API.saveLectureNotes(linkingLectureId, linkingNotes);

      // 2. Link MCQs
      for (const q of linkingMCQsList) {
        const isLinked = linkedMCQIds.includes(q.id);
        await API.createMCQ(linkingCourseId, {
          id: q.id,
          lecture_id: isLinked ? parseInt(linkingLectureId) : null,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option
        });
      }

      // 3. Link Assignment
      for (const a of linkingAssignmentsList) {
        const isLinked = parseInt(linkedAssignmentId) === a.id;
        await API.createAssignment(linkingCourseId, {
          id: a.id,
          lecture_id: isLinked ? parseInt(linkingLectureId) : null,
          title: a.title,
          description: a.description,
          boilerplate_code: a.boilerplate_code,
          solution_code: a.solution_code,
          test_cases: a.test_cases
        });
      }

      setLinkingAlert('✓ Asset linking successfully updated!');
      loadAdminData();
    } catch (err) {
      setLinkingAlert('Failed to update asset linkages.');
    }
  };

  // Submit Callback Finish Query
  const finishCallback = async (id) => {
    try {
      const res = await API.finishCallbackRequest(id);
      if (res.success) {
        const callbacks = await API.getAdminCallbackRequests();
        setCallbackRequests(callbacks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Gamification XP Multipliers
  const saveXP = async () => {
    setXpAlert('');
    try {
      const res = await API.saveXPSettings(videoXp, mcqXp, assignmentXp);
      if (res.success) {
        setXpAlert('✓ XP reward multipliers updated successfully!');
      }
    } catch (err) {
      setXpAlert('Failed to save XP configurations.');
    }
  };

  // Course Spotlight Publisher
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newCourseTitle);
    formData.append('description', newCourseDesc);
    formData.append('category', newCourseCat);
    formData.append('syllabus_roadmap', newCourseRoadmap);
    formData.append('instructor_name', newCourseInstName);
    formData.append('instructor_bio', newCourseInstBio);
    formData.append('instructor_avatar', newCourseInstAvatar);
    if (newCourseThumbFile) {
      formData.append('thumbnail_file', newCourseThumbFile);
    }

    try {
      const res = await API.createCourse(formData);
      if (res.success) {
        alert('Course published successfully!');
        setNewCourseTitle('');
        setNewCourseDesc('');
        setNewCourseRoadmap('');
        setNewCourseInstName('');
        setNewCourseInstBio('');
        loadAdminData();
      }
    } catch (err) {
      alert('Failed to publish course.');
    }
  };

  // Video Lecture Publisher
  const handlePublishLecture = async (e) => {
    e.preventDefault();
    if (!newLectureVideoFile) {
      alert('Please select a video file.');
      return;
    }

    const formData = new FormData();
    formData.append('title', newLectureTitle);
    formData.append('video_file', newLectureVideoFile);

    try {
      const res = await API.addLecture(selectedCourseId, formData);
      if (res.success) {
        alert('Lecture video published successfully!');
        setNewLectureTitle('');
        setNewLectureVideoFile(null);
        loadAdminData();
      }
    } catch (err) {
      alert('Video publishing failed.');
    }
  };

  // MCQ Publisher manual
  const handlePublishMCQ = async (e) => {
    e.preventDefault();
    setMcqAlert('');

    const payload = {
      lecture_id: mcqLectureId ? parseInt(mcqLectureId) : null,
      question: newMcqQuestion,
      option_a: newMcqOptA,
      option_b: newMcqOptB,
      option_c: newMcqOptC,
      option_d: newMcqOptD,
      correct_option: newMcqCorrect
    };

    try {
      const res = await API.createMCQ(mcqCourseId, payload);
      if (res.success) {
        setMcqAlert('✓ MCQ published successfully!');
        setNewMcqQuestion('');
        setNewMcqOptA('');
        setNewMcqOptB('');
        setNewMcqOptC('');
        setNewMcqOptD('');
        loadAdminData();
      }
    } catch (err) {
      setMcqAlert('Failed to save MCQ.');
    }
  };

  // Parse MCQ Quiz PDF file
  const handleParsePdfMCQ = async (e) => {
    e.preventDefault();
    if (!pdfUploadFile) return;

    setMcqAlert('Parsing PDF contents...');
    const formData = new FormData();
    formData.append('pdf_file', pdfUploadFile);
    formData.append('lecture_id', mcqLectureId);

    try {
      const res = await API.parsePdfMCQ(formData);
      if (res.success) {
        setMcqAlert(`✓ Successfully parsed and imported ${res.imported} MCQs from PDF.`);
        loadAdminData();
      } else {
        setMcqAlert('PDF parsing failed: ' + res.error);
      }
    } catch (err) {
      setMcqAlert('Failed to parse PDF.');
    }
  };

  // Generate MCQ Quiz with AI Coach
  const handleAiMcqGenerate = async (e) => {
    e.preventDefault();
    setMcqAlert('AI Coach generating quiz...');
    try {
      const res = await API.generateAiMCQ(aiTopicInput);
      if (res.success && res.mcq) {
        const payload = {
          lecture_id: mcqLectureId ? parseInt(mcqLectureId) : null,
          question: res.mcq.question,
          option_a: res.mcq.option_a,
          option_b: res.mcq.option_b,
          option_c: res.mcq.option_c,
          option_d: res.mcq.option_d,
          correct_option: res.mcq.correct_option
        };
        await API.createMCQ(mcqCourseId, payload);
        setMcqAlert('✓ AI Generated MCQ published successfully!');
        setAiTopicInput('');
        loadAdminData();
      }
    } catch (err) {
      setMcqAlert('AI generation failed.');
    }
  };

  // Code challenge publisher
  const handlePublishAssignment = async (e) => {
    e.preventDefault();
    setAssignmentAlert('');

    const payload = {
      lecture_id: assignmentLectureId ? parseInt(assignmentLectureId) : null,
      title: newAssignTitle,
      description: newAssignDesc,
      boilerplate_code: newAssignBoilerplate,
      solution_code: newAssignSolution,
      test_cases: newAssignTestCases
    };

    try {
      const res = await API.createAssignment(assignmentCourseId, payload);
      if (res.success) {
        setAssignmentAlert('✓ Coding challenge published successfully!');
        setNewAssignTitle('');
        setNewAssignDesc('');
        setNewAssignBoilerplate('');
        setNewAssignSolution('');
        loadAdminData();
      }
    } catch (err) {
      setAssignmentAlert('Failed to publish challenge.');
    }
  };

  // Grant access credentials Observer/Faculty
  const handleInviteFaculty = async (e) => {
    e.preventDefault();
    setTeamAlert('');
    try {
      const res = await API.inviteFaculty(newTeamName, newTeamEmail, newTeamPass, newTeamRole);
      if (res.success) {
        setTeamAlert('✓ Credentials created successfully!');
        setNewTeamName('');
        setNewTeamEmail('');
        setNewTeamPass('');
        const team = await API.getTeamMembers();
        setTeamMembers(team);
      } else {
        setTeamAlert(res.error || 'Failed to save credentials.');
      }
    } catch (err) {
      setTeamAlert('Network connection failed.');
    }
  };

  // Delete team member observer/faculty
  const handleDeleteTeamMember = async (id) => {
    if (!confirm('Are you sure you want to delete this observer/faculty credentials?')) return;
    try {
      await API.deleteTeamMember(id);
      const team = await API.getTeamMembers();
      setTeamMembers(team);
    } catch (err) {
      console.error(err);
    }
  };

  // Assessment builder
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setExamAlert('');

    const payload = {
      title: newExamTitle,
      course_id: parseInt(newExamCourseId),
      time_limit: parseInt(newExamTime),
      question_ids: newExamQuestionIds
    };

    try {
      const res = await API.createAdminAssessment(payload);
      if (res.success) {
        setExamAlert('✓ Assessment created successfully!');
        setNewExamTitle('');
        setNewExamQuestionIds([]);
        loadAdminData();
      }
    } catch (err) {
      setExamAlert('Failed to publish assessment.');
    }
  };

  const handleExamCourseChange = async (courseId) => {
    setNewExamCourseId(courseId);
    const mcqs = await API.getMCQs(courseId);
    setExamCourseMCQs(mcqs);
  };

  // Select candidate profile in Analytics
  const selectAnalyticsStudent = async (studentId) => {
    setSelectedAnalyticsStudentId(studentId);
    try {
      const profile = await API.getAdminStudentProfile(studentId);
      setSelectedStudentProfile(profile);
    } catch (err) {
      setSelectedStudentProfile(null);
    }
  };

  // Filter students by search
  const filteredStudents = trackingStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => setActiveTab('tracking')}>
          <div className="brand-logo">L</div>
          <div className="brand-info">
            <span className="brand-name">LeoAccess</span>
            <span className="brand-role">Admin Control</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className={`sidebar-link ${activeTab === 'tracking' ? 'active' : ''}`} onClick={() => setActiveTab('tracking')}>
            Candidate History
          </button>
          
          <button className={`sidebar-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Callback Requests
          </button>

          <button className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            Student Analytics
          </button>

          <button className={`sidebar-link ${activeTab === 'xp' ? 'active' : ''}`} onClick={() => setActiveTab('xp')}>
            XP & Standings
          </button>

          <button className={`sidebar-link ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
            Mock Exams
          </button>

          {user.role === 'admin' && (
            <>
              <button className={`sidebar-link ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
                Curriculum Manager
              </button>
              <button className={`sidebar-link ${activeTab === 'linking' ? 'active' : ''}`} onClick={() => { setActiveTab('linking'); handleCourseChangeInLinking(linkingCourseId); }}>
                Asset Linking
              </button>
              <button className={`sidebar-link ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
                Manage Assignments
              </button>
              <button className={`sidebar-link ${activeTab === 'mcqs' ? 'active' : ''}`} onClick={() => setActiveTab('mcqs')}>
                Manage MCQs
              </button>
              <button className={`sidebar-link ${activeTab === 'access' ? 'active' : ''}`} onClick={() => setActiveTab('access')}>
                Grant Portal Access
              </button>
            </>
          )}
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
            <h1 className="header-title">LeoAccess Admin Control</h1>
            <p className="header-subtitle">Publish courses, resolve callback queues, and monitor candidate progress.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="user-profile">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          
          {/* Tab 1: Candidate History */}
          {activeTab === 'tracking' && (
            <div className="tab-view">
              <div className="widget-card" style={{ textAlign: 'left' }}>
                <h2>Candidate Activity Audit Logs</h2>
                <div style={{ margin: '1rem 0' }}>
                  <input className="form-input" type="text" placeholder="Search candidate by name or email..." value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} style={{ maxWidth: '380px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  {filteredStudents.map(student => {
                    const logs = trackingLogs.filter(l => l.user_id === student.id);
                    return (
                      <div key={student.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{student.name} ({student.email})</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sessions logged: {logs.length}</span>
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {logs.slice(0, 3).map((l, i) => (
                            <div key={i}>• Logged in on {new Date(l.login_time).toLocaleString()} (IP: {l.ip_address})</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Callback Requests */}
          {activeTab === 'requests' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left' }}>
                {/* Pending */}
                <div className="widget-card" style={{ border: '1px solid var(--card-border)' }}>
                  <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>⏳ Pending Callbacks</h3>
                    <span className="badge-purple">{callbackRequests.filter(r => r.status === 'pending').length} Pending</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                    {callbackRequests.filter(r => r.status === 'pending').map(req => (
                      <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '4px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <strong>{req.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{req.email} | Phone: <strong style={{ color: 'var(--primary-light)' }}>{req.phone_number}</strong></span>
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Bio:</span> {req.bio || 'Not provided'}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>Course:</span> {req.course_title}
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.825rem' }}>
                          <strong>Doubt:</strong> {req.doubt}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'var(--success)' }} onClick={() => finishCallback(req.id)}>✓ Finish Query</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completed */}
                <div className="widget-card" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>✓ Resolved Queries</h3>
                    <span className="badge-success" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>{callbackRequests.filter(r => r.status === 'completed').length} Completed</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                    {callbackRequests.filter(r => r.status === 'completed').map(req => (
                      <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '4px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <strong>{req.name} ({req.email})</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✓ Resolved & Closed</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Student Analytics */}
          {activeTab === 'analytics' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'stretch', textAlign: 'left' }}>
                {/* Left: Directory list */}
                <div className="widget-card">
                  <h3>Registered Students</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    {trackingStudents.map(student => (
                      <div key={student.id} style={{ padding: '0.75rem', background: selectedAnalyticsStudentId === student.id ? 'var(--sidebar-hover)' : 'rgba(255,255,255,0.01)', border: `1px solid ${selectedAnalyticsStudentId === student.id ? 'var(--primary)' : 'var(--card-border)'}`, borderRadius: '4px', cursor: 'pointer' }} onClick={() => selectAnalyticsStudent(student.id)}>
                        <span style={{ fontWeight: 600, display: 'block' }}>{student.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Selected placement profile details card */}
                <div className="widget-card">
                  <h3>Placement Profile Card</h3>
                  {selectedStudentProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
                      <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.35rem' }}>{selectedStudentProfile.phone_number}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Educational level: <strong style={{ color: 'var(--primary-light)' }}>{selectedStudentProfile.education_level.toUpperCase()}</strong></span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Institution Name</span>
                          <strong>{selectedStudentProfile.institution_name}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Stream / Grade</span>
                          <strong>{selectedStudentProfile.stream_degree || selectedStudentProfile.status_grade}</strong>
                        </div>
                      </div>

                      {selectedStudentProfile.resume_url && (
                        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>Attached Resume:</span>
                          <div style={{ marginTop: '0.5rem' }}>
                            <a href={`/${selectedStudentProfile.resume_url}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>View Resume PDF</a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '3rem', color: 'var(--text-muted)', textAlign: 'center' }}>No student profile selected or onboarded.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: XP Standings */}
          {activeTab === 'xp' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', textAlign: 'left' }}>
                <div className="widget-card">
                  <h3>Configure XP Multipliers</h3>
                  {xpAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{xpAlert}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Video Watch reward XP</label>
                      <input className="form-input" type="number" value={videoXp} onChange={(e) => setVideoXp(parseInt(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quiz solve reward XP</label>
                      <input className="form-input" type="number" value={mcqXp} onChange={(e) => setMcqXp(parseInt(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Assignment solve reward XP</label>
                      <input className="form-input" type="number" value={assignmentXp} onChange={(e) => setAssignmentXp(parseInt(e.target.value))} />
                    </div>
                    <button className="btn btn-primary" onClick={saveXP}>Save XP Multipliers</button>
                  </div>
                </div>

                <div className="widget-card">
                  <h3>XP Standings Directory</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                    {xpLeaderboard.map((student, idx) => (
                      <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '4px' }}>
                        <span>#{idx + 1} {student.name}</span>
                        <strong>{student.xp} XP</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Mock Exams */}
          {activeTab === 'exams' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', textAlign: 'left' }}>
                <div className="widget-card">
                  <h3>Create Assessment Test</h3>
                  {examAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{examAlert}</div>}
                  <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Assessment Title</label>
                      <input className="form-input" type="text" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} required />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Link Course Questions</label>
                      <select className="form-input" value={newExamCourseId} onChange={(e) => handleExamCourseChange(e.target.value)} required>
                        <option value="" disabled>Select Course</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Time Limit (Minutes)</label>
                      <input className="form-input" type="number" value={newExamTime} onChange={(e) => setNewExamTime(parseInt(e.target.value))} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Select Quiz Questions ({newExamQuestionIds.length} Selected)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--card-border)', padding: '0.75rem', borderRadius: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                        {examCourseMCQs.map(q => (
                          <label key={q.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={newExamQuestionIds.includes(q.id)} onChange={(e) => {
                              if (e.target.checked) {
                                setNewExamQuestionIds(prev => [...prev, q.id]);
                              } else {
                                setNewExamQuestionIds(prev => prev.filter(id => id !== q.id));
                              }
                            }} />
                            <span>{q.question}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary">Publish Mock Exam</button>
                  </form>
                </div>

                <div className="widget-card">
                  <h3>Active Assessments List</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                    {assessments.map(exam => (
                      <div key={exam.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '4px', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{exam.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Questions: {exam.question_count} | Limit: {exam.time_limit} Mins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Curriculum Manager */}
          {activeTab === 'content' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', textAlign: 'left' }}>
                {/* Publish Course */}
                <div className="widget-card">
                  <h3>Publish New Course Spotlight</h3>
                  <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Course Title</label>
                      <input className="form-input" type="text" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" rows="3" value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Curriculum Outline Roadmap (separated by '|')</label>
                      <textarea className="form-input" rows="3" value={newCourseRoadmap} onChange={(e) => setNewCourseRoadmap(e.target.value)} placeholder="e.g. Week 1: Basics | Week 2: Functions" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Instructor Name</label>
                        <input className="form-input" type="text" value={newCourseInstName} onChange={(e) => setNewCourseInstName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Instructor Avatar</label>
                        <select className="form-input" value={newCourseInstAvatar} onChange={(e) => setNewCourseInstAvatar(e.target.value)}>
                          <option value="avatar-1">👨‍💻 Tech Lead</option>
                          <option value="avatar-2">👩‍💻 Product Mgr</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instructor Biography</label>
                      <input className="form-input" type="text" value={newCourseInstBio} onChange={(e) => setNewCourseInstBio(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Course Thumbnail Image</label>
                      <input className="form-input" type="file" accept="image/*" onChange={(e) => setNewCourseThumbFile(e.target.files[0])} />
                    </div>
                    <button type="submit" className="btn btn-primary">Publish Course</button>
                  </form>
                </div>

                {/* Publish Lecture Video */}
                <div className="widget-card">
                  <h3>Publish Lecture Milestone Video</h3>
                  <form onSubmit={handlePublishLecture} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Select Course</label>
                      <select className="form-input" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} required>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lecture Title</label>
                      <input className="form-input" type="text" value={newLectureTitle} onChange={(e) => setNewLectureTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Upload Video MP4 File</label>
                      <input className="form-input" type="file" accept="video/mp4" onChange={(e) => setNewLectureVideoFile(e.target.files[0])} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Publish Lecture Video</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Linking view */}
          {activeTab === 'linking' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'left' }}>
                <h2>Milestone Asset Linking Tool</h2>
                {linkingAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{linkingAlert}</div>}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Select Course</label>
                    <select className="form-input" value={linkingCourseId} onChange={(e) => handleCourseChangeInLinking(e.target.value)} required>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Lecture Milestone</label>
                    <select className="form-input" value={linkingLectureId} onChange={(e) => { setLinkingLectureId(e.target.value); loadLinkingLectureAssets(e.target.value, linkingCourseId); }} required>
                      <option value="" disabled>Select Lecture</option>
                      {(courseLecturesMap[linkingCourseId] || []).map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {linkingLectureId && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Lecture Study Notes</label>
                      <textarea className="form-input" rows="5" value={linkingNotes} onChange={(e) => setLinkingNotes(e.target.value)} placeholder="Publish markdown notes..." />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Link Quizzes (Check multiple)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--card-border)', padding: '0.75rem', borderRadius: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                        {linkingMCQsList.map(q => (
                          <label key={q.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={linkedMCQIds.includes(q.id)} onChange={(e) => {
                              if (e.target.checked) {
                                setLinkedMCQIds(prev => [...prev, q.id]);
                              } else {
                                setLinkedMCQIds(prev => prev.filter(id => id !== q.id));
                              }
                            }} />
                            <span>{q.question}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Link Coding Challenge</label>
                      <select className="form-input" value={linkedAssignmentId} onChange={(e) => setLinkedAssignmentId(e.target.value)}>
                        <option value="">None</option>
                        {linkingAssignmentsList.map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                    </div>

                    <button className="btn btn-primary" onClick={saveAssetLinking}>Save Milestone Links</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignments manager */}
          {activeTab === 'assignments' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
                <h2>Manage Coding Assignments</h2>
                {assignmentAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{assignmentAlert}</div>}
                
                <form onSubmit={handlePublishAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Select Course</label>
                      <select className="form-input" value={assignmentCourseId} onChange={(e) => setAssignmentCourseId(e.target.value)} required>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Link Lecture milestone</label>
                      <select className="form-input" value={assignmentLectureId} onChange={(e) => setAssignmentLectureId(e.target.value)}>
                        <option value="">Link later / None</option>
                        {(courseLecturesMap[assignmentCourseId] || []).map(l => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Challenge Title</label>
                    <input className="form-input" type="text" value={newAssignTitle} onChange={(e) => setNewAssignTitle(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Problem Statement / Instructions</label>
                    <textarea className="form-input" rows="4" value={newAssignDesc} onChange={(e) => setNewAssignDesc(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Starter Boilerplate code</label>
                    <textarea className="form-input" rows="5" value={newAssignBoilerplate} onChange={(e) => setNewAssignBoilerplate(e.target.value)} style={{ fontFamily: 'monospace' }} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Solution test criteria JSON</label>
                    <textarea className="form-input" rows="3" value={newAssignTestCases} onChange={(e) => setNewAssignTestCases(e.target.value)} style={{ fontFamily: 'monospace' }} required />
                  </div>

                  <button type="submit" className="btn btn-primary">Publish Coding Assignment</button>
                </form>
              </div>
            </div>
          )}

          {/* MCQs manager */}
          {activeTab === 'mcqs' && (
            <div className="tab-view">
              <div className="widget-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
                <h2>Manage Practice MCQs & Quizzes</h2>
                {mcqAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{mcqAlert}</div>}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Select Course</label>
                    <select className="form-input" value={mcqCourseId} onChange={(e) => setMcqCourseId(e.target.value)} required>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Link Lecture milestone</label>
                    <select className="form-input" value={mcqLectureId} onChange={(e) => setMcqLectureId(e.target.value)}>
                      <option value="">Link later / None</option>
                      {(courseLecturesMap[mcqCourseId] || []).map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', marginTop: '1.5rem' }}>
                  {/* Manual Form */}
                  <form onSubmit={handlePublishMCQ} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <input className="form-input" type="text" value={newMcqQuestion} onChange={(e) => setNewMcqQuestion(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option A</label>
                      <input className="form-input" type="text" value={newMcqOptA} onChange={(e) => setNewMcqOptA(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option B</label>
                      <input className="form-input" type="text" value={newMcqOptB} onChange={(e) => setNewMcqOptB(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option C</label>
                      <input className="form-input" type="text" value={newMcqOptC} onChange={(e) => setNewMcqOptC(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option D</label>
                      <input className="form-input" type="text" value={newMcqOptD} onChange={(e) => setNewMcqOptD(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Correct Option</label>
                      <select className="form-input" value={newMcqCorrect} onChange={(e) => setNewMcqCorrect(e.target.value)}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Publish MCQ Quiz</button>
                  </form>

                  {/* AI & PDF import */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ border: '1px dashed var(--card-border)', padding: '1.25rem', borderRadius: '4px' }}>
                      <h4>AI MCQ Generator</h4>
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <input className="form-input" type="text" placeholder="Topic: e.g. SQL joins" value={aiTopicInput} onChange={(e) => setAiTopicInput(e.target.value)} />
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={handleAiMcqGenerate}>Generate with AI Coach</button>
                      </div>
                    </div>

                    <div style={{ border: '1px dashed var(--card-border)', padding: '1.25rem', borderRadius: '4px' }}>
                      <h4>Import MCQs from PDF file</h4>
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <input className="form-input" type="file" accept=".pdf" onChange={(e) => setPdfUploadFile(e.target.files[0])} />
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={handleParsePdfMCQ}>Parse & Upload PDF</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Access Manager */}
          {activeTab === 'access' && (
            <div className="tab-view">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left' }}>
                <div className="widget-card">
                  <h3>Grant Observer / Faculty Access</h3>
                  {teamAlert && <div className="alert alert-success" style={{ display: 'block', margin: '1rem 0' }}>{teamAlert}</div>}
                  
                  <form onSubmit={handleInviteFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className="form-input" type="email" value={newTeamEmail} onChange={(e) => setNewTeamEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Portal Password</label>
                      <input className="form-input" type="password" value={newTeamPass} onChange={(e) => setNewTeamPass(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Select Role</label>
                      <select className="form-input" value={newTeamRole} onChange={(e) => setNewTeamRole(e.target.value)}>
                        <option value="faculty">Faculty Lead (Read-only MCQs & linking)</option>
                        <option value="admin">System Administrator (Full access)</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Create Credentials</button>
                  </form>
                </div>

                <div className="widget-card">
                  <h3>Active Observers Directory</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                    {teamMembers.map(member => (
                      <div key={member.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '4px', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{member.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{member.email} | Role: {member.role.toUpperCase()}</span>
                        </div>
                        {member.id !== user.id && (
                          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#f43f5e', background: 'transparent', border: 'none' }} onClick={() => handleDeleteTeamMember(member.id)}>Delete</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
