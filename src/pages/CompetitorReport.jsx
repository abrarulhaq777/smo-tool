import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, FileText, Sparkles, AlertTriangle, ShieldCheck, 
  ShieldAlert, Zap, Heart, MessageSquare, Eye, Calendar, Clock, 
  Hash, Copy, CheckCircle2, XCircle, Lightbulb, PlayCircle, Layers,
  TrendingUp, TrendingDown, RefreshCw, BarChart2, Check, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

export const CompetitorReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useStore();

  const [competitorName, setCompetitorName] = useState('Competitor');
  const [activeTab, setActiveTab] = useState('instagram'); // 'instagram' | 'facebook' | 'combined' | 'history' | 'compare'
  
  // Platform Reports state
  const [report, setReport] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [availableVersions, setAvailableVersions] = useState([]);
  const [loadingReport, setLoadingReport] = useState(true);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Trend Comparison state
  const [comparePlatform, setComparePlatform] = useState('instagram');
  const [v1Id, setV1Id] = useState('');
  const [v2Id, setV2Id] = useState('');
  const [v1Report, setV1Report] = useState(null);
  const [v2Report, setV2Report] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Fetch competitor basic name info
  useEffect(() => {
    const fetchCompetitorName = async () => {
      try {
        const res = await api.get(`/intelligence/competitors/${useStore.getState().activeProject?._id}`);
        const comp = res.data.data.find(c => c.id === id || c._id === id);
        if (comp) setCompetitorName(comp.name);
      } catch (err) {
        console.warn('Failed to load competitor name');
      }
    };
    fetchCompetitorName();
  }, [id]);

  // Load report data based on active tab and selected version
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'compare') return;

    const fetchPlatformReport = async () => {
      setLoadingReport(true);
      try {
        const res = await api.get(`/competitors/${id}/report`, {
          params: {
            platform: activeTab,
            version: selectedVersion
          }
        });
        setReport(res.data.data);
        if (res.data.version && !selectedVersion) {
          setSelectedVersion(String(res.data.version));
        }
      } catch (err) {
        const msg = err.response?.data?.message || `Failed to fetch ${activeTab} report`;
        addNotification('error', msg);
        setReport(null);
      } finally {
        setLoadingReport(false);
      }
    };

    fetchPlatformReport();
  }, [id, activeTab, selectedVersion]);

  // Load available versions list for dropdowns
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await api.get(`/competitors/${id}/history`);
        setHistory(res.data.data);
        
        // Filter versions for the active platform tab
        if (activeTab === 'instagram' || activeTab === 'facebook') {
          const filtered = res.data.data
            .filter(h => h.platform === activeTab)
            .sort((a, b) => b.analysisVersion - a.analysisVersion);
          setAvailableVersions(filtered);
        }
      } catch (err) {
        console.warn('Failed to load history list');
      }
    };
    fetchVersions();
  }, [id, activeTab]);

  // Reset version selection when switching platform tabs
  useEffect(() => {
    setSelectedVersion('');
  }, [activeTab]);

  // Load comparisons when base and target versions are selected in Compare tab
  useEffect(() => {
    if (activeTab !== 'compare' || !v1Id || !v2Id) return;

    const fetchCompareReports = async () => {
      setLoadingCompare(true);
      try {
        const [r1, r2] = await Promise.all([
          api.get(`/competitors/${id}/report`, { params: { platform: comparePlatform, version: v1Id } }),
          api.get(`/competitors/${id}/report`, { params: { platform: comparePlatform, version: v2Id } })
        ]);
        setV1Report(r1.data.data);
        setV2Report(r2.data.data);
      } catch (err) {
        addNotification('error', 'Failed to load report versions for comparison');
      } finally {
        setLoadingCompare(false);
      }
    };

    fetchCompareReports();
  }, [activeTab, comparePlatform, v1Id, v2Id]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/competitors/${id}/history`);
      setHistory(res.data.data);
    } catch {
      addNotification('error', 'Failed to retrieve history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestore = async (historyId) => {
    if (!window.confirm('Are you sure you want to restore this historical report version?')) return;
    try {
      const res = await api.post(`/competitors/${id}/history/${historyId}/restore`);
      addNotification('success', res.data.message || 'Report restored successfully!');
      loadHistory();
      setActiveTab(res.data.data.platform);
      setSelectedVersion(String(res.data.data.analysisVersion));
    } catch (err) {
      addNotification('error', 'Failed to restore report version');
    }
  };

  // Recharts color palette
  const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#64748B'];
  const PIE_COLORS = {
    reels: '#EC4899',
    images: '#3B82F6',
    carousels: '#10B981',
    videos: '#F59E0B'
  };

  // Pre-process Recharts data
  const getCategoryChartData = () => {
    if (!report || !report.categories) return [];
    return Object.entries(report.categories).map(([key, val]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      count: val
    })).sort((a, b) => b.count - a.count);
  };

  const getFormatPieData = () => {
    if (!report || !report.overview) return [];
    return Object.entries(report.overview)
      .filter(([key]) => key !== 'totalPosts')
      .map(([key, val]) => ({
        name: key.replace('total', '').replace(/([A-Z])/g, ' $1').trim(),
        value: val,
        color: PIE_COLORS[key.replace('total', '').toLowerCase()] || '#3B82F6'
      })).filter(f => f.value > 0);
  };

  // Delta Helper for comparison
  const renderDelta = (v1Val, v2Val, isPercent = false) => {
    const d1 = Number(v1Val) || 0;
    const d2 = Number(v2Val) || 0;
    const diff = d2 - d1;
    
    if (diff === 0) return <span className="text-muted-foreground font-mono text-xs">0 (no change)</span>;
    
    const pct = d1 > 0 ? ((diff / d1) * 100).toFixed(1) : '100';
    const sign = diff > 0 ? '+' : '';
    const color = diff > 0 ? 'text-emerald-400' : 'text-rose-400';
    const Icon = diff > 0 ? TrendingUp : TrendingDown;

    return (
      <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{sign}{diff} ({sign}{pct}%)</span>
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Back & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/competitors')}
            className="p-2 rounded-lg border border-card-border hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{competitorName}</h1>
            <p className="text-sm text-muted-foreground">Versioned Enterprise social media intelligence metrics</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap border-b border-card-border/50 gap-2">
        {[
          { id: 'instagram', label: 'Instagram Analysis' },
          { id: 'facebook', label: 'Facebook Analysis' },
          { id: 'combined', label: 'Combined Insights' },
          { id: 'history', label: 'Analysis History' },
          { id: 'compare', label: 'Trend Comparison' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'history') loadHistory();
            }}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER TAB CONTENTS */}

      {/* 1. INSTAGRAM / FACEBOOK / COMBINED ANALYSES */}
      {['instagram', 'facebook', 'combined'].includes(activeTab) && (
        <div className="space-y-8">
          {/* Header Actions for Report Tab */}
          {activeTab !== 'combined' && availableVersions.length > 0 && (
            <div className="flex items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-card-border bg-card/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Selected Version:</span>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="bg-card border border-card-border text-foreground px-3 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer"
                >
                  {availableVersions.map(v => (
                    <option key={v._id} value={v.analysisVersion}>
                      Version {v.analysisVersion} (Analyzed {new Date(v.analyzedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-0.5 bg-card rounded border border-card-border">
                {activeTab} report
              </span>
            </div>
          )}

          {loadingReport ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading analysis report...</p>
            </div>
          ) : !report ? (
            <div className="glass-panel p-12 rounded-xl border border-card-border text-center max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No Analysis Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No {activeTab} analysis report is generated yet. Run analysis from the competitor directory.
              </p>
              <button 
                onClick={() => navigate('/competitors')}
                className="mt-6 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-all shadow-md"
              >
                Go to Competitors
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              {/* Executive Summary */}
              {report.summary && (
                <div className="glass-panel p-6 rounded-2xl border border-card-border bg-gradient-to-tr from-card/40 to-primary/5 flex gap-4 items-start">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-bold text-foreground text-sm">Gemini AI Intelligence Summary</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">{report.summary}</p>
                  </div>
                </div>
              )}

              {/* Exact Overview Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-card-border text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Posts</p>
                  <p className="text-2xl font-black text-foreground font-mono">{report.overview?.totalPosts || 0}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-card-border text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average Likes</p>
                  <p className="text-2xl font-black text-foreground font-mono">
                    {Math.round(report.engagement?.averageLikes || 0).toLocaleString()}
                  </p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-card-border text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average Comments</p>
                  <p className="text-2xl font-black text-foreground font-mono">
                    {Math.round(report.engagement?.averageComments || 0).toLocaleString()}
                  </p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-card-border text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Posts Per Week</p>
                  <p className="text-2xl font-black text-foreground font-mono">
                    {report.postingPattern?.postsPerWeek !== undefined && report.postingPattern?.postsPerWeek !== null ? Math.round(report.postingPattern.postsPerWeek) : '0'}
                  </p>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category count bar chart */}
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Exact Content Category Counts</span>
                  </h3>
                  <div className="h-64">
                    {getCategoryChartData().length === 0 ? (
                      <p className="text-xs text-muted-foreground py-20 text-center">No categories to display</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getCategoryChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                          <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                            labelStyle={{ color: '#F1F5F9', fontWeight: 'bold' }}
                            itemStyle={{ color: '#3B82F6' }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {getCategoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Formats distribution pie chart */}
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-secondary" />
                    <span>Post Format Distribution</span>
                  </h3>
                  <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-1/2 h-full">
                      {getFormatPieData().length === 0 ? (
                        <p className="text-xs text-muted-foreground py-20 text-center">No formats to display</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getFormatPieData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {getFormatPieData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                              itemStyle={{ color: '#F1F5F9' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-full sm:w-1/2 space-y-3">
                      {getFormatPieData().map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs border-b border-card-border/40 pb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
                            <span className="text-muted-foreground font-medium">{f.name}</span>
                          </div>
                          <span className="font-mono text-foreground font-semibold">{f.value} posts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement details and pattern */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Posting Patterns */}
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span>Posting Consistency</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-card/20 rounded-lg border border-card-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Consistency Score</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 bg-card/60 h-2 rounded-full overflow-hidden border border-card-border/30">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${report.postingPattern?.consistencyScore || 0}%` }} 
                          />
                        </div>
                        <span className="font-mono font-bold text-foreground">{report.postingPattern?.consistencyScore || 0}/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Engagement Sums */}
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span>Exact Total Aggregates</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-card/20 rounded-lg border border-card-border/50 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Total Likes</p>
                      <p className="text-sm font-extrabold text-foreground mt-1 font-mono">
                        {(report.engagement?.totalLikes || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-card/20 rounded-lg border border-card-border/50 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Total Comments</p>
                      <p className="text-sm font-extrabold text-foreground mt-1 font-mono">
                        {(report.engagement?.totalComments || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-card/20 rounded-lg border border-card-border/50 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Total Views</p>
                      <p className="text-sm font-extrabold text-foreground mt-1 font-mono">
                        {(report.engagement?.totalViews || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Gaps & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gaps */}
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-warning" />
                    <span>Evidence-Based Content Gaps</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-muted-foreground pl-4 list-disc">
                    {(report.contentGaps || []).map((gap, i) => (
                      <li key={i} className="leading-relaxed">{gap}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span>Competitor Attack Opportunities</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-muted-foreground pl-4 list-disc">
                    {(report.recommendations || []).map((rec, i) => (
                      <li key={i} className="leading-relaxed">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* High Performing Top Posts */}
              {report.topPosts && report.topPosts.length > 0 && (
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Top Performing Competitor Content</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {report.topPosts.map((post, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-card/20 border border-card-border/50 text-xs flex flex-col justify-between gap-3 relative">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">
                            Post #{idx + 1}
                          </span>
                          <p className="text-muted-foreground italic line-clamp-4 mt-1">"{post.caption}"</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-card-border/30 text-[10px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-pink-500" /> {post.likes}</span>
                          <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3 text-primary" /> {post.comments}</span>
                          {post.postUrl && (
                            <a href={post.postUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold flex items-center gap-0.5">
                              View <ArrowRight className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. HISTORY TIMELINE TAB */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Analysis History Log</h3>
            <button 
              onClick={loadHistory}
              disabled={loadingHistory}
              className="p-1.5 rounded-lg border border-card-border hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingHistory ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">No analysis history found.</p>
          ) : (
            <div className="relative border-l border-card-border/60 ml-4 pl-6 space-y-8 text-xs">
              {history.map((h) => {
                const dateStr = new Date(h.analyzedAt).toLocaleString();
                const isIg = h.platform === 'instagram';
                
                return (
                  <div key={h._id} className="relative">
                    {/* Bullet marker */}
                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-primary bg-background" />
                    
                    <div className="glass-panel p-4 rounded-xl border border-card-border/80 bg-card/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">Version {h.analysisVersion}</span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            isIg ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {h.platform}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{dateStr}</p>
                        <p className="text-muted-foreground">Analyzed exact count: <strong>{h.postsAnalyzed} posts</strong></p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View Version */}
                        <button
                          onClick={() => {
                            setActiveTab(h.platform);
                            setSelectedVersion(String(h.analysisVersion));
                          }}
                          className="px-3 py-1.5 bg-card border border-card-border hover:bg-card-hover rounded-lg font-bold text-foreground transition-all"
                        >
                          View Report
                        </button>
                        
                        {/* Restore Version */}
                        <button
                          onClick={() => handleRestore(h._id)}
                          className="px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-lg font-bold transition-all"
                        >
                          Restore Version
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TREND COMPARISON TAB */}
      {activeTab === 'compare' && (
        <div className="space-y-8">
          {/* Compare Selector Bar */}
          <div className="glass-panel p-4 rounded-xl border border-card-border bg-card/20 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            {/* Platform select */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Compare Platform</label>
              <select
                value={comparePlatform}
                onChange={(e) => {
                  setComparePlatform(e.target.value);
                  setV1Id('');
                  setV2Id('');
                  setV1Report(null);
                  setV2Report(null);
                }}
                className="bg-card border border-card-border text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            {/* Version 1 selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Base Version (Old)</label>
              <select
                value={v1Id}
                onChange={(e) => setV1Id(e.target.value)}
                className="bg-card border border-card-border text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="">Select version...</option>
                {history
                  .filter(h => h.platform === comparePlatform)
                  .map(v => (
                    <option key={v._id} value={v.analysisVersion}>
                      Version {v.analysisVersion} ({new Date(v.analyzedAt).toLocaleDateString()})
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Arrow connector */}
            <div className="hidden sm:flex justify-center text-muted-foreground">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Version 2 selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Compare Version (New)</label>
              <select
                value={v2Id}
                onChange={(e) => setV2Id(e.target.value)}
                className="bg-card border border-card-border text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="">Select version...</option>
                {history
                  .filter(h => h.platform === comparePlatform && String(h.analysisVersion) !== String(v1Id))
                  .map(v => (
                    <option key={v._id} value={v.analysisVersion}>
                      Version {v.analysisVersion} ({new Date(v.analyzedAt).toLocaleDateString()})
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          {loadingCompare ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !v1Report || !v2Report ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-card-border/60 rounded-xl">
              Select two different report versions from the dropdowns above to display competitor evolution and growth delta charts.
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              {/* Comparative Matrix Table */}
              <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="w-4.5 h-4.5 text-primary" />
                  <span>Metric Progression Matrix</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-card-border text-muted-foreground uppercase font-semibold">
                        <th className="py-3 px-4">Performance Indicator</th>
                        <th className="py-3 px-4 text-center">Version {v1Id} (Base)</th>
                        <th className="py-3 px-4 text-center">Version {v2Id} (Compare)</th>
                        <th className="py-3 px-4 text-center">Evolution / Growth Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Total Scraped Posts', key: 'totalPosts', group: 'overview' },
                        { label: 'Total Video / Reel Count', key: comparePlatform === 'instagram' ? 'totalReels' : 'totalVideos', group: 'overview' },
                        { label: 'Total Images Published', key: 'totalImages', group: 'overview' },
                        { label: 'Total Carousels Published', key: 'totalCarousels', group: 'overview' },
                        { label: 'Average Likes Count', key: 'averageLikes', group: 'engagement' },
                        { label: 'Average Comments Count', key: 'averageComments', group: 'engagement' },
                        { label: 'Average Video Views', key: 'averageViews', group: 'engagement' },
                        { label: 'Weekly Frequency (Posts/Wk)', key: 'postsPerWeek', group: 'postingPattern' }
                      ].map((item, idx) => {
                        const v1Val = v1Report[item.group]?.[item.key] || 0;
                        const v2Val = v2Report[item.group]?.[item.key] || 0;

                        return (
                          <tr key={idx} className="border-b border-card-border/40 hover:bg-card/5 transition-all font-mono">
                            <td className="py-3 px-4 font-sans font-semibold text-foreground text-left">{item.label}</td>
                            <td className="py-3 px-4 text-center text-foreground">{v1Val}</td>
                            <td className="py-3 px-4 text-center text-foreground">{v2Val}</td>
                            <td className="py-3 px-4 text-center">{renderDelta(v1Val, v2Val)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Growth comparison */}
              <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                <h3 className="text-sm font-bold text-foreground">Content Categories Evolution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground">
                  {/* Category Deltas */}
                  <div className="space-y-3">
                    {Object.keys({ ...(v1Report.categories || {}), ...(v2Report.categories || {}) }).map((cat, idx) => {
                      const v1Val = v1Report.categories?.[cat] || 0;
                      const v2Val = v2Report.categories?.[cat] || 0;
                      const cleanCatName = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/([A-Z])/g, ' $1');

                      return (
                        <div key={idx} className="flex items-center justify-between border-b border-card-border/30 pb-2">
                          <span className="font-semibold text-foreground">{cleanCatName}</span>
                          <div className="flex items-center gap-3 font-mono">
                            <span>{v1Val} → {v2Val}</span>
                            <span>{renderDelta(v1Val, v2Val)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Delta Analysis */}
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex flex-col justify-center space-y-2">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Evolution Intelligence</span>
                    </span>
                    <p className="leading-relaxed">
                      By comparing Version {v1Id} with Version {v2Id}, we can accurately map the competitor's content pivot over time. If promotional counts rose relative to trust building/educational topics, the competitor has intensified their direct lead generation push. Leverage this data to target their audience with higher-value educational alternative campaigns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
