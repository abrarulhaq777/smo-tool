import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { 
  Sparkles, Copy, Check, Download, Clock, Calendar, 
  Plus, Trash2, AlertCircle, Info, Award, BarChart3, Users, Target 
} from 'lucide-react';
import { Loader } from '../components/Loader';

export const Strategy = () => {
  const { activeProject, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  
  // Client Analytics counts
  const [analyticsStats, setAnalyticsStats] = useState({ instagramCount: 0, facebookCount: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Competitors inputs (dynamic list)
  const [competitors, setCompetitors] = useState([
    { name: '', instagramUrl: '', facebookUrl: '' }
  ]);

  const fetchStrategy = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get(`/strategy/${activeProject._id}`);
      setPlan(res.data.data);
    } catch {
      addNotification('error', 'Failed to retrieve strategy plan');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientAnalytics = async () => {
    if (!activeProject) return;
    setAnalyticsLoading(true);
    try {
      const res = await api.get(`/analytics/${activeProject._id}`);
      const posts = res.data.data || [];
      const igCount = posts.filter(p => String(p.platform).toLowerCase() === 'instagram').length;
      const fbCount = posts.filter(p => String(p.platform).toLowerCase() === 'facebook').length;
      setAnalyticsStats({ instagramCount: igCount, facebookCount: fbCount });
    } catch (err) {
      console.error('Failed to load client analytics summary:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
    fetchClientAnalytics();
    // Reset competitor form
    setCompetitors([{ name: '', instagramUrl: '', facebookUrl: '' }]);
  }, [activeProject]);

  const handleAddCompetitor = () => {
    if (competitors.length >= 3) {
      addNotification('warning', 'You can analyze up to 3 competitors side-by-side.');
      return;
    }
    setCompetitors([...competitors, { name: '', instagramUrl: '', facebookUrl: '' }]);
  };

  const handleRemoveCompetitor = (index) => {
    const updated = competitors.filter((_, i) => i !== index);
    setCompetitors(updated.length === 0 ? [{ name: '', instagramUrl: '', facebookUrl: '' }] : updated);
  };

  const handleCompetitorChange = (index, field, value) => {
    const updated = [...competitors];
    updated[index][field] = value;
    setCompetitors(updated);
  };

  const handleGenerate = async () => {
    if (!activeProject) return;
    
    // Filtering empty rows
    const activeCompetitors = competitors.filter(c => c.name.trim() !== '');

    // Validation checks
    const hasAnalytics = (analyticsStats.instagramCount + analyticsStats.facebookCount) > 0;
    if (!hasAnalytics) {
      addNotification('error', 'No client analytics data logged yet. Please log Instagram or Facebook posts in the Analytics tab first.');
      return;
    }

    if (activeCompetitors.length > 0) {
      const hasUrls = activeCompetitors.some(c => c.instagramUrl.trim() || c.facebookUrl.trim());
      if (!hasUrls) {
        addNotification('error', 'Please provide an Instagram or Facebook URL for the selected competitor.');
        return;
      }

      // Check URL validation
      const isValidSocialUrl = (url, platform) => {
        if (!url) return false;
        try {
          const parsed = new URL(url.trim());
          const hostname = parsed.hostname.toLowerCase();
          return hostname.includes(platform === 'instagram' ? 'instagram.com' : 'facebook.com');
        } catch {
          return false;
        }
      };

      for (const comp of activeCompetitors) {
        const hasIg = !!comp.instagramUrl && comp.instagramUrl.trim() !== '';
        const hasFb = !!comp.facebookUrl && comp.facebookUrl.trim() !== '';
        if (hasIg && !isValidSocialUrl(comp.instagramUrl, 'instagram')) {
          addNotification('error', `Invalid Instagram URL for competitor ${comp.name}.`);
          return;
        }
        if (hasFb && !isValidSocialUrl(comp.facebookUrl, 'facebook')) {
          addNotification('error', `Invalid Facebook URL for competitor ${comp.name}.`);
          return;
        }
      }
    }

    setGenerating(true);
    try {
      const res = await api.post('/strategy/generate', { 
        projectId: activeProject._id,
        competitors: activeCompetitors
      });
      setPlan(res.data.plan);
      addNotification('success', 'Gemini AI successfully completed the social media strategy!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate strategy';
      addNotification('error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addNotification('info', 'Copy successful!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportPDF = () => {
    if (!plan || !plan.days) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addNotification('error', 'Popup blocker prevented exporting print template.');
      return;
    }

    const daysHTML = plan.days.map((day) => `
      <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; page-break-inside: avoid;">
        <h3 style="margin-top: 0; color: #4f46e5; border-bottom: 2px solid #f4f4f5; padding-bottom: 6px;">${day.day || 'Day'}: ${day.contentIdea}</h3>
        <p><strong>Platform:</strong> ${day.platform} | <strong>Format:</strong> ${day.postType}</p>
        <p><strong>Creative Direction:</strong> ${day.creativeDirection}</p>
        <p><strong>Best Time:</strong> ${day.bestTimeToPost} (${day.whyThisTime})</p>
        <p><strong>Why Post This:</strong> ${day.whyPostThis}</p>
        <p><strong>Suggested Caption:</strong></p>
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; font-size: 13px; color: #334155;">${day.captionDirection}</div>
        <p><strong>Expected Outcome:</strong> ${day.expectedOutcome}</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${activeProject?.businessName} - social media strategy</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 5px; }
            p.meta { font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 40px; }
          </style>
        </head>
        <body>
          <h1>${plan.title || '7-Day Social Strategy Plan'}</h1>
          <p class="meta">Generated for ${activeProject?.businessName} (${activeProject?.category})</p>
          <p><strong>Summary:</strong> ${plan.summary}</p>
          ${daysHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!activeProject) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-card-border text-center max-w-md mx-auto mt-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Select Active Project</h3>
        <p className="text-sm text-muted-foreground mt-1">Configure or select a project workspace to plan strategies.</p>
      </div>
    );
  }

  const clientPostsCount = analyticsStats.instagramCount + analyticsStats.facebookCount;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Strategy Planner</h1>
          <p className="text-sm text-muted-foreground">Scrape competitor post metrics and compile dynamic posting plans</p>
        </div>

        {plan && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-card-border hover:bg-card/25 rounded-lg text-sm font-semibold transition-all text-foreground"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        )}
      </div>

      {generating && (
        <div className="glass-panel p-12 rounded-xl border border-card-border flex flex-col items-center justify-center min-h-[300px]">
          <Loader label="Connecting to Apify actors... Scraping competitor post schedules and reactions... Analyzing client data... Feeding insights to Gemini AI..." />
        </div>
      )}

      {!generating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Config Panel (Client Analytics + Competitor URL Form) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Project Analytics Info */}
            <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Client Social Analytics</span>
              </h2>
              
              {analyticsLoading ? (
                <div className="py-4 text-center text-xs text-muted-foreground">Loading logged posts...</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Instagram posts logged:</span>
                    <span className={`font-mono font-bold ${analyticsStats.instagramCount > 0 ? 'text-success' : 'text-warning'}`}>
                      {analyticsStats.instagramCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Facebook posts logged:</span>
                    <span className={`font-mono font-bold ${analyticsStats.facebookCount > 0 ? 'text-success' : 'text-warning'}`}>
                      {analyticsStats.facebookCount}
                    </span>
                  </div>
                  
                  {clientPostsCount === 0 ? (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-[11px] text-warning flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>No analytics logs found. Please log some post statistics in the Analytics tab first.</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-[11px] text-success flex items-start gap-2">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Ready! Found {clientPostsCount} logged social analytics entries.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Competitor Inputs Form */}
            <div className="glass-panel p-6 rounded-xl border border-card-border space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <span>Competitor Benchmarking</span>
                </h2>
                <button
                  onClick={handleAddCompetitor}
                  disabled={competitors.length >= 3}
                  className="p-1 rounded bg-card hover:bg-card-hover border border-card-border text-primary transition-colors disabled:opacity-50"
                  title="Add competitor"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Enter competitors to scrape post history from Apify. Leaves empty to generate strategy based on trends.
              </p>

              <div className="space-y-4 pt-2">
                {competitors.map((comp, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-card/45 border border-card-border relative space-y-3">
                    <button
                      onClick={() => handleRemoveCompetitor(idx)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Remove slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-xs font-semibold text-white">Competitor #{idx + 1}</div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Name</label>
                      <input
                        type="text"
                        placeholder="e.g. competitor"
                        value={comp.name}
                        onChange={(e) => handleCompetitorChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-card/60 border border-card-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Instagram URL</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/profile"
                        value={comp.instagramUrl}
                        onChange={(e) => handleCompetitorChange(idx, 'instagramUrl', e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-card/60 border border-card-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Facebook URL</label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/page"
                        value={comp.facebookUrl}
                        onChange={(e) => handleCompetitorChange(idx, 'facebookUrl', e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-card/60 border border-card-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={clientPostsCount === 0 || generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg disabled:opacity-40 rounded-lg text-sm font-semibold transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{plan ? 'Regenerate Strategy' : 'Generate AI Strategy'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Results Display (AI Strategy Output) */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !plan ? (
              <div className="glass-panel p-12 rounded-xl border border-card-border text-center flex flex-col items-center justify-center min-h-[400px]">
                <Sparkles className="w-12 h-12 text-secondary mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-foreground mb-2">No Active Strategy Draft</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Configure competitor URLs and click **Generate AI Strategy** to perform comparative analysis and construct your 7-day social media plan.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Summary Section */}
                <div className="glass-panel p-6 rounded-xl border border-card-border space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary animate-pulse" />
                    <h2 className="text-xl font-extrabold text-foreground">{plan.title || 'Growth Strategy Overview'}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{plan.summary}</p>
                  
                  {plan.competitorsAnalyzed?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Competitors Benchmarked:</span>
                      <div className="flex flex-wrap gap-2">
                        {plan.competitorsAnalyzed.map((c, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comparative Platform Insights */}
                {plan.platformInsights && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Instagram */}
                    {plan.platformInsights.instagram && (
                      <div className="glass-panel p-5 rounded-xl border border-card-border space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-full -mr-5 -mt-5" />
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-pink-500" />
                          <span>Instagram Audit</span>
                        </h3>
                        <div className="space-y-2 text-xs">
                          <p><strong className="text-muted-foreground block">Client Performance:</strong> <span className="text-foreground">{plan.platformInsights.instagram.currentPerformance}</span></p>
                          <p><strong className="text-muted-foreground block">Competitor Findings:</strong> <span className="text-foreground">{plan.platformInsights.instagram.competitorFindings}</span></p>
                          <p className="p-2 rounded bg-pink-500/5 border border-pink-500/10 text-pink-300">
                            <strong className="block text-[10px] uppercase font-bold text-pink-400">Opportunity:</strong>
                            {plan.platformInsights.instagram.opportunity}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Facebook */}
                    {plan.platformInsights.facebook && (
                      <div className="glass-panel p-5 rounded-xl border border-card-border space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-5 -mt-5" />
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Facebook Audit</span>
                        </h3>
                        <div className="space-y-2 text-xs">
                          <p><strong className="text-muted-foreground block">Client Performance:</strong> <span className="text-foreground">{plan.platformInsights.facebook.currentPerformance}</span></p>
                          <p><strong className="text-muted-foreground block">Competitor Findings:</strong> <span className="text-foreground">{plan.platformInsights.facebook.competitorFindings}</span></p>
                          <p className="p-2 rounded bg-blue-500/5 border border-blue-500/10 text-blue-300">
                            <strong className="block text-[10px] uppercase font-bold text-blue-400">Opportunity:</strong>
                            {plan.platformInsights.facebook.opportunity}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 7-Day Posting Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>7-Day Social Content Plan</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {(plan.days || []).map((day, idx) => {
                      const dayId = `day_${idx + 1}`;
                      const isIg = String(day.platform).toLowerCase() === 'instagram';
                      return (
                        <div key={idx} className="glass-panel p-5 rounded-xl border border-card-border relative overflow-hidden flex flex-col md:flex-row gap-5">
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${isIg ? 'bg-pink-500' : 'bg-blue-500'}`} />
                          
                          <div className="flex-1 space-y-3 pl-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase font-mono px-2 py-0.5 bg-card/65 rounded border border-card-border text-white">
                                {day.day || `Day ${idx + 1}`}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isIg ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                {day.platform} • {day.postType}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-foreground">{day.contentIdea}</h4>
                              <p className="text-xs text-muted-foreground mt-1"><strong className="text-foreground">Creative Direction:</strong> {day.creativeDirection}</p>
                            </div>

                            <div className="p-2.5 rounded bg-primary/5 border border-primary/10 text-xs">
                              <span className="text-[10px] uppercase font-bold text-primary block mb-0.5">Why Post This:</span>
                              <span className="text-muted-foreground">{day.whyPostThis}</span>
                            </div>
                          </div>

                          <div className="w-full md:w-72 flex flex-col justify-between gap-3 border-t md:border-t-0 md:border-l border-card-border pt-3 md:pt-0 md:pl-5 flex-shrink-0">
                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-white mb-1">
                                <Clock className="w-3.5 h-3.5 text-secondary" />
                                <span>Time: {day.bestTimeToPost}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-normal">{day.whyThisTime}</p>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Caption Direction</span>
                                <button
                                  onClick={() => handleCopy(day.captionDirection, dayId)}
                                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                                >
                                  {copiedId === dayId ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedId === dayId ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <p className="p-2 rounded bg-card border border-card-border text-[10px] font-mono text-muted-foreground leading-relaxed line-clamp-3 select-all">
                                {day.captionDirection}
                              </p>
                            </div>

                            <div className="text-[10px] font-semibold text-success flex items-start gap-1">
                              <Target className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Expected: {day.expectedOutcome}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Content Pillars */}
                {plan.contentPillars?.length > 0 && (
                  <div className="glass-panel p-6 rounded-xl border border-card-border space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span>Social Content Pillars</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.contentPillars.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-card/25 border border-card-border text-xs space-y-1">
                          <strong className="text-white block">{p.pillar}</strong>
                          <span className="text-muted-foreground">{p.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Recommendations */}
                {plan.recommendations?.length > 0 && (
                  <div className="glass-panel p-6 rounded-xl border border-card-border space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-secondary" />
                      <span>Final Actionable Recommendations</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-xs text-muted-foreground">
                      {plan.recommendations.map((rec, i) => (
                        <li key={i} className="leading-relaxed"><span className="text-foreground">{rec}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
