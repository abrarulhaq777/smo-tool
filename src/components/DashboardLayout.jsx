import React, { useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastContainer } from './Toast';
import api from '../services/api';

export const DashboardLayout = () => {
  const { user, setUser, setProjects, setActiveProject, activeProject } = useStore();
  const navigate = useNavigate();
  // Prevent double-fetch in StrictMode
  const hasSynced = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('trendbite_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (hasSynced.current) return;
    hasSynced.current = true;

    // Always re-fetch projects on dashboard mount to get fresh MongoDB IDs
    const syncSession = async () => {
      try {
        // Re-hydrate user session if not in memory
        if (!user) {
          const res = await api.get('/auth/profile');
          setUser(res.data.user);
        }

        // Always fetch fresh project list (ensures IDs are valid MongoDB ObjectIds)
        const projRes = await api.get('/projects');
        const fetchedProjects = projRes.data.data;
        setProjects(fetchedProjects);

        if (fetchedProjects.length > 0) {
          // Try to restore the last active project — validate its id against the fresh list
          const cachedProj = localStorage.getItem('trendbite_active_project');
          if (cachedProj) {
            try {
              const parsed = JSON.parse(cachedProj);
              // Match by id — if stale/not found, fall back to first project
              const found = fetchedProjects.find((p) => p.id && p.id === parsed.id);
              setActiveProject(found || fetchedProjects[0]);
            } catch {
              setActiveProject(fetchedProjects[0]);
            }
          } else {
            setActiveProject(fetchedProjects[0]);
          }
        } else {
          // No projects — clear any stale cached project
          setActiveProject(null);
        }
      } catch {
        localStorage.removeItem('trendbite_token');
        navigate('/login');
      }
    };

    syncSession();
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top toolbar */}
        <Navbar />

        {/* Scrollable inner view */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Persistent global toasts */}
      <ToastContainer />
    </div>
  );
};
