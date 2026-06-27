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
  AlignLeft, AlignCenter, AlignRight, Check, ArrowUp, ArrowDown,
  ChevronDown, ChevronRight, ChevronLeft, Shapes, Minus
} from 'lucide-react';
import { Loader } from '../components/Loader';
import { ToastContainer } from '../components/Toast';
import { ICON_LIBRARY } from '../components/editor/IconLayer';
import {
  GOOGLE_FONTS, loadGoogleFonts, loadStoredCustomFonts,
  addCustomFontFromFile, measureText,
} from '../utils/fonts';

export const PosterEditor = () => {
  const { planId } = useParams(); // planId represents the taskId
  const navigate = useNavigate();
  const { addNotification, activeProject } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState(null);

  // Fonts: curated Google fonts + user-uploaded custom fonts. `fontTick` bumps
  // whenever a font finishes loading so the canvas can redraw with it.
  const [customFonts, setCustomFonts] = useState([]);
  const [fontTick, setFontTick] = useState(0);
  const fontInputRef = useRef(null);

  // Auto-save status
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveSkip = useRef(true);

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
  const [showElementsDropdown, setShowElementsDropdown] = useState(false);

  // Canva-style sidebar tabs and drawer states (start collapsed)
  const [activeTab, setActiveTab] = useState('assets'); // 'assets' | 'text' | 'media'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const handleTabClick = (tabId) => {
    if (activeTab === tabId && isDrawerOpen) {
      setIsDrawerOpen(false);
    } else {
      setActiveTab(tabId);
      setIsDrawerOpen(true);
    }
  };

  // AI connection code (shown to the user to paste into Claude) + right-panel tab
  const [connectCode, setConnectCode] = useState(null);
  const [rightTab, setRightTab] = useState('properties'); // 'layers' | 'properties'

  // Undo/Redo History Stack
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Container Measurement State for Responsive Canvas Scale
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const rightSidebarRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  // Workspace Panning & Navigation State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Image-by-URL input (alongside local upload)
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Hidden File Input Trigger
  const fileInputRef = useRef(null);

  // Drag-and-drop from the Elements panel onto the canvas.
  // `draggedItem` holds the panel item being dragged; `pendingDropPos` carries
  // the canvas coordinates where the next inserted layer should be centered.
  const draggedItemRef = useRef(null);
  const pendingDropPos = useRef(null);

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
        console.log(taskRes);
        associatedTask = taskRes.data.data;
        setTask(associatedTask);

        if (loadedDesign) {
          // Load customized saved design
          const validated = validateDesignJson(loadedDesign.posterDesign);
          if (validated) {
            console.log(validated);
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
    const category = associatedTask?.projectId?.category || activeProject?.category || 'Business';
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

  // Load curated Google fonts + any persisted custom fonts on mount, then nudge
  // the canvas to redraw once they are ready.
  useEffect(() => {
    loadGoogleFonts();
    const bump = () => setFontTick((t) => t + 1);
    if (document.fonts?.ready) document.fonts.ready.then(bump);
    // Redraw whenever any font finishes loading (Google fonts fetch lazily).
    document.fonts?.addEventListener?.('loadingdone', bump);
    loadStoredCustomFonts().then((names) => {
      if (names.length) {
        setCustomFonts(names);
        bump();
      }
    });
    return () => document.fonts?.removeEventListener?.('loadingdone', bump);
  }, []);

  // Handle a custom font file upload (.ttf/.otf/.woff/.woff2).
  const handleFontFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    try {
      const name = await addCustomFontFromFile(file);
      setCustomFonts((prev) => (prev.includes(name) ? prev : [...prev, name]));
      setFontTick((t) => t + 1);
      if (selectedId && selectedLayer?.type === 'text') {
        updateSelectedLayer({ fontFamily: name });
      }
      addNotification('success', `Font "${name}" added`);
    } catch {
      addNotification('error', 'Could not load that font file');
    }
  };

  // 2. Measure Container for Scaling
  const autoFitScale = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = (clientWidth - 40) / canvasConfig.width;
      const scaleY = (clientHeight - 40) / canvasConfig.height;
      setScale(Math.min(0.9, scaleX, scaleY));
      setPan({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(autoFitScale, 100);
      window.addEventListener('resize', autoFitScale);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', autoFitScale);
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

  // ─── AI LIVE CHANNEL (MCP) ────────────────────────────────────────────────
  // The external AI host (Claude) edits this open poster through the MCP server:
  // it pushes design JSON down to us over SSE, and reads our current design +
  // rendered preview that we stream back up over REST.
  const [aiLive, setAiLive] = useState(false);

  // Keep the latest design in a ref so SSE handlers never read stale state.
  const designRef = useRef(null);
  useEffect(() => {
    designRef.current = { canvas: canvasConfig, theme, layers };
  }, [canvasConfig, theme, layers]);

  const capturePreview = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    try {
      return stage.toDataURL({ pixelRatio: 1 });
    } catch {
      return null; // tainted canvas (cross-origin image) — skip preview
    }
  };

  // Push our current design + rendered preview up so the AI host can read/verify it.
  const pushStateUp = () => {
    const token = localStorage.getItem('trendbite_token');
    if (!token || !designRef.current) return;
    api.post('/designs/live/sync', {
      planId,
      design: designRef.current,
      preview: capturePreview(),
    }).catch(() => { });
  };

  // Apply an AI-pushed design to the canvas.
  const applyAiDesign = (design) => {
    const validated = validateDesignJson(design);
    if (!validated) {
      addNotification('error', 'AI sent an invalid design');
      return;
    }
    setCanvasConfig(validated.canvas);
    setTheme(validated.theme);
    updateLayersState(validated.layers); // recorded in undo history
    setSelectedId(null);
    addNotification('success', 'AI updated the poster design');
  };

  // Open the SSE stream once the editor has finished loading.
  useEffect(() => {
    if (loading || !planId) return;
    const token = localStorage.getItem('trendbite_token');
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
    const es = new EventSource(
      `${base}/designs/live/${planId}/stream?token=${encodeURIComponent(token)}`
    );

    es.addEventListener('connected', (e) => {
      setAiLive(true);
      try {
        const { code } = JSON.parse(e.data);
        if (code) setConnectCode(code);
      } catch { /* ignore */ }
    });
    es.addEventListener('design', (e) => {
      try {
        applyAiDesign(JSON.parse(e.data).design);
      } catch {
        /* ignore malformed event */
      }
    });
    // AI asked for a fresh render of the current canvas.
    es.addEventListener('render', () => setTimeout(pushStateUp, 60));
    es.onerror = () => setAiLive(false);

    return () => es.close();
  }, [loading, planId]);

  // Stream current state up (debounced) on load and after any change — local or
  // AI-driven — so the host always sees an up-to-date design and preview.
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(pushStateUp, 800);
    return () => clearTimeout(t);
  }, [layers, canvasConfig, theme, loading]);

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
    // Manually setting width/height on a text layer means the user wants a fixed
    // wrapping box, so stop auto-fitting it.
    const setsBox = properties.width !== undefined || properties.height !== undefined;
    const updatedLayers = layers.map((l) => {
      if (l.id !== selectedId) return l;
      let merged = { ...l, ...properties };
      if (merged.type === 'text') {
        if (setsBox) {
          merged.autoFit = false;
        } else if (merged.autoFit !== false) {
          // Re-hug the text whenever its content/typography changes.
          merged = { ...merged, ...measureText(merged) };
        }
      }
      return merged;
    });
    updateLayersState(updatedLayers);
  };

  // 4b. Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if (isMod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (!selectedId || !selectedLayer) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteLayer();
        return;
      }

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (isArrow) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const rotateStep = e.shiftKey ? 15 : 5;

        if (e.altKey) {
          let diff = 0;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') diff = -rotateStep;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') diff = rotateStep;

          if (diff !== 0) {
            const currentRot = selectedLayer.rotation || 0;
            let nextRot = (currentRot + diff) % 360;
            if (nextRot < 0) nextRot += 360;
            updateSelectedLayer({ rotation: nextRot });
          }
          return;
        }

        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;

        if (dx !== 0 || dy !== 0) {
          updateSelectedLayer({
            x: selectedLayer.x + dx,
            y: selectedLayer.y + dy,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, selectedLayer, historyIndex, history]);

  // 4c. Global Click-Outside Deselection Listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!selectedId) return;

      const clickInCanvas = containerRef.current && containerRef.current.contains(e.target);
      const clickInProperties = rightSidebarRef.current && rightSidebarRef.current.contains(e.target);

      if (!clickInCanvas && !clickInProperties) {
        handleSelect(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [selectedId]);

  // 4d. Workspace Panning and Navigation Listeners
  // Spacebar tracking for Panning mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handlePanMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleWorkspaceMouseDown = (e) => {
    // Middle click pans anywhere
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
      return;
    }
    // Left click on empty workspace background pans
    if (e.button === 0 && e.target === containerRef.current) {
      e.preventDefault();
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // Non-passive wheel event listener for trackpad pinch-to-zoom and panning
  useEffect(() => {
    if (loading) return;
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        // Zoom
        const zoomFactor = 0.02;
        const direction = e.deltaY < 0 ? 1 : -1;
        setScale((prev) => Math.max(0.1, Math.min(2.0, prev + direction * zoomFactor)));
      } else {
        // Pan/scroll
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [loading]);

  // 5. Canvas Layer Insertion Actions
  const handleSelect = (id) => {
    setSelectedId(id);
    if (id) setRightTab('properties');
    setShowTextDropdown(false);
    setShowShapesDropdown(false);
    setShowPremiumDropdown(false);
    setShowElementsDropdown(false);
  };

  // Single chokepoint for inserting a new layer. When a drag-and-drop is in
  // progress (pendingDropPos set) the layer is re-centered on the drop point;
  // otherwise the layer keeps the position its creator chose.
  const addLayer = (newLayer) => {
    let layer = newLayer;
    if (pendingDropPos.current) {
      const w = layer.width || 100;
      const h = layer.height || 100;
      layer = {
        ...layer,
        x: Math.round(pendingDropPos.current.x - w / 2),
        y: Math.round(pendingDropPos.current.y - h / 2),
      };
      pendingDropPos.current = null;
    }
    updateLayersState([...layers, layer]);
    handleSelect(layer.id);
    return layer;
  };

  // Map a viewport (client) point to canvas coordinates using the live stage
  // container rect and current zoom scale, clamped to the canvas bounds.
  const clientToCanvas = (clientX, clientY) => {
    const stage = stageRef.current;
    if (!stage) return { x: canvasConfig.width / 2, y: canvasConfig.height / 2 };
    const rect = stage.container().getBoundingClientRect();
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    return {
      x: Math.max(0, Math.min(canvasConfig.width, x)),
      y: Math.max(0, Math.min(canvasConfig.height, y)),
    };
  };

  // Drop handler for the canvas viewport: place the dragged panel item where
  // the user released, then run its normal insert action.
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const item = draggedItemRef.current;
    draggedItemRef.current = null;
    if (!item || typeof item.onClick !== 'function') return;
    pendingDropPos.current = clientToCanvas(e.clientX, e.clientY);
    item.onClick();
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
      lineHeight: 1.2,
      letterSpacing: 0,
      autoFit: true,
      fill: theme.accentColor || '#111827',
      align: 'center',
      opacity: 1,
      locked: false,
      editable: true
    };
    addLayer({ ...newText, ...measureText(newText) });
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
      lineHeight: 1.2,
      letterSpacing: 0,
      autoFit: true,
      fill: theme.accentColor || '#111827',
      align: 'center',
      opacity: 1,
      locked: false,
      editable: true
    };
    addLayer({ ...newLayer, ...measureText(newLayer) });
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
    addLayer(newShape);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newLayer);
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
    addLayer(newPlaceholder);
  };

  // Generic inserter for the new element library. Centers the element on the canvas.
  const addElement = (type, props = {}) => {
    const w = props.width || 160;
    const h = props.height || 160;
    const newLayer = {
      id: `${type}_${Date.now()}`,
      type,
      x: Math.round((canvasConfig.width - w) / 2),
      y: Math.round((canvasConfig.height - h) / 2),
      width: w,
      height: h,
      opacity: 1,
      locked: false,
      editable: true,
      ...props,
    };
    addLayer(newLayer);
  };

  const ELEMENT_INSERTERS = [
    { label: 'QR Code', type: 'qr_code', props: { width: 220, height: 220, value: 'https://example.com', fill: '#000000', bgColor: '#FFFFFF' } },
    { label: 'Icon', type: 'icon', props: { width: 80, height: 80, icon: 'star', fill: theme.primaryColor || '#EA580C' } },
    { label: 'Offer Ribbon', type: 'ribbon', props: { width: 320, height: 90, text: 'SALE', fill: '#DC2626', textColor: '#FFFFFF', fontSize: 30, fontFamily: theme.fontFamily, fontStyle: 'bold' } },
    { label: 'Speech Bubble', type: 'speech_bubble', props: { width: 300, height: 200, text: 'Hello!', fill: '#1E293B', textColor: '#FFFFFF', fontSize: 28, fontFamily: theme.fontFamily } },
    { label: 'Triangle', type: 'triangle', props: { width: 140, height: 140, fill: theme.primaryColor || '#3B82F6' } },
    { label: 'Hexagon', type: 'hexagon', props: { width: 150, height: 150, fill: '#8B5CF6' } },
    { label: 'Heart', type: 'heart', props: { width: 140, height: 140, fill: '#EF4444' } },
    { label: 'Shield', type: 'shield', props: { width: 140, height: 160, fill: '#0EA5E9' } },
    { label: 'Curved Text', type: 'curved_text', props: { width: 320, height: 320, text: 'YOUR TEXT HERE', fill: theme.accentColor || '#111827', fontSize: 30, fontFamily: theme.fontFamily, fontStyle: 'bold' } },
    { label: 'Divider', type: 'divider', props: { width: 340, height: 24, stroke: theme.accentColor || '#94A3B8' } },
    { label: 'Progress Bar', type: 'progress_bar', props: { width: 380, height: 28, value: 70, fill: '#22C55E', trackColor: '#E2E8F0' } },
    { label: 'Star Rating', type: 'rating', props: { width: 280, height: 56, value: 5, max: 5, fill: '#FACC15' } },
    { label: 'Ashoka Chakra', type: 'chakra', props: { width: 180, height: 180, spokes: 24, fill: '#000080' } },
    { label: 'Dot Pattern', type: 'pattern', props: { width: 420, height: 420, variant: 'dots', fill: '#CBD5E1', gap: 36 } },
    { label: 'Angled Block', type: 'angled_block', props: { width: 460, height: 320, skew: 0.18, direction: 'right', fill: '#1E293B' } },
    { label: 'Checklist', type: 'checklist', props: { width: 440, height: 232, rowHeight: 58, fontSize: 26, items: ['Front Office Staff', 'Accountant Staff', 'Graphic Designer', 'Website Designer'], checkColor: '#F59E0B', textColor: '#1E293B' } },
  ];

  // Left-rail element library: a glyph + label per item, grouped by section.
  const el = (type) => {
    const found = ELEMENT_INSERTERS.find((e) => e.type === type);
    return () => addElement(type, found ? found.props : {});
  };
  const INSERT_SECTIONS = [
    {
      title: 'Text',
      items: [
        { label: 'Heading', glyph: 'H', onClick: addHeadingLayer },
        { label: 'Body', glyph: '¶', onClick: addTextLayer },
        { label: 'Curved', glyph: '◠', onClick: el('curved_text') },
      ],
    },
    {
      title: 'Shapes',
      items: [
        { label: 'Rectangle', glyph: '▭', onClick: addShapeLayer },
        { label: 'Circle', glyph: '●', onClick: addCircleLayer },
        { label: 'Ellipse', glyph: '⬭', onClick: addEllipseLayer },
        { label: 'Triangle', glyph: '▲', onClick: el('triangle') },
        { label: 'Hexagon', glyph: '⬡', onClick: el('hexagon') },
        { label: 'Star', glyph: '★', onClick: addStarLayer },
        { label: 'Polygon', glyph: '⬠', onClick: addPolygonLayer },
        { label: 'Heart', glyph: '♥', onClick: el('heart') },
        { label: 'Shield', glyph: '🛡', onClick: el('shield') },
        { label: 'Line', glyph: '―', onClick: addLineLayer },
        { label: 'Arrow', glyph: '➔', onClick: addArrowLayer },
      ],
    },
    {
      title: 'Decor',
      items: [
        { label: 'Gradient', glyph: '▦', onClick: addGradientRectLayer },
        { label: 'Blob', glyph: '✿', onClick: addBlobLayer },
        { label: 'Wave', glyph: '〰', onClick: addWaveLayer },
        { label: 'Badge', glyph: '🏷', onClick: addBadgeLayer },
        { label: 'Button', glyph: '⬛', onClick: addButtonLayer },
        { label: 'Ribbon', glyph: '🎀', onClick: el('ribbon') },
        { label: 'Bubble', glyph: '💬', onClick: el('speech_bubble') },
        { label: 'Divider', glyph: '—', onClick: el('divider') },
        { label: 'Pattern', glyph: '⠿', onClick: el('pattern') },
        { label: 'Angled', glyph: '◣', onClick: el('angled_block') },
      ],
    },
    {
      title: 'Smart',
      items: [
        { label: 'QR Code', glyph: '▣', onClick: el('qr_code') },
        { label: 'Icon', glyph: '☆', onClick: el('icon') },
        { label: 'Checklist', glyph: '☑', onClick: el('checklist') },
        { label: 'Rating', glyph: '✦', onClick: el('rating') },
        { label: 'Progress', glyph: '▰', onClick: el('progress_bar') },
        { label: 'Chakra', glyph: '☸', onClick: el('chakra') },
      ],
    },
    {
      title: 'Media',
      items: [
        { label: 'Image Box', glyph: '🖼', onClick: addPlaceholderLayer },
      ],
    },
  ];

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

  // Apply an external image URL to the selected image layer. The image is fetched
  // through the backend proxy and embedded as a data URL, so it displays AND
  // exports regardless of the source host's CORS policy.
  const applyImageUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url || !selectedLayer) return;
    if (!/^https?:\/\//i.test(url)) {
      addNotification('warning', 'Enter a valid image URL (http:// or https://)');
      return;
    }
    try {
      const res = await api.get('/designs/image-proxy', { params: { url } });
      updateSelectedLayer({ imageUrl: res.data.dataUrl, type: 'image_placeholder' });
      setImageUrlInput('');
      addNotification('success', 'Image added from URL');
    } catch (err) {
      addNotification('error', err.response?.data?.message || 'Could not load that image URL');
    }
  };

  const removeImage = () => {
    updateSelectedLayer({ imageUrl: null });
  };

  // 8. DB Save & PNG Export Handlers
  // `silent` is used by auto-save: no toasts, separate status indicator.
  const saveDesign = async ({ silent = false } = {}) => {
    if (silent) setAutoSaving(true);
    else setSaving(true);
    try {
      const designPayload = { canvas: canvasConfig, theme, layers };
      await api.post('/designs', {
        planId, // planId maps to taskId
        posterDesign: designPayload,
        thumbnail: '' // thumbnail upload is optional
      });
      setLastSaved(new Date());
      if (!silent) addNotification('success', 'Poster design saved successfully!');
    } catch (err) {
      if (!silent) addNotification('error', 'Failed to save poster design');
    } finally {
      if (silent) setAutoSaving(false);
      else setSaving(false);
    }
  };

  const handleSaveDesign = () => saveDesign();

  // Auto-save: debounce DB writes after any design change. The first run after
  // load is skipped so simply opening a design doesn't trigger a save.
  useEffect(() => {
    if (loading) return;
    if (autoSaveSkip.current) {
      autoSaveSkip.current = false;
      return;
    }
    const t = setTimeout(() => saveDesign({ silent: true }), 1800);
    return () => clearTimeout(t);
  }, [layers, canvasConfig, theme, loading]);

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

  // Shared input styling for the properties panel
  const fieldCls = 'w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary text-foreground bg-transparent';

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
        </div>

        {/* Save & Export */}
        <div className="flex items-center gap-2">
          {/* AI connect code — paste into Claude to pair this editor */}
          {connectCode && (
            <button
              onClick={() => { navigator.clipboard?.writeText(connectCode); addNotification('success', 'Connect code copied'); }}
              title="Give this code to Claude: say &quot;connect to editor CODE&quot;. Click to copy."
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-purple-400/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span className="opacity-70">AI&nbsp;Code</span>
              <span className="font-mono tracking-widest text-purple-100">{connectCode}</span>
              <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </button>
          )}
          {/* AI live channel status (MCP) */}
          <div
            title={aiLive ? 'AI live channel connected — generate from Claude via MCP' : 'AI live channel offline'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${aiLive
              ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10'
              : 'border-card-border text-muted-foreground bg-card/30'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${aiLive ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50'}`} />
            <span>AI {aiLive ? 'Live' : 'Off'}</span>
          </div>
          {/* Auto-save status */}
          <span className="text-[11px] text-muted-foreground min-w-[64px] text-right">
            {autoSaving
              ? 'Saving…'
              : lastSaved
                ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Auto-save on'}
          </span>
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

        {/* Left Side: Canva-style Sidebar */}
        {/* Left Rail (Tabs) */}
        <div className="w-20 border-r border-card-border bg-sidebar-bg flex flex-col items-center py-4 gap-2 flex-shrink-0">
          {[
            { id: 'assets', label: 'Design Assets', icon: Shapes },
            { id: 'text', label: 'Text', icon: Type },
            { id: 'media', label: 'Media', icon: ImageIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && isDrawerOpen;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${isActive
                  ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/45'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold tracking-wide text-center leading-tight px-1">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Panel */}
        {isDrawerOpen && (
          <aside className="w-64 border-r border-card-border bg-card flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-card-border flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-foreground">
                {activeTab === 'assets' ? 'Design Assets' : activeTab === 'text' ? 'Text' : 'Media'}
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-card-border/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
              {activeTab === 'assets' && (
                <>
                  {INSERT_SECTIONS.filter(s => ['Shapes', 'Decor', 'Smart'].includes(s.title)).map((section) => (
                    <div key={section.title}>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/75 tracking-wider px-1 mb-2">{section.title}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {section.items.map((item) => (
                          <button
                            key={item.label}
                            onClick={item.onClick}
                            draggable
                            onDragStart={(e) => {
                              draggedItemRef.current = item;
                              e.dataTransfer.effectAllowed = 'copy';
                              e.dataTransfer.setData('text/plain', item.label);
                            }}
                            onDragEnd={() => { draggedItemRef.current = null; }}
                            title={`Click to add, or drag onto the canvas — ${item.label}`}
                            className="group flex flex-col items-center justify-center gap-1 aspect-square rounded-lg border border-card-border bg-card/20 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span className="text-3xl leading-none text-foreground/90 group-hover:text-primary group-hover:scale-110 transition-all duration-200 pointer-events-none">{item.glyph}</span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground text-center leading-tight px-0.5 pointer-events-none select-none">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === 'text' && (
                <div className="space-y-3.5">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground/75 tracking-wider px-1">Text Options</p>
                  {INSERT_SECTIONS.find(s => s.title === 'Text')?.items.map((item) => {
                    const previewCls = {
                      'Heading': 'text-base font-extrabold tracking-tight',
                      'Body': 'text-xs font-normal text-muted-foreground',
                      'Curved': 'text-xs font-bold tracking-wider uppercase'
                    }[item.label] || 'text-sm';

                    return (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        draggable
                        onDragStart={(e) => {
                          draggedItemRef.current = item;
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/plain', item.label);
                        }}
                        onDragEnd={() => { draggedItemRef.current = null; }}
                        title={`Click to add, or drag onto the canvas — ${item.label}`}
                        className="w-full text-left px-4 py-3 rounded-lg border border-card-border bg-card/25 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.01]"
                      >
                        <div className={`${previewCls} text-foreground mb-0.5`}>
                          {item.label === 'Heading' ? 'Add a heading' : item.label === 'Body' ? 'Add body text' : 'Add curved text'}
                        </div>
                        <span className="text-[9px] text-muted-foreground/70 font-mono">Glyph: {item.glyph}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-3.5">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground/75 tracking-wider px-1">Media Assets</p>
                  {INSERT_SECTIONS.find(s => s.title === 'Media')?.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      draggable
                      onDragStart={(e) => {
                        draggedItemRef.current = item;
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('text/plain', item.label);
                      }}
                      onDragEnd={() => { draggedItemRef.current = null; }}
                      title={`Click to add, or drag onto the canvas — ${item.label}`}
                      className="group flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-card-border bg-card/20 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-3xl pointer-events-none group-hover:scale-110 transition-transform">{item.glyph}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground text-center font-medium leading-tight pointer-events-none">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center: Stage Viewport (also the drop target for panel elements) */}
        <div
          ref={containerRef}
          onDragOver={(e) => {
            if (!draggedItemRef.current) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={handleCanvasDrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleSelect(null);
            }
            handleWorkspaceMouseDown(e);
          }}
          className={`flex-1 bg-[#18181B] flex items-center justify-center p-8 overflow-hidden relative select-none ${isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : 'cursor-default'
            }`}
        >
          {/* Panning event interceptor */}
          {(isSpacePressed || isPanning) && (
            <div
              className="absolute inset-0 z-20"
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
              onMouseDown={handlePanMouseDown}
            />
          )}

          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="relative"
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
              onDeleteLayer={deleteLayer}
              onDuplicateLayer={duplicateLayer}
              scale={scale}
              canvasConfig={canvasConfig}
              fontTick={fontTick}
            />
          </div>

          {/* Zoom Controls Widget */}
          <div className="absolute bottom-4 right-4 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 flex items-center gap-1.5 shadow-lg backdrop-blur-md z-30 select-none">
            <button
              onClick={() => setScale((prev) => Math.max(0.1, prev - 0.05))}
              className="p-1 hover:bg-zinc-800 rounded text-muted-foreground hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-zinc-300 w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((prev) => Math.min(2.0, prev + 0.05))}
              className="p-1 hover:bg-zinc-800 rounded text-muted-foreground hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-zinc-800" />
            <button
              onClick={autoFitScale}
              className="px-2 py-0.5 hover:bg-zinc-800 rounded text-[9px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Fit to screen"
            >
              FIT
            </button>
          </div>
        </div>

        {/* Right Side: Property Sidebar Panel */}
        <aside ref={rightSidebarRef} className="w-80 border-l border-card-border bg-card flex flex-col overflow-hidden">
          {/* Tabs: Layers / Properties */}
          <div className="flex border-b border-card-border flex-shrink-0">
            {['layers', 'properties'].map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-3 text-[11px] uppercase font-bold tracking-wider transition-colors ${rightTab === tab
                  ? 'text-foreground border-b-2 border-primary bg-card/20'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
                  }`}
              >
                {tab === 'layers' ? `Layers${layers.length ? ` · ${layers.length}` : ''}` : 'Properties'}
              </button>
            ))}
          </div>

          {/* Layers tab */}
          {rightTab === 'layers' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {layers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center pt-8">No layers yet — add from the Design Assets panel.</p>
              ) : (
                [...layers].reverse().map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleSelect(l.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all border text-left ${l.id === selectedId
                      ? 'bg-primary/15 border-primary/30 font-semibold text-white'
                      : 'border-transparent hover:bg-card/20 text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {l.type === 'text' && <Type className="w-3.5 h-3.5 flex-shrink-0" />}
                      {(l.type === 'rect' || l.type === 'gradient_rect') && <Square className="w-3.5 h-3.5 flex-shrink-0" />}
                      {l.type === 'circle' && <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />}
                      {l.type === 'image_placeholder' && <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />}
                      {!['text', 'rect', 'gradient_rect', 'circle', 'image_placeholder'].includes(l.type) && (
                        <span className="w-3.5 text-center flex-shrink-0 text-[11px] opacity-70">◆</span>
                      )}
                      <span className="truncate">{l.type === 'text' ? l.text : (l.id || l.type)}</span>
                    </div>
                    {l.locked && <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">🔒</span>}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Properties tab */}
          {rightTab === 'properties' && (
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

                    {/* Canvas Alignment */}
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Align to Canvas</label>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <button
                          onClick={() => {
                            if (!selectedLayer) return;
                            updateSelectedLayer({ x: 0 });
                          }}
                          disabled={selectedLayer.locked}
                          className="py-1 px-2 border border-card-border hover:bg-card/25 rounded text-[10px] font-semibold text-foreground transition-all disabled:opacity-30 cursor-pointer"
                          title="Align Left"
                        >
                          Left
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedLayer) return;
                            updateSelectedLayer({
                              x: Math.round((canvasConfig.width - (selectedLayer.width || 100)) / 2)
                            });
                          }}
                          disabled={selectedLayer.locked}
                          className="py-1 px-2 border border-card-border hover:bg-card/25 rounded text-[10px] font-semibold text-foreground transition-all disabled:opacity-30 cursor-pointer"
                          title="Align Horizontal Center"
                        >
                          Center
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedLayer) return;
                            updateSelectedLayer({
                              x: Math.round(canvasConfig.width - (selectedLayer.width || 100))
                            });
                          }}
                          disabled={selectedLayer.locked}
                          className="py-1 px-2 border border-card-border hover:bg-card/25 rounded text-[10px] font-semibold text-foreground transition-all disabled:opacity-30 cursor-pointer"
                          title="Align Right"
                        >
                          Right
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedLayer) return;
                            updateSelectedLayer({ y: 0 });
                          }}
                          disabled={selectedLayer.locked}
                          className="py-1 px-2 border border-card-border hover:bg-card/25 rounded text-[10px] font-semibold text-foreground transition-all disabled:opacity-30 cursor-pointer"
                          title="Align Top"
                        >
                          Top
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedLayer) return;
                            updateSelectedLayer({
                              y: Math.round((canvasConfig.height - (selectedLayer.height || 100)) / 2)
                            });
                          }}
                          disabled={selectedLayer.locked}
                          className="py-1 px-2 border border-card-border hover:bg-card/25 rounded text-[10px] font-semibold text-foreground transition-all disabled:opacity-30 cursor-pointer"
                          title="Align Vertical Center"
                        >
                          Middle
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedLayer) return;
                            updateSelectedLayer({
                              y: Math.round(canvasConfig.height - (selectedLayer.height || 100))
                            });
                          }}
                          disabled={selectedLayer.locked}
                          className="py-1 px-2 border border-card-border hover:bg-card/25 rounded text-[10px] font-semibold text-foreground transition-all disabled:opacity-30 cursor-pointer"
                          title="Align Bottom"
                        >
                          Bottom
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-card-border" />

                  {/* 1b. Element-specific options */}
                  {['polygon', 'star', 'wave', 'chakra', 'pattern', 'progress_bar', 'rating', 'angled_block', 'qr_code', 'icon', 'checklist', 'ribbon', 'badge', 'speech_bubble'].includes(selectedLayer.type) && (
                    <>
                      <div className="space-y-3">
                        <h4 className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Element Options</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedLayer.type === 'polygon' && (
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Sides</label>
                              <input type="number" min="3" value={selectedLayer.sides || 3} onChange={(e) => updateSelectedLayer({ sides: Math.max(3, Number(e.target.value)) })} className={fieldCls} /></div>
                          )}
                          {selectedLayer.type === 'star' && (<>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Points</label>
                              <input type="number" min="3" value={selectedLayer.numPoints || 5} onChange={(e) => updateSelectedLayer({ numPoints: Math.max(3, Number(e.target.value)) })} className={fieldCls} /></div>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Inner Ratio</label>
                              <input type="number" step="0.05" min="0.1" max="0.9" value={selectedLayer.innerRadiusRatio || 0.4} onChange={(e) => updateSelectedLayer({ innerRadiusRatio: Number(e.target.value) })} className={fieldCls} /></div>
                          </>)}
                          {selectedLayer.type === 'wave' && (
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Wave Count</label>
                              <input type="number" min="1" value={selectedLayer.count || 2} onChange={(e) => updateSelectedLayer({ count: Math.max(1, Number(e.target.value)) })} className={fieldCls} /></div>
                          )}
                          {selectedLayer.type === 'chakra' && (
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Spokes</label>
                              <input type="number" min="4" value={selectedLayer.spokes || 24} onChange={(e) => updateSelectedLayer({ spokes: Math.max(4, Number(e.target.value)) })} className={fieldCls} /></div>
                          )}
                          {selectedLayer.type === 'pattern' && (<>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Pattern</label>
                              <select value={selectedLayer.variant || 'dots'} onChange={(e) => updateSelectedLayer({ variant: e.target.value })} className={fieldCls}>
                                <option value="dots">Dots</option><option value="grid">Grid</option><option value="stripes">Stripes</option></select></div>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Spacing</label>
                              <input type="number" min="8" value={selectedLayer.gap || 32} onChange={(e) => updateSelectedLayer({ gap: Math.max(8, Number(e.target.value)) })} className={fieldCls} /></div>
                          </>)}
                          {selectedLayer.type === 'progress_bar' && (
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Value %</label>
                              <input type="number" min="0" max="100" value={selectedLayer.value ?? 70} onChange={(e) => updateSelectedLayer({ value: Number(e.target.value) })} className={fieldCls} /></div>
                          )}
                          {selectedLayer.type === 'rating' && (<>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Filled</label>
                              <input type="number" min="0" value={selectedLayer.value ?? 5} onChange={(e) => updateSelectedLayer({ value: Number(e.target.value) })} className={fieldCls} /></div>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Out of</label>
                              <input type="number" min="1" value={selectedLayer.max || 5} onChange={(e) => updateSelectedLayer({ max: Math.max(1, Number(e.target.value)) })} className={fieldCls} /></div>
                          </>)}
                          {selectedLayer.type === 'angled_block' && (<>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Direction</label>
                              <select value={selectedLayer.direction || 'right'} onChange={(e) => updateSelectedLayer({ direction: e.target.value })} className={fieldCls}>
                                <option value="right">Right</option><option value="left">Left</option><option value="top">Top</option><option value="bottom">Bottom</option></select></div>
                            <div><label className="text-[10px] text-muted-foreground block mb-1">Skew</label>
                              <input type="number" step="0.02" min="0" max="0.5" value={selectedLayer.skew ?? 0.18} onChange={(e) => updateSelectedLayer({ skew: Number(e.target.value) })} className={fieldCls} /></div>
                          </>)}
                          {selectedLayer.type === 'icon' && (
                            <div className="col-span-2"><label className="text-[10px] text-muted-foreground block mb-1">Icon</label>
                              <select value={selectedLayer.icon || 'star'} onChange={(e) => updateSelectedLayer({ icon: e.target.value })} className={fieldCls}>
                                {Object.keys(ICON_LIBRARY).map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                          )}
                        </div>
                        {selectedLayer.type === 'qr_code' && (
                          <div><label className="text-[10px] text-muted-foreground block mb-1">QR Link / Text</label>
                            <input type="text" value={selectedLayer.value || ''} onChange={(e) => updateSelectedLayer({ value: e.target.value })} placeholder="https://…" className={fieldCls} /></div>
                        )}
                        {(selectedLayer.type === 'ribbon' || selectedLayer.type === 'badge' || selectedLayer.type === 'speech_bubble') && (
                          <div><label className="text-[10px] text-muted-foreground block mb-1">Text</label>
                            <input type="text" value={selectedLayer.text || ''} onChange={(e) => updateSelectedLayer({ text: e.target.value })} className={fieldCls} /></div>
                        )}
                        {selectedLayer.type === 'checklist' && (
                          <div><label className="text-[10px] text-muted-foreground block mb-1">Items (one per line)</label>
                            <textarea rows="4" value={(selectedLayer.items || []).join('\n')} onChange={(e) => updateSelectedLayer({ items: e.target.value.split('\n') })} className={`${fieldCls} resize-none`} /></div>
                        )}
                      </div>
                      <div className="h-[1px] bg-card-border" />
                    </>
                  )}

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
                            {customFonts.length > 0 && (
                              <optgroup label="Custom">
                                {customFonts.map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Google Fonts">
                              {GOOGLE_FONTS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      {/* Custom font upload */}
                      <div>
                        <button
                          onClick={() => fontInputRef.current?.click()}
                          disabled={selectedLayer.locked}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-card-border hover:bg-card/25 disabled:opacity-50 rounded text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all"
                          title="Upload a .ttf, .otf, .woff or .woff2 font"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Upload Custom Font</span>
                        </button>
                        <input
                          ref={fontInputRef}
                          type="file"
                          accept=".ttf,.otf,.woff,.woff2,font/*"
                          onChange={handleFontFileChange}
                          className="hidden"
                        />
                      </div>

                      {/* Line spacing */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-muted-foreground">Line Spacing</label>
                          <span className="text-[10px] font-mono text-muted-foreground">{(selectedLayer.lineHeight ?? 1.2).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="3"
                          step="0.05"
                          value={selectedLayer.lineHeight ?? 1.2}
                          onChange={(e) => updateSelectedLayer({ lineHeight: Number(e.target.value) })}
                          disabled={selectedLayer.locked}
                          className="w-full accent-primary bg-card-border h-1 rounded"
                        />
                      </div>

                      {/* Character (letter) spacing */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-muted-foreground">Character Spacing</label>
                          <span className="text-[10px] font-mono text-muted-foreground">{(selectedLayer.letterSpacing ?? 0)}px</span>
                        </div>
                        <input
                          type="range"
                          min="-5"
                          max="40"
                          step="0.5"
                          value={selectedLayer.letterSpacing ?? 0}
                          onChange={(e) => updateSelectedLayer({ letterSpacing: Number(e.target.value) })}
                          disabled={selectedLayer.locked}
                          className="w-full accent-primary bg-card-border h-1 rounded"
                        />
                      </div>

                      {/* Auto-fit bounding box to text */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLayer.autoFit !== false}
                            onChange={(e) => updateSelectedLayer({ autoFit: e.target.checked })}
                            disabled={selectedLayer.locked}
                            className="accent-primary"
                          />
                          <span>Fit box to text</span>
                        </label>
                        <button
                          onClick={() => updateSelectedLayer({ autoFit: true })}
                          disabled={selectedLayer.locked}
                          className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                        >
                          Fit now
                        </button>
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

                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-1">Frame Shape</label>
                              <select
                                value={selectedLayer.frame || 'rounded'}
                                onChange={(e) => updateSelectedLayer({ frame: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary text-foreground bg-transparent"
                              >
                                <option value="rounded">Rounded Rectangle</option>
                                <option value="circle">Circle / Oval</option>
                                <option value="arch">Arch (rounded top)</option>
                                <option value="diagonal">Diagonal Cut</option>
                                <option value="hexagon">Hexagon</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-1">Photo Filter</label>
                              <select
                                value={selectedLayer.filter || ''}
                                onChange={(e) => updateSelectedLayer({ filter: e.target.value || null })}
                                className="w-full px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary text-foreground bg-transparent"
                              >
                                <option value="">None</option>
                                <option value="grayscale">Grayscale</option>
                                <option value="sepia">Sepia</option>
                                <option value="blur">Blur</option>
                                <option value="brighten">Brighten</option>
                                <option value="contrast">Contrast</option>
                                <option value="invert">Invert</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-card-border p-6 rounded-lg text-center bg-card/15 space-y-4">
                            <div>
                              <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2 animate-bounce" />
                              <button
                                onClick={() => fileInputRef.current.click()}
                                className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold transition-all shadow"
                              >
                                Upload Custom Photo
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-px bg-card-border" />
                              <span className="text-[10px] uppercase text-muted-foreground">or</span>
                              <div className="flex-1 h-px bg-card-border" />
                            </div>

                            <div className="space-y-2 text-left">
                              <label className="text-[10px] text-muted-foreground block">Paste image URL</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={imageUrlInput}
                                  onChange={(e) => setImageUrlInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && applyImageUrl()}
                                  placeholder="https://…/photo.jpg"
                                  className="flex-1 min-w-0 px-2.5 py-1.5 bg-card/25 border border-card-border rounded text-xs focus:outline-none focus:border-primary text-foreground bg-transparent"
                                />
                                <button
                                  onClick={applyImageUrl}
                                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold transition-all shadow whitespace-nowrap"
                                >
                                  Add
                                </button>
                              </div>
                              <p className="text-[10px] text-muted-foreground/70 leading-snug">
                                Paste a direct image link (ending in .jpg/.png/etc). It's fetched through the server so it displays and exports correctly.
                              </p>
                            </div>
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
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded text-xs font-semibold transition-all ${selectedLayer.locked
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
          )}
        </aside>

      </div>

      {/* Notifications (this standalone route is outside DashboardLayout) */}
      <ToastContainer />
    </div>
  );
};
export default PosterEditor;
