// ================================================================
//  api.js — Frontend API connector for Quizify
//  Include this in every HTML page:  <script src="api.js"></script>
// ================================================================

// ── CONFIGURATION — shared Quizify endpoint and secret ──
const API_URL   = 'https://script.google.com/macros/s/AKfycbw0yYvF_vXTWl5ukxtRqcnhCeFCAvrTSM8LFEAvAzj9OtvwevZ8M2gZb-mhd6BnEPnc4A/exec';
const API_TOKEN = 'Quizify2026@PGCS#Secure';

// ================================================================
//  CORE FETCH HELPERS
// ================================================================

async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('token',  API_TOKEN);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res  = await fetch(url.toString());
  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message);
  return json.data;
}

async function apiPost(action, data = {}) {
  const res  = await fetch(API_URL, {
    method  : 'POST',
    body    : JSON.stringify({ action, token: API_TOKEN, data }),
  });
  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message);
  return json.data;
}

// ================================================================
//  AUTH
// ================================================================

const API = {

  // Test connection
  ping: () => apiGet('ping'),

  // Login — role: 'admin' | 'teacher' | 'student'
  login: (email, password, role) =>
    apiGet('loginCheck', { email, password, role }),

  // ── Student ────────────────────────────────────────────────
  registerStudent: (name, email, password, department, rollNumber, photo) =>
    apiPost('registerStudent', { name, email, password, department, rollNumber, photo }),

  getStudent: (email) =>
    apiGet('getStudent', { email }),

  getAllStudents: () =>
    apiGet('getAllStudents'),

  // ── Teacher ────────────────────────────────────────────────
  registerTeacher: (name, email, password, department) =>
    apiPost('registerTeacher', { name, email, password, department }),

  getTeacher: (email) =>
    apiGet('getTeacher', { email }),

  // ── Weekly Quiz ────────────────────────────────────────────
  // questions = [{ question, options: [A,B,C,D], answer: 0-based index }, ...]
  createWeeklyQuiz: (title, weekNumber, timer, questions, createdBy) =>
    apiPost('createWeeklyQuiz', { title, weekNumber, timer, questions, createdBy }),

  getActiveWeeklyQuiz: () =>
    apiGet('getActiveWeeklyQuiz'),

  getAllWeeklyQuizzes: () =>
    apiGet('getAllWeeklyQuizzes'),

  setWeeklyQuizStatus: (id, status) =>            // status: 'active'|'completed'
    apiPost('updateWeeklyQuizStatus', { id, status }),

  // ── Classroom Quiz ─────────────────────────────────────────
  createClassroomQuiz: (title, department, timer, questions, createdBy) =>
    apiPost('createClassroomQuiz', { title, department, timer, questions, createdBy }),

  getClassroomQuizByCode: (code) =>
    apiGet('getClassroomQuizByCode', { code }),

  getMyClassroomQuizzes: (teacherId) =>
    apiGet('getClassroomQuizzesByTeacher', { teacherId }),

  setClassroomQuizStatus: (id, status) =>         // status: 'waiting'|'active'|'completed'
    apiPost('updateClassroomQuizStatus', { id, status }),

  // ── Questions ──────────────────────────────────────────────
  getQuestions: (quizId) =>
    apiGet('getQuestions', { quizId }),

  // ── Responses ──────────────────────────────────────────────
  // answers = array of selected option indices [0,1,2,0,...]
  submitResponse: (quizId, quizType, studentData, answers, score, total, leftEarly) =>
    apiPost('submitResponse', {
      quizId, quizType,
      studentId    : studentData.id,
      studentName  : studentData.name,
      studentEmail : studentData.email,
      department   : studentData.department,
      rollNumber   : studentData.rollNumber || '',
      photo        : studentData.photo      || '',
      answers, score, total, leftEarly,
    }),

  getResponsesByQuiz: (quizId) =>
    apiGet('getResponsesByQuiz', { quizId }),

  getMyResponses: (email) =>
    apiGet('getResponsesByStudent', { email }),

  // ── Badges ─────────────────────────────────────────────────
  awardBadge: (studentEmail, badge) =>            // badge: 'bronze'|'silver'|'gold'
    apiPost('awardBadge', { studentEmail, badge }),

  // ── Leaderboard ────────────────────────────────────────────
  getLeaderboard: () =>
    apiGet('getLeaderboard'),

  rebuildLeaderboard: () =>
    apiPost('rebuildLeaderboard'),

  // ── Weekly Winners ──────────────────────────────────────────
  addWeeklyWinner: (weekNumber, quizId, student, score, total, rank) =>
    apiPost('addWeeklyWinner', {
      weekNumber, quizId,
      studentId   : student.id,
      studentName : student.name,
      department  : student.department,
      email       : student.email,
      photo       : student.photo || '',
      score, total, rank,
    }),

  getWeeklyWinners: (weekNumber) =>
    apiGet('getWeeklyWinners', { weekNumber }),

  getAllWeeklyWinners: () =>
    apiGet('getAllWeeklyWinners'),
};

