import { create } from 'zustand';
import { CanvasElement, CanvasTool, ShapeType } from '../types';

interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  currentTool: CanvasTool;
  zoom: number;
  pan: { x: number; y: number };
  gridMode: 'dots' | 'grid' | 'plain' | 'dark';

  // Active styling properties
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  roughness: number;

  // History & Clipboard
  past: CanvasElement[][];
  future: CanvasElement[][];
  clipboard: CanvasElement[];

  // Actions
  setElements: (elements: CanvasElement[], skipHistory?: boolean) => void;
  addElement: (element: CanvasElement, selectIt?: boolean) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElementsBatch: (updates: { id: string; changes: Partial<CanvasElement> }[]) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => string[];
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentTool: (tool: CanvasTool) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setGridMode: (mode: 'dots' | 'grid' | 'plain' | 'dark') => void;

  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  eraserMode: 'area' | 'object';
  eraserRadius: number;
  setEraserMode: (mode: 'area' | 'object') => void;
  setEraserRadius: (radius: number) => void;
  replaceElements: (
    toDeleteIds: string[],
    toAdd: CanvasElement[],
    toUpdate: CanvasElement[],
  ) => void;

  // Undo / Redo
  pushHistory: () => void;
  pushSnapshot: (snapshot: CanvasElement[]) => void;
  undo: () => CanvasElement[] | null;
  redo: () => CanvasElement[] | null;

  // Clipboard
  copy: () => void;
  paste: (offset?: { x: number; y: number }) => CanvasElement[];
  duplicateSelected: () => CanvasElement[];

  // Layer ordering
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  toggleLockSelected: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedIds: [],
  currentTool: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridMode: 'dots',

  strokeColor: '#2D6A4F',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  fontFamily: 'Inter',
  roughness: 0,
  eraserMode: 'area',
  eraserRadius: 16,

  past: [],
  future: [],
  clipboard: [],

  setElements: (elements, skipHistory = false) => {
    if (!skipHistory) {
      const current = get().elements;
      set((state) => ({
        elements,
        past: [...state.past.slice(-30), current],
        future: [],
      }));
    } else {
      set({ elements });
    }
  },

  addElement: (element, selectIt = false) => {
    const current = get().elements;
    set((state) => ({
      elements: [...state.elements, element],
      selectedIds: selectIt ? [element.id] : [],
      past: [...state.past.slice(-30), current],
      future: [],
    }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            ...updates,
            data: updates.data ? { ...el.data, ...updates.data } : el.data,
          };
        }
        return el;
      }),
    }));
  },

  updateElementsBatch: (updates) => {
    const updateMap = new Map(updates.map((u) => [u.id, u.changes]));
    set((state) => ({
      elements: state.elements.map((el) => {
        const changes = updateMap.get(el.id);
        if (changes) {
          return {
            ...el,
            ...changes,
            data: changes.data ? { ...el.data, ...changes.data } : el.data,
          };
        }
        return el;
      }),
    }));
  },

  deleteElement: (id) => {
    const current = get().elements;
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedIds: state.selectedIds.filter((selId) => selId !== id),
      past: [...state.past.slice(-30), current],
      future: [],
    }));
  },

  deleteSelected: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0) return [];
    set((state) => ({
      elements: state.elements.filter((el) => !selectedIds.includes(el.id)),
      selectedIds: [],
      past: [...state.past.slice(-30), elements],
      future: [],
    }));
    return selectedIds;
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  setCurrentTool: (tool) =>
    set({
      currentTool: tool,
      ...(tool !== 'select' ? { selectedIds: [] } : {}),
    }),

  setZoom: (zoom) =>
    set((state) => ({
      zoom: Math.min(Math.max(typeof zoom === 'function' ? zoom(state.zoom) : zoom, 0.1), 5),
    })),

  setPan: (pan) =>
    set((state) => ({
      pan: typeof pan === 'function' ? pan(state.pan) : pan,
    })),

  setGridMode: (gridMode) => set({ gridMode }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setOpacity: (opacity) => set({ opacity }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setEraserMode: (eraserMode) => set({ eraserMode }),
  setEraserRadius: (eraserRadius) => set({ eraserRadius }),
  replaceElements: (toDeleteIds, toAdd, toUpdate) => {
    const current = get().elements;
    const updateMap = new Map(toUpdate.map((u) => [u.id, u]));
    const deleteSet = new Set(toDeleteIds);

    const updated = current
      .filter((el) => !deleteSet.has(el.id))
      .map((el) => updateMap.get(el.id) || el);

    set({
      elements: [...updated, ...toAdd],
    });
  },

  pushHistory: () => {
    const current = get().elements;
    set((state) => ({
      past: [...state.past.slice(-30), current],
      future: [],
    }));
  },

  pushSnapshot: (snapshot) => {
    set((state) => ({
      past: [...state.past.slice(-30), snapshot],
      future: [],
    }));
  },

  undo: () => {
    const { past, elements, future } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      elements: previous,
      past: newPast,
      future: [elements, ...future],
      selectedIds: [],
    });

    return previous;
  },

  redo: () => {
    const { past, elements, future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      elements: next,
      past: [...past, elements],
      future: newFuture,
      selectedIds: [],
    });

    return next;
  },

  copy: () => {
    const { elements, selectedIds } = get();
    const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
    set({ clipboard: selectedElements });
  },

  paste: (offset = { x: 30, y: 30 }) => {
    const { clipboard, elements } = get();
    if (clipboard.length === 0) return [];

    const newElements: CanvasElement[] = clipboard.map((el) => ({
      ...el,
      id: crypto.randomUUID(),
      positionX: el.positionX + offset.x,
      positionY: el.positionY + offset.y,
      zIndex: elements.length + 1,
    }));

    set((state) => ({
      elements: [...state.elements, ...newElements],
      selectedIds: newElements.map((el) => el.id),
      past: [...state.past.slice(-30), elements],
      future: [],
    }));

    return newElements;
  },

  duplicateSelected: () => {
    const { elements, selectedIds } = get();
    const toDuplicate = elements.filter((el) => selectedIds.includes(el.id));
    if (toDuplicate.length === 0) return [];

    const duplicated: CanvasElement[] = toDuplicate.map((el) => ({
      ...el,
      id: crypto.randomUUID(),
      positionX: el.positionX + 25,
      positionY: el.positionY + 25,
      zIndex: elements.length + 1,
    }));

    set((state) => ({
      elements: [...state.elements, ...duplicated],
      selectedIds: duplicated.map((el) => el.id),
      past: [...state.past.slice(-30), elements],
      future: [],
    }));

    return duplicated;
  },

  bringForward: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0) return;

    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        return { ...el, zIndex: el.zIndex + 1 };
      }
      return el;
    });

    set({ elements: updated.sort((a, b) => a.zIndex - b.zIndex) });
  },

  sendBackward: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0) return;

    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        return { ...el, zIndex: Math.max(0, el.zIndex - 1) };
      }
      return el;
    });

    set({ elements: updated.sort((a, b) => a.zIndex - b.zIndex) });
  },

  bringToFront: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0) return;

    const maxZ = Math.max(...elements.map((e) => e.zIndex), 0);
    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        return { ...el, zIndex: maxZ + 1 };
      }
      return el;
    });

    set({ elements: updated.sort((a, b) => a.zIndex - b.zIndex) });
  },

  sendToBack: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0) return;

    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        return { ...el, zIndex: 0 };
      }
      return { ...el, zIndex: el.zIndex + 1 };
    });

    set({ elements: updated.sort((a, b) => a.zIndex - b.zIndex) });
  },

  toggleLockSelected: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0) return;

    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        const isLocked = !!el.data?.isLocked;
        return {
          ...el,
          data: {
            ...el.data,
            isLocked: !isLocked,
          },
        };
      }
      return el;
    });

    set({ elements: updated });
  },
}));
