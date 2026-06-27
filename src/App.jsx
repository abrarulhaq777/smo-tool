import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Landing } from './pages/Landing';
import { Login } from './pages/Auth/Login';
import { Signup } from './pages/Auth/Signup';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Competitors } from './pages/Competitors';
import { CompetitorReport } from './pages/CompetitorReport';
import { CompetitorCompare } from './pages/CompetitorCompare';
import { Trends } from './pages/Trends';
import { Strategy } from './pages/Strategy';
import { Tracker } from './pages/Tracker';
import { Analytics } from './pages/Analytics';
import { Billing } from './pages/Billing';
import { Admin } from './pages/Admin';
import { PosterEditor } from './pages/PosterEditor';

function App() {
  const token = localStorage.getItem('trendbite_token');
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public auth pathways */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Dashboard endpoints */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/competitors/:id/report" element={<CompetitorReport />} />
          <Route path="/competitors/compare" element={<CompetitorCompare />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* Standalone full-screen canvas editor */}
        <Route path="/editor/:planId" element={<PosterEditor />} />

        {/* Catch-all redirections */}
        <Route
          path="*"
          element={<Navigate to={token ? '/dashboard' : '/'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
