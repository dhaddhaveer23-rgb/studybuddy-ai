import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from '@/lib/theme';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import Library from '@/pages/Library';
import StudyMaterialDetail from '@/pages/StudyMaterialDetail';
import AiTutor from '@/pages/AiTutor';
import Progress from '@/pages/Progress';
import Exams from '@/pages/Exams';
import StudyPlanner from '@/pages/StudyPlanner';
import Leaderboard from '@/pages/Leaderboard';
import Settings from '@/pages/Settings';
import AnswerChecker from '@/pages/AnswerChecker';
import PastPapers from '@/pages/PastPapers';
import WeaknessRadar from '@/pages/WeaknessRadar';
import BossBattles from '@/pages/BossBattles';
import BossArena from '@/pages/BossArena';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/library" element={<Library />} />
          <Route path="/material/:id" element={<StudyMaterialDetail />} />
          <Route path="/answer-checker" element={<AnswerChecker />} />
          <Route path="/past-papers" element={<PastPapers />} />
          <Route path="/weakness-radar" element={<WeaknessRadar />} />
          <Route path="/boss-battles" element={<BossBattles />} />
          <Route path="/boss-battle/:id" element={<BossArena />} />
          <Route path="/tutor" element={<AiTutor />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/planner" element={<StudyPlanner />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App