import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Sparkles, Copy, Check, Download, Clock, Calendar } from 'lucide-react';
import { Loader } from '../components/Loader';

export const Strategy = () => {
  const { activeProject, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  useEffect(() => {
    fetchStrategy();
  }, [activeProject]);

  const handleGenerate = async () => {
    if (!activeProject) return;
    setGenerating(true);
    try {
      const res = await api.post('/strategy/generate', { projectId: activeProject._id });
      setPlan(res.data.plan);
      addNotification('success', 'Gemini AI generated a customized 7-day social strategy!');
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
    addNotification('info', 'Caption copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportPDF = () => {
    if (!plan || !plan.days) return;

    // Create a new print window with clean styled document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addNotification('error', 'Popup blocker prevented exporting print template.');
      return;
    }

    const daysHTML = plan.days.map((day) => `
      <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; page-break-inside: avoid;">
        <h3 style="margin-top: 0; color: #4f46e5; border-bottom: 2px solid #f4f4f5; padding-bottom: 6px;">Day ${day.dayIndex}: ${day.goal}</h3>
        <p><strong>Content Format:</strong> ${day.contentType}</p>
        <p><strong>Reel/Post Idea:</strong> ${day.reelIdea}</p>
        <p><strong>Best Time:</strong> ${day.bestPostingTime}</p>
        <p><strong>Caption:</strong></p>
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; font-size: 13px; color: #334155;">${day.caption}</div>
        <p><strong>Hashtags:</strong> ${day.hashtags.map((t) => `#${t}`).join(' ')}</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${activeProject?.businessName} - 7-Day Social Strategy</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 5px; }
            p.meta { font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 40px; }
          </style>
        </head>
        <body>
          <h1>7-Day AI Social Media Plan</h1>
          <p class="meta">Generated for ${activeProject?.businessName} (${activeProject?.category}) - Target Audience: ${activeProject?.targetAudience}</p>
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

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Strategy Planner</h1>
          <p className="text-sm text-muted-foreground">Compile competitor critque & search intent spikes into a 7-day plan</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {plan && (
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-card-border hover:bg-card/25 rounded-lg text-sm font-semibold transition-all text-foreground"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/10 disabled:opacity-50 rounded-lg text-sm font-semibold transition-all"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{plan ? 'Regenerate Strategy' : 'Generate Strategy'}</span>
          </button>
        </div>
      </div>

      {generating && (
        <div className="glass-panel p-12 rounded-xl border border-card-border flex flex-col items-center justify-center">
          <Loader label="Evaluating scraped competitor models. Benchmarking regional keyword spikes. Spawning 7-day posting schedules, hook ideas, and schedules using Gemini..." />
        </div>
      )}

      {!generating && (
        <div className="space-y-6">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !plan ? (
            <div className="glass-panel p-12 rounded-xl border border-card-border text-center flex flex-col items-center justify-center max-w-lg mx-auto">
              <Sparkles className="w-10 h-10 text-secondary mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-foreground mb-1">Plan Draft Empty</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Compile your local competitors and search heat keyword list, then let Gemini AI build a 7-day social strategy.
              </p>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-md shadow-primary/20 transition-all"
              >
                Compile Strategy Calendar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {plan.days.map((day, index) => {
                const dayId = `day_${day.dayIndex}`;
                return (
                  <div
                    key={index}
                    className="glass-panel p-6 rounded-xl border border-card-border hover:border-card-border/80 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-primary to-secondary" />

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-4">
                      {/* Day description */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                            Day {day.dayIndex}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            Format: {day.contentType}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground">{day.goal}</h3>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Post / Reel Video Idea</p>
                          <p className="text-sm text-muted-foreground">{day.reelIdea}</p>
                        </div>

                        {/* Badges hashtags */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {day.hashtags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-card border border-card-border text-muted-foreground font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Scheduling, Caption copies */}
                      <div className="w-full md:w-80 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-card-border pt-4 md:pt-0 md:pl-6 flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <Clock className="w-4 h-4 text-secondary" />
                          <span>Best Posting Time:</span>
                          <span className="text-white font-mono">{day.bestPostingTime}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Suggested Caption</span>
                            <button
                              onClick={() => handleCopy(day.caption, dayId)}
                              className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1 transition-colors"
                            >
                              {copiedId === dayId ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-success" />
                                  <span className="text-success">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="p-3 rounded-lg bg-card/25 border border-card-border text-xs text-muted-foreground font-mono leading-relaxed line-clamp-4 select-all">
                            {day.caption}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
