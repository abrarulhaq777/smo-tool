import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setProjects, setActiveProject, addNotification } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addNotification('warning', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('trendbite_token', token);
      setUser(user);

      // Fetch projects list for user
      const projRes = await api.get('/projects');
      const fetchedProjects = projRes.data.data;
      setProjects(fetchedProjects);

      if (fetchedProjects.length > 0) {
        // Fallback to last active project if exists, otherwise set first
        const cachedProj = localStorage.getItem('trendbite_active_project');
        if (cachedProj) {
          const parsed = JSON.parse(cachedProj);
          const found = fetchedProjects.find((p) => p.id === parsed.id);
          setActiveProject(found || fetchedProjects[0]);
        } else {
          setActiveProject(fetchedProjects[0]);
        }
      } else {
        setActiveProject(null);
      }

      addNotification('success', `Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      addNotification('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow z-0" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-md z-10">
        {/* Title logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            TrendBite AI
          </h1>
          <p className="text-sm text-muted-foreground">Digital Agency Competitor & Strategy Copilot</p>
        </div>

        {/* Card */}
        <div className="glass-panel-glow p-8 rounded-2xl border border-card-border relative">
          <h2 className="text-xl font-bold text-foreground mb-1">Access Portal</h2>
          <p className="text-xs text-muted-foreground mb-6">Sign in to manage client campaigns & social strategies</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Business Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-card/20 border border-card-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-card/20 border border-card-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full glow-btn bg-gradient-to-r from-primary to-secondary text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Don't have an agency portal?{' '}
            <Link to="/signup" className="font-semibold text-secondary hover:text-secondary-hover transition-colors">
              Sign Up Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
