import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import { Sparkles, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addNotification } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      addNotification('warning', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      addNotification('success', 'Reset token generated! (Use dev token: dev_reset_token)');
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset request failed.';
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
          <h2 className="text-xl font-bold text-foreground mb-1">Recover Password</h2>
          <p className="text-xs text-muted-foreground mb-6">Enter your email to receive a password recovery token</p>

          {!success ? (
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
                    <span>Generate Reset Token</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center mb-6">
              <p className="text-sm font-medium text-foreground mb-2">Recovery token generated successfully!</p>
              <p className="text-xs text-muted-foreground">
                In local execution, use recovery token: <span className="font-mono text-success font-semibold bg-success/5 px-1.5 py-0.5 rounded border border-success/15">dev_reset_token</span>
              </p>
            </div>
          )}

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-center">
            <Link to="/login" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
