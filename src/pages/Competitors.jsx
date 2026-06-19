import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Building, Search, Star, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { Loader } from '../components/Loader';

export const Competitors = () => {
  const { activeProject, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [competitors, setCompetitors] = useState([]);
  const [critique, setCritique] = useState('');

  const fetchCompetitors = async () => {
    console.log(activeProject._id);
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get(`/intelligence/competitors/${activeProject._id}`);
      setCompetitors(res.data.data);
    } catch {
      addNotification('error', 'Failed to retrieve competitor details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
    setCritique('');
  }, [activeProject]);

  const handleScrape = async () => {
    if (!activeProject) return;
    setCrawling(true);
    try {
      const res = await api.post('/intelligence/competitors', { projectId: activeProject._id });
      setCompetitors(res.data.data);
      setCritique(res.data.critique);
      addNotification('success', 'Competitors fetched and analyzed by Gemini!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to crawl Google Maps competitors';
      addNotification('error', msg);
    } finally {
      setCrawling(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-card-border text-center max-w-md mx-auto mt-12">
        <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Select Active Project</h3>
        <p className="text-sm text-muted-foreground mt-1">Please configure or select a project workspace to analyze local competitors.</p>
      </div>
    );
  }

  const searchQuery = `${activeProject.competitorKeyword} ${activeProject.location}`;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Competitor Intelligence</h1>
          <p className="text-sm text-muted-foreground">Scrape local business competitors using Google Maps endpoints</p>
        </div>
        <button
          onClick={handleScrape}
          disabled={crawling}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-primary/10"
        >
          {crawling ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Scrape Google Maps</span>
        </button>
      </div>

      {/* Target query summary */}
      <div className="glass-panel p-4 rounded-xl border border-card-border flex items-center gap-3 bg-card/30">
        <MapPin className="w-5 h-5 text-secondary flex-shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Search Target</p>
          <p className="text-xs text-foreground font-semibold">
            Query: <span className="font-mono text-foreground font-semibold">"{searchQuery}"</span>
          </p>
        </div>
      </div>

      {crawling && (
        <div className="glass-panel p-12 rounded-xl border border-card-border flex flex-col items-center justify-center">
          <Loader label="Crawling competitor addresses, price brackets, and popular products from Google Maps. Summarizing gaps with Gemini AI..." />
        </div>
      )}

      {!crawling && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Competitor list table */}
          <div className="glass-panel p-6 rounded-xl border border-card-border lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Local Competitors Directory</h2>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No competitors crawled yet. Click the "Scrape Google Maps" button to discover local rivals.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-card-border text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Rating</th>
                      <th className="py-3 px-2">Reviews</th>
                      <th className="py-3 px-2">Price</th>
                      <th className="py-3 px-2">Popular Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((comp) => (
                      <tr key={comp.id} className="border-b border-card-border/40 hover:bg-card/10 transition-colors">
                        <td className="py-3 px-2">
                          <p className="font-bold text-foreground text-sm">{comp.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-xs">{comp.address}</p>
                        </td>
                        <td className="py-3 px-2 font-mono">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                            {comp.rating || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-muted-foreground">
                          {comp.reviewsCount?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 px-2 text-foreground font-medium">
                          {comp.priceRange || 'Moderate'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {comp.popularItems.map((item, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-card text-[9px] border border-card-border text-muted-foreground">
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI critique */}
          <div className="glass-panel p-6 rounded-xl border border-card-border flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground">Competitor Critique</h2>
            </div>

            {critique ? (
              <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line overflow-y-auto max-h-[400px] pr-1">
                {critique}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <ShieldAlert className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-xs text-muted-foreground">
                  Trigger the crawler to generate a complete competitor breakdown and capitalize on local market weaknesses.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
