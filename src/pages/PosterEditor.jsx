import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { KonvaCanvas } from '../components/editor/KonvaCanvas';
import { validateDesignJson } from '../utils/designJsonValidator';
import { getDefaultPosterTemplate } from '../utils/designTemplates';
import { 
  Sparkles, Undo2, Redo2, Download, Save, ArrowLeft, 
  Type, Square, Image as ImageIcon, Plus, Trash2, Copy,
  AlignLeft, AlignCenter, AlignRight, Check, ArrowUp, ArrowDown
} from 'lucide-react';
import { Loader } from '../components/Loader';

const AVAILABLE_FONTS = ['Poppins', 'Montserrat', 'Inter', 'Outfit', 'Roboto', 'Playfair Display'];

export const PosterEditor = () => {
  const { planId } = useParams(); // planId represents the taskId
  const navigate = useNavigate();
  const { addNotification, activeProject } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState(null);
  
  // Canvas Configuration State
  const [canvasConfig, setCanvasConfig] = useState({
    width: 1080,
    height: 1080,
    backgroundColor: '#FFF7ED'
  });
  const [theme, setTheme] = useState({
    primaryColor: '#EA580C',
    secondaryColor: '#FDBA74',
    accentColor: '#111827',
    fontFamily: 'Poppins'
  });

  // Layer & Selection State
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Dropdown states for Toolbar Inserters
  const [showTextDropdown, setShowTextDropdown] = useState(false);
  const [showShapesDropdown, setShowShapesDropdown] = useState(false);
  const [showPremiumDropdown, setShowPremiumDropdown] = useState(false);

  // Undo/Redo History Stack
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Container Measurement State for Responsive Canvas Scale
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  // Hidden File Input Trigger
  const fileInputRef = useRef(null);

  // 1. Fetch task and loading saved designs on mount
  useEffect(() => {
    const fetchDesignData = async () => {
      setLoading(true);
      try {
        let loadedDesign = null;
        let associatedTask = null;

        // Try getting saved custom design for this taskId/planId
        try {
          const res = await api.get(`/designs/by-plan/${planId}`);
          if (res.data && res.data.data) {
            loadedDesign = res.data.data;
          }
        } catch (err) {
          // If 404, we'll load default design from task. That is expected.
        }

        // Fetch task details to get goal, initial AI design, and project categories
        const taskRes = await api.get(`/tasks/single/${planId}`);
        associatedTask = taskRes.data.data;
        setTask(associatedTask);

        if (loadedDesign) {
          // Load customized saved design
          const validated = validateDesignJson(loadedDesign.posterDesign);
          if (validated) {
            setCanvasConfig(validated.canvas);
            setTheme(validated.theme);
            initializeLayers(validated.layers);
          } else {
            loadFallback(associatedTask);
          }
        } else if (associatedTask && associatedTask.posterDesign) {
          // Load initial AI generated design
          const validated = validateDesignJson(associatedTask.posterDesign);
          if (validated) {
            setCanvasConfig(validated.canvas);
            setTheme(validated.theme);
            initializeLayers(validated.layers);
          } else {
            loadFallback(associatedTask);
          }
        } else {
          // No AI design present, use fallback templates
          loadFallback(associatedTask);
        }
      } catch (error) {
        addNotification('error', 'Failed to initialize poster data');
        navigate('/tracker');
      } finally {
        setLoading(false);
      }
    };

    fetchDesignData();
  }, [planId]);

  // Load static design template as fallback
  const loadFallback = (associatedTask) => {
    const category = activeProject?.category || 'Business';
    const goal = associatedTask?.goal || 'Special Offer';
    const fallbackTemplate = getDefaultPosterTemplate(category, goal);
    setCanvasConfig(fallbackTemplate.canvas);
    setTheme(fallbackTemplate.theme);
    initializeLayers(fallbackTemplate.layers);
    addNotification('info', 'Loaded default layout template');
  };

  // Helper to initialize layers state and history stack
  const initializeLayers = (initialLayers) => {
    setLayers(initialLayers);
    setHistory([initialLayers]);
    setHistoryIndex(0);
  };

  // 2. Measure Container for Scaling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Keep 40px spacing margins
        const scaleX = (clientWidth - 40) / canvasConfig.width;
        const scaleY = (clientHeight - 40) / canvasConfig.height;
        setScale(Math.min(0.9, scaleX, scaleY));
      }
    };

    if (!loading) {
      // Small timeout to allow DOM to mount fully
      const timer = setTimeout(handleResize, 100);
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [loading, canvasConfig.width, canvasConfig.height]);

  // 3. History Actions: Undo / Redo
  const updateLayersState = (newLayers, isHistoryNavigation = false) => {
    setLayers(newLayers);
    if (!isHistoryNavigation) {
      const currentHistory = history.slice(0, historyIndex + 1);
      const updatedHistory = [...currentHistory, newLayers];
      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      updateLayersState(history[prevIndex], true);
      setSelectedId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      updateLayersState(history[nextIndex], true);
      setSelectedId(null);
    }
  };

  // 4. Layer Properties Modifier Helpers
  const selectedLayer = layers.find((l) => l.id === selectedId);

  const updateSelectedLayer = (properties) => {
    if (!selectedId) return;
    const updatedLayers = layers.map((l) => 
      l.id === selectedId ? { ...l, ...properties } : l
    );
    updateLayersState(updatedLayers);
  };

  // 5. Canvas Layer Insertion Actions
  const handleSelect = (id) => {
    setSelectedId(id);
    setShowTextDropdown(false);
    setShowShapesDropdown(false);
    setShowPremiumDropdown(false);
  };

  const addTextLayer = () => {
    const newText = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 340,
      y: 500,
      width: 400,
      height: 80,
      text: 'Click here to edit text',
      fontSize: 32,
      fontFamily: theme.fontFamily || 'Poppins',
      fontStyle: 'normal',
      fill: theme.accentColor || '#111827',
      align: 'center',
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newText]);
    handleSelect(newText.id);
  };

  const addHeadingLayer = () => {
    const newLayer = {
      id: `text_heading_${Date.now()}`,
      type: 'text',
      x: 140,
      y: 300,
      width: 800,
      height: 120,
      text: 'HEADING TEXT',
      fontSize: 60,
      fontFamily: theme.fontFamily || 'Poppins',
      fontStyle: 'bold',
      fill: theme.accentColor || '#111827',
      align: 'center',
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addShapeLayer = () => {
    const newShape = {
      id: `shape_${Date.now()}`,
      type: 'rect',
      x: 440,
      y: 440,
      width: 200,
      height: 200,
      fill: theme.primaryColor || '#EA580C',
      opacity: 1,
      cornerRadius: 8,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newShape]);
    handleSelect(newShape.id);
  };

  const addCircleLayer = () => {
    const newLayer = {
      id: `circle_${Date.now()}`,
      type: 'circle',
      x: 440,
      y: 440,
      width: 200,
      height: 200,
      fill: theme.secondaryColor || '#FDBA74',
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addEllipseLayer = () => {
    const newLayer = {
      id: `ellipse_${Date.now()}`,
      type: 'ellipse',
      x: 440,
      y: 440,
      width: 250,
      height: 150,
      fill: theme.secondaryColor || '#FDBA74',
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addLineLayer = () => {
    const newLayer = {
      id: `line_${Date.now()}`,
      type: 'line',
      x: 340,
      y: 540,
      width: 400,
      height: 20,
      fill: theme.accentColor || '#111827',
      strokeWidth: 4,
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addArrowLayer = () => {
    const newLayer = {
      id: `arrow_${Date.now()}`,
      type: 'arrow',
      x: 340,
      y: 540,
      width: 200,
      height: 40,
      fill: theme.primaryColor || '#EA580C',
      strokeWidth: 4,
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addStarLayer = () => {
    const newLayer = {
      id: `star_${Date.now()}`,
      type: 'star',
      x: 440,
      y: 440,
      width: 150,
      height: 150,
      fill: '#EAB308',
      numPoints: 5,
      innerRadiusRatio: 0.4,
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addBadgeLayer = () => {
    const newLayer = {
      id: `badge_${Date.now()}`,
      type: 'badge',
      x: 440,
      y: 440,
      width: 220,
      height: 70,
      fill: '#DC2626',
      text: 'SPECIAL',
      textColor: '#FFFFFF',
      fontSize: 24,
      fontFamily: theme.fontFamily || 'Poppins',
      fontStyle: 'bold',
      cornerRadius: 35,
      rotation: 0,
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addButtonLayer = () => {
    const newLayer = {
      id: `button_${Date.now()}`,
      type: 'button',
      x: 390,
      y: 490,
      width: 300,
      height: 80,
      fill: theme.primaryColor || '#EA580C',
      text: 'Click Here',
      textColor: '#FFFFFF',
      fontSize: 26,
      fontFamily: theme.fontFamily || 'Poppins',
      fontStyle: 'bold',
      cornerRadius: 12,
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addIconLayer = () => {
    const newLayer = {
      id: `icon_${Date.now()}`,
      type: 'icon_placeholder',
      x: 510,
      y: 510,
      width: 60,
      height: 60,
      fill: '#E2E8F0',
      stroke: '#94A3B8',
      strokeWidth: 2,
      icon: '★',
      textColor: '#64748B',
      fontSize: 24,
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addBlobLayer = () => {
    const newLayer = {
      id: `blob_${Date.now()}`,
      type: 'blob',
      x: 440,
      y: 440,
      width: 200,
      height: 200,
      fill: theme.secondaryColor || '#FDBA74',
      opacity: 0.5,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addWaveLayer = () => {
    const newLayer = {
      id: `wave_${Date.now()}`,
      type: 'wave',
      x: 0,
      y: 880,
      width: 1080,
      height: 200,
      fill: theme.primaryColor || '#EA580C',
      opacity: 0.5,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addPolygonLayer = () => {
    const newLayer = {
      id: `polygon_${Date.now()}`,
      type: 'polygon',
      x: 440,
      y: 440,
      width: 180,
      height: 180,
      sides: 3,
      fill: '#3B82F6',
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addGradientRectLayer = () => {
    const newLayer = {
      id: `gradient_${Date.now()}`,
      type: 'gradient_rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      fill: [theme.primaryColor || '#EA580C', theme.secondaryColor || '#FDBA74'],
      gradientDirection: 'vertical',
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newLayer]);
    handleSelect(newLayer.id);
  };

  const addPlaceholderLayer = () => {
    const newPlaceholder = {
      id: `placeholder_${Date.now()}`,
      type: 'image_placeholder',
      x: 340,
      y: 340,
      width: 400,
      height: 400,
      cornerRadius: 16,
      fill: theme.secondaryColor || '#FED7AA',
      stroke: theme.primaryColor || '#EA580C',
      strokeWidth: 2,
      placeholderText: 'Click to upload image',
      imageUrl: null,
      fit: 'cover',
      opacity: 1,
      locked: false,
      editable: true
    };
    updateLayersState([...layers, newPlaceholder]);
    handleSelect(newPlaceholder.id);
  };

  const bringForward = () => {
    if (!selectedId) return;
    const idx = layers.findIndex(l => l.id === selectedId);
    if (idx === -1 || idx === layers.length - 1) return;
    const newLayers = [...layers];
    const temp = newLayers[idx];
    newLayers[idx] = newLayers[idx + 1];
    newLayers[idx + 1] = temp;
    updateLayersState(newLayers);
  };

  const sendBackward = () => {
    if (!selectedId) return;
    const idx = layers.findIndex(l => l.id === selectedId);
    if (idx === -1 || idx === 0) return;
    const newLayers = [...layers];
    const temp = newLayers[idx];
    newLayers[idx] = newLayers[idx - 1];
    newLayers[idx - 1] = temp;
    updateLayersState(newLayers);
  };

  // 6. Delete & Duplicate Layer Actions
  const deleteLayer = () => {
    if (!selectedId) return;
    const filtered = layers.filter((l) => l.id !== selectedId);
    updateLayersState(filtered);
    setSelectedId(null);
  };

  const duplicateLayer = () => {
    if (!selectedLayer || selectedLayer.locked) return;
    const duplicated = {
      ...selectedLayer,
      id: `${selectedLayer.type}_dup_${Date.now()}`,
      x: selectedLayer.x + 40,
      y: selectedLayer.y + 40,
    };
    updateLayersState([...layers, duplicated]);
    setSelectedId(duplicated.id);
  };

  // 7. Image Upload file handler
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLayer) return;

    // Verify type
    if (!file.type.startsWith('image/')) {
      addNotification('warning', 'Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateSelectedLayer({
        imageUrl: reader.result,
        type: 'image_placeholder', // Keep placeholder bounds but display image
      });
      addNotification('success', 'Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    updateSelectedLayer({ imageUrl: null });
  };

  // 8. DB Save & PNG Export Handlers
  const handleSaveDesign = async () => {
    setSaving(true);
    try {
      const designPayload = {
        canvas: canvasConfig,
        theme,
        layers
      };

      // Call save endpoint
      await api.post('/designs', {
        planId, // planId maps to taskId
        posterDesign: designPayload,
        thumbnail: '' // thumbnail upload is optional
      });

      addNotification('success', 'Poster design saved successfully!');
    } catch (err) {
      addNotification('error', 'Failed to save poster design');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPng = () => {
    if (!stageRef.current) return;
    
    // Clear selection temporarily to hide transformer nodes on PNG
    const currentSelect = selectedId;
    setSelectedId(null);

    // Timeout allows rendering cycle to deselect transformer
    setTimeout(() => {
      try {
        const stage = stageRef.current;
        const dataUrl = stage.toDataURL({ pixelRatio: 2 });
        
        const link = document.createElement('a');
        link.download = `${task?.goal?.replace(/\s+/g, '_') || 'poster'}_day_${task?.dayIndex || 1}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSelectedId(currentSelect);
        addNotification('success', 'Exported high-res PNG successfully!');
      } catch (err) {
        setSelectedId(currentSelect);
        addNotification('error', 'Failed to export image. Make sure all uploaded images are local/CORS-safe.');
      }
    }, 80);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader label="Opening canvas graphics editor. Initializing layers..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-40 overflow-hidden text-foreground">
      {/* 1. Header Toolbar */}
      <header className="h-16 border-b border-card-border bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tracker')}
            className="flex items-center gap-2 px-3 py-1.5 border border-card-border rounded-lg text-sm hover:bg-card/25 font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tasks</span>
          </button>
          
          <div className="h-5 w-[1px] bg-card-border" />

          <div>
            <h1 className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
              Poster Editor: Day {task?.dayIndex}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
              {task?.goal}
            </p>
          </div>
        </div>

        {/* Undo/Redo & Add Elements */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card-border/10 p-1 rounded-lg">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 hover:bg-card/25 rounded disabled:opacity-30 text-muted-foreground hover:text-foreground transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 hover:bg-card/25 rounded disabled:opacity-30 text-muted-foreground hover:text-foreground transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-card-border" />

          {/* Quick Insert Elements Dropdowns */}
          <div className="flex items-center gap-2">
            
            {/* Text Inserter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTextDropdown(!showTextDropdown);
                  setShowShapesDropdown(false);
                  setShowPremiumDropdown(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-card border border-card-border hover:bg-card/25 rounded-lg text-xs font-semibold transition-colors"
              >
                <Type className="w-3.5 h-3.5 text-primary" />
                <span>Text</span>
                <span className="text-[10px] opacity-60">▼</span>
              </button>
              {showTextDropdown && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-[#1E1E24] border border-card-border rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={() => { addHeadingLayer(); setShowTextDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors font-bold"
                  >
                    Add Large Heading
                  </button>
                  <button
                    onClick={() => { addTextLayer(); setShowTextDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Add Paragraph Text
                  </button>
                </div>
              )}
            </div>

            {/* Shape Inserter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowShapesDropdown(!showShapesDropdown);
                  setShowTextDropdown(false);
                  setShowPremiumDropdown(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-card border border-card-border hover:bg-card/25 rounded-lg text-xs font-semibold transition-colors"
              >
                <Square className="w-3.5 h-3.5 text-secondary" />
                <span>Shapes</span>
                <span className="text-[10px] opacity-60">▼</span>
              </button>
              {showShapesDropdown && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-[#1E1E24] border border-card-border rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={() => { addShapeLayer(); setShowShapesDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Rectangle
                  </button>
                  <button
                    onClick={() => { addCircleLayer(); setShowShapesDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Circle
                  </button>
                  <button
                    onClick={() => { addEllipseLayer(); setShowShapesDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Ellipse
                  </button>
                  <button
                    onClick={() => { addStarLayer(); setShowShapesDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Star Shape
                  </button>
                  <button
                    onClick={() => { addPolygonLayer(); setShowShapesDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Triangle (Polygon)
                  </button>
                  <button
                    onClick={() => { addLineLayer(); setShowShapesDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Horizontal Line
                  </button>
                  <button
                    onClick={() => { addArrowLayer(); setShowShapesDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Directional Arrow
                  </button>
                </div>
              )}
            </div>

            {/* Premium Decor Inserter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPremiumDropdown(!showPremiumDropdown);
                  setShowTextDropdown(false);
                  setShowShapesDropdown(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-card border border-card-border hover:bg-card/25 rounded-lg text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Decor & Layout</span>
                <span className="text-[10px] opacity-60">▼</span>
              </button>
              {showPremiumDropdown && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-[#1E1E24] border border-card-border rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={() => { addGradientRectLayer(); setShowPremiumDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Gradient Background
                  </button>
                  <button
                    onClick={() => { addBlobLayer(); setShowPremiumDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Organic Blob Shape
                  </button>
                  <button
                    onClick={() => { addWaveLayer(); setShowPremiumDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Decorative Wave
                  </button>
                  <button
                    onClick={() => { addBadgeLayer(); setShowPremiumDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Offer Badge Shape
                  </button>
                  <button
                    onClick={() => { addButtonLayer(); setShowPremiumDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors font-bold"
                  >
                    Call to Action Button
                  </button>
                  <button
                    onClick={() => { addIconLayer(); setShowPremiumDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                  >
                    Icon Placeholder
                  </button>
                </div>
              )}
            </div>

            {/* Image Box */}
            <button
              onClick={addPlaceholderLayer}
              className="flex items-center gap-1 px-3 py-1.5 bg-card border border-card-border hover:bg-card/25 rounded-lg text-xs font-semibold transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
              <span>Image Box</span>
            </button>
          </div>
        </div>

        {/* Save & Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDesign}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 border border-card-border hover:bg-card/25 disabled:opacity-50 rounded-lg text-xs font-bold transition-all text-foreground"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/10 text-white rounded-lg text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Side: Layer Hierarchy/Outline */}
        <aside className="w-64 border-r border-card-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Layers Panel</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {layers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-8">No layers in document</p>
            ) : (
              layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleSelect(l.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all border text-left ${
                    l.id === selectedId 
                      ? 'bg-primary/15 border-primary/30 font-semibold text-white' 
                      : 'border-transparent hover:bg-card/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {l.type === 'text' && <Type className="w-3.5 h-3.5 flex-shrink-0" />}
                    {(l.type === 'rect' || l.type === 'gradient_rect') && <Square className="w-3.5 h-3.5 flex-shrink-0" />}
                    {l.type === 'circle' && <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />}
                    {l.type === 'ellipse' && <div className="w-3.5 h-2 rounded-full border border-current flex-shrink-0" />}
                    {l.type === 'image_placeholder' && <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />}
                    {l.type === 'button' && <span className="text-[9px] uppercase font-bold border border-current px-1 rounded flex-shrink-0 font-mono text-primary-light">Btn</span>}
                    {l.type === 'badge' && <span className="text-[9px] uppercase font-bold border border-current px-1 rounded flex-shrink-0 font-mono text-red-500">Bdg</span>}
                    {l.type === 'star' && <span className="text-yellow-500 font-bold flex-shrink-0 text-xs">★</span>}
                    {l.type === 'polygon' && <span className="text-blue-500 font-bold flex-shrink-0 text-[10px]">▲</span>}
                    {l.type === 'line' && <span className="font-bold flex-shrink-0 text-xs">―</span>}
                    {l.type === 'arrow' && <span className="font-bold flex-shrink-0 text-xs">➔</span>}
                    {l.type === 'blob' && <span className="text-purple-400 flex-shrink-0 text-xs">✿</span>}
                    {l.type === 'wave' && <span className="text-blue-400 flex-shrink-0 text-xs">~</span>}
                    {l.type === 'icon_placeholder' && <span className="text-gray-400 flex-shrink-0 text-xs">★</span>}
                    <span className="truncate">
                      {l.type === 'text' ? l.text : l.id}
                    </span>
                  </div>
                  {l.locked && (
                    <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Locked</span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Center: Stage Viewport */}
        <div 
          ref={containerRef}
          className="flex-1 bg-[#18181B] flex items-center justify-center p-8 overflow-hidden relative"
        >
          <KonvaCanvas
            stageRef={stageRef}
            layers={layers}
            selectedId={selectedId}
            onSelect={handleSelect}
            onChangeLayer={(updatedLayer) => {
              const updated = layers.map((l) => (l.id === updatedLayer.id ? updatedLayer : l));
              updateLayersState(updated);
            }}
            scale={scale}
            canvasConfig={canvasConfig}
          />
        </div>

        {/* Right Side: Property Sidebar Panel */}
        <aside className="w-80 border-l border-card-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Properties Panel</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {!selectedLayer ? (
              <div className="text-center py-20">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
                <p className="text-xs text-muted-foreground max-w-[180px] mx-auto leading-relaxed">
                  Click on an element on the canvas to configure colors, sizing, text, and photos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. General Layout properties (x, y, w, h, rotation, ordering) */}
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Layout & Ordering</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">X Coordinate</label>
                      <input
                        type="number"
                        value={selectedLayer.x}
                        onChange={(e) => updateSelectedLayer({ x: Number(e.target.value) })}
                        disabled={selectedLayer.locked}
                        className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Y Coordinate</label>
                      <input
                        type="number"
                        value={selectedLayer.y}
                        onChange={(e) => updateSelectedLayer({ y: Number(e.target.value) })}
                        disabled={selectedLayer.locked}
                        className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={selectedLayer.width || 100}
                        onChange={(e) => updateSelectedLayer({ width: Number(e.target.value) })}
                        disabled={selectedLayer.locked}
                        className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={selectedLayer.height || 100}
                        onChange={(e) => updateSelectedLayer({ height: Number(e.target.value) })}
                        disabled={selectedLayer.locked}
                        className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Rotation Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-muted-foreground">Rotation</label>
                      <span className="text-[10px] font-mono text-muted-foreground">{selectedLayer.rotation || 0}°</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedLayer.rotation || 0}
                        onChange={(e) => updateSelectedLayer({ rotation: Number(e.target.value) })}
                        disabled={selectedLayer.locked}
                        className="flex-1 accent-primary bg-card-border h-1 rounded"
                      />
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={selectedLayer.rotation || 0}
                        onChange={(e) => updateSelectedLayer({ rotation: Number(e.target.value) })}
                        disabled={selectedLayer.locked}
                        className="w-14 px-1.5 py-1 bg-card/25 border border-card-border rounded text-[11px] text-center font-mono focus:outline-none text-foreground"
                      />
                    </div>
                  </div>

                  {/* Bring Forward / Send Backward actions */}
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Layer Ordering</label>
                    <div className="flex gap-2">
                      <button
                        onClick={bringForward}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border border-card-border hover:bg-card/25 rounded text-xs font-semibold text-foreground transition-all"
                        title="Bring Layer Forward"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Bring Forward</span>
                      </button>
                      <button
                        onClick={sendBackward}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border border-card-border hover:bg-card/25 rounded text-xs font-semibold text-foreground transition-all"
                        title="Send Layer Backward"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span>Send Backward</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-card-border" />

                {/* 2. Text Specific Properties */}
                {selectedLayer.type === 'text' && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Typography</h4>
                    
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Text Value</label>
                      <textarea
                        value={selectedLayer.text}
                        onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                        disabled={selectedLayer.locked}
                        rows={3}
                        className="w-full px-2.5 py-2 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50 leading-relaxed resize-none text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Font Size (px)</label>
                        <input
                          type="number"
                          value={selectedLayer.fontSize}
                          onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                          disabled={selectedLayer.locked}
                          className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50 font-mono text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Font Family</label>
                        <select
                          value={selectedLayer.fontFamily}
                          onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}
                          disabled={selectedLayer.locked}
                          className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50 text-foreground"
                        >
                          {AVAILABLE_FONTS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Font Weight</label>
                        <select
                          value={selectedLayer.fontStyle || 'normal'}
                          onChange={(e) => updateSelectedLayer({ fontStyle: e.target.value })}
                          disabled={selectedLayer.locked}
                          className="px-2 py-1 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary text-foreground"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="italic">Italic</option>
                          <option value="bold italic">Bold Italic</option>
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground block mb-1">Text Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedLayer.fill || '#111827'}
                            onChange={(e) => updateSelectedLayer({ fill: e.target.value })}
                            disabled={selectedLayer.locked}
                            className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                          />
                          <span className="text-[11px] font-mono text-muted-foreground">{selectedLayer.fill || '#111827'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Alignment</label>
                      <div className="flex gap-1.5 bg-card-border/10 p-1 rounded-lg w-max">
                        <button
                          onClick={() => updateSelectedLayer({ align: 'left' })}
                          disabled={selectedLayer.locked}
                          className={`p-1.5 rounded transition-all ${selectedLayer.align === 'left' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-card/20'}`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateSelectedLayer({ align: 'center' })}
                          disabled={selectedLayer.locked}
                          className={`p-1.5 rounded transition-all ${selectedLayer.align === 'center' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-card/20'}`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateSelectedLayer({ align: 'right' })}
                          disabled={selectedLayer.locked}
                          className={`p-1.5 rounded transition-all ${selectedLayer.align === 'right' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-card/20'}`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Shape Specific Properties (Unified Styling Panel) */}
                {['rect', 'circle', 'ellipse', 'star', 'polygon', 'blob', 'wave', 'badge', 'button', 'icon_placeholder', 'line', 'arrow', 'gradient_rect'].includes(selectedLayer.type) && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Fill & Border</h4>
                    
                    {/* Standard Color Fill */}
                    {selectedLayer.type !== 'line' && selectedLayer.type !== 'arrow' && selectedLayer.type !== 'gradient_rect' && (
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Fill Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedLayer.fill || '#EA580C'}
                            onChange={(e) => updateSelectedLayer({ fill: e.target.value })}
                            disabled={selectedLayer.locked}
                            className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                          />
                          <span className="text-[11px] font-mono text-muted-foreground uppercase">{selectedLayer.fill || '#EA580C'}</span>
                        </div>
                      </div>
                    )}

                    {/* Gradient Background Options */}
                    {selectedLayer.type === 'gradient_rect' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Color Stop 1</label>
                            <input
                              type="color"
                              value={Array.isArray(selectedLayer.fill) ? selectedLayer.fill[0] : (selectedLayer.fill || '#EA580C')}
                              onChange={(e) => {
                                const currentFill = Array.isArray(selectedLayer.fill) ? [...selectedLayer.fill] : [selectedLayer.fill || '#EA580C', '#FDBA74'];
                                currentFill[0] = e.target.value;
                                updateSelectedLayer({ fill: currentFill });
                              }}
                              disabled={selectedLayer.locked}
                              className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Color Stop 2</label>
                            <input
                              type="color"
                              value={Array.isArray(selectedLayer.fill) ? (selectedLayer.fill[1] || selectedLayer.fill[0]) : '#FDBA74'}
                              onChange={(e) => {
                                const currentFill = Array.isArray(selectedLayer.fill) ? [...selectedLayer.fill] : [selectedLayer.fill || '#EA580C', '#FDBA74'];
                                currentFill[1] = e.target.value;
                                updateSelectedLayer({ fill: currentFill });
                              }}
                              disabled={selectedLayer.locked}
                              className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Gradient Direction</label>
                          <select
                            value={selectedLayer.gradientDirection || 'vertical'}
                            onChange={(e) => updateSelectedLayer({ gradientDirection: e.target.value })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary text-foreground bg-transparent"
                          >
                            <option value="vertical">Vertical</option>
                            <option value="horizontal">Horizontal</option>
                            <option value="diagonal">Diagonal</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Stroke options */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Border Color</label>
                        <input
                          type="color"
                          value={selectedLayer.stroke || '#1E293B'}
                          onChange={(e) => updateSelectedLayer({ stroke: e.target.value })}
                          disabled={selectedLayer.locked}
                          className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Border Width</label>
                        <input
                          type="number"
                          min="0"
                          value={selectedLayer.strokeWidth || 0}
                          onChange={(e) => updateSelectedLayer({ strokeWidth: Number(e.target.value) })}
                          disabled={selectedLayer.locked}
                          className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                        />
                      </div>
                    </div>

                    {/* Corner Radius (rect, gradient_rect, badge, button) */}
                    {['rect', 'gradient_rect', 'badge', 'button'].includes(selectedLayer.type) && (
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Corner Radius (px)</label>
                        <input
                          type="number"
                          min="0"
                          value={selectedLayer.cornerRadius || 0}
                          onChange={(e) => updateSelectedLayer({ cornerRadius: Number(e.target.value) })}
                          disabled={selectedLayer.locked}
                          className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                        />
                      </div>
                    )}

                    {/* Star options */}
                    {selectedLayer.type === 'star' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Points</label>
                          <input
                            type="number"
                            min="3"
                            max="20"
                            value={selectedLayer.numPoints || 5}
                            onChange={(e) => updateSelectedLayer({ numPoints: Number(e.target.value) })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Inner Ratio</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="0.9"
                            value={selectedLayer.innerRadiusRatio || 0.4}
                            onChange={(e) => updateSelectedLayer({ innerRadiusRatio: Number(e.target.value) })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                          />
                        </div>
                      </div>
                    )}

                    {/* Polygon options */}
                    {selectedLayer.type === 'polygon' && (
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Number of Sides</label>
                        <input
                          type="number"
                          min="3"
                          max="12"
                          value={selectedLayer.sides || 3}
                          onChange={(e) => updateSelectedLayer({ sides: Number(e.target.value) })}
                          disabled={selectedLayer.locked}
                          className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                        />
                      </div>
                    )}

                    {/* Badge & Button styling */}
                    {(selectedLayer.type === 'badge' || selectedLayer.type === 'button') && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Label Text</label>
                          <input
                            type="text"
                            value={selectedLayer.text || ''}
                            onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-semibold text-foreground"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Label Color</label>
                            <input
                              type="color"
                              value={selectedLayer.textColor || '#FFFFFF'}
                              onChange={(e) => updateSelectedLayer({ textColor: e.target.value })}
                              disabled={selectedLayer.locked}
                              className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Font Size</label>
                            <input
                              type="number"
                              value={selectedLayer.fontSize || 24}
                              onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                              disabled={selectedLayer.locked}
                              className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Icon Placeholder styling */}
                    {selectedLayer.type === 'icon_placeholder' && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Icon Symbol (★, ✔, ✉, ☎)</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={selectedLayer.icon || '★'}
                            onChange={(e) => updateSelectedLayer({ icon: e.target.value })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none text-foreground"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Icon Color</label>
                            <input
                              type="color"
                              value={selectedLayer.textColor || '#64748B'}
                              onChange={(e) => updateSelectedLayer({ textColor: e.target.value })}
                              disabled={selectedLayer.locked}
                              className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Icon Size</label>
                            <input
                              type="number"
                              value={selectedLayer.fontSize || 20}
                              onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                              disabled={selectedLayer.locked}
                              className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 4. Image Manager (Image / Image Placeholder specific) */}
                {(selectedLayer.type === 'image_placeholder' || selectedLayer.type === 'image') && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Image Manager</h4>

                    <div className="space-y-2">
                      {selectedLayer.imageUrl ? (
                        <div className="space-y-3">
                          <div className="border border-card-border bg-card/25 p-2 rounded-lg relative overflow-hidden h-36 flex items-center justify-center">
                            <img
                              src={selectedLayer.imageUrl}
                              alt="Uploaded visual preview"
                              className="max-h-full max-w-full rounded object-cover"
                            />
                            <button
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white hover:bg-red-700 rounded-full transition-all text-xs"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-1">Image Fit</label>
                            <select
                              value={selectedLayer.fit || 'cover'}
                              onChange={(e) => updateSelectedLayer({ fit: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary text-foreground bg-transparent"
                            >
                              <option value="cover">Crop Cover (fill container)</option>
                              <option value="contain">Contain (entire image)</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-card-border p-6 rounded-lg text-center bg-card/15">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2 animate-bounce" />
                          <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold transition-all shadow"
                          >
                            Upload Custom Photo
                          </button>
                        </div>
                      )}

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Border Width</label>
                        <input
                          type="number"
                          value={selectedLayer.strokeWidth || 0}
                          onChange={(e) => updateSelectedLayer({ strokeWidth: Number(e.target.value) })}
                          disabled={selectedLayer.locked}
                          className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Border Color</label>
                        <input
                          type="color"
                          value={selectedLayer.stroke || '#EA580C'}
                          onChange={(e) => updateSelectedLayer({ stroke: e.target.value })}
                          disabled={selectedLayer.locked}
                          className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Corner Radius (px)</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedLayer.cornerRadius || 0}
                        onChange={(e) => updateSelectedLayer({ cornerRadius: Number(e.target.value) })}
                        disabled={selectedLayer.locked}
                        className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                      />
                    </div>
                  </div>
                )}

                <div className="h-[1px] bg-card-border" />

                {/* 5. Soft Shadows Configuration Panel */}
                <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Soft Shadows</h4>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-muted-foreground">Shadow Blur</label>
                      <span className="text-[10px] font-mono text-muted-foreground">{selectedLayer.shadowBlur || 0}px</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={selectedLayer.shadowBlur || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateSelectedLayer({
                            shadowBlur: val,
                            shadowColor: val > 0 ? (selectedLayer.shadowColor || '#000000') : null,
                            shadowOpacity: val > 0 ? (selectedLayer.shadowOpacity !== undefined ? selectedLayer.shadowOpacity : 0.2) : 0,
                            shadowOffsetY: val > 0 ? (selectedLayer.shadowOffsetY || 4) : 0,
                            shadowOffsetX: val > 0 ? (selectedLayer.shadowOffsetX || 0) : 0,
                          });
                        }}
                        disabled={selectedLayer.locked}
                        className="flex-1 accent-primary bg-card-border h-1 rounded"
                      />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={selectedLayer.shadowBlur || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateSelectedLayer({
                            shadowBlur: val,
                            shadowColor: val > 0 ? (selectedLayer.shadowColor || '#000000') : null,
                            shadowOpacity: val > 0 ? (selectedLayer.shadowOpacity !== undefined ? selectedLayer.shadowOpacity : 0.2) : 0,
                            shadowOffsetY: val > 0 ? (selectedLayer.shadowOffsetY || 4) : 0,
                            shadowOffsetX: val > 0 ? (selectedLayer.shadowOffsetX || 0) : 0,
                          });
                        }}
                        disabled={selectedLayer.locked}
                        className="w-14 px-1.5 py-1 bg-card/25 border border-card-border rounded text-[11px] text-center font-mono focus:outline-none text-foreground"
                      />
                    </div>
                  </div>

                  {Number(selectedLayer.shadowBlur) > 0 && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Shadow Color</label>
                          <input
                            type="color"
                            value={selectedLayer.shadowColor || '#000000'}
                            onChange={(e) => updateSelectedLayer({ shadowColor: e.target.value })}
                            disabled={selectedLayer.locked}
                            className="w-8 h-8 rounded border border-card-border cursor-pointer bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Opacity (0-1)</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={selectedLayer.shadowOpacity !== undefined ? selectedLayer.shadowOpacity : 0.2}
                            onChange={(e) => updateSelectedLayer({ shadowOpacity: Number(e.target.value) })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Offset X (px)</label>
                          <input
                            type="number"
                            value={selectedLayer.shadowOffsetX || 0}
                            onChange={(e) => updateSelectedLayer({ shadowOffsetX: Number(e.target.value) })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Offset Y (px)</label>
                          <input
                            type="number"
                            value={selectedLayer.shadowOffsetY || 0}
                            onChange={(e) => updateSelectedLayer({ shadowOffsetY: Number(e.target.value) })}
                            disabled={selectedLayer.locked}
                            className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary font-mono text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-card-border" />

                {/* 6. Settings (Opacity, Lock, Delete/Duplicate) */}
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Layer Actions</h4>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-muted-foreground">Opacity</label>
                      <span className="text-[10px] font-mono text-muted-foreground">{Math.round((selectedLayer.opacity || 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1}
                      onChange={(e) => updateSelectedLayer({ opacity: Number(e.target.value) })}
                      disabled={selectedLayer.locked}
                      className="w-full accent-primary bg-card-border h-1 rounded"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateSelectedLayer({ locked: !selectedLayer.locked })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded text-xs font-semibold transition-all ${
                        selectedLayer.locked 
                          ? 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                          : 'border-card-border hover:bg-card/25 text-foreground'
                      }`}
                    >
                      <span>{selectedLayer.locked ? 'Unlock Layer' : 'Lock Layer'}</span>
                    </button>

                    <button
                      onClick={duplicateLayer}
                      disabled={selectedLayer.locked}
                      className="p-2 border border-card-border hover:bg-card/25 rounded text-muted-foreground hover:text-foreground transition-all disabled:opacity-30"
                      title="Duplicate Layer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={deleteLayer}
                      disabled={selectedLayer.locked}
                      className="p-2 border border-card-border hover:bg-red-950/20 hover:border-red-800 text-muted-foreground hover:text-red-500 rounded transition-all disabled:opacity-30"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};
export default PosterEditor;
