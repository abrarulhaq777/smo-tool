import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { ShieldAlert, Users, BarChart3, Database, Unlock } from 'lucide-react';

export const Admin = () => {
  const { user, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);

  const fetchAdminData = async () => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data.data);

      const usersRes = await api.get('/admin/users');
      setUsersList(usersRes.data.data);
    } catch {
      addNotification('error', 'Failed to retrieve administrative diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleRoleUpdate = async (targetUserId, targetRole) => {
    try {
      const res = await api.put(`/admin/users/${targetUserId}/role`, { role: targetRole });
      addNotification('success', res.data.message);
      
      // Update local state list
      setUsersList(usersList.map((u) => (u.id === targetUserId ? { ...u, role: targetRole } : u)));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update user role';
      addNotification('error', msg);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="glass-panel p-8 rounded-xl border border-destructive/20 text-center max-w-md mx-auto mt-12 bg-destructive/5">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Access Restricted</h3>
        <p className="text-sm text-muted-foreground mt-1">This console is exclusively reserved for system administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Console</h1>
        <p className="text-sm text-muted-foreground">Monitor platform usage, revenue estimation, and block abusers</p>
      </div>

      {loading && !stats ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Diagnostic Metrics */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Accounts</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">{stats.totalUsers}</p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Revenue Runrate</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">₹{stats.estimatedRevenue?.toLocaleString()}</p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AI Calls</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">{stats.systemUsage?.aiGenerations}</p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Scraper Queries</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">{stats.systemUsage?.competitorScrapes}</p>
                </div>
              </div>
            </div>
          )}

          {/* User Management List */}
          <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
            <h2 className="text-lg font-bold text-foreground">Registered User Accounts Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-card-border text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-2">User Name</th>
                    <th className="py-3 px-2">Account Role</th>
                    <th className="py-3 px-2">Active Plan</th>
                    <th className="py-3 px-2">Usage metrics</th>
                    <th className="py-3 px-2">Created Date</th>
                    <th className="py-3 px-2">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((targetUser) => {
                    const activePlan = targetUser.subscriptions?.[0]?.plan || 'FREE';
                    const activePlanStatus = targetUser.subscriptions?.[0]?.status || 'Active';
                    const usage = targetUser.usageTracks?.[0] || { aiGenerations: 0, competitorScrapes: 0, trendsQueries: 0 };

                    return (
                      <tr key={targetUser.id} className="border-b border-card-border/40 hover:bg-card/10 transition-colors">
                        <td className="py-3.5 px-2">
                          <p className="font-bold text-foreground text-sm">{targetUser.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{targetUser.email}</p>
                        </td>
                        <td className="py-3.5 px-2 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            targetUser.role === 'ADMIN'
                              ? 'bg-secondary/15 text-secondary border border-secondary/20'
                              : targetUser.role === 'BLOCKED'
                              ? 'bg-destructive/15 text-destructive border border-destructive/20'
                              : 'bg-card text-muted-foreground border border-card-border'
                          }`}>
                            {targetUser.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="font-semibold text-white capitalize">{activePlan}</span>
                          <span className="text-[9px] text-muted-foreground ml-1">({activePlanStatus})</span>
                        </td>
                        <td className="py-3.5 px-2 font-mono text-muted-foreground">
                          AI: {usage.aiGenerations} | Scrapes: {usage.competitorScrapes}
                        </td>
                        <td className="py-3.5 px-2 text-muted-foreground">
                          {new Date(targetUser.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1.5">
                            {targetUser.role === 'BLOCKED' ? (
                              <button
                                onClick={() => handleRoleUpdate(targetUser.id, 'USER')}
                                className="px-2 py-1 rounded bg-success/10 hover:bg-success/20 text-success border border-success/20 font-semibold"
                              >
                                Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleUpdate(targetUser.id, 'BLOCKED')}
                                className="px-2 py-1 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-semibold"
                                disabled={user.id === targetUser.id}
                              >
                                Block User
                              </button>
                            )}

                            {targetUser.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleRoleUpdate(targetUser.id, 'ADMIN')}
                                className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold"
                              >
                                Make Admin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
