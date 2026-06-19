import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Plus, Trash2, Edit, Check, Briefcase, MapPin, Tag, MessageSquare } from 'lucide-react';

export const Projects = () => {
  const { projects, activeProject, setProjects, setActiveProject, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [competitorKeyword, setCompetitorKeyword] = useState('');
  const [description, setDescription] = useState('');

  // Fetch projects on load
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      const loadedProjects = res.data.data;
      setProjects(loadedProjects);
      
      const dbActive = loadedProjects.find((p) => p.isActive);
      if (dbActive) {
        setActiveProject(dbActive);
      } else if (loadedProjects.length > 0 && !activeProject) {
        setActiveProject(loadedProjects[0]);
      }
    } catch {
      addNotification('error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!businessName || !category || !location) {
      addNotification('warning', 'Please fill in required fields');
      return;
    }

    try {
      const res = await api.post('/projects', {
        businessName,
        category,
        industry,
        location,
        targetAudience,
        brandTone,
        competitorKeyword,
        description,
      });

      const newProject = res.data.data;
      setProjects([newProject, ...projects]);
      setActiveProject(newProject);
      addNotification('success', `Created project for "${businessName}" successfully.`);

      // Reset form
      setBusinessName('');
      setCategory('');
      setIndustry('');
      setLocation('');
      setTargetAudience('');
      setBrandTone('');
      setCompetitorKeyword('');
      setDescription('');
      setShowForm(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create project';
      addNotification('error', msg);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const res = await api.put(`/projects/${editingId}`, {
        businessName,
        category,
        industry,
        location,
        targetAudience,
        brandTone,
        competitorKeyword,
        description,
      });

      const updated = res.data.data;
      setProjects(projects.map((p) => (p.id === editingId ? updated : p)));
      if (activeProject?.id === editingId) {
        setActiveProject(updated);
      }

      addNotification('success', `Updated "${businessName}" project details.`);
      setEditingId(null);
      setShowForm(false);

      // Reset fields
      setBusinessName('');
      setCategory('');
      setIndustry('');
      setLocation('');
      setTargetAudience('');
      setBrandTone('');
      setCompetitorKeyword('');
      setDescription('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update project';
      addNotification('error', msg);
    }
  };

  const handleDelete = async (id, name) => {
    console.log(id);
    if (!window.confirm(`Are you sure you want to delete "${name}"? All crawled competitors, intent trends, and social schedules will be permanently wiped.`)) return;

    try {
      await api.delete(`/projects/${id}`);
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      if (activeProject?.id === id) {
        setActiveProject(updated.length > 0 ? updated[0] : null);
      }
      addNotification('success', `Wiped "${name}" project database.`);
    } catch {
      addNotification('error', 'Failed to delete project');
    }
  };

  const handleEditInit = (proj) => {
    setEditingId(proj.id);
    setBusinessName(proj.businessName);
    setCategory(proj.category);
    setIndustry(proj.industry || '');
    setLocation(proj.location);
    setTargetAudience(proj.targetAudience);
    setBrandTone(proj.brandTone);
    setCompetitorKeyword(proj.competitorKeyword || '');
    setDescription(proj.description);
    setShowForm(true);
  };

  const handleAddInit = () => {
    setEditingId(null);
    setBusinessName('');
    setCategory('');
    setIndustry('');
    setLocation('');
    setTargetAudience('');
    setBrandTone('');
    setCompetitorKeyword('');
    setDescription('');
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Client Workspace CRUD</h1>
          <p className="text-sm text-muted-foreground">Manage client niches, locations, and brand guidelines</p>
        </div>
        {!showForm && (
          <button
            onClick={handleAddInit}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-md shadow-primary/10 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client Project</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel p-6 rounded-xl border border-card-border max-w-2xl">
          <h2 className="text-lg font-bold text-foreground mb-4">
            {editingId ? 'Edit Project parameters' : 'Create Client Project'}
          </h2>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Dental Clinic"
                  className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Healthcare, Food & Beverage"
                  className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Niche Category *</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Dentist, Pizza Restaurant"
                  className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">City Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chennai, Bangalore"
                  className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Competitor Google Maps Keyword (Optional)</label>
                <input
                  type="text"
                  value={competitorKeyword}
                  onChange={(e) => setCompetitorKeyword(e.target.value)}
                  placeholder="e.g. Biryani Chennai (Auto-generated if left blank)"
                  className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Audience Profile</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Local families, office workers"
                  className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Brand Voice Tone</label>
                <input
                  type="text"
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  placeholder="e.g. Friendly, casual, professional"
                  className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Business Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of clients USP and menu/product lines..."
                rows={3}
                className="w-full px-3.5 py-2 bg-card/25 border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-card-border rounded-lg text-xs font-semibold hover:bg-card/20 text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-white rounded-lg text-xs font-semibold shadow-md shadow-secondary/10 transition-colors"
              >
                {editingId ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl border border-card-border text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted-foreground mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No Projects Found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Get started by entering your client's business details, keyword triggers, and brand tone.
          </p>
          <button
            onClick={handleAddInit}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Create Your First Client Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className={`glass-panel p-5 rounded-xl border transition-all flex flex-col justify-between ${activeProject?.id === proj.id
                ? 'border-primary shadow-lg shadow-primary/5 bg-primary/5'
                : 'border-card-border hover:border-muted'
                }`}
            >
              <div>
                {/* Active Checkmark Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-foreground text-lg leading-tight truncate">{proj.businessName}</h3>
                  {activeProject?.id === proj.id ? (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveProject(proj)}
                      className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white px-2 py-0.5 rounded-full border border-card-border bg-card/20 hover:bg-card/65 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {proj.description || 'No business description provided.'}
                </p>

                <div className="space-y-2 mb-6">
                  {proj.industry && (
                    <div className="flex items-center gap-2 text-xs">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground truncate font-medium">{proj.industry}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground truncate font-medium">{proj.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground truncate font-medium">{proj.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground truncate font-mono">"{proj.competitorKeyword || `${proj.category} ${proj.location} (Auto)`}"</span>
                  </div>
                </div>
              </div>

              {/* Action operations */}
              <div className="border-t border-card-border/60 pt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Added: {new Date(proj.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditInit(proj)}
                    className="p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit configurations"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <p>{proj.id}</p>
                  <button
                    onClick={() => handleDelete(proj._id, proj.businessName)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
