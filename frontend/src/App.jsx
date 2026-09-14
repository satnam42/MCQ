import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import DailyQuizPage from './pages/candidate/DailyQuizPage';
import TestResultPage from './pages/candidate/TestResultPage';
import TopicPracticePage from './pages/candidate/TopicPracticePage';
import PracticeSessionPage from './pages/candidate/PracticeSessionPage';
import ProgressDashboardPage from './pages/candidate/ProgressDashboardPage';
import TestHistoryPage from './pages/candidate/TestHistoryPage';
import ReattemptIncorrectPage from './pages/candidate/ReattemptIncorrectPage';
import StudyNotesPage from './pages/candidate/StudyNotesPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageQuestionsPage from './pages/admin/ManageQuestionsPage';
import ManageTopicsPage from './pages/admin/ManageTopicsPage';
import ImportQuestionsPage from './pages/admin/ImportQuestionsPage';
import AIQuestionGenPage from './pages/admin/AIQuestionGenPage';
import ManageNotesPage from './pages/admin/ManageNotesPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-slate-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Candidate Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/study-notes"
                element={
                  <ProtectedRoute>
                    <StudyNotesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/daily-quiz"
                element={
                  <ProtectedRoute>
                    <DailyQuizPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test-result/:attemptId"
                element={
                  <ProtectedRoute>
                    <TestResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/topic-practice"
                element={
                  <ProtectedRoute>
                    <TopicPracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice-session"
                element={
                  <ProtectedRoute>
                    <PracticeSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <ProgressDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <TestHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reattempt-incorrect"
                element={
                  <ProtectedRoute>
                    <ReattemptIncorrectPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/notes"
                element={
                  <AdminRoute>
                    <ManageNotesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <AdminRoute>
                    <ManageQuestionsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/topics"
                element={
                  <AdminRoute>
                    <ManageTopicsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/import"
                element={
                  <AdminRoute>
                    <ImportQuestionsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/ai-generator"
                element={
                  <AdminRoute>
                    <AIQuestionGenPage />
                  </AdminRoute>
                }
              />

              {/* Fallback Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}


export default App;
