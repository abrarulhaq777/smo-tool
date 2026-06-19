import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  Sparkles, ArrowRight, BarChart3, TrendingUp, Users, ShieldAlert,
  CheckCircle, Star, Target, Zap, Globe, Flame, MessageSquare, 
  Heart, Bookmark, Eye, ArrowUpRight, Play, Sun, Moon, LogIn, Menu, X, PlusCircle, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Landing = () => {
  const { user, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const token = localStorage.getItem('trendbite_token');
  const isLoggedIn = !!token;

  // Simulator Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [platform, setPlatform] = useState('Instagram');
  const [postLink, setPostLink] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);

  // General Page State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'

  const steps = [
    'Initializing secure social pipeline...',
    'Parsing post content metrics & caption tags...',
    'Extracting metadata and video play structures...',
    'Running reach-engagement intelligence filters...',
    'Invoking Gemini AI for hooks and hashtags...'
  ];

  useEffect(() => {
    let interval;
    if (analyzing) {
      interval = setInterval(() => {
        setAnalysisStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setAnalyzing(false);
            setAnalysisStep(0);
            generateMockResults();
            return 0;
          }
        });
      }, 900);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const generateMockResults = () => {
    // Generate statistics based on platform
    let reach = Math.floor(Math.random() * 45000) + 12000;
    let likes = Math.floor(reach * (Math.random() * 0.08 + 0.04));
    let comments = Math.floor(likes * (Math.random() * 0.12 + 0.05));
    let shares = Math.floor(likes * (Math.random() * 0.25 + 0.1));
    let saves = Math.floor(likes * (Math.random() * 0.15 + 0.05));
    let engRate = (((likes + comments + shares + saves) / reach) * 100).toFixed(2);

    const isVideo = platform === 'Instagram' || platform === 'TikTok' || platform === 'YouTube';
    const watchTime = isVideo ? (Math.random() * 180 + 30).toFixed(1) : 0;

    const chartData = [
      { name: 'Your Post', rate: parseFloat(engRate) },
      { name: 'Niche Avg', rate: platform === 'TikTok' ? 5.2 : platform === 'Instagram' ? 3.4 : 2.8 },
      { name: 'Competitors', rate: platform === 'TikTok' ? 6.1 : platform === 'Instagram' ? 4.1 : 3.2 }
    ];

    const hooks = [
      'Stop scrolling if you want to grow your brand in 2026...',
      'This single secret changed the way we handle client reach.',
      'Here is a quick breakdown of what competitors do not tell you...'
    ];

    const hashtags = [
      'socialstrategy',
      'marketingagency',
      'competitorintelligence',
      'aicopilot',
      'trendbite'
    ];

    setAnalysisResult({
      reach,
      likes,
      comments,
      shares,
      saves,
      engRate,
      watchTime,
      chartData,
      hooks,
      hashtags
    });
  };

  const handleStartAnalysis = (e) => {
    e.preventDefault();
    if (!postLink) return;
    setAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisResult(null);
  };

  const closeSimulator = () => {
    setIsSimulatorOpen(false);
    setAnalysisResult(null);
    setAnalyzing(false);
    setPostLink('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans relative overflow-x-hidden">
      
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[5%] w-[45%] h-[60%] bg-primary/8 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute top-[20%] right-[10%] w-[35%] h-[50%] bg-secondary/8 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-card-border bg-navbar-bg backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                TrendBite AI
              </span>
              <span className="block text-[9px] text-muted-foreground font-bold tracking-widest uppercase">
                Agency Suite
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#simulator" onClick={(e) => { e.preventDefault(); setIsSimulatorOpen(true); }} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <span>Live Simulator</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/25">New</span>
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing Plans</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">Core Intel</a>
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg bg-card/45 border border-card-border hover:border-primary/30 hover:bg-card text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
            </button>

            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Portal Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-card/45 border border-card-border text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-card/45 border border-card-border text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/95 backdrop-blur-lg pt-24 px-6 flex flex-col gap-6 animate-fade-in">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold border-b border-card-border/60 pb-3">Features</a>
          <a href="#simulator" onClick={() => { setMobileMenuOpen(false); setIsSimulatorOpen(true); }} className="text-lg font-semibold border-b border-card-border/60 pb-3 flex items-center justify-between">
            <span>Social Simulator</span>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/25">Interactive</span>
          </a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold border-b border-card-border/60 pb-3">Pricing Plans</a>
          
          <div className="flex flex-col gap-3 mt-8">
            {isLoggedIn ? (
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                className="w-full text-center py-3 bg-primary text-white rounded-lg font-bold"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 border border-card-border rounded-lg font-semibold"
                >
                  Portal Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-bold"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-36 z-10 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Gen Competitor & Content Intelligence Suite</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Supercharge Your Agency's{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Social Campaign Velocity
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Audit competitors, monitor Google search trends, craft AI strategies, and benchmark organic analytics inside a single, unified client workspace.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Navigate to Workspace</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-card border border-card-border hover:border-secondary/45 text-foreground rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <BarChart3 className="w-5 h-5 text-secondary" />
              <span>Try Analytics Simulator</span>
            </button>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto border-t border-card-border/50">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">10M+</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Posts Analysed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">98.4%</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Audit Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">1.5K+</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Active Agencies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">250k+</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">AI Hooks Compiled</p>
            </div>
          </div>

          {/* Visual Showcase (Mock dashboard layout screenshot lookalike) */}
          <div className="pt-12 max-w-5xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-card-border/80 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-card-border/50 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground ml-3 font-mono">dashboard_preview.io</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-card/65 border border-card-border text-[10px] text-muted-foreground font-semibold uppercase">
                  Client: Brew & Beans
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                
                {/* Panel 1 */}
                <div className="glass-panel p-5 rounded-xl border border-card-border bg-card/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Competitor Audit</span>
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">92% Match</p>
                  <p className="text-xs text-muted-foreground">Local competitor "StarCafe" registered +12k views via reels hook: "The barista secret..."</p>
                </div>

                {/* Panel 2 */}
                <div className="glass-panel p-5 rounded-xl border border-card-border bg-card/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Google Trend Score</span>
                    <TrendingUp className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">84 / 100</p>
                  <p className="text-xs text-muted-foreground">Search intent "cold brew recipe" increased by +34% inside targeted city location.</p>
                </div>

                {/* Panel 3 */}
                <div className="glass-panel p-5 rounded-xl border border-card-border bg-card/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Advisor Hook</span>
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-primary">"Baristas hate this simple trick..."</p>
                  <p className="text-xs text-muted-foreground">Gemini compiled hook recommended for next weekly Instagram campaign setup.</p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-24 border-t border-card-border bg-card/5 relative z-10 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Engineered Specifically For Digital Agencies
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Handling dozens of client accounts manually is exhausting. TrendBite automates intelligence gathering to unlock explosive client performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="glass-panel p-6 rounded-xl border border-card-border hover:border-primary/30 hover:shadow-lg transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Niche Client CRUD</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Organize distinct workspaces for clients. Toggle target locations, categories, and business names dynamically to scope down local research.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-6 rounded-xl border border-card-border hover:border-secondary/30 hover:shadow-lg transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Competitor Auditing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Scan local businesses and map brand tags. Identify viral hooks that rivals are using to attract engagement, then adapt them in seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-6 rounded-xl border border-card-border hover:border-accent/30 hover:shadow-lg transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Trends Intelligence</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monitor live regional seasonality, classify transactional keyword intents, and view viral topics dynamically via direct Google Trends tracking.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-panel p-6 rounded-xl border border-card-border hover:border-primary/30 hover:shadow-lg transition-all space-y-4 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Gemini AI Strategy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Formulate comprehensive 7-day marketing campaigns. Generate reels hooks, custom caption directions, and ideal post schedules automatically.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 border-t border-card-border relative z-10 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Pricing Built to Scale</h2>
            <p className="text-sm text-muted-foreground">Select the plan that fits your agency's client load.</p>

            {/* Switcher Toggle */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-card/60 border border-card-border mt-4">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  billingPeriod === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  billingPeriod === 'yearly' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly (20% Off)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-6">
            
            {/* Plan 1 */}
            <div className="glass-panel p-8 rounded-2xl border border-card-border bg-card/25 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Starter</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${billingPeriod === 'monthly' ? '29' : '23'}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground">Ideal for freelance consultants and boutique social creators.</p>
                <hr className="border-card-border/50" />
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span>3 client projects max</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span>Competitor tracking (5 metrics)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span>Google Trends analysis</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span>Standard AI recommendations</span></li>
                </ul>
              </div>
              <button onClick={() => navigate('/signup')} className="w-full py-2.5 bg-card border border-card-border hover:border-primary/45 rounded-lg text-xs font-semibold text-foreground transition-all cursor-pointer">
                Subscribe Starter
              </button>
            </div>

            {/* Plan 2 - Featured */}
            <div className="glass-panel p-8 rounded-2xl border-2 border-primary bg-card/40 flex flex-col justify-between space-y-6 relative">
              <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <div className="space-y-4">
                <p className="text-sm font-bold text-primary uppercase tracking-wider">Growth Agency</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${billingPeriod === 'monthly' ? '79' : '63'}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground">Designed for scaling marketing teams handling high-growth clients.</p>
                <hr className="border-card-border/50" />
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> <span className="text-foreground font-semibold">15 client projects max</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> <span>Competitor mapping (Unlimited)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> <span>Real-time Google search trends</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> <span>Weekly Gemini AI hook strategy</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> <span>Social analytics dashboard popup logs</span></li>
                </ul>
              </div>
              <button onClick={() => navigate('/signup')} className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-md shadow-primary/20 transition-all cursor-pointer">
                Unlock Pro Plan
              </button>
            </div>

            {/* Plan 3 */}
            <div className="glass-panel p-8 rounded-2xl border border-card-border bg-card/25 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Enterprise Suite</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${billingPeriod === 'monthly' ? '199' : '159'}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground">Custom limits, team seats, and white-labeled PDFs for global companies.</p>
                <hr className="border-card-border/50" />
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span className="text-foreground">Unlimited projects & teammates</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span>Whitelabel client dashboards</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span>Custom API webhooks</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span>Dedicated account manager</span></li>
                </ul>
              </div>
              <button onClick={() => navigate('/signup')} className="w-full py-2.5 bg-card border border-card-border hover:border-primary/45 rounded-lg text-xs font-semibold text-foreground transition-all cursor-pointer">
                Contact Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-card-border bg-card/10 py-12 relative z-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base text-foreground tracking-tight">
              TrendBite AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 TrendBite AI. Designed for state-of-the-art social media intelligence. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
            <a href="#terms" className="hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </footer>


      {/* INTERACTIVE SOCIAL ANALYTICS SIMULATOR MODAL POPUP */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all duration-300">
          
          {/* Modal Box */}
          <div className="glass-panel-glow w-full max-w-3xl rounded-2xl border border-card-border bg-dropdown-bg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Glow accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
            
            {/* Header */}
            <div className="p-6 border-b border-card-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                <div>
                  <h3 className="text-base font-bold text-foreground">Interactive Social Analytics Simulator</h3>
                  <p className="text-xs text-muted-foreground">Analyze organic metrics & extract AI suggestions in real-time</p>
                </div>
              </div>
              <button 
                onClick={closeSimulator}
                className="p-1.5 rounded-lg border border-card-border hover:bg-card/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Form Input (If not loaded/analyzing) */}
              {!analyzing && !analysisResult && (
                <form onSubmit={handleStartAnalysis} className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3 text-xs text-primary">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>Paste any URL (Instagram, TikTok, or YouTube Shorts) below to run a high-fidelity simulator. No registration required.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Platform</label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full px-3 py-2.5 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                      >
                        <option value="Instagram">Instagram Reels</option>
                        <option value="TikTok">TikTok Video</option>
                        <option value="YouTube">YouTube Shorts</option>
                        <option value="Facebook">Facebook Video</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Post Link URL</label>
                      <input
                        type="url"
                        placeholder={platform === 'Instagram' ? 'https://instagram.com/p/...' : 'https://tiktok.com/t/...'}
                        value={postLink}
                        onChange={(e) => setPostLink(e.target.value)}
                        className="w-full px-3 py-2.5 bg-card/25 border border-card-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-secondary hover:bg-secondary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-secondary/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Execute Simulated Audit</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Analyzing / Loader state */}
              {analyzing && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  
                  {/* Rotating loader */}
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-card-border rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-foreground transition-all duration-300">
                      {steps[analysisStep]}
                    </p>
                    <p className="text-xs text-muted-foreground">Running analysis on mock payload dataset...</p>
                  </div>

                  {/* Mock progress bar */}
                  <div className="w-full max-w-xs h-1.5 bg-card-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" 
                      style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>

                </div>
              )}

              {/* Analysis Result Output */}
              {!analyzing && analysisResult && (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-card/20 border border-card-border rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Reach Scope</p>
                      <p className="text-xl font-extrabold text-foreground mt-1">{analysisResult.reach.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-card/20 border border-card-border rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Engagement Rate</p>
                      <p className="text-xl font-extrabold text-secondary mt-1">{analysisResult.engRate}%</p>
                    </div>
                    <div className="p-4 bg-card/20 border border-card-border rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Likes / Applauds</p>
                      <p className="text-xl font-extrabold text-foreground mt-1">{analysisResult.likes.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-card/20 border border-card-border rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Comments Log</p>
                      <p className="text-xl font-extrabold text-foreground mt-1">{analysisResult.comments.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Main Grid: Graph + AI Advise */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Comparative Recharts Chart */}
                    <div className="p-4 bg-card/10 border border-card-border rounded-xl space-y-3">
                      <p className="text-xs font-bold text-foreground">Niche Benchmarks (Engagement Rate %)</p>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analysisResult.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                            <YAxis stroke="#71717a" fontSize={9} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--dropdown-bg)', borderColor: 'var(--card-border)' }} />
                            <Bar dataKey="rate" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gemini AI Advice Card */}
                    <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Gemini Recommendations</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Suggested Hook Script</p>
                          <p className="text-xs italic text-foreground bg-card/40 p-2.5 rounded border border-card-border">
                            "{analysisResult.hooks[0]}"
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Hashtags</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.hashtags.map((tag) => (
                            <span key={tag} className="text-[10px] text-primary font-semibold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setAnalysisResult(null)}
                      className="w-full sm:w-auto px-4 py-2 border border-card-border rounded-lg text-xs font-semibold hover:bg-card/25 text-foreground cursor-pointer"
                    >
                      Reset & Analyze Another URL
                    </button>
                    <button
                      onClick={() => { closeSimulator(); navigate('/signup'); }}
                      className="w-full sm:w-auto px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Setup Free Account to Track History</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
