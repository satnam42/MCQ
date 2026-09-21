import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import AppLayout from './components/layout/AppLayout';
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
import SettingsPage from './pages/SettingsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageQuestionsPage from './pages/admin/ManageQuestionsPage';
import ManageTopicsPage from './pages/admin/ManageTopicsPage';
import ImportQuestionsPage from './pages/admin/ImportQuestionsPage';
import AIQuestionGenPage from './pages/admin/AIQuestionGenPage';
import ManageNotesPage from './pages/admin/ManageNotesPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManagePermissionsPage from './pages/admin/ManagePermissionsPage';
import AdminTestLimits from './pages/admin/AdminTestLimits';
import AdminUserTestLimits from './pages/admin/AdminUserTestLimits';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PermissionProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes inside AppLayout */}
          <Route
            path="*"
            element={
              <AppLayout>
                <Routes>
                  {/* Candidate Routes */}
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
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
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
                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <ManageUsersPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/permissions"
                    element={
                      <AdminRoute>
                        <ManagePermissionsPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/test-limits"
                    element={
                      <AdminRoute>
                        <AdminTestLimits />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/user-limits"
                    element={
                      <AdminRoute>
                        <AdminUserTestLimits />
                      </AdminRoute>
                    }
                  />

                  {/* Fallback Catch-all */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
        </PermissionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
