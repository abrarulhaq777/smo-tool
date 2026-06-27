import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import {
  BarChart3, Plus, ExternalLink, ThumbsUp, MessageSquare, Globe, Video, Link
} from 'lucide-react';

export const Analytics = () => {
  const { activeProject, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form Fields
  const [platform, setPlatform] = useState('Instagram');
  const [postLink, setPostLink] = useState('');
  const [reach, setReach] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');
  const [followersGained, setFollowersGained] = useState('');
  const [watchTime, setWatchTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnalytics = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get(`/analytics/${activeProject._id}`);
      setPosts(res.data.data);
    } catch {
      addNotification('error', 'Failed to retrieve analytics history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeProject]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!postLink) {
      addNotification('warning', 'Please provide a post URL link');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/analytics', {
        projectId: activeProject._id,
        platform,
        postLink,
        reach: reach || 0,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        saves: saves || 0,
        followersGained: followersGained || 0,
        watchTime: watchTime || 0,
      });

      addNotification('success', 'Logged post analytics record.');
      setShowLogForm(false);

      // Reset form
      setPostLink('');
      setReach('');
      setLikes('');
      setComments('');
      setShares('');
      setSaves('');
      setFollowersGained('');
      setWatchTime('');

      fetchAnalytics();
    } catch {
      addNotification('error', 'Failed to save post analytics');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-card-border text-center max-w-md mx-auto mt-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Select Active Project</h3>
        <p className="text-sm text-muted-foreground mt-1">Please configure or select a project workspace to audit performance.</p>
      </div>
    );
  }

  // Compile Platform Performance Breakdown
  const platformSummary = {
    Instagram: { name: 'Instagram', reach: 0, engagement: 0 },
    Facebook: { name: 'Facebook', reach: 0, engagement: 0 },
    TikTok: { name: 'TikTok', reach: 0, engagement: 0 },
    YouTube: { name: 'YouTube Shorts', reach: 0, engagement: 0 },
  };

  // Compile timeline data
  const timelineMap = {};

  posts.forEach((post) => {
    const key = post.platform === 'YouTube' ? 'YouTube' : post.platform;
    if (!platformSummary[key]) {
      platformSummary[key] = { name: key, reach: 0, engagement: 0 };
    }

    post.analytics.forEach((log) => {
      platformSummary[key].reach += log.reach;
      platformSummary[key].engagement += log.likes + log.comments + log.shares + log.saves;

      const dateStr = new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { date: dateStr, reach: 0, interactions: 0 };
      }
      timelineMap[dateStr].reach += log.reach;
      timelineMap[dateStr].interactions += log.likes + log.comments + log.shares;
    });
  });

  const barChartData = Object.values(platformSummary).filter((p) => p.reach > 0 || p.engagement > 0);
  const lineChartData = Object.values(timelineMap).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getPlatformIcon = (plat) => {
    switch (plat) {
      case 'Instagram':
        return <Video className="w-4 h-4 text-[#e1306c]" />;
      case 'YouTube':
      case 'YouTube Shorts':
        return <Video className="w-4 h-4 text-[#ff0000]" />;
      case 'Facebook':
        return <Globe className="w-4 h-4 text-[#1877f2]" />;
      default:
        return <Link className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground">Register publication links and compile reach/likes metrics</p>
        </div>
        <button
          onClick={() => setShowLogForm(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-md shadow-primary/10 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Post Stats</span>
        </button>
      </div>

      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all duration-300">
          <div className="glass-panel-glow w-full max-w-2xl rounded-2xl border border-card-border bg-dropdown-bg p-6 shadow-2xl relative overflow-hidden space-y-4">

            {/* Glow accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Log Published Post Stats</h2>
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="p-1.5 rounded-lg border border-card-border hover:bg-card/25 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Social Platform *</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube Shorts</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Post URL Link *</label>
                  <input
                    type="url"
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="w-full px-3.5 py-2.5 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Reach / Impressions</label>
                  <input
                    type="number"
                    value={reach}
                    onChange={(e) => setReach(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Likes</label>
                  <input
                    type="number"
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Comments</label>
                  <input
                    type="number"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Shares</label>
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Saves / Bookmarks</label>
                  <input
                    type="number"
                    value={saves}
                    onChange={(e) => setSaves(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Followers Gained</label>
                  <input
                    type="number"
                    value={followersGained}
                    onChange={(e) => setFollowersGained(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Video Watch Time (Minutes)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={watchTime}
                    onChange={(e) => setWatchTime(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-4 py-2 border border-card-border rounded-lg text-xs font-semibold hover:bg-card/20 text-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-white rounded-lg text-xs font-semibold shadow-md shadow-secondary/10 transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl border border-card-border text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <BarChart3 className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No Posts Tracked</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Log your published links and customer reach stats to populate visual graphs.
          </p>
          <button
            onClick={() => setShowLogForm(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Log First Post
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Timeline Area Chart */}
            <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
              <h2 className="text-base font-bold text-foreground">Reach Accumulation Timeline</h2>
              <div className="h-64 w-full">
                {lineChartData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-24">No date analytics logs.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="reachGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.08)' }}
                        itemStyle={{ fontSize: 11 }}
                      />
                      <Area type="monotone" name="Total Reach" dataKey="reach" stroke="#6366f1" fillOpacity={1} fill="url(#reachGlow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Platform Comparison Bar Chart */}
            <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
              <h2 className="text-base font-bold text-foreground">Platform Engagement Benchmark</h2>
              <div className="h-64 w-full">
                {barChartData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-24">No platform benchmarks.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.08)' }}
                        itemStyle={{ fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                      <Bar name="Total Reach" dataKey="reach" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar name="Interactions" dataKey="engagement" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Posts History Table */}
          <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
            <h2 className="text-base font-bold text-foreground">Log History Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-card-border text-muted-foreground uppercase font-semibold">
                    <th className="py-3 px-2">Platform</th>
                    <th className="py-3 px-2">Post Link</th>
                    <th className="py-3 px-2">Total Reach</th>
                    <th className="py-3 px-2">Interactions</th>
                    <th className="py-3 px-2">Watch Time</th>
                    <th className="py-3 px-2">Date Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const latestLog = post.analytics.length > 0 ? post.analytics[post.analytics.length - 1] : null;
                    const totalLikes = post.analytics.reduce((acc, curr) => acc + curr.likes, 0);
                    const totalComments = post.analytics.reduce((acc, curr) => acc + curr.comments, 0);
                    const totalWatch = post.analytics.reduce((acc, curr) => acc + curr.watchTime, 0);

                    return (
                      <tr key={post.id} className="border-b border-card-border/40 hover:bg-card/10 transition-colors">
                        <td className="py-3.5 px-2">
                          <span className="flex items-center gap-1.5 font-bold text-foreground">
                            {getPlatformIcon(post.platform)}
                            {post.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <a
                            href={post.postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                          >
                            <span className="truncate max-w-[200px] inline-block">{post.postLink}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="py-3.5 px-2 font-mono font-medium text-foreground">
                          {latestLog ? latestLog.reach.toLocaleString() : '0'}
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-3 font-mono text-muted-foreground">
                            <span className="flex items-center gap-1" title="Likes">
                              <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
                              {totalLikes}
                            </span>
                            <span className="flex items-center gap-1" title="Comments">
                              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                              {totalComments}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 font-mono font-medium text-foreground">
                          {totalWatch > 0 ? `${totalWatch.toFixed(1)}m` : '0.0m'}
                        </td>
                        <td className="py-3.5 px-2 text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
