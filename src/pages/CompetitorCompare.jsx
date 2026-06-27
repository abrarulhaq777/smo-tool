import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, BarChart2, Sparkles, Check, Star, 
  HelpCircle, Lightbulb, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';

export const CompetitorCompare = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addNotification } = useStore();
  const [loading, setLoading] = useState(true);
  const [comparisons, setComparisons] = useState([]);

  // Get competitor IDs from query string (?ids=id1,id2)
  const queryParams = new URLSearchParams(location.search);
  const idsParam = queryParams.get('ids') || '';

  useEffect(() => {
    if (!idsParam) {
      addNotification('error', 'No competitors selected for comparison');
      navigate('/competitors');
      return;
    }

    const fetchComparisons = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/competitors/compare?ids=${idsParam}`);
        setComparisons(res.data.data);
      } catch (err) {
        addNotification('error', 'Failed to fetch comparison details');
        navigate('/competitors');
      } finally {
        setLoading(false);
      }
    };
    fetchComparisons();
  }, [idsParam]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Generating side-by-side competitor comparison...</p>
      </div>
    );
  }

  // Format Recharts Formats data
  // Output format: [ { name: 'Reels', 'Comp A': 4, 'Comp B': 10 }, { name: 'Images', ... } ]
  const formatCategories = ['Reels', 'Images', 'Carousels', 'Videos'];
  const formatChartData = formatCategories.map(format => {
    const row = { name: format };
    comparisons.forEach(comp => {
      const report = comp.report || {};
      const formats = report.overview || {};
      const key = 'total' + format; // totalReels, totalImages, totalCarousels, totalVideos
      row[comp.name] = formats[key] || 0;
    });
    return row;
  });

  // Format Recharts Strategy DNA data
  const dnaCategories = ['Educational', 'Promotional', 'Testimonial', 'FAQ', 'Behind The Scenes', 'Brand Awareness'];
  const dnaChartData = dnaCategories.map(cat => {
    const row = { name: cat };
    comparisons.forEach(comp => {
      const report = comp.report || {};
      const dna = report.categories || {};
      let key = cat.toLowerCase();
      // Handle key mappings
      if (cat === 'Behind The Scenes') key = 'behindTheScenes';
      if (cat === 'Brand Awareness') key = 'brandAwareness';
      row[comp.name] = dna[key] || 0;
    });
    return row;
  });

  const CHART_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/competitors')}
            className="p-2 rounded-lg border border-card-border hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Competitor Comparison</h1>
            <p className="text-sm text-muted-foreground">Compare performance, formats, and strategy DNA side-by-side</p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Metrics Table Card */}
      <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="w-4.5 h-4.5 text-primary" />
          <span>Core Engagement Metrics</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-card-border text-muted-foreground uppercase font-semibold">
                <th className="py-3 px-4">Metric</th>
                {comparisons.map((comp, idx) => (
                  <th key={idx} className="py-3 px-4 text-center border-l border-card-border/40 min-w-[150px]">
                    {comp.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Google Maps Rating */}
              <tr className="border-b border-card-border/40 hover:bg-card/5 transition-all">
                <td className="py-3 px-4 font-semibold text-foreground">Google Maps Rating</td>
                {comparisons.map((comp, idx) => (
                  <td key={idx} className="py-3 px-4 text-center border-l border-card-border/40 font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      {comp.rating || 'N/A'} ({comp.reviewsCount || 0} reviews)
                    </span>
                  </td>
                ))}
              </tr>

              {/* Total Posts */}
              <tr className="border-b border-card-border/40 hover:bg-card/5 transition-all">
                <td className="py-3 px-4 font-semibold text-foreground">Total Posts Crawled</td>
                {comparisons.map((comp, idx) => (
                  <td key={idx} className="py-3 px-4 text-center border-l border-card-border/40 font-mono text-sm">
                    {comp.report?.overview?.totalPosts || 0}
                  </td>
                ))}
              </tr>

              {/* Avg Likes */}
              <tr className="border-b border-card-border/40 hover:bg-card/5 transition-all">
                <td className="py-3 px-4 font-semibold text-foreground">Average Likes</td>
                {comparisons.map((comp, idx) => (
                  <td key={idx} className="py-3 px-4 text-center border-l border-card-border/40 font-mono font-bold text-foreground">
                    {comp.report?.engagement?.averageLikes !== undefined && comp.report?.engagement?.averageLikes !== null ? Math.round(comp.report.engagement.averageLikes) : '0'}
                  </td>
                ))}
              </tr>

              {/* Avg Comments */}
              <tr className="border-b border-card-border/40 hover:bg-card/5 transition-all">
                <td className="py-3 px-4 font-semibold text-foreground">Average Comments</td>
                {comparisons.map((comp, idx) => (
                  <td key={idx} className="py-3 px-4 text-center border-l border-card-border/40 font-mono">
                    {comp.report?.engagement?.averageComments !== undefined && comp.report?.engagement?.averageComments !== null ? Math.round(comp.report.engagement.averageComments) : '0'}
                  </td>
                ))}
              </tr>

              {/* Average Views */}
              <tr className="border-b border-card-border/40 hover:bg-card/5 transition-all">
                <td className="py-3 px-4 font-semibold text-foreground">Average Video Views</td>
                {comparisons.map((comp, idx) => (
                  <td key={idx} className="py-3 px-4 text-center border-l border-card-border/40 font-mono text-muted-foreground">
                    {comp.report?.engagement?.averageViews !== undefined && comp.report?.engagement?.averageViews !== null ? Math.round(comp.report.engagement.averageViews) : '0'}
                  </td>
                ))}
              </tr>

              {/* Weekly Frequency */}
              <tr className="border-b border-card-border/40 hover:bg-card/5 transition-all">
                <td className="py-3 px-4 font-semibold text-foreground">Posts Per Week</td>
                {comparisons.map((comp, idx) => (
                  <td key={idx} className="py-3 px-4 text-center border-l border-card-border/40 font-mono">
                    {comp.report?.postingPattern?.postsPerWeek !== undefined && comp.report?.postingPattern?.postsPerWeek !== null ? Math.round(comp.report.postingPattern.postsPerWeek) : '0'}
                  </td>
                ))}
              </tr>

              {/* Consistency */}
              <tr className="hover:bg-card/5 transition-all">
                <td className="py-3 px-4 font-semibold text-foreground">Posting Consistency</td>
                {comparisons.map((comp, idx) => (
                  <td key={idx} className="py-3 px-4 text-center border-l border-card-border/40 text-muted-foreground">
                    {comp.report?.postingPattern?.consistencyScore !== undefined && comp.report?.postingPattern?.consistencyScore !== null ? `${comp.report.postingPattern.consistencyScore}/100` : 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Recharts Grouped Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Post Format comparison */}
        <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
          <h3 className="text-sm font-bold text-foreground">Post Format Mix Comparison</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#F1F5F9', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                {comparisons.map((comp, idx) => (
                  <Bar 
                    key={idx} 
                    dataKey={comp.name} 
                    fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                    radius={[4, 4, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Strategy DNA comparison */}
        <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
          <h3 className="text-sm font-bold text-foreground">Content Strategy DNA Comparison (%)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dnaChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#F1F5F9', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                {comparisons.map((comp, idx) => (
                  <Bar 
                    key={idx} 
                    dataKey={comp.name} 
                    fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                    radius={[4, 4, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SWOT / Gap Comparisons Side-by-Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {comparisons.map((comp, idx) => {
          const report = comp.report || {};
          return (
            <div key={idx} className="glass-panel p-6 rounded-xl border border-card-border space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-card-border/40">
                <h3 className="font-bold text-foreground text-sm">{comp.name} Gaps</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono bg-card px-2 py-0.5 rounded border border-card-border">
                  Competitor {idx + 1}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Gaps */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-orange-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Content Gaps</span>
                  </p>
                  <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                    {(report.contentGaps || []).slice(0, 3).map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-primary flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Recommendations</span>
                  </p>
                  <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                    {(report.recommendations || []).slice(0, 3).map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Recommendation Action Plan */}
      <div className="glass-panel p-6 rounded-2xl border border-card-border bg-gradient-to-tr from-card/30 to-secondary/5 space-y-3">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
          <span>Strategic Market Capture Plan</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Based on the comparison of your top rivals, we've identified the main entry points for your brand. While the competition focuses heavily on static text-based categories, there is a major visual gap in video reach. Launching short-form Reels and video customer reviews will give your business a direct engagement advantage in this local target demographic.
        </p>
      </div>
    </div>
  );
};
