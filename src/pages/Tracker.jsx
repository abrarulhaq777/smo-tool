import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { CheckSquare, Square, ExternalLink, MessageSquare, X, Sparkles } from 'lucide-react';

export const Tracker = () => {
  const { activeProject, addNotification } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  // Link/notes Modal State
  const [activeTask, setActiveTask] = useState(null);
  const [postLink, setPostLink] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${activeProject._id}`);
      setTasks(res.data.data);
    } catch {
      addNotification('error', 'Failed to retrieve daily task checkmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeProject]);

  const handleOpenCompleteModal = (task) => {
    setActiveTask(task);
    setPostLink(task.postLink || '');
    setNotes(task.notes || '');
    setScreenshotUrl(task.screenshotUrl || '');
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!activeTask) return;
    if (!postLink) {
      addNotification('warning', 'Please provide a live post link');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/tasks/${activeTask._id}`, {
        status: 'Completed',
        notes,
        postLink,
        screenshotUrl: screenshotUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8', // default fallback screenshot
      });

      setTasks(tasks.map((t) => (t._id === activeTask._id ? res.data.data : t)));
      addNotification('success', `Completed Day ${activeTask.dayIndex} task! A post record was spawned in Analytics.`);
      setActiveTask(null);
    } catch {
      addNotification('error', 'Failed to update task completion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Skipped' ? 'Pending' : 'Skipped';
    try {
      const res = await api.put(`/tasks/${id}`, { status: nextStatus });
      setTasks(tasks.map((t) => (t.id === id ? res.data.data : t)));
      addNotification('info', `Task status marked as ${nextStatus}.`);
    } catch {
      addNotification('error', 'Failed to update task status');
    }
  };

  const handleResetPending = async (id) => {
    try {
      const res = await api.put(`/tasks/${id}`, {
        status: 'Pending',
        postLink: '',
        screenshotUrl: '',
      });
      setTasks(tasks.map((t) => (t.id === id ? res.data.data : t)));
      addNotification('info', 'Task reset to Pending.');
    } catch {
      addNotification('error', 'Failed to reset task');
    }
  };

  if (!activeProject) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-card-border text-center max-w-md mx-auto mt-12">
        <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Select Active Project</h3>
        <p className="text-sm text-muted-foreground mt-1">Please configure or select a project workspace to track campaign execution.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Task Tracker</h1>
        <p className="text-sm text-muted-foreground">Tick off scheduled daily content and register live post links</p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl border border-card-border text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <CheckSquare className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">Checklist Empty</h3>
          <p className="text-sm text-muted-foreground mb-6">
            No active schedules populated. Go to the "AI 7-Day Strategy" tab and click "Generate Strategy" to fill the tracker list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {tasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const isSkipped = task.status === 'Skipped';

            return (
              <div
                key={task._id || task.id}
                className={`glass-panel p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-6 ${isCompleted
                  ? 'border-success/30 bg-success/5 shadow-md shadow-success/2'
                  : isSkipped
                    ? 'border-card-border/40 opacity-60 bg-card/5'
                    : 'border-card-border hover:border-card-border/80'
                  }`}
              >
                {/* Content Left side */}
                <div className="flex-1 flex gap-4">
                  {/* Action box */}
                  <div className="flex-shrink-0 mt-1">
                    {isCompleted ? (
                      <button
                        onClick={() => handleResetPending(task.id)}
                        className="text-success hover:text-muted transition-colors"
                        title="Mark pending"
                      >
                        <CheckSquare className="w-5.5 h-5.5 fill-success/10" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCompleteModal(task)}
                        disabled={isSkipped}
                        className="text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
                        title="Mark complete"
                      >
                        <Square className="w-5.5 h-5.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 rounded border border-card-border bg-card/25 font-mono">
                        Day {task.dayIndex}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        Format: {task.contentType}
                      </span>
                    </div>

                    <h3 className={`font-bold text-foreground text-base ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.goal}
                    </h3>

                    <p className="text-xs text-muted-foreground">{task.reelIdea}</p>

                    {isCompleted && (
                      <div className="pt-3 border-t border-card-border/40 space-y-2">
                        {task.postLink && (
                          <a
                            href={task.postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary-hover transition-colors"
                          >
                            <span>Live Post Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {task.notes && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>Notes: {task.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Right side */}
                <div className="flex flex-wrap items-center gap-2.5 self-end md:self-start md:border-l border-card-border/40 md:pl-4 flex-shrink-0 h-full">
                  {(task.posterDesign || (() => {
                    const type = task.contentType?.toLowerCase() || '';
                    const isVideo = type.includes('reel') || type.includes('video') || type.includes('tiktok') || type.includes('short');
                    return !isVideo;
                  })()) && (
                    <button
                      onClick={() => navigate(`/editor/${task._id || task.id}`)}
                      disabled={isSkipped}
                      className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-xs font-bold transition-all text-primary hover:text-primary-hover flex items-center gap-1.5 disabled:opacity-30 animate-pulse"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Edit Poster</span>
                    </button>
                  )}
                  {!isCompleted ? (
                    <button
                      onClick={() => handleSkip(task.id, task.status)}
                      className="px-3 py-1.5 border border-card-border hover:bg-card/20 rounded-lg text-xs font-semibold transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {isSkipped ? 'Unskip' : 'Skip Day'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCompleteModal(task)}
                      className="px-3 py-1.5 border border-card-border hover:bg-card/20 rounded-lg text-xs font-semibold transition-colors text-muted-foreground hover:text-foreground"
                    >
                      Edit Logs
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion drawer modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-panel-glow max-w-md w-full p-6 rounded-xl border border-card-border relative animate-in zoom-in duration-200">
            <button
              onClick={() => setActiveTask(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-foreground mb-1">Log Post Completion</h2>
            <p className="text-xs text-muted-foreground mb-4">Day {activeTask.dayIndex}: {activeTask.goal}</p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Live Social Post URL *</label>
                <input
                  type="url"
                  value={postLink}
                  onChange={(e) => setPostLink(e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  className="w-full px-3.5 py-2.5 bg-card/20 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Mock Screenshot URL (Optional)</label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-card/20 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Performance Notes / Copy variations</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes about hooks, engagement rate flags, hashtags used..."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-card/20 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2 border border-card-border rounded-lg text-xs font-semibold hover:bg-card/20 text-foreground transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-success hover:bg-success/80 text-white rounded-lg text-xs font-semibold shadow-md shadow-success/10 transition-colors flex items-center justify-center"
                >
                  {submitting ? 'Updating...' : 'Register Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
