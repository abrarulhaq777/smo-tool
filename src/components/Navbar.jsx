import React from 'react';
import { useStore } from '../store/useStore';
import { Building, MapPin, Tag, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { activeProject, theme, toggleTheme } = useStore();

  return (
    <header className="h-16 border-b border-card-border bg-navbar-bg backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 transition-all duration-300">
      {/* View Title or Current Project Summary */}
      <div className="flex items-center gap-6">
        {activeProject ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground text-base tracking-tight mr-2">
              {activeProject.businessName}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-card-border bg-card/30">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">{activeProject.category}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-card-border bg-card/30">
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-medium text-foreground">{activeProject.location}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-card-border bg-card/30">
              <Building className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium text-foreground font-mono">"{activeProject.competitorKeyword}"</span>
            </div>
          </div>
        ) : (
          <span className="font-semibold text-foreground text-base tracking-tight">
            TrendBite AI Platform Dashboard
          </span>
        )}
      </div>

      {/* Right Side Widgets */}
      <div className="flex items-center gap-4">
        {activeProject && (
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Tone: <span className="text-foreground capitalize font-semibold">{activeProject.brandTone}</span>
          </span>
        )}

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg bg-card/40 border border-card-border hover:border-primary/30 hover:bg-card/80 text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-sm cursor-pointer"
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-all duration-500 transform group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-all duration-500 transform group-hover:-rotate-12" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
