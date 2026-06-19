import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import {
  TrendingUp, Compass, Search, Sparkles, Calendar, Tag,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2,
  Check, Copy, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader } from '../components/Loader';

export const Trends = () => {
  const { activeProject, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trends, setTrends] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [explanation, setExplanation] = useState('');

  // Filtering and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('12m'); // '3m' | '6m' | '12m'
  const [visibleCount, setVisibleCount] = useState(4); // Infinite scrolling simulation count
  const [copiedId, setCopiedId] = useState(null);

  const fetchTrends = async (forceRefresh = false) => {
    if (!activeProject) return;
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const endpoint = forceRefresh ? '/trends/explore' : `/trends/${activeProject._id}`;
      const payload = forceRefresh ? { projectId: activeProject._id } : null;

      const res = forceRefresh 
        ? await api.post(endpoint, payload)
        : await api.get(endpoint);

      const trendsData = res.data.data || [];
      setTrends(trendsData);
      setExplanation(res.data.explanation || '');

      if (trendsData.length > 0) {
        setSelectedTrend(trendsData[0]);
      } else {
        setSelectedTrend(null);
      }

      if (forceRefresh) {
        addNotification('success', 'Google Trends index refreshed with fresh metrics!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to retrieve Google Trends details';
      addNotification('error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrends(false);
  }, [activeProject]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addNotification('info', 'Copied content idea to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!activeProject) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-card-border text-center max-w-md mx-auto mt-12">
        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Select Active Project</h3>
        <p className="text-sm text-muted-foreground mt-1">Please configure or select a project workspace to analyze trends.</p>
      </div>
    );
  }

  // Filter trends list locally
  const filteredTrends = trends.filter(t => 
    t.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.suggestedPlatform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate list
  const paginatedTrends = filteredTrends.slice(0, visibleCount);

  // Slice chart data based on timeRange selector
  const getChartData = () => {
    if (!selectedTrend || !selectedTrend.timelineData) return [];
    
    let data = selectedTrend.timelineData.map(d => ({
      name: d.formattedTime,
      score: d.value
    }));

    if (timeRange === '3m') {
      return data.slice(-3);
    } else if (timeRange === '6m') {
      return data.slice(-6);
    }
    return data;
  };

  const chartData = getChartData();

  // Load more / infinite scroll simulation
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  const getDifficultyColor = (score) => {
    if (score < 40) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score < 70) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  const getDifficultyLabel = (score) => {
    if (score < 40) return 'Easy';
    if (score < 70) return 'Medium';
    return 'Hard';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Trending Topics
          </h1>
          <p className="text-sm text-muted-foreground">
            Discovered search intent and booming keywords for <span className="text-white font-semibold capitalize">{activeProject.location}</span> ({activeProject.category})
          </p>
        </div>
        <button
          onClick={() => fetchTrends(true)}
          disabled={refreshing || loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-primary/10 glow-btn"
        >
          {refreshing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refresh Trends</span>
        </button>
      </div>

      {loading && (
        <div className="glass-panel p-12 rounded-xl border border-card-border flex flex-col items-center justify-center">
          <Loader label="Crawling regional search interest records, related search tags, and peaks from Google Trends. Querying Gemini AI..." />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (List of Topics & Chart) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Filter and Stats Bar */}
            <div className="glass-panel p-4 rounded-xl border border-card-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter topics or platforms..."
                  className="w-full pl-9 pr-4 py-1.5 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Total Discovered: {trends.length} Keywords
              </div>
            </div>

            {/* Trends Table / List */}
            <div className="glass-panel rounded-xl border border-card-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-card-border/60 bg-card/15 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      <th className="p-4">Keyword Topic</th>
                      <th className="p-4 text-center">Search Growth</th>
                      <th className="p-4 text-center">Difficulty</th>
                      <th className="p-4 text-center">Platform</th>
                      <th className="p-4">Suggested Idea</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrends.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                          No trends matching filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedTrends.map((trend) => {
                        const isSelected = selectedTrend?.keyword === trend.keyword;
                        return (
                          <tr
                            key={trend.id}
                            onClick={() => setSelectedTrend(trend)}
                            className={`border-b border-card-border/30 hover:bg-card/20 transition-all cursor-pointer ${
                              isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''
                            }`}
                          >
                            <td className="p-4">
                              <p className="text-xs font-bold text-foreground capitalize">{trend.keyword}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">Vol: {trend.volume.toLocaleString()}/mo</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                                <ArrowUpRight className="w-3 h-3" />
                                +{trend.growth}%
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${getDifficultyColor(trend.difficulty)}`}>
                                {getDifficultyLabel(trend.difficulty)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/10 border border-secondary/25 text-secondary font-medium">
                                {trend.suggestedPlatform}
                              </span>
                            </td>
                            <td className="p-4 max-w-xs">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground truncate">{trend.suggestedContent}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(trend.suggestedContent, trend.id);
                                  }}
                                  className="text-muted-foreground hover:text-white transition-colors"
                                >
                                  {copiedId === trend.id ? (
                                    <Check className="w-3 h-3 text-success" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Load More/Infinite Scroll Button */}
              {visibleCount < filteredTrends.length && (
                <div className="p-3 bg-card/5 border-t border-card-border/50 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
                  >
                    <span>Load More Trending Queries</span>
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Recharts Area Chart */}
            {selectedTrend && (
              <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 capitalize">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    Interest Chart: {selectedTrend.keyword}
                  </h2>
                  <div className="flex items-center gap-1.5 p-1 bg-card/30 border border-card-border rounded-lg">
                    {['3m', '6m', '12m'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all uppercase ${
                          timeRange === range
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-64 w-full">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      No timeline metrics cached.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="trendGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.08)' }}
                          itemStyle={{ fontSize: 11 }}
                        />
                        <Area type="monotone" name="Search Interest" dataKey="score" stroke="var(--primary)" fillOpacity={1} fill="url(#trendGlow)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Trends Side Breakdown Panel */}
          <div className="glass-panel p-6 rounded-xl border border-card-border flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground">AI Trend Analyzer</h2>
            </div>

            {selectedTrend ? (
              <div className="space-y-5 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Query</span>
                  <h3 className="text-sm font-extrabold text-foreground capitalize mt-0.5">{selectedTrend.keyword}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-card-border/50 py-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Search Score</span>
                    <p className="text-xl font-extrabold text-white mt-0.5">{selectedTrend.trendScore} <span className="text-xs text-muted-foreground font-normal">/ 100</span></p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Diff Index</span>
                    <p className="text-xl font-extrabold text-white mt-0.5">{selectedTrend.difficulty} <span className="text-xs text-muted-foreground font-normal">/ 100</span></p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Intent Category</span>
                  <p className="text-xs font-medium text-foreground bg-card/15 p-2 rounded-lg border border-card-border flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    {selectedTrend.searchIntent || 'Commercial/Local Intent'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Seasonality details</span>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-card/10 p-2 rounded-lg border border-card-border flex items-start gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-secondary mt-0.5 flex-shrink-0" />
                    <span>{selectedTrend.seasonality || 'Relatively stable search interest.'}</span>
                  </p>
                </div>

                {selectedTrend.relatedQueries && selectedTrend.relatedQueries.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-2">Related search queries</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTrend.relatedQueries.map((q, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-card/30 border border-card-border text-[10px] text-muted-foreground rounded-full select-all font-mono">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTrend.viralTopics && selectedTrend.viralTopics.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-2">Viral Related Topics</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTrend.viralTopics.map((topic, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-secondary/5 border border-secondary/15 text-[10px] text-secondary rounded font-mono">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {explanation && selectedTrend === trends[0] && (
                  <div className="border-t border-card-border/50 pt-4">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-2">Gemini Regional Breakdown</span>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line bg-card/5 p-3 rounded-lg border border-card-border max-h-48 overflow-y-auto">
                      {explanation}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Compass className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-xs text-muted-foreground">
                  Select a trending keyword from the list to analyze its regional intent and seasonality breakdowns.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
