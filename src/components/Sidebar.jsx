import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  CreditCard, 
  ShieldAlert,
  ChevronDown, 
  Plus,
  LogOut,
  Sparkles,
  Building
} from 'lucide-react';

export const Sidebar = () => {
  const { user, projects, activeProject, setActiveProject, logout } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleProjectSelect = (project) => {
    setActiveProject(project);
    setDropdownOpen(false);
    // Refresh context if needed
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Client Niche CRUD', path: '/projects', icon: Briefcase },
    { name: 'Competitors Search', path: '/competitors', icon: Building },
    { name: 'Trending Topics', path: '/trends', icon: TrendingUp },
    { name: 'AI 7-Day Strategy', path: '/strategy', icon: Calendar },
    { name: 'Task Tracker', path: '/tracker', icon: CheckSquare },
    { name: 'Social Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Pricing Plans', path: '/billing', icon: CreditCard },
  ];

  // If user is admin, append Admin routes
  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'Admin Console', path: '/admin', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 border-r border-card-border bg-sidebar-bg flex flex-col h-screen sticky top-0 transition-colors duration-300">
      {/* Platform Title */}
      <div className="p-6 border-b border-card-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-none">
            TrendBite AI
          </h1>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            SaaS Agency Suite
          </span>
        </div>
      </div>

      {/* Active Project Switcher Dropdown */}
      <div className="p-4 border-b border-card-border relative">
        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1 px-1">
          Active Client Project
        </label>
        
        {projects.length === 0 ? (
          <button
            onClick={() => navigate('/projects')}
            className="w-full text-left py-2 px-3 rounded-lg border border-dashed border-card-border text-sm flex items-center justify-between text-muted-foreground hover:text-foreground transition-all"
          >
            <span>Create client project</span>
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-card-border bg-card/45 hover:bg-card/85 text-left text-sm transition-all"
            >
              <div className="truncate pr-2">
                <p className="font-semibold text-foreground truncate">
                  {activeProject?.businessName || 'Select a project...'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {activeProject?.category || 'No client active'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-4 right-4 mt-1 bg-dropdown-bg border border-card-border rounded-lg shadow-xl z-30 max-h-56 overflow-y-auto">
                <div className="p-1">
                  {projects.map((proj) => (
                    <button
                      key={proj._id || proj.id}
                      onClick={() => handleProjectSelect(proj)}
                      className={`w-full text-left p-2 rounded-md text-xs flex flex-col hover:bg-card/60 transition-colors ${
                        (activeProject?._id || activeProject?.id) === (proj._id || proj.id) ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    >
                      <span className="font-medium text-foreground truncate">{proj.businessName}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{proj.category}</span>
                    </button>
                  ))}
                  <div className="border-t border-card-border my-1" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/projects');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 p-2 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Manage Projects
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/15 to-secondary/10 border border-primary/25 text-primary dark:text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-card/30 hover:text-foreground'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-card-border flex items-center justify-between gap-2">
        <div className="truncate">
          <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
          <p className="text-[10px] text-muted-foreground truncate font-mono uppercase tracking-wider">{user?.role} ACCOUNT</p>
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-2 rounded-lg bg-card/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-card-border hover:border-destructive/20 transition-all flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
