import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import api from './services/api';
import { WellnessProvider } from './context/WellnessContext';
import logoImg from './assets/AarogyaMitra logo.png';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import OnboardingPage from './pages/OnboardingPage';
import AssessmentPage from './pages/AssessmentPage';
import AssessmentProgressPage from './pages/AssessmentProgressPage';
import DashboardPage from './pages/DashboardPage';
import WellnessReportPage from './pages/WellnessReportPage';
import AgentJourneyPage from './pages/AgentJourneyPage';
import PhysicalActivityAgentPage from './pages/PhysicalActivityAgentPage';
import PsychologicalSupportAgentPage from './pages/PsychologicalSupportAgentPage';
import RecoveryWellnessAgentPage from './pages/RecoveryWellnessAgentPage';
import ProfessionalSupportPage from './pages/ProfessionalSupportPage';
import ProfileProgressPage from './pages/ProfileProgressPage';
import ProgressPage from './pages/ProgressPage';

import { useWellness } from './context/WellnessContext';

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success) setUser(res.data.user);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => setUser(userData);
  const handleLogout = () => { localStorage.removeItem('token'); setUser(null); };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4" style={{ background: '#faf7f4' }}>
        <img src={logoImg} alt="AarogyaMitra" className="h-12 object-contain animate-pulse" />
        <p className="text-xs font-semibold" style={{ color: '#9f7dd4' }}>Loading AarogyaMitra...</p>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WellnessProvider user={user}>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/signup" element={<SignUpPage onLoginSuccess={handleLoginSuccess} />} />

            {/* Onboarding / Assessment (triggered during signup) */}
            <Route path="/onboarding" element={<ProtectedRoute user={user}><OnboardingPage /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute user={user}><AssessmentPage /></ProtectedRoute>} />
            <Route path="/assessment-progress" element={<ProtectedRoute user={user}><AssessmentProgressPage /></ProtectedRoute>} />

            {/* Authenticated Routes */}
            <Route path="/dashboard" element={<ProtectedRoute user={user}><DashboardPage user={user} /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute user={user}><WellnessReportPage /></ProtectedRoute>} />
            <Route path="/journey" element={<Navigate to="/dashboard" replace />} />
            <Route path="/progress" element={<ProtectedRoute user={user}><ProgressPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute user={user}><ProfileProgressPage user={user} /></ProtectedRoute>} />

            {/* Specialized Agents */}
            <Route path="/agent/physical-activity" element={<ProtectedRoute user={user}><PhysicalActivityAgentPage /></ProtectedRoute>} />
            <Route path="/agent/psychological-support" element={<ProtectedRoute user={user}><PsychologicalSupportAgentPage /></ProtectedRoute>} />
            <Route path="/agent/recovery-wellness" element={<ProtectedRoute user={user}><RecoveryWellnessAgentPage /></ProtectedRoute>} />
            <Route path="/agent/professional-support" element={<ProtectedRoute user={user}><ProfessionalSupportPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </WellnessProvider>
    </Router>
  );
}
