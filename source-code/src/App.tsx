import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreatorDashboard } from './pages/creator/CreatorDashboard';
import { ContentFactoryWizard } from './pages/creator/ContentFactoryWizard';
import { AdminPanel } from './pages/admin/AdminPanel';
import { NotificationPage } from './pages/NotificationPage';
import OrgMembersPage from './pages/org/OrgMembersPage';
import OrgDashboard from './pages/org/OrgDashboard';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* Creator Routes */}
            <Route 
              path="/creator/dashboard" 
              element={
                <ProtectedRoute>
                  <CreatorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/creator/wizard" 
              element={
                <ProtectedRoute>
                  <ContentFactoryWizard />
                </ProtectedRoute>
              } 
            />

            {/* Org Routes */}
            <Route 
              path="/org/:orgId/dashboard" 
              element={
                <ProtectedRoute>
                  <OrgDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/org/:orgId/members" 
              element={
                <ProtectedRoute>
                  <OrgMembersPage />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />

            {/* Notification Routes */}
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationPage />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
