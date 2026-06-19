import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Sparkles, ThumbsUp, Users, BarChart2, ArrowRight,
  TrendingUp, Compass, ArrowUpRight, Calendar
} from 'lucide-react';

export const Dashboard = () => {
  const { activeProject, addNotification } = useStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    competitorsCount: 0,
    hasPlan: false,
    postsCount: 0,
    avgEngagement: '0%',
  });

  const [trendsStats, setTrendsStats] = useState({
    topRising: '-',
    highestGrowth: '-',
    opportunityScore: '-',
    trendingThisWeek: '-',
  });

  const [chartData, setChartData] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  const fetchDashboardData = async () => {
    if (!activeProject) return;
    try {
      // 1. Fetch competitors
      const compRes = await api.get(`/intelligence/competitors/${activeProject._id}`);
      const competitorsCount = compRes.data.data.length;

      // 2. Fetch strategy plan
      const planRes = await api.get(`/strategy/${activeProject._id}`);
      const hasPlan = !!planRes.data.data;

      // 3. Fetch analytics posts
      const analyticsRes = await api.get(`/analytics/${activeProject._id}`);
      const posts = analyticsRes.data.data;
      const postsCount = posts.length;

      // Calculate averages and build chart series
      let totalReach = 0;
      let totalInteractions = 0;
      const mergedPoints = {};

      posts.forEach((post) => {
        post.analytics.forEach((log) => {
          const dateStr = new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          totalReach += log.reach;
          totalInteractions += log.likes + log.comments + log.shares + log.saves;

          if (!mergedPoints[dateStr]) {
            mergedPoints[dateStr] = {
              date: dateStr,
              reach: 0,
              engagement: 0,
              likes: 0,
            };
          }
          mergedPoints[dateStr].reach += log.reach;
          mergedPoints[dateStr].likes += log.likes;
          mergedPoints[dateStr].engagement += log.likes + log.comments + log.shares;
        });
      });

      const sortedChartPoints = Object.values(mergedPoints).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setChartData(sortedChartPoints);

      const avgEngagement = totalReach > 0
        ? ((totalInteractions / totalReach) * 100).toFixed(1) + '%'
        : '0.0%';

      setStats({
        competitorsCount,
        hasPlan,
        postsCount,
        avgEngagement,
      });

      // 4. Fetch recommendations
      const recsRes = await api.get(`/analytics/${activeProject._id}/recommendations`);
      if (recsRes.data.data && recsRes.data.data.length > 0) {
        setRecommendations(recsRes.data.data[0]);
      } else {
        setRecommendations(null);
      }

      // 5. Fetch trends for active project
      try {
        const trendsRes = await api.get(`/trends/${activeProject._id}`);
        const trends = trendsRes.data.data || [];
        if (trends.length > 0) {
          const sortedByScore = [...trends].sort((a, b) => b.trendScore - a.trendScore);
          const sortedByGrowth = [...trends].sort((a, b) => b.growth - a.growth);

          const topRising = sortedByScore[0]?.keyword || '-';
          const highestGrowth = sortedByGrowth[0]
            ? `${sortedByGrowth[0].keyword} (+${sortedByGrowth[0].growth}%)`
            : '-';

          const maxGrowth = sortedByGrowth[0]?.growth || 0;
          const opportunityScore = Math.min(99, Math.max(65, Math.round(55 + (maxGrowth / 10)))) + '%';

          const trendingThisWeek = sortedByScore[0]
            ? `${sortedByScore[0].keyword} (${sortedByScore[0].suggestedPlatform})`
            : '-';

          setTrendsStats({
            topRising,
            highestGrowth,
            opportunityScore,
            trendingThisWeek
          });
        } else {
          setTrendsStats({
            topRising: 'No data',
            highestGrowth: 'No data',
            opportunityScore: 'No data',
            trendingThisWeek: 'No data'
          });
        }
      } catch (err) {
        // Safe fallback
      }

    } catch {
      addNotification('error', 'Failed to retrieve dashboard metrics');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject]);

  const handleGenerateRecommendations = async () => {
    if (!activeProject) return;
    setGeneratingRecs(true);
    try {
      const res = await api.post(`/analytics/${activeProject._id}/recommendations`);
      setRecommendations(res.data.data);
      addNotification('success', 'Gemini AI has compiled fresh analytics recommendations!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate weekly advice. Log some analytics data first.';
      addNotification('error', msg);
    } finally {
      setGeneratingRecs(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-card-border text-center flex flex-col items-center justify-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Active Client Selected</h3>
        <p className="text-sm text-muted-foreground mb-6">
          To unlock the competitor maps, trends charts, and AI strategizers, you must first create or select a client project.
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-md shadow-primary/20 transition-all"
        >
          Select Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agency Dashboard</h1>
          <p className="text-sm text-muted-foreground">Competitor benchmarks and engagement indexes</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-card-border bg-card text-muted-foreground transition-colors duration-300">
          Market: <span className="text-foreground font-bold capitalize">{activeProject.location}</span>
        </span>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Local Competitors</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{stats.competitorsCount}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">7-Day Strategy</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {stats.hasPlan ? 'Active' : 'Pending'}
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracked Posts</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{stats.postsCount}</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Engagement</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{stats.avgEngagement}</p>
          </div>
        </div>
      </div>

      {/* Search Heat & Trend Signals */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Local Search Heat & Trend Signals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1 */}
          <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Top Rising Topic</p>
              <p className="text-sm font-extrabold text-foreground mt-1 truncate capitalize">{trendsStats.topRising}</p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-xl" />
            <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Highest Growth Keyword</p>
              <p className="text-sm font-extrabold text-foreground mt-1 truncate capitalize">{trendsStats.highestGrowth}</p>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl" />
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Viral Opportunity Score</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">{trendsStats.opportunityScore}</p>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="glass-panel p-5 rounded-xl border border-card-border flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-xl" />
            <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trending This Week</p>
              <p className="text-xs font-extrabold text-foreground mt-1.5 truncate capitalize">{trendsStats.trendingThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Graph */}
        <div className="glass-panel p-6 rounded-xl border border-card-border lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Post Engagement Velocity</h2>
              <p className="text-xs text-muted-foreground">Historical reach and interactions over time</p>
            </div>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-sm text-muted-foreground">No historical analytics logged yet.</p>
                <button
                  onClick={() => navigate('/analytics')}
                  className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
                >
                  <span>Log your first post statistics</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)', borderRadius: '8px', boxShadow: 'var(--glass-shadow)' }}
                    labelStyle={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}
                    itemStyle={{ color: 'var(--foreground)', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area type="monotone" name="Cumulative Reach" dataKey="reach" stroke="#6366f1" fillOpacity={1} fill="url(#colorReach)" />
                  <Area type="monotone" name="Total Engagement" dataKey="engagement" stroke="#a855f7" fillOpacity={1} fill="url(#colorEngage)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="glass-panel p-6 rounded-xl border border-card-border flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground">Gemini AI Advisor</h2>
            </div>

            {recommendations ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Strategy Advice</p>
                  <ul className="space-y-2">
                    {recommendations.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-foreground bg-card/15 p-2.5 rounded-lg border border-card-border">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reels Hook Scripts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendations.hookSuggestions.map((hook, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/20">
                        "{hook}"
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hashtags</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendations.hashtagSuggestions.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-mono text-primary font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 flex flex-col items-center justify-center">
                <p className="text-xs text-muted-foreground mb-4">
                  Log competitor intelligence & post stats, then trigger Gemini to compile strategic growth advice.
                </p>
                <button
                  onClick={handleGenerateRecommendations}
                  disabled={generatingRecs}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-xs font-semibold hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {generatingRecs ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Compile AI Growth Plan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {recommendations && (
            <button
              onClick={handleGenerateRecommendations}
              disabled={generatingRecs}
              className="mt-6 w-full py-2 bg-card border border-card-border hover:bg-card/75 text-xs text-muted-foreground hover:text-foreground font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {generatingRecs ? (
                <div className="w-4.5 h-4.5 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-secondary" />
                  <span>Update Recommendations</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
