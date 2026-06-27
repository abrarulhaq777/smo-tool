import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import {
  Building, Search, Star, ShieldAlert, Sparkles, MapPin,
  FileText, Globe, RefreshCw, Layers,
  Check, X, Link, BarChart2, Plus, Edit2
} from 'lucide-react';
import { Loader } from '../components/Loader';

const Instagram = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Facebook = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const Competitors = () => {
  const { activeProject, addNotification } = useStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [competitors, setCompetitors] = useState([]);
  const [critique, setCritique] = useState('');

  // Social profiles state
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [savingSocials, setSavingSocials] = useState(false);

  // Loading states for actions
  const [fetchingPlatform, setFetchingPlatform] = useState(null); // { id, platform }
  const [analyzingPlatform, setAnalyzingPlatform] = useState(null); // { id, platform }

  // Checkbox selection for comparison
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchCompetitors = async () => {
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
    setSelectedIds([]);
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

  const openSocialModal = (comp) => {
    setSelectedCompetitor(comp);
    setInstagramUrl(comp.instagramUrl || '');
    setFacebookUrl(comp.facebookUrl || '');
    setShowModal(true);
  };

  const handleSaveSocials = async () => {
    if (!selectedCompetitor) return;
    setSavingSocials(true);
    try {
      await api.post(`/competitors/${selectedCompetitor._id}/social-profiles`, {
        instagramUrl,
        facebookUrl
      });
      addNotification('success', 'Social URLs updated successfully');
      setShowModal(false);
      fetchCompetitors();
    } catch (err) {
      addNotification('error', 'Failed to update social profiles');
    } finally {
      setSavingSocials(false);
    }
  };

  const handleFetchPosts = async (comp, platform) => {
    const compId = comp.id || comp._id;
    setFetchingPlatform({ id: compId, platform });
    try {
      const res = await api.post(`/competitors/${compId}/fetch-posts`, { platform });
      addNotification('success', res.data.message || `${platform.toUpperCase()} posts crawled successfully!`);
      fetchCompetitors();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to fetch ${platform} posts from Apify`;
      addNotification('error', msg);
    } finally {
      setFetchingPlatform(null);
    }
  };

  const handleAnalyzePosts = async (comp, platform) => {
    const compId = comp.id || comp._id;
    setAnalyzingPlatform({ id: compId, platform });
    try {
      const res = await api.post(`/competitors/${compId}/analyze`, { platform });
      addNotification('success', res.data.message || `AI ${platform.toUpperCase()} analysis complete!`);
      fetchCompetitors();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to run AI ${platform} analysis`;
      addNotification('error', msg);
    } finally {
      setAnalyzingPlatform(null);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      addNotification('warning', 'Please select at least 2 competitors to compare');
      return;
    }
    navigate(`/competitors/compare?ids=${selectedIds.join(',')}`);
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

  const searchQuery = `${activeProject.competitorKeyword || activeProject.category} ${activeProject.location}`;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Competitor Intelligence</h1>
          <p className="text-sm text-muted-foreground">Scrape and analyze local competitors' social profiles</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length >= 2 && (
            <button
              onClick={handleCompare}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-primary/10 hover:opacity-90"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Compare Selected ({selectedIds.length})</span>
            </button>
          )}

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
          <Loader label="Crawling competitor details from Google Maps. Summarizing gaps with Gemini AI..." />
        </div>
      )}

      {!crawling && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Competitor list directory */}
          <div className="glass-panel p-6 rounded-xl border border-card-border xl:col-span-3 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Competitors Directory</h2>
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
                      <th className="py-3 px-2 w-8">Select</th>
                      <th className="py-3 px-2">Name & Info</th>
                      <th className="py-3 px-2 w-28">Google Stats</th>
                      <th className="py-3 px-2">Social Channels</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((comp) => {
                      const isIgConnected = !!comp.instagramUrl;
                      const isFbConnected = !!comp.facebookUrl;
                      const hasSocials = isIgConnected || isFbConnected;

                      return (
                        <tr key={comp.id} className="border-b border-card-border/40 hover:bg-card/10 transition-colors">
                          {/* Checkbox select */}
                          <td className="py-3 px-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(comp.id)}
                              onChange={() => handleToggleSelect(comp.id)}
                              disabled={!comp.hasReport}
                              title={comp.hasReport ? "Select to compare" : "Generate report first to compare"}
                              className="w-4 h-4 rounded border-card-border text-primary focus:ring-primary/20 accent-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          {/* Name and address */}
                          <td className="py-3 px-2">
                            <p className="font-bold text-foreground text-sm">{comp.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-xs">{comp.address}</p>
                          </td>
                          {/* Google rating/reviews */}
                          <td className="py-3 px-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 font-mono text-foreground font-semibold">
                                <Star className="w-3 h-3 text-warning fill-warning" />
                                {comp.rating || 'N/A'}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {comp.reviewsCount?.toLocaleString() || 0} reviews
                              </span>
                            </div>
                          </td>
                          {/* Connected socials */}
                          <td className="py-3 px-2">
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              {/* Instagram Row */}
                              <div className="flex items-center justify-between gap-2 border-b border-card-border/20 pb-1">
                                <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                                  <Instagram className={`w-3.5 h-3.5 flex-shrink-0 ${isIgConnected ? 'text-pink-500' : 'text-muted-foreground opacity-40'}`} />
                                  {isIgConnected ? (
                                    <span className="text-[10px] text-foreground font-semibold truncate" title={comp.instagramUrl}>
                                      @{comp.instagramUsername || 'connected'}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-muted-foreground opacity-60 font-medium">Not Connected</span>
                                  )}
                                </div>
                                {isIgConnected && (
                                  <div className="flex items-center gap-1.5">
                                    {/* Fetch IG */}
                                    <button
                                      onClick={() => handleFetchPosts(comp, 'instagram')}
                                      disabled={fetchingPlatform !== null || analyzingPlatform !== null}
                                      className="p-1 rounded hover:bg-card-hover text-muted-foreground hover:text-blue-500 disabled:opacity-40 transition-colors"
                                      title="Scrape IG Posts"
                                    >
                                      {fetchingPlatform?.id === (comp.id || comp._id) && fetchingPlatform?.platform === 'instagram' ? (
                                        <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-3.5 h-3.5 text-muted-foreground hover:text-blue-500" />
                                      )}
                                    </button>
                                    {/* Analyze IG */}
                                    <button
                                      onClick={() => handleAnalyzePosts(comp, 'instagram')}
                                      disabled={!comp.instagramLastFetchedAt && !comp.lastFetchedAt || fetchingPlatform !== null || analyzingPlatform !== null}
                                      className="p-1 rounded hover:bg-card-hover text-muted-foreground hover:text-purple-500 disabled:opacity-40 transition-colors"
                                      title={comp.instagramLastFetchedAt || comp.lastFetchedAt ? "Run IG AI Analysis" : "Scrape posts first"}
                                    >
                                      {analyzingPlatform?.id === (comp.id || comp._id) && analyzingPlatform?.platform === 'instagram' ? (
                                        <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground hover:text-purple-500" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Facebook Row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                                  <Facebook className={`w-3.5 h-3.5 flex-shrink-0 ${isFbConnected ? 'text-blue-500' : 'text-muted-foreground opacity-40'}`} />
                                  {isFbConnected ? (
                                    <span className="text-[10px] text-foreground font-semibold truncate" title={comp.facebookUrl}>
                                      {comp.facebookPageName || 'connected'}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-muted-foreground opacity-60 font-medium">Not Connected</span>
                                  )}
                                </div>
                                {isFbConnected && (
                                  <div className="flex items-center gap-1.5">
                                    {/* Fetch FB */}
                                    <button
                                      onClick={() => handleFetchPosts(comp, 'facebook')}
                                      disabled={fetchingPlatform !== null || analyzingPlatform !== null}
                                      className="p-1 rounded hover:bg-card-hover text-muted-foreground hover:text-blue-500 disabled:opacity-40 transition-colors"
                                      title="Scrape FB Posts"
                                    >
                                      {fetchingPlatform?.id === (comp.id || comp._id) && fetchingPlatform?.platform === 'facebook' ? (
                                        <div className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-3.5 h-3.5 text-muted-foreground hover:text-blue-500" />
                                      )}
                                    </button>
                                    {/* Analyze FB */}
                                    <button
                                      onClick={() => handleAnalyzePosts(comp, 'facebook')}
                                      disabled={!comp.facebookLastFetchedAt && !comp.lastFetchedAt || fetchingPlatform !== null || analyzingPlatform !== null}
                                      className="p-1 rounded hover:bg-card-hover text-muted-foreground hover:text-purple-500 disabled:opacity-40 transition-colors"
                                      title={comp.facebookLastFetchedAt || comp.lastFetchedAt ? "Run FB AI Analysis" : "Scrape posts first"}
                                    >
                                      {analyzingPlatform?.id === (comp.id || comp._id) && analyzingPlatform?.platform === 'facebook' ? (
                                        <div className="w-3.5 h-3.5 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground hover:text-purple-500" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Actions */}
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Profiles */}
                              <button
                                onClick={() => openSocialModal(comp)}
                                className="p-1.5 rounded-lg border border-card-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
                                title="Configure Social Accounts"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* View Report */}
                              <button
                                onClick={() => navigate(`/competitors/${comp.id || comp._id}/report`)}
                                disabled={!comp.hasReport}
                                className="p-1.5 rounded-lg border border-card-border hover:border-success/20 hover:bg-success/5 text-muted-foreground hover:text-success transition-all disabled:opacity-40"
                                title="View Content Report"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI critique */}
          <div className="glass-panel p-6 rounded-xl border border-card-border flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground">Local Market Overview</h2>
            </div>

            {critique ? (
              <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line overflow-y-auto max-h-[450px] pr-1">
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

      {/* Add Social Profile Modal */}
      {showModal && selectedCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-card-border shadow-2xl relative bg-card">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-card-border hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <span>Connect Competitor Socials</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Provide social profile links for <strong className="text-foreground">{selectedCompetitor.name}</strong> to scrape their post activity.
            </p>

            <div className="space-y-4 mb-6">
              {/* Instagram URL input */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Instagram Profile Link
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/profile_name/"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-card-border bg-card/50 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Facebook URL input */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Facebook Page Link
                </label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://www.facebook.com/page_name/"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-card-border bg-card/50 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-card-border/50 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-card-border hover:bg-card-hover rounded-lg text-xs font-semibold text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSocials}
                disabled={savingSocials}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-all shadow-md"
              >
                {savingSocials ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Links</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
