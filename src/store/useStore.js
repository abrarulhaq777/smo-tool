import { create } from 'zustand';
import api from '../services/api';

// Helper to load initial state safely
const getStoredUser = () => {
  try {
    const item = localStorage.getItem('trendbite_user');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// MongoDB ObjectId is a 24-character hex string
const isValidMongoId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

const getStoredActiveProject = () => {
  try {
    const item = localStorage.getItem('trendbite_active_project');
    if (!item) return null;
    const parsed = JSON.parse(item);
    // Discard stale Prisma/UUID IDs from before the MongoDB migration
    if (!isValidMongoId(parsed?.id || parsed?._id)) {
      localStorage.removeItem('trendbite_active_project');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};


const getStoredTheme = () => {
  const stored = localStorage.getItem('trendbite_theme');
  return (stored === 'light' || stored === 'dark') ? stored : 'dark';
};

export const useStore = create((set) => ({
  user: getStoredUser(),
  projects: [],
  activeProject: getStoredActiveProject(),
  notifications: [],
  theme: getStoredTheme(),

  setUser: (user) => set(() => {
    if (user) {
      localStorage.setItem('trendbite_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('trendbite_user');
    }
    return { user };
  }),

  setProjects: (projects) => set(() => ({ projects })),

  setActiveProject: async (project) => {
    if (project) {
      localStorage.setItem('trendbite_active_project', JSON.stringify(project));
      try {
        const projectId = project.id || project._id;
        await api.post(`/projects/${projectId}/activate`);
      } catch (err) {
        console.error('Failed to notify backend about active project:', err);
      }
    } else {
      localStorage.removeItem('trendbite_active_project');
    }
    set({ activeProject: project });
  },

  logout: () => set(() => {
    localStorage.removeItem('trendbite_token');
    localStorage.removeItem('trendbite_user');
    localStorage.removeItem('trendbite_active_project');
    return { user: null, projects: [], activeProject: null };
  }),

  addNotification: (type, message) => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif = { id, type, message };
    
    // Auto-remove notification after 4 seconds
    setTimeout(() => {
      set((latestState) => ({
        notifications: latestState.notifications.filter((n) => n.id !== id),
      }));
    }, 4000);

    return { notifications: [...state.notifications, newNotif] };
  }),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('trendbite_theme', nextTheme);
    return { theme: nextTheme };
  }),
}));