// ================================================================
//  SESSION HELPERS  (stores current user in sessionStorage)
// ================================================================

const Session = {
  save : (user) => sessionStorage.setItem('qf_user', JSON.stringify(user)),
  get  : ()     => JSON.parse(sessionStorage.getItem('qf_user') || 'null'),
  clear: ()     => sessionStorage.removeItem('qf_user'),
  require: (role) => {
    const u = Session.get();
    if (!u) { location.href = 'quizify-login.html'; return null; }
    if (role && u.role !== role) { location.href = 'quizify-login.html'; return null; }
    return u;
  },
};

// ================================================================
//  USAGE EXAMPLES (copy-paste into your page scripts)
// ================================================================

/*
// ── 1. Login ────────────────────────────────────────────────
const result = await API.login('student@email.com', 'password123', 'student');
if (result.success) {
  Session.save(result.user);
  location.href = 'quizify-student.html';
} else {
  alert(result.message);
}

// ── 2. Register student ──────────────────────────────────────
const r = await API.registerStudent('Jasmin', 'jasmin@email.com', 'pass123', 'CS', 'CS001');
if (r.success) Session.save(r.user);

// ── 3. Get active weekly quiz ─────────────────────────────────
const { quiz, questions } = await API.getActiveWeeklyQuiz();
if (quiz) {
  console.log('Quiz:', quiz.title);
  console.log('Questions:', questions.length);
}

// ── 4. Submit quiz response ───────────────────────────────────
const user    = Session.get();
const answers = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0]; // student's selected options
const score   = answers.filter((ans, i) => ans === questions[i].correctAnswer).length;
await API.submitResponse(quiz.id, 'weekly', user, answers, score, questions.length, false);

// ── 5. Admin creates weekly quiz ──────────────────────────────
const questions = [
  { question: 'What is Python?', options: ['A lang','A snake','A game','A OS'], answer: 0 },
  { question: 'What is RAM?',    options: ['ROM','CPU','Memory','Disk'],         answer: 2 },
];
await API.createWeeklyQuiz('Week 4 — AI Basics', 4, 15, questions, 'admin@quizify.edu');

// ── 6. Teacher creates classroom quiz ────────────────────────
const result = await API.createClassroomQuiz('Unit Test 3', 'CS', 10, questions, teacher.id);
console.log('Code for students:', result.code); // e.g. "CS4521"

// ── 7. Student joins classroom quiz by code ───────────────────
const classQuiz = await API.getClassroomQuizByCode('CS4521');
const qs        = await API.getQuestions(classQuiz.id);

// ── 8. Award badge ────────────────────────────────────────────
await API.awardBadge('student@email.com', 'gold');

// ── 9. Get leaderboard ────────────────────────────────────────
const board = await API.getLeaderboard();
board.forEach(row => console.log(row.rank, row.studentName, row.totalScore));
*/